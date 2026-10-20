using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Core.Questions;

public sealed class QuestionPublicNavigation(AppDbContext db)
{
    public const int PageSize = 6;
    public static string Anchor(long id) => $"cau-hoi-{id}";
    // Resolve the current page at request time; adding newer answers cannot break this link.
    public static string Url(long id) => $"/hoi-dap?cauHoi={id}#{Anchor(id)}";

    public async Task<int?> PageAsync(long id, CancellationToken ct = default)
    {
        var published = db.QuestionSubmissions.AsNoTracking().Where(x => x.Type == "cau-hoi" && x.IsPublished
            && x.ApprovedAt != null && x.PublishedAnswer != null && x.PublishedAnswer != "");
        var item = await published.Where(x => x.Id == id).Select(x => new { x.Id, x.ApprovedAt }).SingleOrDefaultAsync(ct);
        if (item is null) return null;
        int preceding = await published.CountAsync(x => x.ApprovedAt > item.ApprovedAt
            || x.ApprovedAt == item.ApprovedAt && x.Id > item.Id, ct);
        return preceding / PageSize + 1;
    }
}
