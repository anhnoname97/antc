using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed record ContestScheduleItem(long Id, string Name, DateTime StartAt, DateTime EndAt, string State, bool Far = false);

/// <summary>
/// Public calendar of every enabled campaign. The <see cref="VisibleCount"/> contests nearest the current or next one are the
/// default view; the rest are flagged <c>Far</c> so the page can scroll to them (or hide them on narrow screens).
/// </summary>
public sealed class ContestScheduleService(AppDbContext db, TimeProvider clock)
{
    public const int VisibleCount = 10;

    public async Task<IReadOnlyList<ContestScheduleItem>> GetAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var campaigns = await db.ContestCampaigns.AsNoTracking().Where(x => x.IsActive)
            .OrderBy(x => x.StartAt).ThenBy(x => x.Id)
            .Select(x => new { x.Id, x.Name, x.StartAt, x.EndAt })
            .ToListAsync(cancellationToken);
        var anchor = campaigns.FindLastIndex(x => x.StartAt <= now && x.EndAt > now);
        if (anchor < 0) anchor = campaigns.FindIndex(x => x.StartAt > now);
        if (anchor < 0) anchor = campaigns.Count;
        var offset = Math.Max(0, Math.Min(anchor - 3, campaigns.Count - VisibleCount));
        return campaigns.Select((x, index) => new ContestScheduleItem(
            x.Id, x.Name, x.StartAt, x.EndAt,
            x.EndAt <= now ? "past" : x.StartAt > now ? "soon" : "now",
            index < offset || index >= offset + VisibleCount)).ToList();
    }
}
