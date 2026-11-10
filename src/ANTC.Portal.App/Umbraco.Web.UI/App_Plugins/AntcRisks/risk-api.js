export const value = (node, alias) => node?.values?.[alias];
export const list = input => {
    if (Array.isArray(input)) return input;
    if (input == null || input === '') return [];
    try { const parsed = JSON.parse(input); if (Array.isArray(parsed)) return parsed; } catch { }
    return String(input).split(/[\n,]/).map(x => x.trim()).filter(Boolean);
};
export const refs = input => list(input).map(x => String(typeof x === 'object' ? x.unique || x.id || '' : x).replace('umb://document/', '').replaceAll('-', '').toLowerCase()).filter(Boolean);
export const keyOf = key => String(key).replaceAll('-', '').toLowerCase();
export const editorRefs = input => refs(input).map(k => ({ type: 'document', unique: `${k.slice(0, 8)}-${k.slice(8, 12)}-${k.slice(12, 16)}-${k.slice(16, 20)}-${k.slice(20)}` }));
export const active = node => !('isActive' in (node?.values || {})) || [true, 1, '1', 'true', 'True'].includes(value(node, 'isActive'));
export const label = input => list(input)[0] || '';
const catalogs = new WeakMap();
export class RiskApi {
    constructor(auth) { this.auth = auth; }
    async request(path, body) {
        const token = await this.auth.getLatestToken();
        const response = await fetch('/umbraco/management/api/v1/antc/risks/' + path, {
            method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        if (!response.ok) throw new Error(response.status === 403 ? 'Bạn chưa có quyền xem dữ liệu này.' : `Không tải được dữ liệu (${response.status}).`);
        return response.json();
    }
    catalog(refresh = false, query = '') {
        let entries = catalogs.get(this.auth);
        if (!entries) { entries = new Map(); catalogs.set(this.auth, entries); }
        const cached = entries.get(query);
        if (!refresh && cached && cached.until > Date.now()) return cached.request;
        const request = this.request('catalog' + (query ? '?' + query : '')).catch(error => { entries.delete(query); throw error; });
        entries.set(query, { request, until: Date.now() + 5000 });
        return request;
    }
    derive(id, values) { return this.request(id + '/derive', values); }
}
