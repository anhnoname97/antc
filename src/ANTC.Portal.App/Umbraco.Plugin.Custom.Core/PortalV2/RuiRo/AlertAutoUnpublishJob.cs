using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.BackgroundJobs;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed class AlertAutoUnpublishJob(IServiceScopeFactory scopeFactory, TimeProvider clock, ILogger<AlertAutoUnpublishJob> logger)
    : RecurringBackgroundJobBase(TimeSpan.FromDays(1))
{
    public override async Task RunJobAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var contents = scope.ServiceProvider.GetRequiredService<IContentService>();
        var type = scope.ServiceProvider.GetRequiredService<IContentTypeService>().Get("alertPage");
        if (type is null) return;
        var publisher = scope.ServiceProvider.GetRequiredService<IContentPublishingService>();
        var audit = scope.ServiceProvider.GetRequiredService<IAuditService>();
        var today = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")).Date;
        for (int page = 0; ; page++)
        {
            var batch = contents.GetPagedOfType(type.Id, page, 200, out long total, null).ToArray();
            foreach (var item in batch.Where(x => !x.Trashed && x.Published))
            {
                cancellationToken.ThrowIfCancellationRequested();
                // Expiry follows the published version, so an unfinished draft cannot silently extend a live alert.
                var updated = item.GetValue<DateTime?>("updatedDate", published: true);
                int ttl = item.GetValue<int>("autoUnpublishDays", published: true);
                if (updated is null || !AlertFreshness.ShouldUnpublish(updated.Value, ttl is >= 30 and <= 720 ? ttl : 180, today)) continue;
                var result = await publisher.UnpublishAsync(item.Key, null, Constants.Security.SuperUserKey);
                if (!result.Success) { logger.LogWarning("Không tự gỡ được cảnh báo {Key}: {Status}", item.Key, result.Result); continue; }
                audit.Add(AuditType.Unpublish, Constants.Security.SuperUserId, item.Id, Constants.ObjectTypes.Document.ToString(), "Tự gỡ cảnh báo quá hạn theo số ngày cấu hình.");
                logger.LogInformation("Tự gỡ cảnh báo {Key} ({Name}), ngày cập nhật {Updated}, hạn {Days} ngày.", item.Key, item.Name, updated, ttl);
            }
            if ((page + 1) * 200 >= total) break;
        }
    }
}
