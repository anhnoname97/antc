// Chi doc: xem cung app lich su goc trong Soan bai va Thong tin, khong hoan tac.
const h = require('./article-acceptance.helpers.cjs');
const path = require('node:path');

(async () => {
  const browser = await h.launch();
  let page;
  try {
    const session = await h.login(browser);
    page = session.page;
    const writes = [];
    const historyRequests = [];
    await page.route('**/umbraco/management/api/**', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (/\/document(?:\/|$)/.test(url.pathname) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        writes.push(`${request.method()} ${url.pathname}`);
        return route.abort();
      }
      if (url.pathname.endsWith('/audit-log')) historyRequests.push(url.pathname);
      return route.continue();
    });
    const editor = await h.openArticle(page);
    const saved = await h.readDocument(page);
    const summary = editor.locator('#summary textarea');
    const original = await summary.inputValue();
    const historyTab = editor.getByRole('tab', { name: 'Lịch sử', exact: true });
    const history = editor.locator('#compose-panel-history umb-content-audit-log-workspace-info-app');
    h.assert.equal(await editor.getByRole('tab').count(), 4);
    h.assert.equal(await history.count(), 0, 'History app loads on first opening');
    await summary.fill('Nội dung chưa lưu khi xem lịch sử.');
    await historyTab.click();
    await history.locator('umb-history-item').first().waitFor();
    await page.waitForLoadState('networkidle');
    h.assert.equal(await editor.locator('#compose-panel-history umb-extension-slot[type=workspaceInfoApp]').count(), 1);
    h.assert.equal(await editor.locator('#compose-panel-history umb-workspace-info-app-layout').count(), 1);
    const records = await history.evaluate(el => structuredClone(el._items));
    h.assert(records.length > 0);
    const readItems = locator => locator.locator('umb-history-item').evaluateAll(items => items.map(item => ({ name: item.name, detail: item.detail, text: item.innerText })));
    const visibleRecords = await readItems(history);
    const rollback = history.getByRole('button', { name: 'Hoàn tác', exact: true });
    await rollback.waitFor();
    await rollback.click();
    const modal = page.locator('umb-content-rollback-modal');
    await modal.waitFor();
    await modal.getByRole('button', { name: /^(Hủy|Huỷ|Cancel)$/, exact: true }).click();
    await modal.waitFor({ state: 'detached' });
    h.assert.deepEqual(writes, []);
    await editor.getByRole('tab', { name: 'Bài viết', exact: true }).click();
    h.assert.equal(await summary.inputValue(), 'Nội dung chưa lưu khi xem lịch sử.');
    await historyTab.click();
    h.assert.deepEqual(await history.evaluate(el => structuredClone(el._items)), records);
    const pagination = history.locator('uui-pagination');
    if (await pagination.count()) {
      const nextPage = page.waitForResponse(response => response.url().includes('/audit-log') && new URL(response.url()).searchParams.get('skip') === '10');
      await pagination.getByRole('button', { name: 'Tiếp theo', exact: true }).click();
      await nextPage;
      await page.waitForLoadState('networkidle');
      h.assert.equal(await pagination.evaluate(el => el.current), 2);
      h.assert.notDeepEqual(await history.evaluate(el => structuredClone(el._items)), records);
      await editor.getByRole('tab', { name: 'Bài viết', exact: true }).click();
      await historyTab.click();
      h.assert.equal(await pagination.evaluate(el => el.current), 2);
      const firstPage = page.waitForResponse(response => response.url().includes('/audit-log') && new URL(response.url()).searchParams.get('skip') === '0' && new URL(response.url()).searchParams.get('take') === '10');
      await pagination.getByRole('button', { name: 'Đầu tiên', exact: true }).click();
      await firstPage;
      await page.waitForLoadState('networkidle');
      h.assert.deepEqual(await history.evaluate(el => structuredClone(el._items)), records);
      console.log('Native pagination changes pages, survives tab switches and returns to page one');
    }

    const workspace = page.locator('umb-workspace-split-view');
    await workspace.getByRole('tab', { name: 'Thông tin', exact: true }).click();
    const originalHistory = page.locator('umb-document-workspace-view-info umb-content-audit-log-workspace-info-app');
    await originalHistory.locator('umb-history-item').first().waitFor();
    await page.waitForLoadState('networkidle');
    h.assert.deepEqual(await originalHistory.evaluate(el => structuredClone(el._items)), records);
    h.assert.deepEqual(await readItems(originalHistory), visibleRecords);
    await originalHistory.getByRole('button', { name: 'Hoàn tác', exact: true }).waitFor();
    await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).click();
    await summary.waitFor();
    h.assert.equal(await summary.inputValue(), 'Nội dung chưa lưu khi xem lịch sử.');
    console.log('Compose and Info show the same native history; rollback opens/cancels without writes; unsaved summary survives');

    if (process.env.ANTC_SCREENSHOT_DIR) h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
    const layouts = [];
    await historyTab.click();
    await history.locator('umb-history-item').first().waitFor();
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await editor.evaluate(async el => { await el.updateComplete; await new Promise(resolve => requestAnimationFrame(resolve)); });
      h.assert(!(await editor.evaluate(el => el.shadowRoot.querySelector('.scroll-area').scrollWidth > el.clientWidth + 1)));
      h.assert.equal(await editor.getByRole('tabpanel').count(), 1);
      h.assert.equal(await h.footer(page).locator('uui-button[data-mark^="workspace-action:"]').count(), 3);
      if (process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `history-${width}.png`) });
      layouts.push(width);
    }
    await page.reload();
    await summary.waitFor();
    h.assert.equal(await summary.inputValue(), original);
    h.assert.deepEqual((await h.readDocument(page)).values, saved.values);
    const item = await h.api(page, 'DocumentService', 'getItemDocument', { query: { id: [h.fixtureId] } });
    await page.goto(`${h.base}/umbraco/section/content/workspace/document/create/parent/document/${item.data[0].parent.id}/${h.articleType}`);
    await summary.waitFor();
    const before = historyRequests.length;
    await historyTab.click();
    await editor.getByText('Chưa có lịch sử. Lưu nháp để tạo bài viết.', { exact: true }).waitFor();
    h.assert.equal(await history.count(), 0);
    h.assert.equal(historyRequests.length, before, 'Unsaved article does not request audit logs');
    if (process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'history-new.png') });
    h.assert.deepEqual(writes, []);
    h.assert.deepEqual(session.errors, []);
    console.log(JSON.stringify({ layouts, sameNativeHistory: true, newArticle: true, writes, errors: session.errors }, null, 2));
  } catch (error) {
    if (page && process.env.ANTC_SCREENSHOT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'history-failure.png') }).catch(() => {});
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
