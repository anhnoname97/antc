import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, html, nothing } from '@umbraco-cms/backoffice/external/lit';
import { contestStyles } from './contest-theme.js?v=1.15.7';
import { pageSizeSelect } from './contest-page-size.js?v=1.15.7';
import { paginate, DEFAULT_PAGE_SIZE } from './contest-pagination.js?v=1.15.7';
import { campaignState, loadCampaigns } from './contest-layout.js?v=1.15.7';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';
import { blobDownload } from '@umbraco-cms/backoffice/utils';

const API = '/umbraco/management/api/v1/antc/contest-reports';
const date = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
const mode = value => value === 'named' ? 'Có tên' : 'Ẩn danh';
const status = value => value === 'submitted' ? 'Đã nộp' : 'Đang thi';
const titles = { dashboard: 'Tổng quan cuộc thi', entries: 'Lượt thi', questions: 'Thống kê câu hỏi', publication: 'Công bố kết quả' };
const descriptions = { dashboard: 'Theo dõi mức độ tham gia, kết quả và hoạt động của cuộc thi.', entries: 'Tra cứu tiến độ, xem bài làm và xuất dữ liệu theo bộ lọc.', questions: 'Nhận diện những câu hỏi nhiều người trả lời sai để cải thiện nội dung.', publication: 'Kiểm tra và công bố bảng xếp hạng, kết quả quay thưởng ra cổng thông tin.' };

export class ContestReportsView extends UmbLitElement {
    static properties = {
        embedded: { type: Boolean, reflect: true },
        _data: { state: true }, _options: { state: true }, _busy: { state: true }, _error: { state: true },
        _detail: { state: true }, _state: { state: true }, _draws: { state: true }, _selected: { state: true }, _message: { state: true },
        _pagination: { state: true }, _campaigns: { state: true }, _hardQuestions: { state: true },
    };
    constructor(view = 'dashboard') {
        super(); this.view = view; this.filters = { sort: 'created_desc', page: '1', pageSize: String(DEFAULT_PAGE_SIZE) };
        this._options = { contests: [], topics: [] }; this._busy = true; this._error = ''; this._message = '';
        this._data = null; this._detail = null; this._state = null; this._draws = []; this._selected = []; this._sequence = 0; this._pagination = {}; this._campaigns = []; this._hardQuestions = [];
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth && !this._auth) { this._auth = auth; this._load(); } });
    }
    disconnectedCallback() { this._sequence++; super.disconnectedCallback(); }
    async _request(path, options = {}, retry = true, base = API) {
        const token = await this._auth.getLatestToken();
        const headers = new Headers(options.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body) headers.set('Content-Type', 'application/json');
        const response = await fetch(base + path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
        if (response.status === 401 && retry && await this._auth.validateToken()) return this._request(path, options, false, base);
        if (!response.ok) {
            const problem = await response.json().catch(() => null);
            throw new Error(response.status === 403 ? 'Bạn cần thuộc nhóm “Quản trị cuộc thi” để sử dụng chức năng này.'
                : response.status === 401 ? 'Phiên Umbraco đã hết hạn. Vui lòng đăng nhập lại.'
                : [problem?.error?.message || problem?.detail || 'Không thực hiện được yêu cầu.', ...Object.values(problem?.error?.fields || {})].join(' '));
        }
        return response;
    }
    _query() {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(this.filters)) if (value !== '' && value != null) query.set(key, value);
        return '?' + query;
    }
    async _load() {
        this._pagination = Object.fromEntries(Object.entries(this._pagination).map(([key, state]) => [key, { page: 1, size: state.size }]));
        const sequence = ++this._sequence; this._busy = true; this._error = ''; this._message = ''; this._data = null;
        try {
            const options = await (await this._request('/options' + (this.filters.contestId ? '?contestId=' + encodeURIComponent(this.filters.contestId) : ''))).json();
            if (sequence !== this._sequence) return;
            this._options = options;
            if (this.view === 'publication') {
                this._state = null; this._draws = []; this._selected = [];
                if (!this.filters.contestId) return;
                const [state, draws] = await Promise.all([
                    this._request(`/contests/${this.filters.contestId}/publication`).then(r => r.json()),
                    this._request(`/contests/${this.filters.contestId}/draws`).then(r => r.json()),
                ]);
                if (sequence === this._sequence) { this._state = state; this._draws = draws; this._selected = [...state.drawIds]; }
            } else {
                const data = await (await this._request('/' + this.view + this._query())).json();
                if (sequence === this._sequence) this._data = data;
                if (this.view === 'dashboard') {
                    const [campaigns, questions] = await Promise.all([
                        loadCampaigns(path => this._request(path, {}, true, '/api/v1/admin/contest').then(r => r.json())),
                        this._request('/questions' + this._query()).then(r => r.json()),
                    ]);
                    if (sequence === this._sequence) { this._campaigns = campaigns; this._hardQuestions = questions.filter(q => q.correctRate != null).sort((a, b) => a.correctRate - b.correctRate).slice(0, 4); }
                }
            }
        } catch (error) { if (sequence === this._sequence) this._error = error.message; }
        finally { if (sequence === this._sequence) this._busy = false; }
    }
    _filter(event) {
        event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
        if ((values.contestId || '') !== (this.filters.contestId || '')) delete values.topicId;
        this.filters = { ...values, page: '1', pageSize: this.filters.pageSize || String(DEFAULT_PAGE_SIZE) }; this._load();
    }
    _page(delta) { this.filters.page = String(Number(this.filters.page || 1) + delta); this._load(); }
    _slice(items, key, defaultSize = DEFAULT_PAGE_SIZE) { return paginate(items, this._pagination[key], defaultSize); }
    _localPage(key, page, size) { this._pagination = { ...this._pagination, [key]: { page, size } }; }
    _pager(key, p, label) {
        return html`<nav class="local-pager" aria-label=${`Phân trang ${label}`} data-pagination=${key}>
            <span class="page-range">${p.start}–${p.end} / ${p.total} dòng</span>
            <label>Số dòng<select aria-label=${`Số dòng ${label}`} ?disabled=${this._busy} @change=${e => this._localPage(key, 1, Number(e.target.value))}>${[10, 50, 100].map(n => html`<option value=${n} .selected=${p.size === n}>${n}</option>`)}</select></label>
            <div class="page-buttons"><button aria-label=${`Trang đầu ${label}`} ?disabled=${this._busy || p.page <= 1} @click=${() => this._localPage(key, 1, p.size)}>«</button><button ?disabled=${this._busy || p.page <= 1} @click=${() => this._localPage(key, p.page - 1, p.size)}>← Trước</button>
            <span aria-live="polite">Trang ${p.page} / ${p.pages}</span><button ?disabled=${this._busy || p.page >= p.pages} @click=${() => this._localPage(key, p.page + 1, p.size)}>Sau →</button><button aria-label=${`Trang cuối ${label}`} ?disabled=${this._busy || p.page >= p.pages} @click=${() => this._localPage(key, p.pages, p.size)}>»</button></div>
        </nav>`;
    }
    async _export(kind) {
        this._busy = true; this._error = '';
        try {
            const response = await this._request('/export/' + kind + this._query());
            // Native helper emits a non-bubbling click so Umbraco's router does not intercept blob URLs.
            blobDownload(await response.blob(), `${kind}.csv`, 'text/csv;charset=utf-8');
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    async _open(id, trigger) {
        this._pagination = {};
        this._busy = true; this._error = '';
        try {
            this._detail = await (await this._request('/entries/' + id)).json(); this._trigger = trigger;
            await this.updateComplete; this.renderRoot.querySelector('dialog')?.showModal();
        } catch (error) { this._error = error.message; } finally { this._busy = false; }
    }
    _close() { this.renderRoot.querySelector('dialog')?.close(); this._detail = null; this._trigger?.focus(); }
    async _publish(publish) {
        try {
            await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: {
                headline: publish ? 'Công bố kết quả cuộc thi?' : 'Gỡ kết quả đã công bố?',
                content: publish ? 'Bảng xếp hạng và các lần quay được chọn sẽ được chốt và hiển thị công khai, với họ tên/điện thoại đã che.'
                    : 'Cổng thông tin sẽ không còn trả các kết quả này. Muốn thay đổi nội dung, công bố lại sau khi kiểm tra.',
                confirmLabel: publish ? 'Công bố' : 'Gỡ công bố', cancelLabel: 'Hủy', color: publish ? 'positive' : 'danger',
            } });
        } catch { return; }
        this._busy = true; this._error = '';
        try {
            await this._request(`/contests/${this.filters.contestId}/publication`, { method: 'PUT', body: JSON.stringify({
                isPublished: publish, drawIds: this._selected, expectedRevision: this._state.revision,
            }) });
            await this._load(); this._message = publish ? 'Đã công bố kết quả.' : 'Đã gỡ công bố.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    _select(name, label, choices) {
        return html`<label>${label}<select name=${name}>${choices.map(([value, text]) => html`<option value=${value} .selected=${String(this.filters[name] || '') === String(value)}>${text}</option>`)}</select></label>`;
    }
    _filters() {
        const count = Object.entries(this.filters).filter(([key, value]) => !['page', 'sort', 'pageSize'].includes(key) && value !== '' && value != null).length;
        return html`<details class="advanced-search" ?open=${this.view === 'publication'}><summary>Tìm kiếm nâng cao <span class="filter-status">${count ? `${count} điều kiện đang áp dụng` : 'Chưa áp dụng bộ lọc'}</span></summary><form class="filter-panel" @submit=${this._filter}>
            <div class=${this.view === 'entries' ? 'filters entries-filters' : 'filters'}>
                ${this.view === 'entries' ? html`
                    <label class="wide">Mã dự thi / Họ tên / Điện thoại<input name="search" maxlength="150" .value=${this.filters.search || ''}></label>
                    ${this._select('contestId', 'Cuộc thi', [['', 'Tất cả cuộc thi'], ...this._options.contests.map(c => [c.id, c.name])])}
                    ${this._select('hasPhone', 'Chế độ', [['', 'Tất cả'], ['false', 'Ẩn danh'], ['true', 'Công khai']])}
                    ${this._select('status', 'Trạng thái', [['', 'Tất cả'], ['submitted', 'Đã nộp'], ['in_progress', 'Đang thi']])}
                    ${this._select('sort', 'Sắp xếp', [['created_desc', 'Tạo mới nhất'], ['created_asc', 'Tạo cũ nhất'], ['score_desc', 'Điểm giảm dần'], ['score_asc', 'Điểm tăng dần'], ['submitted_desc', 'Nộp mới nhất']])}
                    <div class="entry-score-range">
                        <label>Điểm từ<input name="scoreFrom" type="number" min="0" .value=${this.filters.scoreFrom || ''}></label>
                        <label>Điểm đến<input name="scoreTo" type="number" min="0" .value=${this.filters.scoreTo || ''}></label>
                    </div>
                    <label>Tạo từ ngày (VN)<input name="from" type="date" .value=${this.filters.from || ''}></label>
                    <label>Tạo đến ngày (VN)<input name="to" type="date" .value=${this.filters.to || ''}></label>
                ` : html`
                ${this._select('contestId', 'Cuộc thi', [['', this.view === 'publication' ? 'Chọn cuộc thi' : 'Tất cả cuộc thi'], ...this._options.contests.map(c => [c.id, c.name])])}
                ${this.view === 'publication' ? nothing : html`
                    ${this._select('mode', 'Chế độ', [['', 'Tất cả'], ['named', 'Có tên'], ['anon', 'Ẩn danh']])}
                    ${this._select('status', 'Trạng thái', [['', 'Tất cả'], ['submitted', 'Đã nộp'], ['in_progress', 'Đang thi']])}
                    ${this._select('hasPhone', 'Số điện thoại', [['', 'Tất cả'], ['true', 'Có số điện thoại'], ['false', 'Không có số điện thoại']])}
                    <label>Điểm từ<input name="scoreFrom" type="number" min="0" .value=${this.filters.scoreFrom || ''}></label>
                    <label>Điểm đến<input name="scoreTo" type="number" min="0" .value=${this.filters.scoreTo || ''}></label>
                    <label>Tạo từ ngày (VN)<input name="from" type="date" .value=${this.filters.from || ''}></label>
                    <label>Tạo đến ngày (VN)<input name="to" type="date" .value=${this.filters.to || ''}></label>
                    <label class="wide">Mã dự thi / điện thoại / họ tên<input name="search" maxlength="150" .value=${this.filters.search || ''}></label>
                    ${this.view === 'entries' ? this._select('sort', 'Sắp xếp', [['created_desc', 'Tạo mới nhất'], ['created_asc', 'Tạo cũ nhất'], ['score_desc', 'Điểm giảm dần'], ['score_asc', 'Điểm tăng dần'], ['submitted_desc', 'Nộp mới nhất']]) : nothing}
                    ${this.view === 'questions' ? this._select('topicId', 'Chuyên đề', [['', 'Tất cả'], ...this._options.topics.map(t => [t.id, `${t.id} — ${t.title}`])]) : nothing}
                `}
                `}
            </div><div class="actions"><button class="primary" ?disabled=${this._busy}>${this.view === 'publication' ? 'Mở cuộc thi' : 'Lọc dữ liệu'}</button>
            <button type="button" ?disabled=${this._busy} @click=${event => { event.currentTarget.form?.reset(); this.filters = { sort: 'created_desc', page: '1', pageSize: String(DEFAULT_PAGE_SIZE) }; this._load(); }}>Đặt lại</button></div>
        </form></details>`;
    }
    _dashboard() {
        const d = this._data, max = Math.max(1, ...d.scores.map(s => s.count));
        const days = this._slice(d.days, 'days', 10);
        const dailyMax = Math.max(1, ...days.items.map(day => day.count));
        const chosen = this.filters.contestId ? this._campaigns.find(c => String(c.id) === String(this.filters.contestId)) : this._campaigns.find(c => campaignState(c).key === 'live') || this._campaigns.find(c => campaignState(c).key === 'upcoming') || this._campaigns[0];
        const progress = chosen ? Math.max(0, Math.min(100, 100 * (Date.now() - Date.parse(chosen.startAt)) / (Date.parse(chosen.endAt) - Date.parse(chosen.startAt)))) : 0;
        return html`${chosen ? html`<section class="dashboard-banner"><div><span class="badge">${campaignState(chosen).label}</span><span class="muted"> · Cuộc thi #${chosen.id}</span><h2>${chosen.name}</h2><p class="muted">${date(chosen.startAt)} – ${date(chosen.endAt)} · ${chosen.topicCount} chuyên đề · ${chosen.questionCount} câu hỏi</p><div class="schedule-progress"><span style=${`width:${progress}%`}></span></div><p class="muted">${chosen.entryCount} lượt dự thi · ${chosen.maxAttempts === 0 ? 'Không giới hạn lượt' : `Tối đa ${chosen.maxAttempts} lượt mỗi người`}</p></div><div class="actions"><a href="/umbraco/section/contest-management/draws">Quay số trúng thưởng</a><a href="/umbraco/section/contest-management/contest">Quản lý cuộc thi</a></div></section>` : nothing}
            <div class="metrics">${[['Lượt đã tạo', d.created], ['Đã nộp', d.submitted], ['Có tên', d.named], ['Ẩn danh', d.anonymous], ['Điện thoại khác nhau', d.distinctPhones]].map(([label, count]) => html`<article>${label}<strong>${count.toLocaleString('vi-VN')}</strong></article>`)}</div>
            <div class="dashboard-panels"><section><h2>Lượt thi theo ngày</h2><p class="muted panel-note">Theo bộ lọc · Giờ Việt Nam</p><div class="chart daily-chart">${days.items.map(day => html`<div title=${`${date(day.day)}: ${day.count} lượt`}><span>${day.count}</span><svg height="150" viewBox="0 0 32 150" preserveAspectRatio="none" role="img" aria-label=${`${day.day.slice(0, 10)}: ${day.count} lượt`}><rect x="0" y=${150 - Math.round(140 * day.count / dailyMax)} width="32" height=${Math.round(140 * day.count / dailyMax)}></rect></svg><span>${day.day.slice(5, 10).split('-').reverse().join('/')}</span></div>`)}</div>${this._pager('days', days, 'lượt thi theo ngày')}${!d.days.length ? html`<p class="empty-state">Chưa có lượt thi.</p>` : nothing}</section><section><h2>Cần xử lý</h2><p class="muted panel-note">Các tác vụ vận hành cuộc thi</p><div class="dashboard-links"><a href="/umbraco/section/contest-management/contest">Quản lý lịch và bộ đề<small>Kiểm tra thông tin trước khi mở cuộc thi</small></a><a href="/umbraco/section/contest-management/draws">Quay số trúng thưởng<small>Chọn giải và kiểm tra người đủ điều kiện</small></a><a href="/umbraco/section/contest-management/publication">Công bố kết quả<small>Kiểm tra và công bố kết quả ra cổng thông tin</small></a></div></section></div>
            <div class="dashboard-panels"><section><h2>Phân bố điểm</h2><p class="muted panel-note">Số lượt đã nộp theo từng mức điểm</p><div class="chart">${d.scores.map(s => html`<div><span>${s.count}</span><svg width="32" height="160" role="img" aria-label=${`${s.score} điểm: ${s.count} lượt`}><rect x="0" y=${160 - Math.round(150 * s.count / max)} width="32" height=${Math.round(150 * s.count / max)}></rect></svg><span>${s.score}</span></div>`)}</div>${!d.scores.length ? html`<p class="empty-state">Chưa có lượt đã nộp.</p>` : nothing}</section>
            <section><h2>Câu nhiều người trả lời sai</h2><p class="muted panel-note">Tỉ lệ trả lời đúng thấp nhất theo bộ lọc</p>${this._hardQuestions.map(q => html`<div class="hard-question"><p><strong>${q.code}</strong> · ${q.text}</p><div class="panel-heading"><small>${q.answered} lượt trả lời</small><strong>${(q.correctRate * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% đúng</strong></div><meter min="0" max="1" value=${q.correctRate} aria-label=${`Tỷ lệ đúng ${q.code}`}></meter></div>`)}${!this._hardQuestions.length ? html`<p class="empty-state">Chưa có dữ liệu trả lời.</p>` : nothing}<a href="/umbraco/section/contest-management/question-report">Xem tất cả →</a></section></div>`;
    }
    _entries() {
        const d = this._data;
        return html`<div class="actions"><span>${d.total} lượt — ${d.pageSize || DEFAULT_PAGE_SIZE} dòng mỗi trang</span><button ?disabled=${this._busy} @click=${() => this._export('entries')}>Xuất danh sách CSV</button><button ?disabled=${this._busy} @click=${() => this._export('answers')}>Xuất đáp án CSV</button></div>
            <div class="scroll"><table><thead><tr><th>Mã dự thi</th><th>Họ tên</th><th>Điện thoại</th><th>Đơn vị</th><th>Chế độ</th><th>Lượt thứ</th><th>Trạng thái</th><th>Đã làm</th><th>Đúng / điểm</th><th>Tạo lúc</th><th>Nộp lúc</th></tr></thead><tbody>
                ${d.items.map(e => html`<tr><td><button class="link" ?disabled=${this._busy} @click=${event => this._open(e.id, event.currentTarget)}>${e.code}</button></td><td>${e.fullName || '—'}</td><td>${e.phone || '—'}</td><td>${e.org || '—'}</td><td><span class="badge neutral">${mode(e.mode)}</span></td><td>${e.attemptNo ?? '—'}</td><td><span class=${`badge ${e.status === 'submitted' ? 'on' : 'off'}`}>${status(e.status)}</span></td><td>${e.answered}</td><td><strong>${e.correct}</strong></td><td class="nowrap">${date(e.createdAt)}</td><td class="nowrap">${date(e.submittedAt)}</td></tr>`)}
            </tbody></table></div>${!d.items.length ? html`<p>Không có lượt thi phù hợp.</p>` : nothing}
            <div class="actions pager">${pageSizeSelect(d.pageSize || DEFAULT_PAGE_SIZE, size => { this.filters.pageSize = String(size); this.filters.page = '1'; this._load(); }, this._busy, 'Số dòng lượt thi')}<button ?disabled=${this._busy || d.page <= 1} @click=${() => this._page(-1)}>← Trước</button><span>Trang ${d.page} / ${Math.max(1, d.pages)}</span><button ?disabled=${this._busy || d.page >= d.pages} @click=${() => this._page(1)}>Sau →</button></div>`;
    }
    _questions() {
        const questions = this._slice(this._data, 'questions');
        return html`<p>Tỷ lệ đúng = số đúng / lượt trả lời. Xếp tăng dần, câu chưa ai trả lời nằm cuối. Số liệu tách riêng từng cuộc thi. Nền tròn xanh đánh dấu đáp án đúng theo bộ đề cuộc thi.</p>
            <div class="actions"><button ?disabled=${this._busy} @click=${() => this._export('questions')}>Xuất thống kê CSV</button><span>${this._data.length} câu / phiên bản</span></div>
            <div class="scroll"><table><thead><tr><th>Cuộc thi</th><th>Chuyên đề</th><th>Mã câu</th><th>Nội dung</th><th>Trả lời</th><th>Đúng</th><th>Tỷ lệ đúng</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>
                ${questions.items.map(q => html`<tr><td>${q.contestName}</td><td><span class="report-topic-title" title=${q.topicTitle || 'Không còn thông tin chuyên đề'} tabindex="0">${q.topicTitle || 'Không còn thông tin chuyên đề'}</span></td><td>${q.code}</td><td class="question">${q.text}</td><td>${q.answered}</td><td>${q.correct}</td><td>${q.correctRate == null ? 'Chưa có' : (q.correctRate * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '%'}</td>${['A', 'B', 'C', 'D'].map(key => html`<td><span class=${q.correctAnswer === key ? 'stat-answer is-correct' : 'stat-answer'} title=${`Đáp án ${key}${q.correctAnswer === key ? ' (đúng)' : ''}: ${q[key.toLowerCase()]} lượt chọn`} aria-label=${`Đáp án ${key}${q.correctAnswer === key ? ' đúng' : ''}, ${q[key.toLowerCase()]} lượt chọn`}>${q[key.toLowerCase()]}</span></td>`)}</tr>`)}
            </tbody></table></div>${this._pager('questions', questions, 'thống kê câu hỏi')}${!questions.total ? html`<p class="empty-state">Không có câu hỏi phù hợp.</p>` : nothing}`;
    }
    _publication() {
        if (!this._state) return html`<section class="empty-state"><h2>Chọn cuộc thi để bắt đầu</h2><p>Xem trạng thái, chọn lần quay và kiểm tra kết quả trước khi công bố.</p></section>`;
        const draws = this._slice(this._draws, 'draws', 10);
        return html`<section><div class="publication-state"><h2>Kết quả cuộc thi</h2><span class=${`badge ${this._state.isPublished ? 'on' : 'off'}`}>${this._state.isPublished ? 'Đã công bố' : 'Chưa công bố'}</span></div><p class="muted">Phiên bản ${this._state.revision} · Công bố gần nhất: ${date(this._state.publishedAt)}</p>
            <p class="publication-explanation">Bảng xếp hạng lấy lượt tốt nhất của mỗi số điện thoại đã nộp. Chỉ được công bố khi hết thời gian gia hạn. Các lần quay không được chọn sẽ không công khai.</p><h3>Lần quay được công bố</h3>
            ${draws.items.map(draw => html`<label class="check publication-draw"><input type="checkbox" .checked=${this._selected.includes(draw.id)} ?disabled=${this._busy || this._state.isPublished} @change=${e => { this._selected = e.target.checked ? [...this._selected, draw.id] : this._selected.filter(id => id !== draw.id); }}><span><strong>Lần quay #${draw.id}</strong><small class="block">${date(draw.createdAt)} · ${draw.winnerCount} người trúng</small></span></label>`)}
            ${this._pager('draws', draws, 'lần quay công bố')}
            ${!this._draws.length ? html`<p>Chưa có lần quay. Có thể công bố riêng bảng xếp hạng.</p>` : nothing}
            <div class="actions publication-actions"><button class=${this._state.isPublished ? 'danger' : 'primary'} ?disabled=${this._busy} @click=${() => this._publish(!this._state.isPublished)}>${this._state.isPublished ? 'Gỡ công bố' : 'Công bố kết quả'}</button></div></section>`;
    }
    _dialog() {
        const d = this._detail; if (!d) return nothing; const e = d.entry;
        return html`<dialog class="entry-dialog" aria-label=${`Chi tiết ${e.code}`} @cancel=${() => { this._detail = null; this._trigger?.focus(); }} @close=${() => { this._detail = null; }}><div class="dialog-header"><div><div class="eyebrow">Bài làm của thí sinh</div><h2>Chi tiết ${e.code}</h2></div><button aria-label="Đóng" @click=${this._close}>× Đóng</button></div>
            <div class="entry-summary">${[['Họ và tên', e.fullName || 'Ẩn danh'], ['Số điện thoại', e.phone || 'Không có điện thoại'], ['Đơn vị', e.org || 'Không có đơn vị'], ['Chế độ / lượt thứ', `${mode(e.mode)} · ${e.attemptNo ?? '—'}`], ['Trạng thái', status(e.status)], ['Bài làm', `Đã làm ${e.answered}/${d.questions.length} · Đúng ${e.correct}`], ['Thời điểm tạo', date(e.createdAt)], ['Thời điểm nộp', date(e.submittedAt)]].map(([label, value]) => html`<dl><dt>${label}</dt><dd>${value}</dd></dl>`)}</div><div class="entry-content">
            ${!d.hasSnapshot ? html`<p class="error">Lượt cũ không có bản chụp dữ liệu. Không suy đoán đáp án đúng từ ngân hàng hiện tại.</p>` : nothing}
            ${d.topics.map(t => { const key = `topic-${t.topicId}`; const questions = this._slice(d.questions.filter(q => q.topicId === t.topicId), key); return html`<details open><summary><strong>${t.title}</strong><span class="tree-count">Đúng ${t.correct}/${t.total} · Đã làm ${t.answered}</span></summary><div class="scroll"><table><thead><tr><th>Mã câu</th><th>Nội dung</th><th>Đã chọn</th><th>Đáp án đúng</th><th>Kết quả</th><th>Trả lời lúc</th></tr></thead><tbody>
                ${questions.items.map(q => html`<tr data-question-code=${q.code}><td class="mono">${q.code}</td><td class="question">${q.text}</td><td>${q.chosen ? html`<span class="answer">${q.chosen}</span>` : '—'}</td><td>${q.correctAnswer || 'Không có bản chụp dữ liệu'}</td><td class=${q.correct == null ? 'result-unanswered' : q.correct ? 'result-correct' : 'result-incorrect'}>${q.correct == null ? 'Chưa trả lời' : q.correct ? 'Đúng' : 'Sai'}</td><td class="nowrap">${date(q.answeredAt)}</td></tr>`)}
            </tbody></table></div>${this._pager(key, questions, t.title)}</details>`; })}</div><footer class="dialog-footer"><button @click=${this._close}>Đóng</button></footer></dialog>`;
    }
    render() {
        const content = html`<div class=${this.embedded ? 'embedded-page' : 'page'}>${this.embedded ? nothing : html`<header class="page-heading"><div><div class="eyebrow">Quản lý cuộc thi</div><h1>${titles[this.view]}</h1><p class="page-description">${descriptions[this.view]}</p></div><span class="page-context">Giờ Việt Nam · UTC+7</span></header>`}
            ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}${this._message ? html`<p class="success-notice" role="status">${this._message}</p>` : nothing}
            ${this._filters()}${this._busy ? html`<p class="loading-notice" role="status">Đang xử lý…</p>` : nothing}
            ${this.view === 'publication' ? this._publication() : this._data ? this.view === 'dashboard' ? this._dashboard() : this.view === 'entries' ? this._entries() : this._questions() : nothing}
            <p class="muted privacy-note">Dữ liệu cá nhân chỉ dành cho người được phân quyền. Việc xem chi tiết và xuất dữ liệu được ghi nhật ký.</p>${this._dialog()}</div>`;
        return this.embedded ? content : html`<umb-body-layout main-no-padding>${content}</umb-body-layout>`;
    }
    // Keep this layout with its component, after shared breakpoint rules.
    static styles = [contestStyles, css`
        .report-topic-title { display: block; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-answer { display: inline-grid; place-items: center; min-width: 32px; aspect-ratio: 1; padding: 6px; box-sizing: border-box; line-height: 1.25; }
        .stat-answer.is-correct { border-radius: 50%; background: var(--cm-positive, #18794e); color: #fff; font-weight: 700; }
        .filter-panel .filters.entries-filters { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        .filter-panel .entries-filters input, .filter-panel .entries-filters select {
            height: 40px; min-height: 40px; box-sizing: border-box; padding-block: 8px;
        }
        .filter-panel .entries-filters > .entry-score-range {
            grid-column: span 2; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: end; gap: 16px; min-width: 0;
        }
        @media (max-width: 1100px) {
            .filter-panel .filters.entries-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
    `];
}
class ContestDashboardView extends ContestReportsView { constructor() { super('dashboard'); } }
class ContestEntriesReportView extends ContestReportsView { constructor() { super('entries'); } }
class ContestQuestionReportView extends ContestReportsView { constructor() { super('questions'); } }
class ContestPublicationView extends ContestReportsView { constructor() { super('publication'); } }
// Umbraco's route loader may append a cache-buster while embedded views import the bare URL.
// Both module identities must be safe to evaluate in the same document.
if (!customElements.get('antc-contest-dashboard-view')) customElements.define('antc-contest-dashboard-view', ContestDashboardView);
if (!customElements.get('antc-contest-entries-report-view')) customElements.define('antc-contest-entries-report-view', ContestEntriesReportView);
if (!customElements.get('antc-contest-question-report-view')) customElements.define('antc-contest-question-report-view', ContestQuestionReportView);
if (!customElements.get('antc-contest-publication-view')) customElements.define('antc-contest-publication-view', ContestPublicationView);
