namespace Umbraco.Plugin.Custom.Core.Data;

public static class QuizAudience
{
    public const string Personal = "personal";
    public const string Organization = "organization";
    public static bool IsValid(string? value) => value is Personal or Organization;
}
