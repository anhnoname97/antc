// Initial HTML comes from IPublishedArticleService. Interactive queries use its public JSON API.
const root = document.querySelector('[data-article-browser]');
if (root) {
  const find = selector => root.querySelector(selector);
  const form = find('[data-article-form]');
  const results = find('[data-article-results]');
  const status = find('[data-article-status]');
  const retry = find('[data-article-retry]');
  const searchPage = root.dataset.searchPage === 'true';
  const template = find('[data-article-card-template]');
  const icons = new Map([...root.querySelectorAll('[data-article-icon]')].map(icon => [icon.dataset.articleIcon, icon]));
  let activeRequest, pendingUrl = new URL(location.href);

  function internalUrl(value) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
    try {
      const url = new URL(value, location.origin);
      return url.origin === location.origin ? url.pathname + url.search + url.hash : null;
    } catch { return null; }
  }
  function pageUrl(url, page, category = url.searchParams.get('category')) {
    const next = new URL(url);
    next.searchParams.delete('page');
    if (page > 1) next.searchParams.set('page', page);
    if (searchPage) {
      if (category) next.searchParams.set('category', category); else next.searchParams.delete('category');
    }
    return next;
  }
  function mediaUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, location.origin);
      return url.protocol === 'https:' || url.origin === location.origin ? url.href : null;
    } catch { return null; }
  }
  function apiUrl(url) {
    const api = new URL('/api/v1/articles', location.origin);
    api.searchParams.set('section', root.dataset.section);
    api.searchParams.set('page', url.searchParams.get('page') ?? '1');
    api.searchParams.set('pageSize', url.searchParams.get('pageSize') ?? root.dataset.pageSize ?? '10');
    api.searchParams.set('sort', url.searchParams.get('sort') ?? 'updated-desc');
    const category = searchPage ? url.searchParams.get('category') : root.dataset.categoryId;
    if (category) api.searchParams.set('categoryId', category);
    const keyword = (url.searchParams.get('q') ?? '').trim();
    if (keyword) api.searchParams.set('search', keyword);
    return api;
  }
  function card(item) {
    const node = template.content.firstElementChild.cloneNode(true);
    const slot = selector => node.querySelector(selector);
    node.dataset.articleId = item.id;
    const link = slot('[data-card-link]');
    const href = internalUrl(item.url);
    link.textContent = item.title;
    if (href) link.href = href; else link.removeAttribute('href');
    slot('[data-card-summary]').textContent = item.summary ?? '';
    slot('[data-card-summary]').hidden = !item.summary;
    slot('[data-card-category]').textContent = item.category?.title ?? '';
    slot('[data-card-category]').hidden = !searchPage;
    const image = slot('[data-card-image]');
    const imageUrl = mediaUrl(item.image?.url);
    image.hidden = !imageUrl;
    if (imageUrl) image.src = imageUrl; else image.removeAttribute('src');
    for (const placeholder of node.querySelectorAll('[data-card-placeholder]')) placeholder.hidden = !!imageUrl;
    slot('[data-card-art-label]').textContent = item.category?.role === 'Chính sách' ? 'VĂN BẢN CHÍNH SÁCH' : 'NHẬN DIỆN THỦ ĐOẠN';
    const icon = icons.get(item.category?.id);
    if (icon) slot('[data-card-icon]').replaceChildren(icon.content.cloneNode(true));
    slot('[data-card-draft]').hidden = !item.isDraft;
    const label = slot('[data-card-label]');
    label.textContent = item.label?.text ?? '';
    label.hidden = item.label?.type === 'none' || !item.label?.text;
    label.classList.toggle('article-label--amber', item.label?.type === 'unverified');
    const date = typeof item.updatedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.updatedDate) ? item.updatedDate : null;
    const time = slot('[data-card-date]');
    time.hidden = !date;
    slot('[data-card-date-label]').hidden = !date;
    slot('[data-card-date-empty]').hidden = !!date;
    if (date) {
      time.dateTime = date;
      time.textContent = date.split('-').reverse().join('/');
    } else time.removeAttribute('datetime');
    return node;
  }
  function pagination(data, url) {
    const nav = find('[data-article-pagination]');
    nav.replaceChildren();
    nav.hidden = data.totalPages <= 1;
    function link(page, label, rel) {
      const anchor = document.createElement('a');
      anchor.href = pageUrl(url, page);
      anchor.textContent = label;
      if (rel) anchor.rel = rel;
      nav.append(anchor);
    }
    if (data.page > 1 && data.totalPages > 0) link(Math.min(data.page - 1, data.totalPages), '← Trang trước', 'prev');
    const current = Math.max(1, Math.min(data.page, data.totalPages));
    for (let number = Math.max(1, current - 2); number <= Math.min(data.totalPages, current + 2); number++) {
      if (number === data.page) {
        const selected = document.createElement('span');
        selected.setAttribute('aria-current', 'page');
        selected.textContent = number;
        nav.append(selected);
      } else link(number, String(number));
    }
    if (data.page < data.totalPages) link(data.page + 1, 'Trang sau →', 'next');
  }
  function sync(url) {
    const keyword = (url.searchParams.get('q') ?? '').trim();
    form.elements.namedItem('q').value = keyword;
    const select = form.elements.namedItem('category');
    if (select) {
      select.value = url.searchParams.get('category') ?? '';
      select.dispatchEvent(new Event('article:sync'));
    }
    const categoryLabel = find('[data-search-filter-label]');
    if (categoryLabel) categoryLabel.textContent = select?.selectedOptions[0]?.textContent ?? 'Tất cả';
    for (const link of root.querySelectorAll('[data-article-category]')) {
      const category = link.dataset.articleCategory;
      link.href = pageUrl(url, 1, category);
      const selected = category === (url.searchParams.get('category') ?? '');
      link.classList.toggle('is-active', selected);
      if (selected) { link.setAttribute('aria-current', 'true'); link.hidden = false; }
      else link.removeAttribute('aria-current');
    }
  }
  function render(data, url) {
    const keyword = (url.searchParams.get('q') ?? '').trim();
    find('[data-article-cards]').replaceChildren(...data.items.map(card));
    find('[data-article-summary]').hidden = !keyword;
    find('[data-article-total]').textContent = data.total;
    const filterCount = find('[data-search-filter-count]');
    if (filterCount) filterCount.textContent = data.total;
    find('[data-article-keyword]').textContent = keyword;
    const clear = new URL(url);
    clear.searchParams.delete('q');
    clear.searchParams.delete('page');
    find('[data-article-clear]').href = clear;
    find('[data-article-empty]').hidden = data.items.length > 0;
    find('[data-article-empty-title]').textContent = data.total > 0 ? 'Trang này chưa có kết quả' : keyword ? 'Chưa tìm thấy bài phù hợp' : 'Chưa có bài viết';
    find('[data-article-empty-text]').textContent = data.total > 0 ? 'Bạn có thể quay về trang đầu để xem bài viết.' : 'Thử từ khóa khác hoặc xem lại danh mục đang chọn.';
    find('[data-article-first]').href = pageUrl(url, 1);
    find('[data-article-first]').hidden = data.total === 0;
    pagination(data, url);
    sync(url);
  }
  async function navigate(url, historyMode = 'push', focus = false) {
    activeRequest?.abort();
    const request = new AbortController();
    activeRequest = request;
    pendingUrl = url;
    retry.hidden = true;
    status.hidden = false;
    status.classList.remove('article-sr-only');
    status.textContent = 'Đang tải bài viết…';
    results.setAttribute('aria-busy', 'true');
    try {
      const keyword = (url.searchParams.get('q') ?? '').trim();
      if (searchPage && root.dataset.section === 'fraud' && /\d{4,}|\d[\d\s.()+-]{3,}\d/.test(keyword))
        throw new Error('Hãy tìm theo tên thủ đoạn hoặc chủ đề; không nhập số điện thoại hay số tài khoản.');
      const response = await fetch(apiUrl(url), { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: request.signal });
      const data = await response.json();
      if (!response.ok) {
        const fields = Object.values(data.error?.fields ?? {});
        throw new Error(fields.join(' ') || data.error?.message || 'Chưa tải được bài viết. Vui lòng thử lại.');
      }
      if (!Array.isArray(data.items) || !Number.isInteger(data.total) || !Number.isInteger(data.page) || !Number.isInteger(data.totalPages))
        throw new Error('Dữ liệu bài viết chưa hợp lệ. Vui lòng thử lại.');
      if (request.signal.aborted) return;
      render(data, url);
      if (historyMode === 'push' && url.href !== location.href) history.pushState(null, '', url);
      status.textContent = keyword ? `${data.total} kết quả tìm kiếm. Trang ${data.page}.` : `${data.total} bài viết. Trang ${data.page}.`;
      status.classList.add('article-sr-only');
      if (focus) results.focus({ preventScroll: true });
    } catch (error) {
      if (request.signal.aborted) return;
      status.textContent = error instanceof TypeError || error instanceof SyntaxError
        ? 'Chưa kết nối được dịch vụ bài viết. Vui lòng thử lại.' : error.message;
      retry.hidden = false;
    } finally {
      if (activeRequest === request) results.removeAttribute('aria-busy');
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const url = new URL(form.action);
    for (const [key, value] of new FormData(form)) if (String(value).trim()) url.searchParams.set(key, String(value).trim());
    navigate(url);
  });
  form.elements.namedItem('category')?.addEventListener('change', () => form.requestSubmit());
  root.addEventListener('click', event => {
    const link = event.target.closest('[data-article-pagination] a, a[data-article-clear], a[data-article-category], a[data-article-first]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    event.preventDefault();
    navigate(url, 'push', true);
  });
  retry.addEventListener('click', () => navigate(pendingUrl));
  addEventListener('popstate', () => navigate(new URL(location.href), 'none'));
}
