document.querySelectorAll('[data-website-check]').forEach(check => {
  const buttons = [...check.querySelectorAll('[data-hotspot]')];
  const panels = [...check.querySelectorAll('[data-hotspot-panel]')];
  const close = () => {
    buttons.forEach(button => button.setAttribute('aria-expanded', 'false'));
    panels.forEach(panel => { panel.hidden = true; });
  };
  close();
  check.classList.add('is-interactive');
  buttons.forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    close();
    if (!open) return;
    button.setAttribute('aria-expanded', 'true');
    const panel = panels.find(panel => panel.id === button.getAttribute('aria-controls'));
    if (panel) panel.hidden = false;
  }));
  document.addEventListener('click', event => {
    if (!check.contains(event.target) || !event.target.closest('[data-hotspot], [data-hotspot-panel]')) close();
  });
  check.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const active = buttons.find(button => button.getAttribute('aria-expanded') === 'true');
    close();
    active?.focus();
  });
});
document.querySelectorAll('[data-website-quiz]').forEach(quiz => {
  const options = [...quiz.querySelectorAll('[data-quiz-option]')];
  const feedback = quiz.querySelector('[data-quiz-feedback]');
  quiz.classList.add('is-interactive');
  options.forEach(option => option.addEventListener('click', () => {
    options.forEach(item => {
      item.removeAttribute('data-state');
      item.setAttribute('aria-pressed', String(item === option));
    });
    const correct = option.dataset.correct === 'true';
    option.dataset.state = correct ? 'right' : 'wrong';
    feedback.dataset.state = option.dataset.state;
    feedback.textContent = `${correct ? '✓' : '⚠'} ${correct ? quiz.dataset.correctLabel : quiz.dataset.incorrectLabel} ${option.dataset.explanation}`;
  }));
});
