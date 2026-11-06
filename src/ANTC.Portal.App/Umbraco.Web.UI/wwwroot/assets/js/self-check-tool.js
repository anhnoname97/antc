import { evaluateAnswers } from './self-check-rules.mjs';

const states = {
  d: ['DỪNG', 'Dừng giao dịch ngay. Đây là khuyến nghị dừng hành động của bạn, không phải kết luận rằng đã có hành vi lừa đảo.'],
  h: ['HOÃN VÀ KIỂM CHỨNG', 'Chưa thực hiện giao dịch cho tới khi bạn đã kiểm chứng bằng một kênh do chính bạn tìm ra.'],
  n: ['CHƯA PHÁT HIỆN ĐIỂM DỪNG', 'Chưa phát hiện điểm dừng từ thông tin bạn cung cấp. Kết quả này không có nghĩa giao dịch an toàn.'],
};
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
export function emphasize(node, value) {
  const parts = String(value || '').split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) node.append(part.startsWith('**') && part.endsWith('**')
    ? element('strong', '', part.slice(2, -2)) : document.createTextNode(part));
  return node;
}
const button = (text, handler, className = '') => {
  const node = element('button', `self-check-button ${className}`, text);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
};
for (const root of document.querySelectorAll('[data-self-check-tool]')) {
  const stage = root.querySelector('[data-self-check-stage]');
  const json = root.querySelector('[data-self-check-data]');
  if (!stage || !json) continue;
  const data = JSON.parse(json.textContent);
  const more = root.querySelector('[data-self-check-more]');
  more.remove();
  let index = 0;
  let answers = [];
  const focus = heading => { heading.tabIndex = -1; heading.focus({ preventScroll: true }); stage.scrollIntoView({ block: 'start', behavior: 'instant' }); };
  const showQuestion = (moveFocus = true) => {
    more.hidden = true;
    const question = data.questions[index];
    const panel = element('section', 'self-check-question');
    panel.append(element('p', 'self-check-position', `Câu ${index + 1} / ${data.questions.length}`));
    const progress = element('progress', 'self-check-progress');
    progress.max = data.questions.length;
    progress.value = index;
    progress.setAttribute('aria-label', 'Số câu đã trả lời');
    panel.append(progress);
    const heading = emphasize(element('h2', 'self-check-question__title'), question.text);
    panel.append(heading);
    if (question.help) panel.append(emphasize(element('p', 'self-check-question__help'), question.help));
    const options = element('div', 'self-check-options');
    options.setAttribute('role', 'group');
    heading.id = 'self-check-question-title';
    options.setAttribute('aria-labelledby', heading.id);
    question.options.forEach((option, optionIndex) => {
      const choice = button(option.label, () => {
        answers[index] = optionIndex;
        answers.length = index + 1;
        const result = evaluateAnswers(data.questions, answers);
        if (result) showResult(result);
        else if (index + 1 < data.questions.length) { index++; showQuestion(); }
      }, 'self-check-option');
      choice.dataset.answer = option.mean;
      choice.setAttribute('aria-pressed', String(answers[index] === optionIndex));
      options.append(choice);
    });
    panel.append(options);
    if (index > 0) panel.append(button('← Câu trước', () => { index--; showQuestion(); }));
    stage.replaceChildren(panel);
    if (moveFocus) focus(heading);
  };
  const showResult = result => {
    index = result.lastIndex;
    const definition = data.results[result.level];
    const panel = element('div', 'self-check-result');
    const state = element('section', `self-check-state self-check-state--${result.level}`);
    state.setAttribute('aria-label', 'Kết quả kiểm tra');
    state.append(element('p', 'self-check-state__label', states[result.level][0]));
    const heading = element('h2', '', definition.label);
    state.append(heading, element('p', '', states[result.level][1]));
    if (result.reasons.length) {
      const reasons = element('ul', 'self-check-reasons');
      for (const reason of result.reasons) reasons.append(emphasize(element('li'), reason.prefix + data.questions[reason.index].text));
      state.append(reasons);
    }
    if (result.level === 'n' && data.noneMore) state.append(element('p', '', data.noneMore));
    panel.append(state);
    const actions = element('section', 'self-check-section');
    actions.append(element('h2', '', 'Việc nên làm bây giờ'));
    const list = element('ol', 'self-check-actions');
    for (const text of definition.actions) list.append(element('li', '', text));
    actions.append(list);
    panel.append(actions, more);
    const review = element('details', 'self-check-review');
    review.append(element('summary', '', 'Xem và sửa câu trả lời'));
    data.questions.slice(0, result.lastIndex + 1).forEach((q, i) => {
      const row = element('div', 'self-check-review__row');
      row.append(emphasize(element('p'), `Câu ${i + 1}: ${q.text}`), element('p', '', q.options[answers[i]].label), button(`Sửa câu ${i + 1}`, () => { index = i; showQuestion(); }));
      review.append(row);
    });
    panel.append(review);
    const controls = element('div', 'self-check-controls');
    controls.append(button('← Sửa câu trả lời', () => showQuestion()), button('Làm lại từ đầu', () => { index = 0; answers = []; showQuestion(); }), button('In kết quả', () => window.print()));
    panel.append(controls);
    const notes = element('div', 'self-check-result-notes');
    notes.append(element('p', '', 'Kết quả chỉ mang tính tham khảo, không phải kết luận pháp lý và không thay thế việc liên hệ ngân hàng hoặc cơ quan có thẩm quyền.'), element('p', '', 'Kết quả này dựa trên thông tin bạn vừa nhập. Đây không phải kết luận về bất kỳ cá nhân, tổ chức nào.'));
    panel.append(notes);
    stage.replaceChildren(panel);
    more.hidden = false;
    focus(heading);
  };
  showQuestion(false);
}
