# Portal v2: danh mục chọn và chuẩn document type

Ngày: 2026-11-02 · Bổ sung cho `1-phan-tich-cau-hinh-umbraco.md` (mục 5, 6, 7). Là **đề xuất**, chưa chốt; các điểm cần xác nhận ở mục 9.

Nguồn đã đọc:
- `docs/ban-dung-v2/antoantaichinh-nguon/build/data.json`: `CHANNELS`, `GROUPS`, `SIGNS`, `CD`, `CDSHORT`, `TACTICS`, `TCH`, `TLV`.
- `build/app.js`: bảng `ICON`, gồm 51 biểu tượng.
- uSync hiện có ở `src/ANTC.Portal.App/Umbraco.Web.UI/uSync/v18/`: 92 data type, 94 content type.
- Mã nguồn core: `Umbraco.Core/DynamicRoot/*`, `Configuration/Models/ContentSettings.cs`. Hai file này xác nhận bản 18.2.1 có Dynamic Root cho trình chọn nội dung và có cấu hình `DisableDeleteWhenReferenced`.

## 1. Trả lời ngắn

Phải tạo mới, vì cấu hình hiện có chưa có danh mục nào dùng được cho v2. Hiện chỉ có hai data type Dropdown là `Danh mục · Vai trò` và `Danh mục · Biểu tượng lĩnh vực` (`DataTypes/DanhMucVaiTro.config`, `DanhMucBieuTuongLinhVuc.config`). Cả hai thuộc cấu trúc cũ và sẽ bỏ.

Mỗi danh mục làm theo một trong bốn cách. Cách nào phụ thuộc vào câu hỏi: ai được thêm hoặc sửa mục, và mục có cần thêm trường không.

| Loại | Cách làm trong Umbraco | Ai thêm, sửa | Dùng cho |
|---|---|---|---|
| A. Danh mục cố định | Data type Dropdown hoặc Radio ở Cài đặt › Kiểu dữ liệu. Không tạo node | Lập trình viên, vì đổi giá trị là đổi logic | Mức độ cần thận trọng, Mức độ phổ biến, Loại bài, Kiểu công cụ, Màu kết quả, Biểu tượng… (mục 3) |
| B. Danh mục biên tập | Mỗi mục là một node trong "Thư viện › Danh mục". Form chọn bằng combobox ngay trên form (mục 4.7), danh sách lấy từ đúng thư mục đó | Biên tập viên (Dấu hiệu phải dừng: Quản trị viên) | Kênh tiếp cận, Đối tượng, Dấu hiệu phải dừng, Chuyên đề, Thủ đoạn (mục 4) |
| C. Từ khóa tự do | Data type Tags, mỗi công dụng một nhóm tag riêng | Biên tập viên gõ tự do | Từ khóa tìm kiếm, Từ đồng nghĩa |
| D. Trang làm danh mục | Không tạo gì thêm. Trang là node có sẵn, chọn bằng Multinode Treepicker lọc theo loại trang | Theo quyền của trang | Nhóm rủi ro, Checklist, Việc cần làm, Bài viết, Công cụ |

Lý do không chọn các cách khác cho Kênh, Đối tượng, Dấu hiệu, Chuyên đề, Thủ đoạn:
- Dropdown: chỉ chứa chữ, không gắn được biểu tượng hay mô tả. Biên tập viên không vào được khu Cài đặt (QĐ-035). Giá trị lưu là chữ hiển thị, nên sửa chữ làm mất giá trị ở bài đã gắn.
- Tags: ai cũng gõ được thẻ mới, nên sẽ sinh ra hai thẻ cùng nghĩa như "Zalo" và "zalo". Tags cũng không giữ thứ tự, không có biểu tượng, không chặn xóa.
- Dictionary: dùng để dịch câu chữ, không phải danh sách để chọn.
- Thư viện element của Umbraco 18 (`ElementEditingService` trong core): chưa kiểm trình chọn và việc theo dõi tham chiếu trên bản 18.2.1, nên không dùng cho đợt này.

Node có ba thứ các cách trên không có:
- Gắn được thêm trường như biểu tượng, mô tả, thủ đoạn hay gặp.
- Biên tập viên kéo thả được thứ tự.
- Umbraco tự ghi tham chiếu khi một bài chọn mục đó, nên chặn được việc xóa mục còn đang dùng (mục 6).

## 2. Chuẩn chung cho document type

Bảng dưới lấy theo cách repo đang làm. Chỗ nào repo đang làm lệch, bảng ghi rõ chọn cách nào.

| Mục | Quy ước | Ví dụ |
|---|---|---|
| Alias loại | camelCase tiếng Anh, có hậu tố theo vai trò: `…Page` cho node có template và đường dẫn; `…Item` cho node dữ liệu trong Thư viện, không có trang; `…Folder` cho thư mục; `…Block` cho element type dùng trong Block List; `…Base` cho composition | `alertPage`, `channelItem`, `channelFolder`, `stepBlock`, `seoBase` |
| Tên loại | Tiếng Việt có dấu, dùng đúng từ biên tập viên vẫn gọi. Không ghi chữ "Trang", "Loại" thừa | "Cảnh báo", "Kênh tiếp cận" |
| Mô tả loại | Một câu: tạo ở đâu, hiện ở đâu. Câu này hiện trong hộp "Tạo mới" | "Tạo trong Cảnh báo mới. Hiện ở trang chủ trong 90 ngày kể từ ngày cập nhật." |
| Biểu tượng loại | Bộ `icon-*` của Umbraco kèm màu theo nhóm: trang cố định không màu, nội dung biên tập `color-green`, danh mục `color-purple`, thư mục `icon-folder` | `icon-alert color-green` |
| Template | Chỉ loại `…Page` có template. Alias template trùng alias loại; view đặt tên `<alias>.cshtml` (quy ước có sẵn) | `alertPage.cshtml` |
| Cho tạo ở gốc | Chỉ `homePage`, `siteSettings`, `libraryFolder` | |
| Loại con được phép | Khai báo chặt theo cây ở mục 4 của `1-phan-tich…`, để biên tập viên không đặt nhầm chỗ | `alertListPage` chỉ cho `alertPage` |
| Collection (list view) | Bật cho thư mục có thể quá 20 con. Cột và bộ lọc theo bảng ở `1-phan-tich…` | `alertListPage`, `riskCategoryPage`, `tacticFolder` |
| Biến thể | `Nothing`, vì site chỉ có một ngôn ngữ | |
| Lịch sử phiên bản | Giữ mặc định. Bật `PreventCleanup` cho `siteSettings`, `wizardPage`, `toolPage` để luôn khôi phục được câu chữ và quy tắc | |
| Tab và nhóm | Alias không dấu, camelCase (`noiDung`, `phanLoai`, `thamDinh`). `qaItem` đang có alias tab `nộiDung` có dấu; sửa thành `noiDung` khi đổi sang `quickQaItem` | |
| Alias trường | camelCase tiếng Anh, không viết tắt, giữ nguyên sau khi đã có dữ liệu | `popularity`, `reviewDate` |
| Tên trường | Tiếng Việt có dấu, ngắn, viết như nhãn form | "Mức độ phổ biến" |
| Mô tả trường | Câu hướng dẫn kèm giới hạn ("Tối đa 160 ký tự. Hiện trên thẻ và khi chia sẻ.") | |
| Báo lỗi | `MandatoryMessage` và `ValidationRegExpMessage` bằng tiếng Việt, mẫu "Vui lòng …", như `qaItem` đang làm | "Vui lòng chọn mức độ." |
| Nhãn trên ô | `LabelOnTop = true` cho ô soạn thảo và danh sách khối; còn lại `false` | |
| Giới hạn ký tự | Đặt bằng data type có `maxChars` (mục 3.2), không dùng regex | |
| Nhãn khối | Mọi `…Block` có nhãn theo nội dung (cú pháp UFM, ví dụ `Bước · {=text}`) và ảnh minh họa (ND-01) | |
| Khóa (Key) | GUID do Umbraco sinh khi tạo trong backoffice, uSync ghi lại. Không sửa tay | |

Tên data type theo mẫu "Nhóm · Tên" mà repo đang dùng:

| Nhóm | Dùng cho |
|---|---|
| `Danh mục · …` | Dropdown, Radio cố định (loại A) |
| `Chọn · …` | Multinode Treepicker (loại B, D) |
| `Khối · …` | Block List |
| `Chữ · …`, `Đoạn · …` | Textstring, Textarea có giới hạn ký tự |
| `Soạn thảo · …` | Rich Text với thanh công cụ rút gọn |
| `Thẻ · …` | Tags |

### Đổi tên so với `1-phan-tich-cau-hinh-umbraco.md`

Để theo đúng quy ước hậu tố, tên làm việc trong file phân tích đổi như sau. Nội dung các trường giữ nguyên.

| Tên ở file phân tích | Alias chuẩn |
|---|---|
| `seoShare` | `seoBase`. Giữ alias đang có và thêm trường "Đường dẫn chuẩn", để không phải chuyển dữ liệu SEO của các trang hiện có |
| `publishMeta` | `publishMetaBase` |
| `principleItem`, `linkItem`, `hotlineItem` | `principleBlock`, `linkBlock`, `hotlineBlock` |
| `doorItem`, `doorOption` | `doorBlock`, `doorOptionBlock` |
| `wizardOption` | `wizardOptionBlock` |
| `stepItem`, `branchItem`, `snippetRef`, `questionList` | `stepBlock`, `branchBlock`, `snippetRefBlock`, `screeningBlock` |
| `toolQuestion`, `toolBranchQuestion`, `toolResultBand` | `toolQuestionBlock`, `toolBranchBlock`, `toolResultBandBlock` |
| `checkGroup`, `scenarioItem`, `sourceItem`, `contactGroup` | `checkGroupBlock`, `scenarioBlock`, `sourceBlock`, `contactGroupBlock` |
| `readingBlock` (6 kiểu con) | `readingParagraphBlock`, `readingHeadingBlock`, `readingNoteBlock`, `readingTableBlock`, `readingCaseBlock`, `readingPocketBlock` |
| `taxonomyFolder` (một thư mục chung) | Năm thư mục riêng: `channelFolder`, `audienceFolder`, `stopSignFolder`, `topicFolder`, `tacticFolder` (mục 4.1) |

## 3. Danh mục cố định (loại A)

### 3.1 Các data type Dropdown, Radio cần tạo

Umbraco lưu giá trị của Dropdown và Radio bằng chính chữ hiển thị (`DanhMucVaiTro.config` cấu hình `items` là mảng chữ). Vì vậy:
- Code ánh xạ chữ sang mã ở một chỗ duy nhất, ví dụ lớp `DanhMucCoDinh` trong `Umbraco.Plugin.Custom.Core`.
- Khi khởi động, code so danh sách trong data type với hằng số trong code; lệch thì ghi cảnh báo vào log.
- Chữ của mục đã có bài dùng thì không sửa trong backoffice. Muốn đổi thì làm như một việc lập trình, kèm bước chuyển dữ liệu.

| Data type | Kiểu nhập | Giá trị, theo thứ tự | Mã trong code | Dùng ở |
|---|---|---|---|---|
| `Danh mục · Mức độ cần thận trọng` | Dropdown, chọn một | Thường · Cao · Rất cao | `thuong`, `cao`, `ratCao` | `alertPage`, `riskArticlePage`, `tacticItem`. Ma trận trình hỏi lưu mã, không lưu chữ |
| `Danh mục · Mức độ phổ biến` | Dropdown, chọn một | Ít gặp · Thường gặp · Rất phổ biến (đề xuất, chờ chốt) | `itGap`, `thuongGap`, `ratPhoBien` | `alertPage` |
| `Danh mục · Loại bài` | Radio | Bài hướng dẫn · Bài đọc chuyên đề · Bài đọc thêm | `huongDan`, `docChuyenDe`, `docThem` | `riskArticlePage` |
| `Danh mục · Kiểu công cụ` | Radio | Đếm dấu hiệu · Theo nhánh | `demDauHieu`, `theoNhanh` | `toolPage` |
| `Danh mục · Màu kết quả` | Radio | Xanh lá · Vàng · Cam | `ok`, `h`, `d` (lớp CSS của mockup) | `toolResultBandBlock` |
| `Danh mục · Trả lời là dấu hiệu` | Radio | Có · Không | `true`, `false` | `toolQuestionBlock` |
| `Danh mục · Hình thức liên hệ` | Radio | Gọi · Nhắn tin · Gọi và nhắn tin | `goi`, `nhanTin`, `ca2` | `hotlineBlock` |
| `Danh mục · Kiểu cửa vào` | Radio | Mở trang ngay · Mở danh sách lựa chọn | `trang`, `luaChon` | `doorBlock` |
| `Danh mục · Dải trên cùng` | Radio | Bản dựng thử · Địa chỉ duy nhất · Ẩn | `thu`, `diaChi`, `an` | `siteSettings` |
| `Danh mục · Biểu tượng` | Dropdown, chọn một | 44 mục của bảng `ICON` (bỏ 7 biểu tượng điều hướng), nhãn dạng "Cuộc gọi · call" | Phần sau dấu "·" là tên biểu tượng trong sprite SVG | Mọi trường "Biểu tượng" |

Danh sách biểu tượng lấy từ `build/app.js` (`var ICON`): alert, phone, call, chat, shield, money, key, id, sim, face, app, lock, clock, hush, stop, chart, brief, coins, doc, cart, mega, book, quiz, pen, share, info, users, badge, gift, plus, fake, search, home, back, next, print, bank, inbox, question, globe, card, trophy, check, x, menu, volume, mail, person, link, copy, refresh. Các mục dùng cho điều hướng (back, next, menu, x, copy, refresh, plus) không đưa vào Dropdown, vì không dùng làm biểu tượng nội dung.

Có thể làm thêm sau: một property editor chọn biểu tượng có hiện hình, lưu tên biểu tượng thay cho chữ, khoảng 0,5 ngày. Đợt này dùng Dropdown cho đơn giản.

Bỏ khi chuyển xong dữ liệu: `Danh mục · Vai trò`, `Danh mục · Biểu tượng lĩnh vực`, cùng các Dropdown `ANTC…` và `Antc…` chỉ dùng cho các khối Block Grid cũ (mục 10 của file phân tích).

### 3.2 Data type giới hạn ký tự

Textstring và Textarea của Umbraco có cấu hình `maxChars`. Tạo một bộ nhỏ để dùng lại cho mọi trường:

| Data type | Editor | `maxChars` | Dùng cho |
|---|---|---|---|
| `Chữ · 30`, `Chữ · 40`, `Chữ · 60`, `Chữ · 90`, `Chữ · 110`, `Chữ · 140` | Textstring | 30 … 140 | Nhãn nhỏ, tên mục, tiêu đề |
| `Đoạn · 120`, `Đoạn · 160`, `Đoạn · 220`, `Đoạn · 300` | Textarea, 3 dòng | 120 … 300 | Mô tả ngắn, mô tả 1 dòng, câu dẫn |
| `Chữ · Mã danh mục` | Textstring, `maxChars` 40 | 40 | Trường `code` (mục 4.3); regex đặt ở trường |

## 4. Danh mục biên tập (loại B)

### 4.1 Cây trong Thư viện

```
Thư viện (libraryFolder)                         gốc, không có trang, không ai tạo/xóa
├── Kênh tiếp cận (channelFolder)                → channelItem ×7
├── Đối tượng (audienceFolder)                   → audienceItem ×5
├── Dấu hiệu phải dừng (stopSignFolder)          → stopSignItem ×6
├── Chuyên đề (topicFolder)                      → topicItem ×8
├── Thủ đoạn (tacticFolder, có Collection)       → tacticItem ×31
├── Hỏi – đáp nhanh (quickQaFolder, có Collection) → quickQaItem ×n
└── Đoạn dùng chung (snippetFolder)              → sharedSnippet ×n
```

Mỗi danh mục có thư mục riêng. Như vậy hộp "Tạo mới" trong thư mục Kênh chỉ hiện "Kênh tiếp cận", và biên tập viên không tạo nhầm loại vào sai chỗ. Các thư mục do dữ liệu mẫu tạo sẵn (mục 7); biên tập viên không tạo, xóa hay di chuyển thư mục.

### 4.2 Loại thư mục

Tám loại thư mục giống nhau, chỉ khác loại con được phép. Thư mục không có trường nội dung, chỉ có Collection khi cần.

| Alias | Tên | Biểu tượng | Con được phép | Collection |
|---|---|---|---|---|
| `libraryFolder` | Thư viện | `icon-books` | 7 thư mục dưới | Không |
| `channelFolder` | Kênh tiếp cận | `icon-folder color-purple` | `channelItem` | Không (ít mục, dùng cây để kéo thả) |
| `audienceFolder` | Đối tượng | `icon-folder color-purple` | `audienceItem` | Không |
| `stopSignFolder` | Dấu hiệu phải dừng | `icon-folder color-purple` | `stopSignItem` | Không |
| `topicFolder` | Chuyên đề | `icon-folder color-purple` | `topicItem` | Không |
| `tacticFolder` | Thủ đoạn | `icon-folder color-purple` | `tacticItem` | Có. Cột: Tên · Chuyên đề · Mức độ · Đang dùng · Ngày sửa. Lọc theo chuyên đề, mức độ |
| `quickQaFolder` | Hỏi – đáp nhanh | `icon-folder` | `quickQaItem` | Có |
| `snippetFolder` | Đoạn dùng chung | `icon-folder` | `sharedSnippet` | Không |

### 4.3 Composition `taxonomyBase`

Mọi mục danh mục đều có composition này. Tên mục dùng chính **tên node** của Umbraco, không thêm trường "Tên". Nhờ vậy cây, trình chọn và Collection hiện đúng tên mà không cần cấu hình thêm.

| Alias | Tên | Data type | Bắt buộc | Kiểm tra / mô tả |
|---|---|---|---|---|
| (tên node) | Tên hiển thị | (tên node) | ✔ | Tối đa 60 ký tự, kiểm phía máy chủ vì tên node không có `maxChars` |
| `code` | Mã | `Chữ · Mã danh mục` | ✔ | Regex `^[a-z0-9]+(-[a-z0-9]+)*$` · thông báo "Mã chỉ gồm chữ thường không dấu, số và dấu gạch ngang." Duy nhất trong danh mục. Khóa sau lần xuất bản đầu. Dùng cho bộ lọc trên địa chỉ, ví dụ `?kenh=mang-xa-hoi` |
| `icon` | Biểu tượng | `Danh mục · Biểu tượng` | ✔ | |
| `isActive` | Đang dùng | Bật/tắt, mặc định bật | | Tắt thì mục không hiện ở bộ lọc trên website và ở trình hỏi; bài đã gắn vẫn giữ giá trị. Dùng thay cho xóa |

Nhóm trường: tab `noiDung` "Nội dung". Loại mục không có template, không có `seoBase`.

### 4.4 Các loại mục

`channelItem` · Kênh tiếp cận · `icon-wifi color-purple`. Tạo trong Kênh tiếp cận.

| Alias | Tên | Data type | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| `taxonomyBase` | | | | Tên, Mã, Biểu tượng, Đang dùng |

Mẫu: 7 mục của `CHANNELS`. Mã lấy theo `k` của bản dựng, viết đầy đủ để đọc được: `dt`→`dien-thoai`, `tn`→`tin-nhan`, `mxh`→`mang-xa-hoi`, `web`→`website-ung-dung`, `san`→`san-thuong-mai`, `mail`→`thu-dien-tu`, `tt`→`truc-tiep`.

`audienceItem` · Đối tượng · `icon-users color-purple`. Tạo trong Đối tượng.

| Alias | Tên | Data type | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| `taxonomyBase` | | | | |
| `summary` | Mô tả ngắn | `Đoạn · 120` | ✔ | `GROUPS[].s`, ví dụ "Tuyển dụng, vay tiền nhanh, làm nhiệm vụ trực tuyến." |
| `tactics` | Thủ đoạn hay gặp | `Chọn · Thủ đoạn` (tối đa 8) | | `GROUPS[].tac`. Kéo thả để sắp thứ tự |

`stopSignItem` · Dấu hiệu phải dừng · `icon-stop color-purple`. Tạo trong Dấu hiệu phải dừng. Chỉ Quản trị viên được tạo và xóa, vì sáu dấu hiệu gắn với Điều 14; biên tập viên chỉ sửa câu chữ.

| Alias | Tên | Data type | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| `taxonomyBase` | | | | Tên node là nhãn ngắn để chọn, ví dụ "Đòi mã OTP" |
| `text` | Câu dấu hiệu | `Soạn thảo · Chỉ in đậm` | ✔ | `SIGNS[][1]`, có `<b>` |
| `note` | Ghi chú phụ | `Đoạn · 160` | | Phần `<small>` của dấu hiệu "face" |

Mẫu: 6 mục của `SIGNS`, mã `key`, `app`, `lock`, `face`, `hush`, `call` đổi thành `doc-ma`, `cai-ung-dung`, `phi-mo-khoa`, `quet-khuon-mat`, `giu-bi-mat`, `can-goi-lai`.

`topicItem` · Chuyên đề · `icon-book-alt color-purple`. Tạo trong Chuyên đề.

| Alias | Tên | Data type | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| `taxonomyBase` | | | | Tên node là tên đầy đủ, ví dụ "Ký hợp đồng và cam kết dịch vụ" (`CD`) |
| `number` | Số chuyên đề | `Số nguyên dương` (đã có) | ✔ | 1–8, duy nhất, khóa sau xuất bản. Là khóa nối với ngân hàng câu hỏi của Cuộc thi (`cd` trong CSDL ứng dụng), nên không được đổi |
| `shortName` | Tên ngắn | `Chữ · 40` | ✔ | `CDSHORT`, ví dụ "Hợp đồng, dịch vụ" |
| `readingArticle` | Bài đọc chuyên đề | `Chọn · Bài viết` (một) | ✔xb | |
| `checklist` | Checklist | `Chọn · Checklist` (một) | | |

Mẫu: 8 chuyên đề. `data.json › CD` chỉ có tên cho chuyên đề 2–7; tên chuyên đề 1 và 8 lấy từ ngân hàng câu hỏi Cuộc thi (`quiz-bank.json`) khi nhập dữ liệu.

`tacticItem` · Thủ đoạn · `icon-theater color-purple`. Tạo trong Thủ đoạn. Trường theo mục 6.12 của file phân tích, alias chuẩn:

| Alias | Tên | Data type | Bắt buộc |
|---|---|---|---|
| `taxonomyBase` | | | Tên node là tên thủ đoạn, tối đa 140 ký tự (kiểm phía máy chủ) |
| `topic` | Chuyên đề | `Chọn · Chuyên đề` | ✔ |
| `article` | Bài viết chứa thủ đoạn | `Chọn · Bài viết` (một) | ✔xb |
| `anchor` | Neo trong bài | `Chữ · 40` | |
| `channels` | Kênh | `Chọn · Kênh` | ✔ |
| `level` | Mức độ cần thận trọng | `Danh mục · Mức độ cần thận trọng` | ✔ |
| `keywords` | Từ khóa tìm kiếm | `Thẻ · Từ khóa` | |

`tacticItem` không dùng trường Biểu tượng của `taxonomyBase` (bản dựng không có). Có hai cách: để trường này không bắt buộc riêng cho thủ đoạn, hoặc không dùng composition mà khai báo `code` và `isActive` trực tiếp. Đề xuất cách thứ hai, để giữ composition đơn giản.

### 4.5 Data type chọn (loại B và D)

Mọi data type dưới đây dùng ô chọn dạng combobox `Antc.NodeCombobox` (mục 4.7), không dùng hộp thoại chọn nội dung mặc định của Umbraco. Data type vẫn khai báo trên kiểu dữ liệu `Umbraco.MultiNodeTreePicker`. Chỉ phần giao diện là của dự án.

Mỗi ô chọn lấy danh sách từ đúng thư mục bằng Dynamic Root (gốc là node gốc của site, rồi tìm con đầu tiên có loại tương ứng). Cách này không phụ thuộc khóa node, nên không lệch giữa các máy. Mỗi ô chọn cũng chỉ cho chọn đúng loại.

| Data type | Gốc | Lọc loại | Số lượng |
|---|---|---|---|
| `Chọn · Kênh` | `channelFolder` | `channelItem` | 0–7 |
| `Chọn · Đối tượng` | `audienceFolder` | `audienceItem` | 0–5 |
| `Chọn · Dấu hiệu phải dừng` | `stopSignFolder` | `stopSignItem` | 0–6 |
| `Chọn · Chuyên đề` | `topicFolder` | `topicItem` | 0–1 |
| `Chọn · Thủ đoạn` | `tacticFolder` | `tacticItem` | 0–8 |
| `Chọn · Nhóm rủi ro` | `ruiRoPage` | `riskCategoryPage` | 0–4 |
| `Chọn · Bài viết` | `ruiRoPage` | `riskArticlePage` | 0–1 |
| `Chọn · Bài liên quan` | `homePage` | `riskArticlePage`, `alertPage`, `checklistPage` | 0–4 |
| `Chọn · Checklist` | `congCuPage` | `checklistPage` | 0–1 |
| `Chọn · Công cụ` | `congCuPage` | `toolPage` | 3–3 |
| `Chọn · Việc cần làm` | `khanCapPage` | `viecCanLamPage` | 0–1 |
| `Chọn · Việc cần làm (nhiều)` | `khanCapPage` | `viecCanLamPage` | 0–10 |
| `Chọn · Cảnh báo` | `alertListPage` | `alertPage` | 0–1 |
| `Chọn · Bài hoặc cảnh báo` | `ruiRoPage` | `riskArticlePage`, `alertPage` | 1–1, dùng trong ma trận trình hỏi |

"Bắt buộc" đặt ở trường, không đặt ở data type. Vì vậy cùng một data type dùng được cho trường bắt buộc và trường không bắt buộc.

### 4.7 Ô chọn dạng combobox (`Antc.NodeCombobox`)

Trình chọn nội dung mặc định của Umbraco mở một hộp thoại có cây rồi mới cho tích. Với danh sách ngắn như 7 kênh hay 5 đối tượng, như vậy là chậm và khó dùng. Ô chọn này thay hộp thoại bằng combobox nằm ngay trên form.

Cách làm:
- Viết một **property editor UI** (phần giao diện) gắn vào kiểu dữ liệu có sẵn `Umbraco.MultiNodeTreePicker`. Khai báo `propertyEditorSchemaAlias: "Umbraco.MultiNodeTreePicker"`, giống cách core khai báo trong `Umbraco.Web.UI.Client/src/packages/property-editors/content-picker/manifests.ts`.
- Phía máy chủ giữ nguyên của Umbraco. Giá trị lưu đúng định dạng của trình chọn gốc. Tham chiếu vẫn được ghi, nên việc chặn xóa ở mục 6 vẫn chạy. Model trong view vẫn trả `IPublishedContent`.
- Nếu sau này bỏ ô chọn này, chỉ cần đổi data type về giao diện mặc định. Dữ liệu không phải chuyển.
- Viết bằng JavaScript thuần trong `App_Plugins/AntcPickers/`, không cần bước build. Cách này giống `App_Plugins/AntcVietnamese` và `AntcQuestions` đang có. Dùng `uui-combobox` của thư viện giao diện Umbraco nếu đủ; không đủ thì tự dựng trên `uui-input` và `uui-popover`.
- Danh sách lấy từ API quản trị mới `GET /umbraco/management/api/v1/antc/picker-items`. Tham số: data type, chuỗi tìm. API trả mỗi mục gồm khóa, tên, biểu tượng, mã, trạng thái Đang dùng, trạng thái xuất bản, tên node cha. API yêu cầu đăng nhập backoffice, và đọc gốc, lọc loại từ cấu hình của data type.

Hành vi:

| Tình huống | Ô chọn một mục | Ô chọn nhiều mục |
|---|---|---|
| Hiển thị khi đã chọn | Biểu tượng + tên trong ô, có nút xóa (×) | Mỗi mục một thẻ (chip) có biểu tượng, tên, nút ×. Ô gõ nằm sau thẻ cuối |
| Bấm vào ô | Mở danh sách ngay dưới ô, theo thứ tự sắp trong thư mục | Như bên trái; mục đã chọn có dấu tích, bấm lần nữa để bỏ |
| Gõ chữ | Lọc theo tên và mã, không phân biệt dấu ("zalo" ra "Tin nhắn, Zalo") | Như bên trái |
| Bàn phím | ↑ ↓ di chuyển, Enter chọn, Esc đóng | Như bên trái; Backspace khi ô gõ trống thì bỏ thẻ cuối |
| Giới hạn số mục | | Dòng nhỏ "Đã chọn 3/4". Đủ số thì các mục còn lại mờ đi |
| Thứ tự | | Kéo thẻ để sắp, chỉ bật ở trường cần thứ tự (Thủ đoạn hay gặp, Tình huống điển hình, Ba công cụ) |
| Mục đã tắt "Đang dùng" | Không hiện trong danh sách. Nếu đã được chọn từ trước thì vẫn hiện, chữ xám, kèm "(ngừng dùng)" | Như bên trái |
| Mục chưa xuất bản | Hiện kèm nhãn "Nháp" | Như bên trái |
| Danh sách nhiều mục cùng tên (Bài viết) | Dòng phụ ghi tên nhóm rủi ro | Như bên trái |
| Thư mục chưa có mục nào | "Chưa có mục nào." Quản trị viên thấy thêm liên kết mở thư mục đó | Như bên trái |
| Danh sách lớn (Bài viết, Cảnh báo) | Lấy 20 mục đầu; gõ thì tìm phía máy chủ | Như bên trái |

Màn "Ma trận tình huống" (V2-07b) dùng lại thành phần này cho ô Bài hướng dẫn và Checklist trong ngăn chi tiết.

Ước lượng: ô chọn khoảng 1–1,5 ngày, API khoảng 0,5 ngày.

### 4.6 Tags (loại C)

| Data type | Nhóm tag | Lưu | Dùng ở |
|---|---|---|---|
| `Thẻ · Từ khóa` | `tuKhoa` | Json | `riskArticlePage`, `alertPage`, `tacticItem` |
| `Thẻ · Từ đồng nghĩa` | `dongNghia` | Json | `riskArticlePage` (`SYN` của bản dựng) |

Data type `Tags` đang có dùng nhóm `default`; tách nhóm để gợi ý khi gõ không trộn hai loại.

## 5. Bảng tổng hợp document type

Cột "Trường" ghi chỗ đặc tả trường. Alias trường của các loại trang sẽ chốt ở `/feature-design` của từng việc V2-xx, theo quy ước ở mục 2.

| Alias | Tên | Vai trò | Biểu tượng | Template | Con được phép | Composition | Collection | Trường |
|---|---|---|---|---|---|---|---|---|
| `siteSettings` | Cài đặt website | Node gốc, không trang | `icon-settings` | – | – | – | – | Phân tích 6.1 |
| `homePage` | Trang chủ | Trang cố định | `icon-home` | ✔ | `khanCapPage`, `congCuPage`, `ruiRoPage`, `hoiDapPage`, `lienHePage`, `gopYPage`, `infoPage`, `policyPage`, `thiPage`, `searchPage`, `notFoundPage` | `seoBase`, `publishMetaBase` | – | 6.2 |
| `khanCapPage` | Khẩn cấp | Trang cố định | `icon-alert color-red` | ✔ | `wizardPage`, `viecCanLamPage` | như trên | – | 6.3 |
| `wizardPage` | Kiểm tra tình huống | Trang cố định | `icon-help-alt` | ✔ | – | như trên | – | 6.4 |
| `viecCanLamPage` | Việc cần làm | Trang, Quản trị tạo | `icon-checkbox` | ✔ | – | như trên | – | 6.5 |
| `congCuPage` | Công cụ & checklist | Trang cố định | `icon-tools` | ✔ | `toolPage`, `checklistPage` | như trên | – | 6.6 |
| `toolPage` | Công cụ | Trang cố định | `icon-calculator` | ✔ | – | như trên | – | 6.7 |
| `checklistPage` | Checklist | Nội dung biên tập | `icon-list color-green` | ✔ | – | như trên | – | 6.8 |
| `ruiRoPage` | Các rủi ro | Trang cố định | `icon-shield` | ✔ (chuyển hướng) | `alertListPage`, `riskCategoryPage` | `seoBase` | – | 6.9 |
| `alertListPage` | Cảnh báo mới | Trang cố định | `icon-megaphone` | ✔ | `alertPage` | `seoBase` | ✔ | 6.14 |
| `alertPage` | Cảnh báo | Nội dung biên tập | `icon-alert color-green` | ✔ | – | `seoBase`, `publishMetaBase` | – | 6.10 |
| `riskCategoryPage` | Nhóm rủi ro | Trang cố định | `icon-folder-open` | ✔ | `riskArticlePage` | `seoBase` | ✔ | 6.9 |
| `riskArticlePage` | Bài viết | Nội dung biên tập | `icon-article color-green` | ✔ | – | `seoBase`, `publishMetaBase` | – | 6.11 |
| `lienHePage`, `gopYPage`, `infoPage`, `policyPage` | Liên hệ đúng nơi, Góp ý, Trang thông tin, Chính sách | Trang | `icon-phone`, `icon-message`, `icon-info`, `icon-shield` | ✔ | – | `seoBase`, `publishMetaBase` | – | 6.14 |
| `hoiDapPage`, `thiPage` (và con), `searchPage`, `notFoundPage` | giữ như hiện có | | | | | | | |
| `libraryFolder` và 7 thư mục | mục 4.2 | Thư mục | | – | mục 4.2 | – | mục 4.2 | |
| `channelItem`, `audienceItem`, `stopSignItem`, `topicItem`, `tacticItem` | mục 4.4 | Danh mục | | – | – | `taxonomyBase` (trừ `tacticItem`) | – | mục 4.4 |
| `quickQaItem`, `sharedSnippet` | Hỏi – đáp nhanh, Đoạn dùng chung | Dữ liệu | `icon-chat color-green`, `icon-document` | – | – | – | – | 6.14 |
| `seoBase`, `publishMetaBase`, `taxonomyBase` | Composition | | | – | – | – | – | 6.13, mục 4.3 |
| 23 loại `…Block` | Element type | | | – | – | – | – | Phân tích mục 7, tên ở mục 2 |

## 6. Quy tắc phía máy chủ của danh mục

| # | Quy tắc | Cách làm |
|---|---|---|
| 1 | Chặn xóa mục còn được dùng | Bật `Umbraco:CMS:Content:DisableDeleteWhenReferenced`. Umbraco tự ghi tham chiếu khi trường Multinode Treepicker và Block List chọn một node. Màn xóa liệt kê các trang đang dùng mục; biên tập viên tắt "Đang dùng" thay cho xóa |
| 2 | Ma trận trình hỏi cũng phải ghi tham chiếu | Trường `Antc.WizardMatrix` lưu JSON tự định dạng, nên Umbraco không tự thấy bài và checklist nằm trong đó. Cần cài `IDataValueReferenceFactory` cho editor này, thêm vào việc V2-07b |
| 3 | `code` duy nhất trong danh mục, khóa sau lần xuất bản đầu | `ContentSavingNotification`: trùng mã, hoặc đổi mã khi node đã từng xuất bản, thì hủy lưu và báo lỗi tiếng Việt |
| 4 | `number` của Chuyên đề nằm trong khoảng 1–8, duy nhất, khóa sau xuất bản | Như quy tắc 3 |
| 5 | Tên node tối đa 60 ký tự (thủ đoạn 140) | Như quy tắc 3 |
| 6 | Mục "Đang dùng" tắt thì không hiện ra website | Lọc khi dựng bộ lọc và dữ liệu trình hỏi |
| 7 | Chỉ Quản trị viên tạo, xóa Dấu hiệu phải dừng | Quyền theo node trên `stopSignFolder`: nhóm Biên tập viên bỏ quyền Create, Delete (QĐ-035) |
| 8 | Biên tập viên không tạo, xóa, di chuyển thư mục | Quyền theo node trên `libraryFolder` và 7 thư mục; quyền Create chỉ áp dụng cho loại con |

## 7. Dữ liệu mẫu

Thư mục và mục mẫu đưa vào bằng file uSync `Content/*.config`, tạo trong backoffice một lần rồi commit. Cách này giữ được khóa node giống nhau giữa các máy. Nguồn nhập:

| Danh mục | Số mục | Nguồn |
|---|---|---|
| Kênh tiếp cận | 7 | `CHANNELS` |
| Đối tượng | 5 | `GROUPS` (`tac` chỉ số thủ đoạn → node `tacticItem`) |
| Dấu hiệu phải dừng | 6 | `SIGNS` |
| Chuyên đề | 8 | `CD`, `CDSHORT`, tên chuyên đề 1 và 8 lấy từ `quiz-bank.json` |
| Thủ đoạn | 31 | `TACTICS` (tên, `cd`), `TCH` (kênh), `TLV` (mức độ: `n`→Thường, `h`→Cao, `d`→Rất cao) |

Theo README của bản dựng mục 7, Ban biên tập phải xác nhận kênh, đối tượng và mức độ của cả 31 thủ đoạn trước khi đăng. Dữ liệu mẫu nhập vào ở trạng thái nháp.

## 8. Chia lại việc V2-01

| Mã | Việc | Kiểm chứng |
|---|---|---|
| V2-01a | Data type loại A, data type giới hạn ký tự, Tags (mục 3, 4.6). Lớp `DanhMucCoDinh` và bước so khi khởi động | Build, chạy web, uSync xuất file, log không có cảnh báo lệch |
| V2-01b | `taxonomyBase`, 8 loại thư mục, 5 loại mục, data type chọn (mục 4) | Tạo thử từng loại; trình chọn chỉ hiện đúng thư mục |
| V2-01c | Dữ liệu mẫu (mục 7) | Đếm số node từng thư mục |
| V2-01d | Quy tắc 1, 3–8 ở mục 6 | Thử xóa mục đang dùng, trùng mã, đổi mã sau xuất bản, quyền Biên tập viên |
| V2-01e | Ô chọn `Antc.NodeCombobox` và API danh sách (mục 4.7); gắn vào mọi data type `Chọn · …` | Chọn, bỏ, tìm không dấu, bàn phím, giới hạn số mục, kéo thả; lưu rồi mở lại vẫn đúng; chặn xóa vẫn chạy; giá trị đọc được trong view |

V2-01b dùng `Chọn · Bài viết`, `Chọn · Checklist`, nhưng `riskArticlePage`, `checklistPage` thuộc V2-03, V2-08. Có hai cách: tạo trước hai loại trang rỗng ở V2-01b, hoặc thêm hai trường `readingArticle` và `checklist` của Chuyên đề ở V2-03, V2-08. Đề xuất cách thứ hai: thứ tự việc giữ nguyên, không có loại rỗng.

## 9. Cần anh xác nhận

1. Bốn cách làm danh mục ở mục 1, nhất là việc Kênh, Đối tượng, Dấu hiệu, Chuyên đề, Thủ đoạn là node trong Thư viện chứ không phải Dropdown.
2. Quy ước đặt tên ở mục 2 và bảng đổi tên. Điểm lớn nhất: giữ alias `seoBase`, các element type đổi hậu tố thành `…Block`.
3. Mã danh mục viết đầy đủ (`mang-xa-hoi`) thay cho mã ngắn của bản dựng (`mxh`). Mã này hiện trên địa chỉ trang khi lọc.
4. Giá trị "Mức độ phổ biến" (vẫn còn mở từ mục 12 của file phân tích).
5. Ô chọn combobox `Antc.NodeCombobox` (mục 4.7) thay cho hộp thoại chọn nội dung, dùng cho mọi trường chọn danh mục và chọn trang.

Sau khi xác nhận, các điểm 1–3 sẽ được ghi thành quyết định trong `docs/quyet-dinh.md`.
