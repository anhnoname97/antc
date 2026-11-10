import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { label } from './risk-api.js?v=1.2.0';

const kinds = [ ['Bài hướng dẫn', 'Giúp người đọc nhận ra và xử lý một thủ đoạn. Cần dấu hiệu và việc cần làm.', 'icon-shield'],
    ['Bài đọc chuyên đề', 'Bài dài theo một trong 8 chuyên đề, dẫn tới bộ câu hỏi luyện tập.', 'icon-book-alt'],
    ['Bài đọc thêm', 'Phân tích, câu chuyện, kiến thức nền. Không cần dấu hiệu.', 'icon-document'] ];
class AntcArticleKind extends UmbLitElement {
    static properties = { value: {}, readonly: { type: Boolean } };
    _select(name) { if (this.readonly) return; this.value = [name]; this.dispatchEvent(new UmbChangeEvent()); }
    render() { return html`<div class="choices" role="radiogroup" aria-label="Loại bài">${kinds.map(([name, hint, icon], i) => html`<button type="button" role="radio" aria-checked=${label(this.value) === name} ?disabled=${this.readonly}
        @click=${() => this._select(name)} @keydown=${e => { if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); const next = (i + (['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : 2)) % 3; this._select(kinds[next][0]); this.shadowRoot.querySelectorAll('button')[next].focus(); } }}>
        <umb-icon name=${icon}></umb-icon><b>${name}</b><small>${hint}</small></button>`)}</div>`; }
    static styles = css`:host{display:block}.choices{display:grid;gap:7px}button{text-align:left;display:grid;grid-template-columns:20px 1fr;gap:5px 8px;border:1px solid #d6dfe1;border-radius:8px;padding:10px;background:#fff;color:#18282b;cursor:pointer;font:inherit}b{font-size:13px;font-weight:500}small{display:none;grid-column:2;color:#56686c;font-size:12px;line-height:1.5}[aria-checked=true]{border-color:#0e7c72;background:#e3f4f1;box-shadow:inset 0 0 0 1px #0e7c72}[aria-checked=true] small{display:block}umb-icon{width:17px;height:17px}button:disabled{cursor:default;opacity:.65}`;
}
customElements.define('antc-article-kind', AntcArticleKind);
export default AntcArticleKind;
