using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionGuidanceTests
{
    [Fact]
    public async Task DraftChanges_DoNotChangePublishedGuidance_UntilApprovedAgain()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync();
        var submission = NewQuestion(); db.Add(submission); await db.SaveChangesAsync();
        var service = new QuestionModerationService(db, TimeProvider.System);
        var first = await service.ApproveAsync(submission.Id, new(0, "da-xu-ly", null,
            "Câu trả lời đã được duyệt", "Xem việc cần làm khi nhận tiền lạ", "/ung-pho/"), "editor");
        var draft = await service.SaveAsync(submission.Id, new(first.ReviewVersion, "dang-xu-ly", "PRIVATE_NOTE",
            "PRIVATE_DRAFT", "PRIVATE_LINK_LABEL", "/draft/"), "editor");
        var published = await service.GetPublishedAsync(submission.Id);
        Assert.Equal("/ung-pho/", published!.GuidanceUrl);
        Assert.Equal("Xem việc cần làm khi nhận tiền lạ", published.GuidanceLabel);
        Assert.Equal("Câu trả lời đã được duyệt", published.Answer);
        var page = await service.ListAsync(new(PageSize: 6));
        Assert.Equal(published, Assert.Single(page.Items));
        var second = await service.ApproveAsync(submission.Id, new(draft.ReviewVersion, "da-xu-ly", null,
            "Câu trả lời được duyệt lại", "Xem hướng dẫn mới", "/ung-pho/#moi"), "editor");
        Assert.Equal("/ung-pho/#moi", (await service.GetPublishedAsync(submission.Id))!.GuidanceUrl);
        await service.UnpublishAsync(submission.Id, second.ReviewVersion, "editor");
        Assert.Null(await service.GetPublishedAsync(submission.Id));
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("Xem hướng dẫn", "javascript:alert(1)")]
    [InlineData("Xem hướng dẫn", "//evil.example")]
    [InlineData("Xem hướng dẫn", "/\\evil.example")]
    [InlineData("Xem hướng dẫn", "data:text/html,unsafe")]
    [InlineData("Xem hướng dẫn", null)]
    public async Task Approval_RejectsMissingOrUnsafeGuidance(string? label, string? url)
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync(); var row = NewQuestion(); db.Add(row); await db.SaveChangesAsync();
        var service = new QuestionModerationService(db, TimeProvider.System);
        await Assert.ThrowsAsync<QuestionModerationException>(() => service.ApproveAsync(row.Id,
            new(0, "da-xu-ly", null, "Câu trả lời có đủ nội dung", label, url), "editor"));
        Assert.Null(await service.GetPublishedAsync(row.Id));
    }

    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(1, 1, 0)]
    [InlineData(2, 2, 0)]
    [InlineData(7, 6, 1)]
    public async Task SixItemPages_FilterOnlyPublishedQuestions(int count, int firstCount, int secondCount)
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(); await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync();
        for (int i = 0; i < count; i++)
        {
            var row = NewQuestion(); row.IsPublished = true; row.PublishedAnswer = "Câu trả lời đã duyệt";
            row.PublishedGuidanceLabel = "Xem hướng dẫn"; row.PublishedGuidanceUrl = "/ung-pho/";
            row.ApprovedAt = DateTime.UtcNow; db.Add(row);
        }
        db.Add(NewQuestion());
        var feedback = NewQuestion(); feedback.Type = "gop-y"; feedback.IsPublished = true;
        feedback.ApprovedAt = DateTime.UtcNow; feedback.PublishedAnswer = "PRIVATE_FEEDBACK"; db.Add(feedback);
        await db.SaveChangesAsync(); var service = new QuestionModerationService(db, TimeProvider.System);
        var first = await service.ListAsync(new(PageSize: 6, Type: "cau-hoi")); var second = await service.ListAsync(new(Page: 2, PageSize: 6, Type: "cau-hoi"));
        Assert.Equal(count, first.Total); Assert.Equal(firstCount, first.Items.Count); Assert.Equal(secondCount, second.Items.Count);
    }

    private static AppDbContext CreateDb(SqliteConnection connection) => new(
        new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
    private static QuestionSubmission NewQuestion() => new()
    {
        Type = "cau-hoi", Content = "Tôi nên làm gì khi gặp tình huống lừa đảo?", ConsentAt = DateTime.UtcNow,
        CreatedAt = DateTime.UtcNow, Contact = "PRIVATE_CONTACT", WantReply = true, Status = "moi"
    };
}
