import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { MediaApi, valueOf, nameOf, fileUrl, extensionOf, isFolder, kindOf, metadata } from './media-api.js';
import { mediaStyles } from './media-library.styles.js?v=1.0.10';

const icon = name => html`<umb-icon name=${'icon-' + name} aria-hidden="true"></umb-icon>`;
const date = row => new Date(row.variants?.[0]?.createDate || row.createDate || 0).toLocaleDateString('vi-VN');

export class AntcMediaLibrary extends UmbLitElement {
    static properties = {
        _rows: { state: true }, _trash: { state: true }, _view: { state: true }, _kind: { state: true },
        _search: { state: true }, _sort: { state: true }, _selected: { state: true }, _refs: { state: true }, _refsExpanded: { state: true },
        _busy: { state: true }, _detailBusy: { state: true }, _error: { state: true }, _message: { state: true },
        _references: { state: true }, _referenceError: { state: true }, _drag: { state: true },
        _dialog: { state: true }, _dialogName: { state: true }, _page: { state: true }, _progress: { state: true },
    };
    constructor() {
        super();
        this._rows = []; this._trash = []; this._view = 'all'; this._kind = 'all'; this._search = '';
        this._sort = 'newest'; this._selected = null; this._refs = []; this._refsExpanded = false; this._references = null;
        this._busy = true; this._detailBusy = false; this._error = ''; this._message = '';
        this._drag = false; this._dialog = null; this._dialogName = ''; this._page = 1;
        this._sequence = 0; this._detailSequence = 0; this._progress = '';
        this._beforeUnload = event => { if (this._mutating) { event.preventDefault(); event.returnValue = ''; } };
        this._onNavigate = event => {
            if (this._mutating) { event.preventDefault(); return; }
        };
        this.consumeContext(UMB_AUTH_CONTEXT, auth => {
            if (!auth || this._api) return;
            this._api = new MediaApi(auth);
            this._load();
        });
    }
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('beforeunload', this._beforeUnload);
        window.addEventListener('willchangestate', this._onNavigate);
    }
    disconnectedCallback() {
        this._sequence++; this._detailSequence++;
        window.clearTimeout(this._messageTimer);
        window.removeEventListener('beforeunload', this._beforeUnload);
        window.removeEventListener('willchangestate', this._onNavigate);
        super.disconnectedCallback();
    }
    async _load(selectedId = null) {
        const seq = ++this._sequence;
        this._busy = true; this._error = ''; this._references = null; this._referenceError = '';
        try {
            const [rows, trash, config] = await Promise.all([
                this._api.library(), this._api.pages('/recycle-bin/media/root'), this._api.json('/media/configuration'),
            ]);
            if (seq !== this._sequence) return;
            this._rows = rows; this._trash = trash; this._config = config;
            if (selectedId) await this._select(rows.find(x => x.id === selectedId) || null, true);
            else if (!this._selected) await this._select(this._filtered()[0] || null, true);
            this._api.referencedIds(rows.filter(x => !isFolder(x))).then(ids => {
                if (seq === this._sequence) this._references = ids;
            }).catch(error => { if (seq === this._sequence) this._referenceError = error.message; });
        } catch (error) { if (seq === this._sequence) this._error = error.message; }
        finally { if (seq === this._sequence) this._busy = false; }
    }
    _inFolder(row, folderId) {
        let parent = row.parentId;
        const seen = new Set();
        while (parent && !seen.has(parent)) {
            if (parent === folderId) return true;
            seen.add(parent);
            parent = this._rows.find(x => x.id === parent)?.parentId;
        }
        return false;
    }
    _filtered() {
        const source = this._view === 'trash' ? this._trash : this._rows;
        const search = this._search.trim().toLocaleLowerCase('vi-VN');
        return source.filter(row => {
            if (this._view !== 'trash' && isFolder(row)) return false;
            if (!['all', 'unused', 'trash'].includes(this._view) && !this._inFolder(row, this._view)) return false;
            if (this._view === 'unused' && (!this._references || this._references.has(row.id))) return false;
            if (this._kind !== 'all' && kindOf(row) !== this._kind) return false;
            return !search || nameOf(row).toLocaleLowerCase('vi-VN').includes(search);
        }).sort((a, b) => this._sort === 'name' ? nameOf(a).localeCompare(nameOf(b), 'vi')
            : this._sort === 'size' ? Number(valueOf(b, 'umbracoBytes') || 0) - Number(valueOf(a, 'umbracoBytes') || 0)
            : (new Date(a.variants?.[0]?.createDate || a.createDate || 0) - new Date(b.variants?.[0]?.createDate || b.createDate || 0)) * (this._sort === 'oldest' ? 1 : -1));
    }
    async _changeView(view) {
        if (this._busy || this._mutating) return;
        this._view = view; this._page = 1; this._kind = 'all'; this._search = ''; this._notify(''); this._error = '';
        await this._select(this._filtered()[0] || null, true);
    }
    async _select(row, force = false) {
        if (!force && (this._mutating)) return;
        const seq = ++this._detailSequence;
        this._selected = null; this._refs = []; this._refsExpanded = false; this._refsError = ''; this._detailBusy = !!row;
        if (!row) { this._detailBusy = false; return; }
        try {
            const detail = await this._api.detail(row.id);
            if (seq !== this._detailSequence) return;
            this._selected = { ...detail, mediaType: { ...row.mediaType, ...detail.mediaType }, parentId: row.parentId };
            try {
                const refs = await this._api.references(row.id);
                if (seq === this._detailSequence) { this._refs = refs; this._refsError = ''; }
            } catch (error) { if (seq === this._detailSequence) this._refsError = error.message; }
        } catch (error) { if (seq === this._detailSequence) this._error = error.message; }
        finally { if (seq === this._detailSequence) this._detailBusy = false; }
    }
    _notify(message) {
        window.clearTimeout(this._messageTimer);
        this._message = message;
        if (message) {
            this._messageTimer = window.setTimeout(() => { this._message = ''; }, 5000);
        }
    }
    async _mutate(action, message) {
        if (this._mutating) return;
        this._mutating = true; this._busy = true; this._error = ''; this._notify('');
        try { await action(); if (message) this._notify(message); }
        catch (error) { this._error = error.message; }
        finally { this._mutating = false; this._busy = false; this._progress = ''; }
    }
    _parent() { return this._rows.find(x => isFolder(x) && x.id === this._view) || null; }
    async _uploadFiles(files, replace = false) {
        if (!files.length || this._busy) return;
        const selected = this._selected, parent = this._parent();
        await this._mutate(async () => {
            let selectedId = null, completed = 0;
            const failures = [];
            for (const file of files) {
                this._progress = `Đang tải ${completed + failures.length + 1}/${files.length}: ${file.name}`;
                try {
                    if (file.size > 20 * 1024 * 1024) throw new Error('Tệp vượt quá 20 MB.');
                    if (!/\.(jpe?g|png|webp|gif|avif|svg|pdf|docx?|xlsx?|pptx?|txt|mp4|webm|mov|mp3|wav|ogg)$/i.test(file.name)) throw new Error('Định dạng tệp chưa được hỗ trợ.');
                    selectedId = await this._api.upload(file, parent, replace ? await this._api.detail(selected.id) : null);
                    completed++;
                } catch (error) { failures.push(`${file.name}: ${error.message}`); }
            }
            this._selected = null;
            await this._load(selectedId);
            if (failures.length) this._error = failures.join(' ');
            this._notify(`Đã ${replace ? 'thay' : 'tải lên'} ${completed}/${files.length} tệp.`);
        }, '');
    }
    async _createFolder() {
        const name = this._dialogName.trim();
        if (!name) return;
        await this._mutate(async () => {
            const parent = this._parent();
            const [types, folders] = await Promise.all([this._api.allowedTypes(parent), this._api.pages('/item/media-type/folders')]);
            const type = folders.find(x => types.some(y => y.id === x.id));
            if (!type) throw new Error('Không được phép tạo thư mục tại vị trí này.');
            const id = await this._api.create(name, type, parent?.id);
            this._dialog = null;
            this._selected = null; await this._load();
            this._view = id; this._page = 1; await this._select(null, true);
        }, 'Đã tạo thư mục.');
    }
    async _trashSelected() {
        const row = this._selected;
        if (!row) return;
        this._dialog = 'delete';
        await this.updateComplete; this.shadowRoot.querySelector('.dialog button')?.focus();
    }
    async _confirmDelete() {
        const row = this._selected;
        await this._mutate(async () => {
            const refs = await this._api.references(row.id);
            if (refs.length && this._config?.disableDeleteWhenReferenced) throw new Error('Tệp đang được sử dụng. Hãy gỡ các liên kết trước khi xóa.');
            await this._api.request(`/media/${row.id}/move-to-recycle-bin`, { method: 'PUT' });
            this._dialog = null; this._selected = null; await this._load();
        }, 'Đã chuyển tệp vào thùng rác.');
    }
    async _restore(row) {
        await this._mutate(async () => {
            const original = await this._api.json(`/recycle-bin/media/${row.id}/original-parent`);
            await this._api.request(`/recycle-bin/media/${row.id}/restore`, { method: 'PUT', body: JSON.stringify({ target: original ? { id: original.id } : null }) });
            this._selected = null; await this._load();
        }, 'Đã khôi phục tệp.');
    }
    async _download() {
        const url = fileUrl(this._selected);
        if (!url) return;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Không tải xuống được tệp.');
            const objectUrl = URL.createObjectURL(await response.blob());
            const link = document.createElement('a'); link.href = objectUrl;
            link.download = decodeURIComponent(new URL(url).pathname.split('/').pop()); link.click();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch (error) { this._error = error.message; }
    }
    _preview(row, large = false) {
        const url = fileUrl(row), kind = kindOf(row);
        if (kind === 'image' && url) return html`<img src=${url} alt=${String(valueOf(row, 'altText') || '')} loading="lazy" @error=${event => { event.target.hidden = true; }} />`;
        if (kind === 'video' && large && url) return html`<video controls preload="metadata" src=${url}></video>`;
        return html`<span class="file-symbol">${icon(isFolder(row) ? 'folder' : kind === 'video' ? 'video' : 'document')}</span>`;
    }
    _navItem(view, label, count, glyph = 'folder', depth = 0) {
        return html`<button class="nav-item ${this._view === view ? 'active' : ''} ${depth ? 'nested' : ''}" aria-current=${this._view === view ? 'page' : nothing}
            ?disabled=${this._busy} @click=${() => this._changeView(view)}>${icon(glyph)}<span>${label}</span><small>${count}</small></button>`;
    }
    _folderNav(parent = null, depth = 0) {
        return this._rows.filter(x => isFolder(x) && x.parentId === parent).map(folder => html`
            ${this._navItem(folder.id, nameOf(folder), this._rows.filter(x => !isFolder(x) && this._inFolder(x, folder.id)).length, 'folder', depth)}
            ${this._folderNav(folder.id, depth + 1)}`);
    }
    _sidebar() {
        const files = this._rows.filter(x => !isFolder(x));
        return html`<aside class="sidebar" aria-label="Thư mục phương tiện">
            <div class="sidebar-heading">THƯ MỤC</div>
            <nav>${this._navItem('all', 'Tất cả tệp', files.length)}${this._folderNav()}
                ${this._navItem('trash', 'Thùng rác', this._trash.length, 'trash')}</nav>
            <div class="sidebar-heading cleanup-heading">CẦN DỌN DẸP</div>
            ${this._navItem('unused', 'Chưa dùng ở đâu', this._references ? files.filter(x => !this._references.has(x.id)).length : '…', 'info')}

        </aside>`;
    }
    _viewLabel() {
        return ({ all: 'Tất cả tệp', unused: 'Chưa dùng ở đâu', trash: 'Thùng rác' })[this._view]
            || nameOf(this._rows.find(x => x.id === this._view) || {});
    }
    _card(row) {
        const selected = this._selected?.id === row.id;
        return html`<button class="media-card ${selected ? 'selected' : ''}" title=${nameOf(row)} aria-pressed=${selected}
            ?disabled=${this._mutating} @click=${() => this._select(row)}>
            <div class="thumbnail ${kindOf(row)}">${this._preview(row)}
                <span class="extension">${isFolder(row) ? 'THƯ MỤC' : extensionOf(row).toUpperCase() || 'TỆP'}</span>
                ${selected ? html`<span class="check">${icon('check')}</span>` : nothing}
            </div><div class="card-caption"><strong>${nameOf(row)}</strong><span>${this._view === 'trash' ? 'Trong thùng rác' : metadata(row)}</span></div>
        </button>`;
    }
    _detail() {
        if (this._detailBusy) return html`<aside class="detail-panel empty-detail" aria-busy="true"><uui-loader></uui-loader><p>Đang tải thông tin tệp…</p></aside>`;
        const row = this._selected;
        if (!row) return html`<aside class="detail-panel empty-detail">${icon('picture')}<p>Chọn một tệp để xem thông tin</p></aside>`;
        const trashed = this._view === 'trash';
        return html`<aside class="detail-panel" aria-label="Chi tiết tệp">
            <div class="detail-preview ${kindOf(row)}">${this._preview(row, true)}</div>
            <div class="detail-body"><h2>${nameOf(row)}</h2><p class="file-meta">${metadata(row)} · tải lên ${date(row)}</p>
                <h3>${this._refsError ? 'Nơi đang sử dụng' : `Đang dùng ở ${this._refs.length} mục`}</h3>
                ${this._refsError ? html`<p class="help error-text">${this._refsError}</p>` : this._refs.length ? html`<ul id="media-references" class="references">${(this._refsExpanded ? this._refs : this._refs.slice(0, 2)).map(ref => html`
                    <li><a href=${`/umbraco/section/${String(ref.$type).toLowerCase().includes('media') ? 'media' : 'content'}/workspace/${String(ref.$type).toLowerCase().includes('media') ? 'media' : 'document'}/edit/${ref.id}`}>
                        ${icon('document')} ${ref.name || ref.variants?.[0]?.name || 'Xem nội dung'}</a></li>`)}</ul>
                    ${this._refs.length > 2 ? html`<button class="references-toggle" aria-controls="media-references" aria-expanded=${this._refsExpanded}
                        @click=${() => { this._refsExpanded = !this._refsExpanded; }}>
                        ${this._refsExpanded ? 'Thu gọn' : `Xem thêm (${this._refs.length - 2})`}
                        ${icon(this._refsExpanded ? 'navigation-up' : 'navigation-down')}
                    </button>` : nothing}`
                    : html`<p class="help">Tệp chưa được tham chiếu trong nội dung.</p>`}
                <div class="detail-actions">${trashed
                    ? html`<button class="primary" ?disabled=${this._busy} @click=${() => this._restore(row)}>${icon('undo')} Khôi phục</button>`
                    : html`<button ?disabled=${this._busy} @click=${() => this.shadowRoot.getElementById('replace-file').click()}>Thay tệp</button>
                        <button ?disabled=${this._busy || !fileUrl(row)} @click=${this._download}>Tải xuống</button>
                        <button class="danger icon-button" aria-label="Chuyển vào thùng rác" ?disabled=${this._busy || (this._refs.length > 0 && this._config?.disableDeleteWhenReferenced)} @click=${this._trashSelected}>${icon('trash')}</button>`}
                </div>
                <a class="native-editor" href=${`/umbraco/section/media/workspace/media/edit/${row.id}`}>Mở trình chỉnh sửa Umbraco ${icon('out')}</a>
            </div>
        </aside>`;
    }
    _renderDialog() {
        if (!this._dialog) return nothing;
        const folder = this._dialog === 'folder';
        return html`<div class="dialog-backdrop" @click=${event => { if (event.target === event.currentTarget && !this._busy) this._dialog = null; }}>
            <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" @keydown=${event => {
                    if (event.key === 'Escape' && !this._busy) this._dialog = null;
                    if (event.key === 'Tab') {
                        const controls = [...event.currentTarget.querySelectorAll('input,button')].filter(x => !x.disabled);
                        const first = controls[0], last = controls.at(-1), active = this.shadowRoot.activeElement;
                        if (event.shiftKey && active === first) { event.preventDefault(); last?.focus(); }
                        else if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus(); }
                    }
                }}>
                <h2 id="dialog-title">${folder ? 'Tạo thư mục mới' : 'Chuyển tệp vào thùng rác?'}</h2>
                ${folder ? html`<label for="folder-name">Tên thư mục</label><input id="folder-name" maxlength="150" .value=${this._dialogName}
                    @input=${event => { this._dialogName = event.target.value; }} @keydown=${event => { if (event.key === 'Enter' && this._dialogName.trim() && !this._busy) this._createFolder(); }} />`
                    : html`<p>Tệp <strong>${nameOf(this._selected)}</strong> sẽ được chuyển vào thùng rác. Bạn có thể khôi phục sau.</p>
                        ${this._refs.length ? html`<p class="error-text">Tệp đang được sử dụng ở ${this._refs.length} mục. Xóa tệp có thể làm mất hình ảnh hoặc liên kết tại các mục này.</p>` : nothing}`}
                ${this._error ? html`<p role="alert" class="error-text">${this._error}</p>` : nothing}
                <div class="dialog-actions"><button ?disabled=${this._busy} @click=${() => { this._dialog = null; }}>Hủy</button>
                    <button class=${folder ? 'primary' : 'danger'} ?disabled=${this._busy || (folder && !this._dialogName.trim())}
                        @click=${folder ? this._createFolder : this._confirmDelete}>${this._busy ? 'Đang xử lý…' : folder ? 'Tạo thư mục' : 'Chuyển vào thùng rác'}</button></div>
            </section></div>`;
    }
    render() {
        const filtered = this._filtered(), pageCount = Math.max(1, Math.ceil(filtered.length / 24));
        const currentPage = Math.min(this._page, pageCount), rows = filtered.slice((currentPage - 1) * 24, currentPage * 24);
        const trash = this._view === 'trash';
        return html`<div class="library" ?inert=${!!this._dialog}>${this._sidebar()}<main>
            <header><div><div class="breadcrumb">Phương tiện › ${this._viewLabel()}</div><h1>Thư viện phương tiện</h1></div>
                <div class="header-actions"><button ?disabled=${this._busy || trash} @click=${async () => {
                    this._dialog = 'folder'; this._dialogName = ''; this._error = '';
                    await this.updateComplete; this.shadowRoot.getElementById('folder-name')?.focus();
                }}>Thư mục mới</button></div>
            </header>
            <input hidden type="file" id="upload-files" multiple accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.webm,.mov,.mp3,.wav,.ogg"
                @change=${event => { this._uploadFiles([...event.target.files]); event.target.value = ''; }} />
            <input hidden type="file" id="replace-file" accept=${this._selected ? '.' + extensionOf(this._selected) : ''}
                @change=${event => { this._uploadFiles([...event.target.files], true); event.target.value = ''; }} />
            ${!trash ? html`<button class="dropzone ${this._drag ? 'dragging' : ''}" ?disabled=${this._busy}
                @dragover=${event => { event.preventDefault(); this._drag = true; }} @dragleave=${() => { this._drag = false; }}
                @drop=${event => { event.preventDefault(); this._drag = false; this._uploadFiles([...event.dataTransfer.files]); }}
                @click=${() => this.shadowRoot.getElementById('upload-files').click()}>${icon('cloud-upload')}
                <span>${this._progress || 'Chọn tệp hoặc kéo thả vào đây · JPG, PNG, WebP, SVG, PDF, MP4 · tối đa 20 MB mỗi tệp'}</span></button>` : nothing}
            ${this._error && !this._dialog ? html`<div class="notice error" role="alert">${this._error}<button @click=${() => this._load(this._selected?.id)}>Thử lại</button></div>` : nothing}
            ${this._message ? html`<div class="notice success" role="status">${this._message}</div>` : nothing}
            <div class="toolbar"><label class="search">${icon('search')}<input type="search" placeholder="Tìm theo tên tệp" aria-label="Tìm theo tên tệp" .value=${this._search}
                @input=${event => { this._search = event.target.value; this._page = 1; }} /></label>
                <div class="filters" role="group" aria-label="Loại tệp">${[['all', 'Tất cả'], ['image', 'Ảnh'], ['document', 'Tài liệu'], ['video', 'Video']].map(([key, label]) => html`
                    <button class="chip ${this._kind === key ? 'active' : ''}" aria-pressed=${this._kind === key} @click=${() => { this._kind = key; this._page = 1; }}>${label}</button>`)}</div>
                <select aria-label="Sắp xếp tệp" .value=${this._sort} @change=${event => { this._sort = event.target.value; this._page = 1; }}>
                    <option value="newest">Mới tải lên trước</option><option value="oldest">Cũ nhất trước</option><option value="name">Tên tệp A–Z</option><option value="size">Dung lượng lớn nhất</option></select>
            </div>
            ${this._view === 'unused' && this._referenceError ? html`<div class="notice error" role="alert">Không tải được thông tin sử dụng: ${this._referenceError}<button @click=${() => this._load()}>Thử lại</button></div>` : nothing}
            <div class="content"><section class="results" aria-label="Danh sách tệp" aria-busy=${this._busy}>
                ${this._busy && !this._rows.length ? html`<div class="empty"><uui-loader></uui-loader><p>Đang tải thư viện phương tiện…</p></div>`
                    : rows.length ? html`<div class="media-grid">${repeat(rows, row => row.id, row => this._card(row))}</div>`
                    : html`<div class="empty">${icon('folder')}<h2>${this._view === 'unused' && !this._references && !this._referenceError ? 'Đang kiểm tra nơi sử dụng…' : 'Không có tệp nào'}</h2>
                        <p>${this._search || this._kind !== 'all' ? 'Thử tìm bằng tên khác hoặc đổi bộ lọc.' : trash ? 'Các tệp đã xóa sẽ xuất hiện tại đây.' : 'Tải tệp lên hoặc chọn thư mục khác để bắt đầu.'}</p></div>`}
                ${pageCount > 1 ? html`<nav class="pagination" aria-label="Phân trang"><button ?disabled=${currentPage <= 1} @click=${() => { this._page = currentPage - 1; }}>Trước</button>
                    <span>${currentPage} / ${pageCount} · ${filtered.length} tệp</span><button ?disabled=${currentPage >= pageCount} @click=${() => { this._page = currentPage + 1; }}>Sau</button></nav>` : nothing}
            </section>${this._detail()}</div>
        </main></div>${this._renderDialog()}`;
    }
    static styles = mediaStyles;
}
customElements.define('antc-media-library', AntcMediaLibrary);
