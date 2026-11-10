using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Html;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;
using Umbraco.Plugin.Custom.Core.Articles;
using Umbraco.Plugin.Custom.Core.Content;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Web.UI.Models;

/// <summary>Mot lien ket trong muc Bai lien quan cua trang canh bao.</summary>
public sealed record RiskRelatedLink(string Url, string Title, string Kind, string Icon);

/// <summary>Du lieu cho partial _RiskAlertCard. Hidden: khong khop bo loc tren dia chi (JS loc lai tai cho).</summary>
public sealed record RiskAlertCardView(AlertListItem Item, bool Archived, bool Hidden, DateTime Today);

/// <summary>Du lieu cho partial _RiskFilters. Dates rong thi khong hien o loc Ngay (trang nhom).</summary>
public sealed record RiskFilterView(string Action, AlertListQuery Query, IReadOnlyList<(string Code, string Name)> Channels,
    IReadOnlyList<(string Code, string Name)> Audiences, IReadOnlyList<(string Code, string Name)> Dates);

/// <summary>Du lieu cho partial _RiskResults. Layout: moi the (chua loc) da chia moi/luu tru; Matched: the khop bo loc tren dia chi.
/// Trang dung du the de JS loc tai cho khong tai lai trang; khong co JS thi the khong khop da an san.</summary>
public sealed record RiskResultsView(AlertListResult Layout, IReadOnlySet<AlertListItem> Matched, bool BlockedDigits,
    AlertListQuery Query, DateTime Today, string Unit, string ClearUrl, bool Group)
{
    public static RiskResultsView Build(IReadOnlyList<AlertListItem> items, AlertListQuery query, DateTime today, bool group, string unit, string clearUrl)
    {
        var layout = AlertList.Apply(items, new AlertListQuery(null, null, null, null, null), today, group);
        var found = AlertList.Apply(items, query, today, group);
        return new(layout, found.Fresh.Concat(found.Archived).ToHashSet(), found.BlockedDigits, query, today, unit, clearUrl, group);
    }
}

/// <summary>Mot tab cua thanh 6 nhom Cac rui ro.</summary>
public sealed record RiskTab(string Url, string Name, string Icon, bool Current);

/// <summary>The cua trang nhom va dong "dang bien soan", ca hai tu RuiRoDerivation.</summary>
public sealed record RiskGroupData(IReadOnlyList<AlertListItem> Cards, bool InPreparation);

/// <summary>Cau co dinh (WEB-02): doc tu Cai dat website › Cau co dinh (Phu luc A); o con trong hoac chua co nut
/// Cai dat website (V2-02a) thi dung cau mac dinh trong code.</summary>
public sealed record RiskFixedText(string NoAnswer, string NoAdvice, IReadOnlyList<string> MustRemember, string Sample, string Hold);

/// <summary>Doc du lieu Canh bao moi va trang canh bao tu noi dung da xuat ban (V2-13h, V2-13i).</summary>
public static class RiskAlertContent
{
    // Cau mac dinh khi Cai dat website chua co gia tri hoac chua co truong tuong ung (WEB-02).
    public const string SampleNote = "Các cảnh báo trên bản dựng thử chưa phải cảnh báo thật. Khi vận hành, mỗi mục do Ban biên tập viết từ một văn bản của cơ quan nhà nước.";
    public const string HoldNote = "Cam kết lợi nhuận cao, đều đặn, một tài khoản cá nhân thay cho tài khoản của bên giao dịch, hoặc giấy tờ không khớp lời giới thiệu là dấu hiệu phải hoãn lại để tự kiểm tra bằng kênh do chính bạn tìm ra.";
    public const string NoAnswerNote = "Xem các câu hỏi thường gặp, đã có trả lời ngắn và lối sang trang hướng dẫn.";

    public static readonly IReadOnlyList<(string Code, string Name)> DateOptions =
        [(AlertList.Last30Days, "30 ngày qua"), (AlertList.Last90Days, "90 ngày qua"), (AlertList.Archive, "Lưu trữ, quá 90 ngày")];

    /// <summary>Muc dang dung: o "Dang dung" tat thi khong hien o bo loc; loai chua co o nay coi nhu dang dung.</summary>
    private static bool Active(IPublishedContent x) => !x.HasProperty("isActive") || !x.HasValue("isActive") || x.Value<bool>("isActive");

    public static IReadOnlyList<(string Code, string Name)> ChannelOptions(RiskSnapshot data) =>
        data.Of("channelItem").Where(Active).Select(x => (ChannelCode(x), x.Name)).ToArray();

    public static IReadOnlyList<(string Code, string Name)> AudienceOptions(RiskSnapshot data) =>
        data.Of("audienceItem").Where(Active).Select(x => (AudienceCode(x), x.Name)).ToArray();

    /// <summary>Cau co dinh tu nut Cai dat website (siteSettings) o goc cay; thieu thi dung cau mac dinh.</summary>
    public static RiskFixedText FixedText(IEnumerable<IPublishedContent> roots)
    {
        var settings = roots.FirstOrDefault(x => x.ContentType.Alias == "siteSettings");
        string Text(string alias, string fallback) => settings?.Value<string>(alias) is { } v && !string.IsNullOrWhiteSpace(v) ? v.Trim() : fallback;
        var remember = settings is null ? [] : Lines(settings, "mustRemember");
        return new RiskFixedText(Text("noAnswerNote", NoAnswerNote), Text("noAdviceNote", NoAdvice),
            remember.Count > 0 ? remember : MustRemember, Text("sampleNote", SampleNote), Text("holdNote", HoldNote));
    }

    /// <summary>Doc bo loc tu dia chi; chi nhan gia tri co trong danh muc, gia tri la coi nhu "Tat ca".</summary>
    public static AlertListQuery ReadQuery(Microsoft.AspNetCore.Http.IQueryCollection q, RiskFilterView options)
    {
        string? Pick(string name, IEnumerable<(string Code, string Name)> allowed) =>
            q[name].ToString() is { Length: > 0 } value && allowed.Any(x => x.Code == value) ? value : null;
        string text = q["q"].ToString().Trim();
        if (text.Length > 120) text = text[..120];
        return new AlertListQuery(text, Pick("kenh", options.Channels), Pick("doi-tuong", options.Audiences),
            Pick("muc-do", AlertList.Levels.Select(x => (x.Code, x.Name))), Pick("ngay", options.Dates));
    }

    /// <summary>O chon noi dung tra ve mot muc hoac danh sach tuy cau hinh so luong toi da.</summary>
    public static IReadOnlyList<IPublishedContent> Picked(IPublishedElement content, string alias) => content.Value(alias) switch
    {
        IPublishedContent one => [one],
        IEnumerable<IPublishedContent> many => many.ToArray(),
        _ => []
    };

    public static IReadOnlyList<string> Lines(IPublishedElement content, string alias) =>
        (content.Value<IEnumerable<string>>(alias) ?? []).Select(x => x.Trim()).Where(x => x.Length > 0).ToArray();

    public static DateTime? Date(IPublishedElement content, string alias) =>
        content.Value<DateTime>(alias) is var date && date.Year > 1900 ? date.Date : null;

    public static string Title(IPublishedContent content) =>
        content.Value<string>("title") is { Length: > 0 } title ? title : content.Name;

    public static string Level(IPublishedElement alert) => AlertList.LevelCode(alert.Value<string>("cautionLevel"));

    public static string LevelName(string code) => AlertList.Levels.FirstOrDefault(x => x.Code == code).Name ?? "";

    public static string ChannelCode(IPublishedContent channel) =>
        channel.Value<string>("code") is { Length: > 0 } code ? code : AlertList.Slug(channel.Name);

    /// <summary>Ma loc cua doi tuong (WEB-10): truong code; chi khi trong moi dung ten bo dau.</summary>
    public static string AudienceCode(IPublishedContent audience) =>
        audience.Value<string>("code") is { Length: > 0 } code ? code.Trim() : AlertList.Slug(audience.Name);

    /// <summary>Gia tri o Bieu tuong luu dang "Giấy tờ · id"; lay phan sau dau cham giua.</summary>
    public static string IconId(string? stored, string fallback)
    {
        string raw = (stored ?? "").Trim().Trim('[', ']', '"', ' ');
        string id = raw.Contains('·') ? raw[(raw.LastIndexOf('·') + 1)..].Trim() : raw;
        return id.Length > 0 ? id : fallback;
    }

    /// <summary>Cau dau hieu (o soan thao) qua ArticleHtmlSanitizer (WEB-12) truoc khi xuat; bo the p boc ngoai de nam gon trong mot dong danh sach.</summary>
    public static IHtmlContent SignHtml(IPublishedContent sign, ArticleHtmlSanitizer sanitizer)
    {
        string html = sanitizer.Clean(sign.Value<IHtmlEncodedString>("signText")?.ToHtmlString() ?? "");
        html = Regex.Replace(html.Trim(), @"^<p>(.*)</p>$", "$1", RegexOptions.Singleline);
        return string.IsNullOrWhiteSpace(Regex.Replace(html, "<[^>]+>|&nbsp;", ""))
            ? new HtmlString(System.Net.WebUtility.HtmlEncode(sign.Name)) : new HtmlString(html);
    }

    public static string ReadingText(IPublishedElement alert) =>
        string.Join(' ', Lines(alert, "scenarioSteps").Prepend(alert.Value<string>("description") ?? ""));

    /// <summary>Canh bao da xuat ban trong thu muc Canh bao (thu muc phai xuat ban).</summary>
    public static IEnumerable<IPublishedContent> Alerts(RiskSnapshot data) => data.Of("alertPage").Where(x => x.TemplateId is > 0);

    public static AlertListItem Card(IPublishedContent alert) => Card(alert, null);

    public static AlertListItem Card(IPublishedContent alert, Func<IPublishedContent, string>? url)
    {
        string ResolveUrl(IPublishedContent x) => url is null ? x.Url() : url(x);
        return new(
            ResolveUrl(alert), Title(alert), alert.Value<string>("description") ?? "",
            alert.Value<string>("issuingAgency") is { Length: > 0 } agency ? agency.Trim() : null,
            Date(alert, "updatedDate"), Level(alert),
            Picked(alert, "channels").Select(ChannelCode).ToArray(),
            Picked(alert, "audiences").Select(AudienceCode).ToArray(),
            string.Join(' ', alert.Value<IEnumerable<string>>("searchKeywords") ?? []),
            AlertList.AlertReadingMinutes(ReadingText(alert)));
    }

    public const string NoAdvice = "Website không tư vấn đầu tư, không tư vấn tài chính cá nhân và không giới thiệu sản phẩm tài chính. Nội dung của mục Rủi ro tài chính chỉ nhằm giúp bạn đặt đúng câu hỏi trước khi quyết định.";
    public static readonly string[] MustRemember =
    [
        "Có đăng ký doanh nghiệp không đồng nghĩa với được phép cung cấp dịch vụ tài chính. Nhiều dịch vụ tài chính đòi hỏi giấy phép chuyên ngành riêng; kiểm tra đăng ký doanh nghiệp là chưa đủ.",
        "Một khoản đầu tư có thể làm mất tiền mà không có bất kỳ hành vi gian dối nào. Thua lỗ do biến động thị trường không phải là lừa đảo, và cần được xử lý theo cách khác."
    ];
    public const string FrameworkSnippetName = "Bộ khung nhận diện";

    /// <summary>Gia tri o chon loai bai (Dropdown) co the la mot chuoi hoac danh sach.</summary>
    public static bool IsKind(IPublishedElement article, string name) => article.Value("articleKind") switch
    {
        string s => s.Contains(name),
        IEnumerable<string> list => list.Any(x => x.Contains(name)),
        _ => false
    };

    private static string Plain(string? html) =>
        System.Net.WebUtility.HtmlDecode(Regex.Replace(Regex.Replace(html ?? "", "<[^>]+>", " "), @"\s+", " ")).Trim();

    /// <summary>Lien ket toi mot thu doan (WEB-04): ?thu-doan=ma de bai huong dan to sang dong (V2-13i),
    /// neo #tactic-khoa de cuon toi dong (trinh hoi Khan cap dung cung neo, QD-056).</summary>
    public static string TacticUrl(IPublishedContent article, IPublishedContent tactic) => TacticUrl(article, tactic, null);

    public static string TacticUrl(IPublishedContent article, IPublishedContent tactic, Func<IPublishedContent, string>? url)
    {
        string ResolveUrl(IPublishedContent x) => url is null ? x.Url() : url(x);
        string code = tactic.Value<string>("code")?.Trim() ?? "";
        return $"{ResolveUrl(article)}{(code.Length > 0 ? "?thu-doan=" + Uri.EscapeDataString(code) : "")}#tactic-{tactic.Key:N}";
    }

    private static string KindOf(RiskNode article) =>
        article.IsKind("huongDan") ? "lv" : article.IsKind("docChuyenDe") ? "doc" : "art";

    /// <summary>The cua trang nhom (WEB-01): danh sach bai, thu doan, canh bao, viec can lam, muc do, kenh, doi tuong
    /// deu lay tu RuiRoDerivation; o day chi doi sang AlertListItem va sap theo ban dung: ghim, roi loai, roi moi nhat.</summary>
    public static RiskGroupData Group(IPublishedContent group, RiskSnapshot data, RuiRoDerivation derivation) =>
        Group(group, data, derivation, null);

    public static RiskGroupData Group(IPublishedContent group, RiskSnapshot data, RuiRoDerivation derivation,
        Func<IPublishedContent, string>? url)
    {
        if (data.Node(group.Key) is not { } groupNode) return new([], true);
        string ResolveUrl(IPublishedContent x) => url is null ? x.Url() : url(x);
        var derived = derivation.Derive(groupNode, data.Nodes);
        string[] Channels(RiskDerived d) => d.Channels.Select(data.Content).OfType<IPublishedContent>().Select(ChannelCode).ToArray();
        string[] Audiences(RiskDerived d) => d.Audiences.Select(data.Content).OfType<IPublishedContent>().Select(AudienceCode).ToArray();
        string LevelOrDefault(string level) => AlertList.LevelCode(level) is { Length: > 0 } code ? code : "can-than-trong";
        string Keywords(IPublishedContent x) => string.Join(' ', x.Value<IEnumerable<string>>("searchKeywords") ?? []);

        var cards = new List<(AlertListItem Item, bool Featured, DateTime Date)>();
        foreach (var a in derived.Alerts.Select(data.Content).OfType<IPublishedContent>().Where(x => x.TemplateId is > 0))
            cards.Add((Card(a, url), false, Date(a, "updatedDate") ?? a.UpdateDate));
        foreach (var node in derived.Articles)
        {
            if (data.Content(node) is not { TemplateId: > 0 } a) continue;
            var own = derivation.Derive(node, data.Nodes);
            string kind = KindOf(node);
            string summary = a.Value<string>("description") is { Length: > 0 } d ? d : Plain(a.Value<string>("summary"));
            cards.Add((new AlertListItem(ResolveUrl(a), Title(a), summary, null, a.UpdateDate, LevelOrDefault(own.Level),
                Channels(own), Audiences(own), Keywords(a), own.ReadingMinutes, kind,
                kind == "lv" ? "shield" : kind == "doc" ? "icon-book" : "doc"), node.Flag("isFeatured"), a.UpdateDate));
        }
        var guides = derived.Articles.Where(x => x.IsKind("huongDan")).Select(x => x.Key).ToHashSet();
        foreach (var node in derived.Tactics)
        {
            var article = node.Refs("containingArticle").Where(guides.Contains).Select(data.Content).OfType<IPublishedContent>().FirstOrDefault();
            if (data.Content(node) is not { } t || article is null) continue;
            var own = derivation.Derive(node, data.Nodes);
            var channels = own.Channels.Select(data.Content).OfType<IPublishedContent>().ToArray();
            cards.Add((new AlertListItem(TacticUrl(article, t, url), t.Name, $"{Title(article)} · {string.Join(", ", channels.Select(c => c.Name))}",
                null, null, LevelOrDefault(own.Level), channels.Select(ChannelCode).ToArray(), Audiences(own), Keywords(t), 0, "tac", "alert"),
                false, t.UpdateDate));
        }
        foreach (var p in derived.Actions.Select(data.Content).OfType<IPublishedContent>().Where(x => x.TemplateId is > 0))
            cards.Add((new AlertListItem(ResolveUrl(p), Title(p), Plain(p.Value<string>("lead")), null, null, "rat-cao", [], [], "", 0, "pb", "clock"),
                false, p.UpdateDate));
        var ordered = cards.OrderByDescending(x => x.Featured).ThenBy(x => AlertList.KindOrder(x.Item.Kind)).ThenByDescending(x => x.Date)
            .Select(x => x.Item).ToArray();
        return new RiskGroupData(ordered, derived.InPreparation);
    }

    /// <summary>Doan dung chung "Bo khung nhan dien" (hien co dinh o nhom Lua dao).</summary>
    public static IPublishedContent? Snippet(RiskSnapshot data, string name) =>
        data.Of("sharedSnippet").FirstOrDefault(x => x.Name == name || x.Value<string>("title") == name);

    /// <summary>Thanh 6 tab: Canh bao moi va 5 nhom, theo thu tu co dinh cua RiskStructure.</summary>
    /// <summary>Thu tu tab theo ban dung 10/11/2026: Bao hiem va tiet kiem dung truoc Du lieu ca nhan.
    /// Chi doi thu tu hien thi, khong doi RiskStructure (dung chung voi backoffice).</summary>
    private static readonly string[] TabOrder =
        ["alertListPage", "luaDaoPage", "vayVaNoPage", "dauTuPage", "baoHiemVaTietKiemPage", "duLieuCaNhanPage"];

    public static IReadOnlyList<RiskTab> Tabs(Func<Guid, IPublishedContent?> byKey, string currentAlias) =>
        RiskStructure.Pages.Skip(1).OrderBy(x => Array.IndexOf(TabOrder, x.Alias) is var i and >= 0 ? i : TabOrder.Length + x.Order).Select(page =>
        {
            var node = byKey(page.Key);
            string name = node?.Value<string>("tabName") is { Length: > 0 } tab ? tab
                : node is not null && page.Alias == "alertListPage" ? Title(node) : page.Name;
            string url = page.Alias == "alertListPage" ? AntcPublicPaths.AlertListPath : AntcPublicPaths.RiskGroupPath(page.Alias) ?? "#";
            string fallback = page.Alias switch
            {
                "alertListPage" => "mega", "luaDaoPage" => "alert", "vayVaNoPage" => "coins", "dauTuPage" => "chart",
                "duLieuCaNhanPage" => "id", _ => "shield"
            };
            return new RiskTab(url, name, page.Alias == "alertListPage" ? "mega" : IconId(node?.Value<string>("icon"), fallback), page.Alias == currentAlias);
        }).ToArray();

    /// <summary>Bai lien quan cua canh bao (WEB-01): danh sach tu RuiRoDerivation (bai huong dan chua thu doan, thu doan,
    /// danh sach kiem tra cung chuyen de; toi da 4); o day chi doi sang lien ket.</summary>
    public static IReadOnlyList<RiskRelatedLink> Related(IPublishedContent alert, RiskSnapshot data, RuiRoDerivation derivation) =>
        Related(alert, data, derivation, null);

    public static IReadOnlyList<RiskRelatedLink> Related(IPublishedContent alert, RiskSnapshot data, RuiRoDerivation derivation,
        Func<IPublishedContent, string>? url)
    {
        if (data.Node(alert.Key) is not { } node) return [];
        string ResolveUrl(IPublishedContent x) => url is null ? x.Url() : url(x);
        var links = new List<RiskRelatedLink>();
        foreach (var item in derivation.Derive(node, data.Nodes).Related)
        {
            if (data.Content(item) is not { } content) continue;
            switch (item.Type)
            {
                case "riskArticlePage" when content.TemplateId is > 0:
                    links.Add(new RiskRelatedLink(ResolveUrl(content), Title(content), "Bài hướng dẫn", "book"));
                    break;
                case "tacticItem":
                    var article = item.Refs("containingArticle").Select(data.Content).FirstOrDefault(x => x?.TemplateId is > 0);
                    if (article is not null) links.Add(new RiskRelatedLink(TacticUrl(article, content, url), content.Name, "Thủ đoạn", "alert"));
                    break;
                case "checklistPage" when content.TemplateId is > 0:
                    links.Add(new RiskRelatedLink(ResolveUrl(content), "Danh sách kiểm tra: " + Title(content), "Danh sách kiểm tra", "quiz"));
                    break;
            }
        }
        return links.DistinctBy(x => x.Url).ToArray();
    }
}
