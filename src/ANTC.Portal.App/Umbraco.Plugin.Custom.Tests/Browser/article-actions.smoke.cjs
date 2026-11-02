// Native action integration. Writes/preview only on an isolated database copy.
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
    const footer = page.locator('umb-document-workspace-split-view umb-workspace-footer');
    const summary = editor.locator('#summary textarea');
    const name = page.locator('umb-document-workspace-split-view-variant-selector uui-input input');
    const publication = editor.locator('antc-article-publication-info');
    const openPublication = async () => {
      if (!(await publication.locator('details').evaluate(element => element.open))) await publication.locator('summary').click();
    };
    const save = footer.getByRole('button', { name: 'Lưu', exact: true });
    const publish = footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true });
    await editor.getByRole('button', { name: 'Đậm', exact: true }).waitFor();
    await save.waitFor();
    await publication.getByText('Đang xem dữ liệu đã lưu.', { exact: true }).waitFor();
    const originalSummary = await summary.inputValue();
    const originalName = await name.inputValue();
    const labels = await footer.locator('uui-button[data-mark^="workspace-action:"]').evaluateAll(buttons => buttons.map(button => button.label));
    assert.equal(labels.length, 3);
    assert(labels[0].includes('xem trước'), labels.join(', '));
    const preview = footer.getByRole('button', { name: labels[0], exact: true });
    assert.equal(await editor.locator('.action-bar, umb-extension-with-api-slot[type="workspaceAction"]').count(), 0);
    assert.equal(await page.locator('uui-button[data-mark^="workspace-action:"]').count(), 3, 'Only the native footer owns article actions');
    assert(await publish.isEnabled());
    assert.equal(await footer.locator('[data-mark="workspace-action:Antc.WorkspaceAction.Article.Publish"]').count(), 0);
    assert.equal(await footer.locator('[data-mark="workspace-action:Umb.WorkspaceAction.Document.SaveAndPublish"]').count(), 1);
    await preview.focus();
    let reachedSave = false;
    for (let index = 0; index < 6 && !reachedSave; index++) {
      await page.keyboard.press('Tab');
      reachedSave = await save.evaluate(button => button.matches(':focus-within'));
    }
    assert(reachedSave, 'Save is reachable by keyboard, including native menu triggers');
    await name.fill('Tiêu đề kiểm tra giao diện, chưa lưu');
    await editor.getByRole('heading', { name: 'Tiêu đề kiểm tra giao diện, chưa lưu', exact: true }).waitFor();
    await name.fill(originalName);
    if (process.env.ANTC_SCREENSHOT_DIR) fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
    for (const width of [1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await editor.evaluate(element => { element.shadowRoot.querySelector('.scroll-area').scrollTop = 0; });
      assert(!(await editor.evaluate(element => element.scrollWidth > element.clientWidth + 1)));
      const box = await footer.boundingBox();
      assert(box.y >= 0 && box.x >= 0 && box.x + box.width <= width + 1);
      for (const label of labels) {
        const button = await footer.getByRole('button', { name: label, exact: true }).boundingBox();
        assert(button.y >= box.y && button.y + button.height <= box.y + box.height + 1);
        assert(button.x >= box.x && button.x + button.width <= box.x + box.width + 1);
      }
      if (process.env.ANTC_SCREENSHOT_DIR && [1024, 1440].includes(width)) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `actions-${width}.png`) });
    }
    const workspace = page.locator('umb-workspace-split-view');
    for (let index = 0; index < 3; index++) {
      await workspace.locator('a[role=tab][href$="/view/content"]').click();
      await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).click();
    }
    await save.waitFor();
    assert.deepEqual(writes, []);
    console.log('Native action aliases, disabled states, keyboard, title sync, schedule guard and four widths passed');

    if (write) {
      const previewSummary = `Bản xem trước được lưu qua nút gốc ở đầu bài. ${Date.now()}`;
      const anonymous = await browser.newContext();
      await page.setViewportSize({ width: 1440, height: 1100 });
      const setValues = values => editor.evaluate(async (element, values) => {
        const { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT } = await import('@umbraco-cms/backoffice/document');
        const dataset = await element.getContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT);
        for (const [alias, value] of Object.entries(values)) dataset.setPropertyValue(alias, value);
      }, values);
      // Establish a published baseline so every run checks both pending changes
      // and a fully unpublished draft, regardless of the fixture's initial state.
      await setValues({ summary: `Bản công khai trước khi sửa ${Date.now()}`,
        image: [{ key: crypto.randomUUID(), mediaKey: 'd2aa41d7-969b-5bcf-9465-283081375b20', crops: [] }], imageAlt: 'Ảnh minh họa tài chính' });
      const baselinePublished = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}/update-and-publish`) && r.ok());
      await publish.click();
      await baselinePublished;
      await openPublication();
      await publication.getByRole('link', { name: 'Mở bài đã xuất bản (tab mới)', exact: true }).waitFor();
      const publicBefore = await anonymous.request.get(`${base}/api/v1/articles/${id}`);
      assert(publicBefore.ok());
      const publishedBefore = await publicBefore.json();
      // Luu nhap van hoat dong khi cac truong tuy chon de trong.
      await setValues({ summary: '', image: null, imageAlt: '' });
      const saved = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}`) && r.ok());
      await save.click();
      await saved;
      await publication.getByText('Đang xem dữ liệu đã lưu.', { exact: true }).waitFor();
      assert(await publish.isEnabled());
      assert(await footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true }).isEnabled());

      // Name validation belongs to Umbraco, even with incomplete draft content.
      await name.fill('');
      const beforeValidation = writes.length;
      await save.click();
      await footer.locator('uui-button[data-mark="workspace-action:Umb.WorkspaceAction.Document.Save"][state="failed"]').waitFor();
      assert.equal(writes.length, beforeValidation, 'Empty name must fail mandatory validation before a document write');
      await name.fill(originalName);
      await setValues({ summary: previewSummary,
        image: [{ key: crypto.randomUUID(), mediaKey: 'd2aa41d7-969b-5bcf-9465-283081375b20', crops: [] }], imageAlt: 'Ảnh minh họa tài chính' });
      const previewSaved = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}`) && r.ok());
      const popupPromise = context.waitForEvent('page');
      await preview.click();
      await previewSaved;
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      console.log('Preview opened:', popup.url());
      assert(new URL(popup.url()).origin === new URL(base).origin);
      await popup.frameLocator('iframe').getByText(previewSummary, { exact: true }).waitFor();
      const frameUrl = await popup.locator('iframe').getAttribute('src');
      const previewResponse = await context.request.get(new URL(frameUrl, base).href);
      assert(previewResponse.headers()['cache-control'].includes('no-store'));
      assert(previewResponse.headers()['x-robots-tag'].includes('noindex'));
      assert((await previewResponse.text()).includes(previewSummary));
      const publicAfter = await anonymous.request.get(`${base}/api/v1/articles/${id}`);
      assert.equal(publicAfter.status(), publicBefore.status());
      if (publishedBefore) {
        assert.equal((await publicAfter.json()).summary, publishedBefore.summary);
        const anonymousPage = await anonymous.request.get(new URL(publishedBefore.url, base).href + '?umbPreview=true');
        assert(!(await anonymousPage.text()).includes(previewSummary));
      }
      if (process.env.ANTC_SCREENSHOT_DIR) await popup.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'native-draft-preview.png') });
      await popup.close();
      await publication.getByText('Đang xem dữ liệu đã lưu.', { exact: true }).waitFor();
      assert(!(await publish.isDisabled()));
      const published = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${id}/update-and-publish`) && r.ok());
      await publish.click();
      await published;
      await openPublication();
      await publication.getByRole('link', { name: 'Mở bài đã xuất bản (tab mới)', exact: true }).waitFor();
      const publishedUrl = await publication.getByRole('link', { name: 'Mở bài đã xuất bản (tab mới)', exact: true }).getAttribute('href');
      await footer.locator('umb-workspace-action-menu #popover-trigger').last().click();
      await page.getByText('Lập lịch xuất bản', { exact: true }).filter({ visible: true }).click();
      const modal = page.locator('umb-document-schedule-modal');
      await modal.waitFor();
      const beforeCancel = writes.length;
      await modal.getByRole('button', { name: /Đóng|Close/i }).click();
      await modal.waitFor({ state: 'detached' });
      assert.equal(writes.length, beforeCancel);
      await page.reload();
      await summary.waitFor();
      assert.equal(await summary.inputValue(), previewSummary);
      // An unpublished draft must also render in authenticated
      // preview, while its API remains 404 for anonymous visitors.
      await editor.evaluate(async (element, id) => {
        const { DocumentService } = await import('@umbraco-cms/backoffice/external/backend-api');
        const result = await DocumentService.putDocumentByIdUnpublish({ path: { id }, body: { cultures: null } });
        if (result.response.status !== 200) throw Error('Unpublish failed');
      }, id);
      await page.reload();
      await summary.waitFor();
      const draftSummary = `Bản nháp chưa công khai ${Date.now()}`;
      await summary.fill(draftSummary);
      const draftPopupPromise = context.waitForEvent('page');
      await preview.click();
      const draftPopup = await draftPopupPromise;
      await draftPopup.frameLocator('iframe').getByText(draftSummary, { exact: true }).waitFor();
      assert.equal((await anonymous.request.get(`${base}/api/v1/articles/${id}`)).status(), 404);
      const anonymousDraft = await anonymous.request.get(publishedUrl + '?umbPreview=true');
      assert.equal(anonymousDraft.status(), 404);
      assert(!(await anonymousDraft.text()).includes(draftSummary));
      await draftPopup.close();
      await anonymous.close();
      console.log('Native footer Save, required validation, Preview, Publish and schedule cancellation passed');
      console.log('Unique saved draft visible in preview, no-store/noindex headers, public API/HTML isolation and unpublished preview passed');
    } else {
      await page.reload();
      await summary.waitFor();
      assert.equal(await summary.inputValue(), originalSummary);
      assert.equal(await name.inputValue(), originalName);
      assert.deepEqual(writes, []);
      const parent = await editor.evaluate(async (element, id) => {
        const { UmbDocumentItemRepository } = await import('@umbraco-cms/backoffice/document');
        const repository = new UmbDocumentItemRepository(element);
        try { return (await repository.requestItems([id])).data[0].parent.unique; } finally { repository.destroy(); }
      }, id);
      await page.goto(`${base}/umbraco/section/content/workspace/document/create/parent/document/${parent}/3f9aac4c-9214-408f-8bb9-bedd2f37319b`);
      await save.waitFor();
      assert.equal(await footer.locator('uui-button[data-mark^="workspace-action:"]').count(), 3);
      assert(await publish.isEnabled());
      assert.deepEqual(writes, []);
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ write, labels, writes, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
