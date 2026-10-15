using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Api.Validation;

public static class ContestEntryRequestValidator
{
    public static bool TryValidate(
        CreateContestEntryRequest? request,
        out ContestEntryRegistration? registration,
        out IReadOnlyDictionary<string, string> fields)
    {
        var errors = new Dictionary<string, string>();
        registration = null;

        if (request is null)
        {
            errors["body"] = "Dữ liệu đăng ký là bắt buộc.";
            fields = errors;
            return false;
        }

        string mode = request.Mode?.Trim().ToLowerInvariant() ?? "";
        if (mode is not EntryModes.Named and not EntryModes.Anon)
        {
            errors["mode"] = "Chế độ phải là named hoặc anon.";
        }

        if (mode == EntryModes.Anon)
        {
            RejectAnonymousPersonalData(request, errors);
            if (errors.Count == 0)
            {
                registration = new ContestEntryRegistration(EntryModes.Anon, null, null, null, false);
            }

            fields = errors;
            return errors.Count == 0;
        }

        string fullName = request.FullName?.Trim() ?? "";
        if (fullName.Length is < 2 or > 100)
        {
            errors["fullName"] = "Họ và tên phải có từ 2 đến 100 ký tự.";
        }

        string phone = NormalizePhone(request.Phone);
        if (phone.Length != 10 || phone[0] != '0' || phone.Skip(1).Any(c => c is < '0' or > '9'))
        {
            errors["phone"] = "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.";
        }

        string? org = request.Org?.Trim();
        if (org?.Length > 150)
        {
            errors["org"] = "Đơn vị không được vượt quá 150 ký tự.";
        }

        if (request.Consent is not true)
        {
            errors["consent"] = "Bạn phải đồng ý trước khi đăng ký dự thi.";
        }

        if (errors.Count == 0)
        {
            registration = new ContestEntryRegistration(
                EntryModes.Named,
                fullName,
                phone,
                string.IsNullOrEmpty(org) ? null : org,
                true);
        }

        fields = errors;
        return errors.Count == 0;
    }

    public static string NormalizePhone(string? input)
    {
        string digits = new((input ?? "").Where(c => c is >= '0' and <= '9').ToArray());
        if (digits.Length == 11 && digits.StartsWith("84", StringComparison.Ordinal))
        {
            digits = "0" + digits[2..];
        }

        return digits;
    }

    private static void RejectAnonymousPersonalData(
        CreateContestEntryRequest request,
        IDictionary<string, string> errors)
    {
        if (request.FullName is not null)
        {
            errors["fullName"] = "Không gửi họ và tên khi đăng ký ẩn danh.";
        }

        if (request.Phone is not null)
        {
            errors["phone"] = "Không gửi số điện thoại khi đăng ký ẩn danh.";
        }

        if (request.Org is not null)
        {
            errors["org"] = "Không gửi đơn vị khi đăng ký ẩn danh.";
        }

        if (request.Consent is not null)
        {
            errors["consent"] = "Không gửi thông tin đồng ý khi đăng ký ẩn danh.";
        }
    }
}
