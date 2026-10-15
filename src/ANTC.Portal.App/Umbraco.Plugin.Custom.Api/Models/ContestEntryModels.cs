using System.Text.Json.Serialization;

namespace Umbraco.Plugin.Custom.Api.Models;

public sealed record CreateContestEntryRequest(
    [property: JsonPropertyName("mode")] string? Mode,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("org")] string? Org,
    [property: JsonPropertyName("consent")] bool? Consent);

public sealed record CreateContestEntryResponse(
    string Code,
    string Token,
    string Mode,
    int? AttemptNo,
    int MaxAttempts,
    string Status);

public sealed record ApiErrorResponse(ApiError Error);

public sealed record ApiError(string Code, string Message, IReadOnlyDictionary<string, string>? Fields = null);
