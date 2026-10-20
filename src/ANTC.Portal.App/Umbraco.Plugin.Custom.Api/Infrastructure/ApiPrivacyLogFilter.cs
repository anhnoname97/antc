using Microsoft.AspNetCore.Http;
using Serilog.Core;
using Serilog.Events;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

/// <summary>Allowlist log trong request API; chặn log model binding, SQL, URL, header và exception.</summary>
public sealed class ApiPrivacyLogFilter(IHttpContextAccessor accessor) : ILogEventFilter
{
    public bool IsEnabled(LogEvent logEvent)
    {
        bool api = accessor.HttpContext is { } context && IsSensitive(context.Request.Path);
        foreach (string name in new[] { "RequestPath", "Path" })
            if (logEvent.Properties.TryGetValue(name, out var value) && value is ScalarValue { Value: string path } && path.StartsWith('/'))
                api |= IsSensitive(new PathString(path.Split('?')[0]));
        if (!api) return true;

        if (logEvent.Exception is not null || logEvent.MessageTemplate.Text != ApiBoundaryMiddleware.AuditTemplate ||
            !logEvent.Properties.TryGetValue("SourceContext", out var source) ||
            source is not ScalarValue { Value: "Umbraco.Plugin.Custom.Api.Infrastructure.ApiBoundaryMiddleware" })
            return false;

        // Enrichers/scopes có thể tự thêm URL hay user name: chỉ giữ hai trường nghiệp vụ.
        foreach (string property in logEvent.Properties.Keys.ToArray())
            if (property is not ("EntryCode" or "ErrorCode")) logEvent.RemovePropertyIfPresent(property);
        return true;
    }
    private static bool IsSensitive(PathString path) => ApiProtection.IsApi(path) || path.StartsWithSegments("/quan-tri", StringComparison.OrdinalIgnoreCase);
}
