# Bàn giao luồng CUOC-THI-v2-fe

## F6 · 2026-10-18 · contest-api.js / contest-store.js theo cuộc thi

Trạng thái: **xong, đã commit** `0e482cf2` trên `lane/CUOC-THI-v2-fe`. Worktree sạch. `3-review-CUOC-THI-v2-fe.md` chưa tồn tại nên không có mục review cần xử lý.

Căn cứ: `1-thiet-ke.md` dòng task F6, R5 (QĐ-024: CXN-C, D, E chốt theo khuyến nghị). F6 "Làm được", phụ thuộc M1a và C2 đã xong.

### Đã làm (chỉ 2 file, không sửa C#, không sửa view)
`wwwroot/assets/js/contest/contest-api.js`, `contest-store.js`.

- `createEntry(payload)`: gửi nguyên `payload`, nên `payload.contestId` đi theo (F7 sẽ điền). `saveEntry` lưu `contestId`.
- `getSchedule()` mới: `GET /api/v1/contests` (API-07).
- `at_entry` đổi sang `{ v: 2, last, entries: { "<contestId>": {...} } }`: mỗi cuộc một lượt, lượt cuộc khác không bị ghi đè. Dạng phẳng cũ (khóa `at_entry` không có `contestId`) vẫn đọc được, quy về khóa `"0"` / `contestId: null`.
  - `loadEntry(contestId)`: bỏ trống là lượt dùng gần nhất (`exam.js` gọi `loadEntry()` nên không phải sửa), `null` là lượt cũ. `clearEntry(contestId)` chỉ xóa một cuộc. Thêm `allEntries()`.
- `fetchTopics(contestId)`, `fetchQuestions(cd, contestId)`: thêm `?contest=<id>` khi có; cache theo cuộc.
- Store: `init(contestId)` (bỏ trống: lượt gần nhất); `state.contestId`, `state.contest` (API-02), `state.topics` (API-02); `loadTopics()`/`loadQuestions(cd)` mặc định theo `state.contestId` nên `exam.js` không đổi mà vẫn gọi đúng cuộc; `enterPractice()` đặt `contestId = null` (Thử sức dùng cả ngân hàng). Hàng đợi gửi lại: chỉ bỏ mục của lượt đã bị thay/xóa, không xóa mục của cuộc khác; `clearSession`, sự kiện `storage` so token theo cuộc.
- Mock (`localhost ?mock=`) theo R5: 4 cuộc (1 và 2 đang diễn ra, chia đôi các chuyên đề thật; 3 sắp tới; 4 đã kết thúc), `maxAttempts` khác nhau (2 và 3), đếm lượt theo `(cuộc, số)`, API-02 trả `contest{phase, readTimerFactor…}` và `topics`, `phase` ảnh hưởng API-03/04/05, QUIZ mock lọc theo cuộc (`CONTEST_NOT_FOUND`, `CONTEST_CLOSED` cho cuộc sắp tới, `UNKNOWN_TOPIC`). Thêm `?mock=notfound`; `?mock=closed` cũng áp cho API-07.

### Kiểm chứng (đã chạy thật)
- `.\run-local.ps1 -NoRun`: build 0 lỗi (70 cảnh báo cũ về gói).
- `dotnet run --no-build --urls http://localhost:11003` (log `uSync: Startup Complete`), `node --check contest-api.js`, rồi script Node `f6-kiem-chung.mjs` (import trực tiếp 2 module, `localStorage`/`location` giả, `fetch` trỏ tới web thật cổng 11003 cho QUIZ-01/02): **tất cả kiểm tra đạt** (in "TAT CA DAT") (sau khi sửa một kỳ vọng sai trong chính script ở mục URL). Gồm: API-07 hai cuộc đang diễn ra + 1 sắp tới + 1 đã kết thúc; đăng ký cả hai cuộc cùng số điện thoại (`attemptNo` 1 ở mỗi cuộc, `ATTEMPT_LIMIT` ở lượt thứ 3 của cuộc 1 nhưng cuộc 2 vẫn còn); `at_entry` giữ cả hai lượt; trả lời 2 câu ở cuộc 1, 1 câu ở cuộc 2, `init(1)`/`init(2)` ("tải lại") khôi phục đúng 2/1 câu và đúng `total` mỗi cuộc; `?mock=closed` (API-01, API-02 `phase: closed`, API-03, API-07), `?mock=notfound`, `?mock=server`; `CONTEST_NOT_FOUND`/`CONTEST_CLOSED`/`VALIDATION`; đọc `at_entry` dạng phẳng cũ; ở chế độ không phải localhost, URL gọi là `/api/v1/quiz/topics?contest=7`, `/api/v1/quiz/topics/5/questions?contest=7`, `/api/v1/contests`, `POST /api/v1/contest/entries`.
- Dừng web bằng PID lấy từ cổng 11003. Khi web khởi động, Umbraco ghi lại 5 file `Views/*.cshtml` (chỉ đổi cuối file); tôi đã `git checkout` các file đó, không đưa vào commit.

### Chưa kiểm được / giới hạn
- **Chưa chạy trên trình duyệt thật** (không có ảnh chụp): kiểm chứng ở mức module bằng Node, không qua giao diện `register.js`/`exam.js`. Chưa kiểm sự kiện `storage` giữa hai tab thật.
- Không kiểm với BE thật: B5 đến B10 chưa có, nên `contestId`, `?contest=`, API-07, API-02 `contest`/`topics` chỉ được kiểm trên mock và ở mức URL gọi. Mock QUIZ lọc ở client vì `?contest=` chưa có ở BE.
- Không lưu được `f6-kiem-chung.mjs` vào `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v2-fe\` (thư mục chưa tồn tại và ghi bị từ chối quyền). Script ở scratchpad của phiên: `C:\Users\Gearvn\AppData\Local\Temp\claude\C--GTSC-DMST-wt-CUOC-THI-v2-fe\02503b91-c077-46fa-8b0f-f37bbca7df3f\scratchpad\f6-kiem-chung.mjs`.

### Giả định và sai khác so với thiết kế
1. Mock **khoan dung** hơn R5 ở một điểm: `createEntry` thiếu `contestId` thì lấy cuộc đang diễn ra đầu tiên (BE thật sẽ trả `400 VALIDATION fields.contestId`). Lý do: `register.js` chưa gửi `contestId` cho tới F7; không làm thế thì luồng đăng ký trên mock vỡ giữa F6 và F7. Gỡ khi F7 xong.
2. `register.js` chưa truyền `contestId` và trang chưa đọc `?c=` (thuộc F7); F6 chỉ cung cấp tham số `init(contestId)`.
3. Chưa dùng `readTimerFactor`, `submitUntil`, `phase` trong giao diện (thuộc F8/F9); store chỉ giữ giá trị API-02 trong `state.contest`.
4. Mã cuộc trong mock (1 đến 4) và tên cuộc là dữ liệu giả; không viết cứng số lượng câu (lấy từ chuyên đề thật).
5. Lượt cũ trong `at_mock` (không có `contestId`) vẫn chạy: dùng cả ngân hàng, không có `contest`.

TRANG-THAI: XONG
