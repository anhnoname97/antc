using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

/// <summary>Kiem thu API-01 (ContestEntryService) va quy tac mo/dong cuoc thi cua ContestSettingsService.</summary>
public class ContestEntryServiceTests
{
    [Fact]
    public void ContestWithoutBothTimeBoundaries_IsClosed()
    {
        var service = new ContestSettingsService(null!, null!, null!, NullLogger<ContestSettingsService>.Instance);
        var settings = new ContestSettings(null, null, 2);

        Assert.Equal(ContestStatus.Upcoming, service.GetStatus(settings, DateTime.UtcNow));
    }

    [Fact]
    public async Task CreateEntry_WhenContestIsClosed_ReturnsContestClosed()
    {
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db, new FixedSettings(new ContestSettings(null, null, 2)));

            CreateEntryResult result = await service.CreateAsync(new CreateEntryRequest(EntryModes.Anon, null, null, null, null), "127.0.0.1");

            Assert.Equal("CONTEST_CLOSED", result.Error!.Code);
            Assert.Empty(await db.Entries.ToArrayAsync());
        });
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
                ContestEntryService service = CreateService(db);
                CreateEntryResult result = await service.CreateAsync(
                    new CreateEntryRequest(EntryModes.Named, "Nguyễn Văn An", "0912345678", null, true),
                    "127.0.0.1");
                if (result.Error is { } error)
                {
                    Assert.Equal("ATTEMPT_LIMIT", error.Code);
                }

                return result.Entry is not null;
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
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(EntryModes.Anon, null, null, null, null),
                "127.0.0.1");
            Entry stored = await db.Entries.SingleAsync();

            CreatedEntry created = result.Entry!;
            Assert.Matches("^AD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$", created.Code);
            Assert.Equal(43, created.Token.Length);
            Assert.DoesNotContain(created.Token, stored.TokenHash, StringComparison.Ordinal);
            Assert.Equal(64, stored.TokenHash.Length);
            Assert.Null(stored.Phone);
            Assert.Null(stored.AttemptNo);
            Assert.Null(stored.ConsentAt);
            Assert.Equal(64, stored.IpHash!.Length);
        });
    }

    // QD-009: thieu muoi bam IP thi van cho dang ky, ip_hash de trong
    [Fact]
    public async Task CreateEntry_WithoutIpHashSalt_StillRegisters_AndLeavesIpHashEmpty()
    {
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db, salt: null);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(EntryModes.Anon, null, null, null, null),
                "127.0.0.1");

            Assert.NotNull(result.Entry);
            Assert.Null((await db.Entries.SingleAsync()).IpHash);
        });
    }

    [Theory]
    [InlineData("+84 912 345 678", "0912345678")]
    [InlineData("0912.345.678", "0912345678")]
    [InlineData("0912345678", "0912345678")]
    public async Task NamedEntry_NormalizesEquivalentPhoneNumbers(string input, string expected)
    {
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(EntryModes.Named, "Nguyễn Văn An", input, null, true),
                "127.0.0.1");

            Assert.NotNull(result.Entry);
            Assert.Equal(expected, (await db.Entries.SingleAsync()).Phone);
        });
    }

    [Fact]
    public async Task NamedEntry_WithoutConsent_IsRejected_WithFieldError()
    {
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(EntryModes.Named, "Nguyễn Văn An", "0912345678", null, null),
                "127.0.0.1");

            Assert.Equal("VALIDATION", result.Error!.Code);
            Assert.Contains("consent", result.Error.Fields!.Keys);
            Assert.Empty(await db.Entries.ToArrayAsync());
        });
    }

    // Ban origin/main tu choi che do an danh khi gui truong ca nhan (ke ca chuoi rong).
    // API-01 cua dev khong tu choi ma bo qua cac truong nay; ca kiem thu giu y nghia: khong luu du lieu ca nhan nao.
    [Fact]
    public async Task AnonymousEntry_IgnoresEveryPersonalField_EvenWhenSent()
    {
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(EntryModes.Anon, "", "0912345678", "Don vi", true),
                "127.0.0.1");
            Entry stored = await db.Entries.SingleAsync();

            Assert.NotNull(result.Entry);
            Assert.Null(stored.FullName);
            Assert.Null(stored.Phone);
            Assert.Null(stored.Org);
            Assert.Null(stored.ConsentAt);
        });
    }

    [Fact]
    public async Task AnonymousEntry_WithoutPersonalData_IsValid()
    {
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(EntryModes.Anon, null, null, null, null),
                "127.0.0.1");

            Assert.Equal(EntryModes.Anon, result.Entry!.Mode);
            Assert.Null((await db.Entries.SingleAsync()).Phone);
        });
    }

    private static async Task WithDb(Func<AppDbContext, Task> body)
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-contest-{Guid.NewGuid():N}.db");
        try
        {
            await using AppDbContext db = CreateDb(databasePath);
            await db.Database.EnsureCreatedAsync();
            await body(db);
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

    private static ContestEntryService CreateService(AppDbContext db, IContestSettings? settings = null, string? salt = "test-salt")
    {
        var values = new Dictionary<string, string?>();
        if (salt is not null)
        {
            values[ContestEntryService.IpHashSaltKey] = salt;
        }

        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        return new ContestEntryService(db, settings ?? new FixedSettings(OpenSettings()), config);
    }

    // Start/End la gio Viet Nam (UTC+7), khong kem mui gio
    private static ContestSettings OpenSettings() =>
        new(DateTime.UtcNow.AddHours(7 - 1), DateTime.UtcNow.AddHours(7 + 1), 2);

    // Cai dat co dinh; trang thai tinh bang ContestSettingsService that
    private sealed class FixedSettings(ContestSettings settings) : IContestSettings
    {
        private readonly ContestSettingsService _rules =
            new(null!, null!, null!, NullLogger<ContestSettingsService>.Instance);

        public Task<ContestSettings?> GetAsync() => Task.FromResult<ContestSettings?>(settings);

        public ContestSettings Read(IPublishedContent page) => settings;

        public ContestStatus GetStatus(ContestSettings s, DateTime nowUtc) => _rules.GetStatus(s, nowUtc);

        public bool IsSubmitOpen(ContestSettings s, DateTime nowUtc) => _rules.IsSubmitOpen(s, nowUtc);
    }
}
