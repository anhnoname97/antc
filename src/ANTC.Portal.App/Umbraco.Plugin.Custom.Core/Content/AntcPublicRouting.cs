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
        if (content.ContentType.Alias == "viecCanLamPage")
            path = AntcPublicPaths.SelfCheckGuidancePath(content.Value<string>("slug", culture));
        if (content.ContentType.Alias == "checklistPage")
            path = AntcPublicPaths.SelfCheckChecklistPath(Segment(content));
        if (content.ContentType.Alias == "riskArticlePage")
            path = AntcPublicPaths.SelfCheckReadingPath(content.Value<string>("selfCheckSourceNumber", culture));
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
        if (!preview && (path.Equals("quan-ly-trang/trang-chu/hay-tu-kiem-tra", StringComparison.OrdinalIgnoreCase)
            || path.Equals("cong-cu-checklist", StringComparison.OrdinalIgnoreCase)))
        {
            var landing = Child(home, "congCuPage");
            if (landing?.TemplateId is > 0)
            {
                request.SetRedirectPermanent("/hay-tu-kiem-tra/" + request.Uri.Query);
                return Task.FromResult(true);
            }
        }
        string[] parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (!preview && (path.Equals("quan-ly-trang/trang-chu/hay-tu-kiem-tra/truoc-khi-chuyen-tien", StringComparison.OrdinalIgnoreCase)
            || path.Equals("cong-cu-checklist/truoc-khi-chuyen-tien", StringComparison.OrdinalIgnoreCase)))
        {
            var tool = Child(Child(home, "congCuPage"), "truocKhiChuyenTienPage");
            if (tool?.TemplateId is > 0)
            {
                request.SetRedirectPermanent("/hay-tu-kiem-tra/truoc-khi-chuyen-tien/" + request.Uri.Query);
                return Task.FromResult(true);
            }
        }
        string? fixedAlias = AntcPublicPaths.FixedAlias(path);
        if (!preview && (path.Equals("quan-ly-trang/trang-chu/hay-tu-kiem-tra/truoc-khi-dau-tu-vay", StringComparison.OrdinalIgnoreCase)
            || path.Equals("cong-cu-checklist/truoc-khi-dau-tu-vay", StringComparison.OrdinalIgnoreCase)))
        {
            var tool = Child(Child(home, "congCuPage"), "truocKhiDauTuVayPage");
            if (tool?.TemplateId is > 0)
            {
                request.SetRedirectPermanent("/hay-tu-kiem-tra/truoc-khi-dau-tu-vay/" + request.Uri.Query);
                return Task.FromResult(true);
            }
        }
        if (!preview && (path.Equals("quan-ly-trang/trang-chu/hay-tu-kiem-tra/khi-nghi-ngo-bi-lua", StringComparison.OrdinalIgnoreCase)
            || path.Equals("cong-cu-checklist/khi-nghi-bi-lua", StringComparison.OrdinalIgnoreCase)
            || path.Equals("hay-tu-kiem-tra/khi-nghi-ngo-bi-lua", StringComparison.OrdinalIgnoreCase)))
        {
            var tool = Child(Child(home, "congCuPage"), "khiNghiBiLuaPage");
            if (tool?.TemplateId is > 0)
            {
                request.SetRedirectPermanent("/hay-tu-kiem-tra/khi-nghi-bi-lua/" + request.Uri.Query);
                return Task.FromResult(true);
            }
        }
        IPublishedContent? found = fixedAlias == "home" ? home
            : fixedAlias == "cuocThiLamBaiPage" ? Child(Child(home, "thiPage"), fixedAlias)
            : fixedAlias is "truocKhiChuyenTienPage" or "truocKhiDauTuVayPage" or "khiNghiBiLuaPage" ? Child(Child(home, "congCuPage"), fixedAlias)
            : fixedAlias is not null ? Child(home, fixedAlias) : null;
        if (fixedAlias is null && parts.Length > 0)
        {
            if (parts.Length == 2 && parts[0].Equals("hoi-dap", StringComparison.OrdinalIgnoreCase))
                found = BySegment(Child(home, "hoiDapPage"), "qaItem", parts[1]);
            IPublishedContent? library = Child(site, "contentManagement");
            if (parts.Length == 3 && parts[0].Equals("hay-tu-kiem-tra", StringComparison.OrdinalIgnoreCase))
            {
                if (parts[1].Equals("bai-doc", StringComparison.OrdinalIgnoreCase))
                    found = Children(library, "articleFolder").SelectMany(folder => Children(folder, "riskArticlePage"))
                        .FirstOrDefault(p => string.Equals(AntcPublicPaths.SelfCheckReadingPath(p.Value<string>("selfCheckSourceNumber"))?.Trim('/'), path, StringComparison.OrdinalIgnoreCase));
            }
            if (parts.Length == 2 && parts[0].Equals("hay-tu-kiem-tra", StringComparison.OrdinalIgnoreCase))
                found = Children(library, "checklistFolderV2").SelectMany(folder => Children(folder, "checklistPage"))
                    .FirstOrDefault(p => string.Equals(urls.GetUrlSegment(p.Key, request.Culture ?? string.Empty, preview), parts[1], StringComparison.OrdinalIgnoreCase));
            if (!preview && parts.Length == 3 && parts[0].Equals("quan-ly-noi-dung", StringComparison.OrdinalIgnoreCase)
                && parts[1].Equals("danh-sach-kiem-tra", StringComparison.OrdinalIgnoreCase))
            {
                var checklist = Children(library, "checklistFolderV2").SelectMany(folder => Children(folder, "checklistPage"))
                    .FirstOrDefault(p => string.Equals(urls.GetUrlSegment(p.Key, request.Culture ?? string.Empty, false), parts[2], StringComparison.OrdinalIgnoreCase));
                var redirect = checklist?.TemplateId is > 0 ? AntcPublicPaths.SelfCheckChecklistPath(parts[2]) : null;
                if (redirect is not null) { request.SetRedirectPermanent(redirect + request.Uri.Query); return Task.FromResult(true); }
            }
            if (parts.Length == 3 && parts[0].Equals("hay-tu-kiem-tra", StringComparison.OrdinalIgnoreCase)
                && parts[1].Equals("huong-dan", StringComparison.OrdinalIgnoreCase))
                found = Children(Child(library, "viecCanLamPage"), "viecCanLamPage")
                    .FirstOrDefault(p => string.Equals(p.Value<string>("slug"), parts[2], StringComparison.OrdinalIgnoreCase));
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
