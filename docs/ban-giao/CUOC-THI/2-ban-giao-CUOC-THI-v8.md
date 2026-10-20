
## B15 (2026-10-18): form sửa cuộc thi không làm mất giây của startAt/endAt

- **Sửa:** `src/ANTC.Portal.App/Umbraco.Web.UI/App_Plugins/ContestManagement/contest-management.js` (form `openCampaign`, bước submit). Thêm hàm `instant(field, stored, second)`:
  - giá trị `datetime-local` trùng (đến phút) với giá trị đang lưu → gửi lại nguyên chuỗi đang lưu (giữ giây và mili giây);
  - ngược lại → giây = `second`, mili giây = 0: `startAt` giây :00, `endAt` giây :59 (ví dụ `23:59:59`). Áp dụng cả khi tạo mới.
- Không sửa `ContestAdminService` (máy chủ không biết người dùng có đổi giờ-phút hay không).
- **Đã chạy:** `TZ=Asia/Ho_Chi_Minh node agent-artifacts/CUOC-THI-v8/b15-test.js` (bản sao logic `instant` + `localValue`): không đổi gì → `startAt`/`endAt` giữ nguyên (true, true); đổi `endAt` 22:30 → `22:30:59` giờ VN; tạo mới `23:59` → `23:59:59`. `node --check` file JS: đạt. File: `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v8\b15-test.js`.
- **Chưa kiểm:** chưa mở form thật trong backoffice trên trình duyệt (không chạy web); không có test JS tự động trong repo, chưa thêm project test (cần quyết định kiến trúc). `submitUntil` suy từ `endAt` + gia hạn ở máy chủ nên giữ nguyên theo `endAt`.
- **Giả định:** `startAt` đổi giờ-phút thì giây về :00. Chỉ đổi file JS, không đổi C#.
