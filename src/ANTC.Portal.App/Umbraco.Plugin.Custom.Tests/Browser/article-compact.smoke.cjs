// Read-only: edits remain in browser memory. All document writes are aborted.
const { chromium, firefox, webkit } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const browserType = { chromium, firefox, webkit }[process.env.ANTC_BROWSER_ENGINE || 'chromium'];
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const id = process.env.ANTC_ARTICLE_ID || '90ab7780-e72b-4d53-ae5a-147dfb353e03';

(async () => {
  const browser = await browserType.launch({ executablePath: process.env.ANTC_BROWSER_PATH });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(20000);
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/umbraco/management/api/**', route => {
      const request = route.request();
      if (/\/document(?:\/|$)/.test(new URL(request.url()).pathname) && ['PUT', 'POST', 'PATCH', 'DELETE'].includes(request.method())) {
        writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(`${base}/umbraco`);
    await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);
    await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: /Hồ sơ người dùng|User profile/ }).waitFor({ timeout: 45000 });
    await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}`);
    const editor = page.locator('antc-article-editor');
    const publication = editor.locator('antc-article-publication-info');
    const summary = editor.locator('#summary textarea');
    const footer = page.locator('umb-document-workspace-split-view umb-workspace-footer');
    const publish = footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true });
    await editor.getByRole('button', { name: 'Đậm', exact: true }).waitFor();
    await publication.getByText('Đang xem dữ liệu đã lưu.', { exact: true }).waitFor();
    const originalSummary = await summary.inputValue();
    const setValues = values => editor.evaluate(async (element, values) => {
      const { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT } = await import('@umbraco-cms/backoffice/document');
      const dataset = await element.getContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT);
      for (const [alias, value] of Object.entries(values)) dataset.setPropertyValue(alias, value);
    }, values);
    const resize = async width => {
      await page.setViewportSize({ width, height: 1100 });
      await editor.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    assert(!(await publication.locator('details').evaluate(element => element.open)));
    assert(!(await publication.locator('.settings').isVisible()));
    await publication.locator('summary').focus();
    await page.keyboard.press('Enter');
    await publication.locator('.settings').waitFor();
    assert(await publication.locator('.history').isVisible());
    await publication.locator('summary').focus();
    await page.keyboard.press('Space');
    await publication.locator('details:not([open])').waitFor({ state: 'attached' });
    console.log('Publication status stays visible; one keyboard disclosure opens history/settings and closes again');

    await setValues({ summary: '', image: null, imageAlt: '', seoDescription: '' });
    assert(await publish.isEnabled(), 'Native action remains available; required values are checked on submit');
    assert.equal(await editor.locator('.checklist-card, .quick-fix, progress').count(), 0);
    await publication.getByText('Có thay đổi chưa lưu.', { exact: true }).waitFor();

    // Restore fixture values without saving, for screenshots of its real state.
    await page.reload();
    await summary.waitFor();
    await editor.getByRole('button', { name: 'Đậm', exact: true }).waitFor();
    assert.equal(await summary.inputValue(), originalSummary);
    const sizes = [];
    if (process.env.ANTC_SCREENSHOT_DIR) fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
    for (const width of [900, 1024, 1280, 1440, 1920]) {
      await summary.focus();
      await resize(width);
      await editor.evaluate(element => { element.shadowRoot.querySelector('.scroll-area').scrollTop = 0; });
      const compact = await editor.evaluate(element => element.clientWidth <= 900);
      assert(!(await editor.evaluate(element => element.scrollWidth > element.clientWidth + 1)));
      assert.equal(await page.locator('uui-button[data-mark^="workspace-action:"]').count(), 3);
      const paper = await editor.locator('.paper').boundingBox();
      const side = await editor.locator('aside').boundingBox();
      if (!compact) assert(side.x > paper.x + paper.width);
      for (const label of ['Lưu', 'Lưu và xuất bản', 'Lưu và xem trước']) {
        const button = await footer.getByRole('button', { name: label, exact: true }).boundingBox();
        assert(button.x >= 0 && button.x + button.width <= width + 1);
        assert(button.y + button.height <= 1100);
      }
      sizes.push({ width, compact, writingTop: paper.y, informationHeight: side.height });
      if (process.env.ANTC_SCREENSHOT_DIR && [1024, 1440].includes(width)) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `compact-${width}.png`) });
    }
    const workspace = page.locator('umb-workspace-split-view');
    await workspace.getByRole('tab', { name: 'Thông tin', exact: true }).click();
    await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).click();
    await summary.waitFor();
    assert.equal(await summary.inputValue(), originalSummary);
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ sizes, writes, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
