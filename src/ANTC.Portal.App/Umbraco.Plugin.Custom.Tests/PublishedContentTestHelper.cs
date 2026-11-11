using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services.Navigation;

namespace Umbraco.Plugin.Custom.Tests;

internal static class PublishedContentTestHelper
{
    private sealed record NodeMeta(IPublishedContent? Parent, string? Url);

    private static readonly Lock InitLock = new();
    private static readonly ConditionalWeakTable<IPublishedContent, NodeMeta> Metadata = new();
    private static readonly AsyncLocal<Func<Guid, IPublishedContent?>?> Resolver = new();

    private static void EnsureServiceProvider()
    {
        if (StaticServiceProvider.Instance is not null) return;
        lock (InitLock)
        {
            if (StaticServiceProvider.Instance is not null) return;

            var nav = DispatchProxy.Create<IDocumentNavigationQueryService, DispatchFnProxy>();
            ((DispatchFnProxy)(object)nav).Call = (method, args) =>
            {
                if (method == "TryGetAncestorsKeys")
                {
                    var key = (Guid)args![0]!;
                    var current = Resolver.Value?.Invoke(key);
                    var ancestors = new List<Guid>();
                    while (current is not null && Metadata.TryGetValue(current, out var meta) && meta.Parent is { } parent)
                    {
                        ancestors.Add(parent.Key);
                        current = parent;
                    }
                    args[1] = ancestors.AsEnumerable();
                    return Resolver.Value?.Invoke(key) is not null;
                }
                throw new NotSupportedException(method);
            };

            var filter = DispatchProxy.Create<IPublishedContentStatusFilteringService, DispatchFnProxy>();
            ((DispatchFnProxy)(object)filter).Call = (method, args) =>
            {
                if (method == "Unfiltered")
                {
                    var keys = (IEnumerable<Guid>)args![0]!;
                    return keys.Select(k => Resolver.Value?.Invoke(k)).OfType<IPublishedContent>().ToArray();
                }
                throw new NotSupportedException(method);
            };

            var urls = DispatchProxy.Create<IPublishedUrlProvider, DispatchFnProxy>();
            ((DispatchFnProxy)(object)urls).Call = (method, args) =>
            {
                if (method == "GetUrl" && args is [IPublishedContent item, ..])
                    return Metadata.TryGetValue(item, out var meta) && meta.Url is { } url ? url : "/";
                throw new NotSupportedException(method);
            };

            StaticServiceProvider.Instance = new ServiceCollection()
                .AddSingleton<IPublishedValueFallback, NoopPublishedValueFallback>()
                .AddSingleton(nav)
                .AddSingleton(filter)
                .AddSingleton(urls)
                .BuildServiceProvider();
        }
    }

    public static IDisposable Scope(params IPublishedContent[] nodes)
    {
        EnsureServiceProvider();
        var map = nodes.ToDictionary(x => x.Key);
        var previous = Resolver.Value;
        Resolver.Value = key => map.GetValueOrDefault(key);
        return new ResetScope(() => Resolver.Value = previous);
    }

    public static IPublishedContent Content(
        string alias,
        string name,
        Guid? key = null,
        int level = 2,
        int templateId = 1,
        string? url = null,
        IPublishedContent? parent = null,
        DateTime? updateDate = null,
        params (string Alias, object? Value)[] values)
    {
        EnsureServiceProvider();

        Guid id = key ?? Guid.NewGuid();
        var contentType = DispatchProxy.Create<IPublishedContentType, DispatchFnProxy>();
        ((DispatchFnProxy)(object)contentType).Call = (method, _) => method switch
        {
            "get_Alias" => alias,
            "get_ItemType" => PublishedItemType.Content,
            _ => throw new NotSupportedException(method)
        };

        var properties = new Dictionary<string, IPublishedProperty>(StringComparer.OrdinalIgnoreCase);
        foreach (var (propAlias, value) in values)
        {
            var prop = DispatchProxy.Create<IPublishedProperty, DispatchFnProxy>();
            ((DispatchFnProxy)(object)prop).Call = (method, _) => method switch
            {
                "get_Alias" => propAlias,
                "HasValue" => value is string s ? !string.IsNullOrEmpty(s) : value is not null,
                "GetValue" => value,
                "GetSourceValue" => value,
                _ => throw new NotSupportedException(method)
            };
            properties[propAlias] = prop;
        }

        DateTime updated = updateDate ?? new DateTime(2026, 11, 10);
        var node = DispatchProxy.Create<IPublishedContent, DispatchFnProxy>();
        ((DispatchFnProxy)(object)node).Call = (method, args) => method switch
        {
            "get_Key" => id,
            "get_Name" => name,
            "get_Level" => level,
            "get_TemplateId" => templateId,
            "get_UpdateDate" => updated,
            "get_ContentType" => contentType,
            "get_Properties" => properties.Values,
            "HasProperty" => properties.ContainsKey((string)args![0]!),
            "GetProperty" => properties.GetValueOrDefault((string)args![0]!),
            _ => throw new NotSupportedException(method)
        };
        Metadata.Add(node, new NodeMeta(parent, url));
        return node;
    }

    public class DispatchFnProxy : DispatchProxy
    {
        public Func<string, object?[]?, object?> Call = null!;
        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args) => Call(targetMethod!.Name, args);
    }

    private sealed class ResetScope(Action onDispose) : IDisposable
    {
        public void Dispose() => onDispose();
    }
}
