using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.Content;

namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed partial class UmbracoArticleContentSource
{
    private IPublishedContent? Page(IPublishedContent site, string alias)
    {
        var manager = Children(site, "pageManagement").FirstOrDefault();
        var home = Children(manager, "home").FirstOrDefault();
        return alias == "home" ? home : Children(home, alias).FirstOrDefault();
    }

    private ArticleContentPage PageInfo(IPublishedContent site, IPublishedContent page, string summary, ArticleImage? image)
    {
        string url = AntcPublicPaths.GetPath(page.ContentType.Alias, Segment(page))!;
        var home = Page(site, "home");
        return new(page.Key, page.Name, url, Seo(page, summary, image),
            [new(home?.Name ?? site.Name, "/"), new(page.Name, url)]);
    }

    private FraudPageContent? MapFraudContent(IPublishedContent site, IPublishedContent? manager)
    {
        var page = Page(site, "thuDoanPage");
        var content = Children(manager, "fraudContent").FirstOrDefault();
        if (page is null || content is null) return null;
        var hero = Hero(content, page, Image(site, "heroImage3"));
        return new(PageInfo(site, page, hero.Description, hero.Image), hero,
            new(Value(content, "searchLabel"), Value(content, "searchPlaceholder"), Value(content, "searchSubmitLabel"),
                Value(content, "searchPrivacyNote"), Value(content, "searchEmptyMessage")),
            Information(content, "objectives"), Information(content, "methods"),
            Heading(content, "categories"), Heading(content, "alerts"), Value(content, "readingActionLabel"),
            Value(content, "emptyCategoryLabel"), Value(content, "articleCountLabel"),
            new(Value(content, "nextEyebrow"), Value(content, "nextTitle"), Value(content, "nextDescription"),
                Link(content, "nextPrimaryLink"), Link(content, "nextSecondaryLink")));
    }

    private PolicyPageContent? MapPolicyContent(IPublishedContent site, IPublishedContent? manager,
        IReadOnlyList<ArticleCategoryContent> categories)
    {
        var page = Page(site, "chinhSachPage");
        var content = Children(manager, "policyContent").FirstOrDefault();
        if (page is null || content is null) return null;
        var hero = Hero(content, page, Image(site, "heroImage3"));
        var policies = categories.Where(x => ArticleCategoryQuery.Role(x.Category.Role) == "policy").ToArray();
        int total = policies.Sum(x => x.Articles.Count);
        int drafts = policies.Sum(x => x.Articles.Count(a => a.Card.IsDraft));
        string? notice = drafts > 0 ? Text(content, "draftNotice")?.Replace("{count}", drafts.ToString(System.Globalization.CultureInfo.InvariantCulture)) : null;
        return new(PageInfo(site, page, hero.Description, hero.Image), hero, notice,
            Value(content, "emptyMessage"), total, drafts);
    }

    private static ArticleHeroContent Hero(IPublishedContent content, IPublishedContent page, ArticleImage? fallback) =>
        new(Value(content, "heroEyebrow"), Text(content, "heroTitle") ?? page.Name, Text(content, "heroHighlightTitle"),
            Value(content, "heroDescription"), Image(content, "heroImage") ?? fallback);

    private static ArticleContentHeading Heading(IPublishedContent content, string prefix) =>
        new(Value(content, prefix + "Eyebrow"), Value(content, prefix + "Title"), Text(content, prefix + "HighlightTitle"),
            Value(content, prefix + "Description"));

    private ArticleInformationSection Information(IPublishedContent content, string prefix)
    {
        var list = content.Value<BlockListModel>(prefix + "Items");
        ArticleInformationItem[] items = list?.Select(x => new ArticleInformationItem(x.Content.Key,
            Value(x.Content, "title"), Value(x.Content, "description"), IconKey(Dropdown(x.Content, "iconKey")),
            x.Content.Value<bool>("isWarning"))).ToArray() ?? [];
        return new(Heading(content, prefix), items, Text(content, prefix + "Note"), Link(content, prefix + "NoteLink"));
    }

    private ArticleContentLink? Link(IPublishedContent content, string alias)
    {
        object? value = content.Value(alias);
        var link = value as Link ?? (value as IEnumerable<Link>)?.FirstOrDefault();
        if (link is null || string.IsNullOrWhiteSpace(link.Url) || !AllowedUrl(link.Url)) return null;
        if (link.Udi is GuidUdi target && target.EntityType == Constants.UdiEntityType.Document
            && Published(target.Guid) is null) return null;
        return new(link.Name ?? string.Empty, link.Url, link.Target is "_blank" or "_self" ? link.Target : null);
    }

    private static bool AllowedUrl(string value) => !value.Any(char.IsControl) && !value.Contains('\\') &&
        ((value.StartsWith('/') && !value.StartsWith("//", StringComparison.Ordinal)) || value.StartsWith('#') ||
         Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https" or "mailto" or "tel");

    private static string Value(IPublishedContent content, string alias) => Text(content, alias) ?? string.Empty;
    private static string Value(IPublishedElement content, string alias) =>
        content.Value<string>(alias)?.Trim() ?? string.Empty;

    private static string? IconKey(string? name) => name switch
    {
        "Cơ quan, tổ chức" => "authority", "Người quen" => "people", "Lợi nhuận" => "profit", "Khóa" => "lock",
        "Cảnh báo" => "warning", "Phí, thanh toán" => "fee", "Giấy tờ" => "document", _ => null
    };
}
