using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using Ganss.Xss;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed record ReadingHeading(string Id, string Text);

public sealed record ReadingBody(string Html, IReadOnlyList<ReadingHeading> Headings, int Minutes);

/// <summary>
/// Dung o "Soan thao · Bai doc" thanh HTML cua trang bai doc: muc luc, bang cuon ngang, bang kiem bam duoc.
/// Bien tap vien chi nhap noi dung; nut va ma nhan dien do website them vao.
/// </summary>
public static class ReadingBodyRenderer
{
    public const string AfterIncidentId = "neu-da-lo";
    private static readonly Dictionary<string, string> DecisionClasses = new(StringComparer.OrdinalIgnoreCase)
    {
        ["DỪNG"] = "d", ["HOÃN"] = "h", ["CÓ THỂ QUYẾT ĐỊNH"] = "q"
    };
    private static readonly HashSet<string> AllowedDivClasses = new(StringComparer.Ordinal)
    {
        "k-urgent", "k-box", "k-now", "k-chips", "k-tags", "k-stop", "k-pocket", "k-steps", "k-case", "k-note"
    };

    public static ReadingBody Render(string? markup, string urgentUrl, string tickPrefix)
    {
        string cleanMarkup = string.IsNullOrWhiteSpace(markup) ? "" : Sanitize(markup);
        var document = new HtmlParser().ParseDocument("<body>" + cleanMarkup + "</body>");
        var body = document.Body!;
        int minutes = AlertList.ReadingMinutes(body.TextContent);

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

    private static string Sanitize(string html)
    {
        // Loc ma doc truoc khi dung muc luc, bang va hop k-*; cac thuoc tinh tin cay (data-tick, tblwrap) duoc tao sau buoc nay.
        var sanitizer = new HtmlSanitizer { KeepChildNodes = true };
        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.UnionWith([
            "p", "br", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "sub", "sup",
            "ul", "ol", "li", "dl", "dt", "dd", "aside", "div", "span", "small", "blockquote", "code", "pre", "hr",
            "a", "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td",
            "figure", "figcaption", "img"
        ]);
        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.UnionWith(["href", "title", "src", "alt", "width", "height", "colspan", "rowspan", "scope", "start"]);
        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.UnionWith(["http", "https", "mailto", "tel"]);
        sanitizer.AllowedCssProperties.Clear();
        sanitizer.AllowedAtRules.Clear();
        sanitizer.AllowDataAttributes = false;
        sanitizer.RemovingAttribute += (_, args) =>
        {
            if (args.Attribute.Name != "class") return;
            if (args.Tag.LocalName == "aside" && args.Attribute.Value == "antc-article-notice")
            {
                args.Cancel = true;
                return;
            }
            if (args.Tag.LocalName == "div")
            {
                var tokens = args.Attribute.Value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
                if (tokens.Length > 0 && tokens.All(AllowedDivClasses.Contains))
                    args.Cancel = true;
            }
        };
        sanitizer.RemovingTag += (_, args) =>
        {
            if (args.Tag.LocalName is "script" or "style" or "iframe" or "object" or "embed" or "template"
                or "svg" or "math" or "noscript") args.Tag.TextContent = string.Empty;
        };
        sanitizer.PostProcessNode += (_, args) =>
        {
            if (args.Node is not IElement element) return;
            if (element.LocalName == "img" && element.GetAttribute("src") is { } source && !IsWebUrl(source))
                element.RemoveAttribute("src");
            if (element.LocalName == "a" && element.GetAttribute("href") is { } href
                && (href.StartsWith("//", StringComparison.Ordinal)
                    || (Uri.TryCreate(href, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https")))
            {
                element.SetAttribute("target", "_blank");
                element.SetAttribute("rel", "noopener noreferrer");
            }
        };
        return sanitizer.Sanitize(html);
    }

    private static bool IsWebUrl(string value) => value.StartsWith('/')
        || !Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme is "http" or "https";

    private static IElement Link(IDocument document, string className, string href, string text)
    {
        var link = document.CreateElement("a");
        link.ClassName = className;
        link.SetAttribute("href", href);
        link.TextContent = text;
        return link;
    }
}
