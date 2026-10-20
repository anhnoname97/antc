---
name: implement-task
description: Triển khai đúng một task đã thống nhất trong repo antoantaichinh (Umbraco 18 / .NET 10 / SQLite), theo tài liệu thiết kế, quyết định đã xác nhận và quy ước dự án, rồi tự kiểm chứng và báo cáo. Dùng khi người dùng yêu cầu làm, code hoặc triển khai một task, một mã công việc hay một mục trong kế hoạch từ /feature-design.
---

# implement-task: triển khai một task

Mỗi lần chỉ làm một task. Quy tắc chung (tài liệu nháp, khi nào phải hỏi, nguyên tắc làm việc, lệnh build) nằm trong `CLAUDE.md`.

## Trước khi sửa

1. Đọc lại: mô tả task, các quyết định đã xác nhận (trong hội thoại và các `QĐ-xxx` còn hiệu lực trong `docs/quyet-dinh.md`), phần tài liệu liên quan (chỉ phần cần), và code sẽ chạm tới.
2. Viết ra ngắn gọn: phạm vi chính xác, acceptance criteria, file dự kiến sửa, cách kiểm chứng.
3. Chạy `git status` để biết thay đổi có sẵn của người dùng; không ghi đè hay hoàn tác chúng.
4. Nếu còn mâu thuẫn quan trọng chưa giải quyết (xem `CLAUDE.md`), không làm phần bị ảnh hưởng: làm phần độc lập nếu có, rồi dừng và hỏi. Khi người dùng trả lời và chốt, ghi vào `docs/quyet-dinh.md` trước khi làm tiếp.

## Khi sửa

- Đúng chỗ theo kiến trúc: nghiệp vụ và dữ liệu ở `Umbraco.Plugin.Custom.Core` (đăng ký dịch vụ ở `CustomCoreComposer`), API ở `Umbraco.Plugin.Custom.Api` dưới `/api/v1`, giao diện ở `Umbraco.Web.UI/Views` và `wwwroot/assets`.
- Đổi bảng: sửa `Entities.cs`/`AppDbContext`, rồi tạo migration bằng lệnh trong `CLAUDE.md`. Không sửa tay migration đã có.
- Đổi document type: làm trong backoffice để uSync xuất file; không viết tay file `.config` trong `uSync/v18` trừ khi người dùng đồng ý.
- Đổi dữ liệu câu hỏi: gọi `IQuestionBank.Reload()`; giữ nguyên tên trường JSON ngắn.
- Không sửa `src/ANTC.Portal.Core` trừ khi task yêu cầu; nếu có sửa thì phải chạy `core_build.ps1`.
- Giao diện: biến trong `tokens.css`, cỡ chữ `rem`, không có `style="..."`, chữ hiển thị có dấu, comment C# không dấu.
- Không mở rộng phạm vi. Thấy việc khác đáng làm thì ghi vào báo cáo.

## Kiểm chứng

Repo chưa có project test. Chạy những gì làm được và ghi đúng kết quả:

- Build: `dotnet build src/ANTC.Portal.App/ANTC.Portal.App.slnx` (hoặc `.\run-local.ps1 -NoRun`).
- Chạy thử: `.\run-local.ps1` ở chế độ chạy nền, đợi `uSync: Startup Complete`, gọi API/trang liên quan (kể cả trường hợp lỗi), rồi dừng tiến trình. Đổi schema thì xác nhận migration được áp dụng khi khởi động.
- Giao diện: nếu có công cụ trình duyệt, xem trang ở 1440/1024/390px và so với ảnh trong `docs/ke-hoach/anh`.
- Test tự động: nếu task cần test mà repo chưa có project test, đề xuất thêm và hỏi trước, không tự tạo.
- Không tuyên bố đạt nếu chưa chạy. Bước nào không chạy được thì nói rõ lý do.

Cuối cùng xem `git diff`: không có thay đổi ngoài ý muốn, không lộ thông tin bí mật (không commit `appsettings.Local.json`), không có file rác.

## Báo cáo

```
## Đã làm               (task, acceptance criteria: đạt / chưa đạt / chưa kiểm chứng được)
## File thay đổi
## Kiểm chứng           (lệnh đã chạy + kết quả thật)
## Giả định
## Sai khác so với thiết kế   (tài liệu › mục, lý do, QĐ-xxx nếu đã được xác nhận)
## Còn tồn tại / rủi ro
```

Không commit, push hay deploy nếu người dùng chưa yêu cầu.
