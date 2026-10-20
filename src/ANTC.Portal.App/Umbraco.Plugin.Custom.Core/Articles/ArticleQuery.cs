namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed record ArticleQuery(Guid? CategoryId = null, string? Search = null, string? Label = null,
    DateOnly? UpdatedFrom = null, DateOnly? UpdatedTo = null, string? ReviewStatus = null, bool? IsDraft = null,
    int Page = 1, int PageSize = ArticlePage.DefaultPageSize, string? Sort = null,
    bool? ShowOnHome = null, string? Section = null, string? CategoryRole = null, bool? IsField = null,
    bool? HasImage = null, string? SourceAgency = null, IReadOnlyList<Guid>? ExcludeIds = null)
{
    public const int MaxSearchLength = 200;
    public const int MaxExcludedIds = 50;
    public string? SearchTerm => Text(Search);
    public string? LabelFilter => Text(Label);
    public string? ReviewStatusFilter => Text(ReviewStatus);
    public string SortOrder => Text(Sort) ?? "updated-desc";
    public string? SectionFilter => Text(Section);
    public string? CategoryRoleFilter => Text(CategoryRole);
    public string? SourceAgencyFilter => Text(SourceAgency);

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
        if (SectionFilter is { } section && section is not ("fraud" or "policy"))
            fields["section"] = "Chọn fraud (Thủ đoạn) hoặc policy (Chính sách).";
        if (CategoryRoleFilter is { } role && role is not ("none" or "warning" or "topic" or "series" or "policy"))
            fields["categoryRole"] = "Chọn none, warning, topic, series hoặc policy.";
        if (SourceAgencyFilter?.Length > MaxSearchLength)
            fields["sourceAgency"] = "Tên cơ quan nguồn tối đa 200 ký tự.";
        if (ExcludeIds?.Count > MaxExcludedIds)
            fields["excludeIds"] = "Chỉ được loại trừ tối đa 50 ID bài viết.";
        else if (ExcludeIds?.Contains(Guid.Empty) == true)
            fields["excludeIds"] = "ID bài viết cần loại trừ phải là Guid khác rỗng.";
        return fields;
    }

    private static string? Text(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
