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

public interface IContestAttemptService
{
    /// <summary>Tra luot thi theo token (header X-Entry-Token); null neu thieu hoac khong khop.</summary>
    Task<Entry?> AuthenticateAsync(string? token, CancellationToken ct = default);

    /// <summary>API-02: tinh trang luot thi va cac dap an da luu.</summary>
    Task<EntryStateDto> GetStateAsync(Entry entry, CancellationToken ct = default);
}

/// <summary>Cac API /me cua luot thi (BE-23, BE-24). Hien co xac thuc token va API-02.</summary>
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

    /// <summary>3 so dau + **** + 3 so cuoi; null khi khong co so.</summary>
    private static string? MaskPhone(string? phone) =>
        string.IsNullOrEmpty(phone) || phone.Length < 7 ? null : phone[..3] + "****" + phone[^3..];

    // EF doc SQLite ra Kind Unspecified; dat Utc truoc khi dinh dang
    private static string ToIso(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'");
}
