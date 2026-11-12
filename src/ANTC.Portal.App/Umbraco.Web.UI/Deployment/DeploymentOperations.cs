using System.Text.Json;
using uSync.BackOffice;
using uSync.BackOffice.SyncHandlers.Models;
using Umbraco.Cms.Core.Services;

namespace Antc.Deployment;

public static class DeploymentOperations
{
    /// <summary>
    /// May chu tam tren cung dia chi voi ung dung (ASPNETCORE_URLS) trong luc nhap uSync:
    /// "/" va "/healthz" tra 200, con lai 503. Khong gui X-ANTC-Release nen script ops van cho ban that.
    /// Tra null khi khong khai bao dia chi (vd run-local dung launchSettings).
    /// </summary>
    public static async Task<WebApplication?> StartPlaceholderAsync(WebApplication app)
    {
        if (app.Configuration["ASPNETCORE_URLS"] is not { Length: > 0 } urls) return null;
        var builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseUrls(urls.Split(';', StringSplitOptions.RemoveEmptyEntries));
        builder.Logging.ClearProviders();
        var placeholder = builder.Build();
        placeholder.Run(async context =>
        {
            bool probe = context.Request.Path == "/" || context.Request.Path == "/healthz";
            context.Response.StatusCode = probe ? 200 : 503;
            context.Response.Headers.CacheControl = "no-store";
            if (!probe) context.Response.Headers.RetryAfter = "30";
            context.Response.ContentType = "text/plain; charset=utf-8";
            await context.Response.WriteAsync("Hệ thống đang khởi tạo. Vui lòng thử lại sau ít phút.", context.RequestAborted);
        });
        await placeholder.StartAsync();
        return placeholder;
    }

    /// <summary>Con phai nhap uSync cho ban phat hanh nay (chua co bien nhan).</summary>
    public static bool IsImportPending(WebApplication app)
    {
        if (!app.Configuration.GetValue<bool>("Deployment:ImportStructure")) return false;
        if (app.Configuration["Deployment:ReleaseId"] is not { } releaseId || app.Configuration["Deployment:StatePath"] is not { } state)
            return true; // De ImportStructureAsync bao loi cau hinh nhu cu.
        return !File.Exists(Path.Combine(state, releaseId + ".json"));
    }

    public static async Task ImportStructureAsync(WebApplication app)
    {
        if (!app.Configuration.GetValue<bool>("Deployment:ImportStructure")) return;
        string releaseId = app.Configuration["Deployment:ReleaseId"] ?? throw new InvalidOperationException("DEPLOYMENT_RELEASE_REQUIRED");
        if (!System.Text.RegularExpressions.Regex.IsMatch(releaseId, "^[a-zA-Z0-9-]{1,100}$"))
            throw new InvalidOperationException("DEPLOYMENT_RELEASE_INVALID");
        string state = app.Configuration["Deployment:StatePath"] ?? throw new InvalidOperationException("DEPLOYMENT_STATE_REQUIRED");
        Directory.CreateDirectory(state);
        string receipt = Path.Combine(state, releaseId + ".json");
        if (File.Exists(receipt)) return;
        string folder = Path.Combine(app.Environment.ContentRootPath, "uSync", "v18");
        if (!Directory.Exists(folder)) throw new InvalidOperationException("USYNC_STRUCTURE_MISSING");
        using var scope = app.Services.CreateScope();
        bool bootstrap = app.Configuration.GetValue<bool>("Deployment:BootstrapContent");
        if (bootstrap && scope.ServiceProvider.GetRequiredService<IContentService>().GetRootContent().Any())
            throw new InvalidOperationException("BOOTSTRAP_REQUIRES_EMPTY_CONTENT");
        string group = bootstrap ? "All" : "Settings";
        var service = scope.ServiceProvider.GetRequiredService<ISyncService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<WebApplication>>();
        var actions = (await service.StartupImportAsync([folder], true,
            new SyncHandlerOptions { Group = group }, null)).ToArray();
        if (actions.Length == 0) throw new InvalidOperationException("USYNC_IMPORT_FAILED");
        var failed = actions.Where(x => !x.Success).ToList();
        // Noi dung tro toi nhau (snippetAfter, targetPage...) chi publish duoc khi muc duoc tro da publish.
        // CSDL trong thi uSync co the nhap muc tro truoc muc dich: muc da luu nhung chua publish.
        // Publish lai cac muc do sau khi nhap xong, toi da 3 vong, dung khi khong con tien trien.
        if (bootstrap && failed.Count > 0)
        {
            var contents = scope.ServiceProvider.GetRequiredService<IContentService>();
            for (int round = 1; round <= 3 && failed.Count > 0; round++)
            {
                int before = failed.Count;
                failed.RemoveAll(x => x.ItemType == "IContent" && contents.GetById(x.Key) is { } c
                    && contents.Publish(c, ["*"]).Success);
                if (failed.Count == before) break;
            }
        }
        foreach (var item in failed)
            logger.LogError("Deployment import loi {Type} {Name}: {Message}", item.ItemType, item.Name, item.Message);
        if (failed.Count > 0) throw new InvalidOperationException("USYNC_IMPORT_FAILED");
        await File.WriteAllTextAsync(receipt, JsonSerializer.Serialize(new
        { releaseId, completedAtUtc = DateTimeOffset.UtcNow, group, actions = actions.Length }));
    }
}
