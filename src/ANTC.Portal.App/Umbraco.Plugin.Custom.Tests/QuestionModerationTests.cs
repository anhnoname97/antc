using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionModerationTests
{
    private const string Original = "<script>alert('test')</script> Người dùng hỏi từ portal.";
    private const string Answer = "Đây là câu trả lời đã được ban biên tập duyệt.";

    [Fact]
    public async Task Original_question_is_immutable_and_neither_submission_nor_draft_is_public()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var service = fixture.Service(db);
        Assert.Empty((await service.ListAsync()).Items);
        var draft = await service.SaveAsync(1, new(0, "da-xu-ly", "Ghi chú bí mật", Answer), "editor");
        Assert.False(draft.IsPublished);
        Assert.Empty((await service.ListAsync()).Items);
        var approved = await service.ApproveAsync(1, new(draft.ReviewVersion, "da-xu-ly", draft.AdminNote, Answer), "approver");
        Assert.Equal(Original, approved.Content);
        Assert.Equal("approver", approved.ApprovedBy);
        Assert.Equal(fixture.Now, approved.ApprovedAt);
        var published = Assert.Single((await service.ListAsync()).Items);
        Assert.Equal(Original, published.Question);
        Assert.Equal(Answer, published.Answer);
        string json = JsonSerializer.Serialize(published);
        Assert.DoesNotContain("Contact", json);
        Assert.DoesNotContain("ApprovedBy", json);
        Assert.DoesNotContain("AdminNote", json);
        Assert.DoesNotContain("private@example.invalid", json);
        Assert.Equal("private@example.invalid", approved.Contact);
        var original = await db.QuestionSubmissions.AsNoTracking().SingleAsync();
        Assert.Equal(fixture.Now.UtcDateTime, original.ConsentAt);
        Assert.Equal("private-ip-hash", original.IpHash);
    }

    [Fact]
    public async Task Editing_answer_draft_does_not_change_approved_answer_until_next_approval()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var service = fixture.Service(db);
        var approved = await service.ApproveAsync(1, new(0, "moi", null, Answer), "approver");
        var draft = await service.SaveAsync(1, new(approved.ReviewVersion, "dang-xu-ly", null, "Bản nháp mới chưa được duyệt."), "editor");
        Assert.True(draft.IsPublished);
        Assert.Equal(Answer, Assert.Single((await service.ListAsync()).Items).Answer);
        await service.ApproveAsync(1, new(draft.ReviewVersion, draft.Status, null, draft.Answer), "approver");
        Assert.Equal(draft.Answer, Assert.Single((await service.ListAsync()).Items).Answer);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Unpublish_or_ignore_removes_question_from_public_results(bool ignore)
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var service = fixture.Service(db);
        var row = await service.ApproveAsync(1, new(0, "moi", null, Answer), "approver");
        if (ignore) await service.SaveAsync(1, new(row.ReviewVersion, "bo-qua", "Ẩn câu hỏi", Answer), "editor");
        else await service.UnpublishAsync(1, row.ReviewVersion, "editor");
        Assert.Empty((await service.ListAsync()).Items);
        var hidden = await service.GetAsync(1);
        Assert.False(hidden!.IsPublished);
        Assert.Equal("editor", hidden.HandledBy);
        Assert.Equal(Answer, hidden.PublishedAnswer); // Giữ lịch sử bản đã duyệt.
    }

    [Fact]
    public async Task Stale_editor_cannot_save_approve_or_revoke_a_newer_review()
    {
        await using var fixture = await Fixture.Create();
        await using var first = fixture.Open();
        await using var second = fixture.Open();
        await fixture.Service(first).SaveAsync(1, new(0, "dang-xu-ly", null, Answer), "first");
        var service = fixture.Service(second);
        foreach (var operation in new Func<Task>[] {
            () => service.SaveAsync(1, new(0, "moi", null, null), "stale"),
            () => service.ApproveAsync(1, new(0, "moi", null, Answer), "stale"),
            () => service.UnpublishAsync(1, 0, "stale") })
            Assert.Equal("CONFLICT", (await Assert.ThrowsAsync<QuestionModerationException>(operation)).Code);
        Assert.Equal("first", (await service.GetAsync(1))!.HandledBy);
        Assert.Empty((await service.ListAsync()).Items);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("quá ngắn")]
    public async Task Approval_requires_an_answer(string? answer)
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var service = fixture.Service(db);
        Assert.Equal("VALIDATION", (await Assert.ThrowsAsync<QuestionModerationException>(
            () => service.ApproveAsync(1, new(0, "moi", null, answer), "editor"))).Code);
        Assert.Equal(0, (await service.GetAsync(1))!.ReviewVersion);
    }

    [Fact]
    public async Task Feedback_and_invalid_reviews_cannot_be_published()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        await db.QuestionSubmissions.Where(x => x.Id == 1).ExecuteUpdateAsync(set => set.SetProperty(x => x.Type, "gop-y"));
        var service = fixture.Service(db);
        Assert.Equal("VALIDATION", (await Assert.ThrowsAsync<QuestionModerationException>(
            () => service.ApproveAsync(1, new(0, "moi", null, Answer), "editor"))).Code);
        foreach (var review in new QuestionReview[] { new(-1, "moi", null, null), new(0, "bad", null, null),
            new(0, "moi", new string('x', 1001), null), new(0, "moi", null, new string('x', 10001)) })
            Assert.Equal("VALIDATION", (await Assert.ThrowsAsync<QuestionModerationException>(() => service.SaveAsync(1, review, "editor"))).Code);
        Assert.Equal("NOT_FOUND", (await Assert.ThrowsAsync<QuestionModerationException>(
            () => service.SaveAsync(100, new(0, "moi", null, null), "editor"))).Code);
    }

    [Fact]
    public async Task Public_list_is_paged_and_excludes_unapproved_incomplete_and_feedback_rows()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        db.QuestionSubmissions.AddRange(Enumerable.Range(2, 21).Select(id => new QuestionSubmission
        { Id = id, Content = "Câu hỏi công khai " + id, PublishedAnswer = Answer, IsPublished = true, ApprovedAt = fixture.Now.UtcDateTime.AddMinutes(id) }));
        db.QuestionSubmissions.Add(new() { Id = 30, Content = "Thiếu ngày duyệt", PublishedAnswer = Answer, IsPublished = true });
        db.QuestionSubmissions.Add(new() { Id = 31, Content = "Thiếu câu trả lời", IsPublished = true, ApprovedAt = fixture.Now.UtcDateTime });
        db.QuestionSubmissions.Add(new() { Id = 32, Type = "gop-y", Content = "Góp ý riêng", PublishedAnswer = Answer, IsPublished = true, ApprovedAt = fixture.Now.UtcDateTime });
        await db.SaveChangesAsync();
        var service = fixture.Service(db);
        var page1 = await service.ListAsync(); var page2 = await service.ListAsync(2);
        Assert.Equal(21, page1.Total); Assert.Equal(20, page1.Items.Count); Assert.Single(page2.Items);
        Assert.Equal(22, page1.Items[0].Id);
        Assert.Empty(page1.Items.Select(x => x.Id).Intersect(page2.Items.Select(x => x.Id)));
    }

    [Fact]
    public async Task Migration_preserves_existing_submissions_and_defaults_them_to_private()
    {
        await using var fixture = new Fixture();
        await using var db = fixture.Open();
        await db.GetService<IMigrator>().MigrateAsync("20261016030901_QuestionSubmissionIpWindowIndex");
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO question_submission (type,content,want_reply,consent_at,status,created_at) VALUES ({"cau-hoi"},{Original},{false},{fixture.Now.UtcDateTime},{"moi"},{fixture.Now.UtcDateTime})");
        await db.Database.MigrateAsync();
        var row = await db.QuestionSubmissions.AsNoTracking().SingleAsync();
        Assert.Equal(Original, row.Content); Assert.False(row.IsPublished);
        Assert.Null(row.Answer); Assert.Null(row.PublishedAnswer); Assert.Null(row.ApprovedAt);
        Assert.Equal(0, row.ReviewVersion);
    }

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
    private sealed class Fixture : IAsyncDisposable
    {
        private readonly string path = Path.Combine(Path.GetTempPath(), "antc-moderation-" + Guid.NewGuid().ToString("N") + ".db");
        public DateTimeOffset Now { get; } = new(2026, 10, 16, 5, 0, 0, TimeSpan.Zero);
        public AppDbContext Open() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite("Data Source=" + path + ";Pooling=False").Options);
        public QuestionModerationService Service(AppDbContext db) => new(db, new FixedClock(Now));
        public static async Task<Fixture> Create()
        {
            var fixture = new Fixture(); await using var db = fixture.Open(); await db.Database.EnsureCreatedAsync();
            db.QuestionSubmissions.Add(new() { Id = 1, Content = Original, WantReply = true, Contact = "private@example.invalid", IpHash = "private-ip-hash", ConsentAt = fixture.Now.UtcDateTime, CreatedAt = fixture.Now.UtcDateTime });
            await db.SaveChangesAsync(); return fixture;
        }
        public ValueTask DisposeAsync() { foreach (string suffix in new[] { "", "-wal", "-shm" }) File.Delete(path + suffix); return ValueTask.CompletedTask; }
    }
}
