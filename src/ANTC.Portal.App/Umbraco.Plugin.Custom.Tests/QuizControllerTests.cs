using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

public class QuizControllerTests
{
    [Fact]
    public void Questions_ActiveTopicWithoutQuestions_ReturnsEmptyArray()
    {
        QuizController controller = CreateController(Snapshot());

        OkObjectResult result = Assert.IsType<OkObjectResult>(controller.Questions(1));

        Assert.Empty(Assert.IsAssignableFrom<IReadOnlyList<QuestionDto>>(result.Value));
        Assert.Equal("\"quiz-v7\"", controller.Response.Headers.ETag);
        Assert.Equal("public, max-age=300", controller.Response.Headers.CacheControl);
    }

    [Fact]
    public void Questions_UnknownTopic_ReturnsStandardError()
    {
        QuizController controller = CreateController(Snapshot());

        NotFoundObjectResult result = Assert.IsType<NotFoundObjectResult>(controller.Questions(999));
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
    public void Topics_MatchingIfNoneMatch_Returns304(string ifNoneMatch)
    {
        QuizController controller = CreateController(Snapshot());
        controller.Request.Headers.IfNoneMatch = ifNoneMatch;

        StatusCodeResult result = Assert.IsType<StatusCodeResult>(controller.Topics());

        Assert.Equal(StatusCodes.Status304NotModified, result.StatusCode);
        Assert.Equal("\"quiz-v7\"", controller.Response.Headers.ETag);
        Assert.Equal("public, max-age=300", controller.Response.Headers.CacheControl);
    }

    private static QuizController CreateController(QuestionBankSnapshot snapshot) => new(new FakeQuestionBank(snapshot))
    {
        ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
    };

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
