using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Api.Validation;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("api/v1/contest")]
public class ContestController : ControllerBase
{
    private readonly IContestEntryService _entryService;

    public ContestController(IContestEntryService entryService) => _entryService = entryService;

    /// <summary>API-01: tao mot luot thi co ten hoac an danh.</summary>
    [HttpPost("entries")]
    [ProducesResponseType<CreateContestEntryResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateEntry(
        [FromBody] CreateContestEntryRequest? request,
        CancellationToken cancellationToken)
    {
        if (!ContestEntryRequestValidator.TryValidate(request, out ContestEntryRegistration? registration, out var fields))
        {
            return BadRequest(Error("VALIDATION", "Dữ liệu đăng ký không hợp lệ.", fields));
        }

        try
        {
            ContestEntryCreationResult result = await _entryService.CreateAsync(
                registration!,
                GetClientIpAddress(),
                cancellationToken);

            var response = new CreateContestEntryResponse(
                result.Code,
                result.Token,
                result.Mode,
                result.AttemptNo,
                result.MaxAttempts,
                result.Status);

            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (ContestClosedException)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                Error("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));
        }
        catch (AttemptLimitException)
        {
            return Conflict(Error("ATTEMPT_LIMIT", "Số điện thoại đã dùng hết số lượt dự thi."));
        }
    }

    private string? GetClientIpAddress()
    {
        IPAddress? address = HttpContext.Connection.RemoteIpAddress;
        return address?.IsIPv4MappedToIPv6 == true ? address.MapToIPv4().ToString() : address?.ToString();
    }

    private static ApiErrorResponse Error(
        string code,
        string message,
        IReadOnlyDictionary<string, string>? fields = null) =>
        new(new ApiError(code, message, fields ?? new Dictionary<string, string>()));
}
