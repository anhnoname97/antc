# Điều kiện nộp đủ đề

`POST /api/v1/contest/entries/me/submit` chỉ chốt lượt đang thi sau khi đã trả lời toàn bộ câu trong đề của cuộc thi đó (cùng nguồn đề với API câu hỏi/lưu đáp án), không phải toàn bộ ngân hàng dùng chung.

- Chưa trả lời câu nào: `409 NOTHING_TO_SUBMIT`.
- Đã trả lời nhưng còn thiếu mã câu của đề: `409 INCOMPLETE_ANSWERS`, thông báo tiếng Việt có số câu còn thiếu/tổng. Đáp án ngoài đề không bù được câu còn thiếu và không được cộng điểm.
- Kiểm tra trước bước gắn `contact`, chốt điểm và ghi trạng thái. Khi từ chối, không ghi contact/score/submitted_at/kết quả; đáp án đã lưu trước đó vẫn giữ nguyên để người dùng tiếp tục làm bài.
- Đủ đề: áp dụng kiểm tra contact, giới hạn lượt, thời gian và transaction như trước. Đáp án sai vẫn được tính là đã trả lời.
- Lượt đã nộp vẫn trả kết quả cũ với HTTP 200, không kiểm tra lại độ hoàn thành hay tính lại điểm theo ngân hàng mới.

Backoffice tạo/sửa cuộc thi: chỉ đóng form khi API lưu thành công. Khi lỗi validation, trùng lịch, revision hoặc kết nối, thông báo nằm trong form; giữ nguyên dữ liệu, các câu/giải đã chọn và số lượng. Chặn gửi trùng/đóng form trong lúc đang lưu; sau lỗi có thể chỉnh sửa và gửi lại hoặc Hủy/Đóng bình thường.
