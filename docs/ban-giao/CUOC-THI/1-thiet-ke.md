# CUOC-THI · Thiết kế: luồng thi sau khi đăng ký

- Ngày: 2026-10-17 · Người viết: Orchestrator (`/feature-design`)
- Gồm: FE-28, FE-23, FE-26, FE-27, FE-29, BE-23, BE-24 · Nhánh mã công việc: `feature/cuoc-thi`
- Giao việc: `docs/ban-giao/CUOC-THI/0-giao-viec.md`

## Mục tiêu và phạm vi

**Mục tiêu**: thí sinh đăng ký ở `/tham-gia/cuoc-thi` xong thì vào danh sách chuyên đề, làm bài từng chuyên đề (đồng hồ đọc, mỗi đáp án lưu lên máy chủ, tải lại trang vẫn lấy lại tiến độ), xong chuyên đề, nộp bài và xem kết quả lượt thi.

**Trong phạm vi**

| Mã | Nội dung |
|---|---|
| BE-23 | Xác thực `X-Entry-Token`; API-02 lấy lại lượt; API-03 lưu đáp án (lần ghi đầu thắng) |
| BE-24 | API-04 gắn thông tin vào lượt ẩn danh; API-05 nộp bài (kèm thông tin, gia hạn nộp) |
| FE-28 | Mở rộng `contest-api.js` (4 hàm còn lại + mock), thêm `contest-store.js`, hàng đợi gửi lại, khôi phục tiến độ, chế độ luyện tập |
| FE-23 | Bộ thành phần trắc nghiệm dùng chung (đáp án, khối kết quả, tình huống, thanh tiến độ) |
| FE-26 | Màn Danh sách chuyên đề, Giới thiệu chuyên đề, cột bên |
| FE-27 | Màn Câu hỏi có đồng hồ đọc, màn Xong chuyên đề |
| FE-29 | Nộp bài, hộp thoại dự thưởng cho ẩn danh, hộp thoại "Dự thi có tên", màn Kết quả lượt thi |

**Không làm** (ghi để khỏi lan phạm vi)

- Giới hạn tần suất (120 lần/phút/token cho API-03, 20 lần/giờ/IP cho API-04, `RATE_LIMITED`): để **BE-26**, cùng với chuẩn lỗi chung và sửa `QuizController` (QĐ-002, QĐ-004). FE vẫn phải xử lý `429` (coi như lỗi tạm, gửi lại).
- Trang quản trị (BE-27), quay số, kiểm thử tự động (BE-33: thêm project test là quyết định kiến trúc, chưa duyệt).
- FE-24 (Thử sức) chưa làm, nhưng FE-23 phải viết để FE-24 dùng lại được.
- FE-31 (rà soát responsive/a11y/trình duyệt toàn bộ), FE-08 (hero dùng chung).
- Không đổi schema: các bảng `entry`, `entry_answer` đã đủ cột (`Data/Entities.cs:8-59`, `AppDbContext.cs:31-56`). Không cần migration.
- Không mở trên môi trường thật trước BE-26 (QĐ-012).

## Nguồn đã dùng

- `docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › "Công việc" r18 (FE-28), r19 (FE-23), r22 (FE-26), r23 (FE-27), r24 (FE-29), r52 (BE-23), r53 (BE-24); "API" r2, r5–r9, r11–r12, bảng mã lỗi r16–r28; "CSDL" r5–r26; "Nội dung Umbraco" r26–r34; "Câu hỏi mở" #1, #2, #4, #12, #17.
- `docs/ke-hoach/Mo-ta-cong-viec-FE-antoantaichinh-v3.docx` › 5. Công việc của FE2 › FE-28, FE-23, FE-26, FE-27, FE-29; 6. Hợp đồng API › API-01…05, Bảng mã lỗi; 7. Khác biệt so với bản dựng. Nội dung khớp sheet, không thấy mâu thuẫn giữa hai file.
- Bản dựng `docs/ban-dung/antoantaichinh-ban-dung-thu.html`: `INIT['thi']` dòng 1491–1676 (`vMenu` 1530, `vIntro` 1547, `vQ` 1556, `vDone` 1582, `vSide` 1591, `answer`/đồng hồ 1623–1635, `go` 1615); thành phần trắc nghiệm của Thử sức 1440–1488; template `tpl-thi` 1192, `t-reg` 1240.
- `docs/quyet-dinh.md` QĐ-001 → QĐ-012; `docs/ban-giao/FE-25/3-review.md` › "Chuyển cho việc sau".
- **Chưa xem**: các ảnh `th-04`…`th-09`, `th-11`, `mb-07` trong `docs/ke-hoach/anh/` và ảnh nhúng trong `.docx`. Orchestrator không cần cho phần contract; **Worker luồng FE phải xem trước khi dựng giao diện** và Orchestrator sẽ so ảnh khi review.

## Code hiện có (dùng lại, không viết lại)

| Thành phần | Bằng chứng | Ghi chú cho việc này |
|---|---|---|
| API-01, sinh mã, băm token | `ContestEntryService.cs:60-133`, `HashToken` `:195-196` | `/me` băm header theo đúng `HashToken` |
| Khóa ghi trong tiến trình | `ContestEntryService.cs:45` (`private static SemaphoreSlim WriteLock`) | API-03/04/05 phải dùng **cùng** khóa này (review FE-25 › chuyển cho FE-29) |
| Kiểm tra họ tên/số/đơn vị/đồng ý | `ContestEntryService.cs:136-173` (`Validate`, private, nhận `CreateEntryRequest`) | API-04 và `contact` của API-05 dùng lại, cùng câu thông báo |
| Lỗi `{ error: { code, message, fields } }` | `ContestController.cs:45-55` | Thêm các mã mới vào bảng HTTP; `fields` luôn là object |
| Cài đặt cuộc thi | `ContestSettings.cs:14`, `ContestSettingsService.cs:51-95` | Chưa đọc `submitGraceHours`; `GetStatus` dùng cho API-03/04 |
| Ngân hàng câu hỏi trong bộ nhớ | `QuestionBank.cs:42` (`AnswerKey` có `TopicId`, `Answer`, `Letters`), `:53` (`TotalQuestions`) | Chấm điểm và kiểm tra mã câu lấy từ đây, không truy vấn CSDL |
| Khóa chính `entry_answer (entry_id, question_code)` | `AppDbContext.cs:51` | Bảo đảm "lần ghi đầu thắng" ở mức CSDL |
| `contest-api.js` | `createEntry`, `readError`, `saveEntry`, `loadEntry`, `markPractice`, mock theo `?mock=` chỉ trên localhost | Mở rộng, giữ chữ ký và dạng `{ok, data \| error}` |
| `register.js` | `showRegistered` / `showPractice` hiện khối tạm `#donebox` (`register.js:82-98`) | FE-26 thay bằng màn Danh sách chuyên đề |
| `thiPage.cshtml` | `#cmain` có `data-contest-status`, `data-max-attempts` (`:40`); cột bên tạm `:135-144` | Thêm `data-read-timer-factor`; dựng lại cột bên |
| `readTimerFactor` | uSync `thipage.config:141-144` kiểu `Umbraco.TextBox`, nội dung `"1"` | Là chuỗi, phải tự đọc số (xem B/F bên dưới) |
| `submitGraceHours` | uSync `thipage.config:221-224` kiểu `Umbraco.Integer`, nội dung `24` | BE-24 đọc |

## Hành vi và acceptance criteria

Lấy từ cột "Tiêu chí nghiệm thu" của sheet "Công việc", bổ sung những chỗ tài liệu chưa nói (đánh dấu **[Đề xuất]**).

**FE-28 · lớp trạng thái và gọi API**

1. Mở trang có `at_entry` → gọi API-02, dựng lại tiến độ từ máy chủ; tải lại giữa chừng thì về đúng danh sách chuyên đề với tiến độ đã lưu.
2. API-02 trả `401 INVALID_TOKEN` → xóa `at_entry` và hàng đợi, về màn Đăng ký. Xóa localStorage → về màn Đăng ký, không lỗi console.
3. Một câu chỉ gửi một lần; `stored=false` thì hiển thị đáp án máy chủ đang giữ.
4. Ngắt mạng, trả lời 3 câu, bật mạng: cả 3 đáp án lên máy chủ, không trùng, không mất (hàng đợi lưu localStorage, gửi lại sau 2s, 5s, 15s rồi giữ 15s, và ngay khi có sự kiện `online`).
5. Chế độ luyện tập không phát sinh yêu cầu nào tới `/api/v1/contest`; tiến độ luyện tập ở `at_practice`, không lẫn với lượt thi.
6. **[Đề xuất]** Phân loại lỗi khi gửi đáp án: mạng, `5xx`, `429` → giữ trong hàng đợi; `401` → như mục 2; `409 ALREADY_SUBMITTED` → bỏ hàng đợi, sang màn kết quả; `403 CONTEST_CLOSED`, `400 UNKNOWN_QUESTION/INVALID_OPTION` → bỏ mục đó khỏi hàng đợi (gửi lại không bao giờ thành công), hiện thông báo phù hợp.
7. **[Đề xuất]** Mỗi mục hàng đợi ghi kèm mã dự thi; khi `at_entry` đổi sang lượt khác thì bỏ các mục của lượt cũ (không gửi đáp án lượt cũ bằng token lượt mới).

**FE-23 · thành phần trắc nghiệm**: giống `tt-01..03`, câu 4 đáp án và câu 2 đáp án Đúng–Sai hiển thị gọn, chuỗi có `< > & "` không vỡ giao diện, kết quả có `aria-live="polite"`, focus chuyển tới dòng "Đúng./Chưa đúng." sau khi chọn; < 480px nhãn "Đáp án phù hợp/Bạn chọn" xuống dòng.

**FE-26 · danh sách, giới thiệu, cột bên**: giống `th-04`, `th-05`, `th-09`, `th-11` (trừ câu chữ đã sửa và nút Nộp bài); không vào được chuyên đề 2–8 bằng URL `#chuyen-de-N` khi chưa xong Chuyên đề 1; tải lại giữ đúng trạng thái xong/khóa; hộp xanh "Đã đăng ký. Mã dự thi của bạn là AD-XXXXXX. Đây là lượt thứ n trên {maxAttempts}."; ≤ 900px cột bên xuống dưới.

**FE-27 · câu hỏi và xong chuyên đề**: làm trọn Chuyên đề 1: mỗi câu khóa đúng `sec × hệ số` giây, xong thì 7 chuyên đề mở; đáp án có trong `entry_answer` ngay sau khi chọn; hệ số 0 thì không chờ; trả lời lại khi "làm lại chuyên đề" không đổi điểm đã lưu; rời màn câu hỏi thì dừng đồng hồ; vào lại chuyên đề thì tiếp từ câu chưa trả lời đầu tiên; câu đã trả lời hiện sẵn trạng thái và nút đi tiếp mở ngay.

**FE-29 · nộp bài và kết quả**: thí sinh có tên nộp được với 1 lần xác nhận; ẩn danh không tick thì nộp ẩn danh, tick và nhập đúng thì lượt thành `named`, `eligibleForPrize = true`; sau khi nộp không trả lời thêm được; bấm nộp hai lần không tạo hai kết quả; mở lại trang sau khi nộp luôn hiện màn kết quả cho tới khi bắt đầu lượt mới; hộp thoại giữ focus, Esc đóng, trả focus về nút mở. Giao diện cần chủ quản duyệt (không có thiết kế gốc).

**BE-23**: gửi lại cùng câu với đáp án khác → CSDL giữ đáp án đầu, `stored=false`; 5 yêu cầu đồng thời cho một câu → đúng 1 dòng `entry_answer`; API-02 trả đúng số đáp án và không lộ số điện thoại đầy đủ.

**BE-24**: ẩn danh nộp kèm contact hợp lệ → `mode = named`, có `phone`, `eligibleForPrize = true`; contact là số đã hết lượt → `409 ATTEMPT_LIMIT`, lượt vẫn `in_progress`; `entry.score` = số dòng `is_correct = 1`; nộp 2 lần cho kết quả giống nhau, `submitted_at` không đổi.

## Trường hợp biên

| Tình huống | Xử lý |
|---|---|
| Thiếu/sai `X-Entry-Token` | `401 INVALID_TOKEN` ở mọi API `/me` |
| Hai tab cùng lượt trả lời cùng câu | Khóa chính + khóa ghi → lần đầu thắng; tab sau nhận `stored=false` và hiển thị đáp án đang lưu |
| Đáp án đến cùng lúc với lệnh nộp | Cùng khóa ghi → tuần tự; đáp án đến sau khi nộp nhận `409 ALREADY_SUBMITTED` |
| Cuộc thi đóng khi thí sinh đang làm | API-03 → `403 CONTEST_CLOSED`; FE thôi gửi, báo cuộc thi đã đóng nhận đáp án, vẫn cho nộp trong thời gian gia hạn (xem CXN-2) |
| Ngân hàng đổi giữa chừng (nhập ma trận) | Mã câu đã ngừng dùng → `400 UNKNOWN_QUESTION`; `total` lấy theo bản chụp hiện tại; FE tính "xong chuyên đề" theo số câu QUIZ-01 hiện tại (xem "Đối chiếu") |
| localStorage bị chặn (riêng tư) | Mọi thao tác bọc try/catch; vẫn làm được trong phiên nhưng tải lại thì mất token (đúng QĐ-007) |
| Trang ở trạng thái `upcoming`/`closed` nhưng có `at_entry` | Vẫn gọi API-02 và hiện danh sách/kết quả của lượt đó; không hiện form đăng ký |
| `readTimerFactor` rỗng, sai định dạng, âm | Coi là 1; nhận cả `0,5` và `0.5` |
| Câu không có `sec` hoặc `sec = 0` | Nút mở ngay |
| Responsive | 1440/1024/390: ≤ 900px cột bên xuống dưới; mobile nút đi tiếp rộng 100%, hộp thoại toàn chiều rộng, nút "Nộp bài" ở trên |

## Đối chiếu

| Điểm | Loại thông tin | Nguồn / bằng chứng | Ghi chú |
|---|---|---|---|
| Dạng request/response API-02…05 | Tài liệu ghi | sheet "API" r6–r9; docx › 6 | Chốt ở mục Contract; phần thêm đánh dấu |
| `attemptNo` ẩn danh là `null` ở API-02 | Đã xác nhận | QĐ-010 | |
| Lỗi đủ `code, message, fields` | Đã xác nhận | QĐ-004 | Áp cho mọi API `/me` |
| Cài đặt đọc từ `thiPage`, trạng thái theo `GetStatus` | Đã xác nhận | QĐ-003, QĐ-006 | `submitGraceHours` đọc cùng dịch vụ |
| API-02 không có số chuyên đề trong `answers` | Còn thiếu | sheet "API" r6 | FE cần đếm câu đã làm theo chuyên đề mà không tải cả 8 QUIZ-02 → **CXN-1** |
| API-03 ngoài giờ trả `403` nhưng API-05 được nộp trong thời gian gia hạn; API-04, API-05 không liệt kê `CONTEST_CLOSED` | Còn thiếu | "Công việc" r52, r53; "API" r8–r9 | **CXN-2** |
| Điều kiện nộp: FE "xong Chuyên đề 1", BE "≥ 1 đáp án" | Tài liệu ghi, đang là giả định | "Câu hỏi mở" #1 (Chưa chốt); "Công việc" r24, r53 | Hai điều kiện khác nhau có chủ ý (máy chủ không kiểm thứ tự chuyên đề, r52) → **CXN-3** |
| Đồng hồ đọc giữ, nhân hệ số | Tài liệu ghi, đang là giả định | "Câu hỏi mở" #2 (Chưa chốt) | Đã làm thành cấu hình, đổi không sửa mã; không chặn việc này |
| Số lượt tối đa | Tài liệu ghi, giả định | "Câu hỏi mở" #4 | Đọc `maxAttempts` từ API, không viết cứng "2" / "200" |
| Sau khi nộp được xem lại ở chế độ luyện tập | Tài liệu ghi, giả định | "Câu hỏi mở" #17; FE-29 | Làm theo giả định |
| `readTimerFactor` là Textstring, không phải Decimal | Code hiện có khác tài liệu | uSync `thipage.config:141-144` vs "Nội dung Umbraco" r33 | README đã ghi là kiểu nhập tạm; view tự đọc số, không đổi document type |
| "Xong chuyên đề" | Đề xuất của Claude | Bản dựng dùng cờ `qz_done_N` ở localStorage (`:1523`) | Nay tính từ máy chủ: số đáp án của chuyên đề ≥ `count` của QUIZ-01. Đánh đổi: câu đã ngừng dùng vẫn được đếm (hiếm) |
| "Làm lại chuyên đề N" trong lượt thi | Đề xuất của Claude | FE-27: "xem lại để học", "chỉ tính lần đầu"; FE-28: "chỉ gửi một lần" | Làm lại = đi lại các câu với đáp án đã lưu hiện sẵn, nút đi tiếp mở ngay, không gọi API-03. Ở chế độ luyện tập: làm lại từ đầu như bản dựng |
| Đồng hồ ở chế độ luyện tập | Đề xuất của Claude | Bản dựng áp đồng hồ cho mọi người (`:1628`) | Giữ như bản dựng |
| Nút lượt mới sau khi nộp | Đề xuất của Claude | FE-29 "nếu còn lượt, nút Thi lượt thứ 2" | Có tên: hiện khi `attemptNo < maxAttempts`, chữ "Thi lượt thứ {attemptNo+1}". Ẩn danh: API-01 không giới hạn lượt ẩn danh (`ContestEntryService.cs:95-106`), hiện "Thi lượt mới". Bấm thì về `#dang-ky`; `at_entry` chỉ bị thay khi đăng ký mới thành công |
| Kết quả lượt thi khi tải lại | Đề xuất của Claude | | FE dựng từ API-02 (`answers` + `cd`) và QUIZ-01; không gọi lại API-05 |
| Khóa ghi dùng chung | Đề xuất của Claude | Review FE-25 › chuyển cho FE-29 | Dời `WriteLock` thành `internal static` dùng chung cho API-01/03/04/05 |

## Phương án và khuyến nghị

**CXN-1 · FE biết câu đã làm thuộc chuyên đề nào** (chi tiết ở "Cần người dùng xác nhận")

| | A. Thêm `"cd"` vào từng phần tử `answers` của API-02 (**khuyến nghị**) | B. FE tải cả 8 QUIZ-02 khi mở trang |
|---|---|---|
| Contract | Thêm 1 trường, tương thích ngược | Giữ nguyên |
| Dữ liệu | Có sẵn ở `entry_answer.topic` | |
| FE | Đếm theo `cd`, chỉ tải QUIZ-02 khi mở chuyên đề (đúng FE-28) | 8 yêu cầu (~260 KB theo kích thước ngân hàng trong bản dựng) mỗi lần mở trang, trái FE-28 "QUIZ-02 khi mở chuyên đề N" |
| Công | ~0 | Thêm thời gian tải, nhất là 3G |

## Contract

Áp dụng chung cho API-02…05:

- Tiền tố `/api/v1/contest`. JSON UTF-8. Header `X-Entry-Token: <token 43 ký tự base64url nhận từ API-01>`.
- Xác thực: `HashToken(header)` rồi tra `entry.token_hash`. Thiếu header, rỗng hoặc không thấy → `401 INVALID_TOKEN`.
- Mọi phản hồi (thành công và lỗi) có `Cache-Control: no-store`.
- Lỗi: `{ "error": { "code": "...", "message": "...", "fields": { } } }`; `fields` luôn là object (rỗng khi không có), khóa theo tên trường gửi lên (QĐ-004).
- Thời điểm: chuỗi ISO 8601 UTC có `Z`, ví dụ `"2026-11-02T08:15:30Z"` (lưu ý: EF đọc SQLite ra `DateTimeKind.Unspecified`, phải đặt `Utc` trước khi trả).
- Mọi thao tác ghi (API-01, 03, 04, 05) chạy trong **cùng một khóa ghi** của tiến trình và trong một giao dịch.
- "Cuộc thi đang mở" = `IContestSettings.GetStatus(...) == Open` (QĐ-006). "Còn hạn nộp" = có `contestEnd` và `contestStart`, đã qua `contestStart`, và `now < contestEnd + submitGraceHours` (giờ VN như `GetStatus`; `submitGraceHours` rỗng hoặc âm → 24; `0` → không gia hạn). Không có trang `thiPage` → coi như đóng.
- Chưa có giới hạn tần suất (BE-26). FE vẫn xử lý `429` (đọc `Retry-After` nếu có).

### API-02 · `GET /api/v1/contest/entries/me` (BE-23)

```http
GET /api/v1/contest/entries/me
X-Entry-Token: 3q2-7w…
```

`200`, đang thi, có tên:

```json
{
  "code": "AD-7KQ2MX",
  "mode": "named",
  "fullName": "Nguyễn Văn An",
  "phoneMasked": "091****678",
  "org": "Trường THPT Thiên Lộc",
  "attemptNo": 1,
  "maxAttempts": 2,
  "status": "in_progress",
  "answered": 2,
  "score": null,
  "total": 200,
  "submittedAt": null,
  "answers": [
    { "q": "CĐ1-001", "a": "B", "correct": true, "cd": "1" },
    { "q": "CĐ1-002", "a": "A", "correct": false, "cd": "1" }
  ]
}
```

`200`, ẩn danh đã nộp: `"mode": "anon"`, `"fullName": null`, `"phoneMasked": null`, `"org": null`, `"attemptNo": null` (QĐ-010), `"status": "submitted"`, `"score": 17`, `"total": 200`, `"submittedAt": "2026-11-02T08:15:30Z"`.

- `phoneMasked`: 3 số đầu + `****` + 3 số cuối; `null` khi không có số.
- `org`: `null` khi trống.
- `maxAttempts`: cài đặt hiện tại.
- `answered`: số dòng `entry_answer` của lượt (đếm, không đọc cột `entry.answered`).
- `score`: `null` khi `in_progress`; `entry.score` khi `submitted`.
- `total`: `entry.total_questions` khi `submitted`; số câu đang dùng của ngân hàng (`IQuestionBank.Current.TotalQuestions`) khi `in_progress`.
- `answers`: mọi đáp án đã lưu, sắp theo `answered_at`; `cd` là số chuyên đề dạng chuỗi như QUIZ-01 (**thêm so với tài liệu, chờ CXN-1**).
- Gọi được ở mọi trạng thái cuộc thi (kể cả đã đóng).
- Lỗi: `401 INVALID_TOKEN`.

### API-03 · `POST /api/v1/contest/entries/me/answers` (BE-23)

```json
{ "q": "CĐ1-001", "a": "B" }
```

`200`, ghi lần đầu: `{ "q": "CĐ1-001", "a": "B", "correct": true, "stored": true }`

`200`, câu đã có đáp án (gửi `"a": "C"`): `{ "q": "CĐ1-001", "a": "B", "correct": true, "stored": false }`, với `a` và `correct` là của đáp án đang lưu.

Thứ tự kiểm tra (lỗi đầu tiên gặp được trả về):

| # | Điều kiện | Lỗi |
|---|---|---|
| 1 | Token | `401 INVALID_TOKEN` |
| 2 | Lượt đã nộp | `409 ALREADY_SUBMITTED` |
| 3 | Cuộc thi không ở trạng thái mở | `403 CONTEST_CLOSED` |
| 4 | Thân rỗng/JSON sai, thiếu `q`, hoặc `q` không có trong bản chụp ngân hàng | `400 UNKNOWN_QUESTION` |
| 5 | Thiếu `a` hoặc `a` không thuộc `AnswerKey.Letters` của câu | `400 INVALID_OPTION` |
| 6 | Câu đã có đáp án trong lượt | `200` với `stored: false` |

- Ghi `entry_answer` gồm `topic = AnswerKey.TopicId`, `chosen`, `is_correct = (a == AnswerKey.Answer)`, `answered_at` UTC. Không cập nhật `entry.answered` (chốt khi nộp).
- Đồng thời: trong khóa ghi kiểm tra rồi chèn; nếu vẫn gặp lỗi khóa chính (tiến trình khác) thì đọc lại dòng đang có và trả `stored: false`.
- So khớp chữ cái phân biệt hoa thường như dữ liệu (`"A"`…`"D"`); không tự đổi hoa thường.
- Máy chủ không kiểm thứ tự chuyên đề và đồng hồ đọc ("Công việc" r52).

### API-04 · `PUT /api/v1/contest/entries/me/contact` (BE-24)

```json
{ "fullName": "Nguyễn Văn An", "phone": "0912345678", "org": "", "consent": true }
```

`200`: `{ "mode": "named", "attemptNo": 1, "maxAttempts": 2 }`

| # | Điều kiện | Lỗi |
|---|---|---|
| 1 | Token | `401 INVALID_TOKEN` |
| 2 | Lượt đã nộp | `409 ALREADY_SUBMITTED` |
| 3 | Lượt đã `named` | `409 ALREADY_NAMED` |
| 4 | Cuộc thi không ở trạng thái mở | `403 CONTEST_CLOSED` (**thêm so với tài liệu, chờ CXN-2**) |
| 5 | Họ tên / số / đơn vị / đồng ý sai | `400 VALIDATION`, `fields` khóa `fullName`, `phone`, `org`, `consent`, cùng câu thông báo API-01 |
| 6 | Số đã dùng đủ `maxAttempts` lượt | `409 ATTEMPT_LIMIT`, câu như API-01 |

- Thành công: `mode = named`, ghi `full_name`, `phone` (chuẩn hóa), `org`, `consent_at = now`, `attempt_no = số lượt hiện có của số đó + 1`. Mã dự thi, token và bài làm giữ nguyên.
- Đếm lượt và ghi trong cùng khóa ghi với API-01 (hai đường ghi không được cùng vượt giới hạn).

### API-05 · `POST /api/v1/contest/entries/me/submit` (BE-24)

Không kèm thông tin: `{ }` (thân rỗng cũng nhận như `{ }`).
Ẩn danh muốn xét giải: `{ "contact": { "fullName": "Nguyễn Văn An", "phone": "0912345678", "org": "", "consent": true } }`

`200`:

```json
{
  "status": "submitted",
  "code": "AD-7KQ2MX",
  "mode": "named",
  "score": 173,
  "answered": 200,
  "total": 200,
  "eligibleForPrize": true,
  "submittedAt": "2026-11-02T08:15:30Z",
  "byTopic": [
    { "cd": "1", "correct": 17, "count": 19 },
    { "cd": "2", "correct": 20, "count": 25 }
  ]
}
```

| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | Token | `401 INVALID_TOKEN` |
| 2 | Lượt đã nộp | `200` trả lại kết quả đã lưu (`score`, `answered`, `total`, `submittedAt` từ CSDL), bỏ qua thân yêu cầu, không tính lại |
| 3 | Hết hạn nộp (xem "Còn hạn nộp") | `403 CONTEST_CLOSED` (**thêm so với tài liệu, chờ CXN-2**) |
| 4 | Lượt chưa có đáp án nào | `409 NOTHING_TO_SUBMIT` (**điều kiện chờ CXN-3**) |
| 5 | Có `contact` và lượt đang `anon`: contact sai | `400 VALIDATION` (`fields` khóa `fullName`, `phone`, `org`, `consent`), không nộp |
| 6 | Có `contact` và lượt đang `anon`: số đã hết lượt | `409 ATTEMPT_LIMIT`, không nộp, lượt vẫn `in_progress` |
| 7 | Còn lại | Gắn thông tin (nếu có, như API-04) và nộp trong **một** giao dịch |

- Có `contact` nhưng lượt đã `named`: bỏ qua `contact`, nộp bình thường.
- Khi nộp: `score` = số dòng `is_correct = 1`; `answered` = số dòng; `total_questions` = `TotalQuestions` của bản chụp; `status = submitted`; `submitted_at = now`.
- `eligibleForPrize` = lượt có `phone`.
- `byTopic`: mỗi chuyên đề đang dùng (theo QUIZ-01, thứ tự `cd`), `correct` = số dòng đúng có `topic` đó, `count` = số câu đang dùng của chuyên đề. Khi gọi lại sau khi đã nộp, `count` lấy theo ngân hàng hiện tại (có thể khác lúc nộp nếu ngân hàng đổi; chấp nhận).

### Phía FE: chữ ký `contest-api.js` (FE-28)

Mọi hàm trả `{ ok: true, data }` hoặc `{ ok: false, error: { code, message, fields } }`; lỗi mạng `code: 'NETWORK'`, `5xx` không có thân `code: 'SERVER'` (như `readError` hiện có). Hàm `/me` tự lấy token từ `at_entry`.

| Hàm | API |
|---|---|
| `createEntry(payload)` | API-01 (đã có) |
| `getMe()` | API-02 |
| `saveAnswer(q, a)` | API-03 |
| `attachContact(contact)` | API-04 |
| `submitEntry(contact?)` | API-05 |

Mock: chỉ trên localhost, theo `?mock=` như hiện có. Bản mock giữ "máy chủ giả" trong localStorage (khóa riêng, ví dụ `at_mock`) để tải lại trang vẫn thấy tiến độ, làm đúng lần ghi đầu thắng, chấm điểm theo `ans` của QUIZ-02, và có chế độ ép từng mã lỗi trong bảng trên (`network`, `server`, `closed`, `submitted`, `limit`, `token`, `nothing`, `named`…). `?mock=real` hoặc không có `mock` → API thật.

Khóa localStorage: `at_entry` (đã có), `at_practice` (đã có, mở rộng để giữ đáp án luyện tập), hàng đợi gửi lại (ví dụ `at_queue`, mỗi mục có mã dự thi).

## Task

Luồng chạy song song từ nhánh `feature/cuoc-thi`. Hai đợt: **đợt 1** làm bài và lưu đáp án; **đợt 2** gắn thông tin, nộp bài, kết quả. Mỗi luồng bàn giao vào `2-ban-giao-<luồng>.md` sau mỗi đợt; Orchestrator review từng đợt.

**Ranh giới file** (hai luồng không sửa cùng file):

- `CUOC-THI-be`: `src/ANTC.Portal.App/Umbraco.Plugin.Custom.Core/Contest/*` (`ContestEntryService.cs`, `ContestSettings.cs`, `ContestSettingsService.cs`, file mới trong thư mục này), `Umbraco.Plugin.Custom.Api/Controllers/ContestController.cs`, `Composers/CustomCoreComposer.cs`. Không sửa `Data/*`.
- `CUOC-THI-fe`: `Umbraco.Web.UI/Views/thiPage.cshtml`, `wwwroot/assets/css/contest.css`, `wwwroot/assets/css/quiz.css` (mới), `wwwroot/assets/css/tokens.css` (nếu cần thêm biến màu), `wwwroot/assets/js/contest/*`, `wwwroot/assets/js/quiz/*` (mới). Không sửa file C#.
- `readTimerFactor` đọc ngay trong `thiPage.cshtml` (luồng FE) để khỏi đụng `ContestSettings` của luồng BE.
- Không luồng nào sửa uSync, `README.md`, `docs/`.

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| C | Contract API-02…05 | Orchestrator | File này | CXN-1, 2, 3 | Không còn điểm chờ | Người dùng chốt | Chờ xác nhận |
| **B1** | BE-23a · Xác thực token + API-02 | be | `Contest/ContestAttemptService.cs` (mới, `IContestAttemptService`, đăng ký Scoped trong composer); `ContestController.cs` thêm action và mã lỗi | CXN-1 | Đúng contract API-02; `401` khi thiếu/sai token; `phoneMasked`; `attemptNo` null cho ẩn danh; `no-store` | `run-local`; tạo lượt có tên và ẩn danh bằng API-01; `Invoke-RestMethod` API-02 với token đúng, sai, thiếu; xem header | Chờ CXN-1 |
| **B2** | BE-23b · API-03 lưu đáp án | be | `ContestAttemptService.cs`; dời `WriteLock` của `ContestEntryService` thành `internal static` dùng chung | B1 | Đúng bảng kiểm tra API-03; lần ghi đầu thắng; `topic`, `is_correct` đúng | Gửi đúng/sai/lặp/mã lạ/chữ cái lạ; 5 yêu cầu đồng thời một câu (`curl.exe --parallel` hoặc `Start-Job`) → đếm `entry_answer` bằng Python `sqlite3` = 1; đổi `contestEnd` về quá khứ trong backoffice → `403` (nhớ trả lại) | Chờ B1 |
| **B3** | BE-24a · API-04 gắn thông tin | be | `ContestAttemptService.cs`; tách `Validate` của `ContestEntryService` thành hàm `internal static` nhận từng trường, dùng chung | B2, CXN-2 | Đúng bảng API-04; đếm lượt chung khóa với API-01 | Lượt ẩn danh → API-04 hợp lệ → API-02 thấy `named`, `attemptNo`; lặp lại → `409 ALREADY_NAMED`; số đã đủ 2 lượt → `409 ATTEMPT_LIMIT`; dữ liệu sai → `400` có `fields` | Chờ CXN-2 |
| **B4** | BE-24b · API-05 nộp bài | be | `ContestAttemptService.cs`; `ContestSettings.cs` + `ContestSettingsService.cs` thêm `SubmitGraceHours` (mặc định 24) và hàm "còn hạn nộp" | B3, CXN-2, CXN-3 | Đúng bảng API-05; một giao dịch khi kèm contact; nộp lại trả kết quả cũ | Nộp có tên; ẩn danh không kèm/kèm contact hợp lệ/kèm số hết lượt; lượt chưa có đáp án → `409`; nộp 2 lần so `submitted_at`; `entry.score` = `COUNT(is_correct=1)` bằng `sqlite3`; API-03 sau khi nộp → `409 ALREADY_SUBMITTED`; `contestEnd` quá khứ trong/ngoài gia hạn | Chờ CXN-2, CXN-3 |
| **F1** | FE-28 · `contest-api.js` + `contest-store.js` + mock + hàng đợi | fe | `js/contest/contest-api.js` (mở rộng, giữ chữ ký cũ), `js/contest/contest-store.js` (mới) | CXN-1 (API-02/03); CXN-2 cho phần mock API-04/05 | 5 hàm đúng chữ ký; mock giả lập máy chủ; hàng đợi theo mục 4, 6, 7 của FE-28; luyện tập không gọi `/api/v1/contest` | Trình duyệt localhost với `?mock=`: DevTools Network (không có yêu cầu ở chế độ luyện tập), Offline → trả lời 3 câu → Online → 3 yêu cầu, không trùng; xóa localStorage → về đăng ký, console sạch | Chờ CXN-1 |
| **F2** | FE-23 · thành phần trắc nghiệm dùng chung | fe | `js/quiz/quiz-ui.js` (hàm dựng HTML, thoát ký tự), `css/quiz.css`; class như bản dựng (`.qopt`, `.right`, `.wrong`, `.dim`, `.qexp`, `.qbar`, `.qdot`, `.qrow`, `.qnav`) | — | AC của FE-23; không `style="..."`, màu/cỡ chữ từ `tokens.css`, cỡ chữ `rem` | So ảnh `tt-01..03`; chèn chuỗi có `< > & "`; câu 2 đáp án; 390px | **Làm được ngay** |
| **F3** | FE-26 · danh sách, giới thiệu, cột bên; nối vào đăng ký | fe | `thiPage.cshtml` (vùng màn hình, cột bên), `js/contest/exam.js` (mới, điều phối màn theo hash `#ngan-hang`, `#chuyen-de-N`), `register.js` (thay `#donebox` bằng chuyển màn), `contest.css` | F1, F2 | AC của FE-26; trạng thái khóa/mở/xong tính theo CXN-1; trang `closed` mà có `at_entry` vẫn vào danh sách | So ảnh `th-04`, `th-05`, `th-09`, `th-11` ở 1440/1024/390; sửa URL `#chuyen-de-3` khi chưa xong CĐ1; tải lại | Chờ F1 |
| **F4** | FE-27 · câu hỏi, đồng hồ đọc, xong chuyên đề | fe | `js/contest/exam.js`, `thiPage.cshtml` thêm `data-read-timer-factor`, `contest.css` | F2, F3 | AC của FE-27; xử lý lỗi lưu theo FE-28 mục 6; "làm lại" theo đề xuất ở "Đối chiếu" | Mock: làm trọn CĐ1 (hệ số 1 xem số giây vài câu; hệ số 0 trong backoffice); tải lại giữa chuyên đề → tiếp từ câu chưa làm; so `th-06..08`, `mb-07` | Chờ F3 |
| **F5** | FE-29 · nộp bài, hộp thoại, kết quả | fe | `js/contest/submit.js` (mới), `thiPage.cshtml` (`<dialog>`), `contest.css`; dùng lại `phone.js` và câu thông báo của `register.js` (tách phần kiểm tra ra module dùng chung nếu cần) | F4, CXN-2, CXN-3 | AC của FE-29; đếm "x / {total}" từ API-02, không viết cứng 200 | Mock từng mã lỗi; bàn phím: Tab vòng trong hộp thoại, Esc, trả focus; 390px | Chờ CXN-2, CXN-3 |
| **I** | Tích hợp | chính | Merge `lane/CUOC-THI-be`, `lane/CUOC-THI-fe` vào `feature/cuoc-thi` (điều phối), Worker chạy trên nhánh chính | B1–B4, F1–F5 đạt review | Luồng đầu–cuối với API thật, không `?mock` | Kịch bản ở dưới | Chờ |

**Kịch bản tích hợp (I)**, chạy `.\run-local.ps1` trên `feature/cuoc-thi`, ghi kết quả từng bước:

1. Đăng ký có tên → danh sách, CĐ2–8 khóa → làm 3 câu CĐ1 → tải lại → còn 3 câu, vào CĐ1 tiếp từ câu 4.
2. Kiểm `entry_answer` có 3 dòng ngay sau khi chọn (Python `sqlite3` trên `App_Data/app.sqlite.db`).
3. Ngắt mạng (DevTools Offline) → trả lời 3 câu → bật mạng → đủ 3 dòng, không trùng.
4. Đặt `readTimerFactor = 0` trong backoffice → làm hết CĐ1 → 7 chuyên đề mở, nút Nộp bài hiện. (Đặt lại `1` sau khi xong; không commit file uSync nội dung nếu bị xuất ra.)
5. Nộp bài có tên → màn kết quả, `byTopic` đúng; tải lại → vẫn màn kết quả; thử trả lời → không được.
6. Đăng ký ẩn danh ở tab riêng tư → "Dự thi có tên để xét giải" với số mới → cột bên đổi; một lượt ẩn danh khác nộp kèm số đã đủ 2 lượt → thông báo `ATTEMPT_LIMIT`, hộp thoại còn mở, nộp ẩn danh được.
7. Hai tab cùng lượt trả lời cùng câu khác đáp án → một dòng, tab sau hiện đáp án của tab trước.
8. Chế độ luyện tập: không có yêu cầu `/api/v1/contest` trong Network.
9. 1440/1024/390 cho các màn mới.

## Cần người dùng xác nhận

**CXN-1 · API-02 thêm `cd` vào từng đáp án** (API contract; chặn B1, F1, F3)

- Nguồn: sheet "API" r6 / docx › 6 › API-02 chỉ có `{ q, a, correct }`. FE-26 cần biết chuyên đề nào đã xong, FE-28 quy định chỉ tải QUIZ-02 khi mở chuyên đề N.
- Code: `entry_answer.topic` đã có (`Entities.cs:53`); `AnswerKey.TopicId` có sẵn (`QuestionBank.cs:42`).
- Phương án A (**khuyến nghị**): thêm `"cd": "1"` (chuỗi như QUIZ-01). Tương thích ngược, không tốn công. B: FE tải cả 8 QUIZ-02 mỗi lần mở trang (xem bảng ở "Phương án").

**CXN-2 · Cửa sổ thời gian của API-03/04/05** (nghiệp vụ + contract; chặn B3, B4, F5, phần mock API-04/05 của F1)

- Nguồn: BE-23 (r52) "Ngoài thời gian cuộc thi: 403 CONTEST_CLOSED" cho API-03; BE-24 (r53) "Được nộp cả khi cuộc thi vừa đóng … trong vòng 24 giờ sau giờ đóng (cấu hình được)"; sheet "API" r8–r9 không liệt kê `CONTEST_CLOSED` cho API-04, API-05 và không nói khi quá hạn nộp thì trả gì.
- Code: `GetStatus` đã có (`ContestSettingsService.cs:82-95`); `submitGraceHours` có trong nội dung (24) nhưng chưa đọc.
- Khuyến nghị:
  - (a) API-03 nhận đáp án chỉ khi cuộc thi mở (đúng tài liệu). Sau giờ đóng thí sinh chỉ còn **nộp phần đã làm**.
  - (b) API-05 nhận tới `contestEnd + submitGraceHours`; quá hạn trả `403 CONTEST_CLOSED` (thêm mã này vào API-05). Lượt đã nộp vẫn trả kết quả cũ bất kể thời gian.
  - (c) API-04 chỉ khi cuộc thi mở, ngoài giờ trả `403 CONTEST_CLOSED` (thêm mã). Thí sinh ẩn danh muốn xét giải sau giờ đóng dùng `contact` của API-05 trong thời gian gia hạn.
- Ảnh hưởng nếu chọn khác: cho API-03 nhận đáp án cả trong thời gian gia hạn thì thực chất kéo dài cuộc thi thêm `submitGraceHours` cho người đã đăng ký; công tương đương.

**CXN-3 · Điều kiện nộp bài** (nghiệp vụ, "Câu hỏi mở" #1 vẫn "Chưa chốt"; chặn B4, F5)

- Nguồn: FE-29 nút chỉ hiện khi đã xong Chuyên đề 1; BE-24 chỉ chặn khi chưa có đáp án nào (`NOTHING_TO_SUBMIT`); BE-23 nói máy chủ không kiểm thứ tự chuyên đề. Câu chưa làm tính là chưa đúng.
- Khuyến nghị: làm đúng giả định của tài liệu (FE: xong CĐ1; BE: ≥ 1 đáp án; điểm = số câu đúng trên `total`) cho tới khi chủ quản trả lời. Nếu chủ quản chọn "phải đủ 200 câu": sửa điều kiện hiện nút (FE-29) và một kiểm tra ở BE-24, khoảng 0,25 ngày.

Các điểm còn lại trong file là chi tiết không đổi contract hay kiến trúc; đã ghi là **[Đề xuất]** hoặc "Đề xuất của Claude" ở "Đối chiếu". Người dùng muốn khác thì nói, không cần chốt trước khi làm.

**Vẫn mở với chủ quản, không chặn việc này**: "Câu hỏi mở" #2 (đồng hồ đọc, đã là cấu hình), #4 (số lượt, đã là cấu hình), #17 (xem lại sau khi nộp, làm theo giả định), câu hỏi OTP (QĐ-012).

## Trạng thái và việc tiếp theo

- **Làm được ngay**: F2 (FE-23), luồng `CUOC-THI-fe`.
- **Chốt CXN-1 xong**: mở luồng `CUOC-THI-be` (B1 → B2) và tiếp luồng fe (F1 → F3 → F4). Đó là đợt 1.
- **Chốt CXN-2, CXN-3 xong**: đợt 2 (B3 → B4; F5).
- Lệnh mở luồng (điều phối chạy): `antc-agent.ps1 -Role worker -Lane CUOC-THI-fe -Base feature/cuoc-thi -AllowCommit -Prompt "nhận việc CUOC-THI, luồng CUOC-THI-fe"`, tương tự cho `CUOC-THI-be`. Worker đọc file này, làm đúng các task của luồng mình theo thứ tự, bàn giao vào `docs/ban-giao/CUOC-THI/2-ban-giao-<luồng>.md` ở repo chính sau mỗi đợt.

---

## Cập nhật 2026-10-17 · Đã chốt CXN-1, CXN-2, CXN-3

Người viết: Orchestrator. Mục này **thay** các chỗ tương ứng ở trên (contract API-05, task B4, F5, mock của F1, kịch bản tích hợp bước 4–5, AC của FE-29 về nút Nộp bài). Chỗ nào ở trên còn ghi "chờ CXN-x" thì coi như đã chốt theo bảng dưới.

### Quyết định đã chốt

| CXN | Quyết định | Nhật ký |
|---|---|---|
| CXN-1 | API-02 thêm `"cd"` (chuỗi) vào từng phần tử `answers`, theo khuyến nghị (phương án A) | QĐ-013 |
| CXN-2 | Theo khuyến nghị: API-03 và API-04 chỉ nhận khi cuộc thi đang mở; API-05 nhận tới `contestEnd + submitGraceHours` (mặc định 24 giờ); quá hạn thì API-04, API-05 trả `403 CONTEST_CLOSED` | QĐ-014 |
| CXN-3 | **Phải trả lời đủ mọi câu** của ngân hàng đang dùng mới được nộp (trái khuyến nghị, khác giả định "Câu hỏi mở" #1). Máy chủ từ chối khi chưa đủ; nút Nộp bài chỉ hiện khi đã trả lời hết; tổng số câu lấy từ ngân hàng, không viết cứng 200 | QĐ-015 |

Các chú thích "**thêm so với tài liệu, chờ CXN-x**" trong Contract ở trên nay là đã chốt.

### Contract API-05 sau CXN-3 (thay bảng kiểm tra API-05 ở trên)

"**Đủ câu**" = mọi mã câu trong bản chụp ngân hàng hiện tại (`IQuestionBank.Current.Keys`, `QuestionBank.cs:52`) đều có dòng `entry_answer` của lượt. Cách tính: số mã `question_code` của lượt có trong `Keys` bằng `TotalQuestions` (`QuestionBank.cs:53`). Đáp án của câu đã ngừng dùng không được tính vào điều kiện này.

| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | Token | `401 INVALID_TOKEN` |
| 2 | Lượt đã nộp | `200` trả lại kết quả đã lưu, bỏ qua thân yêu cầu, không tính lại (giữ nguyên) |
| 3 | Hết hạn nộp | `403 CONTEST_CLOSED` (QĐ-014) |
| 4 | **Chưa đủ câu** (kể cả chưa có đáp án nào) | `409 INCOMPLETE_ANSWERS` |
| 5 | Có `contact`, lượt `anon`: contact sai | `400 VALIDATION` (giữ nguyên) |
| 6 | Có `contact`, lượt `anon`: số đã hết lượt | `409 ATTEMPT_LIMIT`, không nộp (giữ nguyên) |
| 7 | Còn lại | Gắn thông tin (nếu có) và nộp trong một giao dịch (giữ nguyên) |

Mẫu lỗi bước 4:

```json
{ "error": { "code": "INCOMPLETE_ANSWERS", "message": "Bạn mới trả lời 187/200 câu. Hãy trả lời hết các câu rồi nộp bài.", "fields": {} } }
```

- Số trong `message` lấy theo cách tính "đủ câu" ở trên và `TotalQuestions`, không viết cứng.
- `NOTHING_TO_SUBMIT` **không dùng nữa**: lượt chưa có đáp án nào cũng trả `INCOMPLETE_ANSWERS` (một mã cho một quy tắc; FE chỉ xử lý một trường hợp). Đây là đề xuất của Orchestrator cho phần chi tiết người dùng giao ("mã lỗi khi chưa đủ câu"); muốn giữ thêm `NOTHING_TO_SUBMIT` cho trường hợp 0 câu thì nói lúc review, công gần như không đổi.
- Kiểm tra "đủ câu" làm **trong** khóa ghi, cùng giao dịch với lúc nộp (đáp án cuối và lệnh nộp đến gần nhau thì tuần tự, như "Trường hợp biên").
- Thứ tự 3 trước 4: quá hạn thì báo đóng, không báo thiếu câu.
- Phản hồi `200` giữ nguyên; với quy tắc mới, lượt nộp lần đầu có `answered ≥ total`.
- Ngân hàng đổi giữa cuộc thi (nhập ma trận): lượt đang làm phải trả lời thêm các câu mới mới nộp được. Chấp nhận; FE đếm theo QUIZ-01 hiện tại nên thấy chuyên đề có câu mới là "chưa xong".

### Trạng thái task (thay cột "Trạng thái" ở bảng Task)

| # | Trạng thái | Ghi chú |
|---|---|---|
| C | **Xong** | QĐ-013, QĐ-014, QĐ-015 |
| B1 | **Làm được ngay** (luồng `CUOC-THI-be`) | Trả `cd` theo QĐ-013 |
| B2 | Chờ B1 | |
| B3 | Chờ B2 | Bảng lỗi API-04 có `403 CONTEST_CLOSED` (QĐ-014) |
| B4 | Chờ B3 | Theo phần "B4 sau CXN-3" dưới đây |
| F1 | **Làm được ngay** (luồng `CUOC-THI-fe`, sau F2) | Mock theo phần "F1 sau CXN-3" dưới đây |
| F2 | Đã bàn giao (`2-ban-giao-CUOC-THI-fe.md`), chờ review | Lượt này không review |
| F3 | Chờ F1 | |
| F4 | Chờ F3 | |
| F5 | Chờ F4 | Theo phần "F5 sau CXN-3" dưới đây |
| I | Chờ B1–B4, F1–F5 đạt review | Kịch bản bước 4–5 sửa ở dưới |

### B4 sau CXN-3 (BE-24b · API-05)

- **Phạm vi** (thêm): kiểm tra "đủ câu" trong `ContestAttemptService.cs`, đọc `Keys` của bản chụp; mã `INCOMPLETE_ANSWERS → 409` trong bảng HTTP của `ContestController.cs`. Bỏ `NOTHING_TO_SUBMIT`.
- **Tiêu chí hoàn thành** (thay):
  1. Đúng bảng API-05 sau CXN-3, đúng thứ tự kiểm tra.
  2. Lượt thiếu dù 1 câu → `409 INCOMPLETE_ANSWERS`, `message` có đúng số đã trả lời / tổng; lượt vẫn `in_progress`, `entry` không đổi.
  3. Lượt đủ câu → `200`; `entry.score` = `COUNT(is_correct = 1)`; `total_questions` = `TotalQuestions`.
  4. Tổng số câu không viết cứng (Grep `200` trong phần code mới không ra hằng số điều kiện).
  5. Các tiêu chí cũ giữ nguyên: một giao dịch khi kèm contact, nộp lại trả kết quả cũ, `submitGraceHours` mặc định 24.
- **Cách kiểm chứng** (thay): `run-local` trên worktree luồng be.
  1. Viết script PowerShell vào scratchpad (không commit): gọi QUIZ-01 `GET /api/v1/quiz/topics`, rồi QUIZ-02 `GET /api/v1/quiz/topics/{n}/questions` cho từng chuyên đề để lấy mọi mã câu và một chữ cái hợp lệ; gọi API-03 cho **tất cả trừ 1 câu**.
  2. API-05 → `409 INCOMPLETE_ANSWERS`, `message` "…{total-1}/{total}…"; kiểm `entry.status` vẫn `in_progress` bằng Python `sqlite3`.
  3. Lượt mới chưa trả lời câu nào → API-05 → `409 INCOMPLETE_ANSWERS` "0/{total}".
  4. Trả lời câu còn lại → API-05 → `200`; so `score` với `COUNT(is_correct=1)`; nộp lần 2 → cùng kết quả, `submitted_at` không đổi; API-03 sau khi nộp → `409 ALREADY_SUBMITTED`.
  5. Ẩn danh đủ câu: không kèm contact / kèm contact hợp lệ (`mode = named`, `eligibleForPrize = true`) / kèm số đã đủ 2 lượt (`409 ATTEMPT_LIMIT`, vẫn `in_progress`).
  6. Thời gian: đặt `contestEnd` về quá khứ trong backoffice, trong gia hạn → nộp được lượt đủ câu, lượt thiếu câu → `409 INCOMPLETE_ANSWERS`; ngoài gia hạn → `403 CONTEST_CLOSED` (cả lượt thiếu câu). Trả lại ngày như QĐ-008 sau khi thử, không commit file uSync nội dung.
  7. Ghi vào bàn giao: tổng số câu thực tế của ngân hàng local, lệnh đã chạy, kết quả.

### F1 sau CXN-3 (phần mock)

- Mock API-02 trả `cd` trong `answers` (QĐ-013).
- Mock API-05 làm đúng quy tắc "đủ câu": đếm đáp án trong "máy chủ giả" so với tổng `count` của QUIZ-01; thiếu thì trả `409 INCOMPLETE_ANSWERS` cùng dạng `message`.
- Chế độ ép lỗi: thay `nothing` bằng `incomplete`; có `closed` cho API-04/05 (QĐ-014).
- **Thêm** một chế độ nạp sẵn để thử F5 khỏi phải bấm hết ngân hàng, ví dụ `?mock=almost`: "máy chủ giả" có sẵn đáp án mọi câu trừ câu cuối của chuyên đề cuối (đáp án lấy từ QUIZ-02, đúng sai trộn). Tên chế độ do Worker chọn, ghi vào bàn giao.

### F5 sau CXN-3 (FE-29 · nộp bài, hộp thoại, kết quả)

- **Nút Nộp bài** (thay "hiện khi xong Chuyên đề 1"): chỉ hiện khi **mọi** chuyên đề trong QUIZ-01 đã xong (số đáp án có `cd` đó ≥ `count`), tức đã trả lời đủ `total` câu. Đáp án đang chờ trong hàng đợi cũng tính là đã trả lời.
- **Chưa đủ câu**: cột bên / danh sách hiện tiến độ "Đã trả lời x / {total} câu" và một dòng nhắc trả lời hết để nộp bài (câu chữ do Worker đề xuất, ghi vào bàn giao; giao diện cần chủ quản duyệt như FE-29). `total` lấy từ API-02 / QUIZ-01, không viết cứng 200.
- **Trước khi gọi API-05**: gửi hết hàng đợi; còn mục chưa gửi được thì không nộp, báo "đang lưu đáp án, thử lại sau" và giữ hộp thoại.
- **Nhận `409 INCOMPLETE_ANSWERS`** (ngân hàng đổi, hai tab, sai lệch đếm): gọi lại API-02, cập nhật tiến độ, ẩn nút Nộp bài, hiện `message` của máy chủ, đóng hộp thoại và trả focus về danh sách chuyên đề.
- **Nhận `403 CONTEST_CLOSED`** (API-04, API-05): báo cuộc thi đã hết hạn nộp, ẩn nút Nộp bài và "Dự thi có tên".
- **Cuộc thi đã đóng mà lượt chưa đủ câu** (API-03 trả `403`, theo QĐ-014 không trả lời thêm được): hiện thông báo lượt chưa trả lời đủ nên không nộp được; vẫn cho xem lại ở chế độ luyện tập nếu có (theo "Câu hỏi mở" #17).
- **Tiêu chí hoàn thành** (thay cột của F5): AC FE-29 trừ điều kiện nút (đã thay ở trên); thiếu 1 câu thì không thấy nút Nộp bài; đủ câu thì thấy; các xử lý `INCOMPLETE_ANSWERS`, `CONTEST_CLOSED`, hàng đợi như trên; không có số `200` viết cứng trong JS/view (Grep).
- **Cách kiểm chứng** (thay): localhost với chế độ mock nạp sẵn (`?mock=almost` hoặc tên Worker chọn): chưa thấy nút → trả lời câu cuối → nút hiện → nộp được; ép `incomplete`, `closed`, `limit`, `network` từng lần và ghi phản ứng giao diện; DevTools Offline khi bấm nộp với 1 đáp án còn trong hàng đợi → không gọi API-05; bàn phím (Tab vòng trong hộp thoại, Esc, trả focus); 390px.

### Kịch bản tích hợp (I): thay bước 4–5

4. Đặt `readTimerFactor = 0` → làm hết CĐ1 → 7 chuyên đề mở, **nút Nộp bài chưa hiện**, thấy "Đã trả lời x / {total}". Dùng script ở B4 (bước 1) với token của lượt (đọc `at_entry` trong DevTools) để trả lời mọi câu còn lại **trừ 1**; tải lại → tiến độ đúng, vẫn chưa có nút. Trả lời câu cuối trên giao diện → nút hiện. (Đặt lại hệ số `1` sau khi xong; không commit file uSync nội dung nếu bị xuất ra.)
5. Nộp bài có tên → màn kết quả, `byTopic` đúng, `answered = total`; tải lại → vẫn màn kết quả; thử trả lời → không được. Gọi API-05 bằng script cho một lượt khác còn thiếu câu → `409 INCOMPLETE_ANSWERS`.

Bước 6 (ẩn danh nộp kèm contact) cần lượt đủ câu: chuẩn bị bằng cùng script.

### Lưu ý cho người dùng (không chặn)

Kết hợp QĐ-014 và QĐ-015: từ `contestEnd` API-03 không nhận đáp án, nên lượt **chưa đủ câu lúc đóng thì không bao giờ nộp được**; thời gian gia hạn chỉ giúp lượt đã làm đủ mà chưa bấm nộp (hoặc đáp án còn kẹt trong hàng đợi lúc mất mạng thì cũng bị từ chối sau giờ đóng). Nếu muốn khác (ví dụ cho API-03 nhận cả trong thời gian gia hạn), cần một quyết định mới thay QĐ-014; chỉ đổi một điều kiện ở B2 và một thông báo ở F5, nên chưa cần chốt trước khi mở luồng. Nên báo chủ quản để đóng "Câu hỏi mở" #1 theo QĐ-015.

### Việc tiếp theo

- Điều phối mở luồng `CUOC-THI-be` (B1) và giao tiếp luồng `CUOC-THI-fe` (F1). Đợt 1: B1 → B2; F1 → F3 → F4. Đợt 2: B3 → B4; F5.
- Orchestrator review F2 khi được giao (`nhận việc CUOC-THI` ở bước review).

---

## Thiết kế lại theo cuộc thi theo thời gian (2026-10-18)

Người viết: Orchestrator (`/feature-design`). Mục này **thay** mô hình "một cuộc thi cấu hình ở `thiPage`" của các mục trên. Contract API-02…05, bảng task B1–B4/F1–F5 và kịch bản tích hợp ở trên vẫn là nền, trừ những chỗ mục này ghi là đổi. Chưa có task nào trong mục này được giao; **mọi task đều chờ CXN-A (cách hợp nhất)**.

Ký hiệu nguồn: `om:` = `origin/main` (`1de97372`, đọc bằng `git show origin/main:<đường dẫn>`, không checkout); `dev:` = nhánh `dev` (`72395f92`); đường dẫn code tính từ `src/ANTC.Portal.App/`. Orchestrator **không build, không chạy** code của nhánh nào; mọi nhận định về hành vi là đọc code.

### R0. Mục tiêu và phạm vi

- Mục tiêu: chuyển gói CUOC-THI sang mô hình nhiều cuộc thi theo thời gian (QĐ-018), mỗi cuộc có bộ đề chọn khi tạo (QĐ-019), số lượt riêng (QĐ-021); có nguồn dữ liệu lịch cuộc thi cho thanh thông báo, thẻ cuộc thi, trang Cuộc thi, nhãn lĩnh vực (QĐ-020); hợp nhất `dev` với `origin/main` (QĐ-017).
- Trong phạm vi: hợp nhất nhánh; schema gắn lượt với cuộc thi; API-01…05, QUIZ-01/02 theo cuộc thi; API lịch cuộc thi mới; bỏ cấu hình thời gian/lượt khỏi `thiPage`; luồng thi FE chọn cuộc thi và làm theo đề của cuộc; nối dữ liệu cho thanh thông báo và thẻ cuộc thi đã có trên `origin/main`.
- **Không làm** trong gói: giao diện FE-32/FE-33/FE-05/FE-12/FE-20 (của nhóm, chỉ cấp dữ liệu và sửa chỗ đọc dữ liệu); kết quả công bố, xếp giải, quay số theo cuộc thi (BE-27/BE-28, chỉ ghi đề xuất ở file 5); ô "Nhắc tôi khi có cuộc thi sau"; OTP (QĐ-012); đổi giao diện luồng thi sang hệ v2 (chờ FE-01); BE-26 giới hạn tần suất.

### R1. Mô hình cuộc thi trên `origin/main` (đọc code)

**Thực thể** (`om:Umbraco.Plugin.Custom.Core/Data/Entities.cs:162-199`, migration `om:…/Data/Migrations/20261016044750_AddContestCampaigns.cs`):

| Bảng | Cột | Ghi chú |
|---|---|---|
| `contest` (`ContestCampaign`) | `id`, `name` (≤ 200), `description` (≤ 2000, rỗng được), `start_at`, `end_at` (UTC), `max_attempts`, `is_active`, `created_at`, `updated_at` | Chỉ mục `(is_active, start_at, end_at)`. Không có cột gia hạn nộp, hệ số đồng hồ, lĩnh vực trọng tâm |
| `contest_topic` | khóa `(contest_id, topic_id)`, `sort_order` | FK `contest` xóa theo (Cascade), FK `quiz_topic` Restrict |
| `contest_question` | khóa `(contest_id, question_code)`, `sort_order` | FK `contest` Cascade, FK `quiz_question` Restrict |
| `entry` | **không có `contest_id`** (`om:…/Data/Entities.cs:8-34`) | Lượt thi chưa gắn với cuộc thi |
| `draw`, `draw_winner` | **không có `contest_id`** (`:62-88`) | Quay số trên mọi lượt đã nộp (`om:…/Contest/ContestAdminService.cs:149-150`) |

**Backoffice tạo cuộc thi và chọn đề**:
- API quản trị `om:Umbraco.Plugin.Custom.Api/Controllers/ContestAdminController.cs:11-12`: tiền tố `/api/v1/admin/contest`, chính sách `RequireAdminAccess`; `campaigns` (GET tìm/lọc, GET `{id}`, POST, PUT, DELETE), `campaigns/question-tree`, `entries` (xem lượt), `draws` (quay số). Giao diện `om:Umbraco.Web.UI/App_Plugins/ContestManagement/contest-management.js:6-7` gọi `/api/v1/admin/quiz` và `/api/v1/admin/contest`.
- Chọn đề: cây chuyên đề → câu (`ContestAdminService.cs:282-299`); lưu `Topics[{ TopicId, QuestionCodes[] }]` (`ContestAdminModels.cs:32-41`). Kiểm tra khi lưu (`ContestAdminService.cs:212-250`): tên 2–200 ký tự; có bắt đầu, kết thúc, kết thúc sau bắt đầu (`:220-223`); `MaxAttempts` 1–1.000 (`:224`); ít nhất một chuyên đề, không trùng, mỗi chuyên đề ít nhất một câu, câu không lặp, câu phải thuộc đúng chuyên đề (`:226-247`). Giờ không có múi giờ được hiểu là giờ Việt Nam rồi đổi sang UTC (`:325-330`).
- Sửa cuộc thi thay luôn bộ đề (`:74-83`, `:252-280`) và xóa cuộc thi (`:85-92`) **không kiểm tra đã có lượt thi** (lượt chưa gắn cuộc thi nên không có gì chặn).
- Quản trị câu hỏi: `om:…/Api/Controllers/QuizAdminController.cs:12-13` (`/api/v1/admin/quiz`, topics/questions CRUD); `QuizAdminService.cs:226` gọi `bank.Reload()`.

**"Cuộc thi hiện tại"**: `om:…/Contest/CurrentContestService.cs:19-33` lấy cuộc `IsActive` và `StartAt ≤ now ≤ EndAt`, chồng thời gian thì lấy cuộc bắt đầu muộn nhất; trả `QuestionCount`, tên các chuyên đề. Chỉ dùng ở hai view: thanh thông báo `om:…/Views/Partials/_ContestHeader.cshtml:13-28` (in "Cuộc thi tháng MM/yyyy" tính từ `StartAt`, liên kết `#cuoc-thi`) và khối tổng quan `om:…/Views/Partials/blockgrid/Components/competitionOverviewBlock.cshtml:10-53` (số câu, số chuyên đề, số lượt lấy từ cuộc hiện tại).

**API công khai danh sách cuộc thi**: **chưa có**. `git grep` trên `om:` chỉ thấy `ICurrentContestService` được tiêm vào hai view trên; các lời gọi API ở `wwwroot`/`App_Plugins` chỉ có `/api/v1/quiz/sample` và hai API quản trị.

**Giới hạn lượt theo cuộc thi**: **chưa có**. API-01 trên `om:` đếm mọi lượt của số điện thoại (`om:…/Contest/ContestEntryService.cs:64-65`) và lấy `MaxAttempts` từ `thiPage`, không từ `contest.max_attempts`.

**`thiPage` trên `om:`** là trang Block Grid ở `/cuoc-thi/`, chỉ còn thuộc tính `layout` (`om:…/uSync/v18/ContentTypes/thipage.config:7, 27-44`: "Cấu hình nghiệp vụ cuộc thi không đặt ở document này"); không còn `contestStart`, `contestEnd`, `maxAttempts`, `submitGraceHours`, `readTimerFactor`. Trong khi đó `om:…/Contest/UmbracoContestSettingsProvider.cs:22-33` vẫn đọc ba thuộc tính đầu từ `thiPage`. **Suy ra từ code (chưa chạy): API-01 trên `om:` luôn trả `403 CONTEST_CLOSED`** vì không còn ngày nào để đọc. `docs/noi-dung/bo-cuc-cuoc-thi.md` (trên `om:`) ghi các số 200/8/2 trên trang là nội dung hiển thị, và "khi có màn thi tháng" thì cập nhật liên kết thẻ dự thi: màn làm bài chưa có trên `om:`.

**API-01: `om:` so với `dev:`**

| Điểm | `om:` | `dev:` |
|---|---|---|
| Action | Chỉ API-01 (`om:…/Api/Controllers/ContestController.cs:18-59`) | API-01…05 (`dev:…/Api/Controllers/ContestController.cs:31, 53, 70, 88, 107`) |
| Request | `mode, fullName, phone, org, consent` (`om:…/Api/Models/ContestEntryModels.cs:5-10`); không có mã cuộc thi | Như `om:`; không có mã cuộc thi |
| Kiểm tra | Lớp `ContestEntryRequestValidator` riêng; ẩn danh gửi kèm họ tên/số/đơn vị/đồng ý → `400` (`om:…/Validation/ContestEntryRequestValidator.cs:30-40, 90-113`); câu thông báo chung | Kiểm tra trong `ContestEntryService.Validate`; ẩn danh bỏ qua các trường cá nhân, không lưu (`dev:…/Contest/ContestEntryService.cs:70-78`); câu thông báo theo bản dựng (`:148-173`) |
| Response 201 | `code, token, mode, attemptNo, maxAttempts, status` (`ContestEntryModels.cs:12-18`) | Cùng 6 trường (`dev:…/ContestEntryService.cs:15, 127`); `attemptNo` ẩn danh `null` ở cả hai (QĐ-010) |
| Lỗi | `400 VALIDATION` (message chung "Dữ liệu đăng ký không hợp lệ."), `403 CONTEST_CLOSED`, `409 ATTEMPT_LIMIT`; dạng `{ error: { code, message, fields } }` | Cùng mã, cùng dạng (QĐ-004); thêm `Cache-Control: no-store` (`dev:…/ContestController.cs:34`) |
| Trạng thái cuộc thi | `ContestSettings.IsOpenAt`: có cả hai ngày, `Start ≤ now ≤ End` (`om:…/Contest/ContestModels.cs:10-14`), đọc `thiPage` | `GetStatus` theo giờ VN, thiếu ngày → chưa mở (QĐ-006, `dev:…/ContestSettingsService.cs:88`), đọc `thiPage` |
| Đếm lượt | Theo số, trọn đời, trong `BEGIN IMMEDIATE` (`om:…/ContestEntryService.cs:55-72`) | Theo số, trọn đời, trong khóa ghi của tiến trình + giao dịch (`dev:…/ContestEntryService.cs:90-104`) |
| Muối băm IP | `ValidateOnStart`: thiếu `Contest:IpHashSalt` thì **không khởi động** (`om:…/Composers/CustomCoreComposer.cs:44-48`) | Thiếu muối vẫn chạy, `ip_hash` rỗng, cảnh báo lúc khởi động (QĐ-009; `dev:…/ContestEntryService.cs:202-206`, `ContestConfigCheck.cs:26`) |
| Băm token | SHA-256 hex chữ thường (`om:…/ContestEntryService.cs:134-135`) | Giống hệt (`dev:…/ContestEntryService.cs:199-200`); token hai bên tương thích |
| Kiểm thử | Project xUnit `Umbraco.Plugin.Custom.Tests` (có trong `ANTC.Portal.App.slnx`): `ContestEntryServiceTests` (đóng khi thiếu ngày; 10 yêu cầu đồng thời cùng số → đúng 2 lượt; token chỉ lưu băm), `ContestEntryRequestValidatorTests`, `CurrentContestServiceTests`, `ContestCampaignAdminServiceTests` (4 ca), và các test câu hỏi | Không có project test |

### R2. Đối chiếu với `dev`: giữ, đổi, trùng

Các file **cả hai nhánh cùng sửa** từ gốc chung `3c035da2` (`git diff --name-only` hai phía, giao nhau): `Api/Controllers/ContestController.cs` (cả hai thêm mới), `Core/Contest/ContestEntryService.cs` (cả hai thêm mới), `Core/Composers/CustomCoreComposer.cs`, `Web.UI/Views/thiPage.cshtml`, `wwwroot/assets/css/quiz.css` (cả hai thêm mới), `wwwroot/assets/css/tokens.css`, `uSync/v18/Content/cuộc-thi-trực-tuyến.config`; ngoài code còn `CLAUDE.md` (hai bên cùng sửa) và `docs/ban-dung/antoantaichinh-ban-dung-thu.html` (`dev` sửa sang v2, `om:` xóa và thêm `an-toan-tai-chinh-website.html`). Ngoài ra có **xung đột ngữ nghĩa** không hiện thành conflict: `om:` bỏ các thuộc tính của `thipage.config` mà `dev:…/ContestSettingsService.cs:56-79` và `dev:…/Views/thiPage.cshtml:4-17` đang đọc; `om:` đổi tên bản dựng (`docs/ban-dung/an-toan-tai-chinh-website.html`, xóa `antoantaichinh-ban-dung-thu.html`) mà `CLAUDE.md` và `docs/ke-hoach/anh-v2/cong-cu/` của `dev` còn trỏ tới tên cũ.

Ghi chú sửa báo cáo 4a/TRANG-THAI: `ContestSettings`, `ContestSettingsService`, `ContestConfigCheck` **không bị xóa** trên `om:`; chúng chỉ có ở `dev` (thêm sau gốc chung), `om:` có bản riêng `UmbracoContestSettingsProvider`.

| Thành phần `dev` | Kết luận | Lý do / nguồn |
|---|---|---|
| `ContestController` (API-01…05, bảng mã lỗi, `no-store`) | **Giữ**, đổi phần đọc cuộc thi | Đã review, đã nối FE; `om:` chỉ có API-01 |
| `ContestEntryService` (API-01) | **Giữ, sửa**: nhận `contestId`, đếm lượt theo cuộc, gắn `contest_id` | Theo QĐ-004/009/010 đã chốt; `om:` trái QĐ-009. Trùng việc với `om:…/ContestEntryService.cs` → bỏ bản `om:` khi hợp nhất (khuyến nghị CXN-A) |
| `IContestSettings`, `ContestSettings`, `ContestSettingsService` (đọc `thiPage`) | **Bỏ**, thay bằng dịch vụ đọc bảng `contest` | QĐ-018/021; `thiPage` trên `om:` không còn các thuộc tính |
| `ContestConfigCheck` | **Giữ** phần cảnh báo muối IP | QĐ-009 |
| `ContestAttemptService` API-02…05 | **Giữ, sửa**: cửa sổ thời gian, `maxAttempts`, đếm lượt, tổng câu, "đủ câu", `byTopic` theo cuộc của lượt | `dev:…/ContestAttemptService.cs:139-140, 157, 263-264, 313, 319-323, 337-338, 383` |
| `thiPage.cshtml` luồng thi (FE-25, F3, F4a) | **Giữ nội dung, dời chỗ** sang trang làm bài riêng (CXN-F) | `om:` dùng `thiPage` cho trang Cuộc thi v2 ở `/cuoc-thi/` |
| `contest-api.js`, `contest-store.js` (F1) | **Giữ, sửa**: `contestId`, `at_entry` theo cuộc, lịch cuộc thi, mock theo contract mới | `dev:…/js/contest/contest-api.js:11` |
| `exam.js` (F3, F4a) | **Giữ, sửa**: danh sách chuyên đề và số câu theo đề của cuộc; quy tắc "chuyên đề đầu" (Q2) | Đề cuộc thi có thể không có CĐ1 |
| F4b (`wip/CUOC-THI-F4b`, `8dce11fa`, chưa kiểm chứng) | Đọc `readTimerFactor` từ `thiPage` (`wip:…/Views/thiPage.cshtml:23`) → phải đổi nguồn. Giữ hay bỏ: Q6 | |
| `quiz-ui.js` + `quiz.css` của F2 | **Giữ**, đổi tên CSS để khỏi trùng `om:…/css/quiz.css` (Thử sức v2) | add/add cùng tên |
| uSync nội dung ngày mẫu (QĐ-008) | **Bỏ** (thuộc tính không còn); thay bằng cuộc thi mẫu trong CSDL (CXN-G) | |
| Phần của `om:` dùng lại | Bảng `contest*`, `ContestAdminService/Controller`, backoffice `ContestManagement`, `CurrentContestService` (thay bằng dịch vụ lịch), `QuizAdmin*`, project test | QĐ-019 |

### R3. Phương án hợp nhất (CXN-A, chưa chốt)

| | A. Merge `origin/main` vào `dev` (khuyến nghị) | B. Giữ `dev` làm nền, chép riêng phần cuộc thi của `om:` | C. Nhánh mới từ `origin/main`, chuyển code `dev` sang từng phần |
|---|---|---|---|
| Cách làm | Worktree luồng `CUOC-THI-hopnhat` từ `dev`, `git merge origin/main`, giải 7 file xung đột theo quy tắc ở task M1a, build, chạy `dotnet test`; điều phối đưa vào `dev` | Cherry-pick/chép tay migration `AddContestCampaigns`, entity, `ContestAdmin*`, `App_Plugins/ContestManagement`, test liên quan vào `dev`; chưa merge `om:` | Tạo nhánh từ `origin/main`, merge hoặc cherry-pick từng commit `dev` (F1–F4a, B1–B4) theo task |
| Lợi ích | Một lần giải xung đột, giữ lịch sử cả hai bên; về sau `dev` → `main` chỉ còn khác phần gói CUOC-THI; dùng được header/khối v2, quản trị câu hỏi, project test của nhóm | Ít xung đột ngay; không đụng 300+ file khác của `om:` | Nền sạch là bản của nhóm; mỗi task tự chịu phần chuyển |
| Đánh đổi | Một task lớn (≈ 1 ngày công), phải hiểu cả code `om:`; uSync `om:` đổi nhiều document type, lần đầu chạy local cần `-Reset` | `dev` càng xa `om:` (33 commit, 345 file); migration chép tay có thể lệch snapshot EF; lần merge sau vẫn phải giải các xung đột này cộng thêm phần trùng do chép | Lịch sử `dev` bị cắt; cherry-pick 20+ commit qua merge commit dễ sót; FE/BE của gói phải kiểm lại từ đầu |
| Công | ≈ 1–1,5 ngày công (M1a + M1b) | ≈ 0,75 ngày ngay, cộng ≈ 1,5 ngày khi hợp nhất thật về sau | ≈ 1,5–2 ngày công |
| Rủi ro xung đột | Vừa: 7 file code + 2 file tài liệu biết trước, 2 xung đột ngữ nghĩa (R2) | Thấp lúc đầu, **cao** về sau | Vừa, rải theo từng task |

Khuyến nghị **A**, kèm hai lựa chọn con: (A1) API-01 lấy bản `dev` (vì đã chốt QĐ-004/009/010 và dùng chung khóa ghi với API-03…05), chuyển các ca kiểm thử API-01 của `om:` sang bản `dev` thay vì bỏ; (A2) nhận project test của nhóm vào `dev` (CLAUDE.md ghi thêm project test là quyết định kiến trúc; nhóm đã thêm trên `om:`). Merge do Worker làm trong nhánh `lane/*` (QĐ-011), điều phối đưa vào `dev`; không push (QĐ-017).

### R4. Mô hình mục tiêu (đề xuất, chờ CXN-B…G)

- **Cuộc thi** = dòng `contest` (`om:`), thêm: `submit_grace_hours` (số nguyên 0–168, mặc định 24; thay `submitGraceHours` của `thiPage`, QĐ-014), `read_timer_factor` (số thực 0–5, mặc định 1; thay `readTimerFactor`), `focus_area` (chuỗi rỗng được: khóa lĩnh vực trang Thủ đoạn như `vieclam`, để FE-12 gắn nhãn). Sửa được trong backoffice cùng form.
- **Đề của cuộc thi** ("đề") = các dòng `contest_question` mà câu còn trong bản chụp ngân hàng (`IQuestionBank.Current.Keys`) và chuyên đề có trong `contest_topic`; thứ tự `contest_topic.sort_order` rồi `contest_question.sort_order`. Tổng số câu của cuộc = số câu của đề. Câu bị ngừng dùng sau khi tạo cuộc thì rời khỏi đề (như QĐ-015 với câu ngừng dùng).
- **Lượt thi** gắn cuộc thi: `entry.contest_id` (FK `contest`, `Restrict`, cho phép rỗng để migration không phải xóa lượt cũ ở CSDL local; mọi lượt mới bắt buộc có), chỉ mục `(contest_id, phone)`. Lượt không có cuộc thi: API-02 đọc được, API-03/04/05 trả `403 CONTEST_CLOSED`.
- **Trạng thái cuộc thi** (thay QĐ-006 cho từng cuộc): chỉ cuộc `is_active`; `upcoming` khi `now < start_at`; `ongoing` khi `start_at ≤ now < end_at`; `ended` khi `now ≥ end_at`. So sánh theo thời điểm UTC (giờ nhập trong backoffice là giờ Việt Nam, `ContestAdminService.cs:325-330`); chữ ngày hiển thị theo giờ Việt Nam. Hạn nộp = `end_at + submit_grace_hours` (QĐ-014 theo cuộc).
- **Lượt tối đa** = `contest.max_attempts`, đếm `entry` cùng `contest_id` và cùng `phone` (QĐ-021). Ẩn danh không đếm (giữ như cũ, chờ Q1).
- **Ràng buộc quản trị**: cuộc thi đã có lượt thì không xóa và không đổi bộ đề (`409 CONTEST_HAS_ENTRIES`); vẫn sửa được tên, mô tả, thời gian, số lượt, gia hạn, hệ số, lĩnh vực.
- **Một dịch vụ dùng chung** `IContestCatalog` (Core, Scoped): đọc cuộc thi theo id, lịch (`ongoing`/`upcoming`/`ended`), trạng thái, hạn nộp, đề. API-01…05, QUIZ-01/02, API-07 và các view Razor (thanh thông báo, khối tổng quan, trang làm bài) cùng dùng, để trang và API không lệch nhau. Thay `IContestSettings` (`dev`) và `ICurrentContestService` (`om:`).
- **`thiPage`**: không còn cấu hình nghiệp vụ (đúng bản `om:`). Luồng thi chuyển sang trang làm bài riêng (CXN-F).

### R5. Contract (đề xuất, chờ CXN-C, CXN-D, CXN-E)

Chung: như mục "Contract" ở trên (dạng lỗi QĐ-004, thời điểm ISO UTC có `Z`, `no-store` cho `/contest/entries*`). Mã lỗi mới: `404 CONTEST_NOT_FOUND` (không có hoặc `is_active = false`), `409 CONTEST_HAS_ENTRIES` (API quản trị).

**API-07 (mới) · `GET /api/v1/contests`** (BE-39 đề xuất): lịch cuộc thi công khai.

```json
{
  "serverTime": "2026-10-18T03:00:00Z",
  "ongoing": [
    {
      "id": 3,
      "name": "Việc làm, làm thêm",
      "description": "Nhận diện tin tuyển dụng việc nhẹ lương cao…",
      "startAt": "2026-09-30T17:00:00Z",
      "endAt": "2026-10-31T16:59:59Z",
      "submitUntil": "2026-11-01T16:59:59Z",
      "maxAttempts": 2,
      "questionCount": 200,
      "topics": [ { "cd": "5", "title": "Việc làm, tuyển dụng và nhiệm vụ trực tuyến", "count": 23 } ],
      "focusArea": "vieclam"
    }
  ],
  "upcoming": [],
  "ended": []
}
```

- Chỉ cuộc `is_active`. `ongoing` sắp `startAt` giảm dần (giữ quy tắc chọn của `CurrentContestService`: phần tử đầu là cuộc chính cho thanh thông báo); `upcoming` sắp `startAt` tăng dần; `ended` sắp `endAt` giảm dần, tối đa 12 cuộc.
- Không có cuộc nào: `200` với ba mảng rỗng. `focusArea` `null` khi trống. Không có `200`, `8`, `2` viết cứng: số lấy từ cuộc.
- `Cache-Control: public, max-age=60`. Không có lỗi nghiệp vụ (chỉ `5xx`).
- Cùng dữ liệu cấp cho Razor qua `IContestCatalog.GetScheduleAsync(now)` để thanh thông báo in sẵn vào HTML (FE-32: "máy chủ in sẵn chữ vào HTML").

**API-01 · `POST /api/v1/contest/entries`** (đổi): request thêm `"contestId": 3` (bắt buộc).

| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | Thiếu `contestId` hoặc không phải số nguyên dương | `400 VALIDATION`, `fields.contestId` |
| 2 | Dữ liệu cá nhân sai (chế độ có tên) | `400 VALIDATION` như cũ |
| 3 | Không có cuộc hoặc `is_active = false` | `404 CONTEST_NOT_FOUND` |
| 4 | Cuộc không ở `ongoing` | `403 CONTEST_CLOSED` |
| 5 | Số đã đủ `contest.max_attempts` lượt **trong cuộc này** | `409 ATTEMPT_LIMIT`, câu "Số … đã dùng hết {n} lượt của cuộc thi này." |
| 6 | Còn lại | `201` như cũ, thêm `"contestId": 3`; `maxAttempts` = của cuộc; `attemptNo` = số lượt của số trong cuộc + 1 |

Ẩn danh gửi kèm trường cá nhân: giữ cách của `dev` (bỏ qua, không lưu), không theo `om:` (`400`), để FE hiện có không vỡ (CXN-C).

**API-02 · `GET /api/v1/contest/entries/me`** (thêm trường, tương thích ngược):

```json
{
  "code": "AD-7KQ2MX", "mode": "named", "attemptNo": 1, "maxAttempts": 2,
  "status": "in_progress", "answered": 2, "score": null, "total": 200, "submittedAt": null,
  "contest": {
    "id": 3, "name": "Việc làm, làm thêm",
    "startAt": "2026-09-30T17:00:00Z", "endAt": "2026-10-31T16:59:59Z", "submitUntil": "2026-11-01T16:59:59Z",
    "phase": "open", "readTimerFactor": 1
  },
  "topics": [ { "cd": "5", "count": 23 }, { "cd": "1", "count": 19 } ],
  "answers": [ { "q": "CĐ5-001", "a": "B", "correct": true, "cd": "5" } ]
}
```

- `phase`: `open` (nhận API-03/04/05), `submit_only` (sau `endAt`, trước `submitUntil`: chỉ API-05), `closed`. Lượt không có cuộc: `contest: null`, `topics: []`, coi như `closed`.
- `topics`: đề của cuộc theo thứ tự đề; `total` (khi `in_progress`) = tổng `count`; khi `submitted` giữ `entry.total_questions`. `maxAttempts` = của cuộc.

**API-03**: bước 3 "cuộc thi không mở" xét `phase == open` của cuộc của lượt; bước 4 `400 UNKNOWN_QUESTION` khi `q` không thuộc **đề của cuộc**. Còn lại giữ.
**API-04**: cửa sổ theo cuộc của lượt; đếm lượt theo `(contest_id, phone)`.
**API-05**: hạn nộp = `submitUntil` của cuộc; "đủ câu" (QĐ-015) = mọi câu của đề có đáp án; `total_questions` = số câu của đề; `byTopic` theo `topics` của đề; đếm lượt khi kèm `contact` theo cuộc. Câu `INCOMPLETE_ANSWERS` giữ dạng "Bạn mới trả lời x/y câu…".

**QUIZ-01 / QUIZ-02** (thêm tham số, không đổi khi không có tham số):
- `GET /api/v1/quiz/topics?contest=3`: chỉ chuyên đề của đề, `count` = số câu của đề trong chuyên đề, thứ tự đề.
- `GET /api/v1/quiz/topics/{n}/questions?contest=3`: chỉ câu của đề trong chuyên đề `n`, thứ tự đề; vẫn trả `ans`, `exp` (QĐ-016).
- Cuộc không có hoặc không `is_active`: `404 CONTEST_NOT_FOUND`; cuộc `upcoming`: `403 CONTEST_CLOSED` (không lộ đề trước giờ mở); chuyên đề không thuộc đề: `404 UNKNOWN_TOPIC`.
- ETag: `"{bankVersion}-c{contestId}-{contest.updated_at ticks}"`.

### R6. Task

Ranh giới file (hai luồng không sửa cùng file):
- **chính** (M1a, M1b, S1, I2): mọi file khi merge; `Views/Partials/_ContestHeader.cshtml`, `Views/Partials/blockgrid/Components/competitionOverviewBlock.cshtml`; uSync document type/template của trang làm bài.
- **`CUOC-THI-be`**: `Umbraco.Plugin.Custom.Core/Contest/*`, `Core/Data/*` (entity, `AppDbContext`, migration, `AppDbInitializer`), `Core/Quiz/*`, `Core/Composers/CustomCoreComposer.cs`, `Api/Controllers/ContestController.cs`, `QuizController.cs`, `ContestAdminController.cs`, `ContestsController.cs` (mới), `App_Plugins/ContestManagement/*`, `Umbraco.Plugin.Custom.Tests/*`.
- **`CUOC-THI-fe`**: view trang làm bài và `Views/Partials/contest/*` (sau M1b), `wwwroot/assets/js/contest/*`, `js/quiz/*`, `css/contest.css`, `css/contest-quiz.css`. Không sửa C#.
- Mọi task: không sửa `docs/ke-hoach`, `docs/quyet-dinh.md`.

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| **C2** | Contract R5 | Orchestrator | File này | CXN-C, D, E | Không còn điểm chờ | Người dùng chốt | Xong (QĐ-024: contract R5 chốt theo khuyến nghị) |
| **M1a** (MỚI) | Hợp nhất `origin/main` vào `dev` (phương án A) | chính (worktree `CUOC-THI-hopnhat` từ `dev`, `-AllowCommit`) | 7 file xung đột theo quy tắc: `ContestController.cs`, `ContestEntryService.cs` → bản `dev`; xóa `om:` `UmbracoContestSettingsProvider.cs`, các kiểu API-01 trong `ContestModels.cs`, `Api/Models/ContestEntryModels.cs`, `Validation/ContestEntryRequestValidator.cs`; **chuyển** `ContestEntryServiceTests.cs`, `ContestEntryRequestValidatorTests.cs` sang API-01 của `dev` (giữ đủ ca, không xóa ca); `CustomCoreComposer.cs` = hợp hai bên, **bỏ** `ValidateOnStart` muối IP (QĐ-009), giữ tạm `IContestSettings`; `thiPage.cshtml` → bản `om:`, nội dung luồng thi của `dev` chuyển nguyên vào `Views/Partials/contest/_LuongThi.cshtml` (chưa gắn trang); `quiz.css` → bản `om:`, `quiz.css` của `dev` đổi tên `contest-quiz.css` và sửa chỗ nạp; `tokens.css` → bản `om:` cộng biến `dev` còn thiếu; uSync nội dung `cuộc-thi-trực-tuyến.config` → bản `om:`; bản dựng: so `dev:docs/ban-dung/antoantaichinh-ban-dung-thu.html` với `om:docs/ban-dung/an-toan-tai-chinh-website.html` (`cmp`/SHA-256), giống nhau thì nhận tên của `om:`, khác thì giữ cả hai và ghi khác biệt vào bàn giao; `CLAUDE.md`: giữ bản `dev`, chèn các đoạn mới của `om:`, liệt kê từng đoạn trong bàn giao để anhnn duyệt; chỗ nào trong `docs/ke-hoach/anh-v2/cong-cu` hay `CLAUDE.md` còn trỏ tên bản dựng cũ thì **ghi vào bàn giao, không sửa** | CXN-A | Merge commit trên `lane/CUOC-THI-hopnhat`; `dotnet build` slnx sạch; `dotnet test` đạt; web chạy với CSDL mới; `/cuoc-thi/` 200; API quản trị cuộc thi tạo được một cuộc | `.\run-local.ps1 -Reset`; `dotnet test src/ANTC.Portal.App/ANTC.Portal.App.slnx`; vào backoffice tạo cuộc thi; `Invoke-RestMethod` API-01 (dự kiến `403`, ghi vào bàn giao vì `thiPage` không còn ngày); `git diff dev...HEAD --stat` ghi vào bàn giao | Làm được (CXN-A đã chốt, QĐ-022) |
| **M1b** (MỚI) | Trang làm bài riêng | chính | Document type + template mới theo CXN-F (đề xuất `cuocThiLamBaiPage`, con của `thiPage`, `/cuoc-thi/lam-bai/`), tạo trong backoffice, commit file uSync; template render `_LuongThi.cshtml`; liên kết thẻ dự thi của khối tổng quan trỏ tới trang này (nội dung) | M1a, CXN-F | Trang mở được, luồng thi cũ hiển thị như trước (API-01 còn đóng là đúng ở bước này) | `run-local`; mở trang 1440/390; kiểm file uSync mới | Làm được |
| **B5** (MỚI) | Schema: lượt gắn cuộc thi, cột cấu hình | be | `Entities.cs`, `AppDbContext.cs`, migration `AddEntryContestAndContestSettings` (`entry.contest_id` + chỉ mục; `contest.submit_grace_hours`, `read_timer_factor`, `focus_area`) | M1a, CXN-B | Migration áp dụng được trên CSDL đã có lượt (cột rỗng) và CSDL mới; snapshot khớp | `dotnet ef migrations add …` theo `CLAUDE.md`; `run-local` trên CSDL cũ và `-Reset`; `PRAGMA table_info(entry)`, `PRAGMA index_list(entry)` bằng Python `sqlite3` | Làm được |
| **B6** (MỚI) | `IContestCatalog`: lịch, trạng thái, hạn nộp, đề | be | `Contest/ContestCatalog.cs` (mới), đăng ký trong composer; `CurrentContestService` gọi qua catalog (giữ interface cho hai view tới S1) | B5 | Đúng R4 (trạng thái, hạn nộp, đề loại câu ngừng dùng); không viết cứng chu kỳ tháng | Thêm test vào project test: biên `start_at`/`end_at`, gia hạn 0/24, cuộc không `is_active`, câu ngừng dùng rời đề, nhiều cuộc cùng `ongoing`; `dotnet test` | Chờ B5 |
| **B7** (SỬA B-API-01) | API-01 theo cuộc thi | be | `ContestEntryService.cs`, `ContestController.cs` (mã `CONTEST_NOT_FOUND → 404`) | B6, CXN-C | Bảng API-01 ở R5; đếm lượt theo `(contest_id, phone)`; ca đồng thời vẫn đúng 2 lượt mỗi cuộc | Test đồng thời của `om:` sửa theo cuộc + ca "hai cuộc khác nhau, cùng số, mỗi cuộc 2 lượt"; `Invoke-RestMethod` từng hàng của bảng | Chờ B6 |
| **B8a** (SỬA B1, B2) | API-02, API-03 theo cuộc của lượt | be | `ContestAttemptService.cs` | B7 | `contest`, `topics`, `phase`, `total` theo đề; API-03 từ chối câu ngoài đề, đóng theo `phase` | Lượt cuộc A gửi câu không thuộc đề A → `400 UNKNOWN_QUESTION`; đặt `end_at` cuộc về quá khứ trong backoffice → `403`; lượt cũ không cuộc → API-02 `contest: null`, API-03 `403` | Chờ B7 |
| **B8b** (SỬA B3, B4) | API-04, API-05 theo cuộc của lượt | be | `ContestAttemptService.cs` | B8a | Hạn nộp theo `submit_grace_hours` của cuộc; "đủ câu" theo đề (QĐ-015 theo QĐ-019); `byTopic` theo đề; đếm lượt theo cuộc | Script B4 (ở trên) đổi sang `?contest=`: trả lời đủ trừ 1 câu → `409 INCOMPLETE_ANSWERS "x/y"` với y = số câu đề; đủ → `200`, `total_questions` = y; gia hạn 0 và 24 | Chờ B8a |
| **B9** (MỚI) | QUIZ-01/02 lọc theo cuộc thi | be | `QuizController.cs` | B6, CXN-D | Đúng R5; không tham số thì như cũ (luyện tập, Thử sức không đổi) | So `count` QUIZ-01 `?contest=` với số dòng `contest_question` của cuộc bằng `sqlite3`; ETag đổi khi sửa cuộc; cuộc `upcoming` → `403` | Chờ B6 |
| **B10** (MỚI, BE-39) | API-07 lịch cuộc thi | be | `Api/Controllers/ContestsController.cs` (mới) | B6, CXN-E | Đúng R5; 0, 1, nhiều cuộc `ongoing`; chỉ `is_active`; `Cache-Control` | Tạo 4 cuộc trong backoffice (đã qua, đang, đang chồng, sắp tới) và 1 cuộc tắt; `Invoke-RestMethod`; tắt hết → ba mảng rỗng | Chờ B6 |
| **B11** (MỚI) | Quản trị: cột mới và ràng buộc khi đã có lượt | be | `ContestAdminModels.cs`, `ContestAdminService.cs`, `ContestAdminController.cs`, `App_Plugins/ContestManagement/contest-management.js` | B5, CXN-B | Form có gia hạn, hệ số, lĩnh vực; xóa/đổi bộ đề cuộc đã có lượt → `409 CONTEST_HAS_ENTRIES` | Test trong `ContestCampaignAdminServiceTests`; thao tác trong backoffice | Chờ B5 |
| **B12** (MỚI) | Bỏ `IContestSettings` và cấu hình `thiPage` | be | Xóa `ContestSettings.cs`, `ContestSettingsService.cs`, đăng ký trong composer; `ContestConfigCheck` chỉ giữ cảnh báo muối | B8b, B9 | Grep `contestStart\|maxAttempts\|submitGraceHours\|readTimerFactor` trong C# không còn đọc từ Umbraco | `dotnet build`, `dotnet test`; Grep | Chờ B8b |
| **B13** (MỚI) | Cuộc thi mẫu khi chạy local | be | `AppDbInitializer` (chỉ `Development`, khi bảng `contest` trống): một cuộc gồm mọi câu đang dùng, 2026-10-01 → 2026-12-31 giờ VN | B5, CXN-G | `-Reset` xong là có cuộc đang diễn ra; môi trường khác không tạo | `run-local -Reset`; đổi `ASPNETCORE_ENVIRONMENT` khác `Development` → không có dòng | Chờ B5 |
| **F6** (SỬA F1) | `contest-api.js`/`contest-store.js` theo cuộc | fe | `js/contest/contest-api.js`, `contest-store.js` | M1a, C2 | `createEntry` gửi `contestId`; `getSchedule()` (API-07); `at_entry` lưu theo `contestId` (lượt cuộc khác không ghi đè); QUIZ gọi kèm `?contest=`; mock trả đúng R5 (nhiều cuộc, `phase`, `topics`) | Localhost `?mock=`: hai cuộc, đăng ký cả hai, tải lại thấy đúng tiến độ từng cuộc; ép `closed`, `notfound` | Làm được |
| **F7** (MỚI) | Trang làm bài: chọn cuộc thi | fe | `Views/Partials/contest/_LuongThi.cshtml`, `register.js`, `contest.css` | M1b, F6 | `?c=<id>` có hiệu lực; không có `?c`: 1 cuộc `ongoing` → dùng luôn, nhiều cuộc → danh sách chọn, không cuộc → "Hiện chưa có cuộc thi đang diễn ra" + cuộc sắp tới + Thử sức; chữ "tối đa n lượt", tên, ngày lấy từ cuộc, không viết cứng | Mock 0/1/2 cuộc; 1440/744/390 | Chờ M1b, F6 |
| **F8** (SỬA F3, F4a; gồm F4b nếu giữ) | Luồng làm bài theo đề của cuộc | fe | `exam.js`, `_LuongThi.cshtml` | F7, Q2, Q6 | Danh sách chuyên đề, số câu, tiến độ theo `topics` của API-02; khóa chuyên đề theo Q2 (tạm: chuyên đề đầu tiên của đề); hệ số đồng hồ từ `contest.readTimerFactor`; `phase` khác `open` thì không cho trả lời | Mock đề không có CĐ1; đề 2 chuyên đề; `phase=submit_only` | Chờ F7 |
| **F9** (SỬA F5) | Nộp bài, kết quả theo cuộc | fe | `submit.js` (mới), `_LuongThi.cshtml`, `contest.css` | F8 | Như "F5 sau CXN-3", tổng câu = `total` của API-02 theo đề; kết quả ghi tên cuộc thi; `submit_only` vẫn nộp được | Như F5 ở trên với mock đề nhỏ | Chờ F8 |
| **S1** (SỬA view của `om:`) | Thanh thông báo và khối tổng quan dùng lịch cuộc thi | chính | `_ContestHeader.cshtml`, `competitionOverviewBlock.cshtml` | B10 merge vào `dev` | Không in "tháng" tính từ `StartAt`; dùng phần tử đầu `ongoing`; không cuộc thì ẩn thanh; liên kết tới trang làm bài `?c=`; số câu/chuyên đề/lượt từ cuộc | `run-local`; 0/1/2 cuộc; tắt JavaScript vẫn thấy chữ | Chờ B10 |
| **I2** (SỬA I) | Tích hợp đầu–cuối | chính | Merge `lane/CUOC-THI-be`, `lane/CUOC-THI-fe` vào `dev` (điều phối) | B5–B13, F6–F9, S1 đạt review | Kịch bản I ở trên + 4 bước dưới | Như dưới | Chờ |

Kịch bản I2 bổ sung (chạy sau kịch bản I, dùng cuộc mẫu B13 và cuộc tạo thêm trong backoffice):
1. Hai cuộc cùng `ongoing` với hai đề khác nhau → trang làm bài hiện danh sách chọn; đăng ký cùng số ở cả hai, mỗi cuộc 2 lượt, lượt thứ 3 ở mỗi cuộc → `ATTEMPT_LIMIT`.
2. Làm cuộc có đề nhỏ (ví dụ 2 chuyên đề, 10 câu) tới khi đủ → nút Nộp bài hiện ở 10/10; `entry.total_questions = 10`.
3. Đặt `end_at` cuộc về quá khứ, `submit_grace_hours = 24` → không trả lời thêm, vẫn nộp được; `submit_grace_hours = 0` → `CONTEST_CLOSED`.
4. API-07 và thanh thông báo cùng đổi khi bật/tắt cuộc trong backoffice; trang Ứng phó không có thanh (FE-32).

Tổng: **10 task mới** (M1a, M1b, B5, B6, B9, B10, B11, B12, B13, F7) và **7 task sửa** (B7, B8a, B8b, F6, F8, F9, S1), cộng C2 và I2.

### R7. Thứ tự

1. CXN-A → M1a → M1b (chính). Song song: Orchestrator chốt C2 khi có trả lời CXN-C, D, E.
2. Mở `CUOC-THI-be`: B5 → B6 → B7 → B8a → B8b → B9 → B10 → B11 → B12 → B13. Mở `CUOC-THI-fe` sau M1b + C2: F6 → F7 → F8 → F9.
3. Merge hai luồng → S1 → I2.
4. Review theo mức rủi ro: M1a, B5, B7, B8b, B11 review riêng; B9+B10, B12+B13, F6+F7 gộp.

### R8. Cần người dùng xác nhận

**CXN-A · Cách hợp nhất `dev` với `origin/main`** (kiến trúc; chặn mọi task). Phương án ở R3. Khuyến nghị A + A1 + A2. Cần chốt thêm: ai làm (Worker ở luồng `CUOC-THI-hopnhat` hay người trong nhóm), và có cần báo nhóm trước khi `dev` lấy về các thay đổi của `origin/main` không.

**CXN-B · Schema** (chặn B5, B11). `entry.contest_id` rỗng được (khuyến nghị) hay bắt buộc (phải xóa lượt cũ local); thêm `submit_grace_hours`, `read_timer_factor` vào `contest` (khuyến nghị) hay đặt trong `appsettings` chung cho mọi cuộc; chặn xóa/đổi bộ đề khi đã có lượt (khuyến nghị) hay cho đổi (lượt đang làm phải làm thêm câu mới, như ghi chú ngân hàng đổi ở QĐ-015).

**CXN-C · API-01 có `contestId`** (contract; chặn B7, F6). Khuyến nghị: bắt buộc, `404 CONTEST_NOT_FOUND`, ẩn danh gửi kèm trường cá nhân thì bỏ qua (cách `dev`). Phương án khác: không gửi `contestId`, máy chủ tự chọn cuộc `ongoing` (như `CurrentContestService`): đơn giản hơn nhưng không làm được nhiều cuộc cùng lúc.

**CXN-D · Đề cuộc thi qua QUIZ-01/02 `?contest=`** (contract; chặn B9, F6, F8). Khuyến nghị như R5 (công khai, có đáp án theo QĐ-016, chặn cuộc `upcoming`). Phương án khác: API theo token `/contest/entries/me/topics/...` (chỉ người đã đăng ký thấy đề; thêm 2 action; vẫn lộ đáp án theo QĐ-016).

**CXN-E · API-07 lịch cuộc thi và nhãn lĩnh vực** (contract + schema; chặn B10, S1). Khuyến nghị như R5, cột `focus_area` chọn từ danh sách khóa lĩnh vực của trang Thủ đoạn. Phương án khác cho nhãn lĩnh vực: suy từ chuyên đề câu hỏi (cần bảng ánh xạ chuyên đề ↔ lĩnh vực; 2 tháng `mxh`, `chinhsach` của v2 không có lĩnh vực, xem 4b L5–L6). Cũng cần chốt: thanh thông báo hiện cuộc nào khi nhiều cuộc cùng diễn ra (khuyến nghị cuộc bắt đầu muộn nhất, như `om:`).

**CXN-F · Chỗ đặt luồng thi** (URL/kiến trúc; chặn M1b, F7). `om:` đã dùng `thiPage` cho trang Cuộc thi v2 ở `/cuoc-thi/`. Khuyến nghị: document type mới, trang con `/cuoc-thi/lam-bai/?c=<id>`. Phương án khác: một khối Block Grid trong `thiPage` (khó tách CSS/JS, khối trang trí và luồng thi chung một trang).

**CXN-G · Thay QĐ-008 bằng cuộc thi mẫu trong CSDL local** (chặn B13). Khuyến nghị: chỉ `Development`, khi bảng `contest` trống.

### R9. Câu hỏi còn mở (anhnn hoặc chủ quản)

| # | Câu hỏi | Ai | Chặn | Mặc định tạm trong thiết kế (chưa phải quyết định) |
|---|---|---|---|---|
| Q1 | Còn giữ **thi ẩn danh** (và API-04 "Dự thi có tên để xét giải") không? v2 chỉ ghi "Nhập số điện thoại để nhận lượt thi" (4b Q6) | Chủ quản | F7, F9; nếu bỏ thì bỏ API-04 và nhánh ẩn danh | Giữ như hiện có; ẩn danh không đếm lượt |
| Q2 | Quy tắc **"làm Chuyên đề 1 trước"** còn không, khi đề của cuộc có thể không có CĐ1? | Chủ quản | F8 | Khóa theo chuyên đề đầu tiên của đề; bỏ được bằng một điều kiện |
| Q3 | **Lượt làm dở khi hết cuộc**: giữ QĐ-014 theo từng cuộc (hết `end_at` không trả lời thêm; nộp tới `end_at + gia hạn`, chưa đủ câu thì không nộp được) hay khác? | anhnn | B8a, B8b, F8 | Giữ QĐ-014 theo cuộc |
| Q4 | **QĐ-016 và OTP (QĐ-012)**: v2 có giải tiền mặt mỗi cuộc, xét "người đạt điểm tối đa"; có giữ QUIZ-02 trả đáp án và không xác minh số điện thoại không? | Chủ quản | CXN-D (nếu đổi thì đề phải ẩn đáp án) | Giữ QĐ-016 |
| Q5 | **Cách hợp nhất**: CXN-A (và ai báo nhóm) | anhnn | Mọi task | Phương án A |
| Q6 | **F4b** dở dang ở `wip/CUOC-THI-F4b` (`8dce11fa`, chưa kiểm chứng, chưa review): giữ để làm tiếp trong F8 hay bỏ? | anhnn | F8 | Khuyến nghị giữ: đồng hồ đọc và màn Xong chuyên đề không phụ thuộc mô hình cuộc thi; chỉ đổi nguồn `readTimerFactor` |
| Q7 | Quay số/xếp giải và `draw` theo từng cuộc thi (BE-27/BE-28): làm trong gói này hay để sau? | anhnn | Không chặn | Để sau, ghi ở file 5 |

### R10. Việc tiếp theo

- anhnn trả lời CXN-A…G và Q1–Q7; Orchestrator ghi QĐ mới (thay hoặc bổ sung QĐ-002, 003, 006, 008, 014, 015) và chốt C2.
- Hạng mục đề xuất cho kế hoạch: `docs/ban-giao/CUOC-THI/5-hang-muc-moi-cho-ke-hoach.md`.
- `TRANG-THAI.md` do phiên điều phối cập nhật; điểm cần sửa ở đó: mục "Kết quả phân tích" ý 1 (các file `ContestSettings*` không bị xóa trên `origin/main`) và câu hỏi chặn 1–5 đã được QĐ-017…021 trả lời một phần.

## Cập nhật 2026-10-18: CXN-A đã chốt (QĐ-022)

- anhnn chọn phương án A: merge `origin/main` vào `dev`; phần liên quan Claude (`CLAUDE.md`, quy trình) lấy từ `dev`. **M1a chuyển sang "Làm được"**, giao Worker ở luồng `CUOC-THI-hopnhat` (nhánh `lane/CUOC-THI-hopnhat`, từ `dev`, `-AllowCommit`).
- Thử merge ngày 2026-10-18 (đã hủy, `dev` không đổi) cho thấy đúng 6 file xung đột nội dung ngoài `CLAUDE.md` và bản dựng: `ContestController.cs`, `ContestEntryService.cs`, `CustomCoreComposer.cs`, `thiPage.cshtml`, `quiz.css`, uSync `cuộc-thi-trực-tuyến.config`. Worker vẫn làm theo quy tắc ở cột "Việc cần làm" của M1a (đã quyết ở bước thiết kế); `tokens.css` tự gộp được, vẫn kiểm lại.
- Điểm cần chú ý: `origin/main` thêm 3 migration (`QuestionSubmissionIpWindowIndex`, `QuestionModerationApproval`, `AddContestCampaigns`); kiểm snapshot EF sau merge và chạy `-Reset` lẫn trên CSDL cũ.
- M1b và các task sau vẫn chờ CXN-B..G.

## Cập nhật 2026-10-18: CXN-B..G đã chốt (QĐ-024)

anhnn chốt cả sáu theo khuyến nghị. Hệ quả: **C2 xong** (contract R5 là chính thức); **M1b, B5, F6 chuyển "Làm được"**; B6 chờ B5; B7, B9, B10 chờ B6; B11, B13 chờ B5; F7 chờ M1b và F6. Q1 đến Q7 còn mở nhưng không chặn các task trên (Q2, Q6 vẫn chặn F8).
Thứ tự đề nghị: M1b (chính) song song B5 (be) và F6 (fe); mỗi luồng một worktree riêng, không quá 2–3 luồng.

