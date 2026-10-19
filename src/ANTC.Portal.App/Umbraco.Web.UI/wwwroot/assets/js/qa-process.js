// Process timeline matches the scroll ranges and timing of the supplied QA HTML.
export function animateQaProcesses(page) {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  for (const section of page.querySelectorAll('[data-qa-process]')) {
    const media = gsap.matchMedia(section);
    media.add('(prefers-reduced-motion: no-preference)', () => {
      for (const element of section.querySelectorAll('[data-process-reveal]')) {
        gsap.fromTo(element, { autoAlpha: 0, y: 40 }, {
          autoAlpha: 1, y: 0, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 94%', end: 'top 70%', scrub: .6 }
        });
      }
    });
    media.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const process = section.querySelector('.proc');
      const timeline = gsap.timeline({ scrollTrigger: { trigger: process, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
      timeline.fromTo(process.querySelector('.pf'), { width: '0%' }, { width: '100%', ease: 'none', duration: 2.4 }, 0);
      process.querySelectorAll('.pstep').forEach((step, index) => {
        const circle = step.querySelector('i');
        timeline.fromTo(circle, { scale: .3, autoAlpha: 0, rotation: -90, backgroundColor: '#fff', color: '#14233B' },
          { scale: 1, autoAlpha: 1, rotation: 0, duration: .35, ease: 'back.out(1.8)' }, index * .85)
          .to(circle, { backgroundColor: '#14233B', color: '#fff', duration: .2 }, index * .85 + .3)
          .fromTo([...step.children].slice(1), { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, stagger: .08, duration: .35 }, index * .85 + .2);
      });
    });
    media.add('(max-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      for (const step of section.querySelectorAll('.pstep')) {
        gsap.fromTo(step, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0,
          scrollTrigger: { trigger: step, start: 'top 92%', end: 'top 70%', scrub: .6 } });
      }
    });
  }
  const refresh = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
}
