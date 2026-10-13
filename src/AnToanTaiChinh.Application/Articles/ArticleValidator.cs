namespace AnToanTaiChinh.Application.Articles;

public static class ArticleValidator
{
    public const int MaximumPageSize = 100;

    public static void ValidatePagination(int page, int pageSize)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(page, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(pageSize, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(pageSize, MaximumPageSize);
    }

    public static string ValidateSlug(string slug)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        return slug.Trim().ToLowerInvariant();
    }
}
