using Umbraco.Plugin.Custom.Core.Search;

namespace Umbraco.Plugin.Custom.Core.Articles;

internal static class ArticleSearchText
{
    public static bool Contains(string value, string term) =>
        SearchText.Fold(value).Contains(SearchText.Fold(term), StringComparison.Ordinal);
}
