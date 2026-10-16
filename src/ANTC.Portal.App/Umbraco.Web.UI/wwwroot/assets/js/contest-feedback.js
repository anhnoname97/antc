// Compact, anonymous feedback on the contest page; API-06 submission contract.
export function initContestFeedback(page) {
  for (const root of page.querySelectorAll('[data-feedback-block]')) {
    const form = root.querySelector('[data-contest-feedback]');
    const content = form.elements.namedItem('content');
    const submit = root.querySelector('[data-feedback-submit]');
    const errorBox = root.querySelector('[data-feedback-error]');
    const success = root.querySelector('[data-feedback-success]');
    const submitLabel = submit.textContent;
    let pending = false;

    function clearErrors() {
      errorBox.hidden = true;
      errorBox.textContent = '';
      content.removeAttribute('aria-invalid');
    }
    function update() {
      submit.disabled = pending;
      content.readOnly = pending;
    }
    function showErrors(message, fields = {}) {
      const details = Object.values(fields).filter(value => typeof value === 'string');
      errorBox.textContent = details.length ? details.join(' ') : message;
      errorBox.hidden = false;
      if (fields.content) content.setAttribute('aria-invalid', 'true');
      (fields.content ? content : errorBox).focus();
    }
    form.addEventListener('input', () => { if (!pending) clearErrors(); update(); });
    form.addEventListener('change', () => { if (!pending) clearErrors(); update(); });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending) return;
      clearErrors();
      const fields = {};
      if (content.value.trim().length < 10 || content.value.length > 2000) fields.content = 'Vui lòng nhập góp ý từ 10 đến 2000 ký tự.';
      if (Object.keys(fields).length) { showErrors('Vui lòng kiểm tra thông tin góp ý.', fields); return; }
      const payload = {
        type: 'gop-y', content: content.value.trim(), wantReply: false,
        contact: '', consent: true,
        website: form.elements.namedItem('website').value
      };
      pending = true;
      form.setAttribute('aria-busy', 'true');
      submit.textContent = 'Đang gửi…';
      update();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/api/v1/questions', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload), signal: controller.signal
        });
        const data = await response.json().catch(() => null);
        if (response.status === 201 && data?.ok === true) {
          form.hidden = true;
          success.hidden = false;
          success.focus();
        } else if (response.status === 429) {
          showErrors('Bạn gửi hơi nhanh. Thử lại sau ít phút.');
        } else if (response.status === 400 && data?.error?.code === 'VALIDATION') {
          showErrors('Vui lòng kiểm tra thông tin góp ý.', data.error.fields || {});
        } else {
          showErrors('Chưa gửi được góp ý. Nội dung đã được giữ lại, bạn vui lòng thử lại.');
        }
      } catch (error) {
        showErrors(error.name === 'AbortError'
          ? 'Gửi góp ý mất quá nhiều thời gian. Nội dung đã được giữ lại, bạn vui lòng thử lại.'
          : 'Không kết nối được máy chủ. Nội dung đã được giữ lại, bạn vui lòng thử lại.');
      } finally {
        clearTimeout(timeout);
        pending = false;
        form.setAttribute('aria-busy', 'false');
        submit.textContent = submitLabel;
        update();
      }
    });
    root.querySelector('[data-feedback-again]').addEventListener('click', () => {
      form.reset();
      clearErrors();
      form.hidden = false;
      success.hidden = true;
      update();
      content.focus();
    });
    update();
  }
}
