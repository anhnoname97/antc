# Cây trang và nội dung Umbraco

Thiết kế cập nhật theo yêu cầu ngày 15/10/2026 và bản HTML trong `docs/ban-dung/an-toan-tai-chinh-website.html`. Phạm vi hiện tại là cấu trúc CMS, dữ liệu mẫu và khung hiển thị dùng chung. Chưa dựng các khối Block Grid của từng trang.

## Cây hiện tại

```text
An toàn tài chính (antc)
├── Quản lý trang (pageManagement)
│   └── Trang chủ (home)
│       ├── Ứng phó khẩn cấp (ungPhoPage)
│       ├── Thủ đoạn (thuDoanPage)
│       ├── Tham gia (thamGiaPage)
│       ├── Thử sức: 8 câu (thiThuPage)
│       ├── Cuộc thi trực tuyến (thiPage)
│       ├── Hỏi – Đáp (hoiDapPage)
│       ├── Tìm kiếm (searchPage)
│       └── Chính sách (chinhSachPage)
└── Quản lý nội dung (contentManagement)
    ├── Thủ đoạn (articleManagement)
    │   ├── Cuộc gọi, tin nhắn, giả mạo (articleList)
    │   │   └── Bài mẫu: Cuộc gọi, tin nhắn, giả mạo (article)
    │   ├── Mua bán, đặt cọc (articleList)
    │   │   └── Bài mẫu: Mua bán, đặt cọc (article)
    │   ├── Việc làm, làm thêm (articleList)
    │   │   └── Bài mẫu: Việc làm, làm thêm (article)
    │   ├── Đầu tư, góp vốn (articleList)
    │   │   └── Bài mẫu: Đầu tư, góp vốn (article)
    │   ├── Vay, nợ (articleList)
    │   │   └── Bài mẫu: Vay, nợ (article)
    │   ├── Hợp đồng, dịch vụ (articleList)
    │   │   └── Bài mẫu: Hợp đồng, dịch vụ (article)
    │   ├── Cảnh báo (articleList)
    │   │   ├── Ứng dụng giả mạo dịch vụ công dụ người dân cài đặt (article)
    │   │   └── Mời góp vốn qua ứng dụng cam kết lợi nhuận cố định (article)
    │   ├── Bài đọc theo chuyên đề (articleList)
    │   └── Lừa đảo: Từ cổ chí kim (articleList)
    └── Chính sách (articleList)
        ├── Tuyên bố miễn trừ trách nhiệm (article)
        ├── Chính sách bảo vệ dữ liệu cá nhân (article)
        ├── Chính sách tài trợ (article)
        ├── Nguyên tắc dẫn nguồn (article)
        └── Cách báo lỗi và cải chính (article)
```

**An toàn tài chính** là nút gốc chứa thông tin dùng chung. **Quản lý trang → Trang chủ** chứa các trang hiển thị; **Quản lý nội dung** chứa kho dữ liệu. Nút Thủ đoạn trong cây trang và nút cùng tên trong kho nội dung có vai trò khác nhau.

- Trang Thủ đoạn và trang Chính sách: Bố cục Block Grid và SEO.
- Kho Thủ đoạn: collection gồm 9 danh mục; mỗi danh mục là collection bài viết.
- Kho Chính sách: collection gồm 5 văn bản, cùng thông tin liên quan của từng văn bản.
- `articleList` và `article` là dữ liệu danh mục/bài viết, không có trường Bố cục.
- Trang Cuộc thi chỉ có Bố cục và SEO; đã bỏ nhóm Cài đặt cuộc thi.
- Trang Hỏi – Đáp chỉ có Bố cục và SEO; không cho tạo câu hỏi đáp con. Đã bỏ `qaItem` và hai mục FAQ nhập tay.

Chín loại trang có `layout`: `home`, `ungPhoPage`, `thuDoanPage`, `thamGiaPage`, `thiThuPage`, `thiPage`, `hoiDapPage`, `chinhSachPage`, `searchPage`. Tất cả thuộc tính này đang để trống; data type Block Grid chưa cấu hình khối. Bài viết vẫn có template chi tiết chung để FE phát triển sau.

Quản lý nội dung vẫn mở rộng được trên cây trái. Các collection Thủ đoạn, danh mục và Chính sách mở danh sách ở vùng bên phải, giúp quản lý số lượng bài lớn. Các nút tổ chức là document, không phải thư mục document type.

## Thông tin dùng chung

| Tab trên An toàn tài chính | Nội dung |
| --- | --- |
| Thông tin chung | Tên website, pháp nhân, địa chỉ, liên hệ, cờ bản dựng thử, 4 số khẩn cấp, nguồn kiểm chứng và 5 ảnh hero |
| Đầu trang | Logo, chữ mô tả logo, menu chính, nút nổi bật, bật/tắt và nội dung dải thông báo, liên kết thông báo |
| Chân trang | Logo, nội dung giới thiệu, điều hướng, liên kết chính sách, ghi chú dự thảo, bản quyền, ghi chú bản dựng thử và nhóm tài trợ |

`menu` và `footerMenu` dùng Block List liên kết trang. Biên tập viên thêm, sửa, xóa hoặc kéo thả thứ tự. Mỗi mục có chữ hiển thị và một trang đích. Picker chỉ mở từ Trang chủ và chỉ cho chọn 9 loại trang hiển thị. `footerPolicies` dùng Block List riêng; picker chỉ mở trong kho Chính sách và chỉ nhận bài viết. Không mở toàn bộ cây để chọn liên kết.

Nội dung ban đầu lấy từ header/footer của bản HTML: 5 mục menu, nút Làm ngay, 5 liên kết chính sách, ghi chú dự thảo, tài trợ và bản quyền. HTML dùng chữ thương hiệu thay ảnh logo, nên hai trường logo để trống và khung trang dùng tên website. Giá trị pháp nhân/địa chỉ thật vẫn là giữ chỗ. Dải thông báo có nội dung mẫu nhưng đang tắt. Mục menu “Cuộc thi” dẫn tới trang Tham gia (`thamGiaPage`), tương ứng liên kết `v2-tham-gia.html` trong HTML.

Khung `_SiteLayout.cshtml` đọc đầu trang/chân trang từ nút gốc; menu và liên kết không còn viết cứng trong Razor. `_SharedLinks.cshtml` đọc tham chiếu nội dung và URL do Umbraco cung cấp. Các Block List này là dữ liệu cấu hình dùng chung; không tạo bố cục Block Grid hoặc đặt khối vào trang.

## Hỏi – Đáp và Cuộc thi

Hỏi – Đáp là luồng **người dùng gửi biểu mẫu → tiếp nhận → kiểm duyệt → biên tập câu trả lời → công bố/trả lời**. Bảng nghiệp vụ `question_submission` trong `App_Data/app.sqlite.db` là nơi tiếp nhận, không dùng cây CMS để tự tạo câu hỏi giả làm câu hỏi của người dùng.

Theo lựa chọn hiện tại, lượt thay đổi này chỉ sửa cấu trúc: chưa triển khai form, API gửi câu hỏi, màn hình kiểm duyệt hoặc chức năng trả lời. Bảng tiếp nhận và dữ liệu câu hỏi nghiệp vụ được giữ nguyên. Các trường phục vụ trả lời/công bố sẽ được bổ sung khi triển khai luồng đó.

Trang Cuộc thi hiện là trang khung, vẫn đang lưu nháp. Cấu hình nghiệp vụ cuộc thi không còn thuộc document `thiPage`. Khi triển khai chức năng cuộc thi, nhóm BE cần xác định nguồn cấu hình nghiệp vụ riêng; provider đang có sẽ không lấy được lịch mở/đóng từ các trường đã bỏ.

## URL và quy tắc cây

URL công khai dùng `/`, `/ung-pho/`, `/thu-doan/`, `/tham-gia/`, `/thu-suc/`, `/cuoc-thi/`, `/hoi-dap/`, `/chinh-sach/`, `/tim-kiem/`. Bài viết và danh mục dùng slug do Umbraco tạo theo tên. Các nút quản lý không xuất hiện trong URL. `/chinh-sach/` mở `chinhSachPage`; bài viết chính sách dùng `/chinh-sach/{slug}/`.

Xem URL trong tab Thông tin của Umbraco. Không có trường `umbracoUrlName` tự thêm hoặc tab Thiết lập. `PageTreeRules`/`PageTreeNotifications` chặn tạo trùng các trang cố định và đặt sai cây. Bốn trường SEO dùng chung qua `seoBase`.

## Đồng bộ và dữ liệu

Toàn bộ cấu trúc, template, nội dung và Media được xuất qua `uSync/v18/`. File có gốc `Empty` và `Change="Delete"` ghi nhận việc bỏ FAQ nhập tay để các máy khác áp dụng cùng thay đổi; không xóa các file này như file rác. 57 Block của mã vừa pull được giữ nguyên.

Các bài viết/danh mục còn lại, 4 số khẩn cấp, 5 ảnh hero, 200 câu hỏi thuộc 8 chuyên đề và dữ liệu nghiệp vụ được giữ lại. Bài chính sách vẫn có cờ dự thảo, nội dung bài để trống. Không đưa bản sao DB hoặc mật khẩu vào Git.

## Thuộc tính đầy đủ

Các loại trang/danh mục/bài viết kế thừa trường SEO theo composition đã khai báo. Bảng dưới liệt kê thuộc tính riêng của từng loại. Block List dùng Element Type; Element Type không tạo thành nút trong cây trang.

### An toàn tài chính (`antc`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Thông tin chung | Tên site | `siteName` | Textstring | Có | Tên site: antoantaichinh.vn |
| Thông tin chung | Hiện dòng “BẢN DỰNG THỬ” | `showPreviewBanner` | True/false | Không | Bật dòng “BẢN DỰNG THỬ” ở dải trên, dải bản quyền và hậu tố tiêu đề; khi bật thì chặn công cụ tìm kiếm. |
| Thông tin chung | Đơn vị vận hành | `operatorName` | Textstring | Có | Tên đơn vị vận hành (bản dựng: “Công ty ABC” / [Pháp nhân chủ quản]). |
| Thông tin chung | Cơ quan thẩm định nội dung | `reviewerName` | Textstring | Có | Cơ quan thẩm định nội dung (bản dựng: Công an xã Thiên Lộc). |
| Thông tin chung | Địa chỉ trụ sở | `operatorAddress` | Textstring | Có | Địa chỉ trụ sở. |
| Thông tin chung | Mã số doanh nghiệp | `operatorTaxCode` | Textstring | Có | Mã số doanh nghiệp. |
| Thông tin chung | Đầu mối dữ liệu cá nhân | `dataContact` | Textarea | Có | Đầu mối yêu cầu về dữ liệu cá nhân (họ tên hoặc chức danh · thư điện tử · địa chỉ). |
| Thông tin chung | Đầu mối cho cơ quan nhà nước | `authorityContact` | Textarea | Có | Đầu mối dành cho cơ quan nhà nước (họ tên · số điện thoại · thư điện tử). |
| Thông tin chung → Số khẩn cấp | 4 thẻ số khẩn cấp | `emergencyNumbers` | Số khẩn cấp · Đúng 4 thẻ | Có | Mỗi mục: nhãn, số hoặc tên, mô tả, bật nút Gọi, bật nút Nhắn tin, chữ trên nút gọi. |
| Thông tin chung → Số khẩn cấp | Ngày kiểm chứng gần nhất | `numbersVerifiedDate` | Date Picker | Có | Ngày kiểm chứng gần nhất. |
| Thông tin chung → Số khẩn cấp | Nguồn kiểm chứng | `numbersSource` | Textstring | Có | Nguồn kiểm chứng (văn bản hoặc cổng thông tin chính thức). |
| Thông tin chung → Ảnh hero | Ảnh slide 1 | `heroImage1` | Image Media Picker | Có | 5 ảnh nền của 5 slide; cũng dùng cho hero các trang con. Ảnh nền số 1. |
| Thông tin chung → Ảnh hero | Ảnh slide 2 | `heroImage2` | Image Media Picker | Có | 5 ảnh nền của 5 slide; cũng dùng cho hero các trang con. Ảnh nền số 2. |
| Thông tin chung → Ảnh hero | Ảnh slide 3 | `heroImage3` | Image Media Picker | Có | 5 ảnh nền của 5 slide; cũng dùng cho hero các trang con. Ảnh nền số 3. |
| Thông tin chung → Ảnh hero | Ảnh slide 4 | `heroImage4` | Image Media Picker | Có | 5 ảnh nền của 5 slide; cũng dùng cho hero các trang con. Ảnh nền số 4. |
| Thông tin chung → Ảnh hero | Ảnh slide 5 | `heroImage5` | Image Media Picker | Có | 5 ảnh nền của 5 slide; cũng dùng cho hero các trang con. Ảnh nền số 5. |
| Đầu trang | Logo đầu trang | `logoHeaderImage` | Image Media Picker | Không | Chọn logo nếu có; để trống để dùng tên website dạng chữ. |
| Đầu trang | Mô tả logo đầu trang | `headerLogoAlt` | Textstring | Không | Mô tả ngắn của logo cho người dùng trình đọc màn hình. |
| Đầu trang | Menu chính | `menu` | Điều hướng · Danh sách liên kết | Không | Thêm, sửa, xóa và kéo thả thứ tự các liên kết trên menu đầu trang. |
| Đầu trang | Nút nổi bật đầu trang | `headerCta` | Điều hướng · Một liên kết | Không | Một nút nổi bật, ví dụ Làm ngay dẫn đến trang Ứng phó khẩn cấp. |
| Đầu trang | Hiện dải thông báo | `showHeaderAnnouncement` | True/false | Không | Bật để hiển thị dải thông báo phía trên menu. |
| Đầu trang | Nội dung dải thông báo | `headerAnnouncementText` | Textarea | Không | Nội dung thông báo dùng chung; chỉ hiển thị khi bật dải thông báo. |
| Đầu trang | Liên kết dải thông báo | `headerAnnouncementLink` | Điều hướng · Một liên kết | Không | Chọn một trang mà người đọc sẽ mở từ dải thông báo. |
| Chân trang | Đoạn mô tả ở footer | `footerText` | Textarea | Có | Đoạn mô tả ở cột 1 của footer. |
| Chân trang → Tài trợ | Hiện đơn vị tài trợ | `sponsorShow` | True/false | Không | Có hiển thị hộp đơn vị tài trợ ở footer. |
| Chân trang | Logo chân trang | `logoFooterImage` | Image Media Picker | Không | Logo tại chân trang; để trống để dùng tên website dạng chữ. |
| Chân trang → Tài trợ | Tên đơn vị tài trợ | `sponsorName` | Textstring | Không | Tên đơn vị tài trợ. |
| Chân trang | Mô tả logo chân trang | `footerLogoAlt` | Textstring | Không | Mô tả ngắn của logo chân trang. |
| Chân trang → Tài trợ | Logo đơn vị tài trợ | `sponsorLogo` | Image Media Picker | Không | Logo đơn vị tài trợ (hiển thị 88×44px). |
| Chân trang | Tiêu đề nhóm điều hướng | `footerMenuTitle` | Textstring | Không | Tiêu đề của nhóm liên kết điều hướng ở chân trang. |
| Chân trang | Liên kết điều hướng chân trang | `footerMenu` | Điều hướng · Danh sách liên kết | Không | Các trang được liên kết ở chân trang; có thể sửa độc lập với menu đầu trang. |
| Chân trang | Tiêu đề nhóm chính sách | `footerPoliciesTitle` | Textstring | Không | Ví dụ Quy định. |
| Chân trang | Liên kết chính sách | `footerPolicies` | Chân trang · Liên kết chính sách | Không | Chỉ chọn văn bản trong kho Chính sách; kéo thả để đổi thứ tự. |
| Chân trang | Ghi chú chính sách | `footerPoliciesNote` | Textarea | Không | Thông báo chung bên dưới nhóm chính sách, ví dụ tình trạng dự thảo. |
| Chân trang | Dòng bản quyền | `copyright` | Textarea | Không | Dòng bản quyền theo pháp nhân và năm công bố thực tế. |
| Chân trang | Ghi chú bản dựng thử | `footerPreviewNote` | Textstring | Không | Dòng ghi chú hiển thị khi bật cờ Bản dựng thử trong Thông tin chung. |
| Chân trang → Tài trợ | Tiêu đề đơn vị tài trợ | `footerSponsorHeading` | Textstring | Không | Ví dụ Đơn vị tài trợ. |
| Chân trang → Tài trợ | Lưu ý về tài trợ | `footerSponsorDisclaimer` | Textarea | Không | Nêu giới hạn trách nhiệm và tránh hiểu là website bảo chứng đơn vị tài trợ. |

### Quản lý trang (`pageManagement`)

Nút tổ chức cây, không có thuộc tính riêng.

### Quản lý nội dung (`contentManagement`)

Nút tổ chức cây, không có thuộc tính riêng.

### Kho Thủ đoạn (`articleManagement`)

Collection: **Nội dung · Danh sách**.

Nút tổ chức cây, không có thuộc tính riêng.

### Trang chủ (Giới thiệu) (`home`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |

### Trang Ứng phó khẩn cấp (`ungPhoPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |
| Liên kết | Đích của 5 ô tình huống | `scenarioLinks` | Liên kết · Tối đa 5 | Không | Đích của 3 ô tình huống và 2 lối phụ; để trống thì cuộn tới #dau-hieu. |
| Liên kết | 4 liên kết phụ | `helpLinks` | Liên kết · Tối đa 4 | Không | “Cách tự tìm số ngân hàng…”, “Hiểu đúng hai câu này”, “Xem cách tự kiểm chứng”, “Bài đọc Chuyên đề 1”; để trống thì ẩn. |

### Trang Thủ đoạn (`thuDoanPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |

### Trang Tham gia (`thamGiaPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |

### Trang Thử sức (`thiThuPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |

### Trang Cuộc thi (`thiPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |

### Trang Hỏi – Đáp (`hoiDapPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |

### Trang Chính sách (`chinhSachPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Bố cục hiển thị của trang Chính sách; để trống khi chưa dựng giao diện. |

### Trang Tìm kiếm (`searchPage`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Bố cục | Bố cục | `layout` | Bố cục trang · Block Grid | Không | Khu vực sắp xếp các khối hiển thị của trang bằng Block Grid. Có thể để trống khi chưa thiết kế bố cục. |

### Danh mục bài viết (`articleList`)

Collection: **Nội dung · Danh sách**.

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Nội dung | Mô tả ngắn | `summary` | Textarea | Không | Mô tả ngắn của danh mục, hiện ở hero. |
| Nội dung | Là một lĩnh vực của trang Thủ đoạn | `isField` | True/false | Không | Đánh dấu danh mục là một trong 6 lĩnh vực của trang Thủ đoạn. |
| Nội dung | Icon lĩnh vực | `fieldIcon` | Danh mục · Biểu tượng lĩnh vực | Không | Icon của thẻ lĩnh vực. |
| Nội dung | Vai trò | `listRole` | Danh mục · Vai trò | Không | Vai trò đặc biệt: cảnh báo  /  bài đọc chuyên đề  /  chuỗi bài  /  chính sách  /  (trống). |

### Bài viết (`article`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Nội dung | Tóm tắt | `summary` | Textarea | Có | Tóm tắt 1–2 câu, dùng ở thẻ danh sách, kết quả tìm kiếm và mô tả SEO. |
| Nội dung | Nội dung | `body` | Nội dung · Soạn thảo giới hạn | Không | Nội dung bài. |
| Nội dung | Hành động an toàn | `safeAction` | Textarea | Không | Nội dung hộp “Hành động an toàn” (không bắt buộc). |
| Nội dung | Ảnh đại diện | `image` | Image Media Picker | Không | Ảnh đại diện và ảnh chia sẻ. |
| Nguồn và rà soát | Loại nhãn | `labelType` | Bài viết · Nhãn nguồn tin | Không | Không có  /  Dựa trên cảnh báo của cơ quan  /  Cần kiểm chứng · Chưa có kết luận. |
| Nguồn và rà soát | Cơ quan ban hành | `sourceAgency` | Textstring | Không | Tên cơ quan ban hành. |
| Nguồn và rà soát | Số văn bản | `sourceDocNo` | Textstring | Không | Số văn bản. |
| Nguồn và rà soát | Ngày văn bản | `sourceDocDate` | Date Picker | Không | Ngày văn bản. |
| Nguồn và rà soát | Ngày cập nhật | `updatedDate` | Date Picker | Có | Ngày cập nhật hiển thị; dùng để sắp xếp. |
| Nguồn và rà soát | Ngày rà soát gần nhất | `lastReviewedDate` | Date Picker | Không | Ngày rà soát gần nhất; quá 90 ngày thì hiện cảnh báo. |
| Nguồn và rà soát | Bản dự thảo | `isDraft` | True/false | Không | Hiện nhãn “Bản dự thảo” (dùng cho chính sách). |

### SEO dùng chung (`seoBase`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| SEO | Tiêu đề SEO | `seoTitle` | Textstring | Không | Tiêu đề thẻ title; trống thì dùng tên nút. |
| SEO | Mô tả SEO | `seoDescription` | Textarea | Không | Mô tả; trống thì dùng tóm tắt. |
| SEO | Ảnh khi chia sẻ | `ogImage` | Image Media Picker | Không | Ảnh khi chia sẻ; trống thì dùng ảnh hero 1. |
| SEO | Ẩn khỏi sitemap và tìm kiếm | `hideFromSearch` | True/false | Không | Ẩn khỏi sitemap và tìm kiếm trong site. |

### Liên kết đến trang (`siteNavigationItem`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Nội dung | Chữ hiển thị | `label` | Textstring | Có | Nhập chữ hiển thị trên liên kết. |
| Nội dung | Trang đích | `page` | Điều hướng · Chọn trang trong website | Có | Chỉ chọn trong phạm vi đã giới hạn; không nhập đường dẫn thủ công. |

### Liên kết chính sách (`sitePolicyLinkItem`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Nội dung | Chữ hiển thị | `label` | Textstring | Có | Nhập chữ hiển thị trên liên kết. |
| Nội dung | Văn bản chính sách | `document` | Chân trang · Chọn văn bản Chính sách | Có | Chỉ chọn trong phạm vi đã giới hạn; không nhập đường dẫn thủ công. |

### Thẻ số khẩn cấp (`emergencyNumberItem`)

| Tab / nhóm | Thuộc tính | Alias | Data type | Bắt buộc | Hướng dẫn nhập |
| --- | --- | --- | --- | --- | --- |
| Nội dung | Nhãn | `label` | Textstring | Có | Nhãn ngắn ở đầu thẻ, ví dụ Gọi đầu tiên, Gọi hoặc Chỉ nhắn tin. |
| Nội dung | Số hoặc tên | `number` | Textstring | Có | Nhập số điện thoại hoặc tên hiển thị, ví dụ 113, 156, 5656, Ngân hàng của bạn. |
| Nội dung | Mô tả | `description` | Textarea | Có | Nêu khi nào nên liên hệ và các lưu ý của thẻ. Nội dung giữ theo bản dựng khi chưa kiểm chứng lại. |
| Nội dung | Hiện nút gọi | `enableCall` | True/false | Không | Bật cho số có thể gọi. Tắt với thẻ Ngân hàng của bạn và số chỉ nhận tin nhắn. |
| Nội dung | Hiện nút nhắn tin | `enableSms` | True/false | Không | Bật nếu số có nhận phản ánh bằng tin nhắn. |
| Nội dung | Chữ trên nút gọi | `callButtonText` | Textstring | Không | Ví dụ Gọi 113 hoặc Gọi 156. Chỉ dùng khi bật Hiện nút gọi. |
