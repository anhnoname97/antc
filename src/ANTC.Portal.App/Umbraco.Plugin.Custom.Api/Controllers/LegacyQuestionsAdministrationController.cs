using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class LegacyQuestionsAdministrationController : Controller
{
    [HttpGet("/quan-tri/hoi-dap")]
    public IActionResult Index() => LocalRedirect("/umbraco/section/hoi-dap");
}
