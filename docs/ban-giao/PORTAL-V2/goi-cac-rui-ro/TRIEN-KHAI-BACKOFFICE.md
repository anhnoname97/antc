# Backoffice Các rủi ro — bàn giao 04/11/2026

Đã triển khai trong ứng dụng Umbraco hiện có, plugin `AntcRisks` phiên bản `1.1.0`. Không nhúng trang HTML mẫu, không dùng localStorage để lưu nội dung. Các ô nhập làm việc với document, data type, Media và cơ chế lưu/xuất bản/phân quyền thật của Umbraco.

## Mở sử dụng

- Backoffice: http://localhost:11000/umbraco
- Mở trực tiếp Các rủi ro: http://localhost:11000/umbraco/section/content/workspace/document/edit/2f0dfb61-9591-4d14-970a-6be6f7d4b28c
- Cây: **An toàn tài chính → Quản lý trang → Trang chủ → Các rủi ro**.
- Nội dung cập nhật hằng ngày: **Quản lý nội dung → Bài viết / Cảnh báo**.
- Danh mục được đưa vào **Quản lý nội dung → Danh mục**; giữ khóa và dữ liệu các mục đã có.

Bộ trang hiện dùng là 7 trang gốc của AnVu29, gồm Các rủi ro, Cảnh báo mới và 5 nhóm có document type riêng. Nhánh thay thế đã được gỡ ngày 05/11/2026; xem `DIEU-CHINH-THEO-ANVU29.md`. Nội dung, thứ tự nhóm và 9 ảnh tham chiếu lấy từ `backoffice.html`; ảnh được nhập vào Media để thay bằng bộ chọn ảnh thông thường. Khởi động lại giữ nội dung biên tập viên đã sửa.

## Đối chiếu mẫu

Đã đọc và mở thử cả `index.html`, `backoffice.html`, `website-va-backoffice.html`. Script rà soát đi qua 42 màn, 74 tab và bấm 200 điểm chú thích đối chiếu website/backoffice. Kết quả nằm tại `temp/risk-template-review/template-review.json`.

| Phần | Thực hiện |
| --- | --- |
| Trang tổng | Tiêu đề, mô tả, thông tin chuyển hướng, tab SEO |
| Cảnh báo mới | Tiêu đề, câu dẫn, công tắc mẫu trình bày, đếm cảnh báo, mở danh sách, ảnh và alt |
| 5 nhóm | Tên tab, mô tả thẻ, câu dẫn, biểu tượng có tìm kiếm, ảnh thu nhỏ, hộp không tư vấn, ảnh minh họa và alt, đếm bài, Website tự lấy, SEO |
| Bài viết | Bố cục hai cột; ba thẻ loại bài; hiện trường theo loại; dấu hiệu, việc cần làm, danh sách kịch bản dạng thẻ; nội dung RTE; nguồn dạng bảng; nhóm khác, từ khóa; tiến độ, thẻ xem trước, thẩm định |
| Thủ đoạn trong bài | Danh sách thủ đoạn gắn vào bài; liên kết thêm thủ đoạn có điền sẵn bài chứa |
| Cảnh báo | Hai cột; kịch bản, dấu hiệu, nguồn, mức độ/phổ biến, thủ đoạn, kênh/đối tượng, tình trạng 90 ngày, tự gỡ mặc định 180 ngày |
| Điền sẵn | Chọn thủ đoạn điền kênh và đối tượng khi ô trống; giữ lựa chọn đã có |
| Danh sách nội dung | Tìm tiêu đề, lọc theo nhóm/loại/trạng thái hoặc mức độ/phổ biến/kênh; phân trang 20 mục; chọn nhiều; xuất bản/gỡ xuất bản; kéo đổi thứ tự |
| Bộ chọn | Tìm kiếm, chọn đơn/nhiều, bỏ chọn, bàn phím, thứ tự lựa chọn; mục ngừng dùng không đưa vào lựa chọn mới |
| Bảng/thẻ/dòng | Thêm, xóa, nhân bản và đổi thứ tự; dán bảng TSV từ Excel; kịch bản có các bước; nguồn có ngày truy cập trong phần chi tiết |
| Chuyên đề | Thêm nhớ một câu, câu hỏi phải hỏi, khi dừng/hoãn, bài đọc và danh sách kiểm tra |
| SEO/Media | Dùng giá trị và trình quản lý Media chuẩn; giữ khóa/alias, thêm thông tin chuẩn theo Phụ lục A |
| Bảo vệ trang cố định | Không thêm nhóm ngoài bộ 5, không xóa/di chuyển trang cố định; không có Collection trên trang nhóm; vẫn sắp thứ tự được |
| Kiểm tra xuất bản | Kiểm phía máy chủ; bài hướng dẫn cần dấu hiệu/việc cần làm; bài có nguồn/thẩm định; cảnh báo có 3–5 bước, thủ đoạn, kênh, đối tượng, trang xử lý; ảnh cần alt |
| Theo thời gian | Dùng chung hàm còn mới với mốc 90 ngày; job mỗi ngày gỡ cảnh báo quá hạn cấu hình, đọc ngày của bản đã xuất bản, ghi log và lịch sử |
| Màn hình hẹp | Nội dung vừa 1440/744/390px; cây thành menu mở/đóng trên màn nhỏ, Escape để đóng; hoàn trả bố cục Umbraco khi rời màn rủi ro |

Các khối “Website tự lấy” dùng `PortalV2/RuiRo/RuiRoDerivation.cs`, lấy quan hệ từ bài, thủ đoạn, chuyên đề và danh sách kiểm tra. Preview dùng cả dữ liệu đang nhập; API chỉ nằm dưới `/umbraco/management/api/v1/antc/risks`, yêu cầu đăng nhập, quyền vào Nội dung và lọc theo quyền đọc từng document. Mọi thao tác ghi/xuất bản trong giao diện dùng document API gốc.

## Kiểm chứng

- Build thành công; 48 kiểm thử .NET liên quan rủi ro, nền Portal V2 và đường dẫn hiện có đều qua.
- Playwright chạy trên **bản sao SQLite riêng ở cổng 11123**: lưu nháp/đọc lại, tham chiếu native, 3 loại bài, sắp dòng, bảng nguồn, thẻ kịch bản, chặn xuất bản thiếu dữ liệu, xuất bản đầy đủ, điền sẵn cảnh báo, derivation, SEO, bộ lọc, xuất bản/gỡ hàng loạt, 3 bề rộng và menu mobile. Không có lỗi JavaScript.
- Truy cập catalog không đăng nhập trả 401.
- Bản chạy dữ liệu làm việc cổng 11000 đã đăng nhập và mở được trang nhóm; catalog trả 200, ảnh hiển thị và không có lỗi JavaScript.
- SQLite làm việc: `PRAGMA quick_check = ok`, đúng 1 trang tổng + 1 Cảnh báo mới + 5 nhóm, **0 document kiểm thử**.
- Có bản sao SQLite trước thay đổi trong `temp/risk-template-review/Umbraco-before-risks-20261104-174745.db`. Các file kiểm chứng/DB sao lưu được bỏ qua bởi Git.
- Kết quả browser: `temp/risk-template-review/smoke-result.json`; ảnh `risk-group-1440.png`, `risk-group-744.png`, `risk-group-390.png`.

Lệnh kiểm thử nghiệp vụ:

```powershell
dotnet test src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Umbraco.Plugin.Custom.Tests.csproj --filter "FullyQualifiedName~RiskManagementTests|FullyQualifiedName~PortalV2FoundationTests|FullyQualifiedName~AntcPublicPathsTests"
```

Kiểm thử browser ở `src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Browser/risk-management.smoke.cjs`. Script yêu cầu host bản sao có marker, cổng 11123 và biến `ANTC_ALLOW_ISOLATED_WRITES=1`; không chạy ghi trên CSDL làm việc.

Bản local hiện chạy với `--uSync:Settings:ImportAtStartup=None` để giữ dữ liệu đang làm việc; schema mới được cập nhật qua migration và đã xuất file uSync.

## Phạm vi và bảo toàn dữ liệu

Đây là phần **backoffice** được yêu cầu. Các màn website trong `website-va-backoffice.html` được dùng để đối chiếu nguồn trường và quan hệ dữ liệu. Chưa triển khai lại các Razor view của website, URL provider/content finder riêng cho bài rủi ro, chuyển hướng công khai 301, bộ lọc công khai hay player/tô sáng thủ đoạn; những phần đó thuộc V2-13h/V2-13i và tích hợp website. Dòng thông tin chuyển hướng trong form là mô tả hành vi website cần tích hợp.

Giữ shell quản trị và các thao tác lưu, lịch đăng, lịch sử, phân quyền của Umbraco. Không đưa bộ chuyển vai trò giả lập của template vào ứng dụng thật.

Hai thuộc tính cũ `tacticItem.topic` và `tacticItem.anchor` được giữ trong schema để bảo toàn dữ liệu cũ, nhưng đã bỏ khỏi form; `topic` cũ không còn bắt buộc và dịch vụ mới luôn lấy chuyên đề từ bài chứa thủ đoạn. Nội dung bài viết/cảnh báo mẫu và các dữ liệu của nhóm khác không được nạp đè vào CSDL làm việc.

## Cập nhật 05/11/2026 — sửa Mô tả SEO và bộ chọn Biểu tượng

- Sửa lỗi `uui-textarea` đo chiều cao trong tab ẩn: tính lại bằng API `autoUpdateHeight()` khi mở tab và khi vùng biên tập đổi kích thước. Ô Mô tả SEO không còn bị co lại; vẫn dùng trình nhập và cơ chế lưu của Umbraco.
- Hiện SVG của đủ 34 biểu tượng theo mẫu trong lựa chọn hiện tại và danh sách. Nhãn hiển thị dùng tên tiếng Việt, ví dụ hình giấy tờ + “Giấy tờ”; vẫn lưu nguyên `Giấy tờ · id` để giữ tương thích dữ liệu. Các lựa chọn mức độ như “Cao” không bị đổi cách hiển thị.
- Tăng phiên bản manifest/import lên `1.0.2` để trình duyệt tải bản sửa.
- Playwright `risk-editor-appearance.smoke.cjs`: qua 21 kiểm tra SEO trên 7 trang ở 1440/744/390px, toàn bộ 34 icon, chọn bằng bàn phím, bỏ chọn, readonly và lựa chọn mức độ. Không có lỗi JavaScript; chỉ thay giá trị chưa lưu trong phiên kiểm thử, không lưu/xuất bản nội dung.
- Bằng chứng: `temp/risk-template-review/appearance-result.json`, `risk-seo-fixed-1440.png`, `risk-seo-fixed-390.png`, `risk-icon-fixed.png`, `risk-icon-options-fixed.png`.

## Cập nhật 05/11/2026 — gom ba mục cùng tên trong Quản lý nội dung

Theo lựa chọn của người dùng, giữ ba thư mục danh sách, chuyển các trang gốc AnVu29 vào bên trong và bỏ hậu tố `(1)`:

| Thư mục | Trang gốc được giữ | Loại trang |
| --- | --- | --- |
| Bài viết (`77e2e4a9-012b-5566-8542-d033c9c38827`) | `9e237cb6-5641-486f-a059-899d2277337e` | `riskArticlePage` |
| Cảnh báo (`dbeceecd-9e82-5d65-a310-6f0d2b15b38c`) | `58aaf7ff-0544-420e-9c53-36e5630103dd` | `alertPage` |
| Đoạn dùng chung (`ce68012e-e6e5-53db-9edd-27cb86f92cdf`) | `0eeca461-0beb-4588-aab2-4d238f0e5db1` | `sharedSnippet` |

Không xóa hay đổi loại trang. Migration kiểm tra toàn bộ khóa/loại trang/cha trước khi chuyển, chạy một lần với marker `antc.portal-v2.risks.original-content-organized-v1=done`. Chỉ bỏ đúng hậu tố do xung đột tên; giữ những tên đã được biên tập riêng. Quy tắc tự điền Cảnh báo được bỏ qua trong lúc chuyển cấu trúc để giữ nguyên giá trị hiện có, sau đó vẫn áp dụng khi biên tập lưu bình thường.

Quản lý nội dung không còn cho tạo trực tiếp ba loại mục con trên; tạo trong thư mục tương ứng. Đã bổ sung cấu hình cho phép tạo `sharedSnippet` trong `snippetFolder`. Sửa lỗi danh sách Đoạn dùng chung: cấu hình cũ sắp theo `sortOrder` nhưng không khai báo cột đó nên native API từ chối và danh sách hiển thị rỗng; chuyển sang khóa sắp xếp hợp lệ `name`. Các marker uSync `Change="Rename"` là dấu đổi tên, không phải các trang trùng còn hoạt động.

Sao lưu trước áp dụng: `temp/risk-template-review/organize-original-20261105-110035/Umbraco.sqlite.db`. Đối chiếu toàn CSDL xác nhận toàn bộ giá trị thuộc tính hiện hành, khóa nội dung và trạng thái xuất bản giữ nguyên; chỉ ba trang gốc đổi cha/tên. `PRAGMA quick_check=ok`.

Build thành công, 52 kiểm thử .NET đạt. Sau khởi động lại, Playwright xác nhận cả ba danh sách có đúng trang gốc, mở được cả ba màn biên tập và không có lỗi JavaScript. Bằng chứng: `temp/risk-template-review/organized-result.json`, `organized-database-result.json`, ảnh `organized-riskArticlePage.png`, `organized-alertPage.png`, `organized-sharedSnippet.png`, `organized-snippet-editor.png`.

## Nút Đóng trong màn soạn Bài viết

Thêm nút **Đóng** ở góc phải thanh tab của màn soạn Bài viết, hiển thị cả khi tạo mới và chỉnh sửa, trên tab Viết bài và SEO. Nút mở danh sách Bài viết theo thư mục cha trong catalog có quyền đọc. Dùng điều hướng gốc để giữ hộp thoại xác nhận của Umbraco nếu có thay đổi chưa lưu; không tự lưu bài. Manifest `1.1.1` đổi phiên bản URL của trình biên tập để tải bản mới.

Playwright đã xác nhận: bài có sẵn và bài mới đều quay về danh sách; đóng từ tab SEO; chọn Ở lại giữ nội dung đang sửa, chọn Hủy thay đổi trở về danh sách; nút hiển thị và hoạt động ở 1440/390px. Không có yêu cầu lưu/xóa document hoặc lỗi JavaScript trong phiên kiểm thử. Bằng chứng: `temp/risk-template-review/article-close-result.json`, `article-close-1440.png`, `article-close-390.png`, `article-close-unsaved.png`.

## Cập nhật 10/11/2026 — sửa review BO-01 đến BO-13 và hiệu chỉnh kiểm chứng

Các số 48/52 test ở những mục cũ không đại diện kết quả toàn bộ bộ kiểm thử của dự án. Không dùng các số đó để kết luận toàn suite đã qua. Review ngày 10/11 ghi nhận bản được review có 514 qua và 2 lỗi trên 516 test; hai lỗi khởi động/fixed-list đã được khắc phục trong lần sửa này.

Lệnh đã chạy từ `src`:

```powershell
dotnet test ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Umbraco.Plugin.Custom.Tests.csproj --no-restore -v quiet --logger 'trx;LogFileName=risk-review-final.trx' --results-directory ../temp/risk-review-results
```

Kết quả cuối: **561 qua, 0 lỗi, 0 bỏ qua**, thời gian chạy test 42 giây. Có các test mới cho kiểm tra trước xuất bản, ngày Việt Nam, phiên bản cảnh báo đã xuất bản, trang cố định, quyền catalog và invalidation/cache đối tượng. `ContestAdministrationFullHostTests` và `PortalV2FoundationTests.FixedLists_MatchSeedCodesAndLabels` đều qua.

Host sạch được dựng trong thư mục riêng bằng `run-isolated.ps1 -Fresh -BuildSchema`, không reset CSDL làm việc. Đạt `uSync: Startup Complete`; 9 ảnh mẫu có trong Media và 9 URL `/media/` trả HTTP 200. Khởi động lại không có log lặp thao tác chuyển nội dung của RiskSchemaMigration. Import dữ liệu mẫu của các gói khác vẫn có một số lỗi xuất bản thiếu trường/tham chiếu, không được coi là đã đóng các lỗi website.

Ba script `risk-management.smoke.cjs`, `risk-review.smoke.cjs`, `risk-editor-appearance.smoke.cjs` đều qua trên localhost:11123, không lỗi JavaScript. Đã xác nhận xóa hai mục chỉ đưa mục không tham chiếu vào thùng rác; mục được dùng ở nơi khác được giữ lại và báo tên. Appearance kiểm tra 37 trang, 111 lượt SEO ở ba bề rộng 1440/744/390px và 34 biểu tượng. Đã kiểm tra ảnh danh sách Bài viết/Cảnh báo ở 1440/390px.

Chi tiết từng BO-xx, cách chạy lại và phần website còn ngoài phạm vi: [2-ban-giao.md](2-ban-giao.md). Log, ảnh và TRX trong `temp/risk-review-*` được gitignore; không ghi tài khoản/mật khẩu vào hồ sơ.
