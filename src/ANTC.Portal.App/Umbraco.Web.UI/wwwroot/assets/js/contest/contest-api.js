// Lop goi API cuoc thi (phan nho cua FE-28): tao luot thi, luu at_entry, danh dau luyen tap.
// FE-28 bo sung cac ham con lai (lay lai luot, luu dap an, gan thong tin, nop bai) vao module nay.
// Moi ham tra { ok:true, data } hoac { ok:false, error:{ code, message, fields } }.

const ENTRIES_URL = '/api/v1/contest/entries';
const KEY_ENTRY = 'at_entry';
const KEY_PRACTICE = 'at_practice';

// Mac dinh dung API that. ?mock=ok|limit|closed|rate|network|server|validation chi co tac dung
// khi chay tren localhost/127.0.0.1, de nguoi dung that khong the bat mock bang URL.
const MOCK_DEFAULT = false;

function isLocalHost() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function mockMode() {
  if (!isLocalHost()) return null;
  let v = null;
  try { v = new URLSearchParams(location.search).get('mock'); } catch (e) { /* bo qua */ }
  if (v === 'real') return null;
  if (v) return v;
  return MOCK_DEFAULT ? 'ok' : null;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function mockCreateEntry(payload, mode) {
  await delay(700);
  switch (mode) {
    case 'limit': return fail('ATTEMPT_LIMIT', 'Đã hết lượt thi.');
    case 'closed': return fail('CONTEST_CLOSED', 'Cuộc thi chưa mở hoặc đã kết thúc.');
    case 'rate': return fail('RATE_LIMITED', 'Thao tác quá nhanh.');
    case 'network': return fail('NETWORK', 'Không kết nối được.');
    case 'server': return fail('SERVER', 'Lỗi máy chủ.');
    case 'validation':
      return { ok: false, error: { code: 'VALIDATION', message: 'Dữ liệu chưa hợp lệ.', fields: { phone: 'Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.' } } };
    default: {
      const code = 'AD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      return { ok: true, data: { code, token: 'mock-' + Math.random().toString(36).slice(2), mode: payload.mode, attemptNo: payload.mode === 'anon' ? null : 1, maxAttempts: 2, status: 'in_progress' } };
    }
  }
}

function fail(code, message, fields) {
  return { ok: false, error: { code, message, fields: fields || null } };
}

// Doc loi o dang { error:{ code, message, fields } } hoac dang thieu fields { code, message }.
export function readError(body, status) {
  const e = body && typeof body === 'object' ? (body.error && typeof body.error === 'object' ? body.error : body) : null;
  if (e && typeof e.code === 'string') {
    return { code: e.code, message: String(e.message ?? ''), fields: e.fields && typeof e.fields === 'object' ? e.fields : null };
  }
  return { code: status >= 500 ? 'SERVER' : 'UNKNOWN', message: '', fields: null };
}

// POST /api/v1/contest/entries (API-01).
export async function createEntry(payload) {
  const mode = mockMode();
  if (mode) return mockCreateEntry(payload, mode);
  let res;
  try {
    res = await fetch(ENTRIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return fail('NETWORK', 'Không kết nối được.');
  }
  let body = null;
  try { body = await res.json(); } catch (e) { /* than rong hoac khong phai JSON */ }
  if (res.ok && body && body.code && body.token) return { ok: true, data: body };
  return { ok: false, error: readError(body, res.status) };
}

// localStorage co the bi chan (che do rieng tu) nen moi thao tac bo try/catch.
export function saveEntry(data) {
  const entry = { code: data.code, token: data.token, mode: data.mode, attemptNo: data.attemptNo, maxAttempts: data.maxAttempts };
  try { localStorage.setItem(KEY_ENTRY, JSON.stringify(entry)); } catch (e) { /* bo qua */ }
  return entry;
}

export function loadEntry() {
  try {
    const raw = localStorage.getItem(KEY_ENTRY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Che do luyen tap khong goi API; chi tao khoa at_practice neu chua co, khong de len tien do cu.
export function markPractice() {
  try {
    if (localStorage.getItem(KEY_PRACTICE) === null) localStorage.setItem(KEY_PRACTICE, JSON.stringify({ mode: 'practice' }));
  } catch (e) { /* bo qua */ }
}
