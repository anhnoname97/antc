namespace Umbraco.Plugin.Custom.Core.Contest;

public enum ContestStatus
{
    /// <summary>Chua mo (ke ca khi thieu ngay hoac ngay nhap sai).</summary>
    Upcoming,
    Open,
    Closed
}

/// <summary>
/// Cai dat cuoc thi doc tu trang thiPage. Start/End la gio Viet Nam (khong kem mui gio).
/// </summary>
public record ContestSettings(DateTime? Start, DateTime? End, int MaxAttempts, int SubmitGraceHours = ContestSettings.DefaultSubmitGraceHours)
{
    public const int DefaultMaxAttempts = 2;
    public const int DefaultSubmitGraceHours = 24;

    /// <summary>null hoac am thi dung mac dinh 24; 0 la khong gia han (QD-014).</summary>
    public static int NormalizeSubmitGraceHours(int? value) => value is >= 0 ? value.Value : DefaultSubmitGraceHours;

    /// <summary>null hoac &lt;= 0 thi dung mac dinh.</summary>
    public static int NormalizeMaxAttempts(int? value) => value is > 0 ? value.Value : DefaultMaxAttempts;
}
