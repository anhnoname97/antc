# Gói BAN-CHINH-THUC: portal-v2 theo bản chính thức 10/11/2026

Thiết kế Đợt 0 và Đợt 1. Đợt 2 chỉ liệt kê, thiết kế sau. Người viết: phiên điều phối (anhnn) · 2026-11-10.

## Mục tiêu và phạm vi

Đưa portal-v2 (Umbraco) về đúng bản chính thức `docs/portal-final/` (QĐ-057), chia việc để ba dev đang làm song song không sửa cùng một file.

- **Đợt 0**: chuẩn bị mẫu so sánh (ảnh, bảng đối chiếu màn hình).
- **Đợt 1**: sửa nhỏ, không đổi mô hình dữ liệu, trừ việc thêm hai trường ở Cài đặt website (BC-01):
  - gỡ dấu vết bản dựng thử;
  - đổi tên mục: KHẨN CẤP, CÔNG CỤ KIỂM TRA, RỦI RO, CẢNH BÁO; dùng "kiểm tra" thay cho "checklist";
  - bỏ các nhãn của cảnh báo mẫu;
  - đổi đường dẫn;
  - gửi câu hỏi Hỏi – Đáp bằng `mailto` (QĐ-058);
  - sửa nội dung trong backoffice (QĐ-062).
- **Không làm ở Đợt 1:**
  - công cụ chọn tình huống (2a);
  - Kiến thức nền tảng (2b);
  - ngân hàng câu hỏi doanh nghiệp (2c);
  - các trang thông tin, chính sách và trang Góp ý (2d; hiện là document type rỗng, xem phần Đối chiếu);
  - xóa hẳn phần tài trợ khỏi document type (2e);
  - 135 bài thủ đoạn: Đợt 2b nhập lại nguyên bộ 157 bài.
- Cuộc thi giữ hệ thống hiện có (QĐ-061); Đợt 1 không đụng.

## Nguồn đã dùng

- `docs/portal-final/README.md` › "Ba việc người quản trị cần làm", "Bản chính thức: những gì đã đổi", "Đường dẫn mới".
- `docs/portal-final/nguon/src/app.js`: bảng `NAV`, `RTABS`, hàm `resolve`, `canon`. `shell.html`: dải trên cùng, chân trang. `tools/build.py`: các chỗ vá.
- So với bản v2 cũ: `docs/ban-dung-v2/antoantaichinh-nguon/build/`.
- `docs/quyet-dinh.md`: QĐ-050 (đã thay), QĐ-056 (thay một phần), QĐ-057 → QĐ-062.
- `docs/ban-giao/PORTAL-V2/1-thiet-ke.md`: V2-09a, V2-13j (chưa làm).
- Code `portal-v2` tại `1901b19d` (dẫn file:dòng trong bảng Đối chiếu).
- Chưa đọc: chưa so từng màn hình bằng ảnh (việc của BC-00); chưa đọc lại sheet "Câu hỏi mở" của `Ke-hoach-...-v3.xlsx` vì bản chính thức thay thế phần giao diện.

## Hành vi và acceptance criteria (chung cho Đợt 1)

1. Không còn chữ "BẢN DỰNG THỬ", "chưa phải website đang hoạt động", "Đơn vị tài trợ", "Công ty ABC", "Thiên Lộc", "Bản dự thảo", `[Tên` trên mọi trang công khai. Không còn `<meta name="robots" content="noindex` trên các trang thường; trang tìm kiếm và trang 404 vẫn giữ.
2. Chân trang có câu: "Ảnh minh họa trên website được tạo bằng trí tuệ nhân tạo (AI), không phải ảnh chụp người thật, việc thật."
3. Menu: KHẨN CẤP, CÔNG CỤ KIỂM TRA, RỦI RO. Nhóm đầu của Rủi ro là **CẢNH BÁO**.
4. Chữ hiển thị dùng "kiểm tra" thay cho "checklist" và "bảng kiểm". Tên từng mục theo bản chính thức ("Kiểm tra: …", "Kiểm tra bỏ túi"); bảng chữ cụ thể lấy từ BC-00.
5. Trang cảnh báo không còn:
   - "Dựa trên cảnh báo của …";
   - "Cần kiểm chứng · Chưa có kết luận";
   - "Mẫu trình bày…";
   - khối "Nguồn cảnh báo".
6. Đường dẫn mới: `/cong-cu-kiem-tra/…` và `/cac-rui-ro/canh-bao/…`. Đường dẫn cũ `/hay-tu-kiem-tra/…`, `/cac-rui-ro/canh-bao-moi/…` chuyển hướng 301 sang đường dẫn mới (chờ xác nhận, mục X2).
7. Gửi câu hỏi ở Hỏi – Đáp:
   - có hộp thư nhận thì mở ứng dụng thư của người gửi (`mailto:`), điền sẵn tiêu đề và nội dung;
   - chưa có hộp thư thì không hiện biểu mẫu mà hiện "nơi nhận sẽ được công bố tại trang này";
   - không bao giờ báo "đã gửi".
8. Trang Liên hệ không còn khối "Đường dây nóng của tổ chức tín dụng"; Khẩn cấp không còn nhóm số của tổ chức tín dụng.
9. `dotnet build` không lỗi; `dotnet test` (project `Umbraco.Plugin.Custom.Tests`) đạt; `run-local -Reset` khởi động không lỗi.
10. Bề rộng 390, 1024, 1440px không có thanh cuộn ngang.

## Trường hợp biên

- **Hộp thư nhận:**
  - rỗng hoặc sai định dạng: coi như chưa có;
  - nội dung `mailto` dài: cắt tiêu đề và nội dung theo giới hạn của trình duyệt, khoảng 1.800 ký tự cho cả đường dẫn, và báo người gửi nếu bị cắt;
  - ký tự tiếng Việt và xuống dòng phải mã hóa bằng `encodeURIComponent`.
- **Đường dẫn cũ:** có chuỗi truy vấn (`?…`) thì giữ khi chuyển hướng (mẫu đã có ở `AntcPublicRouting.cs:111-160`). Ở chế độ xem trước (preview) không chuyển hướng.
- **Cài đặt bị tắt:** tắt `showPreviewBanner` nhưng vẫn bật nút Chữ lớn thì dải trên cùng chỉ còn nút (`_SiteHeader.cshtml:19-33` đã xử lý). Tắt cả hai thì không hiện dải.
- **CSDL mới (`-Reset`):** nội dung lấy từ uSync phải đã mang giá trị mới. Vì vậy BC-09 phải commit file uSync và kiểm bằng `-Reset`.

## Đối chiếu

| Điểm | Loại | Nguồn / bằng chứng | Ghi chú |
|---|---|---|---|
| Dải "BẢN DỰNG THỬ" do cài đặt điều khiển | Code hiện có | `_SiteHeader.cshtml:23-26`, thuộc tính `showPreviewBanner` của `antc` | Tắt trong backoffice là đủ, không sửa code |
| `noindex` gắn với dải bản dựng thử | Code hiện có | `_SiteLayout.cshtml:25` | Tắt `showPreviewBanner` thì `noindex` tự mất |
| Đơn vị vận hành, tài trợ ở chân trang do cài đặt điều khiển | Code hiện có | `_SiteFooter.cshtml:16-26, 93-103`; thuộc tính `footerOperatorText`, `sponsorShow`… | Đợt 1 tắt bằng nội dung; xóa document type ở 2e |
| Câu "Ảnh minh họa … AI" | Tài liệu ghi | `portal-final/nguon/src/shell.html` (`<p class="fai">`) | Chưa có trường; thêm `footerImageNote` (BC-01) |
| Tên menu là nội dung (block list `menu`) | Code hiện có | `_SiteNavigation.cshtml:8-12` | Đổi trong backoffice (BC-09) |
| Đường dẫn cố định viết trong code | Code hiện có | `AntcPublicPaths.cs:9-24` (`FixedPaths`, `AlertListPath`), `:58-67` (các đường dẫn con của Tự kiểm tra) | **Không đổi được bằng backoffice**; phải sửa code (BC-06) |
| Chuyển hướng 301 cho đường dẫn cũ đã có mẫu | Code hiện có | `AntcPublicRouting.cs:111-160` | Dùng lại mẫu này |
| `hay-tu-kiem-tra` còn viết cứng ở chỗ khác | Code hiện có | `SelfCheckSeo.cs:77`, `SelfCheckSitemapController.cs:16`, `BaiDocChuyenDe.cshtml:14,17`, `DanhSachKiemTra.cshtml:23`, `KhiNghiBiLua.cshtml`, `_SelfCheckCountTool.cshtml` | Gom hết vào BC-05 và BC-06 |
| Test giữ đường dẫn cũ | Code hiện có | `AntcPublicPathsTests.cs:29-34` | Sửa cùng BC-06 |
| `RiskStructure` có mã `"canh-bao-moi"` | Code hiện có | `RiskStructure.cs:11` | Đây là MockupId dùng để sinh khóa nút, **không phải đường dẫn: không đổi** |
| Nhãn cảnh báo mẫu viết cứng | Code hiện có | `CanhBao.cshtml:11,54,58,88,109,171`; `CanhBaoMoi.cshtml:54`; `RiskAlertContent.cs:42` (`SampleNote`) | Gỡ ở BC-03 |
| Hỏi – Đáp đang gửi qua API | Code hiện có | `qa-submission.js:57`, `qa-portal.js:94` (`POST /api/v1/questions`) | QĐ-058: chuyển sang `mailto` |
| Hệ quả của QĐ-058 | Đề xuất của Claude | Section Hỏi – Đáp trong backoffice (`QuestionInbox`, `quanTriHoiDap`) | Không còn câu hỏi gửi từ web vào; chờ xác nhận, mục X3 |
| Khối đường dây nóng tổ chức tín dụng | Tài liệu ghi / code | README › "Trang Liên hệ bỏ … khối đường dây nóng của tổ chức tín dụng"; `LienHe.cshtml:70`; `ungPhoPage.cshtml:99` (`bankHotlines`) | Liên hệ gỡ trong view (BC-08); Khẩn cấp để trống `bankHotlines` (BC-09) |
| Trang thông tin, chính sách, Góp ý | Code hiện có | `ContentTypes/vewebsitepage.config`, `gopypage.config`, `baovedulieucanhanpage.config`…: **không có thuộc tính, không có template** (AnVu29, 8b6d63bc). Thiết kế V2-09a và V2-13j muốn `infoPage`, `policyPage` | Liên kết chân trang tới các trang này trả 404. Chuyển sang Đợt 2d, cần thiết kế |
| Nội dung chính sách nằm ở bài `article` | Code hiện có | `Content/chính-sách-*.config` (loại `article`, dưới Quản lý nội dung › Chính sách); đường dẫn `/chinh-sach/<slug>/` (`AntcPublicPaths.GetPath`) | BC-09 sửa nội dung ở đây |
| Tên các mục kiểm tra | Tài liệu ghi | `app.js`: "Kiểm tra: …", "Kiểm tra bỏ túi"; không còn "Danh sách kiểm tra" | QĐ-050 dùng "Danh sách kiểm tra"; nay thay theo QĐ-057 |
| Trang "Các rủi ro" chưa xuất bản trong uSync | Code hiện có | `Content/các-rủi-ro.config`: `Published="false"` | Xuất bản ở BC-09 |

## Phương án và khuyến nghị

**Câu "Ảnh minh họa…" ở chân trang:**
- (A) thêm trường `footerImageNote`;
- (B) dùng lại `footerOperatorText` và đổi nhãn.

Khuyến nghị **A**. Tên trường đúng nghĩa; còn `footerOperatorText` sẽ bị xóa cùng phần vận hành và tài trợ ở 2e.

**Hộp thư nhận:** thêm `feedbackEmail` ở Cài đặt website. Dùng chung cho Hỏi – Đáp bây giờ và trang Góp ý ở 2d.

## Người giữ file

Trong một đợt, mỗi file chỉ một người sửa. Muốn sửa file người khác đang giữ thì báo trước và đợi họ gộp xong.

| Người | Task Đợt 1 | File giữ trong Đợt 1 |
|---|---|---|
| **Người giữ nội dung** (chờ chỉ định, X1) | BC-01, BC-09a → e | `uSync/v18/ContentTypes/antc.config`, mọi file `uSync/v18/Content/*.config` |
| **Andrew Thompson (hieuhv)** | BC-02, BC-03 | `_SiteFooter.cshtml`, `footer.css`, `CanhBao.cshtml`, `CanhBaoMoi.cshtml`, `_RiskAlertCard.cshtml`, `Models/RiskAlertContent.cs`, `risk-alerts.css`, `App_Plugins/AntcRisks/risk-editor.js` |
| **AnVu29** | BC-05, BC-06 | `CongCu`, `DanhSachKiemTra`, `BaiDocChuyenDe`, `KhiNghiBiLua`, `TruocKhiChuyenTien`, `TruocKhiDauTuVay` (`.cshtml`), `Partials/_SelfCheck*`, `assets/js/self-check-*`, `App_Plugins/AntcSelfCheck`, `Content/AntcPublicPaths.cs`, `Content/AntcPublicRouting.cs`, `Rendering/SelfCheckSeo.cs`, `Controllers/SelfCheckSitemapController.cs`, `Tests/AntcPublicPathsTests.cs` |
| **MinhNB** | BC-04, BC-07, BC-08 | `BaiHuongDanRuiRo`, `BaiVietRuiRo`, `NhomRuiRo`, `hoiDapPage`, `LienHe` (`.cshtml`), `Partials/blockgrid/Components/qa*.cshtml`, `assets/js/qa-*.js`, `contact-v2.js` |
| Không ai sửa trong Đợt 1 | | `_SiteLayout.cshtml`, `_SiteHeader.cshtml`, `tokens.css`, `home.cshtml`, `ungPhoPage.cshtml`, `CustomCoreComposer.cs` (để dành cho Đợt 2) |

Quy tắc commit (QĐ-062): chỉ `git add` đúng file của task; không commit view bị Umbraco thêm BOM hoặc làm mất dòng trống cuối, không commit file uSync tự xuất lại. Trước khi đẩy lên, chạy `git diff --stat`.

## Task

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| BC-00 | Mẫu so sánh (Orchestrator) | chính | Chụp bản chính thức (`docs/portal-final/index.html`) ở 390 và 1280px, các đường dẫn: trang chủ, khan-cap, cong-cu-kiem-tra, cong-cu-kiem-tra.kiem-tra-1, cac-rui-ro.canh-bao, một cảnh báo, hoi-dap, lien-he, ve-website, chính sách. Bảng chữ cũ và chữ mới theo từng màn → `2-doi-chieu.md` | — | Đủ ảnh và bảng chữ cho BC-02 → BC-09 | Mở ảnh; bảng có nguồn từng dòng | Làm được |
| BC-01 | Cài đặt website: 2 trường mới | chính | Trong backoffice, document type `antc`: thêm `feedbackEmail` (Textstring, "Hộp thư nhận góp ý và câu hỏi") và `footerImageNote` (Textarea, "Ghi chú ảnh minh họa"), cùng tab Chân trang. Chỉ commit `ContentTypes/antc.config` | X1 | Hai trường hiện trong backoffice; `-Reset` vẫn khởi động được | `run-local -Reset`; xem Cài đặt website | Chờ X1 |
| BC-02 | Chân trang: câu ảnh AI | chính | `_SiteFooter.cshtml`: hiện `footerImageNote` (nếu có) ở chỗ dòng đơn vị vận hành; `footer.css`. Không xóa phần vận hành, tài trợ | BC-01 | Có câu khi điền; không có khi để trống; vận hành và tài trợ vẫn theo công tắc | Điền thử, xem `/` ở 390 và 1440px | Làm được sau BC-01 |
| BC-03 | Cảnh báo: gỡ nhãn mẫu | chính | `CanhBao.cshtml:11` ("Cảnh báo mới" → "CẢNH BÁO"), `:54`, `:58`, `:88`, `:109` (gỡ khối), `:171` ("Tôi đang gặp chuyện gì? Trả lời 3 câu" → "Chuyện gì đây???"); `CanhBaoMoi.cshtml:54`; bỏ `RiskAlertContent.SampleNote`; sửa chữ ở `risk-editor.js:158`. Không đổi đường dẫn (thuộc BC-06) | — | AC 5 đạt; không còn tham chiếu `SampleNote`, `agency` trên trang công khai | `dotnet build`; mở danh sách cảnh báo và một cảnh báo; `curl` rồi `grep` các chuỗi đã gỡ | Làm được |
| BC-04 | Rủi ro: "checklist" → "kiểm tra" | chính | `BaiHuongDanRuiRo.cshtml:197,218` ("Tự kiểm tra bằng checklist", "Checklist: …"); rà `BaiVietRuiRo`, `NhomRuiRo` | BC-00 (bảng chữ) | Không còn "checklist" hiển thị ở các trang Rủi ro | `curl` các trang Rủi ro rồi `grep -i checklist` | Làm được |
| BC-05 | Công cụ kiểm tra: chữ hiển thị | chính | "Hãy tự kiểm tra" → "CÔNG CỤ KIỂM TRA"; "Danh sách kiểm tra" → theo bảng chữ ("Kiểm tra: …"); "In danh sách kiểm tra" theo bảng. File: `CongCu`, `DanhSachKiemTra`, `BaiDocChuyenDe`, `KhiNghiBiLua`, `TruocKhi*`, `_SelfCheck*`, `self-check-*.js`. Breadcrumb lấy URL của trang cha, không viết cứng `/hay-tu-kiem-tra/` | BC-00 | Không còn "Hãy tự kiểm tra", "checklist" hiển thị; không còn `href="/hay-tu-kiem-tra/"` trong view | `grep` view và JS; mở 3 công cụ và một trang kiểm tra | Làm được |
| BC-06 | Đường dẫn mới và chuyển hướng | chính | `AntcPublicPaths.cs`: `/hay-tu-kiem-tra/` → `/cong-cu-kiem-tra/` (cả `SelfCheckGuidancePath`, `SelfCheckReadingPath`, `SelfCheckChecklistPath`); `AlertListPath` → `/cac-rui-ro/canh-bao/`. `AntcPublicRouting.cs`: 301 từ đường dẫn cũ (giữ chuỗi truy vấn, không chuyển ở preview). `SelfCheckSeo.cs:77`, `SelfCheckSitemapController.cs:16` (sitemap mới; đường dẫn sitemap cũ chuyển hướng). `AntcPublicPathsTests.cs` | BC-05 (cùng người giữ), X2 | AC 6 đạt | `dotnet test`; `curl -I` đường dẫn cũ ra 301 và `Location` đúng; đường dẫn mới ra 200 | Chờ X2 |
| BC-07 | Hỏi – Đáp: gửi bằng `mailto` | chính | `qa-submission.js`, `qa-portal.js`: bỏ `fetch POST /api/v1/questions`, dựng `mailto:` từ các ô; `hoiDapPage.cshtml`, `qaSubmissionBlock.cshtml`: đọc `feedbackEmail` từ `Model.Root()`; không có thì hiện câu "nơi nhận sẽ được công bố tại trang này" và ẩn biểu mẫu. Giữ kiểm tra hợp lệ phía trình duyệt. **Không xóa API** (QĐ-058) | BC-01, X3 | AC 7 đạt; trường hợp biên về hộp thư đạt | Thử hai chế độ (có và không có hộp thư); xem `href` sinh ra; F12 không có yêu cầu POST | Chờ X3 |
| BC-08 | Liên hệ: gỡ khối tổ chức tín dụng | chính | `LienHe.cshtml:~65-90` (khối `contact-banks`), CSS và JS đi kèm nếu không còn dùng | BC-00 | AC 8 (phần Liên hệ) đạt | Mở `/lien-he/` ở 390 và 1440px | Làm được |
| BC-09a | Nội dung: cài đặt và menu | chính | Tắt `showPreviewBanner`, `sponsorShow`, `showSampleNote`; xóa `footerOperatorText`; điền `footerImageNote`; `operatorName` = "antoantaichinh.vn"; tên menu: KHẨN CẤP, CÔNG CỤ KIỂM TRA, RỦI RO; tên các trang tương ứng; xuất bản "Các rủi ro" và các trang Việc cần làm còn chưa xuất bản | BC-01 → BC-08 đã gộp | AC 1 → 3 đạt | `run-local -Reset`; `curl` trang chủ rồi `grep` | Chờ X1 |
| BC-09b | Nội dung: chính sách | chính | Bốn bài chính sách theo bản chính thức (`data.js` › `POL`; cập nhật 10/11/2026, bỏ khung dự thảo); "Nguyên tắc dẫn nguồn" thành "Nguyên tắc biên soạn nội dung"; gỡ xuất bản "Chính sách tài trợ"; chính sách dữ liệu cá nhân viết lại | BC-09a | Không còn "dự thảo", `[Tên`, Thiên Lộc ở các bài chính sách | Mở `/chinh-sach/…`; `grep` file uSync | Chờ X1 |
| BC-09c | Nội dung: 10 cảnh báo | chính | Thay nội dung theo `app.js` › `ALERTS` (ngày 10/11/2026); bỏ tên cơ quan nguồn | BC-03, BC-09a | 10 cảnh báo khớp bản chính thức | So với ảnh BC-00 | Chờ X1 |
| BC-09d | Nội dung: gỡ Thiên Lộc, Công ty ABC, `[Tên` | chính | Khoảng 24 file uSync có Thiên Lộc (8 bài đọc chuyên đề kèm bản sao), 13 file có `[Tên`; Khẩn cấp để trống `bankHotlines` | BC-09a | `grep -rl "Thiên Lộc\|\[Tên\|Công ty ABC" uSync/v18/Content` không còn kết quả (trừ bài thủ đoạn để dành 2b) | `grep`; `-Reset` | Chờ X1 |
| BC-09e | Nội dung: "kiểm tra" và từ tiếng Việt | chính | Tám bài đọc chuyên đề: "KIỂM TRA BỎ TÚI"; đổi từ theo `docs/portal-final/nguon/nhat-ky-viet-hoa.md` cho các nút đang có (trừ bài thủ đoạn) | BC-09d | Không còn "checklist", "bảng kiểm" trong nội dung đang xuất bản | `grep -ril checklist uSync/v18/Content` | Chờ X1 |
| BC-10 | Nghiệm thu Đợt 1 (Orchestrator) | chính | `/quality-check` cả đợt; so với ảnh BC-00 | Tất cả | AC 1 → 10 | `run-local -Reset`, `dotnet test`, xem 390, 1024, 1440px | Sau cùng |

**Thứ tự:** BC-00 → (BC-01 ∥ BC-03 ∥ BC-04 ∥ BC-05 ∥ BC-08) → (BC-02, BC-07 sau BC-01; BC-06 sau BC-05) → gộp → BC-09a → BC-09b → BC-09c → BC-09d → BC-09e → BC-10.

Các task code (BC-02 → BC-08) gộp vào `portal-v2` trước BC-09, để người giữ nội dung làm trên code mới và chỉ một mình xuất uSync.

## Đợt 2 (chỉ liệt kê, thiết kế sau)

| Gói | Nội dung | Quyết định | Ghi chú |
|---|---|---|---|
| 2a | Công cụ chọn tình huống: 12 nhóm, 82 tình huống, 3 bước; nút "Chuyện gì đây???" ở trang chủ và Khẩn cấp; trình hỏi 3 câu thành lối phụ | QĐ-059 | Giữ `home.cshtml`, `ungPhoPage.cshtml`. Kiểm bằng `chk_combos.js`, `chk_sits.js` |
| 2b | Kiến thức nền tảng: 157 bài, 3 ngăn, khối ở trang chủ, dải ở Rủi ro, liên kết ở chân trang | QĐ-060 | Dùng lại `article`; nhập từ `nguon/bai/*.md` |
| 2c | Ngân hàng câu hỏi doanh nghiệp: 78 câu, 3 phần | QĐ-061 (giữ hệ thống cuộc thi) | Các trường của `dn_bank.js` khớp DTO câu hỏi (`sit`, `q`, `opt`, `ans`, `exp`, `safe`, `sec`); nhớ gọi `IQuestionBank.Reload()` |
| 2d | Trang thông tin, chính sách, Góp ý (V2-09a, V2-13j làm lại) | QĐ-058 (Góp ý dùng `mailto`) | Document type hiện rỗng; quyết dùng `infoPage`/`policyPage` theo thiết kế V2 hay điền các loại riêng AnVu29 đã tạo. Sửa luôn liên kết chân trang đang trả 404 |
| 2e | Gỡ phần tài trợ và đơn vị vận hành khỏi document type `antc`, gỡ `chinhSachTaiTroPage` | QĐ-057 | Xóa trong backoffice; giữ file `<Empty Change="Delete">` của uSync |

## Cần người dùng xác nhận

- **X1. Ai giữ nội dung Đợt 1** (QĐ-062)? BC-01 và BC-09a → e phải do cùng một người làm. Khuyến nghị: một người không đang giữ code trong Đợt 1 (anhnn hoặc người làm nội dung); nếu phải là dev, chọn MinhNB vì phần code của MinhNB ít nhất.
- **X2. Có giữ chuyển hướng 301 từ đường dẫn cũ không?**
  - Hôm trước anh/chị nói chỉ cần sửa trong backoffice. Nhưng đường dẫn của các trang này **cố định trong code** (`AntcPublicPaths.cs:9-24`), backoffice không đổi được.
  - Bản chính thức ghi "đường dẫn cũ vẫn mở được"; code đã có sẵn mẫu chuyển hướng 301.
  - Khuyến nghị: **giữ 301**, thêm khoảng 2 nhóm đường dẫn vào chỗ đã có. Bỏ 301 thì đường dẫn cũ ra 404.
- **X3. Hệ quả của QĐ-058 với Hỏi – Đáp:** khi chuyển sang `mailto`, section Hỏi – Đáp trong backoffice (hộp nhận, duyệt, công bố) **không còn nhận câu hỏi từ web**. Khuyến nghị: giữ section để biên tập viên nhập tay câu hỏi nhận qua thư và công bố câu trả lời; giữ API như QĐ-058 đã ghi. Cần anh/chị xác nhận việc này trước khi làm BC-07.
- **X4. Phân công dev** ở bảng "Người giữ file" là đề xuất, chưa hỏi các dev. Cần hỏi từng người còn thay đổi chưa đẩy lên ở các file được giao cho người khác không.
