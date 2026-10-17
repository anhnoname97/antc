using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

/// <summary>
/// API cuoc thi (sheet "API"). Hien co API-01; cac API /me va gioi han tan suat (BE-26) lam sau.
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

    public ContestController(IContestEntryService entries) => _entries = entries;

    /// <summary>
    /// API-01: tao mot luot thi (co ten hoac an danh). Token chi tra mot lan; khong luu token goc va IP goc.
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
            return StatusCode(StatusCodes.Status201Created, e);
        }

        return Error(result.Error!);
    }

    private IActionResult Error(ContestError error)
    {
        int status = error.Code switch
        {
            "VALIDATION" => StatusCodes.Status400BadRequest,
            "CONTEST_CLOSED" => StatusCodes.Status403Forbidden,
            "ATTEMPT_LIMIT" => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };
        return StatusCode(status, new { error = new { code = error.Code, message = error.Message, fields = error.Fields ?? new Dictionary<string, string>() } });
    }
}
