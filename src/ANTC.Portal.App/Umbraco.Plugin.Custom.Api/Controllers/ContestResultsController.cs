using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Security.Authorization;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Contest;

namespace Umbraco.Plugin.Custom.Api.Controllers;

[ApiController]
[Route("api/v1/contests/{contestId:long}/results")]
public sealed class ContestResultsController(ContestResultsService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> Get(long contestId,int page=1,int pageSize=20,CancellationToken ct=default)
    {
        Response.Headers.CacheControl="no-store";
        try
        {
            var result=await service.GetAsync(contestId,page,pageSize,ct);
            return result is null?NotFound(new ApiErrorResponse(new ApiError("CONTEST_NOT_FOUND","Không tìm thấy cuộc thi."))):Ok(result);
        }
        catch(ContestResultsException ex){return StatusCode(ex.Status,new ApiErrorResponse(new ApiError(ex.Code,ex.Message)));}
    }
}

[ApiController]
[Route("api/v1/admin/contest/campaigns/{contestId:long}/results/publication")]
[Authorize(Policy=AdministrationAccess.Policy)]
public sealed class ContestResultsPublicationController(ContestResultsService service,IAuthorizationHelper authorization) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(long contestId,CancellationToken ct)
    {
        Response.Headers.CacheControl="no-store";
        try {var state=await service.StateAsync(contestId,ct);return state is null?Missing():Ok(state);}
        catch(ContestResultsException ex){return Failure(ex);}
    }
    [HttpPut]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Put(long contestId,[FromBody] ResultsPublicationRequest request,CancellationToken ct)
    {
        Response.Headers.CacheControl="no-store";
        try
        {
            var state=await service.SetPublicationAsync(contestId,request,authorization.GetUmbracoUser(User).Key,ct);
            return state is null?Missing():Ok(state);
        }
        catch(ContestResultsException ex){return Failure(ex);}
    }
    private NotFoundObjectResult Missing()=>NotFound(new ApiErrorResponse(new ApiError("CONTEST_NOT_FOUND","Không tìm thấy cuộc thi.")));
    private ObjectResult Failure(ContestResultsException ex)=>StatusCode(ex.Status,new ApiErrorResponse(new ApiError(ex.Code,ex.Message)));
}
