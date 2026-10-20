# FE-25 · Màn Đăng ký dự thi: giao việc

- Ngày giao: 2026-10-17 · Người giao: điều phối (theo yêu cầu của anhnn)
- Nhánh làm việc: `feature/FE-25`
- Nguồn: `docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › sheet "Công việc" › FE-25; `docs/ke-hoach/Mo-ta-cong-viec-FE-antoantaichinh-v3.docx` › 5. Công việc của FE2 › FE-25; ảnh `th-01`, `th-02`, `th-03`, `th-10`, `mb-06` trong `docs/ke-hoach/anh/`.

## Yêu cầu

Dựng màn Đăng ký dự thi tại `/tham-gia/cuoc-thi` (view `thiPage.cshtml`, hiện đang gọi `_PageStub`) theo mô tả FE-25.

Kế hoạch ghi FE-25 phụ thuộc **FE-28** (lớp trạng thái và gọi API cuộc thi) và **BE-22** (API-01 `POST /api/v1/contest/entries`). Cả hai chưa làm. Tiêu chí nghiệm thu "đăng ký tạo được lượt thi" cần API thật.

## Orchestrator

1. Chạy `/feature-design FE-25`, ghi kết quả vào `docs/ban-giao/FE-25/1-thiet-ke.md`.
2. Làm rõ phạm vi khả thi khi FE-28 và BE-22 chưa có. Đưa các phương án (ví dụ: chỉ dựng giao diện và kiểm tra phía trình duyệt, gọi API qua một lớp mỏng có thể thay sau; hoặc làm luôn phần tối thiểu của BE-22/FE-28), kèm đánh đổi và khuyến nghị.
3. Đánh dấu rõ các điểm cần người dùng xác nhận trong mục "Cần người dùng xác nhận". Không tự chốt thay người dùng.
4. Chia task sao cho task đầu tiên làm được ngay mà không cần chờ xác nhận, nếu có thể.

## Worker

Chờ `1-thiet-ke.md`. Chỉ làm các task không ở trạng thái "chờ xác nhận".

## Ưu tiên

Cao (theo kế hoạch).
