namespace Umbraco.Plugin.Custom.Core.Data;

// Separate access audit: no personal details or search terms in operational log files.
public sealed class ContestAccessAudit
{
    public long Id { get; set; }
    public Guid ActorUserKey { get; set; }
    public string Action { get; set; } = "";
    public string? EntryCode { get; set; }
    public DateTime OccurredAt { get; set; }
    public string ProtectedFilters { get; set; } = "";
}
