# Nhập ngân hàng câu hỏi từ Excel

## Vị trí và quyền

Backoffice → Quản lý cuộc thi → **Câu hỏi** (`/umbraco/section/contest-management/view/questions`). Gồm ba tab tại chỗ: Danh sách câu hỏi, Nhập từ Excel, Lịch sử nhập. Chỉ một bảng câu hỏi, tích hợp thêm/sửa/xóa, 50 dòng/trang, bộ lọc thu gọn và chi tiết đầy đủ lựa chọn/giải thích. Nhập thành công tự cập nhật bảng và chuyên đề ngay tại chỗ; chuyển tab không mất bộ lọc, file đã chọn hay bản xem trước. Sửa bằng CRUD làm mất hiệu lực bản xem trước đang mở, cần kiểm tra file lại. Menu Ngân hàng câu hỏi đã bỏ; URL cũ `/bank` hiển thị cùng màn Câu hỏi để tương thích liên kết đã lưu. Quyền API giữ cùng chính sách `RequireAdminAccess` như CRUD Chuyên đề/Câu hỏi; cần token backoffice hợp lệ. Không có API nhập công khai.

## File và quy trình

- Tải mẫu hoặc Xuất ngân hàng Excel. Hai sheet `ChuyenDe`, `CauHoi` dùng cùng tiêu đề cột, dòng 1 là tên cột; hỗ trợ đổi thứ tự cột, không đổi tên. Mẫu có một chuyên đề và một câu Đúng–Sai minh họa, không tự nhập vào dữ liệu.
- `ChuyenDe`: Số chuyên đề, Tên, Giới thiệu, Thuật ngữ. Giới thiệu mỗi đoạn một dòng; thuật ngữ mỗi dòng `từ | giải nghĩa`. Thêm mới chuyên đề nếu số chưa tồn tại; cập nhật nội dung nếu có; giữ nguyên trạng thái chuyên đề cũ. Chuyên đề vắng trong file không bị xóa/ngừng dùng.
- `CauHoi`: Số chuyên đề, Mã câu, Loại câu, Tình huống, Câu hỏi, Lựa chọn A/B/C/D (bốn cột riêng), Đáp án đúng, Giải thích A/B/C/D (bốn cột riêng), Hành động an toàn, Thời gian đọc (giây), Thứ tự Thử sức, Nhãn Thử sức, Thứ tự hiển thị. Cột Thứ tự Thử sức nhận 1–8 hoặc trống.
- File xuất chứa **toàn bộ câu đang dùng**, không chứa câu ngừng dùng; nhập lại ngay không thay đổi trạng thái câu đã ngừng dùng. File là ma trận đầy đủ, không phải file bổ sung: câu đang dùng vắng trong file sẽ ngừng dùng. Không xóa cứng câu hay đáp án thí sinh.
- Kiểm tra toàn bộ file trước khi tạo bản xem trước; có lỗi trả sheet/dòng/tên cột và không có `previewId`. Không ghi CSDL hay lưu file ở bước này. Lỗi dài có phân trang, không giấu lỗi để cho nhập.
- Xem trước nêu số thêm/sửa/ngừng dùng, mã và cột thay đổi, mã câu ngừng dùng và thay đổi chuyên đề. Mã câu được trim, chuẩn hóa chữ hoa. Chuyên đề có thể tham chiếu CSDL hoặc dòng chuyên đề mới hợp lệ trong cùng file.
- Khi có cuộc thi đang mở, hiển thị số lượt dở và yêu cầu gõ **XÁC NHẬN NHẬP NGÂN HÀNG**. Máy chủ kiểm tra lại điều kiện này khi ghi, kể cả cuộc thi mới mở sau bước xem trước.
- Xác nhận qua hộp thoại, sau đó máy chủ thêm/sửa/ngừng dùng và ghi `quiz_import` trong một transaction SQLite serializable; file gốc lưu `App_Data/imports/{importId}.xlsx`, không dùng tên file người dùng làm đường dẫn. Lưu file thất bại thì rollback CSDL. Làm mới QuestionBank sau commit.

## Giới hạn và an toàn

ClosedXML **0.105.0** được cố định tại `Directory.Packages.props`; không cần cài Excel trên máy chủ. Chỉ nhận `.xlsx` tối đa 5 MiB, kiểm tra ZIP thực, tối đa 64 MiB sau giải nén, 1.000 ZIP entries, 10.000 dòng/sheet, không nhận macro, công thức hoặc workbook đặt mật khẩu. Không cho nhập file không có câu hỏi để tránh ngừng nhầm toàn bộ ngân hàng. Khi xuất, nội dung ô là text, không biến thành công thức Excel.

Chỉ `POST /api/v1/admin/quiz/imports/preview` được nâng giới hạn body lên 5 MiB + 64 KiB cho multipart; bản thân file vẫn tối đa 5 MiB. Những API khác giữ giới hạn **16 KiB**. Cần cấu hình reverse proxy cho phép multipart lớn hơn 5 MiB nếu đang đặt giới hạn thấp hơn.

Bản xem trước lưu trong RAM giới hạn 100 MiB, hết hạn sau 30 phút, ràng buộc với tài khoản tạo. Xác nhận không nhận lại nội dung/các số đếm từ client. Nếu ngân hàng đã thay đổi sau xem trước, trả `409 BANK_CHANGED`; cần kiểm tra lại file. Bản xem trước hết hạn, bị thu hồi do đầy RAM, hoặc sau khởi động lại: `409 IMPORT_EXPIRED`. Chỉ file đã nhập thành công được lưu dài hạn.

Đề cuộc thi và chi tiết bài thi cũ dùng **bản chụp đã có**: nhập Excel không sửa `contest_question`, `contest_topic`, `entry_answer.is_correct` hay điểm đã nộp. Ngân hàng mới và danh sách chọn câu khi cấu hình cuộc thi sẽ cập nhật; không tự chèn câu mới hoặc thay đáp án vào một cuộc thi đã chốt. Cảnh báo nhập trong giờ thi có giải thích rõ cơ chế này. Câu hỏi hỗ trợ 2–4 lựa chọn, chỉ một đáp án đúng; màn CRUD đã được điều chỉnh để sửa câu A/B mà không bắt điền C/D.

## API

| Method | Đường dẫn (tiền tố `/api/v1/admin/quiz/imports`) | Ý nghĩa |
| --- | --- | --- |
| GET | `/template` | File mẫu `.xlsx` |
| GET | `/export` | Ma trận hiện tại `.xlsx` |
| POST | `/preview` | Multipart field `file`; trả lỗi hoặc bản xem trước |
| POST | `/confirm` | JSON `{ "previewId": "...", "confirmation": "..." }` |
| GET | `?page=1` | Lịch sử nhập Excel, 20 dòng/trang |
| GET | `/{id}/file` | File gốc của lần nhập thành công |

Lịch sử dùng bảng `quiz_import` hiện có (ai, thời điểm UTC, tên file, số thêm/sửa/ngừng dùng, nhập trong giờ thi). Các dòng ghi nhận thao tác CRUD `backoffice:*` không được đưa vào lịch sử nhập Excel. Mọi lỗi HTTP theo envelope chung `{ "error": { "code", "message", "fields" } }`. Lỗi ô Excel trả trong `errors` của bước kiểm tra, có lỗi thì không thể xác nhận.

Sao lưu CSDL cần kèm thư mục **App_Data/imports** để giữ đủ chứng cứ file nhập. Bản publish không mang dữ liệu này; lệnh cập nhật đang bảo toàn App_Data. Không cần migration mới cho chức năng nhập này.

## Kiểm thử

Có kiểm thử round-trip 0/0/0, thêm/sửa đúng cột, câu A/B, lỗi E theo ô, lỗi cột/công thức/chuyên đề/thứ tự, ngừng dùng giữ bài làm và snapshot, xác nhận giờ thi, chống bản xem trước cũ/khác tài khoản, rollback khi lỗi lưu file, lịch sử qua context mới. Host Umbraco dùng CSDL tạm kiểm tra upload multipart thật, xác nhận giờ thi và tải byte-for-byte file gốc; trình duyệt kiểm tra xuất → kiểm tra → hủy/xác nhận → lịch sử và tải lại trang. Không chạy nhập lên CSDL thật của dự án trong kiểm thử.
