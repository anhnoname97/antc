"""Lượt 2: bỏ nhãn mẫu, bỏ thông tin đơn vị vận hành, biểu mẫu chỉ hiện khi có nơi nhận, cuộc thi, liên hệ, giới thiệu."""
import sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ct_lib import Files
F = Files()
A, T, B = 'src/app.js', 'src/tinhhuong.js', 'tools/build.py'
NGAY, NGAYLAI = '10/11/2026', '08/02/2027'

# ---- chân bản in: bỏ tên đơn vị vận hành ----
F.rep(A, "Website do Công ty ABC vận hành; không phải website của cơ quan nhà nước và không tiếp nhận tố giác, tin báo về tội phạm.",
      "Đây không phải website của cơ quan nhà nước và không tiếp nhận tố giác, tin báo về tội phạm.", 2)
F.rep(T, "Website do Công ty ABC vận hành; không phải website của cơ quan nhà nước và không tiếp nhận tố giác, tin báo về tội phạm.",
      "Đây không phải website của cơ quan nhà nước và không tiếp nhận tố giác, tin báo về tội phạm.")

# ---- ngày rà soát ----
F.rep(A, "/* Dấu rà soát cho nội dung khẩn cấp. Khi vận hành thật, mỗi quy trình và mỗi đầu số có trường riêng\n   trong hệ quản trị: người rà soát, ngày rà soát, ngày phải rà soát lại, nguồn kiểm chứng. Ngày ghi dạng dd/mm/yyyy;\n   quá 90 ngày kể từ lần rà soát gần nhất thì trang tự hiện cảnh báo. */",
      "/* Dấu rà soát cho nội dung khẩn cấp. Ngày ghi dạng dd/mm/yyyy; quá 90 ngày kể từ lần rà soát gần nhất thì trang tự hiện nhãn nhắc.\n   MỖI LẦN RÀ SOÁT LẠI NỘI DUNG, SỬA BA NGÀY DƯỚI ĐÂY. */")
F.rep(A, "  pb:{rev:'[ngày rà soát]',next:'[ngày rà soát lại]'},\n  nums:{rev:'[ngày kiểm chứng]',src:'[văn bản hoặc cổng thông tin chính thức]'}",
      "  pb:{rev:'%s',next:'%s'},\n  nums:{rev:'%s'}" % (NGAY, NGAYLAI, NGAY))
F.rep(A, "revline('Kiểm chứng gần nhất',REVIEW.nums.rev,' · Nguồn: '+fillv(REVIEW.nums.src))", "revline('Kiểm tra gần nhất',REVIEW.nums.rev)")

# ---- CẢNH BÁO: bỏ nhãn mẫu, bỏ khối nguồn ----
n = F.sub(A, r"(\{id:\d+,t:'[^']+',d:')\d\d/\d\d/\d{4}(')", r"\g<1>%s\2" % NGAY, 10)
F.rep(A, "function alertLabel(a){return a.st==='d'?'Dựa trên cảnh báo của <span class=\"fill\">[Tên cơ quan]</span>':'Cần kiểm chứng · Chưa có kết luận'}\n", "")
F.sub(A, r"var SAMPLETAG='<p class=\"sample\">.*?</span></p>';\n", "", 1)
F.rep(A, "(e.kind==='cb'?'<span class=\"alab st-'+e.a.st+'\">'+alertLabel(e.a)+'</span>':KINDNAME[e.kind])", "(e.kind==='cb'?'<span class=\"alab st-d\">Cảnh báo</span>':KINDNAME[e.kind])")
F.rep(A, "'<article class=\"alert1\"><p class=\"alab st-'+a.st+'\">'+ic(a.st==='d'?'mega':'clock')+'<span>'+alertLabel(a)+'</span></p>'+", "'<article class=\"alert1\"><p class=\"alab st-d\">'+ic('mega')+'<span>Cảnh báo</span></p>'+")
F.rep(A, "fig(ALIMG[a.id],{eager:true,cls:'hero'})+tools(true)+SAMPLETAG+", "fig(ALIMG[a.id],{eager:true,cls:'hero'})+tools(true)+")
F.sub(A, r"   '<section class=\"sec\"><h2>Nguồn cảnh báo</h2>.*?</section>'\+\n", "", 1)
F.rep(A, "join('')+'</div>'+SAMPLETAG+'</section>';", "join('')+'</div></section>';")
F.rep(A, "   (tab==='canh-bao'?SAMPLETAG:'')+\n", "")
F.rep(B, "rep(\"'</div></nav>'+\\n   (tab==='canh-bao'?SAMPLETAG:'')+\",\"'</div></nav>'+libBar()+\\n   (tab==='canh-bao'?SAMPLETAG:'')+\")",
      "rep(\"'</div></nav>'+\\n   (tab==='dau-tu'||\",\"'</div></nav>'+libBar()+\\n   (tab==='dau-tu'||\")")
F.rep(A, "<span>Cập nhật: '+esc(a.d)+'</span>", "<span>Ngày đăng: '+esc(a.d)+'</span>")

# ---- bài hướng dẫn: mục "Nguồn" ----
F.rep(A, "['lv-rel','Bài liên quan'],['lv-src','Nguồn']]", "['lv-rel','Bài liên quan'],['lv-src','Đọc thêm']]")
F.rep(A, "'<section class=\"sec\" id=\"lv-src\"><h2>Nguồn</h2>'", "'<section class=\"sec\" id=\"lv-src\"><h2>Đọc thêm</h2>'")
F.rep(A, "'<p class=\"small\">Nguồn: Bài đọc Chuyên đề '+k+' (bản 2.0) thuộc bộ 08 chuyên đề của Chương trình. Thẩm định chuyên môn: Công an xã Thiên Lộc.</p>'",
      "'<p class=\"small\">Trang này tóm lại Bài đọc Chuyên đề '+k+' do website biên soạn.</p>'")
F.rep(A, "/* ============ MẪU BÀI VIẾT: tóm tắt · dấu hiệu · kịch bản · việc cần làm ngay · không nên làm · bài liên quan · nguồn ============ */",
      "/* ============ BÀI HƯỚNG DẪN: tóm tắt · dấu hiệu · kịch bản · việc cần làm ngay · không nên làm · bài liên quan · đọc thêm ============ */")
F.rep(A, "/* ============ MẪU TRANG CẢNH BÁO ============ */", "/* ============ TRANG CẢNH BÁO ============ */")

# ---- Hỏi – Đáp ----
F.rep(A, "   '<p class=\"small\">Bản dựng thử: đây là ví dụ cách trình bày. Khi vận hành, mỗi câu trả lời đều do Ban biên tập duyệt và dẫn về một nội dung đã thẩm định.</p></section>'+\n   '<section class=\"sec\" id=\"gui-cau-hoi\" aria-labelledby=\"h-ask\"><h2 id=\"h-ask\">Gửi câu hỏi, kiến nghị riêng</h2>'+",
      "   '</section>'+\n   (!canSend('questions')?'<section class=\"sec\" id=\"gui-cau-hoi\" aria-labelledby=\"h-ask\"><h2 id=\"h-ask\">Gửi câu hỏi, kiến nghị riêng</h2>'+NOCHANNEL('Nơi nhận câu hỏi')+'<p class=\"small\">'+NOTREPORT+'</p></section>':\n   '<section class=\"sec\" id=\"gui-cau-hoi\" aria-labelledby=\"h-ask\"><h2 id=\"h-ask\">Gửi câu hỏi, kiến nghị riêng</h2>'+")
F.rep(A, "pageh('Hỏi – Đáp','Câu hỏi thường gặp, trả lời ngắn. Không thấy câu của bạn thì gửi câu hỏi riêng ở cuối trang.',null,'chat')",
      "pageh('Hỏi – Đáp','Câu hỏi thường gặp, trả lời ngắn.'+(canSend('questions')?' Không thấy câu của bạn thì gửi câu hỏi riêng ở cuối trang.':''),null,'chat')")
F.rep(A, "<li>Giai đoạn đầu chưa nhận tệp đính kèm và ảnh chụp màn hình.</li></ul></div>'+\n   '<div><label class=\"lbl\" for=\"qtext\">",
      "<li>Website không nhận tệp đính kèm và ảnh chụp màn hình.</li></ul></div>'+\n   '<div><label class=\"lbl\" for=\"qtext\">")
F.rep(A, "   '<p class=\"err\" id=\"qerr\" hidden></p>'+\n   '<div class=\"btnrow\"><button type=\"submit\" class=\"btn pri\">'+ic('chat')+'Gửi</button></div>'+\n   '<p class=\"small\">'+NOTREPORT+'</p></form></section>';",
      "   '<p class=\"err\" id=\"qerr\" hidden></p><p class=\"okmsg\" id=\"qdone\" hidden>'+MAILMSG()+'</p>'+\n   '<div class=\"btnrow\"><button type=\"submit\" class=\"btn pri\">'+ic('chat')+'Gửi</button></div>'+\n   (API?'':'<p class=\"small\">'+MAILNOTE+'</p>')+\n   '<p class=\"small\">'+NOTREPORT+'</p></form></section>');")
F.rep(A, "   '<p class=\"okmsg\">Bản dựng thử: nội dung chưa được gửi đi đâu.</p>'+\n", "")
F.rep(A, "/* Hỏi – đáp nhanh: mỗi câu trả lời ghép từ nội dung đã thẩm định và dẫn về một trang có sẵn (Điều 21). */", "/* Hỏi – đáp nhanh: mỗi câu trả lời dẫn về một trang có sẵn. */")
F.rep(A, "<p>Gửi câu hỏi riêng cho Ban biên tập. Câu hỏi không hiện lên trang; các câu giống nhau được gộp và trả lời công khai sau khi đã che thông tin cá nhân.</p>",
      "<p>Xem các câu hỏi thường gặp, đã có trả lời ngắn và lối sang trang hướng dẫn.</p>")
F.rep(A, "<button type=\"button\" class=\"btn ghost sm\" data-go=\"hoi-dap\">Hỏi Ban biên tập</button>", "<button type=\"button\" class=\"btn ghost sm\" data-go=\"hoi-dap\">Mở Hỏi – Đáp</button>")

# ---- Góp ý ----
old_start = "   '<div class=\"warn\"><b>Trước khi gõ</b><ul><li>Đừng viết mật khẩu, mã OTP, mã PIN, số thẻ hay số tài khoản.</li><li>Đừng gửi họ tên, số điện thoại, địa chỉ, ảnh giấy tờ của người khác.</li><li>Giai đoạn đầu chưa nhận tệp và ảnh chụp màn hình.</li></ul></div>'+\n"
F.rep(A, old_start, "   (!canSend('feedback')?NOCHANNEL('Nơi nhận góp ý'):\n" + old_start.replace("Giai đoạn đầu chưa nhận tệp và ảnh chụp màn hình.", "Website không nhận tệp và ảnh chụp màn hình."))
F.rep(A, "<p class=\"okmsg\" id=\"gdone\" hidden>Bản dựng thử: góp ý chưa được gửi đi đâu. Khi chạy thật, mọi góp ý đều được đọc.</p>'+",
      "<p class=\"okmsg\" id=\"gdone\" hidden>'+(API?'Đã nhận góp ý của bạn. Cảm ơn bạn đã giúp website tốt hơn.':MAILMSG())+'</p>'+")
F.rep(A, "   '<p class=\"small\">Không cần tên, không cần số điện thoại, không cần tài khoản. Chúng tôi không lưu địa chỉ mạng của bạn cùng với nội dung góp ý.</p></form>'+\n   '<section class=\"sec box\"><h2 style=\"font-size:19px;font-weight:800\">Giai đoạn đầu có xét thưởng</h2>",
      "   '<p class=\"small\">'+(API?'Không cần tên, không cần số điện thoại, không cần tài khoản.':MAILNOTE)+'</p></form>'+\n   (!API?'':'<section class=\"sec box\"><h2 style=\"font-size:19px;font-weight:800\">Giai đoạn đầu có xét thưởng</h2>")
F.rep(A, "<li>Xóa hết trong <span class=\"fill\">[…]</span> ngày sau khi trao thưởng xong, trừ chứng từ phải lưu theo luật kế toán và thuế.</li>", "<li>Xóa sau khi trao thưởng xong, trừ giấy tờ trao thưởng phải giữ theo quy định về kế toán, thuế.</li>")
F.rep(A, "<li>Bạn có thể rút lại đồng ý, xem, sửa hoặc xóa thông tin này qua <span class=\"fill\">[đầu mối bảo vệ dữ liệu cá nhân]</span>.</li>", "<li>Bạn có thể rút lại đồng ý, xem, sửa hoặc xóa thông tin này bất kỳ lúc nào bằng cách gửi yêu cầu qua chính mục Góp ý.</li>")
F.rep(A, "cho việc xét và trao thưởng góp ý.</span></label></div>')+'</section>';\n  return {html:h,nav:''};", "cho việc xét và trao thưởng góp ý.</span></label></div>')+'</section>'));\n  return {html:h,nav:''};")

# ---- Cuộc thi ----
F.rep(A, "var ACTIVITY={on:true,t:'Cuộc thi tìm hiểu',full:'Cuộc thi trực tuyến tìm hiểu phòng, chống lừa đảo',i:'trophy'};",
      "/* Cuộc thi: open:true khi Ban Tổ chức mở đăng ký (cần có máy chủ nhận đăng ký, xem README). time, prize, rules: điền chữ khi đã chốt; để trống thì trang ghi “sẽ công bố”. */\nvar ACTIVITY={on:true,open:false,time:'',prize:'',rules:'',t:'Cuộc thi tìm hiểu',full:'Cuộc thi trực tuyến tìm hiểu phòng, chống lừa đảo',i:'trophy'};\nvar TBA='Sẽ công bố tại trang này.';\nfunction regOpen(){return !!(ACTIVITY.on&&ACTIVITY.open&&API)}")
F.rep(A, "function vDangky(){\n  var h=backrow('hoat-dong','Cuộc thi')+pageh('Cuộc thi trực tuyến','Tám chuyên đề, 200 câu. Đăng ký xong là vào thi ngay. Làm Chuyên đề 1 trước, sau đó làm chuyên đề nào trước cũng được.','Hoạt động','trophy','h')+\n   '<div class=\"box facts\"><p><b>Thời gian diễn ra:</b> <span class=\"fill\">[…]</span></p><p><b>Ai được dự thi:</b> Mọi lứa tuổi, chỉ cần có số điện thoại để liên hệ. Mỗi số điện thoại thi tối đa 02 lượt.</p><p><b>Thể lệ và giải thưởng:</b> <span class=\"fill\">[…]</span></p></div>'+",
      "function vDangky(){\n  if(!regOpen())return vHoatdong();\n  var h=backrow('hoat-dong','Cuộc thi')+pageh('Cuộc thi trực tuyến','Phần chung gồm tám chuyên đề, '+bankCounts()+' câu; phần dành cho nhân viên doanh nghiệp gồm '+dnCounts()+' câu tình huống. Đăng ký xong là vào thi ngay. Ở phần chung, làm Chuyên đề 1 trước, sau đó làm chuyên đề nào trước cũng được.','Hoạt động','trophy','h')+\n   '<div class=\"box facts\"><p><b>Thời gian diễn ra:</b> '+esc(ACTIVITY.time||TBA)+'</p><p><b>Ai được dự thi:</b> Mọi lứa tuổi, chỉ cần có số điện thoại để liên hệ. Mỗi số điện thoại thi tối đa 02 lượt. Người dưới 16 tuổi dự thi bằng số điện thoại của cha, mẹ hoặc người giám hộ và phải được người đó đồng ý.</p><p><b>Thể lệ và giải thưởng:</b> '+esc(ACTIVITY.rules||TBA)+'</p></div>'+")
F.rep(A, "'<li><b>Ai giữ dữ liệu.</b> <span class=\"fill\">[Pháp nhân chủ quản website]</span> là bên kiểm soát dữ liệu và là Ban Tổ chức. Công an xã Thiên Lộc chỉ thẩm định nội dung chuyên môn, không giữ dữ liệu thí sinh.</li>'+",
      "'<li><b>Ai giữ thông tin.</b> Ban Tổ chức cuộc thi của antoantaichinh.vn.</li>'+")
F.rep(A, "'<li><b>Giữ trong bao lâu.</b> Xóa hết trong <span class=\"fill\">[…]</span> ngày sau khi trao giải xong, trừ chứng từ phải lưu theo luật kế toán.</li>'+",
      "'<li><b>Giữ trong bao lâu.</b> Chỉ trong thời gian diễn ra cuộc thi và xét, trao giải. Xóa sau khi trao giải xong, trừ giấy tờ trao giải phải giữ theo quy định về kế toán, thuế.</li>'+")
F.rep(A, "Rút lại đồng ý, xem, sửa, xóa dữ liệu của mình bất kỳ lúc nào qua <span class=\"fill\">[đầu mối bảo vệ dữ liệu]</span>.", "Rút lại đồng ý, xem, sửa, xóa thông tin của mình bất kỳ lúc nào bằng cách gửi yêu cầu qua mục Góp ý.")
F.rep(A, "với Thể lệ cuộc thi và với nội dung xử lý dữ liệu nêu trên.", "với Thể lệ cuộc thi và với việc dùng thông tin nêu trên.")
F.rep(A, "   '<p class=\"small\">Bản dựng thử: những gì bạn gõ chỉ nằm trong trình duyệt của máy bạn để xem thử luồng đăng ký, không gửi đi đâu.</p></form></section>'+\n", "   '</form></section>'+\n")
F.sub(A, r"   peek\('pk-age','Ghi chú cho chủ quản: người dự thi dưới 16 tuổi'.*?</div>'\)\+\n", "", 1, flags=re.S)
F.sub(A, r"   \[\['clock','Thời gian','<span class=\"fill\">\[ngày bắt đầu – ngày kết thúc\]</span>'\],.*?tách khỏi dữ liệu chung của website\.</p>'\+\n",
      lambda m: ("   [['clock','Thời gian',esc(ACTIVITY.time||'Sẽ công bố tại trang này trước khi cuộc thi bắt đầu.')],\n"
       "    ['users','Ai được dự thi','Mọi người có số điện thoại để liên hệ. Người dưới 16 tuổi dự thi bằng số điện thoại của cha, mẹ hoặc người giám hộ và phải được người đó đồng ý.'],\n"
       "    ['quiz','Hình thức','Đăng ký bằng họ tên và số điện thoại, rồi vào thi ngay. Phần chung: 8 chuyên đề, '+bankCounts()+' câu, làm Chuyên đề 1 trước. Phần dành cho nhân viên doanh nghiệp: '+dnCounts()+' câu tình huống. Mỗi số điện thoại thi tối đa 2 lượt.'],\n"
       "    ['gift','Giải thưởng',esc(ACTIVITY.prize||'Sẽ công bố cùng Thể lệ.')+' Giải thưởng thực hiện nghĩa vụ thuế thu nhập cá nhân theo quy định.'],\n"
       "    ['doc','Thể lệ',esc(ACTIVITY.rules||TBA)]].map(function(x){return '<div class=\"fact\">'+spot(x[0])+'<span><b>'+x[1]+':</b> '+x[2]+'</span></div>'}).join('')+'</div>'+\n"
       "   (regOpen()?'<div class=\"btnrow\"><button type=\"button\" class=\"btn pri\" data-go=\"dang-ky\">Đăng ký dự thi'+ic('next')+'</button><button type=\"button\" class=\"btn ghost\" data-go=\"thi\">Tự luyện trước, không tính điểm</button></div>':\n"
       "    '<div class=\"note b\"><b>Cuộc thi chưa mở đăng ký</b><p>Thời gian, thể lệ và giải thưởng sẽ được công bố tại trang này. Trong lúc chờ, bạn có thể tự luyện toàn bộ câu hỏi, không cần đăng ký và không tính điểm.</p></div>'+\n"
       "    '<div class=\"btnrow\"><button type=\"button\" class=\"btn pri\" data-go=\"thi\">Tự luyện '+bankCounts()+' câu của 8 chuyên đề'+ic('next')+'</button><button type=\"button\" class=\"btn ghost\" data-go=\"thidn\">Câu hỏi dành cho nhân viên doanh nghiệp</button></div>')+\n"
       "   '<p class=\"small\">Thông tin người dự thi chỉ dùng để chấm bài, xét và trao giải, rồi xóa sau khi trao giải xong.</p>'+\n"), 1, flags=re.S)
F.rep(A, "/* Mô-đun Hoạt động (Điều 22): đặt on:false thì lối vào tự ẩn, trang vẫn mở được. */", "/* Mô-đun Hoạt động: đặt on:false thì lối vào tự ẩn, trang vẫn mở được. */")

# ---- ngân hàng câu hỏi: thêm phần dành cho nhân viên doanh nghiệp ----
F.rep(A, "function bankCounts(){return Object.keys(QB).reduce(function(a,k){return a+QB[k].q.length},0)}",
      "/* QB có hai nhóm khóa: '1'…'8' là tám chuyên đề chung; 'dn1'…'dn3' là phần dành cho nhân viên doanh nghiệp (src/dn_bank.js). */\n"
      "function QK(){return Object.keys(QB).filter(function(k){return /^\\d+$/.test(k)}).sort()}\n"
      "function DK(){return Object.keys(QB).filter(function(k){return /^dn\\d+$/.test(k)}).sort()}\n"
      "function isDN(cd){return /^dn/.test(String(cd))}\n"
      "function bankName(cd){return isDN(cd)?QB[cd].sh:'Chuyên đề '+cd}\n"
      "function bankCounts(){return QK().reduce(function(a,k){return a+QB[k].q.length},0)}\n"
      "function dnCounts(){return DK().reduce(function(a,k){return a+QB[k].q.length},0)}")
F.rep(A, "  o+='<ol class=\"cdlist\">'+Object.keys(QB).sort().map(function(k){", "  o+='<ol class=\"cdlist\">'+QK().map(function(k){")
F.rep(A, "  o+='<p class=\"pbfoot\">'+NOTPOLICE+'</p>';\n  return o;\n}\nfunction bankIntro(cd){\n  var b=QB[cd];\n  var o=pageh(b.t.replace(/^CHUYÊN ĐỀ \\d+\\s*-\\s*/,''),null,'Ngân hàng câu hỏi · Chuyên đề '+cd);",
      "  if(DK().length)o+='<section class=\"sec\" id=\"thi-dn\" aria-labelledby=\"h-dn\"><h2 id=\"h-dn\">Dành cho nhân viên doanh nghiệp</h2>'+\n"
      "    '<p class=\"small\">'+dnCounts()+' câu tình huống về phòng ngừa lừa đảo và rủi ro trong giao dịch, hợp đồng kinh tế của doanh nghiệp. Dành cho người làm kế toán, ngân quỹ, mua hàng, bán hàng, pháp chế và quản lý. Không cần làm Chuyên đề 1 trước.</p>'+\n"
      "    '<ol class=\"cdlist\">'+DK().map(function(k,i){var b=QB[k],done=store('qz_done_'+k)==='1';\n"
      "      return '<li><button type=\"button\" data-go=\"thi'+k+'\"><span class=\"cn'+(done?' ok':'')+'\">'+(done?'✓':'ABC'.charAt(i))+'</span><span class=\"ct\">'+esc(b.sh)+'<small>'+esc(b.sub)+(done?' · đã làm xong':'')+'</small></span>'+ic('next','go')+'</button></li>'}).join('')+'</ol></section>';\n"
      "  o+='<p class=\"pbfoot\">'+NOTPOLICE+'</p>';\n  return o;\n}\nfunction bankIntro(cd){\n  var b=QB[cd],dn=isDN(cd);\n  var o=pageh(dn?b.t:b.t.replace(/^CHUYÊN ĐỀ \\d+\\s*-\\s*/,''),null,dn?'Ngân hàng câu hỏi · Nhân viên doanh nghiệp':'Ngân hàng câu hỏi · Chuyên đề '+cd);")
F.rep(A, "+ic('next')+'</button><button type=\"button\" class=\"btn ghost\" data-go=\"doc'+cd+'\">Đọc bài trước đã</button><button type=\"button\" class=\"btn ghost\" data-go=\"thi\">Chọn chuyên đề khác</button></div>';",
      "+ic('next')+'</button>'+(dn?'<button type=\"button\" class=\"btn ghost\" data-go=\"thidn\">Chọn phần khác</button>':'<button type=\"button\" class=\"btn ghost\" data-go=\"doc'+cd+'\">Đọc bài trước đã</button><button type=\"button\" class=\"btn ghost\" data-go=\"thi\">Chọn chuyên đề khác</button>')+'</div>';")
F.rep(A, "data-go=\"thi'+BST.cd+'\">'+ic('back')+'Chuyên đề '+BST.cd+'</button>", "data-go=\"thi'+BST.cd+'\">'+ic('back')+esc(bankName(BST.cd))+'</button>")
F.rep(A, "qzHTML(q,'bank','Mã '+q.code+' · '+q.kind,BST.i);", "qzHTML(q,'bank',isDN(BST.cd)?q.kind:'Mã '+q.code+' · '+q.kind,BST.i);")
F.sub(A, r"function bankDone\(\)\{.*?\n\}\nfunction vBank\(cd\)\{.*?\n\}\n",
      lambda m: ("function bankDone(){\n"
       "  var b=QB[BST.cd],n=b.q.length,r=BST.right,dn=isDN(BST.cd);\n"
       "  store('qz_done_'+BST.cd,'1');\n"
       "  var rest=(dn?DK():QK()).filter(function(k){return store('qz_done_'+k)!=='1'});\n"
       "  document.getElementById('bankbody').innerHTML=pageh('Bạn trả lời đúng '+r+' trên '+n+' câu','Kết quả này chỉ hiện trên máy của bạn. Câu nào chưa đúng thì đọc lại phần giải thích là đủ.',bankName(BST.cd)+' · đã làm xong','check')+\n"
       "    (BST.cd==='1'?'<div class=\"gate open\"><b>Bảy chuyên đề còn lại đã mở.</b>Làm chuyên đề nào gần với việc mình đang gặp thì nhớ lâu hơn.</div>':'')+\n"
       "    '<div class=\"btnrow\"><button type=\"button\" class=\"btn pri\" data-go=\"'+(dn?'thidn':'thi')+'\">'+(dn?(rest.length?'Chọn phần tiếp theo, còn '+rest.length:'Đã làm hết ba phần, xem lại danh sách'):(rest.length?'Chọn chuyên đề tiếp theo, còn '+rest.length:'Đã làm hết 8 chuyên đề, xem lại danh sách'))+'</button>'+\n"
       "    '<button type=\"button\" class=\"btn ghost\" data-go=\"thi'+BST.cd+'\">Làm lại '+(dn?'phần này':'chuyên đề '+BST.cd)+'</button>'+(dn?'':'<button type=\"button\" class=\"btn ghost\" data-go=\"doc'+BST.cd+'\">Đọc lại bài</button>')+'</div>'+\n"
       "    '<p class=\"pbfoot\">Làm hết câu hỏi không có nghĩa là an toàn. Gặp việc thật, vẫn phải chậm lại và tự kiểm tra bằng kênh do chính mình tìm ra.</p>';\n"
       "  jump0();\n"
       "}\n"
       "function vBank(cd){\n"
       "  cd=String(cd||'0');var todn=cd==='dn';if(todn)cd='0';\n"
       "  if(cd!=='0'&&cd!=='1'&&!isDN(cd)&&!cd1Done())cd='0';\n"
       "  if(!QB[cd])cd='0';\n"
       "  var rg=regDone()&&regOpen();return {html:(rg?backrow('hoat-dong','Cuộc thi'):crumbs([['cong-cu-kiem-tra','CÔNG CỤ KIỂM TRA'],[null,'Tự luyện']]))+'<div id=\"bankbody\" style=\"display:grid;gap:16px\">'+(cd==='0'?bankMenu():bankIntro(cd))+'</div>',nav:rg?'hoat-dong':'cong-cu-kiem-tra',\n"
       "    after:todn?function(){var e=document.getElementById('thi-dn');if(e){try{e.scrollIntoView({block:'start'})}catch(x){}var hh=e.querySelector('h2');if(hh){hh.setAttribute('tabindex','-1');try{hh.focus({preventScroll:true})}catch(x){}}}}:null};\n"
       "}\n"), 1, flags=re.S)
F.rep(A, "  var ph=regDone(),gate=!cd1Done();", "  var ph=regOpen()?regDone():'',gate=!cd1Done();")
F.rep(A, "if((m=t.match(/^thi(\\d)?$/)))return vBank(m[1]);", "if((m=t.match(/^thi(\\d|dn\\d?)?$/)))return vBank(m[1]);")
F.rep(A, "'<div class=\"qzexp\">'+q.opt.map(function(o){return '<p'+(o[0]===q.ans?' class=\"isans\"':'')+'><b>'+o[0]+'.</b> '+esc(q.exp[o[0]]||'')+'</p>'}).join('')+'</div>'+\n    '<div class=\"qzsafe\"><b>Hành động an toàn</b>'+esc(q.safe)+'</div>';",
      "'<div class=\"qzexp\">'+q.opt.map(function(o){var x=q.exp[o[0]];return x?'<p'+(o[0]===q.ans?' class=\"isans\"':'')+'><b>'+o[0]+'.</b> '+esc(x)+'</p>':''}).join('')+'</div>'+\n    (q.safe?'<div class=\"qzsafe\"><b>Hành động an toàn</b>'+esc(q.safe)+'</div>':'');")
F.rep(A, "data-go=\"thi\">Tự luyện đầy đủ 200 câu'+ic('next')+'</button>'", "data-go=\"thi\">Tự luyện đầy đủ '+bankCounts()+' câu'+ic('next')+'</button>'")
F.rep(A, "<span class=\"ct\"><b>Tự luyện '+bankCounts()+' câu</b><span>Toàn bộ ngân hàng câu hỏi 8 chuyên đề. Không tính điểm, không lưu bài.</span></span>'+ic('next','go')+'</button>'+",
      "<span class=\"ct\"><b>Tự luyện '+bankCounts()+' câu</b><span>Toàn bộ ngân hàng câu hỏi 8 chuyên đề. Không tính điểm, không lưu bài.</span></span>'+ic('next','go')+'</button>'+\n     (DK().length?'<button type=\"button\" class=\"card\" data-go=\"thidn\">'+spot('brief')+'<span class=\"ct\"><b>Dành cho nhân viên doanh nghiệp</b><span>'+dnCounts()+' câu tình huống về giao dịch, hợp đồng của doanh nghiệp.</span></span>'+ic('next','go')+'</button>':'')+")

# ---- Liên hệ đúng nơi ----
F.rep(A, "return '<div class=\"aitem\"><h3>'+esc(x[0])+'</h3><p class=\"meta\">'+esc(x[1])+'</p><p class=\"meta\">Đường dẫn: <span class=\"fill\">[địa chỉ .gov.vn chính thức]</span> · Kiểm tra gần nhất: <span class=\"fill\">[ngày]</span></p></div>'}).join('')+",
      "return '<div class=\"aitem\"><h3>'+esc(x[0])+'</h3><p class=\"meta\">'+esc(x[1])+'</p></div>'}).join('')+")
F.rep(A, "'</div><p class=\"small\">Danh mục này chỉ gồm cơ quan nhà nước có thẩm quyền và hệ thống do Nhà nước vận hành.",
      "'</div><div class=\"note b\"><b>Cách tự tìm đúng địa chỉ</b><p>Tự gõ tên cơ quan vào ô tìm kiếm rồi chỉ mở địa chỉ có đuôi <b>.gov.vn</b>. Không bấm vào kết quả có chữ “Quảng cáo” hoặc “Được tài trợ”, và không dùng đường dẫn do người khác gửi.</p></div><p class=\"small\">Danh mục này chỉ gồm cơ quan nhà nước có thẩm quyền và hệ thống do Nhà nước vận hành.")
F.sub(A, r"   '<section class=\"sec\" aria-labelledby=\"h-hot\"><h2 id=\"h-hot\">Đường dây nóng của tổ chức tín dụng</h2>'\+\n.*?Hãy tự tìm số ở mặt sau thẻ hoặc trong ứng dụng của bạn\.</span></div></div></section>'\+\n", "", 1, flags=re.S)

# ---- Về website, Nguyên tắc nội dung, Xác minh đúng trang ----
F.rep(A, "<span>Website do Công ty ABC vận hành. <b>Đây không phải website của cơ quan nhà nước.</b> Website không nhận tố giác hoặc tin báo tội phạm.</span></div>'+\n   '<div class=\"fact\">'+spot('badge')+'<span>Công an xã Thiên Lộc góp ý về nội dung phòng, chống lừa đảo. Việc đó <b>không có nghĩa Công an xác nhận</b> một giao dịch, sản phẩm, dịch vụ hay nhà tài trợ nào là an toàn.</span></div>'+\n",
      "<span><b>Đây không phải website của cơ quan nhà nước.</b> Website không nhận tố giác hoặc tin báo tội phạm.</span></div>'+\n")
F.rep(A, "   '<li>Bộ 08 chuyên đề và ngân hàng câu hỏi của Chương trình tuyên truyền, hướng dẫn phòng, chống lừa đảo. Công an xã Thiên Lộc thẩm định nội dung chuyên môn.</li>'+\n   '<li>Cảnh báo mới dựa trên văn bản của cơ quan nhà nước, ghi rõ nguồn và ngày. Website không tổng hợp, không đăng lại tin bài báo chí.</li></ul>'+",
      "   '<li>Website tự biên soạn nội dung: bộ 08 chuyên đề, ngân hàng câu hỏi, các bài về thủ đoạn, các trang việc cần làm và các cảnh báo.</li>'+\n   '<li>Website không đưa tin, không tổng hợp và không đăng lại bài của báo chí hay của trang khác.</li>'+\n   '<li>Muốn biết chính xác một quy định, bạn nên tra trực tiếp tại cổng thông tin của cơ quan nhà nước có thẩm quyền.</li></ul>'+")
F.sub(A, r"\+\n   '<section class=\"sec spon\" aria-labelledby=\"h-sp\"><h2 id=\"h-sp\">Đơn vị tài trợ</h2>.*?việc chấp hành pháp luật của họ\.</p></section>';", ";", 1, flags=re.S)
F.rep(A, "<h2 id=\"h-map\">Website có ba mục</h2>", "<h2 id=\"h-map\">Các mục của website</h2>")
F.rep(A, "     ['hoi-dap','Hỏi – Đáp','chat','Câu hỏi thường gặp; gửi câu hỏi riêng, không công khai']])+'</section>'+",
      "     ['thu-vien','KIẾN THỨC NỀN TẢNG','book','Lừa đảo từ cổ chí kim, bài đọc theo chuyên đề, các thủ đoạn thường gặp'],\n     ['hoi-dap','Hỏi – Đáp','chat','Câu hỏi thường gặp, trả lời ngắn']])+'</section>'+")
F.rep(A, " 'Không nêu tên một cá nhân, tổ chức là bên lừa đảo, trừ khi trích đúng văn bản của cơ quan nhà nước đã nêu tên.',",
      " 'Không nêu tên một cá nhân, tổ chức đang hoạt động là bên lừa đảo.',\n 'Website tự biên soạn nội dung; không đưa tin, không tổng hợp và không đăng lại bài của báo chí hay của trang khác.',")
F.rep(A, " 'Mỗi bài ghi ngày rà soát gần nhất. Bài quá 90 ngày chưa rà soát tự hiện nhãn chờ rà soát.'];", " 'Các trang hướng dẫn ghi ngày rà soát gần nhất. Trang quá 90 ngày chưa rà soát lại tự hiện nhãn nhắc.'];")
F.rep(A, "pageh('Nguyên tắc nội dung','Website viết gì, không viết gì, lấy nguồn ở đâu và sửa sai thế nào.',null,'book')", "pageh('Nguyên tắc nội dung','Website viết gì, không viết gì và sửa sai thế nào.',null,'book')")
F.rep(A, "<h2 id=\"h-r\">Sáu nguyên tắc</h2>", "<h2 id=\"h-r\">Bảy nguyên tắc</h2>")
F.rep(A, "linkList([['polng',POLNAME.ng,'book','Tiêu chuẩn nguồn tin, cách dẫn nguồn'],['polcc',POLNAME.cc,'pen','Quyền phản hồi, thời hạn sửa sai'],['poltt',POLNAME.tt,'mega','Nhận tài trợ thế nào, hiển thị ở đâu']])+\n   '<p class=\"small\">Các văn bản đang là bản dự thảo, chờ luật sư độc lập rà soát và chủ quản ban hành.</p></section>';",
      "linkList([['polng',POLNAME.ng,'book','Website tự biên soạn gì, không đăng lại gì'],['polcc',POLNAME.cc,'pen','Cách báo lỗi, thời hạn sửa sai'],['poldl',POLNAME.dl,'lock','Website không lưu giữ lâu dài dữ liệu cá nhân'],['polmt',POLNAME.mt,'info','Website là gì và không phải là gì']])+'</section>';")
F.rep(A, "<li>Trang mạng xã hội: <span class=\"fill\">[chưa có — sẽ công bố tại đây]</span></li>", "<li>Trang mạng xã hội: chưa có. Khi có, địa chỉ sẽ được công bố tại đây.</li>")
F.rep(A, "<h2>Kênh chính thức của Chương trình</h2>", "<h2>Kênh chính thức của website</h2>")

# ---- chính sách ----
F.rep(A, "var POLNAME={mt:'Tuyên bố miễn trừ trách nhiệm',dl:'Chính sách bảo vệ dữ liệu cá nhân',tt:'Chính sách tài trợ',ng:'Nguyên tắc dẫn nguồn',cc:'Cách báo lỗi và cải chính'};\nvar POLICON={mt:'info',dl:'lock',tt:'mega',ng:'book',cc:'pen'};",
      "var POLNAME={mt:'Tuyên bố miễn trừ trách nhiệm',dl:'Chính sách bảo vệ dữ liệu cá nhân',ng:'Nguyên tắc biên soạn nội dung',cc:'Cách báo lỗi và cải chính'};\nvar POLICON={mt:'info',dl:'lock',ng:'book',cc:'pen'};")
F.rep(A, "   '<div class=\"draft\"><b>Bản dự thảo, chưa có hiệu lực</b>Phải được luật sư độc lập rà soát và chủ quản ban hành trước khi website hoạt động. Mọi chỗ trong ngoặc vuông là chỗ chờ điền.</div>'+\n", "")
F.rep(A, "if((m=tok.match(/^pol(ng|cc|tt)$/)))return 'chinh-sach.'+m[1];", "if((m=tok.match(/^pol(ng|cc)$/)))return 'chinh-sach.'+m[1];")
F.rep(B, "rep(\"if((m=tok.match(/^pol(ng|cc|tt)$/)))return 'chinh-sach.'+m[1];\",\n    \"if((m=tok.match(/^pol(ng|cc|tt)$/)))return 'chinh-sach.'+m[1];", "rep(\"if((m=tok.match(/^pol(ng|cc)$/)))return 'chinh-sach.'+m[1];\",\n    \"if((m=tok.match(/^pol(ng|cc)$/)))return 'chinh-sach.'+m[1];")

# ---- gửi biểu mẫu: không giả vờ đã gửi khi chưa có nơi nhận ----
F.rep(A, "/* Gửi biểu mẫu. Mặc định là chế độ xem thử: không gửi đi đâu.\n   Khi có máy chủ: đặt window.ATTC_API = 'https://…/api' trước app.js trong bản index.html.\n   Ba điểm nhận (POST, JSON): /questions · /feedback · /registrations. Xem README để biết từng trường. */\nvar API=STANDALONE&&typeof window.ATTC_API==='string'?window.ATTC_API.replace(/\\/$/,''):'';",
      "/* Gửi biểu mẫu. Hai cách nhận, đặt trong index.html trước app.js (xem README):\n   window.ATTC_API = 'https://…/api' : máy chủ nhận. Ba điểm nhận (POST, JSON): /questions · /feedback · /registrations.\n   window.ATTC_MAIL = 'ten@mien.vn'  : hộp thư nhận góp ý và câu hỏi; người gửi bấm Gửi trong ứng dụng thư của họ.\n   Chưa đặt cách nào thì biểu mẫu không hiện, trang ghi rõ nơi nhận sẽ được công bố. Không bao giờ báo “đã gửi” khi chưa gửi. */")
# API, MAIL phải có trước khi các trang dựng: khai báo sớm, ngay sau REVIEW
F.rep(A, "function fillv(v){return /^\\[/.test(v)?'<span class=\"fill\">'+esc(v)+'</span>':esc(v)}",
      "function fillv(v){return esc(v)}\n"
      "var API=STANDALONE&&typeof window.ATTC_API==='string'?window.ATTC_API.replace(/\\/$/,''):'';\n"
      "var MAIL=STANDALONE&&typeof window.ATTC_MAIL==='string'&&/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(window.ATTC_MAIL)?window.ATTC_MAIL:'';\n"
      "function canSend(kind){return !!API||(kind!=='registrations'&&!!MAIL)}\n"
      "function NOCHANNEL(what){return '<div class=\"note b\"><b>'+what+' sẽ được công bố tại trang này</b><p>Hiện website chưa mở nơi nhận trực tuyến. Khi mở, cách gửi sẽ được ghi tại đây. Đang gặp chuyện gấp thì đừng chờ: xem việc cần làm ngay ở mục KHẨN CẤP.</p><div class=\"btnrow\"><button type=\"button\" class=\"btn red sm\" data-urgent>Xem việc cần làm ngay</button></div></div>'}\n"
      "function MAILMSG(){return 'Ứng dụng thư trên máy bạn đang mở với nội dung đã soạn sẵn. Bấm Gửi trong ứng dụng thư để hoàn tất. Nếu ứng dụng thư không mở, hãy tự gửi thư tới '+esc(MAIL)+'.'}\n"
      "var MAILNOTE='Nội dung được gửi bằng ứng dụng thư trên máy bạn, nên Ban biên tập sẽ thấy địa chỉ thư của bạn. Địa chỉ đó chỉ dùng để trả lời khi cần và được xóa sau khi trả lời xong.';")
F.rep(A, "  if(hp&&hp.value){done();return}              /* máy tự điền ô ẩn: bỏ qua lặng lẽ */\n  if(!API){done();return}",
      "  if(hp&&hp.value)return;                       /* máy tự điền ô ẩn: bỏ qua lặng lẽ */\n"
      "  if(!API){\n"
      "    if(MAIL&&payload.mail){try{location.href='mailto:'+MAIL+'?subject='+encodeURIComponent(payload.mail[0])+'&body='+encodeURIComponent(payload.mail[1])}catch(e){}done('mail')}\n"
      "    return;\n"
      "  }\n"
      "  delete payload.mail;")
F.rep(A, "send('questions',{text:t,wantReply:rep,contact:rep?c:null,consent:true,publish:pub},'form[data-form=ask]','qerr',function(){go('dagui')});return;",
      "send('questions',{text:t,wantReply:rep,contact:rep?c:null,consent:true,publish:pub,mail:['[Hỏi – Đáp] antoantaichinh.vn',t+(rep?'\\n\\nXin trả lời riêng qua: '+c:'')+'\\n\\nCho đăng công khai sau khi biên tập và che thông tin cá nhân: '+(pub?'có':'không')]},'form[data-form=ask]','qerr',function(mode){er.hidden=true;if(mode==='mail'){document.getElementById('qdone').hidden=false;return}go('dagui')});return;")
F.rep(A, "send('feedback',{text:g,consent:true,prize:pz},'form[data-form=gopy]','gerr',", "send('feedback',{text:g,consent:true,prize:pz,mail:['[Góp ý] antoantaichinh.vn',g]},'form[data-form=gopy]','gerr',")

# ---- thư viện: bỏ nhãn "đang chờ thẩm định" ----
F.rep(T, "    '<div class=\"draft\"><b>Bài tham khảo, đang chờ thẩm định</b><span>Các bài thủ đoạn do website biên soạn, Ban biên tập đang rà soát từng bài. Việc cần làm khi có sự cố, hãy theo mục KHẨN CẤP.</span></div>'+\n",
      "    '<p class=\"small\">Các bài này do website biên soạn để tham khảo. Việc cần làm khi có sự cố, hãy theo mục KHẨN CẤP.</p>'+\n")
F.rep(T, "    '<p class=\"draftline\">Bài tham khảo do website biên soạn, đang chờ Ban biên tập thẩm định.</p>'+tools(true)+", "    tools(true)+")
F.rep(T, "   (STUV[s.id]?'<p class=\"draftline\">Câu chữ của tình huống này đang chờ Ban biên tập thẩm định. Các bước khi đã lỡ làm theo lấy từ trang việc cần làm đã thẩm định.</p>':'')+\n", "")
F.rep(T, "Tám bài đọc của Chương trình, mỗi bài một lĩnh vực", "Tám bài đọc, mỗi bài một lĩnh vực")
F.save()
