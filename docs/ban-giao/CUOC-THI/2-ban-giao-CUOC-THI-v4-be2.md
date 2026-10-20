
## B9 · QUIZ-01/02 lọc theo cuộc thi (2026-10-18)

**Đã làm** (nhánh `lane/CUOC-THI-v4-be2`):
- `QuizController.cs`: `Topics` và `Questions` nhận `?contest=<id>`, dùng `IContestCatalog` + `TimeProvider`. Không tham số: hành vi và ETag `"quiz-v{ver}"` như cũ (luyện tập, `sample` không đổi).
- Có `contest`: chuyên đề và câu theo đề của cuộc (thứ tự đề), `count` = số câu của đề; vẫn trả `ans`, `exp` (QĐ-016). Cuộc không có / `is_active=false` / id ≤ 0 → `404 CONTEST_NOT_FOUND`; `upcoming` → `403 CONTEST_CLOSED`; chuyên đề ngoài đề → `404 UNKNOWN_TOPIC`. Cuộc `ongoing` và `ended` đều đọc được. ETag `"quiz-v{ver}-c{id}-{updated_at ticks}"`.
- `ContestCatalog.cs`: `ContestInfo` thêm `UpdatedAt` (cuối danh sách tham số) cho ETag.
- `QuizControllerTests.cs`: cập nhật theo action async và thêm 6 ca (lọc đề, ETag đổi khi sửa cuộc, thứ tự đề, chuyên đề ngoài đề, upcoming 403, cuộc không có 404).

**Đã chạy**
- `dotnet test Umbraco.Plugin.Custom.Tests`: 73 đạt, 0 lỗi.
- `.\run-local.ps1 -NoRun`, rồi `dotnet run --no-build --urls http://localhost:11003`. Do `contest` trống ở CSDL của luồng, chèn 4 cuộc bằng python `sqlite3` (không có CLI `sqlite3`): #1 đang diễn ra, #2 sắp tới, #3 tắt, #4 đã kết thúc; mỗi cuộc 2 chuyên đề (CĐ2 4 câu, CĐ1 5 câu).
- `curl` (kết quả ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v4-be2\b9-verify.txt`, log web `b9-web.log`): `topics` không tham số 200, 8 chuyên đề, 200 câu như cũ; `topics?contest=1` → `[(2,4),(1,5)]`, tổng 9 = 9 dòng `contest_question` của cuộc 1; `topics/2/questions?contest=1` → 4 câu đúng thứ tự đề, có `ans`; `topics/5/questions?contest=1` → 404 UNKNOWN_TOPIC; `contest=2` → 403 CONTEST_CLOSED; `contest=3`, `contest=99` → 404 CONTEST_NOT_FOUND; `contest=4` → 200; If-None-Match đúng ETag → 304; sau khi đổi `updated_at` của cuộc 1, ETag đổi (`…-c1-639279108300000000` → `…-c1-639279108990000000`); `topics/2/questions` và `sample` không tham số 200.
- Đã dừng web bằng PID 87568 (qua cổng 11003).

**Chưa kiểm / giả định**
- Không kiểm trên trình duyệt (task chỉ có API). Số cuộc trong CSDL luồng là dữ liệu thử, không commit.
- Giả định: `contest` ngoài định dạng số (vd `abc`) bị model binding trả 400 mặc định của ASP.NET, không theo dạng lỗi QĐ-004; contract R5 không nói rõ trường hợp này.
- `Cache-Control: public, max-age=300` giữ cho cả nhánh có `contest`, nên sau khi sửa cuộc, trình duyệt/CDN có thể giữ bản cũ tối đa 5 phút (ETag đổi đúng).
- Sai khác thiết kế: không có.

## B10 (2026-10-18) · API-07 `GET /api/v1/contests`

### Đã làm
- `Api/Controllers/ContestsController.cs` (mới), `Api/Models/ContestScheduleModels.cs` (DTO), `Tests/ContestsControllerTests.cs` (2 ca). Dùng `IContestCatalog.GetScheduleAsync(now)` có sẵn từ B6 (đã lọc `is_active`, sắp xếp, tối đa 12 `ended`); controller chỉ ánh xạ sang JSON R5, thời điểm dạng `yyyy-MM-ddTHH:mm:ssZ`, `focusArea` null khi trống, `Cache-Control: public, max-age=60`.
- Sửa kèm review B9 (lỗi Thấp): hoàn lại 5 view BOM/xuống dòng bằng `git checkout 17d17f92 -- <5 file>`, commit riêng.

### Lệnh và kết quả
- `dotnet test Umbraco.Plugin.Custom.Tests`: 75 đạt, 0 lỗi (lần đầu 1 ca sai do tôi tính nhầm ngày trong test, đã sửa test).
- `.\run-local.ps1 -NoRun` build xong; `dotnet run --no-build --urls http://localhost:11003`.
- CSDL luồng có sẵn cuộc từ B9: 1 đang diễn ra, 2 sắp tới, 3 tắt, 4 đã qua; chèn thêm cuộc 5 đang diễn ra chồng (bắt đầu muộn hơn, `focus_area=vieclam`) bằng python sqlite3 (không dùng backoffice).
- `Invoke-WebRequest /api/v1/contests`: `ongoing` = [5, 1] (startAt giảm dần), `upcoming` = [2], `ended` = [4], cuộc 3 (tắt) không xuất hiện; `Cache-Control: public, max-age=60`; `questionCount` 9 = số dòng `contest_question`.
- Tắt cả bốn cuộc (`is_active=0`): ba mảng rỗng, 200. Sau đó bật lại 1, 2, 4, 5.
- Bằng chứng: `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v4-be2\b10-api07.txt`. Web đã dừng bằng PID của cổng 11003.

### Chưa kiểm / giả định / sai khác
- Tạo cuộc bằng SQL thay vì backoffice (cột khớp bảng; kết quả API chỉ đọc DB nên tương đương). Chưa kiểm `focusArea` null qua HTTP (cuộc 1 có `fa=` rỗng, tức null; có test đơn vị cho trường hợp có giá trị).
- Không có sai khác so với R5. Không dùng ETag (R5 không yêu cầu).

## B11 (2026-10-18) · Quản trị cuộc thi: cột mới và ràng buộc khi đã có lượt

### Đã làm (commit trên `lane/CUOC-THI-v4-be2`)
- `ContestAdminModels.cs`: `SaveContestCampaignRequest` thêm `SubmitGraceHours` (mặc định 24), `ReadTimerFactor` (1), `FocusArea` (null); `ContestCampaignAdminDto` thêm các trường đó và `EntryCount`. Thêm `ContestHasEntriesException`.
- `ContestAdminService.cs`: kiểm `submitGraceHours` 0–168, `readTimerFactor` 0–5, `focusArea` khớp `^[a-z0-9_-]{1,50}$` (lỗi `400 VALIDATION` có `fields`); lưu các cột. Cuộc đã có lượt (`entry.contest_id`): đổi tập chuyên đề hoặc tập câu hỏi, hoặc xóa → ném `ContestHasEntriesException`. Đổi tên, thời gian, lượt tối đa, gia hạn, hệ số, lĩnh vực, bật/tắt, thứ tự hiển thị vẫn cho phép.
- `ContestAdminController.cs`: PUT và DELETE campaign trả `409 CONTEST_HAS_ENTRIES` (dạng lỗi QĐ-004).
- `contest-management.js`: form có gia hạn (giờ), hệ số đọc, lĩnh vực; ghi chú khi cuộc đã có lượt; cột "Lượt dự thi" ở danh sách.
- Test thêm 10 ca trong `ContestCampaignAdminServiceTests` (lưu 3 cột, 5 ca ngoài khoảng, đổi đề khi có lượt → ném, đổi cấu hình cùng đề khi có lượt → được, xóa khi có lượt → ném, xóa khi không có lượt → được).

### Lệnh và kết quả
- `dotnet test src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests`: 85 đạt, 0 lỗi (trước đó 75).
- `node --check` trên bản sao `contest-management.js`: cú pháp hợp lệ.

### Chưa kiểm / giả định / sai khác
- **Chưa chạy thử qua HTTP hay backoffice**: API quản trị cần token backoffice, phiên không đăng nhập được; chưa nhìn form trên giao diện. Ánh xạ 409 ở controller chỉ kiểm bằng build, không có test controller. Nên kiểm ở I2 hoặc review chạy thử.
- Giả định: "đổi bộ đề" = đổi tập chuyên đề hoặc tập câu hỏi; chỉ đổi thứ tự thì không bị chặn (tránh 409 sai khi form gửi lại theo thứ tự cây). Nếu muốn chặn cả đổi thứ tự (QĐ-025 thứ tự chuyên đề) cần quyết định.
- Giả định: khóa lĩnh vực chỉ kiểm định dạng, chưa đối chiếu với danh sách khóa của trang Thủ đoạn (danh sách chưa có trong code); ô nhập là text tự do.
- `readTimerFactor` nhận 0 (theo ghi chú review B5 "0–5").
- Không có sai khác khác so với thiết kế. Không đụng schema/migration.


## B13 (2026-10-18) · Cuộc thi mẫu khi chạy local

**Trạng thái:** xong, đã kiểm chứng, đã commit vào `lane/CUOC-THI-v4-be2`.

**Đã làm** (`Umbraco.Plugin.Custom.Core/Data/AppDbInitializer.cs`): inject `IHostEnvironment`; sau bước nạp ngân hàng câu hỏi, nếu `IsDevelopment()` và bảng `contest` trống thì tạo một cuộc "Cuộc thi mẫu (môi trường local)" gồm mọi chuyên đề và mọi câu `IsActive`, `StartAt` 2026-10-01 00:00 và `EndAt` 2026-12-31 23:59:59 giờ VN (lưu UTC: 2026-09-30T17:00Z, 2026-12-31T16:59:59Z). Các giá trị khác lấy mặc định của entity (2 lượt, gia hạn 24 giờ, hệ số 1). Không đổi schema, không có migration.

**Lệnh đã chạy và kết quả thật**
- `.\run-local.ps1 -Reset -NoRun` (0 lỗi), chạy web Development trên cổng 11003, `GET /api/v1/contests`: `ongoing` có 1 cuộc, `questionCount` 200, 8 chuyên đề (19+24+28+27+23+23+28+28), `endAt` 2026-12-31T16:59:59Z. Log có "Da nap cuoc thi mau: 8 chuyen de, 200 cau". Kết quả: `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v4-be2\b13-contests-dev.json`.
- `-Reset` lại, chạy với `ASPNETCORE_ENVIRONMENT=Production` và `--no-launch-profile`: `GET /api/v1/contests` trả `ongoing/upcoming/ended` đều rỗng, log không có dòng nạp cuộc mẫu. Kết quả: `...\b13-contests-prod.json`, log `b13-prod.log`.
- `dotnet test` project Tests: 85 đạt, 0 lỗi.
- Đã dừng web bằng PID của cổng 11003.

**Chưa kiểm được:** không chạy lại lần hai trên CSDL đã có cuộc (chỉ dựa vào điều kiện `AnyAsync`); không kiểm kịch bản `-Reset` nhập uSync của `cuocThiLamBaiPage` (nhắc ở thiết kế) ngoài việc web lên bình thường; chưa thêm test tự động cho initializer (cần CSDL + môi trường giả).

**Giả định:** tên và mô tả cuộc mẫu do tôi đặt; "mọi câu đang dùng" hiểu là `IsActive`, thứ tự chuyên đề theo mã, thứ tự câu theo chuyên đề rồi `SortOrder`. Dùng offset cố định +7 thay vì tra múi giờ.

**Sai khác so với thiết kế:** không có. Lưu ý: dòng `thiPage` (ngày mẫu QĐ-008) trong uSync không bị đụng; QĐ-008 coi như được thay bởi (G) theo QĐ-024, việc dọn ngày ở `thiPage` không thuộc B13.

**Review còn tồn:** review B11 không có mục Worker phải sửa. Hai mục Thấp (colspan 8→9, request cũ thiếu trường) không bắt buộc, chưa làm.
