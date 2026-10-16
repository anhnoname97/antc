using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Api.Validation;

public static class QuestionRequestValidator
{
    public static bool TryValidate(CreateQuestionRequest? request, out QuestionRegistration? registration,
        out IReadOnlyDictionary<string, string> fields)
    {
        var errors = new Dictionary<string, string>();
        string content = request?.Content?.Trim() ?? "";
        string? contact = request?.Contact?.Trim();
        if (request?.Type is null || !QuestionValues.Types.ContainsKey(request.Type))
            errors["type"] = "Chọn Câu hỏi, kiến nghị hoặc Góp ý.";
        if (content.Length is < 10 or > 2000) errors["content"] = "Nội dung cần từ 10 đến 2000 ký tự.";
        if (request?.Consent != true) errors["consent"] = "Bạn cần đồng ý trước khi gửi.";
        if (request?.WantReply == true && string.IsNullOrEmpty(contact))
            errors["contact"] = "Nhập thư điện tử hoặc số điện thoại để nhận trả lời riêng.";
        if (contact?.Length > 200) errors["contact"] = "Thông tin liên hệ tối đa 200 ký tự.";
        fields = errors;
        registration = errors.Count == 0
            ? new QuestionRegistration(request!.Type!, content, request.WantReply, string.IsNullOrEmpty(contact) ? null : contact)
            : null;
        return registration is not null;
    }
}
