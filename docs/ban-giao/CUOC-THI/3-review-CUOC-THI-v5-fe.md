# Review luồng CUOC-THI-v5-fe

## Review F8 · 2026-10-18

Phạm vi: commit `c9cad8d3` (`lane/CUOC-THI-v5-fe`, khoảng `4a70906e..HEAD`): `exam.js`, `contest.css`, `contest-api.js`. Đối chiếu `1-thiet-ke.md` dòng F8, QĐ-014, QĐ-016, QĐ-025, QĐ-026. Không build, không chạy web; chỉ đọc code ở commit và `agent-artifacts\CUOC-THI-v5-fe\` (không mở ảnh).

### Kết luận: ĐẠT (không còn lỗi từ mức Trung bình trở lên)

### Đối chiếu tiêu chí F8
| Tiêu chí | Kết quả | Bằng chứng (code) |
|---|---|---|
| Danh sách chuyên đề, số câu, tiến độ theo `topics` API-02 | Đạt | `byContest` (`exam.js:504`) lấy thứ tự và `count` từ `state.topics`; QUIZ-01 chỉ cho tiêu đề/giới thiệu/thuật ngữ. `refresh` áp lại khi API-02 đến sau (`:623`). Câu hỏi tải kèm `contestId` (`contest-store.js:465-466`) nên số câu API-02 khớp với đề QUIZ-02 theo cuộc |
| Khóa theo thứ tự của đề (QĐ-025) | Đạt | `isLocked` (`:70`): chuyên đề n mở khi n-1 `done`; không còn "CĐ1 trước"/"Tám/bảy". Vào bằng URL khi khóa thì về danh sách (`:574`). Đề không có CĐ1 chạy được (mock cuộc 5, cuộc 2) |
| Hệ số đồng hồ từ `contest.readTimerFactor` | Đạt | `readFactor` (`:43`), luyện tập = 1; `parseFactor` chịu "0,5"/"0.5"/rỗng/âm. Mock trả theo cuộc. Khớp BE: `ReadTimerFactor` có ở `ContestAttemptService` (test `ContestAttemptServiceTests.cs:141`) |
| `phase` khác `open` không cho trả lời | Đạt | `phaseClosed`/`pick` (`:45`, `:426`) chặn trước khi gọi API-03; hộp báo ở menu (`phaseHtml`); `submit_only` nói vẫn nộp được (khớp QĐ-014/015). Lượt `contest:null` coi là closed (R5). Nếu chưa đồng bộ (`synced=false`) vẫn gửi và máy chủ trả `CONTEST_CLOSED` được xử lý (`:441`) |
| F4b giữ lại, kiểm chứng như code mới (QĐ-026) | Đạt | Đồng hồ đọc, màn Xong, làm lại, `routeSeq`, `paintFailed` có mặt; bỏ phần `thiPage.cshtml` của WIP là đúng vì view đã chuyển sang `_LuongThi.cshtml` |
| Mock: đề không CĐ1, đề 2 chuyên đề, `submit_only` | Đạt | `contest-api.js`: `?mock=small` (cuộc 5), `?mock=submitonly`; cuộc 5 chỉ hiện khi `small` nên không làm lệch các mock cũ |

Không phát hiện: lộ đáp án mới ngoài QĐ-016; đổi tên trường DTO; chữ `style="..."`; đụng file của luồng khác (chỉ 3 file FE).

### Lỗi / ghi chú
1. **Thấp** · Bằng chứng chạy thử không lưu được: `f8-kiem-chung.py` in kết quả ra stdout, không có file kết quả (`.txt`/log) trong `agent-artifacts\CUOC-THI-v5-fe\` (`web.log` là log máy chủ, `web.err` rỗng). Không kiểm lại được "47 kiểm tra ĐẠT" ngoài lời báo cáo. Hướng sửa: lần sau chạy `... > f8-ket-qua.txt`.
2. **Thấp** · Bố cục chưa được ai xem bằng mắt: Worker thừa nhận không mở được ảnh; 744px và màn Xong ở 390px chỉ có phép đo không tràn ngang. CSS mới (`contest.css`: `.exam__done .infobox > b`, `.qactions` cột ở ≤480px) là phần F4b chưa review. Hướng xử lý: gom vào lượt xem ảnh của I2/phiên riêng (phiên điều phối không mở ảnh), không chặn F8.
3. **Thấp** · `doneHtml` (`:225`) luôn hiện "Chuyên đề N+1 đã mở" kể cả khi N+1 đã làm xong từ trước (làm lại CĐ N). Chỉ là câu chữ hơi thừa, có thể bỏ khi `nx` đã `done`.
4. **Thông tin (không phải lỗi)** · Thứ tự chuyên đề chỉ được ép ở giao diện; API-03 chưa ép (Q2 vế máy chủ còn mở theo QĐ-026). Người gọi thẳng API-03 làm lệch thứ tự được. Cùng nhóm rủi ro công bằng đã chấp nhận ở QĐ-016.
5. **Thông tin** · Chưa kiểm với API-02 thật (`topics`, `phase`, `readTimerFactor` từ B8a/B8b) và chưa thử mất mạng sau khi đổi thứ tự; việc này thuộc I2 (tích hợp, tắt mock).

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Việc tiếp theo
F8 đạt, mở F9 (phụ thuộc F8). Yêu cầu cho Worker ở F9/I2: lưu kết quả kiểm chứng ra file văn bản; I2 chạy đầu–cuối với API thật cho cuộc có hệ số khác 1 và đề không có CĐ1.
