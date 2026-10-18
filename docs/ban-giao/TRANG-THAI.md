# Trạng thái điều phối

**Đọc file này đầu tiên khi mở một phiên điều phối mới**, rồi `CLAUDE.md` (mục "Làm việc hai agent" và "Tiết kiệm lượt dùng"). Cập nhật file này trước khi đóng phiên.

- Cập nhật lần cuối: 2026-10-18 · bởi phiên điều phối của anhnn
- Câu mở đầu cho phiên mới: *"Đọc `CLAUDE.md` và `docs/ban-giao/TRANG-THAI.md`, rồi làm tiếp theo mục Việc tiếp theo."*

## Tình hình

**Gói CUOC-THI đã thiết kế lại xong nhưng chưa có task nào làm được ngay: mọi việc chờ anhnn chốt CXN-A** (cách hợp nhất `dev` với `origin/main`). Agent đang tạm dừng, không có phiên nào chạy.

Lý do thiết kế lại: bản dựng đã đổi sang v2 và kế hoạch `Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` đã cập nhật; cuộc thi chuyển sang **cuộc thi theo thời gian** (QĐ-018). Ảnh mới ở `docs/ke-hoach/anh-v2/`; ảnh cũ `docs/ke-hoach/anh/` chỉ còn dùng cho luồng thi (`th-*`, `mb-06`, `mb-07`).

### Quyết định đã chốt trong phiên này (QĐ-017 đến QĐ-021, trong `docs/quyet-dinh.md`)

| QĐ | Nội dung |
|---|---|
| 017 | Nhánh `dev` gom công việc gói CUOC-THI; **chưa vào `main`** vì nhóm vẫn đang làm trên `main`. Cách hợp nhất với `origin/main` chưa quyết |
| 018 | Cuộc thi theo thời gian: mỗi cuộc có khoảng thời gian riêng; có thể mỗi tháng một cuộc, 2–3 cuộc/tháng, hoặc 2–3 tháng mới có một cuộc |
| 019 | Đề thi chọn khi tạo cuộc thi. Backoffice trên `origin/main` đã có: chọn chuyên đề rồi chọn từng câu (đã xác minh bằng git, chưa chạy thử) |
| 020 | Thêm việc Backend cho lịch cuộc thi (nguồn dữ liệu cho FE-32, FE-33, thẻ cuộc thi) |
| 021 | Số lượt tối đa cấu hình khi thêm cuộc thi; mỗi cuộc thi có lượt riêng |

QĐ-002, 003, 006, 008, 014, 015 đã được ghi chú "Cần xem lại" (vẫn hiệu lực).

### Nhánh và worktree

| Nơi | Nhánh | Tình trạng |
|---|---|---|
| Repo chính `C:\GTSC\DMST\26.antc-portal` | **`dev`** (đã đẩy lên máy chủ) | Gom hết: FE-25 + API-01, luồng BE B1–B4 (API-02..05), luồng FE F1–F4a, bản dựng v2, kế hoạch mới, ảnh v2, tài liệu điều phối, thiết kế lại. Build đạt (0 lỗi) |
| `C:\GTSC\DMST\wt\CUOC-THI-fe` | `lane/CUOC-THI-fe` | Sạch; đã nằm trong `dev` |
| (giữ lại) | `wip/CUOC-THI-F4b` (chỉ cục bộ) | F4b dở dang theo thiết kế v1, chưa kiểm chứng; không vào `dev`. Khuyến nghị giữ (Q6) |
| (giữ lại) | `feature/cuoc-thi`, `lane/CUOC-THI-be`, `feature/FE-25` | Đã gộp vào `dev`, giữ để tra lịch sử |

`main` local và `origin/main`: **không đụng**. `origin/main` của nhóm đi trước `dev` 33 commit (kiểm lần cuối `1de97372`); `dev` đi trước `origin/main` 22+ commit.

## Việc tiếp theo, theo thứ tự

Chi tiết và phương án ở `docs/ban-giao/CUOC-THI/1-thiet-ke.md`, mục **"Thiết kế lại theo cuộc thi theo thời gian (2026-10-18)"** (R0 đến R10).

1. **anhnn chốt CXN-A: cách hợp nhất `dev` với `origin/main`.** Ba phương án: (A) merge `origin/main` vào `dev` (khuyến nghị, giữ API-01 của `dev`, nhận project test của nhóm); (B) giữ `dev`, chỉ chép phần cuộc thi của `origin/main`; (C) nhánh mới từ `origin/main` rồi chuyển dần. Cần chốt thêm ai làm (Worker ở luồng `CUOC-THI-hopnhat` hay người trong nhóm) và có báo nhóm trước không.
2. Chốt các điểm còn lại, mỗi điểm chặn một số task: **CXN-B** schema (`entry.contest_id`, cột mới của `contest`, chặn đổi đề khi đã có lượt); **CXN-C** API-01 có `contestId`; **CXN-D** đề qua `QUIZ-01/02?contest=`; **CXN-E** API-07 lịch cuộc thi và nhãn lĩnh vực, thanh thông báo hiện cuộc nào khi nhiều cuộc cùng diễn ra; **CXN-F** chỗ đặt luồng thi (khuyến nghị document type mới `/cuoc-thi/lam-bai/?c=<id>`); **CXN-G** thay QĐ-008 bằng cuộc thi mẫu trong CSDL local.
3. Câu hỏi mở (Q1–Q7): thi ẩn danh; quy tắc "làm Chuyên đề 1 trước"; lượt làm dở khi hết cuộc; QĐ-016 (lộ đáp án) và câu hỏi OTP (QĐ-012); cách hợp nhất; F4b; quay số theo cuộc.
4. Ghi các điểm đã chốt thành QĐ (từ QĐ-022). Orchestrator sửa trạng thái task trong `1-thiet-ke.md`.
5. Mở luồng. Thứ tự dự kiến: CXN-A → M1a (merge) → CXN-F → M1b (trang làm bài riêng) → hai luồng be/fe. Khi thiết kế đã chốt và task ở trạng thái "Làm được", chạy bằng `antc-pipeline.ps1` cho đỡ tốn lượt dùng.
6. **Hạng mục mới cho kế hoạch:** `docs/ban-giao/CUOC-THI/5-hang-muc-moi-cho-ke-hoach.md` (10 hạng mục, BE-39 đến BE-45 và FE-35 đến FE-37, tổng ~7 ngày công; mã bắt đầu từ BE-39 vì kế hoạch đã dùng BE-30 đến BE-36 và BE-38). **anhnn dán vào sheet "Công việc" của xlsx**; agent không sửa xlsx.

### Cần biết khi gộp nhánh

- `origin/main` có `CLAUDE.md` riêng của nhóm; `dev` có `CLAUDE.md` khác. Sẽ trùng file khi merge: cần quyết định giữ thế nào (hoặc gộp nội dung).
- Trên `origin/main`, `thiPage` đã bỏ hết thuộc tính cấu hình cuộc thi nhưng API-01 vẫn đọc `contestStart/End` từ đó, nên đọc code thì API-01 ở đó luôn trả `403 CONTEST_CLOSED`. API-01 của `dev` khác ở: trả 400 khi thi ẩn danh gửi kèm thông tin cá nhân (`dev` bỏ qua), thiếu muối băm IP thì `origin/main` không khởi động (trái QĐ-009), không có `Cache-Control: no-store`.
- Báo cáo `4a` ghi sai một chỗ: `ContestSettings*` không bị xóa trên `origin/main`, chúng chỉ có ở `dev`.
- Trước khi làm việc BE/FE lớn: `git fetch`, rồi so với `origin/main`.

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
