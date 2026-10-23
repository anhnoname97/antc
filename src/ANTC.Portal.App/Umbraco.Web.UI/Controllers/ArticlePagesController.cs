using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.OutputCaching;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.Articles;
using Umbraco.Web.UI.Models;
using UmbracoConstants = Umbraco.Cms.Core.Constants;

namespace Umbraco.Web.UI.Controllers;

// Both the Razor pages and the JSON controllers use the same published-content/search service.
public abstract class ArticleRenderController(ILogger<RenderController> logger, ICompositeViewEngine views,
    IUmbracoContextAccessor context, IPublishedArticleService articles) : RenderController(logger, views, context)
{
    protected IPublishedArticleService Articles { get; } = articles;

    protected IReadOnlyList<ArticleCategory> Categories(string section, bool? isField = null)
    {
        var result = new List<ArticleCategory>();
        for (var page = 1; ; page++)
        {
            var batch = Articles.Categories(new(Section: section, IsField: isField, Page: page, PageSize: 50));
            result.AddRange(batch.Items);
            if (page >= batch.TotalPages) return result;
        }
    }

    protected ArticleNavigation Navigation(ArticleCategory category) => new(category,
        category.Role == "Chính sách" ? [] : Categories("fraud", true),
        CurrentPage is { } current ? current.Root().DescendantsOrSelfOfType("ungPhoPage").FirstOrDefault()?.Url() : null);

    protected ArticleListPageModel CategoryModel(IPublishedContent page, ArticleCategory category) =>
        new(page, category, Browse(category.Url, category.Id, category.Role == "Chính sách" ? "policy" : "fraud"),
            Navigation(category)) { ArticleSeo = category.Seo };

    protected ArticleBrowseState Browse(string path, Guid? categoryId, string section, bool searchPage = false)
    {
        var errors = new List<string>();
        string search = Request.Query["q"].ToString().Trim();
        // Index updates finish asynchronously after publishing; do not cache keyword search HTML.
        if (search.Length > 0) Response.Headers.CacheControl = "no-store";
        int Number(string name, int fallback)
        {
            if (!Request.Query.ContainsKey(name)) return fallback;
            if (int.TryParse(Request.Query[name], NumberStyles.Integer, CultureInfo.InvariantCulture, out int value)) return value;
            errors.Add($"Tham số {name} phải là số nguyên.");
            return fallback;
        }
        if (searchPage && Request.Query["category"].ToString() is { Length: > 0 } category)
        {
            if (Guid.TryParse(category, out var id) && id != Guid.Empty) categoryId = id;
            else errors.Add("Chọn danh mục hợp lệ.");
        }
        var query = new ArticleQuery(CategoryId: categoryId, Search: search, Page: Number("page", 1),
            PageSize: Number("pageSize", 10), Sort: Request.Query["sort"], Section: section);
        errors.AddRange(query.Validate().Values);
        string? scope = searchPage ? section == "policy" ? "chinh-sach" : "thu-doan" : null;
        ArticlePage Empty() => new(null, [], 0, Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 50), 0);
        ArticleBrowseState Failure(string message, int status)
        {
            Response.StatusCode = status;
            return new(query, Empty(), path, scope, message, status);
        }
        if (errors.Count > 0) return Failure(string.Join(" ", errors.Distinct()), 400);
        if (searchPage && section == "fraud" && Regex.IsMatch(search, @"\d{4,}|\d[\d\s.()+-]{3,}\d"))
            return Failure("Hãy tìm theo tên thủ đoạn hoặc chủ đề; không nhập số điện thoại hay số tài khoản.", 200);
        try
        {
            var result = Articles.List(query);
            return result is null ? Failure("Không tìm thấy danh mục bài viết.", 404) : new(query, result, path, scope);
        }
        catch (ArticleSearchUnavailableException error)
        {
            Response.Headers.RetryAfter = "5";
            return Failure(error.Message, 503);
        }
    }
}

public sealed class ArticleListController(ILogger<RenderController> logger, ICompositeViewEngine views,
    IUmbracoContextAccessor context, IPublishedArticleService articles) : ArticleRenderController(logger, views, context, articles)
{
    [AcceptVerbs("GET", "HEAD")]
    [OutputCache(PolicyName = UmbracoConstants.Website.OutputCache.ContentCachePolicy)]
    public override IActionResult Index()
    {
        if (CurrentPage is not { } page) return NotFound();
        var category = Articles.Category(page.Key);
        if (category is null) return NotFound();
        return CurrentTemplate(CategoryModel(page, category));
    }
}

// The policy landing page and its content library are separate nodes in the CMS tree.
public sealed class ChinhSachPageController(ILogger<RenderController> logger, ICompositeViewEngine views,
    IUmbracoContextAccessor context, IPublishedArticleService articles) : ArticleRenderController(logger, views, context, articles)
{
    [AcceptVerbs("GET", "HEAD")]
    [OutputCache(PolicyName = UmbracoConstants.Website.OutputCache.ContentCachePolicy)]
    public override IActionResult Index()
    {
        if (CurrentPage is not { } page) return NotFound();
        var category = Articles.CategoryByPath("/chinh-sach/");
        return category is null ? NotFound() : View("articleList", CategoryModel(page, category));
    }
}

public sealed class ArticleController(ILogger<RenderController> logger, ICompositeViewEngine views,
    IUmbracoContextAccessor context, IPublishedArticleService articles) : ArticleRenderController(logger, views, context, articles)
{
    [AcceptVerbs("GET", "HEAD")]
    [OutputCache(PolicyName = UmbracoConstants.Website.OutputCache.ContentCachePolicy)]
    public override IActionResult Index()
    {
        if (CurrentPage is not { } page) return NotFound();
        var article = Articles.Detail(page.Key);
        return article is null ? NotFound() : CurrentTemplate(new ArticleDetailPageModel(page, article,
            Navigation(article.Category)) { ArticleSeo = article.Seo });
    }
}

public sealed class SearchPageController(ILogger<RenderController> logger, ICompositeViewEngine views,
    IUmbracoContextAccessor context, IPublishedArticleService articles) : ArticleRenderController(logger, views, context, articles)
{
    [AcceptVerbs("GET", "HEAD")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public override IActionResult Index()
    {
        if (CurrentPage is not { } page) return NotFound();
        string section = Request.Query["scope"] == "chinh-sach" ? "policy" : "fraud";
        var browse = Browse(page.Url(), null, section, true);
        var categories = Categories(section).Where(x => !x.Seo.HideFromSearch).ToArray();
        return CurrentTemplate(new ArticleSearchPageModel(page, browse, categories));
    }
}
