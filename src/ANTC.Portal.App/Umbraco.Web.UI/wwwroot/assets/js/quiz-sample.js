import { escapeHtml as e, renderQuestion, renderFeedback, renderProgress, renderNavigation, renderSummary } from './quiz-components.js';
import { loadSampleQuestions } from './quiz-sample-api.js';

const root = document.querySelector('[data-quiz-sample]');
if (root) {
  const get = name => root.querySelector(`[data-quiz-${name}]`);
  const body = get('body'), feedback = get('feedback'), navigation = get('navigation');
  const summary = get('summary'), progress = get('progress'), card = get('card');
  const status = get('status'), message = get('message'), retry = get('retry');
  let questions = [], answers = Object.create(null), index = 0;

  function focusContent(target) {
    target.focus({ preventScroll: true });
    const rect = card.getBoundingClientRect();
    const header = document.querySelector('.site-header');
    const offset = header && getComputedStyle(header).position === 'fixed' ? header.offsetHeight : 0;
    if (rect.top < offset || rect.top > innerHeight - 80) {
      window.scrollTo({ top: Math.max(0, scrollY + rect.top - offset - 16),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  function show(focus = false) {
    const result = location.hash === '#ket-qua';
    const match = /^#cau-([1-8])$/.exec(location.hash);
    index = match ? Number(match[1]) - 1 : 0;
    progress.innerHTML = renderProgress(questions, answers, result ? -1 : index);
    body.hidden = feedback.hidden = navigation.hidden = result;
    summary.hidden = !result;
    if (result) {
      summary.innerHTML = renderSummary(questions, answers) +
        '<div class="qsummary-actions"><button type="button" class="qbutton" data-restart>Làm lại từ đầu</button>' +
        '<a class="qbutton qbutton--primary" href="/cuoc-thi/">Làm đầy đủ 200 câu ›</a></div>';
      if (focus) focusContent(summary.querySelector('[data-summary-title]'));
      return;
    }
    const question = questions[index];
    const done = questions.filter(q => answers[q.code] != null).length;
    body.innerHTML = `<p class="qcount">Câu ${index + 1} / ${questions.length}</p>` +
      `<p class="quiz-topic">Chuyên đề ${e(question.cd)} · ${e(question.lab)}</p>` +
      `<progress class="qbar" max="${questions.length}" value="${done}" aria-label="Tiến độ trả lời">${done} / ${questions.length}</progress>` +
      renderQuestion(question, answers[question.code]);
    feedback.innerHTML = renderFeedback(question, answers[question.code]);
    navigation.innerHTML = renderNavigation(index, questions.length);
    if (focus) focusContent(body.querySelector('[data-question-title]'));
  }
  function go(hash) {
    if (location.hash !== hash) history.pushState(null, '', hash);
    show(true);
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || !questions.length) return;
    if (button.hasAttribute('data-answer')) {
      const question = questions[index], chosen = button.dataset.answer;
      if (answers[question.code] != null || !question.opt.some(([letter]) => letter === chosen)) return;
      answers[question.code] = chosen;
      show();
      feedback.querySelector('[data-result]').focus({ preventScroll: true });
    } else if (button.hasAttribute('data-question')) {
      const target = Number(button.dataset.question);
      if (Number.isInteger(target) && target >= 0 && target < questions.length) go(`#cau-${target + 1}`);
    } else if (button.dataset.direction === 'previous' && index > 0) {
      go(`#cau-${index}`);
    } else if (button.dataset.direction === 'next') {
      go(index === questions.length - 1 ? '#ket-qua' : `#cau-${index + 2}`);
    } else if (button.hasAttribute('data-show-summary')) {
      go('#ket-qua');
    } else if (button.hasAttribute('data-restart')) {
      answers = Object.create(null);
      go('#cau-1');
    }
  });
  window.addEventListener('hashchange', () => { if (questions.length) show(true); });
  async function load() {
    status.hidden = false;
    status.setAttribute('aria-busy', 'true');
    message.textContent = 'Đang tải câu hỏi…';
    retry.hidden = true;
    try {
      questions = await loadSampleQuestions();
      status.hidden = true;
      get('content').hidden = false;
      if (!/^#(?:cau-[1-8]|ket-qua)$/.test(location.hash)) history.replaceState(null, '', '#cau-1');
      show(document.activeElement === retry);
    } catch (error) {
      message.textContent = error.message === 'Failed to fetch'
        ? 'Không kết nối được máy chủ. Kiểm tra kết nối và thử lại.' : error.message;
      retry.hidden = false;
    } finally {
      status.setAttribute('aria-busy', 'false');
    }
  }
  retry.addEventListener('click', load);
  load();
}
