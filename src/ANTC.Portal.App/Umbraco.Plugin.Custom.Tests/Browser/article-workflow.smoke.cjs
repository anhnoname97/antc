const h = require('./article-acceptance.helpers.cjs');
const { randomUUID } = require('node:crypto');
const path = require('node:path');

(async () => {
  const browser = await h.launch();
  let session;
  try {
    await h.isolated(browser);
    session = await h.login(browser);
    const { page } = session;
    const anonymous = await browser.newContext();
    const fixtureItem = await h.api(page, 'DocumentService', 'getItemDocument', { query: { id: [h.fixtureId] } });
    const parent = fixtureItem.data[0].parent.id;
    const token = randomUUID().slice(0, 8);
    await page.goto(`${h.base}/umbraco/section/content/workspace/document/create/parent/document/${parent}/${h.articleType}`);
    const editor = page.locator('antc-article-editor');
    const summary = editor.locator('#summary textarea');
    const name = page.locator('umb-document-workspace-split-view-variant-selector uui-input input');
    const footer = h.footer(page);
    const publication = editor.locator('antc-article-publication-info');
    const openDetails = async () => { if (!(await publication.locator('details').evaluate(e => e.open))) await publication.locator('summary').click(); };
    const save = footer.getByRole('button', { name: 'Lưu', exact: true });
    const publish = footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true });
    const preview = footer.getByRole('button', { name: 'Lưu và xem trước', exact: true });
    await summary.waitFor();
    await name.fill(`Bài mới kiểm bước 10 ${token}`);
    await summary.fill(`Tóm tắt bài mới ${token}`);
    await editor.locator('#body [contenteditable=true]').fill(`Nội dung mới từ trình soạn ${token}.`);
    await h.setValues(editor, { image: [{ key: randomUUID(), mediaKey: h.mediaId, crops: [] }], imageAlt: `Ảnh bài mới ${token}` });
    const created = page.waitForResponse(response => response.request().method() === 'POST' && /\/document$/.test(new URL(response.url()).pathname));
    await save.click();
    const createdResponse = await created;
    h.assert.equal(createdResponse.status(), 201);
    const id = createdResponse.headers().location.split('/').at(-1);
    await page.waitForURL(url => url.pathname.includes(`/edit/${id}`));
    await page.reload();
    await summary.waitFor();
    h.assert.equal(await summary.inputValue(), `Tóm tắt bài mới ${token}`);
    h.assert((await editor.locator('#body [contenteditable=true]').innerText()).includes(token));
    h.assert.equal((await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).status(), 404);
    console.log(`Created through native UI, reloaded rich text, draft API 404: ${id}`);

    const previewSummary = `Bản nháp xem trước ${token}`;
    await summary.fill(previewSummary);
    const popupPromise = session.context.waitForEvent('page');
    await preview.click();
    const popup = await popupPromise;
    await popup.frameLocator('iframe').getByText(previewSummary, { exact: true }).waitFor();
    await popup.close();
    h.assert.equal((await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).status(), 404);
    // Kiem truong bat buoc bang luong xuat ban native.
    const invalidDraftSave = page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname.endsWith(`/document/${id}`));
    await publish.click();
    await editor.getByText('Vui lòng nhập ngày cập nhật.', { exact: true }).waitFor();
    h.assert.equal((await invalidDraftSave).status(), 200, 'Native validation may save a draft, but must not publish it');
    await footer.locator('uui-button[state=failed]').waitFor();
    h.assert.equal((await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).status(), 404);
    await editor.locator('umb-content-workspace-property[alias=updatedDate] input[type=date]').fill('2026-10-31');
    await editor.locator('umb-content-workspace-property[alias=updatedDate] input[type=date]').press('Tab');
    await publication.getByText('Có thay đổi chưa lưu.', { exact: true }).waitFor();
    console.log('Native mandatory validation blocked publishing and focused the missing update date');
    const published = page.waitForResponse(response => response.request().method() === 'PUT' && (response.url().includes(`/document/${id}/update-and-publish`) || new URL(response.url()).pathname.endsWith(`/document/${id}/publish`)));
    await publish.click();
    h.assert.equal((await published).status(), 200);
    await openDetails();
    const link = publication.getByRole('link', { name: 'Mở bài đã xuất bản (tab mới)', exact: true });
    await link.waitFor();
    const publicUrl = await link.getAttribute('href');
    h.assert.equal((await (await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).json()).summary, previewSummary);
    h.assert((await (await anonymous.request.get(publicUrl)).text()).includes(previewSummary));
    await editor.getByRole('tab', { name: 'Bài viết', exact: true }).click();
    await summary.fill(`Sửa sau xuất bản ${token}`);
    let saved = page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname.endsWith(`/document/${id}`));
    await save.click();
    h.assert.equal((await saved).status(), 200);
    h.assert.equal((await (await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).json()).summary, previewSummary);
    console.log('Preview saved new draft; publish works; later draft save leaves public version unchanged');

    // A failed save must preserve both the typed draft and the persisted version.
    const typed = `Chưa lưu vì lỗi mạng ${token}`;
    await summary.fill(typed);
    const persisted = (await h.readDocument(page, id)).values.find(value => value.alias === 'summary').value;
    const failSave = route => route.request().method() === 'PUT' && new URL(route.request().url()).pathname.endsWith(`/document/${id}`)
      ? route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ status: 503, title: 'Lưu tạm thời không khả dụng (kiểm thử).' }) })
      : route.fallback();
    await page.route('**/umbraco/management/api/**', failSave);
    const failed = page.waitForResponse(response => response.status() === 503);
    await save.click();
    await failed;
    await footer.locator('uui-button[data-mark="workspace-action:Umb.WorkspaceAction.Document.Save"][state="failed"]').waitFor();
    h.assert.equal(await summary.inputValue(), typed);
    await publication.getByText('Có thay đổi chưa lưu.', { exact: true }).waitFor();
    h.assert.equal((await h.readDocument(page, id)).values.find(value => value.alias === 'summary').value, persisted);
    await page.unroute('**/umbraco/management/api/**', failSave);
    saved = page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname.endsWith(`/document/${id}`));
    await save.click();
    h.assert.equal((await saved).status(), 200);
    console.log('503 save failure retained editor text, dirty state and server data; retry succeeded');

    await footer.locator('umb-workspace-action-menu #popover-trigger').last().click();
    await page.getByText('Lập lịch xuất bản', { exact: true }).filter({ visible: true }).click();
    const modal = page.locator('umb-document-schedule-modal');
    await modal.waitFor();
    const future = await page.evaluate(() => {
      const local = offset => { const d = new Date(Date.now() + offset); const pad = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
      return [local(86400000), local(172800000)];
    });
    const dates = modal.locator('input[type="datetime-local"]');
    await dates.nth(0).fill(future[0]);
    await dates.nth(1).fill(future[1]);
    const scheduled = page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname.endsWith(`/document/${id}/publish`));
    await modal.getByRole('button', { name: 'Lập lịch xuất bản', exact: true }).click();
    h.assert.equal((await scheduled).status(), 200);
    let document = await h.readDocument(page, id);
    h.assert(document.variants[0].scheduledPublishDate && document.variants[0].scheduledUnpublishDate);
    h.assert.equal((await h.api(page, 'DocumentService', 'putDocumentByIdPublish', { path: { id }, body: {
      publishSchedules: [{ culture: null, schedule: { publishTime: null, unpublishTime: null } }],
    } })).status, 200);
    document = await h.readDocument(page, id);
    h.assert.equal(document.variants[0].scheduledPublishDate, null);
    h.assert.equal(document.variants[0].scheduledUnpublishDate, null);
    h.assert.equal((await h.api(page, 'DocumentService', 'putDocumentByIdUnpublish', { path: { id }, body: { cultures: null } })).status, 200);
    h.assert.equal((await anonymous.request.get(`${h.base}/api/v1/articles/${id}`)).status(), 404);
    console.log('Native schedule saved both dates; cancellation cleared both; unpublish removes public article');

    // New category + new article, neither ever published.
    const parentItem = await h.api(page, 'DocumentService', 'getItemDocument', { query: { id: [parent] } });
    const categoryId = randomUUID();
    const draftId = randomUUID();
    let result = await h.api(page, 'DocumentService', 'postDocument', { body: { id: categoryId,
      parent: { id: parentItem.data[0].parent.id }, documentType: { id: 'a911dd8b-1385-449b-b00d-d91e17f56472' }, template: null,
      variants: [{ culture: null, segment: null, name: `Chuyên mục nháp ${token}` }], values: [],
    } });
    h.assert.equal(result.status, 201, result.error?.title);
    result = await h.api(page, 'DocumentService', 'postDocument', { body: { id: draftId, parent: { id: categoryId },
      documentType: { id: h.articleType }, template: (await h.readDocument(page, id)).template,
      variants: [{ culture: null, segment: null, name: `Bài trong chuyên mục nháp ${token}` }],
      values: [{ alias: 'summary', culture: null, segment: null, value: `Nội dung trong cha chưa xuất bản ${token}` }],
    } });
    h.assert.equal(result.status, 201, result.error?.title);
    await h.openArticle(page, draftId);
    const draftPopupPromise = session.context.waitForEvent('page');
    await preview.click();
    const draftPopup = await draftPopupPromise;
    await draftPopup.frameLocator('iframe').getByText(`Nội dung trong cha chưa xuất bản ${token}`, { exact: true }).waitFor();
    h.assert.equal((await anonymous.request.get(`${h.base}/api/v1/articles/${draftId}`)).status(), 404);
    const draftPublicUrl = await draftPopup.frameLocator('iframe').locator('meta[property="og:url"]').getAttribute('content');
    h.assert.equal((await anonymous.request.get(draftPublicUrl)).status(), 404, 'Anonymous HTML cannot expose the preview draft');
    if (process.env.ANTC_REPORT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_REPORT_DIR, { recursive: true });
      await draftPopup.screenshot({ path: path.join(process.env.ANTC_REPORT_DIR, 'preview-draft-parent.png') });
      h.fs.writeFileSync(path.join(process.env.ANTC_REPORT_DIR, 'workflow.json'), JSON.stringify({ id, categoryId, draftId, publicUrl, errors: session.errors }, null, 2));
    }
    await draftPopup.close();
    h.assert.deepEqual(session.errors, []);
    console.log('Preview under never-published category passed; anonymous API remains 404');
    await anonymous.close();
  } catch (error) {
    if (session && process.env.ANTC_REPORT_DIR) {
      await session.page.screenshot({ path: path.join(process.env.ANTC_REPORT_DIR, 'workflow-failure.png') }).catch(() => {});
      console.log(await session.page.locator('body').innerText());
      console.log('Page errors:', session.errors);
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
