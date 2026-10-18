
## B5 · Schema: lượt gắn cuộc thi, cột cấu hình (2026-10-18)

**Trạng thái: xong, đã commit trên `lane/CUOC-THI-v2-be`.** Không có mục review chưa xử lý cho luồng này (chưa có `3-review-CUOC-THI-v2-be.md`).

Thay đổi (QĐ-024 B):
- `Data/Entities.cs`: `Entry.ContestId` (`long?`) + `Entry.Contest`; `ContestCampaign.SubmitGraceHours` (mặc định 24), `ReadTimerFactor` (`decimal`, mặc định 1), `FocusArea` (`string?`, tối đa 50).
- `Data/AppDbContext.cs`: FK `entry.contest_id → contest` (`Restrict`), chỉ mục `(contest_id, phone)`, độ dài/độ chính xác cột mới.
- Migration `20261018081328_AddEntryContestAndContestSettings` (+ snapshot). Tôi sửa tay giá trị mặc định cột cũ: `submit_grace_hours` = 24, `read_timer_factor` = 1 (EF sinh 0, sẽ làm cuộc đã có không còn hạn nộp và hệ số 0).

Kiểm chứng (đã chạy):
- `dotnet build ANTC.Portal.App.slnx`: 0 lỗi.
- `dotnet ef migrations add AddEntryContestAndContestSettings ...` theo CLAUDE.md: thành công.
- CSDL cũ: `dotnet ef database update 20261016044750_AddContestCampaigns --connection ...` rồi chèn 1 lượt + 1 cuộc bằng Python `sqlite3`; `dotnet run --no-build --urls http://localhost:11002` áp migration: lượt cũ `contest_id = NULL`, cuộc cũ `submit_grace_hours=24`, `read_timer_factor=1.0`, `focus_area=NULL`; `/cuoc-thi/` 200.
- CSDL mới (`run-local.ps1 -Reset -NoRun` rồi chạy web): migration áp dụng; `PRAGMA table_info(contest)` có 3 cột mới với mặc định 24 / '1.0'; `PRAGMA index_list(entry)` có `IX_entry_contest_id_phone` (cột `contest_id`, `phone`); `PRAGMA foreign_key_list(entry)` (kiểm trên CSDL cũ) có FK `contest_id → contest` `RESTRICT`; `/cuoc-thi/` 200.
- `dotnet test ANTC.Portal.App.slnx`: 52 đạt, 0 lỗi.
- Đã dừng web chỉ bằng PID của cổng 11002.

Chưa kiểm / giả định:
- Chưa có code dùng cột mới (đúng phạm vi B5); chưa đổi `ContestAdminService`, `ContestEntryService` (B7, B11).
- `ReadTimerFactor` kiểu `decimal` lưu TEXT trong SQLite (EF mặc định); độ chính xác (4,2). Giả định đủ cho hệ số kiểu 1, 1.5.
- Sai khác thiết kế: chỉ chỉnh mặc định migration như trên; không có sai khác khác.
