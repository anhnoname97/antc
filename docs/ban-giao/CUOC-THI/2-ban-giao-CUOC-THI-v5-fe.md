# Bàn giao luồng CUOC-THI-v5-fe

## F8 · Luồng làm bài theo đề của cuộc (2026-10-18)

Commit `c9cad8d3` trên `lane/CUOC-THI-v5-fe`. Không có `3-review-CUOC-THI-v5-fe.md`, nên không có mục review nào phải sửa kèm.

### Đã làm
- Lấy F4b từ `wip/CUOC-THI-F4b` (`8dce11fa`) bằng `git apply --3way` cho `exam.js`, `contest.css`, gộp thủ công một xung đột ở `enterExam`. Bỏ phần sửa `thiPage.cshtml` của WIP vì trang đã chuyển sang `Partials/contest/_LuongThi.cshtml`. Có: đồng hồ đọc, màn "Xong chuyên đề" (`#chuyen-de-N/xong`), làm lại chuyên đề, `routeSeq` chống route chạy chồng, `paintFailed` trả focus.
- Hệ số đồng hồ lấy từ `state.contest.readTimerFactor` (API-02); luyện tập luôn là 1. Không còn `data-read-timer-factor`.
- Thứ tự và số câu chuyên đề theo `topics` của API-02 (`byContest`); QUIZ-01 chỉ cho tiêu đề, giới thiệu, thuật ngữ. Chưa có API-02 (mất mạng) thì giữ thứ tự QUIZ-01 rồi áp lại khi `refresh`.
- Khóa theo QĐ-025: chuyên đề thứ n mở khi chuyên đề n-1 đã xong (thay "Chuyên đề 1 trước"). Chữ "Tám/bảy/Chuyên đề 1" đã bỏ; lý do khóa ghi "mở sau khi xong Chuyên đề X". Vào chuyên đề khóa bằng URL thì về danh sách.
- `phase` khác `open` (hoặc lượt không có cuộc, đã đồng bộ API-02) không gửi API-03: bấm đáp án hiện "Cuộc thi đã đóng…", danh sách có hộp báo (`submit_only` nói vẫn nộp được nếu đã đủ câu). Luyện tập không bị ảnh hưởng.
- Đổi lượt/cuộc (`entry-changed`, đăng ký xong) xóa bộ nhớ chuyên đề/câu hỏi đã tải (`resetLoaded`).
- Mock (`contest-api.js`): `?mock=small` thêm cuộc 5 (2 chuyên đề CĐ2, CĐ3, không có CĐ1, hệ số 0,5), `?mock=submitonly` cho API-02 báo `submit_only`; mock trả `readTimerFactor` theo cuộc.

### Kiểm chứng (thật)
- `.\run-local.ps1 -NoRun`: 0 lỗi build (70 cảnh báo cũ). `dotnet run --no-build --urls http://localhost:11003` → `/cuoc-thi/lam-bai/` 200. `node --check` không chạy riêng; trang tải và chạy không lỗi console.
- Playwright + Edge, giả lập đồng hồ: `python -I -X utf8 C:\GTSC\DMST\agent-artifacts\CUOC-THI-v5-fe\f8-kiem-chung.py` → **TẤT CẢ ĐẠT** (47 kiểm tra): đề 2 chuyên đề không CĐ1 (CĐ2 mở, CĐ3 khóa, vào CĐ3 bằng URL về danh sách; làm hết 24 câu CĐ2 với đồng hồ sec×0,5: cầu 1 sec=76 → còn 37 giây, nút Tiếp mở khi hết giờ; màn Xong "đúng x trên 24", CĐ3 mở, nút "Làm lại chuyên đề 2"); cuộc 2 (CĐ5–8, không CĐ1) CĐ5 mở, CĐ6 khóa, hệ số 1 (sec=68 → 67); `submit_only`: có hộp báo, không có lần gọi API-03 nào (đếm log mock), không đáp án bị khóa; 390px không tràn ngang; luyện tập 8 chuyên đề, CĐ1 mở, CĐ2 khóa, không hộp báo.
- Ảnh/kết quả ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v5-fe\`: `f8-a-menu-1440.png`, `f8-a-xong-1440.png`, `f8-b-cau-hoi-1440.png`, `f8-c-submit-only-1440.png`, `f8-d-menu-390.png`, `f8-kiem-chung.py`, `web.log`.
- Dừng web bằng PID 95968 (qua cổng 11003).

### Chưa kiểm được
- Chưa xem trực tiếp các ảnh chụp (đọc ảnh ngoài worktree bị từ chối quyền); bố cục chỉ kiểm bằng số đo (không tràn ngang), không kiểm bằng mắt, kể cả 744px và màn Xong ở 390px.
- Chưa chạy với API thật (API-02 `topics`/`contest.phase`/`readTimerFactor` thật từ B8a): `?c=5` không tồn tại ở máy chủ thật nên mọi kiểm chứng dùng mock. Chưa thử cuộc thật có hệ số khác 1.
- Chưa thử mất mạng giữa chừng sau khi đổi thứ tự (đường `refresh` → `byContest`) bằng mock `network`.

### Giả định / sai khác so với thiết kế
- "Lần lượt" là bắt buộc ở giao diện, không đổi gì ở máy chủ (đúng QĐ-026: Q2 vế ép ở API-03 còn mở).
- Luyện tập cũng khóa theo thứ tự QUIZ-01 (CĐ1 trước, như trước đây), không phải quy tắc của cuộc.
- Lượt đã xong chuyên đề bấm "Làm lại" ở chế độ thi chỉ xem lại đáp án đã lưu (không gửi lại API-03), ghi chú "điểm chỉ tính lần đầu" như WIP.
- Lượt không có cuộc (`contest: null`) coi là `closed` (R5) nên không trả lời được.
- Hệ số rỗng/sai định dạng/âm → 1; chấp nhận "0,5" và "0.5"; hệ số 0 → không phải chờ.
- Không đổi `_LuongThi.cshtml` (không cần): F9 sẽ thêm nút Nộp bài.
- Hai khối chữ "đã đóng" chỉ dựa `phase`; không dùng `serverTime`.
