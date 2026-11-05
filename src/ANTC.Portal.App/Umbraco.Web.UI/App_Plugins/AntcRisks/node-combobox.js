import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { RiskApi, refs, keyOf, active, editorRefs } from './risk-api.js?v=1.0.2';

class AntcNodeCombobox extends UmbLitElement {
    static properties = { value: {}, config: {}, disabled: { type: Boolean }, readonly: { type: Boolean }, _rows: { state: true }, _open: { state: true }, _q: { state: true }, _index: { state: true }, _error: { state: true } };
    constructor() {
        super(); this._rows = []; this._q = ''; this._index = -1;
        this.consumeContext(UMB_AUTH_CONTEXT, async auth => {
            if (!auth) return;
            try { this._rows = await new RiskApi(auth).catalog(); } catch (e) { this._error = e.message; }
        });
        this._outside = e => { if (!e.composedPath().includes(this)) this._open = false; };
    }
    get _disabled() { return this.disabled || this.readonly; }
    connectedCallback() { super.connectedCallback(); document.addEventListener('pointerdown', this._outside); }
    disconnectedCallback() { document.removeEventListener('pointerdown', this._outside); super.disconnectedCallback(); }
    _setting(name) { return this.config?.getValueByAlias?.(name); }
    get _max() { return Number(this._setting('maxNumber')) || 1; }
    get _selected() { return refs(this.value); }
    _options() {
        const filter = String(this._setting('filter') || '').split(',').map(keyOf);
        const root = this._setting('startNode')?.id;
        return this._rows.filter(n => (!filter[0] || filter.includes(keyOf(n.contentTypeKey))) && (!root || n.parentKey === root) && active(n))
            .filter(n => n.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(this._q.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()));
    }
    _change(ids) { this.value = ids.length ? editorRefs(ids) : null; this.dispatchEvent(new UmbChangeEvent()); }
    _choose(n) {
        if (this._disabled) return;
        const key = keyOf(n.key), ids = this._selected;
        if (ids.includes(key)) this._change(ids.filter(x => x !== key));
        else if (this._max === 1) { this._change([key]); this._open = false; }
        else if (ids.length < this._max) this._change([...ids, key]);
        this._q = ''; this._index = -1;
    }
    _move(key, delta) { const ids = [...this._selected], i = ids.indexOf(key), j = i + delta; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; this._change(ids); }
    _keys(e) {
        const options = this._options();
        if (e.key === 'Escape') { this._open = false; e.stopPropagation(); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); this._open = true; this._index = Math.max(0, Math.min(options.length - 1, this._index + (e.key === 'ArrowDown' ? 1 : -1))); }
        if (e.key === 'Enter' && this._open && options.length) { e.preventDefault(); this._choose(options[Math.max(0, this._index)]); }
        if (e.key === 'Backspace' && !this._q && this._selected.length && !this._disabled) this._change(this._selected.slice(0, -1));
    }
    render() {
        const selected = this._selected, options = this._options();
        return html`<div class="field" @keydown=${this._keys}>
            ${selected.map(key => { const n = this._rows.find(x => keyOf(x.key) === key); return html`<span class="chip ${n && !active(n) ? 'off' : ''}" draggable=${!this._disabled && this._max > 1}
                @dragstart=${e => { e.dataTransfer.setData('text/plain', key); }} @dragover=${e => e.preventDefault()} @drop=${e => { e.preventDefault(); const from = e.dataTransfer.getData('text/plain'), ids = [...selected]; if (!ids.includes(from)) return; ids.splice(ids.indexOf(from), 1); ids.splice(ids.indexOf(key), 0, from); this._change(ids); }}>
                <span>${n?.name || 'Mục đã chọn'}${n && !active(n) ? ' · Ngừng dùng' : ''}</span>
                ${this._max > 1 ? html`<button type="button" ?disabled=${this._disabled} @click=${() => this._move(key, -1)} aria-label="Chuyển lên">↑</button><button type="button" ?disabled=${this._disabled} @click=${() => this._move(key, 1)} aria-label="Chuyển xuống">↓</button>` : nothing}
                <button type="button" ?disabled=${this._disabled} @click=${() => this._change(selected.filter(x => x !== key))} aria-label=${'Bỏ ' + (n?.name || 'mục')}>×</button></span>`; })}
            <input role="combobox" aria-label="Tìm và chọn" aria-expanded=${!!this._open} aria-controls="options" aria-autocomplete="list" aria-activedescendant=${this._index >= 0 ? 'opt-' + this._index : nothing}
                ?disabled=${this._disabled} .value=${this._q} placeholder=${selected.length ? 'Chọn thêm…' : 'Tìm và chọn…'} @focus=${() => this._open = true} @input=${e => { this._q = e.target.value; this._open = true; this._index = -1; }}>
            <button type="button" ?disabled=${this._disabled} @click=${() => this._open = !this._open} aria-label="Mở danh sách">⌄</button>
        </div>${this._max > 1 ? html`<small>${selected.length} / ${this._max} · Kéo hoặc dùng mũi tên để sắp thứ tự</small>` : nothing}
        ${this._open ? html`<div class="popup" id="options" role="listbox" aria-multiselectable=${this._max > 1}>
            ${options.map((n, i) => html`<button type="button" id=${'opt-' + i} role="option" class=${this._index === i ? 'focus' : ''} aria-selected=${selected.includes(keyOf(n.key))}
                ?disabled=${this._disabled || (selected.length >= this._max && this._max > 1 && !selected.includes(keyOf(n.key)))} @click=${() => this._choose(n)}>
                <span>${selected.includes(keyOf(n.key)) ? '✓' : '○'}</span> ${n.name}${!n.published ? html`<small>Nháp</small>` : nothing}</button>`)}
            ${!options.length ? html`<p>${this._error || 'Không có mục phù hợp.'}</p>` : nothing}
        </div>` : nothing}${this._error ? html`<p role="alert">${this._error}</p>` : nothing}`;
    }
    static styles = css`:host{display:block;position:relative;color:#18282b;font:inherit}.field{display:flex;flex-wrap:wrap;gap:5px;align-items:center;border:1px solid #afbec2;border-radius:6px;padding:5px;background:white;min-height:32px}.field:focus-within{outline:2px solid #b9e2db}input{flex:1;min-width:95px;width:100%;border:0;padding:5px;font:inherit;outline:none;background:transparent}button{font:inherit;color:inherit;cursor:pointer;border:0;background:transparent;border-radius:4px;padding:3px 5px}button:disabled{opacity:.45;cursor:default}.chip{display:inline-flex;align-items:center;gap:4px;padding:2px 5px 2px 9px;border:1px solid #b9e2db;border-radius:20px;background:#e3f4f1;font-size:13px}.chip.off{border-style:dashed;background:#f3f4f3}.chip[draggable=true]{cursor:grab}small{font-size:11px;color:#56686c;display:block;margin-top:4px}.popup{position:absolute;z-index:25;top:100%;left:0;right:0;max-height:280px;overflow:auto;box-shadow:0 8px 24px #1234;border:1px solid #afbec2;border-radius:6px;background:white;padding:5px}.popup button{display:flex;gap:8px;align-items:center;text-align:left;width:100%;padding:8px}.popup button:hover,.popup .focus{background:#e3f4f1}.popup button small{margin-left:auto}p{padding:5px;font-size:13px}`;
}
customElements.define('antc-node-combobox', AntcNodeCombobox);
export default AntcNodeCombobox;
