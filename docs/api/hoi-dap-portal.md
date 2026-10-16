# Hợp đồng API Hỏi – Đáp dành cho frontend portal

Frontend tự xây dựng biểu mẫu gửi câu hỏi/góp ý, danh sách và phần chi tiết câu đã trả lời. Backend cung cấp các API dưới đây. Không cần đăng nhập, không gửi token hoặc cookie quản trị Umbraco từ portal. Có thể import [OpenAPI 3.0.3](hoi-dap-portal.openapi.json) vào Postman hoặc công cụ đọc OpenAPI.

Base URL phát triển: `http://localhost:11000`. FE cấu hình base URL theo môi trường triển khai.

| Phương thức | Đường dẫn | Chức năng |
| --- | --- | --- |
| POST | `/api/v1/questions` | Gửi câu hỏi, kiến nghị hoặc góp ý |
| GET | `/api/v1/questions` | Danh sách công khai có tìm kiếm, phân trang, sắp xếp |
| GET | `/api/v1/questions/{id}` | Chi tiết một câu hỏi và câu trả lời đã duyệt, công bố |

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

```http
GET /api/v1/questions?page=1&pageSize=10&search=OTP&sort=newest
```

| Query | Kiểu | Mặc định | Quy định |
| --- | --- | --- | --- |
| `page` | integer/int32 | `1` | Tối thiểu 1. |
| `pageSize` | integer/int32 | `20` | Từ 1 đến 50. Giá trị ngoài khoảng trả 400, không tự điều chỉnh. |
| `search` | string | Không lọc từ khóa | Tối đa 200 ký tự sau trim. Tìm chuỗi con trong câu hỏi và bản trả lời đã duyệt; không phân biệt hoa/thường tiếng Việt, giữ nguyên dấu. Chuỗi trắng được coi là không lọc. |
| `sort` | string | `newest` | `newest`: ngày duyệt giảm dần; `oldest`: ngày duyệt tăng dần. Bỏ trống hoặc chuỗi trắng dùng mặc định; giá trị khác hai mã này trả 400. |

Từ khóa được tìm như văn bản: `%`, `_`, `*`, `?`, `[` không có ý nghĩa wildcard. Tìm `đường dẫn` khớp `ĐƯỜNG DẪN`, nhưng `duong dan` không tự khớp chuỗi có dấu. FE dùng bộ dựng query URL để mã hóa từ khóa tiếng Việt. Không tìm trong liên hệ, ghi chú hoặc bản trả lời nháp.

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
  "pageSize": 10,
  "totalPages": 1
}
```

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `items` | array | Câu hỏi và câu trả lời được công khai, tối đa `pageSize` mục. |
| `items[].id` | integer/int64 | Mã bản ghi, dùng làm khóa hiển thị của FE. |
| `items[].question` | string | Nội dung gốc người dùng đã gửi. |
| `items[].answer` | string | Bản câu trả lời đã được duyệt; không phải bản nháp đang sửa. |
| `items[].answeredAt` | string/date-time | Thời điểm duyệt/công bố gần nhất, ISO 8601 có múi giờ. FE định dạng thời gian Việt Nam nếu cần. |
| `total` | integer | Tổng số bản ghi công khai khớp từ khóa, trước khi phân trang. |
| `page` | integer | Trang đang yêu cầu. |
| `pageSize` | integer | Số mục mỗi trang đã yêu cầu. |
| `totalPages` | integer | Tổng số trang, tối thiểu 1. |

Chỉ trả `cau-hoi` đã duyệt và công bố. Góp ý, câu chưa công bố và bản bị gỡ không xuất hiện. Khi cùng thời điểm duyệt, mã bản ghi được sắp xếp cùng chiều với `sort` để phân trang ổn định. Nếu không có kết quả hoặc yêu cầu trang vượt tổng số trang, `items=[]`; `page` vẫn là trang được yêu cầu, `totalPages` vẫn phản ánh tổng số trang và tối thiểu 1.

Query sai kiểu, số trang nhỏ hơn 1, số mục ngoài 1–50, từ khóa quá 200 ký tự hoặc `sort` không hợp lệ trả **400**, `error.code=VALIDATION`. `error.fields` ánh xạ tên query sang thông báo, ví dụ:

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "Tham số danh sách không hợp lệ.",
    "fields": { "pageSize": "Số mục mỗi trang phải từ 1 đến 50." }
  }
}
```

Không có thông tin liên hệ, IP, ghi chú, người xử lý hoặc câu trả lời nháp trong API công khai. API trả `Cache-Control: no-store`; FE cần tải lại danh sách để nhận thay đổi sau khi duyệt/gỡ công bố.

## Đọc chi tiết câu đã công bố

```http
GET /api/v1/questions/130
```

`id` là mã số nguyên 64 bit lấy từ danh sách công khai. **HTTP 200** trả trực tiếp cùng cấu trúc một mục danh sách:

```json
{
  "id": 130,
  "question": "Tôi có thể gửi góp ý về nội dung website ở đâu?",
  "answer": "Bạn chọn Góp ý trong biểu mẫu Hỏi – Đáp và gửi nội dung cho ban biên tập.",
  "answeredAt": "2026-10-16T06:00:00+00:00"
}
```

FE dùng endpoint này cho trang chi tiết hoặc mở câu hỏi qua URL chia sẻ. API chỉ đọc bản câu trả lời đã duyệt. Câu chưa công bố, đã gỡ, góp ý và mã không tồn tại đều trả cùng **HTTP 404**; không tiết lộ bản ghi riêng có tồn tại hay không:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy câu hỏi.",
    "fields": null
  }
}
```

Chi tiết cũng trả `Cache-Control: no-store`. FE xử lý 404 khi người dùng mở một câu vừa bị gỡ công bố.

## Quy tắc tích hợp giao diện

- Hiển thị `question`, `answer` và thông báo dưới dạng văn bản có thoát ký tự. Không gán dữ liệu API trực tiếp vào `innerHTML` hoặc cơ chế render HTML thô.
- Tên trường và mã lỗi là hợp đồng để FE xử lý; nội dung thông báo có thể được diễn đạt lại. Đọc `error.code` và `error.fields` thay vì so sánh nguyên câu thông báo.
- Trạng thái xử lý nội bộ và cờ công bố là hai khái niệm riêng. Nội dung chỉ xuất hiện ở API GET sau thao tác **Duyệt và công bố** của ban biên tập.
- Portal dùng các endpoint công khai trong tài liệu này. Endpoint dưới `/umbraco/management/` dành cho backoffice có phân quyền.

Section quản trị, API và dữ liệu nghiệp vụ vẫn được backend quản lý. Xem [tài liệu nghiệp vụ quản trị](hoi-dap.md) khi cần đối chiếu luồng xử lý.
