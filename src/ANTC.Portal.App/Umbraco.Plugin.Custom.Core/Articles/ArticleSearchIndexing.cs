using Examine;
using Examine.Lucene;
using Examine.Search;
using Lucene.Net.Analysis;
using Lucene.Net.Analysis.Miscellaneous;
using Lucene.Net.Analysis.Standard;
using Lucene.Net.Analysis.Util;
using LuceneVersion = Lucene.Net.Util.LuceneVersion;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Examine;

namespace Umbraco.Plugin.Custom.Core.Articles;

public sealed class ArticleSearchComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<ArticleSearchIndex>();
        builder.Services.AddSingleton<IArticleSearchIndex>(services => services.GetRequiredService<ArticleSearchIndex>());
        builder.Services.AddSingleton<IPostConfigureOptions<LuceneDirectoryIndexOptions>, ArticleSearchIndexOptions>();
        builder.AddNotificationHandler<UmbracoApplicationStartingNotification, ArticleSearchIndexComponent>();
        builder.Services.AddHostedService<ArticleSearchIndexStartup>();
    }
}

public sealed class ArticleSearchIndexOptions : IPostConfigureOptions<LuceneDirectoryIndexOptions>
{
    public void PostConfigure(string? name, LuceneDirectoryIndexOptions options)
    {
        if (name != Constants.UmbracoIndexes.ExternalIndexName) return;
        options.FieldDefinitions.AddOrUpdate(new FieldDefinition(ArticleSearchFields.Text, FieldDefinitionTypes.FullText));
        options.FieldDefinitions.AddOrUpdate(new FieldDefinition(ArticleSearchFields.Version, FieldDefinitionTypes.Raw));
        // Những từ tiếng Việt như "nợ" -> "no", "an" cần được giữ nguyên.
        // Các trường có sẵn của Umbraco tiếp tục dùng analyzer đang cấu hình.
        options.Analyzer = new PerFieldAnalyzerWrapper(options.Analyzer ?? new StandardAnalyzer(LuceneVersion.LUCENE_48),
            new Dictionary<string, Analyzer>
            {
                [ArticleSearchFields.Text] = new StandardAnalyzer(LuceneVersion.LUCENE_48, CharArraySet.Empty)
            });
    }
}

public sealed class ArticleSearchIndexComponent(IExamineManager examine)
    : INotificationHandler<UmbracoApplicationStartingNotification>
{
    public void Handle(UmbracoApplicationStartingNotification notification)
    {
        if (examine.TryGetIndex(Constants.UmbracoIndexes.ExternalIndexName, out var index))
            index.TransformingIndexValues += Transform;
    }

    private static void Transform(object? sender, IndexingItemEventArgs args)
    {
        if (args.ValueSet.Category != "content" || args.ValueSet.ItemType != "article") return;
        args.SetValues(Values(args.ValueSet));
    }

    internal static Dictionary<string, IEnumerable<object>> Values(ValueSet valueSet)
    {
        string Read(string field) => valueSet.Values.TryGetValue(field, out var values)
            ? string.Join(' ', values.Select(x => x?.ToString())) : string.Empty;
        bool hidden = Read("hideFromSearch") is "1" or "true" or "True";
        string text = hidden ? string.Empty : string.Join(' ', Read("nodeName"), Read("summary"),
            ArticleSearchText.PlainHtml(Read("body")));
        var data = valueSet.Values.ToDictionary(x => x.Key, x => (IEnumerable<object>)x.Value);
        data[ArticleSearchFields.Text] = [ArticleSearchText.Fold(text)];
        data[ArticleSearchFields.Version] = [ArticleSearchFields.SchemaVersion];
        return data;
    }
}

public sealed class ArticleSearchIndexStartup(IExamineManager examine, IIndexRebuilder rebuilder,
    ArticleSearchIndex search, IRuntimeState runtime, IHostApplicationLifetime lifetime,
    ILogger<ArticleSearchIndexStartup> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        using var registration = lifetime.ApplicationStarted.Register(() => started.TrySetResult());
        try
        {
            await started.Task.WaitAsync(stoppingToken);
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (runtime.Level == RuntimeLevel.Run &&
                        examine.TryGetIndex(Constants.UmbracoIndexes.ExternalIndexName, out var index) &&
                        !await rebuilder.IsRebuildingAsync(index.Name))
                    {
                        long articles = index.Searcher.CreateQuery("content").Field("__NodeTypeAlias", "article")
                            .Execute(new QueryOptions(0, 1)).TotalItemCount;
                        long current = index.Searcher.CreateQuery("content").Field("__NodeTypeAlias", "article").And()
                            .Field(ArticleSearchFields.Version, ArticleSearchFields.SchemaVersion)
                            .Execute(new QueryOptions(0, 1)).TotalItemCount;
                        if (current < articles)
                        {
                            var rebuilt = await rebuilder.RebuildIndexAsync(index.Name, TimeSpan.Zero, useBackgroundThread: false);
                            if (!rebuilt.Success) throw new InvalidOperationException("Không thể dựng chỉ mục bài viết.");
                            while (await rebuilder.IsRebuildingAsync(index.Name))
                                await Task.Delay(TimeSpan.FromMilliseconds(250), stoppingToken);
                        }
                        search.MarkReady();
                        return;
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
                catch (Exception error)
                {
                    logger.LogWarning(error, "Chưa chuẩn bị được chỉ mục bài viết; sẽ thử lại.");
                }
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
    }
}
