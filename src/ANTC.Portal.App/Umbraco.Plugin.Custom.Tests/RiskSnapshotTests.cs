using System.Reflection;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Strings;
using Umbraco.Plugin.Custom.Core.Articles;
using Umbraco.Plugin.Custom.Core.PortalV2;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;
using Umbraco.Web.UI.Models;

namespace Umbraco.Plugin.Custom.Tests;

public class RiskSnapshotTests
{
    private static RiskNode Node(Guid? parentKey, string type, string name, int order, bool published = true) =>
        new(Guid.NewGuid(), parentKey, type, name, order, new DateTime(2026, 11, 10), published,
            new Dictionary<string, object?>());

    private static IPublishedContent Content(Guid key)
    {
        var proxy = DispatchProxy.Create<IPublishedContent, PublishedProxy>();
        ((PublishedProxy)(object)proxy).Key = key;
        return proxy;
    }

    public class PublishedProxy : DispatchProxy
    {
        public Guid Key { get; set; }

        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args) => targetMethod?.Name switch
        {
            "get_Key" => Key,
            _ => throw new NotSupportedException(targetMethod?.Name)
        };
    }

    [Fact]
    public void Read_filters_by_published_and_source_folder_preserving_order()
    {
        var group = RiskStructure.Pages.Skip(2).First();
        var groupNode = new RiskNode(group.Key, null, RiskStructure.LogicalAlias(group.Alias), group.Name, 99,
            new DateTime(2026, 11, 10), true, new Dictionary<string, object?>());

        var a2 = Node(RiskStructure.ArticleFolderKey, "riskArticlePage", "Bai 2", 2);
        var a1 = Node(RiskStructure.ArticleFolderKey, "riskArticlePage", "Bai 1", 1);
        var draft = Node(RiskStructure.ArticleFolderKey, "riskArticlePage", "Nhap", 0, published: false);
        var wrongFolder = Node(Guid.NewGuid(), "riskArticlePage", "Ngoai thu muc", 0);
        var alertNullParent = Node(null, "alertPage", "Canh bao", 0);

        var map = new Dictionary<Guid, IPublishedContent>
        {
            [group.Key] = Content(group.Key),
            [a1.Key] = Content(a1.Key),
            [a2.Key] = Content(a2.Key),
            [draft.Key] = Content(draft.Key),
            [wrongFolder.Key] = Content(wrongFolder.Key),
            [alertNullParent.Key] = Content(alertNullParent.Key)
        };

        var snapshot = RiskSnapshot.Read([groupNode, a2, a1, draft, wrongFolder, alertNullParent],
            key => map.GetValueOrDefault(key),
            key => key == alertNullParent.Key ? RiskStructure.AlertFolderKey : null);

        Assert.Equal([a1.Key, a2.Key], snapshot.Of("riskArticlePage").Select(x => x.Key).ToArray());
        Assert.Equal(alertNullParent.Key, Assert.Single(snapshot.Of("alertPage")).Key);
        Assert.Equal(group.Order, snapshot.Node(group.Key)?.Order);
        Assert.Null(snapshot.Node(draft.Key));
        Assert.Null(snapshot.Node(wrongFolder.Key));
    }

    [Fact]
    public void FixedText_reads_site_settings_and_falls_back_when_blank()
    {
        var customSettings = PublishedContentTestHelper.Content("siteSettings", "Cài đặt",
            values:
            [
                ("noAnswerNote", "  Hỏi thêm ở đây  "),
                ("noAdviceNote", "  Miễn trừ riêng  "),
                ("mustRemember", new[] { "Điều một", "Điều hai" }),
                ("sampleNote", "  Lưu ý thử  "),
                ("holdNote", "  Tạm hoãn  ")
            ]);

        var custom = RiskAlertContent.FixedText([customSettings]);
        Assert.Equal("Hỏi thêm ở đây", custom.NoAnswer);
        Assert.Equal("Miễn trừ riêng", custom.NoAdvice);
        Assert.Equal(["Điều một", "Điều hai"], custom.MustRemember);
        Assert.Equal("Lưu ý thử", custom.Sample);
        Assert.Equal("Tạm hoãn", custom.Hold);

        var blankSettings = PublishedContentTestHelper.Content("siteSettings", "Trống",
            values: [("noAnswerNote", "   "), ("mustRemember", Array.Empty<string>())]);
        var fallback = RiskAlertContent.FixedText([blankSettings]);
        Assert.Equal(RiskAlertContent.NoAnswerNote, fallback.NoAnswer);
        Assert.Equal(RiskAlertContent.NoAdvice, fallback.NoAdvice);
        Assert.Equal(RiskAlertContent.MustRemember, fallback.MustRemember);
        Assert.Equal(RiskAlertContent.SampleNote, fallback.Sample);
        Assert.Equal(RiskAlertContent.HoldNote, fallback.Hold);
    }

    [Fact]
    public void AudienceCode_prefers_code_property_and_falls_back_to_slug()
    {
        var coded = PublishedContentTestHelper.Content("audienceItem", "Chủ hộ kinh doanh mới",
            values: [("code", "  ho-kinh-doanh  ")]);
        var uncoded = PublishedContentTestHelper.Content("audienceItem", "Người cao tuổi");

        Assert.Equal("ho-kinh-doanh", RiskAlertContent.AudienceCode(coded));
        Assert.Equal("nguoi-cao-tuoi", RiskAlertContent.AudienceCode(uncoded));
    }

    [Fact]
    public void SignHtml_sanitizes_xss_payloads_and_unwraps_single_paragraph()
    {
        var sign = PublishedContentTestHelper.Content("riskSign", "Dấu hiệu",
            values: [("signText", new HtmlEncodedString("<p>Không lộ <strong>mã OTP</strong><script>alert(1)</script><img src=\"javascript:alert(2)\" onerror=\"alert(3)\" alt=\"x\"></p>"))]);

        string rendered = RiskAlertContent.SignHtml(sign, new ArticleHtmlSanitizer()).ToString()!;
        Assert.Contains("Không lộ <strong>mã OTP</strong>", rendered);
        Assert.DoesNotContain("<script", rendered);
        Assert.DoesNotContain("onerror", rendered);
        Assert.DoesNotContain("javascript:", rendered);
        Assert.False(rendered.StartsWith("<p>", StringComparison.Ordinal));
    }

    [Fact]
    public void Group_and_related_match_RuiRoDerivation_with_tactic_query_and_anchor()
    {
        static string Udi(Guid key) => "umb://document/" + key.ToString("N");
        var urls = new Dictionary<Guid, string>();

        var luaDao = RiskStructure.Pages.First(x => x.Alias == "luaDaoPage");
        var vayNo = RiskStructure.Pages.First(x => x.Alias == "vayVaNoPage");
        var chPhone = PublishedContentTestHelper.Content("channelItem", "Điện thoại",
            values: [("code", "dien-thoai"), ("isActive", true)]);
        var guideKey = Guid.NewGuid();
        var tacticKey = Guid.NewGuid();
        var hiddenTacticKey = Guid.NewGuid();
        var audKey = Guid.NewGuid();
        var alertKey = Guid.NewGuid();

        string guideUrl = "/cac-rui-ro/lua-dao/cuoc-goi-gia-mao/";
        string alertUrl = "/cac-rui-ro/canh-bao-moi/canh-bao-gia-cong-an/";
        urls[guideKey] = guideUrl;
        urls[alertKey] = alertUrl;

        string words360 = string.Join(' ', Enumerable.Repeat("chu", 360));
        var guide = PublishedContentTestHelper.Content("riskArticlePage", "Cuộc gọi giả mạo", key: guideKey,
            url: guideUrl, values:
            [
                ("title", "Cuộc gọi, tin nhắn giả mạo"),
                ("primaryGroup", Udi(luaDao.Key)),
                ("alsoInCategories", Udi(vayNo.Key)),
                ("articleKind", new[] { "Bài hướng dẫn" }),
                ("readingBody", $"<p>{words360}</p>"),
                ("isFeatured", true),
                ("searchKeywords", new[] { "cong-an" })
            ]);
        var tactic = PublishedContentTestHelper.Content("tacticItem", "Giả danh công an", key: tacticKey,
            values: [("code", "gia-cong-an"), ("cautionLevel", "Rất cao"), ("channels", chPhone), ("isActive", true)]);
        var hiddenTactic = PublishedContentTestHelper.Content("tacticItem", "Thủ đoạn ẩn", key: hiddenTacticKey,
            values: [("code", "bi-an"), ("isActive", false)]);
        var audience = PublishedContentTestHelper.Content("audienceItem", "Người cao tuổi", key: audKey,
            values: [("code", "nguoi-cao-tuoi"), ("isActive", true)]);
        var alert = PublishedContentTestHelper.Content("alertPage", "Cảnh báo giả công an", key: alertKey,
            url: alertUrl, values:
            [
                ("title", "Cảnh báo giả công an"),
                ("description", "Mô tả cảnh báo"),
                ("cautionLevel", "Rất cao"),
                ("updatedDate", new DateTime(2026, 11, 8)),
                ("channels", chPhone),
                ("audiences", audience)
            ]);

        var luaDaoContent = PublishedContentTestHelper.Content(luaDao.Alias, luaDao.Name, key: luaDao.Key);
        var vayNoContent = PublishedContentTestHelper.Content(vayNo.Alias, vayNo.Name, key: vayNo.Key);

        var nodes = new[]
        {
            new RiskNode(luaDao.Key, null, "riskCategoryPage", luaDao.Name, luaDao.Order, new DateTime(2026, 11, 10), true, new Dictionary<string, object?>()),
            new RiskNode(vayNo.Key, null, "riskCategoryPage", vayNo.Name, vayNo.Order, new DateTime(2026, 11, 10), true, new Dictionary<string, object?>()),
            new RiskNode(RiskStructure.ArticleFolderKey, null, "articleFolder", "Bài viết", 0, new DateTime(2026, 11, 10), true, new Dictionary<string, object?>()),
            new RiskNode(guideKey, RiskStructure.ArticleFolderKey, "riskArticlePage", guide.Name, 0, new DateTime(2026, 11, 9), true,
                new Dictionary<string, object?> { ["primaryGroup"] = Udi(luaDao.Key), ["alsoInCategories"] = Udi(vayNo.Key), ["articleKind"] = new[] { "Bài hướng dẫn" }, ["readingBody"] = $"<p>{words360}</p>", ["isFeatured"] = "1" }),
            new RiskNode(tacticKey, PortalV2Keys.Node("f-tac"), "tacticItem", tactic.Name, 0, new DateTime(2026, 11, 8), true,
                new Dictionary<string, object?> { ["code"] = "gia-cong-an", ["containingArticle"] = Udi(guideKey), ["cautionLevel"] = "[\"Rất cao\"]", ["channels"] = Udi(chPhone.Key), ["isActive"] = "1" }),
            new RiskNode(hiddenTacticKey, PortalV2Keys.Node("f-tac"), "tacticItem", hiddenTactic.Name, 1, new DateTime(2026, 11, 8), true,
                new Dictionary<string, object?> { ["code"] = "bi-an", ["containingArticle"] = Udi(guideKey), ["isActive"] = "0" }),
            new RiskNode(chPhone.Key, PortalV2Keys.Node("f-ch"), "channelItem", chPhone.Name, 0, new DateTime(2026, 11, 8), true,
                new Dictionary<string, object?> { ["code"] = "dien-thoai", ["isActive"] = "1" }),
            new RiskNode(audKey, PortalV2Keys.Node("f-aud"), "audienceItem", audience.Name, 0, new DateTime(2026, 11, 8), true,
                new Dictionary<string, object?> { ["code"] = "nguoi-cao-tuoi", ["tactics"] = Udi(tacticKey), ["isActive"] = "1" }),
            new RiskNode(alertKey, RiskStructure.AlertFolderKey, "alertPage", alert.Name, 0, new DateTime(2026, 11, 8), true,
                new Dictionary<string, object?> { ["tactics"] = Udi(tacticKey), ["cautionLevel"] = "Rất cao" })
        };

        var map = new Dictionary<Guid, IPublishedContent>
        {
            [luaDao.Key] = luaDaoContent,
            [vayNo.Key] = vayNoContent,
            [guideKey] = guide,
            [tacticKey] = tactic,
            [hiddenTacticKey] = hiddenTactic,
            [chPhone.Key] = chPhone,
            [audKey] = audience,
            [alertKey] = alert
        };

        var snapshot = RiskSnapshot.Read(nodes, key => map.GetValueOrDefault(key));
        var derivation = new RuiRoDerivation();
        string UrlOf(IPublishedContent x) => urls.GetValueOrDefault(x.Key, "/");

        var derivedLuaDao = derivation.Derive(snapshot.Node(luaDao.Key)!, snapshot.Nodes);
        var groupLuaDao = RiskAlertContent.Group(luaDaoContent, snapshot, derivation, UrlOf);
        Assert.Equal(derivedLuaDao.InPreparation, groupLuaDao.InPreparation);
        Assert.False(groupLuaDao.InPreparation);

        var guideCard = Assert.Single(groupLuaDao.Cards, c => c.Kind == "lv");
        Assert.Equal(guideUrl, guideCard.Url);
        Assert.Equal(2, guideCard.Minutes);
        Assert.Equal("rat-cao", guideCard.Level);
        Assert.Contains("dien-thoai", guideCard.Channels);
        Assert.Contains("nguoi-cao-tuoi", guideCard.Audiences);

        var tacticCard = Assert.Single(groupLuaDao.Cards, c => c.Kind == "tac");
        Assert.Equal($"{guideUrl}?thu-doan=gia-cong-an#tactic-{tacticKey:N}", tacticCard.Url);
        Assert.DoesNotContain(groupLuaDao.Cards, c => c.Title == hiddenTactic.Name);

        var groupVayNo = RiskAlertContent.Group(vayNoContent, snapshot, derivation, UrlOf);
        Assert.True(groupVayNo.InPreparation);
        Assert.Contains(groupVayNo.Cards, c => c.Url == guideUrl);

        var related = RiskAlertContent.Related(alert, snapshot, derivation, UrlOf);
        Assert.Equal([guideUrl, $"{guideUrl}?thu-doan=gia-cong-an#tactic-{tacticKey:N}"],
            related.Select(r => r.Url).ToArray());
    }
}
