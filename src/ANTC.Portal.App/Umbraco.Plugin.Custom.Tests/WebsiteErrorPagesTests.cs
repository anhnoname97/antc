using System.Net;
using Antc.Web;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class WebsiteErrorPagesTests : IAsyncLifetime
{
    private const string Page = "<!doctype html><html lang=vi><h1>Server error page</h1><a href=/>Home</a></html>";
    private readonly string _root = Path.Combine(Path.GetTempPath(), "antc-errors-" + Guid.NewGuid().ToString("N"));
    private WebApplication _app = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        string webRoot = Path.Combine(_root, "wwwroot");
        Directory.CreateDirectory(Path.Combine(webRoot, "errors"));
        await File.WriteAllTextAsync(Path.Combine(webRoot, "errors", "500.html"), Page);
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            ContentRootPath = _root,
            WebRootPath = webRoot,
            EnvironmentName = "Production",
        });
        builder.Logging.ClearProviders();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        _app = builder.Build();
        _app.UseWebsiteErrorPages(_app.Environment);
        _app.Run(async context =>
        {
            if (context.Request.Path == "/broken") throw new InvalidOperationException("private-error-detail");
            if (context.Request.Path == "/empty") { context.Response.StatusCode = 500; return; }
            if (context.Request.Path == "/api/failure" || context.Request.Path == "/umbraco/failure")
            {
                context.Response.StatusCode = 500;
                await context.Response.WriteAsJsonAsync(new { error = "original-api-error" });
                return;
            }
            if (context.Request.Path == "/assets/failure.css") { context.Response.StatusCode = 500; return; }
            if (context.Request.Path == "/intentional")
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "text/plain";
                await context.Response.WriteAsync("Intentional response");
                return;
            }
            if (context.Request.Path == "/not-found") { context.Response.StatusCode = 404; return; }
            await context.Response.WriteAsync("Healthy");
        });
        await _app.StartAsync();
        var addresses = _app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!;
        _client = new HttpClient { BaseAddress = new Uri(addresses.Addresses.Single()) };
    }

    [Theory]
    [InlineData("/broken?original=query")]
    [InlineData("/empty")]
    [InlineData("/500")]
    [InlineData("/500/")]
    public async Task PublicErrors_RenderStandalonePageWith500WithoutRedirect(string path)
    {
        var response = await _client.GetAsync(path);
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Null(response.Headers.Location);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(Page, await response.Content.ReadAsStringAsync());
        Assert.True(response.Headers.CacheControl?.NoStore);
        Assert.Contains("noindex", response.Headers.GetValues("X-Robots-Tag").Single());
    }

    [Theory]
    [InlineData("/api/failure")]
    [InlineData("/umbraco/failure")]
    public async Task ApiAndBackoffice_PreserveTheirJsonErrors(string path)
    {
        var response = await _client.GetAsync(path);
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("original-api-error", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task IntentionalBodyAndAssets_AreNotReplaced()
    {
        Assert.Equal("Intentional response", await (await _client.GetAsync("/intentional")).Content.ReadAsStringAsync());
        Assert.Empty(await (await _client.GetAsync("/assets/failure.css")).Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task HealthyAnd404Responses_KeepTheirStatus()
    {
        Assert.Equal("Healthy", await _client.GetStringAsync("/"));
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync("/not-found")).StatusCode);
    }

    [Fact]
    public async Task Head_DoesNotSendAnHtmlBody()
    {
        var response = await _client.SendAsync(new HttpRequestMessage(HttpMethod.Head, "/500/"));
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Empty(await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task PublicPostFailure_ReturnsErrorWithoutRedirectingOrReplayingSubmission()
    {
        var response = await _client.PostAsync("/broken", new StringContent("example=form-data"));
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Null(response.Headers.Location);
        Assert.Equal(Page, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task MissingErrorFile_StillReturnsSafeHtml()
    {
        File.Delete(Path.Combine(_root, "wwwroot", "errors", "500.html"));
        var response = await _client.GetAsync("/broken");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        string body = await response.Content.ReadAsStringAsync();
        Assert.Contains("<!doctype html>", body);
        Assert.DoesNotContain("private-error-detail", body);
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        if (_app is not null) await _app.DisposeAsync();
        string resolvedRoot = Path.GetFullPath(_root);
        string tempRoot = Path.GetFullPath(Path.GetTempPath());
        if (!resolvedRoot.StartsWith(tempRoot, StringComparison.OrdinalIgnoreCase)
            || !Path.GetFileName(resolvedRoot).StartsWith("antc-errors-", StringComparison.Ordinal))
            throw new InvalidOperationException("Unexpected test cleanup path.");
        if (Directory.Exists(resolvedRoot)) Directory.Delete(resolvedRoot, recursive: true);
    }
}
