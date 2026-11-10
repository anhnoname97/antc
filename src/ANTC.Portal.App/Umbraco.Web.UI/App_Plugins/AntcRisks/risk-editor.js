import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT, UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import '@umbraco-cms/backoffice/content';
import { RiskApi, list, refs, keyOf, value, label, editorRefs } from './risk-api.js?v=1.2.0';
import { responsiveShell } from './responsive-shell.js?v=1.2.0';

const dateOnly = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const plain = s => typeof s === 'object' ? s?.markup?.replace(/<[^>]*>/g, ' ') || '' : String(s || '').replace(/<[^>]*>/g, ' ');

class AntcRiskEditor extends UmbLitElement {
    static properties = { _aliases: { state: true }, _type: { state: true }, _values: { state: true }, _tab: { state: true }, _catalog: { state: true }, _derived: { state: true }, _error: { state: true }, _name: { state: true }, _id: { state: true }, _isNew: { state: true } };
    constructor() {
        super(); this._aliases = []; this._values = {}; this._tab = 'content'; this._catalog = []; this._type = '';
        this.consumeContext(UMB_AUTH_CONTEXT, auth => { if (auth) { this._api = new RiskApi(auth); this._refresh(); } });
        this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, ctx => {
            this._workspace = ctx;
            this.observe(ctx?.isNew, v => { this._isNew = v; }, 'risk-new');
            this.observe(ctx?.structure.contentTypeAliases, aliases => { this._type = aliases?.some(a => ['luaDaoPage', 'vayVaNoPage', 'dauTuPage', 'baoHiemVaTietKiemPage', 'duLieuCaNhanPage'].includes(a)) ? 'riskCategoryPage' : aliases?.find(a => ['ruiRoPage', 'alertListPage', 'riskCategoryPage', 'riskArticlePage', 'alertPage', 'tacticItem', 'topicItem'].includes(a)) || ''; }, 'risk-type');
            this.observe(ctx?.structure.contentTypePropertyAliases, v => { this._aliases = v || []; }, 'risk-aliases');
            this.observe(ctx?.data, data => {
                this._id = data?.unique; this._name = data?.variants?.[0]?.name || '';
                const values = Object.fromEntries((data?.values || []).filter(v => !v.culture && !v.segment).map(v => [v.alias, v.value]));
                if (JSON.stringify(values) !== JSON.stringify(this._values)) { this._values = values; this._scheduleDerive(); }
            }, 'risk-data');
        });
        this.consumeContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT, ctx => { this._dataset = ctx; });
    }
    firstUpdated() {
        this._shell = responsiveShell(this, state => { this._mobile = state; this.requestUpdate(); });
        this._resizeObserver = new ResizeObserver(() => this._scheduleTextareaLayout());
        this._resizeObserver.observe(this);
    }
    disconnectedCallback() {
        this._shell?.dispose(); this._resizeObserver?.disconnect(); cancelAnimationFrame(this._textareaFrame);
        clearTimeout(this._timer); this._requestId = (this._requestId || 0) + 1; super.disconnectedCallback();
    }
    _scheduleTextareaLayout() {
        cancelAnimationFrame(this._textareaFrame);
        this._textareaFrame = requestAnimationFrame(async () => {
            if (!this.isConnected) return;
            // UUI auto-height can measure a hidden tab as zero width. Re-measure visible controls through its public API.
            const visit = async root => {
                for (const element of root?.children ?? []) {
                    // Property editors render their controls asynchronously after the workspace tab.
                    if (element.updateComplete) await element.updateComplete;
                    if (!this.isConnected) return;
                    if (element.localName === 'uui-textarea' && element.autoHeight && element.getBoundingClientRect().width > 0)
                        element.autoUpdateHeight();
                    if (element.shadowRoot) await visit(element.shadowRoot);
                    await visit(element);
                }
            };
            await visit(this.renderRoot.querySelector('[role=tabpanel]:not([hidden])'));
        });
    }
    async _refresh() {
        try { [this._catalog, this._types] = await Promise.all([this._api.catalog(true), this._api.request('types')]); this._error = ''; this._scheduleDerive(); this._fillAlert(); } catch (e) { this._error = e.message; }
    }
    _scheduleDerive() {
        clearTimeout(this._timer);
        this._timer = setTimeout(async () => {
            if (!this._api || !this._id || this._isNew) return;
            const seq = this._requestId = (this._requestId || 0) + 1;
            try { const result = await this._api.derive(this._id, this._values); if (seq === this._requestId) { this._derived = result; this._error = ''; } }
            catch (e) { if (seq === this._requestId) this._error = e.message; }
        }, 250);
    }
    updated(changed) {
        if (['_tab', '_aliases', '_values', '_derived', '_type'].some(key => changed.has(key))) this._scheduleTextareaLayout();
        if (this._isNew && this._dataset && this._aliases.length) {
            if (this._type === 'riskArticlePage' && !this._values.articleKind) this._dataset.setPropertyValue('articleKind', ['Bài hướng dẫn']);
            if (this._type === 'alertPage') {
                if (!this._values.autoUnpublishDays) this._dataset.setPropertyValue('autoUnpublishDays', 180);
                if (!this._values.updatedDate) this._dataset.setPropertyValue('updatedDate', dateOnly());
            }
        }
        if (this._type === 'alertPage' && changed.has('_values')) this._fillAlert();
        if (this._type === 'tacticItem' && this._isNew && !this._values.containingArticle && !this._prefilledArticle) {
            const key = new URLSearchParams(location.search).get('article');
            if (key && this._catalog.some(n => n.type === 'riskArticlePage' && keyOf(n.key) === keyOf(key))) {
                this._prefilledArticle = true;
                this._dataset?.setPropertyValue('containingArticle', editorRefs([key]));
            }
        }
    }
    _fillAlert() {
        const selected = refs(this._values.tactics);
        const selectedString = selected.join(',');
        if (this._filledTactics === selectedString || !selected.length || !this._catalog.length) return;
        this._filledTactics = selectedString;
        const tactics = this._catalog.filter(n => n.type === 'tacticItem' && selected.includes(keyOf(n.key)));
        const channels = [...new Set(tactics.flatMap(n => refs(value(n, 'channels'))))];
        const audiences = this._catalog.filter(n => n.type === 'audienceItem' && refs(value(n, 'tactics')).some(k => selected.includes(k))).map(n => keyOf(n.key));
        if (!refs(this._values.channels).length && channels.length) this._dataset?.setPropertyValue('channels', editorRefs(channels));
        if (!refs(this._values.audiences).length && audiences.length) this._dataset?.setPropertyValue('audiences', editorRefs(audiences));
    }
    _has(alias) { return this._aliases.includes(alias); }
    _field(alias) { return this._has(alias) ? html`<umb-content-workspace-property alias=${alias}></umb-content-workspace-property>` : nothing; }
    _fields(aliases) { return repeat(aliases.filter(a => this._has(a)), a => a, a => this._field(a)); }
    _box(title, aliases, hint, extra, folded = false) {
        return folded ? html`<details class="box fold"><summary>${title}<small>${hint || 'Không bắt buộc'}</small></summary>${this._fields(aliases)}${extra || nothing}</details>`
            : html`<section class="box" aria-label=${title}><h3>${title}</h3>${hint ? html`<p class="hint">${hint}</p>` : nothing}${this._fields(aliases)}${extra || nothing}</section>`;
    }
    _link(node, text) { return node ? html`<a class="button" href=${`/umbraco/section/content/workspace/document/edit/${node.key}`}>${text || node.name} ↗</a>` : nothing; }
    _folder(type, text) { return this._link(this._catalog.find(n => n.type === type), text); }
    get _articleListUrl() {
        const article = this._catalog.find(n => keyOf(n.key) === keyOf(this._id));
        const folder = this._catalog.find(n => n.type === 'articleFolder' && keyOf(n.key) === keyOf(article?.parentKey))
            || this._catalog.find(n => n.type === 'articleFolder');
        return folder ? `/umbraco/section/content/workspace/document/edit/${folder.key}` : '';
    }
    _autoRows(rows) { return html`<dl>${rows.filter(([_, v]) => v != null).map(([k, v]) => html`<div><dt>${k}</dt><dd>${Array.isArray(v) ? v.length ? v.map(x => typeof x === 'string' ? x : x.name).join(' · ') : 'Chưa có' : v || 'Chưa có'}</dd></div>`)}</dl>`; }
    _auto() {
        const d = this._derived;
        if (!d) return html`<p class="hint">${this._isNew ? 'Lưu bản nháp để xem các nội dung website tự lấy.' : 'Đang lấy thông tin…'}</p>`;
        if (this._type === 'riskCategoryPage') return html`${this._autoRows([
            ['Bài viết', `${d.articles.length} bài${d.articles.filter(x => value(x, 'isFeatured') == 1).length ? ' · ' + d.articles.filter(x => value(x, 'isFeatured') == 1).length + ' ghim' : ''}`],
            ['Thủ đoạn', `${d.tactics.length} thủ đoạn`], ['Cảnh báo', `${d.alerts.length} cảnh báo`], ['Việc cần làm ngay', d.actions],
            ['Dòng “đang biên soạn”', d.inPreparation ? 'Hiện (nhóm chưa có bài riêng)' : 'Không hiện']])}${this._folder('articleFolder', 'Mở danh sách Bài viết')}`;
        if (this._type === 'alertPage') {
            const groups = this._catalog.filter(n => n.type === 'riskCategoryPage' && d.tactics.some(t => {
                const a = this._catalog.find(a => refs(value(t, 'containingArticle')).includes(keyOf(a.key)));
                return refs(value(a, 'primaryGroup')).includes(keyOf(n.key));
            }));
            return this._autoRows([['Hiện ở nhóm', ['Cảnh báo mới', ...groups.map(n => n.name)]], ['Bài liên quan', d.related], ['Hộp “Chưa chuyển tiền…”', label(this._values.cautionLevel) === 'Cao' ? 'Có (mức Cao)' : 'Không']]);
        }
        if (this._type === 'tacticItem') return this._autoRows([['Chuyên đề', d.topic?.name || 'Theo bài chứa thủ đoạn'], ['Bấm thẻ', 'Mở bài, cuộn tới mục và tô sáng dòng này'], ['Cảnh báo dùng thủ đoạn này', d.alerts]]);
        return this._autoRows([
            ['Mức độ', this._kind === 'Bài hướng dẫn' ? d.level : null], ['Kênh', this._kind === 'Bài hướng dẫn' ? d.channels : null],
            ['Ai thường bị nhắm đến', this._kind === 'Bài hướng dẫn' ? d.audiences : null],
            ['Nhớ một câu, Câu hỏi phải hỏi', this._kind === 'Bài hướng dẫn' ? d.topic?.name || 'Chọn chuyên đề' : null],
            ['Nếu đã lỡ', this._kind === 'Bài hướng dẫn' ? d.actions : null], ['Bài liên quan', d.related],
            ['Số trong loạt', d.seriesCount ? `Bài ${d.seriesPosition} / ${d.seriesCount}${d.next ? ' · Đọc tiếp: ' + d.next.name : ''}` : null]
        ]);
    }
    get _kind() { return label(this._values.articleKind) || 'Bài hướng dẫn'; }
    _checks() {
        const v = this._values, has = a => Array.isArray(v[a]) ? v[a].length > 0 : typeof v[a] === 'object' ? !!plain(v[a]).trim() : !!v[a] && v[a] !== '[]';
        return this._type === 'alertPage' ? [['Tiêu đề', has('title')], ['Tóm tắt', has('description')], ['Kịch bản 3–5 bước', list(v.scenarioSteps).length >= 3 && list(v.scenarioSteps).length <= 5],
            ['Thủ đoạn', has('tactics')], ['Kênh, đối tượng', has('channels') && has('audiences')], ['Mức độ, phổ biến', has('cautionLevel') && has('popularity')], ['Trang việc cần làm', has('actionPage')]]
            : [['Tiêu đề', has('title')], ['Nhóm và loại bài', has('primaryGroup') && has('articleKind')],
                ...(this._kind !== 'Bài đọc thêm' ? [['Chuyên đề', has('topic')]] : []), ...(this._kind !== 'Bài đọc chuyên đề' ? [['Câu mời đọc', has('description')]] : []),
                ['Tóm tắt', has('summary')], ...(this._kind === 'Bài hướng dẫn' ? [['Dấu hiệu', has('warningSigns')], ['Việc cần làm', has('actionsNow')]] : []),
                ['Nguồn tham khảo', has('references')], ['Thẩm định', has('reviewDate') && has('reviewer')]];
    }
    _progress() { const checks = this._checks(), done = checks.filter(x => x[1]).length; return html`<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax=${checks.length} aria-valuenow=${done}><i style=${`width:${done / checks.length * 100}%`}></i></div><p class="hint">${done} / ${checks.length} phần đã có</p><ul class="checks">${checks.map(([name, ok]) => html`<li class=${ok ? 'ok' : ''}><span>${ok ? '✓' : '○'}</span>${name}</li>`)}</ul>`; }
    _card() { const group = this._catalog.find(n => refs(this._values.primaryGroup).includes(keyOf(n.key))); return html`<article class="card"><small>${this._kind}</small><b>${this._values.title || 'Tiêu đề bài'}</b><p>${this._values.description || this._derived?.invitation || 'Câu mời đọc'}</p><small>${group?.name || 'Chưa chọn nhóm'} · khoảng ${this._derived?.readingMinutes || 1} phút đọc</small></article>`; }
    _tactics() { return html`<div class="tactics">${this._derived?.tactics.map(n => html`<div>${this._link(n)}<small>${label(value(n, 'cautionLevel'))}</small></div>`) || nothing}
        ${!this._derived?.tactics.length ? html`<p class="hint">Chưa có thủ đoạn nào gắn vào bài này.</p>` : nothing}
        ${this._createTacticLink()}${this._folder('tacticFolder', 'Mở Danh mục › Thủ đoạn')}<p class="hint">Thủ đoạn mới được gắn sẵn bài này. Thứ tự theo danh sách Thủ đoạn.</p></div>`; }
    _createTacticLink() {
        const folder = this._catalog.find(n => n.type === 'tacticFolder');
        return folder && this._types?.tacticItem && !this._isNew ? html`<a class="button" href=${`/umbraco/section/content/workspace/document/create/parent/document/${folder.key}/${this._types.tacticItem}?article=${this._id}`}>＋ Thêm thủ đoạn cho bài này</a>` : nothing;
    }
    _fixed() {
        if (this._type === 'ruiRoPage') return this._box('Nội dung', ['title', 'lead'], null, html`<div class="notice"><b>Chuyển hướng</b><p>Địa chỉ /cac-rui-ro chuyển hướng 301 về /cac-rui-ro/canh-bao-moi.</p></div>`);
        if (this._type === 'alertListPage') return html`${this._box('Nội dung', ['title', 'lead', 'showSampleNote'], null, html`<div class="notice">${this._catalog.filter(n => n.type === 'alertPage').length} cảnh báo. Thêm, sửa ở Quản lý nội dung › Cảnh báo. ${this._folder('alertFolder', 'Mở danh sách Cảnh báo')}</div>`)}${this._image()}`;
        return html`${this._box('Nội dung', ['tabName', 'cardDescription', 'lead', 'icon', 'thumbnail', 'showAdviceBox'], null, html`<div class="notice">${this._catalog.filter(n => n.type === 'riskArticlePage' && refs(value(n, 'primaryGroup')).includes(keyOf(this._id))).length} bài có Nhóm chính là nhóm này. Thêm, sửa ở Quản lý nội dung › Bài viết. ${this._folder('articleFolder', 'Mở danh sách Bài viết')}</div>`)}
            ${this._box('Website tự lấy', [], null, this._auto())}${this._image()}`;
    }
    _image() { return this._box('Ảnh minh họa', ['illustration', 'illustrationAlt'], 'Ảnh lớn dưới tiêu đề trang · dùng chung (illustrationBase)'); }
    _freshness() {
        const left = this._derived?.freshDaysLeft;
        return html`<p class="hint">${left == null ? 'Chưa có ngày cập nhật' : left >= 0 ? `Còn ở mục “mới” thêm ${left} ngày. Tự gỡ sau ${this._derived.autoUnpublishDaysLeft} ngày.` : 'Đã quá 90 ngày: xuống mục Lưu trữ.'}</p><p class="hint">Hẹn giờ: dùng lịch xuất bản có sẵn của Umbraco ở thanh dưới.</p>`;
    }
    _document() {
        const article = this._type === 'riskArticlePage', guide = this._kind === 'Bài hướng dẫn';
        return html`<div class="doc2"><div class="main">
            ${article ? html`${this._box('Bài viết', [...(this._kind === 'Bài đọc thêm' ? ['series'] : []), 'title', 'description', 'summary'])}
                ${guide ? html`${this._box('Nhận ra và xử lý', ['warningSigns', 'actionsNow', 'scenarios', 'avoidActions'], 'Mỗi dòng một ý. Nhớ một câu, Câu hỏi phải hỏi, Khi nào dừng, hoãn lấy từ Danh mục › Chuyên đề.')}${this._box('Thủ đoạn trong bài', [], null, this._tactics())}` : nothing}
                ${this._box('Nội dung bài', ['readingBody'], 'Menu Kiểu chèn các hộp ghi nhớ, trường hợp thật, bỏ túi; nút Bảng chèn bảng.')}
                ${this._box('Nguồn tham khảo', ['references'], 'Cần ít nhất một nguồn trước khi đăng.')}
                ${this._box('Thêm chi tiết', ['alsoInCategories', 'searchKeywords', 'synonyms'], 'Không bắt buộc · nhóm khác, từ khóa', null, true)}`
            : html`${this._box('Cảnh báo', ['title', 'description', 'scenarioSteps', 'stopSigns', 'otherSigns', 'actionPage'])}
                ${this._box('Nguồn cảnh báo', ['issuingAgency', 'documentNumber', 'documentDate', 'documentUrl'], 'Không bắt buộc. Có thì hiện nhãn “Dựa trên cảnh báo của …” và mục Nguồn.')}
                ${this._box('Thêm chi tiết', ['searchKeywords', 'autoUnpublishDays'], 'Không bắt buộc · từ khóa, tự gỡ', null, true)}`}
            ${this._image()}
        </div><aside>
            ${article ? html`${this._box('Xuất bản', ['primaryGroup', 'articleKind'], null, html`${this._kind !== 'Bài đọc thêm' ? this._field('topic') : nothing}${this._fields(['actionPage', 'isFeatured'])}`)}`
                : html`${this._box('Đăng', ['updatedDate', 'cautionLevel', 'popularity', 'popularityBasis'])}${this._box('Thủ đoạn', ['tactics', 'channels', 'audiences'], 'Chọn thủ đoạn trước: kênh, đối tượng được điền sẵn; bài liên quan và nhóm hiện cảnh báo website tự lấy.')}`}
            ${this._box('Kiểm tra trước khi xuất bản', [], null, this._progress())}
            ${article ? this._box('Xem trước thẻ bài', [], null, this._card()) : this._box('Tình trạng', [], null, this._freshness())}
            ${this._box('Website tự lấy', [], null, this._auto())}
            ${article ? this._box('Thẩm định', ['reviewDate', 'reviewer', 'version'], null, html`<p class="hint">Thời gian đọc: khoảng ${this._derived?.readingMinutes || 1} phút.</p>`) : nothing}
        </aside></div>`;
    }
    _taxonomy() {
        return this._type === 'tacticItem' ? html`${this._box('Thủ đoạn', ['code', 'isActive', 'containingArticle', 'channels', 'cautionLevel', 'searchKeywords'])}${this._box('Trình hỏi', ['wizardAnswers'], 'Chọn yêu cầu hoặc lời thuyết phục tương ứng để thủ đoạn xuất hiện trong kết quả Kiểm tra tình huống.')}${this._image()}${this._box('Hiện trên website ở đâu', [], null, this._auto())}`
            : html`${this._box('Chuyên đề', ['code', 'icon', 'isActive', 'topicNumber', 'shortName', 'readingArticle', 'checklist'])}${this._box('Dùng chung cho bài hướng dẫn', ['rememberLine', 'mustAsk', 'stopWhen', 'holdWhen'])}`;
    }
    render() {
        if (!this._aliases.length) return html`<p class="loading">Đang tải nội dung…</p>`;
        const document = ['riskArticlePage', 'alertPage'].includes(this._type), taxonomy = ['tacticItem', 'topicItem'].includes(this._type);
        return html`${this._mobile?.open ? html`<button class="backdrop" type="button" aria-label="Đóng cây nội dung" @click=${() => this._shell.close()}></button>` : nothing}<div class="tabs" role="tablist" aria-label="Các phần nội dung">${this._mobile?.mobile ? html`<button type="button" aria-label="Mở cây nội dung" @click=${() => this._shell.toggle()}>☰</button>` : nothing}<button type="button" role="tab" aria-selected=${this._tab === 'content'} aria-controls="panel-content" @click=${() => this._tab = 'content'}>${document ? this._type === 'alertPage' ? 'Viết cảnh báo' : 'Viết bài' : 'Nội dung'}</button>
            ${!taxonomy ? html`<button type="button" role="tab" aria-selected=${this._tab === 'seo'} aria-controls="panel-seo" @click=${() => this._tab = 'seo'}>SEO và chia sẻ</button>` : nothing}<button class="refresh" type="button" @click=${this._refresh}>↻ Cập nhật thông tin</button>
            ${this._type === 'riskArticlePage' ? html`<uui-button class="close" label="Đóng" look="secondary" href=${this._articleListUrl || nothing} ?disabled=${!this._articleListUrl}>Đóng</uui-button>` : nothing}</div>
            ${this._error ? html`<div class="error" role="alert">${this._error}<button type="button" @click=${this._refresh}>Thử lại</button></div>` : nothing}
            <div class="page ${document ? 'document' : ''}" id="panel-content" role="tabpanel" ?hidden=${this._tab !== 'content'}>${document ? this._document() : taxonomy ? this._taxonomy() : this._fixed()}</div>
            ${!taxonomy ? html`<div class="page" id="panel-seo" role="tabpanel" ?hidden=${this._tab !== 'seo'}>${this._box('Hiện trên Google và khi chia sẻ', ['seoTitle', 'seoDescription', 'ogImage', 'canonicalUrl', 'hideFromSearch', 'displayUpdatedDate'], 'Để trống tiêu đề và mô tả SEO thì lấy nội dung của trang.')}</div>` : nothing}`;
    }
    static styles = css`
        :host{display:block;height:100%;overflow:auto;background:#edf1f2;color:#18282b;font-family:var(--uui-font-family,Arial,sans-serif);--uui-color-selected:#e3f4f1;--uui-color-selected-contrast:#0a5e57;--uui-color-interactive:#0a5e57;--uui-color-focus:#0e7c72;--umb-property-layout-label-width:210px}
        *{box-sizing:border-box}[hidden]{display:none!important}.tabs{display:flex;gap:8px;align-items:center;background:#fff;border-bottom:1px solid #d6dfe1;padding:0 24px;position:sticky;top:0;z-index:3}.tabs button{border:0;background:transparent;font:inherit;color:#56686c;padding:16px 8px;cursor:pointer;border-bottom:3px solid transparent}.tabs [aria-selected=true]{color:#0e7c72;border-bottom-color:#0e7c72;font-weight:600}.tabs .refresh{margin-left:auto;font-size:12px}
        .tabs .close{flex-shrink:0;margin:8px 0}.page{--uui-size-layout-1:6px;max-width:1150px;margin:auto;padding:24px;display:grid;gap:16px}.box{border:1px solid #d6dfe1;border-radius:10px;background:#fff;padding:20px 24px;display:grid;gap:16px;min-width:0}.box h3{font-size:17px;font-weight:600;margin:0}.hint{font-size:13px;line-height:1.55;color:#56686c;margin:0}.box>.hint{margin-top:-7px}.notice{padding:12px 14px;background:#f5f8f8;border:1px solid #b9e2db;border-radius:6px;font-size:13px;line-height:1.6}.notice p{margin:5px 0}.notice .button{margin:8px 0 0}.button{display:inline-flex;align-items:center;text-decoration:none;color:#0a5e57;border:1px solid #afbec2;border-radius:6px;padding:7px 12px;font-size:13px;width:fit-content;background:#fff}.button:hover{background:#e3f4f1}
        .doc2{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px;align-items:start}.main,aside{display:grid;gap:16px;min-width:0}aside{position:sticky;top:72px}aside .box{padding:16px;gap:12px}aside h3{font-size:15px}.document{max-width:1440px;--umb-property-layout-label-width:0px}.document umb-content-workspace-property{--umb-property-layout-label-width:0px}.choices{display:grid;gap:7px}.choices button{text-align:left;display:grid;grid-template-columns:20px 1fr;gap:5px 8px;border:1px solid #d6dfe1;border-radius:8px;padding:10px;background:#fff;color:inherit;cursor:pointer;font:inherit}.choices b{font-size:13px;font-weight:500}.choices small{display:none;grid-column:2;color:#56686c;font-size:12px;line-height:1.5}.choices [aria-checked=true]{border-color:#0e7c72;background:#e3f4f1;box-shadow:inset 0 0 0 1px #0e7c72}.choices [aria-checked=true] small{display:block}.choices umb-icon{width:17px;height:17px}
        dl{margin:0;display:grid;gap:12px;font-size:13px}dt{font-size:12px;color:#56686c;margin-bottom:3px}dd{margin:0;line-height:1.5}.card{display:grid;gap:8px;padding:16px;border:1px solid #d6dfe1;border-radius:10px;box-shadow:0 3px 12px #1231}.card small{font-size:11px;color:#56686c}.card>small:first-child{text-transform:uppercase;color:#0a5e57;font-weight:600}.card b{font-size:20px;line-height:1.3}.card p{margin:0;font-size:13px;line-height:1.5}.bar{height:6px;border-radius:4px;background:#f5f8f8;overflow:hidden}.bar i{display:block;height:100%;background:#0e7c72}.checks{list-style:none;display:grid;gap:7px;padding:0;margin:0;font-size:13px}.checks li{display:flex;gap:8px;align-items:center}.checks span{color:#56686c}.checks .ok{color:#56686c}.checks .ok span{color:#0e7c72}.fold>summary{cursor:pointer;font-weight:500;font-size:15px}.fold small{margin-left:12px;font-size:12px;color:#56686c;font-weight:400}.fold:not([open]){display:block}.fold[open]>summary{margin-bottom:14px}.tactics{display:grid;gap:8px}.tactics>div{display:flex;align-items:center;justify-content:space-between}.tactics small{color:#56686c}.error{padding:12px 24px;color:#a62f27;background:#fff1ef}.loading{padding:24px}
        .backdrop{position:fixed;inset:60px 0 0;background:#0b3b3a55;z-index:50;border:0;width:100%;cursor:pointer}@media(max-width:1000px){.doc2{grid-template-columns:1fr}aside{position:static}.page{padding:16px}.box{padding:16px}.tabs{padding:0 16px}}@media(max-width:600px){.tabs .refresh{font-size:0}.tabs .refresh:first-letter{font-size:16px}.page{padding:10px}.box{padding:14px}.fold small{display:block;margin:4px 0 0}}
    `;
}
customElements.define('antc-risk-editor', AntcRiskEditor);
export default AntcRiskEditor;
