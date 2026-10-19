namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed class ContestSecurityOptions
{
    public const string SectionName = "Contest";

    public string IpHashSalt { get; set; } = "";
}

public sealed record ContestEntryRegistration(
    string Mode,
    string? FullName,
    string? Phone,
    string? Org,
    bool Consent);

public sealed record ContestEntryCreationResult(
    string Code,
    string Token,
    string Mode,
    int? AttemptNo,
    int MaxAttempts,
    string Status);

public interface IContestEntryService
{
    Task<ContestEntryCreationResult> CreateAsync(
        ContestEntryRegistration registration,
        string? ipAddress,
        CancellationToken cancellationToken = default);
}

public class ContestClosedException : Exception;

public class AttemptLimitException : Exception;
