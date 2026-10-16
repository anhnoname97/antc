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
    string Status, string? AdminNote, string? HandledBy, DateTimeOffset? HandledAt, DateTimeOffset CreatedAt)
{
    public static QuestionRow FromEntity(QuestionSubmission row) => new(row.Id, row.Type, row.Content,
        row.WantReply, row.Contact, row.Status, row.AdminNote, row.HandledBy,
        row.HandledAt is { } handled ? QuestionValues.AsUtc(handled) : null, QuestionValues.AsUtc(row.CreatedAt));
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
