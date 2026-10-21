(() => {
    const select = document.querySelector('#fraud-results-category');
    if (!select) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'fraud-category-picker';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'fraud-category-picker__trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-label', 'Danh mục');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'fraud-category-options');
    const panel = document.createElement('div');
    panel.id = 'fraud-category-options';
    panel.className = 'fraud-category-picker__options';
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', 'Danh mục bài viết');
    panel.hidden = true;
    let active = select.selectedIndex;
    const options = Array.from(select.options, (option, index) => {
        const item = document.createElement('div');
        item.id = `fraud-category-option-${index}`;
        item.setAttribute('role', 'option');
        item.textContent = option.textContent;
        item.addEventListener('click', () => commit(index));
        panel.append(item);
        return item;
    });
    function highlight(index) {
        active = Math.max(0, Math.min(options.length - 1, index));
        options.forEach((item, i) => item.classList.toggle('is-highlighted', i === active));
        trigger.setAttribute('aria-activedescendant', options[active].id);
        options[active].scrollIntoView({ block: 'nearest' });
    }
    function close() {
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-activedescendant');
    }
    function sync() {
        trigger.textContent = select.options[select.selectedIndex].textContent;
        options.forEach((item, i) => item.setAttribute('aria-selected', String(i === select.selectedIndex)));
    }
    function open() {
        panel.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        highlight(select.selectedIndex);
    }
    function commit(index) {
        select.selectedIndex = index;
        sync();
        close();
        select.dispatchEvent(new Event('change', { bubbles: true }));
        trigger.focus({ preventScroll: true });
    }
    trigger.addEventListener('click', () => panel.hidden ? open() : close());
    trigger.addEventListener('keydown', event => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const wasClosed = panel.hidden;
            if (wasClosed) open();
            highlight(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : active + (event.key === 'ArrowDown' ? 1 : -1));
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (panel.hidden) open(); else commit(active);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'Tab') close();
        else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            const index = options.findIndex((item, i) => i > active && item.textContent.toLocaleLowerCase('vi').startsWith(event.key.toLocaleLowerCase('vi')));
            if (index >= 0) { event.preventDefault(); if (panel.hidden) open(); highlight(index); }
        }
    });
    document.addEventListener('pointerdown', event => { if (!wrapper.contains(event.target)) close(); });
    select.addEventListener('change', sync);
    select.form.addEventListener('reset', () => { close(); setTimeout(sync, 0); });
    select.before(wrapper);
    wrapper.append(select, trigger, panel);
    select.hidden = true;
    sync();
})();

// Keep every category reachable without JavaScript; collapse only after enhancement.
(() => {
    const filters = document.querySelector('[data-category-limit]');
    if (!filters) return;
    const limit = Number(filters.dataset.categoryLimit);
    if (!Number.isInteger(limit) || limit < 1) return;
    // The first link is "All", which stays visible independently of the category limit.
    const categories = Array.from(filters.querySelectorAll('a')).slice(1);
    const extra = categories.slice(limit).filter(link => !link.hasAttribute('aria-current'));
    if (!extra.length) return;
    const actions = document.createElement('div');
    actions.className = 'fraud-result-filters-actions';
    const more = document.createElement('button');
    const collapse = document.createElement('button');
    for (const button of [more, collapse]) {
        button.type = 'button';
        button.className = 'fraud-result-filters-toggle';
        button.setAttribute('aria-controls', filters.id);
    }
    collapse.classList.add('fraud-result-filters-toggle--collapse');
    collapse.textContent = 'Thu gọn';
    let revealed = 0;
    const step = 5;
    function render() {
        extra.forEach((link, index) => { link.hidden = index >= revealed; });
        const remaining = extra.length - revealed;
        more.hidden = remaining === 0;
        more.textContent = 'Xem thêm';
        more.setAttribute('aria-label', `Xem thêm ${Math.min(step, remaining)} danh mục`);
        more.setAttribute('aria-expanded', String(revealed > 0));
        collapse.hidden = revealed === 0;
        collapse.setAttribute('aria-expanded', String(revealed > 0));
    }
    more.addEventListener('click', () => {
        revealed = Math.min(extra.length, revealed + step);
        render();
        (more.hidden ? collapse : more).focus({ preventScroll: true });
    });
    collapse.addEventListener('click', () => {
        revealed = 0;
        render();
        more.focus({ preventScroll: true });
    });
    actions.append(more, collapse);
    filters.after(actions);
    render();
})();
