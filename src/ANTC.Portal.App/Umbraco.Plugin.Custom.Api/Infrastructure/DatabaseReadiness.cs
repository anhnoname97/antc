using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

public interface IDatabaseReadiness
{
    Task<bool> CanReadAsync(CancellationToken ct);
}

public sealed class DatabaseReadiness(AppDbContext appDb, IUmbracoDatabaseFactory umbracoDb) : IDatabaseReadiness
{
    public async Task<bool> CanReadAsync(CancellationToken ct)
    {
        try
        {
            appDb.Database.SetCommandTimeout(5);
            await appDb.Entries.AsNoTracking().Select(x => x.Id).Take(1).ToArrayAsync(ct);
            using var database = umbracoDb.CreateDatabase();
            database.CommandTimeout = 5;
            await database.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM umbracoKeyValue");
            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { return false; }
    }
}

[ApiController]
public sealed class HealthzController(IDatabaseReadiness readiness) : ControllerBase
{
    [HttpGet("/healthz")]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        return await readiness.CanReadAsync(ct) ? Ok(new { status = "ok" }) :
            StatusCode(503, new { status = "unavailable" });
    }
}
