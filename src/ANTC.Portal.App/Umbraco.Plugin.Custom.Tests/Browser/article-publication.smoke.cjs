const { chromium, firefox, webkit } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const browserType = { chromium, firefox, webkit }[process.env.ANTC_BROWSER_ENGINE || 'chromium'];
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const write = process.env.ANTC_ALLOW_ISOLATED_WRITES === '1';
if (write && new URL(base).port !== '11123') throw Error('Writes require the copied database on port 11123.');
const id = process.env.ANTC_ARTICLE_ID || '90ab7780-e72b-4d53-ae5a-147dfb353e03';

(async () => {
  const browser = await browserType.launch({ executablePath: process.env.ANTC_BROWSER_PATH });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/umbraco/management/api/**', route => {
      const request = route.request();
      if (/\/document(?:\/|$)/.test(new URL(request.url()).pathname) && ['PUT', 'POST', 'PATCH', 'DELETE'].includes(request.method())) {
        writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
        if (!write) return route.abort();
      }
      return route.continue();
    });
    await page.goto(`${base}/umbraco`);
    await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);
    await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: /Hồ sơ người dùng/ }).waitFor();
    await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}`);
    const editor = page.locator('antc-article-editor');
    const publication = editor.locator('antc-article-publication-info');
    const openPublication = async () => {
      if (!(await publication.locator('details').evaluate(element => element.open))) await publication.locator('summary').click();
    };
    const summary = editor.locator('#summary textarea');
    await editor.getByRole('button', { name: 'Đậm', exact: true }).waitFor();
    await publication.getByText('Đang xem dữ liệu đã lưu.', { exact: true }).waitFor();
    const originalSummary = await summary.inputValue();
    const setValues = values => editor.evaluate(async (element, values) => {
      const { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT } = await import('@umbraco-cms/backoffice/document');
      const dataset = await element.getContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT);
      for (const [alias, value] of Object.entries(values)) dataset.setPropertyValue(alias, value);
    }, values);
    await publication.locator('summary').click();
    await publication.getByText('Đang tải…', { exact: true }).waitFor({ state: 'detached' });
    const actor = await publication.evaluate(element => element._actor);
    assert(actor?.length, 'Native audit should resolve the real actor for the fixture');
    const savedAt = await publication.locator('details time').first().getAttribute('datetime');
    await summary.fill('Thay đổi chưa lưu để kiểm tra trạng thái bài viết.');
    await publication.getByText('Có thay đổi chưa lưu.', { exact: true }).waitFor();
    assert.equal(await publication.locator('details time').first().getAttribute('datetime'), savedAt);
    await setValues({ showOnHome: true, hideFromSearch: true });
    assert((await publication.locator('.settings').innerText()).includes('Trang chủ: Bật'));
    assert((await publication.locator('.settings').innerText()).includes('Tìm kiếm: Ẩn'));
    const workspace = page.locator('umb-workspace-split-view');
    await workspace.getByRole('tab', { name: 'Thông tin', exact: true }).click();
    await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).click();
    await openPublication();
    await publication.getByText('Có thay đổi chưa lưu.', { exact: true }).waitFor();
    await summary.fill(originalSummary);
    if (process.env.ANTC_SCREENSHOT_DIR) fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
    const layouts = [];
    for (const width of [1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await editor.evaluate(element => { element.shadowRoot.querySelector('.scroll-area').scrollTop = 0; });
      const overflow = await editor.evaluate(element => document.documentElement.scrollWidth > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1);
      assert(!overflow);
      layouts.push({ width, overflow });
      if (process.env.ANTC_SCREENSHOT_DIR && [1024, 1440].includes(width)) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `publication-draft-${width}.png`) });
    }
    assert.deepEqual(writes, []);
    console.log('Native history, dirty state, saved date, live settings, native tabs and four widths passed');

    if (write) {
      await page.setViewportSize({ width: 1440, height: 1100 });
      await setValues({ summary: 'Bài kiểm tra thông tin xuất bản.', hideFromSearch: false,
        image: [{ key: crypto.randomUUID(), mediaKey: 'd2aa41d7-969b-5bcf-9465-283081375b20', crops: [] }],
        imageAlt: 'Ảnh minh họa giao dịch tài chính.' });
      const footer = page.locator('umb-document-workspace-split-view umb-workspace-footer');
      const published = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}/update-and-publish`) && r.ok());
      await footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true }).click();
      await published;
      const link = publication.getByRole('link', { name: 'Mở bài đã xuất bản (tab mới)', exact: true });
      await link.waitFor();
      await publication.getByText('Đang xem dữ liệu đã lưu.', { exact: true }).waitFor();
      const url = await link.getAttribute('href');
      const article = await (await page.request.get(`${base}/api/v1/articles/${id}`)).json();
      assert.equal(new URL(url).pathname, article.url);
      assert((await page.request.get(url)).ok());
      await publication.getByRole('button', { name: 'Sao chép đường dẫn', exact: true }).click();
      await publication.getByText('Đã sao chép đường dẫn.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), url);
      const popupPromise = context.waitForEvent('page');
      await link.click();
      const popup = await popupPromise;
      await popup.waitForLoadState();
      assert.equal(new URL(popup.url()).pathname, article.url);
      await popup.close();
      await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw Error('Clipboard denied in test'); }; });
      await publication.getByRole('button', { name: 'Sao chép đường dẫn', exact: true }).click();
      await publication.getByText(/Không thể tự sao chép/).waitFor();
      await summary.fill('Bản nháp thay đổi, chưa xuất bản lại.');
      assert.equal(await link.getAttribute('href'), url);
      await publication.getByText('Đường dẫn mở bản đã xuất bản.', { exact: true }).waitFor();
      const saved = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}`) && r.ok());
      await footer.getByRole('button', { name: 'Lưu', exact: true }).click();
      await saved;
      await publication.getByText('Đang xem dữ liệu đã lưu.', { exact: true }).waitFor();
      await link.waitFor();
      if (process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'publication-published-1440.png') });
      console.log('Publish, actual public URL, copy/open, clipboard failure and saved pending changes passed');

      const api = (operation, schedule) => page.evaluate(async ({ id, operation, schedule }) => {
        const { DocumentService } = await import('@umbraco-cms/backoffice/external/backend-api');
        const result = operation === 'unpublish'
          ? await DocumentService.putDocumentByIdUnpublish({ path: { id }, body: { cultures: null } })
          : await DocumentService.putDocumentByIdPublish({ path: { id }, body: { publishSchedules: [{ culture: null, schedule }] } });
        return result.response.status;
      }, { id, operation, schedule });
      assert.equal(await api('unpublish'), 200);
      await page.reload();
      await publication.locator('summary').waitFor();
      await openPublication();
      await publication.locator('.url-message').getByText('Bài chưa công khai; đường dẫn xuất hiện sau khi xuất bản.', { exact: true }).waitFor();
      assert.equal(await publication.locator('a').count(), 0);
      const future = new Date(Date.now() + 3600000).toISOString();
      assert.equal(await api('schedule', { publishTime: future, unpublishTime: new Date(Date.now() + 7200000).toISOString() }), 200);
      await page.reload();
      await publication.locator('summary').waitFor();
      await openPublication();
      await publication.getByText('Đã hẹn xuất bản', { exact: true }).waitFor();
      assert.equal(await publication.locator('a').count(), 0);
      assert.equal(await publication.locator('.schedule time').count(), 2);
      if (process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'publication-scheduled-1440.png') });
      console.log('Unpublish removes the link; scheduled publish and unpublish show saved dates without a fake live URL');
    } else {
      await page.reload();
      await summary.waitFor();
      assert.equal(await summary.inputValue(), originalSummary);
      assert.deepEqual(writes, []);
      const parent = await editor.evaluate(async (element, id) => {
        const { UmbDocumentItemRepository } = await import('@umbraco-cms/backoffice/document');
        const repository = new UmbDocumentItemRepository(element);
        try { return (await repository.requestItems([id])).data[0].parent.unique; } finally { repository.destroy(); }
      }, id);
      await page.goto(`${base}/umbraco/section/content/workspace/document/create/parent/document/${parent}/3f9aac4c-9214-408f-8bb9-bedd2f37319b`);
      await publication.getByText('Bài chưa được tạo', { exact: true }).waitFor();
      assert.equal(await publication.locator('a, .copy-url, .history').count(), 0);
      assert.deepEqual(writes, []);
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ write, actor, layouts, writes, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
