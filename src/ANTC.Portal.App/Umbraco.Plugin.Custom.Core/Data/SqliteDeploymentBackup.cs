using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace Umbraco.Plugin.Custom.Core.Data;

public static class SqliteDeploymentBackup
{
    public static int Create(string appDatabase, string cmsDatabase, string destination)
    {
        string[] sources = [Path.GetFullPath(appDatabase), Path.GetFullPath(cmsDatabase)];
        string target = Path.GetFullPath(destination);
        if (Directory.Exists(target) || File.Exists(target) || sources.Distinct(StringComparer.OrdinalIgnoreCase).Count() != 2 ||
            sources.Any(p => !File.Exists(p) || !p.EndsWith(".db", StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("BACKUP_INVALID_PATH");
        Directory.CreateDirectory(target);
        var files = new List<object>();
        for (int i = 0; i < sources.Length; i++)
        {
            string output = Path.Combine(target, i == 0 ? "app.sqlite.db" : "Umbraco.sqlite.db");
            using var input = new SqliteConnection(new SqliteConnectionStringBuilder
                { DataSource = sources[i], Mode = SqliteOpenMode.ReadOnly, Pooling = false }.ToString());
            using var backup = new SqliteConnection(new SqliteConnectionStringBuilder
                { DataSource = output, Mode = SqliteOpenMode.ReadWriteCreate, Pooling = false }.ToString());
            input.Open(); backup.Open();
            // Includes committed WAL frames; file copy alone may miss them.
            input.BackupDatabase(backup);
            using var command = backup.CreateCommand();
            command.CommandText = "PRAGMA quick_check";
            if (!string.Equals(command.ExecuteScalar() as string, "ok", StringComparison.Ordinal))
                throw new InvalidOperationException("BACKUP_INTEGRITY_FAILED");
            backup.Close();
            using var stream = File.OpenRead(output);
            files.Add(new { name = Path.GetFileName(output), sha256 = Convert.ToHexStringLower(SHA256.HashData(stream)) });
        }
        File.WriteAllText(Path.Combine(target, "backup.json"), JsonSerializer.Serialize(new
        { createdAtUtc = DateTimeOffset.UtcNow, files }, new JsonSerializerOptions { WriteIndented = true }));
        return 0;
    }
}
