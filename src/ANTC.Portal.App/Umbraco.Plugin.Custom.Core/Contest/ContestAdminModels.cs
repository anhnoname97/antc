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
    long Revision = 1);

public sealed record SaveContestTopicRequest(int TopicId, IReadOnlyList<string>? QuestionCodes);

public sealed record SaveContestCampaignRequest(
    string? Name,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int MaxAttempts,
    bool IsActive,
    IReadOnlyList<SaveContestTopicRequest>? Topics,
    long? ExpectedRevision = null);

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
    int Score);

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
    string? ContestName = null);

public sealed record SaveDrawRequest(
    int MinScore,
    int WinnersRequested,
    bool ExcludePrevious,
    string? Note,
    long? ContestId = null);

public sealed class ContestAdminValidationException(IReadOnlyDictionary<string, string> fields)
    : Exception("Dữ liệu cuộc thi không hợp lệ.")
{
    public IReadOnlyDictionary<string, string> Fields { get; } = fields;
}

public sealed class ContestAdminConflictException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

