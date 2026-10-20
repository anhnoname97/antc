using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Security.Authorization;

namespace Umbraco.Plugin.Custom.Core.Administration;

public static class AdministrationAccess
{
    public const string Policy = "AntcAdministration";
    public const string GroupAlias = "quanTriCuocThi";
    public const string BackofficePolicy = "AntcContestReports";
    public const string QuestionsPolicy = "AntcQuestionsSection";
    public const string QuestionsSectionAlias = "Antc.Section.Questions";
    public const string QuestionsGroupAlias = "quanTriHoiDap";
}

public sealed class AdministrationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, AdministrationGroupInitializer>();
        builder.Services.Configure<AuthorizationOptions>(options => options.AddPolicy(AdministrationAccess.QuestionsPolicy,
            policy => policy.RequireAuthenticatedUser().AddRequirements(new QuestionsSectionRequirement())));
        builder.Services.AddSingleton<IAuthorizationHandler, QuestionsSectionAuthorizationHandler>();
        builder.Services.Configure<AuthorizationOptions>(options => options.AddPolicy(AdministrationAccess.Policy,
            policy => policy.AddAuthenticationSchemes(Constants.Security.BackOfficeAuthenticationType)
                .RequireAuthenticatedUser().AddRequirements(new ContestAdministrationRequirement())));
        builder.Services.AddSingleton<IAuthorizationHandler, ContestAdministrationAuthorizationHandler>();
        builder.Services.Configure<AuthorizationOptions>(options => options.AddPolicy(AdministrationAccess.BackofficePolicy,
            policy => policy.RequireAuthenticatedUser().AddRequirements(new ContestAdministrationRequirement())));
    }
}

public sealed class QuestionsSectionRequirement : IAuthorizationRequirement;

public sealed class ContestAdministrationRequirement : IAuthorizationRequirement;
public sealed class ContestAdministrationAuthorizationHandler(IAuthorizationHelper authorization)
    : AuthorizationHandler<ContestAdministrationRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, ContestAdministrationRequirement requirement)
    {
        if (authorization.TryGetUmbracoUser(context.User, out IUser? user)
            && user.IsApproved && !user.IsLockedOut
            && user.Groups.Any(g => g.Alias == AdministrationAccess.GroupAlias)) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

public sealed class QuestionsSectionAuthorizationHandler(IAuthorizationHelper authorization)
    : AuthorizationHandler<QuestionsSectionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, QuestionsSectionRequirement requirement)
    {
        if (authorization.TryGetUmbracoUser(context.User, out IUser? user)
            && user.AllowedSections.Contains(AdministrationAccess.QuestionsSectionAlias)) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

public sealed class AdministrationGroupInitializer(IUserGroupService groups, IShortStringHelper strings,
    ILogger<AdministrationGroupInitializer> logger) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        if (await groups.GetAsync(AdministrationAccess.GroupAlias) is null)
        {
            var contestGroup = new UserGroup(strings)
            {
                Key = new Guid("78255f31-fac3-4fd8-a762-aeb717a31c70"),
                Alias = AdministrationAccess.GroupAlias, Name = "Quản trị cuộc thi", Icon = "icon-trophy",
                Description = "Báo cáo, xuất dữ liệu và công bố kết quả trong section Quản lý cuộc thi. Quản trị viên gán thành viên."
            };
            var result = await groups.CreateAsync(contestGroup, Constants.Security.SuperUserKey);
            if (!result.Success) throw new InvalidOperationException("Không tạo được nhóm Quản trị cuộc thi: " + result.Status);
        }
        var reportingGroup = await groups.GetAsync(AdministrationAccess.GroupAlias);
        if (reportingGroup is not null && (!reportingGroup.AllowedSections.Contains(Backoffice.ContestManagementSectionAccessHandler.SectionAlias)
            || reportingGroup.Description == "Xem báo cáo và xuất dữ liệu cuộc thi tại /quan-tri. Quản trị viên gán thành viên."))
        {
            if (!reportingGroup.AllowedSections.Contains(Backoffice.ContestManagementSectionAccessHandler.SectionAlias))
                reportingGroup.AddAllowedSection(Backoffice.ContestManagementSectionAccessHandler.SectionAlias);
            if (reportingGroup.Description == "Xem báo cáo và xuất dữ liệu cuộc thi tại /quan-tri. Quản trị viên gán thành viên.")
                reportingGroup.Description = "Báo cáo, xuất dữ liệu và công bố kết quả trong section Quản lý cuộc thi. Quản trị viên gán thành viên.";
            var updated = await groups.UpdateAsync(reportingGroup, Constants.Security.SuperUserKey);
            if (!updated.Success) throw new InvalidOperationException("Không cấp được section Quản lý cuộc thi cho nhóm báo cáo.");
        }
        IUserGroup? group = await groups.GetAsync(AdministrationAccess.QuestionsGroupAlias);
        if (group is null)
        {
            group = new UserGroup(strings)
            {
                Key = new Guid("3e221e2d-550a-54aa-9b64-a6323b9d11ba"),
                Alias = AdministrationAccess.QuestionsGroupAlias, Name = "Quản trị Hỏi – Đáp", Icon = "icon-chat",
                Description = "Tiếp nhận, trả lời và duyệt công bố câu hỏi trong section Hỏi – Đáp. Quản trị viên gán thành viên."
            };
            group.AddAllowedSection(AdministrationAccess.QuestionsSectionAlias);
            var created = await groups.CreateAsync(group, Constants.Security.SuperUserKey);
            if (!created.Success) throw new InvalidOperationException("Không tạo được nhóm Hỏi – Đáp: " + created.Status);
        }
        // Giữ quyền nhóm đã dùng ở phiên bản trước; không thêm thành viên vào nhóm.
        foreach (string alias in new[] { AdministrationAccess.QuestionsGroupAlias, Constants.Security.AdminGroupAlias })
        {
            IUserGroup? existing = await groups.GetAsync(alias);
            if (existing is null || existing.AllowedSections.Contains(AdministrationAccess.QuestionsSectionAlias)) continue;
            existing.AddAllowedSection(AdministrationAccess.QuestionsSectionAlias);
            var updated = await groups.UpdateAsync(existing, Constants.Security.SuperUserKey);
            if (!updated.Success) throw new InvalidOperationException("Không cấp được section Hỏi – Đáp cho nhóm: " + alias);
            logger.LogInformation("Đã cấp section Hỏi – Đáp cho nhóm {GroupAlias}; giữ nguyên thành viên.", alias);
        }
    }
}
