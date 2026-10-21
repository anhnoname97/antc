using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using AngleSharp.Html.Parser;

namespace Umbraco.Plugin.Custom.Core.Articles;

internal static class ArticleSearchText
{
    public static bool Contains(string value, string term) =>
        Fold(value).Contains(Fold(term), StringComparison.Ordinal);

    // Bộ lọc bài viết hoạt động độc lập với chỉ mục tìm kiếm toàn trang.
    private static string Fold(string text)
    {
        var result = new StringBuilder();
        foreach (char c in text.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) is UnicodeCategory.NonSpacingMark
                or UnicodeCategory.SpacingCombiningMark or UnicodeCategory.EnclosingMark) continue;
            result.Append(c is 'đ' or 'Đ' ? 'd' : char.ToLowerInvariant(c));
        }
        return result.ToString();
    }

    public static string PlainHtml(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        if (value.TrimStart().StartsWith('{'))
        {
            try
            {
                using var json = JsonDocument.Parse(value);
                if (json.RootElement.TryGetProperty("markup", out var markup)) value = markup.GetString() ?? string.Empty;
            }
            catch (JsonException) { }
        }
        var document = new HtmlParser().ParseDocument(value);
        foreach (var node in document.QuerySelectorAll("script,style,template")) node.Remove();
        foreach (var node in document.QuerySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6,br,tr,td,th"))
            node.AppendChild(document.CreateTextNode(" "));
        return Regex.Replace(document.Body?.TextContent ?? string.Empty, @"\s+", " ").Trim();
    }
}
