namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed record CurrentContest(
    long Id, string Name, string? Description, DateTime StartAt, DateTime EndAt,
    int MaxAttempts, int QuestionCount, IReadOnlyList<string> Topics);

public interface ICurrentContestService
{
    Task<CurrentContest?> GetAsync(CancellationToken cancellationToken = default);
}

/// <summary>Giu interface cho hai view toi S1; doc qua <see cref="IContestCatalog"/>.</summary>
public sealed class CurrentContestService(IContestCatalog catalog) : ICurrentContestService
{
    public async Task<CurrentContest?> GetAsync(CancellationToken cancellationToken = default)
    {
        ContestInfo? contest = await catalog.GetCurrentAsync(cancellationToken);
        if (contest is null) return null;
        return new CurrentContest(contest.Id, contest.Name, contest.Description, contest.StartAt, contest.EndAt,
            contest.MaxAttempts, contest.QuestionCount, contest.Topics.Select(x => x.Title).ToList());
    }
}
