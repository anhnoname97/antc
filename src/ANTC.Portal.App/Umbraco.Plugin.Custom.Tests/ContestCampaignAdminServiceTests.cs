using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestCampaignAdminServiceTests
{
    [Fact]
    public async Task CreateCampaign_SavesPrizeSelectionsWithIndependentQuantities()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        var first=(await test.Service.SavePrizeAsync(null,new(" first ","Giải nhất","Mô tả"),default))!;
        var second=(await test.Service.SavePrizeAsync(null,new("SECOND","Giải nhì",null),default))!;
        Assert.Equal("FIRST",first.Code);
        var campaign=await test.Service.CreateCampaignAsync(Schedule(10,15) with { Prizes=[new(first.Id,1),new(second.Id,2)] },default);
        Assert.Equal(2,campaign.Prizes!.Count);
        Assert.Equal(2,campaign.Prizes.Single(p=>p.PrizeId==second.Id).Quantity);
        var changed=await test.Service.SaveContestPrizesAsync(campaign.Id,new([new(second.Id,3)],campaign.Revision),default);
        Assert.Equal(campaign.StartAt,changed!.StartAt);
        Assert.Equal(campaign.EndAt,changed.EndAt);
        Assert.Equal(3,Assert.Single(changed.Prizes!).Quantity);
        Assert.Single(await test.Db.ContestQuestions.Where(q=>q.ContestId==campaign.Id).ToListAsync());
        Assert.Equal("PRIZE_CODE_EXISTS",(await Assert.ThrowsAsync<ContestAdminConflictException>(()=>test.Service.SavePrizeAsync(null,new("first","Trùng mã",null),default))).Code);
        await Assert.ThrowsAsync<ContestAdminValidationException>(()=>test.Service.CreateCampaignAsync(Schedule(16,20) with { Prizes=[new(long.MaxValue,1)] },default));
        test.Db.ChangeTracker.Clear();
        Assert.Single(await test.Db.ContestCampaigns.ToListAsync());
    }
    [Theory]
    [InlineData(12, 18, false)] // overlaps the end
    [InlineData(8, 16, false)] // contains the existing contest
    [InlineData(11, 14, false)] // contained by the existing contest
    [InlineData(8, 12, false)] // overlaps the start
    [InlineData(10, 15, false)] // identical
    [InlineData(15, 20, false)] // touches the closing instant
    [InlineData(8, 10, false)] // touches the opening instant
    [InlineData(16, 20, true)]
    [InlineData(5, 9, true)]
    public async Task CreateCampaign_RejectsEveryOverlapButAllowsDisjointDates(int startDay, int endDay, bool allowed)
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        await test.Service.CreateCampaignAsync(Schedule(10, 15), default);
        if (allowed)
        {
            await test.Service.CreateCampaignAsync(Schedule(startDay, endDay), default);
            Assert.Equal(2, await test.Db.ContestCampaigns.CountAsync());
        }
        else
        {
            var error = await Assert.ThrowsAsync<ContestAdminConflictException>(
                () => test.Service.CreateCampaignAsync(Schedule(startDay, endDay), default));
            Assert.Equal("CONTEST_TIME_OVERLAP", error.Code);
            Assert.Single(await test.Db.ContestCampaigns.ToListAsync());
            Assert.Single(await test.Db.ContestQuestions.ToListAsync());
        }
    }

    [Fact]
    public async Task InactiveContestsReserveDates_ButSubmissionGraceDoesNot()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        await test.Service.CreateCampaignAsync(Schedule(10, 15) with { IsActive = false, SubmitGraceHours = 168 }, default);
        var error = await Assert.ThrowsAsync<ContestAdminConflictException>(
            () => test.Service.CreateCampaignAsync(Schedule(12, 18) with { IsActive = false }, default));
        Assert.Equal("CONTEST_TIME_OVERLAP", error.Code);
        await test.Service.CreateCampaignAsync(Schedule(16, 20), default);
        Assert.Equal(2, await test.Db.ContestCampaigns.CountAsync());
    }

    [Fact]
    public async Task UpdateCampaign_ExcludesItself_AndConflictLeavesDatesRevisionAndSnapshotUntouched()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        await test.Service.CreateCampaignAsync(Schedule(10, 15), default);
        var second = await test.Service.CreateCampaignAsync(Schedule(16, 20), default);
        var request = Schedule(16, 20) with { ExpectedRevision = second.Revision, Name = "Tên mới" };
        var unchangedDates = (await test.Service.UpdateCampaignAsync(second.Id, request, default))!;
        Assert.Equal(second.Revision + 1, unchangedDates.Revision);
        var error = await Assert.ThrowsAsync<ContestAdminConflictException>(() => test.Service.UpdateCampaignAsync(second.Id,
            Schedule(12, 18) with { ExpectedRevision = unchangedDates.Revision, Topics = [new SaveContestTopicRequest(2, ["Q-002"])] }, default));
        Assert.Equal("CONTEST_TIME_OVERLAP", error.Code);
        test.Db.ChangeTracker.Clear();
        var saved = (await test.Service.GetCampaignAsync(second.Id, default))!;
        Assert.Equal(unchangedDates.StartAt, saved.StartAt);
        Assert.Equal(unchangedDates.EndAt, saved.EndAt);
        Assert.Equal(unchangedDates.Revision, saved.Revision);
        Assert.Equal("Tên mới", saved.Name);
        Assert.Equal("Q-001", (await test.Db.ContestQuestions.SingleAsync(x => x.ContestId == second.Id)).QuestionCode);
        var moved = await test.Service.UpdateCampaignAsync(second.Id, Schedule(21, 25) with { ExpectedRevision = saved.Revision }, default);
        Assert.Equal(Schedule(21, 25).StartAt, moved!.StartAt);
    }

    [Fact]
    public async Task ScheduleUsesUtcInstants_NotDisplayedOffsets()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        var first = Schedule(10, 15);
        await test.Service.CreateCampaignAsync(first, default);
        var withOffset = first with
        {
            StartAt = DateTimeOffset.Parse("2030-09-10T07:00:00+07:00").UtcDateTime,
            EndAt = DateTimeOffset.Parse("2030-09-15T07:00:00+07:00").UtcDateTime,
        };
        Assert.Equal("CONTEST_TIME_OVERLAP", (await Assert.ThrowsAsync<ContestAdminConflictException>(
            () => test.Service.CreateCampaignAsync(withOffset, default))).Code);
        await test.Service.CreateCampaignAsync(first with { StartAt = first.EndAt.AddTicks(1), EndAt = first.EndAt.AddDays(1) }, default);
    }

    [Fact]
    public async Task OverlappingCreatesAndUpdates_ReturnStandard409FromController()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        await test.Service.CreateCampaignAsync(Schedule(10, 15), default);
        var second = await test.Service.CreateCampaignAsync(Schedule(16, 20), default);
        var controller = new Umbraco.Plugin.Custom.Api.Controllers.ContestAdminController(test.Service);
        var created = await controller.CreateCampaign(Schedule(12, 18), default);
        var updated = await controller.UpdateCampaign(second.Id, Schedule(12, 18), default);
        foreach (var result in new[] { created.Result, updated.Result })
        {
            var conflict = Assert.IsType<Microsoft.AspNetCore.Mvc.ConflictObjectResult>(result);
            Assert.Equal(409, conflict.StatusCode);
            string json = System.Text.Json.JsonSerializer.Serialize(conflict.Value, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
            using var parsed = System.Text.Json.JsonDocument.Parse(json);
            Assert.Equal("CONTEST_TIME_OVERLAP", parsed.RootElement.GetProperty("error").GetProperty("code").GetString());
            Assert.False(string.IsNullOrWhiteSpace(parsed.RootElement.GetProperty("error").GetProperty("message").GetString()));
        }
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ConcurrentCreatesOrUpdates_ForSameWindow_OnlyOneCanWin(bool update)
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        var ids = new List<long>();
        if (update)
        {
            ids.Add((await test.Service.CreateCampaignAsync(Schedule(1, 3), default)).Id);
            ids.Add((await test.Service.CreateCampaignAsync(Schedule(5, 7), default)).Id);
        }
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<bool>[] requests = Enumerable.Range(0, update ? 2 : 5).Select(index => Task.Run(async () =>
        {
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(test.Db.Database.GetConnectionString()).Options);
            var service = new ContestAdminService(db, TimeProvider.System);
            await start.Task;
            try
            {
                if (update) await service.UpdateCampaignAsync(ids[index], Schedule(10, 15) with { ExpectedRevision = 1 }, default);
                else await service.CreateCampaignAsync(Schedule(10, 15), default);
                return true;
            }
            catch (ContestAdminConflictException ex)
            {
                Assert.Equal("CONTEST_TIME_OVERLAP", ex.Code); return false;
            }
        })).ToArray();
        start.SetResult();
        bool[] outcomes = await Task.WhenAll(requests);
        Assert.Single(outcomes.Where(x => x));
        test.Db.ChangeTracker.Clear();
        Assert.Equal(1, await test.Db.ContestCampaigns.CountAsync(x => x.StartAt == Schedule(10, 15).StartAt));
        Assert.Equal(update ? 2 : 1, await test.Db.ContestCampaigns.CountAsync());
    }

    private static SaveContestCampaignRequest Schedule(int startDay, int endDay) => Request(1, "Q-001") with
    {
        StartAt = new DateTime(2030, 9, startDay, 0, 0, 0, DateTimeKind.Utc),
        EndAt = new DateTime(2030, 9, endDay, 0, 0, 0, DateTimeKind.Utc),
    };

    [Fact]
    public async Task CreateCampaign_PersistsSelectedTopicAndQuestions()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();

        ContestCampaignAdminDto result = await test.Service.CreateCampaignAsync(Request(1, "Q-001"), default);

        Assert.Equal(1, result.TopicCount);
        Assert.Equal(1, result.QuestionCount);
        Assert.Single(await test.Db.ContestTopics.ToListAsync());
        Assert.Equal("Q-001", (await test.Db.ContestQuestions.SingleAsync()).QuestionCode);
        Assert.Equal("Câu hỏi Q-001", (await test.Db.ContestQuestions.SingleAsync()).QuestionText);
        Assert.Equal("Chuyên đề 1", (await test.Db.ContestTopics.SingleAsync()).Title);
        Assert.True(result.Topics!.Single(x => x.Id == 1).Questions.Single(x => x.Code == "Q-001").IsSelected);
    }

    [Fact]
    public async Task Snapshot_DoesNotChangeWhenQuestionBankIsEdited()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        ContestCampaignAdminDto created = await test.Service.CreateCampaignAsync(Request(1, "Q-001"), default);
        QuizQuestion question = await test.Db.QuizQuestions.SingleAsync(x => x.Code == "Q-001");
        question.Question = "Nội dung ngân hàng đã sửa";
        question.Answer = "B";
        await test.Db.SaveChangesAsync();
        test.Db.ChangeTracker.Clear();

        ContestQuestion snapshot = await test.Db.ContestQuestions.SingleAsync(x => x.ContestId == created.Id);
        Assert.Equal("Câu hỏi Q-001", snapshot.QuestionText);
        Assert.Equal("A", snapshot.Answer);
    }

    [Fact]
    public async Task CreateCampaign_RejectsInactiveContent()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        (await test.Db.QuizQuestions.SingleAsync(x => x.Code == "Q-001")).IsActive = false;
        await test.Db.SaveChangesAsync();

        ContestAdminValidationException error = await Assert.ThrowsAsync<ContestAdminValidationException>(
            () => test.Service.CreateCampaignAsync(Request(1, "Q-001"), default));

        Assert.Contains("questions", error.Fields);
    }

    [Fact]
    public async Task CreateCampaign_RejectsQuestionFromAnotherTopic()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();

        ContestAdminValidationException error = await Assert.ThrowsAsync<ContestAdminValidationException>(
            () => test.Service.CreateCampaignAsync(Request(1, "Q-002"), default));

        Assert.Contains("questions", error.Fields);
        Assert.Empty(await test.Db.ContestCampaigns.ToListAsync());
    }

    [Fact]
    public async Task UpdateCampaign_ReplacesTreeSelection()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        ContestCampaignAdminDto created = await test.Service.CreateCampaignAsync(Request(1, "Q-001"), default);

        ContestCampaignAdminDto updated = (await test.Service.UpdateCampaignAsync(
            created.Id, Request(2, "Q-002") with { Name = "Cuộc thi đã sửa" }, default))!;

        Assert.Equal("Cuộc thi đã sửa", updated.Name);
        Assert.Equal(2, (await test.Db.ContestTopics.SingleAsync()).TopicId);
        Assert.Equal("Q-002", (await test.Db.ContestQuestions.SingleAsync()).QuestionCode);
    }

    [Fact]
    public async Task ReloadedCampaign_SerializesDatesWithUtcOffset()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        var request = Request(1, "Q-001") with
        {
            StartAt = new DateTime(2026, 10, 1, 16, 0, 0, DateTimeKind.Utc),
            EndAt = new DateTime(2026, 10, 16, 16, 0, 0, DateTimeKind.Utc)
        };
        var created = await test.Service.CreateCampaignAsync(request, default);
        test.Db.ChangeTracker.Clear();
        var loaded = (await test.Service.GetCampaignAsync(created.Id, default))!;
        Assert.Equal(DateTimeKind.Utc, loaded.StartAt.Kind);
        Assert.Equal(DateTimeKind.Utc, loaded.EndAt.Kind);
        string json = System.Text.Json.JsonSerializer.Serialize(loaded);
        Assert.Contains("2026-10-16T16:00:00Z", json);
        var list = await test.Service.SearchCampaignsAsync(null, null, 1, 20, default);
        Assert.Equal(DateTimeKind.Utc, list.Items.Single().EndAt.Kind);
        var vietnam = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        Assert.Equal(23, TimeZoneInfo.ConvertTimeFromUtc(loaded.EndAt, vietnam).Hour);
    }

    [Fact]
    public async Task CreateCampaign_PersistsGraceFactorAndFocusArea()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();

        ContestCampaignAdminDto result = await test.Service.CreateCampaignAsync(
            Request(1, "Q-001") with { SubmitGraceHours = 0, ReadTimerFactor = 1.5m, FocusArea = " vieclam " }, default);

        Assert.Equal(0, result.SubmitGraceHours);
        Assert.Equal(1.5m, result.ReadTimerFactor);
        Assert.Equal("vieclam", result.FocusArea);
        Assert.Equal(0, result.EntryCount);
    }

    [Theory]
    [InlineData(-1, 1, "vieclam", "submitGraceHours")]
    [InlineData(169, 1, "vieclam", "submitGraceHours")]
    [InlineData(24, -0.1, "vieclam", "readTimerFactor")]
    [InlineData(24, 5.1, "vieclam", "readTimerFactor")]
    [InlineData(24, 1, "Việc làm", "focusArea")]
    public async Task CreateCampaign_RejectsOutOfRangeSettings(int grace, double factor, string focus, string field)
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();

        ContestAdminValidationException error = await Assert.ThrowsAsync<ContestAdminValidationException>(
            () => test.Service.CreateCampaignAsync(
                Request(1, "Q-001") with { SubmitGraceHours = grace, ReadTimerFactor = (decimal)factor, FocusArea = focus }, default));

        Assert.Contains(field, error.Fields);
    }

    [Fact]
    public async Task UpdateCampaign_WithEntries_RejectsDeckChange()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        ContestCampaignAdminDto created = await test.Service.CreateCampaignAsync(Request(1, "Q-001"), default);
        await test.AddEntryAsync(created.Id);

        ContestHasEntriesException error = await Assert.ThrowsAsync<ContestHasEntriesException>(
            () => test.Service.UpdateCampaignAsync(created.Id, Request(2, "Q-002"), default));

        Assert.Equal(1, error.EntryCount);
        Assert.Equal("Q-001", (await test.Db.ContestQuestions.SingleAsync()).QuestionCode);
    }

    [Fact]
    public async Task UpdateCampaign_WithEntries_AllowsSettingsChangeWithSameDeck()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        ContestCampaignAdminDto created = await test.Service.CreateCampaignAsync(Request(1, "Q-001"), default);
        await test.AddEntryAsync(created.Id);

        ContestCampaignAdminDto updated = (await test.Service.UpdateCampaignAsync(
            created.Id, Request(1, "Q-001") with { SubmitGraceHours = 48, ReadTimerFactor = 2m, FocusArea = "mxh", MaxAttempts = 3 }, default))!;

        Assert.Equal(48, updated.SubmitGraceHours);
        Assert.Equal(2m, updated.ReadTimerFactor);
        Assert.Equal("mxh", updated.FocusArea);
        Assert.Equal(1, updated.EntryCount);
    }

    [Fact]
    public async Task DeleteCampaign_WithEntries_IsRejected()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        ContestCampaignAdminDto created = await test.Service.CreateCampaignAsync(Request(1, "Q-001"), default);
        await test.AddEntryAsync(created.Id);

        await Assert.ThrowsAsync<ContestHasEntriesException>(() => test.Service.DeleteCampaignAsync(created.Id, default));

        Assert.Single(await test.Db.ContestCampaigns.ToListAsync());
    }

    [Fact]
    public async Task DeleteCampaign_WithoutEntries_Succeeds()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        ContestCampaignAdminDto created = await test.Service.CreateCampaignAsync(Request(1, "Q-001"), default);

        Assert.True(await test.Service.DeleteCampaignAsync(created.Id, default));
        Assert.Empty(await test.Db.ContestCampaigns.ToListAsync());
    }

    private static SaveContestCampaignRequest Request(int topicId, string questionCode) => new(
        "Cuộc thi tháng 10",
        "Kiểm tra cấu hình cây",
        new DateTime(2030, 10, 1, 0, 0, 0, DateTimeKind.Utc),
        new DateTime(2030, 10, 31, 23, 59, 0, DateTimeKind.Utc),
        2,
        true,
        [new SaveContestTopicRequest(topicId, [questionCode])]);

    private sealed class TestDatabase : IAsyncDisposable
    {
        private readonly string _path;
        public AppDbContext Db { get; }
        public ContestAdminService Service { get; }

        private TestDatabase(string path, AppDbContext db)
        {
            _path = path;
            Db = db;
            Service = new ContestAdminService(db, TimeProvider.System);
        }

        public async Task AddEntryAsync(long contestId)
        {
            Db.Entries.Add(new Entry
            {
                Code = $"E-{Guid.NewGuid():N}"[..12],
                Mode = EntryModes.Anon,
                ContestId = contestId,
                CreatedAt = DateTime.UtcNow,
            });
            await Db.SaveChangesAsync();
        }

        public static async Task<TestDatabase> CreateAsync()
        {
            string path = Path.Combine(Path.GetTempPath(), $"antc-contest-admin-{Guid.NewGuid():N}.db");
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={path}").Options);
            await db.Database.EnsureCreatedAsync();
            db.QuizTopics.AddRange(
                new QuizTopic { Id = 1, Title = "Chuyên đề 1", Intro = "[]", UpdatedAt = DateTime.UtcNow },
                new QuizTopic { Id = 2, Title = "Chuyên đề 2", Intro = "[]", UpdatedAt = DateTime.UtcNow });
            db.QuizQuestions.AddRange(
                Question("Q-001", 1),
                Question("Q-002", 2));
            await db.SaveChangesAsync();
            return new TestDatabase(path, db);
        }

        private static QuizQuestion Question(string code, int topicId) => new()
        {
            Code = code,
            TopicId = topicId,
            Kind = "Trắc nghiệm",
            Question = $"Câu hỏi {code}",
            Options = "[[\"A\",\"A\"],[\"B\",\"B\"],[\"C\",\"C\"],[\"D\",\"D\"]]",
            Answer = "A",
            Explanations = "{}",
            UpdatedAt = DateTime.UtcNow,
        };

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(_path);
        }
    }
}
