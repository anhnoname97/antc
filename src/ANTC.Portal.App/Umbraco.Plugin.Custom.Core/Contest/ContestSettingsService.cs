using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace Umbraco.Plugin.Custom.Core.Contest;

public interface IContestSettings
{
    /// <summary>Doc cai dat tu trang thiPage dang xuat ban; null neu khong co trang.</summary>
    Task<ContestSettings?> GetAsync();

    /// <summary>Doc cai dat tu mot trang thiPage da co san (dung trong view).</summary>
    ContestSettings Read(IPublishedContent page);

    /// <summary>
    /// Trang thai cuoc thi tai thoi diem nowUtc. Mo khi start &lt;= now &lt; end;
    /// thieu ngay hoac start &gt;= end thi coi la chua mo.
    /// </summary>
    ContestStatus GetStatus(ContestSettings settings, DateTime nowUtc);

    /// <summary>
    /// Con han nop bai (API-05): now &lt; end + submitGraceHours. Thieu ngay hoac start &gt;= end thi false (QD-014).
    /// </summary>
    bool IsSubmitOpen(ContestSettings settings, DateTime nowUtc);
}

/// <summary>
/// Dich vu dung chung cho trang cuoc thi va API cuoc thi (QD-003, QD-006).
/// </summary>
public class ContestSettingsService : IContestSettings
{
    private const string PageAlias = "thiPage";

    // Gio Viet Nam co dinh UTC+7, khong co gio mua he
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);

    private readonly IUmbracoContextFactory _contextFactory;
    private readonly IDocumentNavigationQueryService _navigation;
    private readonly IPublishedValueFallback _fallback;
    private readonly ILogger<ContestSettingsService> _logger;

    public ContestSettingsService(
        IUmbracoContextFactory contextFactory,
        IDocumentNavigationQueryService navigation,
        IPublishedValueFallback fallback,
        ILogger<ContestSettingsService> logger)
    {
        _contextFactory = contextFactory;
        _navigation = navigation;
        _fallback = fallback;
        _logger = logger;
    }

    public async Task<ContestSettings?> GetAsync()
    {
        if (!_navigation.TryGetRootKeys(out var roots)) return null;
        var keys = roots
            .SelectMany(r => _navigation.TryGetDescendantsKeysOfType(r, PageAlias, out var found) ? found : []);

        // Dieu huong gom ca ban nhap; lay nut dau tien co trong cache da xuat ban
        using var cref = _contextFactory.EnsureUmbracoContext();
        var cache = cref.UmbracoContext.Content;
        if (cache is null) return null;
        foreach (var key in keys)
        {
            var page = await cache.GetByIdAsync(key);
            if (page is not null) return Read(page);
        }

        return null;
    }

    public ContestSettings Read(IPublishedContent page) => new(
        ReadDate(page, "contestStart"),
        ReadDate(page, "contestEnd"),
        ContestSettings.NormalizeMaxAttempts(page.Value<int?>(_fallback, "maxAttempts")),
        ContestSettings.NormalizeSubmitGraceHours(page.Value<int?>(_fallback, "submitGraceHours")));

    // Thuoc tinh ngay de trong co the tra ve DateTime.MinValue thay vi null
    private DateTime? ReadDate(IPublishedContent page, string alias)
    {
        var value = page.Value<DateTime?>(_fallback, alias);
        return value is { } d && d != default ? d : null;
    }

    public ContestStatus GetStatus(ContestSettings settings, DateTime nowUtc)
    {
        if (settings.Start is not { } start || settings.End is not { } end) return ContestStatus.Upcoming;
        if (start >= end)
        {
            _logger.LogWarning("Cai dat cuoc thi sai: contestStart {Start} >= contestEnd {End}, coi nhu chua mo", start, end);
            return ContestStatus.Upcoming;
        }

        var startUtc = DateTime.SpecifyKind(start - VietnamOffset, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(end - VietnamOffset, DateTimeKind.Utc);
        if (nowUtc < startUtc) return ContestStatus.Upcoming;
        return nowUtc < endUtc ? ContestStatus.Open : ContestStatus.Closed;
    }

    public bool IsSubmitOpen(ContestSettings settings, DateTime nowUtc)
    {
        if (settings.Start is not { } start || settings.End is not { } end || start >= end) return false;
        var deadlineUtc = DateTime.SpecifyKind(end - VietnamOffset, DateTimeKind.Utc).AddHours(settings.SubmitGraceHours);
        return nowUtc < deadlineUtc;
    }
}
