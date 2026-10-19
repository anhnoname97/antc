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

/// <summary>Adapter dùng chung nguồn lịch và bộ đề với API cuộc thi.</summary>
public sealed class CurrentContestService(IContestCatalog catalog) : ICurrentContestService
{
    public CurrentContestService(AppDbContext db, TimeProvider clock)
        : this(new DirectCatalog(db, clock))
    {
    }

    public async Task<CurrentContest?> GetAsync(CancellationToken cancellationToken = default)
    {
        ContestInfo? contest = await catalog.GetCurrentAsync(cancellationToken);
        return contest is null ? null : new CurrentContest(
            contest.Id, contest.Name, contest.Description, contest.StartAt, contest.EndAt,
            contest.MaxAttempts, contest.QuestionCount, contest.Topics.Select(x => x.Title).ToList());
    }

    private sealed class DirectCatalog(AppDbContext db, TimeProvider clock) : IContestCatalog
    {
        public async Task<ContestInfo?> GetCurrentAsync(CancellationToken cancellationToken = default)
        {
            DateTime now = clock.GetUtcNow().UtcDateTime;
            ContestCampaign? campaign = await db.ContestCampaigns.AsNoTracking()
                .Include(x => x.Topics).Include(x => x.Questions).AsSplitQuery()
                .Where(x => x.IsActive && x.StartAt <= now && x.EndAt >= now)
                .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
            return campaign is null ? null : new ContestInfo(
                campaign.Id, campaign.Name, campaign.Description, campaign.StartAt, campaign.EndAt,
                campaign.MaxAttempts, campaign.SubmitGraceHours, campaign.ReadTimerFactor, campaign.FocusArea,
                campaign.Topics.OrderBy(x => x.SortOrder).ThenBy(x => x.TopicId)
                    .Select(x => new ContestExamTopic(x.TopicId.ToString(), x.TopicId, x.Title,
                        campaign.Questions.Count(q => q.TopicId == x.TopicId))).ToList(),
                campaign.Questions.OrderBy(x => x.SortOrder).Select(x => x.QuestionCode).ToList(),
                campaign.UpdatedAt);
        }

        public Task<ContestInfo?> GetAsync(long id, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
        public Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
