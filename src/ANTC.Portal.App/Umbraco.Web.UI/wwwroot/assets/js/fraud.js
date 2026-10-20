const page = document.getElementById('nj-thu-doan');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const normalize = value => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();

// The query stays in this page; personal identifiers are never submitted or stored.
const form = page?.querySelector('[data-fraud-search]');
const categories = page?.querySelector('[data-fraud-categories]');
const status = page?.querySelector('[data-fraud-results]');
function filter() {
  if (!form || !categories || !status) return;
  const value = normalize(form.querySelector('input').value);
  const privateNumber = /\d[\d\s.()+-]{3,}\d/.test(value) || /\d{4,}/.test(value);
  let count = 0;
  categories.querySelectorAll('.area').forEach(area => {
    const match = privateNumber || !value || value.split(' ').every(word => normalize(`${area.textContent} ${area.dataset.k}`).includes(word));
    area.hidden = !match;
    if (match) count++;
  });
  status.textContent = privateNumber ? categories.dataset.privacyMessage : count ? '' : categories.dataset.emptyText;
  status.style.display = status.textContent ? 'block' : 'none';
  window.ScrollTrigger?.refresh();
}
form?.querySelector('input').addEventListener('input', filter);
form?.addEventListener('submit', event => {
  event.preventDefault();
  filter();
  categories?.closest('.home-section')?.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
});
filter();

function setupMotion() {
  const { gsap, ScrollTrigger } = window;
  if (!page || !gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 901px)', rotate: '(min-width: 760px)' }, context => {
    const { motion, desktop, rotate } = context.conditions;
    if (!motion) return;
    const enabled = element => element.closest('[data-hero-motion]')?.dataset.heroMotion === 'true';
    const q = selector => [...page.querySelectorAll(selector)].filter(enabled);
    const hero = page.querySelector('.ph');
    if (hero && enabled(hero)) {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline.fromTo(hero.querySelector('.ph-sky'), { opacity: 0 }, { opacity: 1, duration: 1 }, 0)
        .fromTo(hero.querySelector('.ph-drum'), { scale: .8, opacity: 0 }, { scale: 1, opacity: .14, duration: 1.8 }, 0)
        .fromTo(hero.querySelector('.ph-num'), { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4 }, .2)
        .from(hero.querySelectorAll('.crumb, .eyebrow'), { autoAlpha: 0, y: 16, duration: .7, stagger: .1 }, .4)
        .fromTo(hero.querySelectorAll('[data-line]'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: .12 }, .5)
        .from(hero.querySelectorAll('.lead, [data-intro]'), { autoAlpha: 0, y: 20, duration: .7, stagger: .12 }, 1);
      gsap.to(hero.querySelector('.ph-num'), { yPercent: -25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    // Rotate the image only. Its positioned wrapper keeps the center fixed.
    if (rotate && !navigator.connection?.saveData) q('.ph-drum img, .next-drum img').forEach(image => gsap.to(image, { rotation: 360, duration: 180, repeat: -1, ease: 'none' }));
    q('[data-rv]').forEach(element => gsap.fromTo(element, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 94%', end: 'top 70%', scrub: .6 } }));
    q('[data-rvs]').forEach(group => gsap.fromTo(group.children, { autoAlpha: 0, y: 50, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, stagger: .15, ease: 'power2.out', scrollTrigger: { trigger: group, start: 'top 90%', end: 'top 50%', scrub: .6 } }));
    q('[data-rvx] .area').forEach((element, index) => gsap.fromTo(element, { autoAlpha: 0, x: index % 2 ? 60 : -60 }, { autoAlpha: 1, x: 0, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 94%', end: 'top 70%', scrub: .6 } }));
    q('.thing').forEach(element => ScrollTrigger.create({ trigger: element, start: 'top 70%', onEnter: () => element.classList.add('on'), onLeaveBack: () => element.classList.remove('on') }));
    q('.thing .n').forEach(element => gsap.fromTo(element, { scale: .5, rotation: -20 }, { scale: 1, rotation: 0, ease: 'back.out(1.6)', scrollTrigger: { trigger: element, start: 'top 92%', end: 'top 70%', scrub: .6 } }));
    q('.next').forEach(next => gsap.from(next.querySelectorAll('a.big, p, .next-cta'), { autoAlpha: 0, y: 30, stagger: .1, ease: 'power2.out', scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 50%', scrub: .6 } }));
    q('[data-fraud-methods]').forEach(section => {
      const track = section.querySelector('.track');
      const cards = [...track.children];
      const distance = () => Math.max(0, track.scrollWidth - page.clientWidth);
      if (desktop && cards.length > 1 && distance() > 0) {
        section.classList.add('is-horizontal');
        const tween = gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: {
          trigger: section, start: 'top top', end: () => `+=${distance()}`, pin: section.querySelector('.tac-pin'), scrub: .6, invalidateOnRefresh: true,
          onUpdate: self => {
            section.querySelector('[data-method-number]').textContent = String(Math.min(cards.length, 1 + Math.floor(self.progress * cards.length))).padStart(2, '0');
            section.querySelector('.tac-bar i').style.width = `${self.progress * 100}%`;
          }
        } });
        cards.forEach(card => gsap.fromTo(card, { autoAlpha: .35, scale: .94, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 95%', end: 'left 60%', scrub: .5 } }));
      } else {
        cards.forEach((card, index) => gsap.fromTo(card, { autoAlpha: 0, x: index % 2 ? 50 : -50 }, { autoAlpha: 1, x: 0, scrollTrigger: { trigger: card, start: 'top 94%', end: 'top 72%', scrub: .6 } }));
      }
    });
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => {
      q('.is-horizontal').forEach(section => section.classList.remove('is-horizontal'));
      q('.thing.on').forEach(element => element.classList.remove('on'));
    };
  }, page);
  // Focus makes interactive content readable even mid-reveal.
  page.addEventListener('focusin', event => {
    const element = event.target.closest('[data-rv], .area, .deep > a, .next-cta, [data-intro]');
    if (element) gsap.set(element, { autoAlpha: 1 });
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  document.querySelector('[data-font-toggle]')?.addEventListener('click', () => requestAnimationFrame(() => ScrollTrigger.refresh()));
}
if (document.readyState === 'complete') setupMotion();
else addEventListener('load', setupMotion, { once: true });
