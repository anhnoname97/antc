# PORTAL-V2 · Thiết kế và chia việc

Ngày: 2026-11-03 · Người viết: phiên điều phối (Claude) · Trạng thái: **đã chốt** (2026-11-03, anhnn đồng ý toàn bộ khuyến nghị: QĐ-042 → QĐ-048; PDF theo QĐ-049). Giao task theo cột Trạng thái.

Cách dùng file này:
- Mỗi task trong bảng ở mục Task là một phiên Worker, cỡ khoảng nửa ngày công.
- Đầu vào chung của mọi task:
  - Phụ lục A: alias, tên, kiểu nhập, bắt buộc của từng trường.
  - Mockup backoffice `mockup-o-nhap-backoffice.html`: hình dạng form và cách thao tác.
  - Mockup portal `mockup-portal-v2.html`: giao diện website.
- Khi Phụ lục A và mockup khác nhau, theo Phụ lục A. Mockup dùng alias viết tắt; Phụ lục A đã đổi sang alias chuẩn.

## Mục tiêu và phạm vi

Mục tiêu: dựng lại website antoantaichinh.vn theo cấu trúc 3 mục của khách (Khẩn cấp · Công cụ & checklist, nay gọi "Hãy tự kiểm tra" theo QĐ-050 · Các rủi ro), gồm hai phần:
- Phần quản trị: Biên tập viên tự sửa mọi câu chữ, danh mục và quy tắc trên một form, không có hộp thoại.
- Phần website: hiển thị theo mockup portal.

Trong phạm vi:
- 38 loại nội dung ở Phụ lục A: 21 loại trang, 9 thư mục, 8 loại mục và 3 composition.
- Các data type đi kèm.
- 4 thành phần backoffice tự viết:
  - ô chọn combobox `Antc.NodeCombobox`;
  - ô danh sách `Antc.InlineList`;
  - màn ma trận `Antc.WizardMatrix`;
  - ô hiển thị `Antc.InfoPanel`.
- Quy tắc phía máy chủ: kiểm khi lưu và khi xuất bản, chặn xóa, tự gỡ cảnh báo, PDF.
- Quyền hai nhóm.
- Nhập dữ liệu từ bản dựng v2 và chuyển 40 bài đang có.
- View Razor cho mọi trang.
- Tìm kiếm, SEO.
- Dọn cấu trúc cũ.

Ngoài phạm vi:
- Các trang Cuộc thi và Hỏi – Đáp giữ Block Grid, không đổi (QĐ-041). Riêng trang Hỏi – Đáp thêm phần hiện "Hỏi – đáp nhanh" (V2-13j).
- Khu quản trị Cuộc thi.
- Các task làm mới giao diện backoffice BO-xx: thuộc `BACKOFFICE-UI`. Gói này chỉ phối hợp ở BO-19.
- ND-01 đến ND-04 trong `BACKOFFICE-UI/3-don-gian-hoa-quan-ly-noi-dung.md`: hết tác dụng vì bỏ Block List và Block Grid ở trang chính (QĐ-041).
- Đa ngôn ngữ.

## Nguồn đã dùng

| Nguồn | Phần dùng |
|---|---|
| `docs/ban-dung-v2/Cấu trúc website theo hướng sau.docx` | Đặc tả của khách, mục 1–17 (đã đọc ở phiên 2026-11-02) |
| `docs/ban-dung-v2/antoantaichinh-nguon/README.md`, `build/app.js`, `build/data.json` | Bảy điều chỉnh, quy tắc rà soát, dữ liệu mẫu |
| `docs/ban-giao/PORTAL-V2/1-phan-tich-cau-hinh-umbraco.md` | Mục 4 cây nội dung, 6 form, 8 quy tắc máy chủ, 9 quyền, 12 PDF |
| `docs/ban-giao/PORTAL-V2/2-danh-muc-va-document-type.md` | Quy ước đặt tên, danh mục, combobox, quy tắc danh mục |
| `docs/ban-giao/PORTAL-V2/3-thay-block-list.md` | Bốn cách nhập, `Antc.InlineList` |
| `docs/ban-giao/PORTAL-V2/mockup-o-nhap-backoffice.html` | Schema form (sinh ra Phụ lục A), thao tác thêm, sửa, xóa |
| `docs/ban-giao/PORTAL-V2/mockup-portal-v2.html` | Giao diện website, cách tính trình hỏi và công cụ |
| `docs/quyet-dinh.md` | QĐ-004 (dạng lỗi API), QĐ-028 đến QĐ-031 (backoffice), QĐ-032 đến QĐ-041 (Portal v2) |
| `docs/ban-giao/BACKOFFICE-UI/3-don-gian-hoa-quan-ly-noi-dung.md` | BO-19, ND-01 đến ND-06 |
| Code | Xem mục Đối chiếu |

Phần chưa đọc trong phiên này:
- File Excel kế hoạch v3: sheet "API", "CSDL", "URL" chưa đối chiếu với Portal v2. Gói này dùng đặc tả mới của khách làm gốc (QĐ-032); hai sheet đó thuộc bản kế hoạch cũ.
- Không sửa Excel v3; kế hoạch Portal v2 nằm ở file mới `Ke-hoach-portal-v2.xlsx` (CXN-7).

## Hành vi và acceptance criteria chung

Mọi task phải đạt các điều sau. Tiêu chí riêng của từng task ghi ở bảng Task.

1. **Cấu trúc qua uSync.**
   - Loại nội dung, data type, template tạo trong backoffice ở môi trường Development; uSync tự xuất file `.config`. Commit các file đó.
   - Không sửa tay GUID.
   - Khi xóa cấu trúc, giữ file `<Empty … Change="Delete">`.
2. **Đặt tên** theo `2-danh-muc-va-document-type.md` mục 2:
   - alias loại có hậu tố `…Page`, `…Item`, `…Folder`, `…Base`;
   - alias trường lấy đúng ở Phụ lục A;
   - tên và mô tả tiếng Việt có dấu;
   - alias tab không dấu (`noiDung`, `phanLoai`, `thamDinh`, `lich`, `nguon`, `seo`, `danhSach`);
   - `MandatoryMessage` viết theo mẫu "Vui lòng …".
3. **Bắt buộc.**
   - "✔" trong Phụ lục A là Mandatory của Umbraco.
   - "khi đăng" cho lưu nháp nhưng chặn xuất bản, kiểm phía máy chủ ở V2-10a.
   - "có điều kiện" kiểm phía máy chủ theo điều kiện ghi ở cột Ghi chú.
4. **Ô chọn.**
   - Mọi ô chọn dùng combobox ngay trên form, không mở hộp thoại (QĐ-039).
   - Danh mục biên tập là node trong Thư viện (QĐ-040).
   - Danh sách gắn logic là data type cố định.
5. **Không dùng Block List hay Block Grid** ở trang Portal v2 (QĐ-041). Danh sách nhiều ô dùng `Antc.InlineList`; danh sách câu dùng Repeatable textstrings.
6. **Quyền** theo QĐ-035 và cột "Tạo, Xóa" ở Phụ lục A.
7. **Chữ hiển thị** tiếng Việt có dấu đầy đủ. Comment C# và script viết tiếng Việt không dấu.
8. **Kiểm chứng tối thiểu** sau mỗi task:
   - `.\run-local.ps1 -NoRun` build không lỗi mới;
   - chạy web và thấy `uSync: Startup Complete`;
   - làm đúng thao tác ghi ở cột "Cách kiểm chứng";
   - với code C# có logic, thêm test vào `Umbraco.Plugin.Custom.Tests` và chạy `dotnet test`.

## Trường hợp biên phải xử lý

| Tình huống | Hành vi |
|---|---|
| Danh mục rỗng (chưa có kênh nào) | Combobox hiện "Chưa có mục nào trong danh mục này." Quản trị viên thấy thêm liên kết mở thư mục |
| Mục danh mục đã tắt "Đang dùng" nhưng bài cũ còn chọn | Ẩn khỏi danh sách chọn. Thẻ đã chọn hiện chữ xám kèm "(ngừng dùng)". Website không hiện mục đó ở bộ lọc |
| Xóa mục còn được trỏ tới (danh mục, trang, checklist, đoạn dùng chung) | Umbraco chặn và liệt kê nơi dùng. Ma trận trình hỏi và `InlineList` cũng phải báo tham chiếu |
| Đổi mã danh mục, số chuyên đề sau khi đã xuất bản | Chặn lưu, báo lý do |
| Hai mục cùng mã trong một danh mục | Chặn lưu, báo tên mục trùng |
| Lựa chọn của trình hỏi bị xóa ở tab Câu hỏi nhưng ma trận còn trỏ tới | Ma trận cảnh báo. Xuất bản thì ô đó bị bỏ qua và ghi log |
| Không tình huống nào khớp | Trình hỏi hiện trạng thái "Cần thận trọng" và 4 nguyên tắc dừng |
| Cảnh báo quá 90 ngày | Ra khỏi khối trang chủ. Quá "Tự gỡ sau" thì tác vụ nền tự hủy xuất bản |
| Danh sách kiểm tra chưa có tệp PDF | Nút "Tải danh sách kiểm tra (PDF)" mở bản in A4 (QĐ-049) |
| Dán từ Word hoặc Excel vào bảng, danh sách dòng | Tách dòng, tách cột. Phần vượt số tối đa bị bỏ, có thông báo |
| Ô soạn thảo nhận HTML lạ khi dán | Chỉ giữ chữ. Phía máy chủ lọc HTML theo `ArticleHtmlSanitizer` đang có |
| Biên tập viên mở trang chỉ Quản trị viên được sửa | Thấy thông báo, không thấy form (trình hỏi), hoặc không thấy tab hay trường (Cài đặt website) |
| Hai người sửa cùng một trang | Theo cơ chế phiên bản có sẵn của Umbraco. Không làm khóa riêng |
| Responsive website | Kiểm ở 1440, 744, 390 px (`anh-v2/README.md`). Backoffice kiểm ở 1440 và 1024 px |
| Bảng `InlineList` trong khung hẹp hơn 720 px | Tự chuyển sang dạng thẻ |

## Đối chiếu

| Điểm | Loại thông tin | Nguồn, bằng chứng | Ghi chú |
|---|---|---|---|
| Cấu trúc 3 mục, bỏ Block Grid ở trang chính | Đã xác nhận | QĐ-032 | |
| Logic và nhãn theo đặc tả | Đã xác nhận | QĐ-033 | Câu chữ công cụ 3 cần Ban biên tập duyệt |
| Ma trận trình hỏi | Đã xác nhận | QĐ-034 | Cách tính điểm: `1-phan-tich…` mục 6.4 |
| Hai nhóm quyền | Đã xác nhận | QĐ-035 | |
| PDF checklist | Đã xác nhận | QĐ-036, QĐ-049 | Đợt này dùng tệp tải lên và bản in A4; LibreOffice tạm dừng |
| Mã danh mục viết đầy đủ; Mức độ phổ biến là node; combobox mọi chỗ; danh mục là node | Đã xác nhận | QĐ-037 đến QĐ-040 | |
| Bỏ Block List và cách nhập thay thế | Đã xác nhận | QĐ-041, QĐ-042 | |
| Có sẵn luật cây trang | Code hiện tại | `Umbraco.Plugin.Custom.Core/Content/PageTreeNotifications.cs:13-35`, `PageTreeRules.cs` | Phải thêm luật cho loại mới (V2-01h) |
| Có module Bài viết theo alias `article`, `articleList` | Code hiện tại | `Umbraco.Plugin.Custom.Core/Articles/*` (`ArticleSchemaMigration.cs:20,53`, `ArticleSearchIndex.cs`, `ArticleReviewPolicy.cs`, `PublishedArticleService.cs`) | Bị ảnh hưởng khi đổi sang `riskArticlePage`: QĐ-046 |
| Có API công khai đọc bài viết | Code hiện tại | `Umbraco.Plugin.Custom.Api/Controllers/PublishedArticlesController.cs:11-94` (`/api/v1/article-categories`, `/api/v1/articles`), `PublishedArticleContentController.cs` (`/api/v1/article-content/fraud`, `/policy`) | `wwwroot/assets/js/articles.js` đang gọi. Bỏ theo QĐ-046 |
| Có project test | Code hiện tại | `src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/` (khoảng 30 tệp test) | `CLAUDE.md` còn ghi "chưa có project test": cần sửa (V2-14c) |
| Có công cụ nạp dữ liệu dạng console | Code hiện tại | `src/ANTC.Portal.App/Tools/SeedContests`, `SeedDrawDemo`… | Mẫu cho `Tools/ImportPortalV2` |
| Có backoffice extension viết bằng JavaScript thuần | Code hiện tại | `Umbraco.Web.UI/App_Plugins/AntcVietnamese/umbraco-package.json`, `App_Plugins/ContestManagement/*.js` | Mẫu cho `App_Plugins/AntcEditors` |
| Cấu hình `DisableDeleteWhenReferenced` có trong Umbraco 18.2.1 | Code hiện tại | `ANTC.Portal.Core/src/Umbraco.Core/Configuration/Models/ContentSettings.cs`; `appsettings.json:66` chưa bật | Bật ở V2-01h |
| Dynamic Root cho trình chọn | Code hiện tại | `ANTC.Portal.Core/src/Umbraco.Core/DynamicRoot/*` | Chưa chạy thử |
| Property editor UI gắn vào schema có sẵn | Code hiện tại | `Umbraco.Web.UI.Client/src/packages/property-editors/content-picker/manifests.ts:18` | Cách làm của `Antc.NodeCombobox` |
| Tiptap có `style-menu`, `html-attr-class`, `html-tag-div`, `table` | Code hiện tại | `Umbraco.Web.UI.Client/src/packages/tiptap/extensions/` | Dùng cho "Soạn thảo · Bài đọc" |
| Umbraco không ẩn trường theo giá trị trường khác | Đã xác nhận cách xử lý | QĐ-044 | Trường luôn hiện; tách hai loại công cụ |
| Ô "Kiểm tra trước khi xuất bản" | Đã xác nhận (khoản 3 của QĐ-031) | BO-19 chưa làm | V2-10a làm quy tắc máy chủ, V2-10b làm ô hiển thị |
| Lưu nháp khi thiếu trường Mandatory | Còn thiếu | Chưa kiểm trên Umbraco 18.2.1 | V2-10a kiểm. Nếu Umbraco vẫn cho lưu nháp thì "✔" chỉ chặn xuất bản; ghi lại kết quả |
| Đường dẫn trang | Đề xuất | Umbraco có sẵn thuộc tính `umbracoUrlName` | Dùng `umbracoUrlName` thay trường `slug` riêng. Bộ chuyển hướng có sẵn tự ghi 301 khi đường dẫn đổi; kiểm ở V2-05a |
| Một data type cho mỗi giới hạn ký tự | Đề xuất | Phụ lục B | Khoảng 22 data type chữ, đoạn. Đơn giản, đúng giới hạn đặc tả |

## Phương án và khuyến nghị

**P1. Cách chuyển từ cấu trúc cũ sang mới (CXN-4)** · Đã chọn A, QĐ-043

| | A. Thay hẳn trên nhánh `portal-v2` (khuyến nghị) | B. Chạy song song hai cây nội dung |
|---|---|---|
| Cách làm | Nhánh `portal-v2` từ `dev`. Thêm loại mới. Công cụ nhập dựng cây mới; bài cũ chuyển sang loại mới. Xóa cấu trúc cũ ở V2-14 | Thêm gốc nội dung thứ hai, chạy hai website trong một Umbraco |
| Lợi | Ít việc. Không phải cấu hình tên miền, định tuyến hai gốc | Có thể so sánh hai bản cùng lúc |
| Đánh đổi | Website cũ chỉ còn ở `dev`, `main` cho tới khi gộp | Phải cấu hình tên miền, định tuyến hai gốc; dễ lẫn nội dung |
| Ảnh hưởng | CSDL local dựng lại bằng `run-local -Reset` | Thêm việc cấu hình, kiểm định tuyến |

**P2. Trường hiện theo điều kiện (CXN-3)** · Đã chọn A, QĐ-044

| | A. Hiện luôn, kiểm phía máy chủ; tách Công cụ thành 2 loại (khuyến nghị) | B. Viết extension ẩn, hiện trường theo giá trị |
|---|---|---|
| Cách làm | Trường điều kiện luôn hiện, mô tả ghi "Chỉ cần khi…"; bắt buộc theo điều kiện kiểm ở V2-10a. `toolPage` tách thành `toolCountPage` và `toolBranchPage`, dùng chung composition `toolBase`. Trong `InlineList` (ví dụ cửa vào "Mở trang" hay "Mở danh sách") vẫn ẩn, hiện được vì do ta viết | Viết workspace extension đọc giá trị rồi ẩn thuộc tính |
| Lợi | Không đụng form gốc của Umbraco. Công cụ mỗi loại chỉ có trường của nó | Form giống hệt mockup |
| Đánh đổi | Trang Cài đặt hiện cả trường tài trợ khi tắt tài trợ | Phụ thuộc cấu trúc nội bộ form Umbraco, dễ hỏng khi nâng cấp; thêm khoảng 2 ngày |

**P3. API bài viết cũ (CXN-2)** · Đã chọn A, QĐ-046

| | A. Bỏ sau khi website mới chạy (khuyến nghị nếu chỉ website dùng) | B. Giữ đường dẫn, đổi sang đọc loại mới |
|---|---|---|
| Cách làm | View Razor mới render trực tiếp. Xóa `PublishedArticles*Controller`, `articles.js` ở V2-14a | Sửa `PublishedArticleService` đọc `riskArticlePage`, `riskCategoryPage`; giữ dạng JSON |
| Khi nào | Không có ứng dụng ngoài nào gọi `/api/v1/articles` | Có ứng dụng di động hoặc đối tác đang gọi |

## Task

Quy ước trong bảng:
- **Đường dẫn file.**
  - `uSync/` là `src/ANTC.Portal.App/Umbraco.Web.UI/uSync/v18/`.
  - `Core/` là `src/ANTC.Portal.App/Umbraco.Plugin.Custom.Core/`.
  - `Api/` là `src/ANTC.Portal.App/Umbraco.Plugin.Custom.Api/`.
  - `Web/` là `src/ANTC.Portal.App/Umbraco.Web.UI/`.
  - `Tests/` là `src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/`.
- **Đăng ký dịch vụ** C# mới chỉ ở `Core/Composers/CustomCoreComposer.cs`.
- **Luồng.**
  - `chính`: loại nội dung, uSync, quy tắc máy chủ.
  - `V2-ui`: thành phần backoffice tự viết. Chỉ sửa `Web/App_Plugins/AntcEditors/`, `Core/PortalV2/Editors/` và controller backoffice của chúng.
  - `V2-web`: website. Chỉ sửa `Web/Views/`, `Web/wwwroot/assets/`.
  - Ba luồng không sửa chung file.
- **Ước lượng** ghi trong ngoặc là ngày công của một người.

### Giai đoạn 0 · Chuẩn bị

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| V2-00 | Xác minh hạ tầng production | người (anhnn, khách) | Hệ điều hành; được cài phần mềm không; có LibreOffice (`soffice`) không; cài được font Be Vietnam Pro không; có .NET 10 không. Ghi vào `docs/ban-giao/PORTAL-V2/4-ha-tang.md` | – | Trả lời đủ 5 ý, có nguồn (nhà cung cấp hosting, người quản trị máy chủ) | Đọc file | Không chặn việc nào (QĐ-049). Chỉ cần nếu muốn bật lại LibreOffice |
| V2-00b | Nhánh, cấu hình nền, công cụ dữ liệu (0,5) | chính | Nhánh `portal-v2` từ `dev`.<br>`Web/appsettings.json`: `Umbraco:CMS:Content:DisableDeleteWhenReferenced=true`. Không bật `DisableUnpublishWhenReferenced`, vì nếu bật thì cảnh báo đang được trỏ tới không tự gỡ được sau 180 ngày và Biên tập viên không gỡ được. View phải bỏ qua trang đã gỡ.<br>Chép `build_bo.py`, `dump_schema.js`, `alias_map.js`, `make_xlsx.py` (dựng lại file kế hoạch Excel từ file này), `tach-du-lieu-ban-dung.js` từ thư mục tạm của phiên điều phối vào `docs/ban-giao/PORTAL-V2/cong-cu/`.<br>Thêm `xuat-seed.js`: xuất `seed-portal-v2.json` (nút, khóa cố định, giá trị theo alias chuẩn của Phụ lục A) | – | Build được.<br>`seed-portal-v2.json` có đúng 157 nút (danh sách nút của mockup); mọi khóa trường có trong Phụ lục A | `node xuat-seed.js`; so số nút; thử xóa một trang đang được trang khác chọn thì bị chặn | Đã làm 2026-11-03 ở worktree `C:\Project\DMST\26.antc-portal-v2` (nhánh `portal-v2`), chưa commit. Chưa thử xóa trong backoffice |

### Giai đoạn 1 · Nền: data type, danh mục, thành phần tự viết

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| V2-01a | Data type cố định và lớp ánh xạ mã (0,5) | chính | 9 data type `Danh mục · …` theo Phụ lục B, mục B1 (`uSync/DataTypes/`).<br>`Core/PortalV2/DanhMuc/DanhMucCoDinh.cs`: hằng số mã và chữ cho từng danh sách.<br>`DanhMucStartupCheck.cs`: lúc khởi động so danh sách trong data type với hằng số; lệch thì ghi cảnh báo | V2-00b | Đủ 9 data type, chữ đúng thứ tự Phụ lục B. Ánh xạ hai chiều mã ↔ chữ | `dotnet test` (test ánh xạ); sửa thử một chữ trong backoffice thì log có cảnh báo | Đã làm 2026-11-03 (portal-v2 f31889da, c2fe4684) |
| V2-01b | Data type cơ bản (0,5) | chính | Theo Phụ lục B, mục B2:<br>• `Chữ · N` và `Đoạn · N` (một data type cho mỗi giới hạn);<br>• `Chữ · Mã danh mục`, `Chữ · Liên kết https`;<br>• `Số · 1–3`, `Số · 1–8`, `Số · 30–720`;<br>• `Ngày`, `Bật/tắt`;<br>• `Danh sách dòng (min–max)`: Repeatable textstrings;<br>• `Thẻ · Từ khóa` (nhóm `tuKhoa`), `Thẻ · Từ đồng nghĩa` (nhóm `dongNghia`);<br>• `Chọn ảnh`, `Chọn tệp PDF` | V2-00b | Mọi data type Phụ lục A cần đều có. Tên theo mẫu "Nhóm · Tên" | Mở từng data type trong backoffice; uSync xuất file | Đã làm 2026-11-03 (c2fe4684) |
| V2-01c | Ba data type soạn thảo (0,5) | chính | `Soạn thảo · Chỉ in đậm`, `Soạn thảo · Rút gọn` (đậm, danh sách), `Soạn thảo · Bài đọc` (tiêu đề phụ, đậm, nghiêng, danh sách, liên kết, bảng, menu Kiểu với 7 lớp `k-box`, `k-now`, `k-chips`, `k-case`, `k-pocket`, `k-stop`, `k-note`).<br>`Web/wwwroot/assets/css/rte-portal.css` cho khung soạn | V2-00b | Chèn được hộp theo menu Kiểu. Khung soạn hiện màu hộp giống website. Dán từ Word: ghi rõ Tiptap có giữ định dạng lạ không; nếu có thì lọc ở máy chủ bằng `Core/Articles/ArticleHtmlSanitizer.cs` (V2-10a) | Soạn thử trong một trang test; xem HTML lưu ra | Đã làm 2026-11-03 (c2fe4684). Chưa xem menu Kiểu trong backoffice bằng mắt |
| V2-01d | Ba composition (0,5) | chính | `seoBase`: giữ alias đang có, thêm `canonicalUrl`, sửa alias tab không dấu.<br>`publishMetaBase`: thêm `displayUpdatedDate`.<br>`taxonomyBase`: `code`, `icon`, `isActive` (Phụ lục A, mục `channelItem`) | V2-01a, V2-01b | Ba composition có đúng trường. Trang cũ đang dùng `seoBase` vẫn mở và lưu được | Mở một bài `article` cũ, lưu lại, không lỗi | Đã làm 2026-11-03 (c2fe4684). seoBase: sửa tab sEO→seo, khôi phục 4 trường cũ chưa từng được nhập |
| V2-01e | Thư viện: 9 loại thư mục (0,5) | chính | `libraryFolder` (cho tạo ở gốc) và 8 thư mục: `channelFolder`, `audienceFolder`, `stopSignFolder`, `popularityFolder`, `topicFolder`, `tacticFolder`, `quickQaFolder`, `snippetFolder`.<br>Mỗi thư mục chỉ cho tạo một loại con.<br>Collection (list view) theo Phụ lục A: cột, lọc, cho kéo sắp<br>• QĐ-053: các thư mục này vào dưới Quản lý nội dung và bật ẩn mục con ở V2-01s | V2-01d | Đúng cây ở `2-danh-muc…` mục 4.1. Hộp "Tạo" trong mỗi thư mục chỉ hiện đúng một loại | Tạo thử trong từng thư mục | Đã làm 2026-11-03 (c2fe4684). libraryFolder chưa có Collection, xem bằng cây |
| V2-01f | Sáu loại mục danh mục và data type chọn (1) | chính | `channelItem`, `audienceItem`, `stopSignItem`, `popularityItem`, `topicItem` (chưa có `readingArticle`, `checklist`), `tacticItem` (chưa có `containingArticle`).<br>Data type `Chọn · Kênh`, `Chọn · Đối tượng`, `Chọn · Dấu hiệu phải dừng`, `Chọn · Mức độ phổ biến`, `Chọn · Chuyên đề`, `Chọn · Thủ đoạn`: Multinode Treepicker, gốc Dynamic Root tới đúng thư mục, lọc đúng loại, số lượng theo Phụ lục B. Tạm dùng giao diện mặc định | V2-01e | Trường đúng Phụ lục A. Trình chọn chỉ thấy đúng thư mục trên hai máy có CSDL khác nhau | `run-local -Reset` trên máy thứ hai; mở trình chọn | Đã làm 2026-11-03 (c2fe4684). Trình chọn trỏ khóa cố định của thư mục thay Dynamic Root (Dynamic Root tính gốc từ trang đang sửa, không tới được Thư viện) |
| V2-01g | Công cụ nhập: khung và phần danh mục (1) | chính | `src/ANTC.Portal.App/Tools/ImportPortalV2/`, theo mẫu `Tools/SeedContests`.<br>Đọc `seed-portal-v2.json`; tạo hoặc cập nhật nút theo khóa cố định, chạy lại không nhân đôi; đặt trạng thái nháp hoặc đăng theo seed.<br>Đợt này chỉ nạp Thư viện: 9 thư mục; 7 kênh, 5 đối tượng, 6 dấu hiệu, 3 mức độ phổ biến, 8 chuyên đề, 32 thủ đoạn (1 thủ đoạn ngừng dùng) | V2-01f | Đúng số nút từng thư mục. Chạy hai lần không đổi số nút | Chạy công cụ hai lần; đếm trong backoffice | Đã làm phần Thư viện 2026-11-03 (bộ dựng nạp 70 nút từ seed); phần trang còn lại thuộc V2-12a |
| V2-01h | Quy tắc máy chủ cho danh mục và cây (1) | chính | `Core/PortalV2/Rules/TaxonomySavingHandler.cs` (`ContentSavingNotification`):<br>• `code` duy nhất trong cùng loại;<br>• khóa `code` sau lần xuất bản đầu;<br>• `topicNumber` từ 1 đến 8, duy nhất, khóa sau xuất bản;<br>• độ dài tên nút theo "Tên node ≤" ở Phụ lục A.<br>Mở rộng `Core/Content/PageTreeRules.cs` cho mọi loại mới: cha và con hợp lệ, trang cố định chỉ có một | V2-01g | Thông báo lỗi tiếng Việt, đúng câu ở `2-danh-muc…` mục 6 | Test trong `Tests/`; thử trong backoffice: trùng mã, đổi mã sau đăng, số chuyên đề 9 | Làm được sau V2-01g |
| V2-01i | API C1: danh sách cho ô chọn (0,5) | V2-ui | Controller backoffice (Management API) theo mẫu trong `Core/Backoffice/`. Đọc gốc và loại từ cấu hình data type; tìm không dấu; trả về `isActive`, `isPublished`, `parentName` | – | Đúng contract C1. Không đăng nhập thì trả 401 | `Invoke-RestMethod` với cookie backoffice; test controller | Làm được |
| V2-01j | `Antc.NodeCombobox` cơ bản (1) | V2-ui | `Web/App_Plugins/AntcEditors/umbraco-package.json`, `node-combobox.js`. Property editor UI gắn schema `Umbraco.MultiNodeTreePicker`.<br>• Chọn một: hiện biểu tượng, tên, nút ×.<br>• Chọn nhiều: thẻ có nút ×.<br>• Danh sách mở ngay dưới ô; tìm không dấu (gọi C1).<br>• Bàn phím: ↑ ↓ Enter Esc Backspace.<br>• Giá trị lưu đúng định dạng của Multinode Treepicker | V2-01i | Theo `2-danh-muc…` mục 4.7 và mockup. Lưu rồi mở lại vẫn đúng. Chặn xóa vẫn chạy với nút đã chọn | Gắn thử vào `Chọn · Kênh` trên trang test; xóa kênh đang được chọn thì bị chặn | Làm được |
| V2-01k | `Antc.NodeCombobox`: trạng thái và giới hạn (0,5) | V2-ui | • Giới hạn số mục ("Đã chọn 3/4", làm mờ khi đủ).<br>• Kéo thẻ để sắp.<br>• Nhãn "Nháp".<br>• Mục ngừng dùng hiện chữ xám.<br>• Danh sách lớn: 20 mục đầu, gõ thì tìm phía máy chủ.<br>• Dòng phụ ghi tên mục cha.<br>• Thư mục rỗng<br>• `aria` cho combobox, listbox | V2-01j | Đủ mọi tình huống ở bảng "Hành vi" của `2-danh-muc…` mục 4.7 | Thử theo bảng đó | Làm được |
| V2-01l | Combobox cho danh sách cố định và thẻ (0,5) | V2-ui | Property editor UI gắn schema `Umbraco.DropDown.Flexible` (hiện chấm màu hoặc biểu tượng: tách tên biểu tượng sau dấu "·") và `Umbraco.Tags` (gõ rồi Enter để thêm thẻ mới, gợi ý thẻ đã có) | V2-01j | 9 data type `Danh mục · …` và 2 data type `Thẻ · …` dùng được giao diện mới; giá trị lưu không đổi định dạng | Lưu, mở lại; xem giá trị trong CSDL không đổi | Làm được |
| V2-01m | `Antc.InlineList` phía máy chủ (1) | V2-ui | `Core/PortalV2/Editors/InlineList*.cs`:<br>• `DataEditor` `Antc.InlineList`.<br>• Cấu hình: danh sách ô (alias, nhãn, kiểu, bắt buộc, giới hạn, điều kiện hiện), số dòng tối thiểu và tối đa, cho sắp hay không, dạng Bảng hay Thẻ, ô tóm tắt, phần tùy chọn.<br>• Giá trị là JSON, mỗi dòng có `key` GUID.<br>• Kiểm khi lưu theo cấu hình.<br>• `IDataValueReferenceFactory` cho ô chọn nút.<br>• Value converter trả `InlineListValue` có hàm đọc chữ, đọc nút, đọc danh sách dòng | V2-00b | Theo `3-thay-block-list.md` mục 3.3. Tham chiếu hiện ở mục "Đang dùng ở" của nút được chọn | `dotnet test` (kiểm, tham chiếu, chuyển đổi); thử xóa nút được chọn trong một bảng thì bị chặn | Đã làm khung 2026-11-03 (f31889da): cấu hình, kiểm, tham chiếu UDI, converter, 7 test. Giao diện tạm là ô JSON |
| V2-01r | Danh mục và ảnh theo QĐ-051, QĐ-052 (0,5) | chính | `DanhMucCoDinh`: nhãn `thuong` thành "Cần thận trọng"; thêm `LoaiCauKiemTra`, `NghiaCauTraLoi`; bỏ `MauKetQua`, `TraLoiDauHieu`.<br>• Bộ dựng đồng bộ mục của dropdown đã có và đổi giá trị đã lưu "Thường" thành "Cần thận trọng" (32 thủ đoạn ở Thư viện).<br>• Xóa hai data type bỏ (uSync ghi file `Change="Delete"`).<br>• Composition `illustrationBase`: `illustration` (Chọn ảnh), `illustrationAlt` (Chữ · 160, bắt buộc khi có ảnh, kiểm ở V2-10a) | V2-01a, V2-01d | Test danh mục khớp seed; dropdown trong backoffice hiện chữ mới; không còn giá trị "Thường" | `dotnet test`; chạy bộ dựng trên CSDL có dữ liệu cũ; xem thủ đoạn trong backoffice | Đã làm 2026-11-03 (portal-v2): bộ dựng đổi 4 thủ đoạn "Thường" → "Cần thận trọng", xóa 2 data type |
| V2-01s | Cây Quản lý nội dung, Quản lý trang (1) | chính | QĐ-053. Thứ tự gốc: `contentRoot` "Quản lý nội dung", `pagesRoot` "Quản lý trang", `Cài đặt website` (gốc riêng, cuối). Các thư mục gốc không template, không xóa.<br>• Quản lý nội dung: `alertFolder` Cảnh báo, `articleFolder` Bài viết, `actionFolder` Việc cần làm, `checklistFolder` Danh sách kiểm tra, `quickQaFolder`, `snippetFolder`, `libraryFolder` đổi tên "Danh mục" (cuối). Thư mục có Collection, mục con không hiện trên cây.<br>• Quản lý trang phẳng: Trang chủ, Khẩn cấp (con: Kiểm tra tình huống), Hãy tự kiểm tra (con: 3 kiểm tra nhanh), Các rủi ro (con: Cảnh báo mới, 5 nhóm), Hỏi – Đáp, Liên hệ, Góp ý, Cuộc thi, Tìm kiếm, 404, thư mục `otherPagesFolder` "Trang thông tin, chính sách" (cho tạo `infoPage`, `policyPage`).<br>• Chuyển 70 nút Thư viện đang có (giữ khóa).<br>• Dòng nối hai bên: Collection của thư mục nội dung hiện "Hiện trên website ở trang …" và nút Mở trang; trang tương ứng hiện số mục và nút Mở danh sách (Property editor UI `Antc.InfoPanel`, V2-01q) | V2-01e, V2-01q | Cây đúng mockup; bấm thư mục mở danh sách; nút nối hai bên mở đúng chỗ | Xem cây trong backoffice; tạo một mục trong mỗi thư mục | Làm được |
| V2-01t | Đường dẫn công khai theo đặc tả 3.3 (1) | chính | QĐ-053 khoản 3. `Core/PortalV2/Routing/PortalV2UrlProvider.cs` (IUrlProvider) và `PortalV2ContentFinder.cs` (IContentFinder), đăng ký ở `CustomCoreComposer`.<br>• Trang trong Quản lý trang: Trang chủ là `/`, trang khác tính từ Quản lý trang, bỏ đoạn "Quản lý trang" và thư mục (Trang thông tin, chính sách → `/ve-website`).<br>• Cảnh báo `/cac-rui-ro/canh-bao-moi/<tên>`, bài viết `/cac-rui-ro/<nhóm chính>/<tên>`, việc cần làm `/khan-cap/<tên>`, danh sách kiểm tra `/hay-tu-kiem-tra/<tên>`; gốc lấy theo đường dẫn hiện tại của trang tương ứng.<br>• Thư mục Quản lý nội dung không có đường dẫn (404).<br>• Trùng tên trong cùng gốc: Umbraco báo trùng khi lưu (kiểm ở `ContentSavingNotification`).<br>• Đổi Nhóm chính: đường dẫn cũ vào bảng chuyển hướng của Umbraco | V2-01s, V2-03a | Mọi trang và mục mở được bằng đường dẫn đặc tả; xem trước trong backoffice đúng đường dẫn | Gọi thử từng loại bằng `Invoke-WebRequest`; đổi nhóm chính rồi mở đường dẫn cũ | Làm được |
| V2-01u | Trang Bắt đầu của Quản lý nội dung (0,5) | V2-ui | Workspace view cho `contentRoot` (mở mặc định khi vào khu Nội dung): ba khối như mockup `#content`.<br>• Thêm mới: thẻ cho từng thư mục, số mục, nút Thêm theo quyền.<br>• Cần xử lý: cảnh báo đã đăng quá 90 ngày, bài viết chưa rà soát hoặc quá 90 ngày, bản nháp; tối đa 8 dòng.<br>• Sửa trang: lối tắt Trang chủ, Khẩn cấp, Hãy tự kiểm tra, Các rủi ro, Cài đặt website.<br>Dữ liệu lấy qua API C3 hoặc Management API sẵn có | V2-01s, V2-01q | Đủ ba khối; nút Thêm tạo đúng loại trong đúng thư mục | Mở khu Nội dung; bấm từng nút | Làm được |
| V2-01v | Màn soạn bài viết hai cột (2) | V2-ui | Theo mockup `#ar1`, bố cục như `BACKOFFICE-UI/anh/07-noi-dung-soan-bai.png`. Không đổi trường hay alias.<br>• Workspace view riêng cho `riskArticlePage` thay tab mặc định: cột trái để viết (Tiêu đề chữ lớn, Một câu mời đọc, Tóm tắt; Dấu hiệu và Việc cần làm chỉ hiện với Bài hướng dẫn; Nội dung; Nguồn; mục "Thêm chi tiết" thu gọn chứa 11 trường ít dùng). Cột phải dính khi cuộn: Xuất bản (nhóm, loại bài), Kiểm tra trước khi xuất bản (theo luật C4), Xem trước thẻ bài, Gắn nhãn (chỉ Bài hướng dẫn), Thẩm định. Dưới 1000 px thành một cột.<br>• Nhãn trên ô; dùng lại property editor đã có (combobox, InlineList, Tiptap) qua `umb-property`.<br>• `Antc.ChoiceCards` cho Loại bài.<br>• Cập nhật khung kiểm tra và thẻ xem trước khi gõ.<br>Rủi ro: workspace view tự viết phải tự xử lý lưu, kiểm lỗi, so sánh phiên bản giống tab chuẩn; làm thử một loại trước rồi mới áp cho Cảnh báo, Danh sách kiểm tra | V2-01q, V2-01l, V2-01n | Đủ trường như Phụ lục A; lưu, kiểm lỗi, xuất bản như form chuẩn; gõ tiêu đề thì thẻ đổi ngay | Mở bài nháp, điền dần; lưu khi thiếu trường bắt buộc; xem ở 1440 và 900 px | Làm được |
| V2-01n | `Antc.InlineList` dạng Bảng (1) | V2-ui | `Web/App_Plugins/AntcEditors/inline-list.js`, `inline-list.css`.<br>• Ô chữ, ô đoạn tự cao lên, ô số, ô ngày.<br>• Ô chọn dùng combobox của V2-01j, V2-01l.<br>• Dòng mở rộng ▸.<br>• Thêm dòng; xóa có Hoàn tác 8 giây; kéo ⋮⋮ và bàn phím để sắp.<br>• Bảng cố định số dòng.<br>• Lỗi hiện dưới từng ô.<br>• Khung hẹp hơn 720 px chuyển sang thẻ | V2-01m, V2-01l | Thao tác giống màn Khẩn cấp và Cài đặt website trong mockup | Gắn vào một data type thử; làm theo khung "Thử trong màn này" của mockup v1 | Làm được |
| V2-01o | `Antc.InlineList` dạng Thẻ (1) | V2-ui | Thẻ có dòng tóm tắt và nhãn đặc điểm; mở, thu; Mở hết, Thu hết; nhân bản; chèn giữa; xóa có Hoàn tác.<br>Trong thẻ: danh sách dòng, bảng nhỏ (một cấp), phần tùy chọn bật tắt (ví dụ "Hỏi thêm"), ô hiện theo điều kiện trong dòng (ví dụ cửa vào "Mở trang" hay "Mở danh sách") | V2-01n | Thao tác giống màn Việc cần làm, Khẩn cấp (Ba cửa vào) và Checklist trong mockup | Như trên | Làm được |
| V2-01p | `Antc.InlineList`: dán, bàn phím, so sánh phiên bản (0,5) | V2-ui | • Dán nhiều dòng (Tab tách cột) từ Excel hoặc Word.<br>• Enter ở ô cuối thì thêm dòng.<br>• Danh sách dòng: Enter thêm dòng, Backspace ở dòng trống thì xóa, Alt + ↑ ↓ để chuyển dòng.<br>• Hiện dạng bảng ở màn so sánh phiên bản; không làm được thì ghi giới hạn | V2-01o | Dán 5 dòng 3 cột vào bảng số đường dây nóng thì ra 5 dòng | Thử dán | Làm được |
| V2-01q | `Antc.InfoPanel` và API C3 (0,5) | V2-ui | Property editor UI chỉ hiển thị, gắn schema `Umbraco.Label`. Gọi C3, hiện: địa chỉ trang, "Đang dùng ở", thời gian đọc, tình trạng 90 ngày, nút tải PDF của checklist đang trỏ tới tệp hay bản in | V2-01i | Các trường "— (không lưu)" ở Phụ lục A hiện đúng | Mở cảnh báo, bài viết, đoạn dùng chung, checklist | Làm được |
| I-01 | Gắn giao diện tự viết vào data type | chính | Sau khi gộp nhánh `lane/V2-ui`: đổi `EditorUIAlias` của mọi `Chọn · …`, `Danh mục · …`, `Thẻ · …` sang giao diện mới; commit uSync | V2-01f, V2-01l | Không còn ô chọn nào mở hộp thoại | Mở form từng loại đã có | Chờ V2-01l |

### Giai đoạn 2 · Loại nội dung

Mỗi task dưới đây gồm:
- loại nội dung đúng Phụ lục A (tab, nhóm, alias, data type, bắt buộc, mô tả);
- các data type `Chọn · …` mà loại đó cần;
- loại con được phép;
- biểu tượng, mô tả;
- Collection nếu Phụ lục A ghi;
- template nối `Partials/_PageStub` để xem trước được;
- file uSync.

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| V2-02a | `siteSettings` (1) | chính | Loại mới cho phép ở gốc, 6 tab. Ba bảng `InlineList`: `stopPrinciples` (cố định 4 dòng), `mainLinks` (cố định 4), `extraLinks`.<br>`Chọn · Trang trong website` (lọc mọi loại `…Page`).<br>`antc` giữ tới V2-14b | V2-01d, I-01 | Đúng Phụ lục A. Biên tập viên chưa bị ẩn tab (việc đó ở V2-11a) | Tạo nút, điền đủ, xuất bản | Chờ I-01 |
| V2-03a | `riskArticlePage` (1) | chính | Ba tab và SEO.<br>• `scenarios`: Thẻ.<br>• `references`: Bảng, ngày truy cập ở dòng mở rộng.<br>• `readingBody`: `Soạn thảo · Bài đọc`; `summary`: `Soạn thảo · Chỉ in đậm`.<br>• `Chọn · Bài viết`.<br>Thêm `tacticItem.containingArticle`, `topicItem.readingArticle`.<br>Mẫu nội dung (blueprint) cho ba loại bài<br>• QĐ-053: thêm `primaryGroup` "Nhóm chính" (Chọn · Nhóm rủi ro, bắt buộc) quyết định đường dẫn; bài viết tạo trong Quản lý nội dung › Bài viết<br>• Một tab Viết bài (và SEO), bố cục hai cột theo mockup `#ar1`; nhóm trường khai báo đúng Phụ lục A để V2-01v xếp vào hai cột | V2-01c, I-01 | Đúng Phụ lục A. Tạo bài từ blueprint thì có sẵn khung | Tạo ba bài ba loại | Chờ I-01 |
| V2-03b | `ruiRoPage`, `riskCategoryPage` (0,5) | chính | `riskCategoryPage` có tab Danh sách (Collection bài viết: cột, lọc theo Phụ lục A). `Chọn · Nhóm rủi ro`<br>• QĐ-053: bỏ tab Danh sách của `riskCategoryPage`; Collection bài viết (thêm cột, lọc Nhóm chính) đặt ở `articleFolder`; trang nhóm chỉ hiện dòng đếm bài | V2-03a | Trang nhóm hiện danh sách bài con, lọc theo loại bài, trạng thái | Tạo 5 nhóm thử | Chờ I-01 |
| V2-04a | `alertListPage`, `alertPage` (1) | chính | `alertPage` có 4 tab và SEO. `alertListPage` có tab Danh sách: cột Mức độ (chấm màu), Phổ biến, Ngày cập nhật, Còn mới, Trạng thái; lọc Trạng thái, Mức độ, Mức độ phổ biến, Kênh.<br>`Chọn · Cảnh báo`.<br>`Chọn · Bài liên quan` (tạm gồm bài viết, cảnh báo; thêm checklist ở V2-08a)<br>• QĐ-053: tab Danh sách chuyển sang `alertFolder`; `alertListPage` chỉ còn trường của trang | V2-03b | Đúng Phụ lục A | Tạo, lọc, xuất bản hàng loạt trong Collection | Chờ I-01 |
| V2-04b | Cảnh báo theo thời gian (1) | chính | `Core/PortalV2/Alerts/AlertFreshness.cs`: còn mới khi `updatedDate` không quá 90 ngày; ghim ở trang chủ tự bỏ sau 90 ngày.<br>`AlertAutoUnpublishJob.cs` (`IRecurringBackgroundJob`, mỗi ngày): hủy xuất bản khi quá `autoUnpublishDays`, ghi log và lịch sử nút | V2-04a | Cảnh báo quá hạn tự gỡ. Hàm "còn mới" dùng chung cho view và `InfoPanel` | `dotnet test` (mốc 89, 90, 91 ngày); sửa ngày của một cảnh báo thử rồi chạy job | Chờ I-01 |
| V2-05a | `sharedSnippet`, `viecCanLamPage` (1) | chính | • `Chọn · Đoạn dùng chung`.<br>• `viecCanLamPage`: `steps` (Thẻ, phần tùy chọn "Hỏi thêm" bật bằng `hasFollowUp`), `screeningQuestions` (Bảng).<br>• `Chọn · Việc cần làm` (một, nhiều).<br>• Đường dẫn dùng `umbracoUrlName`<br>• QĐ-053: `viecCanLamPage` tạo trong Quản lý nội dung › Việc cần làm (`actionFolder`, kéo sắp); `khanCapPage` bỏ tab Danh sách | V2-03a | Đúng Phụ lục A. Đổi `umbracoUrlName` thì bộ chuyển hướng có sẵn ghi 301 | Đổi đường dẫn một trang, mở đường dẫn cũ | Chờ I-01 |
| V2-07a | `wizardPage`: tab Câu hỏi, tab Kết quả (0,5) | chính | Ba bảng lựa chọn `step1Options`…`step3Options`, mỗi dòng có `key` cố định. Tab Kết quả theo Phụ lục A. Tab Ma trận để trống tới V2-07b | V2-05a | Đúng Phụ lục A. Sửa nhãn lựa chọn không đổi `key` | Sửa nhãn, xem JSON | Chờ I-01 |
| V2-07b | Ma trận phía máy chủ và hàm tính điểm (1) | V2-ui | `Core/PortalV2/Wizard/`: `WizardMatrixEditor` (`DataEditor` `Antc.WizardMatrix`), kiểm cấu trúc JSON, `IDataValueReferenceFactory` (bài và checklist trong từng hàng), value converter.<br>`WizardScoring.cs`: điểm = 2 × số lựa chọn bước 2, 3 trùng, cộng 3 nếu kênh trùng; chỉ tính hàng có ít nhất một lựa chọn bước 2 hoặc 3 trùng; lấy tối đa `maxSituations` hàng; mức độ cao nhất; hòa điểm thì theo thứ tự hàng | V2-07a | Theo `1-phan-tich…` mục 6.4. Bộ ca kiểm dùng chung với JS (V2-07d, V2-13d) đặt ở `docs/ban-giao/PORTAL-V2/cong-cu/wizard-cases.json` | `dotnet test` với ít nhất 6 ca, trong đó có: ngân hàng và OTP; đầu tư crypto; không khớp | Chờ I-01 |
| V2-07c | Ma trận: bảng (1) | V2-ui | `Web/App_Plugins/AntcEditors/wizard-matrix.js`:<br>• Cột đầu cố định khi cuộn; tiêu đề cột viết dọc; nhóm 3 bước theo màu; bấm ô để bật, tắt.<br>• Tìm, lọc mức độ, "Chỉ hàng có cảnh báo".<br>• Kéo để sắp.<br>• Khối cảnh báo: hàng thiếu thông tin, lựa chọn chưa thuộc hàng nào, ô trỏ tới lựa chọn đã xóa | V2-07b | Giống tab Ma trận trong mockup (`#qt.wizard`) | Bật, tắt ô; lưu; mở lại | Làm được |
| V2-07d | Ma trận: ngăn chi tiết và "Thử kết quả" (1) | V2-ui | Ngăn bên phải sửa tên, mức độ, dấu hiệu (1–3), việc cần làm (1–4), bài, checklist, "Đang dùng"; nhân bản; xóa có Hoàn tác.<br>Khung "Thử kết quả" tính bằng JS theo cùng bộ ca kiểm | V2-07c | Kết quả JS khớp `WizardScoring` trên mọi ca trong `wizard-cases.json` | Chạy bộ ca bằng `node`; thử tay trên màn | Làm được |
| V2-08a | `congCuPage`, kiểm tra nhanh, `checklistPage` (1) | chính | • `congCuPage` "Hãy tự kiểm tra": ba nhóm Kiểm tra nhanh, Danh sách kiểm tra, Kiểm tra kiến thức (`knowledgeLinks`); tab Danh sách kéo sắp.<br>• `toolCountPage`: `questions` (Thẻ: `questionKind`, `question`, `hint`, `answerOptions`), nhãn ba mức, `stopActions`/`holdActions`/`clearActions` (trang việc cần làm + số bước), `readMore`, `showAdviceBox`.<br>• `toolBranchPage`: `questions` (Thẻ: câu, nhãn tình huống, chữ nút, trang việc cần làm, `takeSteps`), hộp nguy hiểm tức thời, `allNoActions`, `hitTitle` có `{n}`.<br>• `checklistPage`: phần 1 `stopQuestions` (≤ 8), phần 2 `pocketItems` (≤ 15), `stopNow`, `holdNow`, `pdfFile` (QĐ-049).<br>• Kiểm máy chủ: số bước tồn tại trong trang việc cần làm.<br>• `Chọn · Kiểm tra nhanh`, `Chọn · Danh sách kiểm tra`; thêm `topicItem.checklist`; thêm danh sách kiểm tra vào `Chọn · Bài liên quan`. Gắn `illustrationBase` (QĐ-052)<br>• QĐ-053: `checklistPage` tạo trong Quản lý nội dung › Danh sách kiểm tra (`checklistFolder`, kéo sắp, thứ tự hiện ở Hãy tự kiểm tra); `congCuPage` bỏ tab Danh sách; 3 kiểm tra nhanh vẫn là trang con của Hãy tự kiểm tra | V2-03a, V2-01r | Đúng Phụ lục A; số bước sai bị chặn khi lưu | Tạo danh sách mới bằng nút Tạo của trang cha; nhập số bước 9 ở trang 5 bước | Làm được |
| V2-06a | `khanCapPage` (1) | chính | Tab Danh sách (trang Việc cần làm, ngày rà soát).<br>• `doors`: Thẻ cố định 3, trong thẻ có bảng `options`; hiện `targetPage` hay `options` theo `openMode`.<br>• `stateHotlines`, `bankHotlines`: Bảng.<br>• `typicalSituations`.<br>• `Chọn · Việc cần làm hoặc trình hỏi` | V2-05a, V2-07a | Đúng Phụ lục A | Điền thử ba cửa vào hai kiểu | Chờ I-01 |
| V2-06b | `homePage` (0,5) | chính | Bốn nhóm khối; `tools` đúng 3, sắp được; `pinnedAlert`. Cho tạo con `infoPage`, `policyPage` (chỉ Quản trị) | V2-04a, V2-08a | Đúng Phụ lục A | Tạo nút trang chủ mới | Làm được |
| V2-08b | Bản in A4, tệp thay thế, đường tải PDF (1,5) | chính | `Core/PortalV2/Pdf/ChecklistPdfResolver.cs`.<br>Đường tải `/{checklist}/tai-pdf`: có `pdfFile` thì trả tệp; không có thì chuyển sang bản in A4.<br>Cấu hình `Checklist:Pdf:Mode`, mặc định `Upload` (QĐ-049). Giữ chỗ nhánh `LibreOffice` để bật sau. View in A4 làm ở V2-13g | V2-08a | Có tệp thì tải tệp, không có thì mở bản in | `curl -I` đường tải ở hai trường hợp | Làm được |
| V2-08c | Dịch vụ PDF bằng LibreOffice (2) | chính | `Core/PortalV2/Pdf/`: mẫu `App_Data/pdf/checklist-mau.docx`, điền bằng OpenXML.<br>Hàng đợi nền: mỗi lần một tiến trình, dùng `-env:UserInstallation`, có `TimeoutSeconds`.<br>Sinh khi xuất bản (`ContentPublishedNotification`). Lưu theo khóa nút và số phiên bản.<br>Trạng thái hiện qua C3; lệnh "Sinh lại" qua C3.<br>Không thấy `soffice` thì tự chuyển chế độ và ghi cảnh báo | V2-08b, V2-00 | Theo `1-phan-tich…` mục "PDF checklist (QĐ-036)". PDF hiện đúng chữ có dấu | Máy có LibreOffice: xuất bản checklist thì có PDF. Đổi `SofficePath` sai thì chế độ tự chuyển | Tạm dừng (QĐ-049). Chỉ làm khi hosting cài được LibreOffice |
| V2-09a | Trang thông tin, chính sách, liên hệ, góp ý (1) | chính | `infoPage`, `policyPage` (thay `chinhSachPage`, `policyContent` ở V2-14b), `lienHePage` (`contactGroups`: Thẻ), `gopYPage` | V2-06b | Đúng Phụ lục A | Tạo mỗi loại một trang | Làm được |
| V2-09b | Hỏi – đáp nhanh (0,5) | chính | `quickQaItem` (thư mục đã có ở V2-01e). `hoiDapPage` giữ nguyên, chỉ cho phép đọc danh sách ở V2-13j | V2-01e | Đúng Phụ lục A | Tạo 2 mục | Chờ I-01 |
| V2-09c | API C2 Góp ý và nơi lưu (1,5) | chính | Theo QĐ-047, làm giống câu hỏi Hỏi – Đáp nhưng bảng riêng, không sửa phần Hỏi – Đáp:<br>• `Api/Controllers/FeedbackController.cs` (`POST /api/v1/feedback`, lỗi theo QĐ-004), theo mẫu `QuestionsController.cs`.<br>• `Core/Feedback/`: `FeedbackSubmission` (entity), `FeedbackSubmissionService`, chính sách lưu giữ theo mẫu `QuestionRetentionPolicy` và `QuestionRetentionService`.<br>• Migration EF.<br>• Chống gửi dồn theo cách `QuestionSubmissionService` đang làm.<br>• Màn xem và xử lý góp ý trong khu Hỏi – Đáp của backoffice | V2-09a | Đúng contract C2. Gửi câu hỏi Hỏi – Đáp vẫn chạy như cũ | `Invoke-RestMethod` hợp lệ, thiếu trường, gửi dồn; kiểm `app.sqlite.db`; gửi thử một câu hỏi Hỏi – Đáp | Làm được |

### Giai đoạn 3 · Quy tắc, quyền, dữ liệu

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| V2-10a | Kiểm khi xuất bản phía máy chủ (1,5) | chính | `Core/PortalV2/Rules/PublishRules.cs`: bảng luật theo loại, lấy cột "khi đăng" và "có điều kiện" của Phụ lục A.<br>Thêm luật riêng:<br>• mức kết quả công cụ phủ hết từ 0 tới số câu hỏi, không chồng nhau;<br>• hàng ma trận đang dùng đủ thông tin;<br>• alt bắt buộc khi có ảnh;<br>• trường tài trợ bắt buộc khi bật tài trợ;<br>• lọc HTML soạn thảo.<br>Dùng `ContentPublishingNotification` (hủy và trả từng lỗi).<br>Kiểm và ghi lại: Umbraco 18.2.1 có cho lưu nháp khi thiếu trường Mandatory không | V2-09a, V2-07b | Thiếu trường "khi đăng" thì không xuất bản được, nhưng lưu nháp được. Thông báo nêu tên trường | `dotnet test` cho bảng luật; thử trên cảnh báo, bài viết, công cụ, ma trận | Làm được |
| V2-10b | Ô "Kiểm tra trước khi xuất bản" và API C4 (1) | V2-ui | Workspace info app (BO-19) đọc C4, cùng bảng luật V2-10a. Liệt kê mục còn thiếu, bấm thì nhảy tới trường. Phối hợp `BACKOFFICE-UI` để không làm hai lần | V2-10a | Theo QĐ-031 khoản 3 | Mở bài thiếu thông tin | Làm được |
| V2-11a | Hai nhóm quyền (1) | chính | Nhóm "Quản trị viên" và "Biên tập viên" theo `1-phan-tich…` mục 9 và cột Tạo, Xóa của Phụ lục A:<br>• quyền theo nút: không Create, Delete, Move trên trang cố định; không Create, Delete ở `stopSignFolder`, `topicFolder`, `snippetFolder`, Việc cần làm, trang thông tin, chính sách;<br>• quyền theo trường (`DocumentPropertyValuePermission`): ẩn tab và trường "chỉ Quản trị";<br>• `wizardPage`: Biên tập viên không mở.<br>Kiểm xem uSync có xuất nhóm người dùng không; nếu không thì tạo bằng migration chạy một lần.<br>Giữ nhóm `quanTriCuocThi` | V2-10a | Đúng bảng quyền | Hai tài khoản thử; đi theo bảng kiểm ở V2-11b | Làm được |
| V2-11b | Kiểm quyền đầu–cuối (0,5) | chính | Bảng kiểm từng loại: thấy, sửa, tạo, xóa, xuất bản, khôi phục, làm rỗng Thùng rác; cho cả hai nhóm. Ghi kết quả vào `2-ban-giao.md` | V2-11a | Không có ô sai | Thực hiện bảng kiểm | Làm được |
| V2-12a | Công cụ nhập: các trang (1,5) | chính | Mở rộng `Tools/ImportPortalV2`: Cài đặt website, Trang chủ, Khẩn cấp, trình hỏi (gồm ma trận 10 hàng), 10 Việc cần làm, Công cụ & checklist, 3 công cụ, 8 checklist, Các rủi ro, 5 nhóm, 10 cảnh báo, 8 bài đọc chuyên đề, 10 bài đọc thêm, 7 hỏi – đáp nhanh, 5 đoạn dùng chung, 5 chính sách, 3 trang thông tin, Liên hệ, Góp ý | V2-11a | Đủ 157 nút như mockup; mọi tham chiếu trỏ đúng | Chạy trên CSDL mới (`run-local -Reset`); xuất bản toàn bộ không lỗi luật V2-10a (trừ nút ghi nháp) | Làm được |
| V2-12b | Chuyển 40 bài `article` cũ (1,5) | chính | Ánh xạ:<br>• `body` → `readingBody`; `summary` → `summary`; `image` → `image`;<br>• `lastReviewedDate` → `reviewDate`;<br>• `sourceAgency`, `sourceDocNo`, `sourceDocDate` → một dòng `references`;<br>• `labelType` → `articleKind`; `showOnHome` → `isFeatured`; `isDraft` → trạng thái nháp; `updatedDate` → `displayUpdatedDate`.<br>Nhóm theo bảng ánh xạ do Claude lập nháp, Ban biên tập duyệt (QĐ-043). Ghi chuyển hướng 301 từ đường dẫn cũ | V2-12a, bảng ánh xạ | Đủ 40 bài; đường dẫn cũ chuyển đúng | Đếm; mở 5 đường dẫn cũ | Chờ bảng ánh xạ được Ban biên tập duyệt (QĐ-043) |
| V2-12c | Danh sách nội dung chờ Ban biên tập (0,5) | chính | Xuất `docs/ban-giao/PORTAL-V2/5-noi-dung-cho-duyet.md`:<br>• câu chữ công cụ 3 (QĐ-033);<br>• kênh, đối tượng, mức độ của 31 thủ đoạn;<br>• chỗ còn ngoặc vuông;<br>• nguồn và ngày kiểm chứng số tổng đài;<br>• tên ngắn chuyên đề 1 và 8;<br>• căn cứ mức độ phổ biến | V2-12a | Mỗi dòng có đường dẫn nút trong backoffice | Đọc file | Làm được |

### Giai đoạn 4 · Website (luồng `V2-web`, sau khi loại tương ứng đã gộp)

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| V2-13a | Khung chung (1,5) | V2-web | `Web/Views/Shared/_SiteLayout.cshtml`, `Partials/PortalV2/_Header`, `_Footer`, `_TopBar`, `_Sponsor`, `_Seo`, `_Breadcrumb`; `wwwroot/assets/css/tokens.css` (bảng màu của khách: Navy `#123B63`, Blue `#0B6BCB`, Yellow `#FFC94D`, Orange `#D9531E`, Green `#1E7B4D`, nền `#F5F7FA`).<br>• Menu 3 mục.<br>• Dải trên cùng theo `topBarMode`.<br>• Chân trang lấy từ `siteSettings`.<br>• Lối vào Cuộc thi theo `showContestEntry` | V2-02a | Giống mockup portal ở 1440, 744, 390 px | Chụp 3 bề rộng, so mockup | Chờ I-01 |
| V2-13b | Trang chủ (1) | V2-web | `homePage.cshtml`.<br>• Khối Khẩn cấp.<br>• 3 thẻ công cụ.<br>• 5 thẻ nhóm, đếm bài tự động.<br>• Cảnh báo còn mới (tối đa `alertCount`, ghim); không có cảnh báo nào còn mới thì khối ẩn | V2-06b, V2-04b | Như mockup `#trang-chu` | Chụp; đổi ngày cảnh báo để khối ẩn | Làm được |
| V2-13c | Khẩn cấp (1) | V2-web | `khanCapPage.cshtml`.<br>• Lối vào trình hỏi.<br>• Ba cửa: mở trang ngay, hoặc mở danh sách tại chỗ.<br>• Tình huống điển hình.<br>• Số tổng đài; dấu "chưa kiểm chứng" khi thiếu nguồn.<br>• Hộp tự tìm số ngân hàng | V2-06a | Như mockup `#khan-cap` | Chụp; bấm cửa vào | Chờ I-01 |
| V2-13d | Trình hỏi (1,5) | V2-web | `wizardPage.cshtml` và `wwwroot/assets/js/wizard.js`.<br>• Quy tắc nhúng trong HTML; tính trên trình duyệt; không gửi máy chủ.<br>• 3 bước, quay lại được.<br>• Kết quả 4 khối, 4 nút; trạng thái "Cần thận trọng".<br>• Câu bắt buộc dưới kết quả | V2-07d | Kết quả khớp `wizard-cases.json`. Không có request mạng khi trả lời | `node` chạy bộ ca trên `wizard.js`; DevTools: không có request | Làm được |
| V2-13e | Việc cần làm (1) | V2-web | `viecCanLamPage.cshtml`.<br>• Bước có ô đánh dấu (lưu trên máy người xem).<br>• Diễn giải, câu nói mẫu, hộp số ngân hàng.<br>• Điều kiện, đoạn dùng chung, hộp "Hỏi thêm".<br>• Trang hỏi nhanh với câu sàng lọc.<br>• Dấu quá 90 ngày rà soát | V2-05a | Như mockup `#viec.N` | Chụp trang 0, 2, 3 | Chờ I-01 |
| V2-13f | Hãy tự kiểm tra, kiểm tra nhanh (1,5) | V2-web | `congCuPage.cshtml`; view cho hai kiểu kiểm tra nhanh; `wwwroot/assets/js/tool.js`. Theo bản dựng `antoantaichinh_co_anh_nen_sang.html` (QĐ-051):<br>• Mỗi lần một câu, có "Tôi chưa biết", quay lại được, sửa câu trả lời, làm lại.<br>• Kiểm tra nhanh: câu Phải dừng trả lời Có thì kết luận ngay mức Rất cao; còn lại lý do (Phải dừng chưa biết; Tạm hoãn Có hoặc chưa biết; Cần kiểm tra Không hoặc chưa biết) thì mức Cao, không lý do thì Cần thận trọng. Hiện lý do, việc nên làm lấy nguyên văn bước của trang việc cần làm, đọc thêm.<br>• Theo nhánh: Có hoặc chưa biết mở nhóm việc theo thứ tự câu; "(nếu đúng như vậy)" khi chưa biết; không nhóm nào thì "Bạn chưa mất gì".<br>• Nhãn và câu khuyến nghị theo mức lấy ở Cài đặt website. Ảnh minh họa dưới tiêu đề | V2-08a | Đúng kết quả ở mọi tổ hợp trả lời của ba kiểm tra nhanh, khớp bản dựng | Thử tay; chạy bộ ca bằng `node`, so với hàm `tsResult`, `t3Result` của bản dựng | Làm được |
| V2-13g | Danh sách kiểm tra và bản in A4 (1) | V2-web | `checklistPage.cshtml`: phần 1 chọn Có / Không / Tôi chưa biết, phần 2 ô tích, nút Xem kết quả: có câu Có thì Rất cao kèm `stopNow`; có câu chưa biết hoặc ô chưa tích thì Cao kèm `holdNow`; còn lại Cần thận trọng. Báo lỗi khi phần 1 còn câu chưa chọn.<br>`wwwroot/assets/css/print.css` dùng chung cho danh sách kiểm tra, kết quả kiểm tra nhanh, kết quả trình hỏi: ô vuông, ngày cập nhật, 4 nguyên tắc, câu bắt buộc, tên website | V2-08b | Kết quả khớp hàm `bkResult` của bản dựng; in ra đủ 1–2 trang A4, không vỡ trang giữa phần | Thử tay ba mức; Chrome "In", lưu PDF xem | Làm được |
| V2-13h | Các rủi ro: danh sách (1,5) | V2-web | • `ruiRoPage` chuyển hướng 301.<br>• `alertListPage.cshtml`: dòng "Mẫu trình bày", lọc theo ngày cập nhật.<br>• `riskCategoryPage.cshtml`: tab 6 mục; lọc `?kenh=`, `?doi-tuong=` theo `code`; thẻ thủ đoạn; bài ghim; phân trang; "Không thấy câu trả lời?" | V2-04a, V2-03b | Như mockup `#cac-rui-ro.*`. Mục ngừng dùng không hiện ở bộ lọc | Chụp; thử bộ lọc qua địa chỉ | Chờ I-01 |
| V2-13i | Trang cảnh báo, trang bài viết (1,5) | V2-web | `alertPage.cshtml`: nguồn (nếu có), mức độ, mức độ phổ biến, kịch bản, dấu hiệu, việc cần làm.<br>`riskArticlePage.cshtml`:<br>• 7 phần mẫu bài;<br>• hộp `k-*`;<br>• tô sáng kịch bản theo neo khi mở từ thẻ thủ đoạn;<br>• bài liên quan (tự lấy cùng nhóm khi trống);<br>• dấu quá hạn rà soát; thời gian đọc;<br>• `canonical` theo nhóm chính | V2-03a, V2-04a | Như mockup `#canh-bao.N`, `#bai.*`, `#doc.N` | Chụp 3 bề rộng | Chờ I-01 |
| V2-13j | Trang còn lại (1) | V2-web | `infoPage`, `policyPage`, `lienHePage`, `gopYPage` (form gọi C2, báo lỗi theo trường).<br>Thêm danh sách hỏi – đáp nhanh dạng accordion vào `hoiDapPage.cshtml` | V2-09a, V2-09b, V2-09c | Như mockup `#trang.*` | Gửi góp ý thật lên API local | Làm được |
| V2-13k | Tìm kiếm (1) | V2-web | Sửa `Core/Articles/ArticleSearchIndex.cs`, `ArticleSearchIndexing.cs` cho loại mới.<br>• Chỉ mục gồm `searchKeywords`, `synonyms`.<br>• Chặn tra chuỗi toàn chữ số từ 6 ký tự (đặc tả 11.4, Điều 4).<br>• `searchPage.cshtml` hiện kết quả theo loại | V2-12a | Tìm "otp", "ma xac thuc" (không dấu) ra bài; tìm "0912345678" bị từ chối kèm lời giải thích | Thử trên trang tìm kiếm | Làm được |
| V2-13l | SEO kỹ thuật, đường dẫn cũ (1) | V2-web | • `sitemap.xml` (bỏ trang `hideFromSearch`); `robots.txt` theo `disableIndexing`.<br>• Schema.org: `Article`, `FAQPage` (hỏi – đáp nhanh), `BreadcrumbList`, `WebSite`.<br>• OG, canonical.<br>• Đoạn JS chuyển địa chỉ dạng `#pb2` của bản dựng sang trang mới (bảng `ALIAS` trong `app.js`) | V2-13a | Các trình kiểm schema không báo lỗi | Xem nguồn trang; `curl /sitemap.xml` | Chờ I-01 |
| V2-13m | Rà soát giao diện toàn site (1) | V2-web | Mọi trang ở 1440, 744, 390 px; bàn phím; giảm chuyển động; tương phản; chụp lại bằng `docs/ke-hoach/anh-v2/cong-cu/` | V2-13a → V2-13l | Không tràn ngang; đủ nhãn cho trình đọc màn hình | Bộ ảnh chụp | Làm được |

### Giai đoạn 5 · Dọn và tích hợp

| # | Task | Luồng | Phạm vi / file dự kiến | Phụ thuộc | Tiêu chí hoàn thành | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| V2-14a | API bài viết cũ (0,5) | chính | Theo QĐ-046: xóa `PublishedArticlesController`, `PublishedArticleContentController`, `wwwroot/assets/js/articles.js`; bỏ phần `PublishedArticleService` không còn dùng; sửa test liên quan | V2-13i | Không còn đường dẫn trả 500 | `curl` các đường dẫn cũ | Làm được |
| V2-14b | Xóa cấu trúc cũ (1) | chính | • Loại: `antc`, `home`, `ungPhoPage`, `thuDoanPage`, `thamGiaPage`, `article`, `articleList`, `articleManagement`, `contentManagement`, `pageManagement`, `fraudContent`, `policyContent`, `chinhSachPage`, `qaItem`, khối Block Grid không thuộc Cuộc thi và Hỏi – Đáp.<br>• Data type `ANTC…`, `Antc…`, `Danh mục · Vai trò`, `Danh mục · Biểu tượng lĩnh vực`, `Bố cục trang · Block Grid`.<br>• View và partial cũ.<br>• `ArticleSchemaMigration.cs`; luật cũ trong `PageTreeRules`.<br>Giữ file uSync `Empty … Change="Delete"` | V2-12b, V2-14a | `run-local -Reset` trên máy sạch dựng đủ site mới, không lỗi uSync | Chạy lại từ đầu | Làm được |
| V2-14c | Cập nhật tài liệu (0,5) | chính | Sinh lại `docs/so-do/SO-DO.md`; sửa `README.md`, `CLAUDE.md` (có project test; loại nội dung mới; `App_Plugins/AntcEditors`); cập nhật `TRANG-THAI.md` | V2-14b | Tài liệu khớp code | Đọc lại | Làm được |
| I-02 | Kiểm đầu–cuối | chính | Máy sạch: `run-local -Reset` → công cụ nhập → đi hết các luồng:<br>• Biên tập viên viết cảnh báo, bài, checklist; thêm danh mục; thử xóa mục đang dùng.<br>• Quản trị viên sửa ma trận, công cụ, cài đặt.<br>• Người dân dùng trình hỏi, công cụ, in checklist, tìm kiếm, gửi góp ý | Mọi task | Không lỗi; báo cáo theo mẫu `/quality-check` | Bảng kiểm trong `3-review.md` | Chờ mọi task |

Tổng ước lượng khoảng 57 ngày công (62 task), chưa tính việc của Ban biên tập. Chạy hai luồng song song thì rút được khoảng 10 ngày theo lịch.

Đường găng:
V2-00b → V2-01a…f → V2-01r → V2-01s → V2-01t → I-01 → V2-03a → V2-05a → V2-07a → (V2-07b…d) → V2-08a → V2-10a → V2-11a → V2-12a → website → I-02.

Luồng `V2-ui` (V2-01i đến V2-01q, V2-07b đến V2-07d, V2-10b) chạy song song với luồng `chính` ngay, vì contract đã chốt ở QĐ-045. Luồng `V2-web` bắt đầu khi loại tương ứng đã gộp.

## Contract

Bốn API mới. C1, C3, C4 là API backoffice nội bộ (cần đăng nhập backoffice); C2 là API công khai. Lỗi có dạng `{ "error": { "code", "message", "fields" } }` (QĐ-004). Đã chốt: C1, C3, C4 ở QĐ-045; C2 ở QĐ-047.

**C1 · Danh sách cho ô chọn**

`GET /umbraco/management/api/v1/antc/picker-items?dataType={guid}&q={chuỗi}&skip=0&take=20`

```json
{ "total": 31, "items": [
  { "key": "6f1c…", "name": "Mạng xã hội", "icon": "users", "code": "mang-xa-hoi",
    "isActive": true, "isPublished": true, "parentName": "Kênh tiếp cận", "contentType": "channelItem" } ] }
```

- Lỗi: `401 UNAUTHORIZED`, `404 DATATYPE_NOT_FOUND`, `400 VALIDATION_FAILED` (`take` lớn hơn 100).
- Tìm không dấu theo tên, mã, tên mục cha.
- Thứ tự theo thứ tự nút trong cây.

**C2 · Gửi góp ý**

`POST /api/v1/feedback`

```json
{ "pageUrl": "/cac-rui-ro/lua-dao/…", "kind": "sai-noi-dung", "message": "…", "contact": "", "consent": true }
```

- Trả `201 { "id": "…" }`.
- Lỗi: `400 VALIDATION_FAILED` (`fields`: `message` rỗng hoặc dài hơn 2000 ký tự, `consent` chưa đồng ý); `429 RATE_LIMITED`.

**C3 · Thông tin hiển thị của một nút**

`GET /umbraco/management/api/v1/antc/content-info/{key}`

```json
{ "url": "/cac-rui-ro/canh-bao-moi/…", "usages": [ { "key": "…", "name": "…", "contentType": "alertPage" } ],
  "readMinutes": 6, "freshness": { "isFresh": true, "daysLeft": 76, "autoUnpublishInDays": 166 },
  "pdf": { "mode": "LibreOffice", "state": "done", "generatedAt": "2026-10-20T09:14:00+07:00", "version": "2.0", "error": null } }
```

`POST /umbraco/management/api/v1/antc/checklists/{key}/pdf/regenerate`: chưa làm trong đợt này (QĐ-049), giữ để bật LibreOffice sau.
- Trả `202`.
- Chỉ Quản trị viên; người khác nhận `403 FORBIDDEN`.
- Chế độ `Upload` thì trả `409 PDF_MODE_UPLOAD`.

**C4 · Kiểm tra trước khi xuất bản**

`GET /umbraco/management/api/v1/antc/publish-check/{key}`

```json
{ "ok": false, "items": [ { "field": "popularity", "label": "Mức độ phổ biến", "tab": "Nội dung", "message": "Vui lòng chọn mức độ phổ biến." } ] }
```

Dùng chung bảng luật với V2-10a, để kết quả trên ô kiểm và kết quả khi bấm Xuất bản luôn giống nhau.

## Cần người dùng xác nhận

Không còn điểm chờ. Ngày 2026-11-03 anhnn đồng ý toàn bộ khuyến nghị ở bảng dưới:
- CXN-1 → QĐ-042.
- CXN-4, CXN-6 → QĐ-043.
- CXN-3 → QĐ-044.
- CXN-8 → QĐ-045.
- CXN-2 → QĐ-046.
- CXN-5 → QĐ-047 (góp ý lưu phía máy chủ như câu hỏi Hỏi – Đáp, không đổi Hỏi – Đáp).
- CXN-9 → QĐ-048.
- CXN-7: làm file kế hoạch mới `PORTAL-V2/Ke-hoach-portal-v2.xlsx`, không sửa Excel v3.

Bảng giữ để đối chiếu.

| Mã | Câu hỏi | Nguồn và trạng thái | Phương án khuyến nghị | Task chờ |
|---|---|---|---|---|
| – | Chốt 4 điểm ở `3-thay-block-list.md` mục 7: bốn cách nhập (Bảng, Thẻ); gộp 4 loại khối Việc cần làm thành một "Bước"; bài đọc dùng menu Kiểu; danh sách cố định dùng bảng hoặc thẻ cố định số dòng | Mockup đã làm theo cả 4 điểm, anh chưa xác nhận rõ | Chốt như mockup, ghi QĐ-042 | Không chặn task nào; cần để ghi quyết định |
| – | API `/api/v1/articles`, `/api/v1/article-categories`, `/api/v1/article-content/*` và `articles.js` có ai ngoài website dùng không? | `PublishedArticlesController.cs:11-94`, `articles.js` | Không có ứng dụng ngoài thì bỏ sau V2-13i (P3, phương án A) | V2-14a, V2-14b, V2-14c |
| – | Umbraco không tự ẩn trường theo giá trị trường khác | Mockup có ẩn, hiện | Trường luôn hiện, mô tả ghi "Chỉ cần khi…", kiểm phía máy chủ; tách công cụ thành `toolCountPage`, `toolBranchPage` (P2, phương án A) | V2-08a và các task sau nó |
| – | Cách chuyển sang cấu trúc mới | P1 | Thay hẳn trên nhánh `portal-v2`, dọn ở V2-14 | V2-00b, kéo theo toàn bộ |
| – | Biểu mẫu Góp ý: có những trường nào, có thu thông tin liên hệ không, lưu bao lâu, ai xem, xét thưởng làm thế nào | Đặc tả mục 3.1 chỉ nêu tên trang; README bản dựng nêu `/feedback` | Lưu trong CSDL ứng dụng; liên hệ không bắt buộc; xóa sau 12 tháng; xem ở khu Hỏi – Đáp | V2-09c, V2-13j |
| – | Bảng ánh xạ 10 danh mục bài cũ (`articleList`) sang 5 nhóm rủi ro | uSync `Content/*` có 10 nút `articleList` | Claude lập bảng nháp, Ban biên tập duyệt | V2-12b |
| – | Có cập nhật Excel kế hoạch v3 (sheet "Công việc", "API", "URL", "CSDL") theo Portal v2 không? | Chưa đối chiếu | anhnn dán bảng task này vào sheet "Công việc" như đã làm với `CUOC-THI` | Không chặn |
| – | Contract C1, C3, C4 (QĐ-031 khoản 1: chốt trước khi code) | Mục Contract | Chốt như đề xuất | V2-01i và luồng `V2-ui` |
| – | Ba điểm còn mở từ trước: ngưỡng công cụ 2 (đang giả định 0 / 1 / từ 2); bỏ giới hạn liên kết `.gov.vn`; tự gỡ cảnh báo sau 180 ngày | `1-phan-tich…` mục 12 | Giữ giả định; bỏ `.gov.vn`; giữ 180 ngày, sửa được từng bài | V2-12a (dữ liệu mẫu), V2-04b |

## Việc không phải của dev

| Việc | Người | Cần trước task |
|---|---|---|
| Duyệt câu chữ công cụ 3 ("gỡ ứng dụng lạ, quét thiết bị", "bật xác thực hai lớp") | Ban biên tập | Xuất bản công cụ 3 |
| Xác nhận kênh, đối tượng, mức độ của 31 thủ đoạn | Ban biên tập | Xuất bản Thư viện |
| Điền phần ngoặc vuông (pháp nhân, đầu mối, nguồn, ngày rà soát) | Khách | V2-12a xuất bản |
| Nguồn và ngày kiểm chứng số 113, 156, 5656 | Ban biên tập | Xuất bản Khẩn cấp |
| Tệp PDF của 8 checklist (QĐ-049) | Ban biên tập | Xuất bản checklist |
| Hình minh họa 3 cửa vào, ảnh chia sẻ mặc định | Khách | V2-13c, V2-13l |
| Hạ tầng production | anhnn, khách | V2-00 |

## Phụ lục A · Trường của từng loại nội dung

Sinh tự động từ schema của `mockup-o-nhap-backoffice.html` bằng `cong-cu/dump_schema.js` và `cong-cu/alias_map.js` (V2-00b chép vào repo). Sửa schema hay alias thì chạy lại script, không sửa tay bảng dưới.

Cách đọc:
- "↳ cột": cột của bảng `InlineList`.
- "↳ ô trong thẻ": ô trong mỗi thẻ.
- "khi đăng": lưu nháp được, chặn xuất bản.
- "có điều kiện": bắt buộc theo điều kiện ở cột Ghi chú.
- "hiện có điều kiện": trường luôn hiện, mô tả ghi "Chỉ cần khi…" (QĐ-044); trong `InlineList` thì ẩn, hiện thật.
- Phần Hãy tự kiểm tra (`congCuPage`, `toolCountPage`, `toolBranchPage`, `checklistPage`) theo logic của bản dựng mới (QĐ-051): câu hỏi có loại Phải dừng / Tạm hoãn / Cần kiểm tra, trả lời Có / Không / Tôi chưa biết; bỏ đếm dấu hiệu, bỏ dải kết quả.
- `illustration`, `illustrationAlt` thuộc composition `illustrationBase` (QĐ-052), gắn vào 15 loại trang; liệt kê lại ở từng loại cho dễ tra.
- Cây nội dung chia "Quản lý trang" và "Quản lý nội dung" (QĐ-053); thư mục có Collection không hiện mục con trên cây.

#### `siteSettings` · Cài đặt website

Không có trang · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Hay sửa | Bốn nguyên tắc dừng | `stopPrinciples` | Bốn nguyên tắc dừng | InlineList · Bảng | ✔ | Hiện ở Trang chủ và Khẩn cấp |
| | ↳ cột | `stopPrinciples[].icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| | ↳ cột | `stopPrinciples[].title` | Tiêu đề | Chữ · 40 | ✔ |  |
| | ↳ cột | `stopPrinciples[].description` | Giải thích | Đoạn · 120 | ✔ |  |
| Hay sửa | Rà soát nội dung khẩn cấp | `reviewDate` | Ngày rà soát gần nhất | Ngày | khi đăng | Quá 90 ngày trang tự hiện cảnh báo |
| Hay sửa | Rà soát nội dung khẩn cấp | `nextReviewDate` | Ngày rà soát lại dự kiến | Ngày |  |  |
| Chân trang | Chân trang | `disclaimer` | Câu miễn trừ cố định | Đoạn · 300 | ✔ | Đặc tả 4.6, giữ nguyên văn |
| Chân trang | Chân trang | `mainLinks` | Bốn liên kết chính | InlineList · Bảng | ✔ |  |
| | ↳ cột | `mainLinks[].label` | Chữ trên nút | Chữ · 40 | ✔ |  |
| | ↳ cột | `mainLinks[].targetPage` | Trang | Chọn · Trang trong website (một) | ✔ |  |
| Chân trang | Chân trang | `commitments` | Cam kết | Danh sách dòng (0–4) | ✔ | “Website không…” |
| Chân trang | Chân trang | `extraLinks` | Liên kết phụ | InlineList · Bảng |  |  |
| | ↳ cột | `extraLinks[].label` | Chữ trên nút | Chữ · 40 | ✔ |  |
| | ↳ cột | `extraLinks[].targetPage` | Trang | Chọn · Trang trong website (một) | ✔ |  |
| Chân trang | Chân trang | `operatorNote` | Câu đơn vị vận hành | Đoạn · 300 | ✔ |  |
| Nhận diện (chỉ Quản trị) | Nhận diện | `siteName` | Tên website | Chữ · 40 | ✔ |  |
| Nhận diện (chỉ Quản trị) | Nhận diện | `tagline` | Câu mô tả dưới logo | Chữ · 80 | ✔ |  |
| Nhận diện (chỉ Quản trị) | Nhận diện | `headerLogo` | Logo đầu trang | Chọn ảnh | ✔ |  |
| Nhận diện (chỉ Quản trị) | Nhận diện | `headerLogoAlt` | Văn bản thay thế logo đầu trang | Chữ · 80 | ✔ |  |
| Nhận diện (chỉ Quản trị) | Nhận diện | `footerLogo` | Logo chân trang | Chọn ảnh | ✔ |  |
| Nhận diện (chỉ Quản trị) | Nhận diện | `footerLogoAlt` | Văn bản thay thế logo chân trang | Chữ · 80 | ✔ |  |
| Nhận diện (chỉ Quản trị) | Nhận diện | `topBarMode` | Dải trên cùng | Danh mục · Dải trên cùng | ✔ | README mục 23 |
| Nhận diện (chỉ Quản trị) | Nhận diện | `disableIndexing` | Không cho công cụ tìm kiếm lập chỉ mục | Bật/tắt |  |  |
| Hoạt động (chỉ Quản trị) | Cuộc thi | `showContestEntry` | Bật lối vào Cuộc thi | Bật/tắt |  | Tắt thì lối vào ẩn, trang vẫn mở được |
| Hoạt động (chỉ Quản trị) | Cuộc thi | `contestShortName` | Tên ngắn | Chữ · 30 |  |  |
| Hoạt động (chỉ Quản trị) | Cuộc thi | `contestFullName` | Tên đầy đủ | Chữ · 120 |  |  |
| Tài trợ (chỉ Quản trị) | Khu tài trợ | `showSponsor` | Hiện khu tài trợ | Bật/tắt |  |  |
| Tài trợ (chỉ Quản trị) | Khu tài trợ | `sponsorName` | Tên đơn vị tài trợ | Textstring | ✔ | hiện có điều kiện |
| Tài trợ (chỉ Quản trị) | Khu tài trợ | `sponsorLogo` | Logo | Chọn ảnh | ✔ | hiện có điều kiện |
| Tài trợ (chỉ Quản trị) | Khu tài trợ | `sponsorLink` | Liên kết | Chữ · Liên kết https |  | hiện có điều kiện |
| Tài trợ (chỉ Quản trị) | Khu tài trợ | `sponsorNote` | Câu “không phải khuyến nghị” | Textstring | ✔ | hiện có điều kiện |
| Câu cố định (chỉ Quản trị) | Câu dưới kết quả tự kiểm tra | `resultNote` | Câu dưới mọi kết quả | Đoạn · 300 | ✔ | Đặc tả 5.6 |
| Câu cố định (chỉ Quản trị) | Câu dưới kết quả tự kiểm tra | `notConclusionNote` | Câu “không phải kết luận” | Đoạn · 300 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Mức độ và khuyến nghị | `stopLabel` | Nhãn khuyến nghị mức Rất cao | Chữ · 40 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Mức độ và khuyến nghị | `stopText` | Câu giải thích mức Rất cao | Đoạn · 300 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Mức độ và khuyến nghị | `holdLabel` | Nhãn khuyến nghị mức Cao | Chữ · 40 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Mức độ và khuyến nghị | `holdText` | Câu giải thích mức Cao | Đoạn · 300 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Mức độ và khuyến nghị | `clearLabel` | Nhãn khuyến nghị mức Cần thận trọng | Chữ · 40 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Mức độ và khuyến nghị | `clearText` | Câu giải thích mức Cần thận trọng | Đoạn · 300 | ✔ | Cũng dùng khi trình hỏi không khớp tình huống nào |
| Câu cố định (chỉ Quản trị) | Câu bắt buộc khác | `noReportNote` | Câu không nhận tố giác | Đoạn · 300 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Câu bắt buộc khác | `noAdviceNote` | Câu miễn trừ tư vấn | Đoạn · 300 | ✔ |  |
| Câu cố định (chỉ Quản trị) | Câu bắt buộc khác | `mustRemember` | Hai điều phải nhớ | Danh sách dòng (0–2) | ✔ | Hiện ở kiểm tra nhanh có bật hộp lưu ý |
| Câu cố định (chỉ Quản trị) | Câu bắt buộc khác | `bankLookupSteps` | Cách tự tìm số ngân hàng | Danh sách dòng (0–5) | ✔ |  |
| Câu cố định (chỉ Quản trị) | Câu bắt buộc khác | `refuseLendingNote` | Câu từ chối cho mượn tài khoản | Đoạn · 300 | ✔ |  |

#### `homePage` · Trang chủ

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Khối Khẩn cấp | `eyebrow` | Nhãn nhỏ | Chữ · 30 |  |  |
| Nội dung | Khối Khẩn cấp | `title` | Tiêu đề | Chữ · 90 | ✔ | Tối đa 90 ký tự để thấy trọn trên màn 360 × 640 |
| Nội dung | Khối Khẩn cấp | `description` | Mô tả | Đoạn · 160 | ✔ |  |
| Nội dung | Khối Khẩn cấp | `primaryButtonText` | Chữ nút chính | Chữ · 32 | ✔ | Mở trình hỏi |
| Nội dung | Khối Khẩn cấp | `secondaryButtonText` | Chữ nút phụ | Chữ · 32 | ✔ | Mở mục Việc cần làm ngay |
| Nội dung | Khối Khẩn cấp | `principlesLead` | Câu dẫn bốn nguyên tắc | Chữ · 80 |  | Bốn nguyên tắc lấy từ Cài đặt website |
| Nội dung | Khối Hãy tự kiểm tra | `toolsTitle` | Tiêu đề khối | Chữ · 60 | ✔ |  |
| Nội dung | Khối Hãy tự kiểm tra | `tools` | Ba thẻ kiểm tra nhanh | Chọn · Kiểm tra nhanh (nhiều, ≤ 3, sắp được) | ✔ | Kéo thẻ để sắp thứ tự |
| Nội dung | Khối Các rủi ro | `riskTitle` | Tiêu đề khối | Chữ · 60 | ✔ |  |
| Nội dung | Khối Các rủi ro | — (không lưu) | Thẻ nhóm | Không lưu (hiển thị) |  |  |
| Nội dung | Khối Cảnh báo mới | `alertTitle` | Tiêu đề khối | Chữ · 60 | ✔ |  |
| Nội dung | Khối Cảnh báo mới | `alertMoreText` | Chữ nút “Xem tất cả” | Chữ · 40 | ✔ |  |
| Nội dung | Khối Cảnh báo mới | `alertCount` | Số cảnh báo hiện | Số 1–3 | ✔ | Chỉ lấy cảnh báo cập nhật trong 90 ngày; không có thì khối ẩn |
| Nội dung | Khối Cảnh báo mới | `pinnedAlert` | Cảnh báo ghim | Chọn · Cảnh báo (một) |  | Hết 90 ngày thì tự bỏ ghim |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `khanCapPage` · Khẩn cấp

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Việc cần làm | — (không lưu) | Việc cần làm | Không lưu (hiển thị) |  |  |
| Nội dung | Đầu trang | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Đầu trang | `lead` | Mô tả | Đoạn · 220 | ✔ |  |
| Nội dung | Lối vào trình hỏi | `wizardTitle` | Tiêu đề | Chữ · 60 | ✔ |  |
| Nội dung | Lối vào trình hỏi | `wizardDescription` | Mô tả | Đoạn · 220 | ✔ |  |
| Nội dung | Lối vào trình hỏi | `wizardButtonText` | Chữ nút | Chữ · 32 | ✔ |  |
| Nội dung | Việc cần làm ngay | `doorLead` | Câu dẫn | Đoạn · 220 | ✔ |  |
| Nội dung | Việc cần làm ngay | `doors` | Ba cửa vào | InlineList · Thẻ | ✔ |  |
|  | ↳ ô trong thẻ | `doors[].title` | Tiêu đề | Chữ · 70 | ✔ |  |
|  | ↳ ô trong thẻ | `doors[].description` | Mô tả | Đoạn · 120 | ✔ |  |
|  | ↳ ô trong thẻ | `doors[].illustration` | Hình minh họa | Danh mục · Hình minh họa cửa vào |  |  |
|  | ↳ ô trong thẻ | `doors[].openMode` | Khi bấm | Danh mục · Kiểu cửa vào | ✔ |  |
|  | ↳ ô trong thẻ | `doors[].targetPage` | Trang đích | Chọn · Việc cần làm (một) | ✔ | hiện có điều kiện |
|  | ↳ ô trong thẻ | `doors[].options` | Lựa chọn | InlineList · Bảng | ✔ | hiện có điều kiện |
| | ↳ cột | `doors[].options[].icon` | Biểu tượng | Danh mục · Biểu tượng |  |  |
| | ↳ cột | `doors[].options[].text` | Câu | Đoạn · 160 | ✔ |  |
| | ↳ cột | `doors[].options[].target` | Mở | Chọn · Việc cần làm hoặc trình hỏi (một) | ✔ |  |
| Nội dung | Việc cần làm ngay | `noMatchPage` | Nút “Không ô nào giống” mở | Chọn · Việc cần làm (một) | ✔ |  |
| Nội dung | Việc cần làm ngay | `helperNote` | Câu cho người đang giúp người thân | Chữ · 160 |  |  |
| Nội dung | Tình huống điển hình | `typicalSituations` | Trang hiện trong danh sách | Chọn · Việc cần làm (nhiều, ≤ 10, sắp được) | ✔ | Kéo thẻ để sắp thứ tự hiện |
| Nội dung | Khi cần hỗ trợ | `stateHotlines` | Số do Nhà nước vận hành | InlineList · Bảng | ✔ | Hiện theo đúng thứ tự trong bảng |
| | ↳ cột | `stateHotlines[].number` | Số | Textstring | ✔ |  chỉ chữ số 3–6 |
| | ↳ cột | `stateHotlines[].contactMode` | Hình thức | Danh mục · Hình thức liên hệ | ✔ |  |
| | ↳ cột | `stateHotlines[].description` | Mô tả | Đoạn · 200 | ✔ |  |
| | ↳ cột | `stateHotlines[].smsSyntax` | Cú pháp tin nhắn | Chữ · 120 |  | ở dòng mở rộng |
| Nội dung | Khi cần hỗ trợ | `hotlinesCheckedDate` | Ngày kiểm chứng số | Ngày | khi đăng |  |
| Nội dung | Khi cần hỗ trợ | `hotlinesSource` | Nguồn kiểm chứng | Textstring | khi đăng |  |
| Nội dung | Khi cần hỗ trợ | `bankHotlines` | Đường dây nóng của tổ chức tín dụng | InlineList · Bảng |  | README mục 11: để trống tới khi có nguồn Nhà nước |
| | ↳ cột | `bankHotlines[].number` | Số | Textstring | ✔ |  chỉ chữ số 3–6 |
| | ↳ cột | `bankHotlines[].contactMode` | Hình thức | Danh mục · Hình thức liên hệ | ✔ |  |
| | ↳ cột | `bankHotlines[].description` | Mô tả | Đoạn · 200 | ✔ |  |
| Nội dung | Cuối trang | `footerButtons` | Hai nút cuối trang | InlineList · Bảng |  |  |
| | ↳ cột | `footerButtons[].label` | Chữ trên nút | Chữ · 40 | ✔ |  |
| | ↳ cột | `footerButtons[].targetPage` | Trang | Chọn · Trang trong website (một) | ✔ |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `wizardPage` · Kiểm tra tình huống

Có template và đường dẫn · Không xóa (trang cố định) · Chỉ Quản trị viên mở

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Câu hỏi | Bước 1 | `step1Question` | Câu hỏi | Chữ · 120 | ✔ |  |
| Câu hỏi | Bước 1 | `step1Hint` | Câu gợi ý dưới câu hỏi | Chữ · 160 |  |  |
| Câu hỏi | Bước 1 | `step1Options` | Lựa chọn | InlineList · Bảng | ✔ | Chọn một. Sửa nhãn không làm hỏng ma trận, vì ma trận trỏ tới mã của từng dòng |
| | ↳ cột | `step1Options[].icon` | Biểu tượng | Danh mục · Biểu tượng |  |  |
| | ↳ cột | `step1Options[].label` | Nhãn | Chữ · 60 | ✔ |  |
| Câu hỏi | Bước 2 | `step2Question` | Câu hỏi | Chữ · 120 | ✔ |  |
| Câu hỏi | Bước 2 | `step2Hint` | Câu gợi ý dưới câu hỏi | Chữ · 160 |  |  |
| Câu hỏi | Bước 2 | `step2Options` | Lựa chọn | InlineList · Bảng | ✔ | Chọn nhiều. Sửa nhãn không làm hỏng ma trận, vì ma trận trỏ tới mã của từng dòng |
| | ↳ cột | `step2Options[].icon` | Biểu tượng | Danh mục · Biểu tượng |  |  |
| | ↳ cột | `step2Options[].label` | Nhãn | Chữ · 60 | ✔ |  |
| Câu hỏi | Bước 3 | `step3Question` | Câu hỏi | Chữ · 120 | ✔ |  |
| Câu hỏi | Bước 3 | `step3Hint` | Câu gợi ý dưới câu hỏi | Chữ · 160 |  |  |
| Câu hỏi | Bước 3 | `step3Options` | Lựa chọn | InlineList · Bảng | ✔ | Chọn nhiều. Sửa nhãn không làm hỏng ma trận, vì ma trận trỏ tới mã của từng dòng |
| | ↳ cột | `step3Options[].icon` | Biểu tượng | Danh mục · Biểu tượng |  |  |
| | ↳ cột | `step3Options[].label` | Nhãn | Chữ · 60 | ✔ |  |
| Câu hỏi | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Câu hỏi | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| Ma trận |  | `situationMatrix` | Ma trận tình huống | Antc.WizardMatrix | ✔ |  |
|  | ↳ mỗi hàng ma trận (JSON) | `situationMatrix.rows[].name` | Tên tình huống | Chữ · 80 | ✔ |  |
|  | ↳ mỗi hàng ma trận (JSON) | `situationMatrix.rows[].cautionLevel` | Mức độ | Danh mục · Mức độ cần thận trọng | ✔ |  |
|  | ↳ mỗi hàng ma trận (JSON) | `situationMatrix.rows[].signs` | Dấu hiệu phù hợp | Danh sách dòng (1–3) | ✔ |  |
|  | ↳ mỗi hàng ma trận (JSON) | `situationMatrix.rows[].actions` | Việc cần làm ngay | Danh sách dòng (1–4) | ✔ |  |
|  | ↳ mỗi hàng ma trận (JSON) | `situationMatrix.rows[].guideArticle` | Bài hướng dẫn chi tiết | Chọn · Bài hoặc cảnh báo (một) | ✔ |  |
|  | ↳ mỗi hàng ma trận (JSON) | `situationMatrix.rows[].checklist` | Danh sách kiểm tra | Chọn · Danh sách kiểm tra (một) |  | Trống thì dùng danh sách mặc định ở tab Kết quả |
|  | ↳ mỗi hàng ma trận (JSON) | `situationMatrix.rows[].enabled` | Đang dùng | Bật/tắt |  |  |
| Kết quả | Tiêu đề 4 khối kết quả | `resultHeading1` | Khối 1 | Chữ · 40 | ✔ |  |
| Kết quả | Tiêu đề 4 khối kết quả | `resultHeading2` | Khối 2 | Chữ · 40 | ✔ |  |
| Kết quả | Tiêu đề 4 khối kết quả | `resultHeading3` | Khối 3 | Chữ · 40 | ✔ |  |
| Kết quả | Tiêu đề 4 khối kết quả | `resultHeading4` | Khối 4 | Chữ · 40 | ✔ |  |
| Kết quả | Cách hiện | `maxSituations` | Số tình huống hiện tối đa | Số 1–3 | ✔ |  |
| Kết quả | Cách hiện | `noMatchText` | Câu khi không khớp | Đoạn · 200 | ✔ | Hiện cùng trạng thái “Cần thận trọng” và 4 nguyên tắc dừng |
| Kết quả | Cách hiện | `defaultChecklist` | Danh sách kiểm tra mặc định | Chọn · Danh sách kiểm tra (một) | ✔ |  |
| Kết quả | Chữ trên 4 nút | `button1Text` | Nút 1 | Chữ · 40 | ✔ |  |
| Kết quả | Chữ trên 4 nút | `button2Text` | Nút 2 | Chữ · 40 | ✔ |  |
| Kết quả | Chữ trên 4 nút | `button3Text` | Nút 3 | Chữ · 40 | ✔ |  |
| Kết quả | Chữ trên 4 nút | `button4Text` | Nút 4 | Chữ · 40 | ✔ |  |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `viecCanLamPage` · Việc cần làm

Có template và đường dẫn · Tạo: chỉ Quản trị viên · Xóa: chỉ Quản trị viên

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Nội dung | `umbracoUrlName` | Đường dẫn | Chữ · 60 | ✔ | Đổi thì tự tạo chuyển hướng 301 từ đường dẫn cũ |
| Nội dung | Nội dung | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Nội dung | `lead` | Câu dẫn | Đoạn · 220 | ✔ |  |
| Nội dung | Nội dung | `hideFromSituations` | Ẩn khỏi danh sách tình huống | Bật/tắt |  |  |
| Nội dung | Câu hỏi sàng lọc | `screeningQuestions` | Câu hỏi sàng lọc | InlineList · Bảng |  | hiện có điều kiện |
| | ↳ cột | `screeningQuestions[].question` | Câu hỏi | Đoạn · 240 | ✔ |  |
| | ↳ cột | `screeningQuestions[].buttonText` | Chữ nút | Chữ · 60 | ✔ |  |
| | ↳ cột | `screeningQuestions[].targetPage` | Mở trang | Chọn · Việc cần làm (một) | ✔ |  |
| | ↳ cột | `screeningQuestions[].note` | Ghi chú dưới câu | Chữ · 200 |  | ở dòng mở rộng |
| Nội dung | Các bước | `steps` | Các bước | InlineList · Thẻ | có điều kiện |  |
|  | ↳ ô trong thẻ | `steps[].mainText` | Câu chính | Đoạn · 240 | ✔ | Hiện đậm, có ô đánh dấu đã làm |
|  | ↳ ô trong thẻ | `steps[].details` | Diễn giải | Danh sách dòng (0–6) |  | Dán nhiều dòng thì tự tách |
|  | ↳ ô trong thẻ | `steps[].sampleScript` | Câu nói mẫu | Đoạn · 240 |  | Khi gọi ngân hàng, tổng đài |
|  | ↳ ô trong thẻ | `steps[].showBankLookup` | Hộp tìm số ngân hàng | Bật/tắt |  |  |
|  | ↳ ô trong thẻ | `steps[].onlyIf` | Chỉ làm khi | Chọn · Đoạn dùng chung (một) |  | Chọn đoạn dùng chung |
|  | ↳ ô trong thẻ | `steps[].snippetAfter` | Chèn đoạn dùng chung sau bước | Chọn · Đoạn dùng chung (một) |  |  |
|  | ↳ phần "Hỏi thêm" (bật bằng `hasFollowUp`) | `steps[].followUpQuestion` | Câu hỏi | Đoạn · 240 | ✔ |  |
|  | ↳ phần "Hỏi thêm" (bật bằng `hasFollowUp`) | `steps[].followUpButton` | Chữ trên nút | Chữ · 60 | ✔ |  |
|  | ↳ phần "Hỏi thêm" (bật bằng `hasFollowUp`) | `steps[].followUpNote` | Ghi chú | Chữ · 200 |  |  |
|  | ↳ phần "Hỏi thêm" (bật bằng `hasFollowUp`) | `steps[].followUpPage` | Trang đích | Chọn · Việc cần làm (một) | ✔ |  |
| Nội dung | Rà soát | `reviewDate` | Ngày rà soát | Ngày | khi đăng | Quá 90 ngày tự hiện cảnh báo |
| Nội dung | Rà soát | `verificationSource` | Nguồn kiểm chứng | Chữ · 200 | khi đăng |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `congCuPage` · Hãy tự kiểm tra

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Đầu trang | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Đầu trang | `lead` | Mô tả | Đoạn · 240 | ✔ |  |
| Nội dung | Kiểm tra nhanh | `toolsTitle` | Tiêu đề phần | Chữ · 60 | ✔ |  |
| Nội dung | Kiểm tra nhanh | `tools` | Ba kiểm tra nhanh theo thứ tự | Chọn · Kiểm tra nhanh (nhiều, ≤ 3, sắp được) | ✔ |  |
| Nội dung | Danh sách kiểm tra | `checklistTitle` | Tiêu đề phần | Chữ · 60 | ✔ |  |
| Nội dung | Danh sách kiểm tra | `checklistLead` | Câu dẫn | Đoạn · 300 | ✔ |  |
| Nội dung | Danh sách kiểm tra | — (không lưu) | Thứ tự | Không lưu (hiển thị) |  |  |
| Nội dung | Kiểm tra kiến thức | `knowledgeTitle` | Tiêu đề phần | Chữ · 60 | ✔ |  |
| Nội dung | Kiểm tra kiến thức | `knowledgeLinks` | Các lối vào | InlineList · Bảng |  |  |
| | ↳ cột | `knowledgeLinks[].icon` | Biểu tượng | Danh mục · Biểu tượng |  |  |
| | ↳ cột | `knowledgeLinks[].label` | Tên | Chữ · 40 | ✔ |  |
| | ↳ cột | `knowledgeLinks[].description` | Mô tả | Đoạn · 140 |  |  |
| | ↳ cột | `knowledgeLinks[].targetPage` | Trang | Chọn · Trang trong website (một) | ✔ |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `toolCountPage` · Kiểm tra nhanh

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Đầu trang | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Đầu trang | `umbracoUrlName` | Đường dẫn | Chữ · 60 | ✔ |  |
| Nội dung | Đầu trang | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Đầu trang | `cardText` | Mô tả ngắn trên thẻ | Đoạn · 160 | ✔ |  |
| Nội dung | Đầu trang | `lead` | Câu dẫn | Đoạn · 240 | ✔ |  |
| Nội dung | Đầu trang | `showAdviceBox` | Hộp lưu ý trước câu hỏi | Bật/tắt |  | Câu chữ sửa ở Cài đặt website › Câu cố định |
| Nội dung | Câu hỏi | — (không lưu) | Cách tính | Không lưu (hiển thị) |  |  |
| Nội dung | Câu hỏi | `questions` | Câu hỏi | InlineList · Thẻ | ✔ |  |
|  | ↳ ô trong thẻ | `questions[].questionKind` | Loại câu | Danh mục · Loại câu kiểm tra | ✔ |  |
|  | ↳ ô trong thẻ | `questions[].question` | Câu hỏi | Đoạn · 300 | ✔ | Viết **chữ** để in đậm |
|  | ↳ ô trong thẻ | `questions[].hint` | Giải thích phụ | Đoạn · 400 |  | Viết **chữ** để in đậm |
|  | ↳ ô trong thẻ | `questions[].answerOptions` | Lựa chọn riêng | InlineList · Bảng |  | Để trống thì dùng Có / Không / Tôi chưa biết |
| | ↳ cột | `questions[].answerOptions[].label` | Chữ trên nút | Chữ · 120 | ✔ |  |
| | ↳ cột | `questions[].answerOptions[].meaning` | Được hiểu là | Danh mục · Nghĩa câu trả lời | ✔ |  |
| Nội dung | Kết quả | `stopResult` | Nhãn kết quả mức Rất cao | Chữ · 60 | ✔ |  |
| Nội dung | Kết quả | `holdResult` | Nhãn kết quả mức Cao | Chữ · 60 | ✔ |  |
| Nội dung | Kết quả | `clearResult` | Nhãn kết quả mức Cần thận trọng | Chữ · 60 | ✔ |  |
| Nội dung | Kết quả | `clearNote` | Câu thêm khi chưa phát hiện điểm dừng | Đoạn · 240 |  |  |
| Nội dung | Kết quả | `stopActions` | Việc nên làm: mức Rất cao | InlineList · Bảng | ✔ | Lấy nguyên văn bước của trang Việc cần làm |
| | ↳ cột | `stopActions[].page` | Trang việc cần làm | Chọn · Việc cần làm (một) | ✔ |  |
| | ↳ cột | `stopActions[].stepNumber` | Bước số | Số | ✔ |  |
| Nội dung | Kết quả | `holdActions` | Việc nên làm: mức Cao | InlineList · Bảng | ✔ |  |
| | ↳ cột | `holdActions[].page` | Trang việc cần làm | Chọn · Việc cần làm (một) | ✔ |  |
| | ↳ cột | `holdActions[].stepNumber` | Bước số | Số | ✔ |  |
| Nội dung | Kết quả | `clearActions` | Việc nên làm: mức Cần thận trọng | InlineList · Bảng | ✔ |  |
| | ↳ cột | `clearActions[].page` | Trang việc cần làm | Chọn · Việc cần làm (một) | ✔ |  |
| | ↳ cột | `clearActions[].stepNumber` | Bước số | Số | ✔ |  |
| Nội dung | Kết quả | `readMore` | Đọc thêm | InlineList · Bảng |  |  |
| | ↳ cột | `readMore[].icon` | Biểu tượng | Danh mục · Biểu tượng |  |  |
| | ↳ cột | `readMore[].label` | Chữ trên liên kết | Chữ · 80 | ✔ |  |
| | ↳ cột | `readMore[].targetPage` | Trang | Chọn · Trang trong website (một) | ✔ |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `toolBranchPage` · Kiểm tra nhanh theo nhánh

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Đầu trang | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Đầu trang | `umbracoUrlName` | Đường dẫn | Chữ · 60 | ✔ |  |
| Nội dung | Đầu trang | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Đầu trang | `cardText` | Mô tả ngắn trên thẻ | Đoạn · 160 | ✔ |  |
| Nội dung | Đầu trang | `lead` | Câu dẫn | Đoạn · 240 | ✔ |  |
| Nội dung | Đầu trang | `urgentTitle` | Tiêu đề hộp nguy hiểm tức thời | Chữ · 80 |  |  |
| Nội dung | Đầu trang | `urgentText` | Câu trong hộp nguy hiểm tức thời | Đoạn · 300 | có điều kiện | Hộp đỏ trên câu hỏi đầu. Để trống thì không hiện |
| Nội dung | Câu hỏi | `questions` | Câu hỏi | InlineList · Thẻ | ✔ |  |
|  | ↳ ô trong thẻ | `questions[].question` | Câu hỏi | Đoạn · 300 | ✔ |  |
|  | ↳ ô trong thẻ | `questions[].situationLabel` | Nhãn tình huống | Chữ · 120 | ✔ | Tiêu đề nhóm việc khi trả lời Có |
|  | ↳ ô trong thẻ | `questions[].yesLabel` | Chữ nút Có | Chữ · 20 |  |  |
|  | ↳ ô trong thẻ | `questions[].noLabel` | Chữ nút Không | Chữ · 20 |  |  |
|  | ↳ ô trong thẻ | `questions[].actionPage` | Trang việc cần làm | Chọn · Việc cần làm (một) | ✔ |  |
|  | ↳ ô trong thẻ | `questions[].takeSteps` | Các bước lấy từ trang | Chữ · 40 | ✔ | Số thứ tự bước, cách nhau dấu phẩy, ví dụ 1,2,4. Lấy nguyên văn |
| Nội dung | Kết quả | `allNoTitle` | Tiêu đề khi trả lời Không hết | Chữ · 80 | ✔ |  |
| Nội dung | Kết quả | `allNoText` | Câu khi trả lời Không hết | Đoạn · 300 | ✔ |  |
| Nội dung | Kết quả | `allNoActions` | Việc nên làm khi trả lời Không hết | InlineList · Bảng | ✔ |  |
| | ↳ cột | `allNoActions[].page` | Trang việc cần làm | Chọn · Việc cần làm (một) | ✔ |  |
| | ↳ cột | `allNoActions[].stepNumber` | Bước số | Số | ✔ |  |
| Nội dung | Kết quả | `hitTitle` | Tiêu đề khi có việc cần xử lý | Chữ · 120 | ✔ | Dùng {n} cho số việc |
| Nội dung | Kết quả | `hitText` | Câu dẫn khi có việc cần xử lý | Đoạn · 300 | ✔ |  |
| Nội dung | Kết quả | `readMore` | Đọc thêm | InlineList · Bảng |  |  |
| | ↳ cột | `readMore[].icon` | Biểu tượng | Danh mục · Biểu tượng |  |  |
| | ↳ cột | `readMore[].label` | Chữ trên liên kết | Chữ · 80 | ✔ |  |
| | ↳ cột | `readMore[].targetPage` | Trang | Chọn · Trang trong website (một) | ✔ |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `checklistPage` · Danh sách kiểm tra

Có template và đường dẫn · Tạo: Biên tập viên · Xóa: Biên tập viên

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Đầu trang | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Đầu trang | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Đầu trang | `lead` | Câu dẫn | Đoạn · 240 | ✔ |  |
| Nội dung | Đầu trang | `sourceArticle` | Bài đọc nguồn | Chọn · Bài viết (một) | khi đăng | Câu chữ lấy nguyên văn từ bài đọc; rà lại khi bài đọc đổi phiên bản |
| Nội dung | Phần 1 · Có việc nào dưới đây không? | `stopIntro` | Câu dẫn | Đoạn · 500 | ✔ |  |
| Nội dung | Phần 1 · Có việc nào dưới đây không? | `stopQuestions` | Các câu | Danh sách dòng (1–8) | ✔ | Mỗi câu trả lời Có / Không / Tôi chưa biết. Có một câu “Có” là mức Rất cao |
| Nội dung | Phần 1 · Có việc nào dưới đây không? | `stopNote` | Câu cuối phần | Đoạn · 300 |  |  |
| Nội dung | Phần 2 · Bảng kiểm bỏ túi | `pocketIntro` | Câu dẫn | Đoạn · 300 |  |  |
| Nội dung | Phần 2 · Bảng kiểm bỏ túi | `pocketItems` | Các ô tích | Danh sách dòng (0–15) | ✔ | Còn ô chưa tích, hoặc câu phần 1 chưa biết, thì mức Cao |
| Nội dung | Kết quả | `stopNow` | Làm ngay khi mức Rất cao | Đoạn · 400 | khi đăng | Lấy từ dòng DỪNG, cột “Làm ngay” trong bảng Cách xử lý của bài đọc |
| Nội dung | Kết quả | `holdNow` | Làm ngay khi mức Cao | Đoạn · 400 | khi đăng | Lấy từ dòng HOÃN |
| Nội dung | Tệp PDF | `pdfFile` | Tệp PDF | Chọn tệp PDF |  | Tải tệp PDF của danh sách. Chưa có tệp thì nút “Tải danh sách kiểm tra (PDF)” mở bản in A4 |
| Nội dung | Tệp PDF | — (không lưu) | Nút tải trên website | Không lưu (hiển thị) |  |  |
| Nội dung | Rà soát | `version` | Phiên bản | Chữ · 20 | khi đăng |  |
| Nội dung | Rà soát | `reviewDate` | Ngày rà soát | Ngày | khi đăng |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `ruiRoPage` · Các rủi ro

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Nội dung | `lead` | Mô tả | Đoạn · 220 |  |  |
| Nội dung | Nội dung | — (không lưu) | Chuyển hướng | Không lưu (hiển thị) |  |  |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `alertListPage` · Cảnh báo mới

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | — (không lưu) | Cảnh báo | Không lưu (hiển thị) |  |  |
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Nội dung | `lead` | Câu dẫn | Đoạn · 220 | ✔ |  |
| Nội dung | Nội dung | `showSampleNote` | Dòng “Mẫu trình bày” | Bật/tắt |  |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `alertPage` · Cảnh báo

Có template và đường dẫn · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 110 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 110 | ✔ |  |
| Nội dung | Nội dung | `description` | Mô tả 1 dòng | Đoạn · 160 | ✔ | Dùng cho thẻ và mô tả chia sẻ |
| Nội dung | Nội dung | `cautionLevel` | Mức độ cần thận trọng | Danh mục · Mức độ cần thận trọng | ✔ |  |
| Nội dung | Nội dung | `popularity` | Mức độ phổ biến | Chọn · Mức độ phổ biến (một) | ✔ | Danh mục do Ban biên tập quản lý (QĐ-038) |
| Nội dung | Nội dung | `popularityBasis` | Căn cứ mức độ phổ biến | Chữ · 160 |  | Số liệu của cơ quan nào, ngày nào |
| Nội dung | Nội dung | `scenarioSteps` | Kịch bản thường gặp | Danh sách dòng (3–5) | khi đăng | 3–5 bước (đặc tả 7.4) |
| Nội dung | Nội dung | `stopSigns` | Dấu hiệu nhận biết | Chọn · Dấu hiệu phải dừng (nhiều) |  |  |
| Nội dung | Nội dung | `otherSigns` | Dấu hiệu khác | Danh sách dòng (0–4) |  | Khi không có trong danh mục |
| Nội dung | Nội dung | `actionPage` | Việc cần làm: trang | Chọn · Việc cần làm (một) | khi đăng |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| Nguồn | Nguồn | `issuingAgency` | Cơ quan ban hành | Chữ · 120 |  |  |
| Nguồn | Nguồn | `documentNumber` | Số văn bản | Chữ · 40 |  |  |
| Nguồn | Nguồn | `documentDate` | Ngày văn bản | Ngày |  |  |
| Nguồn | Nguồn | `documentUrl` | Liên kết văn bản gốc | Chữ · Liên kết https |  |  |
| Phân loại | Phân loại | `channels` | Kênh | Chọn · Kênh (nhiều) | khi đăng |  |
| Phân loại | Phân loại | `audiences` | Đối tượng dễ bị nhắm tới | Chọn · Đối tượng (nhiều) | khi đăng |  |
| Phân loại | Phân loại | `tactics` | Thủ đoạn liên quan | Chọn · Thủ đoạn (nhiều, ≤ 8, sắp được) |  | Kéo thẻ để sắp thứ tự |
| Phân loại | Phân loại | `alsoInCategories` | Hiện thêm ở nhóm | Chọn · Nhóm rủi ro (nhiều) |  | Ngoài nhóm chính Cảnh báo mới |
| Phân loại | Phân loại | `relatedItems` | Bài liên quan | Chọn · Bài liên quan (nhiều, ≤ 4) |  | Để trống thì lấy tự động cùng nhóm |
| Phân loại | Phân loại | `searchKeywords` | Từ khóa tìm kiếm | Thẻ · Từ khóa |  | Gõ rồi Enter để thêm thẻ mới |
| Lịch | Lịch | `updatedDate` | Ngày cập nhật | Ngày | ✔ | Dùng để tính 90 ngày “mới” |
| Lịch | Lịch | `autoUnpublishDays` | Tự gỡ sau (ngày) | Số 30–720 | ✔ | Mặc định 180 (README mục 8) |
| Lịch | Lịch | — (không lưu) | Tình trạng | Không lưu (hiển thị) |  |  |
| Lịch | Hẹn giờ | — (không lưu) | Hẹn giờ đăng, gỡ | Không lưu (hiển thị) |  |  |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `riskCategoryPage` · Nhóm rủi ro

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | — (không lưu) | Bài viết | Không lưu (hiển thị) |  |  |
| Nội dung | Nội dung | `tabName` | Tên tab | Chữ · 28 | ✔ |  |
| Nội dung | Nội dung | `cardDescription` | Mô tả ngắn trên thẻ trang chủ | Chữ · 60 | ✔ |  |
| Nội dung | Nội dung | `lead` | Câu dẫn đầu trang | Đoạn · 220 | ✔ |  |
| Nội dung | Nội dung | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Nội dung | `thumbnail` | Ảnh thu nhỏ | Chọn ảnh |  | Ảnh trên thẻ nhóm ở trang chủ và Các rủi ro (QĐ-052) |
| Nội dung | Nội dung | `tactics` | Thủ đoạn hiện trong nhóm | Chọn · Thủ đoạn (nhiều, sắp được) |  |  |
| Nội dung | Nội dung | `pinnedArticles` | Bài ghim đầu danh sách | Chọn · Bài viết (nhiều, ≤ 2) |  |  |
| Nội dung | Nội dung | `noAnswerNote` | Câu “Không thấy câu trả lời?” | Đoạn · 200 |  |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `riskArticlePage` · Bài viết

Có template và đường dẫn · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 110 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Viết bài | Bài viết | `title` | Tiêu đề | Chữ · 110 | ✔ |  |
| Viết bài | Bài viết | `description` | Một câu mời đọc | Đoạn · 160 | ✔ | Hiện dưới tiêu đề trên thẻ bài |
| Viết bài | Bài viết | `summary` | Tóm tắt | Soạn thảo · Chỉ in đậm | khi đăng | Hai, ba câu: chuyện gì, ai hay gặp, làm gì ngay |
| Viết bài | Nhận ra và xử lý | `warningSigns` | Dấu hiệu cảnh báo | Danh sách dòng (0–8) | có điều kiện |  |
| Viết bài | Nhận ra và xử lý | `actionsNow` | Việc cần làm ngay | Danh sách dòng (0–6) | có điều kiện |  |
| Viết bài | Nội dung bài | `readingBody` | Nội dung | Soạn thảo · Bài đọc |  | Menu “Kiểu” chèn Hộp ghi nhớ, Trường hợp thật, Bỏ túi |
| Viết bài | Nguồn tham khảo | `references` | Nguồn | InlineList · Bảng | khi đăng |  |
| | ↳ cột | `references[].title` | Tên tài liệu | Chữ · 200 | ✔ |  |
| | ↳ cột | `references[].organization` | Đơn vị | Chữ · 120 |  |  |
| | ↳ cột | `references[].url` | Liên kết | Chữ · Liên kết https |  |  |
| | ↳ cột | `references[].accessedDate` | Ngày truy cập | Ngày |  | ở dòng mở rộng |
| Viết bài | Thêm chi tiết | `scenarios` | Kịch bản thường gặp | InlineList · Thẻ |  |  |
|  | ↳ ô trong thẻ | `scenarios[].tacticName` | Tên thủ đoạn | Chữ · 140 |  | Thủ đoạn trỏ tới kịch bản này được tô sáng khi mở bài |
|  | ↳ ô trong thẻ | `scenarios[].steps` | Diễn biến từng bước | Danh sách dòng (0–8) | ✔ |  |
| Viết bài | Thêm chi tiết | `avoidActions` | Việc không nên làm | Danh sách dòng (0–6) |  |  |
| Viết bài | Thêm chi tiết | `actionPage` | Dẫn tới trang việc cần làm | Chọn · Việc cần làm (một) |  |  |
| Viết bài | Thêm chi tiết | `topic` | Chuyên đề | Chọn · Chuyên đề (một) |  |  |
| Viết bài | Thêm chi tiết | `alsoInCategories` | Hiện thêm ở nhóm | Chọn · Nhóm rủi ro (nhiều) |  |  |
| Viết bài | Thêm chi tiết | `searchKeywords` | Từ người dân hay gõ khi tìm | Thẻ · Từ khóa |  | Ví dụ: “gọi điện công an” |
| Viết bài | Thêm chi tiết | `synonyms` | Từ cùng nghĩa | Thẻ · Từ khóa |  | Ví dụ: “otp” cho “mã xác thực” |
| Viết bài | Thêm chi tiết | `relatedItems` | Bài liên quan | Chọn · Bài liên quan (nhiều, ≤ 4) |  | Để trống thì website tự gợi ý bài cùng nhóm |
| Viết bài | Thêm chi tiết | `checklist` | Danh sách kiểm tra đi kèm | Chọn · Danh sách kiểm tra (một) |  |  |
| Viết bài | Thêm chi tiết | `icon` | Biểu tượng trên thẻ | Danh mục · Biểu tượng |  | Để trống thì theo loại bài |
| Viết bài | Thêm chi tiết | `isFeatured` | Nổi bật | Bật/tắt |  |  |
| Viết bài | Xuất bản | `primaryGroup` | Đăng ở nhóm | Chọn · Nhóm rủi ro (một) | ✔ |  |
| Viết bài | Xuất bản | `articleKind` | Loại bài | Danh mục · Loại bài | ✔ |  |
| Viết bài | Kiểm tra trước khi xuất bản | — (không lưu) | Kiểm tra | Không lưu (hiển thị) |  |  |
| Viết bài | Xem trước thẻ bài | — (không lưu) | Thẻ bài | Không lưu (hiển thị) |  |  |
| Viết bài | Gắn nhãn | `cautionLevel` | Mức độ | Danh mục · Mức độ cần thận trọng | có điều kiện |  |
| Viết bài | Gắn nhãn | `channels` | Thường gặp qua kênh | Chọn · Kênh (nhiều) | có điều kiện |  |
| Viết bài | Gắn nhãn | `audiences` | Ai hay bị nhắm tới | Chọn · Đối tượng (nhiều) | có điều kiện |  |
| Viết bài | Thẩm định | `reviewDate` | Ngày rà soát | Ngày | khi đăng |  |
| Viết bài | Thẩm định | `reviewer` | Người thẩm định | Chữ · 120 | khi đăng |  |
| Viết bài | Thẩm định | `version` | Phiên bản | Chữ · 20 |  |  |
| Viết bài | Thẩm định | — (không lưu) | Thời gian đọc | Không lưu (hiển thị) |  |  |
| Viết bài | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Viết bài | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `hoiDapPage` · Hỏi – Đáp

Có template và đường dẫn · Không xóa (trang cố định)

Không có trường mới: Trang Hỏi – Đáp đã làm bằng Block Grid ở gói Cuộc thi và Hỏi – Đáp, giữ nguyên trong đợt này (QĐ-041). Câu hỏi người dân gửi kín được quản lý ở khu Hỏi – Đáp trên thanh trên.

#### `thiPage` · Cuộc thi

Có template và đường dẫn · Không xóa (trang cố định)

Không có trường mới: Các trang Cuộc thi đã làm và đã vào nhánh dev. Giữ nguyên Block Grid (QĐ-041). Bật, tắt lối vào ở Cài đặt website › Hoạt động.

#### `searchPage` · Tìm kiếm

Có template và đường dẫn · Không xóa (trang cố định)

Không có trường mới: Trang tìm kiếm không có nội dung để sửa. Từ khóa và từ đồng nghĩa nhập ở tab Phân loại của từng bài, cảnh báo, thủ đoạn.

#### `notFoundPage` · Trang 404

Có template và đường dẫn · Không xóa (trang cố định)

Không có trường mới: Giữ như hiện có.

#### `lienHePage` · Liên hệ đúng nơi

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Nội dung | `lead` | Câu dẫn | Đoạn · 220 | ✔ |  |
| Nội dung | Nội dung | `contactGroups` | Nhóm liên hệ | InlineList · Thẻ | ✔ |  |
|  | ↳ ô trong thẻ | `contactGroups[].groupName` | Nhóm | Chữ · 80 | ✔ |  |
|  | ↳ ô trong thẻ | `contactGroups[].organization` | Đơn vị | Chữ · 160 | ✔ |  |
|  | ↳ ô trong thẻ | `contactGroups[].contactMethods` | Cách liên hệ | Danh sách dòng (0–6) | ✔ |  |
|  | ↳ ô trong thẻ | `contactGroups[].source` | Nguồn | Chữ · 200 |  |  |
|  | ↳ ô trong thẻ | `contactGroups[].checkedDate` | Ngày kiểm | Ngày | khi đăng |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `gopYPage` · Góp ý

Có template và đường dẫn · Không xóa (trang cố định)

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Nội dung | `lead` | Câu dẫn | Đoạn · 220 | ✔ |  |
| Nội dung | Nội dung | `enableReward` | Bật xét thưởng | Bật/tắt |  |  |
| Nội dung | Nội dung | `rewardCriteria` | Tiêu chí xét thưởng | Soạn thảo · Rút gọn | ✔ | hiện có điều kiện |
| Nội dung | Nội dung | — (không lưu) | Biểu mẫu | Không lưu (hiển thị) |  |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `infoPage` · Trang thông tin

Có template và đường dẫn · Tạo: chỉ Quản trị viên · Xóa: chỉ Quản trị viên

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 90 | ✔ |  |
| Nội dung | Nội dung | `lead` | Câu dẫn | Đoạn · 220 | khi đăng |  |
| Nội dung | Nội dung | `bodyText` | Nội dung | Soạn thảo · Bài đọc | khi đăng |  |
| Nội dung | Nội dung | `pendingNotes` | Mục còn chỗ trống | Đoạn · 300 |  | Ghi những chỗ còn chờ khách cung cấp, không hiện ra website |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `policyPage` · Chính sách

Có template và đường dẫn · Tạo: chỉ Quản trị viên · Xóa: chỉ Quản trị viên

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Nội dung | `title` | Tiêu đề | Chữ · 110 | ✔ |  |
| Nội dung | Nội dung | `umbracoUrlName` | Đường dẫn | Chữ · 60 | ✔ |  |
| Nội dung | Nội dung | `version` | Dòng phiên bản | Chữ · 80 | ✔ | Ví dụ “Bản dự thảo · ngày ban hành” |
| Nội dung | Nội dung | `bodyText` | Nội dung | Soạn thảo · Bài đọc | ✔ |  |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `pagesRoot` · Quản lý trang

Thư mục, không có trang · Không xóa (trang cố định) · Có Collection (tab danh sách): cột Tên, Loại, Địa chỉ

#### `contentRoot` · Quản lý nội dung

Thư mục, không có trang · Không xóa (trang cố định) · Có Collection (tab danh sách): cột Mục, Số mục, Ai thêm được

#### `otherPagesFolder` · Trang thông tin, chính sách

Thư mục, không có trang · Không xóa (trang cố định) · Con được tạo: `infoPage`, `policyPage` · Có Collection (tab danh sách): cột Tên, Loại, Địa chỉ, Trạng thái

#### `alertFolder` · Cảnh báo

Thư mục, không có trang · Không xóa (trang cố định) · Con được tạo: `alertPage` · Có Collection (tab danh sách): cột Tiêu đề, Mức độ, Phổ biến, Ngày cập nhật, Còn mới, Trạng thái; lọc Trạng thái, Mức độ, Mức độ phổ biến, Kênh

#### `articleFolder` · Bài viết

Thư mục, không có trang · Không xóa (trang cố định) · Con được tạo: `riskArticlePage` · Có Collection (tab danh sách): cột Tiêu đề, Nhóm chính, Loại bài, Mức độ, Ngày rà soát, Trạng thái; lọc Nhóm chính, Loại bài, Trạng thái

#### `actionFolder` · Việc cần làm

Thư mục, không có trang · Không xóa (trang cố định) · Con được tạo: `viecCanLamPage` · Có Collection (tab danh sách), kéo sắp thứ tự: cột Tên, Loại, Ngày rà soát, Trạng thái

#### `checklistFolder` · Danh sách kiểm tra

Thư mục, không có trang · Không xóa (trang cố định) · Con được tạo: `checklistPage` · Có Collection (tab danh sách), kéo sắp thứ tự: cột Tên, Bài đọc nguồn, Trạng thái

#### `libraryFolder` · Danh mục

Thư mục, không có trang · Không xóa (trang cố định) · Có Collection (tab danh sách): cột Danh mục, Số mục, Ai thêm được

#### `channelFolder` · Kênh tiếp cận

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `channelItem` · Có Collection (tab danh sách), kéo sắp thứ tự: cột Tên, Mã, Đang dùng, Chỗ dùng, Trạng thái

#### `audienceFolder` · Đối tượng

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `audienceItem` · Có Collection (tab danh sách), kéo sắp thứ tự: cột Tên, Mã, Đang dùng, Chỗ dùng, Trạng thái

#### `stopSignFolder` · Dấu hiệu phải dừng

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `stopSignItem` · Có Collection (tab danh sách), kéo sắp thứ tự: cột Tên, Mã, Đang dùng, Chỗ dùng, Trạng thái

#### `popularityFolder` · Mức độ phổ biến

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `popularityItem` · Có Collection (tab danh sách), kéo sắp thứ tự: cột Tên, Mã, Đang dùng, Chỗ dùng, Trạng thái

#### `topicFolder` · Chuyên đề

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `topicItem` · Có Collection (tab danh sách), kéo sắp thứ tự: cột Tên, Mã, Đang dùng, Chỗ dùng, Trạng thái

#### `tacticFolder` · Thủ đoạn

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `tacticItem` · Có Collection (tab danh sách): cột Tên thủ đoạn, Chuyên đề, Mức độ, Kênh, Đang dùng, Chỗ dùng; lọc Chuyên đề, Mức độ, Đang dùng

#### `quickQaFolder` · Hỏi – đáp nhanh

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `quickQaItem` · Có Collection (tab danh sách): cột Câu hỏi, Đã duyệt bởi, Trạng thái

#### `snippetFolder` · Đoạn dùng chung

Thư mục, không có trang · Tạo: chỉ Quản trị viên · Không xóa (trang cố định) · Con được tạo: `sharedSnippet` · Có Collection (tab danh sách): cột Tên đoạn, Chỗ dùng

#### `channelItem` · Kênh tiếp cận

Không có trang · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 40 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Kênh tiếp cận | `code` | Mã | Chữ · Mã danh mục | ✔ | duy nhất; khóa sau xuất bản; Chữ thường không dấu, gạch ngang. Dùng trên địa chỉ lọc, ví dụ ?kenh=mang-xa-hoi |
| Nội dung | Kênh tiếp cận | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Kênh tiếp cận | `isActive` | Đang dùng | Bật/tắt |  | Tắt thay cho xóa khi mục còn được dùng |

#### `audienceItem` · Đối tượng

Không có trang · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 60 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Đối tượng | `code` | Mã | Chữ · Mã danh mục | ✔ | duy nhất; khóa sau xuất bản; Chữ thường không dấu, gạch ngang. Dùng trên địa chỉ lọc, ví dụ ?kenh=mang-xa-hoi |
| Nội dung | Đối tượng | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Đối tượng | `isActive` | Đang dùng | Bật/tắt |  | Tắt thay cho xóa khi mục còn được dùng |
| Nội dung | Đối tượng | `summary` | Mô tả ngắn | Đoạn · 120 | ✔ |  |
| Nội dung | Đối tượng | `tactics` | Thủ đoạn hay gặp | Chọn · Thủ đoạn (nhiều, ≤ 8, sắp được) |  | Kéo thẻ để sắp thứ tự |

#### `stopSignItem` · Dấu hiệu phải dừng

Không có trang · Tạo: chỉ Quản trị viên · Xóa: chỉ Quản trị viên · Tên node ≤ 60 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Dấu hiệu phải dừng | `code` | Mã | Chữ · Mã danh mục | ✔ | duy nhất; khóa sau xuất bản; Chữ thường không dấu, gạch ngang. Dùng trên địa chỉ lọc, ví dụ ?kenh=mang-xa-hoi |
| Nội dung | Dấu hiệu phải dừng | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Dấu hiệu phải dừng | `isActive` | Đang dùng | Bật/tắt |  | Tắt thay cho xóa khi mục còn được dùng |
| Nội dung | Dấu hiệu phải dừng | `signText` | Câu dấu hiệu | Soạn thảo · Chỉ in đậm | ✔ | Chỉ in đậm |
| Nội dung | Dấu hiệu phải dừng | `note` | Ghi chú phụ | Đoạn · 160 |  |  |

#### `popularityItem` · Mức độ phổ biến

Không có trang · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 40 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Mức độ phổ biến | `code` | Mã | Chữ · Mã danh mục | ✔ | duy nhất; khóa sau xuất bản; Chữ thường không dấu, gạch ngang. Dùng trên địa chỉ lọc, ví dụ ?kenh=mang-xa-hoi |
| Nội dung | Mức độ phổ biến | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Mức độ phổ biến | `isActive` | Đang dùng | Bật/tắt |  | Tắt thay cho xóa khi mục còn được dùng |
| Nội dung | Mức độ phổ biến | `description` | Giải thích ngắn | Đoạn · 160 |  | Hiện khi rê chuột vào nhãn trên website |

#### `topicItem` · Chuyên đề

Không có trang · Tạo: chỉ Quản trị viên · Xóa: chỉ Quản trị viên · Tên node ≤ 80 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Chuyên đề | `code` | Mã | Chữ · Mã danh mục | ✔ | duy nhất; khóa sau xuất bản; Chữ thường không dấu, gạch ngang. Dùng trên địa chỉ lọc, ví dụ ?kenh=mang-xa-hoi |
| Nội dung | Chuyên đề | `icon` | Biểu tượng | Danh mục · Biểu tượng | ✔ |  |
| Nội dung | Chuyên đề | `isActive` | Đang dùng | Bật/tắt |  | Tắt thay cho xóa khi mục còn được dùng |
| Nội dung | Chuyên đề | `topicNumber` | Số chuyên đề | Số 1–8 | ✔ | duy nhất; khóa sau xuất bản |
| Nội dung | Chuyên đề | `shortName` | Tên ngắn | Chữ · 40 | khi đăng |  |
| Nội dung | Chuyên đề | `readingArticle` | Bài đọc chuyên đề | Chọn · Bài viết (một) | khi đăng |  |
| Nội dung | Chuyên đề | `checklist` | Danh sách kiểm tra | Chọn · Danh sách kiểm tra (một) |  |  |

#### `tacticItem` · Thủ đoạn

Không có trang · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 140 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Thủ đoạn | `code` | Mã | Chữ · Mã danh mục | ✔ | duy nhất; khóa sau xuất bản; Chữ thường không dấu, gạch ngang. Dùng trên địa chỉ lọc, ví dụ ?kenh=mang-xa-hoi |
| Nội dung | Thủ đoạn | `isActive` | Đang dùng | Bật/tắt |  | Tắt thay cho xóa khi mục còn được dùng |
| Nội dung | Thủ đoạn | `topic` | Chuyên đề | Chọn · Chuyên đề (một) | ✔ |  |
| Nội dung | Thủ đoạn | `containingArticle` | Bài viết chứa thủ đoạn | Chọn · Bài viết (một) | khi đăng |  |
| Nội dung | Thủ đoạn | `anchor` | Neo trong bài | Chữ · 40 |  | Mã kịch bản trong bài, để tô sáng khi mở |
| Nội dung | Thủ đoạn | `channels` | Kênh | Chọn · Kênh (nhiều) | ✔ |  |
| Nội dung | Thủ đoạn | `cautionLevel` | Mức độ | Danh mục · Mức độ cần thận trọng | ✔ |  |
| Nội dung | Thủ đoạn | `searchKeywords` | Từ khóa tìm kiếm | Thẻ · Từ khóa |  |  |

#### `quickQaItem` · Hỏi – đáp nhanh

Không có trang · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 200 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Câu hỏi | `question` | Câu hỏi | Đoạn · 200 | ✔ |  |
| Nội dung | Câu hỏi | `shortAnswer` | Trả lời ngắn | Đoạn · 300 | ✔ |  |
| Nội dung | Câu hỏi | `reason` | Vì sao | Soạn thảo · Chỉ in đậm |  |  |
| Nội dung | Câu hỏi | `actions` | Việc cần làm | Soạn thảo · Rút gọn |  |  |
| Nội dung | Câu hỏi | `relatedPages` | Trang liên quan | Chọn · Trang trong website (nhiều, ≤ 2) |  |  |
| Nội dung | Câu hỏi | `approvedBy` | Đã duyệt bởi | Chữ · 80 | khi đăng |  |

#### `sharedSnippet` · Đoạn dùng chung

Không có trang · Tạo: chỉ Quản trị viên · Xóa: chỉ Quản trị viên · Tên node ≤ 120 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Nội dung | Đoạn dùng chung | `title` | Tiêu đề hộp | Chữ · 120 | ✔ |  |
| Nội dung | Đoạn dùng chung | `bodyText` | Nội dung | Soạn thảo · Rút gọn | ✔ |  |
| Nội dung | Đoạn dùng chung | — (không lưu) | Đang dùng ở | Không lưu (hiển thị) |  |  |

## Phụ lục B · Data type

### B1. Danh sách cố định (Dropdown, giao diện combobox)

Giá trị lưu là chữ hiển thị. Không sửa chữ của mục đã có bài dùng (`2-danh-muc…` mục 3.1). Bảng mã dưới đây thay bảng mã ở `2-danh-muc…` mục 3.1.

| Data type | Giá trị theo thứ tự | Mã trong `DanhMucCoDinh` |
|---|---|---|
| `Danh mục · Mức độ cần thận trọng` | Cần thận trọng · Cao · Rất cao (QĐ-051; chữ cũ "Thường" chuyển ở V2-01r) | `thuong`, `cao`, `ratCao` |
| `Danh mục · Loại bài` | Bài hướng dẫn · Bài đọc chuyên đề · Bài đọc thêm | `huongDan`, `docChuyenDe`, `docThem` |
| ~~`Danh mục · Kiểu công cụ`~~ | Không tạo: đã tách hai loại công cụ (QĐ-044) | – |
| ~~`Danh mục · Màu kết quả`~~ | Bỏ: không còn dải kết quả (QĐ-051). Gói nền đã tạo, V2-01r xóa | – |
| ~~`Danh mục · Trả lời là dấu hiệu`~~ | Bỏ: thay bằng loại câu (QĐ-051). Gói nền đã tạo, V2-01r xóa | – |
| `Danh mục · Loại câu kiểm tra` | Phải dừng · Tạm hoãn · Cần kiểm tra | `phaiDung`, `tamHoan`, `canKiemTra` |
| `Danh mục · Nghĩa câu trả lời` | Có · Không · Chưa biết | `co`, `khong`, `chuaBiet` |
| `Danh mục · Hình thức liên hệ` | Gọi · Nhắn tin · Gọi và nhắn tin | `goi`, `nhanTin`, `goiVaNhanTin` |
| `Danh mục · Kiểu cửa vào` | Mở trang ngay · Mở danh sách lựa chọn | `moTrang`, `moDanhSach` |
| `Danh mục · Hình minh họa cửa vào` | Bị đe dọa · Đã có chuyện · Chưa có chuyện | `threat`, `harm`, `check` |
| `Danh mục · Dải trên cùng` | Bản dựng thử · Địa chỉ duy nhất · Ẩn | `thu`, `diaChi`, `an` |
| `Danh mục · Biểu tượng` | 34 mục dạng "Tiền · money" (danh sách ở `FIX.ICONS` trong mockup, cùng tên biểu tượng của bản dựng) | Phần sau dấu "·" |

### B2. Data type cơ bản

| Nhóm | Data type | Editor | Cấu hình |
|---|---|---|---|
| Chữ | `Chữ · 20`, `· 28`, `· 30`, `· 32`, `· 40`, `· 60`, `· 70`, `· 80`, `· 90`, `· 110`, `· 120`, `· 140`, `· 160`, `· 200` | Textstring | `maxChars` bằng số trong tên. Trường ghi "Textstring" ở Phụ lục A dùng `Textstring` có sẵn |
| Đoạn | `Đoạn · 120`, `· 140`, `· 160`, `· 200`, `· 220`, `· 240`, `· 300`, `· 400`, `· 500` | Textarea, 3 dòng | `maxChars`. `· 400`, `· 500` thêm ở V2-08a (QĐ-051) |
| Mã | `Chữ · Mã danh mục` | Textstring, `maxChars` 40 | Regex đặt ở trường: `^[a-z0-9]+(-[a-z0-9]+)*$` |
| Liên kết | `Chữ · Liên kết https` | Textstring | Regex ở trường: `^https://` |
| Số | `Số · 1–3`, `Số · 1–8`, `Số · 30–720` | Integer | `min`, `max` |
| Ngày | `Ngày` | Date Picker | Không có giờ |
| Bật/tắt | `Bật/tắt` | True/False | Có nhãn |
| Danh sách dòng | Một data type cho mỗi cặp (tối thiểu, tối đa) ở Phụ lục A | Repeatable textstrings | `min`, `max` |
| Thẻ | `Thẻ · Từ khóa`, `Thẻ · Từ đồng nghĩa` | Tags, lưu JSON | Nhóm `tuKhoa`, `dongNghia` |
| Ảnh, tệp | `Chọn ảnh`, `Chọn tệp PDF` | Media Picker | Lọc loại Image, File (PDF); một mục |
| Soạn thảo | `Soạn thảo · Chỉ in đậm`, `Soạn thảo · Rút gọn`, `Soạn thảo · Bài đọc` | Rich Text (Tiptap) | V2-01c |

### B3. Chọn nút (Multinode Treepicker, giao diện combobox)

Gốc là khóa cố định của nút ghi ở cột Gốc (V2-01f: Dynamic Root tính từ trang đang sửa nên không tới được Thư viện). "Bắt buộc" đặt ở trường, không đặt ở data type.

| Data type | Gốc | Chỉ chọn loại | Số lượng | Task tạo |
|---|---|---|---|---|
| `Chọn · Kênh` | `channelFolder` | `channelItem` | 0–7 | V2-01f |
| `Chọn · Đối tượng` | `audienceFolder` | `audienceItem` | 0–5 | V2-01f |
| `Chọn · Dấu hiệu phải dừng` | `stopSignFolder` | `stopSignItem` | 0–6 | V2-01f |
| `Chọn · Mức độ phổ biến` | `popularityFolder` | `popularityItem` | 0–1 | V2-01f |
| `Chọn · Chuyên đề` | `topicFolder` | `topicItem` | 0–1 | V2-01f |
| `Chọn · Thủ đoạn` | `tacticFolder` | `tacticItem` | 0–8 | V2-01f |
| `Chọn · Đoạn dùng chung` | `snippetFolder` | `sharedSnippet` | 0–1 | V2-05a |
| `Chọn · Trang trong website` | `homePage` | mọi loại `…Page` | 0–1 (trang liên quan của hỏi – đáp nhanh: 0–2) | V2-02a |
| `Chọn · Bài viết` | `ruiRoPage` | `riskArticlePage` | 0–1 (bài ghim: 0–2) | V2-03a |
| `Chọn · Nhóm rủi ro` | `ruiRoPage` | `riskCategoryPage` | 0–5 | V2-03b |
| `Chọn · Cảnh báo` | `alertListPage` | `alertPage` | 0–1 | V2-04a |
| `Chọn · Bài liên quan` | `homePage` | `riskArticlePage`, `alertPage`, `checklistPage` | 0–4 | V2-04a, thêm checklist ở V2-08a |
| `Chọn · Việc cần làm` | `khanCapPage` | `viecCanLamPage` | 0–1; bản nhiều: 0–10 | V2-05a |
| `Chọn · Việc cần làm hoặc trình hỏi` | `khanCapPage` | `viecCanLamPage`, `wizardPage` | 0–1 | V2-06a |
| `Chọn · Kiểm tra nhanh` | `congCuPage` | `toolCountPage`, `toolBranchPage` | 3–3 | V2-08a |
| `Chọn · Danh sách kiểm tra` | `congCuPage` | `checklistPage` | 0–1 | V2-08a |
| `Chọn · Bài hoặc cảnh báo` | `homePage` | `riskArticlePage`, `alertPage`, `viecCanLamPage` | 0–1 | Dùng trong ma trận (V2-07d) |

### B4. Thành phần tự viết

| Alias | Gắn vào schema | Dùng ở | Task |
|---|---|---|---|
| `Antc.NodeCombobox` | `Umbraco.MultiNodeTreePicker`, `Umbraco.DropDown.Flexible`, `Umbraco.Tags` | Mọi ô chọn | V2-01j, V2-01k, V2-01l |
| `Antc.InlineList` | Schema riêng `Antc.InlineList` | Mọi trường "InlineList · Bảng / Thẻ" ở Phụ lục A. Mỗi trường một data type, cấu hình theo cột ↳ của Phụ lục A | V2-01m đến V2-01p |
| `Antc.WizardMatrix` | Schema riêng | `wizardPage.situationMatrix` | V2-07b đến V2-07d |
| `Antc.InfoPanel` | `Umbraco.Label` | Các dòng "— (không lưu)" ở Phụ lục A | V2-01q |
