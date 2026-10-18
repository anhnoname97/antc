# Ảnh chụp bản dựng v2

Ảnh chụp từng khối giao diện của **bản dựng v2** (`../../ban-dung/antoantaichinh-ban-dung-thu.html`), ở ba bề rộng theo kế hoạch: **1440px, 744px, 390px**. Thư mục này thay vai trò của `../anh/` (ảnh của bản dựng cũ, v1) cho mọi phần giao diện mà bản dựng v2 có.

## Dùng thế nào

- Tên ảnh có dạng `<trang>-<số>[chữ]-<khối>-<bề rộng>.png`. Chữ sau số (`b`, `c`, `d`) là trạng thái tương tác của cùng một khối (đã chọn, báo lỗi, đã gửi…); ảnh không có chữ là trạng thái ban đầu.
- Cột “Việc liên quan” theo sheet “Công việc” của kế hoạch hiện hành; nếu kế hoạch đổi thì sửa trong `cong-cu/muc_luc.py` rồi chạy lại.
- Ảnh là **tham chiếu giao diện**. Câu chữ chính thức, hành vi và tiêu chí nghiệm thu lấy từ kế hoạch và bản dựng.

## Chưa có trong ảnh v2

- **Luồng đăng ký và làm bài của cuộc thi** (đăng ký dự thi, danh sách chuyên đề, câu hỏi có đồng hồ đọc, nộp bài, kết quả; việc FE-25 đến FE-29): bản dựng v2 không có các màn này. Vẫn dùng các ảnh `th-01` … `th-11`, `mb-06`, `mb-07` trong `../anh/` (bản dựng v1) cho tới khi có bản dựng mới.
- Menu mở của header ở bề rộng hẹp, trạng thái chữ to (`A+ Chữ to`), trang quản trị, trang lỗi.

## Cách chụp (để làm lại khi bản dựng đổi)

- Mỗi trang con của bản dựng được tách ra thành một file riêng, rồi mở trong Microsoft Edge (Playwright) với chế độ **giảm chuyển động**: các hiệu ứng cuộn không chạy, mọi nội dung hiện sẵn.
- Ngoại lệ chụp ở chế độ chuyển động bình thường, chỉ ở 1440px, mỗi ảnh một mốc cuộn: 4 chương “Câu chuyện” (`gt-03a`–`d`) và 2 vị trí của hàng “bảy cách” (`td-03b`, `td-03c`). Ở 744px và 390px các khối này đã xếp dọc nên chụp tĩnh.
- Nút 113 nổi chỉ giữ ở ảnh hero trang Giới thiệu; các ảnh khác ẩn nó để không lọt vào giữa ảnh.
- Cách chạy, từ thư mục `cong-cu` (cần Python, `pip install playwright pillow`, và Microsoft Edge):

  ```powershell
  python extract_v2.py ../../../ban-dung/antoantaichinh-ban-dung-thu.html pages
  python capture.py ../tam      # chụp vào thư mục tạm, xem lại rồi mới chép đè lên ảnh cũ
  python muc_luc.py             # lập lại trang này
  ```

  `pages/` là file sinh ra, đã được git bỏ qua.

## Lưu ý về bản dựng

- Tiêu đề khối Thử sức ghi “Thử sức: 8 câu” nhưng bản dựng chỉ có **3 câu** (“Câu 1 / 3”).
- Kế hoạch trỏ tới bản dựng v2 bằng tên `an-toan-tai-chinh-website.html`; file trong repo tên `antoantaichinh-ban-dung-thu.html`.
- Nút “Đăng ký dự thi” trên trang Cuộc thi tháng ghi “Bản dựng thử: nút chưa mở bài thi thật”.
