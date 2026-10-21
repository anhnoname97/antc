using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class ContestPrivacyTests
{
    private static readonly Guid Actor = Guid.NewGuid();
    [Fact]
    public async Task StaleRegistrationCannotReintroducePersonalDataAfterContestClosedAndBulkCleanup()
    {
        await using var f=await Fixture.Create();
        await f.Service.EraseAllAsync(new(Guid.NewGuid(),ContestPrivacyService.BulkPhrase),Actor,default);
        var config=new Microsoft.Extensions.Configuration.ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>
            { [ContestEntryService.IpHashSaltKey]="test-only-salt" }).Build();
        var entryService=new ContestEntryService(f.Db,new StaleOpenCatalog(),TimeProvider.System,config);
        var result=await entryService.CreateAsync(new CreateEntryRequest(1,"named","Test Name","0912345678",null,true),"127.0.0.1");
        Assert.Equal("CONTEST_CLOSED",result.Error!.Code); Assert.Empty(await f.Db.Entries.ToListAsync());
    }
    private sealed class StaleOpenCatalog : IContestCatalog
    {
        public Task<ContestInfo?> GetAsync(long id,CancellationToken ct=default)=>Task.FromResult<ContestInfo?>(new(1,"Stale",null,DateTime.UtcNow.AddDays(-1),DateTime.UtcNow.AddDays(1),2,24,1,null,[],[],DateTime.UtcNow));
        public Task<ContestInfo?> GetCurrentAsync(CancellationToken ct=default)=>GetAsync(1,ct);
        public Task<ContestSchedule> GetScheduleAsync(DateTime now,CancellationToken ct=default)=>Task.FromResult(new ContestSchedule(now,[],[],[]));
    }
    [Fact]
    public async Task PersonErasureClearsMatchingQuestionContactAndEncodedAuditSelectorsOnly()
    {
        await using var f = await Fixture.Create(); f.Person("0912345678"); await f.Save();
        f.Db.QuestionSubmissions.AddRange(new QuestionSubmission { Contact = "+84 (912) 345-678", Content = "Keep", WantReply = true, IpHash = "private-ip" },
            new QuestionSubmission { Contact = "0987654321", Content = "Other", WantReply = true });
        await new ContestAuditService(f.Db, f.Protection, TimeProvider.System).RecordAsync(Actor,"export.entries",new { Search = "Person_ERASE" },null,default);
        f.Db.ChangeTracker.Clear();
        var p = await f.Service.PreviewAsync(new("phone","0912345678"),Actor,default);
        var result = await f.Service.ErasePersonAsync(new(Guid.NewGuid(),p.PreviewToken,"anonymize",ContestPrivacyService.AnonymizePhrase),Actor,default);
        Assert.Equal(1,result.Counts.Contacts);
        f.Db.ChangeTracker.Clear();
        var questions = await f.Db.QuestionSubmissions.OrderBy(q=>q.Id).ToListAsync();
        Assert.Null(questions[0].Contact); Assert.Equal("0987654321",questions[1].Contact);
        var protector = f.Protection.CreateProtector(ContestAuditService.Purpose);
        Assert.All(await f.Db.ContestAccessAudits.ToListAsync(),a=>Assert.DoesNotContain("Person_ERASE",protector.Unprotect(a.ProtectedFilters)));
    }

    [Fact]
    public async Task AnonymousCodeTargetsOnlyThatEntry_AndPreviewPaginationStillErasesEveryRelatedEntry()
    {
        await using var f = await Fixture.Create();
        for(int i=0;i<51;i++) f.Person("0912345678");
        var anon=f.Person("0987654321"); anon.Phone=null; anon.FullName=null; anon.Mode=EntryModes.Anon;
        await f.Save();
        Assert.Equal(1,(await f.Service.PreviewAsync(new("code",anon.Code),Actor,default)).Total);
        var preview=await f.Service.PreviewAsync(new("phone","0912345678",2),Actor,default);
        Assert.Equal(51,preview.Total); Assert.Single(preview.Items); Assert.Equal(2,preview.Pages);
        var result=await f.Service.ErasePersonAsync(new(Guid.NewGuid(),preview.PreviewToken,"anonymize",ContestPrivacyService.AnonymizePhrase),Actor,default);
        Assert.Equal(51,result.Counts.Entries); Assert.Equal(52,await f.Db.EntryAnswers.CountAsync());
        Assert.False(await f.Db.Entries.AnyAsync(e=>e.Phone!=null));
    }

    [Fact]
    public async Task MalformedSnapshotRollsBackErasureAndDoesNotCreateOperation()
    {
        await using var f=await Fixture.Create(); var e=f.Person("0912345678"); await f.Save(); await f.Snapshots(e);
        (await f.Db.ContestPublishedResults.SingleAsync()).SnapshotJson="invalid"; await f.Db.SaveChangesAsync(); f.Db.ChangeTracker.Clear();
        var error=await Assert.ThrowsAsync<PrivacyException>(()=>f.Service.EraseAllAsync(new(Guid.NewGuid(),ContestPrivacyService.BulkPhrase),Actor,default));
        Assert.Equal("PRIVACY_SNAPSHOT_INVALID",error.Code);
        Assert.NotNull((await f.Db.Entries.SingleAsync()).Phone); Assert.Empty(await f.Db.PrivacyOperations.ToListAsync());
        Assert.Contains("0912345678",(await f.Db.Draws.SingleAsync()).EligibleSnapshotJson!);
    }
    [Fact]
    public async Task BusyCleanupIsReportedPending_AndCanBeRetriedWithoutErasingAgain()
    {
        await using var f = await Fixture.Create(); f.Person("0912345678"); await f.Save();
        var cleaner = new BusyCleanup();
        var service = new ContestPrivacyService(f.Db, f.Protection, TimeProvider.System, new ContestAuditService(f.Db, f.Protection, TimeProvider.System), cleaner);
        var request = new PrivacyBulkRequest(Guid.NewGuid(), ContestPrivacyService.BulkPhrase);
        var result = await service.EraseAllAsync(request, Actor, default);
        Assert.False(result.VacuumCompleted); Assert.Equal("VACUUM_PENDING", result.CleanupErrorCode);
        Assert.Null((await f.Db.Entries.SingleAsync()).Phone);
        cleaner.Ready = true;
        result = await service.VacuumAsync(result.Id, Actor, true, default);
        Assert.True(result.VacuumCompleted); Assert.Null(result.CleanupErrorCode);
        Assert.Single(await f.Db.PrivacyOperations.ToListAsync());
        Assert.Single(await f.Db.ContestAccessAudits.Where(a => a.Action == "privacy.bulk").ToListAsync());
    }
    private sealed class BusyCleanup : IPrivacyFileCleanup
    {
        public bool Ready { get; set; }
        public Task RunAsync(string connectionString, bool vacuum, CancellationToken ct) => Ready ? Task.CompletedTask : throw new SqliteException("Test busy", 5);
    }
    [Fact]
    public async Task AnonymizeByCode_CoversAllPhonesAttempts_PreservesAnswersScoresAndStatistics_RevokesOldToken()
    {
        await using var f = await Fixture.Create();
        var a = f.Person("0912345678"); var b = f.Person("0912345678"); var other = f.Person("0987654321");
        await f.Save(); string token = a.TokenHash;
        var preview = await f.Service.PreviewAsync(new("code", a.Code), Actor, default);
        Assert.Equal(2, preview.Total); Assert.All(preview.Items, e => Assert.Equal("091****678", e.Phone));
        var request = new PrivacyEraseRequest(Guid.NewGuid(), preview.PreviewToken, "anonymize", ContestPrivacyService.AnonymizePhrase);
        var result = await f.Service.ErasePersonAsync(request, Actor, default);
        Assert.Equal(2, result.Counts.Entries); Assert.Equal(0, result.Counts.Answers); Assert.True(result.VacuumCompleted);
        f.Db.ChangeTracker.Clear();
        var kept = await f.Db.Entries.OrderBy(e => e.Id).ToListAsync();
        Assert.All(kept.Take(2), e => { Assert.Null(e.Phone); Assert.Null(e.FullName); Assert.Null(e.Org); Assert.Null(e.IpHash); Assert.Null(e.ConsentAt); Assert.Null(e.AttemptNo); Assert.Equal("anon", e.Mode); Assert.Equal(1, e.Score); });
        Assert.NotEqual(token, kept[0].TokenHash); Assert.Equal(other.Phone, kept[2].Phone);
        Assert.Equal(3, await f.Db.EntryAnswers.CountAsync());
        var submit = JsonSerializer.Deserialize<SubmitDto>(kept[0].SubmissionResultJson!)!;
        Assert.False(submit.EligibleForPrize); Assert.Equal("anon", submit.Mode); Assert.Equal(1, submit.Score);
        Assert.Equal(0, (await f.Service.PreviewAsync(new("phone", "0912345678"), Actor, default)).Total);
        var again = await f.Service.ErasePersonAsync(request, Actor, default);
        Assert.Equal(result.Id, again.Id); Assert.Single(await f.Db.PrivacyOperations.ToListAsync());
    }

    [Fact]
    public async Task DeletePerson_DeletesTheirAnswersButNotOtherPeople_AndKeepsAwardDocuments()
    {
        await using var f = await Fixture.Create();
        var a = f.Person("0912345678"); f.Person("0987654321"); await f.Save();
        await f.Snapshots(a);
        var preview = await f.Service.PreviewAsync(new("phone", "+84 912 345 678"), Actor, default);
        var result = await f.Service.ErasePersonAsync(new(Guid.NewGuid(), preview.PreviewToken, "delete", ContestPrivacyService.DeletePhrase), Actor, default);
        Assert.Equal(1, result.Counts.Entries); Assert.Equal(1, result.Counts.Answers);
        f.Db.ChangeTracker.Clear();
        Assert.Single(await f.Db.Entries.ToListAsync()); Assert.Single(await f.Db.EntryAnswers.ToListAsync());
        var winner = Assert.Single(await f.Db.DrawWinners.ToListAsync()); Assert.Equal("0912345678", winner.Phone);
        var publication = await f.Db.ContestPublishedResults.SingleAsync();
        Assert.Empty(JsonSerializer.Deserialize<ResultSnapshot>(publication.SnapshotJson, new JsonSerializerOptions(JsonSerializerDefaults.Web))!.Leaderboard);
    }

    [Fact]
    public async Task BulkErasure_ClearsAllEntriesAndQuestionContacts_PreservesAnswersStatsAndWinners_AndScrubsCopiesAndAudit()
    {
        await using var f = await Fixture.Create();
        var person = f.Person("0912345678"); await f.Save(); await f.Snapshots(person);
        f.Db.QuestionSubmissions.Add(new QuestionSubmission { Contact = "Contact_ERASE", IpHash = "Question_IP_ERASE", WantReply = true, Content = "Nội dung cần giữ", Type = "cau-hoi" });
        await f.Db.SaveChangesAsync();
        var before = await f.Db.EntryAnswers.Select(a => new { a.QuestionCode, a.Topic, a.Chosen, a.IsCorrect }).ToListAsync();
        var result = await f.Service.EraseAllAsync(new(Guid.NewGuid(), ContestPrivacyService.BulkPhrase), Actor, default);
        Assert.True(result.VacuumCompleted); Assert.Equal(1, result.Counts.Entries); Assert.Equal(1, result.Counts.Contacts);
        f.Db.ChangeTracker.Clear();
        Assert.False(await f.Db.Entries.AnyAsync(e => e.Phone != null || e.FullName != null || e.Org != null || e.IpHash != null));
        Assert.Equal(before, await f.Db.EntryAnswers.Select(a => new { a.QuestionCode, a.Topic, a.Chosen, a.IsCorrect }).ToListAsync());
        var question = await f.Db.QuestionSubmissions.SingleAsync(); Assert.Null(question.Contact); Assert.Null(question.IpHash); Assert.False(question.WantReply); Assert.Equal("Nội dung cần giữ", question.Content);
        var draw = await f.Db.Draws.SingleAsync(); Assert.DoesNotContain("0912345678", draw.EligibleSnapshotJson!); Assert.DoesNotContain("Person_ERASE", draw.EligibleSnapshotJson!);
        var publicSnapshot = await f.Db.ContestPublishedResults.SingleAsync(); Assert.DoesNotContain("091****678", publicSnapshot.SnapshotJson); Assert.Equal(2, publicSnapshot.Revision);
        Assert.Equal("0912345678", (await f.Db.DrawWinners.SingleAsync()).Phone);
        var operation = await f.Db.PrivacyOperations.SingleAsync();
        Assert.Equal(Actor, operation.ActorUserKey); Assert.DoesNotContain("0912345678", operation.CountsJson); Assert.DoesNotContain("AD-", operation.CountsJson);
        var protector = f.Protection.CreateProtector(ContestAuditService.Purpose);
        Assert.All(await f.Db.ContestAccessAudits.ToListAsync(), a => Assert.DoesNotContain("0912345678", protector.Unprotect(a.ProtectedFilters)));
    }

    [Fact]
    public async Task VacuumAndCheckpointRemoveNonRetainedMarkerFromDatabaseAndWal()
    {
        await using var f = await Fixture.Create();
        var e = f.Person("0981234567"); e.FullName = "UNIQUE_ERASURE_MARKER_95F4A26F"; await f.Save();
        Assert.True((await f.Service.EraseAllAsync(new(Guid.NewGuid(), ContestPrivacyService.BulkPhrase), Actor, default)).VacuumCompleted);
        foreach (string path in new[] { f.Path, f.Path + "-wal" })
            if (File.Exists(path))
            {
                await using var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
                using var copy = new MemoryStream(); await file.CopyToAsync(copy);
                Assert.DoesNotContain("UNIQUE_ERASURE_MARKER_95F4A26F", Encoding.UTF8.GetString(copy.ToArray()));
            }
        await using var reopened = f.Open(); Assert.Equal(1, await reopened.Entries.CountAsync()); Assert.Null((await reopened.Entries.SingleAsync()).FullName);
    }

    [Fact]
    public async Task WrongConfirmationAndStaleOrForeignPreviewDoNotEraseAnything()
    {
        await using var f = await Fixture.Create();
        f.Person("0912345678"); await f.Save();
        var preview = await f.Service.PreviewAsync(new("phone", "0912345678"), Actor, default);
        Assert.Equal("PRIVACY_CONFIRMATION_REQUIRED", (await Assert.ThrowsAsync<PrivacyException>(() => f.Service.EraseAllAsync(new(Guid.NewGuid(), "wrong"), Actor, default))).Code);
        Assert.Equal("PRIVACY_PREVIEW_EXPIRED", (await Assert.ThrowsAsync<PrivacyException>(() => f.Service.ErasePersonAsync(new(Guid.NewGuid(), preview.PreviewToken, "anonymize", ContestPrivacyService.AnonymizePhrase), Guid.NewGuid(), default))).Code);
        f.Person("0912345678"); await f.Save();
        Assert.Equal("PRIVACY_PREVIEW_CHANGED", (await Assert.ThrowsAsync<PrivacyException>(() => f.Service.ErasePersonAsync(new(Guid.NewGuid(), preview.PreviewToken, "anonymize", ContestPrivacyService.AnonymizePhrase), Actor, default))).Code);
        Assert.Equal(2, await f.Db.Entries.CountAsync(e => e.Phone == "0912345678")); Assert.Empty(await f.Db.PrivacyOperations.ToListAsync());
    }

    [Fact]
    public async Task BulkErasureIsBlockedDuringOpenOrGraceWindow()
    {
        await using var f = await Fixture.Create();
        f.Person("0912345678"); await f.Save();
        var contest = await f.Db.ContestCampaigns.SingleAsync(); contest.EndAt = DateTime.UtcNow.AddHours(-1); contest.SubmitGraceHours = 24; await f.Db.SaveChangesAsync(); f.Db.ChangeTracker.Clear();
        var error = await Assert.ThrowsAsync<PrivacyException>(() => f.Service.EraseAllAsync(new(Guid.NewGuid(), ContestPrivacyService.BulkPhrase), Actor, default));
        Assert.Equal("PRIVACY_CONTEST_OPEN", error.Code); Assert.NotNull((await f.Db.Entries.SingleAsync()).Phone);
        Assert.Empty(await f.Db.PrivacyOperations.ToListAsync());
    }

    [Fact]
    public async Task InFlightMutationCannotRestoreContactOrAnswersAfterRevocationOrDeletion()
    {
        await using var f = await Fixture.Create();
        var e = f.Person("0912345678"); e.Status = EntryStatuses.InProgress; await f.Save();
        var old = (await f.Db.Entries.AsNoTracking().SingleAsync());
        var preview = await f.Service.PreviewAsync(new("phone", "0912345678"), Actor, default);
        await f.Service.ErasePersonAsync(new(Guid.NewGuid(), preview.PreviewToken, "anonymize", ContestPrivacyService.AnonymizePhrase), Actor, default);
        var attempts = new ContestAttemptService(f.Db, new TestBank(), new TestCatalog(), TimeProvider.System);
        Assert.Equal("INVALID_TOKEN", (await attempts.SaveAnswerAsync(old, "Q1", "A")).Error!.Code);
        Assert.Equal("INVALID_TOKEN", (await attempts.AttachContactAsync(old, null)).Error!.Code);
        Assert.Equal("INVALID_TOKEN", (await attempts.SubmitAsync(old, null)).Error!.Code);
    }

    private sealed class TestBank : Umbraco.Plugin.Custom.Core.Quiz.IQuestionBank
    {
        public Umbraco.Plugin.Custom.Core.Quiz.QuestionBankSnapshot Current { get; } = new();
        public void Reload() { }
    }
    private sealed class TestCatalog : IContestCatalog
    {
        public Task<ContestInfo?> GetAsync(long id, CancellationToken ct = default) => Task.FromResult<ContestInfo?>(null);
        public Task<ContestInfo?> GetCurrentAsync(CancellationToken ct = default) => Task.FromResult<ContestInfo?>(null);
        public Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken ct = default) => Task.FromResult(new ContestSchedule(now, [], [], []));
    }
    private sealed class Fixture : IAsyncDisposable
    {
        private int sequence;
        public string Path { get; } = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"antc-privacy-{Guid.NewGuid():N}.db");
        public IDataProtectionProvider Protection { get; } = new EphemeralDataProtectionProvider();
        public AppDbContext Db { get; private set; } = null!;
        public ContestPrivacyService Service => new(Db, Protection, TimeProvider.System, new ContestAuditService(Db, Protection, TimeProvider.System));
        public AppDbContext Open() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={Path};Default Timeout=2").Options);
        public static async Task<Fixture> Create()
        {
            var f = new Fixture(); f.Db = f.Open(); await f.Db.Database.EnsureCreatedAsync(); await f.Db.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;");
            f.Db.ContestCampaigns.Add(new ContestCampaign { Id = 1, Name = "Cuộc thi thử", StartAt = DateTime.UtcNow.AddDays(-5), EndAt = DateTime.UtcNow.AddDays(-3) }); await f.Db.SaveChangesAsync(); return f;
        }
        public Entry Person(string phone)
        {
            var e = new Entry { Code = $"AD-{++sequence:D6}", ContestId = 1, FullName = "Person_ERASE", Phone = phone, Org = "Org_ERASE", IpHash = "IP_ERASE",
                TokenHash = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)), Mode = EntryModes.Named, Status = EntryStatuses.Submitted, Score = 1, Answered = 1, TotalQuestions = 1,
                CreatedAt = DateTime.UtcNow.AddDays(-4), SubmittedAt = DateTime.UtcNow.AddDays(-4), ConsentAt = DateTime.UtcNow.AddDays(-4), AttemptNo = 1 };
            e.SubmissionResultJson = JsonSerializer.Serialize(new SubmitDto("submitted", e.Code, "named", 1, 1, 1, true, e.SubmittedAt.Value.ToString("O"), [new("1", 1, 1)]));
            e.Answers.Add(new EntryAnswer { QuestionCode = "Q1", Topic = 1, Chosen = "A", IsCorrect = true, AnsweredAt = e.CreatedAt }); Db.Entries.Add(e); return e;
        }
        public async Task Save() { await Db.SaveChangesAsync(); Db.ChangeTracker.Clear(); }
        public async Task Snapshots(Entry e)
        {
            Db.Draws.Add(new Draw { ContestId = 1, EligibleCount = 1, WinnersRequested = 1,
                EligibleSnapshotJson = JsonSerializer.Serialize(new[] { new DrawCandidateSnapshot(e.Id, e.Code, e.FullName!, e.Phone!, 1, e.SubmittedAt) }),
                Winners = [new DrawWinner { Rank = 1, EntryId = e.Id, Code = e.Code, FullName = e.FullName!, Phone = e.Phone!, Score = 1 }] });
            var contest = new ResultContest(1, "Cuộc thi thử", DateTime.UtcNow.AddDays(-5), DateTime.UtcNow.AddDays(-3), DateTime.UtcNow.AddDays(-2));
            Db.ContestPublishedResults.Add(new ContestPublishedResult { ContestId = 1, Revision = 1, IsPublished = true,
                SnapshotJson = JsonSerializer.Serialize(new ResultSnapshot(contest, [new PublicRank(1, e.Code, "Person ***", "091****678", 1, 1, e.SubmittedAt!.Value)], []), new JsonSerializerOptions(JsonSerializerDefaults.Web)) });
            await new ContestAuditService(Db, Protection, TimeProvider.System).RecordAsync(Actor, "export.entries", new { Search = e.Phone }, null, default); Db.ChangeTracker.Clear();
        }
        public async ValueTask DisposeAsync() { await Db.DisposeAsync(); SqliteConnection.ClearAllPools(); File.Delete(Path); }
    }
}
