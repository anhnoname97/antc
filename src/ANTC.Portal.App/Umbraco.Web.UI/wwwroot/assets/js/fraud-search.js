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

// Mobile/tablet share the inline advanced-filter category list.
(() => {
    const select = document.getElementById('fraud-results-category');
    const form = select?.form;
    const wrapper = select?.closest('.fraud-category-picker');
    const page = form?.closest('.article-portal--search');
    const categories = document.getElementById('fraud-filter-panel');
    const sidebar = categories?.parentElement;
    if (!form || !wrapper || !page || !categories || !sidebar) return;
    const small = matchMedia('(max-width: 1100px)');
    const query = form.querySelector('input[type="search"]');
    const placeholder = query.placeholder;
    form.id ||= 'fraud-results-form';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'search-mobile-advanced-toggle';
    toggle.setAttribute('aria-controls', 'search-mobile-advanced');
    toggle.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('div');
    panel.id = 'search-mobile-advanced';
    panel.className = 'search-mobile-advanced';
    panel.hidden = true;
    const label = document.createElement('p');
    label.className = 'article-side-label';
    label.textContent = 'Danh mục bài viết';
    panel.append(label);
    form.after(toggle);
    page.querySelector('.fraud-search-hero').after(panel);
    const setOpen = open => {
        panel.hidden = !open;
        if (small.matches) categories.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
    };
    const syncLabel = () => {
        toggle.textContent = select.value ? 'Tìm kiếm nâng cao (1)' : 'Tìm kiếm nâng cao';
    };
    const reset = () => {
        if (panel.contains(document.activeElement)) query.focus({ preventScroll: true });
        setOpen(false);
        page.classList.toggle('has-mobile-advanced', small.matches);
        const trigger = wrapper.querySelector('.fraud-category-picker__trigger');
        wrapper.querySelector('.fraud-category-picker__options').hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-activedescendant');
        if (small.matches) {
            panel.append(categories);
            query.placeholder = 'Tìm kiếm thủ đoạn…';
        } else {
            sidebar.append(categories);
            query.placeholder = placeholder;
        }
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('keydown', event => {
        if (event.key === 'Escape') { setOpen(false); toggle.focus({ preventScroll: true }); }
    });
    select.addEventListener('change', syncLabel);
    small.addEventListener('change', reset);
    syncLabel();
    reset();
})();

// Compact category navigation; mobile opens a small dropdown beside the results.
(() => {
    const button = document.querySelector('[data-search-filters-toggle]');
    const panel = document.getElementById(button?.getAttribute('aria-controls'));
    if (!button || !panel) return;
    const compact = matchMedia('(max-width: 1100px)');
    const small = matchMedia('(max-width: 600px)');
    const sidebar = button.closest('.fraud-results-sidebar');
    const label = document.createElement('small');
    label.className = 'fraud-results-sidebar__mobile-label';
    label.textContent = 'Danh mục:';
    button.prepend(label);
    const setOpen = open => {
        panel.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
    };
    const reset = () => {
        if (!sidebar.contains(panel)) return;
        if (compact.matches && panel.contains(document.activeElement)) button.focus({ preventScroll: true });
        if (!compact.matches && document.activeElement === button) panel.querySelector('a')?.focus({ preventScroll: true });
        setOpen(!compact.matches);
    };
    sidebar.classList.add('has-filter-drawer');
    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', event => {
        if (compact.matches && !panel.hidden && event.key === 'Escape' && sidebar.contains(document.activeElement)) {
            setOpen(false);
            button.focus({ preventScroll: true });
        }
    });
    document.addEventListener('pointerdown', event => {
        if (small.matches && sidebar.contains(panel) && !sidebar.contains(event.target)) setOpen(false);
    });
    document.addEventListener('focusin', event => {
        if (small.matches && sidebar.contains(panel) && !sidebar.contains(event.target)) setOpen(false);
    });
    compact.addEventListener('change', reset);
    small.addEventListener('change', reset);
    reset();
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
    const tablet = matchMedia('(min-width: 601px) and (max-width: 1100px)');
    function render() {
        // A short two-column list is clearer without hiding its last one or two entries.
        const showAll = tablet.matches && categories.length <= 10;
        actions.hidden = showAll;
        if (showAll) {
            extra.forEach(link => { link.hidden = false; });
            return;
        }
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
    tablet.addEventListener('change', () => {
        if (actions.contains(document.activeElement) && tablet.matches && categories.length <= 10) {
            filters.querySelector('[aria-current], a')?.focus({ preventScroll: true });
        }
        render();
    });
    render();
})();
