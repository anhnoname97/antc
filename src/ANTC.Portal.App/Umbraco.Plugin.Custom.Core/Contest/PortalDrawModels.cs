namespace Umbraco.Plugin.Custom.Core.Contest;

/// <summary>Trang thai quay cua mot cuoc thi da ket thuc.</summary>
public static class PortalDrawStatuses
{
    public const string NoPrize = "chua-co-giai";
    public const string NotDrawn = "chua-quay";
    public const string InProgress = "dang-quay";
    public const string Completed = "da-quay-xong";
}

public sealed record PortalDrawContestSummary(
    long Id, string Name, DateTime StartAt, DateTime EndAt, int SubmittedCount, int PrizeQuantity, int PrizeAwarded, string Status);

public sealed record PortalDrawContestInfo(long Id, string Name, DateTime StartAt, DateTime EndAt, IReadOnlyList<string> Topics);

public sealed record PortalDrawPrize(long PrizeId, string Code, string Name, int Quantity, int Awarded, int Remaining, bool IsActive, int SortOrder);

/// <summary>Nguoi trung da che ten va so dien thoai.</summary>
public sealed record PortalDrawWinner(
    long DrawId, DateTime CreatedAt, long? PrizeId, string? PrizeCode, string? PrizeName, string Code, string Name, string Phone, int Score,
    int Rank, bool Cancelled, DateTime? CancelledAt, string? CancelledBy, string? CancelReason);

public sealed record PortalDrawCancelResult(PortalDrawWinner Winner, PortalDrawPrize? Prize);

/// <summary>Ma ly do huy ket qua trung; ba ma dau co nhan co dinh.</summary>
public static class PortalDrawCancelReasons
{
    public const string Unreachable = "khong-lien-he-duoc";
    public const string InvalidInfo = "thong-tin-khong-hop-le";
    public const string Declined = "tu-choi-nhan-giai";
    public const string Other = "khac";

    public static readonly IReadOnlyDictionary<string, string> Labels = new Dictionary<string, string>
    {
        [Unreachable] = "Người trúng không liên hệ được trong thời hạn",
        [InvalidInfo] = "Thông tin dự thi không hợp lệ khi xác minh",
        [Declined] = "Người trúng từ chối nhận giải",
    };

    public static bool IsValid(string? code) => code == Other || (code != null && Labels.ContainsKey(code));
}

public sealed record PortalDrawDetail(
    PortalDrawContestInfo Contest,
    IReadOnlyList<PortalDrawPrize> Prizes,
    int SuggestedMinScore,
    int MinScore,
    int Participants,
    int Qualified,
    int RemainingInPool,
    string ListHash,
    IReadOnlyList<PortalDrawWinner> Winners,
    PortalDrawDisplay Display,
    bool MinScoreLocked,
    string? MinScoreWarning);

/// <summary>Tuy chon hien thi man hinh quay so cua mot cuoc thi.</summary>
public sealed record PortalDrawDisplay(bool ShowLiveBadge, bool ShowAntiScamTicker, bool TransparentBackground);

public sealed record PortalDrawSpinPerson(string Code, string Name, string Phone, int Score);

public sealed record PortalDrawSpinResult(
    long DrawId, DateTime CreatedAt, PortalDrawPrize Prize, PortalDrawSpinPerson Winner, int RemainingInPool);

public sealed class PortalDrawContestNotFoundException() : Exception("Không tìm thấy cuộc thi.")
{
    public string Code => "CONTEST_NOT_FOUND";
}

public sealed class PortalDrawWinnerNotFoundException() : Exception("Không tìm thấy kết quả trúng.")
{
    public string Code => "WINNER_NOT_FOUND";
}
