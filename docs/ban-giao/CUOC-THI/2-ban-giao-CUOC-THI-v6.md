# Bàn giao luồng CUOC-THI-v6

## F9 · Nộp bài, kết quả theo cuộc (2026-10-18)

Commit trên `lane/CUOC-THI-v6` (xem `git log`). Chưa có `3-review-CUOC-THI-v6.md`, nên không có mục review nào phải sửa kèm.

### Đã làm
- `submit.js` (mới): thanh nộp bài, hộp thoại, màn kết quả.
  - **Thanh nộp bài** ở đầu danh sách chuyên đề và màn "Xong chuyên đề". Chưa đủ câu: "Đã trả lời x / N câu. Trả lời hết các câu để nộp bài." (x, N tính từ `topics` của API-02 theo đề của cuộc, không viết cứng). Đủ câu (kể cả đáp án còn trong hàng đợi): hiện nút "Nộp bài dự thi". Hết hạn nộp (API-02 `phase = closed`, lượt không có cuộc, hoặc vừa nhận `CONTEST_CLOSED`): báo hết hạn, ẩn nút; `submit_only` vẫn có nút.
  - **Hộp thoại** `<dialog id="sdlg">` trong `_LuongThi.cshtml` (`showModal`, Esc đóng, "Làm tiếp"/"Đóng", trả focus về nút đã mở, khóa nút và hiện "Đang nộp…" khi gửi). Có tên: chỉ xác nhận. Ẩn danh: ô tick "Tôi muốn tham gia xét giải"; không tick thì hiện "Bài ẩn danh không được xét giải."; tick thì hiện họ tên, số điện thoại, đơn vị (không bắt buộc) và ô đồng ý, nộp kèm `contact`.
  - **Nút "Dự thi có tên để xét giải"** ở cột bên cho lượt ẩn danh chưa nộp (API-04), cùng hộp thoại; sau khi gắn, đọc lại API-02 để cột bên đổi sang "Thí sinh".
  - **Màn kết quả** `#ket-qua`: nhãn "Đã nộp bài", "Bạn trả lời đúng y trên N câu", tên cuộc thi, mã dự thi, giờ nộp (giờ VN), hộp xanh "được đưa vào danh sách xét giải" hoặc hộp xám "Bài ẩn danh, không xét giải", bảng điểm theo chuyên đề (tiêu đề lấy từ QUIZ-01), nút "Xem lại ngân hàng câu hỏi" (vào luyện tập, cột bên có "Về kết quả lượt thi") và "Thi lượt thứ n+1" (chỉ khi đã có tên, còn lượt, cuộc còn `open`). Mở lại trang (kể cả hash `#ngan-hang`) luôn ra màn kết quả khi lượt đã nộp; kết quả lấy lại bằng API-05 (máy chủ trả lại kết quả đã lưu).
  - Xử lý lỗi: `VALIDATION` về đúng ô; `ATTEMPT_LIMIT` "Số … đã dùng hết n lượt thi của cuộc thi này. Bạn vẫn có thể nộp ẩn danh." giữ hộp thoại; lỗi mạng/máy chủ/`RATE_LIMITED` giữ hộp thoại để thử lại; còn đáp án chưa gửi → "Đang lưu đáp án…", không gọi API-05; `INCOMPLETE_ANSWERS` → đóng hộp thoại, đọc lại API-02, hiện `message` của máy chủ ở danh sách và trả focus về tiêu đề; `CONTEST_CLOSED` → đóng hộp thoại, ẩn nút; `ALREADY_NAMED` coi như đã gắn.
- `exam.js`: gắn các phần trên, thêm view `result`, xử lý khởi động/đổi lượt khi lượt đã nộp. `phone.js`: thêm `checkContact` + các câu thông báo dùng chung; `register.js` dùng lại (hành vi cũ giữ nguyên). `contest.css`: `.submitbar`, `.restable`, `.sdlg` (mobile ≤480px: hộp thoại toàn màn hình, nút xếp dọc, "Nộp bài" ở trên).

### Kiểm chứng (thật)
- `.\run-local.ps1 -NoRun`: 0 lỗi build (70 cảnh báo cũ). `dotnet run --no-build --urls http://localhost:11002` → `/cuoc-thi/lam-bai/` 200. `node --input-type=module --check` cho `exam.js`, `submit.js`, `phone.js`, `register.js`: đạt.
- Playwright + Edge, đồng hồ giả, mock localhost (`?mock=small&c=5`, đề 2 chuyên đề, 52 câu; nạp sẵn đáp án vào "máy chủ giả" trừ câu cuối rồi làm câu cuối bằng giao diện): `python -I -X utf8 C:\GTSC\DMST\agent-artifacts\CUOC-THI-v6\f9-kiem-chung.py > f9-ket-qua.txt` → **76 đạt, 0 lỗi** (`f9-ket-qua.txt`). Gồm: thiếu 1 câu không có nút, đủ thì có (cả ở danh sách và màn Xong); hộp thoại giữ focus (Tab/Shift+Tab 20 lần không ra khỏi hộp), Esc, "Làm tiếp", trả focus; bấm "Nộp bài" hai lần liên tiếp → API-05 chỉ 1 lần; kết quả (tổng bảng = điểm = "y trên 52", tên cuộc, mã, giờ nộp); tải lại và mở `#ngan-hang` vẫn ra kết quả; sau nộp không gửi thêm API-03; ẩn danh: tick/không tick, để trống/sai số/thiếu đồng ý, `ATTEMPT_LIMIT` (hai lượt giả cùng số) rồi bỏ tick nộp ẩn danh; API-04 từ cột bên, mã dự thi không đổi; lỗi mạng rồi thử lại; `CONTEST_CLOSED`; `INCOMPLETE_ANSWERS`; đáp án còn trong hàng đợi (offline) → không gọi API-05; `submit_only` đủ câu nộp được, thiếu câu không có nút; 390px (hộp thoại toàn chiều rộng, nút xếp dọc, không tràn ngang), 744px không tràn ngang; luyện tập không có thanh nộp bài; Grep `200` trong `submit.js`: 0.
- Ảnh/kết quả ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v6\`: `f9-kiem-chung.py`, `f9-ket-qua.txt`, `f9-a-xong-nut-1440.png`, `f9-a-hop-thoai-1440.png`, `f9-a-ket-qua-1440.png`, `f9-b-attempt-limit-1440.png`, `f9-d-incomplete-1440.png`, `f9-f-nut-390.png`, `f9-f-hop-thoai-390.png`, `f9-f-ket-qua-390.png`, `f9-g-ket-qua-744.png`, `web.log`.
- Dừng web bằng PID 100440 (qua cổng 11002). Hoàn lại 5 view (`home`, `thamGiaPage`, `thiPage`, `thiThuPage`, `ungPhoPage`) bị uSync ghi đổi khi chạy web (không thuộc F9).

### Chưa kiểm được
- Không mở được ảnh chụp (đọc ảnh ngoài worktree bị từ chối quyền): bố cục chỉ kiểm bằng số đo (không tràn ngang, độ rộng hộp thoại, thứ tự nút), không kiểm bằng mắt, kể cả màn kết quả và bảng điểm. Giao diện FE-29 vẫn cần chủ quản duyệt.
- Chưa chạy với API thật (API-05 thật: `403/409`, kết quả `byTopic`, `ATTEMPT_LIMIT` khi kèm `contact`): mọi kiểm chứng dùng mock; việc này thuộc I2. Nút "Thi lượt thứ n+1" chưa thử nhiều cuộc cùng lúc không có `?c=`.
- Chưa thử mất mạng thật giữa lúc bấm nộp (chỉ giả lập bằng `?mock=network` và `offline`).

### Giả định / sai khác so với thiết kế
- Nút Nộp bài chỉ hiện khi đủ câu (CXN-3/QĐ-015), nên hộp thoại không có hộp hồng "Còn z câu chưa làm…"; thay vào đó câu tóm tắt luôn kèm "Nộp rồi thì không làm tiếp được trong lượt này."
- Lượt không có cuộc (`contest: null`) coi là hết hạn nộp (khớp `ContestAttemptService.SubmitAsync` và R5); tên cuộc trong kết quả lấy từ API-02 (`contest.name`), vì API-05 không trả tên.
- Gom thông báo `INCOMPLETE_ANSWERS` ở thanh nộp bài; thông báo bị bỏ khi số câu đã trả lời đổi.
- "Thi lượt thứ n+1" dẫn tới `#dang-ky` trong cùng trang; nếu URL không có `?c=` và có nhiều cuộc đang diễn ra thì trang đăng ký hiện danh sách chọn cuộc.
- Câu "đồng ý" rút gọn trong hộp thoại do Worker viết (chưa có bản duyệt): "…@operatorName giữ họ tên, số điện thoại và đơn vị chỉ để chấm bài, đếm lượt thi và liên hệ trao giải…", kèm ô đồng ý như ở bước đăng ký.
- Chuyển sang luyện tập từ màn kết quả đặt lại bộ nhớ chuyên đề/câu hỏi để dùng cả ngân hàng, không theo đề của cuộc.
- Không sửa mock (`contest-api.js`): "đề nhỏ" thử bằng `?mock=small&c=5` cộng nạp sẵn đáp án vào `at_mock` trong script.

## F9 · sửa sau review (vòng 1) — 2026-10-18

- **[Trung bình] Nút "Dự thi có tên" ở `submit_only`: đã sửa** trong `wwwroot/assets/js/contest/submit.js`:
  - `attachButtonHtml` chỉ hiện khi `state.contest.phase === 'open'` (và chưa hết hạn nộp).
  - `handleError` case `CONTEST_CLOSED`: nếu `kind === 'attach'` thì chỉ đóng hộp thoại và đọc lại API-02 (`deps.onAttached`), không đặt `expired`, nên nút Nộp bài không bị khóa; API-04/`submit` giữ nguyên hành vi cũ.
- **Bằng chứng**: thêm ca E2 (mock `submit_only` + lượt ẩn danh: không có nút gắn tên, vẫn có nút Nộp bài, nộp ra màn kết quả) và E3 (đang ở pha open có nút, sang `submit_only` thì nút gắn tên mất, nút Nộp bài còn) vào `agent-artifacts/CUOC-THI-v6/f9-kiem-chung.py`. Chạy lại trên web cổng 11002: **81 đạt, 0 lỗi** (`f9-ket-qua.txt`). E3 mô phỏng bằng tải lại với `?mock=submitonly`, chưa mô phỏng đúng lỗi 403 từ API-04 giữa lúc gửi.
- Không sửa: phát hiện [Thấp] về câu "đồng ý" (review ghi không cần sửa, chờ duyệt câu chữ).
- Chưa kiểm: API thật (thuộc I2). Web đã dừng bằng PID của mình.

## I2 · Tích hợp đầu–cuối (2026-10-18)

Luồng `CUOC-THI-v6`, nhánh `lane/CUOC-THI-v6` (đã chứa B5–B13, F6–F9, S1 vì `dev` đã ghép). Review F9 vòng 2 đạt, không có mục nào Worker phải sửa kèm. I2 không sửa mã: chỉ chạy kịch bản và ghi kết quả; commit là commit rỗng (`--allow-empty`) để đánh dấu mốc, worktree sạch.

### Lệnh đã chạy
- `.\run-local.ps1 -Reset -NoRun`: build 0 lỗi (70 cảnh báo cũ). `dotnet run --no-build --urls http://localhost:11002` (CSDL mới, cuộc mẫu B13 tự nạp). `/cuoc-thi/lam-bai/` 200; `GET /api/v1/contests` trả cuộc mẫu (200 câu, 8 chuyên đề).
- Script API thật (không mock): `python -I -X utf8 i2-api.py` → `agent-artifacts\CUOC-THI-v6\i2-api-ket-qua.txt`: **48 đạt, 0 lỗi** (lần đầu gặp 1 lỗi do script gửi `mode:"anonymous"` thay vì `"anon"`; đã sửa script, không phải lỗi sản phẩm; lần chạy cuối trên CSDL đã xóa lượt/cuộc phụ).
- Script giao diện thật (Playwright + Edge, đồng hồ thật, không `?mock`): `python -I -X utf8 i2-ui.py` → `i2-ui-ket-qua.txt`: **28 đạt, 0 lỗi** (hai lần chạy trước có lỗi do câu kiểm sai của script: chữ "Đã trả lời 3 / 10", "Bạn đã trả lời hết 10 câu", và thanh thông báo chỉ có ở trang `/cuoc-thi/*`; đã sửa câu kiểm).
- Hai script nằm ở scratchpad của phiên (`...\scratchpad\i2-api.py`, `i2-ui.py`); chưa copy vào `agent-artifacts` (công cụ Write bị từ chối quyền ghi ở đó, chỉ chuyển hướng kết quả bằng shell được). Cần thì chạy lại từ nội dung mô tả bên dưới.
- Ảnh trong `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v6\`: `i2-u1-cuoc-thi-1440.png`, `i2-u2-chon-cuoc-1440.png`, `i2-u3-danh-sach-1440.png`, `i2-u3-sau-tai-lai-1440.png`, `i2-u3-du-cau-1440.png`, `i2-u3-hop-thoai-1440.png`, `i2-u3-ket-qua-1440.png`, `i2-u4-limit-cuoc1-1440.png`, `i2-u4-limit-cuoc2-1440.png`, `i2-u6-lam-bai-390.png`; log web `i2-web.log`, `i2-web.err`. Tôi chưa xem ảnh bằng mắt.
- Dừng web bằng PID 105924 (qua cổng 11002). Hoàn lại 5 view bị uSync ghi đổi khi chạy web.

### Kết quả theo kịch bản
Cách tạo cuộc: cuộc mẫu B13 (cuộc 1) và các cuộc thêm (2–7) **chèn thẳng vào SQLite** bằng script, không qua backoffice (xem "Sai khác").

**Kịch bản I2 (4 bước)**
1. Hai cuộc cùng `ongoing`, đề khác nhau (cuộc 1: 200 câu; cuộc 2: chuyên đề 5 và 7, 5 câu mỗi chuyên đề = 10 câu): API-07 trả cả hai, `questionCount` 200/10. Trang làm bài không `?c` hiện danh sách chọn với liên kết `?c=2`, `?c=1`. Đăng ký cùng số ở cả hai cuộc, mỗi cuộc 2 lượt (`attemptNo` 1, 2; `contestId` đúng); lượt 3 ở mỗi cuộc → `409 ATTEMPT_LIMIT` "Số … đã dùng hết 2 lượt của cuộc thi này." (API và giao diện, DB: mỗi cuộc đúng 2 dòng `entry` cho số đó).
2. Đề nhỏ 10 câu: API-02 `total = 10`, `topics` 5 và 7. Câu ngoài đề → `400 UNKNOWN_QUESTION`. 9/10 → `409 INCOMPLETE_ANSWERS` "Bạn mới trả lời 9/10 câu…"; 10/10 → nộp `200`, `total = 10`, `byTopic` 2 chuyên đề; DB `entry.total_questions = 10`, `score` = `COUNT(is_correct=1)`; nộp lại trả kết quả cũ; trả lời sau nộp → `409 ALREADY_SUBMITTED`. Giao diện thật: làm tay 10 câu (kể cả tải lại giữa chừng và offline), nút "Nộp bài" chỉ hiện khi đủ, hộp thoại, màn kết quả "trên 10 câu" ghi tên cuộc, khớp DB, tải lại vẫn ra kết quả, console không lỗi.
3. Đặt `end_at` về quá khứ: gia hạn 24 → API-02 `phase = submit_only`, API-03 và API-01 `403 CONTEST_CLOSED`, API-05 vẫn `200`; gia hạn 0 → `phase = closed`, API-05 `403`. Ẩn danh ở `submit_only`: API-04 `403 CONTEST_CLOSED`, nộp ẩn danh vẫn `200` (khớp sửa review F9).
4. Tắt cả hai cuộc trong DB → thanh thông báo ở `/cuoc-thi/` biến mất; bật lại → hiện lại. API-07 bỏ cuộc tắt ngay (trước đó API-01 cuộc tắt → `404 CONTEST_NOT_FOUND`). Thanh in "Cuộc thi đang diễn ra · <tên> · 17/10/2026 – 17/11/2026", lấy cuộc bắt đầu muộn nhất khi nhiều cuộc, liên kết `?c=<id>`, vẫn thấy khi tắt JavaScript. Trang Ứng phó và trang chủ không có thanh (chỉ `thiPage`/`cuocThiLamBaiPage` dùng `_ContestHeader`).

**Kịch bản I (đã làm được)**
- Bước 1–3: đăng ký có tên → danh sách 2 chuyên đề; khóa chuyên đề sau (vào thẳng `#chuyen-de-7` khi chưa xong CĐ5 không ra câu hỏi, QĐ-025); 3 câu CĐ5 → DB đúng 3 dòng `entry_answer`; tải lại → "Đã trả lời 3 / 10 câu"; offline trả lời 2 câu → DB vẫn 3 dòng, bật mạng → 5 dòng, 5 mã khác nhau, không trùng.
- Bước 5: nộp có tên → kết quả; tải lại → vẫn kết quả; trả lời sau nộp bị chặn (API). 
- Bước 6 (API): ẩn danh gắn tên với số mới → `named`, `attemptNo = 1`; gắn lần nữa → `409 ALREADY_NAMED`; số đủ 2 lượt → API-04 và API-05 kèm `contact` đều `409 ATTEMPT_LIMIT`, nộp ẩn danh không contact `200`.
- Bước 7 (API, không phải hai tab trình duyệt): hai lần ghi cùng câu khác đáp án → 1 dòng, lần đầu thắng, lần sau `stored:false`.
- Bước 8: `/thu-suc/`, `/thi-thu/` chỉ gọi `GET /api/v1/quiz/sample`, không có yêu cầu `/api/v1/contest/`.
- Bước 9: 1440 (ảnh) và 390 (không tràn ngang, đo bằng `scrollWidth`).

### Chưa kiểm được
- Chưa xem ảnh bằng mắt (cần chủ quản duyệt FE-29 và giao diện hai cuộc); 744px không chụp trong I2 (đã đo ở F9).
- Chưa kiểm bước 4 của kịch bản I đúng nguyên văn (đặt hệ số trong backoffice cho cuộc 1 rồi làm hết CĐ1 của cuộc 200 câu): cuộc 2 đặt `read_timer_factor = 0` bằng SQLite, nên đồng hồ đọc không bị thử với hệ số 1.
- Chưa thao tác qua backoffice (tạo/bật/tắt cuộc, form B11) vì API quản trị cần đăng nhập backoffice; mọi thay đổi cuộc đi qua SQLite. Do đó chưa kiểm B11 từ giao diện quản trị, cũng chưa kiểm ràng buộc `CONTEST_HAS_ENTRIES`.
- Luồng ẩn danh trên giao diện thật (tick xét giải trong hộp thoại, `ATTEMPT_LIMIT` trong hộp thoại, nút "Dự thi có tên" ở cột bên) chỉ kiểm bằng API thật; giao diện của luồng này đã kiểm ở F9 bằng mock.
- Hai tab trình duyệt trả lời cùng câu: chỉ kiểm ở API. "Thi lượt thứ n+1" khi nhiều cuộc không `?c`: chưa bấm.
- Cache: API-07 trả `Cache-Control: public, max-age=60`, nên bật/tắt cuộc có thể chậm tới 60 giây ở trình duyệt/CDN; thử bằng `Invoke-RestMethod`/Python không đi qua cache nên thấy đổi ngay.
- `uSync` nhập `cuocThiLamBaiPage` khi `-Reset` (nhắc ở review B5): trang `/cuoc-thi/lam-bai/` 200 sau `-Reset`, đạt. `dotnet test` không chạy lại trong I2 (không đổi mã).

### Giả định / sai khác so với thiết kế
- Tạo cuộc 2–7 bằng SQLite thay vì "cuộc tạo thêm trong backoffice" (kịch bản I2); các cuộc phụ 3–7 được tắt (`is_active = 0`) sau khi thử, cuộc 1–2 còn bật trong CSDL local của luồng.
- Kịch bản I bước 4 đổi thành đặt hệ số ở cuộc 2 bằng SQLite (hệ số 0) vì hệ số nay nằm ở cuộc, không ở `thiPage`.
- Không phát hiện lỗi sản phẩm nào trong I2; không có thay đổi mã.
