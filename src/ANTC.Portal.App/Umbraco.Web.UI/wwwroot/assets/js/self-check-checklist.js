import { checklistResult } from './self-check-checklist-rules.mjs';
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const states = {
  d: ['DỪNG', 'Dừng giao dịch ngay. Đây là khuyến nghị dừng hành động của bạn, không phải kết luận rằng đã có hành vi lừa đảo.'],
  h: ['HOÃN VÀ KIỂM CHỨNG', 'Chưa thực hiện giao dịch cho tới khi bạn đã kiểm chứng bằng một kênh do chính bạn tìm ra.'],
  n: ['CHƯA PHÁT HIỆN ĐIỂM DỪNG', 'Chưa phát hiện điểm dừng từ thông tin bạn cung cấp. Kết quả này không có nghĩa giao dịch an toàn.'],
};
for (const root of document.querySelectorAll('[data-self-check-checklist]')) {
  const json = root.querySelector('[data-checklist-data]');
  if (!json) continue;
  const data = JSON.parse(json.textContent);
  const form = root.querySelector('[data-checklist-form]');
  const out = root.querySelector('[data-checklist-output]');
  const error = root.querySelector('[data-checklist-error]');
  const radios = [...form.querySelectorAll('input[type=radio]')];
  const boxes = [...form.querySelectorAll('input[type=checkbox]')];
  const invalidate = () => { out.replaceChildren(); error.hidden = true; };
  form.addEventListener('change', invalidate);
  root.querySelector('[data-checklist-clear]').addEventListener('click', () => { boxes.forEach(input => { input.checked = false; }); invalidate(); });
  root.querySelector('[data-checklist-reset]').addEventListener('click', () => {
    [...radios, ...boxes].forEach(input => { input.checked = false; }); invalidate();
    radios[0].focus();
  });
  root.querySelector('[data-checklist-print]').addEventListener('click', () => window.print());
  root.querySelector('[data-checklist-result]').addEventListener('click', () => {
    const answers = data.questions.map((_, i) => form.querySelector(`input[name="checklist-answer-${i}"]:checked`)?.value);
    const missing = answers.filter(value => !value).length;
    if (missing) {
      out.replaceChildren(); error.textContent = `Còn ${missing} câu ở phần 1 chưa chọn. Không chắc thì chọn “Tôi chưa biết”.`; error.hidden = false;
      form.querySelector(`[data-checklist-question="${answers.findIndex(value => !value)}"] input`).focus();
      return;
    }
    const result = checklistResult(data.questions, data.items, answers, boxes.map(input => input.checked));
    if (!result) return;
    error.hidden = true;
    const panel = element('div', 'self-check-result');
    const state = element('section', `self-check-state self-check-state--${result.level}`);
    state.setAttribute('aria-label', 'Kết quả kiểm tra');
    const title = element('h2', '', states[result.level][0]);
    state.append(title, element('p', '', states[result.level][1]));
    if (result.reasons.length) {
      const reasons = element('ul', 'self-check-reasons');
      for (const reason of result.reasons) reasons.append(element('li', '', reason));
      state.append(reasons);
    }
    const action = result.level === 'd' ? data.stopAction : result.level === 'h' ? data.holdAction : '';
    if (action) { const p = element('p', 'self-check-checklist-action'); p.append(element('strong', '', 'Làm ngay: '), document.createTextNode(action)); state.append(p); }
    panel.append(state);
    if (result.level === 'd') { const link = element('a', 'self-check-button', 'Khẩn cấp: chọn việc cần làm ngay'); link.href = '/ung-pho/'; panel.append(link); }
    const notes = element('div', 'self-check-result-notes');
    notes.append(element('p', '', 'Kết quả chỉ mang tính tham khảo, không phải kết luận pháp lý và không thay thế việc liên hệ ngân hàng hoặc cơ quan có thẩm quyền.'), element('p', '', 'Kết quả này dựa trên thông tin bạn vừa nhập. Đây không phải kết luận về bất kỳ cá nhân, tổ chức nào.'));
    panel.append(notes); out.replaceChildren(panel);
    title.tabIndex = -1; title.focus({ preventScroll: true }); out.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}
