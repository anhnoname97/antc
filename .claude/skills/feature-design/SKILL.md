---
name: feature-design
description: Chuyển một yêu cầu hoặc mã công việc của antoantaichinh (FE-xx, BE-xx, API-xx, QUIZ-xx) thành thiết kế và danh sách task có thứ tự trước khi viết code, đối chiếu với tài liệu thiết kế nháp trong docs/ke-hoach và code hiện tại. Không viết code. Dùng khi người dùng muốn phân tích, thiết kế, lên kế hoạch hoặc chia việc cho một tính năng.
---

# feature-design: từ yêu cầu đến kế hoạch triển khai

Không sửa code hay tài liệu thiết kế trong skill này; chỉ được thêm mục vào `docs/quyet-dinh.md` khi người dùng đã xác nhận. Quy tắc về tài liệu nháp, 5 loại thông tin và khi nào phải hỏi nằm trong `CLAUDE.md`.

## Các bước

1. **Tài liệu trước**: tìm và đọc phần tài liệu áp dụng (cách tra như `/project-map` bước 2), kể cả các `QĐ-xxx` còn hiệu lực trong `docs/quyet-dinh.md`. Nếu chưa có bản đồ cho vùng này trong hội thoại, làm bước đó trước. Ghi nguồn cho từng ý.
2. **Code hiện tại**: xác định cái đã có, cái dùng lại được, ràng buộc kỹ thuật (2 CSDL, `IQuestionBank` + `Reload()`, tên trường JSON ngắn, uSync, không có project test…).
3. **Làm rõ yêu cầu**: mục tiêu, phạm vi (gồm cả phần *không* làm), hành vi, acceptance criteria (lấy từ cột "Tiêu chí nghiệm thu" nếu có), trường hợp biên (dữ liệu rỗng, lỗi mạng, nhập sai, quyền truy cập, đồng thời, responsive 1440/1024/390).
4. **Đối chiếu và phân loại**: với mỗi điểm thiết kế, ghi rõ là *tài liệu ghi*, *code hiện có*, *còn thiếu*, *đề xuất của Claude* hay *đã xác nhận*. Kiểm tra sheet "Câu hỏi mở": dòng nào liên quan thì nêu rõ phương án "Đang giả định" là chưa chốt.
5. **Phương án**: chỉ khi có lựa chọn thật. Mỗi phương án có lợi ích, đánh đổi, ảnh hưởng (contract, dữ liệu, FE/BE, công sức). Đưa ra khuyến nghị.
6. **Chia task**: lát dọc nhỏ, kiểm chứng được độc lập, thứ tự phụ thuộc rõ ràng. Ưu tiên một luồng chạy được từ đầu đến cuối sớm nhất.
   **Chia luồng song song**: khi việc FE cần một API/BE chưa có (hoặc ngược lại), không xếp nối tiếp mà chia:
   - **C (contract)**: chốt contract trước, ngay trong `1-thiet-ke.md`: đường dẫn, phương thức, request/response JSON mẫu, mã lỗi, dạng lỗi. Lấy từ sheet "API"; điểm nào chưa rõ thì đưa vào "Cần người dùng xác nhận". Các luồng chỉ bắt đầu khi contract không còn điểm chờ.
   - **Luồng `<mã>-fe`**: làm giao diện, gọi API qua lớp có mock đúng contract.
   - **Luồng `<mã>-be`**: làm API thật, kiểm bằng `Invoke-RestMethod` theo contract.
   - **I (tích hợp)**: sau khi merge các luồng, tắt mock, chạy luồng đầu–cuối. Làm trên nhánh chính của mã công việc.
   - Hai luồng không được sửa cùng file. Phần dùng chung (dịch vụ, entity, DTO) giao cho đúng một luồng, luồng kia chờ hoặc dùng mock. Ghi rõ file nào thuộc luồng nào.
   Task chạy tuần tự trên nhánh chính thì để cột "Luồng" là `chính`.
   **Cỡ task: vừa một phiên Worker.** Mỗi task tối đa khoảng một mã công việc hoặc nửa ngày công, chạm ít file, kiểm chứng được độc lập. Mã công việc lớn hơn (từ khoảng 1 ngày công, hoặc gồm cả giao diện lẫn lớp dữ liệu) thì tách thành nhiều task (ví dụ `FE-27a` khung màn và điều hướng, `FE-27b` đồng hồ đọc, `FE-27c` lưu đáp án). Mỗi task ghi rõ đầu vào nó cần từ task trước, để phiên mới làm được mà không cần trí nhớ của phiên cũ.
7. **Câu hỏi cần chốt**: liệt kê các điểm chạm nghiệp vụ, API contract, schema, bảo mật, tích hợp hoặc kiến trúc mà chưa có quyết định. Task phụ thuộc vào chúng được đánh dấu *chờ xác nhận*.

## Đầu ra

```
## Mục tiêu và phạm vi
## Nguồn đã dùng            (đường dẫn › mục; phần chưa đọc được)
## Hành vi và acceptance criteria
## Trường hợp biên
## Đối chiếu                 (bảng: Điểm | Loại thông tin | Nguồn/bằng chứng | Ghi chú)
## Phương án và khuyến nghị  (nếu có)
## Task
## Contract                  (khi có luồng song song)
| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
## Cần người dùng xác nhận
```

"Cách kiểm chứng" phải làm được trong repo hiện tại: build, chạy `run-local`, gọi API (`curl`/`Invoke-RestMethod`), xem trang ở các bề rộng, kiểm tra CSDL SQLite. Nếu cần thêm project test, ghi đó là đề xuất cần duyệt.

Đề xuất mới không trở thành quyết định cho tới khi người dùng xác nhận. Khi người dùng chốt một điểm thuộc loại phải hỏi, thêm mục vào `docs/quyet-dinh.md` theo mẫu trong file (đây là file duy nhất skill này được sửa), rồi báo lại số `QĐ-xxx` để `/implement-task` dùng.
