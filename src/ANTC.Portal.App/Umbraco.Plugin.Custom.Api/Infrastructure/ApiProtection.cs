using System.Globalization;
using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Serilog.Core;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

public static class ApiProtection
{
    public const int MaxBodyBytes = 16 * 1024;
    public const string EntryCodeItem = "Antc.EntryCode";

    // Chỉ API của dự án; giữ nguyên các API hệ thống Umbraco (đặc biệt upload media).
    public static bool IsApi(PathString path) => path.StartsWithSegments("/api") ||
        path.StartsWithSegments("/umbraco/management/api/v1/antc");

    public static IServiceCollection AddAntcApiProtection(this IServiceCollection services, IConfiguration config)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<ILogEventFilter, ApiPrivacyLogFilter>();
        services.AddScoped<IDatabaseReadiness, DatabaseReadiness>();
        services.Configure<ForwardedHeadersOptions>(o => ConfigureForwarding(o, config));
        services.AddRateLimiter(o =>
        {
            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var rule = RuleFor(context);
                return rule is null ? RateLimitPartition.GetNoLimiter("unlimited") :
                    RateLimitPartition.GetFixedWindowLimiter(rule.Value.Key, _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = rule.Value.Limit,
                        Window = rule.Value.Window,
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    });
            });
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.OnRejected = async (context, ct) =>
            {
                double seconds = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var wait)
                    ? wait.TotalSeconds : 60;
                context.HttpContext.Response.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(seconds))
                    .ToString(CultureInfo.InvariantCulture);
                context.HttpContext.Response.Headers.CacheControl = "no-store";
                await context.HttpContext.Response.WriteAsJsonAsync(new ApiErrorResponse(new ApiError(
                    "RATE_LIMITED", "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.")), ct);
            };
        });
        return services;
    }

    public static void ConfigureForwarding(ForwardedHeadersOptions o, IConfiguration config)
    {
        o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        o.ForwardLimit = config.GetValue("ReverseProxy:ForwardLimit", 1);
        if (o.ForwardLimit is < 1 or > 10) throw new InvalidOperationException("ReverseProxy:ForwardLimit phải từ 1 đến 10.");
        o.KnownProxies.Clear();
        o.KnownIPNetworks.Clear();
        // Mặc định chỉ tin loopback; proxy bên ngoài phải khai báo rõ địa chỉ hoặc CIDR.
        o.KnownProxies.Add(IPAddress.Loopback);
        o.KnownProxies.Add(IPAddress.IPv6Loopback);
        foreach (string value in config.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
            o.KnownProxies.Add(IPAddress.Parse(value));
        foreach (string value in config.GetSection("ReverseProxy:KnownNetworks").Get<string[]>() ?? [])
            o.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(value));
    }

    private static (string Key, int Limit, TimeSpan Window)? RuleFor(HttpContext c)
    {
        string path = c.Request.Path.Value?.TrimEnd('/').ToLowerInvariant() ?? "";
        IPAddress? address = c.Connection.RemoteIpAddress;
        string ip = (address?.IsIPv4MappedToIPv6 == true ? address.MapToIPv4() : address)?.ToString() ?? "unknown";
        if (HttpMethods.IsPost(c.Request.Method) && path == "/api/v1/contest/entries")
            return ($"entries:{ip}", 10, TimeSpan.FromHours(1));
        if (HttpMethods.IsPost(c.Request.Method) && path == "/api/v1/contest/entries/me/answers")
        {
            string? token = c.Request.Headers["X-Entry-Token"].FirstOrDefault()?.Trim();
            string key = string.IsNullOrEmpty(token) ? $"ip:{ip}" : ContestEntryService.HashToken(token);
            return ($"answers:{key}", 120, TimeSpan.FromMinutes(1));
        }
        if ((HttpMethods.IsPut(c.Request.Method) && path == "/api/v1/contest/entries/me/contact") ||
            (HttpMethods.IsPost(c.Request.Method) && path == "/api/v1/contest/entries/me/submit"))
            return ($"finalize:{ip}", 20, TimeSpan.FromHours(1));
        if (HttpMethods.IsPost(c.Request.Method) && path == "/api/v1/questions")
            return ($"questions:{ip}", 5, TimeSpan.FromHours(1));
        return null;
    }
}
