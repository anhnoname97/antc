# Review luồng CUOC-THI-v4-be1

## Review B8a · 2026-10-18

### Phạm vi đã review
- Commit `499dee2f` (khoảng `17d17f92..HEAD`): `ContestAttemptService.cs` (+57/-8) và `ContestAttemptServiceTests.cs` (mới, 153 dòng).
- Chuẩn so sánh: `1-thiet-ke.md` (R5 API-02/03, dòng 622-631; task B8a dòng 659), QĐ-014, QĐ-018, QĐ-019, QĐ-021, QĐ-024 (Hiệu lực), báo cáo `2-ban-giao-CUOC-THI-v4-be1.md` mục B8a, bằng chứng `agent-artifacts/CUOC-THI-v4-be1/b8a-1.txt`, `b8a-2.txt`.
- Không build, không chạy web. Kết quả `dotnet test` 71/71 và chạy thử là theo báo cáo của Worker, không tự kiểm lại.

### Phát hiện
Không có lỗi từ mức Trung bình trở lên.

- API-02: `contest {id,name,startAt,endAt,submitUntil,phase,readTimerFactor}`, `topics [{cd,count}]` theo thứ tự đề, `maxAttempts` của cuộc, `total` = số câu của đề khi đang làm và giữ `entry.total_questions` khi đã nộp: đúng contract R5. Lượt không cuộc / cuộc bị tắt: `contest:null`, `topics:[]`, rơi về cài đặt cũ: đúng ("coi như closed").
- API-03: đóng theo `PhaseAt(now) != Open` (đúng cả `upcoming`, `submit_only`, `closed`; QĐ-014 theo cuộc); câu ngoài đề → `400 UNKNOWN_QUESTION`; thứ tự kiểm giữ nguyên; việc đọc cuộc nằm ngoài khóa, thời điểm so sánh lấy trong khóa (đúng ý đã ghi trong code). `TimeProvider` đã có trong DI (`CustomCoreComposer.cs:45`).
- Bằng chứng chạy thử (`b8a-2.txt`) khớp từng tiêu chí của B8a: `400` câu ngoài đề, `200 stored:true` câu trong đề, `403` khi `submit_only` và `closed`, lượt cũ `contest:null` + API-03 `403`. `b8a-1.txt` là lần chạy hỏng (404 do sai mã câu), đã được `b8a-2.txt` thay thế; chấp nhận được.
- Không làm ngoài phạm vi: API-04/05 vẫn dùng `IContestSettings` (thuộc B8b); không ép thứ tự chuyên đề (Q2 chưa chốt) là đúng.

#### [Thấp] `QuestionCodes.Contains` là tìm tuyến tính
- Vị trí: `ContestAttemptService.cs` (`SaveAnswerAsync`, `contest.QuestionCodes.Contains(key.Code)`), `ContestCatalog.cs:19` (`IReadOnlyList<string>`).
- Bằng chứng: kiểu `IReadOnlyList` nên `Contains` quét O(n) (~200 câu), trong vùng giữ `WriteLock`.
- Tình huống: không gây sai; chỉ tốn thêm vài micro giây mỗi lần ghi.
- Hướng khắc phục (không bắt buộc): để `ContestInfo` giữ thêm `HashSet<string>` khi dựng.

### Sai khác tài liệu ↔ code
Không có. Giả định của Worker (cuộc `is_active=false` giữa chừng coi như không cuộc) khớp `IContestCatalog.GetAsync` và dòng "lượt không có cuộc" của R5; chấp nhận, nên nhắc lại khi làm B9 (quản trị cuộc) nếu cho tắt cuộc đang có lượt.

### Cần xác minh
- Chưa chạy thật với cuộc có đề thuộc nhiều chuyên đề và `total` ở trạng thái đã nộp (liên quan B8b). Không chặn B8a.
- `end_at` đổi bằng SQL thay vì backoffice: chấp nhận vì catalog đọc DB mỗi yêu cầu.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có (Q2 về ép thứ tự chuyên đề ở API-03 vẫn treo từ trước, chưa chặn B8a/B8b).

### Đề xuất (không bắt buộc)
Mục Thấp ở trên.

### Kết luận
B8a đạt: có thể chuyển B8b. Rủi ro còn lại: kiểm đầu–cuối luồng thi chờ B8b và I2.

TRANG-THAI: DAT

## Review B8b · 2026-10-18

### Phạm vi đã review
Commit `4b4b970b` (`git diff 499dee2f..HEAD`: `ContestAttemptService.cs`, `ContestAttemptServiceTests.cs`). Chuẩn so sánh: `1-thiet-ke.md` (R5, dòng B8b), QĐ-014, QĐ-015, QĐ-019. Không build, không chạy web; chạy thử dựa vào `agent-artifacts/CUOC-THI-v4-be1/b8b-1.txt` và báo cáo (test 77/77, build 0 lỗi do Worker báo, chưa tự kiểm lại).

### Đối chiếu tiêu chí
- Hạn nộp theo cuộc: `Closed` → `403 CONTEST_CLOSED`, `open` và `submit_only` đều nộp được; gia hạn 24 → `200`, gia hạn 0 → `403` (b8b-1.txt). Đạt.
- "Đủ câu" theo đề (`contest.QuestionCodes`, QĐ-015 theo QĐ-019): thiếu 0/4 và 3/4 → `409 INCOMPLETE_ANSWERS`, trạng thái vẫn `in_progress`; đủ → `200`, `total = total_questions = 4`. Đạt.
- `byTopic` theo `contest.Topics` (2 chuyên đề × 2 câu). Đạt.
- Đếm lượt theo `(ContestId, Phone)` ở API-04 và API-05, thông báo "lượt của cuộc thi này". Đạt (hai cuộc cùng số chỉ kiểm bằng test đơn vị).
- API-04 chỉ nhận khi `phase = open`: khớp R5 dòng 630. Đạt.

### Phát hiện
#### [Thấp] `answered` đếm cả dòng trả lời ngoài đề
- Vị trí: `ContestAttemptService.cs` nhánh nộp lần đầu, `BuildResult(current, rows.Count, total, …)`.
- Bằng chứng: "đủ câu" dùng `covered` (chỉ câu thuộc đề) nhưng `answered` trả về `rows.Count`.
- Tình huống: lượt có dòng trả lời của câu sau đó bị loại khỏi đề thì `answered` có thể lớn hơn `total`. Hiếm, vì B11 sắp chặn đổi bộ đề cuộc đã có lượt.
- Hướng sửa: dùng `covered` cho `answered`. Không chặn.

### Sai khác tài liệu ↔ code
Không có. Giả định của Worker (cuộc tắt hoặc lượt không cuộc → `403`; `upcoming` → `403`) hợp lý và nhất quán với B8a.

### Cần xác minh
Hai cuộc cùng số điện thoại qua HTTP: chưa chạy, sẽ kiểm ở I2.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có (Q2 vẫn treo, không chặn B8b).

### Đề xuất (không bắt buộc)
Sửa lỗi Thấp ở trên khi làm B12 (cùng file).

### Kết luận
B8b đạt, có thể chuyển B12 (B9 còn cần xong). Rủi ro còn lại: kiểm đầu–cuối luồng thi ở I2; `IContestSettings` còn dùng cho API-02 lượt cũ tới B12.

TRANG-THAI: DAT
