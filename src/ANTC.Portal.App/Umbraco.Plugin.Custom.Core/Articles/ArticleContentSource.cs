using System.Text.Json;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.Content;

namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed record ArticleContent(ArticleCard Card, string BodyHtml, string? SafeAction, ArticleSeo Seo);
public sealed record ArticleCategoryContent(ArticleCategory Category, IReadOnlyList<ArticleContent> Articles);
public sealed record ArticleLibrary(int ReviewAfterDays, IReadOnlyList<ArticleCategoryContent> Categories);

public interface IArticleContentSource
{
    ArticleLibrary Read(Guid? bodyArticleId = null);
}

/// <summary>Đọc đúng nhánh kho bài viết từ bản đã xuất bản, kể cả khi người gọi đang xem trước trong CMS.</summary>
public sealed class UmbracoArticleContentSource(IDocumentNavigationQueryService navigation,
    IDocumentPublishStatusQueryService publication, IPublishedContentCache cache,
    IDocumentUrlService urls, IPublicAccessService access) : IArticleContentSource
{
    public ArticleLibrary Read(Guid? bodyArticleId = null)
    {
        navigation.TryGetRootKeysOfType("antc", out IEnumerable<Guid> roots);
        IPublishedContent? site = roots.Select(Published).FirstOrDefault(x => x is not null);
        if (site is null) return new(ArticleReviewPolicy.DefaultMaxAgeDays, []);

        int days = ArticleReviewPolicy.MaxAgeDays(site.Value<int?>("articleReviewAfterDays"));
        ArticleImage? defaultShareImage = Image(site, "heroImage1");
        IPublishedContent? library = Children(site, "contentManagement").FirstOrDefault();
        IPublishedContent? fraud = Children(library, "articleManagement").FirstOrDefault();
        var categories = Children(fraud, "articleList")
            .Where(x => !AntcPublicPaths.IsPolicyLibrary("articleList", Dropdown(x, "listRole")))
            .Concat(Children(library, "articleList")
                .Where(x => AntcPublicPaths.IsPolicyLibrary("articleList", Dropdown(x, "listRole"))))
            .OrderBy(x => x.SortOrder).ThenBy(x => x.Key)
            .Select(list => MapCategory(list, days, bodyArticleId, defaultShareImage)).OfType<ArticleCategoryContent>().ToArray();
        return new(days, categories);
    }

    private IPublishedContent? Published(Guid key)
    {
        if (!publication.IsPublishedInAnyCulture(key) || !publication.HasPublishedAncestorPath(key)) return null;
        IPublishedContent? content = cache.GetById(false, key);
        return content is not null && !access.IsProtected(content.Path) ? content : null;
    }

    private IEnumerable<IPublishedContent> Children(IPublishedContent? parent, string alias)
    {
        if (parent is null) return [];
        navigation.TryGetChildrenKeysOfType(parent.Key, alias, out IEnumerable<Guid> keys);
        return keys.Select(Published).OfType<IPublishedContent>();
    }

    private string Segment(IPublishedContent content) => urls.GetUrlSegment(content.Key, string.Empty, false) ?? string.Empty;

    private ArticleCategoryContent? MapCategory(IPublishedContent list, int days, Guid? bodyArticleId, ArticleImage? defaultShareImage)
    {
        string slug = Segment(list);
        string? role = Dropdown(list, "listRole");
        string? url = AntcPublicPaths.GetPath("articleList", slug, listRole: role);
        if (url is null) return null;
        ArticleContent[] articles = Children(list, "article").Select(x => MapArticle(x, url, days, bodyArticleId, defaultShareImage))
            .OfType<ArticleContent>().ToArray();
        string summary = list.Value<string>("summary") ?? string.Empty;
        var category = new ArticleCategory(list.Key, list.Name, slug, url, summary,
            list.Value<bool>("isField"), Dropdown(list, "fieldIcon"), role == "Không có" ? null : role, articles.Length)
        {
            Seo = Seo(list, summary, defaultShareImage),
            ShowOnHome = list.Value<bool>("showOnHome")
        };
        return new(category, articles);
    }

    private ArticleContent? MapArticle(IPublishedContent item, string categoryUrl, int days, Guid? bodyArticleId, ArticleImage? defaultShareImage)
    {
        string slug = Segment(item);
        string? url = AntcPublicPaths.GetPath("article", slug, categoryUrl);
        if (url is null) return null;
        string? agency = Text(item, "sourceAgency");
        string summary = item.Value<string>("summary") ?? string.Empty;
        var card = new ArticleCard(item.Key, item.Name, slug, url, summary, Image(item, "image"),
            Label(Dropdown(item, "labelType"), agency),
            new ArticleSource(agency, Text(item, "sourceDocNo"), Date(item, "sourceDocDate")),
            Date(item, "updatedDate"), item.Value<bool>("policyDraft"),
            new ArticleReview(Date(item, "lastReviewedDate"), days, false, null))
        {
            ShowOnHome = item.Value<bool>("showOnHome")
        };
        var seo = Seo(item, summary, card.Image ?? defaultShareImage);
        string html = item.Key == bodyArticleId ? item.Value<IHtmlEncodedString>("body")?.ToHtmlString() ?? string.Empty : string.Empty;
        return new(card, html, Text(item, "safeAction"), seo);
    }

    private static ArticleSeo Seo(IPublishedContent content, string summary, ArticleImage? fallbackImage) =>
        new(Text(content, "seoTitle") ?? content.Name, Text(content, "seoDescription") ?? summary,
            Image(content, "ogImage") ?? fallbackImage, content.Value<bool>("hideFromSearch"));

    private static string? Text(IPublishedContent item, string alias) =>
        item.Value<string>(alias) is { } text && !string.IsNullOrWhiteSpace(text) ? text.Trim() : null;

    private static DateOnly? Date(IPublishedContent item, string alias) =>
        item.Value<DateTime?>(alias) is { } date && date != default ? DateOnly.FromDateTime(date) : null;

    private static ArticleImage? Image(IPublishedContent item, string alias)
    {
        MediaWithCrops? image = item.Value<MediaWithCrops>(alias);
        string? url = image?.MediaUrl();
        return string.IsNullOrWhiteSpace(url) ? null : new ArticleImage(url, Text(image!, "altText") ?? image!.Name);
    }

    private static ArticleLabel Label(string? value, string? agency) => value switch
    {
        "Dựa trên cảnh báo của cơ quan" => new("official-warning", $"Dựa trên cảnh báo của {agency ?? "cơ quan"}"),
        "Cần kiểm chứng · Chưa có kết luận" => new("unverified", "Cần kiểm chứng · Chưa có kết luận"),
        _ => new("none", null)
    };

    private static string? Dropdown(IPublishedContent content, string alias)
    {
        // Dropdown đơn của Umbraco có thể được chuyển đổi thành mảng chuỗi hoặc JSON array.
        object? value = content.Value(alias);
        if (value is IEnumerable<string> values) return values.FirstOrDefault();
        if (value is not string text || string.IsNullOrWhiteSpace(text)) return null;
        if (!text.TrimStart().StartsWith('[')) return text.Trim();
        try { return JsonSerializer.Deserialize<string[]>(text)?.FirstOrDefault(); }
        catch (JsonException) { return null; }
    }
}
