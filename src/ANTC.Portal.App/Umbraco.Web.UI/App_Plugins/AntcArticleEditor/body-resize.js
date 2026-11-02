import { css, html } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

const minHeight = 64;
const maxHeight = 1600;

// Keep the native field mounted. Only change the RTE's public sizing variables;
// resizing never changes its value, configuration or document dirty state.
class AntcArticleBodyResize extends UmbLitElement {
  static properties = { disabled: { type: Boolean, reflect: true }, _announcement: { state: true } };

  _input() {
    const find = root => {
      for (const element of root?.children ?? []) {
        if (element.localName === 'umb-input-tiptap') return element;
        const input = find(element.shadowRoot) ?? find(element);
        if (input) return input;
      }
    };
    return find(this);
  }

  _setHeight(height) {
    const pixels = Math.round(Math.min(maxHeight, Math.max(minHeight, height)));
    // The native field re-applies its configured height when values change.
    // Constrain it through inherited min/max instead of editing its own styles.
    this.style.setProperty('--umb-rte-min-height', `${pixels}px`);
    this.style.setProperty('--umb-rte-max-height', `${pixels}px`);
    return pixels;
  }

  _startResize(event) {
    if (this.disabled || !event.isPrimary || event.button !== 0) return;
    const input = this._input();
    const content = input?.shadowRoot?.querySelector('#editor');
    if (!content || input.readonly) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.focus({ preventScroll: true });
    this._drag = { pointerId: event.pointerId, y: event.clientY, height: content.getBoundingClientRect().height };
    handle.setPointerCapture(event.pointerId);
    handle.setAttribute('data-dragging', '');
  }

  _resize(event) {
    if (!this._drag || event.pointerId !== this._drag.pointerId) return;
    this._setHeight(this._drag.height + event.clientY - this._drag.y);
  }

  _endResize(event) {
    if (!this._drag || event.pointerId !== this._drag.pointerId) return;
    this._drag = undefined;
    const handle = event.currentTarget;
    handle.removeAttribute('data-dragging');
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  }

  _resizeWithKeyboard(event) {
    if (this.disabled || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const input = this._input();
    const content = input?.shadowRoot?.querySelector('#editor');
    if (!content || input.readonly) return;
    event.preventDefault();
    const current = content.getBoundingClientRect().height;
    const height = event.key === 'Home' ? minHeight : event.key === 'End' ? maxHeight
      : current + (event.key === 'ArrowDown' ? 20 : -20);
    this._announcement = `Chiều cao nội dung: ${this._setHeight(height)} pixel.`;
  }

  disconnectedCallback() {
    this._drag = undefined;
    this.renderRoot.querySelector('.resize-handle')?.removeAttribute('data-dragging');
    super.disconnectedCallback();
  }

  render() {
    return html`<slot></slot><button type="button" class="resize-handle" ?disabled=${this.disabled}
      aria-label="Thay đổi chiều cao nội dung" aria-describedby="resize-help"
      title="Kéo lên/xuống để đổi chiều cao nội dung"
      @pointerdown=${this._startResize} @pointermove=${this._resize}
      @pointerup=${this._endResize} @pointercancel=${this._endResize} @lostpointercapture=${this._endResize}
      @keydown=${this._resizeWithKeyboard}></button>
      <span id="resize-help" class="sr-only">Kéo lên hoặc xuống. Dùng phím mũi tên lên, xuống để điều chỉnh bằng bàn phím.</span>
      <span class="sr-only" role="status">${this._announcement}</span>`;
  }

  static styles = css`
    :host { display: block; position: relative; min-width: 0; }
    .resize-handle {
      position: absolute; right: 1px; bottom: calc(var(--uui-size-layout-1, 24px) + 1px);
      display: grid; place-items: end; width: 24px; height: 24px; padding: 4px;
      border: 0; border-radius: 0 0 5px 0; background: transparent; color: var(--antc-muted, #5b6478);
      cursor: ns-resize; touch-action: none; user-select: none;
    }
    .resize-handle::after {
      content: ''; width: 12px; height: 12px; pointer-events: none;
      background: repeating-linear-gradient(135deg, transparent 0 3px, currentColor 3px 4px);
      clip-path: polygon(100% 0, 100% 100%, 0 100%);
    }
    .resize-handle:hover, .resize-handle[data-dragging] { background: var(--antc-tint, #e3f4f1); color: var(--antc-primary, #0e7c72); }
    .resize-handle:focus-visible { outline: 2px solid var(--antc-primary, #0e7c72); outline-offset: 1px; }
    :host([disabled]) .resize-handle { display: none; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `;
}

customElements.define('antc-article-body-resize', AntcArticleBodyResize);
