// Document tools never include answers in a shared URL or in the spoken text.
const page = document.querySelector('[data-self-check-checklist]');
if (page) {
  const status = page.querySelector('[data-checklist-tools-status]');
  const say = text => { status.textContent = text; status.hidden = false; };
  page.querySelector('[data-checklist-share]')?.addEventListener('click', async () => {
    const url = document.querySelector('link[rel=canonical]')?.href || location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else { await navigator.clipboard.writeText(url); say('Đã chép đường dẫn để gửi cho người thân.'); }
    } catch (error) {
      if (error.name !== 'AbortError') say('Chưa gửi được. Bạn có thể chép đường dẫn trên thanh địa chỉ.');
    }
  });
  const button = page.querySelector('[data-checklist-speak]');
  if (button && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
    button.hidden = false;
    let reading = false;
    const stop = () => {
      reading = false; speechSynthesis.cancel(); button.setAttribute('aria-pressed', 'false');
      button.querySelector('span').textContent = 'Nghe bài viết';
    };
    button.addEventListener('click', () => {
      if (reading) { stop(); return; }
      const data = JSON.parse(page.querySelector('[data-checklist-data]').textContent);
      const parts = [page.querySelector('h1').textContent, 'Có việc nào dưới đây không?', ...data.questions,
        'Kiểm tra bỏ túi', ...data.items];
      const voice = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang));
      reading = true; button.setAttribute('aria-pressed', 'true'); button.querySelector('span').textContent = 'Dừng đọc';
      parts.forEach((text, index) => {
        const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'vi-VN';
        if (voice) utterance.voice = voice;
        utterance.onerror = () => { stop(); say('Thiết bị chưa có giọng đọc phù hợp. Bạn vẫn có thể đọc hoặc in nội dung.'); };
        if (index === parts.length - 1) utterance.onend = stop;
        speechSynthesis.speak(utterance);
      });
    });
    window.addEventListener('pagehide', stop);
  }
}
