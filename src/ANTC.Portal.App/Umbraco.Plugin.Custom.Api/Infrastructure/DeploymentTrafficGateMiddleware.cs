using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Umbraco.Plugin.Custom.Api.Models;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

public sealed class DeploymentTrafficGateMiddleware(RequestDelegate next, IConfiguration config)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path != "/healthz" && config["Deployment:TrafficGatePath"] is { Length: > 0 } gate && File.Exists(gate))
        {
            context.Response.StatusCode = 503;
            context.Response.Headers.CacheControl = "no-store";
            context.Response.Headers.RetryAfter = "30";
            await context.Response.WriteAsJsonAsync(new ApiErrorResponse(new ApiError(
                "MAINTENANCE", "Hệ thống đang cập nhật. Vui lòng thử lại sau ít phút.")), context.RequestAborted);
            return;
        }
        await next(context);
    }
}
