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
});