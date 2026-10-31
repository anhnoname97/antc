using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Controllers.Document;
using Umbraco.Cms.Api.Management.Factories;
using Umbraco.Cms.Api.Management.Patchers;
using Umbraco.Cms.Api.Management.ViewModels.Document;
using Umbraco.Cms.Api.Management.ViewModels.Patching;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership.Permissions;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Plugin.Custom.Core.Articles;

namespace Antc.Infrastructure;

/// <summary>Protects article fields on Management API writes; document authorization stays native.</summary>
public sealed class ArticlePropertyPermissionsFilter(IContentService contents, IContentTypeService types,
    IBackOfficeSecurityAccessor security, IDocumentEditingPresentationFactory factory, IDocumentPatcher patcher, IOptionsMonitor<JsonOptions> json) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.Controller is not DocumentControllerBase) { await next(); return; }
        var create = context.ActionArguments.Values.OfType<CreateDocumentRequestModel>().FirstOrDefault();
        var update = context.ActionArguments.Values.OfType<UpdateDocumentRequestModel>().FirstOrDefault();
        var patch = context.ActionArguments.Values.OfType<PatchDocumentRequestModel>().FirstOrDefault();
        if (create is null && update is null && patch is null) { await next(); return; }
        IContent? content = context.ActionArguments.TryGetValue("id", out var value) && value is Guid id ? contents.GetById(id) : null;
        var type = create is not null ? types.Get(create.DocumentType.Id) : content is not null ? types.Get(content.ContentType.Key) : null;
        if (type?.Alias != "article") { await next(); return; }
        var user = security.BackOfficeSecurity?.CurrentUser;
        if (user is null) { context.Result = new UnauthorizedResult(); return; }
        var groups = user.Groups.ToArray();
        var fallback = groups.SelectMany(group => group.Permissions).ToHashSet();
        var granular = groups.SelectMany(group => group.GranularPermissions).OfType<DocumentPropertyValueGranularPermission>().ToArray();
        var restricted = type.CompositionPropertyTypes
            .Where(property => !ArticlePropertyPermissions.CanWrite(property.Key, fallback, granular))
            .Select(property => property.Alias).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (restricted.Count == 0) { await next(); return; }
        if (patch is not null && content is not null)
        {
            // The native patcher only constructs a DTO; it does not persist anything.
            var applied = await patcher.ApplyPatchAsync(content.Key, factory.MapPatchModel(patch));
            if (!applied.Success) { await next(); return; }
            update = applied.Result;
        }
        var before = content is not null ? (await factory.CreateUpdateRequestModelAsync(content)).Values : [];
        var after = create?.Values ?? update?.Values ?? [];
        if (ArticlePropertyPermissions.Changed(before, after, restricted, json.Get(Umbraco.Cms.Core.Constants.JsonOptionsNames.BackOffice).JsonSerializerOptions))
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Không có quyền sửa trường của bài viết.",
                Detail = "Một số trường chỉ được xem hoặc đã bị khóa theo nhóm quyền. Giá trị đã lưu được giữ nguyên.",
            }) { StatusCode = StatusCodes.Status403Forbidden };
            return;
        }
        await next();
    }
}
