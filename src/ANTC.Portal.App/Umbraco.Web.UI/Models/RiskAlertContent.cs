using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Html;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;
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

/// <summary>Doc du lieu Canh bao moi va trang canh bao tu noi dung da xuat ban (V2-13h, V2-13i).</summary>
public static class RiskAlertContent
{
    public const string SampleNote = "Các cảnh báo trên bản dựng thử chưa phải cảnh báo thật. Khi vận hành, mỗi mục do Ban biên tập viết từ một văn bản của cơ quan nhà nước.";
    public const string HoldNote = "Cam kết lợi nhuận cao, đều đặn, một tài khoản cá nhân thay cho tài khoản của bên giao dịch, hoặc giấy tờ không khớp lời giới thiệu là dấu hiệu phải hoãn lại để tự kiểm tra bằng kênh do chính bạn tìm ra.";
    public const string NoAnswerNote = "Gửi câu hỏi riêng cho Ban biên tập. Câu hỏi không hiện lên trang; các câu giống nhau được gộp và trả lời công khai sau khi đã che thông tin cá nhân.";

    public static readonly IReadOnlyList<(string Code, string Name)> DateOptions =
        [(AlertList.Last30Days, "30 ngày qua"), (AlertList.Last90Days, "90 ngày qua"), (AlertList.Archive, "Lưu trữ, quá 90 ngày")];

    public static IReadOnlyList<(string Code, string Name)> ChannelOptions(IPublishedContent site) =>
        site.Descendants().Where(x => x.ContentType.Alias == "channelItem" && x.Value<bool>("isActive"))
            .Select(x => (ChannelCode(x), x.Name)).ToArray();

    public static IReadOnlyList<(string Code, string Name)> AudienceOptions(IPublishedContent site) =>
        site.Descendants().Where(x => x.ContentType.Alias == "audienceItem").Select(x => (AudienceCode(x), x.Name)).ToArray();

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

    /// <summary>Danh muc Doi tuong khong co truong code nen dung ten bo dau.</summary>
    public static string AudienceCode(IPublishedContent audience) => AlertList.Slug(audience.Name);

    /// <summary>Gia tri o Bieu tuong luu dang "Giấy tờ · id"; lay phan sau dau cham giua.</summary>
    public static string IconId(string? stored, string fallback)
    {
        string raw = (stored ?? "").Trim().Trim('[', ']', '"', ' ');
        string id = raw.Contains('·') ? raw[(raw.LastIndexOf('·') + 1)..].Trim() : raw;
        return id.Length > 0 ? id : fallback;
    }

    /// <summary>Cau dau hieu (o soan thao) da qua bo loc HTML cua Umbraco; bo the p boc ngoai de nam gon trong mot dong danh sach.</summary>
    public static IHtmlContent SignHtml(IPublishedContent sign)
    {
        string html = sign.Value<IHtmlEncodedString>("signText")?.ToHtmlString() ?? "";
        html = Regex.Replace(html.Trim(), @"^<p>(.*)</p>$", "$1", RegexOptions.Singleline);
        return string.IsNullOrWhiteSpace(Regex.Replace(html, "<[^>]+>|&nbsp;", ""))
            ? new HtmlString(System.Net.WebUtility.HtmlEncode(sign.Name)) : new HtmlString(html);
    }

    public static string ReadingText(IPublishedElement alert) =>
        string.Join(' ', Lines(alert, "scenarioSteps").Prepend(alert.Value<string>("description") ?? ""));

    /// <summary>Canh bao da xuat ban trong thu muc Canh bao, doc theo khoa thu muc (thu muc phai xuat ban).</summary>
    public static IEnumerable<IPublishedContent> Alerts(IDocumentNavigationQueryService navigation, Func<Guid, IPublishedContent?> byKey) =>
        navigation.TryGetChildrenKeysOfType(RiskStructure.AlertFolderKey, "alertPage", out IEnumerable<Guid> keys)
            ? keys.Select(byKey).OfType<IPublishedContent>().Where(x => x.TemplateId is > 0)
            : [];

    public static AlertListItem Card(IPublishedContent alert) => new(
        alert.Url(), Title(alert), alert.Value<string>("description") ?? "",
        alert.Value<string>("issuingAgency") is { Length: > 0 } agency ? agency.Trim() : null,
        Date(alert, "updatedDate"), Level(alert),
        Picked(alert, "channels").Select(ChannelCode).ToArray(),
        Picked(alert, "audiences").Select(AudienceCode).ToArray(),
        string.Join(' ', alert.Value<IEnumerable<string>>("searchKeywords") ?? []),
        AlertList.ReadingMinutes(ReadingText(alert)));

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

    private static IEnumerable<IPublishedContent> Children(IDocumentNavigationQueryService navigation, Func<Guid, IPublishedContent?> byKey, Guid folder, string alias) =>
        navigation.TryGetChildrenKeysOfType(folder, alias, out IEnumerable<Guid> keys)
            ? keys.Select(byKey).OfType<IPublishedContent>() : [];

    /// <summary>The cua trang nhom theo luat "The trong trang nhom" (mockup bo-cac-rui-ro.html, QD-054):
    /// bai viet dang/hien them o nhom; thu doan trong bai huong dan cua nhom; canh bao co thu doan do;
    /// trang viec can lam ma cac muc tren dan toi. Ghim dau nhom truoc, roi theo loai, roi moi nhat truoc.</summary>
    public static IReadOnlyList<AlertListItem> GroupCards(IPublishedContent group, IPublishedContent site,
        IDocumentNavigationQueryService navigation, Func<Guid, IPublishedContent?> byKey)
    {
        bool InGroup(IPublishedContent x) => Picked(x, "primaryGroup").Concat(Picked(x, "alsoInCategories")).Any(g => g.Key == group.Key);
        var articles = Children(navigation, byKey, RiskStructure.ArticleFolderKey, "riskArticlePage")
            .Where(x => x.TemplateId is > 0 && InGroup(x)).ToArray();
        var guides = articles.Where(x => IsKind(x, "Bài hướng dẫn")).ToArray();
        var guideKeys = guides.Select(x => x.Key).ToHashSet();
        var allTactics = site.Descendants().Where(x => x.ContentType.Alias == "tacticItem" && !(x.HasValue("isActive") && !x.Value<bool>("isActive"))).ToArray();
        var tactics = allTactics.Where(t => Picked(t, "containingArticle").Any(a => guideKeys.Contains(a.Key))).ToArray();
        var tacticKeys = tactics.Select(x => x.Key).ToHashSet();
        var audiences = site.Descendants().Where(x => x.ContentType.Alias == "audienceItem").ToArray();
        string[] AudienceCodes(IEnumerable<Guid> tacticSet) =>
            audiences.Where(a => Picked(a, "tactics").Any(t => tacticSet.Contains(t.Key))).Select(AudienceCode).ToArray();
        string TacticLevel(IPublishedContent t) => AlertList.LevelCode(t.Value("cautionLevel") switch
        {
            string s => s, IEnumerable<string> l => l.FirstOrDefault(), _ => null
        });
        string Highest(IEnumerable<string> codes) => AlertList.Levels.Select(x => x.Code).FirstOrDefault(codes.Contains) ?? "can-than-trong";
        var alerts = Alerts(navigation, byKey).Where(a => Picked(a, "tactics").Any(t => tacticKeys.Contains(t.Key))).ToArray();
        var actions = articles.Concat(alerts).SelectMany(x => Picked(x, "actionPage"))
            .Where(x => x.TemplateId is > 0).DistinctBy(x => x.Key).ToArray();

        var cards = new List<(AlertListItem Item, bool Featured, DateTime Date)>();
        foreach (var a in alerts)
            cards.Add((Card(a), false, Date(a, "updatedDate") ?? a.UpdateDate));
        foreach (var a in articles)
        {
            string kind = IsKind(a, "Bài hướng dẫn") ? "lv" : IsKind(a, "Bài đọc chuyên đề") ? "doc" : "art";
            var own = tactics.Where(t => Picked(t, "containingArticle").Any(x => x.Key == a.Key)).ToArray();
            string text = $"{a.Value<string>("summary")} {a.Value("readingBody")} {string.Join(' ', Lines(a, "warningSigns"))} {string.Join(' ', Lines(a, "actionsNow"))}";
            int words = Regex.Matches(Plain(text), @"\S+").Count;
            string summary = a.Value<string>("description") is { Length: > 0 } d ? d : Plain(a.Value<string>("summary"));
            cards.Add((new AlertListItem(a.Url(), Title(a), summary, null, a.UpdateDate,
                kind == "lv" ? Highest(own.Select(TacticLevel)) : "can-than-trong",
                own.SelectMany(t => Picked(t, "channels")).Select(ChannelCode).Distinct().ToArray(),
                AudienceCodes(own.Select(t => t.Key)),
                string.Join(' ', a.Value<IEnumerable<string>>("searchKeywords") ?? []),
                Math.Max(1, (int)Math.Ceiling(words / 200d)), kind, kind == "lv" ? "shield" : kind == "doc" ? "icon-book" : "doc"),
                a.Value<bool>("isFeatured"), a.UpdateDate));
        }
        foreach (var t in tactics)
        {
            var article = Picked(t, "containingArticle").First(x => guideKeys.Contains(x.Key));
            string code = t.Value<string>("code") ?? "";
            var channels = Picked(t, "channels");
            // Neo #tactic-{khoa} cua trang Bai huong dan (trinh hoi Khan cap dung cung neo)
            cards.Add((new AlertListItem($"{article.Url()}#tactic-{t.Key:N}",
                t.Name, $"{Title(article)} · {string.Join(", ", channels.Select(c => c.Name))}", null, null, TacticLevel(t),
                channels.Select(ChannelCode).ToArray(), AudienceCodes([t.Key]),
                string.Join(' ', t.Value<IEnumerable<string>>("searchKeywords") ?? []), 0, "tac", "alert"), false, t.UpdateDate));
        }
        foreach (var p in actions)
        {
            cards.Add((new AlertListItem(p.Url(), Title(p), Plain(p.Value<string>("lead")), null, null, "rat-cao", [], [], "",
                0, "pb", "clock"), false, p.UpdateDate));
        }
        return cards.OrderByDescending(x => x.Featured).ThenBy(x => AlertList.KindOrder(x.Item.Kind)).ThenByDescending(x => x.Date)
            .Select(x => x.Item).ToArray();
    }

    /// <summary>Dong "dang bien soan": nhom chua co bai nao Dang o nhom la nhom nay.</summary>
    public static bool HasOwnArticles(IPublishedContent group, IDocumentNavigationQueryService navigation, Func<Guid, IPublishedContent?> byKey) =>
        Children(navigation, byKey, RiskStructure.ArticleFolderKey, "riskArticlePage")
            .Any(x => x.TemplateId is > 0 && Picked(x, "primaryGroup").Any(g => g.Key == group.Key));

    /// <summary>Doan dung chung "Bo khung nhan dien" (hien co dinh o nhom Lua dao).</summary>
    public static IPublishedContent? Snippet(IPublishedContent site, string name) =>
        site.Descendants().FirstOrDefault(x => x.ContentType.Alias == "sharedSnippet" && (x.Name == name || x.Value<string>("title") == name));

    /// <summary>Thanh 6 tab: Canh bao moi va 5 nhom, theo thu tu co dinh cua RiskStructure.</summary>
    public static IReadOnlyList<RiskTab> Tabs(Func<Guid, IPublishedContent?> byKey, string currentAlias) =>
        RiskStructure.Pages.Skip(1).OrderBy(x => x.Order).Select(page =>
        {
            var node = byKey(page.Key);
            string name = node?.Value<string>("tabName") is { Length: > 0 } tab ? tab : page.Name;
            string url = page.Alias == "alertListPage" ? AntcPublicPaths.AlertListPath : AntcPublicPaths.RiskGroupPath(page.Alias) ?? "#";
            string fallback = page.Alias switch
            {
                "alertListPage" => "mega", "luaDaoPage" => "alert", "vayVaNoPage" => "coins", "dauTuPage" => "chart",
                "duLieuCaNhanPage" => "id", _ => "shield"
            };
            return new RiskTab(url, name, page.Alias == "alertListPage" ? "mega" : IconId(node?.Value<string>("icon"), fallback), page.Alias == currentAlias);
        }).ToArray();

    /// <summary>Bai lien quan: bai huong dan chua cac thu doan, chinh cac thu doan, danh sach kiem tra cung chuyen de; toi da 4.</summary>
    public static IReadOnlyList<RiskRelatedLink> Related(IPublishedContent alert, IPublishedContent site)
    {
        var tactics = Picked(alert, "tactics");
        var guides = tactics.SelectMany(x => Picked(x, "containingArticle"))
            .Where(x => (x.Value<string>("articleKind") ?? "").Contains("Bài hướng dẫn") && x.TemplateId is > 0)
            .DistinctBy(x => x.Key).ToArray();
        var links = new List<RiskRelatedLink>();
        links.AddRange(guides.Select(x => new RiskRelatedLink(x.Url(), Title(x), "Bài hướng dẫn", "book")));
        foreach (var tactic in tactics)
        {
            var article = Picked(tactic, "containingArticle").FirstOrDefault(x => x.TemplateId is > 0);
            if (article is null) continue;
            string code = tactic.Value<string>("code") ?? "";
            string url = code.Length > 0 ? $"{article.Url()}?thu-doan={Uri.EscapeDataString(code)}" : article.Url();
            links.Add(new RiskRelatedLink(url, tactic.Name, "Thủ đoạn", "alert"));
        }
        var topics = guides.SelectMany(x => Picked(x, "topic")).Select(x => x.Key).ToHashSet();
        if (topics.Count > 0)
            links.AddRange(site.Descendants().Where(x => x.ContentType.Alias == "checklistPage" && x.TemplateId is > 0
                    && Picked(x, "sourceArticle").SelectMany(a => Picked(a, "topic")).Any(t => topics.Contains(t.Key)))
                .Select(x => new RiskRelatedLink(x.Url(), "Danh sách kiểm tra: " + Title(x), "Danh sách kiểm tra", "quiz")));
        return links.DistinctBy(x => x.Url).Take(4).ToArray();
    }
}
