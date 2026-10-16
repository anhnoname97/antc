const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 901px)');
const clamp = value => Math.max(0, Math.min(1, value));
document.querySelectorAll('[data-official-contacts]').forEach(block => {
  const steps = block.querySelector('[data-contact-steps]');
  const items = [...block.querySelectorAll('[data-contact-step]')];
  const warning = block.querySelector('[data-contact-warning]');
  let enabled = false;
  let pending = false;
  const update = () => {
    pending = false;
    if (!enabled) return;
    const rect = steps?.getBoundingClientRect();
    const progress = rect ? clamp((innerHeight * .8 - rect.top) / (rect.height + innerHeight * .25)) : 1;
    block.style.setProperty('--contact-progress', String(progress));
    items.forEach((item, i) => {
      const time = desktop.matches ? progress * 2.4 - i * .85
        : clamp((innerHeight * .88 - item.getBoundingClientRect().top) / (innerHeight * .33));
      item.style.setProperty('--number-reveal', String(clamp(time / .35)));
      item.style.setProperty('--content-reveal', String(clamp((time - .2) / .35)));
      item.dataset.active = String(time > .3);
    });
    if (warning) {
      const top = block.getBoundingClientRect().top + warning.offsetTop;
      block.style.setProperty('--warning-reveal', String(clamp((innerHeight * .92 - top) / (innerHeight * .3))));
    }
  };
  const configure = () => {
    enabled = !reduced.matches && block.closest('[data-hero-motion]')?.dataset.heroMotion === 'true';
    block.classList.toggle('is-animated', enabled);
    if (!enabled) block.style.removeProperty('--contact-progress');
    update();
  };
  addEventListener('scroll', () => { if (enabled && !pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  reduced.addEventListener('change', configure);
  desktop.addEventListener('change', configure);
  document.fonts.ready.then(update);
  configure();
});
