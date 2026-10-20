using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestScheduleServiceTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 5, 0, 0, DateTimeKind.Utc);
    private sealed class Clock : TimeProvider { public override DateTimeOffset GetUtcNow() => new(Now); }

    [Fact]
    public async Task CalendarUsesServerTimeAndExcludesDisabledCampaigns()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        Assert.Empty(await new ContestScheduleService(db, new Clock()).GetAsync());
        db.ContestCampaigns.AddRange(
            new() { Name = "Past", IsActive = true, StartAt = Now.AddMonths(-1), EndAt = Now.AddSeconds(-1) },
            new() { Name = "Starts now", IsActive = true, StartAt = Now, EndAt = Now.AddDays(2) },
            new() { Name = "Ends now", IsActive = true, StartAt = Now.AddDays(-1), EndAt = Now },
            new() { Name = "Future", IsActive = true, StartAt = Now.AddMonths(1), EndAt = Now.AddMonths(2) },
            new() { Name = "Disabled", IsActive = false, StartAt = Now, EndAt = Now.AddDays(1) });
        await db.SaveChangesAsync();
        var result = await new ContestScheduleService(db, new Clock()).GetAsync();
        Assert.Equal(new[] { "Past", "Ends now", "Starts now", "Future" }, result.Select(x => x.Name));
        Assert.Equal(new[] { "past", "past", "now", "soon" }, result.Select(x => x.State));
    }

    [Fact]
    public async Task EightContestWindowIncludesCurrentAndUpcomingAcrossYearBoundary()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        for (var month = -4; month <= 7; month++)
            db.ContestCampaigns.Add(new() { Name = $"Month {month}", IsActive = true,
                StartAt = Now.AddMonths(month).AddDays(-1), EndAt = Now.AddMonths(month).AddDays(1) });
        await db.SaveChangesAsync();
        var result = await new ContestScheduleService(db, new Clock()).GetAsync();
        Assert.Equal(8, result.Count);
        Assert.Equal("Month -2", result[0].Name);
        Assert.Equal("Month 0", Assert.Single(result, x => x.State == "now").Name);
        Assert.Equal("Month 5", result[^1].Name);
        Assert.Equal(2027, result[^1].StartAt.Year);
    }
}
