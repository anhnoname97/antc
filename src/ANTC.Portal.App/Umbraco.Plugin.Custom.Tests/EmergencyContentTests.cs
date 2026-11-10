using Umbraco.Web.UI.Models;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class EmergencyContentTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("not-json")]
    [InlineData("{}")]
    [InlineData("null")]
    public void Invalid_or_missing_configuration_does_not_break_the_page(string? input) => Assert.Empty(EmergencyContent.Rows(input));

    [Fact]
    public void Options_keep_their_order_and_require_document_udis()
    {
        var rows = EmergencyContent.Rows("[{\"options\":[{\"text\":\"First\",\"target\":\"umb://document/68706bf34b275b5aa587ccccb499a810\"},{\"text\":\"Second\",\"target\":\"javascript:alert(1)\"}]}]");
        var options = EmergencyContent.Rows(rows[0], "options");
        Assert.Equal(new[] { "First", "Second" }, options.Select(row => EmergencyContent.Text(row, "text")));
        Assert.Equal(Guid.Parse("68706bf3-4b27-5b5a-a587-ccccb499a810"), EmergencyContent.DocumentKey(EmergencyContent.Text(options[0], "target")));
        Assert.Null(EmergencyContent.DocumentKey(EmergencyContent.Text(options[1], "target")));
    }

    [Theory]
    [InlineData("113", true)]
    [InlineData("5656", true)]
    [InlineData("113?body=x", false)]
    [InlineData("113\n", false)]
    [InlineData("+84113", false)]
    public void Phone_links_only_accept_configured_short_numbers(string input, bool valid) => Assert.Equal(valid, EmergencyContent.IsPhoneNumber(input));
}
