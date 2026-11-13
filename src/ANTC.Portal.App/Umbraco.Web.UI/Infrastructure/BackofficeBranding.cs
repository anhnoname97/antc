using Umbraco.Cms.Web.Common.Hosting;

namespace Antc.Infrastructure;

public static class BackofficeBranding
{
    /// <summary>Replace the remaining hard-coded logo and favicons with the ANTC shield.</summary>
    public static IApplicationBuilder UseBackofficeBranding(this IApplicationBuilder app) => app.Use(async (context, next) =>
    {
        string assets = context.RequestServices.GetRequiredService<IBackOfficePathGenerator>().BackOfficeAssetsPath;
        string? path = context.Request.Path.Value;
        bool brandedAsset = path is "/umbraco/backoffice/assets/umbraco-logo.svg"
            or "/umbraco/backoffice/assets/favicon.svg" or "/umbraco/login/favicon.svg"
            || path == assets + "/assets/favicon.svg" || path == assets + "/assets/umbraco-logo.svg";
        if ((HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method)) && brandedAsset)
        {
            // Favicon dung chung logo trang chu; logo dau trang backoffice giu khien.
            context.Response.Redirect(context.Request.PathBase + (path!.EndsWith("/favicon.svg")
                ? "/favicon.svg?v=2" : "/umbraco/branding/shield.svg?v=1.3.0"));
            return;
        }

        await next(context);
    });
}
