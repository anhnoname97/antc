const base = '/umbraco/management/api/v1';
export const valueOf = (row, alias) => row.values?.find(x => x.alias === alias)?.value;
export const nameOf = row => row.variants?.[0]?.name || row.name || 'Không có tên';
export function fileUrl(row) {
    let value = valueOf(row, 'umbracoFile');
    if (typeof value === 'string' && value.startsWith('{')) {
        try { value = JSON.parse(value); } catch { return ''; }
    }
    const url = typeof value === 'string' ? value : value?.src;
    if (!url) return '';
    try {
        const parsed = new URL(url, location.origin);
        return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch { return ''; }
}
export function extensionOf(row) {
    return String(valueOf(row, 'umbracoExtension') || fileUrl(row).split('?')[0].split('.').pop() || '').toLowerCase();
}
export const isFolder = row => row.mediaType?.alias?.toLowerCase() === 'folder' || row.mediaType?.icon === 'icon-folder';
export function kindOf(row) {
    const ext = extensionOf(row);
    if (isFolder(row)) return 'folder';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'bmp', 'tif', 'tiff'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'm4v', 'avi', 'ogv'].includes(ext)) return 'video';
    return 'document';
}
export function sizeLabel(bytes) {
    const n = Number(bytes) || 0;
    return n >= 1073741824 ? `${(n / 1073741824).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} GB`
        : n >= 1048576 ? `${(n / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
        : `${Math.ceil(n / 1024)} KB`;
}
export function metadata(row) {
    const w = valueOf(row, 'umbracoWidth'), h = valueOf(row, 'umbracoHeight');
    return [w && h ? `${w}×${h}` : '', sizeLabel(valueOf(row, 'umbracoBytes'))].filter(Boolean).join(' · ');
}
export class MediaApi {
    constructor(auth) { this.auth = auth; this._details = new Map(); }
    async request(path, options = {}, retry = true) {
        const headers = new Headers(options.headers);
        const token = await this.auth.getLatestToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
        const response = await fetch(base + path, { ...options, headers, credentials: 'same-origin' });
        if (response.status === 401 && retry && await this.auth.validateToken()) return this.request(path, options, false);
        if (!response.ok) {
            const problem = await response.json().catch(() => null);
            throw new Error(response.status === 403 ? 'Bạn chưa có quyền thực hiện thao tác này.'
                : response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : problem?.detail || problem?.title || `Không thực hiện được thao tác (${response.status}).`);
        }
        return response;
    }
    async json(path) { const response = await this.request(path); return response.status === 204 ? null : response.json(); }
    async pages(path, params = {}) {
        const items = [];
        let total = Infinity;
        do {
            const query = new URLSearchParams({ ...params, skip: String(items.length), take: '100' });
            const page = await this.json(`${path}?${query}`);
            if (!page.items?.length) break;
            items.push(...page.items);
            total = page.total;
        } while (items.length < total);
        return items;
    }
    async library() {
        const rows = [], pending = [null];
        // The collection endpoint only returns direct children; walk folders with bounded concurrency.
        while (pending.length) {
            const parents = pending.splice(0, 4);
            const groups = await Promise.all(parents.map(parent => this.pages('/collection/media', parent ? { id: parent } : {})));
            groups.forEach((items, i) => {
                for (const row of items) {
                    rows.push({ ...row, parentId: parents[i] });
                    if (isFolder(row)) pending.push(row.id);
                }
            });
        }
        // List-view configuration can omit all values. Hydrate file metadata from the detail API,
        // reusing unchanged records on refresh and limiting concurrent requests.
        const files = rows.filter(row => !isFolder(row));
        for (let i = 0; i < files.length; i += 6) {
            await Promise.all(files.slice(i, i + 6).map(async row => {
                const version = row.variants?.[0]?.updateDate;
                const cached = this._details.get(row.id);
                const detail = cached && cached.version === version ? cached.row : await this.detail(row.id);
                this._details.set(row.id, { version, row: detail });
                row.values = detail.values;
            }));
        }
        return rows;
    }
    async referencedIds(rows) {
        const referenced = new Set();
        for (let start = 0; start < rows.length; start += 80) {
            const ids = rows.slice(start, start + 80).map(x => x.id);
            let skip = 0;
            while (true) {
                const query = new URLSearchParams({ skip: String(skip), take: '100' });
                ids.forEach(id => query.append('id', id));
                const page = await this.json('/media/are-referenced?' + query);
                page.items.forEach(row => referenced.add(row.id));
                skip += page.items.length;
                if (!page.items.length || skip >= page.total) break;
            }
        }
        return referenced;
    }
    detail(id) { return this.json('/media/' + id); }
    references(id) { return this.pages(`/media/${id}/referenced-by`); }
    async update(row, changes) {
        this._details.delete(row.id);
        const values = row.values.map(value => {
            const { editorAlias, ...writable } = value;
            return Object.hasOwn(changes, value.alias) ? { ...writable, value: changes[value.alias] } : writable;
        });
        for (const [alias, value] of Object.entries(changes)) {
            if (!values.some(x => x.alias === alias)) values.push({ alias, value, culture: null, segment: null });
        }
        await this.request('/media/' + row.id, { method: 'PUT', body: JSON.stringify({
            values, variants: row.variants.map(({ name, culture, segment }) => ({ name, culture, segment })),
        }) });
    }
    async allowedTypes(parent) {
        return this.pages(parent ? `/media-type/${parent.mediaType.id}/allowed-children` : '/media-type/allowed-at-root',
            parent ? { parentContentKey: parent.id } : {});
    }
    async create(name, type, parentId, temporaryFileId) {
        const id = crypto.randomUUID();
        await this.request('/media', { method: 'POST', body: JSON.stringify({
            id, parent: parentId ? { id: parentId } : null, mediaType: { id: type.id },
            values: temporaryFileId ? [{ alias: 'umbracoFile', value: { temporaryFileId }, culture: null, segment: null }] : [],
            variants: [{ name, culture: null, segment: null }],
        }) });
        return id;
    }
    async temporary(file) {
        const id = crypto.randomUUID(), form = new FormData();
        form.append('Id', id); form.append('File', file);
        await this.request('/temporary-file', { method: 'POST', body: form });
        return id;
    }
    async upload(file, parent, replace = null) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (!extension || extension === file.name.toLowerCase()) throw new Error('Tệp cần có phần mở rộng.');
        if (replace && extension !== extensionOf(replace)) throw new Error('Tệp thay thế cần có cùng định dạng với tệp hiện tại.');
        let type;
        if (!replace) {
            const [matches, allowed] = await Promise.all([
                this.pages('/item/media-type/allowed', { fileExtension: extension }), this.allowedTypes(parent),
            ]);
            type = matches.filter(x => allowed.some(y => y.id === x.id))
                .sort((a, b) => Number(b.matchedFileExtension) - Number(a.matchedFileExtension))[0];
            if (!type) throw new Error(`Định dạng .${extension} không được phép trong thư mục này.`);
        }
        const temporaryFileId = await this.temporary(file);
        try {
            if (replace) {
                const previous = valueOf(replace, 'umbracoFile');
                await this.update(replace, { umbracoFile: { ...(typeof previous === 'object' ? previous : {}), temporaryFileId } });
                return replace.id;
            }
            return await this.create(file.name, type, parent?.id, temporaryFileId);
        } catch (error) {
            await this.request('/temporary-file/' + temporaryFileId, { method: 'DELETE' }).catch(() => {});
            throw error;
        }
    }
}
