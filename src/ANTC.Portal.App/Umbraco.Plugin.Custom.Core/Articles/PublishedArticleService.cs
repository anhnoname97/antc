namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed class PublishedArticleService(IArticleContentSource source, TimeProvider clock,
    ArticleHtmlSanitizer sanitizer) : IPublishedArticleService
{
    public IReadOnlyList<ArticleCategory> Categories() => source.Read().Categories.Select(x => x.Category).ToArray();

    public ArticlePage? List(Guid categoryId, int page)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(page, 1);
        ArticleLibrary library = source.Read();
        ArticleCategoryContent? category = library.Categories.FirstOrDefault(x => x.Category.Id == categoryId);
        if (category is null) return null;
        DateOnly today = ArticleReviewPolicy.Today(clock);
        int total = category.Articles.Count;
        long skip = ((long)page - 1) * ArticlePage.ItemsPerPage;
        ArticleCard[] items = skip >= total ? [] : Order(category.Articles).Skip((int)skip).Take(ArticlePage.ItemsPerPage)
            .Select(x => Card(x, library.ReviewAfterDays, today)).ToArray();
        return new(category.Category, items, total, page, ArticlePage.ItemsPerPage,
            (int)Math.Ceiling((double)total / ArticlePage.ItemsPerPage));
    }

    public ArticleDetail? Detail(Guid articleId)
    {
        ArticleLibrary library = source.Read();
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

    private static ArticleCard Card(ArticleContent article, int days, DateOnly today) =>
        article.Card with { Review = ArticleReviewPolicy.Evaluate(article.Card.Review.LastReviewedDate, days, today) };
}
