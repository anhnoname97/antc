namespace AnToanTaiChinh.Application.Articles;

public sealed record ArticleDto(
    Guid Id,
    string Title,
    string Slug,
    string? Summary,
    DateTimeOffset? PublishedAtUtc);
