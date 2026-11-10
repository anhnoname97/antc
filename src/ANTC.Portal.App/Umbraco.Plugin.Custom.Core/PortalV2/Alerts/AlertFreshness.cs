namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

/// <summary>Ngày lịch Việt Nam dùng chung cho biên tập, danh sách và tác vụ tự gỡ.</summary>
public static class AlertFreshness
{
    private static readonly TimeZoneInfo Vietnam = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
    public static DateTime Today(TimeProvider clock) => TimeZoneInfo.ConvertTime(clock.GetUtcNow(), Vietnam).Date;
    public static int Age(DateTime updated, DateTime today) => (today.Date - updated.Date).Days;
    public static bool IsFresh(DateTime updated, DateTime today) => Age(updated, today) <= 90;
    public static bool ShouldUnpublish(DateTime updated, int days, DateTime today) => Age(updated, today) > days;
    public static int? FreshDaysLeft(DateTime? updated, DateTime today) => updated is { } date ? 90 - Age(date, today) : null;
    public static int UnpublishDays(int configured) => configured is >= 30 and <= 720 ? configured : 180;
}
