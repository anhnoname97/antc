using System.Text;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Services;

namespace Antc.Infrastructure;

public sealed class PublicErrorPageOptions
{
    public const string SectionName = "ErrorPages";

    /// <summary>File HTML của lỗi 500, tính từ thư mục gốc ứng dụng; không dùng Razor hoặc CSDL.</summary>
    public string ServerErrorFile { get; set; } = "ErrorPages/500.html";

    /// <summary>Bật khi cần thử trang 500 ở local; mặc định giữ trang chẩn đoán của Development.</summary>
    public bool UseInDevelopment { get; set; }
}

public static class PublicErrorPagesExtensions
{
    private static readonly string[] ExcludedPrefixes = ["/api", "/umbraco", "/quan-tri", "/assets", "/media", "/App_Plugins", "/healthz"];

    public static IServiceCollection AddPublicErrorPages(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<PublicErrorPageOptions>(configuration.GetSection(PublicErrorPageOptions.SectionName));
        services.AddSingleton<StaticServerErrorPage>();
        return services;
    }

    public static IApplicationBuilder UsePublicErrorPages(this IApplicationBuilder app)
    {
        var environment = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();
        var options = app.ApplicationServices.GetRequiredService<IOptionsMonitor<PublicErrorPageOptions>>();
        if (environment.IsDevelopment() && !options.CurrentValue.UseInDevelopment) return app;

        return app.UseWhen(IsPublicHtmlRequest, branch =>
        {
            branch.UseExceptionHandler(new ExceptionHandlerOptions
            {
                // Không đưa thông tin exception/SQL/request ra trang công khai hoặc log mặc định.
                SuppressDiagnosticsCallback = _ => true,
                ExceptionHandler = context => context.RequestServices.GetRequiredService<StaticServerErrorPage>().WriteAsync(context)
            });
            branch.UseStatusCodePages(context => context.HttpContext.Response.StatusCode == StatusCodes.Status500InternalServerError
                ? context.HttpContext.RequestServices.GetRequiredService<StaticServerErrorPage>().WriteAsync(context.HttpContext)
                : Task.CompletedTask);
            branch.Use(async (context, next) =>
            {
                // Khi CMS không khởi động được, không đi qua template hoặc trang BootFailed của Umbraco.
                if (context.RequestServices.GetService<IRuntimeState>()?.Level == RuntimeLevel.BootFailed)
                    await context.RequestServices.GetRequiredService<StaticServerErrorPage>().WriteAsync(context);
                else
                    await next(context);
            });
        });
    }

    private static bool IsPublicHtmlRequest(HttpContext context)
    {
        // API/backoffice có hợp đồng lỗi riêng. File tĩnh và health check không phải trang portal.
        if (ExcludedPrefixes.Any(prefix => context.Request.Path.StartsWithSegments(prefix, StringComparison.OrdinalIgnoreCase))) return false;

        var accept = context.Request.Headers.Accept;
        return accept.Count == 0 || accept.Any(value => value?.Split(',').Any(part =>
            MediaTypeHeaderValue.TryParse(part, out var type) && type.Quality.GetValueOrDefault(1) > 0 &&
            (type.MediaType.Equals("text/html", StringComparison.OrdinalIgnoreCase)
                || type.MediaType.Equals("text/*", StringComparison.OrdinalIgnoreCase)
                || type.MediaType.Equals("*/*", StringComparison.OrdinalIgnoreCase))) == true);
    }
}

internal sealed class StaticServerErrorPage(IWebHostEnvironment environment,
    IOptionsMonitor<PublicErrorPageOptions> options, ILogger<StaticServerErrorPage> logger)
{
    private const string Fallback = """
        <!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="robots" content="noindex,nofollow"><title>Hệ thống tạm thời gián đoạn</title></head>
        <body><main><h1>Hệ thống tạm thời gián đoạn</h1><p>Vui lòng thử lại sau ít phút.</p><a href="/">Về trang chủ</a></main></body></html>
        """;

    public async Task WriteAsync(HttpContext context)
    {
        string html = await ReadAsync(context.RequestAborted);
        // Chỉ ghi mã theo dõi do máy chủ tạo, không ghi URL/query, nội dung hoặc chi tiết exception.
        logger.LogError("Trang công khai trả lỗi 500. Mã theo dõi: {TraceId}", context.TraceIdentifier);
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "text/html; charset=utf-8";
        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers["X-Robots-Tag"] = "noindex, nofollow";
        context.Response.ContentLength = Encoding.UTF8.GetByteCount(html);
        if (!HttpMethods.IsHead(context.Request.Method))
            await context.Response.WriteAsync(html, context.RequestAborted);
    }

    private async Task<string> ReadAsync(CancellationToken ct)
    {
        string? path = options.CurrentValue.ServerErrorFile;
        // Tùy chỉnh được file trong ứng dụng, không đọc file ngoài thư mục triển khai.
        if (string.IsNullOrWhiteSpace(path) || Path.IsPathRooted(path)
            || path.Split(['/', '\\']).Any(segment => segment == "..")) return Fallback;

        try
        {
            var file = environment.ContentRootFileProvider.GetFileInfo(path);
            if (!file.Exists || file.IsDirectory) return Fallback;
            await using Stream stream = file.CreateReadStream();
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
            string html = await reader.ReadToEndAsync(ct);
            return string.IsNullOrWhiteSpace(html) ? Fallback : html;
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            logger.LogWarning("Không đọc được file trang lỗi 500 ({ErrorType}).", error.GetType().Name);
            return Fallback;
        }
    }
}
