using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Services;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public interface IRiskContentSource
{
    IReadOnlyList<RiskNode> Read(bool published);
}

/// <summary>Only the risk catalog and its derivation dependencies; never includes site settings.</summary>
public sealed class RiskContentSource(IContentService contents, IContentTypeService types) : IRiskContentSource
{
    public static readonly string[] Aliases = [.. RiskSchema.EditableAliases, "channelItem", "audienceItem", "stopSignItem",
        "popularityItem", "viecCanLamPage", "checklistPage", "toolCountPage", "toolBranchPage",
        "articleFolder", "alertFolder", "tacticFolder", "sharedSnippet"];

    public IReadOnlyList<RiskNode> Read(bool published)
    {
        int[] typeIds = Aliases.Distinct().Select(types.Get).OfType<IContentType>().Select(t => t.Id).Distinct().ToArray();
        if (typeIds.Length == 0) return [];
        var rows = new List<IContent>();
        for (int page = 0; ; page++)
        {
            rows.AddRange(contents.GetPagedOfTypes(typeIds, page, 200, out long total, null)
                .Where(x => !x.Trashed && (!published || x.Published)));
            if ((page + 1L) * 200 >= total) break;
        }
        var parents = rows.ToDictionary(x => x.Id, x => x.Key);
        return rows.Select(x => new RiskNode(x.Key, parents.GetValueOrDefault(x.ParentId) is var parent && parent != Guid.Empty ? parent : null,
            RiskStructure.LogicalAlias(x.ContentType.Alias), (published ? x.PublishName : x.Name) ?? "", x.SortOrder,
            published ? x.PublishDate ?? x.UpdateDate : x.UpdateDate, x.Published,
            x.Properties.ToDictionary(p => p.Alias, p => p.GetValue(published: published)))
            { ContentTypeKey = x.ContentType.Key }).ToArray();
    }
}

/// <summary>Immutable snapshots, separated for published content and backoffice drafts. Preview always reads afresh.</summary>
public sealed class RiskContentCache(IServiceScopeFactory scopes, TimeProvider clock)
{
    private readonly object _gate = new();
    private readonly Dictionary<bool, (DateTimeOffset Until, IReadOnlyList<RiskNode> Nodes)> _snapshots = [];
    private (DateTimeOffset Until, IReadOnlyList<RiskNode> Nodes)? _audiences;

    public IReadOnlyList<RiskNode> Get(bool published = true, bool preview = false)
    {
        lock (_gate)
        {
            if (!preview && _snapshots.TryGetValue(published, out var snapshot) && snapshot.Until > clock.GetUtcNow())
                return snapshot.Nodes;
            using var scope = scopes.CreateScope();
            var nodes = scope.ServiceProvider.GetRequiredService<IRiskContentSource>().Read(published && !preview);
            if (!preview) _snapshots[published] = (clock.GetUtcNow().AddMinutes(5), nodes);
            return nodes;
        }
    }

    public IReadOnlyList<RiskNode> GetAudiences()
    {
        lock (_gate)
        {
            if (_audiences is { } snapshot && snapshot.Until > clock.GetUtcNow()) return snapshot.Nodes;
            var nodes = Get(published: false).Where(x => x.Type == "audienceItem").ToArray();
            _audiences = (clock.GetUtcNow().AddMinutes(5), nodes);
            return nodes;
        }
    }

    public void Invalidate(bool audiencesChanged = true)
    {
        lock (_gate) { _snapshots.Clear(); if (audiencesChanged) _audiences = null; }
    }
}

public sealed class RiskContentCacheInvalidator(RiskContentCache cache) :
    INotificationHandler<ContentSavedNotification>, INotificationHandler<ContentPublishedNotification>,
    INotificationHandler<ContentUnpublishedNotification>, INotificationHandler<ContentMovedToRecycleBinNotification>,
    INotificationHandler<ContentSortedNotification>, INotificationHandler<ContentMovedNotification>,
    INotificationHandler<ContentDeletedNotification>
{
    private void Invalidate(IEnumerable<IContent> items)
    {
        var aliases = items.Select(x => x.ContentType.Alias).ToHashSet();
        if (aliases.Any(RiskContentSource.Aliases.Contains)) cache.Invalidate(aliases.Contains("audienceItem"));
    }
    public void Handle(ContentSavedNotification notification) => Invalidate(notification.SavedEntities);
    public void Handle(ContentPublishedNotification notification) => Invalidate(notification.PublishedEntities);
    public void Handle(ContentUnpublishedNotification notification) => Invalidate(notification.UnpublishedEntities);
    public void Handle(ContentMovedToRecycleBinNotification notification) => Invalidate(notification.MoveInfoCollection.Select(x => x.Entity));
    public void Handle(ContentSortedNotification notification) => Invalidate(notification.SortedEntities);
    public void Handle(ContentMovedNotification notification) => Invalidate(notification.MoveInfoCollection.Select(x => x.Entity));
    public void Handle(ContentDeletedNotification notification) => Invalidate(notification.DeletedEntities);
}
