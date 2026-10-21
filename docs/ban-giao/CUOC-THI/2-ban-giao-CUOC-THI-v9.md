# Bàn giao CUOC-THI · luồng v9

## K2 · 2026-10-19 · Kiểm 3 mục còn lại của K1

**Kết luận: đạt cả 3 mục, không phát hiện lỗi, không sửa mã.** Mục review `3-review-CUOC-THI-v9.md` chưa tồn tại nên không có việc sửa kèm. Commit: chỉ commit rỗng đánh dấu K2 (không có thay đổi mã để commit); worktree sạch sau đó.

Bằng chứng ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v9\` (tôi không mở lại ảnh, chỉ đọc kết quả bằng văn bản): `k2-legacy-db.txt`, `k2-legacy-api.txt`, `k2-legacy-api2.txt`, `k2-legacy-quiz.txt`, `k2-legacy-before.sqlite.db` (CSDL cũ trước migration), `k2-two-contests.txt`, `k2-cross-browser.jsonl`, `k2-db-final.txt`, ảnh `k2-xb-<trình duyệt>-{1-dang-lam,2-sau-tai-lai,3-tiep-tuc}.png`, `k2-bo-list.png`, `web-old.log`, `web-new.log`.

### (1) CSDL cũ có dữ liệu
- **Dựng CSDL cũ**: worktree tạm `C:\GTSC\DMST\wt\_k2-old` tại `f89eb861` (commit ngay trước B5 `6d726116`; migration cuối `AddContestCampaigns`). `.\run-local.ps1 -NoRun` (0 lỗi), chạy `dotnet run --no-build --urls http://localhost:11002`, sinh `app.sqlite.db` (200 câu, bảng `contest` rỗng). API-01 bản cũ trả 403 `CONTEST_CLOSED` (thiPage chưa có thời gian) nên **chèn lượt cũ bằng SQL** (python sqlite3): 4 `entry` (2 `named` cùng số 0911111111, một đã `submitted` điểm 2/3; một `named` số 0922222222; một `anonymous`) kèm 4 `entry_answer`. Dừng web cũ theo PID, sao chép file `.db` (không dùng CSDL của người dùng) sang worktree v9, chạy `.\run-local.ps1 -Reset -NoRun` trước đó để Umbraco sạch rồi đặt file vào `App_Data`.
- **Chạy bản v9 trên file đó**: migration `20261018081328_AddEntryContestAndContestSettings` áp dụng được (có WRN của EF: `PRAGMA foreign_keys = 0` không chạy trong transaction, nên nếu tiến trình chết giữa chừng thì phải sửa tay; đã chạy xong bình thường). `__EFMigrationsHistory` đủ 5 mục; `PRAGMA integrity_check` = ok; `foreign_key_check` rỗng (cả sau toàn bộ phiên thử); 4 lượt cũ giữ nguyên, `contest_id` NULL; `contest` có 1 cuộc mẫu nạp sau (id 1), `entryCount` của nó không tính lượt cũ. Log web không có `[ERR]` (5 dòng `unable to open database file` ở lần chạy đầu như đã biết).
- **Hành vi lượt cũ (HTTP)**: API-02 trả 200 cho cả 4 token, `contest:null`, `topics:[]`, `maxAttempts` 2 (mặc định), `total` = 200 (cả ngân hàng) hoặc `TotalQuestions` đã lưu (lượt đã nộp: 3), `phoneMasked` đúng. Token lạ 401. Lượt đã nộp: API-03 409 `ALREADY_SUBMITTED`, API-05 nộp lại 200 cùng điểm. Lượt chưa nộp chưa thuộc cuộc nào: API-03/04 và API-05 trả **403 `CONTEST_CLOSED`** ("Cuộc thi chưa mở hoặc đã kết thúc" / "đã hết hạn nộp bài") — đúng quy ước trong mã (`ContestAttemptService`: "luot cu khong cuoc: contest null, coi nhu closed (R5)"). Không có lỗi 500. QUIZ-01/02/sample (`/quiz/topics`, `/quiz/topics/1/questions`, `/quiz/sample`) 200. API-07 200. API-01 mới cho số 0911111111 (đã có 2 lượt cũ): 201 attemptNo 1, 2 rồi 409 `ATTEMPT_LIMIT`, tức **lượt cũ không tính vào cuộc nào** (người dùng cũ được thi đủ lượt ở cuộc mới).

### (2) Đếm lượt giữa hai cuộc (HTTP)
Tạo cuộc B qua API quản trị `POST /api/v1/admin/contest/campaigns` (3 lượt, chuyên đề 1 và 3, 47 câu; gọi bằng cookie đăng nhập backoffice + header `Authorization: Bearer [redacted]`, đúng cách giao diện backoffice gọi; không qua form). Số 0955555555: cuộc A (max 2) lượt 1, 2 → 201, lượt 3 → 409 `ATTEMPT_LIMIT` ("đã dùng hết 2 lượt"); cuộc B (max 3) lượt 1, 2, 3 → 201 (attemptNo 1..3, `maxAttempts` 3), lượt 4 → 409 ("hết 3 lượt"); A lượt 4 sau khi B đã dùng → vẫn 409 của A. Số 0911111111 (2 cũ + 2 ở A) ở B: 3 lượt rồi 409. API-02 token A1 → `contest.id` 1, `total` 200, `maxAttempts` 2; token B1 → `contest.id` 2, `total` 47, `maxAttempts` 3. Token B trả lời câu CĐ2 (ngoài đề B) → 400 `UNKNOWN_QUESTION`; token B câu CĐ1 → 200. Token A câu CĐ2 chưa xong CĐ1 → 409 `TOPIC_LOCKED`. API-07 liệt kê cả hai cuộc `ongoing` đúng số câu, chuyên đề. Quản trị: `entryCount` cuộc A/B đúng.
- Sau đó đặt `readTimerFactor` cuộc B = 0 qua `PUT campaigns/2` (giữ nguyên bộ đề; được vì không đổi đề) để chạy trình duyệt nhanh.

### (3) Trình duyệt khác (Playwright 1.63, Python)
Luồng: mở `/cuoc-thi/lam-bai/?c=2`, điền họ tên/số/đồng ý, đăng ký → vào danh sách chuyên đề → Chuyên đề 1 → bắt đầu → chọn đáp án và bấm "tiếp" 3 câu → tải lại trang → danh sách chuyên đề vào chuyên đề 1 → nút "Làm tiếp từ câu 4 ›" → tiếp tục vào màn câu hỏi. Kết quả mỗi môi trường: đăng ký 201, máy chủ `answered` = 3 trước và sau khi tải lại, form đăng ký không hiện lại, "Đã trả lời 3 / 47 câu", không lỗi JS/console, không cuộn ngang (`scrollWidth ≤ innerWidth`) ở màn đăng ký và màn làm bài.
| Môi trường | Kết quả |
|---|---|
| Chromium 1280px | đạt |
| Firefox 155 (1280px) | đạt |
| WebKit (Safari engine, 1280px) | đạt |
| WebKit giả lập iPhone 13 UA, 390px, cảm ứng (`tap`) | đạt |
| Chromium giả lập Pixel 7 UA (Android 14), 390x844, cảm ứng | đạt |
Phải chạy `playwright install firefox webkit` để có bản trình duyệt khớp phiên bản Playwright (tải thêm về máy, không ảnh hưởng repo).

### Chưa kiểm được / giới hạn
- **Không thay được máy thật**: giả lập chỉ đổi UA, viewport, cảm ứng; không có bàn phím ảo, thanh địa chỉ co giãn, chế độ tiết kiệm bộ nhớ, `localStorage` bị chặn ở chế độ riêng tư của Safari thật (mã có dự phòng trong bộ nhớ, ở K2 chưa thử). Chỉ thử một chuyên đề đến câu 3, chưa nộp bài trên từng trình duyệt.
- Cuộc B tạo qua API quản trị, không qua form backoffice (form đã kiểm ở K1). `resumed_question` trong JSON để trống (ô `#qprog` không có chữ lúc đọc); không dùng làm tiêu chí, tiêu chí là "Làm tiếp từ câu 4" và `answered` 3.
- Lượt cũ chèn bằng SQL chứ không qua API-01 bản cũ (đóng do thiPage); cấu trúc cột khớp mã bản cũ.

### Giả định / sai khác so với thiết kế
- "Backoffice/API quản trị" ở mục 2 hiểu là API quản trị (có bằng chứng ở trên). Lượt cũ chưa nộp bị 403 `CONTEST_CLOSED` không còn làm tiếp được: đúng mã hiện tại nhưng là hệ quả cho người dùng thật nếu CSDL production có lượt dở dang; nên Orchestrator cân nhắc (ngoài phạm vi K2, không sửa).
- Cảnh báo EF về `PRAGMA foreign_keys = 0` trong migration (nằm trong transaction) là rủi ro khi áp dụng trên CSDL production: nên sao lưu `app.sqlite.db` trước khi nâng cấp.

### Môi trường
Web 11002 đã dừng bằng PID của chính tôi (201104 bản cũ, 198116 bản v9); worktree tạm `_k2-old` đã gỡ; 5 view uSync bị ghi lại BOM đã hoàn bằng `git checkout`. CSDL local của luồng giờ chứa lượt thử (4 lượt cũ, cuộc B, ~20 lượt).
