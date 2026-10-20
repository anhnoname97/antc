using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Plugin.Custom.Api.Infrastructure;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class DatabaseReadinessTests
{
    private sealed class UnavailableUmbraco : IUmbracoDatabaseFactory
    {
        public int Attempts { get; private set; }
        public bool Configured => true;
        public bool Initialized => false;
        public string? ConnectionString => null;
        public string? ProviderName => null;
        public bool CanConnect => false;
        public ISqlContext SqlContext => throw new NotSupportedException();
        public IBulkSqlInsertProvider? BulkSqlInsertProvider => null;
        public IUmbracoDatabase CreateDatabase() { Attempts++; throw new InvalidOperationException("Không đọc được CSDL Umbraco."); }
        public void Configure(ConnectionStrings configuration) { }
        public void ConfigureForUpgrade() { }
        public void Dispose() { }
    }

    [Theory]
    [InlineData(false, 0)]
    [InlineData(true, 1)]
    public async Task Readiness_IsFalseWhenEitherDatabaseCannotBeRead(bool appReadable, int expectedUmbracoAttempts)
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        if (appReadable) await db.Database.EnsureCreatedAsync();
        using var umbraco = new UnavailableUmbraco();
        Assert.False(await new DatabaseReadiness(db, umbraco).CanReadAsync(default));
        Assert.Equal(expectedUmbracoAttempts, umbraco.Attempts);
    }
}
