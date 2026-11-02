using Umbraco.Plugin.Custom.Core.Articles;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class ArticleHtmlSanitizerTests
{
    [Fact]
    public void Notice_keeps_its_text_structure_and_exact_class()
    {
        string result = new ArticleHtmlSanitizer().Clean("<aside class=\"antc-article-notice\"><h3>Hộp lưu ý</h3><p>Không cung cấp mã OTP.</p></aside><p><u>Gạch chân</u></p>");
        Assert.Contains("<aside class=\"antc-article-notice\">", result);
        Assert.Contains("<h3>Hộp lưu ý</h3>", result);
        Assert.Contains("<p>Không cung cấp mã OTP.</p>", result);
        Assert.Contains("<u>Gạch chân</u>", result);
    }

    [Theory]
    [InlineData("<aside class=\"antc-article-notice extra\" onclick=\"alert(1)\" style=\"position:fixed\">Chữ</aside>")]
    [InlineData("<p class=\"antc-article-notice\" onmouseover=\"alert(1)\">Chữ</p>")]
    [InlineData("<aside class=\"other\"><script>alert(1)</script><p>Chữ</p></aside>")]
    public void Notice_support_does_not_allow_arbitrary_classes_or_executable_markup(string input)
    {
        string result = new ArticleHtmlSanitizer().Clean(input);
        Assert.Contains("Chữ", result);
        Assert.DoesNotContain("class=", result);
        Assert.DoesNotContain("style=", result);
        Assert.DoesNotContain("onclick", result);
        Assert.DoesNotContain("onmouseover", result);
        Assert.DoesNotContain("alert(1)", result);
        Assert.DoesNotContain("<script", result);
    }
}
