# Kiến trúc AnToanTaiChinh

## Kiến trúc vật lý

Solution được tách thành năm project:

| Project | Trách nhiệm |
|---|---|
| `AnToanTaiChinh.Web` | Umbraco host, Backoffice, HTTP endpoints, Razor views và composition root |
| `AnToanTaiChinh.Application` | Use case, DTO, validation cấp ứng dụng và interface cho hạ tầng |
| `AnToanTaiChinh.Domain` | Entity, value object, enum, exception và bất biến nghiệp vụ |
| `AnToanTaiChinh.Infrastructure` | Repository, persistence, email và external-service implementation |
| `AnToanTaiChinh.Tests` | Unit test và integration test |

## Chiều phụ thuộc

```text
Web -----------------> Application ---------> Domain
  \-----------------> Infrastructure ------> Application + Domain

Tests --------------> Application + Domain + Infrastructure
```

Domain không tham chiếu project nào. Application không biết Web, Umbraco hoặc Infrastructure. Infrastructure triển khai contract của Application. Web là composition root và lắp ghép implementation.

## Ranh giới Web

| Đường dẫn | Trách nhiệm |
|---|---|
| `Controllers/Api` | Validate HTTP input, gọi Application use case và trả status code phù hợp |
| `Controllers/Website` | Surface Controller hoặc custom website routing khi thật sự cần |
| `Views` | Razor templates và partials; không truy vấn database trực tiếp |
| `Models/ViewModels` | Dữ liệu trình bày riêng cho màn hình |
| `Composers` | Tích hợp cần lifecycle composition của Umbraco |
| `Components` | Thành phần Web có trách nhiệm rõ ràng |
| `Middleware` | Xử lý xuyên suốt HTTP pipeline |
| `Extensions` | Extension gom đăng ký/cấu hình theo module |
| `Configuration` | Strongly typed options, không chứa secret mặc định |
| `Constants` | Hằng số Web ổn định và dùng chung |
| `wwwroot` | Tài nguyên công khai; không chứa secret hoặc dữ liệu nhạy cảm |

## Application và Domain

Module được nhóm theo feature, ví dụ `Articles` và `Categories`. Application chứa `IArticleService`, DTO, validator và repository contract. Domain chứa `Article`, `Slug`, `ArticleStatus` và domain exception.

Các class hiện tại là nền tảng biên dịch được cho module Articles. Chưa có repository PostgreSQL vì schema dữ liệu bài viết chưa được xác nhận. Không đăng ký một implementation giả và không tự tạo bảng nghiệp vụ trong database Umbraco.

## Infrastructure

`DependencyInjection.cs` là điểm đăng ký adapter. Mỗi repository hoặc external service chỉ được đăng ký khi contract, schema, lifetime và cấu hình đã được xác nhận.

Nếu dùng EF Core cho dữ liệu nghiệp vụ, DbContext và migration phải thuộc Infrastructure, có lịch sử riêng và không sửa bảng nội bộ Umbraco.

## Umbraco và PostgreSQL

Umbraco dùng `Our.Umbraco.PostgreSql` và PostgreSQL trong `compose.yml`. Secret local nằm trong `.env` và `src/AnToanTaiChinh.Web/appsettings.Local.json`; cả hai bị Git bỏ qua. Named volume `attc-admin-db-data` giữ dữ liệu khi container được tạo lại.

Content tree dành cho nội dung biên tập. Dữ liệu tài khoản, hồ sơ, giao dịch hoặc dữ liệu tài chính nhạy cảm phải có mô hình, schema, phân quyền và audit riêng.
