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

### QĐ-003 · API cuộc thi đọc Cài đặt cuộc thi từ nội dung Umbraco

- Ngày: 2026-10-17 · Người xác nhận: anhnn · Trạng thái: Hiệu lực
- Phạm vi: API-01 và các API cuộc thi sau (BE-22, BE-23, BE-24)
- Vấn đề: sheet "Nội dung Umbraco" đặt Cài đặt cuộc thi (`contestStart`, `contestEnd`, `maxAttempts`…) trên document type `thiPage`; API cần đọc chúng. `1-thiet-ke.md` › CXN-2b.
- Quyết định: đọc từ nút nội dung loại `thiPage` qua `IUmbracoContextFactory`, gói trong một dịch vụ `IContestSettings` đăng ký ở `CustomCoreComposer.cs`. Không đưa các cài đặt này vào `appsettings`.
- Lý do: giữ đúng sheet "Nội dung Umbraco"; ban biên tập đổi được trong backoffice; BE-23/24 dùng lại.
- Ảnh hưởng: không sửa uSync hay document type.

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
