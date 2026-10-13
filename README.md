# AnToanTaiChinh

Website quản trị nội dung tài chính xây dựng trên .NET 10, Umbraco CMS 18 và PostgreSQL theo kiến trúc phân lớp.

## Công nghệ

- .NET 10 / ASP.NET Core
- Umbraco CMS 18.2.1
- Our.Umbraco.PostgreSql 18.2.2
- PostgreSQL 17 bằng Docker Compose
- Razor Views
- xUnit cho kiểm thử tự động

## Cấu trúc solution

```text
AnToanTaiChinh/
├── src/
│   ├── AnToanTaiChinh.Web/             Umbraco host, HTTP và giao diện
│   ├── AnToanTaiChinh.Application/     Use case, DTO và contracts
│   ├── AnToanTaiChinh.Domain/          Entity và quy tắc nghiệp vụ
│   ├── AnToanTaiChinh.Infrastructure/  Persistence và external adapters
│   └── AnToanTaiChinh.Tests/           Unit và integration tests
├── docs/
├── compose.yml
├── Directory.Packages.props
└── AnToanTaiChinh.sln
```

Chiều phụ thuộc:

```text
Web -> Application -> Domain
Web -> Infrastructure -> Application + Domain
Tests -> Application + Domain + Infrastructure
```

## Chạy local

Yêu cầu: .NET SDK 10 và Docker Desktop.

1. Tạo cấu hình Docker cục bộ nếu chưa có:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Đổi `POSTGRES_PASSWORD` trong `.env`, sau đó khởi động PostgreSQL:

   ```powershell
   docker compose up -d
   docker compose ps
   ```

3. Tạo `src/AnToanTaiChinh.Web/appsettings.Local.json` với connection string local. File này và `.env` đã được loại khỏi Git.

4. Restore, build, test và chạy:

   ```powershell
   dotnet restore AnToanTaiChinh.sln
   dotnet build AnToanTaiChinh.sln
   dotnet test AnToanTaiChinh.sln --no-build
   dotnet run --project src/AnToanTaiChinh.Web/AnToanTaiChinh.Web.csproj
   ```

5. Mở Backoffice tại `https://localhost:44332/umbraco/` hoặc `http://localhost:53410/umbraco/`.

## Nguyên tắc

- Web chỉ xử lý CMS, HTTP, composition root và giao diện.
- Application điều phối use case nhưng không phụ thuộc Web hoặc Infrastructure.
- Domain không phụ thuộc ASP.NET Core, Umbraco hay PostgreSQL.
- Infrastructure triển khai contracts do Application sở hữu.
- Không commit `.env`, `appsettings.Local.json`, connection string hoặc secret.
- Không sửa trực tiếp bảng nội bộ Umbraco.
- Không chỉnh sửa thủ công model do Models Builder sinh ra.

Xem thêm [kiến trúc](docs/architecture.md), [hướng dẫn phát triển](docs/development-guide.md) và [triển khai](docs/deployment.md).
