using AnToanTaiChinh.Application.Common;
using AnToanTaiChinh.Domain.Entities;

namespace AnToanTaiChinh.Application.Articles;

public sealed class ArticleService(IArticleRepository articleRepository) : IArticleService
{
    public async Task<PagedResult<ArticleDto>> GetPublishedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArticleValidator.ValidatePagination(page, pageSize);
        int skip = checked((page - 1) * pageSize);
        (IReadOnlyList<Article> items, int totalItems) =
            await articleRepository.GetPublishedAsync(skip, pageSize, cancellationToken);

        return new PagedResult<ArticleDto>(
            items.Select(ToDto).ToArray(),
            page,
            pageSize,
            totalItems);
    }

    public async Task<ArticleDto?> GetPublishedBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        string normalizedSlug = ArticleValidator.ValidateSlug(slug);
        Article? article = await articleRepository.GetPublishedBySlugAsync(
            normalizedSlug,
            cancellationToken);

        return article is null ? null : ToDto(article);
    }

    private static ArticleDto ToDto(Article article) => new(
        article.Id,
        article.Title,
        article.Slug.Value,
        article.Summary,
        article.PublishedAtUtc);
}
