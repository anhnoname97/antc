using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Security.Authorization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("umbraco/management/api/v1/antc/risks")]
[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
[Authorize(Policy = AuthorizationPolicies.SectionAccessContent)]
public sealed class RiskBackofficeController(IContentService contents, IContentTypeService types,
    IAuthorizationHelper authorization, IContentPermissionAuthorizer permissions, RuiRoDerivation derivation,
    Umbraco.Plugin.Custom.Core.Quiz.IQuestionBank bank) : ControllerBase
{
    private static readonly string[] Aliases = [.. RiskSchema.EditableAliases, "channelItem", "audienceItem", "stopSignItem", "popularityItem",
        "viecCanLamPage", "checklistPage", "toolCountPage", "toolBranchPage", "articleFolder", "alertFolder", "tacticFolder", "sharedSnippet", "siteSettings"];

    [HttpGet("types")]
    public IActionResult Types() => Ok(Aliases.Distinct().Select(a => types.Get(a)).OfType<IContentType>().ToDictionary(t => t.Alias, t => t.Key));

    [HttpGet("catalog")]
    public async Task<IActionResult> Catalog()
    {
        Response.Headers.CacheControl = "no-store";
        var nodes = await ReadAllowed();
        return nodes is null ? Forbid() : Ok(nodes);
    }

    [HttpPost("{id:guid}/derive")]
    public async Task<IActionResult> Derive(Guid id, [FromBody] Dictionary<string, object?> draft)
    {
        Response.Headers.CacheControl = "no-store";
        var nodes = await ReadAllowed();
        if (nodes?.FirstOrDefault(x => x.Key == id) is not { } current) return NotFound();
        // This only computes a preview. Native document endpoints own all saves and publishing permissions.
        var merged = current.Values.ToDictionary(x => x.Key, x => x.Value);
        foreach (var p in draft.Where(p => current.Values.ContainsKey(p.Key))) merged[p.Key] = p.Value;
        var edited = current with { Values = merged };
        var previewNodes = nodes.Select(x => x.Key == id ? edited : x).ToArray();
        var result = derivation.Derive(edited, previewNodes);
        if (edited.IsKind("docChuyenDe") && int.TryParse(result.Topic?.Text("topicNumber"), out int number)
            && bank.Current.QuestionsByTopic.TryGetValue(number, out var questions)) result = derivation.Derive(edited, previewNodes, questions.Count);
        return Ok(result);
    }

    private async Task<IReadOnlyList<RiskNode>?> ReadAllowed()
    {
        if (!authorization.TryGetUmbracoUser(User, out var user) || !user.IsApproved || user.IsLockedOut) return null;
        var rows = new List<IContent>();
        foreach (var alias in Aliases.Distinct())
            if (types.Get(alias) is { } type)
                for (int page = 0; ; page++)
                {
                    var batch = contents.GetPagedOfType(type.Id, page, 200, out long total, null).Where(x => !x.Trashed).ToArray();
                    rows.AddRange(batch);
                    if ((page + 1) * 200 >= total) break;
                }
        var allowed = await permissions.FilterAuthorizedAsync(user, rows.Select(x => x.Key), new HashSet<string> { ActionBrowse.ActionLetter });
        var ids = rows.ToDictionary(x => x.Id, x => x.Key);
        return rows.Where(x => allowed.Contains(x.Key)).Select(x => new RiskNode(x.Key, ids.TryGetValue(x.ParentId, out var parent) ? parent : null,
            x.ContentType.Alias, x.Name ?? "", x.SortOrder, x.UpdateDate, x.Published,
            x.Properties.ToDictionary(p => p.Alias, p => p.GetValue())) { ContentTypeKey = x.ContentType.Key }).ToArray();
    }
}
