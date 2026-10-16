using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Cms.Web.UI.Pages.Administration;

[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class QuestionsModel(IQuestionSubmissionService questions, TimeProvider timeProvider) : PageModel
{
    [BindProperty(SupportsGet = true)] public string? Type { get; set; }
    [BindProperty(SupportsGet = true)] public string? Status { get; set; }
    [BindProperty(SupportsGet = true)] public string? Search { get; set; }
    [BindProperty(SupportsGet = true)] public DateOnly? From { get; set; }
    [BindProperty(SupportsGet = true)] public DateOnly? To { get; set; }
    [BindProperty(SupportsGet = true)] public int PageNumber { get; set; } = 1;
    [BindProperty] public long ReviewId { get; set; }
    [BindProperty] public string? ReviewStatus { get; set; }
    [BindProperty] public string? AdminNote { get; set; }
    public QuestionPage Data { get; private set; } = new([], 0, 1);
    private QuestionFilter Filter => new(Type, Status, From, To, Search);

    public async Task<IActionResult> OnGetAsync(CancellationToken ct)
    {
        ValidateFilters();
        if (!ModelState.IsValid) return Page();
        Data = await questions.ListAsync(Filter, PageNumber, ct);
        return Page();
    }

    public async Task<IActionResult> OnGetRowsAsync(CancellationToken ct)
    {
        ValidateFilters();
        if (!ModelState.IsValid) return InvalidFields();
        Data = await questions.ListAsync(Filter, PageNumber, ct);
        Response.Headers["X-Question-Total"] = Data.Total.ToString();
        Response.Headers["X-Question-Pages"] = Data.TotalPages.ToString();
        return Partial("_QuestionRows", Data);
    }

    public IActionResult OnGetExport()
    {
        ValidateFilters();
        return ModelState.IsValid
            ? new QuestionCsvResult(questions.ExportAsync(Filter, HttpContext.RequestAborted),
                "hoi-dap-" + timeProvider.GetUtcNow().ToOffset(QuestionValues.VietnamOffset).ToString("yyyyMMdd-HHmmss") + ".csv")
            : InvalidFields();
    }

    public async Task<IActionResult> OnPostReviewAsync(CancellationToken ct)
    {
        if (ReviewId <= 0) ModelState.AddModelError(nameof(ReviewId), "Câu hỏi không hợp lệ.");
        if (ReviewStatus is null || !QuestionValues.Statuses.ContainsKey(ReviewStatus))
            ModelState.AddModelError(nameof(ReviewStatus), "Chọn một trạng thái hợp lệ.");
        if (AdminNote?.Length > 1000) ModelState.AddModelError(nameof(AdminNote), "Ghi chú tối đa 1000 ký tự.");
        if (!ModelState.IsValid) return InvalidFields();
        string actor = User.Identity?.Name ?? throw new InvalidOperationException("Thiếu người xử lý.");
        if (actor.Length > 100) actor = actor[..100];
        if (!await questions.ReviewAsync(ReviewId, ReviewStatus!, AdminNote?.Trim(), actor, ct)) return NotFound();
        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            return new JsonResult(new { ok = true, handledBy = actor, handledAt = timeProvider.GetUtcNow() });
        return Redirect(UrlFor(PageNumber));
    }

    public string UrlFor(int page, string? handler = null) => QueryHelpers.AddQueryString("/quan-tri/hoi-dap",
        new Dictionary<string, string?>
        {
            ["type"] = Type, ["status"] = Status, ["search"] = Search,
            ["from"] = From?.ToString("yyyy-MM-dd"), ["to"] = To?.ToString("yyyy-MM-dd"),
            ["pageNumber"] = Math.Max(1, page).ToString(), ["handler"] = handler
        });

    private void ValidateFilters()
    {
        if (!string.IsNullOrEmpty(Type) && !QuestionValues.Types.ContainsKey(Type)) ModelState.AddModelError(nameof(Type), "Loại không hợp lệ.");
        if (!string.IsNullOrEmpty(Status) && !QuestionValues.Statuses.ContainsKey(Status)) ModelState.AddModelError(nameof(Status), "Trạng thái không hợp lệ.");
        if (From > To) ModelState.AddModelError(nameof(To), "Ngày kết thúc cần từ ngày bắt đầu trở đi.");
        if (Search?.Length > 200) ModelState.AddModelError(nameof(Search), "Từ khóa tối đa 200 ký tự.");
        if (PageNumber < 1) ModelState.AddModelError(nameof(PageNumber), "Số trang không hợp lệ.");
    }

    private JsonResult InvalidFields() => new(new
    {
        error = new { code = "VALIDATION", message = "Dữ liệu không hợp lệ.",
            fields = ModelState.Where(x => x.Value?.Errors.Count > 0).ToDictionary(x => x.Key,
                x => x.Value!.Errors[0].ErrorMessage is { Length: > 0 } message ? message : "Giá trị không hợp lệ.") }
    }) { StatusCode = StatusCodes.Status400BadRequest };
}

internal sealed class QuestionCsvResult(IAsyncEnumerable<QuestionRow> rows, string fileName) : FileResult("text/csv; charset=utf-8")
{
    public override async Task ExecuteResultAsync(ActionContext context)
    {
        HttpResponse response = context.HttpContext.Response;
        response.ContentType = ContentType;
        response.Headers.ContentDisposition = "attachment; filename=\"" + fileName + "\"";
        response.Headers.CacheControl = "no-store";
        await QuestionCsv.WriteAsync(response.Body, rows, context.HttpContext.RequestAborted);
    }
}
