import { initMotion, markMotion } from './motion.js';

export function animateQaProcesses(page) {
  markMotion(page, '[data-process-reveal]', 'data-rv');
  markMotion(page, '.proc', 'data-motion-process');
  initMotion(page);
}
