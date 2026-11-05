using System.Text.Json;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Schema;

/// <summary>Khởi tạo một lần; lần sau giữ nội dung, thứ tự và trạng thái do biên tập viên đã lưu.</summary>
public sealed class RiskSchemaMigration(PortalV2SchemaBuilder schema, IContentService contents, IContentTypeService types,
    IDataTypeService dataTypes, RiskStructureAdoption adoption) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        await schema.EnsureRiskSchemaAsync();
        foreach (var name in PortalV2Schema.LineRanges.Select(x => PortalV2Schema.Lines(x.Min, x.Max)))
            await EditorUi(name, "Antc.PropertyEditorUi.LineList");
        foreach (var list in new[] { DanhMucCoDinh.BieuTuong, DanhMucCoDinh.MucDo })
            await EditorUi(list.DataTypeName, "Antc.PropertyEditorUi.FixedChoice");
        await EditorUi(DanhMucCoDinh.LoaiBai.DataTypeName, "Antc.PropertyEditorUi.ArticleKind");
        foreach (var p in PortalV2Schema.LibraryPickers)
        {
            if (await dataTypes.GetAsync(PortalV2Keys.DataType(p.Name)) is not { } dt || dt.EditorUiAlias == "Antc.PropertyEditorUi.NodeCombobox") continue;
            dt.EditorUiAlias = "Antc.PropertyEditorUi.NodeCombobox";
            await dataTypes.UpdateAsync(dt, Constants.Security.SuperUserKey);
        }
        foreach (var spec in RiskSchema.DataTypes().Where(x => x.EditorAlias == "Umbraco.MultiNodeTreePicker"))
        {
            if (spec.Name is "Chọn · Nhóm rủi ro" or "Chọn · Nhóm rủi ro · nhiều") continue;
            var dt = await dataTypes.GetAsync(PortalV2Keys.DataType(spec.Name));
            string? alias = new[] { "riskCategoryPage", "riskArticlePage", "alertPage", "viecCanLamPage", "checklistPage" }
                .FirstOrDefault(a => PortalV2Keys.ContentType(a).ToString() == spec.Config["filter"].ToString());
            if (dt is null || alias is null || types.Get(alias) is not { } type || dt.ConfigurationData["filter"].ToString() == type.Key.ToString()) continue;
            dt.ConfigurationData = new Dictionary<string, object>(dt.ConfigurationData) { ["filter"] = type.Key.ToString() };
            await dataTypes.UpdateAsync(dt, Constants.Security.SuperUserKey);
        }
        await adoption.ApplyAsync();
    }
    private async Task EditorUi(string name, string alias)
    {
        if (await dataTypes.GetAsync(PortalV2Keys.DataType(name)) is not { } dt || dt.EditorUiAlias == alias) return;
        dt.EditorUiAlias = alias;
        var result = await dataTypes.UpdateAsync(dt, Constants.Security.SuperUserKey);
        if (!result.Success) throw new InvalidOperationException("Không gắn được giao diện " + name);
    }
}
