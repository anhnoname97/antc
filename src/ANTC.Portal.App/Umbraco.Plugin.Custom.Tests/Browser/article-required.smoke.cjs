// Kiem required goc va xuat ban khong anh/SEO. Chi ghi tren ban sao co marker.
const h = require('./article-acceptance.helpers.cjs');
const { randomUUID } = require('node:crypto');
const path = require('node:path');

(async () => {
  const browser = await h.launch();
  let page;
  try {
    await h.isolated(browser);
    const session = await h.login(browser);
    page = session.page;
    const fixture = await h.readDocument(page);
    const item = await h.api(page, 'DocumentService', 'getItemDocument', { query: { id: [h.fixtureId] } });
    const id = randomUUID();
    const empty = h.updateBody(fixture, { summary: '', updatedDate: null, image: [], imageAlt: '', seoTitle: '', seoDescription: '', ogImage: [] });
    const created = await h.api(page, 'DocumentService', 'postDocument', { body: {
      ...empty, id, parent: { id: item.data[0].parent.id }, documentType: { id: h.articleType },
      variants: [{ culture: null, segment: null, name: `Kiểm required ${id.slice(0, 8)}` }],
    } });
    h.assert.equal(created.status, 201, JSON.stringify(created));
    const editor = await h.openArticle(page, id);
    const footer = h.footer(page);
    const publish = footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true });
    h.assert.equal(await editor.locator('aside .side-card').count(), 2);
    h.assert.equal(await editor.locator('.checklist-card, progress').count(), 0);
    h.assert.equal(await footer.locator('[data-mark="workspace-action:Umb.WorkspaceAction.Document.SaveAndPublish"]').count(), 1);
    h.assert(await publish.isEnabled());
    const anonymous = await browser.newContext();
    const updateAndPublish = async values => {
      const document = await h.readDocument(page, id);
      return h.api(page, 'DocumentService', 'putDocumentByIdUpdateAndPublish', { path: { id }, body: {
        ...h.updateBody(document, values), culturesToPublish: [],
      } });
    };
    const validate = async values => h.api(page, 'DocumentService', 'putDocumentByIdValidate', { path: { id }, body: {
      ...h.updateBody(await h.readDocument(page, id), values), cultures: null,
    } });
    const missing = await validate({ summary: '', updatedDate: null });
    h.assert([400, 422].includes(missing.status), JSON.stringify(missing));
    h.assert.equal((await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).status(), 404);
    console.log('Native API blocks missing required summary/date; incomplete draft remains saved');

    const summary = editor.locator('#summary textarea');
    await summary.fill('Bài kiểm tra chỉ yêu cầu các trường bắt buộc.');
    const attempted = page.waitForResponse(response => response.request().method() === 'PUT' && response.url().includes(`/document/${id}/validate`));
    await publish.click();
    await attempted;
    await editor.locator('[role=tab][data-tab=source][aria-selected=true]').waitFor();
    await editor.getByText('Vui lòng nhập ngày cập nhật.', { exact: true }).waitFor();
    await editor.locator('[data-tab=source] .tab-error').waitFor();
    const date = editor.locator('[alias=updatedDate] input[type=date]');
    await date.waitFor();
    await page.waitForFunction(el => el === el.getRootNode().activeElement, await date.elementHandle());
    h.assert.equal((await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).status(), 404);
    await footer.locator('uui-button[state=failed]').waitFor();
    await date.fill('2026-10-31');
    await date.press('Tab');
    const published = page.waitForResponse(response => response.request().method() === 'PUT' && response.url().includes(`/document/${id}/update-and-publish`) && response.ok());
    await publish.click();
    await published;
    const publicResponse = await anonymous.request.get(`${h.base}/api/v1/articles/${id}`);
    h.assert.equal(publicResponse.status(), 200);
    const article = await publicResponse.json();
    h.assert.equal(article.summary, 'Bài kiểm tra chỉ yêu cầu các trường bắt buộc.');
    const persisted = await h.readDocument(page, id);
    for (const alias of ['imageAlt', 'seoTitle', 'seoDescription']) h.assert(!persisted.values.find(value => value.alias === alias)?.value);
    h.assert.equal(persisted.values.find(value => value.alias === 'image')?.value?.length ?? 0, 0);
    console.log('Native UI reveals/focuses required date; publication succeeds with no image, alt or SEO');

    const noSummary = await validate({ summary: '' });
    h.assert([400, 422].includes(noSummary.status), JSON.stringify(noSummary));
    const restored = await updateAndPublish({ summary: 'Bài kiểm tra chỉ yêu cầu các trường bắt buộc.' });
    h.assert.equal(restored.status, 200, JSON.stringify(restored));
    h.assert.equal((await h.api(page, 'DocumentService', 'putDocumentByIdUnpublish', { path: { id }, body: { cultures: null } })).status, 200);
    const future = new Date(Date.now() + 86400000).toISOString().replace('Z', '');
    const scheduled = await h.api(page, 'DocumentService', 'putDocumentByIdPublish', { path: { id }, body: {
      publishSchedules: [{ culture: null, schedule: { publishTime: future, unpublishTime: null } }],
    } });
    h.assert.equal(scheduled.status, 200, JSON.stringify(scheduled));
    h.assert((await h.readDocument(page, id)).variants[0].scheduledPublishDate);
    h.assert.equal((await h.api(page, 'DocumentService', 'putDocumentByIdPublish', { path: { id }, body: {
      publishSchedules: [{ culture: null, schedule: { publishTime: null, unpublishTime: null } }],
    } })).status, 200);
    h.assert.equal((await h.readDocument(page, id)).variants[0].scheduledPublishDate, null);
    console.log('Native required summary remains enforced; scheduling without image/SEO and cancellation succeed');
    await page.reload();
    await summary.waitFor();
    if (process.env.ANTC_SCREENSHOT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'native-required-published.png') });
    }
    h.assert.deepEqual(session.errors, []);
    await anonymous.close();
  } catch (error) {
    if (page && process.env.ANTC_SCREENSHOT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'native-required-failure.png') }).catch(() => {});
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
