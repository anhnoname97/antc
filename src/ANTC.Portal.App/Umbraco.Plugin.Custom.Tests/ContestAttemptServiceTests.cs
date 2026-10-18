using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

/// <summary>B8a, B8b: API-02 den API-05 theo cuoc cua luot.</summary>
public class ContestAttemptServiceTests
{
    private static readonly DateTime Now = new(2026, 10, 16, 5, 0, 0, DateTimeKind.Utc);
    private sealed class Clock : TimeProvider { public override DateTimeOffset GetUtcNow() => new(Now); }

    private sealed class FakeBank : IQuestionBank
    {
        public QuestionBankSnapshot Current { get; } = new()
        {
            Topics = [new TopicDto("1", "CD1", 2, default, default), new TopicDto("2", "CD2", 1, default, default)],
            Keys = new[] { ("A1", 1), ("A2", 1), ("B1", 2) }.ToDictionary(
                x => x.Item1, x => new AnswerKey(x.Item1, x.Item2, "A", new HashSet<string> { "A", "B" })),
        };
        public void Reload() { }
    }

    private sealed class NoSettings : IContestSettings
    {
        public Task<ContestSettings?> GetAsync() => Task.FromResult<ContestSettings?>(null);
        public ContestSettings Read(IPublishedContent page) => throw new NotSupportedException();
        public ContestStatus GetStatus(ContestSettings settings, DateTime utcNow) => ContestStatus.Closed;
        public bool IsSubmitOpen(ContestSettings settings, DateTime utcNow) => false;
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection = new("Data Source=:memory:");
        public AppDbContext Db { get; private set; } = null!;

        public static async Task<Fixture> CreateAsync()
        {
            var f = new Fixture();
            await f._connection.OpenAsync();
            f.Db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(f._connection).Options);
            await f.Db.Database.EnsureCreatedAsync();
            f.Db.QuizTopics.AddRange(new QuizTopic { Id = 1, Title = "CD1" }, new QuizTopic { Id = 2, Title = "CD2" });
            f.Db.QuizQuestions.AddRange(
                new QuizQuestion { Code = "A1", TopicId = 1 }, new QuizQuestion { Code = "A2", TopicId = 1 },
                new QuizQuestion { Code = "B1", TopicId = 2 });
            await f.Db.SaveChangesAsync();
            return f;
        }

        public ContestAttemptService Service()
        {
            var bank = new FakeBank();
            return new ContestAttemptService(Db, new NoSettings(), bank, new ContestCatalog(Db, bank, new Clock()), new Clock());
        }

        // Cuoc chi co chuyen de 1 voi cau A1 (de nho): A2 va B1 nam ngoai de
        public async Task<ContestCampaign> AddContestAsync(DateTime start, DateTime end, int grace = 24)
        {
            var c = new ContestCampaign
            {
                Name = "Cuộc A", IsActive = true, StartAt = start, EndAt = end, SubmitGraceHours = grace, MaxAttempts = 3,
                ReadTimerFactor = 1.5m,
                Topics = [new ContestTopic { TopicId = 1, SortOrder = 1 }],
                Questions = [new ContestQuestion { QuestionCode = "A1", SortOrder = 1 }],
            };
            Db.ContestCampaigns.Add(c);
            await Db.SaveChangesAsync();
            return c;
        }

        public async Task<Entry> AddEntryAsync(long? contestId)
        {
            var e = new Entry
            {
                ContestId = contestId, Code = "AD-" + Guid.NewGuid().ToString("N")[..6], TokenHash = Guid.NewGuid().ToString("N"),
                Mode = EntryModes.Anon, Status = EntryStatuses.InProgress, CreatedAt = Now,
            };
            Db.Entries.Add(e);
            await Db.SaveChangesAsync();
            return e;
        }

        public async ValueTask DisposeAsync() { await Db.DisposeAsync(); await _connection.DisposeAsync(); }
    }

    [Fact]
    public async Task SaveAnswer_QuestionOutsideExam_IsUnknownQuestion()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddDays(-1), Now.AddDays(1));
        var e = await f.AddEntryAsync(c.Id);

        // A2 co trong ngan hang nhung khong thuoc de cua cuoc
        var outside = await f.Service().SaveAnswerAsync(e, "A2", "A");
        Assert.Equal("UNKNOWN_QUESTION", outside.Error?.Code);

        var inside = await f.Service().SaveAnswerAsync(e, "A1", "A");
        Assert.Null(inside.Error);
        Assert.True(inside.Answer!.Stored);
    }

    [Fact]
    public async Task SaveAnswer_ClosedUnlessPhaseOpen()
    {
        await using var f = await Fixture.CreateAsync();
        var past = await f.AddContestAsync(Now.AddDays(-3), Now.AddHours(-2), grace: 24);   // submit_only
        var upcoming = await f.AddContestAsync(Now.AddDays(1), Now.AddDays(2));
        foreach (var id in new[] { past.Id, upcoming.Id })
        {
            var e = await f.AddEntryAsync(id);
            Assert.Equal("CONTEST_CLOSED", (await f.Service().SaveAnswerAsync(e, "A1", "A")).Error?.Code);
        }
    }

    [Fact]
    public async Task LegacyEntryWithoutContest_Api02HasNullContest_Api03IsClosed()
    {
        await using var f = await Fixture.CreateAsync();
        var e = await f.AddEntryAsync(null);

        var state = await f.Service().GetStateAsync(e);
        Assert.Null(state.Contest);
        Assert.Empty(state.Topics);
        Assert.Equal("CONTEST_CLOSED", (await f.Service().SaveAnswerAsync(e, "A1", "A")).Error?.Code);
    }

    [Fact]
    public async Task GetState_ReturnsContestPhaseTopicsAndTotalOfExam()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddDays(-3), Now.AddHours(-2), grace: 24);
        var e = await f.AddEntryAsync(c.Id);

        var state = await f.Service().GetStateAsync(e);
        Assert.Equal("submit_only", state.Contest!.Phase);
        Assert.Equal(c.Id, state.Contest.Id);
        Assert.Equal(1.5m, state.Contest.ReadTimerFactor);
        Assert.EndsWith("Z", state.Contest.SubmitUntil);
        Assert.Equal(3, state.MaxAttempts);
        var topic = Assert.Single(state.Topics);
        Assert.Equal(("1", 1), (topic.Cd, topic.Count));
        Assert.Equal(1, state.Total);   // de 1 cau, khong phai 3 cau cua ngan hang

        // grace 0 va het han -> closed
        var closed = await f.AddContestAsync(Now.AddDays(-3), Now.AddDays(-1), grace: 0);
        var e2 = await f.AddEntryAsync(closed.Id);
        Assert.Equal("closed", (await f.Service().GetStateAsync(e2)).Contest!.Phase);
    }

    // De 2 cau: A1, B1 (chuyen de 1 va 2), A2 nam ngoai de
    private static async Task<ContestCampaign> AddTwoTopicContestAsync(Fixture f, DateTime start, DateTime end, int grace, int max = 2)
    {
        var c = new ContestCampaign
        {
            Name = "Cuộc B", IsActive = true, StartAt = start, EndAt = end, SubmitGraceHours = grace, MaxAttempts = max,
            Topics = [new ContestTopic { TopicId = 1, SortOrder = 1 }, new ContestTopic { TopicId = 2, SortOrder = 2 }],
            Questions = [new ContestQuestion { QuestionCode = "A1", SortOrder = 1 }, new ContestQuestion { QuestionCode = "B1", SortOrder = 2 }],
        };
        f.Db.ContestCampaigns.Add(c);
        await f.Db.SaveChangesAsync();
        return c;
    }

    [Fact]
    public async Task Submit_IncompleteByExam_ThenComplete_UsesExamTotalAndByTopic()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddTwoTopicContestAsync(f, Now.AddDays(-1), Now.AddDays(1), 24);
        var e = await f.AddEntryAsync(c.Id);

        var none = await f.Service().SubmitAsync(e, null);
        Assert.Equal("INCOMPLETE_ANSWERS", none.Error?.Code);
        Assert.Contains("0/2", none.Error!.Message);

        Assert.Null((await f.Service().SaveAnswerAsync(e, "A1", "A")).Error);
        var partial = await f.Service().SubmitAsync(e, null);
        Assert.Equal("INCOMPLETE_ANSWERS", partial.Error?.Code);
        Assert.Contains("1/2", partial.Error!.Message);

        Assert.Null((await f.Service().SaveAnswerAsync(e, "B1", "B")).Error);
        var done = await f.Service().SubmitAsync(e, null);
        Assert.Null(done.Error);
        Assert.Equal(2, done.Result!.Total);
        Assert.Equal(1, done.Result.Score);
        Assert.Equal(new[] { ("1", 1, 1), ("2", 0, 1) }, done.Result.ByTopic.Select(t => (t.Cd, t.Correct, t.Count)));
        Assert.Equal(2, f.Db.Entries.AsNoTracking().Single(x => x.Id == e.Id).TotalQuestions);

        // nop lai tra ket qua cu
        var again = await f.Service().SubmitAsync(e, null);
        Assert.Equal(done.Result.SubmittedAt, again.Result!.SubmittedAt);
    }

    [Theory]
    [InlineData(0, "CONTEST_CLOSED")]
    [InlineData(24, null)]
    public async Task Submit_AfterEnd_FollowsContestGrace(int grace, string? expectedError)
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddTwoTopicContestAsync(f, Now.AddDays(-3), Now.AddHours(-2), grace);
        var e = await f.AddEntryAsync(c.Id);
        // dien san dap an de nop duoc khi trong han
        f.Db.EntryAnswers.AddRange(
            new EntryAnswer { EntryId = e.Id, QuestionCode = "A1", Topic = 1, Chosen = "A", IsCorrect = true, AnsweredAt = Now },
            new EntryAnswer { EntryId = e.Id, QuestionCode = "B1", Topic = 2, Chosen = "A", IsCorrect = true, AnsweredAt = Now });
        await f.Db.SaveChangesAsync();

        Assert.Equal(expectedError, (await f.Service().SubmitAsync(e, null)).Error?.Code);
    }

    [Fact]
    public async Task Submit_LegacyEntryWithoutContest_IsClosed()
    {
        await using var f = await Fixture.CreateAsync();
        var e = await f.AddEntryAsync(null);
        Assert.Equal("CONTEST_CLOSED", (await f.Service().SubmitAsync(e, null)).Error?.Code);
    }

    [Fact]
    public async Task AttachContact_CountsAttemptsPerContest()
    {
        await using var f = await Fixture.CreateAsync();
        var a = await AddTwoTopicContestAsync(f, Now.AddDays(-1), Now.AddDays(1), 24, max: 1);
        var b = await AddTwoTopicContestAsync(f, Now.AddDays(-1), Now.AddDays(1), 24, max: 1);
        var contact = new ContactRequest("Nguyễn Văn A", "0912345678", "Đơn vị", true);

        var a1 = await f.AddEntryAsync(a.Id);
        Assert.Equal(1, (await f.Service().AttachContactAsync(a1, contact)).Contact?.AttemptNo);
        // cung so, cuoc khac: con luot
        var b1 = await f.AddEntryAsync(b.Id);
        Assert.Equal(1, (await f.Service().AttachContactAsync(b1, contact)).Contact?.AttemptNo);
        // cuoc A da het 1 luot
        var a2 = await f.AddEntryAsync(a.Id);
        Assert.Equal("ATTEMPT_LIMIT", (await f.Service().AttachContactAsync(a2, contact)).Error?.Code);
    }

    [Fact]
    public async Task AttachContact_SubmitOnlyPhase_IsClosed()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddTwoTopicContestAsync(f, Now.AddDays(-3), Now.AddHours(-2), 24);
        var e = await f.AddEntryAsync(c.Id);
        var r = await f.Service().AttachContactAsync(e, new ContactRequest("Nguyễn Văn A", "0912345678", "Đơn vị", true));
        Assert.Equal("CONTEST_CLOSED", r.Error?.Code);
    }
}
