# antoantaichinh.vn (ANTC Portal)

Website tuyên truyền an toàn tài chính. Umbraco 18.2.1, .NET 10, SQLite. Chạy local: `./run-local.sh` hoặc `.\run-local.ps1` (chi tiết ở README.md).

## Cấu trúc
- `src/ANTC.Portal.Core`: mã nguồn Umbraco CMS nội bộ. Không sửa trừ khi cần, và không đưa vào phân tích code.
- `src/ANTC.Portal.Lib`: feed NuGet nội bộ (`Build.Core`).
- `src/ANTC.Portal.App`: ứng dụng của project.
  - `Umbraco.Web.UI`: host, Views, uSync (`uSync/v18`).
  - `Umbraco.Plugin.Custom.Core`: logic nghiệp vụ, CSDL ứng dụng (EF Core, `App_Data/app.sqlite.db`), cuộc thi, ngân hàng câu hỏi.
  - `Umbraco.Plugin.Custom.Api`: controller `/api/v1/contest`, `/api/v1/quiz`, `/api/v1/system`.
  - `Umbraco.Plugin.Custom.Tests`: xUnit.
- `docs/`: bản dựng giao diện (`ban-dung`), kế hoạch (`ke-hoach`), hợp đồng API Hỏi – Đáp (`api`, OpenAPI JSON), sơ đồ (`so-do`).

## Sơ đồ và graph code
- `docs/so-do/SO-DO.md` là sơ đồ Mermaid tự sinh (project .NET, document type, element type, cây nội dung, mã C#, API). Sinh lại bằng `python docs/so-do/gen_so_do.py` sau khi đổi cấu trúc CMS hoặc code. Đừng sửa tay.
- Graph mã nguồn cho AI dùng `code-review-graph`. Cách cài và dựng ở `docs/so-do/README.md`. `.mcp.json` chứa đường dẫn riêng của từng máy nên không commit. `.code-review-graphignore` loại Core và Lib khỏi graph.
- Graph chỉ đọc mã C#, không đọc uSync. Phần CMS xem ở `SO-DO.md`.

## Quy ước làm việc
- Cấu trúc CMS (document type, template, data type, nội dung mẫu) đồng bộ qua uSync. Ở môi trường Development uSync tự import khi khởi động và tự export khi Save. Sau khi `git pull`, restart app để nhận thay đổi. Sửa trong backoffice xong thì commit các file `.config` thay đổi.
- File uSync có gốc `<Empty ... Change="Delete">` ghi nhận việc xóa. Không xóa các file này.
- File `.db` và `wwwroot/media/` không commit. Mỗi máy có CSDL riêng; dựng lại bằng `run-local --reset`.
- Không đưa mật khẩu, salt hay khóa thật vào git. `Contest:IpHashSalt` ở Development chỉ là giá trị cục bộ, Production phải cấu hình riêng.
- Kế hoạch công việc nằm ở Google Sheet "Kế hoạch công việc ATTC", đó là bản chuẩn. Bản xlsx trong `docs/ke-hoach/` có thể đã cũ.

## Lưu ý đã biết
- `thiPage` không còn thuộc tính cấu hình cuộc thi, nhưng `UmbracoContestSettingsProvider` vẫn đọc `contestStart`, `contestEnd`, `maxAttempts` từ đó. Cho đến khi provider chuyển sang nguồn mới (CSDL đã có thực thể `ContestCampaign` và API quản trị `/api/v1/admin/contest/campaigns`), `POST /api/v1/contest/entries` trả `403 CONTEST_CLOSED`. Kiểm tra lại nếu provider đã được sửa.
- Build đang cảnh báo lỗ hổng mức cao ở `SixLabors.ImageSharp` và `System.Security.Cryptography.Pkcs`.
