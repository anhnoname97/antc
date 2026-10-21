export function animateQaPublishedAnswers(page) {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  for (const section of page.querySelectorAll('[data-qa-published]')) {
    const media = gsap.matchMedia(section);
    media.add('(prefers-reduced-motion: no-preference)', () => {
      for (const element of section.querySelectorAll('[data-published-reveal]')) {
        gsap.fromTo(element, { autoAlpha: 0, y: 40 }, {
          autoAlpha: 1, y: 0, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 94%', end: 'top 70%', scrub: .6 }
        });
      }
      const list = section.querySelector('[data-published-list]');
      if (list) {
        gsap.fromTo([...list.children], { autoAlpha: 0, y: 50, scale: .96 }, {
          autoAlpha: 1, y: 0, scale: 1, stagger: .15, ease: 'power2.out',
          scrollTrigger: { trigger: list, start: 'top 90%', end: 'top 50%', scrub: .6 }
        });
      }
      const revealFocus = event => {
        const item = event.target.closest('details');
        if (item) gsap.to(item, { autoAlpha: 1, y: 0, scale: 1, duration: 0, overwrite: true });
      };
      section.addEventListener('focusin', revealFocus);
      return () => section.removeEventListener('focusin', revealFocus);
    });
  }
  ScrollTrigger.sort(); ScrollTrigger.refresh();
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
