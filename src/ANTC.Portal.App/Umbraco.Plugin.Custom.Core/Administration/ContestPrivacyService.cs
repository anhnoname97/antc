using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Administration;

public sealed class ContestPrivacyService(AppDbContext db, IDataProtectionProvider protection, TimeProvider clock, ContestAuditService audit, IPrivacyFileCleanup? fileCleanup = null)
{
    public const string BulkPhrase = "XÓA DỮ LIỆU CÁ NHÂN";
    public const string AnonymizePhrase = "XÓA THÔNG TIN";
    public const string DeletePhrase = "XÓA VĨNH VIỄN";
    private static readonly JsonSerializerOptions WebJson = new(JsonSerializerDefaults.Web);
    private sealed record Ticket(Guid Actor, string Kind, string Value, string Fingerprint, DateTime ExpiresAt);
    private IDataProtector Protector => protection.CreateProtector("Antc.ContestPrivacy.Preview.v1");
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    private DateTime Now => clock.GetUtcNow().UtcDateTime;
    private static void Require(bool ok, string code, string message, int status = 409) { if (!ok) throw new PrivacyException(code, message, status); }
    private static void Confirm(string? actual, string expected) => Require(actual?.Trim().Normalize(NormalizationForm.FormC) == expected,
        "PRIVACY_CONFIRMATION_REQUIRED", "Cụm xác nhận chưa chính xác. Chưa thực hiện xóa.", 400);
    private static string Fingerprint(IReadOnlyList<Entry> entries) => Hash(JsonSerializer.Serialize(entries.Select(e => new
        { e.Id, e.Code, e.FullName, e.Phone, e.Org, e.IpHash, e.TokenHash, e.Mode, e.Status, e.Score, e.ConsentAt, e.AttemptNo })));

    private async Task<(string Kind, string Value)> ResolveAsync(PrivacyLookup lookup, CancellationToken ct)
    {
        string value = lookup.Value?.Trim() ?? "";
        Require(value.Length is > 0 and <= 100 && lookup.Page is >= 1 and <= 1000000, "VALIDATION", "Nhập số điện thoại hoặc mã dự thi hợp lệ.", 400);
        if (lookup.Kind == "phone")
        {
            value = Regex.Replace(value, "[^0-9]", "");
            if (value.StartsWith("84", StringComparison.Ordinal) && value.Length == 11) value = "0" + value[2..];
            Require(Regex.IsMatch(value, "\\A0[0-9]{9}\\z"), "VALIDATION", "Số điện thoại không hợp lệ.", 400);
            return ("phone", value);
        }
        Require(lookup.Kind == "code", "VALIDATION", "Chọn tìm theo số điện thoại hoặc mã dự thi.", 400);
        value = value.ToUpperInvariant();
        var entry = await db.Entries.AsNoTracking().Where(e => e.Code == value).Select(e => new { e.Phone }).SingleOrDefaultAsync(ct);
        // A named entry identifies all attempts of this person, across contests, not only the selected code.
        return !string.IsNullOrEmpty(entry?.Phone) ? ("phone", entry.Phone) : ("code", value);
    }
    private Task<List<Entry>> FindAsync(string kind, string value, CancellationToken ct) =>
        db.Entries.AsNoTracking().Where(e => kind == "phone" ? e.Phone == value : e.Code == value).OrderBy(e => e.Id).ToListAsync(ct);

    public async Task<PrivacyPreview> PreviewAsync(PrivacyLookup lookup, Guid actor, CancellationToken ct)
    {
        Require(actor != Guid.Empty, "UNAUTHORIZED", "Vui lòng đăng nhập backoffice.", 401);
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var target = await ResolveAsync(lookup, ct);
        var entries = await FindAsync(target.Kind, target.Value, ct);
        int size = Math.Clamp(lookup.PageSize, 1, 100);
        int page = Math.Clamp(lookup.Page, 1, Math.Max(1, (int)Math.Ceiling(entries.Count / (double)size)));
        var ids = entries.Skip((page - 1) * size).Take(size).Select(e => e.Id).ToArray();
        var answered = await db.EntryAnswers.Where(a => ids.Contains(a.EntryId)).GroupBy(a => a.EntryId).Select(g => new { Id = g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.Id, x => x.Count, ct);
        string ticket = Protector.Protect(JsonSerializer.Serialize(new Ticket(actor, target.Kind, target.Value, Fingerprint(entries), Now.AddMinutes(10))));
        await audit.RecordAsync(actor, "privacy.preview", new { Total = entries.Count, Page = page }, null, ct);
        await tx.CommitAsync(ct);
        return new(ticket, entries.Count, page, Math.Max(1, (int)Math.Ceiling(entries.Count / (double)size)), entries.Where(e => ids.Contains(e.Id))
            .Select(e => new PrivacyEntry(e.Id, e.Code, e.FullName, e.Phone, e.Org,
                e.ContestId, e.Status, answered.GetValueOrDefault(e.Id), e.Score)).ToList(), size);
    }

    public async Task<PrivacyResult> ErasePersonAsync(PrivacyEraseRequest request, Guid actor, CancellationToken ct)
    {
        Require(request.Mode is "anonymize" or "delete", "VALIDATION", "Chọn cách xóa thông tin hoặc xóa hẳn lượt thi.", 400);
        Confirm(request.Confirmation, request.Mode == "delete" ? DeletePhrase : AnonymizePhrase);
        return await EraseAsync(request.RequestId, actor, "person", request.Mode, request.PreviewToken, ct);
    }
    public async Task<PrivacyResult> EraseAllAsync(PrivacyBulkRequest request, Guid actor, CancellationToken ct)
    {
        Confirm(request.Confirmation, BulkPhrase);
        return await EraseAsync(request.RequestId, actor, "all", "anonymize", "all", ct);
    }

    private async Task<PrivacyResult> EraseAsync(Guid id, Guid actor, string scope, string action, string payload, CancellationToken ct)
    {
        Require(id != Guid.Empty && actor != Guid.Empty, "VALIDATION", "Thiếu mã yêu cầu hoặc người thực hiện.", 400);
        string requestHash = Hash(scope + ":" + action + ":" + payload);
        await db.Database.OpenConnectionAsync(ct);
        try
        {
            await db.Database.ExecuteSqlRawAsync("PRAGMA secure_delete=ON;", ct);
            await using (var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct))
            {
                var previous = await db.PrivacyOperations.AsNoTracking().SingleOrDefaultAsync(o => o.Id == id, ct);
                if (previous is not null)
                {
                    Require(previous.ActorUserKey == actor && previous.RequestHash == requestHash, "PRIVACY_REQUEST_CHANGED", "Mã yêu cầu đã dùng cho thao tác khác.");
                    return Map(previous); // A retry must not erase newly created rows or append another erase audit.
                }
                List<Entry> entries;
                if (scope == "all")
                {
                    var contests = await db.ContestCampaigns.AsNoTracking().Where(c => c.IsActive).Select(c => new { c.StartAt, c.EndAt, c.SubmitGraceHours }).ToListAsync(ct);
                    Require(!contests.Any(c => c.StartAt <= Now && Now <= c.EndAt.AddHours(c.SubmitGraceHours)), "PRIVACY_CONTEST_OPEN",
                        "Chưa được xóa hàng loạt khi còn cuộc thi đang mở hoặc trong thời gian gia hạn nộp bài.");
                    entries = await db.Entries.ToListAsync(ct);
                }
                else
                {
                    Ticket ticket;
                    try { ticket = JsonSerializer.Deserialize<Ticket>(Protector.Unprotect(payload))!; }
                    catch (Exception e) when (e is CryptographicException or JsonException or ArgumentException) { throw new PrivacyException("PRIVACY_PREVIEW_INVALID", "Bản xem trước không hợp lệ. Hãy tìm và kiểm tra lại.", 400); }
                    Require(ticket is not null && ticket.Actor == actor && ticket.ExpiresAt > Now, "PRIVACY_PREVIEW_EXPIRED", "Bản xem trước đã hết hạn hoặc không thuộc tài khoản này. Hãy tìm lại.");
                    entries = await FindAsync(ticket!.Kind, ticket.Value, ct);
                    Require(entries.Count > 0 && Fingerprint(entries) == ticket.Fingerprint, "PRIVACY_PREVIEW_CHANGED", "Các lượt liên quan đã thay đổi. Hãy tìm và kiểm tra lại trước khi xóa.");
                    foreach (var entry in entries) db.Attach(entry);
                }
                long[] ids = entries.Select(e => e.Id).ToArray();
                var codes = entries.Select(e => e.Code).ToHashSet(StringComparer.Ordinal);
                var phones = entries.Where(e => !string.IsNullOrEmpty(e.Phone)).Select(e => e.Phone!).ToHashSet(StringComparer.Ordinal);
                var names = entries.SelectMany(e => new[] { e.FullName, e.Org }).Where(v => !string.IsNullOrWhiteSpace(v))
                    .Select(v => v!.Trim().Normalize(NormalizationForm.FormC)).ToHashSet(StringComparer.OrdinalIgnoreCase);
                int answers = await db.EntryAnswers.CountAsync(a => ids.Contains(a.EntryId), ct);
                var counts = await RedactSnapshotsAsync(scope == "all", action == "delete", codes, phones, names, ct);
                int contacts = 0;
                if (scope == "all") contacts = await db.QuestionSubmissions.Where(q => q.Contact != null || q.IpHash != null)
                    .ExecuteUpdateAsync(set => set.SetProperty(q => q.Contact, (string?)null).SetProperty(q => q.IpHash, (string?)null).SetProperty(q => q.WantReply, false), ct);
                else if (phones.Count > 0)
                {
                    foreach (var question in await db.QuestionSubmissions.Where(q => q.Contact != null).ToListAsync(ct))
                    {
                        bool match = Regex.Matches(question.Contact!, @"(?<![0-9])(?:\+?84|0)(?:[\s().-]*[0-9]){9}(?![0-9])")
                            .Any(m => phones.Contains(NormalizePhone(m.Value)));
                        if (!match) continue;
                        question.Contact = null; question.IpHash = null; question.WantReply = false; contacts++;
                    }
                }
                foreach (var entry in entries)
                {
                    if (action == "delete") db.Entries.Remove(entry);
                    else
                    {
                        entry.FullName = null; entry.Phone = null; entry.Org = null; entry.IpHash = null;
                        entry.ConsentAt = null; entry.AttemptNo = null; entry.Mode = EntryModes.Anon;
                        // Revoke old bearer tokens; an in-progress person cannot attach their contact again using an old tab.
                        entry.TokenHash = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
                        if (entry.SubmissionResultJson is not null)
                        {
                            try
                            {
                                var result = JsonSerializer.Deserialize<SubmitDto>(entry.SubmissionResultJson)
                                    ?? throw new JsonException();
                                entry.SubmissionResultJson = JsonSerializer.Serialize(result with { Mode = EntryModes.Anon, EligibleForPrize = false });
                            }
                            catch (JsonException) { throw new PrivacyException("PRIVACY_SNAPSHOT_INVALID", "Bản chụp kết quả không hợp lệ; chưa xóa dữ liệu. Cần kiểm tra trước khi tiếp tục."); }
                        }
                    }
                }
                var numbers = new PrivacyCounts(entries.Count, action == "delete" ? answers : 0, contacts, counts.Draws, counts.Results, counts.Audits);
                db.PrivacyOperations.Add(new PrivacyOperation { Id = id, ActorUserKey = actor, OccurredAt = Now, Scope = scope, Action = action,
                    RequestHash = requestHash, CountsJson = JsonSerializer.Serialize(numbers), CleanupErrorCode = "VACUUM_PENDING" });
                // This audit contains counts only; no selector, hashes of phones, codes or erased content.
                await audit.RecordAsync(actor, scope == "all" ? "privacy.bulk" : "privacy." + action, numbers, null, ct);
                await tx.CommitAsync(ct);
            }
        }
        finally { db.ChangeTracker.Clear(); await db.Database.CloseConnectionAsync(); }
        // Erasure is already committed. A disconnect cannot silently skip physical cleanup.
        return await VacuumAsync(id, actor, false, CancellationToken.None);
    }

    private async Task<(int Draws, int Results, int Audits)> RedactSnapshotsAsync(bool all, bool delete,
        HashSet<string> codes, HashSet<string> phones, HashSet<string> names, CancellationToken ct)
    {
        int draws = 0, results = 0, audits = 0;
        try
        {
            foreach (var draw in await db.Draws.Where(d => d.EligibleSnapshotJson != null).ToListAsync(ct))
            {
                var people = JsonSerializer.Deserialize<List<DrawCandidateSnapshot>>(draw.EligibleSnapshotJson!) ?? throw new JsonException();
                bool changed = people.Any(p => (all || codes.Contains(p.Code) || phones.Contains(p.Phone)) && (p.FullName != "" || p.Phone != ""));
                if (!changed) continue;
                draw.EligibleSnapshotJson = JsonSerializer.Serialize(people.Select(p => all || codes.Contains(p.Code) || phones.Contains(p.Phone) ? p with { FullName = "", Phone = "" } : p));
                draws++;
            }
            foreach (var publication in await db.ContestPublishedResults.ToListAsync(ct))
            {
                var snapshot = JsonSerializer.Deserialize<ResultSnapshot>(publication.SnapshotJson, WebJson) ?? throw new JsonException();
                if (snapshot.Leaderboard is null || snapshot.Draws is null || snapshot.Draws.Any(d => d.Winners is null)) throw new JsonException();
                bool Match(string code) => all || codes.Contains(code);
                if (!snapshot.Leaderboard.Any(p => Match(p.Code)) && !snapshot.Draws.Any(d => d.Winners.Any(p => Match(p.Code)))) continue;
                var ranks = snapshot.Leaderboard.Where(p => !(delete && Match(p.Code)))
                    .Select(p => Match(p.Code) ? p with { FullName = "Ẩn danh", Phone = "***" } : p).Select((p, i) => p with { Rank = i + 1 }).ToList();
                var winners = snapshot.Draws.Select(d => d with { Winners = d.Winners.Select(p => Match(p.Code) ? p with { FullName = "Ẩn danh", Phone = "***" } : p).ToList() }).ToList();
                publication.SnapshotJson = JsonSerializer.Serialize(snapshot with { Leaderboard = ranks, Draws = winners }, WebJson);
                publication.Revision++; results++;
            }
            var auditProtector = protection.CreateProtector(ContestAuditService.Purpose);
            foreach (var record in await db.ContestAccessAudits.ToListAsync(ct))
            {
                if (!all)
                {
                    try
                    {
                        string json = auditProtector.Unprotect(record.ProtectedFilters);
                        if (!ContainsSelector(json, codes, phones, names)) continue;
                    }
                    catch (Exception e) when (e is CryptographicException or JsonException)
                    {
                        // Retain who/when/action, but do not retain an unreadable filter that may contain erased PII.
                    }
                }
                record.ProtectedFilters = auditProtector.Protect("{\"redactedForPrivacy\":true}"); audits++;
            }
        }
        catch (JsonException) { throw new PrivacyException("PRIVACY_SNAPSHOT_INVALID", "Có bản chụp không hợp lệ; chưa xóa dữ liệu. Cần kiểm tra trước khi tiếp tục."); }
        // draw_winner is deliberately untouched: award-document retention explicitly requested by the owner.
        return (draws, results, audits);
    }

    private static string NormalizePhone(string value)
    {
        string digits = Regex.Replace(value, "[^0-9]", "");
        return digits.Length == 11 && digits.StartsWith("84", StringComparison.Ordinal) ? "0" + digits[2..] : digits;
    }
    private static bool ContainsSelector(string json, HashSet<string> codes, HashSet<string> phones, HashSet<string> names)
    {
        using var document = JsonDocument.Parse(json);
        bool Match(JsonElement node) => node.ValueKind switch
        {
            JsonValueKind.String => codes.Any(code => node.GetString()!.Contains(code, StringComparison.OrdinalIgnoreCase))
                || phones.Contains(NormalizePhone(node.GetString()!)) || names.Any(name => node.GetString()!.Length >= 3 && name.Contains(node.GetString()!.Normalize(NormalizationForm.FormC), StringComparison.OrdinalIgnoreCase)),
            JsonValueKind.Array => node.EnumerateArray().Any(Match),
            JsonValueKind.Object => node.EnumerateObject().Any(p => Match(p.Value)),
            _ => false,
        };
        return Match(document.RootElement);
    }

    public async Task<PrivacyResult> VacuumAsync(Guid id, Guid actor, bool retry, CancellationToken ct)
    {
        Require(actor != Guid.Empty, "UNAUTHORIZED", "Vui lòng đăng nhập backoffice.", 401);
        var operation = await db.PrivacyOperations.SingleOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new PrivacyException("PRIVACY_OPERATION_NOT_FOUND", "Không tìm thấy thao tác xóa.", 404);
        if (operation.VacuumCompleted) return Map(operation);
        if (retry) await audit.RecordAsync(actor, "privacy.vacuum", new { OperationId = id, Records = 0 }, null, ct);
        try
        {
            var cleaner = fileCleanup ?? new SqlitePrivacyFileCleanup();
            await cleaner.RunAsync(db.Database.GetConnectionString()!, true, ct);
            operation.VacuumCompleted = true; operation.VacuumCompletedAt = Now; operation.CleanupErrorCode = null;
            await db.SaveChangesAsync(ct);
            await cleaner.RunAsync(db.Database.GetConnectionString()!, false, ct);
        }
        catch (Exception e) when (e is SqliteException or IOException or OperationCanceledException)
        {
            operation.VacuumCompleted = false; operation.VacuumCompletedAt = null; operation.CleanupErrorCode = "VACUUM_PENDING";
            await db.SaveChangesAsync(CancellationToken.None);
        }
        return Map(operation);
    }
    public async Task<PrivacyHistory> HistoryAsync(int page, CancellationToken ct, int pageSize = 50)
    {
        int size = Math.Clamp(pageSize, 1, 100);
        int total = await db.PrivacyOperations.CountAsync(ct), pages = Math.Max(1, (int)Math.Ceiling(total / (double)size));
        page = Math.Clamp(page, 1, pages);
        var rows = await db.PrivacyOperations.AsNoTracking().OrderByDescending(o => o.OccurredAt).ThenByDescending(o => o.Id)
            .Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new(total, page, pages, rows.Select(Map).ToList(), size);
    }
    private static PrivacyResult Map(PrivacyOperation o) => new(o.Id, o.ActorUserKey, DateTime.SpecifyKind(o.OccurredAt, DateTimeKind.Utc), o.Scope, o.Action,
        JsonSerializer.Deserialize<PrivacyCounts>(o.CountsJson)!, o.VacuumCompleted, o.VacuumCompletedAt, o.CleanupErrorCode);
}
