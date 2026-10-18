using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("api/v1/contests")]
public class ContestsController(IContestCatalog catalog, TimeProvider clock) : ControllerBase
{
    /// <summary>
    /// API-07: lich cuoc thi cong khai (chi cuoc is_active): ongoing, upcoming, ended.
    /// Cung nguon IContestCatalog voi thanh thong bao tren trang.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<ContestScheduleResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Schedule(CancellationToken cancellationToken = default)
    {
        DateTime now = clock.GetUtcNow().UtcDateTime;
        ContestSchedule schedule = await catalog.GetScheduleAsync(now, cancellationToken);
        Response.Headers.CacheControl = "public, max-age=60";
        return Ok(new ContestScheduleResponse(Iso(schedule.ServerTime),
            schedule.Ongoing.Select(ToDto).ToList(),
            schedule.Upcoming.Select(ToDto).ToList(),
            schedule.Ended.Select(ToDto).ToList()));
    }

    private static ContestScheduleItemDto ToDto(ContestInfo c) => new(
        c.Id, c.Name, c.Description, Iso(c.StartAt), Iso(c.EndAt), Iso(c.SubmitUntil), c.MaxAttempts,
        c.QuestionCount, c.Topics.Select(t => new ContestScheduleTopicDto(t.Cd, t.Title, t.Count)).ToList(),
        c.FocusArea);

    /// <summary>Thoi diem UTC dang ISO co hau to Z.</summary>
    private static string Iso(DateTime utc) =>
        DateTime.SpecifyKind(utc, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'");
}
