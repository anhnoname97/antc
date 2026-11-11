"""Lượt 3: viết lại các chính sách trong src/data.js theo chỉ đạo ngày 10/11/2026.
   - bỏ Chính sách tài trợ
   - Nguyên tắc dẫn nguồn -> Nguyên tắc biên soạn nội dung (website tự biên soạn, không trích dẫn, không đăng lại)
   - Chính sách bảo vệ dữ liệu cá nhân: không lưu giữ lâu dài
   - bỏ thông tin đơn vị vận hành, đơn vị thẩm định; "Pháp nhân chủ quản" -> antoantaichinh.vn
   - bỏ nhãn "Bản dự thảo" """
import json, os
R = '/home/claude/web'
p = os.path.join(R, 'src/data.js')
s = open(p, encoding='utf8').read()
pre = 'window.__DATA__='
d, end = json.JSONDecoder().raw_decode(s[len(pre):])
tail = s[len(pre) + end:]
POL = d['POL']
V = 'Cập nhật ngày 10/11/2026'

# ---------- Tuyên bố miễn trừ trách nhiệm ----------
mt = POL['mt']; mt['v'] = V
def swap(pol, old_start, new):
    """thay khối có nội dung bắt đầu bằng old_start; new=None thì xóa"""
    hit = [i for i, b in enumerate(pol['b']) if b[1].startswith(old_start)]
    assert len(hit) == 1, (old_start, len(hit))
    if new is None: del pol['b'][hit[0]]
    else: pol['b'][hit[0]][1] = new
swap(mt, 'antoantaichinh.vn là website tư vấn', 'antoantaichinh.vn là website tư vấn, hướng dẫn nhận diện và phòng, chống lừa đảo, đồng thời cảnh báo rủi ro tài chính.')
swap(mt, '<b>Không phải website của cơ quan nhà nước.</b>', '<b>Không phải website của cơ quan nhà nước.</b> Website không thay mặt và không nhân danh cơ quan nhà nước nào.')
swap(mt, 'Website <b>không bảo chứng</b>', 'Website <b>không bảo chứng</b> cho bất kỳ giao dịch, sản phẩm, dịch vụ hay tổ chức nào. Việc một tổ chức được nhắc tới trên website không có nghĩa website khuyến nghị hay bảo đảm cho tổ chức đó.')
swap(mt, 'Công an xã Thiên Lộc thẩm định nội dung chuyên môn, và', None)
swap(mt, 'Website chỉ nêu đầu mối của cơ quan nhà nước', 'Website chỉ nêu các đầu số do Nhà nước vận hành (113, 156, 5656) và tên cơ quan nhà nước có thẩm quyền. Website <b>không đăng số điện thoại hay đường dẫn của ngân hàng, nhà mạng, doanh nghiệp nào</b>.')
swap(mt, 'Danh sách đó là tiện ích', 'Số của ngân hàng thì bạn tự lấy ở mặt sau thẻ hoặc trong ứng dụng bạn đã cài từ trước. Đầu số có thể thay đổi mà website chưa kịp cập nhật; website không chịu trách nhiệm về thiệt hại phát sinh từ việc bạn liên hệ theo một số đã thay đổi.')
swap(mt, 'Pháp luật thay đổi, thủ đoạn thay đổi', 'Pháp luật thay đổi, thủ đoạn thay đổi, quy trình của ngân hàng và cơ quan nhà nước thay đổi. Các trang hướng dẫn ghi ngày rà soát gần nhất; trang quá 90 ngày chưa rà soát lại tự hiện nhãn nhắc.')
swap(mt, 'Bạn tự quyết định và tự chịu trách nhiệm', 'Bạn tự quyết định và tự chịu trách nhiệm về quyết định của mình. Trong phạm vi pháp luật cho phép, antoantaichinh.vn không chịu trách nhiệm đối với thiệt hại phát sinh từ việc bạn sử dụng hoặc không sử dụng nội dung trên website, trừ trường hợp thiệt hại do lỗi cố ý của chính website.')
swap(mt, 'Tuyên bố này có hiệu lực từ', 'Tuyên bố này áp dụng từ ngày 10/11/2026. Khi thay đổi, phiên bản mới được đăng tại đây kèm ngày cập nhật.')

# ---------- Chính sách bảo vệ dữ liệu cá nhân ----------
POL['dl'] = {'t': 'Chính sách bảo vệ dữ liệu cá nhân', 'v': V, 'b': [
 ['q', 'Website <b>không lưu giữ lâu dài dữ liệu cá nhân</b>. Thông tin bạn tự gửi chỉ được giữ trong thời gian ngắn, đủ để liên hệ, trả lời theo yêu cầu của chính bạn, hoặc để xét, trao giải cuộc thi trực tuyến tổ chức trên website. Xong việc thì xóa.'],
 ['h', '1. Khi bạn chỉ đọc và dùng công cụ'],
 ['p', 'Không cần đăng ký, không cần cung cấp gì. Lựa chọn, câu trả lời và các ô bạn đánh dấu trong công cụ kiểm tra chỉ nằm <b>trên chính máy của bạn</b>, không gửi về website. Bạn xóa được bằng nút “Xóa đánh dấu” hoặc bằng cách xóa dữ liệu duyệt web của trình duyệt.'],
 ['p', 'Máy chủ đặt website có thể ghi nhật ký kỹ thuật thông thường, như thời điểm truy cập và loại thiết bị, để vận hành và bảo mật. Website không dùng nhật ký này để nhận dạng cá nhân.'],
 ['h', '2. Khi bạn gửi góp ý hoặc câu hỏi'],
 ['p', 'Website chỉ nhận nội dung bạn viết, và cách liên hệ <b>nếu bạn tự để lại</b> để được trả lời. Thông tin liên hệ chỉ dùng để trả lời đúng yêu cầu đó và được xóa sau khi đã trả lời xong.'],
 ['p', 'Đừng gửi mật khẩu, mã OTP, mã PIN, số thẻ, số tài khoản, hay thông tin cá nhân của người khác.'],
 ['h', '3. Khi bạn dự cuộc thi trực tuyến'],
 ['p', 'Website nhận họ tên, số điện thoại, đơn vị nếu bạn muốn ghi, cùng bài làm và kết quả. Thông tin này chỉ dùng để chấm bài, xét giải và liên hệ trao giải, và được xóa sau khi trao giải xong. Riêng giấy tờ trao giải được giữ theo quy định về kế toán, thuế.'],
 ['p', 'Website không hỏi ngày sinh, không lấy số căn cước, vị trí hay danh bạ. Tên người đạt giải chỉ được công bố khi người đó đồng ý. Người dưới 16 tuổi dự thi cần có sự đồng ý của cha, mẹ hoặc người giám hộ.'],
 ['h', '4. Những điều website không làm'],
 ['n', '<b>Không bán, không trao đổi, không cho thuê</b> thông tin của bạn, và không dùng để quảng cáo.'],
 ['n', '<b>Không lập hồ sơ người dùng</b>, không theo dõi hành vi cá nhân.'],
 ['n', '<b>Không hỏi thứ nguy hiểm.</b> Website không bao giờ hỏi mật khẩu, mã xác thực (OTP), mã PIN, số thẻ hay số tài khoản ngân hàng của bạn, trong bất kỳ trường hợp nào.'],
 ['n', '<b>Không chủ động liên hệ</b> khi bạn chưa gửi yêu cầu.'],
 ['h', '5. Quyền của bạn'],
 ['p', 'Bạn có thể yêu cầu xem, sửa hoặc xóa thông tin mình đã gửi, hoặc rút lại sự đồng ý, bất kỳ lúc nào qua mục Góp ý. Website thực hiện sớm nhất có thể sau khi nhận được yêu cầu.'],
 ['p', 'Thông tin chỉ được cung cấp cho cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp theo quy định của pháp luật.'],
 ['h', '6. Thay đổi chính sách'],
 ['p', 'Khi thay đổi, phiên bản mới được đăng tại đây kèm ngày cập nhật.'],
]}

# ---------- bỏ Chính sách tài trợ ----------
del POL['tt']

# ---------- Nguyên tắc biên soạn nội dung (thay Nguyên tắc dẫn nguồn) ----------
POL['ng'] = {'t': 'Nguyên tắc biên soạn nội dung', 'v': V, 'b': [
 ['q', 'Website tự biên soạn nội dung để hướng dẫn người dân nhận diện và phòng tránh lừa đảo, rủi ro tài chính. Website <b>không đưa tin, không tổng hợp tin tức và không đăng lại bài</b> của báo chí hay của trang khác.'],
 ['h', '1. Nội dung trên website gồm những gì'],
 ['n', '<b>Hướng dẫn:</b> việc cần làm, dấu hiệu phải dừng, cách tự kiểm chứng và các công cụ kiểm tra.'],
 ['n', '<b>Bài đọc:</b> tám bài đọc chuyên đề, chuỗi bài “Lừa đảo: Từ cổ chí kim” và các bài về thủ đoạn thường gặp.'],
 ['n', '<b>Cảnh báo:</b> mô tả một thủ đoạn đang cần chú ý, viết theo kịch bản chung, không gắn với vụ việc hay cá nhân, tổ chức cụ thể.'],
 ['n', '<b>Câu hỏi luyện tập</b> và cuộc thi trực tuyến.'],
 ['h', '2. Website không trích dẫn, không đăng lại'],
 ['p', 'Website không sao chép và không đăng lại nguyên văn bài viết, bản tin, hình ảnh của báo chí, của trang khác hay của mạng xã hội. Nội dung được viết bằng lời của website, dựa trên hiểu biết chung về các thủ đoạn đã được cảnh báo rộng rãi.'],
 ['p', 'Khi nội dung nhắc tới quy định của pháp luật, website nêu ý chính và, ở một số bài, tên văn bản để bạn dễ tra cứu. Quy định có thể đã thay đổi sau ngày bài được viết. Muốn biết quy định chính xác và đang có hiệu lực, bạn hãy tra trực tiếp tại cổng thông tin của cơ quan nhà nước có thẩm quyền hoặc hỏi người có chuyên môn.'],
 ['p', 'Ảnh minh họa trên website được tạo bằng trí tuệ nhân tạo, không phải ảnh chụp người thật, việc thật.'],
 ['h', '3. Không nêu tên tổ chức, cá nhân cụ thể'],
 ['p', 'Website <b>không nêu đích danh</b> một doanh nghiệp, tổ chức hay cá nhân đang hoạt động là bên lừa đảo, kể cả khi người đọc phản ánh, kể cả khi có nhiều phản ánh giống nhau.'],
 ['p', 'Lý do: website không có thẩm quyền kết luận hành vi vi phạm, và việc nêu tên sai có thể gây thiệt hại cho bên bị nêu.'],
 ['h', '4. Ngày cập nhật và hạn rà soát'],
 ['n', 'Các trang hướng dẫn ghi <b>ngày rà soát gần nhất</b>; mỗi cảnh báo ghi ngày đăng.'],
 ['n', 'Quá <b>90 ngày</b> chưa rà soát lại: trang hướng dẫn tự hiện nhãn nhắc; cảnh báo tự chuyển xuống phần lưu trữ.'],
 ['h', '5. Ba trạng thái, không có trạng thái “an toàn”'],
 ['p', 'Mọi nội dung chỉ dùng ba trạng thái: <b>DỪNG</b> · <b>HOÃN VÀ KIỂM CHỨNG</b> · <b>CHƯA PHÁT HIỆN ĐIỂM DỪNG</b>. Không có nhãn nào mang nghĩa an toàn tuyệt đối, và không dùng màu xanh lá cho trạng thái.'],
 ['h', '6. Khi nội dung có chỗ sai'],
 ['p', 'Website sẽ có lỗi. Thấy chỗ sai, khó hiểu hoặc đã lạc hậu, xin báo qua mục Góp ý. Cách xử lý được nêu tại <b>Cách báo lỗi và cải chính</b>.'],
]}

# ---------- Cách báo lỗi và cải chính ----------
cc = POL['cc']; cc['v'] = V
swap(cc, '<b>Sai về nội dung:</b>', '<b>Sai về nội dung:</b> hướng dẫn sai, nêu quy định sai, số liệu sai.')
swap(cc, 'Loại lỗi | Xử lý trong', 'Loại lỗi | Cố gắng xử lý trong')
swap(cc, 'Nếu bài đã được in phát tay hoặc chia sẻ rộng', 'Nếu bài đã được in phát tay hoặc chia sẻ rộng, đăng thêm một <b>thông báo cải chính riêng</b> tại mục CẢNH BÁO.')
swap(cc, 'Gỡ bài khỏi trang công khai ngay, không chờ xác minh xong', 'Gỡ bài khỏi trang công khai ngay, không chờ xác minh xong, khi: bài làm lộ thông tin cá nhân · bài có hướng dẫn có thể gây thiệt hại trực tiếp · quy định liên quan đã thay đổi làm nội dung không còn đúng · có yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền.')
swap(cc, 'Website có <b>đầu mối liên lạc trực cả ngoài giờ hành chính</b>', 'Website thực hiện ngay yêu cầu gỡ hoặc chỉnh sửa nội dung của cơ quan nhà nước có thẩm quyền.')
swap(cc, 'Hệ thống quản trị nội dung cho phép', None)
swap(cc, '7. Nhật ký cải chính công khai', '7. Ghi lại việc đã sửa')
swap(cc, 'Toàn bộ lần cải chính và gỡ bài được ghi vào một trang công khai', 'Mỗi lần cải chính được ghi ngay trên bài đã sửa: ngày sửa và nội dung đã sửa.')
swap(cc, 'Lý do công khai:', 'Lý do: một website hướng dẫn người dân kiểm chứng thì phải để người dân kiểm chứng được chính nó.')

txt = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
for bad in ('Thiên Lộc', 'Pháp nhân', 'tài trợ', 'Bản dự thảo ·', 'class=\\"fill\\"', 'dẫn nguồn'):
    assert bad not in json.dumps(POL, ensure_ascii=False), (bad)
open(p, 'w', encoding='utf8').write(pre + txt + tail)
print('ok', len(s), '->', len(pre + txt + tail))
