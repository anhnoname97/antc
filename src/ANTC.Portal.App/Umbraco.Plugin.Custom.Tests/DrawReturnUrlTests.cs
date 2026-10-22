using Umbraco.Plugin.Custom.Api.Controllers;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class DrawReturnUrlTests
{
    [Theory]
    [InlineData("/quay-so", "/quay-so")]
    [InlineData("/quay-so/cuoc-thi/3", "/quay-so/cuoc-thi/3")]
    [InlineData("/quay-so?x=1", "/quay-so?x=1")]
    [InlineData("/QUAY-SO/abc", "/QUAY-SO/abc")]
    public void Giu_url_noi_bo_trong_khu_vuc_quay_so(string input, string expected) =>
        Assert.Equal(expected, DrawReturnUrl.Sanitize(input));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("https://evil.example")]
    [InlineData("//evil.example/quay-so")]
    [InlineData("/\\evil.example")]
    [InlineData("/quay-sox")]
    [InlineData("/trang-khac")]
    [InlineData("quay-so")]
    [InlineData("/quay-so/\r\nSet-Cookie: a=b")]
    public void Url_ngoai_khu_vuc_hoac_khong_an_toan_ve_trang_chu_quay_so(string? input) =>
        Assert.Equal("/quay-so", DrawReturnUrl.Sanitize(input));
}
