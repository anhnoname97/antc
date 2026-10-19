import { initReferencePage } from './reference-page.js';
import { initContestFeedback } from './contest-feedback.js';
import { animateContestCommunity } from './contest-community.js';
import { animateContestOverviews } from './contest-overview.js';
import { animateContestHeroes } from './contest-hero.js';
import { renderQuestion, renderFeedback, renderProgressStrips } from './quiz-components.js';
import { loadSampleQuestions } from './quiz-sample-api.js';

const page = document.getElementById('nj-cuoc-thi');
if (page) {
  initReferencePage(page);
  animateContestHeroes(page);
  animateContestOverviews(page);
  animateContestCommunity(page);
  initContestFeedback(page);
  // One request shared by every inline quiz block on this page.
  let pendingQuestions;
  function questionsFromApi() {
    pendingQuestions ??= loadSampleQuestions().catch(error => { pendingQuestions = null; throw error; });
    return pendingQuestions;
  }
  for (const root of page.querySelectorAll('[data-contest-quiz]')) {
    const get = name => root.querySelector(`[data-inline-${name}]`);
    let questions = [], index = 0, answers = Object.create(null);
    const body = get('body'), end = get('end'), next = get('next');
    const host = get('question'), feedback = get('feedback'), progress = get('progress');
    function show(focus = false) {
      const question = questions[index];
      body.hidden = false;
      end.hidden = true;
      get('counter').textContent = `Câu ${index + 1} / ${questions.length}`;
      host.innerHTML = renderQuestion(question, answers[question.code]);
      feedback.innerHTML = renderFeedback(question, answers[question.code], { showExplanations: false, showSafeAction: false });
      progress.innerHTML = renderProgressStrips(questions, answers, index);
      next.hidden = answers[question.code] == null;
      next.textContent = index === questions.length - 1 ? 'Xem kết quả ⟶' : 'Câu tiếp theo ⟶';
      if (focus) host.querySelector('[data-question-title]').focus();
    }
    host.addEventListener('click', event => {
      const option = event.target.closest('[data-answer]'), question = questions[index];
      if (!option || option.disabled || !question || answers[question.code] != null) return;
      if (!question.opt.some(([letter]) => letter === option.dataset.answer)) return;
      answers[question.code] = option.dataset.answer;
      show();
      feedback.querySelector('[data-result]').focus({ preventScroll: true });
    });
    next.addEventListener('click', () => {
      if (!questions.length || next.hidden || answers[questions[index].code] == null) return;
      if (index < questions.length - 1) { index++; show(true); return; }
      const correct = questions.filter(q => answers[q.code] === q.ans).length;
      get('score').textContent = `${correct}/${questions.length}`;
      get('result').textContent = correct === questions.length
        ? 'Rất tốt. Hãy rủ người thân cùng làm thử.'
        : 'Xem lại phần Ứng phó khẩn cấp để nhớ những dấu hiệu phải dừng lại.';
      body.hidden = true;
      end.hidden = false;
      get('score').focus();
    });
    get('restart').addEventListener('click', () => { index = 0; answers = Object.create(null); show(true); });
    async function load() {
      const status = get('status'), retry = get('retry');
      status.hidden = false;
      status.setAttribute('aria-busy', 'true');
      retry.hidden = true;
      get('message').textContent = 'Đang tải câu hỏi…';
      try {
        questions = await questionsFromApi();
        status.hidden = true;
        show();
      } catch {
        get('message').textContent = 'Chưa tải được câu hỏi. Vui lòng thử lại.';
        retry.hidden = false;
      } finally { status.setAttribute('aria-busy', 'false'); }
    }
    get('retry').addEventListener('click', load);
    load();
  }
}
