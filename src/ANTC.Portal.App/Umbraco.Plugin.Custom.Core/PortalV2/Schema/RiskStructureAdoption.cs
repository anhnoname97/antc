using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Schema;

/// <summary>Adopt the existing AnVu29 hierarchy, move references and retire only our explicitly identified duplicate branch.</summary>
public sealed class RiskStructureAdoption(IContentService contents, IContentTypeService types, ILogger<RiskStructureAdoption> logger,
    Umbraco.Cms.Core.Web.IUmbracoContextFactory contextFactory, IKeyValueService markers, IContentPublishingService publishing,
    Microsoft.Extensions.Configuration.IConfiguration configuration)
{
    public async Task ApplyAsync()
    {
        using var context = contextFactory.EnsureUmbracoContext();
        var home = contents.GetById(RiskStructure.HomeKey);
        if (home is null || home.Trashed) throw new InvalidOperationException("Không tìm thấy Trang chủ gốc để gắn Các rủi ro của AnVu29.");
        var old = RiskStructure.Pages.ToDictionary(p => PortalV2Keys.Node(p.MockupId), p => p.Key);
        bool haveDuplicates = old.Keys.Any(k => contents.GetById(k) is not null);
        const string marker = "antc.portal-v2.risks.anvu29-adopted";
        bool initializeOrder = markers.GetValue(marker) != "done";
        RiskStructure.Reconciling.Value = true;
        try
        {
            int rootId = home.Id;
            foreach (var page in RiskStructure.Pages)
            {
                var target = contents.GetById(page.Key);
                bool created = target is null;
                if (target?.Trashed == true) throw new InvalidOperationException($"Trang gốc {page.Name} đang trong thùng rác; dừng để không tự khôi phục nội dung đã xóa.");
                if (target is not null && target.ContentType.Alias != page.Alias)
                    throw new InvalidOperationException($"Khóa trang {page.Key} không còn thuộc {page.Alias}.");
                int parent = page.Alias == "ruiRoPage" ? home.Id : rootId;
                if (target is null)
                {
                    target = contents.Create(page.Name, parent, page.Alias); target.Key = page.Key; target.SortOrder = page.Order;
                }
                else if (target.ParentId != parent)
                {
                    // The original group's parent may not have been imported when the duplicate branch existed.
                    if (!contents.Move(target, parent).Success) throw new InvalidOperationException("Không gắn lại được trang gốc " + page.Name);
                    target = contents.GetById(page.Key)!;
                }
                if (created && !contents.Save(target).Success) throw new InvalidOperationException("Không lưu được trang gốc " + page.Name);
                if (page.Alias == "ruiRoPage") rootId = target.Id;
            }
            if (haveDuplicates)
            {
                // Preserve user-created descendants before deleting the duplicate container.
                foreach (var page in RiskStructure.Pages.Reverse())
                {
                    var source = contents.GetById(PortalV2Keys.Node(page.MockupId));
                    if (source is null) continue;
                    var target = contents.GetById(page.Key)!;
                    foreach (var child in contents.GetPagedChildren(source.Id, 0, int.MaxValue, out _).ToArray())
                    {
                        if (old.ContainsKey(child.Key)) continue;
                        if (!contents.Move(child, target.Id).Success) throw new InvalidOperationException("Không bảo toàn được nội dung con " + child.Name);
                    }
                }
                foreach (var type in types.GetAll())
                    foreach (var item in contents.GetPagedOfType(type.Id, 0, int.MaxValue, out _, null))
                    {
                        if (old.ContainsKey(item.Key)) continue;
                        bool changed = false, published = item.Published && !item.Edited;
                        foreach (var property in item.Properties)
                        {
                            if (property.GetValue() is not string text) continue;
                            string rewritten = RewriteReferences(text, old);
                            if (rewritten == text) continue;
                            item.SetValue(property.Alias, rewritten); changed = true;
                        }
                        if (!changed) continue;
                        if (!contents.Save(item).Success) throw new InvalidOperationException("Không chuyển được tham chiếu của " + item.Name);
                        if (published && !contents.Publish(item, ["*"]).Success)
                            throw new InvalidOperationException("Đã lưu nhưng chưa xuất bản lại được tham chiếu của " + item.Name);
                    }
                foreach (var page in RiskStructure.Pages.Reverse())
                {
                    var source = contents.GetById(PortalV2Keys.Node(page.MockupId));
                    if (source is null) continue;
                    if (contents.GetPagedChildren(source.Id, 0, 1, out long children).Any() || children > 0)
                        throw new InvalidOperationException("Nhánh trùng vẫn còn nội dung con; dừng trước khi xóa.");
                    contents.Delete(source);
                    if (contents.GetById(source.Key) is not null) throw new InvalidOperationException("Chưa xóa được nhánh trùng " + source.Name);
                    logger.LogInformation("Đã gỡ trang trùng {OldKey}; dùng trang gốc của AnVu29 {Key} ({Name}).", source.Key, page.Key, page.Name);
                }
            }
            // Remove the replacement document type only after its content and picker references have been migrated.
            if (types.Get("riskCategoryPage") is { } retired)
            {
                if (contents.GetPagedOfType(retired.Id, 0, 1, out long remaining, null).Any() || remaining > 0)
                    throw new InvalidOperationException("riskCategoryPage còn nội dung ngoài bộ trùng đã biết; không xóa loại này.");
                var result = await types.DeleteAsync(retired.Key, Constants.Security.SuperUserKey);
                if (result != Umbraco.Cms.Core.Services.OperationStatus.ContentTypeOperationStatus.Success)
                    throw new InvalidOperationException("Không gỡ được loại nhóm thay thế: " + result);
                logger.LogInformation("Gỡ loại nhóm thay thế riskCategoryPage: {Result}.", result);
            }
            if (initializeOrder || haveDuplicates)
            {
                var order = RiskStructure.Pages.Skip(1).ToDictionary(p => p.Key, p => p.Order);
                var children = contents.GetPagedChildren(rootId, 0, int.MaxValue, out _)
                    .OrderBy(c => order.GetValueOrDefault(c.Key, int.MaxValue)).ThenBy(c => c.SortOrder).ToArray();
                if (!contents.Sort(children).Success) throw new InvalidOperationException("Không khôi phục được thứ tự nhóm của AnVu29.");
                markers.SetValue(marker, "done");
            }
            if (bool.TryParse(configuration["PortalV2:Risks:ClearSampleFields"], out bool clearSamples) && clearSamples)
                await ClearSampleFieldsOnceAsync();
            OrganizeOriginalContentOnce();
        }
        finally { RiskStructure.Reconciling.Value = false; }
    }

    public static string RewriteReferences(string value, IReadOnlyDictionary<Guid, Guid> mapping)
    {
        foreach (var (source, target) in mapping)
            foreach (string format in new[] { "D", "N" })
                value = Regex.Replace(value, Regex.Escape(source.ToString(format)), target.ToString(format), RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        return value;
    }

    private void OrganizeOriginalContentOnce()
    {
        const string marker = "antc.portal-v2.risks.original-content-organized-v1";
        if (markers.GetValue(marker) == "done") return;
        var management = contents.GetById(new Guid("5a1e0af5-bbf2-54ed-a359-bc4716736ea5"))
            ?? throw new InvalidOperationException("Thiếu Quản lý nội dung để gom các trang gốc.");
        var plan = new[]
        {
            (Key: new Guid("9e237cb6-5641-486f-a059-899d2277337e"), Folder: new Guid("77e2e4a9-012b-5566-8542-d033c9c38827"), Alias: "riskArticlePage", FolderAlias: "articleFolder", Name: "Bài viết"),
            (Key: new Guid("58aaf7ff-0544-420e-9c53-36e5630103dd"), Folder: new Guid("dbeceecd-9e82-5d65-a310-6f0d2b15b38c"), Alias: "alertPage", FolderAlias: "alertFolder", Name: "Cảnh báo"),
            (Key: new Guid("0eeca461-0beb-4588-aab2-4d238f0e5db1"), Folder: new Guid("ce68012e-e6e5-53db-9edd-27cb86f92cdf"), Alias: "sharedSnippet", FolderAlias: "snippetFolder", Name: "Đoạn dùng chung")
        };
        // Validate the whole plan before moving anything; never pick a target merely by its display name.
        foreach (var entry in plan)
        {
            var item = contents.GetById(entry.Key);
            var folder = contents.GetById(entry.Folder);
            if (item is null || folder is null || item.Trashed || folder.Trashed
                || item.ContentType.Alias != entry.Alias || folder.ContentType.Alias != entry.FolderAlias
                || folder.ParentId != management.Id || (item.ParentId != management.Id && item.ParentId != folder.Id))
                throw new InvalidOperationException("Cấu trúc " + entry.Name + " khác bộ trang gốc đã đối chiếu; không tự di chuyển.");
        }
        foreach (var entry in plan)
        {
            var item = contents.GetById(entry.Key)!;
            var folder = contents.GetById(entry.Folder)!;
            if (item.ParentId != folder.Id && !contents.Move(item, folder.Id).Success)
                throw new InvalidOperationException("Không gom được trang gốc " + entry.Name);
            item = contents.GetById(entry.Key)!;
            // Remove only the suffix introduced by the old sibling-name collision, preserving authored names.
            if (item.Name == entry.Name + " (1)")
            {
                item.Name = entry.Name;
                if (!contents.Save(item).Success) throw new InvalidOperationException("Không bỏ được hậu tố của " + entry.Name);
            }
            logger.LogInformation("Đã gom trang gốc {Key} vào {Folder}; giữ loại trang và các giá trị biên tập.", entry.Key, entry.Folder);
        }
        markers.SetValue(marker, "done");
    }

    private async Task ClearSampleFieldsOnceAsync()
    {
        const string marker = "antc.portal-v2.risks.sample-fields-cleared-v1";
        if (markers.GetValue(marker) == "done") return;
        foreach (var page in RiskStructure.Pages.Reverse())
        {
            var content = contents.GetById(page.Key) ?? throw new InvalidOperationException("Thiếu trang cần xóa dữ liệu mẫu: " + page.Name);
            if (content.Published)
            {
                var unpublished = await publishing.UnpublishAsync(content.Key, null, Constants.Security.SuperUserKey);
                if (!unpublished.Success) throw new InvalidOperationException("Không gỡ được bản mẫu đã xuất bản của " + page.Name);
                content = contents.GetById(page.Key)!;
            }
            foreach (var property in content.Properties) content.SetValue(property.Alias, (object?)null);
            if (!contents.Save(content).Success) throw new InvalidOperationException("Không xóa được dữ liệu mẫu của " + page.Name);
            logger.LogInformation("Đã để trống các trường biên tập trên {Name} ({Key}); giữ tên và cấu trúc trang.", page.Name, page.Key);
        }
        markers.SetValue(marker, "done");
    }
}
