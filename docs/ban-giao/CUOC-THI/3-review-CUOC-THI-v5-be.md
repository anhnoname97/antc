
## Review B12 (2026-10-18)

### Phạm vi đã review
Commit `e3df74e5` (4a70906e..HEAD, luồng CUOC-THI-v5-be): xóa `ContestSettings.cs`, `ContestSettingsService.cs`, bỏ đăng ký DI, sửa `ContestAttemptService` và test. Chuẩn: `1-thiet-ke.md` dòng 664 (B12), báo cáo B12 của Worker. Không build/chạy web; dựa vào báo cáo (build 0 lỗi, test 95/95) — tôi không tự xác minh được. Không có thư mục `agent-artifacts/CUOC-THI-v5-be/`.

### Kiểm tra
- `git grep` ở commit e3df74e5 (`*.cs`, `*.cshtml`, `*.json`): không còn `IContestSettings`, `ContestSettings`, `ContestSettingsService`, `ContestStatus`, `NormalizeMaxAttempts/SubmitGraceHours`, `IsSubmitOpen`, và không còn đọc `contestStart/contestEnd/submitGraceHours/readTimerFactor` từ Umbraco. Các lần `maxAttempts` còn lại là DTO/validate admin/dữ liệu `ContestCampaign` — đạt tiêu chí Grep.
- `ContestConfigCheck` giữ nguyên, chỉ cảnh báo muối — đạt.
- `ContestAttemptService.cs:165`: lượt không có cuộc/cuộc bị tắt dùng hằng `DefaultMaxAttempts = 2`, giữ hành vi cũ; hợp lý.
- Test: bỏ `NoSettings`, chữ ký constructor khớp. Không thấy chỗ tạo `ContestAttemptService` nào khác trong khoảng diff (build đã được Worker báo qua).

### Phát hiện
Không có lỗi từ mức Thấp trở lên.

### Cần xác minh (không chặn)
- Property `contestStart/contestEnd/maxAttempts...` trên document type `thiPage` trong uSync vẫn còn (Worker đã nêu). Không còn code đọc; nên gỡ ở một task uSync riêng nếu muốn. Mục "Lưu ý đã biết" trong CLAUDE.md về `403 CONTEST_CLOSED` do thiPage nay lỗi thời — để điều phối cập nhật.
- Kết quả build/test chưa được tôi chạy; Worker/I2 nên xác nhận lại trên nhánh gộp.

### Worker phải sửa
Không.

### Cần người dùng xác nhận
Không.

### Kết luận
B12 đạt, có thể merge.

## Review S1 (2026-10-18)

### Phạm vi đã review
- Commit `ff62e506` (khoảng `e3df74e5..HEAD`), 2 view: `_ContestHeader.cshtml`, `competitionOverviewBlock.cshtml`.
- Chuẩn so sánh: `1-thiet-ke.md` dòng S1 (cột tiêu chí), QĐ-xxx (E) thanh thông báo hiện cuộc `ongoing` bắt đầu muộn nhất; (F) trang làm bài `/cuoc-thi/lam-bai/?c=<id>`.
- Bằng chứng chạy thử: HTML Worker lưu ở `agent-artifacts\CUOC-THI-v5-be\s1-{0,1,2}cuoc.html` (đọc bằng grep). Không build, không chạy web, không xem ảnh.
- Không review được: giao diện 1440/390 (Worker cũng chưa chụp), trang Ứng phó.

### Đối chiếu tiêu chí S1
| Tiêu chí | Kết quả |
|---|---|
| Không in "tháng" tính từ `StartAt` | Đạt: `contestMonth` bị xóa ở cả 2 view; HTML 1 cuộc không còn "Tháng …" từ view. |
| Dùng phần tử đầu `ongoing` | Đạt: 2 cuộc → liên kết `?c=2` (cuộc bắt đầu muộn nhất, đúng QĐ (E)). |
| Không cuộc thì ẩn thanh | Đạt: `s1-0cuoc.html` có 0 lần `contest-announcement-inner`, khối hiện "Chưa mở cuộc thi". |
| Liên kết tới trang làm bài `?c=` | Đạt: `/cuoc-thi/lam-bai/?c=1`, `?c=2` ở cả thanh và nút khối. |
| Số câu/chuyên đề/lượt từ cuộc | Không đổi, vẫn từ `contest` (diff không đụng). |
| Tắt JS vẫn thấy chữ | Đạt ở mức HTML máy chủ in sẵn (grep thấy "Cuộc thi đang diễn ra", "THẺ DỰ THI · 01/10/2026 – 31/12/2026"). |

### Phát hiện
Không có lỗi từ mức Trung bình trở lên.

### [Thấp] Helper `L` còn lại nhưng không dùng
- Vị trí: `competitionOverviewBlock.cshtml` (dòng `Link? L(string alias)`).
- Bằng chứng: diff bỏ chỗ dùng duy nhất `L("entryLink")`; Worker tự ghi nhận.
- Hướng khắc phục: xóa helper ở lần sửa view kế tiếp (không bắt buộc). Trường `entryLink` trong document type cũng thành thừa, xử lý ở backoffice nếu muốn.

### Cần xác minh
- Chữ tĩnh "Thi thật · tháng 10/2026" ở nội dung uSync `/cuoc-thi/` (Worker ghi `cuộc-thi-trực-tuyến.config:299`) còn nhãn tháng viết cứng. Ngoài phạm vi S1, nhưng nên xử lý trước I2 để không còn "tháng" cố định. Chưa tự kiểm file này.
- Giao diện thực tế (thanh không tràn ở 390px khi tên cuộc dài + khoảng ngày): chỉ kiểm được ở bước tích hợp I2.

### Worker phải sửa
Không.

### Cần người dùng xác nhận
Không.

### Kết luận
S1 đạt: 2 view đúng thiết kế và QĐ (E)/(F), bằng chứng 0/1/2 cuộc khớp. Rủi ro còn lại: giao diện chưa chụp, chữ "tháng 10/2026" trong nội dung uSync.
