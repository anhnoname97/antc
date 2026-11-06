import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalToken } from '@umbraco-cms/backoffice/modal';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { statuses, types, sources, date, confirmDiscard, confirmAction } from './questions.shared.js';
import { inboxStyles } from './questions-inbox.styles.js';

const base = '/umbraco/management/api/v1/antc/questions';
const reviewModal = new UmbModalToken('Antc.Modal.QuestionReview', {
    modal: { type: 'sidebar', size: 'large', title: 'Xử lý Hỏi – Đáp' },
});
const retentionModal = new UmbModalToken('Antc.Modal.QuestionRetention', {
    modal: { type: 'sidebar', size: 'medium', title: 'Dọn dữ liệu Hỏi – Đáp' },
});

export class AntcQuestionsSection extends UmbLitElement {
    static properties = {
        _creating: { state: true }, _data: { state: true }, _selected: { state: true }, _busy: { state: true },
        _error: { state: true }, _message: { state: true }, _checked: { state: true },
        _review: { state: true }, _draft: { state: true }, _inlineDirty: { state: true },
        _mailbox: { state: true }, _counts: { state: true }, _handlers: { state: true },
        _publicWanted: { state: true }, _noteOpen: { state: true }, _selectionMode: { state: true },
        _showFilters: { state: true }, _commonSources: { state: true }, _commonPicking: { state: true },
    };
    constructor() {
        super();
        this._data = { items: [], total: 0, page: 1, totalPages: 1 };
        this._selected = null;
        this._filters = { inbox: 'moi' };
        this._review = null; this._draft = {}; this._inlineDirty = false;
        this._mailbox = 'moi'; this._counts = {}; this._handlers = []; this._publicWanted = false;
        this._noteOpen = false; this._selectionMode = false; this._detailSequence = 0;
        this._showFilters = false; this._commonSources = []; this._commonPicking = false;
        this._rowDrafts = new Map();
        this._checked = new Map();
        this._busy = false;
        this._error = '';
        this._message = '';
        this._sequence = 0;
        this._beforeUnload = event => { if (this._rowDrafts.size || this._inlineDirty || this._busy) { event.preventDefault(); event.returnValue = ''; } };
        this._onNavigate = async event => {
            if (event.defaultPrevented || this._allowNavigation || (!this._inlineDirty && !this._rowDrafts.size)) return;
            event.preventDefault();
            if (this._busy || !event.detail?.url || !await this._canLeave()) return;
            this._allowNavigation = true;
            this._inlineDirty = false; this._rowDrafts.clear();
            history.pushState({}, '', event.detail.url);
        };
        this.consumeContext(UMB_AUTH_CONTEXT, auth => {
            if (!auth || this._auth) return;
            this._auth = auth;
            this._load();
            this._request('/handlers').then(r => r.json()).then(rows => { this._handlers = rows; }).catch(() => {});
        });
    }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('beforeunload', this._beforeUnload);
        window.addEventListener('willchangestate', this._onNavigate);
        this._timer = window.setInterval(() => {
            if (this._auth && !this._busy && !this._selected && !this._inlineDirty && !this._rowDrafts.size && !this._checked.size && !document.hidden
                && !this.shadowRoot?.activeElement?.matches('uui-input,uui-textarea,uui-select,input,textarea,select')) this._load(this._data.page, true);
        }, 5000);
    }
    disconnectedCallback() {
        window.clearInterval(this._timer);
        window.clearTimeout(this._searchTimer); this._detailSequence++;
        window.removeEventListener('beforeunload', this._beforeUnload);
        window.removeEventListener('willchangestate', this._onNavigate);
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
            const [data, counts] = await Promise.all([
                this._request(this._query(page)).then(r => r.json()),
                this._request('/inbox-counts' + (this._filters.type ? '?type=' + encodeURIComponent(this._filters.type) : '')).then(r => r.json()),
            ]);
            if (sequence === this._sequence && !(quietly && (this._selected || this._inlineDirty || this._rowDrafts.size || this._checked.size))) {
                if (data.page > data.totalPages && data.page > 1) return await this._load(Math.max(1, data.totalPages), quietly);
                this._data = data; this._counts = counts;
                if (!this._review && !this._selected && data.items.length && !quietly) {
                    await this._openInline(data.items[0].id, false);
                }
            }
        } catch (error) { if (sequence === this._sequence) this._error = error.message; }
        finally { if (sequence === this._sequence) this._busy = false; }
    }
    async _canLeave() {
        if (!this._rowDrafts.size && !this._inlineDirty) return true;
        this._confirming ??= confirmDiscard(this).finally(() => { this._confirming = null; });
        const discard = await this._confirming;
        if (discard) { this._setReview(this._review); this._rowDrafts.clear(); }
        return discard;
    }
    async _startCreate() {
        if (this._busy || this._selected || !await this._canLeave()) return;
        this._detailSequence++; this._setReview(null);
        this._checked = new Map(); this._commonPicking = false;
        this._creating = true;
        this._draft = { type: 'cau-hoi', content: '', answer: '', adminNote: '', guidanceLabel: '', guidanceUrl: '', assignedTo: '' };
        this._inlineDirty = true; this._error = ''; this._message = '';
        await this.updateComplete;
        this.shadowRoot.querySelector('.create-content')?.focus();
    }
    async _cancelCreate() {
        if (this._busy || !await this._canLeave()) return;
        this._setReview(null); this._error = ''; await this._load(this._data.page);
    }
    async _saveCreate() {
        if (!this._creating || this._busy) return;
        const draft = { ...this._draft, content: this._draft.content.trim() };
        if (draft.content.length < 10 || draft.content.length > 2000) {
            this._error = 'Nội dung cần từ 10 đến 2.000 ký tự.'; return;
        }
        if (draft.answer.trim().length < 10 || draft.answer.length > 10000) {
            this._error = 'Câu trả lời cần từ 10 đến 10.000 ký tự.'; return;
        }
        if (draft.adminNote.length > 1000) { this._error = 'Ghi chú tối đa 1.000 ký tự.'; return; }
        if (draft.type !== 'gop-y' && (!draft.guidanceLabel.trim() || !draft.guidanceUrl.trim())) {
            this._error = 'Bổ sung tên và liên kết hướng dẫn đã thẩm định trước khi xuất bản.'; return;
        }
        this._busy = true; this._error = ''; this._detailSequence++;
        let created = null;
        try {
            created = await (await this._request('', { method: 'POST', body: JSON.stringify({
                type: draft.type, content: draft.content, answer: draft.answer, adminNote: draft.adminNote,
            }) })).json();
            this._setReview(created);
            this._draft = { status: created.status, answer: draft.answer, adminNote: draft.adminNote,
                guidanceLabel: draft.guidanceLabel, guidanceUrl: draft.guidanceUrl, assignedTo: draft.assignedTo };
            this._publicWanted = true; this._inlineDirty = true;
            const row = await (await this._request('/' + created.id + '/approve', { method: 'POST',
                body: JSON.stringify({ ...this._draft, status: 'da-xu-ly', reviewVersion: created.reviewVersion }),
            })).json();
            this._setReview(row); this._mailbox = 'da-cong-khai'; this._filters = { inbox: 'da-cong-khai' };
            await this._load(1, true);
            this._message = 'Đã lưu và xuất bản nội dung lên trang web.';
        } catch (error) {
            this._error = created
                ? `Đã lưu nội dung #${created.id} nhưng chưa xuất bản: ${error.message} Sửa và bấm Duyệt và công bố để thử lại trên nội dung này.`
                : error.message;
        }
        finally { this._busy = false; }
    }
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
                    this._checked = new Map(); this._setReview(created);
                    this._selected = created.id;
                    this._load(1);
                },
                onUpdated: updated => {
                    if (this._review?.id === updated.id) this._setReview(updated);
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
                    guidanceLabel: row.guidanceLabel, guidanceUrl: row.guidanceUrl, assignedTo: row.assignedTo }),
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
        if (new Set([...next.keys(), ...this._selectableRows.map(row => row.id)]).size > 50) {
            this._error = 'Mỗi lần chọn tối đa 50 nội dung. Bỏ chọn trước khi chọn cả trang khác.';
            return;
        }
        for (const row of this._selectableRows) next.set(row.id, row);
        this._checked = next;
    }
    get _selectableRows() {
        return this._data.items.filter(row => !this._commonPicking || row.type === 'cau-hoi' && !this._aggregationBlockReason(row));
    }
    _aggregationBlockReason(row) {
        if (row.type !== 'cau-hoi') return 'không phải câu hỏi';
        if (row.aggregatedIntoId) return `đã tổng hợp vào #${row.aggregatedIntoId}`;
        if (row.isPublished) return 'đang công bố';
        if (row.status !== 'moi') return 'không còn ở trạng thái Mới';
        return '';
    }
    get _aggregationRows() {
        return [...this._checked.values()].filter(row => !this._aggregationBlockReason(row));
    }
    get _canAggregate() {
        return this._mailbox === 'moi' && this._checked.size >= 2 && this._aggregationRows.length === this._checked.size;
    }
    get _aggregationHelp() {
        const blocked = [...this._checked.values()].filter(row => this._aggregationBlockReason(row));
        if (blocked.length) {
            const details = blocked.slice(0, 3).map(row => `#${row.id} (${this._aggregationBlockReason(row)})`).join(', ');
            return `Không thể tổng hợp ${blocked.length} mục đã chọn: ${details}${blocked.length > 3 ? ` và ${blocked.length - 3} mục khác` : ''}.`
                + (this._aggregationRows.length ? ` Bấm “Chỉ giữ ${this._aggregationRows.length} mục có thể tổng hợp” để bỏ chọn các mục này.` : ' Chỉ chọn câu hỏi Mới tiếp nhận, chưa công bố và chưa được tổng hợp.');
        }
        if (this._checked.size < 2) return 'Cần chọn thêm ít nhất 1 mục có thể tổng hợp để tạo câu hỏi và câu trả lời chung.';
        return `Có thể tổng hợp ${this._checked.size} mục đã chọn thành một câu hỏi và câu trả lời chung.`;
    }
    _keepAggregationRows() {
        if (this._busy || this._selected) return;
        this._checked = new Map(this._aggregationRows.map(row => [row.id, row]));
    }
    _startCommon() {
        const row = this._review;
        if (this._mailbox !== 'moi' || !row || this._busy || this._selected || this._aggregationBlockReason(row)) return;
        this._selectionMode = true; this._commonPicking = true;
        this._checked = new Map([[row.id, row]]);
        this._message = 'Chọn thêm câu hỏi có cùng nội dung ở danh sách, sau đó bấm Soạn trả lời chung.';
    }
    async _aggregate() {
        if (this._busy || this._selected || !this._canAggregate || !await this._canLeave()) return;
        const sources = [...this._checked.values()];
        this._detailSequence++; this._setReview(null); this._commonSources = sources;
        this._draft = { type: 'cau-hoi', content: sources[0].content, status: 'moi', answer: '',
            adminNote: '', guidanceLabel: '', guidanceUrl: '', assignedTo: '' };
        this._initialInline = JSON.stringify(this._draft); this._inlineDirty = true;
        this._error = ''; this._message = '';
    }
    async _cancelCommon() {
        if (this._busy) return;
        const id = this._commonSources[0]?.id;
        if (!await this._canLeave()) return;
        this._commonSources = []; this._commonPicking = false; this._selectionMode = false; this._checked = new Map();
        if (id) await this._openInline(id, false);
    }
    async _saveCommon(action) {
        if (this._mailbox !== 'moi' || this._busy || this._selected || this._commonSources.length < 2) return;
        if (action === 'approve') { this._publicWanted = true; this._editInline('answer', this._draft.answer); }
        const draft = { ...this._draft, content: this._draft.content.trim(), answer: this._draft.answer.trim() };
        if (draft.content.length < 10 || draft.content.length > 2000 || draft.answer.length < 10 || draft.answer.length > 10000) {
            this._error = 'Câu hỏi chung cần 10–2.000 ký tự và câu trả lời chung cần 10–10.000 ký tự.'; return;
        }
        if (draft.adminNote.length > 1000) { this._error = 'Ghi chú tối đa 1.000 ký tự.'; return; }
        if (action === 'approve' && (!draft.guidanceLabel.trim() || !draft.guidanceUrl.trim())) {
            this._error = 'Bổ sung tên và liên kết hướng dẫn đã thẩm định trước khi công bố câu trả lời chung.'; return;
        }
        const items = this._commonSources.map(row => ({ id: row.id, reviewVersion: row.reviewVersion }));
        const wanted = this._publicWanted;
        let created = null;
        this._busy = true; this._error = ''; this._message = ''; this._detailSequence++;
        try {
            created = await (await this._request('/aggregate', { method: 'POST', body: JSON.stringify({
                items, draft: { type: 'cau-hoi', content: draft.content, answer: draft.answer, adminNote: draft.adminNote },
            }) })).json();
            // Switch to the saved summary immediately. A failed approval must never create another summary on retry.
            this._setReview(created); this._checked = new Map(); this._selectionMode = false; this._commonPicking = false;
            const review = { status: 'da-xu-ly', answer: draft.answer, adminNote: draft.adminNote,
                guidanceLabel: draft.guidanceLabel, guidanceUrl: draft.guidanceUrl, assignedTo: draft.assignedTo,
                reviewVersion: created.reviewVersion };
            if (action === 'approve' || action === 'draft') {
                const row = await (await this._request('/' + created.id + (action === 'approve' ? '/approve' : ''), {
                    method: action === 'approve' ? 'POST' : 'PUT', body: JSON.stringify(review),
                })).json();
                this._setReview(row);
            }
            if (action === 'draft') { this._mailbox = 'da-tra-loi'; this._filters = { inbox: 'da-tra-loi' }; }
            await this._load(1, true);
            this._message = action === 'approve'
                ? `Đã duyệt và công bố một câu trả lời chung cho ${items.length} câu hỏi.`
                : `Đã lưu bản trả lời chung cho ${items.length} câu hỏi. Nội dung nằm trong Đã trả lời, chưa công khai.`;
        } catch (error) {
            if (created) {
                this._draft = { status: created.status, answer: draft.answer, adminNote: draft.adminNote,
                    guidanceLabel: draft.guidanceLabel, guidanceUrl: draft.guidanceUrl, assignedTo: draft.assignedTo };
                this._publicWanted = wanted; this._inlineDirty = true;
                this._error = `Đã tạo bản trả lời chung #${created.id}, nhưng chưa hoàn tất bước lưu/công bố: ${error.message} Bạn có thể sửa và thử lại trên bản này.`;
            } else this._error = error.message;
        } finally { this._busy = false; }
    }
    async _deleteRows(rows) {
        if (!rows.length || this._busy || this._selected || !await this._canLeave()) return;
        if (this._busy || this._selected) return;
        this._selected = 'delete'; this._error = ''; this._message = '';
        try {
            const published = rows.filter(row => row.isPublished).length;
            const content = `Xóa ${rows.length} nội dung đã chọn? Nội dung sẽ bị gỡ khỏi danh sách và không thể khôi phục trong quản trị.`
                + (published ? ` Có ${published} nội dung đang công bố; chúng cũng sẽ bị gỡ khỏi trang web.` : '')
                + ' Nếu xóa câu tổng hợp, trạng thái đã xử lý của các câu nguồn vẫn được giữ.';
            if (!await confirmAction(this, 'Xóa nội dung Hỏi – Đáp?', content, `Xóa ${rows.length} nội dung`)) return;
            this._busy = true;
            const result = await (await this._request('/bulk-delete', { method: 'POST', body: JSON.stringify({
                items: rows.map(row => ({ id: row.id, reviewVersion: row.reviewVersion })),
            }) })).json();
            this._rowDrafts.clear(); this._checked = new Map();
            if (rows.some(row => row.id === this._review?.id)) { this._detailSequence++; this._setReview(null); }
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
            this._setReview(null); this._detailSequence++;
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
        this._detailSequence++; this._setReview(null);
        this._message = ''; this._load(1);
    }
    async _resetFilters() {
        if (!await this._canLeave()) return;
        this._filters = { inbox: this._mailbox }; this._rowDrafts.clear(); this._checked = new Map();
        this._detailSequence++; this._setReview(null);
        this._message = ''; this._load(1);
    }
    _setReview(row) {
        this._creating = false; this._review = row; this._commonSources = [];
        this._draft = row ? { status: row.status, answer: row.answer || '', adminNote: row.adminNote || '',
            guidanceLabel: row.guidanceLabel || '', guidanceUrl: row.guidanceUrl || '', assignedTo: row.assignedTo || '' } : {};
        this._publicWanted = !!row?.isPublished;
        this._initialInline = JSON.stringify(this._draft);
        this._initialPublic = this._publicWanted;
        this._inlineDirty = false; this._noteOpen = false;
    }
    async _openInline(id, check = true) {
        if (this._review?.id === id) return;
        if (this._selected || (check && (this._busy || !await this._canLeave()))) return;
        const sequence = ++this._detailSequence;
        if (check) this._sequence++;
        this._busy = true;
        this._error = ''; this._message = '';
        try {
            const row = await (await this._request('/' + id)).json();
            if (sequence !== this._detailSequence || !this.isConnected) return;
            this._rowDrafts.clear(); this._setReview(row);
        } catch (error) { if (sequence === this._detailSequence) this._error = error.message; }
        finally { if (sequence === this._detailSequence) this._busy = false; }
    }
    _editInline(key, value) {
        this._draft = { ...this._draft, [key]: value };
        this._inlineDirty = this._creating || this._commonSources.length > 0 || JSON.stringify(this._draft) !== this._initialInline || this._publicWanted !== this._initialPublic;
        this._message = '';
    }
    async _chooseMailbox(key, type = this._filters.type || '') {
        if (this._busy || this._selected || !await this._canLeave()) return;
        this._detailSequence++; this._rowDrafts.clear(); this._checked = new Map();
        this._commonPicking = false;
        this._mailbox = key; this._filters = { ...this._filters, inbox: key, type };
        this._setReview(null); this._message = ''; await this._load(1);
    }
    _search(event) {
        const value = event.target.value;
        window.clearTimeout(this._searchTimer);
        this._searchTimer = window.setTimeout(async () => {
            if (!await this._canLeave()) { this.requestUpdate(); return; }
            this._filters = { ...this._filters, search: value }; this._setReview(null);
            this._detailSequence++; await this._load(1);
        }, 350);
    }
    async _saveNote() {
        if (!this._review || this._busy || this._selected) return;
        const draft = { ...this._draft };
        if (draft.adminNote.length > 1000) { this._error = 'Ghi chú tối đa 1.000 ký tự.'; return; }
        const original = this._review;
        this._busy = true; this._error = ''; this._message = ''; this._detailSequence++;
        try {
            const row = await (await this._request('/' + original.id, {
                method: 'PUT', body: JSON.stringify({ status: original.status, answer: original.answer || '',
                    adminNote: draft.adminNote, guidanceLabel: original.guidanceLabel || '',
                    guidanceUrl: original.guidanceUrl || '', assignedTo: original.assignedTo || '',
                    reviewVersion: original.reviewVersion }),
            })).json();
            this._setReview(row);
            this._draft = { ...draft, adminNote: row.adminNote || '' };
            this._editInline('adminNote', this._draft.adminNote);
            this._noteOpen = true;
            await this._load(this._data.page, true);
            this._message = 'Đã lưu ghi chú nội bộ.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    async _saveInline(action) {
        if (!this._review || this._busy || this._selected) return;
        if (action === 'approve' && !this._publicWanted) {
            this._publicWanted = true;
            this._editInline('answer', this._draft.answer);
        }
        const answer = this._draft.answer.trim();
        if (action === 'approve' && answer.length < 10) {
            this._error = 'Nhập câu trả lời ít nhất 10 ký tự trước khi duyệt và công bố.'; return;
        }
        if (this._draft.answer.length > 10000 || this._draft.adminNote.length > 1000) {
            this._error = 'Câu trả lời tối đa 10.000 ký tự, ghi chú tối đa 1.000 ký tự.'; return;
        }
        if (action === 'approve' && this._review.type !== 'gop-y'
            && (!this._draft.guidanceLabel.trim() || !this._draft.guidanceUrl.trim())) {
            this._error = 'Bổ sung tên và liên kết hướng dẫn đã thẩm định trước khi công bố.'; return;
        }
        this._busy = true; this._error = ''; this._message = ''; this._detailSequence++;
        try {
            const status = action === 'approve' || action === 'draft' ? 'da-xu-ly'
                : action === 'archive' ? 'luu-tru' : this._draft.status;
            const approval = action === 'approve';
            let row = await (await this._request('/' + this._review.id + (approval ? '/approve' : ''), {
                method: approval ? 'POST' : 'PUT',
                body: JSON.stringify({ ...this._draft, status, reviewVersion: this._review.reviewVersion }),
            })).json();
            this._setReview(row);
            if (action === 'draft') {
                this._mailbox = row.isPublished ? 'da-cong-khai' : 'da-tra-loi';
                this._filters = { inbox: this._mailbox };
            }
            await this._load(action === 'draft' ? 1 : this._data.page, true);
            this._message = action === 'archive' ? 'Đã chuyển nội dung vào Lưu trữ.'
                : approval ? 'Đã duyệt và công bố câu trả lời lên trang web.'
                : 'Đã lưu câu trả lời.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    async _unpublishInline() {
        if (!this._review?.isPublished || this._busy || this._selected) return;
        const draft = { ...this._draft };
        const wasDirty = this._inlineDirty;
        this._busy = true; this._error = ''; this._message = ''; this._detailSequence++;
        try {
            const row = await (await this._request('/' + this._review.id + '/unpublish', {
                method: 'POST', body: JSON.stringify({ reviewVersion: this._review.reviewVersion }),
            })).json();
            this._setReview(row);
            await this._load(this._data.page, true);
            if (wasDirty) {
                this._draft = draft;
                this._inlineDirty = JSON.stringify(draft) !== this._initialInline;
            }
            this._message = 'Đã gỡ công bố. Nội dung không còn hiển thị trên trang web; bản trả lời vẫn được giữ trong quản trị.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    _shortDate(value) {
        if (!value) return '';
        const time = new Date(value), today = new Date();
        const day = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
        return new Intl.DateTimeFormat('vi-VN', day(time) === day(today)
            ? { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }
            : { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(time);
    }
    _title(row) { return row.content.split(/\n/)[0].slice(0, 145); }
    _body(row) { const lines = row.content.split('\n'); return lines.length > 1 && lines[0].length <= 145 ? lines.slice(1).join('\n').trim() || row.content : row.content; }
    _rowStatus(row) { return row.isPublished ? 'Đã công khai' : statuses[row.status] || row.status; }
    _mailboxLabel() {
        return { moi: 'Mới tiếp nhận', 'dang-xu-ly': 'Đang xử lý', 'cho-duyet': 'Chờ duyệt',
            'da-tra-loi': 'Đã trả lời', 'da-cong-khai': 'Đã công khai', 'luu-tru': 'Lưu trữ' }[this._mailbox] || 'Tất cả nội dung';
    }
    _renderSidebar() {
        const folders = [['moi', 'Mới tiếp nhận', 'new'], ['da-tra-loi', 'Đã trả lời', 'answered'],
            ['da-cong-khai', 'Đã công khai', 'public']];
        return html`<aside class="mail-sidebar" aria-label="Hộp thư Hỏi – Đáp">
            <button class="primary create-question" ?disabled=${this._busy || !!this._selected}
                @click=${this._startCreate}><span aria-hidden="true">＋</span> Tạo câu hỏi mới</button>
            <h2 class="nav-heading">Hộp thư</h2><nav class="folders" aria-label="Trạng thái nội dung">
                ${folders.map(([key, label, color]) => html`<button class=${this._mailbox === key ? 'folder active' : 'folder'}
                    aria-current=${this._mailbox === key ? 'page' : nothing} ?disabled=${this._busy}
                    @click=${() => this._chooseMailbox(key)}><i class=${'folder-dot ' + color} aria-hidden="true"></i>
                    <span>${label}</span><b>${this._counts[key] ?? '—'}</b></button>`)}
            </nav><h2 class="nav-heading type-heading">Loại</h2><nav class="type-nav" aria-label="Loại nội dung">
                ${Object.entries(types).map(([key, label]) => html`<button class=${this._filters.type === key ? 'type active' : 'type'}
                    ?disabled=${this._busy} @click=${() => this._chooseMailbox(this._mailbox, this._filters.type === key ? '' : key)}>${label}</button>`)}
            </nav><div class="sidebar-tools"><button @click=${this._export}>Xuất CSV</button>
                <button ?disabled=${this._busy || !!this._selected} @click=${this._retention}>Dọn dữ liệu cũ</button>
                <button aria-expanded=${String(this._showFilters)} @click=${() => { this._showFilters = !this._showFilters; }}>Lọc nâng cao</button>

            </div></aside>`;
    }
    _renderList() {
        return html`<section class="mail-list" aria-label="Danh sách nội dung">
            <header class="list-header"><div class="list-heading"><h1>${this._mailboxLabel()}</h1>
                <button class="list-selection-toggle" aria-pressed=${String(this._selectionMode)} ?disabled=${this._busy} @click=${() => { this._selectionMode = !this._selectionMode; if (!this._selectionMode) { this._checked = new Map(); this._commonPicking = false; } }}>${this._selectionMode ? 'Đóng chế độ chọn' : this._mailbox === 'moi' ? 'Chọn nhiều / trả lời chung' : 'Chọn nhiều nội dung'}</button></div>
                <label class="search-box"><umb-icon name="icon-search"></umb-icon><input type="search" aria-label="Tìm trong nội dung"
                    placeholder="Tìm trong nội dung" maxlength="200" .value=${this._filters.search || ''} @input=${this._search}></label>
                ${this._showFilters ? html`<details class="advanced-filters" open><summary>Lọc theo ngày</summary><form @submit=${this._applyFilters}>
                    <label>Từ ngày<input type="date" .value=${this._filters.from || ''} @change=${e => this._filter('from', e.target.value)}></label>
                    <label>Đến ngày<input type="date" .value=${this._filters.to || ''} @change=${e => this._filter('to', e.target.value)}></label>
                    <button type="submit">Áp dụng</button></form></details>` : nothing}
            </header>
            ${this._selectionMode ? html`<label class="select-page-control"><input type="checkbox" aria-label="Chọn tất cả nội dung trên trang"
                .checked=${this._selectableRows.length > 0 && this._selectableRows.every(row => this._checked.has(row.id))}
                .indeterminate=${this._selectableRows.some(row => this._checked.has(row.id)) && !this._selectableRows.every(row => this._checked.has(row.id))}
                ?disabled=${this._busy || !this._selectableRows.length} @change=${e => this._togglePage(e.target.checked)}> Chọn trang này</label>` : nothing}
            ${this._checked.size ? html`<div class="bulk-toolbar"><b>Đã chọn ${this._checked.size}</b>${this._mailbox === 'moi' ? html`<p>${this._aggregationHelp}</p>` : nothing}
                <div>${this._mailbox === 'moi' ? html`<button ?disabled=${!this._canAggregate || this._busy} @click=${this._aggregate}>Soạn trả lời chung</button>` : nothing}
                <button ?disabled=${this._busy} @click=${() => this._deleteRows([...this._checked.values()])}>Xóa đã chọn</button>
                <button @click=${() => { this._checked = new Map(); }}>Bỏ chọn</button></div>
                ${this._mailbox === 'moi' && this._aggregationRows.length > 0 && this._aggregationRows.length < this._checked.size ? html`<button @click=${this._keepAggregationRows}>Chỉ giữ mục có thể tổng hợp</button>` : nothing}</div>` : nothing}
            <div class="message-list" role="list">
                ${this._data.items.map(row => html`<div role="listitem" class=${this._review?.id === row.id ? 'message-item selected' : 'message-item'}>
                    ${this._selectionMode ? html`<input type="checkbox" class="row-checkbox" aria-label=${`Chọn nội dung #${row.id}`} .checked=${this._checked.has(row.id)} ?disabled=${this._busy || this._commonPicking && (row.type !== 'cau-hoi' || !!this._aggregationBlockReason(row))} @change=${e => this._toggle(row, e.target.checked)}>` : nothing}
                    <button class="message-button" aria-pressed=${String(this._review?.id === row.id)} @click=${() => this._openInline(row.id)}>
                        <span class="message-meta"><span class=${'type-badge ' + row.type}>${types[row.type] || row.type}</span>
                            <span class="row-status">${this._rowStatus(row)}</span><time datetime=${row.createdAt} title=${date(row.createdAt)}>${this._shortDate(row.createdAt)}</time></span>
                        <strong class="message-title">${this._title(row)}</strong><span class="message-preview">${row.answer?.trim() || row.publishedAnswer?.trim() || 'Chưa có câu trả lời'}</span>
                        ${row.aggregatedIntoId ? html`<span class="aggregation-tag">Đã tổng hợp vào: ${row.aggregatedIntoTitle || 'Câu hỏi tổng hợp'}</span>` : nothing}
                    </button></div>`)}
                ${!this._data.items.length ? html`<p class="empty-list">${this._busy ? 'Đang tải nội dung…' : 'Không có nội dung trong hộp thư này.'}</p>` : nothing}
            </div><footer class="list-pagination"><button aria-label="Trang trước" ?disabled=${this._busy || this._data.page <= 1} @click=${async () => { if (await this._canLeave()) { this._setReview(null); this._load(this._data.page - 1); } }}>←</button>
                <span>${this._data.total} nội dung · ${this._data.page}/${this._data.totalPages}</span>
                <button aria-label="Trang sau" ?disabled=${this._busy || this._data.page >= this._data.totalPages} @click=${async () => { if (await this._canLeave()) { this._setReview(null); this._load(this._data.page + 1); } }}>→</button></footer>
        </section>`;
    }
    _renderAnswerCard(row, common = false) {
        const save = action => common ? this._saveCommon(action) : this._saveInline(action);
        return html`
            <section class="answer-card"><header class="answer-heading"><h3>Câu trả lời</h3><label class="handler-select">Người xử lý<select aria-label="Người được phân công xử lý" .value=${this._draft.assignedTo} ?disabled=${this._busy} @change=${e => this._editInline('assignedTo', e.target.value)}>
                <option value="" ?selected=${!this._draft.assignedTo}>Chưa phân công</option>${this._handlers.map(user => html`<option value=${user.value} ?selected=${user.value === this._draft.assignedTo}>${user.name}</option>`)}
                ${this._draft.assignedTo && !this._handlers.some(u => u.value === this._draft.assignedTo) ? html`<option value=${this._draft.assignedTo} selected>${this._draft.assignedTo}</option>` : nothing}
            </select></label></header>
                <textarea class="answer-editor" aria-label="Câu trả lời" maxlength="10000" placeholder="Soạn câu trả lời…" .value=${this._draft.answer} ?disabled=${this._busy} @input=${e => this._editInline('answer', e.target.value)}></textarea>
                ${row?.isPublished && this._draft.answer !== row?.publishedAnswer ? html`<p class="published-snapshot-note">Trang web vẫn hiển thị câu trả lời đã duyệt trước đó. Duyệt và công bố để cập nhật bản mới.</p>` : nothing}
                ${(row?.type || 'cau-hoi') !== 'gop-y' ? html`<div class="guidance-fields"><label>Tên hướng dẫn đã thẩm định<input maxlength="200" .value=${this._draft.guidanceLabel} ?disabled=${this._busy} @input=${e => this._editInline('guidanceLabel', e.target.value)}></label>
                    <label>Liên kết hướng dẫn<input maxlength="2048" placeholder="/khan-cap/" .value=${this._draft.guidanceUrl} ?disabled=${this._busy} @input=${e => this._editInline('guidanceUrl', e.target.value)}></label></div>` : nothing}
                <footer class="answer-footer">
                    <span class="answer-character-count">${this._draft.answer.length.toLocaleString('vi-VN')} / 10.000 ký tự</span>
                    <div class="answer-actions">${row ? html`<button class="delete-action" ?disabled=${this._busy || !!this._selected} @click=${() => this._deleteRows([row])}>Xóa</button>` : nothing}${row?.isPublished ? html`<button ?disabled=${this._busy} @click=${this._unpublishInline}>Gỡ công bố</button>` : nothing}
                        ${!row?.isPublished ? html`<button ?disabled=${this._busy} @click=${() => save('draft')}>Lưu</button>` : nothing}
                        <button class="primary" ?disabled=${this._busy} @click=${() => save('approve')}>Duyệt và công bố</button></div>
                </footer>
            </section>`;
    }
    _renderCommonDetail() {
        return html`<section class="mail-detail" aria-label="Soạn trả lời chung">
            <header class="detail-heading common-heading"><div><div class="detail-meta"><span class="type-badge">Trả lời chung</span><span>${this._commonSources.length} câu hỏi đã chọn</span></div><h2>Một câu trả lời cho các câu hỏi tương tự</h2></div>
                <button class="common-cancel" ?disabled=${this._busy} @click=${this._cancelCommon}>Hủy trả lời chung</button></header>
            ${this._error ? html`<div class="inbox-notice error" role="alert">${this._error}</div>` : nothing}
            <article class="submission-card common-sources"><h3>Câu hỏi gốc</h3><p class="private-meta">Giữ nguyên nội dung từng người gửi. Sau khi lưu, các câu hỏi này được liên kết với một bản trả lời chung.</p>
                ${this._commonSources.map(row => html`<details><summary><span>#${row.id}</span> ${this._title(row)}</summary><p class="original-content">${row.content}</p></details>`)}
            </article>
            <article class="submission-card"><label class="common-question">Câu hỏi chung<textarea maxlength="2000" rows="3" aria-label="Câu hỏi chung" .value=${this._draft.content} ?disabled=${this._busy} @input=${e => this._editInline('content', e.target.value)}></textarea></label>
                <p class="private-meta">Biên tập câu hỏi mang tính khái quát. Không đưa tên, số điện thoại hoặc thông tin riêng của người gửi vào nội dung công khai.</p></article>
            ${this._renderAnswerCard(null, true)}
            <p class="private-meta">Lưu chuyển bản trả lời chung vào Đã trả lời, chưa công khai. Duyệt và công bố chỉ đăng một bản trả lời chung lên trang web.</p>
        </section>`;
    }
    _renderCreate() {
        return html`<section class="mail-detail create-detail" aria-label="Tạo câu hỏi mới">
            <header class="detail-heading"><div class="detail-meta"><span class="type-badge">Biên tập nội dung</span></div><h2>Tạo câu hỏi mới</h2><p class="create-intro">Soạn nội dung và câu trả lời để xuất bản lên trang web.</p></header>
            ${this._error ? html`<div class="inbox-notice error" role="alert">${this._error}</div>` : nothing}
            <div class="create-grid"><section class="submission-card create-main"><h3 class="create-section-title">Nội dung công khai</h3>
                <label class="common-question">Loại nội dung<select class="create-type" aria-label="Loại nội dung mới" .value=${this._draft.type} ?disabled=${this._busy} @change=${e => this._editInline('type', e.target.value)}>
                    ${Object.entries(types).map(([key, label]) => html`<option value=${key}>${label}</option>`)}
                </select></label>
                <label class="common-question">Nội dung<textarea class="create-content" aria-label="Nội dung câu hỏi mới" rows="4" maxlength="2000" placeholder="Nhập câu hỏi, góp ý hoặc kiến nghị…" .value=${this._draft.content} ?disabled=${this._busy} @input=${e => this._editInline('content', e.target.value)}></textarea></label>
                <p class="private-meta">${this._draft.content.length} / 2.000 ký tự. Nội dung và câu trả lời sẽ được công khai khi lưu và xuất bản.</p>
                <label class="common-question create-field">Câu trả lời<textarea placeholder="Soạn câu trả lời rõ ràng, dễ hiểu…" aria-label="Câu trả lời mới" rows="5" maxlength="10000" .value=${this._draft.answer} ?disabled=${this._busy} @input=${e => this._editInline('answer', e.target.value)}></textarea></label>
                <div class="guidance-fields"><label>Tên hướng dẫn đã thẩm định<input maxlength="200" .value=${this._draft.guidanceLabel} ?disabled=${this._busy} @input=${e => this._editInline('guidanceLabel', e.target.value)}></label>
                    <label>Liên kết hướng dẫn<input maxlength="2048" placeholder="/khan-cap/" .value=${this._draft.guidanceUrl} ?disabled=${this._busy} @input=${e => this._editInline('guidanceUrl', e.target.value)}></label></div>
</section><section class="submission-card create-internal"><h3 class="create-section-title">Thông tin nội bộ</h3>
                <label class="common-question create-field">Ghi chú nội bộ<textarea aria-label="Ghi chú nội bộ mới" rows="3" maxlength="1000" .value=${this._draft.adminNote} ?disabled=${this._busy} @input=${e => this._editInline('adminNote', e.target.value)}></textarea></label>
                <p class="private-meta">Ghi chú chỉ hiển thị trong quản trị.</p>
                <label class="handler-select">Người xử lý<select aria-label="Người xử lý nội dung mới" .value=${this._draft.assignedTo} ?disabled=${this._busy} @change=${e => this._editInline('assignedTo', e.target.value)}><option value="">Chưa phân công</option>${this._handlers.map(user => html`<option value=${user.value}>${user.name}</option>`)}</select></label>
            </section></div><footer class="create-footer"><p>Nội dung sẽ hiển thị công khai sau khi xuất bản.</p><div class="answer-actions create-actions"><button ?disabled=${this._busy} @click=${this._cancelCreate}>Hủy</button><button class="primary" ?disabled=${this._busy} @click=${this._saveCreate}>Lưu và xuất bản</button></div>
            </footer>
        </section>`;
    }
    _renderDetail() {
        if (this._creating) return this._renderCreate();
        if (this._commonSources.length) return this._renderCommonDetail();
        const row = this._review;
        if (!row) return html`<section class="mail-detail detail-empty">${this._error ? html`<div class="inbox-notice error" role="alert">${this._error}</div>` : nothing}<umb-icon name="icon-chat"></umb-icon><h2>Chọn nội dung để xem và trả lời</h2><p>Câu hỏi, góp ý và kiến nghị được tiếp nhận tại đây.</p></section>`;
        const sender = row.createdBy || (row.source === 'tong-hop' ? 'Nội dung tổng hợp' : 'Người gửi từ trang web');
        return html`<section class="mail-detail" aria-label="Chi tiết và trả lời">
            <header class="detail-heading"><div class="detail-meta"><span class=${'type-badge ' + row.type}>${types[row.type] || row.type}</span>
                <span>Mã HĐ–${row.id} · ${sources[row.source] || 'Trang web'} · ${date(row.createdAt)}</span></div><h2>${this._title(row)}</h2></header>
            ${this._error ? html`<div class="inbox-notice error" role="alert">${this._error}</div>` : nothing}
            ${this._message ? html`<div class="inbox-notice success" role="status">${this._message}</div>` : nothing}
            <article class="submission-card"><div class="sender-heading"><span class="avatar" aria-hidden="true">${row.createdBy ? row.createdBy.slice(0, 2).toLocaleUpperCase('vi-VN') : 'NG'}</span>
                <div><strong>${sender}</strong><p>${row.contact ? 'Liên hệ: ' + row.contact + ' · ' : ''}${row.wantReply ? 'Mong muốn nhận phản hồi' : 'Không yêu cầu phản hồi riêng'}</p></div></div>
                <p class="original-content">${this._body(row)}</p>
                ${this._mailbox === 'moi' && !this._aggregationBlockReason(row) ? html`<button class="common-reply-button" ?disabled=${this._busy || !!this._selected} @click=${this._startCommon}>Trả lời chung với câu hỏi tương tự</button>` : nothing}
                ${row.aggregatedIntoId ? html`<p class="private-meta">Câu hỏi này đã được xử lý bằng câu trả lời chung.</p><button class="inline-link" @click=${() => this._openInline(row.aggregatedIntoId)}>${row.aggregatedIntoTitle || 'Xem câu trả lời chung'}</button>` : nothing}
                ${row.aggregatedSourceIds?.length ? html`<div class="summary-source-links"><span>Trả lời chung cho:</span>${row.aggregatedSourceIds.map(id => html`<button class="inline-link" @click=${() => this._openInline(id)}>${row.aggregatedSourceTitles?.[id] || 'Câu hỏi gốc'}</button>`)}</div>` : nothing}
            </article>
            <section class="note-card"><button class="note-toggle" ?disabled=${this._busy} @click=${() => { this._noteOpen = !this._noteOpen; }} aria-expanded=${String(this._noteOpen)}>
                <umb-icon name="icon-edit"></umb-icon><span><b>Ghi chú nội bộ:</b> ${this._draft.adminNote || 'Thêm ghi chú cho người xử lý.'} <small>Chỉ người quản trị thấy ghi chú này.</small></span></button>
                ${this._noteOpen ? html`<label class="note-editor">Ghi chú nội bộ<textarea maxlength="1000" rows="3" .value=${this._draft.adminNote} ?disabled=${this._busy} @input=${e => this._editInline('adminNote', e.target.value)}></textarea></label><div class="note-actions"><button class="primary" ?disabled=${this._busy || this._draft.adminNote === (row.adminNote || '')} @click=${this._saveNote}>Lưu</button></div>` : nothing}
            </section>
            ${this._renderAnswerCard(row)}
        </section>`;
    }
    render() {
        return html`<div class="inbox-layout" aria-busy=${String(this._busy)}>${this._renderSidebar()}${this._renderList()}${this._renderDetail()}</div>`;
    }
    static styles = [UmbTextStyles, inboxStyles];
}

customElements.define('antc-questions-section', AntcQuestionsSection);
export { AntcQuestionsSection as element };
export default AntcQuestionsSection;
