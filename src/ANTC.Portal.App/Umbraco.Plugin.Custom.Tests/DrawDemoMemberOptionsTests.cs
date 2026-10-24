using Microsoft.Extensions.Configuration;
using Umbraco.Plugin.Custom.Core.Administration;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class DrawDemoMemberOptionsTests
{
    // Gia tri thu sinh luc chay, khong ghi san trong ma nguon.
    private static readonly string GeneratedValue = Guid.NewGuid().ToString("N");

    private static IConfiguration Build() => Build("u", "u@x.local", "U", GeneratedValue);

    private static IConfiguration Build(string? userName, string? email, string? name, string? password)
    {
        var data = new Dictionary<string, string?>
        {
            ["DrawDemo:Member:UserName"] = userName,
            ["DrawDemo:Member:Email"] = email,
            ["DrawDemo:Member:Name"] = name,
            ["DrawDemo:Member:Password"] = password,
        };
        return new ConfigurationBuilder().AddInMemoryCollection(data).Build();
    }

    [Fact]
    public void Doc_duoc_cau_hinh_day_du_o_Development()
    {
        var options = DrawDemoMemberOptions.TryRead(Build(), isDevelopment: true);
        Assert.NotNull(options);
        Assert.Equal("u", options.UserName);
        Assert.Equal(GeneratedValue, options.Password);
    }

    [Fact]
    public void Bo_qua_khi_khong_phai_Development() =>
        Assert.Null(DrawDemoMemberOptions.TryRead(Build(), isDevelopment: false));

    [Theory]
    [InlineData(null, "e", "n", "p")]
    [InlineData("u", "", "n", "p")]
    [InlineData("u", "e", "  ", "p")]
    [InlineData("u", "e", "n", null)]
    public void Bo_qua_khi_thieu_truong(string? userName, string? email, string? name, string? password) =>
        Assert.Null(DrawDemoMemberOptions.TryRead(Build(userName, email, name, password), isDevelopment: true));

    [Theory]
    [InlineData("__DOI_MAT_KHAU__")]
    [InlineData("__")]
    public void Bo_qua_khi_mat_khau_la_chuoi_giu_cho(string password) =>
        Assert.Null(DrawDemoMemberOptions.TryRead(Build("u", "u@x.local", "U", password), isDevelopment: true));

    [Fact]
    public void Bo_qua_khi_khong_co_section() =>
        Assert.Null(DrawDemoMemberOptions.TryRead(new ConfigurationBuilder().Build(), isDevelopment: true));
}
