using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Core.Contest;

/// <summary>Mot dap an da luu trong API-02. Cd la so chuyen de dang chuoi nhu QUIZ-01 (QD-013).</summary>
public record EntryAnswerDto(
    [property: JsonPropertyName("q")] string Q,
    [property: JsonPropertyName("a")] string A,
    [property: JsonPropertyName("correct")] bool Correct,
    [property: JsonPropertyName("cd")] string Cd);

/// <summary>Cuoc thi cua luot trong API-02. Phase: open, submit_only, closed.</summary>
public record EntryContestDto(
    [property: JsonPropertyName("id")] long Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("startAt")] string StartAt,
    [property: JsonPropertyName("endAt")] string EndAt,
    [property: JsonPropertyName("submitUntil")] string SubmitUntil,
    [property: JsonPropertyName("phase")] string Phase,
    [property: JsonPropertyName("readTimerFactor")] decimal ReadTimerFactor);

/// <summary>Mot chuyen de trong de cua cuoc (API-02), theo thu tu de.</summary>
public record EntryTopicDto(
    [property: JsonPropertyName("cd")] string Cd,
    [property: JsonPropertyName("count")] int Count);

/// <summary>Ket qua API-02. Thoi diem la chuoi ISO 8601 UTC co Z.</summary>
public record EntryStateDto(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("mode")] string Mode,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("phoneMasked")] string? PhoneMasked,
    [property: JsonPropertyName("org")] string? Org,
    [property: JsonPropertyName("attemptNo")] int? AttemptNo,
    [property: JsonPropertyName("maxAttempts")] int MaxAttempts,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("answered")] int Answered,
    [property: JsonPropertyName("score")] int? Score,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("submittedAt")] string? SubmittedAt,
    [property: JsonPropertyName("contest")] EntryContestDto? Contest,
    [property: JsonPropertyName("topics")] IReadOnlyList<EntryTopicDto> Topics,
    [property: JsonPropertyName("answers")] IReadOnlyList<EntryAnswerDto> Answers);

/// <summary>Than yeu cau API-03.</summary>
public record SaveAnswerRequest(string? Q, string? A);

/// <summary>Ket qua API-03. Stored false khi cau da co dap an (A va Correct la cua dap an dang luu).</summary>
public record SaveAnswerDto(
    [property: JsonPropertyName("q")] string Q,
    [property: JsonPropertyName("a")] string A,
    [property: JsonPropertyName("correct")] bool Correct,
    [property: JsonPropertyName("stored")] bool Stored);

public record SaveAnswerResult(SaveAnswerDto? Answer, ContestError? Error)
{
    public static SaveAnswerResult Ok(SaveAnswerDto answer) => new(answer, null);
    public static SaveAnswerResult Fail(ContestError error) => new(null, error);
}

/// <summary>Than yeu cau API-04 (cung dang voi contact cua API-05).</summary>
public record ContactRequest(string? FullName, string? Phone, string? Org, bool? Consent);

/// <summary>Ket qua API-04.</summary>
public record AttachContactDto(
    [property: JsonPropertyName("mode")] string Mode,
    [property: JsonPropertyName("attemptNo")] int AttemptNo,
    [property: JsonPropertyName("maxAttempts")] int MaxAttempts);

public record AttachContactResult(AttachContactDto? Contact, ContestError? Error)
{
    public static AttachContactResult Ok(AttachContactDto contact) => new(contact, null);
    public static AttachContactResult Fail(ContestError error) => new(null, error);
}

/// <summary>Than yeu cau API-05; Contact chi dung cho luot an danh.</summary>
public record SubmitRequest(ContactRequest? Contact);

/// <summary>Diem tung chuyen de trong ket qua nop bai.</summary>
public record TopicScoreDto(
    [property: JsonPropertyName("cd")] string Cd,
    [property: JsonPropertyName("correct")] int Correct,
    [property: JsonPropertyName("count")] int Count);

/// <summary>Ket qua API-05.</summary>
public record SubmitDto(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("mode")] string Mode,
    [property: JsonPropertyName("score")] int Score,
    [property: JsonPropertyName("answered")] int Answered,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("eligibleForPrize")] bool EligibleForPrize,
    [property: JsonPropertyName("submittedAt")] string SubmittedAt,
    [property: JsonPropertyName("byTopic")] IReadOnlyList<TopicScoreDto> ByTopic);

public record SubmitResult(SubmitDto? Result, ContestError? Error)
{
    public static SubmitResult Ok(SubmitDto result) => new(result, null);
    public static SubmitResult Fail(ContestError error) => new(null, error);
}

public interface IContestAttemptService
{
    /// <summary>Tra luot thi theo token (header X-Entry-Token); null neu thieu hoac khong khop.</summary>
    Task<Entry?> AuthenticateAsync(string? token, CancellationToken ct = default);

    /// <summary>API-02: tinh trang luot thi va cac dap an da luu.</summary>
    Task<EntryStateDto> GetStateAsync(Entry entry, CancellationToken ct = default);

    /// <summary>API-03: luu dap an mot cau; lan ghi dau thang.</summary>
    Task<SaveAnswerResult> SaveAnswerAsync(Entry entry, string? q, string? a, CancellationToken ct = default);

    /// <summary>API-04: gan thong tin du thi vao luot an danh.</summary>
    Task<AttachContactResult> AttachContactAsync(Entry entry, ContactRequest? contact, CancellationToken ct = default);

    /// <summary>API-05: nop bai (kem thong tin cho luot an danh neu co); nop lai tra ket qua cu.</summary>
    Task<SubmitResult> SubmitAsync(Entry entry, ContactRequest? contact, CancellationToken ct = default);
}

/// <summary>Cac API /me cua luot thi (BE-23, BE-24). Gom xac thuc token va API-02 den API-05.</summary>
public class ContestAttemptService : IContestAttemptService
{
    private readonly AppDbContext _db;
    // So luot toi da khi luot khong con cuoc (cuoc bi tat); cuoc con hieu luc thi lay tu cuoc
    private const int DefaultMaxAttempts = 2;

    private readonly IQuestionBank _bank;
    private readonly IContestCatalog _catalog;
    private readonly TimeProvider _clock;

    public ContestAttemptService(AppDbContext db, IQuestionBank bank,
        IContestCatalog catalog, TimeProvider clock)
    {
        _db = db;
        _bank = bank;
        _catalog = catalog;
        _clock = clock;
    }

    public async Task<Entry?> AuthenticateAsync(string? token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        string hash = ContestEntryService.HashToken(token.Trim());
        return await _db.Entries.AsNoTracking().FirstOrDefaultAsync(e => e.TokenHash == hash, ct);
    }

    public async Task<EntryStateDto> GetStateAsync(Entry entry, CancellationToken ct = default)
    {
        var rows = await _db.EntryAnswers.AsNoTracking()
            .Where(a => a.EntryId == entry.Id)
            .OrderBy(a => a.AnsweredAt).ThenBy(a => a.QuestionCode)
            .ToListAsync(ct);
        var answers = rows
            .Select(a => new EntryAnswerDto(a.QuestionCode, a.Chosen, a.IsCorrect, a.Topic.ToString()))
            .ToList();

        bool submitted = entry.Status == EntryStatuses.Submitted;

        // Cuoc cua luot; luot cu khong cuoc hoac cuoc bi tat: contest null, coi nhu closed (R5)
        ContestInfo? contest = entry.ContestId is { } cid ? await _catalog.GetAsync(cid, ct) : null;
        int maxAttempts = contest?.MaxAttempts ?? DefaultMaxAttempts;
        int total = submitted && entry.TotalQuestions is { } t ? t
            : contest?.QuestionCount ?? _bank.Current.TotalQuestions;
        EntryContestDto? contestDto = contest is null ? null : new(
            contest.Id, contest.Name, ToIso(contest.StartAt), ToIso(contest.EndAt), ToIso(contest.SubmitUntil),
            PhaseName(contest.PhaseAt(_clock.GetUtcNow().UtcDateTime)), contest.ReadTimerFactor);
        var topics = contest is null
            ? new List<EntryTopicDto>()
            : contest.Topics.Select(x => new EntryTopicDto(x.Cd, x.Count)).ToList();

        return new EntryStateDto(
            entry.Code, entry.Mode, entry.FullName, MaskPhone(entry.Phone), entry.Org,
            entry.Mode == EntryModes.Named ? entry.AttemptNo : null, maxAttempts, entry.Status,
            answers.Count, submitted ? entry.Score : null, total,
            entry.SubmittedAt is { } s ? ToIso(s) : null, contestDto, topics, answers);
    }

    public async Task<SaveAnswerResult> SaveAnswerAsync(Entry entry, string? q, string? a, CancellationToken ct = default)
    {
        // Doc cuoc cua luot ngoai khoa ghi; thoi diem so sanh lay sau khi vao khoa (R4, QD-014 theo cuoc)
        ContestInfo? contest = entry.ContestId is { } cid ? await _catalog.GetAsync(cid, ct) : null;

        // So khop chu cai phan biet hoa thuong nhu du lieu, khong tu doi
        var root = _bank.Current;
        var bank = root.Contests.FirstOrDefault(x => x.ContestId == entry.ContestId)?.Bank ?? root;
        AnswerKey? key = null;
        if (!string.IsNullOrEmpty(q)) bank.Keys.TryGetValue(q, out key);

        await ContestEntryService.WriteLock.WaitAsync(ct);
        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // Doc lai trang thai trong khoa: entry tu AuthenticateAsync co the da cu (vd da nop o yeu cau khac)
            var current = await _db.Entries.AsNoTracking()
                .Where(e => e.Id == entry.Id).Select(e => new { e.Status, e.TokenHash }).FirstOrDefaultAsync(ct);
            if (current is null || current.TokenHash != entry.TokenHash)
                return SaveAnswerResult.Fail(new("INVALID_TOKEN", "Phiên làm bài đã bị thu hồi hoặc lượt thi đã được xóa."));
            if (current.Status == EntryStatuses.Submitted)
            {
                return SaveAnswerResult.Fail(new("ALREADY_SUBMITTED", "Lượt thi này đã được nộp bài."));
            }

            if (contest is null || contest.PhaseAt(_clock.GetUtcNow().UtcDateTime) != ContestPhase.Open)
            {
                return SaveAnswerResult.Fail(new("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));
            }

            // Cau phai nam trong de cua cuoc, khong chi trong ngan hang
            if (key is null || !contest.QuestionCodes.Contains(key.Code))
            {
                return SaveAnswerResult.Fail(new("UNKNOWN_QUESTION", "Câu hỏi không tồn tại."));
            }

            if (string.IsNullOrEmpty(a) || !key.Letters.Contains(a))
            {
                return SaveAnswerResult.Fail(new("INVALID_OPTION", "Đáp án không hợp lệ."));
            }

            var existing = await _db.EntryAnswers.AsNoTracking()
                .FirstOrDefaultAsync(x => x.EntryId == entry.Id && x.QuestionCode == key.Code, ct);
            if (existing is not null)
            {
                return SaveAnswerResult.Ok(new(existing.QuestionCode, existing.Chosen, existing.IsCorrect, false));
            }

            // Thu tu chuyen de va dong ho doc chi duoc kiem tra o trinh duyet.
            // Khoa chinh la trong tai cuoi cung, ke ca khi co nhieu tien trinh web.
            // Chi bo qua xung dot dung cap khoa; cac loi CSDL khac van duoc bao loi.
            DateTime answeredAt = _clock.GetUtcNow().UtcDateTime;
            bool isCorrect = a == key.Answer;
            int inserted = await _db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO entry_answer (entry_id, question_code, topic, chosen, is_correct, answered_at)
                VALUES ({entry.Id}, {key.Code}, {key.TopicId}, {a}, {isCorrect}, {answeredAt})
                ON CONFLICT (entry_id, question_code) DO NOTHING
                """, ct);
            var stored = await _db.EntryAnswers.AsNoTracking()
                .SingleAsync(x => x.EntryId == entry.Id && x.QuestionCode == key.Code, ct);
            await tx.CommitAsync(ct);
            return SaveAnswerResult.Ok(new(stored.QuestionCode, stored.Chosen, stored.IsCorrect, inserted == 1));
        }
        finally
        {
            _db.ChangeTracker.Clear();
            ContestEntryService.WriteLock.Release();
        }
    }

    public async Task<AttachContactResult> AttachContactAsync(Entry entry, ContactRequest? contact, CancellationToken ct = default)
    {
        // Doc cuoc cua luot ngoai khoa ghi; thoi diem so sanh lay sau khi vao khoa. Luot khong cuoc coi nhu dong (R5, QD-014 theo cuoc)
        ContestInfo? contest = entry.ContestId is { } cid ? await _catalog.GetAsync(cid, ct) : null;

        await ContestEntryService.WriteLock.WaitAsync(ct);
        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // Doc lai luot co theo doi trong khoa: entry tu AuthenticateAsync khong theo doi va co the da cu
            var current = await _db.Entries.FirstOrDefaultAsync(e => e.Id == entry.Id, ct);
            if (current is null || current.TokenHash != entry.TokenHash)
                return AttachContactResult.Fail(new("INVALID_TOKEN", "Phiên làm bài đã bị thu hồi hoặc lượt thi đã được xóa."));
            if (current.Status == EntryStatuses.Submitted)
            {
                return AttachContactResult.Fail(new("ALREADY_SUBMITTED", "Lượt thi này đã được nộp bài."));
            }

            if (current.Mode == EntryModes.Named)
            {
                return AttachContactResult.Fail(new("ALREADY_NAMED", "Lượt thi này đã có thông tin dự thi."));
            }

            if (contest is null || contest.PhaseAt(_clock.GetUtcNow().UtcDateTime) != ContestPhase.Open)
            {
                return AttachContactResult.Fail(new("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));
            }

            ContestError? error = await ApplyContactAsync(current, contact, contest, ct);
            if (error is not null) return AttachContactResult.Fail(error);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return AttachContactResult.Ok(new(current.Mode, current.AttemptNo!.Value, contest.MaxAttempts));
        }
        finally
        {
            _db.ChangeTracker.Clear();
            ContestEntryService.WriteLock.Release();
        }
    }

    public async Task<SubmitResult> SubmitAsync(Entry entry, ContactRequest? contact, CancellationToken ct = default)
    {
        await ContestEntryService.WriteLock.WaitAsync(ct);
        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // Doc lai luot co theo doi trong khoa: entry tu AuthenticateAsync khong theo doi va co the da cu
            var current = await _db.Entries.FirstOrDefaultAsync(e => e.Id == entry.Id, ct);
            if (current is null || current.TokenHash != entry.TokenHash)
                return SubmitResult.Fail(new("INVALID_TOKEN", "Phiên làm bài đã bị thu hồi hoặc lượt thi đã được xóa."));
            if (current.Status == EntryStatuses.Submitted && current.SubmissionResultJson is { } saved)
            {
                // Không đọc lại đáp án hay tính lại kết quả đã chốt.
                return SubmitResult.Ok(JsonSerializer.Deserialize<SubmitDto>(saved)
                    ?? throw new InvalidOperationException("Kết quả nộp bài đã lưu không hợp lệ."));
            }

            ContestInfo? contest = current.ContestId is { } cid ? await _catalog.GetAsync(cid, ct) : null;
            var root = _bank.Current;
            var bank = root.Contests.FirstOrDefault(x => x.ContestId == current.ContestId)?.Bank ?? root;
            var rows = await _db.EntryAnswers.AsNoTracking()
                .Where(a => a.EntryId == current.Id)
                .Select(a => new { a.QuestionCode, a.Topic, a.IsCorrect })
                .ToListAsync(ct);

            // Da nop: tra lai ket qua da luu bat ke thoi gian, bo qua than yeu cau
            if (current.Status == EntryStatuses.Submitted)
            {
                // Dữ liệu cũ trước khi có snapshot kết quả: giữ nguyên điểm, số câu và ngày nộp đã lưu.
                var legacyResult = BuildResult(current, current.Answered,
                    current.TotalQuestions ?? contest?.QuestionCount ?? bank.TotalQuestions,
                    rows.Where(r => r.IsCorrect).Select(r => r.Topic), TopicCounts(contest, bank));
                current.SubmissionResultJson = JsonSerializer.Serialize(legacyResult);
                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
                return SubmitResult.Ok(legacyResult);
            }

            // Han nop = end_at + submit_grace_hours cua cuoc (open va submit_only deu nop duoc)
            if (contest is null || current.CreatedAt >= contest.EndAt ||
                contest.PhaseAt(_clock.GetUtcNow().UtcDateTime) == ContestPhase.Closed)
            {
                return SubmitResult.Fail(new("CONTEST_CLOSED", "Cuộc thi đã hết hạn nộp bài."));
            }

            // Chỉ chốt bài khi mọi mã câu trong đề của cuộc thi đều có đáp án.
            int total = contest.QuestionCount;
            rows = rows.Where(r => contest.QuestionCodes.Contains(r.QuestionCode)).ToList();
            if (rows.Count == 0)
            {
                return SubmitResult.Fail(new("NOTHING_TO_SUBMIT", "Bạn chưa trả lời câu nào. Vui lòng hoàn thành toàn bộ đề trước khi nộp bài."));
            }

            var answeredCodes = rows.Select(r => r.QuestionCode).ToHashSet(StringComparer.Ordinal);
            int missing = contest.QuestionCodes.Count(code => !answeredCodes.Contains(code));
            if (total == 0 || missing > 0)
                return SubmitResult.Fail(new("INCOMPLETE_ANSWERS", $"Bạn cần trả lời hết các câu hỏi trước khi nộp bài. Còn {missing}/{total} câu chưa trả lời."));

            if (current.Mode == EntryModes.Anon && contact is not null)
            {
                ContestError? error = await ApplyContactAsync(current, contact, contest, ct);
                if (error is not null) return SubmitResult.Fail(error);
            }

            current.Status = EntryStatuses.Submitted;
            current.Answered = rows.Count;
            current.Score = rows.Count(r => r.IsCorrect);
            current.TotalQuestions = total;
            current.SubmittedAt = _clock.GetUtcNow().UtcDateTime;
            var result = BuildResult(current, rows.Count, total,
                rows.Where(r => r.IsCorrect).Select(r => r.Topic), TopicCounts(contest, bank));
            current.SubmissionResultJson = JsonSerializer.Serialize(result);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return SubmitResult.Ok(result);
        }
        finally
        {
            _db.ChangeTracker.Clear();
            ContestEntryService.WriteLock.Release();
        }
    }

    // Chỉ gọi trong transaction đang giữ khóa ghi chung với API-01; đếm mọi trạng thái theo cuộc thi.
    private async Task<ContestError?> ApplyContactAsync(
        Entry current, ContactRequest? contact, ContestInfo contest, CancellationToken ct)
    {
        var fields = ContestEntryService.Validate(
            contact?.FullName, contact?.Phone, contact?.Org, contact?.Consent,
            out string? fullName, out string? phone, out string? org);
        if (fields.Count > 0) return new("VALIDATION", fields.Values.First(), fields);

        int used = await _db.Entries.CountAsync(e => e.ContestId == contest.Id && e.Phone == phone, ct);
        if (contest.MaxAttempts > 0 && used >= contest.MaxAttempts)
            return new("ATTEMPT_LIMIT", $"Số {phone} đã dùng hết {contest.MaxAttempts} lượt của cuộc thi này.");

        current.Mode = EntryModes.Named;
        current.FullName = fullName;
        current.Phone = phone;
        current.Org = org;
        current.ConsentAt = _clock.GetUtcNow().UtcDateTime;
        current.AttemptNo = used + 1;
        return null;
    }

    // Chuyen de de tinh byTopic: theo de cua cuoc; luot cu khong con cuoc thi theo ban chup ngan hang
    private static IReadOnlyList<(string Cd, int Count)> TopicCounts(ContestInfo? contest, QuestionBankSnapshot bank) =>
        contest is null
            ? bank.Topics.Select(t => (t.Cd, t.Count)).ToList()
            : contest.Topics.Select(t => (t.Cd, t.Count)).ToList();

    // Moi chuyen de cua de theo thu tu de: correct = so dong dung cua chuyen de, count = so cau cua de trong chuyen de
    private static SubmitDto BuildResult(Entry e, int answered, int total, IEnumerable<int> correctTopics,
        IReadOnlyList<(string Cd, int Count)> topics)
    {
        var correctByTopic = correctTopics.GroupBy(t => t).ToDictionary(g => g.Key, g => g.Count());
        var byTopic = topics
            .Select(t => new TopicScoreDto(t.Cd, correctByTopic.GetValueOrDefault(int.Parse(t.Cd)), t.Count))
            .ToList();
        return new SubmitDto("submitted", e.Code, e.Mode, e.Score ?? 0, answered, total,
            !string.IsNullOrEmpty(e.Phone), ToIso(e.SubmittedAt!.Value), byTopic);
    }

    private static string PhaseName(ContestPhase phase) => phase switch
    {
        ContestPhase.Open => "open",
        ContestPhase.SubmitOnly => "submit_only",
        _ => "closed",
    };

    /// <summary>3 so dau + **** + 3 so cuoi; null khi khong co so.</summary>
    private static string? MaskPhone(string? phone) =>
        string.IsNullOrEmpty(phone) || phone.Length < 7 ? null : phone[..3] + "****" + phone[^3..];

    // EF doc SQLite ra Kind Unspecified; dat Utc truoc khi dinh dang
    private static string ToIso(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'");
}
