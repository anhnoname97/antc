using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Core.Services;

namespace Umbraco.Plugin.Custom.Api.Controllers;

/// <summary>
/// API mau cua du an. Cac API nghiep vu (cuoc thi, hoi dap, ngan hang cau hoi) dat cung thu muc nay,
/// theo tien to /api/v1.
/// </summary>
[ApiController]
[Route("api/v1/system")]
public class SystemController : ControllerBase
{
    private readonly IAppInfoService _appInfo;

    public SystemController(IAppInfoService appInfo) => _appInfo = appInfo;

    /// <summary>GET /api/v1/system/info - phien ban ung dung va core Umbraco dang chay.</summary>
    [HttpGet("info")]
    public ActionResult<AppInfo> Info() => Ok(_appInfo.Get());
}