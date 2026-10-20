# Giới hạn tần suất, lỗi và vận hành API

Áp dụng cho `/api/**` và API quản trị riêng của dự án tại `/umbraco/management/api/v1/antc/**`.
API hệ thống Umbraco giữ nguyên, gồm upload media.

| Thao tác | Hạn mức | Khóa phân vùng |
| --- | --- | --- |
| POST `/api/v1/contest/entries` | 10 lần/giờ | IP |
| POST `/api/v1/contest/entries/me/answers` | 120 lần/phút | SHA-256 của token; thiếu token thì dùng IP |
| PUT `…/me/contact` và POST `…/me/submit` | Chung 20 lần/giờ | IP |
| POST `/api/v1/questions` | 5 lần/giờ | IP |

Dùng ASP.NET Core `RateLimiter`, fixed window bắt đầu từ yêu cầu đầu của từng phân vùng; không xếp hàng.
429 trả `RATE_LIMITED`, `Retry-After` là số giây (ít nhất 1), `Cache-Control: no-store`.
Các yêu cầu không hợp lệ cũng tiêu thụ hạn mức. Giới hạn gửi câu hỏi trong CSDL được giữ làm lớp bảo vệ bổ sung.
Bộ giới hạn tích hợp nằm trong bộ nhớ từng tiến trình và được đặt lại khi khởi động lại.
Nếu triển khai nhiều instance, cần bổ sung giới hạn chung ở gateway/proxy; không cộng các hạn mức từng instance thành hạn mức toàn hệ thống.

## Proxy tin cậy

Chỉ sử dụng `Connection.RemoteIpAddress` sau `UseForwardedHeaders`; không đọc trực tiếp IP từ header.
Mặc định chỉ tin `127.0.0.1` và `::1`, xử lý tối đa một proxy. Khi triển khai, cấu hình IP/CIDR thực tế của proxy:

```json
{
  "ReverseProxy": {
    "ForwardLimit": 1,
    "KnownProxies": ["10.0.0.10"],
    "KnownNetworks": []
  }
}
```

IP trên chỉ là ví dụ. Không cấu hình `0.0.0.0/0`, `::/0` hoặc tin toàn Internet.
Proxy cuối phải ghi đè/thiết lập chuỗi `X-Forwarded-For` đúng và chỉ chuyển tiếp các header đáng tin.
Tham khảo: [Microsoft – reverse proxy](https://learn.microsoft.com/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0),
[Microsoft – rate limiting](https://learn.microsoft.com/aspnet/core/performance/rate-limit?view=aspnetcore-10.0).

## Lỗi và kích thước body

Mọi body API tối đa **16.384 byte**, tính theo byte truyền lên chứ không phải số ký tự.
Kiểm tra cả request có Content-Length lẫn chunked trước model binding/ghi CSDL.
Body quá lớn trả 413:

```json
{"error":{"code":"REQUEST_TOO_LARGE","message":"Dữ liệu gửi lên vượt quá giới hạn 16 KB.","fields":{}}}
```

Giữ các mã nghiệp vụ của sheet API. Chuẩn hóa lỗi binding, routing, authorization và exception về cùng envelope;
`fields` luôn là object, kể cả khi không có lỗi trường. Không đưa thông điệp exception vào phản hồi.
Mã hạ tầng bổ sung ngoài sheet: `UNAUTHORIZED` (401 quản trị), `FORBIDDEN` (403 quản trị),
`NOT_FOUND` (404 routing), `METHOD_NOT_ALLOWED` (405), `REQUEST_TOO_LARGE` (413),
`UNSUPPORTED_MEDIA_TYPE` (415), `SERVER_ERROR` (500).
Lượt thi thiếu/sai token vẫn trả `401 INVALID_TOKEN`.
Giới hạn/chặn request do IIS/nginx/gateway thực hiện trước ứng dụng cần được cấu hình thông báo tại lớp đó.

## Log

Serilog ghi CLEF JSON vào `umbraco/Logs/UmbracoTraceLog.<machine>.<date>.json`, xoay mỗi ngày,
giữ tối đa 30 file/ngày và xóa file quá 30 ngày khi sink xoay file.
Không xoay theo dung lượng để tránh làm hạn lưu trữ 30 file ngắn hơn 30 ngày.

Trong request API, chỉ event audit được phép đi qua bộ lọc, với hai trường `EntryCode` và `ErrorCode`.
Mã dự thi được ghi khi tạo lượt thành công hoặc khi xác thực lượt thành công.
Không ghi body, response, header, token/token hash, IP, họ tên, số điện thoại, nội dung câu hỏi,
query string, exception hay câu SQL. Các scope/enricher thêm dữ liệu vào audit cũng bị loại bỏ.
Log hệ thống Umbraco bên ngoài API của dự án vẫn hoạt động bình thường.
Không bật request/body logging hoặc access log chứa header/body ở reverse proxy.

## Readiness

GET `/healthz` đọc bảng `entry` ở CSDL ứng dụng và `umbracoKeyValue` qua database factory đang dùng của Umbraco.
Trả `200 {"status":"ok"}` chỉ khi đọc được cả hai; ngược lại trả `503 {"status":"unavailable"}`.
Không cache, không trả chuỗi kết nối hay chi tiết exception. Command timeout là 5 giây cho mỗi CSDL.
Endpoint này phục vụ readiness sau khi ứng dụng khởi động; lỗi boot cần được supervisor/container phát hiện riêng.
