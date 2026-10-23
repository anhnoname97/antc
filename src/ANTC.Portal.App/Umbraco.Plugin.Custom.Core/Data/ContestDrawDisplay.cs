namespace Umbraco.Plugin.Custom.Core.Data;

/// <summary>Tuy chon hien thi man hinh quay so cua mot cuoc thi. Chua co dong thi dung gia tri mac dinh.</summary>
public sealed class ContestDrawDisplay
{
    public long ContestId { get; set; }
    public bool ShowLiveBadge { get; set; } = true;
    public bool ShowAntiScamTicker { get; set; } = true;
    public bool TransparentBackground { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public ContestCampaign? Contest { get; set; }
}
