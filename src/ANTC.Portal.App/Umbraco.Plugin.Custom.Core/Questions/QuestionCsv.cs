using System.Globalization;
using System.Text;

namespace Umbraco.Plugin.Custom.Core.Questions;

public static class QuestionCsv
{
    public static async Task WriteAsync(Stream destination, IAsyncEnumerable<QuestionRow> rows, CancellationToken ct = default)
    {
        await using var writer = new StreamWriter(destination, new UTF8Encoding(encoderShouldEmitUTF8Identifier: true),
            bufferSize: 16384, leaveOpen: true) { NewLine = "\r\n" };
        await writer.WriteLineAsync("Mã,Thời điểm gửi,Loại,Nội dung,Muốn trả lời riêng,Liên hệ,Trạng thái,Ghi chú,Người xử lý,Thời điểm xử lý,Câu trả lời nháp,Đang công khai,Câu trả lời đã duyệt,Người duyệt,Thời điểm duyệt".AsMemory(), ct);
        await foreach (QuestionRow row in rows.WithCancellation(ct))
        {
            string[] cells = [row.Id.ToString(CultureInfo.InvariantCulture), FormatDate(row.CreatedAt),
                QuestionValues.Types.GetValueOrDefault(row.Type, row.Type), row.Content, row.WantReply ? "Có" : "Không",
                row.Contact ?? "", QuestionValues.Statuses.GetValueOrDefault(row.Status, row.Status), row.AdminNote ?? "",
                row.HandledBy ?? "", row.HandledAt is { } handled ? FormatDate(handled) : "",
                row.Answer ?? "", row.IsPublished ? "Có" : "Không", row.PublishedAnswer ?? "", row.ApprovedBy ?? "",
                row.ApprovedAt is { } approved ? FormatDate(approved) : ""];
            await writer.WriteLineAsync(string.Join(',', cells.Select(Escape)).AsMemory(), ct);
        }
        await writer.FlushAsync(ct);
    }

    private static string FormatDate(DateTimeOffset value) => value.ToOffset(QuestionValues.VietnamOffset)
        .ToString("dd/MM/yyyy HH:mm:ss", CultureInfo.InvariantCulture);

    private static string Escape(string value)
    {
        // Giữ dữ liệu người gửi dưới dạng chữ khi Excel mở CSV, không chạy công thức.
        string check = value.TrimStart();
        if (value.StartsWith('\t') || value.StartsWith('\r') || value.StartsWith('\n')
            || (check.Length > 0 && "=+-@".Contains(check[0]))) value = "'" + value;
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }
}
