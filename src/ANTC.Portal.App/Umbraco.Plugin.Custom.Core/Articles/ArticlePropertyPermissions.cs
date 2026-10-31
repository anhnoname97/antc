using System.Text.Json;
using System.Text.Json.Nodes;
using Umbraco.Cms.Core.Models.ContentEditing;
using Umbraco.Cms.Core.Models.Membership.Permissions;

namespace Umbraco.Plugin.Custom.Core.Articles;

/// <summary>Matches Umbraco's aggregate property permissions without inventing new roles.</summary>
public static class ArticlePropertyPermissions
{
    public const string Write = "Umb.Document.PropertyValue.Write";

    public static bool CanWrite(Guid propertyType, IEnumerable<string> fallback,
        IEnumerable<DocumentPropertyValueGranularPermission> granular)
    {
        // Native UI matches by globally unique property key, including inherited
        // composition properties whose stored document-type key can differ.
        var matching = granular
            .Select(p => p.Permission.Split('|', 2))
            .Where(parts => parts.Length == 2 && Guid.TryParse(parts[0], out var key) && key == propertyType)
            .ToArray();
        // An explicit empty verb represents a UI-hidden property. A matching
        // granular rule takes precedence over fallback, just as the native UI does.
        return matching.Length > 0 ? matching.Any(parts => parts[1] == Write) : fallback.Contains(Write);
    }

    public static bool Changed(IEnumerable<ValueModelBase> before, IEnumerable<ValueModelBase> after,
        IReadOnlySet<string> restrictedAliases, JsonSerializerOptions? serializerOptions = null)
    {
        static (string, string, string) Key(ValueModelBase value) =>
            (value.Alias.ToUpperInvariant(), value.Culture?.ToUpperInvariant() ?? "", value.Segment ?? "");
        var oldValues = before.Where(v => restrictedAliases.Contains(v.Alias)).GroupBy(Key).ToDictionary(g => g.Key, g => g.ToArray());
        var newValues = after.Where(v => restrictedAliases.Contains(v.Alias)).GroupBy(Key).ToDictionary(g => g.Key, g => g.ToArray());
        foreach (var key in oldValues.Keys.Union(newValues.Keys))
        {
            oldValues.TryGetValue(key, out var oldEntry);
            newValues.TryGetValue(key, out var newEntry);
            if (newEntry?.Length > 1 || oldEntry?.Length > 1) return true;
            var oldValue = oldEntry?.SingleOrDefault()?.Value;
            var newValue = newEntry?.SingleOrDefault()?.Value;
            if (!JsonNode.DeepEquals(JsonSerializer.SerializeToNode(oldValue, serializerOptions), JsonSerializer.SerializeToNode(newValue, serializerOptions))) return true;
        }
        return false;
    }
}
