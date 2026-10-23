using System.Text.Json;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Media;

public sealed class HeroMediaComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) =>
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, HeroMediaInitializer>();
}

/// <summary>Đưa bộ ảnh gốc đã tách khỏi bản dựng vào Media trên từng máy; giữ nguyên Key và ảnh biên tập viên đã thay.</summary>
public sealed class HeroMediaInitializer(
    IMediaService mediaService, IMediaTypeService mediaTypes, IDataTypeService dataTypes,
    MediaFileManager files, MediaUrlGeneratorCollection mediaUrls, IShortStringHelper shortStrings,
    IContentTypeBaseServiceProvider contentTypes, IWebHostEnvironment environment,
    ILogger<HeroMediaInitializer> logger) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    private static readonly Guid[] Keys =
    [
        new("d2aa41d7-969b-5bcf-9465-283081375b20"), new("cea052a3-036b-5603-a34b-70d99097b297"),
        new("3c87e4a6-4e93-5697-96df-5cd75c9146ea"), new("4d19be03-2143-5cae-a7e6-5c7fc0e5e640"),
        new("7d3de6de-ff2a-543c-8b0c-c13f7a241f4c")
    ];
    private static readonly string[] Descriptions =
    [
        "Ảnh slide 1 – Giới thiệu. Ảnh tham chiếu giao diện: gt-02-hero-slide-1.png. Nguồn ảnh gốc: chờ chủ quản xác nhận.",
        "Ảnh slide 2 – Ứng phó. Nguồn ảnh: Pexels, mã 8871519. https://www.pexels.com/photo/8871519/",
        "Ảnh slide 3 – Thủ đoạn. Nguồn ảnh: Pexels, mã 7821766. https://www.pexels.com/photo/7821766/",
        "Ảnh slide 4 – Tham gia, Thử sức, Cuộc thi. Nguồn ảnh: Pexels, mã 3768148. https://www.pexels.com/photo/3768148/",
        "Ảnh slide 5 – Hỏi – Đáp. Nguồn ảnh: Pexels, mã 6856828. https://www.pexels.com/photo/6856828/"
    ];

    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        var imageType = mediaTypes.Get("Image");
        if (imageType is null) return;
        if (!imageType.PropertyTypeExists("description"))
        {
            var textArea = await dataTypes.GetAsync(new Guid("c6bac0dd-4ab9-45b1-8e30-e4b619ee5da3"))
                ?? throw new InvalidOperationException("Thiếu data type Textarea cho mô tả ảnh.");
            imageType.AddPropertyType(new PropertyType(shortStrings, textArea, "description")
            {
                Key = new Guid("8df996a1-c2f7-4519-91e0-727e7fa335d2"), Name = "Mô tả",
                Description = "Mô tả ảnh, tác giả hoặc đơn vị cung cấp, đường dẫn nguồn và thông tin cần xác nhận.",
                SortOrder = 5
            }, "image", "Image");
            var result = await mediaTypes.UpdateAsync(imageType, Constants.Security.SuperUserKey);
            if (!result.Success) throw new InvalidOperationException("Không tạo được trường Mô tả cho Media Image.");
        }

        for (var i = 0; i < Keys.Length; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var media = mediaService.GetById(Keys[i]);
            if (media?.Trashed == true) continue;
            bool created = media is null;
            if (media is null)
            {
                media = mediaService.CreateMedia($"Ảnh hero {i + 1} · bản dựng", Constants.System.Root, "Image");
                media.Key = Keys[i];
                media.SortOrder = i;
            }
            var fileName = $"hero-{i + 1}.jpg";
            var value = media.GetValue<string>(Constants.Conventions.Media.File);
            var source = Source(value);
            var legacy = source == $"/assets/img/{fileName}";
            var knownMedia = source.StartsWith("/media/", StringComparison.OrdinalIgnoreCase)
                && source.EndsWith('/' + fileName, StringComparison.OrdinalIgnoreCase);
            // Chỉ khôi phục bộ ảnh mẫu, không ghi đè ảnh khác đã được thay trong CMS.
            if (!created && !legacy && !knownMedia) continue;
            var changed = false;
            if (created || legacy || !files.FileSystem.FileExists(files.FileSystem.GetRelativePath(source)))
            {
                var original = Path.Combine(environment.WebRootPath, "assets", "img", fileName);
                using var stream = System.IO.File.OpenRead(original);
                media.SetValue(files, mediaUrls, shortStrings, contentTypes, Constants.Conventions.Media.File, fileName, stream);
                changed = true;
            }
            if (media.GetValue<int>(Constants.Conventions.Media.Width) <= 0
                || media.GetValue<int>(Constants.Conventions.Media.Height) <= 0
                || media.GetValue<long>(Constants.Conventions.Media.Bytes) <= 0)
            {
                using var stream = files.GetFile(media, out _);
                var info = SixLabors.ImageSharp.Image.Identify(stream);
                media.SetValue(Constants.Conventions.Media.Width, info.Width);
                media.SetValue(Constants.Conventions.Media.Height, info.Height);
                media.SetValue(Constants.Conventions.Media.Bytes, stream.Length);
                media.SetValue(Constants.Conventions.Media.Extension, "jpg");
                changed = true;
            }
            if (string.IsNullOrWhiteSpace(media.GetValue<string>("description")))
            {
                media.SetValue("description", Descriptions[i]);
                changed = true;
            }
            if (!changed) continue;
            if (!mediaService.Save(media).Success) throw new InvalidOperationException($"Không lưu được ảnh hero {i + 1} vào Media.");
            logger.LogInformation("Đã khởi tạo ảnh hero {Slide} trong Media ({Key}).", i + 1, media.Key);
        }
    }

    private static string Source(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        if (!value.TrimStart().StartsWith('{')) return value;
        try
        {
            using var json = JsonDocument.Parse(value);
            return json.RootElement.TryGetProperty("src", out var source) ? source.GetString() ?? string.Empty : string.Empty;
        }
        catch (JsonException) { return string.Empty; }
    }
}
