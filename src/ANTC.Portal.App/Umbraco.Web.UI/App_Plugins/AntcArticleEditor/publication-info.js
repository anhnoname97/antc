import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT, UmbDocumentUrlRepository, UmbDocumentAuditLogRepository } from '@umbraco-cms/backoffice/document';
import { UmbUserItemRepository } from '@umbraco-cms/backoffice/user';
import { isPublished, invariantVariant, invariantValue, publicationLabel, resolvedArticleUrl, publicationDate, activityLabel } from './publication-model.js?v=0.6.0';
import { ANTC_ARTICLE_ACCESS_CONTEXT } from './property-access-context.js?v=0.9.0';

class AntcPublicationInfo extends UmbLitElement {
  static properties = { _document: { state: true }, _saved: { state: true }, _isNew: { state: true }, _dirty: { state: true },
    _url: { state: true }, _loading: { state: true }, _urlError: { state: true }, _activity: { state: true },
    _actor: { state: true }, _auditError: { state: true }, _copyMessage: { state: true }, _access: { state: true } };
  static styles = css`
    :host { display: block; font: inherit; color: var(--antc-text, #1a2033); }
    * { box-sizing: border-box; }
    .status { display: inline-flex; border-radius: 99px; padding: 4px 10px; background: var(--antc-warning-bg); color: var(--antc-warning-text); font-size: 12px; font-weight: 600; }
    .status[data-published='true'] { background: var(--antc-success-bg); color: var(--antc-success-text); }
    .hint { font-size: 12px; color: var(--antc-muted); line-height: 1.5; margin: 8px 0 0; }
    .dirty { color: var(--antc-warning-text); }
    dl { margin: 12px 0 0; font-size: 13px; line-height: 1.5; }
    dt { margin: 12px 0 2px; color: var(--antc-muted); font-size: 12px; }
    dd { margin: 0; overflow-wrap: anywhere; }
    .url { display: block; overflow-wrap: anywhere; color: var(--antc-tint-text); line-height: 1.5; font-size: 13px; margin-top: 8px; }
    button { background: transparent; border: 0; padding: 6px 0; color: var(--antc-tint-text); font: inherit; font-size: 12px; text-decoration: underline; cursor: pointer; min-height: 32px; }
    button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--antc-primary); outline-offset: 3px; }
    .settings { margin-top: 12px; border-top: 1px solid var(--antc-border); padding-top: 10px; }
    .settings p { margin: 4px 0; font-size: 12px; line-height: 1.5; }
    details { margin-top: 12px; border-top: 1px solid var(--antc-border); padding-top: 12px; }
    summary { cursor: pointer; color: var(--antc-tint-text); font-size: 12px; min-height: 28px; }
    .history { margin-top: 12px; border-top: 1px solid var(--antc-border); padding-top: 12px; }
    .history h4 { margin: 0; font-size: 12px; font-weight: 600; }
    .feedback { margin: 0; font-size: 12px; color: var(--antc-tint-text); line-height: 1.5; }
  `;
  #urls = new UmbDocumentUrlRepository(this);
  #audit = new UmbDocumentAuditLogRepository(this);
  #users = new UmbUserItemRepository(this);
  #stamp;
  #generation = 0;

  constructor() {
    super();
    this.consumeContext(ANTC_ARTICLE_ACCESS_CONTEXT, context => {
      this.observe(context?.state, state => { this._access = state; }, 'article-publication-access');
    });
    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, workspace => {
      this.observe(workspace?.data, document => {
        this._document = document;
        this._dirty = Boolean(workspace?.getChangedVariants().length);
        this.#refresh();
      }, 'antc-publication-data');
      this.observe(workspace?.persistedData, saved => {
        this._saved = saved;
        this._dirty = Boolean(workspace?.getChangedVariants().length);
        this.#refresh();
      }, 'antc-publication-saved');
      this.observe(workspace?.isNew, isNew => { this._isNew = isNew; this.#refresh(); }, 'antc-publication-new');
    });
  }

  #variant() { return this._saved?.unique === this._document?.unique ? invariantVariant(this._saved) : undefined; }

  async #refresh(force = false) {
    const key = this._document?.unique;
    const variant = this.#variant();
    if (!key || this._isNew === undefined) return;
    const stamp = JSON.stringify([key, this._isNew, variant?.updateDate, variant?.state,
      variant?.scheduledPublishDate, variant?.scheduledUnpublishDate]);
    if (!force && stamp === this.#stamp) return;
    this.#stamp = stamp;
    const generation = ++this.#generation;
    this._url = undefined;
    this._urlError = false;
    this._activity = undefined;
    this._actor = undefined;
    this._auditError = false;
    this._copyMessage = '';
    this._loading = false;
    if (this._isNew || !variant) return;
    this._loading = true;
    const published = isPublished(variant);
    const results = await Promise.allSettled([
      published ? this.#urls.requestUrls([key]) : Promise.resolve({ data: [] }),
      this.#audit.requestAuditLog({ unique: key, skip: 0, take: 1, orderDirection: 'Descending' }),
    ]);
    if (generation !== this.#generation) return;
    const [urls, audit] = results;
    this._urlError = urls.status === 'rejected' || Boolean(urls.value?.error);
    if (urls.status === 'fulfilled') {
      this._url = resolvedArticleUrl(urls.value.data, key, window.location.origin);
    }
    this._auditError = audit.status === 'rejected' || Boolean(audit.value?.error);
    if (audit.status === 'fulfilled') this._activity = audit.value.data?.items?.[0];
    if (this._activity?.user?.unique) {
      try {
        const { data } = await this.#users.requestItems([this._activity.user.unique]);
        if (generation !== this.#generation) return;
        this._actor = data?.[0]?.name;
      } catch { /* The native repository reports the read error. Never infer an actor. */ }
    }
    if (generation === this.#generation) this._loading = false;
  }

  async #copyUrl() {
    if (!this._url) return;
    const url = this._url;
    try {
      await navigator.clipboard.writeText(url);
      if (this._url === url) this._copyMessage = 'Đã sao chép đường dẫn.';
    } catch {
      if (this._url === url) this._copyMessage = 'Không thể tự sao chép. Hãy chọn đường dẫn phía trên để sao chép thủ công.';
    }
  }

  #date(label, value) {
    const date = publicationDate(value);
    return date ? html`<div><dt>${label}</dt><dd><time datetime=${value}>${date}</time> (giờ Việt Nam)</dd></div>` : nothing;
  }

  render() {
    const variant = this.#variant();
    const published = !this._isNew && isPublished(variant);
    const url = published ? this._url : null;
    return html`<span class="status" data-published=${published}>${publicationLabel(variant, this._isNew)}</span>
      <p class=${this._dirty ? 'hint dirty' : 'hint'} role="status">${this._dirty ? 'Có thay đổi chưa lưu.' : this._isNew ? 'Lưu nháp để tạo bài viết.' : variant ? 'Đang xem dữ liệu đã lưu.' : 'Đang tải dữ liệu…'}</p>
      <details class="publication-details"><summary>Chi tiết xuất bản</summary>
      ${url ? html`<a class="url" href=${url} target="_blank" rel="noopener noreferrer" aria-label="Mở bài đã xuất bản (tab mới)" title=${url}>${new URL(url).pathname}</a>
        <button type="button" class="copy-url" @click=${this.#copyUrl}>Sao chép đường dẫn</button>
        <p class="feedback" role="status">${this._copyMessage}</p>
        ${this._dirty || variant?.state === 'PublishedPendingChanges' ? html`<p class="hint">Đường dẫn mở bản đã xuất bản.</p>` : nothing}`
      : html`<p class="hint url-message">${this._loading && published ? 'Đang đọc đường dẫn…' : this._urlError ? 'Chưa đọc được đường dẫn công khai.' : published ? 'Chưa có đường dẫn công khai sử dụng được.' : 'Bài chưa công khai; đường dẫn xuất hiện sau khi xuất bản.'}</p>`}
      ${variant?.scheduledPublishDate ? html`<dl class="schedule">${this.#date('Hẹn xuất bản', variant.scheduledPublishDate)}</dl>` : nothing}
      ${variant?.scheduledUnpublishDate ? html`<dl class="schedule">${this.#date('Hẹn hủy xuất bản', variant.scheduledUnpublishDate)}</dl>` : nothing}
      <div class="settings" aria-label="Thiết lập hiển thị đang soạn">
        <p>Trang chủ: <strong>${this._access?.readable.showOnHome ? invariantValue(this._document, 'showOnHome') ? 'Bật' : 'Tắt' : 'Không có quyền xem'}</strong></p>
        <p>Tìm kiếm: <strong>${this._access?.readable.hideFromSearch ? invariantValue(this._document, 'hideFromSearch') ? 'Ẩn' : 'Cho phép' : 'Không có quyền xem'}</strong></p>
        <p class="hint">Thiết lập áp dụng sau khi xuất bản.</p>
      </div>
      ${!this._isNew && variant ? html`<div class="history"><h4>Lần lưu và người thao tác</h4><dl>
        ${this.#date('Lưu gần nhất', variant.updateDate)}
        ${this.#date('Xuất bản gần nhất', variant.publishDate)}
        <div><dt>Người thao tác gần nhất</dt><dd>${this._loading ? 'Đang tải…' : this._actor || 'Chưa đọc được tên người thao tác.'}</dd></div>
        ${this._activity ? html`<div><dt>Hoạt động gần nhất</dt><dd>${activityLabel(this._activity.logType)}</dd></div>${this.#date('Thời điểm thao tác', this._activity.timestamp)}` : nothing}
      </dl>${this._auditError ? html`<p class="hint">Chưa đọc được lịch sử thao tác.</p>` : nothing}</div>` : nothing}
      ${this._urlError || this._auditError ? html`<button type="button" @click=${() => this.#refresh(true)}>Thử đọc lại thông tin</button>` : nothing}
      </details>`;
  }

  disconnectedCallback() {
    ++this.#generation;
    this.#stamp = undefined;
    super.disconnectedCallback();
  }
}
customElements.define('antc-article-publication-info', AntcPublicationInfo);
export default AntcPublicationInfo;
