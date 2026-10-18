using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class CurrentContestServiceTests
{
    private static readonly DateTime Now = new(2026, 10, 16, 5, 0, 0, DateTimeKind.Utc);
    private sealed class Clock : TimeProvider { public override DateTimeOffset GetUtcNow() => new(Now); }

    [Fact]
    public async Task SelectsOnlyActiveOngoingContest_AndCountsItsSelections()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var topic = new QuizTopic { Id = 1, Title = "Việc làm" };
        var question = new QuizQuestion { Code = "TEST01", TopicId = 1 };
        db.QuizTopics.Add(topic); db.QuizQuestions.Add(question);
        var chosen = new ContestCampaign { Name = "Đang thi", IsActive = true, StartAt = Now.AddDays(-1), EndAt = Now.AddDays(1), MaxAttempts = 3,
            Topics = [new ContestTopic { TopicId = 1 }], Questions = [new ContestQuestion { QuestionCode = "TEST01" }] };
        db.ContestCampaigns.AddRange(chosen,
            new ContestCampaign { Name = "Cũ hơn", IsActive = true, StartAt = Now.AddDays(-2), EndAt = Now.AddDays(1) },
            new ContestCampaign { Name = "Đã tắt", IsActive = false, StartAt = Now, EndAt = Now.AddDays(1) },
            new ContestCampaign { Name = "Chưa mở", IsActive = true, StartAt = Now.AddDays(1), EndAt = Now.AddDays(2) },
            new ContestCampaign { Name = "Đã hết", IsActive = true, StartAt = Now.AddDays(-1), EndAt = Now.AddSeconds(-1) });
        await db.SaveChangesAsync();
        var result = await new CurrentContestService(db, new Clock()).GetAsync();
        Assert.NotNull(result); Assert.Equal(chosen.Id, result.Id);
        Assert.Equal(1, result.QuestionCount); Assert.Equal(new[] { "Việc làm" }, result.Topics); Assert.Equal(3, result.MaxAttempts);
        chosen.IsActive = false;
        foreach (var campaign in db.ContestCampaigns.Local) campaign.IsActive = false;
        await db.SaveChangesAsync();
        Assert.Null(await new CurrentContestService(db, new Clock()).GetAsync());
    }
}
