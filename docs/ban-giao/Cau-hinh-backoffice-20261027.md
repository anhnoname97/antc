# Cấu hình backoffice ANTC — 27/10/2026

## Hành vi

- Hiển thị ba section Cài đặt, Gói mở rộng và Dịch thuật theo cấu hình chung cho mọi tài khoản (mặc định ẩn), bằng `registry.exclude` trong plugin `AntcVietnamese`. Đây là thay đổi giao diện, không sửa quyền của nhóm người dùng hoặc API.
- Giữ ngôn ngữ tài khoản backoffice là `vi`: đồng bộ tài khoản hiện có khi ứng dụng khởi động; áp dụng khi tạo hoặc lưu tài khoản. `DefaultUILanguage` của CMS vẫn là `vi-VN`.
- Bật `Umbraco:CMS:Security:KeepUserLoggedIn` để tự gia hạn và không hiện cảnh báo hết phiên do không thao tác.
- `BackofficeSessionHandler` bỏ ngày hết hạn của refresh token riêng cho client `umbraco-back-office`, sau bước chuẩn bị refresh-token principal của OpenIddict. Access token vẫn có thời hạn bình thường; client khác không bị thay đổi.
- Đăng xuất/thu hồi token vẫn có hiệu lực. Cookie bị xóa hoặc phiên trình duyệt bị đóng thì có thể cần đăng nhập lại. Phiên cũ cần đăng xuất rồi đăng nhập một lần để nhận refresh token mới không có hạn thời gian.

## Kiểm chứng

- Build web thành công; 14 kiểm thử liên quan phiên đăng nhập, quyền riêng tư quản trị và an toàn triển khai đạt.
- Trình duyệt Chromium trên ứng dụng cổng 11000: đăng nhập, giao diện tiếng Việt, ba section bị loại khỏi registry và thanh điều hướng; không có lỗi JavaScript.
- Mô phỏng bộ đếm thời gian trình duyệt qua 21 phút, kiểm tra gia hạn thành công và không xuất hiện modal hết phiên. Đây là mô phỏng, không phải chờ thực tế 21 phút.
- SQLite xác nhận refresh token mới có `ExpirationDate = NULL`, access token vẫn có ngày hết hạn. Đăng xuất chủ động đưa về trang logout và API người dùng hiện tại trả 401.
- Trên bản sao SQLite riêng ở thư mục tạm: đổi tài khoản có sẵn sang `en-US` trước khi khởi động, xác nhận được đồng bộ thành `vi`; tạo thêm tài khoản qua Management API, xác nhận tài khoản mới lưu `vi`; cập nhật hồ sơ yêu cầu `en-US` vẫn giữ `vi`. Không tạo tài khoản thử trên CSDL đang dùng.
- Hai CSDL đang dùng đều có `PRAGMA integrity_check = ok`.

Sao lưu trước thay đổi tại `src/ANTC.Portal.App/Umbraco.Web.UI/App_Data/backups/backoffice-settings-20261027-093450/` gồm cả CMS và CSDL ứng dụng. Không sửa mã nguồn/gói NuGet của Umbraco core.

## Biểu tượng khiên ANTC

Thay logo Umbraco bằng SVG khiên do người dùng cung cấp. Hai biến thể tại `wwwroot/umbraco/branding/` dùng màu trắng trên nền tối và màu xanh trên nền sáng. Cấu hình `Umbraco:CMS:Content` trỏ bốn thuộc tính logo backoffice/đăng nhập tới các ảnh này. Plugin `AntcVietnamese` phiên bản 1.2.0 đặt kích thước logo thanh quản trị 20×20 và URL favicon có phiên bản.

`BackofficeBranding` chuyển ba URL logo/favicons viết cứng của Umbraco sang ảnh khiên trước middleware Umbraco. Không đặt file trùng đường dẫn static assets của gói core, vì SDK báo trùng asset khi build. Các ảnh mang nhãn hiệu Umbraco nằm bên trong ảnh nền đăng nhập không thuộc phạm vi thay biểu tượng.

Đã chạy `dotnet run` thành công và kiểm tra Chromium: bảy URL graphics/logo/favicon trả SVG khiên; logo header tải được và có kích thước 20×20; trang đăng nhập và hộp thông tin hiển thị đúng ảnh mới; không có lỗi JavaScript. Đã dừng host kiểm tra để trả cổng 11000 cho người dùng.

### Sửa favicon cũ nháy khi reload

HTML gốc của Umbraco khai báo favicon ở URL `/umbraco/backoffice/{hash}/assets/favicon.svg`, còn JavaScript plugin chỉ đổi sang khiên sau khi tải xong. Bản 1.3.0 bỏ thao tác đổi favicon muộn trong JavaScript. `BackofficeBrandingViewFilter` chọn hai shell Razor trong `Views/Backoffice/` để khai báo trực tiếp `/umbraco/branding/shield.svg?v=1.3.0` từ HTML đầu tiên, cho cả quản trị và đăng nhập. Hai shell dựa trên Umbraco 18.2.1; cần đối chiếu với core khi nâng phiên bản. Không thay gói NuGet core.

Middleware branding cũng xử lý URL logo/favicon có hash của Umbraco. Kiểm chứng Chromium: mỗi trang tải ba lần với JavaScript tắt, rồi ba lần với script bị chặn; tất cả đều có đúng favicon khiên trong HTML gốc và DOM trước khi `umb-app` được định nghĩa. Kiểm tra lại đăng nhập, logo header 20×20, popover và bảy endpoint ảnh đều đạt, không có lỗi JavaScript.

## Bật/tắt section bằng cấu hình

Trong `src/ANTC.Portal.App/Umbraco.Web.UI/appsettings.json`:

```json
"Antc": {
  "Backoffice": {
    "Sections": {
      "ShowSettings": false,
      "ShowPackages": false,
      "ShowTranslation": false
    }
  }
}
```

- `ShowSettings`: Cài đặt; `ShowPackages`: Gói mở rộng; `ShowTranslation`: Dịch thuật.
- `false`: ẩn với tất cả tài khoản, gồm quản trị viên. `true`: cho phép hiện theo quyền Umbraco sẵn có của tài khoản; không tự cấp thêm quyền.
- Sửa cấu hình và tải lại toàn bộ trang quản trị, không cần build. Tab đang mở cần reload để nhận cấu hình mới. Có thể ghi đè theo môi trường hoặc `appsettings.Local.json` theo thứ tự cấu hình .NET hiện có.
- Thiếu khóa thì mặc định `false`, giữ hành vi ẩn đã yêu cầu.
- `BackofficeSectionVisibility` đọc cấu hình trên máy chủ. Shell quản trị xuất danh sách ẩn dưới dạng JSON ngay trong HTML, trước khi JavaScript khởi tạo. Plugin bản 1.4.0 đọc danh sách này; không còn danh sách ẩn cố định trong JavaScript và không thêm API cấu hình công khai.

Đã kiểm tra đủ tám tổ hợp ba công tắc trên Chromium: cấu hình được đọc lại mà không restart, registry và thanh điều hướng đều đúng, không có lỗi JavaScript. Sau kiểm tra đã trả cả ba giá trị về `false`.
