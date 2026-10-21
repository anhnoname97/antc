using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestCatalogTests
{
    private static readonly DateTime Now = new(2026, 10, 16, 5, 0, 0, DateTimeKind.Utc);
    private sealed class Clock : TimeProvider { public override DateTimeOffset GetUtcNow() => new(Now); }

    private sealed class FakeBank(params (string Code, int TopicId)[] active) : IQuestionBank
    {
        public QuestionBankSnapshot Current { get; } = new()
        {
            Topics = active.Select(x => x.TopicId).Distinct().OrderBy(x => x)
                .Select(id => new TopicDto(id.ToString(), $"Chuyên đề {id}", 0, default, default)).ToList(),
            Keys = active.ToDictionary(x => x.Code, x => new AnswerKey(x.Code, x.TopicId, "A", new HashSet<string> { "A" })),
        };
        public void Reload() { }
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection = new("Data Source=:memory:");
        public AppDbContext Db { get; private set; } = null!;

        public static async Task<Fixture> CreateAsync()
        {
            var fixture = new Fixture();
            await fixture._connection.OpenAsync();
            fixture.Db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(fixture._connection).Options);
            await fixture.Db.Database.EnsureCreatedAsync();
            fixture.Db.QuizTopics.AddRange(
                new QuizTopic { Id = 1, Title = "Việc làm" }, new QuizTopic { Id = 2, Title = "Đầu tư" });
            fixture.Db.QuizQuestions.AddRange(
                new QuizQuestion { Code = "A1", TopicId = 1 }, new QuizQuestion { Code = "A2", TopicId = 1 },
                new QuizQuestion { Code = "B1", TopicId = 2 });
            await fixture.Db.SaveChangesAsync();
            return fixture;
        }

        public ContestCatalog Catalog(IQuestionBank? bank = null) =>
            new(Db, bank ?? new FakeBank(("A1", 1), ("A2", 1), ("B1", 2)), new Clock());

        public async ValueTask DisposeAsync() { await Db.DisposeAsync(); await _connection.DisposeAsync(); }
    }

    private static ContestCampaign Campaign(string name, DateTime start, DateTime end, bool active = true, int grace = 24) =>
        new() { Name = name, IsActive = active, StartAt = start, EndAt = end, SubmitGraceHours = grace, MaxAttempts = 3 };

    [Fact]
    public async Task Status_StartAtIsInclusive_EndAtIsExclusive()
    {
        await using var f = await Fixture.CreateAsync();
        var contest = Campaign("Mốc", Now, Now.AddDays(1));
        f.Db.ContestCampaigns.Add(contest);
        await f.Db.SaveChangesAsync();
        ContestInfo info = (await f.Catalog().GetAsync(contest.Id))!;

        Assert.Equal(ContestState.Upcoming, info.StatusAt(Now.AddTicks(-1)));
        Assert.Equal(ContestState.Ongoing, info.StatusAt(Now));
        Assert.Equal(ContestState.Ongoing, info.StatusAt(Now.AddDays(1).AddTicks(-1)));
        Assert.Equal(ContestState.Ended, info.StatusAt(Now.AddDays(1)));

        var schedule = await f.Catalog().GetScheduleAsync(Now);
        Assert.Single(schedule.Ongoing);
        schedule = await f.Catalog().GetScheduleAsync(Now.AddTicks(-1));
        Assert.Single(schedule.Upcoming); Assert.Empty(schedule.Ongoing);
        schedule = await f.Catalog().GetScheduleAsync(Now.AddDays(1));
        Assert.Single(schedule.Ended); Assert.Empty(schedule.Ongoing);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(24)]
    public async Task SubmitUntil_AndPhase_FollowGraceHours(int grace)
    {
        await using var f = await Fixture.CreateAsync();
        var contest = Campaign("Hạn nộp", Now.AddDays(-2), Now.AddDays(-1), grace: grace);
        f.Db.ContestCampaigns.Add(contest);
        await f.Db.SaveChangesAsync();
        ContestInfo info = (await f.Catalog().GetAsync(contest.Id))!;

        Assert.Equal(contest.EndAt.AddHours(grace), info.SubmitUntil);
        Assert.Equal(ContestPhase.Open, info.PhaseAt(info.EndAt.AddTicks(-1)));
        Assert.Equal(grace == 0 ? ContestPhase.Closed : ContestPhase.SubmitOnly, info.PhaseAt(info.EndAt));
        Assert.Equal(ContestPhase.Closed, info.PhaseAt(info.SubmitUntil));
        if (grace > 0) Assert.Equal(ContestPhase.SubmitOnly, info.PhaseAt(info.SubmitUntil.AddTicks(-1)));
        Assert.Equal(ContestPhase.Closed, info.PhaseAt(info.StartAt.AddTicks(-1)));
    }

    [Fact]
    public async Task InactiveContest_IsNotReturnedAnywhere()
    {
        await using var f = await Fixture.CreateAsync();
        var off = Campaign("Đã tắt", Now.AddDays(-1), Now.AddDays(1), active: false);
        f.Db.ContestCampaigns.AddRange(off,
            Campaign("Tắt sắp tới", Now.AddDays(1), Now.AddDays(2), active: false),
            Campaign("Tắt đã qua", Now.AddDays(-3), Now.AddDays(-2), active: false));
        await f.Db.SaveChangesAsync();

        Assert.Null(await f.Catalog().GetAsync(off.Id));
        Assert.Null(await f.Catalog().GetCurrentAsync());
        var schedule = await f.Catalog().GetScheduleAsync(Now);
        Assert.Empty(schedule.Ongoing); Assert.Empty(schedule.Upcoming); Assert.Empty(schedule.Ended);
        Assert.Equal(Now, schedule.ServerTime);
    }

    [Fact]
    public async Task Exam_DropsDeactivatedQuestions_AndFollowsConfiguredOrder()
    {
        await using var f = await Fixture.CreateAsync();
        var contest = Campaign("Đề", Now.AddDays(-1), Now.AddDays(1));
        contest.Topics = [new ContestTopic { TopicId = 1, SortOrder = 2 }, new ContestTopic { TopicId = 2, SortOrder = 1 }];
        contest.Questions =
        [
            new ContestQuestion { QuestionCode = "A2", SortOrder = 1 },
            new ContestQuestion { QuestionCode = "A1", SortOrder = 2 },
            new ContestQuestion { QuestionCode = "B1", SortOrder = 3 },
        ];
        f.Db.ContestCampaigns.Add(contest);
        await f.Db.SaveChangesAsync();

        ContestInfo info = (await f.Catalog().GetAsync(contest.Id))!;
        Assert.Equal(new[] { "B1", "A2", "A1" }, info.QuestionCodes);
        Assert.Equal(new[] { "2", "1" }, info.Topics.Select(x => x.Cd));
        Assert.Equal(new[] { 1, 2 }, info.Topics.Select(x => x.Count));

        // Cau bi ngung dung sau khi tao cuoc roi khoi de, ca chuyen de neu het cau.
        ContestInfo shrunk = (await f.Catalog(new FakeBank(("A1", 1))).GetAsync(contest.Id))!;
        Assert.Equal(new[] { "A1" }, shrunk.QuestionCodes);
        Assert.Equal(new[] { "1" }, shrunk.Topics.Select(x => x.Cd));
        Assert.Equal(1, shrunk.QuestionCount);
    }

    [Fact]
    public async Task Schedule_OrdersOngoingByLatestStart_AndCapsEnded()
    {
        await using var f = await Fixture.CreateAsync();
        var older = Campaign("Cũ hơn", Now.AddDays(-2), Now.AddDays(1));
        var newest = Campaign("Mới nhất", Now.AddDays(-1), Now.AddDays(1));
        var same = Campaign("Cùng giờ", Now.AddDays(-1), Now.AddDays(2));
        f.Db.ContestCampaigns.AddRange(older, newest, same,
            Campaign("Sắp xa", Now.AddDays(5), Now.AddDays(6)), Campaign("Sắp gần", Now.AddDays(1), Now.AddDays(2)));
        for (int i = 0; i < 14; i++) f.Db.ContestCampaigns.Add(Campaign($"Qua {i}", Now.AddDays(-30 - i), Now.AddDays(-20 - i)));
        await f.Db.SaveChangesAsync();

        var schedule = await f.Catalog().GetScheduleAsync(Now);
        Assert.Equal(new[] { same.Id, newest.Id, older.Id }, schedule.Ongoing.Select(x => x.Id));
        Assert.Equal(new[] { "Sắp gần", "Sắp xa" }, schedule.Upcoming.Select(x => x.Name));
        Assert.Equal(ContestCatalog.MaxEnded, schedule.Ended.Count);
        Assert.Equal("Qua 0", schedule.Ended[0].Name);
        Assert.Equal(same.Id, (await f.Catalog().GetCurrentAsync())!.Id);
    }

    [Fact]
    public async Task CurrentContestService_ReturnsLatestOngoing_WithExamCountsAndTopicTitles()
    {
        await using var f = await Fixture.CreateAsync();
        var chosen = Campaign("Đang thi", Now.AddDays(-1), Now.AddDays(1));
        chosen.Topics = [new ContestTopic { TopicId = 1 }];
        chosen.Questions = [new ContestQuestion { QuestionCode = "A1" }];
        f.Db.ContestCampaigns.AddRange(chosen,
            Campaign("Cũ hơn", Now.AddDays(-2), Now.AddDays(1)),
            Campaign("Đã tắt", Now, Now.AddDays(1), active: false),
            Campaign("Chưa mở", Now.AddDays(1), Now.AddDays(2)),
            Campaign("Đã hết", Now.AddDays(-1), Now.AddSeconds(-1)));
        await f.Db.SaveChangesAsync();

        CurrentContest? result = await new CurrentContestService(f.Catalog()).GetAsync();
        Assert.NotNull(result); Assert.Equal(chosen.Id, result.Id);
        Assert.Equal(1, result.QuestionCount); Assert.Equal(new[] { "Chuyên đề 1" }, result.Topics); Assert.Equal(3, result.MaxAttempts);

        foreach (var campaign in f.Db.ContestCampaigns.Local) campaign.IsActive = false;
        await f.Db.SaveChangesAsync();
        Assert.Null(await new CurrentContestService(f.Catalog()).GetAsync());
    }
}
