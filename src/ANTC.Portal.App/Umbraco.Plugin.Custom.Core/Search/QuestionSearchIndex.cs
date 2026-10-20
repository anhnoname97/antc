using System.Security.Cryptography;
using System.Text;
using Examine;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Infrastructure.Examine;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Core.Search;

/// <summary>Only approved public text enters ExternalIndex; never contact details, notes or drafts.</summary>
public sealed class QuestionSearchIndex(IServiceScopeFactory scopes)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private Dictionary<string, string> _fingerprints = [];

    public async Task SyncAsync(IIndex index, bool force = false, CancellationToken ct = default)
    {
        await _gate.WaitAsync(ct);
        try
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var rows = await db.QuestionSubmissions.AsNoTracking()
                .Where(x => x.Type == "cau-hoi" && x.IsPublished && x.ApprovedAt != null && x.PublishedAnswer != null && x.PublishedAnswer != "")
                .Select(x => new PublicText(x.Id, x.Content, x.PublishedAnswer!)).ToArrayAsync(ct);
            var current = new Dictionary<string, string>();
            var updates = new List<ValueSet>();
            foreach (var row in rows)
            {
                string id = Key(row.Id);
                string hash = Fingerprint(row);
                current[id] = hash;
                if (force || !_fingerprints.TryGetValue(id, out string? previous) || previous != hash)
                    updates.Add(Document(row));
            }
            if (updates.Count > 0) index.IndexItems(updates);
            string[] removed = _fingerprints.Keys.Except(current.Keys).ToArray();
            if (removed.Length > 0) index.DeleteFromIndex(removed);
            _fingerprints = current;
        }
        finally { _gate.Release(); }
    }

    public async Task RefreshAsync(IIndex index, long id, CancellationToken ct = default)
    {
        await _gate.WaitAsync(ct);
        try
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // Read the latest committed public snapshot, never a draft or an older event payload.
            var row = await db.QuestionSubmissions.AsNoTracking()
                .Where(x => x.Id == id && x.Type == "cau-hoi" && x.IsPublished && x.ApprovedAt != null
                    && x.PublishedAnswer != null && x.PublishedAnswer != "")
                .Select(x => new PublicText(x.Id, x.Content, x.PublishedAnswer!)).SingleOrDefaultAsync(ct);
            string key = Key(id);
            if (row is null)
            {
                index.DeleteFromIndex([key]);
                _fingerprints.Remove(key);
            }
            else
            {
                index.IndexItems([Document(row)]);
                _fingerprints[key] = Fingerprint(row);
            }
        }
        finally { _gate.Release(); }
    }

    private sealed record PublicText(long Id, string Content, string PublishedAnswer);
    private static string Key(long id) => SearchFields.QuestionPrefix + id;
    private static string Fingerprint(PublicText row) => Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(row.Content + "\n" + row.PublishedAnswer)));
    private static ValueSet Document(PublicText row) => new(Key(row.Id), SearchFields.QuestionCategory, SearchFields.QuestionType,
        new Dictionary<string, object> { ["nodeName"] = row.Content,
            ["__Published"] = "y", ["path"] = "-1", ["__Path"] = "-1",
            [SearchFields.Text] = SearchText.Fold(row.Content + "\n" + row.PublishedAnswer),
            [SearchFields.Version] = SearchFields.SchemaVersion });
}

public sealed class QuestionSearchPublicationObserver(IExamineManager examine, IIndexRebuilder rebuilder,
    QuestionSearchIndex questions, ILogger<QuestionSearchPublicationObserver> logger) : IQuestionPublicationObserver
{
    public async Task ChangedAsync(long id, CancellationToken ct = default)
    {
        try
        {
            if (examine.TryGetIndex(Constants.UmbracoIndexes.ExternalIndexName, out var index)
                && !await rebuilder.IsRebuildingAsync(index.Name))
                await questions.RefreshAsync(index, id, ct);
        }
        catch (Exception error)
        {
            // Publication already succeeded; the periodic worker retries an unavailable index.
            logger.LogWarning(error, "Chưa cập nhật được chỉ mục cho câu hỏi {QuestionId}; sẽ tự đồng bộ lại.", id);
        }
    }
}
