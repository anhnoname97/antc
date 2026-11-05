using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.PortalV2;

namespace Umbraco.Web.UI.Media;

public sealed class RiskMediaComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) => builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, RiskMediaInitializer>();
}

/// <summary>Ảnh tham chiếu của template, đưa vào Media để biên tập viên thay bằng bộ chọn chuẩn.</summary>
public sealed class RiskMediaInitializer(IMediaService media, MediaFileManager files, MediaUrlGeneratorCollection urls,
    IShortStringHelper strings, IContentTypeBaseServiceProvider types, IWebHostEnvironment environment,
    IContentService contents, IRelationService relations)
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        var folder = Path.Combine(environment.WebRootPath, "assets", "img", "risks");
        if (!Directory.Exists(folder)) return Task.CompletedTask;
        foreach (var path in Directory.EnumerateFiles(folder, "*.jpg"))
        {
            var key = PortalV2Keys.For("risk-media:" + Path.GetFileNameWithoutExtension(path));
            var item = media.GetById(key);
            if (item?.Trashed == true) continue;
            if (item is not null)
            {
                string stored = item.GetValue<string>(Constants.Conventions.Media.File) ?? "";
                string source = stored;
                if (stored.TrimStart().StartsWith('{'))
                {
                    using var data = System.Text.Json.JsonDocument.Parse(stored);
                    source = data.RootElement.GetProperty("src").GetString() ?? "";
                }
                // Keep replacements; recover the bundled reference file on a fresh deployment after uSync import.
                if (!source.EndsWith('/' + Path.GetFileName(path), StringComparison.OrdinalIgnoreCase)
                    || files.FileSystem.FileExists(files.FileSystem.GetRelativePath(source))) continue;
            }
            else
            {
                item = media.CreateMedia("Các rủi ro · " + Path.GetFileName(path), Constants.System.Root, "Image");
                item.Key = key;
            }
            using var stream = System.IO.File.OpenRead(path);
            item.SetValue(files, urls, strings, types, Constants.Conventions.Media.File, Path.GetFileName(path), stream);
            var info = SixLabors.ImageSharp.Image.Identify(path);
            item.SetValue(Constants.Conventions.Media.Width, info.Width);
            item.SetValue(Constants.Conventions.Media.Height, info.Height);
            item.SetValue(Constants.Conventions.Media.Bytes, stream.Length);
            item.SetValue(Constants.Conventions.Media.Extension, "jpg");
            item.SetValue("description", "Ảnh tham chiếu từ template goi-cac-rui-ro/backoffice.html. Có thể thay ảnh trong CMS.");
            if (!media.Save(item).Success) throw new InvalidOperationException("Không nhập được ảnh rủi ro " + path);
        }
        // Schema seeding may run before Media initialization on a clean database. Repair those initial references once.
        foreach (string id in new[] { "canh-bao-moi", "g-lua-dao", "g-vay-va-no", "g-dau-tu", "g-bao-hiem-va-tiet-kiem", "g-du-lieu-ca-nhan" })
        {
            var content = contents.GetById(PortalV2Keys.Node(id));
            if (content is null || content.Trashed) continue;
            var childIds = new List<int>();
            foreach (string alias in new[] { "illustration", "thumbnail" })
            {
                string? stored = content.GetValue<string>(alias);
                if (string.IsNullOrWhiteSpace(stored)) continue;
                using var data = System.Text.Json.JsonDocument.Parse(stored);
                foreach (var reference in data.RootElement.EnumerateArray())
                    if (reference.TryGetProperty("mediaKey", out var key) && key.TryGetGuid(out var mediaKey) && media.GetById(mediaKey) is { Trashed: false } image)
                        childIds.Add(image.Id);
            }
            var existing = (relations.GetByParentId(content.Id) ?? []).Select(x => x.ChildId).ToHashSet();
            if (childIds.Any(child => !existing.Contains(child))) contents.Save(content);
        }
        return Task.CompletedTask;
    }
}
