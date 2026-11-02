using System.Data;
using System.Net;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Options;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public sealed class QuestionSubmissionService(AppDbContext db, IOptions<ContestSecurityOptions> security,
    TimeProvider timeProvider, IEnumerable<IQuestionPublicationObserver>? publicationObservers = null) : IQuestionSubmissionService
{
    public async Task SubmitAsync(QuestionRegistration registration, IPAddress? ip, CancellationToken ct = default)
    {
        string address = (ip?.IsIPv4MappedToIPv6 == true ? ip.MapToIPv4() : ip)?.ToString() ?? "unknown";
        string hash = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(security.Value.IpHashSalt),
            Encoding.UTF8.GetBytes("questions:" + address))).ToLowerInvariant();
        await db.Database.OpenConnectionAsync(ct);
        try
        {
            // Đếm và ghi trong BEGIN IMMEDIATE: không vượt hạn mức khi gửi đồng thời,
            // kể cả nhiều tiến trình dùng cùng SQLite. Hạn mức vẫn còn sau khi khởi động lại.
            var connection = (SqliteConnection)db.Database.GetDbConnection();
            await using SqliteTransaction sqlite = connection.BeginTransaction(IsolationLevel.Serializable, deferred: false);
            await using IDbContextTransaction transaction = await db.Database.UseTransactionAsync(sqlite, ct)
                ?? throw new InvalidOperationException("Không tạo được giao dịch tiếp nhận câu hỏi.");
            DateTime now = timeProvider.GetUtcNow().UtcDateTime;
            DateTime cutoff = now.AddHours(-1);
            // Mục vừa xóa vẫn tính hạn mức cho đến hết giờ; thao tác dọn không mở lại lượt gửi.
            DateTime[] recent = await db.QuestionSubmissions.IgnoreQueryFilters().Where(x => x.IpHash == hash && x.CreatedAt > cutoff)
                .OrderBy(x => x.CreatedAt).Take(5).Select(x => x.CreatedAt).ToArrayAsync(ct);
            if (recent.Length >= 5)
                throw new QuestionRateLimitedException(Math.Max(1, (int)Math.Ceiling((recent[0].AddHours(1) - now).TotalSeconds)));
            db.QuestionSubmissions.Add(new QuestionSubmission
            {
                Type = registration.Type,
                Content = registration.Content,
                WantReply = registration.WantReply,
                Contact = registration.Contact,
                Status = "moi",
                ConsentAt = now,
                CreatedAt = now,
                IpHash = hash
            });
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        finally { await db.Database.CloseConnectionAsync(); }
    }

    public async Task<QuestionPage> ListAsync(QuestionFilter filter, int page, CancellationToken ct = default)
    {
        IQueryable<QuestionSubmission> query = Filter(filter);
        int total = await query.CountAsync(ct);
        int skip = (int)Math.Min((long)(Math.Max(1, page) - 1) * QuestionValues.PageSize, int.MaxValue);
        List<QuestionSubmission> rows = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip(skip).Take(QuestionValues.PageSize).ToListAsync(ct);
        return new QuestionPage(await QuestionRelatedTitles.LoadAsync(db, rows.Select(QuestionRow.FromEntity).ToArray(), ct), total, Math.Max(1, page));
    }

    public async IAsyncEnumerable<QuestionRow> ExportAsync(QuestionFilter filter,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (QuestionSubmission row in Filter(filter).OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .AsAsyncEnumerable().WithCancellation(ct))
            yield return QuestionRow.FromEntity(row);
    }

    public async Task<IReadOnlyDictionary<string, int>> InboxCountsAsync(CancellationToken ct = default, string? type = null)
    {
        var query = db.QuestionSubmissions.AsNoTracking();
        if (!string.IsNullOrEmpty(type)) query = query.Where(x => x.Type == type);
        var groups = await query
            .GroupBy(x => new { x.Status, x.IsPublished })
            .Select(x => new { x.Key.Status, x.Key.IsPublished, Count = x.Count() }).ToListAsync(ct);
        return QuestionValues.Inboxes.ToDictionary(inbox => inbox, inbox => groups
            .Where(x => inbox switch
            {
                "da-cong-khai" => x.IsPublished,
                "da-tra-loi" => x.Status == "da-xu-ly" && !x.IsPublished,
                "luu-tru" => x.Status is "luu-tru" or "bo-qua",
                "cho-duyet" => x.Status == "cho-duyet",
                _ => x.Status == inbox && !x.IsPublished
            }).Sum(x => x.Count));
    }

    public async Task<bool> ReviewAsync(long id, string status, string? note, string actor, CancellationToken ct = default)
    {
        if (!QuestionValues.Statuses.ContainsKey(status)) throw new ArgumentException("Trạng thái không hợp lệ.", nameof(status));
        if (note?.Length > 1000) throw new ArgumentException("Ghi chú tối đa 1000 ký tự.", nameof(note));
        if (string.IsNullOrWhiteSpace(actor) || actor.Length > 100) throw new ArgumentException("Người xử lý không hợp lệ.", nameof(actor));
        DateTime now = timeProvider.GetUtcNow().UtcDateTime;
        int updated = await db.QuestionSubmissions.Where(x => x.Id == id).ExecuteUpdateAsync(set => set
            .SetProperty(x => x.Status, status).SetProperty(x => x.AdminNote, note)
            .SetProperty(x => x.IsPublished, x => status != "bo-qua" && status != "luu-tru" && x.IsPublished)
            .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1)
            .SetProperty(x => x.HandledBy, actor).SetProperty(x => x.HandledAt, now), ct);
        if (updated == 1 && status is "bo-qua" or "luu-tru")
            foreach (var observer in publicationObservers ?? [])
                await observer.ChangedAsync(id, CancellationToken.None);
        return updated == 1;
    }

    private IQueryable<QuestionSubmission> Filter(QuestionFilter filter)
    {
        IQueryable<QuestionSubmission> query = db.QuestionSubmissions.AsNoTracking();
        if (!string.IsNullOrEmpty(filter.Type)) query = query.Where(x => x.Type == filter.Type);
        if (!string.IsNullOrEmpty(filter.Status)) query = query.Where(x => x.Status == filter.Status);
        query = filter.Inbox switch
        {
            "da-cong-khai" => query.Where(x => x.IsPublished),
            "da-tra-loi" => query.Where(x => x.Status == "da-xu-ly" && !x.IsPublished),
            "luu-tru" => query.Where(x => x.Status == "luu-tru" || x.Status == "bo-qua"),
            "cho-duyet" => query.Where(x => x.Status == "cho-duyet"),
            "moi" or "dang-xu-ly" => query.Where(x => x.Status == filter.Inbox && !x.IsPublished),
            _ => query
        };
        if (filter.From is { } from)
        {
            DateTime start = DayStartUtc(from); query = query.Where(x => x.CreatedAt >= start);
        }
        if (filter.To is { } to && to != DateOnly.MaxValue)
        {
            DateTime end = DayStartUtc(to.AddDays(1)); query = query.Where(x => x.CreatedAt < end);
        }
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string term = filter.Search.Trim(); query = query.Where(x => x.Content.Contains(term));
        }
        return query;
    }

    private static DateTime DayStartUtc(DateOnly date) => date == DateOnly.MinValue ? DateTime.MinValue
        : DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc).Subtract(QuestionValues.VietnamOffset);
}
