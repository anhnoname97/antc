import { DEFAULT_PAGE_SIZE } from './contest-pagination.js?v=1.15.7';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';
import { contestStyles } from './contest-theme.js?v=1.15.7';
import { pageSizeSelect } from './contest-page-size.js?v=1.15.7';

const API = '/umbraco/management/api/v1/antc/contest-privacy';
const BULK = 'XÓA DỮ LIỆU CÁ NHÂN', ANON = 'XÓA THÔNG TIN', DELETE = 'XÓA VĨNH VIỄN';
const date = value => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));

export class ContestPrivacyView extends UmbLitElement {
    static properties = {
        _busy: { state: true }, _error: { state: true }, _preview: { state: true }, _history: { state: true },
        _mode: { state: true }, _confirmation: { state: true }, _bulkConfirmation: { state: true }, _result: { state: true },
    };
    static styles = contestStyles;
    constructor() {
        super(); this._busy = true; this._error = ''; this._preview = null; this._history = null; this._mode = 'anonymize';
        this._confirmation = ''; this._bulkConfirmation = ''; this._result = null; this._page = 1; this._historySize ??= DEFAULT_PAGE_SIZE; this._lookupSize ??= DEFAULT_PAGE_SIZE;
        this._personRequest = crypto.randomUUID(); this._bulkRequest = crypto.randomUUID();
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth && !this._auth) { this._auth = auth; this._load(); } });
    }
    async _request(path, body, retry = true) {
        const token = await this._auth.getLatestToken(); const headers = new Headers();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (body) headers.set('Content-Type', 'application/json');
        const response = await fetch(API + path, { method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined, headers, credentials: 'same-origin', cache: 'no-store' });
        if (response.status === 401 && retry && await this._auth.validateToken()) return this._request(path, body, false);
        if (!response.ok) {
            const problem = await response.json().catch(() => null);
            throw new Error(response.status === 403 ? 'Bạn cần thuộc nhóm “Quản trị cuộc thi” để xử lý dữ liệu cá nhân.'
                : problem?.error?.message || 'Không xác định được kết quả yêu cầu. Hãy kiểm tra nhật ký trước khi thử lại.');
        }
        return await response.json();
    }
    async _load() {
        this._busy = true;
        try { this._history = await this._request(`/operations?page=${this._page}&pageSize=${this._historySize}`); }
        catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _search(event, page = 1) {
        event?.preventDefault(); if (this._busy) return;
        const form = this.renderRoot.querySelector('#privacy-search');
        const data = new FormData(form);
        this._busy = true; this._error = ''; this._preview = null; this._confirmation = '';
        try {
            this._preview = await this._request('/preview', { kind: data.get('kind'), value: data.get('value'), page, pageSize: this._lookupSize });
            this._personRequest = crypto.randomUUID();
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _erase(bulk) {
        if (this._busy) return;
        const phrase = bulk ? BULK : this._mode === 'delete' ? DELETE : ANON;
        if ((bulk ? this._bulkConfirmation : this._confirmation).trim().normalize('NFC') !== phrase) return;
        this._busy = true; this._error = '';
        try {
            try {
                await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: {
                    headline: bulk ? 'Xóa dữ liệu cá nhân của toàn bộ lượt thi?' : this._mode === 'delete' ? 'Xóa vĩnh viễn các lượt đã xem?' : 'Ẩn danh các lượt đã xem?',
                    content: bulk ? 'Áp dụng trên toàn bộ cuộc thi và thông tin liên hệ câu hỏi gửi lên. Giữ bài làm, thống kê và chứng từ draw_winner. Không thể hoàn tác trong ứng dụng.'
                        : `Áp dụng cho tất cả ${this._preview.total} lượt liên quan, không chỉ trang đang xem. ${this._mode === 'delete' ? 'Lượt và đáp án bị xóa vĩnh viễn.' : 'Giữ nguyên bài làm và điểm để thống kê.'} Token cũ bị thu hồi; chứng từ draw_winner được giữ lại.`,
                    confirmLabel: 'Thực hiện xóa', cancelLabel: 'Hủy', color: 'danger',
                } });
            } catch { return; }
            this._result = bulk ? await this._request('/bulk', { requestId: this._bulkRequest, confirmation: this._bulkConfirmation })
                : await this._request('/erase', { requestId: this._personRequest, previewToken: this._preview.previewToken, mode: this._mode, confirmation: this._confirmation });
            this._preview = null; this._confirmation = ''; this._bulkConfirmation = '';
            this._personRequest = crypto.randomUUID(); this._bulkRequest = crypto.randomUUID();
            this.renderRoot.querySelector('#privacy-search').reset();
            this._page = 1; this._historySize ??= DEFAULT_PAGE_SIZE; this._lookupSize ??= DEFAULT_PAGE_SIZE; this._history = await this._request(`/operations?page=1&pageSize=${this._historySize}`);
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _vacuum(id) {
        if (this._busy) return; this._busy = true; this._error = '';
        try {
            try { await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: { headline: 'Chạy lại VACUUM và làm sạch WAL?', content: 'Dữ liệu đã được xóa. Thao tác này chỉ hoàn tất làm sạch file CSDL, không thực hiện thêm lần xóa dữ liệu mới.', confirmLabel: 'Chạy VACUUM', cancelLabel: 'Hủy' } }); }
            catch { return; }
            this._result = await this._request(`/operations/${id}/vacuum`, { requestId: crypto.randomUUID(), confirmation: BULK });
            this._history = await this._request(`/operations?page=${this._page}&pageSize=${this._historySize}`);
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    _previewView() {
        const p = this._preview; if (!p) return nothing;
        const phrase = this._mode === 'delete' ? DELETE : ANON;
        return html`<div class="privacy-preview"><h3>${p.total} lượt liên quan trên tất cả cuộc thi</h3>
            <div class="scroll"><table><thead><tr><th>Mã dự thi</th><th>Họ tên</th><th>Điện thoại</th><th>Đơn vị</th><th>Cuộc thi</th><th>Trạng thái</th><th>Đã làm</th><th>Điểm</th></tr></thead><tbody>${p.items.map(e => html`<tr><td>${e.code}</td><td>${e.fullName || 'Ẩn danh'}</td><td>${e.phone || '—'}</td><td>${e.org || '—'}</td><td>${e.contestId ?? 'Dữ liệu cũ'}</td><td>${e.status === 'submitted' ? 'Đã nộp' : 'Đang thi'}</td><td>${e.answered}</td><td>${e.score ?? '—'}</td></tr>`)}</tbody></table></div>
            <nav class="pager" aria-label="Phân trang lượt liên quan">${pageSizeSelect(this._lookupSize, size => { this._lookupSize = size; this._search(null, 1); }, this._busy, 'Số dòng lượt liên quan')}<button ?disabled=${this._busy || p.page <= 1} @click=${() => this._search(null, p.page - 1)}>← Trước</button><span>Trang ${p.page}/${p.pages} · ${p.pageSize || this._lookupSize} dòng/trang</span><button ?disabled=${this._busy || p.page >= p.pages} @click=${() => this._search(null, p.page + 1)}>Sau →</button></nav>
            ${p.total ? html`<fieldset ?disabled=${this._busy} class="privacy-options"><legend>Cách xử lý</legend>
                <label class="check"><input type="radio" name="eraseMode" value="anonymize" .checked=${this._mode === 'anonymize'} @change=${() => { this._mode = 'anonymize'; this._confirmation = ''; this._personRequest = crypto.randomUUID(); }}>Xóa thông tin cá nhân, giữ bài làm ẩn danh và thống kê</label>
                <label class="check"><input type="radio" name="eraseMode" value="delete" .checked=${this._mode === 'delete'} @change=${() => { this._mode = 'delete'; this._confirmation = ''; this._personRequest = crypto.randomUUID(); }}>Xóa hẳn lượt và toàn bộ đáp án (thống kê sẽ giảm tương ứng)</label>
                <label class="privacy-confirm">Gõ <strong>${phrase}</strong> để xác nhận<input name="confirmation" autocomplete="off" .value=${this._confirmation} @input=${e => { this._confirmation = e.target.value; }}></label>
                <button class="danger" ?disabled=${this._confirmation.trim().normalize('NFC') !== phrase} @click=${() => this._erase(false)}>Xóa theo yêu cầu</button></fieldset>` : html`<p class="empty-state">Không tìm thấy lượt thi phù hợp.</p>`}</div>`;
    }
    render() {
        const h = this._history;
        return html`<umb-body-layout main-no-padding><div class="page"><header class="page-heading"><div><div class="eyebrow">Quản lý cuộc thi</div><h1>Xóa dữ liệu cá nhân</h1><p class="page-description">Chỉ người được phân quyền thực hiện. Nhật ký lưu người thực hiện, thời điểm và số bản ghi, không lưu nội dung đã xóa.</p></div></header>
            ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}${this._busy ? html`<p class="loading-notice" role="status">Đang xử lý. Việc làm sạch file CSDL có thể cần thêm thời gian…</p>` : nothing}
            <section><h2>Xóa theo yêu cầu của một người</h2><p class="muted">Tìm bằng mã dự thi sẽ lấy cả các lượt có cùng số điện thoại. Với lượt ẩn danh không có điện thoại, chỉ xử lý mã được tìm.</p>
                <form id="privacy-search" class="filters" @submit=${this._search} @input=${() => { this._preview = null; this._confirmation = ''; }}><select name="kind" aria-label="Tìm theo" ?disabled=${this._busy}><option value="phone">Số điện thoại</option><option value="code">Mã dự thi</option></select><input name="value" required maxlength="100" aria-label="Giá trị tìm kiếm" autocomplete="off" placeholder="Nhập số điện thoại hoặc mã dự thi" ?disabled=${this._busy}><button class="secondary" ?disabled=${this._busy}>Xem các lượt liên quan</button></form>
                ${this._previewView()}</section>
            <section class="privacy-danger"><h2>Xóa hàng loạt sau cuộc thi</h2><p>Áp dụng trên <strong>toàn bộ lượt thi, tất cả cuộc thi</strong>: xóa họ tên, điện thoại, đơn vị, mã băm IP; thu hồi token và giữ bài làm, điểm, đáp án để thống kê. Đồng thời xóa thông tin liên hệ và mã băm IP của câu hỏi gửi lên, làm sạch thông tin cá nhân trong các bản chụp liên quan.</p>
                <p class="muted">Chỉ thực hiện khi không còn cuộc thi đang mở/gia hạn. Bảng <code>draw_winner</code> được giữ nguyên làm chứng từ trao giải, kể cả khi xóa từng người. Không tự xóa bản sao lưu hoặc CSV đã tải xuống; cần xử lý chúng theo chính sách lưu trữ riêng.</p>
                <label class="privacy-confirm">Gõ <strong>${BULK}</strong> để xác nhận<input name="bulkConfirmation" autocomplete="off" ?disabled=${this._busy} .value=${this._bulkConfirmation} @input=${e => { this._bulkConfirmation = e.target.value; }}></label>
                <button class="danger" ?disabled=${this._busy || this._bulkConfirmation.trim().normalize('NFC') !== BULK} @click=${() => this._erase(true)}>Xóa dữ liệu cá nhân hàng loạt</button></section>
            ${this._result ? html`<p role="status" class=${this._result.vacuumCompleted ? 'success-notice' : 'notice error'}>Đã xử lý ${this._result.counts.entries} lượt; xóa ${this._result.counts.answers} đáp án, ${this._result.counts.contacts} liên hệ câu hỏi. ${this._result.vacuumCompleted ? 'Đã hoàn tất VACUUM và checkpoint WAL.' : 'Đã xóa dữ liệu nhưng chưa hoàn tất làm sạch file. Dùng nút chạy lại VACUUM trong nhật ký.'}</p>` : nothing}
            <section><h2>Nhật ký xóa dữ liệu</h2><p class="muted">Không ghi số điện thoại, mã dự thi hoặc nội dung đã xóa vào nhật ký này.</p><div class="table-wrap"><table><thead><tr><th>Thời điểm (VN)</th><th>Người thực hiện</th><th>Phạm vi</th><th>Cách xóa</th><th>Lượt</th><th>Đáp án xóa</th><th>Liên hệ xóa</th><th>Làm sạch file</th></tr></thead><tbody>${(h?.items || []).map(o => html`<tr><td>${date(o.occurredAt)}</td><td title=${o.actorUserKey}>${o.actorName || o.actorUserKey}</td><td>${o.scope === 'all' ? 'Hàng loạt' : 'Theo yêu cầu'}</td><td>${o.action === 'delete' ? 'Xóa hẳn' : 'Ẩn danh'}</td><td>${o.counts.entries}</td><td>${o.counts.answers}</td><td>${o.counts.contacts}</td><td>${o.vacuumCompleted ? html`<span class="badge on">Hoàn tất</span>` : html`<button ?disabled=${this._busy} @click=${() => this._vacuum(o.id)}>Chạy lại VACUUM</button>`}</td></tr>`)}</tbody></table></div>
                <nav class="pager" aria-label="Phân trang nhật ký xóa">${pageSizeSelect(this._historySize, size => { this._historySize = size; this._page = 1; this._load(); }, this._busy, 'Số dòng nhật ký xóa')}<button ?disabled=${this._busy || !h || h.page <= 1} @click=${() => { this._page--; this._load(); }}>← Trước</button><span>Trang ${h?.page || 1}/${h?.pages || 1} · ${h?.total || 0} thao tác</span><button ?disabled=${this._busy || !h || h.page >= h.pages} @click=${() => { this._page++; this._load(); }}>Sau →</button></nav></section>
        </div></umb-body-layout>`;
    }
}
if (!customElements.get('antc-contest-privacy-view')) customElements.define('antc-contest-privacy-view', ContestPrivacyView);
