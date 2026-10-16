# Hợp đồng API Hỏi – Đáp dành cho frontend portal

Frontend tự xây dựng biểu mẫu gửi câu hỏi/góp ý và danh sách câu đã trả lời. Backend cung cấp hai API dưới đây. Không cần đăng nhập, không gửi token hoặc cookie quản trị Umbraco từ portal. Có thể import [OpenAPI 3.0.3](hoi-dap-portal.openapi.json) vào Postman hoặc công cụ đọc OpenAPI.

Base URL phát triển: `http://localhost:11000`. FE cấu hình base URL theo môi trường triển khai.

| Phương thức | Đường dẫn | Chức năng |
| --- | --- | --- |
| POST | `/api/v1/questions` | Gửi câu hỏi, kiến nghị hoặc góp ý |
| GET | `/api/v1/questions?page=1` | Lấy câu hỏi và câu trả lời đã duyệt, công bố |

## Gửi câu hỏi hoặc góp ý

`POST /api/v1/questions` với `Content-Type: application/json`.

```json
{
  "type": "cau-hoi",
  "content": "Tôi có thể gửi góp ý về nội dung website ở đâu?",
  "wantReply": false,
  "contact": "",
  "consent": true,
  "website": ""
}
```

| Trường | Kiểu | Quy định |
| --- | --- | --- |
| `type` | string | Bắt buộc. Chỉ `cau-hoi` (câu hỏi, kiến nghị) hoặc `gop-y` (góp ý); phân biệt hoa thường. |
| `content` | string | Bắt buộc. Backend cắt khoảng trắng hai đầu rồi kiểm tra 10–2000 ký tự. Giữ nội dung HTML dưới dạng văn bản. |
| `wantReply` | boolean | FE gửi trạng thái ô muốn nhận trả lời riêng. Bỏ trường này thì mặc định `false`. |
| `contact` | string hoặc null | Bắt buộc có nội dung sau khi cắt khoảng trắng nếu `wantReply=true`. Tối đa 200 ký tự sau khi cắt khoảng trắng, kể cả khi không yêu cầu trả lời riêng. Chấp nhận thông tin liên hệ dạng văn bản, không bắt buộc chỉ là email. |
| `consent` | boolean | Bắt buộc là `true`, lấy từ ô xác nhận đồng ý của người gửi. |
| `website` | string hoặc null | Ô bẫy chống bot, người dùng thật để `""`. Nếu chuỗi khác rỗng, kể cả chỉ có dấu cách, backend trả 201 nhưng không lưu và không dùng hạn mức. Không dùng trường này để nhập URL website. |

Nên trim `content` và `contact` trước khi gửi. Khi muốn trả lời riêng, ví dụ `"wantReply": true, "contact": "nguoihoi@example.com"`. Hiện backend chỉ ghi nhận yêu cầu và liên hệ; biên tập viên chủ động trả lời riêng, không có chức năng tự gửi email.

Thành công: **HTTP 201**.

```json
{ "ok": true }
```

Phản hồi không có mã tra cứu. Nội dung mới ở trạng thái tiếp nhận nội bộ và chưa công khai. FE hiển thị thông báo đã nhận; không tự chèn câu vừa gửi vào danh sách công khai. Với ô bẫy, phản hồi thành công giống hệt nhưng không có bản ghi được lưu.

Sai dữ liệu: **HTTP 400**.

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "Dữ liệu gửi lên không hợp lệ.",
    "fields": {
      "content": "Nội dung cần từ 10 đến 2000 ký tự.",
      "consent": "Bạn cần đồng ý trước khi gửi."
    }
  }
}
```

`fields` là đối tượng ánh xạ tên trường sang thông báo lỗi, không phải mảng. Chỉ chứa các trường đang sai; lỗi nghiệp vụ có thể nằm tại `type`, `content`, `contact`, `consent`. JSON sai hoặc sai kiểu dữ liệu có thể trả tên trường khác hoặc `body`. FE giữ nội dung đang nhập và gắn lỗi vào trường tương ứng.

Vượt hạn mức: **HTTP 429**. Tối đa 5 bản ghi tiếp nhận/IP trong 60 phút gần nhất. Yêu cầu sai dữ liệu và ô bẫy không tính vào hạn mức. Header `Retry-After` là số giây cần chờ; FE không tự gửi lại liên tục.

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Bạn đã gửi 5 lần trong một giờ. Vui lòng thử lại sau.",
    "fields": null
  }
}
```

## Đọc danh sách công khai

`GET /api/v1/questions?page=1`. Query `page` là số nguyên 32 bit, tối thiểu 1, mặc định 1. Mỗi trang cố định 20 mục; không có tham số đổi kích thước trang hoặc tìm kiếm/lọc công khai.

Thành công: **HTTP 200**, ví dụ:

```json
{
  "items": [
    {
      "id": 130,
      "question": "Tôi có thể gửi góp ý về nội dung website ở đâu?",
      "answer": "Bạn chọn Góp ý trong biểu mẫu Hỏi – Đáp và gửi nội dung cho ban biên tập.",
      "answeredAt": "2026-10-16T06:00:00+00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `items` | array | Câu hỏi và câu trả lời được công khai, tối đa 20 mục. |
| `items[].id` | integer/int64 | Mã bản ghi, dùng làm khóa hiển thị của FE. |
| `items[].question` | string | Nội dung gốc người dùng đã gửi. |
| `items[].answer` | string | Bản câu trả lời đã được duyệt; không phải bản nháp đang sửa. |
| `items[].answeredAt` | string/date-time | Thời điểm duyệt/công bố gần nhất, ISO 8601 có múi giờ. FE định dạng thời gian Việt Nam nếu cần. |
| `total` | integer | Tổng số bản ghi công khai. |
| `page` | integer | Trang đang yêu cầu. |
| `totalPages` | integer | Tổng số trang, tối thiểu 1. |

Chỉ trả `cau-hoi` đã duyệt và công bố. Góp ý, câu mới, câu đang xử lý, bản bị gỡ công bố không xuất hiện. Sắp xếp theo thời điểm duyệt giảm dần, sau đó mã bản ghi giảm dần. Nếu không có kết quả hoặc yêu cầu trang vượt tổng số trang, `items=[]`; `page` vẫn là trang được yêu cầu, `totalPages` vẫn phản ánh tổng số trang.

`page<1`, sai kiểu hoặc vượt giới hạn số nguyên trả **400**, `error.code=VALIDATION`. `error.fields` có thể không xuất hiện trong lỗi số trang nhỏ hơn 1.

Không có thông tin liên hệ, IP, ghi chú, người xử lý hoặc câu trả lời nháp trong API công khai. API trả `Cache-Control: no-store`; FE cần tải lại danh sách để nhận thay đổi sau khi duyệt/gỡ công bố.

## Quy tắc tích hợp giao diện

- Hiển thị `question`, `answer` và thông báo dưới dạng văn bản có thoát ký tự. Không gán dữ liệu API trực tiếp vào `innerHTML` hoặc cơ chế render HTML thô.
- Tên trường và mã lỗi là hợp đồng để FE xử lý; nội dung thông báo có thể được diễn đạt lại. Đọc `error.code` và `error.fields` thay vì so sánh nguyên câu thông báo.
- Trạng thái xử lý nội bộ và cờ công bố là hai khái niệm riêng. Nội dung chỉ xuất hiện ở API GET sau thao tác **Duyệt và công bố** của ban biên tập.
- Portal chỉ dùng hai endpoint công khai. Endpoint dưới `/umbraco/management/` dành cho backoffice có phân quyền.

Section quản trị, API và dữ liệu nghiệp vụ vẫn được backend quản lý. Xem [tài liệu nghiệp vụ quản trị](hoi-dap.md) khi cần đối chiếu luồng xử lý.
