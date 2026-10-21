import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';
import { blobDownload } from '@umbraco-cms/backoffice/utils';
import { contestStyles } from './contest-theme.js';
import { paginate } from './contest-pagination.js';

const API = '/umbraco/management/api/v1/antc/contest-draws';
const date = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';

export class ContestDrawsView extends UmbLitElement {
    static properties = {
        embedded: { type: Boolean, reflect: true },
        _busy: { state: true }, _error: { state: true }, _options: { state: true }, _previewData: { state: true },
        _history: { state: true }, _result: { state: true }, _contestId: { state: true }, _minScore: { state: true },
        _count: { state: true }, _note: { state: true }, _exclude: { state: true }, _winnerPage: { state: true }, _scorePage: { state: true },
    };
    static styles = contestStyles;
    constructor() {
        super(); this._options = []; this._history = null; this._busy = true; this._error = '';
        this._contestId = ''; this._minScore = ''; this._count = '1'; this._note = ''; this._exclude = true;
        this._page = 1; this._search = ''; this._winnerPage = 1; this._scorePage = 1; this._invalidate();
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth && !this._auth) { this._auth = auth; this._load(); } });
    }
    _invalidate() { this._previewData = null; this._requestId = crypto.randomUUID(); }
    async _request(path, options = {}, retry = true) {
        const token = await this._auth.getLatestToken(); const headers = new Headers(options.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body) headers.set('Content-Type', 'application/json');
        const response = await fetch(API + path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
        if (response.status === 401 && retry && await this._auth.validateToken()) return this._request(path, options, false);
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(response.status === 403 ? 'Bạn cần thuộc nhóm “Quản trị cuộc thi” để quay số hoặc xuất dữ liệu.'
                : [body?.error?.message || 'Không thực hiện được yêu cầu. Nếu mất kết nối sau khi quay, hãy kiểm tra lịch sử hoặc thử lại cùng yêu cầu.', ...Object.values(body?.error?.fields || {})].join(' '));
        }
        return response;
    }
    async _historyData() {
        this._history = await (await this._request(`?page=${this._page}&pageSize=20&search=${encodeURIComponent(this._search)}`)).json();
    }
    async _load() {
        this._busy = true; this._error = '';
        try { this._options = await (await this._request('/options')).json(); await this._historyData(); }
        catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _preview(event) {
        event?.preventDefault(); if (this._busy) return;
        this._busy = true; this._error = ''; this._previewData = null;
        try {
            const preview = await (await this._request('/preview', { method: 'POST', body: JSON.stringify({
                contestId: Number(this._contestId), minScore: this._minScore === '' ? null : Number(this._minScore), excludePrevious: this._exclude,
            }) })).json();
            this._minScore = String(preview.minScore); this._previewData = preview; this._scorePage = 1;
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _draw() {
        if (this._busy || !this._previewData) return;
        const requestId = this._requestId;
        const payload = { contestId: Number(this._contestId), minScore: Number(this._minScore), winnersRequested: Number(this._count), excludePrevious: this._exclude, note: this._note, requestId };
        this._busy = true;
        try {
            try {
                await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: {
                    headline: 'Xác nhận quay số?',
                    content: `Giải: ${this._note || 'Không ghi tên'}. Chọn ${payload.winnersRequested} người, điểm tối thiểu ${payload.minScore}. Danh sách xem trước có ${this._previewData.eligibleCount} người; máy chủ sẽ kiểm tra lại tại thời điểm quay. Lần quay đã lưu không thể sửa hoặc xóa.`,
                    confirmLabel: 'Xác nhận quay', cancelLabel: 'Hủy', color: 'positive',
                } });
            } catch { return; }
            if (requestId !== this._requestId) return;
            this._result = await (await this._request('', { method: 'POST', body: JSON.stringify(payload) })).json();
            this._winnerPage = 1; this._previewData = null; this._requestId = crypto.randomUUID();
            this._page = 1; await this._historyData();
            await this.updateComplete; this.renderRoot.querySelector('#draw-result')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _view(id) {
        this._busy = true; this._error = '';
        try { this._result = await (await this._request('/' + id)).json(); this._winnerPage = 1;
            await this.updateComplete; this.renderRoot.querySelector('#draw-result')?.scrollIntoView({ block: 'start' });
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _export(id, kind) {
        this._busy = true; this._error = '';
        try { blobDownload(await (await this._request(`/${id}/export/${kind}`)).blob(), `draw-${id}-${kind}.csv`, 'text/csv;charset=utf-8'); }
        catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _historyPage(delta) {
        this._page += delta; this._busy = true; this._error = '';
        try { await this._historyData(); } catch (error) { this._page -= delta; this._error = error.message; } finally { this._busy = false; }
    }
    _form() {
        return html`<section><h2>Thiết lập lần quay mới</h2><p class="muted">Mỗi số điện thoại có một suất: lấy điểm cao nhất, bằng điểm lấy lượt nộp sớm nhất.</p>
            <form @submit=${this._preview}><div class="draw-fields">
                <label>Cuộc thi <span class="required">*</span><select name="contestId" required ?disabled=${this._busy} @change=${e => { this._contestId = e.target.value; this._minScore = ''; this._invalidate(); }}><option value="">Chọn cuộc thi</option>${this._options.map(c => html`<option value=${c.id} .selected=${this._contestId === String(c.id)}>${c.name}</option>`)}</select></label>
                <label>Điểm tối thiểu<input name="minScore" type="number" min="0" step="1" placeholder="Để trống để gợi ý điểm cao nhất" .value=${this._minScore} ?disabled=${this._busy} @input=${e => { this._minScore = e.target.value; this._invalidate(); }}></label>
                <label>Số người trúng <span class="required">*</span><input name="winners" type="number" min="1" max="1000" required .value=${this._count} ?disabled=${this._busy} @input=${e => { this._count = e.target.value; this._invalidate(); }}></label>
                <label>Ghi chú / tên giải<input name="note" maxlength="200" .value=${this._note} ?disabled=${this._busy} @input=${e => { this._note = e.target.value; this._invalidate(); }}></label>
            </div><label class="check"><input name="exclude" type="checkbox" .checked=${this._exclude} ?disabled=${this._busy} @change=${e => { this._exclude = e.target.checked; this._invalidate(); }}>Loại số điện thoại đã trúng ở các lần quay trước trong cuộc thi này</label>
            <div class="actions"><button type="submit" class="secondary" ?disabled=${this._busy || !this._contestId}>Xem trước</button><button type="button" class="primary" ?disabled=${this._busy || !this._previewData || !Number.isInteger(Number(this._count)) || Number(this._count) < 1 || Number(this._count) > 1000 || Number(this._count) > this._previewData.eligibleCount} @click=${this._draw}>Quay</button></div></form>
            ${this._previewData ? this._previewView() : nothing}</section>`;
    }
    _previewView() {
        const p = this._previewData, max = Math.max(1, ...p.scores.map(s => s.count));
        const scores = paginate(p.scores, { page: this._scorePage, size: 20 }, 20);
        return html`<div class="draw-preview" role="status"><strong>${p.eligibleCount} người đủ điều kiện</strong><p class="muted">${p.totalCandidates} số điện thoại sau khi gộp và loại người đã trúng · Điểm cao nhất: ${p.suggestedMinScore}. Đây là số liệu xem trước; tập đủ điều kiện được tính lại khi quay.</p>
            ${Number(this._count) > p.eligibleCount ? html`<p class="error">Yêu cầu ${this._count} người trúng nhưng chỉ có ${p.eligibleCount} người đủ điều kiện.</p>` : nothing}
            <h3>Phân bố điểm sau khi gộp</h3><div class="scroll"><table><thead><tr><th>Điểm</th><th>Số người</th><th>Phân bố</th></tr></thead><tbody>${scores.items.map(s => html`<tr><td>${s.score}</td><td>${s.count}</td><td><meter min="0" max=${max} value=${s.count} aria-label=${`${s.score} điểm: ${s.count} người`}>${s.count}</meter></td></tr>`)}</tbody></table></div><nav class="pager" aria-label="Phân trang phân bố điểm"><button ?disabled=${scores.page <= 1} @click=${() => { this._scorePage = scores.page - 1; }}>← Trước</button><span>Trang ${scores.page}/${scores.pages}</span><button ?disabled=${scores.page >= scores.pages} @click=${() => { this._scorePage = scores.page + 1; }}>Sau →</button></nav></div>`;
    }
    _resultView() {
        const d = this._result; if (!d) return nothing;
        const p = paginate(d.winners, { page: this._winnerPage, size: 20 }, 20);
        return html`<section id="draw-result" aria-label="Kết quả quay số"><div class="panel-heading"><div><div class="eyebrow">Kết quả quay #${d.id}</div><h2>${d.note || 'Danh sách trúng giải'}</h2><p class="muted">${d.contestName || 'Dữ liệu cũ'} · ${date(d.createdAt)} · ${d.winners.length}/${d.eligibleCount} người</p></div><button class="presentation-button" @click=${async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await this.renderRoot.querySelector('#draw-result').requestFullscreen(); } catch { this._error = 'Trình duyệt không hỗ trợ toàn màn hình. Bạn có thể dùng phím F11.'; } }}>Trình chiếu / thoát</button></div>
            <div class="scroll"><table class="winners-table"><thead><tr><th>Thứ tự</th><th>Mã dự thi</th><th>Họ tên</th><th>Điện thoại</th><th>Điểm</th></tr></thead><tbody>${p.items.map(w => html`<tr><td>${w.rank}</td><td class="mono">${w.code}</td><td><strong>${w.fullName}</strong></td><td>${w.phone}</td><td>${w.score}</td></tr>`)}</tbody></table></div>
            <nav class="pager" aria-label="Phân trang người trúng"><button ?disabled=${p.page <= 1} @click=${() => { this._winnerPage = p.page - 1; }}>← Trước</button><span>Trang ${p.page}/${p.pages}</span><button ?disabled=${p.page >= p.pages} @click=${() => { this._winnerPage = p.page + 1; }}>Sau →</button></nav>
            <div class="actions export-actions"><button ?disabled=${this._busy} @click=${() => this._export(d.id, 'winners')}>Xuất người trúng CSV</button><button ?disabled=${this._busy || !d.hasEligibleSnapshot} @click=${() => this._export(d.id, 'eligible')}>Xuất đủ điều kiện CSV</button></div>
            ${!d.hasEligibleSnapshot ? html`<p class="muted">Lần quay cũ chưa có bản chụp tập đủ điều kiện. Không dựng lại từ dữ liệu hiện tại.</p>` : nothing}
            ${d.eligibleSnapshotRedacted ? html`<p class="muted">Thông tin cá nhân trong tập đủ điều kiện đã được làm sạch theo yêu cầu xóa dữ liệu. Bản chụp người trúng được giữ làm chứng từ trao giải.</p>` : nothing}</section>`;
    }
    render() {
        const h = this._history;
        const content = html`<div class=${this.embedded ? 'embedded-page' : 'page'}>${this.embedded ? nothing : html`<header class="page-heading"><div><div class="eyebrow">Quản lý cuộc thi</div><h1>Quay số chọn người trúng giải</h1><p class="page-description">Quay ngẫu nhiên mật mã, mỗi số điện thoại một suất. Lịch sử và bản chụp kết quả được lưu cố định.</p></div></header>`}
            ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}${this._busy ? html`<p class="loading-notice" role="status">Đang xử lý…</p>` : nothing}
            ${this._form()}${this._resultView()}
            <section><h2>Lịch sử quay số</h2><form class="filters" @submit=${async e => { e.preventDefault(); this._search = new FormData(e.currentTarget).get('search').trim(); this._page = 1; await this._historyPage(0); }}><input name="search" aria-label="Tìm lần quay" placeholder="Tìm người tạo hoặc tên giải…"><button ?disabled=${this._busy}>Tìm kiếm</button></form>
                <p class="summary">${h?.totalItems || 0} lần quay · 20 dòng mỗi trang · Không sửa hoặc xóa lịch sử</p>
                <div class="table-wrap"><table><thead><tr><th>Lần quay</th><th>Cuộc thi / giải</th><th>Thời điểm</th><th>Điểm tối thiểu</th><th>Đủ điều kiện</th><th>Trúng</th><th>Loại đã trúng</th><th>Thao tác</th></tr></thead><tbody>${(h?.items || []).map(d => html`<tr><td>#${d.id}</td><td><strong>${d.contestName || 'Dữ liệu cũ'}</strong><small class="block">${d.note || '—'}</small></td><td>${date(d.createdAt)}</td><td>${d.minScore}</td><td>${d.eligibleCount}</td><td>${d.winners.length}</td><td>${d.excludePrevious ? 'Có' : 'Không'}</td><td><button ?disabled=${this._busy} @click=${() => this._view(d.id)}>Xem kết quả #${d.id}</button></td></tr>`)}</tbody></table></div>${!h?.items.length ? html`<p class="empty-state">Chưa có lần quay phù hợp.</p>` : nothing}
                <nav class="pager" aria-label="Phân trang lịch sử"><button ?disabled=${this._busy || !h || h.page <= 1} @click=${() => this._historyPage(-1)}>← Trước</button><span>Trang ${h?.page || 1}/${h?.totalPages || 1}</span><button ?disabled=${this._busy || !h || h.page >= h.totalPages} @click=${() => this._historyPage(1)}>Sau →</button></nav>
            </section></div>`;
        return this.embedded ? content : html`<umb-body-layout main-no-padding>${content}</umb-body-layout>`;
    }
}
customElements.define('antc-contest-draws-view', ContestDrawsView);
