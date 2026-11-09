import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { UmbSorterController } from '@umbraco-cms/backoffice/sorter';
import '@umbraco-cms/backoffice/document';
import './wizard-answer-picker.js?v=1.0.0';

const choices = {
  kieuCuaVao: [['moTrang', 'Mở trang ngay'], ['moDanhSach', 'Mở danh sách lựa chọn']],
  hinhMinhHoaCuaVao: [['threat', 'Bị đe dọa'], ['harm', 'Đã có chuyện'], ['check', 'Chưa có chuyện']],
  hinhThucLienHe: [['goi', 'Gọi'], ['nhanTin', 'Nhắn tin'], ['goiVaNhanTin', 'Gọi và nhắn tin']],
  loaiCauKiemTra: [['phaiDung', 'Phải dừng'], ['tamHoan', 'Tạm hoãn']]
};
const rowsOf = value => {
  if (Array.isArray(value)) return value;
  try { const rows = JSON.parse(value || '[]'); return Array.isArray(rows) ? rows : []; } catch { return []; }
};
const guid = value => {
  const raw = String(value || '').replace('umb://document/', '').replaceAll('-', '');
  return /^[a-f0-9]{32}$/i.test(raw) ? `${raw.slice(0,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20)}` : '';
};

class AntcEmergencyList extends UmbLitElement {
  #lists = new Map();
  #sorters = new Map();
  updated() {
    for (const [id, sorter] of this.#sorters) {
      if (!this.#lists.has(id)) { sorter.destroy(); this.#sorters.delete(id); }
    }
    for (const [id, list] of this.#lists) {
      let sorter = this.#sorters.get(id);
      if (!sorter) {
        sorter = new UmbSorterController(this, {
          identifier: Symbol(id),
          containerSelector: `[data-sort-list="${id}"]`,
          itemSelector: `details[data-sort-owner="${id}"]`,
          handleSelector: 'summary',
          ignorerSelector: 'button,a,img,iframe,input,textarea,select,option',
          getUniqueOfElement: element => element.dataset.rowKey,
          getUniqueOfModel: row => row.key,
          onChange: ({ model }) => this.#lists.get(id)?.save(model)
        });
        this.#sorters.set(id, sorter);
      }
      sorter.setModel(list.rows);
      if (this.locked || this.setting('sortable') === false) sorter.disable(); else sorter.enable();
    }
  }
  static properties = { value: {}, config: {}, disabled: { type: Boolean }, readonly: { type: Boolean } };
  get locked() { return this.disabled || this.readonly; }
  setting(alias) { return this.config?.getValueByAlias(alias); }
  change(rows) { if (this.locked) return; this.value = JSON.stringify(rows); this.dispatchEvent(new UmbChangeEvent()); }
  edit(rows, index, field, value, save) { const next = structuredClone(rows); next[index][field] = value; save(next); }
  tools(rows, index, save, min) {
    return html`<span class="tools" @click=${e => { e.preventDefault(); e.stopPropagation(); }}>
      ${min === rows.length ? nothing : html`<button type="button" aria-label="Xóa dòng" title="Xóa dòng" ?disabled=${this.locked} @click=${() => save(rows.filter((_, i) => i !== index))}><umb-icon name="icon-trash"></umb-icon></button>`}
    </span>`;
  }
  input(field, row, set) {
    const value = row[field.alias];
    if (field.type === 'toggle') return html`<input class="toggle" aria-label=${field.label} type="checkbox" .checked=${value === true} ?disabled=${this.locked} @change=${e => set(e.target.checked)}>`;
    if (field.type === 'lines' && field.list === 'wizardAnswers') return html`<antc-wizard-answer-picker .value=${value || []} .target=${field.startNode} .disabled=${this.locked}
      @change=${e => { e.stopPropagation(); set(e.target.value); }}></antc-wizard-answer-picker>`;
    if (field.type === 'number') return html`<input aria-label=${field.label} type="number" min=${field.min ?? nothing} max=${field.max ?? nothing} .value=${value == null ? '' : String(value)} ?disabled=${this.locked} @input=${e => set(e.target.value === '' ? null : Number(e.target.value))}>`;
    if (field.type === 'table') return this.list(rowsOf(value), field.fields || [], next => set(next), field.minRows || 0, field.maxRows || 20, false, row.key + '-' + field.alias);
    if (field.type === 'content') return html`<umb-input-document .selection=${value ? [guid(value)].filter(Boolean) : []} .min=${0} .max=${1}
      .allowedContentTypeIds=${field.allowedContentTypes} .readonly=${this.locked}
      @change=${e => { e.stopPropagation(); const id = e.target.selection[0]; set(id ? 'umb://document/' + id.replaceAll('-', '') : ''); }}></umb-input-document>`;
    if (field.type === 'fixed') return html`<select aria-label=${field.label} ?disabled=${this.locked} @change=${e => set(e.target.value)}>
      <option value="" ?selected=${!value}>Chọn…</option>${(choices[field.list] || []).map(([code, label]) => html`<option value=${code} ?selected=${code === value}>${label}</option>`)}
    </select>`;
    if (field.type === 'area') return html`<textarea aria-label=${field.label} rows="3" maxlength=${field.maxChars || nothing} .value=${value || ''} ?disabled=${this.locked} @input=${e => set(e.target.value)}></textarea>`;
    if (field.type === 'lines') return html`<textarea aria-label=${field.label} rows="4" .value=${(value || []).join('\n')} ?disabled=${this.locked} @input=${e => set(e.target.value.split('\n').filter(x => x.trim()))}></textarea>`;
    return html`<input aria-label=${field.label} type=${field.type === 'date' ? 'date' : 'text'} maxlength=${field.maxChars || nothing} .value=${value || ''} ?disabled=${this.locked} @input=${e => set(e.target.value)}>`;
  }
  list(rows, fields, save, min, max, cards, listId = 'root') {
    this.#lists.set(listId, { rows, save });
    return html`<div class="rows" data-sort-list=${listId}>${repeat(rows, row => row.key, (row, index) => html`<details data-sort-owner=${listId} data-row-key=${row.key}>
      <summary class="drag-handle" title="Bấm để đóng/mở. Kéo tiêu đề để đổi thứ tự; bàn phím: Alt + mũi tên lên/xuống."
          @keydown=${e => {
            if (!e.altKey || !['ArrowUp', 'ArrowDown'].includes(e.key) || this.locked || this.setting('sortable') === false) return;
            e.preventDefault(); e.stopPropagation();
            const target = index + (e.key === 'ArrowUp' ? -1 : 1);
            if (target < 0 || target >= rows.length) return;
            const next = [...rows]; next.splice(target, 0, next.splice(index, 1)[0]); save(next);
          }}>
        <b>${index + 1}. ${row.title || row.mainText || row.noticeTitle || row.question || row.label || row.groupName || row.organization || row.number || row.text || 'Mục nội dung'}</b>${this.tools(rows, index, save, min)}</summary>
      <div class="fields">${fields.filter(f => !f.showWhen || String(row[f.showWhen.field] ?? false) === String(f.showWhen.equals)).map(field => html`<div class="field">
        <label>${field.label}${field.required ? html`<span class="required"> *</span>` : nothing}</label>
        ${this.input(field, row, value => this.edit(rows, index, field.alias, value, save))}
        ${field.description ? html`<small>${field.description}</small>` : nothing}
      </div>`)}</div>
    </details>`)}
      ${rows.length < max ? html`<button class="add" type="button" ?disabled=${this.locked} @click=${() => save([...rows, { key: crypto.randomUUID(), ...Object.fromEntries(fields.filter(f => f.type === 'toggle').map(f => [f.alias, false])) }])}>＋ Thêm ${(listId === 'root' && this.setting('unitLabel')) || (cards ? 'mục' : 'dòng')}</button>` : nothing}
      <small>${rows.length}/${max}${min === max ? ' · Số mục cố định; có thể đổi thứ tự.' : ''}</small>
    </div>`;
  }
  render() { this.#lists.clear(); return this.list(rowsOf(this.value), this.setting('fields') || [], rows => this.change(rows), this.setting('minRows') || 0, this.setting('maxRows') || 20, this.setting('layout') === 'cards'); }
  static styles = css`
    :host{display:block}details{border:1px solid var(--uui-color-border,#ddd);border-radius:8px;background:var(--uui-color-surface,#fff);margin-bottom:10px}
    summary{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--uui-color-surface-alt,#f7f7f7);border-radius:8px;cursor:pointer;list-style:none}
    summary::-webkit-details-marker{display:none}summary::before{content:'›';font-size:20px;transition:transform .15s}details[open]>summary::before{transform:rotate(90deg)}summary>b{flex:1;min-width:0}umb-icon{width:16px;height:16px}
    .fields{padding:14px;display:grid;gap:16px}.field{display:grid;gap:6px}label{font-weight:600}.required{color:var(--uui-color-danger)}
    input,textarea,select{box-sizing:border-box;width:100%;font:inherit;border:1px solid var(--uui-color-border,#bbb);border-radius:5px;padding:9px;background:var(--uui-color-surface,#fff);color:inherit}
    input.toggle{width:22px;height:22px;accent-color:var(--uui-color-interactive)}
    button{font:inherit;cursor:pointer;border:1px solid var(--uui-color-border,#ddd);padding:6px 10px;border-radius:5px;background:var(--uui-color-surface,#fff);color:inherit}
    button:disabled{opacity:.45;cursor:default}.tools{display:flex;gap:4px}.add{width:100%;border-style:dashed}small{display:block;color:var(--uui-color-text-alt,#666);margin-top:4px}
    .drag-handle{cursor:grab;touch-action:none}.drag-handle:active{cursor:grabbing}details[drag-placeholder]{opacity:.35}
    input:focus-visible,textarea:focus-visible,select:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--uui-color-interactive);outline-offset:2px}
  `;
}
customElements.define('antc-emergency-list', AntcEmergencyList);
export default AntcEmergencyList;
