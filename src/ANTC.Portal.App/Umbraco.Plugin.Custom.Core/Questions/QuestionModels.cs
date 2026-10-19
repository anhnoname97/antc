using System.Net;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public static class QuestionValues
{
    public const string PortalSource = "portal";
    public const string BackofficeSource = "quan-tri";
    public static readonly IReadOnlyDictionary<string, string> Sources = new Dictionary<string, string>
    {
        [PortalSource] = "Portal", [BackofficeSource] = "Quản trị"
    };
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
    DateTimeOffset? ApprovedAt = null, string? ApprovedBy = null, long ReviewVersion = 0,
    string Source = QuestionValues.PortalSource, string? CreatedBy = null)
{
    public static QuestionRow FromEntity(QuestionSubmission row) => new(row.Id, row.Type, row.Content,
        row.WantReply, row.Contact, row.Status, row.AdminNote, row.HandledBy,
        row.HandledAt is { } handled ? QuestionValues.AsUtc(handled) : null, QuestionValues.AsUtc(row.CreatedAt),
        row.Answer, row.PublishedAnswer, row.IsPublished,
        row.ApprovedAt is { } approved ? QuestionValues.AsUtc(approved) : null, row.ApprovedBy, row.ReviewVersion,
        row.Source, row.CreatedBy);
}

public sealed record QuestionDraft(string? Type, string? Content, string? Answer = null, string? AdminNote = null)
{
    public IReadOnlyDictionary<string, string> Validate()
    {
        var errors = new Dictionary<string, string>();
        if (Type is null || !QuestionValues.Types.ContainsKey(Type))
            errors["type"] = "Chọn Câu hỏi, kiến nghị hoặc Góp ý.";
        if ((Content?.Trim().Length ?? 0) is < 10 or > 2000)
            errors["content"] = "Nội dung cần từ 10 đến 2000 ký tự.";
        if (Answer?.Length > 10000) errors["answer"] = "Câu trả lời tối đa 10.000 ký tự.";
        if (AdminNote?.Length > 1000) errors["adminNote"] = "Ghi chú nội bộ tối đa 1.000 ký tự.";
        return errors;
    }
}

public sealed record QuestionReview(long ReviewVersion, string Status, string? AdminNote, string? Answer);
public sealed record PublishedQuestion(long Id, string Question, string Answer, DateTimeOffset AnsweredAt, string Type);
public sealed record PublishedQuestionQuery(int Page = 1, int PageSize = PublishedQuestionPage.DefaultPageSize,
    string? Search = null, string Sort = "newest", string? Type = null)
{
    public const int MaxSearchLength = 200;
    public string? SearchTerm => string.IsNullOrWhiteSpace(Search) ? null : Search.Trim();
    public string? TypeFilter => string.IsNullOrWhiteSpace(Type) ? null : Type.Trim();

    public IReadOnlyDictionary<string, string> Validate()
    {
        var errors = new Dictionary<string, string>();
        if (Page < 1) errors["page"] = "Số trang phải từ 1 trở lên.";
        if (PageSize is < 1 or > PublishedQuestionPage.MaxPageSize)
            errors["pageSize"] = "Số mục mỗi trang phải từ 1 đến 50.";
        if (SearchTerm?.Length > MaxSearchLength) errors["search"] = "Từ khóa tối đa 200 ký tự.";
        if (Sort is not ("newest" or "oldest")) errors["sort"] = "Chọn newest hoặc oldest.";
        if (TypeFilter is { } type && !QuestionValues.Types.ContainsKey(type))
            errors["type"] = "Chọn cau-hoi hoặc gop-y.";
        return errors;
    }
}
public sealed record PublishedQuestionPage(IReadOnlyList<PublishedQuestion> Items, int Total, int Page, int PageSize)
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 50;
    public int TotalPages => Math.Max(1, (int)Math.Ceiling(Total / (double)PageSize));
}

public interface IQuestionModerationService
{
    Task<QuestionRow> CreateAsync(QuestionDraft draft, string actor, CancellationToken ct = default);
    Task<QuestionRow?> GetAsync(long id, CancellationToken ct = default);
    Task<QuestionRow> SaveAsync(long id, QuestionReview review, string actor, CancellationToken ct = default);
    Task<QuestionRow> ApproveAsync(long id, QuestionReview review, string actor, CancellationToken ct = default);
    Task<QuestionRow> UnpublishAsync(long id, long reviewVersion, string actor, CancellationToken ct = default);
}

public interface IPublishedQuestionService
{
    Task<PublishedQuestionPage> ListAsync(PublishedQuestionQuery query, CancellationToken ct = default);
    Task<PublishedQuestion?> GetPublishedAsync(long id, CancellationToken ct = default);
}

public sealed class QuestionModerationException(string code, string message,
    IReadOnlyDictionary<string, string>? fields = null) : Exception(message)
{
    public string Code { get; } = code;
    public IReadOnlyDictionary<string, string>? Fields { get; } = fields;
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
