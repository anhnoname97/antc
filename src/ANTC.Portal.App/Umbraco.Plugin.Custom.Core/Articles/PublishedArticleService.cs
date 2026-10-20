using System.Globalization;
using System.Text;

namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed class PublishedArticleService(IArticleContentSource source, TimeProvider clock,
    ArticleHtmlSanitizer sanitizer) : IPublishedArticleService
{
    private static readonly StringComparer VietnameseTitles = StringComparer.Create(CultureInfo.GetCultureInfo("vi-VN"), true);

    public IReadOnlyList<ArticleCategory> Categories() => source.Read().Categories.Select(x => x.Category).ToArray();

    public ArticlePage? List(ArticleQuery query)
    {
        ArgumentNullException.ThrowIfNull(query);
        if (query.Validate().Count > 0) throw new ArgumentException("Tham số danh sách bài viết không hợp lệ.", nameof(query));
        ArticleLibrary library = source.Read();
        ArticleCategoryContent? selected = query.CategoryId is { } id
            ? library.Categories.FirstOrDefault(x => x.Category.Id == id) : null;
        if (query.CategoryId is not null && selected is null) return null;
        DateOnly today = ArticleReviewPolicy.Today(clock);
        IEnumerable<ArticleCategoryContent> categories = selected is null ? library.Categories : [selected];
        IEnumerable<ArticleListItem> articles = categories.SelectMany(category => category.Articles
            .Select(article => new ArticleListItem(Card(article, library.ReviewAfterDays, today), category.Category)));
        if (query.SearchTerm is { } term)
        {
            string normalized = term.Normalize(NormalizationForm.FormC);
            articles = articles.Where(x => Contains(x.Title, normalized) || Contains(x.Summary, normalized));
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

    private static IOrderedEnumerable<ArticleContent> Order(IEnumerable<ArticleContent> articles) =>
        articles.OrderByDescending(x => x.Card.UpdatedDate).ThenBy(x => x.Card.Id);

    private static IOrderedEnumerable<ArticleListItem> Sort(IEnumerable<ArticleListItem> articles, string sort) => sort switch
    {
        "title-asc" => articles.OrderBy(x => x.Title, VietnameseTitles).ThenBy(x => x.Id),
        "title-desc" => articles.OrderByDescending(x => x.Title, VietnameseTitles).ThenBy(x => x.Id),
        "updated-asc" => articles.OrderBy(x => x.UpdatedDate is null).ThenBy(x => x.UpdatedDate).ThenBy(x => x.Id),
        _ => articles.OrderByDescending(x => x.UpdatedDate).ThenBy(x => x.Id)
    };

    private static bool Contains(string value, string term) =>
        value.Normalize(NormalizationForm.FormC).Contains(term, StringComparison.OrdinalIgnoreCase);

    private static ArticleCard Card(ArticleContent article, int days, DateOnly today) =>
        article.Card with { Review = ArticleReviewPolicy.Evaluate(article.Card.Review.LastReviewedDate, days, today) };
}
