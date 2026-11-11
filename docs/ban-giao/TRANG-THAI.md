# Trạng thái điều phối

**Đọc file này đầu tiên khi mở một phiên điều phối mới**, rồi `CLAUDE.md` (mục "Làm việc hai agent" và "Tiết kiệm lượt dùng"). Cập nhật file này trước khi đóng phiên.

- Cập nhật lần cuối: 2026-10-18 (sau I2) · bởi phiên điều phối của anhnn
- Câu mở đầu cho phiên mới: *"Đọc `CLAUDE.md` và `docs/ban-giao/TRANG-THAI.md`, rồi làm tiếp theo mục Việc tiếp theo."*

## Việc khác đang làm

- **Gói BAN-CHINH-THUC** (từ 2026-11-10): portal-v2 theo bản chính thức `docs/portal-final/` (QĐ-057 → QĐ-062). Thiết kế Đợt 0–1 (BC-00 → BC-10) và danh sách Đợt 2 (2a → 2e) ở `docs/ban-giao/PORTAL-V2/ban-chinh-thuc/1-thiet-ke.md`. Đang chờ anhnn chốt X1 (người giữ nội dung), X2 (301 đường dẫn cũ), X3 (hệ quả mailto với section Hỏi – Đáp), X4 (phân công dev). Đã sửa và đẩy lỗi treo khởi động trên CSDL mới (09927795).

- **Portal v2 theo đặc tả 3 mục của khách** (từ 2026-11-02): đã chốt QĐ-032 → QĐ-049; danh mục cấu hình Umbraco, form và chia việc V2-00 → V2-13 ở `docs/ban-giao/PORTAL-V2/1-phan-tich-cau-hinh-umbraco.md`; mockup `PORTAL-V2/mockup-portal-v2.html`; danh mục chọn và chuẩn document type ở `PORTAL-V2/2-danh-muc-va-document-type.md`; đề xuất thay Block List ở `PORTAL-V2/3-thay-block-list.md` (chốt QĐ-042). Thiết kế và chia việc (62 task, khoảng 57 ngày công, alias từng trường) ở `PORTAL-V2/1-thiet-ke.md`; mọi CXN đã chốt (QĐ-042 → QĐ-048); kế hoạch Excel `PORTAL-V2/Ke-hoach-portal-v2.xlsx`. Tài liệu ở main đã commit (e74da11c) và gộp vào dev ở máy (797118bc, đã push origin/dev ngày 2026-11-03; thư mục chính đang ở nhánh dev; KHÔNG gộp dev vào main khi anhnn chưa bảo). V2-00b làm lại trên portal-v2 (đã tiến theo dev mới) (khi đó ở worktree riêng; từ 2026-11-04 bỏ worktree, làm portal-v2 ngay trong thư mục chính), đã commit 97b2bceb trên portal-v2 (chưa push). PDF dùng tệp tải lên (QĐ-049), V2-00 không còn chặn. Gói nền đã làm và push trên portal-v2 (c2fe4684, 2026-11-03): V2-01a → V2-01f, khung V2-01m, Thư viện 70 nút; hướng dẫn cho team ở PORTAL-V2/5-huong-dan-goi-nen.md (nhánh portal-v2); contract C5–C7 ở PORTAL-V2/4-contract-du-lieu.md. 2026-11-03: theo bản dựng mới `antoantaichinh_co_anh_nen_sang.html` (QĐ-050 đổi tên "Hãy tự kiểm tra", QĐ-051 logic kiểm tra nhanh và danh sách kiểm tra, QĐ-052 ảnh minh họa): đã sửa thiết kế, Phụ lục A, mockup, seed; V2-01r đã làm. QĐ-053: cây nội dung chia Quản lý trang và Quản lý nội dung, thêm V2-01s (cây), V2-01t (đường dẫn). Việc tiếp theo: V2-01h (kiểm danh mục), luồng V2-ui (V2-01i → V2-01q), V2-02a, V2-03a.
- **Làm mới giao diện backoffice** (từ 2026-10-27): review, mockup, chạy thử sửa core Umbraco. Trạng thái và việc tiếp theo xem `docs/ban-giao/BACKOFFICE-UI/0-tong-hop.md`.

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
