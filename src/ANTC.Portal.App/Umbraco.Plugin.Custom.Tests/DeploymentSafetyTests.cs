using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Umbraco.Plugin.Custom.Api.Infrastructure;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class DeploymentSafetyTests
{
    private sealed class EnvironmentStub(string name) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = name;
        public string ApplicationName { get; set; } = "test";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    [Fact]
    public void Administration_RequiresAllowlistOutsideDevelopment()
    {
        var config = new ConfigurationBuilder().Build();
        Assert.Throws<InvalidOperationException>(() => new AdministrationIpPolicy(config, new EnvironmentStub("Staging")));
        Assert.True(new AdministrationIpPolicy(config, new EnvironmentStub("Development")).Allows(IPAddress.Loopback));
    }

    [Theory]
    [InlineData("10.20.1.1", true)]
    [InlineData("::ffff:10.20.1.1", true)]
    [InlineData("10.21.1.1", false)]
    [InlineData("127.0.0.1", false)]
    public async Task Administration_ChecksNormalizedClientIp_AndProtectsBothAdminPaths(string ip, bool allowed)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>
            { ["Administration:AllowedNetworks:0"] = "10.20.0.0/16" }).Build();
        var policy = new AdministrationIpPolicy(config, new EnvironmentStub("Staging"));
        foreach (string path in new[] { "/umbraco", "/Umbraco/management/api/v1/security/back-office/login", "/api/v1/admin/quiz/topics", "/quan-tri/cuoc-thi", "/Quan-Tri/luot-thi/1" })
        {
            bool invoked = false;
            var context = new DefaultHttpContext();
            context.Request.Path = path;
            context.Connection.RemoteIpAddress = IPAddress.Parse(ip);
            context.Response.Body = new MemoryStream();
            await new AdministrationIpAllowlistMiddleware(_ => { invoked = true; return Task.CompletedTask; }, policy).InvokeAsync(context);
            Assert.Equal(allowed, invoked);
            Assert.Equal(allowed ? 200 : 403, context.Response.StatusCode);
        }
    }

    [Fact]
    public async Task MaintenanceGate_BlocksTrafficButKeepsReadinessReachable()
    {
        string gate = Path.GetTempFileName();
        try
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>
                { ["Deployment:TrafficGatePath"] = gate }).Build();
            foreach (string path in new[] { "/api/v1/contest/entries", "/umbraco", "/", "/healthz" })
            {
                bool invoked = false;
                var context = new DefaultHttpContext();
                context.Request.Path = path;
                context.Response.Body = new MemoryStream();
                await new DeploymentTrafficGateMiddleware(_ => { invoked = true; return Task.CompletedTask; }, config).InvokeAsync(context);
                Assert.Equal(path == "/healthz", invoked);
                Assert.Equal(path == "/healthz" ? 200 : 503, context.Response.StatusCode);
            }
        }
        finally { File.Delete(gate); }
    }

    [Fact]
    public async Task SQLiteBackup_PreservesCommittedWalDataInBothDatabases_WithoutOverwriting()
    {
        string root = Path.Combine(Path.GetTempPath(), "antc-backup-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            string app = Path.Combine(root, "source-app.db"), cms = Path.Combine(root, "source-cms.db");
            await using var appConnection = new SqliteConnection($"Data Source={app};Pooling=False");
            await using var cmsConnection = new SqliteConnection($"Data Source={cms};Pooling=False");
            foreach (var connection in new[] { appConnection, cmsConnection })
            {
                await connection.OpenAsync();
                await using var command = connection.CreateCommand();
                command.CommandText = "PRAGMA journal_mode=WAL; CREATE TABLE records(value TEXT); INSERT INTO records VALUES ('committed-in-wal');";
                await command.ExecuteNonQueryAsync();
            }
            Assert.True(File.Exists(app + "-wal"));
            string output = Path.Combine(root, "backup");
            Assert.Equal(0, SqliteDeploymentBackup.Create(app, cms, output));
            foreach (string file in new[] { "app.sqlite.db", "Umbraco.sqlite.db" })
            {
                await using var backup = new SqliteConnection($"Data Source={Path.Combine(output,file)};Pooling=False;Mode=ReadOnly");
                await backup.OpenAsync();
                await using var read = backup.CreateCommand();
                read.CommandText = "SELECT value FROM records";
                Assert.Equal("committed-in-wal", await read.ExecuteScalarAsync());
            }
            using var manifest = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(output, "backup.json")));
            Assert.Equal(2, manifest.RootElement.GetProperty("files").GetArrayLength());
            Assert.Throws<InvalidOperationException>(() => SqliteDeploymentBackup.Create(app, cms, output));
            Assert.Throws<InvalidOperationException>(() => SqliteDeploymentBackup.Create(app, Path.Combine(root,"missing.db"), Path.Combine(root,"bad")));
        }
        finally { Directory.Delete(root, recursive: true); }
    }
}
