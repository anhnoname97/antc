using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Formatting.Compact;
using Umbraco.Plugin.Custom.Api.Infrastructure;

namespace Umbraco.Plugin.Custom.Tests;

public class ApiProtectionTests
{
    private sealed class HealthOnly : IApplicationFeatureProvider<ControllerFeature>
    {
        public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature)
        {
            foreach (var controller in feature.Controllers.Where(c => c.AsType() != typeof(HealthzController)).ToArray())
                feature.Controllers.Remove(controller);
        }
    }
    private sealed class Readiness(bool readable) : IDatabaseReadiness
    {
        public Task<bool> CanReadAsync(CancellationToken ct) => Task.FromResult(readable);
    }

    private sealed class Host : IAsyncDisposable
    {
        private readonly WebApplication app;
        private readonly Serilog.Core.Logger log;
        public HttpClient Client { get; }
        public string LogFile { get; }

        private Host(WebApplication application, Serilog.Core.Logger logger, string logFile, string address)
        {
            app = application; log = logger; LogFile = logFile;
            Client = new HttpClient { BaseAddress = new Uri(address) };
        }

        public static async Task<Host> StartAsync(bool readable = true, bool trusted = true)
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Production" });
            builder.WebHost.ConfigureKestrel(o => o.Listen(IPAddress.Loopback, 0));
            builder.Services.AddAntcApiProtection(new ConfigurationBuilder().Build());
            var accessor = new HttpContextAccessor();
            builder.Services.AddSingleton<IHttpContextAccessor>(accessor);
            builder.Services.AddSingleton<IDatabaseReadiness>(new Readiness(readable));
            builder.Services.AddControllers().AddApplicationPart(typeof(HealthzController).Assembly)
                .ConfigureApplicationPartManager(m => m.FeatureProviders.Add(new HealthOnly()));
            string file = Path.Combine(Path.GetTempPath(), $"antc-api-log-{Guid.NewGuid():N}.json");
            var logger = new LoggerConfiguration().MinimumLevel.Verbose().Enrich.FromLogContext()
                .Filter.With(new ApiPrivacyLogFilter(accessor))
                .WriteTo.File(new CompactJsonFormatter(), file, shared: true).CreateLogger();
            builder.Logging.ClearProviders();
            builder.Logging.AddSerilog(logger);
            var app = builder.Build();
            if (!trusted)
                app.Use(async (c, next) => { c.Connection.RemoteIpAddress = IPAddress.Parse("203.0.113.50"); await next(c); });
            app.UseForwardedHeaders();
            app.UseMiddleware<ApiBoundaryMiddleware>();
            app.UseRateLimiter();
            app.MapPost("/api/v1/contest/entries", () => Results.Json(new { code = "AD-ABCDEF" }, statusCode: 201));
            app.MapPost("/api/v1/contest/entries/me/answers", () => Results.Ok(new { stored = true }));
            app.MapPut("/api/v1/contest/entries/me/contact", () => Results.Ok());
            app.MapPost("/api/v1/contest/entries/me/submit", () => Results.Ok());
            app.MapPost("/api/v1/questions", () => Results.StatusCode(201));
            app.MapPost("/api/probe", (HttpContext c) =>
            {
                // Deliberately try to leak sensitive properties, query and exception into every sink.
                c.RequestServices.GetRequiredService<ILogger<ApiProtectionTests>>().LogWarning(
                    new Exception("Nguyễn Văn Bí Mật 0912345678 private-token-secret"),
                    "Unsafe {FullName} {Phone} {Token} {Question}", "Nguyễn Văn Bí Mật", "0912345678", "private-token-secret", "nội dung câu hỏi bí mật");
                return Results.Ok(new { length = c.Request.Body.Length });
            });
            app.MapGet("/api/fail", (Func<IResult>)(() => throw new InvalidOperationException("Nguyễn Văn Bí Mật 0912345678")));
            app.MapGet("/api/status/{status:int}", (int status) => Results.StatusCode(status));
            app.MapGet("/api/binding", (int number) => Results.Ok(number));
            app.MapControllers();
            await app.StartAsync();
            string address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
            return new Host(app, logger, file, address);
        }

        public async ValueTask DisposeAsync()
        {
            Client.Dispose();
            await app.StopAsync();
            await app.DisposeAsync();
            await log.DisposeAsync();
            File.Delete(LogFile);
        }
    }

    private static async Task AssertError(HttpResponseMessage response, HttpStatusCode status, string code)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var error = body.RootElement.GetProperty("error");
        Assert.Equal(code, error.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(error.GetProperty("message").GetString()));
        Assert.Contains(error.GetProperty("message").GetString()!, c => c > 127);
        Assert.Equal(JsonValueKind.Object, error.GetProperty("fields").ValueKind);
    }

    [Fact]
    public async Task Limits_EnforceAllFourQuotas_WithRetryAfter_AndIsolateTokensAndIps()
    {
        await using var host = await Host.StartAsync();
        for (int i = 0; i < 10; i++)
            Assert.Equal(HttpStatusCode.Created, (await host.Client.PostAsync("/api/v1/contest/entries", null)).StatusCode);
        using var rejected = await host.Client.PostAsync("/api/v1/contest/entries/", null);
        await AssertError(rejected, HttpStatusCode.TooManyRequests, "RATE_LIMITED");
        Assert.True(rejected.Headers.RetryAfter!.Delta > TimeSpan.Zero);
        host.Client.DefaultRequestHeaders.Add("X-Forwarded-For", "198.51.100.1");
        Assert.Equal(HttpStatusCode.Created, (await host.Client.PostAsync("/api/v1/contest/entries", null)).StatusCode);

        host.Client.DefaultRequestHeaders.Add("X-Entry-Token", "first-token");
        for (int i = 0; i < 120; i++)
            Assert.Equal(HttpStatusCode.OK, (await host.Client.PostAsync("/api/v1/contest/entries/me/answers", null)).StatusCode);
        using var answers = await host.Client.PostAsync("/api/v1/contest/entries/me/answers", null);
        await AssertError(answers, HttpStatusCode.TooManyRequests, "RATE_LIMITED");
        Assert.InRange(answers.Headers.RetryAfter!.Delta!.Value.TotalSeconds, 1, 60);
        host.Client.DefaultRequestHeaders.Remove("X-Entry-Token");
        host.Client.DefaultRequestHeaders.Add("X-Entry-Token", "second-token");
        Assert.Equal(HttpStatusCode.OK, (await host.Client.PostAsync("/api/v1/contest/entries/me/answers", null)).StatusCode);

        for (int i = 0; i < 20; i++)
        {
            using var response = i % 2 == 0
                ? await host.Client.PutAsync("/api/v1/contest/entries/me/contact", null)
                : await host.Client.PostAsync("/api/v1/contest/entries/me/submit", null);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        using var finalize = await host.Client.PostAsync("/api/v1/contest/entries/me/submit", null);
        await AssertError(finalize, HttpStatusCode.TooManyRequests, "RATE_LIMITED");
        Assert.True(finalize.Headers.RetryAfter!.Delta > TimeSpan.Zero);
        for (int i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Created, (await host.Client.PostAsync("/api/v1/questions", null)).StatusCode);
        using var questions = await host.Client.PostAsync("/api/v1/questions", null);
        await AssertError(questions, HttpStatusCode.TooManyRequests, "RATE_LIMITED");
        Assert.True(questions.Headers.RetryAfter!.Delta > TimeSpan.Zero);
    }

    [Fact]
    public async Task UntrustedClient_CannotResetIpQuotaUsingSpoofedForwardedHeader()
    {
        await using var host = await Host.StartAsync(trusted: false);
        for (int i = 0; i < 11; i++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/contest/entries");
            request.Headers.Add("X-Forwarded-For", $"198.51.100.{i + 1}");
            using var response = await host.Client.SendAsync(request);
            Assert.Equal(i < 10 ? HttpStatusCode.Created : HttpStatusCode.TooManyRequests, response.StatusCode);
        }
    }

    [Theory]
    [InlineData(400, "VALIDATION")]
    [InlineData(401, "UNAUTHORIZED")]
    [InlineData(403, "FORBIDDEN")]
    [InlineData(404, "NOT_FOUND")]
    [InlineData(405, "METHOD_NOT_ALLOWED")]
    [InlineData(415, "UNSUPPORTED_MEDIA_TYPE")]
    [InlineData(500, "SERVER_ERROR")]
    public async Task EmptyFrameworkErrors_UseVietnameseEnvelope(int status, string code)
    {
        await using var host = await Host.StartAsync();
        using var response = await host.Client.GetAsync($"/api/status/{status}");
        await AssertError(response, (HttpStatusCode)status, code);
    }

    [Fact]
    public async Task RoutingBindingAndExceptionErrors_UseSameEnvelope()
    {
        await using var host = await Host.StartAsync();
        await AssertError(await host.Client.GetAsync("/api/no-such-route"), HttpStatusCode.NotFound, "NOT_FOUND");
        await AssertError(await host.Client.GetAsync("/api/v1/contest/entries"), HttpStatusCode.MethodNotAllowed, "METHOD_NOT_ALLOWED");
        await AssertError(await host.Client.GetAsync("/api/binding?number=not-a-number"), HttpStatusCode.BadRequest, "VALIDATION");
        await AssertError(await host.Client.GetAsync("/api/fail"), HttpStatusCode.InternalServerError, "SERVER_ERROR");
    }

    private sealed class UnknownLengthContent(byte[] bytes) : HttpContent
    {
        protected override bool TryComputeLength(out long length) { length = 0; return false; }
        protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context) => stream.WriteAsync(bytes).AsTask();
    }

    [Fact]
    public async Task BodyLimit_UsesUtf8Bytes_AlsoRejectsChunkedRequests()
    {
        await using var host = await Host.StartAsync();
        using var exact = await host.Client.PostAsync("/api/probe", new ByteArrayContent(new byte[16 * 1024]));
        Assert.Equal(HttpStatusCode.OK, exact.StatusCode);
        using var over = await host.Client.PostAsync("/api/probe", new StringContent(new string('ệ', 6000), Encoding.UTF8));
        await AssertError(over, HttpStatusCode.RequestEntityTooLarge, "REQUEST_TOO_LARGE");
        using var chunked = await host.Client.PostAsync("/api/probe", new UnknownLengthContent(new byte[16 * 1024 + 1]));
        await AssertError(chunked, HttpStatusCode.RequestEntityTooLarge, "REQUEST_TOO_LARGE");
    }

    [Fact]
    public async Task FileLog_ContainsOnlyAuditCodes_NoPersonalInformationOrException()
    {
        await using var host = await Host.StartAsync();
        using var probe = await host.Client.PostAsJsonAsync("/api/probe?phone=0912345678", new
        {
            fullName = "Nguyễn Văn Bí Mật", phone = "0912345678", token = "private-token-secret", content = "nội dung câu hỏi bí mật",
        });
        await host.Client.PostAsync("/api/v1/contest/entries", null);
        await host.Client.GetAsync("/api/fail");
        await using var file = new FileStream(host.LogFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        using var reader = new StreamReader(file);
        string log = await reader.ReadToEndAsync();
        Assert.Contains("AD-ABCDEF", log);
        Assert.Contains("SERVER_ERROR", log);
        foreach (string secret in new[] { "0912345678", "Nguyễn", "private-token-secret", "nội dung câu hỏi bí mật", "FullName", "Question", "RequestPath" })
            Assert.DoesNotContain(secret, log, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ExcelBodyException_DoesNotRaiseLimitsForOtherPathsOrMethods()
    {
        await using var host = await Host.StartAsync();
        // This host has no workbook controller: passing the boundary reaches routing (404), not 413.
        using var upload = await host.Client.PostAsync("/api/v1/admin/quiz/imports/preview", new UnknownLengthContent(new byte[17000]));
        Assert.Equal(HttpStatusCode.NotFound, upload.StatusCode);
        await AssertError(await host.Client.PostAsync("/api/v1/admin/quiz/imports/confirm", new ByteArrayContent(new byte[17000])), HttpStatusCode.RequestEntityTooLarge, "REQUEST_TOO_LARGE");
        await AssertError(await host.Client.PostAsync("/api/v1/admin/quiz/imports/preview/other", new ByteArrayContent(new byte[17000])), HttpStatusCode.RequestEntityTooLarge, "REQUEST_TOO_LARGE");
        using var get = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/quiz/imports/preview") { Content = new ByteArrayContent(new byte[17000]) };
        await AssertError(await host.Client.SendAsync(get), HttpStatusCode.RequestEntityTooLarge, "REQUEST_TOO_LARGE");
        await AssertError(await host.Client.PostAsync("/api/v1/admin/quiz/imports/preview", new UnknownLengthContent(new byte[5 * 1024 * 1024 + 65537])), HttpStatusCode.RequestEntityTooLarge, "REQUEST_TOO_LARGE");
    }

    [Theory]
    [InlineData(true, HttpStatusCode.OK)]
    [InlineData(false, HttpStatusCode.ServiceUnavailable)]
    public async Task Healthz_ReflectsDatabaseReadiness(bool readable, HttpStatusCode expected)
    {
        await using var host = await Host.StartAsync(readable);
        using var response = await host.Client.GetAsync("/healthz");
        Assert.Equal(expected, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }
}
