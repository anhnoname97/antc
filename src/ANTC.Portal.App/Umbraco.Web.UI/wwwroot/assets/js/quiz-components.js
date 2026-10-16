export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
const e = escapeHtml;

export function renderQuestion(question, chosen = null, { showCorrectTick = true } = {}) {
  const answered = question.opt.some(([letter]) => letter === chosen);
  return `${question.sit ? `<div class="qsituation"><b>Tình huống</b><p>${e(question.sit)}</p></div>` : ''}
    <h2 class="qquestion" tabindex="-1" data-question-title>${e(question.q)}</h2>
    <div class="qoptions" role="group" aria-label="Chọn một đáp án">
    ${question.opt.map(([letter, text]) => {
      const right = answered && letter === question.ans;
      const wrong = answered && letter === chosen && !right;
      const state = right ? 'right' : wrong ? 'wrong' : answered ? 'dim' : '';
      return `<button type="button" class="qopt ${state}" data-answer="${e(letter)}" ${answered ? 'disabled' : ''}>
        <span class="qletter">${e(letter)}</span><span class="qtext">${e(text)}</span>
        ${right ? `<span class="qlabel">${showCorrectTick ? '✓ ' : ''}Đáp án phù hợp</span>` : wrong ? '<span class="qlabel">✕ Bạn chọn</span>' : ''}</button>`;
    }).join('')}</div>`;
}

// Keep the live-region container mounted and replace only its contents on answer.
export function renderFeedback(question, chosen, { showSafeAction = true, showCorrectTick = true, showExplanations = true } = {}) {
  if (!question.opt.some(([letter]) => letter === chosen)) return '';
  const correct = chosen === question.ans;
  return `<p class="qresult ${correct ? 'right' : 'wrong'}" tabindex="-1" data-result>
    <b>${correct ? `${showCorrectTick ? '✓ ' : ''}Đúng.` : '⚠ Chưa đúng.'}</b> Đáp án phù hợp là ${e(question.ans)}.</p>
    ${showExplanations ? `<dl class="qexp">${question.opt.map(([letter]) => `<div class="${letter === question.ans ? 'right' : ''}">
      <dt>${e(letter)}${letter === question.ans ? ` · ${showCorrectTick ? '✓ ' : ''}Phù hợp` : ''}</dt><dd>${e(question.exp?.[letter])}</dd></div>`).join('')}</dl>` : ''}
    ${showSafeAction && question.safe ? `<div class="qsafe"><b>Hành động an toàn</b><p>${e(question.safe)}</p></div>` : ''}`;
}

export function renderProgress(questions, answers, current) {
  const done = questions.filter(q => answers[q.code] != null).length;
  const correct = questions.filter(q => answers[q.code] === q.ans).length;
  return `<p class="qcount">Đã làm ${done} / ${questions.length} · Đúng ${correct}</p>
    <progress class="qbar" max="${questions.length}" value="${done}" aria-label="Tiến độ trả lời">${done} / ${questions.length}</progress>
    <div class="qdots" role="group" aria-label="Chọn câu hỏi">${questions.map((q, index) => {
      const state = answers[q.code] == null ? '' : answers[q.code] === q.ans ? 'right' : 'wrong';
      const label = state === 'right' ? 'đúng' : state === 'wrong' ? 'chưa đúng' : 'chưa làm';
      return `<button type="button" class="qdot ${state}" data-question="${index}" ${index === current ? 'aria-current="step"' : ''}
        aria-label="Câu ${index + 1}, ${label}">${index + 1}${state ? `<span aria-hidden="true">${state === 'right' ? '✓' : '⚠'}</span>` : ''}</button>`;
    }).join('')}</div><p class="qlegend">✓ Đúng · ⚠ Chưa đúng</p>`;
}

export function renderNavigation(index, total) {
  return `<nav class="qnav" aria-label="Điều hướng câu hỏi">
    <button type="button" class="qbutton" data-direction="previous" ${index === 0 ? 'disabled' : ''}>‹ Câu trước</button>
    <button type="button" class="qbutton qbutton--primary" data-direction="next">${index === total - 1 ? 'Xem kết quả ›' : 'Câu tiếp ›'}</button></nav>`;
}

export function renderSummary(questions, answers) {
  const correct = questions.filter(q => answers[q.code] === q.ans).length;
  return `<h2 class="qscore" tabindex="-1" data-summary-title>Đúng ${correct} / ${questions.length} câu</h2>
    <div class="qrows">${questions.map((q, index) => {
      const state = answers[q.code] == null ? '' : answers[q.code] === q.ans ? 'right' : 'wrong';
      return `<button type="button" class="qrow ${state}" data-question="${index}"><span>${index + 1}</span>
        <span class="qrow-text"><small>${e(q.cd)} · ${e(q.lab)}</small>${e(q.q)}</span><b>${state === 'right' ? '✓ Đúng' : state === 'wrong' ? '⚠ Chưa đúng' : 'Chưa làm'}</b></button>`;
    }).join('')}</div>`;
}

// FE-24 strip variant; keep the same answer state contract as question/dot renderers.
export function renderProgressStrips(questions, answers, current) {
  return questions.map((question, index) => {
    const chosen = answers[question.code];
    const state = chosen == null ? index === current ? 'on' : '' : chosen === question.ans ? 'ok' : 'no';
    const label = chosen == null ? index === current ? 'đang xem' : 'chưa làm' : chosen === question.ans ? 'đúng' : 'chưa đúng';
    return `<span class="qstrip ${state}" role="img" aria-label="Câu ${index + 1}: ${label}"></span>`;
  }).join('');
}
