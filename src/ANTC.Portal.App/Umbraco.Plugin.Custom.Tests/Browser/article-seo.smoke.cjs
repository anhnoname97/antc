const { chromium, firefox, webkit } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const browserType = { chromium, firefox, webkit }[process.env.ANTC_BROWSER_ENGINE || 'chromium'];
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const write = process.env.ANTC_ALLOW_ISOLATED_WRITES === '1';
if (write && new URL(base).port !== '11123') throw Error('Write tests require an isolated host on port 11123.');
const id = process.env.ANTC_ARTICLE_ID || '90ab7780-e72b-4d53-ae5a-147dfb353e03';
const image1 = 'd2aa41d7-969b-5bcf-9465-283081375b20';
const image2 = 'cea052a3-036b-5603-a34b-70d99097b297';

(async () => {
  const browser = await browserType.launch({ executablePath: process.env.ANTC_BROWSER_PATH });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(20000);
    const errors = [], contentWrites = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/umbraco/management/api/**', route => {
      const req = route.request();
      if (/\/document(?:\/|$)/.test(new URL(req.url()).pathname) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method())) {
        contentWrites.push(`${req.method()} ${new URL(req.url()).pathname}`);
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
    const search = editor.locator('antc-article-seo-preview.search-preview');
    const share = editor.locator('#seo .seo-share-inline antc-article-seo-preview[mode=share]');
    const title = editor.locator('umb-content-workspace-property[alias=seoTitle] input');
    const description = editor.locator('umb-content-workspace-property[alias=seoDescription] textarea');
    await editor.getByRole('button', { name: 'Đậm', exact: true }).waitFor();
    await editor.getByRole('tab', { name: 'SEO và chia sẻ', exact: true }).click();
    await title.waitFor();
    const originalSummary = await editor.locator('#summary textarea').inputValue();
    const setValues = values => editor.evaluate(async (element, values) => {
      const { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT } = await import('@umbraco-cms/backoffice/document');
      const dataset = await element.getContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT);
      for (const [alias, value] of Object.entries(values)) dataset.setPropertyValue(alias, value);
    }, values);
    await setValues({ image: [], ogImage: [], hideFromSearch: false });
    await title.fill('');
    await description.fill('');
    await search.locator('.source').getByText('Đang dùng tên bài viết. Đang dùng phần tóm tắt.', { exact: true }).waitFor();
    assert((await search.locator('.description').innerText()).includes(originalSummary));
    await share.locator('.image-source').getByText('Đang dùng: ảnh mặc định của website.', { exact: true }).waitFor();
    assert(await share.locator('img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
    const fallback = await share.locator('img').getAttribute('src');
    console.log('Published site settings and default share image resolved');

    const picker = key => [{ key: crypto.randomUUID(), mediaKey: key, crops: [], focalPoint: null }];
    await setValues({ image: picker(image1) });
    await share.locator('.image-source').getByText('Đang dùng: ảnh đại diện của bài.', { exact: true }).waitFor();
    await setValues({ ogImage: picker(image2) });
    await share.locator('.image-source').getByText('Đang dùng: ảnh khi chia sẻ.', { exact: true }).waitFor();
    const explicitImage = await share.locator('img').getAttribute('src');
    assert.notEqual(explicitImage, fallback);
    await setValues({ ogImage: [] });
    await share.locator('.image-source').getByText('Đang dùng: ảnh đại diện của bài.', { exact: true }).waitFor();
    await setValues({ image: [] });
    await share.locator('.image-source').getByText('Đang dùng: ảnh mặc định của website.', { exact: true }).waitFor();

    const literal = 'Hướng dẫn "an toàn" <img src=x onerror="window.__antcSeoInjected=1">';
    await title.fill(literal);
    await description.fill('Mô tả riêng có dấu < > & " để kiểm tra hiển thị và metadata.');
    await share.locator('.share-title').getByText(literal, { exact: true }).waitFor();
    assert.equal(await share.locator('.share-title img').count(), 0);
    assert.equal(await page.evaluate(() => window.__antcSeoInjected), undefined);
    await editor.locator('umb-content-workspace-property[alias=hideFromSearch] uui-toggle').click();
    await search.locator('.warning').waitFor();
    await editor.locator('umb-content-workspace-property[alias=hideFromSearch] uui-toggle').click();
    await search.locator('.warning').waitFor({ state: 'detached' });
    await title.fill('5 dấu hiệu nhận biết cuộc gọi giả mạo');
    await description.fill('Nhận diện những dấu hiệu đáng ngờ và cách kiểm tra thông tin trước khi chuyển tiền.');
    await setValues({ image: picker(image1), imageAlt: 'Ảnh minh họa giao dịch tài chính.', ogImage: picker(image2) });
    await share.locator('.image-source').getByText('Đang dùng: ảnh khi chia sẻ.', { exact: true }).waitFor();

    const workspace = page.locator('umb-workspace-split-view');
    await workspace.getByRole('tab', { name: 'Thông tin', exact: true }).click();
    await page.locator('umb-document-workspace-view-info').waitFor();
    await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).click();
    await editor.getByRole('tab', { name: 'SEO và chia sẻ', exact: true }).click();
    await share.locator('.share-title').getByText('5 dấu hiệu nhận biết cuộc gọi giả mạo', { exact: true }).waitFor();

    if (process.env.ANTC_SCREENSHOT_DIR) fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
    const layouts = [];
    for (const width of [1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await editor.evaluate(el => { el.shadowRoot.querySelector('.scroll-area').scrollTop = 0; });
      const overflow = await editor.evaluate(el => ({ page: document.documentElement.scrollWidth > innerWidth + 1,
        editor: el.shadowRoot.querySelector('.scroll-area').scrollWidth > el.clientWidth + 1 }));
      assert(!overflow.page && !overflow.editor);
      if (width > 1024) assert(await editor.locator('.side-stack').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight - 54), 'Sidebar must remain above the native footer');
      layouts.push({ width, ...overflow });
      if (process.env.ANTC_SCREENSHOT_DIR && [1024, 1440].includes(width)) {
        await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `article-seo-share-${width}.png`) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await share.scrollIntoViewIfNeeded();
    assert(await share.isVisible());
    await search.scrollIntoViewIfNeeded();
    if (process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'article-seo-search-1440.png') });
    await page.setViewportSize({ width: 1024, height: 1100 });
    await editor.locator('.seo-share-inline antc-article-seo-preview img').scrollIntoViewIfNeeded();
    assert(await editor.locator('.seo-share-inline').isVisible());
    if (process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'article-seo-search-1024.png') });
    await page.setViewportSize({ width: 1440, height: 1100 });
    assert.deepEqual(contentWrites, [], 'Preview and native tab changes must not save');
    console.log('Live SEO fields, literal text, fallback order, native tabs and responsive layout passed');

    if (write) {
      const footer = page.locator('umb-document-workspace-split-view umb-workspace-footer');
      const published = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}/update-and-publish`) && r.ok());
      await footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true }).click();
      await published;
      const article = await (await page.request.get(`${base}/api/v1/articles/${id}`)).json();
      const publicPage = await browser.newPage();
      await publicPage.goto(new URL(article.url, base).href);
      const meta = property => publicPage.locator(`meta[property="${property}"]`).getAttribute('content');
      assert.equal(await meta('og:title'), article.seo.title);
      assert.equal(await meta('og:description'), article.seo.description);
      assert.equal(await meta('og:image'), new URL(article.seo.image.url, base).href);
      assert.equal(await meta('og:url'), new URL(article.url, base).href);
      assert.equal(await meta('og:type'), 'article');
      assert.equal(await publicPage.locator('meta[name=twitter\\:card]').getAttribute('content'), 'summary_large_image');
      assert.equal(await publicPage.locator('meta[name=description]').getAttribute('content'), article.seo.description);
      console.log('Published Open Graph values match the real article API');
      await title.fill(literal);
      await description.fill('Mô tả "đặc biệt" < > & an toàn.');
      await setValues({ hideFromSearch: true });
      const republished = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}/update-and-publish`) && r.ok());
      await footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true }).click();
      await republished;
      await publicPage.reload();
      assert.equal(await meta('og:title'), literal);
      assert.equal(await meta('og:description'), 'Mô tả "đặc biệt" < > & an toàn.');
      assert.equal(await publicPage.locator('meta[name=robots]').getAttribute('content'), 'noindex, follow');
      assert.equal(await publicPage.evaluate(() => window.__antcSeoInjected), undefined);
      assert.equal(await publicPage.locator('head img').count(), 0);
      console.log('Public metadata safely encodes quotes/markup and preserves noindex');
      await publicPage.close();
    } else {
      await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}/invariant/view/compose`);
      await editor.locator('#summary textarea').waitFor();
      assert.equal(await editor.locator('#summary textarea').inputValue(), originalSummary);
      assert.deepEqual(contentWrites, []);
    }
    const parentKey = await editor.evaluate(async (element, id) => {
      const { UmbDocumentItemRepository } = await import('@umbraco-cms/backoffice/document');
      const repository = new UmbDocumentItemRepository(element);
      try { return (await repository.requestItems([id])).data[0].parent.unique; }
      finally { repository.destroy(); }
    }, id);
    await page.goto(`${base}/umbraco/section/content/workspace/document/create/parent/document/${parentKey}/3f9aac4c-9214-408f-8bb9-bedd2f37319b`);
    await editor.getByRole('tab', { name: 'SEO và chia sẻ', exact: true }).click();
    await share.locator('.image-source').getByText('Đang dùng: ảnh mặc định của website.', { exact: true }).waitFor();
    assert.equal(await share.locator('.share-title').innerText(), 'Chưa có tiêu đề');
    if (!write) assert.deepEqual(contentWrites, []);
    console.log('New unsaved article resolves published site fallback without saving');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ write, layouts, contentWrites, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
