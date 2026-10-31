// Writes to an explicitly isolated host only: creates a block, saves and publishes
// the selected fixture article. Never run against the user's main local host.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL;
if (process.env.ANTC_ALLOW_ISOLATED_WRITES !== '1' || !base || new URL(base).port !== '11123') {
  throw Error('Requires ANTC_ALLOW_ISOLATED_WRITES=1 and an isolated host on port 11123.');
}
const id = process.env.ANTC_ARTICLE_ID || '90ab7780-e72b-4d53-ae5a-147dfb353e03';
const text = 'Không cung cấp mã OTP cho người khác.\nKiểm tra thông tin qua kênh chính thức.';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.ANTC_BROWSER_PATH });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/umbraco`);
    await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);
    await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: /Hồ sơ người dùng/ }).waitFor();
    await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}`);
    const editor = page.locator('antc-article-editor');
    const body = editor.locator('#body [contenteditable=true]');
    await body.waitFor();
    // BO-19 fixtures must meet publication requirements; writes stay on the copied DB.
    const imageAlt = editor.locator('#image umb-content-workspace-property[alias=imageAlt] input');
    if (await imageAlt.count()) {
      await editor.evaluate(async element => {
        const { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT } = await import('@umbraco-cms/backoffice/document');
        const dataset = await element.getContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT);
        dataset.setPropertyValue('image', [{ key: crypto.randomUUID(), mediaKey: 'd2aa41d7-969b-5bcf-9465-283081375b20', crops: [] }]);
      });
      await imageAlt.fill('Ảnh minh họa giao dịch tài chính qua điện thoại.');
      await editor.locator('#summary textarea').fill('Tóm tắt bài kiểm tra Hộp lưu ý.');
    }
    await body.fill('Nội dung kiểm tra Hộp lưu ý.');
    await editor.getByRole('button', { name: 'Hộp lưu ý', exact: true }).click();
    const noticeField = page.getByRole('textbox', { name: 'Trường cho Nội dung lưu ý', exact: true });
    await noticeField.waitFor();
    const blockEditor = page.locator('umb-block-workspace-editor');
    await blockEditor.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    assert(await noticeField.isVisible(), 'An empty notice must keep the editor open');
    await noticeField.fill(text);
    await blockEditor.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    const preview = editor.locator('antc-article-notice-preview');
    await preview.waitFor();
    assert.equal(await preview.locator('p').innerText(), text);
    const words = `Nội dung kiểm tra Hộp lưu ý. ${text}`.trim().split(/\s+/u).length;
    await editor.locator('#body .count').getByText(`${words} từ`, { exact: true }).waitFor();
    console.log('Notice created through native modal');

    const saved = page.waitForResponse(response => response.request().method() === 'PUT'
      && new URL(response.url()).pathname.endsWith(`/document/${id}`) && response.ok());
    await page.locator('umb-document-workspace-split-view umb-workspace-footer').getByRole('button', { name: 'Lưu', exact: true }).click();
    await saved;
    await page.reload();
    await preview.waitFor();
    assert.equal(await preview.locator('p').innerText(), text);
    console.log('Draft reload retained notice');
    if (process.env.ANTC_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
      await editor.locator('#body').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'article-notice-editor-1440.png') });
    }
    const published = page.waitForResponse(response => response.request().method() === 'PUT'
      && new RegExp(`/document/${id}/(?:publish|update-and-publish)$`).test(new URL(response.url()).pathname) && response.ok());
    await page.locator('umb-document-workspace-split-view umb-workspace-footer').getByRole('button', { name: 'Lưu và xuất bản', exact: true }).click();
    await published;
    const response = await page.request.get(`${base}/api/v1/articles/${id}`);
    assert(response.ok(), `Published article API returned ${response.status()}`);
    const article = await response.json();
    assert(article.bodyHtml.includes('class="antc-article-notice"'));
    assert(article.bodyHtml.includes('Không cung cấp mã OTP'));
    assert(!article.bodyHtml.includes('umb-rte-block'));
    console.log('Publish rendered notice through the real block partial and sanitizer');

    const publicPage = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    publicPage.on('pageerror', error => errors.push(error.message));
    const result = await publicPage.goto(new URL(article.url, base).href);
    assert(result.ok());
    const notice = publicPage.locator('.article-body .antc-article-notice');
    await notice.waitFor();
    assert.equal(await notice.locator('p').innerText(), text);
    const layouts = [];
    for (const width of [390, 1280, 1920]) {
      await publicPage.setViewportSize({ width, height: 1000 });
      await notice.scrollIntoViewIfNeeded();
      const layout = await notice.evaluate(element => {
        const box = element.getBoundingClientRect();
        const css = getComputedStyle(element);
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1,
          withinViewport: box.left >= 0 && box.right <= innerWidth,
          background: css.backgroundColor, border: css.borderLeftColor };
      });
      assert(!layout.overflow);
      assert(layout.withinViewport);
      assert.equal(layout.background, 'rgb(227, 244, 241)');
      layouts.push({ width, ...layout });
      if (process.env.ANTC_SCREENSHOT_DIR) await publicPage.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `article-notice-public-${width}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ draftReload: true, published: true, publicUrl: article.url, layouts, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
