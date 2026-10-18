const reduced = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-safety-reminder]').forEach(block => {
  let observer;
  const entrances = [...block.querySelectorAll('[data-safety-entrance]')];
  const configure = () => {
    observer?.disconnect();
    const animate = !reduced.matches && 'IntersectionObserver' in window
      && block.closest('[data-hero-motion]')?.dataset.heroMotion === 'true';
    block.classList.toggle('is-animated', animate);
    if (!animate) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });
    entrances.forEach(element => { if (!element.classList.contains('is-visible')) observer.observe(element); });
  };
  reduced.addEventListener('change', configure);
  configure();
});
