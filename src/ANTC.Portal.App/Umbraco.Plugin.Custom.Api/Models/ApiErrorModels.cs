namespace Umbraco.Plugin.Custom.Api.Models;

public sealed record ApiErrorResponse(ApiError Error);

public sealed record ApiError
{
    public string Code { get; init; }
    public string Message { get; init; }
    public IReadOnlyDictionary<string, string> Fields { get; init; }

    public ApiError(string code, string message, IReadOnlyDictionary<string, string>? fields = null)
        => (Code, Message, Fields) = (code, message, fields ?? new Dictionary<string, string>());
}
