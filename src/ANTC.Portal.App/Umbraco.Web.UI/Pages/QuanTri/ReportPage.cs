using System.Globalization;
using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;
using Umbraco.Cms.Core.Security.Authorization;
using Umbraco.Plugin.Custom.Core.Administration;

namespace Antc.ContestAdministration;

public abstract class ReportPage(ContestReportingService reports, ContestAuditService audit, IAuthorizationHelper authorization) : PageModel
{
    protected readonly ContestReportingService Reports = reports;
    protected readonly ContestAuditService Audit = audit;
    protected readonly IAuthorizationHelper Authorization = authorization;
    // Explicit prefix avoids binding Filter.Page to Razor's reserved route value "page".
    [BindProperty(Name = "Filter", SupportsGet = true)] public ContestReportFilter Filter { get; set; } = new();
    public IReadOnlyList<ContestChoice> Contests { get; private set; } = [];
    protected CancellationToken Ct => HttpContext.RequestAborted;
    public string UrlFor(string path, int? page = null) => QueryHelpers.AddQueryString(path, Filter.RouteValues(page));
    public static string Time(DateTime? value) => value?.AddHours(7).ToString("dd/MM/yyyy HH:mm:ss", CultureInfo.InvariantCulture) ?? "—";
    public static string Mode(string value) => value == "named" ? "Có tên" : "Ẩn danh";
    public static string Status(string value) => value == "submitted" ? "Đã nộp" : "Đang thi";
    protected async Task<bool> PrepareAsync()
    {
        foreach (var error in Filter.Validate()) ModelState.AddModelError("Filter." + error.Key, error.Value);
        Contests = await Reports.ContestsAsync(Ct);
        if (Filter.ContestId is { } id && !Contests.Any(c => c.Id == id)) ModelState.AddModelError("Filter.ContestId", "Không tìm thấy cuộc thi.");
        if (ModelState.IsValid) return true;
        // Do not echo framework parsing messages or raw personal values in error text.
        ModelState.Clear();
        ModelState.AddModelError("", "Bộ lọc không hợp lệ. Kiểm tra cuộc thi, số trang, khoảng điểm và khoảng ngày.");
        Response.StatusCode = 400;
        return false;
    }
    protected Task RecordAsync(string action, object filters, string? code = null) =>
        Audit.RecordAsync(Authorization.GetUmbracoUser(User).Key, action, filters, code, Ct);
    protected async Task<IActionResult> CsvAsync(string file, string action, object filters, string[] header, IAsyncEnumerable<string[]> rows)
    {
        await RecordAsync(action, filters);
        Response.ContentType = "text/csv; charset=utf-8";
        Response.Headers.ContentDisposition = $"attachment; filename=\"{file}.csv\"";
        await ContestCsv.WriteAsync(Response.Body, header, rows, Ct);
        return new EmptyResult();
    }
    protected async IAsyncEnumerable<string[]> EntryRows([EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var e in Reports.ExportEntries(Filter).WithCancellation(ct))
            yield return [e.Code,e.FullName??"",e.Phone??"",e.Org??"",Mode(e.Mode),e.AttemptNo?.ToString()??"",Status(e.Status),
                e.Answered.ToString(),e.Correct.ToString(),Time(e.CreatedAt),Time(e.SubmittedAt),e.ContestId?.ToString()??""];
    }
    protected static async IAsyncEnumerable<string[]> QuestionRows(IEnumerable<QuestionReport> rows)
    {
        foreach (var q in rows)
            yield return [q.ContestId?.ToString()??"",q.ContestName,q.Code,q.TopicId.ToString(),q.Text,q.Answered.ToString(),q.Correct.ToString(),
                q.CorrectRate?.ToString("P2",CultureInfo.GetCultureInfo("vi-VN"))??"",q.A.ToString(),q.B.ToString(),q.C.ToString(),q.D.ToString()];
        await Task.CompletedTask;
    }
}

public sealed class DashboardPage(ContestReportingService reports, ContestAuditService audit, IAuthorizationHelper auth) : ReportPage(reports,audit,auth)
{
    public ContestDashboard? Data { get; private set; }
    public async Task OnGetAsync() { if (await PrepareAsync()) Data = await Reports.DashboardAsync(Filter,Ct); }
}

public sealed class EntriesPage(ContestReportingService reports, ContestAuditService audit, IAuthorizationHelper auth) : ReportPage(reports,audit,auth)
{
    public EntryReportPage? Data { get; private set; }
    public async Task OnGetAsync() { if (await PrepareAsync()) Data = await Reports.EntriesAsync(Filter,Ct); }
    public async Task<IActionResult> OnPostExportAsync(string kind)
    {
        if (!await PrepareAsync()) return Page();
        if (kind == "entries") return await CsvAsync("luot-thi","export.entries",Filter,
            ["Mã dự thi","Họ tên","Số điện thoại","Đơn vị","Chế độ","Lượt thứ","Trạng thái","Đã làm","Đúng","Tạo lúc (VN)","Nộp lúc (VN)","Mã cuộc thi"],EntryRows(Ct));
        if (kind == "answers") return await CsvAsync("dap-an","export.answers",Filter,
            ["Mã dự thi","Mã câu","Chuyên đề","Đáp án chọn","Kết quả"],Reports.ExportAnswers(Filter,Ct));
        return BadRequest("Loại xuất dữ liệu không hợp lệ.");
    }
}

public sealed class DetailPage(ContestReportingService reports, ContestAuditService audit, IAuthorizationHelper auth) : ReportPage(reports,audit,auth)
{
    public EntryReportDetail? Data { get; private set; }
    public async Task<IActionResult> OnGetAsync(long id)
    {
        Data = await Reports.DetailAsync(id,Ct);
        if (Data is null) { Response.StatusCode = 404; return Page(); }
        await RecordAsync("view.detail",new { EntryId = id },Data.Entry.Code);
        return Page();
    }
}

public sealed class QuestionsPage(ContestReportingService reports, ContestAuditService audit, IAuthorizationHelper auth) : ReportPage(reports,audit,auth)
{
    [BindProperty(SupportsGet = true)] public int? TopicId { get; set; }
    public IReadOnlyList<QuestionReport>? Data { get; private set; }
    public IReadOnlyList<ReportTopic> TopicChoices { get; private set; } = [];
    private async Task<bool> PrepareQuestionsAsync()
    {
        if (TopicId is <= 0) ModelState.AddModelError(nameof(TopicId),"Chuyên đề không hợp lệ.");
        bool valid = await PrepareAsync();
        TopicChoices = await Reports.TopicsAsync(Filter.ContestId,Ct);
        if (valid && TopicId is {} topic && !TopicChoices.Any(t=>t.Id==topic))
        {
            ModelState.AddModelError(nameof(TopicId),"Chuyên đề không thuộc cuộc thi đã chọn.");
            Response.StatusCode = 400;
            return false;
        }
        return valid;
    }
    public async Task OnGetAsync() { if (await PrepareQuestionsAsync()) Data = await Reports.QuestionsAsync(Filter,TopicId,Ct); }
    public async Task<IActionResult> OnPostExportAsync()
    {
        if (!await PrepareQuestionsAsync()) return Page();
        var rows = await Reports.QuestionsAsync(Filter,TopicId,Ct);
        return await CsvAsync("thong-ke-cau-hoi","export.questions",new {Filter,TopicId},
            ["Mã cuộc thi","Cuộc thi","Mã câu","Chuyên đề","Nội dung","Lượt trả lời","Số đúng","Tỷ lệ đúng","Chọn A","Chọn B","Chọn C","Chọn D"],QuestionRows(rows));
    }
}
