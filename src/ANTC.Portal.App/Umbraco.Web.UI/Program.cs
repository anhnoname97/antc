using System.Text.Encodings.Web;
using System.Text.Unicode;
using Microsoft.Extensions.WebEncoders;
using Umbraco.Plugin.Custom.Api.Infrastructure;
using Antc.Deployment;
using Microsoft.AspNetCore.DataProtection;
using Antc.Infrastructure;
using Antc.Web;

// Offline command: no Umbraco host, no migrations and no service is started during backup.
if (args.FirstOrDefault() == "--deployment-backup")
{
    try
    {
        if (args.Length != 4) throw new ArgumentException("BACKUP_ARGUMENTS_INVALID");
        Environment.ExitCode = Umbraco.Plugin.Custom.Core.Data.SqliteDeploymentBackup.Create(args[1], args[2], args[3]);
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine("BACKUP_FAILED: " + ex.GetType().Name);
        Environment.ExitCode = 1;
    }
    return;
}

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Cau hinh rieng tung may (khong commit): tai khoan quan tri local, chuoi ket noi...
// File nay do run-local tao lan dau.
if (builder.Environment.IsDevelopment())
    builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
// Environment and explicit CLI values always override local JSON.
builder.Configuration.AddEnvironmentVariables().AddCommandLine(args);
builder.Services.AddWindowsService();
builder.Services.Configure<Microsoft.AspNetCore.Mvc.MvcOptions>(options =>
{
    options.Filters.Add<BackofficeBrandingViewFilter>();
    options.Filters.Add<ArticlePropertyPermissionsFilter>();
});
builder.Services.AddAntcApiProtection(builder.Configuration);
builder.Services.AddAdministrationIpAllowlist(builder.Configuration, builder.Environment);
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationMiddlewareResultHandler,
    ContestAdministrationAuthorizationResult>();
if (builder.Configuration["Deployment:DataProtectionKeysPath"] is { Length: > 0 } keys)
{
    var protection = builder.Services.AddDataProtection().SetApplicationName("ANTC.Portal")
        .PersistKeysToFileSystem(new DirectoryInfo(keys));
    if (OperatingSystem.IsWindows()) protection.ProtectKeysWithDpapi();
}

// Xuat tieng Viet nguyen ky tu trong HTML (mac dinh Razor ma hoa thanh ky hieu so)
builder.Services.Configure<WebEncoderOptions>(o => o.TextEncoderSettings = new TextEncoderSettings(UnicodeRanges.All));

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .AddPublicSitePerformance()
    .Build();

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

if (DeploymentOperations.IsImportPending(app))
{
    // Nhap uSync lan dau mat vai phut. Trong luc do mot may chu tam giu cong de nen tang trien khai
    // thay ung dung con song; nhap xong thi tat no truoc khi ung dung that nghe cong.
    WebApplication? placeholder = await DeploymentOperations.StartPlaceholderAsync(app);
    try
    {
        await DeploymentOperations.ImportStructureAsync(app);
    }
    finally
    {
        if (placeholder is not null)
        {
            await placeholder.StopAsync();
            await placeholder.DisposeAsync();
        }
    }
}

// IP thật phải được xác định trước khi chia hạn mức và băm IP của lượt thi/câu hỏi.
app.UseForwardedHeaders();
app.UseBackofficeBranding();
app.UsePublicSitePerformance();
app.UseWebsiteErrorPages(app.Environment);
app.UseMiddleware<ApiBoundaryMiddleware>();
app.UseMiddleware<DeploymentTrafficGateMiddleware>();
app.UseMiddleware<AdministrationIpAllowlistMiddleware>();
app.UseRateLimiter();
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/healthz" && app.Configuration["Deployment:ReleaseId"] is { } release)
        context.Response.Headers["X-ANTC-Release"] = release;
    await next(context);
});

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
    });

await app.RunAsync();
