using System.Security.Claims;
using OpenIddict.Abstractions;
using OpenIddict.Server;
using Umbraco.Cms.Core;
using Umbraco.Plugin.Custom.Api.Infrastructure;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class BackofficeSessionTests
{
    [Theory]
    [InlineData(Constants.OAuthClientIds.BackOffice, true)]
    [InlineData("umbraco-swagger", false)]
    [InlineData("member-client", false)]
    [InlineData(null, false)]
    public async Task OnlyBackofficeRefreshTokensHaveNoTimeLimit(string? clientId, bool unlimited)
    {
        var expires = DateTimeOffset.UtcNow.AddMinutes(20);
        var refresh = new ClaimsPrincipal(new ClaimsIdentity());
        refresh.SetExpirationDate(expires);
        var access = new ClaimsPrincipal(new ClaimsIdentity());
        access.SetExpirationDate(expires.AddMinutes(-15));
        var context = new OpenIddictServerEvents.ProcessSignInContext(new OpenIddictServerTransaction
        {
            Request = new OpenIddictRequest { ClientId = clientId },
        })
        {
            RefreshTokenPrincipal = refresh,
            AccessTokenPrincipal = access,
        };

        await new BackofficeSessionHandler().HandleAsync(context);

        if (unlimited) Assert.Null(refresh.GetExpirationDate());
        else Assert.Equal(expires.ToUnixTimeSeconds(), refresh.GetExpirationDate()!.Value.ToUnixTimeSeconds());
        Assert.Equal(expires.AddMinutes(-15).ToUnixTimeSeconds(), access.GetExpirationDate()!.Value.ToUnixTimeSeconds());
    }

    [Fact]
    public async Task SigningInWithoutARefreshTokenIsSupported()
    {
        var context = new OpenIddictServerEvents.ProcessSignInContext(new OpenIddictServerTransaction
        {
            Request = new OpenIddictRequest { ClientId = Constants.OAuthClientIds.BackOffice },
        });
        await new BackofficeSessionHandler().HandleAsync(context);
        Assert.Null(context.RefreshTokenPrincipal);
    }
}
