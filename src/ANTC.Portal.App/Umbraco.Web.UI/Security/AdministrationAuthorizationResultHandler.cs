using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace Umbraco.Cms.Web.UI.Security;

public sealed class AdministrationAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();
    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Forbidden && context.Request.Path.StartsWithSegments("/quan-tri"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "text/plain; charset=utf-8";
            await context.Response.WriteAsync("Tài khoản chưa thuộc nhóm Quản trị cuộc thi.");
            return;
        }
        await _default.HandleAsync(next, context, policy, authorizeResult);
    }
}
