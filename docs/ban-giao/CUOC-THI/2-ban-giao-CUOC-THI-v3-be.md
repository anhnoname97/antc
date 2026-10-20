# Bàn giao luồng CUOC-THI-v3-be

## B6 · `IContestCatalog` (2026-10-18)

**Trạng thái:** xong, đã commit trên `lane/CUOC-THI-v3-be`. Không có mục review nào của luồng này cần sửa (chưa có `3-review-CUOC-THI-v3-be.md`).

### Đã làm
- `Contest/ContestCatalog.cs` (mới): `IContestCatalog` (Scoped) với `GetAsync(id)`, `GetScheduleAsync(now)`, `GetCurrentAsync()`; `ContestInfo` (gồm `SubmitUntil`, `StatusAt(now)`, `PhaseAt(now)`, `Topics`, `QuestionCodes`), `ContestSchedule`, enum `ContestState` (Upcoming/Ongoing/Ended), `ContestPhase` (Open/SubmitOnly/Closed).
- Quy tắc theo R4: chỉ cuộc `is_active`; `start_at ≤ now < end_at` là ongoing; hạn nộp = `end_at + submit_grace_hours`; đề = `contest_question` còn trong `IQuestionBank.Current.Keys` và thuộc chuyên đề trong `contest_topic`, xếp theo `contest_topic.sort_order` rồi `contest_question.sort_order`; chuyên đề hết câu thì không vào đề. Không có chu kỳ tháng viết cứng.
- Lịch: ongoing `StartAt` giảm dần (hòa: `Id` giảm dần), upcoming tăng dần, ended `EndAt` giảm dần tối đa 12.
- `CurrentContestService` giữ interface và record `CurrentContest`, nay chỉ gọi `GetCurrentAsync()`; hai view không đổi. Đăng ký `IContestCatalog` trong `CustomCoreComposer.cs`.
- Test: xóa `CurrentContestServiceTests.cs`, thay bằng `ContestCatalogTests.cs` (6 test, kể cả theory gia hạn 0/24): biên `start_at`/`end_at`, gia hạn 0 và 24, cuộc không `is_active` (cả `GetAsync`, current, lịch), câu ngừng dùng rời đề + thứ tự đề, nhiều cuộc cùng ongoing + giới hạn 12 cuộc đã qua, và ca cũ của `CurrentContestService`.

### Lệnh đã chạy
- `dotnet test src/ANTC.Portal.App/ANTC.Portal.App.slnx` → build sạch, `Passed: 60, Failed: 0`.

### Chưa kiểm
- Chưa chạy web (`run-local`) nên chưa thấy thanh thông báo/khối tổng quan hoạt động qua DI thật; cột kiểm chứng của B6 chỉ yêu cầu `dotnet test`. Việc này lộ ra ở B7+.

### Giả định / sai khác so với thiết kế
- Enum đặt tên `ContestState` (không phải `ContestStatus`) vì `ContestSettings.cs` còn `ContestStatus` đến B12.
- Quy tắc `end_at` loại trừ (R4 `now < end_at`) khác `CurrentContestService` cũ (`EndAt >= now`): đúng R4, chênh đúng 1 thời điểm.
- `PhaseAt`: `SubmitOnly` khi `end_at ≤ now < submitUntil`; với gia hạn 0 thì `Closed` ngay tại `end_at`. Cuộc `upcoming` → `Closed`.
- Chuyên đề không còn câu trong đề bị bỏ khỏi `Topics` (API-07 R5 cũng chỉ liệt kê chuyên đề có `count`); `Topics` của `CurrentContest` nay là tên chuyên đề có câu trong đề.
- `GetAsync(id)` trả cả cuộc upcoming/ended (`is_active`); B7/B9 tự xét trạng thái để chọn `403`/`404`.
- Tên chuyên đề lấy từ bản chụp ngân hàng, dự phòng `QuizTopic.Title`.

## B7 (2026-10-18): API-01 theo cuộc thi

### Đã làm
- `ContestEntryService`: request thêm `ContestId` (`long?`); dùng `IContestCatalog.GetAsync` và `TimeProvider` thay `IContestSettings`. Thứ tự kiểm tra đúng bảng R5: `contestId` thiếu/≤0 → `400 VALIDATION` (`fields.contestId`); dữ liệu cá nhân sai → `400`; cuộc không có/`is_active=false` → `404 CONTEST_NOT_FOUND`; không `ongoing` → `403 CONTEST_CLOSED`; đủ `contest.max_attempts` lượt đếm theo `(contest_id, phone)` → `409 ATTEMPT_LIMIT` ("Số … đã dùng hết {n} lượt của cuộc thi này."); còn lại `201`, thêm `contestId`, `maxAttempts` của cuộc, `attemptNo` theo cuộc. `entry.contest_id` được ghi. Khóa ghi và giao dịch giữ nguyên.
- `ContestController`: `CONTEST_NOT_FOUND → 404`.
- `ContestEntryServiceTests`: sửa theo cuộc; thêm ca hai cuộc cùng số (mỗi cuộc 2 lượt, lượt 3 → `ATTEMPT_LIMIT`), `maxAttempts` lấy từ cuộc, `contestId` thiếu/0/âm, cuộc không có/tắt, chưa mở, đã hết, thứ tự 400 trước 404. Test đồng thời (10 yêu cầu cùng số) vẫn đúng 2 lượt, kiểm cả `contest_id`.

### Lệnh đã chạy và kết quả thật
- `dotnet test src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests`: Passed 67, Failed 0.
- `.\run-local.ps1 -NoRun`: Build succeeded, 0 lỗi.
- `dotnet run --no-build --urls http://localhost:11002` (CSDL riêng của luồng), 5 cuộc chèn bằng Python `sqlite3` (A, B đang diễn ra với 2 và 1 lượt; sắp tới; đã qua; tắt). `Invoke-WebRequest` từng hàng của bảng: thiếu/0 `contestId` → 400 (`fields.contestId`); `contestId:"abc"` → 400 chung, `fields` rỗng; dữ liệu cá nhân sai → 400; cuộc 999 và cuộc tắt → 404; sắp tới và đã qua → 403; cuộc A lượt 1, 2 → 201 (`attemptNo` 1, 2), lượt 3 → 409; cuộc B cùng số lượt 1 → 201, lượt 2 → 409 (max 1); ẩn danh kèm `phone` → 201, không lưu. Đối chiếu bảng `entry` bằng `sqlite3`: `contest_id` đúng, ẩn danh `phone`/`attempt_no` rỗng. Kết quả: `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v3-be\b7-entries.txt`.
- Đã dừng web bằng PID qua cổng 11002.

### Chưa kiểm được
- Chưa thử qua backoffice (cuộc tạo bằng SQL); chưa có đề (cuộc không có `contest_question`), không ảnh hưởng API-01.
- Frontend hiện chưa gửi `contestId` nên luồng thi trên trang sẽ nhận 400 cho đến khi F6/F7 vào; API-02..05 vẫn dùng `IContestSettings` (B8a, B8b).

### Giả định / sai khác
- `contestId` sai kiểu JSON (chuỗi) trả `400` chung, không có `fields.contestId` (do cách nhận JSON không dùng `[ApiController]`); R5 hàng 1 chỉ nói "không phải số nguyên dương". Nếu cần `fields` thì sửa nhỏ ở controller.
- Bỏ hai test của `ContestSettingsService.GetStatus` nằm trong `ContestEntryServiceTests` (lớp đó vẫn còn đến B12, nay không còn test riêng). Chỉ B12 xóa nó.
- Thông điệp `ATTEMPT_LIMIT` theo R5, bỏ câu "Mỗi số điện thoại chỉ được thi tối đa…" của bản cũ.
