using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace Umbraco.Plugin.Custom.Core.Content;

/// <summary>The homepage illustration is optional; a selected image needs an accessible description.</summary>
public sealed class HomePagePublishingHandler : INotificationHandler<ContentPublishingNotification>
{
    public void Handle(ContentPublishingNotification notification)
    {
        foreach (var content in notification.PublishedEntities.Where(item => item.ContentType.Alias == "home"))
        {
            var image = content.GetValue<string>("illustration")?.Trim();
            if (image is not (null or "" or "[]" or "{}" or "null")
                && string.IsNullOrWhiteSpace(content.GetValue<string>("illustrationAlt")))
                notification.CancelOperation(new EventMessage("Trang chủ", "Ảnh minh họa cần văn bản thay thế trước khi xuất bản.", EventMessageType.Error));
        }
    }
}
