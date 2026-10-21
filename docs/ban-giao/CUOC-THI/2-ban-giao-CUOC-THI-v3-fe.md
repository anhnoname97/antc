# Bàn giao luồng CUOC-THI-v3-fe

## F7 · 2026-10-18 · Trang làm bài: chọn cuộc thi

Trạng thái: **xong, đã commit** trên `lane/CUOC-THI-v3-fe`. Chưa có `3-review-CUOC-THI-v3-fe.md` nên không có mục review cần xử lý; đã xử lý kèm các điểm F7 mà review F6 (`3-review-CUOC-THI-v2-fe.md`) dặn: gỡ nhánh mock khoan dung, truyền `contestId` dạng số.

Căn cứ: `1-thiet-ke.md` dòng F7 ("Làm được"), R5 (API-07, API-01), QĐ-024. Q1 (thi ẩn danh) còn mở; theo mặc định tạm giữ như hiện có.

### Đã làm (không sửa C#)
- `Views/Partials/contest/_LuongThi.cshtml`: bỏ `IContestSettings`, `periodText`, `data-max-attempts`, `isOpen`. Máy chủ không còn in tên, ngày, số lượt, trạng thái. Thêm vùng `#pickbox` (danh sách/thông báo) và `#regsec` (form đăng ký, ẩn tới khi chọn xong cuộc). Chữ "tối đa n lượt" là `<span data-max>`. Bỏ câu hero cứng "Tám chuyên đề, 200 câu… Làm Chuyên đề 1 trước…". Breadcrumb thêm mắt xích "Cuộc thi" (`contestPage.Url()`) và "Làm bài".
- `register.js`: tải API-07 (`getSchedule`), chọn cuộc:
  - `?c=<id>` đang `ongoing` → dùng; `?c` là cuộc sắp tới/đã kết thúc/không có/sai (`abc`) → thông báo nêu lý do + gợi ý các cuộc đang diễn ra;
  - không `?c`: 1 cuộc → dùng luôn; nhiều cuộc → danh sách chọn (tên, mô tả, ngày, số câu, số chuyên đề, "tối đa n lượt"); không cuộc → "Hiện chưa có cuộc thi đang diễn ra" + danh sách cuộc sắp tới + nút luyện tập sẵn có;
  - lỗi API-07 → thông báo + "Thử lại"; vẫn luyện tập được.
  - Gửi `contestId` (số) trong API-01; `ATTEMPT_LIMIT` dùng `maxAttempts` của cuộc; `CONTEST_CLOSED`/`CONTEST_NOT_FOUND` → khối "Chưa đăng ký được". Ngày hiển thị giờ Việt Nam (`Intl`, `Asia/Ho_Chi_Minh`). Link chọn cuộc giữ các tham số URL khác.
  - Export `requestedContestId()`.
- `exam.js`: `init`/`loadEntry` truyền `?c`; bỏ mặc định cứng 2 lượt (chỉ in "lượt thứ x trên n" khi có `maxAttempts` từ API); `contestOpen` đọc động từ `data-contest-status` do `register.js` đặt.
- `contest-api.js`: gỡ nhánh mock khoan dung (thiếu `contestId` giờ `VALIDATION`, như R5); thêm `?mock=one` (một cuộc đang diễn ra).
- `contest.css`: khối `.cinfo`, `.cpick__*`.

### Kiểm chứng (đã chạy thật)
- `.\run-local.ps1 -NoRun`: 0 lỗi, 70 cảnh báo cũ về gói.
- `dotnet run --no-build --urls http://localhost:11003` (log "Startup Complete"), trang `/cuoc-thi/lam-bai/` 200.
- Playwright + Edge (`python -I -X utf8 f7-kiem-chung.py`): **TAT CA DAT**, 40 kiểm tra: 2 cuộc (danh sách, chọn → `?c=`, tên/ngày/"tối đa" theo cuộc: cuộc 2 là 03, cuộc 1 là 02); 1 cuộc (vào thẳng, không link đổi cuộc); 0 cuộc có cuộc sắp tới (1440/744/390, không tràn ngang); `?c=3` sắp tới, `?c=4` đã kết thúc, `?c=99`, `?c=abc`; lỗi API-07 + thử lại; đăng ký cuộc 2 → `at_entry.entries["2"]` có `contestId` 2, `maxAttempts` 3, "lượt thứ 1 trên 3"; tải lại giữ lượt; `?c=1` chưa đăng ký vẫn ra form cuộc 1; `CONTEST_CLOSED` khi gửi; lượt thứ 3 ở cuộc tối đa 2 → `ATTEMPT_LIMIT` ghi "2 lượt"; không lỗi console.
- Ảnh và script ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v3-fe\`: `f7-2cuoc-{1440,744,390}.png`, `f7-1cuoc-1440.png`, `f7-0cuoc-{1440,744,390}.png`, `f7-dangky-{1440,744,390}.png`, `f7-saudangky-1440.png`, `f7-c-saptoi-1440.png`, `f7-kiem-chung.py`. Đã xem 2cuoc-1440 và 0cuoc-390: bố cục đúng.
- Dừng web bằng PID lấy từ cổng 11003. 5 view Umbraco tự ghi lại khi khởi động đã `git checkout`, không đưa vào commit.

### Chưa kiểm được / giới hạn
- Chỉ trên mock (`?mock=`): B6 đến B10 chưa vào nên API-07, `contestId` ở API-01 chưa thử với BE thật (kiểm ở I2). Không có `?mock` trên localhost thì trang gọi `/api/v1/contests` thật (chưa có, sẽ hiện thông báo lỗi tải).
- Ảnh chụp thấy header site chưa có kiểu (menu hiện dạng chữ thô) ở cả ảnh headless; không thuộc F7, chưa tìm nguyên nhân (có thể do CSS header tải sau lúc chụp).
- Chưa thử trình duyệt thật với hai tab (sự kiện `storage`).
- `document type cuocThiLamBaiPage` `hideFromSearch` (review dặn "cân nhắc"): không làm, thuộc uSync/luồng chính.

### Giả định và sai khác so với thiết kế
1. Không có `?c` nhưng đã có lượt lưu → vào thẳng lượt gần nhất (không hiện danh sách chọn); muốn đổi cuộc phải dùng link `?c=` hoặc "Chọn cuộc thi khác" (chỉ hiện ở màn đăng ký). Chưa có đường đổi cuộc từ màn làm bài (F8).
2. `exam.js` vẫn còn chữ "Chuyên đề 1 phải xong trước" (thuộc F8, chờ Q2).
3. `rulesText`, `rulesLink`, `dataRetentionDays` vẫn lấy từ `thiPage` cha (chung cho mọi cuộc); nội dung thể lệ theo cuộc không nằm trong API-07.
4. Thi ẩn danh giữ nguyên (Q1 mở).

TRANG-THAI: XONG
