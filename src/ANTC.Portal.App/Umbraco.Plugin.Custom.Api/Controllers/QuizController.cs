using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;
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
    private readonly IContestCatalog _catalog;
    private readonly TimeProvider _clock;

    public QuizController(IQuestionBank bank, IContestCatalog catalog, TimeProvider clock)
    {
        _bank = bank;
        _catalog = catalog;
        _clock = clock;
    }

    /// <summary>
    /// QUIZ-01: danh sach chuyen de dang dung. Co ?contest=: chi chuyen de cua de cuoc thi,
    /// count = so cau cua de trong chuyen de, theo thu tu de.
    /// </summary>
    [HttpGet("topics")]
    [ProducesResponseType<IReadOnlyList<TopicDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Topics([FromQuery] long? contest, CancellationToken cancellationToken = default)
    {
        QuestionBankSnapshot snapshot = _bank.Current;
        if (contest is null)
        {
            return Cached(snapshot.Topics, ETagOf(snapshot.Version));
        }

        (ContestInfo? info, IActionResult? error) = await ResolveContestAsync(contest.Value, cancellationToken);
        if (error is not null)
        {
            return error;
        }

        var topics = new List<TopicDto>();
        foreach (ContestExamTopic examTopic in info!.Topics)
        {
            TopicDto? topic = snapshot.Topics.FirstOrDefault(t => t.Cd == examTopic.Cd);
            if (topic is not null)
            {
                topics.Add(topic with { Count = examTopic.Count });
            }
        }

        return Cached(topics, ContestETag(snapshot.Version, info));
    }

    /// <summary>
    /// QUIZ-02: cau hoi dang dung cua mot chuyen de. Co ?contest=: chi cau cua de trong chuyen de,
    /// theo thu tu de (van tra ans, exp theo QD-016).
    /// </summary>
    [HttpGet("topics/{topic:int}/questions")]
    [ProducesResponseType<IReadOnlyList<QuestionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Questions(int topic, [FromQuery] long? contest, CancellationToken cancellationToken = default)
    {
        QuestionBankSnapshot snapshot = _bank.Current;
        ContestInfo? info = null;
        if (contest is not null)
        {
            (info, IActionResult? error) = await ResolveContestAsync(contest.Value, cancellationToken);
            if (error is not null)
            {
                return error;
            }
        }

        if (!snapshot.QuestionsByTopic.TryGetValue(topic, out var questions) ||
            (info is not null && info.Topics.All(t => t.TopicId != topic)))
        {
            return NotFound(Error("UNKNOWN_TOPIC", "Chuyên đề không tồn tại hoặc không còn dùng."));
        }

        if (info is null)
        {
            return Cached(questions, ETagOf(snapshot.Version));
        }

        var order = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (string code in info.QuestionCodes)
        {
            order[code] = order.Count;
        }

        List<QuestionDto> examQuestions = questions.Where(q => order.ContainsKey(q.Code))
            .OrderBy(q => order[q.Code]).ToList();
        return Cached(examQuestions, ContestETag(snapshot.Version, info));
    }

    /// <summary>QUIZ-03: cac cau cua trang Thu suc, theo thu tu.</summary>
    [HttpGet("sample")]
    [ProducesResponseType<IReadOnlyList<SampleQuestionDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public IActionResult Sample()
    {
        QuestionBankSnapshot snapshot = _bank.Current;
        return Cached(snapshot.Sample, ETagOf(snapshot.Version));
    }

    private static string ETagOf(long version) => $"\"quiz-v{version}\"";

    private static string ContestETag(long version, ContestInfo info) =>
        $"\"quiz-v{version}-c{info.Id}-{info.UpdatedAt.Ticks}\"";

    private static ApiErrorResponse Error(string code, string message) =>
        new(new ApiError(code, message, new Dictionary<string, string>()));

    /// <summary>Cuoc khong co hoac khong is_active: 404; cuoc upcoming: 403 (khong lo de truoc gio mo).</summary>
    private async Task<(ContestInfo? Info, IActionResult? Error)> ResolveContestAsync(long id, CancellationToken cancellationToken)
    {
        ContestInfo? info = id > 0 ? await _catalog.GetAsync(id, cancellationToken) : null;
        if (info is null)
        {
            return (null, NotFound(Error("CONTEST_NOT_FOUND", "Không tìm thấy cuộc thi.")));
        }

        if (info.StatusAt(_clock.GetUtcNow().UtcDateTime) == ContestState.Upcoming)
        {
            return (null, StatusCode(StatusCodes.Status403Forbidden,
                Error("CONTEST_CLOSED", "Cuộc thi chưa mở.")));
        }

        return (info, null);
    }

    private IActionResult Cached(object payload, string etag)
    {
        Response.Headers.ETag = etag;
        Response.Headers.CacheControl = "public, max-age=300";
        if (MatchesIfNoneMatch(etag))
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return Ok(payload);
    }

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
