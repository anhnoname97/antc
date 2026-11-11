import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';
import { blobDownload } from '@umbraco-cms/backoffice/utils';
import { contestStyles } from './contest-theme.js?v=1.15.13';
import { pageSizeSelect } from './contest-page-size.js?v=1.15.13';
import { paginate, DEFAULT_PAGE_SIZE } from './contest-pagination.js?v=1.15.13';

const API = '/api/v1/admin/quiz';
const PHRASE = 'XÁC NHẬN NHẬP NGÂN HÀNG';
const date = value => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));

export class ContestBankView extends UmbLitElement {
    static properties = {
        _busy: { state: true }, _error: { state: true }, _message: { state: true }, _tab: { state: true },
        _history: { state: true }, _preview: { state: true },
        _file: { state: true }, _phrase: { state: true }, _detail: { state: true }, _pagination: { state: true },
    };
    static styles = contestStyles;
    constructor() {
        super(); this._busy = true; this._error = ''; this._message = ''; this._tab = 'bank';
        this._history = null; this._preview = null; this._file = null; this._phrase = '';
        this._historyPage = 1; this._historySize = DEFAULT_PAGE_SIZE; this._detail = null; this._pagination = {};
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth && !this._auth) { this._auth = auth; this._run(() => this._load()); } });
    }
    async _request(path, options = {}, retry = true) {
        const token = await this._auth.getLatestToken(); const headers = new Headers(options.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
        const response = await fetch(API + path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
        if (response.status === 401 && retry && await this._auth.validateToken()) return this._request(path, options, false);
        if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error([payload?.error?.message || `Không thực hiện được yêu cầu (${response.status}).`, ...Object.values(payload?.error?.fields || {})].join(' '));
        }
        return response;
    }
    async _run(action) {
        if (this._working) return;
        this._working = true; this._busy = true; this._error = '';
        try { await action(); } catch (e) { this._error = e.message; }
        finally { this._working = false; this._busy = false; }
    }
    async _load() {
        await this._loadHistory();
    }
    async _loadHistory() { this._history = await (await this._request(`/imports?page=${this._historyPage}&pageSize=${this._historySize}`)).json(); }
    async _download(path, name) {
        await this._run(async () => { const response = await this._request(path); blobDownload(await response.blob(), name); });
    }
    _fileChanged(event) {
        this._file = event.target.files?.[0] || null; this._preview = null; this._phrase = ''; this._pagination = {}; this._message = ''; this._error = '';
        if (this._file && (!this._file.name.toLowerCase().endsWith('.xlsx') || this._file.size > 5 * 1024 * 1024)) {
            this._error = 'Chỉ nhận file .xlsx không vượt quá 5 MB.'; this._file = null; event.target.value = '';
        }
    }
    async _check() {
        await this._run(async () => {
            this._preview = null; this._phrase = ''; this._pagination = {};
            const form = new FormData(); form.append('file', this._file);
            this._preview = await (await this._request('/imports/preview', { method: 'POST', body: form })).json();
        });
    }
    async _confirm() {
        if (!this._preview?.previewId || this._busy || (this._preview.duringContest && this._phrase !== PHRASE)) return;
        const id = this._preview.previewId;
        try {
            await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: { headline: 'Xác nhận nhập ngân hàng câu hỏi',
                content: `Thêm ${this._preview.added}, sửa ${this._preview.updated}, ngừng dùng ${this._preview.deactivated} câu. Các câu không có trong file sẽ ngừng dùng. Bài thi cũ được giữ nguyên. Bạn có chắc chắn?`,
                confirmLabel: 'Xác nhận nhập', cancelLabel: 'Hủy', color: 'danger' } });
        } catch { return; }
        await this._run(async () => {
            const result = await (await this._request('/imports/confirm', { method: 'POST', body: JSON.stringify({ previewId: id, confirmation: this._phrase }) })).json();
            this._preview = null; this._file = null; this._phrase = ''; this._pagination = {}; this._historyPage = 1;
            const input = this.shadowRoot.querySelector('#workbook'); if (input) input.value = '';
            this._message = `Đã nhập lần #${result.id}: ${result.added} thêm mới, ${result.updated} sửa, ${result.deactivated} ngừng dùng. Ngân hàng đã được làm mới.`;
            await this._load();
            // Refresh in place; keep the user's filters, but reload topics added/edited by the workbook.
            const table = this.shadowRoot.querySelector('antc-contest-questions-table');
            if (table) { table.topics = []; table.page = 1; await table.load(); }
        });
    }
    _slice(items, key) {
        const p = paginate(items, this._pagination[key]);
        const move = page => { this._pagination = { ...this._pagination, [key]: { page, size: p.size } }; };
        return { ...p, controls: p.total ? html`<nav class="pager" aria-label=${`Phân trang ${key}`}>${pageSizeSelect(p.size, size => { this._pagination = { ...this._pagination, [key]: { page: 1, size } }; }, this._busy, `Số dòng ${key}`)}<button ?disabled=${this._busy || p.page <= 1} @click=${() => move(p.page - 1)}>← Trước</button><span>${p.start}–${p.end} / ${p.total} · Trang ${p.page}/${p.pages}</span><button ?disabled=${this._busy || p.page >= p.pages} @click=${() => move(p.page + 1)}>Sau →</button></nav>` : nothing };
    }
    _bank() {
        return html`<antc-contest-questions-table embedded
            @quiz-data-changed=${() => { this._preview = null; this._phrase = ''; this._message = ''; this._detail = null; }}
            @question-view=${event => {
                this._detail = event.detail;
                this.updateComplete.then(() => this.shadowRoot.querySelector('.question-preview')?.focus({ preventScroll: true }));
            }}></antc-contest-questions-table>`;
    }
    _import() {
        const p = this._preview;
        const errors = p ? this._slice(p.errors, 'errors') : null;
        const changes = p ? this._slice(p.questions, 'changes') : null;
        const removed = p ? this._slice(p.deactivatedCodes, 'removed') : null;
        const topics = p ? this._slice(p.topics, 'topic-changes') : null;
        return html`<section><h2>Nhập ma trận Excel</h2><p>1. Chọn tệp và kiểm tra toàn bộ → 2. Xem trước thay đổi → 3. Xác nhận nhập. Chưa xác nhận thì chưa ghi dữ liệu.</p>
            <p class="muted">Hai trang tính bắt buộc: ChuyenDe và CauHoi. Câu Đúng–Sai để trống C/D. Type của chuyên đề: personal (Cá nhân) hoặc organization (Tổ chức); câu hỏi tự lấy Type theo chuyên đề. Đáp án đúng phải có giải thích; giải thích các lựa chọn khác có thể để trống. Chỉ nhận .xlsx tối đa 5 MB.</p>
            <label for="workbook">Chọn tệp Excel</label><input id="workbook" type="file" accept=".xlsx" ?disabled=${this._busy} @change=${this._fileChanged}>
            <div class="actions"><button class="primary" ?disabled=${this._busy || !this._file} @click=${this._check}>Kiểm tra và xem trước</button><span class="muted">${this._file?.name || 'Chưa chọn tệp'}</span></div>
            ${p ? p.errors.length ? html`<div class="error-notice" role="alert">Có ${p.errors.length} lỗi. Chưa ghi dữ liệu; cần sửa file rồi kiểm tra lại.</div><div class="table-wrap"><table><thead><tr><th>Sheet</th><th>Dòng</th><th>Cột</th><th>Lỗi</th></tr></thead><tbody>${errors.items.map(e => html`<tr><td>${e.sheet}</td><td>${e.row || '—'}</td><td>${e.column}</td><td>${e.message}</td></tr>`)}</tbody></table></div>${errors.controls}` : html`
            <div class="metrics bank-metrics"><article>Thêm mới<strong>${p.added}</strong></article><article>Sửa<strong>${p.updated}</strong></article><article>Ngừng dùng<strong>${p.deactivated}</strong></article><article>Chuyên đề thay đổi<strong>${p.topics.length}</strong></article></div>
            <h3>Câu hỏi thêm / sửa</h3><div class="table-wrap"><table><thead><tr><th>Mã câu</th><th>Cột thay đổi</th></tr></thead><tbody>${changes.items.map(c => html`<tr><td>${c.code}</td><td>${c.columns.join(', ')}</td></tr>`)}</tbody></table></div>${changes.controls}
            <h3>Câu sẽ ngừng dùng</h3><p>${removed.items.join(', ') || 'Không có'}</p>${removed.controls}
            <h3>Thay đổi chuyên đề</h3><div class="table-wrap"><table><thead><tr><th>Số chuyên đề</th><th>Cột thay đổi</th></tr></thead><tbody>${topics.items.map(t => html`<tr><td>${t.code}</td><td>${t.columns.join(', ')}</td></tr>`)}</tbody></table></div>${topics.controls}
            ${p.duringContest ? html`<div class="error-notice" role="alert">${p.warning}</div><label>Nhập chính xác <strong>${PHRASE}</strong><input autocomplete="off" .value=${this._phrase} @input=${e => { this._phrase = e.target.value; }} ?disabled=${this._busy}></label>` : nothing}
            <p class="muted">File là danh sách đầy đủ câu đang dùng, không phải file bổ sung. Câu không có trong file chỉ ngừng dùng, không xóa bài làm. Bản xem trước hết hạn sau 30 phút; ngân hàng thay đổi thì phải kiểm tra lại.</p>
            <button class="primary" ?disabled=${this._busy || !p.previewId || (p.duringContest && this._phrase !== PHRASE)} @click=${this._confirm}>Xác nhận nhập ngân hàng</button>` : nothing}
        </section>`;
    }
    _historyView() {
        const data = this._history;
        return html`<section><h2>Lịch sử nhập Excel</h2><p class="muted">${data?.totalItems || 0} lần nhập · ${data?.pageSize || this._historySize} dòng/trang · Tệp gốc được lưu riêng, không thay đổi theo ngân hàng hiện tại.</p>
            <div class="table-wrap"><table><thead><tr><th>Lần nhập</th><th>Thời điểm (VN)</th><th>Người nhập</th><th>Tệp</th><th>Thêm</th><th>Sửa</th><th>Ngừng dùng</th><th>Trong giờ thi</th><th></th></tr></thead><tbody>${(data?.items || []).map(i => html`<tr><td>#${i.id}</td><td>${date(i.createdAt)}</td><td>${i.createdBy}</td><td>${i.fileName}</td><td>${i.added}</td><td>${i.updated}</td><td>${i.deactivated}</td><td>${i.duringContest ? 'Có' : 'Không'}</td><td><button ?disabled=${this._busy || !i.canDownload} @click=${() => this._download(`/imports/${i.id}/file`, i.fileName)}>Tải tệp gốc</button></td></tr>`)}</tbody></table></div>
            <div class="pager" aria-label="Phân trang lịch sử nhập">${pageSizeSelect(this._historySize, size => { this._historySize = size; this._historyPage = 1; this._run(() => this._loadHistory()); }, this._busy, 'Số dòng lịch sử nhập')}<button ?disabled=${this._busy || !data || data.page <= 1} @click=${() => { this._historyPage--; this._run(() => this._loadHistory()); }}>← Trước</button><span>Trang ${data?.page || 1}/${Math.max(1, data?.totalPages || 0)}</span><button ?disabled=${this._busy || !data || data.page >= data.totalPages} @click=${() => { this._historyPage++; this._run(() => this._loadHistory()); }}>Sau →</button></div></section>`;
    }
    _questionPreview() {
        const q = this._detail;
        return html`<aside class="question-preview" tabindex="-1" aria-label="Xem nhanh câu hỏi"><div class="panel-heading"><span class="mono">${q.code}</span><button aria-label="Đóng xem nhanh" @click=${() => { this._detail = null; }}>×</button></div><span class=${`badge ${q.isActive ? 'on' : 'off'}`}>${q.isActive ? 'Đang dùng' : 'Ngừng dùng'}</span><p class="muted">${q.situation || ''}</p><h2>${q.question}</h2>${(q.answers || []).map(a => html`<div class=${`preview-answer ${a.isCorrect ? 'correct' : ''}`}><strong>${a.key}</strong><span>${a.text}${a.isCorrect ? html`<small class="block">✓ Đáp án đúng</small>` : nothing}</span></div>`)}<h3>Giải thích</h3>${(q.answers || []).filter(a => a.isCorrect).map(a => html`<p>${a.explanation}</p>`)}<p>${q.safeAction}</p><p class="muted">${q.topicTitle} · Thời gian đọc: ${q.readSeconds}s</p><div class="actions"><button class="primary" @click=${() => this.shadowRoot.querySelector('antc-contest-questions-table')?.openEditor(q)}>Sửa câu hỏi</button></div></aside>`;
    }
    render() {
        return html`<umb-body-layout main-no-padding><div class="page"><header class="page-heading"><div><div class="eyebrow">Ngân hàng đề</div><h1>Câu hỏi</h1><p class="page-description">Thêm, sửa, tra cứu câu hỏi, nhập ma trận Excel và theo dõi lịch sử cập nhật.</p></div></header>
            ${this._error ? html`<div class="error-notice" role="alert">${this._error}</div>` : nothing}${this._message ? html`<div class="success-notice" role="status">${this._message}</div>` : nothing}
            <div class="toolbar"><div class="tabs">${[['bank', 'Danh sách câu hỏi'], ['import', 'Nhập từ Excel'], ['history', 'Lịch sử nhập']].map(([key, title]) => html`<button class=${this._tab === key ? 'primary' : ''} aria-pressed=${this._tab === key} @click=${() => { this._tab = key; }}>${title}</button>`)}</div><div class="actions"><button ?disabled=${this._busy} @click=${() => this._download('/imports/template', 'mau-ngan-hang-cau-hoi.xlsx')}>Tải tệp mẫu</button><button ?disabled=${this._busy} @click=${() => this._download('/imports/export', 'ngan-hang-cau-hoi.xlsx')}>Xuất ngân hàng Excel</button></div></div>
            ${this._busy ? html`<p class="loading-notice" role="status">Đang xử lý…</p>` : nothing}
            <div ?hidden=${this._tab !== 'bank'} class=${this._detail ? 'question-workspace' : 'question-workspace no-preview'}>${this._bank()}${this._detail ? this._questionPreview() : nothing}</div><div ?hidden=${this._tab !== 'import'}>${this._import()}</div><div ?hidden=${this._tab !== 'history'}>${this._historyView()}</div>

        </div></umb-body-layout>`;
    }
}
if (!customElements.get('antc-contest-bank-view')) customElements.define('antc-contest-bank-view', ContestBankView);
