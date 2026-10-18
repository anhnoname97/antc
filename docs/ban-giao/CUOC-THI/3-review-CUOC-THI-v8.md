
## Review B15 (2026-10-18)

### Phạm vi đã review
- Commit `aa2bd67f` (một file: `App_Plugins/ContestManagement/contest-management.js`, form `openCampaign`, bước submit), so với `1-thiet-ke.md › Task B15` và báo cáo `2-ban-giao-CUOC-THI-v8.md › B15`.
- Không build, không chạy web, không mở form thật. Không đọc lại `b15-test.js`; dựa vào báo cáo của Worker.

### Đối chiếu tiêu chí
- Không đổi giờ-phút → gửi lại nguyên chuỗi đang lưu (`stored`), giữ giây và mili giây: đạt. So khớp bằng `localValue(stored)` (cắt đến phút, `contest-management.js:153`), cùng hàm đã dùng để điền giá trị vào ô nhập nên hai phía luôn cùng định dạng.
- Đổi giờ-phút → `endAt` giây :59, `startAt` giây :00, mili giây 0 (`t.setSeconds(second, 0)`): đạt, khớp cuộc mẫu B13 (`23:59:59`).
- `submitUntil` suy từ `endAt` + gia hạn ở máy chủ nên giữ nguyên khi `endAt` giữ nguyên: hợp lý, không cần sửa C#.
- Phạm vi: chỉ đổi đúng một dòng, không ngoài phạm vi. Không đụng contract API, schema, bảo mật.

### Phát hiện
Không có lỗi từ mức Thấp trở lên.

### Sai khác tài liệu ↔ code
Không có. Thiết kế cho phép sửa ở JS và/hoặc `ContestAdminService`; Worker chọn JS với lý do đúng (máy chủ không biết giờ-phút có bị đổi hay không).

### Cần xác minh (không chặn)
- Chưa mở form thật trong backoffice: nên kiểm khi chạy thử tiếp theo (mở cuộc thi có `endAt` 23:59:59, lưu không đổi, đọc lại `endAt`). Logic đơn giản và nhất quán với `localValue` nên rủi ro thấp.
- Không có test JS tự động trong repo (chưa có project test; thêm là quyết định kiến trúc) — chấp nhận.

### Đề xuất (không bắt buộc)
- Giả định của Worker "đổi giờ-phút của `startAt` thì giây về :00" hợp lý, không cần ghi quyết định.

### Worker phải sửa
Không.

### Cần người dùng xác nhận
Không.

### Kết luận
B15 đạt. Không còn việc bắt buộc.
