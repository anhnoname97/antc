using System.Text.Json;
using System.Text.RegularExpressions;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed record RiskNode(Guid Key, Guid? ParentKey, string Type, string Name, int Order, DateTime Updated,
    bool Published, IReadOnlyDictionary<string, object?> Values)
{
    public Guid ContentTypeKey { get; init; }
    public string Text(string alias)
    {
        if (!Values.TryGetValue(alias, out var value) || value is null) return "";
        if (value is JsonElement e)
        {
            if (e.ValueKind == JsonValueKind.Object && e.TryGetProperty("markup", out var markup)) return markup.GetString() ?? "";
            return e.ValueKind == JsonValueKind.String ? e.GetString() ?? "" : e.ToString();
        }
        if (value is IEnumerable<string> strings) return JsonSerializer.Serialize(strings);
        if (value is string s && s.TrimStart().StartsWith('{'))
        {
            try { using var j = JsonDocument.Parse(s); if (j.RootElement.TryGetProperty("markup", out var markup)) return markup.GetString() ?? ""; }
            catch (JsonException) { }
        }
        return value.ToString() ?? "";
    }
    public IReadOnlyList<string> Strings(string alias)
    {
        string s = Text(alias);
        if (string.IsNullOrWhiteSpace(s)) return [];
        try
        {
            using var json = JsonDocument.Parse(s);
            if (json.RootElement.ValueKind == JsonValueKind.Array)
                return json.RootElement.EnumerateArray().Select(x => x.ValueKind == JsonValueKind.String ? x.GetString()! : x.ToString()).ToArray();
        }
        catch (JsonException) { }
        return s.Split(['\n', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
    /// <summary>Danh sach dong (MultipleTextstring): luu moi dong mot muc, khong tach theo dau phay nhu Strings.</summary>
    public IReadOnlyList<string> Lines(string alias)
    {
        string s = Text(alias);
        if (s.TrimStart().StartsWith('[')) return Strings(alias);
        return s.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
    public IReadOnlyList<Guid> Refs(string alias) => Strings(alias).Select(x =>
    {
        if (x.TrimStart().StartsWith('{'))
        {
            try { using var j = JsonDocument.Parse(x); if (j.RootElement.TryGetProperty("unique", out var k)) x = k.GetString() ?? ""; }
            catch (JsonException) { return Guid.Empty; }
        }
        return Guid.TryParse(x.Replace("umb://document/", ""), out var g) ? g : Guid.Empty;
    }).Where(x => x != Guid.Empty).ToArray();
    public bool Has(string alias) => !string.IsNullOrWhiteSpace(Regex.Replace(Text(alias), "<[^>]+>|&nbsp;", " ")) && Text(alias) is not "[]" and not "null";
    public bool Flag(string alias) => Text(alias) is "1" or "true" or "True";
    public bool IsKind(string code) => Strings("articleKind").Any(x => x == code || x == (code switch { "huongDan" => "Bài hướng dẫn", "docChuyenDe" => "Bài đọc chuyên đề", _ => "Bài đọc thêm" }));
}

public sealed record RiskDerived(IReadOnlyList<RiskNode> Articles, IReadOnlyList<RiskNode> Tactics,
    IReadOnlyList<RiskNode> Alerts, IReadOnlyList<RiskNode> Actions, IReadOnlyList<RiskNode> Related,
    IReadOnlyList<RiskNode> Channels, IReadOnlyList<RiskNode> Audiences, string Level, bool InPreparation,
    RiskNode? Topic, RiskNode? Checklist, RiskNode? Next, int SeriesPosition, int SeriesCount,
    int ReadingMinutes, string Invitation);

/// <summary>Luật QĐ-054/055 dùng chung cho backoffice và Razor. Đầu vào quyết định bản nháp/xuất bản và quyền truy cập.</summary>
public sealed class RuiRoDerivation
{
    public RiskDerived Derive(RiskNode current, IReadOnlyList<RiskNode> nodes, int? topicQuestionCount = null)
    {
        var map = nodes.ToDictionary(x => x.Key);
        RiskNode? Ref(RiskNode n, string alias) => n.Refs(alias).Select(k => map.GetValueOrDefault(k)).FirstOrDefault(x => x is not null);
        IEnumerable<RiskNode> Typed(string type) => nodes.Where(x => x.Type == type);
        bool InGroup(RiskNode n, Guid group) => n.Refs("primaryGroup").Contains(group) || n.Refs("alsoInCategories").Contains(group);
        var group = current.Type == "riskCategoryPage" ? current.Key : current.Refs("primaryGroup").FirstOrDefault();
        var articles = Typed("riskArticlePage").Where(x => InGroup(x, group)).OrderByDescending(x => x.Flag("isFeatured")).ThenByDescending(x => x.Updated).ToArray();
        var tactics = Typed("tacticItem").Where(x => current.Type switch
        {
            "riskCategoryPage" => articles.Any(a => a.IsKind("huongDan") && x.Refs("containingArticle").Contains(a.Key)),
            "alertPage" => current.Refs("tactics").Contains(x.Key),
            "tacticItem" => x.Key == current.Key,
            _ => x.Refs("containingArticle").Contains(current.Key)
        }).OrderBy(x => x.Order).ToArray();
        var tacticKeys = tactics.Select(x => x.Key).ToHashSet();
        var alerts = Typed("alertPage").Where(x => x.Refs("tactics").Any(tacticKeys.Contains)).OrderByDescending(x => x.Updated).ToArray();
        var actionKeys = articles.Concat(alerts).Append(current).SelectMany(x => x.Refs("actionPage")).ToHashSet();
        var actions = Typed("viecCanLamPage").Where(x => actionKeys.Contains(x.Key)).ToArray();
        var channels = tactics.SelectMany(x => x.Refs("channels")).Distinct().Select(k => map.GetValueOrDefault(k)).OfType<RiskNode>().ToArray();
        var audiences = Typed("audienceItem").Where(x => x.Refs("tactics").Any(tacticKeys.Contains)).ToArray();
        int Rank(RiskNode x) => x.Strings("cautionLevel").FirstOrDefault() switch { "ratCao" or "Rất cao" => 3, "cao" or "Cao" => 2, _ => 1 };
        string level = tactics.OrderByDescending(Rank).FirstOrDefault() is { } highest ? Rank(highest) switch { 3 => "Rất cao", 2 => "Cao", _ => "Cần thận trọng" } : "Chưa có thủ đoạn";
        var topic = current.Type == "tacticItem" ? Ref(current, "containingArticle") is { } art ? Ref(art, "topic") : null : Ref(current, "topic");
        Guid? ChecklistTopic(RiskNode x) => Ref(x, "sourceArticle")?.Refs("topic").FirstOrDefault();
        var checklist = Typed("checklistPage").FirstOrDefault(x => topic is not null && ChecklistTopic(x) == topic.Key);
        var related = new List<RiskNode>();
        if (current.Type == "alertPage")
        {
            related.AddRange(tactics.Select(x => Ref(x, "containingArticle")).OfType<RiskNode>().Where(x => x.IsKind("huongDan")));
            related.AddRange(tactics);
            var topics = related.Where(x => x.Type == "riskArticlePage").SelectMany(x => x.Refs("topic")).ToHashSet();
            related.AddRange(Typed("checklistPage").Where(x => ChecklistTopic(x) is { } t && topics.Contains(t)));
            related = related.DistinctBy(x => x.Key).Take(4).ToList();
        }
        else
        {
            if (checklist is not null) related.Add(checklist);
            related.AddRange(nodes.Where(x => x.Type is "toolCountPage" or "toolBranchPage" && topic is not null && x.Refs("topic").Contains(topic.Key)));
            related.AddRange(articles.Where(x => x.Key != current.Key && x.IsKind("huongDan")));
            related.AddRange(articles.Where(x => x.Key != current.Key && x.IsKind("docThem")).OrderByDescending(x => x.Updated).Take(3));
        }
        string? series = current.Strings("series").FirstOrDefault();
        var sameSeries = Typed("riskArticlePage").Where(x => x.IsKind("docThem") && series is not null && x.Strings("series").Contains(series)).OrderBy(x => x.Order).ToArray();
        int position = Array.FindIndex(sameSeries, x => x.Key == current.Key);
        var next = series is not null ? sameSeries.ElementAtOrDefault(position + 1) : articles.Where(x => x.Key != current.Key && x.IsKind("docThem")).OrderByDescending(x => x.Updated).FirstOrDefault();
        string allText = current.Text("summary") + " " + current.Text("readingBody") + " " + current.Text("warningSigns") + " " + current.Text("actionsNow");
        int minutes = Math.Max(1, (int)Math.Ceiling(Regex.Matches(Regex.Replace(allText, "<[^>]+>", " "), @"\S+").Count / 200d));
        string invitation = current.Text("description");
        if (string.IsNullOrWhiteSpace(invitation) && current.IsKind("docChuyenDe"))
            invitation = $"Đọc khoảng {minutes} phút. Đọc xong rồi hãy làm {(topicQuestionCount is { } count ? count + " câu" : "bộ câu hỏi")} của Chuyên đề {topic?.Text("topicNumber")}.";
        return new(articles, tactics, alerts, actions, related.DistinctBy(x => x.Key).ToArray(), channels, audiences, level,
            !articles.Any(x => x.Refs("primaryGroup").Contains(group)), topic, checklist, next, position + 1, sameSeries.Length, minutes, invitation);
    }
}

public static class AlertFreshness
{
    public static int Age(DateTime updated, DateTime today) => (today.Date - updated.Date).Days;
    public static bool IsFresh(DateTime updated, DateTime today) => Age(updated, today) <= 90;
    public static bool ShouldUnpublish(DateTime updated, int days, DateTime today) => Age(updated, today) > days;
}
