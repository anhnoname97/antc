using System.Net;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public static class QuestionValues
{
    public static readonly IReadOnlyDictionary<string, string> Types = new Dictionary<string, string>
    {
        ["cau-hoi"] = "Câu hỏi, kiến nghị", ["gop-y"] = "Góp ý"
    };
    public static readonly IReadOnlyDictionary<string, string> Statuses = new Dictionary<string, string>
    {
        ["moi"] = "Mới", ["dang-xu-ly"] = "Đang xử lý", ["da-xu-ly"] = "Đã xử lý", ["bo-qua"] = "Bỏ qua"
    };
    public const int PageSize = 50;
    public static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);
    public static DateTimeOffset AsUtc(DateTime value) => new(DateTime.SpecifyKind(value, DateTimeKind.Utc));
}

public sealed record QuestionRegistration(string Type, string Content, bool WantReply, string? Contact);
public sealed record QuestionFilter(string? Type = null, string? Status = null, DateOnly? From = null,
    DateOnly? To = null, string? Search = null);
public sealed record QuestionPage(IReadOnlyList<QuestionRow> Items, int Total, int Page)
{
    public int TotalPages => Math.Max(1, (int)Math.Ceiling(Total / (double)QuestionValues.PageSize));
}
public sealed record QuestionRow(long Id, string Type, string Content, bool WantReply, string? Contact,
    string Status, string? AdminNote, string? HandledBy, DateTimeOffset? HandledAt, DateTimeOffset CreatedAt,
    string? Answer = null, string? PublishedAnswer = null, bool IsPublished = false,
    DateTimeOffset? ApprovedAt = null, string? ApprovedBy = null, long ReviewVersion = 0)
{
    public static QuestionRow FromEntity(QuestionSubmission row) => new(row.Id, row.Type, row.Content,
        row.WantReply, row.Contact, row.Status, row.AdminNote, row.HandledBy,
        row.HandledAt is { } handled ? QuestionValues.AsUtc(handled) : null, QuestionValues.AsUtc(row.CreatedAt),
        row.Answer, row.PublishedAnswer, row.IsPublished,
        row.ApprovedAt is { } approved ? QuestionValues.AsUtc(approved) : null, row.ApprovedBy, row.ReviewVersion);
}

public sealed record QuestionReview(long ReviewVersion, string Status, string? AdminNote, string? Answer);
public sealed record PublishedQuestion(long Id, string Question, string Answer, DateTimeOffset AnsweredAt);
public sealed record PublishedQuestionPage(IReadOnlyList<PublishedQuestion> Items, int Total, int Page)
{
    public const int PageSize = 20;
    public int TotalPages => Math.Max(1, (int)Math.Ceiling(Total / (double)PageSize));
}

public interface IQuestionModerationService
{
    Task<QuestionRow?> GetAsync(long id, CancellationToken ct = default);
    Task<QuestionRow> SaveAsync(long id, QuestionReview review, string actor, CancellationToken ct = default);
    Task<QuestionRow> ApproveAsync(long id, QuestionReview review, string actor, CancellationToken ct = default);
    Task<QuestionRow> UnpublishAsync(long id, long reviewVersion, string actor, CancellationToken ct = default);
}

public interface IPublishedQuestionService
{
    Task<PublishedQuestionPage> ListAsync(int page = 1, CancellationToken ct = default);
}

public sealed class QuestionModerationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public interface IQuestionSubmissionService
{
    Task SubmitAsync(QuestionRegistration registration, IPAddress? ip, CancellationToken ct = default);
    Task<QuestionPage> ListAsync(QuestionFilter filter, int page, CancellationToken ct = default);
    IAsyncEnumerable<QuestionRow> ExportAsync(QuestionFilter filter, CancellationToken ct = default);
    Task<bool> ReviewAsync(long id, string status, string? note, string actor, CancellationToken ct = default);
}

public sealed class QuestionRateLimitedException(int retryAfterSeconds) : Exception("Đã đạt giới hạn gửi câu hỏi.")
{
    public int RetryAfterSeconds { get; } = retryAfterSeconds;
}
