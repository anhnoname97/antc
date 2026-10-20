// Hero motion from the embedded "cuoc-thi" page in the supplied HTML reference.
export function animateContestHeroes(page) {
  const { gsap, ScrollTrigger } = window;
  if (!gsap) return;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  for (const hero of page.querySelectorAll('.ph')) {
    const media = gsap.matchMedia(hero);
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const find = selector => hero.querySelectorAll(selector);
      const number = hero.querySelector('.ph-num');
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      gsap.set(find('[data-line]'), { yPercent: 110 });
      intro
        .fromTo(find('.ph-sky'), { opacity: 0 }, { opacity: 1, duration: 1 }, 0)
        .fromTo(find('.ph-drum'), { scale: .8, opacity: 0 }, { scale: 1, opacity: .14, duration: 1.8 }, 0)
        .fromTo(number, { y: number.offsetHeight * .3, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4 }, .2)
        .from(find('.crumb, .eyebrow'), { autoAlpha: 0, y: 16, duration: .7, stagger: .1 }, .4)
        .to(find('[data-line]'), { yPercent: 0, duration: 1, stagger: .12 }, .5)
        .from(find('.lead, .ph-links, [data-intro]'), { autoAlpha: 0, y: 20, duration: .7, stagger: .12 }, 1);

      if (ScrollTrigger) {
        // Separate yPercent from the entry's pixel offset so the two motions compose.
        gsap.fromTo(number, { yPercent: 0 }, {
          yPercent: -25,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
      }
      // Keep focused controls immediately visible when navigating with a keyboard.
      const revealFocusedContent = () => intro.progress(1);
      hero.addEventListener('focusin', revealFocusedContent);
      return () => hero.removeEventListener('focusin', revealFocusedContent);
    });

    // The reference omits continuous rotation on small screens and data-saving devices.
    if (!navigator.connection?.saveData) {
      media.add('(min-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.to(hero.querySelector('.ph-drum'), { rotation: 360, duration: 180, repeat: -1, ease: 'none' });
      });
    }
  }
}
