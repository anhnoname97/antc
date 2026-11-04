import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UMB_UFM_RENDER_CONTEXT } from '@umbraco-cms/backoffice/ufm';
import { QUESTION_KINDS } from './question-kinds.js?v=1.0.0';

const headerStyle = new CSSStyleSheet();
headerStyle.replaceSync('uui-symbol-expand { display: none !important; }');

class AntcSelfCheckQuestionLabel extends UmbLitElement {
  #cardRoot;
  static properties = { mode: {}, _data: { state: true } };
  static styles = css`
    :host { display: inline-block; vertical-align: middle; }
    .title { display: inline-flex; align-items: center; gap: 9px; max-width: min(1050px, 64vw); }
    .number { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
      flex: 0 0 26px; border-radius: 50%; color: white; background: #087e76; font-weight: 600; }
    .question { min-width: 0; max-width: min(800px, 46vw); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { display: inline-flex; gap: 6px; align-items: center; flex-shrink: 0; padding: 3px 8px; margin-left: 8px;
      border: 1px solid var(--uui-color-border); border-radius: 5px; font-size: 12px; white-space: nowrap; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    @media (max-width: 900px) { .question { max-width: 27vw; } }
  `;
  constructor() {
    super();
    this.consumeContext(UMB_UFM_RENDER_CONTEXT, context => {
      this.observe(context?.value, data => { this._data = data; }, 'question-label');
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      // The native chevron only appears on hover. Scope its removal to question cards.
      let node = this;
      while (node) {
        if (node.localName === 'umb-inline-list-block') {
          this.#cardRoot = node.shadowRoot;
          if (this.#cardRoot && !this.#cardRoot.adoptedStyleSheets.includes(headerStyle)) {
            this.#cardRoot.adoptedStyleSheets = [...this.#cardRoot.adoptedStyleSheets, headerStyle];
          }
          return;
        }
        node = node.parentElement ?? node.getRootNode()?.host;
      }
    });
  }
  disconnectedCallback() {
    if (this.#cardRoot) {
      this.#cardRoot.adoptedStyleSheets = this.#cardRoot.adoptedStyleSheets.filter(sheet => sheet !== headerStyle);
      this.#cardRoot = undefined;
    }
    super.disconnectedCallback();
  }
  render() {
    const data = this._data ?? {};
    const kind = QUESTION_KINDS.find(item => item.value === data.kind);
    const branch = this.mode === 'branch';
    const badge = branch ? (data.take ? `Bước ${data.take}` : 'Chưa chọn bước') : kind?.label || 'Chưa chọn loại câu';
    return html`<span class="title"><span class="number">${(data.$index ?? 0) + 1}</span>
      <span class="question" title=${data.q || ''}>${data.q || 'Câu hỏi mới'}</span>
      <span class="badge" style=${branch ? 'color:#176b77;background:#edf8fa' : `color:${kind?.color || '#60767d'};background:${kind?.tint || '#f3f6f7'}`}>
        <span class="dot" aria-hidden="true"></span>${badge}
      </span>
    </span>`;
  }
}

customElements.define('ufm-antc-question-label', AntcSelfCheckQuestionLabel);
export default AntcSelfCheckQuestionLabel;
