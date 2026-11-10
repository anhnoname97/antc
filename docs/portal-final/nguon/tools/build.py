"""Ghép website từ mã nguồn gốc (31/10/2026) + phần bổ sung 09/11/2026 + bản chính thức 10/11/2026.
   src/shell.html, app.css, data.js, app.js : tách nguyên văn từ bản đã đăng ngày 31/10
   src/st_data.js, art_index.js, tinhhuong.js, tinhhuong.css : công cụ chọn tình huống và kho bài nền tảng
   src/dn_bank.js : ngân hàng câu hỏi dành cho nhân viên doanh nghiệp (tools/build_dn.py)
   out/bai-viet.js : toàn văn 157 bài (tools/build_articles.py)
Kết quả: out/artifact.html (bản đăng lên Claude) và out/index.html (bản chạy độc lập để đưa lên máy chủ, có nút In)."""
import sys,os
R=sys.argv[1] if len(sys.argv)>1 else '/home/claude/web'
S=lambda n:open(os.path.join(R,'src',n),encoding='utf8').read()
app=S('app.js')
def rep(old,new,count=1):
    global app
    assert app.count(old)==count, ('KHONG KHOP',old[:80],app.count(old))
    app=app.replace(old,new)
# 1. chèn mô-đun mới trước bảng ALIAS (sau khi mọi hàm, bảng dùng chung đã khai báo)
rep("var ALIAS={home:'',","/* ===== Bổ sung 09/11/2026 ===== */\n"+S('st_data.js')+"\n"+S('art_index.js')+"\n"+S('dn_bank.js')+"\n"+S('tinhhuong.js')+
    "\nfunction libBar(){return '<button type=\"button\" class=\"libbar\" data-go=\"thu-vien\">'+ic('book')+'<span><b>KIẾN THỨC NỀN TẢNG</b><small>Chuỗi bài Từ cổ chí kim, bài đọc theo chuyên đề và các bài về thủ đoạn thường gặp</small></span>'+ic('next')+'</button>'}\n"+
    "var ALIAS={home:'',chontinhhuong:'khan-cap.chon-tinh-huong',thuvien:'thu-vien',")
# 2. đường dẫn
rep("if((m=tok.match(/^pol(ng|cc)$/)))return 'chinh-sach.'+m[1];",
    "if((m=tok.match(/^pol(ng|cc)$/)))return 'chinh-sach.'+m[1];\n  if((m=tok.match(/^bai(\\d{1,3})$/))&&ARTBY[+m[1]])return 'thu-vien.'+ARTBY[+m[1]][1];")
rep("if(p[1]==='kiem-tra')return vWizard();","if(p[1]==='kiem-tra')return vWizard();\n    if(p[1]==='chon-tinh-huong')return vSit(p[2],p[3]);")
rep("if(p[0]==='hoi-dap')return vHoidap(p[1]);","if(p[0]==='thu-vien')return vLib(p[1]);\n  if(p[0]==='hoi-dap')return vHoidap(p[1]);")
# 3. sự kiện
rep("if((t=e.target.closest('[data-wz]'))){wzAct(t.dataset.wz,t.dataset.v,t);return}",
    "if((t=e.target.closest('[data-wz]'))){wzAct(t.dataset.wz,t.dataset.v,t);return}\n  if((t=e.target.closest('[data-st]'))){stAct(t.dataset.st,t.dataset.v,t);return}\n  if((t=e.target.closest('[data-lbg]'))){LB.g=t.dataset.lbg;LB.n=20;lbRefresh();return}")
rep("if(name==='rrmore'){RF.n+=12;rrRefresh();return}","if(name==='rrmore'){RF.n+=12;rrRefresh();return}\n  if(name==='lbmore'){LB.n+=20;lbRefresh();return}")
rep("if(e.target.id==='rrq'){var v=e.target.value;",
    "if(e.target.id==='stq'){stInput(e.target.value);return}\n  if(e.target.id==='lbq'){var lv=e.target.value;clearTimeout(RRT);RRT=setTimeout(function(){LB.q=lv.trim();LB.n=20;lbRefresh()},180);return}\n  if(e.target.id==='rrq'){var v=e.target.value;")
rep("if(e.target.id==='rrq'&&e.key==='Enter'){","if((e.target.id==='stq'||e.target.id==='lbq')&&e.key==='Enter'){e.preventDefault();return}\n  if(e.target.id==='rrq'&&e.key==='Enter'){")
# 4. trang chủ: lối vào chính là công cụ chọn tình huống; thêm khối Kiến thức nền tảng
rep("<p class=\"hk-lead\">Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay.</p>",
    "<p class=\"hk-lead\">Chọn chuyện giống với bạn, cho biết bạn đã làm gì, rồi xem việc nên làm theo thứ tự.</p>")
rep("data-go=\"khan-cap.kiem-tra\">'+ic('quiz')+'Chuyện gì đây???</button>","data-go=\"khan-cap.chon-tinh-huong\">'+ic('quiz')+'Chuyện gì đây???</button>")
rep("  /* Khối CẢNH BÁO: tối đa 3 mục",
    "  /* Khối Kiến thức nền tảng (bổ sung 09/11/2026): ba ngăn bài viết, đặt sau khối RỦI RO, ngoài đường khẩn cấp */\n"
    "  h+='<section class=\"sec hblock\" aria-labelledby=\"h-lib\"><div class=\"hbh\"><h2 id=\"h-lib\">KIẾN THỨC NỀN TẢNG</h2><button type=\"button\" class=\"more\" data-go=\"thu-vien\">Tất cả bài viết'+ic('next')+'</button></div><div class=\"shelves\">'+\n"
    "    [['thu-vien.co-chi-kim','book','Lừa đảo: Từ cổ chí kim','Lừa đảo đã có từ xưa và thay áo mới ra sao; vì sao người tỉnh táo vẫn mắc bẫy.'],['thu-vien.chuyen-de','doc','Phân tích theo chuyên đề','Tám bài đọc theo lĩnh vực: hợp đồng, đầu tư, vay, việc làm, mua bán, cuộc gọi giả mạo, xử lý sự cố.'],['thu-vien.thu-doan','alert','Các thủ đoạn thường gặp','Mỗi bài một thủ đoạn: kịch bản, dấu hiệu nhận biết, việc nên làm. Tìm theo tên hoặc theo nhóm.']].filter(function(x){return ARTIDX.length||x[0]!=='thu-vien.thu-doan'}).map(function(x){return '<button type=\"button\" class=\"shelf\" data-go=\"'+x[0]+'\">'+spot(x[1],x[1]==='alert'?'s':'')+'<b>'+esc(x[2])+'</b><small>'+esc(x[3])+'</small></button>'}).join('')+'</div></section>';\n"
    "  /* Khối CẢNH BÁO: tối đa 3 mục")
# 5. Khẩn cấp
rep("<p>Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay. Không cần đăng nhập, không lưu câu trả lời.</p></div>'+\n   '<button type=\"button\" class=\"btn red\" data-go=\"khan-cap.kiem-tra\">Bắt đầu'+ic('next')+'</button></section>'",
    "<p>Chọn chuyện giống với bạn, hoặc gõ vài chữ để tìm. Cho biết bạn đã làm gì, rồi làm theo thứ tự. Không cần đăng nhập, không lưu lựa chọn.</p></div>'+\n   '<button type=\"button\" class=\"btn red\" data-go=\"khan-cap.chon-tinh-huong\">Bắt đầu'+ic('next')+'</button><button type=\"button\" class=\"lnk kcta-alt\" data-go=\"khan-cap.kiem-tra\">Hoặc trả lời 3 câu hỏi ngắn về cuộc liên hệ đáng ngờ</button></section>'")
# 6. Các rủi ro: lối sang kho bài
rep("'</div></nav>'+\n   (tab==='dau-tu'||","'</div></nav>'+libBar()+\n   (tab==='dau-tu'||")
shell=S('shell.html')
old='<nav class="flinks2" aria-label="Lối tắt khác">\n'
assert shell.count(old)==1
shell=shell.replace(old,old+'      <button data-go="thu-vien">KIẾN THỨC NỀN TẢNG</button>\n')
css=S('app.css')+S('tinhhuong.css')
data=S('data.js')
def page(standalone):
    s=shell.replace('<style>/*CSS*/</style>','<style>'+css+'</style>').replace('<script>/*DATA*/</script>','<script>'+data+'</script>')
    s=s.replace('<script>/*APP*/</script>',('<script>window.__STANDALONE__=true;\n/* NƠI NHẬN BIỂU MẪU (xem README). Để trống cả hai thì trang Góp ý, Hỏi – Đáp ghi “nơi nhận sẽ được công bố”.\n   ATTC_MAIL: hộp thư nhận góp ý và câu hỏi, ví dụ \'gopy@antoantaichinh.vn\'.\n   ATTC_API : địa chỉ máy chủ nhận biểu mẫu và đăng ký dự thi, ví dụ \'https://antoantaichinh.vn/api\'. */\nwindow.ATTC_MAIL=\'\';\nwindow.ATTC_API=\'\';</script>\n' if standalone else '')+'<script>'+app+'</script>')
    if standalone:
        s=('<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
           '<meta name="description" content="Nhận diện lừa đảo và rủi ro tài chính · Biết cách tự bảo vệ. Chọn tình huống bạn đang gặp để biết việc nên làm theo thứ tự.">\n'
           '<meta property="og:image" content="img/og-image.jpg">\n</head>\n<body>\n')+s+'\n</body>\n</html>\n'
    return s
os.makedirs(os.path.join(R,'out'),exist_ok=True)
open(os.path.join(R,'out','artifact.html'),'w',encoding='utf8').write(page(False))
open(os.path.join(R,'out','index.html'),'w',encoding='utf8').write(page(True))
print('ok',len(page(False)),len(page(True)))
