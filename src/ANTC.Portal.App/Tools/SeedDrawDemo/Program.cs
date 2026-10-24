using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

// Chi chay thu cong, co chu y. Mac dinh chi doc; chi --apply moi ghi, va chi qua ContestAdminService.
string? Argument(string key) { int index = Array.IndexOf(args, key); return index >= 0 && index + 1 < args.Length ? args[index + 1] : null; }
string path = Path.GetFullPath(Argument("--db") ?? throw new ArgumentException("Cần --db với đường dẫn tuyệt đối tới app.sqlite.db đã có."));
if (!File.Exists(path)) throw new FileNotFoundException("CSDL không tồn tại; không tự tạo CSDL mới.", path);
bool apply = args.Contains("--apply");
bool verify = args.Contains("--verify");
int preDraw = int.Parse(Argument("--predraw") ?? "2", CultureInfo.InvariantCulture);
if (preDraw is < 0 or > 5) throw new ArgumentException("--predraw chỉ nhận giá trị từ 0 đến 5.");

const string batch = "DEMO-QUAY-50";
const string contestName = "[DEMO] Cuộc thi An toàn tài chính tháng 9/2026";
const string drawNote = "Quay trước để demo";
const string actor = "seed:demo";
var vn = TimeSpan.FromHours(7);
var json = new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

// Lich gio Viet Nam -> UTC. --start/--end la gio VN dang ISO, vi du 2026-09-01T00:00:00
DateTime VnToUtc(string text) => DateTime.SpecifyKind(DateTime.Parse(text, CultureInfo.InvariantCulture, DateTimeStyles.None) - vn, DateTimeKind.Utc);
DateTime startUtc = Argument("--start") is { } s ? VnToUtc(s) : new DateTimeOffset(2026, 9, 1, 0, 0, 0, vn).UtcDateTime;
DateTime endUtc = Argument("--end") is { } e0 ? VnToUtc(e0) : new DateTimeOffset(2026, 9, 30, 23, 59, 59, vn).UtcDateTime;
const int graceHours = 24;

// Khong --apply: mo ReadOnly. --verify cung ReadOnly nen khong goi PreviewDrawAsync (dich vu do mo transaction ghi).
var cs = new SqliteConnectionStringBuilder { DataSource = path, Mode = apply ? SqliteOpenMode.ReadWrite : SqliteOpenMode.ReadOnly, Pooling = false, DefaultTimeout = 30 };
await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(cs.ConnectionString).Options);
var service = new ContestAdminService(db, TimeProvider.System);

async Task<object> ListContestsAsync() => new { Database = path, Contests = await db.ContestCampaigns.AsNoTracking().OrderBy(c => c.StartAt).Select(c => new {
    c.Id, c.Name, c.StartAt, c.EndAt, c.IsActive, c.MaxAttempts, Questions = c.Questions.Count, Entries = c.Entries.Count,
    Submitted = c.Entries.Count(e => e.Status == EntryStatuses.Submitted), Draws = c.Draws.Count }).ToListAsync() };
Console.WriteLine(JsonSerializer.Serialize(await ListContestsAsync(), json));

if (!apply)
{
    if (verify) await VerifyAsync();
    return;
}

// ---- Kiem tra truoc khi ghi ----
var existing = await db.ContestCampaigns.AsNoTracking().Where(c => c.Name == contestName).SingleOrDefaultAsync();
bool batchExists = await db.Entries.AnyAsync(e => e.Org == batch);
if (batchExists && existing is null) throw new InvalidOperationException("Đã có lượt thi dấu lô DEMO-QUAY-50 nhưng không thấy cuộc thi demo; dừng để người kiểm tra.");
if (existing is not null) { startUtc = DateTime.SpecifyKind(existing.StartAt, DateTimeKind.Utc); endUtc = DateTime.SpecifyKind(existing.EndAt, DateTimeKind.Utc); }
int grace = existing?.SubmitGraceHours ?? graceHours;
if (endUtc.AddHours(grace) > DateTime.UtcNow)
    throw new InvalidOperationException("Cuộc thi chưa kết thúc (EndAt + SubmitGraceHours > bây giờ) nên /quay-so sẽ không hiện. Chọn --start/--end ở quá khứ.");

// Dung de cuoc thi tu cac chuyen de va cau dang dung, sap theo cach cua AppDbInitializer.SeedSampleContestAsync
var topics = await db.QuizTopics.AsNoTracking().Where(t => t.IsActive).Include(t => t.Questions).OrderBy(t => t.Id).ToListAsync();
var topicRequests = new List<SaveContestTopicRequest>();
foreach (var topic in topics)
{
    var codes = topic.Questions.Where(q => q.IsActive).OrderBy(q => q.SortOrder).ThenBy(q => q.Code).Select(q => q.Code).ToList();
    if (codes.Count > 0) topicRequests.Add(new SaveContestTopicRequest(topic.Id, codes));
}
int plannedQuestions = existing is null ? topicRequests.Sum(t => t.QuestionCodes!.Count) : await db.ContestQuestions.CountAsync(q => q.ContestId == existing.Id);
if (plannedQuestions < 50) throw new InvalidOperationException($"Cuộc thi chỉ có {plannedQuestions} câu; cần ít nhất 50 câu để có 50 điểm khác nhau.");

// SQLite online backup gom ca phan da commit trong WAL; copy tho file .db khong an toan khi web dang chay.
string backup = Path.Combine(Path.GetDirectoryName(path)!, "backups", $"before-draw-demo-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}.db");
Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
await using (var source = new SqliteConnection(cs.ConnectionString))
await using (var destination = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = backup, Mode = SqliteOpenMode.ReadWriteCreate, Pooling = false }.ConnectionString))
{ await source.OpenAsync(); await destination.OpenAsync(); source.BackupDatabase(destination); }
Console.WriteLine("Backup: " + backup);

try
{
    // 1) Danh muc giai: dung lai ma da co
    var prizeSpecs = new (string Code, string Name, int Quantity, long Money)[] {
        ("DEMO-NHAT", "Giải Nhất", 1, 5_000_000), ("DEMO-NHI", "Giải Nhì", 2, 3_000_000),
        ("DEMO-BA", "Giải Ba", 3, 2_000_000), ("DEMO-KK", "Giải Khuyến khích", 5, 500_000) };
    var prizeIds = new Dictionary<string, long>();
    for (int i = 0; i < prizeSpecs.Length; i++)
    {
        var found = await db.Prizes.AsNoTracking().Where(p => p.Code == prizeSpecs[i].Code).Select(p => (long?)p.Id).SingleOrDefaultAsync();
        prizeIds[prizeSpecs[i].Code] = found ?? (await service.SavePrizeAsync(null, new SavePrizeRequest(prizeSpecs[i].Code, prizeSpecs[i].Name, "Giải dữ liệu demo.", true, i), default))!.Id;
    }

    // 2) Cuoc thi
    long contestId;
    if (existing is not null) contestId = existing.Id;
    else
    {
        var created = await service.CreateCampaignAsync(new SaveContestCampaignRequest(contestName,
            "Dữ liệu demo cho màn quay số: 50 lượt thi giả, không phải cuộc thi thật.", startUtc, endUtc, 2, true, topicRequests,
            graceHours, 1m, null, null, prizeSpecs.Select(p => new SaveContestPrizeRequest(prizeIds[p.Code], p.Quantity, p.Money)).ToList()), default);
        contestId = created.Id;
        Console.WriteLine($"Đã tạo cuộc thi #{contestId}: {created.QuestionCount} câu.");
    }
    var contest = await db.ContestCampaigns.AsNoTracking().SingleAsync(c => c.Id == contestId);

    // 3) 50 luot thi trong mot transaction rieng
    var questions = await db.ContestQuestions.AsNoTracking().Where(q => q.ContestId == contestId).OrderBy(q => q.TopicId).ThenBy(q => q.SortOrder).ThenBy(q => q.QuestionCode).ToListAsync();
    int total = questions.Count;
    if (total < 50) throw new InvalidOperationException($"Cuộc thi có {total} câu, ít hơn 50.");
    foreach (var q in questions)
    {
        var options = JsonSerializer.Deserialize<string[][]>(q.Options) ?? [];
        if (options.Length < 2 || !options.Any(o => o[0] == q.Answer)) throw new InvalidOperationException($"Câu {q.QuestionCode} có cấu trúc đáp án không hợp lệ.");
    }
    if (!await db.Entries.AnyAsync(e => e.Org == batch))
    {
        // 50 muc diem khac nhau, giam dan tu ~98% Q xuong ~40% Q (ha thap can duoi neu Q nho de du cho trong)
        int hi = (int)Math.Round(total * 0.98), lo = Math.Min((int)Math.Round(total * 0.40), hi - 49);
        var scores = Enumerable.Range(0, 50).Select(i => hi - (int)Math.Round(i * (hi - lo) / 49.0)).ToArray();
        if (scores.Distinct().Count() != 50 || scores.Any(v => v < 0 || v > total)) throw new InvalidOperationException("Không sinh được 50 mức điểm khác nhau.");

        await using var transaction = await db.Database.BeginTransactionAsync();
        var existingCodes = (await db.Entries.Select(x => x.Code).ToListAsync()).ToHashSet();
        var existingPhones = (await db.Entries.Where(x => x.Phone != null).Select(x => x.Phone!).ToListAsync()).ToHashSet();
        DateTime last = new[] { DateTime.UtcNow.AddMinutes(-1), endUtc.AddSeconds(-1) }.Min(), first = startUtc.AddSeconds(1);
        if (last <= first.AddSeconds(3)) throw new InvalidOperationException("Khoảng thời gian cuộc thi quá ngắn để tạo lịch sử hợp lệ.");
        string[] ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
        string[] dem = ["Văn", "Thị", "Minh", "Ngọc", "Quang"];
        string[] ten = ["An", "Bình", "Châu", "Dũng", "Giang", "Hà", "Khánh", "Lan", "Nam", "Phúc"];
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var names = new HashSet<string>(); var seeded = new List<Entry>(); int phoneSeq = 100001;
        for (int i = 0; i < 50; i++)
        {
            // (i % 10, i / 10) xac dinh duy nhat cap ho + dem nen ten khong trung
            string fullName = $"[DEMO] {ho[i % ho.Length]} {dem[i / ho.Length % dem.Length]} {ten[(i * 3 + i / ho.Length) % ten.Length]}";
            if (!names.Add(fullName)) throw new InvalidOperationException("Tên giả bị trùng.");
            string phone; do { phone = "0009" + (phoneSeq++).ToString("D6", CultureInfo.InvariantCulture); } while (existingPhones.Contains(phone));
            existingPhones.Add(phone);
            string code; do { code = "AD-" + new string(Enumerable.Range(0, 6).Select(_ => alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)]).ToArray()); } while (!existingCodes.Add(code));
            DateTime createdAt = first.AddTicks((last.Ticks - first.Ticks) * (i + 1) / 51);
            DateTime finishedAt = createdAt.AddTicks((last.Ticks - createdAt.Ticks) / 2);
            var entry = new Entry {
                ContestId = contestId, Code = code, TokenHash = Convert.ToHexString(SHA256.HashData(RandomNumberGenerator.GetBytes(32))).ToLowerInvariant(),
                Mode = EntryModes.Named, FullName = fullName, Phone = phone, Org = batch, ConsentAt = createdAt, AttemptNo = 1,
                Status = EntryStatuses.Submitted, CreatedAt = createdAt, SubmittedAt = finishedAt, Answered = total, Score = scores[i], TotalQuestions = total,
            };
            // Cau dung rai ngau nhien giua cac chuyen de: xao tron toan bo roi lay scores[i] cau dau lam cau dung
            var shuffled = questions.OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).ToList();
            for (int j = 0; j < shuffled.Count; j++)
            {
                var q = shuffled[j]; bool correct = j < scores[i];
                string chosen = correct ? q.Answer : JsonSerializer.Deserialize<string[][]>(q.Options)!.First(o => o[0] != q.Answer)[0];
                entry.Answers.Add(new EntryAnswer { QuestionCode = q.QuestionCode, Topic = q.TopicId, Chosen = chosen, IsCorrect = correct,
                    AnsweredAt = createdAt.AddTicks((finishedAt.Ticks - createdAt.Ticks) * (j + 1) / (total + 1)) });
            }
            entry.SubmissionResultJson = JsonSerializer.Serialize(new SubmitDto(entry.Status, entry.Code, entry.Mode, scores[i], total, total, true,
                finishedAt.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'"),
                questions.GroupBy(q => q.TopicId).Select(g => new TopicScoreDto(g.Key.ToString(), entry.Answers.Count(a => a.Topic == g.Key && a.IsCorrect), g.Count())).ToList()));
            seeded.Add(entry); db.Entries.Add(entry);
        }
        await db.SaveChangesAsync();
        // Kiem tra truoc commit
        var ids = seeded.Select(x => x.Id).ToArray();
        if (ids.Length != 50 || await db.Entries.CountAsync(x => x.ContestId == contestId && x.Org == batch) != 50) throw new InvalidOperationException("Không đủ đúng 50 lượt.");
        foreach (var entry in seeded)
        {
            int count = await db.EntryAnswers.CountAsync(a => a.EntryId == entry.Id);
            int correct = await db.EntryAnswers.CountAsync(a => a.EntryId == entry.Id && a.IsCorrect);
            if (count != entry.Answered || entry.Score != correct) throw new InvalidOperationException($"Điểm hoặc số đáp án không khớp ở lượt {entry.Code}.");
        }
        if (seeded.Select(x => x.Score).Distinct().Count() != 50) throw new InvalidOperationException("Không đủ 50 điểm khác nhau.");
        await transaction.CommitAsync();
        Console.WriteLine($"Đã tạo 50 lượt thi (điểm {scores.Max()}–{scores.Min()}/{total}).");
    }

    // 4) Quay truoc: chi quay phan con thieu
    int done = await db.Draws.CountAsync(d => d.ContestId == contestId && d.Note == drawNote);
    if (done < preDraw)
    {
        int minScore = (int)Math.Round(total * 0.60);
        long kk = prizeIds["DEMO-KK"];
        for (int k = done; k < preDraw; k++)
        {
            var draw = await service.CreateDrawAsync(new SaveDrawRequest(minScore, 1, true, drawNote, contestId, Guid.NewGuid(), kk), actor, default);
            Console.WriteLine($"Đã quay lần #{draw.Id}: {string.Join(", ", draw.Winners.Select(w => ContestResultsService.MaskName(w.FullName)))}");
        }
    }

    // Manifest va tom tat
    var entriesOut = await db.Entries.AsNoTracking().Where(x => x.ContestId == contestId && x.Org == batch).OrderBy(x => x.Id).Select(x => new { x.Id, x.Code, x.Score }).ToListAsync();
    var draws = await db.Draws.AsNoTracking().Include(d => d.Winners).Where(d => d.ContestId == contestId && d.Note == drawNote).OrderBy(d => d.Id).ToListAsync();
    var prizeRows = await service.ContestPrizesAsync(contestId, default);
    string manifest = Path.Combine(Path.GetDirectoryName(path)!, $"{batch}-demo-{DateTime.UtcNow:yyyyMMdd-HHmmss}.json");
    await File.WriteAllTextAsync(manifest, JsonSerializer.Serialize(new {
        Batch = batch, ContestId = contestId, PrizeIds = prizeIds, Entries = entriesOut, DrawIds = draws.Select(d => d.Id), Backup = backup }, json));
    Console.WriteLine(JsonSerializer.Serialize(new {
        ContestId = contestId, ContestName = contest.Name, Questions = total,
        HighestScore = entriesOut.Max(x => x.Score), LowestScore = entriesOut.Min(x => x.Score),
        Prizes = prizeRows.Select(p => new { p.Code, p.Name, Slots = p.Quantity, p.Awarded, p.Remaining }),
        Winners = draws.SelectMany(d => d.Winners.Select(w => new { DrawId = d.Id, d.PrizeName, w.Rank, Name = ContestResultsService.MaskName(w.FullName), Phone = ContestResultsService.MaskPhone(w.Phone), w.Score })),
        Manifest = manifest, Backup = backup }, json));
}
catch (ContestAdminConflictException ex) when (ex.Code == "CONTEST_TIME_OVERLAP")
{
    Console.Error.WriteLine("Lịch trùng với cuộc thi khác: " + ex.Message + " Hãy chạy lại với --start/--end khác (giờ Việt Nam, ISO). Bản sao lưu: " + backup);
    Environment.ExitCode = 2;
}
catch (ContestAdminConflictException ex) { Console.Error.WriteLine($"Dừng: [{ex.Code}] {ex.Message} Bản sao lưu: {backup}"); Environment.ExitCode = 2; }
catch (ContestAdminValidationException ex) { Console.Error.WriteLine("Dừng: dữ liệu không hợp lệ: " + string.Join("; ", ex.Fields.Select(f => f.Key + " = " + f.Value)) + " Bản sao lưu: " + backup); Environment.ExitCode = 2; }

// ---- --verify: chi doc ----
async Task VerifyAsync()
{
    long? id = Argument("--contest-id") is { } text ? long.Parse(text, CultureInfo.InvariantCulture) : await db.ContestCampaigns.Where(c => c.Name == contestName).Select(c => (long?)c.Id).SingleOrDefaultAsync();
    if (id is null) { Console.WriteLine("Chưa có cuộc thi demo (hoặc truyền --contest-id)."); return; }
    var scores = await db.Entries.Where(e => e.ContestId == id && e.Status == EntryStatuses.Submitted && e.Score != null).Select(e => e.Score!.Value).ToListAsync();
    int q = await db.ContestQuestions.CountAsync(x => x.ContestId == id);
    Console.WriteLine(JsonSerializer.Serialize(new {
        ContestId = id, Questions = q, Entries = await db.Entries.CountAsync(e => e.ContestId == id), DemoEntries = await db.Entries.CountAsync(e => e.ContestId == id && e.Org == batch),
        DistinctScores = scores.Distinct().Count(), ScoreDistribution = scores.GroupBy(v => v).OrderByDescending(g => g.Key).Select(g => new { Score = g.Key, Count = g.Count() }),
        ScoreMismatches = await db.Entries.CountAsync(e => e.ContestId == id && e.Status == EntryStatuses.Submitted && e.Score != db.EntryAnswers.Count(a => a.EntryId == e.Id && a.IsCorrect)),
        AnswerCountMismatches = await db.Entries.CountAsync(e => e.ContestId == id && e.Answered != db.EntryAnswers.Count(a => a.EntryId == e.Id)),
    }, json));
    foreach (int minimum in new[] { 0, q * 6 / 10, q * 8 / 10, q * 9 / 10, q }.Distinct())
        Console.WriteLine($"Ngưỡng {minimum}: {(await service.EligibleCandidatesAsync(id.Value, minimum, true, default)).Count} người đủ điều kiện (đã loại người trúng).");
    Console.WriteLine(JsonSerializer.Serialize((await service.ContestPrizesAsync(id.Value, default)).Select(p => new { p.Code, p.Name, Slots = p.Quantity, p.Awarded, p.Remaining }), json));
}
