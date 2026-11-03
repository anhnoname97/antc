using System.Globalization;
using System.Text.Json.Nodes;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Editors;

/// <summary>Gia tri InlineList da doc, dung trong view. Mot dong la mot InlineListRow.</summary>
public sealed class InlineListValue : List<InlineListRow>
{
    public static InlineListValue Empty => [];

    public static InlineListValue From(JsonNode? node)
    {
        var value = new InlineListValue();
        if (node is JsonArray rows)
            value.AddRange(rows.OfType<JsonObject>().Select(r => new InlineListRow(r)));
        return value;
    }
}

/// <summary>Mot dong InlineList. Doc o theo alias; o rong tra ve null hoac danh sach rong.</summary>
public sealed class InlineListRow(JsonObject data)
{
    public JsonObject Data { get; } = data;

    public Guid Key => Guid.TryParse(GetString("key"), out Guid k) ? k : Guid.Empty;

    public string? GetString(string alias) => Data[alias] is JsonValue v && v.TryGetValue(out string? s) ? s : null;

    /// <summary>Ma cua o kieu fixed, vi du "goi", "ratCao".</summary>
    public string? GetCode(string alias) => GetString(alias);

    public bool GetBool(string alias) => Data[alias] is JsonValue v && v.TryGetValue(out bool b) && b;

    public decimal? GetNumber(string alias) => Data[alias] is JsonValue v && v.TryGetValue(out decimal d) ? d : null;

    public DateOnly? GetDate(string alias)
        => DateOnly.TryParseExact(GetString(alias), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateOnly d) ? d : null;

    public IReadOnlyList<string> GetLines(string alias)
        => Data[alias] is JsonArray a ? a.Select(x => x is JsonValue v && v.TryGetValue(out string? s) ? s : null)
            .Where(s => !string.IsNullOrWhiteSpace(s)).Cast<string>().ToArray() : [];

    /// <summary>Khoa tai lieu cua o content chon mot. Dung UmbracoHelper.Content(key) de lay trang.</summary>
    public Guid? GetKey(string alias) => ToKey(GetString(alias));

    public IReadOnlyList<Guid> GetKeys(string alias)
        => Data[alias] is JsonArray a ? a.Select(x => ToKey(x is JsonValue v && v.TryGetValue(out string? s) ? s : null))
            .Where(k => k.HasValue).Select(k => k!.Value).ToArray() : GetKey(alias) is { } one ? [one] : [];

    /// <summary>Bang long (o kieu table).</summary>
    public InlineListValue GetRows(string alias) => InlineListValue.From(Data[alias]);

    private static Guid? ToKey(string? udi)
        => InlineListRules.IsDocumentUdi(udi) ? Guid.ParseExact(udi![InlineListRules.DocumentUdiPrefix.Length..], "N") : null;
}

/// <summary>Chuyen chuoi JSON trong CSDL thanh InlineListValue cho view.</summary>
public sealed class InlineListValueConverter : PropertyValueConverterBase
{
    public override bool IsConverter(IPublishedPropertyType propertyType) => propertyType.EditorAlias == InlineListDataEditor.EditorAlias;

    public override Type GetPropertyValueType(IPublishedPropertyType propertyType) => typeof(InlineListValue);

    public override PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Element;

    public override object? ConvertSourceToIntermediate(IPublishedElement owner, IPublishedPropertyType propertyType, object? source, bool preview)
    {
        try { return InlineListValue.From(InlineListJson.Parse(source, null)); }
        catch (System.Text.Json.JsonException) { return InlineListValue.Empty; }
    }

    public override object? ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType,
        PropertyCacheLevel referenceCacheLevel, object? inter, bool preview) => inter ?? InlineListValue.Empty;
}
