"""Dung mockup ban giao phan Khan cap: man website (anh danh so) <-> cho nhap trong backoffice.

python dung_bo_khan_cap.py anh-portal-khan-cap ../mockup/bo-khan-cap.html
Anh chup tu mockup/antoantaichinh_v2.html o be rong 1440 px bang chup_khan_cap.py; vi tri so (top %, left %) lay tu ket qua cua script do.
Nguyen tac (QD-056, nhu QD-054): cai gi suy ra duoc tu du lieu da co thi website tu lay; form chi giu cai nguoi viet moi biet.
Truong va alias theo Phu luc A; truong danh dau 'moi' theo QD-056, 'moi*' la o Claude de xuat them, cho duyet.
"""
import sys, os, base64, html

imgdir, out = sys.argv[1:3]

# Trang thai moi khoi: nhap = nhap o form nay; khac = nhap o cho khac; tu = website tu lay
SCREENS = [
 {'id': 'kc', 'nav': 'Trang Khẩn cấp', 'url': '/khan-cap', 'forms': ['khanCapPage'],
  'what': 'Một trang cố định. Ba cửa vào dẫn tới trang Việc cần làm hoặc trình hỏi; danh sách tình huống tự lấy từ Quản lý nội dung › Việc cần làm.',
  'where': ['Quản lý trang', 'Khẩn cấp'],
  'imgs': [('khan-cap', 'Khẩn cấp', [(1, 7.6, 8), (2, 29.4, 13), (3, 32.2, 8), (4, 39.6, 8), (5, 42.4, 8), (6, 46.8, 9), (7, 50.9, 11), (8, 53.3, 10), (9, 55.2, 9),
                                      (10, 59.5, 9), (11, 68.7, 9), (12, 76.3, 10), (13, 78.4, 8), (14, 80.6, 8)]),
           ('khan-cap-cua-2', 'Bấm cửa 2: danh sách lựa chọn mở tại chỗ', [(15, 46.2, 9), (16, 47.8, 12)])],
  'rows': [
   (1, 'Tiêu đề, mô tả', ['title', 'lead'], 'nhap', 'Biểu tượng và đường dẫn cố định.'),
   (2, 'Lối vào “Tôi đang gặp chuyện gì?”', ['wizardTitle', 'wizardDescription', 'wizardButtonText'], 'nhap', 'Nút mở trang Kiểm tra tình huống.'),
   (3, 'Khối “Bốn việc không làm khi nghi ngờ”', ['principlesTitle'], 'nhap', 'Bốn thẻ lấy ở Cài đặt website › Bốn nguyên tắc dừng, dùng chung với Trang chủ.'),
   (4, 'Câu nguồn dưới khối', ['principlesNote'], 'nhap', ''),
   (5, 'Câu dẫn “Việc cần làm ngay”', ['doorLead'], 'nhap', ''),
   (6, 'Ba cửa vào', ['doors'], 'nhap', 'Mỗi cửa: tiêu đề, mô tả, hình, khi bấm (mở trang ngay ở cửa 1; mở danh sách lựa chọn ở cửa 2, 3).'),
   (7, 'Nút “Không ô nào giống trường hợp của tôi”', ['noMatchPage'], 'nhap', 'Chữ nút cố định; dòng phụ là tiêu đề trang đích (Trả lời vài câu hỏi ngắn).'),
   (8, 'Câu cho người đang giúp người thân', ['helperNote'], 'nhap', ''),
   (9, '“9 tình huống điển hình”', [], 'tu', 'Mọi trang Việc cần làm không bật “Ẩn khỏi danh sách tình huống”, theo thứ tự kéo ở Quản lý nội dung › Việc cần làm; số đếm tự tính. Không còn ô chọn.'),
   (10, 'Cách tự tìm số ngân hàng của bạn', [], 'khac', 'Cài đặt website › Câu cố định › Cách tự tìm số ngân hàng. Câu “Website không đưa số…” cố định.'),
   (11, 'Số do Nhà nước vận hành', ['stateHotlines'], 'nhap', 'Số, hình thức, mô tả, cú pháp tin nhắn. Nút Gọi, Nhắn tin tự hiện theo hình thức.'),
   (12, 'Dòng “Kiểm chứng gần nhất · Nguồn”', ['hotlinesCheckedDate', 'hotlinesSource'], 'nhap', 'Trống thì website hiện dấu “chưa kiểm chứng”.'),
   (13, 'Hai nút cuối trang', ['footerButtons'], 'nhap', ''),
   (14, 'Câu “Website không trực 24/7”', [], 'khac', 'Cài đặt website › Câu cố định (ô mới, dùng chung với trang Việc cần làm).'),
   (15, 'Câu dẫn của danh sách lựa chọn', ['doors'], 'nhap', 'Ô “Câu dẫn danh sách” trong thẻ cửa (mới).'),
   (16, 'Một dòng lựa chọn', ['doors'], 'nhap', 'Biểu tượng, câu, trang mở. Dòng cuối của cửa 3 mở trình hỏi.'),
   (None, 'Đường dây nóng của tổ chức tín dụng', ['bankHotlines'], 'nhap', 'Để trống tới khi có nguồn Nhà nước; khi trống website hiện hộp tự tìm số (khối 10).'),
   (None, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
  ]},
 {'id': 'th', 'nav': 'Trình hỏi', 'url': '/khan-cap/kiem-tra-tinh-huong', 'forms': ['wizardPage', 'tacticItem'],
  'what': '“Tôi đang gặp chuyện gì?”: 3 câu, tính trên trình duyệt, không gửi đi đâu. Quản trị viên sửa câu hỏi và lựa chọn; “Tình huống gần giống” do biên tập viên gắn ở từng thủ đoạn.',
  'where': ['Quản lý trang', 'Khẩn cấp', 'Kiểm tra tình huống'],
  'imgs': [('trinh-hoi', 'Câu 1', [(1, 13, 8), (2, 44.8, 11), (3, 52.3, 10), (4, 59.5, 42), (5, 65.4, 13)]),
           ('trinh-hoi-cau-2', 'Câu 2 (câu 3 giống vậy)', [(6, 50.5, 10), (7, 54.5, 13), (8, 66.6, 13), (9, 66.6, 42)]),
           ('trinh-hoi-ket-qua', 'Kết quả: Cuộc gọi · đọc OTP · dọa dính án', [(10, 32.8, 12), (11, 37.9, 8), (12, 46.2, 8), (13, 47.6, 8), (14, 52.6, 8), (15, 61.9, 8), (16, 69.9, 8), (17, 78.5, 8)])],
  'rows': [
   (1, 'Tiêu đề, mô tả', ['title', 'lead'], 'nhap', ''),
   (2, 'Câu về quyền riêng tư', ['privacyNote'], 'nhap', ''),
   (3, 'Câu 1: câu hỏi, gợi ý', ['step1Question', 'step1Hint'], 'nhap', ''),
   (4, 'Lựa chọn câu 1', ['step1Options'], 'nhap', 'Mỗi dòng nối với một kênh trong Danh mục để so với kênh của thủ đoạn.'),
   (5, 'Dòng “Kênh khác, hoặc không nhớ”', ['step1OtherLabel'], 'nhap', 'Chọn dòng này thì không cộng điểm kênh.'),
   (6, 'Câu 2, 3: câu hỏi, gợi ý', ['step2Question', 'step2Hint', 'step3Question', 'step3Hint'], 'nhap', ''),
   (7, 'Lựa chọn câu 2, 3', ['step2Options', 'step3Options'], 'nhap', 'Mỗi dòng có Loại (Phải dừng, Tạm hoãn), Dấu hiệu phải dừng hoặc câu dấu hiệu, ghi chú. Loại quyết định mức độ.'),
   (8, 'Dòng “Chưa yêu cầu gì cụ thể”, “Không hứa hẹn…”', ['step2NoneLabel', 'step3NoneLabel'], 'nhap', ''),
   (9, 'Dòng “Tôi chưa biết, không nhớ rõ”', ['unknownLabel', 'unknownSignText'], 'nhap', 'Chọn dòng này thì mức ít nhất là Cao.'),
   (10, 'Mức độ cần thận trọng và khuyến nghị', ['resultHeading1'], 'tu', 'Có lựa chọn Phải dừng: Rất cao, DỪNG. Chỉ Tạm hoãn hoặc “Tôi chưa biết”: Cao, HOÃN VÀ KIỂM CHỨNG. Không có: Cần thận trọng. Nhãn và câu giải thích ở Cài đặt website.'),
   (11, 'Tình huống gần giống', ['resultHeading2', 'maxSituations', 'wizardAnswers'], 'tu', 'Thủ đoạn có “Câu trả lời ở trình hỏi” trùng lựa chọn; dòng phụ là tên ngắn chuyên đề của bài chứa thủ đoạn; bấm thì mở bài và tô sáng thủ đoạn. Không khớp: Câu khi không khớp và bốn nguyên tắc dừng.'),
   (12, 'Câu dưới tình huống', ['situationNote'], 'nhap', ''),
   (13, 'Dấu hiệu cần chú ý', ['resultHeading3'], 'tu', 'Từ lựa chọn: Dấu hiệu phải dừng (hoặc câu dấu hiệu) của dòng Phải dừng, rồi câu dấu hiệu của dòng Tạm hoãn, rồi câu của “Tôi chưa biết”. Tối đa 3.'),
   (14, 'Việc cần làm ngay', ['resultHeading4', 'stopActions', 'holdActions', 'clearActions'], 'khac', 'Chữ lấy nguyên văn bước của trang Việc cần làm theo bảng của mức; dòng có Chỉ khi chọn, Bỏ khi chọn. Tối đa 4.'),
   (15, 'Nếu bạn đã lỡ làm theo', ['resultHeading5', 'ifAlreadyLinks'], 'nhap', 'Dòng có “Chỉ khi chọn” (ví dụ “Đang bị đe dọa” chỉ hiện khi chọn dọa hoặc bắt giữ bí mật).'),
   (16, 'Bốn nút', ['button1Text', 'button2Text', 'button3Text', 'button4Text', 'defaultChecklist'], 'nhap', 'Đọc bài chi tiết: bài chứa thủ đoạn đầu. Danh sách kiểm tra: cùng chuyên đề, không có thì danh sách mặc định. Bản dựng một tệp hiện “Tải danh sách kiểm tra (PDF)”, website thật là “Mở danh sách kiểm tra”.'),
   (17, 'Hai câu dưới kết quả', [], 'khac', 'Cài đặt website › Câu cố định › Câu dưới mọi kết quả, Câu “không phải kết luận”.'),
   (None, 'Mức Cần thận trọng: câu thêm', ['clearNote'], 'nhap', ''),
   (None, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
  ]},
 {'id': 'vcl', 'nav': 'Trang Việc cần làm', 'url': '/khan-cap/<tên trang>', 'forms': ['viecCanLamPage'],
  'what': '10 trang, mỗi trang một tình thế và các bước. Trang “Trả lời vài câu hỏi ngắn” chỉ có câu hỏi sàng lọc.',
  'where': ['Quản lý nội dung', 'Việc cần làm', 'một trang'],
  'imgs': [('viec-can-lam', 'Bạn vừa chuyển tiền, hoặc vừa giao hàng đi', [(1, 4, 21), (2, 30.5, 12), (3, 31.7, 13), (4, 37.2, 13), (5, 42.8, 12), (6, 49.8, 9), (7, 61.8, 9), (8, 65, 9), (9, 72.5, 12), (10, 79, 10), (11, 80.6, 8)]),
           ('tra-loi-nhanh', 'Trả lời vài câu hỏi ngắn', [(12, 4.6, 21), (13, 34.8, 9), (14, 37.8, 9), (15, 63.9, 9)])],
  'rows': [
   (1, 'Nhãn, tiêu đề, câu dẫn, biểu tượng', ['title', 'lead', 'icon'], 'nhap', 'Nhãn “Khẩn cấp · Việc cần làm ngay” cố định. Đường dẫn ở ô Đường dẫn.'),
   (2, 'Bước: câu chính', ['steps'], 'nhap', 'Mỗi bước một thẻ; số thứ tự và ô “Đã làm xong việc này” tự có.'),
   (3, 'Hộp “Tìm đúng số tổng đài ngân hàng, ví điện tử”', ['steps'], 'khac', 'Bật “Hộp tìm số ngân hàng” ở bước; chữ là Đoạn dùng chung cùng tên.'),
   (4, 'Câu nói mẫu', ['steps'], 'nhap', 'Ô Câu nói mẫu của bước.'),
   (5, 'Diễn giải', ['steps'], 'nhap', 'Ô Diễn giải, mỗi dòng một đoạn.'),
   (6, 'Hộp “Hỏi thêm”', ['steps'], 'nhap', 'Phần Hỏi thêm của bước: câu hỏi, chữ nút, ghi chú, trang đích.'),
   (7, 'Hộp “Đừng trả phí cho người hứa lấy lại tiền”', ['steps'], 'khac', 'Đoạn dùng chung, chọn ở “Chèn đoạn dùng chung sau bước”.'),
   (8, 'Hộp “Chỉ làm các bước dưới đây nếu…”', ['steps'], 'khac', 'Đoạn dùng chung, chọn ở “Chỉ làm khi” của bước sau.'),
   (9, 'Nút Gọi 156, Nhắn tin 156, Nhắn tin 5656', [], 'tu', 'Số trong câu chính của bước có trong “Số do Nhà nước vận hành” của trang Khẩn cấp; nút theo Hình thức của số đó.'),
   (10, 'Rà soát gần nhất, rà soát lại trước', ['reviewDate', 'verificationSource'], 'nhap', '“Rà soát lại trước” = ngày rà soát + 90 ngày; quá hạn tự hiện cảnh báo.'),
   (11, 'Câu cuối trang', [], 'khac', 'Cài đặt website › Câu cố định: “Câu dưới các bước Việc cần làm” và “Website không trực 24/7” (hai ô mới).'),
   (12, 'Trang hỏi nhanh: tiêu đề, câu dẫn', ['title', 'lead', 'hideFromSituations'], 'nhap', 'Trang này bật “Ẩn khỏi danh sách tình huống”.'),
   (13, 'Câu hỏi sàng lọc và nút', ['screeningQuestions'], 'nhap', 'Câu hỏi, chữ nút, trang mở.'),
   (14, 'Ghi chú dưới câu', ['screeningQuestions'], 'nhap', 'Ô Ghi chú ở dòng mở rộng.'),
   (15, 'Câu cuối “Chưa câu nào ở trên đúng với bạn?”', ['screeningQuestions'], 'nhap', 'Dòng cuối của bảng.'),
   (None, 'Dòng “Đánh dấu chỉ lưu trên máy của bạn”', [], 'tu', 'Chữ cố định; dấu lưu trên trình duyệt.'),
   (None, 'Ảnh minh họa', ['illustration', 'illustrationAlt'], 'nhap', ''),
  ]},
]

# Form: (alias, nhan, kieu, bat buoc, moi: 1 = theo QD-056, 2 = de xuat them cho duyet)
FORMS = {
 'khanCapPage': [('Nội dung', [('title', 'Tiêu đề', 'Chữ · 90', '*', 0), ('lead', 'Mô tả', 'Đoạn · 220', '*', 0), ('wizardTitle', 'Lối vào trình hỏi: tiêu đề', 'Chữ · 60', '*', 0),
                   ('wizardDescription', 'Lối vào trình hỏi: mô tả', 'Đoạn · 220', '*', 0), ('wizardButtonText', 'Lối vào trình hỏi: chữ nút', 'Chữ · 32', '*', 0),
                   ('principlesTitle', 'Bốn việc: tiêu đề khối', 'Chữ · 60', '*', 1), ('principlesNote', 'Bốn việc: câu nguồn', 'Đoạn · 200', '', 1)]),
                 ('Việc cần làm ngay', [('doorLead', 'Câu dẫn', 'Đoạn · 220', '*', 0), ('doors', 'Ba cửa vào', 'Thẻ cố định 3; trong thẻ có bảng Lựa chọn', '*', 0),
                   ('doors[].optionsLead', 'Câu dẫn danh sách (trong thẻ cửa)', 'Đoạn · 160', '', 2), ('noMatchPage', 'Nút “Không ô nào giống” mở', 'Chọn · Việc cần làm', '*', 0),
                   ('helperNote', 'Câu cho người đang giúp người thân', 'Chữ · 160', '', 0)]),
                 ('Khi cần hỗ trợ', [('stateHotlines', 'Số do Nhà nước vận hành', 'Bảng: số, hình thức, mô tả, cú pháp', '*', 0), ('hotlinesCheckedDate', 'Ngày kiểm chứng số', 'Ngày', 'khi đăng', 0),
                   ('hotlinesSource', 'Nguồn kiểm chứng', 'Chữ', 'khi đăng', 0), ('bankHotlines', 'Đường dây nóng của tổ chức tín dụng', 'Bảng', '', 0)]),
                 ('Cuối trang, ảnh', [('footerButtons', 'Hai nút cuối trang', 'Bảng: chữ, trang', '', 0), ('illustration', 'Ảnh minh họa', 'Chọn ảnh', '', 0), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh', 0)])],
 'wizardPage': [('Tab Câu hỏi', [('title', 'Tiêu đề', 'Chữ · 90', '*', 1), ('lead', 'Mô tả', 'Đoạn · 220', '*', 1), ('privacyNote', 'Câu về quyền riêng tư', 'Đoạn · 240', '*', 1),
                   ('step1Question', 'Câu 1', 'Chữ · 120', '*', 0), ('step1Hint', 'Gợi ý câu 1', 'Chữ · 160', '', 0), ('step1Options', 'Lựa chọn câu 1: biểu tượng, nhãn, kênh', 'Bảng', '*', 0),
                   ('step1OtherLabel', 'Dòng “không nhớ kênh”', 'Chữ · 60', '*', 1),
                   ('step2Question', 'Câu 2', 'Chữ · 120', '*', 0), ('step2Hint', 'Gợi ý câu 2', 'Chữ · 160', '', 0), ('step2Options', 'Lựa chọn câu 2: biểu tượng, nhãn, loại, dấu hiệu, câu dấu hiệu, ghi chú', 'Bảng', '*', 0),
                   ('step2NoneLabel', 'Dòng “không có gì” câu 2', 'Chữ · 60', '*', 1),
                   ('step3Question', 'Câu 3', 'Chữ · 120', '*', 0), ('step3Hint', 'Gợi ý câu 3', 'Chữ · 160', '', 0), ('step3Options', 'Lựa chọn câu 3 (như câu 2)', 'Bảng', '*', 0),
                   ('step3NoneLabel', 'Dòng “không có gì” câu 3', 'Chữ · 60', '*', 1), ('unknownLabel', 'Dòng “Tôi chưa biết”', 'Chữ · 60', '*', 1), ('unknownSignText', 'Câu dấu hiệu của “Tôi chưa biết”', 'Đoạn · 200', '*', 1)]),
                ('Tab Thủ đoạn', [('—', 'Thủ đoạn theo từng lựa chọn', 'Không lưu (hiển thị)', '', 1)]),
                ('Tab Kết quả', [('resultHeading1', 'Tiêu đề khối 1–4', 'Chữ · 40', '*', 0), ('resultHeading5', 'Tiêu đề “Nếu đã lỡ”', 'Chữ · 40', '*', 1), ('maxSituations', 'Số tình huống hiện tối đa', 'Số 1–3', '*', 0),
                   ('situationNote', 'Câu dưới tình huống', 'Đoạn · 200', '', 1), ('noMatchText', 'Câu khi không khớp', 'Đoạn · 200', '*', 0), ('clearNote', 'Câu thêm ở mức Cần thận trọng', 'Đoạn · 240', '', 1),
                   ('defaultChecklist', 'Danh sách kiểm tra khi không khớp thủ đoạn', 'Chọn · Danh sách kiểm tra', '*', 0),
                   ('stopActions', 'Việc cần làm: mức Rất cao', 'Bảng: trang, bước hoặc câu riêng, chỉ khi, bỏ khi', '*', 1), ('holdActions', 'Việc cần làm: mức Cao', 'Bảng', '*', 1),
                   ('clearActions', 'Việc cần làm: mức Cần thận trọng', 'Bảng', '*', 1), ('ifAlreadyLinks', 'Nếu đã lỡ làm theo', 'Bảng: biểu tượng, chữ, trang, chỉ khi', '*', 1),
                   ('button1Text', 'Chữ trên 4 nút', 'Chữ · 40', '*', 0)])],
 'tacticItem': [('Danh mục › Thủ đoạn · nhóm “Trình hỏi”', [('channels', 'Kênh', 'Chọn · Kênh', '*', 0), ('wizardAnswers', 'Câu trả lời ở trình hỏi', 'Chọn · Lựa chọn câu 2, 3 của trình hỏi (nhiều, ≤ 8)', '', 1)])],
 'viecCanLamPage': [('Nội dung', [('title', 'Tiêu đề', 'Chữ · 90', '*', 0), ('umbracoUrlName', 'Đường dẫn', 'Chữ · 60', '*', 0), ('icon', 'Biểu tượng', 'Danh mục · Biểu tượng', '*', 0), ('lead', 'Câu dẫn', 'Đoạn · 220', '*', 0),
                      ('hideFromSituations', 'Ẩn khỏi danh sách tình huống', 'Bật/tắt', '', 0)]),
                     ('Câu hỏi sàng lọc', [('screeningQuestions', 'Câu hỏi sàng lọc: câu, chữ nút, trang mở, ghi chú', 'Bảng', '', 0)]),
                     ('Các bước', [('steps', 'Các bước: câu chính, diễn giải, câu nói mẫu, hộp số ngân hàng, chỉ làm khi, chèn đoạn dùng chung, hỏi thêm', 'Thẻ', 'có điều kiện', 0)]),
                     ('Rà soát, ảnh', [('reviewDate', 'Ngày rà soát', 'Ngày', 'khi đăng', 0), ('verificationSource', 'Nguồn kiểm chứng', 'Chữ · 200', 'khi đăng', 0),
                      ('illustration', 'Ảnh minh họa', 'Chọn ảnh', '', 0), ('illustrationAlt', 'Văn bản thay thế', 'Chữ · 160', 'khi có ảnh', 0)])],
}
TYPENAME = {'khanCapPage': 'Khẩn cấp', 'wizardPage': 'Kiểm tra tình huống', 'tacticItem': 'Thủ đoạn', 'viecCanLamPage': 'Việc cần làm'}

DROP = [
 ('khanCapPage', 'typicalSituations', 'Tình huống điển hình', 'Tự lấy: trang Việc cần làm không bật `hideFromSituations`, theo thứ tự trong Quản lý nội dung › Việc cần làm.'),
 ('wizardPage', 'situationMatrix', 'Ma trận tình huống (cả 7 cột của hàng)', 'Tình huống là thủ đoạn có `wizardAnswers`; mức độ theo `optionKind`; dấu hiệu theo lựa chọn; việc cần làm theo ba bảng của mức.'),
 ('data type', 'Antc.WizardMatrix', 'Màn ma trận (V2-07c, V2-07d)', 'Tab Thủ đoạn chỉ hiển thị (`Antc.InfoPanel`).'),
]
ADD = [
 ('wizardPage', 'step1Options[].channel', 'Kênh trong Danh mục', 'Chọn · Kênh'),
 ('wizardPage', 'step2Options[], step3Options[]: optionKind, stopSign, signText, hint', 'Loại, Dấu hiệu phải dừng, câu dấu hiệu, ghi chú', 'Danh mục · Loại lựa chọn trình hỏi; Chọn · Dấu hiệu phải dừng; Đoạn · 300; Chữ · 160'),
 ('wizardPage', 'step1OtherLabel, step2NoneLabel, step3NoneLabel, unknownLabel, unknownSignText', 'Các dòng cố định của 3 câu', 'Chữ · 60; câu dấu hiệu Đoạn · 200'),
 ('wizardPage', 'title, lead, privacyNote', 'Đầu trang trình hỏi', 'Chữ · 90; Đoạn · 220; Đoạn · 240'),
 ('wizardPage', 'stopActions, holdActions, clearActions', 'Việc cần làm ngay theo mức', 'Bảng: trang, số bước hoặc câu riêng, onlyIf, skipIf'),
 ('wizardPage', 'ifAlreadyLinks, resultHeading5', 'Nếu bạn đã lỡ làm theo', 'Bảng: biểu tượng, chữ, trang, onlyIf'),
 ('wizardPage', 'situationNote, clearNote', 'Câu dưới tình huống; câu thêm mức Cần thận trọng', 'Đoạn · 200; Đoạn · 240'),
 ('tacticItem', 'wizardAnswers', 'Câu trả lời ở trình hỏi', 'Chọn · Lựa chọn câu 2, 3 của trình hỏi (nhiều, ≤ 8)'),
 ('khanCapPage', 'principlesTitle, principlesNote', 'Khối “Bốn việc không làm khi nghi ngờ”', 'Chữ · 60; Đoạn · 200'),
 ('khanCapPage', 'doors[].optionsLead', 'Câu dẫn danh sách của cửa (mới*, chờ duyệt)', 'Đoạn · 160'),
 ('siteSettings', 'actionStepsNote, notOnDutyNote', 'Câu dưới các bước; “Website không trực 24/7” (mới*, chờ duyệt)', 'Đoạn · 300'),
]
RULES = [
 ('Tình huống điển hình (Khẩn cấp)', 'Trang `viecCanLamPage` đã xuất bản, `hideFromSituations` tắt, theo thứ tự trong `actionFolder`. Tiêu đề khối = số trang + “tình huống điển hình”.'),
 ('Nút “Không ô nào giống”', 'Dòng phụ là `title` của trang ở `noMatchPage`.'),
 ('Mức độ (trình hỏi)', 'Có lựa chọn câu 2, 3 `optionKind` = `phaiDung` → `ratCao`; còn lại có `tamHoan` hoặc “Tôi chưa biết” → `cao`; không → `thuong`. Nhãn, câu giải thích: `siteSettings.stopLabel`… `clearText`.'),
 ('Tình huống gần giống', 'Thủ đoạn `isActive` có `wizardAnswers` trùng ít nhất 1 lựa chọn. Điểm = 2 × số trùng + 3 nếu `step1Options[].channel` nằm trong `channels`. Sắp điểm giảm dần, hòa theo thứ tự trong Danh mục › Thủ đoạn; tối đa `maxSituations`. Dòng phụ: `shortName` của chuyên đề của bài ở `containingArticle`.'),
 ('Dấu hiệu cần chú ý', 'Lựa chọn `phaiDung` theo thứ tự câu 2 rồi câu 3: `stopSign.signText`, không có thì `signText`; rồi `signText` của lựa chọn `tamHoan`; rồi `unknownSignText`. Tối đa 3.'),
 ('Việc cần làm ngay', 'Bảng của mức (`stopActions`, `holdActions`, `clearActions`): giữ dòng có `onlyIf` trống hoặc có lựa chọn trùng (kể cả lựa chọn câu 1) và `skipIf` không trùng; chữ = `mainText` của bước `stepNumber` của trang, hoặc `text`. Tối đa 4.'),
 ('Nếu bạn đã lỡ làm theo', '`ifAlreadyLinks` có `onlyIf` trống hoặc trùng.'),
 ('Bài chi tiết, danh sách kiểm tra', 'Bài ở `containingArticle` của thủ đoạn đầu (mở và tô sáng thủ đoạn); danh sách kiểm tra của chuyên đề bài đó (`topicItem.checklist`), không có thì `defaultChecklist`. Không khớp: nút bài mở trang “Có người đang thúc bạn làm ngay”.'),
 ('Nút gọi, nhắn tin trong bước', 'Số trong `steps[].mainText` có trong `khanCapPage.stateHotlines[].number` → nút theo `contactMode` (Gọi, Nhắn tin).'),
 ('Rà soát lại trước', '`reviewDate` + 90 ngày; quá ngày này thì hiện cảnh báo.'),
 ('Bộ ca kiểm', '`cong-cu/wizard-cases.json` (10 ca, khớp bản dựng). C# và `wizard.js` phải ra đúng các ca này.'),
]
TREE = [
 ('Quản lý nội dung', 0, 'root', ''),
 ('Việc cần làm', 1, 'list', '10 trang, kéo để sắp thứ tự “tình huống điển hình” → màn “Trang Việc cần làm”'),
 ('Đoạn dùng chung', 1, 'list', 'hộp số ngân hàng, “Đừng trả phí…”, “Chỉ làm các bước dưới đây nếu…”'),
 ('Danh mục', 1, 'folder', ''),
 ('Kênh tiếp cận', 2, 'list', 'kênh của lựa chọn câu 1 và của thủ đoạn'),
 ('Dấu hiệu phải dừng', 2, 'list', 'câu ở “Dấu hiệu cần chú ý”'),
 ('Thủ đoạn', 2, 'list', '“Câu trả lời ở trình hỏi”: gốc của “Tình huống gần giống”'),
 ('Quản lý trang', 0, 'root', ''),
 ('Khẩn cấp', 1, 'page', '→ màn “Trang Khẩn cấp”'),
 ('Kiểm tra tình huống', 2, 'page', 'chỉ Quản trị viên → màn “Trình hỏi”'),
 ('Cài đặt website', 0, 'root', 'Bốn nguyên tắc dừng; nhãn mức độ; cách tự tìm số ngân hàng; câu dưới kết quả; “Website không trực 24/7”'),
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
                ('<span class="req">%s</span>' % E(req if req != '*' else 'bắt buộc')) if req else '', {1: '<span class="new">mới</span>', 2: '<span class="new">mới*</span>'}.get(new, ''), E(t), E(a)))
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
    return ('<section class="screen" id="%s"><header class="sh"><h2>%s</h2><p class="url"><code>%s</code></p><p>%s</p>'
            '<p class="where"><span>Nhập ở</span>%s</p><p class="stat"><span class="tag nhap">%d nhập ở form này</span><span class="tag khac">%d nhập chỗ khác</span><span class="tag tu">%d website tự lấy</span></p></header>'
            '<div class="cols"><div class="left">%s</div><div class="right">'
            '<div class="card"><h3>Khối trên website</h3><div class="tblwrap"><table class="map"><thead><tr><th>Số</th><th>Khối</th><th>Lấy từ đâu</th></tr></thead><tbody>%s</tbody></table></div></div>'
            '%s</div></div></section>') % (
        sc['id'], E(sc['nav']), E(sc['url']), E(sc['what']), ' › '.join('<b>%s</b>' % E(x) for x in sc['where']),
        cnt['nhap'], cnt['khac'], cnt['tu'], ''.join(imgs), ''.join(rows), ''.join(form_html(t, fieldnum) for t in sc['forms']))

tree = ''.join('<li class="lv%d %s"><span class="tn">%s</span>%s</li>' % (lv, k, E(n), ('<small>%s</small>' % E(d)) if d else '') for n, lv, k, d in TREE)
drop = ''.join('<tr><td><code>%s.%s</code></td><td>%s</td><td>%s</td></tr>' % (E(t), E(a), E(l), md(w)) for t, a, l, w in DROP)
add = ''.join('<tr><td><code>%s.%s</code></td><td>%s</td><td>%s</td></tr>' % (E(t), E(a), E(l), E(k)) for t, a, l, k in ADD)
rules = ''.join('<tr><td><b>%s</b></td><td>%s</td></tr>' % (E(n), md(r)) for n, r in RULES)
nav = ''.join('<a href="#%s">%s</a>' % (sc['id'], E(sc['nav'])) for sc in SCREENS)

PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bo-khan-cap.tpl.html'), encoding='utf-8').read()
for k, v in {'{{NAV}}': nav, '{{TREE}}': tree, '{{DROP}}': drop, '{{ADD}}': add, '{{RULES}}': rules, '{{NDROP}}': str(len(DROP)), '{{NADD}}': str(len(ADD)),
             '{{SCREENS}}': ''.join(screen_html(sc) for sc in SCREENS)}.items():
    PAGE = PAGE.replace(k, v)
open(out, 'w', encoding='utf-8', newline='\n').write(PAGE)
print('screens', len(SCREENS), 'drop', len(DROP), 'add', len(ADD), 'bytes', len(PAGE))
