# Sơ đồ project và graph mã nguồn

Ghi chú để dùng lại trên máy khác. Cập nhật lần cuối: 16/10/2026.

## Có gì trong thư mục này

| File | Việc | Cần gì để chạy |
|---|---|---|
| `SO-DO.md` | Sơ đồ Mermaid: quan hệ project .NET, document type, element type, cây nội dung mẫu, mã C# và API route | Chỉ cần xem. GitLab và VS Code (Markdown Preview) tự vẽ |
| `gen_so_do.py` | Sinh lại `SO-DO.md` từ csproj, uSync và mã C# | Python 3, không cần cài gói nào |

Chạy lại sau khi đổi cấu trúc CMS hoặc code:

```
python docs/so-do/gen_so_do.py
```

`SO-DO.md` là file tự sinh, đừng sửa tay.

Giới hạn: uSync không lưu block nào được phép trên trang nào, nên chưa có quan hệ trang → block. Phần 3 của sơ đồ chỉ nhóm element type theo tiền tố tên.

## Graph mã nguồn cho AI (code-review-graph)

Graph chỉ đọc mã C#, không đọc uSync. Phần CMS xem ở `SO-DO.md`.

Cài trên máy mới (cần Python 3.10 trở lên):

```
pip install --user code-review-graph
python -m code_review_graph install --platform claude-code --no-skills --no-hooks --no-instructions -y
python -m code_review_graph build
```

Sau đó restart Claude Code. Nếu lần đầu báo `CONNECT_TIMEOUT`, vào `/mcp` chọn `code-review-graph` rồi Reconnect.

- `install` tạo `.mcp.json` với đường dẫn riêng của máy đó. File này **không commit** (đã nằm trong `.gitignore`).
- `.code-review-graphignore` (có trong git) loại `src/ANTC.Portal.Core`, `src/ANTC.Portal.Lib`, `wwwroot`, `bin`, `obj`. Nếu thiếu, graph sẽ quét cả mã nguồn Umbraco (hơn 14.000 file) thay vì khoảng 34 file của project.
- Graph không tự cập nhật. Khi code đổi: `python -m code_review_graph update`.

## Rà soát kế hoạch (Google Sheet "Kế hoạch công việc ATTC") so với repo

Điểm lệch đã thấy ngày 16/10, chưa sửa trên sheet:

- Sheet ghi Umbraco 17, repo dùng 18.2.1. Kiến trúc ghi font Manrope, FE-01 ghi Roboto.
- `thiPage` trong sheet có 9 trường cài đặt cuộc thi. Repo đã bỏ chúng có chủ ý (tài liệu `docs/noi-dung/cay-trang-umbraco.md` từng ghi điều này, file đã bị xóa ở commit sau), nhưng `UmbracoContestSettingsProvider` vẫn đọc `contestStart`, `contestEnd`, `maxAttempts`. Chưa có nơi cấu hình thay thế nên `POST /api/v1/contest/entries` luôn trả `403 CONTEST_CLOSED`. Không có test nào bao phủ provider này.
- Repo dùng BlockGrid và 60 element type cho nội dung trang. Sheet vẫn ghi "phần lớn câu chữ giữ cứng trong Razor".
- `qaItem` đã bị xóa trong repo, sheet vẫn còn (BE-08, BE-29).
- URL: code dùng `/thu-suc/` và `/cuoc-thi/`, sheet ghi `/tham-gia/thu-suc` và `/tham-gia/cuoc-thi`. Trang Cuộc thi tháng (FE-33) chưa có trong sheet URL.
- Mục 5 của sheet ghi "60 công việc", thực tế có 63.
- Build báo lỗ hổng mức cao ở `SixLabors.ImageSharp 3.1.12` và `System.Security.Cryptography.Pkcs 10.0.0`. Cần xử lý trước khi lên server thật.

Khớp với code: tổng ngày công từng người, bảng CSDL (8 bảng), số liệu ngân hàng câu hỏi (200 câu, 8 chuyên đề, 16.458 giây) và route API đang có.
