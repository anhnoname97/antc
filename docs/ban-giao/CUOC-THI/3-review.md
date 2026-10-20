# CUOC-THI · Review

## Review F2 (luồng fe) · 2026-10-17

Người review: Orchestrator (`/quality-check`). Chỉ đọc, không build, không chạy web.

### Phạm vi đã review

- **Đối tượng**: commit `3ac219b` trên `lane/CUOC-THI-fe` (worktree `C:\GTSC\DMST\wt\CUOC-THI-fe`): `wwwroot/assets/js/quiz/quiz-ui.js` (mới, 112 dòng), `wwwroot/assets/css/quiz.css` (mới, 99 dòng), `wwwroot/assets/css/tokens.css` (+1 dòng `--c-disabled`). Không có file nào ngoài ranh giới luồng fe; không đụng C#, view, uSync, `docs/`.
- **Chuẩn so sánh**:
  - `Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › "Công việc" › FE-23 (mô tả, hành vi, responsive, tiêu chí nghiệm thu).
  - `1-thiet-ke.md` › AC FE-23 và task F2.
  - Bản dựng `antoantaichinh-ban-dung-thu.html`: CSS dòng 95–125, `result()` 1426–1432, `drawQ()` 1433–1452, `drawDots()` 1421–1425, `drawSum()` 1454–1467.
  - Ảnh `tt-02-cau-hoi-chon-sai.png`, `tt-03-cau-hoi-chon-dung.png`.
  - QĐ: không có QĐ riêng cho FE-23.
- **Báo cáo Worker**: `2-ban-giao-CUOC-THI-fe.md` › F2.
- **Không review được**:
  - Chưa thấy giao diện thật: thành phần chưa được nối vào trang nào (đúng phạm vi F2). Orchestrator không dựng trang thử.
  - Ảnh chụp kiểm chứng của Worker nằm trong scratchpad của Worker, không có trong repo.

### Đối chiếu tiêu chí FE-23

| Tiêu chí (sheet "Công việc" › FE-23) | Kết quả | Bằng chứng |
|---|---|---|
| `.qopt` rộng 100%, viền `#DDE4ED`, bo 8px, ô chữ cái 36×36 nền `#F7F7F7` chữ `#5C0F0B` đậm 800, nội dung 16.5px | Đạt | `quiz.css:19-27` (16.5px = `1.03125rem`) |
| Trạng thái `.right` / `.wrong` / `.dim`, nhãn "✓ Đáp án phù hợp" / "✕ Bạn chọn", mọi nút disabled | Đạt | `quiz-ui.js:46-55`, `quiz.css:32-36`; khớp bản dựng 1441-1447 |
| Khối kết quả: "Đúng."/"Chưa đúng." + "Đáp án phù hợp là X.", `.qexp` dòng đúng nền xanh, hộp "Hành động an toàn" | Đạt | `quiz-ui.js:61-76`, `quiz.css:43-51`; khớp `result()` 1426-1432 |
| Hộp "Tình huống" khi có `sit` | Đạt | `quiz-ui.js:30-33`, `quiz.css:10-11` |
| `.qbar` cao 4px, `.qdot` 44×44 (hiện tại nền đỏ sẫm, chấm xanh/đỏ), `.qrow`, `.qnav` | Đạt, màu nền `.qbar` lệch (xem phát hiện 2) | `quiz.css:5-8, 53-87`; `quiz-ui.js:79-100` |
| Câu 4 đáp án và câu 2 đáp án Đúng–Sai, không có ô trống | Đạt (theo code; chưa thấy ảnh) | `optionsHtml` chỉ dựng đúng số phần tử `opt` (`quiz-ui.js:44-58`); thêm `.qopts--duo` |
| Hàm dựng HTML dùng chung, mọi chuỗi từ dữ liệu được thoát ký tự | Đạt | `esc()` thoát `& < > " '` (`quiz-ui.js:11-15`); mọi chỗ chèn `q`, `opt`, `exp`, `sit`, `safe`, `ans`, nhãn, thuộc tính đều qua `esc()`. Chỉ `st` của `dotsHtml` và `kind` không qua `esc()`, nhưng hai giá trị này do code gọi truyền vào, không lấy từ dữ liệu |
| Hover: viền `#E53935`, nâng 2px, ô chữ cái nền `#FDECEA` | Đạt | `quiz.css:28-29` |
| Focus tới dòng kết quả sau khi chọn; vùng kết quả `aria-live="polite"` | Đạt | `ID_RESULT='qhead'`, `tabindex="-1"`, `focusResult()` (`quiz-ui.js:75, 103-107`); `.qlive aria-live="polite"` luôn có (`:62, 74`) |
| < 480px nhãn xuống dòng dưới nội dung | Đạt | `quiz.css:90-94` (`flex-basis: 100%`, `padding-left: 50px` = 36 + 14, thẳng với chữ) |
| Không `style="..."`, màu và cỡ chữ từ `tokens.css`, cỡ chữ `rem` | Đạt | Grep `style=` trong 2 file mới: 0. Có `#fff` và `rgba(30,30,30,.1)` viết thẳng, nhưng `components.css` hiện cũng dùng như vậy (11 chỗ), nên không tính là lỗi |
| Giống 3 ảnh tham chiếu | **Chưa xác nhận được** | Xem "Cần xác minh" |

### Phát hiện

Không có phát hiện mức Nghiêm trọng, Cao hay Trung bình.

#### 1. [Thấp] Nút `.qnav.o` khi disabled vẫn đổi màu lúc hover

- **Vị trí**: `quiz.css:59` (`.qnav.o:hover`) và `quiz.css:62` (`.qnav:disabled`).
- **Bằng chứng**: `.qnav.o:hover` có độ ưu tiên (0,3,0), cao hơn `.qnav:disabled` (0,2,0). Vì vậy khi rê chuột, `background` và `border-color` của luật hover thắng luật disabled. Với nút đặc thì không lỗi: `.qnav.f:disabled` (0,3,0) đứng sau `.qnav.f:hover` nên thắng. Trong bản dựng chỉ có `.qnav.f:disabled` (dòng 125).
- **Tình huống**: FE-27 khóa nút "Câu trước" trong lúc đồng hồ đọc chạy, rồi người dùng rê chuột vào nút → nút đổi sang nền hồng, viền đỏ sẫm như đang bấm được, dù con trỏ là `not-allowed`.
- **Cách sửa**: viết `.qnav.o:hover:not(:disabled)` (và tương tự cho `.qnav.f:hover`), hoặc thêm `.qnav.o:disabled` vào luật disabled.

#### 2. [Thấp] Nền thanh tiến độ khác bản dựng

- **Vị trí**: `quiz.css:5-6`.
- **Bằng chứng**: bản dựng dòng 115 dùng `.qbar{background:#F1E4E2}`. Code dùng `var(--c-tint-border)` = `#F3C5C0`, hồng đậm hơn thấy rõ. Trong ảnh `tt-02`/`tt-03`, phần chưa chạy của thanh là màu hồng rất nhạt.
- **Tình huống**: so ảnh `tt-01..03` thì vạch nền thanh tiến độ đậm hơn ảnh tham chiếu.
- **Cách sửa**: thêm biến `--c-track: #F1E4E2` (hoặc tên tương đương) vào `tokens.css` rồi dùng biến này.

#### 3. [Thấp] Chú thích và cách dùng `resultHtml` dễ gây lồng hai vùng `aria-live`

- **Vị trí**: `quiz-ui.js:59-62` và `2-ban-giao-CUOC-THI-fe.md` › "Cách dùng".
- **Bằng chứng**: chú thích ghi "thay noi dung vung nay khi chon xong", nhưng `resultHtml()` trả về **cả** thẻ bọc `<div class="qlive" aria-live="polite">`.
  - Nếu F4 làm theo chú thích, tức gán `liveEl.innerHTML = resultHtml(q, a)`, thì sẽ có hai `aria-live` lồng nhau.
  - Nếu F4 dựng lại cả câu như bản dựng, vùng live được tạo mới cùng với nội dung, nên phần lớn trình đọc màn hình sẽ không đọc. Lúc đó chỉ còn việc chuyển focus giúp người dùng nghe kết quả. Đây cũng là cách bản dựng đang chạy, và AC vẫn đạt nhờ focus.
- **Cách sửa**: chọn một trong hai, rồi sửa chú thích cho khớp:
  - tách hàm `resultBodyHtml(q, chosen)` trả phần bên trong vùng live, để F4 chỉ thay nội dung vùng live đã có sẵn;
  - hoặc ghi rõ "gán `outerHTML` / dựng lại cả câu, đọc ra nhờ `focusResult`".

### Sai khác tài liệu ↔ code (chưa phải lỗi, cần biết)

- **Câu 2 đáp án nằm ngang** (`.qopts--duo`, `quiz.css:16-17`): bản dựng và tài liệu không quy định cách hiển thị; bản dựng xếp dọc mọi câu. Đây là đề xuất của Worker. Hợp với yêu cầu "hiển thị gọn", nhưng chưa có ảnh tham chiếu, nên chủ quản cần xem khi duyệt FE-27. Nếu muốn giữ đúng bản dựng thì chỉ cần bỏ lớp `--duo`.
- **Thanh tiến độ dùng `<progress>`** thay cho `.qbar > i` có `style="width"` như bản dựng. Lý do: để không phải dùng `style=`, đúng quy ước. Thanh vẫn giữ tên lớp `.qbar`.
- **Cỡ chữ `rem` lẻ** (`1.03125rem`, `0.84375rem`, `0.96875rem`…) không có biến trong `tokens.css`. Chấp nhận được: bảng biến ở mục 2 của docx không có các cỡ này, và chữ vẫn phóng to được theo `rem`.

### Cần xác minh

1. **So ảnh `tt-01..03`** ở 1440/390px. Worker đã so ở 900px trên trang thử tĩnh nhưng không lưu ảnh vào repo. **Yêu cầu**: khi bàn giao F3 hoặc F4 (lần đầu thành phần chạy trong `thiPage`), chụp màn câu hỏi ở trạng thái chưa chọn / chọn sai / chọn đúng ở 1440 và 390px, rồi ghi đường dẫn ảnh vào bàn giao.
2. **Câu Đúng–Sai ở bề rộng ~481–1024px.** Ở chế độ ngang, mỗi nút rộng khoảng 250–300px. Theo tính toán, ô chữ cái 36 + khoảng cách 14 + nội dung `8rem` + khoảng cách 14 + nhãn khoảng 120px vượt bề rộng nút, nên sau khi chọn, nhãn "Đáp án phù hợp" sẽ xuống dòng. Nhưng luật `padding-left: 50px` chỉ áp dụng dưới 480px, nên nhãn sẽ nằm sát mép trái, dưới ô chữ cái, không thẳng với chữ. Phần này chưa thấy trên ảnh. Worker kiểm khi làm F4. Nếu đúng như tính toán thì đưa `padding-left` ra ngoài media query, hoặc cho `.qopts--duo` xếp dọc dưới khoảng 640px.

### Đề xuất (không bắt buộc)

- Khi FE-24 dùng lại, `ID_QUESTION`/`ID_RESULT` là id cố định nên mỗi trang chỉ có một khối câu hỏi. Hiện đủ dùng; chỉ ghi lại để biết.

### Kết luận

**F2 đạt**: không có lỗi chặn, và được dùng làm nền cho F3/F4. Code đáp ứng mọi tiêu chí FE-23 kiểm được bằng đọc code: thoát ký tự, `aria-live`, focus, bố cục 2/4 đáp án, nhãn xuống dòng dưới 480px, không `style=`, dùng biến màu. Tiêu chí "giống 3 ảnh" còn chờ ảnh chụp trong trang thật.

**Việc Worker phải sửa**: sửa kèm trong task kế tiếp của luồng fe (F1 hoặc F3), cùng commit hoặc commit riêng, không cần mở phiên riêng:

1. Phát hiện 1: chặn hover khi `.qnav` disabled.
2. Phát hiện 2: thêm biến màu nền thanh tiến độ `#F1E4E2` vào `tokens.css` và dùng cho `.qbar`.
3. Phát hiện 3: thống nhất cách dùng `resultHtml` với vùng `aria-live` và sửa chú thích. Nên làm trước F4, vì F4 là nơi đầu tiên dùng hàm này.
4. "Cần xác minh" 1–2: chụp ảnh và kiểm câu Đúng–Sai ở bề rộng trung bình khi bàn giao F3/F4.

**Rủi ro còn lại**: thấp. Thành phần chưa chạy trong trang thật, nên các sai lệch bố cục chỉ lộ ra khi F3/F4 nối vào.

## Review B1 (luồng be) · 2026-10-17

**Kết luận: B1 ĐẠT.** Không có lỗi Nghiêm trọng/Cao/Trung bình. Hai điểm Thấp có thể sửa kèm B2, không chặn.

### Phạm vi đã review

- Đối tượng: task B1 (BE-23a), nhánh `lane/CUOC-THI-be`, worktree `C:\GTSC\DMST\wt\CUOC-THI-be`.
  - Commit được giao `82e2128` **không còn trên nhánh nào** (đã bị amend). Đầu nhánh hiện là `a117f64` (cùng thông điệp, cùng cha `a244e24`). `git diff 82e2128 a117f64` chỉ khác `Views/thiPage.cshtml`: `82e2128` vô tình xóa dòng trống cuối file, `a117f64` bỏ thay đổi đó. Review theo `a117f64` (bản sạch hơn); kết luận áp dụng cho cả hai, điều phối merge `lane/CUOC-THI-be` là đúng commit.
  - File: `Contest/ContestAttemptService.cs` (mới), `Api/Controllers/ContestController.cs`, `Composers/CustomCoreComposer.cs`.
- Chuẩn so sánh: `1-thiet-ke.md` › Contract (phần chung) và › API-02; bảng task › B1; QĐ-004, QĐ-010, QĐ-013; báo cáo `2-ban-giao-CUOC-THI-be.md` › B1.
- Không review được: không tự build/chạy (vai trò Orchestrator). Phần chạy thử dựa vào báo cáo Worker (`run-local -NoRun` 0 lỗi; gọi API-02 token đúng/sai/thiếu; chèn tay `entry_answer`).

### Đối chiếu contract API-02

| Mục | Code (`a117f64`) | Kết quả |
|---|---|---|
| `GET /api/v1/contest/entries/me` | `ContestController.cs` `[HttpGet("entries/me")]` dưới route `api/v1/contest` | Đạt |
| Xác thực: `HashToken(header)` tra `token_hash`; thiếu/rỗng/sai → `401 INVALID_TOKEN` | `ContestAttemptService.AuthenticateAsync` dùng lại `ContestEntryService.HashToken`; `IsNullOrWhiteSpace` → null → `Error(INVALID_TOKEN)` → `401` | Đạt |
| Dạng lỗi `{ error: { code, message, fields } }`, `fields` luôn object (QĐ-004) | `Error()` dùng `Fields ?? new Dictionary` | Đạt |
| `Cache-Control: no-store` cả thành công và lỗi | Đặt ở đầu action, trước mọi nhánh trả về | Đạt |
| `phoneMasked` 3 đầu + `****` + 3 cuối; null khi không có số | `MaskPhone` | Đạt (số đã validate `^0\d{9}$` nên nhánh `< 7` không xảy ra) |
| `org` null khi trống | API-01 đã chuẩn hóa rỗng → null (`ContestEntryService.cs:157-160`) | Đạt |
| `attemptNo` null cho ẩn danh (QĐ-010) | `Mode == Named ? AttemptNo : null` | Đạt |
| `maxAttempts` = cài đặt hiện tại | `NormalizeMaxAttempts(GetAsync()?.MaxAttempts)`; không có `thiPage` → 2 | Đạt (giả định đã ghi trong bàn giao, hợp lý) |
| `answered` = đếm dòng `entry_answer` | `answers.Count` từ truy vấn `entry_answer` | Đạt |
| `score` null khi `in_progress`; `entry.score` khi `submitted` | Đúng | Đạt |
| `total`: `total_questions` khi đã nộp, `IQuestionBank.Current.TotalQuestions` khi đang thi | Đúng (đã nộp mà cột rỗng thì lùi về ngân hàng — an toàn) | Đạt |
| `submittedAt` ISO UTC có `Z` | `SpecifyKind(Utc)` + `yyyy-MM-dd'T'HH:mm:ss'Z'` | Đạt |
| `answers` sắp theo `answered_at`; mỗi phần tử `{ q, a, correct, cd }`, `cd` chuỗi (QĐ-013) | `OrderBy(AnsweredAt).ThenBy(QuestionCode)`; `cd = Topic.ToString()` | Đạt |
| Gọi được ở mọi trạng thái cuộc thi | Không kiểm tra trạng thái cuộc thi | Đạt |
| Đăng ký DI ở composer, Scoped | `CustomCoreComposer.cs` | Đạt |
| Tên trường JSON | `JsonPropertyName` khớp contract | Đạt |

Bảo mật: không trả số điện thoại đầy đủ, không trả `token_hash`/`ip_hash`; tra token qua chỉ mục duy nhất `TokenHash`; truy vấn EF, không SQL thô; `AsNoTracking` cho đường đọc. Không có bí mật trong diff.

### Phát hiện

#### [Thấp] Comment lớp `ContestController` đã cũ
- Vị trí: `Umbraco.Plugin.Custom.Api/Controllers/ContestController.cs:8` — "Hien co API-01; cac API /me va gioi han tan suat (BE-26) lam sau."
- Tình huống: nay đã có API-02; người đọc hiểu sai phạm vi controller.
- Hướng khắc phục: sửa thành "Hien co API-01, API-02; …" (làm kèm B2).

#### [Thấp] Commit `82e2128` được giao review là commit treo
- Vị trí: nhánh `lane/CUOC-THI-be` (đầu nhánh `a117f64`).
- Tình huống: điều phối ghi mã `82e2128` trong giao việc/bàn giao, nhưng mã này không nằm trên nhánh; dễ nhầm khi đối chiếu hoặc merge theo mã.
- Hướng khắc phục: Worker ghi mã commit thật (`a117f64`) vào mục B1 của `2-ban-giao-CUOC-THI-be.md` ở lần cập nhật kế tiếp. Không cần sửa code.

### Sai khác tài liệu ↔ code

- `cd` trong `answers`: thêm so với sheet "API" r6, đã có QĐ-013. Không phải lỗi. (Ghi chú: dòng 182 của `1-thiet-ke.md` vẫn ghi "chờ CXN-1" — chỉ là chữ cũ, CXN-1 đã chốt.)

### Cần xác minh

- Nhánh `status = submitted` (`score`, `total = total_questions`, `submittedAt`) mới đọc qua code, chưa chạy (chưa có API-05). **Yêu cầu Worker**: ở B4 (API-05), kiểm API-02 sau khi nộp: `score` đúng, `total` = `entry.total_questions`, `submittedAt` dạng `…Z`.
- Phản hồi `500` do ngoại lệ chưa bắt (ví dụ CSDL lỗi) không đi qua action nên có thể thiếu `no-store`; trường hợp hiếm, không thuộc phạm vi B1.

### Đề xuất (không bắt buộc)

- B2 cần entity có theo dõi để ghi; `AuthenticateAsync` hiện trả bản `AsNoTracking`. Khi làm B2, hoặc tra lại lượt trong giao dịch dưới `WriteLock` (nên làm, vì phải đọc lại `status` dưới khóa), hoặc thêm tham số theo dõi. Không đổi B1.

### Việc tiếp theo

- B1 đạt → luồng be được tiếp B2 (BE-23b · API-03) theo `1-thiet-ke.md`. Hai điểm Thấp sửa kèm B2.

## Review B2 (luồng be) · 2026-10-18

**Kết luận: B2 ĐẠT.** Không có lỗi Nghiêm trọng/Cao. Một điểm Trung bình (thiếu nhánh bắt lỗi khóa chính mà contract ghi rõ) và hai điểm Thấp: sửa kèm B3, không chặn merge.

### Phạm vi đã review

- Đối tượng: commit `dc7a636` trên `lane/CUOC-THI-be` (cha `a117f64`), worktree `C:\GTSC\DMST\wt\CUOC-THI-be`. File: `Core/Contest/ContestAttemptService.cs`, `Core/Contest/ContestEntryService.cs`, `Api/Controllers/ContestController.cs`.
- Đọc thêm (không đổi trong commit): `ContestEntryService.cs:85-133` (API-01 dưới khóa), `Quiz/QuestionBank.cs:42,52,112-123` (`AnswerKey`, `Keys`, `Letters`), `ContestSettingsService.cs:82` (`GetStatus`).
- Chuẩn so sánh: `1-thiet-ke.md` › Contract (phần chung) và › API-03; bảng task › B2; QĐ-004, QĐ-006, QĐ-014; sheet "API" r7 (API-03), r12 (QUIZ-02), bảng mã lỗi r20, r25; báo cáo `2-ban-giao-CUOC-THI-be.md` › B2.
- Không review được: không tự build/chạy (vai trò Orchestrator). Phần chạy thử dựa vào báo cáo Worker (`run-local -NoRun` 0 lỗi; gọi API-03 đủ các nhánh; 5 yêu cầu đồng thời → 1 dòng; đóng cuộc thi → `403`).

### Đối chiếu contract API-03

| Mục | Code (`dc7a636`) | Kết quả |
|---|---|---|
| `POST /api/v1/contest/entries/me/answers`, thân `{ q, a }` | `ContestController.SaveAnswer` `[HttpPost("entries/me/answers")]`, `[FromBody] SaveAnswerRequest?` | Đạt |
| 1. Token → `401 INVALID_TOKEN` | `AuthenticateAsync` trước mọi kiểm tra khác | Đạt |
| 2. Đã nộp → `409 ALREADY_SUBMITTED` | Đọc lại `entry.status` từ CSDL **trong** khóa ghi (không dùng bản `Entry` có thể đã cũ) | Đạt — làm đúng đề xuất ở review B1 |
| 3. Cuộc thi không mở → `403 CONTEST_CLOSED`; không có `thiPage` → đóng (QĐ-006, QĐ-014) | `settings is not null && GetStatus(...) == Open` | Đạt (nhánh `settings is null` chỉ đọc qua code, logic đúng) |
| 4. Thân rỗng/JSON sai/thiếu `q`/`q` lạ → `400 UNKNOWN_QUESTION` | Không dùng `[ApiController]` nên bind lỗi → `request = null` → `key = null` | Đạt |
| 5. Thiếu `a`/`a` ngoài `Letters` → `400 INVALID_OPTION` | `IsNullOrEmpty(a) \|\| !key.Letters.Contains(a)` | Đạt |
| Chữ cái phân biệt hoa thường | `Letters` là `ToHashSet()` comparer mặc định (ordinal) (`QuestionBank.cs:122`); `a == key.Answer` | Đạt |
| 6. Câu đã có đáp án → `200`, `stored:false`, `a`/`correct` của đáp án đang lưu | Tra `entry_answer` trong khóa, trả `existing.Chosen`, `existing.IsCorrect` | Đạt |
| Ghi `topic = TopicId`, `chosen`, `is_correct = (a == Answer)`, `answered_at` UTC; không cập nhật `entry.answered` | Đúng | Đạt |
| Dùng **chung** khóa ghi với API-01, trong một giao dịch | `ContestEntryService.WriteLock` đổi thành `internal static`, cùng assembly; `BeginTransactionAsync` trong khóa; trả lỗi sớm thì `tx` dispose → rollback | Đạt |
| Lần ghi đầu thắng | Kiểm tồn tại rồi chèn tuần tự dưới khóa + khóa chính `(entry_id, question_code)` (`AppDbContext.cs:51`) | Đạt (Worker đo: 5 song song → 1 `stored:true`, 4 `stored:false`, 1 dòng) |
| Đồng thời: gặp lỗi khóa chính (tiến trình khác) → đọc lại, `stored:false` | **Không có** | Xem phát hiện Trung bình |
| Mã HTTP: `UNKNOWN_QUESTION`/`INVALID_OPTION` 400, `ALREADY_SUBMITTED` 409 | Thêm vào `Error()` | Đạt |
| Dạng lỗi `{ error: { code, message, fields } }`, `fields` luôn object (QĐ-004); `no-store` mọi phản hồi | Dùng chung `Error()`; `no-store` đặt đầu action | Đạt |
| Tên trường JSON `q, a, correct, stored` | `JsonPropertyName` khớp | Đạt |
| Không kiểm thứ tự chuyên đề và đồng hồ đọc | Không kiểm | Đạt |

**Chấm phía máy chủ, không lộ đáp án qua API-03**: `correct` tính từ `AnswerKey` trong bản chụp của máy chủ, không tin dữ liệu từ client. Phản hồi chỉ có chữ cái thí sinh chọn (hoặc đáp án đang lưu của chính lượt) và cờ đúng/sai; không trả chữ cái đáp án đúng. Lỗi `INVALID_OPTION`/`UNKNOWN_QUESTION` không tiết lộ gì về đáp án. Đạt. (Xem thêm mục "Sai khác" về QUIZ-02.)

Bảo mật khác: truy vấn EF có tham số, không SQL thô; không bí mật trong diff; chữ hiển thị tiếng Việt có dấu, comment không dấu.

### Phát hiện

#### [Trung bình] Thiếu nhánh bắt lỗi khóa chính mà contract yêu cầu
- Vị trí: `Core/Contest/ContestAttemptService.cs` khoảng dòng 140–156 (`_db.EntryAnswers.Add(row); await _db.SaveChangesAsync(ct);`).
- Bằng chứng: `1-thiet-ke.md` › API-03: "trong khóa ghi kiểm tra rồi chèn; nếu vẫn gặp lỗi khóa chính (tiến trình khác) thì đọc lại dòng đang có và trả `stored: false`". Bàn giao B2 › "Chưa kiểm" ghi Worker chủ động không bắt vì cho là không cần.
- Tình huống xảy ra: `WriteLock` chỉ tuần tự hóa trong **một** tiến trình. Khi có hai tiến trình cùng mở file SQLite (IIS chồng tiến trình lúc tái chế app pool, chạy hai instance), hai yêu cầu cùng câu đều qua bước kiểm tồn tại → yêu cầu sau gặp `DbUpdateException` (UNIQUE/PK) → `500` thay vì `200 stored:false`. Dữ liệu vẫn đúng (khóa chính giữ lần đầu), nhưng FE nhận lỗi máy chủ cho một thao tác contract ghi là "gọi lại nhiều lần an toàn" (sheet "API" r7).
- Hướng khắc phục: bọc `SaveChangesAsync` bằng `catch (DbUpdateException)`: `ChangeTracker.Clear()`, đọc lại dòng `(entry.Id, key.Code)`; có dòng thì trả `Ok(..., stored:false)`, không có thì ném tiếp. Vài dòng, không đổi contract.

#### [Thấp] Kiểm "cuộc thi mở" tính trước khi chờ khóa
- Vị trí: `ContestAttemptService.cs` đầu `SaveAnswerAsync` (`open` tính trước `WriteLock.WaitAsync`).
- Tình huống: yêu cầu đến sát giờ đóng và phải chờ khóa vẫn được ghi sau `contestEnd` một khoảng bằng thời gian chờ (thường mili giây). Worker đã ghi là giả định. Chấp nhận được; nếu sửa thì chỉ cần lấy `DateTime.UtcNow` và gọi `GetStatus` sau khi vào khóa (vẫn đọc `settings` ngoài khóa).

#### [Thấp] Chưa sửa điểm Thấp thứ hai của review B1 và comment controller còn chữ cũ
- Mục B1 của `2-ban-giao-CUOC-THI-be.md` vẫn chưa ghi mã commit thật (`a117f64`); mục B2 cũng chưa ghi `dc7a636`. Comment lớp `ContestController.cs:8` nay ghi "Hien co API-01, API-02, API-03; cac API /me … lam sau" — vế "cac API /me lam sau" đã cũ một phần (nên là "API-04, API-05 …"). Không ảnh hưởng chạy.

### Sai khác tài liệu ↔ code

- Không có sai khác giữa B2 và contract ngoài phát hiện Trung bình ở trên.
- **Cần người dùng lưu ý (ngoài phạm vi B2, không phải lỗi của B2)**: QUIZ-02 công khai (không token) trả `ans` và `exp` của mọi câu; sheet "API" r12 ghi đây là chủ ý ("Có sẵn đáp án và giải thích vì đề thi dùng chung ngân hàng luyện tập (đã chốt)"), nhưng `docs/quyet-dinh.md` chưa có QĐ nào xác nhận. Hệ quả: thí sinh xem được đáp án trước khi trả lời qua mạng của trình duyệt. Điểm vẫn chấm phía máy chủ (API-03 không nhận `correct` từ client), nên dữ liệu điểm không bị giả, nhưng tính công bằng của cuộc thi phụ thuộc quyết định này. Nếu người dùng muốn ẩn đáp án trong cuộc thi thì cần một API/biến thể QUIZ-02 không có `ans`/`exp` và FE lấy `correct` từ API-03 — thay đổi contract, phải chốt trước khi làm. Orchestrator sẽ hỏi ở lượt thiết kế tiếp nếu điều phối chuyển câu hỏi này.

### Cần xác minh

- Nhánh `settings is null` → `403` (không có trang `thiPage`): chỉ đọc qua code. Có thể kiểm kèm B3 nếu tiện, không bắt buộc.
- Sau khi thêm nhánh `catch` (phát hiện Trung bình): chỉ cần build; nhánh này không tái hiện được bằng một tiến trình, đọc qua code là đủ.

### Đề xuất (không bắt buộc)

- `_db.ChangeTracker.Clear()` đang đặt sau `WriteLock.Release()` trong `finally`; DbContext là Scoped nên vô hại, nhưng đặt trước `Release()` thì đọc dễ hiểu hơn.

### Việc tiếp theo

- B2 đạt → luồng be được tiếp B3 (BE-24a · API-04) theo `1-thiet-ke.md` (CXN-2 đã chốt ở QĐ-014). Sửa kèm trong B3: phát hiện Trung bình (bắt lỗi khóa chính ở API-03) và hai điểm Thấp; ghi vào mục B3 của bàn giao.

## Review F1 (luồng fe) · 2026-10-18

Người review: Orchestrator (`/quality-check`). Chỉ đọc, không build, không chạy web.

**Kết luận: F1 CẦN SỬA.** Mock khớp contract API-02…05 (kể cả QĐ-013/014/015), hàng đợi không tạo dòng trùng ở máy chủ. Nhưng có một lỗi **Cao** làm đáp án bị ghi vào **sai lượt** (token đọc lại từ `localStorage` ở mỗi lần gọi, còn hàng đợi so mã lượt trong bộ nhớ) và hai lỗi **Trung bình** về khôi phục tiến độ / mất đáp án. Ba điểm này nằm trong store mà F3–F5 dựa vào, nên sửa trước khi F3 dùng store.

### Phạm vi đã review

- **Đối tượng**: commit `5fc9c37` trên `lane/CUOC-THI-fe` (đầu nhánh, cha `3ac219b`): `wwwroot/assets/js/contest/contest-api.js` (+267/−3), `wwwroot/assets/js/contest/contest-store.js` (mới, 384 dòng). Không có file ngoài ranh giới luồng fe. Số dòng dưới đây theo bản trong commit.
- **Chuẩn so sánh**: sheet "Công việc" › FE-28 (r18: mô tả, hành vi, tiêu chí nghiệm thu); `1-thiet-ke.md` › AC FE-28 mục 1–7, "Trường hợp biên", Contract API-02…05 + "Phía FE: chữ ký `contest-api.js`", task F1, mục "Cập nhật 2026-10-17" › "Contract API-05 sau CXN-3" và "F1 sau CXN-3"; QĐ-013, QĐ-014, QĐ-015; DTO QUIZ-01/02 (`QuestionBank.cs:13-37`: `cd`, `count`, `code`, `opt`, `ans`); review B1/B2 ở trên (dạng phản hồi thật của API-02/03).
- **Báo cáo Worker**: `2-ban-giao-CUOC-THI-fe.md` › F1.
- **Không review được**:
  - Không chạy lại harness Node của Worker (nằm ở scratchpad của Worker). Phần "đã chạy" dựa vào báo cáo.
  - Chưa có kiểm chứng trong trình duyệt (DevTools Network/Offline) như cột "Cách kiểm chứng" của F1 yêu cầu; Worker ghi rõ là để F3. Chấp nhận dời, nhưng phải làm ở F3 (xem "Việc tiếp theo").
  - Worktree hiện có thay đổi **chưa commit** (`thiPage.cshtml`, `contest-store.js`, `register.js`, `exam.js` mới — có vẻ là F3 đang làm). Không review phần này.

### Đối chiếu tiêu chí FE-28

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| 5 hàm đúng chữ ký `createEntry/getMe/saveAnswer/attachContact/submitEntry`, trả `{ok, data \| error}` | Đạt | `contest-api.js:149-185` |
| Hàm `/me` tự lấy token từ `at_entry`; header `X-Entry-Token`; lỗi mạng `NETWORK`, `5xx` `SERVER`, `401`/`429` không thân → `INVALID_TOKEN`/`RATE_LIMITED`; timeout 15s | Đạt (nhưng xem phát hiện Cao về *khi nào* đọc token) | `contest-api.js:149-178` |
| QUIZ-01 khi vào trang, QUIZ-02 khi mở chuyên đề, lưu tạm trong bộ nhớ | Đạt | `contest-api.js` `fetchTopics`/`fetchQuestions` |
| AC1 · mở trang có `at_entry` → API-02, dựng lại tiến độ từ máy chủ | Đạt khi API-02 thành công; **không tự phục hồi** khi API-02 lỗi lúc mở trang | `contest-store.js:163-207`; phát hiện Trung bình #1 |
| AC2 · `401` → xóa `at_entry` + hàng đợi, về Đăng ký; xóa localStorage → Đăng ký, không lỗi | Đạt | `contest-store.js:108-115, 167-182` |
| AC3 · một câu gửi một lần; `stored=false` → hiện đáp án máy chủ | Đạt | `contest-store.js:231-233, 289-292` |
| AC4 · offline 3 câu → online: đủ 3, không trùng, không mất; chu kỳ 2s/5s/15s/giữ 15s; sự kiện `online` | Đạt trong một tab (hàng đợi bền, khử trùng theo `(entry, q)`, gửi tuần tự, xóa mục chỉ sau khi máy chủ trả `200`). Hai tab có thể gửi cùng mục hai lần nhưng máy chủ giữ lần đầu (`stored:false`), không tạo dòng trùng — chấp nhận. **Mất đáp án** khi localStorage bị chặn | `contest-store.js:63-88, 245-324`; phát hiện Trung bình #2 |
| AC5 · luyện tập không gọi `/api/v1/contest`, tiến độ ở `at_practice` | Đạt | `contest-store.js:138-156, 224-229, 251` |
| AC6 · phân loại lỗi khi gửi đáp án | Đạt: mạng/`5xx`/`429`/lạ giữ; `401` xóa phiên; `409 ALREADY_SUBMITTED` bỏ hàng đợi + `submitted`; `403`/`400` bỏ mục + `dropped` | `contest-store.js:296-313` |
| AC7 · mục hàng đợi ghi mã lượt; lượt đổi thì bỏ mục lượt cũ, không gửi bằng token lượt mới | **Không đạt** khi `at_entry` đổi ngoài tab đang mở | Phát hiện Cao |
| F5 (dùng trước) · `submit` gửi hết hàng đợi trước, còn mục thì không gọi API-05 | Đạt (`QUEUE_PENDING`) | `contest-store.js:341-356` |

### Đối chiếu mock với contract (để tích hợp không phải sửa)

| API | Mock | Kết quả |
|---|---|---|
| API-02 | Đủ trường `code, mode, fullName, phoneMasked, org, attemptNo (null khi anon, QĐ-010), maxAttempts, status, answered, score (null khi in_progress), total, submittedAt, answers[{q,a,correct,cd}]` (QĐ-013); gọi được cả khi `closed` | Đạt |
| API-03 | Thứ tự token → `ALREADY_SUBMITTED` → `CONTEST_CLOSED` → `UNKNOWN_QUESTION` (kể cả thân rỗng) → `INVALID_OPTION` (phân biệt hoa thường) → `stored:false` với đáp án đang lưu; phản hồi `{q,a,correct,stored}` | Đạt, khớp cả bản thật ở review B2 |
| API-04 | Thứ tự token → `ALREADY_SUBMITTED` → `ALREADY_NAMED` → `CONTEST_CLOSED` (QĐ-014) → `VALIDATION` (`fields` theo `fullName/phone/consent`) → `ATTEMPT_LIMIT`; phản hồi `{mode, attemptNo, maxAttempts}` | Đạt |
| API-05 | Đã nộp → `200` kết quả cũ (bỏ qua thân) → `CONTEST_CLOSED` → `409 INCOMPLETE_ANSWERS` với `message` "Bạn mới trả lời x/{total} câu…", chỉ đếm câu còn trong ngân hàng (QĐ-015) → contact (`VALIDATION`/`ATTEMPT_LIMIT`, chỉ khi `anon`) → nộp; phản hồi `status, code, mode, score, answered, total, eligibleForPrize, submittedAt (…Z), byTopic[{cd,correct,count}]` | Đạt (một chỗ lệch nhỏ ở chế độ ép `limit`, xem Thấp #2) |
| Chế độ ép lỗi | `network, server, rate, token, closed, submitted, named, limit, validation, incomplete`; `nothing` đã thay bằng `incomplete`; `?mock=almost` nạp sẵn mọi câu trừ câu cuối | Đạt |
| Mock chỉ localhost; `?mock=real` / không có `mock` → API thật | Giữ nguyên `mockMode()` | Đạt |

Không thấy số `200` viết cứng: tổng câu lấy từ QUIZ-01/02 (mock) hoặc API-02 (store).

### Phát hiện

#### [Cao] Đáp án có thể được ghi vào lượt khác (token đọc lại từ localStorage mỗi lần gọi)
- Vị trí: `contest-api.js:152` (`callMe` đọc `loadEntry()` ở **mỗi** yêu cầu; mock cũng vậy ở `:265`); `contest-store.js:280-287` (`drain` chỉ so `item.entry` với `state.entry.code` **trong bộ nhớ** rồi gọi `saveAnswer`).
- Bằng chứng: `1-thiet-ke.md` › AC FE-28 mục 7: "khi `at_entry` đổi sang lượt khác thì bỏ các mục của lượt cũ (không gửi đáp án lượt cũ bằng token lượt mới)". Store không nghe sự kiện `storage`, và không có chỗ nào so mã lượt của token sắp gửi với `item.entry`.
- Tình huống xảy ra: tab A mở lượt 1 (đang làm, hoặc còn mục trong hàng đợi). Ở tab B, người dùng nộp lượt 1 rồi bấm "Thi lượt thứ 2", đăng ký → `at_entry` = lượt 2. Quay lại tab A trả lời một câu: `answer()` xếp mục `{entry: lượt 1}`, `drain` thấy `state.entry.code` (vẫn lượt 1) khớp → `saveAnswer` gửi kèm token **lượt 2** → máy chủ ghi đáp án vào lượt 2 (`200 stored:true`), tab A vẫn hiển thị như đang làm lượt 1. Đáp án của lượt 2 bị điền bởi tab cũ, và lần ghi đầu thắng nên thí sinh không sửa lại được. Tương tự cho mục còn treo trong hàng đợi khi mạng trở lại, và cho `attachContact`/`submit` ở tab cũ (nộp nhầm lượt 2).
- Hướng khắc phục (chọn một, khuyến nghị cả hai):
  1. `callMe` nhận token từ người gọi; store truyền `state.entry.token` (giữ được chữ ký công khai bằng tham số tùy chọn, ví dụ `saveAnswer(q, a, token?)`), để mục lượt 1 luôn đi bằng token lượt 1 → máy chủ trả `409 ALREADY_SUBMITTED`, store xử lý đúng như hiện có.
  2. Trước mỗi yêu cầu `/me` trong store, so `loadEntry()?.code` với `state.entry.code`; khác thì dừng, phát sự kiện (ví dụ `token`/`entry-changed`) để màn hình gọi lại `init()`. Thêm `window.addEventListener('storage', …)` cho khóa `at_entry`.
- Kiểm chứng sau khi sửa: harness hoặc trình duyệt hai tab theo đúng tình huống trên; mock phải cho ra `ALREADY_SUBMITTED` ở tab cũ, máy chủ giả của lượt 2 không có đáp án từ tab cũ.

#### [Trung bình] #1 · Mở trang lúc API-02 lỗi thì không bao giờ lấy lại tiến độ từ máy chủ trong phiên
- Vị trí: `contest-store.js:176-187` (nhánh lỗi chỉ `overlayQueue()` + `scheduleRetry()`); `scheduleRetry` → `flush` → `drain` chỉ gửi hàng đợi, không gọi lại `getMe`; sự kiện `online` (`:318-324`) cũng chỉ `flush`.
- Bằng chứng: FE-28 "Khi mở trang: … gọi API lấy lại lượt và dựng lại tiến độ từ máy chủ (máy chủ là nguồn đúng)"; AC1 "tải lại giữa chừng thì quay đúng về danh sách chuyên đề với tiến độ đã lưu".
- Tình huống xảy ra: điện thoại mạng chập chờn, tải lại trang đúng lúc mất mạng (hoặc máy chủ `5xx` / `429` một nhịp) → `view:'exam', offline:true`, `state.answers` chỉ có các mục trong hàng đợi, `state.total = null`. Khi mạng trở lại, trạng thái vẫn vậy cho tới khi tải lại trang: CĐ đã xong hiện "chưa làm", CĐ2–8 bị khóa, F4 "tiếp từ câu chưa trả lời đầu tiên" về câu 1, F5 không tính được `allDone`/"x / total". Không sai dữ liệu ở máy chủ (trả lời lại nhận `stored:false`), nhưng sai hành vi chính trong tình huống thường gặp trên di động.
- Hướng khắc phục: giữ cờ "chưa đồng bộ" (`state.synced = false`); ở lần thử lại theo chu kỳ và ở sự kiện `online`, nếu chưa đồng bộ thì gọi `getMe()` trước rồi `applyServer` + `overlayQueue` + phát `change` (xử lý `INVALID_TOKEN` như `init`). Ghi vào bàn giao cách màn hình biết đã đồng bộ (sự kiện `change` là đủ).

#### [Trung bình] #2 · localStorage bị chặn: không làm được lượt thi trong phiên, đáp án "đang chờ" không bao giờ gửi
- Vị trí: `contest-api.js:152` (token chỉ đọc từ `localStorage`); `contest-store.js:63-81` (hàng đợi chỉ nằm trong `localStorage`; `readQueue()` trả `[]` khi bị chặn).
- Bằng chứng: `1-thiet-ke.md` › "Trường hợp biên": "localStorage bị chặn (riêng tư) → Mọi thao tác bọc try/catch; **vẫn làm được trong phiên** nhưng tải lại thì mất token (đúng QĐ-007)". FE-28 (sheet) cũng nêu riêng trường hợp chế độ riêng tư.
- Tình huống xảy ra: trình duyệt chặn lưu trữ trang (`localStorage` ném `SecurityError`). Đăng ký thành công nhưng `saveEntry` không lưu được → `loadEntry()` = `null` → mọi API `/me` trả `INVALID_TOKEN` ngay (không gọi mạng) → `init()` về `register`; hoặc nếu màn hình giữ `state.entry` thì `answer()` đánh dấu `pending:true`, `enqueue` ghi thất bại, `drain` đọc hàng đợi rỗng → đáp án không bao giờ lên máy chủ mà giao diện vẫn coi là đã trả lời (`allDone` tính cả mục `pending`). Harness của Worker chỉ kiểm "không ném lỗi ra ngoài", chưa kiểm "vẫn làm được trong phiên".
- Hướng khắc phục: giữ bản trong bộ nhớ cho `at_entry` và `at_queue` (biến module), `localStorage` chỉ là nơi lưu bền: ghi cả hai, đọc ưu tiên bản bộ nhớ khi `localStorage` lỗi. `createEntry` thành công phải đặt được token vào bản bộ nhớ (ví dụ `saveEntry` cập nhật biến module rồi mới thử `localStorage`). Không đổi contract.

#### [Thấp] #1 · `submit` kèm `contact` không cập nhật `attemptNo` trong `at_entry`
- Vị trí: `contest-store.js:352` (`syncEntry({ mode: r.data.mode })`).
- Tình huống: lượt ẩn danh nộp kèm contact → phản hồi API-05 không có `attemptNo` (đúng contract) → `at_entry` thành `mode:'named', attemptNo:null`. F5 cần `attemptNo` để quyết định nút "Thi lượt thứ {attemptNo+1}".
- Hướng khắc phục: sau khi nộp thành công kèm contact thì gọi `getMe()` để đồng bộ `attemptNo` (hoặc ghi rõ trong bàn giao để F5 làm). Không đổi contract.

#### [Thấp] #2 · Chế độ ép `limit` trả `ATTEMPT_LIMIT` cho API-05 cả khi không có contact
- Vị trí: `contest-api.js:353-355`.
- Tình huống: contract API-05 chỉ trả `409 ATTEMPT_LIMIT` khi có `contact` và lượt đang `anon`. Mock trả cả cho lượt có tên / không kèm contact — trường hợp máy chủ thật không bao giờ trả; F5 có thể viết xử lý cho trường hợp không có thật.
- Hướng khắc phục: bỏ nhánh `else if (mode === 'limit')`; `limit` chỉ áp trong `takeContact`.

#### [Thấp] #3 · Chưa đọc `Retry-After` khi `429`
- Vị trí: `contest-api.js:149-178`, `contest-store.js:265-269`.
- Bằng chứng: `1-thiet-ke.md` › Contract chung: "FE vẫn xử lý `429` (đọc `Retry-After` nếu có)". Worker đã ghi trong "Giới hạn". Máy chủ chưa trả `429` trước BE-26, nên không chặn; làm khi tiện (đưa `retryAfter` vào `error` rồi `scheduleRetry` dùng giá trị đó).

#### [Thấp] #4 · `fields: null` ở lỗi phía FE
- Vị trí: `contest-api.js:54-56`, `readError` `:59-65`, `QUEUE_PENDING` ở `contest-store.js:343`.
- Tình huống: QĐ-004 nói `fields` luôn là object ở **máy chủ**; lớp FE giữ nguyên `fields` của máy chủ, nhưng lỗi tự sinh (`NETWORK`, `SERVER`, `INVALID_TOKEN` không gọi mạng, `QUEUE_PENDING`) có `fields: null`. Có từ FE-25, nhất quán trong file. Màn hình phải viết `fields && fields.x`. Không bắt buộc sửa; nếu sửa thì đổi `fields || null` thành `fields || {}` cho đồng nhất với máy chủ.

### Sai khác tài liệu ↔ code

- `QUEUE_PENDING`, `UNKNOWN` (`404` hoặc lỗi không chuẩn): mã nội bộ của FE, không phải mã máy chủ; không đổi contract. Ghi nhận.
- `correct` của mục đang chờ gửi do FE tự tính từ `ans` của QUIZ-02; khi máy chủ trả về thì ghi đè bằng `correct` của máy chủ (`contest-store.js:292`). Đúng nguyên tắc "máy chủ là nguồn đúng". (Việc QUIZ-02 công khai `ans` là câu hỏi đã nêu ở review B2, ngoài phạm vi F1.)

### Cần xác minh

- `answer()` `await flush()` (`contest-store.js:237`): khi mạng chậm, lời gọi chờ tới 15s (timeout), hoặc chờ các mục đứng trước trong hàng đợi. F4 không được khóa giao diện theo promise này; hiển thị theo `pending` rồi cập nhật khi có sự kiện `change`. Kiểm ở review F4.
- Mock đọc–sửa–ghi cả `at_mock` sau một `await` (`contest-api.js:263-…`); hai yêu cầu mock chạy song song (ví dụ `attachContact` trong lúc hàng đợi đang gửi, hoặc hai tab) có thể ghi đè nhau và làm mất một đáp án **trong máy chủ giả**. Chỉ ảnh hưởng mock; nếu F3–F5 thấy "mất đáp án" khi thử bằng mock thì nghĩ tới chỗ này trước khi nghi store.
- `leavePractice()` (`contest-store.js:146-148`) chỉ đổi cờ, không trả lại đáp án của lượt thi; nếu màn hình quên gọi `init()` sau đó thì đáp án luyện tập bị coi là đáp án lượt thi và `answer()` sẽ không gửi câu đó ("một câu chỉ gửi một lần"). Comment đã ghi phải gọi `init()`; kiểm ở review F3. Nên cân nhắc cho `leavePractice()` tự gọi `init()`.

### Đề xuất (không bắt buộc)

- `answer()` khi `state.status === 'submitted'` có thể trả ngay `{ ok:false, code:'ALREADY_SUBMITTED' }` thay vì xếp hàng rồi chờ máy chủ từ chối.

### Việc tiếp theo

- **Worker luồng fe** sửa trong một phiên riêng (task "F1-sửa", commit riêng trên `lane/CUOC-THI-fe`, **tách khỏi thay đổi F3 đang chưa commit**): phát hiện Cao, Trung bình #1, #2; Thấp #1, #2 (vài dòng). Thấp #3, #4 làm nếu tiện. Ghi vào mục mới "F1 · sửa sau review" ở `2-ban-giao-CUOC-THI-fe.md`, kèm mã commit.
- **Kiểm chứng cần chạy** (harness Node như F1 là đủ, ghi kết quả từng bước):
  1. Hai "tab" (hai lần `init()` trên cùng `localStorage`, hoặc đổi `at_entry` giữa chừng): lượt 1 đã nộp, `at_entry` = lượt 2, tab cũ trả lời một câu → máy chủ giả lượt 2 không có đáp án đó; tab cũ nhận `ALREADY_SUBMITTED` hoặc sự kiện đổi lượt.
  2. `init()` khi `navigator.onLine = false` có sẵn 3 đáp án ở máy chủ giả → bật mạng (sự kiện `online`) → `state.answers` có đủ 3 câu từ máy chủ, `state.total` khác `null`, có sự kiện `change`.
  3. `localStorage` ném lỗi ở mọi thao tác: đăng ký (mock `ok`) → trả lời 2 câu → máy chủ giả có 2 đáp án.
  4. Chạy lại toàn bộ kịch bản đã đạt của F1 để chắc không hồi quy.
- Kiểm trong trình duyệt (DevTools Network/Offline, console sạch khi xóa localStorage) dời sang F3, ghi vào bàn giao F3.
- F3 có thể làm tiếp song song phần giao diện, nhưng không merge F3 trước khi F1-sửa đạt review.

## Review B3 (luồng be) · 2026-10-18

**Kết luận: B3 ĐẠT.** API-04 đúng contract và QĐ-014; không có lỗi Nghiêm trọng/Cao/Trung bình trong phạm vi B3. Hai điểm Thấp của review B1 đã sửa. **Nhưng** phát hiện Trung bình của review B2 (bắt lỗi khóa chính ở API-03) **chưa được sửa**: không chặn B3, phải sửa trước khi ghép `lane/CUOC-THI-be` (xem "Việc tiếp theo").

### Phạm vi đã review

- Đối tượng: commit `5068074` trên `lane/CUOC-THI-be` (cha `dc7a636`, đang là đầu nhánh), worktree `C:\GTSC\DMST\wt\CUOC-THI-be`. File: `Api/Controllers/ContestController.cs`, `Core/Contest/ContestAttemptService.cs`, `Core/Contest/ContestEntryService.cs`. Đọc thêm (không đổi trong commit): `ContestEntryService.cs:60-133` (API-01 dưới khóa), `NormalizePhone` (`:180-184`), `ContestSettings.cs:23` và `ContestSettingsService.cs:73` (`MaxAttempts` đã chuẩn hóa).
- Chuẩn so sánh: `1-thiet-ke.md` › API-04 (bảng 6 bước + ghi chú thành công), › bảng task › B3, › hiện trạng code dòng 46 (`Validate` dùng chung); QĐ-004, QĐ-006, QĐ-010, QĐ-014; sheet "API" r8 (API-04; bảng lỗi chưa có `CONTEST_CLOSED`, QĐ-014 bổ sung); báo cáo `2-ban-giao-CUOC-THI-be.md` › B3.
- Không review được: không tự build/chạy (vai trò Orchestrator). Phần chạy thử dựa vào báo cáo Worker (`run-local -NoRun` 0 lỗi; gọi đủ nhánh 401/400/200/409 ALREADY_NAMED/409 ATTEMPT_LIMIT/409 ALREADY_SUBMITTED/403).
- Ngoài phạm vi: worktree đang có thay đổi **chưa commit** ở `ContestAttemptService.cs`, `ContestSettings.cs`, `ContestSettingsService.cs` (có vẻ là việc kế tiếp của Worker). Không review các thay đổi này.

### Đối chiếu contract API-04

| Mục | Code (`5068074`) | Kết quả |
|---|---|---|
| `PUT /api/v1/contest/entries/me/contact`, thân `{ fullName, phone, org, consent }` | `ContestController.AttachContact` `[HttpPut("entries/me/contact")]`, `[FromBody] ContactRequest?` | Đạt |
| 1. Token → `401 INVALID_TOKEN` | `AuthenticateAsync` trước mọi bước | Đạt |
| 2. Đã nộp → `409 ALREADY_SUBMITTED` | Đọc lại lượt **có theo dõi** trong `WriteLock` (`ContestAttemptService.cs:198-203`) | Đạt |
| 3. Đã `named` → `409 ALREADY_NAMED` | `current.Mode == Named` (`:204-207`); `ALREADY_NAMED` → 409 trong `Error()` | Đạt |
| 4. Không mở → `403 CONTEST_CLOSED`; không có `thiPage` → đóng (QĐ-006, QĐ-014) | `open = settings is not null && GetStatus(...) == Open` (`:188-190`, `:209-212`) | Đạt |
| 5. Sai dữ liệu → `400 VALIDATION`, `fields` khóa `fullName/phone/org/consent`, cùng câu API-01 | Gọi chung `ContestEntryService.Validate` (đổi thành `internal static`, nhận từng trường); `message = fields.Values.First()` như API-01 | Đạt |
| Thân rỗng/JSON sai | `request = null` → `Validate(null,…)` → `fields` fullName, phone, consent; `NormalizePhone(null)` an toàn (`raw ?? ""`) | Đạt |
| 6. Số đủ `maxAttempts` → `409 ATTEMPT_LIMIT`, câu như API-01 | `CountAsync(e => e.Phone == phone)` + câu thông báo giống hệt `ContestEntryService.cs:101-102`; lượt hiện tại đang `anon` (`phone` null) nên không bị đếm | Đạt |
| Đếm lượt chung khóa với API-01, một giao dịch | `ContestEntryService.WriteLock` + `BeginTransactionAsync`; trả lỗi sớm → rollback | Đạt |
| Thành công: `mode=named`, `full_name`, `phone` chuẩn hóa, `org` (rỗng → null), `consent_at = now` UTC, `attempt_no = used + 1`; mã, token, đáp án giữ nguyên | `:228-235`; chỉ sửa 6 cột của `entry` | Đạt |
| Phản hồi `200 { mode, attemptNo, maxAttempts }` | `AttachContactDto` với `JsonPropertyName` khớp | Đạt |
| `maxAttempts` | `settings!.MaxAttempts` (đã qua `NormalizeMaxAttempts` ở `ContestSettingsService.cs:73`); `settings!` an toàn vì `settings` null thì đã trả `403` ở bước 4 | Đạt |
| Dạng lỗi `{ error: { code, message, fields } }` (QĐ-004); `no-store` mọi phản hồi | Dùng chung `Error()`; `no-store` đầu action | Đạt |
| Đồng thời: hai API-04 cùng lượt / hai lượt cùng số sát giới hạn | Tuần tự dưới `WriteLock`, đọc lại `Mode` trong khóa → yêu cầu sau `409 ALREADY_NAMED` / `409 ATTEMPT_LIMIT` | Đạt (một tiến trình; nhiều tiến trình là giới hạn chung với API-01, đã biết) |
| API-01 không đổi hành vi sau khi tách `Validate` | Chỉ đổi chữ ký, thân hàm giữ nguyên; `ContestEntryService.cs:73` truyền đúng 4 trường | Đạt |

Bảo mật: không trả số đầy đủ hay `token_hash`; EF có tham số, không SQL thô; không bí mật trong diff. `ATTEMPT_LIMIT` cho biết một số đã dùng hết lượt (giống API-01); giới hạn 20 lần/giờ/IP cho API-04 thuộc BE-26 (`1-thiet-ke.md` dòng 25). Comment không dấu, chữ hiển thị có dấu.

### Hai điểm Thấp của review B1

| Điểm | Kết quả |
|---|---|
| Comment lớp `ContestController.cs:8` đã cũ | **Đã sửa**: "Hien co API-01 den API-04; API-05 va gioi han tan suat (BE-26) lam sau." Đúng phạm vi hiện tại. |
| Mã commit B1 treo (`82e2128`) | **Đã sửa**: mục B1 của bàn giao ghi `a117f64` và lý do (`2-ban-giao-CUOC-THI-be.md:6`). |

### Phát hiện

#### [Trung bình] Phát hiện Trung bình của review B2 chưa sửa (không thuộc code B3)
- Vị trí: `ContestAttemptService.cs:174-177` (bản `5068074`): `SaveAnswerAsync` vẫn `Add` + `SaveChangesAsync` không bắt `DbUpdateException`.
- Bằng chứng: `1-thiet-ke.md` › API-03 dòng 208; review B2 › phát hiện Trung bình yêu cầu sửa kèm B3. Bàn giao B3 không nhắc tới. Ghi chú: review B2 và commit B3 cùng lúc (00:05), nên nhiều khả năng Worker chưa thấy yêu cầu này khi làm B3; không tính là lỗi của B3.
- Tình huống: hai tiến trình cùng file SQLite, cùng câu → yêu cầu sau `500` thay vì `200 stored:false`.
- Hướng khắc phục: như review B2. Sửa trong task kế tiếp của luồng be (B4) hoặc một commit riêng, **trước khi ghép nhánh**.

#### [Thấp] Hai điểm Thấp của review B2 còn treo
- Kiểm "cuộc thi mở" tính trước khi chờ khóa: B3 lặp lại cùng cách (`:188-190`), nhất quán với API-03 và API-01. Chấp nhận; nếu sửa thì sửa cả API-03, API-04 cùng lúc.
- Bàn giao chưa ghi mã commit B2 (`dc7a636`) và B3 (`5068074`).

#### [Thấp] Lỗi gõ trong bàn giao B3
- `2-ban-giao-CUOC-THI-be.md:62`: "`.un-local.ps1 -NoRun`" (mất `\r` của `.\run-local.ps1`). Chỉ là chữ.

### Sai khác tài liệu ↔ code

- `403 CONTEST_CLOSED` của API-04 thêm so với sheet "API" r8, đã có QĐ-014. Không phải lỗi. (`1-thiet-ke.md:225` vẫn ghi "chờ CXN-2" — chữ cũ, CXN-2 đã chốt.)

### Cần xác minh

- Nhánh không có `thiPage` → `403`: chỉ đọc qua code (logic đúng, giống API-03). Không bắt buộc.
- Hai API-04 đồng thời cùng số sát giới hạn: chỉ đọc qua code (chung `WriteLock`). Không bắt buộc.

### Đề xuất (không bắt buộc)

- `ContactRequest` đã sẵn cho `contact` của API-05: khi làm B4, gọi lại cùng logic gắn thông tin (có thể tách phần "kiểm + gán" của `AttachContactAsync` thành hàm riêng chạy trong khóa/giao dịch của API-05) thay vì chép lại, để thứ tự kiểm tra và câu thông báo không lệch nhau.

### Việc tiếp theo

- B3 đạt → luồng be được tiếp B4 (BE-24b · API-05) theo `1-thiet-ke.md`.
- **Bắt buộc trước khi ghép `lane/CUOC-THI-be`**: sửa phát hiện Trung bình của review B2 (bắt `DbUpdateException` ở API-03); ghi vào bàn giao mục B4 (hoặc mục sửa riêng) kèm mã commit.
- Sửa kèm (không bắt buộc): ghi mã commit B2, B3 vào bàn giao; lỗi gõ dòng 62.
- Nhắc lại yêu cầu từ review B1: ở B4 kiểm API-02 sau khi nộp (`score`, `total = total_questions`, `submittedAt …Z`).
