using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Security.Authorization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("umbraco/management/api/v1/antc/risks")]
[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
[Authorize(Policy = AuthorizationPolicies.SectionAccessContent)]
public sealed class RiskBackofficeController(IContentTypeService types, IAuthorizationHelper authorization,
    IContentPermissionAuthorizer permissions, RuiRoDerivation derivation, RiskContentCache cache, TimeProvider clock,
    Umbraco.Plugin.Custom.Core.Quiz.IQuestionBank bank) : ControllerBase
{
    private static readonly HashSet<string> CatalogFields = ["title", "primaryGroup", "alsoInCategories", "articleKind", "topic",
        "isFeatured", "reviewDate", "updatedDate", "cautionLevel", "popularity", "channels", "tactics", "containingArticle", "isActive", "code"];

    [HttpGet("types")]
    public IActionResult Types() => Ok(RiskContentSource.Aliases.Distinct().Select(a => types.Get(a))
        .OfType<IContentType>().ToDictionary(t => t.Alias, t => t.Key));

    [HttpGet("catalog")]
    public async Task<IActionResult> Catalog([FromQuery] string? type = null, [FromQuery] Guid? parent = null)
    {
        Response.Headers.CacheControl = "no-store";
        var nodes = await ReadAllowed();
        if (nodes is null) return Forbid();
        string[]? requestedTypes = type?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var filtered = nodes.Where(x => (requestedTypes is null || requestedTypes.Contains(x.Type)) && (parent is null || x.ParentKey == parent)).ToArray();
        authorization.TryGetUmbracoUser(User, out var user);
        var deletable = await permissions.FilterAuthorizedAsync(user!, filtered.Select(x => x.Key), new HashSet<string> { ActionDelete.ActionLetter });
        DateTime today = AlertFreshness.Today(clock);
        return Ok(filtered.Select(x => new
        {
            x.Key, x.ParentKey, x.Type, x.Name, x.Order, x.Updated, x.Published, x.ContentTypeKey,
            Values = x.Values.Where(p => CatalogFields.Contains(p.Key)).ToDictionary(p => p.Key, p => p.Value),
            FreshDaysLeft = x.Type == "alertPage" && DateTime.TryParse(x.Text("updatedDate"), out var date)
                ? AlertFreshness.FreshDaysLeft(date, today) : null,
            CanDelete = deletable.Contains(x.Key)
        }).ToArray());
    }

    [HttpPost("{id:guid}/derive")]
    public async Task<IActionResult> Derive(Guid id, [FromBody] Dictionary<string, object?> draft)
    {
        Response.Headers.CacheControl = "no-store";
        var nodes = await ReadAllowed();
        if (nodes?.FirstOrDefault(x => x.Key == id) is not { } current) return NotFound();
        // Native document endpoints own all saves and publishing permissions.
        var merged = current.Values.ToDictionary(x => x.Key, x => x.Value);
        foreach (var p in draft.Where(p => current.Values.ContainsKey(p.Key))) merged[p.Key] = p.Value;
        var edited = current with { Values = merged };
        var previewNodes = nodes.Select(x => x.Key == id ? edited : x).ToArray();
        var result = derivation.Derive(edited, previewNodes);
        if (edited.IsKind("docChuyenDe") && int.TryParse(result.Topic?.Text("topicNumber"), out int number)
            && bank.Current.QuestionsByTopic.TryGetValue(number, out var questions)) result = derivation.Derive(edited, previewNodes, questions.Count);
        // Body text is needed to count words, but is not returned to the editor.
        RiskNode Trim(RiskNode n) => n with { Values = n.Values.Where(p => CatalogFields.Contains(p.Key)).ToDictionary(p => p.Key, p => p.Value) };
        return Ok(result with
        {
            FreshDaysLeft = edited.Type == "alertPage" && DateTime.TryParse(edited.Text("updatedDate"), out var updated)
                ? AlertFreshness.FreshDaysLeft(updated, AlertFreshness.Today(clock)) : null,
            AutoUnpublishDaysLeft = edited.Type == "alertPage" && DateTime.TryParse(edited.Text("updatedDate"), out var date)
                ? Math.Max(0, AlertFreshness.UnpublishDays(int.TryParse(edited.Text("autoUnpublishDays"), out var ttl) ? ttl : 180) - AlertFreshness.Age(date, AlertFreshness.Today(clock))) : null,
            Articles = result.Articles.Select(Trim).ToArray(), Tactics = result.Tactics.Select(Trim).ToArray(),
            Alerts = result.Alerts.Select(Trim).ToArray(), Actions = result.Actions.Select(Trim).ToArray(),
            Related = result.Related.Select(Trim).ToArray(), Channels = result.Channels.Select(Trim).ToArray(),
            Audiences = result.Audiences.Select(Trim).ToArray(), Topic = result.Topic is null ? null : Trim(result.Topic),
            Checklist = result.Checklist is null ? null : Trim(result.Checklist), Next = result.Next is null ? null : Trim(result.Next)
        });
    }

    private async Task<IReadOnlyList<RiskNode>?> ReadAllowed()
    {
        if (!authorization.TryGetUmbracoUser(User, out var user) || !user.IsApproved || user.IsLockedOut) return null;
        var rows = cache.Get(published: false);
        // Permissions are evaluated on every request, never stored in the shared cache.
        var allowed = await permissions.FilterAuthorizedAsync(user, rows.Select(x => x.Key), new HashSet<string> { ActionBrowse.ActionLetter });
        return rows.Where(x => allowed.Contains(x.Key)).ToArray();
    }
}
