using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("api/v1/admin/quiz/imports")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class QuizWorkbookController(QuizWorkbookService service) : ControllerBase
{
    private const string Excel = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private string Actor => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name ?? "backoffice";
    [HttpGet("template")]
    public async Task<IActionResult> Template(CancellationToken ct) => File(await service.ExportAsync(true, ct), Excel, "mau-ngan-hang-cau-hoi.xlsx");
    [HttpGet("export")]
    public async Task<IActionResult> Export(CancellationToken ct) => File(await service.ExportAsync(false, ct), Excel, "ngan-hang-cau-hoi.xlsx");
    [HttpPost("preview")]
    [RequestSizeLimit(QuizWorkbookService.MaxFileBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = QuizWorkbookService.MaxFileBytes + 64 * 1024)]
    public async Task<IActionResult> Preview([FromForm] IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest(Error("VALIDATION", "Hãy chọn một tệp .xlsx có nội dung."));
        if (Request.Form.Files.Count != 1) return BadRequest(Error("VALIDATION", "Mỗi lần chỉ được tải lên một tệp Excel."));
        if (file.Length > QuizWorkbookService.MaxFileBytes) return StatusCode(413, Error("REQUEST_TOO_LARGE", "Tệp Excel không được vượt quá 5 MB."));
        try
        {
            using var buffer = new MemoryStream(); await file.CopyToAsync(buffer, ct);
            return Ok(await service.PreviewAsync(buffer.ToArray(), file.FileName, Actor, ct));
        }
        catch (QuizAdminValidationException ex) { return BadRequest(Error("VALIDATION", ex.Message, ex.Fields)); }
    }
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ConfirmWorkbookRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.PreviewId)) return BadRequest(Error("VALIDATION", "Thiếu mã bản xem trước."));
        try { return Ok(await service.ConfirmAsync(request, Actor, ct)); }
        catch (QuizAdminConflictException ex) { return Conflict(Error(ex.Code, ex.Message)); }
    }
    [HttpGet]
    public async Task<IActionResult> History([FromQuery] int page = 1, CancellationToken ct = default, [FromQuery] int pageSize = 50) => Ok(await service.HistoryAsync(page, ct, pageSize));
    [HttpGet("{id:long}/file")]
    public async Task<IActionResult> Download(long id, CancellationToken ct) => await service.DownloadAsync(id, ct) is { } item
        ? File(item.Bytes, Excel, item.Name) : NotFound(Error("IMPORT_NOT_FOUND", "Không tìm thấy tệp nhập của lần này."));
    private static ApiErrorResponse Error(string code, string message, IReadOnlyDictionary<string, string>? fields = null) =>
        new(new ApiError(code, message, fields ?? new Dictionary<string, string>()));
}
