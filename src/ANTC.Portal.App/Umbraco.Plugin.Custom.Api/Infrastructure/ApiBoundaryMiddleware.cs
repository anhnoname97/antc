using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Umbraco.Plugin.Custom.Api.Models;

namespace Umbraco.Plugin.Custom.Api.Infrastructure;

/// <summary>Giới hạn body trước model binding; chuẩn hóa cả lỗi routing, auth và exception.</summary>
public sealed class ApiBoundaryMiddleware(RequestDelegate next, ILogger<ApiBoundaryMiddleware> logger)
{
    public const string AuditTemplate = "API completed {EntryCode} {ErrorCode}";
    private static readonly Regex EntryCode = new("^AD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$", RegexOptions.Compiled);
    private static readonly Regex ErrorCode = new("^[A-Z][A-Z0-9_]{0,63}$", RegexOptions.Compiled);

    public async Task InvokeAsync(HttpContext context)
    {
        if (!ApiProtection.IsApi(context.Request.Path)) { await next(context); return; }
        Stream originalResponse = context.Response.Body;
        Stream originalRequest = context.Request.Body;
        await using var response = new MemoryStream();
        await using var request = new MemoryStream();
        context.Response.Body = response;
        string? error = null;
        bool workbookUpload = HttpMethods.IsPost(context.Request.Method) && string.Equals(
            context.Request.Path.Value?.TrimEnd('/'), "/api/v1/admin/quiz/imports/preview", StringComparison.OrdinalIgnoreCase);
        try
        {
            try
            {
                // Sole binary-upload exception; all other APIs retain the 16 KB limit.
                int maxBodyBytes = workbookUpload ? 5 * 1024 * 1024 + 64 * 1024 : ApiProtection.MaxBodyBytes;
                bool tooLarge = context.Request.ContentLength > maxBodyBytes;
                // Đọc tối đa 16 KB + 1 tại đây thay vì hạ hard-limit của Kestrel:
                // hard-limit có thể đóng kết nối trước khi gửi được JSON lỗi cho body chunked.
                if (!tooLarge)
                {
                    byte[] chunk = new byte[4096];
                    while (request.Length <= maxBodyBytes)
                    {
                        int read = await originalRequest.ReadAsync(chunk.AsMemory(0,
                            (int)Math.Min(chunk.Length, maxBodyBytes + 1 - request.Length)), context.RequestAborted);
                        if (read == 0) break;
                        await request.WriteAsync(chunk.AsMemory(0, read), context.RequestAborted);
                    }
                    tooLarge = request.Length > maxBodyBytes;
                }
                if (tooLarge)
                    context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                else
                {
                    request.Position = 0;
                    context.Request.Body = request;
                    await next(context);
                }
            }
            catch (BadHttpRequestException ex) { context.Response.StatusCode = ex.StatusCode; }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested) { throw; }
            catch (Exception)
            {
                // Không log exception/model/SQL: có thể chứa họ tên, điện thoại hoặc token.
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            }

            if (context.Response.StatusCode >= 400)
            {
                ApiError apiError = ReadError(response) ?? (workbookUpload && context.Response.StatusCode == 413
                    ? new ApiError("REQUEST_TOO_LARGE", "Tệp Excel không được vượt quá 5 MB; phần dữ liệu multipart phụ trợ tối đa 64 KB.")
                    : workbookUpload && context.Response.StatusCode == 415
                        ? new ApiError("UNSUPPORTED_MEDIA_TYPE", "Hãy gửi multipart/form-data với trường file chứa tệp .xlsx.")
                        : DefaultError(context.Response.StatusCode));
                error = apiError.Code;
                response.SetLength(0);
                context.Response.ContentLength = null;
                context.Response.ContentType = "application/json; charset=utf-8";
                context.Response.Headers.CacheControl = "no-store";
                if (context.Response.StatusCode == 429 && !context.Response.Headers.ContainsKey("Retry-After"))
                    context.Response.Headers.RetryAfter = "60";
                await JsonSerializer.SerializeAsync(response, new ApiErrorResponse(apiError),
                    new JsonSerializerOptions(JsonSerializerDefaults.Web), context.RequestAborted);
            }
            else if (!context.Items.ContainsKey(ApiProtection.EntryCodeItem))
            {
                // Chỉ trích mã dự thi; tuyệt đối không log response (API-01 có token).
                try
                {
                    response.Position = 0;
                    using var json = await JsonDocument.ParseAsync(response, cancellationToken: context.RequestAborted);
                    if (json.RootElement.ValueKind == JsonValueKind.Object &&
                        json.RootElement.TryGetProperty("code", out var code) && code.ValueKind == JsonValueKind.String)
                        context.Items[ApiProtection.EntryCodeItem] = code.GetString();
                }
                catch (JsonException) { }
            }
            response.Position = 0;
            await response.CopyToAsync(originalResponse, context.RequestAborted);
        }
        finally
        {
            context.Request.Body = originalRequest;
            context.Response.Body = originalResponse;
            string? code = context.Items[ApiProtection.EntryCodeItem] as string;
            logger.LogInformation(AuditTemplate, code is not null && EntryCode.IsMatch(code) ? code : null,
                error is not null && ErrorCode.IsMatch(error) ? error : null);
        }
    }

    private static ApiError? ReadError(MemoryStream response)
    {
        try
        {
            response.Position = 0;
            using var json = JsonDocument.Parse(response);
            var root = json.RootElement;
            if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("error", out var error) ||
                error.ValueKind != JsonValueKind.Object || !error.TryGetProperty("code", out var code) ||
                code.ValueKind != JsonValueKind.String || !ErrorCode.IsMatch(code.GetString()!) ||
                !error.TryGetProperty("message", out var message) || message.ValueKind != JsonValueKind.String ||
                string.IsNullOrWhiteSpace(message.GetString())) return null;
            var fields = new Dictionary<string, string>();
            if (error.TryGetProperty("fields", out var values) && values.ValueKind == JsonValueKind.Object)
                foreach (var field in values.EnumerateObject())
                    if (field.Value.ValueKind == JsonValueKind.String) fields[field.Name] = field.Value.GetString()!;
            return new ApiError(code.GetString()!, message.GetString()!, fields);
        }
        catch (JsonException) { return null; }
    }

    public static ApiError DefaultError(int status) => status switch
    {
        400 => new("VALIDATION", "Dữ liệu gửi lên không hợp lệ."),
        401 => new("UNAUTHORIZED", "Bạn cần đăng nhập để thực hiện thao tác này."),
        403 => new("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này."),
        404 => new("NOT_FOUND", "Không tìm thấy API hoặc dữ liệu yêu cầu."),
        405 => new("METHOD_NOT_ALLOWED", "Phương thức gửi yêu cầu không được hỗ trợ."),
        413 => new("REQUEST_TOO_LARGE", "Dữ liệu gửi lên vượt quá giới hạn 16 KB."),
        415 => new("UNSUPPORTED_MEDIA_TYPE", "Định dạng dữ liệu không được hỗ trợ. Vui lòng gửi JSON."),
        429 => new("RATE_LIMITED", "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau."),
        >= 400 and < 500 => new("VALIDATION", "Yêu cầu không hợp lệ hoặc không thể thực hiện."),
        _ => new("SERVER_ERROR", "Hệ thống tạm thời không thể xử lý yêu cầu. Vui lòng thử lại sau."),
    };
}
