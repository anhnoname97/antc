using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed record CurrentContest(
    long Id, string Name, string? Description, DateTime StartAt, DateTime EndAt,
    int MaxAttempts, int QuestionCount, IReadOnlyList<string> Topics);

public interface ICurrentContestService
{
    Task<CurrentContest?> GetAsync(CancellationToken cancellationToken = default);
}

/// <summary>Public presentation data, read directly from the application database.</summary>
public sealed class CurrentContestService(AppDbContext db, TimeProvider clock) : ICurrentContestService
{
    public async Task<CurrentContest?> GetAsync(CancellationToken cancellationToken = default)
    {
        DateTime now = clock.GetUtcNow().UtcDateTime;
        // When schedules overlap, the most recently started contest wins deterministically.
        ContestCampaign? campaign = await db.ContestCampaigns.AsNoTracking()
            .Where(x => x.IsActive && x.StartAt <= now && x.EndAt >= now)
            .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
            .Include(x => x.Topics)
            .Include(x => x.Questions)
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);
        if (campaign is null) return null;
        return new CurrentContest(campaign.Id, campaign.Name, campaign.Description,
            campaign.StartAt, campaign.EndAt, campaign.MaxAttempts, campaign.Questions.Count,
            campaign.Topics.OrderBy(x => x.SortOrder).ThenBy(x => x.TopicId)
                .Select(x => x.Title).ToList());
    }
}
