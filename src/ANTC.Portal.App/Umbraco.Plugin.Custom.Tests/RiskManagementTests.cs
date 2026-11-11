using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Tests;

public partial class RiskManagementTests
{
    private static RiskNode Node(string type, string name, params (string, object?)[] values) => new(Guid.NewGuid(), null,
        type, name, 0, new DateTime(2026, 11, 4), true, values.ToDictionary(x => x.Item1, x => x.Item2));
    private static string Udi(RiskNode node) => "umb://document/" + node.Key.ToString("N");
    private readonly RuiRoDerivation _derive = new();

    [Theory]
    [InlineData(89, true)] [InlineData(90, true)] [InlineData(91, false)]
    public void Freshness_UsesInclusiveNinetyCalendarDays(int age, bool expected)
    {
        var today = new DateTime(2026, 11, 4, 23, 59, 59);
        Assert.Equal(expected, AlertFreshness.IsFresh(today.AddDays(-age), today));
    }
    [Theory]
    [InlineData(179, false)] [InlineData(180, false)] [InlineData(181, true)]
    public void AutoUnpublish_OnlyAfterConfiguredDeadline(int age, bool expected)
    {
        var today = new DateTime(2026, 11, 4);
        Assert.Equal(expected, AlertFreshness.ShouldUnpublish(today.AddDays(-age), 180, today));
    }
    [Fact]
    public void Group_FollowsPrimaryAndAdditionalGroups_Tactics_Alerts_AndActionLinks()
    {
        var group = Node("riskCategoryPage", "Lừa đảo");
        var action = Node("viecCanLamPage", "Đã chuyển tiền");
        var guide = Node("riskArticlePage", "Nhận biết", ("primaryGroup", Udi(group)), ("articleKind", "[\"Bài hướng dẫn\"]"), ("actionPage", Udi(action)));
        var extra = Node("riskArticlePage", "Đọc thêm", ("alsoInCategories", Udi(group)), ("isFeatured", 1), ("articleKind", "[\"Bài đọc thêm\"]"));
        var tactic = Node("tacticItem", "Giả danh", ("containingArticle", Udi(guide)));
        var alert = Node("alertPage", "Cảnh báo", ("tactics", Udi(tactic)));
        var result = _derive.Derive(group, [group, guide, extra, tactic, alert, action]);
        Assert.Equal([extra.Key, guide.Key], result.Articles.Select(x => x.Key));
        Assert.Equal(tactic.Key, Assert.Single(result.Tactics).Key);
        Assert.Equal(alert.Key, Assert.Single(result.Alerts).Key);
        Assert.Equal(action.Key, Assert.Single(result.Actions).Key);
        Assert.False(result.InPreparation);
    }
    [Fact]
    public void AdditionalGroupArticle_DoesNotSuppressPreparationNotice()
    {
        var group = Node("riskCategoryPage", "Vay và nợ");
        var article = Node("riskArticlePage", "Bài chung", ("alsoInCategories", Udi(group)));
        Assert.True(_derive.Derive(group, [group, article]).InPreparation);
    }
    [Fact]
    public void Guide_DerivesHighestLevel_UnionOfChannels_AndAudiencesFromReverseReferences()
    {
        var guide = Node("riskArticlePage", "Hướng dẫn", ("articleKind", "[\"Bài hướng dẫn\"]"));
        var channel = Node("channelItem", "Điện thoại");
        var t1 = Node("tacticItem", "A", ("containingArticle", Udi(guide)), ("cautionLevel", "[\"Cao\"]"), ("channels", Udi(channel)));
        var t2 = Node("tacticItem", "B", ("containingArticle", Udi(guide)), ("cautionLevel", "[\"Rất cao\"]"), ("channels", Udi(channel)));
        var audience = Node("audienceItem", "Sinh viên", ("tactics", Udi(t2)));
        var result = _derive.Derive(guide, [guide, channel, t1, t2, audience]);
        Assert.Equal("Rất cao", result.Level);
        Assert.Equal(channel.Key, Assert.Single(result.Channels).Key);
        Assert.Equal(audience.Key, Assert.Single(result.Audiences).Key);
    }
    [Fact]
    public void Tactic_TopicFollowsContainingArticle_IgnoresLegacyTopic()
    {
        var topic = Node("topicItem", "Chuyên đề 1"); var old = Node("topicItem", "Chuyên đề cũ");
        var guide = Node("riskArticlePage", "Bài", ("topic", Udi(topic)));
        var tactic = Node("tacticItem", "Thủ đoạn", ("containingArticle", Udi(guide)), ("topic", Udi(old)));
        Assert.Equal(topic.Key, _derive.Derive(tactic, [topic, old, guide, tactic]).Topic?.Key);
    }
    [Fact]
    public void Alert_RelatedItemsDeduplicateAndStopAtFour()
    {
        var guide = Node("riskArticlePage", "Bài", ("articleKind", "[\"Bài hướng dẫn\"]"));
        var tactics = Enumerable.Range(0, 5).Select(i => Node("tacticItem", "T" + i, ("containingArticle", Udi(guide)))).ToArray();
        var alert = Node("alertPage", "Cảnh báo", ("tactics", string.Join(",", tactics.Select(Udi))));
        var result = _derive.Derive(alert, [guide, alert, .. tactics]);
        Assert.Equal(4, result.Related.Count); Assert.Equal(guide.Key, result.Related[0].Key);
        Assert.Equal(4, result.Related.Select(n => n.Key).Distinct().Count());
    }
    [Fact]
    public void Series_NextFollowsListOrder_NotUpdateDate()
    {
        var first = Node("riskArticlePage", "Bài 1", ("articleKind", "[\"Bài đọc thêm\"]"), ("series", "[\"Hiểu đúng\"]")) with { Order = 3 };
        var next = Node("riskArticlePage", "Bài 2", ("articleKind", "[\"Bài đọc thêm\"]"), ("series", "[\"Hiểu đúng\"]")) with { Order = 4, Updated = new DateTime(2020, 1, 1) };
        var result = _derive.Derive(first, [next, first]);
        Assert.Equal(next.Key, result.Next?.Key); Assert.Equal(1, result.SeriesPosition); Assert.Equal(2, result.SeriesCount);
    }
    [Fact]
    public void TopicReadingInvitation_UsesActualQuestionCount_AndKeepsAuthoredDescription()
    {
        var topic = Node("topicItem", "Chuyên đề", ("topicNumber", 7));
        var article = Node("riskArticlePage", "Bài", ("topic", Udi(topic)), ("articleKind", "[\"Bài đọc chuyên đề\"]"));
        Assert.Equal("Đọc khoảng 1 phút. Đọc xong rồi hãy làm 24 câu của Chuyên đề 7.", _derive.Derive(article, [topic, article], 24).Invitation);
        article = article with { Values = new Dictionary<string, object?>(article.Values) { ["description"] = "Câu do biên tập viên viết" } };
        Assert.Equal("Câu do biên tập viên viết", _derive.Derive(article, [topic, article], 24).Invitation);
    }
    [Fact]
    public void ChecklistAndActionLinks_ProvideSharedSourceNodes()
    {
        var topic = Node("topicItem", "Chuyên đề", ("rememberLine", "Nhớ một câu"), ("mustAsk", "Hỏi ai?"), ("stopWhen", "Khi bị giục"));
        var action = Node("viecCanLamPage", "Đã lỡ", ("steps", "[{\"mainText\":\"Gọi ngân hàng\"}]"));
        var article = Node("riskArticlePage", "Bài", ("topic", Udi(topic)), ("actionPage", Udi(action)));
        var checklist = Node("checklistPage", "Kiểm tra", ("sourceArticle", Udi(article)), ("stopNow", "Dừng chuyển tiền"));
        var result = _derive.Derive(article, [topic, action, article, checklist]);
        Assert.Equal("Nhớ một câu", result.Topic?.Text("rememberLine"));
        Assert.Equal("Dừng chuyển tiền", result.Checklist?.Text("stopNow"));
        Assert.Equal(action.Key, Assert.Single(result.Actions).Key);
    }
    [Theory]
    [InlineData("Bài hướng dẫn", true)] [InlineData("Bài đọc thêm", false)] [InlineData("Bài đọc chuyên đề", false)]
    public void OnlyGuidesRequireWarningSignsAndImmediateActions(string kind, bool required)
    {
        var article = Node("riskArticlePage", "Bài", ("articleKind", new[] { kind }));
        var errors = RiskContentRules.Validate(article);
        Assert.Equal(required, errors.Any(x => x.Contains("dấu hiệu cảnh báo")));
        Assert.Equal(required, errors.Any(x => x.Contains("việc cần làm ngay")));
    }
    [Theory]
    [InlineData("Một, hai.\nBa, bốn.\nNăm, sáu, bảy.\nTám.", false)]
    [InlineData("[\"Một, hai.\",\"Ba, bốn.\",\"Năm.\"]", false)]
    [InlineData("Một.\nHai.", true)]
    [InlineData("1\n2\n3\n4\n5\n6", true)]
    public void AlertSteps_AreCountedByLine_NotByComma(string steps, bool rejected)
    {
        var alert = Node("alertPage", "Cảnh báo", ("scenarioSteps", steps));
        Assert.Equal(rejected, RiskContentRules.Validate(alert).Any(x => x.Contains("3–5 bước")));
    }
    [Fact]
    public void EmptyRichTextMarkup_DoesNotPassPublishValidation()
    {
        var article = Node("riskArticlePage", "Bài", ("summary", "{\"markup\":\"<p>&nbsp;</p>\",\"blocks\":{}}"));
        Assert.Contains(RiskContentRules.Validate(article), x => x.Contains("tóm tắt"));
    }
    [Fact]
    public void DraftEditorReferencesAndStoredUdisResolveToTheSameGroup()
    {
        var group = Node("riskCategoryPage", "Lừa đảo");
        using var json = System.Text.Json.JsonDocument.Parse("[{\"type\":\"content\",\"unique\":\"" + group.Key + "\"}]");
        var article = Node("riskArticlePage", "Bản đang sửa", ("primaryGroup", json.RootElement.Clone()));
        Assert.Equal(group.Key, Assert.Single(_derive.Derive(group, [group, article]).Articles).Refs("primaryGroup")[0]);
    }
    [Fact]
    public void RiskSchema_HasNoManualDerivedFields_AndFixedPagesHaveNoCollection()
    {
        var types = RiskSchema.ContentTypes().ToDictionary(x => x.Alias);
        Assert.All(RiskSchema.PageAliases, alias => Assert.Null(types[alias].ListViewDataType));
        Assert.DoesNotContain("riskCategoryPage", types.Keys);
        Assert.All(RiskStructure.GroupAliases, alias => Assert.DoesNotContain(types[alias].Properties, x => x.Alias is "tactics" or "pinnedArticles" or "noAnswerNote"));
        Assert.DoesNotContain(types["riskArticlePage"].Properties, x => x.Alias is "cautionLevel" or "channels" or "audiences" or "relatedItems" or "checklist" or "version");
        Assert.DoesNotContain(types["alertPage"].Properties, x => x.Alias is "relatedItems" or "alsoInCategories");
    }
    [Fact]
    public void CanonicalRiskPages_KeepAnVu29KeysAndDistinctGroupTypes()
    {
        Assert.Equal(Guid.Parse("2f0dfb61-9591-4d14-970a-6be6f7d4b28c"), RiskStructure.Pages[0].Key);
        Assert.Equal(7, RiskStructure.Pages.Select(p => p.Key).Distinct().Count());
        Assert.Equal(5, RiskStructure.GroupAliases.Length);
        Assert.All(RiskStructure.GroupAliases, alias => Assert.Equal("riskCategoryPage", RiskStructure.LogicalAlias(alias)));
        Assert.All(RiskStructure.Pages, page => Assert.NotEqual(Umbraco.Plugin.Custom.Core.PortalV2.PortalV2Keys.Node(page.MockupId), page.Key));
    }
    [Fact]
    public void Adoption_RewritesBothNativeUdisAndGuidJson_WithoutChangingOtherData()
    {
        var page = RiskStructure.Pages.Single(p => p.Alias == "luaDaoPage");
        var old = Umbraco.Plugin.Custom.Core.PortalV2.PortalV2Keys.Node(page.MockupId);
        var mapping = new Dictionary<Guid, Guid> { [old] = page.Key };
        string input = $"umb://document/{old:N},{{\"unique\":\"{old.ToString().ToUpperInvariant()}\"}},Tiền · money";
        string result = RiskStructureAdoption.RewriteReferences(input, mapping);
        Assert.Contains("umb://document/" + page.Key.ToString("N"), result);
        Assert.Contains("\"unique\":\"" + page.Key + "\"", result);
        Assert.Contains("Tiền · money", result);
        Assert.Equal(result, RiskStructureAdoption.RewriteReferences(result, mapping));
    }

    // ---------- Phan website (review 10/11/2026, WEB-01, WEB-05/06, WEB-12)
    [Fact]
    public void InactiveTactics_AreLeftOutOfGroupAndGuide()
    {
        var group = Node("riskCategoryPage", "Lừa đảo");
        var guide = Node("riskArticlePage", "Hướng dẫn", ("primaryGroup", Udi(group)), ("articleKind", "[\"Bài hướng dẫn\"]"));
        var active = Node("tacticItem", "Đang dùng", ("containingArticle", Udi(guide)), ("isActive", "1"));
        var stopped = Node("tacticItem", "Ngừng dùng", ("containingArticle", Udi(guide)), ("isActive", "0"));
        var legacy = Node("tacticItem", "Chưa có ô Đang dùng", ("containingArticle", Udi(guide)));
        var nodes = new[] { group, guide, active, stopped, legacy };
        Assert.Equal(new[] { active.Key, legacy.Key }.Order(), _derive.Derive(group, nodes).Tactics.Select(x => x.Key).Order());
        Assert.DoesNotContain(_derive.Derive(guide, nodes).Tactics, x => x.Key == stopped.Key);
    }

    [Fact]
    public void ReadingMinutes_UseTheSharedV2Formula()
    {
        // 250 tu: cong thuc cu (200 tu/phut, lam tron len) cho 2 phut; ban dung v2 (180 tu/phut, lam tron) cho 1 phut.
        var article = Node("riskArticlePage", "Bài", ("summary", string.Join(' ', Enumerable.Repeat("chữ", 250))));
        Assert.Equal(AlertList.ReadingMinutes(string.Join(' ', Enumerable.Repeat("chữ", 250))), _derive.Derive(article, [article]).ReadingMinutes);
        Assert.Equal(1, _derive.Derive(article, [article]).ReadingMinutes);
    }

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    [Fact]
    public void Today_IsVietnamDate_NotServerDate()
    {
        // 23:30 UTC ngay 4/11 da la 06:30 ngay 5/11 o Viet Nam.
        Assert.Equal(new DateTime(2026, 11, 5), AlertFreshness.Today(new FixedClock(new DateTimeOffset(2026, 11, 4, 23, 30, 0, TimeSpan.Zero))));
        Assert.Equal(new DateTime(2026, 11, 4), AlertFreshness.Today(new FixedClock(new DateTimeOffset(2026, 11, 4, 16, 59, 0, TimeSpan.Zero))));
    }

    [Fact]
    public void EditorHtml_IsSanitizedBeforeOutput()
    {
        var clean = new Umbraco.Plugin.Custom.Core.Articles.ArticleHtmlSanitizer()
            .Clean("<p>Tóm tắt <strong>đậm</strong><script>alert(1)</script><img src=\"x\" onerror=\"alert(2)\"></p>");
        Assert.Contains("<strong>đậm</strong>", clean);
        Assert.DoesNotContain("<script", clean);
        Assert.DoesNotContain("onerror", clean);
    }
}
