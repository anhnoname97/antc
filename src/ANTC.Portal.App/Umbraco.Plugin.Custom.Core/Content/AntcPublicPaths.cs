using System.Text.Json;

namespace Umbraco.Plugin.Custom.Core.Content;

/// <summary>Đường dẫn công khai không chứa các nút tổ chức cây quản trị.</summary>
public static class AntcPublicPaths
{
    private static readonly IReadOnlyDictionary<string, string> FixedPaths = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["home"] = "/", ["ungPhoPage"] = "/ung-pho/", ["thuDoanPage"] = "/thu-doan/",
        ["thamGiaPage"] = "/tham-gia/", ["thiThuPage"] = "/thu-suc/", ["thiPage"] = "/cuoc-thi/",
        ["hoiDapPage"] = "/hoi-dap/", ["chinhSachPage"] = "/chinh-sach/", ["searchPage"] = "/tim-kiem/"
    };

    public static bool IsManagement(string alias) =>
        alias is "antc" or "pageManagement" or "contentManagement" or "articleManagement";

    public static string? FixedAlias(string path) => FixedPaths
        .FirstOrDefault(x => string.Equals(x.Value.Trim('/'), path.Trim('/'), StringComparison.OrdinalIgnoreCase)).Key;

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
        if (IsPolicyLibrary(alias, listRole)) return "/chinh-sach/";
        if (string.IsNullOrWhiteSpace(segment)) return null;
        return alias switch
        {
            "articleList" => $"/thu-doan/{segment}/",
            "article" when parentPath is not null => $"{parentPath.TrimEnd('/')}/{segment}/",
            "qaItem" => $"/hoi-dap/{segment}/",
            _ => null
        };
    }
}
