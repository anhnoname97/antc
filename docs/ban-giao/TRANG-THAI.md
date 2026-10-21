# Trạng thái điều phối

**Đọc file này đầu tiên khi mở một phiên điều phối mới**, rồi `CLAUDE.md` (mục "Làm việc hai agent" và "Tiết kiệm lượt dùng"). Cập nhật file này trước khi đóng phiên.

- Cập nhật lần cuối: 2026-10-18 (sau I2) · bởi phiên điều phối của anhnn
- Câu mở đầu cho phiên mới: *"Đọc `CLAUDE.md` và `docs/ban-giao/TRANG-THAI.md`, rồi làm tiếp theo mục Việc tiếp theo."*

## Tình hình

**Gói CUOC-THI theo cuộc thi theo thời gian đã làm xong, kiểm (K1) và đẩy lên `origin/dev` (2026-10-18).** Đã vào `dev`: M1a (merge `origin/main`, QĐ-022), M1b, B5–B13, F6–F9, S1, I2; mọi task đạt review. I2 chạy đầu–cuối: 48 kiểm API và 28 kiểm giao diện không lỗi (`3-review-CUOC-THI-v6.md`). `dev` chưa push sau các merge; chưa vào `main` (QĐ-017). Không có agent nào đang chạy.

Quyết định đã chốt: QĐ-017 đến QĐ-026 (`docs/quyet-dinh.md`).

### Việc còn lại

1. **anhnn kiểm bản trên `dev`** (đã push): pull `dev`, `.
un-local.ps1 -Reset`, mở http://localhost:11000/cuoc-thi/ (cuộc thi mẫu có sẵn ở Development); quản trị `/umbraco`. Duyệt giao diện bằng mắt: màn kết quả FE-29, hai cuộc, 390px, câu chữ "đồng ý".
2. **Chỉ khi anhnn xác nhận đạt mới đưa `dev` vào `main`** (QĐ-017, QĐ-027). `main` chưa đụng.
3. K2 đạt (CSDL cũ, đếm lượt hai cuộc, 5 môi trường trình duyệt giả lập). **Cần anhnn quyết trước khi lên production:** (a) lượt dở dang của CSDL cũ (chưa thuộc cuộc nào) sau nâng cấp bị `403 CONTEST_CLOSED`, không làm tiếp được: chấp nhận hay gán vào một cuộc? (b) migration `AddEntryContestAndContestSettings` có cảnh báo EF `PRAGMA foreign_keys = 0` trong transaction: **sao lưu `app.sqlite.db` trước khi nâng cấp**. Chưa kiểm: máy thật (điện thoại), Safari chế độ riêng tư, nộp bài trọn vẹn trên từng trình duyệt, giá trị ngoài khoảng qua HTTP.
4. anhnn tự làm (thư mục bị deny với agent): sửa tên bản dựng `antoantaichinh-ban-dung-thu.html` thành `an-toan-tai-chinh-website.html` trong 3 README `docs/ke-hoach` (`anh/README.md`, `anh-v2/README.md`, `anh-v2/cong-cu/README_dau.md`); dán `docs/ban-giao/CUOC-THI/5-hang-muc-moi-cho-ke-hoach.md` vào sheet "Công việc" của xlsx, thêm hạng mục quay số theo cuộc (QĐ-025).
5. Dọn nhánh `lane/CUOC-THI-*`, `wip/CUOC-THI-F4b` khi không cần.

## Công cụ (nằm ngoài repo, ở `C:\GTSC\DMST`)

| Cái gì | Ở đâu | Dùng |
|---|---|---|
| Chạy một agent | `antc-agent.ps1` | `-Role orchestrator\|worker`, `-Prompt`, `-Lane`, `-Base`, `-AllowCommit`, `-Model sonnet`, `-MaxTurns`. Chạy nền. Ghi hồ sơ vào `agent-runs\`, log vào `agent-logs\` |
| **Chạy cả chuỗi không cần phiên điều phối** | `antc-pipeline.ps1` | `-Code CUOC-THI -Lane CUOC-THI-fe -Tasks F5,F6 [-ReviewEvery 2] [-MaxFixRounds 2] [-MaxRuns 12] [-DryRun]`. Làm → review (Sonnet) → sửa → task kế tiếp; dừng và báo khi cần quyết định. Mẫu lời giao việc ở `pipeline-prompts\`. Tên task phải có trong `1-thiet-ke.md`. Đã chạy thử thật, chạy tốt |
| Trang theo dõi | `agent-monitor\start.cmd` → http://127.0.0.1:8799 | Ai đang chạy, bao lâu, nút dừng. Cổng 8787 đã bị chương trình khác giữ |
| Worktree luồng | `wt\<luồng>` | Cổng web mỗi luồng ghi ở `wt\ports.json` |
| Ảnh, kết quả kiểm chứng | `agent-artifacts\` | Nơi chung để Orchestrator xem được |
| Cấu hình hai tài khoản | `C:\Users\Gearvn\.claude-orchestrator`, `.claude-worker`; cửa sổ VS Code `antc-orchestrator.code-workspace`, `antc-worker.code-workspace` | Mỗi bên một tài khoản Claude |

## Bài học (đã gặp, để khỏi lặp lại)

- Dừng web chỉ bằng PID của chính mình (qua cổng); **cấm `taskkill /IM dotnet.exe`** hay mọi lệnh diệt theo tên. Sau `dotnet build`, tắt máy chủ biên dịch bằng `dotnet build-server shutdown`.
- Orchestrator **không** build, không chạy web, không sửa `src/`; Worker không sửa tài liệu gốc và `docs/quyet-dinh.md`. Hai bên không nhắn tin trực tiếp, chỉ qua file.
- Mỗi luồng ghi bàn giao/review vào file riêng (`2-ban-giao-<luồng>.md`, `3-review-<luồng>.md`) để phiên song song không ghi cùng một file.
- Script chạy agent tự ép UTF-8 và tự thoát dấu nháy kép; nếu thấy chữ vỡ, kiểm tra hai điểm đó trước. Script `.ps1` chỉ dùng ký tự ASCII (PowerShell 5.1 đọc file không có BOM theo bảng mã ANSI); chữ tiếng Việt đặt trong file `.txt`/`.md` đọc bằng `-Encoding UTF8`.
- `git show <rev>:<file> > out` trong PowerShell làm hỏng file nhị phân (xlsx, png); dùng Bash.
- Chụp ảnh bản dựng: chế độ giảm chuyển động, công cụ ở `docs/ke-hoach/anh-v2/cong-cu/`.
- Kết nối tới máy chủ git (VPN) có lúc chập chờn: kiểm tra bằng `git ls-remote --heads origin dev` rồi mới đẩy; đẩy lúc kết nối đang thông.
- Phiên điều phối kéo dài rất tốn lượt dùng (xem "Tiết kiệm lượt dùng" trong `CLAUDE.md`).
