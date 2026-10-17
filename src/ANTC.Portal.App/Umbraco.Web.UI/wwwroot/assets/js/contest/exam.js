// Dieu phoi man hinh cuoc thi (FE-26): Dang ky, Danh sach chuyen de (#ngan-hang), Gioi thieu chuyen de (#chuyen-de-N), cot ben.
// Trang thai lay tu contest-store.js. FE-27 se them man cau hoi, FE-29 them nop bai va ket qua.
import { onRegistered } from './register.js';
import { loadEntry } from './contest-api.js';
import {
  state, init, on, enterPractice, topicProgress, loadTopics,
} from './contest-store.js';
import { esc, eyebrowHtml, progressHtml } from '../quiz/quiz-ui.js';

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

const contestOpen = main.dataset.contestStatus === 'open';
const maxAttemptsDefault = Number(main.dataset.maxAttempts) > 0 ? Number(main.dataset.maxAttempts) : 2;

let topics = null; // QUIZ-01
let topicsError = false;
let offline = false;
let current = null; // { view: 'register' | 'menu' | 'intro', cd? }

// ---- Tinh toan chung ----

// Che do dang dung: 'practice' | 'entry' | null (chua co gi, ve man dang ky)
function mode() {
  if (state.practice) return 'practice';
  return state.entry ? 'entry' : null;
}

function progress() {
  return topicProgress(topics || []);
}

// Chuyen de 1 phai xong thi 7 chuyen de con lai moi mo (cd la chuoi nhu QUIZ-01)
function firstDone(prog) {
  const first = prog.find((p) => p.cd === '1');
  return first ? first.done : false;
}

function isLocked(cd, prog) {
  return cd !== '1' && !firstDone(prog);
}

function totalQuestions() {
  return (topics || []).reduce((a, t) => a + t.count, 0);
}

function topicOf(cd) {
  return (topics || []).find((t) => String(t.cd) === String(cd)) || null;
}

function parseHash() {
  const h = location.hash;
  if (h === '#ngan-hang') return { view: 'menu' };
  const m = /^#chuyen-de-(\d+)$/.exec(h);
  if (m) return { view: 'intro', cd: m[1] };
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
  const max = e.maxAttempts || maxAttemptsDefault;
  return box('ok', `<b>Đã đăng ký.</b> Mã dự thi của bạn là ${esc(e.code)}.${e.attemptNo ? ` Đây là lượt thứ ${esc(e.attemptNo)} trên ${esc(max)}.` : ''}`);
}

function headHtml(eyebrow, title, sub) {
  return `${eyebrowHtml(eyebrow)}<h2 id="eh" tabindex="-1" class="contest__h2">${esc(title)}</h2>${sub ? `<p class="exam__sub">${sub}</p>` : ''}`;
}

function menuHtml() {
  const prog = progress();
  const gate = !firstDone(prog);
  const n = topics.length;
  const sub = `${n === 8 ? 'Tám' : n} chuyên đề, tổng cộng ${totalQuestions()} câu. <b>Làm Chuyên đề 1 trước</b>, vì cách quyết định học ở đó được dùng lại ở cả bảy chuyên đề sau. Mỗi câu hiện phần giải thích sau khi bạn chọn.`;
  let o = `<div class="qin">${headHtml('Ngân hàng câu hỏi', 'Phần thi trắc nghiệm', sub)}`;
  if (offline) o += box('warn', '<b>Chưa kết nối được máy chủ.</b> Tiến độ có thể chưa mới nhất; các đáp án chưa gửi sẽ tự gửi lại khi có mạng.');
  o += entryBoxHtml();
  o += '<ol class="toplist">';
  for (const t of topics) {
    const p = prog.find((x) => x.cd === String(t.cd));
    const lock = isLocked(String(t.cd), prog);
    const done = p.done;
    let subText = `${t.count} câu`;
    if (lock) subText += ' · mở sau khi xong Chuyên đề 1';
    else if (done) subText += ' · đã làm xong';
    else if (p.answered) subText += ` · đã trả lời ${p.answered}`;
    else if (String(t.cd) === '1' && gate) subText += ' · làm chuyên đề này trước';
    const num = `<span class="qrow__n">${done ? ICO_OK : esc(t.cd)}</span>`;
    const txt = `<span class="qrow__body"><span class="qrow__t">${esc(t.title)}</span><span class="qrow__meta">${esc(subText)}</span></span>`;
    if (lock) {
      o += `<li><div class="qrow qrow--lock" aria-disabled="true">${num}${txt}${ICO_LOCK}</div></li>`;
    } else {
      o += `<li><a class="qrow${done ? ' qrow--done' : ''}" href="#chuyen-de-${esc(t.cd)}">${num}${txt}<span class="qrow__go" aria-hidden="true">›</span></a></li>`;
    }
  }
  o += '</ol>';
  if (gate) {
    const first = topicOf('1');
    o += box('warn', `<b>Bảy chuyên đề còn lại mở ngay khi bạn làm xong Chuyên đề 1.</b>${first ? `Chuyên đề 1 có ${first.count} câu. ` : ''}Sau đó thứ tự do bạn chọn.`);
  }
  return `${o}<p class="exam__note">${esc(NOT_POLICE)}</p></div>`;
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
  o += `<div class="exam__actions"><button type="button" class="qnav f" data-start="${esc(t.cd)}">Bắt đầu ${t.count} câu ›</button>`
    + `<a class="qnav o" href="#ngan-hang">Chọn chuyên đề khác</a></div>`
    + `<p id="startnote" class="exam__note" role="status" hidden></p></div>`;
  return o;
}

function sideHtml(view) {
  let o;
  const e = state.entry;
  if (state.practice) {
    o = `<div class="sidecard">${eyebrowHtml('Luyện tập')}<p class="sidecard__text">Bài làm chỉ lưu trên máy bạn, không tính vào cuộc thi.</p>`
      + (contestOpen ? '<a class="qnav o qnav--s qnav--block" href="#dang-ky">Đăng ký dự thi</a>' : '') + '</div>';
  } else if (e) {
    const anon = e.mode === 'anon';
    o = `<div class="sidecard">${eyebrowHtml(anon ? 'Thí sinh ẩn danh' : 'Thí sinh')}`
      + `<p class="sidecard__label">${anon ? 'Mã ẩn danh' : 'Mã dự thi'}</p><b class="sidecard__code${anon ? ' sidecard__code--anon' : ''}">${esc(e.code)}</b>`;
    if (anon) {
      o += '<span class="sidecard__tag">Không xét giải</span>';
    } else {
      if (state.fullName) o += `<p class="sidecard__name">${esc(state.fullName)}</p>`;
      if (e.attemptNo) o += `<p class="sidecard__meta">Lượt thứ ${esc(e.attemptNo)} / ${esc(e.maxAttempts || maxAttemptsDefault)}</p>`;
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
        const on = (view === 'intro') && current && current.cd === String(t.cd);
        return `<li${on ? ' class="is-on" aria-current="step"' : lock ? ' class="is-lock"' : ''}><span class="sidelist__n${p.done ? ' is-done' : ''}">${p.done ? '✓' : esc(t.cd)}</span>`
          + `<span class="sidelist__t">${esc(t.title)}</span>${lock ? '<span class="sr-only">(chưa mở)</span>' : ''}</li>`;
      }).join('')
      + '</ol></div>';
  }
  return o;
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

async function ensureTopics() {
  if (topics) return true;
  const r = await loadTopics();
  if (r.ok && Array.isArray(r.data)) {
    topics = r.data;
    topicsError = false;
    return true;
  }
  topicsError = true;
  return false;
}

function showTopicsError() {
  examView.innerHTML = '<div class="qin">' + headHtml('Ngân hàng câu hỏi', 'Phần thi trắc nghiệm', '')
    + box('warn', '<b>Chưa tải được ngân hàng câu hỏi.</b> Kiểm tra mạng rồi bấm thử lại.')
    + '<div class="exam__actions"><button type="button" class="qnav f" data-retry>Thử lại</button></div></div>';
  renderSide('menu');
}

// Ve man hinh theo hash. focus=true khi nguoi dung chu dong chuyen man
async function route(focus) {
  const want = parseHash();
  const m = mode();
  if (!m || (want && want.view === 'register')) {
    showRegister(focus);
    return;
  }
  regView.hidden = true;
  examView.hidden = false;
  if (!(await ensureTopics())) {
    current = { view: 'menu' };
    showTopicsError();
    return;
  }
  let view = want || { view: 'menu' };
  if (view.view === 'intro') {
    const t = topicOf(view.cd);
    // Chuyen de khong ton tai hoac con khoa: ve danh sach (khong vao duoc bang URL)
    if (!t || isLocked(String(t.cd), progress())) view = { view: 'menu' };
  }
  const wantHash = view.view === 'intro' ? `#chuyen-de-${view.cd}` : '#ngan-hang';
  if (location.hash !== wantHash) history.replaceState(null, '', wantHash);
  current = view;
  examView.innerHTML = view.view === 'intro' ? introHtml(topicOf(view.cd)) : menuHtml();
  renderSide(view.view);
  if (focus) focusHeading(document.getElementById('eh'));
}

// Selector tim lai phan tu dang giu focus sau khi dung lai HTML (lien ket, nut bat dau, nut thu lai)
function focusSelector(el) {
  const href = el.getAttribute('href');
  if (href) return `[href="${href}"]`;
  if (el.dataset.start !== undefined) return `[data-start="${el.dataset.start}"]`;
  if (el.dataset.retry !== undefined) return '[data-retry]';
  return null;
}

// Tien do doi (tra loi, gui lai xong): ve lai ma khong cuop focus
function refresh() {
  if (!current || current.view === 'register' || !topics) return;
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
    // Man cau hoi la viec FE-27
    const note = document.getElementById('startnote');
    note.textContent = 'Màn làm bài sẽ mở ở bước tiếp theo (FE-27).';
    note.hidden = false;
  }
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
on('submitted', refresh);
// Tab khac doi luot thi: dung lai tien do tu may chu roi ve man hinh theo luot moi
on('entry-changed', async () => {
  const r = await init();
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
  const r = await init();
  offline = !!r.offline;
  go('#ngan-hang');
}
onRegistered(enterExam);

// ---- Khoi dong ----

async function boot() {
  if (loadEntry()) {
    // Co luot da luu: khong cho nhay man dang ky roi moi chuyen
    regView.hidden = true;
    examView.hidden = false;
    examView.innerHTML = '<p class="exam__loading" role="status">Đang tải tiến độ…</p>';
  }
  const r = await init();
  offline = !!r.offline;
  const want = parseHash();
  if (r.view === 'exam') {
    // Tai lai trang: ve danh sach chuyen de (hoac chuyen de dang xem neu hash hop le)
    await route(false);
    return;
  }
  if (r.practice && want && want.view !== 'register') {
    await route(false);
    return;
  }
  showRegister(false);
}

boot();
