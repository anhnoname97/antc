# Portal v2: thay Block List bằng cách nhập dễ dùng hơn

Ngày: 2026-11-03 · Áp dụng QĐ-041. Là **đề xuất**, chờ anhnn xác nhận ở mục 7.

Phạm vi: các loại trang và mục của portal v2 (`1-phan-tich-cau-hinh-umbraco.md` mục 6, 7). Các trang Cuộc thi và Hỏi – Đáp đã làm bằng Block Grid và đã vào `dev`, nên giữ nguyên.

## 1. Mục tiêu

Biên tập viên sửa toàn bộ một trang trên **một form**. Không có hộp thoại, không có khối lồng khối, không phải đi tìm node con.

Ví dụ, sửa mô tả một số đường dây nóng trên trang Khẩn cấp:

| Block List (thiết kế cũ) | Đề xuất |
|---|---|
| Mở trang → bấm khối → hộp thoại mở → sửa → Cập nhật → Xuất bản: 5 thao tác | Mở trang → sửa ô trong bảng → Xuất bản: 3 thao tác |

## 2. Bốn cách nhập, chọn theo dạng dữ liệu

| Dạng dữ liệu | Cách nhập | Có sẵn hay tự viết |
|---|---|---|
| Một câu, một đoạn | Ô chữ, ô đoạn (Textstring, Textarea có giới hạn ký tự) | Có sẵn |
| Danh sách câu | Danh sách dòng (`Umbraco.MultipleTextstring`): thêm, xóa, kéo dòng ngay trên form | Có sẵn |
| Danh sách mục, mỗi mục vài ô | Ô danh sách `Antc.InlineList`, hiện dạng **Bảng** hoặc **Thẻ** (mục 3) | Tự viết |
| Bài dài có hộp ghi nhớ, bảng | Ô soạn thảo (Tiptap) có menu kiểu định dạng | Có sẵn, chỉ cấu hình |

Lựa chọn của trình hỏi không dùng cách nào ở trên. Chúng được thêm, sửa ngay trong màn "Ma trận tình huống" (QĐ-034), vì ma trận trỏ tới từng lựa chọn.

## 3. Ô danh sách `Antc.InlineList`

### 3.1 Hai dạng hiển thị

**Bảng**: dùng khi mỗi mục có ô ngắn, ví dụ số đường dây nóng, mức kết quả, nguồn tham khảo, câu hỏi công cụ.

```
 Số đường dây nóng do Nhà nước vận hành                         2/6
┌───┬────────┬──────────────┬──────────────────────────────┬────┐
│ ⋮⋮│ Số     │ Hình thức    │ Mô tả                         │    │
├───┼────────┼──────────────┼──────────────────────────────┼────┤
│ ⋮⋮│ 113    │ Gọi        ▾ │ Công an, khi có nguy hiểm…    │ 🗑 │
│ ⋮⋮│ 156    │ Gọi và nhắn ▾│ Báo cuộc gọi, tin nhắn lừa…   │ 🗑 │
└───┴────────┴──────────────┴──────────────────────────────┴────┘
 + Thêm dòng
```

- Gõ thẳng vào ô. Tab sang ô kế, Enter ở ô cuối thì thêm dòng mới.
- Kéo tay nắm ⋮⋮ để sắp thứ tự.
- Bấm xóa thì dòng mất ngay, và có thanh "Đã xóa 1 dòng · Hoàn tác" trong 8 giây. Không hỏi lại bằng hộp thoại.
- Dán nhiều dòng chép từ Word hoặc Excel thì tách thành nhiều dòng; cột cách nhau bằng phím Tab.
- Ô sai bị tô đỏ, có câu báo ngay dưới ô.
- Góc phải hiện số dòng trên số tối đa ("2/6"). Đủ số thì nút thêm bị ẩn.
- Cột chọn dùng combobox (QĐ-039).
- Khung soạn hẹp hơn 720 px thì bảng tự chuyển sang dạng Thẻ.

Quy tắc chọn dạng Bảng:
- Bảng hiện tối đa 4 cột. Ô ít dùng (Cú pháp tin nhắn, Mô tả của mức kết quả) nằm ở dòng mở rộng ▸, bấm thì hiện ngay dưới dòng.
- Ô chữ dài tự xuống dòng và tự cao lên, không cắt chữ.
- Trường dùng bảng đặt `LabelOnTop = true`, để bảng lấy hết bề ngang khung soạn.
- Mục có danh sách con hoặc có đoạn dài hơn khoảng 200 ký tự thì dùng dạng Thẻ.
- Màn so sánh phiên bản có sẵn của Umbraco hiện giá trị JSON thô. Vì vậy V2-01f thêm phần hiển thị giá trị dạng bảng ở màn đó; làm không được thì ghi vào giới hạn.

**Thẻ**: dùng khi mục có đoạn dài hoặc có danh sách con, ví dụ các bước của Việc cần làm, nhóm checklist, câu hỏi theo nhánh.

```
 Các bước                                        Mở hết · Thu hết
┌─────────────────────────────────────────────────────────────┐
│ ⋮⋮ 1  Gọi ngay số tổng đài in trên thẻ ngân hàng       ▴  ⧉ 🗑 │
│    Câu chính  [ Gọi ngay số tổng đài in trên thẻ…        ]    │
│    Diễn giải  • Đừng gọi số trong tin nhắn         ⋮⋮ ✕       │
│               • Nói rõ: tôi vừa chuyển tiền…        ⋮⋮ ✕       │
│               + Thêm dòng                                     │
│    Câu nói mẫu [ "Tôi vừa chuyển nhầm cho kẻ lừa đảo…" ]      │
│    ☐ Hiện hộp "Tìm đúng số ngân hàng"                         │
│    ▸ Hỏi thêm (không bắt buộc)                                │
├─────────────────────────────────────────────────────────────┤
│ ⋮⋮ 2  Khóa thẻ, đổi mật khẩu ứng dụng ngân hàng       ▾  ⧉ 🗑 │
└─────────────────────────────────────────────────────────────┘
          + Thêm bước ở đây        + Thêm bước cuối
```

- Mỗi thẻ mở ngay trên form. Thẻ đang đóng hiện một dòng tóm tắt, lấy từ ô đầu tiên.
- Danh sách có từ 3 thẻ trở xuống thì mở hết; nhiều hơn thì đóng hết, trừ thẻ đang có lỗi.
- Nút ⧉ nhân bản thẻ. "+ Thêm ở đây" chèn thẻ mới vào giữa hai thẻ.
- Kéo, xóa và hoàn tác giống dạng Bảng.
- Một thẻ chứa được một danh sách con (danh sách dòng hoặc bảng nhỏ). Không có cấp lồng thứ ba.

### 3.2 Danh sách cố định số mục

Có những chỗ đặc tả cố định số mục: 4 nguyên tắc dừng, 4 liên kết chính ở chân trang, 3 cửa vào. Ô danh sách vẫn dùng cho các chỗ này, chỉ đặt số dòng tối thiểu bằng số dòng tối đa. Khi đó ô không có nút thêm, nút xóa, chỉ còn sửa và kéo sắp.

Chia thành các trường đánh số ("Nguyên tắc 1 · Tiêu đề"…) thì 4 nguyên tắc × 3 ô thành 12 trường xếp dọc. Một bảng 4 dòng dễ nhìn hơn.

### 3.3 Phía máy chủ

`Antc.InlineList` là một property editor đầy đủ, không chỉ là giao diện. Lý do: phần kiểm dữ liệu và phần ghi tham chiếu phải chạy phía máy chủ.

| Phần | Việc |
|---|---|
| Cấu hình data type | Danh sách cột hoặc ô, mỗi ô có: alias, nhãn, kiểu, bắt buộc, giới hạn ký tự. Thêm số dòng tối thiểu, tối đa, có cho sắp thứ tự không, và dạng Bảng hay Thẻ |
| Kiểu ô | Chữ · Đoạn · Số · Ngày · Bật/tắt · Chọn giá trị cố định · Chọn node (combobox) · Liên kết · Danh sách dòng · Bảng nhỏ |
| Lưu | JSON: mảng các mục, mỗi mục có `key` (GUID, sinh khi tạo, không đổi) và các ô |
| Kiểm khi lưu | Số dòng, ô bắt buộc, giới hạn ký tự, định dạng (số, liên kết `https://`). Lỗi trả về đúng ô |
| Tham chiếu | `IDataValueReferenceFactory`: đọc các ô kiểu Chọn node, báo cho Umbraco. Nhờ vậy việc chặn xóa (`DisableDeleteWhenReferenced`) vẫn chạy |
| Đọc trong view | Property value converter trả danh sách có kiểu. Ô Chọn node trả `IPublishedContent`, ô Danh sách dòng trả `IReadOnlyList<string>` |
| Lịch sử, nháp, hẹn giờ | Theo cơ chế có sẵn của Umbraco, vì giá trị chỉ là một trường của trang |

`key` của từng mục dùng làm neo. Ví dụ "Kịch bản thường gặp" trong bài viết có neo để tô sáng một thủ đoạn khi mở bài từ danh sách. Thủ đoạn trỏ tới neo này.

## 4. Áp dụng cho từng chỗ (thay các loại `…Block`)

| Chỗ dùng | Trước đây | Đề xuất | Ô (theo thứ tự) | Số mục |
|---|---|---|---|---|
| Cài đặt website › Bốn nguyên tắc dừng | `principleBlock` | Bảng cố định | Biểu tượng (chọn) · Tiêu đề ≤ 40 ✔ · Giải thích ≤ 120 ✔ | 4 |
| Chân trang › Bốn liên kết chính | `linkBlock` | Bảng cố định | Nhãn ✔ · Trang (chọn) ✔ | 4 |
| Chân trang › Liên kết phụ; Khẩn cấp › Hai nút cuối trang; Công cụ › Lối sang Thử sức | `linkBlock` | Bảng | Nhãn ✔ · Trang (chọn) hoặc Liên kết ngoài | 0–6, 0–2, 0–2 |
| Chân trang › Cam kết | danh sách chuỗi | Danh sách dòng | | 0–4 |
| Khẩn cấp › Số do Nhà nước vận hành, Đường dây nóng của tổ chức tín dụng | `hotlineBlock` | Bảng | Số ✔ (chỉ chữ số, 3–6) · Hình thức (chọn) ✔ · Mô tả ≤ 200 ✔ · Cú pháp tin nhắn | 1–6, 0–10 |
| Khẩn cấp › Ba cửa vào | `doorBlock` + `doorOptionBlock` | Thẻ cố định | Tiêu đề ≤ 70 ✔ · Mô tả ≤ 120 ✔ · Hình minh họa (chọn) · Khi bấm (chọn: Mở trang / Mở danh sách) ✔ · Trang đích (chọn) · Lựa chọn: bảng nhỏ (Biểu tượng · Câu ≤ 160 ✔ · Đích (chọn) ✔) | 3 |
| Việc cần làm › Các bước | 4 loại khối: `stepBlock`, `branchBlock`, `snippetRefBlock`, `screeningBlock` | Thẻ, **gộp còn một loại "Bước"** | Câu chính ✔ · Diễn giải (danh sách dòng) · Câu nói mẫu · Hiện hộp "Tìm đúng số ngân hàng" (bật/tắt) · Chỉ làm khi (chọn đoạn dùng chung) · Đoạn dùng chung chèn sau bước (chọn) · Hỏi thêm: Câu hỏi, Chữ nút, Ghi chú, Trang đích (chọn) | 1–12 |
| Việc cần làm › Câu hỏi sàng lọc (chỉ trang "Trả lời vài câu hỏi ngắn") | `screeningBlock` | Bảng, trường riêng của trang | Câu ✔ · Chữ nút ✔ · Ghi chú · Trang đích (chọn) ✔ | 0–8 |
| Công cụ › Câu hỏi (đếm dấu hiệu) | `toolQuestionBlock` | Bảng | Câu hỏi ≤ 200 ✔ · Giải thích phụ · Dấu hiệu khi trả lời (Có/Không) ✔ | 3–8 |
| Công cụ › Mức kết quả | `toolResultBandBlock` | Bảng | Từ ✔ · Đến · Nhãn ✔ · Màu (chọn) ✔ · Mô tả | 2–4 |
| Công cụ › Câu hỏi theo nhánh (công cụ 3) | `toolBranchBlock` | Thẻ | Câu hỏi ✔ · Nhãn tình huống ✔ · Hành động (danh sách dòng) ✔ · Trang việc cần làm (chọn) | 3–8 |
| Công cụ › Hành động khuyến nghị | danh sách chuỗi | Danh sách dòng | | 1–6 |
| Checklist › Nhóm mục | `checkGroupBlock` | Thẻ | Tiêu đề nhóm ✔ · Các dòng (danh sách dòng) ✔ | 1–8 |
| Bài viết › Dấu hiệu, Việc cần làm ngay, Việc không nên làm; Cảnh báo › Kịch bản, Dấu hiệu khác | danh sách chuỗi | Danh sách dòng | | theo phân tích 6.10, 6.11 |
| Bài viết › Kịch bản thường gặp | `scenarioBlock` | Thẻ | Tên thủ đoạn · Các bước (danh sách dòng) ✔. Neo là `key` của thẻ, sinh tự động | 0–6 |
| Bài viết › Nguồn tham khảo | `sourceBlock` | Bảng | Tên tài liệu ✔ · Đơn vị · Liên kết `https://` · Ngày truy cập | 0–10 |
| Bài viết › Nội dung đọc thêm | 6 loại `reading…Block` | Ô soạn thảo có kiểu định dạng (mục 5) | | |
| Liên hệ đúng nơi › Nhóm liên hệ | `contactGroupBlock` | Thẻ | Nhóm ✔ · Đơn vị ✔ · Cách liên hệ (danh sách dòng) ✔ · Nguồn · Ngày kiểm | 1–8 |
| Trình hỏi › Lựa chọn bước 1, 2, 3 | `wizardOptionBlock` | Trong màn Ma trận | Nhãn ≤ 60 ✔ · Biểu tượng | 2–8 mỗi bước |
| Trình hỏi › 4 tiêu đề kết quả, 4 chữ nút | 4 chuỗi | Ô chữ riêng, như cũ | | |

Sau khi thay, các element type `…Block` không còn dùng ở portal v2. Mục "Đổi tên" trong `2-danh-muc-va-document-type.md` chỉ còn áp dụng cho composition (`seoBase`, `publishMetaBase`, `taxonomyBase`).

## 5. Bài đọc dài: ô soạn thảo có kiểu định dạng

Bài đọc chuyên đề và bài đọc thêm dùng một ô soạn thảo. Thanh công cụ có các nút: Đoạn, Tiêu đề phụ, In đậm, Danh sách, Bảng, Liên kết, và menu "Kiểu". Menu "Kiểu" chứa các hộp lấy theo bản dựng:

| Kiểu | Bản dựng (`DOCS`) | Hiện trên website |
|---|---|---|
| Hộp "Câu hỏi của bài" | `box` | Hộp nền xanh nhạt |
| Hộp "Nhớ một câu" | `now` | Hộp viền vàng |
| Hộp "Hiểu nhanh" | `chips` | Dải thẻ |
| Trường hợp thật | `case` | Hộp có nhãn "Trường hợp thật" |
| Bỏ túi | `pocket` | Hộp có thể cắt ra |
| Dấu hiệu phải dừng | `stop` | Hộp viền cam |

Core 18.2.1 có sẵn các phần mở rộng Tiptap cần cho việc này: `style-menu`, `html-attr-class`, `html-tag-div`, `table` (thư mục `Umbraco.Web.UI.Client/src/packages/tiptap/extensions`). Cấu hình data type `Soạn thảo · Bài đọc` bật các phần đó, kèm tệp CSS cho khung soạn để hộp trong khung trông giống trên website. Chưa chạy thử; kiểm ở V2-03.

## 6. Việc và ước lượng

| Mã | Việc | Ước lượng | Phụ thuộc |
|---|---|---|---|
| V2-01f | `Antc.InlineList`: property editor (cấu hình, kiểm khi lưu, tham chiếu, value converter) và giao diện Bảng, Thẻ, Danh sách cố định; dùng chung combobox của V2-01e | 3–4 ngày | V2-01e |
| V2-01g | Data type `Soạn thảo · Bài đọc` và CSS khung soạn | 0,5 ngày | – |

V2-01f nên dựng thử trước trên một chỗ, ví dụ bảng số đường dây nóng. Dựng thử đạt rồi mới thiết kế chi tiết các trang dùng nó (V2-05, V2-06, V2-08).

Rủi ro:
- Đây là phần code tự viết lớn nhất của backoffice. Mỗi lần nâng cấp Umbraco phải kiểm lại.
- Đổi lại, dữ liệu là JSON đơn giản và có `key` cho từng mục. Nếu sau này cần quay về Block List, vẫn chuyển được bằng script.

## 7. Cần xác nhận

1. Dùng bốn cách nhập ở mục 2, trong đó ô danh sách `Antc.InlineList` có hai dạng Bảng và Thẻ.
2. Gộp 4 loại khối của Việc cần làm thành một loại "Bước" có phần "Hỏi thêm" không bắt buộc.
3. Bài đọc dài dùng ô soạn thảo có menu "Kiểu", thay cho 6 loại khối.
4. Danh sách cố định số mục (4 nguyên tắc, 4 liên kết, 3 cửa vào) dùng bảng hoặc thẻ cố định số dòng, không chia thành các trường đánh số.
