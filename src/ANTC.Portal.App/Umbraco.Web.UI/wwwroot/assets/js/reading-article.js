// Cong cu cua trang bai doc: in, gui va bang kiem bo tui. Nut "Chu lon" do site.js xu ly qua data-font-toggle.
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
  setupShare();
  setupPockets();
}
