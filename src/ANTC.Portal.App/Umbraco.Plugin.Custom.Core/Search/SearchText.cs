using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using AngleSharp.Html.Parser;

namespace Umbraco.Plugin.Custom.Core.Search;

public sealed record SearchTextPart(string Text, bool Highlight = false);

public static class SearchText
{
    public static string Fold(string text) => FoldWithPositions(text).Text;

    public static string[] Terms(string text) => Regex.Matches(Fold(text), @"[\p{L}\p{Nd}]+")
        .Select(x => x.Value).Distinct(StringComparer.Ordinal).ToArray();

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
        // Keep paragraph/table boundaries when removing markup.
        foreach (var node in document.QuerySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6,br,tr,td,th"))
            node.AppendChild(document.CreateTextNode(" "));
        return Regex.Replace(document.Body?.TextContent ?? string.Empty, @"\s+", " ").Trim();
    }

    public static IReadOnlyList<SearchTextPart> Snippet(string text, string query, int length = 160)
    {
        text = Regex.Replace(text, @"\s+", " ").Trim();
        if (text.Length == 0) return [];
        string[] terms = Terms(query);
        var folded = FoldWithPositions(text);
        string pattern = @"(?<![\p{L}\p{Nd}])(?:" + string.Join('|', terms.Select(Regex.Escape)) + @")(?![\p{L}\p{Nd}])";
        Match[] matches = terms.Length == 0 ? [] : Regex.Matches(folded.Text, pattern).ToArray();
        int first = matches.Length == 0 ? 0 : folded.Positions[matches[0].Index].Start;
        int start = Math.Max(0, first - 40);
        while (start > 0 && start < text.Length && !char.IsWhiteSpace(text[start - 1])) start--;
        int end = Math.Min(text.Length, start + length);
        // Do not split a grapheme (Vietnamese combining marks or emoji).
        int[] boundaries = StringInfo.ParseCombiningCharacters(text).Append(text.Length).ToArray();
        end = boundaries.Last(x => x <= end);
        var parts = new List<SearchTextPart>();
        if (start > 0) parts.Add(new("…"));
        int cursor = start;
        foreach (Match match in matches)
        {
            int a = folded.Positions[match.Index].Start;
            int b = folded.Positions[match.Index + match.Length - 1].End;
            if (a < start || b > end || a < cursor) continue;
            if (a > cursor) parts.Add(new(text[cursor..a]));
            parts.Add(new(text[a..b], true));
            cursor = b;
        }
        if (cursor < end) parts.Add(new(text[cursor..end]));
        if (end < text.Length) parts.Add(new("…"));
        return parts;
    }

    private static (string Text, List<(int Start, int End)> Positions) FoldWithPositions(string text)
    {
        var result = new StringBuilder();
        var positions = new List<(int, int)>();
        var elements = StringInfo.GetTextElementEnumerator(text);
        while (elements.MoveNext())
        {
            string element = elements.GetTextElement();
            foreach (char c in element.Normalize(NormalizationForm.FormD))
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) is UnicodeCategory.NonSpacingMark
                    or UnicodeCategory.SpacingCombiningMark or UnicodeCategory.EnclosingMark) continue;
                result.Append(c is 'đ' or 'Đ' ? 'd' : char.ToLowerInvariant(c));
                positions.Add((elements.ElementIndex, elements.ElementIndex + element.Length));
            }
        }
        return (result.ToString(), positions);
    }
}
