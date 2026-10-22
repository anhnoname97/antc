using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Security;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

public sealed record PortalSpinRequest(long? PrizeId, int? MinScore, Guid? RequestId);

/// <summary>API quay so cho thanh vien Ban to chuc quay so (cookie thanh vien). Moi phan hoi deu che ten va so dien thoai.</summary>
[ApiController]
[Route("api/v1/quay-so")]
[Authorize(Policy = DrawMemberAccess.Policy)]
public sealed class PortalDrawController(PortalDrawService service, IMemberManager members) : ControllerBase
{
    /// <summary>Quay số portal: lấy token antiforgery cho thao tác quay.</summary>
    [HttpGet("antiforgery")]
    public IActionResult Antiforgery([FromServices] IAntiforgery antiforgery)
    {
        Response.Headers.CacheControl = "no-store";
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new { tokens.RequestToken, tokens.HeaderName });
    }

    /// <summary>Quay số portal: danh sách cuộc thi đã kết thúc (EndAt + SubmitGraceHours đã qua), mới nhất trước.</summary>
    [HttpGet("contests")]
    public Task<IActionResult> Contests(CancellationToken ct) => Execute(async () => Ok(await service.ListFinishedAsync(ct)));

    /// <summary>Quay số portal: chi tiết một cuộc thi đã kết thúc, giải thưởng, số liệu danh sách và người đã trúng.</summary>
    [HttpGet("contests/{id:long}")]
    public Task<IActionResult> Contest(long id, int? minScore, CancellationToken ct) => Execute(async () =>
    {
        if (minScore < 0) throw new ContestAdminValidationException(new Dictionary<string, string> { ["minScore"] = "Điểm tối thiểu không được âm." });
        return Ok(await service.GetAsync(id, minScore, ct));
    });

    /// <summary>Quay số portal: quay một người trúng cho một giải; gửi lại cùng requestId trả về lần quay cũ.</summary>
    [HttpPost("contests/{id:long}/spin")]
    [ValidateAntiForgeryToken]
    public Task<IActionResult> Spin(long id, [FromBody] PortalSpinRequest request, CancellationToken ct) => Execute(async () =>
    {
        var fields = new Dictionary<string, string>();
        if (request.RequestId is null || request.RequestId == Guid.Empty) fields["requestId"] = "Phải gửi mã yêu cầu để chống quay lặp khi thử lại.";
        if (request.PrizeId is null or <= 0) fields["prizeId"] = "Phải chọn giải thưởng.";
        if (request.MinScore is null or < 0) fields["minScore"] = "Điểm tối thiểu là bắt buộc và không được âm.";
        if (fields.Count > 0) throw new ContestAdminValidationException(fields);
        var member = await members.GetCurrentMemberAsync();
        if (member is null) return Unauthorized(Error("UNAUTHORIZED", "Vui lòng đăng nhập khu vực quay số."));
        return Ok(await service.SpinAsync(id, request.PrizeId!.Value, request.MinScore!.Value, request.RequestId!.Value, "member:" + member.Key, ct));
    });

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        Response.Headers.CacheControl = "no-store";
        try { return await action(); }
        catch (ContestAdminValidationException e) { return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", e.Message, e.Fields))); }
        catch (ContestAdminConflictException e) { return Conflict(Error(e.Code, e.Message)); }
        catch (PortalDrawContestNotFoundException e) { return NotFound(Error(e.Code, e.Message)); }
    }

    private static ApiErrorResponse Error(string code, string message) => new(new ApiError(code, message));
}
