// FE-34: hieu ung dung chung, HTML luon hien day du khi JS/GSAP khong kha dung.
const pending = new WeakSet();
const active = new WeakMap();
let refreshFrame;
export function refreshMotion() {
  cancelAnimationFrame(refreshFrame);
  refreshFrame = requestAnimationFrame(() => {
    window.ScrollTrigger?.sort();
    window.ScrollTrigger?.refresh();
  });
}
export function markMotion(root, selector, attribute) {
  for (const element of root.querySelectorAll(selector)) element.setAttribute(attribute, '');
}
export function initMotion(root = document, { desktopOnly = false } = {}) {
  if (active.has(root) || pending.has(root)) { refreshMotion(); return; }
  pending.add(root);
  // Cac adapter danh dau xong trong cung luot truoc khi doc data-.
  requestAnimationFrame(() => {
    pending.delete(root);
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(root);
    const connection = navigator.connection;
    const select = selector => [...root.querySelectorAll(selector)].filter(el => el.closest('[data-hero-motion]')?.dataset.heroMotion !== 'false');
    const setup = () => {
      media.revert();
      media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 901px)', full: '(min-width: 760px)', pageWidth: desktopOnly ? '(min-width: 1101px)' : '(min-width: 0px)' }, context => {
        if (!context.conditions.motion || !context.conditions.pageWidth) return;
        const light = !context.conditions.full || connection?.saveData;
        const cleanup = [];
        const reveal = (targets, trigger, from = {}, options = {}) => {
          const items = gsap.utils.toArray(targets);
          if (!items.length || !trigger) return;
          const once = trigger.hasAttribute('data-motion-once');
          const tween = gsap.fromTo(items, { autoAlpha: 0, y: light ? 16 : 40, ...from }, {
            autoAlpha: 1, x: 0, y: 0, scale: 1, ...(from.rotation == null ? {} : { rotation: 0 }), ease: 'power2.out', ...options,
            scrollTrigger: { trigger, start: 'top 94%', end: 'top 70%', ...(once ? { once: true } : { scrub: .6 }) }
          });
          // Khong revert ve trang thai an khi dung scrub de hien noi dung dang focus.
          const focus = () => { tween.scrollTrigger?.kill(false, true); tween.progress(1).pause(); };
          trigger.addEventListener('focusin', focus);
          cleanup.push(() => trigger.removeEventListener('focusin', focus));
        };
        for (const el of select('[data-rv]')) reveal(el, el);
        // The du thi nghieng 4 do roi thang dan theo ban HTML mau.
        if (!light) for (const el of select('[data-motion-tilt]')) {
          const tilt = gsap.fromTo(el, { rotation: 4 }, { rotation: 0, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 55%', scrub: .6 } });
          const focus = () => { tilt.scrollTrigger?.kill(false, true); tilt.progress(1).pause(); };
          el.addEventListener('focusin', focus);
          cleanup.push(() => el.removeEventListener('focusin', focus));
        }
        for (const el of select('[data-rvs]')) reveal([...el.children].filter(child => !child.matches('.next-drum, svg')), el, {}, { stagger: light ? .05 : .15 });
        for (const group of select('[data-rvx]')) [...group.children].forEach((el, i) => reveal(el, el, { x: light ? 0 : i % 2 ? 60 : -60, y: 0 }));
        for (const el of select('[data-motion-medal]')) reveal(el, el, { rotation: -120, scale: .4 });
        for (const el of select('[data-motion-count]')) {
          const text = el.textContent, target = Number(el.dataset.motionCount);
          if (!Number.isFinite(target) || light) continue;
          const value = { current: 0 };
          gsap.to(value, { current: target, ease: 'none', scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 70%', scrub: .6 }, onUpdate: () => { el.textContent = String(Math.round(value.current)); } });
          cleanup.push(() => { el.textContent = text; });
        }
        for (const hero of select('[data-motion-hero]')) {
          const find = selector => hero.querySelectorAll(selector);
          const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
          intro.from(find('.crumb, .eyebrow, .lead, .ph-links, [data-intro]'), { autoAlpha: 0, y: light ? 8 : 20, duration: .7, stagger: .1 }, 0)
            .fromTo(find('[data-line]'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: .12 }, .1);
          const num = hero.querySelector('.ph-num');
          if (num && !light) gsap.fromTo(num, { yPercent: 0 }, { yPercent: -25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
          const focus = () => intro.progress(1);
          hero.addEventListener('focusin', focus); cleanup.push(() => hero.removeEventListener('focusin', focus));
        }
        if (!light) for (const el of select('[data-motion-rotate]')) gsap.to(el, { rotation: 360, duration: 180, repeat: -1, ease: 'none' });
        for (const schedule of select('[data-motion-schedule]')) {
          if (innerWidth <= 1000) { for (const month of schedule.querySelectorAll('.mo')) reveal(month, month); continue; }
          const fill = schedule.querySelector('.sched-fill');
          if (fill) gsap.fromTo(fill, { width: '0%' }, { width: `${schedule.dataset.scheduleProgress}%`, ease: 'none', scrollTrigger: { trigger: schedule, start: 'top 80%', end: 'top 35%', scrub: .6 } });
          reveal(schedule.querySelectorAll('.mo'), schedule, {}, { stagger: .08 });
        }
        for (const process of select('[data-motion-process]')) {
          if (!context.conditions.desktop || light) { for (const step of process.querySelectorAll('.pstep')) reveal(step, step); continue; }
          const line = process.querySelector('.pf');
          if (line) gsap.fromTo(line, { width: '0%' }, { width: '100%', ease: 'none', scrollTrigger: { trigger: process, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
          reveal(process.querySelectorAll('.pstep'), process, {}, { stagger: .15 });
        }
        for (const section of select('[data-motion-methods]')) {
          const track = section.querySelector('.track');
          if (!track) continue;
          const cards = [...track.children], distance = () => Math.max(0, track.scrollWidth - root.clientWidth);
          if (context.conditions.desktop && !light && cards.length > 1 && distance() > 0) {
            section.classList.add('is-horizontal');
            const number = section.querySelector('[data-method-number]'), bar = section.querySelector('.tac-bar i');
            const oldNumber = number?.textContent, oldWidth = bar?.style.width;
            const tween = gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, pin: section.querySelector('.tac-pin'), scrub: .6, invalidateOnRefresh: true, onUpdate: self => {
              if (number) number.textContent = String(Math.min(cards.length, 1 + Math.floor(self.progress * cards.length))).padStart(2, '0');
              if (bar) bar.style.width = `${self.progress * 100}%`;
            } } });
            cards.forEach(card => gsap.fromTo(card, { autoAlpha: .35, scale: .94 }, { autoAlpha: 1, scale: 1, scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 95%', end: 'left 60%', scrub: .5 } }));
            cleanup.push(() => { section.classList.remove('is-horizontal'); if (number) number.textContent = oldNumber; if (bar) bar.style.width = oldWidth; });
          } else cards.forEach(card => reveal(card, card));
        }
        refreshMotion();
        return () => { cleanup.forEach(fn => fn()); refreshMotion(); };
      });
    };
    try { setup(); } catch (error) { media.revert(); console.warn('Khong khoi tao duoc hieu ung cuon.', error); }
    const observer = new ResizeObserver(refreshMotion);
    observer.observe(root === document ? document.documentElement : root);
    const change = () => { setup(); refreshMotion(); };
    connection?.addEventListener('change', change);
    document.fonts?.ready.then(refreshMotion);
    window.addEventListener('load', refreshMotion, { once: true });
    active.set(root, media);
    // BFCache giu nguyen DOM/context; chi dung quan sat khi trang an.
    window.addEventListener('pagehide', () => observer.disconnect());
    window.addEventListener('pageshow', () => { observer.observe(root === document ? document.documentElement : root); refreshMotion(); });
    refreshMotion();
  });
}
