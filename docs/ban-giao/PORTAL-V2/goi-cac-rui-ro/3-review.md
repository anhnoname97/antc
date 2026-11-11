# Review gói Các rủi ro — danh sách phải sửa

Ngày review: 10/11/2026 · Nhánh `portal-v2` tại `e0fa5914`

| Phần | Commit | Người làm |
|---|---|---|
| Backoffice | f2ee00a7, 3fcf400f, 1950512e, 40920909, 51b2bcef | Andrew Thompson (`hieuhv/be-01`) |
| Website (V2-13h, V2-13i) | bda73f49 | MinhNB (`MinhNB/Trang-CacRuiRo`) |

Căn cứ đối chiếu, theo thứ tự ưu tiên:

1. Quyết định đã xác nhận trong `docs/quyet-dinh.md`: QĐ-048, QĐ-052, QĐ-053, QĐ-054, QĐ-055, QĐ-056.
2. Tài liệu: `docs/ban-giao/PORTAL-V2/1-thiet-ke.md` (task V2-03a…V2-13i, Phụ lục A), `goi-cac-rui-ro/index.html`, `goi-cac-rui-ro/backoffice.html`.
3. Quy ước dự án trong `CLAUDE.md`.

Mục nào không có QĐ riêng thì cột "Căn cứ" ghi tài liệu hoặc quy ước áp dụng.

**Mọi mục dưới đây đều phải sửa.** Khi sửa, không đổi alias và khóa đang có, không đổi tên trường JSON. Đổi schema thì sửa trong backoffice rồi commit file uSync sinh ra.

## Kết quả kiểm chứng lúc review

`dotnet test src/ANTC.Portal.App/Umbraco.Plugin.Custom.Tests/Umbraco.Plugin.Custom.Tests.csproj` trên bản sao của `e0fa5914`: **514 qua, 2 lỗi / 516**.

| Test lỗi | Nguyên nhân | Mục sửa |
|---|---|---|
| `ContestAdministrationFullHostTests.RealUmbracoLogin_ReportsAndPublication_WorkInsideBackoffice_WithoutRazorPages` | `RiskSchemaMigration` ném lỗi trên CSDL trống. Các handler khởi động đăng ký sau nó không chạy, nên nhóm "Quản trị cuộc thi" không được tạo. Đã thử tắt riêng handler này: test qua. | BO-01 |
| `PortalV2FoundationTests.FixedLists_MatchSeedCodesAndLabels` | Seed có danh mục "Danh mục · Loại lựa chọn trình hỏi" (QĐ-056), `DanhMucCoDinh` chưa có. Lỗi đến từ commit 106a87fd của gói Khẩn cấp. | NG-01 |

Playwright, chạy ngày 10/11/2026 trên host riêng `http://localhost:11123`. Host này chạy bản build `e0fa5914`, dùng bản sao CSDL của máy anhnn, đã nhập uSync khi khởi động:

| Script | Kết quả |
|---|---|
| `risk-editor-appearance.smoke.cjs` | Qua: 33 trang, 99 kiểm tra SEO, 34 biểu tượng, không lỗi JavaScript |
| `risk-management.smoke.cjs` | Qua: 15 nhóm kiểm tra (tham chiếu, lưu nháp, 3 loại bài, chặn xuất bản thiếu trường, điền sẵn cảnh báo, tự lấy, SEO, 3 bề rộng, bộ lọc, xuất bản/gỡ hàng loạt, chặn truy cập ẩn danh), không lỗi JavaScript |

Ghi nhận thêm khi chạy:
- CSDL làm việc ở cổng 11000 của máy anhnn chưa có phần Các rủi ro: không có 5 loại trang nhóm, không có trang Các rủi ro, Trang chủ mang khóa khác. Phải nhập uSync vào bản sao thì script mới chạy được.
- API `catalog` trả 414 KB cho mỗi lần gọi (xem BO-03).

Hai script này chỉ kiểm phần backoffice. Phần website (WEB-xx) chưa có script Playwright, và chưa được mở để đối chiếu với ảnh bản dựng v2.

Repo chưa có script dựng host 11123. Các bước đã làm, để người khác chạy lại:
1. Sao chép `Umbraco.sqlite.db` và `app.sqlite.db` bằng SQLite backup vào một thư mục build riêng (không dùng thư mục của web 11000).
2. Tạo `wwwroot/antc-isolated-test.json` có nội dung `{"isolated":true,"nonce":"<ngẫu nhiên>"}`, và một file cùng nonce bên ngoài.
3. Chạy `ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://localhost:11123 dotnet bin/Debug/net10.0/Umbraco.Web.UI.dll`.
4. Đặt biến môi trường cho script: `ANTC_ALLOW_ISOLATED_WRITES=1`, `ANTC_TEST_MARKER_PATH`, `ANTC_BACKOFFICE_USERNAME`, `ANTC_BACKOFFICE_PASSWORD`, `ANTC_PLAYWRIGHT_MODULE`, và `ANTC_BROWSER_PATH` nếu phiên bản Chromium khác với bản gói `playwright` cần.

Nên viết các bước trên thành một script trong repo, ví dụ `run-isolated.ps1`.

---

## A. Phần backoffice (Andrew Thompson)

### BO-01 · Nghiêm trọng · Bước chuyển dữ liệu chạy ở mọi môi trường và làm hỏng chuỗi khởi động

- **Căn cứ:** `CLAUDE.md` › "Document type nằm trong uSync, không nằm trong code" (môi trường khác Development chỉ nhập uSync một lần khi CSDL trống). `PortalV2SchemaBuilder` cũng chỉ chạy ở Development khi bật `PortalV2:SchemaBuilder:Enabled`.
- **Vị trí:**
  - `Umbraco.Plugin.Custom.Core/Composers/CustomCoreComposer.cs:65`
  - `PortalV2/Schema/RiskSchemaMigration.cs:15`
  - `PortalV2/Schema/RiskStructureAdoption.cs:14-113`
- **Hiện trạng:** mỗi lần khởi động, ở mọi môi trường kể cả Production, code tự sửa document type và data type, xóa loại `riskCategoryPage`, tạo, di chuyển, xóa nội dung và quét toàn bộ nội dung (`types.GetAll()` × `GetPagedOfType(int.MaxValue)`). Gặp CSDL trống hoặc thiếu Trang chủ thì ném `InvalidOperationException` ra khỏi handler, nên `ActionFolderMigration`, `DanhMucStartupCheck` và `ContestManagementSectionAccessHandler` không chạy.
- **Cách sửa:**
  1. Đặt cùng điều kiện với `PortalV2SchemaBuilder`: chỉ chạy khi `IsDevelopment()` và `PortalV2:SchemaBuilder:Enabled = true`.
  2. Bỏ qua khi `IRuntimeState.Level != RuntimeLevel.Run` hoặc khi chưa có Trang chủ (`RiskStructure.HomeKey`): ghi log mức Warning rồi `return`, không ném lỗi.
  3. Bọc thân handler bằng `try/catch`, ghi log lỗi. Không để lỗi thoát khỏi handler.
  4. Phần nhận nhánh trùng, đổi tham chiếu GUID, xóa `riskCategoryPage`, gom ba trang gốc: mỗi phần có marker riêng trong `IKeyValueService` và chạy đúng một lần. Lần khởi động sau không quét lại toàn bộ nội dung.
  5. Schema mới phải nằm trong uSync (`uSync/v18/ContentTypes`, `DataTypes`) để môi trường khác nhận qua uSync, không qua code.
- **Kiểm chứng:**
  - `ContestAdministrationFullHostTests` qua.
  - `.\run-local.ps1 -Reset` khởi động tới `uSync: Startup Complete` mà không có lỗi của `RiskSchemaMigration`.
  - Chạy thêm một lần nữa không thấy log chuyển dữ liệu lặp lại.

### BO-02 · Cần sửa · Ảnh mẫu của Các rủi ro không có trên máy khác

- **Căn cứ:** QĐ-052 ("tách ảnh từ bản dựng vào dữ liệu mẫu để nạp vào Phương tiện"; "Phương tiện có sẵn ảnh mẫu"). `CLAUDE.md`: `wwwroot/media/` không commit.
- **Vị trí:**
  - `uSync/v18/Media/các-rủi-ro-m-a05.jpg.config` … `m-a39` (9 file) trỏ tới `/media/<mã>/m-a*.jpg`.
  - Commit 1950512e đã xóa `Umbraco.Web.UI/Media/RiskMediaInitializer.cs`.
  - `wwwroot/assets/img/risks/*.jpg` (9 file) không còn chỗ nào dùng.
- **Cách sửa:** khôi phục bước nạp ảnh một lần, có marker:
  - đọc ảnh từ `wwwroot/assets/img/risks/`;
  - tạo hoặc cập nhật đúng các mục Media có khóa trong uSync;
  - ghi file vào Media qua `MediaFileManager` (không ghi tay vào `wwwroot/media`).
  - Chỉ chạy khi mục Media chưa có file thật. Ảnh biên tập viên đã thay thì giữ nguyên.
- **Kiểm chứng:** máy sạch (`run-local -Reset`): 9 ảnh hiện trong Phương tiện và trên trang nhóm, không có lỗi 404 ở `/media/`.
- Phần website có cùng lỗi với 7 ảnh khác: xem WEB-08.

### BO-03 · Cần sửa · API catalog trả thừa dữ liệu và nạp toàn bộ nội dung mỗi lần gọi

- **Căn cứ:** QĐ-054 (3): dịch vụ phía máy chủ, không cần API công khai, API chỉ phục vụ backoffice. `CLAUDE.md` › Nguyên tắc (xử lý bảo mật, trường hợp biên).
- **Vị trí:** `Umbraco.Plugin.Custom.Api/Controllers/RiskBackofficeController.cs:21-22`, `:52-69`; cảnh báo build CS8625 ở `:60`.
- **Hiện trạng:**
  - `catalog` trả mọi thuộc tính của khoảng 20 loại trang, kể cả `siteSettings` và toàn bộ thân bài, cho mọi người có quyền vào Nội dung.
  - `catalog` và `derive` mỗi lần gọi đều đọc lại toàn bộ.
- **Cách sửa:**
  1. Bỏ `siteSettings` khỏi `Aliases`. Nếu editor cần `noAnswerNote` thì trả riêng đúng trường đó.
  2. Thêm tham số `type` hoặc `parent` cho `catalog`. Màn danh sách chỉ nhận các cột đang hiển thị (tiêu đề, nhóm, loại, chuyên đề, ghim, ngày, mức độ, phổ biến, kênh, trạng thái), không nhận `readingBody`, `summary`.
  3. `derive` chỉ nạp các loại cần cho luật tự lấy, dùng chung bộ đệm ở BO-10.
  4. Sửa CS8625: truyền `IQuery<IContent>?` đúng kiểu hoặc dùng overload không nhận `filter`.
- **Kiểm chứng:**
  - Test mới: người dùng không có quyền đọc một trang thì trang đó không có trong `catalog`.
  - Kết quả `catalog` không chứa `siteSettings` và `readingBody`.
  - Build không còn CS8625 ở file này.

### BO-04 · Cần sửa · Kiểm tra trước khi xuất bản chưa đủ theo Phụ lục A

- **Căn cứ:**
  - Phụ lục A › `riskArticlePage`: `references[].title` bắt buộc, `scenarios[].steps` bắt buộc, `series` chỉ hiện với Bài đọc thêm.
  - QĐ-048 (2): liên kết chỉ cần bắt đầu bằng `https://`.
  - QĐ-054 (2): `series` dành cho Bài đọc thêm.
- **Vị trí:** `PortalV2/RuiRo/RiskContentRules.cs:53-74` (`Validate`).
- **Hiện trạng:** các ràng buộc từng dòng của InlineList chỉ được kiểm ở trình duyệt. Một nguồn không có tiêu đề hoặc có liên kết `http://` vẫn xuất bản được. `series` chỉ bị chặn khi có hơn 1 giá trị.
- **Cách sửa:** trong `Validate`, đọc JSON của `references` và `scenarios`, rồi kiểm:
  - mỗi dòng nguồn có `title`;
  - `url` (nếu có) bắt đầu bằng `https://`;
  - mỗi kịch bản có ít nhất 1 bước;
  - `series` có giá trị mà bài không phải Bài đọc thêm thì báo lỗi "Loạt bài chỉ dùng cho Bài đọc thêm.".

  Câu báo lỗi viết tiếng Việt có dấu, cùng giọng với các câu hiện có.
- **Kiểm chứng:** test cho từng trường hợp trong `RiskManagementTests`.

### BO-05 · Cần sửa · Tính "hôm nay" theo hai múi giờ khác nhau

- **Căn cứ:** V2-04b ("hàm còn mới dùng chung cho view và InfoPanel"); QĐ-048 (3) (tự gỡ sau 180 ngày kể từ ngày cập nhật). Dự án tính ngày theo giờ Việt Nam (QĐ-006).
- **Vị trí:**
  - `PortalV2/RuiRo/RiskContentRules.cs:21` dùng `DateTime.Today`, theo giờ máy chủ;
  - `PortalV2/RuiRo/AlertAutoUnpublishJob.cs:21` dùng giờ Việt Nam.
- **Cách sửa:** thêm một hàm dùng chung, ví dụ `AlertFreshness.Today(TimeProvider)`, trả ngày theo `SE Asia Standard Time`. Dùng hàm này ở `RiskContentRules`, `AlertAutoUnpublishJob` và mọi view (xem WEB-06). Inject `TimeProvider` thay vì gọi `DateTime.Today`.
- **Kiểm chứng:** test với `FakeTimeProvider` ở 23:30 UTC (đã là ngày hôm sau theo giờ Việt Nam) cho đúng ngày Việt Nam.

### BO-06 · Cần sửa · Cột "Còn mới" của danh sách Cảnh báo tự tính riêng và sai chữ so với bản mẫu

- **Căn cứ:** V2-04b (hàm còn mới dùng chung); V2-04a (Collection của `alertFolder` có cột Còn mới); `backoffice.html`, cột "Còn mới".
- **Vị trí:** `App_Plugins/AntcRisks/risk-collection.js:77`.
- **Hiện trạng:** tính bằng `Date.now()` ở trình duyệt; hiện "Còn mới" / "Lưu trữ"; thiếu ngày thì hiện "Lưu trữ".
- **Cách sửa:** `catalog` trả thêm `freshDaysLeft` (số ngày còn lại, `null` khi thiếu ngày), tính bằng `AlertFreshness`. Cột hiện theo bản mẫu:
  - còn mới: "Còn N ngày" (chip `pub`);
  - quá hạn: "Quá 90 ngày";
  - thiếu ngày: "–".
- **Kiểm chứng:** mở Quản lý nội dung › Cảnh báo với cảnh báo 0, 90, 91 ngày và một cảnh báo thiếu ngày.

### BO-07 · Cần sửa · Chữ trên màn danh sách khác bản mẫu

- **Căn cứ:** `goi-cac-rui-ro/backoffice.html` (bản backoffice chạy thử); QĐ-053 (2) (Quản lý nội dung mở danh sách để lọc, thêm, sửa).
- **Vị trí:** `App_Plugins/AntcRisks/risk-collection.js:69-79`.
- **Cách sửa:**

  | Chỗ | Hiện tại | Đổi thành (theo bản mẫu) |
  |---|---|---|
  | Bộ lọc trạng thái | Đã xuất bản / Bản nháp | Đã đăng / Nháp |
  | Nút hàng loạt | Gỡ xuất bản | Gỡ khỏi website |
  | Thông báo sau khi gỡ | Đã gỡ xuất bản N mục. | Đã gỡ N mục khỏi website. Các mục vẫn còn ở dạng nháp. |
  | Chân bảng | N mục · Kéo dòng để sắp thứ tự khi chưa lọc. | x/y mục · kéo ⋮⋮ để đổi thứ tự hiện trên website; khi đang lọc: · bỏ tìm kiếm và bộ lọc để kéo đổi thứ tự |
  | Ô hộp thoại xác nhận | Gỡ xuất bản N mục đã chọn? | Gỡ N mục đã chọn khỏi website? |

- **Kiểm chứng:** ảnh chụp 1440/390 px của danh sách Bài viết và Cảnh báo, so với `backoffice.html`.

### BO-08 · Cần sửa · Thiếu thao tác Xóa hàng loạt có kiểm tra tham chiếu

- **Căn cứ:** `backoffice.html`, thanh thao tác hàng loạt (nút Xóa chỉ hiện khi có quyền xóa; mục còn được nơi khác tham chiếu thì không xóa và báo tên); Phụ lục A (Bài viết, Cảnh báo: "Xóa: Biên tập viên").
- **Vị trí:** `App_Plugins/AntcRisks/risk-collection.js:71-83`.
- **Cách sửa:**
  - Thêm nút "Xóa", chỉ hiện khi người dùng có quyền Xóa.
  - Trước khi xóa, gọi API tham chiếu gốc của Umbraco (`DocumentService.getDocumentByIdReferencedBy`). Mục còn tham chiếu thì bỏ qua và liệt kê tên.
  - Mục không còn tham chiếu thì chuyển vào thùng rác bằng `DocumentService.putDocumentByIdMoveToRecycleBin`.
  - Có hộp xác nhận.
- **Kiểm chứng:** Playwright trên host riêng: xóa 2 mục, trong đó 1 mục đang được tham chiếu; chỉ mục không tham chiếu vào thùng rác.

### BO-09 · Cần sửa · Thiếu test cho các luật đã làm

- **Căn cứ:** cột "Kiểm chứng" của V2-03a ("xuất bản bài thiếu trường bị chặn"), V2-03c ("test cho từng luật trong project test"), V2-04a, V2-04b.
- **Vị trí:** `Umbraco.Plugin.Custom.Tests/RiskManagementTests.cs`.
- **Cách sửa:** thêm test cho:
  1. Cảnh báo: dưới 3 hoặc trên 5 bước kịch bản; thiếu thủ đoạn, kênh, đối tượng hoặc trang việc cần làm thì bị chặn.
  2. Có `illustration` mà thiếu `illustrationAlt` thì bị chặn, cho cả 4 loại trang.
  3. Thủ đoạn có `containingArticle` không phải Bài hướng dẫn thì bị chặn.
  4. `RiskFixedPages`: chặn xóa, di chuyển, đưa vào thùng rác; chặn tạo trang cố định thứ hai; vẫn cho sắp thứ tự.
  5. Tự điền kênh và đối tượng của Cảnh báo chỉ khi ô còn trống.
  6. `AlertAutoUnpublishJob`: đọc ngày của bản đã xuất bản; `autoUnpublishDays` ngoài khoảng 30–720 thì dùng 180.
  7. API `catalog`: chưa đăng nhập trả 401; lọc theo quyền đọc từng trang.
- **Kiểm chứng:** `dotnet test --filter "FullyQualifiedName~RiskManagementTests"` qua.

### BO-10 · Cần sửa · Chưa lưu đệm kết quả tự lấy

- **Căn cứ:** V2-03c ("Lưu đệm kết quả, xóa khi lưu bài, cảnh báo, thủ đoạn, chuyên đề"); QĐ-054 (3).
- **Vị trí:** `PortalV2/RuiRo/RuiRoDerivation.cs`; các nơi gọi trong `RiskBackofficeController` và view (WEB-01).
- **Cách sửa:**
  - Thêm một lớp đọc dữ liệu đã xuất bản cho Các rủi ro (singleton), giữ danh sách `RiskNode` trong bộ nhớ.
  - Xóa bộ đệm khi có `ContentPublishedNotification`, `ContentUnpublishedNotification`, `ContentMovedToRecycleBinNotification` hoặc `ContentSortedNotification` của `riskArticlePage`, `alertPage`, `tacticItem`, `topicItem`, `audienceItem`, `channelItem`, `checklistPage`, `viecCanLamPage`.
  - Bản xem trước (preview) không dùng bộ đệm.
- **Kiểm chứng:** test: sau khi xuất bản một thủ đoạn mới, lần gọi tiếp theo có thủ đoạn đó.

### BO-11 · Cần sửa · Tự điền đối tượng đọc toàn bộ danh mục mỗi lần lưu

- **Căn cứ:** QĐ-054 (3) (điền sẵn kênh, đối tượng khi chọn thủ đoạn); `CLAUDE.md` › Nguyên tắc.
- **Vị trí:** `PortalV2/RuiRo/RiskContentRules.cs:31` (`GetPagedOfType(..., int.MaxValue)`).
- **Cách sửa:** lấy danh sách đối tượng từ bộ đệm ở BO-10, hoặc qua `IRelationService` hoặc tham chiếu ngược của các thủ đoạn đã chọn. Không đọc toàn bộ đối tượng ở mỗi lần lưu.

### BO-12 · Cần sửa · `AlertFreshness` chưa đặt đúng vị trí tài liệu ghi

- **Căn cứ:** V2-04b (`Core/PortalV2/Alerts/AlertFreshness.cs`).
- **Vị trí:** `PortalV2/RuiRo/RuiRoDerivation.cs:125-130`.
- **Cách sửa:** chuyển lớp sang `Umbraco.Plugin.Custom.Core/PortalV2/Alerts/AlertFreshness.cs`, gộp với hàm "hôm nay" ở BO-05. Giữ nguyên tên lớp và các hàm `Age`, `IsFresh`, `ShouldUnpublish`.

### BO-13 · Cần sửa · Hồ sơ bàn giao báo sai kết quả test

- **Căn cứ:** `CLAUDE.md` › Nguyên tắc ("báo đúng lệnh đã chạy và kết quả thật").
- **Vị trí:** `goi-cac-rui-ro/TRIEN-KHAI-BACKOFFICE.md`, mục "Kiểm chứng" (ghi 48, sau đó 52 test đạt).
- **Cách sửa:** sau khi sửa xong mục A, thêm một mục có ngày ở cuối file, ghi đúng lệnh `dotnet test` toàn bộ và số qua/lỗi thật. Không xóa nội dung cũ.

---

## B. Phần website (MinhNB)

### WEB-01 · Nghiêm trọng · Viết lại luật tự lấy thay vì dùng dịch vụ chung

- **Căn cứ:** QĐ-054 (3) (luật tự lấy viết thành một dịch vụ phía máy chủ dùng cho view Razor); V2-03c (`RuiRoDerivation.cs`); V2-13h ("dữ liệu thẻ lấy từ dịch vụ V2-03c").
- **Vị trí:**
  - `Umbraco.Web.UI/Models/RiskAlertContent.cs:155-214` (`GroupCards`: chọn bài trong nhóm, thủ đoạn, cảnh báo, việc cần làm, mức độ cao nhất, kênh, đối tượng);
  - `:241-264` (`Related`: bài liên quan);
  - `:193`, và `PortalV2/RuiRo/AlertList.cs:61` (thời gian đọc).
- **Hiện trạng:** trùng logic với `RuiRoDerivation.Derive`. Thời gian đọc có 3 công thức:
  - `RuiRoDerivation`: 200 từ/phút;
  - `GroupCards`: 200 từ/phút, làm tròn lên;
  - `AlertList.ReadingMinutes`: đếm số từ gấp đôi, 180 từ/phút.
- **Cách sửa:**
  1. View lấy `RiskDerived` từ `RuiRoDerivation` (qua bộ đệm ở BO-10), dựng từ dữ liệu đã xuất bản.
  2. `RiskAlertContent` chỉ đổi `RiskDerived` thành `AlertListItem` và `RiskRelatedLink` để hiển thị; không tự chọn bài, thủ đoạn, mức độ, kênh, đối tượng.
  3. Thời gian đọc dùng một hàm chung. Nếu bản dựng v2 dùng công thức "gấp đôi, 180 từ/phút" thì đổi luôn trong `RuiRoDerivation` và ghi nguồn trong comment.
- **Kiểm chứng:** test so khớp `GroupCards` với `RuiRoDerivation.Derive` trên cùng dữ liệu mẫu. Trang nhóm và khung "Website tự lấy" ở backoffice cho cùng số bài, cùng thủ đoạn.

### WEB-02 · Cần sửa · Câu cố định ghi cứng trong code

- **Căn cứ:**
  - QĐ-054 (2): `siteSettings.noAnswerNote`, "một câu cho cả 6 tab";
  - `goi-cac-rui-ro/index.html` › Phạm vi: "Cài đặt website › Câu cố định: câu miễn trừ tư vấn, Hai điều phải nhớ, Không thấy câu trả lời?";
  - V2-03b: "Chữ trong hộp sửa ở Cài đặt website › Câu cố định".
- **Vị trí:**
  - `Models/RiskAlertContent.cs:42-44` (`SampleNote`, `HoldNote`, `NoAnswerNote`) và `:129-134` (`NoAdvice`, `MustRemember`);
  - nơi dùng: `Views/Partials/_RiskAsk.cshtml:5`, `Views/NhomRuiRo.cshtml:64-65`, `Views/CanhBao.cshtml:88,157`, `Views/CanhBaoMoi.cshtml:54`.
- **Cách sửa:**
  1. Đọc các câu này từ nút Cài đặt website: `noAnswerNote`, câu miễn trừ tư vấn, "Hai điều phải nhớ", và câu của hộp "Chưa chuyển tiền cho tới khi đã kiểm chứng". Dùng alias của trường nếu đã có. Nếu chưa có thì thêm trường trong backoffice ở nhóm Câu cố định rồi commit uSync, đồng thời báo người điều phối để ghi alias vào Phụ lục A.
  2. Hằng số trong code chỉ dùng khi ô trong Cài đặt website còn trống.
  3. Đưa nội dung hiện tại vào file nội dung uSync của Cài đặt website, để dữ liệu mẫu giữ nguyên câu chữ.
- **Kiểm chứng:** sửa câu "Không thấy câu trả lời?" trong backoffice; cả 6 tab đổi theo.

### WEB-03 · Cần sửa · "Nhớ một câu", "Câu hỏi phải hỏi" đặt sai loại trang

- **Căn cứ:** QĐ-054 (2) (thêm `topicItem.rememberLine`, `.mustAsk`, `.stopWhen`, `.holdWhen`); V2-13i ("Nhớ một câu, Câu hỏi phải hỏi, Khi nào dừng, hoãn lấy từ chuyên đề"); Phụ lục A › `riskArticlePage` không có hai trường này.
- **Vị trí:**
  - `PortalV2/Schema/RiskSchema.cs` (khối `riskArticlePage`, hai dòng `rememberLine`, `mustAsk`);
  - `uSync/v18/ContentTypes/riskarticlepage.config`;
  - `Views/BaiHuongDanRuiRo.cshtml`.
- **Cách sửa:**
  1. Bỏ `rememberLine`, `mustAsk` khỏi `riskArticlePage`, trong cả code lẫn uSync.
  2. View Bài hướng dẫn lấy 4 trường từ chuyên đề ở `topic` của bài: `rememberLine`, `mustAsk`, `stopWhen`, `holdWhen`.
  3. Nếu đã nhập giá trị vào hai trường cũ trên bài, chuyển giá trị sang chuyên đề tương ứng, rồi mới xóa trường.
- **Kiểm chứng:** sửa "Nhớ một câu" ở Chuyên đề; mọi Bài hướng dẫn thuộc chuyên đề đó đổi theo.

### WEB-04 · Cần sửa · Bấm vào thủ đoạn không tô sáng đúng dòng

- **Căn cứ:** V2-13i ("Thủ đoạn thường gặp tô sáng dòng khi đến từ thẻ thủ đoạn (`?thu-doan=<code>`)"; "bấm thẻ thủ đoạn mở đúng bài và tô sáng đúng dòng"); QĐ-055 (tô sáng theo chính thủ đoạn).
- **Vị trí:**
  - `Models/RiskAlertContent.cs:202`: thẻ trang nhóm dùng `#tactic-{khóa}`;
  - `:254`: Bài liên quan của Cảnh báo dùng `?thu-doan=<code>`;
  - `Views/BaiHuongDanRuiRo.cshtml:178`: không đọc `?thu-doan`.
- **Cách sửa:**
  1. Mọi liên kết từ thẻ thủ đoạn dùng `?thu-doan=<code>#tactic-<khóa>`: phần query theo V2-13i, phần neo giữ cho trình hỏi Khẩn cấp đang trỏ tới (QĐ-056).
  2. `BaiHuongDanRuiRo.cshtml` đọc `thu-doan`, so với `code` của thủ đoạn trong bài, rồi thêm class tô sáng và `aria-current="true"` cho dòng khớp. Giá trị không khớp thủ đoạn nào thì bỏ qua.
  3. Tô sáng làm ở máy chủ để không phụ thuộc JavaScript.
- **Kiểm chứng:** bấm thẻ thủ đoạn ở trang nhóm và ở Bài liên quan của trang Cảnh báo; cả hai đều mở đúng bài và tô sáng đúng dòng.

### WEB-05 · Cần sửa · Thiếu thẻ canonical theo nhóm chính

- **Căn cứ:** V2-13i ("`canonical` theo `primaryGroup`"); QĐ-053 (4) (Nhóm chính quyết định đường dẫn; vẫn giữ "Hiện thêm ở nhóm").
- **Vị trí:** `Views/BaiHuongDanRuiRo.cshtml`, `Views/BaiDocChuyenDe.cshtml`, view Bài đọc thêm, `Views/CanhBao.cshtml`. Hiện không view nào của gói xuất `<link rel="canonical">`.
- **Cách sửa:**
  - Bài viết: xuất `<link rel="canonical">` theo đường dẫn tính từ `primaryGroup` (`/cac-rui-ro/<nhóm chính>/<tên bài>/`), có tính đến `seoBase.canonicalUrl` nếu biên tập viên đã nhập.
  - Cảnh báo: dùng `/cac-rui-ro/canh-bao-moi/<tên>/`.
  - Dùng chung partial SEO nếu đã có (`_SelfCheckSeo.cshtml` là mẫu).
- **Kiểm chứng:** bài có "Hiện thêm ở nhóm" khác nhóm chính; mở theo cả hai đường dẫn, canonical đều trỏ về nhóm chính.

### WEB-06 · Cần sửa · Tính "hôm nay" theo giờ máy chủ

- **Căn cứ:** như BO-05.
- **Vị trí:** `Views/CanhBao.cshtml:69`, `Views/CanhBaoMoi.cshtml:9`, `Views/NhomRuiRo.cshtml:10`.
- **Cách sửa:** dùng hàm "hôm nay theo giờ Việt Nam" ở BO-05 (inject `TimeProvider` vào view), không dùng `DateTime.Today`.

### WEB-07 · Cần sửa · Quét toàn bộ cây nội dung ở mỗi lần mở trang

- **Căn cứ:** V2-03c (lưu đệm kết quả); `CLAUDE.md` › Nguyên tắc.
- **Vị trí:** `Models/RiskAlertContent.cs:50`, `:54`, `:163`, `:166`, `:223`, `:259` (mỗi chỗ một lần `site.Descendants()`).
- **Cách sửa:**
  - Lấy kênh, đối tượng, thủ đoạn, đoạn dùng chung, danh sách kiểm tra theo khóa thư mục bằng `IDocumentNavigationQueryService.TryGetChildrenKeysOfType`, như hàm `Alerts()` đang làm. Khóa thư mục lấy từ `PortalV2Keys.Node(...)`.
  - Kết hợp với bộ đệm ở BO-10.
- **Kiểm chứng:** mỗi trang nhóm và Cảnh báo mới không gọi `Descendants()`.

### WEB-08 · Cần sửa · Ảnh minh họa mới cũng không có trên máy khác

- **Căn cứ:** như BO-02 (QĐ-052).
- **Vị trí:** `uSync/v18/Media/ld.config`, `cbm.config`, `bhtk.config`, `dlcn.config`, `dtu.config`, `hdd-1.config`, `vayno.config`, trỏ tới `/media/<mã>/*.jpeg`. File ảnh gốc không có trong repo.
- **Cách sửa:** đưa 7 ảnh gốc vào `wwwroot/assets/img/risks/` và thêm vào danh sách của bước nạp ảnh ở BO-02. Phối hợp với người làm BO-02 để chỉ có một bước nạp ảnh.
- **Kiểm chứng:** máy sạch: ảnh lớn của Cảnh báo mới và 5 nhóm hiện đủ.

### WEB-09 · Cần sửa · Màu không lấy từ `tokens.css`

- **Căn cứ:** `CLAUDE.md` › Quy ước › Frontend ("Màu, cỡ chữ, khoảng cách lấy từ biến trong `wwwroot/assets/css/tokens.css`").
- **Vị trí:** `wwwroot/assets/css/risk-alerts.css:3-10` và các chỗ khác (27 mã hex).
- **Cách sửa:** thay bộ biến `--rk-*` bằng biến có sẵn trong `tokens.css`. Màu nào bản dựng v2 có mà `tokens.css` chưa có thì thêm vào `tokens.css`, không khai báo riêng trong file gói. Cỡ chữ dùng `rem`.
- **Kiểm chứng:** `grep "#[0-9a-fA-F]\{3,6\}" risk-alerts.css` không còn kết quả; ảnh chụp 1440/744/390 px không đổi màu so với bản dựng.

### WEB-10 · Cần sửa · Mã lọc Đối tượng sinh từ tên

- **Căn cứ:** V2-13h (lọc qua `?kenh=`, `?doi-tuong=`, `?muc-do=` "theo code"; "bộ lọc giữ được qua địa chỉ").
- **Vị trí:** `Models/RiskAlertContent.cs:92` (`AudienceCode` = tên bỏ dấu).
- **Hiện trạng:** đổi tên một đối tượng thì các địa chỉ lọc đã chia sẻ không lọc được nữa.
- **Cách sửa:**
  - Thêm trường `code` cho `audienceItem` như `channelItem` đang có: sửa trong backoffice, commit uSync, điền mã cho 5 đối tượng mẫu, báo người điều phối cập nhật Phụ lục A.
  - `AudienceCode` đọc `code`; chỉ khi trống mới dùng tên bỏ dấu.
- **Kiểm chứng:** đổi tên một đối tượng; địa chỉ `?doi-tuong=<mã>` cũ vẫn lọc đúng.

### WEB-11 · Cần sửa · Chặn chuỗi số rộng hơn tài liệu

- **Căn cứ:** V2-13h ("ô tìm (chặn chuỗi toàn chữ số từ 6 ký tự)").
- **Vị trí:** `PortalV2/RuiRo/AlertList.cs:43-44` (`HasLongDigits`).
- **Hiện trạng:** chặn mọi cụm từ 6 chữ số trở lên ở bất kỳ chỗ nào, nên "lừa 100000 đồng" cũng bị chặn.
- **Cách sửa:** chỉ chặn khi cả chuỗi, sau khi bỏ dấu cách, dấu chấm và gạch ngang, chỉ gồm chữ số và dài từ 6 ký tự trở lên.
- **Kiểm chứng:** test trong `AlertListTests`:
  - "0912345678" và "0912 345 678" bị chặn;
  - "lừa 100000 đồng" không bị chặn;
  - "12345" không bị chặn.

### WEB-12 · Cần sửa · Xuất thẳng HTML của trình soạn thảo

- **Căn cứ:** `CLAUDE.md` › Nguyên tắc (bảo mật); repo đã có `ArticleHtmlSanitizer` (có test `ArticleHtmlSanitizerTests`).
- **Vị trí:** `Views/BaiHuongDanRuiRo.cshtml:137` (`Html.Raw(summary)`); `Models/RiskAlertContent.cs` (`SignHtml`).
- **Cách sửa:** cho nội dung soạn thảo (`summary`, `readingBody`, `signText`) qua `ArticleHtmlSanitizer` trước khi xuất.
- **Kiểm chứng:** test: `summary` chứa `<script>` hoặc `onerror=` bị loại khi hiển thị.

---

## C. Ngoài gói, nhưng làm bộ test đang lỗi

### NG-01 · Cần sửa · Thiếu danh mục cố định "Loại lựa chọn trình hỏi"

- **Căn cứ:** QĐ-056 › Ảnh hưởng ("thêm danh sách cố định Loại lựa chọn trình hỏi").
- **Vị trí:** `Umbraco.Plugin.Custom.Core/PortalV2/DanhMuc/DanhMucCoDinh.cs`. Seed `docs/ban-giao/PORTAL-V2/cong-cu/seed-portal-v2.json` đã có `fixedLists["Danh mục · Loại lựa chọn trình hỏi"]` (từ commit 106a87fd).
- **Cách sửa:** thêm danh sách vào `DanhMucCoDinh.All`, đúng tên data type, mã và nhãn như seed. Thêm data type tương ứng vào uSync.
- **Người làm:** người phụ trách gói Khẩn cấp.
- **Kiểm chứng:** `PortalV2FoundationTests.FixedLists_MatchSeedCodesAndLabels` qua.

---

## D. Đã xét, không phải sửa

- **Tên template** `NhomRuiRo`, `CanhBaoMoi`, `BaiHuongDanRuiRo` không theo alias document type: chấp nhận. Một template dùng cho 5 loại nhóm, và cách đặt tên giống template sẵn có `CanhBao`, `BaiDocChuyenDe` của AnVu29.
- **Bí mật và log:** không thấy mật khẩu, khóa, token hay chuỗi kết nối trong diff. Script Playwright đọc tài khoản từ biến môi trường. File sao lưu CSDL nằm trong `temp/risk-template-review/`, đã gitignore.
- **Phạm vi:** đúng V2-03a…V2-04b (backoffice) và V2-13h, V2-13i (website). Không thấy sửa ngoài phạm vi.

## Điều kiện đóng review

1. Tất cả mục BO-xx, WEB-xx, NG-01 đã sửa. Mỗi mục ghi trong `2-ban-giao.md` của gói: file đã sửa, lệnh kiểm chứng, kết quả.
2. `dotnet test` toàn bộ: 0 lỗi.
3. `.\run-local.ps1 -Reset` khởi động sạch; mở `/cac-rui-ro/` (chuyển hướng 301), `/cac-rui-ro/canh-bao-moi/`, `/cac-rui-ro/lua-dao/`, một trang cảnh báo, một bài hướng dẫn ở 1440/744/390 px, không lỗi JavaScript.
4. Playwright `risk-management.smoke.cjs`, `risk-editor-appearance.smoke.cjs` chạy lại trên host riêng 11123 sau khi đã sửa, vẫn qua. Ngày 10/11/2026, trước khi sửa, cả hai đã qua.
