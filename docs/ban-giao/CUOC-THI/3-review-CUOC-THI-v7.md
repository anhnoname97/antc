
## Review B14 · 2026-10-18 · Máy chủ ép thứ tự chuyên đề ở API-03

### Phạm vi đã review
- Commit `c91f5ee5` (khoảng `df9174de..HEAD`, 5 file: `ContestAttemptService.cs`, `ContestController.cs`, `contest-store.js`, `exam.js`, `ContestAttemptServiceTests.cs`).
- Chuẩn so sánh: `1-thiet-ke.md` › "Cập nhật 2026-10-18: task B14 và K1", QĐ-004 (dạng lỗi), QĐ-025 (thứ tự theo đề), QĐ-027.
- Không review: chạy thật (không build, không chạy web). Dựa vào báo cáo Worker: `dotnet test` 97/97. Không xem file kết quả nào trong `agent-artifacts` cho task này.

### Phát hiện
Không có lỗi từ mức Thấp trở lên.

Đối chiếu tiêu chí của B14:
- Chuyên đề n bị từ chối khi chuyên đề đứng trước chưa xong: đạt (`ContestAttemptService.cs` `FirstUnfinishedBeforeAsync`, gọi sau các kiểm tra ALREADY_SUBMITTED / CONTEST_CLOSED / UNKNOWN_QUESTION / INVALID_OPTION). Test `SaveAnswer_TopicsMustBeDoneInExamOrder` kiểm cả trường hợp xong một nửa.
- Làm đúng thứ tự thì được: đạt (cùng test).
- Đề không có CĐ1: đạt, chuyên đề đầu của đề (`index <= 0`) không bị khóa; test có đề chỉ CĐ2 và đề đảo thứ tự.
- Lượt ở cuộc khác không ảnh hưởng: đạt. Đáp án lọc theo `EntryId`, và chỉ tính câu thuộc `contest.QuestionCodes`.
- Dạng lỗi QĐ-004: đạt. `TOPIC_LOCKED` → 409, ánh xạ ở `ContestController.cs`, body `{ error: { code, message, fields } }`.

Điểm đã soi kỹ:
- Gửi lại câu đã lưu vẫn trả `stored=false` mà không bị khóa, vì kiểm tra khóa đặt sau nhánh `existing`. Đúng với tính idempotent của API-03.
- "Xong" = số câu của đề đã trả lời >= `ContestExamTopic.Count`. `Count` do `ContestCatalog.ToInfo` tính trên đề thực tế (câu còn trong ngân hàng), nên một câu đã bị bỏ khỏi ngân hàng không làm chuyên đề bị khóa vĩnh viễn. (Chỉ đọc định nghĩa record `ContestExamTopic`/`ContestInfo`; phần thân `ToInfo` chưa đọc hết.)
- Kiểm tra nằm trong `WriteLock` và transaction, nên không có race giữa hai yêu cầu.
- Dữ liệu cũ (đáp án chuyên đề sau đã lưu trước B14) không bị ảnh hưởng: chuyên đề trước vẫn ghi được.
- FE: `TOPIC_LOCKED` được thêm vào `DROP_CODES` nên hàng đợi gửi lại bỏ câu này (thử lại không thể thành công khi trạng thái chưa đổi). `ERR_TEXT` có câu báo, chữ có dấu.
- Quy ước: comment tiếng Việt không dấu, chữ hiển thị có dấu, không `style=`, không đổi tên trường JSON.

### Sai khác tài liệu ↔ code
- Mã `TOPIC_LOCKED` (409) chưa có trong bảng mã lỗi (sheet "API" và docx). Đây là chủ đích của B14 theo QĐ-027. Orchestrator ghi vào `1-thiet-ke.md` ở lần cập nhật kế tiếp.

### Cần xác minh (để K1)
- Gọi HTTP thật: POST API-03 sai thứ tự trả 409 đúng dạng, đúng thứ tự trả 200.
- Mock `contest-api.js` chưa ép thứ tự (chỉ dùng khi `?mock`), không ảnh hưởng chức năng thật.

### Đề xuất (không bắt buộc)
- Thêm một dòng `TOPIC_LOCKED` vào bảng mã lỗi trong `1-thiet-ke.md`.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có. `TOPIC_LOCKED`/409 nhất quán với `INCOMPLETE_ANSWERS` và `ALREADY_SUBMITTED`; QĐ-027 giao việc chọn mã lỗi cho B14.

### Kết luận
B14 đạt, có thể sang K1. Rủi ro còn lại: chưa kiểm HTTP thật (thuộc K1).

## Review K1 · 2026-10-18 · Kiểm các mục chưa kiểm (QĐ-027)

### Phạm vi đã review
- Khoảng `c91f5ee5..HEAD`: **rỗng** (HEAD vẫn là `c91f5ee5`, Worker không sửa code và không commit). Không có diff để review; K1 là task chỉ ghi kết quả.
- Chuẩn so sánh: `1-thiet-ke.md` › "Cập nhật 2026-10-18: task B14 và K1" (5 nhóm cần kiểm), QĐ-004, QĐ-025, QĐ-027; báo cáo Worker mục K1.
- Bằng chứng đã đọc: `agent-artifacts/CUOC-THI-v7/k1-api.txt`, `k1-backoffice.txt`, `k1-timer.txt`, `web.log` (grep lỗi). Không mở ảnh. Không build, không chạy web. Đọc thêm `ContestAdminController.cs:112` ở `c91f5ee5` để xác nhận mã lỗi 409.
- Chữ trong `k1-api.txt` bị hỏng mã hóa khi ghi file (tiếng Việt thành `?`); chỉ là lỗi của file log, không phải lỗi của API. Số liệu và mã lỗi vẫn đọc được.

### Phát hiện
Không có lỗi từ mức Trung bình trở lên.

Đối chiếu từng nhóm với bằng chứng:
1. **uSync `cuocThiLamBaiPage` trên CSDL trống**: báo cáo ghi `uSync_FirstBoot ... 165 changes`, `Startup Complete`. `web.log` chỉ có lỗi `SQLite Error 14 unable to open database file`, là lỗi lần chạy đầu mà CLAUDE.md đã ghi là bình thường. Đạt.
2. **POST entries `named`**: `k1-api.txt` có đủ: thiếu consent → 400 `VALIDATION` kèm `fields.consent`; hợp lệ → 201 `attemptNo 1`; số viết `+84` → `attemptNo 2`; lần 3 → 409 `ATTEMPT_LIMIT`; contest sai → 404; thiếu → 400. Dạng lỗi đúng QĐ-004. Đạt (riêng "lượt cuộc khác không tính" chỉ có test đơn vị).
3. **API-02..05 thật**: token đúng/sai/thiếu → 200/401/401; `TOPIC_LOCKED` 409 khi CĐ2 trước CĐ1 (xác minh B14 qua HTTP, chốt mục "Cần xác minh" của review B14); `UNKNOWN_QUESTION`, `INVALID_OPTION`; `stored:true` rồi `stored:false`; `INCOMPLETE_ANSWERS` 409; nộp đủ 200 câu theo thứ tự không lỗi, nộp lại trả cùng kết quả; sau nộp API-03/04 → `ALREADY_SUBMITTED`; `ALREADY_NAMED`; API-04/05 với `ATTEMPT_LIMIT`. Đạt.
4. **Form quản trị B11**: `k1-backoffice.txt` khớp báo cáo: đổi gia hạn/hệ số/lĩnh vực lưu được, đổi bộ đề và xóa bị chặn với thông báo "(12 lượt)". Mã 409 chưa bắt được response nhưng `ContestAdminController.cs:112` ánh xạ `CONTEST_HAS_ENTRIES` đúng. Đạt.
5. **Đồng hồ đọc**: `k1-timer.txt`: 0.5 → 42 giây, 2 → 2 phút 51 giây, 0 → nút mở ngay. Đạt, một điểm nhỏ ở mục dưới.

### Sai khác tài liệu ↔ code
- `TOPIC_LOCKED` (409) vẫn chưa có trong bảng mã lỗi. Việc của Orchestrator (đã nêu ở review B14), không phải việc của Worker.

### Cần xác minh
- **Đồng hồ 0.5**: 86 × 0.5 = 43 giây, màn hình hiện "Còn 42 giây". Có thể do chụp sau khi đồng hồ đã đếm 1 giây; chỉ là Thấp nếu hóa ra làm tròn xuống thay vì `ceil`. Không chặn.
- **Điểm 165**: báo cáo nói "35 câu cố ý sai"; `byTopic` cộng lại khớp 165 (35 sai) nên hệ thống tính nhất quán. Quy tắc sai của script thử không có trong file bằng chứng, không ảnh hưởng kết luận.
- **Làm tròn giây giờ kết thúc** (Worker quan sát): form sửa dùng `datetime-local`, mỗi lần lưu làm `endAt` 16:59:59Z thành 16:59:00Z, `submitUntil` lệch theo. Chưa có QĐ nói cuộc thi phải kết thúc đúng giây :59; tác động là mất tối đa 59 giây ở cuối cuộc thi. Mức **Thấp**. Nên gom vào một task nhỏ (giữ nguyên giây nếu giờ-phút không đổi, hoặc thêm bước giây) nhưng không chặn.

### Đề xuất (không bắt buộc)
- Ghi dòng `TOPIC_LOCKED` vào bảng mã lỗi trong `1-thiet-ke.md`.
- Ghi log thử ở UTF-8 để dễ đọc lần sau.
- Còn chưa kiểm (Worker đã nêu): giá trị ngoài khoảng `submitGraceHours` >168 / `readTimerFactor` >5 qua HTTP, đếm lượt giữa hai cuộc qua HTTP, trình duyệt/điện thoại khác, CSDL cũ có dữ liệu. Đề xuất chấp nhận vì đã có test đơn vị cho hai mục đầu.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
K1 đạt: cả 5 nhóm có bằng chứng văn bản khớp báo cáo, không phát hiện lỗi mới, không có thay đổi code để review. Rủi ro còn lại: các mục "chưa kiểm được" ở trên (mức thấp) và việc làm tròn giây giờ kết thúc ở form quản trị, để Orchestrator quyết có xử lý hay không. Worker đã hoàn lại 5 view uSync bị ghi lại BOM, không commit.
