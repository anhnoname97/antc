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
    long DrawId, DateTime CreatedAt, long? PrizeId, string? PrizeCode, string? PrizeName, string Code, string Name, string Phone, int Score);

public sealed record PortalDrawDetail(
    PortalDrawContestInfo Contest,
    IReadOnlyList<PortalDrawPrize> Prizes,
    int SuggestedMinScore,
    int MinScore,
    int Participants,
    int Qualified,
    int RemainingInPool,
    string ListHash,
    IReadOnlyList<PortalDrawWinner> Winners);

public sealed record PortalDrawSpinPerson(string Code, string Name, string Phone, int Score);

public sealed record PortalDrawSpinResult(
    long DrawId, DateTime CreatedAt, PortalDrawPrize Prize, PortalDrawSpinPerson Winner, int RemainingInPool);

public sealed class PortalDrawContestNotFoundException() : Exception("Không tìm thấy cuộc thi.")
{
    public string Code => "CONTEST_NOT_FOUND";
}
