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
using File = System.IO.File;

namespace Umbraco.Web.UI.Media;

public sealed class RiskMediaComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) =>
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, RiskMediaInitializer>();
}

/// <summary>Restore only missing sample files, using the stable uSync media keys and the configured media filesystem.</summary>
public sealed class RiskMediaInitializer(IMediaService mediaService, IMediaTypeService mediaTypes,
    MediaFileManager files, MediaUrlGeneratorCollection mediaUrls, IShortStringHelper shortStrings,
    IContentTypeBaseServiceProvider contentTypes, IWebHostEnvironment environment, IKeyValueService markers,
    ILogger<RiskMediaInitializer> logger) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    private static readonly (Guid Key, string File)[] Samples =
    [
        (new("0526e0be-93a9-564b-a0cf-49ef02f29d86"), "m-a05.jpg"),
        (new("27406caa-f511-5b60-9ffc-7273b17d46d8"), "m-a06.jpg"),
        (new("87d572fe-ecd0-5a6f-983e-fbc8d979158f"), "m-a07.jpg"),
        (new("e42448cb-8856-55fe-9d41-e55955074847"), "m-a08.jpg"),
        (new("1e5f5d99-324b-552b-97ac-905b9b8a8286"), "m-a09.jpg"),
        (new("1383cac0-c831-5161-9c39-38e0437387f7"), "m-a23.jpg"),
        (new("fbdbf385-7e41-5d4c-b663-7b4fd7c7fe00"), "m-a30.jpg"),
        (new("5b4275e0-856f-5964-ab24-3285898c28d2"), "m-a38.jpg"),
        (new("42a001e3-9d14-57b3-9ea5-6b415d82f68a"), "m-a39.jpg")
    ];

    public Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        if (mediaTypes.Get("Image") is null) return Task.CompletedTask;
        foreach (var sample in Samples)
        {
            cancellationToken.ThrowIfCancellationRequested();
            string marker = "antc.portal-v2.risks.media." + sample.Key.ToString("N");
            string original = Path.Combine(environment.WebRootPath, "assets", "img", "risks", sample.File);
            if (!File.Exists(original)) continue;
            try
            {
                var media = mediaService.GetById(sample.Key);
                if (media?.Trashed == true) continue;
                string source = Source(media?.GetValue<string>(Constants.Conventions.Media.File));
                // Authored replacements are never overwritten, even if their own file is unavailable.
                if (source.Length > 0 && !source.EndsWith("/" + sample.File, StringComparison.OrdinalIgnoreCase)) continue;
                if (source.Length > 0 && files.FileSystem.FileExists(files.FileSystem.GetRelativePath(source)))
                {
                    if (markers.GetValue(marker) != "done") markers.SetValue(marker, "done");
                    continue;
                }
                media ??= mediaService.CreateMedia("Các rủi ro · " + sample.File, Constants.System.Root, "Image");
                media.Key = sample.Key;
                using var stream = File.OpenRead(original);
                media.SetValue(files, mediaUrls, shortStrings, contentTypes, Constants.Conventions.Media.File, sample.File, stream);
                if (!mediaService.Save(media).Success) throw new InvalidOperationException("Không lưu được Media.");
                markers.SetValue(marker, "done");
                logger.LogInformation("Đã nạp ảnh mẫu Các rủi ro {Key} ({File}).", sample.Key, sample.File);
            }
            catch (Exception ex) { logger.LogError(ex, "Không nạp được ảnh mẫu Các rủi ro {Key}; sẽ thử lại lần khởi động sau.", sample.Key); }
        }
        return Task.CompletedTask;
    }

    private static string Source(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "";
        if (!value.TrimStart().StartsWith('{')) return value;
        try { using var json = JsonDocument.Parse(value); return json.RootElement.TryGetProperty("src", out var src) ? src.GetString() ?? "" : ""; }
        catch (JsonException) { return ""; }
    }
}
