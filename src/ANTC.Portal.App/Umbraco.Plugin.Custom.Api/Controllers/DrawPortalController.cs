using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Security;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

public sealed class DrawLoginModel
{
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public string? ReturnUrl { get; set; }
    public string? Error { get; set; }
}

public sealed record DrawIndexModel(string MemberName, IReadOnlyList<PortalDrawContestSummary> Contests);

/// <summary>Chi cho phep returnUrl noi bo nam trong khu vuc /quay-so.</summary>
public static class DrawReturnUrl
{
    public const string Home = "/quay-so";
    public const string Login = "/quay-so/dang-nhap";

    public static string Sanitize(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) || returnUrl.Any(char.IsControl)) return Home;
        // "//host" va "/\host" la URL tuong doi giao thuc, tro ra ngoai.
        if (returnUrl[0] != '/' || returnUrl.StartsWith("//") || returnUrl.StartsWith("/\\")) return Home;
        bool inArea = returnUrl.StartsWith(Home, StringComparison.OrdinalIgnoreCase)
            && (returnUrl.Length == Home.Length || returnUrl[Home.Length] is '/' or '?' or '#');
        return inArea ? returnUrl : Home;
    }
}

/// <summary>Nen chung cho moi trang /quay-so: khong luu cache, kiem tra thanh vien theo policy.</summary>
public abstract class DrawPortalControllerBase(IAuthorizationService authorization, IMemberManager members) : Controller
{
    protected const string ViewRoot = "~/Views/QuaySo/";

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        context.HttpContext.Response.Headers.CacheControl = "no-store";
        base.OnActionExecuting(context);
    }

    /// <summary>Tra ve ket qua chan (chuyen huong dang nhap hoac 403) hoac thanh vien hop le.</summary>
    protected async Task<(IActionResult? Denied, MemberIdentityUser? Member)> RequireDrawMemberAsync()
    {
        AuthenticateResult auth = await HttpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!auth.Succeeded || auth.Principal is null)
        {
            string current = Request.PathBase + Request.Path + Request.QueryString;
            return (Redirect($"{DrawReturnUrl.Login}?returnUrl={Uri.EscapeDataString(current)}"), null);
        }
        AuthorizationResult result = await authorization.AuthorizeAsync(auth.Principal, DrawMemberAccess.Policy);
        if (!result.Succeeded)
        {
            Response.StatusCode = StatusCodes.Status403Forbidden;
            return (View(ViewRoot + "KhongCoQuyen.cshtml"), null);
        }
        return (null, await members.GetUserAsync(auth.Principal));
    }
}

/// <summary>Khu vuc quay so danh cho thanh vien Ban to chuc quay so (MVC, tra view).</summary>
[Route("quay-so")]
public sealed class DrawPortalController(IAuthorizationService authorization, IMemberManager members,
    IMemberSignInManager signIn, PortalDrawService draws) : DrawPortalControllerBase(authorization, members)
{
    private const string GenericLoginError = "Tên đăng nhập hoặc mật khẩu không đúng.";
    private const string NoPermissionError = "Tài khoản không có quyền quay số";
    private readonly IMemberManager members = members;

    [HttpGet("")]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var (denied, member) = await RequireDrawMemberAsync();
        if (denied is not null) return denied;
        var contests = await draws.ListFinishedAsync(ct);
        return View(ViewRoot + "Index.cshtml", new DrawIndexModel(member?.Name ?? member?.UserName ?? "", contests));
    }

    [HttpGet("dang-nhap")]
    public IActionResult Login(string? returnUrl) =>
        View(ViewRoot + "DangNhap.cshtml", new DrawLoginModel { ReturnUrl = DrawReturnUrl.Sanitize(returnUrl) });

    [HttpPost("dang-nhap")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(DrawLoginModel model)
    {
        string returnUrl = DrawReturnUrl.Sanitize(model.ReturnUrl);
        IActionResult Fail(string error) => View(ViewRoot + "DangNhap.cshtml",
            new DrawLoginModel { UserName = model.UserName, ReturnUrl = returnUrl, Error = error });

        if (string.IsNullOrWhiteSpace(model.UserName) || string.IsNullOrEmpty(model.Password))
            return Fail("Vui lòng nhập tên đăng nhập và mật khẩu.");
        string userName = model.UserName.Trim();

        // Khoa tam sau nhieu lan sai; moi that bai (ke ca bi khoa) dung chung mot thong bao.
        var result = await signIn.PasswordSignInAsync(userName, model.Password, isPersistent: false, lockoutOnFailure: true);
        if (!result.Succeeded) return Fail(GenericLoginError);

        // Dung mat khau nhung ngoai nhom thi huy phien ngay, khong giu cookie.
        MemberIdentityUser? member = await members.FindByNameAsync(userName);
        if (!await DrawMemberAccess.IsAllowedAsync(members, member))
        {
            await signIn.SignOutAsync();
            return Fail(NoPermissionError);
        }
        return LocalRedirect(Url.IsLocalUrl(returnUrl) ? returnUrl : DrawReturnUrl.Home);
    }

    [HttpPost("dang-xuat")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await signIn.SignOutAsync();
        return Redirect(DrawReturnUrl.Login);
    }
}
