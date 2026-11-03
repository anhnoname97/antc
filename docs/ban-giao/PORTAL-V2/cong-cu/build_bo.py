"""Dung du lieu nut noi dung cho mockup backoffice day du tu ban dung v2."""
import json, sys, re, unicodedata, html as H

v2path, djpath, srcpath, outpath = sys.argv[1:5]
V = json.load(open(v2path, encoding='utf-8'))
R = json.load(open(djpath, encoding='utf-8'))

_n = 0
def k():
    global _n
    _n += 1
    return 'r%d' % _n

def slug(s):
    s = unicodedata.normalize('NFD', s).replace('đ', 'd').replace('Đ', 'D')
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:60]

def ddmm(d):
    p = d.split('/')
    return '%s-%s-%s' % (p[2], p[1], p[0]) if len(p) == 3 else ''

N = []
def node(id, parent, type, name, v=None, st='pub'):
    N.append({'id': id, 'p': parent, 'type': type, 'name': name, 'st': st, 'v': v or {}})

# ---- ma va anh xa
CHS = {'dt': 'dien-thoai', 'tn': 'tin-nhan', 'mxh': 'mang-xa-hoi', 'web': 'website-ung-dung', 'san': 'san-thuong-mai', 'mail': 'thu-dien-tu', 'tt': 'truc-tiep'}
SIGNID = {'key': 'doc-ma', 'app': 'cai-ung-dung', 'lock': 'phi-mo-khoa', 'face': 'quet-khuon-mat', 'hush': 'giu-bi-mat', 'call': 'can-goi-lai'}
SIGNNAME = {'key': 'Đòi đọc mã OTP, mật khẩu', 'app': 'Bảo cài ứng dụng qua đường link', 'lock': 'Bắt nộp phí để lấy tiền đang bị giữ', 'face': 'Bảo quét khuôn mặt, gửi ảnh giấy tờ', 'hush': 'Ép quyết ngay, giữ bí mật', 'call': 'Cản gọi lại số chính thức'}
AUDID = ['cong-nhan', 'nguoi-cao-tuoi', 'hoc-sinh-sinh-vien', 'tieu-thuong', 'nguoi-moi-dung']
LV = {'d': 'ratCao', 'h': 'cao', 'n': 'thuong'}
POPV = {1: 'thuong-gap', 2: 'rat-pho-bien', 3: 'thuong-gap', 4: 'rat-pho-bien', 5: 'thuong-gap', 6: 'it-gap', 7: 'thuong-gap', 8: 'it-gap', 9: 'thuong-gap', 10: 'it-gap'}
PBSLUG = ['tra-loi-nhanh', 'dang-bi-thuc-ep', 'da-chuyen-tien', 'bi-chiem-quyen-tai-khoan', 'duoc-moi-dau-tu', 'khong-lay-lai-duoc-tien', 'lo-giay-to-chu-ky', 'tu-kiem-chung', 'bi-de-doa', 'tien-la-chuyen-vao']
PBICON = ['quiz', 'clock', 'money', 'key', 'chart', 'doc', 'id', 'search', 'alert', 'inbox']

def lines_html(items):
    return ''.join('<li>%s</li>' % x for x in items)

def blocks_html(bl):
    out = []
    for b in bl:
        t = b[0]
        if t == 'h' or t == 'dolo':
            out.append('<h3>%s</h3>' % b[1])
        elif t == 'p':
            out.append('<p>%s</p>' % b[1])
        elif t == 'now':
            out.append('<div class="k-now"><p><b>%s</b></p>%s</div>' % (b[1], ''.join('<p>%s</p>' % x for x in b[2])))
        elif t == 'box':
            out.append('<div class="k-box"><p><b>%s</b></p>%s</div>' % (b[2], ''.join('<p>%s</p>' % x for x in b[3])))
        elif t == 'tbl':
            rows = ''.join('<tr><td>%s</td><td>%s</td></tr>' % (r[0], r[1]) for r in b[3])
            out.append('<table><tr><th>%s</th><th>%s</th></tr>%s</table>' % (b[1], b[2], rows))
        elif t == 'st':
            rows = ''.join('<tr><td><b>%s</b></td><td>%s</td></tr>' % (r[0], '<br>'.join('%s: %s' % (a, c) for a, c in r[1])) for r in b[2])
            out.append('<table><tr><th>%s</th><th>%s</th></tr>%s</table>' % (b[1][0], b[1][1], rows))
        elif t == 'stop':
            out.append('<div class="k-stop"><p><b>%s</b></p><p>%s</p><ul>%s</ul></div>' % (b[1], b[2], lines_html(b[3])))
        elif t == 'pocket':
            out.append('<div class="k-pocket"><p><b>%s</b></p><p>%s</p><ul>%s</ul></div>' % (b[1], b[2], lines_html(b[3])))
        elif t == 'chips':
            out.append('<div class="k-chips"><p>%s</p></div>' % ' · '.join(b[1]))
        elif t == 'steps':
            out.append('<ol>%s</ol>' % lines_html(b[1]))
        elif t in ('nofault', 'recov'):
            out.append('<div class="k-note"><p>%s</p></div>' % b[1])
        elif t == 'case':
            out.append('<div class="k-case">%s</div>' % ''.join('<p><b>%s</b> %s</p>' % (a, c) for a, c in b[1]))
        elif t == 'end':
            out.append('<p><i>%s</i></p>' % b[1])
    return ''.join(out)

def pol_html(bl):
    out = []
    for b in bl:
        t, rest = b[0], b[1:]
        if t == 'h':
            out.append('<h3>%s</h3>' % rest[0])
        elif t == 'n':
            out.append('<div class="k-box"><p>%s</p></div>' % rest[0])
        else:
            for x in rest:
                if isinstance(x, str):
                    out.append('<p>%s</p>' % x)
                elif isinstance(x, list):
                    out.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % (y if isinstance(y, str) else ' — '.join(map(str, y))) for y in x))
    return ''.join(out)

# ---- Cai dat website
ST = V['STATE']
node('settings', None, 'siteSettings', 'Cài đặt website', {
    'princ': [{'_k': k(), 'ic': p[0], 't': p[1], 'd': p[2]} for p in V['PRINC']],
    'rev': '2026-10-20', 'next': '2027-01-20',
    'disc': 'Thông tin trên website chỉ để tham khảo, giúp bạn tự kiểm tra và tự quyết định. Website không tiếp nhận tố giác và không thay cho tư vấn pháp lý, tài chính.',
    'links': [{'_k': k(), 'nhan': 'Về website', 'trang': 'info-ve-website'}, {'_k': k(), 'nhan': 'Nguyên tắc nội dung', 'trang': 'info-nguyen-tac'}, {'_k': k(), 'nhan': 'Chính sách bảo vệ dữ liệu cá nhân', 'trang': 'pol-dl'}, {'_k': k(), 'nhan': 'Tuyên bố miễn trừ trách nhiệm', 'trang': 'pol-mt'}],
    'commit': V['BONKHONG'],
    'links2': [{'_k': k(), 'nhan': 'Hỏi – Đáp', 'trang': 'hoi-dap'}, {'_k': k(), 'nhan': 'Liên hệ đúng nơi', 'trang': 'lien-he'}, {'_k': k(), 'nhan': 'Xác minh đúng trang', 'trang': 'info-xac-minh'}, {'_k': k(), 'nhan': 'Góp ý', 'trang': 'gop-y'}],
    'op': 'Website do pháp nhân chủ quản vận hành dưới sự định hướng, thẩm định nội dung chuyên môn của Công an xã Thiên Lộc.',
    'siteName': 'An toàn tài chính', 'tagline': 'Tự kiểm tra trước khi đưa tiền, mã hoặc giấy tờ',
    'logo': 'm-logo', 'logoAlt': 'An toàn tài chính', 'logo2': 'm-logo-w', 'logo2Alt': 'An toàn tài chính',
    'bar': 'thu', 'noindex': True, 'contest': True, 'cShort': 'Cuộc thi', 'cFull': 'Cuộc thi trực tuyến tìm hiểu an toàn tài chính',
    'spon': False, 'sName': '', 'sLogo': '', 'sLink': '', 'sNote': '',
    'resnote': V['RESNOTE'], 'notconc': V['NOTCONC'], 'stDLab': ST['d']['lab'], 'stDTxt': ST['d']['txt'], 'stHLab': ST['h']['lab'], 'stHTxt': ST['h']['txt'], 'stNLab': ST['n']['lab'], 'stNTxt': ST['n']['txt'],
    'notreport': 'Website không tiếp nhận tố giác, tin báo về tội phạm. Việc trình báo phải thực hiện tại cơ quan Công an.',
    'noadvice': V['NOADVICE'], 'must': V['MUST'], 'banka': V['BANKA'], 'refuse': V['REFUSE']})

# ---- Trang chu
node('home', None, 'homePage', 'Trang chủ', {
    'kick': 'Khẩn cấp', 'title': 'Bạn vừa nhận tin nhắn, cuộc gọi hoặc lời mời đáng ngờ?', 'desc': 'Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay.',
    'btn1': 'Tôi đang gặp chuyện gì?', 'btn2': 'Xem việc cần làm ngay', 'prLead': 'Trong lúc chưa rõ, nhớ bốn điều:',
    'toolsTitle': 'Hãy tự kiểm tra', 'tools': ['tool1', 'tool2', 'tool3'], 'riskTitle': 'Các rủi ro', 'alertTitle': 'Cảnh báo mới', 'alertMore': 'Xem tất cả cảnh báo', 'alertCount': '3', 'pin': ''})

# ---- Khan cap
DD = V['DOORDEF']; DO = V['DOORS']
def tgt(x):
    return 'wizard' if isinstance(x, str) else 'p%d' % x
doors = []
for n in ['1', '2', '3']:
    d = DD[n]
    if n in DO:
        doors.append({'_k': k(), 't': d['t'], 's': d['s'], 'ill': d['ill'], 'kind': 'luaChon', 'to': '', 'opts': [{'_k': k(), 'ic': o[0], 't': o[1], 'to': tgt(o[2])} for o in DO[n]['opts']]})
    else:
        doors.append({'_k': k(), 't': d['t'], 's': d['s'], 'ill': d['ill'], 'kind': 'trang', 'to': 'p8', 'opts': []})
node('khan-cap', 'home', 'khanCapPage', 'Khẩn cấp', {
    'title': 'Khẩn cấp', 'lead': 'Nhận được cuộc gọi, tin nhắn, lời mời đáng ngờ, hoặc đã lỡ làm theo? Bắt đầu từ đây.',
    'wzTitle': 'Tôi đang gặp chuyện gì?', 'wzDesc': 'Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay. Không cần đăng nhập, không lưu câu trả lời.', 'wzBtn': 'Bắt đầu',
    'doorLead': 'Chọn ô gần đúng nhất. Việc cần làm đi theo điều đã xảy ra, bạn không cần kể đúng câu chuyện.', 'doors': doors, 'noneTo': 'p0',
    'helper': 'Đang giúp người thân, hay xử lý việc của cửa hàng? Chọn theo điều đã xảy ra với người đó.',
    'sits': ['p%d' % i for i in range(1, 10)],
    'hot': [{'_k': k(), 'so': '113', 'ht': 'goi', 'mt': 'Chỉ khi có nguy hiểm tức thời hoặc cần Cảnh sát đến ngay.', 'cp': ''},
            {'_k': k(), 'so': '156', 'ht': 'ca2', 'mt': 'Phản ánh cuộc gọi, tin nhắn rác hoặc có dấu hiệu lừa đảo. Gọi và nhắn tin đều miễn phí.', 'cp': ''},
            {'_k': k(), 'so': '5656', 'ht': 'nhan', 'mt': 'Phản ánh qua tin nhắn, miễn phí, cùng cú pháp như 156. Không phải số để gọi.', 'cp': ''}],
    'hotDate': '', 'hotSrc': '', 'hotBank': [], 'end': [{'_k': k(), 'nhan': 'Mở Công cụ & checklist', 'trang': 'cong-cu'}]})

# ---- Trinh hoi
SP = {
 1: [('dt', 'Cuộc gọi', 'call'), ('tn', 'Tin nhắn SMS/Zalo/WhatsApp', 'chat'), ('mail', 'Email', 'mail'), ('mxh', 'Facebook/TikTok/YouTube', 'users'), ('web', 'Website hoặc quảng cáo', 'globe'), ('tt', 'Người quen giới thiệu', 'person')],
 2: [('money', 'Chuyển tiền hoặc đặt cọc', 'money'), ('otp', 'Cung cấp OTP, mật khẩu, mã PIN', 'key'), ('app', 'Cài ứng dụng hoặc nhấn link', 'app'), ('invest', 'Đầu tư, mua coin, mở tài khoản', 'chart'), ('loan', 'Vay tiền hoặc trả phí trước', 'coins'), ('id', 'Gửi ảnh CCCD, ảnh khuôn mặt, chữ ký', 'face')],
 3: [('profit', '“Lợi nhuận cao, bảo đảm vốn”', 'chart'), ('lock', '“Tài khoản sẽ bị khóa”', 'lock'), ('gov', '“Cơ quan chức năng đang liên hệ”', 'shield'), ('job', '“Việc nhẹ, lương cao”', 'brief'), ('refund', '“Hoàn tiền, trúng thưởng, hỗ trợ hoàn vốn”', 'gift'), ('rush', '“Cần quyết định ngay hôm nay”', 'clock')]}
OK = {}
opts = {}
for s in (1, 2, 3):
    opts[s] = []
    for code, t, ic in SP[s]:
        kk = 'o%d-%s' % (s, code); OK[(s, code)] = kk
        opts[s].append({'_k': kk, 't': t, 'ic': ic})
A4 = ['Không chuyển tiền ngay.', 'Gọi lại qua số chính thức.', 'Hỏi người thân tin cậy.', 'Nếu đã chuyển, liên hệ ngân hàng ngay.']
MATRIX = [
 ('Giả mạo ngân hàng yêu cầu OTP', 'd', ['dt', 'tn', 'mail'], ['otp', 'app'], ['lock'], 'doc7', 7, ['Người gọi hoặc tin nhắn tự xưng ngân hàng', 'Yêu cầu đọc hoặc nhập mã OTP, mật khẩu', 'Dọa tài khoản sắp bị khóa'], ['Không đọc, không gửi mã OTP cho bất kỳ ai.', 'Cúp máy, tự gọi số in ở mặt sau thẻ.', 'Không bấm đường link trong tin nhắn.', 'Nếu đã đọc mã, gọi ngân hàng ngay để khóa tài khoản.']),
 ('Giả mạo công an, thuế, tòa án', 'd', ['dt', 'tn'], ['money', 'app', 'id'], ['gov', 'rush'], 'doc7', 7, ['Tự xưng cơ quan chức năng, nói bạn liên quan vụ việc', 'Yêu cầu chuyển tiền để “xác minh”', 'Bắt giữ bí mật, quyết định ngay'], ['Không chuyển tiền.', 'Cúp máy, tự liên hệ cơ quan Công an nơi cư trú.', 'Kể với người thân trước khi làm gì tiếp.', 'Không cài ứng dụng theo yêu cầu.']),
 ('Giả mạo bưu điện, giao hàng, hoàn tiền', 'h', ['dt', 'tn'], ['app', 'money', 'otp'], ['refund'], 'doc6', 6, ['Báo có đơn hàng, bưu phẩm hoặc khoản hoàn tiền', 'Gửi đường link để “nhận hoàn tiền”', 'Yêu cầu nộp phí nhỏ trước'], A4),
 ('Lừa đảo việc làm online, cọc việc làm', 'd', ['mxh', 'tn', 'web'], ['money', 'app'], ['job'], 'doc5', 5, ['Việc nhẹ, lương cao, làm tại nhà', 'Bắt nạp tiền hoặc đặt cọc để nhận việc', 'Trả hoa hồng vài lần đầu rồi đòi nạp thêm'], ['Không nạp, không đặt cọc để nhận việc.', 'Tra tên công ty qua kênh do bạn tự tìm.', 'Hỏi người thân tin cậy.', 'Nếu đã chuyển, liên hệ ngân hàng ngay.']),
 ('Lừa đảo đầu tư crypto, forex, chứng khoán', 'd', ['mxh', 'web', 'tt', 'tn'], ['invest', 'money', 'app'], ['profit', 'rush'], 'doc3', 3, ['Hứa lợi nhuận cao, bảo đảm vốn', 'Mời mở tài khoản trên ứng dụng lạ', 'Thúc quyết định ngay hôm nay'], ['Không chuyển tiền vào tài khoản cá nhân.', 'Kiểm tra giấy phép của bên mời.', 'Hỏi người thân tin cậy.', 'Nếu đã chuyển, liên hệ ngân hàng ngay.']),
 ('App vay, phí trước, vay nhanh', 'h', ['web', 'mxh', 'tn'], ['loan', 'app', 'id'], ['rush'], 'doc4', 4, ['Vay nhanh, duyệt trong vài phút', 'Đòi phí trước khi giải ngân', 'Xin quyền danh bạ, ảnh, giấy tờ'], ['Không trả phí trước khi nhận tiền vay.', 'Không gửi ảnh giấy tờ cho ứng dụng lạ.', 'Hỏi người thân tin cậy.', 'Chỉ vay ở tổ chức có giấy phép.']),
 ('Giả mạo người thân, sếp, khách hàng', 'h', ['tn', 'dt', 'mxh'], ['money'], ['rush'], 'doc7', 7, ['Tự xưng người quen đang cần tiền gấp', 'Đổi số tài khoản nhận tiền', 'Dặn đừng hỏi ai'], ['Không chuyển tiền ngay.', 'Gọi lại số bạn vẫn lưu của người đó.', 'Hỏi người thân tin cậy.', 'Nếu đã chuyển, liên hệ ngân hàng ngay.']),
 ('Mua bán online, người mua giả, QR lừa đảo', 'h', ['mxh', 'tn', 'web'], ['app', 'otp', 'money'], ['refund'], 'doc6', 6, ['Người mua gửi mã QR hoặc link để “nhận tiền”', 'Yêu cầu nhập OTP để nhận thanh toán', 'Nói đã chuyển thừa, đòi hoàn lại'], ['Không quét mã QR người lạ gửi để nhận tiền.', 'Tự mở ứng dụng ngân hàng xem tiền đã về chưa.', 'Không đọc mã OTP.', 'Hỏi người thân tin cậy.']),
 ('Bảo hiểm giả, bảo hiểm đầu tư', 'n', ['dt', 'tt', 'mxh'], ['invest', 'money'], ['profit'], 'doc2', 2, ['Giới thiệu bảo hiểm như khoản tiết kiệm lãi cao', 'Không đưa hợp đồng đầy đủ để đọc trước'], ['Đọc hết hợp đồng trước khi ký.', 'Hỏi rõ phí, quyền lợi và cách dừng hợp đồng.', 'Hỏi người thân tin cậy.']),
 ('Lộ CCCD, ảnh khuôn mặt, chữ ký', 'h', ['dt', 'tn', 'mail', 'mxh', 'web', 'tt'], ['id'], [], 'p6', 8, ['Bị yêu cầu gửi ảnh giấy tờ hoặc quét khuôn mặt cho người lạ'], ['Không gửi thêm giấy tờ.', 'Theo dõi tài khoản ngân hàng, ví điện tử.', 'Cảnh giác với cuộc gọi mạo danh sau đó.'])]
mrows = [{'_k': k(), 'name': m[0], 'level': LV[m[1]], 's1': [OK[(1, c)] for c in m[2]], 's2': [OK[(2, c)] for c in m[3]], 's3': [OK[(3, c)] for c in m[4]],
          'article': m[5], 'checklist': 'chk%d' % m[6], 'signs': m[7], 'actions': m[8], 'on': True} for m in MATRIX]
node('wizard', 'khan-cap', 'wizardPage', 'Kiểm tra tình huống', {
    'q1': 'Bạn nhận được thông tin qua kênh nào?', 'h1': 'Chọn một kênh. Nếu nhiều kênh, chọn kênh đầu tiên họ liên hệ.', 'o1': opts[1],
    'q2': 'Họ yêu cầu bạn làm gì?', 'h2': 'Chọn tất cả việc họ yêu cầu.', 'o2': opts[2],
    'q3': 'Họ nói gì để thuyết phục bạn?', 'h3': 'Chọn tất cả câu bạn đã nghe.', 'o3': opts[3],
    'matrix': mrows, 'r1': 'Mức độ cần thận trọng', 'r2': 'Có thể là', 'r3': 'Dấu hiệu phù hợp', 'r4': 'Việc cần làm ngay', 'maxShow': '3',
    'none': 'Chưa khớp tình huống nào trong danh sách. Hãy giữ bốn nguyên tắc dừng lại.',
    'b1': 'Xem bài hướng dẫn chi tiết', 'b2': 'Tải danh sách kiểm tra (PDF)', 'b3': 'Gửi cho người thân', 'b4': 'Kiểm tra lại', 'defChk': 'chk1'})

# ---- Viec can lam
for i in range(10):
    p = R['PB'][str(i)]
    steps, screen = [], []
    pend_cond = ''
    for b in p['blocks']:
        if 's' in b:
            steps.append({'_k': k(), 's': b['s'], 'd': b.get('d', []), 'say': b.get('say', ''), 'bank': bool(b.get('bank')), 'cond': pend_cond, 'snip': '', 'ask': False, 'askQ': '', 'askBtn': '', 'askNote': '', 'askTo': ''})
            pend_cond = ''
        elif 'branch' in b:
            if i == 0 or not steps:
                screen.append({'_k': k(), 'q': b['q'], 'btn': b['btn'], 'note': b.get('sm', ''), 'to': 'p%d' % b['branch']})
            else:
                st = steps[-1]
                if not st['ask']:
                    st.update({'ask': True, 'askQ': b['q'], 'askBtn': b['btn'], 'askNote': b.get('sm', ''), 'askTo': 'p%d' % b['branch']})
        elif 'cond' in b:
            pend_cond = 'sn-cond'
        else:
            key = next(iter(b))
            if steps:
                steps[-1]['snip'] = 'sn-' + key
    node('p%d' % i, 'khan-cap', 'viecCanLamPage', p['title'].replace(' — ', ', '), {
        'title': p['title'].replace(' — ', ', '), 'slug': PBSLUG[i], 'icon': PBICON[i], 'lead': p['lead'], 'hide': bool(p.get('nop')),
        'steps': steps, 'screen': screen, 'rev': '2026-10-20', 'src': 'Bài đọc Chuyên đề 1 và Chuyên đề 8, bản 2.0'})

# ---- Cong cu & checklist
TL = V['TOOLLIST']
def bold(t):
    return t.replace('<b>', '**').replace('</b>', '**')
def stepno(p, idx):
    n = V['PB'][str(p)]['stepNo'][idx]
    assert n, 'khoi %d cua trang p%d khong phai buoc' % (idx, p)
    return n
def acts(pairs):
    return [{'_k': k(), 'page': 'p%d' % p, 'step': str(stepno(p, i))} for p, i in pairs]
def more(links):
    return [{'_k': k(), 'ic': ic, 'nhan': t, 'trang': tg} for tg, t, ic in links]
node('cong-cu', 'home', 'congCuPage', 'Hãy tự kiểm tra', {
    'title': 'Hãy tự kiểm tra', 'lead': 'Kiểm tra trước khi chuyển tiền, đầu tư, vay, hoặc khi nghi mình bị lừa. Không cần đăng nhập, không lưu câu trả lời.',
    'toolsTitle': 'Kiểm tra nhanh bằng vài câu hỏi', 'tools': ['tool1', 'tool2', 'tool3'],
    'chkTitle': 'Danh sách kiểm tra theo việc sắp làm', 'chkLead': 'Mỗi danh sách có hai phần: năm việc phải chặn ngay và bảng kiểm bỏ túi, lấy nguyên văn từ bài đọc chuyên đề. Bản trên website có nút In để in hoặc lưu thành PDF.',
    'knowTitle': 'Kiểm tra kiến thức', 'know': [{'_k': k(), 'ic': 'question', 'nhan': 'Thử sức: 8 câu', 'desc': 'Mỗi chuyên đề một câu, chọn xong là có giải thích.', 'trang': 'cuoc-thi'},
                                             {'_k': k(), 'ic': 'book', 'nhan': 'Tự luyện 200 câu', 'desc': 'Toàn bộ ngân hàng câu hỏi 8 chuyên đề. Không tính điểm, không lưu bài.', 'trang': 'cuoc-thi'}]})
KIND = {'stop': 'phaiDung', 'hold': 'tamHoan', 'check': 'canKiemTra'}
MEAN = {'y': 'co', 'self': 'co', 'n': 'khong', 'u': 'chuaBiet'}
def qs(T):
    return [{'_k': k(), 'kind': KIND[q['k']], 'q': bold(q['q']), 'help': bold(q.get('sub', '')),
             'opts': [{'_k': k(), 'label': o[1], 'mean': MEAN[o[0]]} for o in q.get('opts', [])]} for q in T['q']]
TL = V['TOOLLIST']; TQ = V['TQ']
TOOLACT = {'truoc-khi-chuyen-tien': ([(1, 0), (1, 1), (1, 3)], [(1, 1), (1, 2), (1, 3)], [(7, 0), (7, 1)],
                                     [('p1', 'Có người đang thúc bạn làm ngay', 'clock'), ('p7', 'Cách tự kiểm chứng trước khi đưa', 'search'), ('chk6', 'Danh sách kiểm tra: ' + V['BK']['6']['t'], 'quiz'), ('p2', 'Nếu đã lỡ chuyển tiền: việc cần làm', 'money')]),
           'truoc-khi-dau-tu-vay': ([(4, 2), (4, 4), (1, 3)], [(4, 0), (4, 1), (4, 3)], [(4, 3), (4, 4)],
                                    [('p4', 'Có người mời bạn góp vốn, đầu tư', 'chart'), ('chk3', 'Danh sách kiểm tra: ' + V['BK']['3']['t'], 'quiz'), ('chk4', 'Danh sách kiểm tra: ' + V['BK']['4']['t'], 'quiz'), ('p5', 'Đã góp tiền mà không rút được: việc cần làm', 'doc')])}
for nid, (slug_, name, icon, card) in zip(['tool1', 'tool2'], TL[:2]):
    T = TQ[slug_]; d, h_, n_, lk = TOOLACT[slug_]
    node(nid, 'cong-cu', 'toolCountPage', name, {'title': T['t'], 'slug': slug_, 'icon': icon, 'card': card, 'lead': T['lead'], 'showAdvice': slug_ == 'truoc-khi-dau-tu-vay',
        'qs': qs(T), 'resD': T['res']['d'], 'resH': T['res']['h'], 'resN': T['res']['n'],
        'noneMore': 'Qua được các câu này cũng chưa có nghĩa là giao dịch an toàn. Vẫn tự kiểm tra bằng kênh do chính bạn tìm ra.',
        'actD': acts(d), 'actH': acts(h_), 'actN': acts(n_), 'more': more(lk)})
node('tool3', 'cong-cu', 'toolBranchPage', TL[2][1], {'title': TL[2][1], 'slug': TL[2][0], 'icon': TL[2][2], 'card': TL[2][3],
    'lead': '4 câu hỏi để biết việc nào phải làm trước. Trả lời xong, bạn có danh sách việc cần làm theo đúng thứ tự.',
    'urgT': 'Đang có nguy hiểm tức thời?', 'urg': 'Nếu bạn đang bị đe dọa tính mạng, sức khỏe, hoặc có người tìm đến tận nơi: gọi 113 ngay.',
    'bq': [{'_k': k(), 'q': q['q'], 'label': q['lab'], 'yes': q.get('yes', ''), 'no': q.get('no', ''), 'to': 'p%d' % q['pb'], 'take': ','.join(str(stepno(q['pb'], i)) for i in q['take'])} for q in V['T3']],
    'noneT': 'Bạn chưa mất gì', 'none': 'Chưa mất gì là tình thế tốt nhất. Việc cần làm bây giờ là kiểm chứng trước khi đưa bất cứ thứ gì.', 'noneAct': acts([(1, 0), (1, 1), (1, 3)]),
    'hitT': 'Có {n} việc cần xử lý, làm theo thứ tự dưới đây', 'hitX': 'Làm xong nhóm 1 rồi mới sang nhóm 2. Bạn không có lỗi vì đã gặp chuyện này; việc quan trọng là không xử lý một mình.',
    'more': more([('p1', 'Có người đang thúc bạn làm ngay: đủ các bước', 'clock'), ('wizard', 'Tôi đang gặp chuyện gì? Trả lời 3 câu', 'quiz')])})
def part(doc, kind):
    x = [bl for bl in doc['b'] if bl[0] == kind]
    return x[0] if x else None
def strow(doc, lab):
    st = part(doc, 'st')
    if not st: return ''
    for r in st[2]:
        if r[0] == lab:
            return dict((f[0], f[1]) for f in r[1]).get('Làm ngay', '')
    return ''
for kk, bk in V['BK'].items():
    doc = R['DOCS'][kk]; st = part(doc, 'stop'); pk = part(doc, 'pocket')
    node('chk' + kk, 'cong-cu', 'checklistPage', bk['t'], {'title': bk['t'], 'icon': bk['i'],
        'lead': 'Lấy nguyên văn từ Bài đọc Chuyên đề %s. Trả lời phần 1, tích phần 2, rồi bấm xem kết quả.' % kk, 'src': 'doc' + kk,
        'p1Intro': st[2].rstrip().rstrip(':') + '.', 'p1Qs': st[3][:5], 'p1Note': st[3][5] if len(st[3]) > 5 else '',
        'p2Intro': ((pk[2] or '') + ' Tích những câu bạn đã tự trả lời được rõ ràng.').strip(), 'p2Items': pk[3],
        'doD': strow(doc, 'DỪNG'), 'doH': strow(doc, 'HOÃN'), 'pdf': '', 'ver': '2.0', 'rev': '2026-10-20'}, st='pub' if kk != '8' else 'draft')

# ---- Cac rui ro
RT = V['RTABS']
node('rui-ro', 'home', 'ruiRoPage', 'Các rủi ro', {'title': 'Các rủi ro', 'lead': 'Chọn một nhóm để xem cảnh báo và bài hướng dẫn.'})
node('canh-bao-moi', 'rui-ro', 'alertListPage', 'Cảnh báo mới', {'title': 'Cảnh báo mới', 'lead': RT[0]['lead'], 'sample': True})
for a in V['ALERTS']:
    node('al%d' % a['id'], 'canh-bao-moi', 'alertPage', a['t'], {
        'title': a['t'], 'desc': a['sum'], 'level': LV[a['st']], 'pop': POPV.get(a['id'], ''), 'popNote': '', 'steps': a['steps'],
        'signs': [SIGNID[V['SIGNS'][i][0]] for i in a['sg']], 'signs2': [], 'todo': 'p%d' % a['pb'],
        'agency': '', 'docNo': '', 'docDate': '', 'docUrl': '',
        'ch': [CHS[c] for c in a['ch']], 'aud': [AUDID[g - 1] for g in a['gr']], 'tac': ['t%d' % t for t in a['tac']], 'tabs': ['g-' + t for t in a.get('tabs', [])], 'rel': [],
        'kw': [], 'upd': ddmm(a['d']), 'ttl': '180'}, st='draft' if a['id'] == 10 else 'pub')
for t in RT[1:]:
    node('g-' + t['k'], 'rui-ro', 'riskCategoryPage', t['t'], {'tab': t['t'], 'short': t['s'], 'lead': t['lead'], 'icon': t['i'], 'tactics': [], 'pins': [], 'noAns': 'Không thấy câu trả lời? Gửi câu hỏi ở trang Hỏi – Đáp.'})
CD = {**{kk: v.split(' — ')[1] for kk, v in V['CD'].items()}}
for kk, d in R['DOCS'].items():
    CD.setdefault(kk, d['t'])
for kk, d in R['DOCS'].items():
    node('doc' + kk, 'g-' + V['DOCTAB'][kk], 'riskArticlePage', 'Bài đọc Chuyên đề %s: %s' % (kk, d['t']), {
        'title': 'Bài đọc Chuyên đề %s: %s' % (kk, d['t']), 'kind': 'docChuyenDe', 'desc': d.get('meta', ''), 'icon': 'book',
        'sum': '', 'signs': [], 'scen': [], 'todo': [], 'todoPage': '', 'dont': [], 'body': blocks_html(d['b']), 'srcs': [],
        'topic': 'cd' + kk, 'ch': [], 'aud': [], 'level': '', 'tabs': [], 'kw': [], 'syn': [], 'rel': [], 'chk': 'chk' + kk, 'feat': kk == '1',
        'ver': '2.0', 'rev': '2026-10-20', 'by': 'Công an xã Thiên Lộc'})
for kk, a in V['ARTS'].items():
    node('ar' + kk.replace('-', '_'), 'g-' + V['ARTTAB'].get(kk, 'lua-dao'), 'riskArticlePage', a['t'], {
        'title': a['t'], 'kind': 'docThem', 'desc': '', 'icon': 'doc', 'sum': '<p>%s</p>' % a['lede'], 'signs': [], 'scen': [], 'todo': [], 'todoPage': '', 'dont': [],
        'body': '', 'srcs': [], 'topic': '', 'ch': [], 'aud': [], 'level': '', 'tabs': [], 'kw': [], 'syn': [], 'rel': [], 'chk': '', 'feat': False,
        'ver': '1.0', 'rev': '', 'by': ''}, st='draft' if kk in ('7', '8') else 'pub')

# ---- trang khac
node('hoi-dap', 'home', 'hoiDapPage', 'Hỏi – Đáp', {})
node('lien-he', 'home', 'lienHePage', 'Liên hệ đúng nơi', {'title': 'Liên hệ đúng nơi', 'lead': 'Mỗi việc có một nơi nhận. Gọi đúng nơi thì việc được xử lý nhanh hơn.', 'groups': [
    {'_k': k(), 'grp': 'Ngân hàng, ví điện tử của bạn', 'unit': 'Tổng đài in trên thẻ hoặc trong ứng dụng bạn đã cài', 'how': V['BANKA'][:2], 'src': '', 'checked': ''},
    {'_k': k(), 'grp': 'Phản ánh cuộc gọi, tin nhắn lừa đảo', 'unit': 'Tổng đài 156, 5656', 'how': ['Gọi hoặc nhắn tin tới 156.', 'Nhắn tin tới 5656.'], 'src': '', 'checked': ''},
    {'_k': k(), 'grp': 'Trình báo sự việc', 'unit': 'Công an xã, phường nơi gần nhất hoặc nơi bạn cư trú', 'how': ['Đến trực tiếp, mang theo bằng chứng đã lưu.', 'Gọi 113 khi có nguy hiểm tức thời.'], 'src': '', 'checked': ''}]})
node('gop-y', 'home', 'gopYPage', 'Góp ý', {'title': 'Góp ý', 'lead': 'Thấy nội dung sai, khó hiểu hoặc đã cũ? Gửi cho Ban biên tập.', 'crit': '', 'reward': False})
for sid, t in [('info-ve-website', 'Về website'), ('info-nguyen-tac', 'Nguyên tắc nội dung'), ('info-xac-minh', 'Xác minh đúng trang')]:
    node(sid, 'home', 'infoPage', t, {'title': t, 'lead': '', 'body': '', 'gaps': ''})
for kk, p in R['POL'].items():
    node('pol-' + kk, 'home', 'policyPage', p['t'], {'title': p['t'], 'slug': slug(p['t']), 'ver': 'Bản dự thảo · chưa có ngày ban hành', 'body': pol_html(p['b'])}, st='draft')
node('cuoc-thi', 'home', 'thiPage', 'Cuộc thi trực tuyến', {})
node('tim-kiem', 'home', 'searchPage', 'Tìm kiếm', {})
node('404', 'home', 'notFoundPage', 'Không tìm thấy trang', {})

# ---- Thu vien
node('lib', None, 'libraryFolder', 'Thư viện', {})
node('f-ch', 'lib', 'channelFolder', 'Kênh tiếp cận', {})
for c in V['CHANNELS']:
    node(CHS[c['k']], 'f-ch', 'channelItem', c['t'], {'code': CHS[c['k']], 'icon': c['i'], 'active': True})
node('f-aud', 'lib', 'audienceFolder', 'Đối tượng', {})
for i, g in enumerate(V['GROUPS']):
    node(AUDID[i], 'f-aud', 'audienceItem', g['t'], {'code': AUDID[i], 'icon': g['i'], 'active': True, 'summary': g['s'], 'tactics': ['t%d' % t for t in g['tac']]})
node('f-sign', 'lib', 'stopSignFolder', 'Dấu hiệu phải dừng', {})
for s in V['SIGNS']:
    txt = s[1]; note = ''
    if '<small>' in txt:
        txt, note = txt.split('<small>'); note = note.replace('</small>', '')
    node(SIGNID[s[0]], 'f-sign', 'stopSignItem', SIGNNAME[s[0]], {'code': SIGNID[s[0]], 'icon': s[0], 'active': True, 'text': '<p>%s</p>' % txt, 'note': note})
node('f-pop', 'lib', 'popularityFolder', 'Mức độ phổ biến', {})
for code, t in [('it-gap', 'Ít gặp'), ('thuong-gap', 'Thường gặp'), ('rat-pho-bien', 'Rất phổ biến')]:
    node(code, 'f-pop', 'popularityItem', t, {'code': code, 'icon': 'chart', 'active': True, 'desc': ''})
node('f-topic', 'lib', 'topicFolder', 'Chuyên đề', {})
for kk in sorted(R['DOCS'], key=int):
    node('cd' + kk, 'f-topic', 'topicItem', CD[kk], {'code': 'chuyen-de-' + kk, 'icon': V['BK'][kk]['i'], 'active': True, 'number': kk, 'short': V['CDSHORT'].get(kk, ''), 'read': 'doc' + kk, 'chk': 'chk' + kk})
node('f-tac', 'lib', 'tacticFolder', 'Thủ đoạn', {})
for i, t in enumerate(V['TACTICS']):
    node('t%d' % i, 'f-tac', 'tacticItem', t['t'], {'code': slug(t['t'])[:40].strip('-'), 'active': True, 'topic': 'cd%d' % t['cd'], 'article': 'doc%d' % t['cd'], 'anchor': '',
         'ch': [CHS[c] for c in V['TCH'][str(i)]], 'level': LV[V['TLV'][str(i)]], 'kw': []})
node('t-cu', 'f-tac', 'tacticItem', 'Tin nhắn trúng thưởng, nhận quà tri ân', {'code': 'tin-nhan-trung-thuong', 'active': False, 'topic': 'cd7', 'article': 'doc7', 'anchor': '', 'ch': ['tin-nhan'], 'level': 'cao', 'kw': ['trúng thưởng']})
node('f-qa', 'lib', 'quickQaFolder', 'Hỏi – đáp nhanh', {})
for i, q in enumerate(V['QA']):
    node('qa%d' % i, 'f-qa', 'quickQaItem', q['q'], {'q': q['q'], 'a': q['a'], 'why': '<p>%s</p>' % q['why'], 'todo': '<p>%s</p>' % q['todo'], 'pages': [], 'by': 'Ban biên tập'})
node('f-snip', 'lib', 'snippetFolder', 'Đoạn dùng chung', {})
SN = {'bankbox': ('BANKBOX', lambda d: '<ul>%s</ul>' % lines_html(d['rows'])), 'recov': ('RECOV', None), 'cover': ('COVER', lambda d: '<p>%s</p>' % d['b']), 'legit': ('LEGIT', None), 'cond': ('COND', lambda d: '<ul>%s</ul>' % lines_html(d['items']))}
for key, (src, fn) in SN.items():
    d = R[src]
    if fn is None:
        if isinstance(d, dict):
            title = d.get('h', src); body = ''.join('<p>%s</p>' % v for kk2, v in d.items() if kk2 != 'h' and isinstance(v, str))
            for kk2, v in d.items():
                if isinstance(v, list): body += '<ul>%s</ul>' % lines_html(v)
        else:
            title, body = src, '<p>%s</p>' % d
    else:
        title, body = d.get('h', src), fn(d)
    node('sn-' + key, 'f-snip', 'sharedSnippet', title, {'title': title, 'body': body})

# ATTC_IMG_ALT cua ban dung; anh khong co thi dung cau mac dinh cua ban dung
ALT0 = 'Ảnh minh họa tình huống tự bảo vệ trước rủi ro tài chính'
ALT = {'00': 'Năm nhân vật người Việt của bộ ảnh An Toàn Tài Chính', '16': 'Năm người cùng xác minh thông tin và bảo vệ tài chính trên điện thoại',
       '19': 'Bốn bước qua suối tượng trưng cho chậm lại, xác minh, làm rõ và quyết định', '21': 'Người dân cùng chia sẻ thông tin phòng ngừa lừa đảo',
       '22': 'Thông tin được gửi kín và chia sẻ có chọn lọc', '23': 'Những tin nhắn đáng ngờ giữa dòng người dùng điện thoại',
       '29': 'Đọc kỹ điều khoản trước khi ký cam kết', '30': 'Phân biệt rủi ro đầu tư và thủ đoạn gian lận', '31': 'Thời gian quan trọng để ngăn thiệt hại và lưu chứng cứ'}
DOCIMG = {'1': '19', '2': '29', '3': '13', '4': '06', '5': '12', '6': '11', '7': '14', '8': '31'}
ARTIMG = {'1': '25', '2': '26', '3-1': '24', '3-2': '23', '3-3': '27', '4': '30', '5': '29', '6': '28', '7': '32', '8': '21'}
PBIMG = {'1': '10', '2': '31', '3': '39', '4': '40', '5': '13', '6': '41', '7': '15', '8': '37', '9': '11'}
ILLUS = {'home': '16', 'khan-cap': '35', 'wizard': '10', 'cong-cu': '19', 'tool1': '29', 'tool2': '30', 'tool3': '31', 'canh-bao-moi': '23',
         'g-lua-dao': '38', 'g-vay-va-no': '06', 'g-dau-tu': '30', 'g-bao-hiem-va-tiet-kiem': '08', 'g-du-lieu-ca-nhan': '39',
         'info-ve-website': '21', 'info-xac-minh': '27', 'gop-y': '22', 'lien-he': '20'}
THUMB = {'g-lua-dao': '09', 'g-vay-va-no': '08', 'g-dau-tu': '06', 'g-bao-hiem-va-tiet-kiem': '07', 'g-du-lieu-ca-nhan': '05'}
for x in N:
    i_, im = x['id'], None
    if i_ in ILLUS: im = ILLUS[i_]
    elif re.fullmatch(r'(doc|chk)[1-8]', i_): im = DOCIMG[i_[3:]]
    elif i_.startswith('ar'): im = ARTIMG.get(i_[2:].replace('_', '-'), '25')
    elif re.fullmatch(r'p\d', i_): im = PBIMG.get(i_[1:], '20')
    elif x['type'] == 'alertPage': im = '23'
    if im:
        x['v']['illus'] = 'm-a' + im
        x['v']['illusAlt'] = ALT.get(im, ALT0)
    if i_ in THUMB: x['v']['thumb'] = 'm-a' + THUMB[i_]
USED = sorted({x['v'][f][4:] for x in N for f in ('illus', 'thumb') if x['v'].get(f)})
MEDIA = [{'id': 'm-a' + n, 'name': 'minh-hoa-%s.jpg' % n, 'icon': 'image', 'sub': 'Ảnh minh họa bản dựng · ' + ALT.get(n, ALT0)} for n in USED] + [{'id': 'm-logo', 'name': 'logo-antc.svg', 'icon': 'image', 'sub': 'Logo · 240 × 64'}, {'id': 'm-logo-w', 'name': 'logo-antc-trang.svg', 'icon': 'image', 'sub': 'Logo nền tối · 240 × 64'},
         {'id': 'm-share', 'name': 'anh-chia-se-mac-dinh.png', 'icon': 'image', 'sub': 'Ảnh chia sẻ · 1200 × 630'}]

data = json.dumps({'N': N, 'MEDIA': MEDIA}, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
src = open(srcpath, encoding='utf-8').read()
out = src.replace('__DATA__', data)
open(outpath, 'w', encoding='utf-8', newline='\n').write(out)
js = out[out.index('<script>') + 8:out.rindex('</script>')]
open(outpath + '.js.tmp', 'w', encoding='utf-8').write(js)
print('nodes', len(N), 'bytes', len(out))
