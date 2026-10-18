// Lop trang thai cuoc thi (FE-28): luot thi, dap an, hang doi gui lai, khoi phuc tien do, che do luyen tap.
// May chu la nguon dung: init() goi API-02 va dung lai tien do. Che do luyen tap khong goi /api/v1/contest.
import {
  getMe, saveAnswer, attachContact as apiAttachContact, submitEntry as apiSubmitEntry,
  loadEntry, saveEntry, clearEntry, allEntries, markPractice, fetchTopics, fetchQuestions,
} from './contest-api.js';

const KEY_ENTRY = 'at_entry';
const KEY_PRACTICE = 'at_practice';
const KEY_QUEUE = 'at_queue';
const RETRY_MS = [2000, 5000, 15000]; // sau do giu 15s

// Ma loi gui lai khong bao gio thanh cong: bo muc khoi hang doi
const DROP_CODES = ['CONTEST_CLOSED', 'UNKNOWN_QUESTION', 'INVALID_OPTION'];

export const state = {
  practice: false, // dang o che do luyen tap (khong goi API)
  entry: null, // { code, token, mode, attemptNo, maxAttempts, contestId }
  contestId: null, // cuoc thi cua man hinh (null: luot cu khong co cuoc, hoac luyen tap); QUIZ goi kem ?contest= khi co
  contest: null, // tu API-02: { id, name, startAt, endAt, submitUntil, phase, readTimerFactor }
  topics: [], // tu API-02: de cua cuoc [{ cd, count }]
  status: 'in_progress', // in_progress | submitted
  synced: false, // da lay duoc tien do tu may chu (API-02) chua; false thi tu lay lai khi co mang
  total: null, // tong so cau tu API-02 (khong viet cung)
  score: null,
  submittedAt: null,
  fullName: null, // tu API-02, de hien o cot ben
  phoneMasked: null,
  result: null, // ket qua API-05 vua nhan duoc
  answers: new Map(), // ma cau -> { a, correct, cd, pending, stored }
  dropped: new Map(), // ma cau -> ma loi, cho nhung cau bi bo khoi hang doi
};

const listeners = new Map();

// Su kien: 'change' (tien do doi), 'token' (token khong hop le, da xoa luot), 'submitted' (may chu bao da nop), 'dropped' (mot cau bi bo),
// 'entry-changed' (at_entry doi sang luot khac o tab khac: man hinh goi lai init())
export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => listeners.get(name).delete(fn);
}

function emit(name, detail) {
  for (const fn of listeners.get(name) || []) {
    try { fn(detail); } catch (e) { /* loi cua nguoi nghe khong duoc lam hong hang doi */ }
  }
}

// localStorage co the bi chan nen moi thao tac bo try/catch. Giu them ban trong bo nho:
// khi localStorage loi thi van lam duoc trong phien (tai lai thi mat).
const mem = new Map();
let storageBroken = false;

function readJson(key, fallback) {
  if (!storageBroken) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      storageBroken = true;
    }
  }
  return mem.has(key) ? JSON.parse(mem.get(key)) : fallback;
}

function writeJson(key, value) {
  const raw = JSON.stringify(value);
  mem.set(key, raw);
  try { localStorage.setItem(key, raw); } catch (e) { storageBroken = true; }
}

function remove(key) {
  mem.delete(key);
  try { localStorage.removeItem(key); } catch (e) { /* bo qua */ }
}

// ---- Hang doi gui lai: [{ entry, q, a, cd }], moi muc ghi kem ma du thi ----

function readQueue() {
  const q = readJson(KEY_QUEUE, []);
  return Array.isArray(q) ? q : [];
}

function writeQueue(q) {
  if (q.length) writeJson(KEY_QUEUE, q);
  else remove(KEY_QUEUE);
}

function dequeue(item) {
  writeQueue(readQueue().filter((x) => !(x.entry === item.entry && x.q === item.q)));
}

function enqueue(item) {
  const q = readQueue();
  if (!q.some((x) => x.entry === item.entry && x.q === item.q)) q.push(item);
  writeQueue(q);
}

// Bo cac muc khong con thuoc luot nao dang luu (luot cu da bi thay); luot cua cac cuoc khac van giu
function pruneQueue() {
  const codes = new Set(allEntries().map((e) => e.code));
  const q = readQueue();
  const keep = q.filter((x) => codes.has(x.entry));
  if (keep.length !== q.length) writeQueue(keep);
}

// Bo cac muc hang doi cua mot luot (khong dung toi luot khac)
function dropEntryQueue(code) {
  writeQueue(readQueue().filter((x) => x.entry !== code));
}

export function pendingCount() {
  return state.entry ? readQueue().filter((x) => x.entry === state.entry.code).length : 0;
}

// ---- Dat/xoa phien ----

function resetState() {
  state.entry = null;
  state.contestId = null;
  state.contest = null;
  state.topics = [];
  state.status = 'in_progress';
  state.synced = false;
  state.total = null;
  state.score = null;
  state.submittedAt = null;
  state.fullName = null;
  state.phoneMasked = null;
  state.result = null;
  state.answers = new Map();
  state.dropped = new Map();
}

// Token khong hop le: xoa luot va hang doi (khong dung toi tien do luyen tap).
// Neu at_entry da doi sang luot khac o tab khac thi giu nguyen luot do; luot cua cuoc thi khac khong bi dung toi.
function clearSession() {
  const cid = state.entry ? state.entry.contestId ?? null : undefined;
  const cur = loadEntry(cid);
  const code = state.entry && state.entry.code;
  if (cur && state.entry && cur.token === state.entry.token) clearEntry(cid);
  if (code) writeQueue(readQueue().filter((x) => x.entry !== code));
  resetState();
  clearTimeout(retryTimer);
  attempt = 0;
  emit('token');
}

function syncEntry(patch) {
  const cur = state.entry ? loadEntry(state.entry.contestId ?? null) : null;
  // Chi cap nhat khi at_entry van la luot dang lam (tab khac co the da doi sang luot khac)
  if (!cur || cur.token !== state.entry.token) return;
  state.entry = saveEntry({ ...cur, ...patch });
}

// ---- Che do luyen tap: tien do o at_practice, khong lan voi luot thi ----

function loadPracticeAnswers() {
  const p = readJson(KEY_PRACTICE, null);
  const map = new Map();
  if (p && p.answers && typeof p.answers === 'object') {
    for (const [q, v] of Object.entries(p.answers)) map.set(q, v);
  }
  return map;
}

function savePracticeAnswers() {
  writeJson(KEY_PRACTICE, { mode: 'practice', answers: Object.fromEntries(state.answers) });
}

export function enterPractice() {
  markPractice();
  state.practice = true;
  state.contestId = null; // Thu suc dung ca ngan hang, khong loc theo cuoc
  state.answers = loadPracticeAnswers();
  emit('change');
}

// Roi che do luyen tap de ve luot thi: goi init() sau do de dung lai tien do
export function leavePractice() {
  state.practice = false;
}

// Lam lai tu dau trong luyen tap (cd: chi xoa dap an cua chuyen de do)
export function resetPractice(cd) {
  if (!state.practice) return;
  for (const [q, v] of [...state.answers]) if (cd === undefined || v.cd === String(cd)) state.answers.delete(q);
  savePracticeAnswers();
  emit('change');
}

// ---- Khoi tao / khoi phuc tien do ----

// contestId: cuoc thi cua man hinh (vd ?c=3); bo trong thi dung luot gan nhat. Moi cuoc co luot rieng.
// Tra ve { view: 'exam' | 'register', practice, offline?, error? }
// 'exam': co luot hop le (hoac chua xac minh duoc vi loi mang/may chu, offline=true).
// 'register': khong co luot (chua co, hoac token bi tu choi va da xoa).
export async function init(contestId) {
  resetState();
  state.practice = false;
  const entry = loadEntry(contestId == null ? undefined : contestId);
  if (!entry || !entry.token) {
    pruneQueue();
    state.contestId = contestId ?? null;
    state.practice = readJson(KEY_PRACTICE, null) !== null;
    if (state.practice) state.answers = loadPracticeAnswers();
    return { view: 'register', practice: state.practice };
  }
  pruneQueue();
  state.entry = entry;
  state.contestId = entry.contestId ?? null;
  const r = await getMe(entry.token);
  if (state.entry !== entry) return { view: 'register', practice: state.practice };
  if (!r.ok) {
    if (r.error.code === 'INVALID_TOKEN') {
      clearSession();
      state.practice = readJson(KEY_PRACTICE, null) !== null;
      if (state.practice) state.answers = loadPracticeAnswers();
      return { view: 'register', practice: state.practice };
    }
    // Mang/may chu loi: giu luot da luu, dung tien do tu hang doi; flush() se lay lai API-02 khi co mang
    overlayQueue();
    scheduleRetry(r.error.retryAfter);
    return { view: 'exam', practice: false, offline: true, error: r.error };
  }
  applyServer(r.data);
  overlayQueue();
  if (pendingCount()) flush();
  return { view: 'exam', practice: false, submitted: state.status === 'submitted' };
}

function applyServer(d) {
  state.synced = true;
  state.status = d.status;
  state.total = d.total;
  state.score = d.score;
  state.submittedAt = d.submittedAt;
  state.fullName = d.fullName || null;
  state.phoneMasked = d.phoneMasked || null;
  state.contest = d.contest || null;
  state.topics = Array.isArray(d.topics) ? d.topics.map((t) => ({ cd: String(t.cd), count: t.count })) : [];
  state.answers = new Map(d.answers.map((x) => [x.q, { a: x.a, correct: x.correct, cd: String(x.cd), pending: false, stored: true }]));
  syncEntry({ code: d.code, mode: d.mode, attemptNo: d.attemptNo, maxAttempts: d.maxAttempts });
  if (d.status === 'submitted') {
    dropEntryQueue(state.entry.code);
  } else {
    // May chu da giu cau nao thi khong gui lai cau do
    writeQueue(readQueue().filter((x) => !(x.entry === state.entry.code && state.answers.has(x.q))));
  }
}

// Dap an con trong hang doi hien nhu da tra loi (dang cho gui)
function overlayQueue() {
  for (const x of readQueue()) {
    if (x.entry === state.entry.code && !state.answers.has(x.q)) {
      state.answers.set(x.q, { a: x.a, correct: x.correct, cd: String(x.cd), pending: true, stored: false });
    }
  }
}

// ---- Tra loi mot cau ----

// Tra ve { ok:true, a, correct, stored, pending } hoac { ok:false, code } (cau bi bo khoi hang doi).
// pending=true: chua len may chu (mat mang...), se tu gui lai. stored=false: may chu dang giu dap an khac/cu hon, a la dap an cua may chu.
export async function answer(q, a, cd, correct) {
  const view = (v) => ({ ok: true, a: v.a, correct: v.correct, stored: v.stored, pending: v.pending });
  if (state.practice) {
    state.answers.set(q, { a, correct, cd: String(cd), pending: false, stored: true });
    savePracticeAnswers();
    emit('change');
    return view(state.answers.get(q));
  }
  if (!state.entry) return { ok: false, code: 'INVALID_TOKEN' };
  // Mot cau chi gui mot lan
  const had = state.answers.get(q);
  if (had) return view({ ...had, stored: false });
  state.answers.set(q, { a, correct, cd: String(cd), pending: true, stored: false });
  enqueue({ entry: state.entry.code, q, a, cd: String(cd), correct });
  emit('change');
  await flush();
  const v = state.answers.get(q);
  // Dong bo lai co the thay bang dap an may chu giu: khac dap an vua chon thi stored=false
  if (v) return view(v.a !== a ? { ...v, stored: false } : v);
  return { ok: false, code: state.dropped.get(q) || 'INVALID_TOKEN' };
}

// ---- Gui hang doi ----

let flushing = null;
let rerun = false;
let retryTimer = null;
let attempt = 0;

export function flush() {
  if (state.practice || !state.entry) return Promise.resolve();
  if (flushing) {
    rerun = true;
    return flushing;
  }
  flushing = (async () => {
    do {
      rerun = false;
      if (!state.synced && !(await resync())) return;
      await drain();
    } while (rerun);
  })().finally(() => { flushing = null; });
  return flushing;
}

// retryAfter (giay, tu Retry-After cua 429) neu co thi khong thu lai som hon
function scheduleRetry(retryAfter) {
  clearTimeout(retryTimer);
  const ms = Math.max(RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)], retryAfter ? retryAfter * 1000 : 0);
  retryTimer = setTimeout(flush, ms);
  attempt++;
}

// Chua lay duoc tien do tu may chu (init gap loi mang): lay lai API-02, dung lai tien do roi moi gui hang doi.
// Tra ve true neu da dong bo va con lam tiep duoc; false thi da hen thu lai, da xoa luot hoac da nop.
async function resync() {
  const entry = state.entry;
  const r = await getMe(entry.token);
  if (state.entry !== entry) return false;
  if (!r.ok) {
    if (r.error.code === 'INVALID_TOKEN') clearSession();
    else scheduleRetry(r.error.retryAfter);
    return false;
  }
  applyServer(r.data);
  overlayQueue();
  emit('change');
  if (state.status === 'submitted') emit('submitted');
  return state.status !== 'submitted';
}

function dropItem(item, code) {
  dequeue(item);
  state.answers.delete(item.q);
  state.dropped.set(item.q, code);
  emit('dropped', { q: item.q, code });
}

async function drain() {
  clearTimeout(retryTimer);
  const code = state.entry && state.entry.code;
  const token = state.entry && state.entry.token;
  for (const item of readQueue()) {
    if (!state.entry || state.entry.code !== code) return;
    if (item.entry !== code) continue; // muc cua luot khac: de nguyen, init() cua luot do hoac luot moi se don
    const r = await saveAnswer(item.q, item.a, token);
    if (state.entry === null || state.entry.code !== code) return;
    if (r.ok) {
      dequeue(item);
      // stored=false: dap an may chu dang giu moi la dap an hien thi
      state.answers.set(item.q, { a: r.data.a, correct: r.data.correct, cd: String(item.cd), pending: false, stored: r.data.stored });
      attempt = 0;
      continue;
    }
    const c = r.error.code;
    if (c === 'INVALID_TOKEN') {
      clearSession();
      return;
    }
    if (c === 'ALREADY_SUBMITTED') {
      for (const x of readQueue()) if (x.entry === code) dropItem(x, c);
      state.status = 'submitted';
      emit('submitted');
      break;
    }
    if (DROP_CODES.includes(c)) {
      dropItem(item, c);
      continue;
    }
    // NETWORK, SERVER, RATE_LIMITED va ma la: giu trong hang doi, gui lai sau
    scheduleRetry(r.error.retryAfter);
    break;
  }
  emit('change');
}

if (typeof window !== 'undefined') {
  // at_entry doi sang luot khac o tab khac: dung gui, bao man hinh dung lai bang init()
  window.addEventListener('storage', (ev) => {
    if (ev.key !== KEY_ENTRY || !state.entry || state.practice) return;
    const cur = loadEntry(state.entry.contestId ?? null);
    if (!cur || cur.token !== state.entry.token) {
      clearTimeout(retryTimer);
      emit('entry-changed', { code: cur ? cur.code : null });
    }
  });
  // Co mang tro lai: gui ngay, khong cho het chu ky
  window.addEventListener('online', () => {
    attempt = 0;
    flush();
  });
}

// ---- Gan thong tin va nop bai ----

function handleAuth(r) {
  if (!r.ok && r.error.code === 'INVALID_TOKEN') clearSession();
  return r;
}

// API-04: gan thong tin vao luot an danh
export async function attachContact(contact) {
  if (!state.entry) return { ok: false, error: { code: 'INVALID_TOKEN', message: '', fields: {} } };
  const r = handleAuth(await apiAttachContact(contact, state.entry.token));
  if (r.ok) syncEntry({ mode: r.data.mode, attemptNo: r.data.attemptNo, maxAttempts: r.data.maxAttempts });
  return r;
}

// API-05: gui het hang doi truoc; con muc chua gui thi khong nop (code QUEUE_PENDING)
export async function submit(contact) {
  await flush();
  if (!state.entry) return { ok: false, error: { code: 'INVALID_TOKEN', message: '', fields: {} } };
  if (pendingCount()) return { ok: false, error: { code: 'QUEUE_PENDING', message: 'Đang lưu đáp án, hãy thử lại sau.', fields: {} } };
  const entry = state.entry;
  const r = handleAuth(await apiSubmitEntry(contact, entry.token));
  if (r.ok) {
    state.status = 'submitted';
    state.result = r.data;
    state.score = r.data.score;
    state.total = r.data.total;
    state.submittedAt = r.data.submittedAt;
    dropEntryQueue(entry.code);
    syncEntry({ mode: r.data.mode });
    // Nop kem contact: API-05 khong tra attemptNo, lay lai tu API-02
    if (contact && entry.mode === 'anon') {
      const me = await getMe(entry.token);
      if (me.ok) syncEntry({ mode: me.data.mode, attemptNo: me.data.attemptNo, maxAttempts: me.data.maxAttempts });
    }
    emit('change');
  }
  return r;
}

// ---- Tien do ----

// Tien do theo chuyen de tu QUIZ-01 (topics = [{ cd, count }]): { cd, count, answered, done }
export function topicProgress(topics) {
  return topics.map((t) => {
    let answered = 0;
    for (const v of state.answers.values()) if (v.cd === String(t.cd)) answered++;
    return { cd: String(t.cd), count: t.count, answered, done: answered >= t.count };
  });
}

export function answeredCount() {
  return state.answers.size;
}

// Da tra loi du moi chuyen de (dap an dang cho gui van tinh)
export function allDone(topics) {
  return topics.length > 0 && topicProgress(topics).every((t) => t.done);
}

export function getAnswer(q) {
  return state.answers.get(q) || null;
}

// Ngan hang cau hoi tai theo nhu cau (QUIZ-01 khi vao trang, QUIZ-02 khi mo chuyen de)
// Mac dinh theo cuoc cua man hinh (state.contestId); truyen contestId de doc cuoc khac
export const loadTopics = (contestId) => fetchTopics(contestId === undefined ? state.contestId : contestId);
export const loadQuestions = (cd, contestId) => fetchQuestions(cd, contestId === undefined ? state.contestId : contestId);
