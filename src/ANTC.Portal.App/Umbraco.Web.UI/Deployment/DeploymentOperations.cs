using System.Text.Json;
using uSync.BackOffice;
using uSync.BackOffice.SyncHandlers.Models;
using Umbraco.Cms.Core.Services;

namespace Antc.Deployment;

public static class DeploymentOperations
{
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
        var actions = (await service.StartupImportAsync([folder], true,
            new SyncHandlerOptions { Group = group }, null)).ToArray();
        if (actions.Length == 0 || actions.Any(x => !x.Success))
            throw new InvalidOperationException("USYNC_IMPORT_FAILED");
        await File.WriteAllTextAsync(receipt, JsonSerializer.Serialize(new
        { releaseId, completedAtUtc = DateTimeOffset.UtcNow, group, actions = actions.Length }));
    }
}
