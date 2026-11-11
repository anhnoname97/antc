import { blockCopy } from './block-copy.js';
// Nop bai, gan thong tin du thuong cho luot an danh, man ket qua luot thi (FE-29).
// exam.js goi: panelHtml (thanh nop bai o danh sach / man Xong chuyen de), attachButtonHtml (cot ben), resultHtml (man ket qua),
// wire (mo hop thoai khi bam nut). Trang thai lay tu contest-store.js; hop thoai la <dialog id="sdlg"> trong contestSubmissionBlock.cshtml.
import { state, hasLateAnswers, restartLocalAnswers, submit, attachContact, topicProgress, pendingCount } from './contest-store.js';
import { checkContact } from './phone.js';
import { esc, eyebrowHtml } from '../quiz/quiz-ui.js';

const MSG_CONSENT = 'Cần tích ô đồng ý với Thể lệ và nội dung xử lý dữ liệu thì mới gửi thông tin được.';
const MSG_NETWORK = 'Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm lại.';
const MSG_RATE = 'Bạn thao tác hơi nhanh. Đợi một chút rồi bấm lại.';

const dateTimeFmt = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
});

const dlg = document.getElementById('sdlg');
const form = document.getElementById('sdlg-form');
const titleEl = document.getElementById('sdlg-h');
const sumEl = document.getElementById('sdlg-sum');
const tickRow = document.getElementById('sdlg-tick');
const wantEl = document.getElementById('sd-want');
const anonLine = document.getElementById('sdlg-anon');
const fieldsBox = document.getElementById('sdlg-fields');
const errEl = document.getElementById('sdlg-err');
const okBtn = document.getElementById('sdlg-ok');
const cancelBtn = document.getElementById('sdlg-cancel');
const inputs = {
  fullName: document.getElementById('sd-name'),
  phone: document.getElementById('sd-phone'),
  org: document.getElementById('sd-org'),
  consent: document.getElementById('sd-ok'),
};

let deps = null; // { onSubmitted, onAttached, onIncomplete, onClosed, focusFallback }
let kind = null; // 'submit' | 'attach'
let busy = false;
let opener = null;
let notice = ''; // thong bao tu may chu (vd NOTHING_TO_SUBMIT), hien tren thanh nop bai cho toi khi tien do doi hoac doi luot
let noticeAt = null; // so cau da tra loi khi nhan thong bao; tra loi them thi bo thong bao cu
let currentTopics = () => [];
let expired = false; // da nhan CONTEST_CLOSED o API-04/05: het han nop

export function setup(handlers) {
  deps = handlers;
}

// Doi luot/cuoc: bo thong bao va co het han cu
export function resetSubmit() {
  notice = '';
  noticeAt = null;
  expired = false;
}

export function setNotice(text) {
  notice = text || '';
  noticeAt = notice ? counts(state.topics).answered : null;
}

const box = (k, html) => `<div class="infobox infobox--${k}">${html}</div>`;

// ---- Tinh toan ----

function counts(topics) {
  const prog = topicProgress(topics);
  const total = prog.reduce((a, p) => a + p.count, 0);
  const answered = prog.reduce((a, p) => a + Math.min(p.answered, p.count), 0);
  return { total, answered, complete: total > 0 && prog.every((p) => p.done) };
}

// Het han nop: API-02 bao phase 'closed', luot khong co cuoc, hoac vua nhan CONTEST_CLOSED (submit_only van nop duoc)
function submitExpired() {
  if (expired) return true;
  return state.synced && (!state.contest || state.contest.phase === 'closed');
}

const inEntry = () => !state.practice && !!state.entry && state.status !== 'submitted';

// Chi mo nop bai khi tat ca chuyen de/cau hoi cua luot da hoan thanh va luu len may chu.
function readyToSubmit(topics) {
  const plan = state.topics.length ? state.topics : topics;
  const { total, complete } = counts(plan);
  return inEntry() && state.synced && complete && !submitExpired() && !hasLateAnswers()
    && (state.total == null || Number(state.total) === total)
    && pendingCount() === 0 && ![...state.answers.values()].some(answer => answer.pending);
}


// ---- HTML ----

// Thanh nop bai o dau danh sach chuyen de va man Xong chuyen de
export function panelHtml(topics) {
  if (!inEntry()) return '';
  const { total, answered, complete } = counts(state.topics.length ? state.topics : topics);
  if (!complete) return '';
  if (notice) {
    if (noticeAt === null) noticeAt = answered;
    else if (noticeAt !== answered) notice = ''; // tien do doi thi thong bao cu khong con dung
  }
  let o = notice ? box('warn', esc(notice)) : '';
  // API lưu đáp án có thể báo đóng trước khi phase từ lần tải trước được cập nhật.
  // Bài có đáp án làm sau hạn chỉ được xem lại trên thiết bị, kể cả trong thời gian gia hạn nộp.
  if (submitExpired() || (hasLateAnswers() && (state.answeringClosed || state.contest?.phase === 'submit_only'))) {
    return box('warn', '<b>Đã hết hạn nộp bài.</b> Bạn vẫn xem lại được ngân hàng câu hỏi ở chế độ luyện tập.');
  }
  if (hasLateAnswers()) {
    const restart = state.contest?.phase === 'open'
      ? '<button type="button" class="qnav o" data-restart-local>Làm lại phần chưa được ghi nhận để dự thi</button>' : '';
    return box('warn', '<b>Phần bài làm này chưa được ghi nhận trên máy chủ.</b> Các đáp án này chỉ lưu trên thiết bị, không phải kết quả đã nộp. ' + restart);
  }
  if (!readyToSubmit(topics)) return '';
  const progress = `Bạn đã trả lời hết ${total} câu và hoàn thành toàn bộ chuyên đề.`;
  return o + `<div class="infobox infobox--ok submitbar"><p><b>${progress}</b> Nộp bài để chốt kết quả. Nộp rồi thì không làm tiếp được trong lượt này.</p>`
    + '<button type="button" class="qnav f" data-submit-open>Nộp bài dự thi</button></div>';
}

// Nut o cot ben cho luot an danh chua nop
export function attachButtonHtml() {
  // API-04 chi nhan khi phase 'open' (submit_only da dong gan ten, chi con nop bai)
  if (!inEntry() || state.entry.mode !== 'anon' || submitExpired() || !state.contest || state.contest.phase !== 'open') return '';
  return '<button type="button" class="qnav o qnav--s qnav--block" data-attach-open>Dự thi có tên để xét giải</button>';
}

function fmtTime(iso) {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? dateTimeFmt.format(d) : '';
}

// Man ket qua luot thi. r: ket qua API-05 (null khi chua lay duoc: dung diem va thoi diem da co tu API-02); topics: QUIZ-01 de lay tieu de
export function resultHtml(topics, r, canRetry) {
  const e = state.entry;
  const score = r ? r.score : state.score;
  const total = r ? r.total : state.total;
  const when = fmtTime(r ? r.submittedAt : state.submittedAt);
  const sub = [state.contest ? `Cuộc thi “${esc(state.contest.name)}”` : '', e ? `Mã dự thi ${esc(e.code)}` : '', when ? `Nộp lúc ${esc(when)}` : ''].filter(Boolean).join(' · ');
  let o = `<div class="qin exam__result">${eyebrowHtml(blockCopy('entry-result', 'eyebrow', 'Đã nộp bài'))}<h1 id="eh" tabindex="-1" class="contest__h2">`
    + (score != null && total != null ? esc(blockCopy('entry-result', 'title', 'Bạn trả lời đúng {correct} trên {total} câu', { correct: score, total })) : 'Bài của bạn đã được nộp')
    + `</h1>${sub ? `<p class="exam__sub">${sub}</p>` : ''}`;
  if (!r) {
    o += box('warn', '<b>Chưa tải được chi tiết kết quả.</b> Kiểm tra mạng rồi bấm thử lại.')
      + '<div class="exam__actions"><button type="button" class="qnav f" data-result-retry>Thử lại</button></div>';
  } else {
    o += r.eligibleForPrize
      ? box('ok', `<b>${esc(blockCopy('entry-result', 'eligibleMessage', 'Bài của bạn được đưa vào danh sách xét giải.'))}</b>`)
      : box('soft', `<b>${esc(blockCopy('entry-result', 'anonymousMessage', 'Bài ẩn danh, không xét giải.'))}</b>`);
    const by = Array.isArray(r.byTopic) ? r.byTopic : [];
    if (by.length) {
      const title = (cd) => {
        const t = (topics || []).find((x) => String(x.cd) === String(cd));
        return t ? t.title : `Chuyên đề ${cd}`;
      };
      o += '<table class="restable"><caption class="sr-only">Số câu đúng theo chuyên đề</caption>'
        + '<thead><tr><th scope="col">Chuyên đề</th><th scope="col">Đúng / số câu</th></tr></thead><tbody>'
        + by.map((x) => `<tr><th scope="row"><span class="restable__n">${esc(x.cd)}</span>${esc(title(x.cd))}</th><td>${esc(x.correct)} / ${esc(x.count)}</td></tr>`).join('')
        + '</tbody></table>';
    }
  }
  o += `<div class="exam__actions"><button type="button" class="qnav f" data-review-bank>${esc(blockCopy('entry-result', 'reviewLabel', 'Xem lại ngân hàng câu hỏi'))}</button>`;
  if (canRetry) o += `<a class="qnav o" href="#dang-ky">Thi lượt thứ ${esc(Number(e.attemptNo) + 1)}</a>`;
  return `${o}</div></div>`;
}

// ---- Hop thoai ----

function showErr(message, field) {
  for (const el of Object.values(inputs)) el.removeAttribute('aria-invalid');
  errEl.hidden = !message;
  errEl.textContent = '';
  if (!message) return;
  // Xoa roi gan lai o khung hinh ke tiep de trinh doc man hinh doc lai cung mot loi
  requestAnimationFrame(() => { errEl.textContent = message; });
  if (field) {
    if (field !== inputs.consent) field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

function setBusy(on) {
  busy = on;
  okBtn.disabled = cancelBtn.disabled = on;
  wantEl.disabled = on;
  for (const el of Object.values(inputs)) el.disabled = on;
  okBtn.textContent = on ? (kind === 'attach' ? 'Đang gửi…' : 'Đang nộp…') : (kind === 'attach' ? 'Ghi nhận thông tin' : 'Nộp bài');
}

function syncFields() {
  const show = kind === 'attach' || (kind === 'submit' && wantEl.checked);
  fieldsBox.hidden = !show;
  anonLine.hidden = !(kind === 'submit' && state.entry.mode === 'anon' && !wantEl.checked);
}

function correctCount() {
  let n = 0;
  for (const v of state.answers.values()) if (v.correct) n++;
  return n;
}

function openDialog(k, trigger, topics) {
  if (!dlg || !state.entry || (k === 'submit' && !readyToSubmit(topics) && !submitExpired())) return;
  kind = k;
  opener = trigger;
  showErr('');
  for (const el of Object.values(inputs)) {
    if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
  }
  wantEl.checked = false;
  if (kind === 'attach') {
    titleEl.textContent = blockCopy('submission', 'attachTitle', 'Dự thi có tên để xét giải');
    sumEl.textContent = `Mã dự thi ${state.entry.code} và các câu bạn đã làm được giữ nguyên.`;
    tickRow.hidden = true;
  } else {
    const { total, answered } = counts(topics);
    titleEl.textContent = blockCopy('submission', 'title', 'Nộp bài dự thi');
    sumEl.textContent = `Bạn đã làm ${answered} / ${total} câu, đúng ${correctCount()} câu. Nộp rồi thì không làm tiếp được trong lượt này.`;
    tickRow.hidden = state.entry.mode !== 'anon';
  }
  sumEl.hidden = false;
  cancelBtn.textContent = kind === 'attach' ? 'Đóng' : blockCopy('submission', 'cancelLabel', 'Làm tiếp');
  setBusy(false);
  syncFields();
  dlg.showModal();
  titleEl.focus({ preventScroll: true });
  if (k === 'submit' && submitExpired()) showExpiredNotice();
}

function closeDialog() {
  if (dlg.open) dlg.close();
}

function showExpiredNotice() {
  expired = true;
  showErr('Đã hết hạn nộp bài. Bài thi chưa được nộp; bạn vẫn có thể xem lại các đáp án đã lưu.');
  okBtn.disabled = true;
  cancelBtn.textContent = 'Đóng';
}

// Loi tu may chu hoac mang: giu hop thoai mo de thu lai, tru khi khong con y nghia (het han, thieu cau, token)
function handleError(err, contact) {
  const failed = kind === 'attach' ? 'Chưa ghi nhận được thông tin.' : 'Chưa nộp được bài.';
  switch (err.code) {
    case 'VALIDATION': {
      const key = err.fields ? Object.keys(inputs).find((k) => k in err.fields) : null;
      const v = key ? err.fields[key] : null;
      const text = typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '';
      showErr(text || err.message || MSG_NETWORK, key ? inputs[key] : null);
      return;
    }
    case 'ATTEMPT_LIMIT': {
      const max = state.entry && state.entry.maxAttempts;
      const n = contact ? contact.phone : '';
      const tail = kind === 'submit' ? ' Bạn vẫn có thể nộp ẩn danh.' : '';
      showErr(`Số ${n} đã dùng hết ${max ? `${max} lượt` : 'lượt'} thi của cuộc thi này.${tail}`, inputs.phone);
      return;
    }
    case 'QUEUE_PENDING':
      showErr(err.message);
      return;
    case 'NOTHING_TO_SUBMIT':
      closeDialog();
      deps.onIncomplete(err.message);
      return;
    case 'CONTEST_CLOSED':
      const attaching = kind === 'attach';
      if (attaching) {
        closeDialog();
        // Chi het han gan ten, nop bai co the con (submit_only): doc lai API-02 de cot ben an nut, khong khoa nop bai
        deps.onAttached();
        return;
      }
      showExpiredNotice();
      return;
    case 'ALREADY_NAMED':
      closeDialog();
      deps.onAttached();
      return;
    case 'ALREADY_SUBMITTED':
      closeDialog();
      deps.onSubmitted();
      return;
    case 'INVALID_TOKEN':
      closeDialog(); // contest-store da xoa luot va bao 'token'
      return;
    case 'RATE_LIMITED':
      showErr(MSG_RATE);
      return;
    default:
      showErr(`${failed} ${MSG_NETWORK}`);
  }
}

async function onOk() {
  if (busy || !state.entry) return;
  if (kind === 'submit' && submitExpired()) {
    showExpiredNotice();
    return;
  }
  if (kind === 'submit' && !readyToSubmit(currentTopics())) {
    closeDialog();
    deps?.onIncomplete('Bạn cần hoàn thành toàn bộ câu hỏi và chuyên đề, đồng thời lưu hết đáp án trước khi nộp bài.');
    return;
  }
  let contact;
  if (kind === 'attach' || wantEl.checked) {
    const r = checkContact({
      fullName: inputs.fullName.value, phone: inputs.phone.value, org: inputs.org.value, consent: inputs.consent.checked,
    }, MSG_CONSENT);
    if (r.error) {
      showErr(r.error, inputs[r.field]);
      return;
    }
    contact = r.contact;
  }
  showErr('');
  setBusy(true);
  let res;
  try {
    res = kind === 'attach' ? await attachContact(contact) : await submit(contact);
  } catch (e) {
    res = { ok: false, error: { code: 'NETWORK', message: '', fields: null } };
  }
  setBusy(false);
  if (res.ok) {
    closeDialog();
    if (kind === 'attach') deps.onAttached();
    else deps.onSubmitted();
    return;
  }
  handleError(res.error, contact);
}

if (dlg) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    onOk();
  });
  wantEl.addEventListener('change', () => {
    showErr('');
    syncFields();
    if (wantEl.checked) inputs.fullName.focus();
  });
  cancelBtn.addEventListener('click', () => { if (!busy) closeDialog(); });
  // Esc dong hop thoai, tru luc dang gui (de khong mat ket qua lan nop)
  dlg.addEventListener('cancel', (e) => { if (busy) e.preventDefault(); });
  dlg.addEventListener('close', () => {
    kind = null;
    if (expired) deps.onClosed();
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    else if (deps) deps.focusFallback();
    opener = null;
  });
}

// Bam nut mo hop thoai trong vung examView / cot ben. getTopics: danh sach chuyen de dang dung (de tom tat so cau)
export function wire(root, getTopics) {
  currentTopics = getTopics;
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-restart-local]')) {
      if (restartLocalAnswers()) deps.onIncomplete('');
      return;
    }
    const sub = e.target.closest('[data-submit-open]');
    if (sub) {
      openDialog('submit', sub, getTopics());
      return;
    }
    const att = e.target.closest('[data-attach-open]');
    if (att) openDialog('attach', att, getTopics());
  });
}
