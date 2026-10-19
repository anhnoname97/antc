using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Articles;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1")]
public sealed class PublishedArticlesController(IPublishedArticleService articles) : ControllerBase
{
    [HttpGet("article-categories")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<IReadOnlyList<ArticleCategory>>(200)]
    public IActionResult Categories() => Ok(articles.Categories());

    [HttpGet("article-categories/{id:guid}/articles")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<ArticlePage>(200)]
    [ProducesResponseType<ApiErrorResponse>(400)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public IActionResult List(Guid id, int trang = 1)
    {
        if (trang < 1) return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", "Tham số danh sách không hợp lệ.",
            new Dictionary<string, string> { ["trang"] = "Số trang phải là số nguyên từ 1 trở lên." })));
        ArticlePage? result = articles.List(id, trang);
        return result is null ? NotFound(new ApiErrorResponse(new ApiError("NOT_FOUND", "Không tìm thấy danh mục bài viết."))) : Ok(result);
    }

    [HttpGet("articles/{id:guid}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<ArticleDetail>(200)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public IActionResult Detail(Guid id)
    {
        ArticleDetail? article = articles.Detail(id);
        return article is null ? NotFound(new ApiErrorResponse(new ApiError("NOT_FOUND", "Không tìm thấy bài viết."))) : Ok(article);
    }
}
