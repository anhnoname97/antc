using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.Backoffice;

/// <summary>
/// Dam bao nhom Administrators duoc phep truy cap section quan ly cuoc thi.
/// Umbraco chi hien thi section neu alias cua no nam trong AllowedSections cua nguoi dung.
/// </summary>
public sealed class ContestManagementSectionAccessHandler
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    public const string SectionAlias = "Antc.Section.ContestManagement";

    private readonly IUserGroupService _userGroupService;

    public ContestManagementSectionAccessHandler(IUserGroupService userGroupService)
        => _userGroupService = userGroupService;

    public async Task HandleAsync(
        UmbracoApplicationStartedNotification notification,
        CancellationToken cancellationToken)
    {
        IUserGroup? adminGroup = await _userGroupService.GetAsync(Constants.Security.AdminGroupKey);
        if (adminGroup is null || adminGroup.AllowedSections.Contains(SectionAlias, StringComparer.Ordinal))
        {
            return;
        }

        adminGroup.AddAllowedSection(SectionAlias);
        await _userGroupService.UpdateAsync(adminGroup, Constants.Security.SuperUserKey);
    }
}
