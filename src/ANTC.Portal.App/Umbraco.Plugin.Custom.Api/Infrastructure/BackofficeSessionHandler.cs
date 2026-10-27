using OpenIddict.Abstractions;
using OpenIddict.Server;
using Umbraco.Cms.Core;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

/// <summary>
/// Keep backoffice refresh tokens valid until logout/revocation, including after inactivity.
/// Access tokens keep their normal short lifetime; member and external clients are unaffected.
/// </summary>
public sealed class BackofficeSessionHandler : IOpenIddictServerHandler<OpenIddictServerEvents.ProcessSignInContext>
{
    public ValueTask HandleAsync(OpenIddictServerEvents.ProcessSignInContext context)
    {
        if (context.ClientId == Constants.OAuthClientIds.BackOffice)
            context.RefreshTokenPrincipal?.SetExpirationDate(null);

        return ValueTask.CompletedTask;
    }
}
