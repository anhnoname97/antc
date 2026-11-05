// Scope the native split panel's public sizing API to the risk editors; restore it on navigation.
export function responsiveShell(host, changed) {
    let node = host, section;
    while (node) { if (node.localName === 'umb-section-default') { section = node; break; } node = node.parentElement || node.getRootNode()?.host; }
    const panel = section?.shadowRoot?.querySelector('umb-split-panel');
    const sidebar = panel?.querySelector('umb-section-sidebar');
    const media = matchMedia('(max-width:900px)');
    const originalPanel = panel?.getAttribute('style'), position = panel?.position;
    const originalSidebar = sidebar?.getAttribute('style');
    const app = document.querySelector('umb-app'), appMinWidth = app?.style.getPropertyValue('min-width');
    let open = false;
    function restore() {
        if (panel) { originalPanel == null ? panel.removeAttribute('style') : panel.setAttribute('style', originalPanel); panel.position = position; }
        if (sidebar) originalSidebar == null ? sidebar.removeAttribute('style') : sidebar.setAttribute('style', originalSidebar);
        if (app) appMinWidth ? app.style.setProperty('min-width', appMinWidth) : app.style.removeProperty('min-width');
    }
    function update() {
        if (!media.matches) { restore(); open = false; }
        else {
            app?.style.setProperty('min-width', '0px');
            if (panel) {
                panel.style.setProperty('--umb-split-panel-start-min-width', '0px');
                panel.style.setProperty('--umb-split-panel-start-max-width', '0px');
                panel.style.setProperty('--umb-split-panel-end-min-width', '0px');
                panel.style.setProperty('--umb-split-panel-divider-width', '0px');
                panel.position = '0px';
            }
            if (sidebar) Object.assign(sidebar.style, { display: open ? 'flex' : 'none', position: 'fixed', inset: '60px auto 0 0', width: 'min(320px, 88vw)', zIndex: '60', boxShadow: '0 8px 28px #0b3b3a29' });
        }
        changed({ mobile: media.matches, open });
    }
    const escape = event => { if (event.key === 'Escape' && open) { open = false; update(); } };
    window.addEventListener('keydown', escape);
    media.addEventListener('change', update); update();
    return { toggle() { open = !open; update(); }, close() { open = false; update(); }, dispose() { window.removeEventListener('keydown', escape); media.removeEventListener('change', update); restore(); } };
}
