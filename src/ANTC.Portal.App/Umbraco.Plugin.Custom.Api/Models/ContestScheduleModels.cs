using System.Text.Json.Serialization;

namespace Umbraco.Plugin.Custom.Api.Models;

public sealed record ContestScheduleTopicDto(
    [property: JsonPropertyName("cd")] string Cd,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("count")] int Count);

public sealed record ContestScheduleItemDto(
    [property: JsonPropertyName("id")] long Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("startAt")] string StartAt,
    [property: JsonPropertyName("endAt")] string EndAt,
    [property: JsonPropertyName("submitUntil")] string SubmitUntil,
    [property: JsonPropertyName("maxAttempts")] int MaxAttempts,
    [property: JsonPropertyName("questionCount")] int QuestionCount,
    [property: JsonPropertyName("topics")] IReadOnlyList<ContestScheduleTopicDto> Topics,
    [property: JsonPropertyName("focusArea")] string? FocusArea);

public sealed record ContestScheduleResponse(
    [property: JsonPropertyName("serverTime")] string ServerTime,
    [property: JsonPropertyName("ongoing")] IReadOnlyList<ContestScheduleItemDto> Ongoing,
    [property: JsonPropertyName("upcoming")] IReadOnlyList<ContestScheduleItemDto> Upcoming,
    [property: JsonPropertyName("ended")] IReadOnlyList<ContestScheduleItemDto> Ended)
{
    /// <summary>Portal dùng để nhận biết có cuộc thi đang diễn ra hay không.</summary>
    [JsonPropertyName("hasOngoingContest")]
    public bool HasOngoingContest => Ongoing.Count > 0;
}
