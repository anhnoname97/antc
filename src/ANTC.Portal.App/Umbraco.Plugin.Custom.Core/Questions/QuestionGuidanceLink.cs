namespace Umbraco.Plugin.Custom.Core.Questions;

public static class QuestionGuidanceLink
{
    public static bool IsSafe(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || url.Any(char.IsControl) || url.Contains('\\')) return false;
        if (url.StartsWith('/')) return !url.StartsWith("//", StringComparison.Ordinal);
        return Uri.TryCreate(url, UriKind.Absolute, out var parsed)
            && parsed.Scheme is "http" or "https";
    }
}
