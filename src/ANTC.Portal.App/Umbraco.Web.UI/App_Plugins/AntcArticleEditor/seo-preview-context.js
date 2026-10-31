import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbObjectState } from '@umbraco-cms/backoffice/observable-api';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT, UmbDocumentTreeRepository, UmbDocumentPublishingRepository } from '@umbraco-cms/backoffice/document';
import { UmbMediaUrlRepository } from '@umbraco-cms/backoffice/media';
import { seoPreview, safeImageUrl } from './seo-preview-model.js?v=0.5.0';
import { ANTC_ARTICLE_ACCESS_CONTEXT } from './property-access-context.js?v=0.9.0';

export const ANTC_SEO_PREVIEW_CONTEXT = new UmbContextToken('AntcArticleSeoPreviewContext');
class AntcSeoPreviewContext extends UmbContextBase {
  #state = new UmbObjectState({ ...seoPreview(), pending: true });
  state = this.#state.asObservable();
  #tree = new UmbDocumentTreeRepository(this);
  #publishing = new UmbDocumentPublishingRepository(this);
  #media = new UmbMediaUrlRepository(this);
  #document;
  #site;
  #urls = [];
  #workspace;
  #documentKey;
  #siteGeneration = 0;
  #imageGeneration = 0;
  #imageStamp;
  #sitePending = true;
  #imagePending = false;
  #siteUnavailable = false;
  #access;

  constructor(host) {
    super(host, ANTC_SEO_PREVIEW_CONTEXT);
    this.consumeContext(ANTC_ARTICLE_ACCESS_CONTEXT, context => {
      this.#access = context;
      this.observe(context?.state, () => { this.#loadImages(); this.#update(); }, 'article-seo-access');
    });
    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, workspace => {
      this.#workspace = workspace;
      this.observe(workspace?.data, document => {
        this.#document = document;
        if (document?.unique && document.unique !== this.#documentKey) this.#loadSite(document.unique);
        this.#loadImages();
        this.#update();
      }, 'antc-seo-document');
    });
  }

  async #loadSite(key) {
    this.#documentKey = key;
    const generation = ++this.#siteGeneration;
    this.#site = undefined;
    this.#sitePending = true;
    this.#siteUnavailable = false;
    try {
      const unique = this.#workspace.getIsNew() ? this.#workspace._internal_getCreateUnderParent()?.unique : key;
      if (!unique) return;
      const { data } = await this.#tree.requestTreeItemAncestors({ treeItem: { unique, entityType: 'document' } });
      const root = data?.find(item => item.documentType.unique === 'c440e1bd-e423-5094-a5ed-9e6224caaea1');
      if (!root) return;
      // Use published settings, matching the public article service, even if the root has draft edits.
      const { data: site } = await this.#publishing.published(root.unique);
      if (generation === this.#siteGeneration) this.#site = site;
    } catch {
      // The native repositories handle permissions and report read errors.
    } finally {
      if (generation === this.#siteGeneration) {
        this.#sitePending = false;
        this.#siteUnavailable = !this.#site;
        this.#loadImages();
        this.#update();
      }
    }
  }

  async #loadImages() {
    const keys = [...new Set(seoPreview(this.#visibleDocument(), this.#site).candidates.map(candidate => candidate.key).filter(Boolean))];
    const stamp = keys.join(',');
    if (stamp === this.#imageStamp) return;
    this.#imageStamp = stamp;
    const generation = ++this.#imageGeneration;
    this.removeUmbControllerByAlias('antc-seo-image-urls');
    this.#urls = [];
    this.#imagePending = keys.length > 0;
    if (!keys.length) return;
    try {
      const { data, asObservable } = await this.#media.requestItems(keys);
      if (generation !== this.#imageGeneration) return;
      const setUrls = items => {
        this.#urls = (items ?? []).map(item => ({ ...item, url: safeImageUrl(item.url, window.location.origin) }));
        this.#update();
      };
      setUrls(data);
      this.observe(asObservable(), items => {
        if (generation === this.#imageGeneration) setUrls(items);
      }, 'antc-seo-image-urls');
    } catch {
      // Keep a clear placeholder when a media URL cannot be resolved.
    } finally {
      if (generation === this.#imageGeneration) {
        this.#imagePending = false;
        this.#update();
      }
    }
  }

  #update() {
    this.#state.setValue({ ...seoPreview(this.#visibleDocument(), this.#site, this.#urls),
      restricted: ['seoTitle', 'seoDescription', 'summary', 'image', 'ogImage', 'hideFromSearch'].some(alias => !this.#access?.canRead(alias)),
      pending: this.#sitePending || this.#imagePending, siteUnavailable: this.#siteUnavailable });
  }
  #visibleDocument() { return this.#access?.filter(this.#document) ?? (this.#document ? { ...this.#document, values: [] } : undefined); }

  destroy() {
    ++this.#siteGeneration;
    ++this.#imageGeneration;
    super.destroy();
  }
}
export { AntcSeoPreviewContext as api };
