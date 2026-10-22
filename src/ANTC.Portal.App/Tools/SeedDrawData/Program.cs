using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

// Explicit opt-in only. Never runs at application startup or modifies an existing entry/draw.
string? Argument(string key) { int index = Array.IndexOf(args, key); return index >= 0 && index + 1 < args.Length ? args[index + 1] : null; }
string path = Path.GetFullPath(Argument("--db") ?? throw new ArgumentException("Cần --db với đường dẫn CSDL local đã kiểm tra."));
if (!File.Exists(path)) throw new FileNotFoundException("CSDL không tồn tại; không tự tạo CSDL mới.", path);
bool apply = args.Contains("--apply");
bool verify = args.Contains("--verify");
var cs = new SqliteConnectionStringBuilder { DataSource = path, Mode = apply || verify ? SqliteOpenMode.ReadWrite : SqliteOpenMode.ReadOnly, Pooling = false, DefaultTimeout = 30 };
await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(cs.ConnectionString).Options);
var contests = await db.ContestCampaigns.AsNoTracking().OrderBy(c => c.StartAt).Select(c => new {
    c.Id, c.Name, c.StartAt, c.EndAt, c.IsActive, c.MaxAttempts,
    Questions = c.Questions.Count, Entries = c.Entries.Count,
    Submitted = c.Entries.Count(e => e.Status == EntryStatuses.Submitted), Draws = c.Draws.Count,
}).ToListAsync();
Console.WriteLine(JsonSerializer.Serialize(new { Database = path, Contests = contests }, new JsonSerializerOptions { WriteIndented = true }));
if (!apply)
{
    if (verify)
    {
        long id = long.Parse(Argument("--contest-id") ?? throw new ArgumentException("Cần --contest-id để kiểm tra."));
        var selected = contests.Single(c => c.Id == id);
        var service = new ContestAdminService(db, TimeProvider.System);
        foreach (int minimum in new[] { 0, selected.Questions * 8 / 10, selected.Questions * 9 / 10, selected.Questions }.Distinct())
            Console.WriteLine(JsonSerializer.Serialize(await service.PreviewDrawAsync(new PreviewDrawRequest(id, minimum, true), default)));
        Console.WriteLine(JsonSerializer.Serialize(new {
            ScoreMismatches = await db.Entries.CountAsync(e => e.ContestId == id && e.Status == EntryStatuses.Submitted && e.Score != db.EntryAnswers.Count(a => a.EntryId == e.Id && a.IsCorrect)),
            AnswerCountMismatches = await db.Entries.CountAsync(e => e.ContestId == id && e.Answered != db.EntryAnswers.Count(a => a.EntryId == e.Id)),
            Entries = await db.Entries.CountAsync(e => e.ContestId == id), Answers = await db.EntryAnswers.CountAsync(a => a.Entry!.ContestId == id),
        }));
    }
    return;
}
long contestId = long.Parse(Argument("--contest-id") ?? throw new ArgumentException("Cần --contest-id; chạy không có --apply để xem danh sách trước."));
const string batch = "TEST-QUAY-50-V1";
if (await db.Entries.AnyAsync(e => e.Org == batch)) throw new InvalidOperationException("Đã có lô TEST-QUAY-50-V1. Không tự chèn lặp hoặc xóa dữ liệu cũ.");
var contest = await db.ContestCampaigns.AsNoTracking().SingleAsync(c => c.Id == contestId);
var questions = await db.ContestQuestions.AsNoTracking().Where(q => q.ContestId == contestId).OrderBy(q => q.TopicId).ThenBy(q => q.SortOrder).ThenBy(q => q.QuestionCode).ToListAsync();
if (!contest.IsActive || contest.StartAt >= DateTime.UtcNow || questions.Count < 2)
    throw new InvalidOperationException("Chọn cuộc thi đã bắt đầu, đang sử dụng, có bản chụp ít nhất 2 câu. Không tự sửa lịch hoặc đề thi.");
foreach (var q in questions)
{
    var options = JsonSerializer.Deserialize<string[][]>(q.Options) ?? [];
    if (options.Length < 2 || !options.Any(o => o[0] == q.Answer)) throw new InvalidOperationException("Bản chụp đề không hợp lệ; không sinh đáp án sai cấu trúc.");
}
// SQLite online backup includes committed WAL content; raw .db copying is not safe while the app runs.
string backup = Path.Combine(Path.GetDirectoryName(path)!, "backups", $"before-draw-seed-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}.db");
Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
await using (var source = new SqliteConnection(cs.ConnectionString))
await using (var destination = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = backup, Mode = SqliteOpenMode.ReadWriteCreate, Pooling = false }.ConnectionString))
{ await source.OpenAsync(); await destination.OpenAsync(); source.BackupDatabase(destination); }
Console.WriteLine("Backup: " + backup);

await using var transaction = await db.Database.BeginTransactionAsync();
if (await db.Entries.AnyAsync(e => e.Org == batch)) throw new InvalidOperationException("Lô dữ liệu vừa được người khác chèn; hủy thao tác.");
var oldIds = await db.Entries.AsNoTracking().Select(e => e.Id).ToListAsync();
int originalDraws = await db.Draws.CountAsync();
var existingCodes = (await db.Entries.Select(e => e.Code).ToListAsync()).ToHashSet();
var existingPhones = (await db.Entries.Where(e => e.Phone != null).Select(e => e.Phone!).ToListAsync()).ToHashSet();
// Intentionally unassigned-looking 000... numbers, not real participants' contact information.
var phones = new List<string>();
for (int n = 100001; phones.Count < 50; n++)
{
    string phone = "000" + n.ToString("D7");
    if (!existingPhones.Contains(phone)) phones.Add(phone);
}
DateTime now = DateTime.UtcNow;
DateTime last = new[] { now.AddMinutes(-1), DateTime.SpecifyKind(contest.EndAt, DateTimeKind.Utc).AddSeconds(-1) }.Min();
DateTime start = DateTime.SpecifyKind(contest.StartAt, DateTimeKind.Utc);
if (last <= start.AddSeconds(3)) throw new InvalidOperationException("Khoảng thời gian cuộc thi quá ngắn để tạo lịch sử thử hợp lệ.");
DateTime first = new[] { start.AddSeconds(1), last.AddDays(-7) }.Max();
string[] givenNames = ["Minh Anh", "Hoàng Nam", "Thu Hà", "Đức Huy", "Ngọc Mai", "Tuấn Anh", "Thảo Linh", "Gia Bảo", "Thanh Tâm", "Quang Huy"];
var seeded = new List<Entry>();
for (int i = 1; i <= 50; i++)
{
    bool submitted = i <= 45;
    bool named = i <= 40 || i is >= 46 and <= 48;
    bool second = i is >= 31 and <= 40 && contest.MaxAttempts >= 2;
    int person = second ? i - 30 : i;
    int percent = person <= 10 ? 90 + person - 1 : person <= 20 ? 55 + (person - 11) * 3 : 80 + (person - 21) * 2;
    if (second && person <= 5) percent = Math.Min(100, percent + 5);
    percent = Math.Clamp(percent, 35, 100);
    int total = questions.Count;
    int answered = submitted ? total - (i % 7 == 0 ? Math.Max(1, total / 10) : 0) : Math.Max(1, total * (i - 44) / 12);
    int desiredCorrect = Math.Min(answered, total * percent / 100);
    DateTime createdAt = first.AddTicks((last.Ticks - first.Ticks) * (i - 1) / 51);
    DateTime finishedAt = createdAt.AddTicks((last.Ticks - createdAt.Ticks) / 2);
    string code;
    const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    do { code = "AD-" + new string(Enumerable.Range(0, 6).Select(_ => alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)]).ToArray()); } while (!existingCodes.Add(code));
    var e = new Entry {
        ContestId = contestId, Code = code, TokenHash = Convert.ToHexString(SHA256.HashData(RandomNumberGenerator.GetBytes(32))).ToLowerInvariant(),
        Mode = named ? EntryModes.Named : EntryModes.Anon,
        FullName = named ? $"[TEST] Thí sinh {person:D2} {givenNames[(person - 1) % givenNames.Length]}" : null,
        Phone = named ? phones[(person - 1) % phones.Count] : null,
        // Org is a batch marker only for named entries. Anonymous entries carry no personal fields.
        Org = named ? batch : null, ConsentAt = named ? createdAt : null, AttemptNo = named ? second ? 2 : 1 : null,
        Status = submitted ? EntryStatuses.Submitted : EntryStatuses.InProgress,
        CreatedAt = createdAt, SubmittedAt = submitted ? finishedAt : null,
        Answered = answered, Score = submitted ? desiredCorrect : null, TotalQuestions = submitted ? total : null,
    };
    // Spread correct/incorrect answers across topics, rather than making one topic entirely correct.
    var shuffled = questions.OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).Take(answered).ToList();
    for (int j = 0; j < shuffled.Count; j++)
    {
        var q = shuffled[j]; bool correct = j < desiredCorrect;
        var options = JsonSerializer.Deserialize<string[][]>(q.Options)!;
        string chosen = correct ? q.Answer : options.First(o => o[0] != q.Answer)[0];
        e.Answers.Add(new EntryAnswer { QuestionCode = q.QuestionCode, Topic = q.TopicId, Chosen = chosen, IsCorrect = correct,
            AnsweredAt = createdAt.AddTicks((finishedAt.Ticks - createdAt.Ticks) * (j + 1) / (answered + 1)) });
    }
    if (submitted) e.SubmissionResultJson = JsonSerializer.Serialize(new SubmitDto(e.Status, e.Code, e.Mode, e.Score!.Value, e.Answered, total,
        named, finishedAt.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'"),
        questions.GroupBy(q => q.TopicId).Select(g => new TopicScoreDto(g.Key.ToString(), e.Answers.Count(a => a.Topic == g.Key && a.IsCorrect), g.Count())).ToList()));
    seeded.Add(e); db.Entries.Add(e);
}
await db.SaveChangesAsync();
var ids = seeded.Select(e => e.Id).ToArray();
if (ids.Length != 50 || await db.Entries.CountAsync(e => ids.Contains(e.Id)) != 50) throw new InvalidOperationException("Không đủ đúng 50 lượt.");
foreach (var e in seeded)
{
    int count = await db.EntryAnswers.CountAsync(a => a.EntryId == e.Id);
    int score = await db.EntryAnswers.CountAsync(a => a.EntryId == e.Id && a.IsCorrect);
    if (count != e.Answered || (e.Status == EntryStatuses.Submitted && e.Score != score)) throw new InvalidOperationException("Điểm hoặc số đáp án không khớp.");
}
if (await db.Entries.CountAsync(e => oldIds.Contains(e.Id)) != oldIds.Count || await db.Draws.CountAsync() != originalDraws)
    throw new InvalidOperationException("Dữ liệu cũ hoặc lịch sử quay bị ảnh hưởng; rollback.");
var seededPhones = seeded.Where(e => e.Phone != null).Select(e => e.Phone!).Distinct().ToArray();
if (await db.Entries.Where(e => e.ContestId == contestId && e.Phone != null && seededPhones.Contains(e.Phone))
    .GroupBy(e => e.Phone).AnyAsync(g => g.Count() > contest.MaxAttempts))
    throw new InvalidOperationException("Số lượt trên một điện thoại vượt cấu hình cuộc thi; rollback.");
// Persist a local manifest so anonymous test entries can also be identified precisely later.
string manifest = Path.Combine(Path.GetDirectoryName(path)!, $"{batch}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.json");
await File.WriteAllTextAsync(manifest, JsonSerializer.Serialize(new { Batch = batch, ContestId = contestId, Backup = backup,
    Entries = seeded.Select(e => new { e.Id, e.Code, e.Mode, e.Status, e.Score }) }, new JsonSerializerOptions { WriteIndented = true }));
await transaction.CommitAsync();
var namedSubmitted = seeded.Where(e => e.Status == EntryStatuses.Submitted && e.Phone != null).ToList();
var people = namedSubmitted.GroupBy(e => e.Phone).Select(g => g.OrderByDescending(e => e.Score).ThenBy(e => e.SubmittedAt).ThenBy(e => e.Id).First()).ToList();
Console.WriteLine(JsonSerializer.Serialize(new {
    InsertedEntries = seeded.Count, InsertedAnswers = seeded.Sum(e => e.Answered),
    SubmittedNamed = namedSubmitted.Count, SubmittedAnonymous = seeded.Count(e => e.Status == EntryStatuses.Submitted && e.Phone == null),
    InProgress = seeded.Count(e => e.Status == EntryStatuses.InProgress), UniqueEligiblePhones = people.Count,
    Thresholds = new[] { 0, questions.Count * 8 / 10, questions.Count * 9 / 10, questions.Count }.Distinct().Select(score => new { MinScore = score, EligiblePeople = people.Count(e => e.Score >= score) }),
    ContestId = contestId, ContestName = contest.Name, Manifest = manifest, Backup = backup,
}, new JsonSerializerOptions { WriteIndented = true }));
