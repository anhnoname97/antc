const guide = document.querySelector('[data-action-guide]');
if (guide) {
  const checks = [...guide.querySelectorAll('[data-guide-check]')];
  const status = guide.querySelector('[data-guide-status]');
  const storageKey = `at_action_guide_ticks:${guide.dataset.actionGuide}`;
  let ticks = new Set();
  let canStore = true;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) ticks = new Set(stored.filter(key => checks.some(input => input.dataset.guideCheck === key)));
  } catch { canStore = false; }
  const update = () => {
    if (status) status.textContent = `Đã đánh dấu ${checks.filter(input => input.checked).length}/${checks.length} việc. ${canStore ? 'Đánh dấu chỉ lưu trên máy của bạn, không gửi đi đâu.' : 'Trình duyệt không cho lưu; tải lại trang sẽ bỏ các dấu này.'}`;
  };
  const save = () => {
    try {
      if (ticks.size) localStorage.setItem(storageKey, JSON.stringify([...ticks]));
      else localStorage.removeItem(storageKey);
    } catch { canStore = false; }
    update();
  };
  checks.forEach(input => {
    input.checked = ticks.has(input.dataset.guideCheck);
    input.addEventListener('change', () => {
      if (input.checked) ticks.add(input.dataset.guideCheck);
      else ticks.delete(input.dataset.guideCheck);
      save();
    });
  });
  guide.querySelector('[data-guide-reset]')?.addEventListener('click', () => {
    ticks.clear();
    checks.forEach(input => { input.checked = false; });
    save();
  });
  guide.querySelector('[data-guide-print]')?.addEventListener('click', () => window.print());
  const say = text => {
    const message = guide.querySelector('[data-guide-message]');
    if (message) { message.textContent = text; message.hidden = false; }
  };
  guide.querySelector('[data-guide-share]')?.addEventListener('click', async () => {
    const url = document.querySelector('link[rel="canonical"]')?.href || `${location.origin}${location.pathname}`;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await navigator.clipboard.writeText(url); say('Đã chép đường dẫn. Bạn có thể gửi cho người thân.'); }
    } catch (error) {
      if (error.name !== 'AbortError') say('Bạn có thể chép đường dẫn trên thanh địa chỉ để gửi cho người thân.');
    }
  });
  window.addEventListener('pageshow', update);
  update();
}
