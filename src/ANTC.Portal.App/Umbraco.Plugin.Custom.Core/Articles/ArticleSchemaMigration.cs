using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.Articles;

/// <summary>Đổi alias dành riêng của Umbraco trước khi uSync nhập schema mới, giữ nguyên thuộc tính và dữ liệu phiên bản.</summary>
public sealed class ArticleSchemaMigration(IContentTypeService types, ILogger<ArticleSchemaMigration> logger)
    : INotificationAsyncHandler<UmbracoApplicationStartingNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartingNotification notification, CancellationToken cancellationToken)
    {
        if (notification.RuntimeLevel != RuntimeLevel.Run) return;
        var article = types.Get("article");
        var legacy = article?.PropertyTypes.FirstOrDefault(x => x.Alias == "isDraft");
        if (article is null || legacy is null) return;
        if (article.PropertyTypes.Any(x => x.Alias == "policyDraft"))
            throw new InvalidOperationException("Bài viết có đồng thời isDraft và policyDraft; cần kiểm tra trước khi chuyển dữ liệu.");

        // Sửa trên chính đối tượng đã lưu để giữ Id và Key. Tạo lại property qua API editor sẽ xóa giá trị cũ.
        legacy.Alias = "policyDraft";
        var result = await types.UpdateAsync(article, Constants.Security.SuperUserKey);
        if (!result.Success) throw new InvalidOperationException("Không chuyển được alias Bản dự thảo của bài viết; dừng để bảo toàn dữ liệu.");
        logger.LogInformation("Đã đổi alias Bản dự thảo của bài viết sang policyDraft và giữ dữ liệu hiện có.");
    }
}
