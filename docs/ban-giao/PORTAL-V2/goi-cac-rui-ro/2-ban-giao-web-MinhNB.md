# Bàn giao gói Các rủi ro

## 2026-11-10 · Sửa theo review 10/11/2026, phần website (MinhNB)

Phạm vi: các mục WEB-01 đến WEB-12 của review `e0fa5914`. Không sửa mục BO-xx và NG-01. Ở những chỗ phụ thuộc phần BO, phần website đã làm xong; việc còn lại ghi ở mục "Còn treo".

### Kiểm chứng chung

| Lệnh | Kết quả |
|---|---|
| `dotnet build Umbraco.Web.UI/Umbraco.Web.UI.csproj` | Build thành công |
| `dotnet test Umbraco.Plugin.Custom.Tests/Umbraco.Plugin.Custom.Tests.csproj` | 524 qua, 2 lỗi / 526. Hai test lỗi là `PortalV2FoundationTests.FixedLists_MatchSeedCodesAndLabels` (NG-01) và `ContestAdministrationFullHostTests.RealUmbracoLogin_…` (BO-01); review đã ghi cả hai từ trước |
| `run-local` rồi mở `/cac-rui-ro/canh-bao-moi/`, 5 trang nhóm, 1 cảnh báo, 1 bài hướng dẫn trong Chrome headless (1440, 744, 390 px) | Không có lỗi JavaScript |

Chưa chạy `run-local -Reset`, chưa chạy Playwright trên host 11123.

### Từng mục

| Mục | Đã sửa | File | Kiểm chứng |
|---|---|---|---|
| WEB-01 | Thẻ trang nhóm và "Bài liên quan" của Cảnh báo lấy từ `RuiRoDerivation.Derive`; `RiskAlertContent` chỉ đổi kết quả sang thẻ và liên kết. Dữ liệu vào là `RiskNode` dựng từ nội dung đã xuất bản (`RiskSnapshot`), cùng dạng giá trị với `catalog` của backoffice. Thời gian đọc dùng một hàm chung `AlertList.ReadingMinutes`, theo `minutes()` của bản dựng v2 (180 từ/phút, làm tròn); riêng Cảnh báo đếm văn bản hai lần như v2 (`AlertReadingMinutes`). `RuiRoDerivation` dùng hàm này thay cho 200 từ/phút | `Models/RiskSnapshot.cs` (mới), `Models/RiskAlertContent.cs`, `PortalV2/RuiRo/RuiRoDerivation.cs`, `PortalV2/RuiRo/AlertList.cs`, `Views/NhomRuiRo.cshtml`, `Views/CanhBao.cshtml`, `Views/BaiHuongDanRuiRo.cshtml` | So số thẻ của 5 trang nhóm với `POST /antc/risks/{nhóm}/derive`: Lừa đảo 8 bài + 17 thủ đoạn + 6 cảnh báo + 4 việc = 35 thẻ, bằng nhau; Vay và nợ 11, Đầu tư 11, Bảo hiểm và tiết kiệm 8, Dữ liệu cá nhân 0 (có dòng "đang biên soạn") đều khớp. Test `ReadingMinutes_UseTheSharedV2Formula`, `Reading_time_is_180_words_per_minute_like_the_v2_build` |
| WEB-02 | Đọc `noAnswerNote`, `noAdviceNote`, `mustRemember` từ nút `siteSettings` ở gốc cây (alias theo Phụ lục A); ô trống hoặc chưa có nút thì dùng câu trong code. Partial `_RiskAsk` nhận câu qua model | `Models/RiskAlertContent.cs` (`FixedText`), `Views/NhomRuiRo.cshtml`, `Views/CanhBaoMoi.cshtml`, `Views/CanhBao.cshtml`, `Views/Partials/_RiskAsk.cshtml` | Chưa kiểm được việc sửa câu trong backoffice: xem "Còn treo" |
| WEB-03 | Gỡ `rememberLine`, `mustAsk` khỏi `riskArticlePage` (`RiskSchema.cs` và loại trang trong CSDL; uSync đã xuất lại). Giá trị trên 6 bài hướng dẫn đã chuyển sang chuyên đề của bài; chuyên đề 1, 8 và `stopWhen`, `holdWhen` của cả 8 chuyên đề lấy từ `cong-cu/seed-portal-v2.json`. View lấy 4 trường từ chuyên đề; "Khi nào phải dừng / Khi nào cần hoãn để kiểm chứng" hiện ở mục Dấu hiệu | `PortalV2/Schema/RiskSchema.cs`, `uSync/v18/ContentTypes/riskarticlepage.config`, 8 file uSync chuyên đề, 6 file uSync bài hướng dẫn, `Views/BaiHuongDanRuiRo.cshtml`, `risk-alerts.css` | Trang "Cuộc gọi, tin nhắn…" hiện "Nhớ một câu" của Chuyên đề 7 và hai khối dừng/hoãn |
| WEB-04 | Mọi liên kết thủ đoạn dùng `?thu-doan=<mã>#tactic-<khóa>` (`RiskAlertContent.TacticUrl`). Bài hướng dẫn đọc `thu-doan` ở máy chủ, dòng khớp có class `is-hit` và `aria-current="true"`; mã không khớp thì bỏ qua | `Models/RiskAlertContent.cs`, `Views/BaiHuongDanRuiRo.cshtml`, `risk-alerts.css` | 31 liên kết thủ đoạn trên 4 trang nhóm đều có dạng mới; mở một liên kết thì đúng dòng được tô; `?thu-doan=khong-co` không tô dòng nào |
| WEB-05 | Bộ SEO dùng chung (`SelfCheckSeoBuilder`) nhận mọi `riskArticlePage` và `alertPage`: canonical lấy `canonicalUrl` nếu có, không thì đường dẫn theo Nhóm chính (bài viết) hoặc `/cac-rui-ro/canh-bao-moi/<tên>/` (cảnh báo). Bài viết chỉ mở được theo Nhóm chính (đường dẫn nhóm khác trả 404, `AntcPublicRouting`), nên mỗi bài chỉ có một địa chỉ | `Rendering/SelfCheckSeo.cs` | Bài hướng dẫn và cảnh báo có `<link rel="canonical">` đúng. Dữ liệu chưa có Bài đọc thêm nên chưa kiểm loại này |
| WEB-06 | Thêm `AlertFreshness.Today(TimeProvider)` (giờ Việt Nam); 3 view dùng hàm này qua `@inject TimeProvider` | `PortalV2/RuiRo/RuiRoDerivation.cs`, `Views/CanhBao.cshtml`, `Views/CanhBaoMoi.cshtml`, `Views/NhomRuiRo.cshtml` | Test `Today_IsVietnamDate_NotServerDate` (23:30 UTC ngày 4/11 là ngày 5/11) |
| WEB-07 | Không còn `Descendants()` trong `RiskAlertContent` và các view của gói; dữ liệu đọc theo khóa thư mục bằng `TryGetChildrenKeysOfType` (`PortalV2Keys.Node("f-tac")`, `"f-aud"`, `"f-ch"`, `"f-snip"`, `RiskStructure.*FolderKey`, `ActionFolderMigration.FolderKey`; thư mục Danh sách kiểm tra theo khóa uSync) | `Models/RiskSnapshot.cs`, `Models/RiskAlertContent.cs`, các view của gói | `grep Descendants` trong các file trên không còn kết quả |
| WEB-08 | Chép 7 ảnh gốc vào `wwwroot/assets/img/risks/`, giữ tên file như trong uSync Media: `ld.jpeg`, `cbm.jpeg`, `bhtk.jpeg`, `dlcn.jpeg`, `dtu.jpeg`, `hdd.jpeg` (mục `hdd-1`), `vayno.jpeg` | 7 file ảnh | Chưa kiểm trên máy sạch vì chưa có bước nạp ảnh (BO-02) |
| WEB-09 | Thêm bảng màu bản dựng v2 vào `tokens.css` (nhóm `--v2-*`); `risk-alerts.css` bỏ bộ biến `--rk-*` và mọi mã hex | `tokens.css`, `risk-alerts.css` | `grep "#[0-9a-fA-F]\{3,6\}" risk-alerts.css` không còn kết quả; ảnh chụp trang nhóm, cảnh báo, bài hướng dẫn giữ màu cũ |
| WEB-10 | `AudienceCode` đọc trường `code`, trống mới dùng tên bỏ dấu. `audienceItem` đã có `code` qua composition `taxonomyBase`, 5 đối tượng mẫu đã có mã, nên không cần sửa schema hay Phụ lục A | `Models/RiskAlertContent.cs` | Bộ lọc Đối tượng dùng `cong-nhan`, `tieu-thuong`… |
| WEB-11 | Chỉ chặn khi cả chuỗi (bỏ dấu cách, chấm, gạch ngang) là chữ số và dài từ 6 ký tự; sửa cả JS lọc tại chỗ | `PortalV2/RuiRo/AlertList.cs`, `wwwroot/assets/js/risk-alerts.js`, `AlertListTests.cs` | Test: "0912345678", "0912 345 678" bị chặn; "lừa 100000 đồng", "12345" không bị chặn |
| WEB-12 | `summary` của Bài hướng dẫn, `signText` của dấu hiệu (Cảnh báo) và thân "Bộ khung nhận diện" qua `ArticleHtmlSanitizer` trước khi xuất. `readingBody` không xuất ở view nào của gói | `Views/BaiHuongDanRuiRo.cshtml`, `Views/CanhBao.cshtml`, `Views/NhomRuiRo.cshtml`, `Models/RiskAlertContent.cs` | Test `EditorHtml_IsSanitizedBeforeOutput` |

### Thay đổi đụng phần dùng chung (báo người làm BO)

- `RuiRoDerivation.Derive` bỏ thủ đoạn tắt "Đang dùng" (`isActive = 0`). Lý do: website cũ đã bỏ các thủ đoạn này, và trang nhóm phải ra cùng kết quả với khung "Website tự lấy". Khung xem trước trong backoffice cũng đổi theo. Có test `InactiveTactics_AreLeftOutOfGroupAndGuide`.
- `RuiRoDerivation.Derive` tính thời gian đọc bằng `AlertList.ReadingMinutes`.
- `AlertFreshness.Today` được thêm vào chỗ cũ (`RuiRoDerivation.cs`); BO-12 chuyển lớp sang `PortalV2/Alerts/AlertFreshness.cs` thì mang theo hàm này. BO-05 dùng lại hàm này cho `RiskContentRules` và `AlertAutoUnpublishJob`.

### Còn treo

- **WEB-02**: chưa có loại trang `siteSettings` (V2-02a, "Chờ I-01"), nên chưa thêm được nội dung uSync của Cài đặt website và chưa kiểm được việc sửa câu trong backoffice. Hai câu "Mẫu trình bày" và hộp "Chưa chuyển tiền cho tới khi đã kiểm chứng" chưa có alias ở Phụ lục A; cần người điều phối chốt alias rồi thêm trường khi dựng V2-02a.
- **WEB-01, WEB-07**: chưa có bộ đệm của BO-10; `RiskSnapshot.Read` dựng lại danh sách ở mỗi lần mở trang (đọc theo thư mục, không quét cả cây). Khi có BO-10 thì thay chỗ dựng bằng bộ đệm (đã ghi TODO trong file).
- **WEB-08**: cần bước nạp ảnh của BO-02 nạp thêm 7 ảnh trên vào đúng mục Media có khóa trong uSync.
- Khối "Khi phải dừng / Khi cần hoãn": phần "Làm ngay" lấy từ `checklistPage.stopNow`, `holdNow`, nhưng loại trang Danh sách kiểm tra chưa có hai trường này (seed đã có), nên khối mới hiện phần "Khi nào".
- Địa chỉ lọc cũ theo tên đối tượng bỏ dấu (ví dụ `?doi-tuong=cong-nhan-nguoi-lao-dong`) nay được coi là "Tất cả", vì mã thật là `cong-nhan`.

## 2026-11-10 · Chỉnh giao diện và nội dung theo bản chính thức 10/11/2026 (MinhNB)

Nguồn đối chiếu: `antoantaichinh-day-du-10-11-2026` (khách đã duyệt; `index.html`, `nguon/src/app.js`, `img/`).

### Lựa chọn của người dùng trong phiên (cần người điều phối ghi QĐ nếu đồng ý)

- Ẩn nhãn nguồn của cảnh báo chỉ trên giao diện: thẻ và trang chi tiết ghi "Cảnh báo"; bỏ "Mẫu trình bày", khối "Nguồn cảnh báo". Trường `issuingAgency`, `documentNumber`, `documentDate`, `documentUrl`, `showSampleNote` giữ trong backoffice.
- Đổi chữ "Cảnh báo mới" thành "CẢNH BÁO", "Các rủi ro" thành "RỦI RO" trên trang; giữ đường dẫn `/cac-rui-ro/canh-bao-moi/`.
- Danh sách bài trong tab nhóm: giữ luật tự lấy (WEB-01), không đổi `RuiRoDerivation`; chênh lệch với HTML ghi ở dưới để bên BO chốt cách gắn bài.

### Đã làm

- Hỏi – Đáp: bỏ ảnh lớn đầu trang, ba bước gửi câu hỏi xếp ba cột từ 768px, bỏ "Duyệt bởi", bỏ ghi chú "Bản dựng thử", câu lưu ý tệp đính kèm theo bản mới; cỡ chữ, màu theo `--v2-*`.
- Rủi ro: ảnh vuông nhỏ cạnh tiêu đề thay ảnh lớn; thứ tự tab theo HTML (đặt trong `RiskAlertContent.Tabs`, không đổi `RiskStructure`); "Ngày đăng"; "Đọc thêm" thay "Nguồn" ở bài hướng dẫn, bỏ dòng thẩm định; ô tìm "việc làm trên mạng"; câu "Không thấy câu trả lời?" mới.
- Nội dung: 10 cảnh báo (tóm tắt, kịch bản, ngày 10/11/2026, xóa "[Tên cơ quan]"), 2 câu hỏi đáp nhanh ("đường dẫn"), tên thủ đoạn "Bắt cóc trực tuyến…", tiêu đề, đoạn dẫn trang Cảnh báo. Câu hỏi đáp 3 giữ "phần kiểm tra nhanh" theo QĐ-050 (HTML ghi "công cụ").
- Ảnh: gán ảnh của HTML cho trang Cảnh báo, 5 trang nhóm (`img-18`, `img-05`…`img-09`) và 10 cảnh báo (theo `ALIMG`). Ảnh cũ để nguyên trong Media.
- Xóa (vào thùng rác) cảnh báo rỗng "Cảnh báo" (`58aaf7ff-0544-420e-9c53-36e5630103dd`).

### Còn treo

- **Ảnh trên máy khác**: `wwwroot/media/` không commit; bước nạp ảnh BO-02 cần nạp thêm 16 ảnh trên (6 ảnh tiêu đề, 10 ảnh cảnh báo) vào đúng mục Media có khóa trong uSync.
- **Danh sách bài từng tab khác HTML** (lấy ngày 10/11/2026, HTML liệt kê đủ sau "Xem thêm"; portal là kết quả luật tự lấy). 10 "Bài đọc thêm" chưa có nội dung trong portal:
- **Lừa đảo** (HTML 33 bài, portal 35 bài)
  - Chỉ có trong HTML: Bài đọc thêm: Ai cũng có thể trở thành nạn nhân của lừa đảo tài chính; Bài đọc thêm: Vì sao nhiều người vẫn mắc bẫy lừa đảo và cách dừng lại đúng lúc; Bài đọc thêm: Những chiêu lừa kinh điển vẫn còn hiệu quả; Bài đọc thêm: Những thủ đoạn lừa đảo trong kỷ nguyên số; Bài đọc thêm: Khi kẻ lừa đảo dùng AI để giả hình ảnh, giọng nói (deepfake); Bài đọc thêm: Sau cú lừa: 72 giờ vàng để giảm thiệt hại và bảo vệ bản thân; Bài đọc thêm: Thế giới đang chống lừa đảo tài chính ra sao?
  - Chỉ có trong portal: Cảnh báo: Giả người mua, người giao hàng để chiếm tài khoản của người bán; Cảnh báo: Cuộc gọi video giả người thân, nhắn cần tiền gấp và dặn đừng hỏi ai; Cảnh báo: Chuyển nhầm tiền vào tài khoản, kèm mã QR hoặc đường dẫn để hoàn lại; Cảnh báo: Tin nhắn mạo danh ngân hàng chen vào luồng tin thật, báo tài khoản sắp bị khóa; Cảnh báo: Nhiệm vụ trực tuyến trả hoa hồng vài lần đầu rồi bắt nạp thêm; Cảnh báo: Ứng dụng giả mạo dịch vụ công dụ người dân cài đặt; Việc cần làm ngay: Người khác đang có quyền vào tài khoản hoặc điện thoại của bạn; Việc cần làm ngay: Tiền đã đưa đi nhưng không lấy lại được, hoặc hợp đồng phát sinh vấn đề; Việc cần làm ngay: Có người đang thúc bạn làm ngay — bạn chưa đưa gì
- **Vay và nợ** (HTML 9 bài, portal 11 bài)
  - Chỉ có trong HTML: Bài đọc thêm: Chữ ký của bạn có ý nghĩa gì trước pháp luật?
  - Chỉ có trong portal: Cảnh báo: Gọi điện báo có khoản vay quá hạn mang tên bạn, đòi chuyển tiền để “tất toán”; Việc cần làm ngay: Giấy tờ, chữ ký hoặc tên của bạn đã được gửi đi, hoặc bị người khác dùng; Việc cần làm ngay: Tiền đã đưa đi nhưng không lấy lại được, hoặc hợp đồng phát sinh vấn đề
- **Đầu tư** (HTML 10 bài, portal 11 bài)
  - Chỉ có trong HTML: Bài đọc thêm: Hợp pháp mà vẫn mất tiền – Vùng xám của rủi ro tài chính; Bài đọc thêm: Vì sao bị mất tiền nhưng không phải vụ nào cũng là lừa đảo?
  - Chỉ có trong portal: Cảnh báo: Giới thiệu hợp đồng bảo hiểm như một khoản gửi tiết kiệm lãi cao; Cảnh báo: Mời góp vốn qua ứng dụng, cam kết lợi nhuận cố định; Việc cần làm ngay: Có người mời bạn góp vốn, đầu tư, làm ăn hoặc mời việc làm
- **Bảo hiểm và tiết kiệm** (HTML 10 bài, portal 8 bài)
  - Chỉ có trong HTML: Thủ đoạn: Khấu trừ khi giải ngân: hồ sơ ghi một số, thực nhận một số khác; Bài đọc thêm: Hợp pháp mà vẫn mất tiền – Vùng xám của rủi ro tài chính; Bài đọc thêm: Chữ ký của bạn có ý nghĩa gì trước pháp luật?
  - Chỉ có trong portal: Việc cần làm ngay: Tiền đã đưa đi nhưng không lấy lại được, hoặc hợp đồng phát sinh vấn đề
- **Dữ liệu cá nhân** (HTML 21 bài, portal 0 bài)
  - Chỉ có trong HTML: Cảnh báo: Ứng dụng giả mạo dịch vụ công dụ người dân cài đặt; Cảnh báo: Tin nhắn mạo danh ngân hàng chen vào luồng tin thật, báo tài khoản sắp bị khóa; Cảnh báo: Gọi điện báo có khoản vay quá hạn mang tên bạn, đòi chuyển tiền để “tất toán”; Cảnh báo: Cuộc gọi video giả người thân, nhắn cần tiền gấp và dặn đừng hỏi ai; Cảnh báo: Giả người mua, người giao hàng để chiếm tài khoản của người bán; Bài đọc chuyên đề: Cuộc gọi, tin nhắn, đường dẫn và giả mạo; Việc cần làm ngay: Người khác đang có quyền vào tài khoản hoặc điện thoại của bạn; Việc cần làm ngay: Giấy tờ, chữ ký hoặc tên của bạn đã được gửi đi, hoặc bị người khác dùng; Thủ đoạn: Ứng dụng vay nhanh đòi quyền vào danh bạ, hình ảnh, tin nhắn; Thủ đoạn: Nhờ bạn đứng tên vay hộ hoặc bảo lãnh cho người chỉ quen qua mạng; Thủ đoạn: Bị đòi một khoản vay mang tên mình mà mình chưa từng vay; Thủ đoạn: Giữ bản chính bằng cấp, giấy tờ tùy thân của người xin việc; Thủ đoạn: Dụ mở, cho mượn, cho thuê hoặc bán tài khoản ngân hàng, SIM; nhờ nhận và chuyển tiền hộ; Thủ đoạn: Bảo cài ứng dụng tuyển việc từ đường dẫn lạ, xin quyền trợ năng; Thủ đoạn: Ghép hình ảnh, giọng nói người thân trong cuộc gọi video; Thủ đoạn: Tin nhắn giả chen vào đúng luồng tin thật của ngân hàng; Thủ đoạn: Chiếm tài khoản mạng xã hội rồi giả người quen hỏi vay tiền; Thủ đoạn: Dụ chia sẻ màn hình hoặc cài công cụ điều khiển máy từ xa; Bài đọc thêm: Khi kẻ lừa đảo dùng AI để giả hình ảnh, giọng nói (deepfake); Bài đọc thêm: Sau cú lừa: 72 giờ vàng để giảm thiệt hại và bảo vệ bản thân
- Ảnh đầu trang 6 bài hướng dẫn (`img-10`…`img-15`) và thanh "KIẾN THỨC NỀN TẢNG" (portal chưa có trang thư viện) chưa làm.

### 2026-11-10 · Bài hướng dẫn (6 trang chuyên đề 2–7) theo `lvBody` của bản chính thức (MinhNB)

- `Views/BaiHuongDanRuiRo.cshtml` dựng lại theo đúng thứ tự và nội dung của `lvBody`:
  - **Tóm tắt**: bỏ đoạn tóm tắt.
  - **Dấu hiệu**: chỉ còn khung "Cần hoãn lại để kiểm chứng khi".
  - **Kịch bản**: thêm mục đầu của bài đọc và bảng "Vì sao người cẩn thận vẫn quyết định sai"; bỏ danh sách `scenarios`.
  - **Việc cần làm ngay**: thêm "Chuyện đang xảy ra ngay lúc này?", "Khi phải dừng", "Khi cần hoãn", "Nếu đã lỡ" và khung "Cảnh giác với người hứa lấy lại tiền".
  - **Bài liên quan**: thêm liên kết Công cụ, thêm Bài đọc thêm.
  - **Đọc thêm**: bài đọc chuyên đề, "Thử 1 câu" (trỏ `/thu-suc/`), ngày rà soát.
- `Models/RiskReadingParts.cs` (mới) dùng AngleSharp để lấy các khối trên từ `readingBody` của bài đọc chuyên đề. Chỉ lấy chữ thuần, không lấy HTML. Bài nào thiếu khối thì khối đó không hiện.
- Thời gian đọc tính trên chữ của toàn trang, như `minutes(L.body)` của bản dựng.
- CSS mới trong `risk-alerts.css`: `.risk-cond`, `.risk-note--r`, `.risk-tblwrap`, `.risk-dtbl`.
- Nội dung:
  - `reviewDate` = 2026-11-10 cho 6 bài.
  - Danh sách kiểm tra `80ef5476…`: `title` đổi thành "…gửi đường dẫn". Tên nút và đường dẫn giữ nguyên.
- Còn khác bản HTML:
  1. Ảnh đầu bài (LVIMG) và ảnh thủ đoạn (TACIMG): `riskArticlePage` và `tacticItem` chưa có trường ảnh, cần sửa schema (BO).
  2. Các Bài đọc thêm: chưa có nội dung.
  3. Thứ tự chip "Kênh tiếp cận": do `Derive` quyết định (Andrew).
  4. Mức độ của lv2 và lv4: luật tự lấy cho "Cao", bản HTML luôn ghi "Rất cao" (Andrew).
  5. Thời gian đọc của lv3 và lv6: 6 phút so với 7 phút trong bản HTML. Phần chênh là chú thích ảnh và các Bài đọc thêm chưa có.
  6. "Thử 1 câu": `/thu-suc/` chưa có tham số để mở thẳng câu của từng chuyên đề.
- Bổ sung cùng ngày: trang bài hướng dẫn đã hiện ảnh đầu bài từ trường `illustration` và `illustrationAlt` (thuộc composition). Ảnh hiện sau phần đầu trang, kèm chú thích "Ảnh minh họa tạo bằng AI".
  - Đã gắn ảnh LVIMG theo bản HTML cho chuyên đề 6, 5, 3, 4, 2 (`img-11` đến `img-15`).
  - Chuyên đề 7 giữ ảnh do người dùng chọn trong backoffice. Ảnh đó đang là `img-14` (vay); bản HTML dùng `img-10`.
  - Mục 1 ở trên chỉ còn ảnh thủ đoạn (TACIMG).
- Bổ sung cùng ngày, **cần Andrew biết khi gộp code**: Thủ đoạn (`tacticItem`) có thêm trường `illustration` (Chọn ảnh) và `illustrationAlt` (Text 160).
  - Khai báo trong `PortalV2SchemaBuilder.EnsureRiskSchemaAsync`, ngay sau dòng `AddProperties("tacticItem", …containingArticle…)`. Chạy lúc khởi động và chỉ thêm khi thiếu.
  - uSync đã xuất `ContentTypes/tacticitem.config`.
  - Bài hướng dẫn hiện lưới ảnh `.risk-tgal` dưới "Thủ đoạn thường gặp", theo `.tgal` của bản HTML: 2 cột từ 768px; nếu chỉ có 1 ảnh thì rộng cả hàng.
  - Đã gắn ảnh TACIMG cho 6 thủ đoạn theo bản HTML: `img-36` đến `img-39` (chuyên đề 7), `img-40` (chuyên đề 5), `img-41` (chuyên đề 6).
  - Form Thủ đoạn ở backoffice có hai ô mới. Nếu BO muốn đặt chúng vào nhóm hoặc tab riêng thì chỉnh trong builder.
- Bổ sung cùng ngày (người dùng chọn "ưu tiên form bài, thiếu thì lấy bài đọc"):
  - Ô **Tóm tắt** của bài hướng dẫn là các đoạn đầu phần Kịch bản. Tiêu đề mục con vẫn lấy từ bài đọc, vì form chưa có ô cho tiêu đề này.
  - Ô **Việc cần làm ngay**: dòng 1 là nội dung khung "Chuyện đang xảy ra ngay lúc này?", dòng 2 là "Làm ngay" khi phải dừng.
  - Ô nào trống thì trang lấy từ bài đọc chuyên đề.
  - Đã chép đủ các đoạn (3 đến 5 đoạn) từ bài đọc vào ô Tóm tắt của 6 bài để trang vẫn khớp bản HTML.
  - Thứ tự "bài hướng dẫn khác" trong mục Bài liên quan do `Derive` quyết định. Ở lv7 thứ tự này ngược với bản HTML (Andrew).
- Bổ sung cùng ngày: tab **Dữ liệu cá nhân** trước đây trống, vì chưa bài viết nào gắn nhóm này. Bài hướng dẫn chuyên đề 7 (`02a6beb8`) và Bài đọc chuyên đề 7 (`db34048f`) đã được thêm `alsoInCategories` = Dữ liệu cá nhân, giống bản HTML (`tabs: … k==='7' ? ['du-lieu-ca-nhan']`).
  - Kết quả: tab có 15 thẻ; bản HTML có 21 thẻ.
  - Chênh lệch còn lại do luật tự lấy (Andrew):
    - Bản HTML đặt thêm thủ đoạn của chuyên đề khác vào tab qua `TACX`: vay nhanh đòi quyền danh bạ, đứng tên vay hộ, khoản vay mang tên mình, giữ bằng cấp, cho thuê tài khoản/SIM, cài ứng dụng tuyển việc. Luật hiện chỉ lấy thủ đoạn của bài hướng dẫn trong nhóm, nên tab còn dư "Bắt cóc trực tuyến", "Giả danh cơ quan…" và "Tâm linh, giải hạn".
    - Thiếu cảnh báo "Gọi điện báo có khoản vay quá hạn…".
    - Việc cần làm: bản HTML có "Giấy tờ, chữ ký… bị người khác dùng"; portal có "Có người đang thúc bạn làm ngay".
    - Câu "Bài riêng về … đang được biên soạn" theo `InPreparation` (không có bài nào có `primaryGroup` là nhóm này) nên hiện ở tab Dữ liệu cá nhân. Bản HTML chỉ hiện câu này ở tab Bảo hiểm và tiết kiệm.
