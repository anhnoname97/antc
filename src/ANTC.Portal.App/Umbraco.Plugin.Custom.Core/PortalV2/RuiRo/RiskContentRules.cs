using System.Text.Json;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

public sealed class RiskContentRules(IContentService contents, IContentTypeService types) : INotificationHandler<ContentSavingNotification>, INotificationHandler<ContentPublishingNotification>
{
    private static RiskNode Node(IContent c) => new(c.Key, null, Umbraco.Plugin.Custom.Core.PortalV2.Schema.RiskStructure.LogicalAlias(c.ContentType.Alias), c.Name ?? "", c.SortOrder, c.UpdateDate, c.Published,
        c.Properties.ToDictionary(p => p.Alias, p => p.GetValue()));

    public void Handle(ContentSavingNotification notification)
    {
        if (Schema.RiskStructure.Reconciling.Value) return;
        foreach (var c in notification.SavedEntities.Where(x => x.ContentType.Alias == "alertPage"))
        {
            var node = Node(c);
            if (!node.Has("autoUnpublishDays")) c.SetValue("autoUnpublishDays", 180);
            if (!node.Has("updatedDate")) c.SetValue("updatedDate", DateTime.Today);
            // Fill empty channels from tactics. Existing editorial values are retained.
            if (!node.Has("channels"))
            {
                var channelIds = node.Refs("tactics").Select(contents.GetById).OfType<IContent>().SelectMany(t => Node(t).Refs("channels")).Distinct();
                c.SetValue("channels", string.Join(",", channelIds.Select(k => "umb://document/" + k.ToString("N"))));
            }
            if (!node.Has("audiences") && types.Get("audienceItem") is { } audienceType)
            {
                var tactics = node.Refs("tactics").ToHashSet();
                var audiences = contents.GetPagedOfType(audienceType.Id, 0, int.MaxValue, out _, null)
                    .Where(x => !x.Trashed && Node(x).Refs("tactics").Any(tactics.Contains));
                c.SetValue("audiences", string.Join(",", audiences.Select(a => "umb://document/" + a.Key.ToString("N"))));
            }
        }
    }

    public void Handle(ContentPublishingNotification notification)
    {
        foreach (var c in notification.PublishedEntities)
        {
            var n = Node(c);
            foreach (var error in Validate(n)) notification.CancelOperation(new EventMessage("Kiểm tra trước khi xuất bản", error, EventMessageType.Error));
            if (n.Type == "tacticItem" && n.Refs("containingArticle").FirstOrDefault() is var key && key != Guid.Empty)
            {
                var article = contents.GetById(key);
                if (article is null || article.Trashed || article.ContentType.Alias != "riskArticlePage" || !Node(article).IsKind("huongDan"))
                    notification.CancelOperation(new EventMessage("Kiểm tra trước khi xuất bản", "Bài viết chứa thủ đoạn phải là một Bài hướng dẫn.", EventMessageType.Error));
            }
        }
    }

    public static IReadOnlyList<string> Validate(RiskNode n)
    {
        var errors = new List<string>();
        void Need(string alias, string name) { if (!n.Has(alias)) errors.Add("Vui lòng nhập " + name + "."); }
        if (n.Type is "riskArticlePage" or "alertPage" or "riskCategoryPage" or "alertListPage")
            if (n.Has("illustration") && !n.Has("illustrationAlt")) errors.Add("Vui lòng nhập văn bản thay thế cho ảnh minh họa.");
        if (n.Type == "riskArticlePage")
        {
            Need("summary", "tóm tắt"); Need("references", "ít nhất một nguồn tham khảo"); Need("reviewDate", "ngày rà soát"); Need("reviewer", "người thẩm định");
            if (!n.IsKind("docThem")) Need("topic", "chuyên đề");
            if (!n.IsKind("docChuyenDe")) Need("description", "một câu mời đọc");
            if (n.IsKind("huongDan")) { Need("warningSigns", "dấu hiệu cảnh báo"); Need("actionsNow", "việc cần làm ngay"); }
            if (n.Strings("series").Count > 1) errors.Add("Loạt bài chỉ nhận một giá trị.");
        }
        if (n.Type == "alertPage")
        {
            if (n.Lines("scenarioSteps").Count is < 3 or > 5) errors.Add("Kịch bản thường gặp cần 3–5 bước.");
            Need("tactics", "thủ đoạn"); Need("channels", "kênh"); Need("audiences", "đối tượng"); Need("actionPage", "trang việc cần làm");
        }
        if (n.Type == "tacticItem") Need("containingArticle", "bài viết chứa thủ đoạn");
        return errors;
    }
}
