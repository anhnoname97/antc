using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Security;

namespace Umbraco.Plugin.Custom.Core.Content;

public sealed class ActionFolderMigration(IContentService contents, IContentTypeService types, IKeyValueService markers)
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public static readonly Guid FolderKey = new("c306935d-90ce-427e-9309-802a3ff9b1a5");
    public Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        const string marker = "antc.action-folder.v2.migrated";
        if (markers.GetValue(marker) == "done") return Task.CompletedTask;
        var folder = contents.GetById(FolderKey);
        var folderType = types.Get("actionFolder");
        if (folderType is null || folder is null) return Task.CompletedTask;
        if (folder.ContentType.Alias == "actionFolder")
        {
            if (folder.Edited && !contents.Publish(folder, ["*"]).Success) throw new InvalidOperationException("Không xuất bản lại được kho Việc cần làm sau chuyển loại.");
            markers.SetValue(marker, "done");
            return Task.CompletedTask;
        }
        if (folder is not Umbraco.Cms.Core.Models.Content content || content.Trashed || content.ContentType.Alias != "viecCanLamPage"
            || content.Edited || content.Properties.Any(property => property.GetValue() is { } value && !string.IsNullOrWhiteSpace(value.ToString())))
            throw new InvalidOperationException("Không chuyển kho Việc cần làm vì cấu trúc hoặc nội dung đã thay đổi.");
        content.ChangeContentType(folderType.ToSimple());
        content.TemplateId = null;
        if (!contents.Save(content).Success || !contents.Publish(content, ["*"]).Success)
            throw new InvalidOperationException("Không hoàn thành chuyển loại kho Việc cần làm.");
        markers.SetValue(marker, "done");
        return Task.CompletedTask;
    }
}

public sealed class ActionGuideNotifications(IContentService contents, IRedirectUrlService redirects, IBackOfficeSecurityAccessor security) :
    INotificationHandler<ContentSavingNotification>, INotificationHandler<ContentSavedNotification>,
    INotificationHandler<ContentPublishingNotification>, INotificationHandler<ContentDeletingNotification>,
    INotificationHandler<ContentMovingToRecycleBinNotification>, INotificationHandler<ContentMovingNotification>
{
    public void Handle(ContentSavingNotification notification)
    {
        foreach (var content in notification.SavedEntities.Where(item => item.ContentType.Alias == "viecCanLamPage"))
        {
            if (content.Id == 0 && IsNonAdministrator())
            {
                notification.CancelOperation(new EventMessage("Việc cần làm", "Chỉ Quản trị viên được tạo thêm trang Việc cần làm.", EventMessageType.Error));
                continue;
            }
            content.SetValue("guideKind", string.IsNullOrWhiteSpace(content.GetValue<string>("steps")) || content.GetValue<string>("steps")?.Trim() == "[]" ? "Sàng lọc" : "Hướng dẫn");
            var slug = content.GetValue<string>("umbracoUrlName");
            if (string.IsNullOrWhiteSpace(slug)) continue;
            if (contents.GetPagedChildren(content.ParentId, 0, int.MaxValue, out _).Any(sibling => sibling.Key != content.Key && !sibling.Trashed
                && sibling.ContentType.Alias == "viecCanLamPage" && sibling.GetValue<string>("umbracoUrlName") == slug))
            {
                notification.CancelOperation(new EventMessage("Việc cần làm", "Đường dẫn này đã được một hướng dẫn khác sử dụng.", EventMessageType.Error));
                continue;
            }
            var previous = content.Id > 0 ? contents.GetById(content.Key) : null;
            var old = previous?.GetValue<string>("umbracoUrlName") ?? previous?.GetValue<string>("slug");
            if (!string.IsNullOrEmpty(old) && old != slug && AntcPublicPaths.SelfCheckGuidancePath(old) is { } path)
                notification.State["action-guide-old:" + content.Key] = path;
        }
    }
    public void Handle(ContentSavedNotification notification)
    {
        foreach (var content in notification.SavedEntities)
            if (notification.State.TryGetValue("action-guide-old:" + content.Key, out var previous) && previous is string path)
                redirects.Register(path, content.Key, null);
    }
    public void Handle(ContentPublishingNotification notification)
    {
        foreach (var content in notification.PublishedEntities.Where(item => item.ContentType.Alias == "viecCanLamPage"))
        {
            var errors = new List<string>();
            string Text(string alias) => content.GetValue<string>(alias) ?? "";
            foreach (var alias in new[] { "title", "lead", "icon", "verificationSource" })
                if (string.IsNullOrWhiteSpace(Text(alias))) errors.Add("Thiếu trường " + alias + ".");
            if (!Regex.IsMatch(Text("umbracoUrlName"), "\\A[a-z0-9]+(?:-[a-z0-9]+)*\\z")) errors.Add("Đường dẫn chưa hợp lệ.");
            var review = content.GetValue<DateTime?>("reviewDate");
            if (review is not { Year: > 1900 } || review.Value.Date > DateTime.UtcNow.Date) errors.Add("Cần ngày rà soát hợp lệ, không nằm trong tương lai.");
            if (Text("illustration").Trim() is not ("" or "[]" or "null" or "{}") && string.IsNullOrWhiteSpace(Text("illustrationAlt"))) errors.Add("Ảnh minh họa cần văn bản thay thế.");
            try
            {
                var steps = JsonSerializer.Deserialize<JsonElement[]>(Text("steps").Length > 0 ? Text("steps") : "[]") ?? [];
                var screening = JsonSerializer.Deserialize<JsonElement[]>(Text("screeningQuestions").Length > 0 ? Text("screeningQuestions") : "[]") ?? [];
                if ((steps.Length > 0) == (screening.Length > 0)) errors.Add("Chọn một kiểu nội dung: Các bước hoặc Câu hỏi sàng lọc.");
                if (steps.Length > 0 && !steps.Any(row => row.TryGetProperty("mainText", out var text) && text.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(text.GetString())))
                    errors.Add("Hướng dẫn cần ít nhất một bước có câu chính.");
                foreach (var row in steps.Concat(screening))
                {
                    foreach (var alias in new[] { "onlyIf", "snippetAfter", "targetPage", "followUpPage" })
                    {
                        if (!row.TryGetProperty(alias, out var value) || value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString())) continue;
                        if (alias == "followUpPage" && (!row.TryGetProperty("hasFollowUp", out var enabled) || enabled.ValueKind != JsonValueKind.True)) continue;
                        var raw = value.GetString()!;
                        var target = Guid.TryParse(raw.Split('/').Last(), out var key) ? contents.GetById(key) : null;
                        var expected = alias is "onlyIf" or "snippetAfter" ? "sharedSnippet" : "viecCanLamPage";
                        if (target is null || target.Trashed || !target.Published || target.ContentType.Alias != expected)
                            errors.Add("Mục được chọn ở " + alias + " phải đúng loại và đã xuất bản.");
                    }
                }
            }
            catch (JsonException) { errors.Add("Danh sách bước hoặc câu hỏi chưa hợp lệ."); }
            foreach (var error in errors.Distinct()) notification.CancelOperation(new EventMessage("Việc cần làm", error, EventMessageType.Error));
        }
    }
    private static bool Fixed(IContent content) => content.Key == ActionFolderMigration.FolderKey;
    private bool IsNonAdministrator() => security.BackOfficeSecurity?.CurrentUser is { } user && !user.Groups.Any(group => group.Alias == "admin");
    private bool CannotDelete(IContent content) => Fixed(content) || (content.ContentType.Alias == "viecCanLamPage" && IsNonAdministrator());
    private static EventMessage FixedMessage() => new("Việc cần làm", "Không xóa hoặc di chuyển kho Việc cần làm cố định.", EventMessageType.Error);
    public void Handle(ContentDeletingNotification notification) { if (notification.DeletedEntities.Any(CannotDelete)) notification.CancelOperation(new EventMessage("Việc cần làm", "Không xóa kho cố định; chỉ Quản trị viên được xóa trang Việc cần làm.", EventMessageType.Error)); }
    public void Handle(ContentMovingToRecycleBinNotification notification) { if (notification.MoveInfoCollection.Any(item => CannotDelete(item.Entity))) notification.CancelOperation(new EventMessage("Việc cần làm", "Không xóa kho cố định; chỉ Quản trị viên được xóa trang Việc cần làm.", EventMessageType.Error)); }
    public void Handle(ContentMovingNotification notification) { if (notification.MoveInfoCollection.Any(item => Fixed(item.Entity))) notification.CancelOperation(FixedMessage()); }
}
