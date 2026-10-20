import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalToken } from '@umbraco-cms/backoffice/modal';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { statuses, types, date, confirmDiscard } from './questions.shared.js';

const base = '/umbraco/management/api/v1/antc/questions';
const reviewModal = new UmbModalToken('Antc.Modal.QuestionReview', {
    modal: { type: 'sidebar', size: 'large', title: 'Xử lý Hỏi – Đáp' },
});

export class AntcQuestionsSection extends UmbLitElement {
    static properties = {
        _data: { state: true }, _selected: { state: true }, _busy: { state: true },
        _error: { state: true }, _message: { state: true },
    };
    constructor() {
        super();
        this._data = { items: [], total: 0, page: 1, totalPages: 1 };
        this._selected = null;
        this._filters = {};
        this._rowDrafts = new Map();
        this._busy = false;
        this._error = '';
        this._message = '';
        this._sequence = 0;
        this._beforeUnload = event => { if (this._rowDrafts.size) { event.preventDefault(); event.returnValue = ''; } };
        this.consumeContext(UMB_AUTH_CONTEXT, auth => {
            if (!auth || this._auth) return;
            this._auth = auth;
            this._load();
        });
    }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('beforeunload', this._beforeUnload);
        this._timer = window.setInterval(() => {
            if (this._auth && !this._busy && !this._selected && !this._rowDrafts.size && !document.hidden
                && !this.shadowRoot?.activeElement?.matches('uui-input,uui-textarea,uui-select')) this._load(this._data.page, true);
        }, 5000);
    }
    disconnectedCallback() {
        window.clearInterval(this._timer);
        window.removeEventListener('beforeunload', this._beforeUnload);
        this._sequence++;
        super.disconnectedCallback();
    }
    async _request(path = '', options = {}, retry = true) {
        if (!this._auth) throw new Error('Đang khởi tạo phiên Umbraco.');
        const token = await this._auth.getLatestToken();
        const headers = new Headers(options.headers);
        // The native auth context can return an opaque marker backed by an httpOnly cookie.
        // Keep its Authorization header: Umbraco uses it to select backoffice authentication.
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body) headers.set('Content-Type', 'application/json');
        const response = await fetch(base + path, { ...options, headers, credentials: 'same-origin' });
        if (response.status === 401 && retry && await this._auth.validateToken()) return this._request(path, options, false);
        if (!response.ok) {
            if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại Umbraco.');
            if (response.status === 403) throw new Error('Bạn chưa được cấp quyền vào section Hỏi – Đáp.');
            const problem = await response.json().catch(() => null);
            throw new Error(problem?.error?.message || problem?.detail || `Không thực hiện được thao tác (${response.status}).`);
        }
        return response;
    }
    _query(page = 1) {
        const values = new URLSearchParams({ page: String(page) });
        for (const [key, value] of Object.entries(this._filters)) if (value) values.set(key, value);
        return '?' + values;
    }
    async _load(page = this._data.page, quietly = false) {
        const sequence = ++this._sequence;
        if (!quietly) { this._busy = true; this._error = ''; }
        try {
            const data = await (await this._request(this._query(page))).json();
            if (sequence === this._sequence && !(quietly && (this._selected || this._rowDrafts.size))) this._data = data;
        } catch (error) { if (sequence === this._sequence) this._error = error.message; }
        finally { if (sequence === this._sequence) this._busy = false; }
    }
    async _canLeave() { return !this._rowDrafts.size || await confirmDiscard(this); }
    async _select(id, trigger) {
        if (this._busy || this._selected || !await this._canLeave()) return;
        this._rowDrafts.clear();
        this._busy = true; this._error = ''; this._message = '';
        try {
            const row = await (await this._request('/' + id)).json();
            const manager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
            if (!this.isConnected) return;
            if (!manager) throw new Error('Không mở được khung xử lý trong Umbraco. Vui lòng tải lại trang.');
            this._selected = id;
            const modal = manager.open(this, reviewModal, { data: {
                row, request: this._request.bind(this),
                onUpdated: updated => {
                    this._data = { ...this._data, items: this._data.items.map(item => item.id === updated.id ? updated : item) };
                },
            } });
            this._busy = false;
            await modal.onSubmit().catch(() => {});
        } catch (error) { this._error = error.message; }
        finally {
            this._busy = false; this._selected = null;
            await this.updateComplete;
            trigger?.focus({ preventScroll: true });
        }
    }
    _editRow(row, key, value) {
        const draft = this._rowDrafts.get(row.id) || { status: row.status, adminNote: row.adminNote || '' };
        draft[key] = value; this._rowDrafts.set(row.id, draft); this.requestUpdate();
    }
    _cancelRow(id) { this._rowDrafts.delete(id); this.requestUpdate(); }
    async _saveRow(row) {
        const draft = this._rowDrafts.get(row.id);
        if (!draft || this._busy) return;
        this._busy = true; this._error = ''; this._message = '';
        try {
            const updated = await (await this._request('/' + row.id, {
                method: 'PUT', body: JSON.stringify({ ...draft, answer: row.answer, reviewVersion: row.reviewVersion }),
            })).json();
            this._data = { ...this._data, items: this._data.items.map(item => item.id === row.id ? updated : item) };
            this._rowDrafts.delete(row.id);
            this._message = 'Đã lưu trạng thái và ghi chú. Thao tác này không tự công bố câu trả lời.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    async _export() {
        this._error = '';
        try {
            const blob = await (await this._request('/export' + this._query())).blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = url; link.download = 'hoi-dap.csv'; link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) { this._error = error.message; }
    }
    _filter(key, value) { this._filters[key] = value; }
    async _applyFilters(event) {
        event.preventDefault();
        if (!await this._canLeave()) return;
        this._rowDrafts.clear();
        this._message = ''; this._load(1);
    }
    async _resetFilters() {
        if (!await this._canLeave()) return;
        this._filters = {}; this._rowDrafts.clear();
        this._message = ''; this._load(1);
    }
    render() {
        return html`
            <umb-body-layout headline="Hỏi – Đáp">
                <uui-button slot="action-menu" class="export-button" look="outline" label="Xuất CSV theo bộ lọc" @click=${this._export}>
                    <umb-icon name="icon-download"></umb-icon><span>Xuất CSV theo bộ lọc</span>
                </uui-button>
            <div class="page-shell">
            <p class="page-description">Tiếp nhận và xử lý câu hỏi, kiến nghị, góp ý từ portal.</p>
            ${this._error ? html`<div class="notice error" role="alert">${this._error}</div>` : nothing}
            ${this._message ? html`<div class="notice success" role="status">${this._message}</div>` : nothing}
            <uui-box headline="Danh sách tiếp nhận">
                <form class="filters" @submit=${this._applyFilters}>
                    <div class="field filter-search"><uui-label for="filter-search">Tìm trong nội dung</uui-label>
                        <uui-input id="filter-search" type="search" maxlength="200" label="Tìm trong nội dung" placeholder="Nhập từ khóa cần tìm…"
                            .value=${this._filters.search || ''} @input=${event => this._filter('search', event.target.value)}></uui-input></div>
                    <div class="field"><uui-label for="filter-type">Loại nội dung</uui-label>
                        <uui-select id="filter-type" label="Lọc theo loại" .options=${[{ value: '', name: 'Tất cả loại', selected: !this._filters.type }, ...Object.entries(types).map(([value, name]) => ({ value, name, selected: value === this._filters.type }))]}
                            @change=${event => this._filter('type', event.target.value)}></uui-select></div>
                    <div class="field"><uui-label for="filter-status">Trạng thái xử lý</uui-label>
                        <uui-select id="filter-status" label="Lọc theo trạng thái" .options=${[{ value: '', name: 'Tất cả trạng thái', selected: !this._filters.status }, ...Object.entries(statuses).map(([value, name]) => ({ value, name, selected: value === this._filters.status }))]}
                            @change=${event => this._filter('status', event.target.value)}></uui-select></div>
                    <div class="field"><uui-label for="filter-from">Ngày gửi từ</uui-label>
                        <uui-input id="filter-from" type="date" label="Từ ngày" .value=${this._filters.from || ''} @change=${event => this._filter('from', event.target.value)}></uui-input></div>
                    <div class="field"><uui-label for="filter-to">Đến ngày</uui-label>
                        <uui-input id="filter-to" type="date" label="Đến ngày" .value=${this._filters.to || ''} @change=${event => this._filter('to', event.target.value)}></uui-input></div>
                    <div class="filter-actions">
                        <uui-button look="outline" label="Đặt lại bộ lọc" ?disabled=${this._busy} @click=${this._resetFilters}>Đặt lại</uui-button>
                        <uui-button type="submit" look="primary" label="Lọc" ?disabled=${this._busy}><umb-icon name="icon-filter"></umb-icon><span>Áp dụng bộ lọc</span></uui-button>
                    </div>
                </form>
                <div class="list-meta"><span><strong>${this._data.total} nội dung</strong><span class="meta-divider">·</span>50 dòng / trang</span>
                    <span class="refresh-note"><span class="refresh-dot" aria-hidden="true"></span>Tự cập nhật mỗi 5 giây khi không mở xử lý</span></div>
                <div class="table-scroll"><table aria-label="Câu hỏi và góp ý đã tiếp nhận">
                    <colgroup><col class="column-content"><col class="column-contact"><col class="column-status"><col class="column-note"><col class="column-public"><col class="column-handler"><col class="column-actions"></colgroup>
                    <thead><tr>
                    <th>Nội dung gửi</th><th>Liên hệ</th>
                    <th>Trạng thái</th><th>Ghi chú nội bộ</th><th>Công khai</th><th>Người xử lý</th><th>Thao tác</th>
                </tr></thead><tbody>
                    ${this._data.items.map(row => html`<tr>
                        <td class="content"><div class="content-meta"><span class="type-label">${types[row.type] || row.type}</span><time>${date(row.createdAt)}</time></div>
                            <div class="content-preview">${row.content.length > 200 ? row.content.slice(0, 200) + '…' : row.content}</div></td>
                        <td><span class="reply-preference">${row.wantReply ? 'Muốn trả lời riêng' : 'Không yêu cầu'}</span><div class="contact" title=${row.contact || ''}>${row.contact || '—'}</div></td>
                        <td><uui-select label=${`Trạng thái dòng ${row.id}`}
                            .options=${Object.entries(statuses).map(([value, name]) => ({ value, name, selected: value === (this._rowDrafts.get(row.id)?.status || row.status) }))}
                            ?disabled=${this._busy || !!this._selected} @change=${event => this._editRow(row, 'status', event.target.value)}>
                            </uui-select></td>
                        <td><uui-textarea class="row-note" rows="2" maxlength="1000" label=${`Ghi chú dòng ${row.id}`}
                            .value=${this._rowDrafts.get(row.id)?.adminNote ?? row.adminNote ?? ''} ?disabled=${this._busy || !!this._selected}
                            @input=${event => this._editRow(row, 'adminNote', event.target.value)}></uui-textarea></td>
                        <td><span class=${row.isPublished ? 'badge published' : 'badge'}><span class="badge-dot" aria-hidden="true"></span>${row.isPublished ? 'Đã công bố' : 'Chưa công bố'}</span></td>
                        <td class="handler">${row.handledBy || '—'}<div class="muted handled-time">${date(row.handledAt)}</div></td>
                        <td><div class="row-actions"><uui-button look="secondary" label="Xem và xử lý" data-id=${row.id} ?disabled=${this._busy || !!this._selected} @click=${event => this._select(row.id, event.currentTarget)}>Xem và xử lý</uui-button>
                            ${this._rowDrafts.has(row.id) ? html`<uui-button look="primary" label=${`Lưu dòng ${row.id}`} data-save-id=${row.id} ?disabled=${this._busy || !!this._selected} @click=${() => this._saveRow(row)}>Lưu dòng</uui-button>` : nothing}
                            ${this._rowDrafts.has(row.id) ? html`<uui-button label="Hủy sửa dòng" look="secondary" @click=${() => this._cancelRow(row.id)}>Hủy</uui-button>` : nothing}</div></td>
                    </tr>`)}
                    ${!this._data.items.length ? html`<tr><td colspan="7" class="empty"><div class="empty-state"><umb-icon name="icon-chat"></umb-icon>
                        <strong>${this._busy ? 'Đang tải nội dung…' : 'Chưa có nội dung phù hợp'}</strong>
                        <p>${this._busy ? 'Vui lòng đợi trong giây lát.' : 'Câu hỏi và góp ý người dùng gửi từ portal sẽ xuất hiện tại đây.'}</p>
                    </div></td></tr>` : nothing}
                </tbody></table></div>
                <div class="pagination"><uui-button label="Trang trước" look="outline" ?disabled=${this._busy || this._rowDrafts.size > 0 || this._data.page <= 1} @click=${() => this._load(this._data.page - 1)}>Trước</uui-button>
                    <span>Trang ${this._data.page} / ${this._data.totalPages}</span>
                    <uui-button label="Trang sau" look="outline" ?disabled=${this._busy || this._rowDrafts.size > 0 || this._data.page >= this._data.totalPages} @click=${() => this._load(this._data.page + 1)}>Sau</uui-button></div>
            </uui-box>
            </div>
            </umb-body-layout>
        `;
    }
    static styles = [UmbTextStyles, css`
        :host { display:block; height:100%; min-width:0; color:var(--uui-color-text); }
        *, *::before, *::after { box-sizing:border-box; }
        .page-shell { max-width:1680px; margin:0 auto; }
        .page-description { margin:0 0 var(--uui-size-layout-1); color:var(--uui-color-text-alt); }
        uui-button { flex-shrink:0; }
        uui-button umb-icon { width:16px; height:16px; margin-right:6px; }
        .export-button { margin-right:var(--uui-size-layout-1); }
        .filters { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); align-items:end; gap:var(--uui-size-space-5) var(--uui-size-layout-1); padding-bottom:var(--uui-size-layout-1); border-bottom:1px solid var(--uui-color-border); }
        .field { display:flex; flex-direction:column; gap:var(--uui-size-space-3); min-width:0; }
        uui-input, uui-select, uui-textarea { width:100%; min-width:0; }
        .filter-search { grid-column:span 2; }
        .filter-actions { grid-column:span 2; display:flex; justify-content:flex-end; align-items:center; gap:10px; }
        .filter-actions uui-button { min-width:112px; }
        .list-meta { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin:18px 0 14px; font-size:13px; color:var(--uui-color-text-alt); }
        .list-meta strong { color:var(--uui-color-text); font-weight:600; }
        .meta-divider { margin:0 10px; }
        .refresh-note { display:flex; gap:8px; align-items:center; }
        .refresh-dot { width:6px; height:6px; border-radius:50%; background:var(--uui-color-positive); }
        .table-scroll { overflow-x:auto; border:1px solid var(--uui-color-border); border-radius:6px; }
        table { width:100%; min-width:1240px; table-layout:fixed; border-collapse:collapse; font-size:13px; line-height:1.6; }
        .column-contact { width:166px; }.column-status { width:138px; }.column-note { width:186px; }.column-public { width:122px; }.column-handler { width:142px; }.column-actions { width:148px; }
        th { padding:12px 14px; font-size:12px; font-weight:600; text-align:left; white-space:nowrap; background:var(--uui-color-surface-alt); }
        td { padding:16px 14px; border-top:1px solid var(--uui-color-border); vertical-align:top; overflow-wrap:anywhere; }
        tbody tr:hover { background:var(--uui-color-surface-alt); }
        .content-meta { display:flex; align-items:center; flex-wrap:wrap; gap:6px 10px; margin-bottom:8px; font-size:12px; color:var(--uui-color-text-alt); }
        .type-label { padding:2px 7px; border-radius:3px; color:var(--uui-color-text); background:var(--uui-color-surface-alt); }
        .content-preview { white-space:pre-wrap; }
        .reply-preference { display:block; margin-bottom:6px; color:var(--uui-color-text-alt); font-size:12px; }
        .contact { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.handler { overflow-wrap:anywhere; }
        .handled-time { margin-top:6px; font-size:12px; }
        .row-note { --uui-textarea-min-height:74px; }
        .row-actions { display:flex; flex-direction:column; align-items:stretch; gap:7px; }
        .row-actions uui-button { width:100%; }
        .badge { display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:3px 7px; border-radius:4px; color:var(--uui-color-text-alt); background:var(--uui-color-surface-alt); font-size:11px; font-weight:600; white-space:nowrap; }
        .badge-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
        .published { color:var(--uui-color-positive); background:color-mix(in srgb,var(--uui-color-positive) 10%,var(--uui-color-surface)); }
        .empty { padding:0; }
        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:200px; padding:32px 20px; text-align:center; }
        .empty-state umb-icon { width:28px; height:28px; margin-bottom:12px; color:var(--uui-color-text-alt); }
        .empty-state strong { font-size:15px; font-weight:600; }
        .empty-state p { margin:6px 0 0; color:var(--uui-color-text-alt); }
        .pagination { display:flex; justify-content:flex-end; align-items:center; gap:14px; padding-top:18px; font-size:13px; }
        .pagination uui-button { min-width:72px; }
        .muted { font-size:13px; color:var(--uui-color-text-alt); }
        .notice { padding:12px 16px; margin:0 0 20px; border:1px solid var(--uui-color-border); border-radius:6px; background:var(--uui-color-surface); }
        .error { border-color:var(--uui-color-danger); color:var(--uui-color-danger); }.success { border-color:var(--uui-color-positive); color:var(--uui-color-positive); }
        @media(max-width:1100px) { .filters { gap:var(--uui-size-space-4); } }
        @media(max-width:760px) { .filters { grid-template-columns:repeat(2,minmax(0,1fr)); }.filter-actions { justify-content:flex-start; }.list-meta { align-items:flex-start; flex-direction:column; }.refresh-note { font-size:12px; } }
    `];
}
customElements.define('antc-questions-section', AntcQuestionsSection);
export { AntcQuestionsSection as element };
export default AntcQuestionsSection;
