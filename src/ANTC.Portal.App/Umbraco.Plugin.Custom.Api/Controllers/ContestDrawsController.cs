using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[VersionedApiBackOfficeRoute("antc/contest-draws")]
[Authorize(Policy = AdministrationAccess.BackofficePolicy)]
public sealed class ContestDrawsController(IContestAdminService service, ContestReportingService reports,
    ContestAuditService audit, IBackOfficeSecurityAccessor security) : ManagementApiControllerBase
{
    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        Response.Headers.CacheControl = "no-store";
        try { return await action(); }
        catch (ContestAdminValidationException e) { return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", e.Message, e.Fields))); }
        catch (ContestAdminConflictException e) { return Conflict(new ApiErrorResponse(new ApiError(e.Code, e.Message))); }
    }
    [HttpGet("options")]
    public async Task<IActionResult> Options(CancellationToken ct) => Ok(await reports.ContestsAsync(ct));
    [HttpGet("prizes")]
    public Task<IActionResult> Prizes(long contestId, CancellationToken ct) => Execute(async () => Ok(await service.ContestPrizesAsync(contestId, ct)));
    [HttpGet]
    public Task<IActionResult> History(string? search, int page = 1, int pageSize = 20, CancellationToken ct = default) =>
        Execute(async () => Ok(await service.SearchDrawsAsync(search, page, pageSize, ct)));
    [HttpGet("{id:long}")]
    public Task<IActionResult> Detail(long id, CancellationToken ct) => Execute(async () =>
        await service.GetDrawAsync(id, ct) is { } draw ? Ok(draw) : NotFound(Missing()));
    [HttpPost("preview")]
    public Task<IActionResult> Preview([FromBody] PreviewDrawRequest request, CancellationToken ct) =>
        Execute(async () => {
            var result = await service.PreviewDrawAsync(request, ct);
            await audit.RecordAsync(CurrentUserKey(security), "view.draw.candidates", request, null, ct);
            return Ok(result);
        });
    [HttpPost]
    public Task<IActionResult> Draw([FromBody] SaveDrawRequest request, CancellationToken ct) => Execute(async () =>
    {
        if (request.RequestId is null)
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["requestId"] = "Phải gửi mã yêu cầu để chống quay lặp khi thử lại." });
        Guid actor = CurrentUserKey(security);
        // Actor identity is a stable backoffice key, not a name or token in logs.
        return Ok(await service.CreateDrawAsync(request, actor.ToString(), ct));
    });
    [HttpGet("{id:long}/export/{kind}")]
    public Task<IActionResult> Export(long id, string kind, CancellationToken ct) => Execute(async () =>
    {
        if (kind is not ("eligible" or "winners")) return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", "Loại xuất dữ liệu không hợp lệ.")));
        if (kind == "winners")
        {
            var winners = await service.ExportDrawWinnersAsync(id, ct);
            if (winners is null) return NotFound(Missing());
            await audit.RecordAsync(CurrentUserKey(security), "export.draw." + kind, new { DrawId = id }, null, ct);
            return new ContestReportCsvResult(["Mã dự thi", "Họ tên", "Số điện thoại", "Điểm", "Thời điểm nộp", "Trạng thái", "Lý do hủy"], WinnerCsvRows(winners), $"draw-{id}-{kind}");
        }
        var rows = await service.ExportDrawAsync(id, false, ct);
        if (rows is null) return NotFound(Missing());
        await audit.RecordAsync(CurrentUserKey(security), "export.draw." + kind, new { DrawId = id }, null, ct);
        return new ContestReportCsvResult(["Mã dự thi", "Họ tên", "Số điện thoại", "Điểm", "Thời điểm nộp"], CsvRows(rows), $"draw-{id}-{kind}");
    });
    private static async IAsyncEnumerable<string[]> WinnerCsvRows(IReadOnlyList<DrawWinnerExportRow> rows)
    {
        foreach (var p in rows)
        {
            string reason = p.CancelledAt is { } at ? $"{p.CancelReason} ({at.ToString("O")})".Trim() : "";
            yield return [p.Code, p.FullName, p.Phone, p.Score.ToString(System.Globalization.CultureInfo.InvariantCulture), p.SubmittedAt?.ToString("O") ?? "",
                p.CancelledAt is null ? "Đã trúng" : "Đã hủy", reason];
        }
        await Task.CompletedTask;
    }
    private static async IAsyncEnumerable<string[]> CsvRows(IReadOnlyList<DrawCandidateSnapshot> rows)
    {
        foreach (var p in rows) yield return [p.Code, p.FullName, p.Phone, p.Score.ToString(System.Globalization.CultureInfo.InvariantCulture), p.SubmittedAt?.ToString("O") ?? ""];
        await Task.CompletedTask;
    }
    private static ApiErrorResponse Missing() => new(new ApiError("DRAW_NOT_FOUND", "Không tìm thấy lần quay."));
}
