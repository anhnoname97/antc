
## B14 · 2026-10-18 · Máy chủ ép thứ tự chuyên đề ở API-03 (QĐ-025, QĐ-027)

**Đã làm** (nhánh `lane/CUOC-THI-v7`):
- `ContestAttemptService.SaveAnswerAsync`: sau các kiểm tra hiện có (đã nộp, cuộc đóng, câu ngoài đề, đáp án sai) và sau bước trả lại đáp án đã lưu, kiểm thêm: mọi chuyên đề đứng trước chuyên đề của câu (theo thứ tự `contest.Topics` = thứ tự đề, tức API-02 `topics`) phải xong. "Xong" = số câu của đề trong chuyên đề đó đã có đáp án của lượt này >= `Count` của chuyên đề trong đề. Vi phạm: không lưu, trả lỗi.
- **Mã lỗi đề xuất: `TOPIC_LOCKED`, HTTP 409**, dạng QĐ-004 `{ error: { code, message, fields } }`, message "Hãy hoàn thành Chuyên đề {n} trước khi làm chuyên đề này." (n = chuyên đề đầu tiên chưa xong). Chọn 409 vì là xung đột trạng thái (cùng nhóm `INCOMPLETE_ANSWERS`, `ALREADY_SUBMITTED`). Ánh xạ ở `ContestController.Error`.
- FE: `exam.js` thêm câu báo `TOPIC_LOCKED` vào `ERR_TEXT`; `contest-store.js` thêm vào `DROP_CODES` (hàng đợi gửi lại bỏ câu này, vì thử lại không bao giờ thành công khi chưa đổi trạng thái).
- Test mới trong `ContestAttemptServiceTests`: CĐ2 trước khi xong CĐ1 bị từ chối và không lưu; CĐ1 xong một nửa vẫn khóa CĐ2; xong CĐ1 thì CĐ2 ghi được, gửi lại câu đã có vẫn `stored=false`; đề không có CĐ1 (chuyên đề đầu của đề tự do); đề đảo thứ tự (2 rồi 1); đáp án ở cuộc khác không tính.

**Lệnh đã chạy**: `dotnet test Umbraco.Plugin.Custom.Tests` trong `src/ANTC.Portal.App` → Passed 97/97, 0 lỗi (trước là 95; thêm 2 test).

**Chưa kiểm**: chưa chạy web / gọi HTTP thật và chưa thử trên trình duyệt (FE chỉ thêm một dòng thông báo và một mã vào danh sách bỏ khỏi hàng đợi; giao diện vốn đã khóa chuyên đề theo QĐ-025 nên bình thường không gửi lệnh vi phạm). Mock `contest-api.js` chưa ép thứ tự (chỉ dùng khi `?mock`). Việc kiểm HTTP thật thuộc K1.

**Giả định**: thứ tự = `contest.Topics` (SortOrder rồi TopicId, đã dùng ở API-02); đề không có CĐ1 thì chuyên đề đầu của đề không bị khóa. Lượt cũ không có cuộc đã bị `CONTEST_CLOSED` trước nên không đụng.

**Sai khác so với thiết kế**: không có. Bảng mã lỗi trong sheet "API"/xlsx chưa có `TOPIC_LOCKED`; Orchestrator cần ghi vào `1-thiet-ke.md` (tôi không sửa file đó).

Không có mục review chưa xử lý cho luồng này (chưa có `3-review-CUOC-THI-v7.md`).

## K1 · 2026-10-18 · Kiểm các mục chưa kiểm (QĐ-027)

**Kết luận: đạt cả 5 nhóm, không phát hiện lỗi, không sửa code, không có commit** (worktree sạch; commit gần nhất vẫn là `c91f5ee5`). Mục review `3-review-CUOC-THI-v7.md` không giao việc sửa cho Worker.

**Cách chạy**: `.\run-local.ps1 -Reset -NoRun` (build 0 lỗi), rồi `dotnet run --no-build --urls http://localhost:11002` trong `Umbraco.Web.UI`; CSDL xóa sạch trước đó. Bằng chứng ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v7\`: `k1-api.txt` (gọi HTTP), `k1-backoffice.txt`, `k1-timer.txt`, `web.log`, ảnh `k1-bo-list.png`, `k1-bo-form.png`, `k1-bo-409.png`, `k1-timer-{0.5,0,2}.png` (tôi không mở lại ảnh, chỉ đọc kết quả bằng văn bản).

1. **uSync `cuocThiLamBaiPage` trên CSDL trống**: log `uSync_FirstBoot ... processed 219 items, 165 changes`, `uSync: Startup Complete`, không lỗi uSync. `/cuoc-thi/lam-bai/?c=1` trả 200, tiêu đề "Làm bài", nạp `exam.js`. Cuộc thi mẫu nạp tự động (API-07 trả 1 cuộc `ongoing`).
2. **POST entries (API-01) chế độ `named`**: thiếu `consent` → 400 `VALIDATION` có `fields.consent`; hợp lệ → 201, `attemptNo` 1; cùng số viết dạng `+84…` → 201, `attemptNo` 2; lần 3 (số viết có dấu cách) → 409 `ATTEMPT_LIMIT`; `contestId` không tồn tại → 404 `CONTEST_NOT_FOUND`; thiếu `contestId` → 400 `VALIDATION`. Đếm lượt theo cuộc: phần này chỉ có một cuộc nên chưa kiểm được "lượt ở cuộc khác không tính" qua HTTP (test đơn vị có).
3. **API-02..05 thật** (200 câu của cuộc mẫu): API-02 token đúng/sai/thiếu → 200/401/401; API-03: CĐ2 trước khi xong CĐ1 → 409 `TOPIC_LOCKED` (xác minh B14 qua HTTP, dạng QĐ-004), câu lạ → 400 `UNKNOWN_QUESTION`, đáp án sai chữ → 400 `INVALID_OPTION`, lần đầu `stored:true`, gửi lại khác `stored:false` giữ đáp án đầu; làm lần lượt 200 câu theo thứ tự chuyên đề không lỗi; API-05 khi chưa đủ câu → 409 `INCOMPLETE_ANSWERS`; đủ câu → 200 `score 165` (khớp 35 câu cố ý sai), `eligibleForPrize:true`, `byTopic` 8 phần; nộp lại → 200 cùng kết quả; sau nộp API-03/API-04 → 409 `ALREADY_SUBMITTED`; API-04 lượt đã `named` → 409 `ALREADY_NAMED`. Lượt ẩn danh: API-04 sai → 400 `VALIDATION` (3 trường); số đã đủ lượt → 409 `ATTEMPT_LIMIT`; số mới → 200 `attemptNo 1`; API-05 kèm `contact` sai → 400, số hết lượt → 409 (lượt vẫn mở), số hợp lệ → 200, `mode:named`, `attemptNo:2` (số đó đã có 1 lượt `named`).
4. **Form quản trị B11 trong backoffice** (Playwright, đăng nhập `admin@antc.local`): mục "Cuộc thi" hiển thị cuộc mẫu; form mở được, ghi chú "Cuộc thi đã có 12 lượt dự thi: không thể đổi chuyên đề/câu hỏi hoặc xóa cuộc thi." Đổi gia hạn 24→48, hệ số 1→0.5, lĩnh vực →`vieclam` và lưu (không đụng bộ đề) → "Đã cập nhật cuộc thi."; mở lại thấy đúng giá trị; `GET /api/v1/contests` trả `focusArea=vieclam`, `submitUntil` = `endAt` + 48 giờ. Bỏ một câu khỏi bộ đề rồi lưu, và bấm Xóa → cả hai hiện "Cuộc thi đã có lượt dự thi nên không thể xóa hoặc đổi bộ đề. (12 lượt)" (mã `CONTEST_HAS_ENTRIES`, `Conflict` ở `ContestAdminController`); UI không hiện mã HTTP nên **mã 409 xác nhận qua đọc code, chưa bắt được response**.
5. **Đồng hồ đọc**: đặt hệ số qua form quản trị rồi mở màn làm bài thật, chọn đáp án sai câu CĐ1 đầu (`sec=86`): hệ số 0.5 → "Còn 42 giây" (API-02 `readTimerFactor 0.5`), hệ số 2 → "Còn 2 phút 51 giây" (`2.0`), hệ số 0 → không đợi, nút đi tiếp mở ngay (`0.0`). Khớp `ceil(sec × hệ số)`.

**Chưa kiểm được**: giá trị ngoài khoảng (`submitGraceHours` >168, `readTimerFactor` >5) trả 400 qua HTTP (ô nhập HTML chặn trước; không lấy được bearer để gọi thẳng API, nên dựa vào test đơn vị đã có); mã 409 thật của admin (như trên); đếm lượt theo cuộc giữa hai cuộc; thử trên điện thoại/trình duyệt khác; chạy trên CSDL cũ có dữ liệu (chỉ `-Reset`).

**Quan sát (không sửa, ngoài phạm vi)**:
- Form sửa cuộc thi dùng `datetime-local` nên mỗi lần lưu **làm tròn mất giây** của giờ kết thúc (cuộc mẫu `endAt` 16:59:59Z → 16:59:00Z, `submitUntil` theo đó). Nếu muốn giữ `23:59:59` thì cần chỉnh form (thêm bước giây) hoặc service; đề xuất Orchestrator quyết.
- uSync tự ghi lại BOM/xuống dòng vào 5 view (`home`, `thamGiaPage`, `thiPage`, `thiThuPage`, `ungPhoPage`) khi web chạy; tôi hoàn lại bằng `git checkout`, không commit (đã biết từ review B7).
- Bảng mã lỗi vẫn chưa có `TOPIC_LOCKED` (Orchestrator ghi, như review B14).

**Trạng thái môi trường**: web 11002 đã dừng bằng PID của chính mình (113364 và tiến trình cha 25148). CSDL local của luồng còn giá trị thử (gia hạn 48 giờ, lĩnh vực `vieclam`, hệ số 1, nhiều lượt thử); `-Reset` sẽ xóa. Giả định: không có thay đổi nào cần commit nên không tạo commit rỗng.
