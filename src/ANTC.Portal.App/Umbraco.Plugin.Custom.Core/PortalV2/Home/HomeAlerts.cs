using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Home;

/// <summary>Select homepage cards from published alerts with usable public URLs.</summary>
public static class HomeAlerts
{
    public static IReadOnlyList<AlertListItem> Select(IEnumerable<AlertListItem> publishedAlerts,
        int count, string? pinnedUrl, DateTime today) => publishedAlerts
        .Where(item => item.Kind == "cb" && item.Updated is { } updated
            && AlertFreshness.Age(updated, today) >= 0 && AlertFreshness.IsFresh(updated, today))
        .OrderByDescending(item => !string.IsNullOrWhiteSpace(pinnedUrl) && item.Url == pinnedUrl)
        .ThenByDescending(item => item.Updated)
        .ThenBy(item => item.Title, StringComparer.CurrentCulture)
        .DistinctBy(item => item.Url)
        .Take(Math.Clamp(count, 1, 3))
        .ToArray();
}
