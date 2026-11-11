using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.Content;
using Umbraco.Web.UI.Models;

namespace Umbraco.Web.UI.Rendering;

public sealed record SelfCheckSeoImage(string Url, string? Alt, int? Width = null, int? Height = null);
public sealed record SelfCheckSeoInput
{
    public required Uri Origin { get; init; }
    public required string PublicPath { get; init; }
    public required string Name { get; init; }
    public string? Title { get; init; }
    public string? SeoTitle { get; init; }
    public string? SeoDescription { get; init; }
    public string? Description { get; init; }
    public string? Canonical { get; init; }
    public string? SiteName { get; init; }
    public bool Hidden { get; init; }
    public bool TestSite { get; init; }
    public bool Preview { get; init; }
    public bool Article { get; init; }
    public DateTime? Updated { get; init; }
    public SelfCheckSeoImage? Image { get; init; }
    public SelfCheckSeoImage? DefaultImage { get; init; }
}
public sealed record SelfCheckSeoData(string Title, string DocumentTitle, string Description, string CanonicalUrl,
    string SiteName, string Type, bool NoIndex, SelfCheckSeoImage? Image, DateTime? Updated);

public static class SelfCheckSeoRules
{
    private static string Plain(string? value) => Regex.Replace(WebUtility.HtmlDecode(Regex.Replace(value ?? "", "<[^>]*>", " ")), @"\s+", " ").Trim();
    private static string First(params string?[] values) => values.Select(Plain).FirstOrDefault(v => v.Length > 0) ?? "";

    // Editor-supplied canonical URLs may be absolute HTTP(S) or root-relative.
    // Request query/fragment is never a source for a canonical or share URL.
    public static string? AbsoluteUrl(Uri origin, string? value, bool stripQuery = true)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        value = value.Trim();
        if (value.StartsWith("//") || value.Contains('\\') || value.Any(char.IsControl)) return null;
        Uri? url;
        if (value.StartsWith('/')) url = new Uri(origin, value);
        else if (!Uri.TryCreate(value, UriKind.Absolute, out url)) return null;
        if (url.Scheme is not ("http" or "https") || !string.IsNullOrEmpty(url.UserInfo)) return null;
        var clean = new UriBuilder(url) { Fragment = "" };
        if (stripQuery) clean.Query = "";
        return clean.Uri.AbsoluteUri;
    }

    public static SelfCheckSeoData Resolve(SelfCheckSeoInput input)
    {
        var title = First(input.SeoTitle, input.Title, input.Name);
        var siteName = First(input.SiteName, "antoantaichinh.vn");
        var canonical = AbsoluteUrl(input.Origin, input.Canonical) ?? AbsoluteUrl(input.Origin, input.PublicPath)
            ?? throw new ArgumentException("A public HTTP(S) URL is required.", nameof(input));
        SelfCheckSeoImage? image = null;
        foreach (var candidate in new[] { input.Image, input.DefaultImage })
        {
            if (candidate is null || AbsoluteUrl(input.Origin, candidate.Url, false) is not { } url) continue;
            image = candidate with { Url = url, Alt = First(candidate.Alt, title), Width = candidate.Width > 0 ? candidate.Width : null, Height = candidate.Height > 0 ? candidate.Height : null };
            break;
        }
        return new(title, title == siteName ? title : $"{title} — {siteName}", First(input.SeoDescription, input.Description), canonical,
            siteName, input.Article ? "article" : "website", input.Hidden || input.TestSite || input.Preview, image,
            input.Updated is { Year: > 1900 } date ? date : null);
    }

    public static bool IncludeInSitemap(SelfCheckSeoData data, Uri origin) => !data.NoIndex
        && Uri.TryCreate(data.CanonicalUrl, UriKind.Absolute, out var url)
        && url.GetLeftPart(UriPartial.Authority) == origin.GetLeftPart(UriPartial.Authority)
        && (url.AbsolutePath == "/hay-tu-kiem-tra/" || url.AbsolutePath.StartsWith("/hay-tu-kiem-tra/", StringComparison.Ordinal));
}

public static class SelfCheckSeoBuilder
{
    public static bool Supports(IPublishedContent content) => content.ContentType.Alias is "home" or "congCuPage" or "truocKhiChuyenTienPage"
        or "truocKhiDauTuVayPage" or "khiNghiBiLuaPage" or "checklistPage" or "ungPhoPage" or "wizardPage" or "lienHePage"
        or "situationChooserPage" or "foundationLibraryPage" or "foundationArticlePage" or "thiThuPage"
        or "veWebsitePage" or "gopYPage" or "xacMinhDungTrangPage" or "baoVeDuLieuCaNhanPage" or "mienTruTrachNhiemPage"
        or "nguyenTacNoiDungPage" or "baoLoiVaCaiChinhPage"
        || (content.ContentType.Alias == "viecCanLamPage" && AntcPublicPaths.SelfCheckGuidancePath(ActionGuideData.Slug(content)) is not null)
        // Cac rui ro (V2-13i, WEB-05): moi bai viet va canh bao co canonical; bai viet theo Nhom chinh (UrlProvider), canh bao theo Canh bao moi.
        || content.ContentType.Alias is "riskArticlePage" or "alertPage";

    public static bool Ready(IPublishedContent content) => content.ContentType.Alias switch
    {
        "truocKhiChuyenTienPage" or "truocKhiDauTuVayPage" => SelfCheckToolDataBuilder.Build(content).Ready,
        "khiNghiBiLuaPage" => SelfCheckBranchDataBuilder.Build(content).Ready,
        "checklistPage" => SelfCheckChecklistDataBuilder.Build(content).Ready,
        "wizardPage" => EmergencyWizardDataBuilder.Build(content).Ready,
        "foundationArticlePage" => content.HasValue("body"),
        "situationChooserPage" => EmergencyContent.Rows(content, "situations").Length > 0,
        "riskArticlePage" => !string.IsNullOrWhiteSpace(content.Value<string>("readingBody"))
            || !string.IsNullOrWhiteSpace(content.Value<string>("description"))
            || !string.IsNullOrWhiteSpace(content.Value<string>("summary"))
            || content.Value<IEnumerable<string>>("warningSigns")?.Any() == true,
        "viecCanLamPage" => ActionGuideData.Steps(content).Any(step => !string.IsNullOrWhiteSpace(step.MainText)) || EmergencyContent.HasScreening(content),
        _ => true
    };

    public static SelfCheckSeoData Build(IPublishedContent content, HttpRequest request, bool preview = false)
    {
        var site = content.Root();
        var isHome = content.ContentType.Alias == "home";
        var illustration = isHome ? content.Value<IPublishedContent>("illustration") : null;
        var illustrationAlt = isHome ? content.Value<string>("illustrationAlt") : null;
        var shareImage = content.Value<IPublishedContent>("ogImage");
        SelfCheckSeoImage? Image(IPublishedContent? media, string? alt = null) => media is null ? null : new(media.Url(),
            !string.IsNullOrWhiteSpace(alt) ? alt : media.Value<string>("altText") ?? media.Name,
            media.Value<int?>("umbracoWidth"), media.Value<int?>("umbracoHeight"));
        return SelfCheckSeoRules.Resolve(new()
        {
            Origin = new Uri($"{request.Scheme}://{request.Host}"), PublicPath = content.Url(), Name = content.Name,
            Title = content.Value<string>("title"), SeoTitle = content.Value<string>("seoTitle"), SeoDescription = content.Value<string>("seoDescription"),
            Description = content.Value<string>("lead") is { Length: > 0 } lead ? lead : content.Value<string>("description"),
            Canonical = content.Value<string>("canonicalUrl"), SiteName = site.Value<string>("siteName"), Hidden = content.Value<bool>("hideFromSearch") || !Ready(content),
            TestSite = site.Value<bool>("showPreviewBanner"), Preview = preview, Article = content.ContentType.Alias is "riskArticlePage" or "viecCanLamPage" or "foundationArticlePage" or "alertPage",
            Image = Image(shareImage, isHome && shareImage?.Key == illustration?.Key ? illustrationAlt : null),
            DefaultImage = Image(illustration, illustrationAlt) ?? Image(site.Value<IPublishedContent>("ogImage"))
                ?? (isHome ? null : Image(site.Value<IPublishedContent>("heroImage1"))),
            Updated = isHome ? content.Value<DateTime?>("displayUpdatedDate")
                : content.Value<DateTime?>("updatedDate") ?? content.Value<DateTime?>("displayUpdatedDate")
        });
    }
}
