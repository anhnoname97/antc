"""Dung mockup ban giao phan Cac rui ro: man website (anh danh so) <-> cho nhap trong backoffice.

python dung_bo_cac_rui_ro.py anh-portal-rui-ro ../mockup/bo-cac-rui-ro.html
Anh chup tu mockup/antoantaichinh_v2.html o be rong 1440 px. Vi tri so (top %, left %) tinh tren anh.
Nguyen tac: cai gi suy ra duoc tu du lieu da co thi website tu lay; form chi giu cai nguoi viet moi biet.
Truong va alias theo Phu luc A; truong danh dau 'moi' la de xuat, chua co trong Phu luc A.
"""
import sys, os, base64, html

imgdir, out = sys.argv[1:3]

# Trang thai moi khoi: nhap = nhap o form nay; khac = nhap o cho khac; tu = website tu lay
SCREENS = [
 {'id': 'nhom', 'nav': 'Trang nhóm rủi ro', 'url': '/cac-rui-ro/lua-dao', 'forms': ['riskCategoryPage'],
  'what': '5 trang: Lừa đảo, Vay và nợ, Đầu tư, Bảo hiểm và tiết kiệm, Dữ liệu cá nhân. Không thêm, không xóa. Gần như mọi thứ trên trang tự lấy từ bài viết, cảnh báo, thủ đoạn.',
  'where': ['Quản lý trang', 'Các rủi ro', 'Lừa đảo'],
  'imgs': [('nhom-lua-dao', 'Nhóm Lừa đảo', [(1, 7.4, 10), (2, 19, 50), (3, 32.2, 10), (4, 38.6, 10), (5, 44.5, 10), (6, 51.3, 12), (7, 72.2, 10), (8, 75.4, 10)]),
           ('nhom-dau-tu', 'Nhóm Đầu tư', [(9, 35.6, 10)])],
  'rows': [
   (1, 'Biểu tượng, tên nhóm, câu dẫn', ['tabName', 'icon', 'lead'], 'nhap', 'Tên nhóm cũng là chữ trên thanh tab.'),
   (2, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (3, 'Thanh 6 tab', [], 'tu', 'Cảnh báo mới và 5 nhóm, theo thứ tự trang con của Các rủi ro trên cây.'),
   (4, 'Ô tìm và bộ lọc Kênh, Đối tượng, Mức độ', [], 'tu', 'Giá trị lọc lấy từ Danh mục › Kênh tiếp cận, Đối tượng; Mức độ là danh sách cố định.'),
   (5, 'Danh sách thẻ', [], 'tu', 'Bài viết có Đăng ở nhóm hoặc Hiện thêm ở nhóm là nhóm này; thủ đoạn nằm trong các bài hướng dẫn của nhóm; bài “Ghim đầu nhóm” lên trước, còn lại mới nhất trước. 12 thẻ một lần.'),
   (6, 'Thẻ “Việc cần làm ngay”', [], 'tu', 'Các trang việc cần làm mà bài viết, cảnh báo trong nhóm dẫn tới (ô “Dẫn tới trang việc cần làm” của từng bài).'),
   (7, 'Bộ khung nhận diện mọi thủ đoạn', [], 'khac', 'Một Đoạn dùng chung có sẵn tên “Bộ khung nhận diện”. Website hiện cố định ở nhóm Lừa đảo, không cần chọn.'),
   (8, 'Hộp “Không thấy câu trả lời?”', [], 'khac', 'Một câu chung cho cả 6 tab, sửa ở Cài đặt website › Câu cố định.'),
   (9, 'Hộp “Website không tư vấn tài chính”', ['showAdviceBox'], 'nhap', 'Một công tắc. Chữ trong hộp lấy ở Cài đặt website (Câu miễn trừ tư vấn, Hai điều phải nhớ).'),
   (None, 'Dòng “Bài riêng … đang được biên soạn”', [], 'tu', 'Hiện khi nhóm chưa có bài nào có Đăng ở nhóm là nhóm này; chữ cố định.'),
  ]},
 {'id': 'cbm', 'nav': 'Cảnh báo mới (danh sách)', 'url': '/cac-rui-ro/canh-bao-moi', 'forms': ['alertListPage'],
  'what': 'Một trang. Danh sách lấy từ Quản lý nội dung › Cảnh báo.',
  'where': ['Quản lý trang', 'Các rủi ro', 'Cảnh báo mới'],
  'imgs': [('canh-bao-moi', 'Cảnh báo mới', [(1, 6.6, 10), (2, 13.8, 50), (3, 19.3, 10), (4, 21.6, 10), (5, 27.4, 10), (6, 34.3, 10), (7, 68.2, 10), (8, 79, 10)])],
  'rows': [
   (1, 'Tên trang, câu dẫn', ['title', 'lead'], 'nhap', ''),
   (2, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (3, 'Thanh 6 tab', [], 'tu', 'Như trang nhóm.'),
   (4, 'Dòng “Mẫu trình bày”', ['showSampleNote'], 'nhap', 'Tắt khi đã có cảnh báo thật; cũng ẩn dòng này ở từng trang cảnh báo.'),
   (5, 'Ô tìm và 4 bộ lọc (thêm Ngày)', [], 'tu', '30 ngày qua, 90 ngày qua, Lưu trữ; tính theo Ngày cập nhật.'),
   (6, 'Thẻ cảnh báo', [], 'khac', 'Từ từng cảnh báo: ngày, cơ quan, tiêu đề, tóm tắt, mức độ. “Mới nhất” và thời gian đọc tự tính.'),
   (7, 'Mục “Lưu trữ · quá 90 ngày”', [], 'tu', 'Cảnh báo quá 90 ngày tự xuống đây; quá hạn tự gỡ thì tự ẩn.'),
   (8, 'Hộp “Không thấy câu trả lời?”', [], 'khac', 'Câu chung ở Cài đặt website.'),
  ]},
 {'id': 'cb', 'nav': 'Trang cảnh báo', 'url': '/cac-rui-ro/canh-bao-moi/<tên cảnh báo>', 'forms': ['alertPage'],
  'what': 'Biên tập viên thêm hằng ngày. Chọn thủ đoạn trước: kênh, đối tượng được điền sẵn theo thủ đoạn, bài liên quan và nhóm hiện bài tự suy ra.',
  'where': ['Quản lý nội dung', 'Cảnh báo', 'một cảnh báo'],
  'imgs': [('canh-bao', 'Một cảnh báo', [(1, 8.1, 10), (2, 9.9, 10), (3, 11.5, 10), (4, 15.6, 10), (5, 18.4, 10), (6, 22.9, 10), (7, 27.6, 10), (8, 31.6, 10), (9, 35.4, 10), (10, 46.3, 10), (11, 54.6, 10), (12, 62.2, 10)])],
  'rows': [
   (1, 'Nhãn “Dựa trên cảnh báo của …”', ['issuingAgency'], 'nhap', ''),
   (2, 'Tiêu đề', ['title'], 'nhap', ''),
   (3, 'Ngày cập nhật, thời gian đọc, mức độ', ['updatedDate', 'cautionLevel'], 'nhap', 'Thời gian đọc tự tính; quá 90 ngày tự hiện “đang chờ rà soát”.'),
   (4, 'Dòng “Mẫu trình bày”', [], 'khac', 'Theo công tắc ở trang Cảnh báo mới.'),
   (5, 'Tóm tắt', ['description'], 'nhap', 'Cũng là mô tả trên thẻ.'),
   (6, 'Nguồn cảnh báo', ['issuingAgency', 'documentNumber', 'documentDate', 'documentUrl'], 'nhap', ''),
   (7, 'Ai dễ bị nhắm tới', ['audiences'], 'nhap', 'Điền sẵn từ các thủ đoạn đã chọn (Danh mục › Đối tượng › Thủ đoạn hay gặp); sửa được.'),
   (8, 'Kênh', ['channels'], 'nhap', 'Điền sẵn từ kênh của các thủ đoạn đã chọn; sửa được.'),
   (9, 'Kịch bản thường gặp', ['scenarioSteps'], 'nhap', '3–5 bước.'),
   (10, 'Dấu hiệu', ['stopSigns', 'otherSigns'], 'nhap', 'Hộp xanh “Chưa chuyển tiền cho tới khi đã kiểm chứng” tự hiện khi Mức độ là Cao.'),
   (11, 'Việc cần làm', ['actionPage'], 'nhap', 'Dòng “Tôi đang gặp chuyện gì?” cố định.'),
   (12, 'Bài liên quan', ['tactics'], 'tu', 'Tự lấy: bài hướng dẫn chứa các thủ đoạn đã chọn, chính các thủ đoạn đó, danh sách kiểm tra cùng chuyên đề. Không còn ô chọn bài liên quan.'),
   (None, 'Hiện ở nhóm nào', ['tactics'], 'tu', 'Ngoài Cảnh báo mới, cảnh báo hiện ở các nhóm có bài hướng dẫn chứa thủ đoạn đã chọn.'),
   (None, 'Mức độ phổ biến', ['popularity', 'popularityBasis'], 'nhap', 'Bản dựng chưa hiện trên trang cảnh báo; dùng ở trang chủ.'),
  ]},
 {'id': 'hd', 'nav': 'Bài hướng dẫn', 'url': '/cac-rui-ro/<nhóm>/<tên bài>', 'forms': ['riskArticlePage', 'topicItem'], 'kind': 'Bài hướng dẫn',
  'what': 'Bài viết loại “Bài hướng dẫn”. Phần dùng chung cho cả chuyên đề (Nhớ một câu, Câu hỏi phải hỏi, Khi nào dừng, Khi nào hoãn) nhập một lần ở Danh mục › Chuyên đề.',
  'where': ['Quản lý nội dung', 'Bài viết', 'một bài, Loại bài = Bài hướng dẫn'],
  'imgs': [('huong-dan', 'Bài hướng dẫn Chuyên đề 7', [(1, 3.4, 10), (2, 4.6, 10), (3, 8.7, 50), (4, 14.2, 10), (5, 16, 10), (6, 17, 30), (7, 18.6, 30), (8, 20.8, 10), (9, 24.6, 10), (10, 31, 30), (11, 32.2, 10), (12, 37.2, 10), (13, 46.5, 10), (14, 53.2, 10), (15, 55.6, 30), (16, 60, 10), (17, 69, 30), (18, 71.8, 10), (19, 77, 10), (20, 85, 10)])],
  'rows': [
   (1, 'Nhãn “Bài hướng dẫn · Chuyên đề 7”, tiêu đề', ['articleKind', 'topic', 'title'], 'nhap', ''),
   (2, 'Ngày cập nhật, thời gian đọc, mức độ', ['reviewDate'], 'nhap', 'Mức độ tự lấy: mức cao nhất trong các thủ đoạn của bài. Thời gian đọc tự tính.'),
   (3, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (4, 'Mục lục “Trong bài này”', [], 'tu', '7 mục cố định.'),
   (5, 'Tóm tắt', ['summary'], 'nhap', ''),
   (6, 'Hộp “Nhớ một câu”', ['rememberLine'], 'khac', 'Danh mục › Chuyên đề. Dùng chung cho bài hướng dẫn, bài đọc, danh sách kiểm tra của chuyên đề.'),
   (7, 'Hộp “Câu hỏi phải hỏi”', ['mustAsk'], 'khac', 'Danh mục › Chuyên đề.'),
   (8, 'Ai thường bị nhắm đến, Kênh tiếp cận', [], 'tu', 'Tự lấy từ các thủ đoạn của bài (kênh của thủ đoạn; đối tượng có thủ đoạn đó).'),
   (9, 'Dấu hiệu', ['warningSigns'], 'nhap', ''),
   (10, 'Hộp “Cần hoãn lại để kiểm chứng khi”', ['holdWhen'], 'khac', 'Danh mục › Chuyên đề.'),
   (11, 'Kịch bản', ['scenarios'], 'nhap', ''),
   (12, 'Thủ đoạn thường gặp', [], 'tu', 'Thủ đoạn có “Bài viết chứa thủ đoạn” là bài này, kèm mức độ.'),
   (13, 'Bảng “Vì sao người cẩn thận vẫn quyết định sai”', ['readingBody'], 'nhap', 'Chèn bảng trong ô Nội dung.'),
   (14, 'Việc cần làm ngay', ['actionsNow'], 'nhap', ''),
   (15, 'Hộp “Khi phải dừng”, “Khi cần hoãn”', ['stopWhen', 'holdWhen'], 'khac', '“Khi nào” ở Danh mục › Chuyên đề; “Làm ngay” lấy từ Danh sách kiểm tra cùng chuyên đề (đã nhập ở đó).'),
   (16, 'Nếu đã lỡ: các bước', ['actionPage'], 'tu', 'Lấy nguyên các bước của trang Việc cần làm đã chọn ở “Dẫn tới trang việc cần làm”.'),
   (17, 'Hộp “Cảnh giác với người hứa lấy lại tiền”', [], 'khac', 'Đoạn dùng chung, hiện cố định.'),
   (18, 'Không nên làm', ['avoidActions'], 'nhap', ''),
   (19, 'Bài liên quan', [], 'tu', 'Danh sách kiểm tra và kiểm tra nhanh cùng chuyên đề, bài hướng dẫn cùng nhóm, 3 bài đọc thêm mới nhất của nhóm. Không còn ô chọn.'),
   (20, 'Nguồn, rà soát gần nhất', ['references', 'reviewDate', 'reviewer'], 'nhap', ''),
  ]},
 {'id': 'td', 'nav': 'Thủ đoạn', 'url': 'không có trang riêng', 'forms': ['tacticItem'],
  'what': 'Thủ đoạn không có trang riêng. Nó hiện ở hai chỗ: thẻ trong danh sách của trang nhóm, và mục “Thủ đoạn thường gặp” trong bài hướng dẫn chứa nó. Nhập ở Danh mục › Thủ đoạn; trong form bài hướng dẫn có khối “Thủ đoạn trong bài” liệt kê và nút thêm.',
  'where': ['Quản lý nội dung', 'Danh mục', 'Thủ đoạn'],
  'imgs': [('nhom-lua-dao', 'Trang nhóm Lừa đảo: thẻ thủ đoạn', [(1, 64.3, 14)]),
           ('huong-dan-6', 'Bài hướng dẫn Mua bán, đặt cọc: mục Thủ đoạn thường gặp', [(2, 39.0, 10), (3, 40.4, 12)])],
  'rows': [
   (1, 'Thẻ “Thủ đoạn” trong danh sách trang nhóm', ['containingArticle', 'channels', 'cautionLevel'], 'khac', 'Tên thủ đoạn; dòng phụ là tên ngắn chuyên đề và các kênh; mức độ; thời gian đọc của bài chứa. Thẻ hiện ở nhóm của bài chứa thủ đoạn. Bấm thẻ thì mở bài đó, cuộn tới mục 2 và tô sáng dòng của thủ đoạn.'),
   (2, 'Mục “Thủ đoạn thường gặp” cuối phần Kịch bản', ['containingArticle'], 'tu', 'Không có ô trong form bài viết. Website liệt kê mọi thủ đoạn có “Bài viết chứa thủ đoạn” là bài này, theo thứ tự kéo ở Danh mục › Thủ đoạn.'),
   (3, 'Một dòng: tên thủ đoạn, mức độ', ['cautionLevel'], 'khac', 'Dòng được tô sáng khi người đọc đến từ thẻ thủ đoạn hoặc từ “Bài liên quan” của cảnh báo.'),
   (None, 'Thủ đoạn ở chỗ khác', ['searchKeywords'], 'tu', 'Bài liên quan của cảnh báo (dòng “Thủ đoạn”), kết quả tìm kiếm theo Từ khóa, bộ lọc Kênh và Mức độ ở trang nhóm.'),
   (None, 'Thủ đoạn ngừng dùng', ['isActive'], 'khac', 'Tắt “Đang dùng” thì thẻ và dòng biến mất khỏi website; cảnh báo cũ vẫn giữ liên kết tới bài.'),
  ]},
 {'id': 'cd', 'nav': 'Bài đọc chuyên đề', 'url': '/cac-rui-ro/<nhóm>/bai-doc-chuyen-de-<số>', 'forms': ['riskArticlePage'], 'kind': 'Bài đọc chuyên đề',
  'what': '8 bài, mỗi chuyên đề một bài.',
  'where': ['Quản lý nội dung', 'Bài viết', 'một bài, Loại bài = Bài đọc chuyên đề'],
  'imgs': [('doc-chuyen-de', 'Bài đọc Chuyên đề 6', [(1, 3.2, 10), (2, 4.6, 10), (3, 8.4, 50), (4, 11.9, 10), (5, 14.4, 10), (6, 30, 10), (7, 86.9, 10), (8, 88.7, 10)])],
  'rows': [
   (1, 'Thanh CĐ 1–8', [], 'tu', 'Từ Danh mục › Chuyên đề và bài đọc của từng chuyên đề.'),
   (2, 'Nhãn “Bài đọc · Chuyên đề 6”, tiêu đề', ['articleKind', 'topic', 'title'], 'nhap', ''),
   (3, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (4, 'Câu “Đọc khoảng 13 phút. Đọc xong rồi hãy làm 23 câu”', ['description'], 'tu', 'Để trống thì tự viết từ thời gian đọc và số câu của chuyên đề; gõ thì dùng câu đã gõ.'),
   (5, 'Mục lục “Trong bài này”', [], 'tu', 'Từ các tiêu đề trong Nội dung.'),
   (6, 'Thân bài', ['readingBody'], 'nhap', 'Hộp, bảng, bảng kiểm bỏ túi chèn bằng menu “Kiểu”.'),
   (7, 'Hộp “Cảnh giác với người hứa lấy lại tiền”', [], 'khac', 'Đoạn dùng chung.'),
   (8, 'Khối “Giờ hãy làm bài”', [], 'tu', 'Số câu từ ngân hàng câu hỏi của chuyên đề.'),
  ]},
 {'id': 'dt', 'nav': 'Bài đọc thêm', 'url': '/cac-rui-ro/<nhóm>/<tên bài>', 'forms': ['riskArticlePage'], 'kind': 'Bài đọc thêm',
  'what': 'Phân tích, câu chuyện, kiến thức nền.',
  'where': ['Quản lý nội dung', 'Bài viết', 'một bài, Loại bài = Bài đọc thêm'],
  'imgs': [('doc-them', 'Bài đọc thêm', [(1, 4.6, 10), (2, 5.9, 10), (3, 11.5, 50), (4, 17.4, 10), (5, 19.2, 10), (6, 30, 10), (7, 81, 10)])],
  'rows': [
   (1, 'Nhãn loạt bài “Lừa đảo: từ cổ chí kim · Bài 1”', ['series'], 'nhap', 'Một ô: chọn loạt đã có hoặc gõ tên loạt mới. Số “Bài 1” tự đếm theo thứ tự kéo trong danh sách Bài viết.'),
   (2, 'Tiêu đề', ['title'], 'nhap', ''),
   (3, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
   (4, 'Đoạn mở đầu', ['summary'], 'nhap', ''),
   (5, 'Thời gian đọc, nút Nghe, Chữ lớn, In, Gửi', [], 'tu', ''),
   (6, 'Thân bài', ['readingBody'], 'nhap', ''),
   (7, 'Khối “Đọc tiếp · Bài 2”', [], 'tu', 'Bài kế tiếp trong cùng loạt; không có loạt thì bài đọc thêm mới nhất của nhóm.'),
  ]},
]

# Form de xuat: (alias, nhan, kieu, bat buoc, moi)
FORMS = {
 'riskCategoryPage': [('Nội dung', [('tabName', 'Tên nhóm', 'Chữ · 28', '*', 0), ('cardDescription', 'Mô tả ngắn trên thẻ trang chủ', 'Chữ · 60', '*', 0), ('lead', 'Câu dẫn đầu trang', 'Đoạn · 220', '*', 0), ('icon', 'Biểu tượng', 'Danh mục · Biểu tượng', '*', 0), ('thumbnail', 'Ảnh thu nhỏ (thẻ ở trang chủ)', 'Chọn ảnh', '', 0), ('showAdviceBox', 'Hiện hộp “Website không tư vấn tài chính”', 'Bật/tắt', '', 1)]),
                      ('Ảnh minh họa', [('illustration', 'Ảnh minh họa', 'Chọn ảnh', '', 0), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh', 0)])],
 'alertListPage': [('Nội dung', [('title', 'Tiêu đề', 'Chữ · 90', '*', 0), ('lead', 'Câu dẫn', 'Đoạn · 220', '*', 0), ('showSampleNote', 'Dòng “Mẫu trình bày”', 'Bật/tắt', '', 0)]),
                   ('Ảnh minh họa', [('illustration', 'Ảnh minh họa', 'Chọn ảnh', '', 0), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh', 0)])],
 'alertPage': [('Cảnh báo', [('title', 'Tiêu đề', 'Chữ · 110', '*', 0), ('description', 'Tóm tắt', 'Đoạn · 160', '*', 0), ('tactics', 'Thủ đoạn', 'Chọn · Thủ đoạn, ≤ 8', 'khi đăng', 0), ('cautionLevel', 'Mức độ cần thận trọng', 'Danh mục · Mức độ', '*', 0), ('scenarioSteps', 'Kịch bản thường gặp', 'Danh sách dòng 3–5', 'khi đăng', 0), ('stopSigns', 'Dấu hiệu phải dừng', 'Chọn · Dấu hiệu', '', 0), ('otherSigns', 'Dấu hiệu khác', 'Danh sách dòng 0–4', '', 0), ('actionPage', 'Việc cần làm: trang', 'Chọn · Việc cần làm', 'khi đăng', 0)]),
               ('Ai, qua đâu (điền sẵn theo thủ đoạn)', [('audiences', 'Ai dễ bị nhắm tới', 'Chọn · Đối tượng', 'khi đăng', 0), ('channels', 'Kênh', 'Chọn · Kênh', 'khi đăng', 0)]),
               ('Nguồn', [('issuingAgency', 'Cơ quan ban hành', 'Chữ · 120', '', 0), ('documentNumber', 'Số văn bản', 'Chữ · 40', '', 0), ('documentDate', 'Ngày văn bản', 'Ngày', '', 0), ('documentUrl', 'Liên kết văn bản gốc', 'Chữ · https', '', 0)]),
               ('Đăng', [('updatedDate', 'Ngày cập nhật', 'Ngày', '*', 0), ('popularity', 'Mức độ phổ biến', 'Chọn · Mức độ phổ biến', '*', 0), ('popularityBasis', 'Căn cứ mức độ phổ biến', 'Chữ · 160', '', 0)]),
               ('Thêm chi tiết (thu gọn)', [('autoUnpublishDays', 'Tự gỡ sau (ngày)', 'Số, mặc định 180', '', 0), ('searchKeywords', 'Từ khóa tìm kiếm', 'Thẻ', '', 0), ('illustration', 'Ảnh minh họa', 'Chọn ảnh', '', 0), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh', 0)])],
 'riskArticlePage': [('Cột trái · Bài viết', [('series', 'Loạt bài (chỉ Bài đọc thêm)', 'Chọn hoặc gõ mới', '', 1), ('title', 'Tiêu đề', 'Chữ · 110', '*', 0), ('description', 'Một câu mời đọc', 'Đoạn · 160', '*', 0), ('summary', 'Tóm tắt', 'Soạn thảo · Chỉ in đậm', 'khi đăng', 0)]),
                     ('Cột trái · Nhận ra và xử lý (chỉ Bài hướng dẫn)', [('warningSigns', 'Dấu hiệu cảnh báo', 'Danh sách dòng 0–8', 'khi đăng', 0), ('actionsNow', 'Việc cần làm ngay', 'Danh sách dòng 0–6', 'khi đăng', 0), ('scenarios', 'Kịch bản thường gặp', 'Thẻ: tên, các bước', '', 0), ('avoidActions', 'Việc không nên làm', 'Danh sách dòng 0–6', '', 0)]),
                     ('Cột trái · Nội dung, Nguồn', [('readingBody', 'Nội dung', 'Soạn thảo · Bài đọc', '', 0), ('references', 'Nguồn', 'Bảng: tên, đơn vị, liên kết, ngày', 'khi đăng', 0)]),
                     ('Cột phải · Xuất bản', [('primaryGroup', 'Đăng ở nhóm', 'Chọn · Nhóm rủi ro', '*', 0), ('articleKind', 'Loại bài', 'Thẻ chọn: 3 loại', '*', 0), ('topic', 'Chuyên đề', 'Chọn · Chuyên đề', 'hướng dẫn, chuyên đề', 0), ('actionPage', 'Dẫn tới trang việc cần làm', 'Chọn · Việc cần làm', '', 0), ('isFeatured', 'Ghim đầu nhóm', 'Bật/tắt', '', 0)]),
                     ('Cột phải · Thẩm định', [('reviewDate', 'Ngày rà soát', 'Ngày', 'khi đăng', 0), ('reviewer', 'Người thẩm định', 'Chữ · 120', 'khi đăng', 0), ('version', 'Phiên bản', 'Chữ · 20', '', 0)]),
                     ('Thêm chi tiết (thu gọn)', [('alsoInCategories', 'Hiện thêm ở nhóm', 'Chọn · Nhóm rủi ro', '', 0), ('searchKeywords', 'Từ người dân hay gõ khi tìm', 'Thẻ', '', 0), ('synonyms', 'Từ cùng nghĩa', 'Thẻ', '', 0), ('illustration', 'Ảnh minh họa', 'Chọn ảnh', '', 0), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh', 0)])],
 'tacticItem': [('Thủ đoạn', [('name', 'Tên thủ đoạn', 'Tên mục', '*', 0), ('code', 'Mã', 'Chữ · Mã danh mục', '*', 0), ('isActive', 'Đang dùng', 'Bật/tắt', '', 0), ('containingArticle', 'Bài viết chứa thủ đoạn', 'Chọn · Bài viết (bài hướng dẫn)', 'khi đăng', 0), ('topic', 'Chuyên đề', 'Chọn · Chuyên đề', '*', 0), ('channels', 'Kênh', 'Chọn · Kênh', '*', 0), ('cautionLevel', 'Mức độ', 'Danh mục · Mức độ', '*', 0), ('searchKeywords', 'Từ khóa tìm kiếm', 'Thẻ', '', 0), ('anchor', 'Neo trong bài', 'Chữ · 40', '', 0)])],
 'topicItem': [('Danh mục › Chuyên đề · thêm 4 trường, nhập một lần cho cả chuyên đề', [('rememberLine', 'Nhớ một câu', 'Chữ · 140', '', 1), ('mustAsk', 'Câu hỏi phải hỏi', 'Đoạn · 200', '', 1), ('stopWhen', 'Khi nào phải dừng', 'Đoạn · 300', '', 1), ('holdWhen', 'Khi nào cần hoãn để kiểm chứng', 'Đoạn · 300', '', 1)])],
}
TYPENAME = {'tacticItem': 'Thủ đoạn', 'riskCategoryPage': 'Nhóm rủi ro', 'alertListPage': 'Cảnh báo mới', 'alertPage': 'Cảnh báo', 'riskArticlePage': 'Bài viết', 'topicItem': 'Chuyên đề'}

# Doi so voi Phu luc A hien tai
DROP = [
 ('riskCategoryPage', 'tactics', 'Thủ đoạn hiện trong nhóm', 'Tự lấy thủ đoạn trong các bài hướng dẫn của nhóm.'),
 ('riskCategoryPage', 'pinnedArticles', 'Bài ghim đầu danh sách', 'Thay bằng công tắc “Ghim đầu nhóm” ngay trên bài (đã có `isFeatured`).'),
 ('riskCategoryPage', 'noAnswerNote', 'Câu “Không thấy câu trả lời?”', 'Một câu chung ở Cài đặt website cho cả 6 tab.'),
 ('alertPage', 'relatedItems', 'Bài liên quan', 'Tự lấy theo thủ đoạn và chuyên đề.'),
 ('alertPage', 'alsoInCategories', 'Hiện thêm ở nhóm', 'Tự suy ra từ thủ đoạn đã chọn.'),
 ('riskArticlePage', 'relatedItems', 'Bài liên quan', 'Tự lấy theo chuyên đề và nhóm.'),
 ('riskArticlePage', 'checklist', 'Danh sách kiểm tra đi kèm', 'Danh sách kiểm tra cùng chuyên đề.'),
 ('riskArticlePage', 'icon', 'Biểu tượng trên thẻ', 'Theo loại bài.'),
 ('riskArticlePage', 'cautionLevel', 'Mức độ', 'Mức cao nhất trong các thủ đoạn của bài.'),
 ('riskArticlePage', 'channels', 'Thường gặp qua kênh', 'Kênh của các thủ đoạn trong bài.'),
 ('riskArticlePage', 'audiences', 'Ai hay bị nhắm tới', 'Đối tượng có các thủ đoạn trong bài.'),
]
ADD = [
 ('riskCategoryPage', 'showAdviceBox', 'Hiện hộp “Website không tư vấn tài chính”', 'Bật/tắt'),
 ('siteSettings', 'noAnswerNote', 'Câu “Không thấy câu trả lời?”', 'Đoạn · 200, ở Câu cố định'),
 ('topicItem', 'rememberLine', 'Nhớ một câu', 'Chữ · 140'),
 ('topicItem', 'mustAsk', 'Câu hỏi phải hỏi', 'Đoạn · 200'),
 ('topicItem', 'stopWhen', 'Khi nào phải dừng', 'Đoạn · 300'),
 ('topicItem', 'holdWhen', 'Khi nào cần hoãn để kiểm chứng', 'Đoạn · 300'),
 ('riskArticlePage', 'series', 'Loạt bài', 'Thẻ một giá trị (chọn hoặc gõ mới), chỉ Bài đọc thêm'),
 ('sharedSnippet', '–', 'Đoạn dùng chung “Bộ khung nhận diện”', 'Một nút dữ liệu mẫu, không phải trường'),
]
# Luat tu lay, viet thanh mot dich vu phia may chu (khong can API cong khai; trang render bang Razor)
RULES = [
 ('Thẻ trong trang nhóm', 'Bài viết có `primaryGroup` hoặc `alsoInCategories` = nhóm; thủ đoạn có `containingArticle` là bài hướng dẫn của nhóm; cảnh báo có thủ đoạn thuộc nhóm; trang việc cần làm mà các mục trên dẫn tới. Sắp: `isFeatured` trước, rồi ngày mới nhất.'),
 ('Bài liên quan của cảnh báo', 'Bài hướng dẫn chứa các thủ đoạn đã chọn; các thủ đoạn đó; danh sách kiểm tra cùng chuyên đề. Tối đa 4.'),
 ('Bài liên quan của bài hướng dẫn', 'Danh sách kiểm tra, kiểm tra nhanh cùng chuyên đề; bài hướng dẫn khác cùng nhóm; 3 bài đọc thêm mới nhất của nhóm.'),
 ('Mức độ, kênh, đối tượng của bài hướng dẫn', 'Từ các thủ đoạn có `containingArticle` là bài: mức cao nhất; hợp các kênh; các đối tượng có thủ đoạn đó.'),
 ('Kênh, đối tượng của cảnh báo', 'Điền sẵn trong form khi chọn thủ đoạn (chỉ khi ô còn trống), biên tập viên sửa được.'),
 ('Nếu đã lỡ', 'Các bước của trang việc cần làm ở `actionPage`.'),
 ('Khi phải dừng / Khi cần hoãn', '“Khi nào” từ chuyên đề; “Làm ngay” từ `stopNow`, `holdNow` của danh sách kiểm tra cùng chuyên đề.'),
 ('Đọc tiếp', 'Bài kế trong cùng `series` theo thứ tự trong danh sách Bài viết; không có loạt thì bài đọc thêm mới nhất của nhóm.'),
 ('Dòng “đang biên soạn”', 'Nhóm không có bài nào có `primaryGroup` = nhóm.'),
 ('Câu mời đọc của bài đọc chuyên đề', 'Trống thì “Đọc khoảng N phút. Đọc xong rồi hãy làm M câu của Chuyên đề K.”'),
]

TREE = [
 ('Quản lý nội dung', 0, 'root', ''),
 ('Cảnh báo', 1, 'list', 'thêm hằng ngày → màn “Trang cảnh báo”'),
 ('Bài viết', 1, 'list', 'lọc Nhóm, Loại bài → 3 màn bài viết'),
 ('Đoạn dùng chung', 1, 'list', '“Cảnh giác với người hứa lấy lại tiền”, “Bộ khung nhận diện”'),
 ('Danh mục', 1, 'folder', ''),
 ('Kênh tiếp cận', 2, 'list', 'bộ lọc Kênh, chip Kênh'),
 ('Đối tượng', 2, 'list', 'bộ lọc Đối tượng; mỗi đối tượng có danh sách thủ đoạn hay gặp'),
 ('Dấu hiệu phải dừng', 2, 'list', 'mục Dấu hiệu của cảnh báo'),
 ('Mức độ phổ biến', 2, 'list', 'cảnh báo'),
 ('Chuyên đề', 2, 'list', 'thanh CĐ 1–8; Nhớ một câu, Câu hỏi phải hỏi, Khi nào dừng, hoãn'),
 ('Thủ đoạn', 2, 'list', 'kênh, mức độ, bài viết chứa thủ đoạn: gốc của phần lớn dữ liệu tự lấy'),
 ('Quản lý trang', 0, 'root', ''),
 ('Các rủi ro', 1, 'page', 'chuyển tới Cảnh báo mới'),
 ('Cảnh báo mới', 2, 'page', '→ màn “Cảnh báo mới”'),
 ('Lừa đảo · Vay và nợ · Đầu tư · Bảo hiểm và tiết kiệm · Dữ liệu cá nhân', 2, 'page', '→ màn “Trang nhóm rủi ro”'),
 ('Cài đặt website', 0, 'root', 'Câu cố định: miễn trừ tư vấn, Hai điều phải nhớ, “Không thấy câu trả lời?”'),
]

def b64(name):
    with open(os.path.join(imgdir, name + '.jpg'), 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()

E = html.escape
STLABEL = {'nhap': 'Nhập ở form này', 'khac': 'Nhập ở chỗ khác', 'tu': 'Website tự lấy'}

def md(t):
    out, parts = [], t.split('`')
    for i, p in enumerate(parts):
        out.append('<code>%s</code>' % E(p) if i % 2 else E(p))
    return ''.join(out)

def form_html(typ, fieldnum):
    parts = []
    for g, fl in FORMS[typ]:
        items = []
        for a, l, t, req, new in fl:
            nums = fieldnum.get(a, [])
            items.append('<li data-f="%s"%s><span class="fn">%s</span><span class="fx"><b>%s</b>%s%s<small>%s · <code>%s</code></small></span></li>' % (
                a, (' data-n="%s"' % nums[0]) if nums else '', ''.join('<span class="nb">%d</span>' % x for x in nums) or '<span class="nb off">·</span>', E(l),
                ('<span class="req">%s</span>' % E(req if req != '*' else 'bắt buộc')) if req else '', '<span class="new">mới</span>' if new else '', E(t), E(a)))
        parts.append('<div class="fg"><h4>%s</h4><ul>%s</ul></div>' % (E(g), ''.join(items)))
    n = sum(len(fl) for _, fl in FORMS[typ])
    return '<div class="card"><h3>Form · %s <code>%s</code><span class="cnt">%d ô</span></h3>%s</div>' % (E(TYPENAME[typ]), E(typ), n, ''.join(parts))

def screen_html(sc):
    fieldnum = {}
    for n, _, fields, st, _ in sc['rows']:
        for a in fields:
            if n: fieldnum.setdefault(a, []).append(n)
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
    cnt = {k: sum(1 for r in sc['rows'] if r[3] == k) for k in STLABEL}
    kind = (' · Loại bài: <b>%s</b>' % E(sc['kind'])) if sc.get('kind') else ''
    return ('<section class="screen" id="%s"><header class="sh"><h2>%s</h2><p class="url"><code>%s</code>%s</p><p>%s</p>'
            '<p class="where"><span>Nhập ở</span>%s</p><p class="stat"><span class="tag nhap">%d nhập ở form này</span><span class="tag khac">%d nhập chỗ khác</span><span class="tag tu">%d website tự lấy</span></p></header>'
            '<div class="cols"><div class="left">%s</div><div class="right">'
            '<div class="card"><h3>Khối trên website</h3><div class="tblwrap"><table class="map"><thead><tr><th>Số</th><th>Khối</th><th>Lấy từ đâu</th></tr></thead><tbody>%s</tbody></table></div></div>'
            '%s</div></div></section>') % (
        sc['id'], E(sc['nav']), E(sc['url']), kind, E(sc['what']), ' › '.join('<b>%s</b>' % E(x) for x in sc['where']),
        cnt['nhap'], cnt['khac'], cnt['tu'], ''.join(imgs), ''.join(rows), ''.join(form_html(t, fieldnum) for t in sc['forms']))

tree = ''.join('<li class="lv%d %s"><span class="tn">%s</span>%s</li>' % (lv, k, E(n), ('<small>%s</small>' % E(d)) if d else '') for n, lv, k, d in TREE)
drop = ''.join('<tr><td><code>%s.%s</code></td><td>%s</td><td>%s</td></tr>' % (E(t), E(a), E(l), md(w)) for t, a, l, w in DROP)
add = ''.join('<tr><td><code>%s.%s</code></td><td>%s</td><td>%s</td></tr>' % (E(t), E(a), E(l), E(k)) for t, a, l, k in ADD)
rules = ''.join('<tr><td><b>%s</b></td><td>%s</td></tr>' % (E(n), md(r)) for n, r in RULES)
nav = ''.join('<a href="#%s">%s</a>' % (sc['id'], E(sc['nav'])) for sc in SCREENS)

PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bo-cac-rui-ro.tpl.html'), encoding='utf-8').read()
for k, v in {'{{NAV}}': nav, '{{TREE}}': tree, '{{DROP}}': drop, '{{ADD}}': add, '{{RULES}}': rules, '{{NDROP}}': str(len(DROP)), '{{NADD}}': str(len(ADD)),
             '{{SCREENS}}': ''.join(screen_html(sc) for sc in SCREENS)}.items():
    PAGE = PAGE.replace(k, v)
open(out, 'w', encoding='utf-8', newline='\n').write(PAGE)
print('screens', len(SCREENS), 'drop', len(DROP), 'add', len(ADD), 'bytes', len(PAGE))
