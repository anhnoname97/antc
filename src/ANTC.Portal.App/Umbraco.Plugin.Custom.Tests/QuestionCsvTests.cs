using System.Text;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionCsvTests
{
    [Fact]
    public async Task Csv_has_utf8_bom_preserves_vietnamese_quotes_and_neutralizes_excel_formulas()
    {
        var row = new QuestionRow(1, "gop-y", "Nội dung, có \"dấu\"\nxuống dòng <b>nguyên văn</b>", true,
            "=HYPERLINK(\"https://example.invalid\")", "moi", " +1+1", "Biên tập viên", null,
            new DateTimeOffset(2026, 10, 16, 0, 0, 0, TimeSpan.Zero));
        async IAsyncEnumerable<QuestionRow> Rows() { yield return row; await Task.CompletedTask; }
        await using var stream = new MemoryStream();
        await QuestionCsv.WriteAsync(stream, Rows());
        byte[] bytes = stream.ToArray();
        Assert.Equal(new byte[] { 0xef, 0xbb, 0xbf }, bytes.Take(3).ToArray());
        string text = Encoding.UTF8.GetString(bytes[3..]);
        Assert.Contains("Góp ý", text);
        Assert.Contains("Nội dung, có \"\"dấu\"\"\nxuống dòng <b>nguyên văn</b>", text);
        Assert.Contains("\"'=HYPERLINK", text);
        Assert.Contains("\"' +1+1\"", text);
        Assert.Contains("16/10/2026 07:00:00", text);
    }
}
