using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Editors;
using Umbraco.Cms.Core.Models.Validation;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Strings;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Editors;

/// <summary>
/// Schema Antc.InlineList: danh sach dong nhieu o, nhap ngay tren form (QD-042, contract C5).
/// Gia tri luu la chuoi JSON. Giao dien Bang/The thuoc luong V2-ui; truoc khi co, data type dung o nhap JSON tho.
/// </summary>
[DataEditor(EditorAlias, ValueType = ValueTypes.Json, ValueEditorIsReusable = true)]
public sealed class InlineListDataEditor(IDataValueEditorFactory dataValueEditorFactory, IIOHelper ioHelper)
    : DataEditor(dataValueEditorFactory)
{
    public const string EditorAlias = "Antc.InlineList";

    protected override IDataValueEditor CreateValueEditor() => DataValueEditorFactory.Create<InlineListValueEditor>(Attribute!);

    protected override IConfigurationEditor CreateConfigurationEditor() => new InlineListConfigurationEditor(ioHelper);
}

/// <summary>Chuyen gia tri giua form va CSDL, kiem theo cau hinh, bao tham chieu cho Umbraco.</summary>
public sealed class InlineListValueEditor : DataValueEditor, IDataValueReference
{
    private readonly IJsonSerializer _json;

    public InlineListValueEditor(IShortStringHelper shortStringHelper, IJsonSerializer jsonSerializer, IIOHelper ioHelper, DataEditorAttribute attribute)
        : base(shortStringHelper, jsonSerializer, ioHelper, attribute)
    {
        _json = jsonSerializer;
        Validators.Add(new InlineListValueValidator());
    }

    public override object? FromEditor(ContentPropertyData editorValue, object? currentValue)
    {
        JsonNode? node = InlineListJson.Parse(editorValue.Value, _json);
        return node is JsonArray { Count: > 0 } ? node.ToJsonString() : null;
    }

    // Tra ve chuoi JSON: giao dien tam (o nhap JSON) va giao dien Bang/The sau nay deu tu doc chuoi.
    public override object ToEditor(IProperty property, string? culture = null, string? segment = null)
        => property.GetValue(culture, segment) as string ?? string.Empty;

    public IEnumerable<UmbracoEntityReference> GetReferences(object? value)
        => InlineListJson.DocumentUdis(InlineListJson.Parse(value, _json)).Select(udi => new UmbracoEntityReference(udi));
}

internal sealed class InlineListValueValidator : IValueValidator
{
    public IEnumerable<ValidationResult> Validate(object? value, string? valueType, object? dataTypeConfiguration, PropertyValidationContext validationContext)
    {
        if (dataTypeConfiguration is not InlineListConfiguration config) return [];
        JsonNode? node;
        try { node = InlineListJson.Parse(value, null); }
        catch (System.Text.Json.JsonException) { return [new ValidationResult("Giá trị không phải JSON hợp lệ.", ["value"])]; }
        return InlineListRules.Validate(node, config).Select(e => new ValidationResult(e.Message, [e.Path.Length == 0 ? "value" : e.Path]));
    }
}

/// <summary>Doc gia tri InlineList tu cac dang Umbraco co the dua vao (chuoi, JsonNode, doi tuong).</summary>
public static class InlineListJson
{
    public static JsonNode? Parse(object? value, IJsonSerializer? json) => value switch
    {
        null => null,
        JsonNode n => n,
        string s when string.IsNullOrWhiteSpace(s) => null,
        string s => JsonNode.Parse(s),
        _ when json is not null => JsonNode.Parse(json.Serialize(value)),
        _ => JsonNode.Parse(value.ToString() ?? "null"),
    };

    /// <summary>Moi chuoi UDI tai lieu trong gia tri, ke ca trong bang long.</summary>
    public static IEnumerable<GuidUdi> DocumentUdis(JsonNode? node)
    {
        switch (node)
        {
            case JsonArray a:
                foreach (var x in a.SelectMany(DocumentUdis)) yield return x;
                break;
            case JsonObject o:
                foreach (var x in o.Select(kv => kv.Value).SelectMany(DocumentUdis)) yield return x;
                break;
            case JsonValue v when v.TryGetValue(out string? s) && InlineListRules.IsDocumentUdi(s)
                                  && UdiParser.TryParse(s, out GuidUdi? udi):
                yield return udi!;
                break;
        }
    }
}
