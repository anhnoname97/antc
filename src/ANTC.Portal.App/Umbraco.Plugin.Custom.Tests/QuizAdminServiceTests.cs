using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

public class QuizAdminServiceTests
{
    [Fact]
    public async Task QuestionsController_PassesTypeFilterToService()
    {
        await using var test = await TestDatabase.CreateAsync();
        await test.Service.CreateTopicAsync(new(2, "Tổ chức", [], [], Type: QuizAudience.Organization), "admin", default);
        await test.Service.CreateQuestionAsync(ValidQuestion() with { TopicId = 2 }, "admin", default);
        await test.Service.CreateQuestionAsync(ValidQuestion() with { Code = "Q-002" }, "admin", default);
        var controller = new Umbraco.Plugin.Custom.Api.Controllers.QuizAdminController(test.Service);
        var response = await controller.SearchQuestions(null, null, null, type: QuizAudience.Organization);
        var result = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(response.Result);
        var page = Assert.IsType<PagedResult<QuizQuestionAdminDto>>(result.Value);
        Assert.Equal("Q-001", Assert.Single(page.Items).Code);
    }
    [Fact]
    public async Task Type_IsInheritedFromTopic_AndFollowsTopicChangeAndQuestionMove()
    {
        await using var test = await TestDatabase.CreateAsync();
        var organization = await test.Service.CreateTopicAsync(new(2, "Tổ chức mới", [], [], Type: QuizAudience.Organization), "admin", default);
        Assert.Null(organization.PublicCode);
        var question = await test.Service.CreateQuestionAsync(ValidQuestion() with { TopicId = 2 }, "admin", default);
        Assert.Equal(QuizAudience.Organization, question.Type);
        Assert.Single((await test.Service.SearchQuestionsAsync(null, null, null, 1, 10, default, type: QuizAudience.Organization)).Items);
        await test.Service.UpdateTopicAsync(2, new(2, organization.Title, [], [], Type: QuizAudience.Personal), "admin", default);
        Assert.Equal(QuizAudience.Personal, (await test.Service.GetQuestionAsync(question.Code, default))!.Type);
        Assert.Empty((await test.Service.SearchQuestionsAsync(null, null, null, 1, 10, default, type: QuizAudience.Organization)).Items);
        await test.Service.UpdateTopicAsync(2, new(2, organization.Title, [], [], Type: QuizAudience.Organization), "admin", default);
        var moved = await test.Service.UpdateQuestionAsync(question.Code, ValidQuestion() with { TopicId = 1 }, "admin", default);
        Assert.Equal(QuizAudience.Personal, moved!.Type);
        var invalid = await Assert.ThrowsAsync<QuizAdminValidationException>(() => test.Service.CreateTopicAsync(new(3, "Không hợp lệ", [], [], Type: "other"), "admin", default));
        Assert.Contains("type", invalid.Fields.Keys);
    }
    [Fact]
    public async Task BusinessBank_FiltersBeforePaging_AndKeepsInactiveQuestionsManageable()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        await test.Service.CreateQuestionAsync(ValidQuestion(), "admin", default);
        test.Db.QuizTopics.AddRange(
            new QuizTopic { Id = 9, PublicCode = "dn1", Type = QuizAudience.Organization, Title = "Phần A" },
            new QuizTopic { Id = 10, PublicCode = "dn2", Type = QuizAudience.Organization, Title = "Phần B", IsActive = false });
        test.Db.QuizQuestions.AddRange(
            new QuizQuestion { Code = "A01", TopicId = 9, Question = "Kiểm chứng doanh nghiệp", SortOrder = 1 },
            new QuizQuestion { Code = "A02", TopicId = 9, Question = "Quyết định doanh nghiệp", SortOrder = 2, IsActive = false },
            new QuizQuestion { Code = "TH01.1", TopicId = 10, Question = "Kiểm chứng tình huống", SortOrder = 1 });
        await test.Db.SaveChangesAsync();
        var first = await test.Service.SearchQuestionsAsync(null, null, null, 1, 2, default, "business");
        var second = await test.Service.SearchQuestionsAsync(null, null, null, 2, 2, default, "business");
        Assert.Equal(3, first.TotalItems); Assert.Equal(2, first.TotalPages);
        Assert.Equal(new[] { "A01", "A02" }, first.Items.Select(x => x.Code));
        Assert.Equal("TH01.1", Assert.Single(second.Items).Code);
        Assert.Empty((await test.Service.SearchQuestionsAsync(null, 1, null, 1, 100, default, "business")).Items);
        Assert.Single((await test.Service.SearchQuestionsAsync(null, null, false, 1, 100, default, "business")).Items);
        Assert.Single((await test.Service.SearchQuestionsAsync(null, null, null, 1, 100, default, "general")).Items);
        Assert.Equal(2, (await test.Service.SearchQuestionsAsync("Kiểm chứng", null, null, 1, 100, default, "business")).TotalItems);
        var parts = await test.Service.SearchTopicsAsync(null, null, 1, 100, default, "business");
        Assert.Equal(2, parts.TotalItems); Assert.All(parts.Items, x => Assert.NotNull(x.PublicCode));
        Assert.Equal(2, parts.Items[0].QuestionCount);
        Assert.Equal(1, parts.Items[0].ActiveQuestionCount);
    }
    [Fact]
    public async Task TrueFalseQuestion_CanBeCreatedAndEdited_WithoutInventingBlankOptions()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        var request = ValidQuestion() with { Answers = ValidQuestion().Answers!.Take(2).ToList(), Kind = "Đúng – Sai" };
        var created = await test.Service.CreateQuestionAsync(request, "admin", default);
        Assert.Equal(2, created.Answers.Count);
        var edited = await test.Service.UpdateQuestionAsync(created.Code, request with { Question = "Đã sửa câu hỏi Đúng – Sai?" }, "admin", default);
        Assert.Equal(2, edited!.Answers.Count); Assert.Equal("B", edited.CorrectAnswer);
    }
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
    public async Task CreateQuestion_RejectsFewerThanTwoAnswers()
    {
        await using TestDatabase test = await TestDatabase.CreateAsync();
        SaveQuizQuestionRequest request = ValidQuestion() with { Answers = ValidQuestion().Answers!.Take(1).ToList() };
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
