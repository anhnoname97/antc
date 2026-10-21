import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalToken } from '@umbraco-cms/backoffice/modal';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { statuses, types, sources, date, confirmDiscard, confirmAction } from './questions.shared.js';

const base = '/umbraco/management/api/v1/antc/questions';
const reviewModal = new UmbModalToken('Antc.Modal.QuestionReview', {
    modal: { type: 'sidebar', size: 'large', title: 'Xử lý Hỏi – Đáp' },
});
const retentionModal = new UmbModalToken('Antc.Modal.QuestionRetention', {
    modal: { type: 'sidebar', size: 'medium', title: 'Dọn dữ liệu Hỏi – Đáp' },
});

export class AntcQuestionsSection extends UmbLitElement {
    static properties = {
        _data: { state: true }, _selected: { state: true }, _busy: { state: true },
        _error: { state: true }, _message: { state: true }, _checked: { state: true },
    };
    constructor() {
        super();
        this._data = { items: [], total: 0, page: 1, totalPages: 1 };
        this._selected = null;
        this._filters = {};
        this._rowDrafts = new Map();
        this._checked = new Map();
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
            if (this._auth && !this._busy && !this._selected && !this._rowDrafts.size && !this._checked.size && !document.hidden
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
            const error = new Error(problem?.error?.message || problem?.detail || `Không thực hiện được thao tác (${response.status}).`);
            error.fields = problem?.error?.fields || {};
            throw error;
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
            if (sequence === this._sequence && !(quietly && (this._selected || this._rowDrafts.size || this._checked.size))) {
                if (data.page > data.totalPages && data.page > 1) return await this._load(Math.max(1, data.totalPages), quietly);
                this._data = data;
            }
        } catch (error) { if (sequence === this._sequence) this._error = error.message; }
        finally { if (sequence === this._sequence) this._busy = false; }
    }
    async _canLeave() { return !this._rowDrafts.size || await confirmDiscard(this); }
    async _select(id, trigger, sourceRows = null) {
        if (this._busy || this._selected || !await this._canLeave()) return;
        if (this._busy || this._selected) return;
        this._rowDrafts.clear();
        this._busy = true; this._error = ''; this._message = '';
        try {
            const row = id === null ? null : await (await this._request('/' + id)).json();
            const manager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
            if (!this.isConnected) return;
            if (!manager) throw new Error('Không mở được khung xử lý trong Umbraco. Vui lòng tải lại trang.');
            this._selected = sourceRows ? 'aggregate' : id ?? 'new';
            const modal = manager.open(this, reviewModal, { data: {
                row, sources: sourceRows, request: this._request.bind(this),
                onCreated: created => {
                    this._checked = new Map();
                    this._selected = created.id;
                    this._load(1);
                },
                onUpdated: updated => {
                    this._data = { ...this._data, items: this._data.items.map(item => item.id === updated.id ? updated : item) };
                    if (this._checked.has(updated.id)) this._checked = new Map(this._checked).set(updated.id, updated);
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
                method: 'PUT', body: JSON.stringify({ ...draft, answer: row.answer, reviewVersion: row.reviewVersion,
                    guidanceLabel: row.guidanceLabel, guidanceUrl: row.guidanceUrl }),
            })).json();
            this._data = { ...this._data, items: this._data.items.map(item => item.id === row.id ? updated : item) };
            this._rowDrafts.delete(row.id);
            if (this._checked.has(updated.id)) this._checked = new Map(this._checked).set(updated.id, updated);
            this._message = 'Đã lưu trạng thái và ghi chú. Thao tác này không tự công bố nội dung.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    _toggle(row, checked) {
        const next = new Map(this._checked);
        if (checked) {
            if (next.size >= 50 && !next.has(row.id)) { this._error = 'Mỗi lần chọn tối đa 50 nội dung.'; return; }
            next.set(row.id, row);
        } else next.delete(row.id);
        this._checked = next;
    }
    _togglePage(checked) {
        if (!checked) {
            this._checked = new Map([...this._checked].filter(([id]) => !this._data.items.some(row => row.id === id)));
            return;
        }
        const next = new Map(this._checked);
        if (new Set([...next.keys(), ...this._data.items.map(row => row.id)]).size > 50) {
            this._error = 'Mỗi lần chọn tối đa 50 nội dung. Bỏ chọn trước khi chọn cả trang khác.';
            return;
        }
        for (const row of this._data.items) next.set(row.id, row);
        this._checked = next;
    }
    _aggregationBlockReason(row) {
        if (row.aggregatedIntoId) return `đã tổng hợp vào #${row.aggregatedIntoId}`;
        if (row.isPublished) return 'đang công bố';
        if (!['moi', 'dang-xu-ly'].includes(row.status)) return `trạng thái ${statuses[row.status] || 'không hợp lệ'}`;
        return '';
    }
    get _aggregationRows() {
        return [...this._checked.values()].filter(row => !this._aggregationBlockReason(row));
    }
    get _canAggregate() {
        return this._checked.size >= 2 && this._aggregationRows.length === this._checked.size;
    }
    get _aggregationHelp() {
        const blocked = [...this._checked.values()].filter(row => this._aggregationBlockReason(row));
        if (blocked.length) {
            const details = blocked.slice(0, 3).map(row => `#${row.id} (${this._aggregationBlockReason(row)})`).join(', ');
            return `Không thể tổng hợp ${blocked.length} mục đã chọn: ${details}${blocked.length > 3 ? ` và ${blocked.length - 3} mục khác` : ''}.`
                + (this._aggregationRows.length ? ` Bấm “Chỉ giữ ${this._aggregationRows.length} mục có thể tổng hợp” để bỏ chọn các mục này.` : ' Hãy bỏ chọn và chọn mục Mới hoặc Đang xử lý, chưa công bố và chưa được tổng hợp.');
        }
        if (this._checked.size < 2) return 'Cần chọn thêm ít nhất 1 mục có thể tổng hợp để tạo câu hỏi và câu trả lời chung.';
        return `Có thể tổng hợp ${this._checked.size} mục đã chọn thành một câu hỏi và câu trả lời chung.`;
    }
    _keepAggregationRows() {
        if (this._busy || this._selected) return;
        this._checked = new Map(this._aggregationRows.map(row => [row.id, row]));
    }
    async _aggregate(event) {
        if (this._canAggregate) await this._select(null, event.currentTarget, [...this._checked.values()]);
    }
    async _deleteRows(rows) {
        if (!rows.length || this._busy || this._selected || !await this._canLeave()) return;
        if (this._busy || this._selected) return;
        this._selected = 'delete'; this._error = ''; this._message = '';
        try {
            const published = rows.filter(row => row.isPublished).length;
            const content = `Xóa ${rows.length} nội dung đã chọn? Nội dung sẽ bị gỡ khỏi danh sách và không thể khôi phục trong quản trị.`
                + (published ? ` Có ${published} nội dung đang công bố; chúng cũng sẽ bị gỡ khỏi portal.` : '')
                + ' Nếu xóa câu tổng hợp, trạng thái đã xử lý của các câu nguồn vẫn được giữ.';
            if (!await confirmAction(this, 'Xóa nội dung Hỏi – Đáp?', content, `Xóa ${rows.length} nội dung`)) return;
            this._busy = true;
            const result = await (await this._request('/bulk-delete', { method: 'POST', body: JSON.stringify({
                items: rows.map(row => ({ id: row.id, reviewVersion: row.reviewVersion })),
            }) })).json();
            this._rowDrafts.clear(); this._checked = new Map();
            await this._load();
            this._message = `Đã xóa ${result.deletedCount} nội dung.`;
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; this._selected = null; }
    }
    async _retention(event) {
        if (this._busy || this._selected || !await this._canLeave()) return;
        if (this._busy || this._selected) return;
        const trigger = event.currentTarget;
        this._rowDrafts.clear();
        try {
            const manager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
            if (!manager) throw new Error('Không mở được cấu hình dọn dữ liệu.');
            this._selected = 'retention';
            const modal = manager.open(this, retentionModal, { data: { request: this._request.bind(this) } });
            await modal.onSubmit().catch(() => {});
        } catch (error) { this._error = error.message; }
        finally {
            this._selected = null; this._checked = new Map();
            await this._load(); trigger?.focus({ preventScroll: true });
        }
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
        this._checked = new Map();
        this._message = ''; this._load(1);
    }
    async _resetFilters() {
        if (!await this._canLeave()) return;
        this._filters = {}; this._rowDrafts.clear(); this._checked = new Map();
        this._message = ''; this._load(1);
    }
    render() {
        return html`
            <umb-body-layout headline="Hỏi – Đáp">
                <uui-button slot="action-menu" class="create-button" look="primary" label="Tạo mới nội dung Hỏi – Đáp"
                    ?disabled=${this._busy || !!this._selected} @click=${event => this._select(null, event.currentTarget)}>
                    <umb-icon name="icon-add"></umb-icon><span>Tạo mới</span>
                </uui-button>
                <uui-button slot="action-menu" class="retention-button" look="outline" label="Dọn dữ liệu Hỏi – Đáp"
                    ?disabled=${this._busy || !!this._selected} @click=${this._retention}>
                    <umb-icon name="icon-settings"></umb-icon><span>Dọn dữ liệu</span>
                </uui-button>
                <uui-button slot="action-menu" class="export-button" look="outline" label="Xuất CSV theo bộ lọc" @click=${this._export}>
                    <umb-icon name="icon-download"></umb-icon><span>Xuất CSV theo bộ lọc</span>
                </uui-button>
            <div class="page-shell">
            <p class="page-description">Tiếp nhận từ portal hoặc tạo trực tiếp câu hỏi, kiến nghị, góp ý. Duyệt phản hồi trước khi công bố.</p>
            ${this._error ? html`<div class="notice error" role="alert">${this._error}</div>` : nothing}
            ${this._message ? html`<div class="notice success" role="status">${this._message}</div>` : nothing}
            <uui-box headline="Danh sách nội dung">
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
                    <span class="refresh-note"><span class="refresh-dot" aria-hidden="true"></span>${this._checked.size ? 'Tạm dừng tự cập nhật khi đang chọn nội dung' : 'Tự cập nhật mỗi 5 giây khi không mở xử lý'}</span></div>
                ${this._checked.size ? html`<div class="selection-toolbar" role="region" aria-label="Thao tác với nội dung đã chọn">
                    <div class="selection-summary"><strong>Đã chọn ${this._checked.size} / 50 nội dung</strong>
                        <p id="aggregation-help" role="status">${this._aggregationHelp}</p>
                        ${this._aggregationRows.length > 0 && this._aggregationRows.length < this._checked.size ? html`
                            <uui-button look="secondary" class="keep-aggregation-button" label="Chỉ giữ mục có thể tổng hợp"
                                ?disabled=${this._busy || !!this._selected} @click=${this._keepAggregationRows}>
                                Chỉ giữ ${this._aggregationRows.length} mục có thể tổng hợp</uui-button>` : nothing}</div>
                    <div class="selection-actions"><uui-button look="primary" label="Tổng hợp nội dung đã chọn" class="aggregate-button"
                        title=${this._aggregationHelp} aria-describedby="aggregation-help"
                        ?disabled=${this._busy || !!this._selected || !this._canAggregate} @click=${this._aggregate}>Tổng hợp</uui-button>
                        <uui-button look="outline" color="danger" label="Xóa nội dung đã chọn" class="delete-selected-button"
                            ?disabled=${this._busy || !!this._selected} @click=${() => this._deleteRows([...this._checked.values()])}>Xóa đã chọn</uui-button>
                        <uui-button look="secondary" label="Bỏ chọn tất cả" ?disabled=${this._busy || !!this._selected}
                            @click=${() => { this._checked = new Map(); }}>Bỏ chọn</uui-button></div>
                </div>` : nothing}
                <div class="table-scroll"><table aria-label="Câu hỏi và góp ý đã tiếp nhận">
                    <colgroup><col class="column-select"><col class="column-content"><col class="column-contact"><col class="column-status"><col class="column-note"><col class="column-public"><col class="column-handler"><col class="column-actions"></colgroup>
                    <thead><tr>
                    <th class="select-cell"><uui-checkbox label="Chọn tất cả nội dung trên trang" class="select-page"
                        .checked=${this._data.items.length > 0 && this._data.items.every(row => this._checked.has(row.id))}
                        .indeterminate=${this._data.items.some(row => this._checked.has(row.id)) && !this._data.items.every(row => this._checked.has(row.id))}
                        ?disabled=${this._busy || !!this._selected || !this._data.items.length} @change=${event => this._togglePage(event.target.checked)}>
                        <span class="sr-only">Chọn tất cả nội dung trên trang</span></uui-checkbox></th>
                    <th>Nội dung</th><th>Liên hệ</th>
                    <th>Trạng thái</th><th>Ghi chú nội bộ</th><th>Công khai</th><th>Người xử lý</th><th>Thao tác</th>
                </tr></thead><tbody>
                    ${this._data.items.map(row => html`<tr>
                        <td class="select-cell"><uui-checkbox label=${`Chọn nội dung #${row.id}`} data-select-id=${row.id}
                            .checked=${this._checked.has(row.id)} ?disabled=${this._busy || !!this._selected}
                            @change=${event => this._toggle(row, event.target.checked)}><span class="sr-only">Chọn nội dung #${row.id}</span></uui-checkbox></td>
                        <td class="content"><div class="content-meta"><span class="type-label">${types[row.type] || row.type}</span>
                            <span class="source-label">${sources[row.source] || 'Portal'}</span><time>${date(row.createdAt)}</time></div>
                            <div class="content-preview">${row.content.length > 200 ? row.content.slice(0, 200) + '…' : row.content}</div>
                            ${row.aggregatedIntoId ? html`<uui-button look="secondary" class="aggregation-link" label=${`Xem nội dung tổng hợp #${row.aggregatedIntoId}`}
                                @click=${event => this._select(row.aggregatedIntoId, event.currentTarget)}>Đã tổng hợp vào #${row.aggregatedIntoId}</uui-button>` : nothing}
                            ${row.aggregatedSourceIds?.length ? html`<div class="aggregation-note">Tổng hợp từ ${row.aggregatedSourceIds.length} nội dung</div>` : nothing}</td>
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
                            ${this._rowDrafts.has(row.id) ? html`<uui-button label="Hủy sửa dòng" look="secondary" @click=${() => this._cancelRow(row.id)}>Hủy</uui-button>` : nothing}
                            <uui-button look="secondary" color="danger" label=${`Xóa nội dung #${row.id}`} data-delete-id=${row.id}
                                ?disabled=${this._busy || !!this._selected} @click=${() => this._deleteRows([row])}>Xóa</uui-button></div></td>
                    </tr>`)}
                    ${!this._data.items.length ? html`<tr><td colspan="8" class="empty"><div class="empty-state"><umb-icon name="icon-chat"></umb-icon>
                        <strong>${this._busy ? 'Đang tải nội dung…' : 'Chưa có nội dung phù hợp'}</strong>
                        <p>${this._busy ? 'Vui lòng đợi trong giây lát.' : 'Nhận nội dung từ portal hoặc bấm Tạo mới để nhập trực tiếp trong quản trị.'}</p>
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
        .create-button { margin-right:var(--uui-size-space-3); }
        .retention-button { margin-right:var(--uui-size-space-3); }
        .selection-toolbar { display:flex; justify-content:space-between; align-items:center; gap:var(--uui-size-space-4); flex-wrap:wrap; padding:var(--uui-size-space-4); margin-bottom:var(--uui-size-space-4); background:var(--uui-color-surface-alt); border:1px solid var(--uui-color-border); border-radius:var(--uui-border-radius); }
        .selection-summary { flex:1; min-width:min(100%,320px); }
        .selection-toolbar p { margin:4px 0 0; color:var(--uui-color-text-alt); font-size:12px; }
        .keep-aggregation-button { margin-top:var(--uui-size-space-2); }
        .aggregate-button[disabled] { opacity:0.5; }
        .selection-actions { display:flex; gap:var(--uui-size-space-3); flex-wrap:wrap; }
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
        .column-select { width:44px; }.column-contact { width:166px; }.column-status { width:138px; }.column-note { width:186px; }.column-public { width:122px; }.column-handler { width:142px; }.column-actions { width:148px; }
        .select-cell { text-align:center; padding-left:8px; padding-right:8px; }
        .select-cell uui-checkbox { width:18px; height:18px; }
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
        .aggregation-link { margin-top:8px; }.aggregation-note { margin-top:8px; font-size:12px; color:var(--uui-color-text-alt); }
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
