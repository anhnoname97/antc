using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

internal static class QuestionRelatedTitles
{
    public static async Task<QuestionRow[]> LoadAsync(AppDbContext db, IReadOnlyList<QuestionRow> rows, CancellationToken ct)
    {
        var ids = rows.SelectMany(row => row.AggregatedSourceIds.Concat(
            row.AggregatedIntoId is { } id ? new[] { id } : Array.Empty<long>())).Distinct().ToArray();
        if (ids.Length == 0) return rows.ToArray();
        var titles = await db.QuestionSubmissions.AsNoTracking().Where(x => ids.Contains(x.Id))
            .Select(x => new { x.Id, x.Content }).ToDictionaryAsync(x => x.Id, x => x.Content, ct);
        return rows.Select(row => row with
        {
            AggregatedIntoTitle = row.AggregatedIntoId is { } id ? titles.GetValueOrDefault(id) : null,
            AggregatedSourceTitles = row.AggregatedSourceIds.Where(titles.ContainsKey)
                .ToDictionary(id => id, id => titles[id])
        }).ToArray();
    }
}
