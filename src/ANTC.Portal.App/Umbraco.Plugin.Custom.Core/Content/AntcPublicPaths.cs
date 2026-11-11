using System.Text.Json;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Core.Content;

/// <summary>Đường dẫn công khai không chứa các nút tổ chức cây quản trị.</summary>
public static class AntcPublicPaths
{
    private static readonly IReadOnlyDictionary<string, string> FixedPaths = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["home"] = "/", ["ungPhoPage"] = "/khan-cap/", ["thuDoanPage"] = "/thu-doan/",
        ["thamGiaPage"] = "/tham-gia/", ["thiThuPage"] = "/thu-suc/", ["thiPage"] = "/cuoc-thi-truc-tuyen/",
        ["thiThangPage"] = "/cuoc-thi/", ["cuocThiLamBaiPage"] = "/thi/",
        ["hoiDapPage"] = "/hoi-dap/", ["chinhSachPage"] = "/chinh-sach/", ["searchPage"] = "/tim-kiem/",
        ["congCuPage"] = "/hay-tu-kiem-tra/",
        ["wizardPage"] = "/khan-cap/kiem-tra/",
        ["situationChooserPage"] = "/khan-cap/chon-tinh-huong/",
        ["foundationLibraryPage"] = "/thu-vien/",
        ["lienHePage"] = "/lien-he/",
        ["gopYPage"] = "/gop-y/",
        ["baoVeDuLieuCaNhanPage"] = "/chinh-sach-bao-mat/", ["mienTruTrachNhiemPage"] = "/dieu-khoan-su-dung/",
        ["nguyenTacNoiDungPage"] = "/nguyen-tac-noi-dung/", ["baoLoiVaCaiChinhPage"] = "/cach-bao-loi-va-cai-chinh/",
        ["xacMinhDungTrangPage"] = "/xac-minh-dung-trang/",
        ["truocKhiChuyenTienPage"] = "/hay-tu-kiem-tra/truoc-khi-chuyen-tien/",
        ["truocKhiDauTuVayPage"] = "/hay-tu-kiem-tra/truoc-khi-dau-tu-vay/",
        ["khiNghiBiLuaPage"] = "/hay-tu-kiem-tra/khi-nghi-bi-lua/",
        ["ruiRoPage"] = "/cac-rui-ro/",
        ["alertListPage"] = AlertListPath
    };

    /// <summary>Trang Canh bao moi; /cac-rui-ro/ chuyen huong 301 ve day (V2-13h).</summary>
    public const string AlertListPath = "/cac-rui-ro/canh-bao-moi/";

    /// <summary>Duong dan trang nhom rui ro theo QD-053, vi du /cac-rui-ro/lua-dao/.</summary>
    public static string? RiskGroupPath(string alias) =>
        RiskStructure.Pages.Skip(2).FirstOrDefault(x => x.Alias == alias) is { } group ? $"/cac-rui-ro/{RiskStructure.Slug(group)}/" : null;

    public static bool IsManagement(string alias) =>
        alias is "antc" or "pageManagement" or "contentManagement" or "articleManagement"
            or "fraudContent" or "policyContent" or "checklistFolderV2" or "actionFolder";

    public static string? LegacyEmergencyPath(string path) => path.Trim('/').ToLowerInvariant() switch
    {
        "ung-pho" => "/khan-cap/",
        "ung-pho/kiem-tra" => "/khan-cap/kiem-tra/",
        _ => null
    };

    public static string? FixedAlias(string path)
    {
        var trimmed = path.Trim('/');
        if (string.Equals(trimmed, "cuoc-thi-thang", StringComparison.OrdinalIgnoreCase))
            return "thiThangPage";
        if (string.Equals(trimmed, "cuoc-thi/lam-bai", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trimmed, "cuoc-thi/dang-ky", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trimmed, "dang-ky", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trimmed, "thi", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trimmed, "ngan-hang", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trimmed, "lam-bai", StringComparison.OrdinalIgnoreCase))
            return "cuocThiLamBaiPage";
        return FixedPaths
            .FirstOrDefault(x => string.Equals(x.Value.Trim('/'), trimmed, StringComparison.OrdinalIgnoreCase)).Key;
    }

    public static string? SelfCheckGuidancePath(string? slug) =>
        !string.IsNullOrWhiteSpace(slug) && System.Text.RegularExpressions.Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$")
            ? $"/hay-tu-kiem-tra/huong-dan/{slug}/" : null;

    public static string? SelfCheckReadingPath(string? number) =>
        int.TryParse(number, out var n) && n is >= 1 and <= 8 ? $"/hay-tu-kiem-tra/bai-doc/chuyen-de-{n}/" : null;

    public static string? SelfCheckChecklistPath(string? slug) =>
        !string.IsNullOrWhiteSpace(slug) && System.Text.RegularExpressions.Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$")
            ? $"/hay-tu-kiem-tra/{slug}/" : null;

    public static bool IsPolicyLibrary(string alias, string? listRole)
    {
        if (alias != "articleList" || string.IsNullOrWhiteSpace(listRole)) return false;
        // Dropdown đơn có thể trả về JSON array khi đọc qua Value<string>.
        if (listRole.TrimStart().StartsWith('['))
        {
            try { listRole = JsonSerializer.Deserialize<string[]>(listRole)?.FirstOrDefault(); }
            catch (JsonException) { return false; }
        }
        return listRole?.Trim() == "Chính sách";
    }

    public static string? GetPath(string alias, string? segment, string? parentPath = null, string? listRole = null)
    {
        if (FixedPaths.TryGetValue(alias, out string? path)) return path;
        if (RiskGroupPath(alias) is { } groupPath) return groupPath;
        if (IsPolicyLibrary(alias, listRole)) return "/chinh-sach/";
        if (string.IsNullOrWhiteSpace(segment)) return null;
        return alias switch
        {
            "foundationArticlePage" => $"/thu-vien/{segment}/",
            "articleList" => $"/thu-doan/{segment}/",
            "article" or "riskArticlePage" when parentPath is not null => $"{parentPath.TrimEnd('/')}/{segment}/",
            "qaItem" => $"/hoi-dap/{segment}/",
            "alertPage" => $"{AlertListPath}{segment}/",
            _ => null
        };
    }
}
