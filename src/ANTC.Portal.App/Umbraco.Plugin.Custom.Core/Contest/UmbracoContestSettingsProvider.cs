using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Umbraco.Plugin.Custom.Core.Contest;

/// <summary>Doc cau hinh tu document type thiPage trong published cache cua Umbraco.</summary>
public class UmbracoContestSettingsProvider : IContestSettingsProvider
{
    private const int DefaultMaxAttempts = 2;
    private readonly IPublishedContentQuery _contentQuery;
    private readonly TimeZoneInfo _vietnamTimeZone;

    public UmbracoContestSettingsProvider(IPublishedContentQuery contentQuery)
    {
        _contentQuery = contentQuery;
        _vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
    }

    public ContestSettings GetCurrent()
    {
        IPublishedContent? page = _contentQuery.ContentAtRoot()
            .DescendantsOrSelfOfType("thiPage")
            .FirstOrDefault();

        DateTime? start = page?.Value<DateTime?>("contestStart");
        DateTime? end = page?.Value<DateTime?>("contestEnd");
        int configuredMaxAttempts = page?.Value<int?>("maxAttempts") ?? DefaultMaxAttempts;

        return new ContestSettings(
            ToVietnamOffset(start),
            ToVietnamOffset(end),
            configuredMaxAttempts > 0 ? configuredMaxAttempts : DefaultMaxAttempts);
    }

    private DateTimeOffset? ToVietnamOffset(DateTime? value)
    {
        // Umbraco.DateTime co the tra DateTime.MinValue khi o trong Backoffice de trong.
        if (value is null || value.Value == default)
        {
            return null;
        }

        DateTime local = DateTime.SpecifyKind(value.Value, DateTimeKind.Unspecified);
        return new DateTimeOffset(local, _vietnamTimeZone.GetUtcOffset(local));
    }
}
