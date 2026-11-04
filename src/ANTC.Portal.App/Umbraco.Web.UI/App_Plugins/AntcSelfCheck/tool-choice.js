import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { QUESTION_KINDS } from './question-kinds.js?v=1.0.0';

const CHOICES = {
  meaning: [ ['co', 'Có'], ['khong', 'Không'], ['chuaBiet', 'Tôi chưa biết'] ],
};

class AntcToolChoice extends UmbLitElement {
  static properties = { value: {}, readonly: { type: Boolean }, open: { type: Boolean, reflect: true }, _mode: { state: true }, _active: { state: true } };
  static styles = css`
    :host { display: block; position: relative; }
    :host([open]) { z-index: 100; }
    select { width: 100%; min-height: 36px; padding: 6px 10px; border: 1px solid var(--uui-color-border);
      border-radius: var(--uui-border-radius, 3px); color: var(--uui-color-text); background: var(--uui-color-surface); font: inherit; }
    select:focus-visible { outline: 2px solid var(--uui-color-interactive); outline-offset: 2px; }
    button { font: inherit; color: inherit; cursor: pointer; }
    button:disabled { cursor: default; opacity: .6; }
    .control { position: relative; border: 1px solid var(--uui-color-border); border-radius: 8px; background: var(--uui-color-surface); }
    .control:focus-within { border-color: #008f87; box-shadow: 0 0 0 3px #008f8720; }
    .trigger { display: flex; align-items: center; width: 100%; min-height: 40px; padding: 8px 72px 8px 12px;
      border: 0; border-radius: inherit; background: transparent; text-align: left; outline: none; }
    .clear { position: absolute; right: 34px; top: 3px; width: 32px; height: 34px; border: 0; background: transparent; color: #60767d; font-size: 21px; }
    .arrow { position: absolute; right: 12px; top: 50%; translate: 0 -50%; pointer-events: none; color: #60767d; }
    .placeholder { color: var(--uui-color-text-alt); }
    .menu { position: absolute; z-index: 1000; top: calc(100% + 5px); left: 0; right: 0; margin: 0; padding: 5px 0;
      border: 1px solid #afc5cb; border-radius: 9px; background: var(--uui-color-surface); box-shadow: 0 12px 28px #17394320; }
    .option { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; }
    .option.active { background: #edf7f6; }
    .dot { width: 12px; height: 12px; flex: 0 0 12px; border-radius: 50%; }
    .check { margin-left: auto; color: #546f76; }
    .clear:focus-visible { outline: 2px solid #008f87; border-radius: 4px; }
  `;
  constructor() { super(); this.open = false; this._active = 0; }
  #outside = event => { if (!event.composedPath().includes(this)) this.open = false; };
  connectedCallback() { super.connectedCallback(); document.addEventListener('pointerdown', this.#outside, true); }
  disconnectedCallback() { document.removeEventListener('pointerdown', this.#outside, true); super.disconnectedCallback(); }
  set config(config) { this._mode = config?.getValueByAlias('mode'); }
  #change(event) {
    event.stopPropagation();
    this.#commit(event.target.value);
  }
  #commit(value) {
    if (this.readonly) return;
    this.value = value;
    this.open = false;
    this.dispatchEvent(new UmbChangeEvent());
  }
  #toggle() {
    if (this.readonly) return;
    this._active = Math.max(0, QUESTION_KINDS.findIndex(item => item.value === this.value));
    this.open = !this.open;
  }
  #key(event) {
    if (this.readonly) return;
    const { key } = event;
    if (key === 'Tab') { this.open = false; return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(key)) return;
    event.preventDefault(); event.stopPropagation();
    if (key === 'Escape') { this.open = false; return; }
    if (key === 'Enter' || key === ' ') {
      if (this.open) this.#commit(QUESTION_KINDS[this._active].value); else this.#toggle();
      return;
    }
    const wasOpen = this.open;
    if (!wasOpen) this.#toggle();
    if (key === 'Home') this._active = 0;
    else if (key === 'End') this._active = QUESTION_KINDS.length - 1;
    else if (wasOpen) this._active = (this._active + (key === 'ArrowDown' ? 1 : -1) + QUESTION_KINDS.length) % QUESTION_KINDS.length;
  }
  #renderKind() {
    const selected = QUESTION_KINDS.find(item => item.value === this.value);
    return html`<div class="control" @keydown=${this.#key}>
      <button type="button" class="trigger" role="combobox" aria-label="Loại câu" aria-haspopup="listbox"
        aria-expanded=${this.open ? 'true' : 'false'} aria-controls="kind-options"
        aria-activedescendant=${this.open ? `kind-option-${this._active}` : nothing}
        ?disabled=${this.readonly} @click=${this.#toggle}>
        <span class=${selected ? '' : 'placeholder'}>${selected?.label || 'Chọn loại câu…'}</span>
      </button>
      ${selected && !this.readonly ? html`<button type="button" class="clear" aria-label="Xóa loại câu" @click=${() => {
        this.#commit(''); this.renderRoot.querySelector('.trigger')?.focus();
      }}>×</button>` : nothing}
      <span class="arrow" aria-hidden="true">⌄</span>
    </div>
    ${this.open && !this.readonly ? html`<div class="menu" id="kind-options" role="listbox" aria-label="Loại câu">
      ${QUESTION_KINDS.map((item, index) => html`<div class=${`option ${index === this._active ? 'active' : ''}`}
        id=${`kind-option-${index}`} role="option" aria-selected=${item.value === this.value ? 'true' : 'false'}
        @pointerdown=${event => event.preventDefault()} @pointermove=${() => { this._active = index; }}
        @click=${() => this.#commit(item.value)}>
        <span class="dot" style=${`background:${item.color}`} aria-hidden="true"></span><span>${item.label}</span>
        ${item.value === this.value ? html`<span class="check" aria-hidden="true">✓</span>` : nothing}
      </div>`)}
    </div>` : nothing}`;
  }
  render() {
    if (this._mode === 'kind') return this.#renderKind();
    return html`<select aria-label=${this._mode === 'kind' ? 'Loại câu' : 'Được hiểu là'}
      ?disabled=${this.readonly} @change=${this.#change}>
      <option value="" ?selected=${!this.value}>Chọn…</option>
      ${(CHOICES[this._mode] ?? []).map(([value, label]) => html`<option value=${value} ?selected=${this.value === value}>${label}</option>`)}
    </select>`;
  }
}

customElements.define('antc-tool-choice', AntcToolChoice);
export default AntcToolChoice;
