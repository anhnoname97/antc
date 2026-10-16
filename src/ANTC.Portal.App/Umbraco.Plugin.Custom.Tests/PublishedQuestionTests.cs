using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class PublishedQuestionTests
{
    [Fact]
    public async Task Paging_uses_requested_size_counts_only_public_rows_and_has_stable_ties()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var service = fixture.Service(db);
        var defaults = await service.ListAsync(new());
        Assert.Equal(27, defaults.Total); Assert.Equal(20, defaults.PageSize);
        Assert.Equal(20, defaults.Items.Count); Assert.Equal(2, defaults.TotalPages);
        var page = await service.ListAsync(new(Page: 2, PageSize: 7));
        Assert.Equal(2, page.Page); Assert.Equal(7, page.PageSize); Assert.Equal(4, page.TotalPages);
        Assert.Equal(Enumerable.Range(14, 7).Reverse().Select(x => (long)x), page.Items.Select(x => x.Id));
        var newest = await service.ListAsync(new(PageSize: 50));
        var oldest = await service.ListAsync(new(PageSize: 50, Sort: "oldest"));
        Assert.Equal(Enumerable.Range(1, 27).Select(x => (long)x), oldest.Items.Select(x => x.Id));
        Assert.Equal(oldest.Items.Select(x => x.Id).Reverse(), newest.Items.Select(x => x.Id));
        var beyond = await service.ListAsync(new(Page: int.MaxValue, PageSize: 50));
        Assert.Empty(beyond.Items); Assert.Equal(27, beyond.Total); Assert.Equal(int.MaxValue, beyond.Page);
    }

    [Theory]
    [InlineData("đường dẫn")]
    [InlineData("ĐƯỜNG DẪN")]
    [InlineData("  Đường DẫN  ")]
    public async Task Search_matches_question_or_approved_answer_with_Vietnamese_case_and_trim(string search)
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var first = await db.QuestionSubmissions.FindAsync(1L);
        var second = await db.QuestionSubmissions.FindAsync(2L);
        first!.Content = "Câu hỏi về ĐƯỜNG DẪN lạ.";
        second!.PublishedAnswer = "Đây là đường dẫn chính thức.";
        await db.SaveChangesAsync();
        var service = fixture.Service(db);
        var matches = await service.ListAsync(new(PageSize: 1, Search: search));
        Assert.Equal(2, matches.Total); Assert.Equal(2, matches.TotalPages);
        Assert.Equal(2, Assert.Single(matches.Items).Id);
        var next = await service.ListAsync(new(Page: 2, PageSize: 1, Search: search));
        Assert.Equal(1, Assert.Single(next.Items).Id);
        Assert.Empty((await service.ListAsync(new(Search: "duong dan"))).Items);
    }

    [Theory]
    [InlineData("%")]
    [InlineData("_")]
    [InlineData("*")]
    [InlineData("?")]
    [InlineData("[")]
    [InlineData("]")]
    [InlineData("[ab]")]
    [InlineData("a-b")]
    [InlineData("\\")]
    [InlineData("' OR 1=1 --")]
    public async Task Search_metacharacters_are_literal_and_cannot_expand_the_query(string search)
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        (await db.QuestionSubmissions.FindAsync(1L))!.Content = "Tìm ký tự " + search + " trong câu hỏi.";
        await db.SaveChangesAsync();
        var result = await fixture.Service(db).ListAsync(new(Search: search));
        Assert.Equal(1, result.Total); Assert.Equal(1, Assert.Single(result.Items).Id);
    }

    [Fact]
    public async Task Search_cannot_discover_contact_notes_drafts_or_unpublished_content()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var row = (await db.QuestionSubmissions.FindAsync(1L))!;
        row.Contact = "LIEN-HE-RIENG"; row.AdminNote = "GHI-CHU-RIENG"; row.Answer = "BAN-NHAP-RIENG";
        await db.SaveChangesAsync();
        var service = fixture.Service(db);
        foreach (string term in new[] { "LIEN-HE-RIENG", "GHI-CHU-RIENG", "BAN-NHAP-RIENG", "CHI-NOI-BO" })
        {
            var result = await service.ListAsync(new(Search: term));
            Assert.Empty(result.Items); Assert.Equal(0, result.Total); Assert.Equal(1, result.TotalPages);
        }
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(100)]
    [InlineData(101)]
    [InlineData(102)]
    [InlineData(103)]
    [InlineData(104)]
    [InlineData(105)]
    [InlineData(long.MaxValue)]
    public async Task Detail_is_absent_for_missing_unpublished_feedback_or_incomplete_records(long id)
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        Assert.Null(await fixture.Service(db).GetPublishedAsync(id));
    }

    [Fact]
    public async Task Detail_and_search_use_the_approved_snapshot_and_withdraw_immediately()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var service = fixture.Service(db);
        var published = (await service.GetPublishedAsync(1))!;
        var draft = await service.SaveAsync(1, new(0, "dang-xu-ly", "GHI-CHU-RIENG", "BAN-NHAP-RIENG chưa được duyệt."), "editor");
        Assert.Equal(published, await service.GetPublishedAsync(1));
        Assert.Empty((await service.ListAsync(new(Search: "BAN-NHAP-RIENG"))).Items);
        string json = JsonSerializer.Serialize(published, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        using var document = JsonDocument.Parse(json);
        Assert.Equal(new[] { "answer", "answeredAt", "id", "question" },
            document.RootElement.EnumerateObject().Select(x => x.Name).Order());
        var revoked = await service.UnpublishAsync(1, draft.ReviewVersion, "editor");
        Assert.Null(await service.GetPublishedAsync(1));
        Assert.Empty((await service.ListAsync(new(Search: "công khai 1."))).Items);
        await service.ApproveAsync(1, new(revoked.ReviewVersion, "dang-xu-ly", null, draft.Answer), "editor");
        Assert.Equal(draft.Answer, (await service.GetPublishedAsync(1))!.Answer);
        Assert.Equal(1, Assert.Single((await service.ListAsync(new(Search: "BAN-NHAP-RIENG"))).Items).Id);
    }

    [Fact]
    public async Task Invalid_pagination_is_rejected_before_running_the_query()
    {
        await using var fixture = await Fixture.Create();
        await using var db = fixture.Open();
        var service = fixture.Service(db);
        foreach (var query in new[] { new PublishedQuestionQuery(Page: 0), new(PageSize: 0), new(PageSize: 51),
                     new(Search: new string('a', 201)), new(Sort: "bad") })
            await Assert.ThrowsAsync<ArgumentException>(() => service.ListAsync(query));
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 10, 16, 8, 0, 0, TimeSpan.Zero);
    }
    private sealed class Fixture : IAsyncDisposable
    {
        private readonly string path = Path.Combine(Path.GetTempPath(), "antc-public-questions-" + Guid.NewGuid().ToString("N") + ".db");
        public AppDbContext Open() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite("Data Source=" + path + ";Pooling=False").Options);
        public QuestionModerationService Service(AppDbContext db) => new(db, new FixedClock());
        public static async Task<Fixture> Create()
        {
            var fixture = new Fixture(); await using var db = fixture.Open();
            await db.Database.EnsureCreatedAsync();
            DateTime date = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            db.QuestionSubmissions.AddRange(Enumerable.Range(1, 27).Select(id => new QuestionSubmission
            { Id = id, Content = $"Câu hỏi công khai {id}.", Answer = "Bản nháp nội bộ.", PublishedAnswer = "Câu trả lời đã được duyệt.",
                IsPublished = true, ApprovedAt = date.AddDays(id / 3), Contact = "private@example.invalid", IpHash = "private-ip-hash" }));
            db.QuestionSubmissions.AddRange(
                new QuestionSubmission { Id = 100, Content = "CHI-NOI-BO chưa duyệt", Answer = "CHI-NOI-BO" },
                new QuestionSubmission { Id = 101, Type = "gop-y", Content = "CHI-NOI-BO góp ý", IsPublished = true, ApprovedAt = date, PublishedAnswer = "CHI-NOI-BO" },
                new QuestionSubmission { Id = 102, Content = "CHI-NOI-BO thiếu ngày", IsPublished = true, PublishedAnswer = "CHI-NOI-BO" },
                new QuestionSubmission { Id = 103, Content = "CHI-NOI-BO thiếu câu trả lời", IsPublished = true, ApprovedAt = date },
                new QuestionSubmission { Id = 104, Content = "CHI-NOI-BO câu trả lời rỗng", IsPublished = true, ApprovedAt = date, PublishedAnswer = "" },
                new QuestionSubmission { Id = 105, Content = "CHI-NOI-BO đã gỡ", IsPublished = false, ApprovedAt = date, PublishedAnswer = "CHI-NOI-BO" });
            await db.SaveChangesAsync(); return fixture;
        }
        public ValueTask DisposeAsync()
        {
            foreach (string suffix in new[] { "", "-wal", "-shm" }) File.Delete(path + suffix);
            return ValueTask.CompletedTask;
        }
    }
}
