import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { list } from './risk-api.js?v=1.1.0';
import { iconPaths } from './icon-paths.js?v=1.1.0';

class AntcFixedChoice extends UmbLitElement {
    static properties = { value: {}, config: {}, readonly: { type: Boolean }, _open: { state: true }, _q: { state: true }, _index: { state: true } };
    constructor() { super(); this._q = ''; this._index = -1; this._outside = e => { if (!e.composedPath().includes(this)) this._open = false; }; }
    connectedCallback() { super.connectedCallback(); document.addEventListener('pointerdown', this._outside); }
    disconnectedCallback() { document.removeEventListener('pointerdown', this._outside); super.disconnectedCallback(); }
    _options() { return (this.config?.getValueByAlias('items') || []).map(x => typeof x === 'string' ? x : x.value || x.name || '').filter(x => x.toLocaleLowerCase('vi').includes(this._q.toLocaleLowerCase('vi'))); }
    _iconCode(value) { const code = value?.split(' · ').at(-1); return Object.hasOwn(iconPaths, code) ? code : null; }
    _label(value) { return this._iconCode(value) ? value.slice(0, value.lastIndexOf(' · ')) : value; }
    _icon(value) {
        const code = this._iconCode(value);
        return code ? html`<svg class="icon" data-icon=${code} viewBox="0 0 24 24" aria-hidden="true"><path d=${iconPaths[code]}></path></svg>` : nothing;
    }
    _set(v) { if (this.readonly) return; this.value = v ? [v] : null; this._open = false; this._q = ''; this.dispatchEvent(new UmbChangeEvent()); }
    render() { const current = list(this.value)[0], options = this._options(); return html`<div class="field">${this._icon(current)}<input role="combobox" aria-label="Tìm và chọn" aria-controls="choices" aria-expanded=${!!this._open} ?disabled=${this.readonly} .value=${this._open ? this._q : this._label(current) || ''} placeholder="Chọn…" @focus=${() => this._open = true} @input=${e => { this._q = e.target.value; this._index = -1; this._open = true; }}
        @keydown=${e => { if (e.key === 'Escape') this._open = false; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); this._open = true; this._index = Math.max(0, Math.min(options.length - 1, this._index + (e.key === 'ArrowDown' ? 1 : -1))); } if (e.key === 'Enter' && this._open && options.length) { e.preventDefault(); this._set(options[Math.max(0, this._index)]); } }}>
        ${current ? html`<button type="button" ?disabled=${this.readonly} aria-label="Bỏ lựa chọn" @click=${() => this._set(null)}>×</button>` : nothing}<button type="button" ?disabled=${this.readonly} aria-label="Mở danh sách" @click=${() => this._open = !this._open}>⌄</button></div>
        ${this._open ? html`<div class="options" id="choices" role="listbox">${options.map((v, i) => html`<button type="button" role="option" aria-selected=${v === current} class=${i === this._index ? 'selected' : ''} @click=${() => this._set(v)}>${this._icon(v)}<span>${this._label(v)}</span>${v === current ? html`<span class="tick" aria-hidden="true">✓</span>` : nothing}</button>`)}${!options.length ? html`<p>Không có mục phù hợp.</p>` : nothing}</div>` : nothing}`; }
    static styles = css`:host{display:block;position:relative;font:inherit;color:#18282b}.field{display:flex;align-items:center;border:1px solid #afbec2;border-radius:6px;background:white}.icon{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.field>.icon{margin-left:10px}input{width:100%;flex:1;min-width:0;border:0;background:transparent;padding:8px 10px;font:inherit;color:inherit;outline:none}.field:focus-within{outline:2px solid #b9e2db}button{font:inherit;color:inherit;border:0;background:transparent;padding:5px;cursor:pointer}button:disabled{opacity:.4;cursor:default}.options{position:absolute;top:100%;left:0;right:0;z-index:25;max-height:280px;overflow:auto;padding:5px;border:1px solid #afbec2;border-radius:6px;background:white;box-shadow:0 8px 28px #0b3b3a29}.options button{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:8px;border-radius:4px}.tick{margin-left:auto}.options button:hover,.selected{background:#e3f4f1}p{padding:8px;font-size:12px}`;
}
customElements.define('antc-fixed-choice', AntcFixedChoice);
export default AntcFixedChoice;
