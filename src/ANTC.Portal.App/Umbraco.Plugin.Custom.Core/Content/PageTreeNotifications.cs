using System.Text.Json;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Extensions;

namespace Umbraco.Plugin.Custom.Core.Content;

public sealed class PageTreeComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) => builder
        .AddNotificationHandler<ContentSavingNotification, PageTreeNotifications>()
        .AddNotificationHandler<ContentCopyingNotification, PageTreeNotifications>()
        .AddNotificationHandler<ContentMovingNotification, PageTreeNotifications>();
}

/// <summary>Ngăn tạo, sao chép hoặc di chuyển làm sai cấu trúc trang.</summary>
public sealed class PageTreeNotifications(IContentService contentService) :
    INotificationHandler<ContentSavingNotification>,
    INotificationHandler<ContentCopyingNotification>,
    INotificationHandler<ContentMovingNotification>
{
    public void Handle(ContentSavingNotification notification)
    {
        IContent[] items = notification.SavedEntities.Where(x => !x.Trashed).ToArray();
        foreach (IContent item in items)
        {
            string? error = Validate(item, item.ParentId, items);
            if (error is null) continue;
            notification.CancelOperation(Message(error));
            return;
        }
    }

    public void Handle(ContentCopyingNotification notification)
    {
        int parentId = ParentId(notification.ParentKey);
        // The copy has a different key, so the original must count as a sibling.
        string? error = Validate(notification.Copy, parentId, []);
        if (error is not null) notification.CancelOperation(Message(error));
    }

    public void Handle(ContentMovingNotification notification)
    {
        var moves = notification.MoveInfoCollection.ToArray();
        foreach (var move in moves)
        {
            int parentId = ParentId(move.NewParentKey);
            // Include other entities in the same move request, before any are persisted.
            IContent[] together = moves.Where(x => x.NewParentKey == move.NewParentKey)
                .Select(x => x.Entity).ToArray();
            string? error = Validate(move.Entity, parentId, together);
            if (error is null) continue;
            notification.CancelOperation(Message(error));
            return;
        }
    }

    private int ParentId(Guid? key) => key is null
        ? Constants.System.Root
        : contentService.GetById(key.Value)?.Id ?? 0;

    private string? Validate(IContent item, int parentId, IContent[] pending)
    {
        string alias = item.ContentType.Alias;
        string? parentAlias = parentId == Constants.System.Root
            ? null : contentService.GetById(parentId)?.ContentType.Alias;
        // An unresolved parent must not be mistaken for the root.
        if (parentId != Constants.System.Root && parentAlias is null)
            return "Không tìm thấy trang cha của nội dung.";

        bool duplicate = false;
        if (PageTreeRules.IsSingleton(alias))
        {
            IEnumerable<IContent> siblings = parentId == Constants.System.Root
                ? contentService.GetRootContent()
                : contentService.GetPagedChildren(parentId, 0, int.MaxValue, out _,
                    propertyAliases: [], filter: null, ordering: null, loadTemplates: false);
            duplicate = siblings.Concat(pending).Any(x =>
                !x.Trashed && x.Key != item.Key && x.ContentType.Alias == alias);
        }
        return PageTreeRules.Validate(alias, parentAlias, ListRole(item), duplicate);
    }

    private static string? ListRole(IContent item)
    {
        string? raw = item.GetValue<string>("listRole");
        if (raw?.StartsWith('[') != true) return raw;
        // The native dropdown persists a JSON array even in single-selection mode.
        try { return JsonSerializer.Deserialize<string[]>(raw)?.FirstOrDefault(); }
        catch (JsonException) { return null; }
    }

    private static EventMessage Message(string text) =>
        new("Cấu trúc nội dung", text, EventMessageType.Error);
}
