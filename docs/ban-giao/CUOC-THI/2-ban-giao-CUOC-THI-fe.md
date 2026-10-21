# CUOC-THI · Bàn giao luồng CUOC-THI-fe

## F2 · FE-23 Bộ thành phần trắc nghiệm dùng chung (2026-10-17)

Worker, nhánh `lane/CUOC-THI-fe`. Chỉ làm F2; F1, F3–F5 chưa làm (F1 chờ CXN-1).

### File
- `wwwroot/assets/js/quiz/quiz-ui.js` (mới): ES module, hàm trả chuỗi HTML, mọi dữ liệu qua `esc()` (thoát `& < > " '`). Xuất: `esc`, `eyebrowHtml`, `progressHtml`, `situationHtml`, `questionHtml`, `optionsHtml`, `resultHtml`, `navButtonHtml`, `dotsHtml`, `rowHtml`, `focusResult`, `focusQuestion`, hằng `ID_QUESTION='qq'`, `ID_RESULT='qhead'`.
- `wwwroot/assets/css/quiz.css` (mới): class như bản dựng (`.qopt .right .wrong .dim .qexp .qbar .qdot .qrow .qnav .qmark .qin`) cộng `.qopts--duo`, `.qsit`, `.qsafe`, `.qresult`, `.qlive`.
- `wwwroot/assets/css/tokens.css`: thêm `--c-disabled: #E7DCDB` (màu nút khóa).
- Chưa nối vào `thiPage.cshtml` (thuộc F3): trang dùng cần `<link>` tới `quiz.css` và `import` từ `js/quiz/quiz-ui.js`.

### Cách dùng (cho F3/F4/FE-24)
- Dữ liệu câu: `{ q, opt: [[chữ cái, nội dung]…], ans, exp: {chữ cái: giải thích}, sit, safe }` (DTO QUIZ-02).
- Sau khi gán `innerHTML` có `resultHtml(q, chosen)` thì gọi `focusResult(root)` để đưa focus tới dòng "Đúng./Chưa đúng." Vùng `aria-live="polite"` (`.qlive`) luôn có mặt, kể cả khi chưa chọn.
- Thanh tiến độ dùng thẻ `<progress class="qbar">` (không cần `style` để đặt độ rộng).
- Câu 2 đáp án tự thêm `.qopts--duo`: hai nút nằm ngang, xuống dòng khi hẹp.

### Kiểm chứng (đã chạy thật)
- Trang thử tĩnh (ngoài repo, thư mục scratchpad) nạp `quiz-ui.js` + `quiz.css` + `tokens/base/components.css`, chạy bằng `python -m http.server`, chụp bằng Edge headless. **Không chạy `run-local`/web Umbraco** vì F2 chưa đụng view hay C#; không có tiến trình nào còn chạy (cổng thử 8765 đã dừng, kiểm bằng netstat).
- Chuỗi chứa `<script>`, `<b>`, `<img onerror>`, `&`, `"` hiển thị nguyên văn; đếm DOM: 0 thẻ `script`, 0 thẻ `img` được tạo ra.
- Câu 4 đáp án (chọn sai) và câu 2 đáp án (Đúng–Sai) ở 900px: khớp bố cục `tt-02` (đáp án phù hợp xanh + "Đáp án phù hợp", đáp án chọn đỏ + "Bạn chọn", đáp án còn lại mờ, giải thích, hộp "Hành động an toàn", nút Câu trước/Câu tiếp). Ô số có chấm xanh/đỏ, ô hiện tại nền đỏ sẫm như `tt-03`.
- 390px (iframe 390 rộng): nhãn "Đáp án phù hợp/Bạn chọn" xuống dòng dưới nội dung, không tràn ngang.
- Focus: sau `focusResult`, `document.activeElement.id === 'qhead'`.
- `grep 'style='` trong `quiz-ui.js` = 0; không có `style="..."` trong CSS/JS của F2; màu/cỡ chữ dùng biến tokens (còn vài `rem` lẻ như 0.84375, 0.96875 để khớp px của bản dựng).

### Giới hạn / chưa kiểm
- Chưa xem trong trang Umbraco thật (chưa có chỗ nối). Orchestrator so ảnh `tt-01..03` ở 1440px và 390px sau khi F3 nối vào.
- Thanh `<progress>` không có hiệu ứng chuyển động ở Firefox (chỉ WebKit/Blink có `transition`); chấp nhận.
- Chưa dựng khối "Kết quả/tổng kết" (`qsum`, "Đúng x/N") vì thuộc FE-24/FE-29; đã có `rowHtml` và `dotsHtml` để dùng.
- Không có project test (theo CLAUDE.md), nên kiểm chứng là thủ công như trên.

### Câu hỏi bị chặn
Không.

## F1 · FE-28 contest-api.js + contest-store.js + mock + hàng đợi (2026-10-17)

Worker, nhánh `lane/CUOC-THI-fe`. Chỉ làm F1. Áp dụng QĐ-013 (`cd` trong từng đáp án API-02), QĐ-014 (API-03/04 chỉ khi mở; API-05 quá hạn `403 CONTEST_CLOSED`), QĐ-015 (phải đủ câu mới nộp; mã lỗi `INCOMPLETE_ANSWERS` lấy theo `1-thiet-ke.md`, không phải giả định).

### File
- `wwwroot/assets/js/contest/contest-api.js` (mở rộng, giữ nguyên `createEntry`, `readError`, `saveEntry`, `loadEntry`, `markPractice`): thêm `getMe` (API-02), `saveAnswer(q, a)` (API-03), `attachContact(contact)` (API-04), `submitEntry(contact?)` (API-05), `fetchTopics` (QUIZ-01), `fetchQuestions(cd)` (QUIZ-02, cache trong bộ nhớ). Hàm `/me` tự lấy token từ `at_entry`; không có token thì trả `INVALID_TOKEN` mà không gọi mạng. Có timeout 15s (quá hạn coi là `NETWORK`). Thân lỗi không chuẩn thì suy từ mã HTTP: 401 → `INVALID_TOKEN`, 429 → `RATE_LIMITED`, 5xx → `SERVER`.
- `wwwroot/assets/js/contest/contest-store.js` (mới): trạng thái và hàng đợi.
- Không sửa file nào khác.

### Store (`contest-store.js`)
- `init()` → `{ view: 'exam' | 'register', practice, offline?, submitted?, error? }`. Có `at_entry` thì gọi API-02 và dựng lại `state.answers` từ máy chủ (máy chủ là nguồn đúng), `total` lấy từ API-02. `INVALID_TOKEN` → xóa `at_entry` + `at_queue`, trả `register`. Lỗi mạng/máy chủ → vẫn `exam` với `offline: true`, tiến độ lấy từ hàng đợi, tự thử gửi lại. Không có `at_entry` → `register` (kèm `practice: true` nếu có `at_practice`; F3 quyết định màn).
- `answer(q, a, cd, correct)` → `{ ok, a, correct, stored, pending }` hoặc `{ ok:false, code }` (câu bị bỏ khỏi hàng đợi). Một câu chỉ gửi một lần (đã có trong state thì trả đáp án đang giữ, `stored:false`). `stored=false` từ máy chủ thì `a`, `correct` là của máy chủ. `pending:true` = chưa lên máy chủ.
- Hàng đợi `at_queue` (localStorage), mỗi mục `{ entry, q, a, cd, correct }` kèm mã dự thi. Gửi tuần tự, một luồng tại một thời điểm. Lỗi mạng / `5xx` / `429` / lỗi lạ → giữ, thử lại sau 2s, 5s, 15s rồi giữ 15s; sự kiện `online` gửi ngay. `401` → xóa phiên. `409 ALREADY_SUBMITTED` → bỏ cả hàng đợi, `state.status='submitted'`, phát `submitted`. `403 CONTEST_CLOSED`, `400 UNKNOWN_QUESTION`/`INVALID_OPTION` → bỏ mục và đáp án cục bộ, phát `dropped {q, code}`. Mục của lượt khác bị bỏ khi `init()` và khi gửi.
- `attachContact(contact)`, `submit(contact?)` bọc API-04/05 và đồng bộ `at_entry` (`mode`, `attemptNo`). `submit` gửi hết hàng đợi trước; còn mục thì không gọi API-05, trả `error.code = 'QUEUE_PENDING'`.
- Tiến độ: `topicProgress(topics)`, `answeredCount()`, `allDone(topics)` (đáp án đang chờ gửi tính là đã trả lời, theo F5), `getAnswer(q)`, `pendingCount()`. Sự kiện: `on('change'|'token'|'submitted'|'dropped', fn)`.
- Luyện tập: `enterPractice()`, `leavePractice()`, `resetPractice(cd?)`; khi `state.practice` thì `answer()` và `flush()` không gọi `contest-api` nào, đáp án nằm ở `at_practice.answers` (không lẫn `at_entry`/`at_queue`).
- `loadTopics`, `loadQuestions` là tên khác của `fetchTopics`, `fetchQuestions`.

### Mock (chỉ localhost, `?mock=`)
- "Máy chủ giả" ở `localStorage.at_mock` (`entries` theo token, `log` các yêu cầu); chấm điểm theo `ans` của QUIZ-02 thật, lần ghi đầu thắng, `cd` trong `answers` (QĐ-013). `createEntry` ở chế độ thành công đăng ký lượt vào máy chủ giả. Mock tôn trọng `navigator.onLine === false` (trả `NETWORK`).
- API-05 mock đúng thứ tự: đã nộp → trả kết quả cũ; `closed`; **chưa đủ câu → `409 INCOMPLETE_ANSWERS`** với `message` "Bạn mới trả lời x/{total} câu. Hãy trả lời hết các câu rồi nộp bài." (số tính từ QUIZ-01/02, không viết cứng); rồi `contact` (VALIDATION / ATTEMPT_LIMIT); rồi nộp và trả `byTopic`, `eligibleForPrize`.
- Chế độ ép lỗi: `network`, `server`, `rate`, `token` (401), `closed` (API-03/04/05), `submitted` (API-03/04), `named` (API-04), `limit` (API-04/05), `validation` (API-04/05), `incomplete` (API-05). Các chế độ cũ của API-01 giữ nguyên.
- **Chế độ nạp sẵn: `?mock=almost`** (tên do Worker chọn). Dùng như `ok` nhưng lượt mới tạo đã có sẵn đáp án mọi câu trừ câu cuối của chuyên đề cuối (đúng/sai xen kẽ).
- Lưu ý: chuyển sang `?mock=real` (hoặc bỏ `mock`) khi `at_entry` đang là token giả thì API thật trả 401 hoặc 404; ngược lại vào chế độ mock với token thật thì mock trả `INVALID_TOKEN` và xóa lượt.

### Kiểm chứng (đã chạy thật)
- `.\run-local.ps1 -NoRun` build: 0 lỗi. Chạy `dotnet run --no-build --urls http://localhost:11001`, quiz thật phục vụ QUIZ-01/02 (tổng thực tế **200 câu**, 8 chuyên đề). Đã dừng web (cổng 11001 không còn nghe).
- Chạy bằng harness Node (script ở scratchpad, không commit) nạp đúng hai module với `localStorage`/`location`/`navigator` giả và `fetch` gọi quiz thật: **tất cả điều kiện đạt**:
  - localStorage trống → `register`, không lỗi; `localStorage` ném lỗi (chặn) → không ném lỗi ra ngoài.
  - Offline, trả lời 3 câu → cả 3 `pending`, hàng đợi 3 mục; `init()` khi còn offline vẫn `exam` và thấy 3 câu; bật mạng (sự kiện `online`) → máy chủ giả đủ 5 đáp án, không trùng, hàng đợi rỗng.
  - Máy chủ giả lỗi `server` → tự gửi lại sau ~2s (đo 3.0s kể cả trễ mock).
  - `stored=false` (hai tab): hiển thị đáp án của máy chủ. `closed` → mục bị bỏ, đáp án cục bộ bị xóa. `token` → xóa `at_entry` + `at_queue`, về `register`. Đổi sang lượt khác → mục lượt cũ bị bỏ, không gửi bằng token mới.
  - `almost`: 199/200 → `submit` → `409 INCOMPLETE_ANSWERS` "199/200"; trả lời câu cuối → `allDone`; nộp được (`answered=200`, `byTopic` 8 phần tử); nộp lần 2 cùng `score`/`submittedAt`; còn mục trong hàng đợi lúc nộp → không gọi API-05 (`QUEUE_PENDING`), hết hàng đợi → nộp được.
  - API-04: dữ liệu sai → `VALIDATION` có `fields`; hợp lệ → `named`, `at_entry` đồng bộ; lần 2 → `ALREADY_NAMED`.
  - Luyện tập: 0 yêu cầu tới `/api/v1/contest` (đối chiếu nhật ký mock và nhật ký `fetch`), tiến độ ở `at_practice`, không có `at_entry`/`at_queue`; tải lại giữ tiến độ.
  - Đường API thật (`?mock=real`) gửi đúng method, URL, header `X-Entry-Token`, thân JSON (BE chưa có trong luồng này nên trả 404 → `UNKNOWN`, store coi như lỗi tạm).
- `grep 'style='` trong hai file = 0.

### Giới hạn / chưa kiểm
- Chưa chạy trong trình duyệt (DevTools Network/Offline) vì chưa có màn nào dùng store (F3 nối). Offline được mô phỏng bằng `navigator.onLine=false` + sự kiện `online`; Orchestrator/F3 kiểm lại bằng DevTools thật khi có giao diện.
- Chưa đọc `Retry-After` của `429` (dùng chu kỳ cố định); hiện `readError` không giữ header.
- API-02 `answers` lấy từ máy chủ ghi đè state; câu chờ trong hàng đợi mà máy chủ đã có thì bị bỏ khỏi hàng đợi (lần ghi đầu thắng), không gọi lại.
- Mock kiểm số điện thoại đơn giản (10 số bắt đầu 0, họ tên ≥ 2 ký tự), không đúng từng chữ của máy chủ thật.
- Mã `QUEUE_PENDING` là mã nội bộ của FE (không phải mã máy chủ).

### Câu hỏi bị chặn
Không.

## F3 · FE-26 Danh sách chuyên đề, giới thiệu chuyên đề, cột bên (2026-10-18)

Worker, nhánh `lane/CUOC-THI-fe`. Chỉ làm F3 và 3 lỗi mục "Review F2". Đã xem ảnh `th-04`, `th-05`, `th-09`, `th-11` trước khi dựng. Dùng mock (`?mock=ok|almost`), chưa có BE thật.

### File
- `js/contest/exam.js` (mới, là script vào của trang): điều phối màn theo hash: `#dang-ky` (form), `#ngan-hang` (danh sách), `#chuyen-de-N` (giới thiệu), cột bên. Dùng `contest-store.js` (trạng thái) và `quiz-ui.js` (`esc`, `eyebrowHtml`, `progressHtml`).
- `register.js`: bỏ khối tạm `#donebox`, `showRegistered`, `showPractice`, xử lý link luyện tập; thêm `export onRegistered(fn)`; đăng ký xong gọi hàm này (exam.js đăng ký `enterExam`: `init()` lấy API-02 rồi vào `#ngan-hang`).
- `thiPage.cshtml`: bọc form đăng ký trong `#regview`, thêm `#examview`, cột bên có `#sidecards` (hộp cảnh báo "không trực 24/7" giữ nguyên); thêm `<link>` `quiz.css`; script đổi sang `exam.js`.
- `contest.css`: style danh sách, hộp thông báo (`.infobox--ok|soft|warn`), `details.peek`, thẻ cột bên. `contest-store.js`: thêm `state.fullName`, `state.phoneMasked` (lấy từ API-02) cho cột bên.

### Hành vi
- Mở trang có `at_entry`: ẩn form, gọi API-02, vào danh sách (kể cả `closed`/`upcoming`). Không hash → về `#ngan-hang`. Tải lại ở `#chuyen-de-1` giữ giới thiệu.
- Khóa/mở/xong tính theo QĐ-013: `answered ≥ count` của QUIZ-01; CĐ2–8 khóa tới khi CĐ1 xong (đáp án đang chờ gửi vẫn tính). `#chuyen-de-N` khi khóa hoặc sai số → về `#ngan-hang`.
- Hộp "Đã đăng ký. Mã dự thi của bạn là AD-XXXXXX. Đây là lượt thứ n trên {maxAttempts}." (lấy từ API-02); ẩn danh: "Đang thi ẩn danh…"; đã nộp: "Đã nộp bài." (tạm, F5 làm màn kết quả). Cột bên: mã, họ tên, lượt; tiến độ x/8 chuyên đề + danh sách (✓, đang xem, khóa có chữ ẩn "(chưa mở)").
- Luyện tập: link "vào ngân hàng câu hỏi" vào danh sách ở chế độ luyện tập, có hộp riêng và thẻ cột bên "Luyện tập" (kèm nút "Đăng ký dự thi" khi cuộc thi đang mở). Tải lại giữ chế độ.
- `401` (kể cả đổi `?mock=token`) → xóa lượt, về đăng ký.
- ≤ 900px cột bên xuống dưới (CSS sẵn có của trang).

### Sửa theo review F2
1. `.qnav.o:hover` / `.qnav.f:hover` thêm `:not(:disabled)`.
2. Thêm `--c-track: #F1E4E2` vào `tokens.css`, dùng cho `.qbar`.
3. `quiz-ui.js`: thêm `resultBodyHtml(q, chosen)` (phần bên trong vùng live, rỗng khi chưa chọn); `resultHtml` bọc nó trong `.qlive`. Chú thích đã sửa: F4 đặt sẵn một `.qlive`, gán `resultBodyHtml` vào `innerHTML`; không lồng hai `aria-live`.
- "Cần xác minh" 1–2 của review (ảnh `tt-01..03` ở 1440/390, câu Đúng–Sai ở 481–1024px): **chưa làm**, vì F3 chưa có màn câu hỏi; làm ở F4.

### Kiểm chứng (đã chạy thật)
- `.\run-local.ps1 -NoRun`: 0 lỗi. Web `dotnet run --no-build --urls http://localhost:11001`. Script Playwright (Edge, ở scratchpad, không commit): **28/28 điều kiện đạt**:
  - đăng ký có tên (mock) → `#ngan-hang`, hộp xanh đúng chữ, 8 dòng, 7 khóa, focus ở tiêu đề, cột bên có tên/lượt;
  - mở `#chuyen-de-3` khi chưa xong CĐ1 → về `#ngan-hang`; vào CĐ1 → giới thiệu + "Hiểu nhanh mấy từ"; tải lại giữ nguyên;
  - **ngoại tuyến trong trình duyệt thật** (`context.set_offline`): 3 đáp án vào hàng đợi (`at_queue` = 3, danh sách hiện "đã trả lời 3"); bật mạng + sự kiện `online` → máy chủ giả có đúng 3 dòng, không trùng, hàng đợi rỗng;
  - xóa localStorage → về form đăng ký, console không lỗi; `?mock=almost` ẩn danh → 7 chuyên đề xong, cột bên "Đã xong 7 / 8", "Không xét giải"; luyện tập không có yêu cầu `/api/v1/contest`; `?mock=token` → về đăng ký, `at_entry` bị xóa; 1024px và 390px không tràn ngang.
- Ảnh chụp (trong scratchpad, ngoài repo): `C:\Users\Gearvn\AppData\Local\Temp\claude\C--GTSC-DMST-wt-CUOC-THI-fe\033d2e9c-13ea-46a6-bc05-42381d353d5e\scratchpad\shots\` (`menu-khoa-1440.png`, `intro-1440.png`, `menu-mo-anon-1440.png`, `menu-1024.png`, `menu-390.png`, `menu-luyen-tap.png`). So bằng mắt với th-04/05/09: khớp bố cục; tiêu đề giới thiệu xuống dòng ở 1440 vì khung hẹp hơn ảnh vài chục px.
- Đã dừng web (cổng 11001 không còn nghe).

### Giới hạn / chưa làm
- Nút "Bắt đầu N câu" chỉ hiện ghi chú "Màn làm bài sẽ mở ở bước tiếp theo (FE-27)"; F4 thay.
- Nút "Dự thi có tên để xét giải" ở cột bên ẩn danh (th-04) **chưa có**: thuộc hộp thoại F5, tránh để nút chết.
- Đoạn hero của view còn viết cứng "Tám chuyên đề, 200 câu" (có sẵn từ FE-25, ngoài JS); menu và cột bên lấy số theo QUIZ-01. F5 cần xử lý nếu Grep `200`.
- Chưa chạy với API thật (chưa có BE trong worktree); mock đã dùng dạng API-02 theo contract.
- `th-11` (số điện thoại làm mã dự thi) đã lỗi thời: dùng mã `AD-…` theo API-01.

### Câu hỏi bị chặn
Không.

## F1 · sửa sau review (2026-10-18)

Worker, nhánh `lane/CUOC-THI-fe`, commit `08d278b` (riêng, chỉ `contest-api.js` và `contest-store.js`). Sửa theo mục "Review F1 (luồng fe)" ở `3-review.md`. Không đổi contract.

### Đã sửa
- **Cao · đáp án ghi nhầm lượt**: `getMe/saveAnswer/attachContact/submitEntry` nhận thêm tham số `token` (tùy chọn); store luôn truyền `state.entry.token`, nên tab cũ gửi bằng token lượt cũ và nhận `ALREADY_SUBMITTED`. Thêm nghe sự kiện `storage` cho `at_entry`: đổi sang lượt khác thì phát `entry-changed` (màn hình gọi lại `init()`). Kèm theo: `clearSession` chỉ xóa `at_entry`/hàng đợi của lượt mình khi `at_entry` đã là lượt khác; `syncEntry` không ghi đè `at_entry` của lượt khác; `drain` không xóa mục của lượt khác; `ALREADY_SUBMITTED`, `submit` thành công và `applyServer(submitted)` chỉ bỏ mục của lượt mình.
- **Trung bình #1**: thêm `state.synced`. `init()` gặp lỗi mạng/máy chủ → `synced=false`; `flush()` (chu kỳ thử lại và sự kiện `online`) gọi lại API-02 trước (`resync`), dựng lại `answers`/`total`, phủ hàng đợi, phát `change`; `INVALID_TOKEN` thì xóa lượt như `init`; đã nộp thì phát `submitted`. Màn hình biết đã đồng bộ qua `change` hoặc `state.synced`.
- **Trung bình #2**: `at_entry` (trong `contest-api.js`), `at_queue`, `at_practice` (trong store) và mock `at_mock` có bản trong bộ nhớ, dùng khi `localStorage` ném lỗi; thêm `clearEntry()` export. Tải lại thì mất (đúng QĐ-007).
- **Thấp #1**: `submit(contact)` thành công trên lượt `anon` → gọi `getMe` để cập nhật `attemptNo` trong `at_entry`.
- **Thấp #2**: bỏ nhánh `limit` thừa ở API-05 mock (chỉ còn trong `takeContact`).
- **Thấp #3**: `429` kèm `Retry-After` (số giây) → `error.retryAfter`; `scheduleRetry` không thử lại sớm hơn.
- **Thấp #4**: `fields` luôn là object (`{}`), kể cả lỗi tự sinh ở FE. `register.js` dùng `error.fields ? …` vẫn đúng.

### Kiểm chứng (đã chạy thật)
- `.\run-local.ps1 -NoRun`: 0 lỗi; web `:11001` phục vụ QUIZ-01/02 (200 câu). Harness Node (scratchpad, không commit): **toàn bộ đạt**.
  1. Hai tab: lượt 1 nộp ở "tab B", `at_entry` = lượt 2, tab A trả lời 1 câu → `entry-changed` phát ra, tab A nhận `ALREADY_SUBMITTED`, lượt 2 ở máy chủ giả có 0 đáp án, `at_entry` vẫn là lượt 2, mục hàng đợi của lượt 2 còn nguyên.
  2. `init()` khi `navigator.onLine=false` (máy chủ giả đã có 3 đáp án) → `exam`, `offline`, `total=null`; bật mạng + `online` → `answers=3`, `total=200`, `synced=true`, có `change`.
  3. `localStorage` ném lỗi mọi thao tác: đăng ký (mock) → vào `exam`; trả lời 2 câu → không `pending`, máy chủ giả 2 đáp án; offline 1 câu → hàng đợi trong bộ nhớ, bật mạng → máy chủ 3 đáp án, hàng đợi rỗng.
  4. Toàn bộ kịch bản F1 cũ (13 mục: offline/online, `stored=false`, thử lại 2s, `closed`, `token`, đổi lượt, `INCOMPLETE_ANSWERS`/nộp, `QUEUE_PENDING`, API-04, luyện tập 0 yêu cầu): không hồi quy.
  - Thêm: `429` kèm `Retry-After: 7` → `retryAfter=7`; nộp kèm contact → `attemptNo=1`; `?mock=limit` không còn trả `ATTEMPT_LIMIT` ở API-05 không contact.
- Đã dừng web (cổng 11001 không còn nghe).

### Giới hạn
- Chưa thử bằng DevTools trình duyệt thật (dời sang F3 như review ghi).
- Màn hình (F3/F4) cần nghe `entry-changed` và gọi lại `init()`; `exam.js` chưa nghe sự kiện này (ngoài phạm vi task này).

### Câu hỏi bị chặn
Không.

## F3 · sửa sau review · 2026-10-18

Nguồn: `3-review-CUOC-THI-fe.md` › "Review F3". Commit `1578319` trên `lane/CUOC-THI-fe` (chưa push). Nhánh đã merge `feature/cuoc-thi` nên API-02..05 là thật.

### Đã sửa

| Mục review | Sửa | File |
|---|---|---|
| **Cao**: bấm đăng ký hai lần tạo thêm lượt | `submit()` giữ `busy` và nút khóa ("Đang đăng ký…") cho tới khi `registeredHandler` (`enterExam`: API-02 + chuyển màn) chạy xong, bọc `try/finally` | `register.js` |
| Yêu cầu thêm: tab khác đổi lượt | `exam.js` nghe `entry-changed` của store, gọi `init()` rồi `route(false)` | `exam.js` |
| Thấp #2 (hộp offline không mất) | Đã xử lý ở F1-sửa (`08d278b`, lấy lại API-02 khi có mạng); thêm: `entry-changed` cũng đặt lại `offline` theo kết quả `init()`. Không đổi gì thêm | `exam.js` |
| Thấp #3 (màu cứng) | Thêm `--c-lock-bg/-n/-text` vào `tokens.css`, `contest.css` dùng biến | `tokens.css`, `contest.css` |
| Thấp #4 (mất focus ở nút) | `focusSelector()` giữ focus cho liên kết (`href`), nút `data-start`, nút `data-retry` sau `refresh()` | `exam.js` |
| Thấp #1 ("Làm tiếp từ câu k") | Không làm, chuyển F4 theo review. **Ghi cho F4**: đổi chữ nút `data-start` khi `answered > 0`, dùng `answered + 1` từ `topicProgress` làm cách tạm | — |

### Kiểm chứng (API thật, không mock)

Web `dotnet run --no-build --urls http://localhost:11001` sau `.\run-local.ps1 -NoRun` (0 lỗi). Script Playwright (Edge, ở scratchpad phiên Worker, không commit). Để làm API-02 chậm, chèn `fetch` trễ 4 giây (3 giây cho ẩn danh) cho `GET /contest/entries/me` trong trang; API-01 đi thẳng tới máy chủ thật. Đếm CSDL bằng cách đọc `App_Data/app.sqlite.db` (bảng `entry`). Kết quả: `ket-qua-playwright.txt`, **13/13 đạt**:

- Đăng ký có tên: sau khi API-01 xong, API-02 còn chờ, nút vẫn khóa, chữ "Đang đăng ký…"; bấm thêm hai lần (click và `requestSubmit`): **1 request POST `/contest/entries`, CSDL +1 lượt** (2→3).
- Ẩn danh: nút khóa khi chờ, bấm thêm một lần: 1 POST, +1 lượt.
- **Đối chứng**: đặt tạm `register.js` cũ (`HEAD` trước sửa) rồi chạy lại: nút bật lại khi chờ, **2 POST, CSDL +2 lượt** (5→7). Đã khôi phục bản sửa. Kết quả đối chứng: `doi-chung-register-cu.txt`.
- `entry-changed`: hai tab cùng ngữ cảnh; tab 2 xóa lưu trữ và đăng ký người khác; tab 1 tự chuyển sang mã và họ tên mới (không tải lại).
- Kiểm chính F3 với API thật: hộp xanh "Mã dự thi AD-… Đây là lượt thứ 1 trên 2"; cột bên có tên và lượt; `#chuyen-de-3` khi khóa về `#ngan-hang`; tải lại giữ 7 hàng khóa; làm 19 câu CĐ1 qua `answer()` của store (API-03 thật, 19/19 lưu, không pending); sau đó API-02 thật báo CĐ1 xong, hết khóa, vào được `#chuyen-de-3`.
- Chưa kiểm: bàn phím với `focusSelector` (chỉ đọc code, chưa tự động hóa); Slow 3G của DevTools (thay bằng fetch trễ).

### Ảnh (thư mục chung `C:\GTSC\DMST\agent-artifacts\CUOC-THI-fe\f3-sua\`)

| Ảnh | So với |
|---|---|
| `th-11-menu-co-ten-1440.png` (thí sinh có tên, CĐ1 chưa làm) | `th-11`: hộp xanh, thẻ Thí sinh có mã AD-…, họ tên, "Lượt thứ 1 / 2". Mã AD- thay số điện thoại là đúng theo `anh/README.md` |
| `th-04-menu-khoa-co-ten-1440.png`, `th-04-menu-khoa-an-danh-1440.png` | `th-04`: 7 hàng khóa có ổ khóa, hộp hồng, hộp xám ẩn danh. Khác: chưa có nút "Dự thi có tên để xét giải" (F5) |
| `th-05-gioi-thieu-cd1-1440.png` (khối thuật ngữ mở) | `th-05`: tiêu đề xuống dòng ở 1440px (đã báo ở F3) |
| `th-09-menu-mo-1440.png` (sau khi xong CĐ1) | `th-09`: CĐ1 ✓ "đã làm xong", CĐ2–8 mở, "Đã xong 1 / 8" |
| `menu-mo-1024.png`, `menu-mo-390.png` | Responsive |
| `ket-qua-playwright.txt`, `doi-chung-register-cu.txt` | Kết quả chạy |

Ảnh chụp toàn trang (có đầu trang và hero), ảnh tham chiếu chỉ cắt khung. Tôi đã xem tay th-11, th-09, th-05; chưa xem tay các ảnh 1024/390 và th-04 vừa chụp lại.

### Giới hạn / việc còn

- Ảnh th-09 ở 1440px hiện tên "Tran Thi Tab Hai" vì kịch bản chuyển lượt (tab 2) chạy trước; không phải lỗi.
- Hero còn ghi cứng "Tám chuyên đề, 200 câu" (F5, theo review).
- Nút "Dự thi có tên để xét giải" thuộc F5.
- Web đã dừng. CSDL worktree còn các lượt thử (số điện thoại ngẫu nhiên).

## F4a · FE-27a màn Câu hỏi · 2026-10-18

Worker, nhánh `lane/CUOC-THI-fe`, 2 commit (chưa push): `2d30e62` (3 lỗi Thấp của "Review F1-sửa") và `3bf7dae` (F4a). Chỉ làm F4a; đồng hồ đọc, màn Xong chuyên đề, làm lại để F4b.

### Đã làm
- **Màn Câu hỏi** (`exam.js`, `contest.css`), hash `#chuyen-de-N/cau-hoi`; dùng `quiz-ui.js` của F2. Có: nút "‹ Chuyên đề N", "Câu k / n", thanh tiến độ, mã + loại câu, tình huống, đáp án, vùng `.qlive` (aria-live) đặt sẵn, gán `resultBodyHtml` khi chọn, focus chuyển tới dòng "Đúng./Chưa đúng.", nút "‹ Câu trước", nút "Đã hiểu, sang câu tiếp theo ›" (câu cuối: "…hoàn thành chuyên đề ›").
- **Lưu đáp án**: `answer()` của store (API-03 thật). Hiện kết quả ngay khi bấm rồi đối chiếu: `stored=false` thì hiện đáp án máy chủ giữ; lỗi `CONTEST_CLOSED`/`UNKNOWN_QUESTION`/`INVALID_OPTION`/`ALREADY_SUBMITTED` hoặc mục bị bỏ khỏi hàng đợi (`dropped`) → câu trở lại chưa trả lời kèm thông báo; `pending` (mất mạng) → ghi chú "Chưa gửi được lên máy chủ…" tự mất khi gửi xong. Màn câu hỏi không dựng lại cả màn khi store phát `change` (giữ focus, không ngắt aria-live).
- **Tiếp từ câu chưa làm**: vào/tải lại màn câu hỏi thì mở câu chưa trả lời đầu tiên (đã làm hết thì xem lại từ câu 1). Câu đã làm hiện sẵn kết quả, nút đi tiếp mở ngay.
- **"Làm tiếp từ câu k ›"** (điểm Thấp #1 review F3): nút ở giới thiệu: chưa làm "Bắt đầu N câu ›", làm dở "Làm tiếp từ câu k ›" (k = câu chưa làm đầu tiên theo QUIZ-02, dự phòng `answered+1`), đã xong "Xem lại N câu ›" (đề xuất của tôi, vì F4b chưa có "làm lại").
- **3 lỗi Thấp của Review F1-sửa** (`contest-store.js`): #1 `answer()` trả `stored:false` khi đáp án sau đồng bộ khác đáp án vừa chọn; #2 `init()` truyền `retryAfter`; #3 `applyServer` lọc hàng đợi theo lượt.

### Chỗ móc cho F4b (trong `exam.js`, mục "Màn câu hỏi")
- `readHold(q)`: trả số giây khóa nút đi tiếp (hiện luôn 0); `#qwait` là chỗ ghi "Còn … giây đọc phần giải thích".
- `leaveQuestion()`: hàm rỗng, gọi mỗi khi đổi câu/rời màn; F4b dừng đồng hồ ở đây.
- `onTopicEnd(cd)`: hiện về `#ngan-hang`; F4b thay bằng màn Xong chuyên đề.
- Cần thêm `data-read-timer-factor` ở `thiPage.cshtml` (chưa làm).

### Kiểm chứng (API thật, không mock)
`.\run-local.ps1 -NoRun`: 0 lỗi; web `:11001`. Playwright (Edge, script ở scratchpad, không commit), thí sinh ẩn danh thật, đếm `entry_answer` bằng sqlite3 chỉ-đọc: **42/43 đạt**, mục "không" duy nhất là console báo `ERR_INTERNET_DISCONNECTED` do chính bước thử tắt mạng (dự kiến). Gồm: chọn đáp án → 1 request API-03, CSDL có dòng ngay; focus ở `#qhead`; vùng live không lồng nhau; nút đi tiếp khóa khi chưa chọn; câu trước hiện lại đáp án; không gửi lại; tải lại giữa chuyên đề → "Câu 3 / 19"; giới thiệu "Làm tiếp từ câu 3"; tắt mạng → ghi chú chờ gửi, bật mạng → ghi chú mất, CSDL đủ 3 dòng; làm hết 19 câu CĐ1 bằng giao diện → về danh sách, CĐ1 xong, 7 CĐ mở, CSDL 19 dòng; giới thiệu "Xem lại 19 câu".
- **Đúng–Sai ở 481–1024px** (Review F2 "Cần xác minh" 2), câu `CĐ2-038` (chỉ số 14): 1440/1024/768/600 hai nút cùng hàng; ≤ 481 xếp dọc (CSS `flex-basis:100%` ≤ 480 và `14rem` ở khoảng giữa); không tràn ngang ở bất kỳ độ rộng 390–1440, cả chưa chọn lẫn đã chọn; nhãn "Đáp án phù hợp/Bạn chọn" xuống dòng dưới chữ khi nút hẹp (600px). Đạt.
- **So ảnh** `th-06`, `th-07`, `mb-07`, `tt-01..03`: bố cục khớp (nút quay lại + "Câu k/n", thanh tiến độ, mã + loại câu, đáp án, kết quả, giải thích, hộp "Hành động an toàn"). Khác có chủ ý: chưa có dòng "Còn … đọc phần giải thích" (F4b), nút đi tiếp mở ngay; ảnh gốc cột bên ghi mã dạng khác (mã AD-…). Tôi đã xem tay ảnh 1440 chọn sai, 390 chọn sai, Đúng–Sai 600px; chưa xem tay các ảnh còn lại.
- Chưa kiểm: bàn phím bằng tay (chỉ đọc code + kiểm focus tự động), trình đọc màn hình thật, hệ số đồng hồ (F4b), trả lời khi cuộc thi đóng (chưa đổi `contestEnd`).

### Ảnh và kết quả (`C:\GTSC\DMST\agent-artifacts\CUOC-THI-fe\f4a\`)
`th-06-cau-hoi-chua-chon-1440.png`, `tt-02-chon-sai-1440.png`, `tt-03-chon-dung-1440.png`, `mb-07-chon-sai-390.png`, `intro-lam-tiep-1440.png`, `offline-ghi-chu-1440.png`, `duo-chua-chon-{1440,1024,768,600,481,480,390}.png`, `duo-da-chon-{…}.png`, `ket-qua-playwright.txt`.

### Giới hạn / lưu ý
- Đã dừng web bằng `taskkill /IM dotnet.exe` nên **có thể đã tắt luôn web đang chạy của luồng/phiên khác** (tôi chưa kiểm cổng khác). Nếu có phiên đang chạy `dotnet`, cần chạy lại.
- CSDL worktree còn các lượt thử (ẩn danh).
- Hero còn ghi cứng "200 câu" và nút "Dự thi có tên" thuộc F5 (như cũ).

### Câu hỏi bị chặn
Không.
