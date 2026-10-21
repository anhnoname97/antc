using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Umbraco.Plugin.Custom.Core.Articles;

/// <summary>Đồng bộ schema bài viết/danh mục trước khi uSync import, giữ nguyên dữ liệu phiên bản hiện có.</summary>
public sealed class ArticleSchemaMigration(IContentTypeService types, IDataTypeService dataTypes,
    IShortStringHelper shortStrings, ILogger<ArticleSchemaMigration> logger)
    : INotificationAsyncHandler<UmbracoApplicationStartingNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartingNotification notification, CancellationToken cancellationToken)
    {
        if (notification.RuntimeLevel != RuntimeLevel.Run) return;
        await AddCategoryHomeFlag();
        var article = types.Get("article");
        if (article is null) return;
        bool changed = false;
        var legacy = article.PropertyTypes.FirstOrDefault(x => x.Alias == "policyDraft");
        if (legacy is not null)
        {
            if (article.PropertyTypes.Any(x => x.Alias == "isDraft"))
                throw new InvalidOperationException("Bài viết có đồng thời isDraft và policyDraft; cần kiểm tra trước khi chuyển dữ liệu.");
            // Đồng bộ alias với main trên chính thuộc tính đã lưu, giữ Id/Key và dữ liệu phiên bản.
            legacy.Alias = "isDraft";
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

    private async Task AddCategoryHomeFlag()
    {
        var category = types.Get("articleList");
        if (category is null || category.PropertyTypeExists("showOnHome")) return;
        var toggle = await dataTypes.GetAsync(new Guid("92897bc6-a5f3-4ffe-ae27-f2e7e33dda49"))
            ?? throw new InvalidOperationException("Thiếu data type True/false cho cờ danh mục trên trang chủ.");
        category.AddPropertyType(new PropertyType(shortStrings, toggle, "showOnHome")
        {
            Key = new Guid("c61a1b99-cc90-4e5c-9d5b-dd1028b486ca"), Name = "Hiển thị ra trang chủ",
            Description = "Bật để API danh mục showOnHome=true lấy danh mục này cho trang chủ. Cần lưu và xuất bản để áp dụng. Tắt vẫn giữ danh mục và các bài viết bên trong.",
            SortOrder = 4
        }, "nộiDung", "Nội dung");
        var result = await types.UpdateAsync(category, Constants.Security.SuperUserKey);
        if (!result.Success) throw new InvalidOperationException("Không bổ sung được cờ trang chủ của danh mục; dừng để bảo toàn dữ liệu.");
        logger.LogInformation("Đã bổ sung cờ hiển thị trang chủ của danh mục, giữ nguyên dữ liệu hiện có.");
    }
}
