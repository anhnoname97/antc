using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestsControllerTests
{
    private static readonly DateTime Now = new(2026, 10, 18, 3, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Schedule_Empty_ReturnsThreeEmptyArrays()
    {
        ContestsController controller = Create(new ContestSchedule(Now, [], [], []));

        OkObjectResult result = Assert.IsType<OkObjectResult>(await controller.Schedule());
        ContestScheduleResponse body = Assert.IsType<ContestScheduleResponse>(result.Value);

        Assert.Equal("2026-10-18T03:00:00Z", body.ServerTime);
        Assert.Empty(body.Ongoing);
        Assert.Empty(body.Upcoming);
        Assert.Empty(body.Ended);
        Assert.Equal("public, max-age=60", controller.Response.Headers.CacheControl);
    }

    [Fact]
    public async Task Schedule_MapsContestFields()
    {
        var info = new ContestInfo(3, "Việc làm", "Mô tả", Now.AddDays(-1), Now.AddDays(5), 2, 24, 1m, "vieclam",
            [new ContestExamTopic("5", 5, "Chuyên đề 5", 4)], ["A1", "A2", "A3", "A4"], Now);
        ContestsController controller = Create(new ContestSchedule(Now, [info], [], []));

        OkObjectResult result = Assert.IsType<OkObjectResult>(await controller.Schedule());
        ContestScheduleItemDto item = Assert.Single(Assert.IsType<ContestScheduleResponse>(result.Value).Ongoing);

        Assert.Equal("2026-10-17T03:00:00Z", item.StartAt);
        Assert.Equal("2026-10-23T03:00:00Z", item.EndAt);
        Assert.Equal("2026-10-24T03:00:00Z", item.SubmitUntil);
        Assert.Equal(4, item.QuestionCount);
        Assert.Equal("vieclam", item.FocusArea);
        Assert.Equal(4, Assert.Single(item.Topics).Count);
    }

    private static ContestsController Create(ContestSchedule schedule) =>
        new(new FakeCatalog(schedule), new FixedClock())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(Now);
    }

    private sealed class FakeCatalog(ContestSchedule schedule) : IContestCatalog
    {
        public Task<ContestInfo?> GetAsync(long id, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
        public Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken cancellationToken = default) =>
            Task.FromResult(schedule);
        public Task<ContestInfo?> GetCurrentAsync(CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
