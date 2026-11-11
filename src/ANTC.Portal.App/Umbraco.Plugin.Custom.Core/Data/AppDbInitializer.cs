using System.Reflection;
using System.Text.Json;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Umbraco.Plugin.Custom.Core.Data;

/// <summary>
/// Chay khi ung dung khoi dong: tao thu muc CSDL, ap dung migration, bat WAL,
/// va nap ngan hang ban dau (200 cau chung, 78 cau doanh nghiep, 8 cau Thu suc) neu CSDL con trong.
/// Du lieu ban dau nam trong Data/Seed/*.json, lay tu ban dung.
/// </summary>
public class AppDbInitializer : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppDbInitializer> _logger;
    private readonly IHostEnvironment _environment;

    public AppDbInitializer(IServiceScopeFactory scopeFactory, ILogger<AppDbInitializer> logger, IHostEnvironment environment)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _environment = environment;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        string? file = db.Database.GetDbConnection().DataSource;
        if (!string.IsNullOrEmpty(file) && Path.GetDirectoryName(Path.GetFullPath(file)) is { } dir)
        {
            Directory.CreateDirectory(dir);
        }

        await ReconcileMergedMigrationHistoryAsync(db, cancellationToken);
        await db.Database.MigrateAsync(cancellationToken);
        await db.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;", cancellationToken);
        await db.Database.ExecuteSqlRawAsync("PRAGMA synchronous=NORMAL;", cancellationToken);

        if (!await db.QuizTopics.AnyAsync(cancellationToken))
        {
            await SeedQuizAsync(db, cancellationToken);
        }

        // QD-024 (G): cuoc thi mau chi o Development, khi bang contest trong
        if (_environment.IsDevelopment() && !await db.ContestCampaigns.AnyAsync(cancellationToken))
        {
            await SeedSampleContestAsync(db, cancellationToken);
        }
        await QuizBankRelease20261110.ApplyAsync(db, _logger, cancellationToken);
    }

    /// <summary>Cuoc thi mau giu 8 chuyen de chung; tai lieu luyen doanh nghiep khong tu dong them vao de thi.</summary>
    private async Task SeedSampleContestAsync(AppDbContext db, CancellationToken ct)
    {
        var vn = TimeSpan.FromHours(7);
        DateTime now = DateTime.UtcNow;
        var contest = new ContestCampaign
        {
            Name = "Cuộc thi mẫu (môi trường local)",
            Description = "Cuộc thi mẫu nạp tự động ở môi trường Development.",
            StartAt = new DateTimeOffset(2026, 10, 1, 0, 0, 0, vn).UtcDateTime,
            EndAt = new DateTimeOffset(2026, 12, 31, 23, 59, 59, vn).UtcDateTime,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };

        List<QuizTopic> topics = await db.QuizTopics.Where(t => t.IsActive && t.Type == QuizAudience.Personal && t.Audience == "general")
            .Include(t => t.Questions)
            .OrderBy(t => t.Id).ToListAsync(ct);
        contest.BankVersion = await db.QuizImports.Select(x => (long?)x.Id).MaxAsync(ct) ?? 0;

        int topicOrder = 0;
        int questionOrder = 0;
        foreach (QuizTopic topic in topics)
        {
            List<QuizQuestion> questions = topic.Questions.Where(q => q.IsActive)
                .OrderBy(q => q.SortOrder).ThenBy(q => q.Code).ToList();
            if (questions.Count == 0) continue;
            contest.Topics.Add(new ContestTopic
            {
                TopicId = topic.Id,
                SortOrder = ++topicOrder,
                Title = topic.Title,
                Intro = topic.Intro,
                Terms = topic.Terms,
            });
            foreach (QuizQuestion q in questions)
            {
                contest.Questions.Add(new ContestQuestion
                {
                    QuestionCode = q.Code,
                    TopicId = q.TopicId,
                    SortOrder = ++questionOrder,
                    Kind = q.Kind,
                    Situation = q.Situation,
                    QuestionText = q.Question,
                    Options = q.Options,
                    Answer = q.Answer,
                    Explanations = q.Explanations,
                    SafeAction = q.SafeAction,
                    ReadSeconds = q.ReadSeconds,
                    SampleOrder = q.SampleOrder,
                    SampleLabel = q.SampleLabel,
                });
            }
        }

        db.ContestCampaigns.Add(contest);
        await db.SaveChangesAsync(ct);
        _logger.LogInformation("Da nap cuoc thi mau: {Topics} chuyen de, {Questions} cau", contest.Topics.Count, contest.Questions.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>
    /// Hai nhánh từng phát hành độc lập hai migration có phần contest_id giao nhau.
    /// Nếu CSDL đã chạy migration snapshot trước khi merge, bổ sung ba cột cài đặt còn thiếu
    /// rồi đánh dấu migration cũ đã được hợp nhất. Không đụng dữ liệu entry hiện có.
    /// </summary>
    private static async Task ReconcileMergedMigrationHistoryAsync(AppDbContext db, CancellationToken ct)
    {
        const string settingsMigration = "20261018081328_AddEntryContestAndContestSettings";
        const string snapshotMigration = "20261019031231_LinkEntriesAndSnapshotContestBank";
        string[] applied = (await db.Database.GetAppliedMigrationsAsync(ct)).ToArray();
        if (!applied.Contains(snapshotMigration, StringComparer.Ordinal) ||
            applied.Contains(settingsMigration, StringComparer.Ordinal)) return;

        DbConnection connection = db.Database.GetDbConnection();
        bool close = connection.State != System.Data.ConnectionState.Open;
        if (close) await connection.OpenAsync(ct);
        try
        {
            if (!await ColumnExistsAsync(connection, "contest", "focus_area", ct))
                await ExecuteAsync(connection, "ALTER TABLE contest ADD COLUMN focus_area TEXT NULL", ct);
            if (!await ColumnExistsAsync(connection, "contest", "read_timer_factor", ct))
                await ExecuteAsync(connection, "ALTER TABLE contest ADD COLUMN read_timer_factor TEXT NOT NULL DEFAULT '1.0'", ct);
            if (!await ColumnExistsAsync(connection, "contest", "submit_grace_hours", ct))
                await ExecuteAsync(connection, "ALTER TABLE contest ADD COLUMN submit_grace_hours INTEGER NOT NULL DEFAULT 24", ct);

            await using DbCommand command = connection.CreateCommand();
            command.CommandText = "INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ($id, $version)";
            DbParameter id = command.CreateParameter();
            id.ParameterName = "$id";
            id.Value = settingsMigration;
            command.Parameters.Add(id);
            DbParameter version = command.CreateParameter();
            version.ParameterName = "$version";
            version.Value = ProductInfo.GetVersion();
            command.Parameters.Add(version);
            await command.ExecuteNonQueryAsync(ct);
        }
        finally
        {
            if (close) await connection.CloseAsync();
        }
    }

    private static async Task<bool> ColumnExistsAsync(
        DbConnection connection, string table, string column, CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info(\"{table}\")";
        await using DbDataReader reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            if (string.Equals(reader.GetString(1), column, StringComparison.OrdinalIgnoreCase)) return true;
        }
        return false;
    }

    private static async Task ExecuteAsync(DbConnection connection, string sql, CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(ct);
    }

    private async Task SeedQuizAsync(AppDbContext db, CancellationToken ct)
    {
        DateTime now = DateTime.UtcNow;
        using JsonDocument bank = JsonDocument.Parse(ReadResource("quiz-bank.json"));
        using JsonDocument enterprise = JsonDocument.Parse(ReadResource("quiz-enterprise.json"));
        using JsonDocument sample = JsonDocument.Parse(ReadResource("quiz-sample.json"));

        foreach (JsonProperty topic in bank.RootElement.EnumerateObject().Concat(enterprise.RootElement.EnumerateObject()).OrderBy(p => int.Parse(p.Name)))
        {
            int topicId = int.Parse(topic.Name);
            db.QuizTopics.Add(new QuizTopic
            {
                Id = topicId,
                Title = topic.Value.GetProperty("t").GetString() ?? "",
                Audience = topic.Value.TryGetProperty("audience", out var audience) ? audience.GetString() ?? "general" : "general",
                Type = enterprise.RootElement.TryGetProperty(topic.Name, out _) ? QuizAudience.Organization : QuizAudience.Personal,
                PublicCode = enterprise.RootElement.TryGetProperty(topic.Name, out _) ? $"dn{topicId - 8}" : null,
                ShortTitle = topic.Value.TryGetProperty("sh", out var shortTitle) ? shortTitle.GetString() : null,
                Caption = topic.Value.TryGetProperty("sub", out var caption) ? caption.GetString() : null,
                Intro = topic.Value.GetProperty("intro").GetRawText(),
                Terms = topic.Value.TryGetProperty("terms", out JsonElement terms) ? terms.GetRawText() : "[]",
                UpdatedAt = now,
            });

            int order = 0;
            foreach (JsonElement q in topic.Value.GetProperty("q").EnumerateArray())
            {
                db.QuizQuestions.Add(new QuizQuestion
                {
                    Code = q.GetProperty("code").GetString() ?? "",
                    TopicId = topicId,
                    Kind = q.GetProperty("kind").GetString() ?? "",
                    Situation = q.GetProperty("sit").GetString(),
                    Question = q.GetProperty("q").GetString() ?? "",
                    Options = q.GetProperty("opt").GetRawText(),
                    Answer = q.GetProperty("ans").GetString() ?? "",
                    Explanations = q.GetProperty("exp").GetRawText(),
                    SafeAction = q.GetProperty("safe").GetString(),
                    ReadSeconds = q.GetProperty("sec").GetInt32(),
                    SortOrder = ++order,
                    UpdatedAt = now,
                });
            }
        }

        await db.SaveChangesAsync(ct);

        int sampleOrder = 0;
        foreach (JsonElement s in sample.RootElement.EnumerateArray())
        {
            string code = s.GetProperty("code").GetString() ?? "";
            QuizQuestion? question = await db.QuizQuestions.FindAsync(new object[] { code }, ct);
            if (question is null)
            {
                _logger.LogWarning("Cau Thu suc {Code} khong co trong ngan hang, bo qua", code);
                continue;
            }

            question.SampleOrder = ++sampleOrder;
            question.SampleLabel = s.GetProperty("lab").GetString();
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation(
            "Da nap ngan hang cau hoi ban dau: {Topics} chuyen de, {Questions} cau, {Sample} cau Thu suc",
            await db.QuizTopics.CountAsync(ct), await db.QuizQuestions.CountAsync(ct), sampleOrder);
    }

    private static string ReadResource(string fileName)
    {
        Assembly assembly = typeof(AppDbInitializer).Assembly;
        string name = assembly.GetManifestResourceNames().Single(n => n.EndsWith("." + fileName, StringComparison.Ordinal));
        using Stream stream = assembly.GetManifestResourceStream(name)!;
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
