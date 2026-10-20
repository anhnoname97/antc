import { blockCopy } from './block-copy.js';
// Man Dang ky du thi (FE-25): chon cuoc thi (API-07, ?c=<id>), doi che do, kiem tra phia trinh duyet, goi API-01, xu ly loi.
import { checkContact } from './phone.js';
import { createEntry, saveEntry, getSchedule } from './contest-api.js';
import { esc } from '../quiz/quiz-ui.js';

const MSG_RATE = 'Bạn thao tác hơi nhanh. Đợi một chút rồi bấm lại.';
const MSG_NETWORK = 'Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm lại.';

// Ngay hien thi theo gio Viet Nam (may chu tra thoi diem UTC)
const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

const main = document.getElementById('cmain');
const form = document.getElementById('rgform');
const modesBox = document.getElementById('modes');
const anonBox = document.getElementById('anonbox');
const closedBox = document.getElementById('closedbox');
const errBox = document.getElementById('rgerr');
const anonErrBox = document.getElementById('anonerr');
const nameEl = document.getElementById('rgname');
const phoneEl = document.getElementById('rgphone');
const orgEl = document.getElementById('rgorg');
const okEl = document.getElementById('rgok');
const submitBtn = document.getElementById('rgsubmit');
const anonBtn = document.getElementById('anonstart');
const pickBox = document.getElementById('pickbox');
const regSec = document.getElementById('regsec');
const fieldEls = { fullName: nameEl, phone: phoneEl, org: orgEl, consent: okEl };

let busy = false;
let registeredHandler = null;
let contest = null; // cuoc thi dang dang ky (phan tu 'ongoing' cua API-07); null khi chua chon duoc

// exam.js dang ky ham chuyen sang man danh sach chuyen de sau khi dang ky xong
export function onRegistered(fn) {
  registeredHandler = fn;
}

// ?c=<id> tren URL: so nguyen duong; null khi khong co; 0 khi gia tri sai (vd ?c=abc), coi nhu khong tim thay cuoc
export function requestedContestId() {
  let raw = null;
  try { raw = new URLSearchParams(location.search).get('c'); } catch (e) { /* bo qua */ }
  if (raw === null || raw === '') return null;
  return /^[1-9][0-9]{0,9}$/.test(raw) ? Number(raw) : 0;
}

function currentErrBox() {
  return anonBox.hidden ? errBox : anonErrBox;
}

function showError(message, field) {
  for (const el of [nameEl, phoneEl, orgEl]) el.removeAttribute('aria-invalid');
  const box = currentErrBox();
  errBox.hidden = anonErrBox.hidden = true;
  errBox.textContent = anonErrBox.textContent = '';
  if (!message) return;
  box.hidden = false;
  // Xoa roi gan lai o khung hinh ke tiep de trinh doc man hinh doc lai cung mot loi
  requestAnimationFrame(() => { box.textContent = message; });
  if (field) {
    if (field !== okEl) field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

// Tra ve { error, field } hoac { payload }, kiem tra theo thu tu ten, so, dong y.
export function validate() {
  const r = checkContact({ fullName: nameEl.value, phone: phoneEl.value, org: orgEl.value, consent: okEl.checked });
  if (r.error) return { error: r.error, field: fieldEls[r.field] };
  return { payload: { mode: 'named', ...r.contact } };
}

function setBusy(on) {
  busy = on;
  modesBox.disabled = on;
  submitBtn.disabled = anonBtn.disabled = on;
  submitBtn.textContent = on ? 'Đang đăng ký…' : blockCopy('registration', 'submitLabel', 'Đăng ký và bắt đầu làm bài ›');
  anonBtn.textContent = on ? 'Đang đăng ký…' : blockCopy('registration', 'anonymousSubmitLabel', 'Bắt đầu thi ẩn danh ›');
}

// Cuoc dang chon khong dang ky duoc nua (het han, bi tat...): chi con loi vao luyen tap
function showClosed() {
  main.dataset.contestStatus = 'none';
  regSec.hidden = true;
  pickBox.hidden = true;
  closedBox.hidden = false;
}

function showApiError(error, payload) {
  switch (error.code) {
    case 'ATTEMPT_LIMIT': {
      const n = payload.phone || '';
      const max = contest ? contest.maxAttempts : 0;
      const text = max
        ? `Số ${n} đã dùng hết ${max} lượt của cuộc thi này. Mỗi số điện thoại chỉ được thi tối đa ${max} lượt.`
        : `Số ${n} đã dùng hết lượt của cuộc thi này.`;
      showError(text, payload.mode === 'named' ? phoneEl : null);
      break;
    }
    case 'CONTEST_CLOSED':
    case 'CONTEST_NOT_FOUND':
      showClosed();
      break;
    case 'RATE_LIMITED':
      showError(MSG_RATE);
      break;
    case 'VALIDATION': {
      // Truong dau tien theo thu tu tren form; gia tri chi nhan chuoi (hoac phan tu dau cua mang)
      const key = error.fields ? Object.keys(fieldEls).find((k) => k in error.fields) : null;
      const v = key ? error.fields[key] : null;
      const text = typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '';
      if (key && payload.mode === 'named') showError(text || error.message || MSG_NETWORK, fieldEls[key]);
      else showError(error.message || MSG_NETWORK);
      break;
    }
    default:
      showError(MSG_NETWORK);
  }
}

async function submit(payload) {
  if (busy || !contest) return;
  setBusy(true);
  let result;
  try {
    // contestId la so nguyen duong (API-01 muc 1)
    result = await createEntry({ ...payload, contestId: contest.id });
  } catch (e) {
    result = { ok: false, error: { code: 'NETWORK', message: '', fields: null } };
  }
  if (result.ok) {
    saveEntry(result.data);
    // Giu nut khoa cho toi khi man hinh da chuyen (API-02 co the cham), tranh dang ky lan hai tao them luot
    try {
      if (registeredHandler) await registeredHandler();
    } finally {
      setBusy(false);
    }
    return;
  }
  setBusy(false);
  showApiError(result.error, payload);
}

function wireForm() {
  function setMode(mode) {
    const anon = mode === 'anon';
    form.hidden = anon;
    anonBox.hidden = !anon;
    showError('');
  }

  document.querySelectorAll('input[name="rgmode"]').forEach((r) => {
    r.addEventListener('change', () => { if (r.checked) setMode(r.value); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const result = validate();
    if (result.error) {
      showError(result.error, result.field);
      return;
    }
    showError('');
    await submit(result.payload);
  });

  anonBtn.addEventListener('click', async () => {
    showError('');
    await submit({ mode: 'anon' });
  });
}

// ---- Chon cuoc thi (API-07) ----

const fmtDate = (iso) => dateFmt.format(new Date(iso));
const period = (c) => `${fmtDate(c.startAt)} – ${fmtDate(c.endAt)}`;

// Dia chi trang nay voi ?c=<id> (id null: bo ?c), giu cac tham so khac tren URL
function contestHref(id) {
  const q = new URLSearchParams(location.search);
  if (id === null) q.delete('c');
  else q.set('c', String(id));
  const s = q.toString();
  return location.pathname + (s ? `?${s}` : '');
}

function cardHtml(c) {
  const meta = `${period(c)} · ${c.questionCount} câu · ${c.topics.length} chuyên đề · tối đa ${c.maxAttempts} lượt mỗi số điện thoại`;
  return `<li class="cpick__item"><a class="cpick__card" href="${esc(contestHref(c.id))}">`
    + `<span class="cpick__name">${esc(c.name)}</span>`
    + (c.description ? `<span class="cpick__desc">${esc(c.description)}</span>` : '')
    + `<span class="cpick__meta">${esc(meta)}</span>`
    + '<span class="cpick__go" aria-hidden="true">Chọn ›</span></a></li>';
}

function upcomingHtml(list) {
  if (!list.length) return '';
  return '<div class="notebox cpick__up"><b>Sắp diễn ra</b><ul>'
    + list.map((c) => `<li><b>${esc(c.name)}</b>: mở từ ${esc(fmtDate(c.startAt))}</li>`).join('')
    + '</ul></div>';
}

function listHtml(heading, intro, ongoing) {
  return `<h3 class="cpick__h">${esc(heading)}</h3>`
    + (intro ? `<p class="cpick__intro">${esc(intro)}</p>` : '')
    + `<ul class="cpick__list">${ongoing.map(cardHtml).join('')}</ul>`;
}

function showPick(html) {
  regSec.hidden = true;
  closedBox.hidden = true;
  pickBox.hidden = false;
  pickBox.innerHTML = html;
}

function selectContest(c) {
  contest = c;
  main.dataset.contestStatus = 'open';
  pickBox.hidden = true;
  closedBox.hidden = true;
  regSec.hidden = false;
  document.getElementById('cname').textContent = c.name;
  const desc = document.getElementById('cdesc');
  desc.textContent = c.description || '';
  desc.hidden = !c.description;
  document.getElementById('ctime').textContent = period(c);
  const max = String(c.maxAttempts).padStart(2, '0');
  document.querySelectorAll('[data-max]').forEach((el) => { el.textContent = max; });
}

function showNone(note, upcoming) {
  main.dataset.contestStatus = 'none';
  showPick(`<div class="notebox"><b>${esc(note)}</b>`
    + '<p>Bạn vẫn có thể luyện tập với ngân hàng câu hỏi bằng nút bên dưới.</p></div>'
    + upcomingHtml(upcoming));
}

function showScheduleError() {
  main.dataset.contestStatus = 'none';
  showPick('<div class="notebox"><b>Chưa tải được danh sách cuộc thi.</b><p>Kiểm tra mạng rồi bấm thử lại. Bạn vẫn có thể luyện tập với ngân hàng câu hỏi.</p></div>'
    + '<div class="contest__actions"><button type="button" class="btn btn--primary" id="schedretry">Thử lại</button></div>');
  document.getElementById('schedretry').addEventListener('click', loadSchedule);
}

function renderSchedule(d) {
  const ongoing = Array.isArray(d.ongoing) ? d.ongoing : [];
  const upcoming = Array.isArray(d.upcoming) ? d.upcoming : [];
  const ended = Array.isArray(d.ended) ? d.ended : [];
  const want = requestedContestId();

  // API moi chi cho phep mot cuoc dang dien ra; khong tu chon khi du lieu bat nhat.
  if (ongoing.length > 1) {
    showScheduleError();
    return;
  }

  if (want !== null) {
    const hit = ongoing.find((c) => c.id === want);
    if (hit) {
      selectContest(hit);
      return;
    }
    // ?c= khong phai cuoc dang dien ra: noi ro ly do, roi goi y cac cuoc dang dien ra
    const up = upcoming.find((c) => c.id === want);
    const gone = ended.find((c) => c.id === want);
    let note = 'Không tìm thấy cuộc thi này.';
    if (up) note = `Cuộc thi “${up.name}” chưa mở, bắt đầu từ ${fmtDate(up.startAt)}.`;
    else if (gone) note = `Cuộc thi “${gone.name}” đã kết thúc ngày ${fmtDate(gone.endAt)}.`;
    if (ongoing.length) {
      main.dataset.contestStatus = 'open';
      showPick(`<div class="notebox"><b>${esc(note)}</b></div>` + listHtml('Cuộc thi đang diễn ra', '', ongoing));
    } else {
      showNone(note, upcoming);
    }
    return;
  }

  if (ongoing.length === 1) {
    selectContest(ongoing[0]);
  } else {
    showNone('Hiện chưa có cuộc thi đang diễn ra.', upcoming);
  }
}

async function loadSchedule() {
  pickBox.hidden = false;
  regSec.hidden = true;
  pickBox.innerHTML = '<p class="exam__loading">Đang tải danh sách cuộc thi…</p>';
  let r;
  try {
    r = await getSchedule();
  } catch (e) {
    r = { ok: false };
  }
  if (!r.ok || !r.data) {
    showScheduleError();
    return;
  }
  renderSchedule(r.data);
}

wireForm();
loadSchedule();
