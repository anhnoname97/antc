namespace Umbraco.Plugin.Custom.Core.Data;

// No selector, entry code, name, phone or erased content is stored in this journal.
public sealed class PrivacyOperation
{
    public Guid Id { get; set; }
    public Guid ActorUserKey { get; set; }
    public DateTime OccurredAt { get; set; }
    public string Scope { get; set; } = "";
    public string Action { get; set; } = "";
    public string RequestHash { get; set; } = "";
    public string CountsJson { get; set; } = "{}";
    public bool VacuumCompleted { get; set; }
    public DateTime? VacuumCompletedAt { get; set; }
    public string? CleanupErrorCode { get; set; }
}
