using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

// Chi chay thu cong. Mac dinh chi doc va in ke hoach; chi --apply moi ghi, va chi qua ContestAdminService.
// Tao cac cuoc thi mau co ten that + giai thuong de portal co du lieu hien thi. Khong tao luot thi hay luot quay.
string? Argument(string key) { int index = Array.IndexOf(args, key); return index >= 0 && index + 1 < args.Length ? args[index + 1] : null; }
string path = Path.GetFullPath(Argument("--db") ?? throw new ArgumentException("Cần --db với đường dẫn tới app.sqlite.db đã có."));
if (!File.Exists(path)) throw new FileNotFoundException("CSDL không tồn tại; không tự tạo CSDL mới.", path);
bool apply = args.Contains("--apply");
var json = new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
var vn = TimeSpan.FromHours(7);
DateTime Utc(int y, int m, int d, int h, int mi, int s) => new DateTimeOffset(y, m, d, h, mi, s, vn).UtcDateTime;

var cs = new SqliteConnectionStringBuilder { DataSource = path, Mode = apply ? SqliteOpenMode.ReadWrite : SqliteOpenMode.ReadOnly, Pooling = false, DefaultTimeout = 30 };
await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(cs.ConnectionString).Options);
var service = new ContestAdminService(db, TimeProvider.System);

// Moi thang 2 cuoc thi, lich khong chong nhau (nua dau: ngay 1-15, nua sau: ngay 16-het thang); chuyen de lay theo id trong ngan hang.
const string OctoberName = "Việc làm online và mua bán an toàn";
const string SampleName = "Cuộc thi mẫu (môi trường local)";
string BatchOf(string name) => "DEMO-" + (name == OctoberName ? "THANG-10" : Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(name)))[..8]);
string[] Names(string key) => Argument(key)?.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [];
var entryTargets = Names("--entries-for");
var drawTargets = Names("--draw-publish");
var plan = new (string Name, string Description, DateTime Start, DateTime End, int[] Topics)[] {
    ("Nhận diện cuộc gọi và tin nhắn giả mạo",
     "Kiểm tra khả năng nhận biết cuộc gọi, tin nhắn và đường dẫn giả danh cơ quan, ngân hàng trước khi chuyển tiền.",
     Utc(2026, 7, 1, 0, 0, 0), Utc(2026, 7, 15, 23, 59, 59), [7]),
    ("Dừng lại, tự kiểm tra, hỏi người thân",
     "Ba việc đơn giản giúp bạn quyết định chắc chắn hơn khi bị thúc ép chuyển tiền.",
     Utc(2026, 7, 16, 0, 0, 0), Utc(2026, 7, 31, 23, 59, 59), [1]),
    ("Đầu tư, góp vốn và lời hứa lãi cao",
     "Dấu hiệu của các lời mời đầu tư, góp vốn hứa lãi cao bất thường và cách tự kiểm tra trước khi tham gia.",
     Utc(2026, 8, 1, 0, 0, 0), Utc(2026, 8, 15, 23, 59, 59), [3]),
    ("Xử lý khi đã lỡ chuyển tiền",
     "Việc cần làm ngay khi nghi ngờ bị lừa và cách tránh bị lừa lần hai bởi dịch vụ hứa lấy lại tiền.",
     Utc(2026, 8, 16, 0, 0, 0), Utc(2026, 8, 31, 23, 59, 59), [8]),
    ("Vay nợ và ứng dụng cho vay trực tuyến",
     "Nhận biết bẫy vay nhanh, phí ẩn và việc lộ danh bạ khi cài ứng dụng vay.",
     Utc(2026, 9, 1, 0, 0, 0), Utc(2026, 9, 15, 23, 59, 59), [4]),
    ("Ký hợp đồng và cam kết dịch vụ",
     "Đọc kỹ điều khoản, phụ lục và cam kết trước khi ký hoặc đặt cọc cho một dịch vụ.",
     Utc(2026, 9, 16, 0, 0, 0), Utc(2026, 9, 30, 23, 59, 59), [2]),
    (OctoberName, "Tỉnh táo trước lời mời việc nhẹ lương cao, nhiệm vụ nạp tiền làm cọc và các giao dịch mua bán, đặt cọc qua mạng.",
     Utc(2026, 10, 1, 0, 0, 0), Utc(2026, 10, 31, 23, 59, 59), [5, 6]),
    ("Tự bảo vệ mình và người thân",
     "Tổng hợp các nguyên tắc dừng lại, tự kiểm tra, hỏi người thân và cách xử lý khi đã lỡ chuyển tiền.",
     Utc(2026, 11, 1, 0, 0, 0), Utc(2026, 11, 30, 23, 59, 59), [1, 8]),
    ("Giao dịch cuối năm: Mua sắm, đầu tư và quà tặng",
     "Mùa mua sắm và quà tặng cuối năm: nhận biết khuyến mãi giả, lời mời đầu tư dịp Tết và đường dẫn giả mạo.",
     Utc(2026, 12, 1, 0, 0, 0), Utc(2026, 12, 31, 23, 59, 59), [6, 3, 7]),
};
var prizeSpecs = new (string Code, string Name, string Description, int Quantity, long Money)[] {
    ("GT-DB", "Giải Đặc biệt", "Phần thưởng giá trị cao nhất của cuộc thi.", 1, 5_000_000),
    ("GT-NHAT", "Giải Nhất", "Dành cho thí sinh có thành tích xuất sắc.", 2, 3_000_000),
    ("GT-NHI", "Giải Nhì", "Dành cho thí sinh có thành tích tốt.", 3, 2_000_000),
    ("GT-BA", "Giải Ba", "Dành cho thí sinh đạt yêu cầu về điểm.", 5, 1_000_000),
    ("GT-KK", "Giải Khuyến khích", "Ghi nhận thí sinh tham gia nghiêm túc.", 10, 300_000),
};

// --drop-sample: xoa cuoc thi mau (neu khong co luot thi, luot quay, ket qua cong bo) de nhuong lich. Ghi trong cung lan --apply.
var sample = await db.ContestCampaigns.AsNoTracking().Where(c => c.Name == SampleName).Select(c => new { c.Id }).SingleOrDefaultAsync();
bool dropSample = args.Contains("--drop-sample") && sample is not null;
if (dropSample && (await db.Entries.AnyAsync(e => e.ContestId == sample!.Id) || await db.Draws.AnyAsync(d => d.ContestId == sample!.Id)
    || await db.ContestPublishedResults.AnyAsync(r => r.ContestId == sample!.Id)))
    throw new InvalidOperationException("Cuộc thi mẫu đã có lượt thi, lượt quay hoặc kết quả công bố; không tự xóa.");
var existing = (await db.ContestCampaigns.AsNoTracking().OrderBy(c => c.StartAt).Select(c => new { c.Id, c.Name, c.StartAt, c.EndAt }).ToListAsync())
    .Where(c => !(dropSample && c.Id == sample!.Id)).ToList();
var topics = await db.QuizTopics.AsNoTracking().Where(t => t.IsActive).Include(t => t.Questions).ToDictionaryAsync(t => t.Id);
Console.WriteLine(JsonSerializer.Serialize(new { Database = path, Existing = existing }, json));

var todo = new List<(string Name, string Description, DateTime Start, DateTime End, List<SaveContestTopicRequest> Topics, string Reason)>();
foreach (var p in plan)
{
    string? skip = null;
    if (existing.Any(c => c.Name == p.Name)) skip = "đã có cuộc thi cùng tên";
    else if (existing.FirstOrDefault(c => c.StartAt <= p.End && c.EndAt >= p.Start) is { } clash) skip = $"trùng lịch với cuộc thi #{clash.Id} \"{clash.Name}\"";
    var requests = new List<SaveContestTopicRequest>();
    foreach (int id in p.Topics)
    {
        if (!topics.TryGetValue(id, out var t)) { skip ??= $"ngân hàng không có chuyên đề {id}"; continue; }
        var codes = t.Questions.Where(q => q.IsActive).OrderBy(q => q.SortOrder).ThenBy(q => q.Code).Select(q => q.Code).Take(10).ToList();
        if (codes.Count > 0) requests.Add(new SaveContestTopicRequest(id, codes));
    }
    if (requests.Count == 0) skip ??= "không có câu hỏi";
    Console.WriteLine($"{(skip is null ? "TẠO " : "BỎ  ")} {p.Name} [{p.Start:yyyy-MM-dd} → {p.End:yyyy-MM-dd} UTC] {requests.Sum(r => r.QuestionCodes!.Count)} câu{(skip is null ? "" : " — " + skip)}");
    if (skip is null) todo.Add((p.Name, p.Description, p.Start, p.End, requests, ""));
}
if (!apply) { Console.WriteLine("Chưa ghi gì. Thêm --apply để tạo."); return; }
if (todo.Count == 0 && !dropSample && entryTargets.Length == 0 && drawTargets.Length == 0) { Console.WriteLine("Không có gì để tạo."); return; }

// SQLite online backup gom ca phan da commit trong WAL; copy tho file .db khong an toan khi web dang chay.
string backup = Path.Combine(Path.GetDirectoryName(path)!, "backups", $"before-seed-contests-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}.db");
Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
await using (var source = new SqliteConnection(cs.ConnectionString))
await using (var destination = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = backup, Mode = SqliteOpenMode.ReadWriteCreate, Pooling = false }.ConnectionString))
{ await source.OpenAsync(); await destination.OpenAsync(); source.BackupDatabase(destination); }
Console.WriteLine("Backup: " + backup);

if (dropSample)
{
    var doomed = await db.ContestCampaigns.Include(c => c.Topics).Include(c => c.Questions).Include(c => c.Prizes).SingleAsync(c => c.Id == sample!.Id);
    db.ContestCampaigns.Remove(doomed);
    await db.SaveChangesAsync();
    Console.WriteLine($"Đã xóa cuộc thi mẫu #{sample!.Id}.");
}
var prizeIds = new Dictionary<string, long>();
for (int i = 0; i < prizeSpecs.Length; i++)
{
    var found = await db.Prizes.AsNoTracking().Where(p => p.Code == prizeSpecs[i].Code).Select(p => (long?)p.Id).SingleOrDefaultAsync();
    prizeIds[prizeSpecs[i].Code] = found ?? (await service.SavePrizeAsync(null, new SavePrizeRequest(prizeSpecs[i].Code, prizeSpecs[i].Name, prizeSpecs[i].Description, true, 100 + i), default))!.Id;
}
foreach (var c in todo)
{
    var created = await service.CreateCampaignAsync(new SaveContestCampaignRequest(c.Name, c.Description, c.Start, c.End, 2, true, c.Topics,
        24, 1m, null, null, prizeSpecs.Select(p => new SaveContestPrizeRequest(prizeIds[p.Code], p.Quantity, p.Money)).ToList()), default);
    Console.WriteLine($"Đã tạo cuộc thi #{created.Id}: {created.Name} ({created.QuestionCount} câu, {created.Prizes?.Count ?? 0} loại giải).");
}

// 50 luot thi da nop cho cuoc thang 10 (dang dien ra), diem rai deu; chi chen khi chua co lo nay.
async Task SeedEntriesAsync(string targetName)
{
string Batch = BatchOf(targetName);
long? octId = await db.ContestCampaigns.Where(c => c.Name == targetName).Select(c => (long?)c.Id).SingleOrDefaultAsync();
if (octId is null || await db.Entries.AnyAsync(e => e.Org == Batch)) { Console.WriteLine($"Bỏ qua lượt thi: {targetName}"); return; }
var qs = await db.ContestQuestions.AsNoTracking().Where(q => q.ContestId == octId).OrderBy(q => q.TopicId).ThenBy(q => q.SortOrder).ThenBy(q => q.QuestionCode).ToListAsync();
int total = qs.Count;
if (total < 4) throw new InvalidOperationException("Cuộc thi có quá ít câu để tạo điểm.");
var target = await db.ContestCampaigns.AsNoTracking().SingleAsync(c => c.Id == octId);
DateTime from = DateTime.SpecifyKind(target.StartAt, DateTimeKind.Utc).AddMinutes(30), to = new[] { DateTime.UtcNow.AddMinutes(-5), DateTime.SpecifyKind(target.EndAt, DateTimeKind.Utc).AddMinutes(-30) }.Min();
string[] ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
string[] dem = ["Văn", "Thị", "Minh", "Ngọc", "Quang"];
string[] ten = ["An", "Bình", "Châu", "Dũng", "Giang", "Hà", "Khánh", "Lan", "Nam", "Phúc"];
const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var codesUsed = (await db.Entries.Select(x => x.Code).ToListAsync()).ToHashSet();
var made = new List<Entry>(); var seenNames = new HashSet<string>();
await using (var tx = await db.Database.BeginTransactionAsync())
{
    for (int i = 0; i < 50; i++)
    {
        string name = $"{ho[i % ho.Length]} {dem[i / ho.Length % dem.Length]} {ten[(i * 3 + i / ho.Length) % ten.Length]}";
        if (!seenNames.Add(name)) throw new InvalidOperationException("Tên bị trùng.");
        int score = Math.Clamp((int)Math.Round(total * (0.45 + 0.55 * (49 - i) / 49.0)), 0, total);
        string code; do { code = "AD-" + new string(Enumerable.Range(0, 6).Select(_ => alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)]).ToArray()); } while (!codesUsed.Add(code));
        DateTime createdAt = from.AddTicks((to.Ticks - from.Ticks) * (i + 1) / 51), finishedAt = createdAt.AddMinutes(8);
        var e = new Entry {
            ContestId = octId, Code = code, TokenHash = Convert.ToHexString(SHA256.HashData(RandomNumberGenerator.GetBytes(32))).ToLowerInvariant(),
            Mode = EntryModes.Named, FullName = name, Phone = "0009" + (200001 + i).ToString("D6", CultureInfo.InvariantCulture), Org = Batch,
            ConsentAt = createdAt, AttemptNo = 1, Status = EntryStatuses.Submitted, CreatedAt = createdAt, SubmittedAt = finishedAt,
            Answered = total, Score = score, TotalQuestions = total };
        var order = qs.OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).ToList();
        for (int j = 0; j < order.Count; j++)
        {
            bool ok = j < score;
            string chosen = ok ? order[j].Answer : JsonSerializer.Deserialize<string[][]>(order[j].Options)!.First(o => o[0] != order[j].Answer)[0];
            e.Answers.Add(new EntryAnswer { QuestionCode = order[j].QuestionCode, Topic = order[j].TopicId, Chosen = chosen, IsCorrect = ok,
                AnsweredAt = createdAt.AddTicks((finishedAt.Ticks - createdAt.Ticks) * (j + 1) / (total + 1)) });
        }
        e.SubmissionResultJson = JsonSerializer.Serialize(new SubmitDto(e.Status, e.Code, e.Mode, score, total, total, true,
            finishedAt.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'"),
            qs.GroupBy(q => q.TopicId).Select(g => new TopicScoreDto(g.Key.ToString(), e.Answers.Count(a => a.Topic == g.Key && a.IsCorrect), g.Count())).ToList()));
        made.Add(e); db.Entries.Add(e);
    }
    await db.SaveChangesAsync();
    foreach (var e in made)
        if (await db.EntryAnswers.CountAsync(a => a.EntryId == e.Id) != total || await db.EntryAnswers.CountAsync(a => a.EntryId == e.Id && a.IsCorrect) != e.Score)
            throw new InvalidOperationException($"Điểm không khớp đáp án ở lượt {e.Code}.");
    await tx.CommitAsync();
}
Console.WriteLine($"Đã tạo 50 lượt thi đã nộp cho cuộc #{octId} (điểm {made.Max(e => e.Score)}–{made.Min(e => e.Score)}/{total}).");
}

// Quay so cho tung hang giai roi cong bo ket qua, qua dich vu that. Audit dung khoa tam nen khong doc lai duoc o backoffice (chi mat noi dung loc).
async Task DrawAndPublishAsync(string name)
{
    var contest = await db.ContestCampaigns.AsNoTracking().SingleOrDefaultAsync(c => c.Name == name);
    if (contest is null) { Console.WriteLine($"Bỏ qua quay số: không có cuộc {name}"); return; }
    if (await db.Draws.AnyAsync(d => d.ContestId == contest.Id)) { Console.WriteLine($"Bỏ qua quay số: cuộc #{contest.Id} đã có lượt quay."); return; }
    int total = await db.ContestQuestions.CountAsync(q => q.ContestId == contest.Id);
    int minScore = (int)Math.Ceiling(total * 0.6);
    const string actor = "seed:demo";
    var drawIds = new List<long>();
    foreach (var prize in (await service.ContestPrizesAsync(contest.Id, default)).Where(p => p.Quantity > 0))
        drawIds.Add((await service.CreateDrawAsync(new SaveDrawRequest(minScore, prize.Quantity, true, "Quay số demo", contest.Id, Guid.NewGuid(), prize.PrizeId), actor, default)).Id);
    var results = new ContestResultsService(db, TimeProvider.System, new Umbraco.Plugin.Custom.Core.Administration.ContestAuditService(db, new Microsoft.AspNetCore.DataProtection.EphemeralDataProtectionProvider(), TimeProvider.System));
    var state = await results.SetPublicationAsync(contest.Id, new ResultsPublicationRequest(true, drawIds, 0), Guid.Parse("00000000-0000-4000-8000-0000000000d1"), default);
    Console.WriteLine($"Cuộc #{contest.Id}: {drawIds.Count} lượt quay, công bố = {state?.IsPublished}.");
}

foreach (var name in entryTargets) await SeedEntriesAsync(name);
foreach (var name in drawTargets) await DrawAndPublishAsync(name);
