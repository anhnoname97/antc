// Man Dang ky du thi (FE-25): doi che do, kiem tra phia trinh duyet, goi API-01, xu ly loi.
import { normalizePhone, isValidPhone } from './phone.js';
import { createEntry, saveEntry, loadEntry, markPractice } from './contest-api.js';

const MSG_NAME = 'Chưa có họ tên. Ban Tổ chức cần tên để xác minh khi trao giải.';
const MSG_PHONE = 'Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.';
const MSG_CONSENT = 'Cần tích ô đồng ý với Thể lệ và nội dung xử lý dữ liệu thì mới vào thi được.';
const MSG_RATE = 'Bạn thao tác hơi nhanh. Đợi một chút rồi bấm lại.';
const MSG_NETWORK = 'Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm lại.';

const main = document.getElementById('cmain');
const form = document.getElementById('rgform');
const modesBox = document.getElementById('modes');
const anonBox = document.getElementById('anonbox');
const closedBox = document.getElementById('closedbox');
const doneBox = document.getElementById('donebox');
const doneText = document.getElementById('donetext');
const errBox = document.getElementById('rgerr');
const anonErrBox = document.getElementById('anonerr');
const nameEl = document.getElementById('rgname');
const phoneEl = document.getElementById('rgphone');
const orgEl = document.getElementById('rgorg');
const okEl = document.getElementById('rgok');
const submitBtn = document.getElementById('rgsubmit');
const anonBtn = document.getElementById('anonstart');

// Trang do may chu gan; khac 'open' thi khong co form, chi con loi vao luyen tap
const isOpen = main.dataset.contestStatus === 'open';
const maxAttempts = Number(main.dataset.maxAttempts) > 0 ? Number(main.dataset.maxAttempts) : 2;
const fieldEls = { fullName: nameEl, phone: phoneEl, org: orgEl, consent: okEl };

let busy = false;

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
  const fullName = nameEl.value.trim();
  const phone = normalizePhone(phoneEl.value);
  if (!fullName) return { error: MSG_NAME, field: nameEl };
  if (!isValidPhone(phone)) return { error: MSG_PHONE, field: phoneEl };
  if (!okEl.checked) return { error: MSG_CONSENT, field: okEl };
  return { payload: { mode: 'named', fullName, phone, org: orgEl.value.trim(), consent: true } };
}

function setBusy(on) {
  busy = on;
  modesBox.disabled = on;
  submitBtn.disabled = anonBtn.disabled = on;
  submitBtn.textContent = on ? 'Đang đăng ký…' : 'Đăng ký và bắt đầu làm bài ›';
  anonBtn.textContent = on ? 'Đang đăng ký…' : 'Bắt đầu thi ẩn danh ›';
}

function hideFlow() {
  for (const el of [modesBox, form, anonBox]) if (el) el.hidden = true;
}

// Khoi thong bao dung chung voi T3 (trang do may chu gan khi cuoc thi khong mo)
function showClosed() {
  hideFlow();
  closedBox.hidden = false;
}

// Man cho tam, FE-26 thay bang danh sach chuyen de
function showRegistered(entry) {
  hideFlow();
  closedBox.hidden = true;
  doneText.textContent = entry.mode === 'anon'
    ? `Đã đăng ký thi ẩn danh. Mã dự thi ${entry.code}.`
    : `Đã đăng ký. Mã dự thi ${entry.code}${entry.attemptNo ? `, lượt ${entry.attemptNo}/${entry.maxAttempts}` : ''}.`;
  doneBox.hidden = false;
  doneBox.focus();
}

function showPractice() {
  hideFlow();
  closedBox.hidden = true;
  doneText.textContent = 'Chế độ luyện tập. Ngân hàng câu hỏi sẽ mở ở đây.';
  doneBox.hidden = false;
  doneBox.focus();
}

function showApiError(error, payload) {
  switch (error.code) {
    case 'ATTEMPT_LIMIT': {
      const n = payload.phone || '';
      showError(`Số ${n} đã dùng hết ${maxAttempts} lượt thi. Mỗi số điện thoại chỉ được thi tối đa ${maxAttempts} lượt.`, payload.mode === 'named' ? phoneEl : null);
      break;
    }
    case 'CONTEST_CLOSED':
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
  if (busy) return;
  setBusy(true);
  let result;
  try {
    result = await createEntry(payload);
  } catch (e) {
    result = { ok: false, error: { code: 'NETWORK', message: '', fields: null } };
  }
  if (result.ok) {
    const entry = saveEntry(result.data);
    location.hash = '#ngan-hang';
    showRegistered(entry);
    return;
  }
  setBusy(false);
  showApiError(result.error, payload);
}

if (isOpen) {
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

document.querySelector('[data-practice]').addEventListener('click', () => {
  markPractice();
  showPractice();
});

// Mo lai trang voi #ngan-hang: neu da co luot thi thi hien man cho tam (FE-28 xu ly day du)
if (location.hash === '#ngan-hang') {
  const entry = loadEntry();
  if (entry && entry.code) showRegistered(entry);
}
