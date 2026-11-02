import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbWorkspaceElement } from '@umbraco-cms/backoffice/workspace';
import { AntcMediaLibrary } from './media-library.element.js?v=1.0.10';

class AntcMediaSection extends UmbLitElement {
    static properties = { _workspace: { state: true } };
    constructor() {
        super();
        this._workspace = false;
        this._routes = [
            { path: 'workspace/:entityType', component: UmbWorkspaceElement,
                setup: (element, info) => { this._workspace = true; element.entityType = info.match.params.entityType; } },
            { path: '**', component: AntcMediaLibrary, setup: () => { this._workspace = false; } },
        ];
    }
    render() { return html`${this._workspace ? html`<a class="back" href="/umbraco/section/media">← Thư viện phương tiện</a>` : ''}<umb-router-slot .routes=${this._routes}></umb-router-slot>`; }
    static styles = css`:host { display: flex; flex-direction: column; height: 100%; min-width: 0; width: 100%; max-width: 100vw; } umb-router-slot { flex: 1; min-width: 0; min-height: 0; } .back { padding: 12px 24px; color: #087f76; background: white; text-decoration: none; border-bottom: 1px solid #d7deed; }`;
}
customElements.define('antc-media-section', AntcMediaSection);
export { AntcMediaSection as element };
