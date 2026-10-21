# Review luồng CUOC-THI-v2-fe

## Review F6 · 2026-10-18

### Phạm vi đã review
- Commit `0e482cf2` (khoảng `f89eb861..HEAD` ở `C:\GTSC\DMST\wt\CUOC-THI-v2-fe`): `contest-api.js`, `contest-store.js`.
- Chuẩn so sánh: `1-thiet-ke.md` dòng F6 và R5 (API-01, API-02, API-07, QUIZ `?contest=`), QĐ-024 (CXN-C, D, E chốt theo khuyến nghị), báo cáo `2-ban-giao-CUOC-THI-v2-fe.md` mục F6.
- Không review được: chạy thực tế. Không build, không chạy web. Script kiểm chứng `f6-kiem-chung.mjs` của Worker không nằm ở `agent-artifacts\CUOC-THI-v2-fe\` (thư mục không tồn tại), nên kết quả "TẤT CẢ ĐẠT" chỉ dựa vào lời báo cáo. Đã đọc diff và lần theo logic bằng tay.

### Đối chiếu tiêu chí F6
| Tiêu chí | Kết quả |
|---|---|
| `createEntry` gửi `contestId` | Đạt: gửi nguyên `payload`; `saveEntry` lưu `contestId`. |
| `getSchedule()` (API-07) | Đạt: `GET /api/v1/contests`, không cache client, mock có `serverTime/ongoing/upcoming/ended`, sắp xếp đúng R5. |
| `at_entry` theo `contestId`, không ghi đè | Đạt: `{v:2,last,entries}`; đọc được dạng phẳng cũ (khóa `"0"`); `clearEntry`, `clearSession`, sự kiện `storage`, `syncEntry`, hàng đợi đều theo cuộc. |
| QUIZ kèm `?contest=` | Đạt: `contestQuery` + cache theo cuộc; `loadTopics/loadQuestions` mặc định theo `state.contestId`; luyện tập đặt `contestId = null` nên không đổi hành vi Thử sức. |
| Mock đúng R5 | Đạt, trừ một điểm khoan dung có chủ đích (xem Thấp 1). 4 cuộc, `phase`, `topics`, `contest` ở API-02, đếm lượt theo (cuộc, số), `CONTEST_NOT_FOUND`/`CONTEST_CLOSED`/`VALIDATION` đúng bảng API-01. |
| Ép `closed`, `notfound` | Đạt theo diff: `closed` ép phase `closed` ở API-01/02/03..05/07; `notfound` ở API-01 và API-07 (ba mảng rỗng). |

Không phát hiện đổi file ngoài phạm vi (không đụng C#, view). Comment tiếng Việt không dấu, chữ hiển thị có dấu: đúng quy ước. Không có thông tin bí mật.

### Phát hiện
Không có lỗi từ mức Trung bình trở lên.

#### [Thấp] 1. Mock `createEntry` thiếu `contestId` vẫn thành công
- Vị trí: `contest-api.js`, nhánh `default` của `mockCreateEntry` (`given === undefined || null` → lấy cuộc `open` đầu tiên).
- Bằng chứng: R5 API-01 hàng 1 yêu cầu `400 VALIDATION fields.contestId`; Worker đã ghi đây là sai khác có chủ đích (báo cáo, Giả định 1) để luồng `register.js` không vỡ giữa F6 và F7.
- Hướng khắc phục: chấp nhận trong F6. **F7 phải gỡ nhánh khoan dung này** khi `register.js` gửi `contestId`, để mock không che lỗi quên gửi. Ghi vào danh sách việc của F7.

#### [Thấp] 2. `contestId` phải là số nguyên khi gọi `createEntry`
- Vị trí: `contest-api.js`, kiểm tra `Number.isInteger(given)` và `x.id === given`.
- Tình huống: F7 lấy `?c=3` từ URL dạng chuỗi và truyền thẳng → mock trả `VALIDATION`; BE thật cũng yêu cầu số nguyên.
- Hướng khắc phục: F7 chuyển sang số (`Number`) trước khi gửi.

#### [Thấp] 3. `syncEntry` đổi `last` mỗi lần đồng bộ
- Vị trí: `contest-store.js` `syncEntry` → `saveEntry` đặt `st.last = key`.
- Tình huống: nhiều tab/cuộc; tab đang làm cuộc A đồng bộ làm `last` nhảy về A, ảnh hưởng `init()` không tham số ở tab mở sau. Hệ quả nhỏ vì F7 sẽ luôn truyền `contestId`.
- Hướng khắc phục: không bắt buộc; có thể cân nhắc ở F7.

### Sai khác tài liệu ↔ code
Chỉ điểm Thấp 1 (đã được Worker khai báo). Mock QUIZ lọc ở client vì BE (B9) chưa có: hợp lý, cần kiểm lại với BE thật ở I2.

### Cần xác minh
- Chưa có bằng chứng chạy trình duyệt thật hoặc hai tab thật (sự kiện `storage`). Dồn vào kiểm chứng của F7 (`?mock=` hai cuộc trên 1440/744/390) và I2 (với BE thật: `contestId`, API-07, `contest`/`topics` ở API-02, `?contest=`).
- Script kiểm chứng của Worker không lưu ở thư mục artifacts. Không chặn, nhưng khuyến nghị lưu lại lần sau để review đọc được.

### Đề xuất (không bắt buộc)
- Lưu `f6-kiem-chung.mjs` vào repo công cụ hoặc `agent-artifacts` để chạy lại khi F7 đổi `contest-api.js`.

### Worker phải sửa
Không có.

### Cần người dùng xác nhận
Không có.

### Kết luận
F6 đạt các tiêu chí nghiệm thu về mặt mã và logic; không còn lỗi từ Trung bình trở lên. Có thể tiếp tục F7 (đã mở khóa bởi M1b và F6); nhớ gỡ nhánh mock khoan dung và truyền `contestId` dạng số.

TRANG-THAI: DAT
