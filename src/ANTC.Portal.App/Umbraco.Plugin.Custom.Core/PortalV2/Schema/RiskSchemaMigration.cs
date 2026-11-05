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
    IDataTypeService dataTypes) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
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
            var dt = await dataTypes.GetAsync(PortalV2Keys.DataType(spec.Name));
            string? alias = new[] { "riskCategoryPage", "riskArticlePage", "alertPage", "viecCanLamPage", "checklistPage" }
                .FirstOrDefault(a => PortalV2Keys.ContentType(a).ToString() == spec.Config["filter"].ToString());
            if (dt is null || alias is null || types.Get(alias) is not { } type || dt.ConfigurationData["filter"].ToString() == type.Key.ToString()) continue;
            dt.ConfigurationData = new Dictionary<string, object>(dt.ConfigurationData) { ["filter"] = type.Key.ToString() };
            await dataTypes.UpdateAsync(dt, Constants.Security.SuperUserKey);
        }
        var pages = OfType("pageManagement").FirstOrDefault();
        var contentRoot = OfType("contentManagement").FirstOrDefault();
        if (pages is null || contentRoot is null) return;
        await Allow(pages.ContentType.Alias, "ruiRoPage");
        await Allow(contentRoot.ContentType.Alias, "articleFolder", "alertFolder", "libraryFolder", "snippetFolder", "quickQaFolder");
        if (OfType("libraryFolder").FirstOrDefault() is { } library)
        {
            if (library.ParentId != contentRoot.Id)
            {
                var moved = contents.Move(library, contentRoot.Id);
                if (!moved.Success) throw new InvalidOperationException("Không chuyển được Danh mục vào Quản lý nội dung.");
                library = contents.GetById(library.Key)!;
            }
            if (library.Name == "Thư viện") { library.Name = "Danh mục"; contents.Save(library); }
            foreach (var alias in new[] { "snippetFolder", "quickQaFolder" })
                foreach (var folder in OfType(alias).Where(x => x.ParentId == library.Id)) contents.Move(folder, contentRoot.Id);
        }
        if (contentRoot.ParentId == pages.ParentId && contentRoot.SortOrder > pages.SortOrder)
        {
            var siblings = contents.GetPagedChildren(pages.ParentId, 0, int.MaxValue, out _).OrderBy(x => x.SortOrder).ToList();
            siblings.RemoveAll(x => x.Id == contentRoot.Id); siblings.Insert(siblings.FindIndex(x => x.Id == pages.Id), contentRoot);
            contents.Sort(siblings);
        }
        Ensure("c-art", "Bài viết", "articleFolder", contentRoot.Id, new Dictionary<string, object?>());
        Ensure("c-alert", "Cảnh báo", "alertFolder", contentRoot.Id, new Dictionary<string, object?>());

        using var stream = typeof(RiskSchemaMigration).Assembly.GetManifestResourceStream("Umbraco.Plugin.Custom.Core.Data.Seed.risk-pages.json")!;
        using var data = JsonDocument.Parse(stream);
        var aliases = new Dictionary<string, string> { ["tab"] = "tabName", ["short"] = "cardDescription", ["showAdvice"] = "showAdviceBox", ["sample"] = "showSampleNote", ["illusAlt"] = "illustrationAlt" };
        int riskParent = pages.Id;
        foreach (var node in data.RootElement.EnumerateArray())
        {
            string id = node.GetProperty("id").GetString()!, alias = node.GetProperty("type").GetString()!;
            var values = new Dictionary<string, object?>();
            foreach (var v in node.GetProperty("v").EnumerateObject())
            {
                if (v.Name is "illus" or "thumb")
                {
                    var key = PortalV2Keys.For("risk-media:" + v.Value.GetString());
                    values[v.Name == "illus" ? "illustration" : "thumbnail"] = JsonSerializer.Serialize(new[] { new { key = PortalV2Keys.For(id + ":" + v.Name), mediaKey = key, crops = Array.Empty<object>(), focalPoint = (object?)null } });
                }
                else if (v.Name == "icon") values["icon"] = JsonSerializer.Serialize(new[] { DanhMucCoDinh.BieuTuong.Label(v.Value.GetString()) });
                else values[aliases.GetValueOrDefault(v.Name, v.Name)] = v.Value.ValueKind == JsonValueKind.True ? true : v.Value.ValueKind == JsonValueKind.False ? false : v.Value.GetString();
            }
            if (alias == "riskCategoryPage") values["umbracoUrlName"] = id[2..];
            var item = Ensure(id, node.GetProperty("name").GetString()!, alias, alias == "ruiRoPage" ? pages.Id : riskParent, values);
            if (alias == "ruiRoPage") riskParent = item.Id;
        }
    }
    private IEnumerable<IContent> OfType(string alias) => types.Get(alias) is { } t
        ? contents.GetPagedOfType(t.Id, 0, int.MaxValue, out _, null).Where(x => !x.Trashed) : [];
    private async Task EditorUi(string name, string alias)
    {
        if (await dataTypes.GetAsync(PortalV2Keys.DataType(name)) is not { } dt || dt.EditorUiAlias == alias) return;
        dt.EditorUiAlias = alias;
        var result = await dataTypes.UpdateAsync(dt, Constants.Security.SuperUserKey);
        if (!result.Success) throw new InvalidOperationException("Không gắn được giao diện " + name);
    }
    private async Task Allow(string alias, params string[] children)
    {
        var t = types.Get(alias)!;
        var additions = children.Select(a => types.Get(a)!).Where(c => !t.AllowedContentTypes.Any(x => x.Key == c.Key)).ToArray();
        if (additions.Length == 0) return;
        t.AllowedContentTypes = t.AllowedContentTypes.Concat(additions.Select((c, i) => new ContentTypeSort(c.Key, i + 50, c.Alias))).ToArray();
        var result = await types.UpdateAsync(t, Constants.Security.SuperUserKey);
        if (!result.Success) throw new InvalidOperationException("Không bổ sung được cây Các rủi ro.");
    }
    private IContent Ensure(string id, string name, string alias, int parent, Dictionary<string, object?> values)
    {
        var key = PortalV2Keys.Node(id);
        if (contents.GetById(key) is { } existing) return existing;
        var sameType = OfType(alias).FirstOrDefault(x => x.ParentId == parent && (alias != "riskCategoryPage" || x.Name == name));
        if (sameType is not null) return sameType;
        var content = contents.Create(name, parent, alias); content.Key = key;
        foreach (var (property, value) in values) if (content.HasProperty(property)) content.SetValue(property, value);
        var saved = contents.Save(content);
        if (!saved.Success) throw new InvalidOperationException("Không tạo được trang " + name);
        // Khung trang mới là bản nháp để biên tập viên kiểm tra trước khi đưa ra website.
        return content;
    }
}
