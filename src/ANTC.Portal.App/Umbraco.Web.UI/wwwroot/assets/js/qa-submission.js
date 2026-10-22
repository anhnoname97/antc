import { initMotion, markMotion } from './motion.js';

export function initQaSubmissions(page) {
  for (const root of page.querySelectorAll('[data-qa-submission]')) {
    const form = root.querySelector('[data-qa-form]');
    const field = name => form.elements.namedItem(name);
    const content = field('content'), contact = field('contact'), reply = field('wantReply'), consent = field('consent');
    const submit = form.querySelector('[data-qa-submit]'), alert = form.querySelector('[data-qa-error]');
    const success = root.querySelector('[data-qa-success]'), label = submit.textContent;
    let pending = false;
    const sensitive = () => /\d{6,}/.test(content.value.replace(/[\s.\-]/g, ''));
    function update() {
      root.querySelector('[data-qa-count]').textContent = `${content.value.length} / 2000`;
      const hit = sensitive();
      const guard = root.querySelector('[data-qa-guard]');
      guard.hidden = !hit; guard.classList.toggle('show', hit);
      root.querySelector('[data-qa-contact-fields]').hidden = !reply.checked;
      reply.setAttribute('aria-expanded', String(reply.checked));
      contact.disabled = !reply.checked;
      contact.required = reply.checked;
      content.readOnly = pending; contact.readOnly = pending;
      reply.disabled = pending; consent.disabled = pending;
      submit.disabled = pending || !consent.checked || !content.value.trim() || hit;
    }
    function clear() {
      alert.hidden = true; alert.textContent = '';
      for (const error of form.querySelectorAll('[data-field-error]')) { error.hidden = true; error.textContent = ''; }
      for (const input of [content, contact, consent]) input.removeAttribute('aria-invalid');
    }
    function fail(message, fields = {}) {
      alert.hidden = false; alert.textContent = message;
      for (const name of ['content', 'contact', 'consent']) {
        if (typeof fields[name] !== 'string') continue;
        const error = form.querySelector(`[data-field-error="${name}"]`);
        error.hidden = false; error.textContent = fields[name]; field(name).setAttribute('aria-invalid', 'true');
      }
      const first = [content, contact, consent].find(input => !input.disabled && input.getAttribute('aria-invalid') === 'true');
      (first || alert).focus();
    }
    form.addEventListener('input', () => { if (!pending) clear(); update(); });
    form.addEventListener('change', () => { if (!pending) clear(); update(); });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending) return;
      clear();
      const fields = {};
      if (content.value.trim().length < 10 || content.value.length > 2000) fields.content = 'Vui lòng nhập nội dung từ 10 đến 2000 ký tự.';
      if (sensitive()) fields.content = 'Vui lòng xóa dãy số có thể chứa thông tin riêng trước khi gửi.';
      if (!consent.checked) fields.consent = 'Bạn cần đánh dấu đồng ý để gửi.';
      if (reply.checked && (!contact.value.trim() || contact.value.trim().length > 200)) fields.contact = 'Vui lòng nhập thư điện tử hoặc số điện thoại, tối đa 200 ký tự.';
      if (Object.keys(fields).length) { fail('Vui lòng kiểm tra nội dung trước khi gửi.', fields); return; }
      const payload = { type: field('type').value, content: content.value.trim(), wantReply: reply.checked,
        contact: reply.checked ? contact.value.trim() : '', consent: consent.checked, website: field('website').value };
      pending = true; form.setAttribute('aria-busy', 'true'); submit.textContent = 'Đang gửi…'; update();
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/api/v1/questions', { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (response.status === 201 && data?.ok === true) {
          form.hidden = true; success.hidden = false; success.focus();
        } else if (response.status === 429) fail('Bạn gửi hơi nhanh. Thử lại sau ít phút.');
        else if (response.status === 400 && data?.error?.code === 'VALIDATION') fail('Vui lòng kiểm tra nội dung trước khi gửi.', data.error.fields || {});
        else fail('Chưa gửi được nội dung. Bản nháp đã được giữ lại, bạn vui lòng thử lại.');
      } catch (error) {
        fail(error.name === 'AbortError' ? 'Gửi nội dung mất quá nhiều thời gian. Bạn vui lòng thử lại.' : 'Không kết nối được máy chủ. Bản nháp đã được giữ lại, bạn vui lòng thử lại.');
      } finally {
        clearTimeout(timeout); pending = false; form.setAttribute('aria-busy', 'false'); submit.textContent = label; update();
      }
    });
    root.querySelector('[data-qa-again]').addEventListener('click', () => {
      form.reset(); clear(); form.hidden = false; success.hidden = true; update(); content.focus();
    });
    update();
  }
}

export function animateQaSubmissionBlocks(page) {
  markMotion(page, '[data-qa-submission] > .form, [data-qa-guidelines]', 'data-rv');
  initMotion(page);
}
