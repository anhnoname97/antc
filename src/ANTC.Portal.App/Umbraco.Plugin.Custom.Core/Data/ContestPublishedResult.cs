namespace Umbraco.Plugin.Custom.Core.Data;

/// <summary>An explicitly approved, immutable public snapshot. Contains masked personal fields only.</summary>
public sealed class ContestPublishedResult
{
    public long ContestId { get; set; }
    public long Revision { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public Guid? PublishedByKey { get; set; }
    public string SnapshotJson { get; set; } = "{}";
    public ContestCampaign? Contest { get; set; }
}
