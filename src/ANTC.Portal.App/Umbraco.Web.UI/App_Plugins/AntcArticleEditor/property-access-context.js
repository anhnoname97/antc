import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbObjectState } from '@umbraco-cms/backoffice/observable-api';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import { UMB_CURRENT_USER_CONTEXT } from '@umbraco-cms/backoffice/current-user';
import { UmbVariantId } from '@umbraco-cms/backoffice/variant';

export const ANTC_ARTICLE_ACCESS_CONTEXT = new UmbContextToken('AntcArticlePropertyAccessContext');

// Counters, summaries and previews must honor the same guards as native fields.
class AntcArticlePropertyAccessContext extends UmbContextBase {
  #state = new UmbObjectState({ readable: {}, writable: {}, pending: true });
  state = this.#state.asObservable();
  #properties = [];
  #read = {};
  #write = {};
  #sensitive = false;
  constructor(host) {
    super(host, ANTC_ARTICLE_ACCESS_CONTEXT);
    this.consumeContext(UMB_CURRENT_USER_CONTEXT, context => {
      this.observe(context?.hasAccessToSensitiveData, allowed => { this.#sensitive = allowed === true; this.#update(); }, 'article-sensitive-access');
    });
    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, workspace => {
      this.observe(workspace?.structure.contentTypeProperties, properties => {
        for (const property of this.#properties) {
          this.removeUmbControllerByAlias(`article-read-${property.alias}`);
          this.removeUmbControllerByAlias(`article-write-${property.alias}`);
        }
        this.#properties = properties ?? [];
        this.#read = {};
        this.#write = {};
        this.#update();
        const variant = UmbVariantId.CreateInvariant(); // Article schema is invariant.
        for (const property of this.#properties) {
          this.observe(workspace.propertyViewGuard.isPermittedForVariantAndProperty(variant, property, variant), allowed => {
            this.#read[property.alias] = allowed === true; this.#update();
          }, `article-read-${property.alias}`);
          this.observe(workspace.propertyWriteGuard.isPermittedForVariantAndProperty(variant, property, variant), allowed => {
            this.#write[property.alias] = allowed === true; this.#update();
          }, `article-write-${property.alias}`);
        }
      }, 'article-access-properties');
    });
  }
  #update() {
    const readable = Object.fromEntries(this.#properties.map(property => [property.alias,
      Boolean(this.#read[property.alias] && (!property.isSensitive || this.#sensitive))]));
    this.#state.setValue({ readable, writable: { ...this.#write }, pending: !this.#properties.length
      || this.#properties.some(property => !(property.alias in this.#read) || !(property.alias in this.#write)) });
  }
  filter(document) {
    if (!document) return document;
    const readable = this.#state.getValue().readable;
    return { ...document, values: document.values?.filter(value => readable[value.alias] === true) };
  }
  canRead(alias) { return this.#state.getValue().readable[alias] === true; }
}
export { AntcArticlePropertyAccessContext as api };
