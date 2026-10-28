import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_CONFIRM_MODAL, umbOpenModal } from '@umbraco-cms/backoffice/modal';
import { contestStyles } from './contest-theme.js?v=1.14.10';
import { pageSizeSelect } from './contest-page-size.js';

const API = '/api/v1/admin/contest/prizes';
export class ContestPrizesView extends UmbLitElement {
    static styles = contestStyles;
    static properties = { _data: { state: true }, _busy: { state: true }, _error: { state: true }, _editor: { state: true }, _message: { state: true } };
    constructor() {
        super(); this._data = null; this._busy = true; this._error = ''; this._message = ''; this._editor = null;
        this._page = 1; this._size = 50; this._search = ''; this._active = '';
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth && !this._auth) { this._auth = auth; this._run(() => this._load()); } });
    }
    async _request(path = '', options = {}, retry = true) {
        const token = await this._auth.getLatestToken(); const headers = new Headers(options.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body) headers.set('Content-Type', 'application/json');
        const r = await fetch(API + path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
        if (r.status === 401 && retry && await this._auth.validateToken()) return this._request(path, options, false);
        if (r.status === 204) return null;
        const payload = await r.json().catch(() => null);
        if (!r.ok) throw new Error([payload?.error?.message || 'Không thực hiện được thao tác quản trị giải thưởng.', ...Object.values(payload?.error?.fields || {})].join(' '));
        return payload;
    }
    async _run(action) {
        if (this._working) return; this._working = true; this._busy = true; this._error = '';
        try { await action(); } catch (e) { this._error = e.message; } finally { this._busy = false; this._working = false; }
    }
    async _load() {
        this._data = await this._request('?' + new URLSearchParams({ page: this._page, pageSize: this._size, search: this._search, isActive: this._active }));
    }
    async _edit(prize = {}) {
        this._editor = prize; await this.updateComplete; this.renderRoot.querySelector('dialog')?.showModal();
    }
    _close() { this.renderRoot.querySelector('dialog')?.close(); this._editor = null; }
    async _save(event) {
        event.preventDefault(); if (this._busy) return;
        const form = new FormData(event.currentTarget), current = this._editor;
        await this._run(async () => {
            await this._request(current.id ? `/${current.id}` : '', { method: current.id ? 'PUT' : 'POST', body: JSON.stringify({
                code: form.get('code'), name: form.get('name'), description: form.get('description'), isActive: form.get('active') === 'on', sortOrder: Number(form.get('sort')), expectedRevision: current.revision ?? null,
            }) });
            this._close(); this._message = 'Đã lưu giải thưởng. Tên giải trong các lần quay cũ được giữ nguyên.'; await this._load();
        });
    }
    async _remove(prize) {
        if (this._busy) return;
        try { await umbOpenModal(this, UMB_CONFIRM_MODAL, { data: { headline: 'Xóa giải thưởng?', content: `Xóa “${prize.name}”? Giải đã gắn cuộc thi không thể xóa; hãy chuyển sang ngừng dùng.`, confirmLabel: 'Xóa giải', cancelLabel: 'Hủy', color: 'danger' } }); } catch { return; }
        await this._run(async () => { await this._request(`/${prize.id}`, { method: 'DELETE' }); await this._load(); });
    }
    render() {
        const d = this._data, p = this._editor;
        return html`<umb-body-layout main-no-padding><div class="page"><header class="page-heading"><div><div class="eyebrow">Quản lý cuộc thi</div><h1>Giải thưởng</h1><p class="page-description">Danh mục dùng chung cho nhiều cuộc thi. Số lượng giải được đặt riêng ở từng cuộc thi.</p></div></header>
        ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}${this._message ? html`<p class="success-notice" role="status">${this._message}</p>` : nothing}
        <div class="toolbar"><details class="advanced-search"><summary>Tìm kiếm nâng cao</summary><form class="filters" @submit=${e => { e.preventDefault(); const f = new FormData(e.currentTarget); this._search = f.get('search').trim(); this._active = f.get('active'); this._page = 1; this._run(() => this._load()); }}><input name="search" aria-label="Tìm giải thưởng" placeholder="Mã hoặc tên giải…" maxlength="150"><select name="active" aria-label="Trạng thái giải"><option value="">Tất cả trạng thái</option><option value="true">Đang dùng</option><option value="false">Ngừng dùng</option></select><button ?disabled=${this._busy}>Tìm kiếm</button></form></details><button class="primary" ?disabled=${this._busy} @click=${() => this._edit()}>+ Thêm giải thưởng</button></div>
        <section><p class="summary">${d?.totalItems || 0} giải thưởng</p><div class="table-wrap"><table><thead><tr><th>Mã giải</th><th>Tên giải</th><th>Mô tả</th><th>Thứ tự</th><th>Cuộc thi sử dụng</th><th>Trạng thái</th><th></th></tr></thead><tbody>${(d?.items || []).map(p => html`<tr><td class="mono">${p.code}</td><td><strong>${p.name}</strong></td><td>${p.description || '—'}</td><td>${p.sortOrder}</td><td>${p.contestCount}</td><td><span class="badge ${p.isActive ? 'on' : 'off'}">${p.isActive ? 'Đang dùng' : 'Ngừng dùng'}</span></td><td class="actions"><button ?disabled=${this._busy} @click=${() => this._edit(p)}>Sửa</button><button class="danger" ?disabled=${this._busy} @click=${() => this._remove(p)}>Xóa</button></td></tr>`)}</tbody></table></div>
        ${!d?.items.length ? html`<p class="empty-state">Chưa có giải thưởng phù hợp. Tạo giải trước khi cấu hình cuộc thi.</p>` : nothing}
        <nav class="pager" aria-label="Phân trang giải thưởng">${pageSizeSelect(this._size, size => { this._size = size; this._page = 1; this._run(() => this._load()); }, this._busy, 'Số dòng giải thưởng')}<button ?disabled=${this._busy || !d || d.page <= 1} @click=${() => { this._page--; this._run(() => this._load()); }}>← Trước</button><span>Trang ${d?.page || 1}/${Math.max(1, d?.totalPages || 0)}</span><button ?disabled=${this._busy || !d || d.page >= d.totalPages} @click=${() => { this._page++; this._run(() => this._load()); }}>Sau →</button></nav></section>
        ${p ? html`<dialog class="large" @close=${() => { this._editor = null; }} @cancel=${e => { if (this._busy) e.preventDefault(); }}><form @submit=${this._save}><header><h2>${p.id ? 'Cập nhật' : 'Thêm'} giải thưởng</h2><button type="button" class="close" aria-label="Đóng" ?disabled=${this._busy} @click=${this._close}>×</button></header><div class="form-grid"><label>Mã giải<span>*</span><input name="code" maxlength="30" required .value=${p.code || ''}></label><label>Tên giải<span>*</span><input name="name" minlength="2" maxlength="150" required .value=${p.name || ''}></label><label class="wide">Mô tả<textarea name="description" rows="3" maxlength="2000" .value=${p.description || ''}></textarea></label><label>Thứ tự hiển thị<input name="sort" type="number" min="0" required .value=${String(p.sortOrder || 0)}></label><label class="check"><input name="active" type="checkbox" .checked=${p.isActive !== false}>Đang sử dụng</label></div>${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}<footer><button type="button" ?disabled=${this._busy} @click=${this._close}>Hủy</button><button class="primary" ?disabled=${this._busy}>Lưu giải thưởng</button></footer></form></dialog>` : nothing}
        </div></umb-body-layout>`;
    }
}
if (!customElements.get('antc-contest-prizes-view')) customElements.define('antc-contest-prizes-view', ContestPrizesView);
