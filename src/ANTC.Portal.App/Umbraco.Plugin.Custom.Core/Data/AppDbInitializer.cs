using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Umbraco.Plugin.Custom.Core.Data;

/// <summary>
/// Chay khi ung dung khoi dong: tao thu muc CSDL, ap dung migration, bat WAL,
/// va nap ngan hang cau hoi ban dau (8 chuyen de, 200 cau, 8 cau Thu suc) neu CSDL con trong.
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
    }

    /// <summary>Mot cuoc gom moi chuyen de va cau dang dung, 2026-10-01 den 2026-12-31 gio Viet Nam.</summary>
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

        var questions = await db.QuizQuestions.Where(q => q.IsActive)
            .OrderBy(q => q.TopicId).ThenBy(q => q.SortOrder).ThenBy(q => q.Code)
            .Select(q => new { q.Code, q.TopicId }).ToListAsync(ct);

        int topicOrder = 0;
        foreach (int topicId in questions.Select(q => q.TopicId).Distinct())
        {
            contest.Topics.Add(new ContestTopic { TopicId = topicId, SortOrder = ++topicOrder });
        }

        int questionOrder = 0;
        foreach (var q in questions)
        {
            contest.Questions.Add(new ContestQuestion { QuestionCode = q.Code, SortOrder = ++questionOrder });
        }

        db.ContestCampaigns.Add(contest);
        await db.SaveChangesAsync(ct);
        _logger.LogInformation("Da nap cuoc thi mau: {Topics} chuyen de, {Questions} cau", contest.Topics.Count, contest.Questions.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task SeedQuizAsync(AppDbContext db, CancellationToken ct)
    {
        DateTime now = DateTime.UtcNow;
        using JsonDocument bank = JsonDocument.Parse(ReadResource("quiz-bank.json"));
        using JsonDocument sample = JsonDocument.Parse(ReadResource("quiz-sample.json"));

        foreach (JsonProperty topic in bank.RootElement.EnumerateObject().OrderBy(p => int.Parse(p.Name)))
        {
            int topicId = int.Parse(topic.Name);
            db.QuizTopics.Add(new QuizTopic
            {
                Id = topicId,
                Title = topic.Value.GetProperty("t").GetString() ?? "",
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
