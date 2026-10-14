using System.Reflection;
using Umbraco.Cms.Core.Configuration;

namespace Umbraco.Plugin.Custom.Core.Services;

public record AppInfo(string App, string AppVersion, string UmbracoVersion, DateTimeOffset ServerTimeUtc);

public interface IAppInfoService
{
    AppInfo Get();
}

/// <summary>
/// Dich vu mau: tra ve phien ban ung dung va phien ban core Umbraco dang chay.
/// Dung de kiem tra App da nhan dung core tu feed noi bo.
/// </summary>
public class AppInfoService : IAppInfoService
{
    private readonly IUmbracoVersion _umbracoVersion;

    public AppInfoService(IUmbracoVersion umbracoVersion) => _umbracoVersion = umbracoVersion;

    public AppInfo Get()
    {
        var appVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "0.0.0";
        return new AppInfo("antoantaichinh.vn", appVersion, _umbracoVersion.SemanticVersion.ToString(), DateTimeOffset.UtcNow);
    }
}