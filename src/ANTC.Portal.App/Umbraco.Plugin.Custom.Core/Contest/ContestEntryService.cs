using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

/// <summary>Du lieu gui len API-01. Mode: "named" hoac "anon".</summary>
public record CreateEntryRequest(string? Mode, string? FullName, string? Phone, string? Org, bool? Consent);

/// <summary>Ket qua API-01 khi thanh cong. Token goc chi nam o day, khong luu CSDL.</summary>
public record CreatedEntry(string Code, string Token, string Mode, int? AttemptNo, int MaxAttempts, string Status);

/// <summary>Loi nghiep vu cua API-01; Fields theo ten truong gui len (fullName, phone, org, consent).</summary>
public record ContestError(string Code, string Message, IReadOnlyDictionary<string, string>? Fields = null);

public record CreateEntryResult(CreatedEntry? Entry, ContestError? Error)
{
    public static CreateEntryResult Ok(CreatedEntry entry) => new(entry, null);
    public static CreateEntryResult Fail(ContestError error) => new(null, error);
}

public interface IContestEntryService
{
    /// <summary>API-01: tao mot luot thi. ip dung de bam, khong luu goc.</summary>
    Task<CreateEntryResult> CreateAsync(CreateEntryRequest request, string? ip, CancellationToken ct = default);
}

/// <summary>
/// Tao luot thi (API-01, BE-22). Dem luot va ghi nam trong cung mot giao dich, bao boi
/// mot khoa trong tien trinh de hai yeu cau dong thoi khong vuot maxAttempts.
/// </summary>
public class ContestEntryService : IContestEntryService
{
    public const string IpHashSaltKey = "Contest:IpHashSalt";

    private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int CodeLength = 6;
    private const int MaxCodeTries = 10;

    // Mot khoa cho ca tien trinh; SQLite chi co mot nguoi ghi, nen khong them gi cho don gian
    internal static readonly SemaphoreSlim WriteLock = new(1, 1);

    private static readonly Regex PhonePattern = new(@"^0\d{9}$", RegexOptions.Compiled);

    private readonly AppDbContext _db;
    private readonly IContestSettings _settings;
    private readonly IConfiguration _config;

    public ContestEntryService(AppDbContext db, IContestSettings settings, IConfiguration config)
    {
        _db = db;
        _settings = settings;
        _config = config;
    }

    public async Task<CreateEntryResult> CreateAsync(CreateEntryRequest request, string? ip, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        string? mode = request.Mode;
        if (mode is not (EntryModes.Named or EntryModes.Anon))
        {
            return CreateEntryResult.Fail(new("VALIDATION", "Chế độ dự thi không hợp lệ."));
        }

        string? fullName = null, phone = null, org = null;
        if (mode == EntryModes.Named)
        {
            var fields = Validate(request, out fullName, out phone, out org);
            if (fields.Count > 0)
            {
                return CreateEntryResult.Fail(new("VALIDATION", fields.Values.First(), fields));
            }
        }

        // Doc cai dat ngoai khoa ghi; khong co trang thiPage thi coi nhu chua mo (QD-006)
        var settings = await _settings.GetAsync();
        if (settings is null || _settings.GetStatus(settings, now) != ContestStatus.Open)
        {
            return CreateEntryResult.Fail(new("CONTEST_CLOSED", "Cuộc thi chưa mở hoặc đã kết thúc."));
        }

        string token = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
        string? ipHash = HashIp(ip);

        await WriteLock.WaitAsync(ct);
        try
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            int? attemptNo = null;
            if (phone is not null)
            {
                int used = await _db.Entries.CountAsync(e => e.Phone == phone, ct);
                if (used >= settings.MaxAttempts)
                {
                    return CreateEntryResult.Fail(new("ATTEMPT_LIMIT",
                        $"Số {phone} đã dùng hết {settings.MaxAttempts} lượt thi. Mỗi số điện thoại chỉ được thi tối đa {settings.MaxAttempts} lượt."));
                }

                attemptNo = used + 1;
            }

            var entry = new Entry
            {
                Code = await NewCodeAsync(ct),
                TokenHash = HashToken(token),
                Mode = mode,
                FullName = fullName,
                Phone = phone,
                Org = org,
                ConsentAt = mode == EntryModes.Named ? now : null,
                AttemptNo = attemptNo,
                Status = EntryStatuses.InProgress,
                CreatedAt = now,
                IpHash = ipHash
            };
            _db.Entries.Add(entry);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            // Luot an danh khong co attemptNo: tra null, khop entry.attempt_no
            return CreateEntryResult.Ok(new(entry.Code, token, mode, attemptNo, settings.MaxAttempts, entry.Status));
        }
        finally
        {
            WriteLock.Release();
        }
    }

    /// <summary>Kiem tra lai phia may chu, khong tin du lieu da chuan hoa tu trinh duyet.</summary>
    private static Dictionary<string, string> Validate(
        CreateEntryRequest r, out string? fullName, out string? phone, out string? org)
    {
        var fields = new Dictionary<string, string>();

        fullName = r.FullName?.Trim();
        if (string.IsNullOrEmpty(fullName))
        {
            fields["fullName"] = "Chưa có họ tên. Ban Tổ chức cần tên để xác minh khi trao giải.";
        }
        else if (fullName.Length < 2 || fullName.Length > 100)
        {
            fields["fullName"] = "Họ tên cần từ 2 đến 100 ký tự.";
        }

        phone = NormalizePhone(r.Phone);
        if (!PhonePattern.IsMatch(phone))
        {
            fields["phone"] = "Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.";
        }

        org = r.Org?.Trim();
        if (string.IsNullOrEmpty(org))
        {
            org = null;
        }
        else if (org.Length > 150)
        {
            fields["org"] = "Đơn vị tối đa 150 ký tự.";
        }

        if (r.Consent != true)
        {
            fields["consent"] = "Cần tích ô đồng ý với Thể lệ và nội dung xử lý dữ liệu thì mới vào thi được.";
        }

        return fields;
    }

    /// <summary>Bo ky tu khong phai so; bat dau bang 84 va dai 11 so thi doi 84 thanh 0.</summary>
    public static string NormalizePhone(string? raw)
    {
        string digits = new((raw ?? "").Where(char.IsAsciiDigit).ToArray());
        return digits.StartsWith("84") && digits.Length == 11 ? "0" + digits[2..] : digits;
    }

    // Ma khong trung; goi trong khoa ghi nen khong co yeu cau khac chen vao giua
    private async Task<string> NewCodeAsync(CancellationToken ct)
    {
        for (int i = 0; i < MaxCodeTries; i++)
        {
            string code = "AD-" + RandomNumberGenerator.GetString(CodeAlphabet, CodeLength);
            if (!await _db.Entries.AnyAsync(e => e.Code == code, ct)) return code;
        }

        throw new InvalidOperationException("Khong sinh duoc ma du thi khong trung.");
    }

    /// <summary>SHA-256 dang hex thuong cua chuoi token; API co /me bam header theo cung cach.</summary>
    public static string HashToken(string token) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private string? HashIp(string? ip)
    {
        string? salt = _config[IpHashSaltKey];
        if (string.IsNullOrEmpty(salt))
        {
            // Thieu muoi: van cho dang ky, luu ip_hash null, khong luu bam khong muoi (QD-009)
            return null;
        }

        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(salt + "|" + (ip ?? ""))));
    }
}
