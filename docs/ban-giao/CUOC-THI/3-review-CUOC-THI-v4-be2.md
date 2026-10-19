# Review luồng CUOC-THI-v4-be2

## Review B9 (2026-10-18)

### Phạm vi đã review
- Commit `4dd2d31b` (khoảng `17d17f92..HEAD`): `QuizController.cs`, `ContestCatalog.cs`, `QuizControllerTests.cs`, 5 view.
- Chuẩn so sánh: `1-thiet-ke.md` R5 (QUIZ-01/02), task B9, QĐ-016, QĐ-024. Chạy thử dựa vào `agent-artifacts\CUOC-THI-v4-be2\b9-verify.txt`. Không build, không chạy web.

### Phát hiện

#### [Thấp] Commit B9 kèm thay đổi BOM/xuống dòng của 5 view do uSync ghi lại
- Vị trí: `Views/home.cshtml`, `thamGiaPage.cshtml`, `thiPage.cshtml`, `thiThuPage.cshtml`, `ungPhoPage.cshtml`.
- Bằng chứng: `git show 4dd2d31b -- '*thiPage.cshtml'` thêm BOM ở dòng 1 và bỏ LF cuối file; không đổi nội dung. Giống lỗi Thấp 2 của review B7 (đã hoàn lại ở `f2526a10`).
- Hướng khắc phục: hoàn lại 5 file về bản trước B9 (`git checkout 17d17f92 -- <5 file>`) trong commit sửa; tránh `git add -A` khi web chạy ở Development (uSync xuất lại view).

### Đối chiếu yêu cầu B9
- R5 QUIZ-01: chỉ chuyên đề của đề, `count` = số câu của đề, theo thứ tự đề: đạt (`QuizController.cs` Topics; bằng chứng 9 = 9 dòng `contest_question`).
- R5 QUIZ-02: chỉ câu của đề, theo thứ tự đề, vẫn trả `ans`/`exp`: đạt; chuyên đề ngoài đề → `404 UNKNOWN_TOPIC` hợp lý.
- Không tham số thì như cũ: đạt (ETag `"quiz-v{ver}"` giữ nguyên; `sample` và luyện tập 200).
- ETag đổi khi sửa cuộc (`UpdatedAt.Ticks`): đạt, có bằng chứng. `upcoming` → 403 `CONTEST_CLOSED`; không có/tắt → 404 `CONTEST_NOT_FOUND`: đạt, dạng lỗi theo QĐ-004.
- Test: 73 đạt theo báo cáo, có 6 ca mới.

### Sai khác tài liệu ↔ code
Không có. Contract R5 không nói rõ `contest=abc` (400 mặc định ASP.NET) và `ended` (đọc được): giả định của Worker hợp lý, không đổi contract.

### Cần xác minh (không chặn)
- `Cache-Control: public, max-age=300` cho nhánh `contest`: cuộc chuyển `upcoming` → `ongoing` hoặc sửa đề có thể bị trình duyệt/CDN giữ bản cũ tối đa 5 phút; chấp nhận được, FE nên biết.

### Worker phải sửa
- Hoàn lại 5 view nêu ở lỗi Thấp trên (có thể gộp vào task kế tiếp cùng luồng). Không chặn nghiệm thu B9.

### Cần người dùng xác nhận
Không có.

### Kết luận
B9 đạt về nghiệp vụ, contract và bằng chứng chạy thử; chỉ còn lỗi Thấp về nhiễu thay đổi view. Không có lỗi từ mức Trung bình trở lên.


## Review B10 (2026-10-18) · API-07 `GET /api/v1/contests`

### Phạm vi đã review
- Commit `e945576e` (B10) và `1817b5ab` (hoàn lại BOM/xuống dòng 5 view, sửa lỗi Thấp của review B9) trong `4dd2d31b..HEAD` của worktree `CUOC-THI-v4-be2`. Đối chiếu `1-thiet-ke.md` › R5 › API-07, dòng B10, QĐ-024 (contract R5 chính thức), báo cáo Worker và `agent-artifacts\CUOC-THI-v4-be2\b10-api07.txt`.
- Không build, không chạy web (theo yêu cầu). Kết quả `dotnet test` 75 đạt là theo báo cáo Worker, tôi không chạy lại.

### Phát hiện
Không có lỗi từ mức Thấp trở lên.

Đối chiếu từng tiêu chí:
- Đường dẫn, phương thức, dạng JSON (`serverTime`, `ongoing/upcoming/ended`, các trường từng cuộc, `topics{cd,title,count}`, `focusArea`) khớp R5 (`ContestScheduleModels.cs`, `ContestsController.cs`).
- Chỉ cuộc `is_active`; `ongoing` sắp `startAt` giảm dần, `upcoming` tăng dần, `ended` sắp `endAt` giảm dần và tối đa 12: đúng ở `ContestCatalog.cs:68-88`. Controller chỉ ánh xạ, dùng chung `IContestCatalog` với phía Razor.
- Thời điểm ISO UTC có `Z` (`Iso()` dùng `SpecifyKind`); `focusArea` null khi trống; không có số viết cứng; `Cache-Control: public, max-age=60`.
- Chạy thử (`b10-api07.txt`): `ongoing` = [5, 1] đúng thứ tự, `upcoming` = [2], `ended` = [4], cuộc tắt không xuất hiện; tắt hết thì ba mảng rỗng, 200. Đúng các ca 0, 1, nhiều cuộc `ongoing` mà thiết kế yêu cầu.
- Lỗi Thấp của review B9 (nhiễu BOM/xuống dòng ở 5 view) đã hoàn lại bằng commit riêng, chỉ 5 file đó.
- Test đơn vị (2 ca): mảng rỗng + header, ánh xạ trường. Thay đổi nằm đúng tầng Api, không đụng schema hay uSync.

### Sai khác tài liệu ↔ code
Không có.

### Cần xác minh
- Cuộc tạo bằng SQL thay vì backoffice (thiết kế ghi "tạo trong backoffice"). Kết quả API chỉ đọc DB nên chấp nhận được; việc tạo cuộc qua backoffice sẽ được kiểm ở B11/I2.
- `focusArea` có giá trị chỉ được kiểm qua HTTP ở cuộc 5 (`vieclam`, có trong output) và qua test đơn vị; ca null có cuộc 1. Cả hai đã có bằng chứng.

### Đề xuất (không bắt buộc)
- Không có.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
B10 đạt: đúng contract R5, đúng thứ tự và lọc, có bằng chứng chạy thử. S1 có thể mở sau khi merge `lane/CUOC-THI-v4-be2` vào `dev`.

## Review B11 (2026-10-18)

### Phạm vi đã review
- Commit `4c85e356` (khoảng `e945576e..HEAD` của `lane/CUOC-THI-v4-be2`): `ContestAdminController.cs`, `ContestAdminModels.cs`, `ContestAdminService.cs`, `ContestCampaignAdminServiceTests.cs`, `contest-management.js`.
- Chuẩn so sánh: `1-thiet-ke.md` dòng B11 (tiêu chí: form có gia hạn, hệ số, lĩnh vực; xóa/đổi bộ đề cuộc đã có lượt → `409 CONTEST_HAS_ENTRIES`), QĐ-024 (B), QĐ-004 (dạng lỗi), báo cáo B11 của Worker.
- Không review được: chạy HTTP/backoffice (Worker cũng chưa chạy, cần token backoffice); không build, không chạy lại test, chỉ dựa vào báo cáo "85 đạt, 0 lỗi".

### Phát hiện
Không có lỗi từ mức Trung bình trở lên. Đối chiếu tiêu chí:
- Form có gia hạn / hệ số đọc / lĩnh vực: đạt (`contest-management.js` form + payload; service lưu ở `ApplyCampaign`; DTO trả lại).
- Kiểm tra đầu vào có `fields`: `submitGraceHours` 0–168, `readTimerFactor` 0–5, `focusArea` regex, dạng `400 VALIDATION`: đạt.
- Đổi bộ đề khi có lượt → 409: đạt (`UpdateCampaignAsync` nạp `Topics`/`Questions`, `DeckChanged` so theo tập chuyên đề và tập câu hỏi, đếm `Entries.ContestId`). Xóa khi có lượt → 409: đạt. Controller bắt `ContestHasEntriesException` ở PUT và DELETE, trả `Conflict` với dạng `{error:{code,message,fields}}`: đạt (QĐ-004, QĐ-024 B).
- Cuộc chưa có lượt vẫn đổi/xóa được; đổi cấu hình khác (tên, thời gian, lượt, gia hạn…) khi đã có lượt vẫn được: hợp lý.
- Không đụng schema/migration (cột đã có từ B5). Test 10 ca bao phủ các nhánh chính.

### [Thấp] `colspan` của dòng rỗng chưa theo số cột mới
- Vị trí: `contest-management.js` (dòng `tbody ... colspan="8"`).
- Bằng chứng: tab "Danh sách cuộc thi" nay có 9 cột (thêm "Lượt dự thi"), colspan vẫn 8.
- Tình huống: không có cuộc nào → ô thông báo trống không phủ hết hàng, chỉ lệch hiển thị nhẹ.
- Hướng khắc phục: đặt colspan theo tab (campaigns = 9). Không bắt buộc.

### [Thấp] Request cũ thiếu trường mới bị đặt lại về mặc định
- Vị trí: `SaveContestCampaignRequest` (`SubmitGraceHours = 24`, `ReadTimerFactor = 1`, `FocusArea = null`).
- Tình huống: client PUT không gửi 3 trường (ví dụ script cũ) → ghi đè giá trị đã cấu hình. UI mới luôn gửi đủ nên không ảnh hưởng. Chấp nhận được; ghi để biết.

### Sai khác tài liệu ↔ code
- Không có. "Đổi bộ đề" = đổi tập chuyên đề/câu hỏi, đổi thứ tự thì không chặn: Worker nêu rõ là giả định; hợp lý với thiết kế (CXN-B nói về tập đề). Nếu muốn chặn cả đổi thứ tự (QĐ-025 thứ tự chuyên đề) thì cần quyết định riêng; hiện không chặn vì không thay đổi nội dung đề đã làm, và thứ tự chưa được quy định là khóa.

### Cần xác minh
- 409 ở controller và form trên backoffice chưa chạy thật (chỉ kiểm bằng build). Kiểm khi gộp ở I2: PUT đổi đề / DELETE cuộc có lượt → 409 `CONTEST_HAS_ENTRIES`; form hiển thị ghi chú và 3 trường mới; thông báo lỗi 409 hiện ra UI.
- Khóa lĩnh vực chỉ kiểm định dạng, chưa đối chiếu danh sách khóa trang Thủ đoạn (Worker đã ghi nhận; thiết kế không yêu cầu).
- Race nhỏ giữa đếm lượt và lưu (một lượt tạo ngay lúc admin đổi đề): bỏ qua ở quy mô này.

### Đề xuất (không bắt buộc)
- Thêm test controller (hoặc một lần gọi HTTP ở I2) cho ánh xạ 409.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
B11 đạt: đúng tiêu chí nghiệm thu và QĐ-024 (B), không phát hiện lỗi từ mức Trung bình. Có thể merge `lane/CUOC-THI-v4-be2` sau khi review các task còn lại của luồng; kiểm 409/giao diện thật ở I2.


## Review B13 (2026-10-18) · Cuộc thi mẫu khi chạy local

### Phạm vi đã review
- Commit `df33a0d3` (khoảng `4c85e356..HEAD`, một file: `Umbraco.Plugin.Custom.Core/Data/AppDbInitializer.cs`, +46/-1). Chuẩn so sánh: `1-thiet-ke.md` dòng B13, CXN-G, QĐ-024 (G), QĐ-025, báo cáo Worker mục B13.
- Bằng chứng chạy thử đọc từ `agent-artifacts\CUOC-THI-v4-be2\`: `b13-contests-dev.json`, `b13-contests-prod.json`. Không build, không chạy web (theo yêu cầu). Không xem ảnh.

### Phát hiện
Không có lỗi từ mức Thấp trở lên.

Đối chiếu tiêu chí:
- Chỉ `Development` (`_environment.IsDevelopment()`) và chỉ khi bảng `contest` trống (`!AnyAsync`): đạt (`AppDbInitializer.cs` đoạn thêm sau `SeedQuizAsync`). Bằng chứng Production: `b13-contests-prod.json` có `ongoing/upcoming/ended` đều rỗng.
- Một cuộc gồm mọi câu đang dùng (`IsActive`) và mọi chuyên đề có câu đó: đạt. Dev: 1 cuộc, `questionCount` 200, 8 chuyên đề.
- 2026-10-01 → 2026-12-31 giờ VN, lưu UTC: `startAt 2026-09-30T17:00:00Z`, `endAt 2026-12-31T16:59:59Z`: đạt (offset +7 cố định, hợp lý vì VN không có DST).
- Thứ tự chuyên đề theo `TopicId`, câu theo chuyên đề rồi `SortOrder`: phù hợp QĐ-025 (thứ tự lấy từ `contest_topic.SortOrder`).
- Không đổi schema, không migration; không đụng file ngoài phạm vi; không có bí mật trong diff. Comment C# không dấu, tên/mô tả cuộc có dấu: đúng quy ước.

### Sai khác tài liệu ↔ code
- Không có. Dòng `thiPage` (ngày mẫu QĐ-008) trong uSync còn nguyên; Worker đã nêu và QĐ-024 nói QĐ-008 được thay khi B13 xong. Việc dọn ngày ở `thiPage` không thuộc B13 (nên xét ở I2).

### Cần xác minh
- Chưa chạy lần hai trên CSDL đã có cuộc (chỉ dựa `AnyAsync`; logic đủ rõ nên rủi ro thấp). Nên ghi nhận ở I2 khi chạy `run-local` không `-Reset`.

### Đề xuất (không bắt buộc)
- Nếu sau này cuộc mẫu hết hạn (sau 2026-12-31) thì môi trường local mới sẽ không còn cuộc "đang diễn ra"; cân nhắc tính ngày theo thời điểm nạp. Hiện đúng theo thiết kế nên không bắt buộc.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
B13 đạt, có thể merge. Rủi ro còn lại: nhỏ, chỉ ở kịch bản chạy lại không `-Reset` (kiểm ở I2).
