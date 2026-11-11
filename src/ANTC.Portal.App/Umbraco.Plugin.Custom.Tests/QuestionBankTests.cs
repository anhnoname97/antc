using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionBankTests
{
    [Fact]
    public async Task FreshStartup_MigratesAndSeedsBothAudiences_WhileDemoContestKeepsGeneralQuestions()
    {
        string file = Path.Combine(Path.GetTempPath(), $"antc-seed-{Guid.NewGuid():N}.db");
        try
        {
            await using var services = new ServiceCollection().AddDbContext<AppDbContext>(o => o.UseSqlite($"Data Source={file};Pooling=False")).BuildServiceProvider();
            var initializer = new AppDbInitializer(services.GetRequiredService<IServiceScopeFactory>(),
                Microsoft.Extensions.Logging.Abstractions.NullLogger<AppDbInitializer>.Instance, new SeedHost());
            await initializer.StartAsync(default);
            await using var scope = services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Equal(11, await db.QuizTopics.CountAsync());
            Assert.Equal(200, await db.QuizQuestions.CountAsync(q => q.Topic!.Audience == "general"));
            Assert.Equal(78, await db.QuizQuestions.CountAsync(q => q.Topic!.Audience == "enterprise"));
            Assert.Equal(8, await db.QuizQuestions.CountAsync(q => q.SampleOrder != null));
            Assert.Equal(200, await db.ContestQuestions.CountAsync());
            var question = await db.QuizQuestions.SingleAsync(q => q.Code == "A01");
            question.Question = "Nội dung biên tập đã sửa trong backoffice";
            await db.SaveChangesAsync();
            await initializer.StartAsync(default);
            await db.Entry(question).ReloadAsync();
            Assert.Equal("Nội dung biên tập đã sửa trong backoffice", question.Question);
            Assert.Equal(278, await db.QuizQuestions.CountAsync());
        }
        finally { Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools(); File.Delete(file); }
    }

    private sealed class SeedHost : Microsoft.Extensions.Hosting.IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = new Microsoft.Extensions.FileProviders.NullFileProvider();
    }

    [Fact]
    public async Task PracticeAudiences_ExposeMetadataAndSeparateCounts_WithoutChangingTotalOrSample()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-audiences-{Guid.NewGuid():N}.db");
        try
        {
            await using ServiceProvider provider = CreateProvider(databasePath);
            await using (AsyncServiceScope scope = provider.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.EnsureCreatedAsync();
                db.QuizTopics.AddRange(Topic(1, true), new QuizTopic { Id = 9, Title = "Phần A · Câu độc lập",
                    Audience = "enterprise", ShortTitle = "Phần A", Caption = "{count} câu độc lập" });
                db.QuizQuestions.AddRange(Question("GENERAL", 1, 1, sampleOrder: 1), Question("BUSINESS", 9, 1));
                await db.SaveChangesAsync();
            }
            var snapshot = new QuestionBank(provider.GetRequiredService<IServiceScopeFactory>()).Current;
            Assert.Equal(2, snapshot.TotalQuestions);
            Assert.Equal(1, snapshot.GeneralQuestionCount); Assert.Equal(1, snapshot.EnterpriseQuestionCount);
            var enterprise = Assert.Single(snapshot.Topics, t => t.Audience == "enterprise");
            Assert.Equal("Phần A", enterprise.ShortTitle); Assert.Equal("{count} câu độc lập", enterprise.Caption);
            Assert.Equal("BUSINESS", Assert.Single(snapshot.QuestionsByTopic[9]).Code);
            Assert.Equal("GENERAL", Assert.Single(snapshot.Sample).Code);
        }
        finally { Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools(); File.Delete(databasePath); }
    }

    [Fact]
    public async Task Snapshot_ContainsOnlyActiveTopicsAndTheirActiveQuestions_InConfiguredOrder()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-question-bank-{Guid.NewGuid():N}.db");
        try
        {
            await using ServiceProvider provider = CreateProvider(databasePath);
            await using (AsyncServiceScope setupScope = provider.CreateAsyncScope())
            {
                AppDbContext db = setupScope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.EnsureCreatedAsync();
                db.QuizTopics.AddRange(
                    Topic(1, isActive: true),
                    Topic(2, isActive: true),
                    Topic(3, isActive: false));
                db.QuizQuestions.AddRange(
                    Question("ACTIVE-2", 2, sortOrder: 20, sampleOrder: 2),
                    Question("ACTIVE-1", 2, sortOrder: 10, sampleOrder: 1),
                    Question("QUESTION-OFF", 2, sortOrder: 5, isActive: false),
                    Question("TOPIC-OFF", 3, sortOrder: 1, sampleOrder: 3));
                db.QuizImports.Add(new QuizImport
                {
                    Id = 7,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "test",
                    FileName = "bank.xlsx",
                });
                await db.SaveChangesAsync();
            }

            var bank = new QuestionBank(provider.GetRequiredService<IServiceScopeFactory>());
            QuestionBankSnapshot snapshot = bank.Current;

            Assert.Equal(7, snapshot.Version);
            Assert.Equal(new[] { "1", "2" }, snapshot.Topics.Select(x => x.Cd));
            Assert.Empty(snapshot.QuestionsByTopic[1]);
            Assert.Equal(new[] { "ACTIVE-1", "ACTIVE-2" }, snapshot.QuestionsByTopic[2].Select(x => x.Code));
            Assert.False(snapshot.QuestionsByTopic.ContainsKey(3));
            Assert.Equal(new[] { "ACTIVE-1", "ACTIVE-2" }, snapshot.Sample.Select(x => x.Code));
            Assert.Equal(2, snapshot.TotalQuestions);
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task Current_UsesMemorySnapshotUntilExplicitReload()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-question-bank-{Guid.NewGuid():N}.db");
        try
        {
            await using ServiceProvider provider = CreateProvider(databasePath);
            await using (AsyncServiceScope setupScope = provider.CreateAsyncScope())
            {
                AppDbContext db = setupScope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.EnsureCreatedAsync();
                db.QuizTopics.Add(Topic(1, isActive: true));
                await db.SaveChangesAsync();
            }

            var bank = new QuestionBank(provider.GetRequiredService<IServiceScopeFactory>());
            QuestionBankSnapshot first = bank.Current;

            await using (AsyncServiceScope updateScope = provider.CreateAsyncScope())
            {
                AppDbContext db = updateScope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.QuizQuestions.Add(Question("NEW", 1, sortOrder: 1));
                db.QuizImports.Add(new QuizImport
                {
                    Id = 1,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "test",
                    FileName = "new-bank.xlsx",
                });
                await db.SaveChangesAsync();
            }

            Assert.Same(first, bank.Current);
            Assert.Empty(bank.Current.QuestionsByTopic[1]);

            bank.Reload();

            Assert.NotSame(first, bank.Current);
            Assert.Equal(1, bank.Current.Version);
            Assert.Equal("NEW", Assert.Single(bank.Current.QuestionsByTopic[1]).Code);
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task CurrentAt_UsesFrozenQuestionSelectionOfActiveContest()
    {
        string databasePath = Path.Combine(Path.GetTempPath(), $"antc-question-bank-{Guid.NewGuid():N}.db");
        try
        {
            await using ServiceProvider provider = CreateProvider(databasePath);
            DateTime now = DateTime.UtcNow;
            await using (AsyncServiceScope scope = provider.CreateAsyncScope())
            {
                AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.EnsureCreatedAsync();
                db.QuizTopics.Add(Topic(1, true));
                db.QuizQuestions.Add(Question("LIVE", 1, 1));
                var contest = new ContestCampaign { Name = "Active", StartAt = now.AddHours(-1), EndAt = now.AddHours(1), IsActive = true, BankVersion = 5, Revision = 2, CreatedAt = now, UpdatedAt = now };
                contest.Topics.Add(new ContestTopic { TopicId = 1, Title = "Frozen topic", Intro = "[]", SortOrder = 0 });
                contest.Questions.Add(new ContestQuestion { QuestionCode = "LIVE", TopicId = 1, Kind = "kind", QuestionText = "Frozen question", Options = "[[\"A\",\"A\"],[\"B\",\"B\"]]", Answer = "B", Explanations = "{}", SortOrder = 0 });
                db.ContestCampaigns.Add(contest);
                await db.SaveChangesAsync();
            }

            var bank = new QuestionBank(provider.GetRequiredService<IServiceScopeFactory>());
            QuestionBankSnapshot snapshot = bank.CurrentAt(now);

            Assert.Equal("quiz-c1-v5-r2", snapshot.CacheKey);
            Assert.Equal("Frozen topic", Assert.Single(snapshot.Topics).Title);
            Assert.Equal("Frozen question", Assert.Single(snapshot.QuestionsByTopic[1]).Q);
            Assert.Equal("B", snapshot.Keys["LIVE"].Answer);
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    private static ServiceProvider CreateProvider(string databasePath)
    {
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite($"Data Source={databasePath}"));
        return services.BuildServiceProvider();
    }

    private static QuizTopic Topic(int id, bool isActive) => new()
    {
        Id = id,
        Title = $"Topic {id}",
        Intro = "[]",
        Terms = "[]",
        IsActive = isActive,
        UpdatedAt = DateTime.UtcNow,
    };

    private static QuizQuestion Question(
        string code,
        int topicId,
        int sortOrder,
        int? sampleOrder = null,
        bool isActive = true) => new()
    {
        Code = code,
        TopicId = topicId,
        Kind = "kind",
        Question = "question",
        Options = "[[\"A\",\"Option A\"],[\"B\",\"Option B\"]]",
        Answer = "A",
        Explanations = "{\"A\":\"Correct\",\"B\":\"Incorrect\"}",
        SampleOrder = sampleOrder,
        SampleLabel = sampleOrder is null ? null : "Sample",
        SortOrder = sortOrder,
        IsActive = isActive,
        UpdatedAt = DateTime.UtcNow,
    };
}
