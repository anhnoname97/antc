using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Rendering;

public static class HeroImageExtensions
{
    /// <summary>Ảnh hero từ cài đặt chung; điện thoại luôn tải bản 768px, kể cả màn hình có DPR cao.</summary>
    public static IHtmlContent HeroImage(this IHtmlHelper html, IPublishedContent page, int slide,
        bool asBackground = true, string alt = "", bool priority = true)
    {
        if (slide is < 1 or > 5) throw new ArgumentOutOfRangeException(nameof(slide));
        return html.HeroImage(page.Root().Value<MediaWithCrops>($"heroImage{slide}"), asBackground, alt, priority);
    }

    /// <summary>Dùng GetCropUrl để tạo URL có chữ ký và tham số làm mới bộ nhớ đệm của Umbraco.</summary>
    public static IHtmlContent HeroImage(this IHtmlHelper html, MediaWithCrops? media,
        bool asBackground = false, string alt = "", bool priority = true)
    {
        if (media is null) return HtmlString.Empty;
        string Url(int width) => media.GetCropUrl(width: width, quality: 75,
            furtherOptions: "format=webp") ?? string.Empty;

        var picture = new TagBuilder("picture");
        picture.AddCssClass(asBackground ? "hero-image hero-image--background" : "hero-image");
        if (asBackground) picture.Attributes["aria-hidden"] = "true";
        foreach (var (maxWidth, width) in new[] { (768, 768), (1280, 1280) })
        {
            var source = new TagBuilder("source") { TagRenderMode = TagRenderMode.SelfClosing };
            source.Attributes["media"] = $"(max-width: {maxWidth}px)";
            source.Attributes["type"] = "image/webp";
            source.Attributes["srcset"] = Url(width);
            picture.InnerHtml.AppendHtml(source);
        }

        var image = new TagBuilder("img") { TagRenderMode = TagRenderMode.SelfClosing };
        image.Attributes["src"] = Url(1920);
        image.Attributes["alt"] = asBackground ? string.Empty : alt;
        image.Attributes["decoding"] = "async";
        image.Attributes["loading"] = priority ? "eager" : "lazy";
        if (priority) image.Attributes["fetchpriority"] = "high";
        var widthOriginal = media.Value<int>("umbracoWidth");
        var heightOriginal = media.Value<int>("umbracoHeight");
        if (widthOriginal > 0 && heightOriginal > 0)
        {
            image.Attributes["width"] = widthOriginal.ToString();
            image.Attributes["height"] = heightOriginal.ToString();
        }
        picture.InnerHtml.AppendHtml(image);
        return picture;
    }
}
