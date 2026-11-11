using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Api.Controllers;

/// <summary>API quản trị chuyên đề và câu hỏi; chỉ Administrators được truy cập.</summary>
[ApiController]
[Route("api/v1/admin/quiz")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
public sealed class QuizAdminController(IQuizAdminService service) : ControllerBase
{
    [HttpGet("topics")]
    public async Task<ActionResult<PagedResult<QuizTopicAdminDto>>> SearchTopics(
        [FromQuery] string? search, [FromQuery] bool? isActive, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20, CancellationToken ct = default, [FromQuery, System.ComponentModel.DataAnnotations.RegularExpression("^(all|general|business)$")] string bank = "all", [FromQuery, System.ComponentModel.DataAnnotations.RegularExpression("^(personal|organization)$")] string? type = null) =>
        Ok(await service.SearchTopicsAsync(search, isActive, page, pageSize, ct, bank, type));

    [HttpGet("topics/{id:int}")]
    public async Task<ActionResult<QuizTopicAdminDto>> GetTopic(int id, CancellationToken ct) =>
        await service.GetTopicAsync(id, ct) is { } item ? Ok(item) : NotFound(Error("TOPIC_NOT_FOUND", "Không tìm thấy chuyên đề."));

    [HttpPost("topics")]
    public async Task<ActionResult<QuizTopicAdminDto>> CreateTopic([FromBody] SaveQuizTopicRequest request, CancellationToken ct)
    {
        try
        {
            QuizTopicAdminDto item = await service.CreateTopicAsync(request, Actor(), ct);
            return CreatedAtAction(nameof(GetTopic), new { id = item.Id }, item);
        }
        catch (Exception exception) { return Map(exception); }
    }

    [HttpPut("topics/{id:int}")]
    public async Task<ActionResult<QuizTopicAdminDto>> UpdateTopic(int id, [FromBody] SaveQuizTopicRequest request, CancellationToken ct)
    {
        try
        {
            return await service.UpdateTopicAsync(id, request, Actor(), ct) is { } item
                ? Ok(item) : NotFound(Error("TOPIC_NOT_FOUND", "Không tìm thấy chuyên đề."));
        }
        catch (Exception exception) { return Map(exception); }
    }

    [HttpDelete("topics/{id:int}")]
    public async Task<IActionResult> DeleteTopic(int id, CancellationToken ct)
    {
        try
        {
            return await service.DeleteTopicAsync(id, Actor(), ct)
                ? NoContent() : NotFound(Error("TOPIC_NOT_FOUND", "Không tìm thấy chuyên đề."));
        }
        catch (Exception exception) { return Map(exception); }
    }

    [HttpGet("questions")]
    public async Task<ActionResult<PagedResult<QuizQuestionAdminDto>>> SearchQuestions(
        [FromQuery] string? search, [FromQuery] int? topicId, [FromQuery] bool? isActive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default, [FromQuery, System.ComponentModel.DataAnnotations.RegularExpression("^(all|general|business)$")] string bank = "all", [FromQuery, System.ComponentModel.DataAnnotations.RegularExpression("^(personal|organization)$")] string? type = null) =>
        Ok(await service.SearchQuestionsAsync(search, topicId, isActive, page, pageSize, ct, bank, type));

    [HttpGet("questions/{code}")]
    public async Task<ActionResult<QuizQuestionAdminDto>> GetQuestion(string code, CancellationToken ct) =>
        await service.GetQuestionAsync(code, ct) is { } item ? Ok(item) : NotFound(Error("QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi."));

    [HttpPost("questions")]
    public async Task<ActionResult<QuizQuestionAdminDto>> CreateQuestion([FromBody] SaveQuizQuestionRequest request, CancellationToken ct)
    {
        try
        {
            QuizQuestionAdminDto item = await service.CreateQuestionAsync(request, Actor(), ct);
            return CreatedAtAction(nameof(GetQuestion), new { code = item.Code }, item);
        }
        catch (Exception exception) { return Map(exception); }
    }

    [HttpPut("questions/{code}")]
    public async Task<ActionResult<QuizQuestionAdminDto>> UpdateQuestion(string code, [FromBody] SaveQuizQuestionRequest request, CancellationToken ct)
    {
        try
        {
            return await service.UpdateQuestionAsync(code, request, Actor(), ct) is { } item
                ? Ok(item) : NotFound(Error("QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi."));
        }
        catch (Exception exception) { return Map(exception); }
    }

    [HttpDelete("questions/{code}")]
    public async Task<IActionResult> DeleteQuestion(string code, CancellationToken ct)
    {
        DeleteQuizQuestionResult? result = await service.DeleteQuestionAsync(code, Actor(), ct);
        return result is null ? NotFound(Error("QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi.")) : Ok(result);
    }

    private string Actor() => User.Identity?.Name ?? "backoffice";
    private ObjectResult Map(Exception exception) => exception switch
    {
        QuizAdminValidationException validation => BadRequest(Error("VALIDATION", validation.Message, validation.Fields)),
        QuizAdminConflictException conflict => Conflict(Error(conflict.Code, conflict.Message)),
        _ => throw exception,
    };
    private static ApiErrorResponse Error(string code, string message, IReadOnlyDictionary<string, string>? fields = null) =>
        new(new ApiError(code, message, fields ?? new Dictionary<string, string>()));
}
