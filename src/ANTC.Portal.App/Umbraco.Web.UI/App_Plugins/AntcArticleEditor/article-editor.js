import { html, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT, UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import '@umbraco-cms/backoffice/content';
import { UMB_VALIDATION_CONTEXT, extractJsonQueryProps } from '@umbraco-cms/backoffice/validation';
import { editorStyles } from './editor-styles.js?v=0.12.0';
import './seo-preview.js?v=0.9.0';
import './publication-info.js?v=0.9.0';
import { ANTC_ARTICLE_ACCESS_CONTEXT } from './property-access-context.js?v=0.9.0';
import { ANTC_ARTICLE_COMPOSE_CONTEXT } from './field-description-context.js?v=0.11.0';

const groups = [
  { id: 'summary', label: 'Tóm tắt', leadingField: true, aliases: ['summary'] },
  { id: 'body', label: 'Nội dung bài viết', leadingField: true, aliases: ['body', 'safeAction'] },
  { id: 'image', label: 'Ảnh đại diện', leadingField: true, aliases: ['image', 'imageAlt'] },
  { id: 'display', label: 'Hiển thị', leadingField: true, aliases: ['showOnHome'] },
  { id: 'seo', label: 'SEO và chia sẻ', hint: 'Thiết lập cách bài viết xuất hiện trên công cụ tìm kiếm và khi chia sẻ.', aliases: ['seoTitle', 'seoDescription', 'ogImage', 'hideFromSearch'] },
  { id: 'source', label: 'Nguồn và rà soát', aliases: ['labelType', 'sourceAgency', 'sourceDocNo', 'sourceDocDate', 'updatedDate', 'lastReviewedDate', 'isDraft'] },
];
const assignedAliases = new Set(groups.flatMap(group => group.aliases));
const tabs = [
  { id: 'article', label: 'Bài viết', groups: ['summary', 'body', 'image', 'display', 'other'] },
  { id: 'source', label: 'Nguồn và rà soát', groups: ['source'] },
  { id: 'seo', label: 'SEO và chia sẻ', groups: ['seo'] },
  { id: 'history', label: 'Lịch sử', groups: [] },
];
const historyAppFilter = manifest => manifest.alias === 'Umb.WorkspaceInfoApp.Document.History';
const tabForGroup = id => tabs.find(tab => tab.groups.includes(id))?.id ?? 'article';
const groupForAlias = alias => groups.find(group => group.aliases.includes(alias))?.id ?? 'other';

// Uses native workspace fields: values, validation and property permissions stay with Umbraco.
class AntcArticleEditor extends UmbLitElement {
  static properties = {
    _aliases: { state: true }, _loaded: { state: true }, _variant: { state: true },
    _summary: { state: true }, _body: { state: true },
    _access: { state: true },
    _activeTab: { state: true }, _invalidAliases: { state: true },
    _properties: { state: true }, _values: { state: true },
    _isNew: { state: true }, _historyOpened: { state: true },
  };
  static styles = editorStyles;

  constructor() {
    super();
    this.provideContext(ANTC_ARTICLE_COMPOSE_CONTEXT, this);
    this._aliases = [];
    this._loaded = false;
    this._summary = '';
    this._body = null;
    this._activeTab = 'article';
    this._invalidAliases = [];
    this._properties = [];
    this._values = [];
    this._isNew = true;
    this._historyOpened = false;
    const editor = this;
    // Route native error focus before the hidden field controls are focused.
    // The native validators still own all checks, messages and save decisions.
    this._validationRouter = {
      get isValid() { return editor._invalidFieldAliases().length === 0; },
      validate: async () => {}, reset: () => {},
      focusFirstInvalidElement: () => { void editor._focusFirstInvalidField(); },
    };
    this.consumeContext(UMB_VALIDATION_CONTEXT, context => {
      this._validation?.removeValidator(this._validationRouter);
      this._validation = context;
      if (this.isConnected) context?.addValidator(this._validationRouter);
      this.observe(context?.messages.messages, () => {
        this._invalidAliases = this._invalidFieldAliases();
      }, 'article-tab-validation');
    });
    this.consumeContext(ANTC_ARTICLE_ACCESS_CONTEXT, context => {
      this.observe(context?.state, state => { this._access = state; }, 'article-property-access');
    });
    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, context => {
      this.observe(context?.isNew, isNew => { this._isNew = isNew ?? true; }, 'article-history-new');
      this.observe(context?.structure.contentTypeProperties, properties => {
        this._properties = properties ?? [];
      }, 'article-required-properties');
      this.observe(context?.data, data => { this._values = data?.values ?? []; }, 'article-required-values');
      this.observe(context?.structure.contentTypePropertyAliases, aliases => {
        this._aliases = aliases ?? [];
      }, 'article-property-aliases');
      this.observe(context?.structure.contentTypeLoaded, loaded => {
        this._loaded = loaded ?? false;
      }, 'article-content-loaded');
    });
    this.consumeContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT, context => {
      this.observe(context?.currentVariant, variant => { this._variant = variant; }, 'article-variant');
      this._observeValue(context, 'summary', value => { this._summary = typeof value === 'string' ? value : ''; });
      this._observeValue(context, 'body', value => { this._body = value; });
    });
  }

  async _observeValue(context, alias, callback) {
    const observable = await context?.propertyValueByAlias(alias);
    this.observe(observable, callback, `article-value-${alias}`);
  }

  connectedCallback() {
    super.connectedCallback();
    this._validation?.addValidator(this._validationRouter);
    this._resizeObserver = new ResizeObserver(entries => this._updateLayout(entries[0].contentRect.width));
    this._resizeObserver.observe(this);
    this._updateLayout(this.clientWidth);
    if (!document.getElementById('antc-editor-fonts')) {
      const link = document.createElement('link');
      link.id = 'antc-editor-fonts';
      link.rel = 'stylesheet';
      link.href = '/assets/css/fonts.css';
      document.head.append(link);
    }
  }

  _updateLayout(width) {
    if (!width) return;
    cancelAnimationFrame(this._textareaLayoutFrame);
    this._textareaLayoutFrame = requestAnimationFrame(() => this._refreshTextareaLayout());
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    cancelAnimationFrame(this._textareaLayoutFrame);
    this._validation?.removeValidator(this._validationRouter);
    super.disconnectedCallback();
  }

  _visibleGroups() {
    return groups.filter(group => group.aliases.some(alias => this._aliases.includes(alias) && this._access?.readable[alias]));
  }

  _extraAliases() { return this._aliases.filter(alias => !assignedAliases.has(alias) && this._access?.readable[alias]); }

  _visibleTabs() {
    const ids = this._visibleGroups().map(group => group.id);
    if (this._extraAliases().length) ids.push('other');
    return tabs.filter(tab => tab.id === 'history' || tab.groups.some(id => ids.includes(id)));
  }

  willUpdate() {
    const available = this._visibleTabs();
    if (available.length && !available.some(tab => tab.id === this._activeTab)) this._activeTab = available[0].id;
  }

  _invalidFieldAliases() {
    const messages = this._validation?.messages.getMessages() ?? [];
    return [...new Set(messages.map(message => {
      const query = message.path?.match(/\$\.values\[([^\]]+)\]/)?.[1];
      return query ? extractJsonQueryProps(query).alias : undefined;
    }).filter(alias => this._aliases.includes(alias) && this._access?.readable[alias]))];
  }

  async _selectTab(id, focusTab = false, resetScroll = true) {
    if (!this.isConnected || !this._visibleTabs().some(tab => tab.id === id)) return;
    this._activeTab = id;
    if (id === 'history') this._historyOpened = true;
    await this.updateComplete;
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (!this.isConnected) return;
    this._refreshTextareaLayout();
    if (resetScroll) this.renderRoot.querySelector('.scroll-area').scrollTop = 0;
    if (focusTab) this.renderRoot.querySelector(`[data-tab="${id}"]`)?.focus();
  }

  _refreshTextareaLayout() {
    // UUI measures auto-height on value changes, including while a panel is
    // hidden. Re-measure through its public API once the panel has a width.
    const visit = root => {
      for (const element of root?.children ?? []) {
        if (element.localName === 'uui-textarea' && element.autoHeight) element.autoUpdateHeight();
        if (element.shadowRoot) visit(element.shadowRoot);
        visit(element);
      }
    };
    visit(this.renderRoot.querySelector('.compose-panel:not([hidden])'));
  }

  _onTabKeydown(event) {
    const available = this._visibleTabs();
    const index = available.findIndex(tab => tab.id === this._activeTab);
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % available.length;
    else if (event.key === 'ArrowLeft') next = (index + available.length - 1) % available.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = available.length - 1;
    else return;
    event.preventDefault();
    void this._selectTab(available[next].id, true);
  }

  async _focusFirstInvalidField() {
    const alias = this._invalidFieldAliases()[0];
    if (alias) await this._focusProperty(alias);
  }

  async _focusProperty(alias) {
    if (!this.isConnected) return;
    await this._goTo(groupForAlias(alias));
    if (!this.isConnected) return;
    const field = this.renderRoot.querySelector(`umb-content-workspace-property[alias="${CSS.escape(alias)}"]`);
    const focusInput = root => {
      for (const element of root?.children ?? []) {
        if (element.matches('input:not([type=hidden]), textarea, select, [contenteditable=true]') && !element.disabled) {
          element.focus({ preventScroll: true });
          return true;
        }
        if ((element.shadowRoot && focusInput(element.shadowRoot)) || focusInput(element)) return true;
      }
      return false;
    };
    focusInput(field?.shadowRoot ?? field);
  }

  _requiredChecks() {
    const hasValue = value => typeof value === 'string' ? value.trim().length > 0
      : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
    return [
      { id: '$name', label: 'Tên bài viết', ready: hasValue(this._variant?.name), editable: true },
      ...this._properties.filter(property => property.validation?.mandatory && this._access?.readable[property.alias])
        .map(property => {
          const value = this._values.find(item => item.alias === property.alias && !item.culture && !item.segment)?.value;
          const invalid = this._invalidAliases.includes(property.alias);
          return { id: property.alias, label: property.name, ready: hasValue(value) && !invalid,
            invalid, editable: this._access?.writable[property.alias] === true };
        }),
    ];
  }

  _focusRequired(alias) {
    if (alias !== '$name') { void this._focusProperty(alias); return; }
    // Tim o ten goc o workspace hien tai, khong tao them o nhap ten.
    let root = this.getRootNode();
    while (root) {
      const selector = root.querySelector?.('umb-document-workspace-split-view-variant-selector');
      const input = selector?.shadowRoot?.querySelector('#name-input');
      if (input) { input.focus(); return; }
      root = root.host?.getRootNode();
    }
  }

  _renderRequiredChecks() {
    const checks = this._requiredChecks();
    const completed = checks.filter(check => check.ready).length;
    return html`<section class="side-card required-card" aria-labelledby="required-heading">
      <div class="required-heading"><h3 id="required-heading">Kiểm tra trước khi xuất bản</h3>
        <span class="count" aria-label="Trường bắt buộc đã nhập">${completed}/${checks.length}</span></div>
      <p class="hint">Chỉ kiểm tra các trường bắt buộc.</p>
      <ul class="required-list">${checks.map(check => html`<li data-required=${check.id} data-ready=${check.ready}>
        <span class="required-icon" aria-label=${check.ready ? 'Đã nhập' : check.invalid ? 'Cần kiểm tra' : 'Chưa nhập'}>${check.ready ? '✓' : '!'}</span>
        <div><span>${check.label}</span>${!check.ready ? check.editable
          ? html`<button type="button" class="required-link" @click=${() => this._focusRequired(check.id)}>
              ${check.invalid ? 'Kiểm tra' : 'Bổ sung'}<span class="sr-only"> ${check.label}</span></button>`
          : html`<small>Nhờ người có quyền bổ sung.</small>` : nothing}</div>
      </li>`)}</ul>
    </section>`;
  }

  _wordCount() {
    const markup = typeof this._body === 'string' ? this._body : this._body?.markup ?? '';
    const doc = new DOMParser().parseFromString(markup, 'text/html');
    doc.querySelectorAll('script, style').forEach(node => node.remove());
    // RTE blocks store their text separately from markup. Count only notice
    // blocks actually present in the document, including unsaved block edits.
    for (const block of doc.querySelectorAll('umb-rte-block[data-content-key]')) {
      const content = this._body?.blocks?.contentData?.find(item => item.key === block.getAttribute('data-content-key'));
      if (content?.contentTypeKey === '7356c35e-1c95-4a33-8d3a-22c01c2bda18') {
        const text = content.values?.find(value => value.alias === 'text')?.value;
        if (typeof text === 'string') block.replaceWith(doc.createTextNode(` ${text} `));
      }
    }
    doc.querySelectorAll('br').forEach(node => node.replaceWith(doc.createTextNode(' ')));
    doc.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, pre')
      .forEach(node => node.append(doc.createTextNode(' ')));
    const text = doc.body.textContent?.trim() ?? '';
    return text ? text.split(/\s+/u).length : 0;
  }

  async _goTo(id) {
    await this._selectTab(tabForGroup(id), false, false);
    if (!this.isConnected) return;
    const section = this.renderRoot.querySelector(`#${id}`);
    section?.scrollIntoView({ block: 'start', behavior: 'auto' });
    section?.focus({ preventScroll: true });
  }

  _renderFields(aliases) {
    return repeat(aliases, alias => alias, alias => html`<umb-content-workspace-property alias=${alias}></umb-content-workspace-property>`);
  }

  _renderSection(group) {
    const aliases = group.aliases.filter(alias => this._aliases.includes(alias) && this._access?.readable[alias]);
    if (!aliases.length) return nothing;
    const count = group.id === 'summary' && this._access?.readable.summary ? `${Array.from(this._summary).length} ký tự`
      : group.id === 'body' && this._access?.readable.body ? `${this._wordCount()} từ` : null;
    return html`<section class=${group.leadingField ? 'section leading-field' : 'section'} id=${group.id} tabindex="-1" aria-label=${group.label}>
      ${group.leadingField
        ? count ? html`<span class="count">${count}</span>` : nothing
        : html`<div class="section-heading"><h3>${group.label}</h3></div>`}
      ${group.hint ? html`<p class="hint">${group.hint}</p>` : nothing}
      ${this._renderFields(aliases)}
      ${group.id === 'seo' ? html`<antc-article-seo-preview class="search-preview"></antc-article-seo-preview>
        <div class="seo-share-inline"><h4>Xem trước khi chia sẻ</h4><antc-article-seo-preview mode="share"></antc-article-seo-preview></div>` : nothing}
    </section>`;
  }

  _renderTabs() {
    return html`<div class="compose-tabs" role="tablist" aria-label="Các phần soạn bài" @keydown=${this._onTabKeydown}>
      ${this._visibleTabs().map(tab => {
        const errors = this._invalidAliases.filter(alias => tabForGroup(groupForAlias(alias)) === tab.id).length;
        return html`<button type="button" role="tab" id=${`compose-tab-${tab.id}`} data-tab=${tab.id}
          aria-controls=${`compose-panel-${tab.id}`} aria-selected=${this._activeTab === tab.id ? 'true' : 'false'}
          tabindex=${this._activeTab === tab.id ? 0 : -1} data-invalid=${errors > 0}
          @click=${() => this._selectTab(tab.id)}>${tab.label}${errors ? html`
            <span class="tab-error" aria-hidden="true">!</span><span class="sr-only">, ${errors} trường cần kiểm tra</span>` : nothing}</button>`;
      })}
    </div>`;
  }

  _renderHistory() {
    // Chi tai lan dau mo; giu app goc va trang dang xem khi chuyen tab.
    if (!this._historyOpened && this._activeTab !== 'history') return nothing;
    return html`<div class="history-view">${this._isNew
      ? html`<section aria-label="Lịch sử"><h3>Lịch sử</h3><p class="hint">Chưa có lịch sử. Lưu nháp để tạo bài viết.</p></section>`
      : html`<umb-extension-slot type="workspaceInfoApp" .filter=${historyAppFilter}></umb-extension-slot>`}
    </div>`;
  }

  render() {
    if (!this._loaded || !this._access || this._access.pending) return html`<div class="loading" role="status"><uui-loader></uui-loader> Đang tải bài viết…</div>`;
    const visibleGroups = this._visibleGroups();
    const extraAliases = this._extraAliases();
    return html`<div class="scroll-area"><div class="layout">
      <main class="paper" aria-label="Soạn bài viết">
        <header class="intro">
          <p class="eyebrow">BIÊN TẬP BÀI VIẾT</p>
          <h2>${this._variant?.name || 'Bài viết mới'}</h2>
        </header>
        ${this._renderTabs()}
        ${repeat(this._visibleTabs(), tab => tab.id, tab => html`<div class="compose-panel" role="tabpanel"
          id=${`compose-panel-${tab.id}`} aria-labelledby=${`compose-tab-${tab.id}`} tabindex="0"
          ?hidden=${this._activeTab !== tab.id} ?inert=${this._activeTab !== tab.id}>
          ${visibleGroups.filter(group => tab.groups.includes(group.id)).map(group => this._renderSection(group))}
          ${tab.id === 'article' && extraAliases.length ? this._renderSection({ id: 'other', label: 'Thông tin khác', aliases: extraAliases }) : nothing}
          ${tab.id === 'history' ? this._renderHistory() : nothing}
        </div>`)}
      </main>
      <aside aria-label="Thông tin xuất bản bài viết"><div class="side-stack">
        <section class="side-card status-card" aria-labelledby="status-heading">
          <h3 id="status-heading">Xuất bản</h3>
          <antc-article-publication-info></antc-article-publication-info>
        </section>
        ${this._renderRequiredChecks()}
      </div></aside>
    </div></div>`;
  }
}

customElements.define('antc-article-editor', AntcArticleEditor);
export default AntcArticleEditor;
