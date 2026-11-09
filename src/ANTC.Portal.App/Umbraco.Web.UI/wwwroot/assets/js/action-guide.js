const guide = document.querySelector('[data-action-guide]');
if (guide) {
  const checks = [...guide.querySelectorAll('[data-guide-check]')];
  const status = guide.querySelector('[data-guide-status]');
  const update = () => { if (status) status.textContent = `Đã đánh dấu ${checks.filter(input => input.checked).length}/${checks.length} việc. Tải lại trang sẽ bỏ các dấu này.`; };
  checks.forEach(input => { input.checked = false; input.addEventListener('change', update); });
  guide.querySelector('[data-guide-reset]')?.addEventListener('click', () => { checks.forEach(input => input.checked = false); update(); });
  guide.querySelector('[data-guide-print]')?.addEventListener('click', () => window.print());
  window.addEventListener('pageshow', event => { if (event.persisted) { checks.forEach(input => input.checked = false); update(); } });
  update();
}
