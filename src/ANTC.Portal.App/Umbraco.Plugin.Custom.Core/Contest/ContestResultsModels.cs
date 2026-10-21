namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed record ResultContest(long Id, string Name, DateTime StartAt, DateTime EndAt, DateTime SubmitUntil);
public sealed record PublicRank(int Rank, string Code, string FullName, string Phone, int Score, int Answered, DateTime SubmittedAt);
public sealed record PublicWinner(int Rank, string Code, string FullName, string Phone, int Score);
public sealed record PublicDraw(long DrawId, DateTime DrawnAt, IReadOnlyList<PublicWinner> Winners);
public sealed record ResultSnapshot(ResultContest Contest, IReadOnlyList<PublicRank> Leaderboard, IReadOnlyList<PublicDraw> Draws);
public sealed record PublicLeaderboard(int Total, int Page, int PageSize, int TotalPages, IReadOnlyList<PublicRank> Items);
public sealed record ContestResultsResponse(ResultContest Contest, string Status, DateTime? PublishedAt, long Version,
    PublicLeaderboard Leaderboard, IReadOnlyList<PublicDraw> Draws);
public sealed record ResultsPublicationRequest(bool? IsPublished, IReadOnlyList<long>? DrawIds, long? ExpectedRevision);
public sealed record ResultsPublicationState(long ContestId, bool IsPublished, long Revision, DateTime? PublishedAt, IReadOnlyList<long> DrawIds);
public sealed class ContestResultsException(string code, string message, int status = 409) : Exception(message)
{
    public string Code { get; } = code;
    public int Status { get; } = status;
}
