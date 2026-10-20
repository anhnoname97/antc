using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class ContestReportingTests
{
    internal sealed class Fixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");
        public AppDbContext Db { get; private set; } = null!;
        public ContestReportingService Reports => new(Db);
        public long ContestId { get; private set; }
        public static readonly DateTime Now = new(2026,10,20,1,0,0,DateTimeKind.Utc);
        public static async Task<Fixture> CreateAsync()
        {
            var f = new Fixture();
            await f.connection.OpenAsync();
            f.Db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(f.connection).Options);
            await f.Db.Database.MigrateAsync();
            f.Db.QuizTopics.AddRange(new QuizTopic {Id=1,Title="Chuyên đề mới"},new QuizTopic {Id=2,Title="CD2"});
            f.Db.QuizQuestions.AddRange(new QuizQuestion {Code="Q1",TopicId=1,Question="Đã sửa",Answer="D"},
                new QuizQuestion {Code="Q2",TopicId=2},new QuizQuestion {Code="Q3",TopicId=2});
            var contest = new ContestCampaign {Name="Tháng 10",StartAt=Now.AddDays(-10),EndAt=Now.AddDays(10),
                Topics=[new ContestTopic {TopicId=1,Title="Chuyên đề gốc",SortOrder=1},new ContestTopic {TopicId=2,Title="CD2",SortOrder=2}],
                Questions=[new ContestQuestion {QuestionCode="Q1",TopicId=1,QuestionText="Nội dung gốc",Answer="A",SortOrder=1},
                    new ContestQuestion {QuestionCode="Q2",TopicId=2,Answer="B",SortOrder=2},new ContestQuestion {QuestionCode="Q3",TopicId=2,Answer="C",SortOrder=3}]};
            f.Db.ContestCampaigns.Add(contest);
            await f.Db.SaveChangesAsync();
            f.ContestId = contest.Id;
            for(int i=1;i<=3;i++) f.Db.Entries.Add(new Entry {Id=i,ContestId=contest.Id,Code=$"AD-TST00{i}",TokenHash=$"hash{i}",
                Mode=i==3?"anon":"named",FullName=i==3?null:"Nguyễn Văn An",Phone=i==3?null:"0912345678",Org="Đơn vị thử",
                Status=i==3?"in_progress":"submitted",Answered=i==1?2:1,Score=i==3?null:i==1?2:0,CreatedAt=Now.AddMinutes(i),SubmittedAt=i==3?null:Now.AddHours(1)});
            f.Db.EntryAnswers.AddRange(
                new EntryAnswer {EntryId=1,QuestionCode="Q1",Topic=1,Chosen="A",IsCorrect=true,AnsweredAt=Now},
                new EntryAnswer {EntryId=1,QuestionCode="Q2",Topic=2,Chosen="B",IsCorrect=true,AnsweredAt=Now},
                new EntryAnswer {EntryId=2,QuestionCode="Q1",Topic=1,Chosen="B",IsCorrect=false,AnsweredAt=Now},
                new EntryAnswer {EntryId=3,QuestionCode="Q1",Topic=1,Chosen="D",IsCorrect=false,AnsweredAt=Now});
            await f.Db.SaveChangesAsync();
            return f;
        }
        public async ValueTask DisposeAsync() {await Db.DisposeAsync();await connection.DisposeAsync();}
    }

    [Fact] public async Task DashboardAndQuestionCounts_MatchThreeHandCountedEntries()
    {
        await using var f = await Fixture.CreateAsync();
        var dashboard = await f.Reports.DashboardAsync(new(),default);
        Assert.Equal((3,2,2,1,1),(dashboard.Created,dashboard.Submitted,dashboard.Named,dashboard.Anonymous,dashboard.DistinctPhones));
        Assert.Equal(3,Assert.Single(dashboard.Days).Count);
        Assert.Equal(new[]{0,2},dashboard.Scores.Select(x=>x.Score));
        var rows = await f.Reports.QuestionsAsync(new(),null,default);
        Assert.Equal(new[]{"Q1","Q2","Q3"},rows.Select(x=>x.Code));
        Assert.Equal((3,1,1,1,0,1),(rows[0].Answered,rows[0].Correct,rows[0].A,rows[0].B,rows[0].C,rows[0].D));
        Assert.Equal(1m/3m,rows[0].CorrectRate);
        Assert.Equal(1m,rows[1].CorrectRate);
        Assert.Null(rows[2].CorrectRate);
        Assert.Single(await f.Reports.QuestionsAsync(new(),1,default));
        var submitted = await f.Reports.QuestionsAsync(new(){Status="submitted"},1,default);
        Assert.Equal(2,Assert.Single(submitted).Answered);
    }

    [Fact] public async Task SubmittedPhoneScoreFilter_MatchesDirectSql_AndNewSubmissionAppears()
    {
        await using var f = await Fixture.CreateAsync();
        f.Db.Entries.Add(new Entry {ContestId=f.ContestId,Code="AD-SCORE1",TokenHash="new",Mode="named",Phone="0987654321",
            Status="submitted",Score=180,Answered=190,CreatedAt=Fixture.Now,SubmittedAt=Fixture.Now});
        await f.Db.SaveChangesAsync();
        var result = await f.Reports.EntriesAsync(new(){Status="submitted",HasPhone=true,ScoreFrom=180},default);
        await using var cmd = f.Db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText="SELECT COUNT(*) FROM entry WHERE status='submitted' AND phone IS NOT NULL AND phone<>'' AND score>=180";
        Assert.Equal(Convert.ToInt32(await cmd.ExecuteScalarAsync()),result.Total);
        Assert.Equal(180,Assert.Single(result.Items).Correct);
    }

    [Fact] public async Task SearchUnicode_DayInclusiveInVietnam_StablePagination()
    {
        await using var f = await Fixture.CreateAsync();
        Assert.Equal(2,(await f.Reports.EntriesAsync(new(){Search="NGUYỄN VĂN AN"},default)).Total);
        Assert.Equal(2,(await f.Reports.EntriesAsync(new(){Search="091234"},default)).Total);
        Assert.Single((await f.Reports.EntriesAsync(new(){Search="ad-tst001"},default)).Items);
        var entry = await f.Db.Entries.FindAsync(1L);
        entry!.CreatedAt = new DateTime(2026,10,19,17,0,0,DateTimeKind.Utc);
        await f.Db.SaveChangesAsync();
        Assert.Equal(3,(await f.Reports.EntriesAsync(new(){From=new(2026,10,20),To=new(2026,10,20)},default)).Total);
        entry.CreatedAt=entry.CreatedAt.AddTicks(-1);
        await f.Db.SaveChangesAsync();
        Assert.Equal(2,(await f.Reports.EntriesAsync(new(){From=new(2026,10,20),To=new(2026,10,20)},default)).Total);
        for(int i=4;i<=103;i++) f.Db.Entries.Add(new Entry {ContestId=f.ContestId,Code=$"AD-{i:000000}",TokenHash=$"hash{i}",CreatedAt=Fixture.Now});
        await f.Db.SaveChangesAsync();
        var first = await f.Reports.EntriesAsync(new(),default);
        var second = await f.Reports.EntriesAsync(new(){Page=2},default);
        Assert.Equal(50,first.Items.Count); Assert.Equal(50,second.Items.Count);
        Assert.Empty(first.Items.Select(e=>e.Id).Intersect(second.Items.Select(e=>e.Id)));
    }

    [Fact] public async Task Detail_UsesFrozenQuestionsAndIncludesUnanswered_NoSensitiveToken()
    {
        await using var f=await Fixture.CreateAsync();
        var detail = await f.Reports.DetailAsync(1,default);
        Assert.NotNull(detail); Assert.True(detail.HasSnapshot); Assert.Equal(3,detail.Questions.Count);
        var first=detail.Questions[0]; Assert.Equal("Nội dung gốc",first.Text); Assert.Equal("A",first.CorrectAnswer);
        Assert.Equal("Chuyên đề gốc",first.TopicTitle);
        Assert.Null(detail.Questions[2].Chosen); Assert.Null(detail.Questions[2].Correct);
        Assert.Equal(2,detail.Topics.Sum(t=>t.Correct));
        Assert.DoesNotContain("TokenHash",JsonSerializer.Serialize(detail));
    }

    [Fact] public async Task Audit_RecordsActorUtcActionAndExactProtectedFilters()
    {
        await using var f=await Fixture.CreateAsync();
        var provider=new EphemeralDataProtectionProvider(); var actor=Guid.NewGuid();
        var filter=new ContestReportFilter {Search="Nguyễn Văn An",HasPhone=true,ScoreFrom=180};
        await new ContestAuditService(f.Db,provider,TimeProvider.System).RecordAsync(actor,"export.entries",filter,null,default);
        var audit=await f.Db.ContestAccessAudits.SingleAsync();
        Assert.Equal(actor,audit.ActorUserKey); Assert.Equal("export.entries",audit.Action);
        Assert.DoesNotContain("Nguyễn",audit.ProtectedFilters); Assert.DoesNotContain("ScoreFrom",audit.ProtectedFilters);
        Assert.Equal(JsonSerializer.Serialize(filter),provider.CreateProtector(ContestAuditService.Purpose).Unprotect(audit.ProtectedFilters));
        Assert.InRange(DateTime.UtcNow-audit.OccurredAt,TimeSpan.Zero,TimeSpan.FromSeconds(5));
    }

    [Fact] public async Task Csv5000DatabaseRows_BomVietnameseFormulaSafety_UnderFiveSeconds()
    {
        await using var f=await Fixture.CreateAsync();
        for(int i=4;i<=5000;i++) f.Db.Entries.Add(new Entry {ContestId=f.ContestId,Code=$"AD-{i:000000}",TokenHash=$"hash{i}",FullName="Nguyễn Văn An",Org="=HYPERLINK(\"evil\")",CreatedAt=Fixture.Now});
        await f.Db.SaveChangesAsync();
        async IAsyncEnumerable<string[]> Rows() {await foreach(var e in f.Reports.ExportEntries(new())) yield return [e.Code,e.FullName??"",e.Org??""];}
        using var stream=new MemoryStream(); var sw=Stopwatch.StartNew();
        await ContestCsv.WriteAsync(stream,["Mã dự thi","Họ tên","Đơn vị"],Rows(),default);
        sw.Stop();
        Assert.True(sw.Elapsed<TimeSpan.FromSeconds(5),$"CSV 5000: {sw.Elapsed.TotalMilliseconds:F0}ms");
        Assert.Equal(new byte[]{0xEF,0xBB,0xBF},stream.ToArray()[..3]);
        string csv=Encoding.UTF8.GetString(stream.ToArray());
        Assert.Contains("Nguyễn Văn An",csv); Assert.Contains("'=HYPERLINK",csv);
        Assert.Equal(5002,csv.Split("\r\n").Length);
        Console.WriteLine($"CSV 5000 database rows: {sw.Elapsed.TotalMilliseconds:F0}ms / {stream.Length} bytes");
    }
}
