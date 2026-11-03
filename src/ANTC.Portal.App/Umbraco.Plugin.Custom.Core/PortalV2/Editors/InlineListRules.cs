using System.Globalization;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;

namespace Umbraco.Plugin.Custom.Core.PortalV2.Editors;

/// <summary>Mot loi kiem: duong dan o (vi du "[1].number") va cau bao tieng Viet.</summary>
public sealed record InlineListError(string Path, string Message);

/// <summary>Kiem gia tri Antc.InlineList theo cau hinh (contract C5). Thuan tuy, khong phu thuoc Umbraco, de test.</summary>
public static class InlineListRules
{
    public const string DocumentUdiPrefix = "umb://document/";

    public static IReadOnlyList<InlineListError> Validate(JsonNode? value, InlineListConfiguration config)
    {
        var errors = new List<InlineListError>();
        ValidateRows(value, config.Fields, config.MinRows, config.MaxRows, config.OptionalSection, "", errors);
        return errors;
    }

    private static void ValidateRows(JsonNode? value, IReadOnlyList<InlineListField> fields, int minRows, int maxRows,
        InlineListOptionalSection? optional, string path, List<InlineListError> errors)
    {
        if (value is null)
        {
            if (minRows > 0) errors.Add(new(path, $"Cần ít nhất {minRows} dòng."));
            return;
        }
        if (value is not JsonArray rows)
        {
            errors.Add(new(path, "Giá trị phải là danh sách dòng."));
            return;
        }
        if (minRows > 0 && rows.Count < minRows) errors.Add(new(path, $"Cần ít nhất {minRows} dòng, đang có {rows.Count}."));
        if (maxRows > 0 && rows.Count > maxRows) errors.Add(new(path, $"Tối đa {maxRows} dòng, đang có {rows.Count}."));

        var keys = new HashSet<string>();
        for (int i = 0; i < rows.Count; i++)
        {
            string rowPath = $"{path}[{i}]";
            if (rows[i] is not JsonObject row)
            {
                errors.Add(new(rowPath, "Dòng không đúng định dạng."));
                continue;
            }
            string? key = Str(row["key"]);
            if (key is null || !Guid.TryParse(key, out _)) errors.Add(new(rowPath + ".key", "Dòng thiếu khóa."));
            else if (!keys.Add(key)) errors.Add(new(rowPath + ".key", "Hai dòng trùng khóa."));

            ValidateFields(row, fields, rowPath, errors);
            if (optional is not null && row[optional.ToggleAlias] is JsonValue on && on.TryGetValue(out bool enabled) && enabled)
                ValidateFields(row, optional.Fields, rowPath, errors);
        }
    }

    private static void ValidateFields(JsonObject row, IReadOnlyList<InlineListField> fields, string rowPath, List<InlineListError> errors)
    {
        foreach (InlineListField field in fields)
        {
            if (!IsVisible(row, field)) continue;
            string p = $"{rowPath}.{field.Alias}";
            JsonNode? v = row[field.Alias];
            if (IsEmpty(v))
            {
                if (field.Required) errors.Add(new(p, (field.Type is "fixed" or "content" ? "Vui lòng chọn " : "Vui lòng nhập ") + Lower(field.Label) + "."));
                if (field.Type == "table" && field.MinRows > 0 && !field.Required) errors.Add(new(p, $"Cần ít nhất {field.MinRows} dòng."));
                continue;
            }
            ValidateValue(v!, field, p, errors);
        }
    }

    private static void ValidateValue(JsonNode v, InlineListField field, string p, List<InlineListError> errors)
    {
        switch (field.Type)
        {
            case "text":
            case "area":
            {
                string? s = Str(v);
                if (s is null) { errors.Add(new(p, "Phải là chữ.")); return; }
                if (field.MaxChars is > 0 && s.Length > field.MaxChars) errors.Add(new(p, $"Tối đa {field.MaxChars} ký tự, đang có {s.Length}."));
                if (!string.IsNullOrEmpty(field.Pattern) && !Regex.IsMatch(s, field.Pattern, RegexOptions.None, TimeSpan.FromSeconds(1)))
                    errors.Add(new(p, field.PatternMessage ?? "Sai định dạng."));
                return;
            }
            case "number":
            {
                if (v is not JsonValue n || !n.TryGetValue(out decimal d)) { errors.Add(new(p, "Phải là số.")); return; }
                if (field.Min is { } min && d < min || field.Max is { } max && d > max)
                    errors.Add(new(p, $"Nhập số từ {field.Min?.ToString(CultureInfo.InvariantCulture) ?? "…"} đến {field.Max?.ToString(CultureInfo.InvariantCulture) ?? "…"}."));
                return;
            }
            case "date":
                if (!DateOnly.TryParseExact(Str(v), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                    errors.Add(new(p, "Ngày phải có dạng yyyy-MM-dd."));
                return;
            case "toggle":
                if (v is not JsonValue t || !t.TryGetValue(out bool _)) errors.Add(new(p, "Phải là bật hoặc tắt."));
                return;
            case "fixed":
            {
                var list = DanhMucCoDinh.Get(field.List);
                if (list is null) { errors.Add(new(p, $"Cấu hình sai: không có danh sách \"{field.List}\".")); return; }
                if (!list.HasCode(Str(v))) errors.Add(new(p, "Giá trị không có trong danh sách."));
                return;
            }
            case "content":
            {
                var items = field.Multiple ? (v as JsonArray)?.Select(Str).ToList() : [Str(v)];
                if (items is null) { errors.Add(new(p, "Phải là danh sách mục đã chọn.")); return; }
                if (items.Any(x => !IsDocumentUdi(x))) errors.Add(new(p, "Mục đã chọn không đúng định dạng."));
                CheckCount(items.Count, field, p, errors);
                return;
            }
            case "lines":
            {
                if (v is not JsonArray lines || lines.Any(x => Str(x) is null)) { errors.Add(new(p, "Phải là danh sách dòng chữ.")); return; }
                int count = lines.Count(x => !string.IsNullOrWhiteSpace(Str(x)));
                CheckCount(count, field, p, errors);
                if (field.MaxChars is > 0 && lines.Any(x => Str(x)!.Length > field.MaxChars)) errors.Add(new(p, $"Mỗi dòng tối đa {field.MaxChars} ký tự."));
                return;
            }
            case "table":
                ValidateRows(v, field.Fields ?? [], field.MinRows, field.MaxRows, null, p, errors);
                return;
            default:
                errors.Add(new(p, $"Cấu hình sai: kiểu ô \"{field.Type}\" không hỗ trợ."));
                return;
        }
    }

    private static void CheckCount(int count, InlineListField field, string p, List<InlineListError> errors)
    {
        if (field.Min is { } min && count < min) errors.Add(new(p, $"Cần ít nhất {min}, đang có {count}."));
        if (field.Max is { } max && max > 0 && count > max) errors.Add(new(p, $"Tối đa {max}, đang có {count}."));
    }

    /// <summary>O hien khi khong co dieu kien, hoac o dieu kien bang gia tri cho truoc.</summary>
    public static bool IsVisible(JsonObject row, InlineListField field)
        => field.ShowWhen is null || Str(row[field.ShowWhen.Field]) == field.ShowWhen.EqualsValue;

    public static bool IsDocumentUdi(string? s)
        => s is not null && s.StartsWith(DocumentUdiPrefix, StringComparison.Ordinal)
           && Guid.TryParseExact(s[DocumentUdiPrefix.Length..], "N", out _);

    private static bool IsEmpty(JsonNode? v) => v switch
    {
        null => true,
        JsonValue x when x.TryGetValue(out string? s) => string.IsNullOrWhiteSpace(s),
        JsonArray a => a.Count == 0,
        _ => false,
    };

    private static string? Str(JsonNode? v) => v is JsonValue x && x.TryGetValue(out string? s) ? s : null;

    private static string Lower(string s) => s.Length == 0 ? s : char.ToLower(s[0], CultureInfo.GetCultureInfo("vi-VN")) + s[1..];
}
