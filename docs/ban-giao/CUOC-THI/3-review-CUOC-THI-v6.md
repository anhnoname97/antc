# Review luồng CUOC-THI-v6

## Review F9 (2026-10-18)

### Phạm vi đã review
- Commit `f3cc6fd8` (khoảng `4fc1cb8e..HEAD`, 6 file: `submit.js` mới, `exam.js`, `phone.js`, `register.js`, `_LuongThi.cshtml`, `contest.css`). Đọc diff và `submit.js` đầy đủ; đọc thêm `contest-store.js` (`submit`, `attachContact`) và `ContestAttemptService.cs` ở worktree (API-04, API-05) để đối chiếu hành vi máy chủ.
- Chuẩn so sánh: `1-thiet-ke.md` › R6 task F9, "F5 sau CXN-3" (QĐ-015), R5 (`phase`, API-04/05); `2-ban-giao-CUOC-THI-v6.md`.
- Chạy thử: không build, không chạy web. Dựa vào `agent-artifacts/CUOC-THI-v6/f9-ket-qua.txt` (76 đạt, 0 lỗi, mock). Không xem ảnh.
- Không review được: giao diện bằng mắt (Worker cũng chưa xem), chạy với API thật (thuộc I2).

### Phát hiện

#### [Trung bình] Nút "Dự thi có tên" hiện ở pha `submit_only`; bấm vào làm mất nút Nộp bài
- Vị trí: `submit.js` › `attachButtonHtml` (chỉ ẩn khi `submitExpired()`), `handleError` case `CONTEST_CLOSED` (`expired = true` dùng chung cho cả `attach` và `submit`).
- Bằng chứng: API-04 chỉ nhận khi `PhaseAt == Open` (`ContestAttemptService.cs:284-287` trả `CONTEST_CLOSED` cho `submit_only`), còn API-05 nhận cả `open` và `submit_only` (`:349`, R5 dòng 630). Thiết kế F5: "Nhận 403 CONTEST_CLOSED (API-04, API-05): ẩn nút Nộp bài và 'Dự thi có tên'" áp dụng khi hết hạn nộp, không phải khi chỉ hết hạn gắn tên.
- Tình huống: lượt ẩn danh đã đủ câu, cuộc đã qua `endAt` nhưng còn trong thời gian gia hạn (`submit_only`). Cột bên vẫn hiện "Dự thi có tên để xét giải". Người dùng bấm, điền, gửi → `CONTEST_CLOSED` → `expired = true` → `submitExpired()` đúng → thanh nộp bài báo "Đã hết hạn nộp bài" và ẩn nút Nộp bài, dù máy chủ vẫn nhận nộp. Người dùng không nộp được tới khi tải lại trang. Kiểm thử E của Worker chỉ dùng lượt có tên nên không bắt được.
- Hướng khắc phục: `attachButtonHtml` chỉ hiện khi `state.contest?.phase === 'open'` (và không `expired`); với lỗi `CONTEST_CLOSED` của `kind === 'attach'` không đặt `expired`, chỉ đọc lại API-02 để cột bên ẩn nút. Thêm một ca kiểm chứng: lượt ẩn danh + `submit_only` → không có nút gắn tên, vẫn nộp được.

#### [Thấp] Câu "đồng ý" trong hộp thoại do Worker tự viết
- Vị trí: `_LuongThi.cshtml` (`.sdlg__legal`, nhãn `sd-ok`).
- Bằng chứng: bàn giao ghi chưa có bản duyệt. Không phải lỗi mã; chủ quản duyệt cùng giao diện FE-29.
- Hướng khắc phục: không cần sửa; chờ duyệt câu chữ.

### Sai khác tài liệu ↔ code
- Hộp thoại không có hộp hồng "Còn z câu chưa làm" (Worker nêu): đúng với CXN-3/QĐ-015 vì nút chỉ hiện khi đủ câu. Chấp nhận.
- Lượt không cuộc (`contest: null`) coi là hết hạn nộp: khớp R5 và `SubmitAsync:349`. Chấp nhận.
- Tên cuộc lấy từ API-02 `contest.name` vì API-05 không trả tên: khớp contract R5. Chấp nhận.

### Đối chiếu tiêu chí F9 / F5 sau CXN-3
- Thiếu 1 câu không có nút, đủ thì có; tổng = `total`/`topics` của API-02, không viết cứng 200 (Worker Grep 0): đạt (theo `counts`, `f9-ket-qua.txt`).
- Hàng đợi chưa gửi → `QUEUE_PENDING`, không gọi API-05, giữ hộp thoại: đạt (mã `contest-store.js:415-418`, kiểm thử D).
- `INCOMPLETE_ANSWERS`: đọc lại API-02, hiện `message`, đóng hộp thoại, focus về tiêu đề; thứ tự `resetLoaded` → `setNotice` đúng: đạt.
- `CONTEST_CLOSED` ở API-05: ẩn nút: đạt. Ở API-04: sai như phát hiện trên.
- Kết quả ghi tên cuộc, điểm theo chuyên đề, tải lại vẫn ra kết quả (API-05 nộp lại trả kết quả đã lưu, `SubmitAsync:341-346` xác nhận): đạt.
- `submit_only` nộp được (có tên): đạt.
- Hộp thoại `<dialog>`: Tab vòng, Esc, trả focus, khóa khi đang gửi, 390px toàn màn hình: đạt theo số đo của Worker.
- `phone.js` tách `checkContact`, `register.js` giữ hành vi: đúng diff, không đổi thứ tự kiểm tra hay câu chữ.
- Quy ước: comment không dấu, chữ hiển thị có dấu, không `style=` (Grep diff không có), dùng biến `--c-*`, `rem`; không sửa C#, không đụng file ngoài luồng FE.

### Cần xác minh
- Màn kết quả và bảng điểm bằng mắt, 1440/744/390 (chủ quản duyệt FE-29).
- API-05 thật với `byTopic`, `403/409`, `ATTEMPT_LIMIT` khi kèm `contact`; nhiều cuộc cùng lúc không có `?c=` ở "Thi lượt thứ n+1": làm ở I2.

### Đề xuất (không bắt buộc)
- Không có.

### Worker phải sửa
1. [Trung bình] Sửa phát hiện `attach` ở `submit_only` như trên, kèm ca kiểm chứng mock `submit_only` + lượt ẩn danh.

### Cần người dùng xác nhận
- Không có (câu chữ đồng ý và giao diện FE-29 chờ chủ quản duyệt như Worker đã nêu, không chặn).

### Kết luận
Cần sửa một lỗi Trung bình (nhỏ, cô lập trong `submit.js`) trước khi sang I2. Phần còn lại đạt theo bằng chứng mock; rủi ro còn lại là chưa chạy với API thật.

## Review F9 — vòng 2 (2026-10-18)

### Phạm vi đã review
- Commit `43dbd5c4` (khoảng `4fc1cb8e..HEAD`), chỉ `submit.js` (+9/-2). Đối chiếu với mục "Worker phải sửa" của vòng 1. Không build, không chạy web; dựa vào `agent-artifacts/CUOC-THI-v6/f9-ket-qua.txt` (81 đạt, 0 lỗi, mock). Không xem ảnh.

### Phát hiện
Không có lỗi mới.

### Đối chiếu việc đã yêu cầu sửa
- [Trung bình] Nút "Dự thi có tên" ở `submit_only`: **đã sửa đúng**. `attachButtonHtml` chỉ hiện khi `state.contest.phase === 'open'` (khớp API-04 chỉ nhận ở pha open). `handleError` case `CONTEST_CLOSED`: `attaching` được lấy trước `closeDialog()` (là nơi đặt `kind = null`, `submit.js:313`), với `attach` chỉ đóng hộp thoại và gọi `deps.onAttached()` (đọc lại API-02), không đặt `expired`, nên nút Nộp bài không bị khóa; nhánh `submit` giữ nguyên.
- Ca kiểm chứng E2/E3 đã thêm và đạt (nút gắn tên mất ở `submit_only`, vẫn nộp được, ra màn kết quả).
- Lưu ý nhỏ (không tính lỗi): `const` khai báo trực tiếp trong `case` không có ngoặc; hợp lệ, không trùng tên trong switch. Lỗi 403 từ API-04 giữa lúc gửi chưa mô phỏng đúng, chỉ mô phỏng bằng tải lại; logic đọc qua diff là đúng.

### Cần xác minh
- Như vòng 1: màn kết quả bằng mắt (FE-29, chủ quản duyệt), API-05 thật, nhiều cuộc không có `?c=`: làm ở I2.

### Worker phải sửa
- Không có.

### Cần người dùng xác nhận
- Không có (câu chữ "đồng ý" chờ duyệt cùng FE-29, không chặn).

### Kết luận
F9 đạt. Có thể sang I2 (tích hợp đầu–cuối); rủi ro còn lại là chưa chạy với API thật.


## Review I2 (2026-10-18)

### Phạm vi đã review
- Commit `74b5d3b3` (khoảng `43dbd5c4..HEAD`): commit rỗng, không đổi mã (xác minh bằng `git diff --stat` trống). Chuẩn so sánh: `1-thiet-ke.md` (R6 mục I2 + kịch bản I2 bổ sung 4 bước), báo cáo I2 trong `2-ban-giao-CUOC-THI-v6.md`, bằng chứng `agent-artifacts\CUOC-THI-v6\i2-api-ket-qua.txt` (48 đạt/0 lỗi) và `i2-ui-ket-qua.txt` (28 đạt/0 lỗi).
- Không build, không chạy web, không xem ảnh. Script `i2-api.py`/`i2-ui.py` không nằm trong artifacts nên không đối chiếu được mã script; chỉ tin kết quả txt.

### Phát hiện
Không có lỗi từ mức Trung bình trở lên. Đối chiếu 4 bước kịch bản I2:
1. Hai cuộc ongoing, đề khác nhau: API-07 `[2,1]`, danh sách chọn `?c=2`/`?c=1`, mỗi cuộc 2 lượt, lượt 3 → `409 ATTEMPT_LIMIT` (API và UI, DB đúng 2 dòng/cuộc). Đạt.
2. Đề 10 câu: `total=10`, 9/10 → `INCOMPLETE_ANSWERS`, 10/10 nộp 200, `entry.total_questions=10`, `score` = COUNT(is_correct=1), nút Nộp chỉ hiện ở 10/10. Đạt.
3. `end_at` quá khứ: gia hạn 24 → `submit_only`, API-03/01 `CONTEST_CLOSED`, API-05 200; gia hạn 0 → `closed`, API-05 403. Đạt.
4. Tắt/bật cuộc: API-07 và thanh thông báo cùng đổi; trang Ứng phó và trang chủ không có thanh. Đạt (qua SQLite, xem dưới).
Kịch bản I (bước 1–3, 5–9) đạt theo báo cáo.

### Thấp / lưu ý (không bắt buộc)
- **Thấp**: Script kiểm chứng chưa lưu vào `agent-artifacts` (báo cáo tự nêu), nên không tái chạy được từ bằng chứng. Hướng sửa: lần sau copy script vào artifacts.

### Sai khác tài liệu ↔ code / giới hạn kiểm chứng (đã được Worker tự nêu, hợp lý)
- Tạo/bật/tắt cuộc qua SQLite, không qua backoffice, nên B11 (form quản trị, `CONTEST_HAS_ENTRIES`) chưa kiểm đầu–cuối.
- Kịch bản I bước 4 (đồng hồ đọc với hệ số 1) chưa kiểm; cuộc 2 đặt hệ số 0.
- Luồng ẩn danh trên UI thật (hộp thoại xét giải, ATTEMPT_LIMIT trong hộp thoại) chỉ kiểm bằng API; UI đã kiểm bằng mock ở F9.
- API-07 `Cache-Control: max-age=60`: bật/tắt cuộc có thể chậm tới 60 giây ở trình duyệt/CDN; thanh thông báo ở view không bị ảnh hưởng.

### Cần xác minh (không chặn)
- Duyệt ảnh bằng mắt (FE-29, giao diện hai cuộc, 390px) do chủ quản/phiên xem ảnh riêng làm.
- Thử trong backoffice B11 và hệ số đồng hồ ≠ 0 trước khi phát hành.

### Worker phải sửa
- Không có.

### Cần người dùng xác nhận
- Không có.

### Kết luận
I2 đạt: 48 kiểm API và 28 kiểm giao diện không lỗi, đủ 4 bước kịch bản; không đổi mã. Rủi ro còn lại: B11 qua backoffice, đồng hồ đọc hệ số khác 0 và duyệt hình ảnh chưa kiểm. Có thể chốt gói CUOC-THI-v6 sau khi chủ quản duyệt giao diện.
