using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Models;

public sealed record SelfCheckOption(string Label, string Mean);
public sealed record SelfCheckQuestion(string Kind, string Text, string? Help, SelfCheckOption[] Options);
public sealed record SelfCheckResult(string Label, string[] Actions);
public sealed record SelfCheckToolData(SelfCheckQuestion[] Questions, Dictionary<string, SelfCheckResult> Results,
    string? NoneMore, bool Ready);

public static class SelfCheckToolDataBuilder
{
    public static SelfCheckToolData Build(IPublishedContent page)
    {
        var questions = (page.Value<BlockListModel>("qs")?.AsEnumerable() ?? Enumerable.Empty<BlockListItem>()).Select(block =>
        {
            var content = block.Content;
            var configured = content.Value<BlockListModel>("opts");
            SelfCheckOption[] options = configured?.Any() == true
                ? configured.Select(option => new SelfCheckOption(option.Content.Value<string>("label") ?? "", option.Content.Value<string>("mean") ?? "")).ToArray()
                : [new("Có", "co"), new("Không", "khong"), new("Tôi chưa biết", "chuaBiet")];
            return new SelfCheckQuestion(content.Value<string>("kind") ?? "", content.Value<string>("q") ?? "", content.Value<string>("help"), options);
        }).ToArray();
        var results = new Dictionary<string, SelfCheckResult>();
        var complete = true;
        foreach (var code in new[] { "D", "H", "N" })
        {
            var entries = page.Value<BlockListModel>("act" + code);
            var actions = new List<string>();
            foreach (var block in entries?.AsEnumerable() ?? Enumerable.Empty<BlockListItem>())
            {
                var source = block.Content.Value<IPublishedContent>("page");
                var steps = source?.Value<BlockListModel>("steps");
                var index = block.Content.Value<int>("step") - 1;
                var summary = index >= 0 && index < (steps?.Count ?? 0) ? steps![index].Content.Value<string>("summary") : null;
                if (string.IsNullOrWhiteSpace(summary)) { complete = false; continue; }
                actions.Add(summary);
            }
            if (actions.Count == 0 || actions.Count != (entries?.Count ?? 0)) complete = false;
            results[code.ToLowerInvariant()] = new(page.Value<string>("res" + code) ?? "", actions.ToArray());
        }
        var ready = complete && questions.Length is >= 2 and <= 8 && questions.All(q =>
            !string.IsNullOrWhiteSpace(q.Text) && q.Kind is "phaiDung" or "tamHoan" or "canKiemTra"
            && q.Options.Length is >= 2 and <= 5 && q.Options.All(o => !string.IsNullOrWhiteSpace(o.Label) && o.Mean is "co" or "khong" or "chuaBiet"))
            && results.Values.All(r => !string.IsNullOrWhiteSpace(r.Label));
        return new(questions, results, page.Value<string>("noneMore"), ready);
    }
}
