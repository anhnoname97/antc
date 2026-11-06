// Cong cu cua trang bai doc: nghe, in, gui va bang kiem bo tui. Nut "Chu lon" do site.js xu ly qua data-font-toggle.
const page = document.querySelector('[data-reading]');
const TICKS = 'at_reading_ticks';

function readTicks() {
  try { return JSON.parse(localStorage.getItem(TICKS)) || {}; } catch { return {}; }
}

function saveTicks(ticks) {
  try { localStorage.setItem(TICKS, JSON.stringify(ticks)); } catch { /* trinh duyet chan luu tru: van tich duoc trong phien */ }
}

function say(message) {
  const status = page.querySelector('[data-reading-status]');
  status.textContent = message;
  status.hidden = false;
}

function setupSpeak() {
  const button = page.querySelector('[data-reading-speak]');
  if (!('speechSynthesis' in window)) return;
  const label = button.querySelector('span');
  const stop = () => {
    speechSynthesis.cancel();
    button.setAttribute('aria-pressed', 'false');
    label.textContent = 'Nghe bài viết';
  };
  button.hidden = false;
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') { stop(); return; }
    const body = page.querySelector('[data-reading-body]');
    // Doc tung doan: trinh duyet cat cau qua dai
    const parts = [...body.querySelectorAll('h2, p, li, td')].map((x) => x.textContent.trim()).filter(Boolean);
    const voice = speechSynthesis.getVoices().find((x) => /^vi/i.test(x.lang));
    parts.forEach((text, index) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      if (voice) utterance.voice = voice;
      if (index === parts.length - 1) utterance.onend = stop;
      speechSynthesis.speak(utterance);
    });
    button.setAttribute('aria-pressed', 'true');
    label.textContent = 'Dừng đọc';
  });
  window.addEventListener('pagehide', stop);
}

function setupShare() {
  page.querySelector('[data-reading-print]').addEventListener('click', () => window.print());
  page.querySelector('[data-reading-share]').addEventListener('click', async () => {
    const data = { title: document.title, url: location.href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(location.href);
      say('Đã chép đường dẫn. Dán vào tin nhắn để gửi cho người thân.');
    } catch (error) {
      if (error.name !== 'AbortError') say('Chưa gửi được. Hãy chép đường dẫn trên thanh địa chỉ.');
    }
  });
}

function setupPockets() {
  const ticks = readTicks();
  for (const box of page.querySelectorAll('[data-tick]')) {
    box.checked = !!ticks[box.dataset.tick];
    box.addEventListener('change', () => {
      ticks[box.dataset.tick] = box.checked;
      saveTicks(ticks);
    });
  }
  for (const button of page.querySelectorAll('[data-pocket-clear]')) {
    button.addEventListener('click', () => {
      for (const box of button.parentElement.querySelectorAll('[data-tick]')) {
        box.checked = false;
        delete ticks[box.dataset.tick];
      }
      saveTicks(ticks);
    });
  }
}

if (page) {
  setupSpeak();
  setupShare();
  setupPockets();
}
