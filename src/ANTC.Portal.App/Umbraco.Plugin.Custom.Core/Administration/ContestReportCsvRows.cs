using System.Globalization;
using System.Runtime.CompilerServices;

namespace Umbraco.Plugin.Custom.Core.Administration;

public static class ContestReportCsvRows
{
    private static string Time(DateTime? value) => value?.AddHours(7).ToString("dd/MM/yyyy HH:mm:ss", CultureInfo.InvariantCulture) ?? "";
    public static readonly string[] EntryHeader = ["Mã dự thi","Họ tên","Số điện thoại","Đơn vị","Chế độ","Lượt thứ","Trạng thái","Đã làm","Đúng","Tạo lúc (VN)","Nộp lúc (VN)","Mã cuộc thi"];
    public static readonly string[] AnswerHeader = ["Mã dự thi","Mã câu","Chuyên đề","Đáp án chọn","Kết quả"];
    public static readonly string[] QuestionHeader = ["Mã cuộc thi","Cuộc thi","Mã câu","Chuyên đề","Nội dung","Lượt trả lời","Số đúng","Tỷ lệ đúng","Chọn A","Chọn B","Chọn C","Chọn D"];
    public static async IAsyncEnumerable<string[]> Entries(ContestReportingService reports, ContestReportFilter filter, [EnumeratorCancellation] CancellationToken ct)
    {
        await foreach(var e in reports.ExportEntries(filter).WithCancellation(ct))
            yield return [e.Code,e.FullName??"",e.Phone??"",e.Org??"",e.Mode=="named"?"Có tên":"Ẩn danh",e.AttemptNo?.ToString()??"",
                e.Status=="submitted"?"Đã nộp":"Đang thi",e.Answered.ToString(),e.Correct.ToString(),Time(e.CreatedAt),Time(e.SubmittedAt),e.ContestId?.ToString()??""];
    }
    public static async IAsyncEnumerable<string[]> Questions(IEnumerable<QuestionReport> rows)
    {
        foreach(var q in rows) yield return [q.ContestId?.ToString()??"",q.ContestName,q.Code,q.TopicId.ToString(),q.Text,q.Answered.ToString(),q.Correct.ToString(),
            q.CorrectRate?.ToString("P2",CultureInfo.GetCultureInfo("vi-VN"))??"",q.A.ToString(),q.B.ToString(),q.C.ToString(),q.D.ToString()];
        await Task.CompletedTask;
    }
}
