import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UMB_COLLECTION_CONTEXT } from '@umbraco-cms/backoffice/collection';
import { UmbUserCollectionRepository } from '@umbraco-cms/backoffice/user';

// Restyle the native Umbraco workspaces: repositories, permission conditions,
// selection, validation, modals and save actions continue to belong to Umbraco.
const pages = {
    'user-root': ['Tài khoản', 'Quản lý cán bộ sử dụng backoffice. Quyền truy cập được xác định theo nhóm tài khoản.'],
    'user-group-root': ['Nhóm tài khoản', 'Quản lý nhóm quyền, khu vực được truy cập và phạm vi nội dung của từng nhóm.'],
    'member-root': ['Thành viên', 'Quản lý hồ sơ, thông tin đăng nhập và nhóm thành viên của người dùng portal.'],
    'member-group-root': ['Nhóm thành viên', 'Tổ chức thành viên portal theo nhóm để thuận tiện quản lý.'],
};

class IdentityHeading extends UmbLitElement {
    static properties = { entity: {} };
    render() {
        const [title, description] = pages[this.entity] || ['', ''];
        return html`<p class="eyebrow">${this.entity?.startsWith('user') ? 'QUẢN TRỊ HỆ THỐNG' : 'QUẢN LÝ THÀNH VIÊN'}</p>
            <h1>${title}</h1><p class="description">${description}</p>`;
    }
    static styles = css`
        :host{display:block;min-width:0;padding:16px 0 12px;font-family:var(--uui-font-family)}
        .eyebrow{margin:0 0 4px;color:#6b7385;font-size:11px;font-weight:700;letter-spacing:.07em}
        h1{margin:0;font-size:28px;line-height:1.25;letter-spacing:-.02em;color:#1a2033}
        .description{margin:6px 0 0;color:#5b6478;font-size:14px;line-height:1.5}
    `;
}
class IdentityResultCount extends UmbLitElement {
    static properties = { total: { state: true }, busy: { state: true } };
    constructor() {
        super();
        this.busy = true;
        this.consumeContext(UMB_COLLECTION_CONTEXT, context => {
            this.observe(context?.totalItems, total => { this.total = total; }, 'identity-total');
            this.observe(context?.loading, busy => { this.busy = busy; }, 'identity-loading');
        });
    }
    render() {
        return html`<span role="status">${this.busy ? 'Đang tải dữ liệu…' : html`<strong>${this.total ?? 0}</strong> kết quả`}</span>`;
    }
    static styles = css`
        :host{display:block;margin:0 0 12px;color:#5b6478;font-size:13px}
        span{display:inline-flex;align-items:center;gap:5px}
        span::before{content:'';width:6px;height:6px;border-radius:50%;background:#0e7c72;margin-right:3px}
        strong{color:#1a2033;font-variant-numeric:tabular-nums}
    `;
}
if (!customElements.get('antc-identity-heading')) customElements.define('antc-identity-heading', IdentityHeading);
if (!customElements.get('antc-identity-result-count')) customElements.define('antc-identity-result-count', IdentityResultCount);

class IdentityUserStats extends UmbLitElement {
    static properties = { counts: { state: true } };
    #repository = new UmbUserCollectionRepository(this);
    #loading = false;
    constructor() {
        super();
        this.consumeContext(UMB_COLLECTION_CONTEXT, context => {
            if (!context) return;
            context.setConfig({ ...context.getConfig(), layouts: [{ collectionView: 'Antc.CollectionView.User.Table' }] });
            this.observe(context.loading, busy => { if (!busy) this.#load(); }, 'identity-statistics');
        });
    }
    async #load() {
        if (this.#loading) return;
        this.#loading = true;
        const results = await Promise.allSettled([undefined, ['Active'], ['Invited'], ['Disabled', 'LockedOut']].map(userStates =>
            this.#repository.requestCollection({ skip: 0, take: 1, userStates })));
        this.counts = results.map(result => result.status === 'fulfilled' ? result.value.data?.total : undefined);
        this.#loading = false;
    }
    render() {
        return html`${['Tổng tài khoản', 'Đang hoạt động', 'Chờ nhận lời mời', 'Vô hiệu hóa / khóa'].map((label, index) => html`
            <article><span class="stripe stripe-${index}"></span><div><p>${label}</p><strong>${this.counts?.[index] ?? '—'}</strong></div></article>` )}`;
    }
    static styles = css`
        :host{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
        article{display:flex;gap:12px;align-items:center;padding:14px 16px;border:1px solid #e3e7f0;border-radius:14px;background:white}
        .stripe{width:7px;height:36px;flex-shrink:0;border-radius:99px;background:#0e7c72}
        .stripe-1{background:#22a06b}.stripe-2{background:#e8a23c}.stripe-3{background:#8a92a6}
        p{margin:0;font-size:13px;color:#5b6478;line-height:1.5}strong{font-size:22px;color:#1a2033;font-variant-numeric:tabular-nums}
        @media(max-width:1000px){:host{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
}
if (!customElements.get('antc-identity-user-stats')) customElements.define('antc-identity-user-stats', IdentityUserStats);

const tokens = `
    --uui-font-family:'Roboto',Arial,sans-serif;
    --uui-color-background:#f4f6fb;--uui-color-surface:#fff;--uui-color-surface-alt:#f8f9fc;
    --uui-color-text:#1a2033;--uui-color-text-alt:#5b6478;
    --uui-color-border:#e3e7f0;--uui-color-border-emphasis:#c9d2e3;
    --uui-color-interactive:#0e7c72;--uui-color-interactive-emphasis:#0a5e57;
    --uui-color-selected:#e3f4f1;--uui-color-selected-emphasis:#c7e9e3;--uui-color-selected-contrast:#0a5e57;
    --uui-color-current:#e3f4f1;--uui-color-current-emphasis:#c7e9e3;--uui-color-current-contrast:#0a5e57;
    --uui-color-focus:#0e7c72;--uui-color-positive:#0e7c72;--uui-color-positive-emphasis:#0a5e57;
    --uui-color-header-surface:#0b3b3a;--uui-color-header-background:#0b3b3a;
    --umb-header-background-color:#0b3b3a;--uui-color-header-contrast:#dfeeeb;--uui-color-header-contrast-emphasis:#fff;
    --uui-size-layout-1:20px;--uui-size-layout-2:24px;--uui-size-space-5:16px;
    --uui-border-radius:10px;
`;

// Adopted sheets reach open shadow roots without copying or changing core assets.
// Each sheet and observer is released when leaving the two identity sections.
const rules = {
    'umb-default-workspace': `:host{display:flex;flex-direction:column;height:100%;min-height:0}antc-identity-heading{margin:0 24px}umb-workspace-editor{flex:1;height:auto;min-height:0}@media(max-width:800px){antc-identity-heading{margin:0 16px}}`,
    'umb-collection-workspace-view': `:host{display:block;height:100%;box-sizing:border-box;padding:0 24px 20px;min-width:0}umb-collection{display:block;height:auto}@media(max-width:800px){:host{padding:0 16px 16px}}`,
    'umb-user-collection': `:host{gap:0;height:auto}umb-body-layout{height:auto;flex:none;min-height:0}`,
    'umb-member-collection': `:host{height:auto}umb-body-layout{height:auto;flex:none;min-height:0}#empty-state{min-height:140px}`,
    'umb-collection-default': `:host{height:auto}umb-body-layout{height:auto;flex:none;min-height:0}#empty-state{min-height:140px}`,
    'umb-body-layout': `
        #header{min-height:64px;height:auto;background:#f4f6fb;border-bottom:0;flex-wrap:wrap}
        #header-slot{padding:0 24px;min-height:64px}
        #headline{font-size:28px;line-height:1.25;letter-spacing:-.02em}
        :host([data-antc-identity-root]) #header{display:none!important}
        :host([data-antc-identity-root]) #header-slot{width:100%}
        #main{min-width:0;min-height:0;box-sizing:border-box}
        :host([header-transparent]) #header{background:#fff;border:1px solid #e3e7f0;border-radius:14px 14px 0 0;clip-path:none;box-shadow:none}
        :host([header-transparent]) #header-slot{padding:12px 16px;min-height:64px}
        :host([header-transparent]) #main{background:#fff;border:1px solid #e3e7f0;border-top:0;border-radius:0 0 14px 14px;padding:12px 16px 16px}
        @media(max-width:800px){#header-slot{padding:0 16px}#header{min-height:56px}}
    `,
    'umb-workspace-editor': `
        :host{min-width:0}uui-tab-group{border:0;--uui-tab-divider:transparent}
        uui-tab{--uui-tab-text:var(--uui-color-text-alt)}
        :host([data-antc-identity-editor]) umb-workspace-footer{display:none}
    `,
    'umb-collection-toolbar': `
        :host{gap:10px;align-items:center;flex-wrap:wrap;min-width:0}
        #slot{min-width:240px;flex:1 1 300px}
        umb-collection-action-bundle{order:2;margin-left:auto}
        umb-collection-view-bundle{order:3}
    `,
    'umb-user-collection-header': `
        :host{height:auto;white-space:normal}
        #toolbar{flex-wrap:wrap;gap:8px;justify-content:flex-start;min-width:0}
        umb-collection-filter-field{flex:1 1 240px;width:auto;min-width:180px}
        uui-button{border:1px solid #d5dae5;border-radius:10px;--uui-button-height:40px}
        .filter-dropdown{gap:10px;padding:12px;min-width:180px}
    `,
    'umb-member-collection-header': `
        :host{height:auto;min-width:0;flex-wrap:wrap;white-space:normal;gap:10px}
        umb-collection-filter-field{flex:1 1 240px;min-width:180px;width:auto}
        umb-collection-action-bundle{order:2;margin-left:auto}
        umb-dropdown{border:1px solid #d5dae5;border-radius:10px}
        #dropdown-layout{padding:6px;gap:4px}
    `,
    'umb-table': `
        :host{display:block;max-width:100%;overflow-x:auto;border:1px solid #e3e7f0;border-radius:12px;background:white}
        uui-table{--uui-table-cell-padding:12px 14px;min-width:480px;width:100%}
        uui-table:has(uui-table-head-cell:nth-child(5)){min-width:1100px}
        uui-table-head{background:#f8f9fc;color:#6b7385;font-size:12px;text-transform:uppercase;letter-spacing:.025em}
        uui-table-head-cell{height:44px;font-weight:600;white-space:nowrap;--uui-table-cell-padding:10px 14px}
        uui-table-cell{height:40px;--uui-table-cell-padding:10px 14px!important;border-color:#eef0f5;font-size:14px}
        uui-table-row:hover{background:#f8f9fc}
        a{color:#1a2033;font-weight:600;text-decoration:none}a:hover{color:#0e7c72;text-decoration:underline}
        button{font-family:inherit}
    `,
    'uui-box': `
        :host{border:1px solid #e3e7f0;border-radius:14px;box-shadow:none;--uui-box-default-padding:18px;background:#fff;overflow-wrap:anywhere}
        #header{border-color:#eef0f5}#headline{font-size:16px;font-weight:600}
    `,
    'uui-button': `:host{--uui-button-border-radius:10px;font-family:var(--uui-font-family)}#button{border-radius:10px}`,
    'uui-input': `:host{border-radius:10px;--uui-input-height:40px;font-family:var(--uui-font-family)}`,
    'uui-select': `:host{border-radius:10px;--uui-select-height:40px;font-family:var(--uui-font-family)}`,
    'uui-textarea': `:host{border-radius:10px;font-family:var(--uui-font-family)}`,
    'uui-tag': `:host{border-radius:99px;font-size:12px;font-weight:600}`,
    'umb-popover-layout': `:host{border:1px solid #e3e7f0;border-radius:12px;box-shadow:0 8px 24px #1a20331a;overflow:hidden}`,
    'umb-property-layout': `:host{padding-block:12px;--umb-property-layout-label-width:220px}#description{color:#5b6478;font-size:13px}`,
    'umb-workspace-footer': `:host{background:#fff;border-top:1px solid #e3e7f0;box-shadow:0 -4px 16px #1a203308}`,
    'umb-stack': `:host{gap:14px}`,
    'uui-menu-item': `:host{border-radius:9px;font-family:var(--uui-font-family)}#label{border-radius:9px}`,
    'umb-user-details-workspace-view': `
        #main{grid-template-columns:minmax(0,1fr) 310px;gap:16px;padding:16px 24px}
        #left-column,#right-column{min-width:0}
        @media(max-width:1100px){#main{grid-template-columns:minmax(0,1fr)}}
    `,
    'umb-user-group-details-workspace-view': `
        #main{grid-template-columns:minmax(0,1fr) 300px;gap:16px;padding:16px 24px}
        #main>*{min-width:0}
        @media(max-width:1100px){#main{grid-template-columns:minmax(0,1fr)}}
    `,
    'umb-member-workspace-view-member': `
        #main{gap:16px}#left-column{min-width:0;flex-basis:440px;gap:14px}
        #right-column{min-width:0;flex-basis:300px;gap:14px}
    `,
    'umb-member-type-workspace-view-member-info': `
        :host{gap:16px;padding:16px 24px;flex-wrap:wrap}
        #left-column,#right-column{min-width:0}#no-properties{justify-content:flex-start;opacity:1;color:#5b6478}
        .property span{overflow-wrap:anywhere;color:#5b6478}
    `,
    'umb-input-section': `
        uui-ref-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}
        umb-ref-section{border:1px solid #b9e2db;border-radius:10px;background:#e3f4f1;color:#0a5e57}
        #btn-add{margin-top:10px;border-radius:10px}
    `,
    'umb-user-workspace-avatar': `:host{text-align:center}umb-user-avatar{border-radius:50%}`,
    'umb-user-group-table-sections-column-layout': `:host{color:#5b6478;font-size:13px}`,
    'umb-user-groups-value-summary': `:host{display:block;max-width:260px;color:#5b6478;font-size:13px}span{white-space:normal;overflow-wrap:anywhere}`,
    'umb-entity-name-table-column-layout': `a{font-weight:600;text-decoration:none;color:#1a2033}a:hover{color:#0e7c72;text-decoration:underline}`,
};
const sheets = new Map(Object.entries(rules).map(([tag, rule]) => {
    const sheet = new CSSStyleSheet(); sheet.replaceSync(rule); return [tag, sheet];
}));

export default class IdentityDesign extends UmbControllerBase {
    #roots = new Map();
    #nodes = new Set();
    #attributes = new Set();
    #pending = new WeakSet();
    #destroyed = false;
    constructor(host) {
        super(host);
        this.shell = document.createElement('style');
        this.shell.textContent = `html[data-antc-identity-section]{${tokens}}`;
        document.head.append(this.shell);
        document.documentElement.dataset.antcIdentitySection = '';
        if (!document.querySelector('link[data-antc-identity-font]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = '/assets/css/fonts.css';
            link.dataset.antcIdentityFont = ''; document.head.append(link);
        }
        this.#watch(document);
    }
    #watch(root) {
        if (this.#destroyed || this.#roots.has(root)) return;
        const sheet = sheets.get(root.host?.localName);
        if (sheet) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        const observer = new MutationObserver(records => {
            for (const record of records) {
                for (const node of record.addedNodes) this.#visit(node);
            }
            this.#decorate(root);
            // Drop disconnected trees rather than retaining every visited workspace.
            for (const [observed, item] of this.#roots) {
                if (observed.host && !observed.host.isConnected) {
                    item.observer.disconnect();
                    if (item.sheet) observed.adoptedStyleSheets = observed.adoptedStyleSheets.filter(s => s !== item.sheet);
                    this.#roots.delete(observed);
                }
            }
        });
        observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['headline'] });
        this.#roots.set(root, { observer, sheet });
        for (const child of root.children || []) this.#visit(child);
        this.#decorate(root);
        if (root.host?.updateComplete) root.host.updateComplete.then(() => {
            if (!this.#destroyed && root.host.isConnected) this.#decorate(root);
        });
    }
    #visit(node) {
        if (!(node instanceof Element) || this.#destroyed) return;
        if (node.shadowRoot) this.#watch(node.shadowRoot);
        else if (node.localName.includes('-') && !this.#pending.has(node)) {
            this.#pending.add(node);
            customElements.whenDefined(node.localName).then(async () => {
                await node.updateComplete;
                if (!this.#destroyed && node.isConnected && node.shadowRoot) this.#watch(node.shadowRoot);
            });
        }
        for (const child of node.children) this.#visit(child);
    }
    #decorate(root) {
        if (root.host?.localName === 'umb-default-workspace') {
            const entity = root.host.manifest?.meta?.entityType || location.pathname.match(/\/workspace\/([^/]+)/)?.[1];
            const editor = root.querySelector('umb-workspace-editor');
            if (pages[entity] && editor && !root.querySelector('antc-identity-heading')) {
                const heading = document.createElement('antc-identity-heading');
                heading.entity = entity;
                editor.before(heading); this.#nodes.add(heading);
                editor.dataset.antcIdentityEditor = ''; this.#attributes.add(editor);
                if (editor.shadowRoot) this.#decorate(editor.shadowRoot);
            }
            const heading = root.querySelector('antc-identity-heading');
            if (heading && pages[entity] && heading.entity !== entity) heading.entity = entity;
        }
        if (root.host?.localName === 'umb-workspace-editor' && root.host.hasAttribute('data-antc-identity-editor')) {
            const layout = root.querySelector('umb-body-layout');
            if (layout && !layout.hasAttribute('data-antc-identity-root')) {
                layout.dataset.antcIdentityRoot = ''; this.#attributes.add(layout);
            }
        }
        if (['umb-user-collection', 'umb-member-collection', 'umb-collection-default'].includes(root.host?.localName)) {
            const layout = root.querySelector('umb-body-layout');
            if (root.host.localName === 'umb-user-collection' && layout && !root.querySelector('antc-identity-user-stats')) {
                const stats = document.createElement('antc-identity-user-stats');
                layout.before(stats); this.#nodes.add(stats);
            }
            if (layout && !layout.querySelector('antc-identity-result-count')) {
                const count = document.createElement('antc-identity-result-count');
                layout.prepend(count); this.#nodes.add(count);
            }
        }
    }
    destroy() {
        this.#destroyed = true;
        for (const [root, item] of this.#roots) {
            item.observer.disconnect();
            if (item.sheet) root.adoptedStyleSheets = root.adoptedStyleSheets.filter(s => s !== item.sheet);
        }
        for (const node of this.#nodes) node.remove();
        for (const node of this.#attributes) {
            node.removeAttribute('data-antc-identity-root'); node.removeAttribute('data-antc-identity-editor');
        }
        this.#roots.clear(); this.#nodes.clear(); this.#attributes.clear();
        this.shell.remove(); delete document.documentElement.dataset.antcIdentitySection;
        super.destroy();
    }
}
