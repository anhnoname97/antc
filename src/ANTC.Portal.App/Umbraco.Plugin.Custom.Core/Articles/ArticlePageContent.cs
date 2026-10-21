namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed record ArticleBreadcrumb(string Title, string Url);
public sealed record ArticleContentPage(Guid Id, string Title, string Url, ArticleSeo Seo,
    IReadOnlyList<ArticleBreadcrumb> Breadcrumbs);
public sealed record ArticleContentLink(string Title, string Url, string? Target);
public sealed record ArticleHeroContent(string Eyebrow, string Title, string? HighlightTitle,
    string Description, ArticleImage? Image);
public sealed record ArticleContentHeading(string Eyebrow, string Title, string? HighlightTitle, string Description);
public sealed record ArticleInformationItem(Guid Id, string Title, string Description, string? IconKey, bool IsWarning);
public sealed record ArticleInformationSection(ArticleContentHeading Heading,
    IReadOnlyList<ArticleInformationItem> Items, string? Note, ArticleContentLink? NoteLink);
public sealed record ArticleSearchContent(string Label, string Placeholder, string SubmitLabel,
    string PrivacyNote, string EmptyMessage);
public sealed record ArticleNextContent(string Eyebrow, string Title, string Description,
    ArticleContentLink? PrimaryLink, ArticleContentLink? SecondaryLink);

/// <summary>Nội dung biên tập của trang Thủ đoạn; không chứa cấu hình bố cục hoặc giới hạn các khối FE.</summary>
public sealed record FraudPageContent(ArticleContentPage Page, ArticleHeroContent Hero, ArticleSearchContent Search,
    ArticleInformationSection Objectives, ArticleInformationSection Methods,
    ArticleContentHeading Categories, ArticleContentHeading Alerts, string ReadingActionLabel,
    string EmptyCategoryLabel, string ArticleCountLabel, ArticleNextContent Next);

public sealed record PolicyPageContent(ArticleContentPage Page, ArticleHeroContent Hero,
    string? DraftNotice, string EmptyMessage, int PublishedArticleCount, int DraftArticleCount);
