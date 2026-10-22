import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';
import { blobDownload } from '@umbraco-cms/backoffice/utils';
import { contestStyles } from './contest-theme.js';
import { pageSizeSelect } from './contest-page-size.js';
import { paginate } from './contest-pagination.js';

const API = '/umbraco/management/api/v1/antc/contest-draws';
const date = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';

export class ContestDrawsView extends UmbLitElement {
    static properties = {
        embedded: { type: Boolean, reflect: true },
        _busy: { state: true }, _error: { state: true }, _options: { state: true }, _previewData: { state: true },
        _history: { state: true }, _result: { state: true }, _contestId: { state: true }, _minScore: { state: true },
        _count: { state: true }, _note: { state: true }, _exclude: { state: true }, _winnerPage: { state: true }, _scorePage: { state: true },
        _spinning: { state: true }, _countdown: { state: true }, _celebrate: { state: true },
        _historySize: { state: true }, _candidateSize: { state: true }, _scoreSize: { state: true }, _winnerSize: { state: true },
        _prizes: { state: true }, _prizeId: { state: true },
    };
    static styles = contestStyles;
    constructor() {
        super(); this._options = []; this._history = null; this._busy = true; this._error = '';
        this._contestId = ''; this._minScore = ''; this._count = '1'; this._note = ''; this._exclude = true;
        this._prizes = []; this._prizeId = '';
        this._page = 1; this._search = ''; this._winnerPage = 1; this._scorePage = 1; this._invalidate();
        this._historySize = 50; this._candidateSize = 50; this._scoreSize = 50; this._winnerSize = 50;
        this._spinning = false; this._countdown = 0; this._celebrate = false;
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth && !this._auth) { this._auth = auth; this._load(); } });
    }
    _invalidate() { this._previewData = null; this._requestId = crypto.randomUUID(); }
    get _selectedPrize() { return this._prizes.find(p => String(p.prizeId) === this._prizeId); }
    async _selectContest(event) {
        if (this._busy) return;
        this._contestId = event.target.value; this._minScore = ''; this._prizeId = ''; this._prizes = []; this._invalidate();
        if (!this._contestId) return;
        this._busy = true; this._error = '';
        try { this._prizes = await (await this._request(`/prizes?contestId=${this._contestId}`)).json(); }
        catch (e) { this._error = e.message; } finally { this._busy = false; }
    }
    disconnectedCallback() {
        this._skipShow(); clearTimeout(this._celebrateTimer);
        super.disconnectedCallback();
    }
    _skipShow() {
        clearInterval(this._showTick); clearTimeout(this._showTimer);
        this._countdown = 0; this._resolveShow?.(); this._resolveShow = null;
    }
    _startShow() {
        this._skipShow(); this._spinning = true; this._celebrate = false;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
        this._countdown = 3;
        return new Promise(resolve => {
            this._resolveShow = resolve;
            this._showTick = setInterval(() => { this._countdown = Math.max(1, this._countdown - 1); }, 800);
            this._showTimer = setTimeout(() => this._skipShow(), 2400);
        });
    }
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
        this._history = await (await this._request(`?page=${this._page}&pageSize=${this._historySize}&search=${encodeURIComponent(this._search)}`)).json();
    }
    async _load() {
        this._busy = true; this._error = '';
        try { this._options = await (await this._request('/options')).json(); await this._historyData(); }
        catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _preview(event, page = 1) {
        event?.preventDefault(); if (this._busy) return;
        if (!this._prizeId) { this._error = 'Chọn giải thưởng đã cấu hình cho cuộc thi trước khi xem trước/quay.'; return; }
        this._busy = true; this._error = '';
        try {
            const preview = await (await this._request('/preview', { method: 'POST', body: JSON.stringify({
                contestId: Number(this._contestId), minScore: this._minScore === '' ? null : Number(this._minScore), excludePrevious: this._exclude,
                page, pageSize: this._candidateSize,
                prizeId: Number(this._prizeId),
            }) })).json();
            this._minScore = String(preview.minScore); this._previewData = preview; if (page === 1) this._scorePage = 1;
            if (preview.prize) this._prizes = this._prizes.map(p => p.prizeId === preview.prize.prizeId ? preview.prize : p);
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _draw() {
        if (this._busy || this._spinning || !this._previewData || !this._selectedPrize || Number(this._count) > this._selectedPrize.remaining) return;
        const requestId = this._requestId;
        const payload = { contestId: Number(this._contestId), prizeId: Number(this._prizeId), minScore: Number(this._minScore), winnersRequested: Number(this._count), excludePrevious: this._exclude, note: this._note, requestId };
        this._busy = true; this._error = '';
        try {
            try {
                await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: {
                    headline: 'Xác nhận quay số?',
                    content: `Giải: ${this._selectedPrize.name} (${this._selectedPrize.code}), còn ${this._selectedPrize.remaining}/${this._selectedPrize.quantity} suất. Chọn ${payload.winnersRequested} người, điểm tối thiểu ${payload.minScore}. Danh sách xem trước có ${this._previewData.eligibleCount} người; máy chủ sẽ kiểm tra lại cả ứng viên lẫn số suất tại thời điểm quay. Lần quay đã lưu không thể sửa hoặc xóa.`,
                    confirmLabel: 'Xác nhận quay', cancelLabel: 'Hủy', color: 'positive',
                } });
            } catch { return; }
            if (requestId !== this._requestId) return;
            this._result = null;
            const show = this._startShow();
            this.updateComplete.then(() => {
                if (this.isConnected) this.renderRoot.querySelector('.draw-stage')?.scrollIntoView({ block: 'center', behavior: 'instant' });
            });
            // Submit immediately. Animation never chooses a winner and never issues a second draw.
            const result = await (await this._request('', { method: 'POST', body: JSON.stringify(payload) })).json();
            await show;
            this._result = result; this._spinning = false; this._celebrate = this.isConnected;
            clearTimeout(this._celebrateTimer);
            if (this.isConnected) this._celebrateTimer = setTimeout(() => { this._celebrate = false; }, 5000);
            this._winnerPage = 1; this._previewData = null; this._requestId = crypto.randomUUID();
            this._page = 1; await this._historyData();
            this._prizes = await (await this._request(`/prizes?contestId=${payload.contestId}`)).json();
            await this.updateComplete; if (this.isConnected) this.renderRoot.querySelector('#draw-result')?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        } catch (error) { this._error = error.message; } finally { this._skipShow(); this._spinning = false; this._busy = false; }
    }
    async _view(id) {
        if (this._busy) return;
        this._busy = true; this._error = ''; this._celebrate = false; clearTimeout(this._celebrateTimer);
        try { this._result = await (await this._request('/' + id)).json(); this._winnerPage = 1;
            await this.updateComplete; this.renderRoot.querySelector('#draw-result')?.scrollIntoView({ block: 'start' });
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _export(id, kind) {
        if (this._busy) return;
        this._busy = true; this._error = '';
        try { blobDownload(await (await this._request(`/${id}/export/${kind}`)).blob(), `draw-${id}-${kind}.csv`, 'text/csv;charset=utf-8'); }
        catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _historyPage(delta) {
        if (this._busy) return;
        this._page += delta; this._busy = true; this._error = '';
        try { await this._historyData(); } catch (error) { this._page -= delta; this._error = error.message; } finally { this._busy = false; }
    }
    _form() {
        return html`<section><h2>Thiết lập lần quay mới</h2><p class="muted">Mỗi số điện thoại có một suất: lấy điểm cao nhất, bằng điểm lấy lượt nộp sớm nhất.</p>
            <form @submit=${this._preview}><div class="draw-fields">
                <label>Cuộc thi <span class="required">*</span><select name="contestId" required ?disabled=${this._busy} @change=${this._selectContest}><option value="">Chọn cuộc thi</option>${this._options.map(c => html`<option value=${c.id} .selected=${this._contestId === String(c.id)}>${c.name}</option>`)}</select></label>
                <label>Giải thưởng <span class="required">*</span><select name="prizeId" required ?disabled=${this._busy || !this._contestId} .value=${this._prizeId} @change=${e => { this._prizeId = e.target.value; this._count = String(Math.max(1, this._selectedPrize?.remaining || 1)); this._invalidate(); }}><option value="">Chọn giải đã cấu hình</option>${this._prizes.map(p => html`<option value=${p.prizeId} ?disabled=${!p.isActive || p.remaining <= 0} .selected=${String(p.prizeId) === this._prizeId}>${p.name} (${p.code}) — còn ${p.remaining}/${p.quantity}</option>`)}</select></label>
                <label>Điểm tối thiểu<input name="minScore" type="number" min="0" step="1" placeholder="Để trống để gợi ý điểm cao nhất" .value=${this._minScore} ?disabled=${this._busy} @input=${e => { this._minScore = e.target.value; this._invalidate(); }}></label>
                <label>Số người trúng <span class="required">*</span><input name="winners" type="number" min="1" max=${Math.min(1000, this._selectedPrize?.remaining || 1000)} required .value=${this._count} ?disabled=${this._busy} @input=${e => { this._count = e.target.value; this._invalidate(); }}></label>
                <label>Ghi chú lần quay<input name="note" maxlength="200" .value=${this._note} ?disabled=${this._busy} @input=${e => { this._note = e.target.value; this._invalidate(); }}></label>
            </div><label class="check"><input name="exclude" type="checkbox" .checked=${this._exclude} ?disabled=${this._busy} @change=${e => { this._exclude = e.target.checked; this._invalidate(); }}>Loại số điện thoại đã trúng ở các lần quay trước trong cuộc thi này</label>
            <div class="actions"><button type="submit" class="secondary" ?disabled=${this._busy || !this._contestId || !this._prizeId}>Xem trước</button><button type="button" class="primary" ?disabled=${this._busy || !this._previewData || !Number.isInteger(Number(this._count)) || Number(this._count) < 1 || Number(this._count) > 1000 || !this._selectedPrize || Number(this._count) > (this._selectedPrize?.remaining || 0) || Number(this._count) > this._previewData.eligibleCount} @click=${this._draw}>Quay</button></div></form>
            ${this._contestId && !this._prizes.length ? html`<p class="notice error">Cuộc thi chưa có giải thưởng. Mở sửa cuộc thi để chọn giải và số lượng trước khi quay.</p>` : nothing}${this._selectedPrize ? html`<p class="muted">${this._selectedPrize.name}: tổng ${this._selectedPrize.quantity} suất · đã trao ${this._selectedPrize.awarded} · còn ${this._selectedPrize.remaining}.</p>` : nothing}
            ${this._previewData ? this._previewView() : nothing}</section>`;
    }
    _previewView() {
        const p = this._previewData, max = Math.max(1, ...p.scores.map(s => s.count));
        const scores = paginate(p.scores, { page: this._scorePage, size: this._scoreSize }, 50);
        const candidates = p.candidates;
        return html`<div class="draw-preview" role="status"><strong>${p.eligibleCount} người đủ điều kiện</strong><p class="muted">${p.totalCandidates} số điện thoại sau khi gộp và loại người đã trúng · Điểm cao nhất: ${p.suggestedMinScore}. Đây là số liệu xem trước; tập đủ điều kiện được tính lại khi quay.</p>
            ${Number(this._count) > p.eligibleCount ? html`<p class="error">Yêu cầu ${this._count} người trúng nhưng chỉ có ${p.eligibleCount} người đủ điều kiện.</p>` : nothing}
            <h3>Danh sách người đủ điều kiện quay</h3><p class="muted">Mỗi điện thoại chỉ một dòng, lấy lượt điểm cao nhất; bằng điểm lấy lượt nộp sớm hơn. Chỉ hiển thị người đạt ngưỡng ${p.minScore} điểm. Backoffice hiển thị đầy đủ điện thoại; lưu ý khi chia sẻ màn hình.</p>
            <div class="table-wrap"><table class="draw-candidates"><thead><tr><th>STT</th><th>Mã dự thi</th><th>Họ tên</th><th>Điện thoại</th><th>Điểm</th><th>Thời điểm nộp (VN)</th></tr></thead><tbody>${(candidates?.items || []).map((c, i) => html`<tr><td>${(candidates.page - 1) * candidates.pageSize + i + 1}</td><td class="mono">${c.code}</td><td>${c.fullName}</td><td>${c.phone}</td><td><strong>${c.score}</strong></td><td>${date(c.submittedAt)}</td></tr>`)}</tbody></table></div>
            ${!candidates?.items.length ? html`<p class="empty-state">Không có người đủ điều kiện ở trang này.</p>` : nothing}
            <nav class="pager" aria-label="Phân trang người đủ điều kiện">${pageSizeSelect(this._candidateSize, size => { this._candidateSize = size; this._preview(null, 1); }, this._busy, 'Số dòng người đủ điều kiện')}<button ?disabled=${this._busy || !candidates || candidates.page <= 1} @click=${() => this._preview(null, candidates.page - 1)}>← Trước</button><span>${candidates?.totalItems || 0} người · Trang ${candidates?.page || 1}/${Math.max(1, candidates?.totalPages || 0)} · ${candidates?.pageSize || this._candidateSize} dòng/trang</span><button ?disabled=${this._busy || !candidates || candidates.page >= candidates.totalPages} @click=${() => this._preview(null, candidates.page + 1)}>Sau →</button></nav>
            <h3>Phân bố điểm sau khi gộp</h3><div class="scroll"><table><thead><tr><th>Điểm</th><th>Số người</th><th>Phân bố</th></tr></thead><tbody>${scores.items.map(s => html`<tr><td>${s.score}</td><td>${s.count}</td><td><meter min="0" max=${max} value=${s.count} aria-label=${`${s.score} điểm: ${s.count} người`}>${s.count}</meter></td></tr>`)}</tbody></table></div><nav class="pager" aria-label="Phân trang phân bố điểm">${pageSizeSelect(this._scoreSize, size => { this._scoreSize = size; this._scorePage = 1; }, this._busy, 'Số dòng phân bố điểm')}<button ?disabled=${scores.page <= 1} @click=${() => { this._scorePage = scores.page - 1; }}>← Trước</button><span>Trang ${scores.page}/${scores.pages}</span><button ?disabled=${scores.page >= scores.pages} @click=${() => { this._scorePage = scores.page + 1; }}>Sau →</button></nav></div>`;
    }
    _resultView() {
        const d = this._result; if (!d) return nothing;
        const p = paginate(d.winners, { page: this._winnerPage, size: this._winnerSize }, 50);
        return html`<section id="draw-result" aria-label="Kết quả quay số">
            ${this._celebrate ? html`<div class="draw-celebration" role="status"><div class="draw-confetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => html`<i style=${`--i:${i};--x:${(i * 37) % 100}%;--h:${(i * 47) % 360}`}></i>`)}</div><span aria-hidden="true">✦</span><strong>Chúc mừng ${d.winners.length} người trúng giải!</strong><p>Kết quả chính thức đã được máy chủ lưu.</p></div>` : nothing}
            <div class="panel-heading"><div><div class="eyebrow">Kết quả quay #${d.id}</div><h2>${d.prizeName || d.note || 'Danh sách trúng giải'}</h2><p class="muted">${d.contestName || 'Dữ liệu cũ'} · ${date(d.createdAt)} · ${d.winners.length}/${d.eligibleCount} người</p></div><button class="presentation-button" @click=${async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await this.renderRoot.querySelector('#draw-result').requestFullscreen(); } catch { this._error = 'Trình duyệt không hỗ trợ toàn màn hình. Bạn có thể dùng phím F11.'; } }}>Trình chiếu / thoát</button></div>
            <div class="scroll"><table class="winners-table"><thead><tr><th>Thứ tự</th><th>Mã dự thi</th><th>Họ tên</th><th>Điện thoại</th><th>Điểm</th></tr></thead><tbody>${p.items.map(w => html`<tr><td>${w.rank}</td><td class="mono">${w.code}</td><td><strong>${w.fullName}</strong></td><td>${w.phone}</td><td>${w.score}</td></tr>`)}</tbody></table></div>
            <nav class="pager" aria-label="Phân trang người trúng">${pageSizeSelect(this._winnerSize, size => { this._winnerSize = size; this._winnerPage = 1; }, this._busy, 'Số dòng người trúng')}<button ?disabled=${p.page <= 1} @click=${() => { this._winnerPage = p.page - 1; }}>← Trước</button><span>Trang ${p.page}/${p.pages}</span><button ?disabled=${p.page >= p.pages} @click=${() => { this._winnerPage = p.page + 1; }}>Sau →</button></nav>
            <div class="actions export-actions"><button ?disabled=${this._busy} @click=${() => this._export(d.id, 'winners')}>Xuất người trúng CSV</button><button ?disabled=${this._busy || !d.hasEligibleSnapshot} @click=${() => this._export(d.id, 'eligible')}>Xuất đủ điều kiện CSV</button></div>
            ${!d.hasEligibleSnapshot ? html`<p class="muted">Lần quay cũ chưa có bản chụp tập đủ điều kiện. Không dựng lại từ dữ liệu hiện tại.</p>` : nothing}
            ${d.eligibleSnapshotRedacted ? html`<p class="muted">Thông tin cá nhân trong tập đủ điều kiện đã được làm sạch theo yêu cầu xóa dữ liệu. Bản chụp người trúng được giữ làm chứng từ trao giải.</p>` : nothing}</section>`;
    }
    render() {
        const h = this._history;
        const content = html`<div class=${this.embedded ? 'embedded-page' : 'page'}>${this.embedded ? nothing : html`<header class="page-heading"><div><div class="eyebrow">Quản lý cuộc thi</div><h1>Quay số chọn người trúng giải</h1><p class="page-description">Quay ngẫu nhiên mật mã, mỗi số điện thoại một suất. Lịch sử và bản chụp kết quả được lưu cố định.</p></div></header>`}
            ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}${this._busy ? html`<p class="loading-notice" role="status">Đang xử lý…</p>` : nothing}
            ${this._form()}
            ${this._spinning ? html`<section class="draw-stage" aria-label="Hiệu ứng quay thưởng" aria-busy="true"><div class="eyebrow">${this._note || 'Quay số chọn người trúng giải'}</div><h2>Khoảnh khắc may mắn</h2><div class="draw-reels" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map(i => html`<div class="draw-reel"><span style=${`--reel:${i}`}>8<br>2<br>6<br>3<br>9<br>4<br>7<br>5<br>8</span></div>`)}</div><p class="draw-countdown" role="status">${this._countdown ? `Sẵn sàng… ${this._countdown}` : 'Đang chờ kết quả chính thức từ máy chủ…'}</p><p class="muted">Hiệu ứng chỉ để trình chiếu, không tham gia chọn người trúng.</p><button type="button" ?disabled=${!this._countdown} @click=${this._skipShow}>Bỏ qua hiệu ứng</button></section>` : nothing}
            ${this._resultView()}
            <section><h2>Lịch sử quay số</h2><form class="filters" @submit=${async e => { e.preventDefault(); if (this._busy) return; this._search = new FormData(e.currentTarget).get('search').trim(); this._page = 1; await this._historyPage(0); }}><input name="search" ?disabled=${this._busy} aria-label="Tìm lần quay" placeholder="Tìm người tạo hoặc tên giải…"><button ?disabled=${this._busy}>Tìm kiếm</button></form>
                <p class="summary">${h?.totalItems || 0} lần quay · ${h?.pageSize || this._historySize} dòng mỗi trang · Không sửa hoặc xóa lịch sử</p>
                <div class="table-wrap"><table><thead><tr><th>Lần quay</th><th>Cuộc thi / giải</th><th>Thời điểm</th><th>Điểm tối thiểu</th><th>Đủ điều kiện</th><th>Trúng</th><th>Loại đã trúng</th><th>Thao tác</th></tr></thead><tbody>${(h?.items || []).map(d => html`<tr><td>#${d.id}</td><td><strong>${d.contestName || 'Dữ liệu cũ'}</strong><small class="block">${d.prizeName || 'Lần quay cũ chưa gắn giải'}${d.note ? ` · ${d.note}` : ''}</small></td><td>${date(d.createdAt)}</td><td>${d.minScore}</td><td>${d.eligibleCount}</td><td>${d.winners.length}</td><td>${d.excludePrevious ? 'Có' : 'Không'}</td><td><button ?disabled=${this._busy} @click=${() => this._view(d.id)}>Xem kết quả #${d.id}</button></td></tr>`)}</tbody></table></div>${!h?.items.length ? html`<p class="empty-state">Chưa có lần quay phù hợp.</p>` : nothing}
                <nav class="pager" aria-label="Phân trang lịch sử">${pageSizeSelect(this._historySize, size => { this._historySize = size; this._page = 1; this._historyPage(0); }, this._busy, 'Số dòng lịch sử quay')}<button ?disabled=${this._busy || !h || h.page <= 1} @click=${() => this._historyPage(-1)}>← Trước</button><span>Trang ${h?.page || 1}/${h?.totalPages || 1}</span><button ?disabled=${this._busy || !h || h.page >= h.totalPages} @click=${() => this._historyPage(1)}>Sau →</button></nav>
            </section></div>`;
        return this.embedded ? content : html`<umb-body-layout main-no-padding>${content}</umb-body-layout>`;
    }
}
customElements.define('antc-contest-draws-view', ContestDrawsView);
