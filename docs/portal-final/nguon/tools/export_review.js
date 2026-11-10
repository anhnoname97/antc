// Xuất hồ sơ góp ý cho công cụ chọn tình huống (đọc được không cần chạy website).
// Dùng: node tools/export_review.js <thư mục src> <tệp .md ra>
const vm=require('vm'),fs=require('fs'),path=require('path');
const SRC=process.argv[2],OUT=process.argv[3];
const R=f=>fs.readFileSync(path.join(SRC,f),'utf8');
const cx={window:{}};vm.createContext(cx);
vm.runInContext(R('data.js'),cx);
vm.runInContext(R('st_data.js')+';'+R('art_index.js')+';this.X={SGRP,SCONS,SCHK,SITS,ARTIDX,ARTGRP_EXTRA}',cx);
const D=cx.window.__DATA__,PB=D.PB,{SGRP,SCONS,SCHK,SITS,ARTIDX}=cx.X;
const app=R('app.js');
const SIGNS=eval(app.slice(app.indexOf('var SIGNS=[')+10,app.indexOf('];',app.indexOf('var SIGNS=['))+1));
const strip=s=>String(s).replace(/<small>/g,' (').replace(/<\/small>/g,')').replace(/<[^>]+>/g,'');
const ART={};ARTIDX.forEach(a=>ART[a[0]]=a);
const ST={d:'DỪNG',h:'HOÃN VÀ KIỂM CHỨNG',n:'CHƯA PHÁT HIỆN ĐIỂM DỪNG'};
const step=(ref,pb)=>{let p,i;if(typeof ref==='string'){[p,i]=ref.split(':').map(Number)}else{p=pb;i=ref}const b=PB[p]&&PB[p].blocks[i];return b&&b.s?{p,i,s:b.s,d:b.d||[]}:null};
const ck=s=>{if(s.ck==='bank')return 'Tự tìm số ngân hàng: mặt sau thẻ, hoặc mục Trợ giúp trong ứng dụng ngân hàng đã cài từ trước; không dùng số, đường link người kia gửi.';const r=SCHK[s.ck];if(!r)return '';const b=PB[r[0]].blocks[r[1]];return b.s+(b.d&&b.d.length?' '+b.d.join(' '):'')};
// Tình huống chưa có nguồn đã thẩm định (bảng rà soát, mục 28; cập nhật 10/11/2026)
const UNV={'qr-ten-la':'Phiếu cập nhật 9 nội dung','hoi-chatbot-tim-so':'Phiếu cập nhật 9 nội dung','ca-cuoc':'Phiếu cập nhật 9 nội dung','video-nguoi-noi-tieng':'Phiếu cập nhật 9 nội dung',
 'choi-hui':'website tự viết','tai-khoan-game':'website tự viết','nhan-lay-lai-tai-khoan':'website tự viết','tru-tien-the':'website tự viết','nhat-vang-doi-tien':'website tự viết','nguoi-la-den-nha':'website tự viết',
 'doi-tai-khoan-nhan-tien':'Ngân hàng tình huống doanh nghiệp v1.8','lanh-dao-chuyen-gap':'Ngân hàng tình huống doanh nghiệp v1.8','don-hang-lon-chung-tu':'Ngân hàng tình huống doanh nghiệp v1.8',
 'doi-tai-khoan-luong':'website tự viết (chưa có trong v1.8)','dang-nhap-la-ngan-hang':'mới, vòng góp ý 2 (các bước lấy từ trang việc cần làm)',
 'hoan-hoc-phi':'mới, vòng góp ý 1','dang-ky-trai-he':'mới, vòng góp ý 1','hang-that-nguoi-nhan-tien-khac':'mới, vòng góp ý 1','dat-hang-nho-mua-ho':'mới, vòng góp ý 1'};
let o=[];const P=s=>o.push(s);
P('# Hồ sơ góp ý: công cụ "Chuyện gì đây???" của antoantaichinh.vn');
P('');P('Bản dựng thử ngày 09/11/2026, sửa ngày 10/11/2026 theo hai vòng góp ý. Hồ sơ xuất tự động từ dữ liệu của website (`st_data.js`, `data.js`), câu chữ đúng như người dân sẽ thấy trên màn hình.');
P('');P('## 1. Website và công cụ');
P('');P('- antoantaichinh.vn là website giáo dục cộng đồng về nhận diện lừa đảo và rủi ro tài chính, do một doanh nghiệp vận hành dưới sự định hướng, thẩm định nội dung chuyên môn của Công an xã Thiên Lộc (Hà Nội). Địa bàn có khoảng 80.000 dân và khu công nghiệp khoảng 60.000 công nhân.');
P('- Website chỉ tư vấn, hướng dẫn. Website không tiếp nhận, không xác minh, không xử lý tin báo lừa đảo, không tra cứu số điện thoại hay số tài khoản.');
P('- Menu đúng ba mục: Khẩn cấp · Công cụ & checklist · Các rủi ro. Công cụ chọn tình huống nằm trong mục Khẩn cấp và là lối vào chính của nút "Chuyện gì đây???".');
P('- Người dùng chính: người cao tuổi, công nhân, tiểu thương, phụ huynh. Phần lớn dùng điện thoại, đọc lúc đang lo lắng.');
P('');P('## 2. Nguyên tắc đã chốt (góp ý không được đề xuất trái các điều này)');
P('');
['Không có nhãn "an toàn" dưới bất kỳ hình thức nào (Điều 3, Đề cương kiến trúc 1.3). Website không kết luận "đây là lừa đảo" thay người dùng; tình huống chỉ là "chuyện gần giống" để đối chiếu.',
 'Mỗi kết quả mang đúng một trong ba khuyến nghị (Điều 8): DỪNG · HOÃN VÀ KIỂM CHỨNG · CHƯA PHÁT HIỆN ĐIỂM DỪNG (kèm câu "không có nghĩa giao dịch an toàn"). Không chấm điểm, không đếm số dấu hiệu (Điều 17).',
 'Sáu điểm dừng (gặp một là dừng ngay): '+SIGNS.map((x,i)=>'('+(i+1)+') '+strip(x[1])).join(' '),
 'Quy tắc kênh chính thức: chỉ kiểm chứng qua kênh do chính người dân tự tìm ra (số in trên thẻ, ứng dụng tự cài từ trước, địa chỉ .gov.vn tự gõ, trụ sở Công an), không dùng số hay đường link người kia đưa.',
 'Chỉ công bố số điện thoại do Nhà nước vận hành: 113, 156, 5656. Không đăng số của ngân hàng, nhà mạng, doanh nghiệp. Không nêu tên doanh nghiệp, ứng dụng cụ thể nào là lừa đảo.',
 'Điều 12: website không đi trước tài liệu đã thẩm định. Lời khuyên mới phải qua Ban biên tập. Hiện CHƯA đưa lên: bật xác thực hai lớp; quét thiết bị; "chờ 24 giờ"; gỡ ứng dụng trước khi lưu bằng chứng.',
 'Không có cửa sổ bật lên, không quảng cáo tài chính, không thu tiền dưới bất kỳ hình thức nào.'
].forEach((x,i)=>P((i+1)+'. '+x));
P('');P('## 3. Công cụ chạy thế nào');
P('');P('**Bước 1. Chọn chuyện giống mình.** Gõ vài chữ (có dấu hoặc không dấu, chịu gõ sai nhẹ; điểm cao khi trùng chữ trong câu tình huống, rồi tới từ khóa), hoặc mở một trong 12 nhóm. Không thấy chuyện giống mình thì có 4 lối ra: bốn việc không làm khi nghi ngờ · trình hỏi 3 câu · cách tự kiểm chứng · Hỏi – Đáp gửi kín.');
P('');P('**Bước 2. "Đến lúc này, chuyện gì đã xảy ra?"** Chọn nhiều dòng. Một số tình huống chọn sẵn dòng phù hợp (ví dụ "Có tiền lạ vào tài khoản"), trang nhắc kiểm tra dòng chọn sẵn; người dùng bỏ chọn được. Chưa chọn dòng nào thì không xem được kết quả.');
P('');P('**Bước 3. Việc nên làm.** Thứ tự trên màn hình: Việc 1 (nên làm trước tiên, kèm đủ phần giải thích, hộp tìm số ngân hàng, câu nói mẫu nếu có) → Khuyến nghị (DỪNG / HOÃN / CHƯA PHÁT HIỆN) và Vì sao → Việc 2, 3… theo thứ tự, mỗi việc hiện đủ các câu giải thích → Đừng làm → Tự kiểm chứng thế nào → Đọc thêm → Gửi cho người thân, In. Tình huống chưa thẩm định có dòng ghi rõ.');
P('');P('**Quy tắc xếp việc:**');
['Chưa làm gì: khuyến nghị theo tình huống; việc 1 là câu "Việc nên làm trước tiên" của tình huống; tiếp theo là "Việc làm tiếp".',
 'Chọn "Tôi không nhớ": như chưa làm gì, nhưng tình huống đang ở mức CHƯA PHÁT HIỆN thì nâng lên HOÃN VÀ KIỂM CHỨNG.',
 'Đã lỡ làm bất kỳ việc nào ở bước 2: khuyến nghị luôn là DỪNG. Việc 1 là bước đầu của việc ưu tiên cao nhất, theo thứ tự: đe dọa → cài ứng dụng → lộ mã ngân hàng → mất SIM → đăng nhập lạ vào ngân hàng, ví → chuyển tiền → đã giao hàng → cho mượn tài khoản → giấy tờ → tiền lạ vào.',
 'Đã chọn "cài ứng dụng" thì bỏ bước "chỉ mới đọc mã, không cần tắt mạng" (hai bước mâu thuẫn).',
 'Xếp theo TỪNG HÀNH ĐỘNG (từ vòng góp ý 2). Bậc ưu tiên: 0 gọi 113 → 1 cắt quyền điều khiển máy; nói với người thân khi bị đe dọa → 2 liên hệ ngân hàng, ví, nhà mạng, nơi giữ hàng → 3 không đưa thêm tiền, giấy tờ, mã → 3,5 việc riêng của tình huống → 4 báo người nhà, người quen → 5 rà soát tài khoản, đổi mật khẩu, giấy tờ → 6 giữ bằng chứng → 7 MỘT bước trình báo (luôn hiện; ưu tiên câu của trang bị đe dọa, rồi trang đã chuyển tiền, rồi trang giấy tờ; câu "nếu đã phát sinh giao dịch" chỉ dùng khi không có câu nào khác) → 8 mang máy đi sửa, phản ánh 156, 5656. Cùng một hành động thì chỉ giữ một bước. Không cắt bớt bước nào.',
 'Việc riêng của tình huống (câu "Việc nên làm trước tiên") luôn được giữ khi chọn thêm, trừ khi trùng đúng một hành động của trang việc cần làm. Bị đe dọa thì gọi 113 luôn là việc 1.',
 'Câu "gỡ ứng dụng lạ hoặc làm sạch máy" chuyển từ bước giữ bằng chứng sang bước mang máy đi sửa, sau bước trình báo.',
 'Hai bước cùng phải gọi ngân hàng: bước sau có nhắc "Nếu cùng ngân hàng, ví với bước trên thì nói cả hai việc trong cùng một cuộc gọi".',
 'Câu giải thích về thiết bị tin cậy, an toàn của bạn, không chờ ngân hàng, bằng chứng luôn hiện; các câu giải thích khác thu vào nút "Vì sao, làm thế nào" (bản in vẫn in đủ).',
 'Bản "Gửi cho người thân" có đủ mọi bước theo thứ tự kèm các câu điều kiện; đường dẫn kèm theo mở lại đúng tình huống và các lựa chọn.',
 'Các bước khi đã lỡ làm theo lấy NGUYÊN VĂN từ 10 trang việc cần làm đã thẩm định (mục 4). Câu "Việc nên làm trước tiên", "Vì sao", "Việc làm tiếp", "Đừng làm" của từng tình huống (mục 5) do website viết lại từ bài đọc chuyên đề.'
].forEach(x=>P('- '+x));
P('');P('## 4. Bước 2: 12 lựa chọn và các bước đi kèm (nguyên văn trang việc cần làm)');
P('');P('- **Chưa làm gì cả. Tôi mới nghe, mới đọc**');
SCONS.forEach(c=>{
  P('- **'+c.t+'**: theo trang "'+PB[c.pb].title+'"');
  c.st.forEach((r,i)=>{const x=step(r,c.pb);if(x)P('  - '+(i<(c.u||2)?'[gấp] ':'')+x.s+(x.d.length?' _'+x.d.join(' ')+'_':''))});
});
P('- **Tôi không nhớ rõ mình đã làm gì**');
P('');P('## 5. '+SITS.length+' tình huống');
P('');P('Ký hiệu: [chưa thẩm định: …] là tình huống chưa có nguồn đã thẩm định (xem mục 6).');
SGRP.forEach(g=>{
  const L=SITS.filter(s=>s.g===g.k);
  P('');P('### '+g.t+' ('+L.length+' tình huống)');
  L.forEach(s=>{
    P('');P('#### `'+s.id+'`: '+s.t+(UNV[s.id]?'  [chưa thẩm định: '+UNV[s.id]+']':''));
    P('');P('- Khuyến nghị khi chưa làm gì: **'+ST[s.st]+'**'+(s.pre&&s.pre.length?' · Chọn sẵn ở bước 2: '+s.pre.map(v=>(SCONS.find(c=>c.v===v)||{t:v}).t).join('; '):''));
    P('- Việc nên làm trước tiên: '+s.f);
    P('- Vì sao: '+s.w+((s.sg||[]).length?' Điểm dừng: '+s.sg.map(i=>strip(SIGNS[i][1])).join(' '):''));
    if(s.dos.length)P('- Việc làm tiếp: '+s.dos.map((x,i)=>'('+(i+1)+') '+x).join(' '));
    if(s.dn.length)P('- Đừng làm: '+s.dn.join(' · '));
    const k=ck(s);if(k)P('- Tự kiểm chứng: '+k);
    P('- Từ khóa tìm (không dấu): '+s.kw);
    P('- Bài thủ đoạn liên quan: '+s.tac.map(n=>ART[n]?n+'. '+ART[n][2]:n).join(' · '));
  });
});
P('');P('## 6. Tình huống chưa có nguồn đã thẩm định');
P('');Object.keys(UNV).forEach(id=>{const s=SITS.find(x=>x.id===id);P('- `'+id+'` ('+UNV[id]+'): '+s.t)});
P('');P('## 7. Việc đã biết còn tồn tại');
P('');
['157 bài thủ đoạn (lớp nhận diện, nối từ "Đọc thêm") đang ghi "chờ Ban biên tập thẩm định". Còn 14 bài khuyên bật xác thực hai lớp, quét thiết bị; 117 bài trích lời khuyên của cơ quan nhà nước mà không dẫn văn bản.',
 '6 thủ đoạn không gắn tình huống nào vì ngoài phạm vi: mã độc tống tiền; bán hàng chiến dịch chính trị; lừa đăng ký cử tri; prompt injection vào trợ lý AI; quảng cáo thao túng trợ lý AI; Wi-Fi công cộng giả, cổng sạc USB.',
 'Ô tìm hiểu cách viết tắt thường gặp: ko, k → không; dc → được; ck → chuyển khoản; stk → số tài khoản; sdt, cskh, fb, face, ship…',
 'Đã có trước công cụ này, giữ làm lối phụ: trình hỏi 3 câu; 10 trang việc cần làm; 3 công cụ tự kiểm tra; 8 checklist.',
 'Chưa thử với người thật.'
].forEach(x=>P('- '+x));
fs.writeFileSync(OUT,o.join('\n')+'\n');
console.log('ok',OUT,o.length,'dòng',fs.statSync(OUT).size,'byte');
