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
