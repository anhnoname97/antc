import test from 'node:test';
import assert from 'node:assert/strict';
import { seoPreview, safeImageUrl } from '../../Umbraco.Web.UI/App_Plugins/AntcArticleEditor/seo-preview-model.js';

const fixture = values => ({ values: Object.entries(values).map(([alias, value]) => ({ alias, value, culture: null, segment: null })), variants: [{ name: 'Tên bài gốc', culture: null, segment: null }] });
const picker = key => [{ mediaKey: key }];

test('Empty SEO fields use name and summary without mutating the draft', () => {
  const article = fixture({ summary: 'Tóm tắt 👋', seoTitle: '  ', seoDescription: '' });
  const before = structuredClone(article);
  const result = seoPreview(article);
  assert.equal(result.title, 'Tên bài gốc');
  assert.equal(result.description, 'Tóm tắt 👋');
  assert.equal(result.descriptionLength, 9);
  assert.equal(result.hidden, false);
  assert.deepEqual(article, before);
});
test('Explicit SEO values override the fallback and preserve literal text', () => {
  const result = seoPreview(fixture({ seoTitle: '  Tên "bài" <script>  ', seoDescription: ' Mô tả riêng ', hideFromSearch: true }), fixture({ siteName: 'Tên website' }));
  assert.equal(result.title, 'Tên "bài" <script>');
  assert.equal(result.searchTitle, 'Tên "bài" <script> — Tên website');
  assert.equal(result.description, 'Mô tả riêng');
  assert.equal(result.hidden, true);
});
test('Share image falls back through resolvable media, in public-service order', () => {
  const article = fixture({ ogImage: picker('og'), image: picker('article') });
  const site = fixture({ heroImage1: picker('site') });
  assert.equal(seoPreview(article, site, [{ unique: 'site', url: '/s.jpg' }]).image.key, 'site');
  assert.equal(seoPreview(article, site, [{ unique: 'article', url: '/a.jpg' }, { unique: 'site', url: '/s.jpg' }]).image.key, 'article');
  assert.equal(seoPreview(article, site, [{ unique: 'og', url: '/o.jpg' }, { unique: 'article', url: '/a.jpg' }]).image.key, 'og');
  assert.equal(seoPreview(article, site, []).image, null);
});
test('Missing and malformed picker values do not break a new article', () => {
  const result = seoPreview(fixture({ ogImage: [null], image: '{}' }));
  assert.equal(result.image, null);
  assert(result.candidates.every(candidate => candidate.key === null));
  assert.equal(seoPreview().title, '');
});
test('Image URLs accept HTTP(S) and reject executable or malformed schemes', () => {
  assert.equal(safeImageUrl('/media/a.jpg', 'https://example.test'), 'https://example.test/media/a.jpg');
  assert.equal(safeImageUrl('https://cdn.example/a.jpg', 'https://example.test'), 'https://cdn.example/a.jpg');
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,x', 'file:///a.jpg', 'http://[', '', null]) {
    assert.equal(safeImageUrl(url, 'https://example.test'), null);
  }
});
