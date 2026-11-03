# Nhật ký quyết định

Ghi các quyết định đã được người có thẩm quyền xác nhận trong quá trình làm, nhất là những chỗ tài liệu thiết kế (bản nháp trong `docs/ke-hoach`) còn thiếu, chưa rõ hoặc mâu thuẫn với code.

Quy tắc:

- Chỉ ghi quyết định **đã được xác nhận**. Đề xuất chưa duyệt không ghi vào đây.
- Mỗi quyết định một mục, đánh số tăng dần `QĐ-001`, `QĐ-002`…; không đánh lại số.
- Không xóa mục cũ. Khi đổi ý, thêm mục mới và sửa trạng thái mục cũ thành `Thay bằng QĐ-xxx`.
- Tài liệu thiết kế gốc không bị sửa theo nhật ký này. Khi cập nhật tài liệu (bản v4…), ghi lại ở cột trạng thái là đã đưa vào tài liệu.

Trạng thái: `Hiệu lực` · `Thay bằng QĐ-xxx` · `Đã đưa vào tài liệu <tên file/bản>`

## Mẫu

```markdown
### QĐ-xxx · <tiêu đề ngắn>

- Ngày: YYYY-MM-DD · Người xác nhận: <tên/vai trò> · Trạng thái: Hiệu lực
- Phạm vi: <mã công việc, API, bảng, trang… chịu ảnh hưởng>
- Vấn đề: <tài liệu nói gì (nguồn) / code đang thế nào (file) / chỗ chưa rõ>
- Quyết định: <chốt làm thế nào>
- Lý do: <ngắn gọn>
- Ảnh hưởng: <cần sửa gì ở code, tài liệu, dữ liệu>
```

## Các quyết định

### QĐ-001 · Tài liệu thiết kế là bản nháp

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: toàn bộ `docs/ke-hoach/*` và bản dựng `docs/ban-dung/*`
- Vấn đề: tài liệu có mục ghi "đã chốt" (ví dụ `Mo-ta-cong-viec-FE-antoantaichinh-v3.docx › 1.1. Kiến trúc đã chốt`) và sheet "Câu hỏi mở" có cột "Đang giả định".
- Quyết định: coi toàn bộ tài liệu là bản nháp, là nguồn tham chiếu cho ý định thiết kế. Một nội dung chỉ được coi là đã chốt khi có quyết định trong nhật ký này hoặc được xác nhận trực tiếp.
- Lý do: tài liệu chưa qua phê duyệt chính thức.
- Ảnh hưởng: khi tài liệu và code khác nhau ở chỗ quan trọng thì phải hỏi, không tự chọn theo tài liệu.

### QĐ-002 · FE-25 làm luôn API-01 tối thiểu (phương án B, chia đợt)

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: FE-25, BE-22 (API-01 `POST /api/v1/contest/entries`), FE-28, BE-26
- Vấn đề: FE-25 phụ thuộc FE-28 và BE-22, cả hai chưa làm (`docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › "Công việc" › FE-25). Không có API thật thì không kiểm được AC3–AC5. `docs/ban-giao/FE-25/1-thiet-ke.md` › CXN-1, CXN-2a, CXN-2e.
- Quyết định: làm giao diện và lớp gọi API mỏng có mock trước (T1, T2); sau đó Worker trên FE-25 làm API-01 tối thiểu (T4, chỉ phần API-01 của BE-22) rồi nối vào API thật (T5). Lớp `contest-api.js` viết theo chữ ký FE-28 để FE-28 bổ sung. Giới hạn tần suất 10 lần/giờ/IP chưa làm ở FE-25, để BE-26.
- Lý do: bảng `entry` đã có (`Data/Entities.cs`), chi phí thấp; là cách duy nhất kiểm được AC4, AC5 thật.
- Ảnh hưởng: BE-22 khi làm tiếp phải dựa trên `ContestController` và dịch vụ tạo lượt đã có, không viết lại. BE-26 bổ sung giới hạn tần suất cho API-01.
- Cần xem lại theo QĐ-021: lượt thi gắn với từng cuộc thi, trong khi API-01 tối thiểu đang tính theo một cuộc duy nhất. Chưa quyết; giữ Hiệu lực.

### QĐ-003 · API cuộc thi đọc Cài đặt cuộc thi từ nội dung Umbraco

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-01 và các API cuộc thi sau (BE-22, BE-23, BE-24)
- Vấn đề: sheet "Nội dung Umbraco" đặt Cài đặt cuộc thi (`contestStart`, `contestEnd`, `maxAttempts`…) trên document type `thiPage`; API cần đọc chúng. `1-thiet-ke.md` › CXN-2b.
- Quyết định: đọc từ nút nội dung loại `thiPage` qua `IUmbracoContextFactory`, gói trong một dịch vụ `IContestSettings` đăng ký ở `CustomCoreComposer.cs`. Không đưa các cài đặt này vào `appsettings`.
- Lý do: giữ đúng sheet "Nội dung Umbraco"; ban biên tập đổi được trong backoffice; BE-23/24 dùng lại.
- Ảnh hưởng: không sửa uSync hay document type.
- Cần xem lại theo QĐ-018, QĐ-021: cuộc thi có thời gian và số lượt riêng, cấu hình khi thêm cuộc thi (QĐ-019: backoffice trên `origin/main` lưu ở bảng `contest`), nên `thiPage` có thể không còn là nguồn duy nhất của `contestStart`/`contestEnd`/`maxAttempts`. Chưa quyết thay thế; giữ Hiệu lực.

### QĐ-004 · API-01 trả lỗi đủ dạng `{ error: { code, message, fields } }`

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-01; về sau là chuẩn chung (BE-26)
- Vấn đề: sheet "API" r2 quy định lỗi có `code`, `message`, `fields`; `QuizController.cs:29` hiện chỉ trả `code`, `message`. `1-thiet-ke.md` › CXN-2c.
- Quyết định: API-01 trả đủ ba trường ngay từ đầu (`fields` theo tên trường gửi lên: `fullName`, `phone`, `org`, `consent`). Phía FE đọc được cả dạng thiếu `fields`. Chưa sửa `QuizController`; việc đó để BE-26.
- Lý do: bám contract trong tài liệu, không mở rộng phạm vi sang API câu hỏi.
- Ảnh hưởng: BE-26 sửa `QuizController` cho đồng bộ.

### QĐ-005 · Muối băm IP đặt trong cấu hình

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Thay bằng QĐ-009
- Phạm vi: API-01 (cột `IpHash` bảng `entry`), các API cuộc thi khác có lưu IP
- Vấn đề: BE-22 lưu IP dạng băm; cần chỗ giữ muối. `1-thiet-ke.md` › CXN-2d.
- Quyết định: thêm khóa cấu hình `Contest:IpHashSalt`; `appsettings.Local.template.json` có giá trị mẫu cho local; giá trị thật đặt ở môi trường triển khai, không commit.
- Lý do: không để bí mật trong mã nguồn.
- Ảnh hưởng: tài liệu triển khai cần ghi khóa này khi có.

### QĐ-006 · Trạng thái cuộc thi tính từ `contestStart`/`contestEnd`, trống thì là "chưa mở"

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: FE-25 (T3), API-01 (`CONTEST_CLOSED`), các API cuộc thi sau
- Vấn đề: sheet "Nội dung Umbraco" r26–r27 ghi hai trường bắt buộc nhưng nội dung hiện để trống (`uSync/v18/Content/cuộc-thi-trực-tuyến.config:16-20`). `1-thiet-ke.md` › CXN-3.
- Quyết định: thiếu một trong hai ngày → "chưa mở" (không đăng ký được). Tính theo giờ Việt Nam; mở từ `contestStart`, đóng đăng ký tại `contestEnd`. `submitGraceHours` không áp dụng cho đăng ký, chỉ cho nộp bài (BE-24). Trang và API dùng cùng một cách tính.
- Lý do: tránh mở cổng ngoài ý muốn trên môi trường thật.
- Ảnh hưởng: để kiểm thử local, Worker nhập ngày mẫu trong backoffice; uSync xuất lại file nội dung.
- Cần xem lại theo QĐ-018: quy tắc tính trên một cặp ngày duy nhất; với nhiều cuộc thi, trạng thái phải tính theo từng cuộc. Chưa quyết; giữ Hiệu lực.

### QĐ-007 · Màn đăng ký ghi rõ lượt thi gắn với trình duyệt

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: FE-25 (hộp hồng chế độ có tên, hộp ẩn danh)
- Vấn đề: sheet "Câu hỏi mở" #12 đang giả định "ghi rõ điều này ở màn đăng ký"; mô tả FE-25 không có câu này. `1-thiet-ke.md` › CXN-5.
- Quyết định: thêm một gạch đầu dòng vào cả hai hộp: "Lượt thi gắn với trình duyệt bạn đang dùng. Đổi máy hoặc xóa dữ liệu trình duyệt thì không làm tiếp được lượt này."
- Lý do: người dự thi biết trước giới hạn khôi phục lượt.
- Ảnh hưởng: chỉ sửa chữ trong `thiPage.cshtml`.

### QĐ-008 · Commit ngày mẫu cuộc thi vào file nội dung uSync

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: FE-25, nội dung `thiPage` (`uSync/v18/Content/cuộc-thi-trực-tuyến.config`), API-01
- Vấn đề: nội dung hiện để trống `contestStart`/`contestEnd` nên theo QĐ-006 cuộc thi "chưa mở"; review T3/T4 khuyến nghị không commit ngày mẫu và trả file uSync về nguyên trạng (`docs/ban-giao/FE-25/3-review.md` › Review T4 › "Cần người dùng xác nhận" mục 1).
- Quyết định: commit ngày mẫu vào file nội dung uSync: `contestStart` = 2026-10-01 00:00, `contestEnd` = 2026-12-31 23:59, giờ Việt Nam. Người dùng chọn trái khuyến nghị và chấp nhận rủi ro.
- Lý do: ai lấy repo về chạy local cũng thấy ngay cuộc thi đang mở, không phải tự nhập ngày trong backoffice.
- Ảnh hưởng: QĐ-006 giữ nguyên (thiếu ngày → "chưa mở"); bỏ ghi chú "trả file nội dung uSync về nguyên trạng" ở review T3/T4. Với ngày này, nếu triển khai lên môi trường có CSDL trống thì uSync nhập nội dung và **cuộc thi mở ngay** (hôm nay nằm trong khoảng ngày mẫu), trái với QĐ-012. **Trước khi triển khai thật phải nhập ngày thật trong backoffice** (hoặc xóa ngày để giữ "chưa mở"); đưa việc này vào danh sách kiểm tra triển khai.
- Cần xem lại theo QĐ-018: ngày mẫu của một cuộc ở `thiPage` có thể không còn phù hợp khi cuộc thi được tạo trong backoffice. Chưa quyết; giữ Hiệu lực.

### QĐ-009 · Muối băm IP đặt trong cấu hình; thiếu khóa thì vẫn cho đăng ký, `ip_hash` để rỗng

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-01 (cột `IpHash` bảng `entry`), các API cuộc thi khác có lưu IP; thay QĐ-005
- Vấn đề: QĐ-005 chưa nói khi thiếu `Contest:IpHashSalt` thì làm gì. Code T4 ném `InvalidOperationException` → 500, chặn mọi đăng ký (`ContestEntryService.cs:198-205`). `docs/ban-giao/FE-25/3-review.md` › Review T4 › "Thiếu `Contest:IpHashSalt`" và "Cần người dùng xác nhận" mục 2.
- Quyết định:
  - Giữ nội dung QĐ-005: khóa cấu hình `Contest:IpHashSalt`; `appsettings.Local.template.json` có giá trị mẫu cho local; giá trị thật đặt ở môi trường triển khai, không commit.
  - Thiếu khóa (không có hoặc rỗng): **vẫn cho đăng ký**, lưu `ip_hash` rỗng (`null`), không băm IP khi không có muối.
  - Ghi log cảnh báo **lúc khởi động** khi thiếu khóa; không chặn khởi động.
  - Người dùng chọn trái khuyến nghị (phương án a: chặn đăng ký).
- Lý do: ưu tiên tính sẵn sàng, không để người dự thi mất lượt vì lỗi cấu hình; cột `ip_hash` cho phép rỗng (sheet "CSDL" r20).
- Ảnh hưởng: sửa `HashIp` trong `ContestEntryService` và thêm kiểm tra lúc khởi động (T5). Các lượt tạo khi thiếu khóa không có IP băm, nên BE-26 (giới hạn tần suất, nếu dựa vào `ip_hash`) và việc tra soát gian lận không dùng được dữ liệu này. Tài liệu triển khai vẫn phải ghi khóa này.

### QĐ-010 · `attemptNo` của lượt ẩn danh trong phản hồi 201 là `null`

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-01 (phản hồi `201`), API-02 (BE-23), mock `contest-api.js`
- Vấn đề: code T4 trả `attemptNo = 1` cho lượt ẩn danh (`ContestEntryService.cs:126-127`), trong khi `entry.attempt_no` rỗng khi ẩn danh (sheet "CSDL" r13); sheet "API" r5 chỉ có ví dụ cho chế độ có tên. `3-review.md` › Review T4 › "Cần người dùng xác nhận" mục 3.
- Quyết định: lượt ẩn danh trả `"attemptNo": null`. Chế độ có tên giữ nguyên.
- Lý do: một lượt chỉ có một giá trị ở mọi API, khớp CSDL và API-02 sau này.
- Ảnh hưởng: sửa `ContestEntryService` và mock (`contest-api.js:35`) ở T5. FE không dùng `attemptNo` khi `mode = anon` (`register.js:85-87`) nên giao diện không đổi. BE-23 trả cùng giá trị.

### QĐ-011 · Chạy song song theo luồng: Worker được commit vào nhánh `lane/*`

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: quy trình hai agent, mục "Chạy song song theo luồng" trong `CLAUDE.md`, script `C:\GTSC\DMST\antc-agent.ps1`
- Vấn đề: quy tắc chung là không commit khi chưa được đồng ý rõ; chạy theo luồng (worktree) cần Worker commit để điều phối merge được.
- Quyết định: Worker được commit vào nhánh `lane/*` của luồng mình, chỉ trong máy, **không push**, và chỉ khi điều phối chạy với `-AllowCommit`. Merge `lane/*` vào nhánh mã công việc do điều phối làm. Ngoài trường hợp này, quy tắc không commit vẫn giữ.
- Lý do: cho phép các luồng FE/BE chạy song song mà không chờ nhau.
- Ảnh hưởng: không đổi code ứng dụng. Orchestrator vẫn không commit, push, merge.

### QĐ-012 · Chưa mở API-01 trên môi trường thật trước khi có BE-26; xác minh số điện thoại hỏi chủ quản

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-01, BE-22, BE-26, triển khai thật
- Vấn đề: API-01 chưa có giới hạn tần suất (để BE-26 theo QĐ-002), và lượt được đếm theo số điện thoại không xác minh: ai biết số của người khác có thể gọi API để làm hết lượt của người đó. `3-review.md` › Review T4 › "Cần người dùng xác nhận" mục 4.
- Quyết định: không mở API-01 trên môi trường thật trước khi BE-26 xong. Việc có cần xác minh số điện thoại (OTP) hay không là câu hỏi nghiệp vụ, sẽ hỏi chủ quản; chưa làm cho tới khi có trả lời.
- Lý do: tránh lạm dụng API khi chưa có lớp bảo vệ.
- Ảnh hưởng: FE-25 vẫn được merge vào nhánh phát triển; danh sách kiểm tra triển khai phải có mục này (liên quan QĐ-008: ngày mẫu làm cuộc thi mở). Câu hỏi OTP cần ghi vào câu hỏi mở cho chủ quản.

### QĐ-013 · API-02 trả thêm `cd` (số chuyên đề) trong từng đáp án

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-02 `GET /api/v1/contest/entries/me` (BE-23), FE-26, FE-28, mock `contest-api.js`
- Vấn đề: sheet "API" r6 và docx › 6 › API-02 chỉ có `answers: [{ q, a, correct }]`. FE-26 cần biết chuyên đề nào đã xong, còn FE-28 quy định chỉ tải QUIZ-02 khi mở chuyên đề N. `docs/ban-giao/CUOC-THI/1-thiet-ke.md` › CXN-1.
- Quyết định: mỗi phần tử `answers` có thêm `"cd"`: số chuyên đề dạng chuỗi như QUIZ-01 (ví dụ `"1"`), lấy từ `entry_answer.topic`. Các trường khác giữ nguyên.
- Lý do: thêm trường thì tương thích ngược, dữ liệu đã có sẵn; FE không phải tải cả 8 QUIZ-02 mỗi lần mở trang.
- Ảnh hưởng: BE-23 (task B1) trả trường này; FE-28 (F1) đếm câu đã làm theo `cd`; mock trả cùng dạng. Khi làm tài liệu bản v4, sửa sheet "API" r6.

### QĐ-014 · Cửa sổ thời gian của API-03, API-04, API-05

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-03, API-04 (BE-23, BE-24), API-05 (BE-24), FE-28, FE-29; cài đặt `submitGraceHours` của `thiPage`
- Vấn đề: BE-23 ("Công việc" r52) chặn API-03 ngoài thời gian cuộc thi; BE-24 (r53) cho nộp trong 24 giờ sau giờ đóng (cấu hình được); sheet "API" r8–r9 không liệt kê `CONTEST_CLOSED` cho API-04, API-05 và không nói quá hạn nộp thì trả gì. `docs/ban-giao/CUOC-THI/1-thiet-ke.md` › CXN-2.
- Quyết định (theo khuyến nghị):
  - API-03 chỉ nhận đáp án khi cuộc thi đang mở (`GetStatus == Open`, QĐ-006); ngoài giờ trả `403 CONTEST_CLOSED`.
  - API-04 chỉ nhận khi cuộc thi đang mở; ngoài giờ trả `403 CONTEST_CLOSED`.
  - API-05 nhận tới `contestEnd + submitGraceHours` (giờ Việt Nam; `submitGraceHours` rỗng hoặc âm → 24, `0` → không gia hạn); quá hạn trả `403 CONTEST_CLOSED`. Lượt đã nộp vẫn trả lại kết quả cũ bất kể thời gian.
- Lý do: đúng tài liệu ở API-03 và thời gian gia hạn; sau giờ đóng thí sinh chỉ còn nộp, không làm thêm câu.
- Ảnh hưởng: thêm `CONTEST_CLOSED` vào bảng lỗi API-04, API-05; BE-24 đọc `submitGraceHours`. Kết hợp với QĐ-015: lượt chưa trả lời đủ câu lúc `contestEnd` thì không nộp được nữa (thời gian gia hạn chỉ giúp lượt đã làm đủ mà chưa nộp). Khi làm tài liệu bản v4, sửa sheet "API" r8–r9.
- Cần xem lại theo QĐ-018, QĐ-021: các cửa sổ thời gian (`contestEnd`, `submitGraceHours`) phải tính theo từng cuộc thi. Chưa quyết; giữ Hiệu lực.

### QĐ-015 · Phải trả lời đủ mọi câu của ngân hàng mới được nộp bài

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-05 (BE-24), FE-29 (nút Nộp bài), FE-26 (cột bên), mock `contest-api.js`; sheet "Câu hỏi mở" #1
- Vấn đề: "Câu hỏi mở" #1 (Chưa chốt) giả định nộp được khi đã xong Chuyên đề 1; FE-29 ("Công việc" r24) hiện nút khi xong CĐ1; BE-24 (r53) chỉ chặn khi chưa có đáp án nào (`NOTHING_TO_SUBMIT`). `docs/ban-giao/CUOC-THI/1-thiet-ke.md` › CXN-3.
- Quyết định: thí sinh phải trả lời **đủ mọi câu** của ngân hàng đang dùng mới được nộp. Máy chủ từ chối nộp khi chưa đủ; nút Nộp bài chỉ hiện khi đã trả lời hết. Tổng số câu lấy từ ngân hàng đang dùng (`IQuestionBank.Current.TotalQuestions` ở BE; `total` của API-02 / tổng `count` QUIZ-01 ở FE), không viết cứng 200. Người dùng chọn trái khuyến nghị và khác giả định của "Câu hỏi mở" #1.
- Lý do: quyết định nghiệp vụ của người dùng.
- Ảnh hưởng: API-05 thêm kiểm tra "đủ câu" và mã lỗi riêng (chi tiết ở `1-thiet-ke.md` › mục cập nhật 2026-10-17); task B4, F5 và mock của F1 đổi theo. Với QĐ-014, lượt chưa đủ câu khi cuộc thi đóng thì không nộp được. Cần báo chủ quản để đóng "Câu hỏi mở" #1; khi làm tài liệu bản v4, sửa FE-29, BE-24 và sheet "API" r9.
- Cần xem lại theo QĐ-019: "mọi câu của ngân hàng đang dùng" có thể phải hiểu là mọi câu trong bộ đề của cuộc thi đó. Chưa quyết; giữ Hiệu lực.

### QĐ-016 · QUIZ-02 công khai vẫn trả `ans` và `exp`, kể cả khi dùng cho cuộc thi

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: QUIZ-02 (API câu hỏi theo chuyên đề, không token), FE-28 (`contest-store.js` tự tính `correct` tạm từ `ans`), API-03 (BE-23)
- Vấn đề: sheet "API" r12 ghi QUIZ-02 "Có sẵn đáp án và giải thích vì đề thi dùng chung ngân hàng luyện tập (đã chốt)", nhưng nhật ký chưa có QĐ xác nhận (QĐ-001: "đã chốt" trong tài liệu chỉ là ý định thiết kế). Vì QUIZ-02 công khai, thí sinh xem được đáp án qua mạng của trình duyệt trước khi trả lời. `docs/ban-giao/CUOC-THI/3-review.md` › Review B2 › "Sai khác tài liệu ↔ code" › "Cần người dùng lưu ý".
- Quyết định: giữ như tài liệu. QUIZ-02 tiếp tục trả `ans` và `exp`; không làm API hay biến thể QUIZ-02 ẩn đáp án cho cuộc thi. Điểm vẫn chấm trên máy chủ: API-03 tự tính `is_correct` từ ngân hàng câu hỏi, không nhận `correct` từ client; `correct` FE tự tính chỉ để hiển thị tạm và bị ghi đè bằng giá trị máy chủ trả về.
- Rủi ro đã chấp nhận: **tính công bằng** của cuộc thi. Người rành kỹ thuật (mở công cụ nhà phát triển, gọi thẳng QUIZ-02) biết đáp án đúng trước khi trả lời và có thể đạt điểm tối đa. Dữ liệu điểm không bị giả mạo, nhưng điểm cao không chứng minh người dự thi tự trả lời. Người dùng chấp nhận rủi ro này.
- Lý do: đề thi dùng chung ngân hàng luyện tập, đáp án vốn đã công khai ở trang luyện tập; giữ contract hiện có, không thêm API.
- Ảnh hưởng: không đổi code hay contract. FE-28 giữ cách tính `correct` tạm từ `ans`. Nếu sau này cần bảo đảm công bằng (ví dụ giải thưởng giá trị lớn), phải có QĐ mới thay QĐ này, kèm thay đổi contract QUIZ-02/API-03. Nên báo chủ quản rủi ro này cùng câu hỏi OTP (QĐ-012).

### QĐ-017 · Nhánh `dev` gom công việc gói CUOC-THI; chưa đưa vào `main`

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: quản lý nhánh git của gói CUOC-THI (`dev`, `feature/cuoc-thi`, `lane/CUOC-THI-fe`, `main`, `origin/main`)
- Vấn đề: cả nhóm vẫn làm trên `main`; `origin/main` hiện đi trước 33 commit. Công việc gói CUOC-THI nằm ở `feature/cuoc-thi` và các nhánh `lane/*`.
- Quyết định: tạo nhánh `dev` (đã tạo cục bộ từ `feature/cuoc-thi`, đã merge luồng FE `lane/CUOC-THI-fe`) để gom toàn bộ công việc gói CUOC-THI. **Chưa đưa vào `main`.** Đẩy `dev` lên máy chủ khi có kết nối mạng. Cách hợp nhất `dev` với `origin/main` làm sau, **chưa quyết**.
- Lý do: tránh chen vào `main` khi nhóm đang làm trên đó.
- Ảnh hưởng: nhánh mã công việc của gói CUOC-THI nay là `dev`. Việc push do người dùng thực hiện (agent không push, theo QĐ-011). Chưa có quyết định về merge hay rebase với `origin/main`.

### QĐ-018 · Cuộc thi theo thời gian, mỗi cuộc có khoảng thời gian riêng, không ràng "mỗi tháng một kỳ"

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: mô hình cuộc thi (CUOC-THI), thanh thông báo FE-32, thẻ cuộc thi, trang FE-33, BE-22 đến BE-24
- Vấn đề: bản dựng và kế hoạch cũ có xu hướng coi cuộc thi là kỳ theo tháng (xem `docs/ban-giao/CUOC-THI/4a-phan-tich-ke-hoach-moi.md`, `4b-phan-tich-ban-dung-v2-va-code.md`); code trên `dev` chỉ có một cuộc thi cấu hình ở `thiPage` (QĐ-003).
- Quyết định: cuộc thi gắn với thời gian nhưng không ràng cứng "mỗi tháng một kỳ". Có thể mỗi tháng một cuộc, hoặc 2 đến 3 cuộc trong một tháng, hoặc 2 đến 3 tháng mới có một cuộc. Mỗi cuộc thi có khoảng thời gian (bắt đầu, kết thúc) riêng.
- Lý do: lịch cuộc thi do ban tổ chức quyết định theo từng đợt.
- Ảnh hưởng: không viết cứng chu kỳ tháng ở dữ liệu hay giao diện. Chi tiết mô hình dữ liệu để bước thiết kế sau làm. QĐ-003, QĐ-006, QĐ-008, QĐ-014 cần xem lại (xem ghi chú ở từng mục).

### QĐ-019 · Đề thi được chọn khi tạo cuộc thi (nguyên tắc)

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: tạo/sửa cuộc thi trong backoffice, API đọc câu hỏi cuộc thi (QUIZ-02, API-03…), `IQuestionBank`
- Vấn đề: anhnn nhớ là backoffice đã có code chọn đề khi tạo cuộc thi trên `origin/main` nhưng chưa chắc. Kiểm chứng bằng git, không cần mạng (`git show origin/main:<đường dẫn>`, `git diff --name-only main..origin/main`):
  - **Xác minh được** trên `origin/main` (các file này chưa có ở `dev`): bảng `contest` (`name`, `description`, `start_at`, `end_at`, `max_attempts`, `is_active`), `contest_topic` (khóa `contest_id` + `topic_id`), `contest_question` (khóa `contest_id` + `question_code`) trong migration `Umbraco.Plugin.Custom.Core/Data/Migrations/20261016044750_AddContestCampaigns.cs`; `Contest/ContestAdminService.cs` và `ContestAdminModels.cs` (`SaveContestCampaignRequest` có `Topics`, mỗi phần tử gồm `TopicId` và `QuestionCodes`); `Contest/CurrentContestService.cs`; `Umbraco.Plugin.Custom.Api/Controllers/ContestAdminController.cs`; giao diện backoffice `Umbraco.Web.UI/App_Plugins/ContestManagement/contest-management.js`.
  - Cách chọn đề theo code đó: **chọn chuyên đề, rồi chọn từng câu trong chuyên đề**. Kiểm tra khi lưu: phải chọn ít nhất một chuyên đề, mỗi chuyên đề ít nhất một câu, không trùng chuyên đề hay câu, câu phải thuộc đúng chuyên đề đã chọn (`ContestAdminService.cs:226-247`); `MaxAttempts` từ 1 đến 1.000 (`:224`); kết thúc phải sau bắt đầu (`:222`).
  - `CurrentContestService` chọn cuộc đang diễn ra: `IsActive` và `StartAt <= now <= EndAt`; nếu các cuộc chồng thời gian thì lấy cuộc bắt đầu muộn nhất (`CurrentContestService.cs:19-24`). Đây là hành vi của code, **chưa phải quyết định**.
  - **Chưa xác minh**: code backoffice có build và chạy đúng không (Orchestrator không build/chạy); `ContestEntryService` và API thí sinh trên `origin/main` đã lấy đề theo `contest_question` hay chưa (chưa đọc kỹ); các thay đổi khác trên `origin/main` (ví dụ `docs/noi-dung/bo-cuc-cuoc-thi.md`, `thiPage`/uSync) xung đột thế nào với `dev`.
- Quyết định: **về nguyên tắc**, đề thi được chọn khi tạo cuộc thi (mỗi cuộc có bộ đề riêng). Chi tiết cách chọn (theo chuyên đề hay theo câu) lấy theo code backoffice trên `origin/main`, vì code đúng như anhnn nhớ. Chưa quyết cách đưa code đó vào `dev` (xem QĐ-017).
- Lý do: mỗi cuộc thi có thời gian và lượt riêng (QĐ-018, QĐ-021) nên cần bộ đề riêng.
- Ảnh hưởng: "ngân hàng đang dùng" ở QĐ-015 cần xem lại theo bộ đề của từng cuộc; tổng số câu lấy từ cuộc thi, không còn từ toàn ngân hàng.

### QĐ-020 · Cần thêm việc Backend cho lịch cuộc thi (nguyên tắc)

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: kế hoạch công việc (`docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › "Công việc"), FE-32 (thanh thông báo), thẻ cuộc thi, FE-33
- Vấn đề: lịch tháng/lịch cuộc thi chưa có việc nào trong kế hoạch, trong khi FE-32, thẻ cuộc thi và FE-33 cần dữ liệu.
- Quyết định: tạo thêm việc cho Backend làm nguồn dữ liệu lịch cuộc thi cho thanh thông báo FE-32, thẻ cuộc thi và trang FE-33. Chi tiết (mã việc, API, schema, task) do bước thiết kế sau (`/feature-design`) làm; ở đây chỉ ghi nguyên tắc.
- Lý do: các màn FE trên không có dữ liệu thật nếu thiếu BE.
- Ảnh hưởng: bước thiết kế sau thêm mã việc BE và chốt contract trước khi mở luồng FE.

### QĐ-021 · Số lượt tối đa cấu hình khi thêm cuộc thi, tính riêng từng cuộc

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `maxAttempts`, API-01 và API-02 (đếm lượt), FE-25, FE-26, bảng `entry`
- Vấn đề: hiện `maxAttempts` là cài đặt `thiPage` (QĐ-003), đếm lượt theo số điện thoại; tài liệu cũ chưa rõ lượt tính trọn đời hay theo tháng. Backoffice trên `origin/main` đã có `contest.max_attempts` (QĐ-019).
- Quyết định: số lượt tối đa được cấu hình khi thêm cuộc thi. Mỗi cuộc thi có lượt thi riêng; **không còn tính trọn đời hay theo tháng**.
- Lý do: mỗi cuộc có thời gian và bộ đề riêng.
- Ảnh hưởng: lượt (`entry`) phải gắn với cuộc thi và việc đếm lượt theo cuộc thi; chi tiết schema do bước thiết kế sau làm. QĐ-003 cần xem lại (nguồn `maxAttempts`).

### QĐ-022 · Hợp nhất `origin/main` vào `dev` theo phương án A

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: nhánh `dev`, `origin/main`, gói CUOC-THI (task M1a), `CLAUDE.md`
- Vấn đề: `origin/main` đi trước `dev` 33 commit, `dev` đi trước 22+ commit; hai bên cùng viết phần cuộc thi theo hai cách (`dev`: cài đặt ở `thiPage`; `origin/main`: bảng `contest` + backoffice). Thử merge cho 6 file xung đột nội dung (xem `1-thiet-ke.md`, mục "Cập nhật 2026-10-18").
- Quyết định: merge `origin/main` vào `dev` (phương án A của CXN-A), do Worker làm ở luồng `CUOC-THI-hopnhat` theo task M1a. Phần liên quan Claude (`CLAUDE.md`, quy trình điều phối) lấy từ `dev` vì mới hơn. Việc đưa `dev` vào `main` vẫn theo QĐ-017 (chưa).
- Lý do: giữ API-01 và luồng thi của `dev`, nhận backoffice cuộc thi và project test của nhóm.
- Ảnh hưởng: `ContestEntryService`/`ContestController` lấy bản `dev`; cuộc thi chuyển sang đọc từ bảng `contest` ở các task sau (B-xx). Chưa merge vào `main`, chưa báo nhóm (chưa được yêu cầu).

### QĐ-023 · Sau merge `origin/main`: nguồn kế hoạch chuẩn, thi ẩn danh, test đỏ

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `CLAUDE.md`, API-01 (thi ẩn danh), `AntcPublicPathsTests`, review M1a (`3-review-CUOC-THI-hopnhat.md`)
- Vấn đề: `CLAUDE.md` của `origin/main` nói Google Sheet là kế hoạch chuẩn, của `dev` coi xlsx là tài liệu thiết kế; API-01 `dev` bỏ qua trường cá nhân khi thi ẩn danh, `origin/main` trả 400; test `Manual_faq_documents_do_not_have_a_public_route` đỏ sẵn trên `origin/main`.
- Quyết định: (1) kế hoạch chuẩn là **file xlsx** trong `docs/ke-hoach/`, không phải Google Sheet; (2) thi ẩn danh gửi kèm thông tin cá nhân: **giữ như `dev`** (bỏ qua, không lưu, không trả lỗi); (3) test đỏ: **sửa test**, không sửa code `AntcPublicPaths`; (4) cho phép merge `lane/CUOC-THI-hopnhat` vào `dev` sau khi Worker sửa xong các mục của review.
- Lý do: thống nhất nguồn tài liệu của dự án; giữ contract API-01 đang có.
- Ảnh hưởng: bỏ gạch "Google Sheet là bản chuẩn" khỏi `CLAUDE.md` đã chèn; ca test ẩn danh giữ theo hành vi bỏ qua; test sửa theo hành vi code hiện tại (`/hoi-dap/cau-hoi/`).

### QĐ-024 · Chốt CXN-B đến CXN-G của gói CUOC-THI theo khuyến nghị thiết kế

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `docs/ban-giao/CUOC-THI/1-thiet-ke.md` mục R4, R5 và "Cần xác nhận"; bảng `entry`, `contest`; API-01, QUIZ-01/02, API-07; trang làm bài; `AppDbInitializer`
- Quyết định: (B) `entry.contest_id` cho phép rỗng; thêm `submit_grace_hours`, `read_timer_factor`, `focus_area` vào `contest`; chặn xóa/đổi bộ đề khi cuộc đã có lượt (`409 CONTEST_HAS_ENTRIES`). (C) API-01 bắt buộc `contestId`, `404 CONTEST_NOT_FOUND`; thi ẩn danh gửi kèm trường cá nhân thì bỏ qua. (D) đề thi qua QUIZ-01/02 `?contest=` (công khai, có đáp án theo QĐ-016, chặn cuộc `upcoming`). (E) API-07 `GET /api/v1/contests` như R5; nhãn lĩnh vực từ cột `focus_area`; thanh thông báo hiện cuộc `ongoing` bắt đầu muộn nhất. (F) luồng thi ở document type mới (`cuocThiLamBaiPage`), `/cuoc-thi/lam-bai/?c=<id>`. (G) cuộc thi mẫu thay QĐ-008: chỉ `Development`, khi bảng `contest` trống.
- Lý do: khuyến nghị của bước thiết kế lại; hỗ trợ nhiều cuộc cùng lúc (QĐ-018, QĐ-021).
- Ảnh hưởng: mở các task B5, M1b, F6 (làm được ngay); B6–B13 mở dần theo phụ thuộc. QĐ-008 được thay bằng (G) khi B13 xong; QĐ-003 lấy `maxAttempts` từ `contest`.

### QĐ-025 · Thứ tự chuyên đề trong cuộc thi và quay số theo từng cuộc

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: FE-26/FE-27 (F8), danh sách chuyên đề của API-02, quay số/xếp giải (BE-27, BE-28), `1-thiet-ke.md` Q2 và Q7
- Vấn đề: bản dựng ghi "làm Chuyên đề 1 trước, sau đó chuyên đề nào cũng được"; đề của mỗi cuộc có thể không có CĐ1 (QĐ-019). Q7: quay số theo cuộc làm trong gói này hay để sau.
- Quyết định: (Q2) thí sinh **làm lần lượt các chuyên đề theo thứ tự của đề cuộc thi**, không bỏ qua chuyên đề đứng trước (thay quy tắc "CĐ1 trước, sau đó tự do"). (Q7) quay số/xếp giải làm **riêng theo từng cuộc thi**.
- Lý do: anhnn trả lời trực tiếp ("làm lần lượt các chuyên đề", "quay số riêng theo cuộc").
- Ảnh hưởng: F8 khóa chuyên đề thứ n tới khi xong chuyên đề n-1; thứ tự lấy từ `topics` của API-02 (cần xác nhận cột thứ tự, mặc định theo thứ tự lưu trong `contest_topic`/mã chuyên đề); nếu máy chủ cũng phải ép thứ tự ở API-03 thì cần task BE. BE-27/BE-28 thêm tham số cuộc thi, vào hạng mục mới (file 5), không chặn các task hiện tại. Giả định của Claude: "lần lượt" hiểu là bắt buộc theo thứ tự, không chỉ gợi ý.

### QĐ-026 · Giữ nhánh F4b (`wip/CUOC-THI-F4b`) để làm tiếp trong F8

- Ngày: 2026-10-18 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: F8 (đồng hồ đọc, màn "Xong chuyên đề"), nhánh `wip/CUOC-THI-F4b` (`8dce11fa`)
- Quyết định: giữ F4b và làm tiếp trong F8; chỉ đổi nguồn `readTimerFactor` sang `contest.readTimerFactor`. Nhánh dở dang chưa kiểm chứng và chưa review, nên F8 phải kiểm chứng và review như code mới.
- Lý do: đồng hồ đọc và màn Xong chuyên đề không phụ thuộc mô hình cuộc thi.
- Ảnh hưởng: F8 chuyển "Làm được"; thứ tự chuyên đề theo QĐ-025.

### QĐ-027 · Máy chủ cũng ép thứ tự chuyên đề; gói CUOC-THI đẩy lên `dev` để kiểm

- Ngày: 2026-10-18 · Người xác nhận: anhnn ("làm nốt đi", "tất cả đẩy dev thôi, khi ok mới đẩy vào main") · Trạng thái: Hiệu lực
- Phạm vi: API-03 (lưu đáp án chuyên đề), QĐ-025, nhánh `dev`
- Quyết định: (1) máy chủ ép thứ tự chuyên đề của QĐ-025 ở API-03, theo khuyến nghị ép cả hai phía; mã lỗi và chi tiết do task B14 đề xuất trong `1-thiet-ke.md`, theo dạng lỗi QĐ-004. (2) Toàn bộ gói CUOC-THI đẩy lên `origin/dev` để anhnn kiểm; **chỉ đưa vào `main` khi anhnn xác nhận đạt** (làm rõ QĐ-017).
- Giả định của Claude: "làm nốt" gồm B14 và việc kiểm các mục còn chưa kiểm (K1).
- Ảnh hưởng: thêm task B14 (BE) và K1 (kiểm chứng).


### QĐ-028 · Làm mới backoffice: được sửa core, tông xanh lục bảo, font Roboto, khu Cuộc thi dùng UUI

- Ngày: 2026-10-28 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: BACKOFFICE-UI (BO-01 → BO-26), `src/ANTC.Portal.Core`, `App_Plugins/ContestManagement`, FE-30
- Vấn đề: FE-30 trong `Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` ghi trang quản trị dựng bằng Razor Pages, "không viết phần mở rộng cho giao diện backoffice"; từ 20/10 đã chuyển sang Lit trong backoffice. Bố cục mockup ở các màn gốc của Umbraco cần sửa core.
- Quyết định: (1) được sửa mã nguồn core Umbraco cho các màn cần đổi bố cục, chỉ khi tiện ích mở rộng hoặc view không làm được; mỗi chỗ sửa gắn chú thích `ANTC:`, ghi vào `docs/ban-giao/BACKOFFICE-UI/core-patches.md`, đóng gói bằng `core_build.ps1 -BuildSpa`. (2) Tông màu xanh lục bảo: thanh trên `#0B3B3A`, nút chính `#0E7C72`, nền chọn `#E3F4F1`, chữ trên nền chọn `#0A5E57`, viền chọn `#B9E2DB`; màu đỏ đô chỉ giữ ở logo khiên. (3) Font Roboto, tự host như website. (4) Khu Quản lý cuộc thi làm lại bằng thành phần UUI và biến ANTC, thay CSS tự viết.
- Lý do: thiết kế phải triển khai được; màu đỏ nhìn nặng nề và dễ nhầm với thao tác nguy hiểm; Roboto đã có sẵn; UUI đồng bộ với phần còn lại của backoffice.
- Ảnh hưởng: các task BO-02, BO-04, BO-08 trong `docs/ban-giao/BACKOFFICE-UI/Ke-hoach-lam-moi-backoffice.docx`; mockup dùng Be Vietnam Pro nhưng khi làm dùng Roboto.

### QĐ-029 · Số điện thoại trong backoffice: đầy đủ trong bảng, che ở khung trình chiếu quay số

- Ngày: 2026-10-28 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: BO-13 (Quay số), `App_Plugins/ContestManagement/contest-draws.js`
- Vấn đề: `docs/ban-giao/Trang-quan-tri-cuoc-thi.md` ghi số điện thoại hiện đầy đủ ở mọi màn backoffice có phân quyền, kể cả màn trình chiếu; mockup Quay số che chữ số giữa.
- Quyết định: giữ đầy đủ trong các bảng backoffice; riêng khung trình chiếu kết quả quay số che chữ số giữa (ví dụ `0009 ••• 045`).
- Lý do: màn trình chiếu hay được chiếu hoặc chia sẻ công khai.
- Ảnh hưởng: sửa phần trình chiếu ở BO-13; cập nhật `Trang-quan-tri-cuoc-thi.md` khi làm xong.

### QĐ-030 · Menu khu Cuộc thi theo ba nhóm, Quay số thành mục riêng; ô tìm nhanh luôn hiện

- Ngày: 2026-10-28 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: BO-08, BO-09, BO-11 → BO-16; `App_Plugins/ContestManagement/umbraco-package.json`, `contest-management.js`
- Vấn đề: `Trang-quan-tri-cuoc-thi.md` ghi "Lượt dự thi" và "Lần quay số" là tab trong trang Cuộc thi, bộ lọc nằm trong "Tìm kiếm nâng cao" thu gọn mặc định; code ngày 27/10 vẫn còn mục menu "Lượt thi" trùng với tab.
- Quyết định: (1) menu ba nhóm Vận hành (Tổng quan, Cuộc thi, Lượt thi, Quay số, Công bố kết quả) / Ngân hàng đề (Câu hỏi, Chuyên đề, Giải thưởng) / Dữ liệu (Thống kê câu hỏi, Dữ liệu cá nhân); Quay số là mục riêng; Lượt thi chỉ ở một chỗ; URL cũ vẫn hoạt động. (2) Ô tìm kiếm và tab trạng thái luôn hiện; các điều kiện lọc khác vẫn thu gọn sau nút "Bộ lọc".
- Lý do: quay số làm thường xuyên; bỏ trùng lặp; tìm nhanh không phải mở khối thu gọn.
- Ảnh hưởng: thay một phần mô tả trong `Trang-quan-tri-cuoc-thi.md` khi làm xong.

### QĐ-031 · Phạm vi đợt làm mới backoffice: API mới chốt contract trước, quyền chi tiết để sau, ô kiểm chặn xuất bản

- Ngày: 2026-10-28 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: BO-10b, BO-19, BO-22, BO-25
- Quyết định: (1) làm các tính năng cần API mới ("Cần xử lý", "Hoạt động gần đây", "Chưa dùng ở đâu") trong đợt này, nhưng phải chốt contract (đường dẫn, JSON mẫu, mã lỗi theo QĐ-004) trước khi code. (2) Quyền chi tiết theo chức năng trong khu Cuộc thi (BO-25) để giai đoạn sau, có review bảo mật riêng; đợt này giữ kiểm quyền theo nhóm `quanTriCuocThi`. (3) Ô "Kiểm tra trước khi xuất bản" chặn xuất bản khi còn mục bắt buộc chưa đạt; vẫn cho lưu nháp.
- Lý do: tránh làm API khi contract chưa rõ; đổi quyền có rủi ro bảo mật; bài thiếu thông tin không được đăng.
- Ảnh hưởng: BO-25 ra khỏi đợt này; BO-19 phải chặn nút Xuất bản và giải thích mục còn thiếu.

### QĐ-032 · Portal v2: chuyển sang cấu trúc 3 mục, bỏ Block Grid ở các trang chính

- Ngày: 2026-11-02 · Người xác nhận: anhnn · Trạng thái: Hiệu lực (cây nội dung thay một phần bởi QĐ-053)
- Phạm vi: toàn bộ document type, view Razor, nội dung mẫu trong `uSync/v18`; `docs/ban-giao/PORTAL-V2/1-phan-tich-cau-hinh-umbraco.md` mục 4–7, 10
- Vấn đề: đặc tả của khách (`docs/ban-dung-v2/Cấu trúc website theo hướng sau.docx` › 3. Sitemap) và bản dựng v2 dùng menu đúng 3 mục Khẩn cấp · Công cụ & checklist · Các rủi ro; Umbraco hiện có 22 loại trang theo cấu trúc cũ (Ứng phó, Thủ đoạn, Tham gia…), các trang chính chỉ có một trường `layout` kiểu Block Grid (`ContentTypes/home.config`, `thuDoanPage.config`…).
- Quyết định: dựng lại cây nội dung và document type theo cấu trúc 3 mục và đường dẫn của đặc tả 3.3. Các trang chính dùng trường riêng theo từng khối của đặc tả, không dùng Block Grid. Trang Cuộc thi và Hỏi – Đáp giữ như hiện có.
- Lý do: bố cục của đặc tả cố định; khách phàn nàn quản lý nội dung quá nhiều thao tác, nguyên nhân chính là Block Grid lồng khối (`docs/ban-giao/BACKOFFICE-UI/3-don-gian-hoa-quan-ly-noi-dung.md` mục 1).
- Ảnh hưởng: bỏ `ungPhoPage`, `thuDoanPage`, `thamGiaPage`, `fraudContent` và phần lớn 72 loại khối (giữ file `<Empty … Change="Delete">` của uSync); chuyển 40 bài đang có sang loại mới; viết lại view; mockup backoffice phải vẽ lại cây nội dung.

### QĐ-033 · Portal v2: logic và nhãn theo đúng đặc tả của khách, không theo 7 điều chỉnh của bản dựng

- Ngày: 2026-11-02 · Người xác nhận: anhnn · Trạng thái: Thay một phần bởi QĐ-050, QĐ-051 (phần Hãy tự kiểm tra, nhãn mức độ)
- Phạm vi: trình hỏi Khẩn cấp, 3 công cụ, trang cảnh báo; `1-phan-tich-cau-hinh-umbraco.md` mục 3.2, 6.4, 6.7, 6.10
- Vấn đề: README bản dựng (`docs/ban-dung-v2/antoantaichinh-nguon/README.md` › "Điều chỉnh để giữ đúng đề cương 1.3") làm khác đặc tả ở 7 chỗ: nhãn mức độ, nhãn "An toàn tương đối", cách tính theo số dấu hiệu, "Có thể là", "Mức độ phổ biến", bước "gỡ ứng dụng lạ, quét thiết bị", bước "bật xác thực hai lớp".
- Quyết định: làm theo đặc tả. Mức độ: Thường / Cao / Rất cao. Công cụ 1: An toàn tương đối (0 dấu hiệu) / Cần kiểm tra thêm (1) / Cần dừng lại (từ 2). Công cụ 2: Cần thẩm định kỹ / Rủi ro cao / Không nên tham gia. Kết quả trình hỏi ghi "Có thể là". Trang cảnh báo có "Mức độ phổ biến". Công cụ 3 dùng bảng hành động của đặc tả 6.3. Câu hỏi, lựa chọn của trình hỏi và công cụ dùng nguyên văn đặc tả 5.2–5.4, 6.1–6.3.
- Lý do: đặc tả của khách là gốc cho bố cục và chức năng.
- Ảnh hưởng: form công cụ có trường "Trả lời nào là dấu hiệu" thay cho "Loại câu Dừng/Hoãn"; form cảnh báo thêm trường Mức độ phổ biến. Câu chữ hành động ở công cụ 3 ("gỡ ứng dụng lạ, quét thiết bị", "bật xác thực hai lớp") README ghi là chưa qua thẩm định hoặc ngược quy trình đã thẩm định; đây là nội dung nhập trong CMS, cần Ban biên tập xác nhận trước khi xuất bản.

### QĐ-034 · Quy tắc trình hỏi sửa bằng màn ma trận

- Ngày: 2026-11-02 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `wizardPage`, property editor mới trong `App_Plugins`; đặc tả 5.7, 11.2
- Vấn đề: đặc tả yêu cầu bảng ánh xạ [kênh] + [yêu cầu] + [lời hứa/đe dọa] → mức độ, tình huống, dấu hiệu, hành động, bài viết, cập nhật được từ CMS; Umbraco không có sẵn trình chọn phù hợp.
- Quyết định: viết property editor "Ma trận tình huống": hàng là tình huống, cột là các lựa chọn của 3 bước, ô đánh dấu; mỗi hàng có mức độ, dấu hiệu, việc cần làm, bài viết liên quan; có khung thử kết quả. Dữ liệu lưu là giá trị JSON của trang `wizardPage`, đi theo lưu nháp, xuất bản và lịch sử phiên bản của Umbraco.
- Lý do: biên tập viên sửa quy tắc không cần nhớ mã.
- Ảnh hưởng: thêm task riêng (khoảng 3–4 ngày), cần review riêng; phía máy chủ kiểm JSON hợp lệ khi xuất bản.

### QĐ-035 · Phân quyền nội dung portal: hai nhóm Quản trị viên và Biên tập viên

- Ngày: 2026-11-02 · Người xác nhận: anhnn (giao chọn phương án dễ dùng nhất) · Trạng thái: Hiệu lực
- Phạm vi: nhóm người dùng Umbraco, quyền theo trang và theo trường; đặc tả 11.1
- Vấn đề: đặc tả yêu cầu ít nhất 2 vai trò Admin và Content Editor; bản đề xuất có thêm nhóm Người duyệt.
- Quyết định: hai nhóm. Biên tập viên tự xuất bản được nội dung hay đổi (cảnh báo, bài viết, checklist, hỏi đáp nhanh, thủ đoạn, câu chữ trên các trang), chỉ thấy các tab "hay sửa", không tạo hoặc xóa trang cố định, không sửa cài đặt website và ma trận trình hỏi. Quản trị viên toàn quyền. Ô "Kiểm tra trước khi xuất bản" (QĐ-031 khoản 3) thay cho bước duyệt. Nhóm `quanTriCuocThi` giữ nguyên, gán thêm cho người phụ trách cuộc thi.
- Lý do: ít nhóm, ít bước, đúng mức tối thiểu của đặc tả.
- Ảnh hưởng: cấu hình 2 user group, quyền theo trường cho `siteSettings`; không làm luồng gửi duyệt.

### QĐ-036 · PDF checklist: LibreOffice sinh tự động, lùi về tệp tải lên khi hosting không cho cài

- Ngày: 2026-11-02 · Người xác nhận: anhnn · Trạng thái: Thay một phần bởi QĐ-049 (đợt này dùng tệp tải lên)
- Phạm vi: `checklistPage`, V2-08b, V2-08c; đặc tả 5.5, 11.1, 11.3
- Vấn đề: đặc tả cần nút "Tải checklist PDF" và "tải PDF hoặc in"; hạ tầng production chưa rõ, có thể chỉ là gói hosting không cho cài phần mềm.
- Quyết định: (1) làm trước cách sinh PDF tự động: điền nội dung checklist vào mẫu `.docx` bằng OpenXML, chuyển sang PDF bằng LibreOffice chạy headless, sinh lúc xuất bản qua hàng đợi chạy nền (mỗi lần một tiến trình, có giới hạn thời gian), lưu theo phiên bản. (2) Nếu máy chủ không có LibreOffice thì dùng tệp PDF do biên tập viên tải lên. Chọn chế độ bằng cấu hình; không tìm thấy `soffice` thì tự chuyển sang chế độ tải lên và báo trong backoffice. (3) Bản in A4 luôn có, làm đường lùi cuối cùng và cho nút In.
- Lý do: tệp luôn khớp nội dung, biên tập viên không phải làm PDF bằng tay; vẫn chạy được khi hạ tầng không cho cài.
- Ảnh hưởng: thêm trường "Tệp PDF" ở `checklistPage`; thêm dịch vụ sinh PDF, mẫu `.docx`, font Be Vietnam Pro trên máy chủ; cần xác minh hạ tầng production trước khi triển khai.

### QĐ-037 · Portal v2: mã danh mục viết đầy đủ

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: trường `code` của mọi mục danh mục (`PORTAL-V2/2-danh-muc-va-document-type.md` mục 4.3, 4.4), tham số lọc trên địa chỉ trang
- Vấn đề: bản dựng dùng mã ngắn (`dt`, `mxh`, `tt`); mã này hiện trên địa chỉ khi lọc.
- Quyết định: mã viết đầy đủ, chữ thường không dấu, nối bằng gạch ngang (`dien-thoai`, `mang-xa-hoi`, `truc-tiep`); duy nhất trong danh mục, khóa sau lần xuất bản đầu.
- Lý do: đọc được trên địa chỉ trang, không cần tra bảng mã.
- Ảnh hưởng: khi nhập dữ liệu bản dựng phải ánh xạ mã ngắn sang mã đầy đủ (bảng ở mục 4.4).

### QĐ-038 · Portal v2: "Mức độ phổ biến" là danh mục node, sửa được

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: trường Mức độ phổ biến của `alertPage`; đặc tả 7.4
- Vấn đề: đặc tả 7.4 có "Mức độ phổ biến" nhưng không nêu giá trị; trước đây đề xuất Dropdown cố định.
- Quyết định: làm thành danh mục node trong Thư viện (thư mục riêng, loại mục riêng) để Ban biên tập tự thêm, sửa, sắp xếp giá trị. Giá trị mẫu ban đầu: Ít gặp, Thường gặp, Rất phổ biến. "Mức độ cần thận trọng" vẫn cố định theo QĐ-033.
- Lý do: giá trị chưa có trong đặc tả và có thể đổi theo số liệu của cơ quan chức năng; không gắn với logic code.
- Ảnh hưởng: thêm `popularityFolder`, `popularityItem`, data type chọn tương ứng; bỏ data type `Danh mục · Mức độ phổ biến`.

### QĐ-039 · Backoffice: mọi ô chọn dùng combobox ngay trên form

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: mọi trường chọn ở mọi loại trang và mục (chọn danh mục, chọn trang, chọn giá trị cố định)
- Vấn đề: trình chọn nội dung mặc định của Umbraco mở hộp thoại có cây, khó dùng với danh sách ngắn.
- Quyết định: dùng ô chọn dạng combobox tự viết (`Antc.NodeCombobox`) gắn vào kiểu dữ liệu có sẵn của Umbraco, không mở hộp thoại; áp dụng cho mọi trường chọn. Dữ liệu danh mục vẫn là node; phần lưu giá trị, ghi tham chiếu, chặn xóa dùng của Umbraco.
- Lý do: chọn nhanh, gõ tìm được, thân thiện với biên tập viên; bỏ được ô chọn tự viết thì dữ liệu không phải chuyển.
- Ảnh hưởng: thêm việc V2-01e (ô chọn và API danh sách); cần kiểm trên Umbraco 18.2.1 và kiểm lại khi nâng cấp Umbraco.

### QĐ-040 · Portal v2: danh mục biên tập là node, chọn bằng ô thả xuống

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: Kênh tiếp cận, Đối tượng, Dấu hiệu phải dừng, Chuyên đề, Thủ đoạn, Mức độ phổ biến (`PORTAL-V2/2-danh-muc-va-document-type.md` mục 1, 4)
- Vấn đề: danh mục làm bằng data type Dropdown của Umbraco hay bằng node.
- Quyết định: mỗi mục là một node trong Thư viện (mỗi danh mục một thư mục), biên tập viên tự thêm, sửa, sắp xếp. Trên form, trường chọn hiện dạng thả xuống (combobox, QĐ-039), không mở hộp thoại. Danh sách gắn với logic code (Mức độ cần thận trọng, Loại bài, Kiểu công cụ, Màu kết quả…) vẫn là data type cố định.
- Lý do: gắn được biểu tượng, mô tả; sửa tên không mất giá trị ở bài đã gắn; Umbraco chặn được xóa mục đang dùng.
- Ảnh hưởng: thêm thư mục và loại mục trong Thư viện, dữ liệu mẫu qua uSync; việc V2-01b, V2-01c.

### QĐ-041 · Portal v2: không dùng Block List cho nội dung trang

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: các loại trang và mục của portal v2. Trang Cuộc thi, Hỏi – Đáp đã làm bằng Block Grid giữ nguyên
- Vấn đề: Block List phải mở hộp thoại cho từng khối, khó dùng với biên tập viên.
- Quyết định: không dùng Block List. Cách nhập thay thế chốt ở QĐ-042.
- Lý do: biên tập viên sửa cả trang trên một form, ít thao tác hơn.
- Ảnh hưởng: các element type `…Block` trong thiết kế không còn dùng; cần cách nhập danh sách thay thế.


### QĐ-042 · Portal v2: cách nhập thay Block List

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `docs/ban-giao/PORTAL-V2/3-thay-block-list.md` mục 7; `PORTAL-V2/1-thiet-ke.md` CXN-1; V2-01m → V2-01p
- Vấn đề: QĐ-041 bỏ Block List nhưng chưa chốt cách nhập thay thế.
- Quyết định:
  - (1) Dùng bốn cách nhập: ô chữ hoặc ô đoạn; danh sách dòng (Repeatable textstrings); ô danh sách tự viết `Antc.InlineList` có hai dạng Bảng và Thẻ; ô soạn thảo có menu "Kiểu".
  - (2) Gộp bốn loại khối của Việc cần làm thành một loại "Bước" có phần "Hỏi thêm" không bắt buộc.
  - (3) Bài đọc dài dùng ô soạn thảo có menu "Kiểu" (Hộp ghi nhớ, Trường hợp thật, Bỏ túi…), thay sáu loại khối.
  - (4) Danh sách cố định số mục (4 nguyên tắc, 4 liên kết, 3 cửa vào) dùng bảng hoặc thẻ cố định số dòng.
  - Hình dạng và thao tác theo `mockup-o-nhap-backoffice.html`.
- Lý do: sửa cả trang trên một form, không có hộp thoại; anhnn đã duyệt mockup.
- Ảnh hưởng: QĐ-041 hết phần "chờ xác nhận chi tiết"; luồng `V2-ui` làm `Antc.InlineList`.

### QĐ-043 · Portal v2: thay hẳn cấu trúc cũ trên nhánh `portal-v2`

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: toàn gói PORTAL-V2; `1-thiet-ke.md` CXN-4, CXN-6, mục P1
- Vấn đề: chuyển từ cấu trúc cũ sang mới theo cách nào.
- Quyết định:
  - (1) Làm trên nhánh `portal-v2` tách từ `dev`: thêm loại mới; công cụ `Tools/ImportPortalV2` dựng cây nội dung mới và chuyển 40 bài cũ; xóa cấu trúc cũ ở V2-14b (giữ file uSync `Empty … Change="Delete"`). Không chạy song song hai cây nội dung.
  - (2) Bảng ánh xạ 10 danh mục bài cũ sang 5 nhóm rủi ro do Claude lập nháp, Ban biên tập duyệt trước V2-12b.
- Lý do: ít việc nhất, không phải cấu hình định tuyến hai gốc.
- Ảnh hưởng: CSDL local dựng lại bằng `run-local -Reset`; website cũ chỉ còn ở `dev`, `main` cho tới khi gộp `portal-v2`.

### QĐ-044 · Portal v2: trường điều kiện luôn hiện, tách Công cụ thành hai loại

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `1-thiet-ke.md` CXN-3, mục P2; V2-08a, V2-10a
- Vấn đề: Umbraco không tự ẩn trường theo giá trị của trường khác; mockup có ẩn, hiện.
- Quyết định:
  - (1) Ở form tài liệu, trường có điều kiện luôn hiện, mô tả ghi "Chỉ cần khi…". Bắt buộc theo điều kiện thì kiểm phía máy chủ khi xuất bản. Trong `Antc.InlineList` vẫn ẩn, hiện theo điều kiện.
  - (2) Tách `toolPage` thành `toolCountPage` (đếm dấu hiệu) và `toolBranchPage` (theo nhánh), dùng chung composition `toolBase`. Không tạo data type `Danh mục · Kiểu công cụ`.
- Lý do: không phụ thuộc cấu trúc nội bộ form Umbraco, an toàn khi nâng cấp; mỗi loại công cụ chỉ có trường của nó.
- Ảnh hưởng: Phụ lục A mục `toolPage` chia làm hai loại; `Chọn · Công cụ` lọc cả hai loại.

### QĐ-045 · Portal v2: contract ba API backoffice C1, C3, C4

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `1-thiet-ke.md` mục Contract, CXN-8; V2-01i, V2-01q, V2-10b
- Vấn đề: QĐ-031 khoản 1 yêu cầu chốt contract trước khi code API mới.
- Quyết định: dùng đúng contract ở `1-thiet-ke.md` mục Contract. Lỗi theo QĐ-004.
  - C1: `GET /umbraco/management/api/v1/antc/picker-items`.
  - C3: `GET …/antc/content-info/{key}`, `POST …/antc/checklists/{key}/pdf/regenerate`; chỉ Quản trị viên được sinh lại.
  - C4: `GET …/antc/publish-check/{key}`; dùng chung bảng luật với kiểm khi xuất bản.
  - Cả ba cần đăng nhập backoffice.
- Lý do: luồng `V2-ui` và luồng `chính` chạy song song được.
- Ảnh hưởng: đổi contract thì thêm quyết định mới.

### QĐ-046 · Portal v2: bỏ API bài viết cũ sau khi có view mới

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `PublishedArticlesController` (`/api/v1/article-categories`, `/api/v1/articles`), `PublishedArticleContentController` (`/api/v1/article-content/*`), `wwwroot/assets/js/articles.js`; `1-thiet-ke.md` CXN-2, P3; V2-14a
- Vấn đề: các API này đọc loại `article`, `articleList` sẽ bị xóa; chỉ website đang dùng.
- Quyết định: website mới render bằng Razor. Xóa hai controller và `articles.js` ở V2-14a, sau khi V2-13i xong. Không giữ đường dẫn cũ cho ứng dụng ngoài.
- Lý do: không có ứng dụng ngoài nào dùng; bớt một lớp phải bảo trì.
- Ảnh hưởng: `PublishedArticleService` chỉ giữ phần view mới còn dùng; test liên quan sửa theo.

### QĐ-047 · Portal v2: góp ý lưu ở CSDL ứng dụng như câu hỏi Hỏi – Đáp, không đổi Hỏi – Đáp

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `gopYPage`, API C2 `POST /api/v1/feedback`; `1-thiet-ke.md` CXN-5; V2-09c, V2-13j
- Vấn đề: biểu mẫu Góp ý lưu ở đâu và quản lý thế nào.
- Quyết định:
  - (1) Lưu phía máy chủ trong CSDL ứng dụng, theo đúng cách đang lưu câu hỏi Hỏi – Đáp (`QuestionSubmission`, `QuestionSubmissionService`, `QuestionRetentionPolicy`, `QuestionModerationService`): bảng riêng cho góp ý, có chính sách lưu giữ, xem và xử lý trong khu Hỏi – Đáp của backoffice.
  - (2) Contract C2 theo `1-thiet-ke.md` mục Contract.
  - (3) Không đổi luồng, bảng và API của câu hỏi Hỏi – Đáp.
- Lý do: dùng lại mẫu đã chạy, không ảnh hưởng phần đã có.
- Ảnh hưởng: thêm entity và migration EF; màn xem góp ý trong khu Hỏi – Đáp.

### QĐ-048 · Portal v2: ngưỡng công cụ 2, liên kết nguồn, tự gỡ cảnh báo

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Khoản (1) thay bởi QĐ-051; khoản (2), (3) hiệu lực
- Phạm vi: `toolCountPage` công cụ 2, `alertPage`; `1-phan-tich…` mục 12; `1-thiet-ke.md` CXN-9
- Quyết định:
  - (1) Công cụ 2 dùng ngưỡng 0 / 1 / từ 2 dấu hiệu, như công cụ 1; Quản trị viên sửa được trong form.
  - (2) Liên kết văn bản gốc của cảnh báo chỉ bắt buộc bắt đầu bằng `https://`, không giới hạn `.gov.vn`.
  - (3) Cảnh báo tự gỡ sau 180 ngày kể từ ngày cập nhật, sửa được từng bài (trường `autoUnpublishDays`).
- Lý do: đặc tả 6.2 không nêu ngưỡng; nhóm Nguồn không bắt buộc (QĐ-033); README bản dựng mục 8.
- Ảnh hưởng: dữ liệu mẫu V2-12a theo các giá trị trên.

### QĐ-049 · PDF checklist: dùng tệp tải lên, tạm dừng dịch vụ LibreOffice

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: `checklistPage`, V2-00, V2-08b, V2-08c; thay phần (1) của QĐ-036
- Vấn đề: hosting production có thể không cho cài phần mềm (LibreOffice, font), chưa xác minh được.
- Quyết định: đợt này PDF checklist dùng tệp do biên tập viên tải lên (chế độ `Upload` mặc định), bản in A4 luôn có làm đường lùi. Không làm dịch vụ sinh PDF bằng LibreOffice (V2-08c tạm dừng). Trường tệp PDF ở `checklistPage` cho Biên tập viên thấy và tải lên. Giữ khóa cấu hình `Checklist:Pdf:Mode` để sau này bật LibreOffice nếu hạ tầng cho phép. V2-00 không còn chặn việc nào.
- Lý do: không phụ thuộc hạ tầng chưa rõ.
- Ảnh hưởng: bớt khoảng 2 ngày công; biên tập viên phải tự làm PDF khi sửa checklist; trạng thái "PDF tự sinh" và nút "Sinh lại" chưa làm.

### QĐ-050 · Portal v2: mục thứ hai gọi là "Hãy tự kiểm tra"

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: menu chính, trang chủ, trang `congCuPage` và các trang con, tên loại nội dung trong backoffice. Thay phần tên gọi trong QĐ-033
- Vấn đề: đặc tả của khách gọi mục thứ hai là "Công cụ & checklist"; bản dựng mới `antoantaichinh_co_anh_nen_sang.html` đổi thành "Hãy tự kiểm tra".
- Quyết định: dùng cách gọi của bản dựng mới.
  - Mục và trang tổng: "Hãy tự kiểm tra".
  - Công cụ: "Kiểm tra nhanh".
  - Checklist: "Danh sách kiểm tra"; nút "Tải danh sách kiểm tra (PDF)".
  - Đường dẫn giữ `/cong-cu-checklist/…`; alias loại nội dung giữ nguyên.
- Lý do: không dùng chữ tiếng Anh, dễ hiểu với người lớn tuổi.
- Ảnh hưởng: đổi chữ hiển thị, tên loại trong backoffice, dữ liệu mẫu.

### QĐ-051 · Portal v2: logic phần "Hãy tự kiểm tra" theo bản dựng

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: công cụ 1, 2, 3, danh sách kiểm tra, nhãn mức độ cần thận trọng. Thay các phần tương ứng của QĐ-033 (theo đặc tả 6.1–6.3, 11.3) và khoản (1) của QĐ-048 (ngưỡng công cụ 2)
- Vấn đề: QĐ-033 chọn đặc tả cho công cụ (Có / Không, đếm dấu hiệu); bản dựng có logic khác và đầy đủ hơn.
- Quyết định: làm theo bản dựng (`antoantaichinh_co_anh_nen_sang.html`, giống bản v2 ở phần logic).
  - (1) Công cụ 1, 2:
    - mỗi câu có loại "phải dừng", "tạm hoãn" hoặc "cần kiểm tra";
    - trả lời Có / Không / Tôi chưa biết, một số câu có lựa chọn riêng;
    - câu "phải dừng" trả lời Có thì kết luận ngay mức Dừng;
    - còn lại, có lý do thì mức Hoãn, không có thì mức "Chưa phát hiện điểm dừng";
    - kết quả kèm lý do theo từng câu, "Việc nên làm bây giờ" lấy nguyên văn các bước của trang Việc cần làm, và "Đọc thêm";
    - công cụ 2 có hộp "Website không tư vấn tài chính" và "Hai điều phải nhớ".
  - (2) Công cụ 3:
    - 4 câu theo bản dựng; mỗi câu trả lời Có mở một nhóm bước, lấy nguyên văn từ trang Việc cần làm tương ứng;
    - không có các bước "gỡ ứng dụng lạ, quét thiết bị, bật xác thực hai lớp" của đặc tả 6.3.
  - (3) Danh sách kiểm tra làm tương tác:
    - phần 1: các câu "Có việc nào dưới đây không?", trả lời Có / Không / Tôi chưa biết;
    - phần 2: bảng kiểm bỏ túi có ô tích;
    - nút "Xem kết quả": có câu Có thì mức Dừng; còn câu chưa biết hoặc ô chưa tích thì mức Hoãn; kèm "Làm ngay" lấy từ bài đọc chuyên đề.
  - (4) Nhãn mức độ:
    - "Rất cao", "Cao", "Cần thận trọng"; mức thấp nhất cũng là trạng thái khi trình hỏi không khớp;
    - mỗi mức có nhãn khuyến nghị: DỪNG, HOÃN VÀ KIỂM CHỨNG, CHƯA PHÁT HIỆN ĐIỂM DỪNG, cùng câu giải thích sửa được ở Cài đặt website.
- Lý do: xử lý được trường hợp người dân không chắc; danh sách kiểm tra cho ra kết quả thay vì chỉ để in; nội dung nguyên văn đã thẩm định.
- Ảnh hưởng:
  - làm lại form `toolCountPage`, `toolBranchPage`, `checklistPage`;
  - thêm danh sách cố định "Loại câu kiểm tra", "Nghĩa của câu trả lời";
  - đổi chữ mức thấp nhất từ "Thường" sang "Cần thận trọng" (mã `thuong` giữ nguyên);
  - QĐ-033 bỏ rủi ro câu chữ công cụ 3.

### QĐ-052 · Portal v2: ảnh minh họa cho các trang

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: các loại trang Portal v2, `riskCategoryPage`, dữ liệu mẫu
- Vấn đề: bản dựng mới có bộ ảnh minh họa (40 ảnh): mỗi trang một ảnh lớn, mỗi nhóm rủi ro một ảnh thu nhỏ; thiết kế chưa có chỗ nhập.
- Quyết định:
  - thêm composition `illustrationBase` (Ảnh minh họa, Văn bản thay thế) cho các loại trang có ảnh trong bản dựng, thay các trường ảnh riêng của Trang chủ, Bài viết, Cảnh báo;
  - thêm "Ảnh thu nhỏ" cho `riskCategoryPage`;
  - tách 40 ảnh từ bản dựng vào dữ liệu mẫu để nạp vào Phương tiện;
  - hiệu ứng (hiện dần khi cuộn, thẻ nghiêng khi rê chuột) làm ở website, tắt khi người xem bật giảm chuyển động.
- Lý do: giống bản dựng mới.
- Ảnh hưởng: thêm trường; Phương tiện có sẵn ảnh mẫu.

### QĐ-053 · Portal v2: cây nội dung chia Quản lý trang và Quản lý nội dung

- Ngày: 2026-11-03 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: cây nội dung backoffice, đường dẫn công khai, `riskArticlePage`, `alertPage`, `viecCanLamPage`, `checklistPage`, Thư viện
- Vấn đề: cây hiện tại trộn trang cố định với nội dung biên tập viên thêm hằng ngày (cảnh báo, bài viết nằm dưới trang cha), khó biết thêm ở đâu. Mockup backoffice cũ (`BACKOFFICE-UI/anh/07-noi-dung-soan-bai.png`) chia hai nhánh.
- Quyết định:
  - (1) Gốc cây có hai nhánh. "Quản lý trang": Cài đặt website và các trang cố định (Trang chủ, Khẩn cấp, Kiểm tra tình huống, Hãy tự kiểm tra và 3 kiểm tra nhanh, Các rủi ro, Cảnh báo mới, 5 nhóm rủi ro, Hỏi – Đáp, Liên hệ, Góp ý, trang thông tin, chính sách, Cuộc thi, Tìm kiếm, 404). "Quản lý nội dung": mọi thứ thêm được: Cảnh báo, Bài viết, Việc cần làm, Danh sách kiểm tra, Hỏi – đáp nhanh, Đoạn dùng chung, Danh mục (kênh, đối tượng, dấu hiệu phải dừng, mức độ phổ biến, chuyên đề, thủ đoạn).
  - (2) Nhánh Quản lý nội dung là menu cố định (không xóa, không di chuyển). Bấm một mục thì mở danh sách (Collection) để lọc, thêm, sửa; mục con không hiện trên cây.
  - (3) Đường dẫn công khai giữ theo đặc tả 3.3: cảnh báo `/cac-rui-ro/canh-bao-moi/<tên>`, bài viết `/cac-rui-ro/<nhóm>/<tên>`, việc cần làm `/khan-cap/<tên>`, danh sách kiểm tra `/hay-tu-kiem-tra/<tên>`; trang cố định tính từ Trang chủ, bỏ phần "Quản lý trang". Làm bằng UrlProvider và ContentFinder.
  - (4) Bài viết có trường bắt buộc "Nhóm chính" (một nhóm rủi ro) quyết định đường dẫn; giữ "Hiện thêm ở nhóm".
- Lý do: thêm mới thì vào Quản lý nội dung, sửa trang thì vào Quản lý trang; danh sách nhiều bài không làm dài cây.
- Ảnh hưởng: thêm các thư mục gốc và thư mục có Collection; bỏ tab Danh sách ở Khẩn cấp, Hãy tự kiểm tra, Cảnh báo mới, nhóm rủi ro; Thư viện của gói nền chuyển vào Quản lý nội dung › Danh mục; thêm task UrlProvider và ContentFinder; QĐ-032 (cây theo đường dẫn) thay một phần.
