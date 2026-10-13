using AnToanTaiChinh.Application.Common;

namespace AnToanTaiChinh.Application.Articles;

public interface IArticleService
{
    Task<PagedResult<ArticleDto>> GetPublishedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<ArticleDto?> GetPublishedBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default);
}
