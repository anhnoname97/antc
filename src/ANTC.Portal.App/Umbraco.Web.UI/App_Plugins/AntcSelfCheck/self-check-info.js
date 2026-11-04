import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT, UmbDocumentUrlRepository } from '@umbraco-cms/backoffice/document';

class AntcSelfCheckInfo extends UmbLitElement {
  static properties = { value: {}, _mode: { state: true }, _target: { state: true }, _url: { state: true }, _loading: { state: true }, _hasPdf: { state: true } };
  static styles = css`
    :host { display: block; line-height: 1.6; }
    p { margin: 0 0 8px; }
    a { color: var(--uui-color-interactive); }
    code { overflow-wrap: anywhere; }
  `;
  #urls = new UmbDocumentUrlRepository(this);
  #key;
  #generation = 0;

  set config(config) {
    this._mode = config?.getValueByAlias('mode');
    this._target = config?.getValueByAlias('target');
    if (this._mode === 'url' && this.#key) this.#loadUrl(this.#key);
  }

  constructor() {
    super();
    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, workspace => {
      this.observe(workspace?.data, document => {
        const pdf = document?.values?.find(item => item.alias === 'pdf')?.value;
        this._hasPdf = Array.isArray(pdf) ? pdf.length > 0 : Boolean(pdf);
      }, 'checklist-pdf-state');
      this.observe(workspace?.persistedData, document => {
        this.#key = document?.unique;
        if (this._mode === 'url') this.#loadUrl(this.#key);
      }, 'self-check-url');
    });
  }

  async #loadUrl(key) {
    const generation = ++this.#generation;
    this._url = undefined;
    this._loading = Boolean(key);
    try {
      if (!key) return;
      const { data } = await this.#urls.requestUrls([key]);
      if (generation !== this.#generation) return;
      this._url = data?.flatMap(item => item.urls ?? []).find(item => item.url && !item.isDraft)?.url;
    } catch {
      if (generation === this.#generation) this._url = undefined;
    } finally {
      if (generation === this.#generation) this._loading = false;
    }
  }

  render() {
    if (this._mode === 'url') return html`<code>${this._loading ? 'Đang lấy đường dẫn…' : this._url || 'Chưa có đường dẫn công khai. Lưu và xuất bản trang để kiểm tra.'}</code>`;
    if (this._mode === 'tool-rules') return html`<p>Câu “Phải dừng” trả lời Có thì kết luận ngay mức Rất cao. Còn lại: câu “Phải dừng” chưa biết; câu “Tạm hoãn” Có hoặc chưa biết; câu “Cần kiểm tra” Không hoặc chưa biết đều thành lý do. Có lý do thì mức Cao, không có thì mức Cần thận trọng (QĐ-051).</p>`;
    if (this._mode === 'checklist-pdf') return html`<p>${this._hasPdf ? 'Tải tệp đã chọn.' : 'Chưa có tệp: nút tải mở bản in A4.'}</p>`;
    // The stored value is a content key, never an arbitrary HTML fragment or URL.
    const key = String(this._target ?? this.value ?? '').replace(/^umb:\/\/document\//, '');
    const validKey = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
    return html`
      <p>Theo thứ tự ở Quản lý nội dung › Danh sách kiểm tra. Sắp xếp các mục tại kho đó để đổi thứ tự hiển thị.</p>
      ${validKey ? html`<a href=${`/umbraco/section/content/workspace/document/edit/${key}`}>Mở Danh sách kiểm tra</a>`
        : html`<span>Tạo kho Danh sách kiểm tra trong Quản lý nội dung để quản lý các mục.</span>`}
    `;
  }
}

customElements.define('antc-self-check-info', AntcSelfCheckInfo);
export default AntcSelfCheckInfo;
