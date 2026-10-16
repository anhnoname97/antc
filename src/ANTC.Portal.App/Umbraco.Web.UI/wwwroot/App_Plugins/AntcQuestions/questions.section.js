import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';

const base = '/umbraco/management/api/v1/antc/questions';
const statuses = { moi: 'Mới', 'dang-xu-ly': 'Đang xử lý', 'da-xu-ly': 'Đã xử lý', 'bo-qua': 'Bỏ qua' };
const types = { 'cau-hoi': 'Câu hỏi, kiến nghị', 'gop-y': 'Góp ý' };
const date = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';

export class AntcQuestionsSection extends UmbLitElement {
    static properties = {
        _data: { state: true }, _selected: { state: true }, _busy: { state: true },
        _error: { state: true }, _message: { state: true }, _dirty: { state: true },
    };
    constructor() {
        super();
        this._data = { items: [], total: 0, page: 1, totalPages: 1 };
        this._selected = null;
        this._filters = {};
        this._draft = {};
        this._rowDrafts = new Map();
        this._busy = false;
        this._dirty = false;
        this._error = '';
        this._message = '';
        this._sequence = 0;
        this._beforeUnload = event => { if (this._dirty || this._rowDrafts.size) { event.preventDefault(); event.returnValue = ''; } };
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
                && !this.shadowRoot?.activeElement?.matches('input,textarea,select')) this._load(this._data.page, true);
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
    _canLeave() { return !(this._dirty || this._rowDrafts.size) || window.confirm('Bỏ các thay đổi câu trả lời và ghi chú chưa lưu?'); }
    async _select(id) {
        if (!this._canLeave()) return;
        this._rowDrafts.clear();
        this._busy = true; this._error = ''; this._message = '';
        try {
            this._selected = await (await this._request('/' + id)).json();
            this._resetDraft();
            await this.updateComplete;
            this.shadowRoot.querySelector('#review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    _resetDraft() {
        this._draft = { status: this._selected.status, answer: this._selected.answer || '', adminNote: this._selected.adminNote || '' };
        this._dirty = false;
    }
    _edit(key, value) { this._draft[key] = value; this._dirty = true; this.requestUpdate(); }
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
    _close() { if (this._canLeave()) { this._selected = null; this._dirty = false; this._message = ''; } }
    async _act(action) {
        if (!this._selected || this._busy) return;
        this._busy = true; this._error = ''; this._message = '';
        try {
            const suffix = action === 'save' ? '' : '/' + action;
            const body = action === 'unpublish' ? { reviewVersion: this._selected.reviewVersion }
                : { ...this._draft, reviewVersion: this._selected.reviewVersion };
            const row = await (await this._request('/' + this._selected.id + suffix, {
                method: action === 'save' ? 'PUT' : 'POST', body: JSON.stringify(body),
            })).json();
            this._selected = row;
            if (action !== 'unpublish') this._resetDraft();
            this._data = { ...this._data, items: this._data.items.map(item => item.id === row.id ? row : item) };
            this._message = action === 'approve' ? 'Đã duyệt và công bố câu hỏi cùng câu trả lời.'
                : action === 'unpublish' ? 'Đã gỡ công bố. Nội dung không còn hiển thị công khai.'
                    : 'Đã lưu xử lý. Chỉ nút Duyệt và công bố mới đưa câu trả lời lên website.';
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
    _applyFilters(event) {
        event.preventDefault();
        if (!this._canLeave()) return;
        this._rowDrafts.clear();
        this._selected = null; this._dirty = false; this._message = ''; this._load(1);
    }
    render() {
        return html`
            <header><div><h1>Hỏi – Đáp</h1><p>Tiếp nhận câu hỏi, kiến nghị và góp ý người dùng gửi từ portal.</p></div>
                <uui-button look="secondary" label="Xuất CSV theo bộ lọc" @click=${this._export}>Xuất CSV theo bộ lọc</uui-button></header>
            ${this._error ? html`<div class="notice error" role="alert">${this._error}</div>` : nothing}
            ${this._message ? html`<div class="notice success" role="status">${this._message}</div>` : nothing}
            <uui-box headline="Danh sách tiếp nhận">
                <form class="filters" @submit=${this._applyFilters}>
                    <label>Loại<select aria-label="Lọc theo loại" @change=${event => this._filter('type', event.target.value)}>
                        <option value="">Tất cả loại</option>${Object.entries(types).map(([key, label]) => html`<option value=${key}>${label}</option>`)}</select></label>
                    <label>Trạng thái<select aria-label="Lọc theo trạng thái" @change=${event => this._filter('status', event.target.value)}>
                        <option value="">Tất cả trạng thái</option>${Object.entries(statuses).map(([key, label]) => html`<option value=${key}>${label}</option>`)}</select></label>
                    <label>Từ ngày<input type="date" aria-label="Từ ngày" @change=${event => this._filter('from', event.target.value)}></label>
                    <label>Đến ngày<input type="date" aria-label="Đến ngày" @change=${event => this._filter('to', event.target.value)}></label>
                    <label class="search">Tìm trong nội dung<input type="search" maxlength="200" aria-label="Tìm trong nội dung" @input=${event => this._filter('search', event.target.value)}></label>
                    <uui-button type="submit" look="primary" label="Lọc" ?disabled=${this._busy}>Lọc</uui-button>
                </form>
                <p class="muted">${this._data.total} nội dung · 50 dòng/trang · Tự cập nhật mỗi 5 giây khi không mở xử lý.</p>
                <div class="table-scroll"><table aria-label="Câu hỏi và góp ý đã tiếp nhận"><thead><tr>
                    <th>Thời điểm gửi</th><th>Loại</th><th>Nội dung</th><th>Trả lời riêng / liên hệ</th>
                    <th>Trạng thái</th><th>Ghi chú nội bộ</th><th>Công khai</th><th>Người xử lý</th><th>Thao tác</th>
                </tr></thead><tbody>
                    ${this._data.items.map(row => html`<tr>
                        <td>${date(row.createdAt)}</td><td>${types[row.type] || row.type}</td>
                        <td class="content">${row.content.length > 200 ? row.content.slice(0, 200) + '…' : row.content}</td>
                        <td>${row.wantReply ? 'Có yêu cầu trả lời riêng' : 'Không yêu cầu'}<div class="contact">${row.contact || '—'}</div></td>
                        <td><select aria-label=${`Trạng thái dòng ${row.id}`} .value=${this._rowDrafts.get(row.id)?.status || row.status}
                            ?disabled=${this._busy || !!this._selected} @change=${event => this._editRow(row, 'status', event.target.value)}>
                            ${Object.entries(statuses).map(([key, label]) => html`<option value=${key} ?selected=${key === (this._rowDrafts.get(row.id)?.status || row.status)}>${label}</option>`)}</select></td>
                        <td><textarea class="row-note" rows="2" maxlength="1000" aria-label=${`Ghi chú dòng ${row.id}`}
                            .value=${this._rowDrafts.get(row.id)?.adminNote ?? row.adminNote ?? ''} ?disabled=${this._busy || !!this._selected}
                            @input=${event => this._editRow(row, 'adminNote', event.target.value)}></textarea></td>
                        <td><span class=${row.isPublished ? 'badge published' : 'badge'}>${row.isPublished ? 'Đã công bố' : 'Chưa công bố'}</span></td>
                        <td>${row.handledBy || '—'}<div class="muted">${date(row.handledAt)}</div></td>
                        <td><div class="row-actions"><uui-button look="secondary" label="Xem và xử lý" data-id=${row.id} ?disabled=${this._busy} @click=${() => this._select(row.id)}>Xem và xử lý</uui-button>
                            <uui-button look="primary" label=${`Lưu dòng ${row.id}`} data-save-id=${row.id} ?disabled=${this._busy || !this._rowDrafts.has(row.id) || !!this._selected} @click=${() => this._saveRow(row)}>Lưu dòng</uui-button>
                            ${this._rowDrafts.has(row.id) ? html`<uui-button label="Hủy sửa dòng" look="secondary" @click=${() => this._cancelRow(row.id)}>Hủy</uui-button>` : nothing}</div></td>
                    </tr>`)}
                    ${!this._data.items.length ? html`<tr><td colspan="9" class="empty">${this._busy ? 'Đang tải…' : 'Chưa có nội dung phù hợp bộ lọc.'}</td></tr>` : nothing}
                </tbody></table></div>
                <div class="pagination"><uui-button label="Trang trước" look="secondary" ?disabled=${this._busy || this._rowDrafts.size > 0 || this._data.page <= 1} @click=${() => this._load(this._data.page - 1)}>Trước</uui-button>
                    <span>Trang ${this._data.page} / ${this._data.totalPages}</span>
                    <uui-button label="Trang sau" look="secondary" ?disabled=${this._busy || this._rowDrafts.size > 0 || this._data.page >= this._data.totalPages} @click=${() => this._load(this._data.page + 1)}>Sau</uui-button></div>
            </uui-box>
            ${this._selected ? this._renderReview() : nothing}
        `;
    }
    _renderReview() {
        const row = this._selected;
        return html`<uui-box id="review" headline=${`Xử lý nội dung #${row.id}`}>
            <div class="review-grid"><div>
                <h2>Nội dung người dùng gửi</h2><p class="muted">Nội dung gốc, chỉ xem.</p>
                <pre class="original">${row.content}</pre>
                <dl><dt>Loại</dt><dd>${types[row.type]}</dd><dt>Gửi lúc</dt><dd>${date(row.createdAt)}</dd>
                    <dt>Muốn trả lời riêng</dt><dd>${row.wantReply ? 'Có' : 'Không'}</dd>
                    <dt>Liên hệ (nội bộ)</dt><dd>${row.contact || '—'}</dd>
                    <dt>Công bố gần nhất</dt><dd>${date(row.approvedAt)} · ${row.approvedBy || '—'}</dd></dl>
                <p class="muted">Thông tin liên hệ và ghi chú chỉ hiển thị trong quản trị. Hệ thống không tự gửi email.</p>
            </div><div class="editor">
                <label>Câu trả lời<textarea id="answer" rows="8" maxlength="10000" .value=${this._draft.answer}
                    @input=${event => this._edit('answer', event.target.value)} placeholder="Nhập câu trả lời cho người dùng"></textarea></label>
                <p class="muted">Chỉ câu hỏi đã có câu trả lời và được duyệt mới hiển thị trên portal. Không duyệt nếu nội dung gốc chứa thông tin cá nhân.</p>
                <label>Trạng thái xử lý<select id="review-status" .value=${this._draft.status} @change=${event => this._edit('status', event.target.value)}>
                    ${Object.entries(statuses).map(([key, label]) => html`<option value=${key} ?selected=${key === this._draft.status}>${label}</option>`)}</select></label>
                <label>Ghi chú nội bộ<textarea id="admin-note" rows="3" maxlength="1000" .value=${this._draft.adminNote} @input=${event => this._edit('adminNote', event.target.value)}></textarea></label>
                ${this._dirty ? html`<p class="muted">Có thay đổi chưa lưu.</p>` : nothing}
                ${row.isPublished && row.answer !== row.publishedAnswer ? html`<p class="notice">Câu trả lời nháp đã thay đổi. Portal vẫn dùng bản đã duyệt trước đó.</p>` : nothing}
                <div class="actions">
                    <uui-button label="Lưu xử lý" look="secondary" data-action="save" ?disabled=${this._busy} @click=${() => this._act('save')}>Lưu xử lý</uui-button>
                    ${row.type === 'cau-hoi' ? html`<uui-button label="Duyệt và công bố" look="primary" color="positive" data-action="approve"
                        ?disabled=${this._busy || this._draft.answer.trim().length < 10} @click=${() => this._act('approve')}>Duyệt và công bố</uui-button>` : nothing}
                    ${row.isPublished ? html`<uui-button label="Gỡ công bố" look="secondary" color="danger" data-action="unpublish" ?disabled=${this._busy} @click=${() => this._act('unpublish')}>Gỡ công bố</uui-button>` : nothing}
                    <uui-button label="Đóng xử lý" look="secondary" ?disabled=${this._busy} @click=${this._close}>Đóng</uui-button>
                </div>
            </div></div>
        </uui-box>`;
    }
    static styles = css`
        :host{display:block;height:100%;overflow:auto;box-sizing:border-box;padding:24px;color:var(--uui-color-text);font-family:inherit}
        header{display:flex;gap:20px;justify-content:space-between;align-items:center;margin-bottom:20px}h1{margin:0;font-size:26px}header p{margin:8px 0 0}
        uui-box{display:block;margin-bottom:24px}h2{font-size:17px;margin:0 0 8px}.muted{font-size:13px;color:var(--uui-color-text-alt)}
        .filters{display:flex;gap:12px;align-items:end;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:600}
        input,select,textarea{box-sizing:border-box;border:1px solid var(--uui-color-border);border-radius:3px;padding:9px;background:var(--uui-color-surface);color:var(--uui-color-text);font:inherit;font-weight:400}
        input:focus,select:focus,textarea:focus{outline:2px solid var(--uui-color-selected);outline-offset:1px}.search{flex:1;min-width:180px}
        .table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:1000px;font-size:13px}th{text-align:left;white-space:nowrap;background:var(--uui-color-surface-alt)}
        th,td{padding:12px;border-bottom:1px solid var(--uui-color-border);vertical-align:top}td.content{min-width:230px;max-width:400px;white-space:pre-wrap;overflow-wrap:anywhere}td.contact,.contact{overflow-wrap:anywhere}
        .row-note{min-width:160px;width:100%}.row-actions{display:flex;flex-direction:column;gap:6px}.empty{text-align:center;padding:32px}.badge{display:inline-block;padding:4px 8px;border-radius:4px;background:var(--uui-color-surface-alt);white-space:nowrap}.published{color:var(--uui-color-positive);font-weight:600}
        .pagination{display:flex;gap:12px;align-items:center;justify-content:flex-end;margin-top:16px}.review-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.original{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.6;background:var(--uui-color-surface-alt);padding:16px;border-radius:4px}
        dl{display:grid;grid-template-columns:140px 1fr;gap:10px;font-size:13px}dt{font-weight:600}dd{margin:0;overflow-wrap:anywhere}.editor label{margin-bottom:14px}.editor textarea,.editor select{width:100%}.actions{display:flex;gap:8px;flex-wrap:wrap}
        .notice{padding:12px 16px;margin:0 0 18px;border:1px solid var(--uui-color-border);border-radius:4px;background:var(--uui-color-surface)}.error{border-color:var(--uui-color-danger);color:var(--uui-color-danger)}.success{border-color:var(--uui-color-positive);color:var(--uui-color-positive)}
        @media(max-width:1000px){.review-grid{grid-template-columns:1fr}:host{padding:16px}header{align-items:start}}
    `;
}
customElements.define('antc-questions-section', AntcQuestionsSection);
export { AntcQuestionsSection as element };
export default AntcQuestionsSection;
