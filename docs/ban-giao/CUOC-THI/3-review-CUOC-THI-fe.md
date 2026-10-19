# CUOC-THI · Review luồng CUOC-THI-fe

Người viết: Orchestrator (`/quality-check`). File này dành riêng cho luồng fe, theo quy ước mỗi luồng một file review. Các review cũ hơn của luồng fe (F2, F1) nằm trong `3-review.md`.

## Review F3 (FE-26) và 3 lỗi sửa theo review F2 · 2026-10-18

### Phạm vi đã review

- **Đối tượng**: commit `d667f71` trên `lane/CUOC-THI-fe`. Chỉ đọc qua `git show`, không đọc file đang thay đổi trong worktree vì Worker đang sửa F1 ở đó. Gồm 8 file: `thiPage.cshtml`, `contest.css`, `quiz.css`, `tokens.css`, `contest-store.js`, `exam.js` (mới), `register.js`, `quiz-ui.js`.
- **Báo cáo Worker**: `2-ban-giao-CUOC-THI-fe.md` › "F3 · FE-26".
- **Chuẩn so sánh**:
  - `Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › "Công việc" r22 (FE-26);
  - `Mo-ta-cong-viec-FE-antoantaichinh-v3.docx` › FE-26 (nội dung khớp với sheet);
  - ảnh `th-04`, `th-05`, `th-09`, `th-11`;
  - `1-thiet-ke.md` › AC FE-26, task F3, "Đối chiếu", và mục cập nhật CXN (QĐ-013, QĐ-015);
  - `3-review.md` › "Review F2" (3 phát hiện) và "Review F1" › "Cần xác minh" (`leavePractice`).
- **Không review được**:
  - Không chạy web hay trình duyệt, vì Orchestrator không build và không chạy. Phần so ảnh dựa trên đọc code, đối chiếu với ảnh tham chiếu, và kết quả Playwright do Worker báo. Ảnh Worker chụp nằm trong scratchpad của phiên Worker; Orchestrator chưa mở.
  - Phần F1 nằm dưới commit này (`5fc9c37`) và các lỗi F1 còn mở thuộc task "F1-sửa", không review lại ở đây.

### Ba lỗi sửa theo review F2

| # | Phát hiện F2 | Code ở `d667f71` | Kết quả |
|---|---|---|---|
| 1 | Hover vẫn đổi màu khi `.qnav` bị disabled | `quiz.css:59,61`: `.qnav.o:hover:not(:disabled)`, `.qnav.f:hover:not(:disabled)` | **Đạt** |
| 2 | Nền thanh tiến độ khác bản dựng | `tokens.css:35`: `--c-track: #F1E4E2`; `quiz.css:5-6` dùng `var(--c-track)` | **Đạt** |
| 3 | Lồng hai vùng `aria-live` | `quiz-ui.js:60-83`: thêm `resultBodyHtml()` (rỗng khi chưa chọn); `resultHtml()` bọc phần này trong `.qlive`; chú thích ghi rõ hai cách dùng và "không lồng hai vùng aria-live" | **Đạt**. F4 phải gán `resultBodyHtml` vào `.qlive` đã có sẵn; Orchestrator sẽ kiểm ở review F4 |

"Cần xác minh" 1–2 của review F2 (chụp `tt-01..03`, kiểm câu Đúng–Sai ở 481–1024px) dời sang F4. Chấp nhận, vì F3 chưa có màn câu hỏi.

### Đối chiếu tiêu chí FE-26

| Tiêu chí / mô tả (sheet r22, docx) | Code | Kết quả |
|---|---|---|
| Danh sách: nhãn, H2, đoạn dẫn có tổng số câu, 8 hàng, hộp hồng nhắc CĐ1, dòng chú thích | `exam.js:305-337` (`menuHtml`); tổng câu tính từ QUIZ-01 (`totalQuestions`) | Đạt |
| Ba trạng thái hàng: mở, khóa (`aria-disabled`, ổ khóa, "mở sau khi xong Chuyên đề 1"), xong (✓, "đã làm xong") | `exam.js:314-330`; `contest.css:100-108` | Đạt |
| Khóa CĐ2–8 khi chưa xong CĐ1; xong = `answered ≥ count` (QĐ-013) | `firstDone`/`isLocked` `exam.js:248-255`, dựa trên `topicProgress` của store | Đạt |
| AC: không vào CĐ2–8 bằng URL | `route` `exam.js:447-451` về `#ngan-hang` + `replaceState`; `refresh` cũng kiểm lại `:466` | Đạt (Worker đã thử `#chuyen-de-3`) |
| AC: tải lại giữ trạng thái xong/khóa | Trạng thái lấy từ API-02 qua `init()`; `boot` dựng lại theo hash `exam.js:520-540` | Đạt |
| Hộp xanh "Đã đăng ký. Mã dự thi của bạn là AD-… Đây là lượt thứ n trên {max}." | `exam.js:297-298`; `max` lấy từ API-02, `data-max-attempts` chỉ là dự phòng | Đạt |
| Hộp xám ẩn danh | `exam.js:294-296`, khớp `th-04` | Đạt |
| Giới thiệu: nút quay lại, nhãn "… · Chuyên đề N", H2, các đoạn, "Hiểu nhanh mấy từ", nút "Bắt đầu N câu ›" / "Chọn chuyên đề khác" | `introHtml` `exam.js:339-353`; dấu `+`/`×` thay cho xoay 45°, nhìn giống nhau | Đạt |
| "Làm tiếp từ câu k ›" khi chuyên đề làm dở | Không có, nút luôn là "Bắt đầu N câu" | **Thiếu**, xem Thấp #1 |
| Cột bên, thẻ Thí sinh: nhãn, mã, họ tên, "Lượt thứ n / max"; ẩn danh có "Không xét giải" | `sideHtml` `exam.js:355-374` | Đạt |
| Ẩn danh: nút "Dự thi có tên để xét giải" | Chưa có; Worker ghi là để F5 (hộp thoại) | Chấp nhận, xem "Sai khác" |
| Cột bên, thẻ Tiến độ: "Đã xong n / 8", thanh, danh sách (xong ✓, đang xem đậm, khóa xám, cắt một dòng) | `exam.js:375-389`; `.sidelist__t` có ellipsis | Đạt |
| Hộp cảnh báo "không trực 24/7" + liên kết | Giữ nguyên trong view, nằm ngoài `#sidecards` | Đạt |
| Hover hàng: viền đỏ, dịch phải 4px | `quiz.css:81`; hàng khóa tắt hiệu ứng `contest.css:106` | Đạt |
| Đổi màn thì focus vào H2 | `route(true)` → `focusHeading('#eh')`; về đăng ký thì vào `#vh` | Đạt |
| ≤ 900px cột bên xuống dưới | `contest.css` (đã có từ FE-25) | Đạt |
| Trang `closed`/`upcoming` mà có `at_entry` vẫn vào danh sách (task F3) | `boot` không xét trạng thái cuộc thi khi `init()` trả `exam` | Đạt |
| Nút "Nộp bài dự thi" | Thuộc F5 (QĐ-015) | Ngoài phạm vi F3 |
| Thoát ký tự | Mọi dữ liệu QUIZ-01 và API-02 qua `esc()` (`eyebrowHtml` cũng thoát, `quiz-ui.js:18-19`); chỗ không thoát chỉ là số do code tự tính hoặc `t.count` | Đạt |
| Không `style=`, chỉ dùng rem | Không có `style=`; cỡ chữ dùng rem | Đạt (màu cứng: xem Thấp #3) |

"Cần xác minh" từ review F1 về `leavePractice`: `exam.js` không gọi `leavePractice`. Khi đăng ký từ chế độ luyện tập, `enterExam` gọi `init()`, mà `init()` đặt `state.practice = false` (`contest-store.js:162`) rồi dựng lại từ API-02. **Đạt.**

### Phát hiện

#### [Cao] Sau khi đăng ký thành công, form mở lại trong lúc chờ API-02; bấm lần nữa sẽ tạo thêm một lượt thi

- **Vị trí**: `register.js:120-123` (`saveEntry` → `setBusy(false)` → `await registeredHandler()`); `exam.js:511-515` (`enterExam` chờ `init()` xong mới `go('#ngan-hang')`, và chỉ lúc đó `#regview` mới bị ẩn trong `route`).
- **Bằng chứng**:
  - Giữa lúc API-01 trả về và lúc API-02 trả về, `#regview` vẫn hiện. Nút "Đăng ký và bắt đầu làm bài ›" và "Bắt đầu thi ẩn danh ›" đã bật lại, chữ trở về như cũ, `busy = false`. `getMe` có thể chờ tới 15 giây (timeout của F1).
  - Ở FE-25 (trước commit này), `showRegistered` ẩn form ngay sau khi API-01 thành công. Đây là **hồi quy**.
- **Tình huống**:
  - Thí sinh có tên đăng ký trên mạng 3G chậm. Nút trở lại "Đăng ký và bắt đầu làm bài ›" trong khi màn hình chưa đổi. Thí sinh tưởng chưa được nên bấm lại.
  - API-01 tạo **lượt thứ 2** cho cùng số điện thoại. `at_entry` bị ghi đè bằng lượt 2, lượt 1 bị bỏ.
  - Thí sinh mất một trong `maxAttempts` lượt và không lấy lại được. Lần sau đăng ký sẽ nhận `ATTEMPT_LIMIT`.
  - Với ẩn danh, mỗi lần bấm thừa sinh thêm một lượt rác trong `entry`.
- **Hướng khắc phục** (chọn một):
  - giữ `busy`/`setBusy(true)` cho tới khi `registeredHandler` xong (bọc `try/finally`);
  - hoặc ẩn `#regview` và hiện "Đang tải tiến độ…" ngay trong `enterExam` **trước** `await init()`, như `boot` đang làm ở `exam.js:521-526`.
- **Kiểm chứng sau khi sửa**: dùng mock có độ trễ cho API-02, hoặc DevTools throttling "Slow 3G": đăng ký rồi bấm nút đăng ký lần nữa ngay. Kết quả mong đợi: không có yêu cầu API-01 thứ hai trong Network, và máy chủ giả chỉ có 1 lượt.

#### [Thấp] #1 · Chưa có nút "Làm tiếp từ câu k ›" khi chuyên đề làm dở

- **Vị trí**: `exam.js:349` (nút luôn ghi "Bắt đầu ${t.count} câu ›").
- **Bằng chứng**: sheet "Công việc" r22 / docx › FE-26 › Mô tả: "Nếu chuyên đề đang làm dở thì nút chính ghi 'Làm tiếp từ câu k ›'". Báo cáo Worker không ghi điểm này trong "Giới hạn".
- **Tình huống**: thí sinh đã trả lời 3/19 câu của CĐ1 và mở lại phần giới thiệu. Nút vẫn ghi "Bắt đầu 19 câu", trong khi F4 sẽ đưa thí sinh vào tiếp từ câu 4.
- **Hướng khắc phục**: để **F4** làm, vì cần thứ tự câu của QUIZ-02 để biết "câu chưa trả lời đầu tiên" và F4 đã có AC này. F4 thay luôn chữ trên nút. Cách tạm khi chưa tải QUIZ-02 là dùng `answered + 1` từ `topicProgress`. Ghi điểm này vào bàn giao F4.

#### [Thấp] #2 · Hộp "Chưa kết nối được máy chủ" không tự mất khi có mạng lại

- **Vị trí**: `exam.js:232` (`let offline`), chỉ được đặt ở `boot` `:528` và `enterExam` `:513`. `refresh` không đặt lại biến này.
- **Tình huống**: mở trang lúc mất mạng thì hiện hộp vàng. Khi có mạng, hàng đợi gửi xong và có sự kiện `change`, nhưng hộp vẫn còn cho tới khi tải lại trang.
- **Hướng khắc phục**: làm cùng "F1-sửa" (Trung bình #1 của review F1, lấy lại API-02 khi có mạng). Khi store báo đã đồng bộ, ví dụ qua cờ `state.synced` hoặc sự kiện riêng, thì `exam.js` đặt `offline = false` rồi `refresh()`.

#### [Thấp] #3 · Màu viết cứng trong `contest.css`

- **Vị trí**: `contest.css` (bản ở commit): `.qrow--lock` `#FAFAFA`; `.qrow--lock .qrow__n` `#EFEFEF` và `#8A8A8A`; `.sidelist li.is-lock` `#8A8A8A`.
- **Bằng chứng**: `CLAUDE.md` › Quy ước: "Màu … lấy từ biến trong `tokens.css`". Các giá trị này khớp tài liệu (#FAFAFA cho hàng khóa), nhưng không phải biến.
- **Hướng khắc phục**: thêm biến, ví dụ `--c-lock-bg`, `--c-lock-n`, `--c-lock-text`, vào `tokens.css` rồi dùng. Có thể làm kèm task sau.

#### [Thấp] #4 · `refresh()` làm mất focus khi focus đang ở nút

- **Vị trí**: `exam.js:463-472`. Chỉ giữ lại được focus cho phần tử có `href`.
- **Tình huống**: người dùng dùng bàn phím đang đứng ở nút "Bắt đầu N câu" (`<button>`, không có `href`). Lúc đó hàng đợi gửi xong và phát `change` → `innerHTML` dựng lại → focus rơi về `body`, và dòng `#startnote` vừa hiện cũng mất.
- **Hướng khắc phục**: giữ thêm `data-start`/`data-retry`, hoặc ghi một khóa chung trên phần tử (`data-focus-key`) rồi tìm lại theo khóa đó. F4 thay nút này nên có thể làm cùng F4.

### Sai khác tài liệu ↔ code (cần biết, chưa phải lỗi)

- **Chế độ luyện tập**:
  - Tài liệu ghi "không có hộp ở chế độ luyện tập", và thẻ cột bên ghi "Chưa đăng ký dự thi." kèm nút "Đăng ký dự thi".
  - Code hiện hộp xám "Đang luyện tập. Bài làm chỉ lưu trên máy bạn…" (`exam.js:286-288`). Thẻ cột bên dùng nhãn "Luyện tập" và nội dung tương tự; nút "Đăng ký dự thi" chỉ hiện khi cuộc thi đang mở (`:359-360`).
  - Đây là đề xuất của Worker, có lợi: nói rõ bài làm không tính vào cuộc thi, và không đưa nút chết khi cuộc thi đã đóng. Chấp nhận tạm; chủ quản xem khi duyệt giao diện. Muốn giữ đúng tài liệu thì bỏ hộp và đổi câu chữ, sửa trong vài dòng.
- **Nút "Dự thi có tên để xét giải"** (ẩn danh, `th-04`/`th-05`/`th-09`) chưa có. Worker dời sang F5 để khỏi đưa nút chết. Chấp nhận. **F5 phải thêm nút này** vào thẻ Thí sinh ẩn danh.
- **Đoạn hero còn ghi cứng "Tám chuyên đề, 200 câu"** (trong view, có từ FE-25). Worker đã ghi lại. F5 xử lý theo tiêu chí "không có `200` viết cứng" của QĐ-015.
- **`th-11`** dùng số điện thoại làm mã. Code dùng mã `AD-…` theo API-01, đúng chú thích của ảnh trong `anh/README.md`.
- **`maxAttemptsDefault = 2`** chỉ dùng khi thiếu `data-max-attempts`. Giá trị thật lấy từ API-02. Không coi là viết cứng.

### Cần xác minh

1. **So ảnh**. Ảnh Worker chụp (`menu-khoa-1440.png`, `intro-1440.png`, `menu-mo-anon-1440.png`, `menu-1024.png`, `menu-390.png`, `menu-luyen-tap.png`) nằm trong scratchpad của phiên Worker, ngoài repo. Orchestrator chưa xem nên chưa xác nhận được tiêu chí "Giống 4 ảnh tham chiếu" bằng mắt. Theo đọc code, bố cục và câu chữ khớp `th-04/05/09/11`. Worker đã báo tiêu đề phần giới thiệu xuống dòng ở 1440px. **Yêu cầu**: lần bàn giao sau, chép các ảnh này vào `docs/ban-giao/CUOC-THI/anh-fe/` ở repo chính (không commit ở nhánh lane), hoặc ghi đường dẫn còn mở được, để Orchestrator so.
2. **Chưa thấy ảnh `th-11` ở trạng thái có tên** (hộp xanh + thẻ có họ tên). Worker nói đã kiểm bằng Playwright ("hộp xanh đúng chữ, cột bên có tên/lượt") nhưng không có tên ảnh tương ứng. Gộp vào yêu cầu ở mục 1.

### Đề xuất (không bắt buộc)

- `register.js` giờ export `onRegistered` và chỉ cho đăng ký **một** hàm xử lý. Hiện đủ dùng. Nếu F5 cần nghe thêm thì đổi sang danh sách hàm hoặc dùng sự kiện của store.
- `sideHtml` lấy họ tên từ `state.fullName` (API-02). Khi API-02 lỗi mạng lúc mở trang, thẻ Thí sinh mất họ tên; sẽ tự đúng sau "F1-sửa" (đồng bộ lại).

### Kết luận

**F3 cần sửa** trước khi merge, vì có 1 lỗi mức **Cao**: mất lượt thi khi bấm đăng ký hai lần (hồi quy so với FE-25). Phần còn lại đạt:
- 3 lỗi của review F2 đã sửa đúng;
- các AC của FE-26 kiểm được bằng đọc code đều đạt (chặn URL, giữ trạng thái khi tải lại, hộp xanh đúng câu chữ, cột bên, responsive, focus);
- không thấy lỗi XSS hay `style=`.

**Việc Worker phải làm** (task "F3-sửa", một phiên, commit riêng trên `lane/CUOC-THI-fe`). Có thể làm sau "F1-sửa" hoặc gộp vào phiên "F1-sửa" nếu Worker đang ở đó, nhưng commit riêng:

1. **Cao**: không cho đăng ký lần hai trong lúc chờ API-02 (theo "Hướng khắc phục" ở trên). Kiểm bằng throttling hoặc mock có trễ, rồi ghi lệnh và kết quả vào bàn giao.
2. Thấp #2: làm cùng "F1-sửa" (đặt lại hộp offline khi đã đồng bộ).
3. Thấp #3, #4: làm nếu tiện. Thấp #1 chuyển sang F4 (ghi vào bàn giao F4).
4. Chép ảnh chụp ra chỗ Orchestrator mở được ("Cần xác minh" 1–2), kèm ảnh thí sinh có tên ở 1440px.
5. Ghi vào `2-ban-giao-CUOC-THI-fe.md` mục mới "F3 · sửa sau review", kèm mã commit.

**Rủi ro còn lại**: thấp sau khi sửa lỗi Cao.
- F3 nằm trên F1 chưa sửa. Không merge `lane/CUOC-THI-fe` khi "F1-sửa" và "F3-sửa" chưa đạt review.
- Chưa chạy với BE thật. Phần này kiểm ở task I.
- F4 được bắt đầu sau khi "F3-sửa" xong. Vì F4 sửa cùng `exam.js`, nên làm F4 nối tiếp trên cùng worktree.

## Review F1-sửa (FE-28, sửa theo "Review F1") · 2026-10-18

**Kết luận: F1-sửa ĐẠT.** Cả 7 phát hiện của "Review F1" (`3-review.md`) đã được sửa đúng hướng: 1 Cao, 2 Trung bình, 4 Thấp. Không đổi contract. Còn 3 điểm **Thấp** mới, không chặn merge; ghi lại để làm kèm F4/F5 (xem "Việc tiếp theo").

### Phạm vi đã review

- **Đối tượng**: commit `08d278b` trên `lane/CUOC-THI-fe` (cha `d667f71`). Chỉ đọc qua `git show`, không đọc worktree vì Worker đang làm F3-sửa ở đó. Gồm 2 file: `wwwroot/assets/js/contest/contest-api.js` (+52/−29) và `contest-store.js` (+94/−28). Không có file ngoài ranh giới luồng fe. Số dòng dưới đây theo bản trong commit.
- **Báo cáo Worker**: `2-ban-giao-CUOC-THI-fe.md` › "F1 · sửa sau review".
- **Chuẩn so sánh**:
  - `3-review.md` › "Review F1" (phát hiện, "Cần xác minh", 4 bước kiểm chứng yêu cầu);
  - `1-thiet-ke.md` › AC FE-28 mục 1–7 và "Trường hợp biên" (localStorage bị chặn);
  - QĐ-004 (`fields` là object), QĐ-007 (tải lại thì mất token khi không lưu được).
- **Không review được**:
  - Không chạy lại harness Node của Worker. Orchestrator thử `node --check` hai file trích từ commit nhưng lệnh không được cấp quyền, nên **chưa tự kiểm cú pháp**. Phần "đã chạy" (build 0 lỗi, 4 bước kiểm chứng đạt, 13 kịch bản F1 cũ không hồi quy) dựa vào báo cáo Worker.
  - Kiểm trong trình duyệt (DevTools Offline, hai tab thật) vẫn dời sang F3/F4 như review F1 đã chấp nhận.

### Đối chiếu các phát hiện của "Review F1"

| # | Phát hiện F1 | Code ở `08d278b` | Kết quả |
|---|---|---|---|
| Cao | Đáp án ghi vào lượt khác vì token đọc lại từ `at_entry` ở mỗi lần gọi | `contest-api.js:165-208`: `callMe(..., token)`, 4 hàm `/me` nhận `token`, mock dùng token được truyền (`mockMe(..., token)` `:291`, `:300`). Store luôn truyền token của lượt đang làm: `init` `:205`, `resync` `:312`, `drain` `:336,340`, `attachContact` `:398`, `submit` `:409-410,420`. Tab cũ gửi bằng token lượt 1 → `ALREADY_SUBMITTED` → chỉ bỏ mục của lượt mình (`:354`) | **Đạt** |
| Cao (kèm) | Không đụng lượt khác khi `at_entry` đã đổi | `clearSession` `:131-144` chỉ xóa `at_entry`/hàng đợi khi `at_entry` vẫn là lượt mình, ngược lại chỉ bỏ mục của lượt mình; `syncEntry` `:146-151` không ghi đè lượt khác; `drain` bỏ qua mục lượt khác (`:339`); `applyServer(submitted)` và `submit` dùng `dropEntryQueue` (`:236`, `:414`); `init` chặn kết quả cũ khi `state.entry` đã đổi (`:206`). Sự kiện `storage` (`:373-380`) phát `entry-changed` | **Đạt** |
| TB #1 | Mở trang lúc API-02 lỗi thì không lấy lại tiến độ | `state.synced` (`:20`, đặt `false` ở `resetState`, `true` ở `applyServer`); `flush` gọi `resync()` trước `drain` khi chưa đồng bộ (`:293`); `resync` (`:310-324`) dựng lại `answers`/`total`, phủ hàng đợi, phát `change`, `INVALID_TOKEN` → `clearSession`, đã nộp → `submitted`. Chu kỳ thử lại (`init` → `scheduleRetry`) và sự kiện `online` đều đi qua `flush` | **Đạt** |
| TB #2 | localStorage bị chặn thì không làm được trong phiên | `contest-api.js:88-115`: `memEntry` + `entryStorageBroken`, `saveEntry` ghi bộ nhớ trước; `clearEntry()` mới. `contest-store.js:47-73`: `mem` cho `at_queue`/`at_practice`, cờ `storageBroken` bật cả khi `setItem` ném lỗi (đúng trường hợp Safari riêng tư: đọc được, ghi bị từ chối). Mock `at_mock` có `mockMem` (`contest-api.js:217-236`) | **Đạt** |
| Thấp #1 | Nộp kèm contact không cập nhật `attemptNo` | `submit` `:418-422`: lượt `anon` nộp kèm contact → `getMe(entry.token)` → `syncEntry({mode, attemptNo, maxAttempts})` | **Đạt** |
| Thấp #2 | Mock `limit` trả `ATTEMPT_LIMIT` ở API-05 không contact | Đã bỏ nhánh `else if (mode === 'limit')` (`contest-api.js:377-380`); `limit` chỉ còn trong `takeContact` | **Đạt** |
| Thấp #3 | Chưa đọc `Retry-After` | `contest-api.js:194-197` đưa `retryAfter` (giây, chỉ dạng số) vào `error`; `scheduleRetry(retryAfter)` không thử sớm hơn (`:301-306`); `drain` và `resync` truyền giá trị này | **Đạt** (xem Thấp mới #2) |
| Thấp #4 | `fields: null` ở lỗi phía FE | `fail` và `readError` trả `{}` (`contest-api.js:55,62,64`); lỗi tự sinh trong store cũng `fields: {}`. `register.js:100` dùng `error.fields ? Object.keys(...).find(k => k in error.fields)` vẫn đúng với `{}` | **Đạt** |

"Cần xác minh" của review F1: `leavePractice` đã được xác nhận ở review F3. Hai mục còn lại (`answer()` chờ `flush`, mock đọc–sửa–ghi sau `await`) không đổi trong commit này, vẫn kiểm ở review F4.

### Phát hiện mới

#### [Thấp] #1 · Trả lời lại một câu khi chưa đồng bộ: `answer()` trả `stored: true` với đáp án của máy chủ

- **Vị trí**: `contest-store.js:266-274` (`answer`), `:293` (`flush` → `resync`), `:233,239` (`applyServer` thay `answers` bằng bản máy chủ và bỏ mục trùng `q` khỏi hàng đợi).
- **Tình huống**:
  1. Mở trang lúc mất mạng: `synced=false`, `answers` chỉ có hàng đợi, nên câu đã lưu ở máy chủ hiện là "chưa làm".
  2. Thí sinh chọn B cho một câu mà máy chủ đang giữ A. `answer()` xếp mục rồi `await flush()`.
  3. Có mạng: `resync` → `applyServer` đặt câu đó `{a:'A', stored:true}` và xóa mục B khỏi hàng đợi.
  4. `answer()` trả `{ ok:true, a:'A', stored:true, pending:false }`.
- **Hậu quả**: theo comment của `answer` (`:254-255`), `stored:false` mới là dấu hiệu "máy chủ giữ đáp án khác, hiện `a` của máy chủ" (AC3). Ở đây màn hình nhận `stored:true`. Nếu F4 hiển thị lựa chọn của người dùng khi `stored:true`, sẽ hiện B trong khi máy chủ giữ A. Không sai dữ liệu ở máy chủ.
- **Hướng khắc phục** (vài dòng): trong `answer()`, sau `flush`, nếu `v.a !== a` thì trả `stored:false`. Hoặc F4 luôn hiển thị theo `a` trả về và theo sự kiện `change`. Kiểm ở review F4.

#### [Thấp] #2 · `init()` gặp `429` không dùng `Retry-After`

- **Vị trí**: `contest-store.js:216` (`scheduleRetry()` không truyền `r.error.retryAfter`). `drain` và `resync` đã truyền.
- **Hướng khắc phục**: đổi thành `scheduleRetry(r.error.retryAfter)`. Máy chủ chưa trả `429` trước BE-26, nên không gấp.

#### [Thấp] #3 · `applyServer` lọc hàng đợi theo `q` mà không xét lượt

- **Vị trí**: `contest-store.js:239` (`readQueue().filter((x) => !state.answers.has(x.q))`). Dòng này có từ F1, nhưng trước đây `init` đã bỏ mọi mục của lượt khác. Từ commit này store **cố ý giữ** mục của lượt khác (`drain` `:339`, `clearSession` `:137-138`), nên dòng này không còn nhất quán.
- **Tình huống**: tab A đang làm lượt 1 (`in_progress`, chưa đồng bộ). Tab B có lượt 2 với mục offline câu X. Tab A `resync` thấy câu X đã có trong lượt 1 → xóa luôn mục câu X của lượt 2 → đáp án đó của lượt 2 không bao giờ được gửi. Rất hiếm gặp, vì muốn có lượt 2 thì thường lượt 1 đã nộp, mà khi đó code đi nhánh `dropEntryQueue`.
- **Hướng khắc phục**: đổi điều kiện thành `!(x.entry === state.entry.code && state.answers.has(x.q))`.

### Sai khác tài liệu ↔ code

- Không có sai khác mới. `entry-changed` là sự kiện nội bộ FE, không thuộc contract.
- AC FE-28 mục 7 nói "bỏ các mục của lượt cũ". Code dọn ở `init()` của lượt hiện tại (`pruneQueue`), còn `drain` ở tab cũ chỉ bỏ qua các mục đó. Kết quả như nhau, vì không mục nào được gửi bằng token của lượt khác. Chấp nhận.

### Cần xác minh

- **Màn hình chưa nghe `entry-changed`** (Worker đã ghi). Như vậy vẫn an toàn: tab cũ tiếp tục gửi bằng token lượt cũ và nhận `ALREADY_SUBMITTED`/`submitted`. Tuy nhiên thí sinh không được đưa về lượt mới. Kiểm ở review F3-sửa/F4: `exam.js` nghe `entry-changed` rồi gọi `init()`.
- **Thấp #2 của review F3** (hộp offline không tự mất): store đã có `state.synced` và phát `change` sau `resync`, nên `exam.js` có đủ tín hiệu. Kiểm ở review F3-sửa.

### Đề xuất (không bắt buộc)

- `markPractice` (`contest-api.js:118-121`) chưa có bản trong bộ nhớ. Hiện chưa gây lỗi, vì store tự ghi `at_practice` vào `mem` khi lưu đáp án luyện tập. Nếu sau này cần đọc cờ luyện tập trước khi có đáp án nào, có thể cho dùng chung `writeJson` của store.
- Đề xuất cũ (`answer()` trả ngay `ALREADY_SUBMITTED` khi `state.status === 'submitted'`) vẫn chưa làm. Không bắt buộc.

### Việc tiếp theo

- **F1-sửa đạt**, không chặn việc merge `lane/CUOC-THI-fe` về phía F1. Vẫn giữ điều kiện của review F3: không merge luồng khi **F3-sửa** chưa đạt.
- **Worker** làm 3 điểm Thấp mới khi tiện, ưu tiên làm kèm F3-sửa hoặc F4, commit riêng hoặc ghi rõ trong bàn giao:
  - Thấp #2 và #3 mỗi điểm sửa một dòng;
  - Thấp #1 xử lý cùng F4.
- **Kiểm chứng cần chạy** khi làm F3-sửa/F4 (trình duyệt):
  1. Hai tab thật: nộp lượt 1 ở tab B, đăng ký lượt 2, quay lại tab A → có `entry-changed`, màn hình chuyển sang lượt 2, máy chủ giả lượt 2 không có đáp án từ tab A.
  2. DevTools Offline → tải lại → bật mạng: tiến độ dựng lại, hộp offline mất mà không phải tải lại trang.

## Review F3-sửa (FE-26, sửa theo "Review F3") · 2026-10-18

### Phạm vi đã review

- **Đối tượng**: commit `1578319` trên `lane/CUOC-THI-fe`, đọc qua `git show` (Worker đang làm F4 trong worktree nên không đọc file đang sửa). Gồm 4 file: `register.js`, `exam.js`, `contest.css`, `tokens.css`. Đọc thêm `contest-store.js` ở cùng commit để kiểm `init`/`resync`/`entry-changed`.
- **Báo cáo Worker**: `2-ban-giao-CUOC-THI-fe.md` › "F3 · sửa sau review".
- **Chuẩn so sánh**: mục "Review F3" (1 Cao, 4 Thấp, "Cần xác minh" 1–2) và "Review F1-sửa" › "Cần xác minh"/"Kiểm chứng cần chạy"; ảnh `th-04`, `th-05`, `th-09`, `th-11`.
- **Ảnh và kết quả chạy đã xem**: 7 ảnh và 2 file kết quả trong `C:\GTSC\DMST\agent-artifacts\CUOC-THI-fe\f3-sua\`.
- **Không review được**: không chạy web hay trình duyệt (Orchestrator không build/chạy). Phần chạy thử dựa trên kết quả Worker ghi lại.

### Đối chiếu các phát hiện của "Review F3"

| Mục | Code ở `1578319` | Kết quả |
|---|---|---|
| **Cao**: bấm đăng ký lần hai tạo thêm lượt | `register.js:121-129`: sau `saveEntry`, giữ `busy` và nút khóa trong `try { await registeredHandler() } finally { setBusy(false) }`. `enterExam` (`exam.js:321-326`) chờ `init()` (API-02) rồi `go('#ngan-hang')` | **Đạt**. Kiểm bằng API thật, API-02 trễ 3–4 giây: 1 POST, CSDL +1 lượt cho cả có tên và ẩn danh (`ket-qua-playwright.txt` dòng 1–4, 12–13). Bản đối chứng `register.js` cũ: 2 POST, +2 lượt (`doi-chung-register-cu.txt`). Đối chứng chứng minh được phép thử bắt đúng lỗi |
| Yêu cầu từ review F1-sửa: màn hình nghe `entry-changed` | `exam.js:307-313`: `init()` → đặt `offline` → `route(false)` | **Đạt**. Lượt bị xóa ở tab khác (`cur` null) thì `init()` trả `register` và `route` về form, cũng đúng. Đã chạy hai tab (dòng 6) |
| Thấp #1 "Làm tiếp từ câu k" | Không đổi; Worker ghi chuyển F4 | Chấp nhận (đúng hướng của review) |
| **Thấp #2**: hộp "Chưa kết nối được máy chủ" không tự mất | Không đổi. Worker ghi "đã xử lý ở F1-sửa" | **Chưa đạt**, xem phát hiện bên dưới |
| Thấp #3: màu cứng | `tokens.css:36-38` thêm `--c-lock-bg/-n/-text`; `contest.css:105,107,139` dùng biến; giá trị giữ nguyên | **Đạt** |
| Thấp #4: mất focus ở nút sau `refresh()` | `exam.js:256-262` `focusSelector()` (href, `data-start`, `data-retry`); `refresh()` dùng selector này | **Đạt** theo đọc code. Giá trị `data-start` là số chuyên đề đã `esc`, đặt trong ngoặc kép nên selector hợp lệ. Worker ghi chưa chạy bằng bàn phím |
| "Cần xác minh" 1–2: ảnh | Ảnh đã chép ra thư mục chung, có ảnh thí sinh có tên ở 1440px | **Đạt**, xem "So ảnh" |

### So ảnh

| Ảnh Worker | Ảnh tham chiếu | Nhận xét |
|---|---|---|
| `th-11-menu-co-ten-1440.png`, `th-04-menu-khoa-co-ten-1440.png` (hai ảnh cùng một trạng thái) | `th-11` | Khớp: hộp xanh "Đã đăng ký. Mã dự thi của bạn là AD-96MP2U. Đây là lượt thứ 1 trên 2.", thẻ Thí sinh có mã, họ tên, "Lượt thứ 1 / 2". Khác có chủ đích: mã `AD-…` thay số điện thoại; ảnh chụp lúc CĐ1 chưa xong nên có 7 hàng khóa, còn `th-11` chụp lúc CĐ1 đã xong |
| `th-04-menu-khoa-an-danh-1440.png` | `th-04` | Khớp: hộp xám ẩn danh, CĐ1 "làm chuyên đề này trước", 7 hàng khóa nền xám có ổ khóa, hộp hồng, thẻ "Không xét giải". Thiếu nút "Dự thi có tên để xét giải" (đã chấp nhận, F5) |
| `th-05-gioi-thieu-cd1-1440.png` | `th-05` | Khớp: nút quay lại, nhãn, các đoạn, khối "Hiểu nhanh mấy từ" mở với 6 từ, hai nút, CĐ1 đậm trong cột bên. Tiêu đề xuống hai dòng vì khung nội dung hẹp hơn ảnh (~788px so với ~824px, do container chung của trang). Chấp nhận |
| `th-09-menu-mo-1440.png` | `th-09` | Khớp: CĐ1 ✓ "đã làm xong", CĐ2–8 mở có mũi tên, không còn hộp hồng, "Đã xong 1 / 8", thanh tiến độ có đoạn đỏ |
| `menu-mo-1024.png`, `menu-mo-390.png` | (không có ảnh tham chiếu riêng) | 1024: hai cột, tên trong cột bên cắt một dòng bằng dấu "…". 390: cột bên xuống dưới, không tràn ngang |

### Phát hiện

#### [Thấp] Hộp "Chưa kết nối được máy chủ" vẫn không tự mất khi có mạng lại (Thấp #2 của "Review F3" chưa sửa)

- **Vị trí**: `exam.js` ở `1578319`: biến `offline` chỉ được gán ở `boot`, `enterExam`, handler `entry-changed`, và handler `token` (đặt `false`). `refresh()` (`:265-277`) và `on('change', refresh)` (`:305`) không đổi biến này. `menuHtml` vẫn vẽ hộp vàng khi `offline` là `true`.
- **Bằng chứng**:
  - Store đã làm phần của nó: `resync()` (`contest-store.js:310-323`) gọi `applyServer` → `state.synced = true` rồi `emit('change')`. Nhưng `exam.js` không đọc `state.synced`.
  - Báo cáo Worker ghi "Đã xử lý ở F1-sửa … Không đổi gì thêm". Ghi như vậy không đúng: F1-sửa chỉ làm phía store. "Review F3" › Thấp #2 đã ghi rõ phần còn lại: "`exam.js` đặt `offline = false` rồi `refresh()`". Kiểm chứng số 2 trong "Review F1-sửa" › "Việc tiếp theo" (DevTools Offline → tải lại → bật mạng → hộp mất) không có trong kết quả Playwright.
- **Tình huống**: mở trang lúc mất mạng thì hiện hộp vàng. Bật mạng lại: `flush` → `resync` thành công, tiến độ dựng lại đúng, nhưng hộp "Chưa kết nối được máy chủ… Tiến độ có thể chưa mới nhất" vẫn còn cho tới khi tải lại trang. Không sai dữ liệu, chỉ là thông báo sai.
- **Hướng khắc phục**: một dòng ở đầu `refresh()`: `if (state.synced) offline = false;`. Hoặc tính thẳng `offline` từ `!state.synced && !!state.entry` thay cho biến riêng.
- **Kiểm chứng**: Playwright `context.set_offline(True)` → tải lại (thấy hộp vàng) → `set_offline(False)` và phát `online` → hộp vàng mất, không tải lại trang.

### Sai khác tài liệu ↔ code

Không có sai khác mới. Các sai khác đã ghi ở "Review F3" không đổi: hộp và thẻ cột bên ở chế độ luyện tập, nút "Dự thi có tên để xét giải" để F5, hero viết cứng "200 câu" để F5.

### Cần xác minh

- **Khoảng hở rất ngắn sau `registeredHandler`**. Khi hash đang khác `#ngan-hang` (thường là trường hợp đăng ký từ `#dang-ky`), `go()` chỉ gán `location.hash`. `route` chạy ở sự kiện `hashchange` (task sau), còn `finally { setBusy(false) }` chạy trước đó (microtask). Như vậy có một nhịp task mà form còn hiện và nút đã bật. Thực tế gần như không bấm kịp. Playwright bấm thêm hai lần vẫn chỉ có 1 POST. Không xếp là lỗi. Nếu muốn kín hẳn, xem đề xuất.
- **Focus bằng bàn phím sau `refresh()`**: Worker chưa tự động hóa. Kiểm khi làm F4: đặt focus vào nút `data-start`, cho hàng đợi gửi xong, kiểm `document.activeElement` vẫn là nút đó.

### Đề xuất (không bắt buộc)

- Trong `enterExam`, ẩn `#regview` và hiện "Đang tải tiến độ…" ngay trước `await init()`, như `boot` đang làm. Cách này bịt khoảng hở ở trên, và người dùng thấy có phản hồi trong 3–15 giây chờ API-02.
- `th-11-menu-co-ten-1440.png` và `th-04-menu-khoa-co-ten-1440.png` là cùng một ảnh. Lần sau, nếu chụp `th-11` sau khi xong CĐ1 thì so được trọn trạng thái của ảnh tham chiếu.

### Kết luận

**F3-sửa đạt.** Lỗi **Cao** (đăng ký hai lần tạo thêm lượt) đã sửa đúng. Phép thử dùng API thật, có bản đối chứng cho thấy lỗi tái hiện trên code cũ và mất trên code mới. `entry-changed`, Thấp #3, Thấp #4 đạt. Ảnh khớp `th-04/05/09/11`, trừ các khác biệt đã chấp nhận.

Còn **1 điểm Thấp chưa sửa** (Thấp #2: hộp offline). Báo cáo Worker ghi điểm này là đã xử lý, nhưng code chưa xử lý. Không chặn merge, vì không làm sai dữ liệu. Tuy vậy, cần sửa trong **F4**: Worker đang sửa `exam.js` ở F4, và thay đổi chỉ một dòng.

**Việc tiếp theo cho Worker** (ghi vào bàn giao F4):
1. Thấp #2: `refresh()` đặt `offline = false` khi `state.synced`. Chạy kiểm chứng offline → online ở trên và ghi kết quả.
2. Thấp #1 ("Làm tiếp từ câu k ›"), như đã ghi.
3. Kiểm focus bàn phím sau `refresh()` (mục "Cần xác minh").

**Rủi ro còn lại**: thấp. Điều kiện merge của "Review F3" (F1-sửa và F3-sửa đều đạt) đã đủ. Task I vẫn phải chạy toàn luồng với BE thật.

## Review F4a (FE-27a màn Câu hỏi, kèm 3 lỗi Thấp của "Review F1-sửa") · 2026-10-18

### Phạm vi đã review

- **Đối tượng**: hai commit trên `lane/CUOC-THI-fe`, đọc qua `git -C C:\GTSC\DMST\wt\CUOC-THI-fe show`:
  - `2d30e62`: `contest-store.js`, 3 dòng;
  - `3bf7dae`: `exam.js` (+229/−17) và `contest.css` (+14).
  - Đọc thêm `contest-store.js` và `quiz-ui.js` ở `3bf7dae` để kiểm luồng `answer`/`flush`/`resync` và focus.
- **Báo cáo Worker**: `2-ban-giao-CUOC-THI-fe.md` › "F4a · FE-27a màn Câu hỏi".
- **Chuẩn so sánh**:
  - `1-thiet-ke.md` › AC FE-27, AC FE-28 mục 1/6, bảng Task › F4, "Đối chiếu" (làm lại);
  - sheet "Công việc" r23 (FE-27): mô tả, hành vi, responsive, tiêu chí nghiệm thu;
  - bản dựng `vQ`/`answer`/`next` (dòng 1556–1640);
  - ảnh `th-06`, `th-07`, `mb-07` (`tt-01..03` đã so ở review F2; ở đây chỉ so lại trong màn thi);
  - các việc chuyển sang F4 ở "Review F3-sửa" › "Việc tiếp theo", "Cần xác minh", "Đề xuất".
- **Ảnh và kết quả đã xem** (`C:\GTSC\DMST\agent-artifacts\CUOC-THI-fe\f4a\`): `th-06-cau-hoi-chua-chon-1440`, `tt-02-chon-sai-1440`, `mb-07-chon-sai-390`, `offline-ghi-chu-1440`, `intro-lam-tiep-1440`, `ket-qua-playwright.txt`. Chưa xem từng ảnh `duo-*` (14 ảnh); dựa vào 14 dòng PASS "không tràn ngang" trong kết quả.
- **Không review được**: không chạy web hay trình duyệt (Orchestrator không build/chạy). Phần chạy thử dựa trên kết quả Worker ghi lại.
- **Ngoài phạm vi F4a** (theo bàn giao, để F4b): đồng hồ đọc, `data-read-timer-factor`, màn Xong chuyên đề, làm lại.

### Đối chiếu 3 lỗi Thấp của "Review F1-sửa" (`2d30e62`)

| Mục | Code | Kết quả |
|---|---|---|
| #1 `answer()` trả `stored:true` khi máy chủ giữ đáp án khác | `contest-store.js:274`: `v.a !== a` thì trả `{ ...v, stored:false }` | **Đạt**. `pick` (`exam.js:310`) vẽ lại theo `r.a` khi khác lựa chọn. Còn một nhánh chưa phủ, xem Thấp #3 bên dưới |
| #2 `init()` bỏ qua `Retry-After` | `:216` `scheduleRetry(r.error.retryAfter)` | **Đạt** |
| #3 `applyServer` lọc hàng đợi không xét lượt | `:239` thêm `x.entry === state.entry.code &&` | **Đạt**. `state.entry` luôn có giá trị khi `applyServer` chạy (`init` `:204`, `resync` `:312`) |

### Đối chiếu AC FE-27 (phần F4a)

| AC / mô tả (sheet r23, `1-thiet-ke.md` › FE-27) | Code `3bf7dae` | Kết quả |
|---|---|---|
| Hàng đầu "‹ Chuyên đề N" + "Câu i / n"; thanh tiến độ; nhãn "Mã … · loại"; tình huống; câu hỏi; đáp án FE-23 | `questionScreenHtml` `exam.js:257-273` | Đạt; khớp `th-06`, `th-07` |
| Thanh tiến độ = (số câu đã qua + 1 nếu câu hiện tại đã trả lời) / tổng | `:267`, `:288` | Đạt |
| Chọn là chốt; tô màu, hiện kết quả ngay; gửi API-03 | `pick` `:294-312`; `optionsHtml` khóa nút khi đã chọn | Đạt. Playwright: 1 request, CSDL có dòng ngay (dòng 10–11, 19) |
| Focus tới "Đúng./Chưa đúng." sau khi chọn | `paintAnswer(…, true)` → `focusResult` | Đạt (dòng 7) |
| Câu đã trả lời: hiện sẵn, nút đi tiếp mở ngay | `questionScreenHtml` đọc `getAnswer` | Đạt (dòng 17–18) |
| Vào lại chuyên đề: tiếp từ câu chưa trả lời đầu tiên | `firstUnanswered` `:77-80`, `route` `:419` | Đạt |
| **Tải lại giữa chuyên đề: về danh sách chuyên đề** | `boot` → `route(false)` giữ hash `#chuyen-de-N/cau-hoi` → mở lại màn câu hỏi | **Khác tài liệu**, xem Trung bình #1 |
| Lỗi lưu: không chặn, dòng nhỏ "Chưa lưu được, sẽ tự gửi lại.", vào hàng đợi | `PENDING_TEXT` `:228`, `noteText`, `refresh` → `paintNote` | Đạt về hành vi; câu chữ khác, xem Thấp #1 |
| `ALREADY_SUBMITTED` → màn kết quả lượt thi | `on('submitted')` `:491-495` về `#ngan-hang` | Chấp nhận tạm: màn kết quả là F5 |
| FE-28 mục 6: `CONTEST_CLOSED`/`UNKNOWN_QUESTION`/`INVALID_OPTION` bỏ khỏi hàng đợi, báo lý do | `ERR_TEXT` `:221-226`, `pick` `:304-308`, `on('dropped')` `:496-501` | Đạt theo đọc code; chưa chạy thử (`contestEnd` chưa đổi) |
| Mobile: nút rộng 100% | `contest.css` `@media (max-width:480px) .qactions .qnav { width:100% }` | Đạt (`mb-07-chon-sai-390`). Dòng đếm lùi xếp dọc: F4b |
| Màn câu hỏi không dựng lại khi store phát `change` | `refresh` `:441-445` chỉ vẽ cột bên + ghi chú | Đạt, giữ focus và vùng `aria-live` |
| "Làm tiếp từ câu k ›" (Thấp #1 của "Review F3") | `startLabel` `:157-164` | Đạt (Playwright dòng 21) |

### Đối chiếu việc chuyển sang F4 từ "Review F3-sửa"

| Việc | Trạng thái ở `3bf7dae` | Kết quả |
|---|---|---|
| **Thấp #2**: hộp "Chưa kết nối được máy chủ" không tự mất | `refresh()` (`exam.js:438-456`) vẫn không đổi `offline`; `offline` vẫn chỉ được gán ở `boot`, `enterExam`, `entry-changed`, `token` | **Chưa làm**, và bàn giao F4a **không nhắc** tới. Lần thứ hai điểm này bị bỏ sót. Xem Thấp #2 |
| Kiểm focus bàn phím sau `refresh()` ở danh sách/giới thiệu | Không có trong `ket-qua-playwright.txt`; bàn giao ghi "chưa kiểm bàn phím bằng tay" | **Chưa làm** |
| Đề xuất: ẩn `#regview`, hiện "Đang tải tiến độ…" trước `await init()` trong `enterExam` | `enterExam` `:516-520` không đổi | Chưa làm. Đây là **đề xuất**, không bắt buộc. Nên làm kèm F4b vì chỉ vài dòng |

### So ảnh

| Ảnh Worker | Ảnh tham chiếu | Nhận xét |
|---|---|---|
| `th-06-cau-hoi-chua-chon-1440` | `th-06` | Bố cục khớp. Ảnh bị mờ vì chụp giữa hiệu ứng `.qin` (`quiz.css:87`, 0,35 s), không phải lỗi giao diện. Khác: Worker hiện nút "Đã hiểu, sang câu tiếp theo ›" bị khóa ngay khi chưa chọn, còn `th-06` và bản dựng (`vQ`, chỉ vẽ nút khi `a!=null`) không có nút. Xem Thấp #4 |
| `tt-02-chon-sai-1440` | `th-07` | Khớp: A "Bạn chọn", B "Đáp án phù hợp", "Chưa đúng. Đáp án phù hợp là B.", giải thích 4 dòng, B tô xanh, hộp "Hành động an toàn". Chưa có dòng đếm lùi và nút chưa khóa (F4b) |
| `mb-07-chon-sai-390` | `mb-07` | Khớp. Nút đi tiếp rộng 100%. Nhãn "Bạn chọn/Đáp án phù hợp" xuống dòng dưới chữ. Cách này khác ảnh nhưng đúng AC FE-23 (< 480px xuống dòng) |
| `offline-ghi-chu-1440` | (không có) | Ghi chú chờ gửi hiện dưới đáp án, nút "‹ Câu trước" và nút đi tiếp mở. Ghi chú dùng màu đỏ `--c-danger-600`, xem Đề xuất |
| `intro-lam-tiep-1440` | `th-05` | Không đọc được: chụp giữa hiệu ứng nên gần như trắng. Chữ "Làm tiếp từ câu 3 ›" chỉ xác nhận được qua Playwright dòng 21 |

### Phát hiện

#### [Trung bình] #1 · Tải lại trang giữa chuyên đề mở lại màn câu hỏi, tài liệu yêu cầu về danh sách chuyên đề

- **Vị trí**: `exam.js:525-538` (`boot` → `route(false)`), `:82-89` (`parseHash` nhận `#chuyen-de-N/cau-hoi`), `:416-421`.
- **Bằng chứng**:
  - sheet "Công việc" r23 › Hành vi: "Tải lại trang giữa chuyên đề thì quay về danh sách chuyên đề; vào lại chuyên đề thì tiếp tục từ câu chưa trả lời đầu tiên".
  - `1-thiet-ke.md` › AC FE-28 mục 1: "tải lại giữa chừng thì về đúng danh sách chuyên đề với tiến độ đã lưu"; Kịch bản I bước 1: "tải lại → còn 3 câu, vào CĐ1 tiếp từ câu 4".
  - Playwright dòng 20 xác nhận hành vi hiện tại: "tai lai: … Cau 3 / 19".
  - Bàn giao F4a không ghi đây là lựa chọn có chủ ý.
- **Tình huống**: thí sinh đang ở câu 3 của CĐ1 và tải lại trang. Trang mở lại màn câu hỏi ở câu 3, không về danh sách. Kịch bản tích hợp bước 1 sẽ không khớp với kết quả mong đợi.
- **Hướng khắc phục**: theo tài liệu, trong `boot` nếu `parseHash().view === 'q'` thì `history.replaceState(null, '', '#ngan-hang')` trước `route(false)`. Bấm vào chuyên đề trong lúc dùng trang vẫn giữ hash `/cau-hoi`. Nếu Worker hoặc người dùng muốn giữ cách hiện tại (tiện hơn), cần người dùng chốt và ghi lại. Orchestrator khuyến nghị làm theo tài liệu: chỉ một dòng, khớp kịch bản I.

#### [Thấp] #1 · Câu chữ khác sheet FE-27

- **Vị trí**:
  - `exam.js:228` `PENDING_TEXT` = "Chưa gửi được lên máy chủ. Đáp án sẽ tự gửi lại khi có mạng."; sheet ghi "Chưa lưu được, sẽ tự gửi lại."
  - `exam.js:247-249`: nút ở câu cuối ghi "Đã hiểu, hoàn thành chuyên đề ›"; sheet và bản dựng (`vQ`) ghi "Đã hiểu, xem kết quả ›".
- **Hướng khắc phục**: dùng đúng câu của sheet. Nút câu cuối sửa ở F4b, cùng lúc với màn Xong chuyên đề.

#### [Thấp] #2 · Hộp "Chưa kết nối được máy chủ" vẫn không tự mất (lặp lại, chưa sửa từ "Review F3")

- **Vị trí**: `exam.js:128`, `:438-456`.
- **Bằng chứng**: xem "Review F3-sửa" › Phát hiện. Code ở `3bf7dae` không đổi phần này. Bàn giao F4a không nhắc tới.
- **Hướng khắc phục**: như cũ: đầu `refresh()` thêm `if (state.synced) offline = false;`. Kiểm bằng Playwright: `set_offline(True)` → tải lại → thấy hộp vàng → `set_offline(False)` → hộp mất, không tải lại trang.

#### [Thấp] #3 · Màn câu hỏi không vẽ lại đáp án khi `resync` thay bằng đáp án của máy chủ

- **Vị trí**: `exam.js:441-445` (`refresh` ở màn câu hỏi chỉ gọi `renderSide` + `paintNote`), `pick` `:309-311`.
- **Tình huống**:
  1. Mở trang lúc mất mạng (`state.synced=false`), rồi chọn B ở câu X.
  2. `answer` → `flush` → `resync` lỗi, nên trả `pending:true`, `a:'B'`.
  3. Có mạng lại: `resync` → `applyServer` lấy đáp án A của câu X (đã trả lời ở tab khác) và phát `change`.
  4. Màn hình vẫn tô B và hiện "Chưa đúng/Đúng" theo B, trong khi máy chủ giữ A.
  
  Không sai dữ liệu. Chuyển câu rồi quay lại thì hiển thị đúng. Rất hiếm gặp: cần hai tab và mất mạng.
- **Hướng khắc phục**: trong nhánh `current.view === 'q'` của `refresh()`, nếu `getAnswer(curQuestion().code)?.a` khác đáp án đang vẽ thì gọi `paintAnswer(q, a, false)`. Đáp án đang vẽ có thể giữ trong `qs.shown`.

#### [Thấp] #4 · Lỗi nhỏ về focus, tải và thứ tự hiển thị

- **Mất focus khi lưu lỗi**: `pick` `:304-307` và `on('dropped')` `:496-501` gọi `paintAnswer(q, null, false)`. `#qhead`, nơi đang giữ focus, bị xóa, nên focus rơi về `body`. Người dùng bàn phím phải Tab lại từ đầu trang. **Sửa**: sau khi vẽ lại, focus nút đáp án đầu tiên, hoặc cho `#qnote` `tabindex="-1"` rồi focus vào đó.
- **Giới thiệu chờ QUIZ-02 không có báo hiệu, và `route` có thể chạy chồng**: `route` `:404-412` đợi `ensureQuestions` trước khi vẽ cả màn giới thiệu. Trong lúc chờ, màn cũ vẫn hiện. Nếu người dùng đổi hash trong lúc đó (bấm Back, bấm chuyên đề khác), lần `route` cũ chạy xong sau và vẽ đè lên màn mới, kèm `replaceState` về hash cũ. **Sửa**: thêm bộ đếm `routeSeq`, sau mỗi `await` thoát nếu đã có lần `route` mới hơn. Có thể hiện "Đang tải câu hỏi…" như `boot`.
- **Nút đi tiếp hiện (khóa) trước khi chọn**: `th-06` và bản dựng không có nút này lúc chưa chọn. Khác nhỏ về giao diện. Có thể giữ, vì nút "‹ Câu trước" cùng hàng cần chỗ, nhưng cần nêu trong bàn giao.

#### [Thấp] #5 · Vận hành: `taskkill /IM dotnet.exe` dừng mọi tiến trình dotnet

- **Bằng chứng**: bàn giao F4a › "Giới hạn / lưu ý".
- **Tình huống**: lệnh này tắt cả web của luồng `CUOC-THI-be` hay phiên chính (cổng 11000/11002), và có thể làm hỏng build của phiên khác đang chạy.
- **Hướng khắc phục**: dừng đúng tiến trình đã mở (giữ PID từ `Start-Process -PassThru`, hoặc tìm theo cổng bằng `Get-NetTCPConnection -LocalPort 11001`).

### Sai khác tài liệu ↔ code

| Điểm | Loại | Ghi chú |
|---|---|---|
| Tải lại giữa chuyên đề | Code khác tài liệu | Trung bình #1; khuyến nghị theo tài liệu |
| Nút "‹ Câu trước" | Thêm so với tài liệu và bản dựng | Không đổi contract, không ảnh hưởng điểm (không gửi lại API-03). Chấp nhận; F4b cần bảo đảm quay lại câu đã làm không chạy đồng hồ |
| Hash `#chuyen-de-N/cau-hoi` | Chi tiết Worker tự đặt | Chấp nhận |
| Giới thiệu chuyên đề đã xong ghi "Xem lại N câu ›" | Đề xuất của Worker, tạm thời | F4b thay bằng "Làm lại" và thêm dòng nhắc "điểm chỉ tính lần đầu" (sheet r23) |
| `ALREADY_SUBMITTED` về danh sách thay vì màn kết quả | Chưa đủ (chờ F5) | Đã ghi trong code |

### Cần xác minh

- **`CONTEST_CLOSED` khi trả lời**: chưa chạy. Ngoài ra, câu trở lại chưa trả lời nên người dùng chọn lại được, và mỗi lần chọn lại gửi thêm một yêu cầu `403`. Kiểm ở F4b hoặc task I: đổi `contestEnd` về quá khứ, rồi xem thông báo và số request.
- **Focus bàn phím sau `refresh()`** ở danh sách/giới thiệu: vẫn chưa kiểm (đã chuyển từ "Review F3-sửa").
- Ảnh `duo-*`: Orchestrator chưa xem từng ảnh. Kết quả Playwright đạt cả 14 độ rộng.

### Đề xuất (không bắt buộc)

- Ghi chú chờ gửi (`.qnote`) đang dùng màu đỏ báo lỗi (`--c-danger-600`) cho cả trạng thái bình thường "đang chờ mạng". Nên dùng màu nhạt hơn (`--c-text-4`, hoặc màu cảnh báo) cho `pending`, và chỉ giữ đỏ cho lỗi bị từ chối.
- Khi chụp ảnh, chờ hết hiệu ứng (`page.wait_for_timeout(400)`) hoặc giả lập `prefers-reduced-motion: reduce`, để ảnh `th-06`/giới thiệu đọc được.
- Lưu ý cho F4b: theo sheet, câu đã trả lời mở nút ngay. Như vậy chọn đáp án rồi tải lại trang (hoặc về danh sách rồi vào lại) sẽ bỏ qua đồng hồ của câu đó. Đây là hệ quả của tài liệu, không phải lỗi. Ghi vào bàn giao F4b để chủ quản biết khi chốt "Câu hỏi mở" #2.

### Kết luận

**F4a đạt.** Không có lỗi Nghiêm trọng hay Cao.

- Màn câu hỏi đúng bố cục `th-06`/`th-07`/`mb-07`, lưu API-03 thật, CSDL có dòng ngay, không gửi trùng, làm tiếp từ câu chưa làm, ghi chú chờ gửi tự mất.
- 3 lỗi Thấp của "Review F1-sửa" sửa đúng.
- Build được (Worker chạy `run-local -NoRun`; Orchestrator không build lại).
- Playwright với API thật đạt 42/43. Mục không đạt là lỗi console do chính bước tắt mạng gây ra, chấp nhận được.

**Việc chuyển sang F4b** (Worker ghi rõ từng mục trong bàn giao F4b):

1. **Trung bình #1**: tải lại giữa chuyên đề thì về `#ngan-hang` (theo tài liệu), trừ khi người dùng chốt khác.
2. **Thấp #2** (lần thứ ba nhắc): `refresh()` đặt `offline = false` khi `state.synced`. Chạy kiểm chứng offline → online và ghi kết quả.
3. Thấp #1: câu chữ "Chưa lưu được, sẽ tự gửi lại." và "Đã hiểu, xem kết quả ›".
4. Thấp #3, Thấp #4 (focus khi lưu lỗi, `routeSeq`). Thấp #5 khi dừng web.
5. Kiểm focus bàn phím sau `refresh()` ở danh sách/giới thiệu (tồn từ "Review F3-sửa").
6. Nên làm: ẩn form và hiện "Đang tải tiến độ…" trong `enterExam` (đề xuất từ "Review F3-sửa").
7. Phần chính của F4b theo sheet r23: đồng hồ đọc (`sec × data-read-timer-factor`, hệ số rỗng/sai/âm → 1, nhận `0,5`; `sec` thiếu hoặc 0 → mở ngay, **không** dùng mặc định 30 như bản dựng), `leaveQuestion` dừng đồng hồ, màn Xong chuyên đề (`th-08`, câu chữ đã sửa), "Làm lại chuyên đề N" theo "Đối chiếu" (không gọi API-03), dòng nhắc ở giới thiệu khi chuyên đề đã xong, dòng đếm lùi xếp dọc trên mobile.
8. Kiểm chứng F4b: hệ số 1 (đọc số giây vài câu), hệ số 0, `CONTEST_CLOSED` (mục "Cần xác minh"), so `th-07`, `th-08`, `mb-07` sau khi hết hiệu ứng.

**Rủi ro còn lại**: thấp. Không có thay đổi contract hay dữ liệu. Không merge luồng FE trước khi F4b đạt; đây là điều kiện của gói F4, không phải lỗi của F4a.
