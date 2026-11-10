
(function(){
"use strict";
var D=window.__DATA__;
var POL=D.POL,DOCS=D.DOCS,QB=D.QB,ARTS=D.ARTS,CD=D.CD,CDSHORT=D.CDSHORT,HOI=D.HOI,
    TACTICS=D.TACTICS,LEGIT=D.LEGIT,COVER=D.COVER,RECOV=D.RECOV,BANKBOX=D.BANKBOX,COND=D.COND,PB=D.PB;
var STANDALONE=!!window.__STANDALONE__;
var VIEW=document.getElementById('view');

/* ================= hình vẽ ================= */
var ICON={
 alert:'<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.2"/><circle cx="12" cy="16.8" r=".7" fill="currentColor"/>',
 phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.4"/><path d="M10.5 18.5h3"/>',
 call:'<path d="M6.2 3.5h2.6l1.5 4-1.8 1.3a10.5 10.5 0 0 0 4.8 4.8l1.3-1.8 4 1.5v2.6a2 2 0 0 1-2.2 2A15 15 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2z"/>',
 chat:'<path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9l-4.5 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z"/>',
 shield:'<path d="M12 2.8 19.5 5.6v6.1c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V5.6z"/><path d="m8.7 12 2.3 2.3 4.3-4.6"/>',
 money:'<rect x="2.5" y="6.5" width="19" height="11" rx="1.8"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M16.5 6.5l2.5 2.5M14 9l2 2"/>',
 id:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14.5 10h4M14.5 13.5h3"/>',
 sim:'<path d="M7 2.5h7.5l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V4A1.5 1.5 0 0 1 7 2.5z"/><rect x="8.5" y="11" width="7" height="6.5" rx="1"/><path d="M12 11v6.5M8.5 14.2h7"/>',
 face:'<path d="M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16"/><path d="M9 10v.6M15 10v.6M9 15c1.7 1.4 4.3 1.4 6 0"/>',
 app:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M17 13.5v7M13.8 17.3l3.2 3.2 3.2-3.2"/>',
 lock:'<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 hush:'<path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9l-4.5 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z"/><path d="m3 3 18 18"/>',
 stop:'<path d="M8.3 2.8h7.4l5.5 5.5v7.4l-5.5 5.5H8.3l-5.5-5.5V8.3z"/><path d="M8 12h8"/>',
 chart:'<path d="M3.5 20.5h17"/><path d="m4.5 16 5-5 3.5 3 6.5-7"/><path d="M15 7h4.5v4.5"/>',
 brief:'<rect x="3" y="7" width="18" height="12.5" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18"/>',
 coins:'<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"/><path d="M9.5 16.5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4c0-1.3-2.1-2.4-4.9-2.5M9.5 16.5v-2.6"/>',
 doc:'<path d="M6 2.5h8.5l4 4V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5z"/><path d="M14 2.5V7h4.5M8 12h8M8 15.5h8M8 8.5h3"/>',
 cart:'<path d="M2.5 3.5h2.5l2.4 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 7H6"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
 mega:'<path d="M3.5 10v4a1 1 0 0 0 1 1H7l7 4.5V4.5L7 9H4.5a1 1 0 0 0-1 1z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
 book:'<path d="M12 6.5C10.3 5 7.6 4.5 3.5 4.5v14c4.1 0 6.8.5 8.5 2 1.7-1.5 4.4-2 8.5-2v-14c-4.1 0-6.8.5-8.5 2z"/><path d="M12 6.5v14"/>',
 quiz:'<rect x="4" y="3" width="16" height="18.5" rx="2"/><path d="m7.5 8.5 1.3 1.3 2.4-2.6M7.5 14.5l1.3 1.3 2.4-2.6M13.5 9h3.5M13.5 15h3.5"/>',
 pen:'<path d="M4 20.5h4L19 9.5a2.1 2.1 0 0 0-4-4L4 16.5z"/><path d="m13.5 7 3.5 3.5"/>',
 share:'<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".8" fill="currentColor"/>',
 users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17.5 14.7c2 .6 3.2 2.3 3.5 4.8"/>',
 badge:'<circle cx="12" cy="9" r="3.4"/><path d="M5 20.5c.8-3.8 3.5-5.8 7-5.8s6.2 2 7 5.8"/><path d="M7.5 6 12 3l4.5 3"/>',
 gift:'<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8C10.5 5 7 4.5 7 6.5S10 8 12 8zm0 0c1.5-3 5-3.5 5-1.5S14 8 12 8z"/>',
 plus:'<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
 fake:'<path d="M6 2.5h8.5l4 4V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5z"/><path d="m9.5 11 5 5M14.5 11l-5 5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
 home:'<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5v10.5h13V9.5"/>',
 back:'<path d="M15 5 8 12l7 7"/>',
 next:'<path d="m9 5 7 7-7 7"/>',
 print:'<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="1.5"/><path d="M7 14h10v6.5H7z"/>',
 bank:'<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>',
 inbox:'<path d="M12 3v10M8 9l4 4 4-4"/><rect x="3.5" y="15" width="17" height="5.5" rx="1.5"/>',
 question:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 4"/><circle cx="12" cy="17.2" r=".8" fill="currentColor"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.7 5.5 3.7 9s-1.2 6.5-3.7 9c-2.5-2.5-3.7-5.5-3.7-9S9.5 5.5 12 3z"/>',
 card:'<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 9.5h19M6 15h4"/>',
 trophy:'<path d="M8 4h8v5.5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1.5a3 3 0 0 0 3 3M16 6h3v1.5a3 3 0 0 1-3 3M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
 check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 menu:'<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
 volume:'<path d="M4 9.5v5h3.5l5 4v-13l-5 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
 mail:'<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
 person:'<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5c.8-4.2 3.6-6.5 7-6.5s6.2 2.3 7 6.5"/>',
 link:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
 refresh:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4.5H15"/>'
};
function ic(n,cls){return '<svg class="ic'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(ICON[n]||'')+'</svg>'}
function spot(n,tone){return '<span class="spot'+(tone?' '+tone:'')+'">'+ic(n)+'</span>'}

var ILL={
 threat:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<rect class="i-card" x="23" y="11" width="26" height="50" rx="6"/><rect class="i-scr" x="27" y="17" width="18" height="35" rx="2"/>'+
  '<path class="i-ln" d="M33 56.5h6"/>'+
  '<path class="i-x" d="M29 21.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-5 4.3v-4.3h-3a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"/>'+
  '<path class="i-on" d="M36 24.6v4.6"/><circle class="i-onf" cx="36" cy="32" r="1.4"/>'+
  '<path class="i-x" d="M59 12.5 52 22.5h5.2l-3 8.6 8.6-11.6h-5.4z"/><path class="i-x" d="M15 40l-5 7h3.8l-2 6 6.4-8.2h-4z"/></svg>',
 harm:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<rect class="i-card" x="9" y="31" width="32" height="20" rx="3"/><circle class="i-ln" cx="25" cy="41" r="5"/><path class="i-ln" d="M14 36.5v9M36 36.5v9"/>'+
  '<rect class="i-card" x="35" y="14" width="22" height="41" rx="5"/><rect class="i-scr" x="38.5" y="19" width="15" height="28" rx="1.5"/><path class="i-ln" d="M43.5 51h5"/>'+
  '<circle class="i-x" cx="55.5" cy="17" r="9"/><path class="i-on" d="M55.5 12.6v4.8"/><circle class="i-onf" cx="55.5" cy="21" r="1.4"/></svg>',
 check:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<path class="i-card" d="M19 11h21l10 10v34a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z"/>'+
  '<path class="i-ln" d="M40 11v10h10M22 28h14M22 34h20M22 40h10"/>'+
  '<circle class="i-xs" cx="45" cy="46" r="9"/><path class="i-xl" d="m51.5 52.5 6.5 6.5"/><path class="i-ac" d="M45 41.5a4.5 4.5 0 0 1 4.5 4.5h-4.5z"/></svg>',
 p1:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<rect class="i-card" x="11" y="16" width="50" height="38" rx="5"/><path class="i-ln" d="M11 24.5h50"/>'+
  '<circle class="i-ac" cx="16.5" cy="20.3" r="1.6"/><circle class="i-ac" cx="21.5" cy="20.3" r="1.6"/>'+
  '<path class="i-x" d="M36 28.5l9.5 3.6v6.6c0 5.3-4 9.1-9.5 10.6-5.5-1.5-9.5-5.3-9.5-10.6v-6.6z"/><path class="i-on" d="m31.8 38.6 3.1 3.1 5.6-6.2"/></svg>',
 p2:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<rect class="i-card" x="15" y="10" width="26" height="48" rx="6"/><rect class="i-scr" x="19" y="16" width="18" height="33" rx="2"/><path class="i-ln" d="M25 53.5h6"/>'+
  '<path class="i-x" d="M44 30h11l7.5 7.5v11L55 56H44l-7.5-7.5v-11z"/><path class="i-on" d="M43.5 43h12"/></svg>',
 p3:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<path class="i-card" d="M12 22h28a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H24l-7 5.5V45h-5a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4z"/><path class="i-ln" d="M15 30h20M15 37h13"/>'+
  '<path class="i-xl" d="M56 7v33a7.5 7.5 0 0 1-15 0v-2.5"/><path class="i-xl" d="m41 37.5 3.6 3.2"/><circle class="i-x" cx="56" cy="8" r="3"/></svg>',
 p4:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<rect class="i-card" x="13" y="10" width="34" height="48" rx="4"/>'+
  '<rect class="i-ln" x="18.5" y="18" width="7" height="7" rx="1.5"/><rect class="i-ln" x="18.5" y="30" width="7" height="7" rx="1.5"/><rect class="i-ln" x="18.5" y="42" width="7" height="7" rx="1.5"/>'+
  '<path class="i-ln" d="M30 21.5h12M30 33.5h12M30 45.5h7"/><path class="i-xl" style="stroke-width:2.6" d="m19.5 21.3 2.2 2.2 4.6-5"/>'+
  '<circle class="i-x" cx="51" cy="49" r="11"/><path class="i-onf" d="M51 42.6l1.9 4 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z"/></svg>',
 p5:'<svg class="ill" viewBox="0 0 72 72" aria-hidden="true"><circle class="i-bg" cx="36" cy="36" r="35"/>'+
  '<path class="i-card" d="M11 14h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H23l-7 5.5V36h-5a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z"/><path class="i-ln" d="M14 22h20M14 28.5h13"/>'+
  '<path class="i-x" d="M33 32h27a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4h-4v6l-7-6H33a4 4 0 0 1-4-4V36a4 4 0 0 1 4-4z"/>'+
  '<path class="i-on" d="M42.8 38.6a3.7 3.7 0 1 1 5.3 3.3c-1.1.5-1.6 1.2-1.6 2.4"/><circle class="i-onf" cx="46.5" cy="48.4" r="1.6"/></svg>'
};

/* ================= tiện ích ================= */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d')}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function cap1(s){s=String(s);return s.charAt(0)+s.slice(1).toLowerCase()}
function P(p){return p?'<p>'+esc(p)+'</p>':''}
function pageh(h,lead,eyebrow,icon,tone){
  return '<header class="pageh">'+(eyebrow?'<p class="eyebrow">'+esc(eyebrow)+'</p>':'')+
    (icon?'<div style="display:flex;gap:12px;align-items:center">'+spot(icon,tone)+'<h1 tabindex="-1">'+esc(h)+'</h1></div>':'<h1 tabindex="-1">'+esc(h)+'</h1>')+
    (lead?'<p class="lead">'+lead+'</p>':'')+'</header>';
}
function backrow(to,label,printable){
  return '<div class="backrow"><button type="button" class="btn ghost sm" data-go="'+to+'">'+ic('back')+esc(label||'Quay lại')+'</button>'+
    (printable&&STANDALONE?'<button type="button" class="btn ghost sm" data-print>'+ic('print')+'In ra giấy</button>':'')+'</div>';
}
/* Dấu rà soát cho nội dung khẩn cấp. Ngày ghi dạng dd/mm/yyyy; quá 90 ngày kể từ lần rà soát gần nhất thì trang tự hiện nhãn nhắc.
   MỖI LẦN RÀ SOÁT LẠI NỘI DUNG, SỬA BA NGÀY DƯỚI ĐÂY. */
var REVIEW={
  pb:{rev:'10/11/2026',next:'08/02/2027'},
  nums:{rev:'10/11/2026'}
};
function fillv(v){return esc(v)}
var API=STANDALONE&&typeof window.ATTC_API==='string'?window.ATTC_API.replace(/\/$/,''):'';
var MAIL=STANDALONE&&typeof window.ATTC_MAIL==='string'&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(window.ATTC_MAIL)?window.ATTC_MAIL:'';
function canSend(kind){return !!API||(kind!=='registrations'&&!!MAIL)}
function NOCHANNEL(what){return '<div class="note b"><b>'+what+' sẽ được công bố tại trang này</b><p>Hiện website chưa mở nơi nhận trực tuyến. Khi mở, cách gửi sẽ được ghi tại đây. Đang gặp chuyện gấp thì đừng chờ: xem việc cần làm ngay ở mục KHẨN CẤP.</p><div class="btnrow"><button type="button" class="btn red sm" data-urgent>Xem việc cần làm ngay</button></div></div>'}
function MAILMSG(){return 'Ứng dụng thư trên máy bạn đang mở với nội dung đã soạn sẵn. Bấm Gửi trong ứng dụng thư để hoàn tất. Nếu ứng dụng thư không mở, hãy tự gửi thư tới '+esc(MAIL)+'.'}
var MAILNOTE='Nội dung được gửi bằng ứng dụng thư trên máy bạn, nên Ban biên tập sẽ thấy địa chỉ thư của bạn. Địa chỉ đó chỉ dùng để trả lời khi cần và được xóa sau khi trả lời xong.';
function parseVN(d){var m=String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?new Date(+m[3],m[2]-1,+m[1]):null}
function overdue(d){var t=parseVN(d);return t?(Date.now()-t.getTime())>90*864e5:false}
function revline(label,rev,extra){
  return '<p class="revmeta">'+ic('check')+'<span>'+label+': '+fillv(rev)+(extra||'')+'</span></p>'+
    (overdue(rev)?'<p class="stale">Đã quá 90 ngày chưa rà soát lại. Vẫn làm theo các bước an toàn, và tự tìm số ở mặt sau thẻ hoặc trong ứng dụng của bạn.</p>':'');
}
var PRINTFOOT='<p class="printfoot">Bản in từ antoantaichinh.vn — Nhận diện lừa đảo và rủi ro tài chính · Biết cách tự bảo vệ. Đây không phải website của cơ quan nhà nước và không tiếp nhận tố giác, tin báo về tội phạm. Nội dung có thể đã được cập nhật sau ngày in, hãy mở lại địa chỉ trên để xem bản mới nhất.</p>';
var NOTPOLICE='Website không trực 24/7. Khi đang xảy ra sự việc, hãy gọi ngay tổng đài ngân hàng của bạn và cơ quan Công an nơi cư trú.';

/* ================= trang đầu: khi gặp chuyện ================= */
var DOORDEF={
 1:{ill:'threat',t:'Có người đang đe dọa, ép buộc tôi',s:'Dọa đòi tiền, dọa tung hình ảnh hoặc thông tin, bắt tôi im lặng.'},
 2:{ill:'harm',t:'Tiền, hàng, điện thoại, tài khoản hoặc giấy tờ của tôi đã có chuyện',s:'Đã đưa đi, đã mất, hoặc bị người khác dùng.'},
 3:{ill:'check',h:1,t:'Chưa có chuyện gì, nhưng tôi đang được yêu cầu, được mời, hoặc sắp làm một việc',s:'Còn kịp. Kiểm tra trước khi đưa bất cứ thứ gì.'}
};
var DOORS={
 2:{lead:'Chọn dòng gần đúng nhất với điều bạn nhìn thấy. Không cần biết vì sao nó xảy ra.',opts:[
   ['money','Tôi đã chuyển tiền, đã đưa tiền, hoặc tôi là người bán và đã giao hàng đi',2],
   ['key','Tôi đã đọc mã OTP, đưa mật khẩu, cài ứng dụng theo lời người khác, hoặc thấy người lạ đăng nhập vào tài khoản của tôi',3],
   ['sim','Điện thoại hoặc SIM của tôi bị mất, bị chiếm',3],
   ['id','Giấy tờ, khuôn mặt, chữ ký hoặc tên tôi đã được gửi đi, hoặc bị người khác dùng mà tôi không hề làm',6],
   ['doc','Tôi đã chuyển, góp vốn hoặc đặt cọc nhưng không lấy lại được tiền, không lấy được hàng, hoặc hợp đồng đã ký phát sinh khoản phải trả tôi chưa hiểu',5],
   ['inbox','Tự nhiên có tiền lạ chuyển vào tài khoản của tôi',9]]},
 3:{lead:'Còn kịp. Chọn dòng gần đúng nhất.',opts:[
   ['clock','Có người đang thúc tôi làm ngay',1],
   ['chart','Có người mời tôi góp vốn, đầu tư, làm ăn, hoặc mời việc làm',4],
   ['search','Không ai thúc, không ai mời. Tôi sắp chuyển tiền, giao hàng, đưa thông tin hoặc ký giấy, và muốn kiểm tra trước',7],
   ['quiz','Tôi nhận được cuộc gọi, tin nhắn hoặc lời mời đáng ngờ và muốn tự kiểm tra','khan-cap.kiem-tra']]}
};
function doorBtn(n){
  var d=DOORDEF[n];
  return '<button type="button" class="door'+(d.h?' h':'')+'" data-door="'+n+'"'+(n===1?'':' aria-expanded="false" aria-controls="subpanel"')+'>'+
    ILL[d.ill]+'<span class="dt"><b>'+esc(d.t)+'</b><small>'+esc(d.s)+'</small></span>'+ic('next','go')+'</button>';
}
function num(nn,isText,tags,desc,acts){
  return '<div class="num"><span class="nn'+(isText?' t':'')+'">'+esc(nn)+'</span><span class="tags">'+
    tags.map(function(t){return '<span class="tag'+(t==='GỌI'?'':' msg')+'">'+t+'</span>'}).join('')+'</span><p>'+desc+'</p>'+
    (acts.length?'<span class="acts">'+acts.map(function(a){return '<a href="'+a[0]+'">'+esc(a[1])+'</a>'}).join('')+'</span>':'')+'</div>';
}
var SIGNS=[
 ['key','Bảo bạn <b>đọc</b> hoặc <b>gửi</b> mật khẩu, mã OTP, mã PIN, hoặc cho người khác nhìn, điều khiển màn hình.'],
 ['app','Người khác gửi đường dẫn và bảo bạn cài ứng dụng.'],
 ['lock','Bắt nộp thêm <b>phí</b> để lấy được tiền hoặc hàng <b>đang bị giữ</b>: phí rút tiền, phí mở khóa, tiền xác minh, tiền bảo lãnh.'],
 ['face','Người khác bảo bạn quét khuôn mặt hoặc gửi ảnh giấy tờ.<small>Bạn tự mở ứng dụng của mình cho việc do chính bạn bắt đầu thì bình thường.</small>'],
 ['hush','Bắt bạn quyết định ngay, giữ bí mật, hoặc không cho hỏi người thân.'],
 ['call','Cản bạn tự gọi lại số chính thức hoặc tự mở website chính thức.']
];
var LVORDER=['7','6','5','3','4','2'];
var LVICON={7:'call',6:'cart',5:'brief',3:'chart',4:'coins',2:'doc'};
function lvName(k){return String(CD[k]||'').split(' — ')[1]||CDSHORT[k]}
function lvTiles(){
  return '<div class="tiles">'+LVORDER.map(function(k){
    var n=TACTICS.filter(function(x){return String(x.cd)===k}).length;
    return '<button type="button" class="tile" data-go="lv'+k+'">'+spot(LVICON[k])+'<b>'+esc(CDSHORT[k])+'</b><small>'+n+' thủ đoạn</small></button>';
  }).join('')+'</div>';
}
function openDoor(btn){
  var n=+btn.dataset.door;
  if(n===1){go('pb8');return}
  var panel=document.getElementById('subpanel'), open=btn.getAttribute('aria-expanded')==='true';
  VIEW.querySelectorAll('.door[aria-expanded]').forEach(function(b){b.setAttribute('aria-expanded','false')});
  if(open){panel.hidden=true;panel.innerHTML='';return}
  btn.setAttribute('aria-expanded','true');
  var d=DOORS[n];
  panel.className='sub'+(DOORDEF[n].h?' h':'');
  panel.innerHTML='<p>'+esc(d.lead)+'</p><div class="opts">'+d.opts.map(function(o){
    return '<button type="button" class="opt" data-go="'+(typeof o[2]==='string'?o[2]:'pb'+o[2])+'">'+ic(o[0])+'<span>'+esc(o[1])+'</span>'+ic('next')+'</button>';
  }).join('')+'</div>';
  panel.hidden=false;
  try{panel.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){panel.scrollIntoView()}
  var f=panel.querySelector('.opt'); if(f)try{f.focus({preventScroll:true})}catch(e){}
}

/* ================= quy trình việc cần làm ================= */
var PBICON={0:'question',1:'clock',2:'money',3:'key',4:'chart',5:'doc',6:'id',7:'search',8:'alert',9:'inbox'};
function note(cls,h,b){return '<div class="note '+cls+'"><b>'+esc(h)+'</b><p>'+esc(b)+'</p></div>'}
function vPB(id){
  var d=PB[id]; if(!d)return vKhancap();
  var n=0,out='',open=false;
  function openL(){if(!open){out+='<ol class="steps">';open=true}}
  function closeL(){if(open){out+='</ol>';open=false}}
  d.blocks.forEach(function(b){
    if(b.legit){closeL();out+=note('g',LEGIT.h,LEGIT.b);return}
    if(b.cover){closeL();out+=note('b',COVER.h,COVER.b);return}
    if(b.recov){closeL();out+=note('r',RECOV.h,RECOV.b);return}
    if(b.branch){closeL();out+='<div class="branch"><b>'+esc(b.q)+'</b><button type="button" class="btn" data-go="pb'+b.branch+'">'+esc(b.btn)+ic('next')+'</button><small>'+esc(b.sm)+'</small></div>';return}
    if(b.cond){closeL();out+='<div class="cond"><b>'+esc(COND.h)+'</b><ul>'+COND.items.map(function(i){return '<li>'+esc(i)+'</li>'}).join('')+'</ul></div>';return}
    openL();n++;
    var inner='<b>'+esc(b.s)+'</b>';
    if(b.bank)inner+='<div class="bankbox"><b>'+esc(BANKBOX.h)+'</b>'+BANKBOX.rows.map(function(r){return '<p>'+r+'</p>'}).join('')+'</div>';
    if(b.say)inner+='<div class="say"><span class="eyebrow">Nói với tổng đài</span><q class="sayq">'+esc(b.say)+'</q></div>';
    if(b.d)inner+='<div class="det">'+b.d.map(P).join('')+'</div>';
    if(b.a)inner+='<div class="acts2">'+b.a.map(function(a,i){return '<a class="'+(i?'alt':'')+'" href="'+a[0]+'">'+esc(a[1])+'</a>'}).join('')+'</div>';
    if(!d.nop)inner+='<label class="tick"><input type="checkbox" data-tick="'+id+'-'+n+'"> Đã làm xong việc này</label>';
    out+='<li class="step"><span class="sn">'+n+'</span><div class="sb">'+inner+'</div></li>';
  });
  closeL();
  var tone=(id==8||id==2||id==3||id==6||id==9||id==5)?'s':(id==0?'':'h');
  var h=crumbs([['khan-cap','KHẨN CẤP'],[null,d.title]])+pageh(d.title,esc(d.lead),'KHẨN CẤP · Việc cần làm ngay',PBICON[id],tone)+tools(true)+out+
    (d.nop?'':'<div class="progress"><span>Đánh dấu chỉ lưu trên máy của bạn, không gửi đi đâu.</span><button type="button" data-act="clrticks">Xóa đánh dấu</button></div>')+
    revline('Rà soát gần nhất',REVIEW.pb.rev,' · Rà soát lại trước: '+fillv(REVIEW.pb.next))+
    '<p class="pbfoot">Các bước trên là việc nên làm ngay để giảm thiệt hại, chưa phải kết luận về vụ việc. '+NOTPOLICE+'</p>'+PRINTFOOT;
  return {html:h,nav:'khan-cap'};
}

/* ================= thủ đoạn ================= */
var FOUR=[['money','Tiền hoặc hàng','của bạn'],['key','Quyền vào tài khoản','điện thoại của bạn'],['id','Danh tính','giấy tờ, chữ ký, tên bạn đứng ra'],['users','Bạn làm trung gian','nhận, chuyển tiền hộ, nhận hàng hộ, đứng tên hộ, rủ thêm người']];
var WAYS=[
 ['badge','Đóng vai người có quyền','Công an, tòa án, ngân hàng, cơ quan nhà nước, nhân viên của một đơn vị, cấp trên.'],
 ['users','Đóng vai người quen','Chiếm tài khoản của người thân, giả con cháu, hoặc làm quen lâu ngày để tạo tin cậy.'],
 ['gift','Hứa cho bạn được nhiều hơn','Lãi cao, hoa hồng, trúng thưởng, việc nhẹ lương cao, vay dễ, tiền công.'],
 ['plus','Cho bạn nếm thử thật','Trả hoa hồng đơn đầu, cho rút thử một lần, cho lãi vài kỳ đầu. Đến khi bạn tin và bỏ số tiền lớn thì mất.'],
 ['alert','Dọa bạn sắp mất','Dính án, bị phạt, bị khóa tài khoản, mất hàng, mất việc.'],
 ['lock','Giữ tiền hoặc hàng rồi đòi phí để thả ra','Phí rút, phí mở khóa, tiền xác minh, tiền bảo lãnh.'],
 ['fake','Đưa bằng chứng giả','Biên lai giả, giấy tờ giả, website giả, ứng dụng giả.']
];
var ARTORDER=['1','2','3-1','3-2','3-3','4','5','6','7','8'];
var ARTNO={'1':'1','2':'2','3-1':'3·1','3-2':'3·2','3-3':'3·3','4':'4','5':'5','6':'6','7':'7','8':'8'};
function docList(){
  return '<ol class="cdlist two">'+Object.keys(DOCS).sort().map(function(k){
    var m=String(DOCS[k].meta).match(/khoảng (\d+) phút/);
    return '<li><button type="button" data-go="doc'+k+'"><span class="cn">'+k+'</span><span class="ct">'+esc(DOCS[k].t)+'<small>'+(QB[k]?QB[k].q.length+' câu':'')+(m?' · đọc khoảng '+m[1]+' phút':'')+'</small></span>'+ic('next','go')+'</button></li>';
  }).join('')+'</ol>';
}
function artList(){
  return '<ol class="cdlist two">'+ARTORDER.map(function(k){
    return '<li><button type="button" data-go="art'+k+'"><span class="cn s">'+ARTNO[k]+'</span><span class="ct">'+esc(ARTS[k].t)+'</span>'+ic('next','go')+'</button></li>';
  }).join('')+'</ol>';
}
function peek(id,title,sub,body){
  return '<div class="peek"><button type="button" class="peekbtn" data-open="'+id+'" aria-expanded="false" aria-controls="'+id+'"><span><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span>'+ic('next')+'</button>'+
    '<div class="peekbody" id="'+id+'" hidden>'+body+'</div></div>';
}
var SAMPLE=['CĐ1-013','CĐ2-022','CĐ3-040','CĐ4-007','CĐ5-044','CĐ6-005','TN-44','CĐ8-027'].map(function(code){
  for(var k in QB){var q=QB[k].q.filter(function(x){return x.code===code})[0];if(q)return {cd:k,q:q}}return null;
}).filter(Boolean);
function sampleIdx(cd){for(var i=0;i<SAMPLE.length;i++)if(SAMPLE[i].cd===String(cd))return i;return 0}
var THU={ans:{}};
function qzHTML(q,mode,label,idx){
  return '<div class="qz" data-mode="'+mode+'" data-i="'+idx+'"><p class="qzcd">'+esc(label)+'</p>'+
    (q.sit?'<div class="qzsit"><b>Tình huống</b>'+esc(q.sit)+'</div>':'')+
    '<p class="qzq">'+esc(q.q)+'</p><div class="qzopts">'+q.opt.map(function(o){
      return '<button type="button" class="qzo" data-k="'+o[0]+'"><span class="qzl">'+o[0]+'</span><span>'+esc(o[1])+'</span></button>'}).join('')+
    '</div><div class="qzres" hidden></div></div>';
}
function showResult(wrap,q,k){
  wrap.classList.add('done');
  wrap.querySelectorAll('.qzo').forEach(function(o){o.disabled=true;if(o.dataset.k===q.ans)o.classList.add('right');else if(o.dataset.k===k)o.classList.add('wrong')});
  var r=wrap.querySelector('.qzres');
  r.innerHTML='<p class="qzhead">'+(k===q.ans?'<b class="ok">Đúng.</b>':'<b class="no">Chưa đúng.</b>')+' Đáp án phù hợp là <b>'+esc(q.ans)+'</b>.</p>'+
    '<div class="qzexp">'+q.opt.map(function(o){var x=q.exp[o[0]];return x?'<p'+(o[0]===q.ans?' class="isans"':'')+'><b>'+o[0]+'.</b> '+esc(x)+'</p>':''}).join('')+'</div>'+
    (q.safe?'<div class="qzsafe"><b>Hành động an toàn</b>'+esc(q.safe)+'</div>':'');
  r.hidden=false;
  return r;
}
function vThu(i){
  i=Math.max(0,Math.min(SAMPLE.length-1,+i||0));
  var s=SAMPLE[i], last=i===SAMPLE.length-1;
  var h=crumbs([['cong-cu-kiem-tra','CÔNG CỤ KIỂM TRA'],[null,'Thử sức: 8 câu']])+pageh('Thử sức: 8 câu','Mỗi chuyên đề một câu. Chọn xong là hiện giải thích. Chọn sai cũng không sao, phần giải thích mới là chỗ để học.','Kiểm tra kiến thức')+
   '<div class="dots" role="group" aria-label="Chọn câu">'+SAMPLE.map(function(x,j){return '<button type="button" data-go="thu'+j+'" aria-current="'+(j===i)+'" class="'+(THU.ans[j]?'done':'')+'" aria-label="Câu '+(j+1)+'">'+(j+1)+'</button>'}).join('')+'</div>'+
   qzHTML(s.q,'thu','Câu '+(i+1)+' / '+SAMPLE.length+' · Chuyên đề '+s.cd+' · '+(CDSHORT[s.cd]||'Nền tảng và cách quyết định'),i)+
   '<div class="btnrow">'+(i>0?'<button type="button" class="btn ghost" data-go="thu'+(i-1)+'">'+ic('back')+'Câu trước</button>':'')+
   (last?'<button type="button" class="btn pri" data-go="thi">Tự luyện đầy đủ '+bankCounts()+' câu'+ic('next')+'</button>':'<button type="button" class="btn pri" data-go="thu'+(i+1)+'">Câu tiếp'+ic('next')+'</button>')+'</div>'+
   '<button type="button" class="more" data-go="doc'+s.cd+'">Đọc bài Chuyên đề '+s.cd+ic('next')+'</button>';
  return {html:h,nav:'cong-cu-kiem-tra',after:function(){
    if(THU.ans[i]){var w=VIEW.querySelector('.qz');showResult(w,s.q,THU.ans[i])}
  }};
}

/* ================= cuộc thi, ngân hàng câu hỏi ================= */
var MAXTRY=2;
function normPhone(v){return String(v||'').replace(/[^0-9]/g,'')}
function tries(ph){return +(store('rg_'+ph)||0)}
function regDone(){return store('rg_cur')||''}
function cd1Done(){return store('qz_done_1')==='1'}
function vDangky(){
  if(!regOpen())return vHoatdong();
  var h=backrow('hoat-dong','Cuộc thi')+pageh('Cuộc thi trực tuyến','Phần chung gồm tám chuyên đề, '+bankCounts()+' câu; phần dành cho nhân viên doanh nghiệp gồm '+dnCounts()+' câu tình huống. Đăng ký xong là vào thi ngay. Ở phần chung, làm Chuyên đề 1 trước, sau đó làm chuyên đề nào trước cũng được.','Hoạt động','trophy','h')+
   '<div class="box facts"><p><b>Thời gian diễn ra:</b> '+esc(ACTIVITY.time||TBA)+'</p><p><b>Ai được dự thi:</b> Mọi lứa tuổi, chỉ cần có số điện thoại để liên hệ. Mỗi số điện thoại thi tối đa 02 lượt. Người dưới 16 tuổi dự thi bằng số điện thoại của cha, mẹ hoặc người giám hộ và phải được người đó đồng ý.</p><p><b>Thể lệ và giải thưởng:</b> '+esc(ACTIVITY.rules||TBA)+'</p></div>'+
   '<section class="sec"><h2>Đăng ký dự thi</h2><form class="box form" data-form="reg" novalidate>'+
   '<div class="hp" aria-hidden="true"><label>Để trống ô này<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>'+
   '<div class="f2"><label for="rgname">Họ và tên<input type="text" id="rgname" placeholder="Dùng để xác minh khi trao giải" autocomplete="name"></label>'+
   '<label for="rgphone">Số điện thoại<input type="tel" id="rgphone" inputmode="numeric" placeholder="Số bạn đang dùng" autocomplete="tel"></label>'+
   '<label for="rgorg">Trường, lớp hoặc đơn vị <em>(không bắt buộc)</em><input type="text" id="rgorg"></label></div>'+
   '<div class="note b"><b>Số điện thoại là mã dự thi của bạn</b><ul class="plain"><li>Ban Tổ chức phân biệt thí sinh bằng số điện thoại, không bằng họ tên.</li><li>Mỗi số thi tối đa 02 lượt. Lượt sau không xóa lượt trước; Ban Tổ chức lấy kết quả cao hơn.</li><li>Dùng đúng số bạn đang cầm máy. Ban Tổ chức không đổi số sau khi đã nộp bài.</li></ul></div>'+
   '<div class="allin"><b>Những điều bạn đang đồng ý, đọc một lượt</b><ul>'+
   '<li><b>Ai giữ thông tin.</b> Ban Tổ chức cuộc thi của antoantaichinh.vn.</li>'+
   '<li><b>Dùng vào việc gì.</b> Chỉ để ghi nhận thí sinh, đếm số lượt thi của mỗi số điện thoại, chấm bài, xếp hạng và liên hệ trao giải. Không quảng cáo, không phân tích hành vi, không chuyển cho bên thứ ba ngoài việc trao giải.</li>'+
   '<li><b>Lấy những gì.</b> Họ tên, số điện thoại, đơn vị nếu bạn muốn ghi, cùng bài làm và kết quả. Không hỏi ngày sinh, không lấy số căn cước, vị trí hay danh bạ.</li>'+
   '<li><b>Giữ trong bao lâu.</b> Chỉ trong thời gian diễn ra cuộc thi và xét, trao giải. Xóa sau khi trao giải xong, trừ giấy tờ trao giải phải giữ theo quy định về kế toán, thuế.</li>'+
   '<li><b>Tên bạn có bị đăng lên không.</b> Mặc định là không. Nếu bạn đạt giải, Ban Tổ chức hỏi riêng; bạn từ chối vẫn nhận giải bình thường.</li>'+
   '<li><b>Thuế.</b> Giải thưởng thực hiện nghĩa vụ thuế thu nhập cá nhân theo quy định hiện hành; chi tiết ghi trong Thể lệ.</li>'+
   '<li><b>Quyền của bạn.</b> Rút lại đồng ý, xem, sửa, xóa thông tin của mình bất kỳ lúc nào bằng cách gửi yêu cầu qua mục Góp ý. Rút lại đồng ý khi cuộc thi đang diễn ra thì bài làm bị hủy và dữ liệu bị xóa.</li></ul></div>'+
   '<label class="check one" for="rgok"><input type="checkbox" id="rgok"><span><b>Tôi đã đọc và đồng ý</b> với Thể lệ cuộc thi và với việc dùng thông tin nêu trên.</span></label>'+
   '<p class="err" id="rgerr" hidden></p><div class="btnrow"><button type="submit" class="btn pri">Đăng ký và bắt đầu làm bài'+ic('next')+'</button></div>'+
   '</form></section>'+
   '<button type="button" class="more" data-go="thi">Chỉ muốn luyện tập, không dự thi: vào ngân hàng câu hỏi'+ic('next')+'</button>';
  return {html:h,nav:'hoat-dong'};
}
var BST={cd:'0',i:0,right:0,done:[],tmr:null};
/* QB có hai nhóm khóa: '1'…'8' là tám chuyên đề chung; 'dn1'…'dn3' là phần dành cho nhân viên doanh nghiệp (src/dn_bank.js). */
function QK(){return Object.keys(QB).filter(function(k){return /^\d+$/.test(k)}).sort()}
function DK(){return Object.keys(QB).filter(function(k){return /^dn\d+$/.test(k)}).sort()}
function isDN(cd){return /^dn/.test(String(cd))}
function bankName(cd){return isDN(cd)?QB[cd].sh:'Chuyên đề '+cd}
function bankCounts(){return QK().reduce(function(a,k){return a+QB[k].q.length},0)}
function dnCounts(){return DK().reduce(function(a,k){return a+QB[k].q.length},0)}
function bankMenu(){
  var ph=regOpen()?regDone():'',gate=!cd1Done();
  var o=pageh('Phần thi trắc nghiệm','Tám chuyên đề, tổng cộng '+bankCounts()+' câu. <b>Làm Chuyên đề 1 trước</b>, vì cách quyết định học ở đó được dùng lại ở cả bảy chuyên đề sau. Mỗi câu hiện phần giải thích sau khi bạn chọn.','Kiểm tra kiến thức');
  if(ph)o+='<div class="rgbar"><b>Đã đăng ký.</b> Mã dự thi của bạn là số '+esc(ph)+'. Đây là lượt thứ '+tries(ph)+' trên '+MAXTRY+'.</div>';
  o+='<ol class="cdlist">'+QK().map(function(k){
    var b=QB[k],name=esc(b.t.replace(/^CHUYÊN ĐỀ\s*\d+\s*[-–—]\s*/i,'')),done=store('qz_done_'+k)==='1',lock=gate&&k!=='1';
    if(lock)return '<li><span class="lock"><span class="cn">'+k+'</span><span class="ct">'+name+'<small>'+b.q.length+' câu · mở sau khi xong Chuyên đề 1</small></span>'+ic('lock')+'</span></li>';
    return '<li><button type="button" data-go="thi'+k+'"><span class="cn'+(done?' ok':'')+'">'+(done?'✓':k)+'</span><span class="ct">'+name+'<small>'+b.q.length+' câu'+(done?' · đã làm xong':(k==='1'&&gate?' · làm chuyên đề này trước':''))+'</small></span>'+ic('next','go')+'</button></li>';
  }).join('')+'</ol>';
  if(gate)o+='<div class="gate"><b>Bảy chuyên đề còn lại mở ngay khi bạn làm xong Chuyên đề 1.</b>Chuyên đề 1 có '+QB['1'].q.length+' câu. Sau đó thứ tự do bạn chọn.</div>';
  if(DK().length)o+='<section class="sec" id="thi-dn" aria-labelledby="h-dn"><h2 id="h-dn">Dành cho nhân viên doanh nghiệp</h2>'+
    '<p class="small">'+dnCounts()+' câu tình huống về phòng ngừa lừa đảo và rủi ro trong giao dịch, hợp đồng kinh tế của doanh nghiệp. Dành cho người làm kế toán, ngân quỹ, mua hàng, bán hàng, pháp chế và quản lý. Không cần làm Chuyên đề 1 trước.</p>'+
    '<ol class="cdlist">'+DK().map(function(k,i){var b=QB[k],done=store('qz_done_'+k)==='1';
      return '<li><button type="button" data-go="thi'+k+'"><span class="cn'+(done?' ok':'')+'">'+(done?'✓':'ABC'.charAt(i))+'</span><span class="ct">'+esc(b.sh)+'<small>'+esc(b.sub)+(done?' · đã làm xong':'')+'</small></span>'+ic('next','go')+'</button></li>'}).join('')+'</ol></section>';
  o+='<p class="pbfoot">'+NOTPOLICE+'</p>';
  return o;
}
function bankIntro(cd){
  var b=QB[cd],dn=isDN(cd);
  var o=pageh(dn?b.t:b.t.replace(/^CHUYÊN ĐỀ \d+\s*-\s*/,''),null,dn?'Ngân hàng câu hỏi · Nhân viên doanh nghiệp':'Ngân hàng câu hỏi · Chuyên đề '+cd);
  o+='<div class="box" style="display:grid;gap:10px">'+b.intro.map(P).join('')+'</div>';
  if(b.terms&&b.terms.length)o+=peek('pk-terms','Hiểu nhanh mấy từ',b.terms.length+' từ dùng trong chuyên đề này','<dl class="terms">'+b.terms.map(function(t){return '<dt>'+esc(t[0])+'</dt><dd>'+esc(t[1])+'</dd>'}).join('')+'</dl>');
  o+='<div class="btnrow"><button type="button" class="btn pri" data-bstart="'+cd+'">Bắt đầu '+b.q.length+' câu'+ic('next')+'</button>'+(dn?'<button type="button" class="btn ghost" data-go="thidn">Chọn phần khác</button>':'<button type="button" class="btn ghost" data-go="doc'+cd+'">Đọc bài trước đã</button><button type="button" class="btn ghost" data-go="thi">Chọn chuyên đề khác</button>')+'</div>';
  return o;
}
function fmtSec(s){var m=Math.floor(s/60),r=s%60;return m?m+' phút '+(r<10?'0':'')+r+' giây':r+' giây'}
function bankQ(){
  var b=QB[BST.cd],q=b.q[BST.i],n=b.q.length,bb=document.getElementById('bankbody');
  bb.innerHTML='<div class="bankbar"><button type="button" class="btn ghost sm" data-go="thi'+BST.cd+'">'+ic('back')+esc(bankName(BST.cd))+'</button><span class="bpos">Câu '+(BST.i+1)+' / '+n+'</span></div>'+
    '<div class="bprog"><i style="width:'+Math.round(BST.i/n*100)+'%"></i></div>'+qzHTML(q,'bank',isDN(BST.cd)?q.kind:'Mã '+q.code+' · '+q.kind,BST.i);
  jump0();
}
function answerBank(wrap,btn){
  if(wrap.classList.contains('done'))return;
  var b=QB[BST.cd],q=b.q[BST.i],k=btn.dataset.k,last=BST.i>=b.q.length-1;
  if(k===q.ans&&BST.done.indexOf(BST.i)<0)BST.right++;
  BST.done.push(BST.i);
  var r=showResult(wrap,q,k);
  r.insertAdjacentHTML('beforeend','<div class="btnrow"><button type="button" class="btn pri" id="bnext" data-act="bnext" disabled>'+(last?'Đã hiểu, xem kết quả':'Đã hiểu, sang câu tiếp theo')+'</button></div><p class="qzwait" id="bwait"></p>');
  var nb=document.getElementById('bnext'),w=document.getElementById('bwait'),left=q.sec||30;
  if(BST.tmr)clearInterval(BST.tmr);
  function paint(){if(left>0){w.textContent='Còn '+fmtSec(left)+' đọc phần giải thích. Nút mở khi hết thời gian.'}else{w.textContent='Đã đủ thời gian đọc. Bạn có thể đi tiếp.';nb.disabled=false;clearInterval(BST.tmr);BST.tmr=null}}
  paint();BST.tmr=setInterval(function(){left--;paint()},1000);
  nb.dataset.last=last?'1':'';
  try{nb.scrollIntoView({block:'nearest'})}catch(e){}
}
function bankNext(btn){
  if(btn.disabled)return;
  if(BST.tmr){clearInterval(BST.tmr);BST.tmr=null}
  if(btn.dataset.last)bankDone();else{BST.i++;bankQ()}
}
function bankDone(){
  var b=QB[BST.cd],n=b.q.length,r=BST.right,dn=isDN(BST.cd);
  store('qz_done_'+BST.cd,'1');
  var rest=(dn?DK():QK()).filter(function(k){return store('qz_done_'+k)!=='1'});
  document.getElementById('bankbody').innerHTML=pageh('Bạn trả lời đúng '+r+' trên '+n+' câu','Kết quả này chỉ hiện trên máy của bạn. Câu nào chưa đúng thì đọc lại phần giải thích là đủ.',bankName(BST.cd)+' · đã làm xong','check')+
    (BST.cd==='1'?'<div class="gate open"><b>Bảy chuyên đề còn lại đã mở.</b>Làm chuyên đề nào gần với việc mình đang gặp thì nhớ lâu hơn.</div>':'')+
    '<div class="btnrow"><button type="button" class="btn pri" data-go="'+(dn?'thidn':'thi')+'">'+(dn?(rest.length?'Chọn phần tiếp theo, còn '+rest.length:'Đã làm hết ba phần, xem lại danh sách'):(rest.length?'Chọn chuyên đề tiếp theo, còn '+rest.length:'Đã làm hết 8 chuyên đề, xem lại danh sách'))+'</button>'+
    '<button type="button" class="btn ghost" data-go="thi'+BST.cd+'">Làm lại '+(dn?'phần này':'chuyên đề '+BST.cd)+'</button>'+(dn?'':'<button type="button" class="btn ghost" data-go="doc'+BST.cd+'">Đọc lại bài</button>')+'</div>'+
    '<p class="pbfoot">Làm hết câu hỏi không có nghĩa là an toàn. Gặp việc thật, vẫn phải chậm lại và tự kiểm tra bằng kênh do chính mình tìm ra.</p>';
  jump0();
}
function vBank(cd){
  cd=String(cd||'0');var todn=cd==='dn';if(todn)cd='0';
  if(cd!=='0'&&cd!=='1'&&!isDN(cd)&&!cd1Done())cd='0';
  if(!QB[cd])cd='0';
  var rg=regDone()&&regOpen();return {html:(rg?backrow('hoat-dong','Cuộc thi'):crumbs([['cong-cu-kiem-tra','CÔNG CỤ KIỂM TRA'],[null,'Tự luyện']]))+'<div id="bankbody" style="display:grid;gap:16px">'+(cd==='0'?bankMenu():bankIntro(cd))+'</div>',nav:rg?'hoat-dong':'cong-cu-kiem-tra',
    after:todn?function(){var e=document.getElementById('thi-dn');if(e){try{e.scrollIntoView({block:'start'})}catch(x){}var hh=e.querySelector('h2');if(hh){hh.setAttribute('tabindex','-1');try{hh.focus({preventScroll:true})}catch(x){}}}}:null};
}

/* ================= góp ý ================= */
function vGopy(){
  var h=crumbs([['ve-website','Về website'],[null,'Góp ý']])+pageh('Góp ý cho website','Đây là phiên bản đầu, còn thiếu sót. Chỗ nào khó hiểu, thiếu hoặc sai, bà con cứ nói thẳng. Một câu ngắn cũng quý.','Về website','pen')+fig('42',{eager:true,cls:'hero'})+
   (!canSend('feedback')?NOCHANNEL('Nơi nhận góp ý'):
   '<div class="warn"><b>Trước khi gõ</b><ul><li>Đừng viết mật khẩu, mã OTP, mã PIN, số thẻ hay số tài khoản.</li><li>Đừng gửi họ tên, số điện thoại, địa chỉ, ảnh giấy tờ của người khác.</li><li>Website không nhận tệp và ảnh chụp màn hình.</li></ul></div>'+
   '<form class="box form" data-form="gopy" novalidate>'+'<div class="hp" aria-hidden="true"><label>Để trống ô này<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>'+'<div><label class="lbl" for="gtext">Góp ý của bạn</label><textarea id="gtext" placeholder="Ví dụ: mục dấu hiệu phải dừng chữ nhỏ quá, mẹ tôi 70 tuổi đọc không ra."></textarea></div>'+
   '<label class="check one" for="gok"><input type="checkbox" id="gok"><span><b>Tôi đồng ý</b> cho Ban biên tập đọc và dùng góp ý này để sửa nội dung website và cuộc thi.</span></label>'+
   '<p class="err" id="gerr" hidden></p><p class="okmsg" id="gdone" hidden>'+(API?'Đã nhận góp ý của bạn. Cảm ơn bạn đã giúp website tốt hơn.':MAILMSG())+'</p>'+
   '<div class="btnrow"><button type="submit" class="btn pri">Gửi góp ý</button></div>'+
   '<p class="small">'+(API?'Không cần tên, không cần số điện thoại, không cần tài khoản.':MAILNOTE)+'</p></form>'+
   (!API?'':'<section class="sec box"><h2 style="font-size:19px;font-weight:800">Giai đoạn đầu có xét thưởng</h2><p>Ba góp ý giúp sửa được một chỗ thật sự có ích cho người đọc.</p>'+
   '<div class="prizes"><div class="pz"><small>Giải nhất</small><b>5.000.000 đ</b></div><div class="pz"><small>Giải nhì</small><b>3.000.000 đ</b></div><div class="pz"><small>Giải ba</small><b>1.000.000 đ</b></div></div>'+
   '<p class="small">Không muốn dự xét thưởng thì bỏ qua phần này. Góp ý ẩn danh vẫn được đọc và dùng như nhau.</p>'+
   peek('pk-prize','Tôi muốn dự xét thưởng','Cần để lại tên và số điện thoại',
    '<div class="form"><div class="f2"><label for="pzname">Họ và tên<input type="text" id="pzname"></label><label for="pzphone">Số điện thoại<input type="tel" id="pzphone" inputmode="numeric"></label></div>'+
    '<div class="allin"><b>Phần này dùng vào đúng một việc</b><ul><li>Tên và số điện thoại chỉ dùng để liên hệ trao thưởng, không gắn với nội dung góp ý khi đăng, không dùng để quảng cáo.</li><li>Xóa sau khi trao thưởng xong, trừ giấy tờ trao thưởng phải giữ theo quy định về kế toán, thuế.</li><li>Giải thưởng thực hiện nghĩa vụ thuế thu nhập cá nhân theo quy định hiện hành.</li><li>Bạn có thể rút lại đồng ý, xem, sửa hoặc xóa thông tin này bất kỳ lúc nào bằng cách gửi yêu cầu qua chính mục Góp ý.</li></ul></div>'+
    '<label class="check one" for="pzok"><input type="checkbox" id="pzok"><span><b>Tôi đồng ý</b> để Ban Tổ chức dùng tên và số điện thoại của tôi cho việc xét và trao thưởng góp ý.</span></label></div>')+'</section>'));
  return {html:h,nav:''};
}

/* ================= giới thiệu, chính sách ================= */
var POLNAME={mt:'Tuyên bố miễn trừ trách nhiệm',dl:'Chính sách bảo vệ dữ liệu cá nhân',ng:'Nguyên tắc biên soạn nội dung',cc:'Cách báo lỗi và cải chính'};
var POLICON={mt:'info',dl:'lock',ng:'book',cc:'pen'};
function vPol(k){
  if(!POL[k])k='mt';
  var d=POL[k],o='',rows=[],nl=[];
  function fr(){if(!rows.length)return;o+='<div class="tblwrap"><table class="dtbl"><thead><tr><th>'+rows[0][0]+'</th><th>'+rows[0][1]+'</th></tr></thead><tbody>'+rows.slice(1).map(function(r){return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table></div>';rows=[]}
  function fn(){if(!nl.length)return;o+='<ol class="poln">'+nl.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ol>';nl=[]}
  d.b.forEach(function(x){
    if(x[0]!=='r')fr(); if(x[0]!=='n')fn();
    if(x[0]==='h')o+='<h2>'+esc(x[1])+'</h2>';
    else if(x[0]==='s')o+='<h3>'+esc(x[1])+'</h3>';
    else if(x[0]==='p')o+='<p>'+x[1]+'</p>';
    else if(x[0]==='q')o+='<div class="dbox s"><p>'+x[1]+'</p></div>';
    else if(x[0]==='b')o+='<div class="dbox q"><p>'+x[1]+'</p></div>';
    else if(x[0]==='n')nl.push(x[1]);
    else if(x[0]==='r')rows.push(x[1].split(' | '));
  });
  fn();fr();
  var h=backrow('ve-website','Về website',true)+
   '<nav class="tabs" aria-label="Các chính sách">'+Object.keys(POLNAME).map(function(j){return '<button type="button" data-go="pol'+j+'" aria-current="'+(j===k)+'">'+esc(POLNAME[j])+'</button>'}).join('')+'</nav>'+
   '<article class="doc"><p class="eyebrow">Chính sách của website</p><h1 tabindex="-1">'+esc(d.t)+'</h1><p class="docmeta">'+esc(d.v)+'</p>'+o+PRINTFOOT+'</article>';
  return {html:h,nav:''};
}

/* ================= bài đọc, chuỗi bài ================= */
function stKey(s){return s==='DỪNG'?'d':(s==='HOÃN'?'h':'q')}
function vDoc(n){
  n=String(n); if(!DOCS[n])n='1';
  var d=DOCS[n],o='',hc=0,tocl=[];
  d.b.forEach(function(x){
    var t=x[0];
    if(t==='now')o+='<div class="docnow"><b>'+esc(cap1(x[1]))+'</b>'+x[2].map(P).join('')+'<div class="btnrow"><button type="button" class="btn red sm" data-urgent>Chọn việc cần làm ngay</button><button type="button" class="btn ghost sm" data-jump="dolo-'+n+'">Đến mục “Nếu đã lỡ”</button></div></div>';
    else if(t==='box')o+='<div class="dbox '+x[1]+'"><span class="eyebrow">'+esc(x[2])+'</span>'+x[3].map(function(p,i){return '<p'+(x[1]==='r'&&i===0?' class="big"':'')+'>'+esc(p)+'</p>'}).join('')+'</div>';
    else if(t==='tbl')o+='<div class="tblwrap"><table class="dtbl"><thead><tr><th>'+esc(x[1])+'</th><th>'+esc(x[2])+'</th></tr></thead><tbody>'+x[3].map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>'}).join('')+'</tbody></table></div>';
    else if(t==='st')o+='<div class="tblwrap"><table class="dtbl"><thead><tr><th>'+esc(x[1][0])+'</th><th>'+esc(x[1][1])+'</th></tr></thead><tbody>'+x[2].map(function(r){return '<tr><td><span class="stname '+stKey(r[0])+'">'+esc(r[0])+'</span></td><td>'+r[1].map(function(f){return '<p>'+(f[0]?'<b>'+esc(f[0])+':</b> ':'')+esc(f[1])+'</p>'}).join('')+'</td></tr>'}).join('')+'</tbody></table></div>';
    else if(t==='chips')o+='<div class="chips">'+x[1].map(function(c){return '<span>'+esc(c)+'</span>'}).join('')+'</div>';
    else if(t==='steps')o+='<ol class="dsteps">'+x[1].map(function(c,i){return '<li><b>'+(i+1)+'</b>'+esc(c)+'</li>'}).join('')+'</ol>';
    else if(t==='stop')o+='<div class="dstop"><b>'+esc(cap1(x[1]))+'</b>'+(x[2]?'<p class="sub2">'+esc(x[2])+'</p>':'')+'<ol>'+x[3].map(function(i){return '<li>'+esc(i)+'</li>'}).join('')+'</ol>'+(x[4]?'<p class="sub2">'+esc(x[4])+'</p>':'')+'</div>';
    else if(t==='pocket')o+='<div class="pocket"><b>'+esc(cap1(x[1]))+'</b>'+(x[2]?'<p class="small">'+esc(x[2])+'</p>':'')+x[3].map(function(i,k){return '<label><input type="checkbox" data-tick="d'+n+'-'+(k+1)+'"> <span>'+esc(i)+'</span></label>'}).join('')+'<div><button type="button" class="more" data-act="clrticks">Xóa đánh dấu</button></div></div>';
    else if(t==='dolo'){tocl.push(['dolo-'+n,x[1]]);o+='<h2 id="dolo-'+n+'">'+esc(x[1])+'</h2>'}
    else if(t==='nofault')o+='<p><b>'+esc(x[1])+'</b></p>';
    else if(t==='case')o+='<div class="cases">'+x[1].map(function(c){return '<div class="case">'+(c[0]?'<b>'+esc(c[0])+'</b> ':'')+esc(c[1])+'</div>'}).join('')+'</div>';
    else if(t==='recov')o+=note('r','Cảnh giác với người hứa lấy lại tiền',x[1]);
    else if(t==='end')o+='<div class="docend"><b>Giờ hãy làm bài</b><p>'+esc(x[1])+'</p><button type="button" class="btn pri" data-go="thi'+n+'">'+esc(x[2]||'Bắt đầu')+ic('next')+'</button></div>';
    else if(t==='h'){hc++;tocl.push(['dh'+hc,x[1]]);o+='<h2 id="dh'+hc+'">'+esc(x[1])+'</h2>'}
    else if(x[1])o+='<p>'+esc(x[1])+'</p>';
  });
  var h=crumbs([['cac-rui-ro','RỦI RO'],['cac-rui-ro.'+DOCTAB[n],RTAB[DOCTAB[n]].t],[null,'Bài đọc Chuyên đề '+n]])+
   '<nav class="tabs" aria-label="Chọn chuyên đề">'+Object.keys(DOCS).sort().map(function(k){return '<button type="button" data-go="doc'+k+'" aria-current="'+(k===n)+'">CĐ '+k+'<small>'+esc(CDSHORT[k]||'Nền tảng')+'</small></button>'}).join('')+'</nav>'+
   '<article class="doc"><p class="eyebrow">'+esc(d.kicker)+'</p><h1 tabindex="-1">'+esc(d.t)+'</h1><p class="docmeta">'+esc(d.meta)+'</p>'+fig(DOCIMG[n],{eager:true,cls:'hero'})+tools(true)+toc(tocl)+o+
   '<p class="printfoot">Bản in từ antoantaichinh.vn — Bài đọc Chuyên đề '+n+'. Đây không phải website của cơ quan nhà nước và không tiếp nhận tố giác, tin báo về tội phạm. Nội dung có thể đã được cập nhật sau ngày in.</p></article>';
  return {html:h,nav:'cac-rui-ro',after:function(){var c=VIEW.querySelector('.tabs [aria-current="true"]');if(c)try{c.scrollIntoView({inline:'center',block:'nearest'})}catch(e){}}};
}
function vArt(id){
  if(!ARTS[id])id='1';
  var a=ARTS[id],i=ARTORDER.indexOf(id),nx=ARTORDER[i+1];
  var o='<article class="doc"><p class="eyebrow">Lừa đảo: Từ cổ chí kim · Bài '+ARTNO[id]+'</p><h1 tabindex="-1">'+esc(a.t)+'</h1><p class="lede">'+esc(a.lede)+'</p><p class="docmeta"><span>'+ic('clock')+'Đọc khoảng '+minutes(a.b.map(function(x){return x[1]}).join(' '))+' phút</span></p>'+fig(ARTIMG[id],{eager:true,cls:'hero'})+tools(true)+
    a.b.map(function(x){return x[0]==='h'?'<h2>'+esc(x[1])+'</h2>':'<p>'+esc(x[1])+'</p>'}).join('')+
    '<div class="docend"><b>'+(nx?'Đọc tiếp':'Đọc tiếp phần nền')+'</b><p>'+(nx?esc(ARTS[nx].t):'Chuỗi bài này kể chuyện và giải thích. Phần hướng dẫn làm gì nằm ở bài đọc chuyên đề và ở mục KHẨN CẤP.')+'</p>'+
    '<button type="button" class="btn pri" data-go="'+(nx?'art'+nx:'doc1')+'">'+(nx?'Bài '+ARTNO[nx]:'Mở bài đọc Chuyên đề 1')+ic('next')+'</button></div>'+PRINTFOOT+'</article>';
  return {html:crumbs([['cac-rui-ro','RỦI RO'],['cac-rui-ro.'+ARTTAB[id],RTAB[ARTTAB[id]].t],[null,'Bài đọc thêm']])+o,nav:'cac-rui-ro'};
}

/* ================= cấu trúc theo Bản đặc tả đóng gói: ba mục ================= */
/* Menu chính đúng ba mục. Đường dẫn dạng #khan-cap, #cong-cu-kiem-tra, #cac-rui-ro.canh-bao (dấu chấm thay cho dấu gạch chéo vì cả website là một tệp). */
var NAV=[
 {k:'khan-cap',t:'KHẨN CẤP',sh:'KHẨN CẤP',i:'alert',urg:1},
 {k:'cong-cu-kiem-tra',t:'CÔNG CỤ KIỂM TRA',sh:'CÔNG CỤ',i:'quiz'},
 {k:'cac-rui-ro',t:'RỦI RO',sh:'RỦI RO',i:'chart'}
];
/* Mô-đun Hoạt động: đặt on:false thì lối vào tự ẩn, trang vẫn mở được. */
/* Cuộc thi: open:true khi Ban Tổ chức mở đăng ký (cần có máy chủ nhận đăng ký, xem README). time, prize, rules: điền chữ khi đã chốt; để trống thì trang ghi “sẽ công bố”. */
var ACTIVITY={on:true,open:false,time:'',prize:'',rules:'',t:'Cuộc thi tìm hiểu',full:'Cuộc thi trực tuyến tìm hiểu phòng, chống lừa đảo',i:'trophy'};
var TBA='Sẽ công bố tại trang này.';
function regOpen(){return !!(ACTIVITY.on&&ACTIVITY.open&&API)}

var BONKHONG=['Không hỏi mật khẩu, mã xác thực hoặc số tài khoản của bạn.','Không yêu cầu bạn cài ứng dụng.','Không thu bất kỳ khoản phí nào.','Không nhận tài trợ từ đơn vị tài chính, đầu tư, cho vay.'];
var BKICON=['lock','app','money','badge'];
var REFUSE='Từ chối ngay lời đề nghị cho mượn, cho thuê, bán hoặc mở hộ tài khoản ngân hàng, ví điện tử, SIM, dù được trả tiền công.';
var NOTCONC='Kết quả này dựa trên thông tin bạn vừa nhập. Đây không phải kết luận về bất kỳ cá nhân, tổ chức nào.';
/* Câu bắt buộc của đặc tả, hiện dưới mọi kết quả tự kiểm tra */
var RESNOTE='Kết quả chỉ mang tính tham khảo, không phải kết luận pháp lý và không thay thế việc liên hệ ngân hàng hoặc cơ quan có thẩm quyền.';
var STATE={
 d:{lab:'DỪNG',ic:'stop',txt:'Dừng giao dịch ngay. Đây là khuyến nghị dừng hành động của bạn, không phải kết luận rằng đã có hành vi lừa đảo.'},
 h:{lab:'HOÃN VÀ KIỂM CHỨNG',ic:'clock',txt:'Chưa thực hiện giao dịch cho tới khi bạn đã kiểm chứng bằng một kênh do chính bạn tìm ra.'},
 n:{lab:'CHƯA PHÁT HIỆN ĐIỂM DỪNG',ic:'info',txt:'Chưa phát hiện điểm dừng từ thông tin bạn cung cấp. Kết quả này không có nghĩa giao dịch an toàn.'}
};
/* “Mức độ cần thận trọng” của đặc tả gắn một-một với ba khuyến nghị của Điều 8. Không chấm điểm, không có mức “an toàn”.
   Mức thấp nhất dùng đúng chữ “Cần thận trọng” mà đặc tả quy định cho trường hợp không khớp. */
var LEVEL={d:'Rất cao',h:'Cao',n:'Cần thận trọng'};
var BANKA=['<b>Có thẻ ngân hàng:</b> lật mặt sau thẻ, gọi số chăm sóc khách hàng in trên thẻ.',
 '<b>Không có thẻ:</b> mở ứng dụng ngân hàng bạn đã cài từ trước, vào mục Trợ giúp hoặc Liên hệ.',
 '<b>Luôn luôn:</b> không bấm đường dẫn và không gọi số do người kia gửi.'];
var BANKANOTE='Website không đưa số điện thoại hay đường dẫn của bất kỳ ngân hàng, nhà mạng, doanh nghiệp nào. Số đúng là số bạn tự lấy từ thẻ hoặc ứng dụng của chính mình.';
var NOTREPORT='Website này không phải là nơi tiếp nhận tố giác, tin báo về tội phạm. Nếu bạn cần trình báo, hãy liên hệ trực tiếp cơ quan Công an nơi bạn cư trú.';
var NOADVICE='Website không tư vấn đầu tư, không tư vấn tài chính cá nhân và không giới thiệu sản phẩm tài chính. Nội dung của mục Rủi ro tài chính chỉ nhằm giúp bạn đặt đúng câu hỏi trước khi quyết định.';
var MUST=['Có đăng ký doanh nghiệp không đồng nghĩa với được phép cung cấp dịch vụ tài chính. Nhiều dịch vụ tài chính đòi hỏi giấy phép chuyên ngành riêng; kiểm tra đăng ký doanh nghiệp là chưa đủ.',
 'Một khoản đầu tư có thể làm mất tiền mà không có bất kỳ hành vi gian dối nào. Thua lỗ do biến động thị trường không phải là lừa đảo, và cần được xử lý theo cách khác.'];

/* Bốn nguyên tắc dừng của khối KHẨN CẤP. Câu chữ phụ lấy từ “Năm việc phải chặn ngay” (Bài đọc Chuyên đề 1)
   và bước 1 của trang “Có người đang thúc bạn làm ngay”. */
var PRINC=[
 ['money','Không chuyển tiền','Kể cả khoản họ gọi là phí xác minh, phí mở khóa, tiền bảo lãnh.'],
 ['key','Không cung cấp OTP','Không đọc, không gửi mã OTP, mật khẩu, mã PIN cho bất kỳ ai.'],
 ['link','Không bấm đường dẫn lạ','Không bấm vào đường dẫn người lạ gửi, không quét mã QR họ đưa.'],
 ['app','Không cài ứng dụng theo yêu cầu','Không cài theo đường dẫn người khác gửi, không cho xem hay điều khiển màn hình.']
];

/* Kênh tiếp cận: danh mục cố định theo Điều 15 khoản 3. */
var CHANNELS=[
 {k:'dt',t:'Điện thoại, cuộc gọi',i:'call'},
 {k:'tn',t:'Tin nhắn, Zalo',i:'chat'},
 {k:'mxh',t:'Mạng xã hội',i:'users'},
 {k:'web',t:'Website, ứng dụng, mã QR',i:'app'},
 {k:'san',t:'Sàn thương mại điện tử',i:'cart'},
 {k:'mail',t:'Thư điện tử',i:'mail'},
 {k:'tt',t:'Gặp trực tiếp, người quen giới thiệu',i:'person'}
];
/* Gắn kênh cho từng thủ đoạn (chỉ số trong TACTICS). Phân loại của Ban biên tập. */
var TCH={0:['tt','web'],1:['tt','mxh','web'],2:['tt'],3:['tt','web'],4:['mxh','web'],5:['tt','mxh'],6:['tt'],7:['web'],8:['tt','mxh'],
 9:['web'],10:['tt','web'],11:['mxh','tn'],12:['dt'],13:['dt','tn'],14:['mxh','tn','web'],15:['mxh','tt'],16:['tt'],17:['mxh','tn','tt'],18:['tn','web'],
 19:['san','mxh'],20:['mxh','tt'],21:['tt'],22:['tn','tt'],23:['tn','dt'],24:['dt'],25:['dt'],26:['mxh','dt'],27:['tn'],28:['mxh','tn'],29:['dt','web'],30:['tt','dt']};
/* Mức độ cần thận trọng của từng thủ đoạn: d khi bước chính của thủ đoạn là một dấu hiệu phải dừng (Điều 14),
   h khi là dấu hiệu phải hoãn để kiểm chứng, n khi là rủi ro trong giao dịch hợp pháp. Phân loại của Ban biên tập. */
var TLV={0:'h',1:'n',2:'h',3:'n',4:'h',5:'h',6:'n',7:'d',8:'h',9:'h',10:'n',11:'h',12:'h',13:'h',14:'d',15:'h',16:'h',17:'d',18:'d',
 19:'h',20:'h',21:'d',22:'h',23:'h',24:'d',25:'d',26:'h',27:'d',28:'h',29:'d',30:'h'};
/* Nhóm đối tượng: bốn nhóm ưu tiên của Điều 2, thêm nhóm người mới dùng điện thoại thông minh. */
var GROUPS=[
 {k:1,t:'Công nhân, người lao động',s:'Tuyển dụng, vay tiền nhanh, làm nhiệm vụ trực tuyến.',i:'brief',tac:[14,15,16,17,9,10,12,28]},
 {k:2,t:'Người cao tuổi / người thân hỗ trợ',s:'Giả danh cơ quan, hội thảo bán hàng, giả người thân.',i:'users',tac:[21,24,25,26,30,6,28,23]},
 {k:3,t:'Học sinh, sinh viên, người tìm việc',s:'Việc nhẹ lương cao, cộng tác viên, đầu tư nhỏ.',i:'book',tac:[14,15,17,18,4,9,19]},
 {k:4,t:'Tiểu thương, hộ kinh doanh',s:'Giả biên lai, giả người mua, giả người giao hàng.',i:'cart',tac:[22,23,24,27,19,20,3]},
 {k:5,t:'Người mới dùng điện thoại thông minh',s:'Đường dẫn lạ, cài ứng dụng, mã OTP, mã QR.',i:'phone',tac:[18,29,27,23,9,26]}
];
var BK={1:{t:'Trước mọi quyết định có dính đến tiền',i:'clock'},2:{t:'Trước khi ký hợp đồng, bấm đồng ý',i:'pen'},3:{t:'Trước khi đầu tư, góp vốn',i:'chart'},
 4:{t:'Trước khi vay, bảo lãnh, đứng tên',i:'coins'},5:{t:'Trước khi nhận việc, nộp hồ sơ',i:'brief'},6:{t:'Trước khi mua, chuyển khoản, đặt cọc',i:'cart'},
 7:{t:'Khi người lạ liên hệ, gửi đường dẫn',i:'call'},8:{t:'Khi đã lỡ đưa tiền, mã hoặc giấy tờ',i:'alert'}};

/* Đường dẫn đọc được cho từng trang (đặc tả, mục SEO). */
var PBSLUG={0:'tra-loi-nhanh',1:'dang-bi-thuc-ep',2:'da-chuyen-tien',3:'bi-chiem-quyen-tai-khoan',4:'duoc-moi-dau-tu',5:'khong-lay-lai-duoc-tien',6:'lo-giay-to-chu-ky',7:'tu-kiem-chung',8:'bi-de-doa',9:'tien-la-chuyen-vao'};
var LVSLUG={7:'cuoc-goi-tin-nhan-gia-mao',6:'mua-ban-dat-coc',5:'viec-lam-nhiem-vu-truc-tuyen',3:'dau-tu-gop-von',4:'vay-cho-vay-bao-lanh',2:'hop-dong-cam-ket-dich-vu'};
var LVTAB={7:'lua-dao',6:'lua-dao',5:'lua-dao',3:'dau-tu',4:'vay-va-no',2:'bao-hiem-va-tiet-kiem'};
var DOCTAB={1:'lua-dao',2:'bao-hiem-va-tiet-kiem',3:'dau-tu',4:'vay-va-no',5:'lua-dao',6:'lua-dao',7:'lua-dao',8:'lua-dao'};
var ARTTAB={'1':'lua-dao','2':'lua-dao','3-1':'lua-dao','3-2':'lua-dao','3-3':'lua-dao','4':'dau-tu','5':'bao-hiem-va-tiet-kiem','6':'dau-tu','7':'lua-dao','8':'lua-dao'};
var RTABS=[
 {k:'canh-bao',t:'CẢNH BÁO',i:'mega',s:'Thủ đoạn đang cần chú ý',lead:'Những thủ đoạn đang cần chú ý, do website biên soạn để bà con nhận ra sớm. Mỗi cảnh báo ghi ngày cập nhật. Website không đưa tin, không tổng hợp tin báo chí và không nêu tên cá nhân, tổ chức nào.'},
 {k:'lua-dao',t:'Lừa đảo',i:'alert',s:'Giả danh, việc làm trên mạng, mua bán, đặt cọc',lead:'Không cần nhớ tên từng thủ đoạn. Đừng nghe họ tự xưng là ai, hãy nhìn vào việc họ đang bảo mình làm.'},
 {k:'vay-va-no',t:'Vay và nợ',i:'coins',s:'Vay nhanh, phí trước, đứng tên hộ, đòi nợ',lead:'Ghi ra giấy ba con số trước khi vay: mình nhận về bao nhiêu, tổng cộng phải trả bao nhiêu, mỗi kỳ trả bao nhiêu.'},
 {k:'dau-tu',t:'Đầu tư',i:'chart',s:'Cam kết lợi nhuận, rút thử, hoa hồng theo tầng',lead:'Ba câu trở đi trở lại: lợi nhuận ở đâu ra, ai có nghĩa vụ trả tiền cho mình, và muốn rút thì rút bằng cách nào.'},
 {k:'bao-hiem-va-tiet-kiem',t:'Bảo hiểm và tiết kiệm',i:'shield',s:'Hợp đồng, phí định kỳ, nhập nhèm sản phẩm',lead:'Bốn điều phải rõ trước khi ký: ai là bên cung cấp, mình phải trả bao nhiêu, mình được hưởng gì, và muốn dừng thì làm thế nào.'},
 {k:'du-lieu-ca-nhan',t:'Dữ liệu cá nhân',i:'id',s:'Mã OTP, giấy tờ, tài khoản, SIM',lead:'Mã xác thực, giấy tờ, khuôn mặt, tài khoản ngân hàng và SIM là chìa khóa của bạn. Không ai cần những thứ đó của mình qua điện thoại.'}
];
var RTAB={};RTABS.forEach(function(t){RTAB[t.k]=t});

/* ============ ẢNH MINH HỌA (tạo bằng AI, ngày 31/10/2026) ============
   Tệp ảnh nằm trong thư mục img/ cạnh index.html, mỗi ảnh có vài bề rộng để trình duyệt tự chọn (srcset).
   Mỗi mục: [tên tệp gốc, các bề rộng có sẵn (tăng dần), tỉ lệ rộng:cao, văn bản thay thế].
   Không đặt ảnh trên đường khẩn cấp: mục KHẨN CẤP, trình hỏi, ba công cụ, tám mục kiểm tra, mười trang việc cần làm.
   Ảnh đứng cạnh tiêu đề (ô nhóm, thẻ công cụ, đầu nhóm) là ảnh trang trí: văn bản thay thế để trống. */
var IMGDIR='img/';
var AILABEL='Ảnh minh họa tạo bằng AI';
var H3=[480,820,1640],C3=[480,750],S2=[240,480];
var IMG={
 '01':['img-01-trang-chu-khan-cap',[560,880],[4,3],'Bà cụ để điện thoại đang đổ chuông trên bàn, không nghe theo cuộc gọi lạ, quay sang hỏi con trai.'],
 '02':['img-02-truoc-khi-chuyen-tien',C3,[3,2],'Người công nhân giơ tay ra hiệu chờ, chưa bấm nút chuyển tiền trên điện thoại.'],
 '03':['img-03-truoc-khi-dau-tu-vay',C3,[3,2],'Chị bán hàng dùng kính lúp đọc kỹ hợp đồng bên cạnh lời mời hứa lãi cao.'],
 '04':['img-04-khi-nghi-bi-lua',C3,[3,2],'Ông cụ lật thẻ ngân hàng, tự gọi tổng đài; con gái ngồi bên xếp các bước cần làm.'],
 '05':['img-05-nhom-lua-dao',S2,[1,1],'Lưỡi câu thả xuống từ một tin nhắn trên điện thoại.'],
 '06':['img-06-nhom-vay-va-no',S2,[1,1],'Kính lúp soi ra một khoản phí ẩn dưới tờ đơn vay.'],
 '07':['img-07-nhom-dau-tu',S2,[1,1],'Cây non mọc từ chồng xu, bên cạnh biểu đồ tăng nhẹ.'],
 '08':['img-08-nhom-bao-hiem-tiet-kiem',S2,[1,1],'Chiếc ô che hũ tiết kiệm, phía trước là tờ hợp đồng chưa ký và cây bút.'],
 '09':['img-09-nhom-du-lieu-ca-nhan',S2,[1,1],'Điện thoại có ổ khóa, thẻ căn cước, chìa khóa và thẻ SIM nằm trong một lá chắn.'],
 '10':['img-10-cd7-cuoc-goi-tin-nhan',H3,[16,9],'Bà cụ gác máy cuộc gọi lạ, cầm thẻ ngân hàng để tự gọi số in trên thẻ.'],
 '11':['img-11-cd6-mua-ban-dat-coc',H3,[16,9],'Chị bán hàng mở ứng dụng ngân hàng của mình kiểm tra tiền đã về trước khi giao hàng; tờ biên nhận giả đang tan biến.'],
 '12':['img-12-cd5-viec-lam-nhiem-vu',H3,[16,9],'Hai thanh niên ở phòng trọ nhận ra việc làm trên mạng đang kéo tiền của mình đi, liền đặt điện thoại xuống.'],
 '13':['img-13-cd3-dau-tu-gop-von',H3,[16,9],'Ở quán trà vỉa hè, một người khoe biểu đồ lãi cao; chị bán hàng bình tĩnh ghi các câu cần hỏi.'],
 '14':['img-14-cd4-vay-bao-lanh',H3,[16,9],'Chàng trai từ chối cho ứng dụng vay quyền vào danh bạ và ảnh, bên cạnh tờ giấy ghi các con số của khoản vay.'],
 '15':['img-15-cd2-hop-dong',H3,[16,9],'Ông cụ giơ tay từ chối ký ngay, cầm tập hợp đồng để mang về đọc; bà hàng xóm đứng cạnh.'],
 '18':['img-18-nhom-canh-bao-moi',S2,[1,1],'Loa truyền thanh trên cột phát đi những vòng sóng.'],
 '19':['img-19-cd1-nen-tang',H3,[16,9],'Chàng sinh viên dừng trên phiến đá đầu tiên trong bốn phiến đá qua suối.'],
 '20':['img-20-cd8-xu-ly-phuc-hoi',H3,[16,9],'Bà cụ tự gọi cho ngân hàng, người thân ngồi bên sắp xếp biên lai, giấy tờ vào bìa hồ sơ.'],
 '21':['img-21-ve-website',H3,[16,9],'Bà con nhiều lứa tuổi trước nhà văn hóa, một người trẻ chỉ cho hai ông bà cách xem trên điện thoại.'],
 '22':['img-22-hoi-dap',C3,[3,2],'Những phong thư kín được gộp vào một hộp, rồi thành một lời trả lời chung cho mọi người.'],
 '23':['img-23-doc-them-1',H3,[16,9],'Đám đông nhiều lứa tuổi, ai cũng cầm điện thoại, vài người đang nhận tin nhắn lạ.'],
 '24':['img-24-doc-them-2',H3,[16,9],'Người trên băng chuyền vươn tay bấm nút dừng khẩn cấp trước khi tới hộp quà.'],
 '25':['img-25-doc-them-3-1',H3,[16,9],'Trò úp ba cái cốc ở chợ xưa, một người kéo bạn rời đi.'],
 '26':['img-26-doc-them-3-2',H3,[16,9],'Trò úp cốc chuyển lên màn hình điện thoại khổng lồ, người xem dừng lại suy nghĩ.'],
 '27':['img-27-doc-them-3-3',H3,[16,9],'Khuôn mặt trong cuộc gọi video ghép từ mảnh, thiếu vài mảnh; bà cụ tự gọi lại số quen.'],
 '28':['img-28-doc-them-4',H3,[16,9],'Người cầm đèn pin và bản đồ đứng ở ngã rẽ: một lối sáng rõ, một lối vào vùng sương xám.'],
 '29':['img-29-doc-them-5',H3,[16,9],'Cây bút trên dòng ký tên, các sợi sáng nối tới ngôi nhà, xe máy và xấp giấy tờ.'],
 '30':['img-30-doc-them-6',H3,[16,9],'Cái cân: một bên biểu đồ đi xuống, một bên lưỡi câu; một người soi kỹ bằng kính lúp.'],
 '31':['img-31-doc-them-7',H3,[16,9],'Đồng hồ cát ba ngăn, người vừa gọi điện vừa đánh dấu danh mục việc cần làm.'],
 '32':['img-32-doc-them-8',H3,[16,9],'Quả địa cầu nối các lá chắn bằng đường mạng.'],
 '33':['img-33-cuoc-thi',H3,[16,9],'Bà con trong hội trường giơ thẻ trả lời câu hỏi, phía trước là chiếc cúp.'],
 '34':['img-34-chua-tim-thay',S2,[1,1],''],
 '36':['img-36-gia-danh-cong-an',H3,[16,9],'Ông cụ đưa xa chiếc điện thoại có người tự xưng cán bộ gọi video; con gái ngồi cạnh chỉ vào màn hình, lắc đầu.'],
 '37':['img-37-bat-coc-online',H3,[16,9],'Con gái ngồi một mình trong phòng khách sạn nghe điện thoại; ở nhà, người mẹ không chuyển tiền mà gọi thẳng cho con.'],
 '38':['img-38-duong-day-goi-dien',H3,[16,9],'Căn phòng kín rèm, nhiều người đeo tai nghe gọi điện theo kịch bản; các đường đỏ tỏa ra tới nhà dân.'],
 '39':['img-39-chiem-quyen-dieu-khien',H3,[16,9],'Chàng trai bật chế độ máy bay khi phát hiện điện thoại bị điều khiển từ xa; ở xa, một người đang xem màn hình điện thoại của anh trên máy tính.'],
 '40':['img-40-moi-viec-lam-nuoc-ngoai',H3,[16,9],'Ở quán cà phê, người môi giới lịch sự giới thiệu việc làm ở nước ngoài; chàng trai dừng lại, định gọi về cho gia đình.'],
 '41':['img-41-quay-ngan-hang',H3,[16,9],'Tại quầy ngân hàng, bà cụ đang bị nhắn tin hối thúc chuyển tiền; giao dịch viên tạm dừng giao dịch, hỏi han, con trai bà vừa tới.'],
 '42':['img-42-to-dan-pho',H3,[16,9],'Buổi họp tổ dân phố ở đầu ngõ, tổ trưởng phát tờ rơi cho bà con; xe tuần tra đỗ ở xa.']
};
/* Ảnh nào đặt ở đâu (bảng vị trí trong tài liệu “Ảnh minh họa website”, cộng bảy cảnh bổ sung IMG-36 đến 42) */
var TABIMG={'canh-bao':'18','lua-dao':'05','vay-va-no':'06','dau-tu':'07','bao-hiem-va-tiet-kiem':'08','du-lieu-ca-nhan':'09'};
var TOOLIMG=['02','03','04'];
var LVIMG={7:'10',6:'11',5:'12',3:'13',4:'14',2:'15'};
var DOCIMG={1:'19',2:'15',3:'13',4:'14',5:'40',6:'11',7:'37',8:'20'};
var ARTIMG={'1':'23','2':'24','3-1':'25','3-2':'26','3-3':'27','4':'28','5':'29','6':'30','7':'31','8':'32'};
var ALIMG={1:'39',2:'14',3:'13',4:'12',5:'38',6:'41',7:'36',8:'15',9:'27',10:'11'};
var TACIMG={24:'36',25:'37',27:'38',29:'39',15:'40',23:'41'};
var BLANKGIF='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
var HEROSZ='(min-width:900px) 820px, calc(100vw - 32px)';
/* o: sizes, alt (ghi đè), eager, cls, minw (không tải dưới bề rộng màn hình này) */
function pic(k,o){
  o=o||{};var m=IMG[k];if(!m)return '';
  var ws=m[1],big=ws[ws.length-1],H=Math.round(big*m[2][1]/m[2][0]);
  var src=IMGDIR+m[0]+'-'+ws[Math.min(1,ws.length-1)]+'.webp';
  var set=ws.map(function(w){return IMGDIR+m[0]+'-'+w+'.webp '+w+'w'}).join(', ');
  var img='<img src="'+src+'" srcset="'+set+'" sizes="'+(o.sizes||'100vw')+'" width="'+big+'" height="'+H+'" alt="'+esc(o.alt!==undefined?o.alt:m[3])+'"'+
    (o.eager?' fetchpriority="high"':' loading="lazy"')+' decoding="async"'+(o.cls?' class="'+o.cls+'"':'')+'>';
  if(o.minw)img='<picture><source media="(max-width:'+(o.minw-1)+'px)" srcset="'+BLANKGIF+'">'+img+'</picture>';
  return img;
}
function fig(k,o){
  o=o||{};if(!IMG[k])return '';
  return '<figure class="fig'+(o.cls?' '+o.cls:'')+'">'+pic(k,{sizes:o.sizes||HEROSZ,eager:o.eager,alt:o.alt})+
    '<figcaption>'+(o.cap?'<span>'+esc(o.cap)+'</span>':'')+'<span class="ailab">'+AILABEL+'</span></figcaption></figure>';
}

/* CẢNH BÁO (Điều 20). d: ngày đăng trên website. st: phân loại nội bộ, không hiện ra trang. sg: dấu hiệu phải dừng liên quan (chỉ số SIGNS). */
var ALERTS=[
 {id:1,t:'Ứng dụng giả mạo dịch vụ công dụ người dân cài đặt',d:'10/11/2026',st:'d',lv:7,tac:[24,29],ch:['dt','tn','web'],gr:[2,5],sg:[1,0],pb:3,tabs:['du-lieu-ca-nhan'],
  sum:'Người gọi tự xưng cán bộ, gửi đường dẫn và hướng dẫn cài một ứng dụng mang tên dịch vụ công. Ứng dụng đó không có trong kho ứng dụng chính thức.',
  steps:['Một người gọi điện, tự xưng cán bộ, nói hồ sơ của bạn cần cập nhật gấp.','Họ gửi đường dẫn qua tin nhắn hoặc Zalo, bảo bạn cài một ứng dụng mang tên dịch vụ công.','Ứng dụng xin quyền xem màn hình hoặc quyền can thiệp sâu vào máy, rồi bảo bạn nhập mật khẩu, mã OTP.','Trong lúc bạn làm theo, tiền trong tài khoản bị chuyển đi.']},
 {id:2,t:'Ứng dụng vay nhanh đòi nộp phí trước khi giải ngân',d:'10/11/2026',st:'d',lv:4,tac:[9,10],ch:['web','mxh'],gr:[1,5],sg:[2],pb:5,tabs:['vay-va-no'],
  sum:'Quảng cáo vay nhanh, duyệt trong vài phút. Hồ sơ được “duyệt” nhưng phải nộp phí bảo hiểm, phí xác minh trước rồi mới giải ngân.',
  steps:['Quảng cáo vay nhanh, không cần thế chấp, duyệt trong vài phút.','Ứng dụng đòi quyền vào danh bạ, hình ảnh, tin nhắn.','Hồ sơ được “duyệt”, nhưng phải nộp phí bảo hiểm, phí xác minh trước rồi mới giải ngân.','Nộp xong lại phát sinh khoản phí khác; khoản vay không về.']},
 {id:3,t:'Mời góp vốn qua ứng dụng, cam kết lợi nhuận cố định',d:'10/11/2026',st:'h',lv:3,tac:[4,7],ch:['mxh','web'],gr:[1,3],sg:[],hold:1,pb:4,tabs:[],
  sum:'Lời mời góp vốn qua một ứng dụng, hứa trả lãi cố định hằng tháng và cho rút thử một khoản nhỏ lúc đầu.',
  steps:['Một người làm quen qua mạng xã hội, kể chuyện góp vốn có lãi đều mỗi tháng.','Họ mời tải một ứng dụng hoặc vào một trang đầu tư, cho góp thử một khoản nhỏ.','Lần rút đầu tiên được trả thật, để bạn tin.','Đến khi góp số tiền lớn, ứng dụng báo lỗi rút tiền hoặc đòi thêm phí.']},
 {id:4,t:'Nhiệm vụ trực tuyến trả hoa hồng vài lần đầu rồi bắt nạp thêm',d:'10/11/2026',st:'d',lv:5,tac:[14],ch:['mxh','tn','web'],gr:[1,3],sg:[2],pb:5,tabs:[],
  sum:'Vài nhiệm vụ đầu được trả hoa hồng thật, tiền về tài khoản thật. Rồi mới đến câu quan trọng: nạp thêm để mở gói lớn hơn.',
  steps:['Tin nhắn mời làm việc trên mạng tại nhà: thả tim, đánh giá sản phẩm, nhận hoa hồng.','Vài nhiệm vụ đầu được trả tiền thật.','Họ bảo nạp tiền để mở gói nhiệm vụ lớn hơn, hoa hồng cao hơn.','Khi muốn rút, họ nói tài khoản đang bị giữ, phải nạp thêm mới rút được.']},
 {id:5,t:'Tin nhắn mạo danh ngân hàng chen vào luồng tin thật, báo tài khoản sắp bị khóa',d:'10/11/2026',st:'d',lv:7,tac:[27],ch:['tn'],gr:[5,2],sg:[0],pb:3,tabs:['du-lieu-ca-nhan'],
  sum:'Tin nhắn hiện ngay trong luồng tin của ngân hàng, kèm đường dẫn trông giống trang của ngân hàng, đòi nhập mật khẩu và mã OTP.',
  steps:['Tin nhắn hiện ngay trong luồng tin của ngân hàng, báo tài khoản sắp bị khóa hoặc cần cập nhật.','Tin nhắn kèm một đường dẫn trông giống trang của ngân hàng.','Trang đó đòi nhập tên đăng nhập, mật khẩu và mã OTP.']},
 {id:6,t:'Chuyển nhầm tiền vào tài khoản, kèm mã QR hoặc đường dẫn để hoàn lại',d:'10/11/2026',st:'d',lv:6,tac:[23],ch:['tn','dt'],gr:[4,2],sg:[],pb:9,tabs:[],
  sum:'Tài khoản tự nhiên nhận một khoản tiền lạ. Ngay sau đó có tin nhắn kèm mã QR hoặc đường dẫn, đòi bạn hoàn lại tiền theo cách họ chỉ.',
  steps:['Tài khoản của bạn tự nhiên nhận một khoản tiền lạ.','Ngay sau đó có người gọi hoặc nhắn tin, nói là chuyển nhầm.','Họ gửi mã QR, đường dẫn, hoặc đưa một số tài khoản khác, đòi bạn hoàn lại ngay, có khi đòi thêm tiền lãi.']},
 {id:7,t:'Gọi điện báo có khoản vay quá hạn mang tên bạn, đòi chuyển tiền để “tất toán”',d:'10/11/2026',st:'h',lv:4,tac:[13,12],ch:['dt'],gr:[1,2],sg:[],hold:1,pb:6,tabs:['du-lieu-ca-nhan'],
  sum:'Người gọi nói bạn có một khoản vay quá hạn mà bạn chưa từng vay, dọa gọi cho người thân, đồng nghiệp, rồi đưa một tài khoản cá nhân để chuyển tiền “tất toán”.',
  steps:['Có người gọi, nói bạn đang có một khoản vay quá hạn mà bạn chưa từng vay.','Họ dọa báo nợ xấu, gọi cho người thân, đồng nghiệp trong danh bạ.','Họ đưa một số tài khoản cá nhân, bảo chuyển tiền để “tất toán” hoặc “hủy hồ sơ”.']},
 {id:8,t:'Giới thiệu hợp đồng bảo hiểm như một khoản gửi tiết kiệm lãi cao',d:'10/11/2026',st:'h',lv:2,tac:[6,1],ch:['tt','dt'],gr:[2],sg:[],hold:1,pb:5,tabs:['bao-hiem-va-tiet-kiem'],
  sum:'Người tư vấn nói đây là “gửi tiết kiệm lãi cao”, nhưng giấy tờ đưa ký là một hợp đồng khác: thời hạn dài và có khoản phạt nếu dừng sớm.',
  steps:['Người tư vấn mời “gửi tiết kiệm lãi cao”, tại nhà hoặc tại quầy.','Giấy tờ đưa ký là một hợp đồng khác: thời hạn dài, có khoản phạt nếu dừng sớm.','Người ký chỉ biết khi muốn rút tiền trước hạn.']},
 {id:9,t:'Cuộc gọi video giả người thân, nhắn cần tiền gấp và dặn đừng hỏi ai',d:'10/11/2026',st:'h',lv:7,tac:[26,28],ch:['mxh','dt'],gr:[2],sg:[4],pb:1,tabs:['du-lieu-ca-nhan'],
  sum:'Một tài khoản mang tên, ảnh người thân gọi video rất ngắn, hình mờ. Ngay sau đó nhắn đang gặp chuyện gấp, cần chuyển tiền vào một tài khoản lạ.',
  steps:['Một tài khoản mang tên, ảnh của người thân gọi video rất ngắn, hình mờ, tiếng chập chờn.','Ngay sau đó họ nhắn tin: đang gặp chuyện gấp, cần chuyển tiền ngay vào một tài khoản lạ.','Họ dặn đừng gọi lại hay hỏi ai khác.']},
 {id:10,t:'Giả người mua, người giao hàng để chiếm tài khoản của người bán',d:'10/11/2026',st:'h',lv:7,tac:[24,27],ch:['dt','tn','san'],gr:[4],sg:[0,1],pb:3,tabs:['du-lieu-ca-nhan'],
  sum:'Người tự xưng khách mua hoặc người giao hàng gửi đường dẫn “nhận tiền”, hoặc bảo người bán đọc mã để “xác nhận đơn”.',
  steps:['Một người tự xưng khách mua hàng hoặc người giao hàng liên hệ người bán.','Họ gửi đường dẫn để “nhận tiền”, hoặc bảo người bán đọc mã để “xác nhận đơn”.','Đường dẫn trỏ tới trang giả, đòi nhập thông tin đăng nhập ngân hàng và mã OTP.']}
];
function ageDays(d){var t=parseVN(d);return t?Math.floor((Date.now()-t.getTime())/864e5):9999}
function alertLv(a){return a.sg.length?'d':'h'}
function freshAlerts(){return ALERTS.filter(function(a){return ageDays(a.d)<=90}).sort(function(a,b){return parseVN(b.d)-parseVN(a.d)})}

/* Hỏi – đáp nhanh: mỗi câu trả lời dẫn về một trang có sẵn. */
var QA=[
 {q:'Có người gọi nói tài khoản của tôi sắp bị khóa, bảo đọc mã OTP để xác minh. Tôi phải làm gì?',
  a:'Không đọc mã. Cúp máy, rồi tự gọi số in ở mặt sau thẻ hoặc tự mở ứng dụng ngân hàng để hỏi.',
  why:'Bảo bạn <b>đọc</b> hoặc <b>gửi</b> mật khẩu, mã OTP, mã PIN là một dấu hiệu phải dừng. Đừng nghe họ tự xưng là ai, hãy nhìn vào việc họ đang bảo mình làm.',
  todo:BANKA.join('<br>'),go:[['pb1','Có người đang thúc bạn làm ngay'],['pb3','Lỡ đọc mã rồi thì làm gì']]},
 {q:'Người lạ bảo tôi cài ứng dụng để được hỗ trợ. Có nên cài không?',
  a:'Không cài. Người khác gửi đường dẫn và bảo bạn cài ứng dụng là một dấu hiệu phải dừng.',
  why:'Cài công cụ điều khiển là giao cả điện thoại cho người khác. Đọc mã xác thực là giao luôn chìa khóa tài khoản. Không có cơ quan hay ngân hàng nào cần những thứ đó của mình.',
  todo:'Nếu đã cài: ngắt mạng trên điện thoại hoặc máy tính đó, tắt Wi-Fi và tắt dữ liệu di động, rồi ngừng dùng máy. Từ đây trở đi, mọi việc làm trên một thiết bị khác mà bạn tin cậy.',
  go:[['pb3','Người khác đang có quyền vào máy của bạn'],['lv7','Cuộc gọi, tin nhắn, đường dẫn và giả mạo']]},
 {q:'Người quen đầu tư lãi nhiều, rủ tôi góp vốn. Có nên theo không?',
  a:'Trước hết hỏi ba câu: lợi nhuận ở đâu ra, ai có nghĩa vụ trả tiền cho mình, và muốn rút thì rút bằng cách nào.',
  why:'Người thân quen có thể cũng đang bị dẫn. Nhiều mô hình sống được chính là nhờ người quen rủ người quen. Rút thử được một khoản nhỏ chỉ chứng minh lần rút đó đã xong; khoản trả đầu tiên thường chính là tiền mồi.',
  todo:'Dùng công cụ “Trước khi đầu tư, vay”. Không vay, không thế chấp nhà đất, không dùng tiền dưỡng già để góp.',
  go:[['cong-cu-kiem-tra.truoc-khi-dau-tu-vay','Công cụ: Trước khi đầu tư, vay'],['pb4','Có người mời bạn góp vốn, đầu tư']]},
 {q:'Ứng dụng vay đòi nộp phí trước rồi mới giải ngân. Có nên nộp?',
  a:'Chưa nộp. Xem tiền chảy về phía nào. Bạn phải nộp tiền trước thì dừng lại.',
  why:'Ba con số phải ghi ra giấy trước khi quyết: số thực nhận là tiền thật sự về tay sau khi trừ phí, bảo hiểm và khoản giữ lại; tổng phải trả gồm gốc, lãi, phí và bảo hiểm cộng lại; mỗi kỳ trả là số phải nộp mỗi lần theo lịch.',
  todo:'Với ứng dụng cho vay, xem thêm quyền mà nó đòi. Quyền nào không cần cho chức năng rõ ràng thì không cấp.',
  go:[['bk4','Kiểm tra trước khi vay'],['lv4','Vay, cho vay và bảo lãnh']]},
 {q:'Tôi lỡ chuyển tiền rồi. Bây giờ làm gì trước?',
  a:'Gọi ngay ngân hàng hoặc ví điện tử bạn đã chuyển. Làm bước này trước, rồi mới làm các bước còn lại.',
  why:'Gọi càng sớm thì ngân hàng càng có cơ hội tra soát giao dịch. Số đúng là số bạn tự lấy từ thẻ hoặc ứng dụng của chính mình.',
  todo:'Câu nói mẫu với tổng đài: “Tôi vừa chuyển tiền và nghi có rủi ro lừa đảo. Xin ghi nhận sự việc, tra soát giao dịch và hướng dẫn tôi cách bảo vệ tài khoản.”',
  go:[['pb2','Bạn vừa chuyển tiền: các bước tiếp theo'],['cong-cu-kiem-tra.khi-nghi-bi-lua','Công cụ: Khi nghi ngờ bị lừa']]},
 {q:'Có người chuyển nhầm tiền vào tài khoản tôi rồi gọi đòi lại. Tôi có nên chuyển trả ngay theo số họ đưa?',
  a:'Chưa chuyển trả theo số tài khoản người gọi đưa, và không tiêu, không rút khoản đó.',
  why:'Không quét mã QR hoặc bấm đường dẫn trong tin nhắn báo “chuyển nhầm tiền” để hoàn lại.',
  todo:'Liên hệ ngân hàng của chính bạn để báo có khoản tiền lạ, rồi chỉ hoàn trả theo đúng cách ngân hàng hướng dẫn.',
  go:[['pb9','Tự nhiên có tiền lạ chuyển vào tài khoản']]},
 {q:'Có người nhờ tôi cho mượn tài khoản ngân hàng, trả tiền công. Có sao không?',
  a:'Từ chối ngay, dù được trả tiền công.',
  why:'Không mở, cho mượn, cho thuê hay bán tài khoản ngân hàng, và không nhận chuyển tiền hộ. Đây là hành vi bị cấm, và nó kéo người đứng tên vào dòng tiền phạm pháp.',
  todo:'Nếu đã lỡ giao thẻ, SIM hoặc mã xác thực, báo cả ngân hàng và nhà mạng bằng số chính thức bạn tự tìm.',
  go:[['lv5','Việc làm, tuyển dụng và nhiệm vụ trực tuyến']]}
];

/* ============ thành phần dùng chung ============ */
function chName(k){for(var i=0;i<CHANNELS.length;i++)if(CHANNELS[i].k===k)return CHANNELS[i];return null}
function grpOfLv(cd){return GROUPS.filter(function(g){return g.tac.some(function(i){return String(TACTICS[i].cd)===String(cd)})})}
function chOfLv(cd){var s={};TACTICS.forEach(function(x,i){if(String(x.cd)===String(cd))(TCH[i]||[]).forEach(function(c){s[c]=1})});return CHANNELS.filter(function(c){return s[c.k]})}
function chips(list,cls){return '<div class="chiprow'+(cls?' '+cls:'')+'">'+list.join('')+'</div>'}
/* Chip nhóm người, kênh: mở danh sách RỦI RO đã lọc sẵn */
function grpChip(g,tab){return '<button type="button" class="gchip" data-go="cac-rui-ro.'+(tab||'lua-dao')+'" data-rf="gr:'+g.k+'">'+ic(g.i)+'<span>'+esc(g.t)+'</span></button>'}
function chChip(c,tab){return '<button type="button" class="gchip" data-go="cac-rui-ro.'+(tab||'lua-dao')+'" data-rf="ch:'+c.k+'">'+ic(c.i)+'<span>'+esc(c.t)+'</span></button>'}
function linkList(items){return '<ul class="llist">'+items.map(function(x){return '<li><button type="button" data-go="'+x[0]+'"'+(x[4]!==undefined?' data-hl="'+x[4]+'"':'')+'>'+ic(x[2]||'next')+'<span>'+esc(x[1])+(x[3]?'<small>'+esc(x[3])+'</small>':'')+'</span>'+ic('next')+'</button></li>'}).join('')+'</ul>'}
function toc(items){return '<nav class="toc" aria-label="Mục lục"><b>Trong bài này</b><ol>'+items.map(function(x){return '<li><button type="button" data-jump="'+x[0]+'">'+esc(x[1])+'</button></li>'}).join('')+'</ol></nav>'}
function crumbs(list){
  return '<nav class="crumbs" aria-label="Bạn đang ở"><ol><li><button type="button" data-go="home">Trang chủ</button></li>'+list.map(function(x){
    return '<li>'+(x[0]?'<button type="button" data-go="'+x[0]+'">'+esc(x[1])+'</button>':'<span aria-current="page">'+esc(x[1])+'</span>')+'</li>'}).join('')+'</ol></nav>';
}
function isBig(){return document.documentElement.classList.contains('big')}
/* Thanh công cụ của bài: Nghe bài viết · Chữ lớn · In · Gửi (đặc tả, mẫu trang bài viết) */
function tools(printable){
  return '<div class="tools" role="group" aria-label="Công cụ cho trang này">'+
   ('speechSynthesis' in window?'<button type="button" class="tbtn" data-act="speak" aria-pressed="false">'+ic('volume')+'<span>Nghe bài viết</span></button>':'')+
   '<button type="button" class="tbtn" data-act="tsz" aria-pressed="'+isBig()+'"><b class="aa" aria-hidden="true">A+</b><span>Chữ lớn</span></button>'+
   (printable&&STANDALONE?'<button type="button" class="tbtn" data-print>'+ic('print')+'<span>In</span></button>':'')+
   '<button type="button" class="tbtn" data-act="sharepage" aria-expanded="false" aria-controls="sharep">'+ic('share')+'<span>Gửi</span></button></div>'+
   '<p class="okmsg" id="pagemsg" hidden></p><div class="sharep" id="sharep" hidden></div>';
}
function minutes(html){var n=String(html).replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;return Math.max(1,Math.round(n/180))}
function lvlChip(k,pre){return '<span class="lvl lv-'+k+'">'+ic(STATE[k].ic)+'<span>'+(pre?esc(pre):'')+LEVEL[k]+'</span></span>'}
/* Khối kết quả dùng chung cho trình hỏi và các công cụ: nhãn của đặc tả đứng trên, câu của Điều 8 đứng dưới */
function resBox(k,big,reasons,extra){
  var s=STATE[k];
  return '<div class="res-state rs-'+k+'" role="status"><p class="rs-big">'+ic(s.ic)+'<b>'+big+'</b></p>'+
    '<p class="rs-lab"><span class="stchip st-'+k+'">'+s.lab+'</span></p><p class="rs-txt">'+s.txt+'</p>'+
    (reasons&&reasons.length?'<div class="rs-why"><b>Vì sao</b><ul>'+reasons.map(function(r){return '<li>'+r+'</li>'}).join('')+'</ul></div>':'')+(extra||'')+'</div>';
}
function resNotes(){return '<div class="resnotes"><p><b>'+RESNOTE+'</b></p><p>'+NOTCONC+'</p></div>'}
function principles(h2){
  return '<div class="princ"'+(h2?'':' role="list"')+'>'+PRINC.map(function(p){return '<div class="pr"'+(h2?'':' role="listitem"')+'>'+spot(p[0],'s')+'<span><b>'+esc(p[1])+'</b><small>'+esc(p[2])+'</small></span></div>'}).join('')+'</div>';
}
function princSec(id){
  return '<section class="sec" aria-labelledby="'+id+'"><h2 id="'+id+'">Bốn việc không làm khi nghi ngờ</h2>'+principles()+
   '<p class="srcnote">Rút từ “Năm việc phải chặn ngay” của <button type="button" data-go="doc1">Bài đọc Chuyên đề 1</button> và bước 1 của trang “Có người đang thúc bạn làm ngay”.</p></section>';
}
function helpBlock(full){
  return '<section class="sec" aria-labelledby="h-help"><h2 id="h-help">Khi cần hỗ trợ</h2>'+
   '<div class="helpa"><h3>Cách tự tìm số ngân hàng của bạn</h3><ul class="facts">'+BANKA.map(function(r,i){return '<li class="fact">'+spot(['card','app','x'][i],i===2?'s':'')+'<span>'+r+'</span></li>'}).join('')+'</ul>'+
   '<p class="small">'+BANKANOTE+'</p></div>'+
   '<div class="helpb"><h3>Số do Nhà nước vận hành</h3><div class="nums three">'+
    num('113',false,['GỌI'],'Chỉ khi có nguy hiểm tức thời hoặc cần Cảnh sát đến ngay.',[['tel:113','Gọi 113']])+
    num('156',false,['GỌI','NHẮN TIN'],'Phản ánh cuộc gọi, tin nhắn rác hoặc có dấu hiệu lừa đảo. Gọi và nhắn tin đều miễn phí.'+(full?' Cú pháp nhắn tin: cuộc gọi lừa đảo <b>LD [số điện thoại] [nội dung]</b> · cuộc gọi rác <b>V [số điện thoại] [nội dung]</b> · tin nhắn rác <b>S [số điện thoại] [nội dung]</b>.':' Nhắn tin theo cú pháp <b>LD [số điện thoại] [nội dung]</b>.'),[['tel:156','Gọi'],['sms:156','Nhắn tin']])+
    num('5656',false,['CHỈ NHẮN TIN'],'Phản ánh qua tin nhắn, miễn phí, cùng cú pháp như 156. Không phải số để gọi.',[['sms:5656','Nhắn tin']])+
   '</div>'+revline('Kiểm tra gần nhất',REVIEW.nums.rev)+'</div></section>';
}
var TOOLLIST=[
 ['truoc-khi-chuyen-tien','Trước khi chuyển tiền','money','5 câu hỏi trước khi bấm chuyển. Biết nên dừng lại, kiểm tra thêm, hay chưa thấy điểm dừng.'],
 ['truoc-khi-dau-tu-vay','Trước khi đầu tư, vay','chart','5 câu hỏi trước khi góp vốn, đầu tư hoặc ký khoản vay.'],
 ['khi-nghi-bi-lua','Khi nghi ngờ bị lừa','alert','4 câu hỏi để biết việc nào phải làm trước, theo đúng thứ tự.']
];
function toolCards(){
  return '<div class="tcards">'+TOOLLIST.map(function(t,i){return '<button type="button" class="tcard'+(i===2?' t-urg':'')+'" data-go="cong-cu-kiem-tra.'+t[0]+'">'+
    '<span class="tc-img">'+pic(TOOLIMG[i],{alt:'',minw:768,sizes:'(min-width:1025px) 370px, 33vw'})+'</span>'+spot(t[2],i===2?'s':'')+
    '<span class="tc-b"><b>'+esc(t[1])+'</b><span>'+esc(t[3])+'</span></span><span class="tc-go">Bắt đầu'+ic('next')+'</span></button>'}).join('')+'</div>';
}

/* ============ TRANG CHỦ: năm khối theo đặc tả (đầu trang và chân trang nằm ngoài) ============ */
function vHome(){
  var h='';
  /* Khối KHẨN CẤP */
  h+='<section class="hero-k" aria-labelledby="h-home"><div class="hk-main"><p class="eyebrow">'+ic('alert')+'KHẨN CẤP</p>'+
    '<h1 id="h-home" tabindex="-1">Bạn vừa nhận tin nhắn, cuộc gọi hoặc lời mời đáng ngờ?</h1>'+
    '<p class="hk-lead">Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay.</p>'+
    '<div class="hk-cta"><button type="button" class="btn red big" data-go="khan-cap.kiem-tra">'+ic('quiz')+'Chuyện gì đây???</button>'+
    '<button type="button" class="btn line big" data-urgent>Xem việc cần làm ngay'+ic('next')+'</button></div></div>'+
    '<div class="hk-img">'+pic('01',{minw:1025,sizes:'440px',eager:true})+'<span class="ailab">'+AILABEL+'</span></div>'+
    '<div class="hk-pr"><p class="hk-prh">Trong lúc chưa rõ, nhớ bốn điều:</p>'+principles()+'</div></section>';
  /* Khối CÔNG CỤ KIỂM TRA */
  h+='<section class="sec hblock" aria-labelledby="h-tools"><div class="hbh"><h2 id="h-tools">CÔNG CỤ KIỂM TRA</h2><button type="button" class="more" data-go="cong-cu-kiem-tra">Tất cả công cụ kiểm tra'+ic('next')+'</button></div>'+toolCards()+'</section>';
  /* Khối RỦI RO */
  h+='<section class="sec hblock" aria-labelledby="h-risk"><div class="hbh"><h2 id="h-risk">RỦI RO</h2><button type="button" class="more" data-go="cac-rui-ro">Xem tất cả'+ic('next')+'</button></div>'+
    '<div class="rtiles">'+RTABS.slice(1).map(function(t){return '<button type="button" class="rtile" data-go="cac-rui-ro.'+t.k+'"><span class="rt-img">'+pic(TABIMG[t.k],{alt:'',sizes:'(min-width:1025px) 200px, (min-width:768px) 18vw, 72px'})+'</span>'+'<b>'+esc(t.t)+'</b><small>'+esc(t.s)+'</small><span class="rt-n">'+tabCount(t.k)+' bài</span></button>'}).join('')+'</div></section>';
  /* Khối CẢNH BÁO: tối đa 3 mục trong 90 ngày; không có thì khối tự ẩn (Điều 20) */
  var fresh=freshAlerts().slice(0,3);
  if(fresh.length)h+='<section class="sec hblock" aria-labelledby="h-cb"><div class="hbh"><h2 id="h-cb" class="h-img"><span class="hh-img">'+pic('18',{alt:'',sizes:'48px'})+'</span>CẢNH BÁO</h2><button type="button" class="more" data-go="cac-rui-ro.canh-bao">Xem tất cả cảnh báo'+ic('next')+'</button></div>'+
    '<div class="rlist">'+fresh.map(function(a){return rCard(itemOfAlert(a))}).join('')+'</div></section>';
  return {html:h,nav:''};
}

/* ============ KHẨN CẤP ============ */
var SITORDER=['8','2','3','6','5','9','1','4','7'];
function vKhancap(open){
  var h=crumbs([[null,'KHẨN CẤP']])+pageh('KHẨN CẤP','Nhận được cuộc gọi, tin nhắn, lời mời đáng ngờ, hoặc đã lỡ làm theo? Bắt đầu từ đây.',null,'alert','s')+
   '<section class="kcta" aria-labelledby="h-wz">'+spot('quiz','s')+'<div><h2 id="h-wz">Chuyện gì đây???</h2><p>Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay. Không cần đăng nhập, không lưu câu trả lời.</p></div>'+
   '<button type="button" class="btn red" data-go="khan-cap.kiem-tra">Bắt đầu'+ic('next')+'</button></section>'+
   princSec('h-pr')+
   '<section class="sec" id="viec-can-lam" aria-labelledby="h-vcl"><h2 id="h-vcl">Việc cần làm ngay</h2><p class="small">Chọn ô gần đúng nhất. Việc cần làm đi theo điều đã xảy ra, bạn không cần kể đúng câu chuyện.</p>'+
   '<div class="doors" role="group" aria-label="Chọn tình thế của bạn">'+doorBtn(1)+doorBtn(2)+doorBtn(3)+'</div><div id="subpanel" hidden></div>'+
   '<button type="button" class="nomatch" data-go="pb0">'+ic('question')+'<span>Không ô nào giống trường hợp của tôi<small>Trả lời vài câu hỏi ngắn</small></span>'+ic('next')+'</button>'+
   '<p class="helper">'+ic('users')+'<span>Đang giúp người thân, hay xử lý việc của cửa hàng? Chọn theo điều đã xảy ra với người đó.</span></p></section>'+
   '<section class="sec" aria-labelledby="h-sit">'+peek('pk-sit','9 tình huống điển hình','Mở danh sách đầy đủ các trang việc cần làm',
     '<ul class="sitlist">'+SITORDER.map(function(k){return '<li><button type="button" data-go="pb'+k+'">'+ic(PBICON[k])+'<span>'+esc(PB[k].title)+'</span>'+ic('next')+'</button></li>'}).join('')+'</ul>'+
     '<p class="small">Một sự việc có thể gồm nhiều tình huống cùng lúc. Mỗi trang đều có lối sang tình huống liên quan.</p>').replace('<button type="button" class="peekbtn"','<button type="button" class="peekbtn" id="h-sit"')+'</section>'+
   helpBlock(false)+
   '<div class="btnrow"><button type="button" class="btn ghost sm" data-go="lien-he">'+ic('call')+'Liên hệ đúng nơi</button><button type="button" class="btn ghost sm" data-go="cong-cu-kiem-tra.khi-nghi-bi-lua">'+ic('alert')+'Công cụ: Khi nghi ngờ bị lừa</button></div>'+
   '<p class="pbfoot">'+NOTPOLICE+'</p>';
  return {html:h,nav:'khan-cap',after:open?function(){var b=VIEW.querySelector('.door[data-door="'+open+'"]');if(b)openDoor(b)}:null};
}

/* ---- Trình hỏi “Chuyện gì đây???”: ba bước, mỗi bước một câu (đặc tả) ----
   Kết quả theo cây quyết định của Điều 17: có một dấu hiệu phải dừng là DỪNG ngay; chọn “Tôi chưa biết” thì HOÃN, không DỪNG. */
var WZCH=[
 {v:'dt',t:'Cuộc gọi',i:'call'},
 {v:'tn',t:'SMS, Zalo, WhatsApp',i:'chat'},
 {v:'mail',t:'Thư điện tử',i:'mail'},
 {v:'mxh',t:'Facebook, TikTok, YouTube',i:'users'},
 {v:'web',t:'Website, quảng cáo',i:'globe'},
 {v:'tt',t:'Người quen giới thiệu',i:'person'}
];
var WZRQ=[
 {v:'otp',t:'Đọc hoặc gửi mã OTP, mật khẩu, mã PIN',i:'key',k:'d',sg:0},
 {v:'app',t:'Cài ứng dụng, hoặc cho họ xem, điều khiển màn hình',i:'app',k:'d',sg:1},
 {v:'id',t:'Gửi ảnh giấy tờ, quét khuôn mặt',i:'face',k:'d',sg:3,hint:'Bạn tự mở ứng dụng của mình cho việc do chính bạn bắt đầu thì không chọn dòng này.'},
 {v:'acct',t:'Cho mượn, cho thuê, mở hộ tài khoản ngân hàng, SIM, hoặc nhận chuyển tiền hộ',i:'bank',k:'d',rf:1},
 {v:'money',t:'Chuyển tiền, đặt cọc, nộp phí',i:'money',k:'h'},
 {v:'link',t:'Bấm vào đường dẫn, quét mã QR họ gửi',i:'link',k:'h'}
];
var WZPR=[
 {v:'held',t:'Nói tiền hoặc hàng của bạn đang bị giữ, phải nộp phí mới lấy được',i:'lock',k:'d',sg:2},
 {v:'rush',t:'Bắt quyết định ngay, giữ bí mật, không cho hỏi người thân',i:'hush',k:'d',sg:4},
 {v:'nocall',t:'Không cho bạn tự gọi lại số chính thức hoặc tự mở website chính thức',i:'call',k:'d',sg:5},
 {v:'threat',t:'Dọa bạn dính vào vụ án, bị phạt, bị khóa tài khoản',i:'alert',k:'h'},
 {v:'profit',t:'Hứa lợi nhuận cao, hoa hồng, việc nhẹ lương cao, vay dễ, trúng thưởng',i:'gift',k:'h'},
 {v:'relative',t:'Tự xưng người thân, người quen đang cần tiền gấp',i:'users',k:'h'}
];
var HOLDTXT={money:'Họ yêu cầu chuyển tiền, đặt cọc hoặc nộp phí.',link:'Họ gửi đường dẫn hoặc mã QR và bảo bạn bấm, quét.',
 threat:'Họ dọa bạn sắp mất: dính án, bị phạt, bị khóa tài khoản.',profit:'Họ hứa cho bạn được nhiều hơn: lãi cao, hoa hồng, việc nhẹ lương cao, vay dễ, trúng thưởng.',
 relative:'Họ đóng vai người thân, người quen đang cần tiền gấp.',unk:'Bạn chưa biết chắc họ đã yêu cầu hoặc hứa hẹn những gì.'};
/* Bảng ánh xạ tình huống: [chỉ số thủ đoạn, kênh, các lựa chọn liên quan]. Tên tình huống là tên thủ đoạn đã thẩm định. */
var WZRULES=[
 [24,['dt','tn'],['otp','app','money','link','threat','rush','nocall']],
 [25,['dt','mxh'],['money','app','threat','rush','nocall']],
 [29,['dt','web','tn'],['app','otp','threat']],
 [27,['tn','mail'],['link','otp','threat']],
 [28,['mxh','tn'],['money','otp','relative']],
 [26,['dt','mxh','tn'],['money','relative','rush']],
 [30,['tt','dt'],['money','threat']],
 [14,['mxh','tn','web'],['money','profit','held']],
 [18,['tn','web','mxh'],['app','link','profit']],
 [17,['mxh','tn','tt'],['acct','profit']],
 [15,['mxh','tt'],['money','id','profit']],
 [4,['mxh','web','tt'],['money','app','link','profit']],
 [7,['web','mxh'],['money','held']],
 [5,['mxh','tt'],['money','profit']],
 [9,['web','mxh','tn'],['app','id','money','profit']],
 [12,['dt','tn'],['money','threat']],
 [13,['dt'],['money','threat','id']],
 [11,['mxh','tt'],['id','acct','relative']],
 [19,['web','mxh'],['money','link']],
 [23,['tn','dt'],['money','link','threat']],
 [22,['tn','tt'],['money']],
 [21,['tt'],['money','rush','profit']],
 [8,['tt','mxh','web'],['money','profit','rush']]
];
var WZ={step:0,ch:'',rq:[],pr:[]};
function wzReset(){WZ={step:0,ch:'',rq:[],pr:[]}}
function vWizard(){
  wzReset();
  return {html:crumbs([['khan-cap','KHẨN CẤP'],[null,'Chuyện gì đây???']])+pageh('Chuyện gì đây???','Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay.','KHẨN CẤP','quiz','s')+
   '<p class="privacy">'+ic('lock')+'<span>Không cần đăng nhập. Câu trả lời không được lưu và không gửi đi đâu. Đừng nhập số điện thoại, số tài khoản hay tên riêng ở bất kỳ đâu.</span></p><div id="wzbody" class="wzbody"></div>',nav:'khan-cap',after:wzPaint};
}
function wzOpt(kind,o,sel,multi){
  return '<button type="button" class="wopt'+(o.v==='none'||o.v==='unk'||o.v==='x'?' wo-alt':'')+'" data-wz="'+kind+'" data-v="'+o.v+'" aria-pressed="'+sel+'">'+ic(o.i)+
    '<span>'+esc(o.t)+(o.hint?'<small>'+esc(o.hint)+'</small>':'')+'</span>'+(multi?'<i class="wck" aria-hidden="true">'+ic('check')+'</i>':'')+'</button>';
}
function wzPaint(){
  var b=document.getElementById('wzbody');if(!b)return;
  var s=WZ.step,h='<div class="wzstep"><div class="wzprog" aria-hidden="true">'+[0,1,2].map(function(i){return '<i class="'+(i<s?'done':(i===s?'on':''))+'"></i>'}).join('')+'</div><p class="ktpos">Câu '+(s+1)+' / 3</p>';
  if(s===0){
    h+='<h2>Họ liên hệ với bạn qua đâu?</h2><p class="small">Chọn một dòng.</p><div class="wopts" role="group" aria-label="Kênh liên hệ">'+
      WZCH.map(function(o){return wzOpt('ch',o,WZ.ch===o.v)}).join('')+wzOpt('ch',{v:'x',t:'Kênh khác, hoặc không nhớ',i:'question'},WZ.ch==='x')+'</div>';
  }else{
    var list=s===1?WZRQ:WZPR,kind=s===1?'rq':'pr',arr=WZ[kind];
    h+=(s===1?'<h2>Họ yêu cầu bạn làm gì?</h2>':'<h2>Họ hứa hẹn hoặc đe dọa điều gì?</h2>')+'<p class="small">Chọn tất cả những dòng đúng. Không chắc thì chọn “Tôi chưa biết”.</p>'+
      '<div class="wopts" role="group" aria-label="'+(s===1?'Họ yêu cầu':'Họ hứa hẹn, đe dọa')+'">'+list.map(function(o){return wzOpt(kind,o,arr.indexOf(o.v)>-1,1)}).join('')+
      wzOpt(kind,{v:'none',t:s===1?'Chưa yêu cầu gì cụ thể':'Không hứa hẹn, không đe dọa gì',i:'check'},arr.indexOf('none')>-1,1)+
      wzOpt(kind,{v:'unk',t:'Tôi chưa biết, không nhớ rõ',i:'question'},arr.indexOf('unk')>-1,1)+'</div>';
  }
  h+='<p class="err" id="wzerr" hidden></p><div class="wznav">'+
    (s>0?'<button type="button" class="btn ghost" data-wz="back">'+ic('back')+'Quay lại</button><button type="button" class="btn pri" data-wz="next">'+(s===2?'Xem kết quả':'Tiếp tục')+ic('next')+'</button>':'<button type="button" class="btn ghost" data-go="khan-cap">'+ic('back')+'Về KHẨN CẤP</button>')+'</div></div>';
  b.innerHTML=h;
  if(s>0)bodyTop(b);
  var f=b.querySelector('h2');if(f){f.setAttribute('tabindex','-1');try{f.focus({preventScroll:true})}catch(e){}}
}
function wzAct(kind,v,el){
  if(kind==='ch'){WZ.ch=v;WZ.step=1;wzPaint();return}
  if(kind==='rq'||kind==='pr'){
    var a=WZ[kind],i=a.indexOf(v);
    if(i>-1)a.splice(i,1);
    else if(v==='none'||v==='unk')WZ[kind]=a=[v];
    else{a=a.filter(function(x){return x!=='none'&&x!=='unk'});a.push(v);WZ[kind]=a}
    VIEW.querySelectorAll('[data-wz="'+kind+'"]').forEach(function(b){b.setAttribute('aria-pressed',String(WZ[kind].indexOf(b.dataset.v)>-1))});
    var er=document.getElementById('wzerr');if(er)er.hidden=true;return;
  }
  if(kind==='back'){if(WZ.step>0)WZ.step--;wzPaint();return}
  if(kind==='edit'){WZ.step=2;wzPaint();return}
  if(kind==='next'){
    var arr=WZ[WZ.step===1?'rq':'pr'];
    if(!arr.length){var e=document.getElementById('wzerr');e.textContent='Chọn ít nhất một dòng. Không chắc thì chọn “Tôi chưa biết”.';e.hidden=false;return}
    if(WZ.step<2){WZ.step++;wzPaint();return}
    wzResult();return;
  }
  if(kind==='again'){wzReset();wzPaint();jump0();return}
}
function wzCompute(){
  var chosen=WZRQ.filter(function(o){return WZ.rq.indexOf(o.v)>-1}).concat(WZPR.filter(function(o){return WZ.pr.indexOf(o.v)>-1}));
  var stops=chosen.filter(function(o){return o.k==='d'}),holds=chosen.filter(function(o){return o.k==='h'});
  var unk=WZ.rq.indexOf('unk')>-1||WZ.pr.indexOf('unk')>-1;
  var k=stops.length?'d':((holds.length||unk)?'h':'n');
  var keys=chosen.map(function(o){return o.v});
  var sit=WZRULES.map(function(r,ix){var m=r[2].filter(function(x){return keys.indexOf(x)>-1}).length,c=r[1].indexOf(WZ.ch)>-1;return {t:r[0],s:m?m*2+(c?3:0):0,ix:ix}})
    .filter(function(x){return x.s>0}).sort(function(a,b){return b.s-a.s||a.ix-b.ix}).slice(0,3).map(function(x){return x.t});
  var signs=stops.map(function(o){return o.rf?REFUSE:SIGNS[o.sg][1]}).concat(holds.map(function(o){return HOLDTXT[o.v]}));if(unk)signs.push(HOLDTXT.unk);
  return {k:k,stops:stops,holds:holds,unk:unk,sit:sit,signs:signs.slice(0,3),keys:keys};
}
/* Đưa phần câu hỏi hoặc kết quả lên đầu màn hình (trừ chiều cao đầu trang dính) */
function bodyTop(el){try{el.scrollIntoView({block:'start'})}catch(e){}}
function pbS(p,i){return PB[p].blocks[i].s}
function wzActions(r){
  var has=function(v){return r.keys.indexOf(v)>-1},a;
  if(r.k==='d')a=[pbS(1,0),pbS(1,1),has('acct')?REFUSE:(has('threat')||has('rush')?pbS(8,1):pbS(1,3)),(WZ.ch==='dt'||WZ.ch==='tn')?pbS(1,5):pbS(1,4)];
  else if(r.k==='h')a=[pbS(1,1),has('money')?pbS(1,2):pbS(1,0),pbS(7,0),pbS(1,3)];
  else a=[pbS(7,0),pbS(7,1),pbS(1,3)];
  return a.slice(0,4);
}
function wzShareText(r){
  return 'Mình vừa tự kiểm tra một cuộc liên hệ đáng ngờ trên antoantaichinh.vn. Mức độ cần thận trọng: '+LEVEL[r.k]+' ('+STATE[r.k].lab+'). '+STATE[r.k].txt+
    ' Việc cần làm ngay: '+wzActions(r).map(function(x,i){return (i+1)+') '+x}).join(' ')+' '+RESNOTE;
}
function wzResult(){
  var b=document.getElementById('wzbody'),r=wzCompute(),sitTac=r.sit.map(function(i){return TACTICS[i]});
  var first=sitTac.length?'lv'+sitTac[0].cd:'pb1',hl=r.sit.length?r.sit[0]:undefined;
  var cdk=sitTac.length&&BK[sitTac[0].cd]?sitTac[0].cd:(r.k==='n'?'1':'7');
  var pk=docPart('1','pocket');
  var h='<div class="wres">'+
   '<section class="wr wr-lvl" aria-labelledby="wr1">'+resBox(r.k,'<span id="wr1">Mức độ cần thận trọng: '+LEVEL[r.k]+'</span>',null,r.k==='n'?'<p class="rs-more">Không thấy dấu hiệu nào không có nghĩa là an toàn. Vẫn tự kiểm tra bằng kênh do chính bạn tìm ra trước khi đưa tiền hay thông tin.</p>':'')+'</section>'+
   '<section class="wr" aria-labelledby="wr2"><h2 id="wr2">Tình huống gần giống</h2>'+
    (sitTac.length?'<ul class="llist sit">'+r.sit.map(function(i){var x=TACTICS[i];return '<li><button type="button" data-go="lv'+x.cd+'" data-hl="'+i+'">'+ic(LVICON[x.cd])+'<span>'+esc(x.t)+'<small>'+esc(CDSHORT[x.cd])+'</small></span>'+ic('next')+'</button></li>'}).join('')+'</ul>'+
      '<p class="small">Đây là ví dụ để bạn đối chiếu, không phải kết luận về việc bạn đang gặp.</p>':
      '<p>Chưa có tình huống mẫu khớp với lựa chọn của bạn. Điều đó <b>không có nghĩa là an toàn</b>. Trong lúc chưa rõ, nhớ bốn điều:</p>'+principles())+'</section>'+
   (r.signs.length?'<section class="wr" aria-labelledby="wr3"><h2 id="wr3">Dấu hiệu cần chú ý</h2><ul class="stopl">'+r.signs.map(function(s,i){return '<li>'+ic(i<r.stops.length?'stop':'clock')+'<span>'+s+'</span></li>'}).join('')+'</ul></section>':'')+
   '<section class="wr" aria-labelledby="wr4"><h2 id="wr4">Việc cần làm ngay</h2><ol class="wacts">'+wzActions(r).map(function(x,i){return '<li><b>'+(i+1)+'</b><span>'+esc(x)+'</span></li>'}).join('')+'</ol>'+
    '<h3 class="h3">Nếu bạn đã lỡ làm theo</h3>'+linkList([['pb3','Đã đọc mã OTP, đưa mật khẩu, cài ứng dụng','key'],['pb2','Đã chuyển tiền hoặc giao hàng đi','money'],['pb6','Đã gửi ảnh giấy tờ, quét khuôn mặt, ký giấy','id']].concat(r.keys.indexOf('threat')>-1||r.keys.indexOf('rush')>-1?[['pb8','Đang bị đe dọa, ép buộc','alert']]:[]))+'</section>'+
   '<div class="printonly"><h2>Kiểm tra bỏ túi</h2><ul class="pchk">'+pk[3].map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul><h2>Bốn việc không làm khi nghi ngờ</h2><ul class="pchk">'+PRINC.map(function(p){return '<li><b>'+esc(p[1])+'.</b> '+esc(p[2])+'</li>'}).join('')+'</ul></div>'+
   '<div class="wr-cta">'+
    '<button type="button" class="btn pri" data-go="'+first+'"'+(hl!==undefined?' data-hl="'+hl+'"':'')+'>'+ic('book')+'Đọc bài chi tiết</button>'+
    (STANDALONE?'<button type="button" class="btn ghost" data-print>'+ic('print')+'Tải bản kiểm tra PDF</button>':'<button type="button" class="btn ghost" data-go="bk'+cdk+'">'+ic('quiz')+'Mở phần kiểm tra</button>')+
    '<button type="button" class="btn ghost" data-act="sharetext" aria-expanded="false" aria-controls="sharep">'+ic('share')+'Gửi cho người thân</button>'+
    '<button type="button" class="btn ghost" data-wz="again">'+ic('refresh')+'Kiểm tra lại</button></div>'+
   (STANDALONE?'<p class="small noprint">Nút “Tải bản kiểm tra PDF” mở hộp thoại in. Chọn “Lưu thành PDF” để lưu về máy.</p>':'')+
   '<p class="okmsg" id="pagemsg" hidden></p><div class="sharep" id="sharep" hidden data-text="'+esc(wzShareText(r))+'"></div>'+
   '<button type="button" class="more noprint" data-wz="edit">'+ic('back')+'Sửa câu trả lời</button>'+
   resNotes()+'</div>';
  b.innerHTML=h;bodyTop(b);
  var s=b.querySelector('.res-state');if(s){s.setAttribute('tabindex','-1');try{s.focus({preventScroll:true})}catch(e){}}
}
/* ============ CÔNG CỤ KIỂM TRA ============ */
function vCongcu(){
  var h=crumbs([[null,'CÔNG CỤ KIỂM TRA']])+pageh('CÔNG CỤ KIỂM TRA','Tự kiểm tra trước khi chuyển tiền, đầu tư, vay, hoặc khi nghi mình bị lừa. Không cần đăng nhập, không lưu câu trả lời.',null,'quiz')+
   '<section class="sec" aria-labelledby="h-t3"><h2 id="h-t3">Ba công cụ tự kiểm tra</h2>'+toolCards()+'</section>'+
   '<section class="sec" aria-labelledby="h-ck"><h2 id="h-ck">Kiểm tra theo việc sắp làm</h2>'+
   '<p class="small">Mỗi mục kiểm tra có hai phần: năm việc phải chặn ngay và phần kiểm tra bỏ túi, lấy nguyên văn từ bài đọc chuyên đề. '+(STANDALONE?'Mỗi trang có nút In để in hoặc lưu thành PDF.':'Bản trên website có nút In để in hoặc lưu thành PDF.')+'</p>'+
   '<div class="cklist">'+Object.keys(BK).map(function(n){return '<button type="button" class="ckitem" data-go="bk'+n+'">'+spot(BK[n].i,n==='8'?'s':'')+'<span><b>'+esc(BK[n].t)+'</b><small>Chuyên đề '+n+(n==='8'?' · sau sự cố':'')+'</small></span>'+ic('next')+'</button>'}).join('')+'</div></section>'+
   '<section class="sec" aria-labelledby="h-kn"><h2 id="h-kn">Kiểm tra kiến thức</h2><div class="cards">'+
     '<button type="button" class="card" data-go="thu0">'+spot('question')+'<span class="ct"><b>Thử sức: 8 câu</b><span>Mỗi chuyên đề một câu, chọn xong là có giải thích.</span></span>'+ic('next','go')+'</button>'+
     '<button type="button" class="card" data-go="thi">'+spot('book')+'<span class="ct"><b>Tự luyện '+bankCounts()+' câu</b><span>Toàn bộ ngân hàng câu hỏi 8 chuyên đề. Không tính điểm, không lưu bài.</span></span>'+ic('next','go')+'</button>'+
     (DK().length?'<button type="button" class="card" data-go="thidn">'+spot('brief')+'<span class="ct"><b>Dành cho nhân viên doanh nghiệp</b><span>'+dnCounts()+' câu tình huống về giao dịch, hợp đồng của doanh nghiệp.</span></span>'+ic('next','go')+'</button>':'')+
     (ACTIVITY.on?'<button type="button" class="card" data-go="hoat-dong">'+spot(ACTIVITY.i,'h')+'<span class="ct"><b>'+esc(ACTIVITY.t)+'</b><span>'+esc(ACTIVITY.full)+'. Không thu phí.</span></span>'+ic('next','go')+'</button>':'')+
   '</div></section>';
  return {html:h,nav:'cong-cu-kiem-tra'};
}

/* ---- Hai công cụ hỏi từng câu: cây quyết định, ba kết quả, không đếm dấu hiệu (Điều 17) ----
   k:'stop' — dấu hiệu phải dừng: “Có” là kết luận ngay, “Tôi chưa biết” là hoãn.
   k:'hold' — dấu hiệu phải hoãn: “Có” hoặc “Tôi chưa biết” là hoãn.
   k:'check' — việc tự kiểm tra: “Chưa” hoặc “Tôi chưa biết” là hoãn. */
var TQ={
 'truoc-khi-chuyen-tien':{t:'Trước khi chuyển tiền',i:'money',lead:'5 câu hỏi về khoản tiền bạn sắp chuyển. Mỗi lần một câu. Không chắc thì chọn “Tôi chưa biết”.',
  res:{d:'Cần dừng lại',h:'Cần kiểm tra thêm',n:'Chưa phát hiện điểm dừng'},bk:'6',
  q:[
   {k:'stop',q:'Khoản tiền này là <b>phí</b> để lấy lại tiền hoặc hàng <b>đang bị giữ</b>: phí rút tiền, phí mở khóa, tiền xác minh, tiền bảo lãnh?'},
   {k:'stop',q:'Người nhận bắt bạn chuyển ngay, giữ bí mật, hoặc không cho hỏi người thân?'},
   {k:'stop',q:'Họ cản bạn tự gọi lại số chính thức hoặc tự mở website chính thức để hỏi?'},
   {k:'hold',q:'Tiền chuyển tới một tài khoản cá nhân, hoặc tên chủ tài khoản không khớp với bên bạn đang giao dịch?',sub:'Tên khớp cũng không chứng minh yêu cầu là thật. Kẻ lừa đảo có thể dùng tài khoản mang đúng tên một doanh nghiệp có thật.'},
   {k:'check',q:'Bạn đã <b>tự liên hệ lại</b> bằng số điện thoại hoặc địa chỉ do chính bạn tìm ra chưa?',sub:'Số in trên thẻ, ứng dụng bạn đã tự cài và vẫn dùng, địa chỉ bạn tự nhập. Không phải số hay đường dẫn do người kia đưa.',
    opts:[['y','Rồi'],['self','Việc này do chính tôi bắt đầu, trên ứng dụng tôi vẫn dùng, thông tin đều khớp'],['n','Chưa'],['u','Tôi chưa biết']]}
  ]},
 'truoc-khi-dau-tu-vay':{t:'Trước khi đầu tư, vay',i:'chart',lead:'5 câu hỏi trước khi góp vốn, đầu tư hoặc ký khoản vay. Mỗi lần một câu. Không chắc thì chọn “Tôi chưa biết”.',
  res:{d:'Không nên tham gia',h:'Rủi ro cao',n:'Cần thẩm định kỹ'},bk:'3',
  q:[
   {k:'stop',q:'Bạn bị bắt <b>nộp phí trước</b> — phí giải ngân, phí rút tiền, phí mở khóa, phí nâng gói — mới được nhận khoản vay hoặc mới rút được tiền?',sub:'Xem tiền chảy về phía nào. Bạn phải nộp tiền trước thì dừng lại.'},
   {k:'stop',q:'Họ thúc bạn quyết định ngay, giữ bí mật, hoặc không cho hỏi người thân?'},
   {k:'hold',q:'Họ cam kết lợi nhuận cao, đều đặn, nói “không thể thua lỗ”, hoặc trả thưởng theo số người bạn rủ thêm?'},
   {k:'check',q:'Bạn đã trả lời được rõ ràng các câu phải hỏi chưa?',sub:'<b>Đầu tư:</b> lợi nhuận ở đâu ra, ai có nghĩa vụ trả tiền cho mình, muốn rút thì rút bằng cách nào. <b>Vay:</b> mình nhận về bao nhiêu, tổng cộng phải trả bao nhiêu, mỗi kỳ trả bao nhiêu.',
    opts:[['y','Rồi, đã rõ'],['n','Chưa rõ'],['u','Tôi chưa biết']]},
   {k:'check',q:'Bạn đã kiểm tra bên mời có <b>giấy phép</b> làm đúng loại dịch vụ này chưa — không chỉ có đăng ký doanh nghiệp?',
    opts:[['y','Rồi'],['n','Chưa'],['u','Tôi chưa biết']]}
  ]}
};
var TS={id:'',i:0,ans:{}};
var PRIVACY='<p class="privacy">'+ic('lock')+'<span>Không cần đăng nhập. Câu trả lời không được lưu và không gửi đi đâu. Không cần nhập tên, số điện thoại hay số tài khoản.</span></p>';
function vTool(id){
  if(id==='khi-nghi-bi-lua')return vTool3();
  var T=TQ[id];if(!T)return vCongcu();
  TS={id:id,i:0,ans:{}};
  var h=crumbs([['cong-cu-kiem-tra','CÔNG CỤ KIỂM TRA'],[null,T.t]])+pageh(T.t,T.lead,'Công cụ tự kiểm tra',T.i)+PRIVACY+
   (id==='truoc-khi-dau-tu-vay'?'<div class="note b"><b>Website không tư vấn tài chính</b><p>'+NOADVICE+'</p></div><div class="must"><b>Hai điều phải nhớ trước khi trả lời</b><ul>'+MUST.map(function(m){return '<li>'+m+'</li>'}).join('')+'</ul></div>':'')+
   '<div id="tsbody" class="ktbody"></div>';
  return {html:h,nav:'cong-cu-kiem-tra',after:tsPaint};
}
function tsPaint(){
  var b=document.getElementById('tsbody');if(!b)return;
  var T=TQ[TS.id],q=T.q[TS.i];
  if(!q){tsResult();return}
  var opts=q.opts||[['y','Có'],['n','Không'],['u','Tôi chưa biết']];
  b.innerHTML='<div class="ktstep"><p class="ktpos">Câu '+(TS.i+1)+' / '+T.q.length+'</p><div class="bprog"><i style="width:'+Math.round(TS.i/T.q.length*100)+'%"></i></div>'+
   '<h2 class="ktq">'+q.q+'</h2>'+(q.sub?'<p class="small">'+q.sub+'</p>':'')+
   '<div class="yn'+(opts.length>3?' four':'')+'" role="group" aria-label="Chọn câu trả lời">'+opts.map(function(o){return '<button type="button" class="ynb '+o[0]+'" data-ts="a" data-v="'+o[0]+'" aria-pressed="'+(TS.ans[TS.i]===o[0])+'">'+o[1]+'</button>'}).join('')+'</div>'+
   (TS.i>0?'<div class="wznav"><button type="button" class="btn ghost" data-ts="back">'+ic('back')+'Câu trước</button></div>':'')+'</div>';
  if(TS.i>0||Object.keys(TS.ans).length)bodyTop(b);
  var f=b.querySelector('h2');if(f){f.setAttribute('tabindex','-1');try{f.focus({preventScroll:true})}catch(e){}}
}
function tsAct(kind,v){
  if(kind==='back'){if(TS.i>0)TS.i--;tsPaint();return}
  if(kind==='edit'){tsPaint();bodyTop(document.getElementById('tsbody'));return}
  if(kind==='again'){TS.i=0;TS.ans={};tsPaint();jump0();return}
  if(kind==='a'){
    var q=TQ[TS.id].q[TS.i];TS.ans[TS.i]=v;
    if(q.k==='stop'&&v==='y'){tsResult(TS.i);return}   /* dấu hiệu phải dừng xuất hiện: kết luận ngay, không hỏi tiếp */
    TS.i++;tsPaint();
  }
}
function tsResult(stopIdx){
  var T=TQ[TS.id],b=document.getElementById('tsbody'),k,reasons=[];
  if(stopIdx!==undefined){k='d';reasons.push('Bạn chọn “Có” ở câu: '+T.q[stopIdx].q)}
  else{
    T.q.forEach(function(q,i){var a=TS.ans[i];
      if(q.k==='stop'&&a==='u')reasons.push('Bạn chưa biết chắc: '+q.q);
      if(q.k==='hold'&&(a==='y'||a==='u'))reasons.push((a==='y'?'Bạn chọn “Có” ở câu: ':'Bạn chưa biết chắc: ')+q.q);
      if(q.k==='check'&&(a==='n'||a==='u'))reasons.push((a==='n'?'Chưa làm: ':'Bạn chưa biết chắc: ')+q.q);
    });
    k=reasons.length?'h':'n';
  }
  var acts,links;
  if(TS.id==='truoc-khi-chuyen-tien'){
    acts=k==='d'?[pbS(1,0),pbS(1,1),pbS(1,3)]:(k==='h'?[pbS(1,1),pbS(1,2),pbS(1,3)]:[pbS(7,0),pbS(7,1)]);
    links=[['pb1','Có người đang thúc bạn làm ngay','clock'],['pb7','Cách tự kiểm chứng trước khi đưa','search'],['bk6','Kiểm tra: '+BK['6'].t,'quiz'],['pb2','Nếu đã lỡ chuyển tiền: việc cần làm','money']];
  }else{
    acts=k==='d'?[pbS(4,2),pbS(4,4),pbS(1,3)]:(k==='h'?[pbS(4,0),pbS(4,1),pbS(4,3)]:[pbS(4,3),pbS(4,4)]);
    links=[['pb4','Có người mời bạn góp vốn, đầu tư','chart'],['bk3','Kiểm tra: '+BK['3'].t,'quiz'],['bk4','Kiểm tra: '+BK['4'].t,'quiz'],['pb5','Đã góp tiền mà không rút được: việc cần làm','doc']];
  }
  b.innerHTML=resBox(k,T.res[k],reasons,k==='n'?'<p class="rs-more">Qua được các câu này cũng chưa có nghĩa là giao dịch an toàn. Vẫn tự kiểm tra bằng kênh do chính bạn tìm ra.</p>':'')+
   '<section class="sec"><h2>Việc nên làm bây giờ</h2><ol class="wacts">'+acts.map(function(x,i){return '<li><b>'+(i+1)+'</b><span>'+esc(x)+'</span></li>'}).join('')+'</ol></section>'+
   '<section class="sec"><h2>Đọc thêm</h2>'+linkList(links)+'</section>'+
   '<div class="wr-cta"><button type="button" class="btn ghost" data-ts="edit">'+ic('back')+'Sửa câu trả lời</button><button type="button" class="btn ghost" data-ts="again">'+ic('refresh')+'Làm lại từ đầu</button>'+
   (STANDALONE?'<button type="button" class="btn ghost" data-print>'+ic('print')+'In kết quả</button>':'')+'</div>'+resNotes();
  if(stopIdx===undefined)TS.i=T.q.length-1;
  bodyTop(b);var s=b.querySelector('.res-state');if(s){s.setAttribute('tabindex','-1');try{s.focus({preventScroll:true})}catch(e){}}
}

/* ---- Công cụ 3 “Khi nghi ngờ bị lừa”: bốn câu, mỗi câu “Có” mở một nhánh việc cần làm.
   Thứ tự câu theo trang “Trả lời vài câu hỏi ngắn”: đe dọa trước, rồi quyền vào tài khoản, rồi tiền, rồi giấy tờ.
   Các bước lấy nguyên văn từ trang việc cần làm tương ứng. Không có bước “gỡ ứng dụng”: quy trình đã thẩm định
   dặn chưa gỡ ứng dụng và chưa xóa dữ liệu trên thiết bị nghi bị kiểm soát. */
var T3=[
 {pb:8,q:'Có ai đang đe dọa, ép buộc bạn phải trả tiền hoặc phải im lặng không?',lab:'Bạn đang bị đe dọa, ép buộc',take:[0,1,2,3]},
 {pb:3,q:'Bạn đã đọc mã OTP, đưa mật khẩu, cài ứng dụng theo lời người khác, hoặc cho người khác xem, điều khiển màn hình?',lab:'Người khác có thể đang có quyền vào tài khoản hoặc điện thoại của bạn',take:[0,1,3,5]},
 {pb:2,q:'Bạn đã chuyển tiền, đưa tiền, hoặc đã giao hàng đi chưa?',lab:'Bạn đã chuyển tiền hoặc đã giao hàng',take:[0,1,3,4],yes:'Rồi',no:'Chưa'},
 {pb:6,q:'Bạn đã gửi ảnh giấy tờ, quét khuôn mặt, ký giấy, hoặc cho mượn tài khoản, SIM?',lab:'Giấy tờ, chữ ký hoặc tài khoản của bạn đã được đưa đi',take:[0,1,2,7],yes:'Rồi',no:'Chưa'}
];
var T3S={i:0,ans:{}};
function vTool3(){
  T3S={i:0,ans:{}};
  var h=crumbs([['cong-cu-kiem-tra','CÔNG CỤ KIỂM TRA'],[null,'Khi nghi ngờ bị lừa']])+pageh('Khi nghi ngờ bị lừa','4 câu hỏi để biết việc nào phải làm trước. Trả lời xong, bạn có danh sách việc cần làm theo đúng thứ tự.','Công cụ tự kiểm tra','alert','s')+PRIVACY+
   '<div class="note r"><b>Đang có nguy hiểm tức thời?</b><p>Nếu bạn đang bị đe dọa tính mạng, sức khỏe, hoặc có người tìm đến tận nơi: gọi 113 ngay.</p></div>'+
   '<div id="t3body" class="ktbody"></div>';
  return {html:h,nav:'cong-cu-kiem-tra',after:t3Paint};
}
function t3Paint(){
  var b=document.getElementById('t3body');if(!b)return;
  var q=T3[T3S.i];if(!q){t3Result();return}
  var opts=[['y',q.yes||'Có'],['n',q.no||'Không'],['u','Tôi chưa biết']];
  b.innerHTML='<div class="ktstep"><p class="ktpos">Câu '+(T3S.i+1)+' / '+T3.length+'</p><div class="bprog"><i style="width:'+Math.round(T3S.i/T3.length*100)+'%"></i></div>'+
   '<h2 class="ktq">'+esc(q.q)+'</h2><div class="yn" role="group" aria-label="Chọn câu trả lời">'+opts.map(function(o){return '<button type="button" class="ynb '+o[0]+'" data-t3="a" data-v="'+o[0]+'" aria-pressed="'+(T3S.ans[T3S.i]===o[0])+'">'+o[1]+'</button>'}).join('')+'</div>'+
   (T3S.i>0?'<div class="wznav"><button type="button" class="btn ghost" data-t3="back">'+ic('back')+'Câu trước</button></div>':'')+'</div>';
  if(T3S.i>0||Object.keys(T3S.ans).length)bodyTop(b);
  var f=b.querySelector('h2');if(f){f.setAttribute('tabindex','-1');try{f.focus({preventScroll:true})}catch(e){}}
}
function t3Act(kind,v){
  if(kind==='back'){if(T3S.i>0)T3S.i--;t3Paint();return}
  if(kind==='edit'){T3S.i=T3.length-1;t3Paint();bodyTop(document.getElementById('t3body'));return}
  if(kind==='again'){T3S={i:0,ans:{}};t3Paint();jump0();return}
  if(kind==='a'){T3S.ans[T3S.i]=v;T3S.i++;t3Paint()}
}
function t3Steps(p,take){
  return '<ol class="wacts">'+take.map(function(i,n){var b=PB[p].blocks[i];if(!b||!b.s)return '';
    return '<li><b>'+(n+1)+'</b><span>'+esc(b.s)+(b.bank?'<small class="bankhint">Số đúng: số in ở mặt sau thẻ, hoặc mục Trợ giúp trong ứng dụng ngân hàng bạn đã cài từ trước. Không gọi số người kia gửi.</small>':'')+'</span></li>'}).join('')+'</ol>';
}
function t3Result(){
  var b=document.getElementById('t3body'),hit=T3.filter(function(q,i){return T3S.ans[i]==='y'||T3S.ans[i]==='u'});
  var h='';
  if(!hit.length){
    h='<div class="res-state rs-n" role="status"><p class="rs-big">'+ic('info')+'<b>Bạn chưa mất gì</b></p><p class="rs-txt">Chưa mất gì là tình thế tốt nhất. Việc cần làm bây giờ là kiểm chứng trước khi đưa bất cứ thứ gì.</p></div>'+
      '<section class="sec"><h2>Việc nên làm bây giờ</h2>'+t3Steps(1,[0,1,3])+linkList([['pb1','Có người đang thúc bạn làm ngay: đủ các bước','clock'],['khan-cap.kiem-tra','Chuyện gì đây??? Trả lời 3 câu','quiz']])+'</section>';
  }else{
    h='<div class="res-state rs-d" role="status"><p class="rs-big">'+ic('alert')+'<b>Có '+hit.length+' việc cần xử lý, làm theo thứ tự dưới đây</b></p><p class="rs-txt">Làm xong nhóm 1 rồi mới sang nhóm 2. Bạn không có lỗi vì đã gặp chuyện này; việc quan trọng là không xử lý một mình.</p></div>'+
      hit.map(function(q,n){var unsure=T3S.ans[T3.indexOf(q)]==='u';
        return '<section class="sec t3grp"><h2><span class="pnum">'+(n+1)+'</span>'+esc(q.lab)+(unsure?' <small>(nếu đúng như vậy)</small>':'')+'</h2>'+t3Steps(q.pb,q.take)+
          '<button type="button" class="more" data-go="pb'+q.pb+'">Mở đủ các bước: '+esc(PB[q.pb].title)+ic('next')+'</button></section>'}).join('')+
      note('r',RECOV.h,RECOV.b)+
      '<div class="note g"><b>Muốn trình báo</b><p>'+NOTREPORT+' Mang theo tin nhắn, biên lai và mọi bằng chứng đang có.</p></div>';
  }
  b.innerHTML=h+'<div class="wr-cta"><button type="button" class="btn ghost" data-t3="edit">'+ic('back')+'Sửa câu trả lời</button><button type="button" class="btn ghost" data-t3="again">'+ic('refresh')+'Làm lại từ đầu</button>'+
    (STANDALONE?'<button type="button" class="btn ghost" data-print>'+ic('print')+'In danh sách việc cần làm</button>':'')+'</div>'+
    '<p class="pbfoot">'+NOTPOLICE+'</p>'+resNotes();
  bodyTop(b);var s=b.querySelector('.res-state');if(s){s.setAttribute('tabindex','-1');try{s.focus({preventScroll:true})}catch(e){}}
}

/* ---- Kiểm tra theo chuyên đề: năm việc phải chặn ngay + kiểm tra bỏ túi ---- */
function docPart(n,type){return DOCS[String(n)].b.filter(function(x){return x[0]===type})[0]}
function stopItems(n){var st=docPart(n,'stop');var items=st[3].slice(0,5);var note=st[3].length>5?st[3][5]:'';return {items:items,note:note,sub:st[2],head:st[1]}}
function stRow(n,lab){var st=docPart(n,'st');if(!st)return null;var r=st[2].filter(function(x){return x[0]===lab})[0];if(!r)return null;var o={};r[1].forEach(function(f){o[f[0]]=f[1]});return o}
function vBk(n){
  n=String(n);if(!BK[n]||!DOCS[n])n='1';
  var si=stopItems(n),pk=docPart(n,'pocket');
  var h=crumbs([['cong-cu-kiem-tra','CÔNG CỤ KIỂM TRA'],[null,'Kiểm tra: '+BK[n].t]])+pageh(BK[n].t,'Lấy nguyên văn từ Bài đọc Chuyên đề '+n+'. Trả lời phần 1, tích phần 2, rồi bấm xem kết quả.','Kiểm tra',BK[n].i)+tools(true)+
   '<form class="bkform" data-form="bk" data-n="'+n+'" novalidate>'+
   '<fieldset class="bkpart"><legend><span class="pnum">1</span>Có việc nào dưới đây không?</legend><p class="small">'+esc(si.sub.replace(/:\s*$/,'.'))+'</p>'+
   si.items.map(function(t,i){return '<div class="bkq"><p>'+esc(t)+'</p><div class="seg" role="radiogroup" aria-label="'+esc(t)+'">'+
     [['y','Có'],['n','Không'],['u','Tôi chưa biết']].map(function(o){return '<label><input type="radio" name="bks'+i+'" value="'+o[0]+'"><span>'+o[1]+'</span></label>'}).join('')+'</div></div>'}).join('')+
   (si.note?'<p class="small">'+esc(si.note)+'</p>':'')+'</fieldset>'+
   '<fieldset class="bkpart"><legend><span class="pnum">2</span>Kiểm tra bỏ túi</legend><p class="small">'+esc(pk[2]||'')+' Tích những câu bạn đã tự trả lời được rõ ràng.</p>'+
   '<div class="pocket">'+pk[3].map(function(t,k){return '<label><input type="checkbox" data-tick="d'+n+'-'+(k+1)+'"> <span>'+esc(t)+'</span></label>'}).join('')+
   '<div><button type="button" class="more" data-act="clrticks">Xóa đánh dấu</button></div></div></fieldset>'+
   '<p class="err" id="bkerr" hidden></p><div class="btnrow"><button type="submit" class="btn pri">Xem kết quả'+ic('next')+'</button></div></form>'+
   '<div id="bkres"></div>'+
   '<div class="btnrow"><button type="button" class="btn ghost" data-go="doc'+n+'">'+ic('book')+'Đọc Bài đọc Chuyên đề '+n+'</button>'+(CD[n]?'<button type="button" class="btn ghost" data-go="lv'+n+'">'+esc(lvName(n))+'</button>':'')+'</div>'+PRINTFOOT;
  return {html:h,nav:'cong-cu-kiem-tra'};
}
function bkResult(n){
  var si=stopItems(n),pk=docPart(n,'pocket'),er=document.getElementById('bkerr'),out=document.getElementById('bkres');
  var ans=si.items.map(function(t,i){var c=VIEW.querySelector('input[name="bks'+i+'"]:checked');return c?c.value:''});
  var miss=ans.filter(function(a){return !a}).length;
  if(miss){er.textContent='Còn '+miss+' câu ở phần 1 chưa chọn. Không chắc thì chọn “Tôi chưa biết”.';er.hidden=false;return}
  er.hidden=true;
  var yes=[],unk=[];ans.forEach(function(a,i){if(a==='y')yes.push(si.items[i]);if(a==='u')unk.push(si.items[i])});
  var unt=pk[3].filter(function(t,k){var c=VIEW.querySelector('[data-tick="d'+n+'-'+(k+1)+'"]');return !(c&&c.checked)});
  var k,reasons=[],todo='';
  var dr=stRow(n,'DỪNG'),hr=stRow(n,'HOÃN');
  if(yes.length){k='d';reasons=yes.map(function(t){return 'Có việc: '+esc(t)});if(dr&&dr['Làm ngay'])todo='<p class="rs-more"><b>Làm ngay:</b> '+esc(dr['Làm ngay'])+'</p>'}
  else if(unk.length||unt.length){k='h';reasons=unk.map(function(t){return 'Chưa biết chắc: '+esc(t)}).concat(unt.map(function(t){return 'Chưa trả lời được: '+esc(t)}));if(hr&&hr['Làm ngay'])todo='<p class="rs-more"><b>Làm ngay:</b> '+esc(hr['Làm ngay'])+'</p>'}
  else k='n';
  out.innerHTML=resBox(k,'Mức độ cần thận trọng: '+LEVEL[k],reasons,todo)+resNotes()+(k==='d'?linkList([['khan-cap','KHẨN CẤP: chọn việc cần làm ngay','alert']]):'');
  try{out.scrollIntoView({block:'start'})}catch(e){}
  var s=out.querySelector('.res-state');if(s){s.setAttribute('tabindex','-1');try{s.focus({preventScroll:true})}catch(e){}}
}
/* ============ CÁC RỦI RO: sáu nhóm, tìm kiếm, bộ lọc, thẻ bài ============ */
/* Mỗi thẻ là một đơn vị nội dung đã có: bài hướng dẫn theo lĩnh vực (mẫu bài chuẩn), thủ đoạn, bài đọc chuyên đề,
   bài đọc thêm, trang việc cần làm, cảnh báo. tabs: các nhóm mà thẻ xuất hiện. */
var KINDNAME={cb:'Cảnh báo',lv:'Bài hướng dẫn',tac:'Thủ đoạn',doc:'Bài đọc chuyên đề',art:'Bài đọc thêm',pb:'Việc cần làm ngay'};
var KINDORDER={cb:0,lv:1,pb:2,tac:3,doc:4,art:5};
var TACX={6:['dau-tu'],10:['vay-va-no','bao-hiem-va-tiet-kiem'],9:['du-lieu-ca-nhan'],13:['du-lieu-ca-nhan'],16:['du-lieu-ca-nhan'],17:['du-lieu-ca-nhan'],18:['du-lieu-ca-nhan'],
 26:['du-lieu-ca-nhan'],27:['du-lieu-ca-nhan'],28:['du-lieu-ca-nhan'],29:['du-lieu-ca-nhan'],11:['du-lieu-ca-nhan']};
var ARTX={'3-3':['du-lieu-ca-nhan'],'4':['bao-hiem-va-tiet-kiem'],'5':['vay-va-no'],'7':['du-lieu-ca-nhan']};
var ITEMS=null,LVMIN={};
function lvMin(k){if(!LVMIN[k])LVMIN[k]=minutes(lvBody(k).body);return LVMIN[k]}
function itemOfAlert(a){
  var tx=a.sum+' '+a.steps.join(' ');
  return {kind:'cb',go:'cb'+a.id,t:a.t,d:a.sum,tabs:['canh-bao'].concat(a.tabs||[]),ch:a.ch,gr:a.gr,lv:alertLv(a),date:a.d,min:minutes(tx+' '+tx),x:tx,a:a,i:'mega'};
}
function buildItems(){
  var I=[];
  ALERTS.forEach(function(a){I.push(itemOfAlert(a))});
  LVORDER.forEach(function(k){I.push({kind:'lv',go:'lv'+k,t:lvName(k),d:HOI[k],tabs:[LVTAB[k]].concat(k==='7'?['du-lieu-ca-nhan']:[]),ch:chOfLv(k).map(function(c){return c.k}),gr:grpOfLv(k).map(function(g){return g.k}),lv:'d',min:lvMin(k),x:HOI[k]+' '+CD[k],i:LVICON[k]})});
  [[3,'du-lieu-ca-nhan'],[6,'du-lieu-ca-nhan'],[5,'dau-tu'],[9,'lua-dao']].forEach(function(p){var d=PB[p[0]];
    I.push({kind:'pb',go:'pb'+p[0],t:d.title,d:d.lead,tabs:[p[1]],ch:[],gr:[],lv:'d',min:minutes(d.blocks.map(function(b){return (b.s||'')+' '+[].concat(b.d||[]).join(' ')}).join(' ')),x:d.lead+' '+d.blocks.map(function(b){return b.s||''}).join(' '),i:PBICON[p[0]]})});
  TACTICS.forEach(function(x,i){I.push({kind:'tac',go:'lv'+x.cd,hl:i,t:x.t,d:CDSHORT[x.cd]+' · '+(TCH[i]||[]).map(function(c){return chName(c).t}).join(', '),
    tabs:[LVTAB[x.cd]].concat(TACX[i]||[]),ch:TCH[i]||[],gr:GROUPS.filter(function(g){return g.tac.indexOf(i)>-1}).map(function(g){return g.k}),lv:TLV[i],min:lvMin(x.cd),x:x.k,i:LVICON[x.cd]})});
  Object.keys(DOCS).forEach(function(n){var m=String(DOCS[n].meta).match(/(\d+) phút/);
    I.push({kind:'doc',go:'doc'+n,t:DOCS[n].t,d:'Bài đọc Chuyên đề '+n+' · có câu hỏi tự kiểm tra',tabs:[DOCTAB[n]].concat(n==='7'?['du-lieu-ca-nhan']:[]),ch:n==='1'||n==='8'?[]:chOfLv(n).map(function(c){return c.k}),gr:n==='1'||n==='8'?[]:grpOfLv(n).map(function(g){return g.k}),lv:'n',min:m?+m[1]:10,
      x:DOCS[n].b.map(function(x){return typeof x[1]==='string'?x[1]:''}).join(' '),i:'book'})});
  ARTORDER.forEach(function(k){var a=ARTS[k];I.push({kind:'art',go:'art'+k,t:a.t,d:a.lede,tabs:[ARTTAB[k]].concat(ARTX[k]||[]),ch:[],gr:[],lv:'n',min:minutes(a.b.map(function(x){return x[1]}).join(' ')),x:a.lede,i:'doc'})});
  I.forEach(function(e){e.tt=ntext(e.t);e.xx=ntext(e.d+' '+e.x)});
  ITEMS=I;VOCAB={};I.forEach(function(e){(e.tt+e.xx).split(' ').forEach(function(w){if(w.length>=3)VOCAB[w]=1})});
}
function tabItems(tab){if(!ITEMS)buildItems();return ITEMS.filter(function(e){return e.tabs.indexOf(tab)>-1})}
function tabCount(tab){return tabItems(tab).length}
function rCard(e){
  var old=e.kind==='cb'&&ageDays(e.date)>90;
  return '<button type="button" class="rcard k-'+e.kind+'" data-go="'+e.go+'"'+(e.hl!==undefined?' data-hl="'+e.hl+'"':'')+'>'+spot(e.i,e.lv==='d'?'s':(e.lv==='h'?'h':''))+
   '<span class="rc-b"><small class="rc-type">'+(e.kind==='cb'?'<span class="alab st-d">Cảnh báo</span>':KINDNAME[e.kind])+'</small>'+
   '<b>'+esc(e.t)+'</b><span class="rc-d">'+esc(e.d)+'</span>'+
   '<span class="rc-m">'+lvlChip(e.lv)+'<span>'+ic('clock')+e.min+' phút đọc</span>'+(e.date?'<span>'+esc(e.date)+'</span>':'')+(old?'<span class="stale">Lưu trữ</span>':'')+'</span></span></button>';
}

var SIDX=null,VOCAB=null;
var SYN={crypto:['tien so','tien ma hoa'],'tien ao':['tien so','tien ma hoa'],otp:['ma xac thuc'],app:['ung dung'],link:['duong dan'],shipper:['giao hang'],
 zalo:['tin nhan'],facebook:['mang xa hoi'],tiktok:['mang xa hoi'],sms:['tin nhan'],email:['thu dien tu'],forex:['ngoai hoi'],'chuyen khoan':['chuyen tien'],
 'cong an':['gia danh co quan'],qr:['ma qr'],'nguoi la den nha':['truc tiep','hoi thao','gia danh'],'viec lam online':['nhiem vu truc tuyen','cong tac vien']};
function ntext(s){return ' '+norm(String(s||'').replace(/<[^>]+>/g,' ')).replace(/[^a-z0-9]+/g,' ').trim()+' '}
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;var m=[],i,j;for(i=0;i<=a.length;i++){m[i]=[i]}for(j=0;j<=b.length;j++)m[0][j]=j;
  for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
function fixWord(w){if(VOCAB[w]||w.length<4)return w;var best=w,bd=9,lim=w.length>=7?2:1;for(var v in VOCAB){if(Math.abs(v.length-w.length)>lim)continue;var d=lev(w,v);if(d<bd){bd=d;best=v}}return bd<=lim?best:w}
/* Lọc theo chữ: ưu tiên đúng cụm từ, rồi đủ mọi từ; chịu lỗi gõ nhẹ và từ đồng nghĩa */
function textMatch(list,raw){
  var q=ntext(raw).trim();if(!q)return {list:list,fixed:''};
  var words=q.split(' '),fixed=words.map(fixWord);
  var phrases=[' '+fixed.join(' ')+' '];Object.keys(SYN).forEach(function(k){if((' '+fixed.join(' ')+' ').indexOf(' '+k+' ')>-1)SYN[k].forEach(function(s){phrases.push(' '+s+' ')})});
  var out=[];
  list.forEach(function(e){var sc=0,hay=e.tt+e.xx;
    phrases.forEach(function(p,pi){if(e.tt.indexOf(p)>-1)sc+=pi?2:3;else if(e.xx.indexOf(p)>-1)sc+=pi?1:1.5});
    if(!sc&&fixed.every(function(w){return hay.indexOf(' '+w)>-1}))sc=fixed.every(function(w){return e.tt.indexOf(' '+w)>-1})?1.2:.6;
    if(sc)out.push([sc,e]);
  });
  out.sort(function(a,b){return b[0]-a[0]});
  return {list:out.map(function(x){return x[1]}),fixed:fixed.join(' ')!==words.join(' ')?fixed.join(' '):''};
}
var RF={tab:'',q:'',ch:'',gr:'',lv:'',dt:'',n:12},RFPRE=null;
function rrFiltered(tab,ignoreText){
  var list=tabItems(tab).filter(function(e){
    if(RF.ch&&e.ch.indexOf(RF.ch)<0)return false;
    if(RF.gr&&e.gr.indexOf(+RF.gr)<0)return false;
    if(RF.lv&&e.lv!==RF.lv)return false;
    if(RF.dt&&e.kind==='cb'){var g=ageDays(e.date);if(RF.dt==='old'?g<=90:g>+RF.dt)return false}
    return true;
  });
  list.sort(function(a,b){if(a.kind==='cb'&&b.kind==='cb')return parseVN(b.date)-parseVN(a.date);return KINDORDER[a.kind]-KINDORDER[b.kind]});
  if(ignoreText||!RF.q)return {list:list,fixed:''};
  return textMatch(list,RF.q);
}
function rrEmpty(msg,img){
  return '<div class="empty'+(img?' e-has':'')+'">'+(img?'<span class="e-img">'+pic('34',{alt:'',sizes:'112px'})+'</span>':'')+'<b>'+msg[0]+'</b><p>'+msg[1]+'</p><div class="btnrow"><button type="button" class="btn red sm" data-go="khan-cap">Chọn tình huống của tôi</button><button type="button" class="btn ghost sm" data-go="lien-he.nguon">Mở nguồn kiểm chứng</button>'+
    (RF.q||RF.ch||RF.gr||RF.lv||RF.dt?'<button type="button" class="btn ghost sm" data-act="rrclear">Xóa bộ lọc</button>':'')+'<button type="button" class="btn ghost sm" data-go="hoi-dap">Mở Hỏi – Đáp</button></div></div>';
}
function rrList(){
  var tab=RF.tab;
  if(RF.q&&/\d{6,}/.test(RF.q.replace(/[\s.\-]/g,'')))return rrEmpty(['Website không tra cứu theo dãy số','Website không tra cứu theo số điện thoại hay số tài khoản. Không tìm thấy một dãy số <b>không có nghĩa là an toàn</b>. Hãy mô tả bằng lời, ví dụ “người lạ đến nhà”.']);
  var r=rrFiltered(tab),list=r.list,h='';
  if(r.fixed)h+='<p class="small">Đang tìm theo: <b>'+esc(r.fixed)+'</b></p>';
  if(!list.length){
    var other=RF.q?RTABS.filter(function(t){return t.k!==tab}).map(function(t){var save=RF.tab;var n=textMatch(tabItems(t.k),RF.q).list.length;return [t,n]}).filter(function(x){return x[1]}):[];
    return h+rrEmpty(['Chưa tìm thấy nội dung phù hợp','Chưa tìm thấy nội dung phù hợp. Điều này không có nghĩa giao dịch an toàn. Hãy chọn tình huống của bạn hoặc kiểm chứng qua nguồn chính thức bằng hai nút dưới đây.'],true)+
      (other.length?'<div class="elsewhere"><b>Có kết quả ở nhóm khác:</b><div class="chiprow">'+other.map(function(x){return '<button type="button" class="gchip" data-go="cac-rui-ro.'+x[0].k+'" data-keepq="1">'+ic(x[0].i)+'<span>'+esc(x[0].t)+' ('+x[1]+')</span></button>'}).join('')+'</div></div>':'');
  }
  var fresh=list,old=[];
  if(tab==='canh-bao'&&!RF.q){fresh=list.filter(function(e){return e.kind!=='cb'||ageDays(e.date)<=90});old=list.filter(function(e){return e.kind==='cb'&&ageDays(e.date)>90})}
  var shown=fresh.slice(0,RF.n);
  h+='<p class="fcount" role="status"><b>'+list.length+' '+(tab==='canh-bao'?'mục':'bài')+'</b>'+(RF.q?' khớp với “'+esc(RF.q)+'”':'')+'</p>'+
    (RF.q?'<p class="small">Kết quả chỉ gợi ý nội dung nên đọc, không xác nhận một số điện thoại, tài khoản hay nền tảng có lừa đảo hay không.</p>':'')+
    (shown.length?'<div class="rlist">'+shown.map(rCard).join('')+'</div>':'<p class="small">Chưa có cảnh báo nào trong 90 ngày qua khớp bộ lọc.</p>')+
    (fresh.length>RF.n?'<button type="button" class="btn ghost more2" data-act="rrmore">Xem thêm '+Math.min(12,fresh.length-RF.n)+' bài</button>':'')+
    (old.length?'<h2 class="h3">Lưu trữ · quá 90 ngày</h2><div class="rlist">'+old.map(rCard).join('')+'</div>':'');
  return h;
}
function rrSel(id,label,opts,val){return '<label class="fsel" for="'+id+'"><span>'+label+'</span><select id="'+id+'" data-rrf="'+id.slice(3)+'"><option value="">Tất cả</option>'+opts.map(function(o){return '<option value="'+o[0]+'"'+(String(val)===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select></label>'}
function vRuiro(tab){
  tab=RTAB[tab]?tab:'canh-bao';
  var keepq=RF.keepq?RF.q:'';
  if(RF.tab!==tab||RFPRE)RF={tab:tab,q:keepq,ch:'',gr:'',lv:'',dt:'',n:12};
  if(RFPRE){RF[RFPRE[0]]=RFPRE[1];RFPRE=null}
  var T=RTAB[tab];
  var h=crumbs([['cac-rui-ro','RỦI RO'],[null,T.t]])+
   '<header class="pageh"><p class="eyebrow">RỦI RO</p><div class="ph-row"><span class="ph-img">'+pic(TABIMG[tab],{alt:'',sizes:'80px'})+'</span><h1 tabindex="-1">'+esc(T.t)+'</h1></div><p class="lead">'+esc(T.lead)+'</p></header>'+
   '<nav class="rtabs" aria-label="Các nhóm rủi ro"><div class="rtabs-in">'+RTABS.map(function(x){return '<button type="button" data-go="cac-rui-ro.'+x.k+'"'+(x.k===tab?' aria-current="page"':'')+'>'+ic(x.i)+'<span>'+esc(x.t)+'</span></button>'}).join('')+'</div></nav>'+
   (tab==='dau-tu'||tab==='vay-va-no'||tab==='bao-hiem-va-tiet-kiem'?peek('pk-na','Website không tư vấn tài chính','Đọc hai điều phải nhớ trước khi bỏ tiền','<p>'+NOADVICE+'</p><ul class="plain">'+MUST.map(function(m){return '<li>'+m+'</li>'}).join('')+'</ul>'):'')+
   (tab==='bao-hiem-va-tiet-kiem'?'<p class="small">Bài riêng về bảo hiểm và tiết kiệm đang được biên soạn. Trong lúc chờ, các nội dung liên quan nằm ở những bài dưới đây.</p>':'')+
   '<div class="rtools" role="search"><label class="lbl" for="rrq">Bạn muốn tìm tình huống nào?</label>'+
   '<div class="searchrow"><input type="search" id="rrq" class="rrq" placeholder="Ví dụ: việc làm trên mạng, đặt cọc, người lạ đến nhà." value="'+esc(RF.q)+'" autocomplete="off" enterkeyhint="search"><button type="button" class="btn pri" data-act="rrsearch">'+ic('search')+'Tìm</button></div>'+
   '<p class="small">Không nhập số điện thoại, số tài khoản hoặc tên riêng.</p>'+
   '<div class="filters'+(tab==='canh-bao'?' four':'')+'" role="group" aria-label="Bộ lọc">'+
    rrSel('rrfch','Kênh',CHANNELS.map(function(c){return [c.k,c.t]}),RF.ch)+
    rrSel('rrfgr','Đối tượng',GROUPS.map(function(g){return [g.k,g.t]}),RF.gr)+
    rrSel('rrflv','Mức độ',[['d','Rất cao'],['h','Cao'],['n','Cần thận trọng']],RF.lv)+
    (tab==='canh-bao'?rrSel('rrfdt','Ngày',[['30','30 ngày qua'],['90','90 ngày qua'],['old','Lưu trữ, quá 90 ngày']],RF.dt):'')+'</div></div>'+
   '<div id="rrlist">'+rrList()+'</div>'+
   (tab==='lua-dao'?'<section class="sec" aria-labelledby="h-fw">'+peek('pk-fw','Bộ khung nhận diện mọi thủ đoạn','Họ muốn lấy thứ gì, và đang dùng cách nào',
     '<h3 class="h3">Họ muốn lấy một trong bốn thứ</h3><div class="four">'+FOUR.map(function(f){return '<div>'+spot(f[0],'s')+'<b>'+esc(f[1])+'</b><span class="small">'+esc(f[2])+'</span></div>'}).join('')+'</div>'+
     '<h3 class="h3">Họ thường dùng một hoặc nhiều cách sau</h3><div class="ways">'+WAYS.map(function(w){return '<div class="way">'+spot(w[0],'h')+'<span><b>'+esc(w[1])+'</b>'+esc(w[2])+'</span></div>'}).join('')+'</div>'+
     '<div class="hint">Đây là những cách hay gặp, <b>không phải toàn bộ</b>. Chuyện bạn gặp không có ở đây? Hãy hỏi: người này muốn lấy thứ nào trong bốn thứ trên, và đang dùng cách nào? Không trả lời được thì <button type="button" class="lnk" data-go="khan-cap.kiem-tra">trả lời 3 câu hỏi ngắn</button>.</div>').replace('<button type="button" class="peekbtn"','<button type="button" class="peekbtn" id="h-fw"')+'</section>':'')+
   '<section class="askcta" aria-labelledby="h-askc">'+spot('chat')+'<div><h2 id="h-askc">Không thấy câu trả lời?</h2><p>Xem các câu hỏi thường gặp, đã có trả lời ngắn và lối sang trang hướng dẫn.</p></div>'+
   '<button type="button" class="btn ghost" data-go="hoi-dap">Hỏi – Đáp'+ic('next')+'</button></section>';
  RF.keepq=false;
  return {html:h,nav:'cac-rui-ro'};
}

/* ============ BÀI HƯỚNG DẪN: tóm tắt · dấu hiệu · kịch bản · việc cần làm ngay · không nên làm · bài liên quan · đọc thêm ============ */
var HL=null;
function lvBody(k){
  var b=DOCS[k].b,list=TACTICS.map(function(x,i){return i}).filter(function(i){return String(TACTICS[i].cd)===k});
  var boxes=b.filter(function(x){return x[0]==='box'}),br=boxes.filter(function(x){return x[1]==='r'})[0];
  var hi=b.findIndex(function(x){return x[0]==='h'}),how=[],j=hi+1;while(j<b.length&&b[j][0]!=='h'){if(b[j][0]==='p'&&b[j][1])how.push(b[j][1]);j++}
  var si=stopItems(k),now=docPart(k,'now'),tbl=docPart(k,'tbl'),cs=docPart(k,'case'),rc=docPart(k,'recov'),nf=docPart(k,'nofault');
  var dr=stRow(k,'DỪNG'),hr=stRow(k,'HOÃN');
  var nos=si.sub.split('. Không chờ')[0].split(' — ');
  var tab=LVTAB[k];
  var rel=[['bk'+k,'Kiểm tra: '+BK[k].t,'quiz']];
  if(k==='3'||k==='4')rel.push(['cong-cu-kiem-tra.truoc-khi-dau-tu-vay','Công cụ: Trước khi đầu tư, vay','chart']);
  else rel.push(['cong-cu-kiem-tra.truoc-khi-chuyen-tien','Công cụ: Trước khi chuyển tiền','money']);
  LVORDER.filter(function(x){return x!==k&&LVTAB[x]===tab}).forEach(function(x){rel.push(['lv'+x,lvName(x),LVICON[x],'Bài hướng dẫn'])});
  ARTORDER.filter(function(a){return ARTTAB[a]===tab}).slice(0,3).forEach(function(a){rel.push(['art'+a,ARTS[a].t,'doc','Bài đọc thêm'])});
  var sec=[['lv-sum','Tóm tắt'],['lv-sign','Dấu hiệu'],['lv-how','Kịch bản'],['lv-now','Việc cần làm ngay'],['lv-no','Không nên làm'],['lv-rel','Bài liên quan'],['lv-src','Đọc thêm']];
  var body='<section class="sec" id="lv-sum"><h2>Tóm tắt</h2>'+(br?'<div class="dbox r"><span class="eyebrow">Nhớ một câu</span><p class="big">'+esc(br[3][0])+'</p></div>':'')+
     '<div class="ask"><span class="eyebrow">Câu hỏi phải hỏi</span><p>'+esc(HOI[k])+'</p></div>'+
     '<h3 class="h3">Ai thường bị nhắm đến</h3>'+chips(grpOfLv(k).map(function(g){return grpChip(g,tab)}))+'<h3 class="h3">Kênh tiếp cận</h3>'+chips(chOfLv(k).map(function(c){return chChip(c,tab)}))+'</section>'+
   '<section class="sec" id="lv-sign"><h2>Dấu hiệu</h2><p class="small">Không chờ dấu hiệu thứ hai. Gặp một trong năm việc này thì chặn ngay việc đó, rồi mới tính tiếp.</p><ul class="stopl">'+si.items.map(function(t){return '<li>'+ic('stop')+'<span>'+esc(t)+'</span></li>'}).join('')+'</ul>'+
     (hr&&hr['Khi nào']?'<div class="note b"><b>Cần hoãn lại để kiểm chứng khi</b><p>'+esc(hr['Khi nào'])+'</p></div>':'')+'</section>'+
   '<section class="sec" id="lv-how"><h2>Kịch bản</h2><h3 class="h3">'+esc(b[hi][1])+'</h3>'+how.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')+
     '<h3 class="h3">Thủ đoạn thường gặp</h3><ul class="tlist">'+list.map(function(i){return '<li data-t="'+i+'">'+ic('alert')+'<span>'+esc(TACTICS[i].t)+'</span>'+lvlChip(TLV[i])+'</li>'}).join('')+'</ul>'+
     (function(){var g=list.filter(function(i){return TACIMG[i]});return g.length?'<div class="tgal'+(g.length===1?' one':'')+'">'+g.map(function(i){return fig(TACIMG[i],{cap:TACTICS[i].t,sizes:g.length===1?HEROSZ:'(min-width:900px) 400px, calc(100vw - 32px)'})}).join('')+'</div>':''})()+
     (tbl?'<h3 class="h3">Vì sao người cẩn thận vẫn quyết định sai</h3><div class="tblwrap"><table class="dtbl"><thead><tr><th>'+esc(tbl[1])+'</th><th>'+esc(tbl[2])+'</th></tr></thead><tbody>'+tbl[3].map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>'}).join('')+'</tbody></table></div>':'')+'</section>'+
   '<section class="sec" id="lv-now"><h2>Việc cần làm ngay</h2>'+(now?'<div class="docnow"><b>'+esc(cap1(now[1]))+'</b>'+now[2].map(P).join('')+'</div>':'')+
     (dr?'<div class="cond"><b>Khi phải dừng</b><ul><li>'+esc(dr['Khi nào']||'')+'</li><li><b>Làm ngay:</b> '+esc(dr['Làm ngay']||'')+'</li></ul></div>':'')+
     (hr?'<div class="cond"><b>Khi cần hoãn</b><ul><li><b>Làm ngay:</b> '+esc(hr['Làm ngay']||'')+'</li></ul></div>':'')+
     '<h3 class="h3">Nếu đã lỡ</h3>'+(nf?'<p><b>'+esc(nf[1])+'</b></p>':'')+
     (cs?'<ol class="dsteps">'+cs[1].filter(function(c){return c[0]||c[1]}).map(function(c,i){return '<li><b>'+(i+1)+'</b><span>'+(c[0]?'<strong>'+esc(c[0])+'</strong> ':'')+esc(c[1])+'</span></li>'}).join('')+'</ol>':'')+
     (rc?note('r','Cảnh giác với người hứa lấy lại tiền',rc[1]):'')+
     '<div class="btnrow"><button type="button" class="btn red sm" data-urgent>Xem việc cần làm ngay</button><button type="button" class="btn ghost sm" data-go="bk'+k+'">'+ic('quiz')+'Tự kiểm tra</button></div></section>'+
   '<section class="sec" id="lv-no"><h2>Không nên làm</h2><ul class="nol">'+nos.map(function(t){return '<li>'+ic('x')+'<span>'+esc(t.replace(/\.$/,''))+'</span></li>'}).join('')+'</ul></section>'+
   '<section class="sec" id="lv-rel"><h2>Bài liên quan</h2>'+linkList(rel)+'</section>'+
   '<section class="sec" id="lv-src"><h2>Đọc thêm</h2>'+linkList([['doc'+k,'Bài đọc Chuyên đề '+k+': '+DOCS[k].t,'book'],['thu'+sampleIdx(k),'Thử 1 câu của chuyên đề này','question']])+
     '<p class="small">Trang này tóm lại Bài đọc Chuyên đề '+k+' do website biên soạn.</p>'+revline('Rà soát gần nhất',REVIEW.pb.rev)+'</section>';
  return {body:body,sec:sec,n:list.length};
}
function vLv(k){
  k=String(k);if(!CD[k])return vRuiro('lua-dao');
  var L=lvBody(k),tab=LVTAB[k];
  var h=crumbs([['cac-rui-ro','RỦI RO'],['cac-rui-ro.'+tab,RTAB[tab].t],[null,lvName(k)]])+
   '<article class="lvart"><header class="pageh"><p class="eyebrow">Bài hướng dẫn · Chuyên đề '+k+'</p><div class="ph-row">'+spot(LVICON[k],'s')+'<h1 tabindex="-1">'+esc(lvName(k))+'</h1></div>'+
   '<p class="docmeta"><span>Cập nhật: '+fillv(REVIEW.pb.rev)+'</span><span>'+ic('clock')+'Đọc khoảng '+minutes(L.body)+' phút</span>'+lvlChip('d','Mức độ cần thận trọng: ')+'</p></header>'+fig(LVIMG[k],{eager:true,cls:'hero'})+tools(true)+toc(L.sec)+L.body+'</article>'+PRINTFOOT;
  return {html:h,nav:'cac-rui-ro',after:function(){
    if(HL===null)return;var li=VIEW.querySelector('.tlist [data-t="'+HL+'"]');HL=null;if(!li)return;
    li.classList.add('hl');li.setAttribute('tabindex','-1');try{li.scrollIntoView({block:'center'});li.focus({preventScroll:true})}catch(e){}
  }};
}

/* ============ TRANG CẢNH BÁO ============ */
function vAlert(id){
  var a=ALERTS.filter(function(x){return String(x.id)===String(id)})[0];if(!a)return vRuiro('canh-bao');
  var lv=alertLv(a),tx=a.sum+' '+a.steps.join(' ');
  var rel=[['lv'+a.lv,lvName(a.lv),LVICON[a.lv],'Bài hướng dẫn']].concat(a.tac.map(function(i){return ['lv'+TACTICS[i].cd,TACTICS[i].t,'alert','Thủ đoạn',i]})).concat([['bk'+a.lv,'Kiểm tra: '+BK[a.lv].t,'quiz']]);
  var h=crumbs([['cac-rui-ro','RỦI RO'],['cac-rui-ro.canh-bao','CẢNH BÁO'],[null,a.t]])+
   '<article class="alert1"><p class="alab st-d">'+ic('mega')+'<span>Cảnh báo</span></p>'+
   '<h1 tabindex="-1">'+esc(a.t)+'</h1><p class="docmeta"><span>Ngày đăng: '+esc(a.d)+'</span><span>'+ic('clock')+'Đọc khoảng '+minutes(tx+' '+tx)+' phút</span>'+lvlChip(lv,'Mức độ cần thận trọng: ')+'</p>'+
   (ageDays(a.d)>90?'<p class="stale">Nội dung đang chờ rà soát, cập nhật lần cuối ngày '+esc(a.d)+'.</p>':'')+fig(ALIMG[a.id],{eager:true,cls:'hero'})+tools(true)+
   '<section class="sec"><h2>Tóm tắt</h2><p>'+esc(a.sum)+'</p></section>'+
   '<section class="sec"><h2>Ai dễ bị nhắm tới</h2>'+chips(a.gr.map(function(k){return grpChip(GROUPS[k-1],'canh-bao')}))+'<h3 class="h3">Kênh</h3>'+chips(a.ch.map(function(k){return chChip(chName(k),'canh-bao')}))+'</section>'+
   '<section class="sec"><h2>Kịch bản thường gặp</h2><ol class="dsteps">'+a.steps.map(function(s,i){return '<li><b>'+(i+1)+'</b><span>'+esc(s)+'</span></li>'}).join('')+'</ol></section>'+
   '<section class="sec"><h2>Dấu hiệu</h2>'+
    (a.sg.length?'<ul class="stopl">'+a.sg.map(function(i){return '<li>'+ic('stop')+'<span>'+SIGNS[i][1]+'</span></li>'}).join('')+'</ul><p class="small">Gặp một trong các yêu cầu trên thì dừng ngay. Đây chưa phải kết luận rằng đã có lừa đảo.</p>':'')+
    (a.hold?'<div class="note b"><b>Chưa chuyển tiền cho tới khi đã kiểm chứng</b><p>Cam kết lợi nhuận cao, đều đặn, một tài khoản cá nhân thay cho tài khoản của bên giao dịch, hoặc giấy tờ không khớp lời giới thiệu là dấu hiệu phải hoãn lại để tự kiểm tra bằng kênh do chính bạn tìm ra.</p></div>':'')+
    (a.id===6?'<ul class="stopl"><li>'+ic('stop')+'<span>'+esc(stopItems('6').items[2])+'</span></li></ul>':'')+'</section>'+
   '<section class="sec"><h2>Việc cần làm</h2>'+linkList([['pb'+a.pb,PB[a.pb].title,PBICON[a.pb],'Nếu đã gặp chuyện'],['khan-cap.kiem-tra','Chuyện gì đây??? Trả lời 3 câu','quiz','Nếu bạn đang bị liên hệ']])+'</section>'+
   '<section class="sec"><h2>Bài liên quan</h2>'+linkList(rel)+'</section></article>'+PRINTFOOT;
  return {html:h,nav:'cac-rui-ro'};
}

/* ============ HỎI – ĐÁP (mục 5 của yêu cầu ban đầu): gửi kín, gộp, trả lời công khai ============ */
var FLOW=[['lock','Bạn gửi kín','Câu hỏi, kiến nghị không hiện lên trang.'],
 ['users','Ban biên tập gộp','Các câu giống nhau được gộp làm một.'],
 ['mega','Trả lời công khai','Người biên tập duyệt từng câu trước khi đăng, đã che mọi thông tin cá nhân.']];
function vHoidap(open){
  open=+open||0;
  var h=crumbs([[null,'Hỏi – Đáp']])+pageh('Hỏi – Đáp','Câu hỏi thường gặp, trả lời ngắn.'+(canSend('questions')?' Không thấy câu của bạn thì gửi câu hỏi riêng ở cuối trang.':''),null,'chat')+
   '<div class="quick">'+ic('alert')+'<span><b>Đang gặp chuyện gấp?</b> Đừng chờ trả lời, xem việc cần làm ngay.</span><button type="button" class="btn red sm" data-urgent>Xem việc cần làm ngay</button></div>'+
   '<section class="sec" aria-labelledby="h-qa"><h2 id="h-qa">Hỏi – đáp nhanh</h2><div class="qalist">'+QA.map(function(x,i){var n=i+1,op=open===n;
     return '<div class="qai"><button type="button" class="qaq" data-open="qa-'+n+'" aria-expanded="'+op+'" aria-controls="qa-'+n+'">'+ic('question')+'<span>'+esc(x.q)+'</span>'+ic('next','chev')+'</button>'+
      '<div class="qab" id="qa-'+n+'"'+(op?'':' hidden')+'><p class="qshort">'+x.a+'</p><p class="qlab">Vì sao</p><p>'+x.why+'</p><p class="qlab">Việc cần làm</p><p>'+x.todo+'</p>'+linkList(x.go.map(function(g){return [g[0],g[1],'book']}))+'</div></div>'}).join('')+'</div>'+
   '</section>'+
   (!canSend('questions')?'<section class="sec" id="gui-cau-hoi" aria-labelledby="h-ask"><h2 id="h-ask">Gửi câu hỏi, kiến nghị riêng</h2>'+NOCHANNEL('Nơi nhận câu hỏi')+'<p class="small">'+NOTREPORT+'</p></section>':
   '<section class="sec" id="gui-cau-hoi" aria-labelledby="h-ask"><h2 id="h-ask">Gửi câu hỏi, kiến nghị riêng</h2>'+
   '<div class="flowwrap"><ol class="flow" aria-label="Cách mục Hỏi – Đáp làm việc">'+FLOW.map(function(f){return '<li>'+spot(f[0])+'<span><b>'+esc(f[1])+'</b>'+esc(f[2])+'</span></li>'}).join('')+'</ol>'+
   '<div class="flow-img">'+pic('22',{minw:768,sizes:'340px'})+'<span class="ailab">'+AILABEL+'</span></div></div>'+
   '<form class="box form" data-form="ask" novalidate>'+
   '<div class="hp" aria-hidden="true"><label>Để trống ô này<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>'+
   '<div class="warn"><b>Trước khi gõ</b><ul><li>Đừng viết mật khẩu, mã OTP, mã PIN, số thẻ hay số tài khoản.</li><li>Đừng gửi họ tên, số điện thoại, ảnh giấy tờ của người khác.</li><li>Website không nhận tệp đính kèm và ảnh chụp màn hình.</li></ul></div>'+
   '<div><label class="lbl" for="qtext">Câu hỏi hoặc kiến nghị của bạn</label><textarea id="qtext" placeholder="Ví dụ: Tôi được mời làm cộng tác viên, họ bảo nạp 300 nghìn để mở tài khoản. Có nên nạp không?"></textarea></div>'+
   '<label class="check" for="qreply"><input type="checkbox" id="qreply"><span>Tôi muốn nhận trả lời riêng <span class="small">(không bắt buộc)</span></span></label>'+
   '<div id="qcontactwrap" hidden><label class="lbl" for="qcontact">Thư điện tử hoặc số điện thoại để trả lời</label><input type="text" id="qcontact" autocomplete="off"><p class="small" style="margin-top:6px">Chỉ dùng để trả lời đúng câu hỏi này, xóa ngay sau khi đã gửi câu trả lời. Chúng tôi không chủ động liên hệ vì việc khác.</p></div>'+
   '<label class="check one" for="qok"><input type="checkbox" id="qok"><span><b>Bắt buộc.</b> Tôi đồng ý cho Ban biên tập đọc và xử lý câu hỏi này để trả lời.</span></label>'+
   '<label class="check" for="qpub"><input type="checkbox" id="qpub"><span><b>Không bắt buộc.</b> Tôi đồng ý cho Ban biên tập che mọi thông tin nhận dạng, biên tập rồi đăng công khai câu hỏi cùng câu trả lời. Không đồng ý vẫn được trả lời riêng.</span></label>'+
   '<p class="err" id="qerr" hidden></p><p class="okmsg" id="qdone" hidden>'+MAILMSG()+'</p>'+
   '<div class="btnrow"><button type="submit" class="btn pri">'+ic('chat')+'Gửi</button></div>'+
   (API?'':'<p class="small">'+MAILNOTE+'</p>')+
   '<p class="small">'+NOTREPORT+'</p></form></section>');
  return {html:h,nav:'hoi-dap'};
}
function vSent(){
  var h=pageh('Đã nhận câu hỏi, kiến nghị của bạn','Nội dung bạn gửi không hiện lên trang. Ban biên tập cố gắng trả lời trong 72 giờ làm việc, có lúc lâu hơn.','Hỏi – Đáp','check')+
   '<div class="note r"><b>Đang có chuyện gấp? Đừng chờ câu trả lời.</b><p>Nếu bạn đang bị giục chuyển tiền, vừa chuyển tiền, hoặc đang bị đe dọa, hãy làm ngay:</p>'+
   '<div class="btnrow" style="margin-top:4px"><button type="button" class="btn red" data-go="pb8">Tôi đang bị đe dọa</button><button type="button" class="btn red" data-go="pb2">Tôi vừa chuyển tiền hoặc giao hàng</button><button type="button" class="btn red" data-go="pb1">Có người đang thúc tôi làm ngay</button></div>'+
   '<button type="button" class="more" data-urgent>Xem tất cả lựa chọn'+ic('next')+'</button></div>'+
   '<div class="note g"><b>Muốn trình báo?</b><p>'+NOTREPORT+' Mang theo tin nhắn, biên lai và mọi bằng chứng đang có.</p></div>'+
   '<div class="btnrow"><button type="button" class="btn ghost" data-go="hoi-dap">'+ic('back')+'Về Hỏi – Đáp</button></div>';
  return {html:h,nav:'hoi-dap'};
}

/* ============ LIÊN HỆ ĐÚNG NƠI ============ */
function vLienhe(){
  var h=crumbs([[null,'Liên hệ đúng nơi']])+pageh('Liên hệ đúng nơi','Website không tiếp nhận tin báo. Trang này chỉ cho bạn đúng nơi cần tìm khi gặp chuyện.',null,'call')+
   '<section class="sec" aria-labelledby="h-case"><h2 id="h-case">Bạn đang ở trường hợp nào?</h2>'+linkList([
     ['pb2','Đã chuyển tiền','money','Gọi ngay ngân hàng hoặc ví điện tử bạn đã chuyển'],
     ['pb3','Đã đưa mã OTP, mật khẩu hoặc cài ứng dụng lạ','key','Ngắt mạng chiếc máy đó, dùng máy khác gọi ngân hàng'],
     ['pb8','Đang bị đe dọa, ép buộc','alert','Có nguy hiểm tức thời thì gọi 113'],
     ['pb5','Đã góp tiền, đặt cọc mà không lấy lại được','doc','Không nộp thêm khoản nào để “mở khóa”']])+
   '<div class="note g"><b>Muốn trình báo</b><p>'+NOTREPORT+' Mang theo tin nhắn, biên lai và mọi bằng chứng đang có.</p></div></section>'+
   helpBlock(true)+
   '<section class="sec" id="nguon" aria-labelledby="h-src"><h2 id="h-src">Nguồn kiểm chứng chính thống</h2>'+
   '<div class="note g"><b>Đọc trước khi dùng</b><p>Các nguồn dưới đây chỉ giúp kiểm tra một phần thông tin. Doanh nghiệp có đăng ký hoặc có giấy phép không có nghĩa giao dịch cụ thể là an toàn.</p></div><div class="alist">'+
   [['Cổng thông tin quốc gia về đăng ký doanh nghiệp','Kiểm tra doanh nghiệp có đăng ký hay không và ai là người đại diện. Có đăng ký không có nghĩa khoản đầu tư hoặc giao dịch an toàn.'],
    ['Cơ quan quản lý chuyên ngành về chứng khoán, ngân hàng, bảo hiểm','Kiểm tra giấy phép cung cấp dịch vụ tài chính. Đăng ký doanh nghiệp là chưa đủ đối với dịch vụ tài chính.'],
    ['Hệ thống tiếp nhận phản ánh tin nhắn rác, cuộc gọi rác','Phản ánh qua đầu số 156 và 5656. Không phải nơi thu hồi tiền và không thay cho việc trình báo.'],
    ['Cơ quan quản lý về thông tin, truyền thông và an ninh mạng','Cảnh báo về ứng dụng, trang web giả mạo và an toàn thông tin.'],
    ['Cổng thông tin của cơ quan Công an','Cảnh báo chính thức và hướng dẫn trình báo.']].map(function(x){
     return '<div class="aitem"><h3>'+esc(x[0])+'</h3><p class="meta">'+esc(x[1])+'</p></div>'}).join('')+
   '</div><div class="note b"><b>Cách tự tìm đúng địa chỉ</b><p>Tự gõ tên cơ quan vào ô tìm kiếm rồi chỉ mở địa chỉ có đuôi <b>.gov.vn</b>. Không bấm vào kết quả có chữ “Quảng cáo” hoặc “Được tài trợ”, và không dùng đường dẫn do người khác gửi.</p></div><p class="small">Danh mục này chỉ gồm cơ quan nhà nước có thẩm quyền và hệ thống do Nhà nước vận hành. Website không đánh giá, không xếp hạng bất kỳ tổ chức nào, và không tự nhận là kênh phản ánh thay cho các hệ thống trên.</p></section>'+
   '<p class="pbfoot">'+NOTPOLICE+'</p>'+PRINTFOOT;
  return {html:h,nav:''};
}

/* ============ VỀ WEBSITE · NGUYÊN TẮC NỘI DUNG · XÁC MINH ĐÚNG TRANG · HOẠT ĐỘNG ============ */
var RULES=['Không hứa chắc chắn tránh được lừa đảo, không cam kết lấy lại được tiền.',NOADVICE,
 'Không có nhãn “an toàn”. Không tìm thấy cảnh báo không có nghĩa một cá nhân, tổ chức hay sản phẩm là an toàn.',
 'Không nêu tên một cá nhân, tổ chức đang hoạt động là bên lừa đảo.',
 'Website tự biên soạn nội dung; không đưa tin, không tổng hợp và không đăng lại bài của báo chí hay của trang khác.',
 'Công cụ tự kiểm tra không chấm điểm bằng con số. Kết quả chỉ có ba khuyến nghị: dừng, hoãn để kiểm chứng, hoặc chưa phát hiện điểm dừng.',
 'Các trang hướng dẫn ghi ngày rà soát gần nhất. Trang quá 90 ngày chưa rà soát lại tự hiện nhãn nhắc.'];
function vGioithieu(){
  var h=crumbs([[null,'Về website']])+pageh('Về website','Website tư vấn nhận diện lừa đảo và rủi ro tài chính, giúp người dân tự kiểm tra và tự bảo vệ.',null,'info')+fig('21',{eager:true,cls:'hero'})+
   '<section class="sec box" aria-labelledby="h-what"><h2 id="h-what">Website này là gì</h2><div class="facts">'+
   '<div class="fact">'+spot('info')+'<span>Website chỉ <b>cung cấp thông tin tham khảo</b> về nhận diện và phòng ngừa rủi ro tài chính, lừa đảo. Website không tiếp nhận, xác minh hoặc xử lý tin báo lừa đảo.</span></div>'+
   '<div class="fact">'+spot('shield')+'<span><b>Đây không phải website của cơ quan nhà nước.</b> Website không nhận tố giác hoặc tin báo tội phạm.</span></div>'+
   '<div class="fact">'+spot('search')+'<span>Website <b>không kết luận ai đúng, ai sai, ai lừa đảo</b>. Việc đó thuộc cơ quan nhà nước có thẩm quyền. Website chỉ giúp bạn tự kiểm tra, tự xác minh và tự quyết định.</span></div>'+
   '</div><p class="small" style="margin-top:12px">'+NOTREPORT+'</p></section>'+
   '<section class="sec" aria-labelledby="h-map"><h2 id="h-map">Các mục của website</h2>'+linkList([
     ['khan-cap','KHẨN CẤP','alert','Trả lời 3 câu hỏi ngắn; việc cần làm ngay khi đã lỡ làm theo'],
     ['cong-cu-kiem-tra','CÔNG CỤ KIỂM TRA','quiz','Trước khi chuyển tiền, trước khi đầu tư, vay, khi nghi ngờ bị lừa; 8 mục kiểm tra theo việc sắp làm'],
     ['cac-rui-ro','RỦI RO','chart','Cảnh báo, lừa đảo, vay và nợ, đầu tư, bảo hiểm và tiết kiệm, dữ liệu cá nhân'],
     ['thu-vien','KIẾN THỨC NỀN TẢNG','book','Lừa đảo từ cổ chí kim, bài đọc theo chuyên đề, các thủ đoạn thường gặp'],
     ['hoi-dap','Hỏi – Đáp','chat','Câu hỏi thường gặp, trả lời ngắn']])+'</section>'+
   '<section class="sec" aria-labelledby="h-srcs"><h2 id="h-srcs">Nội dung lấy từ đâu</h2><ul class="plain">'+
   '<li>Website tự biên soạn nội dung: bộ 08 chuyên đề, ngân hàng câu hỏi, các bài về thủ đoạn, các trang việc cần làm và các cảnh báo.</li>'+
   '<li>Website không đưa tin, không tổng hợp và không đăng lại bài của báo chí hay của trang khác.</li>'+
   '<li>Muốn biết chính xác một quy định, bạn nên tra trực tiếp tại cổng thông tin của cơ quan nhà nước có thẩm quyền.</li></ul>'+
   '<button type="button" class="more" data-go="nguyen-tac-noi-dung">Nguyên tắc nội dung'+ic('next')+'</button></section>'+
   '<section class="sec commit" aria-labelledby="h-c4"><h2 id="h-c4">Cam kết bốn không</h2><ul class="bonkhong">'+BONKHONG.map(function(t,i){return '<li>'+ic(BKICON[i])+'<span>'+t+'</span></li>'}).join('')+'</ul>'+
   '<p class="small">Website cũng không chủ động liên hệ với bạn khi bạn chưa gửi yêu cầu. Nếu bạn gửi câu hỏi và muốn được trả lời, chúng tôi chỉ trả lời đúng câu hỏi đó.</p></section>'+
   '<section class="sec" aria-labelledby="h-addr"><h2 id="h-addr">Chỉ một địa chỉ duy nhất</h2><div class="addr">'+ic('lock')+'<b>antoantaichinh.vn</b></div>'+
   '<button type="button" class="more" data-go="xac-minh-dung-trang">Cách xác minh bạn đang ở đúng trang'+ic('next')+'</button></section>'+
   '<section class="sec" aria-labelledby="h-gy"><h2 id="h-gy">Góp ý cho website</h2><p>Chỗ nào khó hiểu, thiếu hoặc sai, bà con cứ nói thẳng. Một câu ngắn cũng quý.</p><div class="btnrow"><button type="button" class="btn pri" data-go="gop-y">'+ic('pen')+'Gửi góp ý</button>'+
   (ACTIVITY.on?'<button type="button" class="btn ghost" data-go="hoat-dong">'+ic(ACTIVITY.i)+esc(ACTIVITY.t)+'</button>':'')+'</div></section>';
  return {html:h,nav:''};
}
function vNguyentac(){
  var h=crumbs([['ve-website','Về website'],[null,'Nguyên tắc nội dung']])+pageh('Nguyên tắc nội dung','Website viết gì, không viết gì và sửa sai thế nào.',null,'book')+
   '<section class="sec" aria-labelledby="h-r"><h2 id="h-r">Bảy nguyên tắc</h2><ul class="plain">'+RULES.map(function(r){return '<li>'+r+'</li>'}).join('')+'</ul></section>'+
   '<section class="sec" aria-labelledby="h-p3"><h2 id="h-p3">Văn bản chi tiết</h2>'+linkList([['polng',POLNAME.ng,'book','Website tự biên soạn gì, không đăng lại gì'],['polcc',POLNAME.cc,'pen','Cách báo lỗi, thời hạn sửa sai'],['poldl',POLNAME.dl,'lock','Website không lưu giữ lâu dài dữ liệu cá nhân'],['polmt',POLNAME.mt,'info','Website là gì và không phải là gì']])+'</section>';
  return {html:h,nav:''};
}
function vDungtrang(){
  var h=crumbs([['ve-website','Về website'],[null,'Xác minh đúng trang']])+pageh('Cách xác minh bạn đang ở đúng trang','Website chống lừa đảo là mục tiêu bị làm giả hàng đầu. Mất một phút kiểm tra là đủ.',null,'lock')+
   '<div class="addr">'+ic('lock')+'<b>antoantaichinh.vn</b></div>'+
   '<p>Chúng tôi không có website nào khác, không có ứng dụng cho điện thoại, và không có trang mạng xã hội nào ngoài những địa chỉ được công bố tại đây. Mọi địa chỉ khác, dù chỉ khác một chữ cái hay khác phần đuôi như .com, .net, .org, .info, đều không phải website này.</p>'+
   '<div class="note b"><b>Cách tự kiểm tra</b><p>Chạm vào thanh địa chỉ ở trên cùng trình duyệt. Phần chữ ngay trước dấu gạch chéo đầu tiên phải đúng là <b>antoantaichinh.vn</b>, không thừa, không thiếu một chữ nào. Đừng tin biểu tượng, màu sắc, hình ổ khóa hay việc trang nằm đầu kết quả tìm kiếm; những thứ đó đều làm giả hoặc mua được.</p></div>'+
   '<section class="sec"><h2>Kênh chính thức của website</h2><ul class="plain"><li>Website: antoantaichinh.vn</li><li>Trang mạng xã hội: chưa có. Khi có, địa chỉ sẽ được công bố tại đây.</li></ul></section>'+
   '<section class="sec commit"><h2>Trang thật không bao giờ</h2><ul class="bonkhong">'+BONKHONG.map(function(t,i){return '<li>'+ic(BKICON[i])+'<span>'+t+'</span></li>'}).join('')+'</ul></section>';
  return {html:h,nav:''};
}
var SHAREIMG=[
 ['chia-se-bon-dieu.jpg','chia-se-bon-dieu-540.webp',675,'Ảnh dọc: Trong lúc chưa rõ, nhớ bốn điều — không chuyển tiền, không cung cấp OTP, không bấm đường dẫn lạ, không cài ứng dụng theo yêu cầu.','Trong lúc chưa rõ, nhớ bốn điều','Ảnh dọc 4:5 cho Facebook, Zalo'],
 ['chia-se-story.jpg','chia-se-story-540.webp',960,'Ảnh tin: Đừng nghe họ tự xưng là ai, hãy nhìn vào việc họ đang bảo mình làm.','Đừng nghe họ tự xưng là ai','Ảnh tin 9:16 cho Zalo, Facebook, TikTok']
];
function vHoatdong(){
  var h=crumbs([[null,'Hoạt động']])+pageh(ACTIVITY.full,'Hoạt động không thường xuyên của website. Không thu bất kỳ khoản phí nào.','Hoạt động','trophy','h')+fig('33',{eager:true,cls:'hero'})+
   '<div class="facts box">'+
   [['clock','Thời gian',esc(ACTIVITY.time||'Sẽ công bố tại trang này trước khi cuộc thi bắt đầu.')],
    ['users','Ai được dự thi','Mọi người có số điện thoại để liên hệ. Người dưới 16 tuổi dự thi bằng số điện thoại của cha, mẹ hoặc người giám hộ và phải được người đó đồng ý.'],
    ['quiz','Hình thức','Đăng ký bằng họ tên và số điện thoại, rồi vào thi ngay. Phần chung: 8 chuyên đề, '+bankCounts()+' câu, làm Chuyên đề 1 trước. Phần dành cho nhân viên doanh nghiệp: '+dnCounts()+' câu tình huống. Mỗi số điện thoại thi tối đa 2 lượt.'],
    ['gift','Giải thưởng',esc(ACTIVITY.prize||'Sẽ công bố cùng Thể lệ.')+' Giải thưởng thực hiện nghĩa vụ thuế thu nhập cá nhân theo quy định.'],
    ['doc','Thể lệ',esc(ACTIVITY.rules||TBA)]].map(function(x){return '<div class="fact">'+spot(x[0])+'<span><b>'+x[1]+':</b> '+x[2]+'</span></div>'}).join('')+'</div>'+
   (regOpen()?'<div class="btnrow"><button type="button" class="btn pri" data-go="dang-ky">Đăng ký dự thi'+ic('next')+'</button><button type="button" class="btn ghost" data-go="thi">Tự luyện trước, không tính điểm</button></div>':
    '<div class="note b"><b>Cuộc thi chưa mở đăng ký</b><p>Thời gian, thể lệ và giải thưởng sẽ được công bố tại trang này. Trong lúc chờ, bạn có thể tự luyện toàn bộ câu hỏi, không cần đăng ký và không tính điểm.</p></div>'+
    '<div class="btnrow"><button type="button" class="btn pri" data-go="thi">Tự luyện '+bankCounts()+' câu của 8 chuyên đề'+ic('next')+'</button><button type="button" class="btn ghost" data-go="thidn">Câu hỏi dành cho nhân viên doanh nghiệp</button></div>')+
   '<p class="small">Thông tin người dự thi chỉ dùng để chấm bài, xét và trao giải, rồi xóa sau khi trao giải xong.</p>'+
   '<section class="sec" aria-labelledby="h-share"><h2 id="h-share">Ảnh để chia sẻ cho người thân</h2>'+
   '<p>Mở ảnh bản đầy đủ, lưu về máy rồi gửi qua Zalo, Facebook. Trên ảnh chỉ có một địa chỉ là antoantaichinh.vn, không có đường dẫn hay mã QR nào khác.</p>'+
   '<div class="sharegal">'+SHAREIMG.map(function(x){return '<a class="shimg" href="'+IMGDIR+x[0]+'" target="_blank" rel="noopener"><img src="'+IMGDIR+x[1]+'" width="540" height="'+x[2]+'" alt="'+esc(x[3])+'" loading="lazy" decoding="async"><span><b>'+esc(x[4])+'</b><small>'+esc(x[5])+' · '+AILABEL+'</small></span></a>'}).join('')+'</div></section>';
  return {html:h,nav:'hoat-dong'};
}

/* ================= điều hướng ================= */
/* Tên cũ vẫn mở được (liên kết đã phát, mã QR đã in), nhưng thanh địa chỉ luôn hiện tên mới. */
var ALIAS={home:'',tinhhuong:'khan-cap',ungpho:'khan-cap',kt:'khan-cap.kiem-tra',nhandien:'cac-rui-ro.lua-dao',thudoan:'cac-rui-ro.lua-dao',
 ruiro:'cac-rui-ro.dau-tu',tubaove:'cong-cu-kiem-tra',thamgia:'cong-cu-kiem-tra',canhbao:'cac-rui-ro.canh-bao',hoidap:'hoi-dap',
 lienhe:'lien-he',so:'lien-he',gioithieu:'ve-website',dungtrang:'xac-minh-dung-trang',hoatdong:'hoat-dong',dangky:'dang-ky',gopy:'gop-y',dagui:'da-gui',
 poldl:'chinh-sach-bao-mat',polmt:'dieu-khoan-su-dung',poltt:'nguyen-tac-noi-dung'};
var TOOLSLUG={'truoc-khi-chuyen-tien':1,'truoc-khi-dau-tu-vay':1,'khi-nghi-bi-lua':1};
function canon(tok){
  tok=String(tok||'').replace(/^#/,'').replace(/^cong-cu-checklist/,'cong-cu-kiem-tra').replace(/\.checklist-(\d)$/,'.kiem-tra-$1').replace(/^cac-rui-ro\.canh-bao-m[o]i/,'cac-rui-ro.canh-bao');var m;
  if(ALIAS.hasOwnProperty(tok))return ALIAS[tok];
  if((m=tok.match(/^pb(\d)$/))&&PBSLUG[m[1]])return 'khan-cap.'+PBSLUG[m[1]];
  if((m=tok.match(/^lv(\d)$/))&&LVSLUG[m[1]])return 'cac-rui-ro.'+LVTAB[m[1]]+'.'+LVSLUG[m[1]];
  if((m=tok.match(/^cb(\d+)$/)))return 'cac-rui-ro.canh-bao.'+m[1];
  if((m=tok.match(/^bk(\d)$/)))return 'cong-cu-kiem-tra.kiem-tra-'+m[1];
  if((m=tok.match(/^doc(\d)$/)))return 'cac-rui-ro.bai-doc-chuyen-de-'+m[1];
  if((m=tok.match(/^art([\d-]+)$/)))return 'cac-rui-ro.doc-them-'+m[1];
  if((m=tok.match(/^qa(\d)$/)))return 'hoi-dap.'+m[1];
  if((m=tok.match(/^pol(ng|cc)$/)))return 'chinh-sach.'+m[1];
  return tok;
}
function keyOf(obj,val){for(var k in obj)if(obj[k]===val)return k;return null}
function resolve(tok){
  var t=canon(tok),m,p=t.split('.');
  if(!t)return vHome();
  if(p[0]==='khan-cap'){
    if(!p[1])return vKhancap();
    if(p[1]==='kiem-tra')return vWizard();
    if((m=p[1].match(/^viec-can-lam-([23])$/)))return vKhancap(m[1]);
    var pb=keyOf(PBSLUG,p[1]);if(pb!==null)return vPB(pb);
    return vKhancap();
  }
  if(p[0]==='cong-cu-kiem-tra'){
    if(!p[1])return vCongcu();
    if(TOOLSLUG[p[1]])return vTool(p[1]);
    if((m=p[1].match(/^kiem-tra-(\d)$/)))return vBk(m[1]);
    return vCongcu();
  }
  if(p[0]==='cac-rui-ro'){
    if(!p[1])return vRuiro('canh-bao');
    if((m=p[1].match(/^bai-doc-chuyen-de-(\d)$/)))return vDoc(m[1]);
    if((m=p[1].match(/^doc-them-([\d-]+)$/)))return vArt(m[1]);
    if(p[1]==='canh-bao'&&p[2])return vAlert(p[2]);
    if(p[2]){var lv=keyOf(LVSLUG,p[2]);if(lv!==null)return vLv(lv)}
    return vRuiro(p[1]);
  }
  if(p[0]==='hoi-dap')return vHoidap(p[1]);
  if(p[0]==='lien-he'){var r=vLienhe();if(p[1]==='nguon')r.after=function(){var n=document.getElementById('nguon');if(n){try{n.scrollIntoView({block:'start'})}catch(e){}var h=n.querySelector('h2');if(h){h.setAttribute('tabindex','-1');try{h.focus({preventScroll:true})}catch(e){}}}};return r}
  if(t==='ve-website')return vGioithieu();
  if(t==='nguyen-tac-noi-dung')return vNguyentac();
  if(t==='chinh-sach-bao-mat')return vPol('dl');
  if(t==='dieu-khoan-su-dung')return vPol('mt');
  if(p[0]==='chinh-sach')return vPol(p[1]);
  if(t==='xac-minh-dung-trang')return vDungtrang();
  if(t==='hoat-dong')return vHoatdong();
  if(t==='dang-ky')return vDangky();
  if(t==='gop-y')return vGopy();
  if(t==='da-gui')return vSent();
  if((m=t.match(/^thu(\d)?$/)))return vThu(m[1]);
  if((m=t.match(/^thi(\d|dn\d?)?$/)))return vBank(m[1]);
  return vHome();
}
/* Chân trang rút gọn, không có khu vực tài trợ: KHẨN CẤP, công cụ, Hỏi – Đáp, Hoạt động (Điều 27 khoản 1a) */
var SHORTFOOT={'khan-cap':1,'cong-cu-kiem-tra':1,'hoi-dap':1,'hoat-dong':1};
function navHTML(){
  return NAV.map(function(n){return '<button type="button" data-go="'+n.k+'" data-nav="'+n.k+'"'+(n.urg?' class="t-urg"':'')+'>'+ic(n.i)+'<span>'+esc(n.t)+'</span></button>'}).join('');
}
function mbarHTML(){
  return NAV.map(function(n){return '<button type="button" data-go="'+n.k+'" data-nav="'+n.k+'"'+(n.urg?' class="mb-urg"':'')+'>'+ic(n.i)+'<span>'+esc(n.sh)+'</span></button>'}).join('');
}
function jump0(){try{window.scrollTo({top:0,left:0,behavior:'instant'})}catch(e){window.scrollTo(0,0)}}
function setNav(nav){
  document.querySelectorAll('[data-nav]').forEach(function(b){
    if(b.dataset.nav===nav)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  document.body.classList.toggle('shortfoot',!!SHORTFOOT[nav]);
}
function stopSpeak(){try{if(window.speechSynthesis)speechSynthesis.cancel()}catch(e){}SPEAK=false}
var CUR=null,SPEAK=false;
function render(tok){
  if(BST.tmr){clearInterval(BST.tmr);BST.tmr=null}
  stopSpeak();
  var r=resolve(tok);
  VIEW.innerHTML='<div class="wrap view">'+r.html+'</div>';
  setNav(r.nav);
  VIEW.querySelectorAll('[data-tick]').forEach(function(c){if(store('t_'+c.dataset.tick)==='1')c.checked=true});
  jump0();
  if(CUR!==null){var h=VIEW.querySelector('h1');if(h){h.setAttribute('tabindex','-1');try{h.focus({preventScroll:true})}catch(e){}}}
  CUR=canon(tok);
  if(r.after)r.after();   /* sau cùng: trang có thể tự cuộn tới một mục, hoặc chuyển tiêu điểm sang câu hỏi đầu tiên */
  HL=null;
}
function go(tok){
  var c=canon(tok);
  render(c);
  try{history.pushState({t:c},'',c?'#'+c:location.pathname+location.search)}catch(e){}
}
function urgent(){
  if(!document.getElementById('viec-can-lam'))go('khan-cap');
  var s=document.getElementById('viec-can-lam'),d=VIEW.querySelector('.door');
  if(s){try{s.scrollIntoView({block:'start'})}catch(e){}}
  if(d){try{d.focus({preventScroll:true})}catch(e){}}
}

/* ================= hành động ================= */
function pageURL(){return location.href.split('#')[0]+(CUR?'#'+CUR:'')}
/* Gửi: chép đường dẫn (mọi nơi). Bản chạy độc lập có thêm nút chia sẻ của máy (Zalo, Messenger…) và Facebook. */
function shareOpen(btn,text){
  var p=document.getElementById('sharep');if(!p)return;
  if(!p.hidden){p.hidden=true;btn.setAttribute('aria-expanded','false');return}
  var url=pageURL(),body=text?text+' '+url:url;
  p.innerHTML='<label class="lbl" for="sharetxt">'+(text?'Nội dung gửi cho người thân':'Đường dẫn của trang này')+'</label>'+
    (text?'<textarea id="sharetxt" readonly rows="5">'+esc(body)+'</textarea>':'<input type="text" id="sharetxt" readonly value="'+esc(url)+'">')+
    '<div class="btnrow"><button type="button" class="btn pri sm" data-act="copyshare">'+ic('copy')+'Sao chép</button>'+
    (STANDALONE&&navigator.share?'<button type="button" class="btn ghost sm" data-act="nativeshare">'+ic('share')+'Gửi qua Zalo, Messenger…</button>':'')+
    (STANDALONE?'<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)+'">Chia sẻ lên Facebook</a>':'')+'</div>'+
    '<p class="small">Sao chép rồi dán vào Zalo, Messenger hoặc tin nhắn. Nội dung không chứa câu trả lời riêng của bạn ngoài kết quả ở trên.</p>';
  p.hidden=false;btn.setAttribute('aria-expanded','true');
  var s=document.getElementById('sharetxt');if(s)try{s.focus();s.select()}catch(e){}
}
function copyShare(){
  var s=document.getElementById('sharetxt'),msg=document.getElementById('pagemsg');if(!s)return;
  function show(ok){if(!msg)return;msg.hidden=false;msg.textContent=ok?'Đã sao chép. Dán vào Zalo, Messenger hoặc Facebook để gửi cho người thân.':'Máy chưa cho sao chép tự động. Hãy giữ ngón tay trên ô chữ ở trên, chọn tất cả rồi sao chép.';if(!ok){try{s.focus();s.select()}catch(e){}}}
  try{navigator.clipboard.writeText(s.value).then(function(){show(true)},function(){show(false)})}catch(e){show(false)}
}
function nativeShare(){
  var s=document.getElementById('sharetxt'),t=(VIEW.querySelector('h1')||{}).textContent||'antoantaichinh.vn';
  try{navigator.share({title:t,text:s&&s.tagName==='TEXTAREA'?s.value:'Nhận diện lừa đảo và rủi ro tài chính · Biết cách tự bảo vệ',url:pageURL()}).catch(function(){})}catch(e){}
}
function speak(btn){
  var msg=document.getElementById('pagemsg');
  if(!('speechSynthesis' in window))return;
  if(SPEAK){stopSpeak();btn.setAttribute('aria-pressed','false');btn.querySelector('span').textContent='Nghe bài viết';return}
  var root=VIEW.querySelector('article')||VIEW.querySelector('.view');
  var clone=root.cloneNode(true);clone.querySelectorAll('.tools,.toc,.crumbs,.backrow,.btnrow,.printfoot,button.more,input,.okmsg,.sharep,.printonly').forEach(function(e){e.remove()});
  var text=(clone.innerText||clone.textContent||'').replace(/\s+/g,' ').trim();
  var voices=speechSynthesis.getVoices(),vi=voices.filter(function(v){return /^vi/i.test(v.lang)})[0];
  if(!vi&&msg){msg.hidden=false;msg.textContent='Máy của bạn có thể chưa có giọng đọc tiếng Việt. Nếu không nghe thấy, hãy dùng chức năng đọc màn hình có sẵn của điện thoại.'}
  var parts=text.match(/[^.!?…]+[.!?…]*/g)||[text],chunks=[],cur='';
  parts.forEach(function(p){if((cur+p).length>220){if(cur)chunks.push(cur);cur=p}else cur+=p});if(cur)chunks.push(cur);
  SPEAK=true;btn.setAttribute('aria-pressed','true');btn.querySelector('span').textContent='Dừng nghe';
  chunks.forEach(function(c,i){var u=new SpeechSynthesisUtterance(c.trim());u.lang='vi-VN';if(vi)u.voice=vi;u.rate=.95;
    if(i===chunks.length-1)u.onend=function(){SPEAK=false;btn.setAttribute('aria-pressed','false');btn.querySelector('span').textContent='Nghe bài viết'};speechSynthesis.speak(u)});
}
function rrRefresh(){var l=document.getElementById('rrlist');if(l)l.innerHTML=rrList()}
function act(name,el){
  if(name==='clrticks'){VIEW.querySelectorAll('[data-tick]').forEach(function(c){c.checked=false;del('t_'+c.dataset.tick)});return}
  if(name==='sharepage'){shareOpen(el);return}
  if(name==='sharetext'){var p=document.getElementById('sharep');shareOpen(el,p&&p.dataset.text);return}
  if(name==='copyshare'){copyShare();return}
  if(name==='nativeshare'){nativeShare();return}
  if(name==='share'){share();return}
  if(name==='speak'){speak(el);return}
  if(name==='bnext'){bankNext(el);return}
  if(name==='tsz'){setBig(!isBig());return}
  if(name==='rrsearch'){var q=document.getElementById('rrq');RF.q=(q&&q.value||'').trim();RF.n=12;rrRefresh();return}
  if(name==='rrmore'){RF.n+=12;rrRefresh();return}
  if(name==='rrclear'){RF.q='';RF.ch='';RF.gr='';RF.lv='';RF.dt='';RF.n=12;var qi=document.getElementById('rrq');if(qi)qi.value='';VIEW.querySelectorAll('[data-rrf]').forEach(function(s){s.value=''});rrRefresh();return}
}
window.addEventListener('popstate',function(){render(location.hash.slice(1))});

/* ================= hành động ================= */
function share(){
  var url=location.href.split('#')[0],msg=document.getElementById('sharemsg'),inp=document.getElementById('shareurl');
  function show(ok){msg.hidden=false;msg.textContent=ok?'Đã chép đường dẫn. Dán vào Zalo hoặc Facebook để gửi cho người thân.':'Chép đường dẫn dưới đây rồi dán vào Zalo hoặc Facebook:';inp.value=url;inp.hidden=ok;if(!ok){try{inp.focus();inp.select()}catch(e){}}}
  function copy(){try{navigator.clipboard.writeText(url).then(function(){show(true)},function(){show(false)})}catch(e){show(false)}}
  if(STANDALONE&&navigator.share){navigator.share({title:'antoantaichinh.vn',text:'Nhận diện lừa đảo và rủi ro tài chính · Biết cách tự bảo vệ',url:url}).catch(function(err){if(!err||err.name!=='AbortError')show(false)})}
  else copy();
}
/* Gửi biểu mẫu. Hai cách nhận, đặt trong index.html trước app.js (xem README):
   window.ATTC_API = 'https://…/api' : máy chủ nhận. Ba điểm nhận (POST, JSON): /questions · /feedback · /registrations.
   window.ATTC_MAIL = 'ten@mien.vn'  : hộp thư nhận góp ý và câu hỏi; người gửi bấm Gửi trong ứng dụng thư của họ.
   Chưa đặt cách nào thì biểu mẫu không hiện, trang ghi rõ nơi nhận sẽ được công bố. Không bao giờ báo “đã gửi” khi chưa gửi. */
function send(kind,payload,formSel,errId,done,onStatus){
  var f=document.querySelector(formSel),hp=f&&f.querySelector('.hp input');
  if(hp&&hp.value)return;                       /* máy tự điền ô ẩn: bỏ qua lặng lẽ */
  if(!API){
    if(MAIL&&payload.mail){try{location.href='mailto:'+MAIL+'?subject='+encodeURIComponent(payload.mail[0])+'&body='+encodeURIComponent(payload.mail[1])}catch(e){}done('mail')}
    return;
  }
  delete payload.mail;
  var btn=f.querySelector('[type=submit]'),er=document.getElementById(errId);
  btn.disabled=true;er.hidden=true;
  fetch(API+'/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){
      if(r.ok){done();return}
      var m=onStatus&&onStatus(r.status);
      throw new Error(m||'net');
    })
    .catch(function(x){
      btn.disabled=false;
      er.textContent=(x&&x.message&&x.message!=='net'&&x.message.indexOf('fetch')<0)?x.message:'Chưa gửi được. Có thể mạng đang chập chờn hoặc máy chủ đang bận. Nội dung bạn gõ vẫn còn nguyên, hãy bấm gửi lại.';
      er.hidden=false;
    });
}
function submitForm(name){
  if(name==='ask'){
    var t=(document.getElementById('qtext').value||'').trim(),rep=document.getElementById('qreply').checked,
        c=(document.getElementById('qcontact').value||'').trim(),ok=document.getElementById('qok').checked,pub=document.getElementById('qpub').checked,er=document.getElementById('qerr'),msg='';
    if(t.length<8)msg='Câu hỏi còn trống hoặc quá ngắn. Viết thêm một chút để Ban biên tập hiểu chuyện bạn gặp.';
    else if(/\d{9,}/.test(t.replace(/[\s.\-]/g,'')))msg='Câu hỏi có một dãy số dài, có thể là số tài khoản, số thẻ hay số giấy tờ. Hãy xóa dãy số đó rồi gửi lại.';
    else if(rep&&!c)msg='Bạn đã chọn nhận trả lời riêng. Hãy để lại thư điện tử hoặc số điện thoại, hoặc bỏ chọn ô đó.';
    else if(!ok)msg='Cần tích ô bắt buộc thì Ban biên tập mới được đọc và trả lời câu hỏi.';
    else if(!pub&&!rep)msg='Bạn chưa cho đăng công khai và chưa để lại cách liên lạc, nên Ban biên tập không có cách gửi câu trả lời. Hãy chọn một trong hai.';
    if(msg){er.textContent=msg;er.hidden=false;return}
    send('questions',{text:t,wantReply:rep,contact:rep?c:null,consent:true,publish:pub,mail:['[Hỏi – Đáp] antoantaichinh.vn',t+(rep?'\n\nXin trả lời riêng qua: '+c:'')+'\n\nCho đăng công khai sau khi biên tập và che thông tin cá nhân: '+(pub?'có':'không')]},'form[data-form=ask]','qerr',function(mode){er.hidden=true;if(mode==='mail'){document.getElementById('qdone').hidden=false;return}go('dagui')});return;
  }
  if(name==='gopy'){
    var g=(document.getElementById('gtext').value||'').trim(),gok=document.getElementById('gok').checked,ge=document.getElementById('gerr'),gm='';
    if(g.length<3)gm='Góp ý còn trống. Một câu ngắn cũng được.';
    else if(!gok)gm='Cần tích ô đồng ý thì Ban biên tập mới được dùng góp ý.';
    if(gm){ge.hidden=false;ge.textContent=gm;document.getElementById('gdone').hidden=true;return}
    var pzok=document.getElementById('pzok'),pz=pzok&&pzok.checked?{name:(document.getElementById('pzname').value||'').trim(),phone:normPhone(document.getElementById('pzphone').value)}:null;
    send('feedback',{text:g,consent:true,prize:pz,mail:['[Góp ý] antoantaichinh.vn',g]},'form[data-form=gopy]','gerr',function(){ge.hidden=true;document.getElementById('gdone').hidden=false});return;
  }
  if(name==='reg'){
    var nm=(document.getElementById('rgname').value||'').trim(),ph=normPhone(document.getElementById('rgphone').value),
        rok=document.getElementById('rgok').checked,re=document.getElementById('rgerr'),rm='';
    if(!nm)rm='Chưa có họ tên. Ban Tổ chức cần tên để xác minh khi trao giải.';
    else if(ph.length<9||ph.length>11)rm='Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.';
    else if(!rok)rm='Cần tích ô đồng ý với Thể lệ và nội dung xử lý dữ liệu thì mới vào thi được.';
    else if(tries(ph)>=MAXTRY)rm='Số '+ph+' đã dùng hết '+MAXTRY+' lượt thi. Mỗi số điện thoại chỉ được thi tối đa '+MAXTRY+' lượt.';
    if(rm){re.textContent=rm;re.hidden=false;return}
    var org=document.getElementById('rgorg');
    send('registrations',{name:nm,phone:ph,org:org?(org.value||'').trim():'',consent:true},'form[data-form=reg]','rgerr',function(){
      store('rg_'+ph,String(tries(ph)+1));store('rg_cur',ph);store('rg_name',nm);go('thi');
    },function(st){return st===409?'Số '+ph+' đã dùng hết '+MAXTRY+' lượt thi. Mỗi số điện thoại chỉ được thi tối đa '+MAXTRY+' lượt.':''});
  }
}
document.addEventListener('click',function(e){
  var t;
  if((t=e.target.closest('.skip'))){e.preventDefault();try{VIEW.focus()}catch(x){}return}
  if((t=e.target.closest('[data-wz]'))){wzAct(t.dataset.wz,t.dataset.v,t);return}
  if((t=e.target.closest('[data-ts]'))){tsAct(t.dataset.ts,t.dataset.v);return}
  if((t=e.target.closest('[data-t3]'))){t3Act(t.dataset.t3,t.dataset.v);return}
  if((t=e.target.closest('[data-go]'))){
    e.preventDefault();
    if(t.dataset.hl!==undefined)HL=+t.dataset.hl;
    if(t.dataset.rf){var f=t.dataset.rf.split(':');RFPRE=[f[0],f[1]]}
    if(t.dataset.keepq)RF.keepq=true;
    go(t.dataset.go);return;
  }
  if((t=e.target.closest('[data-urgent]'))){e.preventDefault();urgent();return}
  if((t=e.target.closest('[data-door]'))){openDoor(t);return}
  if((t=e.target.closest('[data-open]'))){
    var b=document.getElementById(t.dataset.open);if(!b)return;
    var op=!b.hidden;b.hidden=op;t.setAttribute('aria-expanded',String(!op));return;
  }
  if((t=e.target.closest('[data-jump]'))){var j=document.getElementById(t.dataset.jump);if(j){j.scrollIntoView({block:'start'});var fd=t.dataset.focus&&j.querySelector('.'+t.dataset.focus)||j.querySelector('h2,h3');if(fd){if(!fd.matches('button'))fd.setAttribute('tabindex','-1');try{fd.focus({preventScroll:true})}catch(x){}}}return}
  if((t=e.target.closest('[data-print]'))){try{window.print()}catch(x){}return}
  if((t=e.target.closest('[data-act]'))){act(t.dataset.act,t);return}
  if((t=e.target.closest('[data-bstart]'))){BST.cd=t.dataset.bstart;BST.i=0;BST.right=0;BST.done=[];bankQ();return}
  if((t=e.target.closest('.qzo'))){
    var w=t.closest('.qz');if(!w||w.classList.contains('done'))return;
    if(w.dataset.mode==='bank'){answerBank(w,t);return}
    var i=+w.dataset.i;THU.ans[i]=t.dataset.k;showResult(w,SAMPLE[i].q,t.dataset.k);
    var dot=VIEW.querySelectorAll('.dots button')[i];if(dot)dot.classList.add('done');
  }
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.matches&&t.matches('[data-tick]')){if(t.checked)store('t_'+t.dataset.tick,'1');else del('t_'+t.dataset.tick);return}
  if(t.id==='qreply'){document.getElementById('qcontactwrap').hidden=!t.checked}
  if(t.dataset&&t.dataset.rrf){RF[t.dataset.rrf]=t.value;RF.n=12;rrRefresh()}
});
/* Tìm trong danh sách: lọc ngay khi gõ, có độ trễ ngắn cho máy yếu */
var RRT=null;
document.addEventListener('input',function(e){
  if(e.target.id==='rrq'){var v=e.target.value;clearTimeout(RRT);RRT=setTimeout(function(){RF.q=v.trim();RF.n=12;rrRefresh()},180)}
});
document.addEventListener('keydown',function(e){
  if(e.target.id==='rrq'&&e.key==='Enter'){e.preventDefault();clearTimeout(RRT);RF.q=e.target.value.trim();RF.n=12;rrRefresh()}
});
document.addEventListener('submit',function(e){e.preventDefault();var f=e.target.closest('[data-form]');if(!f)return;if(f.dataset.form==='bk'){bkResult(f.dataset.n);return}submitForm(f.dataset.form)});

if(!document.documentElement.lang)document.documentElement.lang='vi';
/* Chữ lớn: phóng to vùng nội dung thêm 25% (đặc tả: 20–30%) */
function setBig(on){
  document.documentElement.classList.toggle('big',on);
  document.querySelectorAll('[data-act=tsz]').forEach(function(b){b.setAttribute('aria-pressed',String(on))});
  if(on)store('tsz','1');else del('tsz');
}
if(store('tsz')==='1')setBig(true);
(function(){var dn=document.querySelector('.dnav');if(dn)dn.innerHTML=navHTML();var mb=document.querySelector('.mbar');if(mb)mb.innerHTML=mbarHTML();
  var f2=document.querySelector('.flinks2');if(f2&&ACTIVITY.on)f2.insertAdjacentHTML('beforeend','<button data-go="hoat-dong" data-nav="hoat-dong">'+esc(ACTIVITY.t)+'</button>');})();
render(location.hash.slice(1));
try{history.replaceState({t:canon(location.hash.slice(1))},'')}catch(e){}
})();

