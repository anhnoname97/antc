# Rà soát tiếng Việt trong Umbraco — 26/10/2026

Áp dụng và kiểm tra tại `http://localhost:11000/umbraco` trên bản local.

## Thay đổi

- Chuyển tài khoản quản trị local từ `en-us` sang `vi`. Cấu hình mặc định của ứng dụng vốn đã là `vi-VN`.
- Thêm tiện ích `App_Plugins/AntcVietnamese`, bổ sung 360 khóa còn thiếu của bộ dịch Umbraco 18.2.1 và 159 khóa uSync/uSync History. Đăng ký cho cả `vi` và `vi-vn`.
- Chuẩn hóa thêm các thuật ngữ: bộ nhớ tạm, loại phần tử, nhật ký thao tác, tệp, biểu mẫu, trang web, bản chụp dữ liệu, mẫu giao diện và biểu định kiểu.
- Thay bảng tin bên ngoài bằng hướng dẫn quản trị An toàn tài chính bằng tiếng Việt.
- Đổi tên hiển thị, mô tả và thẻ cấu hình trong 40 tệp loại nội dung/phương tiện; giữ nguyên khóa và bí danh trong các tệp này.
- Việt hóa tên chế độ xem và tiêu đề cột trong cấu hình danh sách nội dung/phương tiện; giữ nguyên mã chế độ xem, thứ tự và phân trang.
- Chuẩn hóa các câu hướng dẫn trong Hỏi – Đáp và quản trị cuộc thi.
- Việt hóa tên hiển thị của hai nhóm mặc định trên cơ sở dữ liệu local; không sửa quyền.

## Kiểm chứng

- Đăng nhập thực tế bằng trình duyệt, lưu và tải lại hồ sơ để xác nhận ngôn ngữ được giữ lại.
- Kiểm tra Nội dung, Phương tiện, Thư viện, Cài đặt, Người dùng, Thành viên, Dịch thuật, Hỏi – Đáp, Cuộc thi và cấu hình gốc An toàn tài chính.
- Kiểm tra màn hình uSync và đăng nhập trong phiên trình duyệt mới.
- Đối chiếu khóa dịch: không thiếu khóa nào trong 360 khóa Umbraco hoặc 159 khóa uSync đã rà soát.
- Kiểm tra cú pháp JavaScript, XML và `git diff --check`.
- So sánh XML với bản gốc: 40 tệp loại nội dung/phương tiện chỉ thay đổi chữ hiển thị.
- `PRAGMA integrity_check` của SQLite trả về `ok`.
- Không phát hiện lỗi JavaScript trong các màn hình đã kiểm tra sau thay đổi.

## Dữ liệu local và đồng bộ

Ngôn ngữ tài khoản và các tên hiển thị trong cơ sở dữ liệu đã được áp dụng trực tiếp tại máy local. Các thay đổi mã nguồn và uSync nằm trong working tree, chưa triển khai lên môi trường khác.

Trước khi cập nhật trực tiếp các nhãn trong SQLite, đã tạo bản sao lưu:

`src/ANTC.Portal.App/Umbraco.Web.UI/App_Data/backups/vietnamese-labels-20261026-105918.sqlite.db`

Bản sao lưu này được tạo sau khi đổi ngôn ngữ tài khoản và cập nhật cấu hình gốc qua API, trước đợt cập nhật trực tiếp nhãn cấu hình. Đây không phải bản chụp trước toàn bộ phiên làm việc.

Khi khởi động lần đầu, cấu hình Development tự chạy nhập uSync và báo lỗi có sẵn về nhóm `sEO` khác loại giữa các thành phần. Một số loại nội dung còn có hai nhóm cùng tên `Nội dung`, khiến API cập nhật loại nội dung báo lỗi khóa trùng. Vì vậy, các cập nhật nhãn còn lại được thực hiện khi ứng dụng đã dừng, trong giao dịch SQLite, rồi khởi động lại với `--uSync:Settings:ImportAtStartup=None`. Không sửa cấu trúc để giải quyết các lỗi này trong công việc dịch giao diện.

Trước khi nhập cấu trúc lên môi trường khác, cần xử lý lỗi cấu trúc uSync nêu trên; không giả định một lần nhập toàn bộ sẽ thành công.

## Giới hạn

Các tên công nghệ, mã cấu hình, bí danh và tên nội dung/tệp do người dùng đặt được giữ nguyên. Hộp thông tin chẩn đoán hệ thống của core vẫn có các chuỗi tiếng Anh được viết trực tiếp trong thành phần, ví dụ `System information`; tiện ích bộ dịch không thay thế được những chuỗi này. Chưa xác nhận toàn bộ các hộp thoại kỹ thuật, cài đặt của mọi trình biên tập hoặc trang tiện ích bên thứ ba đều đã hoàn toàn bằng tiếng Việt.
