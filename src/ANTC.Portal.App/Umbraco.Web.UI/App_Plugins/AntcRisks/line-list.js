import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { list } from './risk-api.js?v=1.1.0';

class AntcLineList extends UmbLitElement {
    static properties = { value: {}, config: {}, readonly: { type: Boolean }, disabled: { type: Boolean } };
    get _max() { return Number(this.config?.getValueByAlias('max')) || 100; }
    get _rows() { return Array.isArray(this.value) ? this.value : list(this.value); }
    get _disabled() { return this.readonly || this.disabled; }
    _change(rows) { if (this._disabled) return; this.value = rows; this.dispatchEvent(new UmbChangeEvent()); }
    _move(i, j) { const rows = [...this._rows]; if (j < 0 || j >= rows.length) return; rows.splice(j, 0, rows.splice(i, 1)[0]); this._change(rows); }
    async _add(index = this._rows.length) { const rows = [...this._rows]; if (rows.length >= this._max) return; rows.splice(index, 0, ''); this._change(rows); await this.updateComplete; this.shadowRoot.querySelectorAll('input')[index]?.focus(); }
    render() { const rows = this._rows; return html`<div class="list">${rows.map((row, i) => html`<div class="row" draggable=${!this._disabled} @dragstart=${() => this._drag = i} @dragover=${e => e.preventDefault()} @drop=${e => { e.preventDefault(); if (this._drag != null) this._move(this._drag, i); this._drag = null; }}>
        <span class="grip" aria-hidden="true">⠿</span><input aria-label=${'Dòng ' + (i + 1)} ?disabled=${this._disabled} .value=${row}
            @input=${e => this._change(rows.map((r, j) => i === j ? e.target.value : r))}
            @keydown=${e => { if (e.key === 'Enter') { e.preventDefault(); this._add(i + 1); } if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); this._move(i, i - 1); } if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); this._move(i, i + 1); } }}
            @paste=${e => { const text = e.clipboardData.getData('text/plain'); if (!text.includes('\n')) return; e.preventDefault(); const next = [...rows]; next.splice(i, 1, ...text.replace(/\r/g, '').trimEnd().split('\n')); this._change(next.slice(0, this._max)); }}>
        <button type="button" ?disabled=${this._disabled || i === 0} @click=${() => this._move(i, i - 1)} aria-label="Chuyển lên">↑</button><button type="button" ?disabled=${this._disabled || i === rows.length - 1} @click=${() => this._move(i, i + 1)} aria-label="Chuyển xuống">↓</button><button type="button" ?disabled=${this._disabled} @click=${() => this._change(rows.filter((_, j) => i !== j))} aria-label="Xóa dòng">×</button>
    </div>`)}<footer><button class="add" type="button" ?disabled=${this._disabled || rows.length >= this._max} @click=${() => this._add()}>＋ Thêm dòng</button><small>${rows.length} / ${this._max} · Enter để thêm, Alt + ↑↓ để sắp thứ tự</small></footer></div>`; }
    static styles = css`:host{display:block;font:inherit;color:#18282b}.list{display:grid;gap:7px}.row{display:flex;gap:5px;align-items:center}.grip{color:#8a9a9e;cursor:grab}input{font:inherit;color:inherit;flex:1;min-width:0;border:1px solid #afbec2;border-radius:6px;padding:8px 10px;background:white}input:focus{outline:2px solid #b9e2db}button{font:inherit;color:#56686c;cursor:pointer;border:0;background:transparent;border-radius:5px;padding:5px}button:hover{background:#e3f4f1}button:disabled{opacity:.4;cursor:default}.add{border:1px dashed #afbec2;padding:7px 12px;color:#0e7c72}footer{display:flex;justify-content:space-between;gap:8px;align-items:center}small{font-size:11px;color:#56686c}@media(max-width:650px){footer{flex-wrap:wrap}}`;
}
customElements.define('antc-line-list', AntcLineList);
export default AntcLineList;
