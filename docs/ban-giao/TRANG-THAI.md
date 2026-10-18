# Trạng thái điều phối

**Đọc file này đầu tiên khi mở một phiên điều phối mới**, rồi `CLAUDE.md` (mục "Làm việc hai agent" và "Tiết kiệm lượt dùng"). Cập nhật file này trước khi đóng phiên.

- Cập nhật lần cuối: 2026-10-18 · bởi phiên điều phối của anhnn
- Câu mở đầu cho phiên mới: *"Đọc `CLAUDE.md` và `docs/ban-giao/TRANG-THAI.md`, rồi làm tiếp theo mục Việc tiếp theo."*

## Tình hình

**Gói CUOC-THI đang tạm dừng, chờ anhnn trả lời các câu hỏi chặn ở mục dưới.** Lý do tạm dừng: bản dựng giao diện đã đổi sang v2 và kế hoạch `Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` đã cập nhật (cả hai commit ở `05847bac`). Ảnh mới ở `docs/ke-hoach/anh-v2/`; ảnh cũ `docs/ke-hoach/anh/` chỉ còn dùng cho luồng thi (`th-*`, `mb-06`, `mb-07`).

### Nhánh và worktree

| Nơi | Nhánh | Tình trạng |
|---|---|---|
| Repo chính `C:\GTSC\DMST\26.antc-portal` | `feature/cuoc-thi` (`2f7565db`) | FE-25 + API-01 (đã vào `main` local), luồng BE B1 đến B4 (API-02 đến 05) đã merge, bản dựng v2, kế hoạch mới, ảnh v2. Chưa push |
| `C:\GTSC\DMST\wt\CUOC-THI-fe` | `lane/CUOC-THI-fe` | F1 (FE-28), F2 (FE-23), F3 (FE-26), F4a (màn câu hỏi) đã commit. **F4b dở dang: 3 file chưa commit** (`thiPage.cshtml`, `contest.css`, `exam.js`), làm theo thiết kế v1 |
| (nhánh giữ lại) | `lane/CUOC-THI-be`, `feature/FE-25` | Đã merge, giữ để tra lịch sử |

`main` local chưa có gì của gói CUOC-THI ngoài FE-25 và chưa từng được push. Không push khi chưa có BE-26 (QĐ-012).

### Chưa commit trong repo chính

`CLAUDE.md`, `.claude/skills/feature-design/SKILL.md`, `docs/quyet-dinh.md` (QĐ-002 đến QĐ-016), toàn bộ `docs/ban-giao/CUOC-THI/` (gồm hai báo cáo phân tích), file này. **Nên commit sớm** vì đây là sản phẩm của các lượt chạy; chờ anhnn đồng ý.

## Kết quả phân tích bản dựng v2 (xong 2026-10-18)

Báo cáo đầy đủ: `docs/ban-giao/CUOC-THI/4a-phan-tich-ke-hoach-moi.md` (kế hoạch mới so cũ, QĐ còn hiệu lực không) và `4b-phan-tich-ban-dung-v2-va-code.md` (bản dựng v2 so code). Mỗi báo cáo kết thúc bằng danh sách câu hỏi cần xác nhận.

1. **`origin/main` của nhóm đã đi trước `main` local 33 commit** (kiểm bằng git ngày 2026-10-18), của MinhNB (trang cuộc thi), AnVu29 (trang Ứng phó, header, footer), nguyentainam3011 (backend câu hỏi, CMS). Trên đó đã có một bản `ContestController` và `ContestEntryService` khác, các lớp quản trị cuộc thi (`ContestAdminController`, `ContestAdminService`), `QuizAdminController`, bảng `contest`, `contest_topic`, `contest_question`, một bộ kiểm tra dữ liệu đầu vào, project test; `ContestSettings`, `ContestSettingsService`, `ContestConfigCheck` của gói này bị xóa ở đó. **Code của gói CUOC-THI (FE-25, API-01 đến 05) trùng việc và nhiều khả năng xung đột với nhánh đó.** Cần biết nhánh nào là chuẩn trước khi làm tiếp bất cứ việc BE nào.
2. **Cuộc thi theo tháng chỉ mới có ở giao diện** (FE-32 thanh thông báo, FE-33 trang cuộc thi tháng, FE-34 hiệu ứng cuộn; thêm thẻ tháng vào FE-05, FE-12, FE-20, FE-24). Kế hoạch không có việc BE nào cho lịch tháng; sheet API, CSDL, Nội dung Umbraco không đổi.
3. **Mô hình dữ liệu hiện tại lệch v2:** `thiPage` chỉ có một khoảng ngày; bảng `entry` không có cột kỳ/tháng; ba chỗ đếm lượt (API-01, 04, 05) đếm trọn đời. Áp dụng "2 lượt trong tháng" thì phải sửa schema và contract (ảnh hưởng Lớn).
4. **Luồng thi (FE-25 đến FE-29) giữ nguyên** hành vi và API; v2 không có các màn này (nút "Đăng ký dự thi" trỏ về chính khối 4 bước), chỉ đổi khung và màu. Thiết kế và code luồng thi phần lớn dùng được (Nhỏ đến Vừa). FE-23 đổi màu đáp án sai sang hổ phách, code đang tô đỏ.
5. **8 chuyên đề của lịch tháng không khớp ngân hàng câu hỏi**: chỉ 6 khớp; "Mạng xã hội, tài khoản bị chiếm" và "Bảo hiểm, y tế, chính sách" chưa có câu nào.
6. **QĐ cần xem lại:** QĐ-003, 006, 008, 014, 015, 016 (QĐ-016: v2 có giải tiền mặt 2.000.000 đồng/tháng, đúng điều kiện mà chính QĐ-016 nói phải xem lại). Các QĐ còn lại còn hiệu lực. File docx mô tả FE đã lỗi thời ở toàn bộ phần giao diện.
7. **Ước lượng công làm lại (thô):** P1 (mỗi tháng thi lại 200 câu cả 8 chuyên đề) 5–6,5 ngày công; P2 (mỗi tháng một đề riêng theo chuyên đề tháng) 8,5–11,5 ngày công. Chưa gồm FE-01, FE-32, FE-33 và nội dung câu hỏi mới.

### Câu hỏi đang chặn (đầy đủ ở cuối hai báo cáo)

1. Nhánh nào là chuẩn: `origin/main` hay `feature/cuoc-thi`? Hợp nhất thế nào?
2. Cuộc thi có thật sự chuyển sang mỗi tháng một kỳ riêng không?
3. Đề mỗi tháng: P1 hay P2?
4. Lịch tháng lưu ở đâu, và việc BE nào làm (FE-32 cần nguồn dữ liệu này)?
5. "Tối đa 2 lượt" tính trong mỗi tháng hay cả chương trình?
6. Sau đó: giữ thi ẩn danh không; giữ quy tắc "làm Chuyên đề 1 trước" không; lượt làm dở khi hết tháng xử lý thế nào.

## Việc tiếp theo, theo thứ tự

1. anhnn lấy câu trả lời cho nhóm câu hỏi chặn (đặc biệt câu 1, có thể cần hỏi nhóm: ai đang làm API cuộc thi ở `origin/main`). **Chưa mở lại agent nào cho tới khi chốt nhánh chuẩn.**
2. Ghi các quyết định thành QĐ mới (từ QĐ-017) trong `docs/quyet-dinh.md`; đổi trạng thái các QĐ bị thay.
3. Orchestrator cập nhật `1-thiet-ke.md` và chia lại task theo v2 và nhánh chuẩn (`/feature-design`).
4. Mở lại các luồng. F4b dở dang chỉ giữ nếu còn hợp; phần logic làm bài (F1, F2 JS, F4a) ít phụ thuộc mô hình tháng.
5. Chờ chủ quản: câu hỏi OTP (QĐ-012) và rủi ro lộ đáp án (QĐ-016).

## Công cụ (nằm ngoài repo, ở `C:\GTSC\DMST`)

| Cái gì | Ở đâu | Dùng |
|---|---|---|
| Chạy một agent | `antc-agent.ps1` | `-Role orchestrator\|worker`, `-Prompt`, `-Lane`, `-Base`, `-AllowCommit`, `-Model sonnet`, `-MaxTurns`. Chạy nền. Ghi hồ sơ vào `agent-runs\`, log vào `agent-logs\` |
| **Chạy cả chuỗi không cần phiên điều phối** | `antc-pipeline.ps1` | `-Code CUOC-THI -Lane CUOC-THI-fe -Tasks F5,F6 [-ReviewEvery 2] [-MaxFixRounds 2] [-MaxRuns 12] [-DryRun]`. Làm → review (Sonnet) → sửa → task kế tiếp; dừng và báo khi cần quyết định. Mẫu lời giao việc ở `pipeline-prompts\`. Tên task phải có trong `1-thiet-ke.md` |
| Trang theo dõi | `agent-monitor\start.cmd` → http://127.0.0.1:8799 | Ai đang chạy, bao lâu, nút dừng. Cổng 8787 đã bị chương trình khác giữ |
| Worktree luồng | `wt\<luồng>` | Cổng web mỗi luồng ghi ở `wt\ports.json` |
| Ảnh, kết quả kiểm chứng | `agent-artifacts\` | Nơi chung để Orchestrator xem được |
| Cấu hình hai tài khoản | `C:\Users\Gearvn\.claude-orchestrator`, `.claude-worker`; cửa sổ VS Code `antc-orchestrator.code-workspace`, `antc-worker.code-workspace` | Mỗi bên một tài khoản Claude |

## Bài học (đã gặp, để khỏi lặp lại)

- Dừng web chỉ bằng PID của chính mình (qua cổng); **cấm `taskkill /IM dotnet.exe`** hay mọi lệnh diệt theo tên.
- Orchestrator **không** build, không chạy web, không sửa `src/`; Worker không sửa tài liệu gốc và `docs/quyet-dinh.md`. Hai bên không nhắn tin trực tiếp, chỉ qua file.
- Mỗi luồng ghi bàn giao/review vào file riêng (`2-ban-giao-<luồng>.md`, `3-review-<luồng>.md`) để phiên song song không ghi cùng một file.
- Script chạy agent tự ép UTF-8 và tự thoát dấu nháy kép; nếu thấy chữ vỡ, kiểm tra hai điểm đó trước. Script `.ps1` chỉ dùng ký tự ASCII (PowerShell 5.1 đọc file không có BOM theo bảng mã ANSI); chữ tiếng Việt đặt trong file `.txt`/`.md` đọc bằng `-Encoding UTF8`.
- `git show <rev>:<file> > out` trong PowerShell làm hỏng file nhị phân (xlsx, png); dùng Bash.
- Chụp ảnh bản dựng: chế độ giảm chuyển động, công cụ ở `docs/ke-hoach/anh-v2/cong-cu/`.
- Nhóm đang làm song song trên `origin/main`: trước khi làm việc BE/FE lớn, `git fetch` rồi so với `origin/main`.
- Phiên điều phối kéo dài rất tốn lượt dùng (xem "Tiết kiệm lượt dùng" trong `CLAUDE.md`).
