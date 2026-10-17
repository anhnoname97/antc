// Lop goi API cuoc thi (FE-28): tao luot thi (API-01), lay lai luot (API-02), luu dap an (API-03),
// gan thong tin (API-04), nop bai (API-05); luu at_entry, danh dau luyen tap; doc ngan hang QUIZ-01/02.
// Moi ham tra { ok:true, data } hoac { ok:false, error:{ code, message, fields } }.
// Mock (chi localhost, ?mock=...) dung "may chu gia" trong localStorage (khoa at_mock), xem cuoi file.

const ENTRIES_URL = '/api/v1/contest/entries';
const KEY_ENTRY = 'at_entry';
const KEY_PRACTICE = 'at_practice';
const KEY_MOCK = 'at_mock';
const ME_URL = '/api/v1/contest/entries/me';
const QUIZ_URL = '/api/v1/quiz/topics';
const TIMEOUT_MS = 15000;

// Mac dinh dung API that. ?mock=ok|limit|closed|rate|network|server|validation chi co tac dung
// khi chay tren localhost/127.0.0.1, de nguoi dung that khong the bat mock bang URL.
// Che do ep loi cho API-02..05: network|server|token|closed|submitted|rate|named|limit|validation|incomplete.
// ?mock=almost: dung nhu ok nhung luot moi tao da co san dap an moi cau tru cau cuoi cua chuyen de cuoi.
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
      const data = { code, token: 'mock-' + Math.random().toString(36).slice(2), mode: payload.mode, attemptNo: payload.mode === 'anon' ? null : 1, maxAttempts: 2, status: 'in_progress' };
      await mockRegister(data, payload, mode === 'almost');
      return { ok: true, data };
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

// ---------------------------------------------------------------------------------------------
// Ngan hang cau hoi (QUIZ-01, QUIZ-02): tai theo nhu cau, giu tam trong bo nho.

let topicsCache = null;
const questionsCache = new Map();

async function getJson(url) {
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (e) {
    return fail('NETWORK', 'Không kết nối được.');
  }
  let body = null;
  try { body = await res.json(); } catch (e) { /* bo qua */ }
  if (res.ok && body) return { ok: true, data: body };
  return { ok: false, error: readError(body, res.status) };
}

// QUIZ-01: [{ cd, title, count, intro, terms }]
export async function fetchTopics() {
  if (topicsCache) return { ok: true, data: topicsCache };
  const r = await getJson(QUIZ_URL);
  if (r.ok) topicsCache = r.data;
  return r;
}

// QUIZ-02: cau hoi cua chuyen de cd (chuoi hoac so).
export async function fetchQuestions(cd) {
  const key = String(cd);
  if (questionsCache.has(key)) return { ok: true, data: questionsCache.get(key) };
  const r = await getJson(`${QUIZ_URL}/${encodeURIComponent(key)}/questions`);
  if (r.ok) questionsCache.set(key, r.data);
  return r;
}

// ---------------------------------------------------------------------------------------------
// API-02..05 (deu can X-Entry-Token lay tu at_entry).

async function callMe(method, path, payload) {
  const mode = mockMode();
  if (mode) return mockMe(path, payload, mode);
  const entry = loadEntry();
  if (!entry || !entry.token) return fail('INVALID_TOKEN', 'Chưa có lượt thi.');
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  let res;
  try {
    res = await fetch(ME_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Entry-Token': entry.token },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: ctl ? ctl.signal : undefined,
    });
  } catch (e) {
    return fail('NETWORK', 'Không kết nối được.');
  } finally {
    if (timer) clearTimeout(timer);
  }
  let body = null;
  try { body = await res.json(); } catch (e) { /* than rong hoac khong phai JSON */ }
  if (res.ok && body && typeof body === 'object') return { ok: true, data: body };
  const err = readError(body, res.status);
  if (err.code === 'UNKNOWN') {
    // May chu khong tra than loi dang chuan: suy ra tu ma HTTP
    if (res.status === 401) err.code = 'INVALID_TOKEN';
    else if (res.status === 429) err.code = 'RATE_LIMITED';
  }
  return { ok: false, error: err };
}

// API-02 GET /entries/me
export const getMe = () => callMe('GET', '');
// API-03 POST /entries/me/answers
export const saveAnswer = (q, a) => callMe('POST', '/answers', { q, a });
// API-04 PUT /entries/me/contact
export const attachContact = (contact) => callMe('PUT', '/contact', contact);
// API-05 POST /entries/me/submit; contact co the bo trong (than rong)
export const submitEntry = (contact) => callMe('POST', '/submit', contact ? { contact } : {});

// ---------------------------------------------------------------------------------------------
// Mock cho API-02..05: "may chu gia" trong localStorage, cham diem theo QUIZ-02 that.

const MSG_CLOSED = 'Cuộc thi chưa mở hoặc đã kết thúc.';
const MSG_SUBMITTED = 'Bạn đã nộp bài.';
const MSG_PHONE = 'Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.';

function mockDb() {
  try {
    const db = JSON.parse(localStorage.getItem(KEY_MOCK));
    if (db && db.entries) return db;
  } catch (e) { /* bo qua */ }
  return { entries: {}, log: [] };
}

function mockSave(db) {
  if (db.log.length > 300) db.log = db.log.slice(-300);
  try { localStorage.setItem(KEY_MOCK, JSON.stringify(db)); } catch (e) { /* bo qua */ }
}

// Chi muc ngan hang: ma cau -> { cd, ans, letters }, cung danh sach chuyen de va tong so cau.
let bankIndexCache = null;
async function bankIndex() {
  if (bankIndexCache) return bankIndexCache;
  const t = await fetchTopics();
  if (!t.ok) return t;
  const map = new Map();
  const order = [];
  for (const topic of t.data) {
    const r = await fetchQuestions(topic.cd);
    if (!r.ok) return r;
    r.data.forEach((q) => {
      map.set(q.code, { cd: String(topic.cd), ans: q.ans, letters: q.opt.map((o) => o[0]) });
      order.push(q.code);
    });
  }
  bankIndexCache = { ok: true, data: { map, order, topics: t.data, total: order.length } };
  return bankIndexCache;
}

// Dang ky luot moi vao may chu gia; che do almost nap san dap an (tru cau cuoi, dung sai xen ke).
async function mockRegister(data, payload, almost) {
  const db = mockDb();
  const rec = {
    code: data.code, mode: data.mode, fullName: payload.fullName || null, phone: payload.phone || null, org: payload.org || null,
    attemptNo: data.attemptNo, maxAttempts: data.maxAttempts, status: 'in_progress', score: null, submittedAt: null, answers: [],
  };
  if (almost) {
    const b = await bankIndex();
    if (b.ok) {
      b.data.order.slice(0, -1).forEach((code, i) => {
        const k = b.data.map.get(code);
        const a = i % 3 === 2 ? k.letters.find((l) => l !== k.ans) : k.ans;
        rec.answers.push({ q: code, a, correct: a === k.ans, cd: k.cd });
      });
    }
  }
  db.entries[data.token] = rec;
  mockSave(db);
}

function maskPhone(p) {
  return p && p.length >= 6 ? p.slice(0, 3) + '****' + p.slice(-3) : null;
}

function byTopic(rec, bank) {
  return bank.topics.map((t) => ({
    cd: String(t.cd),
    correct: rec.answers.filter((x) => x.cd === String(t.cd) && x.correct).length,
    count: t.count,
  }));
}

async function mockMe(path, payload, mode) {
  await delay(300);
  const entry = loadEntry();
  const db = mockDb();
  db.log.push({ t: Date.now(), kind: path === '' ? 'me' : path.slice(1), q: payload && payload.q });
  mockSave(db);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return fail('NETWORK', 'Không kết nối được.');
  if (mode === 'network') return fail('NETWORK', 'Không kết nối được.');
  if (mode === 'server') return fail('SERVER', 'Lỗi máy chủ.');
  if (mode === 'rate') return fail('RATE_LIMITED', 'Thao tác quá nhanh.');
  const rec = entry && db.entries[entry.token];
  if (mode === 'token' || !rec) return fail('INVALID_TOKEN', 'Lượt thi không hợp lệ hoặc đã hết hạn.');
  const b = await bankIndex();
  if (!b.ok) return b;
  const bank = b.data;
  const closed = mode === 'closed';
  const submittedNow = rec.status === 'submitted' || mode === 'submitted';

  const resultView = () => ({
    status: 'submitted', code: rec.code, mode: rec.mode, score: rec.score, answered: rec.answers.length, total: bank.total,
    eligibleForPrize: !!rec.phone, submittedAt: rec.submittedAt, byTopic: byTopic(rec, bank),
  });

  // Kiem tra va gan thong tin lien he, dung chung cho API-04 va API-05
  const takeContact = (c) => {
    if (mode === 'validation') return fail('VALIDATION', 'Dữ liệu chưa hợp lệ.', { phone: MSG_PHONE });
    const fields = {};
    const phone = String((c && c.phone) || '').replace(/[\s.\-]/g, '');
    if (!c || String(c.fullName || '').trim().length < 2) fields.fullName = 'Hãy nhập họ và tên.';
    if (!/^0\d{9}$/.test(phone)) fields.phone = MSG_PHONE;
    if (!c || c.consent !== true) fields.consent = 'Cần đồng ý để nhận thông tin liên hệ.';
    if (Object.keys(fields).length) return fail('VALIDATION', 'Dữ liệu chưa hợp lệ.', fields);
    const used = Object.values(db.entries).filter((e) => e !== rec && e.phone === phone).length;
    if (mode === 'limit' || used >= rec.maxAttempts) return fail('ATTEMPT_LIMIT', `Số ${phone} đã dùng hết ${rec.maxAttempts} lượt thi.`);
    rec.mode = 'named';
    rec.fullName = String(c.fullName).trim();
    rec.phone = phone;
    rec.org = c.org ? String(c.org).trim() : null;
    rec.attemptNo = used + 1;
    return null;
  };

  if (path === '') {
    const submitted = rec.status === 'submitted';
    return {
      ok: true,
      data: {
        code: rec.code, mode: rec.mode, fullName: rec.fullName, phoneMasked: maskPhone(rec.phone), org: rec.org,
        attemptNo: rec.mode === 'anon' ? null : rec.attemptNo, maxAttempts: rec.maxAttempts, status: rec.status,
        answered: rec.answers.length, score: submitted ? rec.score : null, total: bank.total, submittedAt: rec.submittedAt,
        answers: rec.answers.map((x) => ({ q: x.q, a: x.a, correct: x.correct, cd: x.cd })),
      },
    };
  }

  if (path === '/answers') {
    if (submittedNow) return fail('ALREADY_SUBMITTED', MSG_SUBMITTED);
    if (closed) return fail('CONTEST_CLOSED', MSG_CLOSED);
    const key = payload && bank.map.get(payload.q);
    if (!key) return fail('UNKNOWN_QUESTION', 'Câu hỏi không tồn tại.');
    if (!payload.a || !key.letters.includes(payload.a)) return fail('INVALID_OPTION', 'Đáp án không hợp lệ.');
    const had = rec.answers.find((x) => x.q === payload.q);
    if (had) return { ok: true, data: { q: had.q, a: had.a, correct: had.correct, stored: false } };
    const row = { q: payload.q, a: payload.a, correct: payload.a === key.ans, cd: key.cd };
    rec.answers.push(row);
    mockSave(db);
    return { ok: true, data: { q: row.q, a: row.a, correct: row.correct, stored: true } };
  }

  if (path === '/contact') {
    if (submittedNow) return fail('ALREADY_SUBMITTED', MSG_SUBMITTED);
    if (rec.mode === 'named' || mode === 'named') return fail('ALREADY_NAMED', 'Lượt này đã có thông tin dự thi.');
    if (closed) return fail('CONTEST_CLOSED', MSG_CLOSED);
    const bad = takeContact(payload);
    if (bad) return bad;
    mockSave(db);
    return { ok: true, data: { mode: 'named', attemptNo: rec.attemptNo, maxAttempts: rec.maxAttempts } };
  }

  if (path === '/submit') {
    if (rec.status === 'submitted') return { ok: true, data: resultView() };
    if (closed) return fail('CONTEST_CLOSED', MSG_CLOSED);
    // Phai tra loi du moi cau dang dung (QD-015); cau da ngung dung khong tinh
    const answered = rec.answers.filter((x) => bank.map.has(x.q)).length;
    if (mode === 'incomplete' || answered < bank.total) {
      return fail('INCOMPLETE_ANSWERS', `Bạn mới trả lời ${answered}/${bank.total} câu. Hãy trả lời hết các câu rồi nộp bài.`);
    }
    if (payload && payload.contact && rec.mode === 'anon') {
      const bad = takeContact(payload.contact);
      if (bad) return bad;
    } else if (mode === 'limit') {
      return fail('ATTEMPT_LIMIT', 'Số điện thoại đã dùng hết lượt thi.');
    }
    rec.status = 'submitted';
    rec.score = rec.answers.filter((x) => x.correct).length;
    rec.submittedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    mockSave(db);
    return { ok: true, data: resultView() };
  }
  return fail('UNKNOWN', '');
}
