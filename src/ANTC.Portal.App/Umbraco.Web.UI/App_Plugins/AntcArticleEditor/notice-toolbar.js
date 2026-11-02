import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

class AntcArticleNoticeToolbar extends UmbLitElement {
  static properties = { api: { attribute: false }, editor: { attribute: false } };
  render() {
    return html`<uui-button label="Hộp lưu ý" look="secondary" ?disabled=${!this.api || !this.editor}
      @mousedown=${event => event.preventDefault()} @click=${() => this.api?.execute(this.editor)}>
      <umb-icon name="icon-alert"></umb-icon><span>Hộp lưu ý</span>
    </uui-button>`;
  }
  static styles = css`
    :host { display: inline-flex; }
    uui-button { --uui-color-border: var(--antc-ring, #b9e2db); --uui-color-text: var(--antc-tint-text, #0a5e57);
      background: var(--antc-tint, #e3f4f1); border-radius: 10px; }
    umb-icon { margin-right: 8px; vertical-align: middle; }
  `;
}
customElements.define('antc-article-notice-toolbar', AntcArticleNoticeToolbar);
export default AntcArticleNoticeToolbar;
