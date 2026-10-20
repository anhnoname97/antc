using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Data.Sqlite;
using Umbraco.Plugin.Custom.Core.Administration;

namespace Umbraco.Plugin.Custom.Tests;

/// <summary>Real Umbraco cookie, real startup notification and isolated, disposable databases. Never opens the site's databases.</summary>
public sealed class ContestAdministrationFullHostTests
{
    [Fact]
    public async Task RealUmbracoLogin_ReportsAndPublication_WorkInsideBackoffice_WithoutRazorPages()
    {
        string root=Directory.CreateDirectory(Path.Combine(Path.GetTempPath(),"antc-admin-full-"+Guid.NewGuid().ToString("N"))).FullName;
        string appDb=Path.Combine(root,"app.db"),cmsDb=Path.Combine(root,"cms.db");
        ProjectFiles.CopyDirectory(Path.Combine(ProjectFiles.WebRoot,"App_Plugins"),Path.Combine(root,"App_Plugins"));
        ProjectFiles.CopyDirectory(Path.Combine(ProjectFiles.WebRoot,"wwwroot","App_Plugins"),Path.Combine(root,"wwwroot","App_Plugins"));
        string password="Aa1!"+Guid.NewGuid().ToString("N");
        var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();int port=((IPEndPoint)listener.LocalEndpoint).Port;listener.Stop();
        using var client=new HttpClient(new HttpClientHandler{AllowAutoRedirect=false}){BaseAddress=new Uri($"http://127.0.0.1:{port}"),Timeout=TimeSpan.FromSeconds(10)};
        Process? process=null;
        var output=new System.Collections.Concurrent.ConcurrentQueue<string>();
        // Umbraco scans its entire binary directory. Copy only the host's dependencies, not xUnit/testhost assemblies.
        string bin=Directory.CreateDirectory(Path.Combine(root,"bin")).FullName;
        using(var deps=JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"Umbraco.Web.UI.deps.json"))))
        {
            var names=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach(var target in deps.RootElement.GetProperty("targets").EnumerateObject())
                foreach(var library in target.Value.EnumerateObject())
                    foreach(var kind in new[]{"runtime","native","runtimeTargets"})
                        if(library.Value.TryGetProperty(kind,out var assets))
                            foreach(var asset in assets.EnumerateObject())names.Add(Path.GetFileName(asset.Name));
            foreach(string name in names)
                if(File.Exists(Path.Combine(AppContext.BaseDirectory,name)))File.Copy(Path.Combine(AppContext.BaseDirectory,name),Path.Combine(bin,name));
            foreach(string name in new[]{"Umbraco.Web.UI.deps.json","Umbraco.Web.UI.runtimeconfig.json","Umbraco.Web.UI.runtimeconfig.dev.json","Umbraco.Web.UI.staticwebassets.runtime.json"})
                if(File.Exists(Path.Combine(AppContext.BaseDirectory,name)))File.Copy(Path.Combine(AppContext.BaseDirectory,name),Path.Combine(bin,name));
        }
        var start=new ProcessStartInfo("dotnet"){WorkingDirectory=root,UseShellExecute=false,CreateNoWindow=true,RedirectStandardError=true,RedirectStandardOutput=true};
        start.ArgumentList.Add(Path.Combine(bin,"Umbraco.Web.UI.dll"));
        start.Environment["ASPNETCORE_ENVIRONMENT"]="Development";
        start.Environment["ASPNETCORE_URLS"]=client.BaseAddress.ToString().TrimEnd('/');
        start.Environment["ConnectionStrings__appDb"]=$"Data Source={appDb};Pooling=False";
        start.Environment["ConnectionStrings__umbracoDbDSN"]=$"Data Source={cmsDb};Pooling=False";
        start.Environment["ConnectionStrings__umbracoDbDSN_ProviderName"]="Microsoft.Data.Sqlite";
        start.Environment["Contest__IpHashSalt"]=Guid.NewGuid().ToString("N");
        start.Environment["Umbraco__CMS__Unattended__InstallUnattended"]="true";
        start.Environment["Umbraco__CMS__Unattended__UpgradeUnattended"]="true";
        start.Environment["Umbraco__CMS__Unattended__UnattendedUserName"]="Isolated Admin Test";
        start.Environment["Umbraco__CMS__Unattended__UnattendedUserEmail"]="admin-test@example.invalid";
        start.Environment["Umbraco__CMS__Unattended__UnattendedUserPassword"]=password;
        start.Environment["Umbraco__CMS__ModelsBuilder__ModelsMode"]="Nothing";
        start.Environment["Umbraco__CMS__Global__UseHttps"]="false";
        start.Environment["Umbraco__CMS__Runtime__Mode"]="Development";
        start.Environment["Deployment__ImportStructure"]="false";
        start.Environment["Deployment__Maintenance"]="false";
        async Task StartAsync()
        {
            process=Process.Start(start)!;
            process.OutputDataReceived+=(_,e)=>{if(e.Data is {} line && output.Count<2000)output.Enqueue(line);};
            process.ErrorDataReceived+=(_,e)=>{if(e.Data is {} line && output.Count<2000)output.Enqueue(line);};
            process.BeginOutputReadLine();process.BeginErrorReadLine();
            var timer=Stopwatch.StartNew();
            while(timer.Elapsed<TimeSpan.FromSeconds(55))
            {
                if(process.HasExited) throw new InvalidOperationException("Isolated host exited: "+string.Join("\n",output.TakeLast(30)));
                try {if((await client.GetAsync("/healthz")).StatusCode==HttpStatusCode.OK)return;}catch(HttpRequestException){}catch(TaskCanceledException){}
                await Task.Delay(250);
            }
            throw new TimeoutException("Isolated host startup: "+string.Join("\n",output.TakeLast(30)));
        }
        void Stop(){if(process is not null){if(!process.HasExited){process.Kill(entireProcessTree:true);process.WaitForExit(10000);}process.Dispose();process=null;}}
        async Task LoginAsync()
        {
            client.DefaultRequestHeaders.Remove("Authorization");
            var result=await client.PostAsJsonAsync("/umbraco/management/api/v1/security/back-office/login",new{username="admin-test@example.invalid",password});
            Assert.Equal(HttpStatusCode.OK,result.StatusCode);
            string verifier=WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
            string callback=client.BaseAddress+"umbraco/oauth_complete";
            string query=QueryHelpers.AddQueryString("/umbraco/management/api/v1/security/back-office/authorize",new Dictionary<string,string?>{
                ["client_id"]="umbraco-back-office",["response_type"]="code",["scope"]="offline_access",["redirect_uri"]=callback,
                ["code_challenge"]=WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(verifier))),["code_challenge_method"]="S256"});
            var authorize=await client.GetAsync(query);
            Assert.True(authorize.StatusCode==HttpStatusCode.Redirect,$"PKCE authorize failed: {(int)authorize.StatusCode}");
            string code=QueryHelpers.ParseQuery(authorize.Headers.Location!.Query)["code"].ToString();
            Assert.NotEmpty(code);
            var token=await client.PostAsync("/umbraco/management/api/v1/security/back-office/token",new FormUrlEncodedContent(new Dictionary<string,string>{
                ["client_id"]="umbraco-back-office",["redirect_uri"]=callback,["grant_type"]="authorization_code",["code"]=code,["code_verifier"]=verifier}));
            Assert.True(token.StatusCode==HttpStatusCode.OK,$"PKCE token failed: {(int)token.StatusCode}");
            client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization","Bearer [redacted]");
        }
        try
        {
            await StartAsync();
            var legacy=await client.GetAsync("/quan-tri/cuoc-thi");
            Assert.Equal(HttpStatusCode.Redirect,legacy.StatusCode);
            Assert.Equal("/umbraco/section/contest-management/dashboard",legacy.Headers.Location?.ToString());
            Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync("/umbraco/management/api/v1/antc/contest-reports/dashboard")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync("/api/v1/admin/contest/campaigns/1/results/publication")).StatusCode);
            await LoginAsync();
            Assert.Equal(HttpStatusCode.Forbidden,(await client.GetAsync("/umbraco/management/api/v1/antc/contest-reports/dashboard")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden,(await client.GetAsync("/api/v1/admin/contest/campaigns/1/results/publication")).StatusCode);
            Stop();
            // Membership fixture is changed ONLY in the freshly installed CMS database above, while its host is stopped.
            await using(var db=new SqliteConnection($"Data Source={cmsDb};Pooling=False"))
            {
                await db.OpenAsync();await using var command=db.CreateCommand();
                command.CommandText="SELECT COUNT(*) FROM umbracoUserGroup WHERE userGroupAlias=$alias AND userGroupName=$name";
                command.Parameters.AddWithValue("$alias",AdministrationAccess.GroupAlias);command.Parameters.AddWithValue("$name","Quản trị cuộc thi");
                Assert.Equal(1L,await command.ExecuteScalarAsync());
                command.CommandText="INSERT INTO umbracoUser2UserGroup(userId,userGroupId) SELECT -1,id FROM umbracoUserGroup WHERE userGroupAlias=$alias";
                await command.ExecuteNonQueryAsync();
            }
            await using(var db=new SqliteConnection($"Data Source={appDb};Pooling=False"))
            {
                await db.OpenAsync();await using var cmd=db.CreateCommand();
                cmd.CommandText="UPDATE contest SET start_at=$start,end_at=$end";
                cmd.Parameters.AddWithValue("$start",DateTime.UtcNow.AddDays(-1));cmd.Parameters.AddWithValue("$end",DateTime.UtcNow.AddDays(1));
                await cmd.ExecuteNonQueryAsync();
            }
            await StartAsync();await LoginAsync();
            const string reporting="/umbraco/management/api/v1/antc/contest-reports";
            client.DefaultRequestHeaders.Remove("Authorization");
            Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync(reporting+"/dashboard")).StatusCode);
            client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization","Bearer [redacted]");
            foreach(string path in new[]{reporting+"/dashboard",reporting+"/entries",reporting+"/questions",reporting+"/options"})
            {
                var response=await client.GetAsync(path);
                Assert.True(response.StatusCode==HttpStatusCode.OK,$"Real host {path}: {(int)response.StatusCode}");
            }
            long contestId;
            string code,answer;
            await using(var db=new SqliteConnection($"Data Source={appDb};Pooling=False"))
            {
                await db.OpenAsync();await using var cmd=db.CreateCommand();cmd.CommandText="SELECT contest_id,question_code,answer FROM contest_question LIMIT 1";
                await using var reader=await cmd.ExecuteReaderAsync();Assert.True(await reader.ReadAsync());
                contestId=reader.GetInt64(0);code=reader.GetString(1);answer=reader.GetString(2);
            }
            var create=await client.PostAsJsonAsync("/api/v1/contest/entries",new{contestId,mode="anon"});
            Assert.Equal(HttpStatusCode.Created,create.StatusCode);
            var entry=await create.Content.ReadFromJsonAsync<JsonElement>();
            string entryCode=entry.GetProperty("code").GetString()!;
            client.DefaultRequestHeaders.Add("X-Entry-Token",entry.GetProperty("token").GetString());
            Assert.Equal(HttpStatusCode.OK,(await client.PostAsJsonAsync("/api/v1/contest/entries/me/answers",new{q=code,a=answer})).StatusCode);
            var submit=await client.PostAsJsonAsync("/api/v1/contest/entries/me/submit",new{contact=new {fullName="Nguyễn Văn Kiểm Thử",phone="0912345678",consent=true}});
            Assert.Equal(HttpStatusCode.OK,submit.StatusCode);
            string list=await client.GetStringAsync(reporting+"/entries?status=submitted&scoreFrom=1");
            Assert.Contains(entryCode,list);
            await using(var db=new SqliteConnection($"Data Source={appDb};Pooling=False"))
            {
                await db.OpenAsync();await using var cmd=db.CreateCommand();cmd.CommandText="SELECT id FROM entry WHERE code=$code";
                cmd.Parameters.AddWithValue("$code",entryCode);long entryId=(long)(await cmd.ExecuteScalarAsync())!;
                string detail=await client.GetStringAsync($"{reporting}/entries/{entryId}");
                Assert.Equal(200,JsonDocument.Parse(detail).RootElement.GetProperty("questions").GetArrayLength());
                Assert.Contains(entryCode,detail);
                cmd.CommandText="SELECT COUNT(*) FROM contest_access_audit WHERE action='view.detail' AND entry_code=$code";
                Assert.Equal(1L,await cmd.ExecuteScalarAsync());
            }
            // Publish through the real authenticated API, not by changing publication records in SQL.
            Stop();
            long drawId;
            await using(var db=new SqliteConnection($"Data Source={appDb};Pooling=False"))
            {
                await db.OpenAsync();await using var cmd=db.CreateCommand();
                cmd.CommandText="UPDATE contest SET end_at=$end,submit_grace_hours=0 WHERE id=$id";
                cmd.Parameters.AddWithValue("$end",DateTime.UtcNow.AddSeconds(-1));cmd.Parameters.AddWithValue("$id",contestId);await cmd.ExecuteNonQueryAsync();
                cmd.CommandText="INSERT INTO draw(contest_id,created_at,created_by,min_score,winners_requested,eligible_count,exclude_previous) VALUES($id,$end,'test',1,1,1,0) RETURNING id";
                drawId=(long)(await cmd.ExecuteScalarAsync())!;
                cmd.CommandText="INSERT INTO draw_winner(draw_id,rank,entry_id,code,full_name,phone,score) SELECT $draw,1,id,code,full_name,phone,score FROM entry WHERE code=$code";
                cmd.Parameters.AddWithValue("$draw",drawId);cmd.Parameters.AddWithValue("$code",entryCode);await cmd.ExecuteNonQueryAsync();
            }
            await StartAsync();await LoginAsync();
            using var anonymous=new HttpClient{BaseAddress=client.BaseAddress};
            string publicPath=$"/api/v1/contests/{contestId}/results";
            Assert.Equal("pending",(await anonymous.GetFromJsonAsync<JsonElement>(publicPath)).GetProperty("status").GetString());
            string publication=$"{reporting}/contests/{contestId}/publication";
            var publicationResult=await client.PutAsJsonAsync(publication,new{isPublished=true,drawIds=new[]{drawId},expectedRevision=0});
            Assert.True(publicationResult.StatusCode==HttpStatusCode.OK,$"Publication: {(int)publicationResult.StatusCode}: {await publicationResult.Content.ReadAsStringAsync()}");
            var published=await anonymous.GetFromJsonAsync<JsonElement>(publicPath);
            Assert.Equal("published",published.GetProperty("status").GetString());
            Assert.Equal(entryCode,published.GetProperty("leaderboard").GetProperty("items")[0].GetProperty("code").GetString());
            Assert.Equal("091****678",published.GetProperty("draws")[0].GetProperty("winners")[0].GetProperty("phone").GetString());
            Assert.DoesNotContain("0912345678",published.GetRawText());
            Assert.Equal(HttpStatusCode.OK,(await client.PutAsJsonAsync(publication,new{isPublished=false,expectedRevision=1})).StatusCode);
            Assert.Equal("pending",(await anonymous.GetFromJsonAsync<JsonElement>(publicPath)).GetProperty("status").GetString());
            var csv=await client.GetAsync(reporting+"/export/entries?status=submitted&hasPhone=true&scoreFrom=1");
            Assert.Equal(HttpStatusCode.OK,csv.StatusCode);
            Assert.Equal(new byte[]{239,187,191},(await csv.Content.ReadAsByteArrayAsync())[..3]);
            Assert.Contains(entryCode,await csv.Content.ReadAsStringAsync());
            if(Environment.GetEnvironmentVariable("ANTC_RUN_BROWSER")=="1")
            {
                var browserStart=new ProcessStartInfo("node"){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true};
                browserStart.ArgumentList.Add(Path.Combine(ProjectFiles.WebRoot,"..","Umbraco.Plugin.Custom.Tests","Browser","contest-reports.smoke.cjs"));
                browserStart.Environment["ANTC_TEST_URL"]=client.BaseAddress.ToString();
                browserStart.Environment["ANTC_TEST_PASSWORD"]=password;
                browserStart.Environment["ANTC_TEST_CONTEST_ID"]=contestId.ToString();
                browserStart.Environment["ANTC_TEST_ENTRY_CODE"]=entryCode;
                using var browser=Process.Start(browserStart)!;
                var browserOut=browser.StandardOutput.ReadToEndAsync();var browserError=browser.StandardError.ReadToEndAsync();
                await browser.WaitForExitAsync();
                Assert.True(browser.ExitCode==0,await browserOut+await browserError);
                Console.WriteLine(await browserOut);
            }
            Console.WriteLine("Real Umbraco PKCE: reporting401 / nonmember403 / member200 / detail200questions / CSV BOM / publication / public results / old URLs redirect.");
        }
        finally
        {
            Stop();SqliteConnection.ClearAllPools();
            // root is a fresh, owned GUID directory; no repository or supplied database is removed.
            if(Path.GetFileName(root).StartsWith("antc-admin-full-",StringComparison.Ordinal))Directory.Delete(root,true);
        }
    }
}
