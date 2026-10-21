namespace Umbraco.Plugin.Custom.Core.Administration;

public sealed record PrivacyLookup(string Kind, string Value, int Page = 1);
public sealed record PrivacyEntry(long Id, string Code, string? FullName, string? Phone, string? Org,
    long? ContestId, string Status, int Answered, int? Score);
public sealed record PrivacyPreview(string PreviewToken, int Total, int Page, int Pages, IReadOnlyList<PrivacyEntry> Items);
public sealed record PrivacyEraseRequest(Guid RequestId, string PreviewToken, string Mode, string Confirmation);
public sealed record PrivacyBulkRequest(Guid RequestId, string Confirmation);
public sealed record PrivacyCounts(int Entries, int Answers, int Contacts, int DrawSnapshots, int PublishedSnapshots, int AuditFilters);
public sealed record PrivacyResult(Guid Id, Guid ActorUserKey, DateTime OccurredAt, string Scope, string Action,
    PrivacyCounts Counts, bool VacuumCompleted, DateTime? VacuumCompletedAt, string? CleanupErrorCode, string? ActorName = null);
public sealed record PrivacyHistory(int Total, int Page, int Pages, IReadOnlyList<PrivacyResult> Items);
public sealed class PrivacyException(string code, string message, int status = 409) : Exception(message)
{
    public string Code { get; } = code;
    public int Status { get; } = status;
}
