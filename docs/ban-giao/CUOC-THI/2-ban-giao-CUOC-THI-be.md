
## B1 · BE-23a · Xác thực token + API-02 · 2026-10-17

**Trạng thái**: xong, đã kiểm chứng. Không có câu hỏi bị chặn.

**Commit**: `a117f64` (mã `82e2128` ghi trước đó là commit treo đã bị amend, không còn trên nhánh; cập nhật 2026-10-18 theo `3-review.md` › Review B1).

**File** (worktree `CUOC-THI-be`):
- Mới: `Contest/ContestAttemptService.cs` (`IContestAttemptService`: `AuthenticateAsync`, `GetStateAsync`; DTO `EntryStateDto`, `EntryAnswerDto`).
- Sửa: `Api/Controllers/ContestController.cs` (action `GET entries/me`, mã `INVALID_TOKEN → 401`), `Composers/CustomCoreComposer.cs` (đăng ký Scoped).

**Theo contract**: `HashToken` dùng lại của `ContestEntryService`; thiếu/rỗng/sai token → `401 INVALID_TOKEN` (có `fields: {}`); `Cache-Control: no-store` cả thành công và lỗi; `phoneMasked` = 3 số đầu + `****` + 3 số cuối; `attemptNo` null cho ẩn danh (QĐ-010); `answered` = đếm dòng `entry_answer`; `score` null khi `in_progress`; `total` = `entry.total_questions` khi đã nộp, ngược lại `TotalQuestions` bản chụp; `answers` sắp theo `answered_at`, mỗi phần tử có `cd` chuỗi (QĐ-013); thời điểm ISO UTC có `Z`.

**Giả định nhỏ**: cài đặt cuộc thi không có (không có `thiPage`) → `maxAttempts` = mặc định 2. Số điện thoại ngắn hơn 7 ký tự → `phoneMasked` null (không xảy ra với dữ liệu đã qua validate).

**Kiểm chứng** (`.\run-local.ps1 -NoRun` → 0 lỗi; web cổng 11002):
- API-01 tạo lượt có tên và ẩn danh → 201.
- API-02 token đúng (có tên): `phoneMasked":"091****678"`, `attemptNo":1`, `total":200`, `answers":[]`, header `no-store`. Ẩn danh: `attemptNo":null`, `fullName/phoneMasked/org` null.
- Token sai và thiếu header: `401`, `no-store`, thân lỗi đủ `code/message/fields`.
- Chèn tay 2 dòng `entry_answer` bằng Python `sqlite3` (B2 chưa có API-03): `answered=2`, thứ tự theo `answered_at`, `cd` đúng theo cột `topic` ("2", "1").
- Chưa kiểm: lượt `submitted` (chưa có API-05; nhánh `score`/`total`/`submittedAt` chỉ đọc qua code).
- Các lượt/đáp án thử nằm trong CSDL riêng của worktree; đã dừng web.

**Lưu ý**: mã câu thật của ngân hàng chưa dùng ở B1 (dữ liệu thử dùng mã giả `CD1-001`); API-02 không kiểm mã câu với ngân hàng.

## B2 · BE-23b · API-03 lưu đáp án · 2026-10-17

**Trạng thái**: xong, đã kiểm chứng. Không có câu hỏi bị chặn.

**File** (worktree `CUOC-THI-be`):
- Sửa: `Contest/ContestAttemptService.cs` (thêm `SaveAnswerAsync`, `SaveAnswerRequest`, `SaveAnswerDto`, `SaveAnswerResult`), `Contest/ContestEntryService.cs` (`WriteLock` thành `internal static`, dùng chung), `Api/Controllers/ContestController.cs` (action `POST entries/me/answers`; ánh xạ HTTP: `UNKNOWN_QUESTION`/`INVALID_OPTION` → 400, `ALREADY_SUBMITTED` → 409).

**Theo contract**: thứ tự kiểm tra 1→6 như bảng API-03. Trong khóa ghi, đọc lại `entry.status` từ CSDL (đối tượng `Entry` từ xác thực có thể đã cũ), rồi kiểm tra đã nộp → đóng → mã câu → chữ cái → đã có đáp án (`200`, `stored:false`, trả `a`/`correct` đang lưu) → ghi. `topic = AnswerKey.TopicId`, `is_correct = (a == Answer)`, `answered_at` UTC; không cập nhật `entry.answered`. Chữ cái so khớp phân biệt hoa thường. `no-store` ở mọi phản hồi. Thân rỗng, JSON sai hoặc `q` thiếu → `400 UNKNOWN_QUESTION`.

**Giả định nhỏ**: kiểm tra "cuộc thi mở" tính theo `DateTime.UtcNow` lấy một lần trước khi vào khóa. Thân JSON có `a` không phải chuỗi (ví dụ số) làm bind thất bại, cũng ra `UNKNOWN_QUESTION` (theo hàng 4 bảng: JSON sai).

**Kiểm chứng** (`.\run-local.ps1 -NoRun` → 0 lỗi; web cổng 11002; script Python trong scratchpad, không commit):
- Lượt ẩn danh mới: `q` thật `CĐ1-001` với `a:"Z"` → `400 INVALID_OPTION`; thiếu `a` → `400 INVALID_OPTION`; `a:"a"` (chữ thường) → `400 INVALID_OPTION`; mã `XX-999` → `400 UNKNOWN_QUESTION`; thân rỗng và JSON sai → `400 UNKNOWN_QUESTION`.
- `a:"A"` (sai) → `200 {"correct":false,"stored":true}`; gửi lại `a:"B"` → `200` với `a:"A"`, `correct:false`, `stored:false` (lần đầu thắng).
- Không token / token sai → `401 INVALID_TOKEN`.
- 5 luồng đồng thời cùng một câu (`CĐ1-002`, `a:"C"`): đúng 1 phản hồi `stored:true`, 4 phản hồi `stored:false`. Python `sqlite3`: `GROUP BY entry_id, question_code HAVING COUNT(*)>1` rỗng; dòng lưu có `topic=1`, `chosen`, `is_correct` đúng; API-02 thấy `answered:2` và `cd:"1"`.
- Lượt đã `submitted` (đặt trạng thái bằng `sqlite3` vì API-05 chưa có) → `409 ALREADY_SUBMITTED`.
- Đóng cuộc thi: tạm đổi `contestEnd` trong file uSync nội dung về `2026-10-05`, khởi động lại → lượt đang làm → `403 CONTEST_CLOSED`; lượt đã nộp vẫn `409 ALREADY_SUBMITTED` (đúng thứ tự 2 trước 3). Đã `git checkout` trả file uSync về nguyên trạng (không commit).
- Đã xóa các dòng `entry_answer` giả mã ASCII `CD1-001`, `CD1-002` (3 dòng) chèn tay ở B1. Còn lại trong CSDL riêng của worktree chỉ là đáp án thật từ lần thử này.
- Đã dừng web.

**Chưa kiểm**: đóng cuộc thi ở nhánh `settings is null` (không có trang `thiPage`) chỉ đọc qua code. Nhánh "lỗi khóa chính từ tiến trình khác" không tái hiện được (một tiến trình, khóa tuần tự); chỉ đọc qua code: kiểm tra tồn tại trong khóa nên không cần bắt ngoại lệ riêng.

## B3 · BE-24a · API-04 gắn thông tin vào lượt ẩn danh · 2026-10-18

**Trạng thái**: xong, đã kiểm chứng. Không có câu hỏi bị chặn. Kèm sửa 2 điểm Thấp của Review B1: comment đầu `ContestController` (nay ghi "API-01 đến API-04") và mã commit B1 (`a117f64`, ghi ở mục B1).

**File** (worktree `CUOC-THI-be`):
- `Contest/ContestEntryService.cs`: `Validate` thành `internal static`, nhận từng trường (`fullName, phone, org, consent`) thay vì `CreateEntryRequest`; API-01 gọi lại, hành vi giữ nguyên.
- `Contest/ContestAttemptService.cs`: thêm `ContactRequest`, `AttachContactDto`, `AttachContactResult`, `AttachContactAsync` (`ContactRequest` để API-05 dùng lại cho `contact`).
- `Api/Controllers/ContestController.cs`: action `PUT entries/me/contact`; `ALREADY_NAMED → 409`.

**Theo contract** (thứ tự bảng API-04 + QĐ-014): token → đã nộp `409 ALREADY_SUBMITTED` → đã `named` `409 ALREADY_NAMED` → cuộc thi không mở `403 CONTEST_CLOSED` → sai dữ liệu `400 VALIDATION` có `fields` (cùng câu thông báo API-01) → số hết lượt `409 ATTEMPT_LIMIT` (câu như API-01). Thành công `200 {mode:"named", attemptNo, maxAttempts}`; ghi `mode`, `full_name`, `phone` chuẩn hóa, `org`, `consent_at = now`, `attempt_no = số lượt của số đó + 1`. Mã dự thi, token, đáp án giữ nguyên. Đếm lượt và ghi trong cùng `WriteLock` với API-01; trạng thái lượt đọc lại (có theo dõi) trong khóa. `no-store` mọi phản hồi. Thân rỗng/JSON sai → `VALIDATION` đủ các trường.

**Giả định nhỏ**: không có `thiPage` → coi như đóng (như API-03). Thứ tự "đã nộp, đã named" trước "đóng" theo bảng.

**Kiểm chứng** (`.un-local.ps1 -NoRun` → 0 lỗi; web cổng 11002; script Python trong scratchpad, không commit):
- Không token / token sai → `401 INVALID_TOKEN`. Thân rỗng, và `{fullName:"", phone:"12", consent:false}` → `400 VALIDATION` với `fields` fullName, phone, consent.
- Lượt ẩn danh + dữ liệu hợp lệ → `200 {"mode":"named","attemptNo":1,"maxAttempts":2}`, có `no-store`. API-02 sau đó: `mode named`, `fullName`, `phoneMasked 099****135`, `attemptNo 1`. Gọi lại → `409 ALREADY_NAMED`.
- Lượt ẩn danh thứ hai cùng số → `attemptNo 2`; lượt thứ ba cùng số → `409 ATTEMPT_LIMIT`, lượt vẫn `anon`. `sqlite3`: 2 dòng `named`, `attempt_no` 1 và 2, `consent_at` có giá trị.
- Lượt đặt `submitted` bằng `sqlite3` (API-05 chưa có) → `409 ALREADY_SUBMITTED`.
- Đóng cuộc thi: tạm đổi `contestEnd` trong file uSync nội dung về `2026-10-05`, khởi động lại → lượt ẩn danh → `403 CONTEST_CLOSED`. Đã `git checkout` trả file uSync (không commit).
- Đã dừng web.

**Chưa kiểm**: nhánh không có `thiPage`; hai yêu cầu đồng thời cùng số vượt giới hạn (chỉ đọc qua code: cùng `WriteLock` với API-01).

## B4 · BE-24b · API-05 nộp bài · 2026-10-18

Commit: c8db277 trên `lane/CUOC-THI-be` (B1 `a117f64`, B2 `dc7a636`, B3 `5068074`).

### Đã làm
- `ContestController.Submit` (`POST /api/v1/contest/entries/me/submit`, thân `{ contact? }`, thân rỗng/null nhận được); `INCOMPLETE_ANSWERS → 409`.
- `ContestAttemptService.SubmitAsync`: trong khóa ghi + một giao dịch, theo thứ tự: đã nộp → trả kết quả đã lưu (bỏ qua thân, bất kể hạn); hết hạn → `403 CONTEST_CLOSED`; chưa đủ câu → `409 INCOMPLETE_ANSWERS` (số `covered/total` từ `Keys` và `TotalQuestions`, không viết cứng 200); contact (chỉ lượt `anon`) sai → 400, hết lượt → 409; còn lại gắn thông tin + ghi `status, answered, score = COUNT(is_correct), total_questions, submitted_at`. `byTopic` theo chủ đề của bản chụp.
- `submitGraceHours`: `ContestSettings.SubmitGraceHours` (null/âm → 24, 0 → không gia hạn), `IContestSettings.IsSubmitOpen`. Hạn nộp: `contestEnd` (giờ VN) + grace.
- Sửa theo review B2: bắt `DbUpdateException` ở API-03 → đọc lại, `stored:false`; kiểm "cuộc thi mở" lấy giờ sau khi vào khóa (API-03, API-04); `ChangeTracker.Clear()` đặt trước `Release()`; sửa comment controller.

### Kiểm chứng (web cổng 11002, `run-local -NoRun` 0 lỗi; script Python trong scratchpad, không commit)
Ngân hàng local: **200 câu**.
- 0 câu → `409` "0/200"; 199 câu → `409` "199/200", `entry.status` vẫn `in_progress`, `score` rỗng. Token sai → `401`.
- Trả câu cuối, thân rỗng → `200`, `score 200` = `COUNT(is_correct=1)` (200), `total 200`, `byTopic` đủ chuyên đề. Nộp lại (kèm contact khác) → cùng kết quả, `submitted_at` không đổi. API-03 sau nộp → `409 ALREADY_SUBMITTED`.
- API-02 sau nộp: `status submitted`, `score 200`, `total 200`, `submittedAt 2026-10-17T17:08:25Z` (đúng dạng `…Z`) — xong mục "cần xác minh" của review B1.
- Ẩn danh đủ câu: contact hợp lệ → `mode named`, `eligibleForPrize true`, `attempt_no 1`; contact sai → `400` có `fields`, lượt vẫn `in_progress/anon`; số đã đủ 2 lượt → `409 ATTEMPT_LIMIT`, vẫn `in_progress/anon`; lượt `named` kèm contact → bỏ qua contact, `phone` giữ nguyên.
- Thời gian (đặt `contestEnd` trong file uSync nội dung rồi khởi động lại): `2026-10-17T12:00` (trong 24h gia hạn) → lượt thiếu câu `409 INCOMPLETE_ANSWERS`, lượt đủ câu `200`; `2026-10-10` (ngoài gia hạn) → lượt thiếu câu `403 CONTEST_CLOSED`, lượt đã nộp vẫn `200` kết quả cũ. Đã `git checkout` trả file uSync, không commit.

### Chưa kiểm / ghi chú
- Chưa thử lượt đủ câu nhưng chưa nộp ở ngoài gia hạn (không tạo được sau khi đóng; logic cùng nhánh `403` đã chạm bằng lượt thiếu câu). `grace = 0`, nhánh `DbUpdateException` ở API-03 chỉ đọc qua code/build.
- `score` thử toàn đáp án đúng; công thức là đếm `is_correct` nên không phụ thuộc.
- Giả định: lượt `named` đã nộp trả `answered` từ `entry.answered` (do API-05 ghi lúc nộp).
- Mã `NOTHING_TO_SUBMIT` bỏ hẳn, theo thiết kế.
