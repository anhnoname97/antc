document.querySelectorAll('[data-website-check]').forEach(check => {
  const buttons = [...check.querySelectorAll('[data-hotspot]')];
  const panels = [...check.querySelectorAll('[data-hotspot-panel]')];
  const close = () => {
    buttons.forEach(button => button.setAttribute('aria-expanded', 'false'));
    panels.forEach(panel => { panel.hidden = true; });
  };
  close();
  check.classList.add('is-interactive');
  // Anchor point 4 to its actual row on small screens instead of desktop percentages.
  const searchPoint = check.querySelector('[data-hotspot-number="4"]');
  const search = check.querySelector('.website-check__search');
  const badge = search?.querySelector('b');
  const diagram = check.querySelector('.website-check__diagram');
  if (searchPoint && search && badge && diagram) {
    const compact = matchMedia('(max-width: 1100px)');
    const original = { left: searchPoint.style.left, top: searchPoint.style.top };
    const positionSearchPoint = () => {
      if (!compact.matches) {
        Object.assign(searchPoint.style, original);
        return;
      }
      const diagramBox = diagram.getBoundingClientRect();
      const searchBox = search.getBoundingClientRect();
      const badgeBox = badge.getBoundingClientRect();
      searchPoint.style.left = `${searchBox.left - diagramBox.left + searchPoint.offsetWidth / 2}px`;
      searchPoint.style.top = `${badgeBox.top - diagramBox.top + badgeBox.height / 2}px`;
    };
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(positionSearchPoint);
      [diagram, search, badge].forEach(element => observer.observe(element));
    } else {
      window.addEventListener('resize', positionSearchPoint, { passive: true });
    }
    compact.addEventListener('change', positionSearchPoint);
    document.fonts.ready.then(positionSearchPoint);
    positionSearchPoint();
  }
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
