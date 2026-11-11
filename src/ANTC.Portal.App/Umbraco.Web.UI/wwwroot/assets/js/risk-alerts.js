// Cac rui ro (V2-13h): loc tai cho khong tai lai trang, giu bo loc tren dia chi bang history.replaceState.
// Luat loc giong AlertList.Apply o may chu. Khong co JS: may chu da an san the khong khop bo loc tren dia chi.
(function () {
  var page = document.querySelector('[data-risk-alerts]');
  if (!page) return;
  var form = page.querySelector('[data-risk-filters]');
  var results = page.querySelector('[data-risk-results]');
  if (!form || !results) return;

  var STEP = 12;
  var shown = STEP;
  var inputTimer = null;
  var unit = results.getAttribute('data-unit') || 'mục';
  var freshList = results.querySelector('[data-risk-more-list]');
  var freshCards = freshList ? Array.prototype.slice.call(freshList.querySelectorAll('[data-risk-card]')) : [];
  var archive = results.querySelector('[data-risk-archive]');
  var archivedCards = archive ? Array.prototype.slice.call(archive.querySelectorAll('[data-risk-card]')) : [];
  var more = results.querySelector('[data-risk-more]');
  var count = results.querySelector('[data-risk-count]');

  function part(name) { return results.querySelector('[data-risk-' + name + ']'); }
  function show(el, on) { if (el) el.hidden = !on; }
  function field(name) { var el = form.elements[name]; return el ? el.value.trim() : ''; }

  // Bo dau giong AlertList.Normalize: d/D, bo dau, chu thuong, chi giu chu va so.
  function normalize(s) {
    return (s || '').replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function hasLongDigits(s) { return /^\d{6,}$/.test((s || '').replace(/[\s.\-]/g, '')); }
  function has(card, attr, value) { return !value || (' ' + card.getAttribute(attr) + ' ').indexOf(' ' + value + ' ') > -1; }

  function matches(card, q) {
    if (!has(card, 'data-kenh', q.kenh) || !has(card, 'data-doi-tuong', q.doiTuong)) return false;
    if (q.mucDo && card.getAttribute('data-muc-do') !== q.mucDo) return false;
    var age = +card.getAttribute('data-age'), archived = card.getAttribute('data-archived') === '1';
    if (q.ngay === '30' && !(age >= 0 && age <= 30)) return false;
    if (q.ngay === '90' && archived) return false;
    if (q.ngay === 'luu-tru' && !archived) return false;
    if (q.words.length) {
      var text = ' ' + card.getAttribute('data-text') + ' ';
      if (!q.words.every(function (w) { return text.indexOf(' ' + w) > -1; })) return false;
    }
    return true;
  }

  function apply(updateUrl) {
    var text = field('q');
    var q = { kenh: field('kenh'), doiTuong: field('doi-tuong'), mucDo: field('muc-do'), ngay: field('ngay'),
      words: normalize(text).split(' ').filter(Boolean) };
    var blocked = hasLongDigits(text);
    var freshHits = blocked ? [] : freshCards.filter(function (c) { return matches(c, q); });
    var archivedHits = blocked ? [] : archivedCards.filter(function (c) { return matches(c, q); });
    var total = freshHits.length + archivedHits.length;

    freshCards.forEach(function (c) { c.hidden = freshHits.indexOf(c) < 0 || freshHits.indexOf(c) >= shown; });
    archivedCards.forEach(function (c) { c.hidden = archivedHits.indexOf(c) < 0; });
    show(part('blocked'), blocked);
    show(part('empty'), !blocked && total === 0);
    show(part('found'), !blocked && total > 0);
    show(part('textnote'), !!text);
    show(part('nofresh'), freshHits.length === 0 && archivedHits.length > 0);
    show(archive, archivedHits.length > 0);
    if (count) {
      count.textContent = '';
      var b = document.createElement('b');
      b.textContent = total + ' ' + unit;
      count.appendChild(b);
      if (text) count.appendChild(document.createTextNode(' khớp với “' + text + '”'));
    }
    if (more) {
      var left = freshHits.length - shown;
      more.hidden = left <= 0;
      more.textContent = 'Xem thêm ' + Math.min(STEP, Math.max(left, 0)) + ' mục';
      more._hits = freshHits;
    }
    if (updateUrl && window.history && history.replaceState) {
      var params = new URLSearchParams();
      ['q', 'kenh', 'doi-tuong', 'muc-do', 'ngay'].forEach(function (name) { if (field(name)) params.set(name, field(name)); });
      var qs = params.toString();
      history.replaceState(null, '', form.getAttribute('action') + (qs ? '?' + qs : ''));
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearTimeout(inputTimer);
    shown = STEP;
    apply(true);
  });
  form.addEventListener('input', function (event) {
    if (event.target && event.target.name === 'q') {
      clearTimeout(inputTimer);
      inputTimer = setTimeout(function () { shown = STEP; apply(true); }, 180);
    }
  });
  form.addEventListener('change', function (event) {
    if (event.target.tagName === 'SELECT') {
      clearTimeout(inputTimer);
      shown = STEP;
      apply(true);
    }
  });
  // Nut xoa (x) cua o tim kiem
  form.addEventListener('search', function (event) {
    if (!event.target.value) {
      clearTimeout(inputTimer);
      shown = STEP;
      apply(true);
    }
  });

  results.addEventListener('click', function (event) {
    var clear = event.target.closest('[data-risk-clear]');
    if (!clear) return;
    event.preventDefault();
    clearTimeout(inputTimer);
    form.reset();
    Array.prototype.forEach.call(form.elements, function (f) { if (f.name === 'q') f.value = ''; if (f.tagName === 'SELECT') f.value = ''; });
    shown = STEP;
    apply(true);
    form.elements.q && form.elements.q.focus();
  });

  if (more) {
    more.addEventListener('click', function () {
      var hits = more._hits || [];
      var first = hits[shown];
      shown += STEP;
      apply(false);
      if (first) first.focus();
    });
  }
  apply(false);
})();
