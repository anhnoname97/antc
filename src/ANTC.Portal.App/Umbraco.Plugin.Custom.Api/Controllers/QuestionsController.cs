using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Api.Validation;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/questions")]
public sealed class QuestionsController(IQuestionSubmissionService service) : ControllerBase
{
    /// <summary>API-06: tiếp nhận câu hỏi, kiến nghị và góp ý; không gửi thư điện tử.</summary>
    [HttpPost]
    [ProducesResponseType<CreateQuestionResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Create([FromBody] CreateQuestionRequest? request, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(request?.Website)) return StatusCode(201, new CreateQuestionResponse());
        if (!QuestionRequestValidator.TryValidate(request, out QuestionRegistration? registration, out var fields))
            return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", "Dữ liệu gửi lên không hợp lệ.", fields)));
        try
        {
            await service.SubmitAsync(registration!, HttpContext.Connection.RemoteIpAddress, ct);
            return StatusCode(201, new CreateQuestionResponse());
        }
        catch (QuestionRateLimitedException ex)
        {
            Response.Headers.RetryAfter = ex.RetryAfterSeconds.ToString(CultureInfo.InvariantCulture);
            return StatusCode(429, new ApiErrorResponse(new ApiError("RATE_LIMITED", "Bạn đã gửi 5 lần trong một giờ. Vui lòng thử lại sau.")));
        }
    }
}
