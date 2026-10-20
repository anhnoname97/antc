using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Umbraco.Plugin.Custom.Core.Articles;

/// <summary>Đồng bộ schema bài viết trước khi uSync import, giữ nguyên thuộc tính và dữ liệu phiên bản hiện có.</summary>
public sealed class ArticleSchemaMigration(IContentTypeService types, IDataTypeService dataTypes,
    IShortStringHelper shortStrings, ILogger<ArticleSchemaMigration> logger)
    : INotificationAsyncHandler<UmbracoApplicationStartingNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartingNotification notification, CancellationToken cancellationToken)
    {
        if (notification.RuntimeLevel != RuntimeLevel.Run) return;
        var article = types.Get("article");
        if (article is null) return;
        bool changed = false;
        var legacy = article.PropertyTypes.FirstOrDefault(x => x.Alias == "isDraft");
        if (legacy is not null)
        {
            if (article.PropertyTypes.Any(x => x.Alias == "policyDraft"))
                throw new InvalidOperationException("Bài viết có đồng thời isDraft và policyDraft; cần kiểm tra trước khi chuyển dữ liệu.");
            // Sửa trên chính đối tượng đã lưu để giữ Id và Key cùng dữ liệu phiên bản.
            legacy.Alias = "policyDraft";
            changed = true;
        }
        if (!article.PropertyTypeExists("showOnHome"))
        {
            var toggle = await dataTypes.GetAsync(new Guid("92897bc6-a5f3-4ffe-ae27-f2e7e33dda49"))
                ?? throw new InvalidOperationException("Thiếu data type True/false cho cờ hiển thị trang chủ.");
            article.AddPropertyType(new PropertyType(shortStrings, toggle, "showOnHome")
            {
                Key = new Guid("6d57c90d-f866-4e55-a7dd-7060d82fc050"), Name = "Hiển thị ra trang chủ",
                Description = "Bật để API showOnHome=true lấy bài cho trang chủ. Cần lưu và xuất bản để áp dụng. Tắt vẫn giữ bài trong danh mục.",
                SortOrder = 4
            }, "noiDung", "Nội dung");
            changed = true;
        }
        if (!changed) return;

        var result = await types.UpdateAsync(article, Constants.Security.SuperUserKey);
        if (!result.Success) throw new InvalidOperationException("Không cập nhật được schema bài viết; dừng để bảo toàn dữ liệu.");
        logger.LogInformation("Đã cập nhật schema bài viết và giữ dữ liệu hiện có.");
    }
}
