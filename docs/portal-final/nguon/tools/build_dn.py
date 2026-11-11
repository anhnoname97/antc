"""Chuyển "Ngân hàng tình huống đào tạo nhận thức doanh nghiệp v1.8" (bản chữ trích từ tệp .docx) thành src/dn_bank.js.
   Dùng: python3 -I tools/build_dn.py <dn18.txt> <src/dn_bank.js>
   - Phần A: 18 câu độc lập.  - Phần B: 12 tình huống × 3 bước.  - Phần C: 6 tình huống × 4 bước.
   - Bỏ các dòng "Mã:" (mã đối chiếu mục tiêu đào tạo, không dành cho người học) và Phần D–F (hướng dẫn cho người tổ chức).
   - Ở tình huống nhiều bước, mỗi bước là một câu; phần "Tình huống" của bước sau gồm bối cảnh và các dữ kiện đã mở ở bước trước."""
import sys, re, json
src, out = sys.argv[1], sys.argv[2]
L = [x.strip() for x in open(src, encoding='utf8').read().split('\n')]
L = [x for x in L if x]
iA = next(i for i, x in enumerate(L) if x.startswith('PHẦN A.'))
iB = next(i for i, x in enumerate(L) if x.startswith('PHẦN B.'))
iC = next(i for i, x in enumerate(L) if x.startswith('PHẦN C.'))
iD = next(i for i, x in enumerate(L) if x.startswith('PHẦN D.'))
iT = next(i for i, x in enumerate(L) if x.startswith('Bảng đối chiếu thuật ngữ'))

# Từ tiếng Anh còn sót trong câu hỏi: thay bằng từ tiếng Việt mà chính tài liệu đã dùng ở Bảng đối chiếu thuật ngữ.
VH = [(r'\bTreasury\b', 'Bộ phận ngân quỹ'), (r'\btreasury\b', 'bộ phận ngân quỹ'), (r'\bfull header\b', 'phần đầu thư đầy đủ'), (r'\bticket\b', 'phiếu yêu cầu hỗ trợ'),
      (r'\bcompliance/legal\b', 'bộ phận tuân thủ và pháp chế'), (r'\bcompliance\b', 'bộ phận tuân thủ'), (r'\blegal\b', 'pháp chế'), (r'\bonboarding\b', 'việc tiếp nhận'),
      (r'\bdebtor\b', 'bên có nghĩa vụ thanh toán'), (r'\bmaker-checker\b', 'hai người kiểm tra chéo'), (r'\blogistics\b', 'vận chuyển'), (r'\bCFO\b', 'Giám đốc tài chính'),
      (r'\bCEO\b', 'Tổng giám đốc'), (r'\bIT\b', 'bộ phận công nghệ thông tin'), (r'\b[Ll]og\b', 'nhật ký hệ thống'), (r'\bSLA\b', 'cam kết mức dịch vụ'),
      (r'\bemail\b', 'thư điện tử'), (r'\bEmail\b', 'Thư điện tử'), (r'\bPDF\b', 'PDF'), (r'\bmẫu mẫu\b', 'mẫu'), (r'\bmã mã\b', 'mã'), (r'\bbản bản\b', 'bản'),
      (r'\bbackup\b', 'sao lưu'), (r'\bdeepfake\b', 'giả hình ảnh, giọng nói'), (r'\bphishing\b', 'lừa lấy thông tin'), (r'\bcut-off\b', 'giờ chốt lệnh'),
      (r'\bescrow\b', 'tài khoản phong tỏa'), (r'\bEscrow\b', 'Tài khoản phong tỏa'), (r'\bpre-production\b', 'trước sản xuất'), (r'\bBản scan\b', 'Bản chụp'), (r'\bbooking\b', 'mã đặt chỗ'),
      (r' \(negotiable order B/L\)', ''), (r'\btest\b', 'thử nghiệm'), (r'\buptime\b', 'về thời gian hoạt động'), (r'\bMailbox\b', 'Hộp thư'), (r'\bfairness\b', 'tính công bằng'),
      (r'\bregistry\b', 'sổ đăng ký'), (r'\btheo SOP\b', 'theo quy trình đã ban hành'), (r'\b[BK]\d+\.(\d)\b', r'Bước \1'), (r'\bPO\b', 'đơn đặt hàng'), (r'\binvoice\b', 'hóa đơn'), (r'\bvendor\b', 'nhà cung cấp'), (r'\bKPI\b', 'chỉ tiêu')]
def vh(s):
    for a, b in VH: s = re.sub(a, b, s)
    s = s.replace('bộ phận công nghệ thông tin thấy', 'Bộ phận công nghệ thông tin thấy') if s.startswith('bộ phận công nghệ thông tin') else s
    return s.strip()
def opts(line):
    assert line.startswith('A. '), line[:60]
    parts, rest = [], line[3:]
    for k in 'BCD':
        m = re.search(r'(?:(?<=[\s.;])|^)' + k + r'\. ', rest)
        assert m, (k, line[:80])
        parts.append(rest[:m.start()].strip()); rest = rest[m.end():]
    parts.append(rest.strip())
    res = []
    for k, t in zip('ABCD', parts):
        t = vh(t)
        assert t, line[:80]
        if not re.search(r'[.!?]$', t): t += '.'
        res.append([k, t])
    return res
def ans(line):
    m = re.match(r'Đáp án: ([ABCD])\.\s*(?:Giải thích:\s*)?(.*)$', line)
    assert m, line[:80]
    return m.group(1), vh(m.group(2))
SEC = 40
def item(code, kind, sit, q, o, a, why):
    return {'code': code, 'kind': kind, 'sit': sit, 'q': q, 'opt': o, 'ans': a, 'exp': {a: why}, 'safe': '', 'sec': SEC}

# ----- Phần A -----
A, i = [], iA + 1
while i < iB:
    m = re.match(r'(A\d\d)\. (.+)$', L[i])
    if not m: i += 1; continue
    code, title = m.group(1), m.group(2); i += 1
    body = []
    while not L[i].startswith('A. '): body.append(L[i]); i += 1
    o = opts(L[i]); a, why = ans(L[i + 1]); i += 2
    body = vh(' '.join(body))
    # câu hỏi là câu cuối của đoạn nếu kết thúc bằng dấu hỏi; không thì dùng câu hỏi chung
    mq = re.match(r'^(.*[.!…”"])\s+([^.!?]*\?)$', body)
    if mq: sit, q = mq.group(1), mq.group(2)
    else: sit, q = body, 'Trong tình huống này, cách xử lý nào phù hợp nhất?'
    A.append(item(code, 'Câu ' + str(len(A) + 1) + ' · ' + vh(title), sit, q, o, a, why))
assert len(A) == 18, len(A)

# ----- Phần B, C -----
def multi(i0, i1, head, stepre, nstep, label):
    out, i, n = [], i0 + 1, 0
    while i < i1:
        m = re.match(head + r'(\d\d)\. (.+)$', L[i])
        if not m: i += 1; continue
        n += 1; title = vh(m.group(2)); i += 1
        ctx = vh(re.sub(r'^Bối cảnh:\s*', '', L[i])); ctx = ctx[0].upper() + ctx[1:]; i += 1
        facts, k = [], 0
        while i < i1 and not re.match(head + r'\d\d\. ', L[i]):
            ms = re.match(stepre + r'\d+\.(\d): (.+)$', L[i])
            if ms:
                k += 1; q = vh(ms.group(2)); i += 1
                o = opts(L[i]); a, why = ans(L[i + 1]); i += 2
                q = q.replace('Ở bước này, nhóm nên quyết định thế nào cho an toàn nhất?', 'Ở bước này, quyết định nào phù hợp nhất?')
                q = {'Ưu tiên?': 'Ở bước này, ưu tiên việc nào?', 'Quyết định?': 'Ở bước này, quyết định nào phù hợp nhất?', 'Rủi ro trung tâm?': 'Rủi ro trung tâm của tình huống này là gì?', 'Việc nào nên làm trước?': 'Ở bước này, việc nào nên làm trước?'}.get(q, q)
                extra = ''
                if not q.endswith('?'):
                    extra, q = q, 'Ở bước này, quyết định nào phù hợp nhất?'
                else:
                    mq = re.match(r'^(.*[.;:])\s+([^.;:]*\?)$', q)
                    if mq and len(mq.group(1)) > 25: extra, q = mq.group(1), mq.group(2)
                sit = ctx + ''.join(' Dữ kiện mới ở bước %d: %s' % (j + 2, f) for j, f in enumerate(facts)) + (' ' + extra if extra else '')
                out.append(item('%s%02d.%d' % (label, n, k), 'Tình huống %d · Bước %d/%d · %s' % (n, k, nstep, title), sit, q, o, a, why))
                continue
            md = re.match(r'Dữ kiện bổ sung[^:]*:\s*(.+)$', L[i])
            if md:
                f = vh(md.group(1)); facts.append(f[0].upper() + f[1:])
            i += 1
        assert k == nstep, (title, k)
    return out
B = multi(iB, iC, 'TH', 'B', 3, 'TH')
C = multi(iC, iD, 'THK', 'K', 4, 'TK')
assert len(B) == 36 and len(C) == 24, (len(B), len(C))

terms = []
for x in L[iT + 2:iA]:
    m = re.match(r'([^:]+): (.+)$', x)
    if m: terms.append([m.group(1), m.group(2)])
CD = 'Phòng ngừa lừa đảo và rủi ro trong giao dịch, hợp đồng kinh tế của doanh nghiệp'
COMMON = ['Phần này dành cho người làm việc trong doanh nghiệp: kế toán, ngân quỹ, mua hàng, bán hàng, pháp chế và quản lý.',
          'Mỗi câu là một tình huống. Bạn chọn một cách xử lý, rồi đọc phần giải thích. Không phải lúc nào dừng lại cũng là đáp án phù hợp: có tình huống quyết định hợp lý là tiếp tục, hoặc tiếp tục có điều kiện.',
          'Số tiền, tên doanh nghiệp và chi tiết trong tình huống là giả định để luyện tập.']
QBDN = {
 'dn1': {'t': 'Phần A · 18 câu độc lập', 'sh': 'Phần A · Câu độc lập', 'sub': '18 câu · mỗi câu một tình huống ngắn', 'intro': COMMON, 'terms': terms, 'q': A},
 'dn2': {'t': 'Phần B · 12 tình huống ứng dụng', 'sh': 'Phần B · Tình huống ứng dụng', 'sub': '36 câu · mỗi tình huống 3 bước quyết định',
         'intro': COMMON + ['Mỗi tình huống có 3 bước. Sau mỗi bước, tình huống có thêm dữ kiện mới; bạn quyết định lại theo dữ kiện đó.'], 'terms': terms, 'q': B},
 'dn3': {'t': 'Phần C · 6 tình huống tổng hợp', 'sh': 'Phần C · Tình huống tổng hợp', 'sub': '24 câu · mỗi tình huống 4 bước, có dữ kiện gây nhiễu',
         'intro': COMMON + ['Mỗi tình huống có 4 bước, có dữ kiện gây nhiễu, và có ít nhất một bước mà quyết định hợp lý là tiếp tục.'], 'terms': terms, 'q': C},
}
js = ('/* Ngân hàng câu hỏi dành cho nhân viên doanh nghiệp. Sinh tự động bằng tools/build_dn.py từ tài liệu\n'
      '   "Ngân hàng tình huống đào tạo nhận thức doanh nghiệp v1.8" — chuyên đề: ' + CD + '.\n   Không sửa tay tệp này; sửa tài liệu gốc rồi chạy lại công cụ. */\n'
      'var QBDN=' + json.dumps(QBDN, ensure_ascii=False, separators=(',', ':')) + ';\nObject.keys(QBDN).forEach(function(k){QB[k]=QBDN[k]});\n')
open(out, 'w', encoding='utf8').write(js)
print('A', len(A), 'B', len(B), 'C', len(C), 'thuật ngữ', len(terms), 'ký tự', len(js))
