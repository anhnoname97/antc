import { initMotion, markMotion } from './motion.js';

export function animateContestOverviews(page) {
  markMotion(page, '[data-overview-copy], .ticket', 'data-rv');
  markMotion(page, '.ticket', 'data-motion-tilt');
  markMotion(page, '.ticket ul', 'data-rvs');
  markMotion(page, '.tdrum', 'data-motion-rotate');
  for (const el of page.querySelectorAll('[data-overview-count]')) el.dataset.motionCount = el.dataset.overviewCount;
  initMotion(page);
}
