import { initMotion, markMotion } from './motion.js';

export function animateContestCommunity(page) {
  markMotion(page, '.contest-half .fbk, .contest-half .share', 'data-rv');
  markMotion(page, '.next', 'data-rvs');
  markMotion(page, '.fam', 'data-rvs');
  markMotion(page, '.next-drum img, .next-drum:not(:has(img))', 'data-motion-rotate');
  initMotion(page);
}
