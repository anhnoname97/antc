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
}
