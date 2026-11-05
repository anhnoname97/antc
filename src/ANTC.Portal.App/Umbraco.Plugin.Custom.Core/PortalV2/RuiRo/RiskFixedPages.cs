using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed class RiskFixedPages : INotificationHandler<ContentDeletingNotification>,
    INotificationHandler<ContentMovingNotification>, INotificationHandler<ContentMovingToRecycleBinNotification>, INotificationHandler<ContentSavingNotification>
{
    private static bool Fixed(Umbraco.Cms.Core.Models.IContent content) => !RiskStructure.Reconciling.Value
        && (RiskStructure.Pages.Any(p => p.Key == content.Key) || content.ContentType.Alias is "articleFolder" or "alertFolder");
    private static EventMessage Message() => new("Trang cố định", "Không được xóa hoặc di chuyển mục cố định của Các rủi ro. Có thể sắp thứ tự các nhóm trên cây.", EventMessageType.Error);
    public void Handle(ContentDeletingNotification notification)
    { if (notification.DeletedEntities.Any(Fixed)) notification.CancelOperation(Message()); }
    public void Handle(ContentMovingNotification notification)
    { if (notification.MoveInfoCollection.Any(c => Fixed(c.Entity))) notification.CancelOperation(Message()); }
    public void Handle(ContentMovingToRecycleBinNotification notification)
    { if (notification.MoveInfoCollection.Any(c => Fixed(c.Entity))) notification.CancelOperation(Message()); }
    public void Handle(ContentSavingNotification notification)
    {
        var keys = RiskStructure.Pages.Select(p => p.Key).Concat(new[] { PortalV2Keys.Node("c-art"), PortalV2Keys.Node("c-alert") }).ToHashSet();
        if (notification.SavedEntities.Any(c => c.Id == 0 && (RiskSchema.PageAliases.Contains(c.ContentType.Alias) || c.ContentType.Alias is "articleFolder" or "alertFolder") && !keys.Contains(c.Key)))
            notification.CancelOperation(new EventMessage("Trang cố định", "Cảnh báo mới và 5 nhóm rủi ro đã có sẵn; không thêm mục cố định khác.", EventMessageType.Error));
    }
}
