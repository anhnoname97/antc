# CUOC-THI · 4a · Phân tích kế hoạch mới (bản dựng v2)

- Ngày: 2026-10-18 · Người viết: Orchestrator · Loại: phân tích chỉ đọc, không thiết kế lại, không sửa code hay tài liệu gốc.
- So sánh: `docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` bản **cũ** (`git show 3c035da`, lưu ở `C:\GTSC\DMST\agent-artifacts\phan-tich-v2\plan-cu.xlsx`) với bản **mới** (commit `05847bac`). So từng ô theo mã dòng bằng `openpyxl`; số kiểu `1` → `1.0` và các ô công thức trước đây chưa có giá trị đệm không tính là thay đổi.
- Nguồn đối chiếu thêm: `docs/ke-hoach/Mo-ta-cong-viec-FE-antoantaichinh-v3.docx` (không đổi từ `6dc8e3d5`); `docs/ke-hoach/anh-v2/README.md`; trang `cuoc-thi-thang` và `thu-doan` tách từ `docs/ban-dung/antoantaichinh-ban-dung-thu.html` bằng `anh-v2/cong-cu/extract_v2.py`; `docs/quyet-dinh.md`; `docs/ban-giao/CUOC-THI/1-thiet-ke.md`; code nhánh `feature/cuoc-thi` và worktree `C:\GTSC\DMST\wt\CUOC-THI-fe`.
- Ký hiệu nguồn: `xlsx›<sheet>›<mã/dòng>` là bản mới, trừ khi ghi "cũ". `v2›cuoc-thi-thang:<dòng>` là dòng trong trang tách ra từ bản dựng.

## 0. Tóm tắt

| # | Kết luận | Mức |
|---|---|---|
| 1 | Kế hoạch mới thêm **cuộc thi theo tháng** ở lớp giao diện (FE-32 thanh thông báo + lịch tháng, FE-33 trang Cuộc thi tháng, thẻ tháng ở FE-05, FE-12, FE-20, FE-24) nhưng **không đổi một dòng nào** ở BE-20…BE-28, sheet API, CSDL, Nội dung Umbraco, URL, Khác biệt bản dựng, Câu hỏi mở. | Lớn (khoảng trống) |
| 2 | Bản dựng v2 nói rõ hơn kế hoạch: "Mỗi số tối đa 2 lượt **trong tháng**", "Mỗi tháng có một cuộc thi mới… **lượt thi tính lại từ đầu**", kết quả và giải **theo tháng** (`v2›cuoc-thi-thang:248, 251, 301`). Code hiện đếm lượt theo số điện thoại trên toàn bộ thời gian và chỉ có một cửa sổ `contestStart`/`contestEnd`. Nếu áp dụng, phải đổi schema `entry`, cài đặt cuộc thi, API-01/04/05 và QĐ-003, 006, 008, 014, 015. | Lớn |
| 3 | FE-25…FE-29: luồng, hành vi, API **không đổi**; chỉ đổi màu/kiểu nút sang hệ v2, ảnh tham chiếu thành "bản dựng v2 chưa có màn này, ảnh v1 chỉ tham khảo luồng", tiêu chí "giống ảnh" thành "đúng luồng và câu chữ như mô tả". Thiết kế `1-thiet-ke.md` và code luồng thi vẫn dùng được. | Nhỏ–Vừa |
| 4 | FE-23 đổi nghĩa màu: đáp án sai tô **hổ phách**, nhãn "⚠ Bạn chọn"; code F2 đang tô đỏ (`quiz.css:34-35`). | Vừa |
| 5 | Kế hoạch mới chưa phản ánh QĐ-013, 014, 015 (API-02 `cd`, `CONTEST_CLOSED` ở API-04/05, `INCOMPLETE_ANSWERS`); FE-29 vẫn ghi "Còn z câu chưa làm sẽ tính là chưa đúng". QĐ vẫn thắng tài liệu. | Nhỏ |
| 6 | `.docx` lỗi thời toàn bộ phần giao diện (màu, chữ, header, Tham gia/Thử sức, không có FE-32…34). | — |
| 7 | **Ngoài kế hoạch nhưng phải biết trước khi làm tiếp**: `origin/main` của nhóm đi trước `main` local 33 commit và đã có bản cài đặt riêng của API-01, `ContestController`, `ContestEntryService`, bảng `contest`/`contest_topic`/`contest_question` (migration `AddContestCampaigns`), dịch vụ "cuộc thi hiện tại", `quiz.css`, project test. Trùng và có thể xung đột với code gói CUOC-THI. | Lớn (rủi ro) |

## 1. So sánh cũ → mới

### 1.1 Theo sheet

| Sheet | Thay đổi | Liên quan gói | Nguồn |
|---|---|---|---|
| Tổng quan | Đổi vai trò FE1/FE2/BE1/BE2 thành tên người (AnVD, MinhNB, NamNT, HieuHV); các ô tổng công nay có giá trị (63 ngày công, vận hành ngày 14). Ghi chú "Umbraco 17 LTS" (r38) **giữ nguyên**. | Không đổi phạm vi | xlsx›Tổng quan›r6–r16, r38 |
| Công việc | Thêm 3 dòng FE-32, FE-33, FE-34; sửa nội dung FE-01…FE-08, FE-12, FE-13, FE-20…FE-31 theo v2; mọi dòng đổi "Phụ trách"; một số dòng đổi "Trạng thái". Các dòng BE **chỉ đổi người và trạng thái**. | Có | xlsx›Công việc |
| Lịch | Thêm FE-32 (ngày 11), FE-33 (ngày 11–12), FE-34 (ngày 5); đổi tên người. | Có | xlsx›Lịch›r31–r33 |
| API | Không đổi nội dung (chỉ kiểu số ở cột HTTP). | Có (khoảng trống) | xlsx›API›r5–r28 |
| CSDL | Không đổi. | Có (khoảng trống) | |
| Nội dung Umbraco | Không đổi. | Có (khoảng trống) | |
| URL | Không đổi (vẫn `/tham-gia`, `/tham-gia/thu-suc`, `/tham-gia/cuoc-thi`; không có trang Cuộc thi tháng). | Có (mâu thuẫn) | xlsx›URL›r9–r11 |
| Khác biệt bản dựng | Không đổi (vẫn mô tả bản dựng v1: Manrope, menu ẩn ≤ 1080px, băng chuyền 5 slide…). | Có (lỗi thời) | xlsx›Khác biệt bản dựng›r16, r22, r26 |
| Câu hỏi mở | Không đổi nội dung; chỉ có giá trị tổng (2,25 / 0,5 / 2,5 ngày). Không có câu nào về cuộc thi tháng. #1 vẫn "Chưa chốt". | Có (khoảng trống) | xlsx›Câu hỏi mở›r5–r24 |
| Ảnh | Không đổi (vẫn danh sách ảnh v1, ví dụ `tg-01` → FE-20). | Có (lỗi thời) | xlsx›Ảnh›r24 |

### 1.2 Từng việc của gói

Cột "Thiết kế" = ảnh hưởng tới `1-thiet-ke.md`; cột "Code" = ảnh hưởng tới code đã có (BE B1–B4 đã merge vào `feature/cuoc-thi` `b2cebc2b`; FE F1, F2, F3, F4a ở `lane/CUOC-THI-fe`).

| Mã | Cũ → mới (nguồn: xlsx›Công việc) | Thiết kế | Code | Mức |
|---|---|---|---|---|
| FE-20 | "Trang Tham gia" → "Trang Cuộc thi (trước là trang Tham gia)": hero số 04, khối "200 câu hỏi, 8 chuyên đề" + "thẻ dự thi · tháng …" dẫn tới Cuộc thi tháng, khối Thử sức nằm trong trang, góp ý + chia sẻ; dữ liệu động thêm "tháng và chuyên đề (FE-32)"; tiêu chí "giống bản dựng v2 ở 1440px và 390px"; trạng thái Chưa làm → **Chờ kiểm tra**. | Ngoài gói; liên kết vào luồng thi đổi chỗ | Không đụng code gói | Nhỏ |
| FE-23 | Màu theo v2: sai tô hổ phách `#A85F00`/`#FFF3DF`, nhãn "⚠ Bạn chọn", đúng `#14853B`/`#E7F6EC`, ô chữ cái nền `#F6F2EA` chữ `#14233B`, hover viền `#14233B`; tiêu chí "giống câu đố Thử sức của bản dựng v2"; ảnh `tt-01..03` → "bản dựng v2 #cuoc-thi (khối Thử sức)"; trạng thái → **Chờ kiểm tra**. | AC FE-23 trong thiết kế (so `tt-01..03`) lỗi thời | `quiz.css:34-35` dùng `--c-danger` (đỏ) cho `.wrong`; dấu ✕ ở nhãn | Vừa |
| FE-24 | Trang riêng `/tham-gia/thu-suc` → **khối** `#thu-suc` trong trang Cuộc thi, "cần chốt có chuyển hướng 301"; bỏ cột Tiến độ và 8 ô số, thay bằng 8 vạch; màn kết quả có thẻ mời "Thi thật · tháng …"; trạng thái → **Chờ kiểm tra**. | Ngoài gói; thiết kế chỉ yêu cầu FE-23 dùng lại được cho FE-24 | Không | Nhỏ |
| FE-25 | Thêm "Bản dựng v2 chưa vẽ lại màn này. Dựng theo hệ thiết kế v2 (FE-01: nền kem, xanh than, Roboto, nút bo tròn) và giữ nguyên luồng"; đổi màu hộp nhắc (`#FFF3DF`), thẻ chọn (`#14233B`/`#EEF1F6`), lỗi `#B3261E`; tiêu chí "giống ảnh" → "đúng luồng và câu chữ như mô tả"; ảnh `th-01..03, th-10, mb-06` → "chỉ tham khảo luồng". Trạng thái **vẫn "Chưa làm"** dù đã merge `main` (`a244e243`). | Không (đã xong) | `thiPage.cshtml`, `contest.css` còn màu v1 qua biến token v1 | Nhỏ |
| FE-26 | Như FE-25: dựng theo hệ v2; hộp hồng → hộp nhắc `#FFF3DF`; ô số `#F6F2EA`; mã dự thi `#14233B`; hộp cảnh báo `#FCEBE9`; tiêu chí "giống 4 ảnh" → "đúng luồng và câu chữ như mô tả"; ảnh v1 chỉ tham khảo luồng. Luồng, khóa CĐ2–8, cột bên **không đổi**. | AC "giống th-04, th-05, th-09, th-11" và kiểm chứng "so ảnh 1440/1024/390" cần đổi cách nói | Màu qua token; bố cục giữ | Nhỏ |
| FE-27 | Chỉ thêm đoạn "dựng theo hệ v2"; ảnh `th-06..08, mb-07` chỉ tham khảo luồng. Hành vi, đồng hồ, tiêu chí **không đổi**. | Không | Không | Nhỏ |
| FE-28 | Chỉ đổi người phụ trách. Trạng thái vẫn "Chưa làm" (F1 đã xong ở luồng fe). | Không | Không | Nhỏ |
| FE-29 | Thêm đoạn "dựng theo hệ v2"; nút `fbtn` → `.btn-navy`, "Làm tiếp" `obtn` → `.btn-line`; hộp hồng → hộp nhắc. Câu "Còn z câu chưa làm sẽ tính là chưa đúng" và ghi chú "điều kiện nộp đang là giả định, câu hỏi mở số 1" **giữ nguyên** (trái QĐ-015). | Không (QĐ-015 thắng) | F5 chưa làm; tên class nút đổi | Nhỏ |
| FE-31 | Mốc kiểm tra 360/390/768/1024/1280/1440 → **360/390/744/1024/1133/1280/1440**; thêm trang Cuộc thi tháng, thanh thông báo ở ngày đầu/cuối tháng và tháng ngoài lịch. Phụ thuộc chưa thêm FE-32, FE-33. | Kịch bản tích hợp bước 9 (1440/1024/390) thiếu 744 | Không | Nhỏ |
| FE-32 (mới) | Thanh 40px trên header mọi trang trừ Ứng phó; "một nguồn dữ liệu dùng chung" cho thanh, FE-05, FE-20, FE-12, FE-33: lịch các tháng (tháng bắt đầu, khóa chuyên đề, tên); tháng hiện tại theo ngày máy chủ, tháng ngoài lịch thì lấy tháng kế tiếp; máy chủ in sẵn vào HTML; "BE cấp từ cài đặt cuộc thi". Phụ thuộc chỉ FE-02. | Ngoài gói; cần nguồn dữ liệu BE chưa có (mục 3) | Không có code | Vừa |
| FE-33 (mới) | Trang Cuộc thi tháng: hero "Chuyên đề: <tên>", nhãn ngày thi/200 câu/2 lượt/có xét thưởng, nút "Đăng ký dự thi ⟶" **tới luồng thi FE-25**; dải nhận diện; thể lệ 4 bước; giải thưởng; lịch 8 tháng; kết quả tháng trước (số lượt, người đạt điểm tối đa, bảng đoạt giải tên viết tắt + **xã, phường**); thắc mắc; ô "Nhắc tôi khi có cuộc thi tháng sau" (thư điện tử). Tiêu chí "giống bản dựng v2 ở 1440, 744, 390". | Ngoài gói; định nghĩa lại "cuộc thi" mà luồng thi phục vụ | Không có code | Lớn |
| FE-34 (mới) | Module hiệu ứng cuộn `motion.js` (GSAP + ScrollTrigger) cho mọi trang. | Không | Không | Nhỏ |
| FE-01, FE-02, FE-03, FE-08 | Hệ thiết kế v2 (kem/xanh than/Roboto, nút `.btn-*`, mốc 1240/1023/900/700/600), header cố định 80px + thanh 40px, menu "Cuộc thi", menu hai hàng ≤ 1023px, hero không ảnh, đệm 160/200px. FE-01, FE-02 "Chưa làm"; FE-08 "Đang làm". | Luồng thi dựng "theo hệ v2" nhưng hệ v2 chưa có | `tokens.css` còn bảng màu v1 (`--c-danger: #C62828`, `--c-ok: #1B7F3B`); `thiPage.cshtml:89,121` dùng `.btn btn--primary` | Vừa |
| FE-05, FE-12 | Thêm thẻ "Cuộc thi tháng này" ở hero Giới thiệu và nhãn "★ Cuộc thi tháng này" ở lĩnh vực Thủ đoạn, cùng nguồn FE-32. | Ngoài gói | Không | Nhỏ |
| BE-20, BE-21, BE-35, BE-22 | Chỉ đổi người; trạng thái → **Xong**. | Không | Không | Nhỏ |
| BE-23, BE-24 | Chỉ đổi người; trạng thái **vẫn "Chưa làm"** dù đã merge `feature/cuoc-thi`. Mô tả vẫn `NOTHING_TO_SUBMIT`, không có `cd`, không có cửa sổ tháng. | Không | Không | Nhỏ |
| BE-26, BE-27, BE-28, BE-33, BE-36 | Chỉ đổi người. Không có khái niệm tháng: thống kê, quay số, danh sách đủ điều kiện tính trên toàn bộ lượt. | Ngoài gói; mâu thuẫn với "giải theo tháng" (mục 3) | Không | Vừa (cho các việc sau) |
| BE-12, BE-13 | Không đổi: chuyển hướng `/thi → /tham-gia/cuoc-thi`, "Gắn dữ liệu trang Thủ đoạn và trang **Tham gia**". | Không | Không | Nhỏ |

### 1.3 Cuộc thi theo tháng: kế hoạch nói gì, bản dựng nói gì, code đang thế nào

| Điểm | Kế hoạch mới (xlsx) | Bản dựng v2 | Code hiện có |
|---|---|---|---|
| Kỳ thi | FE-32: lịch các tháng; FE-33: "ngày thi", "lịch 8 tháng". Không có ở BE/CSDL/API. | 8 tháng 2026-08 → 2027-03, mỗi tháng `[tháng, khóa, tên]`, ví dụ `["2026-10","vieclam","Việc làm, làm thêm"]`; ngày thi = cả tháng (`v2›cuoc-thi-thang:327-330`). Ghi "Lịch ví dụ… Chủ đề chính thức do Ban tổ chức công bố" (ảnh `ctt-05-lich-ca-nam-1440.png`). | Một cửa sổ `contestStart`/`contestEnd` trên `thiPage` (`ContestSettingsService.cs:76-78`); nội dung mẫu 2026-10-01 → 2026-12-31 (QĐ-008). |
| "Chuyên đề tháng" | Nhãn lĩnh vực ở Thủ đoạn (FE-12); "Ôn chuyên đề trước" tới lĩnh vực ở Thủ đoạn (FE-33). | Khóa tháng = khóa lĩnh vực Thủ đoạn (`data-topic="vieclam"`…, `v2›thu-doan:257-262`), **không phải** chuyên đề 1–8 của ngân hàng câu hỏi. | Ngân hàng 8 chuyên đề (`quiz_topic`); không có liên kết lĩnh vực ↔ tháng. |
| Đề thi mỗi tháng | FE-33 "200 câu hỏi"; FE-20 "200 câu hỏi, 8 chuyên đề". Không nói đề có đổi theo tháng. | "200 câu trong 8 chuyên đề, trọng tâm là chuyên đề của tháng" (`v2›cuoc-thi-thang:250`). | Một ngân hàng; "đủ câu" = mọi câu đang dùng (`ContestAttemptService.cs:320`, QĐ-015). |
| Số lượt | "tối đa 2 lượt / số điện thoại" (FE-33); BE-22 đếm "số lượt đã có của số điện thoại đó (mọi trạng thái)". | "Mỗi số tối đa 2 lượt **trong tháng**" (`:248`); "Mỗi tháng có một cuộc thi mới với chuyên đề mới, **lượt thi tính lại từ đầu**" (`:301`). | Đếm toàn thời gian: `ContestEntryService.cs:98`, `ContestAttemptService.cs:264`, `:338`. `entry` không có cột kỳ (`Entities.cs:8-33`). |
| Kết quả và giải | FE-33: kết quả tháng trước, bảng đoạt giải; BE-27/BE-28 không có tháng. | "Lượt cao điểm hơn được tính"; công bố "đầu tháng sau"; giải nhất 2.000.000 đồng (1 giải), nhì 1.000.000 (2), ba 500.000 (3)… (`:250-251, 263-265`); bảng "Giải · Người thi · Xã, phường" (`:285`). | Chưa có (BE-27, BE-28 chưa làm). Không có cột xã/phường. |

### 1.4 Tiêu chí nghiệm thu, mốc responsive, ảnh tham chiếu

| Điểm | Cũ | Mới | Ảnh hưởng |
|---|---|---|---|
| Tiêu chí hình ảnh FE-25, FE-26 | "Giống các ảnh tham chiếu" (`th-*`) | "Đúng luồng và câu chữ như mô tả (bản dựng v2 chưa có màn này)" | Review không còn so pixel với `th-*`; chỉ so luồng/câu chữ. Không có chuẩn hình ảnh cho luồng thi theo v2 → cần chủ quản duyệt giao diện. |
| Mốc kiểm tra | 1440/1024/390 (FE-03), 360…1440 gồm 768 (FE-31) | 744 (iPad mini dọc) và 1133 (ngang) thêm vào FE-03, FE-14, FE-31; FE-33 "1440, 744, 390"; ảnh v2 chụp 1440/744/390 (`anh-v2/README.md:3`) | Kịch bản kiểm chứng trong `1-thiet-ke.md` (1440/1024/390) nên thêm 744. Breakpoint ≤ 900px của luồng thi vẫn nằm trong bộ mốc v2 (FE-01). |
| Ảnh tham chiếu | Thư mục `anh/` | Cột vẫn tên "(thư mục anh/)" nhưng ghi "Bản dựng v2: **an-toan-tai-chinh-website.html**#…"; repo đặt bản dựng ở `antoantaichinh-ban-dung-thu.html`; FE-25…29 "chưa có màn này", dùng ảnh v1 tham khảo luồng | Khớp `anh-v2/README.md:13`. Tên file trong cột không khớp repo. |

## 2. `.docx` so với `.xlsx` mới

File `.docx` không đổi từ `6dc8e3d5`; commit `05847bac` chỉ đổi bản dựng và `.xlsx`.

| Phần trong docx | Tình trạng | Bằng chứng |
|---|---|---|
| 2. Biến thiết kế (màu, chữ, nút) | **Lỗi thời**: `#5C0F0B` xuất hiện 25 lần, Manrope 4 lần, `fbtn` 4 lần; không có `#14233B`, Roboto, `.btn-navy`, hổ phách | quét toàn văn docx |
| 1.3 Bảng URL, FE-20 "Trang Tham gia", FE-24 "Trang Thử sức: 8 câu", FE-02 "Dải trên cùng", FE-03 "≤ 1080px", FE-05 "Băng chuyền 5 slide", FE-08 "6 trang con" | **Lỗi thời** (tên và nội dung theo v1) | heading docx › 4, 5 |
| FE-32, FE-33, FE-34, mọi nội dung "tháng" | **Thiếu** (0 lần "tháng", 0 lần FE-32…34) | quét toàn văn |
| FE-23 (màu đúng/sai, ảnh `tt-*`), FE-25, FE-26, FE-27, FE-29 (màu, ảnh `th-*`, tiêu chí "giống ảnh") | **Lỗi thời một phần**: luồng, hành vi, dữ liệu động vẫn khớp xlsx mới | docx › 5 |
| FE-28 | Khớp | |
| 6. Hợp đồng API, Bảng mã lỗi | Khớp xlsx (cả hai cùng chưa có QĐ-013/014/015) | docx › 6 |
| 7. Khác biệt so với bản dựng | Khớp sheet cũ; cả hai đều lỗi thời với v2 | docx › 7 |
| 8. Câu hỏi mở | Khớp sheet | docx › 8 |
| 1.1 "Umbraco 17 LTS" | Sai so với repo (18.2.1) | docx bảng 1 |

Kết luận: với phần giao diện, chỉ dùng `.xlsx` mới + ảnh `anh-v2`; với luồng thi FE-25…29 và API, docx vẫn dùng được cho luồng/hành vi.

## 3. Khoảng trống và mâu thuẫn trong kế hoạch mới

| # | Vấn đề | Nguồn | Loại | Mức |
|---|---|---|---|---|
| K-1 | FE-32 cần "một nguồn dữ liệu dùng chung… BE cấp từ cài đặt cuộc thi" nhưng **không có việc BE nào** làm; Nội dung Umbraco không có thuộc tính lịch tháng; CSDL, API không có. FE-32 chỉ phụ thuộc FE-02. | xlsx›Công việc›FE-32; Nội dung Umbraco›r26–r34 | Thiếu việc, thiếu contract | Lớn |
| K-2 | Cuộc thi tháng (lượt tính lại mỗi tháng, kết quả/giải theo tháng) chỉ có trong bản dựng v2, không có trong BE-22…28, CSDL (`entry` không có kỳ), "Câu hỏi mở". FE-33 ghi "tối đa 2 lượt / số điện thoại", không nói "trong tháng". | v2›cuoc-thi-thang:248, 301; xlsx›BE-22, CSDL›r5–r20 | Nghiệp vụ chưa rõ | Lớn |
| K-3 | Hai hệ "chuyên đề": chuyên đề tháng = lĩnh vực Thủ đoạn; luồng thi = 8 chuyên đề của ngân hàng (FE-26 khóa CĐ2–8 đến khi xong CĐ1). "Trọng tâm là chuyên đề của tháng" chưa định nghĩa: cùng 200 câu mỗi tháng hay đề riêng? | v2›cuoc-thi-thang:250; xlsx›FE-26, FE-33 | Nghiệp vụ chưa rõ | Lớn |
| K-4 | Lịch có 8 tháng, Thủ đoạn chỉ có 6 lĩnh vực; 2 tháng (`mxh`, `chinhsach`) không có lĩnh vực để gắn nhãn (FE-12) hay "Ôn chuyên đề trước" (FE-33). | v2›cuoc-thi-thang:327; v2›thu-doan:257-262; xlsx›BE-13 "6 thẻ lĩnh vực" | Mâu thuẫn dữ liệu | Vừa |
| K-5 | Bảng đoạt giải hiện "xã, phường": form đăng ký (FE-25) và `entry` không thu trường này. | xlsx›FE-33; CSDL›r5–r20; v2›cuoc-thi-thang:285 | Thiếu dữ liệu cá nhân | Vừa |
| K-6 | Giải theo hạng (nhất/nhì/ba, số giải cố định) và "lượt cao điểm hơn được tính", trong khi BE-28 là quay số ngẫu nhiên trên ngưỡng điểm, không theo tháng. | v2›cuoc-thi-thang:250, 263-265; xlsx›BE-28; Câu hỏi mở #3 | Mâu thuẫn nghiệp vụ | Vừa |
| K-7 | "Kết quả tháng trước" (số lượt, số người đạt điểm tối đa, danh sách đoạt giải) công khai và "Nhắc tôi khi có cuộc thi tháng sau" (thu thư điện tử): không có việc BE, API, bảng nào. | xlsx›FE-33 | Thiếu việc | Vừa |
| K-8 | URL: menu đổi "Cuộc thi", Thử sức thành khối `#thu-suc`, thêm trang Cuộc thi tháng; sheet URL và BE-12 vẫn `/tham-gia/*`, không có URL cho Cuộc thi tháng; FE-24 tự ghi "cần chốt 301". Luồng thi (FE-25) nằm ở đâu so với trang Cuộc thi tháng chưa nói. | xlsx›URL›r9–r11; BE-12; FE-24 | Mâu thuẫn | Vừa |
| K-9 | Luồng thi phải "dựng theo hệ thiết kế v2 (FE-01)" nhưng FE-25…29 không phụ thuộc FE-01 và FE-01 còn "Chưa làm". | xlsx›FE-25…29 cột Phụ thuộc; FE-01 | Phụ thuộc thiếu | Vừa |
| K-10 | Kế hoạch chưa nhận QĐ-013, 014, 015: API›r6 thiếu `cd`, r8–r9 thiếu `CONTEST_CLOSED`, r26 còn `NOTHING_TO_SUBMIT`; FE-29 còn "Còn z câu chưa làm…"; Câu hỏi mở #1 "Chưa chốt". | xlsx›API, FE-29, Câu hỏi mở›r5 | Tài liệu chậm hơn QĐ | Nhỏ |
| K-11 | Cột "Trạng thái" không khớp thực tế: FE-25 "Chưa làm" (đã merge `main`), FE-28 "Chưa làm" (F1 xong), BE-23/BE-24 "Chưa làm" (đã merge `feature/cuoc-thi`); FE-23 "Chờ kiểm tra" nhưng không rõ bản nào (xem K-15). | xlsx›Công việc | Không khớp | Nhỏ |
| K-12 | "Umbraco 17 LTS" (Tổng quan›r38, BE-01 "Khởi tạo solution Umbraco 17") so với repo 18.2.1. Có từ bản cũ, bản mới không sửa. | xlsx›Tổng quan›r38, BE-01; `CLAUDE.md` | Mâu thuẫn tài liệu ↔ code | Nhỏ |
| K-13 | Sheet "Khác biệt bản dựng" và "Ảnh" còn mô tả v1 (Manrope, menu ẩn ≤ 1080px, băng chuyền, `tg-01`…); Nội dung Umbraco còn `heroImage1…5` dù hero v2 không dùng ảnh, `thamGiaPage`, `thiThuPage`. | xlsx›Khác biệt›r16, r22, r26; Ảnh; Nội dung Umbraco›r20, r24–r25; FE-08 | Lỗi thời | Nhỏ |
| K-14 | Lịch chồng ngày (FE-32/FE-04/FE-30 ngày 11; FE-33/FE-31 ngày 12; FE-34/FE-13 ngày 5), kế hoạch tự ghi "cần xếp lại"; FE-31 chưa phụ thuộc FE-32, FE-33. Thử sức v2 chỉ có 3 câu (`anh-v2/README.md:33`). | xlsx›FE-32…34 cột Ghi chú; FE-31 | Lịch | Nhỏ |
| K-15 | **Ngoài kế hoạch**: `origin/main` hơn `main` local 33 commit (`git rev-list --left-right --count main...origin/main` = `3 33`), đã có `ContestController`, `ContestEntryService`, `ContestAdminService`, migration `20261016044750_AddContestCampaigns` (bảng `contest`, `contest_topic`, `contest_question`), `CurrentContestService` (chọn kỳ đang mở theo `start_at`/`end_at` trong CSDL), `quiz.css`, `quiz-components.js`, `thipage.config` khác, project `Umbraco.Plugin.Custom.Tests`. Hai bản cài đặt API-01 và hai nơi giữ cài đặt cuộc thi (Umbraco `thiPage` theo QĐ-003 vs bảng `contest`). | `git show origin/main:…/Contest/CurrentContestService.cs`; `…/Migrations/20261016044750_AddContestCampaigns.cs` | Xung đột code/kiến trúc | Lớn |

Ghi chú ngoài gói (không phân tích sâu): FE-22 giới hạn 1.500 ký tự, còn API-06, BE-25, CSDL vẫn 2.000.

## 4. Đối chiếu QĐ-001 … QĐ-016

| QĐ | Nội dung ngắn | Đánh giá | Lý do |
|---|---|---|---|
| 001 | Tài liệu là bản nháp | **Còn hiệu lực** | Kế hoạch mới vẫn là bản nháp; càng cần vì bản dựng v2 và xlsx lệch nhau (K-2, K-3). |
| 002 | FE-25 làm API-01 tối thiểu; rate limit để BE-26 | **Còn hiệu lực** (đã thực hiện) | BE-26 không đổi. Cần xem cùng K-15: nhóm đã có bản API-01 khác trên `origin/main`. |
| 003 | Cài đặt cuộc thi đọc từ nút `thiPage` | **Cần xem lại, có thể bị thay** | Cuộc thi tháng cần nhiều kỳ, mỗi kỳ có ngày, chủ đề, có thể đề riêng; một bộ `contestStart/End` trên `thiPage` không biểu diễn được. `origin/main` đã chọn lưu kỳ trong CSDL (bảng `contest`). |
| 004 | Lỗi `{ error: { code, message, fields } }` | **Còn hiệu lực** | Kế hoạch giữ nguyên (API›r2, BE-26). |
| 005 | Muối băm IP trong cấu hình | Đã thay bằng QĐ-009 | |
| 006 | Trạng thái từ `contestStart/End`, trống = chưa mở | **Cần xem lại** | Với kỳ tháng, "đang mở" tính theo kỳ hiện tại; FE-32 thêm quy tắc "tháng ngoài lịch thì hiển thị tháng kế tiếp" (chỉ cho hiển thị). Nguyên tắc "thiếu ngày → chưa mở" vẫn dùng được. |
| 007 | Câu "lượt thi gắn với trình duyệt" | **Còn hiệu lực** | FE-25 giữ luồng; Câu hỏi mở #12 không đổi. |
| 008 | Commit ngày mẫu 2026-10-01 → 2026-12-31 | **Cần xem lại** | Khoảng mẫu trùm 3 tháng của lịch v2 (10, 11, 12/2026); nếu chuyển sang kỳ tháng thì ngày mẫu phải theo kỳ. Rủi ro triển khai giữ nguyên. |
| 009 | Thiếu muối vẫn cho đăng ký | **Còn hiệu lực** | Không liên quan thay đổi. |
| 010 | `attemptNo` ẩn danh = `null` | **Còn hiệu lực** | Nếu lượt tính theo tháng thì `attemptNo` là "lượt thứ n trong tháng"; giá trị `null` cho ẩn danh không đổi. |
| 011 | Worker commit vào `lane/*` | **Còn hiệu lực** | Quy trình. |
| 012 | Chưa mở API-01 thật trước BE-26; OTP hỏi chủ quản | **Còn hiệu lực** | Giải tiền mặt theo tháng (v2) làm câu hỏi OTP/lạm dụng lượt quan trọng hơn. |
| 013 | API-02 thêm `cd` | **Còn hiệu lực** | Kế hoạch chưa ghi (K-10) nhưng không mâu thuẫn. |
| 014 | Cửa sổ thời gian API-03/04/05, gia hạn nộp | **Cần xem lại** | Với kỳ tháng: `contestEnd` là cuối tháng, gia hạn 24 giờ rơi vào kỳ sau; phải nói lượt thuộc kỳ nào, và API-03 chặn theo kỳ của lượt hay kỳ hiện tại. |
| 015 | Phải trả lời đủ mọi câu của ngân hàng đang dùng | **Cần xem lại** | Nếu mỗi tháng có đề riêng ("trọng tâm chuyên đề tháng"; `contest_question` ở `origin/main`), "ngân hàng đang dùng" phải hiểu là đề của kỳ. Quy tắc "đủ câu" vẫn giữ được. Kế hoạch FE-29 chưa sửa theo (K-10). |
| 016 | QUIZ-02 công khai vẫn trả `ans`, `exp`; chấp nhận rủi ro công bằng | **Cần xem lại** | QĐ tự đặt điều kiện "nếu… giải thưởng giá trị lớn, phải có QĐ mới". Bản dựng v2 ghi giải nhất 2.000.000 đồng mỗi tháng, xét theo hạng và "người đạt điểm tối đa" (`v2›cuoc-thi-thang:263, 283`). Cần báo chủ quản trước khi chạy thật. |

## 5. Ảnh hưởng tới thiết kế và code đã có (gộp)

| Thành phần | Nếu chỉ áp dụng phần giao diện v2 | Nếu áp dụng cuộc thi tháng như bản dựng v2 |
|---|---|---|
| `1-thiet-ke.md` (contract API-02…05, task B/F, AC) | Giữ; sửa AC FE-23 (màu sai), FE-26 (bỏ "giống ảnh"), kịch bản kiểm chứng thêm 744 — **Nhỏ** | Contract API-01…05 thêm khái niệm kỳ (đếm lượt, cửa sổ, điều kiện nộp) — **Lớn** |
| BE `Contest/*` (B1–B4 đã merge) | Không đổi — **Nhỏ** | Cài đặt nhiều kỳ, lọc lượt theo kỳ (`ContestEntryService.cs:98`, `ContestAttemptService.cs:264, 338`), migration thêm cột kỳ cho `entry` — **Lớn** |
| FE `contest-api.js`, `contest-store.js`, `exam.js` (F1, F3, F4a) | Không đổi logic — **Nhỏ** | Có thể phải biết kỳ của lượt (lượt tháng trước còn trong `at_entry`) — **Vừa** |
| FE `quiz.css`, `contest.css`, `thiPage.cshtml` | Đổi màu sai → hổ phách (`quiz.css:34-35`), nút `.btn-*` v2 (`thiPage.cshtml:89, 121`), token v2 khi FE-01 xong — **Vừa** | như trái |
| Code nhóm trên `origin/main` (K-15) | Phải chọn một bản trước khi merge `feature/cuoc-thi` vào `main` — **Lớn** | như trái, cộng chọn mô hình kỳ (Umbraco hay bảng `contest`) |

## 6. Câu hỏi cần xác nhận

Thứ tự theo mức chặn. "Người dùng" = anhnn; "Chủ quản" = bên giao việc.

| # | Câu hỏi | Ai | Chặn gì | Gợi ý của Orchestrator (chưa phải quyết định) |
|---|---|---|---|---|
| 1 | Nhánh nào là chuẩn cho code cuộc thi: `feature/cuoc-thi` (API-01…05 theo QĐ-002…016) hay bản trên `origin/main` (bảng `contest`, `ContestEntryService` khác, project test)? Ai gộp? | Người dùng (với nhóm) | Mọi việc tiếp theo của gói; merge vào `main` | Phân tích riêng hai bản trước khi làm tiếp; không giao thêm task code cho tới khi chốt. |
| 2 | Cuộc thi có thật là **theo tháng** như bản dựng v2 (mỗi tháng một kỳ, lượt tính lại, kết quả/giải riêng) không? | Chủ quản | Contract API-01…05, schema `entry`, BE-27/28 | Hỏi chủ quản với 3 trích dẫn `v2›cuoc-thi-thang:248, 250, 301`. |
| 3 | Đề mỗi tháng: cùng 200 câu/8 chuyên đề, hay đề riêng theo "chuyên đề của tháng"? "Chuyên đề tháng" là lĩnh vực Thủ đoạn hay chuyên đề câu hỏi? | Chủ quản | QĐ-015, FE-26 (khóa CĐ1), API-05 | Hỏi kèm câu 2. |
| 4 | Lịch tháng lưu ở đâu (Umbraco hay CSDL) và việc BE nào làm (FE-32 đang không có việc BE)? | Người dùng | FE-32, FE-33, FE-05, FE-12, FE-20; QĐ-003 | Chốt sau câu 1–3; cần ghi QĐ mới thay hoặc bổ sung QĐ-003. |
| 5 | Giới hạn lượt "trong tháng": đếm lượt theo kỳ, thêm cột kỳ vào `entry`? Lượt đang dở khi sang tháng mới xử lý ra sao (gia hạn QĐ-014)? | Người dùng (sau câu 2) | API-01, 04, 05; migration | |
| 6 | Cách xét giải: theo hạng điểm (nhất/nhì/ba…) như v2 hay quay số ngẫu nhiên trên ngưỡng như BE-28? Theo tháng? | Chủ quản | BE-27, BE-28, FE-33 | Gộp với "Câu hỏi mở" #3. |
| 7 | Bảng đoạt giải có "xã, phường": có thu thêm trường này ở đăng ký (dữ liệu cá nhân) không? | Chủ quản | FE-25, `entry`, FE-33 | Nếu bỏ cột thì không đổi gì. |
| 8 | "Nhắc tôi khi có cuộc thi tháng sau" (thu thư điện tử) và "kết quả tháng trước" công khai: làm hay bỏ, ai làm? | Chủ quản / người dùng | FE-33, việc BE mới | |
| 9 | QĐ-016: với giải tiền mặt mỗi tháng và xếp theo điểm, có giữ QUIZ-02 trả đáp án không? | Chủ quản | QUIZ-02, API-03 | QĐ-016 tự yêu cầu xem lại khi giải lớn. |
| 10 | URL: trang Cuộc thi, Thử sức (`#thu-suc` hay trang riêng, 301?), Cuộc thi tháng, và luồng thi FE-25…29 ở URL nào (`/tham-gia/cuoc-thi` hiện có)? | Người dùng | FE-24, FE-33, BE-12, nút "Đăng ký dự thi" | |
| 11 | Lịch 8 tháng nhưng chỉ 6 lĩnh vực: 2 tháng `mxh`, `chinhsach` dẫn đi đâu? | Chủ quản (nội dung) | FE-12, FE-33 | |
| 12 | Luồng thi FE-25…29 đổi sang hệ v2 ngay (ai làm token v2 khi FE-01 của AnVD chưa làm) hay giữ giao diện v1 tới khi FE-01 xong? Ai duyệt giao diện khi không còn ảnh chuẩn? | Người dùng | F4b, F5, sửa F2 (màu hổ phách) | Làm tiếp logic F4b/F5 không chờ; phần màu đổi theo FE-01. |
| 13 | Mốc kiểm thử của luồng thi: 1440/744/390 (theo ảnh v2) thay cho 1440/1024/390? | Người dùng | Kịch bản kiểm chứng F-task, I | Thêm 744, giữ 1024. |
| 14 | Ai cập nhật cột "Trạng thái" và các chỗ chưa theo QĐ-013/014/015 trong `.xlsx` (bản v4)? Có cập nhật `.docx` không? | Người dùng | Không chặn | |
| 15 | Xác nhận "Umbraco 17" trong kế hoạch là sai, repo dùng 18.2.1. | Người dùng | Không chặn | |

## 7. Việc tiếp theo

- File này dành cho **người dùng / điều phối**, không có task cho Worker. Gói CUOC-THI nên **tiếp tục tạm dừng** ở các task đụng contract (F5, task tích hợp I, mọi sửa BE) cho tới khi có trả lời câu 1–5.
- Có thể làm tiếp mà không phụ thuộc câu trả lời: F4b (đồng hồ đọc, màn Xong chuyên đề, theo "Review F4a" trong `3-review-CUOC-THI-fe.md`), vì FE-27 không đổi luồng. Phần màu (hổ phách cho đáp án sai, nút `.btn-*`) để sau câu 12.
- Khi có trả lời: Orchestrator ghi QĐ mới (thay/bổ sung QĐ-003, 006, 008, 014, 015, 016 nếu cần) và cập nhật `1-thiet-ke.md` bằng mục mới có ngày.
- Các script so sánh (chỉ đọc) ở scratchpad của phiên này: `dump.py`, `kdiff.py`, `chk.py`, `docx_chk.py`.
