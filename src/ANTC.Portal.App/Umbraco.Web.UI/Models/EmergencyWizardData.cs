using System.Text.Json.Nodes;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Models;

public sealed record EmergencyWizardData(JsonObject Data, bool Ready, string[] Errors);

public static class EmergencyWizardDataBuilder
{
    public static EmergencyWizardData Build(IPublishedContent page)
    {
        var all = page.Root().DescendantsOrSelf().ToDictionary(node => node.Key);
        var errors = new List<string>();
        IPublishedContent? Resolve(string value) => Guid.TryParse(value.Split('/').LastOrDefault(), out var key) ? all.GetValueOrDefault(key) : null;
        string String(IPublishedElement element, string alias) => element.Value<string>(alias) ?? "";
        JsonArray Rows(string alias) => new(EmergencyContent.Rows(page, alias).Select(row => JsonNode.Parse(row.GetRawText())).ToArray());
        var data = new JsonObject();
        foreach (var alias in new[] { "title", "lead", "privacyNote", "step1Question", "step1Hint", "step1OtherLabel", "step2Question", "step2Hint", "step2NoneLabel", "step3Question", "step3Hint", "step3NoneLabel", "unknownLabel", "unknownSignText", "noMatchText", "clearNote", "situationNote", "button1Text", "button2Text", "button3Text", "button4Text", "resultHeading1", "resultHeading2", "resultHeading3", "resultHeading4", "resultHeading5" }) data[alias] = String(page, alias);
        data["maxSituations"] = Math.Clamp(page.Value<int>("maxSituations"), 1, 3);
        string Get(JsonNode row, string alias) => row[alias]?.GetValue<string>() ?? "";
        var optionKeys = new HashSet<string>();
        for (var step = 1; step <= 3; step++)
        {
            var rows = Rows($"step{step}Options");
            if (rows.Count == 0) errors.Add($"Thiếu lựa chọn bước {step}.");
            foreach (var row in rows.OfType<JsonObject>())
            {
                var key = Get(row, "key");
                if (!Guid.TryParse(key, out _) || !optionKeys.Add(key) || string.IsNullOrWhiteSpace(Get(row, "label"))) errors.Add("Khóa hoặc nhãn lựa chọn không hợp lệ.");
                if (step == 1) row["channel"] = Resolve(Get(row, "channel"))?.Key.ToString() ?? "";
                else
                {
                    if (Get(row, "optionKind") is not ("phaiDung" or "tamHoan")) errors.Add("Loại lựa chọn không hợp lệ.");
                    var sign = Resolve(Get(row, "stopSign"));
                    var text = sign is null ? Get(row, "signText") : String(sign, "signText");
                    row["stopSign"] = sign?.Key.ToString() ?? "";
                    row["resolvedSign"] = text;
                    if (string.IsNullOrWhiteSpace(text)) errors.Add("Thiếu câu dấu hiệu.");
                }
            }
            data[$"step{step}Options"] = rows;
        }
        bool ValidConditions(JsonNode row) => new[] { "onlyIf", "skipIf" }.All(alias => row[alias] is not JsonArray list || list.All(key => optionKeys.Contains(key?.ToString() ?? "")));
        foreach (var alias in new[] { "stopActions", "holdActions", "clearActions" })
        {
            var rows = Rows(alias);
            if (rows.Count == 0) errors.Add("Thiếu bảng việc cần làm theo mức.");
            foreach (var row in rows.OfType<JsonObject>())
            {
                var source = Resolve(Get(row, "page"));
                var number = int.TryParse(row["stepNumber"]?.ToString(), out var index) ? index : 0;
                var text = Get(row, "text");
                if (string.IsNullOrWhiteSpace(text)) text = ActionGuideData.Step(source, number)?.MainText ?? "";
                row["displayText"] = text;
                row["url"] = EmergencyContent.PublicUrl(source) is { } url ? $"{url}#buoc-{number}" : null;
                if (string.IsNullOrWhiteSpace(text) || !ValidConditions(row)) errors.Add("Việc cần làm hoặc điều kiện không hợp lệ.");
            }
            data[alias] = rows;
        }
        var already = Rows("ifAlreadyLinks");
        foreach (var row in already.OfType<JsonObject>())
        {
            row["url"] = EmergencyContent.PublicUrl(Resolve(Get(row, "targetPage")));
            if (row["url"] is null || !ValidConditions(row)) errors.Add("Liên kết hoặc điều kiện Nếu đã lỡ chưa sẵn sàng.");
        }
        data["ifAlreadyLinks"] = already;
        var fallback = page.Value<IPublishedContent>("defaultChecklist");
        data["defaultChecklist"] = fallback?.Key.ToString(); data["defaultChecklistUrl"] = EmergencyContent.PublicUrl(fallback);
        if (data["defaultChecklistUrl"] is null) errors.Add("Thiếu checklist dự phòng đã xuất bản.");
        var tactics = new JsonArray();
        foreach (var tactic in all.Values.Where(node => node.ContentType.Alias == "tacticItem" && node.Value<bool>("isActive")).OrderBy(node => node.SortOrder).ThenBy(node => node.Key))
        {
            var answers = tactic.Value<IEnumerable<string>>("wizardAnswers")?.ToArray() ?? [];
            if (answers.Length == 0) continue;
            if (answers.Any(key => !optionKeys.Contains(key))) { errors.Add("Thủ đoạn trỏ tới lựa chọn đã xóa."); continue; }
            var article = tactic.Value<IPublishedContent>("containingArticle");
            var topic = article?.Value<IPublishedContent>("topic");
            var checklist = topic?.Value<IPublishedContent>("checklist");
            var articleUrl = EmergencyContent.PublicUrl(article);
            tactics.Add(new JsonObject {
                ["key"] = tactic.Key.ToString(), ["name"] = tactic.Name,
                ["wizardAnswers"] = new JsonArray(answers.Select(key => (JsonNode?)JsonValue.Create(key)).ToArray()),
                ["channels"] = new JsonArray((tactic.Value<IEnumerable<IPublishedContent>>("channels") ?? []).Select(node => (JsonNode?)JsonValue.Create(node.Key.ToString())).ToArray()),
                ["containingArticle"] = article?.Key.ToString(), ["articleUrl"] = articleUrl is null ? null : $"{articleUrl}#tactic-{tactic.Key:N}",
                ["checklist"] = checklist?.Key.ToString(), ["checklistUrl"] = EmergencyContent.PublicUrl(checklist)
            });
        }
        data["tactics"] = tactics;
        var site = page.Root();
        foreach (var alias in new[] { "resultNote", "notConclusionNote", "stopLabel", "stopText", "holdLabel", "holdText", "clearLabel", "clearText" }) data[alias] = String(site, alias);
        data["principles"] = new JsonArray(EmergencyContent.Rows(site, "stopPrinciples").Select(row => JsonNode.Parse(row.GetRawText())).ToArray());
        return new(data, errors.Count == 0, errors.Distinct().ToArray());
    }
}
