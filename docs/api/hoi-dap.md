# Tiếp nhận, trả lời và duyệt Hỏi – Đáp

**Người dùng gửi câu hỏi từ portal → ban biên tập xem trong section Hỏi – Đáp của Umbraco → nhập câu trả lời → duyệt và công bố.** Câu hỏi gốc chỉ được xem, không tạo mới hoặc sửa câu hỏi của người dùng trong quản trị.

Nguồn dữ liệu là `question_submission`, không tạo nút `qaItem` từ câu hỏi gửi lên. Không gửi thư điện tử tự động. Liên hệ, IP băm, ghi chú và người xử lý không xuất hiện trong dữ liệu công khai.

Frontend portal do nhóm FE triển khai. Bàn giao tích hợp tại [hợp đồng API cho portal](hoi-dap-portal.md) và [OpenAPI 3.0.3](hoi-dap-portal.openapi.json). Repository giữ template trang Hỏi – Đáp ở mức layout và tiêu đề; không kèm biểu mẫu hoặc danh sách trả lời ngoài portal.

## API-06: gửi nội dung

`POST /api/v1/questions` không yêu cầu đăng nhập:

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

| Trường | Quy tắc |
| --- | --- |
| `type` | `cau-hoi` hoặc `gop-y` |
| `content` | Cắt khoảng trắng hai đầu; 10–2000 ký tự; giữ nguyên HTML dưới dạng văn bản |
| `wantReply` | Có muốn nhận trả lời riêng hay không |
| `contact` | Bắt buộc khi muốn trả lời riêng; tối đa 200 ký tự |
| `consent` | Phải là `true` |
| `website` | Ô bẫy. Khác chuỗi rỗng: trả 201, không lưu |

Thành công: HTTP **201**, `{ "ok": true }`. Bản ghi mới có trạng thái `moi`, chưa có câu trả lời, **chưa công khai**. Sai dữ liệu trả **400**, dạng `{ "error": { "code": "VALIDATION", "message": "…", "fields": { "content": "…" } } }`.

Giới hạn **5 bản ghi tiếp nhận/IP trong 60 phút gần nhất**. Lần tiếp theo trả **429 RATE_LIMITED**, có `Retry-After` bằng giây. Yêu cầu sai dữ liệu và ô bẫy không dùng hạn mức. SQLite `BEGIN IMMEDIATE` đếm và ghi nguyên tử, giữ hạn mức qua lần khởi động và giữa các tiến trình dùng cùng DB.

Không ghi IP nguyên văn. Dùng HMAC-SHA256, khóa `Contest:IpHashSalt`, phạm vi `questions:`; IPv4 và IPv4 ánh xạ trong IPv6 dùng chung hạn mức. Chỉ đọc `Connection.RemoteIpAddress`; khi có proxy, cấu hình forwarded headers và proxy tin cậy tại tầng triển khai.

## Section Hỏi – Đáp trong Umbraco

Mở `/umbraco/section/hoi-dap`, hoặc bấm **Hỏi – Đáp** trên thanh section của Umbraco. Đây là extension native, dùng phiên và khung backoffice; không dùng iframe hoặc trang quản trị độc lập. `/quan-tri/hoi-dap` chỉ chuyển đến section mới.

Nút **Xem và xử lý** mở sidebar native của Umbraco: nội dung gốc và thông tin tiếp nhận ở bên trái, câu trả lời và kiểm duyệt ở bên phải. Header và thanh thao tác cố định dùng `umb-body-layout`; ô nhập, danh sách chọn và nút dùng UUI. Đóng khung giữ bộ lọc, trang và vị trí cuộn của danh sách. Đóng bằng nút, phím Escape hoặc chuyển section khi còn thay đổi chưa lưu sẽ hiện hộp thoại xác nhận của Umbraco; lỗi lưu giữ nguyên bản nháp để tiếp tục xử lý.

- Manifest: `wwwroot/App_Plugins/AntcQuestions/umbraco-package.json`; alias `Antc.Section.Questions`.
- Nhóm **Quản trị Hỏi – Đáp**, alias `quanTriHoiDap`, được tạo cùng quyền section; không tự thêm thành viên.
- Cấp quyền tại **Users → User groups → Sections → Hỏi – Đáp**. Nhóm quản trị và nhóm `quanTriCuocThi` đã có từ phiên bản trước được giữ quyền. Không thay thành viên hoặc quyền section khác.
- Backend kiểm tra quyền section của người dùng Umbraco đã xác thực, không chỉ ẩn nút trên giao diện. Management API dùng cơ chế xác thực backoffice native.
- Danh sách: lọc loại, trạng thái, ngày Việt Nam UTC+7, tìm trong nội dung; 50 dòng/trang; tự cập nhật 5 giây khi không mở xử lý.
- Có thể sửa trạng thái/ghi chú và bấm **Lưu dòng** ngay trong bảng. Tạm dừng thay bảng khi có thay đổi chưa lưu.
- Bấm **Xem và xử lý**: đọc toàn bộ nội dung gốc và liên hệ nội bộ; nhập câu trả lời, trạng thái và ghi chú. Không có ô nhập/sửa câu hỏi hoặc nút tạo câu hỏi.
- **Lưu xử lý** chỉ lưu câu trả lời nháp và trạng thái. Chọn “Đã xử lý” không tự công bố.
- **Duyệt và công bố** yêu cầu câu trả lời 10–10000 ký tự, lưu người duyệt/thời điểm và chụp bản câu trả lời được phép công khai. Chỉ áp dụng cho `cau-hoi`; góp ý xử lý nội bộ.
- Sửa câu trả lời nháp sau khi công bố không đổi bản đang hiển thị. Cần duyệt lại để thay bản công khai.
- **Gỡ công bố** hoặc lưu trạng thái **Bỏ qua** làm nội dung ngừng xuất hiện công khai; giữ lịch sử bản đã duyệt.
- Câu hỏi gốc luôn giữ nguyên. Không duyệt câu có thông tin cá nhân trong nội dung. Liên hệ và ghi chú không xuất ra ngoài.
- Mọi cập nhật kiểm tra `reviewVersion`, tăng phiên bản nguyên tử. Khi hai người cùng xử lý, bản cũ nhận **409 CONFLICT** và cần tải lại, không ghi đè bản mới.
- Ghi chú tối đa 1000 ký tự. Người xử lý lấy từ phiên Umbraco, không nhận danh tính từ JSON gửi lên.

CSV theo cùng bộ lọc, xuất toàn bộ kết quả, UTF-8 BOM; hỗ trợ tiếng Việt, dấu nháy, xuống dòng và vô hiệu công thức Excel. Có nội dung gốc, liên hệ, trạng thái/ghi chú, câu trả lời nháp/đã duyệt và thông tin xử lý. CSV được bảo vệ bằng cùng quyền section.

### Management API

Gốc: `/umbraco/management/api/v1/antc/questions`.

| Phương thức | Đường dẫn | Nội dung |
| --- | --- | --- |
| GET | `/` | Danh sách; `type`, `status`, `from`, `to`, `search`, `page` |
| GET | `/{id}` | Nội dung và dữ liệu xử lý đầy đủ, chỉ trong quản trị |
| PUT | `/{id}` | Lưu `{reviewVersion,status,adminNote,answer}` |
| POST | `/{id}/approve` | Duyệt/công bố với cùng body |
| POST | `/{id}/unpublish` | Gỡ công bố, body `{reviewVersion}` |
| GET | `/export` | CSV theo cùng bộ lọc |

## Dữ liệu công khai và portal

`GET /api/v1/questions` nhận `page`, `pageSize` (1–50, mặc định 20), `search` (tối đa 200 ký tự sau trim) và `sort` (`newest`/`oldest`). Tìm chuỗi trong câu hỏi và bản trả lời đã duyệt, không phân biệt hoa/thường tiếng Việt, giữ nguyên dấu; ký tự wildcard được tìm như văn bản. Chỉ lấy câu có cờ công bố, thời điểm duyệt và bản trả lời đã duyệt. Phản hồi gồm `items`, `total` sau lọc, `page`, `pageSize`, `totalPages`. Mỗi mục chỉ có `id`, `question`, `answer`, `answeredAt`.

`GET /api/v1/questions/{id}` trả cùng DTO một câu hỏi đã công bố. Câu chưa công bố, đã gỡ, góp ý hoặc không tồn tại đều trả `404 NOT_FOUND`. Cả danh sách và chi tiết dùng cùng điều kiện công khai, không trả liên hệ, ghi chú, IP, người xử lý hoặc bản trả lời nháp; đều không cache. Chi tiết request/response và lỗi tại [hợp đồng cho FE](hoi-dap-portal.md).

`Views/hoiDapPage.cshtml` chỉ có layout và tiêu đề để nhóm FE dựng giao diện riêng. FE gửi biểu mẫu đến API-06 và lấy danh sách đã duyệt qua API GET. Không có CSS/JavaScript biểu mẫu Hỏi – Đáp riêng trong repository. Gửi thành công không tự thêm câu hỏi vào danh sách công khai.

API giữ nội dung gốc dưới dạng văn bản. FE cần hiển thị `question` và `answer` bằng cơ chế thoát ký tự mặc định, không chèn trực tiếp vào HTML. Section Umbraco đã hiển thị nội dung dưới dạng chữ đã thoát ký tự. Các thuộc tính Bố cục/Block Grid của 9 trang vẫn trống, không thêm khối CMS.

Kiểu `qaItem` cũ được giữ schema để tương thích nhưng không được tạo dưới trang Hỏi – Đáp; luồng mới không nhập câu hỏi đáp thủ công trong cây trang. Hai FAQ mẫu cũ tiếp tục ở trạng thái đã xóa.

## Đồng bộ và kiểm thử

- Migration `QuestionModerationApproval` bổ sung câu trả lời nháp/đã duyệt, cờ công khai, người duyệt, thời điểm và phiên bản xử lý. Bản ghi cũ mặc định chưa công khai, không xóa dữ liệu.
- uSync đồng bộ quy tắc cây CMS; schema bảng nghiệp vụ dùng EF Core migrations. DB, câu hỏi tiếp nhận, tài khoản, bản sao lưu và ảnh kiểm thử không đưa vào Git.
- Kiểm thử: hạn mức/ô bẫy, giữ nguyên HTML, không công khai trước duyệt, không sửa câu hỏi gốc, bảo vệ bản đã duyệt khi sửa nháp, thu hồi, xung đột phiên bản, lọc/phân trang, CSV, nâng cấp DB cũ và luồng portal–section–portal thực tế.
