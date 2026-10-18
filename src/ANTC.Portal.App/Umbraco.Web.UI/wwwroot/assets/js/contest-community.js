// Community cards and next-section motion from the embedded reference HTML.
export function animateContestCommunity(page) {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia(page);

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const cards = [...page.querySelectorAll('.contest-half .fbk, .contest-half .share')];
    if (cards.length) {
      // CMS stores the cards in separate grid items; use the first section's
      // content edge as the reference HTML's shared .duo trigger position.
      const origin = cards[0].closest('.contest-half');
      const contentEdge = () => parseFloat(getComputedStyle(origin).paddingTop) || 0;
      gsap.fromTo(cards, { autoAlpha: 0, y: 50, scale: .96 }, {
        autoAlpha: 1, y: 0, scale: 1, stagger: .15, ease: 'power2.out',
        scrollTrigger: {
          trigger: origin,
          start: () => `top+=${contentEdge()} 90%`,
          end: () => `top+=${contentEdge()} 50%`,
          scrub: .6
        }
      });
    }
    for (const section of page.querySelectorAll('.next')) {
      gsap.from(section.querySelectorAll('a.big, p, .next-cta'), {
        autoAlpha: 0, y: 30, stagger: .1, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 50%', scrub: .6 }
      });
    }
    for (const share of page.querySelectorAll('.contest-half .share')) {
      gsap.from(share.querySelectorAll('.fam span'), {
        autoAlpha: 0, scale: .4, stagger: .1, ease: 'back.out(2)',
        scrollTrigger: { trigger: share, start: 'top 85%', end: 'top 55%', scrub: .6 }
      });
    }
  });
  if (!navigator.connection?.saveData) {
    media.add('(min-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.to(page.querySelectorAll('.next-drum'), { rotation: 360, duration: 180, repeat: -1, ease: 'none' });
    });
  }
  const refresh = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
  // The API-driven quiz above these cards can grow after load, on each question,
  // and on results/restart. Refresh against real layout, not the loading skeleton.
  let refreshFrame;
  const layoutObserver = new ResizeObserver(() => {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(refresh);
  });
  layoutObserver.observe(page);
  window.addEventListener('pageshow', event => {
    if (event.persisted) { layoutObserver.observe(page); refresh(); }
  });
  window.addEventListener('pagehide', () => {
    layoutObserver.disconnect();
    cancelAnimationFrame(refreshFrame);
  }, { once: true });
}
