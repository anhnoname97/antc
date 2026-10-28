using System.Text;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Net.Http.Headers;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Services;
using Umbraco.Plugin.Custom.Api.Infrastructure;

namespace Antc.Web;

/// <summary>Public HTML errors must remain available when the CMS cannot render a page.</summary>
public static class WebsiteErrorPages
{
    private const string DefaultFile = "wwwroot/errors/500.html";
    private const string Fallback = "<!doctype html><html lang=vi><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=robots content=\"noindex,nofollow\"><title>Website đang gián đoạn</title><h1>Website đang gián đoạn.</h1><p>Bạn vui lòng thử lại sau.</p><a href=/>Về trang chủ</a></html>";

    public static IApplicationBuilder UseWebsiteErrorPages(this IApplicationBuilder app, IWebHostEnvironment environment)
    {
        var configuration = app.ApplicationServices.GetRequiredService<IConfiguration>();
        if (!environment.IsDevelopment() || configuration.GetValue<bool>("ErrorPages:UseInDevelopment"))
        {
            app.UseWhen(IsPublicPage, branch =>
            {
                branch.UseExceptionHandler(new ExceptionHandlerOptions
                {
                    SuppressDiagnosticsCallback = _ => true,
                    ExceptionHandler = context => WriteServerErrorAsync(context, environment)
                });
                branch.UseStatusCodePages(async status =>
                {
                    if (status.HttpContext.Response.StatusCode == StatusCodes.Status500InternalServerError)
                        await WriteServerErrorAsync(status.HttpContext, environment);
                });
                branch.Use(async (context, next) =>
                {
                    // The standalone main-branch page also works when Umbraco cannot render templates.
                    if (context.RequestServices.GetService<IRuntimeState>()?.Level == RuntimeLevel.BootFailed)
                        await WriteServerErrorAsync(context, environment);
                    else
                        await next(context);
                });
            });
        }

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
            && !path.StartsWithSegments("/quan-tri", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/App_Plugins", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/assets", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/media", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/errors", StringComparison.OrdinalIgnoreCase)
            && !path.StartsWithSegments("/healthz", StringComparison.OrdinalIgnoreCase)
            && AcceptsHtml(context);
    }

    private static bool AcceptsHtml(HttpContext context)
    {
        var accept = context.Request.Headers.Accept;
        return accept.Count == 0 || accept.Any(value => value?.Split(',').Any(part =>
            MediaTypeHeaderValue.TryParse(part, out var type) && type.Quality.GetValueOrDefault(1) > 0 &&
            (type.MediaType.Equals("text/html", StringComparison.OrdinalIgnoreCase)
                || type.MediaType.Equals("text/*", StringComparison.OrdinalIgnoreCase)
                || type.MediaType.Equals("*/*", StringComparison.OrdinalIgnoreCase))) == true);
    }

    private static async Task WriteServerErrorAsync(HttpContext context, IWebHostEnvironment environment)
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "text/html; charset=utf-8";
        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers["X-Robots-Tag"] = "noindex, nofollow";
        string page = await ReadPageAsync(context, environment);
        context.Response.ContentLength = Encoding.UTF8.GetByteCount(page);
        context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(WebsiteErrorPages))
            .LogError("Trang công khai trả lỗi 500. Mã theo dõi: {TraceId}", context.TraceIdentifier);
        if (!HttpMethods.IsHead(context.Request.Method))
            await context.Response.WriteAsync(page, context.RequestAborted);
    }

    private static async Task<string> ReadPageAsync(HttpContext context, IWebHostEnvironment environment)
    {
        string path = context.RequestServices.GetRequiredService<IConfiguration>()["ErrorPages:ServerErrorFile"] ?? DefaultFile;
        if (string.IsNullOrWhiteSpace(path) || Path.IsPathRooted(path)
            || path.Split(['/', '\\']).Any(segment => segment == "..")) return Fallback;
        try
        {
            var file = environment.ContentRootFileProvider.GetFileInfo(path);
            if (!file.Exists || file.IsDirectory) return Fallback;
            await using Stream stream = file.CreateReadStream();
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
            string page = await reader.ReadToEndAsync(context.RequestAborted);
            return string.IsNullOrWhiteSpace(page) ? Fallback : page;
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return Fallback;
        }
    }
}
