using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace Umbraco.Plugin.Custom.Core.Content;

public sealed class AntcPublicRoutingComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.UrlProviders().Insert<AntcPublicUrlProvider>();
        builder.ContentFinders().InsertBefore<ContentFinderByUrl, AntcPublicContentFinder>();
    }
}

/// <summary>Hiển thị đúng URL công khai trong tab Thông tin và khi gọi Model.Url().</summary>
public sealed class AntcPublicUrlProvider(IDocumentNavigationQueryService navigation, IPublishedContentCache cache,
    IDocumentUrlService urls, IUmbracoContextAccessor contextAccessor) : IUrlProvider
{
    public string Alias => "AntcPublic";

    public UrlInfo? GetUrl(IPublishedContent content, UrlMode mode, string? culture, Uri current)
    {
        if (AntcPublicPaths.IsManagement(content.ContentType.Alias))
            return UrlInfo.AsMessage("Nút quản lý dùng trong CMS, không có trang công khai.", Alias, culture);
        bool preview = contextAccessor.TryGetUmbracoContext(out IUmbracoContext? context) && context.InPreviewMode;
        string? Segment(IPublishedContent item) => urls.GetUrlSegment(item.Key, culture ?? string.Empty, preview);
        if (AntcPublicPaths.IsPolicyLibrary(content.ContentType.Alias, content.Value<string>("listRole", culture)))
            return UrlInfo.AsMessage("Kho văn bản Chính sách. Trang hiển thị nằm trong Quản lý trang.", Alias, culture);
        string? parentPath = null;
        if (content.ContentType.Alias == "article" && navigation.TryGetParentKey(content.Key, out Guid? parentKey)
            && parentKey is not null && cache.GetById(preview, parentKey.Value) is { } parent)
            parentPath = AntcPublicPaths.GetPath(parent.ContentType.Alias, Segment(parent), listRole: parent.Value<string>("listRole", culture));
        string? path = AntcPublicPaths.GetPath(content.ContentType.Alias, Segment(content), parentPath, content.Value<string>("listRole", culture));
        if (path is null) return null;
        return UrlInfo.AsUrl(mode == UrlMode.Absolute ? new Uri(current, path).AbsoluteUri : path, Alias, culture);
    }

    public IEnumerable<UrlInfo> GetOtherUrls(int id, Uri current) => [];

    // Giữ cơ chế xem trước theo khóa nội dung của Umbraco, kể cả bản nháp.
    public Task<UrlInfo?> GetPreviewUrlAsync(IContent content, string? culture, string? segment) => Task.FromResult<UrlInfo?>(null);
}

/// <summary>Tìm trang qua cây trang hoặc kho nội dung, chỉ đọc nội dung được xuất bản.</summary>
public sealed class AntcPublicContentFinder(
    IDocumentNavigationQueryService navigation,
    IPublishedContentCache cache,
    IDocumentUrlService urls,
    IUmbracoContextAccessor contextAccessor) : IContentFinder
{
    public Task<bool> TryFindContent(IPublishedRequestBuilder request)
    {
        if (!contextAccessor.TryGetUmbracoContext(out IUmbracoContext? context)) return Task.FromResult(false);
        bool preview = context.InPreviewMode;
        navigation.TryGetRootKeysOfType("antc", out IEnumerable<Guid> roots);
        IPublishedContent? site = roots.Select(key => cache.GetById(preview, key)).FirstOrDefault(x => x is not null);
        if (site is null) return Task.FromResult(false);

        IEnumerable<IPublishedContent> Children(IPublishedContent? parent, string alias)
        {
            if (parent is null) return [];
            navigation.TryGetChildrenKeysOfType(parent.Key, alias, out IEnumerable<Guid> keys);
            return keys.Select(key => cache.GetById(preview, key)).OfType<IPublishedContent>();
        }
        IPublishedContent? Child(IPublishedContent? parent, string alias) => Children(parent, alias).FirstOrDefault();
        IPublishedContent? BySegment(IPublishedContent? parent, string alias, string segment) =>
            Children(parent, alias).FirstOrDefault(x => string.Equals(urls.GetUrlSegment(x.Key, request.Culture ?? string.Empty, preview), segment, StringComparison.OrdinalIgnoreCase));

        IPublishedContent? home = Child(Child(site, "pageManagement"), "home");
        string path = request.AbsolutePathDecoded.Trim('/');
        string[] parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        string? fixedAlias = AntcPublicPaths.FixedAlias(path);
        IPublishedContent? found = fixedAlias == "home" ? home : fixedAlias is not null ? Child(home, fixedAlias) : null;
        if (fixedAlias is null && parts.Length > 0)
        {
            IPublishedContent? library = Child(site, "contentManagement");
            IPublishedContent? list = null;
            int articleIndex = 0;
            if (parts[0].Equals("chinh-sach", StringComparison.OrdinalIgnoreCase) && parts.Length <= 2)
            {
                list = Children(library, "articleList").FirstOrDefault(x => AntcPublicPaths.IsPolicyLibrary(x.ContentType.Alias, x.Value<string>("listRole", request.Culture)));
                articleIndex = 1;
            }
            else if (parts[0].Equals("thu-doan", StringComparison.OrdinalIgnoreCase) && parts.Length is 2 or 3)
            {
                list = BySegment(Child(library, "articleManagement"), "articleList", parts[1]);
                articleIndex = 2;
            }
            if (list is not null)
                found = parts.Length == articleIndex ? list : BySegment(list, "article", parts[articleIndex]);
        }
        if (found is null) return Task.FromResult(false);
        request.SetPublishedContent(found);
        return Task.FromResult(true);
    }
}
