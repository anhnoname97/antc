using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
    [ProducesResponseType<ArticleCategoryPage>(200)]
    [ProducesResponseType<ApiErrorResponse>(400)]
    public IActionResult Categories(string? section = null, string? categoryRole = null,
        bool? isField = null, bool? hasArticles = null, bool? showOnHome = null, string? search = null,
        int page = 1, int pageSize = ArticleCategoryPage.DefaultPageSize, string? sort = null,
        [FromQuery] Guid[]? excludeIds = null)
    {
        var query = new ArticleCategoryQuery(section, categoryRole, isField, hasArticles, showOnHome, search,
            page, pageSize, sort, excludeIds);
        var fields = new Dictionary<string, string>(query.Validate());
        if (Request.Query.ContainsKey("limit"))
            fields["limit"] = "Tham số limit đã được thay bằng pageSize; dùng page để chọn trang và đọc danh mục từ items.";
        return fields.Count > 0
            ? BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", "Tham số danh mục không hợp lệ.", fields)))
            : Ok(articles.Categories(query));
    }

    [HttpGet("article-categories/{id:guid}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<ArticleCategory>(200)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public IActionResult Category(Guid id)
    {
        var category = articles.Category(id);
        return category is null ? NotFound(new ApiErrorResponse(new ApiError("NOT_FOUND", "Không tìm thấy danh mục bài viết."))) : Ok(category);
    }

    [HttpGet("article-categories/by-path")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<ArticleCategory>(200)]
    [ProducesResponseType<ApiErrorResponse>(400)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public IActionResult CategoryByPath(string? path = null)
    {
        if (ArticlePathQuery.Normalize(path) is not { } normalized) return InvalidPath();
        var category = articles.CategoryByPath(normalized);
        return category is null ? NotFound(new ApiErrorResponse(new ApiError("NOT_FOUND", "Không tìm thấy danh mục bài viết."))) : Ok(category);
    }

    [HttpGet("articles")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<ArticlePage>(200)]
    [ProducesResponseType<ApiErrorResponse>(400)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    [ProducesResponseType<ApiErrorResponse>(503)]
    public IActionResult List(Guid? categoryId = null, string? search = null, string? label = null,
        DateOnly? updatedFrom = null, DateOnly? updatedTo = null, string? reviewStatus = null, bool? isDraft = null,
        int page = 1, int pageSize = ArticlePage.DefaultPageSize, string? sort = null,
        bool? showOnHome = null, string? section = null, string? categoryRole = null, bool? isField = null,
        bool? hasImage = null, string? sourceAgency = null, [FromQuery] Guid[]? excludeIds = null)
    {
        var query = new ArticleQuery(categoryId, search, label, updatedFrom, updatedTo, reviewStatus, isDraft, page, pageSize, sort,
            showOnHome, section, categoryRole, isField, hasImage, sourceAgency, excludeIds);
        var fields = query.Validate();
        if (fields.Count > 0) return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", "Tham số danh sách không hợp lệ.", fields)));
        try
        {
            ArticlePage? result = articles.List(query);
            return result is null ? NotFound(new ApiErrorResponse(new ApiError("NOT_FOUND", "Không tìm thấy danh mục bài viết."))) : Ok(result);
        }
        catch (ArticleSearchUnavailableException error)
        {
            Response.Headers.RetryAfter = "5";
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ApiErrorResponse(new ApiError("SEARCH_UNAVAILABLE", error.Message)));
        }
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

    [HttpGet("articles/by-path")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<ArticleDetail>(200)]
    [ProducesResponseType<ApiErrorResponse>(400)]
    [ProducesResponseType<ApiErrorResponse>(404)]
    public IActionResult DetailByPath(string? path = null)
    {
        if (ArticlePathQuery.Normalize(path) is not { } normalized)
            return InvalidPath();
        var article = articles.DetailByPath(normalized);
        return article is null ? NotFound(new ApiErrorResponse(new ApiError("NOT_FOUND", "Không tìm thấy bài viết."))) : Ok(article);
    }

    private IActionResult InvalidPath() => BadRequest(new ApiErrorResponse(new ApiError("VALIDATION", "Đường dẫn không hợp lệ.",
        new Dictionary<string, string> { ["path"] = "Nhập đường dẫn nội bộ từ trường url, tối đa 2048 ký tự, không gồm query hoặc fragment." })));
}
