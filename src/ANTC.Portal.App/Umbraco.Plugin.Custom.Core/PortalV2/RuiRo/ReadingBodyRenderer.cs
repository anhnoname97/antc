using System.Text.RegularExpressions;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed record ReadingHeading(string Id, string Text);

public sealed record ReadingBody(string Html, IReadOnlyList<ReadingHeading> Headings, int Minutes);

/// <summary>
/// Dung o "Soan thao · Bai doc" thanh HTML cua trang bai doc: muc luc, bang cuon ngang, bang kiem bam duoc.
/// Bien tap vien chi nhap noi dung; nut va ma nhan dien do website them vao.
/// </summary>
public static partial class ReadingBodyRenderer
{
    public const string AfterIncidentId = "neu-da-lo";
    private const int WordsPerMinute = 200;
    private static readonly Dictionary<string, string> DecisionClasses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["DỪNG"] = "d", ["HOÃN"] = "h", ["CÓ THỂ QUYẾT ĐỊNH"] = "q"
    };

    public static ReadingBody Render(string? markup, string urgentUrl, string tickPrefix)
    {
        var document = new HtmlParser().ParseDocument("<body>" + markup + "</body>");
        var body = document.Body!;
        int minutes = Math.Max(1, (int)Math.Ceiling(Words().Matches(body.TextContent).Count / (double)WordsPerMinute));

        var headings = new List<ReadingHeading>();
        foreach (var old in body.QuerySelectorAll("h3").Where(x => x.ParentElement == body).ToArray())
        {
            string text = old.TextContent.Trim();
            bool afterIncident = text.StartsWith("Nếu đã lỡ", StringComparison.OrdinalIgnoreCase);
            string id = afterIncident && headings.All(x => x.Id != AfterIncidentId) ? AfterIncidentId : "muc-" + (headings.Count + 1);
            var heading = document.CreateElement("h2");
            heading.Id = id;
            heading.InnerHtml = old.InnerHtml;
            old.Replace(heading);
            headings.Add(new(id, text));
        }

        var incident = headings.FirstOrDefault(x => x.Id == AfterIncidentId);
        foreach (var box in body.QuerySelectorAll(".k-urgent"))
        {
            var row = document.CreateElement("div");
            row.ClassName = "btnrow";
            row.AppendChild(Link(document, "btn red sm", urgentUrl, "Chọn việc cần làm ngay"));
            if (incident is not null) row.AppendChild(Link(document, "btn ghost sm", "#" + AfterIncidentId, $"Đến mục “{incident.Text}”"));
            box.AppendChild(row);
        }

        foreach (var table in body.QuerySelectorAll("table").ToArray())
        {
            foreach (var cell in table.QuerySelectorAll("td:first-child"))
                if (DecisionClasses.TryGetValue(cell.TextContent.Trim(), out string? kind))
                    cell.InnerHtml = $"<span class=\"stname {kind}\">{cell.TextContent.Trim()}</span>";
            var wrap = document.CreateElement("div");
            wrap.ClassName = "tblwrap";
            table.Replace(wrap);
            wrap.AppendChild(table);
        }

        int tick = 0;
        foreach (var box in body.QuerySelectorAll(".k-pocket"))
        {
            foreach (var list in box.QuerySelectorAll("ul, ol").ToArray())
            {
                var checks = document.CreateElement("div");
                checks.ClassName = "pocket-list";
                foreach (var item in list.Children.Where(x => x.LocalName == "li"))
                {
                    var label = document.CreateElement("label");
                    var input = document.CreateElement("input");
                    input.SetAttribute("type", "checkbox");
                    input.SetAttribute("data-tick", $"{tickPrefix}-{++tick}");
                    var text = document.CreateElement("span");
                    text.InnerHtml = item.InnerHtml;
                    label.AppendChild(input);
                    label.AppendChild(text);
                    checks.AppendChild(label);
                }
                list.Replace(checks);
            }
            var clear = document.CreateElement("button");
            clear.SetAttribute("type", "button");
            clear.SetAttribute("data-pocket-clear", "");
            clear.ClassName = "more";
            clear.TextContent = "Xóa đánh dấu";
            box.AppendChild(clear);
        }

        return new(body.InnerHtml, headings, minutes);
    }

    private static IElement Link(IDocument document, string className, string href, string text)
    {
        var link = document.CreateElement("a");
        link.ClassName = className;
        link.SetAttribute("href", href);
        link.TextContent = text;
        return link;
    }

    [GeneratedRegex(@"\S+")]
    private static partial Regex Words();
}
