using Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Schema;

/// <summary>Khai bao mot data type. Khoa = PortalV2Keys.DataType(Name).</summary>
public sealed record DataTypeSpec(string Name, string EditorAlias, string EditorUiAlias, Dictionary<string, object> Config);

/// <summary>Khai bao mot thuoc tinh. Tab lay tu ContentTypeSpec.</summary>
public sealed record PropertySpec(string Alias, string Name, string DataTypeName, string? Description = null,
    bool Mandatory = false, string? MandatoryMessage = null, string? Regex = null, string? RegexMessage = null);

/// <summary>Khai bao mot loai noi dung (khong template). Khoa = PortalV2Keys.ContentType(Alias).</summary>
public sealed record ContentTypeSpec(string Alias, string Name, string Icon, string Description,
    string TabAlias, string TabName, IReadOnlyList<PropertySpec> Properties,
    bool IsComposition = false, bool AllowedAsRoot = false,
    IReadOnlyList<string>? Compositions = null, IReadOnlyList<string>? AllowedChildren = null, string? ListViewDataType = null);

/// <summary>
/// Schema nen cua Portal v2 (V2-01a → V2-01f), theo Phu luc A, B cua 1-thiet-ke.md.
/// Task sau (V2-02 tro di) them khai bao vao day hoac file rieng, khong sua tay file uSync.
/// </summary>
public static class PortalV2Schema
{
    public const string ImageMediaType = "cc07b313-0843-4aa8-bbda-871c8da728c8";
    public const string FileMediaType = "4c52d8ab-54e6-40cd-999c-7a5f24903e4d";
    public const string CodeRegex = "^[a-z0-9]+(-[a-z0-9]+)*$";

    private static Dictionary<string, object> C(params (string Key, object Value)[] items) => items.ToDictionary(x => x.Key, x => x.Value);

    // ---------- V2-01a: danh sach co dinh
    public static IEnumerable<DataTypeSpec> FixedLists() => DanhMucCoDinh.All.Select(list => new DataTypeSpec(list.DataTypeName,
        "Umbraco.DropDown.Flexible", "Umb.PropertyEditorUi.Dropdown",
        C(("items", list.Items.Select(x => x.Label).ToArray()), ("multiple", false))));

    // ---------- V2-01b: data type co ban
    public static readonly int[] TextLimits = [20, 28, 30, 32, 40, 60, 70, 80, 90, 110, 120, 140, 160, 200];
    public static readonly int[] AreaLimits = [120, 140, 160, 200, 220, 240, 300];
    public static readonly (int Min, int Max)[] LineRanges = [(0, 4), (0, 5), (0, 6), (0, 8), (3, 5)];

    public static string Text(int max) => "Chữ · " + max;
    public static string Area(int max) => "Đoạn · " + max;
    public static string Lines(int min, int max) => $"Danh sách dòng · {min}–{max}";
    public const string CodeText = "Chữ · Mã danh mục";
    public const string HttpsLink = "Chữ · Liên kết https";
    public const string Date = "Ngày";
    public const string Toggle = "Bật/tắt";
    public const string ToggleOn = "Bật/tắt · mặc định bật";
    public const string Keywords = "Thẻ · Từ khóa";
    public const string Synonyms = "Thẻ · Từ đồng nghĩa";
    public const string Image = "Chọn ảnh";
    public const string Pdf = "Chọn tệp PDF";
    public static string Number(int min, int max) => $"Số · {min}–{max}";

    public static IEnumerable<DataTypeSpec> Basic()
    {
        foreach (int n in TextLimits) yield return new(Text(n), "Umbraco.TextBox", "Umb.PropertyEditorUi.TextBox", C(("maxChars", n)));
        foreach (int n in AreaLimits) yield return new(Area(n), "Umbraco.TextArea", "Umb.PropertyEditorUi.TextArea", C(("maxChars", n), ("rows", 3)));
        yield return new(CodeText, "Umbraco.TextBox", "Umb.PropertyEditorUi.TextBox", C(("maxChars", 40)));
        yield return new(HttpsLink, "Umbraco.TextBox", "Umb.PropertyEditorUi.TextBox", C(("maxChars", 500)));
        foreach (var (min, max) in new[] { (1, 3), (1, 8), (30, 720) })
            yield return new(Number(min, max), "Umbraco.Integer", "Umb.PropertyEditorUi.Integer", C(("min", min), ("max", max), ("step", 1)));
        yield return new(Date, "Umbraco.DateTime", "Umb.PropertyEditorUi.DatePicker", C(("format", "YYYY-MM-DD")));
        yield return new(Toggle, "Umbraco.TrueFalse", "Umb.PropertyEditorUi.Toggle", C(("default", false)));
        yield return new(ToggleOn, "Umbraco.TrueFalse", "Umb.PropertyEditorUi.Toggle", C(("default", true)));
        foreach (var (min, max) in LineRanges)
            yield return new(Lines(min, max), "Umbraco.MultipleTextstring", "Umb.PropertyEditorUi.MultipleTextString", C(("min", min), ("max", max)));
        yield return new(Keywords, "Umbraco.Tags", "Umb.PropertyEditorUi.Tags", C(("group", "tuKhoa"), ("storageType", "Json")));
        yield return new(Synonyms, "Umbraco.Tags", "Umb.PropertyEditorUi.Tags", C(("group", "dongNghia"), ("storageType", "Json")));
        yield return new(Image, "Umbraco.MediaPicker3", "Umb.PropertyEditorUi.MediaPicker",
            C(("filter", ImageMediaType), ("multiple", false), ("validationLimit", C(("min", 0), ("max", 1)))));
        yield return new(Pdf, "Umbraco.MediaPicker3", "Umb.PropertyEditorUi.MediaPicker",
            C(("filter", FileMediaType), ("multiple", false), ("validationLimit", C(("min", 0), ("max", 1)))));
    }

    // ---------- V2-01c: soan thao
    public const string RteBold = "Soạn thảo · Chỉ in đậm";
    public const string RteShort = "Soạn thảo · Rút gọn";
    public const string RteReading = "Soạn thảo · Bài đọc";
    public const string PortalStyleMenu = "Antc.Tiptap.Toolbar.PortalStyles";

    public static IEnumerable<DataTypeSpec> RichText()
    {
        string[] essentials = ["Umb.Tiptap.RichTextEssentials", "Umb.Tiptap.Bold", "Umb.Tiptap.TrailingNode"];
        yield return Rte(RteBold, essentials, [["Umb.Tiptap.Toolbar.Bold"]], false);
        yield return Rte(RteShort, [.. essentials, "Umb.Tiptap.BulletList", "Umb.Tiptap.OrderedList"],
            [["Umb.Tiptap.Toolbar.Bold"], ["Umb.Tiptap.Toolbar.BulletList", "Umb.Tiptap.Toolbar.OrderedList"]], false);
        yield return Rte(RteReading,
            [.. essentials, "Umb.Tiptap.Italic", "Umb.Tiptap.Heading", "Umb.Tiptap.BulletList", "Umb.Tiptap.OrderedList",
             "Umb.Tiptap.Link", "Umb.Tiptap.Table", "Umb.Tiptap.HtmlTagDiv", "Umb.Tiptap.HtmlAttributeClass"],
            [["Umb.Tiptap.Toolbar.Heading3"], ["Umb.Tiptap.Toolbar.Bold", "Umb.Tiptap.Toolbar.Italic"],
             ["Umb.Tiptap.Toolbar.BulletList", "Umb.Tiptap.Toolbar.OrderedList"], ["Umb.Tiptap.Toolbar.Link", "Umb.Tiptap.Toolbar.Unlink"],
             ["Umb.Tiptap.Toolbar.Table"], [PortalStyleMenu], ["Umb.Tiptap.Toolbar.ClearFormatting"]], true);
    }

    private static DataTypeSpec Rte(string name, string[] extensions, string[][] toolbarGroups, bool portalCss)
    {
        var config = C(("extensions", extensions), ("toolbar", new[] { toolbarGroups }), ("overlaySize", "medium"), ("maxImageSize", 500));
        if (portalCss) config["stylesheets"] = new[] { "/css/rte-portal.css" };
        return new(name, "Umbraco.RichText", "Umb.PropertyEditorUi.Tiptap", config);
    }

    // ---------- V2-01f: chon nut trong Thu vien. Goc la khoa co dinh cua thu muc (khoa giong seed), khong dung Dynamic Root
    // vi Dynamic Root tinh goc tu trang dang sua, ma Thu vien la nut goc rieng.
    public static readonly (string Name, string Folder, string ItemType, int Max)[] LibraryPickers =
    [
        ("Chọn · Kênh", "f-ch", "channelItem", 7),
        ("Chọn · Đối tượng", "f-aud", "audienceItem", 5),
        ("Chọn · Dấu hiệu phải dừng", "f-sign", "stopSignItem", 6),
        ("Chọn · Mức độ phổ biến", "f-pop", "popularityItem", 1),
        ("Chọn · Chuyên đề", "f-topic", "topicItem", 1),
        ("Chọn · Thủ đoạn", "f-tac", "tacticItem", 8),
    ];

    public static IEnumerable<DataTypeSpec> Pickers() => LibraryPickers.Select(p => new DataTypeSpec(p.Name,
        "Umbraco.MultiNodeTreePicker", "Umb.PropertyEditorUi.ContentPicker",
        C(("startNode", C(("type", "content"), ("id", PortalV2Keys.Node(p.Folder).ToString()))),
          ("filter", PortalV2Keys.ContentType(p.ItemType).ToString()),
          ("minNumber", 0), ("maxNumber", p.Max), ("ignoreUserStartNodes", false))));

    // ---------- V2-01e: Collection cua thu muc
    public static readonly (string Folder, string Name, string Alias, string ItemType, string Icon)[] Folders =
    [
        ("f-ch", "Kênh tiếp cận", "channelFolder", "channelItem", "icon-globe"),
        ("f-aud", "Đối tượng", "audienceFolder", "audienceItem", "icon-users"),
        ("f-sign", "Dấu hiệu phải dừng", "stopSignFolder", "stopSignItem", "icon-stop"),
        ("f-pop", "Mức độ phổ biến", "popularityFolder", "popularityItem", "icon-bar-chart"),
        ("f-topic", "Chuyên đề", "topicFolder", "topicItem", "icon-book-alt"),
        ("f-tac", "Thủ đoạn", "tacticFolder", "tacticItem", "icon-tag"),
        ("f-qa", "Hỏi – đáp nhanh", "quickQaFolder", "quickQaItem", "icon-chat"),
        ("f-snip", "Đoạn dùng chung", "snippetFolder", "sharedSnippet", "icon-document"),
    ];

    public static string ListViewName(string folderName) => "Danh sách · " + folderName;

    public static IEnumerable<DataTypeSpec> ListViews()
    {
        foreach (var f in Folders)
        {
            var columns = new List<object>();
            if (f.Alias == "tacticFolder") columns.Add(C(("alias", "cautionLevel"), ("header", "Mức độ"), ("isSystem", false)));
            else if (f.Alias is not ("quickQaFolder" or "snippetFolder")) columns.Add(C(("alias", "code"), ("header", "Mã"), ("isSystem", false)));
            if (f.Alias is not ("quickQaFolder" or "snippetFolder")) columns.Add(C(("alias", "isActive"), ("header", "Đang dùng"), ("isSystem", false)));
            columns.Add(C(("alias", "updateDate"), ("header", "Cập nhật"), ("isSystem", true)));
            bool sortByTree = f.Alias is not ("tacticFolder" or "quickQaFolder");
            yield return new(ListViewName(f.Name), "Umbraco.ListView", "Umb.PropertyEditorUi.Collection", C(
                ("includeProperties", columns.ToArray()),
                ("layouts", new object[] { C(("name", "Danh sách"), ("collectionView", "Umb.CollectionView.Document.Table"), ("icon", "icon-list"), ("isSystem", true), ("selected", true)) }),
                ("orderBy", sortByTree ? "sortOrder" : "name"), ("orderDirection", "asc"), ("pageSize", 50), ("showContentFirst", false), ("tabName", "Danh sách")));
        }
    }

    // ---------- V2-01d: composition
    private static PropertySpec Code() => new("code", "Mã", CodeText,
        "Chữ thường không dấu, số, gạch ngang. Dùng trên địa chỉ lọc, ví dụ ?kenh=mang-xa-hoi. Khóa sau lần xuất bản đầu.",
        true, "Vui lòng nhập mã.", CodeRegex, "Mã chỉ gồm chữ thường không dấu, số và dấu gạch ngang.");
    private static PropertySpec IsActive() => new("isActive", "Đang dùng", ToggleOn, "Tắt thay cho xóa khi mục còn được dùng. Tắt thì mục không hiện ở bộ lọc và trình hỏi.");

    public static IEnumerable<ContentTypeSpec> Compositions()
    {
        yield return new("taxonomyBase", "Danh mục dùng chung", "icon-tag", "Mã, biểu tượng, trạng thái đang dùng của mọi mục danh mục.",
            "noiDung", "Nội dung",
            [Code(), new("icon", "Biểu tượng", DanhMucCoDinh.BieuTuong.DataTypeName, null, true, "Vui lòng chọn biểu tượng."), IsActive()],
            IsComposition: true);
        yield return new("publishMetaBase", "Thông tin cập nhật", "icon-calendar", "Ngày cập nhật hiển thị dưới tiêu đề trang.",
            "seo", "SEO",
            [new("displayUpdatedDate", "Ngày cập nhật hiển thị", Date, "Hiện dưới tiêu đề trang. Hẹn giờ đăng, gỡ dùng lịch có sẵn của Umbraco.")],
            IsComposition: true);
        // QD-052: anh minh hoa duoi tieu de trang. Bat buoc van ban thay the khi co anh kiem o V2-10a
        yield return new("illustrationBase", "Ảnh minh họa", "icon-picture", "Ảnh lớn dưới tiêu đề trang và văn bản thay thế.",
            "noiDung", "Nội dung",
            [new("illustration", "Ảnh minh họa", Image, "Ảnh lớn dưới tiêu đề trang."),
             new("illustrationAlt", "Văn bản thay thế", Text(160), "Tả nội dung ảnh cho người không xem được ảnh. Cần khi có ảnh.")],
            IsComposition: true);
    }

    /// <summary>Truong them vao composition seoBase dang co (giu alias cu, QD ve dat ten muc 2 cua 2-danh-muc...).</summary>
    public static readonly PropertySpec SeoCanonical = new("canonicalUrl", "Đường dẫn chuẩn", Text(200), "Trống thì tự đặt theo địa chỉ chính của trang.");

    // ---------- V2-01f: loai muc danh muc
    public static IEnumerable<ContentTypeSpec> LibraryItems()
    {
        string[] tax = ["taxonomyBase"];
        yield return new("channelItem", "Kênh tiếp cận", "icon-globe color-purple", "Tạo trong Thư viện › Kênh tiếp cận. Dùng để lọc và gắn vào bài, cảnh báo, thủ đoạn.",
            "noiDung", "Nội dung", [], Compositions: tax);
        yield return new("tacticItem", "Thủ đoạn", "icon-tag color-purple", "Tạo trong Thư viện › Thủ đoạn. Hiện thành thẻ trong Các rủi ro và tên tình huống của trình hỏi.",
            "noiDung", "Nội dung",
            [Code(), IsActive(),
             new("topic", "Chuyên đề", "Chọn · Chuyên đề", null, true, "Vui lòng chọn chuyên đề."),
             new("anchor", "Neo trong bài", Text(40), "Mã kịch bản trong bài, để tô sáng khi mở."),
             new("channels", "Kênh", "Chọn · Kênh", null, true, "Vui lòng chọn kênh."),
             new("cautionLevel", "Mức độ", DanhMucCoDinh.MucDo.DataTypeName, null, true, "Vui lòng chọn mức độ."),
             new("searchKeywords", "Từ khóa tìm kiếm", Keywords, "Gõ rồi Enter để thêm thẻ.")]);
        yield return new("audienceItem", "Đối tượng", "icon-users color-purple", "Tạo trong Thư viện › Đối tượng. Nhóm người dễ bị nhắm tới.",
            "noiDung", "Nội dung",
            [new("summary", "Mô tả ngắn", Area(120), null, true, "Vui lòng nhập mô tả ngắn."),
             new("tactics", "Thủ đoạn hay gặp", "Chọn · Thủ đoạn", "Tối đa 8. Kéo để sắp thứ tự.")], Compositions: tax);
        yield return new("stopSignItem", "Dấu hiệu phải dừng", "icon-stop color-purple", "Tạo trong Thư viện › Dấu hiệu phải dừng. Thêm, xóa cần Quản trị viên vì gắn với Điều 14.",
            "noiDung", "Nội dung",
            [new("signText", "Câu dấu hiệu", RteBold, "Chỉ in đậm.", true, "Vui lòng nhập câu dấu hiệu."),
             new("note", "Ghi chú phụ", Area(160))], Compositions: tax);
        yield return new("popularityItem", "Mức độ phổ biến", "icon-bar-chart color-purple", "Tạo trong Thư viện › Mức độ phổ biến (QĐ-038).",
            "noiDung", "Nội dung", [new("description", "Giải thích ngắn", Area(160), "Hiện khi rê chuột vào nhãn trên website.")], Compositions: tax);
        yield return new("topicItem", "Chuyên đề", "icon-book-alt color-purple", "Tạo trong Thư viện › Chuyên đề. Số chuyên đề nối với ngân hàng câu hỏi Cuộc thi.",
            "noiDung", "Nội dung",
            [new("topicNumber", "Số chuyên đề", Number(1, 8), "Từ 1 đến 8, không trùng. Khóa sau lần xuất bản đầu.", true, "Vui lòng nhập số chuyên đề."),
             new("shortName", "Tên ngắn", Text(40), "Cần khi đăng.")], Compositions: tax);
    }

    public static IEnumerable<ContentTypeSpec> LibraryFolders()
    {
        yield return new("libraryFolder", "Thư viện", "icon-folder", "Gốc của các danh mục. Không có trang trên website.",
            "noiDung", "Nội dung", [], AllowedAsRoot: true, AllowedChildren: Folders.Select(f => f.Alias).ToArray());
        string[] built = LibraryItems().Select(x => x.Alias).ToArray();
        foreach (var f in Folders)
            yield return new(f.Alias, f.Name, "icon-folder color-purple", $"Thư mục {f.Name} trong Thư viện. Không có trang trên website.",
                "noiDung", "Nội dung", [], AllowedChildren: built.Contains(f.ItemType) ? [f.ItemType] : [], ListViewDataType: ListViewName(f.Name));
    }

    public static IEnumerable<DataTypeSpec> AllDataTypes()
        => FixedLists().Concat(Basic()).Concat(RichText()).Concat(Pickers()).Concat(ListViews());

    public static IEnumerable<ContentTypeSpec> AllContentTypes()
        => Compositions().Concat(LibraryItems()).Concat(LibraryFolders());
}
