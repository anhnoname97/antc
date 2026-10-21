using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Administration;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[VersionedApiBackOfficeRoute("antc/contest-privacy")]
[Authorize(Policy = AdministrationAccess.BackofficePolicy)]
public sealed class ContestPrivacyController(ContestPrivacyService privacy, IBackOfficeSecurityAccessor security) : ManagementApiControllerBase
{
    private async Task<IActionResult> Execute(Func<Guid, Task<object>> action)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await action(CurrentUserKey(security))); }
        catch (PrivacyException e) { return StatusCode(e.Status, new ApiErrorResponse(new ApiError(e.Code, e.Message))); }
    }
    // Selectors are POST bodies, never URL/query strings that reverse proxies or access logs may record.
    [HttpPost("preview")]
    public Task<IActionResult> Preview([FromBody] PrivacyLookup lookup, CancellationToken ct) => Execute(async actor => await privacy.PreviewAsync(lookup, actor, ct));
    [HttpPost("erase")]
    public Task<IActionResult> Erase([FromBody] PrivacyEraseRequest request, CancellationToken ct) => Execute(async actor => await privacy.ErasePersonAsync(request, actor, ct));
    [HttpPost("bulk")]
    public Task<IActionResult> Bulk([FromBody] PrivacyBulkRequest request, CancellationToken ct) => Execute(async actor => await privacy.EraseAllAsync(request, actor, ct));
    [HttpGet("operations")]
    public Task<IActionResult> Operations([FromServices] IUserService users, int page = 1, CancellationToken ct = default) => Execute(async _ =>
    {
        var history = await privacy.HistoryAsync(page, ct);
        var actors = (await users.GetAsync(history.Items.Select(o => o.ActorUserKey).Distinct())).ToDictionary(u => u.Key, u => u.Name);
        return history with { Items = history.Items.Select(o => o with { ActorName = actors.GetValueOrDefault(o.ActorUserKey) }).ToList() };
    });
    [HttpPost("operations/{id:guid}/vacuum")]
    public Task<IActionResult> Vacuum(Guid id, [FromBody] PrivacyBulkRequest confirmation, CancellationToken ct) => Execute(async actor =>
    {
        if (confirmation.Confirmation?.Trim() != ContestPrivacyService.BulkPhrase)
            throw new PrivacyException("PRIVACY_CONFIRMATION_REQUIRED", "Nhập đúng cụm xác nhận để chạy lại VACUUM.", 400);
        return await privacy.VacuumAsync(id, actor, true, ct);
    });
}
