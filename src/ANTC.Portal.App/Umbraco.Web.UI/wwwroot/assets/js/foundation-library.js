/* Progressive enhancement: GET search, group filters and pagination also work without JavaScript. */
(() => {
  const root = document.querySelector('[data-foundation-library]');
  if (!root) return;
  const form = root.querySelector('[data-library-search]');
  const input = form.querySelector('[name=q]');
  const groupInput = form.querySelector('[name=group]');
  const groupFormQuery = root.querySelector('#foundation-group-form [name=q]');
  const chips = [...root.querySelectorAll('[data-library-group]')];
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const items = [...root.querySelectorAll('[data-library-item]')].map(element => ({ element, text: normalize(element.dataset.search), group: element.dataset.group }));
  const count = root.querySelector('[data-library-count]');
  const empty = root.querySelector('[data-library-empty]');
  const more = root.querySelector('[data-library-more]');
  let limit = Math.max(20, items.filter(item => !item.element.hidden).length);
  function refresh() {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    const matches = items.filter(item => (!groupInput.value || item.group === groupInput.value) && words.every(word => item.text.includes(word)));
    const visible = new Set(matches.slice(0, limit));
    for (const item of items) item.element.hidden = !visible.has(item);
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset.libraryGroup === groupInput.value));
    groupFormQuery.value = input.value;
    count.textContent = `${matches.length} bài`;
    empty.hidden = matches.length > 0;
    more.hidden = matches.length <= limit;
    more.textContent = `Xem thêm ${Math.max(0, Math.min(20, matches.length - limit))} bài`;
  }
  root.classList.add('foundation-library--enhanced');
  input.addEventListener('input', () => { limit = 20; refresh(); });
  form.addEventListener('submit', event => { event.preventDefault(); limit = 20; refresh(); });
  for (const chip of chips) chip.addEventListener('click', event => { event.preventDefault(); groupInput.value = chip.dataset.libraryGroup; limit = 20; refresh(); });
  more.addEventListener('click', event => {
    event.preventDefault();
    const previous = new Set(items.filter(item => !item.element.hidden));
    limit += 20;
    refresh();
    items.find(item => !item.element.hidden && !previous.has(item))?.element.querySelector('a')?.focus({ preventScroll: true });
  });
  refresh();
})();
