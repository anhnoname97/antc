using System.Collections;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;

/// <summary>
/// Luc khoi dong so danh sach trong data type Dropdown voi DanhMucCoDinh; lech thi ghi canh bao.
/// Khong sua gi, chi bao de nguoi phu trach biet code va cau hinh dang khac nhau.
/// </summary>
public sealed class DanhMucStartupCheck(IDataTypeService dataTypes, ILogger<DanhMucStartupCheck> logger)
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        foreach (DanhSachCoDinh list in DanhMucCoDinh.All)
        {
            var dataType = await dataTypes.GetAsync(PortalV2Keys.DataType(list.DataTypeName));
            if (dataType is null) continue;
            string[] actual = Items(dataType.ConfigurationData.TryGetValue("items", out object? raw) ? raw : null);
            string[] expected = list.Items.Select(x => x.Label).ToArray();
            if (actual.SequenceEqual(expected)) continue;
            logger.LogWarning("Data type {Name} lệch với DanhMucCoDinh. Đang có: {Actual}. Code cần: {Expected}.",
                list.DataTypeName, string.Join(" | ", actual), string.Join(" | ", expected));
        }
    }

    internal static string[] Items(object? raw) => raw switch
    {
        null => [],
        string s => [s],
        JsonElement { ValueKind: JsonValueKind.Array } e => e.EnumerateArray().Select(x => x.ToString()).ToArray(),
        IEnumerable e => e.Cast<object?>().Select(x => x?.ToString() ?? string.Empty).ToArray(),
        _ => [raw.ToString() ?? string.Empty],
    };
}
