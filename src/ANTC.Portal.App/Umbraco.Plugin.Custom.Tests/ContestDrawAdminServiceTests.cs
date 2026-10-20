using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestDrawAdminServiceTests
{
    [Fact]
    public async Task CreateDraw_SelectsEntriesFromRequestedContestOnly()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        DateTime now = DateTime.UtcNow;
        var first = new ContestCampaign { Name = "Cuộc thi A", StartAt = now.AddDays(-1), EndAt = now.AddDays(1), CreatedAt = now, UpdatedAt = now };
        var second = new ContestCampaign { Name = "Cuộc thi B", StartAt = now.AddDays(-1), EndAt = now.AddDays(1), CreatedAt = now, UpdatedAt = now };
        db.ContestCampaigns.AddRange(first, second);
        await db.SaveChangesAsync();
        db.Entries.AddRange(
            Entry(first.Id, "AD-FIRST1", 'a'),
            Entry(second.Id, "AD-SECOND", 'b'));
        await db.SaveChangesAsync();

        var service = new ContestAdminService(db, TimeProvider.System);
        DrawAdminDto result = await service.CreateDrawAsync(new SaveDrawRequest(5, 10, false, null, first.Id), "admin", default);

        Assert.Equal(first.Id, result.ContestId);
        Assert.Equal("Cuộc thi A", result.ContestName);
        Assert.Equal("AD-FIRST1", Assert.Single(result.Winners).Code);
        Assert.Equal(1, result.EligibleCount);
    }

    private static Entry Entry(long contestId, string code, char hash) => new()
    {
        ContestId = contestId,
        Code = code,
        TokenHash = new string(hash, 64),
        Mode = EntryModes.Named,
        FullName = code,
        Phone = "0912345678",
        Status = EntryStatuses.Submitted,
        Score = 10,
        CreatedAt = DateTime.UtcNow,
    };
}
