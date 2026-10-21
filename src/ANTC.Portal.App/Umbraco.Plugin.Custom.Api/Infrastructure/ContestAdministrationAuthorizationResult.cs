using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Administration;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

public sealed class ContestAdministrationAuthorizationResult : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler fallback = new();
    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy, PolicyAuthorizationResult result)
    {
        if (!result.Succeeded && ApiProtection.IsApi(context.Request.Path) && policy.Requirements.Any(r=>r is ContestAdministrationRequirement))
        {
            context.Response.StatusCode = result.Forbidden ? 403 : 401;
            context.Response.Headers.CacheControl = "no-store";
            await context.Response.WriteAsJsonAsync(new ApiErrorResponse(new ApiError(result.Forbidden?"FORBIDDEN":"UNAUTHORIZED",
                result.Forbidden?"Bạn không thuộc nhóm Quản trị cuộc thi.":"Vui lòng đăng nhập backoffice Umbraco.")),context.RequestAborted);
            return;
        }
        await fallback.HandleAsync(next, context, policy, result);
    }
}
