using System.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Options;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Contest;

public class ContestEntryService : IContestEntryService
{
    private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int CodeLength = 6;
    private const int MaxCodeGenerationAttempts = 32;

    private readonly AppDbContext _db;
    private readonly ContestSecurityOptions _security;
    private readonly TimeProvider _timeProvider;

    public ContestEntryService(
        AppDbContext db,
        IOptions<ContestSecurityOptions> security,
        TimeProvider timeProvider)
    {
        _db = db;
        _security = security.Value;
        _timeProvider = timeProvider;
    }

    public async Task<ContestEntryCreationResult> CreateAsync(
        ContestEntryRegistration registration,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        DateTimeOffset now = _timeProvider.GetUtcNow();

        await _db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            var connection = (SqliteConnection)_db.Database.GetDbConnection();

            // BEGIN IMMEDIATE giu quyen ghi truoc khi dem so luot. Vi vay hai request cung
            // mot so dien thoai khong the cung doc mot gia tri dem roi cung chen vuot gioi han.
            await using SqliteTransaction sqliteTransaction =
                connection.BeginTransaction(IsolationLevel.Serializable, deferred: false);
            await using IDbContextTransaction transaction =
                await _db.Database.UseTransactionAsync(sqliteTransaction, cancellationToken)
                ?? throw new InvalidOperationException("Khong the khoi tao transaction tao luot thi.");

            DateTime utcNow = now.UtcDateTime;
            ContestCampaign? contest = await _db.ContestCampaigns
                .Where(x => x.IsActive && x.StartAt <= utcNow && x.EndAt >= utcNow)
                .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
                .Include(x => x.Questions)
                .FirstOrDefaultAsync(cancellationToken);
            if (contest is null)
            {
                throw new ContestClosedException();
            }

            int? attemptNo = null;
            if (registration.Mode == EntryModes.Named)
            {
                int usedAttempts = await _db.Entries
                    .CountAsync(e => e.ContestId == contest.Id && e.Phone == registration.Phone, cancellationToken);
                if (usedAttempts >= contest.MaxAttempts)
                {
                    throw new AttemptLimitException();
                }

                attemptNo = usedAttempts + 1;
            }

            string code = await GenerateUniqueCodeAsync(cancellationToken);
            byte[] tokenBytes = RandomNumberGenerator.GetBytes(32);
            string token = WebEncoders.Base64UrlEncode(tokenBytes);

            var entry = new Entry
            {
                ContestId = contest.Id,
                Code = code,
                TokenHash = Hash(token),
                Mode = registration.Mode,
                FullName = registration.Mode == EntryModes.Named ? registration.FullName : null,
                Phone = registration.Mode == EntryModes.Named ? registration.Phone : null,
                Org = registration.Mode == EntryModes.Named ? registration.Org : null,
                ConsentAt = registration.Mode == EntryModes.Named ? now.UtcDateTime : null,
                AttemptNo = attemptNo,
                Status = EntryStatuses.InProgress,
                Answered = 0,
                CreatedAt = utcNow,
                TotalQuestions = contest.Questions.Count,
                IpHash = string.IsNullOrWhiteSpace(ipAddress)
                    ? null
                    : Hash(ipAddress + "|" + _security.IpHashSalt),
            };

            _db.Entries.Add(entry);
            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new ContestEntryCreationResult(
                entry.Code,
                token,
                entry.Mode,
                entry.AttemptNo,
                contest.MaxAttempts,
                entry.Status);
        }
        finally
        {
            await _db.Database.CloseConnectionAsync();
        }
    }

    private async Task<string> GenerateUniqueCodeAsync(CancellationToken cancellationToken)
    {
        for (int attempt = 0; attempt < MaxCodeGenerationAttempts; attempt++)
        {
            var characters = new char[CodeLength];
            for (int i = 0; i < characters.Length; i++)
            {
                characters[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];
            }

            string code = "AD-" + new string(characters);
            if (!await _db.Entries.AnyAsync(e => e.Code == code, cancellationToken))
            {
                return code;
            }
        }

        throw new InvalidOperationException("Khong the sinh ma du thi duy nhat.");
    }

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
