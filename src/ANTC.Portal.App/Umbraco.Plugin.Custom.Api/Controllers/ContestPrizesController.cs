using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("api/v1/admin/contest/prizes")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class ContestPrizesController(IContestAdminService service) : ControllerBase
{
    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (ContestAdminValidationException e) { return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", e.Message, e.Fields))); }
        catch (ContestAdminConflictException e) { return Conflict(new ApiErrorResponse(new ApiError(e.Code, e.Message))); }
    }
    private IActionResult Missing() => NotFound(new ApiErrorResponse(new ApiError("PRIZE_NOT_FOUND", "Không tìm thấy giải thưởng.")));
    [HttpGet]
    public Task<IActionResult> Search(string? search, bool? isActive, int page = 1, int pageSize = 50, CancellationToken ct = default) =>
        Execute(async () => Ok(await service.SearchPrizesAsync(search, isActive, page, pageSize, ct)));
    [HttpGet("{id:long}")]
    public Task<IActionResult> Get(long id, CancellationToken ct) => Execute(async () => await service.GetPrizeAsync(id, ct) is { } item ? Ok(item) : Missing());
    [HttpPost]
    public Task<IActionResult> Create([FromBody] SavePrizeRequest request, CancellationToken ct) => Execute(async () => Ok(await service.SavePrizeAsync(null, request, ct)));
    [HttpPut("{id:long}")]
    public Task<IActionResult> Update(long id, [FromBody] SavePrizeRequest request, CancellationToken ct) => Execute(async () => await service.SavePrizeAsync(id, request, ct) is { } item ? Ok(item) : Missing());
    [HttpDelete("{id:long}")]
    public Task<IActionResult> Delete(long id, CancellationToken ct) => Execute(async () => await service.DeletePrizeAsync(id, ct) ? NoContent() : Missing());
    [HttpPut("/api/v1/admin/contest/campaigns/{id:long}/prizes")]
    public Task<IActionResult> Configure(long id, [FromBody] SaveContestPrizesRequest request, CancellationToken ct) => Execute(async () =>
        await service.SaveContestPrizesAsync(id, request, ct) is { } item ? Ok(item) : NotFound(new ApiErrorResponse(new ApiError("CONTEST_NOT_FOUND", "Không tìm thấy cuộc thi."))));
}
