import { UmbTiptapToolbarElementApiBase } from '@umbraco-cms/backoffice/tiptap';

// Only paragraph/heading commands are needed here. The generic style menu also
// calls class/id commands, whose HTML extensions are intentionally not enabled.
export default class AntcArticleParagraphToolbarApi extends UmbTiptapToolbarElementApiBase {
  isActive(editor, item) {
    const tag = item?.data?.tag;
    return tag === 'p' ? editor?.isActive('paragraph') === true
      : ['h2', 'h3'].includes(tag) && editor?.isActive('heading', { level: Number(tag[1]) }) === true;
  }
  execute(editor, item) {
    const tag = item?.data?.tag;
    if (tag === 'p') editor?.chain().focus().setParagraph().run();
    else if (['h2', 'h3'].includes(tag)) editor?.chain().focus().setHeading({ level: Number(tag[1]) }).run();
  }
}
