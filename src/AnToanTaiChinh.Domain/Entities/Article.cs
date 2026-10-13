using AnToanTaiChinh.Domain.Enums;
using AnToanTaiChinh.Domain.Exceptions;
using AnToanTaiChinh.Domain.ValueObjects;

namespace AnToanTaiChinh.Domain.Entities;

public sealed class Article
{
    public Guid Id { get; }
    public string Title { get; private set; }
    public string? Summary { get; private set; }
    public Slug Slug { get; private set; }
    public ArticleStatus Status { get; private set; }
    public DateTimeOffset? PublishedAtUtc { get; private set; }

    public Article(Guid id, string title, Slug slug, string? summary = null)
    {
        if (id == Guid.Empty)
        {
            throw new DomainValidationException("Article identifier is required.");
        }

        Id = id;
        Title = ValidateTitle(title);
        Slug = slug;
        Summary = summary?.Trim();
        Status = ArticleStatus.Draft;
    }

    public void Publish(DateTimeOffset publishedAtUtc)
    {
        if (Status == ArticleStatus.Archived)
        {
            throw new DomainValidationException("An archived article cannot be published.");
        }

        Status = ArticleStatus.Published;
        PublishedAtUtc = publishedAtUtc.ToUniversalTime();
    }

    public void Archive() => Status = ArticleStatus.Archived;

    private static string ValidateTitle(string title)
    {
        string normalized = title?.Trim()
            ?? throw new DomainValidationException("Article title is required.");

        if (normalized.Length is < 1 or > 250)
        {
            throw new DomainValidationException("Article title must contain 1 to 250 characters.");
        }

        return normalized;
    }
}
