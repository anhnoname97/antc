using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("api/v1/admin/contest")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
public sealed class ContestAdminController(IContestAdminService service) : ControllerBase
{
    [HttpGet("campaigns")]
    public async Task<ActionResult<PagedResult<ContestCampaignAdminDto>>> Campaigns(
        [FromQuery] string? search, [FromQuery] bool? isActive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await service.SearchCampaignsAsync(search, isActive, page, pageSize, ct));

    [HttpGet("campaigns/question-tree")]
    public async Task<ActionResult<IReadOnlyList<ContestTopicTreeItemDto>>> QuestionTree(
        [FromQuery] long? contestId, CancellationToken ct) =>
        Ok(await service.GetQuestionTreeAsync(contestId, ct));

    [HttpGet("campaigns/{id:long}")]
    public async Task<ActionResult<ContestCampaignAdminDto>> Campaign(long id, CancellationToken ct) =>
        await service.GetCampaignAsync(id, ct) is { } item
            ? Ok(item) : NotFound(Error("CONTEST_NOT_FOUND", "Không tìm thấy cuộc thi."));

    [HttpPost("campaigns")]
    public async Task<ActionResult<ContestCampaignAdminDto>> CreateCampaign(
        [FromBody] SaveContestCampaignRequest request, CancellationToken ct)
    {
        try
        {
            ContestCampaignAdminDto item = await service.CreateCampaignAsync(request, ct);
            return CreatedAtAction(nameof(Campaign), new { id = item.Id }, item);
        }
        catch (ContestAdminValidationException ex) { return BadRequest(Error("VALIDATION", ex.Message, ex.Fields)); }
        catch (ContestAdminConflictException ex) { return Conflict(Error(ex.Code, ex.Message)); }
    }

    [HttpPut("campaigns/{id:long}")]
    public async Task<ActionResult<ContestCampaignAdminDto>> UpdateCampaign(
        long id, [FromBody] SaveContestCampaignRequest request, CancellationToken ct)
    {
        try
        {
            return await service.UpdateCampaignAsync(id, request, ct) is { } item
                ? Ok(item) : NotFound(Error("CONTEST_NOT_FOUND", "Không tìm thấy cuộc thi."));
        }
        catch (ContestAdminValidationException ex) { return BadRequest(Error("VALIDATION", ex.Message, ex.Fields)); }
        catch (ContestAdminConflictException ex) { return Conflict(Error(ex.Code, ex.Message)); }
    }

    [HttpDelete("campaigns/{id:long}")]
    public async Task<IActionResult> DeleteCampaign(long id, CancellationToken ct)
    {
        try { return await service.DeleteCampaignAsync(id, ct) ? NoContent() : NotFound(); }
        catch (ContestAdminConflictException ex) { return Conflict(Error(ex.Code, ex.Message)); }
    }

    [HttpGet("entries")]
    public async Task<ActionResult<PagedResult<ContestEntryAdminDto>>> Entries(
        [FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? mode,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await service.SearchEntriesAsync(search, status, mode, page, pageSize, ct));

    [HttpGet("entries/{id:long}")]
    public async Task<ActionResult<ContestEntryAdminDto>> Entry(long id, CancellationToken ct) =>
        await service.GetEntryAsync(id, ct) is { } item
            ? Ok(item) : NotFound(Error("ENTRY_NOT_FOUND", "Không tìm thấy lượt thi."));

    [HttpGet("draws")]
    public async Task<ActionResult<PagedResult<DrawAdminDto>>> Draws(
        [FromQuery] string? search, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await service.SearchDrawsAsync(search, page, pageSize, ct));

    [HttpGet("draws/{id:long}")]
    public async Task<ActionResult<DrawAdminDto>> Draw(long id, CancellationToken ct) =>
        await service.GetDrawAsync(id, ct) is { } item
            ? Ok(item) : NotFound(Error("DRAW_NOT_FOUND", "Không tìm thấy lần quay."));

    [HttpPost("draws")]
    public async Task<ActionResult<DrawAdminDto>> CreateDraw([FromBody] SaveDrawRequest request, CancellationToken ct)
    {
        try
        {
            DrawAdminDto item = await service.CreateDrawAsync(request, Actor(), ct);
            return CreatedAtAction(nameof(Draw), new { id = item.Id }, item);
        }
        catch (ContestAdminValidationException ex) { return BadRequest(Error("VALIDATION", ex.Message, ex.Fields)); }
    }

    [HttpPut("draws/{id:long}")]
    public async Task<ActionResult<DrawAdminDto>> UpdateDraw(long id, [FromBody] SaveDrawRequest request, CancellationToken ct)
    {
        try
        {
            return await service.UpdateDrawAsync(id, request, ct) is { } item
                ? Ok(item) : NotFound(Error("DRAW_NOT_FOUND", "Không tìm thấy lần quay."));
        }
        catch (ContestAdminValidationException ex) { return BadRequest(Error("VALIDATION", ex.Message, ex.Fields)); }
    }

    [HttpDelete("draws/{id:long}")]
    public async Task<IActionResult> DeleteDraw(long id, CancellationToken ct) =>
        await service.DeleteDrawAsync(id, ct) ? NoContent() : NotFound();

    private string Actor() => User.Identity?.Name ?? "backoffice";
    private static ApiErrorResponse Error(string code, string message, IReadOnlyDictionary<string, string>? fields = null) =>
        new(new ApiError(code, message, fields ?? new Dictionary<string, string>()));
}
