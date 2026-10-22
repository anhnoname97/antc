# Dữ liệu local kiểm thử quay thưởng

Đã nạp ngày 21/10/2026 cho cuộc thi **#1 — Cuộc thi lừa đảo cấp quốc gia**, bộ đề đã chốt **125 câu**. Không sửa lịch, cấu hình, đề thi, bảng người dùng Umbraco hay tạo sẵn kết quả quay.

- 50 lượt dự thi, kèm 5.759 dòng đáp án tương ứng.
- 40 lượt đã nộp có tên giả, thuộc 30 điện thoại giả: 10 người có hai lượt. Có 5 người điểm lượt sau cao hơn, 4 người bằng điểm để kiểm tra chọn lượt nộp sớm hơn, và 1 người lượt sau thấp hơn do nộp thiếu câu để kiểm tra không lấy mặc định lượt cuối.
- 5 lượt đã nộp ẩn danh: không được vào tập quay thưởng.
- 5 lượt đang làm (3 có tên, 2 ẩn danh): không được vào tập quay thưởng.
- Điểm khớp số dòng `is_correct = 1`; số đã trả lời khớp số dòng đáp án. Có bài nộp thiếu câu và thời điểm phân bố trong khoảng cuộc thi.
- Họ tên có `[TEST]`, đơn vị của lượt có tên là `TEST-QUAY-50-V1`; điện thoại giả dạng `000...`, không dùng thông tin liên hệ thật. Lượt ẩn danh không bị gắn thông tin cá nhân để đánh dấu.

## Thử trên giao diện

Vào **Quản lý cuộc thi → Cuộc thi → Lần quay số**, chọn cuộc thi #1:

| Điểm tối thiểu | Số người đủ điều kiện trước lần quay đầu |
| --- | --- |
| 0 | 30 |
| 100 | 21 |
| 112 | 15 |
| 125 | 0 |

Gợi ý bắt đầu: ngưỡng **100**, **3 người trúng**, tên giải **[TEST] Giải thử lần 1**. Xem trước → Quay → Xác nhận; kiểm tra màn trình chiếu và hai file CSV. Lần sau giữ “Loại người đã trúng” để kiểm tra loại các điện thoại đã nhận giải, hoặc bỏ chọn để cho phép trúng lại. Các con số ở bảng thay đổi sau khi thực sự quay với tùy chọn loại người đã trúng.

## Sao lưu và nhận diện dữ liệu

Trước khi nạp có SQLite online backup đầy đủ cả dữ liệu đã commit trong WAL, nằm tại `Umbraco.Web.UI/App_Data/backups/before-draw-seed-20261021-095825-214efebdfd4e44b99327611f821ea80f.db`.

Danh sách chính xác ID/mã của cả 50 lượt, bao gồm lượt ẩn danh, lưu trong `Umbraco.Web.UI/App_Data/TEST-QUAY-50-V1-20261021-095827.json`. Giữ file này khi muốn dọn đúng dữ liệu mẫu. Không tự khôi phục toàn bộ bản sao lưu sau khi có dữ liệu mới, vì sẽ mất những phát sinh sau thời điểm sao lưu. Không có token truy cập lượt thi gốc được lưu/phát hành; dữ liệu này dành cho kiểm thử quản trị và quay thưởng, không để đăng nhập tiếp như một thí sinh thật.

## Công cụ

`src/ANTC.Portal.App/Tools/SeedDrawData` là console thủ công, không tự chạy khi khởi động website, không thêm API seed. Luôn truyền đường dẫn CSDL tuyệt đối đã kiểm tra:

```powershell
dotnet run --project src/ANTC.Portal.App/Tools/SeedDrawData -- --db "D:\...\App_Data\app.sqlite.db"
dotnet run --project src/ANTC.Portal.App/Tools/SeedDrawData -- --db "D:\...\App_Data\app.sqlite.db" --contest-id 1 --verify
```

Mặc định chỉ đọc danh sách cuộc thi; `--verify` gọi chính dịch vụ xem trước quay và kiểm tra điểm/số đáp án, không tạo lần quay. Chỉ `--apply --contest-id 1` mới chèn dữ liệu, có backup trước, một transaction và kiểm tra tính nhất quán trước commit. Chống chạy lặp nếu còn dấu lô `TEST-QUAY-50-V1`. Không chạy lệnh nạp trên production hoặc trước khi xác định chính xác CSDL đích.
