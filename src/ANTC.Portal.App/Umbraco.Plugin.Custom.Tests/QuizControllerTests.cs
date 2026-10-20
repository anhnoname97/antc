using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

public class QuizControllerTests
{
    [Fact]
    public async Task Questions_ActiveTopicWithoutQuestions_ReturnsEmptyArray()
    {
        QuizController controller = CreateController(Snapshot());

        OkObjectResult result = Assert.IsType<OkObjectResult>(await controller.Questions(1, null));

        Assert.Empty(Assert.IsAssignableFrom<IReadOnlyList<QuestionDto>>(result.Value));
        Assert.Equal("\"quiz-v7\"", controller.Response.Headers.ETag);
        Assert.Equal("public, max-age=300", controller.Response.Headers.CacheControl);
    }

    [Fact]
    public async Task Questions_UnknownTopic_ReturnsStandardError()
    {
        QuizController controller = CreateController(Snapshot());

        NotFoundObjectResult result = Assert.IsType<NotFoundObjectResult>(await controller.Questions(999, null));
        ApiErrorResponse response = Assert.IsType<ApiErrorResponse>(result.Value);

        Assert.Equal("UNKNOWN_TOPIC", response.Error.Code);
        Assert.NotNull(response.Error.Fields);
        Assert.Empty(response.Error.Fields);
    }

    [Theory]
    [InlineData("\"quiz-v7\"")]
    [InlineData("W/\"quiz-v7\"")]
    [InlineData("\"another\", W/\"quiz-v7\"")]
    [InlineData("*")]
    public async Task Topics_MatchingIfNoneMatch_Returns304(string ifNoneMatch)
    {
        QuizController controller = CreateController(Snapshot());
        controller.Request.Headers.IfNoneMatch = ifNoneMatch;

        StatusCodeResult result = Assert.IsType<StatusCodeResult>(await controller.Topics(null));

        Assert.Equal(StatusCodes.Status304NotModified, result.StatusCode);
        Assert.Equal("\"quiz-v7\"", controller.Response.Headers.ETag);
        Assert.Equal("public, max-age=300", controller.Response.Headers.CacheControl);
    }

    private static readonly DateTime Now = new(2026, 10, 16, 5, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Topics_WithContest_FiltersByExamAndUsesContestETag()
    {
        ContestInfo info = Contest(Now.AddDays(-1), Now.AddDays(1));
        QuizController controller = CreateController(ContestSnapshot(), info);

        OkObjectResult result = Assert.IsType<OkObjectResult>(await controller.Topics(3));

        TopicDto topic = Assert.Single(Assert.IsAssignableFrom<IReadOnlyList<TopicDto>>(result.Value));
        Assert.Equal("2", topic.Cd);
        Assert.Equal(1, topic.Count);
        Assert.Equal($"\"quiz-v7-c3-{info.UpdatedAt.Ticks}\"", controller.Response.Headers.ETag);
    }

    [Fact]
    public async Task Topics_ContestEdited_ETagChanges()
    {
        QuizController first = CreateController(ContestSnapshot(), Contest(Now.AddDays(-1), Now.AddDays(1)));
        QuizController second = CreateController(ContestSnapshot(), Contest(Now.AddDays(-1), Now.AddDays(1)) with { UpdatedAt = Now.AddMinutes(1) });

        await first.Topics(3);
        await second.Topics(3);

        Assert.NotEqual(first.Response.Headers.ETag, second.Response.Headers.ETag);
    }

    [Fact]
    public async Task Questions_WithContest_ReturnsOnlyExamQuestionsInExamOrder()
    {
        QuizController controller = CreateController(ContestSnapshot(), Contest(Now.AddDays(-1), Now.AddDays(1)));

        OkObjectResult result = Assert.IsType<OkObjectResult>(await controller.Questions(2, 3));

        Assert.Equal(new[] { "B2" }, Assert.IsAssignableFrom<IReadOnlyList<QuestionDto>>(result.Value).Select(q => q.Code));
    }

    [Fact]
    public async Task Questions_WithContest_TopicOutsideExam_Returns404UnknownTopic()
    {
        QuizController controller = CreateController(ContestSnapshot(), Contest(Now.AddDays(-1), Now.AddDays(1)));

        NotFoundObjectResult result = Assert.IsType<NotFoundObjectResult>(await controller.Questions(1, 3));

        Assert.Equal("UNKNOWN_TOPIC", Assert.IsType<ApiErrorResponse>(result.Value).Error.Code);
    }

    [Fact]
    public async Task Topics_UpcomingContest_Returns403()
    {
        QuizController controller = CreateController(ContestSnapshot(), Contest(Now.AddDays(1), Now.AddDays(2)));

        ObjectResult result = Assert.IsType<ObjectResult>(await controller.Topics(3));

        Assert.Equal(StatusCodes.Status403Forbidden, result.StatusCode);
        Assert.Equal("CONTEST_CLOSED", Assert.IsType<ApiErrorResponse>(result.Value).Error.Code);
    }

    [Fact]
    public async Task Questions_UnknownContest_Returns404ContestNotFound()
    {
        QuizController controller = CreateController(ContestSnapshot(), null);

        NotFoundObjectResult result = Assert.IsType<NotFoundObjectResult>(await controller.Questions(2, 9));

        Assert.Equal("CONTEST_NOT_FOUND", Assert.IsType<ApiErrorResponse>(result.Value).Error.Code);
    }

    private static ContestInfo Contest(DateTime start, DateTime end) => new(
        3, "Cuộc thi", null, start, end, 2, 24, 1m, null,
        new[] { new ContestExamTopic("2", 2, "Topic 2", 1) }, new[] { "B2" }, Now.AddDays(-5));

    private static QuestionBankSnapshot ContestSnapshot() => new()
    {
        Version = 7,
        Topics = new[]
        {
            new TopicDto("1", "Topic 1", 1, Json("[]"), Json("[]")),
            new TopicDto("2", "Topic 2", 2, Json("[]"), Json("[]")),
        },
        QuestionsByTopic = new Dictionary<int, IReadOnlyList<QuestionDto>>
        {
            [1] = new[] { Question("A1") },
            [2] = new[] { Question("B1"), Question("B2") },
        },
    };

    private static QuestionDto Question(string code) =>
        new(code, "k", "", "q", Json("[]"), "A", Json("{}"), "", 10);

    private static QuizController CreateController(QuestionBankSnapshot snapshot, ContestInfo? contest = null) =>
        new(new FakeQuestionBank(snapshot), new FakeCatalog(contest), new FixedClock())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(Now);
    }

    private sealed class FakeCatalog(ContestInfo? contest) : IContestCatalog
    {
        public Task<ContestInfo?> GetAsync(long id, CancellationToken cancellationToken = default) =>
            Task.FromResult(contest is not null && contest.Id == id ? contest : null);
        public Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
        public Task<ContestInfo?> GetCurrentAsync(CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }

    private static QuestionBankSnapshot Snapshot() => new()
    {
        Version = 7,
        Topics = new[]
        {
            new TopicDto("1", "Topic 1", 0, Json("[]"), Json("[]")),
        },
        QuestionsByTopic = new Dictionary<int, IReadOnlyList<QuestionDto>>
        {
            [1] = Array.Empty<QuestionDto>(),
        },
    };

    private static System.Text.Json.JsonElement Json(string value)
    {
        using System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.Parse(value);
        return document.RootElement.Clone();
    }

    private sealed class FakeQuestionBank(QuestionBankSnapshot snapshot) : IQuestionBank
    {
        public QuestionBankSnapshot Current { get; } = snapshot;
        public void Reload() { }
    }
}
