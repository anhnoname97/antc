using System.Text.Json;
using System.Text.Json.Nodes;
using Umbraco.Plugin.Custom.Core.PortalV2.Editors;
using Umbraco.Web.UI.Models;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class ActionGuideDataTests
{
    [Fact]
    public void Reading_steps_keeps_slots_for_notices_and_reads_optional_fields()
    {
        var rows = ActionGuideData.ParseSteps("""
        [{"key":"a82bc598-782b-486f-aec6-0d6b94030040","mainText":"Làm ngay","details":["Giải thích"],"showBankLookup":true,"hasFollowUp":true,"followUpQuestion":"Hỏi thêm?","followUpButton":"Xem","followUpPage":"umb://document/00000000000000000000000000000001"},
        {"key":"a82bc598-782b-486f-aec6-0d6b94030041","noticeTitle":"Lưu ý"},
        {"key":"a82bc598-782b-486f-aec6-0d6b94030042","mainText":"Làm tiếp"}]
        """);
        Assert.Equal(3, rows.Length);
        Assert.True(rows[0].ShowBankLookup);
        Assert.True(rows[0].HasFollowUp);
        Assert.NotNull(rows[0].FollowUpPage);
        Assert.Equal("Lưu ý", rows[1].NoticeTitle);
        Assert.Equal(3, rows[2].Number);
    }

    [Fact]
    public void Legacy_block_list_uses_layout_order_instead_of_storage_order()
    {
        var rows = ActionGuideData.ParseSteps("""
        {"layout":{"Umbraco.BlockList":[{"contentKey":"00000000-0000-0000-0000-000000000002"},{"contentKey":"00000000-0000-0000-0000-000000000001"}]},"contentData":[
        {"key":"00000000-0000-0000-0000-000000000001","values":[{"alias":"summary","value":"Một"}]},
        {"key":"00000000-0000-0000-0000-000000000002","values":[{"alias":"summary","value":"Hai"}]}]}
        """);
        Assert.Equal(["Hai", "Một"], rows.Select(step => step.MainText));
    }

    [Theory]
    [InlineData("not-json")]
    [InlineData("null")]
    [InlineData("{}")]
    public void Missing_or_malformed_steps_are_empty(string json) => Assert.Empty(ActionGuideData.ParseSteps(json));

    [Fact]
    public void Conditional_required_fields_follow_toggle_value_in_both_config_formats()
    {
        foreach (var condition in new[] { "true", "\"true\"" })
        {
            var config = JsonSerializer.Deserialize<InlineListConfiguration>("{\"fields\":[{\"alias\":\"followUpQuestion\",\"label\":\"Câu hỏi\",\"type\":\"text\",\"required\":true,\"showWhen\":{\"field\":\"hasFollowUp\",\"equals\":" + condition + "}}]}")!;
            var row = JsonNode.Parse("[{\"key\":\"00000000-0000-0000-0000-000000000001\",\"hasFollowUp\":false}]")!;
            Assert.Empty(InlineListRules.Validate(row, config));
            row[0]!["hasFollowUp"] = true;
            Assert.Contains(InlineListRules.Validate(row, config), error => error.Path.EndsWith("followUpQuestion"));
        }
    }

    [Theory]
    [InlineData("/khan-cap/", true)]
    [InlineData("tel:113", true)]
    [InlineData("sms:5656", true)]
    [InlineData("javascript:alert(1)", false)]
    [InlineData("//example.com", false)]
    [InlineData("/\\example.com", false)]
    [InlineData("tel:113?body=secret", false)]
    public void Guidance_buttons_only_open_local_routes_or_phone_actions(string url, bool expected) => Assert.Equal(expected, ActionGuideLinks.IsAllowed(url));

    [Fact]
    public void Missing_toggle_defaults_to_false_when_validating_required_main_text()
    {
        var config = JsonSerializer.Deserialize<InlineListConfiguration>("""
        {"fields":[{"alias":"mainText","type":"text","label":"Câu chính","required":true,"showWhen":{"field":"isNotice","equals":false}}]}
        """)!;
        var rows = JsonNode.Parse("""[{"key":"00000000-0000-0000-0000-000000000001"}]""");
        Assert.Contains(InlineListRules.Validate(rows, config), error => error.Path.EndsWith("mainText"));
    }
}
