---
name: quality-check
description: Review độc lập, chỉ đọc, một thay đổi trong repo antoantaichinh (diff đang làm, branch hoặc danh sách file) so với yêu cầu, acceptance criteria, tài liệu thiết kế trong docs/ke-hoach và các quyết định đã xác nhận. Không tự sửa code. Dùng khi người dùng muốn kiểm tra, review, nghiệm thu hoặc rà soát chất lượng một task hay tính năng.
---

# quality-check: review độc lập

Chỉ đọc và chạy lệnh kiểm tra; không sửa file trong repo. Quy tắc về tài liệu nháp và 5 loại thông tin nằm trong `CLAUDE.md`.

## Xác định đối tượng review

- Mặc định: `git status` + `git diff` (cả staged và chưa staged) so với `main`. Nếu người dùng chỉ định branch, commit hay file thì dùng đúng phạm vi đó.
- Thu thập chuẩn so sánh: yêu cầu, acceptance criteria (sheet "Công việc" / `.docx`), phần tài liệu liên quan, quyết định đã xác nhận (trong hội thoại và các `QĐ-xxx` còn hiệu lực trong `docs/quyet-dinh.md`). Khi tài liệu và nhật ký quyết định khác nhau, theo nhật ký. Nếu thiếu chuẩn so sánh thì ghi rõ, và chỉ review các lỗi có thể xác định độc lập.

## Kiểm tra

1. **Đúng yêu cầu**: từng acceptance criterion đạt, thiếu hay sai; có làm ngoài phạm vi không.
2. **Đúng thiết kế**: API (đường dẫn, phương thức, dữ liệu gửi/nhận, mã lỗi, dạng lỗi `{ error: { code, message, fields } }` theo sheet "API"), schema (sheet "CSDL"), document type/URL, giao diện so với ảnh chụp và bản dựng.
3. **Logic và trường hợp biên**: null/rỗng, giới hạn, lỗi đầu vào, đồng thời, múi giờ (tài liệu quy định lưu UTC), tải lại dữ liệu (`IQuestionBank.Reload()`), cache/ETag.
4. **Bảo mật**: xác thực (`X-Entry-Token` cho API `/me` theo tài liệu), kiểm tra đầu vào, lộ dữ liệu cá nhân hoặc đáp án, XSS trong Razor (`Html.Raw`), SQL thô, thông tin bí mật trong diff.
5. **Tương thích và vận hành**: migration (có tạo đúng cách không, có làm mất dữ liệu không), file uSync có được commit đủ không, tên trường JSON ngắn còn giữ nguyên không, cấu hình riêng môi trường.
6. **Quy ước dự án**: vị trí code theo 3 tầng, đăng ký DI ở composer, `tokens.css`/`rem`/không `style=`, ngôn ngữ comment và chữ hiển thị.
7. **Kiểm chứng**: build được không; thay đổi có cách kiểm chứng hợp lý không (repo chưa có project test). Chạy build hoặc chạy thử nếu cần để xác nhận một phát hiện, và ghi lại lệnh.

## Mức nghiêm trọng

- **Nghiêm trọng**: sai dữ liệu, lỗ hổng bảo mật, hỏng build/khởi động, phá contract đã xác nhận.
- **Cao**: thiếu acceptance criterion, sai hành vi chính, lỗi ở trường hợp biên thường gặp.
- **Trung bình**: lỗi ở trường hợp ít gặp, sai lệch thiết kế chưa rõ có chủ đích, khó bảo trì rõ rệt.
- **Thấp**: quy ước, câu chữ, dọn dẹp nhỏ.
- **Đề xuất**: cải tiến ngoài yêu cầu. Tách riêng, không tính là lỗi.

Chỉ báo lỗi khi có bằng chứng. Nghi ngờ mà chưa xác minh được thì đưa vào mục "Cần xác minh", không trộn vào danh sách lỗi. Đề xuất chưa được duyệt (kể cả phương án "Đang giả định" trong sheet "Câu hỏi mở") không được coi là yêu cầu bắt buộc.

## Đầu ra

```
## Phạm vi đã review       (đối tượng, chuẩn so sánh; phần KHÔNG review được)
## Phát hiện
### [Mức] Tiêu đề ngắn
- Vị trí: file:dòng
- Bằng chứng: <code / tài liệu › mục / QĐ-xxx>
- Tình huống xảy ra: <đầu vào/trạng thái → kết quả sai>
- Hướng khắc phục: <ngắn gọn>
## Sai khác tài liệu ↔ code   (lỗi thật hay khác biệt cần chốt)
## Cần xác minh
## Đề xuất (không bắt buộc)
## Kết luận                (cần sửa trước khi merge; rủi ro còn lại)
```

Không có phát hiện thì nói rõ là không có, kèm phạm vi đã kiểm tra.
