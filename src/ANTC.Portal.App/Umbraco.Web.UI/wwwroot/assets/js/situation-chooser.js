import { computeSituation, searchSituations } from './situation-engine.js';

const page = document.querySelector('[data-situation-chooser]');
if (page) {
  const data = JSON.parse(page.querySelector('[data-situation-data]').textContent);
  const body = page.querySelector('[data-situation-body]');
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const arrow = '<span aria-hidden="true">›</span>';
  const local = url => typeof url === 'string' && /^\/(?!\/)/.test(url) && !/[\\\u0000-\u001f]/.test(url);
  const link = (url, text, description = '') => local(url) ? `<a class="situation-link" href="${escape(url)}"><span><b>${escape(text)}</b>${description ? `<small>${escape(description)}</small>` : ''}</span>${arrow}</a>` : '';
  const state = { step: 0, id: null, selected: [], query: '' };
  const validCodes = new Set(['none', 'unk', ...data.consequences.map(c => c.code)]);
  let result = null, timer, printClosed = null;
  function preparePrint() {
    if (state.step !== 2 || printClosed !== null) return;
    printClosed = [...body.querySelectorAll('details:not([open])')];
    printClosed.forEach(x => { x.open = true; });
  }
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', () => { printClosed?.forEach(x => { x.open = false; }); printClosed = null; });
  const button = (action, label, value = '', css = '') => `<button type="button" data-action="${action}" data-value="${escape(value)}" class="situation-button ${css}">${escape(label)}</button>`;
  const choose = situation => `<li><button type="button" class="situation-option" data-action="pick" data-value="${escape(situation.id)}"><span class="situation-dot situation-dot--${escape(situation.level)}" aria-hidden="true"></span><span>${escape(situation.title)}</span>${arrow}</button></li>`;
  const alternatives = () => `<section class="situation-section"><h2>Không thấy chuyện giống mình?</h2><p>Không thấy không có nghĩa là an toàn. Chọn một trong các lối dưới đây.</p>${data.alternatives.map(a => link(a.url, a.title, a.description)).join('')}</section>`;
  const principles = () => `<section class="situation-section"><h2>Trong lúc chưa rõ, nhớ bốn điều</h2><ul class="situation-principles">${data.principles.map(p => `<li><b>${escape(p.title)}</b><p>${escape(p.description)}</p></li>`).join('')}</ul></section>`;
  function searchHTML() {
    if (!state.query) return '';
    // Names, account details and phone numbers are neither needed nor transmitted.
    if (/\d{5,}/.test(state.query)) return '<p class="situation-message" role="status">Chỉ gõ vài chữ về tình huống. Đừng nhập số điện thoại, số tài khoản hoặc thông tin riêng.</p>';
    const found = searchSituations(data.situations, state.query);
    return found.length ? `<p>${found.length} chuyện gần giống:</p><ul class="situation-list">${found.map(choose).join('')}</ul>`
      : '<p class="situation-message">Chưa thấy chuyện nào giống. Thử từ khác hoặc mở các nhóm bên dưới. Không thấy không có nghĩa là an toàn.</p>';
  }
  function pickHTML() {
    return `<section class="situation-section"><h2>Gõ vài chữ về chuyện bạn gặp</h2><label for="situation-query">Tìm chuyện giống với bạn</label><input type="search" id="situation-query" maxlength="160" placeholder="Ví dụ: công an gọi, đọc mã OTP, việc làm trên mạng" value="${escape(state.query)}" autocomplete="off" enterkeyhint="search"><div data-search-results aria-live="polite">${searchHTML()}</div></section>
      <section class="situation-section"><h2>Hoặc chọn theo nhóm</h2><div class="situation-groups">${data.groups.map(group => {
        const items = data.situations.filter(s => s.group === group.id);
        return `<details><summary><span><b>${escape(group.title)}</b><small>${items.length} tình huống</small></span>${arrow}</summary><ul class="situation-list">${items.map(choose).join('')}</ul></details>`;
      }).join('')}</div></section>${alternatives()}${principles()}`;
  }
  function choicesHTML() {
    const situation = data.situations.find(s => s.id === state.id);
    const options = [{ code: 'none', title: 'Không có việc nào trong các dòng dưới đây. Tôi chỉ gặp đúng chuyện đã chọn ở trên' }, ...data.consequences, { code: 'unk', title: 'Tôi không nhớ rõ mình đã làm gì' }];
    return `<div class="situation-picked"><small>Chuyện gần giống</small><p>${escape(situation.title)}</p>${button('change', '‹ Chọn chuyện khác')}</div><section class="situation-section"><h2 tabindex="-1">Đến lúc này, chuyện gì đã xảy ra?</h2><p>Có thể chọn nhiều dòng. Hãy kiểm tra cả dòng được đánh dấu sẵn. Không có dòng nào đúng thì chọn dòng đầu tiên.</p>
      <fieldset class="situation-choices"><legend class="sr-only">Chuyện đã xảy ra</legend>${options.map(o => `<label><input type="checkbox" data-choice="${escape(o.code)}" ${state.selected.includes(o.code) ? 'checked' : ''}><span>${escape(o.title)}</span></label>`).join('')}</fieldset>
      <p class="situation-error" data-choice-error role="alert" hidden>Chọn một dòng, hoặc chọn “Tôi không nhớ rõ mình đã làm gì”.</p><div class="situation-actions">${button('change', 'Quay lại')}${button('result', 'Xem việc nên làm ›', '', 'situation-button--primary')}</div></section>`;
  }
  const critical = /thiết bị khác|An toàn của bạn|ĐỪNG CHỜ|Không chờ ngân hàng|Không dùng lại máy|Không phải nơi thu hồi|nói với người đó trước|người bị hại|ngừng liên lạc trước|Chưa tự khôi phục|làm sạch máy|làm giả được/;
  const bankHTML = () => `<aside class="situation-bank"><b>Cách tự tìm số ngân hàng của bạn</b><ol>${data.bankSteps.map(s => `<li>${escape(s)}</li>`).join('')}</ol></aside>`;
  function detailsHTML(step, first) {
    const visible = (step.details || []).filter(t => first || critical.test(t)), more = (step.details || []).filter(t => !first && !critical.test(t));
    const paras = list => list.map(t => `<p>${escape(t)}</p>`).join('');
    return `${paras(visible)}${step.note ? `<p class="situation-message">${escape(step.note)}</p>` : ''}${step.bank ? bankHTML() : ''}${step.say ? `<blockquote><b>Nói với tổng đài</b><p>${escape(step.say)}</p></blockquote>` : ''}${(step.links || []).filter(l => /^(tel|sms):[0-9]{3,15}$/.test(l.url)).map(l => `<a class="situation-button" href="${escape(l.url)}">${escape(l.label)}</a>`).join('')}${more.length ? `<details class="situation-explanation"><summary>Vì sao, làm thế nào</summary>${paras(more)}</details>` : ''}`;
  }
  function resultHTML() {
    result = computeSituation(data, state.id, state.selected);
    if (!result || result.unavailable) return `<section class="situation-section"><h2 tabindex="-1">Hướng dẫn đang được cập nhật</h2><p>Một bước nguồn chưa sẵn sàng. Hãy mở trang Khẩn cấp để xem việc cần làm ngay.</p>${link('/khan-cap/#viec-can-lam', 'Xem việc cần làm ngay')}${button('edit', 'Sửa điều đã làm')}</section>`;
    const s = result.situation, first = result.steps[0];
    const label = { d: 'DỪNG', h: 'HOÃN VÀ KIỂM CHỨNG', n: 'CHƯA PHÁT HIỆN ĐIỂM DỪNG' }[result.level];
    const guideLinks = [...new Map(result.steps.filter(s => s.url).map(s => [s.url, s])).values()];
    return `<div class="situation-result"><div class="situation-picked"><small>Tình huống gần giống</small><p>${escape(s.title)}</p><small>Đây là ví dụ để bạn đối chiếu, không phải kết luận về việc bạn đang gặp.</small></div>
      <section class="situation-first" tabindex="-1"><h2>1. Việc nên làm trước tiên</h2><p><b>${escape(first.text)}</b></p>${detailsHTML(first, true)}</section>
      <section class="situation-level situation-level--${escape(result.level)}"><h2>${escape(label)}</h2><p>${escape(s.why)}</p>${s.signs.length ? `<ul>${s.signs.map(t => `<li>${escape(t)}</li>`).join('')}</ul>` : ''}${result.level === 'n' ? '<p>Không thấy dấu hiệu nào không có nghĩa là an toàn. Vẫn tự kiểm tra bằng kênh do chính bạn tìm ra trước khi đưa tiền hay thông tin.</p>' : ''}</section>
      ${result.unknown ? `<p class="situation-message">${escape(data.unknownText)}</p>` : ''}
      ${result.steps.length > 1 ? `<section class="situation-section"><h2>Tiếp theo, theo thứ tự</h2><ol class="situation-steps" start="2">${result.steps.slice(1).map((step, i) => `<li><b>${escape(step.text)}</b>${detailsHTML(step, false)}</li>`).join('')}</ol>${guideLinks.length ? `<p>Các bước trên lấy từ trang việc cần làm. Mở đủ các bước:</p>${guideLinks.map(g => link(g.url, g.title)).join('')}` : ''}</section>` : ''}
      ${s.avoidActions.length ? `<section class="situation-section"><h2>Đừng làm</h2><ul class="situation-avoid">${s.avoidActions.map(t => `<li>${escape(t)}</li>`).join('')}</ul></section>` : ''}
      ${result.consequences.some(c => ['money', 'app', 'otp'].includes(c.code)) ? `<aside class="situation-recovery"><h2>${escape(data.recoveryTitle)}</h2><p>${escape(data.recoveryText)}</p></aside>` : ''}
      ${s.bankCheck || s.check ? `<section class="situation-section"><h2>Tự kiểm chứng thế nào</h2>${s.bankCheck ? bankHTML() : `<p><b>${escape(s.check.text)}</b></p>${s.check.details.map(t => `<p>${escape(t)}</p>`).join('')}${link(s.check.url, 'Mở hướng dẫn đầy đủ')}`}</section>` : ''}
      ${!result.consequences.length ? `<section class="situation-section"><h2>Nếu bạn đã lỡ làm theo</h2>${data.alternatives.map(a => link(a.url, a.title, a.description)).join('')}</section>` : ''}
      ${s.reading ? `<section class="situation-section"><h2>Đọc thêm khi đã bình tĩnh</h2>${link(s.reading.url, s.reading.title)}</section>` : ''}
      <div class="situation-actions situation-controls">${button('print', 'In hoặc lưu PDF')}${button('share', 'Gửi cho người thân')}${button('edit', 'Sửa điều đã làm')}${button('again', 'Chọn chuyện khác')}</div><p role="status" data-share-status></p><div data-share-fallback hidden><label for="situation-share-text">Sao chép nội dung gửi cho người thân</label><textarea id="situation-share-text" readonly rows="8"></textarea></div>
      <p class="situation-notes">${escape(data.resultNote)}</p><p class="situation-notes">${escape(data.notConclusionNote)}</p></div>`;
  }
  function paint(focus = true) {
    body.innerHTML = state.step === 0 ? pickHTML() : state.step === 1 ? choicesHTML() : resultHTML();
    if (focus) {
      const target = body.querySelector(state.step === 2 ? '.situation-first, h2' : state.step === 1 ? 'h2' : '#situation-query');
      if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start' }); }
    }
  }
  page.addEventListener('input', event => {
    if (event.target.id !== 'situation-query') return;
    clearTimeout(timer); state.query = event.target.value.trim();
    timer = setTimeout(() => { const results = body.querySelector('[data-search-results]'); if (results) results.innerHTML = searchHTML(); }, 160);
  });
  page.addEventListener('change', event => {
    const code = event.target.dataset.choice; if (!validCodes.has(code)) return;
    if (event.target.checked) state.selected = code === 'none' ? ['none'] : [...state.selected.filter(c => c !== 'none'), code];
    else state.selected = state.selected.filter(c => c !== code);
    body.querySelectorAll('[data-choice]').forEach(input => { input.checked = state.selected.includes(input.dataset.choice); });
    body.querySelector('[data-choice-error]').hidden = true;
  });
  page.addEventListener('click', async event => {
    const target = event.target.closest('[data-action]'); if (!target) return;
    const action = target.dataset.action;
    if (action === 'pick') {
      const s = data.situations.find(s => s.id === target.dataset.value); if (!s) return;
      state.id = s.id; state.selected = s.preselected.filter(c => validCodes.has(c)); state.step = 1; paint();
    } else if (action === 'result') {
      if (!state.selected.length) { const error = body.querySelector('[data-choice-error]'); error.hidden = false; error.scrollIntoView({ block: 'nearest' }); return; }
      state.step = 2; paint();
    } else if (action === 'change' || action === 'again') {
      state.step = 0; state.id = null; state.selected = []; if (action === 'again') state.query = ''; paint();
    } else if (action === 'edit') { state.step = 1; paint(); }
    else if (action === 'print') {
      preparePrint(); window.print();
    } else if (action === 'share' && result && !result.unavailable) {
      // Sharing is explicit. Choosing answers never writes history, localStorage, cookies or the network.
      const url = new URL(location.pathname, location.origin); url.hash = new URLSearchParams({ s: state.id, done: state.selected.join(',') }).toString();
      const text = `${result.situation.title}\n${result.consequences.length ? result.consequences.map(c => c.title).join('; ') : result.unknown ? 'Không nhớ rõ đã làm gì' : 'Không có việc nào trong danh sách'}\nLàm theo thứ tự:\n${result.steps.map((s, i) => `${i + 1}) ${s.text}${s.details?.length ? '\n' + s.details.join('\n') : ''}`).join('\n')}\n${data.resultNote}\n${url.href}`;
      try { await navigator.clipboard.writeText(text); body.querySelector('[data-share-status]').textContent = 'Đã sao chép hướng dẫn và đường dẫn để gửi cho người thân.'; }
      catch { body.querySelector('[data-share-fallback]').hidden = false; const field = body.querySelector('#situation-share-text'); field.value = text; field.focus(); field.select(); }
    }
  });
  function restoreHash() {
    const params = new URLSearchParams(location.hash.slice(1)), id = params.get('s');
    const selected = (params.get('done') || '').split(',').filter(c => validCodes.has(c));
    if (data.situations.some(s => s.id === id)) { state.id = id; state.selected = selected.includes('none') ? ['none'] : [...new Set(selected)]; state.step = state.selected.length ? 2 : 1; }
    else { state.id = null; state.selected = []; state.step = 0; }
    paint(false);
  }
  window.addEventListener('hashchange', restoreHash); restoreHash();
}
