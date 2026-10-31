# Đơn giản hóa quản lý nội dung

- Ngày: 2026-10-28 · Thuộc BACKOFFICE-UI
- Phản hồi của khách: **quản lý nội dung là chỗ đau đầu nhất, quá nhiều thao tác**.
- Số liệu dưới đây đọc từ cấu hình uSync trong repo (`src/ANTC.Portal.App/Umbraco.Web.UI/uSync/v18/`) ngày 28/10. Số bước thao tác là **ước lượng theo cấu trúc**, chưa đo bằng người dùng thật.

## 1. Vì sao nhiều thao tác

| Phát hiện | Số liệu | Nguồn |
|---|---|---|
| Rất nhiều loại nội dung | 22 loại trang + **72 loại khối** | `ContentTypes/*.config` |
| Các trang chính chỉ có **một trường "Bố cục"** dạng Block Grid | Trang chủ, Thủ đoạn, Tham gia, Ứng phó, Cuộc thi, Hỏi – Đáp… | `ContentTypes/home.config`, `thuDoanPage.config`… |
| "Bố cục trang" cho chọn nhiều khối, lại khó nhận ra | 21 loại khối · **0 nhóm** · **5/21 khối có nhãn** · **0 ảnh minh họa** | `DataTypes/` "Bố cục trang · Block Grid" |
| Khối lồng khối | Nhiều khối chứa danh sách khối con (dấu hiệu nguy hiểm, cách thức lừa đảo, số khẩn cấp…), mỗi khối 5–17 trường | 14 data type "ANTC · …" chỉ chứa 1 loại khối con |
| Trang cài đặt chung quá dài | Trang gốc "An toàn tài chính": **39 trường, 16 bắt buộc, 6 tab** | `ContentTypes/antc.config` |
| Trang giới thiệu Thủ đoạn quá dài | **40 trường, 6 tab** | `ContentTypes/fraudContent.config` |
| Nội dung đổi thường xuyên nhất là bài viết | 40 bài viết, 10 danh mục | `Content/` |

**Ví dụ: sửa một câu trong khối "Dấu hiệu nguy hiểm" trên trang Thủ đoạn** (ước lượng):

| Hiện nay | Sau khi làm gọn (mức 2 ở dưới) |
|---|---|
| 1. Mở Nội dung → 2. mở "Quản lý trang" → 3. chọn "Thủ đoạn" → 4. tìm trong Bố cục khối có tên loại khối (không có nhãn) → 5. mở khối (hộp thoại) → 6. mở mục con (hộp thoại thứ hai) → 7. sửa chữ → 8. Cập nhật → 9. Cập nhật → 10. Lưu và xuất bản | 1. Bấm "Sửa trang Thủ đoạn" ở màn Thao tác nhanh → 2. sửa chữ ngay trong form chia theo phần trang → 3. Xuất bản |
| **Khoảng 10 thao tác, 2 hộp thoại chồng nhau** | **Khoảng 3 thao tác, không có hộp thoại** |

## 2. Nguyên tắc

**Tách "nội dung hay đổi" khỏi "bố cục trang".** Biên tập viên hằng ngày chỉ đụng nội dung hay đổi: bài viết, câu chữ trên trang, số khẩn cấp, hỏi đáp. Bố cục (thêm, xóa, sắp xếp khối) để quản trị viên làm, ít khi đổi.

## 3. Đề xuất theo ba mức

### Mức 1: chỉ cấu hình trong backoffice (không viết code, không sửa core) · khoảng 2–3 ngày

Cấu hình xong commit file uSync.

| # | Việc | Làm ở đâu | Hiệu quả |
|---|---|---|---|
| 1.1 | **Đặt nhãn cho mọi khối** theo nội dung, ví dụ `Dấu hiệu nguy hiểm · {{ title }}` thay vì tên loại khối | Data type "Bố cục trang · Block Grid" và các data type khối, trường Label | Nhìn danh sách là biết khối nào, không phải mở từng cái |
| 1.2 | **Chia nhóm khối** (Giới thiệu đầu trang · Nội dung · Tương tác · Cuộc thi) và **thêm ảnh minh họa** cho mỗi khối (ảnh chụp khối trên website) | Như trên, phần Block Groups và Thumbnail | Thêm khối không phải đọc 21 cái tên |
| 1.3 | **Chia lại trang cài đặt chung**: tab đầu "Hay sửa" (liên hệ, số khẩn cấp); các tab ít sửa (Tài trợ, Ảnh hero, Chân trang) **ẩn với biên tập viên** bằng quyền theo trường | Loại trang `antc` + quyền theo trường (`DocumentPropertyValuePermission`) của nhóm người dùng | Từ 39 trường còn khoảng 10 trường biên tập viên cần thấy |
| 1.4 | Tương tự cho "Nội dung giới thiệu Thủ đoạn" (40 trường) | Loại trang `fraudContent` + quyền theo trường | Biên tập viên chỉ thấy phần chữ |
| 1.5 | **Danh sách bài viết dạng bảng**: cột Tiêu đề, Trạng thái, Chuyên mục, Ngày sửa, ô tìm kiếm, lọc theo trạng thái | Cấu hình danh sách (collection) của `articleList` | Không phải lần trong cây 40+ bài |
| 1.6 | **Giá trị mặc định khi tạo bài**: chuyên mục, tác giả, nguồn rà soát điền sẵn | Mẫu nội dung (blueprint) hoặc giá trị mặc định | Bớt trường phải điền |
| 1.7 | **Mô tả trường** ngắn, ví dụ cụ thể; bỏ mô tả lặp tên trường | Loại trang (Description của từng trường) | Đỡ phải hỏi lại |

### Mức 2: tiện ích mở rộng (viết code trong `App_Plugins`, không sửa core) · khoảng 5–8 ngày

| # | Việc | Cách làm | Hiệu quả |
|---|---|---|---|
| 2.1 | **Tab "Sửa nhanh" cho các trang dựng bằng Block Grid** (việc chính) | Thêm `workspaceView` "Sửa nhanh" cho các loại trang có trường Bố cục. Tab đọc giá trị Block Grid của trang và hiện **một form duy nhất**, chia theo từng phần trang (theo thứ tự khối), chỉ gồm các trường chữ và ảnh. **Không có** thêm, xóa, kéo thả khối. Lưu thì ghi ngược vào giá trị Block Grid. Với nhóm biên tập viên: dùng `appendCondition` để tab "Sửa nhanh" là tab mặc định và ẩn tab "Nội dung" gốc; quản trị viên vẫn thấy cả hai. | Sửa chữ trên trang trong khoảng 3 thao tác, không hộp thoại chồng |
| 2.2 | **Màn "Thao tác nhanh"** làm trang đầu khi đăng nhập | `dashboard` thay `Umb.Dashboard.UmbracoNews` | Một bấm tới việc hay làm |
| 2.3 | Nút trên màn Thao tác nhanh **cho nội dung**: Viết bài cảnh báo · Sửa trang Thủ đoạn · Sửa trang Ứng phó · Sửa số khẩn cấp · Đăng câu trả lời Hỏi – Đáp · Tải ảnh | Liên kết sâu tới đúng trang và đúng tab | Không phải nhớ trang nằm ở đâu trong cây |
| 2.4 | **Một nút xuất bản rõ ràng**: biên tập viên chỉ thấy "Lưu nháp" và "Xuất bản"; ẩn "Lưu và xem trước", xem trước làm nút riêng | `appendCondition` lên `Umb.WorkspaceAction.Document.SaveAndPreview` | Bớt lưỡng lự chọn nút |
| 2.5 | **Ô "Kiểm tra trước khi xuất bản"** (BO-19), chặn xuất bản khi thiếu mục bắt buộc (QĐ-031) | `workspaceInfoApp` + xử lý sự kiện xuất bản phía máy chủ (C#) | Không đăng bài thiếu thông tin |
| 2.6 | Ẩn các thao tác thừa trên trang với biên tập viên: tạo mẫu nội dung, tên miền, thông báo, sắp xếp | `appendCondition` (xem `2-danh-gia-va-huong-dan-sua-core.md` mục 3) | Menu chuột phải còn ít mục |

**Giới hạn cần biết của mục 2.1:** quyền theo trường của Umbraco chỉ cho khóa **cả trường Bố cục**. Nếu khóa trường đó thì biên tập viên cũng không sửa được chữ bên trong khối. Vì vậy muốn "sửa chữ được nhưng không đổi bố cục" thì phải làm tab "Sửa nhanh" như trên. Tab gốc chỉ bị ẩn trên giao diện, nên cần thêm kiểm tra phía máy chủ (C#) để chặn biên tập viên thay đổi cấu trúc khối nếu khách yêu cầu chặt chẽ.

### Mức 3: đổi mô hình dữ liệu (chưa đề xuất làm, cần quyết vì đụng schema) · ước lượng 2–3 tuần

- Đưa các đoạn chữ hay sửa ra thành trường riêng ở cấp trang, bỏ dần khối lồng khối, giảm số loại khối (72 hiện nay).
- Phải sửa loại nội dung (uSync), view Razor của website, chuyển dữ liệu nội dung đang có; dễ ảnh hưởng giao diện công khai.
- **Khuyến nghị: chưa làm.** Làm mức 1 và 2 trước, đo lại xem khách còn vướng ở đâu.

## 4. Có cần sửa core cho quản lý nội dung không

Gần như **không**. Mức 1 là cấu hình, mức 2 là tiện ích mở rộng. Core chỉ cần sửa nếu vẫn muốn bố cục trình soạn hai cột như mockup (BO-18: thêm một khe cột phải). Việc đó làm sau, không phải điều kiện để giảm thao tác.

## 5. Task bổ sung vào kế hoạch

| Mã | Việc | Mức | Ước lượng | Phụ thuộc | Tiêu chí đạt |
|---|---|---|---|---|---|
| ND-01 | Nhãn, nhóm, ảnh minh họa cho khối (1.1, 1.2) | 1 | 1 ngày | – | Mọi khối có nhãn theo nội dung; 4 nhóm; mỗi khối có ảnh; commit uSync |
| ND-02 | Chia lại và phân quyền theo trường cho `antc`, `fraudContent` (1.3, 1.4) | 1 | 1 ngày | Chốt nhóm người dùng | Biên tập viên chỉ thấy các tab "hay sửa"; quản trị viên thấy đủ |
| ND-03 | Danh sách bài viết dạng bảng, giá trị mặc định, mô tả trường (1.5–1.7) | 1 | 1 ngày | – | Tìm, lọc bài theo trạng thái; tạo bài mới chỉ phải điền tiêu đề, tóm tắt, nội dung, ảnh |
| ND-04 | Tab "Sửa nhanh" cho trang Block Grid (2.1) | 2 | 4–5 ngày | BO-02 | Sửa chữ một khối trên trang Thủ đoạn trong ≤ 3 thao tác; không thêm, xóa, kéo khối được; lưu xong website hiển thị đúng |
| ND-05 | Màn Thao tác nhanh và nút nội dung (2.2, 2.3) | 2 | 1,5 ngày | BO-02 | Mỗi nút mở đúng trang/tab; có số đếm |
| ND-06 | Gọn nút lưu và menu thao tác cho biên tập viên (2.4, 2.6) | 2 | 0,5 ngày | Chốt nhóm người dùng | Biên tập viên chỉ thấy Lưu nháp, Xuất bản, Xem trước |

BO-19 (ô kiểm tra trước khi xuất bản) giữ nguyên trong kế hoạch, làm bằng `workspaceInfoApp`.

## 6. Cần chốt

1. **Ai là biên tập viên, ai là quản trị viên** phía khách: dùng nhóm người dùng nào để áp các mục ẩn và khóa.
2. Có làm **tab "Sửa nhanh"** (ND-04) không; đây là việc giảm thao tác nhiều nhất.
3. Có cần **chặn phía máy chủ** việc biên tập viên đổi cấu trúc khối không, hay chỉ ẩn trên giao diện là đủ.
4. Đồng ý **chưa làm mức 3** (đổi mô hình dữ liệu).
