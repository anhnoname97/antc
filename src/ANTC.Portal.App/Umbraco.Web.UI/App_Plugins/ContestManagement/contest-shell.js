import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import './contest-theme.js?v=1.15.13';

// The section context owns these shell tokens and releases them on navigation.
// Native Umbraco navigation, search and permissions remain in control of the shell.
export default class ContestShell extends UmbControllerBase {
    constructor(host) {
        super(host);
        if (!document.querySelector('#antc-contest-shell-theme')) {
            const style = document.createElement('style'); style.id = 'antc-contest-shell-theme';
            style.textContent = `html[data-antc-contest-section] {
                --umb-header-background-color:#0B3B3A;
                --uui-color-header-surface:#0B3B3A; --uui-color-header-background:#0B3B3A;
                --uui-color-header-contrast:#DFEEEB; --uui-color-header-contrast-emphasis:#fff;
                --uui-font-family:'Roboto',Arial,sans-serif;
                --uui-color-selected:#E3F4F1; --uui-color-selected-emphasis:#C7E9E3;
                --uui-color-selected-contrast:#0A5E57;
                --uui-color-current:#E3F4F1; --uui-color-current-emphasis:#C7E9E3;
                --uui-color-current-contrast:#0A5E57;
                --uui-color-interactive:#0E7C72; --uui-color-interactive-emphasis:#0A5E57;
                --uui-color-focus:#0E7C72;
            }
            html[data-antc-contest-section] umb-app{min-width:0}
            @media(max-width:600px){html[data-antc-contest-section]{
                --umb-header-logo-display:none;--umb-header-logo-margin:0;
            }}`;
            document.head.append(style);
        }
        document.documentElement.dataset.antcContestSection = '';
        this._section = host.getHostElement();
        this._setupResponsiveShell();
    }
    async _setupResponsiveShell() {
        const section = this._section;
        await section.updateComplete;
        if (this._disposed || !section.shadowRoot) return;
        const split = section.shadowRoot.querySelector('umb-split-panel');
        if (!split) return;
        await split.updateComplete;
        if (this._disposed || !split.shadowRoot) return;
        // Scope the native split-panel adaptation to this section instance only.
        // Keep its existing menu links, authorization and desktop resize behavior.
        this._sectionStyle = document.createElement('style');
        this._sectionStyle.textContent = `
            umb-split-panel{--umb-split-panel-end-min-width:0px}
            #antc-contest-menu-toggle{display:none}
            @media(max-width:900px){
                :host{position:relative;flex-direction:column;min-width:0}
                #antc-contest-menu-toggle{display:block;flex-shrink:0;align-self:flex-start;
                    margin:8px 12px;padding:8px 12px;border:1px solid #CCD3E0;border-radius:7px;
                    background:white;color:#0A5E57;font:500 13px Roboto,Arial,sans-serif;cursor:pointer}
                umb-section-main{min-height:0}
                umb-section-sidebar{display:none;position:absolute;inset:51px auto 0 0;
                    width:min(300px,calc(100vw - 24px));height:auto;box-shadow:8px 0 24px #10182826}
                :host([data-contest-menu-open]) umb-section-sidebar{display:flex}
            }`;
        section.shadowRoot.append(this._sectionStyle);
        this._splitStyle = document.createElement('style');
        this._splitStyle.textContent = `
            slot[name=end]{min-width:0}
            @media(max-width:900px){
                #main{grid-template-columns:minmax(0,1fr)!important;min-height:0;flex:1}
                slot[name=start]{display:contents}#divider{display:none!important}
            }`;
        split.shadowRoot.append(this._splitStyle);
        this._menuButton = document.createElement('button');
        this._menuButton.id = 'antc-contest-menu-toggle';
        this._menuButton.type = 'button';
        this._menuButton.textContent = '☰ Menu cuộc thi';
        const sidebar = split.querySelector('umb-section-sidebar');
        if (sidebar) { sidebar.id = 'antc-contest-sidebar'; this._menuButton.setAttribute('aria-controls', sidebar.id); }
        this._setMenuOpen(false);
        this._menuButton.addEventListener('click', () => this._setMenuOpen(!section.hasAttribute('data-contest-menu-open')));
        section.shadowRoot.prepend(this._menuButton);
        this._closeMenu = event => {
            if (event.type === 'keydown') {
                if (event.key === 'Escape' && section.hasAttribute('data-contest-menu-open')) {
                    this._setMenuOpen(false); this._menuButton.focus();
                }
                return;
            }
            const path = event.composedPath();
            if (path.some(el => el?.tagName === 'A') || (!path.includes(sidebar) && !path.includes(this._menuButton))) this._setMenuOpen(false);
        };
        section.addEventListener('click', this._closeMenu);
        section.addEventListener('keydown', this._closeMenu);
    }
    _setMenuOpen(open) {
        this._section.toggleAttribute('data-contest-menu-open', open);
        this._menuButton?.setAttribute('aria-expanded', String(open));
    }
    destroy() {
        this._disposed = true;
        this._section?.removeEventListener('click', this._closeMenu);
        this._section?.removeEventListener('keydown', this._closeMenu);
        this._section?.removeAttribute('data-contest-menu-open');
        this._menuButton?.remove(); this._sectionStyle?.remove(); this._splitStyle?.remove();
        delete document.documentElement.dataset.antcContestSection;
        super.destroy();
    }
}
