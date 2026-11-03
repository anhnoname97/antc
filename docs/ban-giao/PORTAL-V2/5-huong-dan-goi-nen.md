# Portal v2: gói nền và cách làm tiếp

Ngày: 2026-11-03 · Nhánh `portal-v2`. Gói nền gồm V2-01a → V2-01f và khung V2-01m. Thiết kế chung ở `1-thiet-ke.md`; contract dữ liệu ở `4-contract-du-lieu.md`.

## Lấy về và chạy

```
git fetch origin
git switch portal-v2          (hoặc: git worktree add ../26.antc-portal-v2 portal-v2)
.\run-local.ps1 -Reset
```

uSync tự nhập toàn bộ gói nền vào CSDL mới. Đã thử ngày 2026-11-03 trên CSDL trống, không bật bộ dựng: đủ 64 data type, 17 loại nội dung, `seoBase` 5 trường, 70 nút Thư viện đã xuất bản.

## Gói nền có gì

| Phần | Ở đâu |
|---|---|
| 9 danh sách cố định `Danh mục · …` (Phụ lục B1) | Cài đặt › Kiểu dữ liệu. Mã và chữ ở `Core/PortalV2/DanhMuc/DanhMucCoDinh.cs` |
| 41 data type cơ bản: `Chữ · N`, `Đoạn · N`, `Số · …`, `Ngày`, `Bật/tắt`, `Danh sách dòng · …`, `Thẻ · …`, `Chọn ảnh`, `Chọn tệp PDF` | Cài đặt › Kiểu dữ liệu |
| 3 data type soạn thảo; `Soạn thảo · Bài đọc` có menu "Kiểu" chèn hộp `k-box`, `k-now`… | Menu ở `Web/App_Plugins/AntcEditors/umbraco-package.json`; màu hộp trong khung soạn ở `Web/wwwroot/css/rte-portal.css` |
| 6 data type `Chọn · …` cho Thư viện, 8 data type `Danh sách · …` (Collection) | Gốc trình chọn là khóa cố định của thư mục |
| Composition `taxonomyBase`, `publishMetaBase`; `seoBase` sửa lại | `seoBase`: tab đổi từ `sEO` thành `seo`, khôi phục 4 trường cũ (file uSync cũ gắn chúng vào nhóm không tồn tại nên Umbraco chưa từng nhập), thêm `canonicalUrl` |
| Thư viện: `libraryFolder`, 8 thư mục, 6 loại mục danh mục | Cây nội dung › Thư viện. Dữ liệu mẫu: 7 kênh, 5 đối tượng, 6 dấu hiệu, 3 mức độ phổ biến, 8 chuyên đề, 32 thủ đoạn |
| `Antc.InlineList` phía máy chủ: cấu hình, kiểm khi lưu, báo tham chiếu, value converter `InlineListValue` | `Core/PortalV2/Editors/`. Chưa có data type nào dùng; giao diện tạm là ô nhập JSON thô |
| Khóa GUID v5 | `Core/PortalV2/PortalV2Keys.cs`, giống `cong-cu/xuat-seed.js` |
| Chặn xóa khi còn tham chiếu | `appsettings.json`: `DisableDeleteWhenReferenced` |
| Test | `Tests/PortalV2FoundationTests.cs`: 7 test (khóa khớp seed, danh sách cố định khớp seed, schema, quy tắc InlineList) |

## Thêm loại nội dung, data type mới

Quy ước dự án: không viết tay file uSync. Gói nền dựng bằng code qua dịch vụ Umbraco, uSync tự xuất file. Các task sau làm cùng cách:

1. Thêm khai báo vào `Core/PortalV2/Schema/PortalV2Schema.cs`, hoặc tách thành file mới cùng thư mục rồi gộp vào `AllDataTypes()` và `AllContentTypes()`. Alias, tên, data type, bắt buộc lấy đúng Phụ lục A, B. Không đổi khai báo đã có.
2. Chạy web ở Development với bộ dựng bật:
   ```
   $env:PortalV2__SchemaBuilder__Enabled = "true"
   $env:PortalV2__SchemaBuilder__SeedPath = "../../../docs/ban-giao/PORTAL-V2/cong-cu/seed-portal-v2.json"
   .\run-local.ps1
   ```
   Log có dòng `PortalV2SchemaBuilder: tạo … data type, … loại nội dung, … nút Thư viện.` Bộ dựng chỉ tạo cái còn thiếu, theo khóa cố định; chạy lại không tạo trùng.
3. Commit các file `.config` mới trong `uSync/v18/`. Lần khởi động đầu với CSDL mới, uSync còn ghi lại một số file view (bỏ dòng trống cuối) và file `Media` (thêm `altText` rỗng). Đó là tác dụng phụ có sẵn của `dev`: **không commit**, `git restore` các file đó.
4. Bộ dựng mặc định tắt. Không bật ở môi trường khác Development.

Nếu chỉ sửa trong backoffice (ví dụ chỉnh mô tả một trường) thì làm như bình thường; uSync xuất file.

## Còn chưa có trong gói nền

| Việc | Task |
|---|---|
| Kiểm phía máy chủ cho danh mục: mã không trùng, khóa mã sau xuất bản, số chuyên đề 1–8, độ dài tên | V2-01h |
| Ô chọn combobox, giao diện Bảng/Thẻ của `InlineList`, ô hiển thị | V2-01i → V2-01q (luồng `V2-ui`) |
| `topicItem.readingArticle`, `topicItem.checklist`, `tacticItem.containingArticle` | V2-03a, V2-08a (cần loại bài viết, checklist) |
| Loại `quickQaItem`, `sharedSnippet` (thư mục đã có) | V2-09b, V2-05a |
| Quyền hai nhóm | V2-11a |
