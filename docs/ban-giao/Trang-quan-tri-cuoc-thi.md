# Trang quản trị cuộc thi

## Truy cập và cấp quyền

Khởi động lại bản ứng dụng mới. Migration `20261020022728_ContestAdministrationAudit` tự bổ sung bảng nhật ký và chỉ mục thời điểm tạo; không sửa điểm, đáp án, token hoặc dữ liệu cá nhân đã có.

Khi Umbraco khởi động thành công, ứng dụng tự tạo nhóm **Quản trị cuộc thi** (`quanTriCuocThi`) nếu chưa có. Trong backoffice, vào **Users → User groups**, mở nhóm và gán tài khoản được phép sử dụng. Không tự thêm tài khoản nào, không mặc định miễn kiểm tra cho Administrators/Super User. Nhóm này không được tự cấp quyền vào section Hỏi – Đáp.

Đăng nhập backoffice bằng trình duyệt, sau đó mở các URL trên cùng tên miền:

| Đường dẫn | Nội dung |
| --- | --- |
| `/quan-tri` | Chuyển đến tổng quan |
| `/quan-tri/cuoc-thi` | Số lượt, số điện thoại khác nhau, biểu đồ điểm, lượt theo ngày |
| `/quan-tri/luot-thi` | Danh sách, bộ lọc, phân trang 50 dòng, xuất lượt và đáp án |
| `/quan-tri/luot-thi/{id}` | Chi tiết bài làm, đáp án đúng, cả câu chưa làm, tổng theo chuyên đề |
| `/quan-tri/thong-ke-cau-hoi` | Thống kê từng câu, A/B/C/D, lọc chuyên đề, xuất thống kê |

Đây là Razor Pages độc lập, **không thêm section/menu mới trong backoffice**. Phiên cookie backoffice Umbraco được xác thực bằng scheme `UmbracoBackOffice`; không dùng token của thí sinh hoặc phiên member. Chưa đăng nhập nhận 401; đăng nhập nhưng không thuộc nhóm nhận **403**, kể cả tài khoản Administrators. Người bị khóa hoặc không được duyệt cũng không được truy cập. Quy tắc `Administration:AllowedNetworks` áp dụng cho cả `/quan-tri`; IP được xử lý sau forwarded headers tin cậy như backoffice.

## Quy ước số liệu

- Có bộ lọc cuộc thi để xem riêng hoặc tổng hợp. Thống kê câu hỏi vẫn tách từng cuộc thi vì cùng mã câu có thể có nội dung/đáp án khác ở hai cuộc thi.
- Khoảng ngày áp dụng **ngày tạo lượt, theo giờ Việt Nam UTC+7**, bao gồm toàn bộ ngày cuối. Tìm tên không phân biệt hoa/thường tiếng Việt; tìm mã/điện thoại theo chuỗi con. Số điện thoại dùng dạng chuẩn hóa đã lưu.
- Có thể kết hợp `Đã nộp` + `Có số điện thoại` + `Điểm từ 180`. Điểm lọc/sắp xếp là điểm đã chốt trong `entry.score`; lượt chưa nộp không có điểm chốt nên không lọt bộ lọc điểm. Cột số đúng của lượt đang thi được đếm trực tiếp từ đáp án đã lưu.
- Biểu đồ điểm chỉ gồm lượt đã nộp. Số điện thoại khác nhau loại null/rỗng, đếm số đã chuẩn hóa.
- Chi tiết lấy bộ đề đóng băng của cuộc thi, không lấy đáp án hiện tại của ngân hàng luyện tập. Bộ đề chuẩn hiển thị 200 câu; cuộc thi chọn ít câu hơn hiển thị đúng số đã chọn. Câu bỏ trống ghi “Chưa trả lời”, không tạo đáp án giả.
- Lượt lịch sử không có snapshot: hiển thị rõ cảnh báo; đúng/sai lấy từ bản ghi đáp án, không suy đoán đáp án đúng lịch sử bằng ngân hàng mới.
- Tỷ lệ đúng = số dòng `is_correct=1` / số lượt **đã trả lời câu đó**, không lấy tổng người tham gia làm mẫu số. Sắp tăng dần, câu chưa ai trả lời nằm cuối. A/B/C/D được đếm từ đáp án đã lưu, áp dụng cùng bộ lọc lượt thi.
- Lượt/câu được đọc bằng truy vấn chỉ đọc `AsNoTracking`; không thay đổi giao dịch làm bài, cơ chế lần ghi đầu thắng hoặc kết quả nộp bài.

## Xuất dữ liệu và an toàn

Nút xuất sử dụng POST có anti-forgery token. Xuất **toàn bộ** kết quả bộ lọc, không chỉ trang 50 dòng đang hiển thị. Danh sách lượt và đáp án được đọc/ghi theo luồng, không nạp cả bảng vào bộ nhớ.

CSV dùng UTF-8 BOM, dấu phẩy, CRLF và escape dấu nháy/ký tự xuống dòng. Ô có nguy cơ công thức Excel được thêm dấu nháy đơn để chống CSV injection. Tiếng Việt được giữ nguyên. Khi cần giữ số 0 đầu số điện thoại trong Excel, nhập CSV bằng **Data → From Text/CSV**, đặt cột số điện thoại thành Text (Excel có thể tự chuyển chuỗi số thành số khi mở trực tiếp).

Các phản hồi quản trị có `Cache-Control: no-store`, `Referrer-Policy: no-referrer` và chống nhúng frame. Không ghi tên/điện thoại/từ khóa lọc vào file log vận hành. Nếu bật access log tại reverse proxy/IIS, không ghi query string/body của `/quan-tri` và các API có dữ liệu cá nhân.

Mỗi lần xem chi tiết hoặc xuất dữ liệu ghi vào `contest_access_audit`: khóa GUID tài khoản Umbraco, hành động, thời gian UTC, mã dự thi nếu có, bộ lọc chính xác được bảo vệ bằng ASP.NET Core Data Protection. Ghi nhật ký thất bại thì không cung cấp chi tiết/file xuất. Không lưu tên tài khoản hay thông tin thí sinh dạng rõ trong nhật ký. Đối chiếu `actor_user_key` với tài khoản Umbraco khi kiểm toán. Phải bảo vệ/sao lưu kho khóa Data Protection cùng dữ liệu; mất khóa sẽ không giải mã được bộ lọc cũ. Nhật ký này nằm trong CSDL ứng dụng, không bị chính sách xoay log file 30 ngày xóa đi.

Razor Pages được biên dịch sẵn để tồn tại trong bản Release; các Umbraco Views vẫn biên dịch động để giữ tương thích ModelsBuilder InMemoryAuto.

## Kiểm chứng tự động

```powershell
dotnet test .\ANTC.Portal.App\Umbraco.Plugin.Custom.Tests -p:OutDir="$env:TEMP\antc-admin-tests\"
```

Các kiểm thử bổ sung dùng SQLite thật, bao gồm:

- So dashboard/thống kê A/B/C/D trên 3 lượt biết trước; kiểm tra câu bỏ trống và snapshot không đổi theo ngân hàng.
- So bộ lọc `submitted + phone + score >= 180` với SQL trực tiếp; kiểm tra tên Unicode, biên ngày UTC+7 và phân trang không trùng dòng.
- 5.000 dòng CSV từ SQLite, BOM/tiếng Việt/chống công thức, ngưỡng dưới 5 giây; đo cục bộ khoảng 45–59 ms cho khâu truy vấn + ghi CSV vào stream (không bao gồm đường truyền của máy chủ thực).
- HTTP Razor Pages: 401/403/200, xuất bị chặn nếu thiếu anti-forgery, giữ bộ lọc khi xuất, tạo audit.
- Khởi động **ứng dụng Umbraco thật** bằng hai CSDL tạm mới: tự tạo nhóm, đăng nhập thật, từ chối non-member, cho phép sau khi gán nhóm trong fixture; tạo/trả lời/nộp qua API và thấy lượt trong danh sách, mở chi tiết đủ 200 câu, ghi audit.
- File log không chứa tên/điện thoại/từ khóa cá nhân khi xử lý yêu cầu quản trị.

Các CSDL của dự án không được dùng hoặc sửa trong các kiểm thử trên. Đo lại CSV qua HTTPS trên máy kiểm thử khi máy chủ đã sẵn sàng; số đo cục bộ không thay thế nghiệm thu đường truyền/máy chủ thật.

Kết quả ngày 20/10/2026: **167/167 kiểm thử đạt**, không bỏ qua kiểm thử nào. Publish Release `win-x64 --self-contained true` thành công; có CSS quản trị và Views động, không có file `.db` trong gói. Các cảnh báo NuGet về bảo mật dependency hiện có (NU1902/NU1903) vẫn còn; không nâng phiên bản Umbraco/dependency ngoài phạm vi task này.
