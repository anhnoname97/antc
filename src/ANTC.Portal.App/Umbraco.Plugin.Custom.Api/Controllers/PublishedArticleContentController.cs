using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Articles;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/article-content")]
public sealed class PublishedArticleContentController(IPublishedArticleService articles) : ControllerBase
{
    [HttpGet("fraud")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<FraudPageContent>(200)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public IActionResult Fraud()
    {
        var content = articles.FraudContent();
        return content is null ? NotFound(Error()) : Ok(content);
    }

    [HttpGet("policy")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<PolicyPageContent>(200)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public IActionResult Policy()
    {
        var content = articles.PolicyContent();
        return content is null ? NotFound(Error()) : Ok(content);
    }

    private static ApiErrorResponse Error() => new(new ApiError("NOT_FOUND", "Chưa có nội dung đã xuất bản cho trang này."));
}
