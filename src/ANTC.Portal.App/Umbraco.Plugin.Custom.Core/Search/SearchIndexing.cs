using Examine;
using Examine.Lucene;
using Examine.Search;
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
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Core.Search;

public sealed class SiteSearchComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddScoped<ISiteSearchService, SiteSearchService>();
        builder.Services.AddScoped<QuestionPublicNavigation>();
        builder.Services.AddSingleton<QuestionSearchIndex>();
        builder.Services.AddSingleton<IQuestionPublicationObserver, QuestionSearchPublicationObserver>();
        builder.Services.AddSingleton<IPostConfigureOptions<LuceneDirectoryIndexOptions>, SearchIndexOptions>();
        builder.AddNotificationHandler<UmbracoApplicationStartingNotification, SearchIndexComponent>();
        builder.Services.AddSingleton<IIndexPopulator, QuestionSearchPopulator>();
        builder.Services.AddHostedService<SearchIndexWorker>();
    }
}

public sealed class SearchIndexOptions : IPostConfigureOptions<LuceneDirectoryIndexOptions>
{
    public void PostConfigure(string? name, LuceneDirectoryIndexOptions options)
    {
        if (name != Constants.UmbracoIndexes.ExternalIndexName) return;
        options.FieldDefinitions.AddOrUpdate(new FieldDefinition(SearchFields.Text, FieldDefinitionTypes.FullText));
        options.FieldDefinitions.AddOrUpdate(new FieldDefinition(SearchFields.Version, FieldDefinitionTypes.Raw));
        options.Validator = new QuestionSearchValidator(options.Validator);
    }
}

/// <summary>Keep Umbraco's published/protected-content validator intact for all CMS documents.</summary>
public sealed class QuestionSearchValidator(IValueSetValidator original) : IContentValueSetValidator
{
    // Index populators also inspect these flags when choosing published values.
    public bool PublishedValuesOnly => (original as IContentValueSetValidator)?.PublishedValuesOnly ?? true;
    public bool SupportProtectedContent => (original as IContentValueSetValidator)?.SupportProtectedContent ?? false;
    public int? ParentId => (original as IContentValueSetValidator)?.ParentId;
    public bool ValidatePath(string path, string category) => (original as IContentValueSetValidator)?.ValidatePath(path, category) ?? false;
    public bool ValidateRecycleBin(string path, string category) => (original as IContentValueSetValidator)?.ValidateRecycleBin(path, category) ?? false;
    public bool ValidateProtectedContent(string path, string category) => (original as IContentValueSetValidator)?.ValidateProtectedContent(path, category) ?? false;
    public ValueSetValidationResult Validate(ValueSet valueSet)
    {
        if (valueSet.ItemType != SearchFields.QuestionType) return original.Validate(valueSet);
        bool valid = valueSet.Category == SearchFields.QuestionCategory
            && valueSet.Id.StartsWith(SearchFields.QuestionPrefix, StringComparison.Ordinal)
            && long.TryParse(valueSet.Id[SearchFields.QuestionPrefix.Length..], out long id) && id > 0
            && valueSet.Values.Keys.All(x => x is "nodeName" or "__Published" or "path" or "__Path" or SearchFields.Text or SearchFields.Version);
        return new(valid ? ValueSetValidationStatus.Valid : ValueSetValidationStatus.Failed, valueSet);
    }
}

public sealed class SearchIndexComponent(IExamineManager examine) : INotificationHandler<UmbracoApplicationStartingNotification>
{
    public void Handle(UmbracoApplicationStartingNotification notification)
    {
        if (!examine.TryGetIndex(Constants.UmbracoIndexes.ExternalIndexName, out var index)) return;
        index.TransformingIndexValues += Transform;
    }
    private static void Transform(object? sender, IndexingItemEventArgs args)
    {
        if (args.ValueSet.Category != "content" || !(args.ValueSet.ItemType == "article" || SearchFields.IsPage(args.ValueSet.ItemType))) return;
        string Read(string field) => args.ValueSet.Values.TryGetValue(field, out var values)
            ? string.Join(' ', values.Select(x => x?.ToString())) : string.Empty;
        string text = args.ValueSet.ItemType == "article"
            ? string.Join(' ', Read("nodeName"), Read("summary"), SearchText.PlainHtml(Read("body")))
            : string.Join(' ', Read("nodeName"), Read("seoDescription"));
        var data = args.ValueSet.Values.ToDictionary(x => x.Key, x => (IEnumerable<object>)x.Value);
        data[SearchFields.Text] = [SearchText.Fold(text)];
        data[SearchFields.Version] = [SearchFields.SchemaVersion];
        args.SetValues(data);
    }
}

public sealed class QuestionSearchPopulator : IndexPopulator
{
    private readonly QuestionSearchIndex _questions;
    public QuestionSearchPopulator(QuestionSearchIndex questions)
    {
        _questions = questions;
        RegisterIndex(Constants.UmbracoIndexes.ExternalIndexName);
    }
    protected override void PopulateIndexes(IReadOnlyList<IIndex> indexes)
    {
        foreach (var index in indexes) _questions.SyncAsync(index, force: true).GetAwaiter().GetResult();
    }
}

public sealed class SearchIndexWorker(IExamineManager examine, IIndexRebuilder rebuilder, QuestionSearchIndex questions,
    IRuntimeState runtime, IHostApplicationLifetime lifetime, ILogger<SearchIndexWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        using var registration = lifetime.ApplicationStarted.Register(() => started.TrySetResult());
        await started.Task.WaitAsync(stoppingToken);
        bool checkedSchema = false;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (runtime.Level == RuntimeLevel.Run && examine.TryGetIndex(Constants.UmbracoIndexes.ExternalIndexName, out var index))
                {
                    if (!checkedSchema && !await rebuilder.IsRebuildingAsync(index.Name))
                    {
                        // Upgrade an existing local index once, without changing CMS content.
                        if (index.Searcher.CreateQuery().Field(SearchFields.Version, SearchFields.SchemaVersion)
                            .Execute(new QueryOptions(0, 1)).TotalItemCount == 0)
                        {
                            var rebuild = await rebuilder.RebuildIndexAsync(index.Name, TimeSpan.Zero);
                            if (!rebuild.Success) throw new InvalidOperationException("Không thể dựng lại ExternalIndex.");
                        }
                        // Remove old SQL question documents after an offline unpublish/deletion.
                        var previous = new List<string>();
                        for (int offset = 0; ; offset += 100)
                        {
                            var old = index.Searcher.CreateQuery(SearchFields.QuestionCategory)
                                .Field(SearchFields.Version, SearchFields.SchemaVersion).Execute(new QueryOptions(offset, 100));
                            previous.AddRange(old.Where(x => x.Id.StartsWith(SearchFields.QuestionPrefix, StringComparison.Ordinal)).Select(x => x.Id));
                            if ((long)offset + 100 >= old.TotalItemCount) break;
                        }
                        if (previous.Count > 0) index.DeleteFromIndex(previous);
                        await questions.SyncAsync(index, force: true, ct: stoppingToken);
                        checkedSchema = true;
                    }
                    if (!await rebuilder.IsRebuildingAsync(index.Name)) await questions.SyncAsync(index, ct: stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception error)
            {
                // Never log the visitor's query or question contents.
                logger.LogWarning(error, "Chưa cập nhật được chỉ mục tìm kiếm công khai; sẽ thử lại.");
            }
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
    }
}
