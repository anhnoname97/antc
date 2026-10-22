using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.Administration;

/// <summary>Cau hinh thanh vien demo nhom Ban to chuc quay so (section DrawDemo:Member), chi dung o Development.</summary>
public sealed record DrawDemoMemberOptions(string UserName, string Email, string Name, string Password)
{
    public const string SectionPath = "DrawDemo:Member";
    private const string PlaceholderPrefix = "__";

    /// <summary>Tra ve cau hinh hop le, hoac null khi khong phai Development, thieu truong, hoac mat khau la chuoi giu cho.</summary>
    public static DrawDemoMemberOptions? TryRead(IConfiguration configuration, bool isDevelopment)
    {
        if (!isDevelopment) return null;
        IConfigurationSection section = configuration.GetSection(SectionPath);
        string? userName = section["UserName"], email = section["Email"], name = section["Name"], password = section["Password"];
        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(email)
            || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(password)) return null;
        if (password.StartsWith(PlaceholderPrefix, StringComparison.Ordinal)) return null;
        return new DrawDemoMemberOptions(userName, email, name, password);
    }
}

public sealed class DrawDemoMemberComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) =>
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, DrawDemoMemberInitializer>();
}

/// <summary>Tao thanh vien demo thuoc nhom quay so khi khoi dong o Development; thanh vien da co thi chi bao dam thuoc nhom.</summary>
public sealed class DrawDemoMemberInitializer(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    IHostEnvironment environment,
    ILogger<DrawDemoMemberInitializer> logger)
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        DrawDemoMemberOptions? options = DrawDemoMemberOptions.TryRead(configuration, environment.IsDevelopment());
        if (options is null) return;

        try
        {
            using IServiceScope scope = scopeFactory.CreateScope();
            var members = scope.ServiceProvider.GetRequiredService<IMemberManager>();
            var groups = scope.ServiceProvider.GetRequiredService<IMemberGroupService>();

            // Thu tu giua cac handler khong chac chan nen tu bao dam nhom ton tai.
            if (await groups.GetByNameAsync(DrawMemberAccess.MemberGroupName) is null)
            {
                var createdGroup = await groups.CreateAsync(new MemberGroup { Name = DrawMemberAccess.MemberGroupName });
                if (!createdGroup.Success && await groups.GetByNameAsync(DrawMemberAccess.MemberGroupName) is null)
                {
                    logger.LogWarning("Khong tao duoc nhom {Group} cho thanh vien demo: {Status}", DrawMemberAccess.MemberGroupName, createdGroup.Status);
                    return;
                }
            }

            MemberIdentityUser? member = await members.FindByNameAsync(options.UserName);
            if (member is null)
            {
                member = MemberIdentityUser.CreateNew(options.UserName, options.Email, "Member", isApproved: true, options.Name);
                IdentityResult created = await members.CreateAsync(member, options.Password);
                if (!created.Succeeded)
                {
                    logger.LogWarning("Khong tao duoc thanh vien demo {UserName}: {Errors}", options.UserName, DescribeErrors(created));
                    return;
                }
            }

            // Thanh vien da ton tai: khong doi mat khau, khong mo khoa; chi bao dam thuoc nhom.
            IList<string> roles = await members.GetRolesAsync(member);
            if (!roles.Contains(DrawMemberAccess.MemberGroupName, StringComparer.Ordinal))
            {
                IdentityResult added = await members.AddToRolesAsync(member, [DrawMemberAccess.MemberGroupName]);
                if (!added.Succeeded)
                {
                    logger.LogWarning("Khong them duoc thanh vien demo {UserName} vao nhom {Group}: {Errors}",
                        options.UserName, DrawMemberAccess.MemberGroupName, DescribeErrors(added));
                    return;
                }
            }

            logger.LogInformation("Thanh vien demo {UserName} da san sang trong nhom {Group}.", options.UserName, DrawMemberAccess.MemberGroupName);
        }
        catch (Exception ex)
        {
            // Chi log kieu loi, khong de lam sap ung dung va khong lo thong tin cau hinh.
            logger.LogWarning("Khong khoi tao duoc thanh vien demo quay so: {ExceptionType}", ex.GetType().Name);
        }
    }

    private static string DescribeErrors(IdentityResult result) => string.Join(", ", result.Errors.Select(e => e.Code));
}
