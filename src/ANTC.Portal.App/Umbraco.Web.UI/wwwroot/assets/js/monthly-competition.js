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
  initMotion(page);
}
