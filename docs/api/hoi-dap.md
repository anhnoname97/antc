# Tiếp nhận Hỏi – Đáp và góp ý

Phần BE-25 / API-06 và BE-29. API và trang quản trị dùng bảng `question_submission` trong CSDL ứng dụng. Câu trả lời công khai do biên tập viên tạo riêng bằng `qaItem` trong CMS.

## API-06

`POST /api/v1/questions` không yêu cầu đăng nhập. Gửi JSON:

```json
{
  "type": "cau-hoi",
  "content": "Tôi được mời làm cộng tác viên và cần hỏi thêm.",
  "wantReply": false,
  "contact": "",
  "consent": true,
  "website": ""
}
```

| Thuộc tính | Quy tắc |
| --- | --- |
| `type` | `cau-hoi` hoặc `gop-y` |
| `content` | Cắt khoảng trắng ở hai đầu; từ 10 đến 2000 ký tự; giữ nguyên các thẻ HTML dưới dạng văn bản |
| `wantReply` | Có muốn nhận trả lời riêng hay không |
| `contact` | Bắt buộc nếu `wantReply=true`; tối đa 200 ký tự sau khi cắt khoảng trắng |
| `consent` | Phải là `true` |
| `website` | Ô bẫy. Có bất kỳ giá trị khác chuỗi rỗng thì trả thành công và không lưu |

Thành công trả HTTP **201**:

```json
{ "ok": true }
```

Lỗi dữ liệu trả HTTP **400**, cùng dạng lỗi chung của dự án:

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "Dữ liệu gửi lên không hợp lệ.",
    "fields": { "content": "Nội dung cần từ 10 đến 2000 ký tự." }
  }
}
```

Giới hạn **5 bản ghi được tiếp nhận cho một IP trong 60 phút gần nhất**. Lần tiếp nhận tiếp theo trả **429**, mã `RATE_LIMITED`, kèm `Retry-After` tính bằng giây. Dữ liệu không hợp lệ và yêu cầu vướng ô bẫy không tạo bản ghi và không dùng hạn mức này. Ô bẫy được xử lý trước bước kiểm tra trường dữ liệu.

Đếm và ghi trong cùng giao dịch SQLite `BEGIN IMMEDIATE`, dùng chỉ mục `(ip_hash, created_at)`. Hạn mức không bị mất khi ứng dụng khởi động lại và không bị vượt bởi các yêu cầu gửi đồng thời đến cùng CSDL. Không ghi địa chỉ IP nguyên văn: dùng HMAC-SHA256 với khóa `Contest:IpHashSalt` đang có của dự án, thêm phạm vi `questions:`. IPv4 và địa chỉ IPv4 ánh xạ trong IPv6 dùng chung hạn mức. Chỉ lấy IP từ `HttpContext.Connection.RemoteIpAddress`; nếu đặt sau proxy, cấu hình forwarded headers và proxy tin cậy ở tầng triển khai.

Mỗi bản ghi có trạng thái `moi`, `created_at`, `consent_at` theo UTC và mã băm IP. API không gửi email và không tự tạo nội dung CMS.

## Trang quản trị

Mở **`/quan-tri/hoi-dap`**. Trang dùng Razor Pages, khung `_AdministrationLayout` và tệp `admin.css` dùng chung cho các trang `/quan-tri` sau này. BE-27 chưa có các màn hình quản trị cuộc thi trong nhánh hiện tại; phần khung đăng nhập và phân quyền dùng chung đã được bổ sung.

- Dùng cookie đăng nhập backoffice của Umbraco, không tạo tài khoản hoặc màn hình đăng nhập riêng.
- Nhóm **Quản trị cuộc thi**, alias native **`quanTriCuocThi`**, được tạo nếu chưa tồn tại khi Umbraco khởi động. Không tự thêm thành viên trong mã khởi tạo.
- Quản trị viên gán thành viên tại **Người dùng → Nhóm người dùng → Quản trị cuộc thi**. Sau khi thay đổi nhóm, đăng nhập lại để cập nhật phiên nếu cần. Tài khoản quản trị local đã được thêm vào nhóm khi thiết lập tính năng.
- Chưa đăng nhập: chuyển đến `/umbraco/login`, giữ đường dẫn quay lại. Đã đăng nhập nhưng không thuộc nhóm: HTTP 403. Yêu cầu cập nhật danh sách bằng AJAX nhận 401 khi phiên hết hạn.
- Mọi thao tác ghi dùng POST và antiforgery token của Razor Pages. Người xử lý lấy từ phiên đã xác thực; không nhận danh tính người xử lý từ biểu mẫu.

Danh sách có thời điểm gửi, loại, nội dung, muốn trả lời riêng, liên hệ, trạng thái, ghi chú và thông tin người xử lý. Nội dung thu gọn 200 ký tự, bấm **Xem đầy đủ** để mở toàn văn. Razor mã hóa văn bản người gửi và ghi chú: HTML không chạy trong trang quản trị.

Lọc bằng `type`, `status`, `from`, `to`, `search`; `pageNumber` bắt đầu từ 1, mỗi trang 50 dòng. Trạng thái có bốn giá trị `moi`, `dang-xu-ly`, `da-xu-ly`, `bo-qua`. Khoảng ngày tính theo ngày Việt Nam (UTC+7), gồm cả ngày kết thúc. Từ khóa tìm trong nội dung, được truyền bằng tham số truy vấn EF Core.

Chọn trạng thái và sửa ghi chú ngay tại dòng, rồi bấm **Lưu**. Ghi chú tối đa 1000 ký tự. Hệ thống lưu người xử lý và thời điểm xử lý. Danh sách tự cập nhật mỗi 5 giây; dừng thay nội dung bảng trong lúc đang chỉnh sửa hoặc đang xem một dòng để không làm mất nội dung chưa lưu.

**Xuất CSV theo bộ lọc** xuất tất cả dòng khớp bộ lọc, không chỉ trang đang xem. Dữ liệu xuất theo luồng, UTF-8 có BOM, giữ dấu tiếng Việt; ô chứa dấu phẩy, dấu nháy, xuống dòng được trích dẫn. Các chuỗi có thể bị Excel hiểu thành công thức được ép về văn bản. Nội dung và thông tin liên hệ chỉ có trong trang/tệp xuất được bảo vệ bởi cùng phân quyền.

## Công bố câu trả lời

1. Tiếp nhận và xử lý tại `/quan-tri/hoi-dap`; ghi chú phục vụ nội bộ.
2. Khi cần công bố, biên tập viên vào **Quản lý trang → Trang chủ → Hỏi – Đáp** trong Umbraco, tạo **Câu trả lời công khai** (`qaItem`).
3. Nhập câu hỏi đã biên tập, bỏ thông tin cá nhân và nhập câu trả lời. Lưu nháp hoặc xuất bản theo quy trình biên tập.

`qaItem` có hai thuộc tính `question`, `answer`, composition `seoBase` và template Razor. Không có Block Grid trên loại dữ liệu này. URL công khai có dạng `/hoi-dap/{slug}/`. Hai mục FAQ mẫu cũ vẫn được ghi nhận đã xóa trong uSync; khôi phục document type không khôi phục các mục mẫu đó.

Các trang hiển thị vẫn giữ thuộc tính Bố cục để trống theo cấu trúc đã chốt. Form gửi trên giao diện website (FE-22) và danh sách câu trả lời công khai trên trang Hỏi – Đáp (FE-23) là các phần giao diện riêng; có thể gọi API này và đọc các `qaItem` đã xuất bản.

## Kiểm thử

- Unit test trong `QuestionRequestTests`, `QuestionSubmissionServiceTests`, `QuestionCsvTests`: biên độ dài, đồng ý, liên hệ, ô bẫy, giao dịch gửi đồng thời, hạn mức qua các DbContext và mốc 60 phút, lọc/phân trang, ghi nhận xử lý, CSV/BOM và công thức Excel.
- Kiểm thử trình duyệt/API cục bộ: chuyển đăng nhập và 403 ngoài nhóm, dữ liệu HTML hiển thị dạng chữ, antiforgery, lưu trên dòng, giữ nội dung đang sửa, tự cập nhật, CSV đúng bộ lọc và 50 dòng mỗi trang.
- Migration `QuestionSubmissionIpWindowIndex` chỉ thêm chỉ mục, không thay đổi dữ liệu đã có.

DB, tài khoản, bản sao lưu và dữ liệu tiếp nhận không đưa vào Git. Schema CMS và template được đồng bộ bằng uSync; cấu trúc bảng nghiệp vụ được đồng bộ bằng EF Core migrations.
