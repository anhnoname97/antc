using Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Schema;

/// <summary>Gói Các rủi ro, Phụ lục A và QĐ-053–055. Giá trị suy ra không tạo ô nhập.</summary>
public static class RiskSchema
{
    public static readonly string[] PageAliases = ["ruiRoPage", "alertListPage", .. RiskStructure.GroupAliases];
    public static readonly string[] EditableAliases = [.. PageAliases, "riskArticlePage", "alertPage", "tacticItem", "topicItem"];
    private static Dictionary<string, object> C(params (string, object)[] pairs) => pairs.ToDictionary(x => x.Item1, x => x.Item2);
    public static IEnumerable<DataTypeSpec> DataTypes()
    {
        foreach (var p in new[] { ("Nhóm rủi ro", "riskCategoryPage", 1), ("Nhóm rủi ro · nhiều", "riskCategoryPage", 5),
                     ("Bài viết", "riskArticlePage", 1), ("Cảnh báo", "alertPage", 1), ("Việc cần làm", "viecCanLamPage", 1), ("Danh sách kiểm tra", "checklistPage", 1) })
            yield return new("Chọn · " + p.Item1, "Umbraco.MultiNodeTreePicker", "Antc.PropertyEditorUi.NodeCombobox",
                C(("minNumber", 0), ("maxNumber", p.Item3), ("filter", PortalV2Keys.ContentType(p.Item2).ToString()), ("ignoreUserStartNodes", false)));
        yield return new("Thẻ · Loạt bài", "Umbraco.Tags", "Umb.PropertyEditorUi.Tags", C(("group", "loatBai"), ("storageType", "Json")));
        yield return new("InlineList · Kịch bản rủi ro", "Antc.InlineList", "Antc.PropertyEditorUi.InlineList", C(
            ("layout", "cards"), ("maxRows", 6), ("sortable", true), ("summaryField", "tacticName"),
            ("fields", new object[] { C(("alias", "tacticName"), ("label", "Tên kịch bản"), ("type", "text"), ("maxChars", 140)),
                C(("alias", "steps"), ("label", "Diễn biến từng bước"), ("type", "lines"), ("required", true), ("maxRows", 8)) })));
        yield return new("InlineList · Nguồn tham khảo", "Antc.InlineList", "Antc.PropertyEditorUi.InlineList", C(
            ("layout", "table"), ("maxRows", 10), ("sortable", true),
            ("fields", new object[] { C(("alias", "title"), ("label", "Tên tài liệu"), ("type", "text"), ("required", true), ("maxChars", 200)),
                C(("alias", "organization"), ("label", "Đơn vị"), ("type", "text"), ("maxChars", 120)),
                C(("alias", "url"), ("label", "Liên kết"), ("type", "text"), ("pattern", "^https://.+$")),
                C(("alias", "accessedDate"), ("label", "Ngày truy cập"), ("type", "date"), ("placement", "extra")) })));
        foreach (string folder in new[] { "Bài viết", "Cảnh báo" })
        {
            var columns = folder == "Bài viết" ? new[] { ("primaryGroup", "Nhóm chính"), ("articleKind", "Loại bài"), ("topic", "Chuyên đề"), ("isFeatured", "Ghim"), ("reviewDate", "Ngày rà soát") }
                : [("cautionLevel", "Mức độ"), ("popularity", "Phổ biến"), ("updatedDate", "Ngày cập nhật")];
            yield return new(PortalV2Schema.ListViewName(folder), "Umbraco.ListView", "Umb.PropertyEditorUi.Collection", C(
                ("includeProperties", columns.Select(x => C(("alias", x.Item1), ("header", x.Item2), ("isSystem", false))).ToArray()),
                ("pageSize", 20), ("orderBy", "sortOrder"), ("orderDirection", "asc"), ("tabName", "Danh sách")));
        }
    }
    private static PropertySpec P(string alias, string label, string dataType, bool required = false, string? hint = null)
        => new(alias, label, dataType, hint, required, required ? "Vui lòng nhập " + label.ToLowerInvariant() + "." : null);
    public static IEnumerable<ContentTypeSpec> ContentTypes()
    {
        string[] compositions = ["seoBase", "publishMetaBase", "illustrationBase"];
        yield return new("ruiRoPage", "Các rủi ro", "icon-shield", "Trang cố định, chuyển hướng 301 tới Cảnh báo mới.", "noiDung", "Nội dung",
            [P("title", "Tiêu đề", PortalV2Schema.Text(90), true), P("lead", "Mô tả", PortalV2Schema.Area(220))],
            Compositions: ["seoBase", "publishMetaBase"], AllowedChildren: []);
        yield return new("alertListPage", "Cảnh báo mới", "icon-megaphone", "Cảnh báo được thêm ở Quản lý nội dung › Cảnh báo.", "noiDung", "Nội dung",
            [P("title", "Tiêu đề", PortalV2Schema.Text(90), true), P("lead", "Câu dẫn", PortalV2Schema.Area(220), true),
                P("showSampleNote", "Dòng “Mẫu trình bày”", PortalV2Schema.Toggle)], Compositions: compositions);
        foreach (var group in RiskStructure.Pages.Skip(2))
        yield return new(group.Alias, group.Name, "icon-folder", "Nhóm rủi ro hiện có của Portal V2. Thứ tự tab theo thứ tự trên cây.", "noiDung", "Nội dung",
            [P("tabName", "Tên tab", PortalV2Schema.Text(28), true), P("cardDescription", "Mô tả ngắn trên thẻ trang chủ", PortalV2Schema.Text(60), true),
                P("lead", "Câu dẫn đầu trang", PortalV2Schema.Area(220), true), P("icon", "Biểu tượng", DanhMucCoDinh.BieuTuong.DataTypeName, true),
                P("thumbnail", "Ảnh thu nhỏ", PortalV2Schema.Image, hint: "Ảnh trên thẻ nhóm ở trang chủ."),
                P("showAdviceBox", "Hộp “Website không tư vấn tài chính”", PortalV2Schema.Toggle, hint: "Chữ trong hộp sửa ở Cài đặt website › Câu cố định."),
                P("umbracoUrlName", "Đường dẫn", PortalV2Schema.Text(90))], Compositions: compositions);
        yield return new("riskArticlePage", "Bài viết", "icon-document", "Bài hướng dẫn, bài đọc chuyên đề hoặc bài đọc thêm.", "vietBai", "Viết bài",
            [P("title", "Tiêu đề", PortalV2Schema.Text(110), true), P("description", "Một câu mời đọc", PortalV2Schema.Area(160)),
                P("summary", "Tóm tắt", PortalV2Schema.RteBold), P("warningSigns", "Dấu hiệu cảnh báo", PortalV2Schema.Lines(0, 8)),
                // Bai huong dan (V2-13i): hai khoi dau phan Tom tat cua ban dung v2. "Ai thuong bi nham den" tu suy ra tu Doi tuong › Thu doan.
                P("rememberLine", "Nhớ một câu", PortalV2Schema.Text(160), hint: "Một câu ngắn người đọc phải nhớ. Hiện đầu phần Tóm tắt của bài hướng dẫn."),
                P("mustAsk", "Câu hỏi phải hỏi", PortalV2Schema.Area(300), hint: "Hiện trong khung xanh dưới “Nhớ một câu”."),
                P("actionsNow", "Việc cần làm ngay", PortalV2Schema.Lines(0, 6)), P("scenarios", "Kịch bản thường gặp", "InlineList · Kịch bản rủi ro"),
                P("avoidActions", "Việc không nên làm", PortalV2Schema.Lines(0, 6)), P("readingBody", "Nội dung", PortalV2Schema.RteReading),
                P("references", "Nguồn tham khảo", "InlineList · Nguồn tham khảo"), P("series", "Loạt bài", "Thẻ · Loạt bài"),
                P("primaryGroup", "Đăng ở nhóm", "Chọn · Nhóm rủi ro", true), P("articleKind", "Loại bài", DanhMucCoDinh.LoaiBai.DataTypeName, true),
                P("topic", "Chuyên đề", "Chọn · Chuyên đề"), P("actionPage", "Dẫn tới trang việc cần làm", "Chọn · Việc cần làm"),
                P("isFeatured", "Ghim đầu nhóm", PortalV2Schema.Toggle), P("alsoInCategories", "Hiện thêm ở nhóm", "Chọn · Nhóm rủi ro · nhiều"),
                P("searchKeywords", "Từ người dân hay gõ khi tìm", PortalV2Schema.Keywords), P("synonyms", "Từ cùng nghĩa", PortalV2Schema.Synonyms),
                P("reviewDate", "Ngày rà soát", PortalV2Schema.Date), P("reviewer", "Người thẩm định", PortalV2Schema.Text(120)),
                P("version", "Phiên bản", PortalV2Schema.Text(20))], Compositions: compositions);
        yield return new("alertPage", "Cảnh báo", "icon-megaphone", "Cảnh báo mới trong 90 ngày; tự gỡ mặc định sau 180 ngày.", "vietCanhBao", "Viết cảnh báo",
            [P("title", "Tiêu đề", PortalV2Schema.Text(110), true), P("description", "Tóm tắt", PortalV2Schema.Area(160), true),
                P("scenarioSteps", "Kịch bản thường gặp", PortalV2Schema.Lines(0, 5), hint: "3–5 bước, theo thứ tự xảy ra. Cần khi đăng."),
                P("stopSigns", "Dấu hiệu phải dừng", "Chọn · Dấu hiệu phải dừng"), P("otherSigns", "Dấu hiệu khác", PortalV2Schema.Lines(0, 4)),
                P("actionPage", "Việc cần làm: trang", "Chọn · Việc cần làm"), P("issuingAgency", "Cơ quan ban hành", PortalV2Schema.Text(120)),
                P("documentNumber", "Số văn bản", PortalV2Schema.Text(40)), P("documentDate", "Ngày văn bản", PortalV2Schema.Date),
                P("documentUrl", "Liên kết văn bản gốc", PortalV2Schema.HttpsLink), P("updatedDate", "Ngày cập nhật", PortalV2Schema.Date, true),
                P("cautionLevel", "Mức độ cần thận trọng", DanhMucCoDinh.MucDo.DataTypeName, true), P("popularity", "Mức độ phổ biến", "Chọn · Mức độ phổ biến", true),
                P("popularityBasis", "Căn cứ mức độ phổ biến", PortalV2Schema.Text(160)), P("tactics", "Thủ đoạn", "Chọn · Thủ đoạn"),
                P("channels", "Kênh", "Chọn · Kênh"), P("audiences", "Ai dễ bị nhắm tới", "Chọn · Đối tượng"),
                P("searchKeywords", "Từ khóa tìm kiếm", PortalV2Schema.Keywords), P("autoUnpublishDays", "Tự gỡ sau (ngày)", PortalV2Schema.Number(30, 720), true)], Compositions: compositions);
        yield return new("articleFolder", "Bài viết", "icon-folder", "Thêm, sửa các bài viết của Các rủi ro.", "noiDung", "Nội dung", [],
            AllowedChildren: ["riskArticlePage"], ListViewDataType: PortalV2Schema.ListViewName("Bài viết"));
        yield return new("alertFolder", "Cảnh báo", "icon-folder", "Thêm, sửa cảnh báo.", "noiDung", "Nội dung", [],
            AllowedChildren: ["alertPage"], ListViewDataType: PortalV2Schema.ListViewName("Cảnh báo"));
    }
}
