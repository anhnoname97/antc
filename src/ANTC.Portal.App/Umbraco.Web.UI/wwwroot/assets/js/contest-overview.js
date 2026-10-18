// Scroll effects from the reference HTML's competition overview section.
export function animateContestOverviews(page) {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  for (const section of page.querySelectorAll('[data-contest-overview]')) {
    const media = gsap.matchMedia(section);
    const counters = [...section.querySelectorAll('[data-overview-count]')];
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const copy = section.querySelector('[data-overview-copy]');
      const ticket = section.querySelector('.ticket');
      gsap.fromTo(copy, { autoAlpha: 0, y: 40 }, {
        autoAlpha: 1, y: 0, ease: 'power2.out',
        scrollTrigger: { trigger: copy, start: 'top 94%', end: 'top 70%', scrub: .6 }
      });
      // The reference reveals the card earlier than its tilt finishes.
      gsap.fromTo(ticket, { autoAlpha: 0, y: 40 }, {
        autoAlpha: 1, y: 0, ease: 'power2.out',
        scrollTrigger: { trigger: ticket, start: 'top 94%', end: 'top 70%', scrub: .6 }
      });
      for (const counter of counters) {
        const target = Number(counter.dataset.overviewCount);
        if (!Number.isFinite(target)) continue;
        const value = { current: 0 };
        gsap.to(value, {
          current: target, ease: 'none',
          scrollTrigger: { trigger: counter, start: 'top 92%', end: 'top 65%', scrub: .6 },
          onUpdate: () => { counter.textContent = String(Math.round(value.current)); }
        });
      }
      // Keep the original separate tilt track and its wider scroll range.
      gsap.fromTo(ticket, { rotation: 4, y: 60 }, {
        rotation: 0, y: 0, ease: 'power2.out',
        scrollTrigger: { trigger: ticket, start: 'top 95%', end: 'top 55%', scrub: .6 }
      });
      gsap.from(ticket.querySelectorAll('li'), {
        autoAlpha: 0, x: -20, stagger: .1,
        scrollTrigger: { trigger: ticket, start: 'top 75%', end: 'top 45%', scrub: .6 }
      });
      // Text changes are outside GSAP's style restoration; restore the CMS values explicitly.
      return () => {
        for (const counter of counters) counter.textContent = counter.dataset.overviewCount;
      };
    });
    if (!navigator.connection?.saveData) {
      media.add('(min-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.to(section.querySelector('.tdrum'), { rotation: 360, duration: 180, repeat: -1, ease: 'none' });
      });
    }
  }
  // Fonts can change section heights after the scroll positions were first calculated.
  const refresh = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
}
