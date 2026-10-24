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
    public async Task ReturnsEveryContestAndFlagsAllButTenNearestCurrentAsFar()
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
        Assert.Equal(12, result.Count);
        Assert.Equal("Month 0", Assert.Single(result, x => x.State == "now").Name);
        var near = result.Where(x => !x.Far).ToList();
        Assert.Equal(10, near.Count);
        Assert.Equal("Month -3", near[0].Name);
        Assert.Equal("Month 6", near[^1].Name);
        Assert.Equal(new[] { "Month -4", "Month 7" }, result.Where(x => x.Far).Select(x => x.Name));
        Assert.Equal(2027, result[^1].StartAt.Year);
    }

    [Fact]
    public async Task FewContestsAreNeverFar()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        for (var month = -2; month <= 3; month++)
            db.ContestCampaigns.Add(new() { Name = $"Month {month}", IsActive = true, StartAt = Now.AddMonths(month).AddDays(-1), EndAt = Now.AddMonths(month).AddDays(1) });
        await db.SaveChangesAsync();
        Assert.All(await new ContestScheduleService(db, new Clock()).GetAsync(), x => Assert.False(x.Far));
    }
}
