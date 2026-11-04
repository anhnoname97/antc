
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
| Câu cố định (chỉ Quản trị) | Câu bắt buộc khác | `noAnswerNote` | Câu “Không thấy câu trả lời?” | Đoạn · 200 | ✔ | Dùng chung cho Cảnh báo mới và 5 nhóm rủi ro |
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
| Viết cảnh báo | Cảnh báo | `title` | Tiêu đề | Chữ · 110 | ✔ |  |
| Viết cảnh báo | Cảnh báo | `description` | Tóm tắt | Đoạn · 160 | ✔ | Hiện ở thẻ trong danh sách và mục Tóm tắt |
| Viết cảnh báo | Cảnh báo | `scenarioSteps` | Kịch bản thường gặp | Danh sách dòng (3–5) | khi đăng | 3–5 bước, theo thứ tự xảy ra |
| Viết cảnh báo | Cảnh báo | `stopSigns` | Dấu hiệu phải dừng | Chọn · Dấu hiệu phải dừng (nhiều) |  | Chọn từ Danh mục › Dấu hiệu phải dừng |
| Viết cảnh báo | Cảnh báo | `otherSigns` | Dấu hiệu khác | Danh sách dòng (0–4) |  | Khi không có trong danh mục |
| Viết cảnh báo | Cảnh báo | `actionPage` | Việc cần làm: trang | Chọn · Việc cần làm (một) | khi đăng | Trang việc cần làm cho người đã gặp chuyện |
| Viết cảnh báo | Nguồn cảnh báo | `issuingAgency` | Cơ quan ban hành | Chữ · 120 |  |  |
| Viết cảnh báo | Nguồn cảnh báo | `documentNumber` | Số văn bản | Chữ · 40 |  |  |
| Viết cảnh báo | Nguồn cảnh báo | `documentDate` | Ngày văn bản | Ngày |  |  |
| Viết cảnh báo | Nguồn cảnh báo | `documentUrl` | Liên kết văn bản gốc | Chữ · Liên kết https |  |  |
| Viết cảnh báo | Thêm chi tiết | `searchKeywords` | Từ khóa tìm kiếm | Thẻ · Từ khóa |  | Gõ rồi Enter để thêm |
| Viết cảnh báo | Thêm chi tiết | `autoUnpublishDays` | Tự gỡ sau (ngày) | Số 30–720 | ✔ | Mặc định 180 |
| Viết cảnh báo | Đăng | `updatedDate` | Ngày cập nhật | Ngày | ✔ | Tính 90 ngày “mới” |
| Viết cảnh báo | Đăng | `cautionLevel` | Mức độ cần thận trọng | Danh mục · Mức độ cần thận trọng | ✔ | Mức Cao tự hiện hộp “Chưa chuyển tiền cho tới khi đã kiểm chứng” |
| Viết cảnh báo | Đăng | `popularity` | Mức độ phổ biến | Chọn · Mức độ phổ biến (một) | ✔ |  |
| Viết cảnh báo | Đăng | `popularityBasis` | Căn cứ mức độ phổ biến | Chữ · 160 |  |  |
| Viết cảnh báo | Thủ đoạn | `tactics` | Thủ đoạn | Chọn · Thủ đoạn (nhiều, ≤ 8, sắp được) | khi đăng |  |
| Viết cảnh báo | Thủ đoạn | `channels` | Kênh | Chọn · Kênh (nhiều) | khi đăng |  |
| Viết cảnh báo | Thủ đoạn | `audiences` | Ai dễ bị nhắm tới | Chọn · Đối tượng (nhiều) | khi đăng |  |
| Viết cảnh báo | Kiểm tra trước khi xuất bản | — (không lưu) | Kiểm tra | Không lưu (hiển thị) |  |  |
| Viết cảnh báo | Tình trạng | — (không lưu) | Tình trạng | Không lưu (hiển thị) |  |  |
| Viết cảnh báo | Tình trạng | — (không lưu) | Hẹn giờ | Không lưu (hiển thị) |  |  |
| Viết cảnh báo | Website tự lấy | — (không lưu) | Tự lấy | Không lưu (hiển thị) |  |  |
| Viết cảnh báo | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Viết cảnh báo | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
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
| Nội dung | Nội dung | `thumbnail` | Ảnh thu nhỏ | Chọn ảnh |  | Ảnh trên thẻ nhóm ở trang chủ (QĐ-052) |
| Nội dung | Nội dung | `showAdviceBox` | Hộp “Website không tư vấn tài chính” | Bật/tắt |  | Chữ trong hộp sửa ở Cài đặt website › Câu cố định |
| Nội dung | Nội dung | — (không lưu) | Website tự lấy | Không lưu (hiển thị) |  |  |
| Nội dung | Ảnh minh họa | `illustration` | Ảnh minh họa | Chọn ảnh |  | Ảnh lớn dưới tiêu đề trang |
| Nội dung | Ảnh minh họa | `illustrationAlt` | Văn bản thay thế | Chữ · 160 | có điều kiện | Tả nội dung ảnh cho người không xem được ảnh |
| SEO và chia sẻ | | (composition `seoBase`, `publishMetaBase`) | | | | Mục 6.13 file phân tích |

#### `riskArticlePage` · Bài viết

Có template và đường dẫn · Tạo: Biên tập viên · Xóa: Biên tập viên · Tên node ≤ 110 ký tự

| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|---|
| Viết bài | Bài viết | `series` | Loạt bài | Thẻ · Từ khóa |  | hiện có điều kiện; Chọn loạt đã có hoặc gõ tên loạt mới. “Bài 1, Bài 2” theo thứ tự kéo trong danh sách Bài viết |
| Viết bài | Bài viết | `title` | Tiêu đề | Chữ · 110 | ✔ |  |
| Viết bài | Bài viết | `description` | Một câu mời đọc | Đoạn · 160 | có điều kiện | Hiện dưới tiêu đề trên thẻ bài. Bài đọc chuyên đề để trống thì website tự viết |
| Viết bài | Bài viết | `summary` | Tóm tắt | Soạn thảo · Chỉ in đậm | khi đăng | Hai, ba câu: chuyện gì, ai hay gặp, làm gì ngay |
| Viết bài | Nhận ra và xử lý | `warningSigns` | Dấu hiệu cảnh báo | Danh sách dòng (0–8) | có điều kiện |  |
| Viết bài | Nhận ra và xử lý | `actionsNow` | Việc cần làm ngay | Danh sách dòng (0–6) | có điều kiện |  |
| Viết bài | Nhận ra và xử lý | `scenarios` | Kịch bản thường gặp | InlineList · Thẻ |  |  |
|  | ↳ ô trong thẻ | `scenarios[].tacticName` | Tên kịch bản | Chữ · 140 |  |  |
|  | ↳ ô trong thẻ | `scenarios[].steps` | Diễn biến từng bước | Danh sách dòng (0–8) | ✔ |  |
| Viết bài | Nhận ra và xử lý | `avoidActions` | Việc không nên làm | Danh sách dòng (0–6) |  |  |
| Viết bài | Thủ đoạn trong bài | — (không lưu) | Thủ đoạn | Không lưu (hiển thị) |  |  |
| Viết bài | Nội dung bài | `readingBody` | Nội dung | Soạn thảo · Bài đọc |  | Menu “Kiểu” chèn Hộp ghi nhớ, Trường hợp thật, Bỏ túi; nút Bảng chèn bảng |
| Viết bài | Nguồn tham khảo | `references` | Nguồn | InlineList · Bảng | khi đăng |  |
| | ↳ cột | `references[].title` | Tên tài liệu | Chữ · 200 | ✔ |  |
| | ↳ cột | `references[].organization` | Đơn vị | Chữ · 120 |  |  |
| | ↳ cột | `references[].url` | Liên kết | Chữ · Liên kết https |  |  |
| | ↳ cột | `references[].accessedDate` | Ngày truy cập | Ngày |  | ở dòng mở rộng |
| Viết bài | Thêm chi tiết | `alsoInCategories` | Hiện thêm ở nhóm | Chọn · Nhóm rủi ro (nhiều) |  |  |
| Viết bài | Thêm chi tiết | `searchKeywords` | Từ người dân hay gõ khi tìm | Thẻ · Từ khóa |  | Ví dụ: “gọi điện công an” |
| Viết bài | Thêm chi tiết | `synonyms` | Từ cùng nghĩa | Thẻ · Từ khóa |  | Ví dụ: “otp” cho “mã xác thực” |
| Viết bài | Xuất bản | `primaryGroup` | Đăng ở nhóm | Chọn · Nhóm rủi ro (một) | ✔ |  |
| Viết bài | Xuất bản | `articleKind` | Loại bài | Danh mục · Loại bài | ✔ |  |
| Viết bài | Xuất bản | `topic` | Chuyên đề | Chọn · Chuyên đề (một) | có điều kiện |  |
| Viết bài | Xuất bản | `actionPage` | Dẫn tới trang việc cần làm | Chọn · Việc cần làm (một) |  | Mục “Nếu đã lỡ” lấy các bước của trang này |
| Viết bài | Xuất bản | `isFeatured` | Ghim đầu nhóm | Bật/tắt |  |  |
| Viết bài | Kiểm tra trước khi xuất bản | — (không lưu) | Kiểm tra | Không lưu (hiển thị) |  |  |
| Viết bài | Xem trước thẻ bài | — (không lưu) | Thẻ bài | Không lưu (hiển thị) |  |  |
| Viết bài | Website tự lấy | — (không lưu) | Tự lấy | Không lưu (hiển thị) |  |  |
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

Thư mục, không có trang · Không xóa (trang cố định) · Con được tạo: `riskArticlePage` · Có Collection (tab danh sách): cột Tiêu đề, Nhóm chính, Loại bài, Chuyên đề, Ghim, Ngày rà soát, Trạng thái; lọc Nhóm chính, Loại bài, Trạng thái

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
| Nội dung | Dùng chung cho các bài của chuyên đề | `rememberLine` | Nhớ một câu | Chữ · 140 | khi đăng |  |
| Nội dung | Dùng chung cho các bài của chuyên đề | `mustAsk` | Câu hỏi phải hỏi | Đoạn · 200 | khi đăng |  |
| Nội dung | Dùng chung cho các bài của chuyên đề | `stopWhen` | Khi nào phải dừng | Đoạn · 300 |  |  |
| Nội dung | Dùng chung cho các bài của chuyên đề | `holdWhen` | Khi nào cần hoãn để kiểm chứng | Đoạn · 300 |  |  |

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
| Nội dung | Hiện trên website ở đâu | — (không lưu) | Nơi hiện | Không lưu (hiển thị) |  |  |

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
