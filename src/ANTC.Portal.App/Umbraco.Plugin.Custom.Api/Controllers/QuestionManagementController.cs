using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[VersionedApiBackOfficeRoute("antc/questions")]
[ApiExplorerSettings(GroupName = "ANTC Questions")]
[Authorize(Policy = AdministrationAccess.QuestionsPolicy)]
public sealed class QuestionManagementController(IQuestionSubmissionService questions,
    IQuestionModerationService moderation, IBackOfficeSecurityAccessor security, TimeProvider clock)
    : ManagementApiControllerBase
{
    [HttpPost]
    public Task<IActionResult> Create([FromBody] QuestionDraft draft, CancellationToken ct)
        => Execute(() => moderation.CreateAsync(draft, Actor(), ct), created: true);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] QuestionFilter filter, int page = 1, CancellationToken ct = default)
    {
        if (Invalid(filter, page) is { } error) return BadRequest(error);
        return Ok(await questions.ListAsync(filter, page, ct));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long id, CancellationToken ct)
        => await moderation.GetAsync(id, ct) is { } row ? Ok(row) : NotFound();

    [HttpGet("inbox-counts")]
    public async Task<IActionResult> InboxCounts(CancellationToken ct, string? type = null)
    {
        if (Invalid(new QuestionFilter(Type: type), 1) is { } error) return BadRequest(error);
        return Ok(await questions.InboxCountsAsync(ct, type));
    }

    [HttpGet("handlers")]
    public IActionResult Handlers([FromServices] IUserService users)
        => Ok(users.GetAll(0, 1000, out _, "Name", Direction.Ascending, filter: (string?)null)
            .Where(x => x.IsApproved && !x.IsLockedOut && x.AllowedSections.Contains(AdministrationAccess.QuestionsSectionAlias))
            .Select(x => new { value = x.Username, name = x.Name ?? x.Username }));

    [HttpPut("{id:long}")]
    public Task<IActionResult> Save(long id, [FromBody] QuestionReview review, CancellationToken ct)
        => Execute(() => moderation.SaveAsync(id, review, Actor(), ct));

    [HttpPost("{id:long}/approve")]
    public Task<IActionResult> Approve(long id, [FromBody] QuestionReview review, CancellationToken ct)
        => Execute(() => moderation.ApproveAsync(id, review, Actor(), ct));

    [HttpPost("{id:long}/unpublish")]
    public Task<IActionResult> Unpublish(long id, [FromBody] UnpublishQuestionRequest request, CancellationToken ct)
        => Execute(() => moderation.UnpublishAsync(id, request.ReviewVersion, Actor(), ct));

    [HttpGet("export")]
    public IActionResult Export([FromQuery] QuestionFilter filter)
    {
        if (Invalid(filter, 1) is { } error) return BadRequest(error);
        return new QuestionCsvResult(questions.ExportAsync(filter, HttpContext.RequestAborted),
            "hoi-dap-" + clock.GetUtcNow().ToOffset(QuestionValues.VietnamOffset).ToString("yyyyMMdd-HHmmss") + ".csv");
    }

    private string Actor()
    {
        string actor = CurrentUser(security).Username;
        return actor.Length > 100 ? actor[..100] : actor;
    }

    private async Task<IActionResult> Execute(Func<Task<QuestionRow>> operation, bool created = false)
    {
        try
        {
            QuestionRow row = await operation();
            return created ? Created($"/umbraco/management/api/v1/antc/questions/{row.Id}", row) : Ok(row);
        }
        catch (QuestionModerationException error)
        {
            int status = error.Code switch { "NOT_FOUND" => 404, "CONFLICT" => 409, _ => 400 };
            return StatusCode(status, new { error = new { code = error.Code, message = error.Message, fields = error.Fields } });
        }
    }

    private static object? Invalid(QuestionFilter filter, int page)
        => page < 1 || filter.From > filter.To || filter.Search?.Length > 200
            || !string.IsNullOrEmpty(filter.Type) && !QuestionValues.Types.ContainsKey(filter.Type)
            || !string.IsNullOrEmpty(filter.Status) && !QuestionValues.Statuses.ContainsKey(filter.Status)
            || !string.IsNullOrEmpty(filter.Inbox) && !QuestionValues.Inboxes.Contains(filter.Inbox)
            ? new { error = new { code = "VALIDATION", message = "Bộ lọc hoặc số trang không hợp lệ." } } : null;
}

public sealed record UnpublishQuestionRequest(long ReviewVersion);

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
