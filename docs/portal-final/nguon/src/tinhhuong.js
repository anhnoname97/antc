/* ================= CÔNG CỤ CHỌN TÌNH HUỐNG: giao diện =================
   Ba bước: (1) chọn chuyện giống mình — gõ vài chữ hoặc mở theo nhóm; (2) đã làm gì rồi; (3) việc nên làm theo thứ tự.
   Kết quả: một việc nên làm trước tiên · mức xử lý (DỪNG / HOÃN VÀ KIỂM CHỨNG / CHƯA PHÁT HIỆN ĐIỂM DỪNG) · các bước tiếp theo
   · đừng làm · cách tự kiểm chứng · bài đọc thêm. Không kết luận thay người dùng, không có nhãn "an toàn" (Điều 3). */
/* Tình huống chưa có nguồn đã thẩm định (bảng rà soát, mục 28; cập nhật 10/11/2026: bỏ thanh-toan-lai, thêm 4 tình huống mới). Công khai trước khi duyệt xong thì đặt AN_CHUA_THAM_DINH=true để ẩn. */
var AN_CHUA_THAM_DINH=false;
var STUV={'qr-ten-la':1,'hoi-chatbot-tim-so':1,'ca-cuoc':1,'video-nguoi-noi-tieng':1,'choi-hui':1,'tai-khoan-game':1,'nhan-lay-lai-tai-khoan':1,'tru-tien-the':1,'nhat-vang-doi-tien':1,'nguoi-la-den-nha':1,'doi-tai-khoan-nhan-tien':1,'lanh-dao-chuyen-gap':1,'don-hang-lon-chung-tu':1,'doi-tai-khoan-luong':1,'dang-nhap-la-ngan-hang':1,'hoan-hoc-phi':1,'dang-ky-trai-he':1,'hang-that-nguoi-nhan-tien-khac':1,'dat-hang-nho-mua-ho':1};
/* Bật cờ này là ẩn MỌI nội dung chưa duyệt của phần bổ sung: các tình huống trên và cả kho 157 bài thủ đoạn */
if(AN_CHUA_THAM_DINH){SITS=SITS.filter(function(s){return !STUV[s.id]});SGRP=SGRP.filter(function(g){return SITS.some(function(s){return s.g===g.k})});ARTIDX=[]}
var SITBY={};SITS.forEach(function(s){SITBY[s.id]=s});
var ARTBY={},ARTSLUG={};ARTIDX.forEach(function(a){ARTBY[a[0]]=a;ARTSLUG[a[1]]=a[0]});
/* Tình huống đầu tiên có chứa một bài: dùng cho nút "Chuyện này đang xảy ra với bạn?" và cho nhóm lọc trong kho bài */
var ARTSIT={};SITS.forEach(function(s){s.tac.forEach(function(n){if(!ARTSIT[n])ARTSIT[n]=s.id})});
function artGrp(n){return ARTSIT[n]?SITBY[ARTSIT[n]].g:(ARTGRP_EXTRA[n]||'lien-ket')}
function grpOf(k){for(var i=0;i<SGRP.length;i++)if(SGRP[i].k===k)return SGRP[i];return SGRP[0]}

/* ---- tìm gần đúng: không dấu, chịu lỗi gõ một ký tự, ưu tiên cụm hai chữ ---- */
var STSTOP={toi:1,minh:1,ban:1,co:1,bi:1,la:0,va:1,cua:1,cho:1,de:1,thi:1,mot:1,nhung:1,cac:1,nguoi:0,dang:1,da:1,duoc:1,khong:1,nay:1,do:1,roi:1,voi:1,tu:1,o:1,ve:1,vao:1,ra:1,len:1,qua:1,khi:1,neu:1,nen:1,gi:1,sao:1,the:0,nao:1,lam:0,bao:0,a:1,oi:1,nhe:1,a:1,ah:1,u:1,em:1,anh:1,chi:1,ong:1,ba:0,con:0,hay:1,hoac:1,cung:1,se:1,phai:1,vua:1,moi:1,lai:0,van:1,nhu:1,ma:0};
/* Viết tắt thường gặp khi gõ trên điện thoại (góp ý 10/11/2026): ko, k → không; dc → được; ck → chuyển khoản; stk → số tài khoản… */
var STSYN={ko:'khong',k:'khong',kh:'khong',khg:'khong',hok:'khong',dc:'duoc',dk:'duoc',ck:'chuyen khoan',stk:'so tai khoan',tk:'tai khoan',sdt:'so dien thoai',dt:'dien thoai',cskh:'cham soc khach hang',fb:'facebook',face:'facebook',ship:'shipper',shiper:'shipper',sipper:'shipper',bank:'ngan hang',nh:'ngan hang',ctv:'cong tac vien'};
function stNorm(s){return norm(s).replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).map(function(w){return STSYN[w]||w}).join(' ')}
function stToks(s){return stNorm(s).split(/\s+/).filter(function(w){return w&&w.length>1&&!STSTOP[w]})}
var STIDX=SITS.map(function(s){
  var title=stNorm(s.t),extra=stNorm(s.kw+' '+grpOf(s.g).t+' '+s.tac.map(function(n){return ARTBY[n]?ARTBY[n][2]:''}).join(' '));
  var tt={},xt={};title.split(/\s+/).forEach(function(w){if(w)tt[w]=1});extra.split(/\s+/).forEach(function(w){if(w)xt[w]=1});
  /* head: ba từ khóa đầu, là từ đặc trưng nhất của tình huống; trùng thì được cộng điểm để xếp lên trước */
  return {s:s,title:' '+title.replace(/\s+/g,' ')+' ',all:' '+(title+' '+extra).replace(/\s+/g,' ')+' ',tt:tt,xt:xt,head:' '+stNorm(s.kw).split(/\s+/).slice(0,3).join(' ')+' '};
});
function stNear(w,dict){
  if(w.length<4)return false;
  for(var k in dict){if(Math.abs(k.length-w.length)<=1&&k.charAt(0)===w.charAt(0)&&lev(w,k)<=1)return true}
  return false;
}
function stSearch(q){
  var qs=stToks(q);if(!qs.length)return [];
  var res=STIDX.map(function(x){
    var sc=0,hit=0;
    qs.forEach(function(w){
      if(x.tt[w]){sc+=3;hit++}
      else if(x.xt[w]){sc+=2;hit++}
      else if(w.length>=3&&(x.all.indexOf(' '+w)>-1)){sc+=1;hit++}
      else if(stNear(w,x.tt)||stNear(w,x.xt)){sc+=1.5;hit++}
      if(x.head.indexOf(' '+w+' ')>-1)sc+=1;
    });
    for(var i=0;i+1<qs.length;i++){var bg=' '+qs[i]+' '+qs[i+1]+' ';if(x.title.indexOf(bg)>-1)sc+=3;else if(x.all.indexOf(bg)>-1)sc+=2}
    if(qs.length>2&&hit<2)sc=sc/2;
    return {s:x.s,sc:sc};
  }).filter(function(r){return r.sc>=2}).sort(function(a,b){return b.sc-a.sc});
  return res.slice(0,6);
}

/* ---- trạng thái ---- */
var ST={step:0,sid:null,done:[],open:null,q:''};
function stReset(){ST={step:0,sid:null,done:[],open:null,q:''}}
function stURL(sid,sel){var t='khan-cap.chon-tinh-huong'+(sid?'.'+sid+(sel&&sel.length?'.'+sel.join('-'):''):'');CUR=t;try{history.replaceState({t:t},'','#'+t)}catch(e){}}
function vSit(sid,sel){
  stReset();
  if(sid&&SITBY[sid]){ST.sid=sid;ST.step=1;ST.done=(SITBY[sid].pre||[]).slice();
    /* đường dẫn có kèm lựa chọn (gửi cho người thân): mở thẳng kết quả */
    if(sel){var ok=['none','unk'].concat(SCONS.map(function(c){return c.v}));var L=String(sel).split('-').filter(function(v){return ok.indexOf(v)>-1});if(L.length){ST.done=L;ST.step=2}}}
  return {html:crumbs([['khan-cap','KHẨN CẤP'],[null,'Chuyện gì đây???']])+
    pageh('Chuyện gì đây???','Chọn chuyện giống với bạn nhất, không cần giống từng chữ. Cho biết bạn đã làm gì rồi. Website sẽ xếp việc nên làm theo thứ tự.','KHẨN CẤP','quiz','s')+
    '<p class="privacy">'+ic('lock')+'<span>Không cần đăng nhập. Lựa chọn của bạn không được lưu và không gửi đi đâu. Đừng gõ số điện thoại, số tài khoản hay tên riêng.</span></p>'+
    '<div class="urgstrip">'+ic('alert')+'<span><b>Đang bị đe dọa tính mạng, có người tìm đến tận nơi?</b> Gọi 113 ngay.</span><a class="btn red sm" href="tel:113">Gọi 113</a></div>'+
    '<div id="stbody" class="stbody"></div>',nav:'khan-cap',after:stPaint};
}
function stSitBtn(s,extra){
  return '<li><button type="button" class="stsit" data-st="pick" data-v="'+s.id+'"><span class="stdot st-'+s.st+'" aria-hidden="true"></span><span>'+esc(s.t)+(extra?'<small>'+extra+'</small>':'')+'</span>'+ic('next')+'</button></li>';
}
function stResHTML(){
  if(!ST.q)return '';
  var r=stSearch(ST.q);
  if(!r.length)return '<div class="stnone"><p><b>Chưa thấy chuyện nào giống.</b> Thử gõ khác đi (ví dụ: “gọi điện”, “việc làm”, “đặt cọc”), hoặc mở các nhóm bên dưới.</p><p class="small">Không thấy chuyện giống mình <b>không có nghĩa là an toàn</b>.</p></div>';
  return '<p class="small" id="st-rlab">Chuyện gần giống nhất với điều bạn gõ:</p><ul class="stlist" aria-labelledby="st-rlab">'+r.map(function(x){return stSitBtn(x.s,esc(grpOf(x.s.g).t))}).join('')+'</ul>';
}
function stPick(){
  var h='<section class="stsec" aria-labelledby="st-h1"><h2 id="st-h1" class="sthd">Gõ vài chữ về chuyện bạn gặp</h2>'+
    '<div class="searchrow" role="search"><label class="sr" for="stq">Tìm chuyện giống với bạn</label><input type="search" id="stq" placeholder="Ví dụ: công an gọi, đọc mã OTP, việc làm trên mạng, chuyển nhầm tiền" value="'+esc(ST.q)+'" autocomplete="off" enterkeyhint="search"></div>'+
    '<div id="stres" aria-live="polite">'+stResHTML()+'</div></section>'+
    '<section class="stsec" aria-labelledby="st-h2"><h2 id="st-h2" class="sthd">Hoặc chọn theo nhóm</h2><div class="stacc">'+SGRP.map(function(g){
      var list=SITS.filter(function(s){return s.g===g.k}),op=ST.open===g.k;
      return '<div class="stg"><button type="button" class="stgb" data-st="grp" data-v="'+g.k+'" aria-expanded="'+op+'" aria-controls="stg-'+g.k+'">'+spot(g.i,g.k==='de-doa'||g.k==='da-lo'?'s':'')+'<span><b>'+esc(g.t)+'</b><small>'+list.length+' tình huống</small></span>'+ic('next','chev')+'</button>'+
        '<ul class="stlist" id="stg-'+g.k+'"'+(op?'':' hidden')+'>'+list.map(function(s){return stSitBtn(s)}).join('')+'</ul></div>';
    }).join('')+'</div></section>'+
    '<section class="stsec stno" aria-labelledby="st-h3"><h2 id="st-h3" class="sthd">Không thấy chuyện giống mình?</h2>'+
    '<p class="small">Không thấy <b>không có nghĩa là an toàn</b>. Chọn một trong các lối dưới đây.</p>'+
    linkList([['pb0','Trả lời vài câu hỏi ngắn về điều đã xảy ra','question','Đã chuyển tiền, đã đọc mã, đang bị đe dọa…'],['khan-cap.kiem-tra','Trả lời 3 câu hỏi về cuộc liên hệ đáng ngờ','quiz','Họ liên hệ qua đâu, yêu cầu gì, hứa hay dọa gì'],['pb7','Cách tự kiểm chứng trước khi đưa','search','Dùng được cho mọi trường hợp còn lại'],['hoi-dap','Gửi câu hỏi riêng cho Ban biên tập','chat','Chỉ để hỏi, không phải nơi trình báo; trả lời có thể mất vài ngày']])+'</section>'+
    '<section class="stsec" aria-labelledby="st-h4"><h2 id="st-h4" class="sthd">Trong lúc chưa rõ, nhớ bốn điều</h2>'+principles()+'</section>';
  return h;
}
function stConsOpt(o,sel){
  return '<button type="button" class="wopt'+(o.v==='none'||o.v==='unk'?' wo-alt':'')+'" data-st="cons" data-v="'+o.v+'" aria-pressed="'+sel+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span><i class="wck" aria-hidden="true">'+ic('check')+'</i></button>';
}
function stCons(){
  var s=SITBY[ST.sid];
  return '<div class="stpicked"><span class="eyebrow">Chuyện gần giống</span><p>'+esc(s.t)+'</p><button type="button" class="more" data-st="change">'+ic('back')+'Chọn chuyện khác</button></div>'+
    '<section class="wzstep" aria-labelledby="st-c"><h2 id="st-c">Đến lúc này, chuyện gì đã xảy ra?</h2><p class="small">Có thể chọn nhiều dòng. Hãy kiểm tra cả dòng được đánh dấu sẵn. Không có dòng nào đúng thì chọn dòng đầu tiên.</p>'+
    '<div class="wopts" role="group" aria-label="Chuyện đã xảy ra">'+stConsOpt({v:'none',t:'Không có việc nào trong các dòng dưới đây. Tôi chỉ gặp đúng chuyện đã chọn ở trên',i:'check'},ST.done.indexOf('none')>-1)+
     SCONS.map(function(o){return stConsOpt(o,ST.done.indexOf(o.v)>-1)}).join('')+
     stConsOpt({v:'unk',t:'Tôi không nhớ rõ mình đã làm gì',i:'question'},ST.done.indexOf('unk')>-1)+'</div>'+
    '<p class="err" id="st-err" role="alert" hidden>Chọn một dòng, hoặc chọn “Tôi không nhớ rõ mình đã làm gì”.</p>'+
    '<div class="wznav"><button type="button" class="btn ghost" data-st="change">'+ic('back')+'Quay lại</button><button type="button" class="btn red" data-st="res">Xem việc nên làm'+ic('next')+'</button></div></section>';
}
/* Một bước lấy từ trang việc cần làm: giữ nguyên câu chữ, kèm hộp tìm số ngân hàng hoặc câu nói mẫu nếu bước đó có */
function stPbStep(ref){
  var p,i;if(typeof ref==='string'){var m=ref.split(':');p=+m[0];i=+m[1]}else{p=ref[0];i=ref[1]}
  var b=PB[p]&&PB[p].blocks[i];if(!b||!b.s)return null;
  return {t:b.s,pb:p,b:b};
}
/* Câu giải thích luôn hiện: điều kiện về thiết bị tin cậy, an toàn của bạn, không chờ ngân hàng, bằng chứng.
   Các câu giải thích khác thu vào nút "Vì sao, làm thế nào" (bản in vẫn in đủ). */
var STCRIT=/thiết bị khác|An toàn của bạn|ĐỪNG CHỜ|Không chờ ngân hàng|Không dùng lại máy|Không phải nơi thu hồi|nói với người đó trước|người bị hại|ngừng liên lạc trước|Chưa tự khôi phục|làm sạch máy|làm giả được/;
var STMN=0;
function stDetHTML(b,all,note){
  var inner='',vis=[],more=[];
  if(b){
    (b.d||[]).forEach(function(x){(all||STCRIT.test(x)?vis:more).push(x)});
    vis.forEach(function(x){inner+='<p class="small">'+esc(x)+'</p>'});
    if(note)inner+='<p class="stnote">'+esc(note)+'</p>';
    if(b.bank)inner+='<div class="bankbox"><b>'+esc(BANKBOX.h)+'</b>'+BANKBOX.rows.map(function(r){return '<p>'+r+'</p>'}).join('')+'</div>';
    if(b.say)inner+='<div class="say"><span class="eyebrow">Nói với tổng đài</span><q class="sayq">'+esc(b.say)+'</q></div>';
    if(b.a)inner+='<div class="acts2">'+b.a.map(function(a,i){return '<a class="'+(i?'alt':'')+'" href="'+a[0]+'">'+esc(a[1])+'</a>'}).join('')+'</div>';
    if(more.length){var id='stm'+(++STMN);inner+='<button type="button" class="lnk stmorebtn noprint" data-st="more" aria-expanded="false" aria-controls="'+id+'">Vì sao, làm thế nào</button><div class="stmore" id="'+id+'" hidden>'+more.map(function(x){return '<p class="small">'+esc(x)+'</p>'}).join('')+'</div>'}
  }else if(note)inner+='<p class="stnote">'+esc(note)+'</p>';
  return inner;
}
function stStepHTML(x,n){
  return '<li class="step"><span class="sn">'+n+'</span><div class="sb"><b>'+esc(x.t)+'</b>'+stDetHTML(x.b,false,x.note)+'</div></li>';
}
/* ================= XẾP VIỆC (viết lại 10/11/2026 sau vòng góp ý thứ hai) =================
   Xếp theo TỪNG HÀNH ĐỘNG, không theo nhóm. Mỗi bước của trang việc cần làm có mã hành động và bậc ưu tiên:
   0 gọi 113 · 1 cắt quyền điều khiển máy; nói với người thân khi bị đe dọa · 2 liên hệ ngân hàng, ví, nhà mạng, nơi giữ hàng
   · 3 không đưa thêm tiền, giấy tờ, mã · 4 báo người nhà, người quen · 5 rà soát tài khoản, giấy tờ · 6 giữ bằng chứng
   · 7 MỘT bước trình báo · 8 xử lý thiết bị, phản ánh 156. Cùng mã hành động thì chỉ giữ một bước.
   Việc riêng của tình huống (câu "Việc nên làm trước tiên") luôn được giữ, trừ khi trùng đúng một hành động của trang việc cần làm. */
var STACT={
 '8:0':['c113',0],'3:0':['offline',1],'8:1':['tell-trust',1.5],
 '3:1':['bank-otp',2.05],'3:3':['bank-lock',2.1],'2:1':['ship-stop',2.15],'2:0':['bank-money',2.2],'9:2':['bank-inflow',2.3],'3:2':['telco',2.4],'6:1':['acct-lock',2.5],
 '5:0':['no-more-money',3],'8:2':['no-more-money',3],'6:0':['no-more-docs',3],'9:0':['no-spend',3],'9:1':['no-return-caller',3.05],'8:3':['no-negotiate',3.1],
 '6:4':['tell-family',4],'8:5':['warn-contacts',4.1],
 '3:4':['change-pw',5],'9:3':['return-per-bank',5],'6:2':['check-banks',5.1],'6:3':['signed-copy',5.2],
 '2:3':['evid',6],'3:5':['keep-device',6],'6:5':['evid-acct',6.1],'8:4':['evid-threat',6],'9:4':['evid-inflow',6.1],
 '2:4':['report',7],'3:7':['report',7],'6:7':['report',7],'8:6':['report',7],
 '3:6':['repair',8],'2:7':['r156',8.1]
};
/* Câu "Việc nên làm trước tiên" của tình huống: mã hành động nếu trùng một bước của trang việc cần làm, và bậc ưu tiên */
var STSF={'tru-tien-the':['card-lock',2.12],'da-chuyen-tien':['bank-money',2.2],'sim-mat-song':['telco',2.4],'dang-nhap-la-ngan-hang':['bank-lock',2.1],
 'san-khoa-rut':['no-more-money',3],'tien-la-vao':['no-spend',3],'doa-vi-no':['warn-contacts',4.1],
 'giay-to-bi-dung':[null,6],'tung-anh-rieng-tu':[null,1.2],'bi-ep-o-mot-minh':[null,1.2],'nguoi-than-bi-bat-coc':[null,1.2]};
var STBANK={'bank-otp':1,'bank-lock':1,'bank-money':1,'bank-inflow':1,'card-lock':1};
/* Việc riêng của tình huống: nhận diện trình báo, 156, sửa máy, 113, bằng chứng để không lặp và xếp đúng chỗ */
function stTagDo(t){
  if(/trình báo/.test(t))return ['report',7];
  if(/\b113\b/.test(t))return ['c113',0.5];
  if(/156|5656/.test(t))return ['r156',8.1];
  if(/sửa chữa|bảo hành/.test(t))return ['repair',8];
  if(/^(Lưu|Giữ nguyên)|lưu lại nội dung|[Cc]hụp lại/.test(t))return [null,6.2];
  return [null,5.5];
}
/* Trang "Người khác đang có quyền vào tài khoản", bước giữ bằng chứng: câu "gỡ ứng dụng, làm sạch máy" chuyển sang bước xử lý máy (sau trình báo) */
function stSplit35(){var b=PB[3].blocks[5],d1=b.d[1],i=d1.indexOf('. ');return {keep:{s:b.s,d:[b.d[0],d1.slice(0,i+1)]},move:[d1.slice(i+2)].concat(b.d.slice(2))}}
function stCompute(){
  var s=SITBY[ST.sid],d=ST.done,cons=SCONS.filter(function(o){return d.indexOf(o.v)>-1}),unk=d.indexOf('unk')>-1;
  var k=cons.length?'d':(unk&&s.st==='n'?'h':s.st);
  var has=function(v){return d.indexOf(v)>-1};
  var pbs=[],items=[],n=0;
  if(!cons.length){
    var st0=s.dos.map(function(t){return {t:t}});
    return {s:s,k:k,cons:cons,unk:unk,first:{t:s.f},steps:st0,pbs:pbs};
  }
  var sp=stSplit35();
  cons.forEach(function(c,ci){
    if(pbs.indexOf(c.pb)<0)pbs.push(c.pb);
    c.st.forEach(function(r){
      var key=typeof r==='string'?r:c.pb+':'+r;
      if(key==='3:1'&&has('app'))return;               /* đã cài ứng dụng: bỏ bước "không cần tắt mạng" */
      var x=stPbStep(key.split(':').map(Number));if(!x)return;
      var m=STACT[key]||[null,5.5];x.key=key;x.aid=m[0];x.tier=m[1];x.src=0;x.ord=ci*100+(n++);
      if(key==='3:5')x.b=sp.keep;
      if(key==='3:6')x.b={s:x.b.s,d:sp.move};
      items.push(x);
    });
  });
  var sf=STSF[s.id]||[null,3.5];
  items.push({t:s.f,aid:sf[0],tier:sf[1],src:1,ord:9000});
  s.dos.forEach(function(t,i){var g=stTagDo(t);items.push({t:t,aid:g[0],tier:g[1],src:2,ord:9100+i})});
  /* một bước trình báo, luôn có khi đã lỡ làm việc cần trình báo: câu của trang bị đe dọa, rồi đã chuyển tiền, rồi giấy tờ;
     câu "Nếu đã phát sinh giao dịch" chỉ dùng khi không có câu nào khác */
  var rk=has('threat')?'8:6':(has('money')||has('goods'))?'2:4':(has('acct')||has('id'))?'6:7':(has('app')||has('otp')||has('sim')||has('login'))?'3:7':null;
  if(rk){
    items=items.filter(function(x){return x.aid!=='report'});
    var rp=stPbStep(rk.split(':').map(Number)),rb={s:rp.b.s,d:(rp.b.d||[]).slice()};
    if(rk!=='2:4'&&(has('money')||has('goods')))rb.d=rb.d.concat(PB[2].blocks[4].d);
    items.push({t:rp.t,b:rb,key:rk,aid:'report',tier:7,src:0,ord:0});
  }
  items.sort(function(a,b){return a.tier-b.tier||a.src-b.src||a.ord-b.ord});
  var out=[],seenA={},seenT={};
  items.forEach(function(x){if(seenT[x.t]||(x.aid&&seenA[x.aid]))return;seenT[x.t]=1;if(x.aid)seenA[x.aid]=1;out.push(x)});
  /* hai bước cùng phải gọi ngân hàng: nhắc gộp vào một cuộc gọi nếu là cùng một nơi */
  var lastBank=null;out.forEach(function(x){if(STBANK[x.aid]){if(lastBank&&lastBank!=='bank-otp')x.note='Nếu cùng ngân hàng, ví với bước trên thì nói cả hai việc trong cùng một cuộc gọi.';lastBank=x.aid}});
  return {s:s,k:k,cons:cons,unk:unk,first:out[0],steps:out.slice(1),pbs:pbs};
}
var STVER='10/11/2026';
var STBIG={d:'Dừng lại trước đã',h:'Hoãn lại, tự kiểm chứng trước',n:'Chưa thấy điểm dừng — vẫn tự kiểm chứng'};
function stChk(s){
  if(s.ck==='bank')return '<ul class="facts">'+BANKA.map(function(r,i){return '<li class="fact">'+spot(['card','app','x'][i],i===2?'s':'')+'<span>'+r+'</span></li>'}).join('')+'</ul><p class="small">'+BANKANOTE+'</p>';
  var r=SCHK[s.ck];if(!r)return '';
  var b=PB[r[0]].blocks[r[1]];
  return '<p><b>'+esc(b.s)+'</b></p>'+(b.d?b.d.map(function(x){return '<p class="small">'+esc(x)+'</p>'}).join(''):'');
}
/* Bản gửi người thân: ĐỦ mọi việc theo thứ tự, kèm các câu điều kiện luôn hiện; đường dẫn mở lại đúng các lựa chọn */
function stSel(r){return r.cons.length?r.cons.map(function(c){return c.t}).join('; '):(r.unk?'Không nhớ rõ đã làm gì':'Không có việc nào trong danh sách')}
function stShareText(r){
  var L=[r.first].concat(r.steps).map(function(x,i){var c=x.b&&x.b.d?x.b.d.filter(function(y){return STCRIT.test(y)}):[];return (i+1)+') '+x.t+(c.length?' ('+c.join(' ')+')':'')});
  return 'Mình vừa xem hướng dẫn trên antoantaichinh.vn cho chuyện: “'+r.s.t+'”. Đã chọn: '+stSel(r)+'. Khuyến nghị: '+STATE[r.k].lab+'.\nLàm theo thứ tự:\n'+L.join('\n')+
    '\nĐường dẫn dưới đây mở lại đúng chuyện và các lựa chọn này, kèm đủ phần giải thích. '+RESNOTE;
}
function stResult(){
  var r=stCompute(),s=r.s,why=[esc(s.w)].concat((s.sg||[]).map(function(i){return SIGNS[i][1]}));
  var arts=s.tac.filter(function(n){return ARTBY[n]}).map(function(n){var a=ARTBY[n];return ['thu-vien.'+a[1],a[2],'book','Bài về thủ đoạn · đọc khoảng '+a[3]+' phút']});
  var more=[];if(LVSLUG[s.cd])more.push(['lv'+s.cd,'Bài hướng dẫn: '+lvName(s.cd),LVICON[s.cd]||'book','Thủ đoạn thường gặp, dấu hiệu, việc cần làm']);
  if(DOCS[s.cd])more.push(['doc'+s.cd,'Bài đọc Chuyên đề '+s.cd+': '+DOCS[s.cd].t,'book','Đọc kỹ khi đã bình tĩnh']);
  var h='<div class="wres stres">'+
   '<div class="stpicked"><span class="eyebrow">Tình huống gần giống</span><p>'+esc(s.t)+'</p><p class="small">Đây là ví dụ để bạn đối chiếu, không phải kết luận về việc bạn đang gặp.</p></div>'+
   '<section class="stfirst" aria-labelledby="st-f"><span class="eyebrow" id="st-f"><span class="sn">1</span>Việc nên làm trước tiên</span><p>'+esc(r.first.t)+'</p>'+(r.first.b?'<div class="stfdet">'+stDetHTML(r.first.b,true)+'</div>':'')+'</section>'+
   '<section class="wr wr-lvl" aria-label="Mức xử lý">'+resBox(r.k,r.cons.length?'Làm ngay các việc dưới đây, theo thứ tự':STBIG[r.k],why,
      r.k==='n'?'<p class="rs-more">Không thấy dấu hiệu nào không có nghĩa là an toàn. Vẫn tự kiểm tra bằng kênh do chính bạn tìm ra trước khi đưa tiền hay thông tin.</p>':'')+'</section>'+
   (r.unk?note('b','Bạn không nhớ rõ đã làm gì?','Trả lời vài câu hỏi ngắn để biết việc nào phải làm trước. Không chắc thì cứ làm như thể đã lỡ: gọi ngân hàng bằng số in sau thẻ để hỏi.'):'')+
   (r.steps.length?'<section class="wr" aria-labelledby="st-n"><h2 id="st-n">Tiếp theo, theo thứ tự</h2><ol class="steps" start="2">'+r.steps.map(function(x,i){return stStepHTML(x,i+2)}).join('')+'</ol>'+
     (r.pbs.length?'<p class="small">Các bước trên lấy từ trang việc cần làm. Mở đủ các bước:</p>'+linkList(r.pbs.map(function(p){return ['pb'+p,PB[p].title,PBICON[p]]})):'')+'</section>':'')+
   (s.dn.length?'<section class="wr" aria-labelledby="st-d"><h2 id="st-d">Đừng làm</h2><ul class="stopl">'+s.dn.map(function(t){return '<li>'+ic('x')+'<span>'+esc(t)+'</span></li>'}).join('')+'</ul></section>':'')+
   (r.cons.some(function(c){return c.v==='money'||c.v==='app'||c.v==='otp'})?note('r',RECOV.h,RECOV.b)+(s.id!=='nhan-lay-lai-tien'&&SITBY['nhan-lay-lai-tien']?linkList([['khan-cap.chon-tinh-huong.nhan-lay-lai-tien','Có người nhận lấy lại tiền đã mất cho bạn?','alert','Xem việc nên làm trước khi trả bất kỳ khoản phí nào']]):''):'')+
   (s.ck?'<section class="wr" aria-labelledby="st-k"><h2 id="st-k">Tự kiểm chứng thế nào</h2>'+stChk(s)+'</section>':'')+
   (!r.cons.length?'<section class="wr" aria-labelledby="st-l"><h2 id="st-l">Nếu bạn đã lỡ làm theo</h2>'+linkList([['pb3','Đã đọc mã OTP, đưa mật khẩu, cài ứng dụng','key'],['pb2','Đã chuyển tiền hoặc giao hàng đi','money'],['pb6','Đã gửi ảnh giấy tờ, quét khuôn mặt, ký giấy','id'],['pb8','Đang bị đe dọa, ép buộc','alert']])+'</section>':'')+
   (arts.length||more.length?'<section class="wr" aria-labelledby="st-r"><h2 id="st-r">Đọc thêm khi đã bình tĩnh</h2>'+linkList(arts.slice(0,4).concat(more))+'</section>':'')+
   '<div class="printonly"><p><b>Đã chọn:</b> '+esc(stSel(r))+'.</p><p class="small">Bản hướng dẫn ngày '+STVER+' · antoantaichinh.vn</p><h2>Bốn việc không làm khi nghi ngờ</h2><ul class="pchk">'+PRINC.map(function(p){return '<li><b>'+esc(p[1])+'.</b> '+esc(p[2])+'</li>'}).join('')+'</ul></div>'+
   '<div class="wr-cta">'+(STANDALONE?'<button type="button" class="btn ghost" data-print>'+ic('print')+'In hoặc lưu PDF</button>':'')+
    '<button type="button" class="btn ghost" data-act="sharetext" aria-expanded="false" aria-controls="sharep">'+ic('share')+'Gửi cho người thân</button>'+
    '<button type="button" class="btn ghost" data-st="edit">'+ic('back')+'Sửa điều đã làm</button>'+
    '<button type="button" class="btn ghost" data-st="again">'+ic('refresh')+'Chọn chuyện khác</button></div>'+
   '<p class="okmsg" id="pagemsg" hidden></p><div class="sharep" id="sharep" hidden data-text="'+esc(stShareText(r))+'"></div>'+
   '<button type="button" class="nomatch noprint" data-go="khan-cap.kiem-tra">'+ic('question')+'<span>Chuyện của tôi không giống lắm<small>Trả lời 3 câu hỏi ngắn về cuộc liên hệ đáng ngờ</small></span>'+ic('next')+'</button>'+
   resNotes()+'<p class="pbfoot">'+NOTPOLICE+'</p>'+PRINTFOOT+'</div>';
  return h;
}
function stPaint(){
  var b=document.getElementById('stbody');if(!b)return;
  b.innerHTML=ST.step===0?stPick():(ST.step===1?stCons():stResult());
  if(ST.step>0){bodyTop(b);var f=b.querySelector(ST.step===2?'.stfirst':'h2');if(f){f.setAttribute('tabindex','-1');try{f.focus({preventScroll:true})}catch(e){}}}
}
function stAct(kind,v,el){
  if(kind==='more'){var c=document.getElementById(el.getAttribute('aria-controls')),o=el.getAttribute('aria-expanded')==='true';el.setAttribute('aria-expanded',String(!o));if(c)c.hidden=o;el.textContent=o?'Vì sao, làm thế nào':'Thu gọn';return}
  if(kind==='grp'){
    ST.open=ST.open===v?null:v;
    VIEW.querySelectorAll('.stgb').forEach(function(x){var on=x.dataset.v===ST.open;x.setAttribute('aria-expanded',String(on));var l=document.getElementById('stg-'+x.dataset.v);if(l)l.hidden=!on});
    if(ST.open){var g=VIEW.querySelector('.stgb[data-v="'+v+'"]');if(g)try{g.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}}
    return;
  }
  if(kind==='pick'){ST.sid=v;ST.step=1;ST.done=(SITBY[v].pre||[]).slice();stURL(v);stPaint();return}
  if(kind==='cons'){
    var a=ST.done,i=a.indexOf(v);
    if(i>-1)a.splice(i,1);else if(v==='none')ST.done=a=['none'];else{a=a.filter(function(x){return x!=='none'});a.push(v);ST.done=a}
    VIEW.querySelectorAll('[data-st="cons"]').forEach(function(x){x.setAttribute('aria-pressed',String(ST.done.indexOf(x.dataset.v)>-1))});
    var er=document.getElementById('st-err');if(er)er.hidden=true;return;
  }
  if(kind==='res'){
    if(!ST.done.length){var e=document.getElementById('st-err');if(e){e.hidden=false;try{e.scrollIntoView({block:'nearest'})}catch(x){}}return}
    ST.step=2;stURL(ST.sid,ST.done);stPaint();return}
  if(kind==='edit'){ST.step=1;stURL(ST.sid);stPaint();return}
  if(kind==='change'||kind==='again'){var q=ST.q;stReset();ST.q=kind==='change'?q:'';stURL(null);stPaint();jump0();var inp=document.getElementById('stq');if(inp&&kind==='again')try{inp.focus()}catch(e){}return}
}
var STT=null;
function stInput(v){clearTimeout(STT);STT=setTimeout(function(){ST.q=v.trim();var r=document.getElementById('stres');if(r)r.innerHTML=stResHTML()},160)}

/* ================= KIẾN THỨC NỀN TẢNG: ba ngăn bài viết ================= */
/* Toàn văn bài thủ đoạn nằm trong bai-viet.js, chỉ tải khi mở bài lần đầu (trang chính nhẹ, máy yếu vẫn mở nhanh). */
function loadArts(cb){
  if(window.__ARTICLES__){cb(true);return}
  var s=document.createElement('script');s.src='bai-viet.js';s.async=true;
  s.onload=function(){cb(!!window.__ARTICLES__)};s.onerror=function(){cb(false)};document.head.appendChild(s);
}
/* Markdown của bài viết → HTML. Thoát ký tự trước, rồi mới định dạng: nội dung bài không thể chèn mã vào trang. */
function mdInline(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[\s(“"])\*(?!\s)(.+?)\*(?=[\s.,;:!?)”"]|$)/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>')}
function mdHTML(md){
  var L=md.replace(/\r/g,'').split('\n'),o='',i=0;
  function para(buf){if(buf.length)o+='<p>'+mdInline(buf.join(' '))+'</p>'}
  while(i<L.length){
    var l=L[i],t=l.trim();
    if(!t||/^-{3,}$/.test(t)){i++;continue}
    var m;
    if((m=t.match(/^(#{2,4})\s+(.*)$/))){o+=(m[1].length===2?'<h2>':'<h3>')+mdInline(m[2])+(m[1].length===2?'</h2>':'</h3>');i++;continue}
    if(t.charAt(0)==='>'){var q=[];while(i<L.length&&L[i].trim().charAt(0)==='>'){q.push(L[i].trim().replace(/^>\s?/,''));i++}o+='<div class="mdq">'+mdHTML(q.join('\n'))+'</div>';continue}
    if(t.charAt(0)==='|'){
      var rows=[];while(i<L.length&&L[i].trim().charAt(0)==='|'){rows.push(L[i].trim());i++}
      var cells=function(r){return r.replace(/^\||\|$/g,'').split('|').map(function(c){return c.trim()})};
      var head=cells(rows[0]),body=rows.slice(1).filter(function(r){return !/^\|?\s*:?-{2,}/.test(r)});
      o+='<div class="tblwrap"><table class="dtbl"><thead><tr>'+head.map(function(c){return '<th>'+mdInline(c)+'</th>'}).join('')+'</tr></thead><tbody>'+
        body.map(function(r){return '<tr>'+cells(r).map(function(c){return '<td>'+mdInline(c)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
      continue;
    }
    if(/^([-*])\s+/.test(t)||/^\d+\.\s+/.test(t)){
      var ord=/^\d+\./.test(t),start=ord?parseInt(t,10):1,items=[];
      while(i<L.length){
        var u=L[i],ut=u.trim();
        if(ord?/^\d+\.\s+/.test(ut):/^[-*]\s+/.test(ut)){items.push(ut.replace(ord?/^\d+\.\s+/:/^[-*]\s+/,''));i++}
        else if(ut&&/^\s{2,}/.test(u)&&items.length){items[items.length-1]+=' '+ut;i++}
        else break;
      }
      o+=(ord?'<ol'+(start!==1?' start="'+start+'"':'')+'>':'<ul>')+items.map(function(x){return '<li>'+mdInline(x)+'</li>'}).join('')+(ord?'</ol>':'</ul>');
      continue;
    }
    var buf=[];while(i<L.length&&L[i].trim()&&!/^(#{2,4}\s|>|\||[-*]\s|\d+\.\s|-{3,}$)/.test(L[i].trim())){buf.push(L[i].trim());i++}
    para(buf);
  }
  return o;
}
var LB={q:'',g:'',n:20};
function lbFiltered(){
  var qs=LB.q?stToks(LB.q):[];
  return ARTIDX.filter(function(a){
    if(LB.g&&artGrp(a[0])!==LB.g)return false;
    if(!qs.length)return true;
    var x=' '+norm(a[2]+' '+a[4]+' '+a[1].replace(/-/g,' ')).replace(/[^a-z0-9 ]+/g,' ')+' ';
    return qs.every(function(w){return x.indexOf(' '+w)>-1||stNear(w,(function(){var d={};x.split(' ').forEach(function(k){if(k)d[k]=1});return d})())});
  });
}
function lbList(){
  var r=lbFiltered();
  if(!r.length)return '<div class="stnone"><p><b>Chưa thấy bài nào khớp.</b> Thử từ khác, hoặc bỏ bớt bộ lọc.</p><p class="small">Không thấy bài <b>không có nghĩa là an toàn</b>. Đang gặp chuyện thì <button type="button" class="lnk" data-go="khan-cap.chon-tinh-huong">chọn tình huống của bạn</button>.</p></div>';
  return '<p class="small" aria-live="polite">'+r.length+' bài</p><ul class="lblist">'+r.slice(0,LB.n).map(function(a){
    return '<li><button type="button" data-go="thu-vien.'+a[1]+'">'+ic(grpOf(artGrp(a[0])).i)+'<span><b>'+esc(a[2])+'</b><small>'+esc(a[4])+'</small><em>Đọc khoảng '+a[3]+' phút</em></span>'+ic('next')+'</button></li>';
  }).join('')+'</ul>'+(r.length>LB.n?'<button type="button" class="btn ghost" data-act="lbmore">Xem thêm '+Math.min(20,r.length-LB.n)+' bài</button>':'');
}
function lbRefresh(){var l=document.getElementById('lblist');if(l)l.innerHTML=lbList();VIEW.querySelectorAll('[data-lbg]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.lbg===LB.g))})}
function vLib(sub){
  if(sub&&ARTSLUG[sub])return vBai(ARTSLUG[sub]);
  var h=crumbs([[null,'KIẾN THỨC NỀN TẢNG']])+
   pageh('KIẾN THỨC NỀN TẢNG','Đọc khi đã bình tĩnh: lừa đảo đã có từ xưa và thay áo mới ra sao, phân tích theo từng lĩnh vực, và các thủ đoạn thường gặp. Đang gặp chuyện thì bắt đầu từ mục KHẨN CẤP.',null,'book')+
   '<div class="btnrow"><button type="button" class="btn red" data-go="khan-cap.chon-tinh-huong">'+ic('alert')+'Tôi đang gặp chuyện, cần biết làm gì</button></div>'+
   '<nav class="shelfnav" aria-label="Ba ngăn bài viết"><button type="button" data-jump="ng-ck">'+ic('book')+'<span>Lừa đảo: Từ cổ chí kim<small>10 bài kể chuyện</small></span></button>'+
    '<button type="button" data-jump="ng-cd">'+ic('doc')+'<span>Phân tích theo chuyên đề<small>8 bài đọc, 6 bài hướng dẫn</small></span></button>'+
    (ARTIDX.length?'<button type="button" data-jump="ng-td">'+ic('alert')+'<span>Các thủ đoạn thường gặp<small>Tìm theo tên hoặc theo nhóm</small></span></button>':'')+'</nav>'+
   '<section class="sec" id="ng-ck" aria-labelledby="h-ck"><h2 id="h-ck">Lừa đảo: Từ cổ chí kim</h2><p class="small">Chuỗi bài kể chuyện và giải thích vì sao người tỉnh táo vẫn mắc bẫy. Phần hướng dẫn làm gì nằm ở bài đọc chuyên đề và mục KHẨN CẤP.</p>'+artList()+'</section>'+
   '<section class="sec" id="ng-cd" aria-labelledby="h-cd"><h2 id="h-cd">Phân tích theo chuyên đề</h2><p class="small">Tám bài đọc, mỗi bài một lĩnh vực, kèm câu hỏi tự luyện. Sáu bài hướng dẫn tóm lại thủ đoạn, dấu hiệu và việc cần làm của từng lĩnh vực.</p>'+docList()+
    '<h3 class="h3">Bài hướng dẫn theo lĩnh vực</h3>'+lvTiles()+'</section>'+
   (!ARTIDX.length?'':'<section class="sec" id="ng-td" aria-labelledby="h-td"><h2 id="h-td">Các thủ đoạn lừa đảo thường gặp</h2>'+
    '<p class="small">Mỗi bài nói một thủ đoạn: kịch bản, vì sao nhiều người vẫn tin, dấu hiệu nhận biết và việc nên làm. Đây là những cách hay gặp, <b>không phải toàn bộ</b>. Chuyện bạn gặp không có ở đây không có nghĩa là an toàn.</p>'+
    '<p class="small">Các bài này do website biên soạn để tham khảo. Việc cần làm khi có sự cố, hãy theo mục KHẨN CẤP.</p>'+
    '<div class="rtools" role="search"><label class="lbl" for="lbq">Tìm bài theo tên thủ đoạn</label><div class="searchrow"><input type="search" id="lbq" placeholder="Ví dụ: đặt cọc, giả giọng nói, hụi, phạt nguội" value="'+esc(LB.q)+'" autocomplete="off" enterkeyhint="search"></div></div>'+
    '<div class="chiprow lbchips" role="group" aria-label="Lọc theo nhóm"><button type="button" class="gchip" data-lbg="" aria-pressed="'+(!LB.g)+'">Tất cả</button>'+SGRP.map(function(g){return '<button type="button" class="gchip" data-lbg="'+g.k+'" aria-pressed="'+(LB.g===g.k)+'">'+ic(g.i)+'<span>'+esc(g.t)+'</span></button>'}).join('')+'</div>'+
    '<div id="lblist">'+lbList()+'</div></section>');
  return {html:h,nav:'cac-rui-ro',after:sub?function(){var id={'co-chi-kim':'ng-ck','chuyen-de':'ng-cd','thu-doan':'ng-td'}[sub],e=id&&document.getElementById(id);if(e){try{e.scrollIntoView({block:'start'})}catch(x){}var hh=e.querySelector('h2');if(hh){hh.setAttribute('tabindex','-1');try{hh.focus({preventScroll:true})}catch(x){}}}}:null};
}
function vBai(n){
  var a=ARTBY[n],sid=ARTSIT[n],g=grpOf(artGrp(n));
  var top=crumbs([['thu-vien','KIẾN THỨC NỀN TẢNG'],['thu-vien.thu-doan','Các thủ đoạn thường gặp'],[null,a[2]]]);
  if(!window.__ARTICLES__){
    var tok='thu-vien.'+a[1];
    return {html:top+'<article class="doc"><h1 tabindex="-1">'+esc(a[2])+'</h1><p class="docmeta" id="baiload">Đang tải bài viết…</p></article>',nav:'cac-rui-ro',
      after:function(){loadArts(function(ok){if(CUR!==tok)return;if(ok){render(tok)}else{var e=document.getElementById('baiload');if(e)e.textContent='Chưa tải được bài. Kiểm tra kết nối mạng rồi mở lại trang.'}})}};
  }
  var md=String(window.__ARTICLES__[n]||''),meta='';
  md=md.replace(/^Chuyên mục:[^\n]*\n?/m,function(x){meta=x.trim();return ''});
  var same=ARTIDX.filter(function(x){return x[0]!==n&&artGrp(x[0])===g.k}).slice(0,4).map(function(x){return ['thu-vien.'+x[1],x[2],'book']});
  var h=top+'<article class="doc md"><p class="eyebrow">Các thủ đoạn thường gặp · '+esc(g.t)+'</p><h1 tabindex="-1">'+esc(a[2])+'</h1>'+
    '<p class="docmeta"><span>'+ic('clock')+'Đọc khoảng '+a[3]+' phút</span>'+(meta?' · '+esc(meta.replace(/^Chuyên mục:\s*/,'')):'')+'</p>'+
    tools(true)+
    '<div class="docnow"><b>Chuyện này đang xảy ra với bạn?</b><p>Đừng đọc hết bài lúc này. Chọn tình huống, cho biết bạn đã làm gì, rồi làm theo thứ tự.</p><div class="btnrow">'+
     (sid?'<button type="button" class="btn red sm" data-go="khan-cap.chon-tinh-huong.'+sid+'">Xem việc nên làm</button>':'<button type="button" class="btn red sm" data-go="khan-cap.chon-tinh-huong">Chọn tình huống của bạn</button>')+
     '<button type="button" class="btn ghost sm" data-urgent>Việc cần làm ngay</button></div></div>'+
    mdHTML(md)+
    (same.length?'<div class="docend"><b>Bài cùng nhóm</b>'+linkList(same)+'<button type="button" class="btn ghost" data-go="thu-vien.thu-doan">Tất cả bài về thủ đoạn'+ic('next')+'</button></div>':'')+
    '<p class="printfoot">Bản in từ antoantaichinh.vn — Các thủ đoạn thường gặp. Đây không phải website của cơ quan nhà nước và không tiếp nhận tố giác, tin báo về tội phạm. Nội dung có thể đã được cập nhật sau ngày in.</p></article>';
  return {html:h,nav:'cac-rui-ro'};
}
