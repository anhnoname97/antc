using System.Text.Encodings.Web;
using System.Text.Unicode;
using Microsoft.Extensions.WebEncoders;
using Microsoft.AspNetCore.Authorization;
using Umbraco.Cms.Core;
using Umbraco.Cms.Web.UI.Security;
using Umbraco.Plugin.Custom.Core.Administration;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Cau hinh rieng tung may (khong commit): tai khoan quan tri local, chuoi ket noi...
// File nay do run-local tao lan dau.
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Xuat tieng Viet nguyen ky tu trong HTML (mac dinh Razor ma hoa thanh ky hieu so)
builder.Services.Configure<WebEncoderOptions>(o => o.TextEncoderSettings = new TextEncoderSettings(UnicodeRanges.All));

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

builder.Services.AddRazorPages(options =>
    options.Conventions.AuthorizeFolder("/Administration", AdministrationAccess.Policy));
builder.Services.AddAuthorization(options => options.AddPolicy(AdministrationAccess.Policy, policy =>
{
    policy.AuthenticationSchemes.Add(Constants.Security.BackOfficeAuthenticationType);
    policy.RequireAuthenticatedUser();
    policy.RequireRole(AdministrationAccess.GroupAlias);
}));
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, AdministrationAuthorizationResultHandler>();

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
        u.EndpointRouteBuilder.MapRazorPages();
    });

await app.RunAsync();
