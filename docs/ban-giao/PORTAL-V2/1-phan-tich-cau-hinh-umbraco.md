# Portal v2: phân tích bản dựng mới và danh mục cấu hình Umbraco

- Ngày: 2026-11-02 · Người làm: anhnn cùng Claude
- Trạng thái: cập nhật 2026-11-02 sau khi anhnn chốt QĐ-032 (cấu trúc 3 mục, bỏ Block Grid), QĐ-033 (theo đúng đặc tả), QĐ-034 (ma trận trình hỏi), QĐ-035 (hai nhóm quyền), QĐ-036 (PDF checklist: LibreOffice trước, lùi về tệp tải lên).
- Mockup portal đi kèm: `docs/ban-giao/PORTAL-V2/mockup-portal-v2.html` (bấm được, chạy trên trình duyệt).

## 1. Nguồn đã đọc

| Nguồn | Vai trò | Đọc được |
|---|---|---|
| `docs/ban-dung-v2/Cấu trúc website theo hướng sau.docx` | **Đặc tả của khách**, gốc cho bố cục: sitemap, menu 3 mục, 5 khối trang chủ, luồng Khẩn cấp, 3 công cụ, mục Các rủi ro, UI/UX, CMS (mục 11.1), nghiệm thu (mục 15) | Đủ 17 mục, 7 bảng |
| `docs/ban-dung-v2/antoantaichinh-nguon/README.md` | Ghi chú của bản dựng thử 27/10: làm theo đặc tả tới đâu, 7 chỗ cố ý làm khác, việc còn lại cho đơn vị kỹ thuật | Đủ |
| `docs/ban-dung-v2/antoantaichinh-nguon/build/app.js`, `data.json`, `shell.html` | Mẫu giao diện, câu chữ đã duyệt và các bảng dữ liệu (`ALERTS`, `TACTICS`, `WZRULES`, `TQ`, `PB`…) | Đủ; đã chụp 8 màn bằng Chrome headless |
| `docs/ban-giao/BACKOFFICE-UI/0-tong-hop.md`, `3-don-gian-hoa-quan-ly-noi-dung.md`, `anh/*.png`, `ANTC-Backoffice-Prototype.html` | Giao diện backoffice anhnn đã thiết kế lại | Đủ phần chữ; xem 2 ảnh (`02-tong-quan`, `07-noi-dung-soan-bai`) |
| `docs/quyet-dinh.md` QĐ-028 → QĐ-031 | Quyết định đang hiệu lực cho backoffice | Đủ |
| `src/ANTC.Portal.App/Umbraco.Web.UI/uSync/v18/ContentTypes/*.config` | Cấu hình Umbraco hiện tại: 94 file (22 loại trang, 72 loại khối) | Đọc tên trường của `antc`, `seoBase`, `qaItem`, `article`, `articleList`, `home`… |

`docs/ban-dung-v2/antoantaichinh-mot-tep.html` và `antoantaichinh_co_anh_1_file (1).html` là bản đóng gói của cùng mã nguồn; không đọc riêng.

## 2. Kết luận nhanh

1. Bản dựng v2 **đổi hẳn cấu trúc thông tin** so với website đang chạy trên Umbraco. Hiện tại: Trang chủ, Ứng phó, Thủ đoạn, Tham gia, Hỏi – Đáp, Cuộc thi. Bản v2 theo đặc tả khách: đúng 3 mục **Khẩn cấp · Công cụ & checklist · Các rủi ro**, các trang khác chỉ vào từ chân trang. Phần lớn document type và view hiện có không dùng lại nguyên được.
2. Bản dựng giữ **bố cục và vị trí** của đặc tả, nhưng thay **logic và câu chữ** ở 7 chỗ (mục 3.2). **Đã chốt theo đặc tả (QĐ-033)**: form CMS dựng theo đặc tả; bản dựng v2 chỉ còn là mẫu giao diện và nguồn câu chữ cho các phần đặc tả không quy định.
3. Nội dung chia rõ làm hai loại. **Nội dung hay đổi** (cảnh báo, bài viết, hỏi đáp nhanh) cần form đơn giản, có danh sách dạng bảng, lọc, hẹn giờ. **Nội dung có cấu trúc, ít đổi** (trình hỏi, 3 công cụ, 8 checklist, 10 trang việc cần làm) cần form riêng có trường cố định, không dùng Block Grid tự do.
4. Đề xuất bỏ hướng "mỗi trang một trường Bố cục Block Grid" đang dùng. Đó là nguyên nhân khách kêu "quá nhiều thao tác" (`3-don-gian-hoa-quan-ly-noi-dung.md` mục 1). Bản v2 có bố cục cố định theo đặc tả, nên trang nào cũng làm được bằng trường riêng. Đây là việc đổi schema, cần chốt (mục 12, câu 1).
5. Cần **20 document type có trang**, **7 loại dữ liệu không có trang** (danh mục, thủ đoạn, đoạn dùng chung) và **khoảng 16 element type** cho Block List. Chi tiết ở mục 6 và 7.
6. Mockup backoffice trong `ban-giao` (cây nội dung "Quản lý trang: Ứng phó, Thủ đoạn, Tham gia…") vẽ theo cấu trúc cũ. Màu, bố cục trình soạn hai cột, ô "Kiểm tra trước khi xuất bản" vẫn dùng được; cây nội dung và nút "Thao tác nhanh" phải vẽ lại theo cấu trúc mới (mục 11).

## 3. Đối chiếu đặc tả của khách với bản dựng v2

### 3.1 Phần khớp

| Mục đặc tả | Bản dựng v2 |
|---|---|
| 3.2 Menu đúng 3 mục | Đúng. Điện thoại: thanh 3 nút dính đáy, Khẩn cấp tô cam |
| 4.1 Trang chủ 5 khối | Đúng thứ tự. Khối Cảnh báo mới chỉ lấy mục trong 90 ngày, không có thì tự ẩn |
| 4.2 Khối Khẩn cấp | Đúng tiêu đề, mô tả, 2 nút, 4 nguyên tắc; mỗi nguyên tắc thêm một dòng giải thích |
| 5.2–5.4 Trình hỏi 3 bước | 3 bước, quay lại giữ lựa chọn, có "Tôi chưa biết". Bước 1 thêm "Kênh khác, hoặc không nhớ" |
| 5.6 Câu bắt buộc dưới kết quả | Hiện dưới mọi kết quả |
| 6.1–6.3 Ba công cụ | Đủ 3, mỗi lần một câu |
| 7.1–7.3 Các rủi ro, danh sách, mẫu bài | Đủ 6 tab, tìm, lọc kênh/đối tượng/mức độ, thẻ bài, nút Xem thêm, mẫu bài 7 phần |
| 8.1–8.4 Màu, chữ, điểm gãy | Đúng; cam có chữ trắng dùng `#B8431A` để đạt tương phản 4,5:1 |
| 14 Nội dung MVP | 24 bài, 31 thủ đoạn, 10 trang việc cần làm, 10 cảnh báo mẫu, 8 checklist |

### 3.2 Bảy chỗ bản dựng cố ý làm khác đặc tả

Theo README của bản dựng, mục "Điều chỉnh để giữ đúng đề cương 1.3". **QĐ-033: cả 7 chỗ làm theo đặc tả.** Cột cuối là cách dựng form theo quyết định đó.

| # | Đặc tả ghi | Bản dựng làm | Dựng CMS theo QĐ-033 |
|---|---|---|---|
| 1 | Mức độ: Thường / Cao / Rất cao | Rất cao = DỪNG, Cao = HOÃN VÀ KIỂM CHỨNG, mức thấp ghi "Cần thận trọng" | Kiểu dữ liệu "Mức độ" 3 giá trị cố định: Thường / Cao / Rất cao |
| 2 | "An toàn tương đối", màu xanh lá "An toàn" | Ghi "Chưa phát hiện điểm dừng" | Nhãn kết quả công cụ 1 mặc định "An toàn tương đối", hiện màu xanh lá |
| 3 | Đếm dấu hiệu: 0 / 1 / từ 2 | Cây quyết định | Mỗi câu hỏi công cụ có trường "Trả lời nào là dấu hiệu" (Có / Không); kết quả tính theo số dấu hiệu, ngưỡng nhập ở trang công cụ |
| 4 | "Có thể là [tên tình huống]" | "Tình huống gần giống" | Khối kết quả ghi "Có thể là", tên lấy từ hàng của ma trận tình huống |
| 5 | Trang cảnh báo có "Mức độ phổ biến" | Đổi thành "Nguồn cảnh báo" | Form Cảnh báo có trường Mức độ phổ biến (bắt buộc); nhóm Nguồn giữ làm trường không bắt buộc |
| 6 | Công cụ 3: "Gỡ ứng dụng lạ, quét thiết bị" | Bỏ, vì ngược quy trình đã thẩm định | Câu chữ hành động của công cụ 3 nhập theo bảng đặc tả 6.3. Ban biên tập xác nhận trước khi xuất bản (QĐ-033, mục Ảnh hưởng) |
| 7 | Công cụ 3: "Bật xác thực hai lớp" | Bỏ, chưa có trong tài liệu thẩm định | Như trên |

### 3.3 Phần bản dựng làm thêm, đặc tả không có

| Thêm | Ở đâu | Có cần CMS |
|---|---|---|
| Ba cửa vào "Việc cần làm ngay" và 9 tình huống, 10 trang Việc cần làm | Trang Khẩn cấp | Có: trang Việc cần làm, khối Cửa vào |
| 8 checklist "Trước khi…" (đặc tả mục 14.2 có 5) | Công cụ & checklist | Có |
| Số cần biết (113, 156, 5656), cách tự tìm số ngân hàng, ngày kiểm chứng | Trang Khẩn cấp | Có |
| Thủ đoạn (31), gắn kênh, đối tượng, mức độ | Danh sách Các rủi ro | Có: danh mục Thủ đoạn |
| Bài đọc chuyên đề (8), bài đọc thêm (10) | Các rủi ro | Có: chung loại Bài viết |
| Hỏi – đáp nhanh, Hỏi – Đáp gửi kín, Góp ý, Liên hệ đúng nơi, Xác minh đúng trang, Cuộc thi | Chân trang | Có. Hỏi – Đáp và Cuộc thi đã có API |
| Cam kết bốn không, câu đơn vị vận hành, Đơn vị tài trợ | Chân trang | Có: Cài đặt website |
| Dấu rà soát nội dung khẩn cấp, tự cảnh báo khi quá 90 ngày | Khẩn cấp, Việc cần làm | Có: trường Ngày rà soát |

## 4. Sơ đồ trang và cây nội dung Umbraco

Đường dẫn theo đặc tả mục 3.3. Cột "Tạo/xóa" là quyền của Biên tập viên; Quản trị luôn có toàn quyền.

```
An toàn tài chính (siteSettings, không có trang)          Cài đặt website, chân trang, câu cố định
├── Trang chủ (homePage)                                  /                                   1 trang · không tạo/xóa
│   ├── Khẩn cấp (khanCapPage)                            /khan-cap                           1 trang · không tạo/xóa
│   │   ├── Kiểm tra tình huống (wizardPage)              /khan-cap/kiem-tra-tinh-huong       1 trang · không tạo/xóa
│   │   └── Việc cần làm (viecCanLamPage) ×10             /khan-cap/da-chuyen-tien …          sửa · tạo/xóa: chỉ Quản trị
│   ├── Công cụ & checklist (congCuPage)                  /cong-cu-checklist                  1 trang · không tạo/xóa
│   │   ├── Công cụ (toolPage) ×3                         /cong-cu-checklist/truoc-khi-chuyen-tien …   sửa · không tạo/xóa
│   │   └── Checklist (checklistPage) ×8                  /cong-cu-checklist/checklist-truoc-khi-vay … tạo/sửa/xóa
│   ├── Các rủi ro (ruiRoPage)                            /cac-rui-ro → chuyển về /cac-rui-ro/canh-bao-moi
│   │   ├── Cảnh báo mới (alertListPage)                  /cac-rui-ro/canh-bao-moi            1 trang
│   │   │   └── Cảnh báo (alertPage) ×n                   /cac-rui-ro/canh-bao-moi/[slug]     tạo/sửa/xóa
│   │   └── Nhóm rủi ro (riskCategoryPage) ×5             /cac-rui-ro/lua-dao, vay-va-no, dau-tu, bao-hiem-va-tiet-kiem, du-lieu-ca-nhan
│   │       └── Bài viết (riskArticlePage) ×n             /cac-rui-ro/[nhom]/[slug]           tạo/sửa/xóa
│   ├── Hỏi – Đáp (hoiDapPage, đã có)                     /hoi-dap
│   ├── Liên hệ đúng nơi (lienHePage)                     /lien-he
│   ├── Góp ý (gopYPage)                                  /gop-y
│   ├── Trang thông tin (infoPage) ×3                     /ve-website, /nguyen-tac-noi-dung, /xac-minh-dung-trang
│   ├── Chính sách (policyPage) ×5                        /chinh-sach-bao-mat, /dieu-khoan-su-dung, /chinh-sach/[slug]
│   ├── Cuộc thi (thiPage và các trang con, đã có)        /cuoc-thi … (bật/tắt ở Cài đặt website)
│   ├── Tìm kiếm (searchPage, đã có)                      /tim-kiem
│   └── 404 (notFoundPage, đã có)
└── Thư viện (folder, không có trang)
    ├── Danh mục (taxonomyFolder)
    │   ├── Kênh tiếp cận (channelItem) ×7
    │   ├── Đối tượng (audienceItem) ×5
    │   ├── Dấu hiệu phải dừng (stopSignItem) ×6
    │   └── Chuyên đề (topicItem) ×8
    ├── Thủ đoạn (tacticItem) ×31
    ├── Hỏi – đáp nhanh (quickQaItem) ×n
    └── Đoạn dùng chung (sharedSnippet) ×n                  BANKBOX, RECOV, COVER, LEGIT, COND trong bản dựng
```

Ghi chú:
- "Cảnh báo mới" là tab mặc định của Các rủi ro (đặc tả 7.1), nên `/cac-rui-ro` chuyển hướng 301 về `/cac-rui-ro/canh-bao-moi`. Không cần node "Cảnh báo mới" kiểu nhóm rủi ro.
- Bản dựng có bài xuất hiện ở nhiều tab (ví dụ cảnh báo số 1 hiện ở cả Dữ liệu cá nhân). Đường dẫn thật chỉ theo **một** nhóm chính (node cha); các nhóm khác chọn ở trường "Hiện thêm ở nhóm". Trang bài đặt `canonical` theo đường dẫn chính.
- Mức độ (3 giá trị) là kiểu dữ liệu cố định, không phải node: đổi giá trị là đổi logic trình hỏi.

## 5. Danh mục dùng chung (đặc tả 11.1: "Quản lý danh mục rủi ro", "Quản lý tag và bộ lọc")

Thiết kế chi tiết (cách làm từng loại danh mục, data type, alias, quy ước document type) ở `2-danh-muc-va-document-type.md`; tên loại và khối trong file này là tên làm việc, alias chuẩn theo mục 2 của file đó.

Mỗi danh mục là node trong "Thư viện › Danh mục", biên tập viên thêm, sửa, sắp xếp được. Các form chọn kênh, đối tượng… dùng trình chọn nội dung (Multinode Treepicker) giới hạn vào đúng thư mục.

| Danh mục | Số mục mẫu | Trường | Xóa |
|---|---|---|---|
| Kênh tiếp cận | 7 (`CHANNELS`): Điện thoại, cuộc gọi · Tin nhắn, Zalo · Mạng xã hội · Website, ứng dụng, mã QR · Sàn thương mại điện tử · Thư điện tử · Gặp trực tiếp, người quen giới thiệu | Tên hiển thị (bắt buộc, ≤ 40 ký tự) · Mã (bắt buộc, chữ thường không dấu, duy nhất, khóa sau lần xuất bản đầu) · Biểu tượng (chọn từ bộ biểu tượng của website) | Chặn khi còn bài, cảnh báo hoặc quy tắc trình hỏi dùng |
| Đối tượng | 5 (`GROUPS`) | Tên · Mô tả ngắn (≤ 120) · Biểu tượng · Thủ đoạn hay gặp (chọn nhiều Thủ đoạn) | Như trên |
| Dấu hiệu phải dừng | 6 (`SIGNS`) | Câu dấu hiệu (soạn thảo hạn chế: chỉ in đậm) · Ghi chú phụ · Biểu tượng | Như trên. Thêm, xóa cần Quản trị vì gắn với Điều 14 |
| Chuyên đề | 8 (`CD`) | Tên đầy đủ · Tên ngắn · Câu hỏi của chuyên đề (`HOI`) · Bài đọc chuyên đề (chọn 1 Bài viết) · Checklist (chọn 1) | Chặn khi còn câu hỏi thi hoặc bài dùng |

Mức độ cần thận trọng **không** là danh mục sửa được. Kiểu dữ liệu Dropdown cố định theo đặc tả 5.5 (QĐ-033): `thuong` Thường, `cao` Cao, `ratCao` Rất cao. Câu giải thích từng mức nằm ở Cài đặt website, tab Câu cố định. Khi không khớp tình huống nào, trình hỏi hiện trạng thái "Cần thận trọng" cùng 4 nguyên tắc dừng (đặc tả 5.7); đây là trạng thái hiển thị, không phải giá trị thứ tư của danh mục.

## 6. Document type và form

Quy ước bảng trường:
- **Kiểu nhập** là property editor của Umbraco 18. "Chuỗi" = Textstring, "Đoạn" = Textarea, "Soạn thảo" = Rich Text (Tiptap) với thanh công cụ rút gọn, "Chọn nội dung" = Content Picker / Multinode Treepicker, "Danh sách khối" = Block List.
- **Bắt buộc** đánh dấu ✔ là chặn lưu; ✔xb là cho lưu nháp nhưng chặn xuất bản (QĐ-031 khoản 3, kiểm bằng ô "Kiểm tra trước khi xuất bản" BO-19 và sự kiện xuất bản phía máy chủ).
- Mọi loại có trang đều dùng composition `seoShare` và `publishMeta` (mục 6.13); bảng dưới không lặp lại hai nhóm đó.

### 6.1 Cài đặt website (`siteSettings`, sửa từ `antc`)

Một node, không có trang. `antc` hiện có 39 trường, 6 tab; đề xuất 6 tab, biên tập viên chỉ thấy tab 1 và 2 (quyền theo trường, `3-don-gian-hoa…` mục 1.3).

| Tab | Trường | Kiểu nhập | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| 1. Hay sửa | Bốn nguyên tắc dừng | Danh sách khối `principleItem`, đúng 4 khối | ✔ | Dùng ở Trang chủ và Khẩn cấp. Nguồn: `PRINC` |
| | Ngày rà soát nội dung khẩn cấp | Ngày | ✔xb | `REVIEW.pb.rev`. Quá 90 ngày thì trang tự hiện cảnh báo |
| | Ngày rà soát lại dự kiến | Ngày | | `REVIEW.pb.next` |
| 2. Chân trang | Câu miễn trừ cố định | Đoạn, ≤ 300 | ✔ | Đặc tả 4.6, nguyên văn |
| | Bốn liên kết chính | Danh sách khối `linkItem`, đúng 4 | ✔ | Về website, Nguyên tắc nội dung, Chính sách bảo mật, Điều khoản sử dụng (đặc tả 3.1) |
| | Cam kết | Danh sách chuỗi, tối đa 4 | ✔ | `BONKHONG` |
| | Liên kết phụ | Danh sách khối `linkItem` | | Hỏi – Đáp, Liên hệ đúng nơi, Xác minh đúng trang, Góp ý |
| | Câu đơn vị vận hành | Đoạn | ✔ | |
| 3. Nhận diện | Tên website, Câu mô tả dưới logo | Chuỗi | ✔ | |
| | Logo đầu trang, Logo chân trang (kèm văn bản thay thế) | Chọn ảnh + Chuỗi | ✔ | |
| | Dải trên cùng: chế độ | Dropdown: Bản dựng thử / Địa chỉ duy nhất / Ẩn | ✔ | README mục 23 |
| | Không cho công cụ tìm kiếm lập chỉ mục | Bật/tắt | | Mặc định bật cho tới khi nội dung được duyệt |
| 4. Hoạt động | Bật lối vào Cuộc thi | Bật/tắt | | `ACTIVITY.on`; tắt thì lối vào ẩn, trang vẫn mở được |
| | Tên ngắn, tên đầy đủ của cuộc thi | Chuỗi | | |
| 5. Tài trợ | Hiện khu tài trợ | Bật/tắt | | Chỉ bật khi Chính sách tài trợ đã ban hành (README mục 20) |
| | Tên, logo, liên kết đơn vị tài trợ | Chuỗi, Chọn ảnh, Liên kết | Khi bật: ✔ | |
| | Câu "không phải khuyến nghị" | Chuỗi | Khi bật: ✔ | |
| 6. Câu cố định | Câu dưới mọi kết quả tự kiểm tra | Đoạn | ✔ | `RESNOTE`, đặc tả 5.6 |
| | Câu "không phải kết luận" | Đoạn | ✔ | `NOTCONC` |
| | Câu giải thích mức Thường / Cao / Rất cao và trạng thái "Cần thận trọng" | 4 trường Đoạn | ✔ | Hiện dưới khối Mức độ cần thận trọng |
| | Câu không nhận tố giác | Đoạn | ✔ | `NOTREPORT` |
| | Câu miễn trừ tư vấn | Đoạn | ✔ | `NOADVICE`, hai câu bắt buộc `MUST` |
| | Cách tự tìm số ngân hàng | Danh sách chuỗi (soạn thảo hạn chế) | ✔ | `BANKA`, `BANKANOTE` |
| | Câu từ chối cho mượn tài khoản | Đoạn | ✔ | `REFUSE` |

Tab 4–6 chỉ Quản trị thấy. Tạo, xóa: không ai (node gốc).

### 6.2 Trang chủ (`homePage`, thay `home`)

Đặc tả mục 4. Bỏ trường Bố cục; mỗi khối là một nhóm trường.

| Nhóm | Trường | Kiểu nhập | Bắt buộc | Kiểm tra |
|---|---|---|---|---|
| Khối Khẩn cấp | Nhãn nhỏ | Chuỗi | | ≤ 30 |
| | Tiêu đề | Chuỗi | ✔ | ≤ 90 ký tự, để thấy trọn trên màn 360×640 |
| | Mô tả | Đoạn | ✔ | ≤ 160 |
| | Chữ nút chính / nút phụ | Chuỗi | ✔ | ≤ 32. Đích cố định: trình hỏi và mục "Việc cần làm ngay" |
| | Câu dẫn bốn nguyên tắc | Chuỗi | | Bốn nguyên tắc lấy từ Cài đặt website |
| | Hình minh họa | Chọn ảnh | | Văn bản thay thế ✔ khi có ảnh |
| Khối Công cụ & checklist | Tiêu đề khối | Chuỗi | ✔ | |
| | Ba thẻ | Chọn nội dung, đúng 3 `toolPage` | ✔ | Đặc tả 4.3 |
| Khối Các rủi ro | Tiêu đề khối | Chuỗi | ✔ | Thẻ lấy tự động từ 5 nhóm, số bài đếm tự động |
| Khối Cảnh báo mới | Tiêu đề khối, chữ nút "Xem tất cả" | Chuỗi | ✔ | |
| | Số cảnh báo hiện | Số, 1–3 | ✔ | Mặc định 3; chỉ lấy cảnh báo cập nhật trong 90 ngày, không có thì khối ẩn |
| | Cảnh báo ghim | Chọn nội dung, tối đa 1 `alertPage` | | "Đặt bài nổi bật" (đặc tả 11.1). Hết 90 ngày thì tự bỏ ghim |

Danh sách, tạo, xóa: không áp dụng (1 node).

### 6.3 Khẩn cấp (`khanCapPage`)

| Nhóm | Trường | Kiểu nhập | Bắt buộc |
|---|---|---|---|
| Đầu trang | Tiêu đề, Mô tả | Chuỗi, Đoạn | ✔ |
| Lối vào trình hỏi | Tiêu đề, Mô tả, Chữ nút | Chuỗi, Đoạn, Chuỗi | ✔ |
| Việc cần làm ngay | Câu dẫn | Đoạn | ✔ |
| | Ba cửa vào | Danh sách khối `doorItem`, đúng 3 | ✔ |
| | Nút "Không ô nào giống" → trang | Chọn nội dung `viecCanLamPage` | ✔ |
| | Câu cho người đang giúp người thân | Chuỗi | |
| Tình huống điển hình | Danh sách trang, theo thứ tự hiện | Chọn nội dung nhiều `viecCanLamPage`, kéo thả | ✔ |
| Khi cần hỗ trợ | Số do Nhà nước vận hành | Danh sách khối `hotlineItem` | ✔ |
| | Ngày kiểm chứng số | Ngày | ✔xb |
| | Nguồn kiểm chứng | Chuỗi + Liên kết | ✔xb |
| | Đường dây nóng của tổ chức tín dụng | Danh sách khối `hotlineItem` | | README mục 11: để trống tới khi có nguồn Nhà nước |
| Cuối trang | Hai nút liên kết | Danh sách khối `linkItem`, tối đa 2 | |

`doorItem`: Tiêu đề ✔ (≤ 70) · Mô tả ✔ (≤ 120) · Hình minh họa (chọn từ 3 hình có sẵn) · Kiểu: Mở trang ngay / Mở danh sách lựa chọn · Trang đích (khi Mở trang ngay) · Lựa chọn: Danh sách khối `doorOption` (Biểu tượng, Câu ✔ ≤ 160, Đích ✔: trang Việc cần làm hoặc trình hỏi).

`hotlineItem`: Số ✔ (chỉ chữ số, 3–6 ký tự) · Hình thức ✔ (Gọi / Nhắn tin / Gọi và nhắn tin) · Mô tả ✔ (≤ 200) · Cú pháp tin nhắn (khi có Nhắn tin).

### 6.4 Trình hỏi "Tôi đang gặp chuyện gì?" (`wizardPage`)

Đặc tả 5.1–5.7 và 11.2. Câu hỏi và lựa chọn theo nguyên văn đặc tả (QĐ-033); quy tắc sửa bằng màn ma trận (QĐ-034). Chỉ Quản trị viên sửa trang này (QĐ-035).

| Tab | Trường | Kiểu nhập | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| Câu hỏi | Câu hỏi bước 1 | Chuỗi | ✔ | "Bạn nhận được thông tin qua kênh nào?" |
| | Lựa chọn bước 1 | Danh sách khối `wizardOption`, 2–8 khối | ✔ | 6 lựa chọn của đặc tả 5.2. Chọn một |
| | Câu hỏi bước 2, Lựa chọn bước 2 | Chuỗi, Danh sách khối `wizardOption` | ✔ | "Họ yêu cầu bạn làm gì?", 6 lựa chọn của 5.3. Chọn nhiều |
| | Câu hỏi bước 3, Lựa chọn bước 3 | Chuỗi, Danh sách khối `wizardOption` | ✔ | "Họ nói gì để thuyết phục bạn?", 6 lựa chọn của 5.4. Chọn nhiều |
| Ma trận | Ma trận tình huống | Property editor tự viết `Antc.WizardMatrix` | ✔ ≥ 1 hàng | Xem dưới |
| Kết quả | Tiêu đề 4 khối | 4 Chuỗi | ✔ | Mức độ cần thận trọng · Có thể là · Dấu hiệu phù hợp · Việc cần làm ngay (đặc tả 5.5) |
| | Số tình huống hiện tối đa | Số, 1–3 | ✔ | Mặc định 3 (đặc tả 5.7) |
| | Câu khi không khớp | Đoạn | ✔ | Hiện cùng trạng thái "Cần thận trọng" và 4 nguyên tắc dừng |
| | Chữ 4 nút | 4 Chuỗi | ✔ | Xem bài hướng dẫn chi tiết · Tải checklist PDF · Gửi cho người thân · Kiểm tra lại |
| | Checklist mặc định | Chọn nội dung `checklistPage` | ✔ | Dùng khi hàng khớp không chọn checklist |

`wizardOption`: Nhãn ✔ (≤ 60) · Biểu tượng. Mỗi khối Block List có khóa (GUID) riêng; ma trận trỏ tới khóa này, nên sửa nhãn không làm hỏng quy tắc.

Màn "Ma trận tình huống":

| Phần | Mô tả |
|---|---|
| Bảng | Mỗi hàng là một tình huống. Cột đầu (cố định khi cuộn ngang): tên tình huống và chip mức độ. Các cột sau chia 3 nhóm theo bước 1, 2, 3, mỗi cột là một lựa chọn. Bấm ô để bật hoặc tắt "liên quan" |
| Ngăn chi tiết | Bấm tên hàng mở ngăn bên phải, sửa: Tên tình huống ✔ (≤ 80, ví dụ "Giả mạo ngân hàng") · Mức độ ✔ (Thường / Cao / Rất cao) · Dấu hiệu phù hợp ✔ (1–3 dòng) · Việc cần làm ngay ✔ (1–4 bước) · Bài hướng dẫn chi tiết ✔ (chọn Bài viết hoặc Cảnh báo) · Checklist (chọn) · Đang dùng (bật/tắt) |
| Thao tác hàng | Thêm hàng, Nhân bản hàng, Kéo để sắp xếp (thứ tự dùng khi hai hàng bằng điểm), Xóa hàng (hỏi lại ngay trong màn) |
| Lọc | Ô tìm theo tên; lọc theo mức độ; chỉ hiện hàng đang có cảnh báo |
| Thử kết quả | Khung bên dưới: chọn lựa chọn của 3 bước như người dân, thấy ngay kết quả giống trên website. Không lưu gì |
| Cảnh báo trong màn | Hàng không có ô nào ở bước 2 và 3; hàng thiếu việc cần làm hoặc bài; lựa chọn không thuộc hàng nào; lựa chọn đã bị xóa ở tab Câu hỏi |

Cách tính kết quả (đề xuất, giữ cách của bản dựng v2): mỗi hàng đang dùng được tính điểm = 2 × số lựa chọn bước 2, 3 người dân chọn trùng với ô của hàng, cộng 3 nếu kênh ở bước 1 trùng. Hàng có ít nhất một lựa chọn bước 2 hoặc 3 trùng mới được tính. Lấy tối đa 3 hàng điểm cao nhất. Mức độ của kết quả là mức cao nhất trong các hàng lấy ra. "Dấu hiệu phù hợp" và "Việc cần làm ngay" lấy từ hàng điểm cao nhất (tối đa 3 và 4 dòng). Không hàng nào khớp thì hiện "Cần thận trọng" và 4 nguyên tắc dừng.

Dữ liệu lưu: giá trị JSON của trường, ví dụ `{ "rows": [ { "id", "name", "level", "signs": [], "actions": [], "article", "checklist", "enabled", "match": { "s1": [], "s2": [], "s3": [] } } ] }`. Đi theo lưu nháp, xuất bản, hẹn giờ và lịch sử phiên bản có sẵn của Umbraco. Trang website nhận quy tắc ngay trong HTML và tính trên trình duyệt; không gửi lựa chọn của người dân về máy chủ (đặc tả 5.7).

Kiểm khi xuất bản (phía máy chủ): JSON đúng cấu trúc; mọi khóa lựa chọn còn tồn tại; mỗi hàng đang dùng có tên, mức độ, ít nhất 1 dấu hiệu, 1 việc cần làm, 1 bài. Tạo, xóa trang: không.

### 6.5 Việc cần làm (`viecCanLamPage`, 10 trang)

Bản dựng: `PB` 0–9 ("Bạn vừa chuyển tiền, hoặc vừa giao hàng đi"…).

| Trường | Kiểu nhập | Bắt buộc | Ghi chú |
|---|---|---|---|
| Tiêu đề | Chuỗi | ✔ | ≤ 90 |
| Đường dẫn | Chuỗi (sinh từ tiêu đề, sửa được) | ✔ | Ví dụ `da-chuyen-tien`. Đổi thì tự tạo chuyển hướng 301 |
| Biểu tượng | Chọn biểu tượng | ✔ | |
| Câu dẫn | Đoạn | ✔ | |
| Ẩn khỏi danh sách tình huống | Bật/tắt | | `nop` (trang 0 là trang hỏi nhanh) |
| Các bước | Danh sách khối, 4 loại khối | ✔ ≥ 1 | Xem dưới |
| Ngày rà soát | Ngày | ✔xb | Quá 90 ngày tự hiện cảnh báo |
| Nguồn kiểm chứng | Chuỗi | ✔xb | |

Bốn loại khối trong "Các bước":

| Khối | Trường | Hiện trên trang |
|---|---|---|
| `stepItem` Bước làm | Câu chính ✔ (soạn thảo hạn chế) · Diễn giải (danh sách chuỗi) · Câu nói mẫu khi gọi ngân hàng (`say`) · Hiện hộp "Tìm đúng số ngân hàng" (bật/tắt) · Chỉ làm khi… (chọn đoạn dùng chung `COND`) | Ô có số thứ tự, đánh dấu đã làm (lưu trên máy người xem) |
| `branchItem` Rẽ nhánh | Câu hỏi ✔ · Chữ nút ✔ · Ghi chú · Trang đích ✔ (`viecCanLamPage`) | Hộp hỏi "Bạn cũng đã…?" có nút sang trang khác |
| `snippetRef` Đoạn dùng chung | Đoạn ✔ (chọn `sharedSnippet`) | Hộp "Đừng trả phí cho người hứa lấy lại tiền"… |
| `questionList` Câu hỏi sàng lọc | Danh sách: Câu ✔, Chữ nút ✔, Ghi chú, Trang đích ✔ | Chỉ trang 0 "Trả lời vài câu hỏi ngắn" |

Danh sách: cây dưới Khẩn cấp, 10 dòng, cột Tiêu đề, Ngày rà soát (tô đỏ khi quá 90 ngày), Ngày sửa. Xóa: chỉ Quản trị, chặn khi còn cửa vào, rẽ nhánh, công cụ 3 hoặc cảnh báo trỏ tới.

### 6.6 Công cụ & checklist (`congCuPage`)

| Trường | Kiểu nhập | Bắt buộc |
|---|---|---|
| Tiêu đề, Mô tả | Chuỗi, Đoạn | ✔ |
| Ba công cụ theo thứ tự | Chọn nội dung, đúng 3 `toolPage` | ✔ |
| Tiêu đề phần checklist, Câu dẫn | Chuỗi, Đoạn | ✔ |
| Thứ tự checklist | Tự lấy theo thứ tự node con | |
| Lối sang Thử sức, Tự luyện | Danh sách khối `linkItem` | |

### 6.7 Công cụ (`toolPage`, 3 trang)

Đặc tả 6.1–6.3 và 11.3, làm theo đúng đặc tả (QĐ-033). Hai kiểu: công cụ 1, 2 tính theo số dấu hiệu; công cụ 3 theo nhánh.

| Trường | Kiểu nhập | Bắt buộc | Ghi chú |
|---|---|---|---|
| Tiêu đề, Đường dẫn, Biểu tượng | Chuỗi, Chuỗi, Chọn biểu tượng | ✔ | |
| Mô tả ngắn trên thẻ | Đoạn, ≤ 140 | ✔ | |
| Câu dẫn | Đoạn | ✔ | |
| Kiểu công cụ | Dropdown: Đếm dấu hiệu / Theo nhánh | ✔ | Khóa sau xuất bản |
| Câu hỏi | Danh sách khối `toolQuestion` (đếm dấu hiệu) hoặc `toolBranchQuestion` (theo nhánh) | ✔ 3–8 | |
| Mức kết quả | Danh sách khối `toolResultBand` | ✔ (đếm dấu hiệu) | Xem dưới |
| Hành động khuyến nghị | Danh sách chuỗi | ✔ (đếm dấu hiệu) | Công cụ 1: 4 dòng của đặc tả 6.1 |
| Câu khi trả lời "Không" hết | Đoạn | ✔ (theo nhánh) | |
| Checklist liên quan | Chọn nội dung `checklistPage` | ✔ | Nút Tải PDF, In, Chép đường dẫn là phần cố định của giao diện |

`toolQuestion`: Câu hỏi ✔ (≤ 200) · Giải thích phụ · Trả lời nào là dấu hiệu ✔ (Có / Không). Câu 5 của công cụ 2 ("Có thông tin pháp nhân, giấy phép và hợp đồng rõ ràng không?") đặt "Không" là dấu hiệu. Người dân trả lời Có / Không (đặc tả 11.3), mỗi lần một câu, quay lại được.

`toolResultBand`: Từ ✔ (số dấu hiệu) · Đến (trống là "trở lên") · Nhãn ✔ · Màu ✔ (Xanh lá / Vàng / Cam) · Mô tả. Kiểm khi xuất bản: các khoảng phủ hết từ 0 tới số câu hỏi, không chồng nhau.

| Công cụ | 0 dấu hiệu | 1 dấu hiệu | Từ 2 dấu hiệu |
|---|---|---|---|
| 1. Trước khi chuyển tiền | An toàn tương đối (xanh lá) | Cần kiểm tra thêm (vàng) | Cần dừng lại (cam) |
| 2. Trước khi đầu tư/vay | Cần thẩm định kỹ (vàng) | Rủi ro cao (cam) | Không nên tham gia (cam) |

Ngưỡng của công cụ 2 là giả định: đặc tả 6.2 chỉ nêu 3 nhãn, không nêu ngưỡng. Dùng chung ngưỡng 0 / 1 / từ 2 của công cụ 1; sửa được trong form, không cần lập trình.

`toolBranchQuestion` (công cụ 3): Câu hỏi ✔ · Nhãn tình huống ✔ (ví dụ "Đã chuyển tiền") · Hành động ✔ (danh sách chuỗi) · Trang việc cần làm liên quan (tùy chọn). Kết quả: mỗi câu trả lời "Có" hiện một nhóm hành động theo thứ tự câu hỏi. Bốn nhóm mặc định lấy nguyên văn bảng đặc tả 6.3; Ban biên tập xác nhận câu chữ trước khi xuất bản (QĐ-033).

Không cho Biên tập viên tạo, xóa (đặc tả cố định 3 công cụ). Biên tập viên sửa được câu chữ; Quản trị viên sửa kiểu công cụ và mức kết quả.

### 6.8 Checklist (`checklistPage`, 8 trang)

| Trường | Kiểu nhập | Bắt buộc | Ghi chú |
|---|---|---|---|
| Tiêu đề | Chuỗi | ✔ | "Trước khi vay, bảo lãnh, đứng tên" |
| Biểu tượng | Chọn biểu tượng | ✔ | |
| Bài đọc nguồn | Chọn nội dung `riskArticlePage` | ✔xb | README mục 5: rà lại khi bài đọc đổi phiên bản |
| Nhóm mục | Danh sách khối `checkGroup`: Tiêu đề nhóm, Các dòng (danh sách chuỗi) | ✔ ≥ 1 | |
| Tệp PDF | Chọn tệp (Media PDF) | | QĐ-036. Chế độ LibreOffice: ẩn với Biên tập viên, Quản trị viên dùng để thay tệp tự sinh khi cần. Chế độ tải lên: Biên tập viên thấy và tải tệp |
| Trạng thái PDF tự sinh | Chỉ đọc (do hệ thống ghi) | | Đã sinh lúc… / Đang sinh / Lỗi: … ; có nút "Sinh lại" cho Quản trị viên |
| Phiên bản, Ngày rà soát | Chuỗi, Ngày | ✔xb | |

Danh sách: bảng có cột Tiêu đề, Bài đọc nguồn, Ngày rà soát, Trạng thái. Xóa: chặn khi còn công cụ, chuyên đề, trình hỏi hoặc bài viết trỏ tới.

### 6.9 Các rủi ro (`ruiRoPage`) và Nhóm rủi ro (`riskCategoryPage`, 5)

`ruiRoPage`: chỉ có Tiêu đề và Mô tả; trang chuyển hướng về Cảnh báo mới.

`riskCategoryPage` (Lừa đảo, Vay và nợ, Đầu tư, Bảo hiểm và tiết kiệm, Dữ liệu cá nhân):

| Trường | Kiểu nhập | Bắt buộc | Ghi chú |
|---|---|---|---|
| Tên tab | Chuỗi, ≤ 28 | ✔ | |
| Mô tả ngắn trên thẻ trang chủ | Chuỗi, ≤ 60 | ✔ | `RTABS.s` |
| Câu dẫn đầu trang | Đoạn, ≤ 220 | ✔ | `RTABS.lead` |
| Biểu tượng | Chọn biểu tượng | ✔ | |
| Thủ đoạn hiện trong nhóm | Chọn nhiều `tacticItem` | | Thủ đoạn là thẻ trong danh sách, bấm thì mở bài và tô sáng dòng (bản dựng) |
| Bài ghim đầu danh sách | Chọn nội dung, tối đa 2 | | |
| Câu "Không thấy câu trả lời?" | Đoạn | | Lối sang Hỏi – Đáp |

Không cho tạo, xóa nhóm (đặc tả cố định 6 tab). Thứ tự tab theo thứ tự node.

### 6.10 Cảnh báo (`alertPage`)

Đặc tả 7.4, 4.5, 11.1 và README mục 8. Đây là loại biên tập viên dùng nhiều nhất cùng với Bài viết.

| Tab | Trường | Kiểu nhập | Bắt buộc | Kiểm tra / ghi chú |
|---|---|---|---|---|
| Nội dung | Tiêu đề | Chuỗi | ✔ | ≤ 110 |
| | Mô tả 1 dòng | Đoạn | ✔ | ≤ 160, dùng cho thẻ và mô tả chia sẻ |
| | Mức độ cần thận trọng | Dropdown cố định | ✔ | Thường / Cao / Rất cao |
| | Mức độ phổ biến | Dropdown: Ít gặp / Thường gặp / Rất phổ biến (đề xuất, mục 12) | ✔ | Đặc tả 7.4, QĐ-033 |
| | Căn cứ mức độ phổ biến | Chuỗi | | Ví dụ số liệu của cơ quan nào, ngày nào |
| | Kịch bản thường gặp | Danh sách chuỗi | ✔xb | 3–5 bước (đặc tả 7.4) |
| | Dấu hiệu nhận biết | Chọn nhiều Dấu hiệu phải dừng | | `sg` |
| | Dấu hiệu khác | Danh sách chuỗi | | Khi không có trong danh mục |
| | Việc cần làm: trang | Chọn nội dung `viecCanLamPage` | ✔xb | `pb` |
| | Ảnh minh họa | Chọn ảnh + văn bản thay thế | | Văn bản thay thế ✔ khi có ảnh |
| Nguồn (không bắt buộc, đặc tả 7.4 không có) | Cơ quan ban hành | Chuỗi | | Có thì hiện dòng "Nguồn" dưới tiêu đề |
| | Số văn bản, Ngày văn bản | Chuỗi, Ngày | | |
| | Liên kết văn bản gốc | Liên kết, chỉ nhận `https://` | | |
| Phân loại | Kênh | Chọn nhiều Kênh | ✔xb | `ch` |
| | Đối tượng dễ bị nhắm tới | Chọn nhiều Đối tượng | ✔xb | `gr` |
| | Thủ đoạn liên quan | Chọn nhiều `tacticItem` | | `tac` |
| | Hiện thêm ở nhóm | Chọn nhiều `riskCategoryPage` | | `tabs` |
| | Bài liên quan | Chọn nhiều Bài viết, Checklist, tối đa 4 | | |
| Lịch | Ngày cập nhật | Ngày | ✔ | Dùng tính 90 ngày "mới" |
| | Tự gỡ sau | Số ngày, mặc định 180 | ✔ | README mục 8 |

Danh sách (Collection của `alertListPage`): cột Tiêu đề · Mức độ (chip màu) · Mức độ phổ biến · Ngày cập nhật · Còn mới (≤ 90 ngày) · Trạng thái (Nháp / Đã đăng / Hẹn giờ / Hết hạn). Lọc: trạng thái, mức độ, mức độ phổ biến, kênh. Tìm theo tiêu đề. Thao tác hàng loạt: Xuất bản, Gỡ, Xóa.

Xóa: vào Thùng rác; chặn khi đang được ghim ở trang chủ. Gỡ khỏi website (Hủy xuất bản) là thao tác thường dùng hơn xóa, đặt nút riêng.

### 6.11 Bài viết (`riskArticlePage`, thay `article`)

Đặc tả 7.2, 7.3. Một loại cho cả bài hướng dẫn, bài đọc chuyên đề, bài đọc thêm; phân biệt bằng trường Loại bài.

| Tab | Trường | Kiểu nhập | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| Nội dung | Tiêu đề | Chuỗi | ✔ | ≤ 110 |
| | Loại bài | Dropdown: Bài hướng dẫn / Bài đọc chuyên đề / Bài đọc thêm | ✔ | Nhãn trên thẻ |
| | Mô tả 1 dòng | Đoạn, ≤ 160 | ✔ | Thẻ bài |
| | Biểu tượng hoặc ảnh thẻ | Chọn biểu tượng / Chọn ảnh | ✔ một trong hai | |
| | Tóm tắt | Soạn thảo hạn chế | ✔xb | Phần 1 của mẫu bài |
| | Dấu hiệu cảnh báo | Danh sách chuỗi | ✔xb (bài hướng dẫn) | |
| | Kịch bản thường gặp | Danh sách khối `scenarioItem` (Tên thủ đoạn tùy chọn, Các bước) | | Thủ đoạn tô sáng được khi mở từ danh sách |
| | Việc cần làm ngay | Danh sách chuỗi + Trang việc cần làm (chọn) | ✔xb (bài hướng dẫn) | |
| | Việc không nên làm | Danh sách chuỗi | | |
| | Nội dung đọc thêm | Danh sách khối `readingBlock` | | Bài đọc chuyên đề, bài đọc thêm (xem mục 7) |
| | Nguồn tham khảo | Danh sách khối `sourceItem` | ✔xb | Tên tài liệu, Đơn vị, Liên kết, Ngày truy cập |
| Phân loại | Chuyên đề | Chọn 1 Chuyên đề | | |
| | Kênh, Đối tượng | Chọn nhiều | ✔xb | Bộ lọc danh sách (đặc tả 7.2) |
| | Mức độ | Dropdown cố định | ✔xb | Nhãn trên thẻ |
| | Hiện thêm ở nhóm | Chọn nhiều `riskCategoryPage` | | |
| | Từ khóa tìm kiếm, từ đồng nghĩa | Tags | | Bản dựng có `k` cho thủ đoạn, `SYN` cho từ đồng nghĩa |
| | Bài liên quan | Chọn nhiều, tối đa 4 | | Để trống thì lấy tự động cùng nhóm |
| | Checklist PDF | Chọn `checklistPage` | | Nút "Tải checklist PDF" |
| | Nổi bật | Bật/tắt | | Đặc tả 11.1 |
| Thẩm định | Phiên bản | Chuỗi | | Ví dụ 2.7 |
| | Ngày rà soát, Người thẩm định | Ngày, Chuỗi | ✔xb | Điều 33: chặn xuất bản khi thiếu |

Thời gian đọc tính tự động (số chữ / 200, làm tròn lên), không có trường nhập. Ngày đăng lấy ngày xuất bản đầu; ngày cập nhật lấy trường ở `publishMeta`.

Danh sách (Collection của mỗi `riskCategoryPage`): cột Tiêu đề · Loại bài · Mức độ · Ngày cập nhật · Ngày rà soát · Trạng thái · Người sửa cuối. Lọc: loại bài, mức độ, trạng thái, quá hạn rà soát. Mẫu nội dung (blueprint) cho từng loại bài, điền sẵn tiêu đề các phần.

### 6.12 Thủ đoạn (`tacticItem`, không có trang)

31 mục (`TACTICS`). Hiện thành thẻ trong danh sách Các rủi ro, là tên tình huống trong kết quả trình hỏi.

| Trường | Kiểu nhập | Bắt buộc |
|---|---|---|
| Tên thủ đoạn | Chuỗi, ≤ 140 | ✔ |
| Chuyên đề | Chọn 1 Chuyên đề | ✔ |
| Bài viết chứa thủ đoạn | Chọn 1 `riskArticlePage` | ✔ |
| Neo trong bài | Chuỗi (mã khối `scenarioItem`) | |
| Kênh | Chọn nhiều Kênh | ✔ |
| Mức độ | Dropdown cố định | ✔ |
| Từ khóa tìm kiếm | Tags | |

Xóa: chặn khi quy tắc trình hỏi, cảnh báo, đối tượng hoặc nhóm rủi ro còn trỏ tới. README mục 7: Ban biên tập phải xác nhận kênh, đối tượng, mức độ của cả 31 mục trước khi lên.

### 6.13 Composition dùng chung

`seoShare` (sửa từ `seoBase`, đặc tả mục 12):

| Trường | Kiểu nhập | Ghi chú |
|---|---|---|
| Tiêu đề SEO | Chuỗi, ≤ 60 | Trống thì lấy Tiêu đề |
| Mô tả SEO | Đoạn, ≤ 160 | Trống thì lấy Mô tả 1 dòng |
| Ảnh chia sẻ | Chọn ảnh, 1200×630 | Trống thì dùng ảnh mặc định |
| Ẩn khỏi tìm kiếm, sơ đồ trang | Bật/tắt | |
| Đường dẫn chuẩn | Chuỗi | Trống thì tự đặt |

`publishMeta`: Ngày cập nhật hiển thị (Ngày). Hẹn giờ đăng và gỡ dùng chức năng lịch có sẵn của Umbraco, không thêm trường. Lịch sử chỉnh sửa dùng tab Lịch sử có sẵn (đặc tả 11.1).

### 6.14 Các trang còn lại

| Loại | Trường chính | Ghi chú |
|---|---|---|
| `alertListPage` Cảnh báo mới | Tiêu đề, Câu dẫn, Câu "Mẫu trình bày" (bật/tắt) | Lọc thêm theo ngày cập nhật (chỉ tab này có, README) |
| `quickQaItem` Hỏi – đáp nhanh | Câu hỏi ✔, Trả lời ngắn ✔, Vì sao (soạn thảo hạn chế), Việc cần làm, Trang liên quan (chọn tối đa 2), Đã duyệt bởi ✔xb | Sửa từ `qaItem` (hiện chỉ có `question`, `answer`). Hiện ở trang Hỏi – Đáp, dạng accordion |
| `hoiDapPage` | Đầu trang, câu giải thích hai ô đồng ý, câu sau khi gửi | Câu hỏi gửi kín đi vào CSDL qua API đã có, quản lý ở khu Hỏi – Đáp của backoffice, không phải nội dung Umbraco |
| `lienHePage` Liên hệ đúng nơi | Danh sách khối `contactGroup` (Nhóm, Đơn vị, Cách liên hệ, Nguồn, Ngày kiểm) | 5 nhóm nguồn kiểm chứng (README mục 12) |
| `gopYPage` Góp ý | Câu dẫn, Tiêu chí xét thưởng (soạn thảo), Bật xét thưởng | Biểu mẫu gửi qua API mới `/feedback` |
| `infoPage` | Tiêu đề, Câu dẫn, Nội dung (Soạn thảo), Mục còn chỗ trống | Về website, Nguyên tắc nội dung, Xác minh đúng trang |
| `policyPage` | Tiêu đề, Dòng phiên bản ("Bản dự thảo · ngày ban hành"), Nội dung (Soạn thảo có khối Ghi chú) | 5 văn bản `POL`. Sửa từ `policyContent` |
| `sharedSnippet` | Tiêu đề hộp, Nội dung (Soạn thảo hạn chế) | `BANKBOX`, `RECOV`, `COVER`, `LEGIT`, `COND` |

## 7. Element type cho Block List

| Element | Trường | Dùng ở |
|---|---|---|
| `principleItem` | Biểu tượng, Tiêu đề ≤ 40 ✔, Giải thích ≤ 120 ✔ | Cài đặt website |
| `linkItem` | Nhãn ✔, Liên kết ✔ (nội bộ hoặc ngoài) | Chân trang, nút cuối trang |
| `doorItem`, `doorOption` | Mục 6.3 | Khẩn cấp |
| `hotlineItem` | Mục 6.3 | Khẩn cấp |
| `wizardOption` | Mục 6.4. Quy tắc nằm ở property editor ma trận, không phải element | Trình hỏi |
| `stepItem`, `branchItem`, `snippetRef`, `questionList` | Mục 6.5 | Việc cần làm |
| `toolQuestion`, `toolBranchQuestion`, `toolResultBand` | Mục 6.7 | Công cụ |
| `checkGroup` | Mục 6.8 | Checklist |
| `scenarioItem` | Mã neo, Tên thủ đoạn, Các bước (danh sách chuỗi) | Bài viết |
| `sourceItem` | Tên tài liệu ✔, Đơn vị, Liên kết, Ngày truy cập | Bài viết |
| `readingBlock` (6 kiểu con) | Đoạn văn · Tiêu đề phụ · Hộp ghi nhớ (Câu hỏi của bài / Nhớ một câu / Hiểu nhanh) · Bảng · Trường hợp thật · Bỏ túi | Bài đọc chuyên đề: `DOCS` có các khối `now, box, h, p, tbl, chips, st, stop, pocket, dolo, nofault, case, recov, end` |
| `contactGroup` | Mục 6.14 | Liên hệ |

Mọi khối đặt **nhãn theo nội dung** (ví dụ `Bước · {{ cauChinh }}`) và **ảnh minh họa**, theo ND-01 trong `3-don-gian-hoa-quan-ly-noi-dung.md`.

## 8. Quy tắc phía máy chủ cần code

| # | Quy tắc | Nguồn | Cách làm |
|---|---|---|---|
| 1 | Chặn xuất bản khi thiếu trường ✔xb | README "Dành cho đơn vị kỹ thuật", QĐ-031 | `ContentPublishingNotification` + ô BO-19 trong trình soạn |
| 2 | Cảnh báo chỉ "mới" trong 90 ngày, tự gỡ sau 180 ngày | Điều 20, README mục 8 | Truy vấn theo Ngày cập nhật; tác vụ nền hằng ngày hủy xuất bản cảnh báo quá hạn |
| 3 | Dấu quá hạn rà soát 90 ngày | README "Dấu rà soát" | Tính khi dựng trang |
| 4 | Đổi đường dẫn thì giữ chuyển hướng | Đặc tả mục 12 | Bộ chuyển hướng URL có sẵn của Umbraco; bảng `ALIAS` của bản dựng cho đường dẫn cũ `#pb2`… |
| 5 | Chặn xóa khi còn tham chiếu | Mục 5, 6 | `Umbraco:CMS:Content:DisableDeleteWhenReferenced = true` + kiểm riêng cho mã trình hỏi |
| 6 | PDF checklist | Đặc tả 11.1, 11.3, QĐ-036 | LibreOffice sinh PDF lúc xuất bản; không có LibreOffice thì dùng tệp tải lên; bản in A4 làm đường lùi (mục 12) |
| 7 | Sitemap, robots, Schema.org Article, FAQPage, BreadcrumbList, WebSite | Đặc tả mục 12 | View Razor + trang `sitemap.xml` |
| 8 | Ba biểu mẫu gửi về máy chủ | README "Nối máy chủ" | `/questions` đã có (Hỏi – Đáp); `/feedback` mới; `/registrations` thuộc Cuộc thi đã có |
| 9 | Tìm kiếm chịu lỗi gõ, từ đồng nghĩa, chặn tra số | Đặc tả 11.4, Điều 4 | Examine/Lucene với trường từ khóa; chặn chuỗi toàn chữ số ≥ 6 ký tự |

## 9. Quyền (QĐ-035)

Hai nhóm, đúng mức tối thiểu của đặc tả 11.1. Không có bước gửi duyệt; ô "Kiểm tra trước khi xuất bản" chặn bài thiếu thông tin (QĐ-031).

| Quyền | Quản trị viên | Biên tập viên |
|---|---|---|
| Khu được vào | Nội dung, Phương tiện, Hỏi – Đáp, Cài đặt, Người dùng | Nội dung, Phương tiện, Hỏi – Đáp |
| Cảnh báo, Bài viết, Checklist, Hỏi – đáp nhanh, Thủ đoạn, mục danh mục | Toàn quyền | Tạo, sửa, xuất bản, hẹn giờ, gỡ, xóa vào Thùng rác |
| Câu chữ trên Trang chủ, Khẩn cấp, Công cụ, Việc cần làm, Nhóm rủi ro | Toàn quyền | Sửa, xuất bản. Không tạo, xóa, di chuyển |
| Cài đặt website | Mọi tab | Chỉ tab "Hay sửa" và "Chân trang" |
| Ma trận trình hỏi, kiểu công cụ và mức kết quả, kiểu dữ liệu cố định | Có | Không thấy |
| Khôi phục phiên bản, làm rỗng Thùng rác | Có | Khôi phục phiên bản: có. Làm rỗng Thùng rác: không |

Cách cấu hình: 2 user group; quyền theo node (Browse, Update, Publish; không Create/Delete trên trang cố định); quyền theo trường (`DocumentPropertyValuePermission`) để ẩn các tab ít sửa và các trường do Quản trị viên quản lý. Nhóm `quanTriCuocThi` giữ nguyên, gán thêm cho người phụ trách cuộc thi.

## 10. Ánh xạ với cấu hình đang có

| Hiện có | Đề xuất |
|---|---|
| `antc` (39 trường) | Sửa thành `siteSettings`, chia lại tab (mục 6.1). Bỏ `menu`, `footerMenu` dạng tự do vì menu cố định 3 mục |
| `home`, `ungPhoPage`, `thuDoanPage`, `thamGiaPage` (trường Bố cục Block Grid) | Thay bằng `homePage`, `khanCapPage`, `congCuPage`, `ruiRoPage`. Nội dung `ungPho` chuyển sang Việc cần làm; `thuDoan` sang Nhóm rủi ro và Thủ đoạn |
| `article`, `articleList`, `articleManagement`, `contentManagement`, `pageManagement` | `article` thành `riskArticlePage`; `articleList` thành `riskCategoryPage`; các thư mục quản lý bỏ |
| `fraudContent` (40 trường), `policyContent` | `fraudContent` bỏ; `policyContent` thành `policyPage` |
| `qaItem` | Thành `quickQaItem`, thêm trường |
| `seoBase` | Thành `seoShare`, thêm Đường dẫn chuẩn |
| 72 loại khối | Giữ các khối của Cuộc thi (`contest*`, `competition*`) và Hỏi – Đáp nếu trang đó giữ Block Grid; còn lại bỏ, thay bằng 16 element ở mục 7 |
| `thiPage`, `thiThangPage`, `thiThuPage`, `cuocThiLamBaiPage`, `hoiDapPage`, `searchPage`, `notFoundPage` | Giữ |

Khi xóa document type trong uSync, giữ các file `<Empty … Change="Delete">` sinh ra (quy ước nhóm). Cần kế hoạch chuyển dữ liệu 40 bài đang có.

## 11. Ảnh hưởng tới mockup backoffice trong `ban-giao`

| Phần | Dùng lại | Phải vẽ lại |
|---|---|---|
| Màu lục bảo, Roboto (QĐ-028), thanh trên, trình soạn hai cột, khung Xuất bản, ô Kiểm tra trước khi xuất bản, Xem trước khi chia sẻ | Có | |
| Cây nội dung `07-noi-dung-soan-bai.png` (Quản lý trang: Ứng phó, Thủ đoạn, Tham gia; Quản lý nội dung: Bài viết, Câu chuyện thật) | | Theo cây ở mục 4: Trang chủ › Khẩn cấp / Công cụ & checklist / Các rủi ro; Thư viện |
| Form soạn bài (một ô Nội dung lớn) | | Chia theo 7 phần mẫu bài (mục 6.11) và form Cảnh báo (mục 6.10) |
| Màn Thao tác nhanh (ND-05) | | Nút mới: Viết cảnh báo · Viết bài vào nhóm… · Sửa số cần biết · Sửa bốn nguyên tắc · Cảnh báo sắp hết hạn · Trang quá hạn rà soát |
| Khu Cuộc thi, Hỏi – Đáp | Có | |

## 12. Đã chốt và còn chờ

| # | Vấn đề | Trạng thái |
|---|---|---|
| 1 | Cấu trúc 3 mục, bỏ Block Grid ở trang chính | Chốt, QĐ-032 |
| 2 | Bảy chỗ bản dựng làm khác đặc tả | Chốt theo đặc tả, QĐ-033 |
| 3 | Quy tắc trình hỏi | Chốt màn ma trận, QĐ-034 |
| 4 | Vai trò | Chốt 2 nhóm, QĐ-035 |
| 5 | PDF checklist | Chốt, QĐ-036: LibreOffice trước, lùi về tệp tải lên. Hạ tầng production chưa rõ |
| 6 | Cảnh báo: chỉ nhận liên kết `.gov.vn`? Tự gỡ sau 180 ngày? | Còn mở. Theo QĐ-033 nhóm Nguồn không bắt buộc, nên đề xuất bỏ giới hạn `.gov.vn`; giữ tự gỡ sau 180 ngày bằng tác vụ nền |
| 7 | Giá trị của "Mức độ phổ biến" | Còn mở. Đặc tả 7.4 không nêu giá trị. Đề xuất Dropdown: Ít gặp / Thường gặp / Rất phổ biến, kèm ô "Căn cứ" không bắt buộc |
| 8 | Ngưỡng kết quả công cụ 2 | Giả định 0 / 1 / từ 2 (mục 6.7), sửa được trong form |
| 9 | Phần ngoặc vuông trong bản dựng (pháp nhân, đầu mối, nguồn, ngày rà soát) | Khách cung cấp trước khi nhập nội dung thật |

### PDF checklist (QĐ-036)

Hạ tầng production chưa rõ, có thể chỉ là gói hosting. Vì vậy dịch vụ PDF có ba chế độ, chọn bằng cấu hình, không phải sửa code khi biết hạ tầng thật.

| Chế độ | Khi nào | Nút "Tải checklist PDF" |
|---|---|---|
| `LibreOffice` (mặc định) | Máy chủ có `soffice` | Tải tệp tự sinh của phiên bản đang đăng |
| `Upload` | Không cài được LibreOffice | Tải tệp biên tập viên đã tải lên |
| Bản in A4 | Luôn có | Dùng khi chưa có tệp, hoặc khi sinh lỗi; nút In luôn mở bản này |

Cấu hình đề xuất trong `appsettings`:

```json
"Checklist": {
  "Pdf": {
    "Mode": "LibreOffice",
    "SofficePath": "",
    "TimeoutSeconds": 60,
    "TemplatePath": "App_Data/pdf/checklist-mau.docx",
    "OutputFolder": "App_Data/pdf/out"
  }
}
```

Khi khởi động, dịch vụ tìm `soffice` (theo `SofficePath`, rồi theo PATH). Không thấy thì tự chạy chế độ `Upload`, ghi cảnh báo vào log, và trang `checklistPage` trong backoffice hiện dòng "Máy chủ chưa có LibreOffice: hãy tải tệp PDF lên".

Luồng sinh PDF ở chế độ `LibreOffice`:

1. Checklist được xuất bản thì đưa việc vào hàng đợi chạy nền (`ContentPublishedNotification`). Không sinh lúc người dân bấm tải.
2. Điền nội dung vào mẫu `checklist-mau.docx` bằng OpenXML (giấy phép MIT): tiêu đề, các nhóm, các dòng có ô vuông, ngày cập nhật, bốn nguyên tắc dừng, câu bắt buộc 5.6, tên website.
3. Gọi `soffice --headless --convert-to pdf` với hồ sơ người dùng riêng (`-env:UserInstallation`), mỗi lần một tiến trình, quá `TimeoutSeconds` thì dừng tiến trình.
4. Lưu tệp theo khóa trang và số phiên bản; ghi "Trạng thái PDF tự sinh". Lỗi thì nút tải tạm dùng bản in A4 và báo trên trang trong backoffice.
5. Quản trị viên có nút "Sinh lại". Tệp tải lên (nếu có) được ưu tiên hơn tệp tự sinh, để Quản trị viên thay khi cần.

Mẫu `.docx` do Ban biên tập sửa bằng Word. Cần cài font Be Vietnam Pro trên máy chủ và kiểm tra chữ có dấu trong PDF.

Ước lượng: bản in A4 và trường tải lên khoảng 1,5 ngày; dịch vụ LibreOffice, hàng đợi, mẫu `.docx` khoảng 2 ngày.

## 13. Chia việc

| Mã | Việc | Phụ thuộc |
|---|---|---|
| V2-01 | Kiểu dữ liệu cố định (Mức độ Thường/Cao/Rất cao, Loại bài, Kiểu công cụ, Mức độ phổ biến…) và danh mục: Kênh, Đối tượng, Dấu hiệu, Chuyên đề | – |
| V2-02 | `siteSettings`, composition `seoShare`, `publishMeta` | V2-01 |
| V2-03 | `riskCategoryPage`, `riskArticlePage`, `tacticItem`, Collection bài viết | V2-01 |
| V2-04 | `alertListPage`, `alertPage` (có Mức độ phổ biến), Collection cảnh báo, tác vụ 90/180 ngày | V2-01 |
| V2-05 | `viecCanLamPage` và 4 khối | V2-01 |
| V2-06 | `khanCapPage`, `homePage` | V2-04, V2-05 |
| V2-07a | `wizardPage`: tab Câu hỏi, tab Kết quả | V2-03 |
| V2-07b | Property editor "Ma trận tình huống" (bảng, ngăn chi tiết, thử kết quả) và kiểm phía máy chủ; review riêng | V2-07a |
| V2-08 | `congCuPage`, `toolPage` (đếm dấu hiệu, theo nhánh, mức kết quả), `checklistPage` | V2-05 |
| V2-08b | Bản in A4 (checklist, công cụ, kết quả trình hỏi) và trường Tệp PDF, chế độ `Upload` | V2-08 |
| V2-08c | Dịch vụ PDF chế độ `LibreOffice`: mẫu `.docx`, OpenXML, hàng đợi, tự chuyển chế độ khi thiếu `soffice` | V2-08b |
| V2-00 | Xác minh hạ tầng production: hệ điều hành, có được cài LibreOffice và font không. Kết quả quyết định bật V2-08c | – |
| V2-09 | Trang chân trang: `infoPage`, `policyPage`, `lienHePage`, `gopYPage`, `quickQaItem` | V2-02 |
| V2-10 | Ô kiểm trước khi xuất bản theo từng loại (mở rộng BO-19) | V2-03 → V2-08 |
| V2-11 | Hai nhóm quyền, quyền theo trường (QĐ-035) | V2-02 → V2-08 |
| V2-12 | Chuyển dữ liệu 40 bài và nội dung bản dựng (`data.json`) vào Umbraco; nhập câu hỏi công cụ, trình hỏi theo nguyên văn đặc tả | V2-03 → V2-09 |
| V2-13 | View Razor theo mockup portal | Từng loại tương ứng |
