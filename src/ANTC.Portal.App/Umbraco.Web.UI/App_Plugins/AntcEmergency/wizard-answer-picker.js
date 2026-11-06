import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { DocumentService } from '@umbraco-cms/backoffice/external/backend-api';

class AntcWizardAnswerPicker extends UmbLitElement {
  static properties = { value: {}, target: {}, config: {}, disabled: { type: Boolean }, readonly: { type: Boolean }, _options: { state: true }, _error: { state: true } };
  #loaded;
  updated() {
    const target = this.target || this.config?.getValueByAlias('target');
    if (target && target !== this.#loaded) { this.#loaded = target; this.load(target); }
  }
  async load(id) {
    this._error = '';
    try {
      const result = await DocumentService.getDocumentById({ path: { id }, throwOnError: false });
      if (!result.data) throw new Error();
      this._options = (this.target ? [1, 2, 3] : [2, 3]).flatMap(step => {
        const field = result.data.values.find(value => value.alias === `step${step}Options`)?.value;
        return (typeof field === 'string' ? JSON.parse(field) : field || []).map(option => ({ ...option, step }));
      });
    } catch { this._error = 'Chưa tải được lựa chọn trình hỏi. Mở lại trang để thử lại.'; }
  }
  render() {
    if (this._error) return html`<p role="alert">${this._error}</p>`;
    if (!this._options) return html`<p>Đang tải lựa chọn…</p>`;
    const selected = Array.isArray(this.value) ? this.value : [];
    const missing = selected.filter(key => !this._options.some(option => option.key === key));
    return html`<div class="choices">${this._options.map(option => html`<label><input type="checkbox" .checked=${selected.includes(option.key)} ?disabled=${this.disabled || this.readonly}
      @change=${event => { event.stopPropagation(); this.value = event.target.checked ? [...selected, option.key] : selected.filter(key => key !== option.key); this.dispatchEvent(new UmbChangeEvent()); }}><span>Câu ${option.step}: ${option.label}</span></label>`)}</div>
      ${missing.length ? html`<p role="alert">${missing.length} lựa chọn đã bị xóa khỏi trình hỏi. Kiểm tra lại điều kiện.</p>` : nothing}`;
  }
  static styles = css`:host{display:block}.choices{display:grid;gap:8px;max-height:280px;overflow:auto;padding:10px;border:1px solid var(--uui-color-border);border-radius:6px}label{display:flex;gap:10px;align-items:start;line-height:1.5}input{width:18px;height:18px;flex:none}p{margin:8px 0;color:var(--uui-color-text-alt)}`;
}
customElements.define('antc-wizard-answer-picker', AntcWizardAnswerPicker);
export default AntcWizardAnswerPicker;
