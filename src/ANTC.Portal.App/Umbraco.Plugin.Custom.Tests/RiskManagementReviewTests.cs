using System.Reflection;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Services.OperationStatus;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Security.Authorization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Umbraco.Plugin.Custom.Core.PortalV2.Schema;

namespace Umbraco.Plugin.Custom.Tests;

public partial class RiskManagementTests
{
    private sealed class ReviewClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 10, 23, 30, 0, TimeSpan.Zero);
    }

    [Fact]
    public void Freshness_UsesVietnamDateAcrossUtcMidnight()
    {
        Assert.Equal(new DateTime(2026, 11, 11), AlertFreshness.Today(new ReviewClock()));
        Assert.Equal(89, AlertFreshness.FreshDaysLeft(new DateTime(2026, 11, 10), AlertFreshness.Today(new ReviewClock())));
        Assert.Null(AlertFreshness.FreshDaysLeft(null, AlertFreshness.Today(new ReviewClock())));
    }

    [Theory]
    [InlineData(0, 90)] [InlineData(90, 0)] [InlineData(91, -1)]
    public void Freshness_CatalogUsesCalendarDays(int age, int remaining) =>
        Assert.Equal(remaining, AlertFreshness.FreshDaysLeft(new DateTime(2026, 11, 11).AddDays(-age), new DateTime(2026, 11, 11)));

    [Theory]
    [InlineData(29, 180)] [InlineData(30, 30)] [InlineData(720, 720)] [InlineData(721, 180)] [InlineData(0, 180)]
    public void AutoUnpublish_NormalizesDeadline(int configured, int expected) => Assert.Equal(expected, AlertFreshness.UnpublishDays(configured));

    [Theory]
    [InlineData("[{}]", "tên tài liệu")]
    [InlineData("[{\"title\":\" \"}]", "tên tài liệu")]
    [InlineData("[{\"title\":\"Nguồn\",\"url\":\"http://example.org\"}]", "https://")]
    [InlineData("{}", "không hợp lệ")]
    [InlineData("[null]", "không hợp lệ")]
    public void Publication_RejectsInvalidReferences(string json, string message) =>
        Assert.Contains(RiskContentRules.Validate(Node("riskArticlePage", "Bài", ("references", json))), x => x.Contains(message));

    [Theory]
    [InlineData("[{\"title\":\"Nguồn\"}]")]
    [InlineData("[{\"title\":\"Nguồn\",\"url\":\"https://example.org\"}]")]
    public void Publication_AllowsReferencesWithTitleAndOptionalHttpsLink(string json) =>
        Assert.DoesNotContain(RiskContentRules.Validate(Node("riskArticlePage", "Bài", ("references", json))), x => x.Contains("nguồn tham khảo") || x.Contains("tên tài liệu"));

    [Theory]
    [InlineData("[{}]")] [InlineData("[{\"steps\":[]}]")] [InlineData("[{\"steps\":[\" \"]}]")]
    public void Publication_RejectsEmptyScenarioSteps(string json) =>
        Assert.Contains(RiskContentRules.Validate(Node("riskArticlePage", "Bài", ("scenarios", json))), x => x.Contains("ít nhất một bước"));

    [Theory]
    [InlineData("Bài hướng dẫn", true)] [InlineData("Bài đọc chuyên đề", true)] [InlineData("Bài đọc thêm", false)]
    public void Publication_SeriesOnlyForFurtherReading(string kind, bool reject) =>
        Assert.Equal(reject, RiskContentRules.Validate(Node("riskArticlePage", "Bài", ("articleKind", new[] { kind }), ("series", "Hiểu đúng"))).Any(x => x == "Loạt bài chỉ dùng cho Bài đọc thêm."));

    [Theory]
    [InlineData("tactics", "thủ đoạn")] [InlineData("channels", "kênh")]
    [InlineData("audiences", "đối tượng")] [InlineData("actionPage", "trang việc cần làm")]
    public void Publication_AlertRequiresEachReference(string alias, string label)
    {
        var values = new Dictionary<string, object?> { ["tactics"] = "x", ["channels"] = "x", ["audiences"] = "x", ["actionPage"] = "x", ["scenarioSteps"] = "1\n2\n3" };
        values.Remove(alias);
        Assert.Contains("Vui lòng nhập " + label + ".", RiskContentRules.Validate(Node("alertPage", "Cảnh báo") with { Values = values }));
    }

    [Theory]
    [InlineData("riskArticlePage")] [InlineData("alertPage")] [InlineData("riskCategoryPage")] [InlineData("alertListPage")]
    public void Publication_ImageNeedsAlternativeText(string type)
    {
        Assert.Contains(RiskContentRules.Validate(Node(type, "Trang", ("illustration", "image"))), x => x.Contains("văn bản thay thế"));
        Assert.DoesNotContain(RiskContentRules.Validate(Node(type, "Trang", ("illustration", "image"), ("illustrationAlt", "Mô tả"))), x => x.Contains("văn bản thay thế"));
    }

    private static readonly IShortStringHelper Strings = new DefaultShortStringHelper(Options.Create(new RequestHandlerSettings()));
    private static Content Content(string alias, Guid? key = null, params (string Alias, object? Value)[] fields)
    {
        var type = new ContentType(Strings, -1) { Alias = alias, Name = alias, Key = Guid.NewGuid() };
        foreach (var field in fields) type.AddPropertyType(new PropertyType(Strings, "Umbraco.TextBox", ValueStorageType.Ntext, field.Alias));
        var content = new Content("Kiểm thử", -1, type) { Key = key ?? Guid.NewGuid() };
        foreach (var field in fields) content.SetValue(field.Alias, field.Value);
        return content;
    }

    [Fact]
    public void FixedPages_RejectDeleteMoveRecycleAndDuplicates_ButAllowEditingAndSorting()
    {
        var handler = new RiskFixedPages();
        var item = Content("luaDaoPage", RiskStructure.Pages.Single(p => p.Alias == "luaDaoPage").Key);
        var deletion = new ContentDeletingNotification(item, new EventMessages()); handler.Handle(deletion); Assert.True(deletion.Cancel);
        var move = new ContentMovingNotification(new MoveEventInfo<IContent>(item, "-1", Guid.NewGuid()), new EventMessages()); handler.Handle(move); Assert.True(move.Cancel);
        var recycle = new ContentMovingToRecycleBinNotification(new MoveToRecycleBinEventInfo<IContent>(item, "-1"), new EventMessages()); handler.Handle(recycle); Assert.True(recycle.Cancel);
        var duplicate = new ContentSavingNotification(Content("luaDaoPage"), new EventMessages()); handler.Handle(duplicate); Assert.True(duplicate.Cancel);
        var edit = new ContentSavingNotification(item, new EventMessages()); handler.Handle(edit); Assert.False(edit.Cancel);
        Assert.False(typeof(INotificationHandler<ContentSortingNotification>).IsAssignableFrom(handler.GetType()));
    }

    [Theory]
    [InlineData("Bài hướng dẫn", false)] [InlineData("Bài đọc thêm", true)] [InlineData("Bài đọc chuyên đề", true)]
    public void TacticContainingArticle_MustBeGuide(string kind, bool reject)
    {
        var article = Content("riskArticlePage", null, ("articleKind", JsonSerializer.Serialize(new[] { kind })));
        var service = Proxy<IContentService>((m, a) => m == "GetById" ? article : throw new NotSupportedException(m));
        var tactic = Content("tacticItem", null, ("containingArticle", "umb://document/" + article.Key.ToString("N")));
        var notification = new ContentPublishingNotification(tactic, new EventMessages());
        new RiskContentRules(service, null!, new ReviewClock()).Handle(notification);
        Assert.Equal(reject, notification.Cancel);
    }

    private sealed class Source : IRiskContentSource
    {
        public IReadOnlyList<RiskNode> Nodes = [];
        public int Reads;
        public IReadOnlyList<RiskNode> Read(bool published) { Reads++; return published ? Nodes.Where(n => n.Published).ToArray() : Nodes; }
    }
    private static (ServiceProvider Provider, RiskContentCache Cache) Cache(Source source)
    {
        var provider = new ServiceCollection().AddSingleton<IRiskContentSource>(source).BuildServiceProvider();
        return (provider, new RiskContentCache(provider.GetRequiredService<IServiceScopeFactory>(), new ReviewClock()));
    }

    [Fact]
    public void Cache_SeparatesPublishedAndDrafts_BypassesPreview_AndInvalidatesAfterPublishing()
    {
        var first = Node("tacticItem", "Đã đăng");
        var source = new Source { Nodes = [first, Node("tacticItem", "Nháp") with { Published = false }] };
        var (provider, cache) = Cache(source); using var dispose = provider;
        Assert.Single(cache.Get()); Assert.Single(cache.Get()); Assert.Equal(1, source.Reads);
        Assert.Equal(2, cache.Get(published: false).Count); Assert.Equal(2, source.Reads);
        cache.Get(preview: true); cache.Get(preview: true); Assert.Equal(4, source.Reads);
        var added = Content("tacticItem"); source.Nodes = [first, Node("tacticItem", "Mới") with { Key = added.Key }];
        new RiskContentCacheInvalidator(cache).Handle(new ContentPublishedNotification(added, new EventMessages()));
        Assert.Contains(cache.Get(), n => n.Key == added.Key); Assert.Equal(5, source.Reads);
    }

    [Fact]
    public void AudienceLookup_IsNotReloadedOnEachAlertSave_ButRefreshesWhenAudienceChanges()
    {
        var source = new Source { Nodes = [Node("audienceItem", "A")] };
        var (provider, cache) = Cache(source); using var dispose = provider;
        Assert.Single(cache.GetAudiences()); Assert.Equal(1, source.Reads);
        var invalidator = new RiskContentCacheInvalidator(cache);
        invalidator.Handle(new ContentSavedNotification(Content("alertPage"), new EventMessages()));
        Assert.Single(cache.GetAudiences()); Assert.Equal(1, source.Reads);
        source.Nodes = [.. source.Nodes, Node("audienceItem", "B")];
        invalidator.Handle(new ContentSavedNotification(Content("audienceItem"), new EventMessages()));
        Assert.Equal(2, cache.GetAudiences().Count); Assert.Equal(2, source.Reads);
    }

    [Fact]
    public void AlertSaving_FillsEmptyFieldsFromCache_PreservesEditorialSelections_AndUsesVietnamDay()
    {
        var channel = Guid.NewGuid(); var tactic = Content("tacticItem", null, ("channels", "umb://document/" + channel.ToString("N")));
        var audience = Node("audienceItem", "Đối tượng", ("tactics", "umb://document/" + tactic.Key.ToString("N")));
        var (provider, cache) = Cache(new Source { Nodes = [audience] }); using var dispose = provider;
        var service = Proxy<IContentService>((m, a) => m == "GetById" ? tactic : throw new NotSupportedException(m));
        var alert = Content("alertPage", null, ("tactics", "umb://document/" + tactic.Key.ToString("N")), ("channels", null), ("audiences", null), ("updatedDate", null), ("autoUnpublishDays", null));
        var handler = new RiskContentRules(service, cache, new ReviewClock());
        handler.Handle(new ContentSavingNotification(alert, new EventMessages()));
        Assert.Equal("umb://document/" + channel.ToString("N"), alert.GetValue<string>("channels"));
        Assert.Equal("umb://document/" + audience.Key.ToString("N"), alert.GetValue<string>("audiences"));
        Assert.Equal(new DateTime(2026, 11, 11), alert.GetValue<DateTime>("updatedDate"));
        alert.SetValue("channels", "manual-channel"); alert.SetValue("audiences", "manual-audience");
        handler.Handle(new ContentSavingNotification(alert, new EventMessages()));
        Assert.Equal("manual-channel", alert.GetValue<string>("channels")); Assert.Equal("manual-audience", alert.GetValue<string>("audiences"));
    }

    [Fact]
    public async Task Catalog_ProjectsOnlyListFields_AndRechecksPermissionsOnEveryRequest()
    {
        var visible = Node("alertPage", "Cho đọc", ("title", "Tiêu đề"), ("readingBody", "secret"), ("summary", "secret"), ("updatedDate", "2026-11-10"));
        var hidden = Node("riskArticlePage", "Không cho đọc");
        var (provider, cache) = Cache(new Source { Nodes = [visible, hidden] }); using var dispose = provider;
        var user = Proxy<IUser>((m, a) => m == "get_IsApproved" ? true : m == "get_IsLockedOut" ? false : throw new NotSupportedException(m));
        var auth = Proxy<IAuthorizationHelper>((m, a) => { if (m == "TryGetUmbracoUser") { a![1] = user; return true; } throw new NotSupportedException(m); });
        var allowed = new HashSet<Guid> { visible.Key };
        var permissions = Proxy<IContentPermissionAuthorizer>((m, a) => Task.FromResult<ISet<Guid>>(allowed));
        var controller = new RiskBackofficeController(null!, auth, permissions, new RuiRoDerivation(), cache, new ReviewClock(), null!)
        { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        string Serialize(OkObjectResult result) => JsonSerializer.Serialize(result.Value, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        string json = Serialize(Assert.IsType<OkObjectResult>(await controller.Catalog()));
        Assert.Contains(visible.Key.ToString(), json); Assert.DoesNotContain(hidden.Key.ToString(), json);
        Assert.DoesNotContain("readingBody", json); Assert.DoesNotContain("summary", json); Assert.DoesNotContain("siteSettings", RiskContentSource.Aliases);
        Assert.Contains("\"freshDaysLeft\":89", json);
        Assert.Equal("[]", Serialize(Assert.IsType<OkObjectResult>(await controller.Catalog(type: "riskArticlePage"))));
        allowed.Clear(); Assert.Equal("[]", Serialize(Assert.IsType<OkObjectResult>(await controller.Catalog())));
    }

    [Theory]
    [InlineData("Production", true, RuntimeLevel.Run)]
    [InlineData("Development", false, RuntimeLevel.Run)]
    [InlineData("Development", true, RuntimeLevel.Install)]
    [InlineData("Development", true, RuntimeLevel.Run)]
    public async Task Migration_DoesNotTouchSchema_WhenDisabledOrHomeIsMissing(string environment, bool enabled, RuntimeLevel level)
    {
        var env = Proxy<IHostEnvironment>((m, a) => m == "get_EnvironmentName" ? environment : throw new NotSupportedException(m));
        var runtime = Proxy<IRuntimeState>((m, a) => m == "get_Level" ? level : throw new NotSupportedException(m));
        var contents = Proxy<IContentService>((m, a) => m == "GetById" ? null : throw new NotSupportedException(m));
        var migration = new RiskSchemaMigration(null!, contents, null!, null!, null!, env,
            Options.Create(new PortalV2SchemaOptions { Enabled = enabled }), runtime, null!, NullLogger<RiskSchemaMigration>.Instance);
        await migration.HandleAsync(null!, CancellationToken.None);
    }

    [Fact]
    public async Task AutoUnpublish_ReadsPublishedDateAndTtl_DespiteNewerDraft()
    {
        var today = AlertFreshness.Today(new ReviewClock());
        var item = Content("alertPage", null, ("updatedDate", today.AddDays(-181)), ("autoUnpublishDays", 0));
        item.Published = true;
        foreach (var property in item.Properties) property.PublishValues();
        item.SetValue("updatedDate", today); item.SetValue("autoUnpublishDays", 720);
        int unpublished = 0;
        var contents = Proxy<IContentService>((m, a) =>
        {
            if (m != "GetPagedOfTypes") throw new NotSupportedException(m);
            a![3] = 1L; return new IContent[] { item };
        });
        var types = Proxy<IContentTypeService>((m, a) => new ContentType(Strings, -1) { Alias = "alertPage", Name = "Cảnh báo" });
        var publisher = Proxy<IContentPublishingService>((m, a) =>
        {
            unpublished++;
            return Task.FromResult(Attempt.Succeed(ContentPublishingOperationStatus.Success));
        });
        var audit = Proxy<IAuditService>((m, a) => null);
        using var provider = new ServiceCollection().AddSingleton(contents).AddSingleton(types).AddSingleton(publisher).AddSingleton(audit).BuildServiceProvider();
        var job = new AlertAutoUnpublishJob(provider.GetRequiredService<IServiceScopeFactory>(), new ReviewClock(), NullLogger<AlertAutoUnpublishJob>.Instance);
        await job.RunJobAsync(CancellationToken.None);
        Assert.Equal(1, unpublished);
    }

    private static T Proxy<T>(Func<string, object?[]?, object?> invoke) where T : class
    {
        var proxy = DispatchProxy.Create<T, ReviewProxy>(); ((ReviewProxy)(object)proxy).Call = invoke; return proxy;
    }
    public class ReviewProxy : DispatchProxy
    {
        public Func<string, object?[]?, object?> Call = null!;
        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args) => Call(targetMethod!.Name, args);
    }
}
