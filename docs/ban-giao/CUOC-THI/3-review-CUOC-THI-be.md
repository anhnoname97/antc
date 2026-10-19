# Review luồng CUOC-THI-be

Người viết: Orchestrator. Các review B1–B3 nằm ở `3-review.md`; từ B4 trở đi review luồng be ghi ở file này.

## Review B4 (luồng be) · 2026-10-18

**Kết luận: B4 ĐẠT.** API-05 đúng contract sau CXN-3, QĐ-014, QĐ-015; không có lỗi Nghiêm trọng/Cao/Trung bình. Phát hiện Trung bình của review B2 (bắt lỗi khóa chính ở API-03) **đã sửa**. Còn hai điểm Thấp, không chặn merge. **Nhánh `lane/CUOC-THI-be` (B1–B4) sẵn sàng merge vào `feature/cuoc-thi`** (chi tiết ở "Kết luận").

### Phạm vi đã review

- Đối tượng: commit `c8db277` trên `lane/CUOC-THI-be` (cha `5068074`, đang là đầu nhánh; worktree `C:\GTSC\DMST\wt\CUOC-THI-be` sạch, không có thay đổi chưa commit). File: `Api/Controllers/ContestController.cs`, `Core/Contest/ContestAttemptService.cs`, `Core/Contest/ContestSettings.cs`, `Core/Contest/ContestSettingsService.cs`.
- Đọc thêm (không đổi trong commit): `ContestAttemptService.cs:121-147` (`AuthenticateAsync`, API-02), `Quiz/QuestionBank.cs:42-53, 101-139` (`AnswerKey`, `Topics`, `Keys`, `TotalQuestions`, cách nạp bản chụp), `ContestSettingsService.cs:37, 90-100` (`VietnamOffset`, `GetStatus`).
- Chuẩn so sánh: `1-thiet-ke.md` › Contract (phần chung, dòng 133-142), › API-05 (dòng 232-269), › "Contract API-05 sau CXN-3" (dòng 374-399), › "B4 sau CXN-3" (dòng 417-433); QĐ-004, QĐ-006, QĐ-014, QĐ-015, QĐ-016; review B2, B3 trong `3-review.md`; báo cáo `2-ban-giao-CUOC-THI-be.md` › B4.
- Không review được: không tự build/chạy (vai trò Orchestrator). Phần chạy thử dựa vào báo cáo Worker (`run-local -NoRun` 0 lỗi; ngân hàng local 200 câu; đã thử 0/199/200 câu, nộp lại, ẩn danh kèm contact hợp lệ/sai/hết lượt, `named` kèm contact, trong/ngoài gia hạn, API-03 và API-02 sau khi nộp).

### Đối chiếu contract API-05 sau CXN-3

| Mục | Code (`c8db277`) | Kết quả |
|---|---|---|
| `POST /api/v1/contest/entries/me/submit`, thân `{ contact? }`, thân rỗng nhận như `{}` | `ContestController.Submit`, `[FromBody] SubmitRequest?`; không `[ApiController]` nên thân rỗng → `null` → không contact | Đạt |
| 1. Token → `401 INVALID_TOKEN` | `AuthenticateAsync` trước `SubmitAsync` | Đạt |
| 2. Đã nộp → `200` kết quả đã lưu, bỏ qua thân, bất kể thời gian | Kiểm `Status == Submitted` **trước** kiểm hạn; trả `Score`, `Answered`, `TotalQuestions`, `SubmittedAt` từ CSDL, không ghi gì | Đạt |
| 3. Hết hạn nộp → `403 CONTEST_CLOSED`; không có `thiPage` → đóng | `settings is null \|\| !IsSubmitOpen(...)`; `deadline = (contestEnd − 7h) + SubmitGraceHours` | Đạt về hạn cuối; xem điểm Thấp 1 về `contestStart` |
| `submitGraceHours` rỗng/âm → 24, `0` → không gia hạn (QĐ-014) | `NormalizeSubmitGraceHours`: `value is >= 0 ? value : 24`; đọc `page.Value<int?>(…, "submitGraceHours")` | Đạt |
| 4. Chưa đủ câu (kể cả 0 câu) → `409 INCOMPLETE_ANSWERS` | `covered = rows.Count(r => bank.Keys.ContainsKey(r.QuestionCode))`, `covered < bank.TotalQuestions` | Đạt — đúng định nghĩa "đủ câu" (câu đã ngừng dùng không tính) |
| `message` "Bạn mới trả lời {x}/{total} câu. Hãy trả lời hết các câu rồi nộp bài." | Khớp từng chữ với mẫu ở `1-thiet-ke.md:391`; số lấy từ `covered`, `TotalQuestions` | Đạt |
| Không viết cứng 200 | Grep diff: không có hằng `200` trong điều kiện | Đạt |
| Thứ tự 3 trước 4 | Đúng | Đạt |
| 5. Có `contact`, lượt `anon`, contact sai → `400 VALIDATION`, `fields` khóa `fullName/phone/org/consent` | Gọi chung `ContestEntryService.Validate`, `message = fields.Values.First()` như API-01/04 | Đạt |
| 6. Số đã hết lượt → `409 ATTEMPT_LIMIT`, không nộp | `CountAsync(e => e.Phone == phone)` trong khóa; câu thông báo giống API-01/04 | Đạt |
| Có `contact` nhưng lượt đã `named` → bỏ qua contact | `current.Mode == Anon && contact is not null` | Đạt |
| 7. Gắn thông tin + nộp trong **một** giao dịch, trong khóa ghi chung | `WriteLock` + `BeginTransactionAsync`; một `SaveChangesAsync` rồi `CommitAsync`; trả lỗi sớm → `tx` dispose → rollback, `entry` không đổi | Đạt |
| Khi nộp: `score = COUNT(is_correct)`, `answered = số dòng`, `total_questions = TotalQuestions`, `submitted_at = now` UTC | Đúng | Đạt |
| `eligibleForPrize` = lượt có `phone` | `!string.IsNullOrEmpty(e.Phone)` | Đạt |
| `byTopic` theo QUIZ-01 (thứ tự `cd`), `correct` theo `topic`, `count` theo ngân hàng hiện tại | `bank.Topics` (sắp theo `Id`, `Cd = Id.ToString()` nên `int.Parse` an toàn); `count = t.Count` | Đạt |
| Phản hồi `200` đủ trường, tên JSON đúng | `SubmitDto` với `JsonPropertyName` khớp mẫu `1-thiet-ke.md:239-253`; `submittedAt` qua `ToIso` | Đạt |
| Dạng lỗi `{ error: { code, message, fields } }` (QĐ-004); `INCOMPLETE_ANSWERS → 409`; `no-store` mọi phản hồi | Dùng chung `Error()`; `no-store` đầu action | Đạt |
| `NOTHING_TO_SUBMIT` bỏ hẳn | Không còn trong code | Đạt |
| Đáp án đến cùng lúc lệnh nộp → tuần tự | API-03 và API-05 cùng `WriteLock`; kiểm "đủ câu" và đọc lại trạng thái **trong** khóa | Đạt |
| QĐ-016: điểm chấm phía máy chủ | `score` đếm `is_correct` do API-03 tính từ `AnswerKey`; API-05 không nhận gì về đáp án từ client | Đạt |

**Tiêu chí hoàn thành B4** (`1-thiet-ke.md:420-425`): 1 ✓ · 2 ✓ (Worker: 199 câu → "199/200", `in_progress`, `score` rỗng) · 3 ✓ (`score 200 = COUNT`) · 4 ✓ · 5 ✓. Yêu cầu nhắc từ review B1 (API-02 sau khi nộp: `score`, `total`, `submittedAt …Z`) đã kiểm (bàn giao B4 dòng 86).

### Sửa theo review B2, B3

| Điểm | Kết quả |
|---|---|
| [Trung bình] Bắt lỗi khóa chính ở API-03 | **Đã sửa**: `catch (DbUpdateException)` → `ChangeTracker.Clear()` → đọc lại `(entry_id, question_code)` → `200 stored:false`; không có dòng thì ném tiếp. Đúng hướng khắc phục; giao dịch được dispose (rollback) khi trả về. Chỉ đọc qua code (không tái hiện được bằng một tiến trình), như đã ghi ở "Cần xác minh" của review B2. |
| [Thấp] Kiểm "cuộc thi mở" trước khi chờ khóa | **Đã sửa** cho cả API-03 và API-04: `settings` đọc ngoài khóa, `IsOpen(settings)` lấy `DateTime.UtcNow` trong khóa. API-05 làm cùng cách. |
| [Đề xuất] `ChangeTracker.Clear()` trước `Release()` | **Đã làm** ở API-03, API-04, API-05. |
| [Thấp] Comment controller | **Đã sửa**: "Hien co API-01 den API-05; gioi han tan suat (BE-26) lam sau." |
| [Thấp] Mã commit B2, B3 trong bàn giao | **Đã ghi** ở mục B4 (`2-ban-giao-CUOC-THI-be.md:74`). |
| [Thấp] Lỗi gõ "`.un-local.ps1`" | Chưa sửa (`2-ban-giao-CUOC-THI-be.md:62`). Chỉ là chữ, bỏ qua được. |

### Phát hiện

#### [Thấp] `IsSubmitOpen` không kiểm "đã qua `contestStart`"
- Vị trí: `Core/Contest/ContestSettingsService.cs:103-108` (`IsSubmitOpen`).
- Bằng chứng: `1-thiet-ke.md:141`: "Còn hạn nộp = có `contestEnd` và `contestStart`, **đã qua `contestStart`**, và `now < contestEnd + submitGraceHours`". Code chỉ kiểm có hai ngày, `start < end` và hạn cuối.
- Tình huống xảy ra: trước giờ mở (`upcoming`), gọi API-05 cho một lượt chưa nộp → bỏ qua bước 3, rơi vào bước 4 → `409 INCOMPLETE_ANSWERS "0/200"` thay vì `403 CONTEST_CLOSED`. Không sai dữ liệu: lúc `upcoming` API-03 đã chặn nên lượt không thể đủ câu. Trường hợp hiếm duy nhất có hệ quả: quản trị dời `contestStart` về sau khi đã có lượt làm đủ → lượt đó vẫn nộp được khi cuộc thi "chưa mở".
- Hướng khắc phục: thêm `nowUtc >= startUtc` (cùng cách quy đổi giờ VN như `GetStatus`). Một dòng, không đổi contract. Có thể sửa kèm task sau (I hoặc BE-26), không chặn merge.

#### [Thấp] Thân JSON sai kiểu khiến lượt ẩn danh bị nộp ẩn danh (không thể làm lại)
- Vị trí: `Api/Controllers/ContestController.cs` `Submit` (`[FromBody] SubmitRequest? request`, rồi `request?.Contact`).
- Bằng chứng: không dùng `[ApiController]`, nên JSON sai hoặc sai kiểu (ví dụ `{"contact":{"consent":"yes"}}`, hay thân bị cắt) → `request = null` → coi như không có contact → nộp ẩn danh. Ở API-04 cùng tình huống trả `400 VALIDATION` (vì `Validate(null, …)`), còn ở API-05 việc nộp là **không đảo ngược**, lượt mất quyền xét giải.
- Tình huống xảy ra: chỉ khi client gửi thân hỏng; FE dùng `JSON.stringify` với kiểu đúng nên thực tế khó gặp. Contract chỉ nói "thân rỗng nhận như `{}`", không nói JSON sai.
- Hướng khắc phục (tùy chọn): phân biệt "thân rỗng" với "thân có nội dung nhưng bind lỗi" (`Request.ContentLength > 0 && request is null` → `400 VALIDATION`), hoặc ghi rõ trong bàn giao FE (F5) là luôn gửi `{}` / `{ contact }` đúng kiểu. Không chặn merge.

### Sai khác tài liệu ↔ code

- `403 CONTEST_CLOSED` và `409 INCOMPLETE_ANSWERS` ở API-05 thêm/khác so với sheet "API" r9 (`NOTHING_TO_SUBMIT`); đã có QĐ-014, QĐ-015 và contract sau CXN-3. Không phải lỗi. (Khi làm tài liệu v4 sửa r9 như QĐ-015 đã ghi.)
- Lượt đã nộp, gọi lại: `answered` lấy `entry.answered` (giá trị lúc nộp), `total` lấy `total_questions`, còn `byTopic.count` theo ngân hàng hiện tại. Đúng contract dòng 259, 269 (đã chấp nhận có thể lệch nếu ngân hàng đổi).

### Cần xác minh

- **Câu đang dùng nằm trong chuyên đề đã tắt**: `QuestionBank.Load` lọc `Keys` theo `QuizQuestion.IsActive` nhưng `Topics` theo `QuizTopic.IsActive` (`QuestionBank.cs:106-107, 120-124`). Nếu một chuyên đề bị tắt mà câu của nó còn bật, `TotalQuestions` gồm cả các câu FE không thấy qua QUIZ-01 → không lượt nào nộp được. Đây là tính chất của bản chụp có từ trước (không thuộc diff B4) và với dữ liệu seed hiện tại không xảy ra (Worker đo 200 câu = tổng). Cần lưu ý khi làm "nhập ma trận câu hỏi": tắt chuyên đề phải tắt cả câu, hoặc `Keys` lọc theo chuyên đề đang bật.
- Lượt đủ câu nhưng chưa nộp, gọi ở ngoài gia hạn → `403`: Worker chưa tạo được dữ liệu; đọc code thấy nhánh `403` đứng trước kiểm đủ câu nên kết quả không phụ thuộc số câu. Đủ tin cậy.
- `submitGraceHours = 0` và nhánh `DbUpdateException` của API-03: chỉ đọc qua code, logic đúng.

### Đề xuất (không bắt buộc)

- Phần "kiểm contact + gán `named`" đang chép giữa `AttachContactAsync` và `SubmitAsync` (khoảng 20 dòng, cùng câu thông báo). Review B3 đã gợi ý tách hàm dùng chung; có thể làm khi có thay đổi tiếp theo ở đây để hai đường không lệch nhau.

### Kết luận

- **B4: ĐẠT.** Không cần sửa trước khi merge. Hai điểm Thấp (`contestStart` trong `IsSubmitOpen`; thân JSON hỏng ở API-05) sửa kèm task sau nếu tiện.
- **`lane/CUOC-THI-be` (B1 `a117f64`, B2 `dc7a636`, B3 `5068074`, B4 `c8db277`): SẴN SÀNG merge vào `feature/cuoc-thi`.**
  - Mọi phát hiện Trung bình của B1–B3 đã đóng; không còn mục bắt buộc.
  - Nhánh tách từ `a244e24`, đúng đầu `feature/cuoc-thi` hiện tại → không xung đột (dùng `git merge --no-ff` theo quy ước).
  - Chỉ sửa 6 file trong phạm vi luồng be (`ContestController.cs`, `CustomCoreComposer.cs`, `Contest/ContestAttemptService.cs`, `ContestEntryService.cs`, `ContestSettings.cs`, `ContestSettingsService.cs`); không trùng file nào với `lane/CUOC-THI-fe` (chỉ view, css, js), không đụng `Data/*`, uSync, `docs/`.
- Rủi ro còn lại (đã biết, không thuộc B4): khóa ghi chỉ tuần tự trong một tiến trình (nhiều tiến trình cùng file SQLite chỉ được khóa chính bảo vệ ở API-03); chưa có giới hạn tần suất (BE-26); QĐ-016 (đáp án công khai qua QUIZ-02).
- **Việc tiếp theo**: điều phối merge `lane/CUOC-THI-be` vào `feature/cuoc-thi`. Task I (tích hợp) chờ thêm luồng fe (F3–F5) đạt review. Khi chạy I, Worker kiểm thêm: API-05 lúc cuộc thi `upcoming` (ghi kết quả thật để biết đã sửa điểm Thấp 1 chưa).
