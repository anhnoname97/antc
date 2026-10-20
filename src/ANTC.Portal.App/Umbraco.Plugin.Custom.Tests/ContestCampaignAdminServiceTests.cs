using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestCampaignAdminServiceTests
{
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
