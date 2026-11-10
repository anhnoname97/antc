using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Web.UI.Models;

public sealed record SelfCheckBranchAction(string Text, string? BankHint);
public sealed record SelfCheckBranchQuestion(string Text, string Label, string Yes, string No,
    string? Url, string SourceTitle, SelfCheckBranchAction[] Actions);
public sealed record SelfCheckBranchData(SelfCheckBranchQuestion[] Questions, SelfCheckBranchAction[] NoneActions,
    string NoneTitle, string? NoneText, string HitTitle, string? HitText, bool Ready);

public static class SelfCheckBranchDataBuilder
{
    private const string BankHint = "Số đúng: số in ở mặt sau thẻ, hoặc mục Trợ giúp trong ứng dụng ngân hàng bạn đã cài từ trước. Không gọi số người kia gửi.";
    private static string? PublicUrl(IPublishedContent? source)
    {
        if (source?.TemplateId is not > 0) return null;
        var url = source.Url();
        return url.StartsWith('/') && !url.StartsWith("//") ? url : null;
    }
    private static SelfCheckBranchAction? Action(IPublishedContent? source, int number)
    {
        var step = ActionGuideData.Step(source, number);
        return string.IsNullOrWhiteSpace(step?.MainText) ? null : new(step.MainText, step.ShowBankLookup ? BankHint : null);
    }
    public static SelfCheckBranchData Build(IPublishedContent page)
    {
        var complete = true;
        var questions = new List<SelfCheckBranchQuestion>();
        foreach (var item in page.Value<BlockListModel>("bq")?.AsEnumerable() ?? Enumerable.Empty<BlockListItem>())
        {
            var content = item.Content;
            var source = content.Value<IPublishedContent>("to");
            var url = PublicUrl(source);
            var actions = new List<SelfCheckBranchAction>();
            var parts = (content.Value<string>("take") ?? "").Split(',');
            var seen = new HashSet<int>();
            foreach (var part in parts)
            {
                if (!int.TryParse(part.Trim(), out var number) || !seen.Add(number) || Action(source, number) is not { } action)
                { complete = false; continue; }
                actions.Add(action);
            }
            var text = content.Value<string>("q") ?? "";
            var label = content.Value<string>("label") ?? "";
            if (url is null || actions.Count == 0 || string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(label)) complete = false;
            string Button(string alias, string fallback) => content.Value<string>(alias) is { } value && !string.IsNullOrWhiteSpace(value) ? value : fallback;
            questions.Add(new(text, label, Button("yes", "Có"), Button("no", "Không"), url,
                source?.Value<string>("title") ?? source?.Name ?? "", actions.ToArray()));
        }
        var noneActions = new List<SelfCheckBranchAction>();
        foreach (var item in page.Value<BlockListModel>("noneAct")?.AsEnumerable() ?? Enumerable.Empty<BlockListItem>())
        {
            if (Action(item.Content.Value<IPublishedContent>("page"), item.Content.Value<int>("step")) is { } action) noneActions.Add(action);
            else complete = false;
        }
        var noneTitle = page.Value<string>("noneT") ?? "";
        var hitTitle = page.Value<string>("hitT") ?? "";
        var ready = complete && questions.Count is >= 2 and <= 8 && noneActions.Count > 0
            && !string.IsNullOrWhiteSpace(noneTitle) && !string.IsNullOrWhiteSpace(hitTitle);
        return new(questions.ToArray(), noneActions.ToArray(), noneTitle, page.Value<string>("none"), hitTitle, page.Value<string>("hitX"), ready);
    }
}
