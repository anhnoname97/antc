using System.Globalization;
using Umbraco.Plugin.Custom.Core.Search;

namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed class PublishedArticleService(IArticleContentSource source, TimeProvider clock,
    ArticleHtmlSanitizer sanitizer) : IPublishedArticleService
{
    private static readonly StringComparer VietnameseTitles = StringComparer.Create(CultureInfo.GetCultureInfo("vi-VN"), true);

    public ArticleCategoryPage Categories(ArticleCategoryQuery? query = null)
    {
        query ??= new();
        if (query.Validate().Count > 0) throw new ArgumentException("Tham số danh mục không hợp lệ.", nameof(query));
        IEnumerable<ArticleCategory> categories = source.Read().Categories.Select(x => x.Category).Where(query.Matches);
        if (query.ExcludeIds is { Count: > 0 } ids)
        {
            var excluded = ids.ToHashSet();
            categories = categories.Where(x => !excluded.Contains(x.Id));
        }
        ArticleCategory[] filtered = categories.ToArray();
        int total = filtered.Length;
        long skip = ((long)query.Page - 1) * query.PageSize;
        ArticleCategory[] items = skip >= total ? [] : SortCategories(filtered, query.SortOrder)
            .Skip((int)skip).Take(query.PageSize).ToArray();
        return new(items, total, query.Page, query.PageSize, (int)Math.Ceiling((double)total / query.PageSize));
    }

    public ArticleCategory? Category(Guid categoryId) =>
        source.Read().Categories.Select(x => x.Category).FirstOrDefault(x => x.Id == categoryId);

    public ArticleCategory? CategoryByPath(string path)
    {
        string normalized = ArticlePathQuery.Normalize(path)
            ?? throw new ArgumentException("Đường dẫn danh mục không hợp lệ.", nameof(path));
        return source.Read().Categories.Select(x => x.Category)
            .FirstOrDefault(x => string.Equals(ArticlePathQuery.Normalize(x.Url), normalized, StringComparison.OrdinalIgnoreCase));
    }

    public ArticlePage? List(ArticleQuery query)
    {
        ArgumentNullException.ThrowIfNull(query);
        if (query.Validate().Count > 0) throw new ArgumentException("Tham số danh sách bài viết không hợp lệ.", nameof(query));
        ArticleLibrary library = source.Read(includeBodies: query.SearchTerm is not null);
        ArticleCategoryContent? selected = query.CategoryId is { } id
            ? library.Categories.FirstOrDefault(x => x.Category.Id == id) : null;
        if (query.CategoryId is not null && selected is null) return null;
        DateOnly today = ArticleReviewPolicy.Today(clock);
        var categoryQuery = new ArticleCategoryQuery(query.Section, query.CategoryRole, query.IsField);
        IEnumerable<ArticleCategoryContent> categories = (selected is null ? library.Categories : [selected])
            .Where(x => categoryQuery.Matches(x.Category));
        if (query.SearchTerm is { } term)
            categories = categories.Select(category => category with
            {
                Articles = category.Articles.Where(article => ArticleSearchText.Contains(article.Card.Title, term)
                    || ArticleSearchText.Contains(article.Card.Summary, term)
                    || ArticleSearchText.Contains(SearchText.PlainHtml(article.BodyHtml), term)).ToArray()
            });
        IEnumerable<ArticleListItem> articles = categories.SelectMany(category => category.Articles
            .Select(article => new ArticleListItem(Card(article, library.ReviewAfterDays, today), category.Category)));
        if (query.ShowOnHome is { } home) articles = articles.Where(x => x.ShowOnHome == home);
        if (query.HasImage is { } image) articles = articles.Where(x => (x.Image is not null) == image);
        if (query.SourceAgencyFilter is { } agency)
            articles = articles.Where(x => x.Source.Agency is { } sourceAgency && Contains(sourceAgency, agency));
        if (query.ExcludeIds is { Count: > 0 } ids)
        {
            var excluded = ids.ToHashSet();
            articles = articles.Where(x => !excluded.Contains(x.Id));
        }
        if (query.LabelFilter is { } label) articles = articles.Where(x => x.Label.Type == label);
        if (query.UpdatedFrom is { } from) articles = articles.Where(x => x.UpdatedDate >= from);
        if (query.UpdatedTo is { } to) articles = articles.Where(x => x.UpdatedDate <= to);
        if (query.IsDraft is { } draft) articles = articles.Where(x => x.IsDraft == draft);
        if (query.ReviewStatusFilter is { } review) articles = articles.Where(x => review switch
        {
            "overdue" => x.Review.IsOverdue,
            "current" => x.Review.LastReviewedDate is not null && !x.Review.IsOverdue,
            _ => x.Review.LastReviewedDate is null
        });
        ArticleListItem[] filtered = articles.ToArray();
        int total = filtered.Length;
        long skip = ((long)query.Page - 1) * query.PageSize;
        ArticleListItem[] items = skip >= total ? [] : Sort(filtered, query.SortOrder)
            .Skip((int)skip).Take(query.PageSize).ToArray();
        return new(selected?.Category, items, total, query.Page, query.PageSize,
            (int)Math.Ceiling((double)total / query.PageSize));
    }

    public ArticleDetail? Detail(Guid articleId)
    {
        ArticleLibrary library = source.Read(articleId);
        foreach (ArticleCategoryContent category in library.Categories)
        {
            ArticleContent? article = category.Articles.FirstOrDefault(x => x.Card.Id == articleId);
            if (article is null) continue;
            DateOnly today = ArticleReviewPolicy.Today(clock);
            ArticleCard[] related = Order(category.Articles).Where(x => x.Card.Id != articleId).Take(3)
                .Select(x => Card(x, library.ReviewAfterDays, today)).ToArray();
            return new(Card(article, library.ReviewAfterDays, today), category.Category,
                sanitizer.Clean(article.BodyHtml), article.SafeAction, article.Seo, related);
        }
        return null;
    }

    public ArticleDetail? DetailByPath(string path)
    {
        string normalized = ArticlePathQuery.Normalize(path)
            ?? throw new ArgumentException("Đường dẫn bài viết không hợp lệ.", nameof(path));
        var card = source.Read().Categories.SelectMany(x => x.Articles).Select(x => x.Card)
            .FirstOrDefault(x => string.Equals(ArticlePathQuery.Normalize(x.Url), normalized, StringComparison.OrdinalIgnoreCase));
        return card is null ? null : Detail(card.Id);
    }

    public FraudPageContent? FraudContent() => source.Read().FraudContent;
    public PolicyPageContent? PolicyContent() => source.Read().PolicyContent;

    private static IOrderedEnumerable<ArticleContent> Order(IEnumerable<ArticleContent> articles) =>
        articles.OrderByDescending(x => x.Card.UpdatedDate).ThenBy(x => x.Card.Id);

    private static IEnumerable<ArticleCategory> SortCategories(IEnumerable<ArticleCategory> categories, string sort) => sort switch
    {
        "title-asc" => categories.OrderBy(x => x.Title, VietnameseTitles).ThenBy(x => x.Id),
        "title-desc" => categories.OrderByDescending(x => x.Title, VietnameseTitles).ThenBy(x => x.Id),
        "article-count-asc" => categories.OrderBy(x => x.ArticleCount).ThenBy(x => x.Id),
        "article-count-desc" => categories.OrderByDescending(x => x.ArticleCount).ThenBy(x => x.Id),
        _ => categories
    };

    private static IOrderedEnumerable<ArticleListItem> Sort(IEnumerable<ArticleListItem> articles, string sort) => sort switch
    {
        "title-asc" => articles.OrderBy(x => x.Title, VietnameseTitles).ThenBy(x => x.Id),
        "title-desc" => articles.OrderByDescending(x => x.Title, VietnameseTitles).ThenBy(x => x.Id),
        "updated-asc" => articles.OrderBy(x => x.UpdatedDate is null).ThenBy(x => x.UpdatedDate).ThenBy(x => x.Id),
        _ => articles.OrderByDescending(x => x.UpdatedDate).ThenBy(x => x.Id)
    };

    private static bool Contains(string value, string term) =>
        ArticleSearchText.Contains(value, term);

    private static ArticleCard Card(ArticleContent article, int days, DateOnly today) =>
        article.Card with { Review = ArticleReviewPolicy.Evaluate(article.Card.Review.LastReviewedDate, days, today) };
}
