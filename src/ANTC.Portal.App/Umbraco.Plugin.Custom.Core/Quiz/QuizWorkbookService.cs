using System.Data;
using System.Globalization;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Quiz;

public sealed class QuizWorkbookService(AppDbContext db, IQuestionBank bank, TimeProvider clock,
    IHostEnvironment environment, QuizWorkbookPreviews previews)
{
    public const int MaxFileBytes = 5 * 1024 * 1024;
    public const string ConfirmationPhrase = "XÁC NHẬN NHẬP NGÂN HÀNG";
    public static readonly string[] TopicHeaders = ["Số chuyên đề", "Tên", "Giới thiệu", "Thuật ngữ"];
    public static readonly string[] QuestionHeaders = ["Số chuyên đề", "Mã câu", "Loại câu", "Tình huống", "Câu hỏi",
        "Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D", "Đáp án đúng", "Giải thích A", "Giải thích B",
        "Giải thích C", "Giải thích D", "Hành động an toàn", "Thời gian đọc (giây)", "Thứ tự Thử sức",
        "Nhãn Thử sức", "Thứ tự hiển thị"];
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private string Archive(long id) => Path.Combine(environment.ContentRootPath, "App_Data", "imports", $"{id}.xlsx");
    private DateTime Now => clock.GetUtcNow().UtcDateTime;
    private sealed record TopicRow(int Row, int Id, string[] Values);
    private sealed record QuestionRow(int Row, int TopicId, string Code, string[] Values);
    private sealed record Matrix(List<TopicRow> Topics, List<QuestionRow> Questions, List<WorkbookError> Errors);

    public async Task<byte[]> ExportAsync(bool template, CancellationToken ct)
    {
        using var workbook = new XLWorkbook();
        var topics = workbook.AddWorksheet("ChuyenDe");
        var questions = workbook.AddWorksheet("CauHoi");
        WriteRow(topics, 1, TopicHeaders); WriteRow(questions, 1, QuestionHeaders);
        if (template)
        {
            WriteRow(topics, 2, ["1", "Chuyên đề mẫu", "Đoạn giới thiệu thứ nhất\nĐoạn giới thiệu thứ hai", "Thuật ngữ | Giải nghĩa"]);
            WriteRow(questions, 2, ["1", "MAU-001", "Đúng – Sai", "", "Có nên chia sẻ mã OTP cho người khác?", "Đúng", "Sai", "", "", "B",
                "Không chia sẻ mã OTP.", "Chính xác, hãy giữ bí mật mã OTP.", "", "", "Giữ bí mật mã OTP.", "10", "", "", "1"]);
        }
        else
        {
            int row = 2;
            foreach (var topic in await db.QuizTopics.AsNoTracking().OrderBy(t => t.Id).ToListAsync(ct))
                WriteRow(topics, row++, TopicValues(topic));
            row = 2;
            // Inactive questions stay inactive when this export is imported unchanged.
            foreach (var question in await db.QuizQuestions.AsNoTracking().Where(q => q.IsActive).OrderBy(q => q.TopicId).ThenBy(q => q.SortOrder).ThenBy(q => q.Code).ToListAsync(ct))
                WriteRow(questions, row++, QuestionValues(question));
        }
        foreach (var sheet in workbook.Worksheets)
        {
            sheet.SheetView.FreezeRows(1);
            var range = sheet.RangeUsed()!;
            range.Style.Alignment.WrapText = true;
            sheet.Row(1).Style.Font.Bold = true;
            sheet.Row(1).Style.Fill.BackgroundColor = XLColor.FromHtml("#eef2ff");
            sheet.Columns(1, range.ColumnCount()).Width = 28;
            range.SetAutoFilter();
        }
        using var output = new MemoryStream(); workbook.SaveAs(output); return output.ToArray();
    }

    public async Task<WorkbookPreview> PreviewAsync(byte[] bytes, string fileName, string actor, CancellationToken ct)
    {
        ValidateFile(bytes, fileName);
        Matrix matrix = Read(bytes);
        var topics = await db.QuizTopics.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct);
        var questions = await db.QuizQuestions.AsNoTracking().OrderBy(x => x.Code).ToListAsync(ct);
        Validate(matrix, topics);
        if (matrix.Errors.Count > 0) return new(null, matrix.Errors, 0, 0, 0, [], [], [], false, 0, null);
        var preview = await CompareAsync(matrix, topics, questions, ct);
        string fingerprint = await FingerprintAsync(topics, questions, ct);
        string id = previews.Add(new(actor, SafeName(fileName), bytes.ToArray(), fingerprint));
        return preview with { PreviewId = id };
    }

    public async Task<WorkbookImportHistory> ConfirmAsync(ConfirmWorkbookRequest request, string actor, CancellationToken ct)
    {
        PendingWorkbook pending = previews.Get(request.PreviewId, actor);
        string? archive = null; bool committed = false, archiveCreated = false;
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var topics = await db.QuizTopics.OrderBy(x => x.Id).ToListAsync(ct);
            var questions = await db.QuizQuestions.OrderBy(x => x.Code).ToListAsync(ct);
            var topicById = topics.ToDictionary(x => x.Id);
            var questionByCode = questions.ToDictionary(x => x.Code);
            if (await FingerprintAsync(topics, questions, ct) != pending.Fingerprint)
                throw new QuizAdminConflictException("BANK_CHANGED", "Ngân hàng đã thay đổi sau khi xem trước. Hãy kiểm tra lại file để tránh ghi đè dữ liệu mới.");
            Matrix matrix = Read(pending.Bytes); Validate(matrix, topics);
            if (matrix.Errors.Count > 0) throw new QuizAdminConflictException("BANK_CHANGED", "Dữ liệu không còn hợp lệ. Hãy kiểm tra lại file.");
            WorkbookPreview plan = await CompareAsync(matrix, topics, questions, ct);
            var changedTopics = plan.Topics.Select(x => x.Code).ToHashSet();
            var changedQuestions = plan.Questions.Select(x => x.Code).ToHashSet();
            if (plan.DuringContest && request.Confirmation != ConfirmationPhrase)
                throw new QuizAdminConflictException("IMPORT_CONFIRMATION_REQUIRED", $"{plan.Warning} Gõ chính xác: {ConfirmationPhrase}");
            DateTime now = Now;
            foreach (TopicRow row in matrix.Topics)
            {
                var entity = topicById.GetValueOrDefault(row.Id);
                if (entity is null) { entity = new QuizTopic { Id = row.Id }; db.QuizTopics.Add(entity); }
                else if (!changedTopics.Contains(row.Id.ToString(CultureInfo.InvariantCulture))) continue;
                else entity.Revision++;
                entity.Title = row.Values[1];
                entity.Intro = JsonSerializer.Serialize(Lines(row.Values[2]), Json);
                entity.Terms = JsonSerializer.Serialize(Terms(row.Values[3]), Json);
                entity.UpdatedAt = now;
            }
            var codes = matrix.Questions.Select(x => x.Code).ToHashSet(StringComparer.Ordinal);
            foreach (QuestionRow row in matrix.Questions)
            {
                var entity = questionByCode.GetValueOrDefault(row.Code);
                if (entity is null) { entity = new QuizQuestion { Code = row.Code }; db.QuizQuestions.Add(entity); }
                else if (changedQuestions.Contains(row.Code)) entity.Revision++;
                Apply(entity, row.Values); entity.IsActive = true;
                if (changedQuestions.Contains(row.Code)) entity.UpdatedAt = now;
            }
            foreach (var q in questions.Where(x => x.IsActive && !codes.Contains(x.Code)))
            { q.IsActive = false; q.SampleOrder = null; q.SampleLabel = null; q.Revision++; q.UpdatedAt = now; }
            var import = new QuizImport { CreatedAt = now, CreatedBy = actor[..Math.Min(actor.Length, 100)], FileName = pending.FileName,
                Added = plan.Added, Updated = plan.Updated, Deactivated = plan.Deactivated, DuringContest = plan.DuringContest };
            db.QuizImports.Add(import);
            await db.SaveChangesAsync(ct);
            archive = Archive(import.Id);
            Directory.CreateDirectory(Path.GetDirectoryName(archive)!);
            // CreateNew: never overwrite another import's evidence. Rollback removes this file on failure.
            await using (var file = new FileStream(archive, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            { archiveCreated = true; await file.WriteAsync(pending.Bytes, ct); }
            await transaction.CommitAsync(ct); committed = true;
            previews.Remove(request.PreviewId);
            bank.Reload(); // Existing contest snapshots and entry_answer correctness are intentionally untouched.
            return History(import);
        }
        catch
        {
            if (!committed)
            {
                await transaction.RollbackAsync(CancellationToken.None);
                db.ChangeTracker.Clear();
                if (archiveCreated && archive is not null && File.Exists(archive)) File.Delete(archive);
            }
            throw;
        }
    }

    public async Task<PagedResult<WorkbookImportHistory>> HistoryAsync(int page, CancellationToken ct, int pageSize = 50)
    {
        page = Math.Max(1, page); int size = Math.Clamp(pageSize, 1, 100);
        // CRUD uses quiz_import too, but is not an Excel import and has no source workbook.
        var query = db.QuizImports.AsNoTracking().Where(x => !x.FileName.StartsWith("backoffice:"));
        int count = await query.CountAsync(ct);
        page = Math.Clamp(page, 1, Math.Max(1, (int)Math.Ceiling(count / (double)size)));
        var list = await query.OrderByDescending(x => x.Id).Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new(list.Select(History).ToList(), page, size, count, (int)Math.Ceiling(count / (double)size));
    }
    public async Task<(byte[] Bytes, string Name)?> DownloadAsync(long id, CancellationToken ct)
    {
        var import = await db.QuizImports.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (import is null || !File.Exists(Archive(id))) return null;
        return (await File.ReadAllBytesAsync(Archive(id), ct), import.FileName);
    }
    private WorkbookImportHistory History(QuizImport item) => new(item.Id, item.CreatedAt, item.CreatedBy, item.FileName,
        item.Added, item.Updated, item.Deactivated, item.DuringContest, File.Exists(Archive(item.Id)));

    private async Task<WorkbookPreview> CompareAsync(Matrix matrix, List<QuizTopic> topics, List<QuizQuestion> questions, CancellationToken ct)
    {
        var changes = new List<WorkbookChange>(); int added = 0, updated = 0;
        var questionByCode = questions.ToDictionary(x => x.Code);
        var topicById = topics.ToDictionary(x => x.Id);
        foreach (var row in matrix.Questions)
        {
            var existing = questionByCode.GetValueOrDefault(row.Code);
            var columns = existing is null ? QuestionHeaders.ToList() : Changed(QuestionValues(existing), row.Values, QuestionHeaders);
            if (existing is null) added++;
            else { if (!existing.IsActive) columns.Add("Trạng thái (kích hoạt lại)"); if (columns.Count > 0) updated++; }
            if (columns.Count > 0) changes.Add(new(row.Code, columns));
        }
        var topicChanges = new List<WorkbookChange>();
        foreach (var row in matrix.Topics)
        {
            var existing = topicById.GetValueOrDefault(row.Id);
            var columns = existing is null ? TopicHeaders.ToList() : Changed(TopicValues(existing), row.Values, TopicHeaders);
            if (columns.Count > 0) topicChanges.Add(new(row.Id.ToString(CultureInfo.InvariantCulture), columns));
        }
        var codes = matrix.Questions.Select(q => q.Code).ToHashSet();
        var removed = questions.Where(q => q.IsActive && !codes.Contains(q.Code)).Select(q => q.Code).ToList();
        DateTime now = Now;
        var open = db.ContestCampaigns.Where(x => x.IsActive && x.StartAt <= now && x.EndAt >= now);
        bool during = await open.AnyAsync(ct);
        int inProgress = await db.Entries.CountAsync(x => x.Status == EntryStatuses.InProgress && open.Any(c => c.Id == x.ContestId), ct);
        string? warning = during ? $"Đang có {inProgress} lượt thi dở. Sửa đáp án hoặc ngừng dùng câu hỏi lúc này làm các lượt thi không còn cùng một đề. Hệ thống giữ nguyên bản chụp đề và kết quả đã lưu của các lượt thi cũ; ngân hàng mới dùng cho luyện tập và lần cấu hình cuộc thi tiếp theo." : null;
        return new(null, [], added, updated, removed.Count, changes, removed, topicChanges, during, inProgress, warning);
    }

    private async Task<string> FingerprintAsync(List<QuizTopic> topics, List<QuizQuestion> questions, CancellationToken ct)
    {
        long version = await db.QuizImports.Select(x => (long?)x.Id).MaxAsync(ct) ?? 0;
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new {
            version, topics = topics.Select(t => new { values = TopicValues(t), t.Revision, t.IsActive }),
            questions = questions.Select(q => new { values = QuestionValues(q), q.Revision, q.IsActive }) }, Json))));
    }
    private static void ValidateFile(byte[] bytes, string name)
    {
        if (!name.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase)) throw Invalid("Chỉ nhận tệp .xlsx.");
        if (bytes.Length == 0 || bytes.Length > MaxFileBytes) throw Invalid("Tệp phải có nội dung và không vượt quá 5 MB.");
        try
        {
            using var zip = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read);
            if (zip.Entries.Count > 1000 || zip.Entries.Any(e => e.Length > 64 * 1024 * 1024) || zip.Entries.Sum(e => e.Length) > 64 * 1024 * 1024 ||
                zip.Entries.Any(e => e.FullName.Contains("vbaProject", StringComparison.OrdinalIgnoreCase)) ||
                zip.GetEntry("xl/workbook.xml") is null) throw Invalid("Cấu trúc Excel không hợp lệ hoặc vượt giới hạn giải nén 64 MB.");
        }
        catch (InvalidDataException) { throw Invalid("Tệp không phải là tệp Excel .xlsx hợp lệ."); }
    }
    private static Matrix Read(byte[] bytes)
    {
        var result = new Matrix([], [], []);
        try
        {
            using var workbook = new XLWorkbook(new MemoryStream(bytes));
            foreach (var (name, headers) in new[] { ("ChuyenDe", TopicHeaders), ("CauHoi", QuestionHeaders) })
            {
                if (!workbook.TryGetWorksheet(name, out var sheet)) { result.Errors.Add(new(name, 1, "", "Thiếu sheet bắt buộc.")); continue; }
                int last = sheet.LastRowUsed(XLCellsUsedOptions.Contents)?.RowNumber() ?? 1;
                if (last > 10001) { result.Errors.Add(new(name, last, "", "Mỗi sheet tối đa 10.000 dòng dữ liệu.")); continue; }
                int lastColumn = sheet.LastColumnUsed(XLCellsUsedOptions.Contents)?.ColumnNumber() ?? 0;
                if (lastColumn > 100) { result.Errors.Add(new(name, 1, "", "Sheet có quá nhiều cột; hãy dùng đúng file mẫu.")); continue; }
                var positions = new Dictionary<string, int>();
                for (int col = 1; col <= lastColumn; col++)
                {
                    string heading = sheet.Cell(1, col).HasFormula ? "" : sheet.Cell(1, col).GetString().Trim();
                    if (!positions.TryAdd(heading, col)) result.Errors.Add(new(name, 1, heading, "Tên cột bị trùng."));
                }
                foreach (string header in headers.Where(h => !positions.ContainsKey(h))) result.Errors.Add(new(name, 1, header, "Thiếu cột bắt buộc."));
                if (headers.Any(h => !positions.ContainsKey(h))) continue;
                for (int row = 2; row <= last; row++)
                {
                    foreach (var header in headers.Where(h => sheet.Cell(row, positions[h]).HasFormula))
                        result.Errors.Add(new(name, row, header, "Không nhận công thức; hãy dán giá trị thuần vào ô."));
                    string[] values = headers.Select(h => sheet.Cell(row, positions[h]).HasFormula ? "" : sheet.Cell(row, positions[h]).GetString().Replace("\r\n", "\n").Trim()).ToArray();
                    if (values.All(string.IsNullOrEmpty)) continue;
                    int.TryParse(values[0], NumberStyles.None, CultureInfo.InvariantCulture, out int id);
                    values[0] = id.ToString(CultureInfo.InvariantCulture);
                    if (name == "ChuyenDe")
                    {
                        values[2] = string.Join('\n', Lines(values[2]));
                        values[3] = string.Join('\n', Terms(values[3]).Select(t => string.Join(" | ", t)));
                        result.Topics.Add(new(row, id, values));
                    }
                    else
                    {
                        values[1] = values[1].ToUpperInvariant(); values[9] = values[9].ToUpperInvariant();
                        result.Questions.Add(new(row, id, values[1], values));
                    }
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException && ex is not OutOfMemoryException)
        { result.Errors.Add(new("", 0, "", "Không đọc được tệp Excel. Hãy dùng đúng cấu trúc file mẫu, bỏ công thức và không đặt mật khẩu.")); }
        return result;
    }
    private static void Validate(Matrix matrix, List<QuizTopic> existingTopics)
    {
        void Error(string sheet, int row, string col, string text) => matrix.Errors.Add(new(sheet, row, col, text));
        var ids = existingTopics.Select(t => t.Id).Concat(matrix.Topics.Select(t => t.Id)).ToHashSet();
        var topicIds = new HashSet<int>(); var codes = new HashSet<string>(StringComparer.Ordinal); var samples = new HashSet<int>();
        foreach (var row in matrix.Topics)
        {
            if (row.Id <= 0 || !topicIds.Add(row.Id)) Error("ChuyenDe", row.Row, TopicHeaders[0], "Số chuyên đề phải là số nguyên dương và không được trùng trong file.");
            if (row.Values[1].Length is < 2 or > 200) Error("ChuyenDe", row.Row, TopicHeaders[1], "Tên chuyên đề phải có 2–200 ký tự.");
            if (Lines(row.Values[2]).Any(s => s.Length > 2000)) Error("ChuyenDe", row.Row, TopicHeaders[2], "Mỗi đoạn giới thiệu tối đa 2000 ký tự.");
            if (Terms(row.Values[3]).Any(t => t.Length != 2 || t[0].Length is < 1 or > 200 || t[1].Length is < 1 or > 1000))
                Error("ChuyenDe", row.Row, TopicHeaders[3], "Mỗi dòng phải có dạng từ | giải nghĩa (tối đa 200 | 1000 ký tự).");
        }
        foreach (var row in matrix.Questions)
        {
            string[] v = row.Values;
            void E(int col, string text) => Error("CauHoi", row.Row, QuestionHeaders[col], text);
            if (row.TopicId <= 0 || !ids.Contains(row.TopicId)) E(0, "Chuyên đề không tồn tại trong CSDL hoặc sheet ChuyenDe.");
            if (row.Code.Length is < 1 or > 16 || !Regex.IsMatch(row.Code, @"^[\p{L}\p{N}._-]+$")) E(1, "Mã câu bắt buộc, gồm 1–16 chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.");
            if (!codes.Add(row.Code)) E(1, "Mã câu bị trùng trong file.");
            if (v[2].Length is < 1 or > 40) E(2, "Loại câu bắt buộc, tối đa 40 ký tự.");
            if (v[3].Length > 2000) E(3, "Tình huống tối đa 2000 ký tự.");
            if (v[4].Length is < 5 or > 2000) E(4, "Câu hỏi bắt buộc, có 5–2000 ký tự.");
            int optionCount = 0;
            for (int i = 0; i < 4; i++)
            {
                if (v[5 + i].Length > 0) { optionCount++; if (v[10 + i].Length == 0) E(10 + i, "Lựa chọn có nội dung phải có giải thích."); }
                else if (v[10 + i].Length > 0) E(10 + i, "Không được có giải thích khi lựa chọn tương ứng để trống.");
                if (v[5 + i].Length > 1000) E(5 + i, "Lựa chọn tối đa 1000 ký tự.");
                if (v[10 + i].Length > 2000) E(10 + i, "Giải thích tối đa 2000 ký tự.");
            }
            if (optionCount < 2) E(5, "Câu hỏi phải có ít nhất 2 lựa chọn.");
            int answer = Array.IndexOf(new[] { "A", "B", "C", "D" }, v[9]);
            if (answer < 0 || v[5 + answer].Length == 0) E(9, "Đáp án đúng phải là A, B, C hoặc D và thuộc lựa chọn có nội dung.");
            if (v[14].Length > 3000) E(14, "Hành động an toàn tối đa 3000 ký tự.");
            if (!Int(v[15], 0, 600, out _)) E(15, "Thời gian đọc phải là số nguyên từ 0 đến 600.");
            if (v[16].Length > 0)
            {
                if (!Int(v[16], 1, 8, out int sample)) E(16, "Thứ tự Thử sức phải từ 1 đến 8 hoặc để trống.");
                else if (!samples.Add(sample)) E(16, "Thứ tự Thử sức bị trùng trong file.");
                if (v[17].Length == 0) E(17, "Phải có nhãn khi có thứ tự Thử sức.");
            }
            if (v[17].Length > 60) E(17, "Nhãn Thử sức tối đa 60 ký tự.");
            if (!Int(v[18], 0, int.MaxValue, out _)) E(18, "Thứ tự hiển thị phải là số nguyên không âm.");
        }
        if (matrix.Questions.Count == 0) Error("CauHoi", 2, "Mã câu", "File phải có ít nhất một câu hỏi; không nhập file rỗng để ngừng toàn bộ ngân hàng.");
    }
    private static string[] TopicValues(QuizTopic t) => [t.Id.ToString(CultureInfo.InvariantCulture), t.Title,
        string.Join('\n', JsonSerializer.Deserialize<string[]>(t.Intro) ?? []),
        string.Join('\n', (JsonSerializer.Deserialize<string[][]>(t.Terms ?? "[]") ?? []).Select(x => string.Join(" | ", x)))];
    private static string[] QuestionValues(QuizQuestion q)
    {
        var opts = (JsonSerializer.Deserialize<string[][]>(q.Options) ?? []).ToDictionary(x => x[0], x => x[1]);
        var exp = JsonSerializer.Deserialize<Dictionary<string, string>>(q.Explanations) ?? [];
        return [q.TopicId.ToString(CultureInfo.InvariantCulture), q.Code, q.Kind, q.Situation ?? "", q.Question,
            opts.GetValueOrDefault("A", ""), opts.GetValueOrDefault("B", ""), opts.GetValueOrDefault("C", ""), opts.GetValueOrDefault("D", ""), q.Answer,
            exp.GetValueOrDefault("A", ""), exp.GetValueOrDefault("B", ""), exp.GetValueOrDefault("C", ""), exp.GetValueOrDefault("D", ""),
            q.SafeAction ?? "", q.ReadSeconds.ToString(CultureInfo.InvariantCulture), q.SampleOrder?.ToString(CultureInfo.InvariantCulture) ?? "", q.SampleLabel ?? "", q.SortOrder.ToString(CultureInfo.InvariantCulture)];
    }
    private static void Apply(QuizQuestion q, string[] v)
    {
        q.TopicId = int.Parse(v[0], CultureInfo.InvariantCulture); q.Kind = v[2]; q.Situation = Empty(v[3]); q.Question = v[4];
        var keys = Enumerable.Range(0, 4).Where(i => v[5 + i].Length > 0).ToList();
        q.Options = JsonSerializer.Serialize(keys.Select(i => new[] { ((char)('A' + i)).ToString(), v[5 + i] }), Json);
        q.Answer = v[9]; q.Explanations = JsonSerializer.Serialize(keys.ToDictionary(i => ((char)('A' + i)).ToString(), i => v[10 + i]), Json);
        q.SafeAction = Empty(v[14]); q.ReadSeconds = int.Parse(v[15], CultureInfo.InvariantCulture);
        q.SampleOrder = string.IsNullOrEmpty(v[16]) ? null : int.Parse(v[16], CultureInfo.InvariantCulture);
        q.SampleLabel = Empty(v[17]); q.SortOrder = int.Parse(v[18], CultureInfo.InvariantCulture);
    }
    private static List<string> Changed(string[] before, string[] after, string[] headers) => headers.Where((_, i) => before[i] != after[i]).ToList();
    private static string[] Lines(string s) => s.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    private static string[][] Terms(string s) => Lines(s).Select(line => line.Split('|', 2, StringSplitOptions.TrimEntries)).ToArray();
    private static bool Int(string s, int min, int max, out int n) => int.TryParse(s, NumberStyles.None, CultureInfo.InvariantCulture, out n) && n >= min && n <= max;
    private static string? Empty(string s) => s.Length == 0 ? null : s;
    private static QuizAdminValidationException Invalid(string message) => new(new Dictionary<string, string> { ["file"] = message });
    private static string SafeName(string name)
    {
        string safe = Path.GetFileName(name.Replace('\\', '/')).Replace(':', '_');
        safe = new string(safe.Where(c => !char.IsControl(c)).ToArray());
        return safe.Length > 200 ? safe[..195] + ".xlsx" : safe;
    }
    private static void WriteRow(IXLWorksheet sheet, int row, string[] values)
    {
        for (int i = 0; i < values.Length; i++) sheet.Cell(row, i + 1).Value = values[i]; // text, never an executable formula
    }
}
