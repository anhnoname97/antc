using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;
namespace Umbraco.Web.UI.Models;

public sealed record SelfCheckChecklistData(string[] Questions, string[] Items, string StopAction, string HoldAction, bool Ready);
public static class SelfCheckChecklistDataBuilder
{
    public static SelfCheckChecklistData Build(IPublishedContent page)
    {
        var questions = page.Value<IEnumerable<string>>("p1Qs")?.ToArray() ?? [];
        var items = page.Value<IEnumerable<string>>("p2Items")?.ToArray() ?? [];
        var stop = page.Value<string>("doD") ?? "";
        var hold = page.Value<string>("doH") ?? "";
        var source = page.Value<IPublishedContent>("src");
        var url = source?.TemplateId is > 0 ? source.Url() : null;
        var ready = questions.Length is >= 1 and <= 8 && items.Length is >= 1 and <= 15
            && questions.All(q => !string.IsNullOrWhiteSpace(q)) && items.All(q => !string.IsNullOrWhiteSpace(q))
            && !string.IsNullOrWhiteSpace(stop) && !string.IsNullOrWhiteSpace(hold)
            && url?.StartsWith('/') == true && !url.StartsWith("//");
        return new(questions, items, stop, hold, ready);
    }
}
