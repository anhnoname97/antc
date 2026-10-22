using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Api.Infrastructure;

namespace Umbraco.Plugin.Custom.Api.Controllers;

/// <summary>
/// API cuoc thi (sheet "API"). Hien co API-01 den API-05; gioi han tan suat (BE-26) lam sau.
/// Co y khong dung [ApiController]: thuoc tinh do tu tra 400 ProblemDetails khi JSON sai,
/// trong khi hop dong yeu cau { error: { code, message, fields } } (QD-004).
/// </summary>
// AV0014 (bo phan tich API versioning) chi nhac them [ApiController]; controller nay co y khong dung no (ly do o tren),
// nen chi tat canh bao cho dung controller nay.
#pragma warning disable AV0014
[Route("api/v1/contest")]
public class ContestController : ControllerBase
#pragma warning restore AV0014
{
    private readonly IContestEntryService _entries;
    private readonly IContestAttemptService _attempts;

    public ContestController(IContestEntryService entries, IContestAttemptService attempts)
    {
        _entries = entries;
        _attempts = attempts;
    }

    /// <summary>
    /// API-01: tao mot luot thi cua mot cuoc thi (contestId bat buoc; co ten hoac an danh). Token chi tra mot lan; khong luu token goc va IP goc.
    /// </summary>
    [HttpPost("entries")]
    public async Task<IActionResult> CreateEntry([FromBody] CreateEntryRequest? request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";

        if (request is null || !ModelState.IsValid)
        {
            return Error(new ContestError("VALIDATION", "Dữ liệu gửi lên không hợp lệ."));
        }

        var result = await _entries.CreateAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString(), ct);
        if (result.Entry is { } e)
        {
            HttpContext.Items[ApiProtection.EntryCodeItem] = e.Code;
            return StatusCode(StatusCodes.Status201Created, e);
        }

        return Error(result.Error!);
    }

    /// <summary>
    /// API-02: lay lai luot thi theo X-Entry-Token (tien do, dap an da luu). Goi duoc o moi trang thai cuoc thi.
    /// </summary>
    [HttpGet("entries/me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";

        var entry = await _attempts.AuthenticateAsync(Request.Headers["X-Entry-Token"].FirstOrDefault(), ct);
        if (entry is null)
        {
            return Error(new ContestError("INVALID_TOKEN", "Phiên làm bài không hợp lệ hoặc đã hết hạn."));
        }

        HttpContext.Items[ApiProtection.EntryCodeItem] = entry.Code;
        return Ok(await _attempts.GetStateAsync(entry, ct));
    }

    /// <summary>
    /// API-03: luu dap an mot cau (lan ghi dau thang). Cau da co dap an tra 200 voi stored=false.
    /// </summary>
    [HttpPost("entries/me/answers")]
    public async Task<IActionResult> SaveAnswer([FromBody] SaveAnswerRequest? request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";

        var entry = await _attempts.AuthenticateAsync(Request.Headers["X-Entry-Token"].FirstOrDefault(), ct);
        if (entry is null)
        {
            return Error(new ContestError("INVALID_TOKEN", "Phiên làm bài không hợp lệ hoặc đã hết hạn."));
        }

        HttpContext.Items[ApiProtection.EntryCodeItem] = entry.Code;
        var result = await _attempts.SaveAnswerAsync(entry, request?.Q, request?.A, ct);
        return result.Answer is { } answer ? Ok(answer) : Error(result.Error!);
    }

    /// <summary>
    /// API-04: gan thong tin (ho ten, so dien thoai, don vi, dong y) vao luot an danh de xet giai.
    /// </summary>
    [HttpPut("entries/me/contact")]
    public async Task<IActionResult> AttachContact([FromBody] ContactRequest? request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";

        var entry = await _attempts.AuthenticateAsync(Request.Headers["X-Entry-Token"].FirstOrDefault(), ct);
        if (entry is null)
        {
            return Error(new ContestError("INVALID_TOKEN", "Phiên làm bài không hợp lệ hoặc đã hết hạn."));
        }

        HttpContext.Items[ApiProtection.EntryCodeItem] = entry.Code;
        var result = await _attempts.AttachContactAsync(entry, request, ct);
        return result.Contact is { } contact ? Ok(contact) : Error(result.Error!);
    }

    /// <summary>
    /// API-05: nộp khi có ít nhất một đáp án và còn hạn; contact cho lượt ẩn danh được gắn cùng transaction.
    /// Nộp lại trả nguyên kết quả đã chốt.
    /// </summary>
    [HttpPost("entries/me/submit")]
    public async Task<IActionResult> Submit([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] SubmitRequest? request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";

        var entry = await _attempts.AuthenticateAsync(Request.Headers["X-Entry-Token"].FirstOrDefault(), ct);
        if (entry is null)
        {
            return Error(new ContestError("INVALID_TOKEN", "Phiên làm bài không hợp lệ hoặc đã hết hạn."));
        }

        HttpContext.Items[ApiProtection.EntryCodeItem] = entry.Code;
        if (!ModelState.IsValid && entry.Status != EntryStatuses.Submitted)
            return Error(new ContestError("VALIDATION", "Dữ liệu gửi lên không hợp lệ."));

        var result = await _attempts.SubmitAsync(entry, request?.Contact, ct);
        return result.Result is { } submitted ? Ok(submitted) : Error(result.Error!);
    }

    private IActionResult Error(ContestError error)
    {
        int status = error.Code switch
        {
            "VALIDATION" => StatusCodes.Status400BadRequest,
            "UNKNOWN_QUESTION" or "INVALID_OPTION" => StatusCodes.Status400BadRequest,
            "INVALID_TOKEN" => StatusCodes.Status401Unauthorized,
            "CONTEST_NOT_FOUND" => StatusCodes.Status404NotFound,
            "CONTEST_CLOSED" => StatusCodes.Status403Forbidden,
            "ATTEMPT_LIMIT" or "ALREADY_SUBMITTED" or "ALREADY_NAMED" or "NOTHING_TO_SUBMIT" or "INCOMPLETE_ANSWERS" => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };
        return StatusCode(status, new { error = new { code = error.Code, message = error.Message, fields = error.Fields ?? new Dictionary<string, string>() } });
    }
}
