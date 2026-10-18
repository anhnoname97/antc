using System.Text.Json.Serialization;

namespace Umbraco.Plugin.Custom.Api.Models;

public sealed record CreateQuestionRequest(
    [property: JsonPropertyName("type")] string? Type,
    [property: JsonPropertyName("content")] string? Content,
    [property: JsonPropertyName("wantReply")] bool WantReply,
    [property: JsonPropertyName("contact")] string? Contact,
    [property: JsonPropertyName("consent")] bool? Consent,
    [property: JsonPropertyName("website")] string? Website);

public sealed record CreateQuestionResponse(bool Ok = true);
