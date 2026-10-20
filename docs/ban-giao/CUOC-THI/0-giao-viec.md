# CUOC-THI · Luồng thi sau khi đăng ký: giao việc

- Ngày giao: 2026-10-17 · Người giao: điều phối (theo yêu cầu của anhnn: "đăng ký xong sẽ bắt đầu thi")
- Nhánh mã công việc: `feature/cuoc-thi` (tách từ `main` sau khi đã merge FE-25)
- Gồm: **FE-28, FE-23, FE-26, FE-27, FE-29, BE-23, BE-24**
- Nguồn: `docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` › "Công việc" (các mã trên), "API" (API-02 → API-05, bảng mã lỗi), "CSDL"; `Mo-ta-cong-viec-FE-antoantaichinh-v3.docx` › 5. Công việc của FE2; ảnh `th-04` → `th-09`, `th-11`, `mb-07`; bản dựng `docs/ban-dung/`.
- Đã có: FE-25 + API-01 (`ContestController`, `ContestEntryService`, `IContestSettings`, `contest-api.js` với `createEntry`, `at_entry`); QUIZ-01..03; bảng `entry` và các bảng cuộc thi của BE-20. Xem `docs/ban-giao/FE-25/3-review.md` › mục nghiệm thu, phần "Chuyển sang FE-26, FE-28, FE-29, BE-22, BE-23, BE-26".
- Quyết định liên quan: QĐ-001 → QĐ-012 trong `docs/quyet-dinh.md`.

## Yêu cầu

Sau khi đăng ký ở `/tham-gia/cuoc-thi`, thí sinh vào được danh sách chuyên đề, làm bài từng chuyên đề (câu hỏi có đồng hồ đọc, đáp án lưu lên máy chủ, tải lại trang vẫn lấy lại được tiến độ), xong chuyên đề, rồi nộp bài và xem kết quả.

## Orchestrator

1. `/feature-design` cho cả gói, ghi vào `docs/ban-giao/CUOC-THI/1-thiet-ke.md`.
2. **Chốt contract trước** cho API-02, API-03, API-04, API-05 (request/response JSON mẫu, mã lỗi, xác thực `X-Entry-Token`), theo sheet "API". Điểm nào chưa rõ thì đưa vào "Cần người dùng xác nhận".
3. **Chia luồng song song** theo mục "Chạy song song theo luồng" trong `CLAUDE.md` và bước 6 của skill `feature-design`:
   - luồng `CUOC-THI-fe`: FE-28, FE-23, FE-26, FE-27, FE-29 (gọi API qua mock đúng contract khi BE chưa xong);
   - luồng `CUOC-THI-be`: BE-23, BE-24;
   - task tích hợp trên nhánh `feature/cuoc-thi` sau khi merge.
   Có thể chia thành 2 đợt (đợt 1: làm bài và lưu đáp án; đợt 2: nộp bài và kết quả) nếu hợp lý. Ghi rõ file nào thuộc luồng nào, không để hai luồng sửa cùng file.
4. Ghi rõ task nào làm được ngay, task nào chờ xác nhận.

## Worker

Chờ `1-thiet-ke.md`. Mỗi luồng ghi bàn giao vào `2-ban-giao-<luồng>.md`.

## 2026-10-18: giao M1a cho Worker

- Luồng `CUOC-THI-hopnhat` (nhánh `lane/CUOC-THI-hopnhat` từ `dev`, `-AllowCommit`). Chỉ làm task **M1a** trong `1-thiet-ke.md`; QĐ-022.
- Báo cáo vào `2-ban-giao-CUOC-THI-hopnhat.md`. Không push, không merge vào `dev` (điều phối làm sau khi review).


## 2026-10-18: sửa theo review M1a (QĐ-023)

Worker, luồng `CUOC-THI-hopnhat`: xử lý mục "Worker phải sửa" của `3-review-CUOC-THI-hopnhat.md` (1: sửa gạch "Lưu ý đã biết" trong `CLAUDE.md`; 2: BỎ gạch "Google Sheet là bản chuẩn"; 3: sửa tham chiếu tên bản dựng) và sửa test `AntcPublicPathsTests.Manual_faq_documents_do_not_have_a_public_route` theo hành vi code (không sửa `AntcPublicPaths.cs`). Chạy `dotnet test` phải sạch. Thêm mục vào `2-ban-giao-CUOC-THI-hopnhat.md`. Commit riêng, không push; điều phối sẽ merge vào `dev`.
