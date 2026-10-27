using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Antc.Infrastructure;

/// <summary>Render the branded document head before backoffice JavaScript starts.</summary>
public sealed class BackofficeBrandingViewFilter : IResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is not ViewResult view) return;

        view.ViewName = view.ViewName?.TrimStart('~') switch
        {
            "/umbraco/UmbracoBackOffice/Index.cshtml" => "~/Views/Backoffice/Index.cshtml",
            "/umbraco/UmbracoLogin/Index.cshtml" => "~/Views/Backoffice/Login.cshtml",
            _ => view.ViewName,
        };
    }

    public void OnResultExecuted(ResultExecutedContext context) { }
}
