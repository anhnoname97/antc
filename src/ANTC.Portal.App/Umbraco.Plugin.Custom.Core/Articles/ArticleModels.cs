namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed record ArticleCategory(Guid Id, string Title, string Slug, string Url, string Summary,
    bool IsField, string? FieldIcon, string? Role, int ArticleCount);

public sealed record ArticleImage(string Url, string Alt);
public sealed record ArticleLabel(string Type, string? Text);
public sealed record ArticleSource(string? Agency, string? DocumentNumber, DateOnly? DocumentDate);
public sealed record ArticleReview(DateOnly? LastReviewedDate, int MaxAgeDays, bool IsOverdue, string? Message);
public sealed record ArticleSeo(string Title, string Description, ArticleImage? Image, bool HideFromSearch);

public record ArticleCard(Guid Id, string Title, string Slug, string Url, string Summary, ArticleImage? Image,
    ArticleLabel Label, ArticleSource Source, DateOnly? UpdatedDate, bool IsDraft, ArticleReview Review)
{
    public bool ShowOnHome { get; init; }
}

public record ArticleListItem : ArticleCard
{
    public ArticleListItem(ArticleCard card, ArticleCategory category) : base(card) => Category = category;
    public ArticleCategory Category { get; }
}

public sealed record ArticleDetail : ArticleListItem
{
    public ArticleDetail(ArticleCard card, ArticleCategory category, string bodyHtml, string? safeAction,
        ArticleSeo seo, IReadOnlyList<ArticleCard> relatedArticles) : base(card, category)
    {
        BodyHtml = bodyHtml;
        SafeAction = safeAction;
        Seo = seo;
        RelatedArticles = relatedArticles;
    }

    public string BodyHtml { get; }
    public string? SafeAction { get; }
    public ArticleSeo Seo { get; }
    public IReadOnlyList<ArticleCard> RelatedArticles { get; }
}

public sealed record ArticlePage(ArticleCategory? Category, IReadOnlyList<ArticleListItem> Items,
    int Total, int Page, int PageSize, int TotalPages)
{
    public const int DefaultPageSize = 12;
    public const int MaxPageSize = 50;
}

public interface IPublishedArticleService
{
    IReadOnlyList<ArticleCategory> Categories(ArticleCategoryQuery? query = null);
    ArticlePage? List(ArticleQuery query);
    ArticleDetail? Detail(Guid articleId);
    ArticleDetail? DetailByPath(string path);
}
