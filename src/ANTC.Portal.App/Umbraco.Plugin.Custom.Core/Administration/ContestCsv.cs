using System.Text;

namespace Umbraco.Plugin.Custom.Core.Administration;

public static class ContestCsv
{
    public static async Task WriteAsync(Stream output, string[] header, IAsyncEnumerable<string[]> rows, CancellationToken ct)
    {
        await using var writer = new StreamWriter(output, new UTF8Encoding(true), 16384, leaveOpen: true) { NewLine = "\r\n" };
        await writer.WriteLineAsync(Line(header).AsMemory(), ct);
        await foreach (var row in rows.WithCancellation(ct)) await writer.WriteLineAsync(Line(row).AsMemory(), ct);
        await writer.FlushAsync(ct);
    }

    private static string Line(IEnumerable<string> cells) => string.Join(",", cells.Select(value =>
    {
        value ??= "";
        string trimmed = value.TrimStart();
        // CSV quoting alone does not prevent spreadsheet formula execution.
        if (trimmed.Length > 0 && "=+-@".Contains(trimmed[0]) || value.StartsWith('\t') || value.StartsWith('\r') || value.StartsWith('\n')) value = "'" + value;
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }));
}
