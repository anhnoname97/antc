using System.Text.Json;
using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Models;

public static class EmergencyContent
{
    public static JsonElement[] Rows(IPublishedElement content, string alias)
    {
        var raw = content.GetProperty(alias)?.GetSourceValue();
        return Rows(raw is string text ? text : JsonSerializer.Serialize(raw));
    }
    public static JsonElement[] Rows(string? value)
    {
        try { return JsonSerializer.Deserialize<JsonElement[]>(value ?? "[]") ?? []; }
        catch (JsonException) { return []; }
    }
    public static JsonElement[] Rows(JsonElement row, string alias) =>
        row.ValueKind == JsonValueKind.Object && row.TryGetProperty(alias, out var value) && value.ValueKind == JsonValueKind.Array
            ? value.EnumerateArray().ToArray() : [];
    public static string Text(JsonElement row, string alias) =>
        row.ValueKind == JsonValueKind.Object && row.TryGetProperty(alias, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? "" : "";
    public static Guid? DocumentKey(string? value) =>
        value?.StartsWith("umb://document/", StringComparison.Ordinal) == true && Guid.TryParse(value[15..], out var key) ? key : null;
    public static string? PublicUrl(IPublishedContent? content)
    {
        if (content?.TemplateId is not > 0) return null;
        var url = content.Url();
        return url.StartsWith('/') && !url.StartsWith("//") && !url.Contains('\\') && !url.Any(char.IsControl) ? url : null;
    }
    public static bool HasScreening(IPublishedContent content) => Rows(content, "screeningQuestions")
        .Any(row => Text(row, "question").Length > 0 && DocumentKey(Text(row, "targetPage")) is not null);
    public static bool IsPhoneNumber(string value) => Regex.IsMatch(value, "\\A[0-9]{3,6}\\z");
}
