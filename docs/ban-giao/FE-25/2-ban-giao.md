# FE-25 · Bàn giao của Worker

## 2026-10-17 · T1 (giao diện màn Đăng ký + kiểm tra phía trình duyệt)

Chỉ làm T1. T2–T5 chưa làm (chờ xác nhận theo `1-thiet-ke.md`).

## Đã làm

Thay `_PageStub` ở `thiPage.cshtml` bằng màn Đăng ký dự thi: hero tạm, thẻ `#cmain`, cột bên `#cside` tạm, kiểm tra form phía trình duyệt.

| Tiêu chí | Kết quả |
|---|---|
| Hành vi 1 (3 ô thông tin, dữ liệu động, `[…]` khi trống) | Đạt. `periodText`, `rulesText` hiện `[…]`; số lượt hiện "02" từ `maxAttempts`; `rulesLink` hiện khi có (MultiUrlPicker, chưa thử với giá trị thật vì nội dung đang trống) |
| 2 (radio, đổi chế độ bằng `hidden`) | Đạt (thử bằng CDP: anon → form ẩn, hộp ẩn danh hiện; named → ngược lại) |
| 3, 4, 5 (form, hộp ẩn danh, lối luyện tập) | Đạt, đối chiếu ảnh `th-01` ở 1440px |
| 6 (sửa câu chữ a–d) | Đạt: tiêu đề hộp hồng, gạch đầu dòng mã ẩn danh, bỏ 2 dòng "Bản dựng thử", bỏ khối dưới 16 tuổi (HTML trả về không còn các chuỗi này) |
| 7 (3 lỗi đúng câu, đúng thứ tự; chuẩn hóa số) | Đạt. `+84 912 345 678` và `84912345678` hợp lệ; `091234567` báo lỗi số; tên toàn khoảng trắng báo thiếu tên |
| 8 (`role="alert"`, màu `--c-danger-600`, focus ô sai đầu tiên) | Đạt (focus: `rgname` / `rgphone` / `rgok`). Màu chưa đo bằng mắt trong ảnh có lỗi |
| 9–11 (gọi API, khóa nút, lưu `at_entry`) | Không thuộc T1 |
| 12 (responsive) | Đạt ở 1440/1024/390: không tràn ngang, đệm thẻ chính 36px → 24px, cột bên xuống dưới ở 390 và nằm cạnh ở 1440/1024. Chữ to cấp 1, 2 ở 390px không tràn ngang |
| AC1 giống ảnh tham chiếu | Đạt ở 1440px (xem `th-01`). Hero là nền đỏ trơn, không có ảnh nền như `th-01` (hero tạm, chờ FE-08) |
| AC2 | Đạt |
| AC3–AC5 | Không thuộc T1 |

## File thay đổi

- `src/ANTC.Portal.App/Umbraco.Web.UI/Views/thiPage.cshtml` (sửa)
- `src/ANTC.Portal.App/Umbraco.Web.UI/wwwroot/assets/css/contest.css` (mới)
- `src/ANTC.Portal.App/Umbraco.Web.UI/wwwroot/assets/js/contest/phone.js` (mới): `normalizePhone`, `isValidPhone`, export cho FE-29
- `src/ANTC.Portal.App/Umbraco.Web.UI/wwwroot/assets/js/contest/register.js` (mới): kiểm tra, đổi chế độ, hàm `submit(payload)` để T2 thay thân

Không sửa uSync, không thêm thuộc tính hay document type.

## Kiểm chứng

- `.\run-local.ps1` (nền): web lên, log `uSync: Startup Complete`, nghe `http://localhost:11000`.
- Lần tải đầu `/tham-gia/cuoc-thi` trả 500 vì view thiếu `@using Umbraco.Cms.Core.Models` (kiểu `Link`). Đã sửa; tải lại trả 200. Lần này không phải chạy lại `run-local` (chỉ sửa view).
- `curl`: `contest.css`, `register.js`, `phone.js` đều 200; HTML trang không có `style=`.
- Edge headless chụp màn hình 1440px, so với `th-01`: khớp bố cục và câu chữ. Ảnh chụp 390px bị cắt bên phải do cửa sổ headless tối thiểu rộng hơn 390px; thay bằng đo qua CDP (`Emulation.setDeviceMetricsOverride` 390px): `scrollWidth` 375 (không tràn).
- Script CDP (đặt trong scratchpad) thử form: 3 lỗi đúng thứ tự, đúng câu, đúng ô focus; số hợp lệ chạy tới `submit` và chỉ ghi `console.info` (2 lần), không có lỗi console.
- Không có project test, không có lint. Build qua `run-local` thành công.
- Đã dừng tiến trình web (cổng 11000 trống) và Edge dùng cho CDP.

## Giả định

- Hero tạm dùng `.page-hero` kèm modifier `page-hero--contest` (đệm 88/184px) thay vì `_PageHero` (FE-08).
- Hộp hồng ở `#cside`: icon cảnh báo là SVG inline; nội dung theo ảnh `th-01`.
- `dataContact` và `operatorName` đọc từ `Model.Root()` như thiết kế; trống hiện `[…]` (hiện đang là `[Pháp nhân chủ quản]` từ nội dung `home`, và đầu mối dữ liệu hiện dạng chữ dài như trong nội dung).
- `dataRetentionDays` trống hoặc ≤ 0 → `[…]`.
- Lối luyện tập là thẻ `<a href="#ngan-hang" data-practice>`; chưa có hành vi (T2/FE-28).
- Payload `register.js` dùng `{ mode, fullName, phone, org, consent }`; T2 cần đối chiếu với API-01 trong sheet "API" khi nối.
- Không làm `<noscript>` riêng ngoài dòng "Cần bật JavaScript để đăng ký dự thi." (đã có theo đề xuất).

## Sai khác so với thiết kế

- Không có sai khác về hành vi. `1-thiet-ke.md` chỉ ghi `data-contest-status` ở T3, chưa làm.
- Chưa thêm gạch đầu dòng "đổi máy không khôi phục được lượt" (CXN-5, chờ chốt); câu "Mọi lứa tuổi…" giữ nguyên (CXN-4).

## Còn tồn tại / rủi ro

- Chưa thử `rulesLink` với giá trị thật và `rulesText` nhiều dòng (nội dung trống) — cần nhập trong backoffice để kiểm tra.
- Chưa so ảnh `th-03`, `th-10`, `mb-06` bằng mắt từng pixel; chưa chụp trạng thái có lỗi và trạng thái ẩn danh.
- Ở 900px–1024px cột bên vẫn nằm cạnh thẻ chính (quy tắc ≤ 900px mới xuống); chưa đo trực tiếp ở 900px.
- Mục "Ai giữ dữ liệu" trong hộp đồng ý hiển thị `[Pháp nhân chủ quản]` vì nội dung `home` đang để mẫu.
- Hero chưa có ảnh nền như ảnh tham chiếu (chờ FE-08).

Bàn giao T1 sẵn sàng để Orchestrator review.

## 2026-10-17 · T2 (lớp gọi API-01 mỏng + mock, nối form, xử lý lỗi) và sửa theo review T1

Chỉ làm T2 và 3 việc của `3-review.md`. T3–T5 chưa làm.

## Đã làm

- **Sửa theo review**: (1) `contest.css` viền `.consent` dùng `var(--c-tint-border)`; (2) `thiPage.cshtml` thuộc tính `target="@(… ? null : …)"` có nháy, bỏ khi rỗng, thêm `rel="noopener"` khi `_blank`; (3) chạy kiểm chứng giao diện (bên dưới).
- **QĐ-007**: thêm gạch đầu dòng "Lượt thi gắn với trình duyệt bạn đang dùng. Đổi máy hoặc xóa dữ liệu trình duyệt thì không làm tiếp được lượt này." vào hộp hồng và hộp ẩn danh, đúng câu của QĐ-007.
- **`contest-api.js` (mới)**: `createEntry(payload)` trả `{ok,data}` / `{ok:false,error:{code,message,fields}}`; `readError` đọc cả dạng `{error:{…}}` và dạng thiếu `fields`; `saveEntry`/`loadEntry` (khóa `at_entry`, bọc try/catch), `markPractice` (`at_practice`, chỉ tạo khi chưa có). Mock bật mặc định (`MOCK_DEFAULT = true`), chọn kịch bản bằng `?mock=ok|limit|closed|rate|network|server|validation`, `?mock=real` gọi API thật. T5 đổi `MOCK_DEFAULT` thành `false`.
- **`register.js`**: `submit()` gọi `createEntry`; khóa nút + "Đang đăng ký…" khi chờ, mở lại khi lỗi; chặn bấm kép. Lỗi: `ATTEMPT_LIMIT` (câu đã chốt, dùng số đã chuẩn hóa và `maxAttempts` từ `data-max-attempts`), `CONTEST_CLOSED` (thay form bằng `#closedbox`, giữ lối luyện tập), `RATE_LIMITED`, lỗi mạng/5xx/mã lạ (câu CXN-6), `VALIDATION` (hiện `fields[...]` của trường đầu tiên và focus `rgname`/`rgphone`/`rgorg`/`rgok`). Thành công: lưu `at_entry` `{code, token, mode, attemptNo, maxAttempts}`, `location.hash = '#ngan-hang'`, hiện khối tạm `#donebox`. Lối luyện tập: `markPractice()` + khối tạm. Mở lại trang có `#ngan-hang` và có `at_entry` thì hiện khối tạm.
- **Gợi ý của review**: lỗi được xóa rồi gán lại ở khung hình kế tiếp để trình đọc màn hình đọc lại; thêm `#anonerr` (`role="alert"`) cho chế độ ẩn danh vì `#rgerr` nằm trong form bị ẩn.
- **View**: thêm `data-max-attempts`, `id="modes"`, `#closedbox`, `#donebox`, `#anonerr`. `#closedbox` là khối T3 sẽ render phía máy chủ.

File thay đổi: `Views/thiPage.cshtml`, `wwwroot/assets/css/contest.css`, `wwwroot/assets/js/contest/register.js`, `wwwroot/assets/js/contest/contest-api.js` (mới). Không sửa C#, uSync, schema.

## Kiểm chứng (đã chạy)

- `.\run-local.ps1`: build thành công, web lên, trang 200. Chỉ sửa view/JS nên không cần chạy lại sau mỗi lần sửa.
- Script CDP (Edge headless) trong scratchpad, 3 lần chạy không có lỗi console:
  - Mock: `ok` → lưu `at_entry`, hash `#ngan-hang`, "Đã đăng ký. Mã dự thi AD-…, lượt 1/2."; `limit` → "Số 0912345678 đã dùng hết 2 lượt thi. Mỗi số điện thoại chỉ được thi tối đa 2 lượt.", focus `rgphone`; `closed` → form biến mất, hiện khối thông báo, lối luyện tập còn; `rate`, `network`, `server` → đúng câu CXN-6; `validation` → câu của `fields.phone`, focus `rgphone`. Trong lúc chờ nút khóa, chữ "Đang đăng ký…"; sau lỗi nút mở lại.
  - Ẩn danh: `ok` tạo lượt (không focus lỗi); `rate` hiện lỗi ở `#anonerr`, nút mở lại.
  - Bấm kép (`requestSubmit` hai lần liên tiếp): chỉ một lượt được lưu.
  - Luyện tập: `at_practice` = `{"mode":"practice"}`.
  - `localStorage` bị chặn (getter ném lỗi): đăng ký vẫn thành công trong phiên, không lỗi console.
- Giao diện (ảnh chụp bằng CDP, xem bằng mắt):
  - 1440px trạng thái lỗi "Chưa có họ tên…" so `th-02`: khớp bố cục, câu lỗi nằm ngay trên nút (màu đỏ); khác ảnh ở các câu chữ đã sửa (hộp hồng có thêm dòng QĐ-007, hết dòng "Bản dựng thử").
  - 1440px ẩn danh so `th-03`: khớp; khác ở câu chữ đã sửa (b), gạch đầu dòng QĐ-007, bỏ dòng "Bản dựng thử" và khối dưới 16 tuổi. Cột bên chưa có thẻ Tiến độ (FE-26).
  - 390px đã nhập so `th-10`/`mb-06`: một cột, đệm thẻ 24px, `scrollWidth` 390/390, không tràn. Hero nền đỏ trơn (chờ FE-08). Chưa chụp `th-10` ở 1440px riêng.
  - 900px: cột bên xuống dưới thẻ chính (`top` cột bên > đáy thẻ chính: true), không tràn ngang.
- `rulesText`/`rulesLink`: sửa tạm file uSync nội dung (hai dòng `Dòng một <b>x</b>` / `Dòng hai`, link `_blank`), chạy lại web: HTML ra `Dòng một &lt;b&gt;x&lt;/b&gt; <br /> Dòng hai` và `<a … href="https://example.com/the-le" target="_blank" rel="noopener">`. Sau đó `git checkout` file nội dung, chạy lại web để nạp lại, `rulesText` về `[…]`. **Không có thay đổi uSync nào còn trong cây làm việc.**
- Đã dừng tiến trình web (cổng 11000 trống) và Edge CDP.

## Giả định

- Mock là mặc định ở T2 (để thấy được luồng trước khi có API); khi chưa có API thật, `?mock=real` trả lỗi mạng/404 → câu "Chưa kết nối được…".
- `at_practice` chỉ tạo khóa `{"mode":"practice"}` khi chưa có; định dạng đầy đủ do FE-28 quyết.
- Mã lỗi không biết và 5xx dùng câu "Chưa kết nối được tới máy chủ…".
- `VALIDATION` ở chế độ ẩn danh (không có trường) chỉ hiện `message`.

## Còn tồn tại / rủi ro

- `maxAttempts` ≤ 0 vẫn hiện "00"/"-1 lượt" (mục "Cần xác minh" của review); để gộp khi làm `IContestSettings` (T3/T4).
- Chưa chụp ảnh riêng cho trạng thái `th-10` ở 1440px; đã so ở 390px với `mb-06`.
- Chưa thử nút khôi phục `#donebox` khi đóng tab rồi mở lại ngoài trường hợp có `#ngan-hang`; FE-28/FE-26 xử lý.
- T3 chưa làm: chưa có `data-contest-status`; trang hiện luôn hiện form dù ngày cuộc thi trống.

Bàn giao T2 sẵn sàng để Orchestrator review.

## 2026-10-17 · T3 (trạng thái cuộc thi do máy chủ gắn vào trang) và sửa theo review T2

Chỉ làm T3, 4 việc của `3-review.md` (review T2) và các ghi chú T3. T4, T5 chưa làm.

## Đã làm

- **`IContestSettings` (QĐ-003, QĐ-006)** ở `Umbraco.Plugin.Custom.Core/Contest/`, đăng ký singleton trong `CustomCoreComposer.cs`:
  - `GetAsync()` tìm nút `thiPage` (qua `IDocumentNavigationQueryService` + `IPublishedContentCache`) và đọc cài đặt; `Read(page)` đọc từ trang đã có (view dùng); T4 gọi `GetAsync()`.
  - `maxAttempts`: `null` hoặc `<= 0` → 2 (`ContestSettings.NormalizeMaxAttempts`). View và `data-max-attempts` lấy từ đây, bỏ dòng `Model.Value<int?>("maxAttempts") ?? 2`.
  - `GetStatus(settings, nowUtc)`: một chỗ tính cho trang và API. Giờ Việt Nam cố định UTC+7 đổi sang UTC rồi so với `nowUtc`; mở khi `start <= now < end`; thiếu ngày → `upcoming`; `start >= end` → `upcoming` kèm log cảnh báo.
  - Thuộc tính ngày trống đọc ra `DateTime.MinValue` chứ không phải `null`; `ReadDate` đổi về `null` (phát hiện khi chạy thử, lần đầu log báo `0001-01-01 >= 0001-01-01`).
- **`thiPage.cshtml`**: `data-contest-status="open|upcoming|closed"` trên `#cmain`. Khác `open` thì không render `#modes`, `#anonbox`, `#rgform`; `#closedbox` hiện sẵn (câu CXN-6); lối luyện tập vẫn còn.
- **`register.js`**: khi trạng thái khác `open` chỉ gắn sự kiện cho lối luyện tập (phương án (a)), không có lỗi console; `hideFlow` an toàn khi thiếu phần tử.
- **4 việc sửa theo review T2**: (1) `VALIDATION` chọn trường theo thứ tự form `fullName, phone, org, consent`, chỉ nhận chuỗi (hoặc phần tử đầu của mảng), rỗng thì dùng `message`; (2) `setBusy` khóa `#modes`; (3) xóa hằng `MSG_CLOSED`; (4) ghi tiêu đề tạm ở mục Giả định.

AC5 phía hiển thị: đạt (ngoài thời gian không có form, còn luyện tập).

## File thay đổi

- Mới: `Umbraco.Plugin.Custom.Core/Contest/ContestSettings.cs`, `Contest/ContestSettingsService.cs`.
- Sửa: `Umbraco.Plugin.Custom.Core/Composers/CustomCoreComposer.cs`, `Umbraco.Web.UI/Views/thiPage.cshtml`, `wwwroot/assets/js/contest/register.js`.
- Không sửa schema, migration, document type. **uSync nội dung không thay đổi** (xem dưới).

## Kiểm chứng

- `dotnet build src/ANTC.Portal.App/ANTC.Portal.App.slnx`: 0 lỗi (còn cảnh báo ImageSharp có sẵn).
- `.\run-local.ps1`, web lên (`uSync: Startup Complete`), trang 200.
- Đặt ngày qua Management API của backoffice (đăng nhập `admin@antc.local`, `PUT` + `publish` trên nút `thiPage`, cùng đường lưu như backoffice; tôi không thao tác bằng giao diện backoffice). `curl` trang rồi xem `data-contest-status`, có/không `#rgform`:
  - 01/10–31/12/2026 (hôm nay 17/10): `open`, có form, `#closedbox` ẩn.
  - 01/01–01/02/2027: `upcoming`, không form, `#closedbox` hiện.
  - 01/01–01/02/2026: `closed`, không form, `#closedbox` hiện.
  - Để trống cả hai ngày: `upcoming`.
  - Start 01/12 > end 01/10: `upcoming`, log `WRN Cai dat cuoc thi sai: contestStart … >= contestEnd …`.
  - 17/10 22:00 → 18/10 08:00 (giờ máy 22:12 SEAST): `open`; nếu hiểu nhầm là UTC thì sẽ ra `upcoming`, nên cho thấy phép đổi UTC+7 đúng. Chưa thử đúng biên `now == end`.
- Trình duyệt (Edge headless + CDP) ở 4 trạng thái: không lỗi console; bấm lối luyện tập tạo `at_practice` `{"mode":"practice"}` và hiện `#donebox`. Ở `open` với `?mock=ok`: trong lúc chờ `#modes` bị khóa, nút "Đang đăng ký…", sau đó "Đã đăng ký. Mã dự thi AD-…, lượt 1/2." Không lỗi console.
- Chưa chạy: `maxAttempts` = 0 hoặc âm trong backoffice (logic `NormalizeMaxAttempts` đơn giản nhưng chưa thử qua trang); thử `VALIDATION` với `fields` nhiều khóa sau khi sửa thứ tự (chỉ đọc lại mã); không chụp lại giao diện vì phần markup khi `open` không đổi.
- Đã dừng web (cổng 11000 trống) và Edge CDP.

## Ngày mẫu và uSync

Ngày mẫu làm file `uSync/v18/Content/cuộc-thi-trực-tuyến.config` thay đổi. Theo yêu cầu "nếu cuối cùng chỉ khác vì ngày mẫu thì trả về nguyên trạng": đã xóa ngày bằng Management API rồi `git checkout -- …/uSync`; `git status` không còn thay đổi nào trong `uSync`. Hệ quả: nội dung local trở lại `contestStart/End` trống, trang local hiện "chưa mở" (đúng QĐ-006) cho tới khi người chạy nhập ngày. T4/T5 cần nhập lại ngày trong backoffice để thử đăng ký thật. (Review T2 ghi chú 7 nói file này được commit; theo chỉ dẫn mới của anhnn tôi không giữ ngày mẫu.)

## Giả định

- Giờ Việt Nam cố định UTC+7 (không dùng `TimeZoneInfo`).
- Gộp `upcoming` và `closed` vào cùng một câu CXN-6 mặc định ở `#closedbox`, chưa tách câu.
- Tiêu đề tạm Worker tự đặt, chưa có trong CXN-6: "Chưa đăng ký được" (`#closedbox`) và "Đã vào cuộc thi" (`#donebox`); `#donebox` FE-26 sẽ thay.
- `GetStatus` ghi log cảnh báo mỗi lần gọi khi ngày sai (mỗi lượt tải trang); chấp nhận được, có thể giảm nếu ồn.
- `GetAsync()` duyệt cây qua `TryGetRootKeys` + `TryGetDescendantsKeysOfType`, lấy nút `thiPage` đầu tiên.

## Sai khác so với thiết kế

- Không có. `1-thiet-ke.md` T3 nói "view tính tạm, T4 chuyển sang dịch vụ"; theo ghi chú review, tôi làm dịch vụ ngay ở T3 nên T4 chỉ cần gọi lại.

## Còn tồn tại / rủi ro

- Mock vẫn bật mặc định (`MOCK_DEFAULT = true`): không merge hay triển khai nhánh trước T5 (ghi chú 13 của review T2).
- Chưa kiểm tra `GetAsync()` (đường API) vì chưa có controller; mới chạy `Read` + `GetStatus` qua trang. T4 sẽ chạy `GetAsync()` lần đầu.
- Chưa có test tự động cho `GetStatus` (repo chưa có project test); nếu muốn, cần xác nhận thêm project test.
- Tôi tạo phiên đăng nhập backoffice qua OAuth bằng script ở scratchpad (mật khẩu local mặc định); không đưa vào repo.

Bàn giao T3 sẵn sàng để Orchestrator review.


## 2026-10-17 · T4 (API-01 `POST /api/v1/contest/entries`) và sửa theo review T3

Chỉ làm T4 và 1 việc sửa của review T3. T5 chưa làm (mock vẫn bật mặc định).

## Đã làm

- **`ContestEntryService`** (`Umbraco.Plugin.Custom.Core/Contest/ContestEntryService.cs`, scoped, đăng ký ở `CustomCoreComposer.cs`):
  - Kiểm tra lại phía máy chủ: `mode` phải là `named`/`anon`; chế độ `named`: `trim` họ tên (2–100 ký tự), chuẩn hóa số như `phone.js` (bỏ ký tự không phải số, `84` + 11 số → `0`) rồi khớp `^0\d{9}$`, đơn vị ≤ 150 ký tự (trống → null), `consent === true`. Lỗi trả đủ `fields` (`fullName`, `phone`, `org`, `consent`), giá trị là chuỗi tiếng Việt, `message` = câu của trường đầu tiên theo thứ tự form. `mode` sai: `VALIDATION` chỉ có `message`.
  - Thứ tự: kiểm tra dữ liệu → `IContestSettings.GetAsync()` + `GetStatus` (một `DateTime.UtcNow` cho cả kiểm tra cửa sổ và `CreatedAt`/`ConsentAt`) → khóa ghi. Không có trang `thiPage` hoặc trạng thái khác `Open` → `CONTEST_CLOSED`.
  - Đếm lượt và ghi trong một transaction, bao bởi `SemaphoreSlim` tĩnh (một tiến trình). `settings.MaxAttempts` (đã chuẩn hóa) dùng cho đếm, câu `ATTEMPT_LIMIT` và trường `maxAttempts` của `201`. `attemptNo` = số lượt đã có của số đó (mọi trạng thái) + 1.
  - Mã `AD-` + 6 ký tự từ `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` bằng `RandomNumberGenerator.GetString`; kiểm tra trùng trong khóa ghi. Token 32 byte `Base64Url` (43 ký tự); CSDL chỉ lưu SHA-256 (hex thường) của chuỗi token. `IpHash` = SHA-256 hex của `muối|IP`; thiếu `Contest:IpHashSalt` thì ném lỗi (500) chứ không lưu băm không muối.
- **`ContestController`** (`Umbraco.Plugin.Custom.Api/Controllers/ContestController.cs`, route `api/v1/contest`, action `POST entries`, ghi `API-01` trong `<summary>`): `201` với `code, token, mode, attemptNo, maxAttempts, status`; lỗi `{error:{code,message,fields}}` (QĐ-004) với 400 / 403 / 409; `Cache-Control: no-store`. **Cố ý không dùng `[ApiController]`** để JSON sai cú pháp hoặc sai kiểu (ví dụ `"consent":"x"`) vẫn trả `VALIDATION` đúng dạng thay vì ProblemDetails (ghi chú 8 của review T2). Hệ quả: trình phân tích API versioning báo cảnh báo `AV0014` (không lỗi build).
- **`ContestSettingsService.GetAsync`** (ghi chú T4 số 1 của review T3): duyệt các khóa nút `thiPage`, lấy nút đầu tiên có trong cache đã xuất bản; không có thì `null` (→ `CONTEST_CLOSED`).
- **Khóa cấu hình** `Contest:IpHashSalt` (QĐ-005): thêm vào `appsettings.Local.template.json` (giá trị mẫu `muoi-mau-local-doi-khi-trien-khai`) và vào `appsettings.Local.json` trên máy này (file không commit). Môi trường triển khai phải đặt giá trị thật, nếu không API trả 500.
- **Việc sửa theo review T3**: `register.js` › `showRegistered` thêm `closedBox.hidden = true;`. Chưa kiểm bằng trình duyệt (xem "Chưa chạy").

File thay đổi: mới `Umbraco.Plugin.Custom.Core/Contest/ContestEntryService.cs`, `Umbraco.Plugin.Custom.Api/Controllers/ContestController.cs`; sửa `Contest/ContestSettingsService.cs`, `Composers/CustomCoreComposer.cs`, `appsettings.Local.template.json`, `wwwroot/assets/js/contest/register.js`. Không đổi schema, không migration, không đụng uSync.

## Kiểm chứng (đã chạy)

- `dotnet build src/ANTC.Portal.App/ANTC.Portal.App.slnx`: 0 lỗi (cảnh báo ImageSharp có sẵn, cộng `AV0014` nêu trên). `.\run-local.ps1`: web lên, trang 200.
- Ngày mẫu `contestStart` 2026-10-01, `contestEnd` 2026-12-31 nhập bằng cách sửa tạm file uSync nội dung rồi chạy lại web (không qua backoffice); trang báo `open`. Gọi bằng `curl`:
  - Cùng số viết `+84 912 345 678`, `0912.345.678`, `0912345678`: lần 1 → 201 `attemptNo` 1; lần 2 → 201 `attemptNo` 2; lần 3 → 409 `ATTEMPT_LIMIT`, câu "Số 0912345678 đã dùng hết 2 lượt thi. Mỗi số điện thoại chỉ được thi tối đa 2 lượt."
  - Song song: 10 yêu cầu cùng số `0987 654 321` (curl chạy nền, `wait`) → 2 × 201 (`attemptNo` 1 và 2), 8 × 409. Lặp lại với 30 yêu cầu cùng số `0911222333` → 2 × 201, 28 × 409. Lưu ý: curl khởi động lệch nhau vài mili giây nên mức chồng lấn thực tế chưa đo; khóa tĩnh là cơ chế bảo đảm, kết quả này là bằng chứng không vi phạm giới hạn trong hai lượt thử.
  - Ẩn danh `{"mode":"anon","phone":"0999999999","fullName":"khong luu"}` → 201; dòng trong CSDL không có họ tên, số điện thoại (các trường bị bỏ qua, không lưu).
  - `VALIDATION`: `fullName` toàn khoảng trắng + `phone` `091` + `consent` false → 400, `fields` đủ 3 khóa đúng câu; JSON sai cú pháp, `consent` sai kiểu, `mode` lạ → 400 dạng `{error:…}`, không phải ProblemDetails.
  - `CONTEST_CLOSED` (403): (a) ngày trống (`upcoming`); (b) ngày mẫu 2026-01-01 → 2026-02-01 (`closed`, trang báo `closed`). Chưa thử riêng "trước cửa sổ" có ngày đủ (đã thử ở T3 qua trang; cùng hàm `GetStatus`) và chưa thử đúng biên `now == contestEnd`.
- CSDL (`App_Data/app.sqlite.db`, đọc bằng script Python ở scratchpad): 8 dòng `entry`; chuỗi token gốc của 6 lượt đã ghi lại (các lượt của lần thử tuần tự, lần song song 10 yêu cầu và lượt UTF-8; 2 lượt của lần 30 yêu cầu không ghi token) không xuất hiện ở bất kỳ cột nào, `token_hash` khớp SHA-256 của token; `ip_hash` là 64 ký tự hex, không có `127.0.0.1` hay `::1`; mỗi số có đúng 2 lượt. Họ tên có dấu, `trim` đúng, lưu UTF-8 đúng (thử bằng `--data-binary @file`; thử đầu qua dòng lệnh Git Bash bị hỏng dấu do mã hóa của client, không phải của API).
- Nhật ký: tìm 6 chuỗi token đã ghi lại trong `umbraco/Logs/*` → không có.
- Không có project test, không có lint.

## Ngày mẫu và uSync

Ngày mẫu làm file `uSync/v18/Content/cuộc-thi-trực-tuyến.config` thay đổi (hai lần: 2026-10-01 → 2026-12-31, rồi 2026-01-01 → 2026-02-01 để thử `closed`). Cuối cùng đã `git checkout -- …/uSync`, chạy lại web để nạp lại nội dung (trang trở về `upcoming`, API trả 403) rồi dừng. `git status` không còn thay đổi nào trong `uSync`.

**Sửa câu ghi ở mục T3**: mục "Ngày mẫu và uSync" của T3 viết "theo chỉ dẫn mới của anhnn". Câu đó sai. Việc không commit ngày mẫu là chỉ dẫn của phiên điều phối, không phải của anhnn. Tôi giữ cách đó. Review T3 đã đưa việc này vào "Cần xác minh" để anhnn xác nhận; chưa có xác nhận.

## Giả định

- Chế độ `anon`: các trường cá nhân gửi kèm bị bỏ qua và không lưu, không trả lỗi (BE-22 ghi "không nhận thông tin cá nhân nào", không nói phải từ chối).
- `201` cho lượt ẩn danh trả `attemptNo` 1 để khớp dạng contract (`entry.attempt_no` trong CSDL vẫn rỗng cho ẩn danh, đúng sheet "CSDL"). FE-29 khi gắn thông tin sẽ tính lại `attemptNo` thật.
- Họ tên 1 ký tự → `VALIDATION` "Họ tên cần từ 2 đến 100 ký tự." (BE-22 nêu 2–100); phía trình duyệt T1 chưa chặn trường hợp này (chỉ chặn rỗng). Nên bổ sung ở FE khi tiện; không chặn T4.
- IP lấy từ `Connection.RemoteIpAddress`. Sau reverse proxy cần cấu hình `ForwardedHeaders` ở host, nếu không mọi yêu cầu có cùng một `ip_hash`. Chưa làm vì ngoài phạm vi T4 (cũng không dùng cho quyết định nào ở T4).
- Khóa ghi chỉ có tác dụng trong một tiến trình. Triển khai nhiều instance thì cần ràng buộc ở CSDL (ví dụ chỉ mục duy nhất `(phone, attempt_no)`); đổi schema nên cần hỏi trước, chưa làm.

## Sai khác so với thiết kế

- Không dùng `[ApiController]` (lý do ở trên). Chưa làm giới hạn tần suất (`RATE_LIMITED`, để BE-26 theo QĐ-002).

## Còn tồn tại / rủi ro

- **Chưa chạy**: `showRegistered` sau sửa chưa thử trong trình duyệt (trạng thái đóng + có `at_entry`); T5 sẽ chạy luồng đầu–cuối. Chưa thử `Contest:IpHashSalt` bị thiếu (kỳ vọng 500).
- Mock vẫn bật mặc định (`MOCK_DEFAULT = true`): không merge hay triển khai nhánh trước T5.
- CSDL local `app.sqlite.db` còn 8 dòng thử (các số 0912345678, 0987654321, 0911222333, 0933444555 đã hết lượt). Muốn thử lại thì chạy `.\run-local.ps1 -Reset` (xóa cả CSDL Umbraco) hoặc dùng số khác.
- Cảnh báo `AV0014` ở build.
- Đã dừng tiến trình web (cổng 11000 trống).

Bàn giao T4 sẵn sàng để Orchestrator review.


## 2026-10-17 · T5 (nối API thật, tắt mock mặc định) và việc sửa theo review T4

Làm theo `1-thiet-ke.md` T5, mục "Review T4" của `3-review.md`, và 3 điều anhnn vừa chốt (Orchestrator đang ghi vào `docs/quyet-dinh.md`; tôi chưa thấy số QĐ nên không dẫn số trong code).

## Đã làm

- **`contest-api.js`**: `MOCK_DEFAULT = false`. `?mock=` (kể cả `real`) chỉ có tác dụng khi `location.hostname` là `localhost` hoặc `127.0.0.1` (hàm `isLocalHost`); host khác bỏ qua tham số. Mock lượt ẩn danh trả `attemptNo: null`.
- **`register.js`**: không cần sửa. `showRegistered` đã chỉ in "lượt x/y" khi `attemptNo` có giá trị (`:87`); lượt ẩn danh dùng câu riêng.
- **`ContestEntryService`** (chốt 2 và 3):
  - Thiếu `Contest:IpHashSalt` → `HashIp` trả `null`, vẫn đăng ký, `ip_hash` null; không lưu băm không muối.
  - `attemptNo` của lượt ẩn danh trong `201` là `null` (`CreatedEntry.AttemptNo` đổi thành `int?`), khớp `entry.attempt_no`.
- **`Contest/ContestConfigCheck.cs`** (mới, `IHostedService`, đăng ký ở `CustomCoreComposer.cs`): ghi log cảnh báo lúc khởi động khi thiếu `Contest:IpHashSalt`, không chặn khởi động.
- **`ContestController.cs`**: khoanh `#pragma warning disable/restore AV0014` đúng quanh khai báo class, kèm comment lý do.
- **Ngày mẫu (chốt 1)**: nhập `contestStart` 2026-10-01 00:00, `contestEnd` 2026-12-31 23:59 bằng Management API (cùng đường backoffice lưu; script ở scratchpad, không vào repo). uSync tự xuất, **giữ nguyên thay đổi** ở `uSync/v18/Content/cuộc-thi-trực-tuyến.config` (chỉ hai giá trị `2026-10-01T00:00:00` và `2026-12-31T23:59:00`). Không `git checkout`.

File thay đổi trong lượt này: `contest-api.js`, `ContestEntryService.cs`, `ContestController.cs`, `CustomCoreComposer.cs`, mới `ContestConfigCheck.cs`, file nội dung uSync nói trên. Không đổi schema, không migration.

## Cảnh báo `AV0014` (nguyên văn)

`ContestController.cs(13,14): warning AV0014: Add [ApiController] to the controller or assembly (https://dotnet.github.io/aspnet-api-versioning/diagnostic/av0014.html)`. Đúng như dự đoán của review: bộ phân tích API versioning muốn controller có `[ApiController]`; ta cố ý không dùng (lý do ở comment đầu class). Đã khoanh bằng `#pragma` chỉ cho controller này; build lại không còn `AV0014`, 0 lỗi.

## Kiểm chứng (đã chạy)

Web `run-local.ps1`; trình duyệt là Edge headless điều khiển bằng CDP (script ở scratchpad), **không** dùng `?mock`, API thật; `console` không lỗi ở mọi kịch bản.

1. **Có tên, lượt 1 và 2** (số `+84 900 000 101`, rồi `0900.000.101`): "Đã đăng ký. Mã dự thi AD-…, lượt 1/2" và "lượt 2/2", `location.hash = #ngan-hang`. `at_entry` có `token` 43 ký tự, `maxAttempts` 2 khớp `data-max-attempts`.
2. **Lượt thứ 3** (`0900000101`): form hiện đúng "Số 0900000101 đã dùng hết 2 lượt thi. Mỗi số điện thoại chỉ được thi tối đa 2 lượt.", nút mở lại ("Đăng ký và bắt đầu làm bài ›"), không có `at_entry`.
3. **Ẩn danh**: "Đã đăng ký thi ẩn danh. Mã dự thi AD-…", `at_entry.attemptNo = null`, `mode = anon`.
4. **CSDL** (`App_Data/app.sqlite.db`, đọc chỉ-đọc): token gốc của 2 lượt đã thử không xuất hiện ở cột nào, `token_hash` khớp SHA-256; lượt ẩn danh `full_name`/`phone`/`consent_at`/`attempt_no` đều null; `ip_hash` 64 ký tự hex.
5. **Mock chỉ ở localhost**: `localhost:11000/…?mock=ok` → token `mock-…` (mock chạy). `[::1]:11000/…?mock=ok` (hostname không phải localhost/127.0.0.1) → token thật 43 ký tự, dòng mới trong CSDL (mock bị bỏ qua). Mặc định không `?mock` → API thật.
6. **Ngoài thời gian**:
   - Ngày 2027-01-01 → 2027-02-01: trang `data-contest-status="upcoming"`, không có form, hiện `#closedbox`; `POST` thẳng API → 403 `CONTEST_CLOSED` dạng `{error:{code,message,fields:{}}}`.
   - Ngày 2026-01-01 → 2026-02-01: `closed`, API 403.
   - Có `at_entry` + mở `…/cuoc-thi#ngan-hang` (tải trang mới, trạng thái đóng): chỉ hiện `#donebox`, `#closedbox` ẩn. (Lần thử đầu của tôi chỉ đổi hash trên trang đã tải nên không chạy lại script; đã thử lại bằng tải trang mới.)
   - Đã **đặt lại đúng ngày mẫu** 2026-10-01 00:00 / 2026-12-31 23:59; trang `open`, file uSync chỉ khác hai giá trị này.
7. **Thiếu muối (kịch bản mới)**: bỏ `Contest` khỏi `appsettings.Local.json`, chạy lại web: log `[WRN] Thieu cau hinh Contest:IpHashSalt: luot thi van dang ky duoc nhung ip_hash se de trong…` lúc khởi động. Đăng ký có tên (số `0900000202`) và ẩn danh đều thành công trên trình duyệt; hai dòng mới có `ip_hash` null. Đã khôi phục `appsettings.Local.json` như cũ (còn khóa muối mẫu).
8. Số điện thoại dùng đều chưa có trong CSDL local (`0900000101`, `0900000202`, `0900000303`); các số cũ của T4 không đụng tới. CSDL local còn thêm các dòng thử (id 9–14).

Đã dừng tiến trình web (cổng 11000 trống) và Edge headless.

## Chưa chạy / giới hạn

- **Giao dịch SQLite có phải `BEGIN IMMEDIATE`** (mục "Cần xác minh" của review T4): chưa xác minh, không đổi gì. Ghi chú T2 số 11 của tôi vẫn là giả định chưa kiểm.
- Đúng biên `now == contestEnd`, `maxAttempts` ≤ 0 qua trang: chưa thử.
- Giao diện không đổi nên không chụp lại ảnh so với `th-01`/`th-03`.
- Không có project test, không có lint.

## Sai khác so với thiết kế

- Không có. Hai thay đổi hành vi (thiếu muối vẫn đăng ký; `attemptNo` ẩn danh null) theo chốt của anhnn, khác bản T4 trước.

## Còn tồn tại / rủi ro

- Lượt đếm đồng thời chỉ bảo vệ trong một tiến trình (xem bàn giao T4); lượt ẩn danh gắn thông tin sau này (FE-29) phải dùng chung khóa `WriteLock` (ràng buộc từ review T4).
- API-01 chưa có giới hạn tần suất (BE-26); không mở trên môi trường thật trước đó.
- Triển khai thật phải đặt `Contest:IpHashSalt`, nếu không `ip_hash` null (đã có log cảnh báo khởi động).
- File nội dung uSync có ngày mẫu cần được commit cùng đợt này khi anhnn yêu cầu commit (tôi không commit).

Bàn giao T5 sẵn sàng để Orchestrator review.
