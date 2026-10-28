using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestPromotionServiceTests
{
    [Theory]
    [InlineData("2026-09-30T16:59:59Z", 1)]
    [InlineData("2026-09-30T17:00:00Z", 1)]
    [InlineData("2026-10-31T16:59:59Z", 1)]
    [InlineData("2026-10-31T17:00:00Z", 2)]
    [InlineData("2026-11-15T00:00:00Z", 2)]
    [InlineData("2026-12-01T00:00:00Z", 2)]
    public async Task UsesServerClock_AndFallsForwardAcrossMonths(string instant, long expected)
    {
        var clock = new Clock(DateTimeOffset.Parse(instant));
        var catalog = new Catalog();
        var result = await new ContestPromotionService(catalog, clock).GetAsync();
        Assert.Equal(expected, result?.Id);
        Assert.Equal(clock.GetUtcNow().UtcDateTime, catalog.LastTime);
    }

    [Fact]
    public async Task DoesNotAdvertiseEndedContests_AndSharesSelectionWithinRequest()
    {
        var catalog = new Catalog();
        var clock = new Clock(DateTimeOffset.Parse("2027-01-01T00:00:00Z"));
        var service = new ContestPromotionService(catalog, clock);
        Assert.Null(await service.GetAsync());
        Assert.Null(await service.GetAsync());
        Assert.Equal(1, catalog.Calls);
    }

    [Fact]
    public async Task UpcomingIsNotOpenForRegistration()
    {
        var clock = new Clock(DateTimeOffset.Parse("2026-11-15T00:00:00Z"));
        var service = new ContestPromotionService(new Catalog(), clock);
        var result = await service.GetAsync();
        Assert.NotNull(result);
        Assert.True(service.IsUpcoming(result));
        Assert.Equal("vieclam", result.FocusArea);
        Assert.Equal(3, result.MaxAttempts);
    }

    private sealed class Clock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class Catalog : IContestCatalog
    {
        public int Calls { get; private set; }
        public DateTime LastTime { get; private set; }
        private static ContestInfo Contest(long id, string start, string end) => new(id, "Việc làm", null,
            DateTimeOffset.Parse(start).UtcDateTime, DateTimeOffset.Parse(end).UtcDateTime,
            3, 24, 1, "vieclam", [], [], DateTime.UnixEpoch);
        private readonly ContestInfo[] contests = [
            Contest(1, "2026-09-30T17:00:00Z", "2026-10-31T17:00:00Z"),
            Contest(2, "2026-12-01T00:00:00Z", "2027-01-01T00:00:00Z")];
        public Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken cancellationToken = default)
        {
            Calls++;
            LastTime = now;
            return Task.FromResult(new ContestSchedule(now,
                contests.Where(c => c.StatusAt(now) == ContestState.Ongoing).ToArray(),
                contests.Where(c => c.StatusAt(now) == ContestState.Upcoming).Reverse().ToArray(),
                contests.Where(c => c.StatusAt(now) == ContestState.Ended).ToArray()));
        }
        public Task<ContestInfo?> GetAsync(long id, CancellationToken cancellationToken = default) => Task.FromResult(contests.FirstOrDefault(c => c.Id == id));
        public Task<ContestInfo?> GetCurrentAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
