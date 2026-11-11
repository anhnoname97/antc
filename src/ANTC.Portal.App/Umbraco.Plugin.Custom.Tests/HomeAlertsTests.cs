using Umbraco.Plugin.Custom.Core.PortalV2.Home;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

namespace Umbraco.Plugin.Custom.Tests;

public class HomeAlertsTests
{
    private static readonly DateTime Today = new(2026, 11, 10, 23, 59, 59);
    private static AlertListItem Alert(string slug, int age) => new("/canh-bao/" + slug + "/", slug,
        "Description", null, Today.AddDays(-age), "cao", [], [], "", 1);

    [Fact]
    public void OnlyDatedAlertsInTheInclusiveLastNinetyCalendarDaysAreEligible()
    {
        var today = Alert("today", 0);
        var boundary = Alert("boundary", 90) with { Updated = Today.Date.AddDays(-90) };
        var expired = Alert("expired", 91);
        var future = Alert("future", -1);
        var undated = Alert("undated", 0) with { Updated = null };
        var article = Alert("article", 1) with { Kind = "lv" };

        Assert.Equal([today, boundary], HomeAlerts.Select([expired, boundary, future, today, undated, article], 3, expired.Url, Today));
    }

    [Fact]
    public void EligiblePinUsesOneSlotThenTheNewestRemainingAlertsFollowWithoutDuplicates()
    {
        var newest = Alert("newest", 0);
        var second = Alert("second", 1);
        var pinned = Alert("pinned", 89);
        Assert.Equal([pinned, newest, second],
            HomeAlerts.Select([second, newest, pinned, pinned, Alert("older", 2)], 3, pinned.Url, Today));
    }

    [Fact]
    public void PinMissingFromThePublishedCollectionCannotAddItselfToTheResults()
    {
        var newest = Alert("newest", 0);
        var older = Alert("older", 1);
        var draftPin = Alert("unpublished", 0);
        Assert.Equal([newest, older], HomeAlerts.Select([older, newest], 3, draftPin.Url, Today));
    }

    [Theory]
    [InlineData(1, 1)] [InlineData(2, 2)] [InlineData(3, 3)]
    [InlineData(0, 1)] [InlineData(4, 3)]
    public void CountIsBoundedAndPinDoesNotIncreaseIt(int requested, int expected)
    {
        var alerts = Enumerable.Range(0, 5).Select(i => Alert("alert" + i, i)).ToArray();
        var result = HomeAlerts.Select(alerts, requested, alerts[4].Url, Today);
        Assert.Equal(expected, result.Count);
        Assert.Equal(alerts[4], result[0]);
    }

    [Fact]
    public void EmptyOrEntirelyExpiredCollectionsProduceNoCards()
    {
        Assert.Empty(HomeAlerts.Select([], 3, null, Today));
        var expired = Alert("expired", 91);
        Assert.Empty(HomeAlerts.Select([expired], 3, expired.Url, Today));
    }

    [Fact]
    public void EqualDatesHaveStableTitleOrderInsteadOfDependingOnTreeOrder()
    {
        var a = Alert("A", 1); var b = Alert("B", 1);
        Assert.Equal([a, b], HomeAlerts.Select([b, a], 3, null, Today));
    }
}
