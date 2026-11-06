import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { DocumentService } from '@umbraco-cms/backoffice/external/backend-api';

class AntcWizardUsage extends UmbLitElement {
  static properties = { config: {}, value: {}, _rows: { state: true }, _error: { state: true } };
  #loaded;
  updated() { const target = this.config?.getValueByAlias('target'); if (target && target !== this.#loaded) { this.#loaded = target; this.load(); } }
  async load() {
    this._error = ''; this._rows = undefined;
    try {
      const wizard = await DocumentService.getDocumentById({ path: { id: this.#loaded }, throwOnError: false });
      const folder = this.config?.getValueByAlias('folder');
      const children = await DocumentService.getTreeDocumentChildren({ query: { parentId: folder, take: 1000 }, throwOnError: false });
      if (!wizard.data || !children.data) throw new Error();
      const results = await Promise.allSettled(children.data.items.map(node => DocumentService.getDocumentById({ path: { id: node.id }, throwOnError: false })));
      if (results.some(result => result.status !== 'fulfilled' || !result.value.data)) throw new Error();
      const tactics = results.map(result => result.value.data).filter(node => ![false, 0, '0', 'false'].includes(node.values.find(value => value.alias === 'isActive')?.value));
      const selected = node => node.values.find(value => value.alias === 'wizardAnswers')?.value || [];
      this._rows = [2, 3].flatMap(step => {
        const value = wizard.data.values.find(value => value.alias === `step${step}Options`)?.value;
        return (typeof value === 'string' ? JSON.parse(value) : value || []).map(option => ({ label: `Câu ${step}: ${option.label}`, tactics: tactics.filter(node => selected(node).includes(option.key)) }));
      });
      this._rows.push({ label: 'Thủ đoạn chưa chọn câu trả lời', tactics: tactics.filter(node => !selected(node).length) });
    } catch { this._error = 'Chưa tải được thông tin liên kết. Bấm Làm mới để thử lại.'; }
  }
  render() { return html`<button type="button" @click=${() => this.load()}>Làm mới</button>${this._error ? html`<p role="alert">${this._error}</p>` : !this._rows ? html`<p>Đang tải…</p>` : html`<ul>${this._rows.map(row => html`<li><b>${row.label}</b><span>${row.tactics.length} thủ đoạn</span>${row.tactics.map(node => html`<a href=${`/umbraco/section/content/workspace/document/edit/${node.id}`}>${node.variants[0].name}</a>`)}</li>`)}</ul>`}`; }
  static styles = css`:host{display:block}ul{padding:0;list-style:none}li{display:grid;gap:7px;padding:14px 0;border-bottom:1px solid var(--uui-color-border)}a{color:var(--uui-color-interactive)}button{padding:8px 14px;font:inherit}span{color:var(--uui-color-text-alt)}`;
}
customElements.define('antc-wizard-usage', AntcWizardUsage);
export default AntcWizardUsage;
