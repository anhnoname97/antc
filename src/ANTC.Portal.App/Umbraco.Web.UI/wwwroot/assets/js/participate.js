// Sharing behavior adapted from MinhNB's contest page, within the current site layout.
for (const button of document.querySelectorAll('[data-share-home]')) {
  const status = button.parentElement.querySelector('[data-share-status]');
  const label = button.textContent;
  let resetTimer;
  button.addEventListener('click', async () => {
    const url = new URL('/', location.origin).href;
    clearTimeout(resetTimer);
    button.textContent = label;
    status.textContent = '';
    button.disabled = true;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'An Toàn Tài Chính', text: 'Nhận diện lừa đảo, biết cách tự bảo vệ', url });
      } else {
        await navigator.clipboard.writeText(url);
        button.textContent = 'Đã sao chép đường dẫn';
        status.textContent = 'Đã sao chép đường dẫn';
        resetTimer = setTimeout(() => { button.textContent = label; status.textContent = ''; }, 3000);
      }
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = `Bạn có thể sao chép đường dẫn: ${url}`;
    } finally {
      button.disabled = false;
    }
  });
}
