using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Quiz;

public interface IQuizAdminService
{
    Task<PagedResult<QuizTopicAdminDto>> SearchTopicsAsync(string? search, bool? isActive, int page, int pageSize, CancellationToken ct);
    Task<QuizTopicAdminDto?> GetTopicAsync(int id, CancellationToken ct);
    Task<QuizTopicAdminDto> CreateTopicAsync(SaveQuizTopicRequest request, string actor, CancellationToken ct);
    Task<QuizTopicAdminDto?> UpdateTopicAsync(int id, SaveQuizTopicRequest request, string actor, CancellationToken ct);
    Task<bool> DeleteTopicAsync(int id, string actor, CancellationToken ct);
    Task<PagedResult<QuizQuestionAdminDto>> SearchQuestionsAsync(string? search, int? topicId, bool? isActive, int page, int pageSize, CancellationToken ct);
    Task<QuizQuestionAdminDto?> GetQuestionAsync(string code, CancellationToken ct);
    Task<QuizQuestionAdminDto> CreateQuestionAsync(SaveQuizQuestionRequest request, string actor, CancellationToken ct);
    Task<QuizQuestionAdminDto?> UpdateQuestionAsync(string code, SaveQuizQuestionRequest request, string actor, CancellationToken ct);
    Task<DeleteQuizQuestionResult?> DeleteQuestionAsync(string code, string actor, CancellationToken ct);
}

public sealed partial class QuizAdminService(AppDbContext db, IQuestionBank bank, TimeProvider timeProvider) : IQuizAdminService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] AnswerKeys = ["A", "B", "C", "D"];

    public async Task<PagedResult<QuizTopicAdminDto>> SearchTopicsAsync(
        string? search, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        IQueryable<QuizTopic> query = db.QuizTopics.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim().ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(term) || x.Id.ToString().Contains(term));
        }
        if (isActive is not null) query = query.Where(x => x.IsActive == isActive);

        int total = await query.CountAsync(ct);
        List<QuizTopic> topics = await query.OrderBy(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        int[] ids = topics.Select(x => x.Id).ToArray();
        var counts = await db.QuizQuestions.AsNoTracking().Where(x => ids.Contains(x.TopicId))
            .GroupBy(x => x.TopicId)
            .Select(x => new { TopicId = x.Key, Total = x.Count(), Active = x.Count(q => q.IsActive) })
            .ToDictionaryAsync(x => x.TopicId, ct);
        return Page(topics.Select(x => MapTopic(x, counts.GetValueOrDefault(x.Id)?.Total ?? 0,
            counts.GetValueOrDefault(x.Id)?.Active ?? 0)).ToList(), page, pageSize, total);
    }

    public async Task<QuizTopicAdminDto?> GetTopicAsync(int id, CancellationToken ct)
    {
        QuizTopic? topic = await db.QuizTopics.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (topic is null) return null;
        int total = await db.QuizQuestions.CountAsync(x => x.TopicId == id, ct);
        int active = await db.QuizQuestions.CountAsync(x => x.TopicId == id && x.IsActive, ct);
        return MapTopic(topic, total, active);
    }

    public async Task<QuizTopicAdminDto> CreateTopicAsync(SaveQuizTopicRequest request, string actor, CancellationToken ct)
    {
        ValidateTopic(request);
        if (await db.QuizTopics.AnyAsync(x => x.Id == request.Id, ct))
            throw new QuizAdminConflictException("TOPIC_EXISTS", "Mã chuyên đề đã tồn tại.");
        QuizTopic topic = Apply(new QuizTopic { Id = request.Id }, request);
        db.QuizTopics.Add(topic);
        await SaveAndReloadAsync("create-topic", request.Id.ToString(), actor, ct);
        return MapTopic(topic, 0, 0);
    }

    public async Task<QuizTopicAdminDto?> UpdateTopicAsync(int id, SaveQuizTopicRequest request, string actor, CancellationToken ct)
    {
        ValidateTopic(request with { Id = id });
        QuizTopic? topic = await db.QuizTopics.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (topic is null) return null;
        if (request.ExpectedRevision is not null && request.ExpectedRevision != topic.Revision)
            throw new QuizAdminConflictException("TOPIC_CHANGED", "Chuyên đề đã được người khác cập nhật. Hãy tải lại dữ liệu.");
        topic.Revision++;
        Apply(topic, request with { Id = id });
        await SaveAndReloadAsync("update-topic", id.ToString(), actor, ct);
        return (await GetTopicAsync(id, ct))!;
    }

    public async Task<bool> DeleteTopicAsync(int id, string actor, CancellationToken ct)
    {
        QuizTopic? topic = await db.QuizTopics.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (topic is null) return false;
        if (await db.QuizQuestions.AnyAsync(x => x.TopicId == id, ct))
            throw new QuizAdminConflictException("TOPIC_HAS_QUESTIONS", "Không thể xóa chuyên đề đang có câu hỏi; hãy chuyển sang trạng thái ngừng dùng.");
        if (await db.ContestTopics.AnyAsync(x => x.TopicId == id, ct))
            throw new QuizAdminConflictException("TOPIC_IN_CONTEST", "Không thể xóa chuyên đề đã được dùng trong cuộc thi; hãy chuyển sang trạng thái ngừng dùng.");
        db.QuizTopics.Remove(topic);
        await SaveAndReloadAsync("delete-topic", id.ToString(), actor, ct);
        return true;
    }

    public async Task<PagedResult<QuizQuestionAdminDto>> SearchQuestionsAsync(
        string? search, int? topicId, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        IQueryable<QuizQuestion> query = db.QuizQuestions.AsNoTracking().Include(x => x.Topic);
        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim().ToLower();
            query = query.Where(x => x.Code.ToLower().Contains(term) || x.Question.ToLower().Contains(term) ||
                                     x.Kind.ToLower().Contains(term));
        }
        if (topicId is not null) query = query.Where(x => x.TopicId == topicId);
        if (isActive is not null) query = query.Where(x => x.IsActive == isActive);
        int total = await query.CountAsync(ct);
        List<QuizQuestion> items = await query.OrderBy(x => x.TopicId).ThenBy(x => x.SortOrder).ThenBy(x => x.Code)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return Page(items.Select(MapQuestion).ToList(), page, pageSize, total);
    }

    public async Task<QuizQuestionAdminDto?> GetQuestionAsync(string code, CancellationToken ct) =>
        await db.QuizQuestions.AsNoTracking().Include(x => x.Topic).SingleOrDefaultAsync(x => x.Code == NormalizeCode(code), ct) is { } q
            ? MapQuestion(q) : null;

    public async Task<QuizQuestionAdminDto> CreateQuestionAsync(SaveQuizQuestionRequest request, string actor, CancellationToken ct)
    {
        NormalizedQuestion normalized = await ValidateQuestionAsync(request, null, ct);
        if (await db.QuizQuestions.AnyAsync(x => x.Code == normalized.Code, ct))
            throw new QuizAdminConflictException("QUESTION_EXISTS", "Mã câu hỏi đã tồn tại.");
        QuizQuestion question = Apply(new QuizQuestion { Code = normalized.Code }, request, normalized);
        db.QuizQuestions.Add(question);
        await SaveAndReloadAsync("create-question", question.Code, actor, ct);
        return (await GetQuestionAsync(question.Code, ct))!;
    }

    public async Task<QuizQuestionAdminDto?> UpdateQuestionAsync(string code, SaveQuizQuestionRequest request, string actor, CancellationToken ct)
    {
        string normalizedCode = NormalizeCode(code);
        QuizQuestion? question = await db.QuizQuestions.SingleOrDefaultAsync(x => x.Code == normalizedCode, ct);
        if (question is null) return null;
        if (request.ExpectedRevision is not null && request.ExpectedRevision != question.Revision)
            throw new QuizAdminConflictException("QUESTION_CHANGED", "Câu hỏi đã được người khác cập nhật. Hãy tải lại dữ liệu.");
        NormalizedQuestion normalized = await ValidateQuestionAsync(request with { Code = normalizedCode }, normalizedCode, ct);
        question.Revision++;
        Apply(question, request, normalized);
        await SaveAndReloadAsync("update-question", question.Code, actor, ct);
        return (await GetQuestionAsync(question.Code, ct))!;
    }

    public async Task<DeleteQuizQuestionResult?> DeleteQuestionAsync(string code, string actor, CancellationToken ct)
    {
        string normalizedCode = NormalizeCode(code);
        QuizQuestion? question = await db.QuizQuestions.SingleOrDefaultAsync(x => x.Code == normalizedCode, ct);
        if (question is null) return null;
        bool used = await db.EntryAnswers.AnyAsync(x => x.QuestionCode == normalizedCode, ct) ||
                    await db.ContestQuestions.AnyAsync(x => x.QuestionCode == normalizedCode, ct);
        if (used)
        {
            question.IsActive = false;
            question.UpdatedAt = UtcNow();
        }
        else db.QuizQuestions.Remove(question);
        await SaveAndReloadAsync(used ? "deactivate-question" : "delete-question", normalizedCode, actor, ct);
        return new DeleteQuizQuestionResult(!used, used);
    }

    private async Task<NormalizedQuestion> ValidateQuestionAsync(SaveQuizQuestionRequest request, string? currentCode, CancellationToken ct)
    {
        var errors = new Dictionary<string, string>();
        string code = NormalizeCode(request.Code);
        if (code.Length is < 1 or > 16 || !CodePattern().IsMatch(code)) errors["code"] = "Mã gồm 1–16 chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.";
        if (!await db.QuizTopics.AnyAsync(x => x.Id == request.TopicId && x.IsActive, ct)) errors["topicId"] = "Chuyên đề không tồn tại hoặc đang ngừng dùng.";
        if (string.IsNullOrWhiteSpace(request.Kind) || request.Kind.Trim().Length > 40) errors["kind"] = "Loại câu hỏi bắt buộc, tối đa 40 ký tự.";
        if (string.IsNullOrWhiteSpace(request.Question) || request.Question.Trim().Length is < 5 or > 2000) errors["question"] = "Nội dung câu hỏi phải có 5–2000 ký tự.";
        if (request.Situation?.Trim().Length > 2000) errors["situation"] = "Tình huống tối đa 2000 ký tự.";
        if (request.SafeAction?.Trim().Length > 3000) errors["safeAction"] = "Khuyến nghị tối đa 3000 ký tự.";
        if (request.ReadSeconds is < 0 or > 600) errors["readSeconds"] = "Thời gian đọc phải từ 0 đến 600 giây.";
        if (request.SortOrder < 0) errors["sortOrder"] = "Thứ tự không được âm.";
        if (request.SampleOrder is <= 0) errors["sampleOrder"] = "Thứ tự Thử sức phải lớn hơn 0.";
        if (request.SampleOrder is not null && string.IsNullOrWhiteSpace(request.SampleLabel)) errors["sampleLabel"] = "Nhãn Thử sức là bắt buộc khi có thứ tự.";
        if (request.SampleLabel?.Trim().Length > 60) errors["sampleLabel"] = "Nhãn Thử sức tối đa 60 ký tự.";

        List<QuizAnswerAdminDto> answers = request.Answers?.ToList() ?? [];
        if (answers.Count != 4) errors["answers"] = "Câu hỏi phải có đúng 4 đáp án.";
        var normalizedAnswers = answers.Select(x => x with { Key = x.Key.Trim().ToUpperInvariant(), Text = x.Text.Trim(), Explanation = x.Explanation.Trim() }).ToList();
        if (normalizedAnswers.Select(x => x.Key).Distinct().Order().SequenceEqual(AnswerKeys) is false)
            errors["answers.keys"] = "Bốn đáp án phải có khóa A, B, C, D và không được trùng.";
        if (normalizedAnswers.Any(x => x.Text.Length is < 1 or > 1000)) errors["answers.text"] = "Nội dung mỗi đáp án phải có 1–1000 ký tự.";
        if (normalizedAnswers.Any(x => x.Explanation.Length > 2000)) errors["answers.explanation"] = "Giải thích mỗi đáp án tối đa 2000 ký tự.";
        if (normalizedAnswers.Count(x => x.IsCorrect) != 1) errors["answers.correct"] = "Phải có duy nhất một đáp án đúng.";
        if (request.SampleOrder is not null && await db.QuizQuestions.AnyAsync(
                x => x.SampleOrder == request.SampleOrder && x.Code != currentCode, ct))
            errors["sampleOrder"] = "Thứ tự Thử sức đã được dùng bởi câu hỏi khác.";
        if (errors.Count > 0) throw new QuizAdminValidationException(errors);
        return new NormalizedQuestion(code, normalizedAnswers, normalizedAnswers.Single(x => x.IsCorrect).Key);
    }

    private static void ValidateTopic(SaveQuizTopicRequest request)
    {
        var errors = new Dictionary<string, string>();
        if (request.Id <= 0) errors["id"] = "Mã chuyên đề phải lớn hơn 0.";
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length is < 2 or > 200) errors["title"] = "Tên chuyên đề phải có 2–200 ký tự.";
        if ((request.Intro ?? []).Any(x => string.IsNullOrWhiteSpace(x) || x.Trim().Length > 2000)) errors["intro"] = "Mỗi đoạn giới thiệu phải có nội dung và tối đa 2000 ký tự.";
        if ((request.Terms ?? []).Any(x => string.IsNullOrWhiteSpace(x.Term) || x.Term.Trim().Length > 200 || x.Definition.Trim().Length > 1000)) errors["terms"] = "Thuật ngữ bắt buộc, tối đa 200 ký tự; giải nghĩa tối đa 1000 ký tự.";
        if (errors.Count > 0) throw new QuizAdminValidationException(errors);
    }

    private QuizTopic Apply(QuizTopic topic, SaveQuizTopicRequest request)
    {
        topic.Title = request.Title!.Trim();
        topic.Intro = JsonSerializer.Serialize((request.Intro ?? []).Select(x => x.Trim()), JsonOptions);
        topic.Terms = JsonSerializer.Serialize((request.Terms ?? []).Select(x => new[] { x.Term.Trim(), x.Definition.Trim() }), JsonOptions);
        topic.IsActive = request.IsActive;
        topic.UpdatedAt = UtcNow();
        return topic;
    }

    private QuizQuestion Apply(QuizQuestion entity, SaveQuizQuestionRequest request, NormalizedQuestion normalized)
    {
        entity.TopicId = request.TopicId;
        entity.Kind = request.Kind!.Trim();
        entity.Situation = NullIfEmpty(request.Situation);
        entity.Question = request.Question!.Trim();
        entity.Options = JsonSerializer.Serialize(normalized.Answers.Select(x => new[] { x.Key, x.Text }), JsonOptions);
        entity.Answer = normalized.CorrectAnswer;
        entity.Explanations = JsonSerializer.Serialize(normalized.Answers.ToDictionary(x => x.Key, x => x.Explanation), JsonOptions);
        entity.SafeAction = NullIfEmpty(request.SafeAction);
        entity.ReadSeconds = request.ReadSeconds;
        entity.SampleOrder = request.SampleOrder;
        entity.SampleLabel = request.SampleOrder is null ? null : request.SampleLabel!.Trim();
        entity.SortOrder = request.SortOrder;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = UtcNow();
        return entity;
    }

    private async Task SaveAndReloadAsync(string action, string key, string actor, CancellationToken ct)
    {
        DateTime now = UtcNow();
        bool duringContest = await db.ContestCampaigns.AnyAsync(x => x.IsActive && x.StartAt <= now && x.EndAt >= now, ct);
        db.QuizImports.Add(new QuizImport { CreatedAt = now, CreatedBy = string.IsNullOrWhiteSpace(actor) ? "backoffice" : actor[..Math.Min(actor.Length, 100)], FileName = $"backoffice:{action}:{key}", DuringContest = duringContest });
        await db.SaveChangesAsync(ct);
        bank.Reload();
    }

    private static QuizTopicAdminDto MapTopic(QuizTopic x, int total, int active) => new(
        x.Id, x.Title, ParseStringArray(x.Intro), ParseTerms(x.Terms), x.IsActive, total, active, x.UpdatedAt, x.Revision);

    private static QuizQuestionAdminDto MapQuestion(QuizQuestion x)
    {
        Dictionary<string, string> explanations = JsonSerializer.Deserialize<Dictionary<string, string>>(x.Explanations, JsonOptions) ?? [];
        List<string[]> options = JsonSerializer.Deserialize<List<string[]>>(x.Options, JsonOptions) ?? [];
        return new(x.Code, x.TopicId, x.Topic?.Title ?? "", x.Kind, x.Situation ?? "", x.Question,
            options.Select(o => new QuizAnswerAdminDto(o.ElementAtOrDefault(0) ?? "", o.ElementAtOrDefault(1) ?? "",
                explanations.GetValueOrDefault(o.ElementAtOrDefault(0) ?? "") ?? "", o.ElementAtOrDefault(0) == x.Answer)).ToList(),
            x.Answer, x.SafeAction ?? "", x.ReadSeconds, x.SampleOrder, x.SampleLabel, x.SortOrder, x.IsActive, x.UpdatedAt, x.Revision);
    }

    private static IReadOnlyList<string> ParseStringArray(string json) => JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
    private static IReadOnlyList<QuizTermAdminDto> ParseTerms(string? json) =>
        (JsonSerializer.Deserialize<List<string[]>>(json ?? "[]", JsonOptions) ?? []).Select(x => new QuizTermAdminDto(x.ElementAtOrDefault(0) ?? "", x.ElementAtOrDefault(1) ?? "")).ToList();
    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize) => (Math.Max(1, page), Math.Clamp(pageSize, 1, 100));
    private static PagedResult<T> Page<T>(IReadOnlyList<T> items, int page, int size, int total) => new(items, page, size, total, (int)Math.Ceiling(total / (double)size));
    private static string NormalizeCode(string? code) => (code ?? "").Trim().ToUpperInvariant();
    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private DateTime UtcNow() => timeProvider.GetUtcNow().UtcDateTime;
    private sealed record NormalizedQuestion(string Code, IReadOnlyList<QuizAnswerAdminDto> Answers, string CorrectAnswer);

    [GeneratedRegex(@"^[\p{L}\p{N}._-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex CodePattern();
}
