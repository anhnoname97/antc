// Shared frame interactions and drum artwork from the supplied HTML.
export function initReferencePage(page) {
  const header = document.querySelector('[data-contest-header]');
  const menu = document.getElementById('contest-nav');
  const toggle = document.querySelector('[data-contest-menu]');
  // Same-page Hero buttons use the reference's smooth scroll and live header offset.
  page.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('.ph-links a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const offset = header ? header.offsetHeight + 10 : 0;
    window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + scrollY - offset),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });
  if (header) {
    const updateHeader = () => header.classList.toggle('is-scrolled', scrollY > (page.querySelector('.ph')?.offsetHeight || 500) - 90);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
    document.querySelector('[data-contest-banner-close]')?.addEventListener('click', () => header.classList.add('no-bar'));
  }
  if (toggle && menu) {
    function closeMenu() { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Mở menu'); }
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });
    window.addEventListener('scroll', () => { if (matchMedia('(max-width: 1100px)').matches && menu.classList.contains('open')) closeMenu(); }, { passive: true });
    menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); toggle.focus(); } });
    document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  }

  // Decorative drum pattern from the supplied contest design.
var NS='http://www.w3.org/2000/svg';
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function drum(svg){var g=el('g',{fill:'none',stroke:'#E3C88F','stroke-width':1.3},svg);
[60,96,150,200,262,330,400,470].forEach(function(r,i){el('circle',{r:r,'stroke-dasharray':i%3===2?'3 9':'none'},g)});
var d='';for(var i=0;i<28;i++){var a=i*Math.PI/14,r=i%2?22:58;d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1)}el('path',{d:d+'Z',fill:'#E3C88F',stroke:'none'},g);
for(i=0;i<36;i++){var b=i*Math.PI/18;el('path',{d:'M'+(Math.cos(b)*205)+' '+(Math.sin(b)*205)+'L'+(Math.cos(b+.06)*255)+' '+(Math.sin(b+.06)*255)},g)}
for(i=0;i<18;i++){var c=i*Math.PI/9;el('path',{d:'M-20 0Q0 -14 22 -4L34 -12M-20 0Q-2 8 20 4',transform:'translate('+(Math.cos(c)*296)+' '+(Math.sin(c)*296)+') rotate('+(c*180/Math.PI+90)+')'},g)}
for(i=0;i<72;i++){var e=i*Math.PI/36;el('circle',{cx:Math.cos(e)*365,cy:Math.sin(e)*365,r:3.5},g)}
for(i=0;i<48;i++){var f=i*Math.PI/24;el('path',{d:'M'+(Math.cos(f)*415)+' '+(Math.sin(f)*415)+'L'+(Math.cos(f)*455)+' '+(Math.sin(f)*455)},g)}}

  page.querySelectorAll('svg[data-drum]').forEach(drum);
}
