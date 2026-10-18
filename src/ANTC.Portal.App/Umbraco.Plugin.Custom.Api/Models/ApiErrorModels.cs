namespace Umbraco.Plugin.Custom.Api.Models;

public sealed record ApiErrorResponse(ApiError Error);

public sealed record ApiError(string Code, string Message, IReadOnlyDictionary<string, string>? Fields = null);
