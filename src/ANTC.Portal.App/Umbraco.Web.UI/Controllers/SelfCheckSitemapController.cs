using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using Umbraco.Web.UI.Rendering;

namespace Umbraco.Web.UI.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
public sealed class SelfCheckSitemapController(IDocumentNavigationQueryService navigation, IPublishedContentCache cache,
    IUmbracoContextFactory contextFactory) : Controller
{
    [HttpGet("/hay-tu-kiem-tra/sitemap.xml")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Index()
    {
        using var context = contextFactory.EnsureUmbracoContext();
        // Always use the public cache, even when the request carries a preview cookie.
        navigation.TryGetRootKeysOfType("antc", out var rootKeys);
        var site = rootKeys.Select(key => cache.GetById(false, key)).FirstOrDefault(p => p is not null);
        if (site is null) return NotFound();
        IEnumerable<IPublishedContent> Children(IPublishedContent? parent, string alias)
        {
            if (parent is null) return [];
            navigation.TryGetChildrenKeysOfType(parent.Key, alias, out var keys);
            return keys.Select(key => cache.GetById(false, key)).OfType<IPublishedContent>();
        }
        var home = Children(Children(site, "pageManagement").FirstOrDefault(), "home").FirstOrDefault();
        var landing = Children(home, "congCuPage").FirstOrDefault();
        var pages = new List<IPublishedContent>();
        if (landing is not null)
        {
            pages.Add(landing);
            foreach (var alias in new[] { "truocKhiChuyenTienPage", "truocKhiDauTuVayPage", "khiNghiBiLuaPage" }) pages.AddRange(Children(landing, alias));
        }
        var library = Children(site, "contentManagement").FirstOrDefault();
        pages.AddRange(Children(library, "checklistFolderV2").SelectMany(folder => Children(folder, "checklistPage")));
        pages.AddRange(Children(library, "articleFolder").SelectMany(folder => Children(folder, "riskArticlePage")));
        pages.AddRange(Children(library, "viecCanLamPage").SelectMany(folder => Children(folder, "viecCanLamPage")));
        var origin = new Uri($"{Request.Scheme}://{Request.Host}");
        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var urls = pages.Where(p => p.TemplateId is > 0 && SelfCheckSeoBuilder.Supports(p))
            .Select(p => SelfCheckSeoBuilder.Build(p, Request)).Where(seo => SelfCheckSeoRules.IncludeInSitemap(seo, origin))
            .DistinctBy(seo => seo.CanonicalUrl).OrderBy(seo => seo.CanonicalUrl, StringComparer.Ordinal)
            .Select(seo => new XElement(ns + "url", new XElement(ns + "loc", seo.CanonicalUrl),
                seo.Updated is { } date ? new XElement(ns + "lastmod", date.ToString("yyyy-MM-dd")) : null));
        var xml = new XDocument(new XDeclaration("1.0", "utf-8", null), new XElement(ns + "urlset", urls));
        return Content(xml.ToString(), "application/xml; charset=utf-8");
    }
}
