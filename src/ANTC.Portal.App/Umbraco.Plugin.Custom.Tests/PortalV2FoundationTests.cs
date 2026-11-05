using System.Text.Json;
using System.Text.Json.Nodes;
using Umbraco.Plugin.Custom.Core.PortalV2;
using Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;
using Umbraco.Plugin.Custom.Core.PortalV2.Editors;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Tests;

public class PortalV2FoundationTests
{
    private static JsonDocument Seed()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "docs", "ban-giao", "PORTAL-V2", "cong-cu", "seed-portal-v2.json")))
            dir = dir.Parent;
        Assert.NotNull(dir);
        return JsonDocument.Parse(File.ReadAllText(Path.Combine(dir!.FullName, "docs", "ban-giao", "PORTAL-V2", "cong-cu", "seed-portal-v2.json")));
    }

    [Fact]
    public void Keys_MatchSeedGeneratedByJavascript()
    {
        Assert.Equal(Guid.Parse("620db892-e73b-564c-9553-7c6185e1e04a"), PortalV2Keys.Node("wizard"));
        using JsonDocument seed = Seed();
        foreach (JsonElement node in seed.RootElement.GetProperty("nodes").EnumerateArray())
            Assert.Equal(node.GetProperty("key").GetGuid(), PortalV2Keys.Node(node.GetProperty("mockupId").GetString()!));
    }

    [Fact]
    public void FixedLists_MatchSeedCodesAndLabels()
    {
        using JsonDocument seed = Seed();
        foreach (JsonProperty list in seed.RootElement.GetProperty("fixedLists").EnumerateObject())
        {
            DanhSachCoDinh? mine = DanhMucCoDinh.All.SingleOrDefault(x => x.DataTypeName == list.Name);
            Assert.NotNull(mine);
            var seedItems = list.Value.EnumerateArray().Select(x => (x.GetProperty("code").GetString(), x.GetProperty("label").GetString())).ToArray();
            Assert.Equal(seedItems, mine!.Items.Select(x => ((string?)x.Code, (string?)x.Label)).ToArray());
        }
        var seedNames = seed.RootElement.GetProperty("fixedLists").EnumerateObject().Select(x => x.Name).ToHashSet();
        Assert.All(DanhMucCoDinh.All, list => Assert.Contains(list.DataTypeName, seedNames));
        Assert.All(DanhMucCoDinh.Retired, name => Assert.DoesNotContain(name, seedNames));
    }

    [Fact]
    public void Schema_PropertiesUseDeclaredDataTypes_AndNamesAreUnique()
    {
        var names = PortalV2Schema.AllDataTypes().Select(x => x.Name).ToList();
        Assert.Equal(names.Count, names.Distinct().Count());
        foreach (ContentTypeSpec type in PortalV2Schema.AllContentTypes())
        {
            foreach (PropertySpec p in type.Properties) Assert.Contains(p.DataTypeName, names);
            foreach (string c in type.Compositions ?? []) Assert.Contains(PortalV2Schema.Compositions(), x => x.Alias == c);
            if (type.ListViewDataType is { } lv) Assert.Contains(lv, names);
        }
    }

    private static readonly InlineListConfiguration Hotlines = new()
    {
        MinRows = 1, MaxRows = 3,
        Fields =
        [
            new() { Alias = "number", Label = "Số", Type = "text", Required = true, Pattern = "^\\d{3,6}$", PatternMessage = "Chỉ gồm chữ số, 3–6 số." },
            new() { Alias = "contactMode", Label = "Hình thức", Type = "fixed", List = "hinhThucLienHe", Required = true },
            new() { Alias = "description", Label = "Mô tả", Type = "area", Required = true, MaxChars = 20 },
            new() { Alias = "page", Label = "Trang", Type = "content" },
            new() { Alias = "options", Label = "Lựa chọn", Type = "table", MinRows = 1, Required = true,
                ShowWhen = new() { Field = "contactMode", EqualsValue = "nhanTin" },
                Fields = [new() { Alias = "text", Label = "Câu", Type = "text", Required = true }] },
        ],
    };

    private static string Row(string extra = "") => "{\"key\":\"" + Guid.NewGuid() + "\",\"number\":\"113\",\"contactMode\":\"goi\",\"description\":\"Công an\"" + extra + "}";

    [Fact]
    public void InlineList_ValidValue_HasNoErrors()
        => Assert.Empty(InlineListRules.Validate(JsonNode.Parse("[" + Row() + "]"), Hotlines));

    [Fact]
    public void InlineList_ReportsRowCountRequiredPatternListAndLength()
    {
        Assert.Contains(InlineListRules.Validate(null, Hotlines), e => e.Message.Contains("ít nhất 1"));
        Assert.Contains(InlineListRules.Validate(JsonNode.Parse("[" + string.Join(",", Enumerable.Repeat(Row(), 4)) + "]"), Hotlines), e => e.Message.StartsWith("Tối đa 3 dòng"));
        var errors = InlineListRules.Validate(JsonNode.Parse("[{\"key\":\"" + Guid.NewGuid() + "\",\"number\":\"12a\",\"contactMode\":\"fax\",\"description\":\"" + new string('x', 25) + "\"}]"), Hotlines);
        Assert.Contains(errors, e => e.Path == "[0].number" && e.Message == "Chỉ gồm chữ số, 3–6 số.");
        Assert.Contains(errors, e => e.Path == "[0].contactMode");
        Assert.Contains(errors, e => e.Path == "[0].description" && e.Message.StartsWith("Tối đa 20 ký tự"));
        Assert.Contains(InlineListRules.Validate(JsonNode.Parse("[{\"number\":\"113\",\"contactMode\":\"goi\",\"description\":\"a\"}]"), Hotlines), e => e.Path == "[0].key");
    }

    [Fact]
    public void InlineList_HiddenFieldIsNotRequired_VisibleNestedTableIsChecked()
    {
        Assert.Empty(InlineListRules.Validate(JsonNode.Parse("[" + Row() + "]"), Hotlines));
        string nhanTin = "[{\"key\":\"" + Guid.NewGuid() + "\",\"number\":\"5656\",\"contactMode\":\"nhanTin\",\"description\":\"a\"}]";
        Assert.Contains(InlineListRules.Validate(JsonNode.Parse(nhanTin), Hotlines), e => e.Path == "[0].options" && e.Message == "Vui lòng nhập lựa chọn.");
        string badNested = nhanTin.Replace("\"description\":\"a\"", "\"description\":\"a\",\"options\":[{\"key\":\"" + Guid.NewGuid() + "\"}]");
        Assert.Contains(InlineListRules.Validate(JsonNode.Parse(badNested), Hotlines), e => e.Path == "[0].options[0].text");
    }

    [Fact]
    public void InlineList_ContentMustBeDocumentUdi_AndReferencesIgnoreRowKeys()
    {
        Guid page = Guid.NewGuid();
        Assert.Contains(InlineListRules.Validate(JsonNode.Parse("[" + Row(",\"page\":\"" + page + "\"") + "]"), Hotlines), e => e.Path == "[0].page");
        string udi = "umb://document/" + page.ToString("N");
        JsonNode value = JsonNode.Parse("[" + Row(",\"page\":\"" + udi + "\",\"options\":[{\"key\":\"" + Guid.NewGuid() + "\",\"target\":\"" + udi + "\"}]") + "]")!;
        Assert.Empty(InlineListRules.Validate(value, Hotlines));
        var refs = InlineListJson.DocumentUdis(value).ToList();
        Assert.Equal(2, refs.Count);
        Assert.All(refs, r => Assert.Equal(page, r.Guid));
        InlineListRow row = InlineListValue.From(value)[0];
        Assert.Equal(page, row.GetKey("page"));
        Assert.Equal("goi", row.GetCode("contactMode"));
        Assert.Single(row.GetRows("options"));
    }

    [Fact]
    public void QuickQa_SchemaAndAssets_AreConfigured()
    {
        var quickQa = PortalV2Schema.LibraryItems().FirstOrDefault(x => x.Alias == "quickQaItem");
        Assert.NotNull(quickQa);
        var propAliases = quickQa!.Properties.Select(p => p.Alias).ToList();
        Assert.Contains("question", propAliases);
        Assert.Contains("shortAnswer", propAliases);
        Assert.Contains("reason", propAliases);
        Assert.Contains("actions", propAliases);
        Assert.Contains("relatedPages", propAliases);
        Assert.Contains("approvedBy", propAliases);

        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "src", "ANTC.Portal.App", "Umbraco.Web.UI", "Views", "hoiDapPage.cshtml")))
            dir = dir.Parent;
        Assert.NotNull(dir);

        string viewPath = Path.Combine(dir!.FullName, "src", "ANTC.Portal.App", "Umbraco.Web.UI", "Views", "hoiDapPage.cshtml");
        string cssPath = Path.Combine(dir.FullName, "src", "ANTC.Portal.App", "Umbraco.Web.UI", "wwwroot", "assets", "css", "qa-portal.css");
        string jsPath = Path.Combine(dir.FullName, "src", "ANTC.Portal.App", "Umbraco.Web.UI", "wwwroot", "assets", "js", "qa-portal.js");

        Assert.True(File.Exists(viewPath), "hoiDapPage.cshtml must exist");
        Assert.True(File.Exists(cssPath), "qa-portal.css must exist");
        Assert.True(File.Exists(jsPath), "qa-portal.js must exist");

        string viewContent = File.ReadAllText(viewPath);
        Assert.Contains("qa-portal.css", viewContent);
        Assert.Contains("qa-portal.js", viewContent);
        Assert.Contains("quickQaItem", viewContent);
        Assert.Contains("data-form=\"ask\"", viewContent);
        Assert.Contains("qa-sent", viewContent);
    }

    [Fact]
    public void HoiDap_BlockGrid_LayoutAndComponents_AreAlignedWithOutsidePortal()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "src", "ANTC.Portal.App", "Umbraco.Web.UI", "Views", "hoiDapPage.cshtml")))
            dir = dir.Parent;
        Assert.NotNull(dir);

        var uSyncDir = Path.Combine(dir!.FullName, "src", "ANTC.Portal.App", "Umbraco.Web.UI", "uSync", "v18");
        var viewsDir = Path.Combine(dir.FullName, "src", "ANTC.Portal.App", "Umbraco.Web.UI", "Views");

        // 1. qaHeroBlock has image property
        var heroConfig = File.ReadAllText(Path.Combine(uSyncDir, "ContentTypes", "qaheroblock.config"));
        Assert.Contains("<Alias>image</Alias>", heroConfig);
        Assert.Contains("89e3ef2d-532a-5d5c-947e-8aa017dbf46f", heroConfig); // Chon anh

        // 2. qaHeroBlock.cshtml renders image and portal header
        var heroView = File.ReadAllText(Path.Combine(viewsDir, "Partials", "blockgrid", "Components", "qaHeroBlock.cshtml"));
        Assert.Contains("heroImage", heroView);
        Assert.Contains("pageh", heroView);
        Assert.Contains("btn red sm", heroView);

        // 3. qaPublishedAnswersBlock is 'Khối hỏi – đáp nhanh' and queries CMS
        var qaAnsConfig = File.ReadAllText(Path.Combine(uSyncDir, "ContentTypes", "qapublishedanswersblock.config"));
        Assert.Contains("Khối hỏi – đáp nhanh", qaAnsConfig);

        var qaAnsView = File.ReadAllText(Path.Combine(viewsDir, "Partials", "blockgrid", "Components", "qaPublishedAnswersBlock.cshtml"));
        Assert.Contains("quickQaItem", qaAnsView);
        Assert.Contains("qalist", qaAnsView);
        Assert.Contains("qaq", qaAnsView);

        // 4. qaSubmissionBlock has contactHint, publishLabel and handles form
        var subConfig = File.ReadAllText(Path.Combine(uSyncDir, "ContentTypes", "qasubmissionblock.config"));
        Assert.Contains("<Alias>contactHint</Alias>", subConfig);
        Assert.Contains("<Alias>publishLabel</Alias>", subConfig);

        var subView = File.ReadAllText(Path.Combine(viewsDir, "Partials", "blockgrid", "Components", "qaSubmissionBlock.cshtml"));
        Assert.Contains("data-form=\"ask\"", subView);
        Assert.Contains("qa-sent", subView);

        // 5. BoCucHoiDapBlockGrid has 'Hỏi – đáp nhanh' block
        var bgConfig = File.ReadAllText(Path.Combine(uSyncDir, "DataTypes", "BoCucHoiDapBlockGrid.config"));
        Assert.Contains("Hỏi – đáp nhanh", bgConfig);

        // 6. Content hỏi-đáp.config has block grid order: Hero -> PublishedAnswers -> Process -> Submission -> Guidelines
        var contentConfig = File.ReadAllText(Path.Combine(uSyncDir, "Content", "hỏi-đáp.config"));
        var heroIdx = contentConfig.IndexOf("0d7dcbf1-7171-5323-a36c-1a4494965e72", StringComparison.Ordinal);
        var fastQaIdx = contentConfig.IndexOf("46fb6b08-4e10-5deb-a8ae-f1b44d68b7ba", StringComparison.Ordinal);
        var processIdx = contentConfig.IndexOf("04c920c9-cd55-505a-a5a7-d702726947dd", StringComparison.Ordinal);
        var subIdx = contentConfig.IndexOf("8458c717-71a3-5f4f-ad3a-1c36515a7d7d", StringComparison.Ordinal);

        Assert.True(heroIdx < fastQaIdx, "Hero should be before Fast QA");
        Assert.True(fastQaIdx < processIdx, "Fast QA should be before Process");
        Assert.True(processIdx < subIdx, "Process should be before Submission");
    }
}
