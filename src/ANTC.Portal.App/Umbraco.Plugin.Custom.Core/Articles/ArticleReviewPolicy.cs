namespace Umbraco.Plugin.Custom.Core.Articles;

public static class ArticleReviewPolicy
{
    public const int DefaultMaxAgeDays = 90;
    public const int MaximumMaxAgeDays = 3650;
    public const string Warning = "Nội dung đang chờ rà soát lại. Lần rà soát gần nhất đã quá {0} ngày.";
    private static readonly TimeZoneInfo Vietnam = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    public static int MaxAgeDays(int? configured) => configured is > 0 and <= MaximumMaxAgeDays
        ? configured.Value : DefaultMaxAgeDays;

    public static DateOnly Today(TimeProvider clock) => DateOnly.FromDateTime(
        TimeZoneInfo.ConvertTime(clock.GetUtcNow(), Vietnam).DateTime);

    public static ArticleReview Evaluate(DateOnly? reviewedDate, int? configured, DateOnly today)
    {
        int days = MaxAgeDays(configured);
        bool overdue = reviewedDate is not null && today.DayNumber - reviewedDate.Value.DayNumber > days;
        return new ArticleReview(reviewedDate, days, overdue, overdue ? string.Format(Warning, days) : null);
    }
}
