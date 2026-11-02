import test from 'node:test';
import assert from 'node:assert/strict';
import { publicArticleUrl, resolvedArticleUrl, publicationDate, publicationLabel, isPublished } from '../../Umbraco.Web.UI/App_Plugins/AntcArticleEditor/publication-model.js';

test('Public links reject messages, executable schemes and embedded credentials', () => {
  for (const raw of [null, '', '#not-published', 'No URL', 'javascript:alert(1)', 'data:text/html,x', 'file:///a', 'https://user:secret@example.test/a', 'http://[']) {
    assert.equal(publicArticleUrl(raw, 'https://example.test'), null);
  }
  assert.equal(publicArticleUrl('/thu-doan/bai-viet/', 'https://example.test'), 'https://example.test/thu-doan/bai-viet/');
  assert.equal(publicArticleUrl('https://public.example/bai-viet/', 'http://localhost:11000'), 'https://public.example/bai-viet/');
});
test('Saved unpublished schedules are not treated as public articles', () => {
  const scheduled = { state: 'Draft', scheduledPublishDate: '2026-10-28T10:00:00Z' };
  assert.equal(publicationLabel(scheduled, false), 'Đã hẹn xuất bản');
  assert.equal(isPublished(scheduled), false);
  assert.equal(isPublished({ state: 'PublishedPendingChanges' }), true);
  assert.equal(publicationLabel(undefined, true), 'Bài chưa được tạo');
});
test('Dates with UTC or explicit offsets refer to the same Vietnam time', () => {
  assert.equal(publicationDate('2026-10-28T10:03:00Z'), '28/10/2026 17:03');
  assert.equal(publicationDate('2026-10-28T17:03:00+07:00'), '28/10/2026 17:03');
  assert.equal(publicationDate('bad-date'), null);
  assert.equal(publicationDate(null), null);
});
test('Invariant articles can receive URLs tagged with the default CMS language', () => {
  const items = [{ unique: 'article', urls: [{ culture: 'en-US', url: '/thu-doan/bai-viet/' }] }];
  assert.equal(resolvedArticleUrl(items, 'article', 'https://example.test'), 'https://example.test/thu-doan/bai-viet/');
  assert.equal(resolvedArticleUrl(items, 'another', 'https://example.test'), null);
});
