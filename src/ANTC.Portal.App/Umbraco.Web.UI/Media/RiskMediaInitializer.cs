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

/// <summary>Khoi phuc cac file anh mau bi thieu theo Key uSync on dinh va MediaFileManager.</summary>
public sealed class RiskMediaInitializer(IMediaService mediaService, IMediaTypeService mediaTypes,
    MediaFileManager files, MediaUrlGeneratorCollection mediaUrls, IShortStringHelper shortStrings,
    IContentTypeBaseServiceProvider contentTypes, IWebHostEnvironment environment, IKeyValueService markers,
    ILogger<RiskMediaInitializer> logger) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    private static readonly (Guid Key, string AssetPath, string Label)[] Samples =
    [
        // 9 anh minh hoa thu doan m-a*.jpg
        (new("0526e0be-93a9-564b-a0cf-49ef02f29d86"), "img/risks/m-a05.jpg", "Các rủi ro · m-a05.jpg"),
        (new("27406caa-f511-5b60-9ffc-7273b17d46d8"), "img/risks/m-a06.jpg", "Các rủi ro · m-a06.jpg"),
        (new("87d572fe-ecd0-5a6f-983e-fbc8d979158f"), "img/risks/m-a07.jpg", "Các rủi ro · m-a07.jpg"),
        (new("e42448cb-8856-55fe-9d41-e55955074847"), "img/risks/m-a08.jpg", "Các rủi ro · m-a08.jpg"),
        (new("1e5f5d99-324b-552b-97ac-905b9b8a8286"), "img/risks/m-a09.jpg", "Các rủi ro · m-a09.jpg"),
        (new("1383cac0-c831-5161-9c39-38e0437387f7"), "img/risks/m-a23.jpg", "Các rủi ro · m-a23.jpg"),
        (new("fbdbf385-7e41-5d4c-b663-7b4fd7c7fe00"), "img/risks/m-a30.jpg", "Các rủi ro · m-a30.jpg"),
        (new("5b4275e0-856f-5964-ab24-3285898c28d2"), "img/risks/m-a38.jpg", "Các rủi ro · m-a38.jpg"),
        (new("42a001e3-9d14-57b3-9ea5-6b415d82f68a"), "img/risks/m-a39.jpg", "Các rủi ro · m-a39.jpg"),

        // 8 anh nhom / hoi-dap .jpeg
        (new("141709a0-916f-4e22-aada-a08b81229e5c"), "img/risks/bhtk.jpeg", "BHTK"),
        (new("ed246945-90e5-4dc1-ac89-24122be4954f"), "img/risks/cbm.jpeg", "CBM"),
        (new("48ed79c4-4a5a-48c2-890f-d12f3b68dbbb"), "img/risks/dlcn.jpeg", "DLCN"),
        (new("ca67ac2b-43d6-4bbf-bceb-de7c9a9453e9"), "img/risks/dtu.jpeg", "Dtu"),
        (new("9f92915c-c305-4a85-a495-e44b5350efc3"), "img/risks/hdd.jpeg", "HDD"),
        (new("e32e05e4-4739-4af5-9542-d0a2f5f34d18"), "img/risks/hdd.jpeg", "HDD (1)"),
        (new("960e0d43-6428-4126-97cd-1021d38ad201"), "img/risks/ld.jpeg", "LD"),
        (new("1fb2df3a-1eb2-4726-a87d-bb1a0b967f46"), "img/risks/vayno.jpeg", "Vayno"),

        // 31 anh ban dung 10/11 (.webp)
        (new("ba6a1f4c-c9b9-43d1-aeca-a7e5169ac647"), "img/risks/img-01-trang-chu-khan-cap-880.webp", "Img 01 Trang Chu Khan Cap 880"),
        (new("50189e48-1758-4ed1-881d-3a65be552620"), "img/risks/img-05-nhom-lua-dao-480.webp", "Các rủi ro · Lừa đảo (bản dựng 10/11)"),
        (new("8e3e4edc-56dd-4e5a-a080-c2fee2bfe3c0"), "img/risks/img-06-nhom-vay-va-no-480.webp", "Các rủi ro · Vay và nợ (bản dựng 10/11)"),
        (new("c104e261-8a83-4dd8-bd1f-0d2b7dc5ccbd"), "img/risks/img-07-nhom-dau-tu-480.webp", "Các rủi ro · Đầu tư (bản dựng 10/11)"),
        (new("6f079f1b-e2ca-418c-92c1-1760d7683897"), "img/risks/img-08-nhom-bao-hiem-tiet-kiem-480.webp", "Các rủi ro · Bảo hiểm và tiết kiệm (bản dựng 10/11)"),
        (new("a4fe8eac-502b-47f7-b995-26c36a5f17f1"), "img/risks/img-09-nhom-du-lieu-ca-nhan-480.webp", "Các rủi ro · Dữ liệu cá nhân (bản dựng 10/11)"),
        (new("025103a1-7488-4496-afdf-fc940d2f2030"), "img/risks/img-18-nhom-canh-bao-moi-480.webp", "Các rủi ro · Cảnh báo (bản dựng 10/11)"),
        (new("38b7fbbb-bf8e-4029-8bb1-f2b4cce36c6c"), "img/risks/img-10-cd7-cuoc-goi-tin-nhan-1640.webp", "Bài hướng dẫn · img-10-cd7-cuoc-goi-tin-nhan (bản dựng 10/11)"),
        (new("d60f327b-51ef-4da1-b4cb-7ad849c3ef15"), "img/risks/img-19-cd1-nen-tang-1640.webp", "Bài đọc · img-19-cd1-nen-tang (bản dựng 10/11)"),
        (new("7b7feeb2-0274-41ed-a529-f22925c3b533"), "img/risks/img-20-cd8-xu-ly-phuc-hoi-1640.webp", "Bài đọc · img-20-cd8-xu-ly-phuc-hoi (bản dựng 10/11)"),
        (new("36258e77-ea76-45db-9f4d-0df4bd70a782"), "img/risks/img-11-cd6-mua-ban-dat-coc-1640.webp", "Bài hướng dẫn · img-11-cd6-mua-ban-dat-coc (bản dựng 10/11)"),
        (new("0f94c524-f278-482f-94ff-6742140243ee"), "img/risks/img-11-cd6-mua-ban-dat-coc-1640.webp", "Cảnh báo · img-11-cd6-mua-ban-dat-coc (bản dựng 10/11)"),
        (new("05324fb0-8dee-4614-be15-a83b7a335c14"), "img/risks/img-12-cd5-viec-lam-nhiem-vu-1640.webp", "Bài hướng dẫn · img-12-cd5-viec-lam-nhiem-vu (bản dựng 10/11)"),
        (new("ba9ac872-3fe5-4345-9665-6418dd08fa33"), "img/risks/img-12-cd5-viec-lam-nhiem-vu-1640.webp", "Cảnh báo · img-12-cd5-viec-lam-nhiem-vu (bản dựng 10/11)"),
        (new("fa02e2c2-bf76-4299-95bb-45dce7a02a1d"), "img/risks/img-13-cd3-dau-tu-gop-von-1640.webp", "Bài hướng dẫn · img-13-cd3-dau-tu-gop-von (bản dựng 10/11)"),
        (new("4665eb7c-4243-4b7d-b551-1dc479504e59"), "img/risks/img-13-cd3-dau-tu-gop-von-1640.webp", "Cảnh báo · img-13-cd3-dau-tu-gop-von (bản dựng 10/11)"),
        (new("4bd8a6e7-b904-49e4-80fa-534620745288"), "img/risks/img-14-cd4-vay-bao-lanh-1640.webp", "Bài hướng dẫn · img-14-cd4-vay-bao-lanh (bản dựng 10/11)"),
        (new("e8b707fa-ab24-4ba3-91f5-9fe20096c2ca"), "img/risks/img-14-cd4-vay-bao-lanh-1640.webp", "Cảnh báo · img-14-cd4-vay-bao-lanh (bản dựng 10/11)"),
        (new("0fd6d39d-85ae-46c3-b12b-234487abc9b8"), "img/risks/img-15-cd2-hop-dong-1640.webp", "Bài hướng dẫn · img-15-cd2-hop-dong (bản dựng 10/11)"),
        (new("dca742ac-c3a2-4d64-bf74-1b4932a1cd0e"), "img/risks/img-15-cd2-hop-dong-1640.webp", "Cảnh báo · img-15-cd2-hop-dong (bản dựng 10/11)"),
        (new("bc0b39e1-834e-4025-83d7-e8f72e045df5"), "img/risks/img-27-doc-them-3-3-1640.webp", "Cảnh báo · img-27-doc-them-3-3 (bản dựng 10/11)"),
        (new("f479af62-7ca3-40aa-8982-362e587fd31c"), "img/risks/img-36-gia-danh-cong-an-1640.webp", "Cảnh báo · img-36-gia-danh-cong-an (bản dựng 10/11)"),
        (new("cf3eed9b-800b-4a50-8d82-b9b0ade3118a"), "img/risks/img-36-gia-danh-cong-an-1640.webp", "Thủ đoạn · img-36-gia-danh-cong-an (bản dựng 10/11)"),
        (new("b4cefa63-1bbd-4337-aa11-5022a89aa72d"), "img/risks/img-37-bat-coc-online-1640.webp", "Thủ đoạn · img-37-bat-coc-online (bản dựng 10/11)"),
        (new("4fa75fd7-50e2-427c-a1dd-af4197dfd326"), "img/risks/img-38-duong-day-goi-dien-1640.webp", "Cảnh báo · img-38-duong-day-goi-dien (bản dựng 10/11)"),
        (new("a2f64189-08e7-4b55-aa16-43d4116c723a"), "img/risks/img-38-duong-day-goi-dien-1640.webp", "Thủ đoạn · img-38-duong-day-goi-dien (bản dựng 10/11)"),
        (new("990cb99e-a1ff-41a9-84b6-2d0038100d6d"), "img/risks/img-39-chiem-quyen-dieu-khien-1640.webp", "Cảnh báo · img-39-chiem-quyen-dieu-khien (bản dựng 10/11)"),
        (new("ac155a4c-1740-44a8-a691-888c2fd385f9"), "img/risks/img-39-chiem-quyen-dieu-khien-1640.webp", "Thủ đoạn · img-39-chiem-quyen-dieu-khien (bản dựng 10/11)"),
        (new("0e3155ba-9012-4058-bd75-45a65a1c3713"), "img/risks/img-40-moi-viec-lam-nuoc-ngoai-1640.webp", "Thủ đoạn · img-40-moi-viec-lam-nuoc-ngoai (bản dựng 10/11)"),
        (new("81a6a6de-3e1a-4331-af34-0f8a99400d48"), "img/risks/img-41-quay-ngan-hang-1640.webp", "Cảnh báo · img-41-quay-ngan-hang (bản dựng 10/11)"),
        (new("8be34e1c-72a8-477c-8fa5-47c9ba750746"), "img/risks/img-41-quay-ngan-hang-1640.webp", "Thủ đoạn · img-41-quay-ngan-hang (bản dựng 10/11)"),

        // Anh trang Ve website tu ban HTML chinh thuc; bien tap vien co the thay trong Media.
        (new("bbfba28e-39b4-58c7-b462-70735ed1b621"), "img/v2/img-21-ve-website-1640.webp", "Về website · Bà con tự kiểm tra thông tin"),

        // 2 anh trang chu va hoat dong cuoc thi
        (new("bc8c5385-ac5c-5075-aa5a-f7112d760000"), "images/home-v2-illustration.jpg", "Trang chủ V2 · Minh họa từ bản dựng"),
        (new("e1a89c3e-8812-4eb5-8271-9c8e19bfa520"), "img/risks/contest-hero.jpg", "Ảnh hoạt động cuộc thi")
    ];

    public Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        if (mediaTypes.Get("Image") is null) return Task.CompletedTask;
        foreach (var sample in Samples)
        {
            cancellationToken.ThrowIfCancellationRequested();
            string fileName = Path.GetFileName(sample.AssetPath);
            string marker = "antc.portal-v2.risks.media." + sample.Key.ToString("N");
            string original = Path.Combine(
                environment.WebRootPath,
                "assets",
                sample.AssetPath.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(original)) continue;
            try
            {
                var media = mediaService.GetById(sample.Key);
                if (media?.Trashed == true) continue;
                string source = Source(media?.GetValue<string>(Constants.Conventions.Media.File));
                // Khong bao gio ghi de anh da duoc bien tap vien thay bang file khac.
                if (source.Length > 0 && !source.EndsWith("/" + fileName, StringComparison.OrdinalIgnoreCase)) continue;
                bool changed = false;
                if (media is null || !source.StartsWith("/media/", StringComparison.OrdinalIgnoreCase))
                {
                    media ??= mediaService.CreateMedia(sample.Label, Constants.System.Root, "Image");
                    media.Key = sample.Key;
                    using var stream = File.OpenRead(original);
                    media.SetValue(files, mediaUrls, shortStrings, contentTypes, Constants.Conventions.Media.File, fileName, stream);
                    changed = true;
                }
                else
                {
                    string relPath = files.FileSystem.GetRelativePath(source);
                    if (!files.FileSystem.FileExists(relPath))
                    {
                        using var stream = File.OpenRead(original);
                        files.FileSystem.AddFile(relPath, stream, overrideIfExists: true);
                    }
                }
                if (media.GetValue<int>(Constants.Conventions.Media.Width) <= 0
                    || media.GetValue<int>(Constants.Conventions.Media.Height) <= 0
                    || media.GetValue<long>(Constants.Conventions.Media.Bytes) <= 0)
                {
                    using var infoStream = File.OpenRead(original);
                    var info = SixLabors.ImageSharp.Image.Identify(infoStream);
                    var length = new FileInfo(original).Length;
                    var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
                    media.SetValue(Constants.Conventions.Media.Width, info.Width);
                    media.SetValue(Constants.Conventions.Media.Height, info.Height);
                    media.SetValue(Constants.Conventions.Media.Bytes, length);
                    media.SetValue(Constants.Conventions.Media.Extension, ext);
                    changed = true;
                }
                if (changed)
                {
                    if (!mediaService.Save(media).Success) throw new InvalidOperationException("Không lưu được Media.");
                    logger.LogInformation("Đã nạp ảnh mẫu Các rủi ro {Key} ({File}).", sample.Key, fileName);
                }
                if (markers.GetValue(marker) != "done") markers.SetValue(marker, "done");
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
