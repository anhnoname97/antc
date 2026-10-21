using System.Data;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed partial class ContestAdminService
{
    private static readonly Regex DrawPhone = new("\\A0[0-9]{9}\\z", RegexOptions.Compiled);

    private async Task<List<DrawCandidateSnapshot>> DrawCandidatesAsync(long contestId, bool excludePrevious, CancellationToken ct)
    {
        if (!await db.ContestCampaigns.AnyAsync(x => x.Id == contestId, ct))
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["contestId"] = "Cuộc thi không tồn tại." });
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

    public async Task<DrawPreviewDto> PreviewDrawAsync(PreviewDrawRequest request, CancellationToken ct)
    {
        if (request.ContestId <= 0 || request.MinScore < 0)
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["minScore"] = "Chọn cuộc thi hợp lệ và ngưỡng điểm không âm." });
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var candidates = await DrawCandidatesAsync(request.ContestId, request.ExcludePrevious, ct);
        int suggestion = candidates.Count == 0 ? 0 : candidates.Max(e => e.Score);
        int minimum = request.MinScore ?? suggestion;
        return new(suggestion, minimum, candidates.Count(e => e.Score >= minimum), candidates.Count,
            candidates.GroupBy(e => e.Score).OrderByDescending(g => g.Key).Select(g => new DrawScoreCount(g.Key, g.Count())).ToList());
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
                    || previous.ExcludePrevious != request.ExcludePrevious || previous.Note != NullIfEmpty(request.Note) || previous.CreatedBy != NormalizeActor(actor))
                    throw new ContestAdminConflictException("DRAW_REQUEST_CHANGED", "Mã yêu cầu đã được dùng cho một lần quay khác. Hãy tải lại lịch sử.");
                return MapDraw(previous);
            }
        }
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
        };
        foreach (var person in CryptographicLottery.Select(candidates, request.WinnersRequested))
            draw.Winners.Add(new DrawWinner { Rank = draw.Winners.Count + 1, EntryId = person.EntryId, Code = person.Code,
                FullName = person.FullName, Phone = person.Phone, Score = person.Score });
        db.Draws.Add(draw);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return (await GetDrawAsync(draw.Id, ct))!;
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
