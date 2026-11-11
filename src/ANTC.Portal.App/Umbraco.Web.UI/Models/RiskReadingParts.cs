using AngleSharp.Dom;
using AngleSharp.Html.Parser;

namespace Umbraco.Web.UI.Models;

/// <summary>Cac khoi cua bai doc chuyen de ma trang Bai huong dan dung lai (ban chinh thuc 10/11/2026, ham lvBody):
/// muc dau tien cua phan Kich ban, bang "Dieu nhieu nguoi nghi / Thuc te", "Ba cach xu ly", "Neu da lo".
/// Chi lay chu (TextContent), khong lay HTML, nen khong can loc HTML khi xuat ra view.</summary>
public sealed record RiskReadingParts(
    string? UrgentTitle,
    IReadOnlyList<string> UrgentText,
    string? FirstHeading,
    IReadOnlyList<string> FirstParagraphs,
    (string Left, string Right)? MythHead,
    IReadOnlyList<(string Left, string Right)> MythRows,
    IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> Decisions,
    string? NoFault,
    IReadOnlyList<(string Title, string Text)> Cases,
    string? RecoveryTitle,
    string? RecoveryText)
{
    public static readonly RiskReadingParts Empty = new(null, [], null, [], null, [], new Dictionary<string, IReadOnlyDictionary<string, string>>(), null, [], null, null);

    /// <summary>Gia tri "Khi nao", "Lam ngay"… cua mot dong trong bang Ba cach xu ly (DUNG, HOAN).</summary>
    public string? Decision(string row, string label) =>
        Decisions.TryGetValue(row, out var cells) && cells.TryGetValue(label, out var text) && text.Length > 0 ? text : null;

    public static RiskReadingParts Parse(string? markup)
    {
        if (string.IsNullOrWhiteSpace(markup)) return Empty;
        var body = new HtmlParser().ParseDocument("<body>" + markup + "</body>").Body!;
        var top = body.Children.ToArray();

        // Khoi "Chuyen dang xay ra ngay luc nay?": doan dau la tieu de, cac doan sau la noi dung.
        var urgent = top.FirstOrDefault(x => x.ClassList.Contains("k-urgent"));
        var urgentParas = urgent is null ? [] : Paragraphs(urgent);

        // Muc h3 dau tien va cac doan <p> ngay sau no (bo qua khoi khac nhu k-tags), toi muc h3 ke tiep.
        int first = Array.FindIndex(top, x => x.LocalName == "h3");
        var firstParas = new List<string>();
        for (int i = first + 1; first >= 0 && i < top.Length && top[i].LocalName != "h3"; i++)
            if (top[i].LocalName == "p" && Text(top[i]) is { Length: > 0 } t) firstParas.Add(t);

        // Bang dau tien co dong tieu de hai cot va khong phai bang Ba cach xu ly.
        var tables = body.QuerySelectorAll("table").ToArray();
        var decision = tables.FirstOrDefault(IsDecisionTable);
        var myth = tables.FirstOrDefault(x => x != decision);
        (string, string)? mythHead = null;
        var mythRows = new List<(string, string)>();
        if (myth is not null)
            foreach (var row in myth.QuerySelectorAll("tr"))
            {
                var cells = row.Children.Where(x => x.LocalName is "th" or "td").Select(Text).ToArray();
                if (cells.Length < 2) continue;
                if (row.Children.Any(x => x.LocalName == "th")) mythHead ??= (cells[0], cells[1]);
                else mythRows.Add((cells[0], cells[1]));
            }

        var decisions = new Dictionary<string, IReadOnlyDictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
        if (decision is not null)
            foreach (var row in decision.QuerySelectorAll("tr"))
            {
                var cells = row.Children.Where(x => x.LocalName == "td").ToArray();
                if (cells.Length < 2) continue;
                var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (var p in cells[1].QuerySelectorAll("p"))
                    if (p.QuerySelector("b") is { } label && label.TextContent.Trim().TrimEnd(':') is { Length: > 0 } name)
                        values[name] = Clean(p.TextContent.Trim()[label.TextContent.Trim().Length..]);
                decisions[Text(cells[0])] = values;
            }

        // Muc "Neu da lo": doan dam ngay sau h3 la cau "khong tu trach", cac k-case la tung truong hop.
        string? noFault = null;
        var cases = new List<(string, string)>();
        int lost = Array.FindIndex(top, x => x.LocalName == "h3" && x.TextContent.Trim().StartsWith("Nếu đã lỡ", StringComparison.OrdinalIgnoreCase));
        if (lost >= 0)
        {
            if (lost + 1 < top.Length && top[lost + 1].LocalName == "p" && top[lost + 1].QuerySelector("b") is { } b && Text(b) == Text(top[lost + 1]))
                noFault = Text(b);
            for (int i = lost + 1; i < top.Length && top[i].LocalName != "h3"; i++)
            {
                if (!top[i].ClassList.Contains("k-case")) continue;
                foreach (var p in top[i].QuerySelectorAll("p"))
                {
                    var title = p.QuerySelector("b") is { } head ? Text(head) : "";
                    var all = Text(p);
                    var text = title.Length > 0 && all.StartsWith(title, StringComparison.Ordinal) ? Clean(all[title.Length..]) : all;
                    if (title.Length > 0 || text.Length > 0) cases.Add((title, text));
                }
            }
        }

        var note = top.FirstOrDefault(x => x.ClassList.Contains("k-note"));
        var noteParas = note is null ? [] : Paragraphs(note);

        return new(
            urgentParas.FirstOrDefault(), urgentParas.Skip(1).ToArray(),
            first >= 0 ? Text(top[first]) : null, firstParas,
            mythHead, mythRows, decisions, noFault, cases,
            noteParas.FirstOrDefault(), noteParas.Count > 1 ? string.Join(" ", noteParas.Skip(1)) : null);
    }

    private static bool IsDecisionTable(IElement table) =>
        table.QuerySelectorAll("td:first-child").Any(x => Text(x).Equals("DỪNG", StringComparison.OrdinalIgnoreCase));

    private static List<string> Paragraphs(IElement box) =>
        box.QuerySelectorAll("p").Select(Text).Where(x => x.Length > 0).ToList();

    private static string Text(IElement element) => Clean(element.TextContent);

    private static string Clean(string text) => System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();
}
