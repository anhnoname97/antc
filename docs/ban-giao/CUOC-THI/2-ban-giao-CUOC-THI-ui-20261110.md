# Bàn giao: chỉnh giao diện và nội dung trang cuộc thi theo bản chính thức 10/11/2026 (MinhNB)

Nguồn đối chiếu: `antoantaichinh-day-du-10-11-2026/nguon/src/app.js`, gồm `vHoatdong`, `vDangky`, `bankMenu`, `vThu` và bảng `ALIAS`.

## Người dùng đã chốt (10/11/2026), cần Orchestrator ghi vào `docs/quyet-dinh.md`

1. **Thứ tự chuyên đề theo bản HTML, thay QĐ-025.**
   - Quy tắc: làm Chuyên đề 1 trước; xong Chuyên đề 1 thì mở hết các chuyên đề còn lại, làm chuyên đề nào trước cũng được.
   - Nếu đề không có Chuyên đề 1 thì mở hết từ đầu.
   - Áp dụng cho cả thi và tự luyện.
   - Máy chủ không ép thứ tự, nên không phải sửa API.
2. **Phần "Dành cho nhân viên doanh nghiệp"** (78 câu tình huống, Phần A/B/C): chờ BE làm xong dữ liệu, API và luồng thi. Lần này không hiện.
3. **Chuyển hướng 301 hai trang cũ của bản v1:**
   - `/tham-gia/` → `/hay-tu-kiem-tra/`
   - `/cuoc-thi-truc-tuyen/` → `/cuoc-thi/`
   - Giữ nguyên tham số trên địa chỉ. Nội dung trong backoffice không đổi.
4. **Tiêu đề trang cuộc thi theo cuộc thi đang diễn ra** (tên cuộc thi), áp dụng cho `/cuoc-thi/` và `/thi/`. Không có cuộc thi nào thì dùng tiêu đề mặc định. Thay cho cách giữ tiêu đề cố định như bản HTML.

## Đã làm

- `wwwroot/assets/js/contest/exam.js`
  - `isLocked`/`prevTopic` theo quy tắc mới (mục 1).
  - Danh sách chuyên đề: khi chưa đăng ký thì hiện đường dẫn "Trang chủ › Hãy tự kiểm tra › Tự luyện"; khi đã đăng ký thì hiện nút "‹ Cuộc thi".
  - Bỏ dòng "Chế độ tự luyện".
- `wwwroot/assets/js/contest/register.js`: tiêu đề `#vh` lấy tên cuộc thi.
- `Views/Partials/blockgrid/Components/contestRegistrationBlock.cshtml` (`/thi/`), chữ theo `vDangky`:
  - Thêm câu về người dưới 16 tuổi.
  - Danh sách đồng ý: "Ai giữ thông tin", "Giữ trong bao lâu", "Quyền của bạn" và câu ở ô đồng ý.
  - Bỏ dòng "Bản dựng thử" và khối "Ghi chú cho chủ quản: người dự thi dưới 16 tuổi".
  - Thời gian mặc định: "Sẽ công bố tại trang này."
- `Views/Partials/blockgrid/Components/contestActivityBlock.cshtml` và `Views/thiThangPage.cshtml` (`/cuoc-thi/`): tiêu đề lấy tên cuộc thi đang diễn ra.
- `Views/thiThuPage.cshtml`: liên kết "Hãy tự kiểm tra" trên đường dẫn đổi từ `/tham-gia/` sang `/hay-tu-kiem-tra/`.
- `Umbraco.Plugin.Custom.Core/Content/AntcPublicRouting.cs`: hai chuyển hướng ở mục 3. Chỉ khớp đúng hai đường dẫn này và chỉ chuyển khi trang đích đã có template.
- Nội dung trang "Làm bài" (`2418b19a…`, block chuyên đề và thanh bên):
  - eyebrow "Kiểm tra kiến thức".
  - Lời dẫn: "Làm Chuyên đề 1 trước, vì cách quyết định học ở đó được dùng lại ở các chuyên đề sau…".
  - Câu "Website không trực 24/7…" theo bản HTML.

## Kiểm chứng

- `run-local` build và chạy được ("uSync: Startup Complete").
- `/tham-gia/` → 301 `/hay-tu-kiem-tra/`; `/cuoc-thi-truc-tuyen/` → 301 `/cuoc-thi/`; `?x=1` được giữ.
- `/thi/`, `/ngan-hang/`, `/cuoc-thi/`, `/thu-suc/` trả 200.
- `/cuoc-thi/` và `/thi/` hiện tiêu đề "Việc làm, làm thêm" (cuộc thi id 13 đang diễn ra).
- So chữ `/ngan-hang/` với `#thi` của bản HTML: còn khác "8 chuyên đề" so với "Tám chuyên đề" (số lấy theo đề), và "Hãy tự kiểm tra" so với "CÔNG CỤ KIỂM TRA" (theo QĐ-050). Phần doanh nghiệp không hiện (mục 2).
- **Chưa chạy thử** luồng mở khóa chuyên đề trên trình duyệt (làm xong Chuyên đề 1 rồi xem các chuyên đề khác có mở không).

## Còn lại

- Phần doanh nghiệp: chờ BE.
- `Views/Partials/_QuizDemo.cshtml` (bản v1) còn liên kết `/tham-gia/`; liên kết này đã được chuyển hướng 301.
