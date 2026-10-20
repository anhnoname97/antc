# FE-25 · Review của Orchestrator

## 2026-10-17 · Review T1 (giao diện màn Đăng ký + kiểm tra phía trình duyệt)

## Phạm vi đã review

- Đối tượng: `git diff` (chỉ `Views/thiPage.cshtml`) và các file mới chưa theo dõi trong `src/`: `wwwroot/assets/css/contest.css`, `wwwroot/assets/js/contest/register.js`, `wwwroot/assets/js/contest/phone.js`. Không có thay đổi C#, uSync, migration.
- Chuẩn so sánh: `1-thiet-ke.md` (hành vi 1–8, 12; câu chữ (a)–(d); bảng Task › T1; trường hợp biên), `2-ban-giao.md` › T1, `docs/quyet-dinh.md` (QĐ-001 → QĐ-007; QĐ-007 đã được hoãn sang T2 theo `1-thiet-ke.md` › "Trạng thái task sau xác nhận"), bản dựng `docs/ban-dung/antoantaichinh-ban-dung-thu.html` dòng 1225–1306 (đối chiếu câu chữ), `tokens.css`, `components.css`, `base.css`.
- **Không review được**: giao diện thực tế (Orchestrator không chạy web). Không so sánh được bằng mắt với `th-01`, `th-02`, `th-03`, `th-10`, `mb-06`; kết luận về AC1 dựa trên báo cáo của Worker và đối chiếu markup/câu chữ với bản dựng.

## Đối chiếu yêu cầu

| Mục | Kết quả review | Bằng chứng |
|---|---|---|
| 1. 3 ô thông tin, dữ liệu động, `[…]` khi trống | Đạt | `thiPage.cshtml:5-17, 39-50`; `rulesText` mã hóa từng dòng rồi chèn `<br />` (`:44`), không dùng `Html.Raw` |
| 2. Radio, đổi bằng `hidden` | Đạt | `register.js:47-56`; `contest.css:2` ép `[hidden]` thắng `display:flex` của `.rgform` |
| 3–5. Form, hộp hồng, hộp đồng ý 7 mục, ô tick, hộp ẩn danh, lối luyện tập | Đạt | `thiPage.cshtml:66-111`; câu chữ khớp bản dựng dòng 1250–1306 |
| 6. Sửa câu chữ (a)–(d) | Đạt | (a) `:85`; (b) `:71`; (c) không còn 2 dòng "Bản dựng thử"; (d) không còn khối dưới 16 tuổi |
| 7. 3 lỗi đúng câu, đúng thứ tự; chuẩn hóa số | Đạt | `register.js:5-7, 33-40`; `phone.js:4-13` đúng quy tắc `84`(11 số)→`0`, `^0\d{9}$` |
| 8. `role="alert"`, `--c-danger-600`, focus ô sai đầu tiên | Đạt | `thiPage.cshtml:105`, `contest.css:61`, `register.js:17-30` |
| 12. Responsive | Đạt theo mã (lưới `auto-fit` + `min(100%, …)`, `@media` 900/640px, `contest.css:22,29,41,81-87`); số đo do Worker cung cấp |
| Không `style="…"`, cỡ chữ `rem`, comment tiếng Việt không dấu | Đạt | Grep không có `style=` trong view; các `font-size` dùng biến hoặc `rem` |
| `submit(payload)` để T2 thay thân; hàm số điện thoại export cho FE-29 | Đạt | `register.js:43-45`; `phone.js` |
| Payload | Đạt | `{ mode, fullName, phone, org, consent }`, ẩn danh `{ mode: "anon" }` khớp ghi chú T2 trong `1-thiet-ke.md` |
| Ngoài phạm vi | Không có | Không đụng uSync, C#, layout dùng chung |

## Phát hiện

### [Thấp] Màu viết cứng trong `.consent`
- Vị trí: `src/ANTC.Portal.App/Umbraco.Web.UI/wwwroot/assets/css/contest.css:57`
- Bằng chứng: `border: 1px solid #E8B4AE;`. Quy ước dự án (`CLAUDE.md` › Quy ước › Frontend) và chính đầu file (`contest.css:1` "Chi dung bien trong tokens.css") yêu cầu màu lấy từ `tokens.css`. Giá trị này chép từ bản dựng (dòng 1294).
- Tình huống xảy ra: đổi bảng màu ở `tokens.css` thì viền ô đồng ý không đổi theo.
- Hướng khắc phục: dùng `var(--c-tint-border)` (`tokens.css:18`, #F3C5C0, gần với màu bản dựng). Không thêm token mới.

### [Thấp] Thuộc tính `target` của `rulesLink` dựng bằng chuỗi, không có dấu nháy
- Vị trí: `src/ANTC.Portal.App/Umbraco.Web.UI/Views/thiPage.cshtml:47`
- Bằng chứng: `@(rulesLink.Target is { Length: > 0 } ? $"target={rulesLink.Target}" : "")` sinh ra `target=_blank` (không nháy). Razor có mã hóa nên không phải lỗ hổng XSS, nhưng là cách viết dễ vỡ và khác idiom Razor.
- Tình huống xảy ra: chưa thấy giá trị thực gây lỗi (MultiUrlPicker chỉ cho `_blank`); rủi ro khi sửa về sau.
- Hướng khắc phục: viết `target="@(string.IsNullOrEmpty(rulesLink.Target) ? null : rulesLink.Target)"` (Razor tự bỏ thuộc tính khi `null`), và thêm `rel="noopener"` khi mở tab mới.

### [Thấp] Thiếu kiểm chứng giao diện theo cột "Cách kiểm chứng" của T1
- Vị trí: `2-ban-giao.md` › Còn tồn tại / rủi ro.
- Bằng chứng: `1-thiet-ke.md` › Task › T1 yêu cầu so với `th-01`, `th-03`, `th-10`, `mb-06` và thử 3 lỗi theo `th-02`. Worker mới so `th-01` ở 1440px; chưa chụp trạng thái có lỗi, trạng thái ẩn danh, chưa so `th-10`, `mb-06`, chưa đo ở 900px.
- Tình huống xảy ra: AC1 mới được xác nhận một phần.
- Hướng khắc phục: xem "Yêu cầu chạy thử cho Worker" bên dưới.

Không có phát hiện mức Nghiêm trọng, Cao hay Trung bình.

## Sai khác tài liệu ↔ code

- Câu `<noscript>`: bản dựng dòng 1234 ghi "Cần bật JavaScript để đăng ký và làm bài thi."; code ghi "Cần bật JavaScript để đăng ký dự thi." (`thiPage.cshtml:35`) theo đề xuất trong `1-thiet-ke.md` › Trường hợp biên. Chấp nhận; không phải lỗi.
- `operatorName`, `dataContact` đọc từ `home` thay vì Cài đặt cuộc thi: đúng như `1-thiet-ke.md` › Đối chiếu đã ghi; không phải lỗi.
- Hero nền đỏ trơn, chưa có ảnh nền như `th-01`: hero tạm, chờ FE-08 (đúng phạm vi).
- QĐ-007 (gạch đầu dòng "Lượt thi gắn với trình duyệt…") chưa có: đúng, đã hoãn sang T2.

## Cần xác minh

- `maxAttempts` = 0 hoặc âm trong backoffice sẽ hiện "00 lượt" / "-1 lượt" (`thiPage.cshtml:9-10`). Chưa rõ backoffice có chặn giá trị này không. Nếu không chặn, đề nghị coi `≤ 0` như trống (mặc định 2) — có thể gộp vào T3/T4 khi làm `IContestSettings` để trang và API cùng cách xử lý.
- `rulesLink` và `rulesText` nhiều dòng chưa thử với giá trị thật (Worker đã nêu).

## Đề xuất (không bắt buộc)

- `register.js:24`: khi bấm gửi lại với cùng một lỗi, `textContent` không đổi nên trình đọc màn hình có thể không đọc lại. Có thể xóa nội dung rồi gán lại ở khung hình kế tiếp (`requestAnimationFrame`). Làm cùng T2 nếu tiện.
- "Công an xã Thiên Lộc" đang là chữ cứng ở `thiPage.cshtml:95` (giống bản dựng), trong khi nội dung `giới-thiệu` đã có giá trị này (`uSync/v18/Content/giới-thiệu.config:68`). Để lại cho việc dùng chung thông tin pháp nhân sau này; không sửa trong FE-25.

## Yêu cầu chạy thử cho Worker

Làm cùng lượt T2 (sau khi sửa 2 mục CSS/Razor ở trên), ghi kết quả vào mục T2 của `2-ban-giao.md`:

1. `run-local`, mở `/tham-gia/cuoc-thi`:
   - 1440px trạng thái lỗi (bấm gửi khi trống) so với `th-02`;
   - 1440px chế độ ẩn danh so với `th-03`;
   - so với `th-10` và `mb-06` (390px; dùng CDP `Emulation.setDeviceMetricsOverride` như lần trước nếu cửa sổ headless không xuống được 390px);
   - 900px: cột bên xuống dưới thẻ chính.
2. Nhập tạm `rulesText` hai dòng và `rulesLink` (mở tab mới) trong backoffice, tải lại trang: xuống dòng đúng, liên kết có `target="_blank"` và `rel="noopener"`. Nhập xong thì không commit file uSync nội dung do việc thử này sinh ra (trừ ngày mẫu cần cho T3 theo QĐ-006).

## Kết luận

**T1 ĐẠT.** Không có lỗi chặn; hành vi 1–8, 12 và câu chữ (a)–(d) đúng thiết kế; không vi phạm quyết định đã chốt. T2 bắt đầu được ngay.

Việc Worker phải sửa (gộp vào lượt T2, không mở lại T1):

1. `contest.css:57`: thay `#E8B4AE` bằng `var(--c-tint-border)`.
2. `thiPage.cshtml:47`: viết lại thuộc tính `target` có nháy, bỏ khi rỗng, thêm `rel="noopener"` khi mở tab mới.
3. Bổ sung kiểm chứng giao diện theo mục "Yêu cầu chạy thử cho Worker".

Rủi ro còn lại: AC1 mới xác nhận ở 1440px trạng thái mặc định; AC3–AC5 thuộc T2–T5.

## 2026-10-17 · Review T2 (lớp gọi API-01 + mock, nối form, xử lý lỗi) và 3 việc sửa theo review T1

## Phạm vi đã review

- Đối tượng: `git diff` (chỉ `Views/thiPage.cshtml`) và các file chưa theo dõi trong `src/`: `wwwroot/assets/css/contest.css`, `wwwroot/assets/js/contest/contest-api.js` (mới ở T2), `register.js`, `phone.js` (không đổi từ T1). `git status` xác nhận không có thay đổi C#, uSync, migration; file nội dung uSync Worker sửa tạm để thử `rulesText`/`rulesLink` đã được trả lại.
- Chuẩn so sánh: `2-ban-giao.md` › mục T2; `1-thiet-ke.md` › hành vi 9–11, bảng Task › T2, "Trạng thái task sau xác nhận" › T2, CXN-6; `3-review.md` › Review T1 › 3 việc phải sửa; `docs/quyet-dinh.md` QĐ-002 → QĐ-007; sheet "API" › API-01 (r5) và bảng mã lỗi; sheet "Công việc" › FE-28 (chữ ký module, `at_entry`, `at_practice`, mock cùng chữ ký).
- **Không review được**: giao diện và hành vi chạy thật (Orchestrator không chạy web). Kết quả chạy mock, ảnh chụp `th-02`, `th-03`, `th-10`/`mb-06`, 900px và thử `rulesText`/`rulesLink` dựa trên báo cáo của Worker; review chỉ đối chiếu mã với các báo cáo đó.

## Đối chiếu 3 việc sửa theo review T1

| Việc | Kết quả | Bằng chứng |
|---|---|---|
| 1. Viền `.consent` dùng token | Đạt | `contest.css:57` `var(--c-tint-border)`; token có ở `tokens.css:18`. Không còn mã màu cứng trong file |
| 2. Thuộc tính `target` có nháy, bỏ khi rỗng, `rel="noopener"` | Đạt | `thiPage.cshtml:47`; Razor bỏ thuộc tính khi giá trị `null`. Worker báo HTML ra `target="_blank" rel="noopener"` |
| 3. Kiểm chứng giao diện | Đạt (theo báo cáo) | `2-ban-giao.md` › T2 › Giao diện: đã so `th-02`, `th-03` ở 1440px, `th-10`/`mb-06` ở 390px, đo 900px; thử `rulesText` hai dòng (có `<b>` được mã hóa) và `rulesLink` `_blank`. Còn thiếu ảnh `th-10` ở 1440px; không chặn |

## Đối chiếu yêu cầu T2

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| QĐ-007: câu "Lượt thi gắn với trình duyệt…" ở hộp hồng và hộp ẩn danh | Đạt, đúng từng chữ | `thiPage.cshtml:73`, `:92` |
| `createEntry(payload)` trả `{ok,data}` / `{ok:false,error:{code,message,fields}}` | Đạt | `contest-api.js:54-71`, `:40-42` |
| Đọc lỗi dạng `{error:{…}}` và dạng thiếu `fields` (QĐ-004) | Đạt | `contest-api.js:45-51` |
| Mock bật bằng `?mock=` hoặc cờ trong module | Đạt | `contest-api.js:11-19`, 7 kịch bản `:23-38` |
| 9. Khóa nút, "Đang đăng ký…", mở lại khi lỗi; chặn bấm kép | Đạt | `register.js:62-67`, `:121-138`; cờ `busy` chặn cả nút ẩn danh |
| 10. `ATTEMPT_LIMIT` đúng câu, dùng số đã chuẩn hóa và `maxAttempts` | Đạt | `register.js:99-102`; `payload.phone` lấy từ `validate()` đã chuẩn hóa (`:55`, `:59`) |
| 10. `CONTEST_CLOSED` thay form bằng khối thông báo, giữ lối luyện tập | Đạt | `register.js:74-77`; `thiPage.cshtml:112-115` dùng câu CXN-6 |
| 10. `RATE_LIMITED`, lỗi mạng, 5xx, mã lạ → câu CXN-6 | Đạt | `register.js:8-9`, `:107-118` |
| 10. `VALIDATION` → `fields[...]`, focus `rgname`/`rgphone`/`rgorg`/`rgok` | Đạt (xem phát hiện Thấp 1) | `register.js:29`, `:110-115` |
| 11. Lưu `at_entry` `{code, token, mode, attemptNo, maxAttempts}`, try/catch | Đạt | `contest-api.js:74-87` |
| Thành công: `location.hash = '#ngan-hang'`, khối tạm | Đạt | `register.js:130-134`, `:80-87` |
| Lối luyện tập: `at_practice`, không gọi API | Đạt | `contest-api.js:90-94`; `register.js:168-171` không gọi `createEntry` (khớp FE-28 "không phát sinh yêu cầu nào tới /api/v1/contest") |
| Payload khớp API-01 (`named` đủ 5 trường; `anon` chỉ `{mode}`) | Đạt | `register.js:59`, `:165`; sheet "API" r5 |
| Bảo mật: không `innerHTML`, không `Html.Raw` | Đạt | Mọi chữ từ máy chủ (`code`, `message`, `fields`) gán bằng `textContent` (`register.js:45`, `:82-84`) |
| Quy ước: không `style=`, `rem`, comment không dấu, chữ hiển thị có dấu | Đạt | Grep `style=` trong view: không có |
| Ngoài phạm vi | Không có | Không đụng C#, uSync, layout dùng chung |

## Phát hiện

### [Thấp] `VALIDATION`: chọn "trường đầu tiên" theo thứ tự khóa máy chủ gửi, và giá trị không phải chuỗi hiện ra chữ "null"
- Vị trí: `src/ANTC.Portal.App/Umbraco.Web.UI/wwwroot/assets/js/contest/register.js:111-112`
- Bằng chứng: `Object.keys(error.fields).find((k) => k in fieldEls)` lấy theo thứ tự khóa trong JSON; `String(error.fields[key]) || error.message` biến `null` thành `"null"` (chuỗi khác rỗng nên không rơi về `message`); mảng `["a","b"]` thành `"a,b"`.
- Tình huống xảy ra: máy chủ trả `fields: { phone: "…", fullName: "…" }` → báo lỗi số điện thoại và focus `rgphone`, trong khi ô sai đầu tiên trên form là họ tên (khác thứ tự kiểm tra ở hành vi 7). Máy chủ trả `fields: { phone: null }` → hiện chữ "null".
- Hướng khắc phục: duyệt theo thứ tự form `['fullName','phone','org','consent']`, lấy khóa đầu tiên có trong `fields`; lấy chữ bằng `typeof v === 'string' ? v : Array.isArray(v) ? v[0] : ''`, rỗng thì dùng `error.message`.

### [Thấp] Đổi radio được trong lúc đang chờ máy chủ
- Vị trí: `register.js:62-67` (chỉ khóa 2 nút), `:140-149`
- Bằng chứng: `setBusy` không khóa `input[name="rgmode"]`; `showError` chọn hộp lỗi theo chế độ đang hiện (`:33-35`).
- Tình huống xảy ra: bấm "Đăng ký…" (có tên), đổi sang "Thi ẩn danh" trước khi có kết quả; máy chủ trả `ATTEMPT_LIMIT` → câu "Số 09… đã dùng hết…" hiện trong hộp ẩn danh, focus vào `rgphone` đang bị ẩn (không có tác dụng). Nếu thành công thì lượt có tên vẫn được tạo dù người dùng đã chuyển sang ẩn danh (chấp nhận được vì đã gửi đi).
- Hướng khắc phục: trong `setBusy` đặt `modesBox.disabled = on` (`#modes` là `fieldset`, thuộc tính `disabled` khóa cả hai radio).

### [Thấp] Hằng `MSG_CLOSED` không dùng tới
- Vị trí: `register.js:10`
- Bằng chứng: câu này nằm cứng trong `thiPage.cshtml:114`; trong JS không có chỗ nào đọc `MSG_CLOSED`.
- Tình huống xảy ra: sửa câu ở một chỗ, chỗ kia lệch.
- Hướng khắc phục: xóa hằng (khối `#closedbox` do máy chủ render là nơi giữ câu, đúng hướng T3).

Không có phát hiện mức Nghiêm trọng, Cao hay Trung bình cho T2.

## Sai khác tài liệu ↔ code

- Tiêu đề khối `#closedbox` "Chưa đăng ký được" (`thiPage.cshtml:113`) và tiêu đề `#donebox` "Đã vào cuộc thi" (`:117`) là chữ Worker tự đặt, CXN-6 chỉ chốt câu thân. Chấp nhận như chữ tạm (khối `#donebox` sẽ bị FE-26 thay); Worker chưa ghi vào mục Giả định — ghi bổ sung khi bàn giao T3.
- `createEntry` bọc kết quả trong `{ok, data | error}`, FE-28 viết "mọi lỗi trả về dạng thống nhất `{ code, message, fields }`": khớp `1-thiet-ke.md` › Phương án A (đã chốt ở QĐ-002); phần `error` đúng dạng FE-28. Không phải lỗi.
- Mở lại trang có `#ngan-hang` mà chỉ có `at_practice` (không có `at_entry`) thì hiện lại form đăng ký: thuộc FE-28, không thuộc FE-25.

## Cần xác minh

- `MOCK_DEFAULT = true` (`contest-api.js:11`): đúng thiết kế T2, nhưng **nhánh không được merge hay triển khai trước khi T5 xong**, vì khi đó mọi người truy cập đều nhận "Đã đăng ký" giả mà máy chủ không ghi gì. Xem ghi chú T5.
- `maxAttempts` ≤ 0 vẫn hiện "00"/"-1 lượt" (`thiPage.cshtml:9-10`) và JS chỉ đổi `0` → 2 (`register.js:28`, `Number(-1) || 2` = -1). Data type `maxAttempts` là `Umbraco.Integer` dùng chung (`uSync/v18/ContentTypes/thipage.config:93-98`, Definition `2e6d3631…`), không có ràng buộc giá trị nhỏ nhất, nên backoffice không chặn. Xử lý ở T3/T4 (xem ghi chú bên dưới).

## Đề xuất (không bắt buộc)

- `RATE_LIMITED` có header `Retry-After` (sheet "API" › bảng mã lỗi). Khi BE-26 làm giới hạn tần suất, `createEntry` có thể chuyển giá trị này vào `error` để câu thông báo nói rõ thời gian chờ. Không làm trong FE-25.

## Ghi chú cho T3 và T4

**`IContestSettings` (dùng chung cho trang và API, QĐ-003, QĐ-006)**

1. `maxAttempts`: đọc `int?`; `null` hoặc `≤ 0` → dùng mặc định **2** (giống mô tả thuộc tính "Mặc định 2." ở `thipage.config:98`). Không chặn trang hay báo lỗi khi giá trị sai. Trang (`thiPage.cshtml`: chữ "02", `data-max-attempts`), câu `ATTEMPT_LIMIT` phía JS và việc đếm lượt ở API-01 đều lấy **cùng một giá trị** từ dịch vụ này; view bỏ dòng `Model.Value<int?>("maxAttempts") ?? 2`. Định dạng `ToString("00")` giữ ở view.
2. Đặt hàm tính trạng thái (`upcoming` / `open` / `closed`) trong dịch vụ hoặc hàm tĩnh ở `Umbraco.Plugin.Custom.Core`, nhận `now` (UTC) làm tham số để dễ thử; trang và API gọi cùng hàm (QĐ-006).
3. Giờ Việt Nam: `contestStart`/`contestEnd` là `Umbraco.DateTime` (`thipage.config:31`, `:47`; mô tả "Giờ Việt Nam."), giá trị đọc ra không kèm múi giờ. Coi là giờ Việt Nam (UTC+7, không có giờ mùa hè) rồi đổi sang UTC để so với `DateTime.UtcNow`. Không dùng `DateTime.Now` (phụ thuộc múi giờ máy chủ). Nếu dùng `TimeZoneInfo`, id `"Asia/Ho_Chi_Minh"` chạy được cả Windows và Linux trên .NET 10; độ lệch cố định +7 cũng được.
4. Mốc: `open` khi `start ≤ now < end`; thiếu một trong hai ngày → `upcoming` ("chưa mở", QĐ-006); `start ≥ end` (nhập sai) → coi như chưa mở và ghi log cảnh báo (Claude đề xuất, không đổi contract).

**T3 (trang)**

5. `register.js` hiện lấy phần tử bằng `getElementById` và gọi `addEventListener` không kiểm tra `null` (`register.js:12-26`, `:151`, `:163`, `:168`). Nếu T3 **không render** form khi cuộc thi không mở thì script sẽ ném lỗi console. Chọn một trong hai: (a) khi `data-contest-status` khác `open`, `register.js` chỉ gắn sự kiện cho lối luyện tập rồi dừng; hoặc (b) kiểm tra `null` trước khi gắn. Khuyến nghị (a). Lối luyện tập vẫn phải chạy (AC5).
6. Khi không mở, render sẵn `#closedbox` (bỏ `hidden`) và không render `#modes`, `#rgform`, `#anonbox`. Có thể phân biệt câu "chưa mở" / "đã kết thúc" nếu muốn, nhưng phải giữ câu CXN-6 làm mặc định; nếu đổi câu thì ghi vào Giả định.
7. Nhập ngày mẫu trong backoffice cho local theo QĐ-006; file nội dung uSync sinh ra **được** commit (khác lần thử `rulesText` ở T2).

**T4 (API-01)**

8. Tắt phản hồi 400 tự động của `[ApiController]` cho action này (hoặc đặt `InvalidModelStateResponseFactory` riêng cho controller) để JSON sai cú pháp / thiếu trường vẫn trả `{error:{code:"VALIDATION",message,fields}}` thay vì ProblemDetails. Nếu không, FE nhận 400 không có `code` → `readError` trả `UNKNOWN` → hiện câu "Chưa kết nối được tới máy chủ…" (sai nghĩa).
9. Khóa trong `fields` đúng chữ thường như FE gửi: `fullName`, `phone`, `org`, `consent` (QĐ-004); giá trị là **chuỗi** tiếng Việt có dấu (khớp cách FE đọc). `mode` không phải `named`/`anon` → `VALIDATION` không có `fields`, chỉ `message`.
10. Kiểm tra lại phía máy chủ đúng như phía trình duyệt (chuẩn hóa số như `phone.js`, `trim` họ tên, độ dài 100/150, `consent === true`); không tin dữ liệu đã chuẩn hóa từ FE.
11. Đếm lượt và ghi trong cùng giao dịch. SQLite (WAL) mặc định mở giao dịch "deferred": hai yêu cầu song song cùng đọc được số lượt 1 rồi tranh nhau ghi. Dùng một khóa trong tiến trình (`SemaphoreSlim` trong dịch vụ singleton) bao quanh "đếm + ghi", hoặc giao dịch `BEGIN IMMEDIATE`; kiểm chứng bằng 10 yêu cầu song song như cột "Cách kiểm chứng" T4 (đúng 2 thành công, còn lại 409).
12. `201` trả `maxAttempts` lấy từ `IContestSettings` (cùng giá trị ở ghi chú 1). Không ghi token gốc, IP gốc vào CSDL hay log (QĐ-005; `1-thiet-ke.md` › T4).

**T5**

13. Đổi `MOCK_DEFAULT` thành `false`, và chỉ cho `?mock=` có tác dụng khi chạy local (ví dụ `location.hostname` là `localhost`/`127.0.0.1`). Lý do: sau T5, một liên kết có `?mock=ok` bị chia sẻ sẽ cho người dùng thật thấy "Đã đăng ký. Mã dự thi AD-…" và lưu `at_entry` giả, trong khi máy chủ không có lượt nào.

## Kết luận

**T2 ĐẠT.** 3 việc sửa theo review T1 đã làm đúng; hành vi 9–11, câu CXN-6, câu QĐ-007, dạng lỗi QĐ-004 và payload API-01 khớp thiết kế. Không có lỗi chặn. T3 bắt đầu được ngay.

Việc Worker phải sửa (gộp vào lượt T3, không mở lại T2):

1. `register.js:111-112`: chọn trường lỗi `VALIDATION` theo thứ tự form và chỉ nhận chuỗi (phát hiện Thấp 1).
2. `register.js` › `setBusy`: khóa `#modes` trong lúc chờ (phát hiện Thấp 2).
3. `register.js:10`: xóa hằng `MSG_CLOSED` không dùng.
4. Ghi vào Giả định của bàn giao T3: tiêu đề tạm "Chưa đăng ký được", "Đã vào cuộc thi".

Rủi ro còn lại: mock đang bật mặc định — không merge/triển khai nhánh trước T5. AC3–AC5 mới kiểm trên mock; chạy thật ở T4/T5.

## 2026-10-17 · Review T3 (trạng thái cuộc thi do máy chủ gắn vào trang) và 4 việc sửa theo review T2

## Phạm vi đã review

- Đối tượng: `git diff` (`Composers/CustomCoreComposer.cs`, `Views/thiPage.cshtml`) và các file chưa theo dõi trong `src/`: `Umbraco.Plugin.Custom.Core/Contest/ContestSettings.cs`, `Contest/ContestSettingsService.cs` (mới ở T3), `wwwroot/assets/js/contest/register.js`, `contest-api.js`, `contest.css`. `git status -- …/uSync` không có thay đổi; không có migration, document type.
- Chuẩn so sánh: `2-ban-giao.md` › mục T3; `1-thiet-ke.md` › bảng Task › T3, "Trạng thái task sau xác nhận" › T3; `3-review.md` › Review T2 › 4 việc phải sửa và "Ghi chú cho T3 và T4" (1–7); QĐ-003, QĐ-006 (và QĐ-002, QĐ-004 cho phần JS); `uSync/v18/ContentTypes/thipage.config` (`contestStart`/`contestEnd` là `Umbraco.DateTime`, dòng 29–47).
- **Không review được**: chạy thật (Orchestrator không build, không chạy web). Kết quả build, 4 trạng thái ngày, phép đổi UTC+7 và hành vi trình duyệt dựa trên báo cáo của Worker; review đối chiếu mã với báo cáo đó. `GetAsync()` chưa được ai chạy (chưa có controller).

## Đối chiếu 4 việc sửa theo review T2

| Việc | Kết quả | Bằng chứng |
|---|---|---|
| 1. `VALIDATION` chọn trường theo thứ tự form, chỉ nhận chuỗi | Đạt | `register.js:114-117`: duyệt `Object.keys(fieldEls)` (thứ tự khai báo `fullName, phone, org, consent`, `:30`); chỉ nhận `string` hoặc `string` đầu mảng; rỗng → `message`. `readError` đã chuẩn hóa `fields` về object hoặc `null` (`contest-api.js:48`), nên `k in error.fields` không ném lỗi |
| 2. Khóa `#modes` khi chờ | Đạt | `register.js:65` `modesBox.disabled = on` |
| 3. Xóa `MSG_CLOSED` | Đạt | Không còn trong `register.js`; câu nằm ở `thiPage.cshtml:123` |
| 4. Ghi tiêu đề tạm vào Giả định | Đạt | `2-ban-giao.md` › T3 › Giả định |

## Đối chiếu yêu cầu T3, QĐ-003, QĐ-006 và ghi chú T3

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| `IContestSettings` ở `Umbraco.Plugin.Custom.Core`, đăng ký ở composer (QĐ-003) | Đạt | `ContestSettingsService.cs:9-22`; `CustomCoreComposer.cs` `AddSingleton<IContestSettings, ContestSettingsService>()`. Các phụ thuộc (`IUmbracoContextFactory`, `IDocumentNavigationQueryService`, `IPublishedValueFallback`, `ILogger`) đều singleton, không có lỗi vòng đời |
| Đọc từ nút `thiPage` qua `IUmbracoContextFactory` (QĐ-003) | Đạt | `GetAsync` tìm khóa qua `IDocumentNavigationQueryService`, rồi lấy nội dung đã xuất bản qua `EnsureUmbracoContext().UmbracoContext.Content` (`:51-64`). Không đưa cài đặt vào `appsettings`, không sửa uSync |
| Ghi chú 1: `maxAttempts` `null`/`≤ 0` → 2, trang và `data-max-attempts` dùng cùng giá trị | Đạt | `ContestSettings.cs:19`; `thiPage.cshtml:12-16, 40`; view không còn `Model.Value<int?>("maxAttempts") ?? 2`. JS cũng chặn `≤ 0` (`register.js:29`) |
| Ghi chú 2: một hàm tính trạng thái, nhận `nowUtc` | Đạt | `GetStatus(settings, nowUtc)` `:78-91`; view gọi với `DateTime.UtcNow` (`thiPage.cshtml:14`) |
| Ghi chú 3: giờ Việt Nam UTC+7, không dùng `DateTime.Now` | Đạt | `:32`, `:87-88`. Lần thử 17/10 22:00 → 18/10 08:00 lúc 22:12 giờ máy ra `open` (Worker báo) phân biệt được cách hiểu UTC/giờ VN |
| Ghi chú 4 / QĐ-006: mở khi `start ≤ now < end`; thiếu ngày → chưa mở; `start ≥ end` → chưa mở + log; đóng tại `contestEnd`, không cộng `submitGraceHours` | Đạt | `:80-90`; `ReadDate` đổi `DateTime.MinValue` về `null` (`:72-76`) nên ngày trống đúng là "thiếu ngày". Không đọc `submitGraceHours` |
| `data-contest-status` trên `#cmain` | Đạt | `thiPage.cshtml:40`, giá trị `open`/`upcoming`/`closed` |
| Ghi chú 6: khác `open` thì không render `#modes`, `#anonbox`, `#rgform`; `#closedbox` hiện sẵn, câu CXN-6 | Đạt | `thiPage.cshtml:58-119`, `:121-124` |
| Ghi chú 5: `register.js` không lỗi khi thiếu form (phương án a) | Đạt | `register.js:145-173` chỉ gắn sự kiện form khi `isOpen`; lối luyện tập gắn ở mọi trạng thái (`:175-178`); `hideFlow` kiểm tra `null` (`:71-73`) |
| AC5 phía hiển thị | Đạt (theo mã + báo cáo) | Ngoài thời gian không có form, lối luyện tập còn và chạy |
| Bảo mật / quy ước | Đạt | Không `Html.Raw`, không `style=`; comment C#/JS không dấu; chữ hiển thị có dấu; không có cache đầu ra cho trang (Grep `OutputCache|ResponseCache` trong `src/ANTC.Portal.App`: không có), nên trạng thái tính lại mỗi lượt tải |
| Ngoài phạm vi | Không có | Không đụng schema, uSync, layout dùng chung |

## Phát hiện

### [Thấp] Trạng thái không mở + đã có `at_entry` + `#ngan-hang`: hiện cùng lúc `#closedbox` và `#donebox`
- Vị trí: `src/ANTC.Portal.App/Umbraco.Web.UI/wwwroot/assets/js/contest/register.js:82-89` (`showRegistered`), `:181-184`
- Bằng chứng: khi không mở, `#closedbox` được máy chủ render không có `hidden` (`thiPage.cshtml:121`). `showRegistered` chỉ gọi `hideFlow()` (ẩn `#modes`, form, `#anonbox`), không ẩn `closedBox`; trong khi `showPractice` có ẩn (`:93`).
- Tình huống xảy ra: thí sinh đã đăng ký khi cuộc thi còn mở, quay lại trang `…/cuoc-thi#ngan-hang` sau `contestEnd` → thấy "Chưa đăng ký được · Cuộc thi chưa mở hoặc đã kết thúc…" ngay trên "Đã vào cuộc thi · Đã đăng ký. Mã dự thi …". Hai thông báo mâu thuẫn.
- Hướng khắc phục: trong `showRegistered` thêm `closedBox.hidden = true;` (giống `showPractice`). Việc hiển thị lượt cũ khi cuộc thi đã đóng thế nào là của FE-28; ở FE-25 chỉ cần không hiện hai khối cùng lúc.

Không có phát hiện mức Nghiêm trọng, Cao hay Trung bình cho T3.

## Sai khác tài liệu ↔ code

- `1-thiet-ke.md` › T3 cho phép "view tính tạm, T4 chuyển sang dịch vụ"; Worker làm dịch vụ ngay ở T3 theo ghi chú 2 của review T2. Đúng hướng, không phải sai khác.
- `upcoming` và `closed` dùng chung một câu CXN-6 ở `#closedbox`. Ghi chú 6 cho phép; đã ghi Giả định.
- **Ngày mẫu không được commit**: ghi chú 7 của review T2 nói file nội dung uSync có ngày mẫu "được commit"; Worker báo đã trả về nguyên trạng "theo chỉ dẫn mới của anhnn". Chỉ dẫn này không có trong `0-giao-viec.md`, `1-thiet-ke.md` hay `quyet-dinh.md`, nên Orchestrator không xác minh được. QĐ-006 chỉ ghi "Worker nhập ngày mẫu… uSync xuất lại file nội dung", không bắt buộc commit, và để trống thì môi trường mới hiện "chưa mở" (an toàn đúng QĐ-006). Chấp nhận cách của Worker; xem "Cần xác minh".

## Cần xác minh

- anhnn xác nhận việc **không** commit ngày mẫu trong `uSync/v18/Content/cuộc-thi-trực-tuyến.config` (thay cho ghi chú 7 của review T2). Hệ quả: ai chạy local lần đầu cũng thấy "chưa mở" cho tới khi nhập ngày; T4/T5 phải nhập lại ngày trước khi thử đăng ký thật và trả file về nguyên trạng trước khi bàn giao.
- Biên `now == contestEnd` chưa chạy thử; theo mã (`nowUtc < endUtc`) là `closed`, đúng QĐ-006 "đóng tại `contestEnd`".
- `GetAsync()` chưa chạy lần nào (xem ghi chú T4 số 1, 2).

## Đề xuất (không bắt buộc)

- `GetStatus` ghi log cảnh báo ở mỗi lượt tải trang khi `start ≥ end` (Worker đã nêu). Chấp nhận ở quy mô hiện tại; nếu log ồn, chuyển cảnh báo sang lúc đọc cài đặt hoặc chỉ ghi một lần cho mỗi cặp giá trị.
- Khi không mở, `<noscript>` vẫn ghi "Cần bật JavaScript để đăng ký dự thi." (`thiPage.cshtml:41`) dù không có form. Có thể chỉ render khi `isOpen`. Việc chữ, không chặn.

## Ghi chú cho T4 (dựa trên `IContestSettings` đã có)

Áp dụng cùng các ghi chú T4 số 8–12 của review T2 (không nhắc lại), thêm:

1. **`GetAsync()` có thể lấy nhầm nút chưa xuất bản.** `IDocumentNavigationQueryService` duyệt cả bản nháp, nên `FirstOrDefault()` (`ContestSettingsService.cs:54-57`) có thể chọn một nút `thiPage` chưa xuất bản rồi `GetByIdAsync` trả `null`, dù có nút khác đã xuất bản. Hiện chỉ có một nút `thiPage` (`uSync/v18/Content/cuộc-thi-trực-tuyến.config`) nên chưa xảy ra. Khi nối T4: duyệt các khóa, lấy nút **đầu tiên có trong cache đã xuất bản** (chi phí nhỏ). Không cần xử lý nhiều trang `thiPage` hơn thế.
2. **`GetAsync()` trả `null`** (không có trang, chưa xuất bản) → API-01 trả `CONTEST_CLOSED` (403 theo sheet "API"), không trả 500. Coi như "chưa mở" để khớp QĐ-006.
3. **Cùng thời điểm cho kiểm tra cửa sổ và ghi `entry`**: trong action, lấy `var now = DateTime.UtcNow` một lần, dùng cho `GetStatus(settings, now)` và cho `CreatedAt`/`ConsentAt` (UTC). Kiểm tra trạng thái **trước** khi đếm lượt; khác `Open` (cả `Upcoming` lẫn `Closed`) → `CONTEST_CLOSED`.
4. **`maxAttempts`**: dùng `settings.MaxAttempts` (đã chuẩn hóa) cho cả việc đếm lượt trong khóa/giao dịch và trường `maxAttempts` của `201` và câu lỗi `ATTEMPT_LIMIT`. Không đọc lại thuộc tính thô.
5. Gọi `GetAsync()` **ngoài** khóa `SemaphoreSlim`/giao dịch đếm + ghi (ghi chú T2 số 11), để khóa không giữ lâu và không bao truy cập cache Umbraco.
6. `IContestSettings` là singleton; controller nhận qua constructor. Không thêm cache riêng cho cài đặt (cache nội dung Umbraco đã đủ, và ban biên tập đổi ngày thì phải có hiệu lực ngay).
7. Kiểm chứng T4 cần ngày mẫu: nhập qua backoffice/Management API như ở T3, chạy các kịch bản `Invoke-RestMethod` (trong cửa sổ, trước cửa sổ, sau cửa sổ, thiếu ngày → 403 `CONTEST_CLOSED`), rồi trả file nội dung uSync về nguyên trạng (trừ khi anhnn chốt khác ở mục "Cần xác minh") và ghi rõ vào bàn giao.

## Kết luận

**T3 ĐẠT.** `IContestSettings` đúng QĐ-003; cách tính trạng thái đúng QĐ-006 (giờ VN, thiếu ngày → chưa mở, đóng tại `contestEnd`, không dùng `submitGraceHours`); trang và API có một chỗ tính chung; ghi chú T3 số 1–6 làm đủ; 4 việc sửa theo review T2 đều đạt. Không có lỗi chặn. T4 bắt đầu được ngay.

Việc Worker phải sửa (gộp vào lượt T4, không mở lại T3):

1. `register.js` › `showRegistered`: thêm `closedBox.hidden = true;` (phát hiện Thấp).

Ghi chú cho T4: mục "Ghi chú cho T4" ngay trên (1–7), cùng ghi chú T4 số 8–12 của review T2.

Rủi ro còn lại: mock vẫn bật mặc định (`contest-api.js:11`) — không merge/triển khai trước T5. `GetAsync()` chưa chạy. Việc không commit ngày mẫu chờ anhnn xác nhận.

## 2026-10-17 · Review T4 (API-01 `POST /api/v1/contest/entries`) và việc sửa theo review T3

## Phạm vi đã review

- Đối tượng: `git diff` (`Composers/CustomCoreComposer.cs`, `appsettings.Local.template.json`; `thiPage.cshtml` không đổi so với T3) và các file chưa theo dõi: `Umbraco.Plugin.Custom.Api/Controllers/ContestController.cs` (mới), `Umbraco.Plugin.Custom.Core/Contest/ContestEntryService.cs` (mới), `Contest/ContestSettingsService.cs` (sửa `GetAsync`), `Contest/ContestSettings.cs`, `wwwroot/assets/js/contest/register.js` (`showRegistered`). Đọc thêm để đối chiếu: `Data/Entities.cs`, `Data/AppDbContext.cs:31-45`, `QuizController.cs`, `Umbraco.Web.UI/Program.cs`, `contest-api.js:45-70`.
- Chuẩn so sánh: `2-ban-giao.md` › mục T4; `1-thiet-ke.md` › bảng Task › T4, "Trạng thái task sau xác nhận" › T4; QĐ-002 → QĐ-006; `…v3.xlsx` › sheet "API" › r2 (dạng lỗi), r5 (API-01), r17–r28 (bảng mã lỗi); sheet "Công việc" › BE-22 (r51), BE-26 (r54); sheet "CSDL" › `entry` (r5–r20); `3-review.md` › ghi chú T4 số 8–12 (review T2) và 1–7 (review T3).
- **Không review được**: chạy thật (Orchestrator không build, không chạy web). Kết quả build, gọi `curl`, thử song song, đọc CSDL và tìm token trong log dựa trên báo cáo của Worker; review đối chiếu mã với báo cáo đó. Không xem được nội dung cảnh báo `AV0014`.

## Đối chiếu việc sửa theo review T3

| Việc | Kết quả | Bằng chứng |
|---|---|---|
| `showRegistered` ẩn `#closedbox` | Đạt (theo mã) | `register.js:84`; `#closedbox` luôn được render (`thiPage.cshtml`), nên `closedBox` không `null`. Chưa thử trên trình duyệt (Worker đã nêu) |

## Đối chiếu yêu cầu T4

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Đường dẫn, phương thức, mã API trong `<summary>` | Đạt | `ContestController.cs:12`, `:19-22` |
| `201` đủ `code, token, mode, attemptNo, maxAttempts, status` | Đạt | `ContestEntryService.cs:15`, `:127`; `status` = `in_progress` (`Entities.cs:44`). Lượt ẩn danh trả `attemptNo` 1 — xem "Sai khác" |
| Lỗi `{error:{code,message,fields}}` (QĐ-004), 400/403/409 đúng bảng mã lỗi | Đạt | `ContestController.cs:41-51`; `fields` luôn là object (rỗng khi không có) — FE đọc được (`contest-api.js:45-50`) |
| Ghi chú T2 số 8: JSON sai cú pháp / sai kiểu vẫn ra `VALIDATION` đúng dạng | Đạt | Bỏ `[ApiController]`, tự kiểm `ModelState` (`ContestController.cs:27-30`). Xem mục "Bỏ `[ApiController]`" bên dưới |
| Ghi chú T2 số 9: khóa `fields` chữ thường, giá trị chuỗi; `mode` sai → chỉ `message` | Đạt | `ContestEntryService.cs:65-68`, `:136-173` |
| Ghi chú T2 số 10 / BE-22: kiểm tra lại phía máy chủ | Đạt | `trim` họ tên 2–100 (`:141-149`); chuẩn hóa số khớp `phone.js` và BE-22 (`:176-180`, `char.IsAsciiDigit` ≈ `\D` của JS); đơn vị ≤ 150, trống → `null` (`:157-165`); `consent == true` (`:167`). Chế độ `anon` không lưu thông tin cá nhân (`:70-78`, các biến giữ `null`) |
| Ghi chú T2 số 11 / BE-22: đếm + ghi trong cùng giao dịch, 10 yêu cầu song song → đúng 2 thành công | Đạt | Khóa `SemaphoreSlim` tĩnh bao trọn "mở giao dịch → đếm → sinh mã → ghi → commit" (`:90-132`); trả `ATTEMPT_LIMIT` trong khóa thì giao dịch bị hủy khi `dispose`. Đếm mọi trạng thái (`:98`), `attemptNo = used + 1` (`:105`). Worker thử 10 và 30 yêu cầu: đúng 2 × 201 |
| Ghi chú T2 số 12 / QĐ-005: không ghi token gốc, IP gốc | Đạt | Chỉ lưu `HashToken(token)` (`:111`) và `HashIp` (`:120`, `:198-208`); không có lệnh ghi log nào trong dịch vụ/controller; `AddDbContext` không bật `EnableSensitiveDataLogging` (`CustomCoreComposer.cs:25-37`). Worker tìm 6 token trong CSDL và `umbraco/Logs`: không có |
| Mã `AD-` + 6 ký tự, bảng chữ BE-22, bộ sinh mật mã, sinh lại khi trùng | Đạt | `:40-41`, `:183-192` (`RandomNumberGenerator.GetString`, phân bố đều) |
| Token 32 byte base64url (43 ký tự), chỉ lưu SHA-256 | Đạt | `:87`, `:195-196` |
| Ghi chú T3 số 1, 2: `GetAsync` lấy nút đầu tiên đã xuất bản; không có → `CONTEST_CLOSED` | Đạt | `ContestSettingsService.cs:51-68`; `ContestEntryService.cs:81-85` |
| Ghi chú T3 số 3: một `now` cho kiểm tra cửa sổ và `CreatedAt`/`ConsentAt`; kiểm trạng thái trước khi đếm | Đạt | `:62`, `:82`, `:116`, `:119` |
| Ghi chú T3 số 4: `settings.MaxAttempts` cho đếm, câu lỗi, `201` | Đạt | `:99-102`, `:127` |
| Ghi chú T3 số 5: `GetAsync()` ngoài khóa | Đạt | `:81` trước `:90` |
| Ghi chú T3 số 6: `IContestSettings` singleton, không cache riêng; dịch vụ tạo lượt scoped (dùng `AppDbContext`) | Đạt | `CustomCoreComposer.cs` (`AddSingleton` / `AddScoped`); không có phụ thuộc vòng đời sai |
| Ghi chú T3 số 7: ngày mẫu, trả uSync về nguyên trạng | Đạt | `git status` không có thay đổi trong `uSync`; Worker ghi rõ ở "Ngày mẫu và uSync" |
| `Cache-Control: no-store` | Đạt | `ContestController.cs:25` (đặt trước mọi nhánh, nên có cả ở phản hồi lỗi) |
| QĐ-005: khóa `Contest:IpHashSalt` trong template, không có trong `appsettings.json` | Đạt | Diff `appsettings.Local.template.json`; `appsettings.Local.json` có `CopyToPublishDirectory="Never"` (`Umbraco.Web.UI.csproj:41`) nên muối mẫu không đi theo bản triển khai |
| Không làm giới hạn tần suất (QĐ-002); không đổi schema | Đạt | Không có migration, không đổi `Entities.cs` / `AppDbContext.cs` |
| Quy ước: comment không dấu, chữ hiển thị có dấu, đăng ký DI ở composer, 3 tầng | Đạt | Dịch vụ ở `Custom.Core`, controller ở `Custom.Api` |

### Đếm lượt đồng thời

- Trong một tiến trình: đúng. Mọi đường ghi `entry` hiện có đều đi qua `CreateAsync`, và khóa bao cả đọc lẫn ghi lẫn commit.
- Ngoài một tiến trình (nhiều instance, hoặc IIS chạy chồng hai tiến trình lúc recycle): khóa tĩnh không có tác dụng. Lớp bảo vệ còn lại là giao dịch SQLite — xem "Cần xác minh" (có thể đã là `BEGIN IMMEDIATE`). Worker đã nêu rủi ro và không tự đổi schema: đúng quy trình.
- **Ràng buộc cho việc sau**: API gắn thông tin vào lượt ẩn danh (FE-29 / BE-2x) cũng ghi `Phone`, `AttemptNo` và phải đếm lượt; nó phải dùng **cùng một khóa** (hiện là `private static` trong `ContestEntryService`), nếu không hai đường ghi có thể cùng vượt giới hạn.

### Thiếu `Contest:IpHashSalt`

- Mã: `HashIp` ném `InvalidOperationException` (`ContestEntryService.cs:198-205`), gọi sau kiểm tra dữ liệu và cửa sổ (`:88`), trước khóa ghi → không ghi gì vào CSDL, yêu cầu trả 500. Không lưu băm không muối: đúng tinh thần QĐ-005.
- Hệ quả: phản hồi 500 là trang lỗi của host, không phải `{error:…}`; FE đọc thành `SERVER` → câu "Chưa kết nối được tới máy chủ…" (`contest-api.js:50`). Chấp nhận được (BE-26 chỉ đòi dạng chuẩn cho 4xx). Nhưng **khi triển khai quên đặt khóa, toàn bộ đăng ký có tên lẫn ẩn danh hỏng âm thầm** cho tới khi có người thử, và chỉ có log ngoại lệ ở từng yêu cầu. Chưa chạy thử (Worker đã nêu).
- Cột `ip_hash` cho phép rỗng (sheet "CSDL" r20), nên phương án "thiếu muối thì lưu `null`, vẫn cho đăng ký" cũng hợp schema. Đây là lựa chọn giữa an toàn cấu hình và tính sẵn sàng → xem "Cần người dùng xác nhận".

### Bỏ `[ApiController]`

- Lý do Worker nêu đúng: với `[ApiController]`, JSON sai cú pháp/kiểu bị trả ProblemDetails trước khi vào action (ghi chú T2 số 8). Cách đã làm (tự kiểm `ModelState`, comment giải thích ở `ContestController.cs:7-11`) là phương án đơn giản nhất chỉ ảnh hưởng một controller; không đổi cấu hình toàn cục.
- Những gì mất đi khi bỏ thuộc tính này, đã kiểm: suy luận nguồn bind (action đã ghi `[FromBody]`), bắt buộc định tuyến thuộc tính (đã có `[Route]`), 400 tự động (đã tự làm). Không có tác dụng phụ về bảo mật: không thấy bộ lọc antiforgery toàn cục; POST JSON từ trang khác bị trình duyệt chặn bằng preflight, còn `text/plain` bị `UnsupportedContentTypeFilter` trả 415.
- Chưa rõ: cảnh báo `AV0014` (bộ phân tích API versioning) nói gì cụ thể. Xem "Cần xác minh".
- Lệch quy ước với `QuizController.cs:11` (có `[ApiController]`). BE-26 khi làm chuẩn lỗi chung nên chọn một cách cho mọi controller (ví dụ `InvalidModelStateResponseFactory` toàn cục trả `{error:…}`) rồi đưa `ContestController` về cùng cách. Không làm trong FE-25.

## Phát hiện

### [Thấp] Còn 3 kịch bản chưa chạy thử
- Vị trí: `2-ban-giao.md` › T4 › "Còn tồn tại / rủi ro" và "Kiểm chứng".
- Bằng chứng: chưa thử (a) thiếu `Contest:IpHashSalt`; (b) "trước cửa sổ" có đủ ngày qua API (cột "Cách kiểm chứng" T4 và ghi chú T3 số 7 có liệt kê); (c) `showRegistered` khi trang đóng + có `at_entry` + `#ngan-hang`.
- Tình huống xảy ra: (a) là đường lỗi cấu hình dễ gặp nhất khi triển khai; (b), (c) dùng hàm đã được thử ở chỗ khác nên rủi ro thấp.
- Hướng khắc phục: chạy cùng lượt T5 (xem "Yêu cầu chạy thử").

### [Thấp] Cảnh báo build mới `AV0014` chưa được giải thích hay khoanh vùng
- Vị trí: `ContestController.cs:12-13`; `2-ban-giao.md` › T4 › Kiểm chứng.
- Bằng chứng: Worker báo build thêm cảnh báo `AV0014`, không ghi nội dung.
- Tình huống xảy ra: cảnh báo mới lẫn với cảnh báo cũ (ImageSharp); người sau không biết là cố ý hay lỗi.
- Hướng khắc phục: ghi nguyên văn cảnh báo vào bàn giao T5; nếu chỉ là "controller không có `[ApiController]` nên không áp versioning" thì chặn đúng chỗ bằng `#pragma warning disable AV0014` kèm comment không dấu giải thích lý do, không chặn toàn project.

Không có phát hiện mức Nghiêm trọng, Cao hay Trung bình cho T4.

## Sai khác tài liệu ↔ code

- **`attemptNo` của lượt ẩn danh**: API-01 trả `1` (`ContestEntryService.cs:126-127`) trong khi `entry.attempt_no` để rỗng ("rỗng khi ẩn danh", sheet "CSDL" r13) và API-02 (BE-23) sau này sẽ đọc từ CSDL → cùng một lượt có thể trả `1` ở API-01 và `null` ở API-02. Sheet "API" r5 chỉ có ví dụ cho chế độ có tên. FE hiện không dùng `attemptNo` khi `mode = anon` (`register.js:85-87`), nên chưa ảnh hưởng. Là chi tiết contract → xem "Cần người dùng xác nhận".
- Kiểm tra dữ liệu chạy trước kiểm tra cửa sổ: gửi dữ liệu sai khi cuộc thi đóng nhận `VALIDATION` thay vì `CONTEST_CLOSED`. Tài liệu không quy định thứ tự; trang không render form khi đóng nên người dùng thật không gặp. Chấp nhận.
- Họ tên 1 ký tự: máy chủ trả `fields.fullName` "Họ tên cần từ 2 đến 100 ký tự." (BE-22), phía trình duyệt chưa chặn. FE đã hiện câu của `fields` và focus `rgname` (review T3), nên luồng vẫn đúng; thêm kiểm tra ở FE là tùy chọn.
- `IpHash` từ `Connection.RemoteIpAddress`: sau reverse proxy mọi lượt có cùng `ip_hash`. BE-26 đã giao việc đọc IP thật qua `X-Forwarded-For` (sheet "Công việc" r54). Đúng phạm vi.

## Cần xác minh

- **Giao dịch SQLite có phải `BEGIN IMMEDIATE` không**: theo hiểu biết của Orchestrator (chưa kiểm trên mã nguồn), `Microsoft.Data.Sqlite` mở giao dịch không `deferred` theo mặc định, tức `BEGIN IMMEDIATE`, kèm thời gian chờ khóa mặc định. Nếu đúng thì ghi chú T2 số 11 ("mặc định deferred") viết sai, và giao dịch hiện tại đã tuần tự hóa cả giữa hai tiến trình dùng chung file → rủi ro nhiều tiến trình nhỏ hơn Worker nêu. Worker xác minh khi tiện (ví dụ bật log `Microsoft.EntityFrameworkCore.Database.Command` hoặc đọc mã `SqliteTransaction`) và ghi vào bàn giao T5. Không chặn T4.
- Nội dung cảnh báo `AV0014` (phát hiện Thấp 2).
- (Từ review T3, vẫn mở) anhnn xác nhận việc không commit ngày mẫu.

## Đề xuất (không bắt buộc)

- Ghi một dòng log cảnh báo lúc khởi động khi thiếu `Contest:IpHashSalt` (không chặn khởi động, vì sẽ kéo sập cả website), để lỗi cấu hình lộ ra ngay khi triển khai thay vì ở yêu cầu đăng ký đầu tiên. Phụ thuộc lựa chọn ở "Cần người dùng xác nhận" mục 2.
- `ContestError` → HTTP: mã lạ rơi về 500 (`ContestController.cs:48`). Có thể đổi `Code` sang hằng hoặc enum khi BE-22/BE-26 thêm mã; chưa cần ở quy mô hiện tại.
- Giới hạn kích thước thân yêu cầu (16 KB) để BE-26 làm chung cho mọi API, không làm riêng ở đây.

## Yêu cầu chạy thử cho Worker (gộp vào lượt T5)

1. Xóa tạm `Contest:IpHashSalt` khỏi `appsettings.Local.json`, chạy lại web, gửi một yêu cầu hợp lệ (cuộc thi đang mở): kỳ vọng 500, không thêm dòng `entry`, log có "Thieu cau hinh Contest:IpHashSalt"; trên trình duyệt (mock tắt) hiện câu "Chưa kết nối được tới máy chủ…", nút mở lại. Trả lại khóa sau khi thử.
2. Ngày mẫu ở tương lai (ví dụ 2027-01-01 → 2027-02-01): API trả 403 `CONTEST_CLOSED`.
3. Trạng thái đóng + có `at_entry` + mở `…/cuoc-thi#ngan-hang`: chỉ hiện `#donebox`, không hiện `#closedbox`.
4. Ghi nguyên văn cảnh báo `AV0014`.

## Kết luận

**T4 ĐẠT.** API-01 đúng contract sheet "API" r5 và bảng mã lỗi; đủ các điểm của BE-22 trừ giới hạn tần suất (để BE-26 theo QĐ-002); đúng QĐ-003 → QĐ-006; ghi chú T4 số 8–12 (review T2) và 1–7 (review T3) đều làm. Đếm lượt đồng thời đúng trong một tiến trình. Việc sửa theo review T3 đã làm (chưa thử trên trình duyệt). Không có lỗi chặn. T5 bắt đầu được ngay.

Việc Worker phải sửa (gộp vào lượt T5, không mở lại T4):

1. Chạy 4 kịch bản ở "Yêu cầu chạy thử cho Worker" và ghi kết quả vào bàn giao T5.
2. Khoanh vùng cảnh báo `AV0014` bằng `#pragma` có comment lý do, nếu nội dung cảnh báo đúng như dự đoán (phát hiện Thấp 2).
3. Nếu anhnn chốt khác ở "Cần người dùng xác nhận" mục 2 hoặc 3: sửa `HashIp` / `attemptNo` theo quyết định.

### Ghi chú cho T5

1. Ghi chú T5 số 13 của review T2 vẫn áp dụng: `MOCK_DEFAULT = false`, và `?mock=` chỉ có tác dụng khi `location.hostname` là `localhost`/`127.0.0.1`.
2. Luồng đầu–cuối trên trình duyệt với API thật: có tên (lượt 1, 2), lượt thứ 3 (câu `ATTEMPT_LIMIT` đúng số đã chuẩn hóa và `maxAttempts`), ẩn danh, ngoài thời gian (trang không có form; nếu gửi thẳng API thì 403). Xem dòng mới trong `App_Data/app.sqlite.db`: không có token gốc, lượt ẩn danh không có họ tên/số.
3. Kiểm `at_entry` sau khi thành công có `token` thật (43 ký tự) và `maxAttempts` khớp `data-max-attempts`.
4. Dùng số điện thoại chưa có trong CSDL local (Worker đã liệt kê 4 số đã hết lượt) hoặc `run-local -Reset`.
5. Nhập ngày mẫu rồi trả file nội dung uSync về nguyên trạng như T3/T4, trừ khi anhnn chốt khác.
6. Không đổi `ContestEntryService` ngoài các việc ở trên.

### Cần người dùng xác nhận

1. **(Còn treo từ review T3)** Không commit ngày mẫu trong `uSync/v18/Content/cuộc-thi-trực-tuyến.config`. Khuyến nghị: đồng ý (để trống an toàn đúng QĐ-006).
2. **Thiếu `Contest:IpHashSalt` khi chạy thật** (bảo mật / vận hành):
   - (a) *Hiện tại*: chặn đăng ký, trả 500. An toàn về dữ liệu; nếu quên cấu hình thì toàn bộ đăng ký hỏng.
   - (b) Lưu `ip_hash` rỗng (cột cho phép), ghi log cảnh báo, vẫn cho đăng ký. Không mất lượt thi của người dùng; mất dữ liệu IP băm cho các lượt đó.
   - **Khuyến nghị (a)** cộng log cảnh báo lúc khởi động (mục Đề xuất), và đưa khóa này vào danh sách kiểm tra trước khi triển khai (QĐ-005 › Ảnh hưởng). Nếu chốt, Orchestrator ghi QĐ mới.
3. **`attemptNo` của lượt ẩn danh trong `201`** (API contract): (a) *hiện tại* `1`; (b) `null`, khớp `entry.attempt_no` và API-02 sau này. **Khuyến nghị (b)**: một lượt chỉ có một giá trị ở mọi API; FE hiện không dùng giá trị này cho ẩn danh nên đổi không ảnh hưởng giao diện (cần sửa thêm mock `contest-api.js:35`). Không chặn T5.
4. **Rủi ro cần biết trước khi chạy thật** (không phải lỗi của T4, thuộc thiết kế BE-22/BE-26): API-01 chưa có giới hạn tần suất, và lượt được tính theo số điện thoại không xác minh — ai biết số của người khác có thể gọi API hai lần để làm hết lượt của người đó. Khuyến nghị: không mở API-01 trên môi trường thật trước khi có BE-26; còn việc có cần xác minh số (OTP) hay không là câu hỏi nghiệp vụ cho chủ quản, ngoài FE-25.

Rủi ro còn lại: mock vẫn bật mặc định (`contest-api.js:11`) — không merge/triển khai trước T5. Khóa đếm lượt chỉ có tác dụng trong một tiến trình (xem "Cần xác minh").

**Đã chốt (anhnn, 2026-10-17):** mục 1 → QĐ-008 (commit ngày mẫu 2026-10-01 00:00 → 2026-12-31 23:59; thay ghi chú T5 số 5); mục 2 → QĐ-009 (phương án b + log cảnh báo lúc khởi động; thay QĐ-005); mục 3 → QĐ-010 (`null`); mục 4 → QĐ-012; chạy song song theo luồng → QĐ-011.

## 2026-10-17 · Review T5 và nghiệm thu FE-25

## Phạm vi đã review

- Đối tượng: `git diff` so với `HEAD` (`Composers/CustomCoreComposer.cs`, `Views/thiPage.cshtml`, `appsettings.Local.template.json`, `uSync/v18/Content/cuộc-thi-trực-tuyến.config`) và mọi file chưa theo dõi trong `src/`: `Umbraco.Plugin.Custom.Api/Controllers/ContestController.cs`, `Umbraco.Plugin.Custom.Core/Contest/` (`ContestSettings.cs`, `ContestSettingsService.cs`, `ContestEntryService.cs`, `ContestConfigCheck.cs` mới ở T5), `wwwroot/assets/css/contest.css`, `wwwroot/assets/js/contest/` (`contest-api.js`, `register.js`, `phone.js`). Đọc lại toàn bộ các file này, không chỉ phần đổi ở T5.
- Chuẩn so sánh: `2-ban-giao.md` › mục T5; `3-review.md` › Review T4 › "Kết luận", "Yêu cầu chạy thử", "Ghi chú cho T5", "Cần người dùng xác nhận" và dòng "Đã chốt"; `1-thiet-ke.md` (hành vi 1–12, AC1–AC5, Task T1–T5, "Trạng thái task sau xác nhận"); `docs/quyet-dinh.md` QĐ-002 → QĐ-012 (QĐ-005 đã thay bằng QĐ-009); `Data/Entities.cs` (hằng `EntryModes`, `EntryStatuses`).
- **Không review được**: chạy thật (Orchestrator không build, không chạy web). Kết quả build, 8 kịch bản trên Edge headless, đọc CSDL và log dựa trên báo cáo T5 của Worker; review đối chiếu mã với báo cáo đó. Không đọc được mã/DLL `Microsoft.Data.Sqlite` (thư mục `~/.nuget/packages` không được cấp quyền đọc), nên mục `BEGIN IMMEDIATE` vẫn chưa xác minh.

## Đối chiếu việc sửa theo review T4 và các QĐ mới

| Việc | Kết quả | Bằng chứng |
|---|---|---|
| Ghi chú T5 số 1 / ghi chú T2 số 13: `MOCK_DEFAULT = false`, `?mock=` chỉ ở `localhost`/`127.0.0.1` | Đạt | `contest-api.js:11-24`; host khác trả `null` trước khi đọc tham số. Worker thử `[::1]` → API thật (kịch bản 5) |
| QĐ-010: lượt ẩn danh `attemptNo: null` ở `201` và mock | Đạt | `ContestEntryService.cs:15` (`int? AttemptNo`), `:95-106`, `:127`; mock `contest-api.js:40`. `register.js:85-87` không in "lượt x/y" khi không có giá trị |
| QĐ-009: thiếu `Contest:IpHashSalt` → vẫn đăng ký, `ip_hash` null, không băm không muối | Đạt | `ContestEntryService.cs:198-208`; gọi ở `:88`, không còn đường ném lỗi. Kịch bản 7: hai dòng mới `ip_hash` null |
| QĐ-009: log cảnh báo lúc khởi động, không chặn khởi động | Đạt | `ContestConfigCheck.cs:22-32` (`IHostedService`, chỉ `LogWarning`, trả `CompletedTask`); đăng ký `CustomCoreComposer.cs` (`AddHostedService<ContestConfigCheck>()`). Cùng điều kiện `IsNullOrEmpty` với `HashIp` nên log và hành vi khớp nhau. Log không in giá trị muối |
| QĐ-008: commit ngày mẫu 2026-10-01 00:00 → 2026-12-31 23:59 | Đạt | Diff file uSync chỉ đổi hai giá trị `contestStart`/`contestEnd` (`:16-21`); không có thay đổi uSync nào khác. Giá trị không kèm múi giờ → hiểu là giờ VN (QĐ-006, `ContestSettingsService.cs:91-92`) |
| Yêu cầu chạy thử 1: thiếu muối | Đạt (theo báo cáo, kịch bản đã đổi theo QĐ-009) | Kịch bản 7 |
| Yêu cầu chạy thử 2: ngày ở tương lai → 403 `CONTEST_CLOSED` | Đạt (theo báo cáo) | Kịch bản 6 (2027-01-01 → 2027-02-01: `upcoming`, 403 dạng `{error:{…,fields:{}}}`) |
| Yêu cầu chạy thử 3: đóng + `at_entry` + `#ngan-hang` → chỉ `#donebox` | Đạt (theo báo cáo) | Kịch bản 6; mã `register.js:82-90`, `:182-185` |
| Yêu cầu chạy thử 4 / phát hiện Thấp 2 T4: `AV0014` | Đạt | Nguyên văn ở `2-ban-giao.md` › T5; `#pragma warning disable/restore AV0014` chỉ bao khai báo class (`ContestController.cs:12-17`), comment không dấu nêu lý do. Không chặn toàn project |
| Ghi chú T5 số 2–4: luồng đầu–cuối thật, `at_entry` có token 43 ký tự, số chưa dùng | Đạt (theo báo cáo) | Kịch bản 1–4, 8 |
| Ghi chú T5 số 6: không đổi `ContestEntryService` ngoài việc được giao | Đạt | Chỉ đổi `CreatedEntry.AttemptNo`, nhánh `attemptNo`, `HashIp`; thêm hằng `IpHashSaltKey` public để `ContestConfigCheck` dùng chung (hợp lý) |
| Không đổi schema, không migration; QĐ-002/QĐ-012: không làm giới hạn tần suất | Đạt | Không có thay đổi `Data/` ngoài đọc |
| Bảo mật: không `Html.Raw`, không `innerHTML`; token gốc, IP gốc không vào CSDL/log | Đạt | `thiPage.cshtml` mã hóa mặc định; `register.js` dùng `textContent`; `ContestEntryService.cs:111`, `:120`. Không có bí mật thật trong diff (muối trong template là giá trị mẫu, `appsettings.Local.json` và `App_Data/` bị `.gitignore` dòng 12–13 bỏ qua) |

## Phát hiện

### [Thấp] Comment còn dẫn QĐ-005 đã bị thay
- Vị trí: `src/ANTC.Portal.App/Umbraco.Plugin.Custom.Core/Contest/ContestEntryService.cs:203`
- Bằng chứng: `// Thieu muoi: van cho dang ky, luu ip_hash null, khong luu bam khong muoi (QD-005)`. Hành vi này là của QĐ-009; QĐ-005 có trạng thái "Thay bằng QĐ-009" và không cho phép đăng ký khi thiếu muối như cách hiểu ở T4. Worker ghi rõ lúc làm chưa thấy số QĐ.
- Tình huống xảy ra: người sau đọc QĐ-005, không thấy quy định "vẫn cho đăng ký", tưởng code sai.
- Hướng khắc phục: đổi `(QD-005)` thành `(QD-009)`. Một ký tự, làm trước khi commit; không cần chạy lại.

Không có phát hiện mức Nghiêm trọng, Cao hay Trung bình cho T5.

## Sai khác tài liệu ↔ code

- Không có sai khác mới. Hai thay đổi hành vi so với T4 (thiếu muối vẫn đăng ký; `attemptNo` ẩn danh null) đúng QĐ-009, QĐ-010.
- Ngày mẫu trong uSync làm cuộc thi **đang mở** hôm nay (17/10/2026) ở mọi môi trường nhập nội dung từ CSDL trống: đúng QĐ-008, người dùng đã chấp nhận rủi ro; xem điều kiện triển khai.

## Cần xác minh

- (Từ review T4, vẫn mở) Giao dịch `BeginTransactionAsync` trên SQLite có phải `BEGIN IMMEDIATE` không. Không chặn merge; ảnh hưởng mức an toàn khi có hơn một tiến trình (xem điều kiện triển khai số 5).
- Biên `now == contestEnd` và `maxAttempts ≤ 0` qua trang chưa chạy thử; theo mã đúng (`ContestSettingsService.cs:94`, `ContestSettings.cs:19`).
- `main` có tự triển khai (CI/CD) khi merge không. Nếu có, merge FE-25 sẽ mở API-01 trái QĐ-012 → xem Kết luận.

## Đề xuất (không bắt buộc)

- Chia commit: (1) `feat:` mã FE-25 + file uSync nội dung; (2) `docs:` `docs/ban-giao/FE-25/`, `docs/quyet-dinh.md`; (3) `chore:`/`docs:` quy trình hai agent (`CLAUDE.md`, `.claude/skills/*`). Ba nhóm này hiện cùng chưa theo dõi; tách ra để lịch sử `feat` chỉ chứa mã.
- Các đề xuất còn để ngỏ từ T3 (`<noscript>` khi không mở; log `start ≥ end` mỗi lượt tải) — vẫn không bắt buộc.

## Kết luận review T5

**T5 ĐẠT.** Mock tắt mặc định và khóa theo host; QĐ-008, QĐ-009, QĐ-010 làm đúng và đủ; 4 kịch bản chạy thử của review T4 đã chạy; `AV0014` khoanh đúng chỗ. Một phát hiện Thấp (comment QĐ), sửa trước khi commit.

## Nghiệm thu toàn bộ FE-25

Chuẩn: `1-thiet-ke.md` › "Tiêu chí nghiệm thu" (sheet "Công việc" › FE-25). Kết quả chạy là của Worker (Orchestrator không chạy web); đối chiếu với mã ở cột Bằng chứng.

| AC | Kết quả | Bằng chứng | Phần chưa có / phụ thuộc |
|---|---|---|---|
| **AC1** Giống ảnh tham chiếu trừ câu chữ đã sửa | **Đạt trong phạm vi FE-25** (dựa trên báo cáo) | Review T1 (hành vi 1–8, 12; câu (a)–(d)), review T2 (Worker so `th-01`, `th-02`, `th-03` ở 1440px, `th-10`/`mb-06` ở 390px, đo 900px); câu QĐ-007 `thiPage.cshtml` (hộp ẩn danh, hộp hồng). T3–T5 không đổi giao diện ngoài khối trạng thái | Hero nền ảnh → FE-08 (đang dùng hero tạm). Cột bên đầy đủ (thẻ Thí sinh có mã, Tiến độ 8 chuyên đề) → FE-26. Chưa so `th-10` ở 1440px. Orchestrator chưa tự xem giao diện |
| **AC2** Ba lỗi kiểm tra đúng câu, đúng thứ tự | **Đạt** | `register.js:5-7`, `:54-61` (họ tên → số → đồng ý), focus ô sai `:47-50`; `phone.js:4-13`. Máy chủ kiểm lại cùng câu (`ContestEntryService.cs:136-173`). Worker thử trên trình duyệt (T1/T2, so `th-02`) | — |
| **AC3** Có tên và ẩn danh đều tạo được lượt thi và vào danh sách chuyên đề | **Đạt một phần**: tạo lượt thật đạt; "vào danh sách chuyên đề" **chưa đạt** (ngoài FE-25) | API thật: `ContestEntryService.cs:60-133`; T5 kịch bản 1, 3, 4 (dòng `entry` mới, token chỉ lưu băm, lượt ẩn danh không có dữ liệu cá nhân); `at_entry` lưu `contest-api.js:79-83`; chuyển `#ngan-hang` `register.js:136-140` | Màn danh sách chuyên đề → FE-26; hiện chỉ là khối chờ tạm `#donebox` ("Đã vào cuộc thi"). Đúng phạm vi đã chốt ở `1-thiet-ke.md` › "Không thuộc FE-25" và bảng Phương án (B: "AC3 thật tới bước tạo lượt") |
| **AC4** Lượt thứ ba cùng số bị từ chối đúng thông báo | **Đạt** | Đếm + ghi trong khóa và giao dịch `ContestEntryService.cs:90-132`; 409 `ATTEMPT_LIMIT` `ContestController.cs:51`; câu FE `register.js:102-105` dùng số đã chuẩn hóa và `maxAttempts`. T4: 3 cách viết cùng số → lượt 3 bị 409; 10 và 30 yêu cầu song song → đúng 2 × 201. T5 kịch bản 2 trên trình duyệt | Chỉ an toàn trong một tiến trình (điều kiện triển khai số 5) |
| **AC5** Ngoài thời gian: không đăng ký được, vẫn vào luyện tập được | **Đạt trong phạm vi FE-25** | Trang: `thiPage.cshtml` chỉ render form khi `isOpen`, `#closedbox` hiện sẵn; API: `ContestEntryService.cs:81-85` → 403; cùng hàm `GetStatus` (QĐ-006). Lối luyện tập gắn ở mọi trạng thái `register.js:176-179`, ghi `at_practice`, không gọi API. T5 kịch bản 6 (`upcoming`, `closed`) | Đích "luyện tập" hiện là khối chờ tạm ("Ngân hàng câu hỏi sẽ mở ở đây.") → FE-26/FE-28 |

Tổng hợp: AC2, AC4 đạt đủ. AC1, AC5 đạt phần thuộc FE-25. AC3 đạt phần tạo lượt; bước "vào danh sách chuyên đề" thuộc FE-26, đúng phạm vi đã thống nhất (QĐ-002). **FE-25 nghiệm thu ĐẠT theo phạm vi đã chốt.**

### Việc còn treo

**Cần chốt (nghiệp vụ, chủ quản)**

- **CXN-4** / Câu hỏi mở #5: câu "Ai được dự thi: Mọi lứa tuổi…" và người dưới 16 tuổi. Đang giữ câu bản dựng (chữ cứng trong `thiPage.cshtml`). Nếu chốt "cách hai" (tự khai tuổi) thì phát sinh việc FE + BE theo sheet.
- **Xác minh số điện thoại (OTP)** (QĐ-012): chưa hỏi chủ quản. QĐ-012 yêu cầu ghi câu này vào danh sách câu hỏi mở; chưa có nơi ghi chính thức ngoài QĐ-012 — điều phối/anhnn đưa vào bản câu hỏi gửi chủ quản.

**Cần xác minh (kỹ thuật)**

- Giao dịch SQLite `BEGIN IMMEDIATE` (từ review T4).
- Biên `now == contestEnd`; `maxAttempts ≤ 0` qua trang.
- `main` có tự triển khai không.

**Nội dung cần nhập trước khi chạy thật** (hiện `[…]` hoặc trống trong uSync): `periodText`, `rulesText`, `rulesLink`, `dataRetentionDays` (đang làm câu "Xóa hết trong […] ngày" hiện trên trang); kiểm `operatorName`, `dataContact` ở trang chủ.

**Chuyển cho việc sau**

| Việc | Nội dung chuyển từ FE-25 |
|---|---|
| FE-08 | Thay hero tạm `.page-hero--contest` bằng `_PageHero` dùng chung |
| FE-26 | Thay khối `#donebox` (sau đăng ký và lối luyện tập) bằng màn Danh sách chuyên đề; cột bên: thẻ Thí sinh có mã, thẻ Tiến độ 8 chuyên đề. Hoàn tất phần còn lại của AC3, AC5 |
| FE-28 | Mở rộng `contest-api.js` (không viết lại): lấy lại lượt khi đã có `at_entry`, xử lý `at_practice` khi mở lại `#ngan-hang`, hàng đợi gửi lại, cách hiển thị lượt cũ khi cuộc thi đã đóng; không ghi đè `at_entry` khi chưa đăng ký mới |
| FE-29 | Dùng lại `phone.js`; API gắn thông tin vào lượt ẩn danh phải dùng **chung khóa `WriteLock`** với `ContestEntryService` (hoặc chuyển khóa ra chỗ dùng chung) và tính lại `attemptNo` |
| BE-22 | Tiếp tục trên `ContestController` / `ContestEntryService` (QĐ-002). Nếu cần chạy nhiều tiến trình: ràng buộc CSDL (ví dụ chỉ mục duy nhất `(phone, attempt_no)`) — đổi schema, phải hỏi trước |
| BE-23 | API-02 trả `attemptNo` null cho lượt ẩn danh (QĐ-010); xác thực `X-Entry-Token` bằng `ContestEntryService.HashToken` |
| BE-26 | Giới hạn tần suất 10 lần/giờ/IP cho API-01 (`RATE_LIMITED` + `Retry-After`; FE đã có câu CXN-6) — lưu ý `ip_hash` null khi thiếu muối (QĐ-009), nên đếm theo IP trong bộ nhớ hoặc yêu cầu có muối; đọc IP thật qua `X-Forwarded-For`/`ForwardedHeaders`; chuẩn lỗi chung (`InvalidModelStateResponseFactory` trả `{error:…}`), sửa `QuizController` (QĐ-004), rồi đưa `ContestController` về `[ApiController]` và bỏ `#pragma AV0014`; giới hạn kích thước thân yêu cầu |
| (tùy chọn) | FE chặn họ tên 1 ký tự như máy chủ (2–100) |

## Kết luận

**FE-25 sẵn sàng commit** vào nhánh `feature/FE-25` sau khi sửa comment `ContestEntryService.cs:203` (`QD-005` → `QD-009`; không cần build lại vì chỉ là comment). Phạm vi commit: 4 file trong `git diff` (gồm file uSync nội dung có ngày mẫu theo QĐ-008) và các file mới trong `src/` liệt kê ở "Phạm vi đã review"; không commit `appsettings.Local.json`, `App_Data/` (đã bị `.gitignore` bỏ qua). Commit do anhnn hoặc điều phối làm; Orchestrator không commit.

**Merge vào `main`: được**, theo QĐ-012 ("FE-25 vẫn được merge vào nhánh phát triển"), **với điều kiện `main` không tự triển khai lên môi trường thật**. Nếu `main` có triển khai tự động thì chưa merge, hoặc merge cùng lúc xóa ngày mẫu, vì khi đó API-01 mở ra ngoài trái QĐ-012. Merge nên chạy lại `.\run-local.ps1` một lần trên `main` sau merge (Worker) để chắc không xung đột với nhánh khác.

**Điều kiện trước khi triển khai thật** (đưa vào danh sách kiểm tra triển khai):

1. **BE-26 xong** (giới hạn tần suất, IP thật sau proxy) — QĐ-012. Trước đó không mở API-01 ra ngoài.
2. **Ngày cuộc thi**: nhập ngày thật trong backoffice, hoặc xóa ngày để giữ "chưa mở" — QĐ-008 (ngày mẫu làm cuộc thi mở ngay khi uSync nhập vào CSDL trống).
3. **`Contest:IpHashSalt`** đặt giá trị thật ở môi trường, không dùng giá trị mẫu; kiểm log khởi động không có cảnh báo `Thieu cau hinh Contest:IpHashSalt` — QĐ-009.
4. **Có màn làm bài**: triển khai cùng FE-26, FE-28 và các API làm bài/nộp bài (BE-23, BE-24). Chỉ có FE-25 thì người dự thi đăng ký xong, dùng hết lượt, nhưng không làm bài được.
5. **Một tiến trình ghi**: chạy một instance, tắt overlapped recycle (IIS) hoặc xác minh `BEGIN IMMEDIATE`, cho tới khi có ràng buộc ở CSDL (BE-22).
6. **Nội dung**: thay `[…]` ở `periodText`, `rulesText`, `rulesLink`, `dataRetentionDays`; chốt CXN-4 (Câu hỏi mở #5) và câu hỏi OTP với chủ quản.

### Việc Worker phải làm

1. Sửa comment `ContestEntryService.cs:203`: `(QD-005)` → `(QD-009)`. Không cần build hay chạy lại.
2. Không còn việc nào khác của FE-25.
