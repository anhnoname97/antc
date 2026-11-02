import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { ANTC_SEO_PREVIEW_CONTEXT } from './seo-preview-context.js?v=0.9.0';

class AntcSeoPreview extends UmbLitElement {
  static properties = { mode: { type: String }, _preview: { state: true }, _failedImage: { state: true } };
  static styles = css`
    :host { display: block; min-width: 0; font: inherit; color: var(--antc-text, #1a2033); }
    * { box-sizing: border-box; }
    h4 { margin: 0; font-size: 14px; line-height: 1.5; }
    p { margin: 8px 0 0; }
    .hint { color: var(--antc-muted, #5b6478); font-size: 12px; line-height: 1.5; }
    .source { margin-bottom: 12px; }
    .search { padding: 18px; border: 1px solid var(--antc-border, #e3e7f0); border-radius: 12px; background: #fff; }
    .site { font-size: 12px; overflow-wrap: anywhere; color: var(--antc-muted, #5b6478); }
    .search-title { font-size: 19px; line-height: 1.4; color: #254a9a; margin: 8px 0; }
    .clamp { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow-wrap: anywhere; }
    .description { font-size: 13px; line-height: 1.6; -webkit-line-clamp: 3; }
    .warning { border-left: 3px solid #ad6800; padding: 8px 12px; background: #fff5e3; color: #80500a; margin-bottom: 12px; font-size: 13px; }
    .share { overflow: hidden; border-radius: 12px; border: 1px solid var(--antc-border, #e3e7f0); background: #f7f9fc; }
    .image { width: 100%; aspect-ratio: 1.91; object-fit: cover; display: block; background: #edf2f7; }
    .placeholder { aspect-ratio: 1.91; display: grid; place-items: center; background: #edf2f7; color: var(--antc-muted, #5b6478); font-size: 13px; text-align: center; padding: 16px; }
    .share-text { padding: 12px; }
    .share-title { font-size: 14px; font-weight: 600; line-height: 1.5; margin: 4px 0; }
    .share-description { font-size: 12px; color: var(--antc-muted, #5b6478); line-height: 1.5; }
    .empty { color: var(--antc-muted, #5b6478); font-style: italic; }
  `;
  constructor() {
    super();
    this.mode = 'search';
    this.consumeContext(ANTC_SEO_PREVIEW_CONTEXT, context => {
      this.observe(context?.state, value => {
        if (value?.image?.url !== this._preview?.image?.url) this._failedImage = undefined;
        this._preview = value;
      }, 'antc-seo-preview');
    });
  }
  render() {
    const preview = this._preview;
    if (!preview) return html`<p class="hint" role="status">Đang tải bản xem trước…</p>`;
    if (this.mode === 'share') {
      const image = preview.image?.url;
      return html`<div class="share" aria-label="Mô phỏng thẻ chia sẻ">
        ${image && this._failedImage !== image
          ? html`<img class="image" src=${image} alt="" @error=${() => { this._failedImage = image; }}>`
          : html`<div class="placeholder">${preview.pending ? 'Đang tải ảnh…' : image ? 'Không tải được ảnh' : 'Chưa có ảnh chia sẻ'}</div>`}
        <div class="share-text"><div class="site">${preview.siteName}</div>
          <p class="share-title clamp ${preview.title ? '' : 'empty'}">${preview.title || 'Chưa có tiêu đề'}</p>
          <p class="share-description clamp">${preview.description || 'Chưa có mô tả'}</p>
        </div></div>
        <p class="hint image-source">${preview.pending ? 'Đang kiểm tra ảnh…' : image && this._failedImage === image ? 'Không tải được ảnh. Kiểm tra lại tệp trong Phương tiện.' : preview.image ? `Đang dùng: ${preview.image.source.toLocaleLowerCase('vi-VN')}.` : 'Chọn ảnh trong phần SEO hoặc Ảnh đại diện.'}</p>
        ${preview.restricted ? html`<p class="hint">Chỉ mô phỏng các trường bạn được xem. Bản xuất bản có thể dùng thiết lập khác.</p>` : nothing}`;
    }
    return html`<div aria-label="Xem trước kết quả tìm kiếm">
      <h4>Xem trước kết quả tìm kiếm</h4>
      <p class="hint source">${preview.titleSource} ${preview.descriptionSource}</p>
      ${preview.hidden ? html`<p class="warning" role="status">Bài đang bật ẩn khỏi tìm kiếm. Khi xuất bản, website sẽ gửi chỉ dẫn không lập chỉ mục.</p>` : nothing}
      <div class="search"><div class="site">${preview.siteName}</div>
        <p class="search-title clamp">${preview.title ? preview.searchTitle : 'Chưa có tiêu đề'}</p>
        <p class="description clamp">${preview.description || 'Chưa có mô tả. Hãy thêm tóm tắt hoặc mô tả SEO.'}</p>
      </div>
      <p class="hint counts">${preview.titleLength} ký tự tiêu đề · ${preview.descriptionLength} ký tự mô tả</p>
      <p class="hint">Bản mô phỏng theo nội dung đang nhập; cách hiển thị thực tế có thể khác.</p>
      ${preview.restricted ? html`<p class="hint">Chỉ mô phỏng các trường bạn được xem. Bản xuất bản có thể dùng thiết lập khác.</p>` : nothing}
      ${preview.siteUnavailable ? html`<p class="hint">Chưa đọc được thiết lập website; đang dùng tên mặc định và ảnh của bài nếu có.</p>` : nothing}
      </div>`;
  }
}
customElements.define('antc-article-seo-preview', AntcSeoPreview);
export default AntcSeoPreview;
