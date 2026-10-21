using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/questions")]
public sealed class PublishedQuestionsController(IPublishedQuestionService questions) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<PublishedQuestionPage>(200)]
    [ProducesResponseType<ApiErrorResponse>(400)]
    public async Task<IActionResult> List(int page = 1, int pageSize = PublishedQuestionPage.DefaultPageSize,
        string? search = null, string? sort = null, string? type = null, CancellationToken ct = default)
    {
        var query = new PublishedQuestionQuery(page, pageSize, search, string.IsNullOrWhiteSpace(sort) ? "newest" : sort, type);
        var fields = query.Validate();
        return fields.Count > 0
            ? BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", "Tham số danh sách không hợp lệ.", fields)))
            : Ok(await questions.ListAsync(query, ct));
    }

    [HttpGet("{id:long}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<PublishedQuestion>(200)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public async Task<IActionResult> Detail(long id, CancellationToken ct = default)
    {
        var question = await questions.GetPublishedAsync(id, ct);
        return question is null
            ? NotFound(new ApiErrorResponse(new ApiError("NOT_FOUND", "Không tìm thấy câu hỏi.")))
            : Ok(question);
    }
}
