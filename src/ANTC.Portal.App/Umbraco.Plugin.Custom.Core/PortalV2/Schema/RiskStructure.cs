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
    internal static readonly AsyncLocal<bool> Reconciling = new();
}
