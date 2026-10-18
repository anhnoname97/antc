// Lop goi API cuoc thi (FE-28): lich cuoc thi (API-07), tao luot thi (API-01), lay lai luot (API-02), luu dap an (API-03),
// gan thong tin (API-04), nop bai (API-05); luu at_entry theo cuoc thi, danh dau luyen tap; doc ngan hang QUIZ-01/02 (kem ?contest=).
// Moi ham tra { ok:true, data } hoac { ok:false, error:{ code, message, fields } }.
// Mock (chi localhost, ?mock=...) dung "may chu gia" trong localStorage (khoa at_mock), xem cuoi file.

const ENTRIES_URL = '/api/v1/contest/entries';
const KEY_ENTRY = 'at_entry';
const KEY_PRACTICE = 'at_practice';
const KEY_MOCK = 'at_mock';
const ME_URL = '/api/v1/contest/entries/me';
const QUIZ_URL = '/api/v1/quiz/topics';
const CONTESTS_URL = '/api/v1/contests';
const TIMEOUT_MS = 15000;

// Mac dinh dung API that. ?mock=ok|limit|closed|rate|network|server|validation chi co tac dung
// khi chay tren localhost/127.0.0.1, de nguoi dung that khong the bat mock bang URL.
// Che do ep loi cho API-02..05: network|server|token|closed|submitted|rate|named|limit|validation|incomplete.
// ?mock=notfound: API-01 tra CONTEST_NOT_FOUND, API-07 tra ba mang rong. ?mock=closed: API-07 coi moi cuoc dang dien ra la da ket thuc.
// ?mock=one: API-07 chi con mot cuoc dang dien ra (mac dinh co hai; ?mock=closed hoac notfound: khong cuoc nao dang dien ra).
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
    case 'limit': return fail('ATTEMPT_LIMIT', 'Đã hết lượt thi của cuộc thi này.');
    case 'closed': return fail('CONTEST_CLOSED', 'Cuộc thi chưa mở hoặc đã kết thúc.');
    case 'notfound': return fail('CONTEST_NOT_FOUND', 'Không tìm thấy cuộc thi.');
    case 'rate': return fail('RATE_LIMITED', 'Thao tác quá nhanh.');
    case 'network': return fail('NETWORK', 'Không kết nối được.');
    case 'server': return fail('SERVER', 'Lỗi máy chủ.');
    case 'validation':
      return { ok: false, error: { code: 'VALIDATION', message: 'Dữ liệu chưa hợp lệ.', fields: { phone: 'Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.' } } };
    default: {
      // Nhu may chu that (API-01 muc 1): contestId bat buoc, so nguyen duong
      const given = payload.contestId;
      if (!(Number.isInteger(given) && given > 0)) {
        return fail('VALIDATION', 'Dữ liệu chưa hợp lệ.', { contestId: 'Mã cuộc thi chưa đúng.' });
      }
      const cs = await mockContests();
      if (!cs.ok) return cs;
      const c = cs.data.find((x) => x.id === given);
      if (!c) return fail('CONTEST_NOT_FOUND', 'Không tìm thấy cuộc thi.');
      if (mockPhase(c) !== 'open') return fail('CONTEST_CLOSED', 'Cuộc thi chưa mở hoặc đã kết thúc.');
      let attemptNo = null;
      if (payload.mode !== 'anon') {
        const used = Object.values(mockDb().entries).filter((e) => e.contestId === c.id && e.phone && e.phone === payload.phone).length;
        if (used >= c.maxAttempts) return fail('ATTEMPT_LIMIT', `Số ${payload.phone} đã dùng hết ${c.maxAttempts} lượt của cuộc thi này.`);
        attemptNo = used + 1;
      }
      const code = 'AD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const data = { code, token: 'mock-' + Math.random().toString(36).slice(2), mode: payload.mode, contestId: c.id, attemptNo, maxAttempts: c.maxAttempts, status: 'in_progress' };
      await mockRegister(data, payload, mode === 'almost');
      return { ok: true, data };
    }
  }
}

function fail(code, message, fields) {
  return { ok: false, error: { code, message, fields: fields || {} } };
}

// Doc loi o dang { error:{ code, message, fields } } hoac dang thieu fields { code, message }.
export function readError(body, status) {
  const e = body && typeof body === 'object' ? (body.error && typeof body.error === 'object' ? body.error : body) : null;
  if (e && typeof e.code === 'string') {
    return { code: e.code, message: String(e.message ?? ''), fields: e.fields && typeof e.fields === 'object' ? e.fields : {} };
  }
  return { code: status >= 500 ? 'SERVER' : 'UNKNOWN', message: '', fields: {} };
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

// at_entry = { v: 2, last, entries: { "<contestId>": { code, token, mode, attemptNo, maxAttempts, contestId } } }:
// moi cuoc thi mot luot, luot cuoc khac khong ghi de. Luot cu (khong co contestId, dang phang) doc thanh khoa "0".
// localStorage co the bi chan nen moi thao tac bo try/catch.
// Ban trong bo nho giu luot thi khi localStorage loi: van lam duoc trong phien, tai lai thi mat (QD-007).
let memStore = null;
let entryStorageBroken = false;

const entryKey = (contestId) => String(contestId === undefined || contestId === null ? 0 : contestId);

function normalizeStore(raw) {
  if (raw && raw.v === 2 && raw.entries && typeof raw.entries === 'object') return raw;
  if (raw && raw.token) {
    const e = { ...raw, contestId: raw.contestId ?? null };
    return { v: 2, last: entryKey(e.contestId), entries: { [entryKey(e.contestId)]: e } };
  }
  return { v: 2, last: null, entries: {} };
}

function readEntryStore() {
  if (!entryStorageBroken) {
    try {
      const raw = localStorage.getItem(KEY_ENTRY);
      return normalizeStore(raw ? JSON.parse(raw) : null);
    } catch (e) {
      entryStorageBroken = true;
    }
  }
  return memStore || normalizeStore(null);
}

function writeEntryStore(st) {
  memStore = st;
  try {
    if (Object.keys(st.entries).length) localStorage.setItem(KEY_ENTRY, JSON.stringify(st));
    else localStorage.removeItem(KEY_ENTRY);
  } catch (e) { entryStorageBroken = true; }
}

export function saveEntry(data) {
  const entry = {
    code: data.code, token: data.token, mode: data.mode, attemptNo: data.attemptNo, maxAttempts: data.maxAttempts,
    contestId: data.contestId ?? null,
  };
  const st = readEntryStore();
  const key = entryKey(entry.contestId);
  st.entries[key] = entry;
  st.last = key;
  writeEntryStore(st);
  return entry;
}

// contestId bo trong (undefined): luot dung gan nhat; null: luot cu khong thuoc cuoc nao.
export function loadEntry(contestId) {
  const st = readEntryStore();
  const key = contestId === undefined ? st.last : entryKey(contestId);
  return (key !== null && st.entries[key]) || null;
}

// Moi luot dang luu (moi cuoc mot luot), de don hang doi gui lai
export function allEntries() {
  return Object.values(readEntryStore().entries);
}

// Xoa luot thi cua mot cuoc (bo trong: luot gan nhat), khong dung toi luot cuoc khac
export function clearEntry(contestId) {
  const st = readEntryStore();
  const key = contestId === undefined ? st.last : entryKey(contestId);
  if (key === null) return;
  delete st.entries[key];
  if (st.last === key) st.last = Object.keys(st.entries)[0] ?? null;
  writeEntryStore(st);
}

// Che do luyen tap khong goi API; chi tao khoa at_practice neu chua co, khong de len tien do cu.
export function markPractice() {
  try {
    if (localStorage.getItem(KEY_PRACTICE) === null) localStorage.setItem(KEY_PRACTICE, JSON.stringify({ mode: 'practice' }));
  } catch (e) { /* bo qua */ }
}

// ---------------------------------------------------------------------------------------------
// Ngan hang cau hoi (QUIZ-01, QUIZ-02): tai theo nhu cau, giu tam trong bo nho.

const topicsCache = new Map();
const questionsCache = new Map();
const contestQuery = (contestId) => (contestId === undefined || contestId === null ? '' : `?contest=${encodeURIComponent(contestId)}`);

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

// API-07: lich cuoc thi { serverTime, ongoing, upcoming, ended }; client khong cache (may chu da cache 60 giay)
export async function getSchedule() {
  const mode = mockMode();
  if (mode) return mockSchedule(mode);
  return getJson(CONTESTS_URL);
}

// QUIZ-01: [{ cd, title, count, intro, terms }]; co contestId thi chi chuyen de cua de cuoc thi do
export async function fetchTopics(contestId) {
  const key = String(contestId ?? '');
  if (topicsCache.has(key)) return { ok: true, data: topicsCache.get(key) };
  const r = mockMode() && contestId != null ? await mockTopics(contestId) : await getJson(QUIZ_URL + contestQuery(contestId));
  if (r.ok) topicsCache.set(key, r.data);
  return r;
}

// QUIZ-02: cau hoi cua chuyen de cd (chuoi hoac so); co contestId thi chi cau cua de cuoc thi do.
export async function fetchQuestions(cd, contestId) {
  const key = `${contestId ?? ''}/${cd}`;
  if (questionsCache.has(key)) return { ok: true, data: questionsCache.get(key) };
  const r = mockMode() && contestId != null
    ? await mockQuestions(cd, contestId)
    : await getJson(`${QUIZ_URL}/${encodeURIComponent(String(cd))}/questions${contestQuery(contestId)}`);
  if (r.ok) questionsCache.set(key, r.data);
  return r;
}

// ---------------------------------------------------------------------------------------------
// API-02..05 (deu can X-Entry-Token lay tu at_entry).

// token: store truyen token cua luot dang lam, de dap an khong bi ghi vao luot khac khi at_entry doi o tab khac.
// Khong truyen thi lay tu at_entry.
async function callMe(method, path, payload, token) {
  const mode = mockMode();
  const tk = token || (loadEntry() || {}).token;
  if (mode) return mockMe(path, payload, mode, tk);
  if (!tk) return fail('INVALID_TOKEN', 'Chưa có lượt thi.');
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  let res;
  try {
    res = await fetch(ME_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Entry-Token': tk },
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
  if (err.code === 'RATE_LIMITED') {
    const sec = Number(res.headers && res.headers.get('Retry-After'));
    if (sec > 0) err.retryAfter = sec;
  }
  return { ok: false, error: err };
}

// API-02 GET /entries/me
export const getMe = (token) => callMe('GET', '', undefined, token);
// API-03 POST /entries/me/answers
export const saveAnswer = (q, a, token) => callMe('POST', '/answers', { q, a }, token);
// API-04 PUT /entries/me/contact
export const attachContact = (contact, token) => callMe('PUT', '/contact', contact, token);
// API-05 POST /entries/me/submit; contact co the bo trong (than rong)
export const submitEntry = (contact, token) => callMe('POST', '/submit', contact ? { contact } : {}, token);

// ---------------------------------------------------------------------------------------------
// Mock cho API-02..05: "may chu gia" trong localStorage, cham diem theo QUIZ-02 that.

const MSG_CLOSED = 'Cuộc thi chưa mở hoặc đã kết thúc.';
const MSG_SUBMITTED = 'Bạn đã nộp bài.';
const MSG_PHONE = 'Số điện thoại chưa đúng. Nhập số bạn đang dùng, chỉ gồm chữ số.';

// May chu gia giu them ban trong bo nho de van chay khi localStorage bi chan
let mockMem = null;
let mockBroken = false;

function mockDb() {
  if (!mockBroken) {
    try {
      const db = JSON.parse(localStorage.getItem(KEY_MOCK));
      if (db && db.entries) return db;
    } catch (e) { mockBroken = true; }
  }
  if (mockBroken && mockMem) return mockMem;
  return { entries: {}, log: [] };
}

function mockSave(db) {
  if (db.log.length > 300) db.log = db.log.slice(-300);
  mockMem = db;
  try { localStorage.setItem(KEY_MOCK, JSON.stringify(db)); } catch (e) { mockBroken = true; }
}

// Cuoc thi gia (API-07 / QUIZ ?contest=): 1 va 2 dang dien ra (nua dau, nua sau cac chuyen de), 3 sap toi, 4 da ket thuc.
// Moc thoi gian tinh tu luc tai trang; de cuoc dung thang chuyen de that cua QUIZ-01 nen mock khong can du lieu rieng.
const DAY = 86400000;
let mockContestCache = null;

function isoZ(ms) {
  return new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
}

async function mockContests() {
  if (mockContestCache) return { ok: true, data: mockContestCache };
  const t = await fetchTopics();
  if (!t.ok) return t;
  const all = t.data.map((x) => ({ cd: String(x.cd), title: x.title, count: x.count }));
  const half = Math.ceil(all.length / 2);
  const now = Date.now();
  const make = (id, name, topics, startAt, endAt, maxAttempts, focusArea) => ({
    id, name, description: `Mô tả cuộc thi “${name}”.`, startAt: isoZ(startAt), endAt: isoZ(endAt), submitUntil: isoZ(endAt + DAY),
    maxAttempts, questionCount: topics.reduce((n, x) => n + x.count, 0), topics, focusArea,
  });
  mockContestCache = [
    make(1, 'Cuộc thi mẫu 1', all.slice(0, half), now - 10 * DAY, now + 20 * DAY, 2, 'vieclam'),
    make(2, 'Cuộc thi mẫu 2', all.slice(half), now - 3 * DAY, now + 30 * DAY, 3, null),
    make(3, 'Cuộc thi sắp tới', all.slice(0, 1), now + 10 * DAY, now + 40 * DAY, 2, null),
    make(4, 'Cuộc thi đã kết thúc', all.slice(0, 1), now - 60 * DAY, now - 30 * DAY, 2, null),
  ];
  return { ok: true, data: mockContestCache };
}

// open | submit_only | closed | upcoming (upcoming chi dung trong mock; may chu that coi la CONTEST_CLOSED)
function mockPhase(c, mode) {
  if (mode === 'closed') return 'closed';
  const now = Date.now();
  if (now < Date.parse(c.startAt)) return 'upcoming';
  if (now <= Date.parse(c.endAt)) return 'open';
  return now <= Date.parse(c.submitUntil) ? 'submit_only' : 'closed';
}

async function mockSchedule(mode) {
  await delay(300);
  if (mode === 'network') return fail('NETWORK', 'Không kết nối được.');
  if (mode === 'server') return fail('SERVER', 'Lỗi máy chủ.');
  const out = { serverTime: isoZ(Date.now()), ongoing: [], upcoming: [], ended: [] };
  if (mode === 'notfound') return { ok: true, data: out };
  const cs = await mockContests();
  if (!cs.ok) return cs;
  for (const c of cs.data) {
    const ph = mode === 'closed' && mockPhase(c) === 'open' ? 'closed' : mockPhase(c);
    if (ph === 'open' || ph === 'submit_only') out.ongoing.push(c);
    else if (ph === 'upcoming') out.upcoming.push(c);
    else out.ended.push(c);
  }
  out.ongoing.sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
  if (mode === 'one') out.ongoing.splice(1);
  out.upcoming.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  out.ended.sort((a, b) => Date.parse(b.endAt) - Date.parse(a.endAt));
  return { ok: true, data: out };
}

// Cuoc cho QUIZ mock: khong co -> CONTEST_NOT_FOUND, sap toi -> CONTEST_CLOSED (khong lo de truoc gio mo)
async function mockQuizContest(contestId) {
  const cs = await mockContests();
  if (!cs.ok) return cs;
  const c = cs.data.find((x) => x.id === Number(contestId));
  if (!c) return fail('CONTEST_NOT_FOUND', 'Không tìm thấy cuộc thi.');
  if (mockPhase(c) === 'upcoming') return fail('CONTEST_CLOSED', 'Cuộc thi chưa mở.');
  return { ok: true, data: c };
}

async function mockTopics(contestId) {
  const c = await mockQuizContest(contestId);
  if (!c.ok) return c;
  const t = await fetchTopics();
  if (!t.ok) return t;
  const keep = new Set(c.data.topics.map((x) => x.cd));
  return { ok: true, data: t.data.filter((x) => keep.has(String(x.cd))) };
}

async function mockQuestions(cd, contestId) {
  const c = await mockQuizContest(contestId);
  if (!c.ok) return c;
  if (!c.data.topics.some((x) => x.cd === String(cd))) return fail('UNKNOWN_TOPIC', 'Chuyên đề không thuộc cuộc thi.');
  return fetchQuestions(cd);
}

// Chi muc ngan hang cua mot de (contestId bo trong: ca ngan hang): ma cau -> { cd, ans, letters }, cung danh sach chuyen de va tong so cau.
const bankIndexCache = new Map();
async function bankIndex(contestId) {
  const ckey = String(contestId ?? '');
  if (bankIndexCache.has(ckey)) return bankIndexCache.get(ckey);
  const t = await fetchTopics(contestId);
  if (!t.ok) return t;
  const map = new Map();
  const order = [];
  for (const topic of t.data) {
    const r = await fetchQuestions(topic.cd, contestId);
    if (!r.ok) return r;
    r.data.forEach((q) => {
      map.set(q.code, { cd: String(topic.cd), ans: q.ans, letters: q.opt.map((o) => o[0]) });
      order.push(q.code);
    });
  }
  const idx = { ok: true, data: { map, order, topics: t.data, total: order.length } };
  bankIndexCache.set(ckey, idx);
  return idx;
}

// Dang ky luot moi vao may chu gia; che do almost nap san dap an (tru cau cuoi, dung sai xen ke).
async function mockRegister(data, payload, almost) {
  const db = mockDb();
  const rec = {
    code: data.code, mode: data.mode, contestId: data.contestId, fullName: payload.fullName || null, phone: payload.phone || null, org: payload.org || null,
    attemptNo: data.attemptNo, maxAttempts: data.maxAttempts, status: 'in_progress', score: null, submittedAt: null, answers: [],
  };
  if (almost) {
    const b = await bankIndex(data.contestId);
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

async function mockMe(path, payload, mode, token) {
  await delay(300);
  const db = mockDb();
  db.log.push({ t: Date.now(), kind: path === '' ? 'me' : path.slice(1), q: payload && payload.q });
  mockSave(db);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return fail('NETWORK', 'Không kết nối được.');
  if (mode === 'network') return fail('NETWORK', 'Không kết nối được.');
  if (mode === 'server') return fail('SERVER', 'Lỗi máy chủ.');
  if (mode === 'rate') return fail('RATE_LIMITED', 'Thao tác quá nhanh.');
  const rec = token && db.entries[token];
  if (mode === 'token' || !rec) return fail('INVALID_TOKEN', 'Lượt thi không hợp lệ hoặc đã hết hạn.');
  // Luot cu khong co contestId: ca ngan hang, khong co thong tin cuoc
  const cs = rec.contestId != null ? await mockContests() : null;
  if (cs && !cs.ok) return cs;
  const contest = cs ? cs.data.find((x) => x.id === rec.contestId) || null : null;
  const b = await bankIndex(rec.contestId);
  if (!b.ok) return b;
  const bank = b.data;
  const phase = contest ? mockPhase(contest, mode) : mode === 'closed' ? 'closed' : 'open';
  const closed = phase !== 'open';
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
    const used = Object.values(db.entries).filter((e) => e !== rec && e.phone === phone && e.contestId === rec.contestId).length;
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
        contest: contest
          ? { id: contest.id, name: contest.name, startAt: contest.startAt, endAt: contest.endAt, submitUntil: contest.submitUntil, phase, readTimerFactor: 1 }
          : null,
        topics: bank.topics.map((t) => ({ cd: String(t.cd), count: t.count })),
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
    if (phase === 'closed') return fail('CONTEST_CLOSED', MSG_CLOSED);
    // Phai tra loi du moi cau dang dung (QD-015); cau da ngung dung khong tinh
    const answered = rec.answers.filter((x) => bank.map.has(x.q)).length;
    if (mode === 'incomplete' || answered < bank.total) {
      return fail('INCOMPLETE_ANSWERS', `Bạn mới trả lời ${answered}/${bank.total} câu. Hãy trả lời hết các câu rồi nộp bài.`);
    }
    if (payload && payload.contact && rec.mode === 'anon') {
      const bad = takeContact(payload.contact);
      if (bad) return bad;
    }
    rec.status = 'submitted';
    rec.score = rec.answers.filter((x) => x.correct).length;
    rec.submittedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    mockSave(db);
    return { ok: true, data: resultView() };
  }
  return fail('UNKNOWN', '');
}
