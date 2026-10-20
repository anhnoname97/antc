using System.Net;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
using Antc.ContestAdministration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security.Authorization;
using Umbraco.Cms.Core.Strings;
using Umbraco.Plugin.Custom.Api.Infrastructure;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class ContestAdministrationPageTests
{
    [Fact] public void AdminPagesArePrecompiled_ButUmbracoViewsRemainRuntimeCompiled()
    {
        var pages=typeof(ReportPage).Assembly.GetCustomAttributes(typeof(Microsoft.AspNetCore.Razor.Hosting.RazorCompiledItemAttribute),false)
            .Cast<Microsoft.AspNetCore.Razor.Hosting.RazorCompiledItemAttribute>().Select(x=>x.Identifier).ToArray();
        Assert.Contains("/Pages/QuanTri/Dashboard.cshtml",pages);
        Assert.DoesNotContain(pages,p=>p.StartsWith("/Views/",StringComparison.Ordinal));
    }
    private sealed class NoControllers : IApplicationFeatureProvider<ControllerFeature>
    {
        public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature) => feature.Controllers.Clear();
    }
    private sealed class Users : IAuthorizationHelper
    {
        public static readonly Guid Key=new("86602053-fc77-44ed-b0d9-7d11f3a2c7b3");
        public IUser GetUmbracoUser(IPrincipal principal)
        {
            if (principal.Identity?.IsAuthenticated != true) throw new InvalidOperationException();
            var user=new User(new GlobalSettings()){Key=Key};
            var strings=new DefaultShortStringHelper(Options.Create(new RequestHandlerSettings()));
            user.AddGroup(new UserGroup(strings){Alias=principal.IsInRole(AdministrationAccess.GroupAlias)?AdministrationAccess.GroupAlias:Constants.Security.AdminGroupAlias});
            return user;
        }
    }

    private sealed class Host : IAsyncDisposable
    {
        public readonly ContestReportingTests.Fixture Fixture;
        private readonly WebApplication app;
        public readonly HttpClient Client;
        private Host(WebApplication app,ContestReportingTests.Fixture fixture,string url)
        {
            this.app=app;Fixture=fixture;
            Client=new(new HttpClientHandler{AllowAutoRedirect=false}){BaseAddress=new Uri(url)};
        }
        public static async Task<Host> StartAsync()
        {
            var fixture=await ContestReportingTests.Fixture.CreateAsync();
            var builder=WebApplication.CreateBuilder(new WebApplicationOptions {ApplicationName=typeof(ReportPage).Assembly.GetName().Name,EnvironmentName="Development"});
            builder.Logging.ClearProviders();
            builder.WebHost.ConfigureKestrel(o=>o.Listen(IPAddress.Loopback,0));
            builder.Services.AddRazorPages(o=>o.Conventions.AuthorizeFolder("/QuanTri",AdministrationAccess.Policy))
                .AddApplicationPart(typeof(ReportPage).Assembly)
                .ConfigureApplicationPartManager(m=>m.FeatureProviders.Add(new NoControllers()));
            builder.Services.AddAuthentication(Constants.Security.BackOfficeAuthenticationType).AddCookie(Constants.Security.BackOfficeAuthenticationType);
            builder.Services.AddAuthorization(o=>o.AddPolicy(AdministrationAccess.Policy,p=>p.AddAuthenticationSchemes(Constants.Security.BackOfficeAuthenticationType)
                .RequireAuthenticatedUser().AddRequirements(new ContestAdministrationRequirement())));
            builder.Services.AddSingleton<IAuthorizationHandler,ContestAdministrationAuthorizationHandler>();
            builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler,ContestAdministrationAuthorizationResult>();
            builder.Services.AddSingleton<IAuthorizationHelper,Users>();
            builder.Services.AddScoped(_=>new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(fixture.Db.Database.GetDbConnection()).Options));
            builder.Services.AddScoped<ContestReportingService>(); builder.Services.AddScoped<ContestAuditService>();
            builder.Services.AddSingleton(TimeProvider.System);
            builder.Services.AddAdministrationIpAllowlist(new ConfigurationBuilder().Build(),builder.Environment);
            var app=builder.Build();
            app.UseMiddleware<AdministrationIpAllowlistMiddleware>();
            app.UseAuthentication();app.UseAuthorization();
            // Test-only session issuer, never part of the deployed web application.
            app.MapGet("/test-session/{group}",async (HttpContext c,string group)=>{
                var principal=new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier,Users.Key.ToString()),new Claim(ClaimTypes.Role,group)],Constants.Security.BackOfficeAuthenticationType));
                await c.SignInAsync(Constants.Security.BackOfficeAuthenticationType,principal);
                return Results.Ok();
            });
            app.MapRazorPages();await app.StartAsync();
            return new(app,fixture,app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single());
        }
        public async ValueTask DisposeAsync(){Client.Dispose();await app.StopAsync();await app.DisposeAsync();await Fixture.DisposeAsync();}
    }

    [Fact] public async Task EveryRazorPage_RequiresBackofficeSession_AndExactGroupEvenForAdministrator()
    {
        await using var host=await Host.StartAsync();
        string[] paths=["/quan-tri","/quan-tri/cuoc-thi","/quan-tri/luot-thi","/quan-tri/luot-thi/1","/quan-tri/thong-ke-cau-hoi"];
        foreach(var path in paths) Assert.Equal(HttpStatusCode.Unauthorized,(await host.Client.GetAsync(path)).StatusCode);
        await host.Client.GetAsync("/test-session/"+Constants.Security.AdminGroupAlias);
        foreach(var path in paths) Assert.Equal(HttpStatusCode.Forbidden,(await host.Client.GetAsync(path)).StatusCode);
        await host.Client.GetAsync("/test-session/"+AdministrationAccess.GroupAlias);
        foreach(var path in paths.Skip(1))
        {
            var response=await host.Client.GetAsync(path);
            Assert.True(response.StatusCode==HttpStatusCode.OK,$"{path}: {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
            Assert.True(response.Headers.CacheControl?.NoStore);
            Assert.Contains("no-referrer",response.Headers.GetValues("Referrer-Policy"));
        }
        Assert.Equal("view.detail",(await host.Fixture.Db.ContestAccessAudits.SingleAsync()).Action);
    }

    [Fact] public async Task CsvPost_RequiresAntiforgery_ExportsAllMatchingRows_AndAudits()
    {
        await using var host=await Host.StartAsync();
        await host.Client.GetAsync("/test-session/"+AdministrationAccess.GroupAlias);
        var noToken=await host.Client.PostAsync("/quan-tri/luot-thi?handler=Export",new FormUrlEncodedContent(new Dictionary<string,string>{{"kind","entries"}}));
        Assert.Equal(HttpStatusCode.BadRequest,noToken.StatusCode);
        string html=await host.Client.GetStringAsync("/quan-tri/luot-thi?Filter.Status=submitted&Filter.HasPhone=true");
        Assert.Contains("AD-TST001",html);Assert.DoesNotContain("AD-TST003",html);
        string token=WebUtility.HtmlDecode(Regex.Match(html,"name=\"__RequestVerificationToken\"[^>]*value=\"([^\"]+)\"").Groups[1].Value);
        Assert.NotEmpty(token);
        var body=new Dictionary<string,string>{{"kind","entries"},{"__RequestVerificationToken",token},{"Filter.Status","submitted"},{"Filter.HasPhone","true"}};
        var response=await host.Client.PostAsync("/quan-tri/luot-thi?handler=Export",new FormUrlEncodedContent(body));
        Assert.Equal(HttpStatusCode.OK,response.StatusCode);
        var bytes=await response.Content.ReadAsByteArrayAsync();
        Assert.Equal(new byte[]{239,187,191},bytes[..3]);
        string csv=Encoding.UTF8.GetString(bytes);Assert.Contains("Nguyễn Văn An",csv);Assert.DoesNotContain("AD-TST003",csv);
        Assert.Equal("export.entries",(await host.Fixture.Db.ContestAccessAudits.SingleAsync()).Action);
        Assert.Equal(Users.Key,(await host.Fixture.Db.ContestAccessAudits.SingleAsync()).ActorUserKey);
    }
}
