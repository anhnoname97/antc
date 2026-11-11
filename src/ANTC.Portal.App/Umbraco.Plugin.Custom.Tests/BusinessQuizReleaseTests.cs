using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class BusinessQuizReleaseTests
{
    [Fact]
    public async Task AudienceMigration_ClassifiesExistingRowsWithoutChangingQuestions()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        var migrator = Microsoft.EntityFrameworkCore.Infrastructure.AccessorExtensions.GetService<Microsoft.EntityFrameworkCore.Migrations.IMigrator>(db.Database);
        await migrator.MigrateAsync("20261110082551_AddBusinessQuizPublicCode");
        await db.Database.ExecuteSqlRawAsync("INSERT INTO quiz_topic (id,title,intro,is_active,updated_at,revision,public_code) VALUES (1,'Personal','[]',1,'2026-11-10',1,NULL),(9,'Enterprise','[]',1,'2026-11-10',1,'dn1')");
        await db.Database.MigrateAsync();
        Assert.Equal(QuizAudience.Personal, (await db.QuizTopics.FindAsync(1))!.Type);
        Assert.Equal(QuizAudience.Organization, (await db.QuizTopics.FindAsync(9))!.Type);
        Assert.False(db.Database.HasPendingModelChanges());
    }
    [Fact]
    public async Task Release_MigratesAndAddsThreeParts_AndIsIdempotent()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.MigrateAsync();
        await QuizBankRelease20261110.ApplyAsync(db, NullLogger.Instance, default);
        Assert.Equal(278, await db.QuizQuestions.CountAsync());
        Assert.Equal(11, await db.QuizTopics.CountAsync());
        foreach (var (code, count) in new[] { ("dn1", 18), ("dn2", 36), ("dn3", 24) })
        {
            var topic = await db.QuizTopics.SingleAsync(x => x.PublicCode == code);
            var questions = await db.QuizQuestions.Where(x => x.TopicId == topic.Id).ToListAsync();
            Assert.Equal(count, questions.Count);
            Assert.All(questions, q => { Assert.Equal(40, q.ReadSeconds); Assert.True(JsonDocument.Parse(q.Explanations).RootElement.TryGetProperty(q.Answer, out _)); });
        }
        var business = await db.QuizQuestions.SingleAsync(x => x.Code == "A01");
        business.Question = "Biên tập lại";
        await db.SaveChangesAsync();
        await QuizBankRelease20261110.ApplyAsync(db, NullLogger.Instance, default);
        Assert.Equal("Biên tập lại", business.Question);
        Assert.Single(await db.QuizImports.ToListAsync());
        Assert.False(db.Database.HasPendingModelChanges());
    }

    [Fact]
    public async Task Release_PreservesEditedRows_UpdatesOriginalRows_AndKeepsContestSnapshot()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var assembly = typeof(AppDbContext).Assembly;
        using var stream = assembly.GetManifestResourceStream(assembly.GetManifestResourceNames().Single(x => x.EndsWith(".quiz-bank-before-20261110.json")))!;
        using var old = JsonDocument.Parse(stream);
        db.QuizTopics.Add(new QuizTopic { Id = 1, Title = "Tên tự biên tập" });
        var source = old.RootElement.GetProperty("1").GetProperty("q").EnumerateArray().ToList();
        var originals = new[] { source[0], source.Single(x => x.GetProperty("code").GetString() == "CĐ1-041") };
        foreach (var q in originals)
            db.QuizQuestions.Add(new QuizQuestion { Code = q.GetProperty("code").GetString()!, TopicId = 1,
                Kind = q.GetProperty("kind").GetString()!, Situation = q.GetProperty("sit").GetString(),
                Question = q.GetProperty("q").GetString()!, Options = q.GetProperty("opt").GetRawText(),
                Answer = q.GetProperty("ans").GetString()!, Explanations = q.GetProperty("exp").GetRawText(),
                SafeAction = q.GetProperty("safe").GetString(), ReadSeconds = q.GetProperty("sec").GetInt32() });
        await db.SaveChangesAsync();
        var edited = await db.QuizQuestions.SingleAsync(x => x.Code == originals[0].GetProperty("code").GetString());
        edited.Question = "Nội dung tự biên tập"; edited.IsActive = false;
        var campaign = new ContestCampaign { Name = "Snapshot", StartAt = DateTime.UtcNow, EndAt = DateTime.UtcNow.AddDays(1) };
        campaign.Topics.Add(new ContestTopic { TopicId = 1, Title = "Tiêu đề đã chốt" });
        campaign.Questions.Add(new ContestQuestion { QuestionCode = edited.Code, TopicId = 1, QuestionText = "Đề đã chốt", Answer = "A" });
        db.ContestCampaigns.Add(campaign);
        await db.SaveChangesAsync();
        await QuizBankRelease20261110.ApplyAsync(db, NullLogger.Instance, default);
        Assert.Equal("Nội dung tự biên tập", edited.Question);
        Assert.False(edited.IsActive);
        Assert.Equal("Tên tự biên tập", (await db.QuizTopics.FindAsync(1))!.Title);
        Assert.Equal("Đề đã chốt", (await db.ContestQuestions.SingleAsync()).QuestionText);
        var updated = await db.QuizQuestions.SingleAsync(x => x.Code == originals[1].GetProperty("code").GetString());
        Assert.Equal(2, updated.Revision);
        Assert.Equal(0, updated.SortOrder); // Keep the editor's existing order.
    }
}
