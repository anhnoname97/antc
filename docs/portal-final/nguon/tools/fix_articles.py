"""Sửa các điểm trái quy tắc đã chốt trong 157 bài viết trước khi đưa lên website.
Mỗi chỗ sửa đều ghi vào nhat-ky-sua-bai.md để Ban biên tập đối chiếu. Chạy lại an toàn (đã sửa thì bỏ qua)."""
import os,re,sys
D=sys.argv[1]; LOG=sys.argv[2]
STOPNOTE=('Một dấu hiệu chưa đủ để kết luận, nhưng đủ để hoãn lại và tự kiểm chứng. Riêng các điểm dừng sau thì dừng ngay, '
 'không chờ dấu hiệu thứ hai: bị đòi đọc hoặc gửi mã OTP, mật khẩu; bị bảo cài ứng dụng, cho xem hay điều khiển màn hình; '
 'bị đòi nộp phí để lấy tiền hoặc hàng đang bị giữ; bị bảo quét khuôn mặt, gửi ảnh giấy tờ; bị bắt giữ bí mật; bị cản tự gọi lại số chính thức.')
R={
'001':[('**ngắt kết nối mạng**, gỡ ứng dụng, đổi mật khẩu từ một thiết bị khác.','**ngắt kết nối mạng** và ngừng dùng máy đó; từ một thiết bị khác, khóa tài khoản và đổi mật khẩu; chụp lại bằng chứng rồi mới gỡ ứng dụng.')],
'002':[('**ngắt kết nối mạng** (bật chế độ máy bay), gỡ ứng dụng, đổi mật khẩu ngân hàng và email từ một thiết bị khác.','**ngắt kết nối mạng** (bật chế độ máy bay) và ngừng dùng máy đó; từ một thiết bị khác, đổi mật khẩu ngân hàng và email; chụp lại bằng chứng rồi mới gỡ ứng dụng.'),
       ('**"Ai xin mã OTP đều là kẻ gian."**','**"Ai xin mã OTP cũng không đưa, dù người đó xưng là ai."**')],
'003':[('**Ngắt kết nối mạng** (bật chế độ máy bay), gỡ ứng dụng lạ; đổi mật khẩu ngân hàng, email từ một thiết bị khác. Nếu cần, khôi phục cài đặt gốc cho điện thoại.','**Ngắt kết nối mạng** (bật chế độ máy bay) và ngừng dùng máy đó; đổi mật khẩu ngân hàng, email từ một thiết bị khác. Chụp lại bằng chứng rồi mới gỡ ứng dụng lạ; chỉ khôi phục cài đặt gốc sau khi đã khóa tài khoản và lưu bằng chứng.'),
       ('hãy dùng ứng dụng chăm sóc khách hàng chính thức của ngành Điện tải từ kho ứng dụng (App Store, Google Play), hoặc gọi tổng đài chăm sóc khách hàng 1558 của EVN. Tổng đài này chỉ cung cấp dịch vụ thoại, không gửi đường link.','hãy dùng ứng dụng chăm sóc khách hàng chính thức của ngành Điện mà bạn tự cài từ cửa hàng ứng dụng, hoặc số tổng đài in trên hóa đơn tiền điện bạn đang giữ. Không dùng số hay đường link trong tin nhắn.')],
'004':[('**Ngắt mạng** (bật chế độ máy bay), gỡ ứng dụng lạ; đổi mật khẩu ngân hàng, VssID, email từ một thiết bị khác.','**Ngắt mạng** (bật chế độ máy bay) và ngừng dùng máy đó; đổi mật khẩu ngân hàng, VssID, email từ một thiết bị khác; chụp lại bằng chứng rồi mới gỡ ứng dụng lạ.')],
'011':[('2. Đổi mật khẩu, gỡ ứng dụng lạ; theo dõi','2. Đổi mật khẩu từ một thiết bị khác; chụp lại bằng chứng rồi mới gỡ ứng dụng lạ; theo dõi')],
'012':[('gỡ ứng dụng lạ đã cài.','chụp lại bằng chứng rồi mới gỡ ứng dụng lạ đã cài.'),
       ('mọi yêu cầu đóng phí để nhận quà từ nước ngoài đều là lừa đảo.','bị đòi đóng phí để nhận quà, nhận hàng đang bị giữ thì dừng lại, đừng nộp.')],
'019':[('rồi mang điện thoại khôi phục cài đặt gốc.','rồi chụp lại tin nhắn, tên ứng dụng làm bằng chứng trước khi mang điện thoại đi khôi phục cài đặt gốc.'),
       ('2. Theo khuyến cáo của cơ quan Công an, **khôi phục cài đặt gốc** thiết bị và kiểm tra lại số dư tài khoản.','2. Sau khi đã khóa tài khoản từ một thiết bị khác và chụp lại bằng chứng, mới **khôi phục cài đặt gốc** thiết bị; kiểm tra lại số dư tài khoản.')],
'025':[('3. **Gỡ ứng dụng, phần mềm điều khiển từ xa** đã cài theo hướng dẫn và ngắt kết nối mạng nếu nghi thiết bị bị điều khiển.','3. **Ngắt kết nối mạng và ngừng dùng máy** nếu nghi thiết bị bị điều khiển; chụp lại bằng chứng rồi mới gỡ ứng dụng, phần mềm điều khiển từ xa đã cài theo hướng dẫn.')],
'026':[('ngắt mạng, gỡ ứng dụng lạ, quét thiết bị bằng phần mềm bảo mật;','ngắt mạng và ngừng dùng máy; chụp lại bằng chứng rồi mới gỡ ứng dụng lạ, nhờ người có chuyên môn kiểm tra máy;')],
'027':[('ngắt mạng, gỡ ứng dụng, không cấp thêm quyền nào;','ngắt mạng và ngừng dùng máy, không cấp thêm quyền nào; chụp lại bằng chứng rồi mới gỡ ứng dụng;')],
'028':[('ngắt mạng, gỡ ứng dụng, kiểm tra lại máy.','ngắt mạng và ngừng dùng máy; gọi ngân hàng từ một thiết bị khác; chụp lại bằng chứng rồi mới gỡ ứng dụng và kiểm tra lại máy.')],
'029':[('1. **Ngắt kết nối mạng** của điện thoại; gỡ ứng dụng vừa cài, thu hồi các quyền đã cấp.','1. **Ngắt kết nối mạng** của điện thoại và ngừng dùng máy; chụp lại bằng chứng rồi mới gỡ ứng dụng vừa cài, thu hồi các quyền đã cấp.')],
'033':[('Một dấu hiệu đã đủ để không cài hoặc gỡ ngay.','Một dấu hiệu đã đủ để không cài.'),
       ('Chị không bật quyền, tắt mạng, gỡ ứng dụng vừa cài rồi gọi tổng đài in trên thẻ.','Chị không bật quyền, tắt mạng, dùng máy khác gọi tổng đài in trên thẻ, rồi chụp lại tên ứng dụng làm bằng chứng trước khi gỡ.'),
       ('3. **Gỡ ứng dụng giả**, thu hồi các quyền đã cấp; nếu không gỡ được, nhờ cửa hàng sửa chữa uy tín hoặc khôi phục cài đặt gốc sau khi sao lưu dữ liệu cần thiết.','3. **Chụp lại bằng chứng rồi mới gỡ ứng dụng giả**, thu hồi các quyền đã cấp; nếu không gỡ được, nhờ nơi sửa chữa do bạn tự chọn, hoặc khôi phục cài đặt gốc sau khi đã lưu bằng chứng và sao lưu dữ liệu cần thiết.')],
'034':[('4. **Gỡ ứng dụng lạ** trên điện thoại, thu hồi quyền đã cấp; quét thiết bị bằng phần mềm bảo mật hoặc nhờ người có chuyên môn kiểm tra.','4. **Chụp lại bằng chứng rồi mới gỡ ứng dụng lạ** trên điện thoại, thu hồi quyền đã cấp; nhờ người có chuyên môn kiểm tra máy.')],
'035':[('3. **Gỡ ứng dụng, phần mềm lạ**, thu hồi quyền trợ năng; nhờ người có chuyên môn kiểm tra hoặc khôi phục cài đặt gốc.','3. **Chụp lại bằng chứng rồi mới gỡ ứng dụng, phần mềm lạ**, thu hồi quyền trợ năng; nhờ người có chuyên môn kiểm tra, hoặc khôi phục cài đặt gốc sau khi đã khóa tài khoản và lưu bằng chứng.')],
'037':[('3. **Quét mã độc, gỡ phần mềm, tiện ích lạ** trên thiết bị nghi nhiễm; nếu cần, cài lại hệ điều hành.','3. **Chụp lại bằng chứng rồi mới gỡ phần mềm, tiện ích lạ** trên thiết bị nghi nhiễm; nhờ người có chuyên môn kiểm tra, cài lại hệ điều hành nếu cần.')],
'040':[('1. **Ngắt mạng thiết bị** nếu đã cài ứng dụng lạ; gỡ ứng dụng, thu hồi quyền.','1. **Ngắt mạng thiết bị và ngừng dùng máy** nếu đã cài ứng dụng lạ; chụp lại bằng chứng rồi mới gỡ ứng dụng, thu hồi quyền.')],
'049':[('Bất kỳ "suất nội bộ" nào phải mua qua kênh khác đều là lừa đảo.','"Suất nội bộ" phải mua qua kênh khác, tiền chuyển vào tài khoản cá nhân, là dấu hiệu phải dừng lại.')],
}
log=['# Nhật ký sửa 157 bài viết trước khi đưa lên website','','Sửa ngày 09/11/2026 theo các quy tắc đã chốt (Đề cương 1.3 Điều 14; trang việc cần làm "Người khác đang có quyền vào tài khoản"; quyết định 02/9/2026 về số điện thoại). Ban biên tập đối chiếu từng dòng trước khi thẩm định.','']
n=0
for f in sorted(os.listdir(D)):
    if not f.endswith('.md'):continue
    p=os.path.join(D,f); s=open(p,encoding='utf8').read(); o=s; k=f[:3]; ch=[]
    m=re.search(r'^(## (?:\d+\. )?Sáu dấu hiệu nhận biết) – gặp một dấu hiệu là nên dừng lại$',s,flags=re.M)
    if m:
        s=s[:m.start()]+m.group(1)+'\n\n'+STOPNOTE+s[m.end():]
        ch.append(('Tiêu đề "… – gặp một dấu hiệu là nên dừng lại"','Bỏ vế sau; thêm đoạn phân biệt hoãn với điểm dừng'))
    for a,b in R.get(k,[]):
        if a in s: s=s.replace(a,b,1); ch.append((a,b))
        elif b not in s: raise SystemExit('KHONG THAY: '+f+' :: '+a[:60])
    if s!=o:
        open(p,'w',encoding='utf8').write(s); n+=1
        log.append('## '+f); log.append('')
        for a,b in ch: log+=['- Cũ: '+a,'  Mới: '+b]
        log.append('')
open(LOG,'w',encoding='utf8').write('\n'.join(log))
print('bai da sua',n)
