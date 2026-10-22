using Microsoft.Extensions.Configuration;
using Umbraco.Plugin.Custom.Core.Administration;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class DrawDemoMemberOptionsTests
{
    private static IConfiguration Build(string? userName = "u", string? email = "u@x.local", string? name = "U", string? password = "Mat-khau-thu-1")
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
        Assert.Equal("Mat-khau-thu-1", options.Password);
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
        Assert.Null(DrawDemoMemberOptions.TryRead(Build(password: password), isDevelopment: true));

    [Fact]
    public void Bo_qua_khi_khong_co_section() =>
        Assert.Null(DrawDemoMemberOptions.TryRead(new ConfigurationBuilder().Build(), isDevelopment: true));
}
