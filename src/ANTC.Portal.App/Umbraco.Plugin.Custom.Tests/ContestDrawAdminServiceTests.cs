using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
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
        DrawAdminDto result = await service.CreateDrawAsync(new SaveDrawRequest(5, 1, false, null, first.Id), "admin", default);

        Assert.Equal(first.Id, result.ContestId);
        Assert.Equal("Cuộc thi A", result.ContestName);
        Assert.Equal("AD-FIRST1", Assert.Single(result.Winners).Code);
        Assert.Equal(1, result.EligibleCount);
    }

    [Fact]
    public async Task DeduplicatesByPhone_HighestScoreThenEarliestSubmissionThenId_AndExcludesIneligibleEntries()
    {
        await using var f = await Fixture.Create();
        var early = f.Person("0912345678", 12, -5);
        f.Person("0912345678", 10, -10); f.Person("0912345678", 12, -1); f.Person("0912345678", 12, -5);
        f.Person("0987654321", 11);
        f.Person("0900000001", 9);
        f.Person(null, 20); f.Person("bad-phone", 20);
        f.Person("0900000002", 20).Status = EntryStatuses.InProgress;
        f.Person("0900000003", 20).ContestId = f.OtherId;
        await f.Db.SaveChangesAsync();
        var preview = await f.Service.PreviewDrawAsync(new(f.ContestId, 10), default);
        Assert.Equal(2, preview.EligibleCount); Assert.Equal(12, preview.SuggestedMinScore);
        Assert.Equal(3, preview.TotalCandidates); Assert.Equal(3, preview.Scores.Sum(x => x.Count));
        var suggested = await f.Service.PreviewDrawAsync(new(f.ContestId), default);
        Assert.Equal(12, suggested.MinScore); Assert.Equal(1, suggested.EligibleCount);
        var draw = await f.Service.CreateDrawAsync(f.Request(10, 2), "actor", default);
        Assert.Equal(2, draw.Winners.Count); Assert.Equal(2, draw.Winners.Select(w => w.Phone).Distinct().Count());
        Assert.Contains(draw.Winners, w => w.Code == early.Code);
        Assert.All(draw.Winners, w => Assert.Contains("****", w.Phone));
        var full = (await f.Service.ExportDrawAsync(draw.Id, false, default))!;
        Assert.Contains(full, w => w.Phone == "0912345678" && w.EntryId == early.Id);
    }

    [Fact]
    public async Task ExcludesPreviousWinningPhone_NotOnlyWinningEntry_AndOnlyWithinSameContest()
    {
        await using var f = await Fixture.Create();
        f.Person("0912345678", 10); await f.Db.SaveChangesAsync();
        await f.Service.CreateDrawAsync(f.Request(0, 1), "actor", default);
        f.Person("0912345678", 20); f.Person("0987654321", 15); await f.Db.SaveChangesAsync();
        f.Db.Draws.Add(new Draw { ContestId = f.OtherId, Winners = [new DrawWinner { Rank = 1, Phone = "0987654321" }] });
        await f.Db.SaveChangesAsync();
        Assert.Equal(1, (await f.Service.PreviewDrawAsync(new(f.ContestId, 0, true), default)).EligibleCount);
        var second = await f.Service.CreateDrawAsync(f.Request(0, 1), "actor", default);
        Assert.Equal("098****321", Assert.Single(second.Winners).Phone);
        Assert.Equal(2, (await f.Service.PreviewDrawAsync(new(f.ContestId, 0, false), default)).EligibleCount);
        Assert.Equal(2, (await f.Service.CreateDrawAsync(f.Request(0, 2) with { ExcludePrevious = false }, "actor", default)).Winners.Count);
    }

    [Fact]
    public async Task TooManyWinnersOrNoCandidates_FailsClearlyWithoutSavingAnyDraw()
    {
        await using var f = await Fixture.Create();
        f.Person("0912345678", 10); await f.Db.SaveChangesAsync();
        foreach (var request in new[] { f.Request(0, 2), f.Request(11, 1) })
            Assert.Equal("DRAW_INSUFFICIENT_CANDIDATES", (await Assert.ThrowsAsync<ContestAdminConflictException>(
                () => f.Service.CreateDrawAsync(request, "actor", default))).Code);
        Assert.Empty(await f.Db.Draws.ToListAsync()); Assert.Empty(await f.Db.DrawWinners.ToListAsync());
    }

    [Fact]
    public async Task SnapshotsAndHistorySurviveReopeningDatabase_AndDoNotChangeWithEntries()
    {
        await using var f = await Fixture.Create();
        var person = f.Person("0912345678", 10); person.FullName = "Nguyễn Văn An"; await f.Db.SaveChangesAsync();
        var draw = await f.Service.CreateDrawAsync(f.Request(0, 1), "actor", default);
        person.FullName = "Changed"; person.Phone = "0900000000"; person.Score = 0; await f.Db.SaveChangesAsync();
        await using var reopened = f.Open(); var service = new ContestAdminService(reopened, TimeProvider.System);
        var history = (await service.GetDrawAsync(draw.Id, default))!;
        Assert.Equal("Nguyễn Văn An", Assert.Single(history.Winners).FullName);
        Assert.Equal("091****678", history.Winners[0].Phone);
        var eligible = Assert.Single((await service.ExportDrawAsync(draw.Id, false, default))!);
        var winner = Assert.Single((await service.ExportDrawAsync(draw.Id, true, default))!);
        Assert.Equal("0912345678", eligible.Phone); Assert.Equal("Nguyễn Văn An", eligible.FullName);
        Assert.Equal(10, eligible.Score); Assert.Equal(eligible.Phone, winner.Phone);
        Assert.Equal(eligible.SubmittedAt, winner.SubmittedAt);
        Assert.Equal("DRAW_IMMUTABLE", (await Assert.ThrowsAsync<ContestAdminConflictException>(() => service.UpdateDrawAsync(draw.Id, f.Request(0, 1), default))).Code);
        Assert.Equal("DRAW_IMMUTABLE", (await Assert.ThrowsAsync<ContestAdminConflictException>(() => service.DeleteDrawAsync(draw.Id, default))).Code);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ConcurrentRequests_AreIdempotentOrExcludeEarlierWinnerAtomically(bool sameRequest)
    {
        await using var f = await Fixture.Create();
        f.Person("0912345678", 10); await f.Db.SaveChangesAsync();
        var request = f.Request(0, 1);
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var tasks = Enumerable.Range(0, 2).Select(i => Task.Run(async () =>
        {
            await using var db = f.Open(); var service = new ContestAdminService(db, TimeProvider.System); await start.Task;
            try { return (await service.CreateDrawAsync(request with { RequestId = sameRequest ? request.RequestId : Guid.NewGuid() }, "actor", default)).Id; }
            catch (ContestAdminConflictException e) { Assert.False(sameRequest); Assert.Equal("DRAW_INSUFFICIENT_CANDIDATES", e.Code); return 0L; }
        })).ToArray();
        start.SetResult(); var results = await Task.WhenAll(tasks);
        Assert.Single(await f.Db.Draws.ToListAsync()); Assert.Single(await f.Db.DrawWinners.ToListAsync());
        if (sameRequest) Assert.Equal(results[0], results[1]); else Assert.Single(results.Where(x => x > 0));
        var changed = request with { Note = "Different prize" };
        if (sameRequest) Assert.Equal("DRAW_REQUEST_CHANGED", (await Assert.ThrowsAsync<ContestAdminConflictException>(() => f.Service.CreateDrawAsync(changed, "actor", default))).Code);
    }

    [Fact]
    public void CryptographicSelection_HasNoDuplicatesAndDoesNotMutateThePool()
    {
        int[] pool = Enumerable.Range(0, 100).ToArray();
        Assert.Equal(100, CryptographicLottery.Select(pool, 100).Distinct().Count());
        Assert.Equal(Enumerable.Range(0, 100), pool);
        Assert.Empty(CryptographicLottery.Select(pool, 0));
        Assert.Throws<ArgumentOutOfRangeException>(() => CryptographicLottery.Select(pool, 101));
    }

    [Fact]
    public void TenThousandDrawsOfOneFromOneHundred_AreApproximatelyUniform()
    {
        int[] pool = Enumerable.Range(0, 100).ToArray(), counts = new int[100];
        for (int i = 0; i < 10000; i++) counts[CryptographicLottery.Select(pool, 1)[0]]++;
        double chiSquared = counts.Sum(n => Math.Pow(n - 100, 2) / 100d);
        // Pearson goodness-of-fit, df=99. A conservative rejection boundary avoids flaky
        // tests of a real CSPRNG (upper-tail probability below 1e-7 under uniform sampling).
        Assert.True(chiSquared < 200, $"Chi-square={chiSquared:F2}; expected uniform distribution across 100 people.");
        Assert.All(counts, n => Assert.True(n > 0));
    }

    [Fact]
    public async Task MigrationPreservesLegacyDraws_WithoutInventingEligibleSnapshots()
    {
        string path = Path.Combine(Path.GetTempPath(), $"antc-draw-migration-{Guid.NewGuid():N}.db");
        try
        {
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={path}").Options);
            var migrator = db.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrator>();
            await migrator.MigrateAsync("20261020025539_PublishContestResults");
            await db.Database.ExecuteSqlRawAsync("INSERT INTO draw(created_at,created_by,min_score,winners_requested,eligible_count,exclude_previous) VALUES('2026-10-20','legacy',1,1,10,0)");
            await db.Database.MigrateAsync();
            var service = new ContestAdminService(db, TimeProvider.System);
            var draw = (await service.SearchDrawsAsync(null, 1, 20, default)).Items.Single();
            Assert.False(draw.HasEligibleSnapshot); Assert.Equal(10, draw.EligibleCount);
            Assert.Equal("DRAW_SNAPSHOT_UNAVAILABLE", (await Assert.ThrowsAsync<ContestAdminConflictException>(() => service.ExportDrawAsync(draw.Id, false, default))).Code);
        }
        finally { SqliteConnection.ClearAllPools(); File.Delete(path); }
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private int sequence;
        private readonly string path = Path.Combine(Path.GetTempPath(), $"antc-draw-{Guid.NewGuid():N}.db");
        public AppDbContext Db { get; private set; } = null!;
        public ContestAdminService Service => new(Db, TimeProvider.System);
        public long ContestId { get; private set; }
        public long OtherId { get; private set; }
        public AppDbContext Open() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={path};Default Timeout=15").Options);
        public static async Task<Fixture> Create()
        {
            var f = new Fixture(); f.Db = f.Open(); await f.Db.Database.EnsureCreatedAsync();
            var a = new ContestCampaign { Name = "Cuộc thi A", StartAt = DateTime.UtcNow.AddDays(-2), EndAt = DateTime.UtcNow.AddDays(-1) };
            var b = new ContestCampaign { Name = "Cuộc thi B", StartAt = DateTime.UtcNow.AddDays(-4), EndAt = DateTime.UtcNow.AddDays(-3) };
            f.Db.ContestCampaigns.AddRange(a, b); await f.Db.SaveChangesAsync(); f.ContestId = a.Id; f.OtherId = b.Id; return f;
        }
        public Entry Person(string? phone, int score, int minutes = 0)
        {
            var e = new Entry { ContestId = ContestId, Code = $"AD-{++sequence:D6}", TokenHash = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"), FullName = "Thí sinh thử",
                Phone = phone, Mode = phone is null ? EntryModes.Anon : EntryModes.Named, Score = score, Status = EntryStatuses.Submitted,
                CreatedAt = new DateTime(2026, 10, 1), SubmittedAt = new DateTime(2026, 10, 2).AddMinutes(minutes) };
            Db.Entries.Add(e); return e;
        }
        public SaveDrawRequest Request(int score, int count) => new(score, count, true, "Giải thử", ContestId, Guid.NewGuid());
        public async ValueTask DisposeAsync() { await Db.DisposeAsync(); SqliteConnection.ClearAllPools(); File.Delete(path); }
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
