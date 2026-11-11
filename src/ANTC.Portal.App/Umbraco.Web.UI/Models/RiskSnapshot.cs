using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Plugin.Custom.Core.Content;
using Umbraco.Plugin.Custom.Core.PortalV2;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Web.UI.Models;

/// <summary>Du lieu da xuat ban cua Cac rui ro cho view (WEB-01, WEB-07): lay RiskNode tu bo dem dung chung RiskContentCache
/// (cung dau vao voi backoffice, da tu xoa khi co thao tac xuat ban/sap xep) va anh xa sang IPublishedContent.</summary>
public sealed class RiskSnapshot
{
    /// <summary>Thu muc Quan ly noi dung › Danh sach kiem tra (khoa trong uSync, chua co hang so chung).</summary>
    public static readonly Guid ChecklistFolderKey = new("5c018bd7-d1b8-5d2e-a3b3-bc7cb36eb24b");

    private static readonly (Guid Folder, string Alias)[] Sources =
    [
        (RiskStructure.ArticleFolderKey, "riskArticlePage"), (RiskStructure.AlertFolderKey, "alertPage"),
        (PortalV2Keys.Node("f-tac"), "tacticItem"), (PortalV2Keys.Node("f-aud"), "audienceItem"),
        (PortalV2Keys.Node("f-ch"), "channelItem"), (RiskStructure.TopicFolderKey, "topicItem"),
        (ChecklistFolderKey, "checklistPage"), (ActionFolderMigration.FolderKey, "viecCanLamPage"),
        (PortalV2Keys.Node("f-snip"), "sharedSnippet")
    ];

    private readonly Dictionary<Guid, IPublishedContent> _content;
    private readonly Dictionary<Guid, RiskNode> _nodes;

    private RiskSnapshot(IReadOnlyList<(RiskNode Node, IPublishedContent Content)> items)
    {
        Nodes = items.Select(x => x.Node).ToArray();
        _nodes = items.ToDictionary(x => x.Node.Key, x => x.Node);
        _content = items.ToDictionary(x => x.Node.Key, x => x.Content);
    }

    public IReadOnlyList<RiskNode> Nodes { get; }

    public static RiskSnapshot Read(RiskContentCache cache, Func<Guid, IPublishedContent?> byKey,
        IDocumentNavigationQueryService? navigation = null) =>
        Read(cache.Get(published: true), byKey, navigation is null ? null
            : key => navigation.TryGetParentKey(key, out Guid? parentKey) ? parentKey : null);

    public static RiskSnapshot Read(IReadOnlyList<RiskNode> cachedNodes, Func<Guid, IPublishedContent?> byKey,
        Func<Guid, Guid?>? parentOf = null)
    {
        var publishedByKey = new Dictionary<Guid, RiskNode>(cachedNodes.Count);
        foreach (var node in cachedNodes)
            if (node.Published) publishedByKey.TryAdd(node.Key, node);

        var items = new List<(RiskNode, IPublishedContent)>();
        foreach (var page in RiskStructure.Pages.Skip(2))
        {
            if (byKey(page.Key) is not { } group) continue;
            var node = publishedByKey.TryGetValue(page.Key, out var cached)
                ? cached with { Order = page.Order }
                : ToNode(group, page.Order);
            items.Add((node, group));
        }
        foreach (var (folder, alias) in Sources)
        {
            int order = 0;
            foreach (var cached in cachedNodes
                .Where(n => n.Published && n.Type == alias)
                .OrderBy(n => n.Order)
                .ThenBy(n => n.Name, StringComparer.Ordinal))
            {
                if (byKey(cached.Key) is not { } content) continue;
                Guid? parentKey = cached.ParentKey ?? parentOf?.Invoke(cached.Key);
                if (parentKey != folder) continue;
                items.Add((cached with { Order = order++ }, content));
            }
        }
        return new RiskSnapshot(items);
    }

    private static RiskNode ToNode(IPublishedContent x, int order) => new(x.Key, null,
        RiskStructure.LogicalAlias(x.ContentType.Alias), x.Name, order, x.UpdateDate, true,
        x.Properties.ToDictionary(p => p.Alias, p => p.GetSourceValue()));

    public RiskNode? Node(Guid key) => _nodes.GetValueOrDefault(key);

    public IPublishedContent? Content(Guid key) => _content.GetValueOrDefault(key);

    public IPublishedContent? Content(RiskNode? node) => node is null ? null : Content(node.Key);

    /// <summary>Muc da xuat ban cua mot loai, theo thu tu keo trong thu muc.</summary>
    public IEnumerable<IPublishedContent> Of(string alias) => Nodes.Where(x => x.Type == alias).Select(Content).OfType<IPublishedContent>();
}
