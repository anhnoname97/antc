import { initReferencePage } from '../reference-page.js';
const page = document.getElementById('noi-dung');
if (page) {
  initReferencePage(page);
  // This shorter Hero puts its heading close to the fixed header during scrolling.
  const header = document.querySelector('[data-contest-header]');
  if (header) {
    const updateHeader = () => header.classList.toggle('is-scrolled', scrollY > 24);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }
}
