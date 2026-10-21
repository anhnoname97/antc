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
  const chapterInterval = 1.3;
  const transitionDuration = .8;
  const duration = (chapters.length - 1) * chapterInterval + transitionDuration + .5;
  const easeInOut = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
  let enhanced = false;
  let animationFrame;
  let currentTime = 0;
  let previousFrameTime;
  const targetTime = () => {
    const travel = Math.max(1, story.offsetHeight - frame.offsetHeight);
    const offset = -story.getBoundingClientRect().top;
    return clamp((offset <= 1 ? 0 : offset) / travel) * duration;
  };
  const render = time => {
    let selected = 0;
    chapters.forEach((_, i) => { if (i && time >= i * chapterInterval + .4) selected = i; });
    if (visuals.some((visual, i) => i !== selected && visual.contains(document.activeElement))) return;
    chapters.forEach((chapter, i) => {
      const incoming = i === 0 ? 1 : clamp((time - i * chapterInterval - .25) / .4);
      const outgoing = i === chapters.length - 1 ? 0 : clamp((time - (i + 1) * chapterInterval) / .4);
      const opacity = incoming * (1 - outgoing);
      chapter.hidden = opacity === 0;
      chapter.inert = i !== selected;
      chapter.setAttribute('aria-hidden', String(i !== selected));
      chapter.style.opacity = String(opacity);
      chapter.style.transform = `translateY(${(1 - incoming) * 30 - outgoing * 30}px)`;

      const reveal = i === 0 ? 1 : easeInOut(clamp((time - i * chapterInterval) / transitionDuration));
      const covered = i < chapters.length - 1 && time >= (i + 1) * chapterInterval + transitionDuration;
      visuals[i].hidden = reveal === 0 || covered;
      visuals[i].inert = i !== selected;
      visuals[i].setAttribute('aria-hidden', String(i !== selected));
      visuals[i].style.clipPath = `inset(${(1 - reveal) * 50}% round 24px)`;
      visuals[i].style.zIndex = String(i);
      buttons[i].setAttribute('aria-pressed', String(i === selected));
      buttons[i].classList.toggle('is-complete', i <= selected);
      visuals[i].querySelectorAll('.story-information li').forEach((item, index) => {
        const progress = clamp((time - i * chapterInterval - .25 - index * .1) / .3);
        item.style.opacity = String(progress);
        item.style.transform = `translateX(${(1 - progress) * -24}px)`;
      });
    });
    messageSequences.forEach((sequence, i) => {
      const chapterTime = time - i * chapterInterval;
      sequence.forEach(({ element, start }) => {
        const reveal = clamp((chapterTime - start) / .3);
        element.style.setProperty('--story-reveal', String(reveal));
        element.inert = reveal === 0;
        element.setAttribute('aria-hidden', String(reveal === 0));
      });
    });
  };
  const animate = timestamp => {
    animationFrame = undefined;
    if (!enhanced) return;
    const target = targetTime();
    const elapsed = previousFrameTime === undefined ? 16 : Math.min(64, timestamp - previousFrameTime);
    previousFrameTime = timestamp;
    currentTime += (target - currentTime) * (1 - Math.exp(-elapsed / 140));
    const settled = Math.abs(target - currentTime) < .0001;
    if (settled) currentTime = target;
    render(currentTime);
    if (!settled) animationFrame = requestAnimationFrame(animate);
    else previousFrameTime = undefined;
  };
  const update = () => {
    if (enhanced && animationFrame === undefined) animationFrame = requestAnimationFrame(animate);
  };
  const configure = () => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    previousFrameTime = undefined;
    enhanced = desktop.matches && !reduced.matches && innerHeight >= 760
      && story.closest('[data-hero-motion]')?.dataset.heroMotion === 'true';
    story.classList.toggle('is-enhanced', enhanced);
    stage.hidden = !enhanced;
    chapters.forEach((chapter, i) => {
      chapter.hidden = false;
      chapter.inert = false;
      chapter.removeAttribute('aria-hidden');
      chapter.style.removeProperty('opacity');
      chapter.style.removeProperty('transform');
      visuals[i].hidden = false;
      visuals[i].inert = false;
      visuals[i].removeAttribute('aria-hidden');
      visuals[i].style.removeProperty('clip-path');
      visuals[i].style.removeProperty('z-index');
      visuals[i].querySelectorAll('.story-information li').forEach(item => {
        item.style.removeProperty('opacity');
        item.style.removeProperty('transform');
      });
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
    if (enhanced) {
      currentTime = targetTime();
      render(currentTime);
    }
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => {
    if (!enhanced) return;
    const top = scrollY + story.getBoundingClientRect().top;
    const travel = story.offsetHeight - frame.offsetHeight;
    const time = i === 0 ? 0 : i * chapterInterval + transitionDuration + .1;
    scrollTo({ top: top + travel * time / duration, behavior: 'smooth' });
  }));
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', configure, { passive: true });
  desktop.addEventListener('change', configure);
  reduced.addEventListener('change', configure);
  new MutationObserver(configure).observe(document.documentElement, { attributes: true, attributeFilter: ['data-font-scale'] });
  document.fonts.ready.then(configure);
  configure();
});
