// Chi doc: thay Content rieng article, kiem route cu va cac workspace khac.
const h = require('./article-acceptance.helpers.cjs');
const path = require('node:path');

(async () => {
  const browser = await h.launch();
  let page;
  try {
    const session = await h.login(browser);
    page = session.page;
    const writes = [];
    await page.route('**/umbraco/management/api/**', route => {
      const request = route.request();
      if (/\/document(?:\/|$)/.test(new URL(request.url()).pathname) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    const editor = await h.openArticle(page);
    const saved = await h.readDocument(page);
    const workspace = page.locator('umb-workspace-split-view');
    const checkArticle = async () => {
      await editor.locator('#summary textarea').waitFor();
      h.assert.equal(await workspace.getByRole('tab', { name: 'Nội dung', exact: true }).count(), 0);
      h.assert(await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).isVisible());
      h.assert(await workspace.getByRole('tab', { name: 'Thông tin', exact: true }).isVisible());
      h.assert.equal(await editor.getByRole('tab').count(), 4);
      h.assert.equal(await h.footer(page).locator('uui-button[data-mark^="workspace-action:"]').count(), 3);
    };
    await checkArticle();
    const summary = editor.locator('#summary textarea');
    await summary.fill('Giữ giá trị khi chỉ dùng Soạn bài.');
    await workspace.getByRole('tab', { name: 'Thông tin', exact: true }).click();
    await page.locator('umb-document-workspace-view-info').waitFor();
    await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).click();
    await checkArticle();
    h.assert.equal(await summary.inputValue(), 'Giữ giá trị khi chỉ dùng Soạn bài.');
    await page.reload();
    await checkArticle();
    h.assert.deepEqual((await h.readDocument(page)).values, saved.values);
    // Link cu vao Content phai van mo duoc man soan.
    await page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${h.fixtureId}/invariant/view/content`);
    await checkArticle();
    console.log('Article has only Compose/Info; old Content URL opens Compose and unsaved values survive Info');
    const item = await h.api(page, 'DocumentService', 'getItemDocument', { query: { id: [h.fixtureId] } });
    const parent = item.data[0].parent.id;
    await page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${parent}`);
    await workspace.getByRole('tab', { name: 'Nội dung', exact: true }).waitFor();
    h.assert.equal(await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).count(), 0);
    await workspace.getByRole('tab', { name: 'Nội dung', exact: true }).click();
    await page.locator('umb-content-workspace-view-edit').waitFor();
    await page.goto(`${h.base}/umbraco/section/content/workspace/document/create/parent/document/${parent}/${h.articleType}`);
    await checkArticle();
    h.assert.equal(await summary.inputValue(), '');
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      h.assert(!(await editor.evaluate(el => el.shadowRoot.querySelector('.scroll-area').scrollWidth > el.clientWidth + 1)));
      if (process.env.ANTC_SCREENSHOT_DIR) {
        h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `single-view-${width}.png`) });
      }
    }
    await page.goto(`${h.base}/umbraco/section/media`);
    await page.getByRole('heading', { name: 'Phương tiện', exact: true }).first().waitFor();
    h.assert.equal(await page.locator('antc-article-editor').count(), 0);
    h.assert.deepEqual(writes, []);
    h.assert.deepEqual(session.errors, []);
    console.log(JSON.stringify({ newArticle: true, categoryContentUnchanged: true, mediaUnchanged: true, writes, errors: session.errors }, null, 2));
  } catch (error) {
    if (page && process.env.ANTC_SCREENSHOT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'single-view-failure.png') }).catch(() => {});
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
