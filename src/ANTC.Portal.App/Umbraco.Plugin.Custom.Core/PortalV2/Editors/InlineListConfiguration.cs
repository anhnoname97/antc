using System.Text.Json.Serialization;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Editors;

/// <summary>Cau hinh data type Antc.InlineList (contract C5 trong 4-contract-du-lieu.md).</summary>
public sealed class InlineListConfiguration
{
    [ConfigurationField("layout")] [JsonPropertyName("layout")]
    public string Layout { get; set; } = "table";

    [ConfigurationField("minRows")] [JsonPropertyName("minRows")]
    public int MinRows { get; set; }

    [ConfigurationField("maxRows")] [JsonPropertyName("maxRows")]
    public int MaxRows { get; set; }

    [ConfigurationField("sortable")] [JsonPropertyName("sortable")]
    public bool Sortable { get; set; } = true;

    [ConfigurationField("summaryField")] [JsonPropertyName("summaryField")]
    public string? SummaryField { get; set; }

    [ConfigurationField("unitLabel")] [JsonPropertyName("unitLabel")]
    public string? UnitLabel { get; set; }

    [ConfigurationField("fields")] [JsonPropertyName("fields")]
    public List<InlineListField> Fields { get; set; } = [];

    [ConfigurationField("optionalSection")] [JsonPropertyName("optionalSection")]
    public InlineListOptionalSection? OptionalSection { get; set; }
}

/// <summary>Mot o trong dong. Kieu: text, area, number, date, toggle, fixed, content, lines, table.</summary>
public sealed class InlineListField
{
    [JsonPropertyName("alias")] public string Alias { get; set; } = string.Empty;
    [JsonPropertyName("label")] public string Label { get; set; } = string.Empty;
    [JsonPropertyName("type")] public string Type { get; set; } = "text";
    [JsonPropertyName("required")] public bool Required { get; set; }
    [JsonPropertyName("maxChars")] public int? MaxChars { get; set; }
    [JsonPropertyName("min")] public decimal? Min { get; set; }
    [JsonPropertyName("max")] public decimal? Max { get; set; }
    [JsonPropertyName("pattern")] public string? Pattern { get; set; }
    [JsonPropertyName("patternMessage")] public string? PatternMessage { get; set; }
    [JsonPropertyName("placement")] public string? Placement { get; set; }
    [JsonPropertyName("width")] public string? Width { get; set; }
    [JsonPropertyName("description")] public string? Description { get; set; }
    [JsonPropertyName("list")] public string? List { get; set; }
    [JsonPropertyName("multiple")] public bool Multiple { get; set; }
    [JsonPropertyName("allowedContentTypes")] public List<string>? AllowedContentTypes { get; set; }
    [JsonPropertyName("startNode")] public Guid? StartNode { get; set; }
    [JsonPropertyName("fields")] public List<InlineListField>? Fields { get; set; }
    [JsonPropertyName("minRows")] public int MinRows { get; set; }
    [JsonPropertyName("maxRows")] public int MaxRows { get; set; }
    [JsonPropertyName("showWhen")] public InlineListCondition? ShowWhen { get; set; }
}

/// <summary>O chi hien khi o khac trong cung dong bang gia tri cho truoc.</summary>
public sealed class InlineListCondition
{
    [JsonPropertyName("field")] public string Field { get; set; } = string.Empty;
    [JsonPropertyName("equals")] public string? EqualsValue { get; set; }
}

/// <summary>Phan bat tat trong the, vi du "Hoi them".</summary>
public sealed class InlineListOptionalSection
{
    [JsonPropertyName("toggleAlias")] public string ToggleAlias { get; set; } = string.Empty;
    [JsonPropertyName("label")] public string Label { get; set; } = string.Empty;
    [JsonPropertyName("addLabel")] public string? AddLabel { get; set; }
    [JsonPropertyName("fields")] public List<InlineListField> Fields { get; set; } = [];
}

public sealed class InlineListConfigurationEditor(IIOHelper ioHelper)
    : ConfigurationEditor<InlineListConfiguration>(ioHelper);
