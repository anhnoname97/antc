using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace Antc.Infrastructure;

public sealed class PublicAssetCacheMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IFileVersionProvider versions, IWebHostEnvironment environment)
    {
        HttpRequest request = context.Request;
        bool assets = request.Path.StartsWithSegments("/assets", StringComparison.OrdinalIgnoreCase);
        bool media = request.Path.StartsWithSegments("/media", StringComparison.OrdinalIgnoreCase);
        if ((!assets && !media) || (!HttpMethods.IsGet(request.Method) && !HttpMethods.IsHead(request.Method)))
        {
            await next(context);
            return;
        }

        if (assets)
        {
            if (!environment.WebRootFileProvider.GetFileInfo(request.Path.Value!).Exists)
            {
                await next(context);
                return;
            }
            string path = request.PathBase.Add(request.Path).Value! + request.QueryString;
            string versioned = versions.AddFileVersionToPath(request.PathBase, path);
            if (!request.Query.ContainsKey("v") && versioned != path)
            {
                // Also versions relative JS imports and CSS fonts without editing frontend files.
                // Keep this redirect revalidatable; only the fingerprinted resource is immutable.
                context.Response.Headers.CacheControl = "no-cache";
                context.Response.Redirect(versioned, permanent: false, preserveMethod: true);
                return;
            }
        }

        context.Response.OnStarting(() =>
        {
            if (context.Response.StatusCode is StatusCodes.Status200OK or StatusCodes.Status206PartialContent
                or StatusCodes.Status304NotModified)
            {
                context.Response.Headers.CacheControl = assets
                    ? "public,max-age=31536000,immutable"
                    : "public,max-age=2592000";
            }
            return Task.CompletedTask;
        });
        await next(context);
    }
}
