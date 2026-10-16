# antoantaichinh.vn

Website tuyên truyền an toàn tài chính, dựng trên Umbraco 18.2.1 (.NET 10) và SQLite.

## Chạy lần đầu

Chỉ cần cài [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0). Không cần Docker, Node hay máy chủ CSDL.

```powershell
git clone <địa chỉ repo>
cd 26.antc-portal
.\run-local.ps1        # macOS/Linux/Git Bash: ./run-local.sh
```

Lần chạy đầu mất khoảng 1 phút. Script tự làm hết:

- cài đặt Umbraco và tạo CSDL SQLite;
- nhập document type, template và cây nội dung mẫu từ thư mục `uSync`;
- tạo CSDL ứng dụng và nạp 200 câu hỏi của 8 chuyên đề.

Khi thấy dòng `uSync: Startup Complete` là dùng được:

| | |
|---|---|
| Trang web | http://localhost:11000 |
| Quản trị (backoffice) | http://localhost:11000/umbraco |
| Tài khoản local | `admin@antc.local` / `Antc@Local2026` |

Tài khoản trên chỉ dùng cho máy cá nhân. Muốn đổi thì sửa `appsettings.Local.json` trước lần chạy đầu, hoặc đổi trong backoffice.

Trong lần chạy đầu, log có vài dòng `unable to open database file`. Đó là Umbraco dò CSDL trước khi tạo, không phải lỗi.

## Cấu trúc

```text
26.antc-portal/
├── run-local.ps1 / .sh        Chạy website trên máy cá nhân
├── core_build.ps1 / .sh       Build lại core Umbraco vào feed nội bộ (chỉ khi sửa core)
├── docs/
│   ├── ban-dung/              Bản dựng giao diện gốc (HTML)
│   └── ke-hoach/              Kế hoạch 60 công việc (Excel) và mô tả công việc FE có ảnh (Word)
└── src/
    ├── ANTC.Portal.Core/      Mã nguồn core Umbraco 18.2.1. Ít khi phải đụng tới.
    ├── ANTC.Portal.Lib/
    │   └── Build.Core/        Feed NuGet nội bộ: 21 gói core đã build, ĐƯỢC COMMIT
    └── ANTC.Portal.App/       Nơi cả nhóm viết code
        ├── Umbraco.Web.UI/               Host: Program.cs, appsettings, Views, wwwroot, uSync
        ├── Umbraco.Plugin.Custom.Core/   Nghiệp vụ: CSDL ứng dụng, dịch vụ
        └── Umbraco.Plugin.Custom.Api/    API /api/v1/...
```

Ba tầng hoạt động thế này: `ANTC.Portal.Core` được đóng gói thành các gói NuGet trong `ANTC.Portal.Lib/Build.Core`; `ANTC.Portal.App` tham chiếu core qua các gói đó (xem `ANTC.Portal.App/nuget.config`), không tham chiếu mã nguồn. Nhờ feed được commit, người làm ở tầng App không phải build core.

## Đã có sẵn

| Hạng mục | Ở đâu | Ghi chú |
|---|---|---|
| CSDL Umbraco | `Umbraco.Web.UI/umbraco/Data/Umbraco.sqlite.db` | Tự tạo ở lần chạy đầu, không commit |
| Document type, template, nội dung mẫu | `Umbraco.Web.UI/uSync/v18/` | 11 document type, 10 template, 33 nút nội dung; uSync tự nhập khi khởi động |
| CSDL ứng dụng (8 bảng) | `Custom.Core/Data/` | EF Core + SQLite, file `App_Data/app.sqlite.db`, migration tự chạy khi khởi động |
| Ngân hàng câu hỏi | `Custom.Core/Data/Seed/*.json` → bảng `quiz_topic`, `quiz_question` | 8 chuyên đề, 200 câu, 8 câu Thử sức |
| API đọc câu hỏi | `Custom.Api/Controllers/QuizController.cs` | `GET /api/v1/quiz/topics`, `/topics/{n}/questions`, `/sample` |
| Quản lý cuộc thi | `Custom.Api/Controllers/ContestAdminController.cs` và `App_Plugins/ContestManagement/` | Backoffice tìm kiếm lượt dự thi, xem chi tiết và CRUD lần quay số |
| File tĩnh | `Umbraco.Web.UI/wwwroot/assets/` | Font Manrope, GSAP 3.12.5, 5 ảnh hero, biến thiết kế, CSS nền |
| Layout và các trang | `Umbraco.Web.UI/Views/` | Layout tạm và trang giữ chỗ; mỗi trang ghi sẵn mã công việc cần làm |

Các URL đã chạy: `/`, `/ung-pho`, `/thu-doan`, `/thu-doan/{danh-muc}`, `/tham-gia`, `/tham-gia/thu-suc`, `/tham-gia/cuoc-thi`, `/hoi-dap`, `/chinh-sach`, `/tim-kiem`.

## Làm việc hằng ngày

**Frontend** sửa trong `Umbraco.Web.UI/Views` (file `.cshtml`) và `Umbraco.Web.UI/wwwroot/assets`. Sửa xong chỉ cần tải lại trang, không phải build lại.

- `Views/Shared/_SiteLayout.cshtml` là khung trang tạm; dựng lại theo FE-02, FE-03.
- Mỗi trang là một file trong `Views/` (`home.cshtml`, `ungPhoPage.cshtml`…), hiện đang gọi `_PageStub`. Thay bằng giao diện thật.
- Màu, cỡ chữ, khoảng cách lấy từ biến trong `assets/css/tokens.css`. Cỡ chữ viết bằng `rem`.
- Không viết `style="..."` trong HTML.

**Backend** sửa trong `Umbraco.Plugin.Custom.Core` và `Umbraco.Plugin.Custom.Api`, sau đó chạy lại `run-local`.

- Dịch vụ mới đăng ký trong `Custom.Core/Composers/CustomCoreComposer.cs`.
- API mới đặt trong `Custom.Api/Controllers`, tiền tố `/api/v1`.
- Đổi cấu trúc bảng: sửa entity trong `Custom.Core/Data/Entities.cs`, rồi tạo migration:

  ```powershell
  dotnet tool restore
  cd src\ANTC.Portal.App
  dotnet ef migrations add TenThayDoi --project Umbraco.Plugin.Custom.Core --startup-project Umbraco.Plugin.Custom.Core --output-dir Data\Migrations
  ```

  Migration được áp dụng tự động ở lần khởi động kế tiếp.

**Document type và nội dung** sửa trong backoffice. Mỗi lần bấm lưu, uSync ghi thay đổi ra file trong `Umbraco.Web.UI/uSync/v18`; commit các file đó cùng với code. Người khác kéo code về và chạy lại là uSync tự nhập thay đổi lúc khởi động, không phải thao tác gì thêm. Hai người cùng sửa một document type thì xử lý xung đột trên file `.config` như với code.

Cơ chế tự xuất và tự nhập này chỉ bật ở môi trường Development (xem `appsettings.Development.json`). Ở môi trường chính thức uSync chỉ nhập một lần khi CSDL còn trống; các lần sau nhập bằng tay trong backoffice, mục Settings → uSync.

## Lệnh thường dùng

| Việc | Lệnh |
|---|---|
| Chạy website | `.\run-local.ps1` |
| Xóa CSDL local và tạo lại từ đầu | `.\run-local.ps1 -Reset` |
| Chỉ build, không chạy | `.\run-local.ps1 -NoRun` |
| Đã sửa core, build lại rồi chạy | `.\run-local.ps1 -BuildCore` |
| Build lại core vào feed | `.\core_build.ps1` |
| Build lại cả backoffice của core | `.\core_build.ps1 -BuildSpa` |
| Đóng dấu phiên bản core khi phát hành | `.\core_build.ps1 -Version 18.2.1-antc.20261101` |

Trong VS Code có sẵn cấu hình debug “Chay website (debug)” (phím F5).

## Khi nào phải build core

Chỉ khi sửa mã trong `src/ANTC.Portal.Core`. Sau khi `core_build` chạy xong, commit cả mã core đã sửa lẫn các file `.nupkg` mới trong `src/ANTC.Portal.Lib/Build.Core`.

Build lại backoffice (`-BuildSpa`) cần Node.js. Core 18.2.1 khai báo cần Node 24 trở lên; bản build hiện tại được tạo bằng Node 22.14 và chạy được, nhưng npm có in cảnh báo phiên bản.

Phiên bản core mà App dùng nằm ở một chỗ duy nhất: `UmbracoCoreVersion` trong `src/ANTC.Portal.App/Directory.Build.props`.

## Việc còn để lại

- Một số thuộc tính đang dùng kiểu nhập tạm (Textstring/Textarea) thay cho Block List, Dropdown và số thập phân: `emergencyNumbers` (home), `labelType` (article), `fieldIcon` và `listRole` (articleList), `readTimerFactor` (thiPage). BE1 đổi trong backoffice rồi commit file uSync.
- Chưa có composition SEO dùng chung; các thuộc tính SEO đang được thêm trực tiếp vào từng document type.
- Khi restore, NuGet cảnh báo lỗ hổng của `SixLabors.ImageSharp 3.1.12` (gói mà Umbraco 18.2.1 kéo theo). Cần xem có bản vá để ghim trong `Directory.Packages.props` trước khi vận hành.
- Các API cuộc thi, hỏi đáp, trang quản trị, nhập ma trận câu hỏi: làm theo file kế hoạch trong `docs/ke-hoach`.
