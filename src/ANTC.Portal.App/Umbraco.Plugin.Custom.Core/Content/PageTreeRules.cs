namespace Umbraco.Plugin.Custom.Core.Content;

/// <summary>Quy tắc của cây trang; dùng cả khi nhập uSync và biên tập trong backoffice.</summary>
public static class PageTreeRules
{
    private static readonly HashSet<string> FixedPages = new(StringComparer.Ordinal)
    {
        "ungPhoPage", "thuDoanPage", "thamGiaPage", "thiThuPage",
        "thiPage", "hoiDapPage", "chinhSachPage", "searchPage"
    };

    public static bool IsSingleton(string alias) =>
        alias is "antc" or "pageManagement" or "contentManagement" or "articleManagement" or "home"
        || FixedPages.Contains(alias);

    public static string? Validate(
        string alias, string? parentAlias, string? listRole, bool duplicate)
    {
        if (alias == "antc")
        {
            if (parentAlias is not null) return "An toàn tài chính phải được đặt ở gốc cây nội dung.";
        }
        else if (alias is "pageManagement" or "contentManagement")
        {
            if (parentAlias != "antc") return "Quản lý trang và Quản lý nội dung phải nằm dưới An toàn tài chính.";
        }
        else if (alias == "articleManagement")
        {
            if (parentAlias != "contentManagement") return "Kho Thủ đoạn phải nằm trong Quản lý nội dung.";
        }
        else if (alias == "home")
        {
            if (parentAlias != "pageManagement") return "Trang chủ phải nằm trong Quản lý trang.";
        }
        else if (FixedPages.Contains(alias))
        {
            if (parentAlias != "home") return "Trang cố định phải được đặt trực tiếp dưới Trang chủ.";
        }
        else if (alias == "articleList")
        {
            if (parentAlias == "contentManagement")
            {
                if (listRole != "Chính sách") return "Chỉ danh mục Chính sách đặt trực tiếp trong Quản lý nội dung; các danh mục còn lại đặt trong kho Thủ đoạn.";
            }
            else if (parentAlias != "articleManagement" || listRole == "Chính sách")
            {
                return "Danh mục bài viết đặt trong Quản lý nội dung → Thủ đoạn; riêng Chính sách đặt trực tiếp trong Quản lý nội dung.";
            }
        }
        else if (alias == "article" && parentAlias != "articleList")
        {
            return "Bài viết phải được đặt trong một danh mục bài viết.";
        }
        else if (alias == "qaItem" && parentAlias != "hoiDapPage")
        {
            return "Câu trả lời công khai phải được biên tập trong trang Hỏi – Đáp; câu hỏi gửi từ biểu mẫu được tiếp nhận tại trang quản trị.";
        }

        return IsSingleton(alias) && duplicate
            ? "Trang này đã tồn tại. Mỗi loại trang cố định chỉ có một bản; hãy sửa trang đang có."
            : null;
    }
}
