using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed record ReadingTopic(int Number, string ShortName, string Url);

/// <summary>Bai doc da xuat ban cua tung chuyen de, theo so chuyen de. Nguon la o "Bai doc chuyen de" cua muc Chuyen de.</summary>
public sealed class ReadingArticleDirectory(IDocumentNavigationQueryService navigation, IPublishedContentCache cache,
    IPublishedUrlProvider urls, IUmbracoContextAccessor contextAccessor)
{
    public IReadOnlyList<ReadingTopic> All()
    {
        bool preview = contextAccessor.TryGetUmbracoContext(out IUmbracoContext? context) && context.InPreviewMode;
        navigation.TryGetChildrenKeysOfType(RiskStructure.TopicFolderKey, "topicItem", out IEnumerable<Guid> keys);
        return keys.Select(key => cache.GetById(preview, key)).OfType<IPublishedContent>()
            .Where(topic => topic.Value<bool>("isActive"))
            .Select(topic => (Topic: topic, Article: topic.Value<IPublishedContent>("readingArticle")))
            .Where(x => x.Article is not null)
            .Select(x => new ReadingTopic(x.Topic.Value<int>("topicNumber"), x.Topic.Value<string>("shortName") ?? "", urls.GetUrl(x.Article!)))
            .OrderBy(x => x.Number).ToArray();
    }
}
