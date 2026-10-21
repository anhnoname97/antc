# Quay số chọn người trúng giải

## Backoffice

Section **Quản lý cuộc thi → Cuộc thi → Lần quay số** (`/umbraco/section/contest-management/contest`). Tab hiển thị trực tiếp trong trang Cuộc thi bằng Lit Element, không chuyển trang/URL; giữ thông tin đang nhập khi đổi tab. Mục menu trái “Quay số” được bỏ để tránh trùng lặp. URL cũ `/umbraco/section/contest-management/draws` vẫn được giữ để tương thích liên kết cũ.

1. Chọn cuộc thi, nhập số người trúng, ghi chú/tên giải. Để trống ngưỡng điểm nếu muốn lấy gợi ý điểm cao nhất hiện có.
2. Mặc định loại những số điện thoại đã trúng trước đó **trong cùng cuộc thi**. Bỏ chọn nếu muốn cho trúng lại.
3. Bấm **Xem trước**: xem số người đủ điều kiện và phân bố điểm sau khi gộp/loại người đã trúng. Đổi tiêu chí phải xem trước lại.
4. Bấm **Quay**, đọc hộp xác nhận rồi **Xác nhận quay**. Máy chủ tính lại tập người đủ điều kiện trong transaction, không tin số đếm từ trình duyệt.
5. Xem kết quả, trình chiếu toàn màn hình hoặc xuất CSV. Bảng kết quả chỉ hiện điện thoại đã che; CSV có bản đầy đủ và được ghi nhật ký truy cập.

## Quy tắc lựa chọn

- Lượt thuộc cuộc thi được chọn, trạng thái `submitted`, có số điện thoại hợp lệ và điểm đạt ngưỡng.
- Mỗi số điện thoại một suất: điểm cao nhất, sau đó thời điểm nộp sớm nhất; nếu vẫn bằng nhau thì ID lượt nhỏ hơn để ổn định kết quả.
- Loại người đã trúng dựa trên **số điện thoại chụp trong draw_winner**, không dựa riêng vào entry_id. Một số có lượt mới vẫn bị loại nếu đã trúng.
- Lấy mẫu không hoàn lại bằng partial Fisher–Yates và `RandomNumberGenerator.GetInt32`, không dùng SQL `Random()` hoặc `System.Random`.
- Yêu cầu số người trúng lớn hơn tập đủ điều kiện: HTTP 409 `DRAW_INSUFFICIENT_CANDIDATES`, không lưu một phần hoặc tự giảm số người trúng.
- Mỗi lần quay lưu một `draw`, các dòng `draw_winner` và toàn bộ tập đủ điều kiện trong `draw.eligible_snapshot_json`. Kết quả/CSV lịch sử không được tính lại từ entry hiện tại.
- Gộp, loại người đã trúng, lấy mẫu và ghi bản chụp nằm trong cùng transaction SQLite Serializable; hai lần quay đồng thời có bật loại người đã trúng không thể chọn lại cùng một người.
- Không có sửa/xóa trên giao diện. Các API sửa/xóa cũ cũng trả HTTP 409 `DRAW_IMMUTABLE`. Quay lại là tạo lần quay mới.
- `requestId` là GUID do client tạo cho mỗi yêu cầu. Thử lại cùng GUID, cùng nội dung và cùng tài khoản trả đúng lần quay đã lưu; đổi nội dung trả `DRAW_REQUEST_CHANGED`. Sau lỗi kết nối nên kiểm tra lịch sử hoặc thử lại nguyên yêu cầu.

## API quản trị

Prefix `/umbraco/management/api/v1/antc/contest-draws`. Yêu cầu phiên/token backoffice và nhóm **Quản trị cuộc thi**; chưa đăng nhập 401, không thuộc nhóm 403. Không phải API công khai của cổng thông tin.

| Method | Path | Mục đích |
| --- | --- | --- |
| GET | `/options` | Danh sách cuộc thi |
| GET | `?search=&page=1&pageSize=20` | Lịch sử phân trang, điện thoại đã che |
| GET | `/{id}` | Kết quả cố định của một lần quay, điện thoại đã che |
| POST | `/preview` | `{ contestId, minScore: null, excludePrevious: true }` → suggestedMinScore, minScore áp dụng, eligibleCount, totalCandidates và scores |
| POST | (prefix) | `{ contestId, minScore, winnersRequested, excludePrevious, note, requestId }` → lần quay đã lưu |
| GET | `/{id}/export/eligible` | CSV tập đủ điều kiện được chụp tại lúc quay |
| GET | `/{id}/export/winners` | CSV người trúng theo thứ tự |

CSV UTF-8 BOM, bảo vệ công thức Excel, gồm mã dự thi, họ tên, điện thoại đầy đủ, điểm và thời điểm nộp (nếu có trong bản chụp). Mỗi lần xuất có audit người thực hiện, thời điểm, mã lần quay. Không ghi dữ liệu cá nhân ra log ứng dụng.

API tạo/quản lý draw cũ vẫn dùng cùng thuật toán bảo toàn; quyền quản trị cuộc thi được yêu cầu thêm. Đáp án đúng, điểm thi và luồng công bố kết quả hiện có không thay đổi. Việc quay **không tự công bố** kết quả ra cổng thông tin.

## Migration và lịch sử cũ

`DrawEligibleSnapshots` chỉ thêm hai cột nullable (`eligible_snapshot_json`, `request_id`) và unique index request_id, không xóa/đổi lịch sử cũ. Migration tự chạy theo cơ chế khởi động hiện có; sao lưu app DB theo quy trình phát hành trước khi cập nhật.

Lần quay cũ vẫn xem/xuất người trúng được. Nếu không có bản chụp đủ điều kiện, nút xuất tập này bị khóa và API trả `DRAW_SNAPSHOT_UNAVAILABLE`; không dựng lại một danh sách không chính xác từ dữ liệu đang thay đổi.

## Kiểm thử

- Gộp điện thoại, ưu tiên điểm/giờ nộp/ID, loại chưa nộp/ẩn danh/khác cuộc thi/chưa đạt ngưỡng.
- Loại người đã trúng theo điện thoại, bật cho trúng lại, không lặp và không vượt số đủ điều kiện.
- Hai yêu cầu đồng thời, thử lại cùng requestId và bảo toàn bản chụp sau khi sửa entry/mở lại CSDL.
- 10.000 lần chọn 1 trong 100 người: kiểm định Pearson chi-square (99 bậc tự do, ngưỡng bảo thủ 200).
- Migration giữ draw cũ; kiểm thử backoffice thực tế: quyền 401/403, xem trước, hủy xác nhận, quay, che điện thoại và hai CSV BOM đầy đủ.
