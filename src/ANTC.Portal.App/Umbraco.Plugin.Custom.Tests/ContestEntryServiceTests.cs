using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestEntryServiceTests
{
    [Fact]
    public async Task NoActiveCampaign_ReturnsContestClosed()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-contest-{Guid.NewGuid():N}.db");
        try
        {
            await using AppDbContext db = CreateDb(databasePath);
            await db.Database.EnsureCreatedAsync();
            await Assert.ThrowsAsync<ContestClosedException>(() => CreateService(db).CreateAsync(
                new ContestEntryRegistration(EntryModes.Anon, null, null, null, false), "127.0.0.1"));
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    [Theory]
    [InlineData(2, 2)]
    [InlineData(0, 10)]
    public async Task TenConcurrentRequests_ForSamePhone_RespectLimitOrUnlimited(int limit, int expected)
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-contest-{Guid.NewGuid():N}.db");
        try
        {
            await using (AppDbContext setup = CreateDb(databasePath))
            {
                await setup.Database.EnsureCreatedAsync();
                var contest=ActiveContest();contest.MaxAttempts=limit;
                setup.ContestCampaigns.Add(contest);
                await setup.SaveChangesAsync();
            }

            var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            Task<bool>[] requests = Enumerable.Range(0, 10).Select(async _ =>
            {
                await start.Task;
                await using AppDbContext db = CreateDb(databasePath);
                IContestEntryService service = CreateService(db);
                try
                {
                    await service.CreateAsync(
                        new ContestEntryRegistration(EntryModes.Named, "Nguyễn Văn An", "0912345678", null, true),
                        "127.0.0.1");
                    return true;
                }
                catch (AttemptLimitException)
                {
                    return false;
                }
            }).ToArray();

            start.SetResult();
            bool[] results = await Task.WhenAll(requests);

            Assert.Equal(expected, results.Count(x => x));
            await using AppDbContext verify = CreateDb(databasePath);
            Entry[] entries = await verify.Entries.OrderBy(x => x.AttemptNo).ToArrayAsync();
            Assert.Equal(Enumerable.Range(1, expected).Select(n => (int?)n), entries.Select(x => x.AttemptNo));
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task CreateEntry_ReturnsTokenOnce_AndStoresOnlyItsHash()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-contest-{Guid.NewGuid():N}.db");
        try
        {
            await using AppDbContext db = CreateDb(databasePath);
            await db.Database.EnsureCreatedAsync();
            db.ContestCampaigns.Add(ActiveContest());
            await db.SaveChangesAsync();
            IContestEntryService service = CreateService(db);

            ContestEntryCreationResult result = await service.CreateAsync(
                new ContestEntryRegistration(EntryModes.Anon, null, null, null, false),
                "127.0.0.1");
            Entry stored = await db.Entries.SingleAsync();

            Assert.Matches("^AD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$", result.Code);
            Assert.Equal(43, result.Token.Length);
            Assert.DoesNotContain(result.Token, stored.TokenHash, StringComparison.Ordinal);
            Assert.Equal(64, stored.TokenHash.Length);
            Assert.Null(stored.Phone);
            Assert.Null(stored.AttemptNo);
            Assert.Null(stored.ConsentAt);
            Assert.Equal(64, stored.IpHash!.Length);
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task AttemptLimit_IsCountedPerContest()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-contest-{Guid.NewGuid():N}.db");
        try
        {
            await using AppDbContext db = CreateDb(databasePath);
            await db.Database.EnsureCreatedAsync();
            ContestCampaign oldContest = ActiveContest();
            oldContest.Name = "Cuộc thi cũ";
            oldContest.IsActive = false;
            ContestCampaign currentContest = ActiveContest();
            db.ContestCampaigns.AddRange(oldContest, currentContest);
            await db.SaveChangesAsync();
            db.Entries.AddRange(
                new Entry { ContestId = oldContest.Id, Code = "AD-OLD001", TokenHash = new string('a', 64), Mode = EntryModes.Named, Phone = "0912345678", CreatedAt = DateTime.UtcNow },
                new Entry { ContestId = oldContest.Id, Code = "AD-OLD002", TokenHash = new string('b', 64), Mode = EntryModes.Named, Phone = "0912345678", CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();

            ContestEntryCreationResult result = await CreateService(db).CreateAsync(
                new ContestEntryRegistration(EntryModes.Named, "Nguyễn Văn An", "0912345678", null, true), "127.0.0.1");

            Assert.Equal(1, result.AttemptNo);
            Assert.Equal(currentContest.Id, (await db.Entries.SingleAsync(x => x.Code == result.Code)).ContestId);
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    private static AppDbContext CreateDb(string path)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={path};Default Timeout=30")
            .Options;
        return new AppDbContext(options);
    }

    private static ContestEntryService CreateService(AppDbContext db) =>
        new(
            db,
            Options.Create(new ContestSecurityOptions { IpHashSalt = "test-salt" }),
            TimeProvider.System);

    private static ContestCampaign ActiveContest() => new()
    {
        Name = "Cuộc thi đang diễn ra",
        StartAt = DateTime.UtcNow.AddHours(-1),
        EndAt = DateTime.UtcNow.AddHours(1),
        MaxAttempts = 2,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };
}
