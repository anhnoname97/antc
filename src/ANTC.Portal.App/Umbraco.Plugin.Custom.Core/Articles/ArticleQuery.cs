namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed record ArticleQuery(Guid? CategoryId = null, string? Search = null, string? Label = null,
    DateOnly? UpdatedFrom = null, DateOnly? UpdatedTo = null, string? ReviewStatus = null, bool? IsDraft = null,
    int Page = 1, int PageSize = ArticlePage.DefaultPageSize, string? Sort = null)
{
    public const int MaxSearchLength = 200;
    public string? SearchTerm => Text(Search);
    public string? LabelFilter => Text(Label);
    public string? ReviewStatusFilter => Text(ReviewStatus);
    public string SortOrder => Text(Sort) ?? "updated-desc";

    public IReadOnlyDictionary<string, string> Validate()
    {
        var fields = new Dictionary<string, string>();
        if (CategoryId == Guid.Empty) fields["categoryId"] = "Chọn khóa danh mục hợp lệ.";
        if (SearchTerm?.Length > MaxSearchLength) fields["search"] = "Từ khóa tối đa 200 ký tự.";
        if (LabelFilter is { } label && label is not ("none" or "official-warning" or "unverified"))
            fields["label"] = "Chọn none, official-warning hoặc unverified.";
        if (UpdatedFrom > UpdatedTo) fields["updatedTo"] = "Ngày kết thúc phải từ ngày bắt đầu trở đi.";
        if (ReviewStatusFilter is { } review && review is not ("overdue" or "current" or "unreviewed"))
            fields["reviewStatus"] = "Chọn overdue, current hoặc unreviewed.";
        if (Page < 1) fields["page"] = "Số trang phải từ 1 trở lên.";
        if (PageSize is < 1 or > ArticlePage.MaxPageSize) fields["pageSize"] = "Số bài mỗi trang phải từ 1 đến 50.";
        if (SortOrder is not ("updated-desc" or "updated-asc" or "title-asc" or "title-desc"))
            fields["sort"] = "Chọn updated-desc, updated-asc, title-asc hoặc title-desc.";
        return fields;
    }

    private static string? Text(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
