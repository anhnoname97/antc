using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.Backoffice;

/// <summary>
/// Use Vietnamese for existing and newly saved backoffice accounts.
/// Runs on Starting, before the background queue (Examine) starts: saving users rewrites umbracoUser2UserGroup,
/// which deadlocks with Examine reading users under SQLite Cache=Shared.
/// </summary>
public sealed class BackofficeUserLanguageHandler(IUserService users)
    : INotificationHandler<UserSavingNotification>,
      INotificationAsyncHandler<UmbracoApplicationStartingNotification>
{
    public const string Language = "vi";

    public void Handle(UserSavingNotification notification)
    {
        foreach (var user in notification.SavedEntities)
            user.Language = Language;
    }

    public async Task HandleAsync(UmbracoApplicationStartingNotification notification, CancellationToken cancellationToken)
    {
        if (notification.RuntimeLevel != RuntimeLevel.Run) return;
        const int pageSize = 100;
        for (int skip = 0; ; skip += pageSize)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var result = await users.GetAllAsync(Constants.Security.SuperUserKey, skip, pageSize);
            if (!result.Success || result.Result is null)
                throw new InvalidOperationException("Không đọc được tài khoản để đồng bộ ngôn ngữ tiếng Việt.");

            var page = result.Result;
            var changed = page.Items.Where(user => user.Language != Language).ToArray();
            if (changed.Length > 0)
            {
                foreach (var user in changed) user.Language = Language;
                users.Save(changed);
            }

            if (skip + pageSize >= page.Total) break;
        }
    }
}
