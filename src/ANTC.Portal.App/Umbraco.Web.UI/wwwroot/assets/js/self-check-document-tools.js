// Document tools never include answers in a shared URL.
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
}
