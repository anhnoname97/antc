using Examine;
using Examine.Search;
using Microsoft.EntityFrameworkCore;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.Content;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Core.Search;

public sealed class SiteSearchService(IExamineManager examine, IPublishedContentCache cache,
    IDocumentPublishStatusQueryService publication, IDocumentNavigationQueryService navigation,
    IDocumentUrlService urls, IPublicAccessService access, AppDbContext db) : ISiteSearchService
{
    public async Task<SiteSearchResult> SearchAsync(string? query, int page = 1, CancellationToken ct = default)
    {
        string text = query?.Trim() ?? string.Empty;
        page = Math.Max(1, page);
        if (text.Length is < 2 or > 100)
            return new(text, [], 0, page, "Nhập từ khóa từ 2 đến 100 ký tự để tìm kiếm.");
        string[] terms = SearchText.Terms(text);
        if (terms.Length == 0) return new(text, [], 0, page, "Nhập từ khóa có chữ hoặc số để tìm kiếm.");
        if (!examine.TryGetIndex(Constants.UmbracoIndexes.ExternalIndexName, out var index))
            return new(text, [], 0, page, "Tìm kiếm đang được chuẩn bị. Vui lòng thử lại sau.");
        // The managed API receives only normalized words, never raw Lucene syntax.
        var search = index.Searcher.CreateQuery().ManagedQuery(string.Join(' ', terms), [SearchFields.Text]);
        var matches = new List<SiteSearchItem>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        bool? questionPageAvailable = null;
        const int batch = 100;
        for (int offset = 0; ; offset += batch)
        {
            ct.ThrowIfCancellationRequested();
            var results = search.Execute(new QueryOptions(offset, batch));
            var hits = results.ToArray();
            foreach (var hit in hits)
            {
                if (!seen.Add(hit.Id)) continue;
                SiteSearchItem? item;
                if (hit.Id.StartsWith(SearchFields.QuestionPrefix, StringComparison.Ordinal))
                {
                    questionPageAvailable ??= QuestionPageAvailable();
                    item = questionPageAvailable.Value ? await Question(hit.Id, text, ct) : null;
                }
                else item = Content(hit, text);
                if (item is not null) matches.Add(item);
            }
            if (hits.Length == 0 || (long)offset + batch >= results.TotalItemCount) break;
        }
        long skip = ((long)page - 1) * SiteSearchResult.PageSize;
        return new(text, skip >= matches.Count ? [] : matches.Skip((int)skip).Take(SiteSearchResult.PageSize).ToArray(), matches.Count, page);
    }

    private async Task<SiteSearchItem?> Question(string key, string query, CancellationToken ct)
    {
        if (!long.TryParse(key[SearchFields.QuestionPrefix.Length..], out long id)) return null;
        // Recheck publication now: stale index entries must not expose removed answers.
        var question = await db.QuestionSubmissions.AsNoTracking().Where(x => x.Id == id && x.Type == "cau-hoi" && x.IsPublished
                && x.ApprovedAt != null && x.PublishedAnswer != null && x.PublishedAnswer != "")
            .Select(x => new { x.Content, x.PublishedAnswer }).SingleOrDefaultAsync(ct);
        if (question is null) return null;
        return new("Hỏi – Đáp", question.Content, QuestionPublicNavigation.Url(id),
            SearchText.Snippet(question.Content + " " + question.PublishedAnswer, query));
    }

    private IPublishedContent? Published(Guid key)
    {
        if (!publication.IsPublishedInAnyCulture(key) || !publication.HasPublishedAncestorPath(key)) return null;
        var content = cache.GetById(false, key);
        return content is not null && !access.IsProtected(content.Path) ? content : null;
    }

    private bool QuestionPageAvailable()
    {
        navigation.TryGetRootKeysOfType("antc", out IEnumerable<Guid> roots);
        var site = roots.Select(Published).FirstOrDefault(x => x is not null);
        IPublishedContent? Child(IPublishedContent? parent, string alias)
        {
            if (parent is null) return null;
            navigation.TryGetChildrenKeysOfType(parent.Key, alias, out IEnumerable<Guid> keys);
            return keys.Select(Published).FirstOrDefault(x => x is not null);
        }
        var page = Child(Child(Child(site, "pageManagement"), "home"), "hoiDapPage");
        return page is not null && !page.Value<bool>("hideFromSearch");
    }

    private SiteSearchItem? Content(ISearchResult hit, string query)
    {
        string? keyText = hit.Values.GetValueOrDefault("__Key");
        if (!Guid.TryParse(keyText ?? hit.Id, out Guid key)) return null;
        var content = Published(key);
        if (content is null || content.Value<bool>("hideFromSearch")) return null;
        string alias = content.ContentType.Alias;
        if (alias != "article" && !SearchFields.IsPage(alias)) return null;
        string? url;
        string excerpt;
        if (alias == "article")
        {
            if (!navigation.TryGetParentKey(key, out Guid? parentKey) || parentKey is null || Published(parentKey.Value) is not { } parent
                || parent.ContentType.Alias != "articleList") return null;
            string? role = parent.Value("listRole") is IEnumerable<string> values ? values.FirstOrDefault() : parent.Value<string>("listRole");
            string? parentUrl = AntcPublicPaths.GetPath("articleList", urls.GetUrlSegment(parent.Key, string.Empty, false), listRole: role);
            url = AntcPublicPaths.GetPath("article", urls.GetUrlSegment(key, string.Empty, false), parentUrl);
            string body = SearchText.PlainHtml(content.Value<IHtmlEncodedString>("body")?.ToHtmlString());
            string summary = content.Value<string>("summary") ?? string.Empty;
            excerpt = string.IsNullOrWhiteSpace(body) ? summary : summary + " " + body;
        }
        else
        {
            url = AntcPublicPaths.GetPath(alias, null);
            excerpt = content.Value<string>("seoDescription") ?? string.Empty;
        }
        if (string.IsNullOrWhiteSpace(url) || !url.StartsWith('/') || url.StartsWith("//")) return null;
        if (string.IsNullOrWhiteSpace(excerpt)) excerpt = content.Name;
        var snippet = SearchText.Snippet(excerpt, query);
        if (!snippet.Any(x => x.Highlight)) snippet = SearchText.Snippet(content.Name + " — " + excerpt, query);
        return new(alias == "article" ? "Bài viết" : "Trang thông tin", content.Name, url, snippet);
    }
}
