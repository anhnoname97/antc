# Bàn giao sửa review backoffice Các rủi ro — 10/11/2026

Phạm vi: BO-01 đến BO-13 của file review được cung cấp. Không đóng toàn bộ review website. Giữ nguyên alias, khóa nội dung và tên trường JSON đang có.

## Thay đổi theo mục review

| Mục | Thay đổi | Kiểm chứng |
|---|---|---|
| BO-01 | `RiskSchemaMigration` chỉ chạy ở Development khi bật SchemaBuilder; kiểm tra runtime/Trang chủ, bắt lỗi để các handler sau tiếp tục. `RiskStructureAdoption` có marker riêng cho trang cố định, nhánh trùng, tham chiếu, loại trang cũ và gom nội dung. | Test môi trường/thiếu Trang chủ; full-host test trên CMS trống qua; host sạch đạt `uSync: Startup Complete`. Lần khởi động sau không lặp thao tác chuyển nội dung. |
| BO-02 | Khôi phục `Media/RiskMediaInitializer.cs`, đọc 9 ảnh đã commit trong assets, ghi bằng `MediaFileManager` theo khóa Media uSync. Marker theo từng ảnh; chỉ khôi phục khi thiếu file mẫu, giữ ảnh đã thay. | `risk-review.smoke.cjs`: 9 Media đọc được qua API và cả 9 URL `/media/` trả 200. |
| BO-03 | `RiskBackofficeController` dùng snapshot chung, có `type`/`parent`, chỉ trả các trường danh sách; bỏ `siteSettings`, `summary`, `readingBody`; kiểm quyền đọc và xóa từng mục mỗi request. Collection chỉ tải các mục trong thư mục và các danh mục cần hiển thị. | Test quyền bị đổi giữa hai request, lọc type, projection; smoke kiểm truy cập ẩn danh 401. Catalog toàn bộ fixture khoảng 66 KB, so với 414 KB ghi trong review (hai bộ dữ liệu không hoàn toàn giống nhau). Không còn CS8625 tại controller này. |
| BO-04 | Kiểm từng dòng nguồn tham khảo, tiêu đề, HTTPS, cấu trúc JSON, ít nhất một bước mỗi kịch bản và giới hạn Loạt bài ở Bài đọc thêm. | Test các ca sai/đúng trong `RiskManagementReviewTests.cs`; native publish thiếu trường bị từ chối. |
| BO-05 | `AlertFreshness.Today(TimeProvider)` thống nhất ngày Việt Nam; dùng trong save handler, job, catalog, derive và ba view có tính ngày. | Test 23:30 UTC thành ngày tiếp theo tại Việt Nam. InfoPanel dùng kết quả máy chủ, không tự tính theo giờ máy người dùng. |
| BO-06 | Catalog trả `freshDaysLeft`; cột hiện `Còn N ngày`, `Quá 90 ngày`, hoặc `–`. | Test ngày 0/90/91 và thiếu ngày; ảnh danh sách 1440/390px. |
| BO-07 | Đồng bộ nhãn Đã đăng/Nháp, Gỡ khỏi website, xác nhận, thông báo và chân bảng; hiện dấu kéo ⋮⋮. | Smoke xuất bản/gỡ hàng loạt; ảnh danh sách Bài viết/Cảnh báo 1440/390px. |
| BO-08 | Nút Xóa chỉ hiện khi có mục được quyền xóa; gọi native referenced-by trước khi đưa từng mục vào thùng rác; giữ và liệt kê mục còn tham chiếu. | Smoke tạo hai bài, một bài có thủ đoạn tham chiếu: chỉ bài không tham chiếu vào thùng rác. |
| BO-09 | Bổ sung test validation, ảnh thay thế ở 4 loại trang, bài chứa thủ đoạn, trang cố định, autofill, ngày Việt Nam, giá trị TTL, phiên bản đã đăng, catalog và cache. | Toàn bộ kiểm thử C# và smoke bên dưới. |
| BO-10 | `RiskContentCache` singleton có snapshot riêng cho bản đã đăng/bản nháp, bỏ cache khi preview; notification lưu/đăng/gỡ/xóa/di chuyển/sắp thứ tự làm mất hiệu lực cache. | Test lần đọc được tái sử dụng, preview đọc mới, đăng thủ đoạn mới làm lần gọi kế tiếp thấy dữ liệu mới. Dịch vụ sẵn cho phần tích hợp website WEB-01/WEB-07. |
| BO-11 | Autofill đối tượng dùng snapshot riêng; lưu cảnh báo không buộc đọc lại toàn bộ danh mục đối tượng. | Test lưu cảnh báo không đọc lại nguồn; sửa đối tượng làm mất hiệu lực lookup. |
| BO-12 | Chuyển `AlertFreshness` sang `Core/PortalV2/Alerts/AlertFreshness.cs`; giữ namespace, tên lớp và các hàm cũ để tương thích view. | Build, test ngày và freshness. |
| BO-13 | Thêm mục hiệu chỉnh kết quả vào cuối `TRIEN-KHAI-BACKOFFICE.md`. | Lệnh và kết quả thật ghi bên dưới. |

NG-01 cũng đã được sửa vì là danh mục backoffice và làm suite lỗi: bổ sung Loại lựa chọn trình hỏi đúng seed; file `DanhMucLoaiLuaChonTrinhHoi.config` được xuất từ uSync trên host riêng. Hai picker `ChonBaiViet.config`, `ChonCanhBao.config` cũng được xuất lại để trỏ đúng GUID loại trang hiện hành; không đổi khóa của picker hay content type.

## Kiểm chứng và cách chạy lại

Từ `src`:

```powershell
dotnet test ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Umbraco.Plugin.Custom.Tests.csproj --no-restore -v quiet
```

Kết quả: **561 qua, 0 lỗi, 0 bỏ qua**, có `ContestAdministrationFullHostTests` và test fixed-list trước đây bị lỗi. Các cảnh báo package/obsolete/nullability còn lại được giữ nguyên, không xem là lỗi kiểm thử.

Từ gốc repo, dựng host riêng:

```powershell
.\run-isolated.ps1 -Fresh -BuildSchema
# Hoặc không có -Fresh để sao chép hai SQLite bằng online backup.
```

Script tạo thư mục riêng trong `temp/risk-review-*`, không reset hoặc ghi lên CSDL làm việc; dừng sớm nếu cổng đã có người dùng. Output gồm PID, URL và đường dẫn marker. `-BuildSchema` chỉ dùng cho host Development phục vụ xuất schema.

Các script browser dùng `ANTC_TEST_URL=http://localhost:11123`, `ANTC_TEST_MARKER_PATH` từ output, `ANTC_ALLOW_ISOLATED_WRITES=1`, tài khoản qua biến môi trường `ANTC_BACKOFFICE_USERNAME`/`ANTC_BACKOFFICE_PASSWORD`. Cấu hình Playwright/Chromium qua `ANTC_PLAYWRIGHT_MODULE`/`ANTC_BROWSER_PATH` nếu cần. Không ghi mật khẩu vào script hoặc hồ sơ bàn giao.

```powershell
node src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Browser/risk-management.smoke.cjs
node src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Browser/risk-review.smoke.cjs
node src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Browser/risk-editor-appearance.smoke.cjs
```

Chạy các script nối tiếp để script xóa fixture không làm mất nội dung mà script appearance đang duyệt. Cả ba script đã qua, không lỗi JavaScript. Appearance kiểm tra 37 trang, 111 lần đo SEO ở 1440/744/390px và 34 biểu tượng. Ảnh/JSON/log/TRX đặt dưới `temp/risk-review-*` và không đưa vào Git.

## Ranh giới kết quả

- Không chạy `run-local -Reset` trên CSDL làm việc. Đã kiểm tra cài CMS mới và import uSync trong thư mục độc lập tương đương môi trường sạch.
- Import nội dung mẫu hiện vẫn ghi một số lỗi xuất bản do dữ liệu mẫu thiếu trường/tham chiếu của các gói khác. Host vẫn khởi động và không có lỗi từ `RiskSchemaMigration`; không báo rằng toàn bộ dữ liệu website đã xuất bản sạch.
- WEB-01…WEB-12 vẫn thuộc phần website; chỉ thay cách tính hôm nay trong ba view để không lệch với hàm dùng chung BO-05. Bộ đệm chưa được tích hợp vào các view vốn tự quét cây.
- Kiểm tra appearance phát hiện thêm việc textarea SEO có thể đo trước khi editor con render xong: đã chờ `updateComplete` và đo lại khi dữ liệu thay đổi. Kiểm thử đợi điều kiện kích thước thực thay cho một khoảng nghỉ cố định.

## Cập nhật 10/11/2026 — lỗi TemplateNotAllowed khi lưu Cảnh báo mới

Đã kiểm tra trực tiếp host localhost:11000 và CSDL đang dùng. Có 20 loại nội dung liên quan, 106 mục chưa bị đưa vào thùng rác. Ba loại `alertListPage`, `alertPage`, `riskArticlePage` không có liên kết template được phép trong CSDL, trong khi các mục nội dung đã chọn template. Tổng cộng 27 mục bị lệch: 1 Cảnh báo mới, 11 Cảnh báo, 15 Bài viết. Năm loại trang nhóm đã có template NhomRuiRo hợp lệ.

Đây là sai lệch giữa cấu hình runtime và uSync; chưa có bằng chứng để kết luận thao tác nào trước đó làm mất liên kết. Một số document type trong CSDL cũ có GUID khác file uSync, nên công cụ sửa tìm theo alias qua API, không thay khóa hoặc tạo lại loại nội dung.

Đã sao lưu online hai SQLite vào `temp/risk-template-review/template-fix-20261110/before-live-repair/`, sau đó dùng Management API của Umbraco để bổ sung template/default còn thiếu cho đúng ba loại. Giữ mọi template bổ sung đã có; không gán lại template trên từng mục và không tự xuất bản nội dung thật. So sánh SHA-256 trước/sau xác nhận toàn bộ hàng của `umbracoPropertyData`, `umbracoContentVersion`, `umbracoDocumentVersion`, `umbracoDocument` giữ nguyên. Các thiết lập khác của document type được đối chiếu qua API và giữ nguyên. Số mục có template không hợp lệ còn 0, `PRAGMA quick_check=ok`.

Cấu hình uSync trong source vốn đã có đủ template đúng. Export tự động trên máy dùng CSDL cũ đã được đối chiếu và phục hồi về đúng bản source trước thao tác này, tránh đưa GUID cục bộ và cấu hình cũ ghi đè schema của nhánh hiện hành. Cấu hình runtime đã được lưu qua dịch vụ Umbraco và có hiệu lực ngay, không cần khởi động lại.

Kiểm chứng trên bản sao CSDL ở localhost:11123:

- `risk-template-save.smoke.cjs`: tái hiện HTTP 400 TemplateNotAllowed khi thiếu liên kết; khôi phục rồi lưu lại đủ 106 mục, giữ nguyên template đã chọn.
- Cả 7 trang cố định (trang tổng, Cảnh báo mới và 5 nhóm) đều nhận HTTP 200 từ `update-and-publish` với dữ liệu kiểm thử hợp lệ.
- Cả 4 template bài viết `BaiDocChuyenDe`, `BaiHuongDanRuiRo`, `BaiVietRuiRo`, `HuongDanTinhHuong` đều lưu và xuất bản được.
- Trên UI thật của Cảnh báo mới, nút Lưu nhận HTTP 200 từ API update và nút Lưu và xuất bản nhận HTTP 200 từ API gộp `update-and-publish`. Không lỗi JavaScript.
- `risk-management.smoke.cjs` chạy lại đạt. Công cụ tạo fixture giờ chọn default template thật thay vì luôn gửi `template: null`, để kiểm thử không bỏ lọt lỗi cấu hình tương tự.

Công cụ `risk-template-bindings.cjs` mặc định chỉ kiểm tra. `--repair` chỉ bổ sung liên kết thiếu, yêu cầu host riêng có nonce hoặc cờ rõ ràng `ANTC_ALLOW_LOCAL_SCHEMA_REPAIR=1` trên localhost:11000. Công cụ luôn kiểm tra template và toàn bộ kế hoạch trước khi ghi; không thay nội dung hoặc trạng thái xuất bản.
