const desktop = matchMedia('(min-width: 901px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-story]').forEach(story => {
  const chapters = [...story.querySelectorAll('[data-story-chapter]')];
  const visuals = chapters.map(chapter => chapter.querySelector('[data-story-visual]'));
  const frame = story.querySelector('[data-story-frame]');
  const stage = story.querySelector('[data-story-stage]');
  const panels = story.querySelector('[data-story-panels]');
  const buttons = [...story.querySelectorAll('[data-story-go]')];
  const messageSequences = visuals.map(visual => {
    const messages = [...visual.querySelectorAll('.story-phone__messages > p')].slice(1);
    const warning = visual.querySelector('.story-phone__warning');
    const sequence = messages.map((element, i) => ({ element, start: i * .6 / messages.length }));
    if (warning) sequence.push({ element: warning, start: .7 });
    sequence.forEach(({ element }) => { element.dataset.storyReveal = ''; });
    return sequence;
  });
  const clamp = value => Math.max(0, Math.min(1, value));
  let enhanced = false;
  let pending = false;
  const select = index => {
    chapters.forEach((chapter, i) => {
      chapter.hidden = i !== index;
      chapter.inert = i !== index;
      visuals[i].hidden = i !== index;
      visuals[i].inert = i !== index;
      buttons[i].setAttribute('aria-pressed', String(i === index));
    });
  };
  const update = () => {
    pending = false;
    if (!enhanced) return;
    const travel = Math.max(1, story.offsetHeight - frame.offsetHeight);
    const offset = -story.getBoundingClientRect().top;
    const progress = clamp((offset <= 1 ? 0 : offset) / travel);
    const selected = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
    if (visuals.some((visual, i) => i !== selected && visual.contains(document.activeElement))) return;
    select(selected);
    messageSequences.forEach((sequence, i) => {
      const time = clamp(progress * chapters.length - i) * 1.3;
      sequence.forEach(({ element, start }) => {
        const reveal = clamp((time - start) / .3);
        element.style.setProperty('--story-reveal', String(reveal));
        element.inert = reveal === 0;
        element.setAttribute('aria-hidden', String(reveal === 0));
      });
    });
  };
  const configure = () => {
    enhanced = desktop.matches && !reduced.matches && innerHeight >= 760
      && !(Number(document.documentElement.dataset.fontScale) > 0)
      && story.closest('[data-hero-motion]')?.dataset.heroMotion === 'true';
    story.classList.toggle('is-enhanced', enhanced);
    stage.hidden = !enhanced;
    chapters.forEach((chapter, i) => {
      chapter.hidden = false;
      chapter.inert = false;
      visuals[i].hidden = false;
      visuals[i].inert = false;
      (enhanced ? panels : chapter).append(visuals[i]);
    });
    // Keep all content readable if an editor adds more text than fits the pinned frame.
    if (enhanced && (chapters.some(chapter => chapter.scrollHeight > chapter.clientHeight + 1)
      || visuals.some(visual => visual.scrollHeight > stage.clientHeight + 1
        || [...visual.querySelectorAll('.story-visual, .story-phone__screen')]
          .some(panel => panel.scrollHeight > panel.clientHeight + 1)))) {
      enhanced = false;
      story.classList.remove('is-enhanced');
      stage.hidden = true;
      visuals.forEach((visual, i) => chapters[i].append(visual));
    }
    if (!enhanced) {
      messageSequences.flat().forEach(({ element }) => {
        element.style.removeProperty('--story-reveal');
        element.inert = false;
        element.removeAttribute('aria-hidden');
      });
    }
    update();
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => {
    if (!enhanced) return;
    const top = scrollY + story.getBoundingClientRect().top;
    const travel = story.offsetHeight - frame.offsetHeight;
    scrollTo({ top: top + travel * (i + .15) / chapters.length, behavior: 'smooth' });
  }));
  addEventListener('scroll', () => { if (!pending && enhanced) { pending = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', configure, { passive: true });
  desktop.addEventListener('change', configure);
  reduced.addEventListener('change', configure);
  new MutationObserver(configure).observe(document.documentElement, { attributes: true, attributeFilter: ['data-font-scale'] });
  document.fonts.ready.then(configure);
  configure();
});
