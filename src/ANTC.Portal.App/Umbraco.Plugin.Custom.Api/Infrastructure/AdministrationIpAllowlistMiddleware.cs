using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Umbraco.Plugin.Custom.Api.Models;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

public sealed class AdministrationIpPolicy
{
    public IReadOnlyList<IPNetwork> Networks { get; }
    public string BackofficePath { get; }
    public AdministrationIpPolicy(IConfiguration config, IHostEnvironment environment)
    {
        Networks = (config.GetSection("Administration:AllowedNetworks").Get<string[]>() ?? [])
            .Select(s => s.Contains('/') ? IPNetwork.Parse(s) :
                new IPNetwork(IPAddress.Parse(s), IPAddress.Parse(s).AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork ? 32 : 128))
            .ToArray();
        if (!environment.IsDevelopment() && Networks.Count == 0)
            throw new InvalidOperationException("Phải cấu hình Administration:AllowedNetworks cho môi trường kiểm thử/phát hành.");
        BackofficePath = "/" + (config["Umbraco:CMS:Global:UmbracoPath"] ?? "umbraco").Trim('~', '/');
    }
    public bool Allows(IPAddress? address)
    {
        if (Networks.Count == 0) return true; // Local development only.
        if (address is null) return false;
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        return Networks.Any(n => n.Contains(address));
    }
}

public static class AdministrationIpServices
{
    public static IServiceCollection AddAdministrationIpAllowlist(this IServiceCollection services, IConfiguration config, IHostEnvironment environment)
        => services.AddSingleton(new AdministrationIpPolicy(config, environment));
}

public sealed class AdministrationIpAllowlistMiddleware(RequestDelegate next, AdministrationIpPolicy policy)
{
    public async Task InvokeAsync(HttpContext context)
    {
        bool administration = context.Request.Path.StartsWithSegments(policy.BackofficePath, StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.StartsWithSegments("/quan-tri", StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.StartsWithSegments("/api/v1/admin", StringComparison.OrdinalIgnoreCase);
        if (context.Request.Path.StartsWithSegments("/quan-tri", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.Headers.CacheControl = "no-store";
            context.Response.Headers.Pragma = "no-cache";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Frame-Options"] = "DENY";
        }
        if (administration && !policy.Allows(context.Connection.RemoteIpAddress))
        {
            context.Response.StatusCode = 403;
            context.Response.Headers.CacheControl = "no-store";
            await context.Response.WriteAsJsonAsync(new ApiErrorResponse(new ApiError(
                "FORBIDDEN", "Địa chỉ mạng này không được phép truy cập quản trị.")), context.RequestAborted);
            return;
        }
        await next(context);
    }
}
