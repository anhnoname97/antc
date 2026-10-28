using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

// Explicit, local-only seed. Default is read-only; never migrates, edits or deletes existing data.
string? Arg(string key) { int i=Array.IndexOf(args,key);return i>=0 && i+1<args.Length?args[i+1]:null; }
string path=Path.GetFullPath(Arg("--db") ?? throw new ArgumentException("Cần --db trỏ tới CSDL ứng dụng đã có."));
if(!File.Exists(path))throw new FileNotFoundException("Không tự tạo CSDL mới.",path);
bool apply=args.Contains("--apply");
const string name="[TEST] Cuộc thi An toàn tài chính 01–10/10/2026 — 100 lượt";
const string batch="TEST-COMPLETED-100-20261024";
DateTime start=new DateTimeOffset(2026,10,1,0,0,0,TimeSpan.FromHours(7)).UtcDateTime;
DateTime end=new DateTimeOffset(2026,10,10,23,59,59,TimeSpan.FromHours(7)).UtcDateTime;
DateTime reference=new DateTimeOffset(2026,10,24,0,0,0,TimeSpan.FromHours(7)).UtcDateTime;
var cs=new SqliteConnectionStringBuilder {DataSource=path,Mode=apply?SqliteOpenMode.ReadWrite:SqliteOpenMode.ReadOnly,Pooling=false,DefaultTimeout=30};
await using var db=new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(cs.ConnectionString).Options);
if((await db.Database.GetPendingMigrationsAsync()).Any())throw new InvalidOperationException("CSDL chưa cập nhật migration; công cụ không tự chạy migration.");
var json=new JsonSerializerOptions {WriteIndented=true,Encoder=System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping};
var existing=await db.ContestCampaigns.AsNoTracking().Where(c=>c.Name==name).SingleOrDefaultAsync();
if(args.Contains("--verify"))
{
    if(existing is null)throw new InvalidOperationException("Chưa có cuộc thi của lô này.");
    var entries=await db.Entries.AsNoTracking().Where(e=>e.ContestId==existing.Id).Include(e=>e.Answers).ToListAsync();
    int total=await db.ContestQuestions.CountAsync(q=>q.ContestId==existing.Id);
    var keys=await db.ContestQuestions.Where(q=>q.ContestId==existing.Id).ToDictionaryAsync(q=>q.QuestionCode,q=>q.Answer);
    int errors=entries.Count(e=>e.Status!=EntryStatuses.Submitted || e.Answered!=total || e.Answers.Count!=total || e.Score!=e.Answers.Count(a=>a.IsCorrect) || e.TotalQuestions!=total || e.Phone is null || e.FullName is null || e.Org is null || e.ConsentAt is null || e.SubmittedAt is null || e.AttemptNo!=1 || e.CreatedAt<start || e.SubmittedAt>end || e.Answers.Any(a=>!keys.ContainsKey(a.QuestionCode) || a.IsCorrect!=(a.Chosen==keys[a.QuestionCode]) || a.AnsweredAt<e.CreatedAt || a.AnsweredAt>e.SubmittedAt) || JsonSerializer.Deserialize<SubmitDto>(e.SubmissionResultJson!) is not { } result || result.Score!=e.Score || result.Answered!=total || result.Total!=total || !result.EligibleForPrize);
    if(entries.Count!=100 || errors!=0)throw new InvalidOperationException($"Dữ liệu không khớp: {entries.Count} lượt; {errors} lỗi.");
    Console.WriteLine(JsonSerializer.Serialize(new {Verified=true,ContestId=existing.Id,Name=existing.Name,Entries=entries.Count,Questions=total,Answers=entries.Sum(e=>e.Answers.Count),DistinctPhones=entries.Select(e=>e.Phone).Distinct().Count(),MinScore=entries.Min(e=>e.Score),MaxScore=entries.Max(e=>e.Score),Prizes=await db.ContestPrizes.CountAsync(p=>p.ContestId==existing.Id),Draws=await db.Draws.CountAsync(d=>d.ContestId==existing.Id)},json));
    return;
}
if(existing is not null || await db.Entries.AnyAsync(e=>e.Org!=null && e.Org.StartsWith(batch)))throw new InvalidOperationException("Lô này đã có; dùng --verify, không chèn lặp.");
if(end.AddHours(24)>=reference)throw new InvalidOperationException("Cuộc thi chưa hết hạn nộp theo ngày kiểm thử.");
if(await db.ContestCampaigns.AnyAsync(c=>c.StartAt<=end && c.EndAt>=start))throw new InvalidOperationException("Lịch trùng cuộc thi hiện có; không tự đổi lịch cũ.");
var topics=await db.QuizTopics.AsNoTracking().Where(t=>t.IsActive).Include(t=>t.Questions).OrderBy(t=>t.Id).ToListAsync();
var questions=topics.SelectMany(t=>t.Questions.Where(q=>q.IsActive).OrderBy(q=>q.SortOrder).ThenBy(q=>q.Code)).ToList();
if(questions.Count==0)throw new InvalidOperationException("Không có câu hỏi đang dùng.");
foreach(var q in questions)
{
    var options=JsonSerializer.Deserialize<string[][]>(q.Options) ?? [];
    if(options.Length is <2 or >4 || !options.Any(o=>o[0]==q.Answer) || options.Any(o=>o.Length<2 || string.IsNullOrWhiteSpace(o[1])))throw new InvalidOperationException("Ngân hàng có lựa chọn/đáp án không hợp lệ: "+q.Code);
}
Console.WriteLine(JsonSerializer.Serialize(new {Database=path,Apply=apply,Name=name,StartUtc=start,EndUtc=end,Entries=100,Questions=questions.Count,Answers=questions.Count*100,Topics=topics.Count(t=>t.Questions.Any(q=>q.IsActive))},json));
if(!apply)return;

string backup=Path.Combine(Path.GetDirectoryName(path)!,"backups",$"before-completed-100-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}.db");
Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
await using(var source=new SqliteConnection(cs.ConnectionString))
await using(var target=new SqliteConnection(new SqliteConnectionStringBuilder {DataSource=backup,Mode=SqliteOpenMode.ReadWriteCreate,Pooling=false}.ConnectionString))
{await source.OpenAsync();await target.OpenAsync();source.BackupDatabase(target);}
Console.WriteLine("Backup: "+backup);

await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
if(await db.ContestCampaigns.AnyAsync(c=>c.StartAt<=end && c.EndAt>=start))throw new InvalidOperationException("Lịch vừa thay đổi; hủy toàn bộ lô.");
int oldEntries=await db.Entries.CountAsync(),oldContests=await db.ContestCampaigns.CountAsync(),oldAnswers=await db.EntryAnswers.CountAsync(),oldDraws=await db.Draws.CountAsync();
var campaign=new ContestCampaign {Name=name,Description="Dữ liệu giả lập để kiểm thử thống kê, công bố và quay thưởng. 100 thí sinh [TEST], trả lời đủ đề, không phải hồ sơ dự thi thật.",StartAt=start,EndAt=end,MaxAttempts=2,SubmitGraceHours=24,ReadTimerFactor=1,IsActive=true,CreatedAt=start.AddDays(-1),UpdatedAt=start.AddDays(-1)};
foreach(var topic in topics.Where(t=>t.Questions.Any(q=>q.IsActive)))campaign.Topics.Add(new ContestTopic {TopicId=topic.Id,Title=topic.Title,Intro=topic.Intro,Terms=topic.Terms,SortOrder=campaign.Topics.Count});
foreach(var q in questions)campaign.Questions.Add(new ContestQuestion {QuestionCode=q.Code,TopicId=q.TopicId,SortOrder=campaign.Questions.Count,Kind=q.Kind,Situation=q.Situation,QuestionText=q.Question,Options=q.Options,Answer=q.Answer,Explanations=q.Explanations,SafeAction=q.SafeAction,ReadSeconds=q.ReadSeconds,SampleOrder=q.SampleOrder,SampleLabel=q.SampleLabel});
var specs=new[]{("NHAT","Giải Nhất",1,5000000L),("NHI","Giải Nhì",2,3000000L),("BA","Giải Ba",3,1000000L),("KK","Giải Khuyến khích",5,500000L)};
foreach(var (code,title,quantity,money) in specs)
{
    string prizeCode="TEST100-"+code;
    if(await db.Prizes.AnyAsync(p=>p.Code==prizeCode))throw new InvalidOperationException("Mã giải thử đã có; không thay đổi dữ liệu cũ.");
    campaign.Prizes.Add(new ContestPrize {Prize=new Prize {Code=prizeCode,Name="[TEST] "+title,Description="Giải thử cho lô "+batch,SortOrder=campaign.Prizes.Count,CreatedAt=start.AddDays(-1),UpdatedAt=start.AddDays(-1)},Quantity=quantity,PrizeMoney=money,SortOrder=campaign.Prizes.Count});
}
db.ContestCampaigns.Add(campaign);
var codes=(await db.Entries.Select(e=>e.Code).ToListAsync()).ToHashSet();
var phones=(await db.Entries.Where(e=>e.Phone!=null).Select(e=>e.Phone!).ToListAsync()).ToHashSet();
string[] names=["Nguyễn Minh Anh","Trần Hoàng Nam","Lê Thu Hà","Phạm Đức Huy","Hoàng Ngọc Mai","Vũ Tuấn Anh","Đặng Thảo Linh","Bùi Gia Bảo","Đỗ Thanh Tâm","Ngô Quang Huy"];
const string alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
for(int i=1;i<=100;i++)
{
    string code;do {code="AD-"+new string(Enumerable.Range(0,6).Select(_=>alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)]).ToArray());}while(!codes.Add(code));
    string phone="000"+(1000000+i).ToString("D7");
    if(!phones.Add(phone))throw new InvalidOperationException("Số giả lập đã được dùng; hủy, không sửa lượt cũ.");
    DateTime created=start.AddHours(1).AddTicks((end.AddHours(-2).Ticks-start.AddHours(1).Ticks)*(i-1)/100);
    DateTime submitted=created.AddMinutes(20+i%31);
    var shuffled=questions.OrderBy(_=>RandomNumberGenerator.GetInt32(int.MaxValue)).ToList();
    int desired=questions.Count*(50+i%51)/100;
    var entry=new Entry {Contest=campaign,Code=code,TokenHash=Convert.ToHexString(SHA256.HashData(RandomNumberGenerator.GetBytes(32))).ToLowerInvariant(),IpHash=Convert.ToHexString(SHA256.HashData(RandomNumberGenerator.GetBytes(32))).ToLowerInvariant(),Mode=EntryModes.Named,FullName=$"[TEST] {names[(i-1)%names.Length]} {i:D3}",Phone=phone,Org=$"{batch} — Đơn vị giả lập {(i-1)%10+1:D2}",ConsentAt=created,AttemptNo=1,Status=EntryStatuses.Submitted,CreatedAt=created,SubmittedAt=submitted,Answered=questions.Count,TotalQuestions=questions.Count};
    for(int j=0;j<shuffled.Count;j++)
    {
        var q=shuffled[j];var options=JsonSerializer.Deserialize<string[][]>(q.Options)!;
        string chosen=j<desired?q.Answer:options.First(o=>o[0]!=q.Answer)[0];
        entry.Answers.Add(new EntryAnswer {QuestionCode=q.Code,Topic=q.TopicId,Chosen=chosen,IsCorrect=chosen==q.Answer,AnsweredAt=created.AddTicks((submitted.Ticks-created.Ticks)*(j+1)/(questions.Count+1))});
    }
    entry.Score=entry.Answers.Count(a=>a.IsCorrect);
    entry.SubmissionResultJson=JsonSerializer.Serialize(new SubmitDto(entry.Status,entry.Code,entry.Mode,entry.Score.Value,entry.Answered,questions.Count,true,submitted.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'"),campaign.Topics.Select(t=>new TopicScoreDto(t.TopicId.ToString(),entry.Answers.Count(a=>a.Topic==t.TopicId && a.IsCorrect),questions.Count(q=>q.TopicId==t.TopicId))).ToList()));
    db.Entries.Add(entry);
}
await db.SaveChangesAsync();
if(await db.Entries.CountAsync()!=oldEntries+100 || await db.ContestCampaigns.CountAsync()!=oldContests+1 || await db.EntryAnswers.CountAsync()!=oldAnswers+100*questions.Count || await db.Draws.CountAsync()!=oldDraws)throw new InvalidOperationException("Số lượng ngoài dự kiến; rollback.");
await tx.CommitAsync();
Console.WriteLine(JsonSerializer.Serialize(new {Created=true,ContestId=campaign.Id,Name=name,Entries=100,Questions=questions.Count,Answers=100*questions.Count,Prizes=specs.Length,Backup=backup},json));
