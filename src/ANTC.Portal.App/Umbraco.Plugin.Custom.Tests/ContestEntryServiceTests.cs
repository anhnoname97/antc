using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

/// <summary>Kiem thu API-01 (ContestEntryService) theo cuoc thi.</summary>
public class ContestEntryServiceTests
{
    [Fact]
    public async Task CreateEntry_WhenContestHasNotStarted_ReturnsContestClosed()
    {
        await WithDb(async db =>
        {
            long id = await SeedContestAsync(db, start: DateTime.UtcNow.AddHours(1), end: DateTime.UtcNow.AddHours(2));
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(Anon(id), "127.0.0.1");

            Assert.Equal("CONTEST_CLOSED", result.Error!.Code);
            Assert.Empty(await db.Entries.ToArrayAsync());
        });
    }

    [Fact]
    public async Task CreateEntry_WhenContestHasEnded_ReturnsContestClosed()
    {
        await WithDb(async db =>
        {
            long id = await SeedContestAsync(db, start: DateTime.UtcNow.AddHours(-2), end: DateTime.UtcNow.AddHours(-1));
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(Anon(id), "127.0.0.1");

            Assert.Equal("CONTEST_CLOSED", result.Error!.Code);
        });
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0L)]
    [InlineData(-5L)]
    public async Task CreateEntry_WithoutPositiveContestId_IsValidationError(long? contestId)
    {
        await WithDb(async db =>
        {
            await SeedContestAsync(db);
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(Anon(contestId), "127.0.0.1");

            Assert.Equal("VALIDATION", result.Error!.Code);
            Assert.Contains("contestId", result.Error.Fields!.Keys);
        });
    }

    [Fact]
    public async Task CreateEntry_UnknownOrInactiveContest_ReturnsContestNotFound()
    {
        await WithDb(async db =>
        {
            long inactive = await SeedContestAsync(db, active: false);
            ContestEntryService service = CreateService(db);

            Assert.Equal("CONTEST_NOT_FOUND", (await service.CreateAsync(Anon(inactive), "127.0.0.1")).Error!.Code);
            Assert.Equal("CONTEST_NOT_FOUND", (await service.CreateAsync(Anon(9999), "127.0.0.1")).Error!.Code);
            Assert.Empty(await db.Entries.ToArrayAsync());
        });
    }

    // Thu tu kiem tra R5: du lieu ca nhan sai (400) dung truoc cuoc khong co (404)
    [Fact]
    public async Task CreateEntry_InvalidPersonalData_IsReportedBeforeUnknownContest()
    {
        await WithDb(async db =>
        {
            ContestEntryService service = CreateService(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(9999, EntryModes.Named, "", "abc", null, null), "127.0.0.1");

            Assert.Equal("VALIDATION", result.Error!.Code);
        });
    }

    // Hai cuoc khac nhau, cung so: moi cuoc co luot rieng, attemptNo tinh theo cuoc
    [Fact]
    public async Task SamePhone_InTwoContests_GetsTwoAttemptsInEach()
    {
        await WithDb(async db =>
        {
            long a = await SeedContestAsync(db);
            long b = await SeedContestAsync(db);
            ContestEntryService service = CreateService(db);

            var results = new List<CreateEntryResult>();
            foreach (long id in new[] { a, a, b, b, a, b })
            {
                results.Add(await service.CreateAsync(Named(id, "0912345678"), "127.0.0.1"));
            }

            Assert.Equal(new int?[] { 1, 2, 1, 2 }, results.Take(4).Select(x => x.Entry!.AttemptNo));
            Assert.Equal(new[] { a, a, b, b }, results.Take(4).Select(x => x.Entry!.ContestId));
            Assert.Equal("ATTEMPT_LIMIT", results[4].Error!.Code);
            Assert.Equal("ATTEMPT_LIMIT", results[5].Error!.Code);
            Assert.Equal(2, await db.Entries.CountAsync(e => e.ContestId == a));
            Assert.Equal(2, await db.Entries.CountAsync(e => e.ContestId == b));
        });
    }

    // maxAttempts va thong diep lay tu cuoc, khong viet cung
    [Fact]
    public async Task AttemptLimit_UsesContestMaxAttempts()
    {
        await WithDb(async db =>
        {
            long id = await SeedContestAsync(db, maxAttempts: 1);
            ContestEntryService service = CreateService(db);

            CreateEntryResult first = await service.CreateAsync(Named(id, "0912345678"), "127.0.0.1");
            CreateEntryResult second = await service.CreateAsync(Named(id, "0912345678"), "127.0.0.1");

            Assert.Equal(1, first.Entry!.MaxAttempts);
            Assert.Equal("ATTEMPT_LIMIT", second.Error!.Code);
            Assert.Equal("Số 0912345678 đã dùng hết 1 lượt của cuộc thi này.", second.Error.Message);
        });
    }

    [Fact]
    public async Task TenConcurrentRequests_ForSamePhone_CreateExactlyTwoEntries()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-contest-{Guid.NewGuid():N}.db");
        long contestId;
        try
        {
            await using (AppDbContext setup = CreateDb(databasePath))
            {
                await setup.Database.EnsureCreatedAsync();
                contestId = await SeedContestAsync(setup);
            }

            var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            Task<bool>[] requests = Enumerable.Range(0, 10).Select(async _ =>
            {
                await start.Task;
                await using AppDbContext db = CreateDb(databasePath);
                ContestEntryService service = CreateService(db);
                CreateEntryResult result = await service.CreateAsync(
                    Named(contestId, "0912345678"),
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
            Assert.All(entries, x => Assert.Equal(contestId, x.ContestId));
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
            long id = await SeedContestAsync(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(id, EntryModes.Anon, null, null, null, null),
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
            long id = await SeedContestAsync(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(id, EntryModes.Anon, null, null, null, null),
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
            long id = await SeedContestAsync(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(id, EntryModes.Named, "Nguyễn Văn An", input, null, true),
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
            long id = await SeedContestAsync(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(id, EntryModes.Named, "Nguyễn Văn An", "0912345678", null, null),
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
            long id = await SeedContestAsync(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(id, EntryModes.Anon, "", "0912345678", "Don vi", true),
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
            long id = await SeedContestAsync(db);

            CreateEntryResult result = await service.CreateAsync(
                new CreateEntryRequest(id, EntryModes.Anon, null, null, null, null),
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

    private static CreateEntryRequest Anon(long? contestId) => new(contestId, EntryModes.Anon, null, null, null, null);

    private static CreateEntryRequest Named(long contestId, string phone) =>
        new(contestId, EntryModes.Named, "Nguyễn Văn An", phone, null, true);

    // Mac dinh: cuoc dang dien ra, 2 luot
    private static async Task<long> SeedContestAsync(
        AppDbContext db, DateTime? start = null, DateTime? end = null, bool active = true, int maxAttempts = 2)
    {
        var campaign = new ContestCampaign
        {
            Name = "Cuộc thi thử",
            IsActive = active,
            StartAt = start ?? DateTime.UtcNow.AddHours(-1),
            EndAt = end ?? DateTime.UtcNow.AddHours(1),
            MaxAttempts = maxAttempts,
        };
        db.ContestCampaigns.Add(campaign);
        await db.SaveChangesAsync();
        return campaign.Id;
    }

    private sealed class EmptyBank : IQuestionBank
    {
        public QuestionBankSnapshot Current { get; } = new();
        public void Reload() { }
    }

    private static ContestEntryService CreateService(AppDbContext db, string? salt = "test-salt")
    {
        var values = new Dictionary<string, string?>();
        if (salt is not null)
        {
            values[ContestEntryService.IpHashSaltKey] = salt;
        }

        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        return new ContestEntryService(db, new ContestCatalog(db, new EmptyBank(), TimeProvider.System), TimeProvider.System, config);
    }
}
