# Review luồng CUOC-THI-v3-be

## Review B6 (2026-10-18)

### Phạm vi đã review
- Commit `c271889a` (khoảng `f6557b4e..HEAD` của `lane/CUOC-THI-v3-be`): `ContestCatalog.cs`, `CurrentContestService.cs`, `CustomCoreComposer.cs`, `ContestCatalogTests.cs`, xóa `CurrentContestServiceTests.cs`.
- Chuẩn: `1-thiet-ke.md` R4, R5 (API-07), dòng B6; QĐ-014, QĐ-015, QĐ-018, QĐ-019, QĐ-021, QĐ-024.
- Không review được: kết quả `dotnet test` (Orchestrator không build; không có file kết quả ở `agent-artifacts\CUOC-THI-v3-be\`). Chỉ dựa vào báo cáo Worker: 60 pass, 0 fail. Chưa chạy qua DI thật (Worker đã ghi nhận; B7+ sẽ lộ ra).

### Đối chiếu tiêu chí
- Trạng thái `upcoming` / `ongoing` / `ended` đúng R4 (`start_at ≤ now < end_at`, UTC), chỉ cuộc `is_active`: đạt (`ContestCatalog.cs`: `StatusAt`, các truy vấn lịch).
- Hạn nộp = `end_at + submit_grace_hours`; `PhaseAt` đúng với gia hạn 0 và 24: đạt.
- Đề = `contest_question` còn trong `IQuestionBank.Current.Keys` và thuộc `contest_topic`; thứ tự `contest_topic.sort_order` rồi `contest_question.sort_order`; câu ngừng dùng rời đề: đạt (`ToInfo`).
- Lịch: `ongoing` theo `startAt` giảm dần, `upcoming` tăng dần, `ended` theo `endAt` giảm dần, tối đa 12: đạt, khớp R5. Không viết cứng chu kỳ tháng.
- `CurrentContestService` giữ interface, gọi qua catalog; `IContestCatalog` đăng ký Scoped trong composer: đạt.
- Test theo cột kiểm chứng (biên, gia hạn 0/24, không `is_active`, câu ngừng dùng, nhiều cuộc ongoing): đủ 6 test; đạt nếu `dotnet test` xanh như báo cáo.

### Phát hiện
Không có lỗi từ mức Trung bình trở lên.

#### [Thấp] `ToInfo` bỏ chuyên đề hết câu khỏi `Topics`
- Vị trí: `ContestCatalog.cs`, `ToInfo` (`if (topicCodes.Count == 0) continue;`)
- Bằng chứng: R4 ("chuyên đề có trong `contest_topic`"), R5 (`topics` có `count`); Worker đã ghi trong "Giả định".
- Tình huống: chuyên đề được chọn nhưng mọi câu đã ngừng dùng thì không hiện ở thanh thông báo. Hợp lý; chỉ ghi nhận.
- Hướng khắc phục: không cần.

### Sai khác tài liệu ↔ code
- `end_at` loại trừ (R4) so với `EndAt >= now` của code cũ: code mới đúng R4, Worker đã nêu.
- Enum đặt tên `ContestState` (tránh trùng `ContestStatus` đến B12): chấp nhận.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Cần xác minh
- `dotnet test` xanh và thanh thông báo / khối tổng quan chạy qua DI thật: Worker kiểm khi làm B7.

### Đề xuất (không bắt buộc)
- Ở B10, `GetScheduleAsync` nạp `Include(Questions)` cho cả 12 cuộc đã qua; nếu chậm thì cân nhắc đếm trong SQL.

### Kết luận
B6 đạt, không có việc Worker phải sửa và không có điểm cần người dùng xác nhận. Có thể làm tiếp B7.


## Review B7 (2026-10-18)

### Phạm vi đã review
- Commit `938239ac` (khoảng `c271889..HEAD`) trong `wt\CUOC-THI-v3-be`: `ContestEntryService.cs`, `ContestController.cs`, `ContestEntryServiceTests.cs`, 5 file view.
- Chuẩn so sánh: `1-thiet-ke.md` › R5 › API-01 (6 hàng), task B7, QĐ-024 (contract R5 chính thức), báo cáo B7 của Worker.
- Không build, không chạy web. Phần chạy thử dựa vào báo cáo. `b7-entries.txt` chỉ chứa kết quả đối chiếu bảng `entry` (đúng `contest_id`, `attempt_no`, ẩn danh rỗng); kết quả HTTP từng hàng R5 chỉ có trong báo cáo, chưa đối chiếu độc lập được.

### Đối chiếu bảng R5 (API-01)
| Hàng | Code | Kết quả |
|---|---|---|
| 1 thiếu/≤0 `contestId` | `ContestEntryService.cs`: `request.ContestId is not > 0` → `VALIDATION`, `fields.contestId` | Đạt (xem lỗi Thấp 1 cho `contestId` sai kiểu) |
| 2 dữ liệu cá nhân sai | Kiểm trước bước tra cuộc | Đạt, thứ tự 400 trước 404 |
| 3 không có/tắt | `GetAsync` trả null → `404 CONTEST_NOT_FOUND`; controller ánh xạ 404 | Đạt (theo B6, `GetAsync` trả null khi không có hoặc tắt) |
| 4 không `ongoing` | `StatusAt(now) != Ongoing` → `403 CONTEST_CLOSED` | Đạt |
| 5 đủ lượt trong cuộc | `CountAsync(ContestId == && Phone ==)` so `contest.MaxAttempts`; thông điệp đúng R5 | Đạt |
| 6 `201` | `contestId`, `maxAttempts` của cuộc, `attemptNo = used + 1`, ghi `entry.ContestId` | Đạt |

Khóa ghi và giao dịch giữ nguyên, việc đếm vẫn nằm trong khóa nên ca đồng thời không vượt giới hạn. Ẩn danh kèm trường cá nhân vẫn bị bỏ qua (khớp CXN-C). Không đổi tên trường JSON ngắn của quiz. `TimeProvider` thay `DateTime.UtcNow` giúp kiểm thử theo thời gian.

Test: báo cáo ghi 67 pass; test mới đúng yêu cầu kiểm chứng của B7 (hai cuộc cùng số, đồng thời kiểm `contest_id`, 400 trước 404, cuộc tắt/chưa mở/đã hết). Chưa tự chạy lại.

### Phát hiện
#### [Thấp] `contestId` sai kiểu JSON không có `fields.contestId`
- Vị trí: `ContestController.CreateEntry` (nhận JSON không qua `[ApiController]`); Worker đã tự ghi nhận.
- Bằng chứng: R5 hàng 1 "không phải số nguyên dương → `fields.contestId`"; báo cáo: `"abc"` trả `400` chung, `fields` rỗng.
- Tình huống: client gửi `"contestId":"abc"` → 400 không có `fields`; FE không gắn được lỗi vào trường. FE bình thường gửi số nên ít gặp.
- Hướng khắc phục: bắt lỗi giải mã JSON ở controller, trả `VALIDATION` kèm `fields.contestId`. Không bắt buộc ở B7, có thể gộp vào B8b/I2.

#### [Thấp] Commit B7 chứa thay đổi ngoài phạm vi ở 5 view
- Vị trí: `home.cshtml`, `thamGiaPage.cshtml`, `thiPage.cshtml`, `thiThuPage.cshtml`, `ungPhoPage.cshtml`.
- Bằng chứng: diff chỉ thêm BOM ở dòng đầu (3 file) và bỏ xuống dòng cuối file (cả 5); không đổi nội dung. Task B7 chỉ gồm `ContestEntryService.cs`, `ContestController.cs`, test.
- Tình huống: nhiễu diff, dễ xung đột khi merge luồng FE (F7 sửa các view này), trái `.editorconfig` (LF, không BOM).
- Hướng khắc phục: hoàn lại 5 file về nội dung ở `c271889` trước khi merge (commit `chore:` nhỏ). Kiểm tra cách công cụ ghi file đang tự thêm BOM.

### Sai khác tài liệu ↔ code
Không có. Hai điểm Worker ghi ở "Giả định" (bỏ hai test `GetStatus` khỏi `ContestEntryServiceTests`; `ContestSettingsService` chỉ xóa ở B12) hợp lý, không đổi contract.

### Cần xác minh
- Luồng thi trên trang nhận 400 đến khi F6/F7 vào (Worker đã nêu). API-02..05 vẫn dùng `IContestSettings` đến B8a/B8b. Kiểm lại đầu–cuối ở I2.

### Đề xuất (không bắt buộc)
- Lưu kết quả HTTP từng hàng R5 vào `agent-artifacts` để review sau không phải tin báo cáo.

### Kết luận
B7 đạt: logic khớp 6 hàng R5, đếm lượt theo cuộc, khóa ghi giữ nguyên, test đủ theo yêu cầu. Không có lỗi từ mức Trung bình trở lên.

**Worker phải sửa:** không bắt buộc. Nên hoàn lại thay đổi BOM/xuống dòng ở 5 view (lỗi Thấp 2) trước khi merge luồng.

**Cần người dùng xác nhận:** không có.
