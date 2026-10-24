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
  // Lich dai: cuon ngang de cuoc dang dien ra (hoac sap toi) nam giua khung nhin.
  for (const sched of page.querySelectorAll('.sched-scroll')) {
    const target = sched.querySelector('.mo.now') || sched.querySelector('.mo.soon');
    if (target) sched.scrollLeft = Math.max(0, target.offsetLeft - (sched.clientWidth - target.offsetWidth) / 2);
  }
  initMotion(page);
}
