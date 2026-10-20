using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Administration;

public sealed class ContestReportingService
{
    private readonly AppDbContext db;
    public ContestReportingService(AppDbContext context)
    {
        db = context;
        ((SqliteConnection)db.Database.GetDbConnection()).CreateFunction<string,string>("antc_casefold",
            value => value.Normalize(NormalizationForm.FormC).ToUpperInvariant(), isDeterministic: true);
    }

    public Task<List<ContestChoice>> ContestsAsync(CancellationToken ct) => db.ContestCampaigns.AsNoTracking()
        .OrderByDescending(c => c.StartAt).ThenByDescending(c => c.Id).Select(c => new ContestChoice(c.Id,c.Name)).ToListAsync(ct);

    public Task<List<ReportTopic>> TopicsAsync(long? contestId, CancellationToken ct) => db.QuizTopics.AsNoTracking()
        .Where(t=>contestId==null || db.ContestTopics.Any(c=>c.ContestId==contestId && c.TopicId==t.Id))
        .OrderBy(t=>t.Id).Select(t=>new ReportTopic(t.Id,t.Title)).ToListAsync(ct);

    private IQueryable<Entry> Filtered(ContestReportFilter f)
    {
        if (f.Validate().Count > 0) throw new ArgumentException("Bộ lọc không hợp lệ.");
        var q = db.Entries.AsNoTracking();
        if (f.ContestId is { } contest) q = q.Where(e => e.ContestId == contest);
        if (!string.IsNullOrEmpty(f.Mode)) q = q.Where(e => e.Mode == f.Mode);
        if (!string.IsNullOrEmpty(f.Status)) q = q.Where(e => e.Status == f.Status);
        if (f.HasPhone is { } phone) q = q.Where(e => (e.Phone != null && e.Phone != "") == phone);
        if (f.ScoreFrom is { } min) q = q.Where(e => e.Score >= min);
        if (f.ScoreTo is { } max) q = q.Where(e => e.Score <= max);
        if (f.From is { } from)
        {
            DateTime lower = from.ToDateTime(TimeOnly.MinValue).AddHours(-7);
            q = q.Where(e => e.CreatedAt >= lower);
        }
        if (f.To is { } to && to != DateOnly.MaxValue)
        {
            DateTime upper = to.AddDays(1).ToDateTime(TimeOnly.MinValue).AddHours(-7);
            q = q.Where(e => e.CreatedAt < upper);
        }
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            string term = f.Search.Trim().Normalize(NormalizationForm.FormC).ToUpperInvariant();
            q = q.Where(e => AppDbContext.FoldText(e.Code).Contains(term) ||
                AppDbContext.FoldText(e.FullName ?? "").Contains(term) || (e.Phone != null && e.Phone.Contains(term)));
        }
        return q;
    }

    private static IOrderedQueryable<Entry> Ordered(IQueryable<Entry> q, string order) => order switch
    {
        "score_desc" => q.OrderByDescending(e => e.Score).ThenByDescending(e => e.Id),
        "score_asc" => q.OrderBy(e => e.Score).ThenBy(e => e.Id),
        "created_asc" => q.OrderBy(e => e.CreatedAt).ThenBy(e => e.Id),
        "submitted_desc" => q.OrderByDescending(e => e.SubmittedAt).ThenByDescending(e => e.Id),
        _ => q.OrderByDescending(e => e.CreatedAt).ThenByDescending(e => e.Id),
    };

    private IQueryable<ReportEntry> Rows(IQueryable<Entry> q) => q.Select(e => new ReportEntry(
        e.Id,e.ContestId,e.Code,e.FullName,e.Phone,e.Org,e.Mode,e.AttemptNo,e.Status,
        e.Status == EntryStatuses.Submitted ? e.Answered : db.EntryAnswers.Count(a => a.EntryId == e.Id),
        e.Score ?? db.EntryAnswers.Count(a => a.EntryId == e.Id && a.IsCorrect),DateTime.SpecifyKind(e.CreatedAt,DateTimeKind.Utc),
        e.SubmittedAt.HasValue?DateTime.SpecifyKind(e.SubmittedAt.Value,DateTimeKind.Utc):null));

    public async Task<EntryReportPage> EntriesAsync(ContestReportFilter f, CancellationToken ct)
    {
        var q = Filtered(f);
        int count = await q.CountAsync(ct);
        var rows = await Rows(Ordered(q,f.Sort).Skip((f.Page-1)*50).Take(50)).ToListAsync(ct);
        return new(rows,count,f.Page);
    }

    public IAsyncEnumerable<ReportEntry> ExportEntries(ContestReportFilter f) => Rows(Ordered(Filtered(f),f.Sort)).AsAsyncEnumerable();

    public async Task<ContestDashboard> DashboardAsync(ContestReportFilter f, CancellationToken ct)
    {
        var q = Filtered(f);
        var counts = await q.GroupBy(_ => 1).Select(g => new
        {
            Created=g.Count(), Submitted=g.Count(e=>e.Status==EntryStatuses.Submitted),
            Named=g.Count(e=>e.Mode==EntryModes.Named), Anon=g.Count(e=>e.Mode==EntryModes.Anon),
            Phones=g.Where(e=>e.Phone!=null && e.Phone!="").Select(e=>e.Phone).Distinct().Count(),
        }).SingleOrDefaultAsync(ct);
        var scores = await q.Where(e=>e.Status==EntryStatuses.Submitted).GroupBy(e=>e.Score ?? 0)
            .OrderBy(g=>g.Key).Select(g=>new ScoreFrequency(g.Key,g.Count())).ToListAsync(ct);
        var days = await q.GroupBy(e=>e.CreatedAt.AddHours(7).Date)
            .OrderBy(g=>g.Key).Select(g=>new DayFrequency(g.Key,g.Count())).ToListAsync(ct);
        return new(counts?.Created??0,counts?.Submitted??0,counts?.Named??0,counts?.Anon??0,counts?.Phones??0,scores,days);
    }

    public async Task<EntryReportDetail?> DetailAsync(long id, CancellationToken ct)
    {
        var entry = await Rows(db.Entries.AsNoTracking().Where(e=>e.Id==id)).SingleOrDefaultAsync(ct);
        if (entry is null) return null;
        var answers = await db.EntryAnswers.AsNoTracking().Where(a=>a.EntryId==id).ToDictionaryAsync(a=>a.QuestionCode,ct);
        List<DetailQuestion> questions;
        bool snapshot = entry.ContestId is not null;
        if (snapshot)
        {
            var topics = await db.ContestTopics.AsNoTracking().Where(t=>t.ContestId==entry.ContestId)
                .OrderBy(t=>t.SortOrder).ThenBy(t=>t.TopicId).Select(t=>new {t.TopicId,t.Title}).ToListAsync(ct);
            var rows = await db.ContestQuestions.AsNoTracking().Where(q=>q.ContestId==entry.ContestId)
                .OrderBy(q=>q.SortOrder).ThenBy(q=>q.QuestionCode).ToListAsync(ct);
            questions = topics.SelectMany(t=>rows.Where(q=>q.TopicId==t.TopicId).Select(q =>
                new DetailQuestion(q.QuestionCode,q.TopicId,t.Title,q.QuestionText,
                    string.IsNullOrEmpty(q.Answer)?null:q.Answer,null,null,null))).ToList();
        }
        else
        {
            // Legacy entries have no immutable answer key: do not label today's bank answer as the old correct answer.
            questions = await db.QuizQuestions.AsNoTracking().Where(q=>q.IsActive || answers.Keys.Contains(q.Code))
                .OrderBy(q=>q.TopicId).ThenBy(q=>q.SortOrder).Select(q=>new DetailQuestion(q.Code,q.TopicId,
                    q.Topic!.Title,q.Question,null,null,null,null)).ToListAsync(ct);
        }
        var known = questions.Select(q=>q.Code).ToHashSet(StringComparer.Ordinal);
        questions.AddRange(answers.Values.Where(a=>!known.Contains(a.QuestionCode)).Select(a=>
            new DetailQuestion(a.QuestionCode,a.Topic,$"Chuyên đề {a.Topic}","Không còn nội dung trong bộ đề.",null,null,null,null)));
        questions = questions.Select(q=>answers.TryGetValue(q.Code,out var a)
            ? q with {Chosen=a.Chosen,Correct=a.IsCorrect,AnsweredAt=DateTime.SpecifyKind(a.AnsweredAt,DateTimeKind.Utc)} : q).ToList();
        var byTopic = questions.GroupBy(q=>new {q.TopicId,q.TopicTitle}).Select(g=>new DetailTopic(
            g.Key.TopicId,g.Key.TopicTitle,g.Count(q=>q.Correct==true),g.Count(q=>q.Chosen!=null),g.Count())).ToList();
        return new(entry,questions,byTopic,snapshot);
    }

    public async Task<IReadOnlyList<QuestionReport>> QuestionsAsync(ContestReportFilter f, int? topicId, CancellationToken ct)
    {
        var entries = Filtered(f);
        var answers = db.EntryAnswers.AsNoTracking().Where(a=>entries.Any(e=>e.Id==a.EntryId));
        if (topicId is { } topic) answers = answers.Where(a=>a.Topic==topic);
        var counts = await answers.GroupBy(a=>new {a.Entry!.ContestId,a.QuestionCode,a.Topic})
            .Select(g=>new {g.Key.ContestId,Code=g.Key.QuestionCode,TopicId=g.Key.Topic,Answered=g.Count(),
                Correct=g.Count(a=>a.IsCorrect),A=g.Count(a=>a.Chosen=="A"),B=g.Count(a=>a.Chosen=="B"),
                C=g.Count(a=>a.Chosen=="C"),D=g.Count(a=>a.Chosen=="D")}).ToListAsync(ct);
        var snapshots = db.ContestQuestions.AsNoTracking().AsQueryable();
        if (f.ContestId is { } contest) snapshots = snapshots.Where(q=>q.ContestId==contest);
        if (topicId is { } selectedTopic) snapshots = snapshots.Where(q=>q.TopicId==selectedTopic);
        var definitions = await snapshots.Select(q=>new {ContestId=(long?)q.ContestId,Name=q.Contest!.Name,
            Code=q.QuestionCode,TopicId=q.TopicId,Text=q.QuestionText}).ToListAsync(ct);
        var result = new List<QuestionReport>();
        var countMap = counts.ToDictionary(x=>(x.ContestId,x.Code,x.TopicId));
        foreach (var def in definitions)
        {
            countMap.Remove((def.ContestId,def.Code,def.TopicId),out var count);
            result.Add(new(def.ContestId,def.Name,def.Code,def.TopicId,def.Text,
                count?.Answered??0,count?.Correct??0,count?.A??0,count?.B??0,count?.C??0,count?.D??0));
        }
        // Include historical answers even when the source question is no longer available.
        foreach (var count in countMap.Values)
            result.Add(new(count.ContestId,count.ContestId is null?"Lượt cũ":"Không có snapshot",count.Code,count.TopicId,"",
                count.Answered,count.Correct,count.A,count.B,count.C,count.D));
        return result.OrderBy(r=>r.CorrectRate is null).ThenBy(r=>r.CorrectRate)
            .ThenBy(r=>r.ContestId).ThenBy(r=>r.TopicId).ThenBy(r=>r.Code,StringComparer.Ordinal).ToList();
    }

    public async IAsyncEnumerable<string[]> ExportAnswers(ContestReportFilter f, [EnumeratorCancellation] CancellationToken ct = default)
    {
        var entries = Filtered(f);
        var query = db.EntryAnswers.AsNoTracking().Where(a=>entries.Any(e=>e.Id==a.EntryId))
            .OrderBy(a=>a.EntryId).ThenBy(a=>a.Topic).ThenBy(a=>a.QuestionCode)
            .Select(a=>new {Code=a.Entry!.Code,a.QuestionCode,a.Topic,a.Chosen,a.IsCorrect});
        await foreach (var row in query.AsAsyncEnumerable().WithCancellation(ct))
            yield return [row.Code,row.QuestionCode,row.Topic.ToString(),row.Chosen,row.IsCorrect?"Đúng":"Sai"];
    }
}
