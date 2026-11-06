import { computeWizard, toggleWizardOption } from './emergency-wizard-rules.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const plain = value => {
  const decoder = document.createElement('textarea');
  decoder.innerHTML = String(value ?? '').replace(/<[^>]*>/g, ' ');
  return decoder.value.replace(/\s+/g, ' ').trim();
};
const local = value => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u001f]/.test(value) ? value : null;
const link = (url, text, cls = '') => local(url) ? `<a class="emergency-button ${cls}" href="${esc(url)}">${esc(text)}</a>` : '';

document.querySelectorAll('[data-emergency-wizard]').forEach(root => {
  const source = root.querySelector('[data-wizard-data]');
  if (!source) return;
  const data = JSON.parse(source.textContent);
  const stage = root.querySelector('[data-wizard-stage]');
  let step = 1;
  let input = { step1: '', step2: [], step3: [] };
  let error = '';
  const focus = () => stage.querySelector('h2')?.focus();
  function question(moveFocus = true) {
    const options = data[`step${step}Options`];
    const special = step === 1 ? [{ key: 'x', label: data.step1OtherLabel }] : [{ key: 'none', label: data[`step${step}NoneLabel`] }, { key: 'unk', label: data.unknownLabel }];
    stage.innerHTML = `<section class="wizard-question"><p class="wizard-progress">Câu ${step} / 3</p><h2 tabindex="-1">${esc(data[`step${step}Question`])}</h2><p>${esc(data[`step${step}Hint`])}</p>
      <fieldset><legend class="wizard-sr">${esc(data[`step${step}Question`])}</legend>${[...options, ...special].map(option => {
        const checked = step === 1 ? input.step1 === option.key : input[`step${step}`].includes(option.key);
        return `<label class="wizard-choice"><input type="${step === 1 ? 'radio' : 'checkbox'}" name="wizard-step-${step}" value="${esc(option.key)}" ${checked ? 'checked' : ''}><span><b>${esc(option.label)}</b>${option.hint ? `<small>${esc(option.hint)}</small>` : ''}</span></label>`;
      }).join('')}</fieldset><p class="wizard-error" role="alert">${esc(error)}</p><div class="wizard-controls">${step > 1 ? '<button type="button" data-back>Quay lại</button>' : link('/khan-cap/', 'Về Khẩn cấp')}<button type="button" class="primary" data-next>${step === 3 ? 'Xem kết quả' : 'Tiếp tục'}</button></div></section>`;
    stage.querySelectorAll('input').forEach(control => control.addEventListener('change', () => {
      error = '';
      if (step === 1) input.step1 = control.value;
      else input[`step${step}`] = toggleWizardOption(input[`step${step}`], control.value);
      stage.querySelectorAll('input').forEach(item => { item.checked = step === 1 ? input.step1 === item.value : input[`step${step}`].includes(item.value); });
      stage.querySelector('.wizard-error').textContent = '';
    }));
    stage.querySelector('[data-back]')?.addEventListener('click', () => { step--; error = ''; question(); });
    stage.querySelector('[data-next]').addEventListener('click', () => {
      if (step === 1 ? !input.step1 : !input[`step${step}`].length) { error = 'Chọn ít nhất một dòng để tiếp tục.'; stage.querySelector('.wizard-error').textContent = error; stage.querySelector('input')?.focus(); return; }
      if (step < 3) { step++; question(); } else result();
    });
    if (moveFocus) focus();
  }
  function result() {
    const output = computeWizard(data, input);
    const prefix = { ratCao: 'stop', cao: 'hold', thuong: 'clear' }[output.cautionLevel];
    const level = { ratCao: 'Rất cao', cao: 'Cao', thuong: 'Cần thận trọng' }[output.cautionLevel];
    const principles = () => `<ul>${data.principles.map(item => `<li><b>${esc(item.title)}</b> — ${esc(item.description)}</li>`).join('')}</ul>`;
    stage.innerHTML = `<div class="wizard-result" data-wizard-result data-level="${output.cautionLevel}">
      <section class="wizard-level wizard-level--${output.cautionLevel}"><h2 tabindex="-1">${esc(data.resultHeading1)}: ${level}</h2><b>${esc(data[`${prefix}Label`])}</b><p>${esc(data[`${prefix}Text`])}</p>${output.cautionLevel === 'thuong' ? `<p>${esc(data.clearNote)}</p>` : ''}</section>
      <section><h3>${esc(data.resultHeading2)}</h3>${output.situations.length ? `<ul>${output.situations.map(item => `<li>${local(item.tactic.articleUrl) ? `<a href="${esc(item.tactic.articleUrl)}">${esc(item.tactic.name)}</a>` : esc(item.tactic.name)}</li>`).join('')}</ul><p>${esc(data.situationNote)}</p>` : `<p>${esc(data.noMatchText)}</p>${principles()}`}</section>
      ${output.signs.length ? `<section><h3>${esc(data.resultHeading3)}</h3><ul>${output.signs.map(sign => `<li>${esc(plain(sign.text))}</li>`).join('')}</ul></section>` : ''}
      <section><h3>${esc(data.resultHeading4)}</h3><ol>${output.actions.map(action => `<li><p>${esc(action.displayText || action.text)}</p>${link(action.url, 'Xem đủ các bước')}</li>`).join('')}</ol></section>
      ${output.ifAlready.length ? `<section><h3>${esc(data.resultHeading5)}</h3><div class="wizard-already">${output.ifAlready.map(item => link(item.url, item.label)).join('')}</div></section>` : ''}
      <div class="wizard-controls">${link(output.guideUrl, data.button1Text)}${link(output.checklistUrl, data.button2Text)}<button type="button" data-share>${esc(data.button3Text)}</button><button type="button" data-reset>${esc(data.button4Text)}</button><button type="button" data-edit>Sửa câu trả lời</button><button type="button" data-print>In kết quả</button></div>
      <p class="wizard-share-status" role="status"></p><p class="wizard-note">${esc(data.resultNote)}</p><p class="wizard-note">${esc(data.notConclusionNote)}</p></div>`;
    stage.querySelector('[data-reset]').addEventListener('click', () => { input = { step1: '', step2: [], step3: [] }; step = 1; error = ''; question(); });
    stage.querySelector('[data-edit]').addEventListener('click', () => { step = 1; question(); });
    stage.querySelector('[data-print]').addEventListener('click', () => window.print());
    stage.querySelector('[data-share]').addEventListener('click', async () => {
      const url = new URL(location.pathname, location.origin).href;
      try {
        if (navigator.share) await navigator.share({ title: data.title, url });
        else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); stage.querySelector('[role=status]').textContent = 'Đã sao chép liên kết trang. Câu trả lời không được chia sẻ.'; }
        else stage.querySelector('[role=status]').textContent = `Sao chép địa chỉ trang để gửi: ${url}`;
      } catch (error) { if (error.name !== 'AbortError') stage.querySelector('[role=status]').textContent = `Bạn có thể sao chép địa chỉ trang để gửi: ${url}`; }
    });
    focus();
  }
  question(false);
});
