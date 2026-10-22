# Xóa dữ liệu cá nhân cuộc thi

## Sử dụng trong backoffice

Vào **Quản lý cuộc thi → Xóa dữ liệu cá nhân**. Chỉ tài khoản đăng nhập Umbraco thuộc nhóm **Quản trị cuộc thi** được sử dụng API và màn hình này. Thời gian hiển thị theo giờ Việt Nam.

### Theo yêu cầu một người

1. Chọn tìm bằng điện thoại hoặc mã dự thi. Điện thoại được chuẩn hóa giống đăng ký dự thi. Tìm mã của lượt có điện thoại sẽ lấy **mọi lượt cùng điện thoại trên tất cả cuộc thi**; mã ẩn danh chỉ lấy lượt đó.
2. Xem danh sách liên quan (50 dòng/trang). Hành động áp dụng lên toàn bộ kết quả, không chỉ trang đang xem.
3. Chọn:
   - **Ẩn danh**: gõ `XÓA THÔNG TIN`; xóa họ tên, điện thoại, đơn vị, mã băm IP, đồng ý/lượt thứ, chuyển mode thành `anon`. Giữ nguyên điểm, trạng thái, thời điểm, mã dự thi và mọi đáp án để thống kê. Bản kết quả nộp bài được giữ điểm và đổi mode/eligibleForPrize tương ứng.
   - **Xóa hẳn**: gõ `XÓA VĨNH VIỄN`; xóa entry và cascade entry_answer. Thống kê giảm tương ứng, đây là hệ quả có chủ đích của lựa chọn này.
4. Xác nhận thêm trong hộp thoại. Bản xem trước có hiệu lực 10 phút, gắn với tài khoản, dùng token bảo vệ bằng Data Protection. Nếu danh sách/thông tin lượt thay đổi sau khi xem trước, máy chủ từ chối và yêu cầu tìm lại.

Token cũ bị thu hồi khi ẩn danh; cả yêu cầu gắn liên hệ/nộp/lưu đáp án đã xác thực trước đó cũng phải kiểm tra lại token_hash trong transaction. Không thể dùng tab đang mở để gắn lại thông tin sau khi xóa. Các liên hệ câu hỏi chứa đúng số điện thoại liên quan cũng được xóa; không suy đoán người sở hữu một email không có liên kết với lượt thi.

### Hàng loạt sau cuộc thi

Gõ chính xác `XÓA DỮ LIỆU CÁ NHÂN`, bấm nút xóa hàng loạt và xác nhận hộp thoại. Phạm vi là **toàn bộ entry trên mọi cuộc thi**, không phải cuộc thi đang được chọn ở menu khác.

Máy chủ chặn nếu còn cuộc thi đang sử dụng trong khoảng mở–hết gia hạn. Xóa các trường cá nhân và thu hồi token như trên nhưng **không xóa lượt, đáp án, điểm**. Xóa `question_submission.contact`, `ip_hash`, tắt `want_reply` cho các liên hệ được xử lý; giữ nội dung câu hỏi/trả lời.

## Bản sao và ngoại lệ lưu chứng từ

- Làm sạch họ tên/điện thoại trong `draw.eligible_snapshot_json`, không đổi tập mã dự thi, điểm, số đủ điều kiện hoặc kết quả quay. CSV đủ điều kiện về sau có các trường cá nhân rỗng; màn quay thông báo bản chụp đã được làm sạch.
- Làm sạch tên/điện thoại trong `contest_published_result.snapshot_json`, tăng revision. Xóa hẳn thì bỏ lượt tương ứng khỏi bảng xếp hạng và đánh lại hạng; ẩn danh thì giữ điểm, thay tên bằng “Ẩn danh”, điện thoại bằng `***`. Không dựng lại từ ngân hàng/lượt thi đang thay đổi.
- **`draw_winner` giữ nguyên**, kể cả khi xóa từng người, theo chính sách lưu chứng từ trao giải đã chọn. Tài khoản được phép xuất chứng từ người trúng vẫn có thể thấy điện thoại/họ tên đầy đủ trong CSV này. Vì vậy “tìm điện thoại không còn kết quả” áp dụng cho danh sách **lượt thi**, không có nghĩa điện thoại bị xóa khỏi chứng từ được giữ theo ngoại lệ.
- Bộ lọc cũ trong nhật ký truy cập có chứa thông tin người được xóa sẽ được che; với hàng loạt, che toàn bộ bộ lọc. Giữ người thực hiện/thời điểm/hành động của nhật ký. Bộ lọc không đọc được cũng được che an toàn thay vì giữ một bản sao có thể chứa PII.
- Các bản chụp đã làm sạch là ngoại lệ bảo vệ dữ liệu đối với nguyên tắc bất biến lịch sử. Không sửa kết quả quay hoặc tính lại điểm.
- Không tự động sửa các phần văn bản tự do (nội dung câu hỏi, câu trả lời, ghi chú/tên giải) để tránh xóa sai nội dung nghiệp vụ; cần quy trình rà soát riêng nếu người dùng tự nhập thông tin cá nhân vào đó.

## Nhật ký và xử lý lỗi

`privacy_operation` lưu GUID thao tác, mã tài khoản, thời điểm, phạm vi/cách xóa, các số đếm và trạng thái làm sạch file. Không lưu selector, mã dự thi, họ tên, điện thoại hoặc nội dung bị xóa. ActorName trong giao diện được tra từ tài khoản Umbraco hiện tại, không sao chép dữ liệu thí sinh vào nhật ký.

Xóa, làm sạch bản chụp và ghi audit nằm trong cùng transaction Serializable. Cùng requestId/nội dung/tài khoản khi thử lại chỉ trả lại thao tác cũ, không xóa thêm lượt mới hoặc ghi lặp nhật ký xóa.

Sau commit chạy `VACUUM` ngoài transaction, rồi `PRAGMA wal_checkpoint(TRUNCATE)`. Bật `secure_delete=ON` trước cập nhật/xóa. Nếu file bận hoặc làm sạch thất bại, dữ liệu đã xóa **không được phục hồi**; trả `vacuumCompleted=false`, `cleanupErrorCode=VACUUM_PENDING`. Nhật ký vẫn tồn tại và có nút chạy lại VACUUM mà không xóa thêm dữ liệu. Trạng thái pending được giữ qua khởi động lại; quản trị viên cần hoàn tất thao tác này khi CSDL hết bận.

Tham khảo cơ chế [VACUUM của SQLite](https://www.sqlite.org/lang_vacuum.html) và [checkpoint TRUNCATE](https://www.sqlite.org/c3ref/wal_checkpoint_v2.html). Chỉ kết luận file CSDL/WAL hiện hành đã được xử lý khi trạng thái báo hoàn tất. Không cam kết xóa forensic trên SSD, snapshot hệ thống, bản sao lưu hay file CSV đã xuất. **Không tự xóa bản sao lưu**: chủ quản phải quản lý thời hạn lưu và tránh khôi phục lại dữ liệu cá nhân đã xử lý.

## API

Prefix `/umbraco/management/api/v1/antc/contest-privacy`, yêu cầu quyền backoffice như trên. Mọi phản hồi `no-store`, lỗi dùng envelope hiện có và thông báo tiếng Việt. Selector chỉ gửi trong POST body, không đưa vào URL/access log.

| Method | Path | Nội dung |
| --- | --- | --- |
| POST | `/preview` | `{kind:"phone" hoặc "code",value,page:1}` → previewToken, total, page, pages, items |
| POST | `/erase` | `{requestId,previewToken,mode:"anonymize" hoặc "delete",confirmation}` |
| POST | `/bulk` | `{requestId,confirmation}` |
| GET | `/operations?page=1` | Nhật ký, 20 dòng/trang, không có dữ liệu đã xóa |
| POST | `/operations/{id}/vacuum` | `{requestId,confirmation:"XÓA DỮ LIỆU CÁ NHÂN"}`; chỉ làm sạch file |

Mã lỗi chính: `PRIVACY_CONFIRMATION_REQUIRED` (400), `PRIVACY_PREVIEW_INVALID` (400), `PRIVACY_PREVIEW_EXPIRED`, `PRIVACY_PREVIEW_CHANGED`, `PRIVACY_CONTEST_OPEN`, `PRIVACY_REQUEST_CHANGED`, `PRIVACY_SNAPSHOT_INVALID` (409), `PRIVACY_OPERATION_NOT_FOUND` (404). Quyền: 401/403 như các trang quản trị cuộc thi khác.

## Triển khai và kiểm thử

Migration `ContestPersonalDataErasure` chỉ thêm bảng nhật ký, không tự xóa dữ liệu. Khởi động lại để áp dụng, tải mới backoffice bằng Ctrl+F5. Việc kiểm thử tự động chỉ chạy trên CSDL tạm, không thực hiện xóa trên dữ liệu đang dùng.

Kiểm thử gồm tìm lại không còn điện thoại, giữ thống kê/đáp án khi ẩn danh, cascade khi xóa hẳn, ngoại lệ chứng từ, thu hồi token và yêu cầu đang dở, xác nhận sai, bản xem trước thay đổi/khác tài khoản, cảnh báo VACUUM pending/thử lại, kiểm tra chuỗi thử nghiệm biến mất khỏi DB/WAL, luồng backoffice thật và quyền 401/403.
