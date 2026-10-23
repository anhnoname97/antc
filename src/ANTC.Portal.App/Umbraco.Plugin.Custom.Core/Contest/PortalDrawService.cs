using System.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

/// <summary>
/// Quay so tren portal cho thanh vien Ban to chuc. Khong co thuat toan rieng: chon nguoi, kiem tra suat giai
/// va ghi ket qua deu do IContestAdminService thuc hien. Moi ket qua tra ra deu da che ten va so dien thoai.
/// </summary>
public sealed class PortalDrawService(AppDbContext db, IContestAdminService admin, ContestAuditService audit, TimeProvider timeProvider)
{
    private const string SpinNote = "Quay trên portal";

    public async Task<IReadOnlyList<PortalDrawContestSummary>> ListFinishedAsync(CancellationToken ct)
    {
        DateTime now = timeProvider.GetUtcNow().UtcDateTime;
        // Vai cuoc thi, loc o bo nho de khong phu thuoc cach SQLite dich cong gio.
        var contests = (await db.ContestCampaigns.AsNoTracking().ToListAsync(ct)).Where(c => IsFinished(c, now))
            .OrderByDescending(c => c.EndAt).ThenByDescending(c => c.Id).ToList();
        long[] ids = contests.Select(c => c.Id).ToArray();
        Dictionary<long, int> submitted = await db.Entries.AsNoTracking()
            .Where(e => e.ContestId != null && ids.Contains(e.ContestId.Value) && e.Status == EntryStatuses.Submitted)
            .GroupBy(e => e.ContestId!.Value).Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
        var result = new List<PortalDrawContestSummary>();
        foreach (ContestCampaign c in contests)
        {
            var prizes = await admin.ContestPrizesAsync(c.Id, ct);
            int quantity = prizes.Sum(p => p.Quantity), awarded = prizes.Sum(p => p.Awarded);
            result.Add(new(c.Id, c.Name, Utc(c.StartAt), Utc(c.EndAt), submitted.GetValueOrDefault(c.Id), quantity, awarded, StatusOf(quantity, awarded)));
        }
        return result;
    }

    public async Task<PortalDrawDetail> GetAsync(long contestId, int? minScore, CancellationToken ct)
    {
        ContestCampaign contest = await RequireFinishedAsync(contestId, ct);
        var prizes = await admin.ContestPrizesAsync(contestId, ct);
        // Nguong goi y tinh tren toan bo nguoi du thi (khong loai nguoi da trung) de khong tut sau moi luot quay.
        var everyone = await admin.EligibleCandidatesAsync(contestId, 0, false, ct);
        int suggested = everyone.Count == 0 ? 0 : everyone.Max(e => e.Score);
        int applied = minScore ?? suggested;
        var qualified = everyone.Where(e => e.Score >= applied).ToList();
        int remaining = (await admin.EligibleCandidatesAsync(contestId, applied, true, ct)).Count;
        var topics = await db.ContestTopics.AsNoTracking().Where(t => t.ContestId == contestId)
            .OrderBy(t => t.SortOrder).Select(t => t.Title).ToListAsync(ct);
        return new(new(contest.Id, contest.Name, Utc(contest.StartAt), Utc(contest.EndAt), topics),
            prizes.Select(MapPrize).ToList(), suggested, applied, everyone.Count, qualified.Count, remaining,
            ListHash(qualified.Select(e => e.Code)), await WinnersAsync(contestId, ct), await ReadDisplayAsync(contestId, ct));
    }

    /// <summary>Tuy chon hien thi cua cuoc thi; chua luu thi tra mac dinh (true, true, false).</summary>
    public async Task<PortalDrawDisplay> GetDisplayAsync(long contestId, CancellationToken ct)
    {
        await RequireFinishedAsync(contestId, ct);
        return await ReadDisplayAsync(contestId, ct);
    }

    public async Task<PortalDrawDisplay> SaveDisplayAsync(long contestId, PortalDrawDisplay value, string memberUserName, CancellationToken ct)
    {
        await RequireFinishedAsync(contestId, ct);
        ContestDrawDisplay? row = await db.ContestDrawDisplays.SingleOrDefaultAsync(d => d.ContestId == contestId, ct);
        if (row is null) db.ContestDrawDisplays.Add(row = new ContestDrawDisplay { ContestId = contestId });
        row.ShowLiveBadge = value.ShowLiveBadge;
        row.ShowAntiScamTicker = value.ShowAntiScamTicker;
        row.TransparentBackground = value.TransparentBackground;
        row.UpdatedAt = timeProvider.GetUtcNow().UtcDateTime;
        row.UpdatedBy = memberUserName;
        await db.SaveChangesAsync(ct);
        return new(row.ShowLiveBadge, row.ShowAntiScamTicker, row.TransparentBackground);
    }

    private async Task<PortalDrawDisplay> ReadDisplayAsync(long contestId, CancellationToken ct)
    {
        ContestDrawDisplay? row = await db.ContestDrawDisplays.AsNoTracking().SingleOrDefaultAsync(d => d.ContestId == contestId, ct);
        return row is null ? new(true, true, false) : new(row.ShowLiveBadge, row.ShowAntiScamTicker, row.TransparentBackground);
    }

    public async Task<PortalDrawSpinResult> SpinAsync(long contestId, long prizeId, int minScore, Guid requestId, string actor, CancellationToken ct)
    {
        await RequireFinishedAsync(contestId, ct);
        DrawAdminDto draw = await admin.CreateDrawAsync(
            new SaveDrawRequest(minScore, 1, ExcludePrevious: true, Note: SpinNote, ContestId: contestId, RequestId: requestId, PrizeId: prizeId), actor, ct);
        var prize = (await admin.ContestPrizesAsync(contestId, ct)).Single(p => p.PrizeId == prizeId);
        DrawWinnerAdminDto winner = draw.Winners.Single();
        int remaining = (await admin.EligibleCandidatesAsync(contestId, minScore, true, ct)).Count;
        return new(draw.Id, draw.CreatedAt, MapPrize(prize),
            new(winner.Code, ContestResultsService.MaskName(winner.FullName), ContestResultsService.MaskPhone(winner.Phone), winner.Score), remaining);
    }

    /// <summary>Huy mot ket qua trung co ly do: tra suat giai, ghi audit cung transaction. Nguoi bi huy van bi loai khoi cac lan quay sau.</summary>
    public async Task<PortalDrawCancelResult> CancelWinnerAsync(long contestId, long drawId, int rank, string? reasonCode, string? reasonText,
        string memberUserName, Guid memberKey, CancellationToken ct)
    {
        string text = (reasonText ?? "").Trim();
        var fields = new Dictionary<string, string>();
        if (!PortalDrawCancelReasons.IsValid(reasonCode)) fields["reasonCode"] = "Lý do hủy không hợp lệ.";
        else if (reasonCode == PortalDrawCancelReasons.Other && text.Length == 0) fields["reasonText"] = "Phải ghi lý do khi chọn Lý do khác.";
        if (text.Length > 500) fields["reasonText"] = "Lý do không được dài quá 500 ký tự.";
        if (fields.Count > 0) throw new ContestAdminValidationException(fields);

        await RequireFinishedAsync(contestId, ct);
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        DrawWinner winner = await db.DrawWinners.Include(w => w.Draw).SingleOrDefaultAsync(w => w.DrawId == drawId && w.Rank == rank, ct)
            ?? throw new PortalDrawWinnerNotFoundException();
        if (winner.Draw!.ContestId != contestId) throw new PortalDrawWinnerNotFoundException();
        if (winner.CancelledAt != null) throw new ContestAdminConflictException("WINNER_ALREADY_CANCELLED", "Kết quả này đã bị hủy trước đó.");
        winner.CancelledAt = timeProvider.GetUtcNow().UtcDateTime;
        winner.CancelledBy = memberUserName;
        winner.CancelReasonCode = reasonCode;
        winner.CancelReasonText = PortalDrawCancelReasons.Labels.TryGetValue(reasonCode!, out string? label) ? label : text;
        await audit.RecordAsync(memberKey, "draw.cancel", new { ContestId = contestId, DrawId = drawId, Rank = rank, ReasonCode = reasonCode }, winner.Code, ct);
        await transaction.CommitAsync(ct);

        PortalDrawPrize? prize = null;
        if (winner.Draw.PrizeId is { } prizeId)
            prize = (await admin.ContestPrizesAsync(contestId, ct)).Where(p => p.PrizeId == prizeId).Select(MapPrize).SingleOrDefault();
        return new(MapWinner(winner, winner.Draw.CreatedAt, winner.Draw.PrizeId, winner.Draw.PrizeCode, winner.Draw.PrizeName), prize);
    }

    /// <summary>Ma hash cua danh sach ma du thi: sap xep ordinal, noi bang xuong dong, SHA-256 dang hex.</summary>
    public static string ListHash(IEnumerable<string> codes)
    {
        string[] sorted = codes.ToArray();
        Array.Sort(sorted, StringComparer.Ordinal);
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(string.Join('\n', sorted))));
    }

    private async Task<List<PortalDrawWinner>> WinnersAsync(long contestId, CancellationToken ct)
    {
        var rows = await db.DrawWinners.AsNoTracking().Include(w => w.Draw).Where(w => w.Draw!.ContestId == contestId).ToListAsync(ct);
        return rows.OrderBy(w => w.Draw!.CreatedAt).ThenBy(w => w.DrawId).ThenBy(w => w.Rank)
            .Select(w => MapWinner(w, w.Draw!.CreatedAt, w.Draw.PrizeId, w.Draw.PrizeCode, w.Draw.PrizeName)).ToList();
    }

    // Luon che ten va so dien thoai; nguoi bi huy van nam trong danh sach.
    private static PortalDrawWinner MapWinner(DrawWinner w, DateTime createdAt, long? prizeId, string? prizeCode, string? prizeName) =>
        new(w.DrawId, Utc(createdAt), prizeId, prizeCode, prizeName, w.Code,
            ContestResultsService.MaskName(w.FullName), ContestResultsService.MaskPhone(w.Phone), w.Score,
            w.Rank, w.CancelledAt != null, w.CancelledAt is { } at ? Utc(at) : null, w.CancelledBy, w.CancelReasonText);

    private async Task<ContestCampaign> RequireFinishedAsync(long contestId, CancellationToken ct)
    {
        ContestCampaign contest = await db.ContestCampaigns.AsNoTracking().SingleOrDefaultAsync(c => c.Id == contestId, ct)
            ?? throw new PortalDrawContestNotFoundException();
        if (!IsFinished(contest, timeProvider.GetUtcNow().UtcDateTime))
            throw new ContestAdminConflictException("CONTEST_NOT_FINISHED", "Cuộc thi chưa kết thúc nên chưa thể quay số.");
        return contest;
    }

    // Bai van duoc nop trong thoi gian gia han nen chi coi la ket thuc sau EndAt + SubmitGraceHours.
    private static bool IsFinished(ContestCampaign c, DateTime utcNow) => c.EndAt.AddHours(c.SubmitGraceHours) <= utcNow;

    private static string StatusOf(int quantity, int awarded) =>
        quantity == 0 ? PortalDrawStatuses.NoPrize : awarded == 0 ? PortalDrawStatuses.NotDrawn
        : awarded >= quantity ? PortalDrawStatuses.Completed : PortalDrawStatuses.InProgress;

    private static PortalDrawPrize MapPrize(ContestPrizeDto p) => new(p.PrizeId, p.Code, p.Name, p.Quantity, p.Awarded, p.Remaining, p.IsActive, p.SortOrder);

    private static DateTime Utc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
