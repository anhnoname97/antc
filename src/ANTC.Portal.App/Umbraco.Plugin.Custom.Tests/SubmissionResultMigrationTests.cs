using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class SubmissionResultMigrationTests
{
    [Fact]
    public async Task Upgrade_AddsNullableResultColumn_AndPreservesExistingEntry()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.GetService<IMigrator>().MigrateAsync("20261019031231_LinkEntriesAndSnapshotContestBank");
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO entry (code, token_hash, mode, status, answered, score, total_questions, created_at, submitted_at)
            VALUES ('AD-ABCDEF', 'legacy-token-hash', 'anon', 'submitted', 1, 1, 10,
                '2026-10-18 01:00:00', '2026-10-18 02:00:00')
            """);

        await db.Database.MigrateAsync();

        var entry = await db.Entries.SingleAsync();
        Assert.Equal("AD-ABCDEF", entry.Code);
        Assert.Equal(EntryStatuses.Submitted, entry.Status);
        Assert.Equal(1, entry.Score);
        Assert.Equal(10, entry.TotalQuestions);
        Assert.Null(entry.SubmissionResultJson);
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        Assert.False(db.Database.HasPendingModelChanges());
    }
}
