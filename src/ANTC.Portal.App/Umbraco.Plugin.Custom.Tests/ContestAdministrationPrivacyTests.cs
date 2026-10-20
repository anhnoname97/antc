using Microsoft.AspNetCore.Http;
using Serilog;
using Umbraco.Plugin.Custom.Api.Infrastructure;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class ContestAdministrationPrivacyTests
{
    [Fact]
    public void AdministrationLogs_DoNotContainActorNamesSearchOrPhones_EvenAfterRequestScopeEnds()
    {
        string file=Path.Combine(Path.GetTempPath(),"antc-admin-log-"+Guid.NewGuid().ToString("N")+".log");
        var accessor=new HttpContextAccessor{HttpContext=new DefaultHttpContext()};
        accessor.HttpContext.Request.Path="/quan-tri/luot-thi";
        accessor.HttpContext.Request.QueryString=new QueryString("?Filter.Search=0912345678");
        try
        {
            using(var log=new LoggerConfiguration().MinimumLevel.Verbose().Filter.With(new ApiPrivacyLogFilter(accessor)).WriteTo.File(file).CreateLogger())
            {
                log.Warning(new Exception("Nguyễn Văn An"),"Unsafe {FullName} {Phone}","Nguyễn Văn An","0912345678");
                accessor.HttpContext=null;
                log.Information("Request finished {RequestPath} {Search}","/quan-tri/luot-thi?Filter.Search=0912345678","Nguyễn Văn An");
                log.Information("Safe startup marker");
            }
            string logs=File.ReadAllText(file);
            Assert.DoesNotContain("Nguyễn",logs);Assert.DoesNotContain("0912345678",logs);Assert.DoesNotContain("Filter.Search",logs);
            Assert.Contains("Safe startup marker",logs);
        }
        finally{accessor.HttpContext=null;File.Delete(file);}
    }
}
