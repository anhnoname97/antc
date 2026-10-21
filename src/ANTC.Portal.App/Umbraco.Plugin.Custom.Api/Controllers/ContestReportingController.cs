using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[VersionedApiBackOfficeRoute("antc/contest-reports")]
[Authorize(Policy=AdministrationAccess.BackofficePolicy)]
public sealed class ContestReportingController(ContestReportingService reports,ContestAuditService audit,
    ContestResultsService results,IBackOfficeSecurityAccessor security) : ManagementApiControllerBase
{
    [HttpGet("options")]
    public async Task<IActionResult> Options(long? contestId,CancellationToken ct) => Ok(new {
        contests=await reports.ContestsAsync(ct),topics=await reports.TopicsAsync(contestId,ct)});

    private async Task<ApiErrorResponse?> Invalid(ContestReportFilter filter,int? topicId,CancellationToken ct)
    {
        var fields=filter.Validate();
        if (filter.ContestId is {} contest && !(await reports.ContestsAsync(ct)).Any(c=>c.Id==contest)) fields["contestId"]="Không tìm thấy cuộc thi.";
        if (topicId is {} topic && (topic<=0 || !(await reports.TopicsAsync(filter.ContestId,ct)).Any(t=>t.Id==topic))) fields["topicId"]="Chuyên đề không thuộc cuộc thi đã chọn.";
        return fields.Count==0?null:new(new ApiError("VALIDATION","Bộ lọc không hợp lệ.",fields));
    }
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] ContestReportFilter filter,CancellationToken ct) =>
        await Invalid(filter,null,ct) is {} error?BadRequest(error):Ok(await reports.DashboardAsync(filter,ct));
    [HttpGet("entries")]
    public async Task<IActionResult> Entries([FromQuery] ContestReportFilter filter,CancellationToken ct) =>
        await Invalid(filter,null,ct) is {} error?BadRequest(error):Ok(await reports.EntriesAsync(filter,ct));
    [HttpGet("entries/{id:long}")]
    public async Task<IActionResult> Detail(long id,CancellationToken ct)
    {
        var detail=await reports.DetailAsync(id,ct);
        if(detail is null) return NotFound(new ApiErrorResponse(new ApiError("ENTRY_NOT_FOUND","Không tìm thấy lượt thi.")));
        await audit.RecordAsync(CurrentUserKey(security),"view.detail",new {EntryId=id},detail.Entry.Code,ct);
        return Ok(detail);
    }
    [HttpGet("questions")]
    public async Task<IActionResult> Questions([FromQuery] ContestReportFilter filter,int? topicId,CancellationToken ct) =>
        await Invalid(filter,topicId,ct) is {} error?BadRequest(error):Ok(await reports.QuestionsAsync(filter,topicId,ct));
    [HttpGet("export/{kind}")]
    public async Task<IActionResult> Export(string kind,[FromQuery] ContestReportFilter filter,int? topicId,CancellationToken ct)
    {
        if (await Invalid(filter,topicId,ct) is {} error) return BadRequest(error);
        string[] headers;IAsyncEnumerable<string[]> rows;
        switch(kind)
        {
            case "entries":headers=ContestReportCsvRows.EntryHeader;rows=ContestReportCsvRows.Entries(reports,filter,ct);break;
            case "answers":headers=ContestReportCsvRows.AnswerHeader;rows=reports.ExportAnswers(filter,ct);break;
            case "questions":headers=ContestReportCsvRows.QuestionHeader;rows=ContestReportCsvRows.Questions(await reports.QuestionsAsync(filter,topicId,ct));break;
            default:return BadRequest(new ApiErrorResponse(new ApiError("VALIDATION","Loại xuất dữ liệu không hợp lệ.")));
        }
        await audit.RecordAsync(CurrentUserKey(security),"export."+kind,new {Filter=filter,TopicId=topicId},null,ct);
        return new ContestReportCsvResult(headers,rows,kind);
    }
    [HttpGet("contests/{id:long}/publication")]
    public async Task<IActionResult> Publication(long id,CancellationToken ct)
    {
        try {var state=await results.StateAsync(id,ct);return state is null?NotFound(Missing()):Ok(state);}
        catch(ContestResultsException ex){return Failure(ex);}
    }
    [HttpPut("contests/{id:long}/publication")]
    public async Task<IActionResult> Publish(long id,[FromBody] ResultsPublicationRequest request,CancellationToken ct)
    {
        try {var state=await results.SetPublicationAsync(id,request,CurrentUserKey(security),ct);return state is null?NotFound(Missing()):Ok(state);}
        catch(ContestResultsException ex){return Failure(ex);}
    }
    [HttpGet("contests/{id:long}/draws")]
    public async Task<IActionResult> Draws(long id,[FromServices] Umbraco.Plugin.Custom.Core.Data.AppDbContext db,CancellationToken ct)
    {
        var rows=await db.Draws.AsNoTracking().Where(d=>d.ContestId==id).OrderByDescending(d=>d.CreatedAt)
            .Select(d=>new {d.Id,CreatedAt=DateTime.SpecifyKind(d.CreatedAt,DateTimeKind.Utc),WinnerCount=d.Winners.Count}).ToListAsync(ct);
        return Ok(rows);
    }
    private static ApiErrorResponse Missing()=>new(new ApiError("CONTEST_NOT_FOUND","Không tìm thấy cuộc thi."));
    private ObjectResult Failure(ContestResultsException ex)=>StatusCode(ex.Status,new ApiErrorResponse(new ApiError(ex.Code,ex.Message)));
}

internal sealed class ContestReportCsvResult(string[] headers,IAsyncEnumerable<string[]> rows,string kind) : FileResult("text/csv; charset=utf-8")
{
    public override async Task ExecuteResultAsync(ActionContext context)
    {
        context.HttpContext.Response.ContentType=ContentType;
        context.HttpContext.Response.Headers.ContentDisposition=$"attachment; filename=\"{kind}.csv\"";
        context.HttpContext.Response.Headers.CacheControl="no-store";
        await ContestCsv.WriteAsync(context.HttpContext.Response.Body,headers,rows,context.HttpContext.RequestAborted);
    }
}
