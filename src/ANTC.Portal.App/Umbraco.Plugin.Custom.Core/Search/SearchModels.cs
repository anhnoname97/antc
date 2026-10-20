namespace Umbraco.Plugin.Custom.Core.Search;

public sealed record SiteSearchItem(string Type, string Title, string Url, IReadOnlyList<SearchTextPart> Snippet);
public sealed record SiteSearchResult(string Query, IReadOnlyList<SiteSearchItem> Items, int Total, int Page,
    string? Guidance = null)
{
    public const int PageSize = 10;
    public int TotalPages => (int)Math.Ceiling(Total / (double)PageSize);
}

public interface ISiteSearchService
{
    Task<SiteSearchResult> SearchAsync(string? query, int page = 1, CancellationToken ct = default);
}

public static class SearchFields
{
    public const string Text = "antcSearchText";
    public const string Version = "antcSearchVersion";
    public const string SchemaVersion = "1";
    public const string QuestionCategory = "content";
    public const string QuestionType = "publishedQuestion";
    public const string QuestionPrefix = "antc-question-";
    public static bool IsPage(string alias) => alias is "home" or "ungPhoPage" or "thuDoanPage" or "thamGiaPage"
        or "thiThuPage" or "thiPage" or "hoiDapPage" or "chinhSachPage";
}
