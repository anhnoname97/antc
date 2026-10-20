
## B12 — Bỏ IContestSettings và cấu hình thiPage (2026-10-18)

**Đã làm** (nhánh lane/CUOC-THI-v5-be):
- Xóa `Contest/ContestSettings.cs` (record + enum `ContestStatus`) và `Contest/ContestSettingsService.cs` (`IContestSettings`).
- `CustomCoreComposer.cs`: bỏ đăng ký `IContestSettings`.
- `ContestAttemptService`: bỏ phụ thuộc `IContestSettings`; `maxAttempts` khi luot khong con cuoc = hằng riêng `DefaultMaxAttempts = 2` (trước đây rơi về giá trị đọc từ thiPage, mặc định 2).
- `ContestConfigCheck` vốn chỉ còn cảnh báo muối `Contest:IpHashSalt`, không phải sửa.
- Test: bỏ `NoSettings` và tham số tương ứng trong `ContestAttemptServiceTests`.

**Lệnh đã chạy và kết quả:**
- `dotnet build src/ANTC.Portal.App/ANTC.Portal.App.slnx`: 0 lỗi (70 cảnh báo, đã biết: ImageSharp/Pkcs).
- `dotnet test Umbraco.Plugin.Custom.Tests --no-build`: 95/95 qua.
- Grep `contestStart|contestEnd|maxAttempts|submitGraceHours|readTimerFactor|IContestSettings|ContestSettings` trong `*.cs` (trừ Migrations/bin/obj): chỉ còn tên trường JSON/DTO, kiểm tra hợp lệ của admin và dữ liệu theo `ContestCampaign`; không còn đọc từ Umbraco/thiPage.

**Chưa kiểm:** không chạy web (không cần theo cột "Cách kiểm chứng": build, test, Grep). Property `contestStart`... trên document type `thiPage` trong uSync vẫn còn (ngoài phạm vi task BE; đổi document type nên làm ở backoffice/uSync nếu muốn gỡ).

**Giả định:** hằng 2 giữ nguyên hành vi cũ cho luot khong cuoc. **Sai khác so với thiết kế:** không.

## S1 — Thanh thông báo và khối tổng quan dùng lịch cuộc thi (2026-10-18)

**Đã làm** (nhánh lane/CUOC-THI-v5-be, chỉ sửa 2 view):
- `Views/Partials/_ContestHeader.cshtml`: bỏ `contestMonth` (tháng tính từ `StartAt`). Thanh in "Cuộc thi đang diễn ra · {tên} · {ngày bắt đầu} – {ngày kết thúc}" (giờ VN); liên kết "Tham gia" trỏ `/cuoc-thi/lam-bai/?c={id}`. Cuộc lấy từ `ICurrentContestService` → `IContestCatalog.GetCurrentAsync` (phần tử đầu `ongoing`: bắt đầu muộn nhất). Không có cuộc → không in thanh.
- `competitionOverviewBlock.cshtml`: bỏ `contestMonth`; nhãn thẻ "THẺ DỰ THI · {bắt đầu} – {kết thúc}"; nút "Tham gia cuộc thi →" trỏ `/cuoc-thi/lam-bai/?c={id}`. Số câu / chuyên đề / lượt vẫn lấy từ cuộc (không viết cứng).

**Kiểm chứng** (web cổng 11004, CSDL riêng; dùng `curl`/urllib lấy HTML máy chủ in sẵn, tức không cần JavaScript):
- `.\run-local.ps1 -NoRun`: build 0 lỗi.
- 1 cuộc (cuộc mẫu B13): `/cuoc-thi/` 200; thanh và khối có tên, ngày, liên kết `?c=1`; 200 câu / 8 chuyên đề.
- 0 cuộc (`is_active=0` bằng sqlite3): không có thanh; khối hiện "Chưa mở cuộc thi".
- 2 cuộc ongoing (chèn thêm một cuộc bắt đầu muộn hơn): thanh và nút trỏ `?c=2` (cuộc bắt đầu muộn nhất). Đã xóa cuộc chèn, khôi phục `is_active=1`.
- Kết quả HTML: `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v5-be\s1-1cuoc.html`, `s1-0cuoc.html`, `s1-2cuoc.html`. Web đã dừng bằng PID 78324.

**Chưa kiểm:** không chụp ảnh giao diện 1440/390; không chạy `dotnet test` (không đổi C#); không tắt JavaScript trong trình duyệt thật (HTML kiểm trực tiếp từ máy chủ). Trang Ứng phó (không thanh, FE-32) không mở thử.

**Giả định / lưu ý:** (1) Bỏ dùng trường nội dung `entryLink` của khối cho nút (helper `L` còn trong view, chưa dùng). (2) Nhãn "Thi thật · tháng 10/2026" ở `/cuoc-thi/` là chữ nhập tay trong nội dung uSync (`cuộc-thi-trực-tuyến.config:299`), không phải view; ngoài phạm vi S1, nên sửa trong backoffice. **Sai khác so với thiết kế:** không.
