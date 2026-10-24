using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed record ContestQuestionTreeItemDto(
    string Code,
    string Question,
    int SortOrder,
    bool IsActive,
    bool IsSelected);

public sealed record ContestTopicTreeItemDto(
    int Id,
    string Title,
    int SortOrder,
    bool IsActive,
    bool IsSelected,
    IReadOnlyList<ContestQuestionTreeItemDto> Questions);

public sealed record ContestCampaignAdminDto(
    long Id,
    string Name,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int MaxAttempts,
    bool IsActive,
    int TopicCount,
    int QuestionCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<ContestTopicTreeItemDto>? Topics = null,
    int SubmitGraceHours = 24,
    decimal ReadTimerFactor = 1m,
    string? FocusArea = null,
    int EntryCount = 0,
    long Revision = 1,
    IReadOnlyList<ContestPrizeDto>? Prizes = null);

public sealed record SaveContestTopicRequest(int TopicId, IReadOnlyList<string>? QuestionCodes);

public sealed record SaveContestCampaignRequest(
    string? Name,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int MaxAttempts,
    bool IsActive,
    IReadOnlyList<SaveContestTopicRequest>? Topics,
    int SubmitGraceHours = 24,
    decimal ReadTimerFactor = 1m,
    string? FocusArea = null,
    long? ExpectedRevision = null,
    IReadOnlyList<SaveContestPrizeRequest>? Prizes = null);

public sealed record ContestEntryAdminDto(
    long Id,
    string Code,
    string Mode,
    string? FullName,
    string? Phone,
    string? Org,
    string Status,
    int Answered,
    int? Score,
    int? TotalQuestions,
    int? AttemptNo,
    DateTime CreatedAt,
    DateTime? SubmittedAt,
    long? ContestId = null,
    string? ContestName = null);

public sealed record DrawWinnerAdminDto(
    int Rank,
    long? EntryId,
    string Code,
    string FullName,
    string Phone,
    int Score,
    DateTime? CancelledAt = null,
    string? CancelledBy = null,
    string? CancelReasonCode = null,
    string? CancelReason = null);

public sealed record DrawAdminDto(
    long Id,
    DateTime CreatedAt,
    string CreatedBy,
    int MinScore,
    int WinnersRequested,
    int EligibleCount,
    bool ExcludePrevious,
    string? Note,
    IReadOnlyList<DrawWinnerAdminDto> Winners,
    long? ContestId = null,
    string? ContestName = null,
    bool HasEligibleSnapshot = false,
    bool EligibleSnapshotRedacted = false,
    long? PrizeId = null, string? PrizeCode = null, string? PrizeName = null);

public sealed record SaveDrawRequest(
    int MinScore,
    int WinnersRequested,
    bool ExcludePrevious = true,
    string? Note = null,
    long? ContestId = null,
    Guid? RequestId = null,
    long? PrizeId = null);

public sealed record PreviewDrawRequest(long ContestId, int? MinScore = null, bool ExcludePrevious = true, int Page = 1, int PageSize = 20, long? PrizeId = null);
public sealed record DrawScoreCount(int Score, int Count);
public sealed record DrawPreviewDto(int SuggestedMinScore, int MinScore, int EligibleCount, int TotalCandidates, IReadOnlyList<DrawScoreCount> Scores,
    PagedResult<DrawCandidateAdminDto>? Candidates = null,
    ContestPrizeDto? Prize = null);

public sealed record SavePrizeRequest(string? Code, string? Name, string? Description, bool IsActive = true, int SortOrder = 0, long? ExpectedRevision = null);
public sealed record PrizeAdminDto(long Id, string Code, string Name, string? Description, bool IsActive, int SortOrder, DateTime CreatedAt, DateTime UpdatedAt, long Revision, int ContestCount);
public sealed record SaveContestPrizeRequest(long PrizeId, int Quantity, long? PrizeMoney = null);
public sealed record SaveContestPrizesRequest(IReadOnlyList<SaveContestPrizeRequest>? Prizes, long? ExpectedRevision = null);
public sealed record ContestPrizeDto(long PrizeId, string Code, string Name, string? Description, int Quantity, int Awarded, int Remaining, bool IsActive, int SortOrder, long PrizeMoney = 0);
public sealed record DrawCandidateAdminDto(string Code, string FullName, string Phone, int Score, DateTime? SubmittedAt);
public sealed record DrawWinnerExportRow(string Code, string FullName, string Phone, int Score, DateTime? SubmittedAt, DateTime? CancelledAt, string? CancelReason);
public sealed record DrawCandidateSnapshot(long EntryId, string Code, string FullName, string Phone, int Score, DateTime? SubmittedAt);

public sealed class ContestAdminValidationException(IReadOnlyDictionary<string, string> fields)
    : Exception("Dữ liệu cuộc thi không hợp lệ.")
{
    public IReadOnlyDictionary<string, string> Fields { get; } = fields;
}

public sealed class ContestAdminConflictException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public sealed class ContestHasEntriesException(int entryCount)
    : Exception("Cuộc thi đã có lượt dự thi nên không thể xóa hoặc đổi bộ đề.")
{
    public int EntryCount { get; } = entryCount;
}

