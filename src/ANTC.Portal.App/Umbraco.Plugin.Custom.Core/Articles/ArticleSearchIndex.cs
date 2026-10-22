using Examine;
using Examine.Search;
using Umbraco.Cms.Core;
using Umbraco.Cms.Infrastructure.Examine;

namespace Umbraco.Plugin.Custom.Core.Articles;

public interface IArticleSearchIndex
{
    IReadOnlySet<Guid> Find(string term);
}

public sealed class ArticleSearchUnavailableException() : Exception(
    "Chỉ mục tìm kiếm bài viết đang được chuẩn bị. Vui lòng thử lại sau.");

public static class ArticleSearchFields
{
    public const string Text = "antcArticleText";
    public const string Version = "antcArticleSearchVersion";
    public const string SchemaVersion = "2";
}

public sealed class ArticleSearchIndex(IExamineManager examine) : IArticleSearchIndex
{
    private int _ready;
    internal void MarkReady() => Volatile.Write(ref _ready, 1);

    public IReadOnlySet<Guid> Find(string term)
    {
        string[] terms = ArticleSearchText.Terms(term);
        if (terms.Length == 0) return new HashSet<Guid>();
        if (Volatile.Read(ref _ready) == 0 ||
            !examine.TryGetIndex(Constants.UmbracoIndexes.ExternalIndexName, out var index))
            throw new ArticleSearchUnavailableException();

        var query = index.Searcher.CreateQuery("content")
            .Field("__NodeTypeAlias", "article").And()
            .Field(ArticleSearchFields.Version, ArticleSearchFields.SchemaVersion);
        foreach (string word in terms)
            query = query.And().ManagedQuery(word, [ArticleSearchFields.Text]);

        var keys = new HashSet<Guid>();
        const int batchSize = 100;
        for (int offset = 0; ; offset += batchSize)
        {
            var results = query.Execute(new QueryOptions(offset, batchSize));
            var hits = results.ToArray();
            foreach (var hit in hits)
            {
                string? key = hit.Values.GetValueOrDefault(UmbracoExamineFieldNames.NodeKeyFieldName);
                if (Guid.TryParse(key ?? hit.Id, out Guid id)) keys.Add(id);
            }
            if (hits.Length == 0 || (long)offset + batchSize >= results.TotalItemCount) break;
        }
        return keys;
    }
}
