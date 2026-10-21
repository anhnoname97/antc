using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public sealed record QuestionSelection([property: JsonRequired] long Id, [property: JsonRequired] long ReviewVersion);
public sealed record AggregateQuestionsRequest(IReadOnlyList<QuestionSelection>? Items, QuestionDraft? Draft);
public sealed record DeleteQuestionsRequest(IReadOnlyList<QuestionSelection>? Items);
public sealed record DeleteQuestionsResult(int DeletedCount, IReadOnlyList<long> Ids);

public sealed class QuestionOperations(AppDbContext db, IQuestionModerationService moderation, TimeProvider clock,
    IEnumerable<IQuestionPublicationObserver> observers, ILogger<QuestionOperations> logger)
{
    public const int MaxSelection = 50;

    public async Task<QuestionRow> AggregateAsync(AggregateQuestionsRequest request, string actor, CancellationToken ct = default)
    {
        ValidateSelection(request.Items, 2, actor);
        if (request.Draft is not { } draft)
            throw Invalid("Nhập câu hỏi và câu trả lời chung.");
        var fields = new Dictionary<string, string>(draft.Validate());
        if ((draft.Answer?.Trim().Length ?? 0) < 10)
            fields["answer"] = "Câu trả lời chung cần từ 10 đến 10.000 ký tự.";
        if (fields.Count > 0)
            throw new QuestionModerationException("VALIDATION", "Kiểm tra nội dung tổng hợp.", fields);

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var rows = await SelectedAsync(request.Items!, ct);
        if (rows.Any(x => x.IsPublished || x.AggregatedIntoId != null || x.Status is not ("moi" or "dang-xu-ly")))
            throw Invalid("Chỉ tổng hợp mục Mới hoặc Đang xử lý, chưa công bố và chưa được tổng hợp.");

        var created = await moderation.CreateAsync(draft, actor, ct);
        var summary = await db.QuestionSubmissions.SingleAsync(x => x.Id == created.Id, ct);
        summary.Source = QuestionValues.AggregateSource;
        summary.AggregatedSourceIds = JsonSerializer.Serialize(rows.Select(x => x.Id).Order().ToArray());
        DateTime now = clock.GetUtcNow().UtcDateTime;
        foreach (var selected in request.Items!)
        {
            int count = await db.QuestionSubmissions.Where(x => x.Id == selected.Id && x.ReviewVersion == selected.ReviewVersion)
                .ExecuteUpdateAsync(set => set.SetProperty(x => x.Status, "da-xu-ly")
                    .SetProperty(x => x.AggregatedIntoId, summary.Id)
                    .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                    .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
            if (count != 1) throw Conflict();
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        logger.LogInformation("{Actor} tạo nội dung tổng hợp {Id} từ {SourceCount} nội dung", actor, summary.Id, rows.Length);
        return QuestionRow.FromEntity(summary);
    }

    public async Task<DeleteQuestionsResult> DeleteAsync(IReadOnlyList<QuestionSelection>? items, string actor, CancellationToken ct = default)
    {
        ValidateSelection(items, 1, actor);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await SelectedAsync(items!, ct);
        DateTime now = clock.GetUtcNow().UtcDateTime;
        foreach (var selected in items!)
        {
            int count = await db.QuestionSubmissions.Where(x => x.Id == selected.Id && x.ReviewVersion == selected.ReviewVersion)
                .ExecuteUpdateAsync(set => set.SetProperty(x => x.DeletedAt, now).SetProperty(x => x.DeletedBy, actor)
                    .SetProperty(x => x.IsPublished, false).SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                    .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
            if (count != 1) throw Conflict();
        }
        await transaction.CommitAsync(ct);
        foreach (var selected in items!)
            foreach (var observer in observers)
                await observer.ChangedAsync(selected.Id, CancellationToken.None);
        logger.LogInformation("{Actor} xóa nội dung Hỏi–Đáp: {Ids}", actor, string.Join(',', items!.Select(x => x.Id)));
        return new(items.Count, items.Select(x => x.Id).ToArray());
    }

    private async Task<QuestionSubmission[]> SelectedAsync(IReadOnlyList<QuestionSelection> items, CancellationToken ct)
    {
        var ids = items.Select(x => x.Id).ToArray();
        var rows = await db.QuestionSubmissions.AsNoTracking().Where(x => ids.Contains(x.Id)).ToArrayAsync(ct);
        if (rows.Length != items.Count || rows.Any(row => items.Single(x => x.Id == row.Id).ReviewVersion != row.ReviewVersion))
            throw Conflict();
        return rows;
    }

    private static void ValidateSelection(IReadOnlyList<QuestionSelection>? items, int minimum, string actor)
    {
        if (items is null || items.Count < minimum || items.Count > MaxSelection
            || items.Any(x => x is null || x.Id < 1 || x.ReviewVersion < 0) || items.Select(x => x.Id).Distinct().Count() != items.Count)
            throw Invalid($"Chọn từ {minimum} đến {MaxSelection} nội dung khác nhau và tải lại phiên bản mới nhất.");
        if (string.IsNullOrWhiteSpace(actor) || actor.Length > 100) throw Invalid("Không xác định được người xử lý.");
    }

    private static QuestionModerationException Invalid(string message) => new("VALIDATION", message);
    private static QuestionModerationException Conflict() => new("CONFLICT", "Có nội dung đã thay đổi hoặc đã bị xóa. Tải lại danh sách và chọn lại; chưa thực hiện thao tác nào.");
}
