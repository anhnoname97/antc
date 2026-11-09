using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;

/// <summary>Mot the trong danh sach Cac rui ro. Kenh, doi tuong luu theo ma dung tren dia chi loc.
/// Kind theo ban dung: cb canh bao, lv bai huong dan, pb viec can lam ngay, tac thu doan, doc bai doc chuyen de, art bai doc them.</summary>
public sealed record AlertListItem(string Url, string Title, string Summary, string? Agency, DateTime? Updated,
    string Level, IReadOnlyList<string> Channels, IReadOnlyList<string> Audiences, string Keywords, int Minutes,
    string Kind = "cb", string Icon = "mega");

/// <summary>Bo loc doc tu dia chi: ?q=, ?kenh=, ?doi-tuong=, ?muc-do=, ?ngay= (V2-13h).</summary>
public sealed record AlertListQuery(string? Text, string? Channel, string? Audience, string? Level, string? Date)
{
    public bool Any => !string.IsNullOrWhiteSpace(Text) || !string.IsNullOrWhiteSpace(Channel)
        || !string.IsNullOrWhiteSpace(Audience) || !string.IsNullOrWhiteSpace(Level) || !string.IsNullOrWhiteSpace(Date);
}

/// <summary>Fresh: con moi (hoac moi ket qua khi dang tim chu); Archived: qua 90 ngay.</summary>
public sealed record AlertListResult(IReadOnlyList<AlertListItem> Fresh, IReadOnlyList<AlertListItem> Archived, bool BlockedDigits)
{
    public int Total => Fresh.Count + Archived.Count;
}

/// <summary>Luat cua danh sach Canh bao moi theo ban dung v2 (app.js rrFiltered, rrList).</summary>
public static class AlertList
{
    public const string Last30Days = "30";
    public const string Last90Days = "90";
    public const string Archive = "luu-tru";

    /// <summary>Ba muc do theo data type DanhMucMucDoCanThanTrong, theo thu tu tu cao xuong.</summary>
    public static readonly IReadOnlyList<(string Code, string Name)> Levels =
        [("rat-cao", "Rất cao"), ("cao", "Cao"), ("can-than-trong", "Cần thận trọng")];

    public static string LevelCode(string? name) => Levels.FirstOrDefault(x => x.Name == name?.Trim()).Code ?? "";

    /// <summary>Lop mau cua chip muc do: d = dung, h = hoan, n = than trong.</summary>
    public static string LevelTone(string? code) => code switch { "rat-cao" => "d", "cao" => "h", _ => "n" };

    /// <summary>Khong tra cuu theo so dien thoai, so tai khoan: chan chuoi tu 6 chu so tro len.</summary>
    public static bool HasLongDigits(string? text) =>
        !string.IsNullOrEmpty(text) && Regex.IsMatch(Regex.Replace(text, @"[\s.\-]", ""), @"\d{6,}");

    /// <summary>Bo dau, chu thuong, chi giu chu va so, cach nhau mot dau cach.</summary>
    public static string Normalize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";
        var decomposed = text.Replace('đ', 'd').Replace('Đ', 'D').Normalize(NormalizationForm.FormD);
        var plain = new StringBuilder(decomposed.Length);
        foreach (char c in decomposed)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) plain.Append(char.ToLowerInvariant(c));
        return Regex.Replace(plain.ToString(), "[^a-z0-9]+", " ").Trim();
    }

    /// <summary>Ma dung tren dia chi khi danh muc khong co truong code, vi du "Người cao tuổi" -> "nguoi-cao-tuoi".</summary>
    public static string Slug(string? text) => Normalize(text).Replace(' ', '-');

    /// <summary>Thoi gian doc nhu ban dung: so tu cua noi dung tinh hai lan, 180 tu mot phut, it nhat 1 phut.</summary>
    public static int ReadingMinutes(string? text)
    {
        int words = string.IsNullOrWhiteSpace(text) ? 0 : Regex.Matches(Regex.Replace(text, "<[^>]+>", " "), @"\S+").Count;
        return Math.Max(1, (int)Math.Round(words * 2 / 180d, MidpointRounding.AwayFromZero));
    }

    /// <summary>Ten loai hien tren the (KINDNAME cua ban dung).</summary>
    public static string KindName(string kind) => kind switch
    {
        "cb" => "Cảnh báo", "lv" => "Bài hướng dẫn", "tac" => "Thủ đoạn", "doc" => "Bài đọc chuyên đề",
        "art" => "Bài đọc thêm", "pb" => "Việc cần làm ngay", _ => ""
    };

    /// <summary>Thu tu loai trong trang nhom (KINDORDER cua ban dung).</summary>
    public static int KindOrder(string kind) => kind switch { "cb" => 0, "lv" => 1, "pb" => 2, "tac" => 3, "doc" => 4, _ => 5 };

    /// <summary>Chi canh bao moi co moc 90 ngay; bai viet, thu doan khong bao gio vao muc Luu tru.</summary>
    public static bool IsArchived(AlertListItem item, DateTime today) =>
        item.Kind == "cb" && (item.Updated is not { } updated || !AlertFreshness.IsFresh(updated, today));

    /// <param name="group">Trang nhom: giu nguyen thu tu da sap, khong loc Ngay, khong tach muc Luu tru.</param>
    public static AlertListResult Apply(IEnumerable<AlertListItem> items, AlertListQuery query, DateTime today, bool group = false)
    {
        if (HasLongDigits(query.Text)) return new([], [], true);
        int Age(AlertListItem x) => x.Updated is { } d ? AlertFreshness.Age(d, today) : int.MaxValue;
        var filtered = items.Where(x =>
            (string.IsNullOrWhiteSpace(query.Channel) || x.Channels.Contains(query.Channel))
            && (string.IsNullOrWhiteSpace(query.Audience) || x.Audiences.Contains(query.Audience))
            && (string.IsNullOrWhiteSpace(query.Level) || x.Level == query.Level)
            && (group || query.Date switch
            {
                Last30Days => Age(x) <= 30,
                Last90Days => !IsArchived(x, today),
                Archive => IsArchived(x, today),
                _ => true
            }));
        var list = group ? filtered.ToArray()
            : filtered.OrderByDescending(x => x.Updated ?? DateTime.MinValue).ThenBy(x => x.Title, StringComparer.CurrentCulture).ToArray();

        string[] words = Normalize(query.Text).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length > 0)
        {
            // Dang tim chu thi khong tach muc Luu tru; the khop o tieu de dung truoc.
            var matched = list.Select(x => (Item: x, Title: $" {Normalize(x.Title)} ", All: $" {Normalize($"{x.Title} {x.Summary} {x.Agency} {x.Keywords}")} "))
                .Where(x => words.All(w => x.All.Contains(" " + w)))
                .OrderByDescending(x => words.All(w => x.Title.Contains(" " + w)))
                .Select(x => x.Item).ToArray();
            return new(matched, [], false);
        }
        if (group) return new(list, [], false);
        return new(list.Where(x => !IsArchived(x, today)).ToArray(), list.Where(x => IsArchived(x, today)).ToArray(), false);
    }
}
