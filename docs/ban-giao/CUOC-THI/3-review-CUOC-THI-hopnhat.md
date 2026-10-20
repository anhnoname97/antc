# Review luồng CUOC-THI-hopnhat

## Review M1a · 2026-10-18 (Orchestrator; chỉ đọc git và báo cáo, không build/chạy)

Phạm vi: merge commit `e5451987` trên `lane/CUOC-THI-hopnhat`. Đối chiếu `1-thiet-ke.md` (M1a), QĐ-009, QĐ-017, QĐ-022.

**Kết luận: ĐẠT, có điều kiện (3 việc nhỏ ở cuối). Chưa đưa vào `dev`.**

Đã tự kiểm bằng git:
- `AntcPublicPaths.cs` và test giống hệt `origin/main` (`git diff origin/main HEAD` rỗng): test đỏ `Manual_faq_documents_do_not_have_a_public_route` có sẵn ở main, không do merge. Chưa chạy test trên `origin/main` để chứng minh.
- `CustomCoreComposer.cs`: một đăng ký `IContestEntryService`, không còn `ValidateOnStart` (QĐ-009), còn `ContestSecurityOptions` cho `QuestionSubmissionService`. Không còn tham chiếu `IContestSettingsProvider`/`UmbracoContestSettingsProvider` trong `.cs`.
- Hai file bị xóa so với `dev` (`hoiDapPage.cshtml`, uSync `giới-thiệu.config`): xóa ở `origin/main`, `dev` không sửa, hợp lệ.
- Bản dựng đổi tên R100 (nội dung giống nhau); không có `.db` bị track.
- `CLAUDE.md`: chỉ thêm 16 dòng so với `dev`, không đổi gì của `dev`.

Nhận xét:
- Sai khác của Worker (thêm `ApiErrorModels.cs`, giữ `ContestSecurityOptions`, xóa dòng provider) hợp lý, ghi rõ.
- Ca test "ẩn danh gửi thông tin cá nhân" đổi hành vi (bỏ qua thay vì 400): do API-01 của `dev`; chưa quyết contract (xem "Cần xác nhận").
- Chưa kiểm: 390px, CSDL cũ không `-Reset`, tạo cuộc thi qua form backoffice (mới qua API).

### Worker phải sửa (nhỏ, trước khi đưa vào `dev`)
1. `CLAUDE.md`, mục "Lưu ý đã biết", gạch đầu: sai sau merge (provider đã xóa). Sửa thành `ContestSettingsService` đọc `thiPage`; API-01 trả 403 tới khi làm B5+.
2. `CLAUDE.md`, gạch "Google Sheet là bản chuẩn" mâu thuẫn với mục Tài liệu thiết kế: đưa vào "Cần xác nhận", không tự sửa.
3. Đổi tên bản dựng làm hỏng lệnh trong `anh-v2/README.md`, `cong-cu/README_dau.md`, `CLAUDE.md:34`: sửa tham chiếu tên (không phải tài liệu thiết kế gốc).

### Cần anhnn xác nhận
- A. Test đỏ `AntcPublicPathsTests`: nhóm sửa code hay sửa test? (ngoài phạm vi M1a)
- B. Nguồn kế hoạch chuẩn: Google Sheet hay xlsx?
- C. Thi ẩn danh gửi kèm thông tin cá nhân: bỏ qua (dev) hay từ chối 400 (main)?
- D. Cho phép đưa `lane/CUOC-THI-hopnhat` vào `dev` (merge `--no-ff`).
