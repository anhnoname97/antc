# Block CMS của trang làm bài — FE-23, FE-25–29, FE-31

Trang giữ alias `cuocThiLamBaiPage`, URL `/cuoc-thi/lam-bai/?c=<id>`. Thuộc tính **Bố cục** dùng datatype **Bố cục làm bài cuộc thi · Block Grid**.

| Alias | Phần hiển thị | Task |
|---|---|---|
| `contestExamHeroBlock` | Hero, đường dẫn, H1, mô tả | FE-25 |
| `contestExamFlowBlock` | Thẻ chính/cột bên, vùng chuyển màn | FE-25, FE-26 |
| `contestRegistrationBlock` | Thông tin cuộc thi, có tên/ẩn danh, đồng ý, luyện tập | FE-25 |
| `contestTopicsBlock` | Nhãn, tiêu đề, đoạn dẫn, chú thích danh sách chuyên đề | FE-26 |
| `contestTopicIntroBlock` | Nhãn nút giới thiệu, thuật ngữ, bắt đầu/làm tiếp | FE-26 |
| `contestQuestionBlock` | Nhãn điều hướng câu hỏi và đồng hồ | FE-23, FE-27 |
| `contestTopicResultBlock` | Tiêu đề, thông báo đã lưu, làm lại chuyên đề | FE-27 |
| `contestSidebarBlock` | Thí sinh, tiến độ, cảnh báo và ứng phó | FE-26 |
| `contestSubmissionBlock` | Hộp thoại nộp bài/gắn thông tin xét giải | FE-29 |
| `contestEntryResultBlock` | Kết quả lượt thi, xét giải, xem lại | FE-29 |

## Bố cục và nội dung

Ba block cấp trang: Hero → Bố cục luồng thi → Nộp bài. Luồng thi có hai area: `main` chứa đăng ký và năm cấu hình màn; `sidebar` chứa block cột bên. Mỗi block trong area có giới hạn một bản và bắt buộc để tránh thiếu/nhân đôi DOM ID của luồng.

Các block màn chuyển động xuất cấu hình chữ bằng `<template data-contest-copy>`; `block-copy.js` đọc các chuỗi khi render. Đây là cấu hình của màn thực tế, không phải một bản giao diện minh họa. Nhãn, mô tả và nút có thể sửa trong CMS; tên chuyên đề, đoạn giới thiệu, thuật ngữ, câu hỏi, đáp án, điểm, số lượt và đồng hồ vẫn từ API/state, không lấy số nhập tay.

Block đăng ký có nội dung thể lệ, liên kết thể lệ và số ngày lưu dữ liệu; để trống nếu chưa có nội dung chính thức, không tự đặt số ngày. Pháp nhân và đầu mối bảo vệ dữ liệu tiếp tục lấy từ cài đặt site.

Các token dùng trong chữ: `{topicCount}`, `{total}`, `{count}`, `{number}`, `{correct}`, `{cd}`. Chuỗi CMS được escape trước khi ghép HTML hoặc gán bằng textContent. Tiến độ vẫn dùng `contest-store.js`; không đổi token hay khóa localStorage.

Theo xác nhận của người dùng ngày 20/10/2026, **giữ làm tuần tự như dev**, cả ở giao diện và API; không dùng quy tắc cũ “xong chuyên đề 1 mở tất cả”.

Giao diện được scope tại `.contest-flow-page`: nền kem, xanh than, Roboto, nút tròn. Đáp án sai/chấm câu sai dùng hổ phách, đúng dùng xanh lá. Nhãn nhỏ màu vàng đồng được đậm hơn để đạt độ tương phản.

FE-28 là module API/trạng thái, FE-31 là kiểm thử: không tạo element type giả cho hai task này.

## Kiểm chứng

- Build Razor thành công; bộ test nghiệp vụ 111/111 đạt.
- Chromium: đăng ký và responsive tại 360, 390, 744, 1024, 1133, 1280, 1440px, không tràn ngang hoặc lỗi JavaScript.
- Luồng có tên desktop và ẩn danh mobile trên DB tạm, đề rút gọn: đăng ký → chuyên đề → câu hỏi → tải lại/khôi phục → kết quả chuyên đề → hộp thoại/Escape → nộp → kết quả lượt thi → tab mới khôi phục kết quả.
- Axe WCAG 2 A/AA và 2.1 AA cho nội dung luồng mới: đăng ký, danh sách, giới thiệu, câu hỏi, kết quả chuyên đề, hộp thoại và kết quả lượt thi không có vi phạm sau sửa tương phản nhãn.
- DB tạm: đồng hồ hệ số 0.02 khóa nút rồi mở; hệ số 0 mở ngay. Trả lời ba câu khi offline, bật mạng: cả ba được gửi lại. Hai tab cùng trả lời câu thứ tư: máy chủ giữ đúng bốn đáp án duy nhất.
- DB thật được sao lưu trước import: `/tmp/antc-before-exam-blocks-20261020-105556`. Các lượt thử chỉ ghi vào bản sao cổng 11001.

FE-31 chưa nghiệm thu hoàn toàn: chưa kiểm điện thoại thật Android/iOS, NVDA/VoiceOver hoặc toàn bộ luồng trên mọi trình duyệt. Kiểm tra đề rút gọn không thay thế hoàn thành 200 câu với đồng hồ thật.

Không commit/push trong lần làm block này. Các thay đổi tích hợp dev đang staged từ trước được giữ nguyên.

### Quy tắc lịch cuộc thi cập nhật ngày 20/10/2026

- Chỉ một cuộc thi đang diễn ra; API quản trị trả `409 CONTEST_TIME_OVERLAP` khi tạo/sửa khoảng ngày trùng, kể cả bản ghi ngừng sử dụng. Gia hạn nộp bài không tính vào khoảng kiểm tra trùng.
- Trang đăng ký tự mở cuộc thi duy nhất từ `ongoing`; không còn chức năng chọn cuộc thi khác. URL của cuộc thi cũ vẫn hiển thị lý do và liên kết tới cuộc thi đang mở.
- Nếu lịch trả hơn một cuộc thi đang diễn ra, form không cho đăng ký và hiển thị nút thử lại. Không tự chuyển lượt thi đã lưu sang cuộc thi mới.
- Dữ liệu giả lập mặc định có một cuộc đang mở; cuộc tiếp theo và cuộc sắp tới có lịch riêng, `mock=small` thay cuộc mẫu bằng cuộc hai chuyên đề.
