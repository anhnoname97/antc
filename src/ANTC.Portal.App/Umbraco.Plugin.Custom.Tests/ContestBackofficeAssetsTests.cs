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
    [Fact] public void QuestionsWorkspaceCombinesCrudAndExcel_WithoutBankMenu()
    {
        string plugin=Path.Combine(ProjectFiles.WebRoot,"App_Plugins","ContestManagement");
        using var manifest=JsonDocument.Parse(File.ReadAllText(Path.Combine(plugin,"umbraco-package.json")));
        var extensions=manifest.RootElement.GetProperty("extensions").EnumerateArray().ToArray();
        Assert.DoesNotContain(extensions,e=>e.GetProperty("type").GetString()=="menuItem" && e.GetProperty("meta").GetProperty("label").GetString()=="Ngân hàng câu hỏi");
        Assert.Contains(extensions,e=>e.GetProperty("type").GetString()=="menuItem" && e.GetProperty("meta").GetProperty("label").GetString()=="Câu hỏi");
        var compatibility=Assert.Single(extensions.Where(e=>e.GetProperty("type").GetString()=="sectionRoute" && e.GetProperty("meta").GetProperty("path").GetString()=="bank"));
        Assert.Equal("antc-contest-questions-view",compatibility.GetProperty("elementName").GetString());
        string main=File.ReadAllText(Path.Combine(plugin,"contest-management.js"));
        string workspace=File.ReadAllText(Path.Combine(plugin,"contest-bank.js"));
        Assert.Contains("class QuestionsLitView extends ContestBankView",main);
        Assert.Contains("<antc-contest-questions-table embedded",workspace);
        Assert.Contains("Nhập từ Excel",workspace); Assert.Contains("Lịch sử nhập",workspace);
        Assert.Contains("table.topics = []; table.page = 1; await table.load();",workspace);
        Assert.DoesNotContain("async _loadQuestions()",workspace); // only one question list, no duplicate read-only table
    }
    [Fact] public void ContestTabsEmbedEntriesAndDraws_WithoutDuplicateLeftMenus()
    {
        string plugin=Path.Combine(ProjectFiles.WebRoot,"App_Plugins","ContestManagement");
        using var manifest=JsonDocument.Parse(File.ReadAllText(Path.Combine(plugin,"umbraco-package.json")));
        var menus=manifest.RootElement.GetProperty("extensions").EnumerateArray().Where(e=>e.GetProperty("type").GetString()=="menuItem").ToArray();
        Assert.DoesNotContain(menus,e=>e.GetProperty("alias").GetString()=="Antc.MenuItem.ContestManagement.EntriesReport");
        Assert.DoesNotContain(menus,e=>e.GetProperty("alias").GetString()=="Antc.MenuItem.ContestManagement.Draws");
        string script=File.ReadAllText(Path.Combine(plugin,"contest-management.js"));
        Assert.Contains("<antc-contest-entries-report-view embedded>",script);
        Assert.Contains("<antc-contest-draws-view embedded>",script);
        Assert.Contains("role=\"tablist\"",script);
        Assert.DoesNotContain("window.location.assign",script);
    }
    [Fact] public void PrivacyScreenUsesLitAndPostBodiesInsteadOfSelectorsInUrls()
    {
        string plugin=Path.Combine(ProjectFiles.WebRoot,"App_Plugins","ContestManagement");
        string script=File.ReadAllText(Path.Combine(plugin,"contest-privacy.js"));
        Assert.Contains("extends UmbLitElement",script); Assert.Contains("UMB_CONFIRM_MODAL",script);
        Assert.Contains("XÓA DỮ LIỆU CÁ NHÂN",script); Assert.Contains("/preview",script);
        Assert.DoesNotContain("?phone=",script); Assert.DoesNotContain("?value=",script);
        Assert.DoesNotContain("innerHTML",script);
    }
    [Fact] public void DrawRouteUsesLitAndNoLongerExposesEditOrDeleteControls()
    {
        string plugin=Path.Combine(ProjectFiles.WebRoot,"App_Plugins","ContestManagement");
        using var manifest=JsonDocument.Parse(File.ReadAllText(Path.Combine(plugin,"umbraco-package.json")));
        var route=Assert.Single(manifest.RootElement.GetProperty("extensions").EnumerateArray()
            .Where(e=>e.GetProperty("type").GetString()=="sectionRoute" && e.GetProperty("meta").GetProperty("path").GetString()=="draws"));
        Assert.Equal("antc-contest-draws-view",route.GetProperty("elementName").GetString());
        string script=File.ReadAllText(Path.Combine(plugin,"contest-draws.js"));
        Assert.Contains("extends UmbLitElement",script); Assert.Contains("UMB_CONFIRM_MODAL",script);
        Assert.Contains("crypto.randomUUID()",script); Assert.Contains("blobDownload",script);
        string legacy=File.ReadAllText(Path.Combine(plugin,"contest-management.js"));
        Assert.DoesNotContain("data-edit-draw",legacy); Assert.DoesNotContain("data-delete-draw",legacy);
    }
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
            if(path!="entries-report") Assert.Contains(extensions,e=>e.GetProperty("type").GetString()=="menuItem" && e.GetProperty("meta").GetProperty("href").GetString()=="section/contest-management/"+path);
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
