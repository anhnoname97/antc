# Số lượt thi không giới hạn

`maxAttempts = 0` của cuộc thi nghĩa là không giới hạn số lượt cho một số điện thoại trong cuộc thi đó. Giá trị từ 1 đến 1.000 vẫn giới hạn như trước; số âm hoặc lớn hơn 1.000 không hợp lệ. Mặc định khi tạo cuộc thi vẫn là 2.

Áp dụng cho tạo lượt có tên, gắn thông tin vào lượt ẩn danh và nộp bài kèm contact. Vẫn đếm mọi trạng thái và cấp `attemptNo = số lượt đã có + 1` trong transaction; chỉ bỏ bước từ chối `ATTEMPT_LIMIT` khi cấu hình bằng 0. Phản hồi API giữ `maxAttempts: 0`, không đổi thành null hay số giả lớn.

Giới hạn tần suất API, thời gian cuộc thi, điều kiện trả lời đủ đề, xác thực và quy tắc nộp lại không thay đổi. Portal cho phép thi thêm lượt khi cuộc thi còn mở và giới hạn bằng 0. Backoffice nhận giá trị 0, hiển thị Không giới hạn. Không cần đổi cấu trúc CSDL.
