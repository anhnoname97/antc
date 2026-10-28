import { initMotion, markMotion } from './motion.js';

export function animateContestHeroes(page) {
  markMotion(page, '.ph', 'data-motion-hero');
  markMotion(page, '.ph-drum img, .ph-drum:not(:has(img))', 'data-motion-rotate');
  initMotion(page);
}
