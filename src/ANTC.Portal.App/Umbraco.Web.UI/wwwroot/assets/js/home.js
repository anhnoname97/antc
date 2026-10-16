// Trang trí Hero độc lập với dữ liệu nội dung và các block triển khai tiếp theo.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 759px)');
const saveData = navigator.connection?.saveData === true;

document.querySelectorAll('[data-site-sections]').forEach(section => {
  const timeline = section.querySelector('[data-section-timeline]');
  const items = [...section.querySelectorAll('.site-sections__item')];
  const enabled = section.closest('.home-section')?.dataset.heroMotion === 'true';
  if (!timeline || !enabled) return;
  let pending = false;
  const update = () => {
    pending = false;
    const rect = timeline.getBoundingClientRect();
    const cursor = innerHeight * .65;
    timeline.style.setProperty('--timeline-progress', `${Math.max(0, Math.min(rect.height, cursor - rect.top))}px`);
    items.forEach(item => item.classList.toggle('is-reached', item.getBoundingClientRect().top < cursor));
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(timeline);
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(item => observer.observe(item));
  }
  update();
});

document.querySelectorAll('[data-hero-particles]').forEach(canvas => {
  const hero = canvas.closest('[data-header-hero="true"]');
  const ctx = canvas.getContext('2d');
  if (!hero || !ctx) return;

  const sample = document.createElement('canvas');
  sample.width = sample.height = 400;
  const brush = sample.getContext('2d');
  if (!brush) return;
  brush.scale(400 / 24, 400 / 24);
  brush.strokeStyle = '#fff';
  brush.lineCap = brush.lineJoin = 'round';
  brush.lineWidth = 1.05;
  const shield = new Path2D('M12 2.8 19.5 5.6v6.1c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V5.6z');
  brush.stroke(shield);
  brush.lineWidth = 1.4;
  brush.stroke(new Path2D('m8.7 12 2.3 2.3 4.3-4.6'));
  brush.globalAlpha = .14;
  brush.fill(shield);
  const pixels = brush.getImageData(0, 0, 400, 400).data;
  const candidates = [];
  for (let y = 0; y < 400; y += 3) {
    for (let x = 0; x < 400; x += 3) {
      const alpha = pixels[(y * 400 + x) * 4 + 3];
      if (alpha > 30 && Math.random() < (alpha > 200 ? .9 : .3)) {
        candidates.push({ tx: x / 400 - .5, ty: y / 400 - .5, outline: alpha > 200 });
      }
    }
  }
  if (!candidates.length) return;
  const count = Math.min(candidates.length, saveData || mobile.matches ? 1000 : 2400);
  const points = Array.from({ length: count }, (_, i) => ({
    ...candidates[Math.floor(i * candidates.length / count)],
    x: (Math.random() - .5) * 2.4, y: (Math.random() - .5) * 2.4,
    vx: 0, vy: 0, phase: Math.random() * Math.PI * 2,
  }));
  let width = 0, height = 0, frame = 0, visible = true;
  const pointer = { x: -9000, y: -9000 };
  const isStatic = () => reducedMotion.matches || mobile.matches || saveData;

  function draw(time, still = false) {
    const scale = Math.min(width, height) * (mobile.matches ? .55 : .74);
    const ox = width * (mobile.matches ? .65 : .7);
    const oy = height * (mobile.matches ? .25 : .44);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    points.forEach(p => {
      const tx = p.tx + (still ? 0 : Math.sin(time * .0006 + p.phase) * .004);
      const ty = p.ty + (still ? 0 : Math.cos(time * .0007 + p.phase) * .004);
      if (still) { p.x = tx; p.y = ty; p.vx = p.vy = 0; }
      else {
        const dx = ox + p.x * scale - pointer.x, dy = oy + p.y * scale - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 110 && scale > 0) {
          const force = (1 - distance / 110) * .04;
          p.vx += dx / scale * force; p.vy += dy / scale * force;
        }
        p.vx = (p.vx + (tx - p.x) * .035) * .86;
        p.vy = (p.vy + (ty - p.y) * .035) * .86;
        p.x += p.vx; p.y += p.vy;
      }
      ctx.fillStyle = p.outline ? 'rgba(227,200,143,.8)' : 'rgba(180,200,230,.35)';
      const size = p.outline ? 1.4 : 1;
      ctx.fillRect(ox + p.x * scale, oy + p.y * scale, size, size);
    });
    ctx.globalCompositeOperation = 'source-over';
  }
  function tick(time) {
    draw(time);
    frame = requestAnimationFrame(tick);
  }
  function update() {
    cancelAnimationFrame(frame);
    frame = 0;
    hero.classList.toggle('hero-motion-lite', isStatic());
    if (isStatic()) draw(0, true);
    else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now(), isStatic());
    hero.classList.add('has-particle-canvas');
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(hero);
  }
  hero.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9000; });
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener('change', update);
  mobile.addEventListener('change', update);
  update();
});
