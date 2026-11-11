import { blockCopy } from './block-copy.js';
// Dieu phoi man hinh cuoc thi (FE-26): Dang ky, Danh sach chuyen de (#chuyen-de), Gioi thieu chuyen de (#chuyen-de-N), cot ben.
// Man cau hoi (#chuyen-de-N/cau-hoi) co dong ho doc, man Xong chuyen de (#chuyen-de-N/xong), lam lai (FE-27).
// Tu luyen o dia chi rieng /ngan-hang/ (QD-058), cung cac hash do, nen tai lai trang khong lan sang luot thi.
// Trang thai lay tu contest-store.js. Nop bai, hop thoai va man ket qua (#ket-qua) o submit.js (FE-29).
import { onRegistered, requestedContestId } from './register.js';
import { getSchedule, loadEntry } from './contest-api.js';
import {
  state, answeringLocally, hasLateAnswers, init, on, enterPractice, resetPractice, topicProgress, loadTopics, loadQuestions, answer, getAnswer, submit as submitEntry,
} from './contest-store.js';
import {
  setup as setupSubmit, resetSubmit, setNotice, panelHtml, attachButtonHtml, resultHtml, wire as wireSubmit,
} from './submit.js';
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
const readingUrls = JSON.parse(document.querySelector('[data-reading-urls]')?.dataset.readingUrls || '{}');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// register.js dat data-contest-status sau khi tai API-07: 'open' khi co cuoc dang dien ra de dang ky
const contestOpen = () => main.dataset.contestStatus === 'open';
// Cuoc dang dien ra (API-07). Moi luc chi co mot cuoc nen dia chi khong can ?c (QD-057)
let currentContest;
// Cuoc cua man hinh: ?c=<id> neu co, roi toi cuoc dang dien ra, khong thi luot gan nhat (init/loadEntry bo trong).
// Phai uu tien cuoc dang dien ra: neu dung luot gan nhat, nguoi da thi cuoc cu se bi dua ve ket qua cu thay vi dang ky cuoc moi.
// ?c sai (requestedContestId = 0) doi thanh -1 de khong trung luot nao da luu
const urlContest = () => {
  const c = requestedContestId();
  return c === null ? currentContest : c || -1;
};

// Lay cuoc dang dien ra; lien ket cu co ?c cua chinh cuoc do thi bo ?c khoi dia chi. Loi mang: giu cach cu, dung luot gan nhat
async function resolveCurrentContest() {
  let r;
  try { r = await getSchedule(); } catch (e) { return; }
  const ongoing = r.ok && r.data && Array.isArray(r.data.ongoing) ? r.data.ongoing : [];
  if (ongoing.length !== 1) return;
  currentContest = ongoing[0].id;
  if (requestedContestId() !== currentContest) return;
  const query = new URLSearchParams(location.search);
  query.delete('c');
  const rest = query.toString();
  history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
}

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
const isSubmitOnly = () => !state.practice && !!state.contest && state.contest.phase === 'submit_only';

let topics = null; // QUIZ-01
let topicsError = false;
let offline = false;
let current = null; // { view: 'register' | 'menu' | 'intro' | 'q', cd? }
let qs = null; // man cau hoi dang xem: { cd, list (QUIZ-02), i, busy, note, shown, left (ma cau -> so giay doc con lai), timer }
let routeSeq = 0; // moi lan route() tang 1; lan chay cu thoat som neu da co lan moi hon
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

// lam chuyen de nao truoc cung duoc. De khong co Chuyen de 1 thi mo het.
function isLocked(cd, prog) {
  if (state.practice && topicOf(cd)?.audience === 'enterprise') return false;
  if (String(cd) === '1') return false;
  const first = prog.find((p) => p.cd === '1');
  return !!first && !first.done;
}

// Chuyen de phai lam xong truoc (de noi ly do khoa)
function prevTopic(cd) {
  return String(cd) === '1' ? null : topicOf('1');
}

function totalQuestions() {
  return (topics || []).reduce((a, t) => a + t.count, 0);
}

function topicOf(cd) {
  return (topics || []).find((t) => String(t.cd) === String(cd)) || null;
}

async function ensureQuestions(cd) {
  if (qcache.has(cd)) return true;
  const contestId = state.practice ? null : undefined;
  const r = await loadQuestions(cd, contestId);
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

const BANK_PATH = '/ngan-hang/';
const onBank = () => location.pathname.replace(/\/?$/, '/') === BANK_PATH;

// Sang trang ngan hang cau hoi; tu luyen chi chay o dia chi nay
function toBank(hash = '') {
  location.replace(BANK_PATH + (hash === '#chuyen-de' ? '' : hash));
}

// Lien ket cu /thi/#ngan-hang, /thi/#ngan-hang-N: chuyen sang dia chi moi
function redirectLegacyBank() {
  const m = /^#ngan-hang(?:-(\d+)(\/cau-hoi|\/xong)?)?$/.exec(location.hash);
  if (!m) return false;
  toBank(m[1] ? `#chuyen-de-${m[1]}` : '');
  return true;
}

// Hash cua danh sach chuyen de: tu luyen la chinh dia chi /ngan-hang/, khong co hash
function listHash() {
  return state.practice ? '' : '#chuyen-de';
}

// Dia chi cua danh sach chuyen de, dung cho lien ket
function listHref() {
  return state.practice ? BANK_PATH : '#chuyen-de';
}

// Hash man cua mot chuyen de; suffix: '', '/cau-hoi', '/xong'
function topicHash(cd, suffix = '') {
  return `#chuyen-de-${cd}${suffix}`;
}

function parseHash() {
  const h = location.hash;
  const bank = onBank();
  if (!h) return bank ? { view: 'menu', bank } : null;
  if (h === '#chuyen-de') return { view: 'menu', bank };
  if (bank && h === '#doanh-nghiep') return { view: 'menu', bank, enterprise: true };
  const m = /^#chuyen-de-(\d+)(\/cau-hoi|\/xong)?$/.exec(h);
  if (m) return { view: m[2] === '/cau-hoi' ? 'q' : m[2] === '/xong' ? 'done' : 'intro', cd: m[1], bank };
  if (h === '#dang-ky') return { view: 'register' };
  if (h === '#ket-qua') return { view: 'result' };
  return null;
}

function go(hash) {
  if (location.hash === hash) route(true);
  else if (!hash) {
    // Danh sach tu luyen khong co hash: doi dia chi roi tu ve lai
    history.pushState(null, '', BANK_PATH);
    route(true);
  }
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
    return box('ok', `<b>Đã nộp bài.</b> Mã dự thi của bạn là ${esc(e.code)}. <a href="#ket-qua">Xem kết quả lượt thi ›</a>`);
  }
  if (e.mode === 'anon') {
    return box('soft', `<b>Đang thi ẩn danh.</b> Mã ẩn danh của bạn là ${esc(e.code)}. Bài làm không được xét giải.`);
  }
  const nth = e.attemptNo ? ` Đây là lượt thứ ${esc(e.attemptNo)}${Number(e.maxAttempts) === 0 ? ' · không giới hạn lượt thi' : ` trên ${esc(e.maxAttempts)}`}.` : '';
  return box('ok', `<b>Đã đăng ký.</b> Mã dự thi của bạn là ${esc(e.code)}.${nth}`);
}

function headHtml(eyebrow, title, sub) {
  return `${eyebrowHtml(eyebrow)}<h1 id="eh" tabindex="-1" class="contest__h2">${esc(title)}</h1>${sub ? `<p class="exam__sub">${sub}</p>` : ''}`;
}

// Cuoc thi khong nhan dap an nua (API-02 phase): bao ro truoc khi vao lam
function phaseHtml() {
  if (state.practice || !state.entry || !state.synced || state.status === 'submitted') return '';
  // Khi đã làm xong, panel nộp bài là nơi duy nhất hiển thị trạng thái hết hạn.
  const prog = progress();
  if (prog.length && prog.every(topic => topic.done)) return '';
  if (isSubmitOnly()) return box('warn', '<b>Cuộc thi đã hết hạn nhận đáp án.</b> Bạn vẫn có thể làm tiếp trên thiết bị. Phần làm sau hạn không được nộp hoặc xét thưởng.');
  if (answeringLocally() && state.contest?.phase === 'open' && !state.answeringClosed) return box('warn', '<b>Có đáp án chỉ lưu trên thiết bị.</b> Cuộc thi vẫn đang mở; phần này chưa được ghi nhận vào kết quả dự thi.');
  if (answeringLocally()) return box('warn', '<b>Đã hết hạn nộp bài.</b> Bạn vẫn có thể làm tiếp trên thiết bị; phần làm sau hạn không được nộp hoặc xét thưởng.');
  return '';
}

function menuHtml() {
  const prog = progress();
  const common = state.practice ? topics.filter(t => t.audience !== 'enterprise') : topics;
  const enterprise = state.practice ? topics.filter(t => t.audience === 'enterprise') : [];
  const n = common.length;
  const rawSub = blockCopy('topics', 'description', 'Tám chuyên đề, tổng cộng {total} câu. <b>Làm Chuyên đề 1 trước</b>, vì cách quyết định học ở đó được dùng lại ở cả bảy chuyên đề sau. Mỗi câu hiện phần giải thích sau khi bạn chọn.', { topicCount: n, total: common.reduce((sum, t) => sum + t.count, 0) });
  const sub = esc(rawSub).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
  let o = '<div class="activity-portal qin">';
  // Ban chinh thuc: da dang ky thi thi co nut ve Cuoc thi; chi tu luyen thi hien duong dan Trang chu › Hay tu kiem tra › Tu luyen.
  o += state.entry
    ? '<div class="backrow"><a href="/cuoc-thi/" class="btn ghost sm"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5 8 12l7 7"/></svg> Cuộc thi</a></div>'
    : '<nav class="crumbs" aria-label="Bạn đang ở"><ol><li><a href="/">Trang chủ</a></li><li><a href="/hay-tu-kiem-tra/">CÔNG CỤ KIỂM TRA</a></li><li><span aria-current="page">Tự luyện</span></li></ol></nav>';
  o += '<header class="pageh">';
  o += `<p class="eyebrow">${esc(blockCopy('topics', 'eyebrow', 'Kiểm tra kiến thức'))}</p>`;
  o += `<h1 id="eh" tabindex="-1" class="pageh-title contest__h2">${esc(blockCopy('topics', 'title', 'Phần thi trắc nghiệm'))}</h1>`;
  o += `<p class="pageh-lead exam__sub">${sub}</p>`;
  o += '</header>';
  if (offline) o += box('warn', '<b>Chưa kết nối được máy chủ.</b> Tiến độ có thể chưa mới nhất; các đáp án chưa gửi sẽ tự gửi lại khi có mạng.');
  o += phaseHtml();

  // Khối thông báo rgbar
  if (state.entry) {
    if (state.entry.mode === 'anon') {
      o += `<div class="rgbar"><b>Đang thi ẩn danh.</b> Mã ẩn danh của bạn là <b>${esc(state.entry.code)}</b>. Bài làm không được xét giải.</div>`;
    } else {
      const pNum = state.entry.phone || state.phone || state.entry.code;
      const nth = state.entry.attemptNo || 1;
      const maxT = Number(state.entry.maxAttempts) === 0 ? '' : ` trên ${esc(state.entry.maxAttempts || 2)}`;
      o += `<div class="rgbar"><b>Đã đăng ký.</b> Mã dự thi của bạn là số <b>${esc(pNum)}</b>. Đây là lượt thứ ${esc(nth)}${maxT}.</div>`;
    }
  }

  o += panelHtml(topics);

  const cd1Done = !!(prog.find((x) => String(x.cd) === '1')?.done);
  const gate = !cd1Done;

  o += '<ol class="cdlist toplist">';
  for (const t of common) {
    const p = prog.find((x) => String(x.cd) === String(t.cd)) || {};
    const lock = isLocked(String(t.cd), prog);
    const done = !!p.done;
    const isCd1 = String(t.cd) === '1';
    const cleanTitle = esc(t.title.replace(/^CHUYÊN ĐỀ\s*\d+\s*[-–—:]\s*/i, ''));

    let meta = `${t.count} câu`;
    if (lock) {
      meta += ` · mở sau khi xong Chuyên đề ${prevTopic(t.cd)?.cd || '1'}`;
    } else if (done) {
      meta += ' · đã làm xong';
    } else if (isCd1 && gate) {
      meta += ' · làm chuyên đề này trước';
    } else if (p.answered) {
      meta += ` · đã trả lời ${p.answered}`;
    }

    if (lock) {
      o += `<li><div class="lock qrow qrow--lock" aria-disabled="true"><span class="cn s qrow__n">${esc(t.cd)}</span><span class="ct qrow__body"><span class="qrow__t">${cleanTitle}</span><small class="qrow__meta">${esc(meta)}</small></span><span class="lock-ic" aria-hidden="true">${ICO_LOCK}</span></div></li>`;
    } else {
      o += `<li><a class="cdbtn qrow${done ? ' ok qrow--done' : ''}" href="${topicHash(esc(t.cd))}"><span class="cn${done ? ' ok' : ''} qrow__n">${done ? '✓' : esc(t.cd)}</span><span class="ct qrow__body"><span class="qrow__t">${cleanTitle}</span><small class="qrow__meta">${esc(meta)}</small></span><svg class="ic go cdbtn__go qrow__go" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg></a></li>`;
    }
  }
  o += '</ol>';

  if (gate) {
    const cd1Count = topics[0]?.count || 19;
    o += `<div class="gate note"><p><b>Bảy chuyên đề còn lại mở ngay khi bạn làm xong Chuyên đề 1.</b></p><p class="small">Chuyên đề 1 có ${cd1Count} câu. Sau đó thứ tự do bạn chọn.</p></div>`;
  } else {
    o += '<div class="gate open note"><p><b>Bảy chuyên đề còn lại đã mở.</b></p><p class="small">Làm chuyên đề nào gần với việc mình đang gặp thì nhớ lâu hơn.</p></div>';
  }

  if (enterprise.length) {
    const total = enterprise.reduce((sum, t) => sum + t.count, 0);
    o += `<section class="practice-enterprise" id="doanh-nghiep" aria-labelledby="enterprise-title"><h2 id="enterprise-title">${esc(blockCopy('topics', 'enterpriseTitle', 'Dành cho nhân viên doanh nghiệp'))}</h2>`
      + `<p>${esc(blockCopy('topics', 'enterpriseDescription', '{count} câu tình huống về phòng ngừa lừa đảo và rủi ro trong giao dịch, hợp đồng kinh tế của doanh nghiệp. Dành cho người làm kế toán, ngân quỹ, mua hàng, bán hàng, pháp chế và quản lý. Không cần làm Chuyên đề 1 trước.', { count: total }))}</p><ol class="cdlist toplist">`;
    for (const [index, t] of enterprise.entries()) {
      const done = !!prog.find(p => p.cd === String(t.cd))?.done;
      const caption = (t.caption || '{count} câu').replaceAll('{count}', String(t.count));
      o += `<li><a class="cdbtn qrow${done ? ' ok qrow--done' : ''}" href="${topicHash(t.cd)}"><span class="cn${done ? ' ok' : ''} qrow__n">${done ? '✓' : esc(String.fromCharCode(65 + index))}</span><span class="ct qrow__body"><span class="qrow__t">${esc(t.shortTitle || t.title)}</span><small class="qrow__meta">${esc(caption)}${done ? ' · đã làm xong' : ''}</small></span><svg class="ic go qrow__go" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg></a></li>`;
    }
    o += '</ol></section>';
  }

  o += `<p class="small pbfoot exam__note">${esc(blockCopy('topics', 'notice', NOT_POLICE))}</p>`;
  o += '</div>';
  return o;
}

// Nut chinh cua phan gioi thieu: bat dau, lam tiep tu cau k, hoac xem lai khi da xong
function startLabel(t) {
  const p = progress().find((x) => x.cd === String(t.cd));
  if (!p || !p.answered) return blockCopy('intro', 'startLabel', 'Bắt đầu {count} câu ›', { count: t.count });
  if (p.done) return `Làm lại chuyên đề ${t.cd} ›`;
  const list = qcache.get(String(t.cd));
  const k = list ? firstUnanswered(list) + 1 : p.answered + 1;
  return blockCopy('intro', 'resumeLabel', 'Làm tiếp từ câu {number} ›', { number: k });
}

function introHtml(t) {
  const enterprise = state.practice && t.audience === 'enterprise';
  const backHref = listHref() + (enterprise ? '#doanh-nghiep' : '');
  const intro = Array.isArray(t.intro) ? t.intro : (t.intro ? [t.intro] : []);
  const terms = Array.isArray(t.terms) ? t.terms : [];
  const cleanTitle = esc(t.title.replace(/^CHUYÊN ĐỀ\s*\d+\s*[-–—:]\s*/i, ''));
  const backLabel = esc(blockCopy('intro', 'backLabel', 'Danh sách chuyên đề')).replace(/^[‹<]\s*/, '');

  let o = '<div class="activity-portal qin exam-intro-view">';
  o += `<div class="backrow"><a class="btn ghost sm" href="${backHref}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5 8 12l7 7"/></svg> ${enterprise ? 'Dành cho nhân viên doanh nghiệp' : backLabel}</a></div>`;
  o += '<header class="pageh">';
  o += `<p class="eyebrow">Ngân hàng câu hỏi · ${enterprise ? 'Nhân viên doanh nghiệp' : 'Chuyên đề ' + esc(t.cd)}</p>`;
  o += `<h1 id="eh" tabindex="-1">${cleanTitle}</h1>`;
  o += '</header>';
  o += `<div class="exam__intro intro-text">${intro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;

  if (terms.length) {
    o += `<div class="peek terms-peek"><button type="button" class="peekbtn" data-open="pk-terms" aria-expanded="false" aria-controls="pk-terms">`
      + `<span><b>${esc(blockCopy('intro', 'termsTitle', 'Hiểu nhanh mấy từ'))}</b><small>${terms.length} từ dùng trong chuyên đề này</small></span>`
      + `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg></button>`
      + `<div class="peekbody" id="pk-terms" hidden><dl class="terms">${terms.map((x) => `<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join('')}</dl></div></div>`;
  }

  const redo = progress().find((x) => x.cd === String(t.cd));
  const isRedo = !!(redo && redo.done);
  if (isRedo && !state.practice) {
    o += box('soft', '<b>Làm lại là xem lại để học.</b> Điểm của lượt thi chỉ tính lần trả lời đầu tiên của mỗi câu.');
  }

  const readingUrl = enterprise ? null : readingUrls[t.cd];
  o += `<div class="btnrow exam__actions"><button type="button" class="btn pri" ${isRedo ? 'data-redo' : 'data-start'}="${esc(t.cd)}">${esc(startLabel(t))}</button>`
    + (readingUrl?.startsWith('/') && !readingUrl.startsWith('//') ? `<a class="btn ghost" href="${esc(readingUrl)}">Đọc bài trước đã</a>` : '')
    + `<a class="btn ghost" href="${backHref}">${enterprise ? 'Chọn phần khác' : esc(blockCopy('intro', 'otherLabel', 'Chọn chuyên đề khác'))}</a></div>`;
  o += '</div>';
  return o;
}

// Man Xong chuyen de (FE-27)
function doneHtml(t) {
  const cd = String(t.cd);
  const enterprise = state.practice && t.audience === 'enterprise';
  const peers = state.practice ? topics.filter(x => (x.audience === 'enterprise') === enterprise) : topics;
  const list = qcache.get(cd) || [];
  const right = list.filter((q) => {
    const a = getAnswer(q.code);
    return a && a.a === q.ans;
  }).length;
  const rest = progress().filter(p => !p.done && peers.some(t => String(t.cd) === p.cd)).length;
  const saved = hasLateAnswers() ? 'Phần bài làm này chỉ được lưu trên thiết bị, chưa được ghi nhận vào kết quả dự thi hoặc xét thưởng.' : state.practice ? blockCopy('topic-result', 'practiceMessage', 'Kết quả này chỉ hiện trên máy của bạn.') : blockCopy('topic-result', 'savedMessage', 'Kết quả đã được lưu vào lượt thi của bạn.');
  const topicLabel = enterprise ? (t.shortTitle || t.title) : `Chuyên đề ${cd}`;
  let o = `<div class="qin exam__done">${headHtml(`${topicLabel} · đã làm xong`, blockCopy('topic-result', 'title', 'Bạn trả lời đúng {correct} trên {total} câu', { correct: right, total: list.length }), `${esc(saved)} Câu nào chưa đúng thì đọc lại phần giải thích là đủ.`)}`;
  const nx = peers[peers.findIndex(x => String(x.cd) === cd) + 1];
  if (nx && !enterprise) o += box('ok', `<b>Chuyên đề ${esc(nx.cd)} đã mở.</b> ${esc(nx.title)}.`);
  if (!state.practice && state.entry && state.entry.mode === 'anon') {
    o += box('soft', `<b>Bạn đang thi ẩn danh</b> (mã ${esc(state.entry.code)}), nên kết quả này không được xét giải.`);
  }
  o += panelHtml(topics);
  const next = enterprise ? 'Chọn phần khác ›' : rest ? `Chọn chuyên đề tiếp theo, còn ${rest} ›` : `Đã làm hết ${peers.length} chuyên đề, xem lại danh sách ›`;
  o += `<div class="btnrow exam__actions"><a class="btn pri" href="${listHref() + (enterprise ? '#doanh-nghiep' : '')}">${esc(next)}</a>`
    + `<button type="button" class="btn ghost" data-redo="${esc(cd)}">${enterprise ? 'Làm lại phần này' : esc(blockCopy('topic-result', 'retryLabel', 'Làm lại chuyên đề {cd}', { cd }))}</button></div>`
    + '<p class="exam__note">Làm hết câu hỏi không có nghĩa là an toàn. Gặp việc thật, vẫn phải chậm lại và tự kiểm tra bằng kênh do chính mình tìm ra.</p></div>';
  return o;
}

function sideHtml(view) {
  let o;
  const e = state.entry;
  if (state.practice) {
    o = `<div class="sidecard">${eyebrowHtml('Luyện tập')}<p class="sidecard__text">Bài làm chỉ lưu trên máy bạn, không tính vào cuộc thi.</p>`
      + (state.entry && state.status === 'submitted' ? '<button type="button" class="qnav o qnav--s qnav--block" data-back-result>Về kết quả lượt thi</button>' : '')
      + (contestOpen() ? '<a class="qnav o qnav--s qnav--block" href="/thi/#dang-ky">Đăng ký dự thi</a>' : '') + '</div>';
  } else if (e) {
    const anon = e.mode === 'anon';
    o = `<div class="sidecard">${eyebrowHtml(anon ? blockCopy('sidebar', 'anonymousLabel', 'Thí sinh ẩn danh') : blockCopy('sidebar', 'participantLabel', 'Thí sinh'))}`
      + `<p class="sidecard__label">${anon ? 'Mã ẩn danh' : 'Mã dự thi'}</p><b class="sidecard__code${anon ? ' sidecard__code--anon' : ''}">${esc(e.code)}</b>`;
    if (anon) {
      o += `<span class="sidecard__tag">Không xét giải</span>${attachButtonHtml()}`;
    } else {
      if (state.fullName) o += `<p class="sidecard__name">${esc(state.fullName)}</p>`;
      if (e.attemptNo) o += `<p class="sidecard__meta">Lượt thứ ${esc(e.attemptNo)}${Number(e.maxAttempts) === 0 ? ' · Không giới hạn lượt thi' : ` / ${esc(e.maxAttempts)}`}</p>`;
    }
    o += '</div>';
  } else {
    o = regSideHtml;
  }
  if (topics) {
    const prog = progress();
    const done = prog.filter((p) => p.done).length;
    o += `<div class="sidecard">${eyebrowHtml(blockCopy('sidebar', 'progressLabel', 'Tiến độ'))}<p class="sidecard__text sidecard__text--tight">Đã xong ${done} / ${topics.length} chuyên đề</p>`
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
  TOPIC_LOCKED: 'Hãy hoàn thành chuyên đề đứng trước rồi mới làm chuyên đề này.',
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
  go(p && p.done ? topicHash(cd, '/xong') : listHash());
}

function curQuestion() {
  return qs.list[qs.i];
}

function nextLabel() {
  return qs.i >= qs.list.length - 1 ? blockCopy('question', 'finishLabel', 'Đã hiểu, xem kết quả ›') : blockCopy('question', 'nextLabel', 'Đã hiểu, sang câu tiếp theo ›');
}

function noteText() {
  const a = qs && getAnswer(curQuestion().code);
  if (((a && a.localOnly) || answeringLocally()) && state.contest?.phase === 'open' && !state.answeringClosed) return 'Đáp án này chỉ lưu trên thiết bị, chưa được ghi nhận vào kết quả dự thi. Cuộc thi vẫn đang mở.';
  if ((a && a.localOnly) || answeringLocally()) return 'Cuộc thi đã hết hạn nhận đáp án. Bạn vẫn có thể làm tiếp, phần làm sau hạn chỉ lưu trên thiết bị, không được nộp hoặc xét thưởng.';
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
  const prev = i > 0 ? navButtonHtml(blockCopy('question', 'previousLabel', '‹ Câu trước'), 'o', { 'data-prev': '' }) : '';
  const t = topicOf(cd);
  const label = state.practice && t?.audience === 'enterprise' ? t.shortTitle || t.title : `Chuyên đề ${cd}`;
  return `<div class="qin"><div class="qtop"><a class="qnav o" href="${topicHash(esc(cd))}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5 8 12l7 7"/></svg> ${esc(label)}</a>`
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
  s.busy = true;
  s.note = '';
  s.left.set(q.code, readSeconds(q));
  paintAnswer(q, k, true); // hien ngay, doi chieu voi may chu sau
  startTimer(q.code, s.left.get(q.code));
  const r = await answer(q.code, k, s.cd, k === q.ans);
  s.busy = false;
  if (qs !== s || curQuestion() !== q) return;
  if (!r.ok) {
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
  qcache.clear();
  resetSubmit();
}

async function ensureTopics() {
  if (topics) return true;
  const contestId = state.practice ? null : undefined;
  const r = await loadTopics(contestId);
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
    + `<div class="exam__actions"><button type="button" class="qnav f" data-retry>Thử lại</button><a class="qnav o" href="${listHref()}">Về danh sách chuyên đề</a></div></div>`;
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
  if (redirectLegacyBank()) return;
  const want = parseHash();
  if (want && want.bank) {
    // Ngan hang cau hoi: khong check bai thi, luon vao lam ngan hang cau hoi
    if (!state.practice || state.contestId !== null) {
      enterPractice();
      resetLoaded();
    }
  } else if (want && want.view !== 'register' && mode() !== 'entry') {
    // Khong co luot thi: man chuyen de chi con o ngan hang cau hoi
    toBank(location.hash);
    return;
  }
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
  // Man ket qua chi co khi luot da nop
  if (view.view === 'result' && (state.practice || state.status !== 'submitted')) view = { view: 'menu' };
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
  const wantHash = view.view === 'q' ? topicHash(view.cd, '/cau-hoi') : view.view === 'done' ? topicHash(view.cd, '/xong')
    : view.view === 'intro' ? topicHash(view.cd) : view.view === 'result' ? '#ket-qua' : view.enterprise ? '#doanh-nghiep' : listHash();
  const needPath = (location.pathname === '/dang-ky/' || location.pathname === '/cuoc-thi/lam-bai/') ? '/thi/' : null;
  if (needPath || location.hash !== wantHash) {
    history.replaceState(null, '', (needPath || location.pathname) + (location.search || '') + wantHash);
  }
  current = view;
  if (view.view === 'result') {
    await showResult(stale, focus);
    return;
  }
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
  if (view.enterprise) document.getElementById('doanh-nghiep')?.scrollIntoView({ block: 'start' });
}

// Co the thi them luot: da nop co ten, con luot, cuoc con mo
function canRetry() {
  const e = state.entry;
  return !!e && e.mode === 'named' && Number(e.attemptNo) > 0 && (Number(e.maxAttempts) === 0 || Number(e.maxAttempts) > Number(e.attemptNo))
    && !!state.contest && state.contest.phase === 'open';
}

// Man ket qua: lay lai ket qua da luu bang API-05 (luot da nop thi tra lai ket qua cu, khong tinh lai) khi chua co trong bo nho
async function showResult(stale, focus) {
  renderSide('result');
  if (!state.result) {
    examView.innerHTML = '<p class="exam__loading" role="status">Đang tải kết quả…</p>';
    await submitEntry();
    if (stale() || current.view !== 'result') return;
  }
  if (!state.entry) return; // token bi tu choi trong luc cho: man dang ky da duoc ve
  examView.innerHTML = resultHtml(topics, state.result, canRetry());
  renderSide('result');
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
  if (current.view === 'done' || current.view === 'result') {
    renderSide(current.view);
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
    if (state.practice) state.contestId = null;
    topics = null;
    topicsError = false;
    route(true);
    return;
  }
  const start = e.target.closest('[data-start]');
  if (start) {
    go(topicHash(start.dataset.start, '/cau-hoi'));
    return;
  }
  if (e.target.closest('[data-result-retry]')) {
    route(true);
    return;
  }
  if (e.target.closest('[data-review-bank]')) {
    // Luyen tap dung ca ngan hang, khong loc theo de cua cuoc
    location.href = BANK_PATH;
    return;
  }
  const redo = e.target.closest('[data-redo]');
  if (redo) {
    // Luot thi: xem lai cac cau da luu, khong gui API-03. Luyen tap: xoa bai lam cua chuyen de roi lam lai tu dau
    if (state.practice) resetPractice(redo.dataset.redo);
    go(topicHash(redo.dataset.redo, '/cau-hoi'));
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

sideCards.addEventListener('click', async (e) => {
  if (!e.target.closest('[data-back-result]')) return;
  // Tu luyen tap ve ket qua luot thi da nop: dung lai tien do tu may chu
  resetLoaded();
  const r = await init(urlContest());
  offline = !!r.offline;
  go('#ket-qua');
});

wireSubmit(examView, () => topics || []);
wireSubmit(sideCards, () => topics || []);
setupSubmit({
  onSubmitted: () => go('#ket-qua'),
  // Da gan thong tin (API-04): lay lai ten, so luot tu API-02 cho cot ben
  onAttached: async () => {
    const r = await init(urlContest());
    offline = !!r.offline;
    refresh();
  },
  // NOTHING_TO_SUBMIT: lay lai tien do (API-02), hien thong bao cua may chu o danh sach chuyen de
  onIncomplete: async (message) => {
    resetLoaded();
    setNotice(message);
    const r = await init(urlContest());
    offline = !!r.offline;
    go(listHash());
  },
  onClosed: () => route(false),
  focusFallback: () => {
    if (current && current.view === 'q') focusQuestion(examView);
    else focusHeading(document.getElementById('eh'));
  },
});

window.addEventListener('hashchange', () => route(true));
on('change', refresh);
on('submitted', () => {
  // Luot da nop o noi khac: het tra loi duoc, sang man ket qua
  if (state.practice) refresh();
  else go('#ket-qua');
});
on('dropped', ({ q, code }) => {
  // Dap an dang cho bi may chu tu choi (vd cuoc thi da dong): cau tro lai chua tra loi, bao ly do
  if (!qs || current.view !== 'q' || curQuestion().code !== q) return;
  qs.note = ERR_TEXT[code] || ERR_DEFAULT;
  paintFailed(curQuestion());
});
// Tab khac doi luot thi: dung lai tien do tu may chu roi ve man hinh theo luot moi
on('entry-changed', async () => {
  resetLoaded();
  const r = await init(urlContest());
  offline = !!r.offline;
  if (state.status === 'submitted' && !state.practice) history.replaceState(null, '', '#ket-qua');
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
  examView.classList.add('activity-portal');
  examView.innerHTML = '<p class="exam__loading" role="status">Đang tải tiến độ…</p>';
  resetLoaded();
  const r = await init(urlContest());
  offline = !!r.offline;
  if (location.pathname !== '/thi/') {
    history.pushState(null, '', '/thi/' + (location.search || '') + '#chuyen-de');
  }
  go('#chuyen-de');
}
onRegistered(enterExam);

// ---- Khoi dong ----

async function boot() {
  if (redirectLegacyBank()) return;
  if (!onBank()) await resolveCurrentContest();
  const want = parseHash();
  // Trang ngan hang cau hoi: khong check da lam bai thi chua, mo thang ngan hang cau hoi
  if (want && want.bank) {
    enterPractice();
    resetLoaded();
    // Tai lai giua chuyen de thi ve danh sach, nhu luot thi
    if (want.view === 'q' || want.view === 'done') history.replaceState(null, '', BANK_PATH);
    regView.hidden = true;
    examView.hidden = false;
    await route(false);
    return;
  }
  if (loadEntry(urlContest())) {
    // Co luot da luu: khong cho nhay man dang ky roi moi chuyen
    regView.hidden = true;
    examView.hidden = false;
    examView.innerHTML = '<p class="exam__loading" role="status">Đang tải tiến độ…</p>';
  }
  const r = await init(urlContest());
  offline = !!r.offline;
  // Luot da nop: mo lai trang luon hien man ket qua (tru khi dang o man dang ky de thi luot moi)
  if (r.view === 'exam' && state.status === 'submitted' && !(want && want.view === 'register')) {
    history.replaceState(null, '', '#ket-qua');
    await route(false);
    return;
  }
  // Tai lai giua chuyen de (dang lam cau hoi hoac o man Xong) thi ve danh sach chuyen de; vao lai se tiep tu cau chua lam
  const reopen = () => {
    if (want && (want.view === 'q' || want.view === 'done')) history.replaceState(null, '', listHref());
    return route(false);
  };
  if (r.view === 'exam') {
    await reopen();
    return;
  }
  if (want && want.view !== 'register') {
    toBank(location.hash);
    return;
  }
  showRegister(false);
}

boot();
