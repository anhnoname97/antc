namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed class ContestSecurityOptions
{
    public const string SectionName = "Contest";

    public string IpHashSalt { get; set; } = "";
}

// Hợp đồng tương thích cho các consumer API-01 cũ; controller hiện tại dùng CreateEntryRequest.
public sealed record ContestEntryRegistration(
    string Mode, string? FullName, string? Phone, string? Org, bool Consent);

public sealed record ContestEntryCreationResult(
    string Code, string Token, string Mode, int? AttemptNo, int MaxAttempts, string Status);

public class ContestClosedException : Exception;
public class AttemptLimitException : Exception;
