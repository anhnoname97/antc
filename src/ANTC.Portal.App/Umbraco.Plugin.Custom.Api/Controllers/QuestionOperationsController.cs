using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[VersionedApiBackOfficeRoute("antc/questions")]
[ApiExplorerSettings(GroupName = "ANTC Questions")]
[Authorize(Policy = AdministrationAccess.QuestionsPolicy)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class QuestionOperationsController(QuestionOperations operations, QuestionRetentionService retention,
    IBackOfficeSecurityAccessor security) : ManagementApiControllerBase
{
    [HttpPost("aggregate")]
    public Task<IActionResult> Aggregate([FromBody] AggregateQuestionsRequest request, CancellationToken ct)
        => Execute(async () =>
        {
            var row = await operations.AggregateAsync(request, Actor(), ct);
            return Created($"/umbraco/management/api/v1/antc/questions/{row.Id}", row);
        });

    [HttpDelete("{id:long}")]
    public Task<IActionResult> Delete(long id, [FromQuery, BindRequired] long reviewVersion, CancellationToken ct)
        => Execute(async () => Ok(await operations.DeleteAsync([new(id, reviewVersion)], Actor(), ct)));

    [HttpPost("bulk-delete")]
    public Task<IActionResult> DeleteMany([FromBody] DeleteQuestionsRequest request, CancellationToken ct)
        => Execute(async () => Ok(await operations.DeleteAsync(request.Items, Actor(), ct)));

    [HttpGet("retention")]
    public Task<IActionResult> GetRetention(CancellationToken ct)
        => Execute(async () => Ok(await retention.GetAsync(ct)));

    [HttpPut("retention")]
    public Task<IActionResult> SaveRetention([FromBody] QuestionRetentionSettings request, CancellationToken ct)
        => Execute(async () => Ok(await retention.SaveAsync(request, Actor(), ct)));

    [HttpPost("retention/run")]
    public Task<IActionResult> RunRetention([FromBody] QuestionRetentionRun request, CancellationToken ct)
        => Execute(async () => Ok(await retention.RunAsync(request.ReviewVersion, Actor(), ct)));

    private string Actor()
    {
        string actor = CurrentUser(security).Username;
        return actor.Length > 100 ? actor[..100] : actor;
    }

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (QuestionModerationException error)
        {
            int status = error.Code switch { "NOT_FOUND" => 404, "CONFLICT" => 409, _ => 400 };
            return StatusCode(status, new { error = new { code = error.Code, message = error.Message, fields = error.Fields } });
        }
    }
}
