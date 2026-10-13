using AnToanTaiChinh.Domain.Entities;
using AnToanTaiChinh.Domain.Enums;
using AnToanTaiChinh.Domain.Exceptions;
using AnToanTaiChinh.Domain.ValueObjects;

namespace AnToanTaiChinh.Tests.Unit.Domain;

public sealed class ArticleTests
{
    [Fact]
    public void Publish_DraftArticle_MarksArticleAsPublished()
    {
        var article = new Article(Guid.NewGuid(), "An toàn tài chính", Slug.Create("an-toan-tai-chinh"));
        var publishedAt = new DateTimeOffset(2026, 10, 12, 3, 0, 0, TimeSpan.Zero);

        article.Publish(publishedAt);

        Assert.Equal(ArticleStatus.Published, article.Status);
        Assert.Equal(publishedAt, article.PublishedAtUtc);
    }

    [Fact]
    public void Publish_ArchivedArticle_ThrowsDomainValidationException()
    {
        var article = new Article(Guid.NewGuid(), "An toàn tài chính", Slug.Create("an-toan-tai-chinh"));
        article.Archive();

        Assert.Throws<DomainValidationException>(() => article.Publish(DateTimeOffset.UtcNow));
    }
}
