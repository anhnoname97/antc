import { initMotion, markMotion } from './motion.js';

export function animateQaPublishedAnswers(page) {
  markMotion(page, '[data-published-reveal]', 'data-rv');
  markMotion(page, '[data-published-list]', 'data-rvs');
  initMotion(page);
}

// Enhance the server-rendered six-item pages without losing open answers.
export function initQaLoadMore(page) {
  for (const section of page.querySelectorAll('[data-qa-published]')) {
    const more = section.querySelector('[data-qa-more]');
    if (!more) continue;
    const list = section.querySelector('[data-published-list]');
    const status = section.querySelector('[data-qa-more-status]');
    let pending = false;
    more.addEventListener('click', async event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (pending) return;
      pending = true; more.setAttribute('aria-disabled', 'true'); more.textContent = 'Đang tải…'; status.textContent = '';
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(more.href, { credentials: 'same-origin', headers: { Accept: 'text/html' }, signal: controller.signal });
        if (!response.ok) throw new Error('LOAD_FAILED');
        const document = new DOMParser().parseFromString(await response.text(), 'text/html');
        const nextSection = document.querySelector('[data-qa-published]');
        const items = nextSection?.querySelectorAll('[data-published-list] > details');
        if (!items?.length) throw new Error('EMPTY_RESPONSE');
        const existing = new Set([...list.children].map(item => item.dataset.questionId));
        const added = [];
        for (const item of items) {
          if (existing.has(item.dataset.questionId)) continue;
          const copy = window.document.importNode(item, true);
          copy.open = false; list.append(copy); added.push(copy);
        }
        const next = nextSection.querySelector('[data-qa-more]');
        if (next) more.href = next.getAttribute('href');
        else more.hidden = true;
        status.textContent = `Đã hiển thị ${list.children.length} câu hỏi${next ? '.' : '. Đã xem hết câu hỏi công khai.'}`;
        // Preserve keyboard focus even when the final load removes the control.
        added[0]?.querySelector('summary')?.focus({ preventScroll: true });
      } catch {
        status.textContent = 'Chưa tải được câu hỏi. Bạn có thể bấm Xem thêm để thử lại.';
      } finally {
        clearTimeout(timer); pending = false; more.removeAttribute('aria-disabled'); more.textContent = 'Xem thêm';
      }
    });
  }
}
