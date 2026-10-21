using Microsoft.Data.Sqlite;

namespace Umbraco.Plugin.Custom.Core.Administration;

public interface IPrivacyFileCleanup
{
    Task RunAsync(string connectionString, bool vacuum, CancellationToken ct);
}

public sealed class SqlitePrivacyFileCleanup : IPrivacyFileCleanup
{
    public async Task RunAsync(string connectionString, bool vacuum, CancellationToken ct)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString) { Pooling = false, DefaultTimeout = 30 };
        await using var connection = new SqliteConnection(builder.ConnectionString);
        await connection.OpenAsync(ct);
        if (vacuum)
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "VACUUM;"; command.CommandTimeout = 120;
            await command.ExecuteNonQueryAsync(ct);
        }
        await using var checkpoint = connection.CreateCommand();
        checkpoint.CommandText = "PRAGMA wal_checkpoint(TRUNCATE);";
        await using var reader = await checkpoint.ExecuteReaderAsync(ct);
        if (await reader.ReadAsync(ct) && reader.GetInt32(0) != 0) throw new SqliteException("Checkpoint busy", 5);
    }
}
