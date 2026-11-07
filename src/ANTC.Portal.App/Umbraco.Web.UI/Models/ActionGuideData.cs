using System.Text.Json;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Models;

public sealed record ActionGuideLink(string Label, string Url);
public sealed record ActionGuideStep(Guid Key, int Number, string MainText, string[] Details, string SampleScript,
    bool ShowBankLookup, Guid? OnlyIf, Guid? SnippetAfter, bool HasFollowUp, string FollowUpQuestion,
    string FollowUpButton, string FollowUpNote, Guid? FollowUpPage, string NoticeTitle, ActionGuideLink[] Links);

/// <summary>Shared interpretation of source steps, used by guidance and all three self-check tools.</summary>
public static class ActionGuideData
{
    public static string? Slug(IPublishedContent page) => page.Value<string>("umbracoUrlName") is { Length: > 0 } slug ? slug : page.Value<string>("slug");
    public static ActionGuideStep[] Steps(IPublishedContent? page)
    {
        var raw = page?.GetProperty("steps")?.GetSourceValue();
        return ParseSteps(raw is string text ? text : JsonSerializer.Serialize(raw));
    }
    public static ActionGuideStep? Step(IPublishedContent? page, int number) => Steps(page).ElementAtOrDefault(number - 1);
    public static ActionGuideStep[] ParseSteps(string? json)
    {
        try
        {
            using var document = JsonDocument.Parse(json ?? "[]");
            var root = document.RootElement;
            // Accept the former Block List representation while old snapshots are being migrated.
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("contentData", out var blocks))
            {
                var rows = blocks.EnumerateArray().ToArray();
                if (root.TryGetProperty("layout", out var layout) && layout.TryGetProperty("Umbraco.BlockList", out var order))
                    rows = order.EnumerateArray().Select(item =>
                    {
                        var key = EmergencyContent.Text(item, "contentKey");
                        if (key.Length == 0) key = EmergencyContent.Text(item, "contentUdi").Split('/').Last();
                        return rows.FirstOrDefault(row => Guid.TryParse(key, out var id) && Guid.TryParse(EmergencyContent.Text(row, "key"), out var candidate) && id == candidate);
                    }).Where(row => row.ValueKind == JsonValueKind.Object).ToArray();
                return rows.Select((row, index) => Legacy(row, index + 1)).ToArray();
            }
            if (root.ValueKind != JsonValueKind.Array) return [];
            return root.EnumerateArray().Where(row => row.ValueKind == JsonValueKind.Object).Select((row, index) => Read(row, index + 1)).ToArray();
        }
        catch (JsonException) { return []; }
    }
    private static ActionGuideStep Legacy(JsonElement block, int number)
    {
        var values = EmergencyContent.Rows(block, "values").ToDictionary(value => EmergencyContent.Text(value, "alias"), value => value.GetProperty("value"));
        JsonElement Value(string alias) => values.GetValueOrDefault(alias);
        string Text(string alias) => Value(alias).ValueKind == JsonValueKind.String ? Value(alias).GetString() ?? "" : "";
        return new(Guid.TryParse(EmergencyContent.Text(block, "key"), out var key) ? key : Guid.Empty, number,
            Text("summary"), Strings(Value("details")), Text("quote"), Value("showBankHint").ValueKind == JsonValueKind.True,
            null, null, false, "", "", "", null, Text("noticeTitle"), []);
    }
    private static ActionGuideStep Read(JsonElement row, int number)
    {
        string Text(string alias) => EmergencyContent.Text(row, alias);
        bool Flag(string alias) => row.TryGetProperty(alias, out var value) && value.ValueKind == JsonValueKind.True;
        Guid? Ref(string alias) => EmergencyContent.DocumentKey(Text(alias));
        return new(Guid.TryParse(Text("key"), out var key) ? key : Guid.Empty, number, Text("mainText"),
            row.TryGetProperty("details", out var details) ? Strings(details) : [], Text("sampleScript"), Flag("showBankLookup"),
            Ref("onlyIf"), Ref("snippetAfter"), Flag("hasFollowUp"), Text("followUpQuestion"), Text("followUpButton"), Text("followUpNote"),
            Ref("followUpPage"), Text("noticeTitle"), EmergencyContent.Rows(row, "links").Select(link => new ActionGuideLink(EmergencyContent.Text(link, "label"), EmergencyContent.Text(link, "url"))).ToArray());
    }
    private static string[] Strings(JsonElement value) => value.ValueKind == JsonValueKind.Array
        ? value.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.String).Select(item => item.GetString() ?? "").ToArray() : [];
}
