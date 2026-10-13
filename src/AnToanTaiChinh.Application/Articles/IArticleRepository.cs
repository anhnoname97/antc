using AnToanTaiChinh.Domain.Entities;

namespace AnToanTaiChinh.Application.Articles;

public interface IArticleRepository
{
    Task<(IReadOnlyList<Article> Items, int TotalItems)> GetPublishedAsync(
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<Article?> GetPublishedBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default);
}
