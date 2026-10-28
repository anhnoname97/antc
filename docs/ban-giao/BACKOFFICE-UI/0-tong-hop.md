# Làm mới giao diện trang quản trị (backoffice): tổng hợp

- Bắt đầu: 2026-10-27 · người làm: anhnn cùng Claude
- Trạng thái: **đang chạy thử việc sửa core Umbraco**. Chưa có quyết định nào được chốt, chưa ghi vào `docs/quyet-dinh.md`.
- Mục đích của file: ghi lại đã làm gì, đang dừng ở đâu, việc tiếp theo là gì.

## 1. Vì sao làm

Người dùng thấy backoffice khó dùng, nhợt nhạt, cũ kỹ. Kết quả review ngày 27/10 (chạy web local, duyệt từng trang):

**Ba nguyên nhân chính**
1. **Menu và nút nửa Anh nửa Việt**: `Content, Media, Settings…` lẫn với `Hỏi – Đáp`, `Quản lý cuộc thi`; nút `Save and publish`. Bản dịch đã có trong `App_Plugins/AntcVietnamese/vi.js`, khả năng cao tài khoản admin đang để ngôn ngữ English (chưa kiểm).
2. **Hai khu tự viết dùng hai phong cách khác nhau**: Quản lý cuộc thi dùng CSS tự viết (`contest-theme.js`, không dùng thành phần UUI); Hỏi – Đáp dùng UUI.
3. **Menu Quản lý cuộc thi xếp theo kỹ thuật**: 9 mục ngang hàng; tab "Lượt dự thi" trùng với trang "Lượt thi".

**Lỗi và điểm khó dùng cụ thể**
- Trang Thống kê câu hỏi: cột Chuyên đề luôn ghi "Không còn thông tin chuyên đề". Có thể là lỗi dữ liệu, cần điều tra riêng.
- Nút Xóa màu đỏ đặt sát nút Sửa ở mọi dòng.
- Ô ngày giờ hiện kiểu Mỹ (`10/01/2026 12:00 AM`), trong khi bảng dùng `dd/mm/yy`.
- Bảng có thanh cuộn riêng (`max-height: 66vh`), trang bị hai thanh cuộn.
- Form sửa cuộc thi báo "không thể đổi bộ đề" nhưng ô chọn chuyên đề vẫn bấm được.
- Câu chữ kỹ thuật lọt ra giao diện: "Hệ số thời gian đọc", tên bảng `draw_winner`.
- Bảng Lượt thi hiện đủ số điện thoại cho mọi người có quyền vào trang. Vấn đề bảo mật, cần chốt.

## 2. Mockup

Link: https://claude.ai/artifact/RB6DbyexCYqCPkasathNUb (đang ở chế độ riêng tư, muốn người khác xem thì chia sẻ qua menu Share).

11 màn: Đăng nhập, Tổng quan, Danh sách cuộc thi, Sửa cuộc thi, Quay số, Ngân hàng câu hỏi, Nội dung (soạn bài viết), Phương tiện, Hỏi – Đáp, Người dùng, Nhóm quyền. Có tweak đổi tông "Đỏ thương hiệu" (theo `tokens.css`) và "Xanh Umbraco". Bấm qua lại được giữa các màn.

Lưu ý:
- Mockup **vẽ tự do, chưa bám giới hạn của Umbraco**, và chưa đối chiếu với `docs/ke-hoach` hay `docs/quyet-dinh.md`.
- Số liệu và nội dung một phần là minh họa: tên cán bộ, câu hỏi của người dân, điểm trung bình, mục "Cần xử lý".
- Một số tính năng cần API mới: "Cần xử lý", "Hoạt động gần đây", tỉ lệ đúng trong bảng câu hỏi.

## 3. Làm được tới đâu

| Nhóm màn | Ai sở hữu giao diện | Cách làm |
|---|---|---|
| Cuộc thi, Quay số, Câu hỏi, Hỏi – Đáp | Code của nhóm (`App_Plugins/ContestManagement` ~1.200 dòng, `wwwroot/App_Plugins/AntcQuestions` ~870 dòng) | Viết lại bằng UUI, làm được đúng mockup |
| Màu, font, logo, ảnh đăng nhập | Umbraco cho tùy biến | Kiểu mở rộng `theme` (CSS biến UUI), cấu hình `LoginBackgroundImage`, `LoginLogoImage`, `BackOfficeLogo` |
| Thanh trên, menu trái, cây nội dung, trình soạn, Phương tiện, Người dùng, Nhóm quyền, bố cục đăng nhập | Core Umbraco | **Phải sửa core** để ra bố cục như mockup |

**File cần sửa trong core** (đường dẫn tính từ `src/ANTC.Portal.Core/src/Umbraco.Web.UI.Client/src/`):

| Màn | File | Số dòng |
|---|---|---|
| Thanh trên cùng | `apps/backoffice/components/backoffice-header.element.ts`, `backoffice-header-sections.element.ts` | 42 + 144 |
| Menu trái | `packages/core/section/section-sidebar/section-sidebar.element.ts` | 52 |
| Cây nội dung | `packages/core/tree/tree-item/tree-item.element.ts`, `packages/documents/documents/tree/tree-item/document-tree-item.element.ts` | 96 + 98 |
| Trình soạn nội dung | `packages/core/workspace/components/workspace-editor/workspace-editor.element.ts` (**dùng chung cho mọi màn sửa**), `packages/content/content/workspace/views/edit/content-editor.element.ts`, `property-layout.element.ts`, `workspace-footer.element.ts` | 322 + 292 + 177 + 98 |
| Phương tiện | `packages/media/media/collection/views/grid/media-grid-collection-view.element.ts` | 70 |
| Nhóm quyền | `packages/user/user-group/workspace/user-group/user-group-workspace-editor.element.ts` | 180 |
| Đăng nhập | `src/Umbraco.Web.UI.Login/src/components/layouts/auth-layout.element.ts`, `auth-styles.css` | – |

**Ước lượng thô** (một người, chưa có kết quả chạy thử đầy đủ):

| Việc | Thời gian |
|---|---|
| Chuẩn bị môi trường, chạy thử | 0,5–1 ngày |
| Thanh trên, menu, cây nội dung, đăng nhập | 4–6 ngày |
| Trình soạn nội dung hai cột | 4–6 ngày |
| Phương tiện, Người dùng, Nhóm quyền | 8–12 ngày |
| Cuộc thi, Hỏi – Đáp | 10–15 ngày |
| **Tổng** | **5–8 tuần** |

Chi phí lâu dài: mỗi lần nâng Umbraco phải gộp lại các chỗ đã sửa core. Quy ước đề xuất: mọi chỗ sửa core gắn chú thích `ANTC:` để tìm lại bằng `grep -rn "ANTC:" src/ANTC.Portal.Core`.

## 4. Chạy thử sửa core (27/10)

Mục tiêu: chứng minh quy trình "sửa core → build → đóng gói → App dùng được" chạy được trên máy này, và đo thời gian.

**Thay đổi thử**: đổi nền thanh trên cùng sang màu `#5c0f0b`, có gắn chú thích `ANTC:`:
- `src/ANTC.Portal.Core/src/Umbraco.Web.UI.Client/src/apps/backoffice/components/backoffice-header.element.ts`
- `src/ANTC.Portal.Core/src/Umbraco.Web.UI.Client/src/apps/backoffice/components/backoffice-header-sections.element.ts`

**Kết quả từng bước**

| Bước | Lệnh | Kết quả | Thời gian |
|---|---|---|---|
| Cài thư viện client của core | `npm ci` trong `Umbraco.Web.UI.Client` | Đạt. Cảnh báo `EBADENGINE`: client yêu cầu Node ≥ 24.13 và npm ≥ 11, máy có Node 22.19 và npm 10.9. Không chặn | ~4 phút |
| Build backoffice bằng tay | `npm run build:for:cms` | Đạt, màu mới có trong file đầu ra | ~10 phút |
| Đóng gói core | `core_build.ps1` (không kèm `-BuildSpa`) | Báo đạt, **nhưng gói `Umbraco.Cms.StaticAssets` mất toàn bộ backoffice**: 35 file thay vì 2.596 | ~5,6 phút |
| Đóng gói lại đúng cách | `core_build.ps1 -BuildSpa` | **Gói đạt**: `StaticAssets` có 2.591 file (2.556 file backoffice), file thanh trên cùng có màu mới. Script dừng ở bước dọn bộ nhớ đệm NuGet vì tiến trình MSBuild chạy ngầm còn khóa `umbraco.cms.targets`. Đã xử lý bằng `dotnet build-server shutdown` rồi xóa tay 3 gói còn lại | ~20 phút |
| Chạy web xem kết quả | Tắt web cũ rồi `.\run-local.ps1` | **Đạt**: chụp bằng Playwright thấy thanh trên cùng màu đỏ đô. Phát hiện **logo bị vỡ**: 5 file `umbraco/assets` (`login.jpg`, `logo*.svg`) không có trong mã nguồn vì `src/ANTC.Portal.Core/.gitignore` dòng 72 bỏ qua thư mục này | – |
| Khôi phục logo rồi đóng gói lại | Lấy 5 file từ gói gốc vào `src/Umbraco.Cms.StaticAssets/wwwroot/umbraco/assets`, đưa vào git bằng `git add -f`, chạy `core_build.ps1 -BuildSpa` | **Treo** sau nhiều giờ ở bước `dotnet pack`. Đã dừng, trả `src/ANTC.Portal.Lib/Build.Core` về bản gốc trong git. **Để làm sau** | – |

**Bài học**
- **Không build backoffice bằng tay rồi mới đóng gói.** Khi thư mục `wwwroot/umbraco/backoffice` đã có sẵn, MSBuild bỏ qua cả bước build lẫn bước khai báo file vào gói (`Umbraco.Cms.StaticAssets.csproj`, target `BuildStaticAssetsPreconditions` và `DefineBackofficeAssets`). Luôn dùng `core_build.ps1 -BuildSpa`.
- `core_build.ps1` xóa bộ nhớ đệm NuGet `umbraco.cms*`. Web đang chạy đọc file backoffice từ bộ nhớ đệm đó, nên sau khi đóng gói hỏng thì `/umbraco` trả 500. Lỗi trong log: `DirectoryNotFoundException …\umbraco.cms.staticassets\18.2.1-antc\staticwebassets\umbraco\backoffice\umbraco-package.json`.
- Phải **tắt web trước khi build App**, nếu không file DLL bị khóa (MSB3026).
- Chạy `dotnet build-server shutdown` trước `core_build.ps1`, nếu không tiến trình MSBuild của lần build trước khóa DLL trong bộ nhớ đệm và script dừng ở bước dọn đệm.
- Muốn sửa nhanh nên dùng chế độ dev của Vite (`npm run dev:server`). Cách này cần cấu hình `Umbraco:CMS:Security:BackOfficeHost` trong `appsettings.Local.json`, chưa thử.
- Bước build còn làm đổi các file sinh tự động: `mockServiceWorker.js` (3 chỗ), `known-keys.const.generated.ts`, `known-keys.types.generated.ts`.

## 5. Trạng thái máy anhnn lúc ghi file (chưa commit)

- Sửa core: 2 file header ở trên, cùng các file sinh tự động ở mục 4.
Cập nhật 28/10:
- Đã commit trên nhánh `docs/backoffice-ui`: 2 file header đã sửa (có chú thích `ANTC:`) và 5 file `umbraco/assets` (thêm bằng `git add -f`). **Chưa đóng gói**: các gói `src/ANTC.Portal.Lib/Build.Core/*.nupkg` vẫn là bản gốc, nên App dùng gói từ git sẽ chưa thấy màu mới.
- Máy anhnn: bộ nhớ đệm NuGet (`~/.nuget/packages/umbraco.cms*/18.2.1-antc`) đang giữ gói build thử (thanh đỏ đô, logo vỡ). Muốn quay về gói gốc thì xóa các thư mục đó rồi chạy `.\run-local.ps1`.
- Việc còn lại của chạy thử: đóng gói lại có đủ logo (`core_build.ps1 -BuildSpa`), tìm nguyên nhân lần đóng gói thứ ba bị treo.
- Thay đổi có sẵn từ trước của anhnn (không liên quan): `Views/*.cshtml`, `uSync/v18/Media/ảnh-hero-*.config`.

**Muốn bỏ chạy thử, quay về như cũ:**
```powershell
git checkout -- src/ANTC.Portal.Core src/ANTC.Portal.Lib/Build.Core
Remove-Item -Recurse -Force $env:USERPROFILE\.nuget\packages\umbraco.cms*\18.2.1-antc
# tắt web đang chạy, rồi:
.\run-local.ps1
```

## 5b. Kế hoạch cho đội dev (28/10)

- `Ke-hoach-lam-moi-backoffice.docx`: chuẩn giao diện, quy tắc UX, 11 ảnh mockup, quy trình sửa core, 27 task (BO-01 → BO-26, BO-10b) có sửa ở đâu, sửa như nào, tiêu chí đạt, cách kiểm; 10 điểm cần chốt.
- `anh/01-dang-nhap.png` → `anh/11-nhom-quyen.png`: ảnh mockup dựng từ file nguồn của canvas.

## 6. Việc tiếp theo

1. ~~Chờ `core_build.ps1 -BuildSpa` xong, kiểm gói~~: đã xong, gói đạt.
2. Tắt web (PID 8356), chạy `.\run-local.ps1`, mở `/umbraco` xem thanh trên đã đổi màu chưa.
3. Đánh giá: tổng thời gian một vòng sửa, có cần nâng Node lên 24, có nên dùng chế độ dev.
4. **Cần quyết định** (khi chốt thì ghi vào `docs/quyet-dinh.md`):
   - Có sửa core không, hay chỉ dùng theme và tiện ích mở rộng?
   - Nếu sửa core: phạm vi gồm những màn nào, và quy ước theo dõi chỗ sửa (chú thích `ANTC:` cộng một file danh sách).
   - Hướng giao diện cho khu tự viết: chuyển sang UUI, hay giữ theme riêng FE-30?
   - Che số điện thoại trong bảng Lượt thi.
5. Việc nhanh làm được ngay, không phụ thuộc quyết định trên: đổi ngôn ngữ tài khoản admin sang Tiếng Việt; điều tra lỗi "Không còn thông tin chuyên đề".
