# API kết quả cuộc thi: trúng thưởng và xếp hạng

## 1. API công khai

```http
GET /api/v1/contests/{contestId}/results?page=1&pageSize=20
```

Không yêu cầu đăng nhập hoặc `X-Entry-Token`. Dùng ID cuộc thi, không suy luận theo tháng từ tên: một tháng có thể có nhiều cuộc thi. `page` mặc định 1, tối đa 1.000.000; `pageSize` mặc định 20, từ 1 đến 100. Phân trang chỉ áp dụng bảng xếp hạng; danh sách các lần quay đã chọn công bố đi kèm mỗi phản hồi.

Ví dụ phản hồi đã công bố:

```json
{
  "contest": {
    "id": 12,
    "name": "Cuộc thi tháng 9",
    "startAt": "2026-08-31T17:00:00Z",
    "endAt": "2026-09-30T16:59:59Z",
    "submitUntil": "2026-10-01T16:59:59Z"
  },
  "status": "published",
  "publishedAt": "2026-10-02T03:00:00Z",
  "version": 1,
  "leaderboard": {
    "total": 250,
    "page": 1,
    "pageSize": 20,
    "totalPages": 13,
    "items": [
      {
        "rank": 1,
        "code": "AD-ABCDEF",
        "fullName": "Nguyễn *** An",
        "phone": "091****678",
        "score": 200,
        "answered": 200,
        "submittedAt": "2026-09-15T02:00:00Z"
      }
    ]
  },
  "draws": [
    {
      "drawId": 7,
      "drawnAt": "2026-10-02T02:30:00Z",
      "winners": [
        {
          "rank": 1,
          "code": "AD-ABCDEF",
          "fullName": "Nguyễn *** An",
          "phone": "091****678",
          "score": 200
        }
      ]
    }
  ]
}
```

Ví dụ rút gọn: `items` thực tế có tối đa `pageSize` dòng.

Khi cuộc thi chưa hết hạn nộp bài, chưa được công bố hoặc đã gỡ công bố: HTTP 200, `status="pending"`, `publishedAt=null`, `version=0`, `leaderboard.total=0`, `items=[]`, `draws=[]`. Không trả nội dung nháp hay số lượng người trong bản nháp. Không có cuộc thi hoặc cuộc thi ngừng sử dụng (`is_active=0`): HTTP 404 `CONTEST_NOT_FOUND`. ID không dương hoặc tham số phân trang không hợp lệ: HTTP 400 `VALIDATION`.

Mọi thời gian UTC ISO-8601 có hậu tố `Z`. `Cache-Control: no-store` giúp việc gỡ công bố có hiệu lực với các lần tải mới. FE không nên lưu kết quả vào localStorage hoặc tự cache lâu dài.

### Quy tắc bảng xếp hạng xét giải

- Chỉ lấy lượt thuộc chính cuộc thi đó, `submitted`, `named`, có số điện thoại chuẩn, có điểm và thời điểm nộp.
- Mỗi số điện thoại lấy một lượt tốt nhất: điểm cao nhất, nếu bằng điểm chọn thời điểm nộp sớm nhất; nếu vẫn bằng dùng ID lượt tăng dần để ổn định kết quả.
- Xếp hạng toàn bộ các lượt tốt nhất theo cùng thứ tự; hạng là số liên tiếp 1, 2, 3… Không tạo hạng đồng điểm. Hạng không bắt đầu lại khi đổi trang.
- Không đưa lượt ẩn danh/đang làm vào bảng xét giải. `total` là số điện thoại đủ điều kiện khác nhau, không phải tổng lượt tạo hoặc tổng người trúng thưởng.
- Xếp hạng không phải quay thưởng và không tự xác định người nhận giải. Danh sách trúng thưởng lấy từ các lần quay được quản trị viên chọn công bố.

### Quy tắc danh sách trúng thưởng

- Chỉ những `drawIds` được chọn trong lần công bố mới xuất hiện. Các lần quay khác không tự công khai.
- Mỗi lần quay có `drawId` riêng, sắp theo lúc quay rồi ID; người trúng sắp theo hạng trong lần quay. Không gộp hoặc đánh lại hạng giữa các lần quay.
- Xác minh người trúng thuộc cuộc thi, đã nộp, có tên và điện thoại hợp lệ; mã, điện thoại, điểm phải khớp lượt nguồn. Lần quay cũ có người ẩn danh/dữ liệu không khớp bị từ chối công bố với `INVALID_DRAW_RESULT`; không tự bỏ người hoặc quay lại.
- Không tự thay đổi thuật toán quay thưởng hoặc bổ sung quy tắc cấm nhận nhiều giải. Nếu quản trị viên chọn nhiều lần quay có cùng người, mỗi lần vẫn được hiển thị riêng đúng bản ghi đã chốt.

### Bảo vệ thông tin

Điện thoại được che `091****678`. Tên từ ba từ trở lên hiển thị từ đầu + `***` + từ cuối; tên hai từ chỉ giữ từ đầu (`Trần ***`), tên một từ trả `***`. Không có tên đầy đủ, điện thoại đầy đủ, đơn vị, token, IP, ID lượt nội bộ, ghi chú hoặc người thực hiện quay trong phản hồi công khai. Bảng snapshot công khai cũng chỉ lưu các trường cá nhân đã che.

## 2. Quản trị công bố/gỡ công bố

### Giao diện backoffice hiện tại

Vào **Quản lý cuộc thi → Công bố kết quả**. Lit Element sử dụng API native Umbraco:

```http
GET /umbraco/management/api/v1/antc/contest-reports/contests/{contestId}/publication
PUT /umbraco/management/api/v1/antc/contest-reports/contests/{contestId}/publication
```

Body PUT vẫn là `{ "isPublished": true, "drawIds": [7, 8], "expectedRevision": 0 }`. Yêu cầu phiên xác thực backoffice từ `UMB_AUTH_CONTEXT` và nhóm **Quản trị cuộc thi**. Không cần và không còn dùng form Razor `/quan-tri` để lấy anti-forgery token. Xem [hướng dẫn backoffice](../ban-giao/Trang-quan-tri-cuoc-thi.md).

### API cookie cũ giữ tương thích

Các endpoint bên dưới vẫn giữ cho client cũ; giao diện mới không gọi chúng.

Hai endpoint tương thích sau sử dụng **phiên cookie backoffice Umbraco** và nhóm **Quản trị cuộc thi**. Giao diện backoffice hiện tại sử dụng API native phía trên, không còn trang Razor `/quan-tri`. Tài khoản Administrators không thuộc nhóm này vẫn nhận 403; chưa đăng nhập nhận 401. Không dùng token thí sinh thay thế phiên quản trị.

```http
GET /api/v1/admin/contest/campaigns/{contestId}/results/publication
```

Trả trạng thái cho quản trị viên, gồm `contestId`, `isPublished`, `revision`, `publishedAt`, `drawIds`. Chưa công bố lần nào: revision 0 và danh sách lần quay rỗng. Sau khi gỡ, `publishedAt` vẫn là thời điểm công bố trước đó để đối chiếu; API công khai không trả thời điểm này khi pending.

```http
PUT /api/v1/admin/contest/campaigns/{contestId}/results/publication
Content-Type: application/json
RequestVerificationToken: <anti-forgery request token của phiên hiện tại>

{
  "isPublished": true,
  "drawIds": [7, 8],
  "expectedRevision": 0
}
```

`expectedRevision` phải lấy từ GET trạng thái mới nhất. `drawIds` không bắt buộc; tối đa 100 ID khác nhau, phải thuộc cuộc thi. Danh sách rỗng cho phép công bố bảng xếp hạng trước khi có kết quả quay, `draws=[]`. PUT yêu cầu anti-forgery token và cookie tương ứng; thiếu token nhận 400, không thay đổi dữ liệu.

Để lấy token cho client cookie cũ, gọi GET `/api/v1/admin/contest/campaigns/{contestId}/results/publication/antiforgery` bằng phiên quản trị hiện tại. Gửi `requestToken` trả về qua header `RequestVerificationToken`, giữ cookie cùng origin. Không còn dùng form Razor Pages vì chúng đã được gỡ. Client mới nên sử dụng API native phía trên.

Ví dụ gọi từ màn hình quản trị đã đăng nhập:

```javascript
const contestId = 12;
const csrfResponse = await fetch(`/api/v1/admin/contest/campaigns/${contestId}/results/publication/antiforgery`, { credentials: 'same-origin' });
if (!csrfResponse.ok) throw new Error('Không có phiên hoặc quyền quản trị');
const token = (await csrfResponse.json()).requestToken;
if (!token) throw new Error('Không lấy được anti-forgery token');
const stateResponse = await fetch(`/api/v1/admin/contest/campaigns/${contestId}/results/publication`);
if (!stateResponse.ok) throw new Error('Không đọc được trạng thái công bố');
const state = await stateResponse.json();
const response = await fetch(`/api/v1/admin/contest/campaigns/${contestId}/results/publication`, {
  method: 'PUT', credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': token },
  body: JSON.stringify({ isPublished: true, drawIds: [7, 8], expectedRevision: state.revision })
});
const body = await response.json();
if (!response.ok) throw new Error(body.error?.message || 'Không công bố được');
```

Gỡ công bố bằng cùng PUT:

```json
{ "isPublished": false, "expectedRevision": 1 }
```

Chỉ được công bố sau `end_at + submit_grace_hours` và khi cuộc thi đang được sử dụng. Công bố chốt bảng xếp hạng và người trúng thành một snapshot trong transaction cùng nhật ký kiểm toán. Dữ liệu nguồn thay đổi/xóa sau đó không âm thầm thay đổi kết quả công khai. Muốn thay nội dung: gỡ công bố → chọn dữ liệu phù hợp → công bố lại bằng revision mới. Yêu cầu lặp có cùng trạng thái/danh sách lần quay và đúng revision hiện tại không tạo lại snapshot hoặc đổi thời điểm công bố.

Snapshot cũ được giữ trong hàng dữ liệu khi gỡ; công bố lại sẽ thay snapshot bằng bản mới. Nhật ký `results.publish`/`results.unpublish` giữ người thao tác, thời gian và thông tin phiên bản, không phải kho lưu toàn bộ các bản kết quả cũ.

### Lỗi

Tất cả lỗi dùng `{ "error": { "code": "...", "message": "Thông báo tiếng Việt", "fields": {} } }`.

| HTTP | Mã | Ý nghĩa |
| --- | --- | --- |
| 400 | `VALIDATION` | Dữ liệu, ID, phân trang hoặc lựa chọn lần quay sai |
| 401 | `UNAUTHORIZED` | Chưa có phiên backoffice |
| 403 | `FORBIDDEN` | Không thuộc nhóm hoặc bị chặn bởi allowlist IP |
| 404 | `CONTEST_NOT_FOUND` | Cuộc thi không tồn tại/không công khai |
| 409 | `CONTEST_NOT_CLOSED` | Chưa hết hạn nộp hoặc cuộc thi ngừng sử dụng |
| 409 | `RESULTS_CHANGED` | Revision không còn đúng; tải lại trạng thái |
| 409 | `RESULTS_ALREADY_PUBLISHED` | Phải gỡ trước khi đổi danh sách lần quay |
| 409 | `INVALID_DRAW_RESULT` | Kết quả quay có người không đủ điều kiện hoặc không khớp lượt |

## 3. CSDL và kiểm thử

Migration `20261020025539_PublishContestResults` bổ sung bảng `contest_published_result`; không thay điểm/đáp án/lần quay đang có. Các cuộc thi cũ mặc định chưa công bố. Khởi động lại ứng dụng mới để chạy migration; không tự gọi công bố trên dữ liệu thật khi triển khai.

Kiểm thử dùng CSDL tạm: bảng xếp hạng tốt nhất theo số điện thoại; thứ tự khi bằng điểm; phân trang; snapshot không đổi theo nguồn; che tên hai từ; đúng thời điểm hết gia hạn; gỡ công bố; sai revision; hai yêu cầu đồng thời chỉ một lần ghi/nhật ký; không lẫn cuộc thi; không công bố người ẩn danh. Kiểm thử HTTP bằng Umbraco thật bao gồm 401/403, anti-forgery, công bố cả hai danh sách và gỡ có hiệu lực ngay.

Chưa thay đổi phần hiển thị kết quả trên cổng thông tin. Đã có màn hình **Công bố kết quả** trong section Quản lý cuộc thi của backoffice; các Razor Pages quản trị cũ đã được gỡ.

Kết quả kiểm tra ngày 20/10/2026: toàn bộ **181/181 kiểm thử đạt**, bao gồm luồng HTTP Umbraco thật và kiểm thử hai yêu cầu công bố đồng thời. Không sửa hoặc công bố dữ liệu trên hai CSDL của dự án trong quá trình kiểm thử.
