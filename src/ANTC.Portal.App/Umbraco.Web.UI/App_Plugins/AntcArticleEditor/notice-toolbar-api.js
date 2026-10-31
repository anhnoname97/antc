import { UmbTiptapToolbarElementApiBase } from '@umbraco-cms/backoffice/tiptap';
import { UMB_BLOCK_RTE_ENTRIES_CONTEXT } from '@umbraco-cms/backoffice/block-rte';

// Use the native block creation modal and native undo/data handling.
export default class AntcArticleNoticeToolbarApi extends UmbTiptapToolbarElementApiBase {
  #entries;
  constructor(host) {
    super(host);
    this.consumeContext(UMB_BLOCK_RTE_ENTRIES_CONTEXT, context => { this.#entries = context; });
  }
  isActive(editor) { return editor?.isActive('umbRteBlock') === true; }
  execute() {
    const path = this.#entries?.getPathForCreateBlock();
    if (path) window.history.pushState({}, '', `${path}modal/umb-modal-workspace/create/7356c35e-1c95-4a33-8d3a-22c01c2bda18`);
  }
}
