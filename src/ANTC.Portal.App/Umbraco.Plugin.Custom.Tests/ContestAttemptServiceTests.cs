using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Umbraco.Plugin.Custom.Api.Controllers;
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
        public QuestionBankSnapshot Current { get; init; } = new()
        {
            Topics = [new TopicDto("1", "CD1", 2, default, default), new TopicDto("2", "CD2", 1, default, default)],
            Keys = new[] { ("A1", 1), ("A2", 1), ("B1", 2) }.ToDictionary(
                x => x.Item1, x => new AnswerKey(x.Item1, x.Item2, "A", new HashSet<string> { "A", "B", "C", "D" })),
        };
        public void Reload() { }
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;
        public AppDbContext Db { get; private set; } = null!;

        private Fixture(string? path) => _connection = new SqliteConnection(
            path is null ? "Data Source=:memory:" : $"Data Source={path};Pooling=False;Default Timeout=30");

        public static async Task<Fixture> CreateAsync(string? path = null)
        {
            var f = new Fixture(path);
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

        public ContestAttemptService Service(IQuestionBank? questionBank = null)
        {
            var bank = questionBank ?? new FakeBank();
            return new ContestAttemptService(Db, bank, new ContestCatalog(Db, bank, new Clock()), new Clock());
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

    // De 3 cau: chuyen de 1 co A1, A2; chuyen de 2 co B1. topicOrder doi thu tu chuyen de cua de
    private static async Task<ContestCampaign> AddOrderedContestAsync(Fixture f, params int[] topicOrder)
    {
        var codes = new Dictionary<int, string[]> { [1] = ["A1", "A2"], [2] = ["B1"] };
        var c = new ContestCampaign
        {
            Name = "Cuộc T", IsActive = true, StartAt = Now.AddDays(-1), EndAt = Now.AddDays(1), SubmitGraceHours = 24, MaxAttempts = 2,
            Topics = topicOrder.Select((t, i) => new ContestTopic { TopicId = t, SortOrder = i + 1 }).ToList(),
            Questions = topicOrder.SelectMany(t => codes[t]).Select((q, i) => new ContestQuestion { QuestionCode = q, SortOrder = i + 1 }).ToList(),
        };
        f.Db.ContestCampaigns.Add(c);
        await f.Db.SaveChangesAsync();
        return c;
    }

    [Fact]
    public async Task SaveAnswer_AllowsLaterTopicBeforeEarlierTopics_WithoutReadDelay()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddOrderedContestAsync(f, 1, 2);
        var e = await f.AddEntryAsync(c.Id);

        Assert.True((await f.Service().SaveAnswerAsync(e, "B1", "B")).Answer!.Stored);
        Assert.True((await f.Service().SaveAnswerAsync(e, "A1", "A")).Answer!.Stored);
        Assert.Null((await f.Service().SaveAnswerAsync(e, "A2", "A")).Error);
        Assert.False((await f.Service().SaveAnswerAsync(e, "A1", "B")).Answer!.Stored);
    }

    [Fact]
    public async Task SaveAnswer_AllowsAnyExamTopicOrder_AndOtherContestUnaffected()
    {
        await using var f = await Fixture.CreateAsync();
        var onlyB = await AddOrderedContestAsync(f, 2);
        var reversed = await AddOrderedContestAsync(f, 2, 1);
        var eB = await f.AddEntryAsync(onlyB.Id);
        var eR = await f.AddEntryAsync(reversed.Id);
        var eFull = await f.AddEntryAsync((await AddOrderedContestAsync(f, 1, 2)).Id);

        Assert.Null((await f.Service().SaveAnswerAsync(eB, "B1", "B")).Error);

        Assert.Null((await f.Service().SaveAnswerAsync(eR, "A1", "A")).Error);
        Assert.Null((await f.Service().SaveAnswerAsync(eR, "B1", "B")).Error);
        Assert.Null((await f.Service().SaveAnswerAsync(eR, "A1", "A")).Error);

        // dap an o cuoc khac khong tinh vao luot nay
        Assert.True((await f.Service().SaveAnswerAsync(eFull, "B1", "B")).Answer!.Stored);
        Assert.Equal(4, await f.Db.EntryAnswers.CountAsync());
    }

    [Fact]
    public async Task SaveAnswer_RetryWithDifferentAnswer_KeepsFirstAnswerAndTimestamp()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
        var e = await f.AddEntryAsync(c.Id);

        var first = await f.Service().SaveAnswerAsync(e, "A1", "B");
        var retry = await f.Service().SaveAnswerAsync(e, "A1", "A");

        Assert.Equal(new SaveAnswerDto("A1", "B", false, true), first.Answer);
        Assert.Equal(new SaveAnswerDto("A1", "B", false, false), retry.Answer);
        var row = Assert.Single(await f.Db.EntryAnswers.AsNoTracking().ToListAsync());
        Assert.Equal("B", row.Chosen);
        Assert.False(row.IsCorrect);
        Assert.Equal(1, row.Topic);
        Assert.Equal(Now, row.AnsweredAt);
    }

    [Fact]
    public async Task SaveAnswer_FiveConcurrentRequests_StoreExactlyOneFirstAnswer()
    {
        string path = Path.Combine(Path.GetTempPath(), $"antc-answers-{Guid.NewGuid():N}.db");
        try
        {
            await using var f = await Fixture.CreateAsync(path);
            var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
            var entry = await f.AddEntryAsync(c.Id);
            var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            var requests = Enumerable.Range(0, 5).Select(async i =>
            {
                await start.Task;
                await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                    .UseSqlite($"Data Source={path};Pooling=False;Default Timeout=30").Options);
                var bank = new FakeBank();
                var service = new ContestAttemptService(db, bank, new ContestCatalog(db, bank, new Clock()), new Clock());
                return await service.SaveAnswerAsync(entry, "A1", i % 2 == 0 ? "A" : "B");
            }).ToArray();
            start.SetResult();
            var results = await Task.WhenAll(requests);

            Assert.All(results, r => Assert.Null(r.Error));
            var winner = Assert.Single(results, r => r.Answer!.Stored).Answer!;
            Assert.Equal(4, results.Count(r => !r.Answer!.Stored));
            Assert.All(results, r => Assert.Equal(winner.A, r.Answer!.A));
            var stored = Assert.Single(await f.Db.EntryAnswers.AsNoTracking().ToListAsync());
            Assert.Equal(winner.A, stored.Chosen);
            Assert.Equal(winner.Correct, stored.IsCorrect);

            // Bypass the service to verify that the DB primary key itself forbids duplicates.
            f.Db.EntryAnswers.Add(new EntryAnswer
            {
                EntryId = entry.Id, QuestionCode = "A1", Topic = 1, Chosen = "D", AnsweredAt = Now,
            });
            await Assert.ThrowsAsync<DbUpdateException>(() => f.Db.SaveChangesAsync());
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Theory]
    [InlineData(null, "A", "UNKNOWN_QUESTION")]
    [InlineData("missing", "A", "UNKNOWN_QUESTION")]
    [InlineData("A1", null, "INVALID_OPTION")]
    [InlineData("A1", "E", "INVALID_OPTION")]
    [InlineData("A1", "a", "INVALID_OPTION")]
    [InlineData("A1", "AB", "INVALID_OPTION")]
    public async Task SaveAnswer_InvalidQuestionOrOption_DoesNotWrite(string? q, string? a, string error)
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
        var e = await f.AddEntryAsync(c.Id);
        Assert.Equal(error, (await f.Service().SaveAnswerAsync(e, q, a)).Error?.Code);
        Assert.Empty(await f.Db.EntryAnswers.ToListAsync());
    }

    [Fact]
    public async Task SaveAnswer_GradesAgainstContestSnapshot_AfterPracticeBankChanges()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
        var e = await f.AddEntryAsync(c.Id);
        var snapshot = new QuestionBankSnapshot
        {
            Topics = new FakeBank().Current.Topics,
            Keys = new Dictionary<string, AnswerKey>
            {
                ["A1"] = new("A1", 1, "D", new HashSet<string> { "A", "B", "C", "D" }),
            },
        };
        var bank = new FakeBank
        {
            Current = new QuestionBankSnapshot
            {
                // The question is no longer active in the practice bank.
                Contests = [new(c.Id, c.Name, c.Description, c.StartAt, c.EndAt, c.MaxAttempts, snapshot)],
            },
        };
        var result = await f.Service(bank).SaveAnswerAsync(e, "A1", "D");
        Assert.Null(result.Error);
        Assert.True(result.Answer!.Correct);
        Assert.Equal(1, (await f.Db.EntryAnswers.SingleAsync()).Topic);
    }

    [Fact]
    public async Task SaveAnswer_SubmittedEntry_RejectsEvenWithStaleAuthenticatedEntry()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
        var e = await f.AddEntryAsync(c.Id);
        await f.Db.Entries.Where(x => x.Id == e.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, EntryStatuses.Submitted));
        Assert.Equal("ALREADY_SUBMITTED", (await f.Service().SaveAnswerAsync(e, "A1", "A")).Error?.Code);
        Assert.Empty(await f.Db.EntryAnswers.ToListAsync());
    }

    [Fact]
    public async Task AnswerApi_ReturnsBusinessErrorStatusCodes()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
        var e = await f.AddEntryAsync(c.Id);
        const string token = "answer-api-test-token";
        e.TokenHash = ContestEntryService.HashToken(token);
        await f.Db.SaveChangesAsync();
        var controller = new ContestController(null!, f.Service())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        controller.Request.Headers["X-Entry-Token"] = token;

        void AssertError(IActionResult result, int status, string code)
        {
            var response = Assert.IsType<ObjectResult>(result);
            Assert.Equal(status, response.StatusCode);
            using var json = JsonDocument.Parse(JsonSerializer.Serialize(response.Value));
            Assert.Equal(code, json.RootElement.GetProperty("error").GetProperty("code").GetString());
        }

        AssertError(await controller.SaveAnswer(new("missing", "A"), default), 400, "UNKNOWN_QUESTION");
        AssertError(await controller.SaveAnswer(new("A1", "E"), default), 400, "INVALID_OPTION");
        await f.Db.ContestCampaigns.Where(x => x.Id == c.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.EndAt, Now));
        AssertError(await controller.SaveAnswer(new("A1", "A"), default), 403, "CONTEST_CLOSED");
        await f.Db.Entries.Where(x => x.Id == e.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, EntryStatuses.Submitted));
        AssertError(await controller.SaveAnswer(new("A1", "A"), default), 409, "ALREADY_SUBMITTED");
    }

    [Fact]
    public async Task GetMe_AuthenticatesByHash_RestoresAllAnswersAndMasksPhone()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddOrderedContestAsync(f, 1, 2);
        var e = await f.AddEntryAsync(c.Id);
        const string token = "test-entry-token-opaque-value";
        // Public token hash convention, without storing the raw token.
        e.TokenHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
        e.Mode = EntryModes.Named;
        e.Phone = "0912345678";
        e.FullName = "Nguyễn Văn An";
        await f.Db.SaveChangesAsync();
        var service = f.Service();
        var authenticated = Assert.IsType<Entry>(await service.AuthenticateAsync(token));
        Assert.Null(await service.AuthenticateAsync("wrong-token"));
        Assert.Null(await service.AuthenticateAsync(null));
        await service.SaveAnswerAsync(authenticated, "B1", "D");
        await service.SaveAnswerAsync(authenticated, "A1", "A");
        var controller = new ContestController(null!, service)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        controller.Request.Headers["X-Entry-Token"] = token;
        var response = Assert.IsType<OkObjectResult>(await controller.GetMe(default));
        var state = Assert.IsType<EntryStateDto>(response.Value);
        Assert.Equal(2, state.Answered);
        Assert.Equal(2, state.Answers.Count);
        Assert.Contains(state.Answers, a => a.Q == "B1" && a.A == "D" && !a.Correct && a.Cd == "2");
        Assert.Contains(state.Answers, a => a.Q == "A1" && a.A == "A" && a.Correct && a.Cd == "1");
        Assert.Equal("091****678", state.PhoneMasked);
        string json = JsonSerializer.Serialize(state);
        Assert.DoesNotContain(e.Phone, json);
        Assert.DoesNotContain(token, json);
        Assert.DoesNotContain(e.TokenHash, json);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("wrong-token")]
    public async Task AllMeApis_MissingOrInvalidToken_Return401(string? token)
    {
        await using var f = await Fixture.CreateAsync();
        var controller = new ContestController(null!, f.Service())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        if (token is not null) controller.Request.Headers["X-Entry-Token"] = token;
        IActionResult[] results = [
            await controller.GetMe(default),
            await controller.SaveAnswer(new("A1", "A"), default),
            await controller.AttachContact(null, default),
            await controller.Submit(null, default),
        ];
        foreach (var result in results)
        {
            var response = Assert.IsType<ObjectResult>(result);
            Assert.Equal(401, response.StatusCode);
            using var json = JsonDocument.Parse(JsonSerializer.Serialize(response.Value));
            Assert.Equal("INVALID_TOKEN", json.RootElement.GetProperty("error").GetProperty("code").GetString());
        }
    }

    [Fact]
    public async Task Submit_RequiresEntireExam_ThenFreezesScoreAndByTopic()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddTwoTopicContestAsync(f, Now.AddDays(-1), Now.AddDays(1), 24);
        var e = await f.AddEntryAsync(c.Id);

        var none = await f.Service().SubmitAsync(e, null);
        Assert.Equal("NOTHING_TO_SUBMIT", none.Error?.Code);

        Assert.Null((await f.Service().SaveAnswerAsync(e, "A1", "A")).Error);
        var incomplete = await f.Service().SubmitAsync(e, new("Nguyễn Văn An", "0912345678", null, true));
        Assert.Equal("INCOMPLETE_ANSWERS", incomplete.Error?.Code);
        var unchanged = await f.Db.Entries.AsNoTracking().SingleAsync(x => x.Id == e.Id);
        Assert.Equal(EntryStatuses.InProgress, unchanged.Status);
        Assert.Null(unchanged.Phone); Assert.Null(unchanged.FullName); Assert.Null(unchanged.ConsentAt);
        Assert.Null(unchanged.Score); Assert.Null(unchanged.SubmittedAt); Assert.Null(unchanged.SubmissionResultJson);
        Assert.Single(await f.Db.EntryAnswers.ToListAsync());
        Assert.Null((await f.Service().SaveAnswerAsync(e, "B1", "B")).Error);
        var done = await f.Service().SubmitAsync(e, null);
        Assert.Null(done.Error);
        Assert.Equal(2, done.Result!.Total);
        Assert.Equal(1, done.Result.Score);
        Assert.Equal(2, done.Result.Answered);
        Assert.False(done.Result.EligibleForPrize);
        Assert.Equal(new[] { ("1", 1, 1), ("2", 0, 1) }, done.Result.ByTopic.Select(t => (t.Cd, t.Correct, t.Count)));
        Assert.Equal(2, f.Db.Entries.AsNoTracking().Single(x => x.Id == e.Id).TotalQuestions);
        Assert.Equal(2, await f.Db.EntryAnswers.CountAsync());
        Assert.Equal("ALREADY_SUBMITTED", (await f.Service().SaveAnswerAsync(e, "B1", "B")).Error?.Code);

        // nop lai tra ket qua cu
        var again = await f.Service().SubmitAsync(e, null);
        Assert.Equal(done.Result.SubmittedAt, again.Result!.SubmittedAt);
    }

    [Fact]
    public async Task Submit_AnswerOutsideExamCannotReplaceMissingQuestion()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddTwoTopicContestAsync(f, Now.AddDays(-1), Now.AddDays(1), 24);
        var e = await f.AddEntryAsync(c.Id);
        await f.Service().SaveAnswerAsync(e, "A1", "A");
        f.Db.EntryAnswers.Add(new EntryAnswer { EntryId=e.Id, QuestionCode="A2", Topic=1, Chosen="A", IsCorrect=true, AnsweredAt=Now });
        await f.Db.SaveChangesAsync();
        Assert.Equal(2,await f.Db.EntryAnswers.CountAsync());
        Assert.Equal("INCOMPLETE_ANSWERS",(await f.Service().SubmitAsync(e,null)).Error?.Code);
        Assert.Equal(EntryStatuses.InProgress,(await f.Db.Entries.AsNoTracking().SingleAsync()).Status);
    }

    [Theory]
    [InlineData(0, "CONTEST_CLOSED")]
    [InlineData(24, null)]
    public async Task Submit_AfterEnd_FollowsContestGrace(int grace, string? expectedError)
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddTwoTopicContestAsync(f, Now.AddDays(-3), Now.AddHours(-2), grace);
        var e = await f.AddEntryAsync(c.Id);
        e.CreatedAt = c.EndAt.AddHours(-1);
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
    public async Task Submit_WithContact_AtomicallyNamesEntryAndFreezesScore()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddOrderedContestAsync(f, 1, 2);
        var e = await f.AddEntryAsync(c.Id);
        string code = e.Code, tokenHash = e.TokenHash;
        await f.Service().SaveAnswerAsync(e, "A1", "A");
        await f.Service().SaveAnswerAsync(e, "A2", "B");
        await f.Service().SaveAnswerAsync(e, "B1", "B");
        var result = await f.Service().SubmitAsync(e,
            new("  Nguyễn Văn An  ", "+84 (912) 345-678", "  Đơn vị  ", true));

        Assert.Null(result.Error);
        Assert.Equal(EntryModes.Named, result.Result!.Mode);
        Assert.True(result.Result.EligibleForPrize);
        var stored = await f.Db.Entries.AsNoTracking().SingleAsync();
        Assert.Equal(code, stored.Code);
        Assert.Equal(tokenHash, stored.TokenHash);
        Assert.Equal("Nguyễn Văn An", stored.FullName);
        Assert.Equal("0912345678", stored.Phone);
        Assert.Equal("Đơn vị", stored.Org);
        Assert.Equal(1, stored.AttemptNo);
        Assert.Equal(Now, stored.ConsentAt);
        Assert.Equal(Now, stored.SubmittedAt);
        Assert.Equal(EntryStatuses.Submitted, stored.Status);
        Assert.Equal(await f.Db.EntryAnswers.CountAsync(a => a.IsCorrect), stored.Score);
        Assert.Equal(3, stored.Answered);
        Assert.Equal(3, stored.TotalQuestions);
        Assert.Equal(JsonSerializer.Serialize(result.Result), stored.SubmissionResultJson);
    }

    [Theory]
    [InlineData("bad-phone", true, false, "VALIDATION")]
    [InlineData("0912345678", false, false, "VALIDATION")]
    [InlineData("0912345678", true, true, "ATTEMPT_LIMIT")]
    public async Task Submit_InvalidOrExhaustedContact_DoesNotNameOrSubmit(
        string phone, bool consent, bool exhausted, string error)
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddTwoTopicContestAsync(f, Now.AddHours(-1), Now.AddHours(1), 24, max: 1);
        if (exhausted)
        {
            var prior = await f.AddEntryAsync(c.Id);
            prior.Mode = EntryModes.Named;
            prior.Phone = "0912345678";
            prior.Status = EntryStatuses.Submitted;
            await f.Db.SaveChangesAsync();
        }
        var e = await f.AddEntryAsync(c.Id);
        await f.Service().SaveAnswerAsync(e, "A1", "A");
        await f.Service().SaveAnswerAsync(e, "B1", "B");
        var response = await f.Service().SubmitAsync(e, new("Nguyễn Văn An", phone, null, consent));

        Assert.Equal(error, response.Error?.Code);
        var stored = await f.Db.Entries.AsNoTracking().SingleAsync(x => x.Id == e.Id);
        Assert.Equal(EntryModes.Anon, stored.Mode);
        Assert.Equal(EntryStatuses.InProgress, stored.Status);
        Assert.Null(stored.Phone);
        Assert.Null(stored.FullName);
        Assert.Null(stored.ConsentAt);
        Assert.Null(stored.AttemptNo);
        Assert.Null(stored.Score);
        Assert.Null(stored.SubmittedAt);
        Assert.Null(stored.SubmissionResultJson);
        Assert.Equal(2, await f.Db.EntryAnswers.CountAsync(a => a.EntryId == e.Id));
    }

    [Theory]
    [InlineData(-1, 24, -1, null)] // Before closing, created before closing.
    [InlineData(0, 24, -1, null)]  // Exactly at closing: grace starts.
    [InlineData(23, 24, -1, null)]
    [InlineData(24, 24, -1, "CONTEST_CLOSED")]
    [InlineData(2, 1, -1, "CONTEST_CLOSED")]
    [InlineData(0, 0, -1, "CONTEST_CLOSED")]
    [InlineData(1, 24, 0, "CONTEST_CLOSED")] // Created at closing is not eligible for grace.
    [InlineData(1, 24, 1, "CONTEST_CLOSED")]
    public async Task Submit_GraceUsesCreationTimeAndConfiguredDeadline(
        int hoursAfterClose, int grace, int createdOffset, string? expectedError)
    {
        await using var f = await Fixture.CreateAsync();
        DateTime end = Now.AddHours(-hoursAfterClose);
        var c = await f.AddContestAsync(end.AddDays(-3), end, grace);
        var e = await f.AddEntryAsync(c.Id);
        e.CreatedAt = end.AddHours(createdOffset);
        f.Db.EntryAnswers.Add(new EntryAnswer
        {
            EntryId = e.Id, QuestionCode = "A1", Topic = 1, Chosen = "A", IsCorrect = true,
            AnsweredAt = e.CreatedAt,
        });
        await f.Db.SaveChangesAsync();
        // A valid anonymous participant may attach contact as part of submission even in grace.
        var result = await f.Service().SubmitAsync(e, new("Nguyễn Văn An", "0912345678", null, true));
        Assert.Equal(expectedError, result.Error?.Code);
        if (expectedError is null)
        {
            Assert.True(result.Result!.EligibleForPrize);
            Assert.Equal(EntryModes.Named, result.Result.Mode);
        }
        else
        {
            var stored = await f.Db.Entries.AsNoTracking().SingleAsync(x => x.Id == e.Id);
            Assert.Equal(EntryStatuses.InProgress, stored.Status);
            Assert.Null(stored.Phone);
        }
    }

    [Fact]
    public async Task Submit_Again_ReturnsExactSavedJsonEvenAfterBankAndContestChanges()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await AddOrderedContestAsync(f, 1, 2);
        var e = await f.AddEntryAsync(c.Id);
        await f.Service().SaveAnswerAsync(e, "A1", "A");
        await f.Service().SaveAnswerAsync(e, "A2", "B");
        await f.Service().SaveAnswerAsync(e, "B1", "B");
        var first = await f.Service().SubmitAsync(e, null);
        Assert.Null(first.Error);
        string firstJson = JsonSerializer.Serialize(first.Result);
        var submittedAt = (await f.Db.Entries.AsNoTracking().SingleAsync()).SubmittedAt;

        await f.Db.ContestCampaigns.Where(x => x.Id == c.Id).ExecuteUpdateAsync(s => s
            .SetProperty(x => x.IsActive, false).SetProperty(x => x.EndAt, Now.AddDays(-10)));
        var changedBank = new FakeBank { Current = new QuestionBankSnapshot() };
        var again = await f.Service(changedBank).SubmitAsync(e, new("", "bad", null, false));

        Assert.Null(again.Error);
        Assert.Equal(firstJson, JsonSerializer.Serialize(again.Result));
        var stored = await f.Db.Entries.AsNoTracking().SingleAsync();
        Assert.Equal(submittedAt, stored.SubmittedAt);
        Assert.Equal(firstJson, stored.SubmissionResultJson);
        Assert.Null(stored.Phone);
    }

    [Fact]
    public async Task Submit_LegacySubmittedEntry_PreservesPersistedScoreAndSubmissionTime()
    {
        await using var f = await Fixture.CreateAsync();
        var e = await f.AddEntryAsync(null);
        e.Status = EntryStatuses.Submitted;
        e.Score = 7;
        e.Answered = 9;
        e.TotalQuestions = 10;
        e.SubmittedAt = Now.AddDays(-1);
        await f.Db.SaveChangesAsync();
        var result = await f.Service().SubmitAsync(e, null);
        Assert.Null(result.Error);
        Assert.Equal(7, result.Result!.Score);
        Assert.Equal(9, result.Result.Answered);
        Assert.Equal(10, result.Result.Total);
        Assert.NotNull((await f.Db.Entries.AsNoTracking().SingleAsync()).SubmissionResultJson);
        Assert.Equal(result.Result.SubmittedAt, (await f.Service().SubmitAsync(e, null)).Result!.SubmittedAt);
    }

    [Fact]
    public async Task Submit_FiveConcurrentCalls_ReturnSameResultAndNameEntryOnce()
    {
        string path = Path.Combine(Path.GetTempPath(), $"antc-submit-{Guid.NewGuid():N}.db");
        try
        {
            await using var f = await Fixture.CreateAsync(path);
            var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
            var e = await f.AddEntryAsync(c.Id);
            await f.Service().SaveAnswerAsync(e, "A1", "A");
            var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            var tasks = Enumerable.Range(0, 5).Select(async _ =>
            {
                await gate.Task;
                await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                    .UseSqlite($"Data Source={path};Pooling=False;Default Timeout=30").Options);
                var bank = new FakeBank();
                var service = new ContestAttemptService(db, bank, new ContestCatalog(db, bank, new Clock()), new Clock());
                return await service.SubmitAsync(e, new("Nguyễn Văn An", "0912345678", null, true));
            }).ToArray();
            gate.SetResult();
            var results = await Task.WhenAll(tasks);
            Assert.All(results, r => Assert.Null(r.Error));
            Assert.Single(results.Select(r => JsonSerializer.Serialize(r.Result)).Distinct());
            var stored = await f.Db.Entries.AsNoTracking().SingleAsync();
            Assert.Equal(1, stored.AttemptNo);
            Assert.Equal(Now, stored.SubmittedAt);
            Assert.Equal(1, stored.Score);
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public async Task ContactAndSubmit_ConcurrentEntriesForSamePhone_RespectSharedAttemptLimit()
    {
        string path = Path.Combine(Path.GetTempPath(), $"antc-contact-{Guid.NewGuid():N}.db");
        try
        {
            await using var f = await Fixture.CreateAsync(path);
            var c = await AddTwoTopicContestAsync(f, Now.AddHours(-1), Now.AddHours(1), 24, max: 2);
            var entries = new List<Entry>();
            for (int i = 0; i < 5; i++)
            {
                var e = await f.AddEntryAsync(c.Id);
                entries.Add(e);
                await f.Service().SaveAnswerAsync(e, "A1", "A");
                await f.Service().SaveAnswerAsync(e, "B1", "B");
            }
            var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            var tasks = entries.Select(async (entry, i) =>
            {
                await gate.Task;
                await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                    .UseSqlite($"Data Source={path};Pooling=False;Default Timeout=30").Options);
                var bank = new FakeBank();
                var service = new ContestAttemptService(db, bank, new ContestCatalog(db, bank, new Clock()), new Clock());
                var contact = new ContactRequest("Nguyễn Văn An", "+84 912 345 678", null, true);
                return i % 2 == 0
                    ? (await service.SubmitAsync(entry, contact)).Error?.Code
                    : (await service.AttachContactAsync(entry, contact)).Error?.Code;
            }).ToArray();
            gate.SetResult();
            var errors = await Task.WhenAll(tasks);
            Assert.Equal(2, errors.Count(e => e is null));
            Assert.Equal(3, errors.Count(e => e == "ATTEMPT_LIMIT"));
            var named = await f.Db.Entries.AsNoTracking().Where(e => e.Phone != null).OrderBy(e => e.AttemptNo).ToListAsync();
            Assert.Equal(new int?[] { 1, 2 }, named.Select(e => e.AttemptNo));
            var untouched = await f.Db.Entries.AsNoTracking().Where(e => e.Phone == null).ToListAsync();
            Assert.All(untouched, e =>
            {
                Assert.Equal(EntryStatuses.InProgress, e.Status);
                Assert.Equal(EntryModes.Anon, e.Mode);
                Assert.Null(e.SubmittedAt);
            });
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public async Task AttachContact_PreservesCodeTokenAndAnswers_RejectsSecondAttachmentAndSubmittedEntry()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
        var e = await f.AddEntryAsync(c.Id);
        string code = e.Code, token = e.TokenHash;
        await f.Service().SaveAnswerAsync(e, "A1", "A");
        var contact = new ContactRequest("Nguyễn Văn An", "+84 (912) 345-678", null, true);
        var result = await f.Service().AttachContactAsync(e, contact);
        Assert.Null(result.Error);
        Assert.Equal(EntryModes.Named, result.Contact!.Mode);
        var stored = await f.Db.Entries.AsNoTracking().SingleAsync();
        Assert.Equal(code, stored.Code);
        Assert.Equal(token, stored.TokenHash);
        Assert.Equal("0912345678", stored.Phone);
        Assert.Equal(Now, stored.ConsentAt);
        Assert.Equal(EntryStatuses.InProgress, stored.Status);
        Assert.Single(await f.Db.EntryAnswers.ToListAsync());
        Assert.Equal("ALREADY_NAMED", (await f.Service().AttachContactAsync(e,
            new("Tên Khác", "0987654321", null, true))).Error?.Code);
        Assert.Equal("0912345678", (await f.Db.Entries.AsNoTracking().SingleAsync()).Phone);
        Assert.Null((await f.Service().SubmitAsync(e, null)).Error);
        Assert.Equal("ALREADY_SUBMITTED", (await f.Service().AttachContactAsync(e, contact)).Error?.Code);
    }

    [Fact]
    public async Task SubmitApi_NothingToSubmitReturns409_AndRetryReturnsSame200Result()
    {
        await using var f = await Fixture.CreateAsync();
        var c = await f.AddContestAsync(Now.AddHours(-1), Now.AddHours(1));
        var e = await f.AddEntryAsync(c.Id);
        const string token = "submit-api-test-token";
        e.TokenHash = ContestEntryService.HashToken(token);
        await f.Db.SaveChangesAsync();
        var controller = new ContestController(null!, f.Service())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        controller.Request.Headers["X-Entry-Token"] = token;
        var empty = Assert.IsType<ObjectResult>(await controller.Submit(null, default));
        Assert.Equal(409, empty.StatusCode);
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(empty.Value));
        Assert.Equal("NOTHING_TO_SUBMIT", json.RootElement.GetProperty("error").GetProperty("code").GetString());
        await f.Service().SaveAnswerAsync(e, "A1", "A");
        var first = Assert.IsType<OkObjectResult>(await controller.Submit(new(
            new("Nguyễn Văn An", "0912345678", null, true)), default));
        var again = Assert.IsType<OkObjectResult>(await controller.Submit(null, default));
        Assert.Equal(JsonSerializer.Serialize(first.Value), JsonSerializer.Serialize(again.Value));
        Assert.Equal("no-store", controller.Response.Headers.CacheControl.ToString());
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
