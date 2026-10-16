using Umbraco.Plugin.Custom.Core.Content;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class AntcPublicPathsTests
{
    [Theory]
    [InlineData("home", "/")]
    [InlineData("ungPhoPage", "/ung-pho/")]
    [InlineData("thiThuPage", "/thu-suc/")]
    [InlineData("searchPage", "/tim-kiem/")]
    [InlineData("chinhSachPage", "/chinh-sach/")]
    public void Page_paths_do_not_expose_management_nodes(string alias, string path)
    {
        Assert.Equal(path, AntcPublicPaths.GetPath(alias, "ten-trang"));
        Assert.Equal(alias, AntcPublicPaths.FixedAlias(path.ToUpperInvariant()));
    }

    [Fact]
    public void Article_url_uses_its_library_category()
    {
        string? listPath = AntcPublicPaths.GetPath("articleList", "mua-ban-dat-coc");
        Assert.Equal("/thu-doan/mua-ban-dat-coc/", listPath);
        Assert.Equal("/thu-doan/mua-ban-dat-coc/bai-viet/", AntcPublicPaths.GetPath("article", "bai-viet", listPath));
    }

    [Fact]
    public void Policy_articles_have_their_own_public_prefix()
    {
        string? listPath = AntcPublicPaths.GetPath("articleList", "chinh-sach", listRole: "Chính sách");
        Assert.Equal("/chinh-sach/", listPath);
        Assert.Equal("/chinh-sach/bao-ve-du-lieu/", AntcPublicPaths.GetPath("article", "bao-ve-du-lieu", listPath));
    }

    [Theory]
    [InlineData("antc")]
    [InlineData("pageManagement")]
    [InlineData("contentManagement")]
    [InlineData("articleManagement")]
    public void Management_documents_are_not_public_pages(string alias) => Assert.Null(AntcPublicPaths.GetPath(alias, "quan-ly"));

    [Fact]
    public void Missing_article_parent_does_not_produce_a_broken_url() => Assert.Null(AntcPublicPaths.GetPath("article", "bai-viet"));

    [Fact]
    public void Manual_faq_documents_do_not_have_a_public_route() => Assert.Null(AntcPublicPaths.GetPath("qaItem", "cau-hoi"));
}
