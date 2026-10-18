# Bàn giao CUOC-THI — luồng v4-kt

## Kiểm dev sau ghép (2026-10-18)

Worktree `C:\GTSC\DMST\wt\CUOC-THI-v4-kt`, nhánh `lane/CUOC-THI-v4-kt`, HEAD `adfc81dc` (dev sau khi ghép be1 + be2). Không sửa code, không có commit mới.

| # | Lệnh | Kết quả |
|---|---|---|
| 1 | `dotnet build src/ANTC.Portal.App/ANTC.Portal.App.slnx` | 0 lỗi, 70 cảnh báo (toàn NU1902/NU1903 về ImageSharp, Pkcs, MessagePack: đã biết) |
| 2 | `dotnet test src/ANTC.Portal.App/ANTC.Portal.App.slnx` | Đạt 95/95, 0 lỗi, 0 bỏ qua |
| 3a | `dotnet ef migrations has-pending-model-changes` (Umbraco.Plugin.Custom.Core) | "No changes have been made to the model since the last migration." Snapshot khớp 2 nhánh |
| 3b | `.\run-local.ps1 -Reset -NoRun`, chạy web, rồi PRAGMA trên `App_Data/app.sqlite.db` | `integrity_check` = ok, `foreign_key_check` rỗng. `__EFMigrationsHistory` có đủ 5 migration: InitialCreate, QuestionSubmissionIpWindowIndex, QuestionModerationApproval, AddContestCampaigns, AddEntryContestAndContestSettings (không trùng/lệch). Có bảng contest, contest_question, contest_topic, entry, entry_answer, draw, draw_winner, quiz_* |
| 4 | Web cổng 11002 (`dotnet run --no-build`, Development) | Chạy được, DB tạo từ đầu không lỗi |

### Gọi thử API (cổng 11002, DB mới sau -Reset)

- `GET /api/v1/contests` → 200. Cuộc mẫu B13 `id=1` "Cuộc thi mẫu (môi trường local)" nằm ở `ongoing`, `questionCount=200`, 8 chuyên đề, `maxAttempts=2`.
- `GET /api/v1/quiz/topics?contest=1` → 200 (8 chuyên đề, có intro). `GET /api/v1/quiz/topics/1/questions?contest=1` → 200 (câu `CĐ1-001`...).
- `GET /api/v1/quiz?contest=1` → 404: không có route này (route là `/quiz/topics`, `/quiz/topics/{n}/questions`, `/quiz/sample`). Không phải lỗi ghép; lệnh giao việc ghi tắt.
- `POST /api/v1/contest/entries` `{"contestId":1,"mode":"anon"}` → 201, trả `code AD-W7MAYZ`, `token`, `status in_progress`, `maxAttempts 2`. (Mode hợp lệ là `named`/`anon`; thử `anonymous` → 400 VALIDATION đúng.)
- API-02 `GET /api/v1/contest/entries/me` với `X-Entry-Token` → 200: `answered 0`, `total 200`, `contest.phase=open`, 8 chuyên đề, `answers=[]`.
- Âm tính: token sai → 401 `INVALID_TOKEN`; `?contest=999` → 404 `CONTEST_NOT_FOUND`. Đều đúng dạng `{error:{code,message,fields}}`.

### Ghi chú

- Lỗi ghép: không có (không thiếu using, không trùng đăng ký dịch vụ).
- Khi chạy web, Umbraco tự ghi lại dòng cuối 5 file `Views/*.cshtml` (bỏ xuống dòng cuối file); đã `git checkout` hoàn tác, worktree sạch.
- Chưa kiểm POST entries chế độ `named`, API-03/04/05 và các API quản trị (ngoài phạm vi yêu cầu).
- Đã dừng web bằng PID 97592 (cổng 11002 không còn lắng nghe). Web log không lưu: thư mục agent-artifacts khi đó chưa có thư mục luồng.

TRANG-THAI: XONG
