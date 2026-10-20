using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed record ContestScheduleItem(long Id, string Name, DateTime StartAt, DateTime EndAt, string State);

/// <summary>Public calendar of enabled campaigns, centred on the current or next contest.</summary>
public sealed class ContestScheduleService(AppDbContext db, TimeProvider clock)
{
    public async Task<IReadOnlyList<ContestScheduleItem>> GetAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var campaigns = await db.ContestCampaigns.AsNoTracking().Where(x => x.IsActive)
            .OrderBy(x => x.StartAt).ThenBy(x => x.Id)
            .Select(x => new { x.Id, x.Name, x.StartAt, x.EndAt })
            .ToListAsync(cancellationToken);
        var anchor = campaigns.FindLastIndex(x => x.StartAt <= now && x.EndAt >= now);
        if (anchor < 0) anchor = campaigns.FindIndex(x => x.StartAt > now);
        if (anchor < 0) anchor = campaigns.Count;
        var offset = Math.Max(0, Math.Min(anchor - 2, campaigns.Count - 8));
        return campaigns.Skip(offset).Take(8).Select(x => new ContestScheduleItem(
            x.Id, x.Name, x.StartAt, x.EndAt,
            x.EndAt < now ? "past" : x.StartAt > now ? "soon" : "now")).ToList();
    }
}
