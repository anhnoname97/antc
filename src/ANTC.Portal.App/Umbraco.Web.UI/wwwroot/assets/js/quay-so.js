/* Man quay so cua Ban to chuc: bang dieu khien (/quay-so/{id}) va man trinh chieu (/quay-so/{id}/trinh-chieu).
   Moi so lieu lay tu API /api/v1/quay-so; trinh duyet khong tu chon hay gia lap nguoi trung.
   Du lieu tu may chu chi dua vao DOM bang textContent. */
(function () {
  'use strict';
  var root = document.querySelector('.qd-root');
  if (!root) return;

  var MODE = root.dataset.mode;
  var ID = root.dataset.contestId;
  var API = root.dataset.api;
  var HOME = root.dataset.home;
  var STAGE_URL = root.dataset.stageUrl;
  var CH = 'antc-quay-so-' + ID;
  var KEY = 'antc-quay-so-state-' + ID;
  var PING = 'antc-quay-so-ping-' + ID;
  var R = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Bang chu cua ma du thi 'AD-' + 6 ky tu (ContestEntryService)
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var PREFIX = 'AD-';
  var CODE_RE = /^AD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
  var CELL = 260;
  var LOOPS = 8;
  var DIGITS = 6;

  /* ---------- tien ich ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function pad2(n) { return ('0' + n).slice(-2); }
  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
  }
  function fmtDate(d) { return d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  /* ---------- API ---------- */
  function ApiError(status, code, message, fields) {
    this.status = status;
    this.code = code;
    this.message = message;
    this.fields = fields;
  }
  function request(path, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    return fetch(API + path, opts).then(function (res) {
      return res.text().then(function (txt) {
        var body = null;
        try { body = txt ? JSON.parse(txt) : null; } catch (e) { body = null; }
        if (res.ok) return body;
        var err = body && body.error ? body.error : {};
        throw new ApiError(res.status, err.code || '', err.message || '', err.fields || null);
      });
    });
  }
  function fetchDetail() {
    var q = S.minScore != null ? '?minScore=' + encodeURIComponent(S.minScore) : '';
    return request('/contests/' + encodeURIComponent(ID) + q);
  }

  /* ---------- trang thai dung chung giua hai cua so ---------- */
  var S = { seq: 0, scene: 'idle', cur: null, minScore: null, opt: { live: false, ticker: true, transparent: false }, evt: null };
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && typeof v === 'object') {
        S.seq = v.seq || 0;
        if (v.scene === 'idle' || v.scene === 'draw' || v.scene === 'summary') S.scene = v.scene;
        if (typeof v.cur === 'number') S.cur = v.cur;
        if (typeof v.minScore === 'number') S.minScore = v.minScore;
        if (v.opt) S.opt = { live: !!v.opt.live, ticker: v.opt.ticker !== false, transparent: !!v.opt.transparent };
      }
    } catch (e) { /* bo qua */ }
  }
  load();
  var lastSeq = S.seq || 0;
  var bc = null;
  try { bc = new BroadcastChannel(CH); } catch (e) { bc = null; }

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bo qua */ } }
  function publish(evt) {
    S.seq = Math.max(S.seq || 0, lastSeq) + 1;
    lastSeq = S.seq;
    S.evt = evt || null;
    persist();
    if (bc) try { bc.postMessage(S); } catch (e) { /* bo qua */ }
  }
  var pingSeen = 0;
  function receive(ns) {
    if (!ns || !ns.seq || ns.seq <= lastSeq) return;
    lastSeq = ns.seq;
    var evt = ns.evt;
    S = ns;
    applyAll(evt);
  }
  if (bc) bc.onmessage = function (m) {
    if (m.data && m.data.ping) { pingSeen = Date.now(); return; }
    receive(m.data);
  };
  addEventListener('storage', function (e) {
    if (e.key === KEY && e.newValue) { try { receive(JSON.parse(e.newValue)); } catch (x) { /* bo qua */ } }
    if (e.key === PING) pingSeen = Date.now();
  });

  /* ---------- du lieu cuoc thi ---------- */
  var D = null;          // chi tiet cuoc thi tu API
  var PRIZES = [];       // giai theo sortOrder
  var spinning = false;  // dang cho ket qua / dang chay hieu ung
  var pending = null;    // { requestId, prizeId, minScore } cua lan bam chua ro ket qua
  var savingOpt = false; // dang gui PUT tuy chon hien thi

  function applyDetail(d) {
    D = d;
    // Tuy chon hien thi luu theo cuoc thi trong CSDL; dang luu do thi giu gia tri vua bam
    if (d.display && !savingOpt) {
      S.opt = { live: !!d.display.showLiveBadge, ticker: !!d.display.showAntiScamTicker, transparent: !!d.display.transparentBackground };
    }
    PRIZES = d.prizes.slice().sort(function (a, b) { return a.sortOrder - b.sortOrder || a.prizeId - b.prizeId; });
    var cur = prizeById(S.cur);
    if (!cur) {
      var open = PRIZES.filter(function (p) { return p.isActive && p.remaining > 0; })[0];
      S.cur = (open || PRIZES[0] || {}).prizeId || null;
    }
  }
  function prizeById(id) {
    for (var i = 0; i < PRIZES.length; i++) if (PRIZES[i].prizeId === id) return PRIZES[i];
    return null;
  }
  function prizeIndex(id) {
    for (var i = 0; i < PRIZES.length; i++) if (PRIZES[i].prizeId === id) return i;
    return 0;
  }
  // Hang giai suy tu ten: 1 Nhat, 2 Nhi, 3 Ba, 4 Khuyen khich; khong khop thi tra 0
  function prizeRank(p) {
    var n = ((p && p.name) || '').toLowerCase();
    if (n.indexOf('nhất') >= 0) return 1;
    if (n.indexOf('nhì') >= 0) return 2;
    if (n.indexOf('khuyến khích') >= 0) return 4;
    if (/(^|\s)ba(\s|$)/.test(n)) return 3;
    return 0;
  }
  function medalClass(id) {
    var r = prizeRank(prizeById(id));
    return 'm-p' + (r || prizeIndex(id) % 4 + 1);
  }
  function medalText(p) {
    var r = prizeRank(p);
    return r === 4 ? 'KK' : r ? String(r) : (p.code || '').slice(0, 3).toUpperCase();
  }
  function shortPrize(name) { return String(name || '').replace('Giải ', ''); }
  // Nguoi da bi huy chi con trong bang dieu khien va bien ban, khong hien tren man chieu
  function winnersOf(id) { return D ? D.winners.filter(function (w) { return w.prizeId === id && !w.cancelled; }) : []; }
  function lastWin() {
    var ws = winnersOf(S.cur);
    return ws.length ? ws[ws.length - 1] : null;
  }
  function totals() {
    var q = 0, a = 0;
    PRIZES.forEach(function (p) { q += p.quantity; a += p.awarded; });
    return { quantity: q, awarded: a };
  }
  function minScoreText() { return D ? 'đạt ≥ ' + D.minScore + ' điểm' : 'đạt điểm'; }

  /* ---------- trong quay (svg trang tri) ---------- */
  function drum(svg) {
    var NS = 'http://www.w3.org/2000/svg';
    function node(t, a, p) {
      var e = document.createElementNS(NS, t);
      for (var k in a) e.setAttribute(k, a[k]);
      p.appendChild(e);
      return e;
    }
    var g = node('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }, svg);
    [60, 96, 150, 200, 262, 330, 400, 470].forEach(function (r, i) {
      node('circle', { r: r, 'stroke-dasharray': i % 3 === 2 ? '3 9' : 'none' }, g);
    });
    var d = '';
    for (var i = 0; i < 28; i++) {
      var a = i * Math.PI / 14, r = i % 2 ? 22 : 58;
      d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
    }
    node('path', { d: d + 'Z', fill: 'currentColor', stroke: 'none' }, g);
    for (i = 0; i < 36; i++) {
      var b = i * Math.PI / 18;
      node('path', { d: 'M' + (Math.cos(b) * 205) + ' ' + (Math.sin(b) * 205) + 'L' + (Math.cos(b + 0.06) * 255) + ' ' + (Math.sin(b + 0.06) * 255) }, g);
    }
    for (i = 0; i < 72; i++) {
      var e = i * Math.PI / 36;
      node('circle', { cx: Math.cos(e) * 365, cy: Math.sin(e) * 365, r: 3.5 }, g);
    }
  }

  /* ---------- Stage (1920x1080, co gian bang transform) ---------- */
  function Stage(wrap, interactive) {
    var self = this;
    wrap.appendChild($('stageTpl').content.cloneNode(true));
    this.wrap = wrap;
    this.el = wrap.querySelector('.stage');
    this.busy = false;
    drum(this.el.querySelector('.st-drum'));

    var rs = this.el.querySelector('.reels');
    this.reels = [];
    rs.appendChild(el('div', 'dg dg-fix', PREFIX));
    for (var d = 0; d < DIGITS; d++) {
      var cell = el('div', 'dg');
      var strip = el('div', 'strip');
      // O dau dai la ky tu cho: chua quay hoac ma khong dung dang thi dung o day, khong hien chu A gia
      strip.appendChild(el('span', 'blank', '–'));
      for (var l = 0; l < LOOPS; l++) {
        for (var x = 0; x < ALPHA.length; x++) strip.appendChild(el('span', null, ALPHA.charAt(x)));
      }
      cell.appendChild(strip);
      rs.appendChild(cell);
      this.reels.push({ el: strip, pos: 0 });
    }

    this.fit = function () {
      var W = wrap.clientWidth, H = wrap.clientHeight, s = Math.min(W / 1920, H / 1080);
      self.el.style.transform = 'translate(' + (-960 * s) + 'px,' + (-540 * s) + 'px) scale(' + s + ')';
    };
    addEventListener('resize', this.fit);
    this.fit();

    this.tk = 0;
    var ps = this.el.querySelectorAll('.tk p');
    setInterval(function () {
      ps[self.tk].classList.remove('on');
      self.tk = (self.tk + 1) % ps.length;
      ps[self.tk].classList.add('on');
    }, 6000);

    this.keys = this.el.querySelector('.keys');
    if (interactive && MODE === 'stage') {
      this.keys.classList.add('on');
      setTimeout(function () { self.keys.classList.remove('on'); }, 6000);
    }
  }
  Stage.prototype.setPos = function (r, idx, anim, dur) {
    r.el.style.transition = anim ? 'transform ' + dur + 'ms cubic-bezier(.12,.75,.18,1)' : 'none';
    r.el.style.transform = 'translateY(' + (-idx * CELL) + 'px)';
    r.pos = idx;
  };
  Stage.prototype.text = function (sel, value) {
    this.el.querySelectorAll(sel).forEach(function (x) { x.textContent = value; });
  };
  Stage.prototype.render = function () {
    var e = this.el;
    ['idle', 'draw', 'summary'].forEach(function (s) { e.querySelector('.scene.' + s).classList.toggle('on', S.scene === s); });
    e.classList.toggle('show-live', !!S.opt.live);
    e.classList.toggle('hide-ticker', !S.opt.ticker);
    if (!D) return;

    // Ban dung chi co mot chuyen de; cuoc thi nhieu chuyen de thi chi ghi so luong de man chieu khong tran chu
    var tps = D.contest.topics;
    this.text('.cName', D.contest.name);
    this.text('.cTopic', tps.length === 1 ? tps[0] : tps.length + ' chuyên đề');
    e.querySelectorAll('.topicLb').forEach(function (x) { x.hidden = tps.length !== 1; });
    e.querySelectorAll('.topicWrap').forEach(function (x) { x.hidden = !tps.length; });
    e.querySelector('.idle h1').classList.toggle('long', D.contest.name.length > 28);
    this.text('.vParticipants', D.participants);
    this.text('.vOk', D.qualified);
    this.text('.vOkLb', 'người ' + minScoreText());
    this.text('.vPrizeTotal', totals().quantity);
    this.text('.hashS', D.listHash.length > 28 ? D.listHash.slice(0, 16) + '…' + D.listHash.slice(-8) : D.listHash);

    var p = prizeById(S.cur);
    if (!this.busy && p) {
      var md = e.querySelector('.vMedal');
      md.className = 'medal vMedal ' + medalClass(p.prizeId);
      md.textContent = medalText(p);
      this.text('.vPrize', p.name);
      this.text('.vTurn', p.remaining <= 0 ? 'Đã quay đủ ' + p.quantity + ' giải' : 'Lượt ' + (p.awarded + 1) + ' / ' + p.quantity);
      this.text('.vLeft', D.remainingInPool);
      var drawn = e.querySelector('.drawn');
      clear(drawn);
      var ws = winnersOf(p.prizeId);
      if (ws.length) {
        drawn.appendChild(el('em', null, 'Đã trúng:'));
        ws.forEach(function (w) { drawn.appendChild(el('span', null, w.code)); });
      }
    }

    var grid = e.querySelector('.sum-grid');
    clear(grid);
    // Giai Khuyen khich nhan dien theo ten (khong khop ten thi dung so luong >= 6) va xep cuoi, chiem ca hang
    function isKk(q) { var r = prizeRank(q); return r ? r === 4 : q.quantity >= 6; }
    PRIZES.filter(function (q) { return !isKk(q); }).concat(PRIZES.filter(isKk)).forEach(function (q) {
      var box = el('div', 'sg' + (isKk(q) ? ' kk' : ''));
      var h3 = el('h3');
      h3.appendChild(el('span', 'medal ' + medalClass(q.prizeId), medalText(q)));
      h3.appendChild(document.createTextNode(q.name));
      box.appendChild(h3);
      var ul = el('ul');
      var ws2 = winnersOf(q.prizeId);
      ws2.forEach(function (w) {
        var li = el('li');
        li.appendChild(el('b', null, w.code));
        li.appendChild(document.createTextNode(w.name));
        ul.appendChild(li);
      });
      for (var k = ws2.length; k < q.quantity; k++) ul.appendChild(el('li', 'empty', 'Chưa quay'));
      box.appendChild(ul);
      grid.appendChild(box);
    });
  };
  Stage.prototype.showWinner = function (w) {
    var plate = this.el.querySelector('.plate');
    clear(plate);
    var box = el('div', 'winner');
    var pz = prizeById(w.prizeId);
    box.appendChild(el('span', 'medal ' + (pz ? medalClass(pz.prizeId) : 'm-p1'), pz ? medalText(pz) : ''));
    var info = el('span');
    info.appendChild(el('div', 'nm', w.name));
    var mt = el('div', 'mt');
    mt.appendChild(document.createTextNode('Mã '));
    mt.appendChild(el('b', null, w.code));
    mt.appendChild(document.createTextNode(' · ' + w.phone));
    info.appendChild(mt);
    box.appendChild(info);
    plate.appendChild(box);
    this.el.querySelector('.reelbox').classList.add('win');
  };
  Stage.prototype.showWait = function (t) {
    var plate = this.el.querySelector('.plate');
    clear(plate);
    plate.appendChild(el('span', 'wait', t || 'Chuẩn bị quay…'));
    this.el.querySelector('.reelbox').classList.remove('win');
  };
  // Cac o so chay ngay khi bam QUAY, cho den khi may chu tra ket qua
  Stage.prototype.roll = function () {
    var self = this;
    this.busy = true;
    this.showWait('Đang quay…');
    this.reels.forEach(function (r) {
      self.setPos(r, 0, false);
      if (!R) r.el.classList.add('rolling');
    });
  };
  Stage.prototype.abort = function () {
    var self = this;
    this.busy = false;
    this.reels.forEach(function (r) { r.el.classList.remove('rolling'); });
    this.settle(lastWin());
    self.render();
  };
  // Dung cac o tai ma nguoi trung do may chu tra ve
  Stage.prototype.stop = function (w, done) {
    var self = this, chars = CODE_RE.test(w.code) ? w.code.slice(PREFIX.length) : null, n = 0;
    this.busy = true;
    function fin() {
      if (++n < self.reels.length) return;
      self.busy = false;
      self.showWinner(w);
      if (done) done();
    }
    this.reels.forEach(function (r, i) {
      r.el.classList.remove('rolling');
      if (!chars) { self.setPos(r, 0, false); setTimeout(fin, 0); return; }
      var target = 1 + ALPHA.indexOf(chars.charAt(i));
      if (R) { self.setPos(r, target, false); fin(); return; }
      self.setPos(r, 0, false);
      r.el.getBoundingClientRect();
      var dur = 1800 + i * 500;
      self.setPos(r, (1 + i) * ALPHA.length + target, true, dur);
      setTimeout(fin, dur + 40);
    });
  };
  Stage.prototype.settle = function (w) {
    var self = this;
    var chars = w && CODE_RE.test(w.code) ? w.code.slice(PREFIX.length) : null;
    this.reels.forEach(function (r, i) { self.setPos(r, chars ? 1 + ALPHA.indexOf(chars.charAt(i)) : 0, false); });
    if (w) this.showWinner(w); else this.showWait();
  };

  /* ---------- gan Stage vao trang ---------- */
  var stages = [];
  if (MODE === 'stage') {
    stages.push(new Stage($('bigWrap'), true));
  } else {
    var sw = el('div', 'stage-wrap');
    $('preview').appendChild(sw);
    stages.push(new Stage(sw, false));
  }

  function renderAll() {
    stages.forEach(function (st) { st.render(); });
    renderCtl();
  }
  function applyAll(evt) {
    document.body.classList.toggle('transparent', !!S.opt.transparent);
    if (evt) {
      if (evt.type === 'spin-start') {
        stages.forEach(function (st) { st.roll(); });
        if (MODE === 'stage') { spinning = true; }
      } else if (evt.type === 'spin-result') {
        stages[0].stop(evt.winner, function () {
          if (MODE === 'stage') { spinning = false; reload(); }
        });
        return;
      } else if (evt.type === 'spin-fail') {
        spinning = false;
        stages.forEach(function (st) { st.abort(); });
      } else if (evt.type === 'prize') {
        stages.forEach(function (st) { st.settle(null); });
      } else if (evt.type === 'refresh') {
        reload();
        return;
      } else if (evt.type === 'cmd-spin') {
        if (MODE === 'control') startSpin();
        return;
      }
    }
    renderAll();
  }
  function reload() {
    return fetchDetail().then(function (d) { applyDetail(d); renderAll(); }, function (err) {
      if (MODE === 'stage') showStageStatus(err);
    });
  }
  function showStageStatus(err) {
    var s = $('stageStatus');
    if (!s) return;
    s.hidden = false;
    s.textContent = err && (err.status === 401 || err.status === 403)
      ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại ở cửa sổ điều khiển rồi tải lại trang này.'
      : 'Chưa nạp được dữ liệu quay số. Hãy tải lại trang.';
  }

  /* ---------- bang dieu khien ---------- */
  function setMsg(text, opts) {
    opts = opts || {};
    $('spinMsg').hidden = !text;
    $('spinMsgT').textContent = text || '';
    $('bRetry').hidden = !opts.retry;
    $('msgLogin').hidden = !opts.login;
    $('spinMsg').classList.toggle('warn', !!opts.warn);
  }
  function canSpin() {
    if (!D || spinning || pending) return false;
    var p = prizeById(S.cur);
    return !!(p && p.isActive && p.remaining > 0 && D.remainingInPool > 0);
  }
  function goSub() {
    var p = prizeById(S.cur);
    if (spinning) return 'Đang quay…';
    if (pending) return 'Chưa rõ kết quả';
    if (!p) return 'Chưa có giải';
    if (!p.isActive) return p.name + ' đã ngừng';
    if (p.remaining <= 0) return p.name + ' đã đủ';
    if (D.remainingInPool <= 0) return 'Hết người trong vòng quay';
    return p.name + ' · lượt ' + (p.awarded + 1) + '/' + p.quantity;
  }
  function renderCtl() {
    if (MODE !== 'control' || !D) return;
    document.querySelectorAll('.sc').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.scene === S.scene); });

    var box = $('pzs');
    clear(box);
    PRIZES.forEach(function (q) {
      var done = q.remaining <= 0;
      var b = el('button', 'pzb' + (done ? ' done' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(S.cur === q.prizeId));
      b.appendChild(el('span', 'medal ' + medalClass(q.prizeId), medalText(q)));
      var t = el('span');
      t.appendChild(el('b', null, shortPrize(q.name)));
      t.appendChild(el('span', null, q.awarded + ' / ' + q.quantity + (done ? ' · xong' : '')));
      b.appendChild(t);
      b.addEventListener('click', function () { setPrize(q.prizeId); });
      box.appendChild(b);
    });

    $('go').disabled = !canSpin();
    $('goSub').textContent = goSub();
    var tot = totals();
    $('cPart').textContent = D.participants;
    $('cOk').textContent = D.qualified;
    $('cOkLb').textContent = minScoreText();
    $('cLeft').textContent = D.remainingInPool;
    $('cWon').textContent = tot.awarded + '/' + tot.quantity;
    document.querySelectorAll('.hashT').forEach(function (x) { x.textContent = D.listHash; });

    var ms = $('minScore'), locked = D.winners.length > 0 || spinning || !!pending;
    if (document.activeElement !== ms) ms.value = D.minScore;
    ms.disabled = locked;
    $('minScoreHint').textContent = D.minScoreWarning ||
      (D.winners.length > 0 ? 'Đã có người trúng nên không sửa được' : 'Chỉ sửa được khi chưa có người trúng');

    var tb = $('tb');
    clear(tb);
    if (!D.winners.length) {
      var tr0 = el('tr'), td0 = el('td', 'empty', 'Chưa có kết quả');
      td0.colSpan = 5;
      tr0.appendChild(td0);
      tb.appendChild(tr0);
    } else {
      D.winners.slice().reverse().forEach(function (w) {
        var tr = el('tr', w.cancelled ? 'cancelled' : null);
        tr.appendChild(el('td', null, fmtTime(w.createdAt)));
        tr.appendChild(el('td', null, shortPrize(w.prizeName)));
        tr.appendChild(el('td', 'no', w.code));
        var who = el('td');
        who.appendChild(el('span', 'nm', w.name));
        who.appendChild(el('br'));
        who.appendChild(el('small', 'dim', w.phone));
        if (w.cancelled) {
          who.appendChild(el('br'));
          who.appendChild(el('small', 'why', 'Đã hủy' + (w.cancelReason ? ': ' + w.cancelReason : '')));
        }
        tr.appendChild(who);
        var act = el('td', 'act');
        if (!w.cancelled) {
          var b = el('button', 'tb sm', 'Hủy…');
          b.type = 'button';
          b.disabled = spinning || !!pending;
          b.setAttribute('aria-label', 'Hủy kết quả ' + w.code);
          b.addEventListener('click', function () { openCancel(w); });
          act.appendChild(b);
        }
        tr.appendChild(act);
        tb.appendChild(tr);
      });
    }
    document.querySelectorAll('.sw').forEach(function (s) { s.setAttribute('aria-checked', String(!!S.opt[s.dataset.opt])); });
  }

  function setScene(s) {
    S.scene = s;
    publish({ type: 'scene' });
    renderAll();
  }
  function setPrize(id) {
    if (spinning || pending || (stages[0] && stages[0].busy)) return;
    S.cur = id;
    S.scene = 'draw';
    publish({ type: 'prize' });
    stages.forEach(function (st) { st.settle(null); });
    renderAll();
  }
  function stepPrize(d) {
    if (!PRIZES.length) return;
    var i = prizeIndex(S.cur);
    setPrize(PRIZES[(i + d + PRIZES.length) % PRIZES.length].prizeId);
  }

  /* ---------- quay ---------- */
  function errorMessage(err) {
    switch (err.code) {
      case 'PRIZE_QUOTA_EXCEEDED': return 'Giải này đã đủ suất hoặc số người yêu cầu vượt quá số suất còn lại. Không có người trúng mới.';
      case 'DRAW_INSUFFICIENT_CANDIDATES': return 'Không còn đủ người đạt điều kiện trong vòng quay. Hãy hạ ngưỡng điểm (nếu chưa có người trúng) hoặc dừng quay giải này.';
      case 'DRAW_REQUEST_CHANGED': return 'Mã yêu cầu đã dùng cho một lần quay khác. Hãy bấm QUAY lại.';
      case 'PRIZE_INACTIVE': return 'Giải này đã ngừng hoạt động.';
      case 'PRIZE_NOT_IN_CONTEST': return 'Giải không thuộc cuộc thi này.';
      case 'CONTEST_NOT_FINISHED': return 'Cuộc thi chưa kết thúc nên chưa thể quay số.';
      case 'VALIDATION':
        var f = err.fields ? Object.keys(err.fields).map(function (k) { return err.fields[k]; }).join(' ') : '';
        return f || err.message || 'Dữ liệu gửi lên chưa hợp lệ.';
      default:
        return err.message || 'Không quay được (lỗi ' + err.status + '). Hãy tải lại trang rồi thử lại.';
    }
  }
  function fail(err) {
    spinning = false;
    var unknown = !(err instanceof ApiError) || err.status >= 500;
    if (unknown) {
      // Chua biet may chu da luu lan quay hay chua: giu nguyen requestId de Thu lai khong tao lan thu hai
      setMsg('Chưa rõ kết quả: mất kết nối hoặc máy chủ chưa trả lời. Lần quay có thể đã được ghi. Bấm “Thử lại” để lấy đúng kết quả, không tạo thêm lần quay.', { retry: true, warn: true });
    } else {
      pending = null;
      if (err.status === 401 || err.status === 403) {
        setMsg('Phiên đăng nhập đã hết hạn hoặc tài khoản không có quyền quay số. Hãy đăng nhập lại.', { login: true });
      } else {
        setMsg(errorMessage(err));
      }
    }
    publish({ type: 'spin-fail' });
    applyAll({ type: 'spin-fail' });
    if (!unknown && err.status === 409) reload();
  }
  // Gui lenh ghi (spin, huy, luu tuy chon) kem token antiforgery moi
  function send(path, method, body) {
    return request('/antiforgery', { cache: 'no-store' }).then(function (tok) {
      var headers = { 'Content-Type': 'application/json' };
      headers[tok.headerName] = tok.requestToken;
      return request('/contests/' + encodeURIComponent(ID) + path, { method: method, headers: headers, body: JSON.stringify(body) });
    });
  }
  function post(job) {
    return send('/spin', 'POST', { prizeId: job.prizeId, minScore: job.minScore, requestId: job.requestId });
  }
  function startSpin() {
    if (MODE !== 'control') return;
    var retry = !!pending && !spinning;
    if (!retry && !canSpin()) return;
    if (spinning) return;
    spinning = true;                               // khoa ngay, bam lien tuc khong tao them lan quay
    if (!retry) {
      pending = { requestId: uuid(), prizeId: S.cur, minScore: D.minScore };
    }
    var job = pending;
    setMsg('');
    S.scene = 'draw';
    publish({ type: 'spin-start' });
    applyAll({ type: 'spin-start' });
    renderCtl();
    post(job).then(function (res) {
      var winner = {
        code: res.winner.code, name: res.winner.name, phone: res.winner.phone,
        prizeId: res.prize.prizeId
      };
      pending = null;
      publish({ type: 'spin-result', winner: winner });
      stages[0].stop(winner, function () {
        spinning = false;
        reload();
      });
      renderCtl();
    }, fail);
  }

  /* ---------- in bien ban ---------- */
  function printMinutes() {
    if (!D) return;
    var area = $('print');
    clear(area);
    area.appendChild(el('h1', null, 'Biên bản quay số trúng thưởng'));
    var topics = D.contest.topics.join(', ');
    area.appendChild(el('p', null, 'Cuộc thi: ' + D.contest.name + (topics ? ' · Chuyên đề: ' + topics : '') + ' · antoantaichinh.vn'));
    area.appendChild(el('p', null, 'Ngưỡng điểm: ' + D.minScore + ' · Số người đủ điều kiện: ' + D.qualified + ' (trên tổng ' + D.participants + ' người dự thi)'));
    var hp = el('p', null, 'Mã kiểm chứng danh sách (SHA-256): ');
    hp.appendChild(el('code', null, D.listHash));
    area.appendChild(hp);
    area.appendChild(el('p', null, 'Ngày quay: ' + fmtDate(new Date())));

    var table = el('table'), head = el('tr');
    ['#', 'Giờ', 'Giải', 'Mã', 'Họ tên', 'Điện thoại', 'Ghi chú'].forEach(function (t) { head.appendChild(el('th', null, t)); });
    var thead = el('thead');
    thead.appendChild(head);
    table.appendChild(thead);
    var body = el('tbody');
    if (!D.winners.length) {
      var tr0 = el('tr'), td0 = el('td', null, 'Chưa có kết quả');
      td0.colSpan = 7;
      tr0.appendChild(td0);
      body.appendChild(tr0);
    }
    D.winners.forEach(function (w, i) {
      var tr = el('tr');
      var note = w.cancelled ? 'Đã hủy' + (w.cancelReason ? ': ' + w.cancelReason : '') : 'Hợp lệ';
      if (w.cancelled) tr.className = 'cancelled';
      [i + 1, fmtTime(w.createdAt), w.prizeName || '', w.code, w.name, w.phone, note].forEach(function (t) { tr.appendChild(el('td', null, String(t))); });
      body.appendChild(tr);
    });
    table.appendChild(body);
    area.appendChild(table);
    area.appendChild(el('p', 'sign', 'Đại diện Ban tổ chức · Đại diện cơ quan chứng kiến · Thư ký'));
    window.print();
  }

  /* ---------- huy ket qua ---------- */
  var cancelling = null;   // nguoi trung dang mo hop huy
  function syncWhy() {
    // Khong dung required: bong bao cua trinh duyet hien tieng Anh, kiem tra o confirmCancel
    $('whyText').hidden = $('why').value !== 'khac';
  }
  function dlgError(text) {
    $('dlgErr').hidden = !text;
    $('dlgErr').textContent = text || '';
  }
  function openCancel(w) {
    if (spinning || pending) return;
    cancelling = w;
    $('dlgP').textContent = 'Mã ' + w.code + ' (' + w.name + ', ' + (w.prizeName || 'giải') + ') sẽ bị gạch trong biên bản và không vào vòng quay nữa. Suất giải này được quay lại cho người khác.';
    $('why').selectedIndex = 0;
    $('whyText').value = '';
    syncWhy();
    dlgError('');
    $('dlgOk').disabled = false;
    $('dlg').showModal();
  }
  function confirmCancel() {
    var w = cancelling;
    if (!w) return;
    var code = $('why').value, text = $('whyText').value.trim();
    if (code === 'khac' && !text) { dlgError('Hãy ghi lý do để đưa vào biên bản.'); $('whyText').focus(); return; }
    $('dlgOk').disabled = true;
    dlgError('');
    send('/winners/' + encodeURIComponent(w.drawId) + '/' + encodeURIComponent(w.rank) + '/cancel', 'POST',
      { reasonCode: code, reasonText: code === 'khac' ? text : null })
      .then(function () {
        cancelling = null;
        $('dlg').close();
        setMsg('');
        publish({ type: 'refresh' });
        reload();
      }, function (err) {
        $('dlgOk').disabled = false;
        if (err instanceof ApiError && err.status === 409) {
          dlgError('Kết quả này đã được hủy trước đó.');
          reload();
        } else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          dlgError('Phiên đăng nhập đã hết hạn hoặc tài khoản không có quyền. Hãy đăng nhập lại.');
        } else {
          dlgError(errorMessage(err));
        }
      });
  }

  /* ---------- gan su kien ---------- */
  if (MODE === 'control') {
    document.querySelectorAll('.sc').forEach(function (b) { b.addEventListener('click', function () { setScene(b.dataset.scene); }); });
    $('go').addEventListener('click', startSpin);
    $('bRetry').addEventListener('click', startSpin);
    document.querySelectorAll('.sw').forEach(function (s) {
      s.addEventListener('click', function () {
        if (savingOpt) return;
        var before = { live: S.opt.live, ticker: S.opt.ticker, transparent: S.opt.transparent };
        S.opt[s.dataset.opt] = !S.opt[s.dataset.opt];
        publish({ type: 'opt' });
        applyAll(null);
        savingOpt = true;
        send('/display', 'PUT', { showLiveBadge: S.opt.live, showAntiScamTicker: S.opt.ticker, transparentBackground: S.opt.transparent })
          .then(function () { savingOpt = false; }, function (err) {
            // Khong luu duoc thi tra cong tac ve nhu cu de man hinh khop voi CSDL
            savingOpt = false;
            S.opt = before;
            publish({ type: 'opt' });
            applyAll(null);
            setMsg(err instanceof ApiError && (err.status === 401 || err.status === 403)
              ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'
              : 'Chưa lưu được tùy chọn hiển thị' + (err && err.message ? ': ' + err.message : '') + '.', { login: err && (err.status === 401 || err.status === 403) });
          });
      });
    });
    $('why').addEventListener('change', syncWhy);
    $('dlgF').addEventListener('submit', function (e) {
      var sub = e.submitter;
      if (!sub || sub.value !== 'ok') return;   // "Giu ket qua": de hop tu dong
      e.preventDefault();
      confirmCancel();
    });
    $('bOpen').addEventListener('click', function () {
      window.open(STAGE_URL, 'antc-quay-so-stage', 'popup=yes,width=1280,height=720');
    });
    $('bPrint').addEventListener('click', printMinutes);
    $('minScore').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v) || v < 0 || spinning || pending || (D && D.winners.length > 0)) { this.value = D ? D.minScore : ''; return; }
      S.minScore = v;
      publish({ type: 'refresh' });
      setMsg('');
      reload();
    });
    $('msgLogin').href = '/quay-so/dang-nhap?returnUrl=' + encodeURIComponent(location.pathname);
    setInterval(function () {
      var ok = Date.now() - pingSeen < 4000;
      $('conn').classList.toggle('ok', ok);
      $('connT').textContent = ok ? 'Màn hình trình chiếu đã kết nối' : 'Chưa mở màn hình trình chiếu';
    }, 1000);
  } else {
    setInterval(function () {
      try { localStorage.setItem(PING, String(Date.now())); } catch (e) { /* bo qua */ }
      if (bc) try { bc.postMessage({ ping: 1 }); } catch (e) { /* bo qua */ }
    }, 1500);
  }

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('input,select,textarea,dialog')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Space' || e.key === ' ') {
      if (t && t.closest && t.closest('button,a') && MODE === 'control') return;
      e.preventDefault();
      if (MODE === 'control') startSpin();
      else publish({ type: 'cmd-spin' });   // man trinh chieu khong tu goi spin, chi nho bang dieu khien
    } else if (e.key === '1') { setScene('idle'); }
    else if (e.key === '2') { setScene('draw'); }
    else if (e.key === '3') { setScene('summary'); }
    else if (e.key === 'ArrowRight') { stepPrize(1); }
    else if (e.key === 'ArrowLeft') { stepPrize(-1); }
    else if ((e.key === 'f' || e.key === 'F') && MODE === 'stage') {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      } catch (x) { /* bo qua */ }
    } else if (e.key === '?' && MODE === 'stage') {
      stages[0].keys.classList.toggle('on');
    }
  });

  /* ---------- khoi dong ---------- */
  document.body.classList.toggle('transparent', !!S.opt.transparent);
  stages.forEach(function (st) { st.render(); });
  fetchDetail().then(function (d) {
    applyDetail(d);
    if (MODE === 'control') {
      $('go').disabled = true;
    }
    stages.forEach(function (st) { st.render(); st.settle(S.scene === 'draw' ? lastWin() : null); });
    renderCtl();
    persist();
  }, function (err) {
    if (MODE === 'stage') { showStageStatus(err); return; }
    $('goSub').textContent = 'Không nạp được dữ liệu';
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      setMsg('Phiên đăng nhập đã hết hạn hoặc tài khoản không có quyền quay số. Hãy đăng nhập lại.', { login: true });
    } else {
      setMsg('Không nạp được dữ liệu cuộc thi' + (err && err.message ? ': ' + err.message : '') + '. Hãy tải lại trang.');
    }
  });
})();
