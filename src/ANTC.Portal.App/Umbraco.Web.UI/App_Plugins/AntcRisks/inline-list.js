import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { list } from './risk-api.js?v=1.1.0';

class AntcInlineList extends UmbLitElement {
    static properties = { value: {}, config: {}, disabled: { type: Boolean }, readonly: { type: Boolean }, _opened: { state: true } };
    constructor() { super(); this._opened = new Set(); }
    get _disabled() { return this.disabled || this.readonly; }
    _setting(name) { return this.config?.getValueByAlias?.(name); }
    get rows() { try { return typeof this.value === 'string' ? JSON.parse(this.value || '[]') : this.value || []; } catch { return []; } }
    get fields() { return this._setting('fields') || []; }
    _change(rows) { if (this._disabled) return; this.value = JSON.stringify(rows); this.dispatchEvent(new UmbChangeEvent()); }
    _set(index, alias, value) { const rows = this.rows; rows[index] = { ...rows[index], [alias]: value }; this._change(rows); }
    _add(index = this.rows.length) { const rows = this.rows; if (rows.length >= (this._setting('maxRows') || 100)) return; const row = { key: crypto.randomUUID() }; rows.splice(index, 0, row); this._opened = new Set([...this._opened, row.key]); this._change(rows); }
    _move(i, j) { const rows = this.rows; if (j < 0 || j >= rows.length) return; rows.splice(j, 0, rows.splice(i, 1)[0]); this._change(rows); }
    _duplicate(i) { const rows = this.rows; if (rows.length >= (this._setting('maxRows') || 100)) return; const row = { ...structuredClone(rows[i]), key: crypto.randomUUID() }; rows.splice(i + 1, 0, row); this._opened = new Set([...this._opened, row.key]); this._change(rows); }
    _paste(e, index, fieldIndex) {
        const text = e.clipboardData.getData('text/plain');
        if (!text.includes('\t')) return;
        e.preventDefault();
        const rows = this.rows, fields = this.fields.filter(f => f.placement !== 'extra'), max = this._setting('maxRows') || 100;
        text.replace(/\r/g, '').trimEnd().split('\n').slice(0, max - index).forEach((line, offset) => {
            rows[index + offset] ||= { key: crypto.randomUUID() };
            line.split('\t').forEach((v, col) => { const f = fields[fieldIndex + col]; if (f) rows[index + offset][f.alias] = v; });
        }); this._change(rows);
    }
    _input(field, row, index, fi) {
        const id = `${row.key}-${field.alias}`;
        if (field.type === 'lines') return html`<textarea id=${id} aria-label=${field.label} rows="4" ?disabled=${this._disabled} .value=${list(row[field.alias]).join('\n')}
            @input=${e => this._set(index, field.alias, e.target.value.split('\n').filter(x => x.trim()))}></textarea><small>Mỗi dòng một bước · tối đa ${field.maxRows || 8}</small>`;
        return html`<input id=${id} aria-label=${field.label} ?disabled=${this._disabled} type=${field.type === 'date' ? 'date' : field.alias === 'url' ? 'url' : 'text'}
            maxlength=${field.maxChars || nothing} .value=${row[field.alias] || ''} @input=${e => this._set(index, field.alias, e.target.value)} @paste=${e => this._paste(e, index, fi)}>`;
    }
    _tools(row, i) { return html`<div class="tools"><button type="button" ?disabled=${this._disabled || i === 0} @click=${() => this._move(i, i - 1)} aria-label="Chuyển lên">↑</button>
        <button type="button" ?disabled=${this._disabled || i === this.rows.length - 1} @click=${() => this._move(i, i + 1)} aria-label="Chuyển xuống">↓</button>
        <button type="button" ?disabled=${this._disabled} @click=${() => this._duplicate(i)} aria-label="Nhân bản">⧉</button>
        <button type="button" ?disabled=${this._disabled} @click=${() => this._change(this.rows.filter(x => x.key !== row.key))} aria-label="Xóa dòng">×</button></div>`; }
    render() {
        const rows = this.rows, cards = this._setting('layout') === 'cards', fields = this.fields.filter(f => f.placement !== 'extra'), extras = this.fields.filter(f => f.placement === 'extra');
        return html`<div class="list ${cards ? 'cards' : ''}">
            ${cards ? repeat(rows, row => row.key, (row, i) => html`<section draggable=${!this._disabled} @dragstart=${() => this._drag = i} @dragover=${e => e.preventDefault()} @drop=${e => { e.preventDefault(); if (this._drag != null) this._move(this._drag, i); this._drag = null; }}>
                <header><button class="title" type="button" aria-expanded=${this._opened.has(row.key)} @click=${() => { const set = new Set(this._opened); set.has(row.key) ? set.delete(row.key) : set.add(row.key); this._opened = set; }}>${i + 1}. ${row[this._setting('summaryField')] || 'Kịch bản mới'} <small>${list(row.steps).length} bước</small></button>${this._tools(row, i)}</header>
                ${this._opened.has(row.key) ? html`<div class="body">${fields.map((f, fi) => html`<label for=${row.key + '-' + f.alias}>${f.label}${f.required ? ' *' : ''}</label>${this._input(f, row, i, fi)}`)}</div>` : nothing}
            </section>`) : html`<div class="table"><table><thead><tr>${fields.map(f => html`<th>${f.label}${f.required ? ' *' : ''}</th>`)}<th>Thao tác</th></tr></thead><tbody>
                ${repeat(rows, row => row.key, (row, i) => html`<tr>${fields.map((f, fi) => html`<td>${this._input(f, row, i, fi)}</td>`)}<td>${this._tools(row, i)}${extras.length ? html`<details><summary>Thêm chi tiết</summary>${extras.map(f => html`<label>${f.label}${this._input(f, row, i, 0)}</label>`)}</details>` : nothing}</td></tr>`)}</tbody></table>
                ${!rows.length ? html`<p>Chưa có dòng nào.</p>` : nothing}</div>`}
            <footer><button type="button" class="add" ?disabled=${this._disabled || rows.length >= (this._setting('maxRows') || 100)} @click=${() => this._add()}>＋ Thêm ${cards ? 'kịch bản' : 'dòng'}</button><small>${rows.length} / ${this._setting('maxRows') || 100}${cards ? '' : ' · Có thể dán bảng từ Excel'}</small></footer>
        </div>`;
    }
    static styles = css`:host{display:block;color:#18282b;font:inherit}.list{display:grid;gap:8px}section,.table{border:1px solid #d6dfe1;border-radius:8px;overflow:auto;background:white}header,footer,.tools{display:flex;align-items:center;gap:5px}header{padding:6px;background:#f7f8f5}.title{flex:1;text-align:left}.body{padding:16px;display:grid;gap:8px}button{font:inherit;color:inherit;background:transparent;border:0;border-radius:4px;cursor:pointer;padding:5px 7px}button:hover{background:#e3f4f1}button:disabled{opacity:.4;cursor:default}input,textarea{box-sizing:border-box;font:inherit;color:inherit;width:100%;padding:8px;border:1px solid #afbec2;border-radius:5px;background:white}input:focus,textarea:focus{outline:2px solid #bdd9c9}label{font-weight:500;font-size:13px}small{font-size:11px;color:#56686c}table{border-collapse:collapse;width:100%;min-width:450px}th{text-align:left;font-weight:500;font-size:12px;padding:9px;background:#f3f5f1}td{padding:5px;vertical-align:top;border-top:1px solid #d6dfe1}td input{border-color:transparent}td input:focus{border-color:#6b9484}.tools{white-space:nowrap}footer{justify-content:space-between}.add{border:1px dashed #91b1a2;padding:7px 12px}p{padding:10px;color:#56686c;font-size:13px}details{font-size:11px}details label{display:block;margin-top:8px}`;
}
customElements.define('antc-inline-list', AntcInlineList);
export default AntcInlineList;
