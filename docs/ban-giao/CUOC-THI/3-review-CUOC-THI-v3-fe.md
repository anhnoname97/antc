# Review luồng CUOC-THI-v3-fe

## Review F7 · 2026-10-18

### Phạm vi đã review
- Diff `f6557b4e..HEAD` của worktree `wt\CUOC-THI-v3-fe` (5 file: `_LuongThi.cshtml`, `contest.css`, `contest-api.js`, `exam.js`, `register.js`), đối chiếu `1-thiet-ke.md` dòng F7, R5 (API-07, API-01), QĐ-024, báo cáo `2-ban-giao-CUOC-THI-v3-fe.md` mục F7.
- Có đọc thêm chữ ký `init`/`loadEntry` trong `contest-store.js`, `contest-api.js` để xác nhận cách truyền `?c`.
- Không build, không chạy web, không xem ảnh. Kết quả "40 kiểm tra TAT CA DAT" của Playwright là lời khai của Worker; script `f7-kiem-chung.py` có ở `agent-artifacts`, tôi chưa chạy lại và `web.log` không chứa dòng kết quả đó nên chưa tự xác minh được.
- Chỉ kiểm trên mock (BE B6–B10 chưa vào), Worker đã nêu rõ.

### Đối chiếu tiêu chí F7
| Tiêu chí | Kết quả |
|---|---|
| `?c=<id>` có hiệu lực | Đạt: `renderSchedule` chọn cuộc `ongoing` theo id; `?c` sai/sắp tới/đã kết thúc → thông báo nêu lý do + gợi ý |
| Không `?c`, 1 cuộc ongoing → dùng luôn | Đạt (`register.js` `selectContest(ongoing[0], false)`) |
| Nhiều cuộc → danh sách chọn | Đạt (`listHtml`, link giữ tham số URL khác) |
| Không cuộc → "Hiện chưa có cuộc thi đang diễn ra" + sắp tới + Thử sức | Đạt (`showNone`; nút luyện tập `data-practice` nằm ngoài `#regsec`) |
| Tên, ngày, "tối đa n lượt" lấy từ cuộc, không viết cứng | Đạt: view bỏ `IContestSettings`, thay bằng `<span data-max>`; `exam.js` bỏ mặc định 2 lượt |
| `contestId` số trong API-01 | Đạt (`{ ...payload, contestId: contest.id }`); mock không còn nhánh khoan dung (điểm dặn của review F6) |
| Ngày theo giờ Việt Nam | Đạt (`Intl`, `Asia/Ho_Chi_Minh`) |
| Escape XSS | Đạt: dữ liệu cuộc đi qua `esc()` hoặc `textContent`; không `Html.Raw`, không `style=` mới |

### Phát hiện
Không có lỗi từ mức Trung bình trở lên.

#### [Thấp] Quản lý tiêu điểm/đọc màn hình khi chuyển từ "đang tải" sang danh sách
- Vị trí: `register.js` `showPick`/`selectContest`; `_LuongThi.cshtml` `#pickbox role="status"`.
- Bằng chứng: nội dung thay đổi bằng `innerHTML`, không đặt focus vào tiêu đề; `role="status"` sẽ đọc cả khối dài.
- Hướng khắc phục (không bắt buộc): để F8/F9 hoặc đợt a11y xử lý.

#### [Thấp] Nút "Chọn cuộc thi khác" chỉ ở màn đăng ký
- Báo cáo đã ghi (giả định 1): đổi cuộc từ màn làm bài thuộc F8. Chấp nhận.

### Sai khác tài liệu ↔ code
- `rulesText`, `rulesLink`, `dataRetentionDays` vẫn lấy từ `thiPage` cha, chung mọi cuộc, vì API-07 không có trường này. Đây là giới hạn của contract, không phải lỗi F7; ghi nhận.
- Chữ "Chuyên đề 1 phải xong trước" trong `exam.js` còn lại, thuộc F8 (chờ Q2).

### Cần xác minh
- Chạy thật với BE (API-07, `contestId` ở API-01) ở I2.
- Header site mất kiểu trong ảnh headless Worker nêu: ngoài phạm vi F7; nên kiểm ở lượt chạy tiếp theo.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có (Q1 thi ẩn danh còn mở, F7 giữ nguyên hành vi hiện có đúng như thiết kế mặc định).

### Kết luận
F7 đạt tiêu chí nghiệm thu trên mock, không lỗi từ Trung bình trở lên. Rủi ro còn lại: chưa thử với BE thật và chưa tự chạy lại bộ kiểm Playwright.

Sẵn sàng để điều phối ghép lane `CUOC-THI-v3-fe` (F6+F7 gộp review theo thiết kế); F8 vẫn chờ Q2, Q6.
