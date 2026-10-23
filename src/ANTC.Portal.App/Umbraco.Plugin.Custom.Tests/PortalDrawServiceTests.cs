using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class PortalDrawServiceTests
{
    private static readonly DateTime Now = new(2026, 10, 22, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task ListFinished_UsesEndAtPlusGraceHours_AndSortsByEndDescending()
    {
        await using var f = await Fixture.Create();
        long old = f.Contest("Cũ", Now.AddDays(-10), 24, out _);
        long recent = f.Contest("Gần đây", Now.AddDays(-3), 24, out _);
        f.Contest("Còn gia hạn", Now.AddHours(-2), 24, out _);
        f.Contest("Đang diễn ra", Now.AddDays(2), 24, out _);
        long exact = f.Contest("Vừa đủ gia hạn", Now.AddHours(-24), 24, out _);
        await f.Db.SaveChangesAsync();
        var list = await f.Portal.ListFinishedAsync(default);
        Assert.Equal(new[] { exact, recent, old }, list.Select(c => c.Id));
        Assert.All(list, c => Assert.Equal(DateTimeKind.Utc, c.EndAt.Kind));
    }

    [Fact]
    public async Task ListFinished_ComputesSubmittedCountPrizeTotalsAndStatus()
    {
        await using var f = await Fixture.Create();
        long none = f.Contest("Không giải", Now.AddDays(-5), 0, out _);
        long fresh = f.Contest("Chưa quay", Now.AddDays(-6), 0, out long freshPrize);
        long partial = f.Contest("Đang quay", Now.AddDays(-7), 0, out long partialPrize);
        long done = f.Contest("Xong", Now.AddDays(-8), 0, out long donePrize);
        await f.Db.SaveChangesAsync();
        await f.Allocate(fresh, freshPrize, 2); await f.Allocate(partial, partialPrize, 2); await f.Allocate(done, donePrize, 1);
        foreach (long id in new[] { fresh, partial, done }) { f.Person(id, "0911111111", 5); f.Person(id, "0922222222", 6); }
        f.Person(partial, "0933333333", 7).Status = EntryStatuses.InProgress;
        await f.Db.SaveChangesAsync();
        await f.Portal.SpinAsync(partial, partialPrize, 0, Guid.NewGuid(), "member:x", default);
        await f.Portal.SpinAsync(done, donePrize, 0, Guid.NewGuid(), "member:x", default);

        var byId = (await f.Portal.ListFinishedAsync(default)).ToDictionary(c => c.Id);
        Assert.Equal(PortalDrawStatuses.NoPrize, byId[none].Status);
        Assert.Equal(PortalDrawStatuses.NotDrawn, byId[fresh].Status);
        Assert.Equal(PortalDrawStatuses.InProgress, byId[partial].Status);
        Assert.Equal(PortalDrawStatuses.Completed, byId[done].Status);
        Assert.Equal((2, 2, 0), (byId[fresh].SubmittedCount, byId[fresh].PrizeQuantity, byId[fresh].PrizeAwarded));
        Assert.Equal((2, 2, 1), (byId[partial].SubmittedCount, byId[partial].PrizeQuantity, byId[partial].PrizeAwarded));
        Assert.Equal((0, 0, 0), (byId[none].SubmittedCount, byId[none].PrizeQuantity, byId[none].PrizeAwarded));
    }

    [Fact]
    public async Task Get_MasksWinnersAndNeverReturnsFullPhoneOrName()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 3);
        f.Person(id, "0912345678", 10).FullName = "Nguyễn Văn An";
        await f.Db.SaveChangesAsync();
        await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        var detail = await f.Portal.GetAsync(id, null, default);
        var winner = Assert.Single(detail.Winners);
        Assert.Equal("Nguyễn *** An", winner.Name); Assert.Equal("091****678", winner.Phone);
        string json = JsonSerializer.Serialize(detail);
        Assert.DoesNotContain("0912345678", json); Assert.DoesNotContain("Nguyễn Văn An", json);
    }

    [Fact]
    public async Task Get_ReportsThresholdCountsTopicsAndStableHash()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 5);
        f.Db.QuizTopics.AddRange(new QuizTopic { Id = 1, Title = "Thứ nhất", UpdatedAt = Now },
            new QuizTopic { Id = 2, Title = "Thứ hai", UpdatedAt = Now });
        f.Db.ContestTopics.AddRange(new ContestTopic { ContestId = id, TopicId = 2, SortOrder = 1, Title = "Thứ hai" },
            new ContestTopic { ContestId = id, TopicId = 1, SortOrder = 0, Title = "Thứ nhất" });
        var a = f.Person(id, "0911111111", 10); f.Person(id, "0922222222", 10); f.Person(id, "0933333333", 7);
        await f.Db.SaveChangesAsync();
        var first = await f.Portal.GetAsync(id, null, default);
        Assert.Equal(10, first.SuggestedMinScore); Assert.Equal(10, first.MinScore);
        Assert.Equal(3, first.Participants); Assert.Equal(2, first.Qualified); Assert.Equal(2, first.RemainingInPool);
        Assert.Equal(new[] { "Thứ nhất", "Thứ hai" }, first.Contest.Topics);
        Assert.Equal(64, first.ListHash.Length);
        // Doi thu tu nhap va ngay nop: hash khong doi; them nguoi vao danh sach thi hash doi.
        a.SubmittedAt = a.SubmittedAt!.Value.AddDays(1); await f.Db.SaveChangesAsync();
        Assert.Equal(first.ListHash, (await f.Portal.GetAsync(id, null, default)).ListHash);
        Assert.Equal(PortalDrawService.ListHash(["B", "A"]), PortalDrawService.ListHash(["A", "B"]));
        Assert.NotEqual(PortalDrawService.ListHash(["A"]), PortalDrawService.ListHash(["A", "B"]));
        var lower = await f.Portal.GetAsync(id, 7, default);
        Assert.Equal(10, lower.SuggestedMinScore); Assert.Equal(7, lower.MinScore); Assert.Equal(3, lower.Qualified);
        Assert.NotEqual(first.ListHash, lower.ListHash);
    }

    [Fact]
    public async Task Spin_PicksExactlyOnePersonAndDecrementsRemaining_ThenNeverRepeatsWinnerAcrossPrizes()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long first); await f.Db.SaveChangesAsync();
        var second = new Prize { Code = "NHI", Name = "Giải nhì" }; f.Db.Prizes.Add(second); await f.Db.SaveChangesAsync();
        await f.Allocate(id, first, 2); await f.Allocate(id, second.Id, 1);
        for (int i = 1; i <= 3; i++) f.Person(id, $"091111111{i}", 10);
        await f.Db.SaveChangesAsync();

        var r1 = await f.Portal.SpinAsync(id, first, 0, Guid.NewGuid(), "member:x", default);
        Assert.Equal((2, 1, 1), (r1.Prize.Quantity, r1.Prize.Awarded, r1.Prize.Remaining)); Assert.Equal(2, r1.RemainingInPool);
        var r2 = await f.Portal.SpinAsync(id, first, 0, Guid.NewGuid(), "member:x", default);
        Assert.Equal(0, r2.Prize.Remaining); Assert.Equal(1, r2.RemainingInPool);
        var r3 = await f.Portal.SpinAsync(id, second.Id, 0, Guid.NewGuid(), "member:x", default);
        Assert.Equal(0, r3.RemainingInPool);
        Assert.Equal(3, new[] { r1, r2, r3 }.Select(r => r.Winner.Code).Distinct().Count());
        Assert.Equal(3, await f.Db.Draws.CountAsync(d => d.WinnersRequested == 1 && d.CreatedBy == "member:x"));
        Assert.Equal(3, await f.Db.DrawWinners.CountAsync());
        Assert.Equal(3, (await f.Portal.GetAsync(id, 0, default)).Winners.Count);
    }

    [Fact]
    public async Task Spin_RejectsExhaustedPrize()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0911111111", 5); f.Person(id, "0922222222", 5); await f.Db.SaveChangesAsync();
        await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        var ex = await Assert.ThrowsAsync<ContestAdminConflictException>(() => f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default));
        Assert.Equal("PRIZE_QUOTA_EXCEEDED", ex.Code);
        Assert.Equal(1, await f.Db.Draws.CountAsync());
    }

    [Fact]
    public async Task UnfinishedContest_ReturnsContestNotFinished_AndUnknownContestNotFound()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("Chưa xong", Now.AddHours(-1), 24, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0911111111", 5); await f.Db.SaveChangesAsync();
        Assert.Equal("CONTEST_NOT_FINISHED", (await Assert.ThrowsAsync<ContestAdminConflictException>(() => f.Portal.GetAsync(id, null, default))).Code);
        Assert.Equal("CONTEST_NOT_FINISHED", (await Assert.ThrowsAsync<ContestAdminConflictException>(() => f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default))).Code);
        Assert.Equal("CONTEST_NOT_FOUND", (await Assert.ThrowsAsync<PortalDrawContestNotFoundException>(() => f.Portal.GetAsync(9999, null, default))).Code);
        Assert.Empty(await f.Db.Draws.ToListAsync());
    }

    [Fact]
    public async Task Spin_RetryWithSameRequestIdReturnsSameDraw_WithoutAwardingTwice()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 2); f.Person(id, "0911111111", 5); f.Person(id, "0922222222", 5); await f.Db.SaveChangesAsync();
        Guid request = Guid.NewGuid();
        var first = await f.Portal.SpinAsync(id, prize, 0, request, "member:x", default);
        var retry = await f.Portal.SpinAsync(id, prize, 0, request, "member:x", default);
        Assert.Equal(first.DrawId, retry.DrawId); Assert.Equal(first.Winner.Code, retry.Winner.Code);
        Assert.Equal(1, await f.Db.Draws.CountAsync()); Assert.Equal(1, await f.Db.DrawWinners.CountAsync());
    }

    [Fact]
    public async Task Get_LocksThresholdToExistingDraw_IgnoringQueryMinScore()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 3);
        f.Person(id, "0911111111", 10); f.Person(id, "0922222222", 8); f.Person(id, "0933333333", 6);
        await f.Db.SaveChangesAsync();
        await f.Portal.SpinAsync(id, prize, 6, Guid.NewGuid(), "member:x", default);
        foreach (int? query in new int?[] { null, 10 })
        {
            var detail = await f.Portal.GetAsync(id, query, default);
            Assert.Equal(6, detail.MinScore); Assert.True(detail.MinScoreLocked); Assert.Null(detail.MinScoreWarning);
            Assert.Equal(10, detail.SuggestedMinScore); Assert.True(detail.RemainingInPool > 0);
        }
    }

    [Fact]
    public async Task Spin_RejectsDifferentThresholdAfterFirstDraw_ButAcceptsSame()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 3);
        f.Person(id, "0911111111", 10); f.Person(id, "0922222222", 8); f.Person(id, "0933333333", 6);
        await f.Db.SaveChangesAsync();
        await f.Portal.SpinAsync(id, prize, 6, Guid.NewGuid(), "member:x", default);
        var ex = await Assert.ThrowsAsync<ContestAdminValidationException>(() => f.Portal.SpinAsync(id, prize, 10, Guid.NewGuid(), "member:x", default));
        Assert.Contains("minScore", ex.Fields.Keys);
        Assert.Equal(1, await f.Db.Draws.CountAsync());
        await f.Portal.SpinAsync(id, prize, 6, Guid.NewGuid(), "member:x", default);
        Assert.Equal(2, await f.Db.Draws.CountAsync());
    }

    [Fact]
    public async Task Get_MixedDrawThresholds_UsesLatestDrawAndWarns()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out _); await f.Db.SaveChangesAsync();
        f.Person(id, "0911111111", 10); f.Person(id, "0922222222", 8);
        f.Db.Draws.Add(new Draw { ContestId = id, CreatedAt = Now.AddHours(-5), CreatedBy = "x", MinScore = 8, WinnersRequested = 1,
            Winners = { new DrawWinner { Rank = 1, Code = "C1", FullName = "A", Phone = "0911111111", Score = 8 } } });
        f.Db.Draws.Add(new Draw { ContestId = id, CreatedAt = Now.AddHours(-1), CreatedBy = "x", MinScore = 10, WinnersRequested = 1,
            Winners = { new DrawWinner { Rank = 1, Code = "C2", FullName = "B", Phone = "0922222222", Score = 10 } } });
        await f.Db.SaveChangesAsync();
        var detail = await f.Portal.GetAsync(id, 0, default);
        Assert.Equal(10, detail.MinScore); Assert.True(detail.MinScoreLocked);
        Assert.NotNull(detail.MinScoreWarning); Assert.Contains("8, 10", detail.MinScoreWarning);
    }

    [Fact]
    public async Task Get_NoDrawYet_IsNotLocked()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out _); await f.Db.SaveChangesAsync();
        f.Person(id, "0911111111", 10); f.Person(id, "0922222222", 7); await f.Db.SaveChangesAsync();
        var detail = await f.Portal.GetAsync(id, 7, default);
        Assert.False(detail.MinScoreLocked); Assert.Null(detail.MinScoreWarning); Assert.Equal(7, detail.MinScore);
    }

    [Fact]
    public async Task Get_ThresholdStaysLocked_AfterAllWinnersCancelled()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0911111111", 10); f.Person(id, "0922222222", 6); await f.Db.SaveChangesAsync();
        var spin = await f.Portal.SpinAsync(id, prize, 6, Guid.NewGuid(), "member:x", default);
        await Cancel(f, id, spin.DrawId);
        var detail = await f.Portal.GetAsync(id, null, default);
        Assert.True(detail.MinScoreLocked); Assert.Equal(6, detail.MinScore);
    }

    [Fact]
    public async Task Spin_RetrySameRequestIdWithSameThreshold_ReturnsSameDraw()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 2); f.Person(id, "0911111111", 8); f.Person(id, "0922222222", 6); await f.Db.SaveChangesAsync();
        Guid request = Guid.NewGuid();
        var first = await f.Portal.SpinAsync(id, prize, 6, request, "member:x", default);
        var retry = await f.Portal.SpinAsync(id, prize, 6, request, "member:x", default);
        Assert.Equal(first.DrawId, retry.DrawId);
        Assert.Equal(1, await f.Db.Draws.CountAsync());
    }

    private static Task<PortalDrawCancelResult> Cancel(Fixture f, long contestId, long drawId, int rank = 1, string? code = "tu-choi-nhan-giai", string? text = null) =>
        f.Portal.CancelWinnerAsync(contestId, drawId, rank, code, text, "thanh-vien", Guid.NewGuid(), default);

    [Fact]
    public async Task Cancel_ReturnsQuota_AndAllowsSpinAgain()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0911111111", 5); f.Person(id, "0922222222", 5); await f.Db.SaveChangesAsync();
        var spin = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        Assert.Equal(0, spin.Prize.Remaining);
        var result = await Cancel(f, id, spin.DrawId);
        Assert.Equal((0, 1), (result.Prize!.Awarded, result.Prize.Remaining));
        var prizes = await f.Portal.GetAsync(id, 0, default);
        Assert.Equal((0, 1), (prizes.Prizes.Single().Awarded, prizes.Prizes.Single().Remaining));
        var again = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        Assert.NotEqual(spin.Winner.Code, again.Winner.Code);
    }

    [Fact]
    public async Task Cancel_SecondTimeConflicts()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0911111111", 5); await f.Db.SaveChangesAsync();
        var spin = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        await Cancel(f, id, spin.DrawId);
        var ex = await Assert.ThrowsAsync<ContestAdminConflictException>(() => Cancel(f, id, spin.DrawId));
        Assert.Equal("WINNER_ALREADY_CANCELLED", ex.Code);
    }

    [Fact]
    public async Task Cancel_ValidatesReasonFields()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0911111111", 5); await f.Db.SaveChangesAsync();
        var spin = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        foreach (string? blank in new[] { null, "", "   " })
            Assert.Contains("reasonText", (await Assert.ThrowsAsync<ContestAdminValidationException>(() => Cancel(f, id, spin.DrawId, 1, "khac", blank))).Fields.Keys);
        Assert.Contains("reasonCode", (await Assert.ThrowsAsync<ContestAdminValidationException>(() => Cancel(f, id, spin.DrawId, 1, "la"))).Fields.Keys);
        Assert.Contains("reasonText", (await Assert.ThrowsAsync<ContestAdminValidationException>(() => Cancel(f, id, spin.DrawId, 1, "khac", new string('a', 501)))).Fields.Keys);
        Assert.Null((await f.Db.DrawWinners.SingleAsync()).CancelledAt);
    }

    [Fact]
    public async Task Cancel_CancelledPersonNeverDrawnAgain()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 2); f.Person(id, "0911111111", 5); f.Person(id, "0922222222", 5); await f.Db.SaveChangesAsync();
        var s1 = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        Assert.Equal(1, s1.RemainingInPool);
        await Cancel(f, id, s1.DrawId);
        Assert.Equal(1, (await f.Portal.GetAsync(id, 0, default)).RemainingInPool);
        var s2 = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        Assert.NotEqual(s1.Winner.Code, s2.Winner.Code);
        var ex = await Assert.ThrowsAsync<ContestAdminConflictException>(() => f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default));
        Assert.Equal("DRAW_INSUFFICIENT_CANDIDATES", ex.Code);
    }

    [Fact]
    public async Task Get_ReturnsCancelledWinnerWithLabel_StillMasked_AndWritesAudit()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0912345678", 5).FullName = "Nguyễn Văn An"; await f.Db.SaveChangesAsync();
        var spin = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        await Cancel(f, id, spin.DrawId, 1, "khong-lien-he-duoc", "bỏ qua");
        var detail = await f.Portal.GetAsync(id, null, default);
        var w = Assert.Single(detail.Winners);
        Assert.True(w.Cancelled); Assert.Equal(1, w.Rank); Assert.Equal("thanh-vien", w.CancelledBy);
        Assert.Equal("Người trúng không liên hệ được trong thời hạn", w.CancelReason);
        Assert.Equal(Now, w.CancelledAt); Assert.Equal(DateTimeKind.Utc, w.CancelledAt!.Value.Kind);
        string json = JsonSerializer.Serialize(detail);
        Assert.DoesNotContain("0912345678", json); Assert.DoesNotContain("Nguyễn Văn An", json);
        Assert.Equal(1, await f.Db.ContestAccessAudits.CountAsync(a => a.Action == "draw.cancel"));
    }

    [Fact]
    public async Task Cancel_OtherReasonStoresTrimmedText_AndUnknownWinnerIsNotFound()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out long prize); long other = f.Contest("B", Now.AddDays(-2), 0, out _); await f.Db.SaveChangesAsync();
        await f.Allocate(id, prize, 1); f.Person(id, "0911111111", 5); await f.Db.SaveChangesAsync();
        var spin = await f.Portal.SpinAsync(id, prize, 0, Guid.NewGuid(), "member:x", default);
        await Assert.ThrowsAsync<PortalDrawWinnerNotFoundException>(() => Cancel(f, other, spin.DrawId));
        await Assert.ThrowsAsync<PortalDrawWinnerNotFoundException>(() => Cancel(f, id, spin.DrawId, 9));
        await Assert.ThrowsAsync<PortalDrawWinnerNotFoundException>(() => Cancel(f, id, 9999));
        await Cancel(f, id, spin.DrawId, 1, "khac", "  Lý do riêng  ");
        Assert.Equal("Lý do riêng", (await f.Db.DrawWinners.SingleAsync()).CancelReasonText);
    }

    [Fact]
    public void CancelAction_RequiresAntiForgeryAndControllerRequiresMemberPolicy()
    {
        var type = typeof(Umbraco.Plugin.Custom.Api.Controllers.PortalDrawController);
        var action = type.GetMethod("Cancel")!;
        Assert.NotNull(action.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.ValidateAntiForgeryTokenAttribute), true).SingleOrDefault());
        var authorize = (Microsoft.AspNetCore.Authorization.AuthorizeAttribute)type.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true).Single();
        Assert.Equal(Umbraco.Plugin.Custom.Core.Administration.DrawMemberAccess.Policy, authorize.Policy);
    }

    [Fact]
    public async Task Display_DefaultsWhenNotSaved()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out _); await f.Db.SaveChangesAsync();
        var expected = new PortalDrawDisplay(true, true, false);
        Assert.Equal(expected, await f.Portal.GetDisplayAsync(id, default));
        Assert.Equal(expected, (await f.Portal.GetAsync(id, null, default)).Display);
    }

    [Fact]
    public async Task Display_SaveThenReadBack_SecondSaveUpdatesSameRow()
    {
        await using var f = await Fixture.Create();
        long id = f.Contest("A", Now.AddDays(-2), 0, out _); await f.Db.SaveChangesAsync();
        var first = new PortalDrawDisplay(false, false, true);
        Assert.Equal(first, await f.Portal.SaveDisplayAsync(id, first, "thanh-vien", default));
        Assert.Equal(first, await f.Portal.GetDisplayAsync(id, default));
        Assert.Equal(first, (await f.Portal.GetAsync(id, null, default)).Display);
        var second = new PortalDrawDisplay(true, false, false);
        await f.Portal.SaveDisplayAsync(id, second, "nguoi-khac", default);
        Assert.Equal(second, await f.Portal.GetDisplayAsync(id, default));
        var row = await f.Db.ContestDrawDisplays.SingleAsync();
        Assert.Equal(1, await f.Db.ContestDrawDisplays.CountAsync());
        Assert.Equal("nguoi-khac", row.UpdatedBy); Assert.Equal(Now, row.UpdatedAt);
    }

    [Fact]
    public async Task Display_UnknownContestIsNotFound()
    {
        await using var f = await Fixture.Create();
        await Assert.ThrowsAsync<PortalDrawContestNotFoundException>(() => f.Portal.GetDisplayAsync(9999, default));
        await Assert.ThrowsAsync<PortalDrawContestNotFoundException>(() => f.Portal.SaveDisplayAsync(9999, new(true, true, false), "x", default));
    }

    [Fact]
    public void SaveDisplayAction_RequiresAntiForgery()
    {
        var action = typeof(Umbraco.Plugin.Custom.Api.Controllers.PortalDrawController).GetMethod("SaveDisplay")!;
        Assert.NotNull(action.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.ValidateAntiForgeryTokenAttribute), true).SingleOrDefault());
    }

    private sealed class FixedTime(DateTime utc) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utc, TimeSpan.Zero);
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");
        private int sequence;
        public AppDbContext Db { get; private set; } = null!;
        public PortalDrawService Portal { get; private set; } = null!;

        public static async Task<Fixture> Create()
        {
            var f = new Fixture(); await f.connection.OpenAsync();
            f.Db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(f.connection).Options);
            await f.Db.Database.MigrateAsync();
            var time = new FixedTime(Now);
            f.Portal = new PortalDrawService(f.Db, new ContestAdminService(f.Db, time),
                new Umbraco.Plugin.Custom.Core.Administration.ContestAuditService(f.Db, new Microsoft.AspNetCore.DataProtection.EphemeralDataProtectionProvider(), time), time);
            return f;
        }

        /// <summary>Them cuoc thi ket thuc tai endAt; giai mac dinh duoc tao nhung chua gan suat.</summary>
        public long Contest(string name, DateTime endAt, int graceHours, out long prizeId)
        {
            var c = new ContestCampaign { Name = name, StartAt = endAt.AddDays(-1), EndAt = endAt, SubmitGraceHours = graceHours, CreatedAt = Now, UpdatedAt = Now };
            var p = new Prize { Code = $"G{++sequence}", Name = $"Giải {sequence}" };
            Db.ContestCampaigns.Add(c); Db.Prizes.Add(p); Db.SaveChanges();
            prizeId = p.Id; return c.Id;
        }

        public async Task Allocate(long contestId, long prizeId, int quantity)
        {
            Db.ContestPrizes.Add(new ContestPrize { ContestId = contestId, PrizeId = prizeId, Quantity = quantity });
            await Db.SaveChangesAsync();
        }

        public Entry Person(long contestId, string phone, int score)
        {
            var e = new Entry { ContestId = contestId, Code = $"AD-{++sequence:D6}", TokenHash = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
                FullName = "Thí sinh thử", Phone = phone, Mode = EntryModes.Named, Score = score, Status = EntryStatuses.Submitted,
                CreatedAt = new DateTime(2026, 10, 1), SubmittedAt = new DateTime(2026, 10, 2) };
            Db.Entries.Add(e); return e;
        }

        public async ValueTask DisposeAsync() { await Db.DisposeAsync(); await connection.DisposeAsync(); }
    }
}
