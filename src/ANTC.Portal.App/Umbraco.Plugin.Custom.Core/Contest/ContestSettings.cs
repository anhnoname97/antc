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
public record ContestSettings(DateTime? Start, DateTime? End, int MaxAttempts)
{
    public const int DefaultMaxAttempts = 2;

    /// <summary>null hoac &lt;= 0 thi dung mac dinh.</summary>
    public static int NormalizeMaxAttempts(int? value) => value is > 0 ? value.Value : DefaultMaxAttempts;
}
