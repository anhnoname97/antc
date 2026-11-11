using System.Text.Json;
using System.Text.Json.Nodes;
using Umbraco.Plugin.Custom.Core.Content;
using Umbraco.Plugin.Custom.Core.PortalV2.Editors;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class SituationConfigurationTests
{
    [Theory]
    [InlineData("co-quan", true)]
    [InlineData("unknown", false)]
    public void Configured_choices_are_preserved_and_validated(string code, bool valid)
    {
        var config = JsonSerializer.Deserialize<InlineListConfiguration>("""
            {"fields":[{"alias":"group","label":"Nhóm","type":"fixed","options":[["co-quan","Cơ quan"]]}]}
            """);
        var rows = new JsonArray(new JsonObject { ["key"] = Guid.NewGuid().ToString(), ["group"] = code });
        Assert.Equal(valid, InlineListRules.Validate(rows, config!).Count == 0);
        Assert.Contains("co-quan", JsonSerializer.Serialize(config));
    }

    [Theory]
    [InlineData("situationChooserPage", "/khan-cap/chon-tinh-huong/")]
    [InlineData("foundationLibraryPage", "/thu-vien/")]
    public void New_pages_have_public_paths(string alias, string path)
    {
        Assert.Equal(path, AntcPublicPaths.GetPath(alias, null));
        Assert.Equal(alias, AntcPublicPaths.FixedAlias(path));
    }

    [Fact]
    public void Preselected_answers_only_accept_configured_codes()
    {
        var config = new InlineListConfiguration { Fields = [new() { Alias = "preselected", Type = "lines", Options = [["money", "Đã chuyển tiền"]] }] };
        var rows = new JsonArray(new JsonObject { ["key"] = Guid.NewGuid().ToString(), ["preselected"] = new JsonArray("money") });
        Assert.Empty(InlineListRules.Validate(rows, config));
        rows[0]!["preselected"] = new JsonArray("invalid");
        Assert.Single(InlineListRules.Validate(rows, config));
    }
}
