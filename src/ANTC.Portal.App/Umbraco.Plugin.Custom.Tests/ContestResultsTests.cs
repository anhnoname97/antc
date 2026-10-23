using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class ContestResultsTests
{
    [Theory]
    [InlineData("0912345678", "091234****")]
    [InlineData("091234****", "091234****")]
    [InlineData("091****678", "091*******")]
    [InlineData("", "***")]
    public void WinnerPhone_HidesLastFourIncludingLegacyMasks(string phone, string expected)
        => Assert.Equal(expected, ContestResultsService.MaskWinnerPhone(phone));

    [Fact]
    public async Task LegacyPublishedWinner_IsRemaskedWithoutRepublishingOrChangingLeaderboard()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();
        var service=Service(f.Db,new Clock());
        var draw=new Draw { ContestId=f.ContestId, CreatedAt=new Clock().Now, Winners=[new DrawWinner { EntryId=1, Rank=1, Code="AD-TST001", FullName="Nguyễn Văn An", Phone="0912345678", Score=2 }] };
        f.Db.Draws.Add(draw);await f.Db.SaveChangesAsync();
        await service.SetPublicationAsync(f.ContestId,new(true,[draw.Id],0),Actor,default);
        var publication=await f.Db.ContestPublishedResults.SingleAsync();
        publication.SnapshotJson=publication.SnapshotJson.Replace("091234****","091****678");
        await f.Db.SaveChangesAsync();
        var response=(await service.GetAsync(f.ContestId,1,50,default))!;
        Assert.Equal("091*******",Assert.Single(Assert.Single(response.Draws).Winners).Phone);
        Assert.Equal(publication.Revision,response.Version);
        Assert.Equal("091****678",Assert.Single(response.Leaderboard.Items).Phone);
    }
    private sealed class Clock : TimeProvider
    {
        public DateTime Now=ContestReportingTests.Fixture.Now.AddDays(12);
        public override DateTimeOffset GetUtcNow()=>new(Now);
    }
    private static ContestResultsService Service(AppDbContext db,TimeProvider clock) => new(db,clock,
        new ContestAuditService(db,new EphemeralDataProtectionProvider(),clock));
    private static readonly Guid Actor=new("6453e5bd-484c-4b72-951e-c646ecfdb9ab");

    [Fact] public async Task UnpublishedValidContest_IsPending_MissingAndInactiveAreNotFound()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var service=Service(f.Db,new Clock());
        var response=await service.GetAsync(f.ContestId,1,20,default);
        Assert.NotNull(response);Assert.Equal("pending",response.Status);Assert.Empty(response.Draws);Assert.Empty(response.Leaderboard.Items);
        Assert.Null(response.PublishedAt);Assert.Equal(0,response.Version);
        Assert.Null(await service.GetAsync(999,1,20,default));
        var contest=await f.Db.ContestCampaigns.FindAsync(f.ContestId);contest!.IsActive=false;await f.Db.SaveChangesAsync();
        Assert.Null(await service.GetAsync(f.ContestId,1,20,default));
    }

    [Fact] public async Task Publication_ContainsBothRankingsAndDraws_MaskedAndFrozen()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var clock=new Clock();var service=Service(f.Db,clock);
        var draw=new Draw {ContestId=f.ContestId,CreatedAt=clock.Now,CreatedBy="Never return actor",Note="Private note",Winners=[
            new DrawWinner {EntryId=1,Rank=1,Code="AD-TST001",FullName="Nguyễn Văn An",Phone="0912345678",Score=2}]};
        f.Db.Draws.Add(draw);await f.Db.SaveChangesAsync();
        var state=await service.SetPublicationAsync(f.ContestId,new(true,[draw.Id],0),Actor,default);
        Assert.NotNull(state);Assert.True(state.IsPublished);Assert.Equal(1,state.Revision);
        var result=(await service.GetAsync(f.ContestId,1,20,default))!;
        Assert.Equal("published",result.Status);Assert.Equal(1,result.Leaderboard.Total); // Two entries share one phone: best score wins.
        var winner=Assert.Single(Assert.Single(result.Draws).Winners);
        Assert.Equal("091234****",winner.Phone);Assert.Equal("Nguyễn *** An",winner.FullName);
        var rank=Assert.Single(result.Leaderboard.Items);Assert.Equal(2,rank.Score);Assert.Equal(1,rank.Rank);Assert.Equal("AD-TST001",rank.Code);
        string json=JsonSerializer.Serialize(result);
        foreach(string secret in new[]{"0912345678","Nguyễn Văn An","TokenHash","IpHash","Private note","Never return actor","EntryId","PublishedByKey"})Assert.DoesNotContain(secret,json);
        var entry=await f.Db.Entries.FindAsync(1L);entry!.Score=0;entry.FullName="Changed";draw.Winners[0].FullName="Changed";
        await f.Db.SaveChangesAsync();
        Assert.Equal(json,JsonSerializer.Serialize(await service.GetAsync(f.ContestId,1,20,default)));
        Assert.Equal("results.publish",(await f.Db.ContestAccessAudits.SingleAsync()).Action);
        Assert.DoesNotContain("0912345678",(await f.Db.ContestPublishedResults.SingleAsync()).SnapshotJson);
    }

    [Fact] public async Task CancelledWinner_DoesNotBlockPublication_AndIsOmittedFromSnapshot()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var clock=new Clock();var service=Service(f.Db,clock);
        var draw=new Draw {ContestId=f.ContestId,CreatedAt=clock.Now,Winners=[
            new DrawWinner {EntryId=1,Rank=1,Code="AD-TST001",FullName="Nguyễn Văn An",Phone="0912345678",Score=2},
            new DrawWinner {EntryId=3,Rank=2,Code="AD-CANCEL9",FullName="Người Bị Hủy",Phone="",Score=0,CancelledAt=clock.Now,CancelReasonText="Không hợp lệ"}]};
        f.Db.Draws.Add(draw);await f.Db.SaveChangesAsync();
        var state=await service.SetPublicationAsync(f.ContestId,new(true,[draw.Id],0),Actor,default);
        Assert.True(state!.IsPublished);
        var result=(await service.GetAsync(f.ContestId,1,20,default))!;
        var winner=Assert.Single(Assert.Single(result.Draws).Winners);
        Assert.Equal("AD-TST001",winner.Code);Assert.Equal(1,winner.Rank);
        Assert.DoesNotContain("AD-CANCEL9",(await f.Db.ContestPublishedResults.SingleAsync()).SnapshotJson);
    }

    [Fact] public async Task Ranking_TiesDeterministic_BestPerPhone_ExcludesAnonymousUnfinishedAndInvalidPhones_Paginates()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var service=Service(f.Db,new Clock());
        var now=ContestReportingTests.Fixture.Now;
        for(int i=4;i<=7;i++) f.Db.Entries.Add(new Entry {Id=i,ContestId=f.ContestId,Code=$"AD-TST00{i}",TokenHash=$"rank{i}",
            FullName="Trần Minh Bình",Phone=$"098765432{i}",Mode="named",Status="submitted",Score=i==7?10:2,Answered=2,
            CreatedAt=now,SubmittedAt=now.AddMinutes(i==5?4:i)});
        f.Db.Entries.Add(new Entry {Id=8,ContestId=f.ContestId,Code="AD-ANON01",TokenHash="anon",Mode="anon",Status="submitted",Score=200,SubmittedAt=now});
        f.Db.Entries.Add(new Entry {Id=9,ContestId=f.ContestId,Code="AD-BADPH1",TokenHash="bad",Mode="named",Phone="bad phone",Status="submitted",Score=200,SubmittedAt=now});
        await f.Db.SaveChangesAsync();
        await service.SetPublicationAsync(f.ContestId,new(true,[],0),Actor,default);
        var first=(await service.GetAsync(f.ContestId,1,2,default))!.Leaderboard;
        var second=(await service.GetAsync(f.ContestId,2,2,default))!.Leaderboard;
        var third=(await service.GetAsync(f.ContestId,3,2,default))!.Leaderboard;
        Assert.Equal(5,first.Total);Assert.Equal(3,first.TotalPages);
        Assert.Equal(new[]{"AD-TST007","AD-TST004","AD-TST005","AD-TST006","AD-TST001"},first.Items.Concat(second.Items).Concat(third.Items).Select(x=>x.Code));
        Assert.Equal(new[]{1,2,3,4,5},first.Items.Concat(second.Items).Concat(third.Items).Select(x=>x.Rank));
        Assert.Empty((await service.GetAsync(f.ContestId,99,2,default))!.Leaderboard.Items);
    }

    [Fact] public async Task Publish_BeforeGraceEnds_IsRejected_ExactDeadlineAllowed()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var contest=(await f.Db.ContestCampaigns.FindAsync(f.ContestId))!;
        var clock=new Clock {Now=contest.EndAt.AddHours(contest.SubmitGraceHours).AddTicks(-1)};
        var service=Service(f.Db,clock);
        var error=await Assert.ThrowsAsync<ContestResultsException>(()=>service.SetPublicationAsync(f.ContestId,new(true,[],0),Actor,default));
        Assert.Equal("CONTEST_NOT_CLOSED",error.Code);Assert.Empty(await f.Db.ContestPublishedResults.ToListAsync());
        clock.Now=clock.Now.AddTicks(1);
        Assert.True((await service.SetPublicationAsync(f.ContestId,new(true,[],0),Actor,default))!.IsPublished);
    }

    [Fact] public async Task UnpublishImmediatelyHidesEverything_StaleRevisionRejected_RepublishCreatesNewSnapshot()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var clock=new Clock();var service=Service(f.Db,clock);
        var first=await service.SetPublicationAsync(f.ContestId,new(true,[],0),Actor,default);
        clock.Now=clock.Now.AddHours(1);
        var retry=await service.SetPublicationAsync(f.ContestId,new(true,[],1),Actor,default);
        Assert.Equal(first,retry);Assert.Single(await f.Db.ContestAccessAudits.ToListAsync());
        var stale=await Assert.ThrowsAsync<ContestResultsException>(()=>service.SetPublicationAsync(f.ContestId,new(false,[],0),Actor,default));
        Assert.Equal("RESULTS_CHANGED",stale.Code);
        Assert.Equal(2,(await service.SetPublicationAsync(f.ContestId,new(false,[],1),Actor,default))!.Revision);
        var hidden=(await service.GetAsync(f.ContestId,1,20,default))!;
        Assert.Equal("pending",hidden.Status);Assert.Empty(hidden.Draws);Assert.Empty(hidden.Leaderboard.Items);Assert.Null(hidden.PublishedAt);
        Assert.Equal(3,(await service.SetPublicationAsync(f.ContestId,new(true,[],2),Actor,default))!.Revision);
        Assert.Equal(clock.Now,(await service.GetAsync(f.ContestId,1,20,default))!.PublishedAt);
    }

    [Fact] public async Task CrossContestOrIneligibleDraw_CannotBePublished_NoPartialSnapshotOrAudit()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var clock=new Clock();var service=Service(f.Db,clock);
        var other=new ContestCampaign{Name="Other",StartAt=clock.Now.AddDays(-3),EndAt=clock.Now.AddDays(-2)};
        f.Db.ContestCampaigns.Add(other);await f.Db.SaveChangesAsync();
        var cross=new Draw{ContestId=other.Id};var invalid=new Draw{ContestId=f.ContestId,Winners=[new DrawWinner{EntryId=3,Rank=1,Code="AD-TST003",FullName="Ẩn danh",Phone="",Score=0}]};
        f.Db.Draws.AddRange(cross,invalid);await f.Db.SaveChangesAsync();
        var first=await Assert.ThrowsAsync<ContestResultsException>(()=>service.SetPublicationAsync(f.ContestId,new(true,[cross.Id],0),Actor,default));
        Assert.Equal("VALIDATION",first.Code);
        var second=await Assert.ThrowsAsync<ContestResultsException>(()=>service.SetPublicationAsync(f.ContestId,new(true,[invalid.Id],0),Actor,default));
        Assert.Equal("INVALID_DRAW_RESULT",second.Code);
        Assert.Empty(await f.Db.ContestPublishedResults.ToListAsync());Assert.Empty(await f.Db.ContestAccessAudits.ToListAsync());
    }

    [Theory]
    [InlineData(0,1,20)] [InlineData(1,0,20)] [InlineData(1,1,101)]
    public async Task BadIdsOrPaging_ReturnStandard400(long id,int page,int pageSize)
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();
        var controller=new ContestResultsController(Service(f.Db,new Clock())){ControllerContext=new(){HttpContext=new DefaultHttpContext()}};
        var result=Assert.IsType<ObjectResult>(await controller.Get(id,page,pageSize));Assert.Equal(400,result.StatusCode);
        Assert.Contains("VALIDATION",JsonSerializer.Serialize(result.Value));Assert.Equal("no-store",controller.Response.Headers.CacheControl);
    }

    [Theory]
    [InlineData("Trần An","Trần ***")] [InlineData("An","***")] [InlineData("  Nguyễn   Văn An ","Nguyễn *** An")]
    public void NamesAreMaskedEvenWhenOnlyTwoWords(string name,string expected)=>Assert.Equal(expected,ContestResultsService.MaskName(name));

    [Fact] public async Task TwoConcurrentPublications_OnlyOneRevisionAndAuditCanWin()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();
        string file=Path.Combine(Path.GetTempPath(),"antc-results-race-"+Guid.NewGuid().ToString("N")+".db");
        try
        {
            await using(var copy=new SqliteConnection($"Data Source={file};Pooling=False"))
            {await copy.OpenAsync();((SqliteConnection)f.Db.Database.GetDbConnection()).BackupDatabase(copy);}
            async Task<string> Publish()
            {
                await using var db=new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={file};Pooling=False;Default Timeout=15").Options);
                try {await Service(db,new Clock()).SetPublicationAsync(f.ContestId,new(true,[],0),Actor,default);return "OK";}
                catch(ContestResultsException ex){return ex.Code;}
            }
            var results=await Task.WhenAll(Task.Run(Publish),Task.Run(Publish));
            Assert.Single(results.Where(r=>r=="OK"));Assert.Single(results.Where(r=>r=="RESULTS_CHANGED"));
            await using var verify=new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={file};Pooling=False").Options);
            Assert.Equal(1,(await verify.ContestPublishedResults.SingleAsync()).Revision);
            Assert.Single(await verify.ContestAccessAudits.ToListAsync());
        }
        finally{File.Delete(file);File.Delete(file+"-wal");File.Delete(file+"-shm");}
    }

    [Fact] public async Task AuditFailure_DoesNotPublishAnyResult()
    {
        await using var f=await ContestReportingTests.Fixture.CreateAsync();var service=Service(f.Db,new Clock());
        await Assert.ThrowsAsync<InvalidOperationException>(()=>service.SetPublicationAsync(f.ContestId,new(true,[],0),Guid.Empty,default));
        Assert.Empty(await f.Db.ContestPublishedResults.AsNoTracking().ToListAsync());
        Assert.Empty(await f.Db.ContestAccessAudits.AsNoTracking().ToListAsync());
        Assert.Equal("pending",(await service.GetAsync(f.ContestId,1,20,default))!.Status);
    }
}
