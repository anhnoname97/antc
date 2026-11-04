"""Dung mockup ban giao phan Cac rui ro: man website (anh danh so) <-> cho nhap trong backoffice.

python dung_bo_cac_rui_ro.py anh-portal-rui-ro ../mockup/bo-cac-rui-ro.html
Anh chup tu mockup/antoantaichinh_v2.html o be rong 1440 px. Vi tri so (top %, left %) tinh tren anh.
Truong va alias lay theo Phu luc A (phu-luc-a.md). Sua o day roi chay lai, khong sua tay file html.
"""
import sys, os, json, base64, html

imgdir, out = sys.argv[1:3]

# Trang thai cua moi khoi: nhap = nhap o form nay; khac = nhap o cho khac; tu = tu dong; thieu = chua co cho nhap
S = {}
SCREENS = [
 {'id': 'nhom', 'nav': 'Trang nhóm rủi ro', 'url': '/cac-rui-ro/lua-dao', 'type': 'riskCategoryPage',
  'what': '5 trang: Lừa đảo, Vay và nợ, Đầu tư, Bảo hiểm và tiết kiệm, Dữ liệu cá nhân. Không thêm, không xóa.',
  'where': ['Quản lý trang', 'Các rủi ro', 'Lừa đảo'],
  'imgs': [('nhom-lua-dao', 'Nhóm Lừa đảo', [(1, 7.4, 10), (2, 19, 50), (3, 32.2, 10), (4, 38.6, 10), (5, 44.5, 10), (6, 51.3, 12), (7, 72.2, 10), (8, 75.4, 10)]),
           ('nhom-dau-tu', 'Nhóm Đầu tư', [(9, 35.6, 10)])],
  'rows': [
   (1, 'Biểu tượng, tên nhóm, câu dẫn', ['tabName', 'icon', 'lead'], 'nhap', 'Tên nhóm cũng là chữ trên thanh tab.'),
   (2, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', 'Ảnh thu nhỏ `thumbnail` dùng ở thẻ nhóm trang chủ, không hiện ở đây.'),
   (3, 'Thanh 6 tab', [], 'tu', 'Cảnh báo mới và 5 nhóm, theo thứ tự trang con của Các rủi ro trên cây (kéo để đổi).'),
   (4, 'Ô tìm và bộ lọc Kênh, Đối tượng, Mức độ', [], 'khac', 'Giá trị lọc lấy từ Danh mục › Kênh tiếp cận, Đối tượng; Mức độ là danh sách cố định. Chặn tìm chuỗi toàn chữ số từ 6 ký tự.'),
   (5, 'Danh sách thẻ (12 thẻ một lần, nút Xem thêm)', ['tactics', 'pinnedArticles'], 'tu', 'Gồm: bài viết có Đăng ở nhóm hoặc Hiện thêm ở nhóm là nhóm này; thủ đoạn chọn ở “Thủ đoạn hiện trong nhóm”; bài ghim lên đầu.'),
   (6, 'Thẻ “Việc cần làm ngay” trong danh sách', [], 'thieu', 'Chưa có trường chọn trang việc cần làm nào hiện ở nhóm nào. Đề xuất: thêm “Việc cần làm hiện trong nhóm” (Chọn · Việc cần làm, nhiều) vào trang nhóm.'),
   (7, 'Bộ khung nhận diện mọi thủ đoạn (chỉ Lừa đảo)', [], 'thieu', 'Chưa có chỗ nhập. Đề xuất: một Đoạn dùng chung, chọn ở trang nhóm qua trường “Khối thêm cuối trang”.'),
   (8, 'Hộp “Không thấy câu trả lời?”', ['noAnswerNote'], 'nhap', 'Nút Hỏi – Đáp cố định.'),
   (9, 'Hộp “Website không tư vấn tài chính” (Đầu tư, Vay và nợ, Bảo hiểm)', [], 'thieu', 'Chữ đã có ở Cài đặt website › Câu cố định (Câu miễn trừ tư vấn, Hai điều phải nhớ). Thiếu công tắc bật cho từng nhóm. Đề xuất: “Hiện hộp không tư vấn” (Bật/tắt).'),
   (None, 'Dòng “Bài riêng … đang được biên soạn” (Bảo hiểm)', [], 'thieu', 'Đề xuất: “Ghi chú đầu danh sách” (Đoạn · 300), trống thì ẩn.'),
  ]},
 {'id': 'cbm', 'nav': 'Cảnh báo mới (danh sách)', 'url': '/cac-rui-ro/canh-bao-moi', 'type': 'alertListPage',
  'what': 'Một trang. Danh sách lấy từ Quản lý nội dung › Cảnh báo.',
  'where': ['Quản lý trang', 'Các rủi ro', 'Cảnh báo mới'],
  'imgs': [('canh-bao-moi', 'Cảnh báo mới', [(1, 6.6, 10), (2, 13.8, 50), (3, 19.3, 10), (4, 21.6, 10), (5, 27.4, 10), (6, 34.3, 10), (7, 68.2, 10), (8, 79, 10)])],
  'rows': [
   (1, 'Tên trang, câu dẫn', ['title', 'lead'], 'nhap', ''),
   (2, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (3, 'Thanh 6 tab', [], 'tu', 'Như trang nhóm.'),
   (4, 'Dòng “Mẫu trình bày”', ['showSampleNote'], 'nhap', 'Tắt khi đã có cảnh báo thật. Dòng này cũng hiện ở từng trang cảnh báo.'),
   (5, 'Ô tìm và 4 bộ lọc (thêm Ngày)', [], 'tu', 'Ngày: 30 ngày qua, 90 ngày qua, Lưu trữ quá 90 ngày; tính theo Ngày cập nhật của cảnh báo.'),
   (6, 'Thẻ cảnh báo', [], 'khac', 'Nhập ở Quản lý nội dung › Cảnh báo: ngày (Ngày cập nhật), “Dựa trên cảnh báo của …” (Cơ quan ban hành), tiêu đề, mô tả, mức độ. “Mới nhất” và thời gian đọc tự tính.'),
   (7, 'Mục “Lưu trữ · quá 90 ngày”', [], 'tu', 'Cảnh báo có Ngày cập nhật quá 90 ngày chuyển xuống đây; quá “Tự gỡ sau (ngày)” thì tự gỡ.'),
   (8, 'Hộp “Không thấy câu trả lời?”', [], 'thieu', 'Trang Cảnh báo mới chưa có trường này (trang nhóm có `noAnswerNote`). Đề xuất: thêm cùng trường, hoặc dùng một câu chung ở Cài đặt website cho cả 6 tab.'),
  ]},
 {'id': 'cb', 'nav': 'Trang cảnh báo', 'url': '/cac-rui-ro/canh-bao-moi/<tên cảnh báo>', 'type': 'alertPage',
  'what': 'Biên tập viên thêm hằng ngày. Mỗi cảnh báo viết từ một văn bản của cơ quan nhà nước.',
  'where': ['Quản lý nội dung', 'Cảnh báo', 'một cảnh báo'],
  'imgs': [('canh-bao', 'Một cảnh báo', [(1, 8.1, 10), (2, 9.9, 10), (3, 11.5, 10), (4, 15.6, 10), (5, 18.4, 10), (6, 22.9, 10), (7, 27.6, 10), (8, 31.6, 10), (9, 35.4, 10), (10, 46.3, 10), (11, 54.6, 10), (12, 62.2, 10)])],
  'rows': [
   (1, 'Nhãn “Dựa trên cảnh báo của …”', ['issuingAgency'], 'nhap', ''),
   (2, 'Tiêu đề', ['title'], 'nhap', ''),
   (3, 'Ngày cập nhật, thời gian đọc, mức độ', ['updatedDate', 'cautionLevel'], 'nhap', 'Thời gian đọc tự tính. Quá 90 ngày thì hiện thêm “Nội dung đang chờ rà soát”.'),
   (4, 'Dòng “Mẫu trình bày”', [], 'khac', 'Theo công tắc ở trang Cảnh báo mới.'),
   (5, 'Tóm tắt', ['description'], 'nhap', 'Cũng là mô tả trên thẻ ở danh sách.'),
   (6, 'Nguồn cảnh báo', ['issuingAgency', 'documentNumber', 'documentDate', 'documentUrl'], 'nhap', ''),
   (7, 'Ai dễ bị nhắm tới', ['audiences'], 'nhap', 'Chọn từ Danh mục › Đối tượng. Bấm chip thì lọc danh sách.'),
   (8, 'Kênh', ['channels'], 'nhap', 'Chọn từ Danh mục › Kênh tiếp cận.'),
   (9, 'Kịch bản thường gặp', ['scenarioSteps'], 'nhap', '3–5 bước, đánh số tự động.'),
   (10, 'Dấu hiệu', ['stopSigns', 'otherSigns'], 'nhap', 'Dấu hiệu phải dừng chọn từ Danh mục; câu dưới cùng cố định. Hộp xanh “Chưa chuyển tiền cho tới khi đã kiểm chứng” ở vài cảnh báo chưa có công tắc: đề xuất “Hiện hộp hoãn kiểm chứng” (Bật/tắt).'),
   (11, 'Việc cần làm', ['actionPage'], 'nhap', 'Dòng thứ hai “Tôi đang gặp chuyện gì?” cố định, dẫn tới trình hỏi.'),
   (12, 'Bài liên quan', ['tactics', 'relatedItems'], 'nhap', 'Trống thì tự lấy: bài hướng dẫn cùng chuyên đề, thủ đoạn liên quan, danh sách kiểm tra của chuyên đề.'),
   (None, 'Mức độ phổ biến', ['popularity', 'popularityBasis'], 'nhap', 'Bản dựng chưa hiện trên trang cảnh báo; dùng để lọc, sắp ở trang chủ.'),
  ]},
 {'id': 'hd', 'nav': 'Bài hướng dẫn', 'url': '/cac-rui-ro/<nhóm>/<tên bài>', 'type': 'riskArticlePage', 'kind': 'Bài hướng dẫn',
  'what': 'Bài viết loại “Bài hướng dẫn”: cách nhận ra và xử lý một nhóm thủ đoạn.',
  'where': ['Quản lý nội dung', 'Bài viết', 'một bài, Loại bài = Bài hướng dẫn'],
  'imgs': [('huong-dan', 'Bài hướng dẫn Chuyên đề 7', [(1, 3.4, 10), (2, 4.6, 10), (3, 8.7, 50), (4, 14.2, 10), (5, 16, 10), (6, 17, 30), (7, 18.6, 30), (8, 20.8, 10), (9, 24.6, 10), (10, 31, 30), (11, 32.2, 10), (12, 37.2, 10), (13, 46.5, 10), (14, 53.2, 10), (15, 55.6, 30), (16, 60, 10), (17, 69, 30), (18, 71.8, 10), (19, 77, 10), (20, 85, 10)])],
  'rows': [
   (1, 'Nhãn “Bài hướng dẫn · Chuyên đề 7”, tiêu đề', ['articleKind', 'topic', 'title'], 'nhap', ''),
   (2, 'Ngày cập nhật, thời gian đọc, mức độ', ['reviewDate', 'cautionLevel'], 'nhap', 'Thời gian đọc tự tính.'),
   (3, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (4, 'Mục lục “Trong bài này”', [], 'tu', '7 mục cố định của mẫu bài.'),
   (5, 'Tóm tắt', ['summary'], 'nhap', 'Bản dựng không có đoạn tóm tắt riêng; đề xuất hiện ngay dưới tiêu đề mục.'),
   (6, 'Hộp “Nhớ một câu”', [], 'thieu', 'Bản dựng lấy từ bài đọc chuyên đề. Đề xuất: trường “Nhớ một câu” (Chữ · 140).'),
   (7, 'Hộp “Câu hỏi phải hỏi”', [], 'thieu', 'Đề xuất: trường “Câu hỏi phải hỏi” (Đoạn · 200).'),
   (8, 'Ai thường bị nhắm đến, Kênh tiếp cận', ['audiences', 'channels'], 'nhap', 'Ở cột phải, khối Gắn nhãn.'),
   (9, 'Dấu hiệu', ['warningSigns'], 'nhap', 'Câu dẫn trên danh sách cố định.'),
   (10, 'Hộp “Cần hoãn lại để kiểm chứng khi”', [], 'thieu', 'Đề xuất: trường “Cần hoãn khi” (Đoạn · 300), trống thì ẩn.'),
   (11, 'Kịch bản', ['scenarios'], 'nhap', 'Tên kịch bản và diễn biến từng bước, trong “Thêm chi tiết”.'),
   (12, 'Thủ đoạn thường gặp', [], 'khac', 'Tự lấy các thủ đoạn có “Bài viết chứa thủ đoạn” là bài này (Danh mục › Thủ đoạn), kèm mức độ của từng thủ đoạn.'),
   (13, 'Bảng “Vì sao người cẩn thận vẫn quyết định sai”', ['readingBody'], 'khac', 'Chèn bảng trong ô Nội dung (nút Bảng).'),
   (14, 'Việc cần làm ngay', ['actionsNow'], 'nhap', ''),
   (15, 'Hộp “Khi phải dừng”, “Khi cần hoãn”', [], 'thieu', 'Bản dựng lấy từ bảng Cách xử lý của bài đọc chuyên đề. Đề xuất: bảng 2 dòng “Khi phải dừng / Khi cần hoãn” (Khi nào, Làm ngay).'),
   (16, 'Nếu đã lỡ: các bước', [], 'thieu', 'Đề xuất: trường “Nếu đã lỡ” (Danh sách dòng, ≤ 6).'),
   (17, 'Hộp “Cảnh giác với người hứa lấy lại tiền”', [], 'khac', 'Đoạn dùng chung (Quản lý nội dung › Đoạn dùng chung), hiện cố định ở mọi bài hướng dẫn.'),
   (18, 'Không nên làm', ['avoidActions'], 'nhap', 'Trong “Thêm chi tiết”.'),
   (19, 'Bài liên quan', ['relatedItems', 'checklist'], 'nhap', 'Trống thì tự lấy: danh sách kiểm tra, kiểm tra nhanh, bài cùng nhóm.'),
   (20, 'Nguồn, rà soát gần nhất', ['references', 'reviewDate', 'reviewer'], 'nhap', ''),
  ]},
 {'id': 'cd', 'nav': 'Bài đọc chuyên đề', 'url': '/cac-rui-ro/<nhóm>/bai-doc-chuyen-de-<số>', 'type': 'riskArticlePage', 'kind': 'Bài đọc chuyên đề',
  'what': '8 bài, mỗi chuyên đề một bài, dẫn tới bộ câu hỏi luyện tập.',
  'where': ['Quản lý nội dung', 'Bài viết', 'một bài, Loại bài = Bài đọc chuyên đề'],
  'imgs': [('doc-chuyen-de', 'Bài đọc Chuyên đề 6', [(1, 3.2, 10), (2, 4.6, 10), (3, 8.4, 50), (4, 11.9, 10), (5, 14.4, 10), (6, 30, 10), (7, 86.9, 10), (8, 88.7, 10)])],
  'rows': [
   (1, 'Thanh CĐ 1–8', [], 'khac', 'Tự lấy từ Danh mục › Chuyên đề (số, tên ngắn) và bài đọc của từng chuyên đề.'),
   (2, 'Nhãn “Bài đọc · Chuyên đề 6”, tiêu đề', ['articleKind', 'topic', 'title'], 'nhap', ''),
   (3, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (4, 'Câu dưới ảnh “Đọc khoảng 13 phút…”', ['description'], 'nhap', ''),
   (5, 'Mục lục “Trong bài này”', [], 'tu', 'Lấy từ các tiêu đề trong ô Nội dung.'),
   (6, 'Thân bài', ['readingBody'], 'nhap', 'Hộp Nhớ một câu, Câu hỏi của bài, bảng, bảng kiểm bỏ túi… chèn bằng menu “Kiểu”.'),
   (7, 'Hộp “Cảnh giác với người hứa lấy lại tiền”', [], 'khac', 'Đoạn dùng chung, hoặc hộp trong Nội dung.'),
   (8, 'Khối “Giờ hãy làm bài”', [], 'tu', 'Số câu lấy từ ngân hàng câu hỏi của chuyên đề; nút mở bài luyện tập.'),
  ]},
 {'id': 'dt', 'nav': 'Bài đọc thêm', 'url': '/cac-rui-ro/<nhóm>/<tên bài>', 'type': 'riskArticlePage', 'kind': 'Bài đọc thêm',
  'what': 'Bài phân tích, câu chuyện, kiến thức nền. Không cần dấu hiệu, việc cần làm.',
  'where': ['Quản lý nội dung', 'Bài viết', 'một bài, Loại bài = Bài đọc thêm'],
  'imgs': [('doc-them', 'Bài đọc thêm', [(1, 4.6, 10), (2, 5.9, 10), (3, 11.5, 50), (4, 17.4, 10), (5, 19.2, 10), (6, 30, 10), (7, 81, 10)])],
  'rows': [
   (1, 'Nhãn loạt bài “Lừa đảo: từ cổ chí kim · Bài 1”', [], 'thieu', 'Chưa có loạt bài. Đề xuất: trường “Loạt bài” (Chữ · 80) và “Thứ tự trong loạt” (Số).'),
   (2, 'Tiêu đề', ['title'], 'nhap', ''),
   (3, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (4, 'Đoạn mở đầu', ['summary'], 'nhap', 'Dùng ô Tóm tắt.'),
   (5, 'Thời gian đọc, nút Nghe, Chữ lớn, In, Gửi', [], 'tu', ''),
   (6, 'Thân bài', ['readingBody'], 'nhap', ''),
   (7, 'Khối “Đọc tiếp · Bài 2”', [], 'thieu', 'Cần loạt bài và thứ tự ở mục 1; tự lấy bài kế tiếp cùng loạt.'),
  ]},
]

# Form backoffice: nhom truong theo Phu luc A; (alias, nhan, kieu, bat buoc)
FORMS = {
 'riskCategoryPage': [('Nội dung', [('tabName', 'Tên tab', 'Chữ · 28', '*'), ('cardDescription', 'Mô tả ngắn trên thẻ trang chủ', 'Chữ · 60', '*'), ('lead', 'Câu dẫn đầu trang', 'Đoạn · 220', '*'), ('icon', 'Biểu tượng', 'Danh mục · Biểu tượng', '*'), ('thumbnail', 'Ảnh thu nhỏ', 'Chọn ảnh', ''), ('tactics', 'Thủ đoạn hiện trong nhóm', 'Chọn · Thủ đoạn, nhiều', ''), ('pinnedArticles', 'Bài ghim đầu danh sách', 'Chọn · Bài viết, ≤ 2', ''), ('noAnswerNote', 'Câu “Không thấy câu trả lời?”', 'Đoạn · 200', '')]),
                      ('Ảnh minh họa', [('illustration', 'Ảnh minh họa', 'Chọn ảnh', ''), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh')])],
 'alertListPage': [('Nội dung', [('title', 'Tiêu đề', 'Chữ · 90', '*'), ('lead', 'Câu dẫn', 'Đoạn · 220', '*'), ('showSampleNote', 'Dòng “Mẫu trình bày”', 'Bật/tắt', '')]),
                   ('Ảnh minh họa', [('illustration', 'Ảnh minh họa', 'Chọn ảnh', ''), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh')])],
 'alertPage': [('Nội dung', [('title', 'Tiêu đề', 'Chữ · 110', '*'), ('description', 'Mô tả 1 dòng (Tóm tắt)', 'Đoạn · 160', '*'), ('cautionLevel', 'Mức độ cần thận trọng', 'Danh mục · Mức độ', '*'), ('popularity', 'Mức độ phổ biến', 'Chọn · Mức độ phổ biến', '*'), ('popularityBasis', 'Căn cứ mức độ phổ biến', 'Chữ · 160', ''), ('scenarioSteps', 'Kịch bản thường gặp', 'Danh sách dòng 3–5', 'khi đăng'), ('stopSigns', 'Dấu hiệu nhận biết', 'Chọn · Dấu hiệu phải dừng', ''), ('otherSigns', 'Dấu hiệu khác', 'Danh sách dòng 0–4', ''), ('actionPage', 'Việc cần làm: trang', 'Chọn · Việc cần làm', 'khi đăng')]),
               ('Nguồn', [('issuingAgency', 'Cơ quan ban hành', 'Chữ · 120', ''), ('documentNumber', 'Số văn bản', 'Chữ · 40', ''), ('documentDate', 'Ngày văn bản', 'Ngày', ''), ('documentUrl', 'Liên kết văn bản gốc', 'Chữ · https', '')]),
               ('Phân loại', [('channels', 'Kênh', 'Chọn · Kênh, nhiều', 'khi đăng'), ('audiences', 'Đối tượng dễ bị nhắm tới', 'Chọn · Đối tượng, nhiều', 'khi đăng'), ('tactics', 'Thủ đoạn liên quan', 'Chọn · Thủ đoạn, ≤ 8', ''), ('alsoInCategories', 'Hiện thêm ở nhóm', 'Chọn · Nhóm rủi ro', ''), ('relatedItems', 'Bài liên quan', 'Chọn · Bài liên quan, ≤ 4', ''), ('searchKeywords', 'Từ khóa tìm kiếm', 'Thẻ', '')]),
               ('Đăng, gỡ', [('updatedDate', 'Ngày cập nhật', 'Ngày', '*'), ('autoUnpublishDays', 'Tự gỡ sau (ngày)', 'Số 30–720', '*')]),
               ('Ảnh minh họa', [('illustration', 'Ảnh minh họa', 'Chọn ảnh', ''), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh')])],
 'riskArticlePage': [('Cột trái · Bài viết', [('title', 'Tiêu đề', 'Chữ · 110', '*'), ('description', 'Một câu mời đọc', 'Đoạn · 160', '*'), ('summary', 'Tóm tắt', 'Soạn thảo · Chỉ in đậm', 'khi đăng')]),
                     ('Cột trái · Nhận ra và xử lý (chỉ Bài hướng dẫn)', [('warningSigns', 'Dấu hiệu cảnh báo', 'Danh sách dòng 0–8', 'khi đăng'), ('actionsNow', 'Việc cần làm ngay', 'Danh sách dòng 0–6', 'khi đăng')]),
                     ('Cột trái · Nội dung, Nguồn', [('readingBody', 'Nội dung', 'Soạn thảo · Bài đọc', ''), ('references', 'Nguồn', 'Bảng: tên, đơn vị, liên kết, ngày', 'khi đăng')]),
                     ('Cột trái · Thêm chi tiết (thu gọn)', [('scenarios', 'Kịch bản thường gặp', 'Thẻ: tên, các bước', ''), ('avoidActions', 'Việc không nên làm', 'Danh sách dòng 0–6', ''), ('actionPage', 'Dẫn tới trang việc cần làm', 'Chọn · Việc cần làm', ''), ('topic', 'Chuyên đề', 'Chọn · Chuyên đề', ''), ('alsoInCategories', 'Hiện thêm ở nhóm', 'Chọn · Nhóm rủi ro', ''), ('searchKeywords', 'Từ người dân hay gõ khi tìm', 'Thẻ', ''), ('synonyms', 'Từ cùng nghĩa', 'Thẻ', ''), ('relatedItems', 'Bài liên quan', 'Chọn, ≤ 4', ''), ('checklist', 'Danh sách kiểm tra đi kèm', 'Chọn · Danh sách kiểm tra', ''), ('icon', 'Biểu tượng trên thẻ', 'Danh mục · Biểu tượng', ''), ('isFeatured', 'Nổi bật', 'Bật/tắt', '')]),
                     ('Cột phải · Xuất bản', [('primaryGroup', 'Đăng ở nhóm', 'Chọn · Nhóm rủi ro', '*'), ('articleKind', 'Loại bài', 'Thẻ chọn: 3 loại', '*')]),
                     ('Cột phải · Gắn nhãn (chỉ Bài hướng dẫn)', [('cautionLevel', 'Mức độ', 'Danh mục · Mức độ', 'khi đăng'), ('channels', 'Thường gặp qua kênh', 'Chọn · Kênh', 'khi đăng'), ('audiences', 'Ai hay bị nhắm tới', 'Chọn · Đối tượng', 'khi đăng')]),
                     ('Cột phải · Thẩm định', [('reviewDate', 'Ngày rà soát', 'Ngày', 'khi đăng'), ('reviewer', 'Người thẩm định', 'Chữ · 120', 'khi đăng'), ('version', 'Phiên bản', 'Chữ · 20', '')]),
                     ('Ảnh minh họa', [('illustration', 'Ảnh minh họa', 'Chọn ảnh', ''), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh')])],
}
TYPENAME = {'riskCategoryPage': 'Nhóm rủi ro', 'alertListPage': 'Cảnh báo mới', 'alertPage': 'Cảnh báo', 'riskArticlePage': 'Bài viết'}

TREE = [
 ('Quản lý nội dung', 0, 'root', ''),
 ('Cảnh báo', 1, 'list', 'Danh sách 10 · thêm hằng ngày → màn “Trang cảnh báo”'),
 ('Bài viết', 1, 'list', 'Danh sách 18 · lọc Nhóm, Loại bài → 3 màn bài viết'),
 ('Đoạn dùng chung', 1, 'list', 'Hộp “Cảnh giác với người hứa lấy lại tiền”'),
 ('Danh mục', 1, 'folder', ''),
 ('Kênh tiếp cận', 2, 'list', '7 · bộ lọc Kênh, chip Kênh'),
 ('Đối tượng', 2, 'list', '5 · bộ lọc Đối tượng, chip “Ai dễ bị nhắm tới”'),
 ('Dấu hiệu phải dừng', 2, 'list', '6 · mục Dấu hiệu của cảnh báo'),
 ('Mức độ phổ biến', 2, 'list', '3 · cảnh báo'),
 ('Chuyên đề', 2, 'list', '8 · thanh CĐ 1–8, nhãn “Chuyên đề 7”'),
 ('Thủ đoạn', 2, 'list', '32 · thẻ Thủ đoạn ở trang nhóm, mục Thủ đoạn thường gặp'),
 ('Quản lý trang', 0, 'root', ''),
 ('Các rủi ro', 1, 'page', 'Không có nội dung riêng; mở thì chuyển tới Cảnh báo mới'),
 ('Cảnh báo mới', 2, 'page', '→ màn “Cảnh báo mới”'),
 ('Lừa đảo · Vay và nợ · Đầu tư · Bảo hiểm và tiết kiệm · Dữ liệu cá nhân', 2, 'page', '5 trang nhóm → màn “Trang nhóm rủi ro”'),
 ('Cài đặt website', 0, 'root', 'Câu cố định: câu miễn trừ tư vấn, Hai điều phải nhớ; nhãn mức độ'),
]

def b64(name):
    with open(os.path.join(imgdir, name + '.jpg'), 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()

E = html.escape
STLABEL = {'nhap': 'Nhập ở form này', 'khac': 'Nhập ở chỗ khác', 'tu': 'Tự động', 'thieu': 'Chưa có chỗ nhập'}

def md(t):
    out, parts = [], t.split('`')
    for i, p in enumerate(parts):
        out.append('<code>%s</code>' % E(p) if i % 2 else E(p))
    return ''.join(out)

def screen_html(sc):
    fieldnum = {}
    for n, _, fields, st, _ in sc['rows']:
        for a in fields:
            if st == 'nhap' and n: fieldnum.setdefault(a, []).append(n)
    imgs = []
    for name, cap, pins in sc['imgs']:
        pinh = ''.join('<button type="button" class="pin" data-n="%d" style="top:%s%%;left:%s%%" aria-label="Khối %d">%d</button>' % (n, t, l, n, n) for n, t, l in pins)
        imgs.append('<figure class="shot"><figcaption>%s</figcaption><div class="shotbox"><div class="inner"><img src="%s" alt="Ảnh chụp màn %s trên website">%s</div></div></figure>' % (E(cap), b64(name), E(cap), pinh))
    rows = []
    for n, block, fields, st, note in sc['rows']:
        f = ' '.join('<code>%s</code>' % E(a) for a in fields)
        rows.append('<tr data-n="%s" class="st-%s"><td class="num">%s</td><td><b>%s</b>%s</td><td><span class="tag %s">%s</span>%s</td></tr>' % (
            n or '', st, ('<span class="nb">%d</span>' % n) if n else '–', E(block), ('<div class="note">%s</div>' % md(note)) if note else '',
            st, STLABEL[st], ('<div class="fl">%s</div>' % f) if f else ''))
    gaps = sum(1 for r in sc['rows'] if r[3] == 'thieu')
    form = []
    for g, fl in FORMS[sc['type']]:
        items = []
        for a, l, t, req in fl:
            nums = fieldnum.get(a, [])
            items.append('<li data-f="%s"%s><span class="fn">%s</span><span class="fx"><b>%s</b>%s<small>%s · <code>%s</code></small></span></li>' % (
                a, (' data-n="%s"' % nums[0]) if nums else '', ''.join('<span class="nb">%d</span>' % x for x in nums) or '<span class="nb off">·</span>', E(l),
                ('<span class="req">%s</span>' % E(req if req != '*' else 'bắt buộc')) if req else '', E(t), E(a)))
        form.append('<div class="fg"><h4>%s</h4><ul>%s</ul></div>' % (E(g), ''.join(items)))
    kind = (' · Loại bài: <b>%s</b>' % E(sc['kind'])) if sc.get('kind') else ''
    return ('<section class="screen" id="%s"><header class="sh"><h2>%s</h2><p class="url"><code>%s</code></p><p>%s</p>'
            '<p class="where"><span>Nhập ở</span>%s</p>%s</header>'
            '<div class="cols"><div class="left">%s</div><div class="right">'
            '<div class="card"><h3>Khối trên website và chỗ nhập</h3><div class="tblwrap"><table class="map"><thead><tr><th>Số</th><th>Khối</th><th>Nhập ở</th></tr></thead><tbody>%s</tbody></table></div></div>'
            '<div class="card"><h3>Form backoffice · %s <code>%s</code>%s</h3><p class="small">Số bên trái là khối trên website. Dấu “·” là trường không hiện trực tiếp trên màn này.</p>%s</div>'
            '</div></div></section>') % (
        sc['id'], E(sc['nav']), E(sc['url']), E(sc['what']), ' › '.join('<b>%s</b>' % E(x) for x in sc['where']),
        ('<p class="gapnote">%d khối chưa có chỗ nhập, xem cột Nhập ở.</p>' % gaps) if gaps else '',
        ''.join(imgs), ''.join(rows), E(TYPENAME[sc['type']]), E(sc['type']), kind, ''.join(form))

tree = ''.join('<li class="lv%d %s"><span class="tn">%s</span>%s</li>' % (lv, k, E(n), ('<small>%s</small>' % E(d)) if d else '') for n, lv, k, d in TREE)
gaps = [(sc['nav'], sc['id'], r) for sc in SCREENS for r in sc['rows'] if r[3] == 'thieu']
gaprows = ''.join('<tr><td><a href="#%s">%s</a></td><td>%s%s</td><td>%s</td></tr>' % (sid, E(nav), ('<span class="nb">%d</span> ' % r[0]) if r[0] else '', E(r[1]), md(r[4])) for nav, sid, r in gaps)
nav = ''.join('<a href="#%s">%s</a>' % (sc['id'], E(sc['nav'])) for sc in SCREENS)

PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bo-cac-rui-ro.tpl.html'), encoding='utf-8').read()
PAGE = (PAGE.replace('{{NAV}}', nav).replace('{{TREE}}', tree).replace('{{GAPS}}', gaprows).replace('{{NGAPS}}', str(len(gaps)))
        .replace('{{SCREENS}}', ''.join(screen_html(sc) for sc in SCREENS)))
open(out, 'w', encoding='utf-8', newline='\n').write(PAGE)
print('screens', len(SCREENS), 'gaps', len(gaps), 'bytes', len(PAGE))
