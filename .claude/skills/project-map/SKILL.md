---
name: project-map
description: Lập bản đồ codebase antoantaichinh (Umbraco 3 tầng Core/Lib/App) và danh sách tài liệu thiết kế liên quan cho một vùng hoặc mã công việc, chỉ đọc, không sửa code. Dùng khi bắt đầu làm một trang, API, bảng dữ liệu hay module chưa quen, hoặc khi cần biết tài liệu nào áp dụng và code thực tế khác tài liệu ở đâu.
---

# project-map: bản đồ codebase và tài liệu

Mục tiêu: có đủ hiểu biết để làm bước tiếp theo, không hơn. Chỉ đọc; không sửa file nào trong repo (script tạm đặt ở scratchpad).

Quy tắc chung về tài liệu, cách đọc từng định dạng và 5 loại thông tin nằm trong `CLAUDE.md`. Không lặp lại ở đây.

## Đầu vào

Một phạm vi cụ thể: mã công việc (`FE-25`, `BE-22`, `API-03`…), một trang/URL, một bảng, một thư mục. Nếu người dùng không nêu phạm vi, hỏi lại hoặc làm bản đồ tổng quan ở mức thư mục, và nói rõ là chỉ ở mức đó.

## Các bước

1. **Code thực tế của phạm vi**
   - Entry point và luồng xử lý: route/URL → document type/template (`Views/*.cshtml`, `uSync/v18/`) hoặc controller (`Umbraco.Plugin.Custom.Api`) → service (`Umbraco.Plugin.Custom.Core`, đăng ký ở `CustomCoreComposer`) → dữ liệu (`AppDbContext`, `Entities.cs`, migration, seed; hoặc nội dung Umbraco).
   - Phụ thuộc: package (`Directory.Packages.props`), dịch vụ dùng chung (`IQuestionBank`…), file tĩnh trong `wwwroot/assets`.
   - Cách build và kiểm chứng phạm vi này (xem bảng lệnh trong `CLAUDE.md`).
   - Chỉ mở `src/ANTC.Portal.Core` khi phạm vi thật sự chạm tới core.
2. **Tài liệu liên quan**
   - Tra mã công việc trong sheet "Công việc" (mô tả, tiêu chí nghiệm thu, phụ thuộc) và trong `.docx` (heading cùng mã).
   - Tra theo loại việc: API → sheet "API" và mục 6 của `.docx`; bảng → sheet "CSDL"; document type/URL → sheet "Nội dung Umbraco", "URL"; giao diện → `docs/ke-hoach/anh/README.md` (ảnh theo mã công việc) và bản dựng HTML (Grep).
   - Luôn xem sheet "Khác biệt bản dựng" và "Câu hỏi mở" xem có dòng nào chạm tới phạm vi không.
   - Grep `docs/quyet-dinh.md` theo phạm vi; liệt kê các `QĐ-xxx` còn hiệu lực.
   - Tìm thêm tài liệu ngoài `docs/` nếu có dấu hiệu (xem `CLAUDE.md`).
3. **Đối chiếu**: so tài liệu với code, ghi chỗ khác nhau kèm bằng chứng hai phía.

## Đầu ra

Ngắn gọn, theo mẫu:

```
## Phạm vi đã kiểm tra
<những gì đã xem; những gì CHƯA xem>

## Code thực tế
- Luồng: <A → B → C> (file:dòng)
- Thành phần chính: <file — vai trò>
- Build/kiểm chứng: <lệnh>

## Tài liệu áp dụng
| Tài liệu (đường dẫn › mục) | Nói gì về phạm vi này | Đã đọc đủ? |

## Quyết định đã chốt liên quan
<QĐ-xxx — tóm tắt, hoặc "không có">

## Khác biệt tài liệu ↔ code
| Điểm | Tài liệu | Code | Ghi chú |

## Chưa rõ / giới hạn
<câu hỏi mở liên quan, phần không đọc được, giả định>
```

Không kết luận về toàn dự án khi mới xem một phần. Không đề xuất thiết kế ở đây; việc đó thuộc `/feature-design`.
