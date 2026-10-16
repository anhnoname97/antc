using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public sealed class QuestionModerationService(AppDbContext db, TimeProvider clock)
    : IQuestionModerationService, IPublishedQuestionService
{
    public async Task<QuestionRow?> GetAsync(long id, CancellationToken ct = default)
    {
        var entity = await db.QuestionSubmissions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        return entity is null ? null : QuestionRow.FromEntity(entity);
    }

    public async Task<QuestionRow> SaveAsync(long id, QuestionReview review, string actor, CancellationToken ct = default)
    {
        Validate(review, actor, false);
        DateTime now = clock.GetUtcNow().UtcDateTime;
        // Trạng thái xử lý không phải là quyền công bố. Bỏ qua đồng thời thu hồi bản công khai.
        int count = await db.QuestionSubmissions.Where(x => x.Id == id && x.ReviewVersion == review.ReviewVersion)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.Status, review.Status)
                .SetProperty(x => x.AdminNote, Trim(review.AdminNote)).SetProperty(x => x.Answer, Trim(review.Answer))
                .SetProperty(x => x.IsPublished, x => review.Status != "bo-qua" && x.IsPublished)
                .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        return await ResultAsync(id, count, ct);
    }

    public async Task<QuestionRow> ApproveAsync(long id, QuestionReview review, string actor, CancellationToken ct = default)
    {
        Validate(review, actor, true);
        QuestionRow current = await GetAsync(id, ct) ?? throw new QuestionModerationException("NOT_FOUND", "Không tìm thấy câu hỏi.");
        if (current.Type != "cau-hoi")
            throw new QuestionModerationException("VALIDATION", "Góp ý chỉ xử lý nội bộ, không công bố thành câu hỏi.");
        DateTime now = clock.GetUtcNow().UtcDateTime;
        // Duyệt và chụp bản trả lời trong cùng một UPDATE có kiểm tra phiên bản.
        // Câu hỏi, liên hệ và thời điểm đồng ý luôn giữ nguyên từ yêu cầu của người dùng.
        string answer = review.Answer!.Trim();
        int count = await db.QuestionSubmissions.Where(x => x.Id == id && x.ReviewVersion == review.ReviewVersion)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.Status, "da-xu-ly")
                .SetProperty(x => x.AdminNote, Trim(review.AdminNote)).SetProperty(x => x.Answer, answer)
                .SetProperty(x => x.PublishedAnswer, answer).SetProperty(x => x.IsPublished, true)
                .SetProperty(x => x.ApprovedBy, actor).SetProperty(x => x.ApprovedAt, now)
                .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        return await ResultAsync(id, count, ct);
    }

    public async Task<QuestionRow> UnpublishAsync(long id, long reviewVersion, string actor, CancellationToken ct = default)
    {
        Validate(new(reviewVersion, "dang-xu-ly", null, null), actor, false);
        DateTime now = clock.GetUtcNow().UtcDateTime;
        int count = await db.QuestionSubmissions.Where(x => x.Id == id && x.ReviewVersion == reviewVersion)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsPublished, false)
                .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        return await ResultAsync(id, count, ct);
    }

    public async Task<PublishedQuestionPage> ListAsync(int page = 1, CancellationToken ct = default)
    {
        // DTO công khai không chứa email, ghi chú, IP, tên người xử lý hay bản trả lời nháp.
        var query = db.QuestionSubmissions.AsNoTracking().Where(x => x.Type == "cau-hoi" && x.IsPublished
            && x.ApprovedAt != null && x.PublishedAnswer != null && x.PublishedAnswer != "");
        int total = await query.CountAsync(ct);
        page = Math.Max(1, page);
        int skip = (int)Math.Min((long)(page - 1) * PublishedQuestionPage.PageSize, int.MaxValue);
        var rows = await query.OrderByDescending(x => x.ApprovedAt).ThenByDescending(x => x.Id)
            .Skip(skip).Take(PublishedQuestionPage.PageSize)
            .Select(x => new { x.Id, x.Content, x.PublishedAnswer, x.ApprovedAt }).ToListAsync(ct);
        return new(rows.Select(x => new PublishedQuestion(x.Id, x.Content, x.PublishedAnswer!,
            QuestionValues.AsUtc(x.ApprovedAt!.Value))).ToArray(), total, page);
    }

    private async Task<QuestionRow> ResultAsync(long id, int count, CancellationToken ct)
    {
        QuestionRow? row = await GetAsync(id, ct);
        if (row is null) throw new QuestionModerationException("NOT_FOUND", "Không tìm thấy câu hỏi.");
        if (count == 0) throw new QuestionModerationException("CONFLICT", "Câu hỏi đã được người khác xử lý. Tải lại trước khi lưu hoặc duyệt.");
        return row;
    }

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static void Validate(QuestionReview review, string actor, bool approving)
    {
        if (review.ReviewVersion < 0 || string.IsNullOrEmpty(review.Status) || !QuestionValues.Statuses.ContainsKey(review.Status)
            || review.AdminNote?.Length > 1000 || review.Answer?.Length > 10000)
            throw new QuestionModerationException("VALIDATION", "Trạng thái không hợp lệ, ghi chú quá 1000 ký tự hoặc câu trả lời quá 10000 ký tự.");
        if (approving && (review.Answer?.Trim().Length ?? 0) < 10)
            throw new QuestionModerationException("VALIDATION", "Cần nhập câu trả lời từ 10 đến 10000 ký tự trước khi duyệt công bố.");
        if (string.IsNullOrWhiteSpace(actor) || actor.Length > 100)
            throw new QuestionModerationException("VALIDATION", "Không xác định được người xử lý.");
    }
}
