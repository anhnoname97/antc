using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Api.Controllers;

/// <summary>
/// Ba API chi doc ngan hang cau hoi (QUIZ-01..03 trong sheet "API" cua file ke hoach).
/// Du lieu lay tu bo nho cua IQuestionBank, khong truy van CSDL o moi yeu cau.
/// </summary>
[ApiController]
[Route("api/v1/quiz")]
public class QuizController : ControllerBase
{
    private readonly IQuestionBank _bank;
    private readonly TimeProvider _clock;

    public QuizController(IQuestionBank bank, TimeProvider? clock = null)
    {
        _bank = bank;
        _clock = clock ?? TimeProvider.System;
    }

    private QuestionBankSnapshot Snapshot() => _bank.CurrentAt(_clock.GetUtcNow().UtcDateTime);

    /// <summary>QUIZ-01: danh sach chuyen de dang dung.</summary>
    [HttpGet("topics")]
    [ProducesResponseType<IReadOnlyList<TopicDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public IActionResult Topics()
    {
        QuestionBankSnapshot snapshot = Snapshot();
        return Cached(snapshot.Topics, CacheKey(snapshot));
    }

    /// <summary>QUIZ-02: cau hoi dang dung cua mot chuyen de.</summary>
    [HttpGet("topics/{topic:int}/questions")]
    [ProducesResponseType<IReadOnlyList<QuestionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public IActionResult Questions(int topic)
    {
        QuestionBankSnapshot snapshot = Snapshot();
        if (!snapshot.QuestionsByTopic.TryGetValue(topic, out var questions))
        {
            return NotFound(new ApiErrorResponse(new ApiError(
                "UNKNOWN_TOPIC",
                "Chuyên đề không tồn tại hoặc không còn dùng.",
                new Dictionary<string, string>())));
        }

        return Cached(questions, CacheKey(snapshot));
    }

    /// <summary>QUIZ-03: cac cau cua trang Thu suc, theo thu tu.</summary>
    [HttpGet("sample")]
    [ProducesResponseType<IReadOnlyList<SampleQuestionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public IActionResult Sample()
    {
        QuestionBankSnapshot snapshot = Snapshot();
        return Cached(snapshot.Sample, CacheKey(snapshot));
    }

    private IActionResult Cached(object payload, string cacheKey)
    {
        string etag = $"\"{(string.IsNullOrWhiteSpace(cacheKey) ? "quiz-v0" : cacheKey)}\"";
        Response.Headers.ETag = etag;
        Response.Headers.CacheControl = "public, max-age=300";
        if (MatchesIfNoneMatch(etag))
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return Ok(payload);
    }

    private static string CacheKey(QuestionBankSnapshot snapshot) =>
        string.IsNullOrWhiteSpace(snapshot.CacheKey) ? $"quiz-v{snapshot.Version}" : snapshot.CacheKey;

    private bool MatchesIfNoneMatch(string etag)
    {
        foreach (string? value in Request.Headers.IfNoneMatch)
        {
            foreach (string candidateValue in (value ?? "").Split(','))
            {
                string candidate = candidateValue.Trim();
                if (candidate == "*" || candidate == etag ||
                    (candidate.StartsWith("W/", StringComparison.OrdinalIgnoreCase) && candidate[2..] == etag))
                {
                    return true;
                }
            }
        }

        return false;
    }
}
