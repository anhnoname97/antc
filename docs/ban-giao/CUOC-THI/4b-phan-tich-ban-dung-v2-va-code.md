# CUOC-THI · Phân tích B: bản dựng v2 so với code đã làm

- Ngày: 2026-10-18 · Người viết: Orchestrator · Loại: phân tích chỉ đọc (không thiết kế lại, không sửa code)
- Phân tích A (kế hoạch mới so với kế hoạch cũ và các QĐ) nằm ở `4a-phan-tich-ke-hoach-moi.md`. File này chỉ dẫn kế hoạch mới khi cần để so với bản dựng.

## Nguồn và quy ước dẫn

| Ký hiệu | Là gì |
|---|---|
| `v2/<trang>.html:L` | Trang con tách từ bản dựng v2 (`docs/ban-dung/antoantaichinh-ban-dung-thu.html`, commit 05847bac) bằng `extract_v2.py`, ghi ở `C:\GTSC\DMST\agent-artifacts\phan-tich-v2\pages\`. Số dòng giữ nguyên trong bản đã bỏ ảnh nhúng (`...\strip\`) |
| `v1:L` | Bản dựng v1 `git show 3c035da:docs/ban-dung/antoantaichinh-ban-dung-thu.html`, ghi ở `...\phan-tich-v2\ban-dung-v1.html` |
| Ảnh `ct-*`, `ctt-*`, `gt-*` | `docs/ke-hoach/anh-v2/` (README dòng 82–121); ảnh `th-*`, `mb-*` ở `docs/ke-hoach/anh/` |
| Code nhánh chính | `feature/cuoc-thi`, đường dẫn tương đối từ `src/ANTC.Portal.App/` |
| Code luồng FE | `C:\GTSC\DMST\wt\CUOC-THI-fe\src\ANTC.Portal.App\` (viết tắt `wt-fe/`), HEAD `ceb8e9ad`. F4b còn 3 file sửa dở chưa commit (`thiPage.cshtml`, `contest.css`, `exam.js`, +221/−41 dòng): **không đọc kỹ, không đánh giá** |

Đã đọc đủ: 3 trang v2 (`cuoc-thi`, `cuoc-thi-thang`, `gioi-thieu` phần cuộc thi), luồng thi v1 (`v1:1192-1676`), code BE/FE liệt kê ở mục 3. Không xem từng ảnh PNG; dẫn tên ảnh theo README của `anh-v2`. Không đọc `.docx`.

---

## 1. Bản dựng v2: phần liên quan cuộc thi

### 1.1 Nguồn dữ liệu động `window.CT`

| Mục | Nội dung | Nguồn |
|---|---|---|
| Lịch | Mảng cứng 8 tháng `[tháng, khóa, tên chuyên đề]`: 2026-08 `goi` "Cuộc gọi, tin nhắn, giả mạo"; 09 `muaban` "Mua bán, đặt cọc"; 10 `vieclam` "Việc làm, làm thêm"; 11 `dautu` "Đầu tư, góp vốn"; 12 `vay` "Vay, nợ"; 2027-01 `hopdong` "Hợp đồng, dịch vụ"; 02 `mxh` "Mạng xã hội, tài khoản bị chiếm"; 03 `chinhsach` "Bảo hiểm, y tế, chính sách" | `v2/cuoc-thi.html:286` (giống hệt `v2/cuoc-thi-thang.html:327`, `v2/gioi-thieu.html:378`) |
| Tháng hiện tại | Theo **đồng hồ máy người xem**; không có tháng trùng thì lấy tháng kế tiếp; quá tháng cuối thì **giữ tháng cuối** | `v2/cuoc-thi.html:287` |
| Trường | `month` "tháng 10/2026", `topic`, `key`, `dates` "1/10 – 31/10/2026" (luôn **trọn tháng**, tính từ ngày cuối tháng) | `v2/cuoc-thi.html:288-289` |
| Gắn vào trang | Mọi phần tử `[data-ct=month|topic|dates]`; trang Cuộc thi tháng thêm `[data-ct-prev]` (tháng trước), số lớn ở hero, lịch 8 tháng | `v2/cuoc-thi.html:290`; `v2/cuoc-thi-thang.html:383-391` |

Không có trong `CT`: số câu (200), số lượt (2), giải thưởng, ngày giờ mở/đóng cụ thể, kết quả tháng trước. Các số này viết cứng trong HTML.

### 1.2 Từng khối

| Khối | Hiển thị | Dữ liệu động | Liên kết | Số liệu cứng | Ảnh |
|---|---|---|---|---|---|
| Thanh thông báo (mọi trang trừ Ứng phó) | "Cuộc thi tháng 10/2026 · Chuyên đề: … · 1/10 – 31/10/2026", nút "Tham gia ⟶", nút × (ẩn trong phiên, `sessionStorage ctbar`) | month, topic, dates | `v2-cuoc-thi.html` (trang Cuộc thi tháng) | — | `gt-01-hero`, `ctt-01-hero` |
| Thẻ ở hero Giới thiệu (`.ctcard`) | "Cuộc thi tháng …", "Chuyên đề: …", "… · 200 câu · có xét thưởng", nút "Xem cuộc thi ⟶" | month, topic, dates | trang Cuộc thi tháng | 200 câu | `gt-01-hero` · `v2/gioi-thieu.html:273` |
| `#cuoc-thi` · cột trái | "200 câu hỏi, 8 chuyên đề"; "Mỗi số điện thoại thi tối đa 2 lượt. Giai đoạn đầu có xét thưởng."; 3 số lớn 200 / 8 / 2 | — | — | 200, 8, 2 | `ct-02` · `v2/cuoc-thi.html:228-230` |
| `#cuoc-thi` · Thẻ dự thi | "THẺ DỰ THI · tháng …", "Chuyên đề: …", 3 dòng an toàn, nút "Xem cuộc thi tháng … ⟶" | month, topic | trang Cuộc thi tháng | — | `ct-02` · `:232-235` |
| `#thu-suc` Thử sức | Tiêu đề "Thử sức: 8 câu", "Mỗi chuyên đề một câu"; ghi chú "Bản dựng thử: 3 câu ví dụ…"; thẻ "Câu 1 / 3", 3 đáp án A–C, "✓ Chính xác." / "⚠ Chưa đúng."; màn kết quả "3/3", "Làm lại", thẻ mời "Thi thật · tháng …", "200 câu, chuyên đề … Có xét thưởng." | month, topic ở thẻ mời | thẻ mời → trang Cuộc thi tháng | 3 câu viết cứng trong JS, không lấy từ ngân hàng | `ct-03a..d` · `:241-250`, `:342-356` |
| `#cuoc-thi-thang` · Hero | Số lớn = tháng; "Chuyên đề: / <tên>"; nhãn: ngày, "200 câu hỏi", "Tối đa 2 lượt / số điện thoại", "Có xét thưởng"; nút "Đăng ký dự thi ⟶", "Ôn chuyên đề trước" | month, topic, dates | "Đăng ký dự thi" → `#dang-ky` **của chính trang này** (khối 4 bước, không có form); "Ôn chuyên đề" → Thủ đoạn `#linh-vuc` | 200, 2 | `ctt-01` · `v2/cuoc-thi-thang.html:225-232` |
| Dải "Cách nhận ra cuộc thi thật" | 5 dòng ✓ | — | — | — | `ctt-02` · `:239-240` |
| 4 bước (`id="dang-ky"`) | Đăng ký: "Nhập số điện thoại để nhận lượt thi. **Mỗi số tối đa 2 lượt trong tháng.**" · Ôn chuyên đề (không bắt buộc) · Làm bài: "**200 câu trong 8 chuyên đề, trọng tâm là chuyên đề của tháng. Lượt cao điểm hơn được tính.**" · Xem kết quả: "công bố trên trang này vào đầu tháng sau"; nút "Đăng ký dự thi" + "Bản dựng thử: nút chưa mở bài thi thật." | topic | nút lại trỏ `#dang-ky` (chính nó) | 2, 200, 8 | `ctt-03` · `:246-253` |
| Giải thưởng tháng này | Nhất 2.000.000 đ (1), Nhì 1.000.000 đ (2), Ba 500.000 đ (3), KK quà 200.000 đ (10) = 16 giải; "Nhận giải thế nào?" 3 bước, email `cuocthi@…`, nhận trực tiếp; cảnh báo không nộp phí | — | — | toàn bộ | `ctt-04` · `:259-266` |
| Lịch cả năm | 8 mốc, trạng thái Đã kết thúc (kèm "Xem kết quả") / ● Đang diễn ra / Sắp tới; thanh tiến độ | toàn bộ từ `CT.S` | "Xem kết quả" của **mọi** tháng đã qua → cùng một khối `#rs-title` | ghi chú "Lịch ví dụ…" | `ctt-05` · `:274-275`, `:383-391` |
| Kết quả tháng trước | "Kết quả cuộc thi tháng 9/2026", chuyên đề tháng trước; "chỉ hiện tên viết tắt và **xã, phường**", "12.486 lượt thi", "37 người đạt điểm tối đa"; bảng Giải / Người thi / Xã, phường (nhãn "Số liệu mẫu") | month, topic của tháng trước | — | số lượt, số người, bảng | `ctt-06` · `:281-290` |
| Thắc mắc thường gặp | 4 câu; "Tháng sau còn được thi tiếp không? — Có. Mỗi tháng có một cuộc thi mới với chuyên đề mới, **lượt thi tính lại từ đầu**." | — | — | — | `ctt-07`, `ctt-07b` · `:298-301` |
| Ô nhắc lịch | "Nhắc tôi khi có cuộc thi tháng sau", ô thư điện tử, "Bản dựng thử: chưa lưu đăng ký." | — | — | — | `ctt-07c` · `:303-304` |
| Phần tiếp theo | "Thủ đoạn: <chuyên đề> ⟶", nút "**Làm thử 3 câu**" | topic | Thủ đoạn `#linh-vuc`; `v2-tham-gia.html#thu-suc` | — | `ctt-08` · `:311-312` |

### 1.3 Điểm lạ, mâu thuẫn nội tại của v2

| # | Điểm | Nguồn |
|---|---|---|
| L1 | Thử sức: tiêu đề và nút hero "8 câu", "Mỗi chuyên đề một câu", nhưng chỉ có 3 câu viết cứng (3 đáp án, không phải câu của ngân hàng); trang Cuộc thi tháng lại ghi "Làm thử 3 câu" | `v2/cuoc-thi.html:220,241,342-344`; `v2/cuoc-thi-thang.html:312` |
| L2 | Nút "Đăng ký dự thi" (2 chỗ) trỏ `#dang-ky` là chính khối 4 bước; v2 không có form đăng ký, không có màn làm bài | `v2/cuoc-thi-thang.html:232,244,253`; README `anh-v2` dòng 13, 35 |
| L3 | Lượt: trang Cuộc thi "tối đa 2 lượt" (không nói kỳ) vs trang Cuộc thi tháng "2 lượt **trong tháng**", "lượt tính lại từ đầu" mỗi tháng | `v2/cuoc-thi.html:229`; `v2/cuoc-thi-thang.html:248,301` |
| L4 | "200 câu trong 8 chuyên đề, **trọng tâm là chuyên đề của tháng**": không rõ 200 câu là cố định cả 8 chuyên đề hay mỗi tháng một bộ nặng về chuyên đề tháng | `v2/cuoc-thi-thang.html:250` |
| L5 | 8 chuyên đề của **lịch tháng** khác 8 chuyên đề của **ngân hàng câu hỏi** (xem bảng dưới). "Mạng xã hội, tài khoản bị chiếm" và "Bảo hiểm, y tế, chính sách" không có trong ngân hàng; CĐ1 "nền tảng" và CĐ8 "Xử lý, phục hồi" không có trong lịch | `v2/cuoc-thi.html:286`; `v1:1310` (`bank`), seed `Data/Seed/quiz-bank.json` |
| L6 | Trang Thủ đoạn chỉ có 6 lĩnh vực (01–06); tháng 2/2027 và 3/2027 không có lĩnh vực để nút "Ôn chuyên đề trước" trỏ tới | `v2/thu-doan.html:257-262` |
| L7 | Thẻ Giới thiệu và trang Cuộc thi ghi "Giai đoạn đầu có xét thưởng"; trang Cuộc thi tháng ghi "Giải thưởng tháng này" và "Có xét thưởng" mỗi tháng | `v2/cuoc-thi.html:229`; `v2/cuoc-thi-thang.html:231,259` |
| L8 | Tháng hiện tại tính theo đồng hồ máy người xem; quá tháng 3/2027 thì tháng cuối hiện "Đang diễn ra" mãi | `v2/cuoc-thi.html:287` (kế hoạch FE-32 đổi sang ngày máy chủ: sheet "Công việc" r31) |
| L9 | Kết quả công bố kèm "xã, phường", nhưng mọi bản đăng ký (v1 và code) chỉ thu họ tên, số điện thoại, đơn vị không bắt buộc | `v2/cuoc-thi-thang.html:282-290`; `v1:1270-1272`; `thiPage.cshtml:90-92` |
| L10 | Giải xếp hạng Nhất/Nhì/Ba/KK, nhưng "37 người đạt điểm tối đa" ở tháng trước: cách chọn 16 người không được nói | `v2/cuoc-thi-thang.html:263-266,283` |
| L11 | Mọi tháng đã qua có "Xem kết quả" nhưng chỉ có kết quả của tháng liền trước | `v2/cuoc-thi-thang.html:390` |
| L12 | v2 **không nhắc** thi ẩn danh, "làm Chuyên đề 1 trước", đồng hồ đọc, nộp bài, điều kiện nộp | Grep `Chuyên đề 1|ẩn danh|giây|nộp bài` trên `v2/cuoc-thi*.html`: chỉ ra "Ẩn danh" của Góp ý (`v2/cuoc-thi.html:257,260`) |

Đối chiếu chuyên đề (L5):

| Lịch tháng v2 | Ngân hàng (v1 = seed hiện tại), số câu |
|---|---|
| — | CĐ1 Những điều nền tảng và cách quyết định cho chắc (19) |
| 2027-01 Hợp đồng, dịch vụ | CĐ2 Ký hợp đồng và cam kết dịch vụ (24) |
| 2026-11 Đầu tư, góp vốn | CĐ3 Đầu tư, góp vốn và tài sản (28) |
| 2026-12 Vay, nợ | CĐ4 Vay, cho vay và bảo lãnh (27) |
| 2026-10 Việc làm, làm thêm | CĐ5 Việc làm, tuyển dụng và nhiệm vụ trực tuyến (23) |
| 2026-09 Mua bán, đặt cọc | CĐ6 Mua bán, đặt cọc và dịch vụ tiêu dùng (23) |
| 2026-08 Cuộc gọi, tin nhắn, giả mạo | CĐ7 Cuộc gọi, tin nhắn, đường dẫn và giả mạo (28) |
| — | CĐ8 Xử lý, phục hồi và phòng lừa đảo lần hai (28) |
| 2027-02 Mạng xã hội, tài khoản bị chiếm | không có |
| 2027-03 Bảo hiểm, y tế, chính sách | không có |

---

## 2. Luồng thi: v1 so với v2

### 2.1 Màn hình

| Màn | v1 (bằng chứng) | v2 | Ảnh dùng được |
|---|---|---|---|
| Đăng ký: chọn "Dự thi có tên" / "Thi ẩn danh", form họ tên + số + đơn vị, khối đồng ý dữ liệu, ghi chú dưới 16 tuổi, lối "Chỉ muốn luyện tập" | `v1:1240-1307`, xử lý `:1650-1672` | **Mất** (không có màn). Chỉ còn khối 4 bước "Nhập số điện thoại để nhận lượt thi" | `th-01..03` (v1) |
| Danh sách chuyên đề `#ngan-hang`: hộp "Đã đăng ký… lượt thứ n trên 2" / "Đang thi ẩn danh", 8 hàng, CĐ2–8 khóa tới khi xong CĐ1 | `v1:1530-1545` | Mất | `th-04` |
| Giới thiệu chuyên đề `#chuyen-de-N`: đoạn dẫn, "Hiểu nhanh mấy từ", "Bắt đầu n câu" | `v1:1547-1554` | Mất | `th-05` |
| Câu hỏi: mã, loại, tình huống, đáp án, giải thích từng đáp án, "Hành động an toàn", **nút đi tiếp khóa `sec` giây** (mặc định 30) | `v1:1556-1580`, `:1623-1635` | Mất | `th-06..08`, `mb-07` |
| Xong chuyên đề: "Bạn trả lời đúng x trên n câu", "Bảy chuyên đề còn lại đã mở", "Làm lại chuyên đề" | `v1:1582-1589` | Mất | `th-09` |
| Cột bên: mã dự thi/mã ẩn danh, lượt thứ n / 2, "Dự thi có tên để xét giải", tiến độ "Đã xong x / 8 chuyên đề" | `v1:1591-1603` | Mất | `th-11` |
| Nộp bài, kết quả lượt thi | **v1 cũng không có** (kế hoạch FE-29 tự thêm) | Không có | Không có ảnh |
| Thử sức | Trang riêng `#/thi-thu`, 8 câu lấy từ ngân hàng (`v1:1092`, `:1406`) | Khối `#thu-suc` trong trang Cuộc thi, 3 câu ví dụ (L1) | `ct-03a..d` |
| Trang giới thiệu cuộc thi theo tháng | Không có (v1 chỉ có thẻ "Cuộc thi trực tuyến" ở trang Tham gia, `v1:866-872`) | **Mới**: `#cuoc-thi-thang`, thanh thông báo, thẻ ở hero | `ctt-*`, `gt-01` |

Kết luận: v2 **không thay** luồng thi mà bỏ trống nó; README `anh-v2` dòng 13 và kế hoạch FE-25 (sheet "Công việc" r21: "Bản dựng v2 chưa vẽ lại màn này… giữ nguyên luồng") giữ v1 làm mẫu luồng. Cái v2 đổi là **khung nghiệp vụ bao quanh** luồng (cuộc thi theo tháng).

### 2.2 Câu chữ về lượt, chuyên đề, thi nhiều lần

| Chủ đề | v1 | v2 | Code hiện tại |
|---|---|---|---|
| Số lượt | "Mỗi số điện thoại thi tối đa 02 lượt" (`v1:1246,1278`); "lượt thứ n trên 2" (`:1533`) | "tối đa 2 lượt / số điện thoại" (`v2/cuoc-thi.html:229-230`); "**trong tháng**" (`v2/cuoc-thi-thang.html:248`) | `thiPage.cshtml:47,95,98` đọc `maxAttempts`, không nói kỳ |
| Thi lại | "Lượt sau không xóa lượt trước; Ban Tổ chức lấy kết quả cao hơn" (`v1:1278`) | "Lượt cao điểm hơn được tính" (`:250`); "tháng sau… lượt thi tính lại từ đầu" (`:301`) | `thiPage.cshtml:98` giữ câu v1 |
| Phạm vi đề | "Tám chuyên đề, 200 câu… Làm Chuyên đề 1 trước, sau đó chuyên đề nào trước cũng được" (`v1:1227`) | "200 câu trong 8 chuyên đề, trọng tâm là chuyên đề của tháng" (`:250`); thẻ "Chuyên đề: <tháng>" | `thiPage.cshtml:34` giữ câu v1; `wt-fe/…/exam.js:137,147,162` khóa CĐ2–8 tới khi xong CĐ1 |
| Ẩn danh | "Không xét giải" (`v1:1253`); "Dự thi có tên để xét giải" (`:1597`) | Không nhắc | `thiPage.cshtml:67-86`, API-04/05 |
| Thời gian | "Thời gian diễn ra: […]" (`v1:1245`) | "1/10 – 31/10/2026" trọn tháng | `periodText` + `contestStart/End` = 2026-10-01 → 2026-12-31 (uSync `Content/cuộc-thi-trực-tuyến.config:17,20`) |

---

## 3. Code đã làm: giữ / sửa nhỏ / sửa lớn / bỏ nếu theo v2

Mức đánh giá giả định cách hiểu v2 là "mỗi tháng một cuộc thi riêng, lượt tính theo tháng". Chỗ nào phụ thuộc câu trả lời của chủ quản thì ghi hai mức theo **P1** (đề vẫn 200 câu cả 8 chuyên đề) và **P2** (đề mỗi tháng khác, theo chuyên đề tháng). Đây là **phân tích ảnh hưởng, chưa phải thiết kế**.

### 3.1 Mô hình dữ liệu và quy tắc

| Điểm | Code hiện tại (bằng chứng) | v2 | Mức |
|---|---|---|---|
| Kỳ thi | Một khoảng ngày duy nhất `contestStart`/`contestEnd` trên trang `thiPage` (`Contest/ContestSettingsService.cs:75-79,88-101`; uSync `ContentTypes/thipage.config:29-47`) | 8 kỳ theo tháng, mỗi kỳ một chuyên đề, ngày = trọn tháng (`v2/cuoc-thi.html:286-289`) | **Sửa lớn**: cần nguồn lịch tháng và khái niệm "kỳ đang mở". Kế hoạch FE-32 cũng đòi "một nguồn dữ liệu dùng chung" (sheet "Công việc" r31) nhưng chưa nói nằm ở đâu (xem 4a) |
| Lượt thuộc kỳ nào | `entry` không có cột kỳ/tháng (`Data/Entities.cs:8-34`); `draw` cũng không (`:62-74`) | Lượt, kết quả, giải thưởng tách theo tháng | **Sửa lớn (schema)**: thêm cột kỳ cho `entry` (và `draw`), migration. Đổi schema là quyết định phải hỏi |
| Đếm lượt tối đa | Đếm **mọi** lượt của số đó từ trước tới nay: `CountAsync(e => e.Phone == phone)` ở API-01 (`Contest/ContestEntryService.cs:98`), API-04 (`ContestAttemptService.cs:264`), API-05 (`:338`) | "2 lượt trong tháng", "tính lại từ đầu" (L3) | **Sửa nhỏ** về code (thêm điều kiện kỳ ở 3 chỗ) nhưng **phụ thuộc** cột kỳ ở trên. Không sửa thì từ tháng thứ hai người đã thi 2 lượt bị `ATTEMPT_LIMIT` vĩnh viễn |
| `maxAttempts` | Một số trên `thiPage`, mặc định 2 (`ContestSettings.cs:16,23`) | 2, viết cứng ở 4 chỗ | Giữ (cấu hình chung cho mọi tháng), trừ khi mỗi tháng khác nhau |
| Ngân hàng | 200 câu, 8 chuyên đề cố định, một bản chụp (`QuestionBank.cs:42,52-53`); seed như v1 | Lịch tháng có 2 chuyên đề không có câu (L5) | P1: **giữ**. P2: **sửa lớn** (bản chụp theo kỳ hoặc gắn câu với kỳ; thêm nội dung câu hỏi cho 2 chuyên đề mới, việc nội dung không phải code) |
| Điều kiện nộp "đủ mọi câu" (QĐ-015) | `covered < total` → `409 INCOMPLETE_ANSWERS` (`ContestAttemptService.cs:319-323`) | v2 không nói; "200 câu" được nhắc nhiều nơi | P1: vẫn hợp (200 câu). P2: "đủ câu" phải tính theo đề của kỳ, không theo cả ngân hàng |
| Cửa sổ thời gian (QĐ-014) | API-03/04 theo `GetStatus`, API-05 tới `contestEnd + submitGraceHours` (`ContestSettingsService.cs:88-108`) | Kỳ kết thúc cuối mỗi tháng | **Sửa vừa**: `GetStatus`/`IsSubmitOpen` tính theo kỳ của lượt; lượt tháng trước còn dở sang tháng mới xử lý ra sao chưa có quy tắc |
| Xếp giải | Bảng `draw`/`draw_winner` (quay số, `MinScore`, `Rank`) (`Entities.cs:62-88`) | Giải hạng Nhất/Nhì/Ba/KK theo tháng, công bố tên viết tắt + xã/phường (L9, L10) | Ngoài gói CUOC-THI (BE-27/quay số), nhưng thiếu dữ liệu xã/phường ảnh hưởng **form đăng ký** |
| Thông tin đăng ký | Họ tên, số, đơn vị, đồng ý (`thiPage.cshtml:88-118`, `ContestEntryService.cs:136-173`) | Kết quả cần xã/phường | Có thể phải thêm trường (chờ hỏi; dính dữ liệu cá nhân) |

### 3.2 Từng thành phần

| Thành phần | Luồng | Hiện trạng | Theo v2 | Lý do |
|---|---|---|---|---|
| `IContestSettings`, `ContestSettings`, `ContestSettingsService` | chính | Đọc 1 khoảng ngày, `maxAttempts`, `submitGraceHours` | **Sửa lớn** | Thêm lịch tháng, kỳ đang mở, hạn nộp theo kỳ; dùng chung với thanh thông báo/thẻ (FE-32) |
| `ContestConfigCheck` | chính | Kiểm cấu hình lúc khởi động (35 dòng) | Sửa nhỏ | Kiểm thêm lịch tháng |
| API-01 `ContestEntryService.CreateAsync` | chính | Tạo lượt, đếm lượt theo số (`:82-127`) | **Sửa nhỏ–vừa** | Gắn kỳ cho lượt, đếm lượt trong kỳ; câu báo `ATTEMPT_LIMIT` thêm "trong tháng" |
| API-02 `GetStateAsync` | chính | Trả tiến độ, `total`, `answers` có `cd` (QĐ-013) | **Giữ** (P1) / sửa nhỏ | Có thể cần trả kỳ của lượt để FE biết lượt cũ thuộc tháng trước |
| API-03 `SaveAnswerAsync` | chính | Lần ghi đầu thắng, `403` ngoài giờ | Giữ (P1) / **sửa vừa** (P2) | P1 chỉ đổi nguồn "đang mở". P2 phải từ chối câu ngoài đề của kỳ |
| API-04 `AttachContactAsync` | chính | Gắn thông tin, đếm lượt (`:228-286`) | Sửa nhỏ | Đếm lượt trong kỳ; giữ hay bỏ tùy câu hỏi về ẩn danh (Q6) |
| API-05 `SubmitAsync` | chính | Đủ câu, gia hạn, kèm contact (`:288-361`) | Sửa nhỏ (P1) / **sửa vừa** (P2) | Hạn nộp theo kỳ; "đủ câu" theo đề của kỳ nếu P2 |
| `ContestController` | chính | 5 action, bảng mã lỗi | **Giữ** | Route, mã lỗi không đổi; chỉ thêm mã nếu có quy tắc mới |
| Bảng `entry`, `entry_answer` | chính | Đủ cho một kỳ | **Sửa** (thêm cột kỳ, chỉ mục số + kỳ) | Xem 3.1. `entry_answer` giữ nguyên |
| `thiPage.cshtml` (FE-25, đăng ký) | chính + fe | Hero và câu chữ v1; giao diện v1 (`tokens.css:5,36`: `--c-brand #5C0F0B`, Manrope) | **Sửa vừa** | Câu chữ "trong tháng", chuyên đề tháng, hero dùng chung v2 (FE-08); đổi giao diện theo FE-01 v2 (kế hoạch FE-25 r21). Bỏ khối ẩn danh nếu Q6 trả lời "bỏ" |
| `register.js`, `phone.js` | chính + fe | Đăng ký gọi API-01 | Giữ / sửa nhỏ | Logic giữ; câu báo lỗi lượt |
| F1 `contest-api.js`, `contest-store.js` (FE-28) | fe | 5 hàm, mock, hàng đợi, khôi phục tiến độ | **Giữ** / sửa nhỏ | Không phụ thuộc tháng; cần xử lý `at_entry` của tháng trước (lượt cũ) khi sang tháng mới |
| F2 `quiz-ui.js`, `quiz.css` (FE-23) | fe | Theo v1 (`tt-01..03`, "Đúng./Chưa đúng.") | JS giữ; **CSS sửa vừa** | v2 Thử sức dùng kiểu khác (nút `.qo`, "✓ Chính xác." / "⚠ Chưa đúng.", `v2/cuoc-thi.html:348-351`); ảnh `ct-03a..d` thay `tt-*`. Màu đi qua `tokens.css` nên phần lớn đổi theo FE-01 |
| F3 `exam.js` danh sách/giới thiệu/cột bên (FE-26) | fe | Khóa CĐ2–8 tới khi xong CĐ1, câu chữ v1 (`exam.js:137,147,162`) | Giữ (P1) / **sửa lớn** (P2) | P1: thêm chuyên đề tháng vào câu chữ, có thể đánh dấu chuyên đề tháng. P2: danh sách dựng theo đề của kỳ; quy tắc "CĐ1 trước" có thể không còn (Q5) |
| F4a màn câu hỏi, đồng hồ đọc (FE-27) | fe | Đã commit `3bf7dae4` | **Giữ** | v2 không có màn; kế hoạch giữ luồng v1 |
| F4b xong chuyên đề, làm lại | fe | Sửa dở, chưa commit | Chưa đánh giá | Chờ Worker bàn giao |
| F5 nộp bài, kết quả (FE-29) | fe | Chưa làm | Làm theo QĐ-015 nếu P1 | Kết quả lượt cần nói rõ thuộc tháng nào; "Lượt cao điểm hơn được tính" |
| `contest.css` | fe | Theo v1 qua token | **Sửa vừa** | Đổi hệ thiết kế v2 (FE-01) |
| Thử sức `thiThuPage` + QUIZ-03 + `quiz-sample.json` (8 câu) | chính | 8 câu từ ngân hàng | Giữ dữ liệu; vị trí đổi | v2 chuyển thành khối trong trang Cuộc thi (kế hoạch FE-24 r20 còn hỏi 301). 3 câu của v2 chỉ là ví dụ (L1) |

### 3.3 Ngoài code đã làm nhưng v2 cần (để ước lượng không bỏ sót; không thiết kế ở đây)

| Việc | Nguồn v2 | Ghi chú |
|---|---|---|
| Nguồn lịch tháng dùng chung + thanh thông báo + thẻ ở hero/trang Cuộc thi | `v2/*:286` | FE-32 (sheet "Công việc" r31); chưa có việc BE/Umbraco tương ứng (xem 4a) |
| Trang Cuộc thi tháng | `v2/cuoc-thi-thang.html` | FE-33 (r32); sheet "URL" chưa có URL trang này (r9–r11) |
| Kết quả tháng trước, danh sách đoạt giải | `:281-290` | Cần dữ liệu thật theo kỳ (số lượt, số người điểm tối đa, người đoạt giải) |
| Đăng ký nhắc lịch bằng thư điện tử | `:303-304` | Dữ liệu cá nhân mới (email), chưa có bảng/API |

---

## 4. Ước lượng thô công làm lại

**Đây là ước lượng thô của Orchestrator (ngày công, 1 người), chưa qua thiết kế.** Không gồm FE-01 (đổi hệ thiết kế), FE-08, FE-32, FE-33, nội dung câu hỏi mới, quay số/BE-27.

| Thành phần | P1 (200 câu cố định, lượt theo tháng) | P2 (đề theo chuyên đề tháng) | Rủi ro |
|---|---|---|---|
| Nguồn lịch tháng + `ContestSettings` theo kỳ | 1–1,5 | 1–1,5 | Chưa chốt nơi cấu hình (Umbraco Block List / document type mới); dính FE-32 của người khác |
| Schema: cột kỳ ở `entry` (+ `draw`), migration, chỉ mục | 0,5 | 0,5 | Đổi schema cần QĐ; dữ liệu thử local phải tạo lại |
| API-01/04/05 đếm lượt theo kỳ, hạn nộp theo kỳ | 0,5–1 | 0,5–1 | Lượt dở dang qua tháng mới |
| API-02/03/05 theo đề của kỳ, "đủ câu" theo kỳ, ngân hàng theo kỳ | 0 | 2–3 | `IQuestionBank` đang là một bản chụp; ETag QUIZ-01..03; thiếu câu cho 2 chuyên đề |
| FE đăng ký `thiPage` + `register.js`: câu chữ tháng, (bỏ ẩn danh?) | 0,5 | 0,5 | Q6 |
| FE `exam.js` danh sách/cột bên/kết quả theo kỳ | 0,5 | 1,5–2 | Quy tắc "CĐ1 trước" (Q5); F4b đang dở |
| FE-28 xử lý lượt tháng trước | 0,25–0,5 | 0,25–0,5 | |
| Đổi giao diện `contest.css`, `quiz.css` sang v2 (sau FE-01) | 1–1,5 | 1–1,5 | Không có ảnh v2 cho luồng thi: chủ quản phải duyệt giao diện tự dựng |
| Kiểm chứng lại (kịch bản I + đổi tháng) | 0,5 | 1 | Phải giả lập ngày (đổi lịch trong backoffice) |
| **Tổng** | **≈ 5–6,5** | **≈ 8,5–11,5** | |

Rủi ro chung:

- Làm tiếp F4b/F5 trước khi chốt mô hình tháng thì phần câu chữ, cột bên và kết quả sẽ phải sửa lại; phần logic làm bài (F1, F2 JS, F4a) gần như không phụ thuộc.
- QĐ-016 (QUIZ-02 trả sẵn đáp án) + giải xếp hạng tiền mặt mỗi tháng (L10) làm rủi ro công bằng lớn hơn lúc chấp nhận QĐ-016; nhiều người dễ cùng đạt điểm tối đa.
- Lịch v2 dùng giờ máy người xem (L8); máy chủ phải là nguồn duy nhất, nếu không thanh thông báo và API lệch nhau ở ngày đầu/cuối tháng.
- Ngày mẫu trong uSync hiện là 1/10–31/12/2026 (QĐ-008), không khớp kỳ tháng.

---

## Cần người dùng / chủ quản xác nhận

| # | Câu hỏi | Vì sao cần | Nguồn |
|---|---|---|---|
| Q1 | Cuộc thi chuyển hẳn sang **mỗi tháng một kỳ riêng** (lượt, điểm, giải, kết quả tách theo tháng) thay cho một khoảng ngày duy nhất? | Quyết định schema (`entry` thêm kỳ) và `IContestSettings` | `v2/cuoc-thi-thang.html:248,259,281,301`; `ContestSettingsService.cs:75-101` |
| Q2 | "Tối đa 2 lượt" tính **trong mỗi tháng** (tháng sau tính lại) hay cả chương trình? | 3 chỗ đếm lượt hiện đếm toàn bộ | L3; `ContestEntryService.cs:98`, `ContestAttemptService.cs:264,338` |
| Q3 | Đề mỗi tháng là **200 câu cả 8 chuyên đề như nhau (P1)** hay đề riêng theo chuyên đề tháng (P2)? "Trọng tâm là chuyên đề của tháng" nghĩa là gì? | Chênh ≈ 3,5–5 ngày công; quyết định ngân hàng, QĐ-015 | L4 |
| Q4 | 8 chuyên đề của lịch tháng có thay 8 chuyên đề của ngân hàng không? Ai soạn câu cho "Mạng xã hội, tài khoản bị chiếm" và "Bảo hiểm, y tế, chính sách"? Lịch 8 tháng là lịch thật hay ví dụ? | Nội dung + mã chuyên đề `cd` trong API | L5, L6; `v2/cuoc-thi-thang.html:275` "Lịch ví dụ" |
| Q5 | Còn giữ quy tắc "làm Chuyên đề 1 trước, rồi tự chọn" không? | v2 không nhắc; `exam.js` đang khóa | L12; `wt-fe/…/exam.js:147,162` |
| Q6 | Còn giữ **thi ẩn danh** (và API-04 "Dự thi có tên để xét giải") không? v2 chỉ nói "Nhập số điện thoại để nhận lượt thi" | Có thể bỏ một màn, một API | `v2/cuoc-thi-thang.html:248`; `thiPage.cshtml:67-86` |
| Q7 | QĐ-015 (phải trả lời đủ mọi câu mới nộp) còn áp dụng nguyên cho từng tháng? | Ổn với P1; phải định nghĩa lại với P2 | `ContestAttemptService.cs:319-323` |
| Q8 | Lượt đang làm dở khi hết tháng: nộp trong thời gian gia hạn (QĐ-014) rồi đóng, hay cho làm tiếp sang tháng sau? Mở trang tháng mới với `at_entry` của tháng cũ thì hiện gì? | Quy tắc thời gian theo kỳ | `ContestSettingsService.cs:103-108` |
| Q9 | Ngày mở/đóng mỗi tháng luôn là trọn tháng (1 → ngày cuối, giờ VN) hay cấu hình riêng từng tháng? | Cấu hình lịch | `v2/cuoc-thi.html:288-289` |
| Q10 | Chọn người đoạt giải thế nào khi nhiều người cùng điểm tối đa (xếp hạng hay quay số)? Có xem lại QĐ-016 khi giải là tiền mặt mỗi tháng không? | Ảnh hưởng BE-27 và tính công bằng | L10; QĐ-016 |
| Q11 | Công bố kết quả có "xã, phường" thì form đăng ký có thu thêm xã/phường không? (dữ liệu cá nhân mới, sửa khối đồng ý) | Đổi API-01/04, schema, câu đồng ý | L9 |
| Q12 | Ô "Nhắc tôi khi có cuộc thi tháng sau" có làm không, giai đoạn nào? | Bảng/API mới, gửi thư | `v2/cuoc-thi-thang.html:303-304` |
| Q13 | Nút "Đăng ký dự thi" ở trang Cuộc thi tháng dẫn tới `/tham-gia/cuoc-thi#dang-ky`? URL trang Cuộc thi tháng là gì? | v2 trỏ về chính nó; sheet "URL" chưa có | L2; kế hoạch FE-33 r32 ("tới luồng thi FE-25"); "URL" r9–r11 |
| Q14 | Thử sức: 8 câu (như kế hoạch và `quiz-sample.json`) hay 3 câu như bản dựng? | Câu chữ "8 câu"/"3 câu" lệch nhau | L1 |
| Q15 | "Giai đoạn đầu có xét thưởng" hay "mỗi tháng có giải"? | Câu chữ trang Cuộc thi, thẻ hero | L7 |
| Q16 | Có cần ảnh/bản dựng v2 cho luồng đăng ký–làm bài–nộp–kết quả trước khi đổi giao diện, hay Worker tự dựng theo hệ v2 rồi chủ quản duyệt? | Không có mẫu v2 cho các màn này | README `anh-v2` dòng 13; kế hoạch FE-25 r21 |

Gợi ý thứ tự hỏi: Q1–Q3 trước (quyết định schema và chênh công lớn nhất), rồi Q6, Q5, Q8. Các câu còn lại không chặn việc làm logic làm bài.
