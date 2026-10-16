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
    _resetFilters() {
        if (!this._canLeave()) return;
        this._filters = {}; this._rowDrafts.clear();
        this.shadowRoot.querySelector('.filters')?.reset();
        this._selected = null; this._dirty = false; this._message = ''; this._load(1);
    }
    render() {
        return html`
            <div class="page-shell">
            <header class="page-header"><div><h1>Hỏi – Đáp</h1><p>Tiếp nhận và xử lý câu hỏi, kiến nghị, góp ý từ portal.</p></div>
                <uui-button class="export-button" look="outline" label="Xuất CSV theo bộ lọc" @click=${this._export}>
                    <umb-icon name="icon-download"></umb-icon><span>Xuất CSV theo bộ lọc</span>
                </uui-button></header>
            ${this._error ? html`<div class="notice error" role="alert">${this._error}</div>` : nothing}
            ${this._message ? html`<div class="notice success" role="status">${this._message}</div>` : nothing}
            <uui-box headline="Danh sách tiếp nhận">
                <form class="filters" @submit=${this._applyFilters}>
                    <label class="filter-search"><span>Tìm trong nội dung</span><input type="search" maxlength="200" aria-label="Tìm trong nội dung" placeholder="Nhập từ khóa cần tìm…" @input=${event => this._filter('search', event.target.value)}></label>
                    <label><span>Loại nội dung</span><select aria-label="Lọc theo loại" @change=${event => this._filter('type', event.target.value)}>
                        <option value="">Tất cả loại</option>${Object.entries(types).map(([key, label]) => html`<option value=${key}>${label}</option>`)}</select></label>
                    <label><span>Trạng thái xử lý</span><select aria-label="Lọc theo trạng thái" @change=${event => this._filter('status', event.target.value)}>
                        <option value="">Tất cả trạng thái</option>${Object.entries(statuses).map(([key, label]) => html`<option value=${key}>${label}</option>`)}</select></label>
                    <label><span>Ngày gửi từ</span><input type="date" aria-label="Từ ngày" @change=${event => this._filter('from', event.target.value)}></label>
                    <label><span>Đến ngày</span><input type="date" aria-label="Đến ngày" @change=${event => this._filter('to', event.target.value)}></label>
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
                        <td><select aria-label=${`Trạng thái dòng ${row.id}`} .value=${this._rowDrafts.get(row.id)?.status || row.status}
                            ?disabled=${this._busy || !!this._selected} @change=${event => this._editRow(row, 'status', event.target.value)}>
                            ${Object.entries(statuses).map(([key, label]) => html`<option value=${key} ?selected=${key === (this._rowDrafts.get(row.id)?.status || row.status)}>${label}</option>`)}</select></td>
                        <td><textarea class="row-note" rows="2" maxlength="1000" aria-label=${`Ghi chú dòng ${row.id}`}
                            .value=${this._rowDrafts.get(row.id)?.adminNote ?? row.adminNote ?? ''} ?disabled=${this._busy || !!this._selected}
                            @input=${event => this._editRow(row, 'adminNote', event.target.value)}></textarea></td>
                        <td><span class=${row.isPublished ? 'badge published' : 'badge'}><span class="badge-dot" aria-hidden="true"></span>${row.isPublished ? 'Đã công bố' : 'Chưa công bố'}</span></td>
                        <td class="handler">${row.handledBy || '—'}<div class="muted handled-time">${date(row.handledAt)}</div></td>
                        <td><div class="row-actions"><uui-button look="secondary" label="Xem và xử lý" data-id=${row.id} ?disabled=${this._busy} @click=${() => this._select(row.id)}>Xem và xử lý</uui-button>
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
            ${this._selected ? this._renderReview() : nothing}
            </div>
        `;
    }
    _renderReview() {
        const row = this._selected;
        return html`<uui-box id="review" headline=${`Xử lý nội dung #${row.id}`}>
            <div class="review-grid"><div class="submission-panel">
                <h2>Nội dung người dùng gửi</h2><p class="muted">Nội dung gốc, chỉ xem.</p>
                <pre class="original">${row.content}</pre>
                <dl><dt>Loại</dt><dd>${types[row.type]}</dd><dt>Gửi lúc</dt><dd>${date(row.createdAt)}</dd>
                    <dt>Muốn trả lời riêng</dt><dd>${row.wantReply ? 'Có' : 'Không'}</dd>
                    <dt>Liên hệ (nội bộ)</dt><dd>${row.contact || '—'}</dd>
                    <dt>Công bố gần nhất</dt><dd>${date(row.approvedAt)} · ${row.approvedBy || '—'}</dd></dl>
                <p class="muted">Thông tin liên hệ và ghi chú chỉ hiển thị trong quản trị. Hệ thống không tự gửi email.</p>
            </div><div class="editor">
                <h2>Trả lời và kiểm duyệt</h2><p class="muted">Lưu nháp để tiếp tục xử lý hoặc duyệt để công bố.</p>
                <label><span>Câu trả lời</span><textarea id="answer" rows="8" maxlength="10000" .value=${this._draft.answer}
                    @input=${event => this._edit('answer', event.target.value)} placeholder="Nhập câu trả lời cho người dùng"></textarea></label>
                <p class="muted">Chỉ câu hỏi đã có câu trả lời và được duyệt mới hiển thị trên portal. Không duyệt nếu nội dung gốc chứa thông tin cá nhân.</p>
                <label><span>Trạng thái xử lý</span><select id="review-status" .value=${this._draft.status} @change=${event => this._edit('status', event.target.value)}>
                    ${Object.entries(statuses).map(([key, label]) => html`<option value=${key} ?selected=${key === this._draft.status}>${label}</option>`)}</select></label>
                <label><span>Ghi chú nội bộ</span><textarea id="admin-note" rows="3" maxlength="1000" .value=${this._draft.adminNote} @input=${event => this._edit('adminNote', event.target.value)}></textarea></label>
                ${this._dirty ? html`<p class="muted">Có thay đổi chưa lưu.</p>` : nothing}
                ${row.isPublished && row.answer !== row.publishedAnswer ? html`<p class="notice">Câu trả lời nháp đã thay đổi. Portal vẫn dùng bản đã duyệt trước đó.</p>` : nothing}
            </div></div>
                <div class="actions"><uui-button class="close-review" label="Đóng xử lý" look="secondary" ?disabled=${this._busy} @click=${this._close}>Đóng</uui-button>
                    <uui-button label="Lưu xử lý" look="outline" data-action="save" ?disabled=${this._busy} @click=${() => this._act('save')}>Lưu xử lý</uui-button>
                    ${row.type === 'cau-hoi' ? html`<uui-button label="Duyệt và công bố" look="primary" color="positive" data-action="approve"
                        ?disabled=${this._busy || this._draft.answer.trim().length < 10} @click=${() => this._act('approve')}>Duyệt và công bố</uui-button>` : nothing}
                    ${row.isPublished ? html`<uui-button label="Gỡ công bố" look="secondary" color="danger" data-action="unpublish" ?disabled=${this._busy} @click=${() => this._act('unpublish')}>Gỡ công bố</uui-button>` : nothing}
                </div>
        </uui-box>`;
    }
    static styles = css`
        :host { display:block; height:100%; overflow:auto; box-sizing:border-box; padding:28px; color:var(--uui-color-text); font-family:inherit; font-size:14px; line-height:1.5; }
        *, *::before, *::after { box-sizing:border-box; }
        .page-shell { max-width:1680px; margin:0 auto; }
        .page-header { display:flex; align-items:center; justify-content:space-between; gap:24px; margin-bottom:24px; }
        h1 { margin:0; font-size:26px; line-height:1.3; font-weight:700; }
        .page-header p { margin:6px 0 0; color:var(--uui-color-text-alt); }
        h2 { margin:0; font-size:16px; line-height:1.5; font-weight:600; }
        uui-box { display:block; margin-bottom:24px; }
        uui-button { --uui-button-height:40px; --uui-button-border-radius:4px; --uui-button-font-size:14px; flex-shrink:0; }
        uui-button umb-icon { width:16px; height:16px; margin-right:6px; }
        .export-button { align-self:center; }
        .filters { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); align-items:end; gap:18px 20px; padding-bottom:24px; border-bottom:1px solid var(--uui-color-border); }
        label { display:flex; flex-direction:column; gap:8px; min-width:0; font-size:13px; font-weight:600; line-height:20px; }
        .filter-search { grid-column:span 2; }
        .filter-actions { grid-column:span 2; display:flex; justify-content:flex-end; align-items:center; gap:10px; }
        .filter-actions uui-button { min-width:112px; }
        input, select, textarea { width:100%; min-width:0; margin:0; border:1px solid var(--uui-color-border-emphasis,var(--uui-color-border)); border-radius:4px; padding:8px 12px; background:var(--uui-color-surface); color:var(--uui-color-text); font:inherit; font-size:14px; font-weight:400; line-height:22px; }
        input, select { height:40px; }
        select { padding-right:28px; }
        input[type=date] { display:block; min-height:40px; }
        input[type=date]::-webkit-datetime-edit { padding:0; }
        input::placeholder, textarea::placeholder { color:var(--uui-color-text-alt); opacity:.8; }
        textarea { display:block; resize:vertical; }
        input:focus-visible, select:focus-visible, textarea:focus-visible { outline:2px solid var(--uui-color-selected); outline-offset:2px; }
        input:disabled, select:disabled, textarea:disabled { background:var(--uui-color-surface-alt); color:var(--uui-color-text-alt); cursor:not-allowed; }
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
        td select { height:36px; padding:6px 8px; font-size:13px; }
        .row-note { width:100%; min-height:74px; padding:8px 10px; font-size:13px; line-height:20px; }
        .row-actions { display:flex; flex-direction:column; align-items:stretch; gap:7px; }
        .row-actions uui-button { width:100%; --uui-button-height:36px; --uui-button-font-size:13px; }
        .badge { display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:3px 7px; border-radius:4px; color:var(--uui-color-text-alt); background:var(--uui-color-surface-alt); font-size:11px; font-weight:600; white-space:nowrap; }
        .badge-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
        .published { color:var(--uui-color-positive); background:color-mix(in srgb,var(--uui-color-positive) 10%,var(--uui-color-surface)); }
        .empty { padding:0; }
        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:200px; padding:32px 20px; text-align:center; }
        .empty-state umb-icon { width:28px; height:28px; margin-bottom:12px; color:var(--uui-color-text-alt); }
        .empty-state strong { font-size:15px; font-weight:600; }
        .empty-state p { margin:6px 0 0; color:var(--uui-color-text-alt); }
        .pagination { display:flex; justify-content:flex-end; align-items:center; gap:14px; padding-top:18px; font-size:13px; }
        .pagination uui-button { --uui-button-height:36px; min-width:72px; }
        .review-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:28px; }
        .submission-panel { padding-right:28px; border-right:1px solid var(--uui-color-border); }
        .muted { font-size:13px; color:var(--uui-color-text-alt); }
        h2 + .muted { margin:4px 0 20px; }
        .original { margin:0 0 24px; white-space:pre-wrap; overflow-wrap:anywhere; font:inherit; line-height:1.7; background:var(--uui-color-surface-alt); padding:18px; border:1px solid var(--uui-color-border); border-radius:6px; }
        dl { display:grid; grid-template-columns:150px minmax(0,1fr); margin:0 0 20px; font-size:13px; }
        dt, dd { padding:10px 0; border-bottom:1px solid var(--uui-color-border); }
        dt { font-weight:600; color:var(--uui-color-text-alt); }
        dd { margin:0; overflow-wrap:anywhere; }
        .editor label { margin-bottom:18px; }
        .editor textarea, .editor select { width:100%; }
        .editor > .muted { margin:8px 0 20px; line-height:1.6; }
        .actions { display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap; gap:10px; margin-top:24px; padding-top:20px; border-top:1px solid var(--uui-color-border); }
        .close-review { margin-right:auto; }
        .notice { padding:12px 16px; margin:0 0 20px; border:1px solid var(--uui-color-border); border-radius:6px; background:var(--uui-color-surface); }
        .error { border-color:var(--uui-color-danger); color:var(--uui-color-danger); }.success { border-color:var(--uui-color-positive); color:var(--uui-color-positive); }
        @media(max-width:1100px) { :host { padding:20px; }.filters { gap:16px; }.review-grid { grid-template-columns:1fr; gap:24px; }.submission-panel { padding-right:0; padding-bottom:24px; border-right:0; border-bottom:1px solid var(--uui-color-border); } }
        @media(max-width:760px) { :host { padding:16px; }.page-header { align-items:flex-start; flex-wrap:wrap; gap:16px; }.filters { grid-template-columns:repeat(2,minmax(0,1fr)); }.filter-actions { justify-content:flex-start; }.list-meta { align-items:flex-start; flex-direction:column; }.refresh-note { font-size:12px; }.actions { justify-content:flex-start; }.close-review { margin-right:0; } }
    `;
}
customElements.define('antc-questions-section', AntcQuestionsSection);
export { AntcQuestionsSection as element };
export default AntcQuestionsSection;
