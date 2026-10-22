import { initMotion, markMotion } from './motion.js';
const page = document.getElementById('nj-thu-doan');
const form = page?.querySelector('[data-fraud-search]');
const searchInput = form?.querySelector('input[type="search"]');
const searchFeedback = page?.querySelector('[data-fraud-search-feedback]');
// Valid queries use the native GET form, including when JavaScript is disabled.
searchInput?.addEventListener('input', () => { if (searchFeedback) searchFeedback.hidden = true; });
form?.addEventListener('submit', event => {
  const value = searchInput.value.trim();
  if (/\d[\d\s.()+-]{3,}\d/.test(value) || /\d{4,}/.test(value)) {
    event.preventDefault();
    searchFeedback.textContent = 'Hãy nhập tên thủ đoạn hoặc lĩnh vực, không nhập số điện thoại hay số tài khoản.';
    searchFeedback.hidden = false;
    searchInput.focus();
  } else {
    searchInput.value = value;
  }
});

if (page) {
  markMotion(page, '.ph', 'data-motion-hero');
  markMotion(page, '.ph-drum img, .next-drum img', 'data-motion-rotate');
  markMotion(page, '[data-fraud-methods]', 'data-motion-methods');
  markMotion(page, '.next', 'data-rvs');
  initMotion(page, { desktopOnly: true });
}
