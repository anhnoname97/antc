using Umbraco.Plugin.Custom.Core.PortalV2.RuiRo;
using Xunit;

namespace Umbraco.Plugin.Custom.Tests;

public class AlertListTests
{
    private static readonly DateTime Today = new(2026, 11, 9);

    private static AlertListItem Item(string title, int daysAgo, string level = "cao", string[]? channels = null,
        string[]? audiences = null, string summary = "", string keywords = "") =>
        new($"/cac-rui-ro/canh-bao-moi/{AlertList.Slug(title)}/", title, summary, null, Today.AddDays(-daysAgo), level,
            channels ?? [], audiences ?? [], keywords, 1);

    private static AlertListQuery Query(string? text = null, string? channel = null, string? audience = null, string? level = null, string? date = null) =>
        new(text, channel, audience, level, date);

    [Fact]
    public void Splits_fresh_and_archived_at_90_days_newest_first()
    {
        var result = AlertList.Apply([Item("Cu", 91), Item("Moi", 1), Item("Bien", 90)], Query(), Today);
        Assert.Equal(["Moi", "Bien"], result.Fresh.Select(x => x.Title));
        Assert.Equal("Cu", Assert.Single(result.Archived).Title);
        Assert.Equal(3, result.Total);
    }

    [Fact]
    public void Alert_without_date_goes_to_archive()
    {
        var undated = Item("Khong ngay", 0) with { Updated = null };
        Assert.Single(AlertList.Apply([undated], Query(), Today).Archived);
    }

    [Theory]
    [InlineData(AlertList.Last30Days, new[] { "A" })]
    [InlineData(AlertList.Last90Days, new[] { "A", "B" })]
    [InlineData(AlertList.Archive, new[] { "C" })]
    public void Date_filter_uses_updated_date(string date, string[] expected)
    {
        var result = AlertList.Apply([Item("A", 30), Item("B", 31), Item("C", 120)], Query(date: date), Today);
        Assert.Equal(expected, result.Fresh.Concat(result.Archived).Select(x => x.Title));
    }

    [Fact]
    public void Channel_audience_and_level_filters_combine()
    {
        var items = new[]
        {
            Item("Khop", 1, "rat-cao", ["tin-nhan"], ["nguoi-cao-tuoi"]),
            Item("Sai kenh", 1, "rat-cao", ["dien-thoai"], ["nguoi-cao-tuoi"]),
            Item("Sai muc", 1, "cao", ["tin-nhan"], ["nguoi-cao-tuoi"])
        };
        var result = AlertList.Apply(items, Query(channel: "tin-nhan", audience: "nguoi-cao-tuoi", level: "rat-cao"), Today);
        Assert.Equal("Khop", Assert.Single(result.Fresh).Title);
    }

    [Fact]
    public void Text_search_ignores_diacritics_and_puts_title_matches_first()
    {
        var items = new[]
        {
            Item("Tin nhắn mạo danh ngân hàng", 5, summary: "Đường link giả"),
            Item("Ứng dụng vay nhanh", 1, summary: "Ngân hàng không cho vay kiểu này"),
            Item("Nhiệm vụ trực tuyến", 2)
        };
        var result = AlertList.Apply(items, Query(text: "ngan hang"), Today);
        Assert.Equal(["Tin nhắn mạo danh ngân hàng", "Ứng dụng vay nhanh"], result.Fresh.Select(x => x.Title));
        Assert.Empty(result.Archived);
    }

    [Fact]
    public void Text_search_also_reads_keywords_and_shows_archived_matches()
    {
        var result = AlertList.Apply([Item("Cũ", 200, keywords: "crypto tiền ảo")], Query(text: "Tiền ẢO"), Today);
        Assert.Single(result.Fresh);
    }

    [Theory]
    [InlineData("0912345678")]
    [InlineData("0912 345 678")]
    [InlineData("STK 1234.5678")]
    public void Long_digit_strings_are_blocked(string text)
    {
        var result = AlertList.Apply([Item("A", 1)], Query(text: text), Today);
        Assert.True(result.BlockedDigits);
        Assert.Equal(0, result.Total);
    }

    [Fact]
    public void Group_mode_keeps_given_order_and_never_archives()
    {
        var items = new[]
        {
            Item("Cảnh báo cũ", 200),
            Item("Bài hướng dẫn", 1) with { Kind = "lv", Updated = null },
            Item("Thủ đoạn", 5) with { Kind = "tac" }
        };
        var result = AlertList.Apply(items, Query(date: AlertList.Last30Days), Today, group: true);
        Assert.Equal(["Cảnh báo cũ", "Bài hướng dẫn", "Thủ đoạn"], result.Fresh.Select(x => x.Title));
        Assert.Empty(result.Archived);
    }

    [Fact]
    public void Only_alerts_can_be_archived()
    {
        Assert.False(AlertList.IsArchived(Item("Bài", 500) with { Kind = "lv" }, Today));
        Assert.True(AlertList.IsArchived(Item("Cảnh báo", 500), Today));
    }

    [Theory]
    [InlineData("cb", "Cảnh báo", 0)]
    [InlineData("lv", "Bài hướng dẫn", 1)]
    [InlineData("pb", "Việc cần làm ngay", 2)]
    [InlineData("tac", "Thủ đoạn", 3)]
    [InlineData("doc", "Bài đọc chuyên đề", 4)]
    [InlineData("art", "Bài đọc thêm", 5)]
    public void Kinds_follow_the_mockup(string kind, string name, int order)
    {
        Assert.Equal(name, AlertList.KindName(kind));
        Assert.Equal(order, AlertList.KindOrder(kind));
    }

    [Theory]
    [InlineData("12345", false)]
    [InlineData("mã 123456", true)]
    [InlineData(null, false)]
    public void Digit_rule_starts_at_six(string? text, bool blocked) => Assert.Equal(blocked, AlertList.HasLongDigits(text));

    [Theory]
    [InlineData("Người cao tuổi", "nguoi-cao-tuoi")]
    [InlineData("Đối tượng: học sinh, sinh viên", "doi-tuong-hoc-sinh-sinh-vien")]
    [InlineData("", "")]
    public void Slug_removes_vietnamese_marks(string text, string slug) => Assert.Equal(slug, AlertList.Slug(text));

    [Theory]
    [InlineData("Rất cao", "rat-cao", "d")]
    [InlineData("Cao", "cao", "h")]
    [InlineData("Cần thận trọng", "can-than-trong", "n")]
    [InlineData(null, "", "n")]
    public void Levels_map_to_codes_and_tones(string? name, string code, string tone)
    {
        Assert.Equal(code, AlertList.LevelCode(name));
        Assert.Equal(tone, AlertList.LevelTone(code));
    }

    [Theory]
    [InlineData(null, 1)]
    [InlineData("một hai ba", 1)]
    public void Reading_time_is_at_least_one_minute(string? text, int minutes) => Assert.Equal(minutes, AlertList.ReadingMinutes(text));

    [Fact]
    public void Reading_time_counts_text_twice_at_180_words_per_minute() =>
        Assert.Equal(2, AlertList.ReadingMinutes(string.Join(' ', Enumerable.Repeat("chữ", 180))));
}
