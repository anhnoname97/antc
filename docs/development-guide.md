# Hướng dẫn phát triển

## Thêm một tính năng

1. Xác định dữ liệu là nội dung CMS hay dữ liệu nghiệp vụ.
2. Với nội dung CMS, thiết kế Document Type/Data Type trước rồi dùng published content API trong lớp chuẩn bị ViewModel.
3. Với nghiệp vụ riêng, mô tả use case, input, output, rule và quyền truy cập trước khi chọn persistence.
4. Controller chỉ xử lý ranh giới HTTP; Razor chỉ trình bày dữ liệu đã chuẩn bị.
5. Đặt class theo feature và trách nhiệm cụ thể; không tạo abstraction khi chưa có nhu cầu thay thế hoặc kiểm thử.
6. Bổ sung test tương ứng với mức rủi ro rồi build toàn solution.

## Dependency Injection

- Dùng constructor injection.
- `Scoped` dành cho công việc gắn với request hoặc DbContext.
- `Singleton` không được giữ trực tiếp dependency `Scoped`.
- `Transient` phù hợp với service nhẹ, không giữ state.
- Đăng ký dịch vụ tại một vị trí có chủ đích: `Program.cs`, extension theo module hoặc Umbraco Composer khi cần tích hợp lifecycle CMS.

## Quy ước Umbraco

- Không tạo Controller cho mọi Document Type.
- Không chỉnh file model được Models Builder sinh tự động.
- Block Grid component đặt tại `Views/Partials/blockgrid/Components/{alias}.cshtml`.
- Block List component đặt tại `Views/Partials/blocklist/Components/{alias}.cshtml`.
- Dùng Composition cho nhóm trường dùng chung như SEO khi nhiều Document Type thực sự chia sẻ chúng.

## Cấu hình

- Cấu hình chung, không nhạy cảm: `appsettings.json`.
- Cấu hình Development không chứa secret cá nhân: `appsettings.Development.json`.
- Secret local: `.env` và `appsettings.Local.json`.
- Production: biến môi trường hoặc secret manager.

Biến môi trường .NET dùng dấu gạch dưới kép cho cấu trúc lồng nhau, ví dụ `ConnectionStrings__umbracoDbDSN`.

## Kiểm tra trước khi bàn giao

```powershell
dotnet restore AnToanTaiChinh.sln
dotnet build AnToanTaiChinh.sln --configuration Release
dotnet test AnToanTaiChinh.sln --configuration Release --no-build
docker compose config
docker compose ps
```

Sau đó kiểm tra website, `/umbraco/`, log mới nhất và migration/schema nếu thay đổi persistence.
