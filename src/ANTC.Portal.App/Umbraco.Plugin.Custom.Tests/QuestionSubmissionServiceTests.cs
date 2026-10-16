using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionSubmissionServiceTests
{
    private static readonly IPAddress Ip = IPAddress.Parse("192.0.2.10");
    private static readonly QuestionRegistration Registration = new("cau-hoi", "<script>alert('x')</script> Tôi muốn hỏi.", true, "test@example.invalid");

    [Fact]
    public async Task Accepted_question_preserves_html_and_records_consent_with_hashed_ip()
    {
        await using var fixture = await Fixture.CreateAsync();
        await using AppDbContext db = fixture.Open();
        await fixture.Service(db).SubmitAsync(Registration, Ip);
        QuestionSubmission row = await db.QuestionSubmissions.SingleAsync();
        Assert.Equal(Registration.Content, row.Content);
        Assert.Equal("moi", row.Status);
        Assert.Equal(fixture.Clock.Now.UtcDateTime, row.ConsentAt);
        Assert.Equal(row.ConsentAt, row.CreatedAt);
        Assert.Matches("^[a-f0-9]{64}$", row.IpHash!);
        Assert.DoesNotContain(Ip.ToString(), row.IpHash!);
        Assert.Null(row.HandledAt);
    }

    [Fact]
    public async Task Quota_survives_new_context_and_rolls_over_after_exactly_one_hour()
    {
        await using var fixture = await Fixture.CreateAsync();
        for (int i = 0; i < 5; i++)
        {
            await using AppDbContext db = fixture.Open();
            await fixture.Service(db).SubmitAsync(Registration, i % 2 == 0 ? Ip : Ip.MapToIPv6());
        }
        await using (AppDbContext blocked = fixture.Open())
        {
            fixture.Clock.Now = fixture.Clock.Now.AddMinutes(59);
            await Assert.ThrowsAsync<QuestionRateLimitedException>(() => fixture.Service(blocked).SubmitAsync(Registration, Ip));
            await fixture.Service(blocked).SubmitAsync(Registration, IPAddress.Parse("192.0.2.11"));
        }
        fixture.Clock.Now = fixture.Clock.Now.AddMinutes(1);
        await using AppDbContext allowed = fixture.Open();
        await fixture.Service(allowed).SubmitAsync(Registration, Ip);
        Assert.Equal(7, await allowed.QuestionSubmissions.CountAsync());
    }

    [Fact]
    public async Task Ten_concurrent_requests_can_only_create_five_questions()
    {
        await using var fixture = await Fixture.CreateAsync();
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<bool>[] requests = Enumerable.Range(0, 10).Select(async _ =>
        {
            await start.Task;
            await using AppDbContext db = fixture.Open();
            try { await fixture.Service(db).SubmitAsync(Registration, Ip); return true; }
            catch (QuestionRateLimitedException) { return false; }
        }).ToArray();
        start.SetResult();
        bool[] accepted = await Task.WhenAll(requests);
        Assert.Equal(5, accepted.Count(x => x));
        await using AppDbContext verify = fixture.Open();
        Assert.Equal(5, await verify.QuestionSubmissions.CountAsync());
    }

    [Fact]
    public async Task List_and_export_share_filters_and_lists_have_fifty_rows()
    {
        await using var fixture = await Fixture.CreateAsync();
        await using AppDbContext db = fixture.Open();
        DateTime start = new(2026, 10, 15, 17, 0, 0, DateTimeKind.Utc); // 00:00 ngày 16/10 tại Việt Nam.
        db.QuestionSubmissions.AddRange(Enumerable.Range(0, 52).Select(i => new QuestionSubmission
        { Type = "gop-y", Status = "dang-xu-ly", Content = "Góp ý tiếng Việt <b>nguyên văn</b>", CreatedAt = start.AddMinutes(i), ConsentAt = start }));
        db.QuestionSubmissions.Add(new QuestionSubmission
        { Type = "gop-y", Status = "dang-xu-ly", Content = "Góp ý tiếng Việt", CreatedAt = start.AddSeconds(-1), ConsentAt = start });
        db.QuestionSubmissions.Add(new QuestionSubmission
        { Type = "cau-hoi", Status = "moi", Content = "Không trùng bộ lọc", CreatedAt = start, ConsentAt = start });
        await db.SaveChangesAsync();
        var filter = new QuestionFilter("gop-y", "dang-xu-ly", new DateOnly(2026, 10, 16), new DateOnly(2026, 10, 16), "tiếng Việt");
        var service = fixture.Service(db);
        QuestionPage first = await service.ListAsync(filter, 1);
        QuestionPage second = await service.ListAsync(filter, 2);
        Assert.Equal(52, first.Total); Assert.Equal(50, first.Items.Count); Assert.Equal(2, second.Items.Count);
        Assert.Empty(first.Items.Select(x => x.Id).Intersect(second.Items.Select(x => x.Id)));
        var exported = new List<QuestionRow>();
        await foreach (var row in service.ExportAsync(filter)) exported.Add(row);
        Assert.Equal(52, exported.Count);
        Assert.Equal(first.Items.Select(x => x.Id).Concat(second.Items.Select(x => x.Id)), exported.Select(x => x.Id));
    }

    [Fact]
    public async Task Review_records_actor_time_and_note_and_rejects_unknown_status()
    {
        await using var fixture = await Fixture.CreateAsync();
        await using AppDbContext db = fixture.Open();
        var service = fixture.Service(db);
        await service.SubmitAsync(Registration, Ip);
        long id = await db.QuestionSubmissions.Select(x => x.Id).SingleAsync();
        Assert.True(await service.ReviewAsync(id, "da-xu-ly", "<b>Ghi chú</b>", "Biên tập viên"));
        db.ChangeTracker.Clear();
        QuestionSubmission row = await db.QuestionSubmissions.SingleAsync();
        Assert.Equal("Biên tập viên", row.HandledBy);
        Assert.Equal(fixture.Clock.Now.UtcDateTime, row.HandledAt);
        Assert.Equal("<b>Ghi chú</b>", row.AdminNote);
        await Assert.ThrowsAsync<ArgumentException>(() => service.ReviewAsync(id, "unknown", null, "Biên tập viên"));
        Assert.False(await service.ReviewAsync(id + 100, "moi", null, "Biên tập viên"));
    }

    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = new(2026, 10, 16, 3, 0, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => Now;
    }
    private sealed class Fixture : IAsyncDisposable
    {
        private readonly string _path = Path.Combine(Path.GetTempPath(), "antc-questions-" + Guid.NewGuid().ToString("N") + ".db");
        public Clock Clock { get; } = new();
        public AppDbContext Open() => new(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={_path};Default Timeout=30;Pooling=False").Options);
        public QuestionSubmissionService Service(AppDbContext db) => new(db,
            Options.Create(new ContestSecurityOptions { IpHashSalt = "unit-test-salt" }), Clock);
        public static async Task<Fixture> CreateAsync()
        {
            var fixture = new Fixture(); await using AppDbContext db = fixture.Open();
            await db.Database.EnsureCreatedAsync(); return fixture;
        }
        public ValueTask DisposeAsync()
        {
            foreach (string suffix in new[] { "", "-wal", "-shm" }) File.Delete(_path + suffix);
            return ValueTask.CompletedTask;
        }
    }
}
