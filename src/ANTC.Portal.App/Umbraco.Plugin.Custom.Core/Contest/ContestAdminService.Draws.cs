using System.Data;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed partial class ContestAdminService
{
    private static readonly Regex DrawPhone = new("\\A0[0-9]{9}\\z", RegexOptions.Compiled);

    private async Task<List<DrawCandidateSnapshot>> DrawCandidatesAsync(long contestId, bool excludePrevious, CancellationToken ct)
    {
        if (!await db.ContestCampaigns.AnyAsync(x => x.Id == contestId, ct))
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["contestId"] = "Cuộc thi không tồn tại." });
        // Co y tinh ca nguoi da bi huy: so dien thoai cua ho van bi loai de khong quay vao lai duoc.
        var previous = excludePrevious
            ? (await db.DrawWinners.AsNoTracking().Where(w => w.Draw!.ContestId == contestId).Select(w => w.Phone).Distinct().ToListAsync(ct)).ToHashSet(StringComparer.Ordinal)
            : new HashSet<string>(StringComparer.Ordinal);
        var entries = await db.Entries.AsNoTracking()
            .Where(e => e.ContestId == contestId && e.Status == EntryStatuses.Submitted && e.Phone != null && e.Score != null)
            .Select(e => new DrawCandidateSnapshot(e.Id, e.Code, e.FullName ?? "", e.Phone!, e.Score!.Value, e.SubmittedAt)).ToListAsync(ct);
        return entries.Where(e => DrawPhone.IsMatch(e.Phone) && !previous.Contains(e.Phone))
            .GroupBy(e => e.Phone, StringComparer.Ordinal)
            .Select(g => g.OrderByDescending(e => e.Score).ThenBy(e => e.SubmittedAt ?? DateTime.MaxValue).ThenBy(e => e.EntryId).First())
            .OrderBy(e => e.Phone, StringComparer.Ordinal)
            .Select(e => e with { SubmittedAt = e.SubmittedAt is { } at ? AsUtc(at) : null }).ToList();
    }

    /// <summary>Nguoi du dieu kien (da gop theo so dien thoai) co diem >= minScore; dung chung quy tac chon nguoi voi quay so.</summary>
    public async Task<IReadOnlyList<DrawCandidateSnapshot>> EligibleCandidatesAsync(long contestId, int minScore, bool excludePrevious, CancellationToken ct) =>
        (await DrawCandidatesAsync(contestId, excludePrevious, ct)).Where(e => e.Score >= minScore).ToList();

    public async Task<DrawPreviewDto> PreviewDrawAsync(PreviewDrawRequest request, CancellationToken ct)
    {
        if (request.ContestId <= 0 || request.MinScore < 0)
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["minScore"] = "Chọn cuộc thi hợp lệ và ngưỡng điểm không âm." });
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        ContestPrizeDto? prize = null;
        if (request.PrizeId is not null) prize = await RequirePrizeAsync(request.ContestId, request.PrizeId, ct);
        var candidates = await DrawCandidatesAsync(request.ContestId, request.ExcludePrevious, ct);
        int suggestion = candidates.Count == 0 ? 0 : candidates.Max(e => e.Score);
        int minimum = request.MinScore ?? suggestion;
        var eligible = candidates.Where(e => e.Score >= minimum).OrderByDescending(e => e.Score)
            .ThenBy(e => e.SubmittedAt ?? DateTime.MaxValue).ThenBy(e => e.EntryId).ToList();
        (int page, int size) = NormalizePaging(request.Page, request.PageSize);
        page = Math.Min(page, Math.Max(1, (int)Math.Ceiling(eligible.Count / (double)size)));
        var rows = eligible.Skip((page - 1) * size).Take(size)
            .Select(e => new DrawCandidateAdminDto(e.Code, e.FullName, e.Phone, e.Score, e.SubmittedAt)).ToList();
        return new(suggestion, minimum, eligible.Count, candidates.Count,
            candidates.GroupBy(e => e.Score).OrderByDescending(g => g.Key).Select(g => new DrawScoreCount(g.Key, g.Count())).ToList(),
            new PagedResult<DrawCandidateAdminDto>(rows, page, size, eligible.Count, (int)Math.Ceiling(eligible.Count / (double)size)), prize);
    }

    public async Task<DrawAdminDto> CreateDrawAsync(SaveDrawRequest request, string actor, CancellationToken ct)
    {
        Validate(request);
        if (request.RequestId == Guid.Empty)
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["requestId"] = "Mã yêu cầu không hợp lệ." });
        // Serialize candidate selection, previous-winner exclusion and snapshots across concurrent draws.
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        if (request.RequestId is { } requestId)
        {
            var previous = await db.Draws.AsNoTracking().Include(d => d.Winners).Include(d => d.Contest)
                .SingleOrDefaultAsync(d => d.RequestId == requestId, ct);
            if (previous is not null)
            {
                if (previous.ContestId != request.ContestId || previous.MinScore != request.MinScore || previous.WinnersRequested != request.WinnersRequested
                    || previous.ExcludePrevious != request.ExcludePrevious || previous.Note != NullIfEmpty(request.Note) || previous.CreatedBy != NormalizeActor(actor) || previous.PrizeId != request.PrizeId)
                    throw new ContestAdminConflictException("DRAW_REQUEST_CHANGED", "Mã yêu cầu đã được dùng cho một lần quay khác. Hãy tải lại lịch sử.");
                return MapDraw(previous);
            }
        }
        var prize = await RequirePrizeAsync(request.ContestId!.Value, request.PrizeId, ct);
        if (request.WinnersRequested > prize.Remaining)
            throw new ContestAdminConflictException("PRIZE_QUOTA_EXCEEDED", $"Giải “{prize.Name}” chỉ còn {prize.Remaining}/{prize.Quantity} suất; không thể quay {request.WinnersRequested} người.");
        var candidates = (await DrawCandidatesAsync(request.ContestId!.Value, request.ExcludePrevious, ct))
            .Where(e => e.Score >= request.MinScore).ToList();
        if (request.WinnersRequested > candidates.Count)
            throw new ContestAdminConflictException("DRAW_INSUFFICIENT_CANDIDATES",
                $"Yêu cầu {request.WinnersRequested} người trúng nhưng chỉ có {candidates.Count} người đủ điều kiện. Hãy giảm số người trúng hoặc điều chỉnh ngưỡng điểm.");
        var draw = new Draw
        {
            ContestId = request.ContestId, CreatedAt = UtcNow(), CreatedBy = NormalizeActor(actor),
            MinScore = request.MinScore, WinnersRequested = request.WinnersRequested, EligibleCount = candidates.Count,
            ExcludePrevious = request.ExcludePrevious, Note = NullIfEmpty(request.Note), RequestId = request.RequestId,
            EligibleSnapshotJson = JsonSerializer.Serialize(candidates),
            PrizeId = prize.PrizeId, PrizeCode = prize.Code, PrizeName = prize.Name,
        };
        foreach (var person in CryptographicLottery.Select(candidates, request.WinnersRequested))
            draw.Winners.Add(new DrawWinner { Rank = draw.Winners.Count + 1, EntryId = person.EntryId, Code = person.Code,
                FullName = person.FullName, Phone = person.Phone, Score = person.Score });
        db.Draws.Add(draw);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return (await GetDrawAsync(draw.Id, ct))!;
    }

    private async Task<ContestPrizeDto> RequirePrizeAsync(long contestId, long? prizeId, CancellationToken ct)
    {
        if (prizeId is null or <= 0)
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["prizeId"] = "Phải chọn giải thưởng đã được cấu hình cho cuộc thi." });
        var prize = (await ContestPrizesAsync(contestId, ct)).SingleOrDefault(p => p.PrizeId == prizeId);
        if (prize is null) throw new ContestAdminConflictException("PRIZE_NOT_IN_CONTEST", "Giải thưởng không được cấu hình cho cuộc thi này.");
        if (!prize.IsActive) throw new ContestAdminConflictException("PRIZE_INACTIVE", "Giải thưởng đã ngừng sử dụng.");
        return prize;
    }

    public async Task<IReadOnlyList<DrawWinnerExportRow>?> ExportDrawWinnersAsync(long id, CancellationToken ct)
    {
        var draw = await db.Draws.AsNoTracking().Include(d => d.Winners).SingleOrDefaultAsync(d => d.Id == id, ct);
        if (draw is null) return null;
        var submitted = draw.EligibleSnapshotJson is null ? new Dictionary<long, DateTime?>()
            : (JsonSerializer.Deserialize<List<DrawCandidateSnapshot>>(draw.EligibleSnapshotJson) ?? [])
                .ToDictionary(p => p.EntryId, p => p.SubmittedAt);
        return draw.Winners.OrderBy(w => w.Rank)
            .Select(w => new DrawWinnerExportRow(w.Code, w.FullName, w.Phone, w.Score,
                w.EntryId is { } entryId ? submitted.GetValueOrDefault(entryId) : null,
                w.CancelledAt is { } at ? AsUtc(at) : null, w.CancelReasonText)).ToList();
    }

    public async Task<IReadOnlyList<DrawCandidateSnapshot>?> ExportDrawAsync(long id, bool winners, CancellationToken ct)
    {
        var draw = await db.Draws.AsNoTracking().Include(d => d.Winners).SingleOrDefaultAsync(d => d.Id == id, ct);
        if (draw is null) return null;
        if (winners)
        {
            var submitted = draw.EligibleSnapshotJson is null ? new Dictionary<long, DateTime?>()
                : (JsonSerializer.Deserialize<List<DrawCandidateSnapshot>>(draw.EligibleSnapshotJson) ?? [])
                    .ToDictionary(p => p.EntryId, p => p.SubmittedAt);
            return draw.Winners.OrderBy(w => w.Rank)
                .Select(w => new DrawCandidateSnapshot(w.EntryId ?? 0, w.Code, w.FullName, w.Phone, w.Score,
                    w.EntryId is { } entryId ? submitted.GetValueOrDefault(entryId) : null)).ToList();
        }
        if (draw.EligibleSnapshotJson is null)
            throw new ContestAdminConflictException("DRAW_SNAPSHOT_UNAVAILABLE", "Lần quay cũ chưa lưu danh sách đủ điều kiện; không thể dựng lại chính xác từ dữ liệu hiện tại.");
        return JsonSerializer.Deserialize<List<DrawCandidateSnapshot>>(draw.EligibleSnapshotJson)
            ?? throw new InvalidOperationException("DRAW_SNAPSHOT_INVALID");
    }
}
