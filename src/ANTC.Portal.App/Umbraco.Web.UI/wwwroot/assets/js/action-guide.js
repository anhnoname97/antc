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
  const speakButton = guide.querySelector('[data-guide-speak]');
  if (speakButton && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
    speakButton.hidden = false;
    let reading = false;
    const stop = () => {
      reading = false;
      speechSynthesis.cancel();
      speakButton.setAttribute('aria-pressed', 'false');
      speakButton.querySelector('span').textContent = 'Nghe bài viết';
    };
    speakButton.addEventListener('click', () => {
      if (reading) { stop(); return; }
      const parts = [...guide.querySelectorAll('h1, .self-check-heading > p:not(.self-check-eyebrow), .action-guide-step-body h2, .action-guide-step-body h3, .action-guide-step-body p, .action-guide-step-body li')]
        .filter(node => !node.closest('.action-guide-bank:not([open])'))
        .map(node => node.textContent.trim()).filter(Boolean);
      if (!parts.length) return;
      const voice = speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith('vi'));
      reading = true;
      speakButton.setAttribute('aria-pressed', 'true');
      speakButton.querySelector('span').textContent = 'Dừng đọc';
      parts.forEach((text, index) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        if (voice) utterance.voice = voice;
        utterance.onerror = event => {
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            stop(); say('Thiết bị chưa đọc được bài viết. Bạn có thể dùng chức năng đọc màn hình của thiết bị.');
          }
        };
        if (index === parts.length - 1) utterance.onend = stop;
        speechSynthesis.speak(utterance);
      });
    });
    window.addEventListener('pagehide', stop);
  }
  window.addEventListener('pageshow', update);
  update();
}
