// FE-04: ba muc chu, dong bo cac nut va giu hoat dong khi storage bi chan.
const KEY = 'at_font_scale';
const labels = ['A+ Chữ to', 'A++ Chữ to hơn', 'A Chữ thường'];
const compactLabels = ['A', 'A++', 'A+++'];
const compactScreen = matchMedia('(max-width: 1199px)');
const descriptions = ['Cỡ chữ thường, 100%', 'Cỡ chữ to, 112,5%', 'Cỡ chữ rất to, 125%'];
const normalize = value => ['0', '1', '2'].includes(String(value)) ? Number(value) : 0;

export function getFontScale() {
  return normalize(document.documentElement.dataset.fontScale);
}

function updateFontButtons(level) {
  for (const button of document.querySelectorAll('[data-font-toggle]')) {
    const customLabel = button.dataset.fontLabel;
    if (customLabel) {
      const symbol = button.querySelector('b');
      const text = button.querySelector('span');
      if (symbol) symbol.textContent = ['A+', 'A++', 'A'][level];
      if (text) text.textContent = customLabel;
    } else {
      button.textContent = compactScreen.matches ? compactLabels[level] : labels[level];
    }
    button.setAttribute('aria-pressed', String(level > 0));
    button.setAttribute('aria-label', `${labels[level]}. Hiện tại: ${descriptions[level]}.`);
  }
}

export function setFontScale(value, persist = true) {
  const level = normalize(value);
  document.documentElement.dataset.fontScale = String(level);
  if (persist) {
    try { localStorage.setItem(KEY, String(level)); } catch { /* van dung duoc trong phien trang */ }
  }
  updateFontButtons(level);
  const status = document.querySelector('[data-font-status]');
  if (status) status.textContent = descriptions[level];
  // Cho cac khoi theo doi data-font-scale va trinh duyet cap nhat bo cuc truoc khi do lai.
  requestAnimationFrame(() => window.ScrollTrigger?.refresh(true));
}

updateFontButtons(getFontScale());
compactScreen.addEventListener('change', () => updateFontButtons(getFontScale()));
for (const button of document.querySelectorAll('[data-font-toggle]')) {
  button.addEventListener('click', () => setFontScale((getFontScale() + 1) % 3));
}
window.addEventListener('storage', event => {
  if (event.key !== KEY && event.key !== null) return;
  setFontScale(normalize(event.newValue), false);
});

// Sticky header and bottom navigation reserve space at every text scale.
const header = document.querySelector('[data-site-header]');
const mobileNavigation = document.querySelector('[data-mobile-navigation]');
const measureChrome = () => {
  document.documentElement.style.setProperty('--site-header-height', (header?.offsetHeight || 0) + 'px');
  document.documentElement.style.setProperty('--site-mobile-nav-height', (mobileNavigation?.offsetHeight || 0) + 'px');
};
measureChrome();
if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(measureChrome);
  if (header) observer.observe(header);
  if (mobileNavigation) observer.observe(mobileNavigation);
}
window.addEventListener('resize', measureChrome, { passive: true });

// FE-32: dong bo an thanh trong phien, khong phu thuoc JavaScript de in noi dung.
const notice = document.querySelector('[data-contest-notice]');
if (notice) {
  notice.querySelector('[data-contest-notice-close]').addEventListener('click', () => {
    document.documentElement.dataset.contestAnnouncementHidden = 'true';
    try { sessionStorage.setItem('at_contest_announcement', 'hidden'); } catch { /* van an trong trang */ }
    document.querySelector('.contest-brand, .site-brand')?.focus();
    requestAnimationFrame(() => {
      const header = document.querySelector('[data-site-header], [data-contest-header]');
      if (header) document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
      window.ScrollTrigger?.refresh(true);
    });
  });
}

// Accordion / peek toggle for data-open
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open]');
  if (!btn) return;
  const targetId = btn.getAttribute('data-open');
  const target = document.getElementById(targetId);
  if (!target) return;
  const isExpanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!isExpanded));
  target.hidden = isExpanded;
});
