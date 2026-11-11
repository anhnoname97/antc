"""Thay từ tiếng Anh bằng từ tiếng Việt trong chữ hiển thị của website (10/11/2026).
Giữ nguyên: chữ viết tắt bắt buộc hoặc khó thay (OTP, PIN, QR, SIM, eSIM, ATM, POS, SMS, PDF, Wi-Fi, USB, AI, NFT, ICO, VNeID, CIC),
tên riêng, nhãn hiệu (Zalo, Facebook, Telegram, TikTok…), "internet", "video", "website" (chờ quyết định riêng),
đường dẫn kỹ thuật (cong-cu-checklist…), mã tình huống, và mọi từ khóa tìm kiếm không dấu (để người dân gõ "link", "online" vẫn tìm ra).
Chỉ thay khi từ tiếng Anh đứng giữa chữ tiếng Việt, nên không đụng tới mã lệnh.
Dùng: python3 tools/viet_hoa.py <thư mục gốc>   (chạy lại không thay trùng; ghi nhật ký nhat-ky-viet-hoa.md)"""
import re,sys,os,json,glob,collections
R=sys.argv[1] if len(sys.argv)>1 else '/home/claude/web'
B=r"(?<![-\w@/#.'\"])"   # không dính vào mã, đường dẫn, địa chỉ, chuỗi mã
E=r"(?![-\w@'\"]|:\S)"   # không phải khóa của bảng mã (email:[…])
# (mẫu, thay bằng) — áp theo thứ tự
RULES=[
 # Checklist → Bảng kiểm
 (r'Công cụ (&amp;|&) checklist',r'Công cụ \1 bảng kiểm'),(r"'Checklist: '","'Bảng kiểm: '"),(r"'Checklist'","'Bảng kiểm'"),
 (B+r'CHECKLIST'+E,'BẢNG KIỂM'),(B+r'Checklist'+E,'Bảng kiểm'),(B+r'checklist'+E,'bảng kiểm'),
 # đường link → đường dẫn; giữ chữ "link" một lần ở nguyên tắc "Không bấm…" cho dễ nhận ra
 (r'Không bấm link lạ','Không bấm đường dẫn (link) lạ'),
 (r'đường link','đường dẫn'),(r'Đường link','Đường dẫn'),(r'ĐƯỜNG LINK','ĐƯỜNG DẪN'),
 (r'(bấm|gửi|qua|theo|mở|kèm|nhận|vào|là|có|chứa|một) link'+E,r'\1 đường dẫn'),
 (B+r'link'+E,'đường dẫn'),(B+r'Link'+E,'Đường dẫn'),(r'([Đđ])ường dẫn dẫn ',r'\1ường dẫn trỏ '),
 # online
 (r'([Bb])ắt cóc online',r'\1ắt cóc trực tuyến'),(r'BẮT CÓC ONLINE','BẮT CÓC TRỰC TUYẾN'),
 (r'(giao dịch|họp|học|khóa học|dịch vụ|thanh toán|bán hàng|mua hàng|mua sắm|mua bán|cửa hàng|làm việc|việc làm|kiếm tiền|bác sĩ|vay|cho vay|đầu tư|lớp học|sự kiện) online'+E,r'\1 trên mạng'),
 (B+r'online'+E,'trên mạng'),
 # thư điện tử
 (r"t:'Email'","t:'Thư điện tử'"),(r"'Email, ","'Thư điện tử, "),
 (r'phishing email','thư điện tử giả mạo'),
 (B+r'Email'+E,'Thư điện tử'),(B+r'email'+E,'thư điện tử'),(B+r'EMAIL'+E,'THƯ ĐIỆN TỬ'),
 # các từ khác
 (r'AI và deepfake','AI để giả hình ảnh, giọng nói (deepfake)'),
 (r'chống deepfake','chống giả mạo hình ảnh, giọng nói'),
 (r'đặt cọc, deepfake, hụi','đặt cọc, giả giọng nói, hụi'),
 (r'bằng deepfake','bằng AI giả khuôn mặt, giọng nói'),
 (r' ?\(deepvoice\)',''),
 (r'xuất nhập cảnh, visa,','xuất nhập cảnh, thị thực (visa),'),(r'(làm|thủ tục|xin|về|ảnh hưởng) visa',r'\1 thị thực'),(r', visa,',', thị thực,'),
 (B+r'voucher'+E,'phiếu mua hàng'),
 (r'của chatbot','của trợ lý ảo (chatbot)'),(r'hỏi chatbot','hỏi trợ lý ảo'),
 (r'vé máy bay, tour,','vé máy bay, chuyến du lịch,'),
 (r'Đừng tin logo','Đừng tin biểu tượng (logo)'),(B+r'Logo'+E,'Biểu tượng'),(B+r'logo'+E,'biểu tượng'),
 (r'nhiễm virus','nhiễm mã độc'),
 (r'phí casting','phí thử vai'),
 (B+r'homestay'+E,'nhà nghỉ'),
 (r'“hacker”','“tin tặc”'),(B+r'hacker'+E,'tin tặc'),
 (r'App vay tiền','Ứng dụng vay tiền'),(r'(?<=[ “"])app vay','ứng dụng vay'),
 (r'Video call','Cuộc gọi video'),(r'video call','cuộc gọi video'),
 (r'nạp game','nạp tiền trò chơi'),(r'tài khoản game','tài khoản trò chơi điện tử'),(r'vật phẩm game','vật phẩm trò chơi'),(r'(Zalo|Facebook), game',r'\1, trò chơi'),
 (B+r'KOL'+E,'người có ảnh hưởng'),
 (B+r'livestream'+E,'phát trực tiếp'),(B+r'Livestream'+E,'Phát trực tiếp'),
 (B+r'shipper'+E,'người giao hàng'),(B+r'Shipper'+E,'Người giao hàng'),
 (B+r'webinar'+E,'hội thảo trực tuyến'),(B+r'gameshow'+E,'trò chơi truyền hình'),(B+r'concert'+E,'ca nhạc'),
]
# Tên bài thủ đoạn: đưa tiếng Việt lên đầu, bỏ từ tiếng Anh khi đã có từ Việt
TITLES={
 '008':'Giả danh sếp qua thư điện tử công ty để thay đổi tài khoản thanh toán',
 '011':'Giả danh cơ quan xuất nhập cảnh, đại sứ quán để lừa đảo về thị thực, hộ chiếu',
 '017':'Cuộc gọi video, cuộc họp trực tuyến giả khuôn mặt, giọng nói bằng AI: sếp, đồng nghiệp, người yêu qua mạng',
 '018':'Video giả mạo người nổi tiếng, chuyên gia, người có ảnh hưởng quảng cáo đầu tư, sản phẩm, cờ bạc',
 '019':'“Chợ đen” mua bán bộ danh tính giả gồm khuôn mặt, giọng nói, dữ liệu sinh trắc học',
 '021':'Trợ lý AI tự hành bị lợi dụng để tự động hóa lừa đảo, tống tiền',
 '024':'Cuộc gọi tự động, kể cả cuộc gọi dùng AI, giả cơ quan nhà nước, ngân hàng, hãng công nghệ',
 '025':'Trợ lý ảo (chatbot) lừa đảo giả dịch vụ khách hàng, tư vấn đầu tư hoặc hỗ trợ khẩn cấp',
 '026':'Thư điện tử giả mạo ngân hàng, cơ quan nhà nước, dịch vụ lưu trữ đám mây',
 '027':'Tin nhắn SMS giả kèm đường dẫn đăng nhập, trúng thưởng, vi phạm giao thông',
 '028':'Gọi điện lừa lấy mật khẩu, mã OTP, thông tin thẻ',
 '029':'Mã QR giả trên hóa đơn, tờ rơi, bãi xe, thực đơn, thiệp mời',
 '031':'Đường dẫn giả mạo trên mạng xã hội, ứng dụng nhắn tin và nền tảng video ngắn',
 '034':'Tệp đính kèm độc hại, mã lệnh tự chạy trong tài liệu văn phòng, tệp cài đặt giả',
 '036':'Mã độc tống tiền mã hóa dữ liệu rồi đòi tiền chuộc',
 '037':'Đánh cắp phiên đăng nhập (cookie) để chiếm tài khoản đang mở',
 '043':'Lừa tình cảm rồi dẫn vào nền tảng đầu tư giả',
 '046':'Mô hình kim tự tháp thu phí tham gia theo tầng',
 '048':'Giả mạo quỹ đầu tư, công ty quản lý tài sản, “phần mềm tư vấn đầu tư tự động”',
 '074':'Lừa vé máy bay, chuyến du lịch, gói du lịch giá rẻ',
 '079':'Lừa dịch vụ “lấy lại tiền đã bị lừa”, “lấy lại ví” tài sản số',
 '081':'Lừa tình cảm yêu cầu tiền, quà, thị thực, vé máy bay',
 '084':'Tống tiền bằng ảnh, video nhạy cảm giả tạo bằng AI',
 '087':'Lừa trúng thưởng, trúng số, quà tặng, phiếu mua hàng',
 '088':'Lừa trúng thưởng qua sự kiện, trò chơi truyền hình, bốc thăm giả',
 '101':'Giả khuôn mặt, giọng nói khi phỏng vấn tuyển dụng, giả lãnh đạo để lấy giấy tờ định danh',
 '104':'Chèn hình ảnh giả vào bước xác thực sinh trắc học',
 '106':'Lừa bán “trợ lý AI tự kiếm tiền”, phần mềm giao dịch tự động không có sản phẩm thật',
 '107':'Cài lệnh ẩn vào nội dung bên ngoài để dẫn lệch trợ lý AI',
 '108':'Lừa “xác minh bằng AI”, dùng ảnh và video giả làm bằng chứng xác nhận',
 '109':'Giả đại sứ thương hiệu bằng AI giả khuôn mặt, giọng nói để mời đầu tư, bán hàng hoặc quyên góp',
 '110':'NFT, trò chơi chuỗi khối, thế giới ảo giả, bán quyền lợi rồi bỏ dự án',
 '116':'Lừa đòi hoàn tiền: đã nhận hàng nhưng cố ý khai chưa nhận',
 '122':'Giả cơ quan bảo hiểm sức khỏe và cảnh sát nước ngoài, dọa ảnh hưởng thị thực',
 '126':'Giả bác sĩ trên mạng kê đơn, bán thuốc không rõ nguồn gốc',
 '129':'Lừa vé ca nhạc, thể thao và lễ hội giả',
 '132':'Cửa sổ bật lên báo trúng điện thoại, phiếu mua hàng, quà tặng, ép cài ứng dụng hoặc nhập dữ liệu',
 '135':'Lừa sự kiện ảo, hội thảo trực tuyến và khóa học AI bằng chứng chỉ, cơ hội đầu tư giả',
 '138':'Dự án tiền số ôm tiền bỏ trốn, thổi giá rồi bán tháo, phát hành đồng tiền ảo (ICO)',
 '139':'Tặng tiền số miễn phí độc hại, ký cấp quyền rút tiền, địa chỉ ví nhiễu và ví giả',
 '140':'Chiếm dụng tiền khách trên sàn tiền số và mô hình tiền số đa cấp',
 '142':'“Bắt cóc trực tuyến”, cô lập người trẻ để tống tiền gia đình',
 '145':'Trạm phát sóng giả, tin nhắn thương hiệu giả và cuộc gọi nhỡ tính phí',
 '148':'Gắn thiết bị đọc trộm thẻ ở máy ATM, máy POS',
 '152':'Mua bán tài khoản trò chơi điện tử, nạp rẻ, SIM số đẹp và tài khoản nhiều người theo dõi',
}
CNT=collections.Counter()
def vh(s):
    for a,b in RULES:
        s,n=re.subn(a,b,s)
        if n:CNT[a]+=n
    return s
def has_vi(s):return re.search(r'[^\x00-\x7f]',s) is not None
def do_js(p,skip=None):
    """File JS hoặc HTML: chỉ đổi dòng có chữ tiếng Việt; bỏ qua dòng từ khóa tìm kiếm."""
    L=open(p,encoding='utf8').read().split('\n');out=[]
    for l in L:
        if skip and skip(l) or not has_vi(l):out.append(l);continue
        out.append(vh(l))
    open(p,'w',encoding='utf8').write('\n'.join(out))
def do_data(p):
    s=open(p,encoding='utf8').read();pre='window.__DATA__=';assert s.startswith(pre)
    body=s[len(pre):].rstrip();semi=body.endswith(';');body=body[:-1] if semi else body
    D=json.loads(body)
    def walk(x):
        if isinstance(x,str):return vh(x) if has_vi(x) else x
        if isinstance(x,list):return [walk(y) for y in x]
        if isinstance(x,dict):return {k:walk(v) for k,v in x.items()}
        return x
    D=walk(D)
    open(p,'w',encoding='utf8').write(pre+json.dumps(D,ensure_ascii=False,separators=(',',':'))+(';' if semi else '')+'\n')
def do_md(p):
    s=open(p,encoding='utf8').read();n=os.path.basename(p)[:3]
    if n in TITLES:
        h=s.split('\n',1);m=re.match(r'# (.*?)(\s*[:–-]\s*nhận diện và phòng tránh)?$',h[0])
        new='# '+TITLES[n]+': nhận diện và phòng tránh'
        if h[0]!=new:CNT['đổi tên bài']+=1
        s=new+'\n'+h[1]
    open(p,'w',encoding='utf8').write(vh(s))
src=os.path.join(R,'src')
do_data(os.path.join(src,'data.js'))
do_js(os.path.join(src,'app.js'))
do_js(os.path.join(src,'tinhhuong.js'))
do_js(os.path.join(src,'st_data.js'),skip=lambda l:l.startswith(" kw:'"))
do_js(os.path.join(src,'shell.html'))
do_js(os.path.join(R,'tools','build.py'))
for p in sorted(glob.glob(os.path.join(R,'bai','*.md'))):do_md(p)
log=['# Nhật ký thay từ tiếng Anh bằng tiếng Việt (10/11/2026)','','Áp bằng `tools/viet_hoa.py` cho chữ hiển thị của website và 157 bài thủ đoạn. Từ khóa tìm kiếm không dấu giữ nguyên.','','| Mẫu | Số chỗ thay |','|---|---|']
log+=['| `%s` | %d |'%(a.replace('|','\\|'),c) for a,c in CNT.most_common()]
if CNT:open(os.path.join(R,'nhat-ky-viet-hoa.md'),'w',encoding='utf8').write('\n'.join(log)+'\n')   # chạy lại không thay gì thì giữ nhật ký cũ
print(sum(CNT.values()),'chỗ thay;',len(CNT),'mẫu')
