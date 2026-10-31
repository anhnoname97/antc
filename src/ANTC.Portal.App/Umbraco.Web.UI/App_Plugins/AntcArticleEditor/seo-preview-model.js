const text = value => typeof value === 'string' ? value.trim() : '';
export const invariantValue = (document, alias) => document?.values?.find(value => value.alias === alias && !value.culture && !value.segment)?.value;
export const imageKey = value => Array.isArray(value) && value.length === 1 && typeof value[0]?.mediaKey === 'string' ? value[0].mediaKey : null;

// Mirrors ArticleContentSource.Seo and _SiteLayout; previews never persist fallback values.
export function seoPreview(document, site, media = []) {
  const name = document?.variants?.find(variant => !variant.culture && !variant.segment)?.name ?? '';
  const title = text(invariantValue(document, 'seoTitle')) || name;
  const description = text(invariantValue(document, 'seoDescription')) || invariantValue(document, 'summary') || '';
  const siteName = invariantValue(site, 'siteName') ?? 'antoantaichinh.vn';
  const candidates = [
    { key: imageKey(invariantValue(document, 'ogImage')), source: 'Ảnh khi chia sẻ' },
    { key: imageKey(invariantValue(document, 'image')), source: 'Ảnh đại diện của bài' },
    { key: imageKey(invariantValue(site, 'heroImage1')), source: 'Ảnh mặc định của website' },
  ];
  const selected = candidates.map(candidate => ({ ...candidate, url: media.find(item => item.unique === candidate.key)?.url }))
    .find(candidate => candidate.url);
  return { title, searchTitle: `${title} — ${siteName}`, description, siteName,
    titleSource: text(invariantValue(document, 'seoTitle')) ? 'Đang dùng tiêu đề SEO.' : 'Đang dùng tên bài viết.',
    descriptionSource: text(invariantValue(document, 'seoDescription')) ? 'Đang dùng mô tả SEO.' : 'Đang dùng phần tóm tắt.',
    titleLength: Array.from(title).length, descriptionLength: Array.from(description).length,
    hidden: Boolean(invariantValue(document, 'hideFromSearch')), image: selected ?? null, candidates };
}

export function safeImageUrl(value, origin) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
