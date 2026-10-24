const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 1101px)');
const clamp = value => Math.max(0, Math.min(1, value));
document.querySelectorAll('[data-official-contacts]').forEach(block => {
  const steps = block.querySelector('[data-contact-steps]');
  const items = [...block.querySelectorAll('[data-contact-step]')];
  const warning = block.querySelector('[data-contact-warning]');
  let enabled = false;
  let animationFrame;
  let previousFrameTime;
  let current;
  const contents = items.map(item => [...item.children].filter(child => !child.classList.contains('official-contacts__number')));
  const targets = () => {
    const rect = steps?.getBoundingClientRect();
    const progress = rect ? clamp((innerHeight * .86 - rect.top) / ((rect.height + innerHeight * .25) * 4 / 3)) : 1;
    const mobile = items.map(item => clamp((innerHeight * .88 - item.getBoundingClientRect().top) / (innerHeight * .44)));
    const warningTop = warning ? block.getBoundingClientRect().top + warning.offsetTop : 0;
    return [progress, ...mobile, warning ? clamp((innerHeight * .92 - warningTop) / (innerHeight * .4)) : 1];
  };
  const paint = values => {
    block.style.setProperty('--contact-progress', String(values[0]));
    items.forEach((item, i) => {
      const time = desktop.matches ? values[0] * 2.6 - i * .85 : values[i + 1];
      item.style.setProperty('--number-reveal', String(clamp(time / .35)));
      contents[i].forEach((child, index) => child.style.setProperty('--content-reveal', String(clamp((time - .2 - index * .08) / .35))));
      item.dataset.active = String(time > .3);
    });
    if (warning) {
      const time = values.at(-1) * .8;
      block.style.setProperty('--warning-reveal', String(clamp(time / .6)));
      block.style.setProperty('--warning-copy-reveal', String(clamp((time - .35) / .3)));
      block.style.setProperty('--warning-call-reveal', String(clamp((time - .5) / .3)));
    }
  };
  const animate = timestamp => {
    animationFrame = undefined;
    if (!enabled) return;
    const target = targets();
    const elapsed = previousFrameTime === undefined ? 16 : Math.min(64, timestamp - previousFrameTime);
    previousFrameTime = timestamp;
    const factor = 1 - Math.exp(-elapsed / 140);
    current = current.map((value, i) => value + (target[i] - value) * factor);
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
    enabled = desktop.matches && !reduced.matches && block.closest('[data-hero-motion]')?.dataset.heroMotion === 'true';
    block.classList.toggle('is-animated', enabled);
    if (!enabled) block.style.removeProperty('--contact-progress');
    else {
      current = targets();
      paint(current);
    }
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
  reduced.addEventListener('change', configure);
  desktop.addEventListener('change', configure);
  document.fonts.ready.then(update);
  configure();
});
