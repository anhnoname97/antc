// Ma JS dung chung cho moi trang. Moi chuc nang mot module rieng trong thu muc nay (xem FE-01).
// Vi du co san: doc/ghi co chu cho nut "A+ Chu to" (FE-04 hoan thien giao dien va nhan nut).
const KEY = 'at_font_scale';

export function getFontScale() {
  try { return Number(localStorage.getItem(KEY) || 0); } catch { return 0; }
}

export function setFontScale(level) {
  document.documentElement.dataset.fontScale = String(level);
  try { localStorage.setItem(KEY, String(level)); } catch { /* che do rieng tu */ }
}

document.querySelector('[data-font-toggle]')?.addEventListener('click', () => {
  setFontScale((getFontScale() + 1) % 3);
  updateFontButton();
});

function updateFontButton() {
  const level = getFontScale();
  const button = document.querySelector('[data-font-toggle]');
  button?.setAttribute('aria-pressed', String(level > 0));
  button?.setAttribute('aria-label', level === 2 ? 'Khôi phục cỡ chữ mặc định' : 'Tăng cỡ chữ');
}

updateFontButton();

const header = document.querySelector('[data-site-header]');
if (header) {
  const hero = document.querySelector('#noi-dung > .home-content > .umb-block-grid > .umb-block-grid__layout-container > .umb-block-grid__layout-item:first-child > [data-header-hero="true"]')
    ?? document.querySelector('#noi-dung > :first-child');
  const hasHero = hero?.matches('.page-hero, .ov, .ph, [data-header-hero="true"]') ?? false;
  document.body.classList.toggle('has-header-hero', hasHero);
  // Hero mới có thể khai báo data-header-hero để dùng header trong suốt.
  header.dataset.overlay = String(hasHero && !hero.matches('.page-hero'));

  const updateHeader = () => {
    const threshold = hasHero ? Math.max(0, hero.getBoundingClientRect().bottom + window.scrollY - header.offsetHeight - 12) : 16;
    header.classList.toggle('is-scrolled', window.scrollY >= threshold);
  };
  const measureHeader = () => {
    document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
    updateHeader();
  };
  measureHeader();
  if ('ResizeObserver' in window) {
    new ResizeObserver(measureHeader).observe(header);
  } else {
    window.addEventListener('resize', measureHeader, { passive: true });
  }
  window.addEventListener('scroll', updateHeader, { passive: true });

  header.querySelector('[data-announcement-close]')?.addEventListener('click', () => {
    header.querySelector('[data-header-announcement]').hidden = true;
    header.querySelector('.site-brand')?.focus();
    measureHeader();
  });
}
