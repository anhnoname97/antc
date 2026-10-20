# Review luồng CUOC-THI-v2-chinh

Người ghi: Orchestrator.

## Review M1b · 2026-10-18 · Trang làm bài riêng

Commit `1aead564` (khoảng `f89eb861..HEAD`, một commit), nhánh `lane/CUOC-THI-v2-chinh`.

### Phạm vi đã review
- Diff 12 file: định tuyến C# (`AntcPublicPaths`, `AntcPublicRouting`, `PageTreeRules`), test, view `cuocThiLamBaiPage.cshtml`, `_LuongThi.cshtml`, `_SiteLayout.cshtml`, các file uSync mới/sửa, nội dung `thiPage`.
- Chuẩn so sánh: `1-thiet-ke.md` task M1b (R6) và CXN-F; QĐ-024 (F); báo cáo Worker.
- Không review: giao diện bằng mắt (không mở ảnh theo yêu cầu; dựa vào kiểm DOM/`scrollWidth` Worker ghi); không build, không chạy web.

### Đối chiếu tiêu chí
| Tiêu chí M1b | Kết quả |
|---|---|
| Document type + template `cuocThiLamBaiPage`, con của `thiPage`, `/cuoc-thi/lam-bai/` | Đạt: uSync content type (AllowAtRoot false, composition `seoBase`), template, content (Parent = key `thiPage` đúng, Path/Level 5 khớp), `thiPage.Structure` cho phép con |
| Template render `_LuongThi.cshtml` | Đạt: view mới nạp CSS/JS rồi gọi partial; partial bỏ Layout/section, đọc cài đặt cuộc từ `thiPage` cha (`Model.Parent` có dự phòng `?? Model`) |
| Liên kết thẻ dự thi của khối tổng quan trỏ trang mới | Đạt: `entryLink` `/thu-suc/` thành `/cuoc-thi/lam-bai/` |
| Trang mở được, luồng cũ hiển thị như trước (API-01 còn đóng là đúng) | Đạt theo báo cáo: 5 URL 200, có `#regview`, `contest-quiz.css`, `exam.js`; trạng thái "đóng" đúng kỳ vọng |
| Kiểm file uSync mới | Đạt: 3 file mới + 2 file sửa đều nằm trong commit |

Việc ngoài phạm vi: không có. Mở rộng `contestStyle` trong `_SiteLayout` là cần thiết (header cuộc thi).

### Phát hiện
Không có lỗi từ mức Trung bình trở lên.

#### [Thấp] Breadcrumb trang làm bài thiếu mắt xích "Cuộc thi"
- Vị trí: `Views/Partials/contest/_LuongThi.cshtml` (thẻ `<nav class="crumb">`, không đổi trong commit).
- Bằng chứng: trang nay nằm dưới `/cuoc-thi/` nhưng breadcrumb vẫn là "Trang chủ / Phần 4 / Cuộc thi", không có liên kết tới trang cuộc thi.
- Hướng sửa: để F7 (sửa chính view này) xử lý nếu bản dựng v2 yêu cầu; không chặn M1b.

### Sai khác tài liệu và code
- Thiết kế ghi "tạo trong backoffice"; Worker viết tay uSync theo mẫu có sẵn. Chấp nhận được.

### Cần xác minh (không chặn)
1. Nhập uSync trên CSDL trống (`-Reset`): Worker chưa thử, rủi ro thấp (khóa tham chiếu khớp). Kiểm khi chạy `-Reset` ở B13/I2.
2. Giao diện 1440/390 chưa ai xem bằng mắt; gộp vào bước xem ảnh của F7.
3. `hideFromSearch` của trang làm bài để trống; cân nhắc đặt `true` nếu không muốn trang này vào kết quả tìm kiếm.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
M1b đạt. Báo cáo ghi build 0 lỗi, 54 test đạt (tôi không tự chạy lại theo quy định). Có thể chuyển sang các task phụ thuộc M1b (F7).
