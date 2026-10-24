using System.IO.Compression;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Website.Caching;
using Umbraco.Extensions;

namespace Antc.Infrastructure;

public static class PublicSitePerformance
{
    private static readonly HashSet<string> CompressedContentTypes = new(
        ResponseCompressionDefaults.MimeTypes.Concat(["image/svg+xml", "text/javascript"]),
        StringComparer.OrdinalIgnoreCase);

    public static IApplicationBuilder UsePublicSitePerformance(this IApplicationBuilder app)
    {
        app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                // ResponseCompression skips requests with no Accept-Encoding header. Still vary
                // identity responses so an intermediary cannot reuse them for every encoding.
                string? contentType = context.Response.ContentType?.Split(';', 2)[0].Trim();
                if (contentType is not null && CompressedContentTypes.Contains(contentType))
                {
                    string[] vary = context.Response.Headers.GetCommaSeparatedValues(HeaderNames.Vary);
                    if (!vary.Contains("*") && !vary.Contains(HeaderNames.AcceptEncoding, StringComparer.OrdinalIgnoreCase))
                        context.Response.Headers.AppendCommaSeparatedValues(HeaderNames.Vary, HeaderNames.AcceptEncoding);
                }
                return Task.CompletedTask;
            });
            await next(context);
        });
        // Keep compression outside the cache: stored HTML is reusable for identity, br and gzip.
        app.UseResponseCompression();
        return app.UseMiddleware<PublicAssetCacheMiddleware>();
    }

    public static IUmbracoBuilder AddPublicSitePerformance(this IUmbracoBuilder builder)
    {
        builder.Services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
            options.MimeTypes = CompressedContentTypes;
        });
        builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);
        builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);

        if (!builder.Config.GetValue<bool>($"{Constants.Configuration.ConfigWebsite}:OutputCache:Enabled"))
            return builder;

        // AddWebsite registers the named page policy and UseOutputCache in Umbraco's pipeline.
        // This base policy only restricts responses; it must not opt API endpoints into caching.
        builder.Services.AddSingleton<PublicPageCacheResponsePolicy>();
        builder.Services.AddOutputCache(options => options.AddBasePolicy(
            policy => policy.AddPolicy<PublicPageCacheResponsePolicy>(), excludeDefaultPolicy: true));
        builder.Services.Replace(ServiceDescriptor.Singleton<IWebsiteOutputCacheRequestFilter, PublicPageCacheRequestFilter>());
        builder.Services.AddSingleton<IWebsiteOutputCacheVaryByProvider, PublicPageCacheVaryBy>();
        builder.AddNotificationAsyncHandler<ContentCacheRefresherNotification, PublicPageCacheInvalidation>();
        return builder;
    }
}

public sealed class PublicPageCacheRequestFilter(
    IUmbracoContextAccessor contextAccessor,
    IOptionsMonitor<SecuritySettings> security) : DefaultWebsiteOutputCacheRequestFilter(contextAccessor)
{
    private static readonly PathString[] ExcludedPaths =
    ["/tim-kiem", "/api", "/quan-tri", "/umbraco", "/assets", "/media", "/App_Plugins", "/healthz"];

    public override bool IsCacheable(HttpContext context, IPublishedContent content)
    {
        HttpRequest request = context.Request;
        if ((!HttpMethods.IsGet(request.Method) && !HttpMethods.IsHead(request.Method))
            || ExcludedPaths.Any(path => request.Path.StartsWithSegments(path, StringComparison.OrdinalIgnoreCase))
            || request.Headers.ContainsKey(HeaderNames.Authorization)
            || request.Query.ContainsKey("umbPreview")
            || request.Query.ContainsKey("umbPreviewToken"))
            return false;

        string authCookie = security.CurrentValue.AuthCookieName;
        // Request.Cookies drops empty values. Inspect names in the header so even an empty
        // login/preview cookie bypasses lookup, without ever reading or logging its value.
        foreach (string? header in request.Headers.Cookie)
        foreach (string part in (header ?? string.Empty).Split(';'))
        {
            int separator = part.IndexOf('=');
            string name = (separator < 0 ? part : part[..separator]).Trim();
            // Check presence, including expired/invalid and chunked cookies: no cache lookup either.
            if (IsCookieOrChunk(name, authCookie)
                || IsCookieOrChunk(name, authCookie + Constants.Security.BackOfficeExposedCookieNamePostfix)
                || IsCookieOrChunk(name, Constants.Security.BackOfficeExternalCookieName)
                || name.Equals(Constants.Web.PreviewCookieName, StringComparison.OrdinalIgnoreCase)
                || name.Equals(Constants.Web.AcceptPreviewCookieName, StringComparison.OrdinalIgnoreCase))
                return false;
        }

        return base.IsCacheable(context, content);
    }

    protected override bool ShouldExcludeAuthenticated(HttpContext context)
        => context.User.Identities.Any(identity => identity.IsAuthenticated);

    private static bool IsCookieOrChunk(string name, string cookieName)
    {
        if (string.IsNullOrEmpty(cookieName)) return false;
        if (name.Equals(cookieName, StringComparison.OrdinalIgnoreCase)) return true;
        if (!name.StartsWith(cookieName + "C", StringComparison.OrdinalIgnoreCase)) return false;
        ReadOnlySpan<char> suffix = name.AsSpan(cookieName.Length + 1);
        return !suffix.IsEmpty && suffix.IndexOfAnyExceptInRange('0', '9') < 0;
    }
}

public sealed class PublicPageCacheVaryBy : IWebsiteOutputCacheVaryByProvider
{
    public void ConfigureVaryBy(HttpContext context, CacheVaryByRules rules)
    {
        // ASP.NET already keys by scheme, host and path. Include every page/filter parameter.
        rules.QueryKeys = "*";
        rules.HeaderNames = HeaderNames.AcceptLanguage;
    }
}

public sealed class PublicPageCacheResponsePolicy : IOutputCachePolicy
{
    public ValueTask CacheRequestAsync(OutputCacheContext context, CancellationToken cancellationToken)
        => ValueTask.CompletedTask;

    public ValueTask ServeFromCacheAsync(OutputCacheContext context, CancellationToken cancellationToken)
        => ValueTask.CompletedTask;

    public ValueTask ServeResponseAsync(OutputCacheContext context, CancellationToken cancellationToken)
    {
        HttpResponse response = context.HttpContext.Response;
        if (response.StatusCode != StatusCodes.Status200OK
            || response.ContentType?.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) != true
            || response.Headers.ContainsKey(HeaderNames.SetCookie)
            || response.Headers.Vary.Any(value => value?.Split(',').Any(token => token.Trim() == "*") == true)
            || (CacheControlHeaderValue.TryParse(response.Headers.CacheControl.ToString(), out var cacheControl)
                && (cacheControl.NoStore || cacheControl.NoCache || cacheControl.Private)))
            context.AllowCacheStorage = false;

        return ValueTask.CompletedTask;
    }
}

public sealed class PublicPageCacheInvalidation(IOutputCacheStore store)
    : INotificationAsyncHandler<ContentCacheRefresherNotification>
{
    public Task HandleAsync(ContentCacheRefresherNotification notification, CancellationToken cancellationToken)
    {
        // Fired after Umbraco refreshes published content, also on receiving distributed refreshes.
        // Lists, menus and shared blocks can depend on any changed document, so evict every page.
        return store.EvictByTagAsync(Constants.Website.OutputCache.AllContentTag, cancellationToken).AsTask();
    }
}
