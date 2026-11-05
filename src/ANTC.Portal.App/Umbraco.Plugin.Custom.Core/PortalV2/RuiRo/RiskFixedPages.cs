using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed class RiskFixedPages : INotificationHandler<ContentDeletingNotification>,
    INotificationHandler<ContentMovingNotification>, INotificationHandler<ContentMovingToRecycleBinNotification>, INotificationHandler<ContentSavingNotification>
{
    private static bool Fixed(string alias) => RiskSchema.PageAliases.Contains(alias) || alias is "articleFolder" or "alertFolder";
    private static EventMessage Message() => new("Trang cố định", "Không được xóa hoặc di chuyển mục cố định của Các rủi ro. Có thể sắp thứ tự các nhóm trên cây.", EventMessageType.Error);
    public void Handle(ContentDeletingNotification notification)
    { if (notification.DeletedEntities.Any(c => Fixed(c.ContentType.Alias))) notification.CancelOperation(Message()); }
    public void Handle(ContentMovingNotification notification)
    { if (notification.MoveInfoCollection.Any(c => Fixed(c.Entity.ContentType.Alias))) notification.CancelOperation(Message()); }
    public void Handle(ContentMovingToRecycleBinNotification notification)
    { if (notification.MoveInfoCollection.Any(c => Fixed(c.Entity.ContentType.Alias))) notification.CancelOperation(Message()); }
    public void Handle(ContentSavingNotification notification)
    {
        string[] ids = ["rui-ro", "canh-bao-moi", "g-lua-dao", "g-vay-va-no", "g-dau-tu", "g-bao-hiem-va-tiet-kiem", "g-du-lieu-ca-nhan", "c-art", "c-alert"];
        var keys = ids.Select(PortalV2Keys.Node).ToHashSet();
        if (notification.SavedEntities.Any(c => c.Id == 0 && Fixed(c.ContentType.Alias) && !keys.Contains(c.Key)))
            notification.CancelOperation(new EventMessage("Trang cố định", "Cảnh báo mới và 5 nhóm rủi ro đã có sẵn; không thêm mục cố định khác.", EventMessageType.Error));
    }
}
