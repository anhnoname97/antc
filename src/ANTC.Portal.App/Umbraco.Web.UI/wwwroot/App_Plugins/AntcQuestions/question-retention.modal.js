import { UmbModalBaseElement } from '@umbraco-cms/backoffice/modal';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UUIModalCloseEvent } from '@umbraco-cms/backoffice/external/uui';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { date, confirmAction, confirmDiscard } from './questions.shared.js';

export class AntcQuestionRetentionModal extends UmbModalBaseElement {
    static properties = {
        _policy: { state: true }, _draft: { state: true }, _busy: { state: true },
        _dirty: { state: true }, _error: { state: true }, _message: { state: true },
    };
    constructor() {
        super();
        this._policy = null; this._draft = {}; this._busy = false; this._dirty = false;
        this._error = ''; this._message = '';
        this._beforeUnload = event => {
            if (this._dirty || this._busy) { event.preventDefault(); event.returnValue = ''; }
        };
        this._onModalClose = event => {
            if (this._allowClose || this.modalContext?.isResolved() || !(this._dirty || this._busy)) return;
            event.preventDefault(); event.stopImmediatePropagation(); this._close();
        };
        this._onNavigate = async event => {
            if (event.defaultPrevented || this._allowNavigation || !(this._dirty || this._busy)) return;
            event.preventDefault();
            if (this._busy || !event.detail?.url) return;
            this._confirming ??= confirmDiscard(this).finally(() => { this._confirming = null; });
            if (!await this._confirming) return;
            this._allowNavigation = this._allowClose = true; this._dirty = false;
            history.pushState({}, '', event.detail.url);
        };
    }
    connectedCallback() {
        super.connectedCallback();
        this._sidebar = this.closest('uui-modal-sidebar');
        this._sidebar?.addEventListener(UUIModalCloseEvent, this._onModalClose, true);
        window.addEventListener('beforeunload', this._beforeUnload);
        window.addEventListener('willchangestate', this._onNavigate);
        this._load();
    }
    disconnectedCallback() {
        this._sidebar?.removeEventListener(UUIModalCloseEvent, this._onModalClose, true);
        window.removeEventListener('beforeunload', this._beforeUnload);
        window.removeEventListener('willchangestate', this._onNavigate);
        super.disconnectedCallback();
    }
    _setPolicy(policy) {
        this._policy = policy;
        this._draft = { enabled: policy.enabled, retentionDays: String(policy.retentionDays) };
        this._initial = JSON.stringify(this._draft); this._dirty = false;
    }
    async _load() {
        this._busy = true;
        try { this._setPolicy(await (await this.data.request('/retention')).json()); }
        catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    _edit(key, value) {
        this._draft = { ...this._draft, [key]: value };
        this._dirty = JSON.stringify(this._draft) !== this._initial;
        this._error = ''; this._message = '';
    }
    async _close() {
        if (this._busy) return;
        if (this._dirty) {
            this._confirming ??= confirmDiscard(this).finally(() => { this._confirming = null; });
            if (!await this._confirming) return;
        }
        this._allowClose = true; this.modalContext?.reject();
    }
    async _save() {
        if (this._busy || !this._policy) return;
        const retentionDays = Number(this._draft.retentionDays);
        if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3650) {
            this._error = 'Nhập số ngày nguyên từ 30 đến 3.650.'; return;
        }
        this._busy = true; this._error = ''; this._message = '';
        try {
            const policy = await (await this.data.request('/retention', { method: 'PUT', body: JSON.stringify({
                enabled: this._draft.enabled, retentionDays, reviewVersion: this._policy.reviewVersion,
            }) })).json();
            this._setPolicy(policy);
            this._message = policy.enabled ? 'Đã bật dọn dữ liệu tự động theo thời hạn đã lưu.' : 'Đã lưu cấu hình. Dọn tự động đang tắt.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    async _run() {
        if (this._busy || this._dirty || !this._policy?.eligibleCount) return;
        this._busy = true; this._error = ''; this._message = '';
        try {
            if (!await confirmAction(this, 'Dọn dữ liệu Hỏi – Đáp?',
                `Có ${this._policy.eligibleCount} nội dung đã xử lý hoặc bỏ qua, chưa công bố và quá ${this._policy.retentionDays} ngày. Xóa những nội dung đủ điều kiện tại thời điểm thực hiện? Thao tác không thể khôi phục trong quản trị.`, 'Dọn ngay')) return;
            const policy = await (await this.data.request('/retention/run', {
                method: 'POST', body: JSON.stringify({ reviewVersion: this._policy.reviewVersion }),
            })).json();
            this._setPolicy(policy);
            this._message = `Đã dọn ${policy.lastDeletedCount} nội dung đủ điều kiện.`;
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; }
    }
    render() {
        const policy = this._policy;
        return html`<umb-body-layout headline="Dọn dữ liệu Hỏi – Đáp" .loading=${this._busy}>
            ${this._error ? html`<div class="notice error" role="alert">${this._error}</div>` : nothing}
            ${this._message ? html`<div class="notice success" role="status">${this._message}</div>` : nothing}
            <uui-box headline="Quy tắc dọn dữ liệu">
                <p>Chỉ dọn nội dung <strong>Đã xử lý</strong> hoặc <strong>Bỏ qua</strong>, chưa công bố và đã quá thời hạn tính từ lần xử lý cuối. Nội dung Mới, Đang xử lý hoặc đang công bố được giữ lại.</p>
                <p class="muted">Các câu hỏi và câu trả lời tổng hợp đã công bố vẫn được giữ khi nguồn cũ được dọn.</p>
                ${policy ? html`
                    <umb-property-layout orientation="vertical" label="Dọn tự động" description="Mặc định tắt. Khi bật, hệ thống kiểm tra mỗi giờ và thực hiện tối đa một lần mỗi ngày.">
                        <uui-checkbox slot="editor" id="retention-enabled" label="Bật dọn dữ liệu tự động"
                            .checked=${this._draft.enabled} ?disabled=${this._busy}
                            @change=${event => this._edit('enabled', event.target.checked)}>Bật dọn dữ liệu tự động</uui-checkbox>
                    </umb-property-layout>
                    <umb-property-layout orientation="vertical" label="Thời hạn lưu (ngày)" description="Từ 30 đến 3.650 ngày. Áp dụng cho cả dọn tự động và nút Dọn ngay.">
                        <uui-input slot="editor" id="retention-days" type="number" min="30" max="3650" step="1" label="Thời hạn lưu theo ngày"
                            .value=${this._draft.retentionDays} ?disabled=${this._busy} @input=${event => this._edit('retentionDays', event.target.value)}></uui-input>
                    </umb-property-layout>` : nothing}
            </uui-box>
            ${policy ? html`<uui-box headline="Kiểm tra trước khi dọn">
                <dl><dt>Đang đủ điều kiện</dt><dd><strong>${policy.eligibleCount} nội dung</strong></dd>
                    <dt>Dọn gần nhất</dt><dd>${date(policy.lastRunAt)}</dd>
                    <dt>Số mục đã dọn lần trước</dt><dd>${policy.lastDeletedCount}</dd>
                    <dt>Người lưu cấu hình</dt><dd>${policy.updatedBy || 'Chưa thay đổi cấu hình mặc định'}</dd></dl>
                <p class="muted">Dọn ngay chỉ thực hiện một lần, kể cả khi dọn tự động đang tắt. Lưu thay đổi cấu hình trước khi dọn.</p>
                <uui-button look="outline" color="danger" class="run-cleanup-button" label="Dọn ngay dữ liệu đủ điều kiện"
                    ?disabled=${this._busy || this._dirty || !policy.eligibleCount} @click=${this._run}>Dọn ngay</uui-button>
            </uui-box>` : nothing}
            <span slot="footer-info" class="muted">${this._dirty ? 'Có thay đổi cấu hình chưa lưu' : 'Cấu hình đã được tải'}</span>
            <uui-button slot="actions" look="secondary" label="Đóng cấu hình dọn dữ liệu" ?disabled=${this._busy} @click=${this._close}>Đóng</uui-button>
            <uui-button slot="actions" look="primary" label="Lưu cấu hình dọn dữ liệu" ?disabled=${this._busy || !this._policy || !this._dirty}
                @click=${this._save}>Lưu cấu hình</uui-button>
        </umb-body-layout>`;
    }
    static styles = [UmbTextStyles, css`
        :host { display:block; height:100%; color:var(--uui-color-text); }
        uui-box { margin-bottom:var(--uui-size-layout-1); }
        p { margin:0 0 var(--uui-size-space-4); line-height:1.7; }
        .muted { color:var(--uui-color-text-alt); font-size:var(--uui-type-small-size); line-height:1.6; }
        umb-property-layout { padding:var(--uui-size-space-5) 0; }
        uui-input { width:100%; }
        dl { display:grid; grid-template-columns:1fr 1fr; gap:var(--uui-size-space-4); margin:0 0 var(--uui-size-layout-1); }
        dt, dd { margin:0; } dt { color:var(--uui-color-text-alt); }
        .notice { padding:var(--uui-size-space-4); margin-bottom:var(--uui-size-layout-1); border:1px solid var(--uui-color-border); border-radius:var(--uui-border-radius); }
        .error { color:var(--uui-color-danger); border-color:var(--uui-color-danger); }
        .success { color:var(--uui-color-positive); border-color:var(--uui-color-positive); }
    `];
}
customElements.define('antc-question-retention-modal', AntcQuestionRetentionModal);
export { AntcQuestionRetentionModal as element };
export default AntcQuestionRetentionModal;
