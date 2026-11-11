using System.Text.Json;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Models;

/// <summary>Resolves stable source step keys from published guides; answer choices never reach the server.</summary>
public static class SituationChooserData
{
    public static object Build(IPublishedContent page, Func<Guid, IPublishedContent?> byKey)
    {
        IPublishedContent? Source(JsonElement row, string alias) => EmergencyContent.DocumentKey(EmergencyContent.Text(row, alias)) is { } id ? byKey(id) : null;
        string? Url(JsonElement row, string alias) => EmergencyContent.PublicUrl(Source(row, alias));
        var guides = new Dictionary<string, object>();
        foreach (var guide in EmergencyContent.Rows(page, "sourceGuides"))
        {
            var source = Source(guide, "page");
            var url = EmergencyContent.PublicUrl(source);
            if (source is null || url is null) continue;
            var steps = ActionGuideData.Steps(source);
            foreach (var mapping in EmergencyContent.Rows(guide, "mappings"))
            {
                var key = EmergencyContent.Text(mapping, "source");
                var step = steps.FirstOrDefault(s => s.Key.ToString() == EmergencyContent.Text(mapping, "stepKey"));
                if (step is null || string.IsNullOrWhiteSpace(step.MainText) || key.Length == 0) continue;
                guides[key] = new { text = step.MainText, details = step.Details, say = step.SampleScript,
                    bank = step.ShowBankLookup, links = step.Links.Where(l => l.Url.StartsWith("tel:") || l.Url.StartsWith("sms:")),
                    url, title = source.Value<string>("title") ?? source.Name,
                    actionId = EmergencyContent.Text(mapping, "actionId"), priority = Number(mapping, "priority", 5.5) };
            }
        }
        var situations = EmergencyContent.Rows(page, "situations").Select(row =>
        {
            var checkPage = Source(row, "checkGuide");
            var check = ActionGuideData.Steps(checkPage).FirstOrDefault(s => s.Key.ToString() == EmergencyContent.Text(row, "checkStep"));
            var reading = Source(row, "relatedReading");
            return new {
                id = EmergencyContent.Text(row, "id"), group = EmergencyContent.Text(row, "group"), title = EmergencyContent.Text(row, "title"),
                keywords = EmergencyContent.Text(row, "keywords"), level = EmergencyContent.Text(row, "level"),
                firstAction = EmergencyContent.Text(row, "firstAction"), why = EmergencyContent.Text(row, "why"),
                nextActions = Strings(row, "nextActions"), avoidActions = Strings(row, "avoidActions"), signs = Strings(row, "signs"),
                preselected = Strings(row, "preselected"), actionId = EmergencyContent.Text(row, "actionId"), priority = Number(row, "priority", 3.5),
                bankCheck = EmergencyContent.Text(row, "checkKind") == "bank",
                check = check is null ? null : new { text = check.MainText, details = check.Details, url = EmergencyContent.PublicUrl(checkPage) },
                reading = EmergencyContent.PublicUrl(reading) is { } readingUrl ? new { url = readingUrl, title = reading!.Value<string>("title") ?? reading!.Name } : null
            };
        }).Where(s => s.id.Length > 0 && s.title.Length > 0 && s.firstAction.Length > 0).ToArray();
        var site = page.Root();
        return new { groups = EmergencyContent.Rows(page, "groups"), situations, consequences = EmergencyContent.Rows(page, "consequences"), guides,
            bankSteps = site.Value<IEnumerable<string>>("bankLookupSteps") ?? [],
            resultNote = site.Value<string>("resultNote"), notConclusionNote = site.Value<string>("notConclusionNote"),
            recoveryTitle = page.Value<string>("recoveryTitle"), recoveryText = page.Value<string>("recoveryText"),
            unknownText = page.Value<string>("unknownText"), principles = EmergencyContent.Rows(site, "stopPrinciples"),
            alternatives = EmergencyContent.Rows(page, "alternatives").Select(row => new { title = EmergencyContent.Text(row, "title"), description = EmergencyContent.Text(row, "description"), url = Url(row, "page") }).Where(x => x.url is not null) };
    }
    private static double Number(JsonElement row, string alias, double fallback) => row.TryGetProperty(alias, out var value) && value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var n) ? n : fallback;
    private static string[] Strings(JsonElement row, string alias) => row.TryGetProperty(alias, out var value) && value.ValueKind == JsonValueKind.Array
        ? value.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString() ?? "").ToArray() : [];
}
