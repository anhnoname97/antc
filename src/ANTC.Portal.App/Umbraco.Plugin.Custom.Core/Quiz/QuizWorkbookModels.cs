using Microsoft.Extensions.Caching.Memory;

namespace Umbraco.Plugin.Custom.Core.Quiz;

public sealed record WorkbookError(string Sheet, int Row, string Column, string Message);
public sealed record WorkbookChange(string Code, IReadOnlyList<string> Columns);
public sealed record WorkbookPreview(string? PreviewId, IReadOnlyList<WorkbookError> Errors,
    int Added, int Updated, int Deactivated, IReadOnlyList<WorkbookChange> Questions,
    IReadOnlyList<string> DeactivatedCodes, IReadOnlyList<WorkbookChange> Topics,
    bool DuringContest, int InProgress, string? Warning);
public sealed record ConfirmWorkbookRequest(string PreviewId, string? Confirmation);
public sealed record WorkbookImportHistory(long Id, DateTime CreatedAt, string CreatedBy, string FileName,
    int Added, int Updated, int Deactivated, bool DuringContest, bool CanDownload);
internal sealed record PendingWorkbook(string Actor, string FileName, byte[] Bytes, string Fingerprint);

// Bounded, server-owned previews: the client cannot replace the validated file or counts at commit time.
public sealed class QuizWorkbookPreviews : IDisposable
{
    private readonly MemoryCache _cache = new(new MemoryCacheOptions { SizeLimit = 100 * 1024 * 1024 });
    internal string Add(PendingWorkbook item)
    {
        string id = Guid.NewGuid().ToString("N");
        _cache.Set(id, item, new MemoryCacheEntryOptions().SetSize(item.Bytes.Length + 1024)
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(30)));
        return id;
    }
    internal PendingWorkbook Get(string id, string actor) =>
        _cache.TryGetValue(id, out PendingWorkbook? item) && item is not null && item.Actor == actor ? item :
        throw new QuizAdminConflictException("IMPORT_EXPIRED", "Bản xem trước đã hết hạn hoặc không thuộc tài khoản này. Hãy tải file lên và kiểm tra lại.");
    internal void Remove(string id) => _cache.Remove(id);
    public void Dispose() => _cache.Dispose();
}
