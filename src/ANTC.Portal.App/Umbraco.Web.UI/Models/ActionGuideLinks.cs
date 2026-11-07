using System.Text.RegularExpressions;
namespace Umbraco.Web.UI.Models;
public static class ActionGuideLinks
{
    public static bool IsAllowed(string value) => !value.Contains('\\') && !value.Any(char.IsControl)
        && ((value.StartsWith('/') && !value.StartsWith("//")) || Regex.IsMatch(value, "\\A(?:tel|sms):\\+?[0-9]{3,15}\\z"));
}
