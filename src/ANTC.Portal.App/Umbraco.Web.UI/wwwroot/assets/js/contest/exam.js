// Dieu phoi man hinh cuoc thi (FE-26): Dang ky, Danh sach chuyen de (#ngan-hang), Gioi thieu chuyen de (#chuyen-de-N), cot ben.
// Man cau hoi (#chuyen-de-N/cau-hoi) co dong ho doc, man Xong chuyen de (#chuyen-de-N/xong), lam lai (FE-27).
// Trang thai lay tu contest-store.js. FE-29 them nop bai va ket qua.
import { onRegistered, requestedContestId } from './register.js';
import { loadEntry } from './contest-api.js';
import {
  state, init, on, enterPractice, resetPractice, topicProgress, loadTopics, loadQuestions, answer, getAnswer,
} from './contest-store.js';
import {
  esc, eyebrowHtml, progressHtml, situationHtml, questionHtml, optionsHtml, resultBodyHtml, navButtonHtml,
  focusResult, focusQuestion,
} from '../quiz/quiz-ui.js';

const NOT_POLICE = 'Website không trực 24/7 và không tiếp nhận tố giác, tin báo về tội phạm. Khi đang xảy ra sự việc, hãy gọi ngân hàng của bạn và cơ quan Công an gần nhất.';
const ICO_OK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const ICO_LOCK = '<svg class="qrow__lock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';

const main = document.getElementById('cmain');
const regView = document.getElementById('regview');
const examView = document.getElementById('examview');
const sideCards = document.getElementById('sidecards');
const regSideHtml = sideCards.innerHTML;
const practiceLink = document.querySelector('[data-practice]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// register.js dat data-contest-status sau khi tai API-07: 'open' khi co cuoc dang dien ra de dang ky
const contestOpen = () => main.dataset.contestStatus === 'open';
// Cuoc cua man hinh: ?c=<id> neu co, khong thi luot gan nhat (init/loadEntry bo trong)
// ?c sai (requestedContestId = 0) doi thanh -1 de khong trung luot nao da luu
const urlContest = () => {
  const c = requestedContestId();
  return c === null ? undefined : c || -1;
};

// He so dong ho doc cua cuoc thi (API-02 contest.readTimerFactor): rong, sai dinh dang hoac am thi coi la 1; nhan ca "0,5" va "0.5".
// Luyen tap khong co cuoc nen luon la 1.
function parseFactor(raw) {
  const t = String(raw ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return 1;
  const f = Number(t);
  return Number.isFinite(f) && f >= 0 ? f : 1;
}
const readFactor = () => (state.practice || !state.contest ? 1 : parseFactor(state.contest.readTimerFactor));
// Cuoc thi khong nhan dap an nua: da lay duoc API-02 ma phase khac 'open' (lan luot khong co cuoc cung la closed)
const phaseClosed = () => !state.practice && !!state.entry && state.synced && (!state.contest || state.contest.phase !== 'open');
const isSubmitOnly = () => !state.practice && !!state.contest && state.contest.phase === 'submit_only';

let topics = null; // QUIZ-01
let topicsError = false;
let offline = false;
let current = null; // { view: 'register' | 'menu' | 'intro' | 'q', cd? }
let qs = null; // man cau hoi dang xem: { cd, list (QUIZ-02), i, busy, note, shown, left (ma cau -> so giay doc con lai), timer }
let routeSeq = 0; // moi lan route() tang 1; lan chay cu thoat som neu da co lan moi hon
let contestClosed = false; // da nhan CONTEST_CLOSED o API-03: thoi gui them, chi bao ly do
const qcache = new Map(); // cd -> danh sach cau hoi QUIZ-02 da tai

// ---- Tinh toan chung ----

// Che do dang dung: 'practice' | 'entry' | null (chua co gi, ve man dang ky)
function mode() {
  if (state.practice) return 'practice';
  return state.entry ? 'entry' : null;
}

function progress() {
  return topicProgress(topics || []);
}

// Lam lan luot theo thu tu cua de (QD-025): chuyen de thu n chi mo khi chuyen de n-1 da xong. Thu tu = thu tu `topics`
function isLocked(cd, prog) {
  const i = prog.findIndex((p) => p.cd === String(cd));
  return i > 0 && !prog[i - 1].done;
}

// Chuyen de ke truoc trong de (de noi ly do khoa)
function prevTopic(cd) {
  const i = (topics || []).findIndex((t) => String(t.cd) === String(cd));
  return i > 0 ? topics[i - 1] : null;
}

function totalQuestions() {
  return (topics || []).reduce((a, t) => a + t.count, 0);
}

function topicOf(cd) {
  return (topics || []).find((t) => String(t.cd) === String(cd)) || null;
}

async function ensureQuestions(cd) {
  if (qcache.has(cd)) return true;
  const r = await loadQuestions(cd);
  if (r.ok && Array.isArray(r.data) && r.data.length) {
    qcache.set(cd, r.data);
    return true;
  }
  return false;
}

// Cau chua tra loi dau tien; da lam het thi xem lai tu cau 1
function firstUnanswered(list) {
  const i = list.findIndex((q) => !getAnswer(q.code));
  return i < 0 ? 0 : i;
}

function parseHash() {
  const h = location.hash;
  if (h === '#ngan-hang') return { view: 'menu' };
  const m = /^#chuyen-de-(\d+)(\/cau-hoi|\/xong)?$/.exec(h);
  if (m) return { view: m[2] === '/cau-hoi' ? 'q' : m[2] === '/xong' ? 'done' : 'intro', cd: m[1] };
  if (h === '#dang-ky') return { view: 'register' };
  return null;
}

function go(hash) {
  if (location.hash === hash) route(true);
  else location.hash = hash; // hashchange goi route
}

// ---- HTML ----

function box(kind, html) {
  return `<div class="infobox infobox--${kind}">${html}</div>`;
}

function entryBoxHtml() {
  if (state.practice) {
    return box('soft', '<b>Đang luyện tập.</b> Bài làm chỉ lưu trên máy bạn, không tính vào cuộc thi.');
  }
  const e = state.entry;
  if (!e) return '';
  if (state.status === 'submitted') {
    return box('ok', `<b>Đã nộp bài.</b> Mã dự thi của bạn là ${esc(e.code)}.`);
  }
  if (e.mode === 'anon') {
    return box('soft', `<b>Đang thi ẩn danh.</b> Mã ẩn danh của bạn là ${esc(e.code)}. Bài làm không được xét giải.`);
  }
  const nth = e.attemptNo && e.maxAttempts ? ` Đây là lượt thứ ${esc(e.attemptNo)} trên ${esc(e.maxAttempts)}.` : '';
  return box('ok', `<b>Đã đăng ký.</b> Mã dự thi của bạn là ${esc(e.code)}.${nth}`);
}

function headHtml(eyebrow, title, sub) {
  return `${eyebrowHtml(eyebrow)}<h2 id="eh" tabindex="-1" class="contest__h2">${esc(title)}</h2>${sub ? `<p class="exam__sub">${sub}</p>` : ''}`;
}

// Cuoc thi khong nhan dap an nua (API-02 phase): bao ro truoc khi vao lam
function phaseHtml() {
  if (state.practice || !state.entry || !state.synced || state.status === 'submitted') return '';
  if (isSubmitOnly()) return box('warn', '<b>Cuộc thi đã đóng nhận đáp án.</b> Bạn không trả lời thêm được; nếu đã trả lời đủ các câu thì vẫn nộp bài được trong thời hạn nộp.');
  if (phaseClosed()) return box('warn', '<b>Cuộc thi này đã đóng.</b> Lượt thi không nhận thêm đáp án.');
  return '';
}

function menuHtml() {
  const prog = progress();
  const n = topics.length;
  const order = n > 1 ? ' <b>Làm lần lượt từng chuyên đề theo thứ tự</b>: xong chuyên đề trước thì chuyên đề sau mới mở.' : '';
  const sub = `${n} chuyên đề, tổng cộng ${totalQuestions()} câu.${order} Mỗi câu hiện phần giải thích sau khi bạn chọn.`;
  let o = `<div class="qin">${headHtml('Ngân hàng câu hỏi', 'Phần thi trắc nghiệm', sub)}`;
  if (offline) o += box('warn', '<b>Chưa kết nối được máy chủ.</b> Tiến độ có thể chưa mới nhất; các đáp án chưa gửi sẽ tự gửi lại khi có mạng.');
  o += phaseHtml();
  o += entryBoxHtml();
  o += '<ol class="toplist">';
  for (const t of topics) {
    const p = prog.find((x) => x.cd === String(t.cd));
    const lock = isLocked(String(t.cd), prog);
    const done = p.done;
    let subText = `${t.count} câu`;
    if (lock) subText += ` · mở sau khi xong Chuyên đề ${prevTopic(t.cd).cd}`;
    else if (done) subText += ' · đã làm xong';
    else if (p.answered) subText += ` · đã trả lời ${p.answered}`;
    const num = `<span class="qrow__n">${done ? ICO_OK : esc(t.cd)}</span>`;
    const txt = `<span class="qrow__body"><span class="qrow__t">${esc(t.title)}</span><span class="qrow__meta">${esc(subText)}</span></span>`;
    if (lock) {
      o += `<li><div class="qrow qrow--lock" aria-disabled="true">${num}${txt}${ICO_LOCK}</div></li>`;
    } else {
      o += `<li><a class="qrow${done ? ' qrow--done' : ''}" href="#chuyen-de-${esc(t.cd)}">${num}${txt}<span class="qrow__go" aria-hidden="true">›</span></a></li>`;
    }
  }
  o += '</ol>';
  return `${o}<p class="exam__note">${esc(NOT_POLICE)}</p></div>`;
}

// Nut chinh cua phan gioi thieu: bat dau, lam tiep tu cau k, hoac xem lai khi da xong
function startLabel(t) {
  const p = progress().find((x) => x.cd === String(t.cd));
  if (!p || !p.answered) return `Bắt đầu ${t.count} câu ›`;
  if (p.done) return `Làm lại chuyên đề ${t.cd} ›`;
  const list = qcache.get(String(t.cd));
  const k = list ? firstUnanswered(list) + 1 : p.answered + 1;
  return `Làm tiếp từ câu ${k} ›`;
}

function introHtml(t) {
  const intro = Array.isArray(t.intro) ? t.intro : (t.intro ? [t.intro] : []);
  const terms = Array.isArray(t.terms) ? t.terms : [];
  let o = `<div class="qin"><a class="qnav o qnav--s" href="#ngan-hang">‹ Danh sách chuyên đề</a>`
    + `<div class="exam__intro-head">${headHtml(`Ngân hàng câu hỏi · Chuyên đề ${t.cd}`, t.title, '')}</div>`
    + `<div class="exam__intro">${intro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
  if (terms.length) {
    o += `<details class="peek"><summary><span><b>Hiểu nhanh mấy từ</b><span class="peek__n">${terms.length} từ dùng trong chuyên đề này</span></span><span class="peek__pk" aria-hidden="true"></span></summary>`
      + `<dl>${terms.map((x) => `<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join('')}</dl></details>`;
  }
  const redo = progress().find((x) => x.cd === String(t.cd));
  const isRedo = !!(redo && redo.done);
  if (isRedo && !state.practice) {
    o += box('soft', '<b>Làm lại là xem lại để học.</b> Điểm của lượt thi chỉ tính lần trả lời đầu tiên của mỗi câu.');
  }
  o += `<div class="exam__actions"><button type="button" class="qnav f" ${isRedo ? 'data-redo' : 'data-start'}="${esc(t.cd)}">${esc(startLabel(t))}</button>`
    + `<a class="qnav o" href="#ngan-hang">Chọn chuyên đề khác</a></div></div>`;
  return o;
}

// Man Xong chuyen de (FE-27)
function doneHtml(t) {
  const cd = String(t.cd);
  const list = qcache.get(cd) || [];
  const right = list.filter((q) => {
    const a = getAnswer(q.code);
    return a && a.a === q.ans;
  }).length;
  const rest = progress().filter((p) => !p.done).length;
  const saved = state.practice ? 'Kết quả này chỉ hiện trên máy của bạn.' : 'Kết quả đã được lưu vào lượt thi của bạn.';
  let o = `<div class="qin exam__done">${headHtml(`Chuyên đề ${cd} · đã làm xong`, `Bạn trả lời đúng ${right} trên ${list.length} câu`, `${saved} Câu nào chưa đúng thì đọc lại phần giải thích là đủ.`)}`;
  const nx = topics[topics.findIndex((x) => String(x.cd) === cd) + 1];
  if (nx) o += box('ok', `<b>Chuyên đề ${esc(nx.cd)} đã mở.</b>${esc(nx.title)}.`);
  if (!state.practice && state.entry && state.entry.mode === 'anon') {
    o += box('soft', `<b>Bạn đang thi ẩn danh</b> (mã ${esc(state.entry.code)}), nên kết quả này không được xét giải.`);
  }
  const next = rest ? `Chọn chuyên đề tiếp theo, còn ${rest} ›` : `Đã làm hết ${topics.length} chuyên đề, xem lại danh sách ›`;
  o += `<div class="exam__actions"><a class="qnav f" href="#ngan-hang">${esc(next)}</a>`
    + `<button type="button" class="qnav o" data-redo="${esc(cd)}">Làm lại chuyên đề ${esc(cd)}</button></div>`
    + '<p class="exam__note">Làm hết câu hỏi không có nghĩa là an toàn. Gặp việc thật, vẫn phải chậm lại và tự kiểm tra bằng kênh do chính mình tìm ra.</p></div>';
  return o;
}

function sideHtml(view) {
  let o;
  const e = state.entry;
  if (state.practice) {
    o = `<div class="sidecard">${eyebrowHtml('Luyện tập')}<p class="sidecard__text">Bài làm chỉ lưu trên máy bạn, không tính vào cuộc thi.</p>`
      + (contestOpen() ? '<a class="qnav o qnav--s qnav--block" href="#dang-ky">Đăng ký dự thi</a>' : '') + '</div>';
  } else if (e) {
    const anon = e.mode === 'anon';
    o = `<div class="sidecard">${eyebrowHtml(anon ? 'Thí sinh ẩn danh' : 'Thí sinh')}`
      + `<p class="sidecard__label">${anon ? 'Mã ẩn danh' : 'Mã dự thi'}</p><b class="sidecard__code${anon ? ' sidecard__code--anon' : ''}">${esc(e.code)}</b>`;
    if (anon) {
      o += '<span class="sidecard__tag">Không xét giải</span>';
    } else {
      if (state.fullName) o += `<p class="sidecard__name">${esc(state.fullName)}</p>`;
      if (e.attemptNo && e.maxAttempts) o += `<p class="sidecard__meta">Lượt thứ ${esc(e.attemptNo)} / ${esc(e.maxAttempts)}</p>`;
    }
    o += '</div>';
  } else {
    o = regSideHtml;
  }
  if (topics) {
    const prog = progress();
    const done = prog.filter((p) => p.done).length;
    o += `<div class="sidecard">${eyebrowHtml('Tiến độ')}<p class="sidecard__text sidecard__text--tight">Đã xong ${done} / ${topics.length} chuyên đề</p>`
      + progressHtml(done, topics.length, 'Số chuyên đề đã xong')
      + '<ol class="sidelist">'
      + topics.map((t) => {
        const p = prog.find((x) => x.cd === String(t.cd));
        const lock = isLocked(String(t.cd), prog);
        const on = (view === 'intro' || view === 'q' || view === 'done') && current && current.cd === String(t.cd);
        return `<li${on ? ' class="is-on" aria-current="step"' : lock ? ' class="is-lock"' : ''}><span class="sidelist__n${p.done ? ' is-done' : ''}">${p.done ? '✓' : esc(t.cd)}</span>`
          + `<span class="sidelist__t">${esc(t.title)}</span>${lock ? '<span class="sr-only">(chưa mở)</span>' : ''}</li>`;
      }).join('')
      + '</ol></div>';
  }
  return o;
}

// ---- Man cau hoi (FE-27a) ----

const ERR_TEXT = {
  CONTEST_CLOSED: 'Cuộc thi đã đóng nên đáp án này không được ghi nhận.',
  ALREADY_SUBMITTED: 'Bài đã được nộp nên không trả lời thêm được.',
  UNKNOWN_QUESTION: 'Câu hỏi này không còn trong ngân hàng nên chưa ghi nhận được. Bạn có thể sang câu khác.',
  INVALID_OPTION: 'Câu hỏi này không còn trong ngân hàng nên chưa ghi nhận được. Bạn có thể sang câu khác.',
};
const ERR_DEFAULT = 'Chưa lưu được đáp án. Hãy chọn lại.';
const PENDING_TEXT = 'Chưa lưu được, sẽ tự gửi lại.';

// So giay phai doc phan giai thich sau khi chon (sec x he so, lam tron len). Thieu sec hoac 0, he so 0 thi khong cho
function readSeconds(q) {
  const sec = Number(q.sec);
  if (!(sec > 0)) return 0;
  return Math.ceil(sec * readFactor());
}

function fmtSec(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m} phút ${r < 10 ? '0' : ''}${r} giây` : `${r} giây`;
}

function clearTimer() {
  if (qs && qs.timer) {
    clearInterval(qs.timer.id);
    qs.timer = null;
  }
}

// Roi man cau hoi (doi cau, ve danh sach...): dung dong ho, giu so giay con lai de vao lai cau do thi doc tiep
function leaveQuestion() {
  if (!qs || !qs.timer) return;
  const { code, end } = qs.timer;
  qs.left.set(code, Math.max(0, Math.ceil((end - Date.now()) / 1000)));
  clearTimer();
}

function paintWait(left) {
  const w = document.getElementById('qwait');
  const nb = document.getElementById('qnext');
  if (!w || !nb) return;
  if (left > 0) {
    w.textContent = `Còn ${fmtSec(left)} đọc phần giải thích. Nút mở khi hết thời gian.`;
    nb.disabled = true;
  } else {
    w.textContent = 'Đã đủ thời gian đọc. Bạn có thể đi tiếp.';
    nb.disabled = false;
  }
}

// Chay dong ho doc cho cau hien tai (chi cau vua tra loi trong phien nay hoac con so giay doc dang do)
function startTimer(code, seconds) {
  clearTimer();
  if (!(seconds > 0)) {
    qs.left.delete(code);
    paintWait(0);
    const w = document.getElementById('qwait');
    if (w) w.textContent = '';
    return;
  }
  const end = Date.now() + seconds * 1000;
  const tick = () => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    paintWait(left);
    if (left <= 0) {
      clearTimer();
      qs.left.delete(code);
    }
  };
  qs.timer = { code, end, id: setInterval(tick, 1000) };
  tick();
}

// Het cau cuoi: chuyen de xong (da tra loi du) thi sang man Xong chuyen de, chua thi ve danh sach
function onTopicEnd(cd) {
  const p = progress().find((x) => x.cd === String(cd));
  go(p && p.done ? `#chuyen-de-${cd}/xong` : '#ngan-hang');
}

function curQuestion() {
  return qs.list[qs.i];
}

function nextLabel() {
  return qs.i >= qs.list.length - 1 ? 'Đã hiểu, xem kết quả ›' : 'Đã hiểu, sang câu tiếp theo ›';
}

function noteText() {
  const a = qs && getAnswer(curQuestion().code);
  if (a && a.pending) return PENDING_TEXT;
  return qs ? qs.note : '';
}

function questionScreenHtml() {
  const { cd, list, i } = qs;
  const q = list[i];
  const a = getAnswer(q.code);
  const chosen = a ? a.a : null;
  const nextAttrs = { id: 'qnext', 'data-next': '' };
  if (chosen == null || (qs.left.get(q.code) || 0) > 0) nextAttrs.disabled = '';
  const prev = i > 0 ? navButtonHtml('‹ Câu trước', 'o', { 'data-prev': '' }) : '';
  return `<div class="qin"><div class="qtop"><a class="qnav o" href="#chuyen-de-${esc(cd)}">‹ Chuyên đề ${esc(cd)}</a>`
    + `<span class="qcount">Câu ${i + 1} / ${list.length}</span></div>`
    + `<div id="qprog">${progressHtml(i + (chosen != null ? 1 : 0), list.length, 'Tiến độ trong chuyên đề')}</div>`
    + `<div class="qstem">${eyebrowHtml(`Mã ${q.code} · ${q.kind || 'Chọn đáp án phù hợp nhất'}`)}${situationHtml(q.sit)}${questionHtml(q.q)}</div>`
    + `<div id="qoptsbox">${optionsHtml(q, chosen)}</div>`
    + `<p id="qnote" class="qnote" role="status"${noteText() ? '' : ' hidden'}>${esc(noteText())}</p>`
    + `<div id="qlive" class="qlive" aria-live="polite">${resultBodyHtml(q, chosen)}</div>`
    + `<div class="qactions">${prev}${navButtonHtml(nextLabel(), 'f', nextAttrs)}<p id="qwait" class="qwait"></p></div></div>`;
}

function paintNote() {
  const el = document.getElementById('qnote');
  if (!el || !qs) return;
  const t = noteText();
  el.textContent = t;
  el.hidden = !t;
}

// Ve lai phan dap an + ket qua cua cau hien tai theo chosen (khong dung lai ca man de khong mat focus)
function paintAnswer(q, chosen, focus) {
  const { i, list } = qs;
  qs.shown = chosen;
  if (chosen == null) {
    clearTimer();
    qs.left.delete(q.code);
  }
  document.getElementById('qoptsbox').innerHTML = optionsHtml(q, chosen);
  document.getElementById('qlive').innerHTML = resultBodyHtml(q, chosen);
  document.getElementById('qprog').innerHTML = progressHtml(i + (chosen != null ? 1 : 0), list.length, 'Tiến độ trong chuyên đề');
  document.getElementById('qnext').disabled = chosen == null || (qs.left.get(q.code) || 0) > 0;
  paintNote();
  if (focus && chosen != null) focusResult(examView);
}

// Luu loi: ve lai cau chua tra loi, bao ly do va tra focus ve dap an dau (khoi roi ve body khi dong tieu de ket qua bi xoa)
function paintFailed(q) {
  const act = document.activeElement;
  const lost = !examView.contains(act) || document.getElementById('qoptsbox').contains(act) || document.getElementById('qlive').contains(act);
  paintAnswer(q, null, false);
  if (lost) {
    const first = examView.querySelector('.qopt');
    if (first) first.focus({ preventScroll: true });
  }
}

async function pick(k) {
  const s = qs;
  const q = curQuestion();
  if (s.busy || getAnswer(q.code)) return;
  if (contestClosed || phaseClosed()) {
    // Da biet cuoc thi khong nhan dap an (phase cua API-02 hoac 403 truoc do): khong gui them yeu cau
    s.note = ERR_TEXT.CONTEST_CLOSED;
    paintNote();
    return;
  }
  s.busy = true;
  s.note = '';
  s.left.set(q.code, readSeconds(q));
  paintAnswer(q, k, true); // hien ngay, doi chieu voi may chu sau
  startTimer(q.code, s.left.get(q.code));
  const r = await answer(q.code, k, s.cd, k === q.ans);
  s.busy = false;
  if (qs !== s || curQuestion() !== q) return;
  if (!r.ok) {
    if (r.code === 'CONTEST_CLOSED') contestClosed = true;
    s.note = ERR_TEXT[r.code] || ERR_DEFAULT;
    paintFailed(q);
    return;
  }
  // may chu dang giu dap an khac: hien dap an cua may chu, khong bat doc lai
  if (r.a !== k) {
    clearTimer();
    s.left.delete(q.code);
    paintAnswer(q, r.a, true);
  }
  paintNote();
}

function renderQuestion(focus) {
  leaveQuestion();
  const q = curQuestion();
  const a = getAnswer(q.code);
  qs.shown = a ? a.a : null;
  examView.innerHTML = questionScreenHtml();
  renderSide('q');
  // Vao lai cau con dang doc do: doc tiep so giay con lai
  const left = qs.left.get(q.code) || 0;
  if (left > 0) startTimer(q.code, left);
  if (focus) {
    if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    focusQuestion(examView);
  }
}

function stepQuestion(d) {
  const n = qs.i + d;
  if (n < 0) return;
  if (n >= qs.list.length) {
    onTopicEnd(qs.cd);
    return;
  }
  qs.i = n;
  qs.note = '';
  renderQuestion(true);
}

// ---- Dieu huong ----

function renderSide(view) {
  sideCards.innerHTML = sideHtml(view);
}

function showRegister(focus) {
  current = { view: 'register' };
  examView.hidden = true;
  regView.hidden = false;
  renderSide('register');
  if (focus) focusHeading(document.getElementById('vh'));
}

function focusHeading(el) {
  if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  if (el) el.focus({ preventScroll: true });
}

// Thu tu va so cau theo `topics` cua API-02 (de cua cuoc) khi da co; QUIZ-01 cho tieu de, gioi thieu, thuat ngu.
// Chuyen de API-02 co ma QUIZ-01 khong co thi bo qua. Chua co API-02 (mat mang) hoac luyen tap: giu nguyen QUIZ-01.
function byContest(list) {
  if (state.practice || !state.topics.length) return list;
  const out = [];
  for (const x of state.topics) {
    const t = list.find((y) => String(y.cd) === String(x.cd));
    if (t) out.push({ ...t, count: x.count });
  }
  return out.length ? out : list;
}

// Bo du lieu da tai khi doi luot/cuoc (tab khac, dang ky xong)
function resetLoaded() {
  clearTimer();
  topics = null;
  qs = null;
  contestClosed = false;
  qcache.clear();
}

async function ensureTopics() {
  if (topics) return true;
  const r = await loadTopics();
  if (r.ok && Array.isArray(r.data)) {
    topics = byContest(r.data);
    topicsError = false;
    return true;
  }
  topicsError = true;
  return false;
}

function showQuestionsError(cd) {
  examView.innerHTML = `<div class="qin">${headHtml('Ngân hàng câu hỏi', `Chuyên đề ${cd}`, '')}`
    + box('warn', '<b>Chưa tải được câu hỏi của chuyên đề này.</b> Kiểm tra mạng rồi bấm thử lại.')
    + `<div class="exam__actions"><button type="button" class="qnav f" data-retry>Thử lại</button><a class="qnav o" href="#ngan-hang">Về danh sách chuyên đề</a></div></div>`;
  renderSide('menu');
}

function showTopicsError() {
  examView.innerHTML = '<div class="qin">' + headHtml('Ngân hàng câu hỏi', 'Phần thi trắc nghiệm', '')
    + box('warn', '<b>Chưa tải được ngân hàng câu hỏi.</b> Kiểm tra mạng rồi bấm thử lại.')
    + '<div class="exam__actions"><button type="button" class="qnav f" data-retry>Thử lại</button></div></div>';
  renderSide('menu');
}

// Ve man hinh theo hash. focus=true khi nguoi dung chu dong chuyen man
async function route(focus) {
  const seq = ++routeSeq;
  const stale = () => seq !== routeSeq; // da co lan route moi hon: bo lan nay, khong ve de len man moi
  leaveQuestion();
  const want = parseHash();
  const m = mode();
  if (!m || (want && want.view === 'register')) {
    showRegister(focus);
    return;
  }
  regView.hidden = true;
  examView.hidden = false;
  const okTopics = await ensureTopics();
  if (stale()) return;
  if (!okTopics) {
    qs = null;
    current = { view: 'menu' };
    showTopicsError();
    return;
  }
  let view = want || { view: 'menu' };
  if (view.view === 'intro' || view.view === 'q' || view.view === 'done') {
    const t = topicOf(view.cd);
    // Chuyen de khong ton tai hoac con khoa: ve danh sach (khong vao duoc bang URL)
    if (!t || isLocked(String(t.cd), progress())) view = { view: 'menu' };
  }
  if (view.view === 'intro' || view.view === 'q' || view.view === 'done') {
    // Cau hoi cua chuyen de: can cho man cau hoi, man xong (cham diem) va de nut gioi thieu ghi dung "Lam tiep tu cau k"
    const cd = String(view.cd);
    if (!qcache.has(cd)) examView.innerHTML = '<p class="exam__loading" role="status">Đang tải câu hỏi…</p>';
    const ok = await ensureQuestions(cd);
    if (stale()) return;
    if (!ok && view.view !== 'intro') {
      qs = null;
      current = { view: 'menu' };
      showQuestionsError(view.cd);
      return;
    }
    // Chua xong chuyen de thi khong co man Xong: ve phan gioi thieu
    if (view.view === 'done' && !progress().find((x) => x.cd === cd).done) view = { view: 'intro', cd };
  }
  if (view.view !== 'q') qs = null;
  const wantHash = view.view === 'q' ? `#chuyen-de-${view.cd}/cau-hoi` : view.view === 'done' ? `#chuyen-de-${view.cd}/xong`
    : view.view === 'intro' ? `#chuyen-de-${view.cd}` : '#ngan-hang';
  if (location.hash !== wantHash) history.replaceState(null, '', wantHash);
  current = view;
  if (view.view === 'q') {
    // Vao (hoac tai lai) chuyen de: tiep tu cau chua tra loi dau tien
    const list = qcache.get(String(view.cd));
    qs = { cd: String(view.cd), list, i: firstUnanswered(list), busy: false, note: '', shown: null, left: new Map(), timer: null };
    renderQuestion(focus);
    return;
  }
  examView.innerHTML = view.view === 'done' ? doneHtml(topicOf(view.cd)) : view.view === 'intro' ? introHtml(topicOf(view.cd)) : menuHtml();
  renderSide(view.view);
  if (focus) focusHeading(document.getElementById('eh'));
}

// Selector tim lai phan tu dang giu focus sau khi dung lai HTML (lien ket, nut bat dau, nut thu lai)
function focusSelector(el) {
  const href = el.getAttribute('href');
  if (href) return `[href="${href}"]`;
  // Nut chinh cua phan gioi thieu doi giua bat dau/lam tiep/lam lai khi tien do doi: coi la cung mot nut
  const cd = el.dataset.start ?? el.dataset.redo;
  if (cd !== undefined) return `[data-start="${cd}"],[data-redo="${cd}"]`;
  if (el.dataset.retry !== undefined) return '[data-retry]';
  return null;
}

// Tien do doi (tra loi, gui lai xong): ve lai ma khong cuop focus
function refresh() {
  // Da lay lai duoc tien do tu may chu thi hop "Chua ket noi duoc may chu" khong con dung
  if (state.synced) offline = false;
  if (topics) topics = byContest(topics); // API-02 den sau QUIZ-01 (mat mang luc dau): ap thu tu va so cau cua de
  if (!current || current.view === 'register' || !topics) return;
  // Man cau hoi khong ve lai ca man (se mat focus, ngat vung aria-live): chi cap nhat cot ben, ghi chu,
  // va dap an neu may chu dang giu dap an khac voi cai dang ve
  if (current.view === 'q' && qs) {
    renderSide('q');
    paintNote();
    const code = curQuestion().code;
    const a = getAnswer(code);
    if (!qs.busy && (a ? a.a : null) !== qs.shown) {
      qs.left.delete(code);
      clearTimer();
      paintAnswer(curQuestion(), a ? a.a : null, false);
    }
    return;
  }
  if (current.view === 'done') {
    renderSide('done');
    return;
  }
  const active = document.activeElement;
  const keep = active && examView.contains(active) ? focusSelector(active) : null;
  const want = current;
  if (want.view === 'intro' && isLocked(want.cd, progress())) { route(false); return; }
  examView.innerHTML = want.view === 'intro' ? introHtml(topicOf(want.cd)) : menuHtml();
  renderSide(want.view);
  if (keep) {
    const again = examView.querySelector(keep);
    if (again) again.focus({ preventScroll: true });
  }
}

// ---- Su kien ----

examView.addEventListener('click', (e) => {
  const retry = e.target.closest('[data-retry]');
  if (retry) {
    route(true);
    return;
  }
  const start = e.target.closest('[data-start]');
  if (start) {
    go(`#chuyen-de-${start.dataset.start}/cau-hoi`);
    return;
  }
  const redo = e.target.closest('[data-redo]');
  if (redo) {
    // Luot thi: xem lai cac cau da luu, khong gui API-03. Luyen tap: xoa bai lam cua chuyen de roi lam lai tu dau
    if (state.practice) resetPractice(redo.dataset.redo);
    go(`#chuyen-de-${redo.dataset.redo}/cau-hoi`);
    return;
  }
  if (!qs) return;
  const opt = e.target.closest('.qopt[data-k]');
  if (opt) {
    pick(opt.dataset.k);
    return;
  }
  if (e.target.closest('[data-prev]')) stepQuestion(-1);
  else if (e.target.closest('[data-next]')) stepQuestion(1);
});

if (practiceLink) {
  practiceLink.addEventListener('click', (e) => {
    e.preventDefault();
    enterPractice();
    go('#ngan-hang');
  });
}

window.addEventListener('hashchange', () => route(true));
on('change', refresh);
on('submitted', () => {
  // Luot da nop o noi khac: het tra loi duoc, ve danh sach (man ket qua la viec FE-29)
  if (current && current.view === 'q') go('#ngan-hang');
  else refresh();
});
on('dropped', ({ q, code }) => {
  // Dap an dang cho bi may chu tu choi (vd cuoc thi da dong): cau tro lai chua tra loi, bao ly do
  if (!qs || current.view !== 'q' || curQuestion().code !== q) return;
  if (code === 'CONTEST_CLOSED') contestClosed = true;
  qs.note = ERR_TEXT[code] || ERR_DEFAULT;
  paintFailed(curQuestion());
});
// Tab khac doi luot thi: dung lai tien do tu may chu roi ve man hinh theo luot moi
on('entry-changed', async () => {
  resetLoaded();
  const r = await init(urlContest());
  offline = !!r.offline;
  await route(false);
});
on('token', () => {
  // Token bi tu choi, luot da bi xoa: ve man dang ky
  offline = false;
  if (state.practice) refresh();
  else go('#dang-ky');
});

// Dang ky xong: dung lai tien do tu may chu roi vao danh sach chuyen de
export async function enterExam() {
  regView.hidden = true;
  examView.hidden = false;
  examView.innerHTML = '<p class="exam__loading" role="status">Đang tải tiến độ…</p>';
  resetLoaded();
  const r = await init(urlContest());
  offline = !!r.offline;
  go('#ngan-hang');
}
onRegistered(enterExam);

// ---- Khoi dong ----

async function boot() {
  if (loadEntry(urlContest())) {
    // Co luot da luu: khong cho nhay man dang ky roi moi chuyen
    regView.hidden = true;
    examView.hidden = false;
    examView.innerHTML = '<p class="exam__loading" role="status">Đang tải tiến độ…</p>';
  }
  const r = await init(urlContest());
  offline = !!r.offline;
  const want = parseHash();
  // Tai lai giua chuyen de (dang lam cau hoi hoac o man Xong) thi ve danh sach chuyen de; vao lai se tiep tu cau chua lam
  const reopen = () => {
    if (want && (want.view === 'q' || want.view === 'done')) history.replaceState(null, '', '#ngan-hang');
    return route(false);
  };
  if (r.view === 'exam') {
    await reopen();
    return;
  }
  if (r.practice && want && want.view !== 'register') {
    await reopen();
    return;
  }
  showRegister(false);
}

boot();
