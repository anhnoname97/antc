using AngleSharp.Dom;
using Ganss.Xss;

namespace Umbraco.Plugin.Custom.Core.Articles;

/// <summary>Chỉ xuất HTML phù hợp công cụ soạn thảo bài viết; không thay đổi bản gốc trong CMS.</summary>
public sealed class ArticleHtmlSanitizer
{
    public string Clean(string html)
    {
        var sanitizer = new HtmlSanitizer { KeepChildNodes = true };
        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.UnionWith(["p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "ul", "ol", "li", "aside",
            "a", "blockquote", "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td",
            "figure", "figcaption", "img"]);
        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.UnionWith(["href", "title", "src", "alt", "width", "height", "colspan", "rowspan", "scope", "start"]);
        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.UnionWith(["http", "https", "mailto", "tel"]);
        sanitizer.AllowedCssProperties.Clear();
        sanitizer.AllowedAtRules.Clear();
        sanitizer.AllowDataAttributes = false;
        // Only the exact class emitted by the article notice partial survives.
        // Other classes, inline styles and event attributes remain disallowed.
        sanitizer.RemovingAttribute += (_, args) =>
        {
            if (args.Tag.LocalName == "aside" && args.Attribute.Name == "class"
                && args.Attribute.Value == "antc-article-notice") args.Cancel = true;
        };
        sanitizer.RemovingTag += (_, args) =>
        {
            if (args.Tag.LocalName is "script" or "style" or "iframe" or "object" or "embed" or "template"
                or "svg" or "math" or "noscript") args.Tag.TextContent = string.Empty;
        };
        sanitizer.PostProcessNode += (_, args) =>
        {
            if (args.Node is not IElement element) return;
            if (element.LocalName == "img" && element.GetAttribute("src") is { } source
                && !IsWebUrl(source)) element.RemoveAttribute("src");
            // Các URL HTTP(S) tuyệt đối và URL // được coi là liên kết ngoài.
            // URL nội bộ dạng /duong-dan hoặc #neo giữ cách mở mặc định.
            if (element.LocalName == "a" && element.GetAttribute("href") is { } href
                && (href.StartsWith("//", StringComparison.Ordinal) || Uri.TryCreate(href, UriKind.Absolute, out var uri)
                    && uri.Scheme is "http" or "https"))
            {
                element.SetAttribute("target", "_blank");
                element.SetAttribute("rel", "noopener noreferrer");
            }
        };
        return sanitizer.Sanitize(html);
    }

    private static bool IsWebUrl(string value) => value.StartsWith('/')
        || !Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme is "http" or "https";
}
