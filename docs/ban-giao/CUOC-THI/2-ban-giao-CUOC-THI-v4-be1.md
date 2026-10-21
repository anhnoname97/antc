
## B8a · 2026-10-18 · API-02, API-03 theo cuộc của lượt

**Đã làm** (`Umbraco.Plugin.Custom.Core/Contest/ContestAttemptService.cs`, test mới `Umbraco.Plugin.Custom.Tests/ContestAttemptServiceTests.cs`):
- Inject thêm `IContestCatalog` và `TimeProvider`; cuộc của lượt = `catalog.GetAsync(entry.ContestId)`.
- API-02: thêm `contest {id,name,startAt,endAt,submitUntil,phase,readTimerFactor}` và `topics [{cd,count}]`; `maxAttempts` = của cuộc; `total` (đang làm) = số câu của đề; đã nộp giữ `entry.total_questions`. `phase` = `open|submit_only|closed`. Lượt không có cuộc (hoặc cuộc bị tắt): `contest: null`, `topics: []`, `maxAttempts`/`total` rơi về cài đặt `thiPage` và ngân hàng như cũ.
- API-03: `403 CONTEST_CLOSED` khi không có cuộc hoặc `phase != open`; `400 UNKNOWN_QUESTION` khi câu không thuộc đề của cuộc (trước đó chỉ xét ngân hàng). Thứ tự kiểm giữ nguyên (đã nộp → đóng → câu → đáp án).

**Không làm (đúng phạm vi):** API-04/05 (`AttachContactAsync`, `SubmitAsync`) vẫn dùng `IContestSettings` – thuộc B8b. Chưa ép thứ tự chuyên đề ở API-03 (QĐ-025 ghi "cần xác nhận máy chủ có ép không"; chưa có quyết định nên không thêm).

**Kiểm chứng đã chạy**
- `dotnet test src/ANTC.Portal.App/ANTC.Portal.App.slnx` → Passed 71/71 (4 test mới: câu ngoài đề, phase khác open, lượt cũ không cuộc, nội dung API-02 và `phase` closed/submit_only).
- `.\run-local.ps1 -NoRun` (0 lỗi build), `dotnet run --no-build --urls http://localhost:11002`; nạp tay vào CSDL riêng của luồng 1 cuộc (đề: CĐ1-001, CĐ1-002) và 1 lượt cũ không cuộc bằng Python `sqlite3`; gọi `Invoke-WebRequest`. Kết quả ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v4-be1\b8a-1.txt`, `b8a-2.txt`:
  - API-01 `contestId:1` → 201; API-02 → `contest.phase:"open"`, `topics:[{cd:"1",count:2}]`, `total:2`, `maxAttempts:2`, `readTimerFactor:1.5`.
  - API-03 gửi `CĐ1-005` (có trong ngân hàng, ngoài đề) → `400 UNKNOWN_QUESTION`; `CĐ1-001` → `200 stored:true`; API-02 sau đó `answered:1`.
  - `end_at` về quá khứ gần (còn gia hạn 24h) → API-03 `403 CONTEST_CLOSED`, API-02 `phase:"submit_only"`; `end_at` quá hạn nộp → `403`, `phase:"closed"`.
  - Lượt cũ không cuộc → API-02 `contest:null, topics:[]` (200); API-03 → `403 CONTEST_CLOSED`.
- Dừng web bằng PID 42220 qua cổng 11002.

**Chưa kiểm được / giới hạn:** đổi `end_at` bằng SQL trực tiếp thay vì backoffice (catalog đọc DB mỗi yêu cầu nên tương đương). Chưa chạy luồng thi trên trang (chờ B8b, I2). Cuộc bị tắt (`is_active=false`) giữa chừng được coi như lượt không có cuộc (`contest:null`, API-03 `403`), theo `IContestCatalog.GetAsync` – giả định, thiết kế chưa nêu riêng.

**Sai khác so với thiết kế:** không. Ghi nhận: các view `Views/*.cshtml` bị uSync ghi lại BOM/xuống dòng khi chạy web; đã hoàn lại, không đưa vào commit.

## B8b · 2026-10-18 · API-04, API-05 theo cuộc của lượt

**Trạng thái:** xong, đã commit trên `lane/CUOC-THI-v4-be1`. Điều kiện: B8a đạt review (`3-review-CUOC-THI-v4-be1.md`, "Worker phải sửa: không có"). Q3 theo mặc định thiết kế (QĐ-014 theo cuộc); Q2 (ép thứ tự chuyên đề ở API-03) chưa chốt nên không làm.

### Đã làm (`Contest/ContestAttemptService.cs`)
- **API-04** (`AttachContactAsync`): lấy cuộc của lượt từ `IContestCatalog`; lượt không cuộc hoặc `phase != open` → `403 CONTEST_CLOSED`; hạn mức lượt = `contest.MaxAttempts`; đếm theo `(ContestId, Phone)`; câu lỗi "Số … đã dùng hết {n} lượt của cuộc thi này." (đúng bảng R5).
- **API-05** (`SubmitAsync`): hạn nộp = `contest.SubmitUntil` (`phase == closed` hoặc không cuộc → `403 CONTEST_CLOSED`; `open` và `submit_only` đều nộp được); "đủ câu" = mọi mã trong `contest.QuestionCodes` có đáp án; `total` và `total_questions` = số câu của đề; `byTopic` theo `contest.Topics`; đếm lượt khi kèm `contact` theo cuộc. Nộp lại trả kết quả cũ, `byTopic` lấy theo cuộc (nếu cuộc đã bị tắt thì rơi về chuyên đề của ngân hàng).
- Thời điểm so sánh dùng `TimeProvider` (như B8a). Bỏ hàm `IsOpen`. `IContestSettings` vẫn còn trong constructor chỉ cho nhánh `maxAttempts` của API-02 với lượt cũ không cuộc (B12 sẽ gỡ).
- Test thêm vào `ContestAttemptServiceTests.cs` (+6 ca): thiếu 0/2, 1/2 rồi đủ (total, score, `byTopic`, `total_questions`, nộp lại); gia hạn 24 nộp được / gia hạn 0 `CONTEST_CLOSED` (Theory); lượt cũ không cuộc `CONTEST_CLOSED`; API-04 đếm theo cuộc (cùng số, hai cuộc, mỗi cuộc 1 lượt; lượt 2 ở cuộc A → `ATTEMPT_LIMIT`); API-04 ở `submit_only` → `CONTEST_CLOSED`.

### Lệnh đã chạy và kết quả
- `dotnet test src/ANTC.Portal.App/ANTC.Portal.App.slnx` → Passed 77/77 (trước đó 71).
- `.\run-local.ps1 -NoRun` → 0 Error(s). Chạy web `dotnet run --no-build --urls http://localhost:11002` (CSDL riêng của worktree), script `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v4-be1\b8b-run.py`, kết quả `b8b-1.txt` cùng thư mục. Cuộc thử "B8b test" 2 chuyên đề × 2 câu, `max_attempts = 1` (tạo bằng `sqlite3`, không qua backoffice):
  - 0 câu → `409 INCOMPLETE_ANSWERS` "0/4"; trả lời trừ 1 câu → `409` "3/4", `entry.status` vẫn `in_progress`.
  - Đủ → `200`, `total = 4`, `entry.total_questions = 4`, `byTopic` 2 chuyên đề × 2 câu; nộp lại `200`.
  - Hết cuộc, gia hạn 24 → nộp được (`200`); gia hạn 0 → `403 CONTEST_CLOSED`. Lượt thiếu câu: trong gia hạn `409 INCOMPLETE_ANSWERS` "1/4", ngoài gia hạn `403 CONTEST_CLOSED`.
  - API-04: lần 1 `200 attemptNo 1`; lần 2 cùng số trong cuộc max 1 → `409 ATTEMPT_LIMIT` "…lượt của cuộc thi này."
- Dừng web bằng PID lấy qua cổng 11002 (`Stop-Process -Id`), không diệt theo tên.

### Chưa kiểm / giả định / sai khác
- Chưa kiểm "cùng số, hai cuộc, mỗi cuộc có lượt riêng" qua HTTP; chỉ qua test đơn vị (`AttachContact_CountsAttemptsPerContest`).
- API-04 ở `submit_only` bị chặn (`CONTEST_CLOSED`): giả định theo R5 ("phase open nhận API-03/04/05" vs "submit_only: chỉ API-05"); contract ghi API-04 thuộc `open`.
- Thời điểm `submittedAt` / `answeredAt` vẫn dùng `DateTime.UtcNow` như cũ (không thuộc phạm vi).
- Cuộc thử "B8b test" nằm trong CSDL local của worktree (không commit); đặt `start_at` cuộc về hiện tại để không ảnh hưởng. Không có sai khác so với thiết kế.
- B12 mở khóa: `ContestAttemptService` còn dùng `IContestSettings` ở API-02 cho lượt cũ không cuộc.
