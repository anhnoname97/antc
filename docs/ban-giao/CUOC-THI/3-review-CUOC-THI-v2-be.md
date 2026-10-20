
## Review B5 (2026-10-18)

### Phạm vi đã review
Commit `6d726116` (khoảng `f89eb861..HEAD` ở worktree `CUOC-THI-v2-be`): `Entities.cs`, `AppDbContext.cs`, migration `20261018081328_AddEntryContestAndContestSettings` + snapshot. Chuẩn so sánh: `1-thiet-ke.md` (R4 dòng 559, task B5 dòng 656), QĐ-024 (CXN-B), báo cáo B5 của Worker. Không build, không chạy web; phần chạy thử dựa vào báo cáo (build 0 lỗi, `dotnet test` 52 đạt, migration áp trên CSDL cũ và mới, `PRAGMA` xác nhận cột, chỉ mục, FK). Không tự kiểm lại các số liệu đó.

### Phát hiện
Không có lỗi từ mức Thấp trở lên.

- `entry.contest_id` rỗng được, FK `Restrict`, chỉ mục `(contest_id, phone)`: đúng QĐ-024 (B) và task B5.
- `contest.submit_grace_hours` int mặc định 24, `read_timer_factor` mặc định 1, `focus_area` tối đa 50 rỗng được: đúng R4. Migration đã chỉnh tay mặc định cột cũ (24 và 1m) nên cuộc đang có không bị hạn nộp 0 hay hệ số 0; báo cáo có bằng chứng chạy trên CSDL cũ.
- Snapshot khớp model (3 cột, `ContestId`, chỉ mục, quan hệ); `Down` đảo ngược đủ.
- Không có code dùng cột mới, không làm ngoài phạm vi (B7, B11 để sau). Không có bí mật trong diff. Comment C# tiếng Việt không dấu đúng quy ước.

### Sai khác tài liệu ↔ code
- R4 ghi khoảng giá trị `submit_grace_hours` 0–168 và `read_timer_factor` 0–5; B5 chưa ràng buộc (đúng phạm vi: ràng buộc nhập thuộc B11).

### Cần xác minh
- `ReadTimerFactor` kiểu decimal lưu TEXT trong SQLite: sắp xếp/so sánh trong truy vấn SQL sẽ theo chuỗi. Hiện không có truy vấn nào dùng; B8/B11 chỉ nên đọc giá trị, không lọc theo cột này.

### Đề xuất (không bắt buộc)
- B11 nhớ kiểm khoảng 0–168 và 0–5 khi lưu từ backoffice.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
B5 đạt, có thể chuyển sang B6 (và B11, B13 theo phụ thuộc). Rủi ro còn lại thấp: phiên review không tự chạy lại migration.
