using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

public record CreateEntryRequest(long? ContestId, string? Mode, string? FullName, string? Phone, string? Org, bool? Consent);

public record CreatedEntry(
    string Code, string Token, string Mode, long ContestId,
    int? AttemptNo, int MaxAttempts, string Status);

public record ContestError(string Code, string Message, IReadOnlyDictionary<string, string>? Fields = null);

public record CreateEntryResult(CreatedEntry? Entry, ContestError? Error)
{
    public static CreateEntryResult Ok(CreatedEntry entry) => new(entry, null);
    public static CreateEntryResult Fail(ContestError error) => new(null, error);
}

public interface IContestEntryService
{
    Task<CreateEntryResult> CreateAsync(CreateEntryRequest request, string? ip, CancellationToken ct = default);
    Task<ContestEntryCreationResult> CreateAsync(
        ContestEntryRegistration registration, string? ip, CancellationToken ct = default);
}

/// <summary>
/// Tạo lượt thi. Khóa ghi bao trùm cả đếm lượt và insert để các request đồng thời
/// không thể cùng vượt quá giới hạn của một cuộc thi.
/// </summary>
public class ContestEntryService : IContestEntryService
{
    public const string IpHashSaltKey = "Contest:IpHashSalt";

    private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int CodeLength = 6;
    private const int MaxCodeTries = 32;
    internal static readonly SemaphoreSlim WriteLock = new(1, 1);
    private static readonly Regex PhonePattern = new(@"^0\d{9}$", RegexOptions.Compiled);

    private readonly AppDbContext _db;
    private readonly IContestCatalog _catalog;
    private readonly TimeProvider _clock;
    private readonly IConfiguration _config;

    public ContestEntryService(AppDbContext db, IContestCatalog catalog, TimeProvider clock, IConfiguration config)
    {
        _db = db;
        _catalog = catalog;
        _clock = clock;
        _config = config;
    }

    public ContestEntryService(
        AppDbContext db, IOptions<ContestSecurityOptions> security, TimeProvider clock)
        : this(db, new DirectContestCatalog(db, clock), clock,
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                [IpHashSaltKey] = security.Value.IpHashSalt,
            }).Build())
    {
    }

    public async Task<ContestEntryCreationResult> CreateAsync(
        ContestEntryRegistration registration, string? ip, CancellationToken ct = default)
    {
        ContestInfo? current = await _catalog.GetCurrentAsync(ct);
        if (current is null) throw new ContestClosedException();
        CreateEntryResult result = await CreateAsync(new CreateEntryRequest(
            current.Id, registration.Mode, registration.FullName, registration.Phone,
            registration.Org, registration.Consent), ip, ct);
        if (result.Error?.Code == "CONTEST_CLOSED") throw new ContestClosedException();
        if (result.Error?.Code == "ATTEMPT_LIMIT") throw new AttemptLimitException();
        if (result.Entry is not { } entry)
            throw new InvalidOperationException(result.Error?.Message ?? "Không thể tạo lượt dự thi.");
        return new ContestEntryCreationResult(
            entry.Code, entry.Token, entry.Mode, entry.AttemptNo, entry.MaxAttempts, entry.Status);
    }

    public async Task<CreateEntryResult> CreateAsync(CreateEntryRequest request, string? ip, CancellationToken ct = default)
    {
        DateTime now = _clock.GetUtcNow().UtcDateTime;
        if (request.ContestId is not > 0)
        {
            const string message = "Chưa chọn cuộc thi.";
            return CreateEntryResult.Fail(new("VALIDATION", message,
                new Dictionary<string, string> { ["contestId"] = message }));
        }

        string? mode = request.Mode;
        if (mode is not (EntryModes.Named or EntryModes.Anon))
            return CreateEntryResult.Fail(new("VALIDATION", "Chế độ dự thi không hợp lệ."));

        string? fullName = null, phone = null, org = null;
        if (mode == EntryModes.Named)
        {
            Dictionary<string, string> fields = Validate(
                request.FullName, request.Phone, request.Org, request.Consent,
                out fullName, out phone, out org);
            if (fields.Count > 0)
                return CreateEntryResult.Fail(new("VALIDATION", fields.Values.First(), fields));
        }

        ContestInfo? contest = await _catalog.GetAsync(request.ContestId.Value, ct);
        if (contest is null)
            return CreateEntryResult.Fail(new("CONTEST_NOT_FOUND", "Không tìm thấy cuộc thi."));
        if (contest.StatusAt(now) != ContestState.Ongoing)
            return CreateEntryResult.Fail(new("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));

        string token = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
        string? ipHash = HashIp(ip);

        await WriteLock.WaitAsync(ct);
        try
        {
            await using var transaction = await _db.Database.BeginTransactionAsync(ct);
            // The request may have waited while the contest closed, was disabled, or privacy cleanup ran.
            // Re-read the participation window inside the write transaction before storing fresh PII.
            now = _clock.GetUtcNow().UtcDateTime;
            var live = await _db.ContestCampaigns.AsNoTracking().Where(c => c.Id == contest.Id)
                .Select(c => new { c.IsActive, c.StartAt, c.EndAt, c.MaxAttempts }).SingleOrDefaultAsync(ct);
            if (live is null || !live.IsActive || now < live.StartAt || now >= live.EndAt)
                return CreateEntryResult.Fail(new("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));
            contest = contest with { StartAt = live.StartAt, EndAt = live.EndAt, MaxAttempts = live.MaxAttempts };
            int? attemptNo = null;
            if (phone is not null)
            {
                int used = await _db.Entries.CountAsync(
                    e => e.ContestId == contest.Id && e.Phone == phone, ct);
                if (contest.MaxAttempts > 0 && used >= contest.MaxAttempts)
                    return CreateEntryResult.Fail(new("ATTEMPT_LIMIT",
                        $"Số {phone} đã dùng hết {contest.MaxAttempts} lượt của cuộc thi này."));
                attemptNo = used + 1;
            }

            var entry = new Entry
            {
                ContestId = contest.Id,
                Code = await NewCodeAsync(ct),
                TokenHash = HashToken(token),
                Mode = mode,
                FullName = fullName,
                Phone = phone,
                Org = org,
                ConsentAt = mode == EntryModes.Named ? now : null,
                AttemptNo = attemptNo,
                Status = EntryStatuses.InProgress,
                TotalQuestions = contest.QuestionCount,
                CreatedAt = now,
                IpHash = ipHash,
            };
            _db.Entries.Add(entry);
            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return CreateEntryResult.Ok(new(
                entry.Code, token, mode, contest.Id, attemptNo, contest.MaxAttempts, entry.Status));
        }
        finally
        {
            WriteLock.Release();
        }
    }

    internal static Dictionary<string, string> Validate(
        string? rawFullName, string? rawPhone, string? rawOrg, bool? consent,
        out string? fullName, out string? phone, out string? org)
    {
        var fields = new Dictionary<string, string>();
        fullName = rawFullName?.Trim();
        if (string.IsNullOrEmpty(fullName)) fields["fullName"] = "Họ tên là bắt buộc.";
        else if (fullName.Length is < 2 or > 100) fields["fullName"] = "Họ tên cần từ 2 đến 100 ký tự.";

        phone = NormalizePhone(rawPhone);
        if (!PhonePattern.IsMatch(phone)) fields["phone"] = "Số điện thoại chưa đúng định dạng 0xxxxxxxxx.";

        org = rawOrg?.Trim();
        if (string.IsNullOrEmpty(org)) org = null;
        else if (org.Length > 150) fields["org"] = "Đơn vị tối đa 150 ký tự.";

        if (consent != true) fields["consent"] = "Bạn phải đồng ý với thể lệ và việc xử lý dữ liệu.";
        return fields;
    }

    public static string NormalizePhone(string? raw)
    {
        string digits = new((raw ?? "").Where(char.IsAsciiDigit).ToArray());
        return digits.StartsWith("84", StringComparison.Ordinal) && digits.Length == 11
            ? "0" + digits[2..]
            : digits;
    }

    private async Task<string> NewCodeAsync(CancellationToken ct)
    {
        for (int i = 0; i < MaxCodeTries; i++)
        {
            string code = "AD-" + RandomNumberGenerator.GetString(CodeAlphabet, CodeLength);
            if (!await _db.Entries.AnyAsync(e => e.Code == code, ct)) return code;
        }

        throw new InvalidOperationException("Không thể sinh mã dự thi duy nhất.");
    }

    public static string HashToken(string token) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private string? HashIp(string? ip)
    {
        string? salt = _config[IpHashSaltKey];
        if (string.IsNullOrWhiteSpace(salt) || string.IsNullOrWhiteSpace(ip)) return null;
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(ip + "|" + salt)));
    }

    private sealed class DirectContestCatalog(AppDbContext db, TimeProvider clock) : IContestCatalog
    {
        public async Task<ContestInfo?> GetAsync(long id, CancellationToken cancellationToken = default)
        {
            ContestCampaign? campaign = await db.ContestCampaigns.AsNoTracking()
                .Include(x => x.Topics).Include(x => x.Questions).AsSplitQuery()
                .SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
            return campaign is null ? null : Map(campaign);
        }

        public async Task<ContestInfo?> GetCurrentAsync(CancellationToken cancellationToken = default)
        {
            DateTime now = clock.GetUtcNow().UtcDateTime;
            ContestCampaign? campaign = await db.ContestCampaigns.AsNoTracking()
                .Include(x => x.Topics).Include(x => x.Questions).AsSplitQuery()
                .Where(x => x.IsActive && x.StartAt <= now && x.EndAt >= now)
                .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
            return campaign is null ? null : Map(campaign);
        }

        public Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        private static ContestInfo Map(ContestCampaign campaign) => new(
            campaign.Id, campaign.Name, campaign.Description, campaign.StartAt, campaign.EndAt,
            campaign.MaxAttempts, campaign.SubmitGraceHours, campaign.ReadTimerFactor, campaign.FocusArea,
            campaign.Topics.OrderBy(x => x.SortOrder)
                .Select(x => new ContestExamTopic(x.TopicId.ToString(), x.TopicId, x.Title, 0)).ToList(),
            campaign.Questions.OrderBy(x => x.SortOrder).Select(x => x.QuestionCode).ToList(),
            campaign.UpdatedAt);
    }
}
