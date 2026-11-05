using Umbraco.Web.UI.Rendering;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class SelfCheckSeoTests
{
    private static SelfCheckSeoInput Input() => new()
    {
        Origin = new Uri("https://antoantaichinh.vn"), PublicPath = "/hay-tu-kiem-tra/", Name = "Tên node",
        Title = "Hãy tự kiểm tra", Description = "Câu dẫn của trang", SiteName = "antoantaichinh.vn"
    };

    [Fact]
    public void Editorial_seo_fields_override_content_and_images_without_using_query_or_fragment()
    {
        var seo = SelfCheckSeoRules.Resolve(Input() with
        {
            SeoTitle = "  Tiêu đề SEO  ", SeoDescription = " Mô tả SEO ", Canonical = "/hay-tu-kiem-tra/?answer=secret#result",
            Image = new("/media/share.jpg?v=42", "Ảnh riêng", 1200, 630), DefaultImage = new("/media/default.jpg", "Mặc định"),
            Updated = new DateTime(2026, 11, 5), Article = true
        });
        Assert.Equal("Tiêu đề SEO", seo.Title);
        Assert.Equal("Tiêu đề SEO — antoantaichinh.vn", seo.DocumentTitle);
        Assert.Equal("Mô tả SEO", seo.Description);
        Assert.Equal("https://antoantaichinh.vn/hay-tu-kiem-tra/", seo.CanonicalUrl);
        Assert.Equal("https://antoantaichinh.vn/media/share.jpg?v=42", seo.Image!.Url);
        Assert.Equal("Ảnh riêng", seo.Image.Alt);
        Assert.Equal(1200, seo.Image.Width);
        Assert.Equal("article", seo.Type);
        Assert.Equal(new DateTime(2026, 11, 5), seo.Updated);
    }

    [Fact]
    public void Empty_seo_fields_fall_back_to_visible_content_then_node_name_and_site_image()
    {
        var seo = SelfCheckSeoRules.Resolve(Input() with { SeoTitle = " ", SeoDescription = "", DefaultImage = new("/media/default.jpg", null) });
        Assert.Equal("Hãy tự kiểm tra", seo.Title);
        Assert.Equal("Câu dẫn của trang", seo.Description);
        Assert.Equal("Hãy tự kiểm tra", seo.Image!.Alt);
        Assert.Equal("Tên node", SelfCheckSeoRules.Resolve(Input() with { Title = "" }).Title);
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:text/html,x")]
    [InlineData("//evil.example/a")]
    [InlineData("/\\evil.example/a")]
    [InlineData("https://user:pass@example.com/")]
    [InlineData("/x\r\nInjected: yes")]
    [InlineData("relative-path")]
    public void Invalid_canonical_values_fall_back_to_public_path(string configured)
    {
        Assert.Equal("https://antoantaichinh.vn/hay-tu-kiem-tra/", SelfCheckSeoRules.Resolve(Input() with { Canonical = configured }).CanonicalUrl);
    }

    [Fact]
    public void Explicit_cross_domain_canonical_is_respected_but_excluded_from_our_sitemap()
    {
        var seo = SelfCheckSeoRules.Resolve(Input() with { Canonical = "https://publisher.example/original/?ref=1#part" });
        Assert.Equal("https://publisher.example/original/", seo.CanonicalUrl);
        Assert.False(SelfCheckSeoRules.IncludeInSitemap(seo, Input().Origin));
    }

    [Theory]
    [InlineData(true, false, false)]
    [InlineData(false, true, false)]
    [InlineData(false, false, true)]
    public void Hidden_test_site_and_preview_independently_prevent_indexing(bool hidden, bool testSite, bool preview)
    {
        var seo = SelfCheckSeoRules.Resolve(Input() with { Hidden = hidden, TestSite = testSite, Preview = preview });
        Assert.True(seo.NoIndex);
        Assert.False(SelfCheckSeoRules.IncludeInSitemap(seo, Input().Origin));
    }

    [Fact]
    public void Public_pages_are_eligible_for_the_group_sitemap_and_invalid_images_use_a_safe_fallback()
    {
        var seo = SelfCheckSeoRules.Resolve(Input() with { Image = new("javascript:bad", "x"), DefaultImage = new("/media/default.jpg", "Ảnh website", -1, 0) });
        Assert.False(seo.NoIndex);
        Assert.True(SelfCheckSeoRules.IncludeInSitemap(seo, Input().Origin));
        Assert.Equal("https://antoantaichinh.vn/media/default.jpg", seo.Image!.Url);
        Assert.Null(seo.Image.Width);
        Assert.Null(seo.Image.Height);
        Assert.Null(SelfCheckSeoRules.Resolve(Input()).Image);
        Assert.Null(SelfCheckSeoRules.Resolve(Input() with { Updated = DateTime.MinValue }).Updated);
    }
}
