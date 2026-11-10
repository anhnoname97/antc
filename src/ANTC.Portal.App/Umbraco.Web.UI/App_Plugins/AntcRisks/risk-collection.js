import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { DocumentService } from '@umbraco-cms/backoffice/external/backend-api';
import { RiskApi, refs, keyOf, value, label, active } from './risk-api.js?v=1.2.0';
import { responsiveShell } from './responsive-shell.js?v=1.2.0';

class AntcRiskCollection extends UmbLitElement {
    static properties = { _nodes: { state: true }, _id: { state: true }, _type: { state: true }, _types: { state: true }, _q: { state: true }, _filters: { state: true }, _selection: { state: true }, _page: { state: true }, _busy: { state: true }, _message: { state: true }, _confirm: { state: true }, _error: { state: true } };
    constructor() {
        super(); this._nodes = []; this._types = {}; this._q = ''; this._filters = {}; this._selection = new Set(); this._page = 1;
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth) { this._api = new RiskApi(auth); this._load(); } });
        this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, ctx => {
            this.observe(ctx?.data, data => { this._id = data?.unique; this._load(); }, 'risk-collection-id');
            this.observe(ctx?.structure.contentTypeAliases, aliases => { this._type = aliases?.includes('articleFolder') ? 'riskArticlePage' : 'alertPage'; this._load(); }, 'risk-collection-type');
        });
    }
    firstUpdated() { this._shell = responsiveShell(this, state => { this._mobile = state; this.requestUpdate(); }); }
    disconnectedCallback() { this._shell?.dispose(); super.disconnectedCallback(); }
    async _load() {
        if (!this._api || !this._id || !this._type) return;
        const request = this._loadRequest = (this._loadRequest || 0) + 1;
        this._busy = true; this._error = '';
        try {
            const [rows, lookups, types] = await Promise.all([
                this._api.catalog(true, new URLSearchParams({ type: this._type, parent: this._id }).toString()),
                this._api.catalog(true, 'type=riskCategoryPage,topicItem,popularityItem,channelItem'), this._api.request('types')]);
            if (request === this._loadRequest) { this._nodes = [...rows, ...lookups]; this._types = types; }
        } catch (e) { if (request === this._loadRequest) this._error = e.message; }
        finally { if (request === this._loadRequest) this._busy = false; }
    }
    _refNames(row, alias) { const ids = refs(value(row, alias)); return this._nodes.filter(n => ids.includes(keyOf(n.key))).map(n => n.name).join(' · '); }
    _rows() {
        const q = this._q.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        return this._nodes.filter(n => n.type === this._type && n.parentKey === this._id)
            .filter(n => !q || `${n.name} ${value(n, 'title') || ''}`.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(q))
            .filter(n => Object.entries(this._filters).every(([k, v]) => !v || (k === 'status' ? (n.published ? 'pub' : 'draft') === v
                : ['articleKind', 'cautionLevel'].includes(k) ? label(value(n, k)) === v : refs(value(n, k)).includes(keyOf(v))))).sort((a, b) => a.order - b.order);
    }
    _filter(alias, placeholder, options) { return html`<select aria-label=${placeholder} .value=${this._filters[alias] || ''} @change=${e => { this._filters = { ...this._filters, [alias]: e.target.value }; this._page = 1; this._selection = new Set(); }}><option value="">${placeholder}</option>${options.map(([id, text]) => html`<option value=${id}>${text}</option>`)}</select>`; }
    _pick(type) { return this._nodes.filter(n => n.type === type && active(n)).map(n => [n.key, n.name]); }
    _toggle(key) { const set = new Set(this._selection); set.has(key) ? set.delete(key) : set.add(key); this._selection = set; }
    async _bulk() {
        const mode = this._confirm; this._confirm = null; this._busy = true; this._error = ''; const done = [], failed = [], referenced = [];
        for (const id of this._selection) {
            try {
                if (mode === 'delete') {
                    const node = this._nodes.find(n => n.key === id);
                    if (!node?.canDelete) { failed.push(node?.name || id); continue; }
                    const references = await DocumentService.getDocumentByIdReferencedBy({ path: { id }, query: { skip: 0, take: 20 }, throwOnError: false });
                    if (!references.response.ok) { failed.push(node.name); continue; }
                    if (references.data?.total > 0) {
                        const names = (references.data.items || []).map(n => n.variants?.[0]?.name || n.name || n.id).join(' · ');
                        referenced.push(node.name + (names ? ' (được dùng bởi: ' + names + ')' : '')); continue;
                    }
                    const result = await DocumentService.putDocumentByIdMoveToRecycleBin({ path: { id }, throwOnError: false });
                    (result.response.ok ? done : failed).push(result.response.ok ? id : node.name);
                    continue;
                }
                const result = mode === 'publish' ? await DocumentService.putDocumentByIdPublish({ path: { id }, body: { publishSchedules: [{ culture: null, schedule: null }] }, throwOnError: false })
                    : await DocumentService.putDocumentByIdUnpublish({ path: { id }, body: { cultures: null }, throwOnError: false });
                if (!result.response.ok) failed.push(this._nodes.find(n => n.key === id)?.name || id); else done.push(id);
            } catch { failed.push(this._nodes.find(n => n.key === id)?.name || id); }
        }
        this._message = mode === 'publish' ? `Đã xuất bản ${done.length} mục.` : mode === 'delete' ? `Đã chuyển ${done.length} mục vào thùng rác.`
            : `Đã gỡ ${done.length} mục khỏi website. Các mục vẫn còn ở dạng nháp.`;
        if (failed.length) this._error = 'Không thực hiện được: ' + failed.join(' · ') + '. Mở từng mục để xem trường còn thiếu hoặc kiểm tra quyền.';
        if (referenced.length) this._error += ' Không xóa các mục còn được tham chiếu: ' + referenced.join(' · ') + '.';
        const error = this._error; this._selection = new Set(); await this._load(); this._error = error;
    }
    async _move(from, to) {
        if (this._busy || this._q || Object.values(this._filters).some(Boolean)) return;
        const rows = this._rows(), i = rows.findIndex(n => n.key === from), j = rows.findIndex(n => n.key === to); if (i < 0 || j < 0) return;
        rows.splice(j, 0, rows.splice(i, 1)[0]); this._busy = true;
        try {
            const result = await DocumentService.putDocumentSort({ body: { parent: { id: this._id }, sorting: rows.map((n, order) => ({ id: n.key, sortOrder: order })) }, throwOnError: false });
            if (!result.response.ok) throw new Error('Bạn chưa có quyền sắp thứ tự.');
            this._message = 'Đã đổi thứ tự trong danh sách.'; await this._load();
        } catch (e) { this._error = e.message; } finally { this._busy = false; }
    }
    render() {
        const article = this._type === 'riskArticlePage', rows = this._rows(), pages = Math.max(1, Math.ceil(rows.length / 20));
        const page = Math.min(this._page, pages), shown = rows.slice((page - 1) * 20, page * 20);
        const fields = article ? ['Tiêu đề', 'Nhóm chính', 'Loại bài', 'Chuyên đề', 'Ghim', 'Ngày rà soát', 'Trạng thái'] : ['Tiêu đề', 'Mức độ', 'Phổ biến', 'Ngày cập nhật', 'Còn mới', 'Trạng thái'];
        return html`<div class="wrap">${this._mobile?.mobile ? html`<button type="button" aria-label="Mở cây nội dung" @click=${() => this._shell.toggle()}>☰ ${this._mobile.open ? 'Đóng' : 'Nội dung'}</button>` : nothing}<header><div><h2>${article ? 'Bài viết' : 'Cảnh báo'}</h2><p>Thêm, sửa ${article ? 'bài hướng dẫn, bài đọc chuyên đề và bài đọc thêm' : 'cảnh báo'}. Mục con được quản lý trong danh sách.</p></div>
            ${this._types[this._type] ? html`<a class="primary button" href=${`/umbraco/section/content/workspace/document/create/parent/document/${this._id}/${this._types[this._type]}`}>＋ Tạo ${article ? 'bài viết' : 'cảnh báo'}</a>` : nothing}</header>
            <div class="toolbar"><input type="search" aria-label="Tìm theo tiêu đề" placeholder="Tìm theo tiêu đề…" .value=${this._q} @input=${e => { this._q = e.target.value; this._page = 1; this._selection = new Set(); }}>
                ${article ? html`${this._filter('primaryGroup', 'Nhóm chính', this._pick('riskCategoryPage'))}${this._filter('articleKind', 'Loại bài', ['Bài hướng dẫn', 'Bài đọc chuyên đề', 'Bài đọc thêm'].map(s => [s, s]))}`
                    : html`${this._filter('cautionLevel', 'Mức độ', ['Cần thận trọng', 'Cao', 'Rất cao'].map(s => [s, s]))}${this._filter('popularity', 'Mức độ phổ biến', this._pick('popularityItem'))}${this._filter('channels', 'Kênh', this._pick('channelItem'))}`}
                ${this._filter('status', 'Trạng thái', [['pub', 'Đã đăng'], ['draft', 'Nháp']])}<button type="button" ?disabled=${this._busy} @click=${this._load}>↻ Làm mới</button></div>
            ${this._message ? html`<p role="status">${this._message}</p>` : nothing}${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}
            ${this._selection.size ? html`<div class="bulk"><b>Đã chọn ${this._selection.size} mục</b><button type="button" ?disabled=${this._busy} @click=${() => this._confirm = 'publish'}>Xuất bản</button><button type="button" ?disabled=${this._busy} @click=${() => this._confirm = 'unpublish'}>Gỡ khỏi website</button>${this._nodes.some(n => this._selection.has(n.key) && n.canDelete) ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._confirm = 'delete'}>Xóa</button>` : nothing}<button type="button" @click=${() => this._selection = new Set()}>Bỏ chọn</button></div>` : nothing}
            ${this._confirm ? html`<div class="confirm" role="alertdialog" aria-label="Xác nhận thao tác hàng loạt"><p>${this._confirm === 'publish' ? `Xuất bản ${this._selection.size} mục đã chọn?` : this._confirm === 'delete' ? `Chuyển ${this._selection.size} mục đã chọn vào thùng rác? Các mục còn được tham chiếu sẽ được giữ lại.` : `Gỡ ${this._selection.size} mục đã chọn khỏi website?`}</p><button type="button" @click=${this._bulk}>Thực hiện</button><button type="button" @click=${() => this._confirm = null}>Hủy</button></div>` : nothing}
            <div class="table"><table><thead><tr><th><input type="checkbox" aria-label="Chọn tất cả trong trang" .checked=${shown.length > 0 && shown.every(n => this._selection.has(n.key))} @change=${e => { const set = new Set(this._selection); shown.forEach(n => e.target.checked ? set.add(n.key) : set.delete(n.key)); this._selection = set; }}></th>${fields.map(f => html`<th>${f}</th>`)}</tr></thead>
            <tbody>${shown.map(n => html`<tr draggable=${!this._busy && !this._q && !Object.values(this._filters).some(Boolean)} @dragstart=${() => this._drag = n.key} @dragover=${e => e.preventDefault()} @drop=${e => { e.preventDefault(); this._move(this._drag, n.key); }}>
                <td><span aria-hidden="true">⋮⋮</span><input type="checkbox" aria-label=${'Chọn ' + n.name} .checked=${this._selection.has(n.key)} @change=${() => this._toggle(n.key)}></td><td><a href=${'/umbraco/section/content/workspace/document/edit/' + n.key}>${value(n, 'title') || n.name}</a></td>
                ${article ? html`<td>${this._refNames(n, 'primaryGroup')}</td><td>${label(value(n, 'articleKind'))}</td><td>${this._refNames(n, 'topic')}</td><td>${value(n, 'isFeatured') == 1 ? '✓' : '–'}</td><td>${String(value(n, 'reviewDate') || '').slice(0, 10)}</td>`
                : html`<td>${label(value(n, 'cautionLevel'))}</td><td>${this._refNames(n, 'popularity')}</td><td>${String(value(n, 'updatedDate') || '').slice(0, 10)}</td><td>${n.freshDaysLeft == null ? '–' : n.freshDaysLeft >= 0 ? html`<span class="status published pub">Còn ${n.freshDaysLeft} ngày</span>` : 'Quá 90 ngày'}</td>`}<td><span class="status ${n.published ? 'published' : ''}">${n.published ? 'Đã đăng' : 'Nháp'}</span></td></tr>`)}</tbody></table>
            ${!shown.length ? html`<p class="empty">${this._busy ? 'Đang tải…' : 'Không có mục phù hợp.'}</p>` : nothing}</div>
            <footer><span>${rows.length}/${this._nodes.filter(n => n.type === this._type && n.parentKey === this._id).length} mục${this._q || Object.values(this._filters).some(Boolean) ? ' · bỏ tìm kiếm và bộ lọc để kéo đổi thứ tự' : ' · kéo ⋮⋮ để đổi thứ tự hiện trên website'}</span><div><button type="button" ?disabled=${page <= 1} @click=${() => this._page = page - 1}>Trước</button> ${page} / ${pages} <button type="button" ?disabled=${page >= pages} @click=${() => this._page = page + 1}>Sau</button></div></footer>
        </div>`;
    }
    static styles = css`:host{display:block;height:100%;overflow:auto;background:#edf1f2;color:#18282b;font:inherit}.wrap{padding:24px;display:grid;gap:16px}header,footer,.toolbar,.bulk{display:flex;gap:10px;align-items:center;flex-wrap:wrap}header{justify-content:space-between}h2{font-size:22px;margin:0 0 6px}p{font-size:13px;color:#6d7d72;margin:0;line-height:1.6}input,select,button,.button{font:inherit;box-sizing:border-box;border:1px solid #c4d3c5;border-radius:6px;padding:8px 10px;background:white;color:inherit}button,.button{cursor:pointer;text-decoration:none}button:disabled{opacity:.4;cursor:default}.primary{background:#0e7c72;color:white;border-color:#0e7c72}.toolbar input{flex:1;min-width:200px}.toolbar select{max-width:210px}.table{border:1px solid #d4dfd4;border-radius:8px;overflow:auto;background:white}table{border-collapse:collapse;min-width:850px;width:100%;font-size:13px}th,td{padding:12px;text-align:left;border-bottom:1px solid #e2e8df}th{color:#60755f;background:#f0f4ec;font-weight:500}td a{color:#285d42;text-decoration:none}td a:hover{text-decoration:underline}tr[draggable=true]{cursor:grab}input[type=checkbox]{accent-color:#0e7c72;width:16px;height:16px}.status{border-radius:12px;background:#f7edd9;padding:3px 8px;font-size:11px;white-space:nowrap}.published{background:#e7f1e1;color:#386539}.bulk,.confirm{padding:12px;border:1px solid #baceb8;background:#edf4e9;border-radius:7px}.confirm button{margin:8px 8px 0 0}.empty{padding:24px;text-align:center}.error{color:#ac3327}footer{justify-content:space-between;font-size:12px;color:#6f7e6b}@media(max-width:650px){.wrap{padding:12px}.toolbar select{max-width:none;width:100%}}`;
}
customElements.define('antc-risk-collection', AntcRiskCollection);
export default AntcRiskCollection;
