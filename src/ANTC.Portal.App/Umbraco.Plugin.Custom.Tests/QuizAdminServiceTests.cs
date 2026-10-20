using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

public class QuizAdminServiceTests
{
    [Fact]
    public async Task CreateQuestion_DerivesAnswerFromExactlyOneCorrectOption()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        QuizQuestionAdminDto result = await test.Service.CreateQuestionAsync(ValidQuestion(), "admin", default);

        QuizQuestion stored = await test.Db.QuizQuestions.SingleAsync();
        Assert.Equal("B", stored.Answer);
        Assert.Equal(4, JsonDocument.Parse(stored.Options).RootElement.GetArrayLength());
        Assert.Equal("B", result.CorrectAnswer);
        Assert.Equal(4, result.Answers.Count);
        Assert.Equal(1, result.Answers.Count(x => x.IsCorrect));
        Assert.Equal(1, test.Bank.ReloadCount);
        Assert.Single(await test.Db.QuizImports.ToListAsync());
    }

    [Fact]
    public async Task CreateQuestion_RejectsAnythingOtherThanFourAnswers()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        SaveQuizQuestionRequest request = ValidQuestion() with { Answers = ValidQuestion().Answers!.Take(3).ToList() };
        QuizAdminValidationException error = await Assert.ThrowsAsync<QuizAdminValidationException>(
            () => test.Service.CreateQuestionAsync(request, "admin", default));
        Assert.Contains("answers", error.Fields);
        Assert.Empty(await test.Db.QuizQuestions.ToListAsync());
    }

    [Fact]
    public async Task CreateQuestion_RejectsMoreThanOneCorrectAnswer()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        List<QuizAnswerAdminDto> answers = ValidQuestion().Answers!.Select(x => x with { IsCorrect = x.Key is "A" or "B" }).ToList();
        QuizAdminValidationException error = await Assert.ThrowsAsync<QuizAdminValidationException>(
            () => test.Service.CreateQuestionAsync(ValidQuestion() with { Answers = answers }, "admin", default));
        Assert.Contains("answers.correct", error.Fields);
    }

    [Fact]
    public async Task DeleteQuestion_DeactivatesWhenContestAnswerReferencesIt()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        await test.Service.CreateQuestionAsync(ValidQuestion(), "admin", default);
        test.Db.Entries.Add(new Entry { Id = 1, Code = "AD-TEST01", TokenHash = new string('a', 64), CreatedAt = DateTime.UtcNow });
        test.Db.EntryAnswers.Add(new EntryAnswer { EntryId = 1, QuestionCode = "Q-001", Topic = 1, Chosen = "A", AnsweredAt = DateTime.UtcNow });
        await test.Db.SaveChangesAsync();

        DeleteQuizQuestionResult result = (await test.Service.DeleteQuestionAsync("Q-001", "admin", default))!;
        Assert.True(result.Deactivated);
        Assert.False((await test.Db.QuizQuestions.SingleAsync()).IsActive);
    }

    [Fact]
    public async Task DeleteQuestion_DeactivatesWhenCampaignReferencesIt()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        await test.Service.CreateQuestionAsync(ValidQuestion(), "admin", default);
        var campaign = new ContestCampaign { Name = "Test", StartAt = DateTime.UtcNow.AddDays(1), EndAt = DateTime.UtcNow.AddDays(2), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        campaign.Topics.Add(new ContestTopic { TopicId = 1, Title = "Chuyên đề 1", Intro = "[]" });
        campaign.Questions.Add(new ContestQuestion { QuestionCode = "Q-001", TopicId = 1, Kind = "Trắc nghiệm", QuestionText = "Snapshot", Options = "[]", Answer = "B", Explanations = "{}" });
        test.Db.ContestCampaigns.Add(campaign);
        await test.Db.SaveChangesAsync();

        DeleteQuizQuestionResult result = (await test.Service.DeleteQuestionAsync("Q-001", "admin", default))!;

        Assert.True(result.Deactivated);
        Assert.False((await test.Db.QuizQuestions.SingleAsync()).IsActive);
    }

    private static SaveQuizQuestionRequest ValidQuestion() => new(
        "Q-001", 1, "Trắc nghiệm", "", "Đâu là đáp án đúng?",
        [
            new("A", "Đáp án A", "Chưa đúng", false),
            new("B", "Đáp án B", "Chính xác", true),
            new("C", "Đáp án C", "Chưa đúng", false),
            new("D", "Đáp án D", "Chưa đúng", false),
        ],
        "Hãy kiểm tra kỹ.", 10, null, null, 1, true);

    private sealed class FakeBank : IQuestionBank
    {
        public int ReloadCount { get; private set; }
        public QuestionBankSnapshot Current { get; } = new();
        public void Reload() => ReloadCount++;
    }

    private sealed class TestDatabase : IAsyncDisposable
    {
        private readonly string _path;
        public AppDbContext Db { get; }
        public FakeBank Bank { get; } = new();
        public QuizAdminService Service { get; }

        private TestDatabase(string path, AppDbContext db)
        {
            _path = path;
            Db = db;
            Service = new QuizAdminService(db, Bank, TimeProvider.System);
        }

        public static async Task<TestDatabase> CreateAsync()
        {
            string path = Path.Combine(Path.GetTempPath(), $"antc-quiz-admin-{Guid.NewGuid():N}.db");
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={path}").Options);
            await db.Database.EnsureCreatedAsync();
            db.QuizTopics.Add(new QuizTopic { Id = 1, Title = "Chuyên đề 1", Intro = "[]", Terms = "[]", UpdatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
            return new TestDatabase(path, db);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(_path);
        }
    }
}
