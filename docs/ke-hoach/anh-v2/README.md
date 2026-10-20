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

## Trang Giới thiệu (`#gioi-thieu`)

| Khối / trạng thái | Việc liên quan | 1440px | 744px | 390px |
|---|---|---|---|---|
| `gt-01-hero` · Hero mở màn: thanh thông báo cuộc thi tháng, header, nút 113 nổi, thẻ cuộc thi tháng | FE-05, FE-02, FE-04, FE-32, BE-10 | [ảnh](gt-01-hero-1440.png) | [ảnh](gt-01-hero-744.png) | [ảnh](gt-01-hero-390.png) |
| `gt-02-nam-phan` · Khối “Năm phần” (dòng thời gian dọc) | FE-06 | [ảnh](gt-02-nam-phan-1440.png) | [ảnh](gt-02-nam-phan-744.png) | [ảnh](gt-02-nam-phan-390.png) |
| `gt-03-cau-chuyen` · Khối “Câu chuyện” 4 chương (744px và 390px: các chương xếp dọc) | FE-06, FE-34 | — | [ảnh](gt-03-cau-chuyen-744.png) | [ảnh](gt-03-cau-chuyen-390.png) |
| `gt-03a-cau-chuyen-chuong-1` · Câu chuyện, chương 1: một tin nhắn đến (chuyển động bình thường, 1440px) | FE-06, FE-34 | [ảnh](gt-03a-cau-chuyen-chuong-1-1440.png) | — | — |
| `gt-03b-cau-chuyen-chuong-2` · Câu chuyện, chương 2: chúng tôi sẽ không bao giờ làm vậy | FE-06, FE-34 | [ảnh](gt-03b-cau-chuyen-chuong-2-1440.png) | — | — |
| `gt-03c-cau-chuyen-chuong-3` · Câu chuyện, chương 3: vậy chúng tôi là ai | FE-06, FE-34 | [ảnh](gt-03c-cau-chuyen-chuong-3-1440.png) | — | — |
| `gt-03d-cau-chuyen-chuong-4` · Câu chuyện, chương 4: chỉ một địa chỉ duy nhất | FE-06, FE-34 | [ảnh](gt-03d-cau-chuyen-chuong-4-1440.png) | — | — |
| `gt-04-mot-dia-chi` · Khối “Một địa chỉ thật giữa muôn vàn bản giả” và câu đố “Trang nào là website thật?” | FE-07 | [ảnh](gt-04-mot-dia-chi-1440.png) | [ảnh](gt-04-mot-dia-chi-744.png) | [ảnh](gt-04-mot-dia-chi-390.png) |
| `gt-04b-mot-dia-chi-diem-1` · Trạng thái: bấm điểm chú thích số 1 | FE-07 | [ảnh](gt-04b-mot-dia-chi-diem-1-1440.png) | [ảnh](gt-04b-mot-dia-chi-diem-1-744.png) | [ảnh](gt-04b-mot-dia-chi-diem-1-390.png) |
| `gt-04c-trang-nao-that-chon-a` · Trạng thái câu đố: chọn đáp án A (sai) | FE-07 | [ảnh](gt-04c-trang-nao-that-chon-a-1440.png) | [ảnh](gt-04c-trang-nao-that-chon-a-744.png) | [ảnh](gt-04c-trang-nao-that-chon-a-390.png) |
| `gt-04d-trang-nao-that-chon-b` · Trạng thái câu đố: chọn đáp án B (đúng) | FE-07 | [ảnh](gt-04d-trang-nao-that-chon-b-1440.png) | [ảnh](gt-04d-trang-nao-that-chon-b-744.png) | [ảnh](gt-04d-trang-nao-that-chon-b-390.png) |
| `gt-05-ba-kenh` · Khối “Ba kênh chính thức” và hộp tố giác | FE-07, BE-06 | [ảnh](gt-05-ba-kenh-1440.png) | [ảnh](gt-05-ba-kenh-744.png) | [ảnh](gt-05-ba-kenh-390.png) |
| `gt-06-dung-lai` · Phần kết “DỪNG”: ai tự xưng là chúng tôi mà hỏi mã OTP | FE-07 | [ảnh](gt-06-dung-lai-1440.png) | [ảnh](gt-06-dung-lai-744.png) | [ảnh](gt-06-dung-lai-390.png) |
| `gt-07-chan-trang` · Chân trang (dùng chung mọi trang) | FE-02, BE-05 | [ảnh](gt-07-chan-trang-1440.png) | [ảnh](gt-07-chan-trang-744.png) | [ảnh](gt-07-chan-trang-390.png) |

## Trang Ứng phó khẩn cấp (`#ung-pho`)

| Khối / trạng thái | Việc liên quan | 1440px | 744px | 390px |
|---|---|---|---|---|
| `up-01-hero` · Hero trang Ứng phó (không có thanh thông báo cuộc thi) | FE-08, FE-09 | [ảnh](up-01-hero-1440.png) | [ảnh](up-01-hero-744.png) | [ảnh](up-01-hero-390.png) |
| `up-02-chon-tinh-huong` · Khối chọn tình huống: 3 ô lớn và 2 lối phụ | FE-09 | [ảnh](up-02-chon-tinh-huong-1440.png) | [ảnh](up-02-chon-tinh-huong-744.png) | [ảnh](up-02-chon-tinh-huong-390.png) |
| `up-03-dau-hieu` · Khối “Chỉ cần 1 dấu hiệu: dừng lại”, chưa đánh dấu | FE-10 | [ảnh](up-03-dau-hieu-1440.png) | [ảnh](up-03-dau-hieu-744.png) | [ảnh](up-03-dau-hieu-390.png) |
| `up-03b-dau-hieu-da-danh-dau-1` · Trạng thái: đã đánh dấu 1 dấu hiệu (hộp “Dừng lại ngay”) | FE-10 | [ảnh](up-03b-dau-hieu-da-danh-dau-1-1440.png) | [ảnh](up-03b-dau-hieu-da-danh-dau-1-744.png) | [ảnh](up-03b-dau-hieu-da-danh-dau-1-390.png) |
| `up-03c-dau-hieu-da-danh-dau-2` · Trạng thái: đã đánh dấu 2 dấu hiệu | FE-10 | [ảnh](up-03c-dau-hieu-da-danh-dau-2-1440.png) | [ảnh](up-03c-dau-hieu-da-danh-dau-2-744.png) | [ảnh](up-03c-dau-hieu-da-danh-dau-2-390.png) |
| `up-04-hai-cau-tu-hoi` · Khối “Không thấy dấu hiệu nào không có nghĩa là an toàn” (hai câu tự hỏi) | FE-10 | [ảnh](up-04-hai-cau-tu-hoi-1440.png) | [ảnh](up-04-hai-cau-tu-hoi-744.png) | [ảnh](up-04-hai-cau-tu-hoi-390.png) |
| `up-05-so-can-biet` · Khối “Gọi ai, theo thứ tự nào” (số cần biết) | FE-10, BE-06 | [ảnh](up-05-so-can-biet-1440.png) | [ảnh](up-05-so-can-biet-744.png) | [ảnh](up-05-so-can-biet-390.png) |
| `up-06-tiep-theo` · Dải “Phần tiếp theo” dùng chung cho các trang con | — | [ảnh](up-06-tiep-theo-1440.png) | [ảnh](up-06-tiep-theo-744.png) | [ảnh](up-06-tiep-theo-390.png) |

## Trang Thủ đoạn (`#thu-doan`)

| Khối / trạng thái | Việc liên quan | 1440px | 744px | 390px |
|---|---|---|---|---|
| `td-01-hero` · Hero trang Thủ đoạn có ô tìm kiếm | FE-08, FE-11, BE-09 | [ảnh](td-01-hero-1440.png) | [ảnh](td-01-hero-744.png) | [ảnh](td-01-hero-390.png) |
| `td-02-bon-thu` · Khối “Họ muốn lấy một trong bốn thứ” | FE-11 | [ảnh](td-02-bon-thu-1440.png) | [ảnh](td-02-bon-thu-744.png) | [ảnh](td-02-bon-thu-390.png) |
| `td-03-cach-ho-lam` · Khối “Họ thường dùng một hoặc nhiều cách sau” (bảy cách; 1440px thấy 4 thẻ đầu, 744px và 390px xếp dọc đủ bảy) | FE-11 | [ảnh](td-03-cach-ho-lam-1440.png) | [ảnh](td-03-cach-ho-lam-744.png) | [ảnh](td-03-cach-ho-lam-390.png) |
| `td-03b-cach-ho-lam-giua` · Bảy cách trượt ngang, vị trí giữa (04/07), chuyển động bình thường, 1440px | FE-11 | [ảnh](td-03b-cach-ho-lam-giua-1440.png) | — | — |
| `td-03c-cach-ho-lam-cuoi` · Bảy cách trượt ngang, vị trí cuối (07/07), 1440px | FE-11 | [ảnh](td-03c-cach-ho-lam-cuoi-1440.png) | — | — |
| `td-04-theo-linh-vuc` · Khối “Thủ đoạn theo từng lĩnh vực” (có nhãn chuyên đề tháng) | FE-12, BE-13, FE-32 | [ảnh](td-04-theo-linh-vuc-1440.png) | [ảnh](td-04-theo-linh-vuc-744.png) | [ảnh](td-04-theo-linh-vuc-390.png) |
| `td-05-canh-bao-moi` · Khối “Xu hướng và cảnh báo mới” và “Tìm hiểu sâu” | FE-12, BE-07, BE-13 | [ảnh](td-05-canh-bao-moi-1440.png) | [ảnh](td-05-canh-bao-moi-744.png) | [ảnh](td-05-canh-bao-moi-390.png) |
| `td-06-tiep-theo` · Dải “Phần tiếp theo” dùng chung cho các trang con | — | [ảnh](td-06-tiep-theo-1440.png) | [ảnh](td-06-tiep-theo-744.png) | [ảnh](td-06-tiep-theo-390.png) |

## Trang Cuộc thi (`#cuoc-thi`)

| Khối / trạng thái | Việc liên quan | 1440px | 744px | 390px |
|---|---|---|---|---|
| `ct-01-hero` · Hero trang Cuộc thi | FE-08, FE-20 | [ảnh](ct-01-hero-1440.png) | [ảnh](ct-01-hero-744.png) | [ảnh](ct-01-hero-390.png) |
| `ct-02-200-cau-8-chuyen-de` · Khối “200 câu hỏi, 8 chuyên đề” và thẻ dự thi tháng này | FE-20, FE-32 | [ảnh](ct-02-200-cau-8-chuyen-de-1440.png) | [ảnh](ct-02-200-cau-8-chuyen-de-744.png) | [ảnh](ct-02-200-cau-8-chuyen-de-390.png) |
| `ct-03a-thu-suc-chua-chon` · Thử sức: câu 1, chưa chọn | FE-24, FE-23 | [ảnh](ct-03a-thu-suc-chua-chon-1440.png) | [ảnh](ct-03a-thu-suc-chua-chon-744.png) | [ảnh](ct-03a-thu-suc-chua-chon-390.png) |
| `ct-03b-thu-suc-chon-dap-an-a` · Thử sức: chọn đáp án A (chưa đúng, có giải thích) | FE-24, FE-23 | [ảnh](ct-03b-thu-suc-chon-dap-an-a-1440.png) | [ảnh](ct-03b-thu-suc-chon-dap-an-a-744.png) | [ảnh](ct-03b-thu-suc-chon-dap-an-a-390.png) |
| `ct-03c-thu-suc-chon-dap-an-b` · Thử sức: chọn đáp án B (chính xác) | FE-24, FE-23 | [ảnh](ct-03c-thu-suc-chon-dap-an-b-1440.png) | [ảnh](ct-03c-thu-suc-chon-dap-an-b-744.png) | [ảnh](ct-03c-thu-suc-chon-dap-an-b-390.png) |
| `ct-03d-thu-suc-ket-qua` · Thử sức: màn kết quả và lời mời thi thật | FE-24 | [ảnh](ct-03d-thu-suc-ket-qua-1440.png) | [ảnh](ct-03d-thu-suc-ket-qua-744.png) | [ảnh](ct-03d-thu-suc-ket-qua-390.png) |
| `ct-04-gop-y-chia-se` · Khối “Góp ý cho Chương trình” và “Chia sẻ cho người thân” | FE-20 | [ảnh](ct-04-gop-y-chia-se-1440.png) | [ảnh](ct-04-gop-y-chia-se-744.png) | [ảnh](ct-04-gop-y-chia-se-390.png) |
| `ct-05-tiep-theo` · Dải “Phần tiếp theo” dùng chung cho các trang con | — | [ảnh](ct-05-tiep-theo-1440.png) | [ảnh](ct-05-tiep-theo-744.png) | [ảnh](ct-05-tiep-theo-390.png) |

## Trang Hỏi – Đáp (`#hoi-dap`)

| Khối / trạng thái | Việc liên quan | 1440px | 744px | 390px |
|---|---|---|---|---|
| `hd-01-hero` · Hero trang Hỏi – Đáp | FE-08, FE-21 | [ảnh](hd-01-hero-1440.png) | [ảnh](hd-01-hero-744.png) | [ảnh](hd-01-hero-390.png) |
| `hd-02-hoi-rieng-tra-loi-cong-khai` · Khối “Hỏi riêng, trả lời công khai” (ba bước) | FE-21 | [ảnh](hd-02-hoi-rieng-tra-loi-cong-khai-1440.png) | [ảnh](hd-02-hoi-rieng-tra-loi-cong-khai-744.png) | [ảnh](hd-02-hoi-rieng-tra-loi-cong-khai-390.png) |
| `hd-03-gui-cau-hoi` · Form “Gửi câu hỏi, kiến nghị” và hộp “Trước khi gõ” | FE-22, BE-25 | [ảnh](hd-03-gui-cau-hoi-1440.png) | [ảnh](hd-03-gui-cau-hoi-744.png) | [ảnh](hd-03-gui-cau-hoi-390.png) |
| `hd-03b-form-canh-bao-so-nhay-cam` · Trạng thái: cảnh báo khi gõ chuỗi từ 6 chữ số trở lên (nút gửi khóa) | FE-22 | [ảnh](hd-03b-form-canh-bao-so-nhay-cam-1440.png) | [ảnh](hd-03b-form-canh-bao-so-nhay-cam-744.png) | [ảnh](hd-03b-form-canh-bao-so-nhay-cam-390.png) |
| `hd-03c-form-da-nhap` · Trạng thái: đã nhập đủ, tick nhận trả lời riêng, nút gửi mở | FE-22 | [ảnh](hd-03c-form-da-nhap-1440.png) | [ảnh](hd-03c-form-da-nhap-744.png) | [ảnh](hd-03c-form-da-nhap-390.png) |
| `hd-03d-form-da-gui` · Trạng thái: đã gửi | FE-22, BE-25 | [ảnh](hd-03d-form-da-gui-1440.png) | [ảnh](hd-03d-form-da-gui-744.png) | [ảnh](hd-03d-form-da-gui-390.png) |
| `hd-04-da-tra-loi` · Khối “Câu hỏi đã được trả lời” | FE-21, BE-08 | [ảnh](hd-04-da-tra-loi-1440.png) | [ảnh](hd-04-da-tra-loi-744.png) | [ảnh](hd-04-da-tra-loi-390.png) |
| `hd-05-tiep-theo` · Dải “Phần tiếp theo” dùng chung cho các trang con | — | [ảnh](hd-05-tiep-theo-1440.png) | [ảnh](hd-05-tiep-theo-744.png) | [ảnh](hd-05-tiep-theo-390.png) |

## Trang Cuộc thi tháng (`#cuoc-thi-thang`)

| Khối / trạng thái | Việc liên quan | 1440px | 744px | 390px |
|---|---|---|---|---|
| `ctt-01-hero` · Hero trang Cuộc thi tháng: chuyên đề, ngày thi, nút “Đăng ký dự thi” | FE-33, FE-08, FE-32 | [ảnh](ctt-01-hero-1440.png) | [ảnh](ctt-01-hero-744.png) | [ảnh](ctt-01-hero-390.png) |
| `ctt-02-cach-nhan-ra-cuoc-thi-that` · Dải xanh “Cách nhận ra cuộc thi thật” | FE-33 | [ảnh](ctt-02-cach-nhan-ra-cuoc-thi-that-1440.png) | [ảnh](ctt-02-cach-nhan-ra-cuoc-thi-that-744.png) | [ảnh](ctt-02-cach-nhan-ra-cuoc-thi-that-390.png) |
| `ctt-03-tham-gia-4-buoc` · Khối “Tham gia trong bốn bước” (thể lệ 01–04) | FE-33 | [ảnh](ctt-03-tham-gia-4-buoc-1440.png) | [ảnh](ctt-03-tham-gia-4-buoc-744.png) | [ảnh](ctt-03-tham-gia-4-buoc-390.png) |
| `ctt-04-giai-thuong` · Khối “Giải thưởng tháng này” và hộp “Nhận giải thế nào?” | FE-33 | [ảnh](ctt-04-giai-thuong-1440.png) | [ảnh](ctt-04-giai-thuong-744.png) | [ảnh](ctt-04-giai-thuong-390.png) |
| `ctt-05-lich-ca-nam` · Khối “Mỗi tháng một chuyên đề” (lịch 8 tháng) | FE-33, FE-32 | [ảnh](ctt-05-lich-ca-nam-1440.png) | [ảnh](ctt-05-lich-ca-nam-744.png) | [ảnh](ctt-05-lich-ca-nam-390.png) |
| `ctt-06-ket-qua-thang-truoc` · Khối “Kết quả cuộc thi tháng 9/2026” và bảng đoạt giải | FE-33 | [ảnh](ctt-06-ket-qua-thang-truoc-1440.png) | [ảnh](ctt-06-ket-qua-thang-truoc-744.png) | [ảnh](ctt-06-ket-qua-thang-truoc-390.png) |
| `ctt-07-thac-mac-thuong-gap` · Khối “Thắc mắc thường gặp” và ô nhắc lịch tháng sau | FE-33 | [ảnh](ctt-07-thac-mac-thuong-gap-1440.png) | [ảnh](ctt-07-thac-mac-thuong-gap-744.png) | [ảnh](ctt-07-thac-mac-thuong-gap-390.png) |
| `ctt-07b-thac-mac-mo-cau-1` · Trạng thái: mở câu hỏi thường gặp đầu tiên | FE-33 | [ảnh](ctt-07b-thac-mac-mo-cau-1-1440.png) | [ảnh](ctt-07b-thac-mac-mo-cau-1-744.png) | [ảnh](ctt-07b-thac-mac-mo-cau-1-390.png) |
| `ctt-07c-nhac-lich-da-gui` · Trạng thái: đã đăng ký nhắc lịch bằng thư điện tử | FE-33 | [ảnh](ctt-07c-nhac-lich-da-gui-1440.png) | [ảnh](ctt-07c-nhac-lich-da-gui-744.png) | [ảnh](ctt-07c-nhac-lich-da-gui-390.png) |
| `ctt-08-tiep-theo` · Dải “Phần tiếp theo” dùng chung cho các trang con | — | [ảnh](ctt-08-tiep-theo-1440.png) | [ảnh](ctt-08-tiep-theo-744.png) | [ảnh](ctt-08-tiep-theo-390.png) |

