using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Umbraco.Plugin.Custom.Core.Administration;

public static class AdministrationAccess
{
    public const string Policy = "AntcAdministration";
    public const string GroupAlias = "quanTriCuocThi";
}

public sealed class AdministrationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) => builder
        .AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, AdministrationGroupInitializer>();
}

public sealed class AdministrationGroupInitializer(IUserGroupService groups, IShortStringHelper strings,
    ILogger<AdministrationGroupInitializer> logger) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        if (await groups.GetAsync(AdministrationAccess.GroupAlias) is not null) return;
        var group = new UserGroup(strings)
        {
            Key = new Guid("f5105861-4f8a-5eb3-8808-c1fe2b3b90b6"),
            Alias = AdministrationAccess.GroupAlias, Name = "Quản trị cuộc thi", Icon = "icon-users",
            Description = "Truy cập các trang /quan-tri, gồm tiếp nhận Hỏi – Đáp và góp ý. Quản trị viên chủ động gán thành viên."
        };
        var result = await groups.CreateAsync(group, Constants.Security.SuperUserKey);
        if (!result.Success) throw new InvalidOperationException("Không tạo được nhóm Quản trị cuộc thi: " + result.Status);
        logger.LogInformation("Đã tạo nhóm {GroupAlias}; chưa tự gán quyền cho tài khoản nào.", AdministrationAccess.GroupAlias);
    }
}
