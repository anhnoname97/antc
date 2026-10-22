using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.Administration;

/// <summary>Quyen vao khu vuc /quay-so: chi thanh vien (Members) thuoc nhom Ban to chuc quay so.</summary>
public static class DrawMemberAccess
{
    public const string MemberGroupName = "Ban tổ chức quay số";
    public const string Policy = "AntcDrawMember";

    /// <summary>Thanh vien da duyet, khong bi khoa va thuoc nhom quay so.</summary>
    public static async Task<bool> IsAllowedAsync(IMemberManager members, MemberIdentityUser? member)
    {
        if (member is null || !member.IsApproved || member.IsLockedOut) return false;
        IList<string> roles = await members.GetRolesAsync(member);
        return roles.Contains(MemberGroupName, StringComparer.Ordinal);
    }
}

public sealed class DrawMemberComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, DrawMemberGroupInitializer>();
        // Cookie thanh vien cua Umbraco (Identity.Application); cookie backoffice la scheme khac nen khong thoa policy.
        builder.Services.Configure<AuthorizationOptions>(options => options.AddPolicy(DrawMemberAccess.Policy,
            policy => policy.AddAuthenticationSchemes(IdentityConstants.ApplicationScheme)
                .RequireAuthenticatedUser().AddRequirements(new DrawMemberRequirement())));
        builder.Services.AddScoped<IAuthorizationHandler, DrawMemberAuthorizationHandler>();
    }
}

public sealed class DrawMemberRequirement : IAuthorizationRequirement;

public sealed class DrawMemberAuthorizationHandler(IMemberManager members) : AuthorizationHandler<DrawMemberRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, DrawMemberRequirement requirement)
    {
        // Chi nhan principal cua cookie thanh vien; principal backoffice khong co identity nay.
        if (context.User.Identities.All(i => i.AuthenticationType != IdentityConstants.ApplicationScheme)) return;
        MemberIdentityUser? member = await members.GetUserAsync(context.User);
        if (await DrawMemberAccess.IsAllowedAsync(members, member)) context.Succeed(requirement);
    }
}

/// <summary>Tao nhom thanh vien neu chua co; khong them thanh vien nao vao nhom.</summary>
public sealed class DrawMemberGroupInitializer(IMemberGroupService groups, ILogger<DrawMemberGroupInitializer> logger)
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        if (await groups.GetByNameAsync(DrawMemberAccess.MemberGroupName) is not null) return;
        var created = await groups.CreateAsync(new MemberGroup { Name = DrawMemberAccess.MemberGroupName });
        if (!created.Success) throw new InvalidOperationException("Không tạo được nhóm thành viên Ban tổ chức quay số: " + created.Status);
        logger.LogInformation("Đã tạo nhóm thành viên {Group}; chưa có thành viên nào trong nhóm.", DrawMemberAccess.MemberGroupName);
    }
}
