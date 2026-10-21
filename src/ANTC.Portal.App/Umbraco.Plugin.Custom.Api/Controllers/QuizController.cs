using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Api.Controllers;

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

    [HttpGet("topics")]
    public async Task<IActionResult> Topics([FromQuery] long? contest, CancellationToken cancellationToken = default)
    {
        QuestionBankSnapshot root = _bank.Current;
        if (contest is null) return Cached(root.Topics, CacheKey(root));

        (ContestInfo? info, IActionResult? error) = await ResolveContestAsync(contest.Value, cancellationToken);
        if (error is not null) return error;

        QuestionBankSnapshot? snapshot = ContestSnapshot(root, contest.Value);
        if (snapshot is not null) return Cached(snapshot.Topics, CacheKey(snapshot));

        HashSet<int> selected = info!.Topics.Select(x => x.TopicId).ToHashSet();
        List<TopicDto> topics = root.Topics.Where(x => int.TryParse(x.Cd, out int id) && selected.Contains(id))
            .Select(x => x with { Count = info.Topics.First(t => t.TopicId.ToString() == x.Cd).Count })
            .ToList();
        return Cached(topics, ContestCacheKey(root.Version, info));
    }

    [HttpGet("topics/{topic:int}/questions")]
    public async Task<IActionResult> Questions(
        int topic, [FromQuery] long? contest, CancellationToken cancellationToken = default)
    {
        QuestionBankSnapshot root = _bank.Current;
        if (contest is null)
        {
            if (!root.QuestionsByTopic.TryGetValue(topic, out IReadOnlyList<QuestionDto>? all))
                return UnknownTopic();
            return Cached(all, CacheKey(root));
        }

        (ContestInfo? info, IActionResult? error) = await ResolveContestAsync(contest.Value, cancellationToken);
        if (error is not null) return error;

        QuestionBankSnapshot? snapshot = ContestSnapshot(root, contest.Value);
        if (snapshot is not null)
        {
            if (!snapshot.QuestionsByTopic.TryGetValue(topic, out IReadOnlyList<QuestionDto>? snapQuestions))
                return UnknownTopic();
            return Cached(snapQuestions, CacheKey(snapshot));
        }

        if (!root.QuestionsByTopic.TryGetValue(topic, out IReadOnlyList<QuestionDto>? questions) ||
            info!.Topics.All(x => x.TopicId != topic))
            return UnknownTopic();

        var order = info.QuestionCodes.Select((code, index) => new { code, index })
            .ToDictionary(x => x.code, x => x.index, StringComparer.Ordinal);
        List<QuestionDto> filtered = questions.Where(x => order.ContainsKey(x.Code))
            .OrderBy(x => order[x.Code]).ToList();
        return Cached(filtered, ContestCacheKey(root.Version, info));
    }

    [HttpGet("sample")]
    public IActionResult Sample()
    {
        QuestionBankSnapshot snapshot = _bank.Current;
        return Cached(snapshot.Sample, CacheKey(snapshot));
    }

    private async Task<(ContestInfo? Info, IActionResult? Error)> ResolveContestAsync(long id, CancellationToken ct)
    {
        ContestInfo? info = await _catalog.GetAsync(id, ct);
        if (info is null)
            return (null, NotFound(Error("CONTEST_NOT_FOUND", "Không tìm thấy cuộc thi.")));
        if (info.StatusAt(_clock.GetUtcNow().UtcDateTime) != ContestState.Ongoing)
            return (null, StatusCode(StatusCodes.Status403Forbidden,
                Error("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc.")));
        return (info, null);
    }

    private static QuestionBankSnapshot? ContestSnapshot(QuestionBankSnapshot root, long contestId) =>
        root.Contests.FirstOrDefault(x => x.ContestId == contestId)?.Bank;

    private IActionResult Cached(object payload, string cacheKey)
    {
        string etag = $"\"{cacheKey}\"";
        Response.Headers.ETag = etag;
        Response.Headers.CacheControl = "public, max-age=300";
        return MatchesIfNoneMatch(etag) ? StatusCode(StatusCodes.Status304NotModified) : Ok(payload);
    }

    private static string CacheKey(QuestionBankSnapshot snapshot) =>
        string.IsNullOrWhiteSpace(snapshot.CacheKey) ? $"quiz-v{snapshot.Version}" : snapshot.CacheKey;

    private static string ContestCacheKey(long version, ContestInfo info) =>
        $"quiz-v{version}-c{info.Id}-{info.UpdatedAt.Ticks}";

    private IActionResult UnknownTopic() =>
        NotFound(Error("UNKNOWN_TOPIC", "Chuyên đề không tồn tại hoặc không còn dùng."));

    private static ApiErrorResponse Error(string code, string message) =>
        new(new ApiError(code, message, new Dictionary<string, string>()));

    private bool MatchesIfNoneMatch(string etag)
    {
        foreach (string? value in Request.Headers.IfNoneMatch)
        foreach (string candidateValue in (value ?? "").Split(','))
        {
            string candidate = candidateValue.Trim();
            if (candidate == "*" || candidate == etag ||
                (candidate.StartsWith("W/", StringComparison.OrdinalIgnoreCase) && candidate[2..] == etag))
                return true;
        }
        return false;
    }
}
