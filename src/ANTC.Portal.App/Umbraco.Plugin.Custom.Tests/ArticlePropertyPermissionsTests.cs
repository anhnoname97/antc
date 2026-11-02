using System.Text.Json;
using Umbraco.Cms.Api.Management.ViewModels.Document;
using Umbraco.Cms.Core.Models.Membership.Permissions;
using Umbraco.Plugin.Custom.Core.Articles;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class ArticlePropertyPermissionsTests
{
    private static readonly Guid Type = Guid.NewGuid();
    private static readonly Guid Property = Guid.NewGuid();
    private static readonly HashSet<string> Restricted = new(StringComparer.OrdinalIgnoreCase) { "summary", "body" };
    private static DocumentPropertyValueGranularPermission Rule(string verb, Guid? type = null) => new() { Key = type ?? Type, Permission = $"{Property}|{verb}" };
    private static DocumentValueModel Value(string alias, object? value, string? culture = null) => new() { Alias = alias, Value = value, Culture = culture };

    [Fact] public void Fallback_is_used_only_without_a_matching_rule()
    {
        Assert.False(ArticlePropertyPermissions.CanWrite(Property, [], []));
        Assert.True(ArticlePropertyPermissions.CanWrite(Property, [ArticlePropertyPermissions.Write], []));
        Assert.False(ArticlePropertyPermissions.CanWrite(Property, [ArticlePropertyPermissions.Write], [Rule("Umb.Document.PropertyValue.Read")]));
        Assert.False(ArticlePropertyPermissions.CanWrite(Property, [ArticlePropertyPermissions.Write], [Rule("", Guid.NewGuid())]));
    }
    [Fact] public void Explicit_empty_permission_denies_write_but_groups_can_union_an_explicit_write()
    {
        Assert.False(ArticlePropertyPermissions.CanWrite(Property, [ArticlePropertyPermissions.Write], [Rule("")]));
        Assert.True(ArticlePropertyPermissions.CanWrite(Property, [], [Rule(""), Rule(ArticlePropertyPermissions.Write)]));
    }
    [Fact] public void Json_objects_compare_semantically_and_regular_fields_can_change()
    {
        var before = JsonSerializer.Deserialize<JsonElement>("{\"markup\":\"<p>Giữ nguyên</p>\",\"blocks\":{}}");
        var after = JsonSerializer.Deserialize<JsonElement>("{\"blocks\":{},\"markup\":\"<p>Giữ nguyên</p>\"}");
        Assert.False(ArticlePropertyPermissions.Changed([Value("body", before), Value("safeAction", "old")],
            [Value("body", after), Value("safeAction", "new")], Restricted));
    }
    [Fact] public void Server_editor_objects_use_the_same_json_contract_as_the_management_api()
    {
        var server = new { Markup = "<p>Giữ nguyên</p>", Blocks = new { ContentData = Array.Empty<object>() } };
        var client = JsonSerializer.Deserialize<JsonElement>("""{"markup":"<p>Giữ nguyên</p>","blocks":{"contentData":[]}}""");
        Assert.False(ArticlePropertyPermissions.Changed([Value("body", server)], [Value("body", client)],
            Restricted, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }
    [Fact] public void Removal_and_case_variation_cannot_bypass_protection()
    {
        Assert.True(ArticlePropertyPermissions.Changed([Value("summary", "Giữ nguyên")], [], Restricted));
        Assert.True(ArticlePropertyPermissions.Changed([Value("summary", "Giữ nguyên")], [Value("SUMMARY", "Sửa")], Restricted));
        Assert.False(ArticlePropertyPermissions.Changed([Value("summary", "Giữ nguyên")], [Value("SUMMARY", "Giữ nguyên")], Restricted));
    }
    [Fact] public void Duplicate_restricted_values_are_rejected()
    {
        Assert.True(ArticlePropertyPermissions.Changed([Value("summary", "old")], [Value("summary", "old"), Value("summary", "new")], Restricted));
    }
    [Fact] public void New_documents_may_leave_locked_values_null_but_not_populate_them()
    {
        Assert.False(ArticlePropertyPermissions.Changed([], [Value("summary", null)], Restricted));
        Assert.True(ArticlePropertyPermissions.Changed([], [Value("summary", "new")], Restricted));
    }
    [Fact] public void Culture_and_segment_values_are_checked_separately()
    {
        Assert.False(ArticlePropertyPermissions.Changed([Value("summary", "same", "vi-VN")], [Value("summary", "same", "VI-vn")], Restricted));
        Assert.True(ArticlePropertyPermissions.Changed([Value("summary", "same", "vi-VN")], [Value("summary", "same", "en-US")], Restricted));
    }
}
