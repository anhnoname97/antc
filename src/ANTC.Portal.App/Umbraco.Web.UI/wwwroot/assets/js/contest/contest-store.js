// Lop trang thai cuoc thi (FE-28): luot thi, dap an, hang doi gui lai, khoi phuc tien do, che do luyen tap.
// May chu la nguon dung: init() goi API-02 va dung lai tien do. Che do luyen tap khong goi /api/v1/contest.
import {
  getMe, saveAnswer, attachContact as apiAttachContact, submitEntry as apiSubmitEntry,
  loadEntry, saveEntry, markPractice, fetchTopics, fetchQuestions,
} from './contest-api.js';

const KEY_ENTRY = 'at_entry';
const KEY_PRACTICE = 'at_practice';
const KEY_QUEUE = 'at_queue';
const RETRY_MS = [2000, 5000, 15000]; // sau do giu 15s

// Ma loi gui lai khong bao gio thanh cong: bo muc khoi hang doi
const DROP_CODES = ['CONTEST_CLOSED', 'UNKNOWN_QUESTION', 'INVALID_OPTION'];

export const state = {
  practice: false, // dang o che do luyen tap (khong goi API)
  entry: null, // { code, token, mode, attemptNo, maxAttempts }
  status: 'in_progress', // in_progress | submitted
  total: null, // tong so cau tu API-02 (khong viet cung)
  score: null,
  submittedAt: null,
  result: null, // ket qua API-05 vua nhan duoc
  answers: new Map(), // ma cau -> { a, correct, cd, pending, stored }
  dropped: new Map(), // ma cau -> ma loi, cho nhung cau bi bo khoi hang doi
};

const listeners = new Map();

// Su kien: 'change' (tien do doi), 'token' (token khong hop le, da xoa luot), 'submitted' (may chu bao da nop), 'dropped' (mot cau bi bo)
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

// localStorage co the bi chan nen moi thao tac bo try/catch.
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* bo qua */ }
}

function remove(key) {
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

// Bo cac muc cua luot khac (khong gui dap an luot cu bang token luot moi)
function pruneQueue(code) {
  const q = readQueue();
  const keep = q.filter((x) => x.entry === code);
  if (keep.length !== q.length) writeQueue(keep);
}

export function pendingCount() {
  return state.entry ? readQueue().filter((x) => x.entry === state.entry.code).length : 0;
}

// ---- Dat/xoa phien ----

function resetState() {
  state.entry = null;
  state.status = 'in_progress';
  state.total = null;
  state.score = null;
  state.submittedAt = null;
  state.result = null;
  state.answers = new Map();
  state.dropped = new Map();
}

// Token khong hop le: xoa luot va hang doi (khong dung toi tien do luyen tap)
function clearSession() {
  remove(KEY_ENTRY);
  remove(KEY_QUEUE);
  resetState();
  clearTimeout(retryTimer);
  attempt = 0;
  emit('token');
}

function syncEntry(patch) {
  const cur = loadEntry();
  if (!cur) return;
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

// Tra ve { view: 'exam' | 'register', practice, offline?, error? }
// 'exam': co luot hop le (hoac chua xac minh duoc vi loi mang/may chu, offline=true).
// 'register': khong co luot (chua co, hoac token bi tu choi va da xoa).
export async function init() {
  resetState();
  state.practice = false;
  const entry = loadEntry();
  if (!entry || !entry.token) {
    remove(KEY_QUEUE);
    state.practice = readJson(KEY_PRACTICE, null) !== null;
    if (state.practice) state.answers = loadPracticeAnswers();
    return { view: 'register', practice: state.practice };
  }
  pruneQueue(entry.code);
  state.entry = entry;
  const r = await getMe();
  if (!r.ok) {
    if (r.error.code === 'INVALID_TOKEN') {
      clearSession();
      state.practice = readJson(KEY_PRACTICE, null) !== null;
      if (state.practice) state.answers = loadPracticeAnswers();
      return { view: 'register', practice: state.practice };
    }
    // Mang/may chu loi: giu luot da luu, dung tien do tu hang doi, thu gui lai sau
    overlayQueue();
    scheduleRetry();
    return { view: 'exam', practice: false, offline: true, error: r.error };
  }
  applyServer(r.data);
  overlayQueue();
  if (pendingCount()) flush();
  return { view: 'exam', practice: false, submitted: state.status === 'submitted' };
}

function applyServer(d) {
  state.status = d.status;
  state.total = d.total;
  state.score = d.score;
  state.submittedAt = d.submittedAt;
  state.answers = new Map(d.answers.map((x) => [x.q, { a: x.a, correct: x.correct, cd: String(x.cd), pending: false, stored: true }]));
  syncEntry({ code: d.code, mode: d.mode, attemptNo: d.attemptNo, maxAttempts: d.maxAttempts });
  if (d.status === 'submitted') {
    remove(KEY_QUEUE);
  } else {
    // May chu da giu cau nao thi khong gui lai cau do
    writeQueue(readQueue().filter((x) => !state.answers.has(x.q)));
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
  if (v) return view(v);
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
      await drain();
    } while (rerun);
  })().finally(() => { flushing = null; });
  return flushing;
}

function scheduleRetry() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(flush, RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)]);
  attempt++;
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
  for (const item of readQueue()) {
    if (!state.entry || state.entry.code !== code) return;
    if (item.entry !== code) {
      dequeue(item);
      continue;
    }
    const r = await saveAnswer(item.q, item.a);
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
      for (const x of readQueue()) dropItem(x, c);
      state.status = 'submitted';
      emit('submitted');
      break;
    }
    if (DROP_CODES.includes(c)) {
      dropItem(item, c);
      continue;
    }
    // NETWORK, SERVER, RATE_LIMITED va ma la: giu trong hang doi, gui lai sau
    scheduleRetry();
    break;
  }
  emit('change');
}

if (typeof window !== 'undefined') {
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
  const r = handleAuth(await apiAttachContact(contact));
  if (r.ok) syncEntry({ mode: r.data.mode, attemptNo: r.data.attemptNo, maxAttempts: r.data.maxAttempts });
  return r;
}

// API-05: gui het hang doi truoc; con muc chua gui thi khong nop (code QUEUE_PENDING)
export async function submit(contact) {
  await flush();
  if (pendingCount()) return { ok: false, error: { code: 'QUEUE_PENDING', message: 'Đang lưu đáp án, hãy thử lại sau.', fields: null } };
  const r = handleAuth(await apiSubmitEntry(contact));
  if (r.ok) {
    state.status = 'submitted';
    state.result = r.data;
    state.score = r.data.score;
    state.total = r.data.total;
    state.submittedAt = r.data.submittedAt;
    remove(KEY_QUEUE);
    syncEntry({ mode: r.data.mode });
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
export const loadTopics = fetchTopics;
export const loadQuestions = fetchQuestions;
