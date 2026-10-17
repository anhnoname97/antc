// Thanh phan trac nghiem dung chung (FE-23): Thu suc (FE-24) va cuoc thi (FE-26/27/29) cung dung.
// Chi dung chuoi HTML, khong giu trang thai. Moi chuoi du lieu deu qua esc().
// Cau co dang { q, opt: [[chu cai, noi dung], ...], ans, exp: { chu cai: giai thich }, sit, safe } (DTO QUIZ-02).

export const ID_QUESTION = 'qq';   // tieu de cau hoi, nhan focus khi doi cau
export const ID_RESULT = 'qhead';  // dong "Dung./Chua dung.", nhan focus sau khi chon

const ICO_OK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const ICO_NO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

// Dong "CAU 1 / 8" kem o vuong do; text la chuoi thuan.
export function eyebrowHtml(text) {
  return `<p class="qeyebrow"><span class="qeyebrow__sq"></span>${esc(text)}</p>`;
}

// Thanh tien do. label doc cho trinh doc man hinh.
export function progressHtml(value, max, label) {
  const m = Math.max(1, Number(max) || 1);
  const v = Math.min(m, Math.max(0, Number(value) || 0));
  return `<progress class="qbar" max="${m}" value="${v}" aria-label="${esc(label || 'Tiến độ')}"></progress>`;
}

// Khoi "Tinh huong"; chuoi rong thi khong ve gi.
export function situationHtml(sit) {
  if (!sit) return '';
  return `<div class="qsit"><b>Tình huống</b>${esc(sit)}</div>`;
}

// Tieu de cau hoi (nhan focus bang focusQuestion).
export function questionHtml(text) {
  return `<h2 id="${ID_QUESTION}" class="qtitle" tabindex="-1">${esc(text)}</h2>`;
}

// Cac dap an. chosen = chu cai da chon hoac null/undefined; da chon thi khoa het nut.
// Cau 2 dap an (Dung-Sai) them lop qopts--duo de hien gon thanh hang ngang.
export function optionsHtml(q, chosen, labelledBy = ID_QUESTION) {
  const answered = chosen != null && chosen !== '';
  const opts = Array.isArray(q.opt) ? q.opt : [];
  const buttons = opts.map(([k, text]) => {
    let cls = 'qopt';
    let mark = '';
    if (answered) {
      if (k === q.ans) { cls += ' right'; mark = `<span class="qmark qmark--ok">${ICO_OK}Đáp án phù hợp</span>`; }
      else if (k === chosen) { cls += ' wrong'; mark = `<span class="qmark qmark--no">${ICO_NO}Bạn chọn</span>`; }
      else cls += ' dim';
    }
    return `<button type="button" class="${cls}" data-k="${esc(k)}"${answered ? ' disabled' : ''}><span class="ql">${esc(k)}</span><span class="qt">${esc(text)}</span>${mark}</button>`;
  }).join('');
  const duo = opts.length === 2 ? ' qopts--duo' : '';
  return `<div class="qopts${duo}" role="group" aria-labelledby="${esc(labelledBy)}">${buttons}</div>`;
}

// Khoi ket qua sau khi chon: dong dung/sai, giai thich tung dap an, hanh dong an toan.
// Luon tra ve vung aria-live; thay noi dung vung nay khi chon xong de trinh doc doc ra.
export function resultHtml(q, chosen) {
  const answered = chosen != null && chosen !== '';
  if (!answered) return '<div class="qlive" aria-live="polite"></div>';
  const ok = chosen === q.ans;
  const opts = Array.isArray(q.opt) ? q.opt : [];
  const exp = opts.map(([k]) => {
    const t = q.exp ? q.exp[k] : '';
    return `<p${k === q.ans ? ' class="isans"' : ''}><b>${esc(k)}.</b> ${esc(t)}</p>`;
  }).join('');
  const safe = q.safe
    ? `<div class="qsafe"><b><span class="qeyebrow__sq"></span>Hành động an toàn</b>${esc(q.safe)}</div>`
    : '';
  return `<div class="qlive" aria-live="polite"><div class="qresult">` +
    `<p id="${ID_RESULT}" class="qresult__head" tabindex="-1"><b class="${ok ? 'qok' : 'qno'}">${ok ? 'Đúng.' : 'Chưa đúng.'}</b> Đáp án phù hợp là <b>${esc(q.ans)}</b>.</p>` +
    `<div class="qexp">${exp}</div>${safe}</div></div>`;
}

// Nut dieu huong. kind: 'o' (vien) hoac 'f' (dac). attrs: { 'data-go': 'sum' }.
export function navButtonHtml(label, kind = 'f', attrs = {}) {
  const a = Object.entries(attrs).map(([k, v]) => ` ${esc(k)}="${esc(v)}"`).join('');
  return `<button type="button" class="qnav ${kind === 'o' ? 'o' : 'f'}"${a}>${esc(label)}</button>`;
}

// Luoi o so cau. states[i] la 'ok' | 'no' | ''; current la chi so dang xem (hoac -1).
export function dotsHtml(states, current) {
  return states.map((st, i) => {
    const note = st === 'ok' ? ', đã trả lời đúng' : st === 'no' ? ', chưa đúng' : '';
    return `<button type="button" class="qdot ${st || ''}" data-i="${i}" aria-current="${i === current}" aria-label="Câu ${i + 1}${note}">${i + 1}</button>`;
  }).join('');
}

// Dong tong ket mot cau trong danh sach ket qua. state: 'ok' | 'no' | ''.
export function rowHtml(index, q, state, extra = {}) {
  const tag = state === 'ok' ? `<span class="qmark qmark--ok">${ICO_OK}Đúng</span>`
    : state === 'no' ? `<span class="qmark qmark--no">${ICO_NO}Chưa đúng</span>`
      : '<span class="qmark qmark--idle">Chưa làm</span>';
  const meta = extra.meta ? `<span class="qrow__meta">${esc(extra.meta)}</span>` : '';
  return `<button type="button" class="qrow" data-go="${esc(index)}"><span class="qrow__n">${index + 1}</span>` +
    `<span class="qrow__body">${meta}<span class="qrow__q">${esc(q.q)}</span></span>${tag}</button>`;
}

// Chuyen focus sau khi gan innerHTML.
export function focusResult(root = document) {
  const el = root.querySelector(`#${ID_RESULT}`);
  if (el) el.focus({ preventScroll: true });
  return !!el;
}
export function focusQuestion(root = document) {
  const el = root.querySelector(`#${ID_QUESTION}`);
  if (el) el.focus({ preventScroll: true });
  return !!el;
}
