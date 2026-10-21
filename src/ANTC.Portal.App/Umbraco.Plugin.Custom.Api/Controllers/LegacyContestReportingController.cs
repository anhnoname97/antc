using Microsoft.AspNetCore.Mvc;

namespace Umbraco.Plugin.Custom.Api.Controllers;

// Old bookmarks remain usable, but no administration UI or personal data is served outside backoffice.
public sealed class LegacyContestReportingController : Controller
{
    [HttpGet("/quan-tri")]
    [HttpGet("/quan-tri/cuoc-thi")]
    public IActionResult Dashboard()=>LocalRedirect("/umbraco/section/contest-management/dashboard");
    [HttpGet("/quan-tri/luot-thi")]
    [HttpGet("/quan-tri/luot-thi/{id:long}")]
    public IActionResult Entries()=>LocalRedirect("/umbraco/section/contest-management/entries-report");
    [HttpGet("/quan-tri/thong-ke-cau-hoi")]
    public IActionResult Questions()=>LocalRedirect("/umbraco/section/contest-management/question-report");
}
