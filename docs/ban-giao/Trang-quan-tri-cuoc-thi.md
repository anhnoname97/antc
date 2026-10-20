# Quản trị cuộc thi trong backoffice

## Vị trí và quyền truy cập

Từ ngày 20/10/2026, các trang quản trị cuộc thi được chuyển hoàn toàn sang **Lit Element** trong section **Quản lý cuộc thi** của Umbraco. Không nhúng iframe và không dùng Razor Pages để hiển thị báo cáo.

| Menu trái | Đường dẫn |
| --- | --- |
| Tổng quan | `/umbraco/section/contest-management/dashboard` |
| Lượt thi | `/umbraco/section/contest-management/entries-report` |
| Thống kê câu hỏi | `/umbraco/section/contest-management/question-report` |
| Công bố kết quả | `/umbraco/section/contest-management/publication` |

Các mục Câu hỏi, Chuyên đề, Cuộc thi và chức năng tạo/quay thưởng hiện có được giữ lại. Tab “Lượt dự thi” trong màn hình Cuộc thi chuyển sang bảng báo cáo mới.

Khởi động lại ứng dụng, tải lại backoffice (Ctrl+F5). Ứng dụng tự tạo/giữ nhóm **Quản trị cuộc thi** (`quanTriCuocThi`) và cấp nhóm quyền vào section `Antc.Section.ContestManagement`. Trong **Users → User groups**, quản trị viên tự gán tài khoản vào nhóm; không tự thêm thành viên hoặc mặc định miễn quyền cho Administrators/Super User. Không tự cấp nhóm quyền Hỏi – Đáp.

Những tài khoản có quyền mở section để sửa câu hỏi nhưng không thuộc nhóm báo cáo vẫn nhận **403** khi gọi API báo cáo/xuất/công bố. Chưa đăng nhập nhận 401; người bị khóa/không được duyệt không có quyền. IP được kiểm tra theo allowlist backoffice sau forwarded headers tin cậy.

## Chức năng được giữ khi di chuyển

- Tổng quan số lượt tạo/nộp/có tên/ẩn danh, số điện thoại khác nhau, biểu đồ điểm của lượt nộp và số lượt theo ngày.
- Danh sách đầy đủ các cột, lọc cuộc thi/chế độ/trạng thái/có số điện thoại/điểm/ngày tạo, tìm mã-tên-điện thoại, sắp xếp, 50 dòng mỗi trang.
- Chi tiết mở trong dialog Lit: toàn bộ câu của snapshot, gồm cả câu chưa làm, đáp án chọn/đúng, kết quả/thời gian, tổng theo chuyên đề. Đóng bằng nút Đóng, nút góc trên hoặc Escape; chuyên đề thu gọn/mở rộng được.
- Thống kê mỗi câu, đúng/sai, lượt A/B/C/D, tỷ lệ đúng tăng dần, lọc chuyên đề; không trộn các phiên bản câu giữa nhiều cuộc thi.
- CSV UTF-8 BOM cho toàn bộ lượt theo bộ lọc, đáp án dạng dài và thống kê câu; chống công thức Excel. Không giới hạn vào trang đang hiển thị. Để giữ số 0 đầu điện thoại khi nhập Excel, đặt cột này thành Text.
- Nhật ký xem chi tiết và xuất ghi trong `contest_access_audit`, có GUID người dùng/thời gian/bộ lọc được Data Protection bảo vệ. Ghi audit thất bại thì không cung cấp dữ liệu. File log vận hành không chứa tên/điện thoại/từ khóa tìm kiếm.
- Chọn cuộc thi và các lần quay để công bố/gỡ kết quả ngay trong backoffice, có xác nhận. Giữ snapshot, revision và quy tắc hết thời gian gia hạn như API kết quả.

Giờ hiển thị theo Việt Nam (UTC+7); khoảng ngày lọc theo **ngày tạo lượt**, gồm cả ngày cuối. Lượt đã nộp dùng điểm đã chốt; lượt đang làm đếm đáp án hiện có. Chi tiết lấy bộ đề đóng băng, không lấy đáp án mới từ ngân hàng. Bộ chuẩn 200 câu hiển thị đủ 200; bộ chọn ít hơn hiển thị đúng số câu đã chọn. Lượt cũ thiếu snapshot có cảnh báo rõ ràng.

## API quản trị mới

Base: `/umbraco/management/api/v1/antc/contest-reports`.

| Phương thức/đường dẫn | Chức năng |
| --- | --- |
| GET `/options?contestId=...` | Danh sách cuộc thi/chuyên đề |
| GET `/dashboard` | Tổng quan |
| GET `/entries` | Danh sách lượt, 50 dòng/trang |
| GET `/entries/{id}` | Chi tiết và audit |
| GET `/questions?topicId=...` | Thống kê câu hỏi |
| GET `/export/entries` | CSV lượt và audit |
| GET `/export/answers` | CSV đáp án và audit |
| GET `/export/questions` | CSV thống kê và audit |
| GET `/contests/{id}/draws` | Các lần quay để chọn công bố, không trả thông tin cá nhân |
| GET `/contests/{id}/publication` | Trạng thái/revision công bố |
| PUT `/contests/{id}/publication` | Công bố/gỡ bằng `{isPublished, drawIds, expectedRevision}` |

Bộ lọc dùng tên **không có tiền tố `Filter.`**: `contestId`, `mode`, `status`, `hasPhone`, `scoreFrom`, `scoreTo`, `from`, `to`, `search`, `sort`, `page`. Sort: `created_desc`, `created_asc`, `score_desc`, `score_asc`, `submitted_desc`. Thống kê câu luôn sắp theo tỷ lệ đúng, không dùng sort lượt.

Các endpoint kế thừa `ManagementApiControllerBase`, dùng xác thực backoffice OpenIddict/PKCE chuẩn và kiểm tra nhóm tại máy chủ. Lit lấy `getLatestToken()` từ `UMB_AUTH_CONTEXT`, gửi Authorization và cookie cùng origin, thử làm mới phiên khi 401. Với bản Umbraco cookie-token, phải giữ cả header `Bearer [redacted]` do auth context cung cấp; không chỉ gửi cookie đăng nhập. Không yêu cầu lấy token anti-forgery từ Razor Pages cũ.

API công khai **`GET /api/v1/contests/{contestId}/results` giữ nguyên**, không yêu cầu đăng nhập, không bị chuyển thành API quản trị. Xem [hợp đồng kết quả](../api/Ket-qua-cuoc-thi.md).

## Phần Razor cũ đã gỡ

Đã gỡ các file `Pages/QuanTri/*`, layout/filter partials trong `Pages/Shared`, `_ViewImports`/`_ViewStart` của Pages, CSS `contest-admin.css`, đăng ký và map Razor Pages. Các Views Razor của cổng thông tin/Umbraco vẫn giữ nguyên và tiếp tục biên dịch động cho ModelsBuilder InMemoryAuto.

Các URL cũ `/quan-tri`, `/quan-tri/cuoc-thi`, `/quan-tri/luot-thi`, `/quan-tri/luot-thi/{id}`, `/quan-tri/thong-ke-cau-hoi` chỉ chuyển hướng vào màn hình backoffice tương ứng; không hiển thị bảng/form hoặc dữ liệu cá nhân tại URL cũ. Section Hỏi – Đáp và đường dẫn tương thích của section đó không bị xóa.

Không xóa/sửa dữ liệu cuộc thi, lượt thi, đáp án hoặc các migration đã có để thực hiện lần di chuyển giao diện này. Giữ và sao lưu kho khóa Data Protection để đọc nhật ký cũ.

## Kiểm thử

```powershell
dotnet test .\ANTC.Portal.App\Umbraco.Plugin.Custom.Tests -p:OutDir="$env:TEMP\antc-admin-tests\"
```

Kiểm thử HTTP thật chạy Umbraco bằng hai CSDL tạm, đăng nhập + đổi mã PKCE như backoffice: 401/403/200, bộ lọc, chi tiết đủ 200 câu, CSV BOM/audit, công bố/gỡ, API công khai và URL cũ chuyển hướng. Các kiểm thử số liệu, tranh chấp lần ghi, nộp bài và công bố đồng thời tiếp tục được giữ.

Có thêm kiểm thử trình duyệt tùy chọn: cài Playwright ở thư mục công cụ riêng, đặt `ANTC_RUN_BROWSER=1`, `ANTC_PLAYWRIGHT_MODULE` trỏ tới package Playwright, tùy chọn `ANTC_BROWSER_EXECUTABLE` trỏ Chromium có sẵn, rồi chạy `ContestAdministrationFullHostTests`. Kiểm tra đăng nhập backoffice, bốn route Lit, bảng, dialog 200 câu, Đóng/Escape, tải CSV và form công bố. Không cài package trình duyệt vào mã ứng dụng.

Kết quả xác nhận ngày 20/10/2026: **181/181 kiểm thử đạt**, gồm lần chạy trình duyệt thật. Publish Release tự chứa `win-x64` thành công: có manifest và `contest-reports.js`, giữ Views động của cổng thông tin, không còn Razor Pages quản trị cũ và không đóng gói file `.db`.
