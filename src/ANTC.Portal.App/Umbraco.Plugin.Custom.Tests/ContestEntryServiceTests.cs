using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestEntryServiceTests
{
    [Fact]
    public void ContestWithoutBothTimeBoundaries_IsClosed()
    {
        var settings = new ContestSettings(null, null, 2);

        Assert.False(settings.IsOpenAt(DateTimeOffset.UtcNow));
    }

    [Fact]
    public async Task TenConcurrentRequests_ForSamePhone_CreateExactlyTwoEntries()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-contest-{Guid.NewGuid():N}.db");
        try
        {
            await using (AppDbContext setup = CreateDb(databasePath))
            {
                await setup.Database.EnsureCreatedAsync();
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

            Assert.Equal(2, results.Count(x => x));
            await using AppDbContext verify = CreateDb(databasePath);
            Entry[] entries = await verify.Entries.OrderBy(x => x.AttemptNo).ToArrayAsync();
            Assert.Equal(new int?[] { 1, 2 }, entries.Select(x => x.AttemptNo));
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
            new FixedSettingsProvider(),
            Options.Create(new ContestSecurityOptions { IpHashSalt = "test-salt" }),
            TimeProvider.System);

    private sealed class FixedSettingsProvider : IContestSettingsProvider
    {
        public ContestSettings GetCurrent() =>
            new(DateTimeOffset.UtcNow.AddHours(-1), DateTimeOffset.UtcNow.AddHours(1), 2);
    }
}
