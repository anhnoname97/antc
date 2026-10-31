using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging.Abstractions;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionInboxTests
{
    [Fact]
    public async Task CountsMatchInboxFilters_AndExcludeDeletedRows()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = Database(connection); await db.Database.EnsureCreatedAsync();
        db.AddRange(Row("moi"), Row("dang-xu-ly"), Row("cho-duyet"), Row("da-xu-ly"),
            Row("da-xu-ly", true), Row("luu-tru"), Row("bo-qua"),
            new QuestionSubmission { Type = "kiennghi", Content = "Kiến nghị cần được xem xét", Status = "moi", CreatedAt = DateTime.UtcNow },
            new QuestionSubmission { Content = "Câu hỏi đã xóa", Status = "moi", CreatedAt = DateTime.UtcNow, DeletedAt = DateTime.UtcNow });
        await db.SaveChangesAsync(); var service = Submissions(db); var counts = await service.InboxCountsAsync();
        Assert.Equal(2, counts["moi"]); Assert.Equal(2, counts["luu-tru"]);
        foreach (string inbox in QuestionValues.Inboxes)
            Assert.Equal(counts[inbox], (await service.ListAsync(new(Inbox: inbox), 1)).Total);
        foreach (var type in QuestionValues.Types.Keys)
        {
            var typedCounts = await service.InboxCountsAsync(type: type);
            foreach (var inbox in QuestionValues.Inboxes)
                Assert.Equal((await service.ListAsync(new(Type: type, Inbox: inbox), 1)).Total, typedCounts[inbox]);
        }
        Assert.Equal("kiennghi", Assert.Single((await service.ListAsync(new(Type: "kiennghi", Inbox: "moi"), 1)).Items).Type);
    }

    [Fact]
    public async Task PendingDraftKeepsPublishedSnapshot_AndAssignmentIsSeparateFromActor()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = Database(connection); await db.Database.EnsureCreatedAsync();
        var row = Row("moi"); db.Add(row); await db.SaveChangesAsync();
        var service = new QuestionModerationService(db, TimeProvider.System);
        var approved = await service.ApproveAsync(row.Id, new(0, "moi", null, "Câu trả lời đã được duyệt", "Hướng dẫn", "/ung-pho/"), "reviewer");
        var pending = await service.SaveAsync(row.Id, new(approved.ReviewVersion, "cho-duyet", "PRIVATE", "Bản trả lời mới đang chờ duyệt", "Hướng dẫn", "/ung-pho/", "editor"), "reviewer");
        Assert.Equal("cho-duyet", pending.Status); Assert.Equal("editor", pending.AssignedTo); Assert.Equal("reviewer", pending.HandledBy);
        Assert.Equal("Câu trả lời đã được duyệt", (await service.GetPublishedAsync(row.Id))!.Answer);
        Assert.Single((await Submissions(db).ListAsync(new(Inbox: "cho-duyet"), 1)).Items);
        Assert.Equal(1, (await Submissions(db).InboxCountsAsync())["cho-duyet"]);
        var error = await Assert.ThrowsAsync<QuestionModerationException>(() => service.SaveAsync(row.Id,
            new(approved.ReviewVersion, "moi", null, "Bản cũ không được ghi đè"), "another-editor"));
        Assert.Equal("CONFLICT", error.Code);
        var archived = await service.SaveAsync(row.Id, new(pending.ReviewVersion, "luu-tru", null, pending.Answer), "editor");
        Assert.False(archived.IsPublished); Assert.Null(await service.GetPublishedAsync(row.Id)); Assert.NotNull(await service.GetAsync(row.Id));
        Assert.Single((await Submissions(db).ListAsync(new(Inbox: "luu-tru"), 1)).Items);
    }

    [Fact]
    public async Task PetitionRequiresGuidanceBeforePublication()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = Database(connection); await db.Database.EnsureCreatedAsync();
        var service = new QuestionModerationService(db, TimeProvider.System);
        var row = await service.CreateAsync(new("kiennghi", "Kiến nghị chặn các trang giả mạo"), "editor");
        await Assert.ThrowsAsync<QuestionModerationException>(() => service.ApproveAsync(row.Id, new(0, "moi", null, "Phản hồi kiến nghị đầy đủ"), "editor"));
        await service.ApproveAsync(row.Id, new(0, "moi", null, "Phản hồi kiến nghị đầy đủ", "Xem hướng dẫn", "/ung-pho/"), "editor");
        Assert.Equal("kiennghi", (await service.GetPublishedAsync(row.Id))!.Type);
    }

    [Fact]
    public async Task TwoQuestionsShareOnePrivateSummary_AndPublishOnlyOneAnswer()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = Database(connection); await db.Database.EnsureCreatedAsync();
        var first = Row("moi"); first.Content = "Có người tự xưng ngân hàng yêu cầu mã OTP?";
        var second = Row("moi"); second.Content = "Người lạ gọi yêu cầu đọc OTP, tôi phải làm sao?";
        db.AddRange(first, second); await db.SaveChangesAsync();
        var moderation = new QuestionModerationService(db, TimeProvider.System);
        var operations = new QuestionOperations(db, moderation, TimeProvider.System, [], NullLogger<QuestionOperations>.Instance);
        var summary = await operations.AggregateAsync(new(
            [new(first.Id, 0), new(second.Id, 0)],
            new("cau-hoi", "Nên làm gì khi có người yêu cầu cung cấp mã OTP?", "Không cung cấp OTP cho người gọi. Tự kiểm tra qua kênh chính thức.")), "editor");
        Assert.False(summary.IsPublished); Assert.Equal("tong-hop", summary.Source);
        Assert.Equal(new[] { first.Id, second.Id }, summary.AggregatedSourceIds);
        var source = await moderation.GetAsync(first.Id);
        Assert.Equal(summary.Content, source!.AggregatedIntoTitle);
        var detailedSummary = await moderation.GetAsync(summary.Id);
        Assert.Equal(first.Content, detailedSummary!.AggregatedSourceTitles[first.Id]);
        Assert.Equal(second.Content, detailedSummary.AggregatedSourceTitles[second.Id]);
        var listedSource = (await Submissions(db).ListAsync(new(Inbox: "da-tra-loi"), 1)).Items.Single(x => x.Id == first.Id);
        Assert.Equal(summary.Content, listedSource.AggregatedIntoTitle);
        Assert.Equal(first.Content, source!.Content); Assert.Equal("da-xu-ly", source.Status);
        Assert.Equal(summary.Id, source.AggregatedIntoId);
        Assert.Equal(summary.Id, (await moderation.GetAsync(second.Id))!.AggregatedIntoId);
        Assert.Empty((await moderation.ListAsync(new())).Items);
        await moderation.ApproveAsync(summary.Id, new(summary.ReviewVersion, "moi", null, summary.Answer,
            "Hướng dẫn ứng phó", "/ung-pho/"), "editor");
        Assert.Equal(summary.Id, Assert.Single((await moderation.ListAsync(new())).Items).Id);
    }

    [Fact]
    public async Task CommonReplyRejectsChangedSource_WithoutCreatingPartialSummary()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = Database(connection); await db.Database.EnsureCreatedAsync();
        var first = Row("moi"); var second = Row("moi"); db.AddRange(first, second); await db.SaveChangesAsync();
        var moderation = new QuestionModerationService(db, TimeProvider.System);
        var operations = new QuestionOperations(db, moderation, TimeProvider.System, [], NullLogger<QuestionOperations>.Instance);
        await moderation.SaveAsync(second.Id, new(0, "dang-xu-ly", "Người khác đang xử lý", null), "another-editor");
        var error = await Assert.ThrowsAsync<QuestionModerationException>(() => operations.AggregateAsync(new(
            [new(first.Id, 0), new(second.Id, 0)], new("cau-hoi", "Câu hỏi chung đã được biên tập", "Câu trả lời chung đủ nội dung")), "editor"));
        Assert.Equal("CONFLICT", error.Code); Assert.Equal(2, await db.QuestionSubmissions.CountAsync());
        Assert.Null((await moderation.GetAsync(first.Id))!.AggregatedIntoId);
        Assert.Equal("moi", (await moderation.GetAsync(first.Id))!.Status);
    }

    [Theory]
    [InlineData("dang-xu-ly")]
    [InlineData("cho-duyet")]
    [InlineData("da-xu-ly")]
    [InlineData("luu-tru")]
    public async Task CommonReplyOnlyAcceptsNewlyReceivedQuestions(string status)
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = Database(connection); await db.Database.EnsureCreatedAsync();
        var first = Row("moi"); var second = Row(status); db.AddRange(first, second); await db.SaveChangesAsync();
        var moderation = new QuestionModerationService(db, TimeProvider.System);
        var operations = new QuestionOperations(db, moderation, TimeProvider.System, [], NullLogger<QuestionOperations>.Instance);
        var error = await Assert.ThrowsAsync<QuestionModerationException>(() => operations.AggregateAsync(new(
            [new(first.Id, 0), new(second.Id, 0)], new("cau-hoi", "Câu hỏi chung đã được biên tập", "Câu trả lời chung đủ nội dung")), "editor"));
        Assert.Equal("VALIDATION", error.Code); Assert.Equal(2, await db.QuestionSubmissions.CountAsync());
        Assert.Null((await moderation.GetAsync(first.Id))!.AggregatedIntoId);
    }

    [Fact]
    public async Task AssignmentMigrationAppliesToSqlite()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = Database(connection); await db.Database.MigrateAsync();
        var row = Row("moi"); row.AssignedTo = "editor"; db.Add(row); await db.SaveChangesAsync();
        Assert.Equal("editor", (await new QuestionModerationService(db, TimeProvider.System).GetAsync(row.Id))!.AssignedTo);
    }
    private static QuestionSubmission Row(string status, bool published = false) => new()
    {
        Content = "Nội dung câu hỏi cần xử lý", Type = "cau-hoi", Status = status, IsPublished = published, CreatedAt = DateTime.UtcNow,
        ApprovedAt = published ? DateTime.UtcNow : null, PublishedAnswer = published ? "Câu trả lời đã công bố" : null
    };
    private static AppDbContext Database(SqliteConnection connection) => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
    private static QuestionSubmissionService Submissions(AppDbContext db) => new(db, Options.Create(new ContestSecurityOptions { IpHashSalt = "test-inbox-salt" }), TimeProvider.System);
}
