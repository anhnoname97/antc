using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Quiz;

// Cau truc JSON tra ve cho trinh duyet giu dung nhu du lieu trong ban dung
// (docs/ban-dung/an-toan-tai-chinh-website.html) de FE dung lai ma hien thi.

public record TopicDto(
    [property: JsonPropertyName("cd")] string Cd,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("count")] int Count,
    [property: JsonPropertyName("intro")] JsonElement Intro,
    [property: JsonPropertyName("terms")] JsonElement Terms);

public record QuestionDto(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("kind")] string Kind,
    [property: JsonPropertyName("sit")] string Sit,
    [property: JsonPropertyName("q")] string Q,
    [property: JsonPropertyName("opt")] JsonElement Opt,
    [property: JsonPropertyName("ans")] string Ans,
    [property: JsonPropertyName("exp")] JsonElement Exp,
    [property: JsonPropertyName("safe")] string Safe,
    [property: JsonPropertyName("sec")] int Sec);

public record SampleQuestionDto(
    [property: JsonPropertyName("cd")] string Cd,
    [property: JsonPropertyName("lab")] string Lab,
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("sit")] string Sit,
    [property: JsonPropertyName("q")] string Q,
    [property: JsonPropertyName("opt")] JsonElement Opt,
    [property: JsonPropertyName("ans")] string Ans,
    [property: JsonPropertyName("exp")] JsonElement Exp,
    [property: JsonPropertyName("safe")] string Safe);

/// <summary>Thong tin can de cham mot cau.</summary>
public record AnswerKey(string Code, int TopicId, string Answer, IReadOnlySet<string> Letters);

/// <summary>Ban chup ngan hang cau hoi trong bo nho.</summary>
public class QuestionBankSnapshot
{
    /// <summary>So phien ban = ma lan nhap gan nhat (0 neu chua nhap lan nao). Dung lam ETag.</summary>
    public long Version { get; init; }
    public IReadOnlyList<TopicDto> Topics { get; init; } = Array.Empty<TopicDto>();
    public IReadOnlyDictionary<int, IReadOnlyList<QuestionDto>> QuestionsByTopic { get; init; } = new Dictionary<int, IReadOnlyList<QuestionDto>>();
    public IReadOnlyList<SampleQuestionDto> Sample { get; init; } = Array.Empty<SampleQuestionDto>();
    public IReadOnlyDictionary<string, AnswerKey> Keys { get; init; } = new Dictionary<string, AnswerKey>();
    public int TotalQuestions => Keys.Count;
    /// <summary>Chuỗi phiên bản dùng trực tiếp cho ETag.</summary>
    public string CacheKey { get; init; } = "";
    public IReadOnlyList<ContestQuestionBankSnapshot> Contests { get; init; } = Array.Empty<ContestQuestionBankSnapshot>();
}

public sealed record ContestQuestionBankSnapshot(
    long ContestId,
    string Name,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int MaxAttempts,
    QuestionBankSnapshot Bank);

public interface IQuestionBank
{
    /// <summary>Ban chup hien tai; tai tu CSDL o lan goi dau.</summary>
    QuestionBankSnapshot Current { get; }

    /// <summary>Ngân hàng đã chụp của cuộc thi đang diễn ra; ngoài thời gian thi trả ngân hàng luyện tập.</summary>
    QuestionBankSnapshot CurrentAt(DateTime utcNow) => Current;

    /// <summary>Tai lai tu CSDL. Goi sau moi lan nhap ma tran cau hoi.</summary>
    void Reload();
}

/// <summary>
/// Doc ngan hang cau hoi tu CSDL va giu trong bo nho. Cac API doc cau hoi va viec cham diem
/// deu lay tu day, khong truy van CSDL o moi yeu cau.
/// </summary>
public class QuestionBank : IQuestionBank
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly object _lock = new();
    private QuestionBankSnapshot? _current;

    public QuestionBank(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public QuestionBankSnapshot Current
    {
        get
        {
            QuestionBankSnapshot? current = Volatile.Read(ref _current);
            if (current is not null)
            {
                return current;
            }

            lock (_lock)
            {
                current = _current;
                if (current is null)
                {
                    current = Load();
                    Volatile.Write(ref _current, current);
                }

                return current;
            }
        }
    }

    public void Reload()
    {
        lock (_lock)
        {
            Volatile.Write(ref _current, Load());
        }
    }

    public QuestionBankSnapshot CurrentAt(DateTime utcNow)
    {
        QuestionBankSnapshot root = Current;
        ContestQuestionBankSnapshot? contest = root.Contests
            .Where(x => x.StartAt <= utcNow && x.EndAt >= utcNow)
            .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.ContestId)
            .FirstOrDefault();
        return contest?.Bank ?? root;
    }

    private QuestionBankSnapshot Load()
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        List<QuizTopic> topics = db.QuizTopics.AsNoTracking().Where(t => t.IsActive).OrderBy(t => t.Id).ToList();
        int[] activeTopicIds = topics.Select(t => t.Id).ToArray();
        List<QuizQuestion> questions = db.QuizQuestions.AsNoTracking()
            .Where(q => q.IsActive && activeTopicIds.Contains(q.TopicId))
            .OrderBy(q => q.TopicId).ThenBy(q => q.SortOrder).ToList();
        long version = db.QuizImports.Any() ? db.QuizImports.Max(i => i.Id) : 0;
        List<ContestCampaign> contests = db.ContestCampaigns.AsNoTracking()
            .Where(x => x.IsActive)
            .Include(x => x.Topics)
            .Include(x => x.Questions)
            .AsSplitQuery()
            .ToList();

        var byTopic = topics.ToDictionary(
            topic => topic.Id,
            _ => (IReadOnlyList<QuestionDto>)Array.Empty<QuestionDto>());
        var keys = new Dictionary<string, AnswerKey>();
        foreach (IGrouping<int, QuizQuestion> group in questions.GroupBy(q => q.TopicId))
        {
            byTopic[group.Key] = group.Select(q => new QuestionDto(
                q.Code, q.Kind, q.Situation ?? "", q.Question, Parse(q.Options), q.Answer, Parse(q.Explanations),
                q.SafeAction ?? "", q.ReadSeconds)).ToList();
        }

        foreach (QuizQuestion q in questions)
        {
            var letters = Parse(q.Options).EnumerateArray().Select(o => o[0].GetString() ?? "").ToHashSet();
            keys[q.Code] = new AnswerKey(q.Code, q.TopicId, q.Answer, letters);
        }

        var snapshot = new QuestionBankSnapshot
        {
            Version = version,
            CacheKey = $"quiz-v{version}",
            Topics = topics.Select(t => new TopicDto(
                t.Id.ToString(), t.Title, byTopic.TryGetValue(t.Id, out var list) ? list.Count : 0,
                Parse(t.Intro), Parse(t.Terms ?? "[]"))).ToList(),
            QuestionsByTopic = byTopic,
            Sample = questions.Where(q => q.SampleOrder is not null).OrderBy(q => q.SampleOrder)
                .Select(q => new SampleQuestionDto(
                    q.TopicId.ToString(), q.SampleLabel ?? "", q.Code, q.Situation ?? "", q.Question,
                    Parse(q.Options), q.Answer, Parse(q.Explanations), q.SafeAction ?? "")).ToList(),
            Keys = keys,
            Contests = contests.Select(BuildContestSnapshot).ToList(),
        };
        return snapshot;
    }

    private static ContestQuestionBankSnapshot BuildContestSnapshot(ContestCampaign contest)
    {
        List<ContestTopic> topics = contest.Topics.OrderBy(x => x.SortOrder).ThenBy(x => x.TopicId).ToList();
        List<ContestQuestion> questions = contest.Questions.OrderBy(x => x.TopicId).ThenBy(x => x.SortOrder).ThenBy(x => x.QuestionCode).ToList();
        var byTopic = topics.ToDictionary(x => x.TopicId, topic => (IReadOnlyList<QuestionDto>)questions
            .Where(q => q.TopicId == topic.TopicId)
            .Select(q => new QuestionDto(q.QuestionCode, q.Kind, q.Situation ?? "", q.QuestionText,
                Parse(q.Options), q.Answer, Parse(q.Explanations), q.SafeAction ?? "", q.ReadSeconds)).ToList());
        var keys = questions.ToDictionary(q => q.QuestionCode,
            q => new AnswerKey(q.QuestionCode, q.TopicId, q.Answer,
                Parse(q.Options).EnumerateArray().Select(o => o[0].GetString() ?? "").ToHashSet()));
        string cacheKey = $"quiz-c{contest.Id}-v{contest.BankVersion}-r{contest.Revision}";
        var bank = new QuestionBankSnapshot
        {
            Version = contest.BankVersion,
            CacheKey = cacheKey,
            Topics = topics.Select(t => new TopicDto(t.TopicId.ToString(), t.Title,
                byTopic.GetValueOrDefault(t.TopicId)?.Count ?? 0, Parse(t.Intro), Parse(t.Terms ?? "[]"))).ToList(),
            QuestionsByTopic = byTopic,
            Sample = questions.Where(q => q.SampleOrder is not null).OrderBy(q => q.SampleOrder)
                .Select(q => new SampleQuestionDto(q.TopicId.ToString(), q.SampleLabel ?? "", q.QuestionCode,
                    q.Situation ?? "", q.QuestionText, Parse(q.Options), q.Answer, Parse(q.Explanations), q.SafeAction ?? "")).ToList(),
            Keys = keys,
        };
        return new ContestQuestionBankSnapshot(contest.Id, contest.Name, contest.Description,
            contest.StartAt, contest.EndAt, contest.MaxAttempts, bank);
    }

    private static JsonElement Parse(string json)
    {
        using JsonDocument doc = JsonDocument.Parse(json);
        return doc.RootElement.Clone();
    }
}
