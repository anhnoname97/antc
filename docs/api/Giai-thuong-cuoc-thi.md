# Giải thưởng theo cuộc thi

## Sử dụng trong backoffice

1. Vào **Quản lý cuộc thi → Giải thưởng** để tạo danh mục: mã (duy nhất, tự chuyển thành chữ hoa), tên, mô tả, thứ tự, trạng thái sử dụng. Danh sách có tìm kiếm và phân trang 10/50/100.
2. Trong form thêm/sửa Cuộc thi, mở **Giải thưởng**, chọn các giải và nhập số lượng riêng cho từng loại. Một giải dùng được trong nhiều cuộc thi; mỗi cuộc thi có nhiều giải.
3. Với cuộc thi đã bắt đầu, dùng **Lưu riêng cấu hình giải thưởng**; thao tác này không đổi lịch, chuyên đề, bộ đề hay bài làm.
4. Trong tab Lần quay số, chọn cuộc thi rồi chọn giải đã cấu hình. Giao diện hiện tổng số suất, số đã trao và số còn lại. Có thể chia một giải thành nhiều lần quay.

Mỗi loại giải cho phép số lượng 1–1.000, tối đa 100 loại mỗi cuộc thi. Giải ngừng sử dụng không thể gắn mới hoặc quay thêm. Không thể bỏ giải đã có lần quay, giảm số lượng thấp hơn số đã trao, hoặc xóa danh mục giải đang liên kết.

## Dữ liệu và bảo đảm hạn mức

- `prize`: mã, tên, mô tả, trạng thái, thứ tự, thời điểm tạo/cập nhật, revision.
- `contest_prize`: khóa chính `(contest_id, prize_id)`, số lượng, thứ tự hiển thị; là liên kết nhiều–nhiều.
- `draw`: bổ sung `prize_id` và bản chụp `prize_code`, `prize_name`. Đổi tên/mã danh mục không sửa lịch sử quay.
- Số đã trao được đếm từ các dòng `draw_winner` thực tế theo cuộc thi và giải. Kiểm tra suất còn lại, chọn người và ghi kết quả trong cùng transaction Serializable. Hai yêu cầu tranh suất cuối không thể cùng thành công.
- Gửi lại cùng requestId và nội dung trả lần quay cũ, không tiêu thêm suất. Quy tắc gộp số điện thoại, chọn lượt tốt nhất và loại người đã trúng không thay đổi.
- Lần quay cũ chưa có giải vẫn giữ nguyên, không tự gán và không tự trừ vào giải mới. Kết quả công khai vẫn che thông tin cá nhân; backoffice vẫn hiển thị đầy đủ theo quyền hiện có.

## API quản trị

`prizeMoney` nằm trên **liên kết giải–cuộc thi**, không nằm ở danh mục giải. Đây là số nguyên VNĐ cho một suất giải, không âm (tối đa 9.007.199.254.740.991 để truyền JSON chính xác trên trình duyệt). Cùng một loại giải có mức tiền độc lập giữa các cuộc thi. Form Cuộc thi hiển thị tiền bên cạnh số lượng của từng giải; API tạo/sửa cuộc thi và lưu riêng cấu hình nhận `prizes: [{ "prizeId": 1, "quantity": 2, "prizeMoney": 1500000 }]`. DTO giải theo cuộc thi trả thêm `prizeMoney`. Bỏ trường khi cập nhật giữ giá trị cũ; gửi 0 để đặt lại. Liên kết mới mặc định 0.

Migration `MovePrizeMoneyToContest` chuyển tiền cũ từ `prize` vào từng liên kết `contest_prize` hiện có trước khi bỏ cột ở danh mục. Không thay đổi số lượng hay người trúng cũ. Danh mục giải không còn trường tiền thưởng.

Các API yêu cầu đăng nhập và quyền quản trị hiện có, không cung cấp thao tác ghi công khai.

- `GET /api/v1/admin/contest/prizes?search=&isActive=&page=1&pageSize=50`
- `GET /api/v1/admin/contest/prizes/{id}`
- `POST /api/v1/admin/contest/prizes`
- `PUT /api/v1/admin/contest/prizes/{id}`
- `DELETE /api/v1/admin/contest/prizes/{id}` (chỉ giải chưa được liên kết)
- `PUT /api/v1/admin/contest/campaigns/{id}/prizes`: `{ "prizes": [{ "prizeId": 1, "quantity": 2 }], "expectedRevision": 1 }`
- Form tạo/sửa cuộc thi cũng nhận `prizes` với cùng cấu trúc. Bỏ trường này giữ cấu hình cũ; mảng rỗng yêu cầu bỏ toàn bộ giải chưa quay.
- `GET /umbraco/management/api/v1/antc/contest-draws/prizes?contestId=...`: trả các giải, `quantity`, `awarded`, `remaining`.
- Preview và tạo lần quay nhận thêm `prizeId`; tạo lần quay mới bắt buộc chọn giải. Kết quả trả thêm `prizeId`, `prizeCode`, `prizeName`.

Lỗi theo envelope hiện có: `PRIZE_CODE_EXISTS`, `PRIZE_CHANGED`, `PRIZE_IN_USE`, `PRIZE_QUOTA_IN_USE`, `PRIZE_NOT_IN_CONTEST`, `PRIZE_INACTIVE`, `PRIZE_QUOTA_EXCEEDED`; lỗi trường trả thông báo tiếng Việt. Cấu hình revision cũ trả `CONTEST_CHANGED`.

## Nâng cấp

Sao lưu CSDL theo quy trình phát hành hiện có. Migration `20261022015725_ContestPrizeAllocations` chạy khi ứng dụng khởi động, thêm bảng/cột; không xóa hay tự phân loại lịch sử cũ. Khởi động lại ứng dụng, tải lại backoffice rồi tạo danh mục và cấu hình giải cho các cuộc thi hiện có trước khi quay mới.
