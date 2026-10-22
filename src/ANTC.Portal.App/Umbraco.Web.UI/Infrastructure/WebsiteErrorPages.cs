using Umbraco.Plugin.Custom.Api.Infrastructure;

namespace Antc.Web;

/// <summary>Public HTML errors must remain available when the CMS cannot render a page.</summary>
public static class WebsiteErrorPages
{
    public static IApplicationBuilder UseWebsiteErrorPages(this IApplicationBuilder app, IWebHostEnvironment environment)
    {
        app.UseWhen(IsPublicPage, branch =>
        {
            branch.UseExceptionHandler(handler => handler.Run(context => WriteServerErrorAsync(context, environment)));
            branch.UseStatusCodePages(async status =>
            {
                if (status.HttpContext.Response.StatusCode == StatusCodes.Status500InternalServerError)
                    await WriteServerErrorAsync(status.HttpContext, environment);
            });
        });

        // A real HTTP 500 preview, also useful for reverse-proxy error-page configuration.
        app.Use(async (context, next) =>
        {
            if ((HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method))
                && (context.Request.Path.Equals("/500", StringComparison.OrdinalIgnoreCase)
                    || context.Request.Path.Equals("/500/", StringComparison.OrdinalIgnoreCase)))
            {
                await WriteServerErrorAsync(context, environment);
                return;
            }
            await next(context);
        });
        return app;
    }

    private static bool IsPublicPage(HttpContext context)
    {
        PathString path = context.Request.Path;
        return !ApiProtection.IsApi(path)
            && !path.StartsWithSegments("/umbraco", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/App_Plugins", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/assets", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/media", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/errors", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/healthz", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task WriteServerErrorAsync(HttpContext context, IWebHostEnvironment environment)
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "text/html; charset=utf-8";
        context.Response.ContentLength = null;
        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers["X-Robots-Tag"] = "noindex, nofollow";
        if (HttpMethods.IsHead(context.Request.Method)) return;

        string page;
        try
        {
            var path = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "errors", "500.html");
            page = await File.ReadAllTextAsync(path, context.RequestAborted);
        }
        catch (IOException)
        {
            page = "<!doctype html><html lang=vi><meta charset=utf-8><title>Website đang gián đoạn</title><h1>Website đang gián đoạn.</h1><p>Bạn vui lòng thử lại sau.</p><a href=/>Về trang chủ</a></html>";
        }
        catch (UnauthorizedAccessException)
        {
            page = "<!doctype html><html lang=vi><meta charset=utf-8><title>Website đang gián đoạn</title><h1>Website đang gián đoạn.</h1><p>Bạn vui lòng thử lại sau.</p><a href=/>Về trang chủ</a></html>";
        }
        await context.Response.WriteAsync(page, context.RequestAborted);
    }
}
