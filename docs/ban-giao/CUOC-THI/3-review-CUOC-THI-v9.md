# Review CUOC-THI · luồng v9

## Review K2 · 2026-10-19

### Phạm vi đã review
- Commit `2c6d4084` (commit rỗng, `git show --stat` không có file nào đổi; khoảng `4cc96f15..HEAD` chỉ có commit này) nên **không có mã để review**; đối tượng là kết quả kiểm chứng.
- Chuẩn so sánh: task K2 trong `1-thiet-ke.md` (dòng 780-784), QĐ-024 (contest_id cho phép rỗng; R5), báo cáo `2-ban-giao-CUOC-THI-v9.md` mục K2.
- Bằng chứng đã đọc (văn bản, không xem ảnh): `k2-legacy-db.txt`, `k2-two-contests.txt`, `k2-cross-browser.jsonl`, `k2-db-final.txt` trong `agent-artifacts\CUOC-THI-v9\`. Các file `k2-legacy-api*.txt`, `k2-legacy-quiz.txt`, log web không đọc lại; kết luận mục (1) về HTTP của lượt cũ dựa vào báo cáo của Worker.
- Không build, không chạy web (theo giao việc).

### Phát hiện
Không có lỗi.

Đối chiếu từng tiêu chí:
1. **CSDL cũ**: `k2-legacy-db.txt` có 5 migration đủ (gồm `AddEntryContestAndContestSettings`), `integrity_check` ok, `foreign_key_check` rỗng, 4 lượt cũ `contest_id` NULL còn nguyên. `k2-db-final.txt` sau toàn bộ phiên thử: vẫn ok/rỗng, `(None,4)` giữ nguyên. Hành vi lượt cũ (API-02 `contest:null`, 403 `CONTEST_CLOSED` cho lượt chưa nộp, 409/200 cho lượt đã nộp, không 500, API-01 mới coi lượt cũ không thuộc cuộc nào) khớp quy ước R5/QĐ-024 (B). Đạt.
2. **Đếm lượt hai cuộc**: `k2-two-contests.txt`: cùng số 0955555555, A tối đa 2 (lần 3 → 409 `ATTEMPT_LIMIT`), B tối đa 3 (lần 4 → 409), A lần 4 sau B vẫn 409 của A; số 0911111111 có lượt cũ + 2 lượt A vẫn được đủ 3 lượt ở B; API-02 theo token trả đúng cuộc (`contest.id`, `total` 200/47, `maxAttempts` 2/3); token B hỏi câu ngoài đề → 400 `UNKNOWN_QUESTION`; dạng lỗi đúng `{error:{code,message,fields}}`; `entryCount` 4/6 (hai cuộc) khớp. Đạt.
3. **Trình duyệt khác**: `k2-cross-browser.jsonl` cả 5 môi trường (Chromium, Firefox, WebKit, iPhone 390 cảm ứng, Android 390 cảm ứng) `ok:true`, `js_errors:[]`, không cuộn ngang, `answered` 3 trước/sau tải lại, form đăng ký không hiện lại, nút "Làm tiếp từ câu 4 ›". Worker ghi rõ không thay được máy thật. Đạt.

### Sai khác tài liệu ↔ code
Không có.

### Cần xác minh
- Lượt cũ chưa nộp (`contest_id` NULL) bị 403 `CONTEST_CLOSED`, không làm tiếp được. Đúng thiết kế, nhưng nếu CSDL production có lượt dở dang thì người dùng mất lượt đó. Trước khi triển khai production, kiểm bảng `entry` thật có dòng `contest_id` NULL và `status='in_progress'` hay không (nếu cuộc thi chưa từng mở thì không có ảnh hưởng).
- `resumed_question` rỗng trong JSON: Worker đã ghi nhận, không thuộc tiêu chí; không tính lỗi.

### Đề xuất (không bắt buộc)
- Khi nâng cấp production: sao lưu `app.sqlite.db` trước (cảnh báo EF `PRAGMA foreign_keys = 0` trong transaction, như Worker nêu).
- Bằng chứng mục (3) chưa gồm nộp bài và chế độ riêng tư Safari thật (dự phòng bộ nhớ); nếu cần chắc, thử trên máy thật trước khi mở cuộc thi.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
K2 đạt cả 3 mục, không còn lỗi, không việc bắt buộc. Rủi ro còn lại: giới hạn giả lập (không phải máy thật) và lượt cũ dở dang ở production (xem "Cần xác minh").
