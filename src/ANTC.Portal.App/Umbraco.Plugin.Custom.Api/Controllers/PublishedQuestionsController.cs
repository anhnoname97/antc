using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/questions")]
public sealed class PublishedQuestionsController(IPublishedQuestionService questions) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> List(int page = 1, CancellationToken ct = default)
        => page < 1 ? BadRequest(new { error = new { code = "VALIDATION", message = "Số trang không hợp lệ." } })
            : Ok(await questions.ListAsync(page, ct));
}
