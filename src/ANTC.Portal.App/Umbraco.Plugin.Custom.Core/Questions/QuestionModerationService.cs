using System.Text;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public sealed class QuestionModerationService(AppDbContext db, TimeProvider clock,
    IEnumerable<IQuestionPublicationObserver>? publicationObservers = null)
    : IQuestionModerationService, IPublishedQuestionService
{
    public async Task<QuestionRow> CreateAsync(QuestionDraft draft, string actor, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(draft);
        var fields = draft.Validate();
        if (fields.Count > 0)
            throw new QuestionModerationException("VALIDATION", "Kiểm tra các trường cần nhập.", fields);
        Validate(new QuestionReview(0, "moi", draft.AdminNote, draft.Answer), actor, false);
        var row = new QuestionSubmission
        {
            Type = draft.Type!, Content = draft.Content!.Trim(), Answer = Trim(draft.Answer),
            AdminNote = Trim(draft.AdminNote), Source = QuestionValues.BackofficeSource, CreatedBy = actor,
            CreatedAt = clock.GetUtcNow().UtcDateTime, Status = "moi"
        };
        // Tạo trực tiếp trong quản trị không giả lập sự đồng ý hoặc địa chỉ IP của người gửi portal.
        // Nội dung luôn ở bản nháp; công bố vẫn đi qua bước duyệt có kiểm tra phiên bản.
        db.QuestionSubmissions.Add(row);
        await db.SaveChangesAsync(ct);
        return QuestionRow.FromEntity(row);
    }

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
                .SetProperty(x => x.GuidanceLabel, Trim(review.GuidanceLabel)).SetProperty(x => x.GuidanceUrl, Trim(review.GuidanceUrl))
                .SetProperty(x => x.IsPublished, x => review.Status != "bo-qua" && x.IsPublished)
                .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        var row = await ResultAsync(id, count, ct);
        if (review.Status == "bo-qua") await PublicationChangedAsync(id);
        return row;
    }

    public async Task<QuestionRow> ApproveAsync(long id, QuestionReview review, string actor, CancellationToken ct = default)
    {
        Validate(review, actor, true);
        QuestionRow current = await GetAsync(id, ct) ?? throw new QuestionModerationException("NOT_FOUND", "Không tìm thấy câu hỏi.");
        if (!QuestionValues.Types.ContainsKey(current.Type))
            throw new QuestionModerationException("VALIDATION", "Loại nội dung không hợp lệ để công bố.");
        if (current.Type == "cau-hoi" && Trim(review.GuidanceLabel) is null)
            throw new QuestionModerationException("VALIDATION", "Cần thêm liên kết nội dung hướng dẫn đã thẩm định trước khi công bố câu hỏi.");
        DateTime now = clock.GetUtcNow().UtcDateTime;
        // Duyệt và chụp bản trả lời trong cùng một UPDATE có kiểm tra phiên bản.
        // Giữ nguyên câu hỏi, nguồn tạo và thông tin tiếp nhận khi duyệt câu trả lời.
        string answer = review.Answer!.Trim();
        int count = await db.QuestionSubmissions.Where(x => x.Id == id && x.ReviewVersion == review.ReviewVersion)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.Status, "da-xu-ly")
                .SetProperty(x => x.AdminNote, Trim(review.AdminNote)).SetProperty(x => x.Answer, answer)
                .SetProperty(x => x.PublishedAnswer, answer).SetProperty(x => x.IsPublished, true)
                .SetProperty(x => x.GuidanceLabel, Trim(review.GuidanceLabel)).SetProperty(x => x.GuidanceUrl, Trim(review.GuidanceUrl))
                .SetProperty(x => x.PublishedGuidanceLabel, Trim(review.GuidanceLabel)).SetProperty(x => x.PublishedGuidanceUrl, Trim(review.GuidanceUrl))
                .SetProperty(x => x.ApprovedBy, actor).SetProperty(x => x.ApprovedAt, now)
                .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        var row = await ResultAsync(id, count, ct);
        await PublicationChangedAsync(id);
        return row;
    }

    public async Task<QuestionRow> UnpublishAsync(long id, long reviewVersion, string actor, CancellationToken ct = default)
    {
        Validate(new(reviewVersion, "dang-xu-ly", null, null), actor, false);
        DateTime now = clock.GetUtcNow().UtcDateTime;
        int count = await db.QuestionSubmissions.Where(x => x.Id == id && x.ReviewVersion == reviewVersion)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsPublished, false)
                .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now)
                .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        var row = await ResultAsync(id, count, ct);
        await PublicationChangedAsync(id);
        return row;
    }

    public async Task<PublishedQuestionPage> ListAsync(PublishedQuestionQuery options, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (options.Validate().Count > 0) throw new ArgumentException("Tham số danh sách không hợp lệ.", nameof(options));
        IQueryable<QuestionSubmission> query = PublishedQuery();
        if (options.TypeFilter is { } type) query = query.Where(x => x.Type == type);
        if (options.SearchTerm is { } search)
        {
            string pattern = SearchPattern(search);
            query = query.Where(x => EF.Functions.Glob(x.Content, pattern) || EF.Functions.Glob(x.PublishedAnswer!, pattern));
        }
        int total = await query.CountAsync(ct);
        int skip = (int)Math.Min((long)(options.Page - 1) * options.PageSize, int.MaxValue);
        var ordered = options.Sort == "oldest"
            ? query.OrderBy(x => x.ApprovedAt).ThenBy(x => x.Id)
            : query.OrderByDescending(x => x.ApprovedAt).ThenByDescending(x => x.Id);
        var rows = await ordered.Skip(skip).Take(options.PageSize)
            .Select(x => new { x.Id, x.Type, x.Content, x.PublishedAnswer, x.ApprovedAt, x.PublishedGuidanceLabel, x.PublishedGuidanceUrl }).ToListAsync(ct);
        return new(rows.Select(x => new PublishedQuestion(x.Id, x.Content, x.PublishedAnswer!,
            QuestionValues.AsUtc(x.ApprovedAt!.Value), x.Type, x.PublishedGuidanceLabel, x.PublishedGuidanceUrl)).ToArray(), total, options.Page, options.PageSize);
    }

    public async Task<PublishedQuestion?> GetPublishedAsync(long id, CancellationToken ct = default)
    {
        var row = await PublishedQuery().Where(x => x.Id == id)
            .Select(x => new { x.Id, x.Type, x.Content, x.PublishedAnswer, x.ApprovedAt, x.PublishedGuidanceLabel, x.PublishedGuidanceUrl }).SingleOrDefaultAsync(ct);
        return row is null ? null : new PublishedQuestion(row.Id, row.Content, row.PublishedAnswer!,
            QuestionValues.AsUtc(row.ApprovedAt!.Value), row.Type, row.PublishedGuidanceLabel, row.PublishedGuidanceUrl);
    }

    private IQueryable<QuestionSubmission> PublishedQuery() => db.QuestionSubmissions.AsNoTracking()
        .Where(x => (x.Type == "cau-hoi" || x.Type == "gop-y") && x.IsPublished && x.ApprovedAt != null
            && x.PublishedAnswer != null && x.PublishedAnswer != "");

    private static string SearchPattern(string term)
    {
        // SQLite LIKE/LOWER chỉ đổi hoa thường ASCII. GLOB ghép cả hai dạng chữ tiếng Việt;
        // các ký tự điều khiển mẫu do người dùng nhập đều được tìm như văn bản thường.
        var pattern = new StringBuilder("*");
        foreach (char value in term)
        {
            char lower = char.ToLowerInvariant(value), upper = char.ToUpperInvariant(value);
            if (lower != upper) pattern.Append('[').Append(lower).Append(upper).Append(']');
            else pattern.Append(value switch { '*' => "[*]", '?' => "[?]", '[' => "[[]", _ => value.ToString() });
        }
        return pattern.Append('*').ToString();
    }

    private async Task<QuestionRow> ResultAsync(long id, int count, CancellationToken ct)
    {
        QuestionRow? row = await GetAsync(id, ct);
        if (row is null) throw new QuestionModerationException("NOT_FOUND", "Không tìm thấy câu hỏi.");
        if (count == 0) throw new QuestionModerationException("CONFLICT", "Câu hỏi đã được người khác xử lý. Tải lại trước khi lưu hoặc duyệt.");
        return row;
    }

    private async Task PublicationChangedAsync(long id)
    {
        // The database update is committed. Finish notifying even if the browser disconnects.
        foreach (var observer in publicationObservers ?? [])
            await observer.ChangedAsync(id, CancellationToken.None);
    }

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static void Validate(QuestionReview review, string actor, bool approving)
    {
        if (review.ReviewVersion < 0 || string.IsNullOrEmpty(review.Status) || !QuestionValues.Statuses.ContainsKey(review.Status)
            || review.AdminNote?.Length > 1000 || review.Answer?.Length > 10000)
            throw new QuestionModerationException("VALIDATION", "Trạng thái không hợp lệ, ghi chú quá 1000 ký tự hoặc câu trả lời quá 10000 ký tự.");
        if (approving && (review.Answer?.Trim().Length ?? 0) < 10)
            throw new QuestionModerationException("VALIDATION", "Cần nhập câu trả lời hoặc phản hồi từ 10 đến 10000 ký tự trước khi duyệt công bố.");
        string? guidanceLabel = Trim(review.GuidanceLabel), guidanceUrl = Trim(review.GuidanceUrl);
        if (guidanceLabel?.Length > 200 || guidanceUrl?.Length > 2048
            || (guidanceLabel is null) != (guidanceUrl is null)
            || (guidanceUrl is not null && !QuestionGuidanceLink.IsSafe(guidanceUrl)))
            throw new QuestionModerationException("VALIDATION", "Nhập đủ nhãn hướng dẫn (tối đa 200 ký tự) và URL hợp lệ (tối đa 2048 ký tự). URL phải bắt đầu bằng / hoặc http(s)://.");
        if (string.IsNullOrWhiteSpace(actor) || actor.Length > 100)
            throw new QuestionModerationException("VALIDATION", "Không xác định được người xử lý.");
    }
}
