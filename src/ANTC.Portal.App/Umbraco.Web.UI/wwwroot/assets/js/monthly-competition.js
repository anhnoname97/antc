import { initReferencePage } from './reference-page.js';
import { animateContestHeroes } from './contest-hero.js';
const page = document.querySelector('#nj-cuoc-thi-thang');
if (page) {
  initReferencePage(page);
  animateContestHeroes(page);
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) {
    gsap.matchMedia(page).add('(prefers-reduced-motion: no-preference)', () => {
      for (const element of page.querySelectorAll('[data-participation-reveal], [data-prize-reveal], [data-schedule-reveal], [data-results-reveal], [data-faq-reveal], .next a.big, .next p, .next-cta')) {
        gsap.from(element, {
          autoAlpha: 0, y: 30, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 94%', end: 'top 72%', scrub: .6 }
        });
      }
      for (const prizes of page.querySelectorAll('.prizes')) {
        gsap.from(prizes.querySelectorAll('.pz'), {
          autoAlpha: 0, y: 40, stagger: .1, ease: 'power2.out',
          scrollTrigger: { trigger: prizes, start: 'top 92%', end: 'top 65%', scrub: .6 }
        });
        gsap.from(prizes.querySelectorAll('.medal'), {
          rotation: -120, scale: .4, stagger: .1, ease: 'back.out(1.8)',
          scrollTrigger: { trigger: prizes, start: 'top 85%', end: 'top 50%', scrub: .6 }
        });
      }
      const scheduleMedia = gsap.matchMedia(page);
      scheduleMedia.add('(min-width: 1001px) and (prefers-reduced-motion: no-preference)', () => {
        for (const schedule of page.querySelectorAll('.sched')) {
          gsap.timeline({ scrollTrigger: { trigger: schedule, start: 'top 80%', end: 'top 35%', scrub: .6 } })
            .fromTo(schedule.querySelector('.sched-fill'), { width: '0%' }, {
              width: `${schedule.dataset.scheduleProgress}%`, ease: 'none', duration: 1
            }, 0)
            .from(schedule.querySelectorAll('.mo'), { autoAlpha: 0, y: 30, stagger: .08, duration: .3 }, 0);
          const current = schedule.querySelector('.mo.now .d');
          if (current) gsap.fromTo(current, { scale: .6 }, {
            scale: 1, ease: 'back.out(2.5)',
            scrollTrigger: { trigger: schedule, start: 'top 55%', end: 'top 40%', scrub: .6 }
          });
        }
      });
      scheduleMedia.add('(max-width: 1000px) and (prefers-reduced-motion: no-preference)', () => {
        for (const month of page.querySelectorAll('.mo')) {
          gsap.fromTo(month, { autoAlpha: 0, x: -30 }, {
            autoAlpha: 1, x: 0,
            scrollTrigger: { trigger: month, start: 'top 95%', end: 'top 78%', scrub: .6 }
          });
        }
      });
      for (const faq of page.querySelectorAll('.faq')) {
        gsap.from(faq.querySelectorAll('details'), {
          autoAlpha: 0, y: 40, stagger: .1, ease: 'power2.out',
          scrollTrigger: { trigger: faq, start: 'top 92%', end: 'top 65%', scrub: .6 }
        });
      }
      const steps = page.querySelector('.how');
      if (steps) {
        gsap.from(steps.children, {
          autoAlpha: 0, y: 40, stagger: .1, ease: 'power2.out',
          scrollTrigger: { trigger: steps, start: 'top 92%', end: 'top 65%', scrub: .6 }
        });
      }
      gsap.from(page.querySelectorAll('.safe li'), {
        autoAlpha: 0, y: 14, stagger: .08, duration: .5, ease: 'power2.out',
        scrollTrigger: { trigger: page.querySelector('.safe'), start: 'top 90%', once: true }
      });
    });
  }
}
