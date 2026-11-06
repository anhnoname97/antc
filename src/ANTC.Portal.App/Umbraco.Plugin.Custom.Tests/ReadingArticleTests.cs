using Umbraco.Plugin.Custom.Core.Content;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class ReadingArticleTests
{
    private static ReadingBody Render(string markup) => ReadingBodyRenderer.Render(markup, "/ung-pho/", "d1");

    [Fact]
    public void Risk_article_url_follows_primary_group()
    {
        var group = RiskStructure.GroupOf("umb://document/340daab5ee514f38841501eb5345de72");
        Assert.Equal("lua-dao", RiskStructure.Slug(group!));
        Assert.Equal("/cac-rui-ro/lua-dao/bai-doc-chuyen-de-1/",
            AntcPublicPaths.GetPath("riskArticlePage", "bai-doc-chuyen-de-1", "/cac-rui-ro/lua-dao/"));
    }

    [Fact]
    public void Risk_article_without_group_has_no_public_path()
    {
        Assert.Null(RiskStructure.GroupOf(""));
        Assert.Null(RiskStructure.GroupOf("umb://document/2f0dfb6195914d14970a6be6f7d4b28c"));
        Assert.Null(AntcPublicPaths.GetPath("riskArticlePage", "bai-doc-chuyen-de-1"));
    }

    [Fact]
    public void Top_level_headings_become_table_of_contents()
    {
        var body = Render("<h3>Mở đầu</h3><div class=\"k-box\"><h3>Trong hộp</h3></div><h3>Nếu đã lỡ ký</h3>");
        Assert.Equal(["muc-1", ReadingBodyRenderer.AfterIncidentId], body.Headings.Select(x => x.Id));
        Assert.Contains("<h2 id=\"neu-da-lo\">Nếu đã lỡ ký</h2>", body.Html);
        Assert.Contains("<h3>Trong hộp</h3>", body.Html);
    }

    [Fact]
    public void Urgent_box_links_to_actions_and_incident_section()
    {
        var body = Render("<div class=\"k-urgent\"><p>Gấp</p></div><h3>Nếu đã lỡ ký</h3>");
        Assert.Contains("href=\"/ung-pho/\"", body.Html);
        Assert.Contains("href=\"#neu-da-lo\"", body.Html);
        Assert.Contains("Đến mục “Nếu đã lỡ ký”", body.Html);
    }

    [Fact]
    public void Urgent_box_skips_jump_when_article_has_no_incident_section()
    {
        var body = Render("<div class=\"k-urgent\"><p>Gấp</p></div>");
        Assert.DoesNotContain("#neu-da-lo", body.Html);
    }

    [Fact]
    public void Pocket_list_becomes_checkboxes_with_stable_ids()
    {
        var body = Render("<div class=\"k-pocket\"><ul><li>Một</li><li>Hai</li></ul></div>");
        Assert.Contains("data-tick=\"d1-1\"", body.Html);
        Assert.Contains("data-tick=\"d1-2\"", body.Html);
        Assert.Contains("data-pocket-clear", body.Html);
        Assert.DoesNotContain("<ul>", body.Html);
    }

    [Fact]
    public void Tables_scroll_and_decisions_are_labelled()
    {
        var body = Render("<table><tbody><tr><td>DỪNG</td><td>Cúp máy</td></tr></tbody></table>");
        Assert.Contains("class=\"tblwrap\"", body.Html);
        Assert.Contains("<span class=\"stname d\">DỪNG</span>", body.Html);
    }

    [Fact]
    public void Empty_body_is_safe()
    {
        var body = Render("");
        Assert.Empty(body.Headings);
        Assert.Equal(1, body.Minutes);
    }
}
