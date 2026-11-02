import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

class AntcArticleNoticePreview extends UmbLitElement {
  static properties = { content: { attribute: false }, settings: { attribute: false } };
  render() {
    return html`<aside><h3><span aria-hidden="true">⚠</span> Hộp lưu ý</h3>
      <p>${this.content?.text || 'Bấm để nhập nội dung lưu ý.'}</p></aside>`;
  }
  static styles = css`
    :host { display: block; }
    aside { padding: 20px 24px; border: 1px solid var(--antc-ring, #b9e2db); border-left: 4px solid var(--antc-primary, #0e7c72);
      border-radius: 12px; background: var(--antc-tint, #e3f4f1); color: var(--antc-text, #1a2033); overflow-wrap: anywhere; }
    h3 { margin: 0 0 8px; color: var(--antc-tint-text, #0a5e57); font: inherit; font-weight: 700; }
    p { margin: 0; white-space: pre-line; line-height: 1.7; }
  `;
}
customElements.define('antc-article-notice-preview', AntcArticleNoticePreview);
export default AntcArticleNoticePreview;
