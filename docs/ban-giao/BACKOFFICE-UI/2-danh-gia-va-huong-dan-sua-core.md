# Backoffice dễ dùng: đánh giá việc sửa core và hướng dẫn làm

- Ngày: 2026-10-28 · Áp dụng cho: BACKOFFICE-UI (QĐ-028 → QĐ-031)
- Yêu cầu của khách: **dễ dùng**. Nhiều tính năng của Umbraco khách không cần. Cần giao diện có **nút thao tác nhanh, dễ hiểu**.
- Mọi đường dẫn file core tính từ `src/ANTC.Portal.Core/src/Umbraco.Web.UI.Client/src/`.

## 1. Kết luận ngắn

1. **Sửa core làm được**, nhưng chỉ nên dùng cho phần bố cục, và sửa càng ít càng tốt.
2. **Khoảng 70–80% mục tiêu "dễ dùng" đạt được mà không sửa core**: ẩn bớt tính năng thừa, thêm màn "Thao tác nhanh", đổi màu và chữ, làm lại các khu tự viết.
3. Khi buộc phải sửa core, chỉ **thêm "móc"**: khe mở rộng, biến CSS, thuộc tính. Giao diện thật vẫn nằm trong `App_Plugins` của nhóm. Như vậy mỗi lần nâng Umbraco chỉ phải gộp vài dòng thay vì cả màn hình.
4. Thứ tự đề xuất: làm **Giai đoạn A (không sửa core)** trước, cho khách dùng thử, rồi mới quyết các chỗ sửa core ở **Giai đoạn B**.

## 2. Vì sao phần lớn không cần sửa core

Backoffice Umbraco 18 dựng từ các **extension có tên (alias)**: mỗi khu, nút thao tác, tab, ô thông tin, bảng tin là một extension. Nhóm có thể:

| Cách | Hàm / cấu hình | Ví dụ đã có trong repo |
|---|---|---|
| Tắt hẳn với mọi người | `registry.exclude(alias)` | `App_Plugins/AntcVietnamese/entrypoint.js` đang dùng để ẩn khu Cài đặt, Gói mở rộng, Dịch thuật (nhánh `be-01`) |
| Chỉ hiện cho một vai trò | `registry.appendCondition(alias, { alias: 'Umb.Condition.CurrentUser.IsAdmin' })` hoặc `Umb.Condition.CurrentUser.GroupId` (`oneOf`, `noneOf`) | Có trong core: `packages/user/current-user/conditions/` và `libs/extension-api/registry` |
| Thay bằng cái của mình | `overwrites: '<alias>'` trong `umbraco-package.json` | `AntcVietnamese` đã thay bảng tin `Umb.Dashboard.UmbracoNews` bằng trang hướng dẫn |
| Thêm mới | Các loại `dashboard`, `workspaceInfoApp`, `workspaceAction`, `entityAction`, `headerApp`, `collectionAction` | Core có sẵn 5–35 chỗ dùng mỗi loại (đã đếm) |
| Đổi màu, chữ | Biến CSS của UUI (`--uui-color-*`, `--uui-font-family`) | Task BO-02 |

## 3. Ba lớp làm, theo thứ tự ưu tiên

### Lớp 1: Ẩn bớt (không sửa core, khoảng 1 ngày)

Tạo một file cấu hình danh sách ẩn, đọc từ `appsettings.json` giống cách `be-01` làm với `Antc:Backoffice:Sections`. Đề xuất ẩn **với mọi người không phải quản trị viên**:

| Nhóm | Alias trong core | Lý do ẩn |
|---|---|---|
| Thao tác trên trang | `Umb.EntityAction.Document.CreateBlueprint`, `.CultureAndHostnames`, `.Notifications`, `.Rollback`, `.SortChildrenOf` | Khách không dùng mẫu nội dung, tên miền, thông báo; hoàn tác và sắp xếp để quản trị viên làm |
| Ô thông tin của trang | `Umb.WorkspaceInfoApp.Document.Links`, `.RedirectManagement`, `.References` | Thông tin kỹ thuật |
| Bảng tin kỹ thuật | `Umb.Dashboard.Telemetry`, `.ModelsBuilder`, `.Profiling`, `.ExamineManagement`, `.HealthCheck`, `.PublishedStatus`, `.RedirectManagement` | Chỉ dành cho kỹ thuật |
| Nút trên thanh trên cùng | `Umb.HeaderApp.Help` | Trỏ tới tài liệu tiếng Anh của Umbraco |
| Nút lưu | `Umb.WorkspaceAction.Document.SaveAndPreview` | Gộp vào "Xem trước" cho bớt nút |

Danh sách cuối cùng cần khách xác nhận. Quản trị viên vẫn thấy đủ để xử lý sự cố.

### Lớp 2: Thêm thao tác nhanh (không sửa core, khoảng 2–3 ngày)

**Màn "Thao tác nhanh"**: trang đầu tiên khi đăng nhập. Làm bằng `dashboard` thay `Umb.Dashboard.UmbracoNews` (thay luôn trang hướng dẫn hiện tại), mỗi nút một việc hay làm:

| Nút | Đi tới | Số đếm hiện trên nút |
|---|---|---|
| Viết bài cảnh báo | Tạo bài trong "Bài viết" | Số bài nháp của tôi |
| Trả lời Hỏi – Đáp | Hộp thư Hỏi – Đáp | Số câu mới |
| Tải ảnh lên | Phương tiện | Số ảnh thiếu mô tả |
| Cuộc thi đang chạy | Tổng quan cuộc thi | Số ngày còn lại |
| Quay số | Màn Quay số | Số giải còn suất |
| Sửa thông tin chung | Trang gốc "An toàn tài chính" | – |

Kèm theo:
- **"Kiểm tra trước khi xuất bản" (BO-19)**: làm bằng `workspaceInfoApp`, không sửa core. Việc **chặn xuất bản** (QĐ-031) làm phía máy chủ bằng C# trong `Umbraco.Plugin.Custom.Core`: bắt sự kiện xuất bản, thiếu mục bắt buộc thì hủy và trả thông báo tiếng Việt. Cũng không sửa core.
- **Nút tạo nhanh**: dùng `entityCreateOptionAction` để khi bấm "Tạo mới" chỉ hiện đúng loại cần thiết, có mô tả dễ hiểu.

### Lớp 3: Sửa core (chỉ bố cục, Giai đoạn B)

| Chỗ sửa | File core | Hiện trạng file | Cách sửa đề xuất | Rủi ro khi nâng Umbraco |
|---|---|---|---|---|
| Thanh trên cùng | `apps/backoffice/components/backoffice-header.element.ts` (42 dòng), `backoffice-header-sections.element.ts` (144 dòng) | Đã sửa thử màu, có 2 chỗ `ANTC:` | Chỉ đổi biến CSS và kiểu tab | Thấp |
| Chấm trạng thái trong cây | `packages/core/tree/tree-item/tree-item.element.ts` (96), `packages/documents/documents/tree/tree-item/document-tree-item.element.ts` (98) | Không mã màu cứng | Thêm một phần tử chấm đọc trạng thái có sẵn của trang | Thấp |
| Trình soạn có cột phải | `packages/core/workspace/components/workspace-editor/workspace-editor.element.ts` (322, **dùng chung mọi màn sửa**), `packages/content/content/workspace/views/edit/content-editor.element.ts` (292) | Dùng biến CSS, không mã màu cứng | **Chỉ thêm một khe** (`umb-extension-slot`) cho cột phải khi đang sửa tài liệu; nội dung cột phải làm trong `App_Plugins` | Trung bình |
| Ô chi tiết phương tiện | `packages/media/media/collection/views/grid/media-grid-collection-view.element.ts` (70) | Dùng biến CSS | Thêm khe ô chi tiết bên phải | Trung bình |
| Danh sách người dùng, nhóm quyền | `packages/user/user/…`, `packages/user/user-group/workspace/user-group/user-group-workspace-editor.element.ts` (180) | Dùng biến CSS | Đổi bố cục; cân nhắc giữ màn gốc vì ít người dùng | Trung bình |

**Đề xuất cắt bớt Giai đoạn B** cho hợp yêu cầu "dễ dùng": giữ thanh trên cùng, chấm trạng thái và cột phải trình soạn. Phương tiện, Người dùng, Nhóm quyền giữ màn gốc (chỉ đổi màu ở BO-02), vì khách ít vào và quản trị viên mới là người dùng chính. Cắt như vậy bớt khoảng 6 ngày công.

## 4. Đánh giá việc sửa core

| Tiêu chí | Đánh giá | Bằng chứng |
|---|---|---|
| Làm được không | **Được** | Chạy thử 27–28/10: đổi màu thanh trên cùng trong core, build lại, web hiện đúng (`0-tong-hop.md` mục 4) |
| Code core có dễ sửa không | **Dễ**: mỗi màn là một thành phần Lit nhỏ (42–322 dòng), dùng biến CSS, gần như không có mã màu cứng | Đã đếm trong 7 file cần sửa: chỉ 1 mã màu cứng (là chỗ mình vừa sửa) |
| Thời gian một vòng build | **Chậm**: đóng gói khoảng 20 phút | `core_build.ps1 -BuildSpa`; dùng chế độ dev của Vite khi đang sửa |
| Quy trình build đã ổn chưa | **Chưa**: lần đóng gói thứ ba bị treo; thiếu file logo đã sửa | Task BO-01 |
| Chi phí khi nâng Umbraco | Khoảng 0,5–1 ngày mỗi lần nếu giữ dưới 10 chỗ sửa nhỏ dạng "móc" (ước lượng) | Cần gộp mã nguồn bản mới vào `ANTC.Portal.Core` rồi áp lại các chỗ `ANTC:` |
| Kiểm thử | Chưa có kiểm thử tự động cho giao diện; kiểm bằng tay theo danh sách | `CLAUDE.md`: repo chưa có test cho phần này |
| Rủi ro lớn nhất | Sửa `workspace-editor` ảnh hưởng mọi màn sửa (nội dung, phương tiện, người dùng, loại tài liệu…) | Vì vậy chỉ thêm khe, không viết lại |

## 5. Hướng dẫn sửa core từng bước

### 5.1. Chuẩn bị máy (một lần)

1. Cài Node ≥ 24.13 và npm ≥ 11. Node 22 vẫn build được nhưng có cảnh báo.
2. Cài thư viện client:
   ```powershell
   cd src\ANTC.Portal.Core\src\Umbraco.Web.UI.Client
   npm ci
   ```
3. Chế độ dev (sửa xong thấy ngay, không phải đóng gói):
   - Tạo `src\ANTC.Portal.Core\src\Umbraco.Web.UI.Client\.env.local`:
     ```
     VITE_UMBRACO_USE_MSW=off
     VITE_UMBRACO_API_URL=http://localhost:11000
     ```
   - Trong `src\ANTC.Portal.App\Umbraco.Web.UI\appsettings.Local.json` (không commit) thêm `Umbraco:CMS:Security:BackOfficeHost` trỏ tới địa chỉ Vite (mặc định `http://localhost:5173`), chạy lại web.
   - Chạy web (`.\run-local.ps1`), rồi trong thư mục client chạy `npm run dev:server` và mở địa chỉ Vite in ra.
   - Bước này chưa chạy thử trên repo. BO-01 phải xác nhận và ghi lại cấu hình đúng.

### 5.2. Quy tắc khi sửa

1. **Hỏi trước**: việc này làm bằng `exclude`, `appendCondition`, `overwrites` hay extension mới được không? Được thì **không sửa core**.
2. Nếu phải sửa: **chỉ thêm móc** (khe `umb-extension-slot`, biến CSS, thuộc tính). Không viết lại thành phần, không đổi API, không đổi hành vi có sẵn.
3. Mỗi chỗ sửa đặt trong chú thích:
   ```ts
   /* ANTC: <lý do> · <mã task> */
   ```
4. Ghi vào `docs/ban-giao/BACKOFFICE-UI/core-patches.md`: file, dòng, lý do, task, cách áp lại khi nâng Umbraco.
5. Không sửa file sinh tự động (`known-keys.*.generated.ts`, `mockServiceWorker.js`). Nếu build làm đổi chúng thì không commit.

Ví dụ "chỉ thêm móc" cho cột phải trình soạn (minh họa, chưa chạy):

```ts
// content-editor.element.ts — trong render(), canh vung noi dung chinh
/* ANTC: khe cot phai cho tai lieu · BO-18 */
<umb-extension-slot type="antcEditorSidePanel"></umb-extension-slot>
```

Nội dung cột phải (thẻ Xuất bản, Kiểm tra trước khi xuất bản) đăng ký trong `App_Plugins` với `type: 'antcEditorSidePanel'`. Khi nâng Umbraco chỉ phải áp lại đúng một dòng.

### 5.3. Đóng gói và đưa vào App

```powershell
# 1. Tat web dang chay, dung tien trinh MSBuild con sot
dotnet build-server shutdown
# 2. Dong goi (luon co -BuildSpa), khoang 20 phut
.\core_build.ps1 -BuildSpa
# 3. Chay lai web
.\run-local.ps1
```

Kiểm sau khi đóng gói:
- Gói `src\ANTC.Portal.Lib\Build.Core\Umbraco.Cms.StaticAssets.18.2.1-antc.nupkg` có khoảng 2.556 file `staticwebassets/umbraco/backoffice/` và 5 file `staticwebassets/umbraco/assets/`.
- Mở `/umbraco`: logo hiện đúng, không lỗi trong console.
- Commit cả mã nguồn core lẫn các gói `.nupkg` mới.

**Không làm:** build bằng `npm run build:for:cms` rồi chạy `core_build.ps1` không kèm `-BuildSpa`. Làm vậy gói `StaticAssets` sẽ mất toàn bộ backoffice và `/umbraco` báo lỗi 500 (đã gặp ngày 27/10).

### 5.4. Khi nâng phiên bản Umbraco

1. Lấy mã nguồn bản mới vào `src/ANTC.Portal.Core` trên một nhánh riêng.
2. `grep -rn "ANTC:" src/ANTC.Portal.Core`, đối chiếu với `core-patches.md`, áp lại từng chỗ.
3. Đối chiếu thêm hai khung HTML của nhánh `be-01`: `Views/Backoffice/Index.cshtml`, `Login.cshtml`.
4. Đóng gói theo 5.3, kiểm toàn bộ màn theo tiêu chí chung trong file Word (mục 8).

## 6. Lộ trình đề xuất

| Giai đoạn | Nội dung | Sửa core | Ước lượng | Khách thấy gì |
|---|---|---|---|---|
| **A** | BO-01 (ổn định build), BO-02 (màu, chữ), ẩn bớt (lớp 1), màn Thao tác nhanh (lớp 2), BO-19 bằng `workspaceInfoApp` + chặn phía máy chủ, khu Cuộc thi và Hỏi – Đáp (BO-08 → BO-17) | Không | Khoảng 4 tuần cho 1 người | Giao diện gọn, ít nút, màu mới, có trang thao tác nhanh |
| **B** | Thanh trên cùng, chấm trạng thái, cột phải trình soạn (BO-04, BO-06, BO-18) | Có, dạng móc | Khoảng 1,5 tuần | Trình soạn bài đúng mockup |
| Tùy chọn | Phương tiện, Người dùng, Nhóm quyền (BO-21, BO-23, BO-24) | Có | Khoảng 1 tuần | Chỉ làm nếu khách thật sự cần |

## 7. Cần khách hoặc anhnn xác nhận

1. Danh sách tính năng ẩn ở mục 3, lớp 1: ẩn với tất cả trừ quản trị viên, hay ẩn hẳn?
2. Các nút trên màn Thao tác nhanh ở mục 3, lớp 2.
3. Có cắt Phương tiện, Người dùng, Nhóm quyền khỏi phần sửa core như đề xuất ở mục 3, lớp 3 không.
