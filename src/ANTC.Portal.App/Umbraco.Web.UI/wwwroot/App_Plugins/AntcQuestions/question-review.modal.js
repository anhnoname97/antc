import { UmbModalBaseElement } from '@umbraco-cms/backoffice/modal';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UUIModalCloseEvent } from '@umbraco-cms/backoffice/external/uui';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { statuses, types, date, confirmDiscard } from './questions.shared.js';

export class AntcQuestionReviewModal extends UmbModalBaseElement {
    static properties = {
        _row: { state: true }, _draft: { state: true }, _dirty: { state: true },
        _busy: { state: true }, _error: { state: true }, _message: { state: true },
    };
    constructor() {
        super();
        this._row = null;
        this._draft = {};
        this._dirty = false;
        this._busy = false;
        this._error = '';
        this._message = '';
        this._beforeUnload = event => {
            if (this._dirty || this._busy) { event.preventDefault(); event.returnValue = ''; }
        };
        this._onModalClose = event => {
            if (this._allowClose || this.modalContext?.isResolved() || !(this._dirty || this._busy)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            this._close();
        };
        this._onNavigate = async event => {
            if (event.defaultPrevented || this._allowNavigation || !(this._dirty || this._busy)) return;
            event.preventDefault();
            if (this._busy || !event.detail?.url || !await this._canClose()) return;
            this._allowNavigation = this._allowClose = true;
            this._dirty = false;
            history.pushState({}, '', event.detail.url);
        };
    }
    connectedCallback() {
        super.connectedCallback();
        this._row = this.data.row;
        this._resetDraft();
        this._sidebar = this.closest('uui-modal-sidebar');
        // Intercept the native close event before Escape/backdrop can discard an unsaved answer.
        this._sidebar?.addEventListener(UUIModalCloseEvent, this._onModalClose, true);
        window.addEventListener('beforeunload', this._beforeUnload);
        window.addEventListener('willchangestate', this._onNavigate);
    }
    disconnectedCallback() {
        this._sidebar?.removeEventListener(UUIModalCloseEvent, this._onModalClose, true);
        window.removeEventListener('beforeunload', this._beforeUnload);
        window.removeEventListener('willchangestate', this._onNavigate);
        super.disconnectedCallback();
    }
    _resetDraft() {
        this._draft = { status: this._row.status, answer: this._row.answer || '', adminNote: this._row.adminNote || '',
            guidanceLabel: this._row.guidanceLabel || '', guidanceUrl: this._row.guidanceUrl || '' };
        this._dirty = false;
    }
    _edit(key, value) {
        this._draft = { ...this._draft, [key]: value };
        this._dirty = this._draft.status !== this._row.status || this._draft.answer !== (this._row.answer || '')
            || this._draft.adminNote !== (this._row.adminNote || '')
            || this._draft.guidanceLabel !== (this._row.guidanceLabel || '') || this._draft.guidanceUrl !== (this._row.guidanceUrl || '');
        this._message = '';
    }
    async _canClose() {
        if (this._busy) return false;
        if (!this._dirty) return true;
        // Repeated Escape/clicks share one Umbraco confirmation dialog.
        this._confirming ??= confirmDiscard(this).finally(() => { this._confirming = null; });
        return await this._confirming;
    }
    async _close() {
        if (!await this._canClose() || !this.isConnected) return;
        this._allowClose = true;
        this.modalContext?.reject();
    }
    async _act(action) {
        if (!this._row || this._busy) return;
        if (action !== 'unpublish' && (this._draft.answer.length > 10000 || this._draft.adminNote.length > 1000)) {
            this._error = 'Câu trả lời tối đa 10.000 ký tự; ghi chú nội bộ tối đa 1.000 ký tự.';
            return;
        }
        this._busy = true; this._action = action; this._error = ''; this._message = '';
        try {
            const suffix = action === 'save' ? '' : '/' + action;
            const body = action === 'unpublish' ? { reviewVersion: this._row.reviewVersion }
                : { ...this._draft, reviewVersion: this._row.reviewVersion };
            const row = await (await this.data.request('/' + this._row.id + suffix, {
                method: action === 'save' ? 'PUT' : 'POST', body: JSON.stringify(body),
            })).json();
            this._row = row;
            if (action !== 'unpublish') this._resetDraft();
            this.data.onUpdated(row);
            this._message = action === 'approve' ? 'Đã duyệt và công bố câu hỏi cùng câu trả lời.'
                : action === 'unpublish' ? 'Đã gỡ công bố. Nội dung không còn hiển thị công khai.'
                    : 'Đã lưu xử lý. Câu trả lời chỉ hiển thị trên website sau khi được duyệt và công bố.';
        } catch (error) { this._error = error.message; }
        finally { this._busy = false; this._action = null; }
    }
    render() {
        const row = this._row;
        if (!row) return nothing;
        return html`
            <umb-body-layout headline=${`Xử lý nội dung #${row.id}`} .loading=${this._busy}>
                <div slot="header" class="header-meta"><uui-tag>${types[row.type]}</uui-tag>
                    <uui-tag color=${row.isPublished ? 'positive' : 'default'}>${row.isPublished ? 'Đã công bố' : 'Chưa công bố'}</uui-tag>
                </div>
                <uui-button slot="action-menu" compact look="secondary" label="Đóng khung xử lý"
                    ?disabled=${this._busy} @click=${this._close}><umb-icon name="icon-delete"></umb-icon></uui-button>
                ${this._error ? html`<div class="notice error" role="alert"><umb-icon name="icon-alert"></umb-icon><span>${this._error}</span></div>` : nothing}
                ${this._message ? html`<div class="notice success" role="status"><umb-icon name="icon-check"></umb-icon><span>${this._message}</span></div>` : nothing}
                <div class="review-grid">
                    <div class="submission-panel">
                        <uui-box headline="Nội dung người dùng gửi">
                            <p class="muted intro">Nội dung gốc, chỉ xem.</p>
                            <pre class="original">${row.content}</pre>
                        </uui-box>
                        <uui-box headline="Thông tin tiếp nhận">
                            <dl><dt>Thời điểm gửi</dt><dd>${date(row.createdAt)}</dd>
                                <dt>Muốn trả lời riêng</dt><dd>${row.wantReply ? 'Có' : 'Không'}</dd>
                                <dt>Liên hệ nội bộ</dt><dd>${row.contact || 'Không cung cấp'}</dd>
                                <dt>Người xử lý</dt><dd>${row.handledBy || 'Chưa có'}</dd>
                                <dt>Xử lý gần nhất</dt><dd>${date(row.handledAt)}</dd>
                                <dt>Người duyệt gần nhất</dt><dd>${row.approvedBy || 'Chưa có'}</dd>
                                <dt>Thời điểm duyệt</dt><dd>${date(row.approvedAt)}</dd></dl>
                            <p class="muted">Thông tin liên hệ và ghi chú chỉ hiển thị trong quản trị. Hệ thống không tự gửi email.</p>
                        </uui-box>
                    </div>
                    <uui-box class="editor" headline="Trả lời và kiểm duyệt">
                        ${row.wantReply ? html`<div class="private-reply"><umb-icon name="icon-lock"></umb-icon>
                            <span>Người gửi muốn nhận phản hồi riêng. Kiểm tra thông tin cá nhân trong câu hỏi trước khi công bố.</span></div>` : nothing}
                        <umb-property-layout orientation="vertical" label="Câu trả lời" description="Lưu để tiếp tục xử lý. Duyệt và công bố để hiển thị câu hỏi cùng câu trả lời trên portal.">
                            <uui-textarea slot="editor" id="answer" label="Câu trả lời" rows="10" maxlength="10000"
                                .value=${this._draft.answer} ?disabled=${this._busy}
                                @input=${event => this._edit('answer', event.target.value)} placeholder="Nhập câu trả lời cho người dùng"></uui-textarea>
                            <span slot="description" class="counter">${this._draft.answer.length.toLocaleString('vi-VN')} / 10.000 ký tự</span>
                        </umb-property-layout>
                        ${row.type === 'cau-hoi' ? html`
                        <umb-property-layout orientation="vertical" label="Nhãn liên kết hướng dẫn" description="Bắt buộc khi duyệt công bố. Ví dụ: Xem việc cần làm khi có tiền lạ chuyển vào.">
                            <uui-input slot="editor" label="Nhãn liên kết hướng dẫn" maxlength="200" .value=${this._draft.guidanceLabel}
                                ?disabled=${this._busy} @input=${event => this._edit('guidanceLabel', event.target.value)}></uui-input>
                        </umb-property-layout>
                        <umb-property-layout orientation="vertical" label="Đường dẫn nội dung đã thẩm định" description="Dùng đường dẫn bắt đầu bằng / hoặc địa chỉ http(s)://. Liên kết chỉ thay đổi công khai sau khi duyệt lại.">
                            <uui-input slot="editor" label="Đường dẫn hướng dẫn" maxlength="2048" .value=${this._draft.guidanceUrl}
                                ?disabled=${this._busy} @input=${event => this._edit('guidanceUrl', event.target.value)}></uui-input>
                        </umb-property-layout>` : nothing}
                        <umb-property-layout orientation="vertical" label="Trạng thái xử lý" description="Trạng thái xử lý nội bộ không tự công bố câu trả lời.">
                            <uui-select slot="editor" id="review-status" label="Trạng thái xử lý" ?disabled=${this._busy}
                                .options=${Object.entries(statuses).map(([value, name]) => ({ value, name, selected: value === this._draft.status }))}
                                @change=${event => this._edit('status', event.target.value)}></uui-select>
                        </umb-property-layout>
                        <umb-property-layout orientation="vertical" label="Ghi chú nội bộ" description="Dành cho ban biên tập; không hiển thị ngoài website.">
                            <uui-textarea slot="editor" id="admin-note" label="Ghi chú nội bộ" rows="3" maxlength="1000"
                                .value=${this._draft.adminNote} ?disabled=${this._busy}
                                @input=${event => this._edit('adminNote', event.target.value)}></uui-textarea>
                        </umb-property-layout>
                        ${row.isPublished && (this._draft.answer !== row.publishedAnswer || this._draft.guidanceLabel !== (row.publishedGuidanceLabel || '') || this._draft.guidanceUrl !== (row.publishedGuidanceUrl || '')) ? html`<div class="notice">
                            Portal vẫn hiển thị bản đã duyệt trước đó. Duyệt lại để cập nhật câu trả lời công khai.</div>` : nothing}
                    </uui-box>
                </div>
                <span slot="footer-info" class="save-state" role="status">${this._dirty ? 'Có thay đổi chưa lưu' : 'Không có thay đổi chưa lưu'}</span>
                <uui-button slot="actions" label="Đóng xử lý" look="secondary" ?disabled=${this._busy} @click=${this._close}>Đóng</uui-button>
                ${row.isPublished ? html`<uui-button slot="actions" label="Gỡ công bố" look="outline" color="danger" data-action="unpublish"
                    .state=${this._action === 'unpublish' ? 'waiting' : undefined} ?disabled=${this._busy} @click=${() => this._act('unpublish')}>Gỡ công bố</uui-button>` : nothing}
                <uui-button slot="actions" label="Lưu xử lý" look="outline" data-action="save" .state=${this._action === 'save' ? 'waiting' : undefined}
                    ?disabled=${this._busy} @click=${() => this._act('save')}>Lưu xử lý</uui-button>
                ${row.type === 'cau-hoi' ? html`<uui-button slot="actions" label="Duyệt và công bố" look="primary" color="positive" data-action="approve"
                    .state=${this._action === 'approve' ? 'waiting' : undefined} ?disabled=${this._busy || this._draft.answer.trim().length < 10 || !this._draft.guidanceLabel.trim() || !this._draft.guidanceUrl.trim()}
                    @click=${() => this._act('approve')}>Duyệt và công bố</uui-button>` : nothing}
            </umb-body-layout>
        `;
    }
    static styles = [UmbTextStyles, css`
        :host { display:block; height:100%; min-width:0; }
        .header-meta { display:flex; align-items:center; gap:var(--uui-size-space-3); flex-wrap:wrap; }
        [slot=action-menu] { margin-right:var(--uui-size-layout-1); }
        .review-grid { display:grid; grid-template-columns:minmax(0,0.95fr) minmax(0,1.05fr); gap:var(--uui-size-layout-1); align-items:start; }
        .submission-panel { display:grid; gap:var(--uui-size-layout-1); min-width:0; }
        uui-box { min-width:0; }
        .muted, .counter, .save-state { color:var(--uui-color-text-alt); font-size:var(--uui-type-small-size); line-height:1.6; }
        .intro { margin:0 0 var(--uui-size-space-4); }
        .original { margin:0; white-space:pre-wrap; overflow-wrap:anywhere; font:inherit; line-height:1.7; }
        dl { display:grid; grid-template-columns:minmax(130px,0.8fr) minmax(0,1.2fr); gap:0 var(--uui-size-space-4); margin:0; }
        dt, dd { margin:0; padding:var(--uui-size-space-4) 0; border-bottom:1px solid var(--uui-color-border); overflow-wrap:anywhere; }
        dt { color:var(--uui-color-text-alt); }
        dt:first-child, dt:first-child + dd { padding-top:0; }
        .submission-panel uui-box > .muted:last-child { margin-bottom:0; }
        umb-property-layout { padding:var(--uui-size-space-5) 0; }
        umb-property-layout:first-of-type { padding-top:0; }
        uui-textarea, uui-select, uui-input { width:100%; }
        #answer { --uui-textarea-min-height:240px; }
        #admin-note { --uui-textarea-min-height:96px; }
        .counter { display:block; margin-top:var(--uui-size-space-2); }
        .notice, .private-reply { display:flex; align-items:flex-start; gap:var(--uui-size-space-3); padding:var(--uui-size-space-4); margin-bottom:var(--uui-size-layout-1); border:1px solid var(--uui-color-border); border-radius:var(--uui-border-radius); background:var(--uui-color-surface); line-height:1.6; }
        .notice umb-icon, .private-reply umb-icon { flex-shrink:0; margin-top:3px; }
        .private-reply { background:var(--uui-color-surface-alt); font-size:var(--uui-type-small-size); }
        .error { border-color:var(--uui-color-danger); color:var(--uui-color-danger); }
        .success { border-color:var(--uui-color-positive); color:var(--uui-color-positive); }
        .save-state { padding-left:var(--uui-size-layout-1); }
        @media(max-width:1000px) { .review-grid { grid-template-columns:1fr; } .header-meta { gap:var(--uui-size-space-2); } }
    `];
}
customElements.define('antc-question-review-modal', AntcQuestionReviewModal);
export { AntcQuestionReviewModal as element };
export default AntcQuestionReviewModal;
