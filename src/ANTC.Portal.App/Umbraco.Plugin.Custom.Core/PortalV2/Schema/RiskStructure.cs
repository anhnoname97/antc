namespace Umbraco.Plugin.Custom.Core.PortalV2.Schema;

/// <summary>Existing pages introduced by AnVu29 in 8b6d63bc. Never generate a second set of page keys.</summary>
public static class RiskStructure
{
    public sealed record Page(string MockupId, Guid Key, string Alias, string Name, int Order);
    public static readonly Guid HomeKey = new("d660b5ab-7cd1-48b5-b6e1-1ab56b8218cd");
    public static readonly Page[] Pages =
    [
        new("rui-ro", new("2f0dfb61-9591-4d14-970a-6be6f7d4b28c"), "ruiRoPage", "Các rủi ro", 11),
        new("canh-bao-moi", new("540fecd6-015a-4585-b896-d6272108aab0"), "alertListPage", "Cảnh báo mới", 0),
        new("g-lua-dao", new("340daab5-ee51-4f38-8415-01eb5345de72"), "luaDaoPage", "Lừa đảo", 1),
        new("g-vay-va-no", new("117dc275-7007-4fda-9749-090a3d934633"), "vayVaNoPage", "Vay và nợ", 2),
        new("g-dau-tu", new("16a62a3c-0d74-4a5b-b607-81ba7056dec5"), "dauTuPage", "Đầu tư", 3),
        new("g-du-lieu-ca-nhan", new("c2543936-24cb-4ef7-b9ed-8bd30070d7a4"), "duLieuCaNhanPage", "Dữ liệu cá nhân", 4),
        new("g-bao-hiem-va-tiet-kiem", new("b12c0f34-008b-4889-809b-9aeeada902c4"), "baoHiemVaTietKiemPage", "Bảo hiểm và tiết kiệm", 5)
    ];
    public static readonly string[] GroupAliases = Pages.Skip(2).Select(x => x.Alias).ToArray();
    public static string LogicalAlias(string alias) => GroupAliases.Contains(alias) ? "riskCategoryPage" : alias;
    /// <summary>Thu muc Quan ly noi dung › Bai viet.</summary>
    public static readonly Guid ArticleFolderKey = new("77e2e4a9-012b-5566-8542-d033c9c38827");
    /// <summary>Thu muc Thu vien › Chuyen de.</summary>
    public static readonly Guid TopicFolderKey = new("6983fbcd-c754-55d9-a26c-df81a26984cd");

    /// <summary>Doan duong dan cua nhom, vi du "lua-dao" (QD-053: /cac-rui-ro/nhom/bai).</summary>
    public static string Slug(Page group) => group.MockupId["g-".Length..];

    /// <summary>Tim nhom tu gia tri luu cua o chon nhom, dang umb://document/khoa; khong phu thuoc trang nhom da xuat ban chua.</summary>
    public static Page? GroupOf(object? pickerValue)
    {
        string? first = pickerValue?.ToString()?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        return Guid.TryParse(first?.Split('/')[^1], out Guid key) ? Pages.Skip(2).FirstOrDefault(x => x.Key == key) : null;
    }

    internal static readonly AsyncLocal<bool> Reconciling = new();
}
