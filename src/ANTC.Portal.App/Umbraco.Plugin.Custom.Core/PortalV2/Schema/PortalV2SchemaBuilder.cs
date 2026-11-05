using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Schema;

/// <summary>Cau hinh "PortalV2:SchemaBuilder". Mac dinh tat.</summary>
public sealed class PortalV2SchemaOptions
{
    public const string SectionName = "PortalV2:SchemaBuilder";
    public bool Enabled { get; set; }
    /// <summary>Duong dan seed-portal-v2.json, tinh tu content root. Trong thi bo qua buoc nap Thu vien.</summary>
    public string? SeedPath { get; set; }
}

/// <summary>
/// Dung schema nen Portal v2 bang dich vu Umbraco, de uSync tu xuat file .config (khong viet tay uSync).
/// Chi chay o Development khi bat PortalV2:SchemaBuilder:Enabled. Tao theo khoa co dinh, chay lai khong tao trung,
/// khong sua muc da co, tru: them truong canonicalUrl vao seoBase; dua muc danh sach co dinh ve dung DanhMucCoDinh,
/// doi chu cu da luu, xoa data type cua danh sach da bo (V2-01r).
/// </summary>
public sealed class PortalV2SchemaBuilder(
    IDataTypeService dataTypes,
    IContentTypeService contentTypes,
    IContentService contents,
    PropertyEditorCollection editors,
    IConfigurationEditorJsonSerializer configSerializer,
    IShortStringHelper shortStrings,
    IHostEnvironment environment,
    IOptions<PortalV2SchemaOptions> options,
    ILogger<PortalV2SchemaBuilder> logger)
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    private static readonly Guid User = Constants.Security.SuperUserKey;

    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        if (!options.Value.Enabled) return;
        if (!environment.IsDevelopment())
        {
            logger.LogWarning("Bỏ qua PortalV2SchemaBuilder: chỉ chạy ở môi trường Development.");
            return;
        }

        int createdTypes = 0, createdContentTypes = 0;
        foreach (DataTypeSpec spec in PortalV2Schema.AllDataTypes())
            if (await EnsureDataType(spec)) createdTypes++;

        await EnsureSeoBase();
        foreach (ContentTypeSpec spec in PortalV2Schema.AllContentTypes())
            if (await EnsureContentType(spec)) createdContentTypes++;

        int synced = await SyncFixedLists();
        int retired = await RetireDataTypes();
        int seeded = SeedLibrary();
        logger.LogInformation("PortalV2SchemaBuilder: tạo {DataTypes} data type, {ContentTypes} loại nội dung, {Nodes} nút Thư viện; đồng bộ {Synced} danh sách cố định, xóa {Retired} data type đã bỏ.",
            createdTypes, createdContentTypes, seeded, synced, retired);
    }

    // Danh sach co dinh da tao truoc do: dua muc ve dung DanhMucCoDinh va doi chu cu da luu trong noi dung (QD-051).
    private async Task<int> SyncFixedLists()
    {
        int synced = 0;
        foreach (DanhSachCoDinh list in DanhMucCoDinh.All)
        {
            IDataType? dataType = await dataTypes.GetAsync(PortalV2Keys.DataType(list.DataTypeName));
            if (dataType is null) continue;
            string[] labels = list.Items.Select(x => x.Label).ToArray();
            string current = dataType.ConfigurationData.TryGetValue("items", out object? items) ? JsonSerializer.Serialize(items) : "";
            if (current == JsonSerializer.Serialize(labels)) continue;
            dataType.ConfigurationData = new Dictionary<string, object>(dataType.ConfigurationData) { ["items"] = labels };
            var result = await dataTypes.UpdateAsync(dataType, User);
            if (!result.Success) throw new InvalidOperationException($"Không cập nhật được {list.DataTypeName}: {result.Status}.");
            synced++;
        }

        foreach (var (list, oldLabel, code) in DanhMucCoDinh.Renamed)
        {
            Guid key = PortalV2Keys.DataType(list.DataTypeName);
            string newValue = JsonSerializer.Serialize(new[] { list.Label(code) });
            foreach (IContentType type in contentTypes.GetAll())
            {
                string[] aliases = type.CompositionPropertyTypes.Where(p => p.DataTypeKey == key).Select(p => p.Alias).ToArray();
                if (aliases.Length == 0) continue;
                foreach (IContent content in contents.GetPagedOfType(type.Id, 0, int.MaxValue, out _, null))
                {
                    bool changed = false;
                    foreach (string alias in aliases)
                        if (IsSingleLabel(content.GetValue<string>(alias), oldLabel)) { content.SetValue(alias, newValue); changed = true; }
                    if (!changed) continue;
                    bool wasPublished = content.Published && !content.Edited;
                    contents.Save(content);
                    if (wasPublished) contents.Publish(content, ["*"]);
                    logger.LogInformation("Đổi \"{Old}\" thành \"{New}\" ở {Name}.", oldLabel, list.Label(code), content.Name);
                }
            }
        }
        return synced;
    }

    // Dropdown luu mang JSON chu hien thi; uSync co the ghi lai co xuong dong nen so sau khi doc JSON
    internal static bool IsSingleLabel(string? stored, string label)
    {
        if (string.IsNullOrWhiteSpace(stored)) return false;
        try { return JsonSerializer.Deserialize<string[]>(stored) is [var only] && only == label; }
        catch (JsonException) { return false; }
    }

    private async Task<int> RetireDataTypes()
    {
        int retired = 0;
        foreach (string name in DanhMucCoDinh.Retired)
        {
            Guid key = PortalV2Keys.DataType(name);
            if (await dataTypes.GetAsync(key) is null) continue;
            if (contentTypes.GetAll().Any(t => t.PropertyTypes.Any(p => p.DataTypeKey == key)))
            {
                logger.LogWarning("Không xóa {Name}: còn thuộc tính dùng.", name);
                continue;
            }
            var result = await dataTypes.DeleteAsync(key, User);
            if (!result.Success) throw new InvalidOperationException($"Không xóa được {name}: {result.Status}.");
            retired++;
        }
        return retired;
    }

    private async Task<bool> EnsureDataType(DataTypeSpec spec)
    {
        Guid key = PortalV2Keys.DataType(spec.Name);
        if (await dataTypes.GetAsync(key) is not null) return false;
        if (!editors.TryGet(spec.EditorAlias, out IDataEditor? editor))
            throw new InvalidOperationException($"Không có property editor {spec.EditorAlias} cho data type {spec.Name}.");
        var dataType = new DataType(editor, configSerializer)
        {
            Key = key,
            Name = spec.Name,
            EditorUiAlias = spec.EditorUiAlias,
            DatabaseType = ValueTypes.ToStorageType(editor.GetValueEditor().ValueType),
            ConfigurationData = spec.Config,
        };
        var result = await dataTypes.CreateAsync(dataType, User);
        if (!result.Success) throw new InvalidOperationException($"Không tạo được data type {spec.Name}: {result.Status}.");
        return true;
    }

    // Bon truong goc cua seoBase. File uSync cu gan chung vao nhom "antcSeo" khong ton tai nen Umbraco chua bao gio nhap;
    // giu nguyen khoa, alias, data type de du lieu va view cu dung duoc (V2-01d: sua alias tab, them canonicalUrl).
    private static readonly (Guid Key, string Alias, string Name, Guid DataType, string Description)[] SeoLegacy =
    [
        (Guid.Parse("d081bdaa-0359-5bcb-9062-11bde76e9a93"), "seoTitle", "Tiêu đề SEO", Guid.Parse("0cc0eba1-9960-42c9-bf9b-60e150b429ae"), "Tiêu đề thẻ title; trống thì dùng tên nút."),
        (Guid.Parse("38337ec2-f41e-596e-9872-57c6860cb8d3"), "seoDescription", "Mô tả SEO", Guid.Parse("c6bac0dd-4ab9-45b1-8e30-e4b619ee5da3"), "Mô tả; trống thì dùng tóm tắt."),
        (Guid.Parse("b1f7b071-dca1-54c7-ac26-7bde6173e992"), "ogImage", "Ảnh khi chia sẻ", Guid.Parse("ad9f0cf2-bda2-45d5-9ea1-a63cfc873fd3"), "Ảnh khi chia sẻ; trống thì dùng ảnh giới thiệu đầu trang 1."),
        (Guid.Parse("14a0304a-1448-5718-8b94-90d28842a1dc"), "hideFromSearch", "Ẩn khỏi sơ đồ trang và tìm kiếm", Guid.Parse("92897bc6-a5f3-4ffe-ae27-f2e7e33dda49"), "Ẩn khỏi sơ đồ trang và tìm kiếm trong trang web."),
    ];

    private async Task EnsureSeoBase()
    {
        IContentType? seo = contentTypes.Get("seoBase");
        if (seo is null) return;
        bool changed = false;
        PropertyGroup? tab = seo.PropertyGroups.FirstOrDefault(g => g.Type == PropertyGroupType.Tab && g.Alias is "sEO" or "seo");
        if (tab is null)
        {
            tab = new PropertyGroup(new PropertyTypeCollection(true)) { Alias = "seo", Name = "SEO", Type = PropertyGroupType.Tab, SortOrder = 90 };
            seo.PropertyGroups.Add(tab);
            changed = true;
        }
        else if (tab.Alias != "seo")
        {
            tab.Alias = "seo";
            changed = true;
        }

        int sort = 1;
        foreach (var p in SeoLegacy)
        {
            if (seo.PropertyTypeExists(p.Alias)) { sort++; continue; }
            IDataType dataType = await dataTypes.GetAsync(p.DataType) ?? throw new InvalidOperationException($"Thiếu data type {p.DataType} cho seoBase.{p.Alias}.");
            seo.AddPropertyType(new PropertyType(shortStrings, dataType, p.Alias)
            {
                Key = p.Key, Name = p.Name, Description = p.Description, SortOrder = sort++, Variations = ContentVariation.Nothing,
            }, "seo");
            changed = true;
        }
        PropertySpec canonical = PortalV2Schema.SeoCanonical;
        if (!seo.PropertyTypeExists(canonical.Alias))
        {
            IPropertyType property = await Property("seoBase", canonical);
            property.SortOrder = sort;
            seo.AddPropertyType(property, "seo");
            changed = true;
        }
        if (!changed) return;
        var result = await contentTypes.UpdateAsync(seo, User);
        if (!result.Success) throw new InvalidOperationException($"Không cập nhật được seoBase: {result.Result}.");
    }

    private async Task<bool> EnsureContentType(ContentTypeSpec spec)
    {
        Guid key = PortalV2Keys.ContentType(spec.Alias);
        if (RiskStructure.GroupAliases.Contains(spec.Alias) && contentTypes.Get(spec.Alias) is null)
            throw new InvalidOperationException($"Cần nhập schema gốc của AnVu29 cho {spec.Alias}; không tạo loại nhóm rủi ro thay thế.");
        if (RiskSchema.ContentTypes().Any(x => x.Alias == spec.Alias) && contentTypes.Get(spec.Alias) is { } existing)
        {
            bool changed = false;
            // AnVu29's original types may have no local tab. Add a real tab before adding fields,
            // otherwise AddPropertyType creates a Group that conflicts with illustrationBase's noiDung Tab.
            // Management API updates regenerate a container alias from its Vietnamese name.
            // Its stable key still identifies the existing tab after that round trip.
            var tabKey = PortalV2Keys.For($"tab:{spec.Alias}.{spec.TabAlias}");
            var localTab = existing.PropertyGroups.FirstOrDefault(g => g.Alias == spec.TabAlias || g.Key == tabKey);
            if (localTab is null)
            {
                existing.PropertyGroups.Add(new PropertyGroup(new PropertyTypeCollection(true)) {
                    Alias = spec.TabAlias, Name = spec.TabName, Type = PropertyGroupType.Tab,
                    Key = PortalV2Keys.For($"tab:{spec.Alias}.{spec.TabAlias}"), SortOrder = 0 });
                changed = true;
            }
            else if (localTab.Type != PropertyGroupType.Tab) { localTab.Type = PropertyGroupType.Tab; changed = true; }
            if (localTab is not null && localTab.Alias != spec.TabAlias) { localTab.Alias = spec.TabAlias; changed = true; }
            foreach (string alias in spec.Compositions ?? [])
                if (!existing.ContentTypeCompositionExists(alias))
                {
                    existing.AddContentType(contentTypes.Get(alias) ?? throw new InvalidOperationException($"Thiếu composition {alias}."));
                    changed = true;
                }
            foreach (PropertySpec p in spec.Properties)
                if (!existing.PropertyTypeExists(p.Alias))
                {
                    var property = await Property(spec.Alias, p);
                    property.SortOrder = existing.PropertyTypes.Count() + 10;
                    existing.AddPropertyType(property, spec.TabAlias, spec.TabName);
                    changed = true;
                }
            var allowed = (spec.AllowedChildren ?? []).Select(a => contentTypes.Get(a)).OfType<IContentType>().ToArray();
            if (RiskSchema.PageAliases.Contains(spec.Alias) && !allowed.Select(x => x.Key).ToHashSet().SetEquals((existing.AllowedContentTypes ?? []).Select(x => x.Key)))
            {
                existing.AllowedContentTypes = allowed.Select((t, i) => new ContentTypeSort(t.Key, i, t.Alias)).ToArray();
                changed = true;
            }
            else if (allowed.Length > 0 && !allowed.All(t => (existing.AllowedContentTypes ?? []).Any(x => x.Key == t.Key)))
            {
                existing.AllowedContentTypes = existing.AllowedContentTypes.Concat(allowed.Where(t => !existing.AllowedContentTypes.Any(x => x.Key == t.Key))
                    .Select((t, i) => new ContentTypeSort(t.Key, i, t.Alias))).ToArray();
                changed = true;
            }
            if (spec.ListViewDataType is { } list && existing.ListView != PortalV2Keys.DataType(list))
            { existing.ListView = PortalV2Keys.DataType(list); changed = true; }
            if (changed)
            {
                var updated = await contentTypes.UpdateAsync(existing, User);
                if (!updated.Success) throw new InvalidOperationException($"Không cập nhật được {spec.Alias}: {updated.Result}.");
            }
            return changed;
        }
        if (contentTypes.Get(key) is not null) return false;
        if (contentTypes.Get(spec.Alias) is not null)
            throw new InvalidOperationException($"Đã có loại {spec.Alias} với khóa khác; dừng để không tạo trùng.");

        var type = new ContentType(shortStrings, -1)
        {
            Key = key,
            Alias = spec.Alias,
            Name = spec.Name,
            Icon = spec.Icon,
            Description = spec.Description,
            AllowedAsRoot = spec.AllowedAsRoot,
            IsElement = false,
            Variations = ContentVariation.Nothing,
        };
        foreach (string alias in spec.Compositions ?? [])
            type.AddContentType(contentTypes.Get(alias) ?? throw new InvalidOperationException($"Thiếu composition {alias}."));

        var tab = new PropertyGroup(new PropertyTypeCollection(true))
        {
            Alias = spec.TabAlias, Name = spec.TabName, Type = PropertyGroupType.Tab, SortOrder = 0,
            Key = PortalV2Keys.For($"tab:{spec.Alias}.{spec.TabAlias}"),
        };
        type.PropertyGroups.Add(tab);
        int sort = 10;
        foreach (PropertySpec p in spec.Properties)
        {
            IPropertyType property = await Property(spec.Alias, p);
            property.SortOrder = sort++;
            type.AddPropertyType(property, spec.TabAlias);
        }

        if (spec.AllowedChildren is { Count: > 0 } children)
            type.AllowedContentTypes = children.Select((alias, i) => new ContentTypeSort(contentTypes.Get(alias)?.Key ?? PortalV2Keys.ContentType(alias), i, alias)).ToArray();
        if (spec.ListViewDataType is { } listView)
            type.ListView = PortalV2Keys.DataType(listView);

        var result = await contentTypes.CreateAsync(type, User);
        if (!result.Success) throw new InvalidOperationException($"Không tạo được loại {spec.Alias}: {result.Result}.");
        return true;
    }

    public async Task EnsureRiskSchemaAsync()
    {
        foreach (var spec in PortalV2Schema.AllDataTypes().Concat(RiskSchema.DataTypes())) await EnsureDataType(spec);
        await EnsureSeoBase();
        foreach (var spec in PortalV2Schema.Compositions()) await EnsureContentType(spec);
        // Child keys must use the existing key when an earlier Portal schema has already created that alias.
        foreach (var spec in RiskSchema.ContentTypes().OrderBy(x => x.AllowedChildren?.Count ?? 0)) await EnsureContentType(spec);
        foreach (var spec in RiskSchema.ContentTypes()) await EnsureContentType(spec);
        foreach (string name in new[] { "Chọn · Nhóm rủi ro", "Chọn · Nhóm rủi ro · nhiều" })
        {
            var picker = (await dataTypes.GetAsync(PortalV2Keys.DataType(name)))!;
            string filter = string.Join(",", RiskStructure.GroupAliases.Select(a => contentTypes.Get(a)!.Key));
            if (picker.ConfigurationData["filter"].ToString() == filter) continue;
            picker.ConfigurationData = new Dictionary<string, object>(picker.ConfigurationData) { ["filter"] = filter };
            await dataTypes.UpdateAsync(picker, User);
        }
        await AddProperties("topicItem", [
            new("readingArticle", "Bài đọc chuyên đề", "Chọn · Bài viết", "Cần khi đăng."),
            new("checklist", "Danh sách kiểm tra", "Chọn · Danh sách kiểm tra"),
            new("rememberLine", "Nhớ một câu", PortalV2Schema.Text(140)),
            new("mustAsk", "Câu hỏi phải hỏi", PortalV2Schema.Area(200)),
            new("stopWhen", "Khi nào phải dừng", PortalV2Schema.Area(300)),
            new("holdWhen", "Khi nào cần hoãn để kiểm chứng", PortalV2Schema.Area(300))]);
        await AddProperties("siteSettings", [new("noAnswerNote", "Câu “Không thấy câu trả lời?”", PortalV2Schema.Area(200), "Dùng chung cho cả 6 tab của Các rủi ro.")]);
        await AddProperties("sharedSnippet", [new("title", "Tiêu đề hộp", PortalV2Schema.Text(120), Mandatory: true),
            new("bodyText", "Nội dung", PortalV2Schema.RteShort, Mandatory: true)]);
        await AddProperties("tacticItem", [new("containingArticle", "Bài viết chứa thủ đoạn", "Chọn · Bài viết", "Cần khi đăng. Chuyên đề lấy theo bài hướng dẫn.")]);
        if (contentTypes.Get("tacticItem") is { } tactic)
        {
            var legacyTopic = tactic.PropertyTypes.FirstOrDefault(x => x.Alias == "topic");
            if (legacyTopic?.Mandatory == true) { legacyTopic.Mandatory = false; await contentTypes.UpdateAsync(tactic, User); }
        }
    }

    private async Task AddProperties(string alias, PropertySpec[] properties)
    {
        if (contentTypes.Get(alias) is not { } type) return;
        bool changed = false;
        foreach (var p in properties)
            if (!type.PropertyTypeExists(p.Alias)) { type.AddPropertyType(await Property(alias, p), "noiDung", "Nội dung"); changed = true; }
        if (changed)
        {
            var updated = await contentTypes.UpdateAsync(type, User);
            if (!updated.Success) throw new InvalidOperationException($"Không bổ sung được trường cho {alias}.");
        }
    }

    private async Task<IPropertyType> Property(string contentTypeAlias, PropertySpec p)
    {
        IDataType dataType = await dataTypes.GetAsync(PortalV2Keys.DataType(p.DataTypeName))
            ?? throw new InvalidOperationException($"Thiếu data type {p.DataTypeName} cho {contentTypeAlias}.{p.Alias}.");
        return new PropertyType(shortStrings, dataType, p.Alias)
        {
            Key = PortalV2Keys.Property(contentTypeAlias, p.Alias),
            Name = p.Name,
            Description = p.Description,
            Mandatory = p.Mandatory,
            MandatoryMessage = p.MandatoryMessage,
            ValidationRegExp = p.Regex,
            ValidationRegExpMessage = p.RegexMessage,
            Variations = ContentVariation.Nothing,
        };
    }

    // ---------- Nap Thu vien tu seed (phan danh muc cua V2-01g)
    private static readonly HashSet<string> LibraryTypes =
        ["libraryFolder", .. PortalV2Schema.Folders.Select(f => f.Alias), .. PortalV2Schema.LibraryItems().Select(t => t.Alias)];

    private int SeedLibrary()
    {
        if (string.IsNullOrWhiteSpace(options.Value.SeedPath)) return 0;
        string path = Path.GetFullPath(Path.Combine(environment.ContentRootPath, options.Value.SeedPath));
        if (!System.IO.File.Exists(path))
        {
            logger.LogWarning("Không thấy seed {Path}; bỏ qua bước nạp Thư viện.", path);
            return 0;
        }
        using JsonDocument seed = JsonDocument.Parse(System.IO.File.ReadAllText(path));
        int created = 0;
        foreach (JsonElement node in seed.RootElement.GetProperty("nodes").EnumerateArray())
        {
            string type = node.GetProperty("contentType").GetString()!;
            if (!LibraryTypes.Contains(type)) continue;
            Guid key = node.GetProperty("key").GetGuid();
            if (contents.GetById(key) is not null) continue;

            int parentId = -1;
            if (node.GetProperty("parentKey").ValueKind == JsonValueKind.String)
                parentId = contents.GetById(node.GetProperty("parentKey").GetGuid())?.Id
                    ?? throw new InvalidOperationException($"Thiếu nút cha của {node.GetProperty("name").GetString()}.");
            IContent content = contents.Create(node.GetProperty("name").GetString()!, parentId, type);
            content.Key = key;
            content.SortOrder = node.GetProperty("sortOrder").GetInt32();
            foreach (JsonProperty value in node.GetProperty("values").EnumerateObject())
            {
                IProperty? property = content.Properties.FirstOrDefault(x => x.Alias == value.Name);
                if (property is null) continue; // truong cua task sau (vi du containingArticle), chua co tren loai
                content.SetValue(value.Name, ToStored(property.PropertyType, value.Value));
            }
            var saved = contents.Save(content);
            if (!saved.Success) throw new InvalidOperationException($"Không lưu được {content.Name}.");
            if (node.GetProperty("state").GetString() == "published")
            {
                var published = contents.Publish(content, ["*"]);
                if (!published.Success) logger.LogWarning("Chưa xuất bản được {Name}: {Result}.", content.Name, published.Result);
            }
            created++;
        }
        return created;
    }

    /// <summary>Doi gia tri seed sang dang luu cua Umbraco theo contract C7.</summary>
    internal static object? ToStored(IPropertyType propertyType, JsonElement v)
    {
        switch (propertyType.PropertyEditorAlias)
        {
            case Constants.PropertyEditors.Aliases.Boolean:
                return v.ValueKind == JsonValueKind.True;
            case Constants.PropertyEditors.Aliases.Integer:
                return v.ValueKind == JsonValueKind.Number ? v.GetInt32() : int.Parse(v.GetString()!);
            case Constants.PropertyEditors.Aliases.DropDownListFlexible:
            {
                // Tim danh sach theo dung data type cua thuoc tinh, khong do tren moi danh sach (ma co the trung giua hai danh sach).
                string code = v.GetString()!;
                DanhSachCoDinh list = DanhMucCoDinh.All.FirstOrDefault(l => PortalV2Keys.DataType(l.DataTypeName) == propertyType.DataTypeKey)
                    ?? throw new InvalidOperationException($"Thuộc tính {propertyType.Alias} không dùng data type Danh mục · … đã biết.");
                string label = list.Label(code) ?? throw new InvalidOperationException($"Mã \"{code}\" không có trong {list.DataTypeName}.");
                return JsonSerializer.Serialize(new[] { label });
            }
            case Constants.PropertyEditors.Aliases.MultiNodeTreePicker:
            {
                IEnumerable<string> keys = v.ValueKind == JsonValueKind.Array ? v.EnumerateArray().Select(x => x.GetString()!) : [v.GetString()!];
                return string.Join(",", keys.Select(k => Udi.Create(Constants.UdiEntityType.Document, Guid.Parse(k)).ToString()));
            }
            case Constants.PropertyEditors.Aliases.Tags:
                return JsonSerializer.Serialize(v.EnumerateArray().Select(x => x.GetString()).ToArray());
            case Constants.PropertyEditors.Aliases.MultipleTextstring:
                return string.Join("\n", v.EnumerateArray().Select(x => x.GetString()));
            default:
                return v.ValueKind == JsonValueKind.String ? v.GetString() : v.GetRawText();
        }
    }
}
