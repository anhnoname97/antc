using System.Data;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed partial class ContestAdminService
{
    public async Task<PagedResult<PrizeAdminDto>> SearchPrizesAsync(string? search, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        var query = db.Prizes.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search)) { string term = search.Trim().ToLower(); query = query.Where(p => p.Code.ToLower().Contains(term) || p.Name.ToLower().Contains(term)); }
        if (isActive is not null) query = query.Where(p => p.IsActive == isActive);
        int count = await query.CountAsync(ct);
        var items = await query.OrderBy(p => p.SortOrder).ThenBy(p => p.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new PrizeAdminDto(p.Id, p.Code, p.Name, p.Description, p.IsActive, p.SortOrder, p.CreatedAt, p.UpdatedAt, p.Revision, p.Contests.Count)).ToListAsync(ct);
        return Page(items, page, pageSize, count);
    }
    public async Task<PrizeAdminDto?> GetPrizeAsync(long id, CancellationToken ct) => await db.Prizes.AsNoTracking().Where(p => p.Id == id)
        .Select(p => new PrizeAdminDto(p.Id, p.Code, p.Name, p.Description, p.IsActive, p.SortOrder, p.CreatedAt, p.UpdatedAt, p.Revision, p.Contests.Count)).SingleOrDefaultAsync(ct);

    public async Task<PrizeAdminDto?> SavePrizeAsync(long? id, SavePrizeRequest request, CancellationToken ct)
    {
        string code = request.Code?.Trim().ToUpperInvariant() ?? "", name = request.Name?.Trim() ?? "";
        var fields = new Dictionary<string, string>();
        if (!Regex.IsMatch(code, @"\A[A-Z0-9][A-Z0-9_.-]{0,29}\z")) fields["code"] = "Mã giải gồm 1–30 chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.";
        if (name.Length is < 2 or > 150) fields["name"] = "Tên giải phải có 2–150 ký tự.";
        if (request.Description?.Trim().Length > 2000) fields["description"] = "Mô tả tối đa 2.000 ký tự.";
        if (request.SortOrder < 0) fields["sortOrder"] = "Thứ tự không được âm.";
        if (fields.Count > 0) throw new ContestAdminValidationException(fields);
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var prize = id is null ? new Prize { CreatedAt = UtcNow() } : await db.Prizes.SingleOrDefaultAsync(p => p.Id == id, ct);
        if (prize is null) return null;
        if (id is not null && request.ExpectedRevision is { } rev && rev != prize.Revision)
            throw new ContestAdminConflictException("PRIZE_CHANGED", "Giải thưởng đã được cập nhật. Hãy tải lại dữ liệu.");
        if (await db.Prizes.AnyAsync(p => p.Code == code && p.Id != (id ?? 0), ct))
            throw new ContestAdminConflictException("PRIZE_CODE_EXISTS", "Mã giải đã tồn tại.");
        prize.Code = code; prize.Name = name; prize.Description = NullIfEmpty(request.Description); prize.IsActive = request.IsActive; prize.SortOrder = request.SortOrder; prize.UpdatedAt = UtcNow();
        if (id is null) db.Prizes.Add(prize); else prize.Revision++;
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return await GetPrizeAsync(prize.Id, ct);
    }
    public async Task<bool> DeletePrizeAsync(long id, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var prize = await db.Prizes.SingleOrDefaultAsync(p => p.Id == id, ct); if (prize is null) return false;
        if (await db.ContestPrizes.AnyAsync(p => p.PrizeId == id, ct))
            throw new ContestAdminConflictException("PRIZE_IN_USE", "Giải đã gắn với cuộc thi, không thể xóa. Có thể chuyển sang ngừng sử dụng.");
        db.Prizes.Remove(prize); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct); return true;
    }
    public async Task<IReadOnlyList<ContestPrizeDto>> ContestPrizesAsync(long contestId, CancellationToken ct)
    {
        if (!await db.ContestCampaigns.AnyAsync(c => c.Id == contestId, ct))
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["contestId"] = "Cuộc thi không tồn tại." });
        var allocations = await db.ContestPrizes.AsNoTracking().Include(p => p.Prize).Where(p => p.ContestId == contestId).OrderBy(p => p.SortOrder).ThenBy(p => p.PrizeId).ToListAsync(ct);
        var counts = await AwardedAsync(contestId, ct);
        return allocations.Select(p => new ContestPrizeDto(p.PrizeId, p.Prize!.Code, p.Prize.Name, p.Prize.Description, p.Quantity,
            counts.GetValueOrDefault(p.PrizeId), Math.Max(0, p.Quantity - counts.GetValueOrDefault(p.PrizeId)), p.Prize.IsActive, p.SortOrder, p.PrizeMoney)).ToList();
    }
    private Task<Dictionary<long, int>> AwardedAsync(long contestId, CancellationToken ct) => db.DrawWinners
        .Where(w => w.Draw!.ContestId == contestId && w.Draw.PrizeId != null).GroupBy(w => w.Draw!.PrizeId!.Value)
        .Select(g => new { Id = g.Key, Count = g.Count() }).ToDictionaryAsync(g => g.Id, g => g.Count, ct);

    private async Task ApplyPrizesAsync(ContestCampaign campaign, IReadOnlyList<SaveContestPrizeRequest>? requests, CancellationToken ct)
    {
        if (requests is null) return; // Old clients may update other fields without clearing allocations.
        if (requests.Any(p => p.PrizeMoney is < 0 or > 9007199254740991L))
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["prizeMoney"] = "Tiền thưởng mỗi suất phải là số nguyên VNĐ từ 0 đến 9.007.199.254.740.991." });
        if (requests.Count > 100 || requests.Select(p => p.PrizeId).Distinct().Count() != requests.Count || requests.Any(p => p.PrizeId <= 0 || p.Quantity is < 1 or > 1000))
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["prizes"] = "Chọn tối đa 100 loại giải, không trùng; số lượng mỗi loại từ 1 đến 1.000." });
        var ids = requests.Select(p => p.PrizeId).ToArray();
        var prizes = await db.Prizes.Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
        if (prizes.Count != ids.Length || requests.Any(p => !prizes[p.PrizeId].IsActive && !campaign.Prizes.Any(a => a.PrizeId == p.PrizeId)))
            throw new ContestAdminValidationException(new Dictionary<string, string> { ["prizes"] = "Có giải không tồn tại hoặc đã ngừng sử dụng." });
        var counts = await AwardedAsync(campaign.Id, ct);
        var usedIds = await db.Draws.Where(d => d.ContestId == campaign.Id && d.PrizeId != null).Select(d => d.PrizeId!.Value).Distinct().ToListAsync(ct);
        if (usedIds.Any(id => !ids.Contains(id)) || requests.Any(p => p.Quantity < counts.GetValueOrDefault(p.PrizeId)))
            throw new ContestAdminConflictException("PRIZE_QUOTA_IN_USE", "Không được bỏ giải đã quay hoặc giảm số lượng thấp hơn số người đã trúng.");
        foreach (var removed in campaign.Prizes.Where(p => !ids.Contains(p.PrizeId)).ToList()) { db.ContestPrizes.Remove(removed); campaign.Prizes.Remove(removed); }
        for (int i = 0; i < requests.Count; i++)
        {
            var request = requests[i]; var allocation = campaign.Prizes.SingleOrDefault(p => p.PrizeId == request.PrizeId);
            if (allocation is null) { allocation = new ContestPrize { PrizeId = request.PrizeId }; campaign.Prizes.Add(allocation); }
            allocation.Quantity = request.Quantity; allocation.SortOrder = i;
            if (request.PrizeMoney is { } money) allocation.PrizeMoney = money;
        }
    }
    public async Task<ContestCampaignAdminDto?> SaveContestPrizesAsync(long id, SaveContestPrizesRequest request, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var campaign = await db.ContestCampaigns.Include(c => c.Prizes).SingleOrDefaultAsync(c => c.Id == id, ct);
        if (campaign is null) return null;
        if (request.ExpectedRevision is { } rev && rev != campaign.Revision)
            throw new ContestAdminConflictException("CONTEST_CHANGED", "Cuộc thi đã được cập nhật. Hãy tải lại dữ liệu.");
        await ApplyPrizesAsync(campaign, request.Prizes ?? [], ct);
        campaign.Revision++; campaign.UpdatedAt = UtcNow();
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return await GetCampaignAsync(id, ct);
    }
}
