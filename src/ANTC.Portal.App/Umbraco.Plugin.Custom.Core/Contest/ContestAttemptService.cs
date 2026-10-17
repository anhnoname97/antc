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
    private readonly IContestSettings _settings;
    private readonly IQuestionBank _bank;

    public ContestAttemptService(AppDbContext db, IContestSettings settings, IQuestionBank bank)
    {
        _db = db;
        _settings = settings;
        _bank = bank;
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
        int maxAttempts = ContestSettings.NormalizeMaxAttempts((await _settings.GetAsync())?.MaxAttempts);
        int total = submitted && entry.TotalQuestions is { } t ? t : _bank.Current.TotalQuestions;

        return new EntryStateDto(
            entry.Code, entry.Mode, entry.FullName, MaskPhone(entry.Phone), entry.Org,
            entry.Mode == EntryModes.Named ? entry.AttemptNo : null, maxAttempts, entry.Status,
            answers.Count, submitted ? entry.Score : null, total,
            entry.SubmittedAt is { } s ? ToIso(s) : null, answers);
    }

    public async Task<SaveAnswerResult> SaveAnswerAsync(Entry entry, string? q, string? a, CancellationToken ct = default)
    {
        // Doc cai dat ngoai khoa ghi; thoi diem so sanh lay sau khi vao khoa. Khong co trang thiPage thi coi nhu dong (QD-006, QD-014)
        var settings = await _settings.GetAsync();

        // So khop chu cai phan biet hoa thuong nhu du lieu, khong tu doi
        var bank = _bank.Current;
        AnswerKey? key = null;
        if (!string.IsNullOrEmpty(q)) bank.Keys.TryGetValue(q, out key);

        await ContestEntryService.WriteLock.WaitAsync(ct);
        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // Doc lai trang thai trong khoa: entry tu AuthenticateAsync co the da cu (vd da nop o yeu cau khac)
            string status = await _db.Entries.AsNoTracking()
                .Where(e => e.Id == entry.Id).Select(e => e.Status).FirstAsync(ct);
            if (status == EntryStatuses.Submitted)
            {
                return SaveAnswerResult.Fail(new("ALREADY_SUBMITTED", "Lượt thi này đã được nộp bài."));
            }

            if (!IsOpen(settings))
            {
                return SaveAnswerResult.Fail(new("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));
            }

            if (key is null)
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

            var row = new EntryAnswer
            {
                EntryId = entry.Id,
                QuestionCode = key.Code,
                Topic = key.TopicId,
                Chosen = a,
                IsCorrect = a == key.Answer,
                AnsweredAt = DateTime.UtcNow
            };
            _db.EntryAnswers.Add(row);
            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Tien trinh khac da ghi cau nay (khoa chinh): doc lai dong dang co, tra stored=false
                _db.ChangeTracker.Clear();
                var stored = await _db.EntryAnswers.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.EntryId == entry.Id && x.QuestionCode == key.Code, ct);
                if (stored is null) throw;
                return SaveAnswerResult.Ok(new(stored.QuestionCode, stored.Chosen, stored.IsCorrect, false));
            }

            await tx.CommitAsync(ct);
            return SaveAnswerResult.Ok(new(row.QuestionCode, row.Chosen, row.IsCorrect, true));
        }
        finally
        {
            _db.ChangeTracker.Clear();
            ContestEntryService.WriteLock.Release();
        }
    }

    public async Task<AttachContactResult> AttachContactAsync(Entry entry, ContactRequest? contact, CancellationToken ct = default)
    {
        // Doc cai dat ngoai khoa ghi; thoi diem so sanh lay sau khi vao khoa. Khong co trang thiPage thi coi nhu dong (QD-006, QD-014)
        var settings = await _settings.GetAsync();

        await ContestEntryService.WriteLock.WaitAsync(ct);
        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // Doc lai luot co theo doi trong khoa: entry tu AuthenticateAsync khong theo doi va co the da cu
            var current = await _db.Entries.FirstAsync(e => e.Id == entry.Id, ct);
            if (current.Status == EntryStatuses.Submitted)
            {
                return AttachContactResult.Fail(new("ALREADY_SUBMITTED", "Lượt thi này đã được nộp bài."));
            }

            if (current.Mode == EntryModes.Named)
            {
                return AttachContactResult.Fail(new("ALREADY_NAMED", "Lượt thi này đã có thông tin dự thi."));
            }

            if (!IsOpen(settings))
            {
                return AttachContactResult.Fail(new("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));
            }

            var fields = ContestEntryService.Validate(
                contact?.FullName, contact?.Phone, contact?.Org, contact?.Consent,
                out string? fullName, out string? phone, out string? org);
            if (fields.Count > 0)
            {
                return AttachContactResult.Fail(new("VALIDATION", fields.Values.First(), fields));
            }

            int maxAttempts = settings!.MaxAttempts;
            int used = await _db.Entries.CountAsync(e => e.Phone == phone, ct);
            if (used >= maxAttempts)
            {
                return AttachContactResult.Fail(new("ATTEMPT_LIMIT",
                    $"Số {phone} đã dùng hết {maxAttempts} lượt thi. Mỗi số điện thoại chỉ được thi tối đa {maxAttempts} lượt."));
            }

            current.Mode = EntryModes.Named;
            current.FullName = fullName;
            current.Phone = phone;
            current.Org = org;
            current.ConsentAt = DateTime.UtcNow;
            current.AttemptNo = used + 1;
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return AttachContactResult.Ok(new(current.Mode, used + 1, maxAttempts));
        }
        finally
        {
            _db.ChangeTracker.Clear();
            ContestEntryService.WriteLock.Release();
        }
    }

    public async Task<SubmitResult> SubmitAsync(Entry entry, ContactRequest? contact, CancellationToken ct = default)
    {
        // Doc cai dat ngoai khoa ghi; thoi diem so sanh lay sau khi vao khoa
        var settings = await _settings.GetAsync();
        var bank = _bank.Current;

        await ContestEntryService.WriteLock.WaitAsync(ct);
        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // Doc lai luot co theo doi trong khoa: entry tu AuthenticateAsync khong theo doi va co the da cu
            var current = await _db.Entries.FirstAsync(e => e.Id == entry.Id, ct);
            var rows = await _db.EntryAnswers.AsNoTracking()
                .Where(a => a.EntryId == current.Id)
                .Select(a => new { a.QuestionCode, a.Topic, a.IsCorrect })
                .ToListAsync(ct);

            // Da nop: tra lai ket qua da luu bat ke thoi gian, bo qua than yeu cau
            if (current.Status == EntryStatuses.Submitted)
            {
                return SubmitResult.Ok(BuildResult(current, current.Answered, current.TotalQuestions ?? bank.TotalQuestions,
                    rows.Where(r => r.IsCorrect).Select(r => r.Topic), bank));
            }

            if (settings is null || !_settings.IsSubmitOpen(settings, DateTime.UtcNow))
            {
                return SubmitResult.Fail(new("CONTEST_CLOSED", "Cuộc thi đã hết hạn nộp bài."));
            }

            // Du cau: moi ma cau trong ban chup hien tai deu co dap an; cau da ngung dung khong tinh
            int total = bank.TotalQuestions;
            int covered = rows.Count(r => bank.Keys.ContainsKey(r.QuestionCode));
            if (covered < total)
            {
                return SubmitResult.Fail(new("INCOMPLETE_ANSWERS",
                    $"Bạn mới trả lời {covered}/{total} câu. Hãy trả lời hết các câu rồi nộp bài."));
            }

            if (current.Mode == EntryModes.Anon && contact is not null)
            {
                var fields = ContestEntryService.Validate(
                    contact.FullName, contact.Phone, contact.Org, contact.Consent,
                    out string? fullName, out string? phone, out string? org);
                if (fields.Count > 0)
                {
                    return SubmitResult.Fail(new("VALIDATION", fields.Values.First(), fields));
                }

                int maxAttempts = settings.MaxAttempts;
                int used = await _db.Entries.CountAsync(e => e.Phone == phone, ct);
                if (used >= maxAttempts)
                {
                    return SubmitResult.Fail(new("ATTEMPT_LIMIT",
                        $"Số {phone} đã dùng hết {maxAttempts} lượt thi. Mỗi số điện thoại chỉ được thi tối đa {maxAttempts} lượt."));
                }

                current.Mode = EntryModes.Named;
                current.FullName = fullName;
                current.Phone = phone;
                current.Org = org;
                current.ConsentAt = DateTime.UtcNow;
                current.AttemptNo = used + 1;
            }

            current.Status = EntryStatuses.Submitted;
            current.Answered = rows.Count;
            current.Score = rows.Count(r => r.IsCorrect);
            current.TotalQuestions = total;
            current.SubmittedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return SubmitResult.Ok(BuildResult(current, rows.Count, total, rows.Where(r => r.IsCorrect).Select(r => r.Topic), bank));
        }
        finally
        {
            _db.ChangeTracker.Clear();
            ContestEntryService.WriteLock.Release();
        }
    }

    // Moi chuyen de dang dung theo thu tu cd: correct = so dong dung cua chuyen de, count = so cau dang dung
    private static SubmitDto BuildResult(Entry e, int answered, int total, IEnumerable<int> correctTopics, QuestionBankSnapshot bank)
    {
        var correctByTopic = correctTopics.GroupBy(t => t).ToDictionary(g => g.Key, g => g.Count());
        var byTopic = bank.Topics
            .Select(t => new TopicScoreDto(t.Cd, correctByTopic.GetValueOrDefault(int.Parse(t.Cd)), t.Count))
            .ToList();
        return new SubmitDto("submitted", e.Code, e.Mode, e.Score ?? 0, answered, total,
            !string.IsNullOrEmpty(e.Phone), ToIso(e.SubmittedAt!.Value), byTopic);
    }

    // Cuoc thi dang mo; khong co trang thiPage thi coi nhu dong (QD-006, QD-014)
    private bool IsOpen(ContestSettings? settings) =>
        settings is not null && _settings.GetStatus(settings, DateTime.UtcNow) == ContestStatus.Open;

    /// <summary>3 so dau + **** + 3 so cuoi; null khi khong co so.</summary>
    private static string? MaskPhone(string? phone) =>
        string.IsNullOrEmpty(phone) || phone.Length < 7 ? null : phone[..3] + "****" + phone[^3..];

    // EF doc SQLite ra Kind Unspecified; dat Utc truoc khi dinh dang
    private static string ToIso(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'");
}
