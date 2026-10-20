using System.Text.Json;

namespace Umbraco.Plugin.Custom.Tests;

internal static class ProjectFiles
{
    private static string SourceDirectory([System.Runtime.CompilerServices.CallerFilePath] string file="") => Path.GetDirectoryName(file)!;
    public static string WebRoot
    {
        get
        {
            for(var dir=new DirectoryInfo(SourceDirectory());dir is not null;dir=dir.Parent)
                foreach(string path in new[]{Path.Combine(dir.FullName,"Umbraco.Web.UI"),Path.Combine(dir.FullName,"ANTC.Portal.App","Umbraco.Web.UI")})
                    if(File.Exists(Path.Combine(path,"Umbraco.Web.UI.csproj")))return path;
            throw new DirectoryNotFoundException("Web project not found");
        }
    }
    public static void CopyDirectory(string source,string destination)
    {
        Directory.CreateDirectory(destination);
        foreach(string file in Directory.GetFiles(source))File.Copy(file,Path.Combine(destination,Path.GetFileName(file)),true);
        foreach(string dir in Directory.GetDirectories(source))CopyDirectory(dir,Path.Combine(destination,Path.GetFileName(dir)));
    }
}

public sealed class ContestBackofficeAssetsTests
{
    [Fact] public void CrudAndReportsShareOneScopedTheme()
    {
        string plugin=Path.Combine(ProjectFiles.WebRoot,"App_Plugins","ContestManagement");
        string crud=File.ReadAllText(Path.Combine(plugin,"contest-management.js"));
        string reports=File.ReadAllText(Path.Combine(plugin,"contest-reports.js"));
        string theme=File.ReadAllText(Path.Combine(plugin,"contest-theme.js"));
        Assert.Contains("from './contest-theme.js'",crud);
        Assert.Contains("from './contest-theme.js'",reports);
        Assert.Contains("const styles = contestStylesText;",crud);
        Assert.Contains("static styles = contestStyles;",reports);
        Assert.Contains(":host {",theme);
        Assert.Contains("prefers-reduced-motion",theme);
        Assert.Contains(".form-grid label>span",theme);
    }
    [Fact] public void AllReportingMenusResolveToRegisteredLitElements()
    {
        string plugin=Path.Combine(ProjectFiles.WebRoot,"App_Plugins","ContestManagement");
        using var manifest=JsonDocument.Parse(File.ReadAllText(Path.Combine(plugin,"umbraco-package.json")));
        var extensions=manifest.RootElement.GetProperty("extensions").EnumerateArray().ToArray();
        string script=File.ReadAllText(Path.Combine(plugin,"contest-reports.js"));
        foreach(string path in new[]{"dashboard","entries-report","question-report","publication"})
        {
            var route=Assert.Single(extensions.Where(e=>e.GetProperty("type").GetString()=="sectionRoute" && e.GetProperty("meta").GetProperty("path").GetString()==path));
            string element=route.GetProperty("elementName").GetString()!;
            Assert.Contains("customElements.define('"+element+"'",script);
            Assert.Contains(extensions,e=>e.GetProperty("type").GetString()=="menuItem" && e.GetProperty("meta").GetProperty("href").GetString()=="section/contest-management/"+path);
        }
        Assert.Contains("extends UmbLitElement",script);
        Assert.Contains("getLatestToken()",script);
        Assert.DoesNotContain("innerHTML",script);
    }
    [Fact] public void RetiredRazorPagesAndTheirHostRegistrationAreRemoved()
    {
        string root=ProjectFiles.WebRoot;
        Assert.False(File.Exists(Path.Combine(root,"Pages","QuanTri","ReportPage.cs")));
        Assert.Empty(Directory.Exists(Path.Combine(root,"Pages"))?Directory.GetFiles(Path.Combine(root,"Pages"),"*.cshtml",SearchOption.AllDirectories):[]);
        string program=File.ReadAllText(Path.Combine(root,"Program.cs"));
        Assert.DoesNotContain("AddRazorPages",program);Assert.DoesNotContain("MapRazorPages",program);
        Assert.False(File.Exists(Path.Combine(root,"wwwroot","assets","css","contest-admin.css")));
    }
}
