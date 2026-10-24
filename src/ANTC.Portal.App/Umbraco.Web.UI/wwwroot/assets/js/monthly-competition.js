import { initMotion, markMotion } from './motion.js';
import { initReferencePage } from './reference-page.js';
import { animateContestHeroes } from './contest-hero.js';
import { initCompetitionResults } from './competition-results.js';
const page = document.querySelector('#nj-cuoc-thi-thang');
if (page) {
  initReferencePage(page);
  initCompetitionResults(page);
  animateContestHeroes(page);
  markMotion(page, '[data-participation-reveal], [data-prize-reveal], [data-schedule-reveal], [data-results-reveal], [data-faq-reveal]', 'data-rv');
  markMotion(page, '.prizes, .faq, .how, .next', 'data-rvs');
  markMotion(page, '.medal', 'data-motion-medal');
  markMotion(page, '.sched', 'data-motion-schedule');
  markMotion(page, '.safe ul', 'data-rvs');
  markMotion(page, '.safe ul', 'data-motion-once');
  for (const sched of page.querySelectorAll('.sched-scroll')) {
    const cards = [...sched.querySelectorAll('.mo')];
    const anchor = Math.max(0, cards.findIndex(card => card.matches('.now, .soon')));
    // Bắt đầu tại biên một nhóm thẻ để không cắt hai mục ngoài mép.
    const alignInitial = () => {
      const visible = Number(getComputedStyle(sched).getPropertyValue('--schedule-visible')) || 6;
      const first = cards[Math.floor(anchor / visible) * visible];
      if (first) sched.scrollLeft = first.offsetLeft;
    };
    alignInitial();
    let width = sched.clientWidth;
    new ResizeObserver(() => {
      if (sched.clientWidth !== width) {
        width = sched.clientWidth;
        alignInitial();
      }
    }).observe(sched);

    // Touch/trackpad dùng cuộn gốc; chuột có thể nhấn giữ và kéo.
    let drag = null;
    let suppressClick = false;
    sched.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, left: sched.scrollLeft, moved: false };
      suppressClick = false;
    });
    sched.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 5) return;
      drag.moved = true;
      suppressClick = true;
      sched.classList.add('is-dragging');
      if (!sched.hasPointerCapture(event.pointerId)) sched.setPointerCapture(event.pointerId);
      event.preventDefault();
      sched.scrollLeft = drag.left - dx;
    });
    const finishDrag = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const id = drag.id;
      drag = null;
      sched.classList.remove('is-dragging');
      if (sched.hasPointerCapture(id)) sched.releasePointerCapture(id);
    };
    sched.addEventListener('pointerup', finishDrag);
    sched.addEventListener('pointercancel', finishDrag);
    sched.addEventListener('lostpointercapture', finishDrag);
    sched.addEventListener('dragstart', event => event.preventDefault());
    sched.addEventListener('click', event => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
  }
  initMotion(page);
}
