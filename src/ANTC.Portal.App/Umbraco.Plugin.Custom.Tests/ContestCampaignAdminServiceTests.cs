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
