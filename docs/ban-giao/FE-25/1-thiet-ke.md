# FE-25 · Màn Đăng ký dự thi: thiết kế

- Ngày: 2026-10-17 · Người ghi: Orchestrator · Nhánh: `feature/FE-25`
- Trạng thái: **T1 làm được ngay**. T2–T5 **chờ xác nhận** (xem mục cuối).
- Cập nhật 2026-10-17: người dùng đã xác nhận; T2–T5 **làm được**. Xem mục "2026-10-17 · Người dùng đã xác nhận" ở cuối file.

## Mục tiêu và phạm vi

Thay `_PageStub` ở `/tham-gia/cuoc-thi` (`Views/thiPage.cshtml`) bằng màn Đăng ký dự thi (trạng thái `#dang-ky`): hero, thẻ chính `#cmain` (thông tin, chọn cách dự thi, form có tên / hộp ẩn danh, lối vào luyện tập), cột bên `#cside`, kiểm tra phía trình duyệt, gọi API-01, xử lý lỗi.

**Không thuộc FE-25** (ghi rõ để Worker không làm lấn):

- Partial hero dùng chung `_PageHero` → FE-08 (FE1). FE-25 dùng hero tạm, thay khi FE-08 xong.
- Nội dung đầy đủ cột bên (thẻ Thí sinh có mã, thẻ Tiến độ 8 chuyên đề) → FE-26.
- Màn Danh sách chuyên đề sau khi đăng ký → FE-26.
- Lớp trạng thái đầy đủ (lấy lại lượt, hàng đợi gửi lại, chế độ luyện tập) → FE-28.
- API-01 phía máy chủ → BE-22; chuẩn lỗi, giới hạn tần suất → BE-26.

## Nguồn đã dùng

- `docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › sheet "Công việc" › FE-25 (r21), FE-26 (r22), FE-28 (r18), FE-08 (r8), BE-20 (r48), BE-22 (r51), BE-26 (r54).
- cùng file › sheet "API" › API-01 (r5), bảng mã lỗi (r16–r27); sheet "Nội dung Umbraco" › thiPage (r26–r34); sheet "URL" › r11; sheet "Câu hỏi mở" › #4, #5, #9, #11, #12, #15.
- `docs/ke-hoach/Mo-ta-cong-viec-FE-antoantaichinh-v3.docx` › 5. Công việc của FE2 › FE-25 (nội dung trùng với sheet "Công việc").
- Ảnh: `docs/ke-hoach/anh/th-01-dang-ky-co-ten.png`, `th-03-dang-ky-an-danh.png` (đã xem). `th-02`, `th-10`, `mb-06` chưa xem trong lượt này; Worker xem khi dựng.
- Bản dựng `docs/ban-dung/antoantaichinh-ban-dung-thu.html`: markup `#cmain` dòng ~1233, `#cside` ~1236, hộp ẩn danh ~1258, hộp đồng ý ~1283, luyện tập ~1306; xử lý form dòng 1650–1672.
- `docs/quyet-dinh.md`: chỉ có QĐ-001 (tài liệu là bản nháp). Chưa có quyết định nào về cuộc thi.
- Chưa đọc: phần "6. Hợp đồng API" và "bảng mã lỗi" trong `.docx` (đã dùng bản trong sheet "API"; Worker không cần đọc thêm).

## Hành vi và acceptance criteria

Theo FE-25 (tài liệu ghi), tóm tắt cho Worker:

1. Đầu thẻ: nhãn "Bước 1", H2 "Đăng ký dự thi", 3 ô nền `--c-bg-soft`: "Thời gian diễn ra" (`periodText`), "Ai được dự thi" (chữ cứng như bản dựng, số lượt lấy từ `maxAttempts`), "Thể lệ và giải thưởng" (`rulesText`, kèm `rulesLink` nếu có).
2. Hai thẻ radio `.mode`: "Dự thi có tên" (mặc định) / "Thi ẩn danh". Thẻ đang chọn viền `--c-brand`, nền `--c-tint`. Đổi radio thì ẩn/hiện form có tên và hộp ẩn danh ngay (dùng `hidden`, không dùng `style=`).
3. Form có tên: Họ và tên (bắt buộc), Số điện thoại (bắt buộc, `inputmode="numeric"`, `autocomplete="tel"`), Trường, lớp hoặc đơn vị (không bắt buộc); hộp hồng; hộp "Những điều bạn đang đồng ý, đọc một lượt" 7 mục; ô tick; nút "Đăng ký và bắt đầu làm bài ›".
4. Hộp ẩn danh "Thi ẩn danh nghĩa là" 3 gạch đầu dòng; nút "Bắt đầu thi ẩn danh ›".
5. Cuối thẻ: "Chỉ muốn luyện tập, không dự thi: vào ngân hàng câu hỏi ›".
6. Sửa câu chữ so với bản dựng (a)–(d) như FE-25: (a) tiêu đề hộp hồng thành "Mỗi số điện thoại thi tối đa 02 lượt", bỏ ý số điện thoại là mã; (b) gạch đầu dòng mã ẩn danh thành "Một mã dự thi ngẫu nhiên. Bài làm được lưu theo mã này, không kèm thông tin cá nhân."; (c) xóa hai dòng "Bản dựng thử: … không gửi đi đâu."; (d) xóa khối "Ghi chú cho chủ quản: người dự thi dưới 16 tuổi".
7. Kiểm tra theo thứ tự, đúng câu:
   - thiếu họ tên (sau `trim`) → "Chưa có họ tên. Ban Tổ chức cần tên để xác minh khi trao giải."
   - số sai → "Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số."
   - chưa tick → "Cần tích ô đồng ý với Thể lệ và nội dung xử lý dữ liệu thì mới vào thi được."
   - Chuẩn hóa số: bỏ ký tự không phải số; nếu bắt đầu bằng `84` và dài 11 số thì đổi `84` → `0`; hợp lệ khi khớp `^0\d{9}$` (khớp đúng quy tắc BE-22; FE-25 viết gọn "đổi đầu 84 thành 0").
8. Lỗi hiện ngay trên nút gửi, `role="alert"`, màu `--c-danger-600` (#A31F1F); focus chuyển tới ô sai đầu tiên (ô tick khi lỗi đồng ý).
9. Chờ máy chủ: khóa nút, chữ "Đang đăng ký…"; mở lại khi có lỗi.
10. Lỗi API-01: `ATTEMPT_LIMIT` → "Số <số đã chuẩn hóa> đã dùng hết <maxAttempts> lượt thi. Mỗi số điện thoại chỉ được thi tối đa <maxAttempts> lượt."; `CONTEST_CLOSED` → thay form bằng thông báo cuộc thi chưa mở / đã kết thúc, chỉ còn lối vào luyện tập; `RATE_LIMITED`, lỗi mạng, 5xx → thông báo thử lại; `VALIDATION` → hiện `fields[...]` của trường đầu tiên (hoặc `message`).
11. Thành công: lưu `code` + `token` (localStorage khóa `at_entry`, bọc try/catch), chuyển sang màn Danh sách chuyên đề.
12. Responsive: 3 ô thông tin, 2 thẻ radio, 3 ô nhập dùng lưới `auto-fit`, tự xuống 1 cột khi hẹp; ≤ 640px đệm thẻ chính 24px (bình thường 36px); ≤ 900px cột bên xuống dưới thẻ chính.

Tiêu chí nghiệm thu (sheet "Công việc" › FE-25):

- AC1 Giống ảnh tham chiếu trừ câu chữ đã sửa.
- AC2 Ba lỗi kiểm tra hiện đúng câu, đúng thứ tự.
- AC3 Đăng ký có tên và ẩn danh đều tạo được lượt thi và vào danh sách chuyên đề. *(cần API-01 thật và FE-26)*
- AC4 Lượt thứ ba của cùng một số điện thoại bị từ chối với đúng thông báo. *(cần API-01 thật)*
- AC5 Ngoài thời gian cuộc thi: không đăng ký được, vẫn vào luyện tập được. *(cần trạng thái cuộc thi do BE gắn, và API trả `CONTEST_CLOSED`)*

## Trường hợp biên

- Tắt JavaScript: form không gửi được → hiện `<noscript>` "Cần bật JavaScript để đăng ký dự thi." (đề xuất, giống cách FE-24 xử lý).
- localStorage bị chặn (chế độ riêng tư): đăng ký vẫn chạy trong phiên, không lỗi console; mất lượt khi tải lại (giới hạn đã biết, xem câu hỏi mở #12).
- Bấm hai lần / Enter liên tục: nút khóa trong lúc chờ.
- Số dạng `+84 912 345 678`, `0912.345.678`, `84912345678` → cùng một số `0912345678`. Số 9 hoặc 11 chữ số, số cố định không bắt đầu bằng 0 → lỗi số.
- Họ tên chỉ toàn khoảng trắng → lỗi thiếu họ tên. Giới hạn độ dài theo BE-22: `maxlength` 100 cho họ tên, 150 cho đơn vị.
- Đã có `at_entry` trong máy khi mở trang: FE-28 xử lý (lấy lại lượt). Trong FE-25 chỉ cần không ghi đè khi chưa đăng ký mới.
- Thuộc tính Umbraco trống (`periodText`, `rulesText` đang là `[…]`, `contestStart/End` trống, `dataRetentionDays` trống): hiển thị `[…]`, không lỗi.
- Chữ to (`data-font-scale` 1, 2): lưới không vỡ ở 390px.

## Đối chiếu

| Điểm | Loại thông tin | Nguồn / bằng chứng | Ghi chú |
|---|---|---|---|
| View đang là stub | Code hiện tại | `Views/thiPage.cshtml:6` | Thay toàn bộ |
| Document type `thiPage` đã có đủ thuộc tính Cài đặt cuộc thi | Code hiện tại | `uSync/v18/ContentTypes/thipage.config` (contestStart, contestEnd, maxAttempts, periodText, rulesText, rulesLink, dataRetentionDays, submitGraceHours, readTimerFactor) | Không cần sửa uSync |
| Nội dung trang: `maxAttempts`=2, `periodText`/`rulesText`=`[…]`, `contestStart/End` trống | Code hiện tại | `uSync/v18/Content/cuộc-thi-trực-tuyến.config:16-45` | Ngày trống ảnh hưởng trạng thái cuộc thi (CXN-3) |
| Tên pháp nhân, đầu mối bảo vệ dữ liệu | Tài liệu ghi "từ Cài đặt cuộc thi"; code: nằm ở `home` | `uSync/v18/ContentTypes/home.config` (`operatorName`, `dataContact`) | Lấy từ `Model.Root()`; khác tài liệu nhưng không đổi contract, tự quyết được |
| Hero dùng chung | Tài liệu ghi (FE-08); code chưa có `_PageHero` | `components.css:52-54` chỉ có `.page-hero` tạm | Dùng hero tạm + modifier đè 120px; thay khi có FE-08 |
| Token CSS đủ dùng | Code hiện tại | `tokens.css:5-58` (`--c-brand`, `--c-tint`, `--c-danger-600`, `--c-bg-soft`, `--radius`…) | Không thêm màu cứng |
| Quy ước JS: mỗi chức năng một module | Code hiện tại | `wwwroot/assets/js/site.js:1` | Thêm `assets/js/contest/…` |
| Layout có section `Head`, `Scripts` | Code hiện tại | `_SiteLayout.cshtml:23,64` | Nạp CSS/JS riêng của trang qua section |
| Bảng `entry` (BE-20) đã có, có chỉ mục unique `Code`, `TokenHash`, chỉ mục `Phone` | Code hiện tại | `Data/Entities.cs:8-34`, `Data/AppDbContext.cs:42-45` | BE-22 làm được mà không cần migration |
| API-01 chưa có | Code hiện tại | Chỉ có `QuizController.cs`, `SystemController.cs` | |
| Dạng lỗi API `{ error: { code, message, fields } }` | Tài liệu ghi | sheet "API" r2; BE-26 | `QuizController.cs:29` chỉ trả `code`, `message`. FE nên đọc cả hai dạng |
| FE-28 cho phép mock cùng chữ ký hàm khi BE chưa xong | Tài liệu ghi | sheet "Công việc" › FE-28 | Cơ sở cho phương án A |
| Số lượt "02" lấy từ cấu hình | Tài liệu ghi (dữ liệu động FE-25; Câu hỏi mở #4 "Đang giả định", **chưa chốt**) | sheet "Câu hỏi mở" r8 | Render từ `maxAttempts`, định dạng 2 chữ số |
| Quy tắc số điện thoại 10 số bắt đầu bằng 0 | Tài liệu ghi; Câu hỏi mở #15 ghi "Nhóm kỹ thuật đã quyết" nhưng cột Kết quả "Chưa chốt" | sheet "Câu hỏi mở" r19 | Bản dựng nhận 9–11 số (`ban-dung…html:1656`). Theo FE-25/BE-22 |
| Mã dự thi 6 ký tự, máy chủ sinh | Tài liệu ghi; Câu hỏi mở #11 "Chưa chốt" | sheet "Câu hỏi mở" r15 | Không ảnh hưởng FE-25 ngoài việc hiển thị mã |
| Bỏ khối ghi chú dưới 16 tuổi | Tài liệu ghi (FE-25 (d)); Câu hỏi mở #5 đang giả định "cách một", **chưa chốt** | sheet "Câu hỏi mở" r9 | Ô "Ai được dự thi" ghi "Mọi lứa tuổi…" có thể mâu thuẫn với cách một (CXN-4) |
| Ghi rõ "đổi máy không khôi phục được" ở màn đăng ký | Câu hỏi mở #12 "Đang giả định", **chưa chốt**; FE-25 không có câu này | sheet "Câu hỏi mở" r16 | CXN-5 |
| Câu thông báo `RATE_LIMITED`, lỗi mạng, `CONTEST_CLOSED` | Còn thiếu | FE-25 chỉ ghi "thông báo thử lại" | Đề xuất câu chữ ở T2/T3, ghi trong báo cáo |
| Màn sau khi đăng ký (`#ngan-hang`) | Còn thiếu (FE-26 chưa làm) | | T2 dùng màn chờ tạm |

## Phương án và khuyến nghị

Câu hỏi của điều phối: làm gì khi FE-28 và BE-22 chưa có.

| | A. Giao diện + lớp gọi API mỏng có mock | B. A + làm luôn API-01 tối thiểu (một phần BE-22) | C. Chờ FE-28, BE-22 xong mới làm FE-25 |
|---|---|---|---|
| Làm gì | T1 giao diện + kiểm tra; T2 `contest-api.js` có hàm `createEntry(payload)` trả `{ok, data}` hoặc `{ok:false, error:{code,message,fields}}`, kèm bản mock (bật bằng cờ) mô phỏng 201 / ATTEMPT_LIMIT / CONTEST_CLOSED / RATE_LIMITED | Như A, thêm T4: `POST /api/v1/contest/entries` thật (kiểm tra, chuẩn hóa số, giới hạn lượt trong transaction, sinh mã/token, cửa sổ thời gian, lỗi đúng dạng) | Không làm gì |
| Đáp ứng AC | AC1, AC2 thật; AC3–AC5 chỉ kiểm được trên mock | AC1, AC2, AC4, AC5 thật; AC3 thật tới bước tạo lượt (màn danh sách vẫn chờ FE-26) | Đủ, nhưng muộn |
| Contract | Không đổi; FE bám đúng API-01 trong sheet | Phải chốt vài điểm kiến trúc BE (CXN-2b) | — |
| Rủi ro | Mock lệch API thật → sửa nhỏ khi BE-22 xong | Worker FE làm việc BE2; có thể đụng việc của người làm BE-22 nếu có | Trễ mốc M2 |
| Công | ~1 ngày | ~2 ngày | — |

**Khuyến nghị: B, chia đợt.** Làm A trước (T1, T2) vì không phụ thuộc BE; làm T4 (API-01 tối thiểu) ngay sau nếu người dùng đồng ý, vì `entry` đã sẵn (`Entities.cs:8-34`, chỉ mục unique đã có) nên chi phí thấp, và đây là cách duy nhất kiểm được AC4/AC5 thật. Giới hạn tần suất và chuẩn lỗi toàn cục để lại BE-26; T4 chỉ trả đúng dạng lỗi cho chính API-01. Nếu người làm BE-22 là người khác và đã bắt đầu, chọn A.

Lớp `contest-api.js` ở T2 là **phần nhỏ của FE-28** (chỉ hàm tạo lượt và lưu `at_entry`), viết theo đúng chữ ký FE-28 mô tả để FE-28 bổ sung chứ không viết lại.

## Task

| # | Task | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|
| T1 | Dựng giao diện màn Đăng ký + kiểm tra phía trình duyệt (chưa gọi API) | `Views/thiPage.cshtml` (bỏ `_PageStub`); `wwwroot/assets/css/contest.css` (mới, nạp qua `@section Head`); `wwwroot/assets/js/contest/register.js` (mới, module, nạp qua `@section Scripts`). Hero tạm: breadcrumb "Trang chủ / Phần 4 / Cuộc thi", nhãn "Phần 4 · Thi trắc nghiệm", H1 "Cuộc thi trực tuyến", mô tả như ảnh `th-01`; nền `.page-hero` + modifier đè 120px. `#cside` tạm: thẻ "Thí sinh — Chưa đăng ký dự thi." và hộp cảnh báo "Website không trực 24/7…" liên kết `/ung-pho` (thẻ Tiến độ để FE-26). Dữ liệu động: `periodText`, `rulesText`, `rulesLink`, `maxAttempts` (mặc định 2), `dataRetentionDays` từ trang; `operatorName`, `dataContact` từ `Model.Root()`; trống thì `[…]`. Thông báo lỗi `role="alert"`. Nút gửi khi hợp lệ: tạm thời chỉ ghi `console.info` (không gọi API) | — | Hành vi 1–8, 12; câu chữ (a)–(d); không có `style="..."`; cỡ chữ dùng biến `rem`; comment C#/JS tiếng Việt không dấu | `run-local`, mở `/tham-gia/cuoc-thi` ở 1440/1024/390 so với `th-01`, `th-03`, `th-10`, `mb-06`; thử 3 lỗi đúng thứ tự (`th-02`); thử số `+84 912 345 678` hợp lệ, `091234567` sai; đổi radio; bật chữ to; console không lỗi | **Làm ngay** |
| T2 | Lớp gọi API-01 mỏng + mock, nối form, xử lý lỗi, lưu `at_entry`, chuyển màn | `wwwroot/assets/js/contest/contest-api.js` (mới: `createEntry`, đọc lỗi dạng `{error:{code,message,fields}}` và dạng thiếu `fields`; mock bật bằng `?mock=` hoặc cờ trong module), `register.js`. Thành công: lưu `{code, token, mode, attemptNo, maxAttempts}` vào `at_entry`, đặt `location.hash = '#ngan-hang'` và hiện khối tạm "Đã đăng ký. Mã dự thi …" (FE-26 thay). Lối "luyện tập": tạm đặt `#ngan-hang` + ghi chế độ luyện tập theo FE-28 (`at_practice`) | T1, CXN-1, CXN-2 | Hành vi 9–11; 4 nhánh lỗi + lỗi mạng hiện đúng câu; nút khóa khi chờ | Với mock: chạy 201 / ATTEMPT_LIMIT / CONTEST_CLOSED / RATE_LIMITED / lỗi mạng (tắt mạng trong DevTools); xem localStorage `at_entry`; chặn localStorage (cửa sổ riêng tư) không lỗi console | Chờ xác nhận |
| T3 | Trạng thái cuộc thi do máy chủ gắn vào khung trang | `thiPage.cshtml`: tính `upcoming` / `open` / `closed` từ `contestStart`, `contestEnd` (giờ Việt Nam), đặt `data-contest-status` trên `#cmain`; khác `open` thì không render form, hiện thông báo + lối luyện tập (dùng chung khối với nhánh `CONTEST_CLOSED` của T2) | T1, CXN-3 | AC5 phía hiển thị | Sửa ngày trong backoffice (trước/trong/sau), tải lại trang, xem thuộc tính `data-contest-status` và giao diện | Chờ xác nhận |
| T4 | API-01 `POST /api/v1/contest/entries` (phần tối thiểu của BE-22) | `Umbraco.Plugin.Custom.Api/Controllers/ContestController.cs` (mới); dịch vụ tạo lượt trong `Umbraco.Plugin.Custom.Core` (đăng ký ở `CustomCoreComposer.cs`); đọc Cài đặt cuộc thi từ nội dung `thiPage`; chuẩn hóa số; đếm lượt và ghi trong cùng transaction; mã `AD-` + 6 ký tự từ bảng chữ BE-22 bằng `RandomNumberGenerator`; token 32 byte base64url, chỉ lưu SHA-256; `ConsentAt`, `IpHash` (SHA-256 IP + muối cấu hình); lỗi `VALIDATION` / `CONTEST_CLOSED` / `ATTEMPT_LIMIT` dạng `{error:{code,message,fields}}`. Không làm giới hạn tần suất (BE-26) | CXN-2 | Đúng contract API-01 sheet "API" r5; AC của BE-22 trừ phần đồng thời nếu không kiểm được | `Invoke-RestMethod` gọi 3 lần cùng số (`+84 912 345 678`, `0912.345.678`, `0912345678`): lần 1, 2 → 201 `attemptNo` 1, 2; lần 3 → 409; gửi 10 yêu cầu song song (`Start-Job`/`ForEach-Object -Parallel` nếu có PS7) → đúng 2 thành công; `sqlite3`/script kiểm tra `entry` không có token gốc; ngoài cửa sổ → 403 | Chờ xác nhận |
| T5 | Nối T2 vào API thật, tắt mock mặc định | `contest-api.js` | T2, T4 | AC3 (tới bước tạo lượt), AC4, AC5 chạy thật | Luồng đầu–cuối trên trình duyệt: có tên, ẩn danh, lượt thứ 3, ngoài thời gian; xem dòng mới trong `App_Data/app.sqlite.db` | Chờ xác nhận |

Ghi chú cho Worker ở T1:

- Đọc thuộc tính bằng `Model.Value<string>("periodText")`, `Model.Value<int?>("maxAttempts") ?? 2`. Mã hóa HTML mặc định của Razor là đủ (không dùng `Html.Raw` cho chữ người nhập trong backoffice; `rulesText` là Textarea thì đổi xuống dòng thành `<br>` sau khi đã mã hóa).
- Không thêm thuộc tính hay document type mới; không sửa uSync.
- `register.js` để sẵn một hàm `submit(payload)` để T2 thay phần thân, không phải viết lại phần kiểm tra.
- Hàm chuẩn hóa số điện thoại đặt trong module riêng hoặc export, để FE-29 (gắn thông tin) dùng lại.

## Cần người dùng xác nhận

**CXN-1 · Phạm vi khi FE-28 và BE-22 chưa có** (kiến trúc / phân công)
- Nguồn: `0-giao-viec.md` mục Orchestrator; FE-25 phụ thuộc FE-28, BE-22 (sheet "Công việc" r21).
- Code: chưa có API cuộc thi; bảng `entry` đã có (`Entities.cs:8-34`).
- Phương án: A / B / C ở mục trên. **Khuyến nghị B** (A trước, T4 ngay sau). Nếu BE-22 đã giao cho người khác đang làm thì chọn A.

**CXN-2 · Nếu chọn B: các điểm kiến trúc của T4** (API contract / kiến trúc / bảo mật)
- a) Worker trên FE-25 làm luôn T4 (việc của BE2)? Khuyến nghị: có, chỉ phần API-01.
- b) API đọc Cài đặt cuộc thi từ nội dung Umbraco (`thiPage`) qua `IUmbracoContextFactory` + tìm nút theo content type `thiPage`. Khuyến nghị: có, gói trong một dịch vụ `IContestSettings` để BE-23/24 dùng lại. Phương án khác (đưa cấu hình vào `appsettings`) trái sheet "Nội dung Umbraco".
- c) Dạng lỗi: API-01 trả đủ `{error:{code,message,fields}}` theo sheet "API" ngay từ đầu (khác `QuizController.cs:29` hiện chưa có `fields`). Khuyến nghị: có; việc sửa `QuizController` để BE-26.
- d) Muối băm IP: thêm khóa cấu hình (ví dụ `Contest:IpHashSalt`) vào `appsettings.Local.template.json` với giá trị mẫu local; giá trị thật đặt ở môi trường. Khuyến nghị: có.
- e) Giới hạn tần suất 10 lần/giờ/IP để BE-26, chưa làm ở T4. Khuyến nghị: để BE-26.

**CXN-3 · Trạng thái cuộc thi khi `contestStart`/`contestEnd` trống** (nghiệp vụ)
- Nguồn: sheet "Nội dung Umbraco" r26–r27 ghi hai trường "Bắt buộc: Có"; nội dung hiện tại để trống (`cuộc-thi-trực-tuyến.config:16-20`).
- Ảnh hưởng: coi là "chưa mở" thì môi trường local/test không đăng ký được cho tới khi có người nhập ngày; coi là "đang mở" thì có nguy cơ mở cổng ngoài ý muốn trên môi trường thật.
- Khuyến nghị: trống → "chưa mở" (an toàn), và Worker đặt ngày mẫu trong nội dung local (lưu qua backoffice, uSync xuất lại file nội dung) để kiểm thử. Trạng thái tính bằng giờ Việt Nam, đóng tại `contestEnd` (không tính `submitGraceHours`, giờ gia hạn chỉ dùng cho nộp bài theo BE-24).

**CXN-4 · Câu "Ai được dự thi: Mọi lứa tuổi…" và người dưới 16 tuổi** (nghiệp vụ / pháp lý)
- Nguồn: ảnh `th-01` và bản dựng ghi "Mọi lứa tuổi, chỉ cần có số điện thoại để liên hệ"; Câu hỏi mở #5 đang giả định "cách một: thể lệ quy định người đứng tên số điện thoại từ đủ 16 tuổi" (chưa chốt); FE-25 (d) bỏ khối ghi chú dưới 16 tuổi.
- Ảnh hưởng: nếu chọn cách một thì câu "Mọi lứa tuổi" dễ gây hiểu nhầm; nếu chọn cách hai thì FE-25 phải thêm ô tự khai tuổi (+1,5 ngày FE, +1 ngày BE theo sheet).
- Khuyến nghị: T1 giữ nguyên câu bản dựng cho tới khi chủ quản chốt câu hỏi #5; câu này là chữ cứng trong view, đổi sau dễ. Không chặn T1.

**CXN-5 · Có ghi cảnh báo "đổi máy hoặc xóa dữ liệu trình duyệt thì không khôi phục được lượt" trên màn đăng ký không** (nghiệp vụ)
- Nguồn: Câu hỏi mở #12, cột "Đang giả định" ghi "Ghi rõ điều này ở màn đăng ký"; FE-25 không có câu này.
- Khuyến nghị: thêm một gạch đầu dòng vào hộp hồng (chế độ có tên) và hộp ẩn danh, câu đề xuất: "Lượt thi gắn với trình duyệt bạn đang dùng. Đổi máy hoặc xóa dữ liệu trình duyệt thì không làm tiếp được lượt này." Chờ chốt; T1 làm khi chưa có câu này, thêm sau là việc nhỏ.

**CXN-6 · Câu thông báo cho các lỗi tài liệu chưa ghi** (câu chữ, không chặn T1; xác nhận cùng T2)
- Đề xuất: `RATE_LIMITED` → "Bạn thao tác hơi nhanh. Đợi một chút rồi bấm lại."; lỗi mạng/5xx → "Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm lại."; `CONTEST_CLOSED`/ngoài thời gian → "Cuộc thi chưa mở hoặc đã kết thúc. Bạn vẫn có thể luyện tập với ngân hàng câu hỏi."

## 2026-10-17 · Người dùng đã xác nhận

anhnn xác nhận các điểm ở mục "Cần người dùng xác nhận" theo khuyến nghị. Các mục thuộc nghiệp vụ, kiến trúc, contract, bảo mật đã ghi vào `docs/quyet-dinh.md`.

| Điểm | Đã chốt | Ghi ở |
|---|---|---|
| CXN-1 | Phương án B, chia đợt: T2 → T3 → T4 → T5 | QĐ-002 |
| CXN-2a, 2e | Worker FE-25 làm T4 (chỉ API-01); không làm giới hạn tần suất (để BE-26) | QĐ-002 |
| CXN-2b | `IContestSettings` đọc nội dung `thiPage` qua `IUmbracoContextFactory` | QĐ-003 |
| CXN-2c | API-01 trả `{error:{code,message,fields}}`; không sửa `QuizController` | QĐ-004 |
| CXN-2d | Khóa `Contest:IpHashSalt`, giá trị mẫu trong `appsettings.Local.template.json` | QĐ-005 |
| CXN-3 | Thiếu ngày → "chưa mở"; giờ Việt Nam; đóng tại `contestEnd`, không cộng `submitGraceHours` | QĐ-006 |
| CXN-4 | Giữ nguyên câu "Mọi lứa tuổi…" cho tới khi chủ quản chốt Câu hỏi mở #5. Câu hỏi #5 **vẫn mở**; đây chỉ là cách làm tạm cho FE-25, không ghi QĐ | mục này |
| CXN-5 | Thêm gạch đầu dòng "Lượt thi gắn với trình duyệt…" vào hộp hồng và hộp ẩn danh | QĐ-007 |
| CXN-6 | Dùng ba câu thông báo như đề xuất | mục này |

### Trạng thái task sau xác nhận

| # | Trạng thái | Bổ sung so với bảng Task |
|---|---|---|
| T1 | Đã bàn giao, chờ Orchestrator review | Thêm câu QĐ-007 làm cùng T2 (sửa chữ trong `thiPage.cshtml`), không mở lại T1 |
| T2 | **Làm được** | Câu thông báo theo CXN-6. `CONTEST_CLOSED` thay form bằng khối thông báo dùng chung với T3. Payload `{ mode, fullName, phone, org, consent }` của T1 đã khớp sheet "API" › API-01 (r5); chế độ ẩn danh chỉ gửi `{ "mode": "anon" }`. `fields` khi `VALIDATION`: `fullName`, `phone`, `org`, `consent` → đưa focus về ô tương ứng (`rgname`, `rgphone`, ô đơn vị, `rgok`) |
| T3 | **Làm được** (sau T2) | Cách tính theo QĐ-006. Đặt logic tính trạng thái ở một chỗ dùng chung được với T4 (ví dụ trong `IContestSettings` hoặc hàm tĩnh ở `Umbraco.Plugin.Custom.Core`), để trang và API cho cùng kết quả. Nếu làm T3 trước T4 thì view tính tạm, T4 chuyển sang dịch vụ |
| T4 | **Làm được** (sau T3) | Theo QĐ-002 → QĐ-006. Trả `201` với đủ `code`, `token`, `mode`, `attemptNo`, `maxAttempts`, `status: "in_progress"` (sheet "API" r5). Không ghi token gốc, IP gốc vào CSDL hay log. Sửa C# nên phải chạy lại `run-local` |
| T5 | **Làm được** (sau T4) | Không đổi |

Worker làm lần lượt T2 → T5, mỗi task một mục bàn giao trong `2-ban-giao.md`. Nếu T4 cần đổi schema bảng `entry` (thêm cột, migration) thì dừng và hỏi trước.
