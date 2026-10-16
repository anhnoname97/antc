using Umbraco.Plugin.Custom.Core.Content;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class PageTreeRulesTests
{
    [Theory]
    [InlineData("antc", null)]
    [InlineData("pageManagement", "antc")]
    [InlineData("contentManagement", "antc")]
    [InlineData("articleManagement", "contentManagement")]
    [InlineData("home", "pageManagement")]
    [InlineData("ungPhoPage", "home")]
    [InlineData("thuDoanPage", "home")]
    [InlineData("thamGiaPage", "home")]
    [InlineData("thiThuPage", "home")]
    [InlineData("thiPage", "home")]
    [InlineData("hoiDapPage", "home")]
    [InlineData("chinhSachPage", "home")]
    [InlineData("searchPage", "home")]
    public void Fixed_page_can_be_saved_but_not_duplicated(string alias, string? parent)
    {
        Assert.Null(PageTreeRules.Validate(alias, parent, null, false));
        Assert.NotNull(PageTreeRules.Validate(alias, parent, null, true));
    }

    [Theory]
    [InlineData("home", "home")]
    [InlineData("home", null)]
    [InlineData("pageManagement", "home")]
    [InlineData("contentManagement", "pageManagement")]
    [InlineData("articleManagement", "antc")]
    [InlineData("thiPage", "thamGiaPage")]
    [InlineData("thiThuPage", "thamGiaPage")]
    [InlineData("article", "home")]
    [InlineData("qaItem", "articleList")]
    public void Wrong_parent_is_rejected(string alias, string? parent) =>
        Assert.NotNull(PageTreeRules.Validate(alias, parent, null, false));

    [Theory]
    [InlineData("contentManagement", "Chính sách", true)]
    [InlineData("contentManagement", "Cảnh báo", false)]
    [InlineData("contentManagement", null, false)]
    [InlineData("articleManagement", "Chính sách", false)]
    [InlineData("articleManagement", "Cảnh báo", true)]
    [InlineData("articleManagement", "Không có", true)]
    [InlineData("home", "Chính sách", false)]
    [InlineData("home", "Cảnh báo", false)]
    [InlineData("home", null, false)]
    [InlineData("thuDoanPage", "Chính sách", false)]
    [InlineData("thuDoanPage", "Cảnh báo", false)]
    [InlineData("thuDoanPage", "Không có", false)]
    public void Article_lists_belong_to_the_content_library(string parent, string? role, bool allowed) =>
        Assert.Equal(allowed, PageTreeRules.Validate("articleList", parent, role, false) is null);

    [Theory]
    [InlineData("article", "articleList")]
    public void Repeated_leaf_records_are_allowed(string alias, string parent) =>
        Assert.Null(PageTreeRules.Validate(alias, parent, null, true));

    [Theory]
    [InlineData("hoiDapPage")]
    [InlineData("contentManagement")]
    public void Manual_faq_documents_are_not_allowed(string parent) =>
        Assert.NotNull(PageTreeRules.Validate("qaItem", parent, null, false));
}
