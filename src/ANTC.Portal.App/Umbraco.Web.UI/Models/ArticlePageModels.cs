using System.Globalization;
using Microsoft.AspNetCore.WebUtilities;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Plugin.Custom.Core.Articles;

namespace Umbraco.Web.UI.Models;

public abstract class ArticlePageModel(IPublishedContent content) : PublishedContentWrapped(content)
{
    public ArticleSeo? ArticleSeo { get; init; }
}

public sealed class ArticleListPageModel(IPublishedContent content, ArticleCategory category,
    ArticleBrowseState browse, ArticleNavigation navigation) : ArticlePageModel(content)
{
    public ArticleCategory Category { get; } = category;
    public ArticleBrowseState Browse { get; } = browse;
    public ArticleNavigation Navigation { get; } = navigation;
}

public sealed class ArticleDetailPageModel(IPublishedContent content, ArticleDetail article,
    ArticleNavigation navigation) : ArticlePageModel(content)
{
    public ArticleDetail Article { get; } = article;
    public ArticleNavigation Navigation { get; } = navigation;
}

public sealed class ArticleSearchPageModel(IPublishedContent content, ArticleBrowseState browse,
    IReadOnlyList<ArticleCategory> categories) : ArticlePageModel(content)
{
    public ArticleBrowseState Browse { get; } = browse;
    public IReadOnlyList<ArticleCategory> Categories { get; } = categories;
}

public sealed record ArticleNavigation(ArticleCategory Selected, IReadOnlyList<ArticleCategory> Fields,
    string? EmergencyUrl);

public sealed record ArticleCardModel(ArticleCard Article, ArticleCategory? Category, bool ShowCategory = false)
{
    public static readonly ArticleCardModel Template = new(new(Guid.Empty, "", "", "/", "", null,
        new("none", null), new(null, null, null), null, false, new(null, ArticleReviewPolicy.DefaultMaxAgeDays, false, null)), null);
}

public sealed record ArticleBrowseState(ArticleQuery Query, ArticlePage Result, string Path, string? Scope,
    string? Error = null, int StatusCode = 200)
{
    public string Search => Query.SearchTerm ?? "";
    public bool IsSearchPage => Scope is not null;
    public string ClearUrl => (this with { Query = Query with { Search = null } }).PageUrl(1, Query.CategoryId);

    public string PageUrl(int page, Guid? category = null)
    {
        var values = new Dictionary<string, string?>
        {
            ["q"] = Query.SearchTerm,
            ["page"] = page > 1 ? page.ToString(CultureInfo.InvariantCulture) : null,
            ["pageSize"] = Query.PageSize == 10 ? null : Query.PageSize.ToString(CultureInfo.InvariantCulture),
            ["sort"] = Query.SortOrder == "updated-desc" ? null : Query.SortOrder
        };
        if (IsSearchPage)
        {
            values["scope"] = Scope;
            values["category"] = category?.ToString();
        }
        return QueryHelpers.AddQueryString(Path, values);
    }
}
