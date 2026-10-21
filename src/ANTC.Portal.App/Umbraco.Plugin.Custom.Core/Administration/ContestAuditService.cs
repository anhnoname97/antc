using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Administration;

public sealed class ContestAuditService(AppDbContext db, IDataProtectionProvider protection, TimeProvider clock)
{
    public const string Purpose = "Antc.ContestAdministration.Audit.v1";
    public async Task RecordAsync(Guid actor, string action, object filters, string? code, CancellationToken ct)
    {
        if (actor == Guid.Empty) throw new InvalidOperationException("Thiếu người thực hiện.");
        db.ContestAccessAudits.Add(new ContestAccessAudit
        {
            ActorUserKey = actor, Action = action, EntryCode = code, OccurredAt = clock.GetUtcNow().UtcDateTime,
            ProtectedFilters = protection.CreateProtector(Purpose).Protect(JsonSerializer.Serialize(filters))
        });
        // Fail closed: data is not delivered when its access cannot be audited.
        await db.SaveChangesAsync(ct);
    }
}
