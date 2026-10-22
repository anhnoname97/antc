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
        if (!result.Succeeded && ApiProtection.IsApi(context.Request.Path))
        {
            bool admin = policy.Requirements.Any(r => r is ContestAdministrationRequirement);
            // Quay so portal dung cookie thanh vien: tra JSON 401/403, khong chuyen huong ve trang dang nhap.
            bool drawMember = policy.Requirements.Any(r => r is DrawMemberRequirement);
            if (admin || drawMember)
            {
                context.Response.StatusCode = result.Forbidden ? 403 : 401;
                context.Response.Headers.CacheControl = "no-store";
                string forbidden = admin ? "Bạn không thuộc nhóm Quản trị cuộc thi." : "Bạn không thuộc nhóm Ban tổ chức quay số.";
                string unauthorized = admin ? "Vui lòng đăng nhập backoffice Umbraco." : "Vui lòng đăng nhập khu vực quay số.";
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse(new ApiError(result.Forbidden ? "FORBIDDEN" : "UNAUTHORIZED",
                    result.Forbidden ? forbidden : unauthorized)), context.RequestAborted);
                return;
            }
        }
        await fallback.HandleAsync(next, context, policy, result);
    }
}
