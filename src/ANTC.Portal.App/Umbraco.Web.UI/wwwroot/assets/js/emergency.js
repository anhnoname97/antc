const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const lite = matchMedia('(max-width: 1100px)');
document.querySelectorAll('[data-warning-signs]').forEach(block => {
  const inputs = [...block.querySelectorAll('input[type=checkbox]')];
  const box = block.querySelector('.stopbox');
  let pulse;
  const update = (animate = false) => {
    const count = inputs.filter(input => input.checked).length;
    box.classList.toggle('hit', count > 0);
    block.querySelector('[data-warning-title]').textContent = count ? block.dataset.hitTitle.replace('{count}', count) : block.dataset.idleTitle;
    block.querySelector('[data-warning-text]').textContent = count ? block.dataset.hitText : block.dataset.idleText;
    if (animate && count && !reduced.matches && !lite.matches && block.closest('[data-hero-motion]')?.dataset.heroMotion === 'true') {
      pulse?.cancel();
      pulse = box.animate([{ transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    }
  };
  inputs.forEach(input => input.addEventListener('change', () => update(true)));
  addEventListener('pageshow', () => update());
  reduced.addEventListener('change', () => { if (reduced.matches) pulse?.cancel(); });
  update();
});

document.querySelectorAll('[data-emergency-page]').forEach(page => {
  const sections = [...page.querySelectorAll('[data-hero-motion]')];
  const line = page.querySelector('[data-question-line]');
  const hero = page.querySelector('.ph');
  const heroNumber = hero?.querySelector('.ph-num');
  const clamp = value => Math.max(0, Math.min(1, value));
  const easeOut = value => 1 - (1 - value) ** 3;
  const backOut = value => 1 + 3 * (value - 1) ** 3 + 2 * (value - 1) ** 2;
  const geometry = new Map();
  const tracks = [];
  const add = (element, start, end, paint, smoothing = 180) => {
    if (!element) return;
    tracks.push({ element, paint, smoothing, progress: () => clamp((innerHeight * start - (geometry.get(element).top - scrollY)) / (innerHeight * (start - end))) });
  };
  page.querySelectorAll('[data-emergency-reveal]').forEach(element => {
    if (element.closest('.choose, .alt, .nums, .next')) return;
    const sign = element.classList.contains('sign');
    const index = sign ? [...element.parentElement.children].indexOf(element) : 0;
    add(element, .94, .70, progress => {
      const reveal = easeOut(progress);
      element.style.setProperty('--emergency-reveal', String(reveal));
      element.style.setProperty('--emergency-offset-x', `${sign ? (index % 2 ? 60 : -60) * (1 - reveal) : 0}px`);
      element.style.setProperty('--emergency-offset-y', `${sign ? 0 : 40 * (1 - reveal)}px`);
      element.style.setProperty('--emergency-scale', '1');
    });
  });
  page.querySelectorAll('.choose, .alt, .nums').forEach(group => {
    const children = [...group.children];
    const duration = .5 + Math.max(0, children.length - 1) * .15;
    add(group, .9, .5, progress => children.forEach((element, index) => {
      const reveal = easeOut(clamp((progress * duration - index * .15) / .5));
      element.style.setProperty('--emergency-reveal', String(reveal));
      element.style.setProperty('--emergency-offset-x', '0px');
      element.style.setProperty('--emergency-offset-y', `${50 * (1 - reveal)}px`);
      element.style.setProperty('--emergency-scale', String(.96 + .04 * reveal));
    }));
  });
  const next = page.querySelector('.next');
  const nextChildren = next ? [...next.querySelectorAll('a.big, p, .next-cta')] : [];
  const nextDuration = .5 + Math.max(0, nextChildren.length - 1) * .1;
  add(next, .85, .5, progress => nextChildren.forEach((element, index) => {
    const reveal = easeOut(clamp((progress * nextDuration - index * .1) / .5));
    element.style.setProperty('--next-reveal', String(reveal));
  }));
  page.querySelectorAll('.qi i').forEach(number => {
    add(number, .72, .6, progress => {
      const reveal = backOut(progress);
      const color = clamp(reveal);
      number.style.setProperty('--question-number-scale', String(.4 + .6 * reveal));
      number.style.setProperty('--question-number-background', `rgb(${255 + (168 - 255) * color} ${255 + (95 - 255) * color} ${255 * (1 - color)})`);
      number.style.setProperty('--question-number-color', `rgb(${168 + (255 - 168) * color} ${95 + (255 - 95) * color} ${255 * color})`);
    }, 150);
  });
  page.querySelectorAll('.qi b, .qi strong').forEach(text => {
    add(text, .75, .55, progress => text.style.setProperty('--question-highlight', `${progress * 100}%`), 150);
  });
  page.querySelectorAll('.num .big').forEach(number => {
    add(number, .95, .75, progress => number.style.setProperty('--contact-number-reveal', String(easeOut(progress))));
  });
  if (line) tracks.push({ element: line, smoothing: 120,
    progress: () => clamp((innerHeight * .7 - (geometry.get(line).top - scrollY)) / Math.max(1, geometry.get(line).height)),
    paint: progress => line.style.setProperty('--question-progress', String(progress)) });
  if (hero && heroNumber) tracks.push({ element: hero, smoothing: 0,
    progress: () => clamp((scrollY - geometry.get(hero).top) / Math.max(1, geometry.get(hero).height)),
    paint: progress => heroNumber.style.setProperty('--hero-number-parallax', `${-.25 * heroNumber.offsetHeight * progress}px`) });
  let enabled = false;
  let animationFrame;
  let previousFrameTime;
  let current = [];
  const targets = () => tracks.map(track => track.progress());
  const paint = values => tracks.forEach((track, index) => {
    if (track.element.closest('.is-emergency-animated')) track.paint(values[index]);
  });
  const animate = timestamp => {
    animationFrame = undefined;
    if (!enabled) return;
    const target = targets();
    const elapsed = previousFrameTime === undefined ? 16 : Math.min(64, timestamp - previousFrameTime);
    previousFrameTime = timestamp;
    current = current.map((value, i) => tracks[i].smoothing === 0 ? target[i]
      : value + (target[i] - value) * (1 - Math.exp(-elapsed / tracks[i].smoothing)));
    const settled = current.every((value, i) => Math.abs(target[i] - value) < .0001);
    if (settled) current = target;
    paint(current);
    if (!settled) animationFrame = requestAnimationFrame(animate);
    else previousFrameTime = undefined;
  };
  const update = () => {
    if (enabled && animationFrame === undefined) animationFrame = requestAnimationFrame(animate);
  };
  const configure = () => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    previousFrameTime = undefined;
    enabled = !reduced.matches && !lite.matches;
    sections.forEach(section => section.classList.toggle('is-emergency-animated', enabled && section.dataset.heroMotion === 'true'));
    page.classList.toggle('emergency-motion-lite', lite.matches || navigator.connection?.saveData === true);
    page.classList.add('is-emergency-measuring');
    tracks.forEach(track => {
      const element = track.element.classList.contains('signs-side') ? track.element.parentElement : track.element;
      const rect = element.getBoundingClientRect();
      geometry.set(track.element, { top: rect.top + scrollY, height: rect.height });
    });
    page.classList.remove('is-emergency-measuring');
    if (!enabled) {
      line?.style.removeProperty('--question-progress');
      heroNumber?.style.removeProperty('--hero-number-parallax');
    } else {
      current = targets();
      paint(current);
    }
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', configure, { passive: true });
  reduced.addEventListener('change', configure);
  lite.addEventListener('change', configure);
  new MutationObserver(configure).observe(document.documentElement, { attributes: true, attributeFilter: ['data-font-scale'] });
  document.fonts.ready.then(configure);
  addEventListener('load', configure, { once: true });
  configure();
});
