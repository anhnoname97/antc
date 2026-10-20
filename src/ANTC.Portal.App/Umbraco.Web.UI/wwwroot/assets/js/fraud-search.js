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
