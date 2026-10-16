const rows = document.querySelector('#question-rows');
const message = document.querySelector('#admin-message');
const state = document.querySelector('#refresh-state');
let loading = false;
let saving = false;

function showMessage(text, error = false) {
    message.textContent = text;
    message.className = error ? 'admin-message error' : 'admin-message success';
    message.setAttribute('role', error ? 'alert' : 'status');
}
function login() {
    location.assign('/umbraco/login?ReturnUrl=' + encodeURIComponent(location.pathname + location.search));
}
function isDirty() { return !!rows.querySelector('form[data-dirty="true"]'); }
rows.addEventListener('input', event => {
    const form = event.target.form;
    if (form?.classList.contains('review-form')) { form.dataset.dirty = 'true'; state.textContent = 'Tạm dừng cập nhật trong khi bạn chỉnh sửa'; }
});
rows.addEventListener('change', event => {
    const form = event.target.form;
    if (form?.classList.contains('review-form')) { form.dataset.dirty = 'true'; state.textContent = 'Tạm dừng cập nhật trong khi bạn chỉnh sửa'; }
});

async function refresh(force = false) {
    if (loading || saving || isDirty() || document.hidden || (!force && rows.contains(document.activeElement))) return;
    loading = true;
    try {
        const url = new URL(location.href); url.searchParams.set('handler', 'Rows');
        const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, cache: 'no-store' });
        if (response.status === 401) { login(); return; }
        if (!response.ok) throw new Error(response.status === 403 ? 'Tài khoản không có quyền quản trị.' : 'Chưa cập nhật được danh sách.');
        const html = await response.text();
        // Partial cùng nguồn, được Razor mã hóa từng giá trị người gửi; không dựng HTML từ chuỗi JSON đầu vào.
        if (isDirty() || saving || (!force && rows.contains(document.activeElement))) return;
        rows.innerHTML = html;
        document.querySelector('#question-total').textContent = response.headers.get('X-Question-Total');
        const pages = Number(response.headers.get('X-Question-Pages'));
        const page = Number(document.querySelector('#current-page').textContent);
        document.querySelector('#total-pages').textContent = pages;
        const next = document.querySelector('#next-page');
        next.classList.toggle('disabled', page >= pages); next.setAttribute('aria-disabled', String(page >= pages));
        state.textContent = 'Tự cập nhật mỗi 5 giây khi bạn không chỉnh sửa';
    } catch (error) { state.textContent = error.message; }
    finally { loading = false; }
}

rows.addEventListener('submit', async event => {
    const form = event.target;
    if (!form.classList.contains('review-form')) return;
    event.preventDefault();
    if (saving) return;
    saving = true;
    const button = form.querySelector('button'); button.disabled = true; button.textContent = 'Đang lưu…';
    try {
        const response = await fetch(form.action, { method: 'POST', body: new FormData(form),
            headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        if (response.status === 401) { login(); return; }
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Không lưu được. Hãy tải lại trang và thử lại.');
        form.dataset.dirty = 'false';
        const handled = form.closest('tr').querySelector('.handled-cell');
        handled.textContent = body.handledBy + ' · ' + new Date(body.handledAt).toLocaleString('vi-VN');
        showMessage('Đã lưu trạng thái và ghi chú.');
    } catch (error) { showMessage(error.message, true); }
    finally { saving = false; button.disabled = false; button.textContent = 'Lưu'; }
    await refresh(true);
});
setInterval(() => refresh(), 5000);
window.addEventListener('beforeunload', event => { if (isDirty()) { event.preventDefault(); event.returnValue = ''; } });
