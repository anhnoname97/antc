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
