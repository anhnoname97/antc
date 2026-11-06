import { branchResult } from './self-check-branch-rules.mjs';

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (text, handler, className = '') => {
  const node = element('button', `self-check-button ${className}`, text);
  node.type = 'button'; node.addEventListener('click', handler); return node;
};
const actions = items => {
  const list = element('ol', 'self-check-actions');
  for (const action of items) {
    const item = element('li');
    const copy = element('div'); copy.append(element('p', '', action.text));
    if (action.bankHint) copy.append(element('p', 'self-check-bank-hint', action.bankHint));
    item.append(copy); list.append(item);
  }
  return list;
};
for (const root of document.querySelectorAll('[data-self-check-branch]')) {
  const stage = root.querySelector('[data-self-check-stage]');
  const json = root.querySelector('[data-self-check-data]');
  if (!stage || !json) continue;
  const data = JSON.parse(json.textContent);
  const more = root.querySelector('[data-self-check-more]');
  const hitNotes = root.querySelector('[data-self-check-hit-notes]');
  more.remove(); hitNotes.remove();
  let index = 0, answers = [];
  const focus = heading => { heading.tabIndex = -1; heading.focus({ preventScroll: true }); stage.scrollIntoView({ block: 'start', behavior: 'instant' }); };
  const showQuestion = (moveFocus = true) => {
    more.hidden = true; hitNotes.hidden = true;
    const question = data.questions[index];
    const panel = element('section', 'self-check-question');
    panel.append(element('p', 'self-check-position', `Câu ${index + 1} / ${data.questions.length}`));
    const progress = element('progress', 'self-check-progress');
    progress.max = data.questions.length; progress.value = index; progress.setAttribute('aria-label', 'Số câu đã trả lời');
    const heading = element('h2', 'self-check-question__title', question.text);
    heading.id = 'self-check-question-title';
    panel.append(progress, heading);
    const options = element('div', 'self-check-options');
    options.setAttribute('role', 'group'); options.setAttribute('aria-labelledby', heading.id);
    for (const [value, label] of [['y', question.yes], ['n', question.no], ['u', 'Tôi chưa biết']]) {
      const choice = button(label, () => {
        answers[index] = value; answers.length = index + 1;
        const result = branchResult(data.questions.length, answers);
        if (result !== null) showResult(result);
        else { index++; showQuestion(); }
      }, 'self-check-option');
      choice.dataset.answer = value;
      choice.setAttribute('aria-pressed', String(answers[index] === value)); options.append(choice);
    }
    panel.append(options);
    if (index > 0) panel.append(button('← Câu trước', () => { index--; showQuestion(); }));
    stage.replaceChildren(panel);
    if (moveFocus) focus(heading);
  };
  const showResult = hits => {
    index = data.questions.length - 1;
    const panel = element('div', 'self-check-result');
    const state = element('section', `self-check-state self-check-state--${hits.length ? 'd' : 'n'}`);
    state.setAttribute('aria-label', 'Kết quả kiểm tra');
    const heading = element('h2', '', hits.length ? data.hitTitle.replaceAll('{n}', String(hits.length)) : data.noneTitle);
    state.append(heading);
    const copy = hits.length ? data.hitText : data.noneText;
    if (copy) state.append(element('p', '', copy));
    panel.append(state);
    if (!hits.length) {
      const section = element('section', 'self-check-section');
      section.append(element('h2', '', 'Việc nên làm bây giờ'), actions(data.noneActions));
      more.hidden = false; section.append(more); panel.append(section);
    } else {
      hits.forEach(({ index: questionIndex, unsure }, order) => {
        const question = data.questions[questionIndex];
        const section = element('section', 'self-check-section self-check-branch-group');
        section.dataset.question = String(questionIndex + 1);
        const title = element('h2');
        const titleCopy = element('span', '', question.label);
        if (unsure) titleCopy.append(document.createTextNode(' '), element('small', '', '(nếu đúng như vậy)'));
        title.append(element('span', 'self-check-group-number', String(order + 1)), titleCopy);
        const link = element('a', 'self-check-button', `Mở đủ các bước: ${question.sourceTitle}`);
        link.href = question.url;
        section.append(title, actions(question.actions), link); panel.append(section);
      });
      hitNotes.hidden = false; panel.append(hitNotes);
    }
    const review = element('details', 'self-check-review');
    review.append(element('summary', '', 'Xem và sửa câu trả lời'));
    data.questions.forEach((question, i) => {
      const row = element('div', 'self-check-review__row');
      const label = answers[i] === 'y' ? question.yes : answers[i] === 'n' ? question.no : 'Tôi chưa biết';
      row.append(element('p', '', `Câu ${i + 1}: ${question.text}`), element('p', '', label), button(`Sửa câu ${i + 1}`, () => { index = i; showQuestion(); }));
      review.append(row);
    });
    const controls = element('div', 'self-check-controls');
    controls.append(button('← Sửa câu trả lời', () => showQuestion()), button('Làm lại từ đầu', () => { index = 0; answers = []; showQuestion(); }), button('In danh sách việc cần làm', () => window.print()));
    const notes = element('div', 'self-check-result-notes');
    notes.append(element('p', '', 'Website không trực 24/7. Khi đang xảy ra sự việc, hãy gọi ngay tổng đài ngân hàng của bạn và cơ quan Công an nơi cư trú.'), element('p', '', 'Kết quả chỉ mang tính tham khảo, không phải kết luận pháp lý và không thay thế việc liên hệ ngân hàng hoặc cơ quan có thẩm quyền.'), element('p', '', 'Kết quả này dựa trên thông tin bạn vừa nhập. Đây không phải kết luận về bất kỳ cá nhân, tổ chức nào.'));
    panel.append(review, controls, notes); stage.replaceChildren(panel); focus(heading);
  };
  showQuestion(false);
}
