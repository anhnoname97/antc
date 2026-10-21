using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public sealed record QuestionRetentionSettings([property: JsonRequired] bool Enabled,
    [property: JsonRequired] int RetentionDays, [property: JsonRequired] long ReviewVersion);
public sealed record QuestionRetentionRun([property: JsonRequired] long ReviewVersion);
public sealed record QuestionRetentionView(bool Enabled, int RetentionDays, long ReviewVersion, int EligibleCount,
    DateTimeOffset? LastRunAt, int LastDeletedCount, string? UpdatedBy, DateTimeOffset? UpdatedAt);

public sealed class QuestionRetentionService(AppDbContext db, TimeProvider clock, ILogger<QuestionRetentionService> logger)
{
    public async Task<QuestionRetentionView> GetAsync(CancellationToken ct = default)
    {
        var policy = await ReadAsync(ct);
        int eligible = await Eligible(policy.RetentionDays).CountAsync(ct);
        return new(policy.Enabled, policy.RetentionDays, policy.ReviewVersion, eligible,
            policy.LastRunAt is { } last ? QuestionValues.AsUtc(last) : null, policy.LastDeletedCount,
            policy.UpdatedBy, policy.UpdatedAt is { } updated ? QuestionValues.AsUtc(updated) : null);
    }

    public async Task<QuestionRetentionView> SaveAsync(QuestionRetentionSettings settings, string actor, CancellationToken ct = default)
    {
        ValidateActor(actor);
        if (settings.RetentionDays is < 30 or > 3650 || settings.ReviewVersion < 0)
            throw new QuestionModerationException("VALIDATION", "Thời gian lưu cần từ 30 đến 3.650 ngày.");
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await EnsurePolicyAsync(ct);
        int count = await db.QuestionRetentionPolicies.Where(x => x.Id == 1 && x.ReviewVersion == settings.ReviewVersion)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.Enabled, settings.Enabled)
                .SetProperty(x => x.RetentionDays, settings.RetentionDays).SetProperty(x => x.UpdatedBy, actor)
                .SetProperty(x => x.UpdatedAt, clock.GetUtcNow().UtcDateTime)
                .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        if (count != 1) throw Conflict();
        await transaction.CommitAsync(ct);
        logger.LogInformation("{Actor} cập nhật dọn Hỏi–Đáp: bật={Enabled}, thời hạn={Days} ngày", actor, settings.Enabled, settings.RetentionDays);
        return await GetAsync(ct);
    }

    public async Task<QuestionRetentionView> RunAsync(long reviewVersion, string actor, CancellationToken ct = default)
    {
        ValidateActor(actor);
        if (reviewVersion < 0) throw Conflict();
        await RunCoreAsync(reviewVersion, actor, ct);
        await PurgeDeletedAsync(ct);
        return await GetAsync(ct);
    }

    public async Task SweepAsync(CancellationToken ct = default)
    {
        var policy = await ReadAsync(ct);
        if (policy.Enabled && (policy.LastRunAt is null || policy.LastRunAt <= clock.GetUtcNow().UtcDateTime.AddDays(-1)))
            await RunCoreAsync(policy.ReviewVersion, "Hệ thống", ct);
        await PurgeDeletedAsync(ct);
    }

    private async Task RunCoreAsync(long version, string actor, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await EnsurePolicyAsync(ct);
        var policy = await ReadAsync(ct);
        if (policy.ReviewVersion != version) throw Conflict();
        DateTime now = clock.GetUtcNow().UtcDateTime;
        int reserved = await db.QuestionRetentionPolicies.Where(x => x.Id == 1 && x.ReviewVersion == version)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1)
                .SetProperty(x => x.LastRunAt, now), ct);
        if (reserved != 1) throw Conflict();
        int count = await Eligible(policy.RetentionDays).ExecuteUpdateAsync(set => set
            .SetProperty(x => x.DeletedAt, now).SetProperty(x => x.DeletedBy, actor)
            .SetProperty(x => x.ReviewVersion, x => x.ReviewVersion + 1), ct);
        await db.QuestionRetentionPolicies.Where(x => x.Id == 1).ExecuteUpdateAsync(set => set.SetProperty(x => x.LastDeletedCount, count), ct);
        await transaction.CommitAsync(ct);
        logger.LogInformation("{Actor} dọn {Count} nội dung Hỏi–Đáp đã kết thúc xử lý, quá {Days} ngày", actor, count, policy.RetentionDays);
    }

    private IQueryable<QuestionSubmission> Eligible(int days)
    {
        DateTime cutoff = clock.GetUtcNow().UtcDateTime.AddDays(-days);
        return db.QuestionSubmissions.Where(x => !x.IsPublished && (x.Status == "da-xu-ly" || x.Status == "bo-qua")
            && (x.HandledAt ?? x.CreatedAt) < cutoff);
    }

    private async Task PurgeDeletedAsync(CancellationToken ct)
    {
        // Giữ hàng trong cửa sổ một giờ để xóa không làm mất giới hạn 5 lần/IP/giờ.
        // Các truy vấn quản trị, API công khai và chỉ mục đã loại hàng này ngay khi xóa.
        DateTime cutoff = clock.GetUtcNow().UtcDateTime.AddHours(-1);
        int count = await db.QuestionSubmissions.IgnoreQueryFilters()
            .Where(x => x.DeletedAt != null && x.CreatedAt <= cutoff).ExecuteDeleteAsync(ct);
        if (count > 0) logger.LogInformation("Đã xóa vật lý {Count} nội dung Hỏi–Đáp khỏi CSDL", count);
    }

    private Task<QuestionRetentionPolicy?> StoredAsync(CancellationToken ct) =>
        db.QuestionRetentionPolicies.AsNoTracking().SingleOrDefaultAsync(x => x.Id == 1, ct);
    private async Task<QuestionRetentionPolicy> ReadAsync(CancellationToken ct) => await StoredAsync(ct) ?? new();
    private async Task EnsurePolicyAsync(CancellationToken ct)
    {
        if (await StoredAsync(ct) is not null) return;
        db.QuestionRetentionPolicies.Add(new());
        await db.SaveChangesAsync(ct);
    }
    private static void ValidateActor(string actor)
    {
        if (string.IsNullOrWhiteSpace(actor) || actor.Length > 100)
            throw new QuestionModerationException("VALIDATION", "Không xác định được người xử lý.");
    }
    private static QuestionModerationException Conflict() => new("CONFLICT", "Cấu hình dọn dữ liệu đã thay đổi. Tải lại trước khi thao tác.");
}

public sealed class QuestionRetentionWorker(IServiceScopeFactory scopes, IHostApplicationLifetime lifetime,
    ILogger<QuestionRetentionWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        using var registration = lifetime.ApplicationStarted.Register(() => started.TrySetResult());
        try
        {
            await started.Task.WaitAsync(stoppingToken);
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await using var scope = scopes.CreateAsyncScope();
                    await scope.ServiceProvider.GetRequiredService<QuestionRetentionService>().SweepAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
                catch (Exception error) { logger.LogWarning(error, "Chưa dọn được dữ liệu Hỏi–Đáp; sẽ thử lại ở lượt kế tiếp."); }
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
    }
}
