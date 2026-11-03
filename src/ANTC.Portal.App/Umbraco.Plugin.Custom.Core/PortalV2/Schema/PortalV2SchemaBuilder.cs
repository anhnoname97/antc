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
/// khong sua muc da co (tru them truong canonicalUrl vao seoBase).
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

        int seeded = SeedLibrary();
        logger.LogInformation("PortalV2SchemaBuilder: tạo {DataTypes} data type, {ContentTypes} loại nội dung, {Nodes} nút Thư viện.",
            createdTypes, createdContentTypes, seeded);
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
            type.AllowedContentTypes = children.Select((alias, i) => new ContentTypeSort(PortalV2Keys.ContentType(alias), i, alias)).ToArray();
        if (spec.ListViewDataType is { } listView)
            type.ListView = PortalV2Keys.DataType(listView);

        var result = await contentTypes.CreateAsync(type, User);
        if (!result.Success) throw new InvalidOperationException($"Không tạo được loại {spec.Alias}: {result.Result}.");
        return true;
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
