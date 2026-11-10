// Kiểm tra quy tắc xếp việc với MỌI tổ hợp lựa chọn ở bước 2 (2^11 − 1 tổ hợp × mọi tình huống), không cần trình duyệt.
// Kiểm cả phần giải thích của từng bước và bản "Gửi cho người thân", không chỉ tiêu đề bước.
// Dùng: node tools/chk_combos.js src
const vm=require('vm'),fs=require('fs'),path=require('path');const S=process.argv[2];const R=f=>fs.readFileSync(path.join(S,f),'utf8');
const cx={window:{}};vm.createContext(cx);vm.runInContext(R('data.js'),cx);
const app=R('app.js'),th=R('tinhhuong.js');
const fn=name=>{const i=app.indexOf('function '+name+'(');let d=0,j=app.indexOf('{',i);for(let k=j;k<app.length;k++){if(app[k]==='{')d++;else if(app[k]==='}'){d--;if(!d)return app.slice(i,k+1)}}};
const vr=name=>{const i=app.indexOf('var '+name+'=');return app.slice(i,app.indexOf('\n',i))};
const cut=(a,b)=>th.slice(th.indexOf(a),th.indexOf(b));
vm.runInContext('var D=window.__DATA__,PB=D.PB,DOCS=D.DOCS;function esc(s){return String(s)}var BANKBOX={h:"",rows:[]};'+fn('norm')+fn('lev')+vr('RESNOTE')+
  app.slice(app.indexOf('var STATE={'),app.indexOf('};',app.indexOf('var STATE={'))+2)+R('st_data.js')+R('art_index.js')+th.split('/* ---- trạng thái ---- */')[0]+
  'var ST={};'+cut('function stPbStep','var STBIG=')+cut('function stSel','function stResult'),cx);
const {SITS,SCONS,STSF}=vm.runInContext('({SITS,SCONS,STSF})',cx);
const V=SCONS.map(c=>c.v);let n=0,bad=[];const dtext=x=>(x.b&&x.b.d||[]).join(' ');
for(const s of SITS)for(let m=1;m<(1<<V.length);m++){
  const done=V.filter((v,i)=>m&(1<<i));vm.runInContext('ST={sid:'+JSON.stringify(s.id)+',done:'+JSON.stringify(done)+'}',cx);
  const r=vm.runInContext('stCompute()',cx),share=vm.runInContext('stShareText(stCompute())',cx);n++;
  const L=[r.first].concat(r.steps),T=L.map(x=>x.t),has=v=>done.includes(v),e=[];
  const idx=re=>T.findIndex(t=>re.test(t)),aidx=a=>L.findIndex(x=>x.aid===a);
  const needRep=['threat','app','otp','sim','login','money','goods','acct','id'].some(has);
  const rep=T.filter(t=>/trình báo/.test(t)).length;
  if(!r.first||!r.first.t)e.push('không có việc 1');
  if(needRep&&rep!==1)e.push('số bước trình báo = '+rep);
  if(!needRep&&rep>1)e.push('trình báo lặp');
  // 1. việc riêng của tình huống không bị mất khi chọn thêm
  const sf=STSF[s.id];if(!T.includes(s.f)&&!(sf&&sf[0]&&L.some(x=>x.aid===sf[0])))e.push('mất việc riêng của tình huống');
  // 2. bị đe dọa: gọi 113 luôn là việc 1
  if(has('threat')&&r.first.aid!=='c113')e.push('113 không đứng đầu');
  // 3. thứ tự hành động: cắt mạng trước liên hệ; liên hệ ngân hàng, nhà mạng trước đổi mật khẩu, rà lịch sử; trình báo trước sửa máy
  const iOff=aidx('offline'),iPw=aidx('change-pw'),iRep=idx(/trình báo/),iRepair=idx(/sửa chữa|bảo hành/);
  ['bank-otp','bank-lock','bank-money','card-lock','bank-inflow','telco','acct-lock'].forEach(a=>{const i=aidx(a);if(i>-1&&iPw>-1&&i>iPw)e.push(a+' sau đổi mật khẩu');if(i>-1&&iOff>-1&&i<iOff)e.push(a+' trước cắt mạng')});
  if(iRepair>-1&&iRep>-1&&iRepair<iRep)e.push('sửa máy trước trình báo');
  // 4. chỉ dẫn gỡ ứng dụng, làm sạch máy (kể cả trong phần giải thích) không đứng trước bước trình báo
  if(iRep>-1){const iClean=L.findIndex(x=>/làm sạch máy|gỡ ứng dụng lạ/.test(x.t+' '+dtext(x)));if(iClean>-1&&iClean<iRep)e.push('làm sạch máy trước trình báo')}
  // 5. bản gửi người thân có đủ mọi bước, có câu điều kiện về thiết bị khác, có bước trình báo
  T.forEach(t=>{if(!share.includes(t))e.push('bản gửi thiếu: '+t.slice(0,30))});
  if(L.some(x=>/thiết bị khác/.test(dtext(x)))&&!/thiết bị khác/.test(share))e.push('bản gửi thiếu điều kiện thiết bị');
  // 6. không trùng theo hành động: mỗi mã một bước; sửa máy, 156 tối đa một bước
  const aids=L.map(x=>x.aid).filter(Boolean);if(new Set(aids).size!==aids.length)e.push('trùng mã hành động');
  if(new Set(T).size!==T.length)e.push('trùng câu');
  if(T.filter(t=>/sửa chữa|bảo hành/.test(t)).length>1)e.push('hai bước sửa máy');
  if(T.filter(t=>/156/.test(t)).length>1)e.push('156 lặp');
  // 7. đã cài ứng dụng: không còn bước "không cần tắt mạng"
  if(has('app')&&T.some(t=>/CHỈ MỚI ĐỌC MÃ OTP/.test(t)))e.push('mâu thuẫn tắt mạng');
  if(has('inflow')&&!T.some(t=>/Liên hệ ngân hàng của chính bạn/.test(t)))e.push('thiếu báo ngân hàng tiền lạ');
  if((has('money')||has('goods'))&&iRep>-1&&/Nếu đã phát sinh giao dịch/.test(T[iRep]))e.push('câu trình báo có điều kiện dù đã chuyển tiền');
  if(L.some(x=>/Chặn rồi thì phần lớn/.test(x.t+dtext(x)))||/Chặn rồi thì phần lớn/.test(share))e.push('câu chưa kiểm chứng về chặn');
  if(e.length)bad.push(s.id+' ['+done.join(',')+']: '+[...new Set(e)].join('; '));
}
console.log('đã kiểm',n,'tổ hợp; lỗi',bad.length);bad.slice(0,15).forEach(x=>console.log('  '+x));
process.exitCode=bad.length?1:0;
