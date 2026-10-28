using System.Data;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Administration;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed class ContestResultsService(AppDbContext db, TimeProvider clock, ContestAuditService audit)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static DateTime Utc(DateTime value) => DateTime.SpecifyKind(value,DateTimeKind.Utc);
    private static ResultContest Contest(ContestCampaign c) => new(c.Id,c.Name,Utc(c.StartAt),Utc(c.EndAt),Utc(c.EndAt.AddHours(c.SubmitGraceHours)));
    private static bool Closed(ContestCampaign c, DateTime now) => now >= c.EndAt.AddHours(c.SubmitGraceHours);
    private static bool PhoneValid(string? value) => value is not null && Regex.IsMatch(value,@"\A0[0-9]{9}\z");
    public static string MaskPhone(string value) => PhoneValid(value) ? value[..3]+"****"+value[^3..] : "***";
    // Re-mask legacy published values too; never restore previously redacted digits.
    public static string MaskWinnerPhone(string value) => Regex.IsMatch(value, @"\A0[0-9*]{9}\z") ? value[..6] + "****" : "***";
    public static string MaskName(string value)
    {
        string[] parts = value.Split((char[]?)null,StringSplitOptions.RemoveEmptyEntries);
        return parts.Length switch {0=>"***",1=>"***",2=>parts[0]+" ***",_=>parts[0]+" *** "+parts[^1]};
    }

    public async Task<ContestResultsResponse?> GetAsync(long contestId, int page, int pageSize, CancellationToken ct)
    {
        ValidateId(contestId);
        if (page is < 1 or > 1000000 || pageSize is < 1 or > 100)
            throw new ContestResultsException("VALIDATION","Trang phải từ 1 đến 1.000.000, số dòng mỗi trang từ 1 đến 100.",400);
        // One SQL statement: visibility and snapshot cannot come from different publication revisions.
        var record = await (from c in db.ContestCampaigns.AsNoTracking()
            join p in db.ContestPublishedResults.AsNoTracking() on c.Id equals p.ContestId into publications
            from p in publications.DefaultIfEmpty()
            where c.Id==contestId && c.IsActive
            select new {Contest=c,Publication=p}).SingleOrDefaultAsync(ct);
        if (record is null) return null;
        var pub = record.Publication;
        bool visible = pub?.IsPublished==true && Closed(record.Contest,clock.GetUtcNow().UtcDateTime);
        if (!visible) return new(Contest(record.Contest),"pending",null,0,new(0,page,pageSize,0,[]),[]);
        var snapshot = JsonSerializer.Deserialize<ResultSnapshot>(pub!.SnapshotJson,Json)
            ?? throw new InvalidOperationException("RESULT_SNAPSHOT_INVALID");
        return new(snapshot.Contest,"published",pub.PublishedAt is {} at?Utc(at):null,pub.Revision,
            new(snapshot.Leaderboard.Count,page,pageSize,(int)Math.Ceiling(snapshot.Leaderboard.Count/(double)pageSize),
                snapshot.Leaderboard.Skip((page-1)*pageSize).Take(pageSize).ToList()),
            snapshot.Draws.Select(d => d with { Winners = d.Winners.Select(w => w with { Phone = MaskWinnerPhone(w.Phone) }).ToList() }).ToList());
    }

    public async Task<ResultsPublicationState?> StateAsync(long contestId,CancellationToken ct)
    {
        ValidateId(contestId);
        if (!await db.ContestCampaigns.AnyAsync(c=>c.Id==contestId,ct)) return null;
        var pub = await db.ContestPublishedResults.AsNoTracking().SingleOrDefaultAsync(p=>p.ContestId==contestId,ct);
        return State(contestId,pub);
    }

    public async Task<ResultsPublicationState?> SetPublicationAsync(long contestId, ResultsPublicationRequest request, Guid actor, CancellationToken ct)
    {
        ValidateId(contestId);
        if (request.IsPublished is null || request.ExpectedRevision is null or < 0)
            throw new ContestResultsException("VALIDATION","Phải gửi isPublished và expectedRevision (0 khi chưa từng công bố).",400);
        long[] drawIds = request.DrawIds?.Distinct().Order().ToArray() ?? [];
        if (drawIds.Length>100 || drawIds.Any(id=>id<=0))
            throw new ContestResultsException("VALIDATION","Chọn tối đa 100 lần quay hợp lệ.",400);
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
        var contest = await db.ContestCampaigns.SingleOrDefaultAsync(c=>c.Id==contestId,ct);
        if (contest is null) return null;
        var pub = await db.ContestPublishedResults.SingleOrDefaultAsync(p=>p.ContestId==contestId,ct);
        if ((pub?.Revision??0)!=request.ExpectedRevision)
            throw new ContestResultsException("RESULTS_CHANGED","Kết quả đã được thay đổi. Vui lòng tải lại trước khi công bố.");
        // Repeated identical commands do not rebuild or change the approved timestamp.
        if (pub?.IsPublished==request.IsPublished && (!request.IsPublished.Value || State(contestId,pub).DrawIds.Order().SequenceEqual(drawIds)))
            return State(contestId,pub);
        if (!request.IsPublished.Value && pub is null) return State(contestId,null);
        if (request.IsPublished.Value)
        {
            if (!contest.IsActive || !Closed(contest,clock.GetUtcNow().UtcDateTime))
                throw new ContestResultsException("CONTEST_NOT_CLOSED","Chỉ công bố sau khi cuộc thi kết thúc và hết thời gian gia hạn nộp bài.");
            if (pub?.IsPublished==true)
                throw new ContestResultsException("RESULTS_ALREADY_PUBLISHED","Cần gỡ công bố trước khi thay đổi kết quả.");
            var draws = await db.Draws.AsNoTracking().Include(d=>d.Winners).Where(d=>drawIds.Contains(d.Id)).ToListAsync(ct);
            if (draws.Count!=drawIds.Length || draws.Any(d=>d.ContestId!=contestId))
                throw new ContestResultsException("VALIDATION","Lần quay không tồn tại hoặc không thuộc cuộc thi này.",400);
            // Historical draws may include anonymous entries. Never silently publish those as prize winners.
            // Winners cancelled by an admin are excluded from validation and from the public snapshot.
            var winnerIds=draws.SelectMany(d=>d.Winners).Where(w=>w.CancelledAt==null && w.EntryId!=null).Select(w=>w.EntryId!.Value).Distinct().ToArray();
            var winners=await db.Entries.AsNoTracking().Where(e=>winnerIds.Contains(e.Id)).ToDictionaryAsync(e=>e.Id,ct);
            foreach(var w in draws.SelectMany(d=>d.Winners).Where(w=>w.CancelledAt==null))
                if (w.EntryId is not {} id || !winners.TryGetValue(id,out var e) || e.ContestId!=contestId ||
                    e.Status!=EntryStatuses.Submitted || e.Mode!=EntryModes.Named || !PhoneValid(e.Phone) ||
                    !PhoneValid(w.Phone) || w.Phone!=e.Phone || w.Code!=e.Code || w.Score!=e.Score || string.IsNullOrWhiteSpace(w.FullName))
                    throw new ContestResultsException("INVALID_DRAW_RESULT","Có người trúng không đủ điều kiện hoặc dữ liệu lần quay không khớp lượt thi. Vui lòng kiểm tra lại.");
            var entries = await db.Entries.AsNoTracking().Where(e=>e.ContestId==contestId && e.Status==EntryStatuses.Submitted &&
                e.Mode==EntryModes.Named && e.Phone!=null && e.Score!=null && e.SubmittedAt!=null)
                .Select(e=>new {e.Id,e.Code,e.FullName,e.Phone,Score=e.Score!.Value,e.Answered,SubmittedAt=e.SubmittedAt!.Value}).ToListAsync(ct);
            var ranked = entries.Where(e=>PhoneValid(e.Phone)).GroupBy(e=>e.Phone,StringComparer.Ordinal)
                .Select(g=>g.OrderByDescending(e=>e.Score).ThenBy(e=>e.SubmittedAt).ThenBy(e=>e.Id).First())
                .OrderByDescending(e=>e.Score).ThenBy(e=>e.SubmittedAt).ThenBy(e=>e.Id)
                .Select((e,i)=>new PublicRank(i+1,e.Code,MaskName(e.FullName??""),MaskPhone(e.Phone!),e.Score,e.Answered,Utc(e.SubmittedAt))).ToList();
            var publicDraws=draws.OrderBy(d=>d.CreatedAt).ThenBy(d=>d.Id).Select(d=>new PublicDraw(d.Id,Utc(d.CreatedAt),
                d.Winners.Where(w=>w.CancelledAt==null).OrderBy(w=>w.Rank).Select(w=>new PublicWinner(w.Rank,w.Code,MaskName(w.FullName),MaskWinnerPhone(w.Phone),w.Score)).ToList(),d.PrizeCode,d.PrizeName))
                .Where(d=>d.Winners.Count>0).ToList();
            if (pub is null) {pub=new ContestPublishedResult{ContestId=contestId};db.ContestPublishedResults.Add(pub);}
            pub.SnapshotJson=JsonSerializer.Serialize(new ResultSnapshot(Contest(contest),ranked,publicDraws),Json);
            pub.PublishedAt=clock.GetUtcNow().UtcDateTime;
            pub.PublishedByKey=actor;
        }
        pub!.IsPublished=request.IsPublished.Value;
        pub.Revision++;
        await audit.RecordAsync(actor,pub.IsPublished?"results.publish":"results.unpublish",
            new {ContestId=contestId,Revision=pub.Revision,DrawIds=drawIds},null,ct);
        await transaction.CommitAsync(ct);
        return State(contestId,pub);
    }

    private static ResultsPublicationState State(long id,ContestPublishedResult? pub) => new(id,pub?.IsPublished??false,pub?.Revision??0,
        pub?.PublishedAt is {} at?Utc(at):null,pub is null?[]:JsonSerializer.Deserialize<ResultSnapshot>(pub.SnapshotJson,Json)?.Draws.Select(d=>d.DrawId).ToArray()??[]);
    private static void ValidateId(long id)
    {
        if (id<=0) throw new ContestResultsException("VALIDATION","Mã cuộc thi phải là số nguyên dương.",400);
    }
}
